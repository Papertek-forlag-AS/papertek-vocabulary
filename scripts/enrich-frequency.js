/**
 * Enrich all languages with frequency rankings from corpus data.
 *
 * Frequency lists from OpenSubtitles (hermitdave/FrequencyWords).
 * Value stored = rank position in 50k list (lower = more common).
 *
 * Matching strategy:
 *   1. Exact match (lowercase)
 *   2. Accent-stripped match (é→e, ü→u, etc.)
 *   3. For NB/NN: try both no_50k.txt forms
 *
 * Usage:
 *   node scripts/enrich-frequency.js [--dry-run] [language...]
 *   node scripts/enrich-frequency.js de es fr en nb nn
 */

import fs from 'fs';
import path from 'path';

const FREQ_FILES = {
  de: 'vocabulary/dictionary/frequency/de_50k.txt',
  es: 'vocabulary/dictionary/frequency/es_50k.txt',
  fr: 'vocabulary/dictionary/frequency/fr_50k.txt',
  en: 'vocabulary/dictionary/frequency/en_50k.txt',
  nb: 'vocabulary/dictionary/frequency/no_50k.txt',
  nn: 'vocabulary/dictionary/frequency/no_50k.txt', // NB and NN share Norwegian corpus
};

function loadFrequencyMap(filePath) {
  if (!fs.existsSync(filePath)) return null;
  const lines = fs.readFileSync(filePath, 'utf8').trim().split('\n');
  const map = {};
  lines.forEach((line, i) => {
    const spaceIdx = line.lastIndexOf(' ');
    const word = line.substring(0, spaceIdx).toLowerCase();
    map[word] = i + 1;
  });
  return map;
}

function normalize(word) {
  return word.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

function lookupFrequency(freqMap, word) {
  if (!freqMap) return null;
  const lower = word.toLowerCase();

  // Exact match
  if (freqMap[lower]) return freqMap[lower];

  // Accent-stripped
  const norm = normalize(word);
  if (norm !== lower && freqMap[norm]) return freqMap[norm];

  // Try without trailing reflexive (sich/se/s')
  // German: "sich waschen" → try "waschen"
  if (lower.startsWith('sich ')) {
    const base = lower.slice(5);
    if (freqMap[base]) return freqMap[base];
  }

  // Spanish reflexive: "acostarse" → try "acostar"
  if (lower.endsWith('se') && lower.length > 4) {
    const base = lower.slice(0, -2);
    if (freqMap[base]) return freqMap[base];
    if (freqMap[base + 'r']) return freqMap[base + 'r'];
  }

  // Try first word of multi-word expressions
  const firstWord = lower.split(/[\s,]/)[0];
  if (firstWord !== lower && firstWord.length > 2 && freqMap[firstWord]) {
    return freqMap[firstWord];
  }

  return null;
}

// --- Main ---

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const languages = args.filter(a => !a.startsWith('--'));

if (languages.length === 0) {
  console.log('Usage: node scripts/enrich-frequency.js [--dry-run] <language...>');
  process.exit(0);
}

if (dryRun) console.log('[DRY RUN]\n');

for (const lang of languages) {
  const freqFile = FREQ_FILES[lang];
  if (!freqFile) { console.log(`${lang}: no frequency file configured`); continue; }

  const freqMap = loadFrequencyMap(freqFile);
  if (!freqMap) { console.log(`${lang}: frequency file not found: ${freqFile}`); continue; }

  console.log(`\n=== ${lang.toUpperCase()} ===`);
  console.log(`Frequency list: ${Object.keys(freqMap).length} words from ${freqFile}`);

  const lexiconDir = `vocabulary/lexicon/${lang}`;
  let total = 0, alreadyHad = 0, matched = 0, missed = 0;

  const bankFiles = fs.readdirSync(lexiconDir).filter(f => f.endsWith('bank.json'));
  for (const bankFile of bankFiles) {
    const bankPath = path.join(lexiconDir, bankFile);
    const data = JSON.parse(fs.readFileSync(bankPath, 'utf8'));
    let modified = false;

    for (const [wordId, entry] of Object.entries(data)) {
      if (wordId === '_metadata') continue;
      total++;

      if (entry.frequency) { alreadyHad++; continue; }

      const rank = lookupFrequency(freqMap, entry.word);
      if (rank) {
        entry.frequency = rank;
        matched++;
        modified = true;
      } else {
        missed++;
      }
    }

    if (modified && !dryRun) {
      fs.writeFileSync(bankPath, JSON.stringify(data, null, 2) + '\n', 'utf8');
    }
  }

  const coverage = ((alreadyHad + matched) / total * 100).toFixed(0);
  console.log(`  Already had: ${alreadyHad}`);
  console.log(`  Newly matched: ${matched}`);
  console.log(`  No match: ${missed}`);
  console.log(`  Coverage: ${coverage}% (${alreadyHad + matched}/${total})`);
}
