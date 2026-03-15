/**
 * Enrich ES and FR lexicon entries with CEFR levels and frequency rankings.
 *
 * CEFR assignment strategy (in priority order):
 *   1. Link chain: ES/FR → NB → DE → inherit DE's CEFR level
 *   2. Frequency-based: map frequency rank to CEFR using DE's distribution
 *
 * Frequency: corpus rank from es_50k.txt / fr_50k.txt (lower = more common)
 *
 * Usage:
 *   node scripts/enrich-es-fr-metadata.js [--dry-run] [language...]
 *   node scripts/enrich-es-fr-metadata.js es fr      # both languages
 *   node scripts/enrich-es-fr-metadata.js --dry-run es
 */

import fs from 'fs';
import path from 'path';

// --- Load helpers ---

function loadFrequencyMap(filePath) {
  const lines = fs.readFileSync(filePath, 'utf8').trim().split('\n');
  const map = {};
  lines.forEach((line, i) => {
    const spaceIdx = line.lastIndexOf(' ');
    const word = line.substring(0, spaceIdx).toLowerCase();
    map[word] = i + 1; // 1-based rank
  });
  return map;
}

function loadLinkIndex(linkDir) {
  const index = {};
  if (!fs.existsSync(linkDir)) return index;
  for (const f of fs.readdirSync(linkDir).filter(f => f.endsWith('.json'))) {
    const data = JSON.parse(fs.readFileSync(path.join(linkDir, f), 'utf8'));
    for (const [k, v] of Object.entries(data)) {
      if (k !== '_metadata' && v.primary) index[k] = v.primary;
    }
  }
  return index;
}

function loadCefrMap(langDir) {
  const map = {};
  for (const f of fs.readdirSync(langDir).filter(f => f.endsWith('bank.json'))) {
    const data = JSON.parse(fs.readFileSync(path.join(langDir, f), 'utf8'));
    for (const [k, v] of Object.entries(data)) {
      if (k !== '_metadata' && v.cefr) map[k] = v.cefr;
    }
  }
  return map;
}

// Assign CEFR based on frequency rank when link chain doesn't resolve.
// Uses thresholds derived from DE's distribution:
//   A1 = most common words (rank 1-2000 in 50k list)
//   A2 = common words (rank 2001-6000)
//   B1 = intermediate words (rank 6001+)
function cefrFromFrequency(rank) {
  if (!rank) return 'B1'; // unknown frequency → default to B1
  if (rank <= 2000) return 'A1';
  if (rank <= 6000) return 'A2';
  return 'B1';
}

// --- Main ---

const LANGUAGES = {
  es: {
    freqFile: 'vocabulary/dictionary/frequency/es_50k.txt',
    lexiconDir: 'vocabulary/lexicon/es',
    linkToNb: 'vocabulary/lexicon/links/es-nb',
  },
  fr: {
    freqFile: 'vocabulary/dictionary/frequency/fr_50k.txt',
    lexiconDir: 'vocabulary/lexicon/fr',
    linkToNb: 'vocabulary/lexicon/links/fr-nb',
  },
};

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const languages = args.filter(a => !a.startsWith('--'));

if (languages.length === 0) {
  console.log('Usage: node scripts/enrich-es-fr-metadata.js [--dry-run] <es|fr...>');
  process.exit(0);
}

// Load shared data: NB→DE links, DE CEFR map
const nbDeLinks = loadLinkIndex('vocabulary/lexicon/links/nb-de');
const deCefr = loadCefrMap('vocabulary/lexicon/de');

if (dryRun) console.log('[DRY RUN]\n');

for (const lang of languages) {
  const config = LANGUAGES[lang];
  if (!config) {
    console.error(`Unknown language: ${lang}`);
    continue;
  }

  console.log(`\n=== ${lang.toUpperCase()} ===`);

  // Load frequency map
  const freqMap = loadFrequencyMap(config.freqFile);
  console.log(`Frequency list: ${Object.keys(freqMap).length} words`);

  // Load link chain: lang→NB→DE
  const langNbLinks = loadLinkIndex(config.linkToNb);

  // Process each bank file
  const bankFiles = fs.readdirSync(config.lexiconDir).filter(f => f.endsWith('bank.json'));
  const stats = {
    total: 0,
    cefrFromChain: 0,
    cefrFromFreq: 0,
    freqSet: 0,
    freqMissing: 0,
    alreadyHadCefr: 0,
    alreadyHadFreq: 0,
  };

  const cefrDist = { A1: 0, A2: 0, B1: 0 };

  for (const bankFile of bankFiles) {
    const bankPath = path.join(config.lexiconDir, bankFile);
    const data = JSON.parse(fs.readFileSync(bankPath, 'utf8'));
    let modified = false;

    for (const [wordId, entry] of Object.entries(data)) {
      if (wordId === '_metadata') continue;
      stats.total++;

      const word = entry.word?.toLowerCase();

      // --- Frequency ---
      if (entry.frequency) {
        stats.alreadyHadFreq++;
      } else if (word) {
        // Try exact match, then without accents
        let rank = freqMap[word];

        // Try normalized form (strip accents)
        if (!rank) {
          const normalized = word.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
          rank = freqMap[normalized];
        }

        if (rank) {
          entry.frequency = rank;
          stats.freqSet++;
          modified = true;
        } else {
          stats.freqMissing++;
        }
      }

      // --- CEFR ---
      if (entry.cefr) {
        stats.alreadyHadCefr++;
        cefrDist[entry.cefr] = (cefrDist[entry.cefr] || 0) + 1;
      } else {
        // Strategy 1: Link chain → NB → DE → CEFR
        const nbId = langNbLinks[wordId];
        const deId = nbId ? nbDeLinks[nbId] : null;
        const linkedCefr = deId ? deCefr[deId] : null;

        if (linkedCefr) {
          entry.cefr = linkedCefr;
          stats.cefrFromChain++;
          cefrDist[linkedCefr]++;
          modified = true;
        } else {
          // Strategy 2: Frequency-based assignment
          const rank = entry.frequency || freqMap[word];
          entry.cefr = cefrFromFrequency(rank);
          stats.cefrFromFreq++;
          cefrDist[entry.cefr]++;
          modified = true;
        }
      }
    }

    if (modified && !dryRun) {
      fs.writeFileSync(bankPath, JSON.stringify(data, null, 2) + '\n', 'utf8');
      console.log(`  Updated ${bankFile}`);
    }
  }

  console.log(`\nResults (${stats.total} entries):`);
  console.log(`  CEFR: ${stats.cefrFromChain} from link chain, ${stats.cefrFromFreq} from frequency, ${stats.alreadyHadCefr} already set`);
  console.log(`  Frequency: ${stats.freqSet} set, ${stats.freqMissing} not in corpus, ${stats.alreadyHadFreq} already set`);
  console.log(`  CEFR distribution: A1=${cefrDist.A1} A2=${cefrDist.A2} B1=${cefrDist.B1}`);
}
