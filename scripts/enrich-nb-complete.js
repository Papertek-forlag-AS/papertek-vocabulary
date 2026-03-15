/**
 * Complete NB enrichment:
 *   1. CEFR (via NB→DE chain + frequency fallback)
 *   2. Verb class for remaining verbs
 *   3. Explanations for remaining entries (generalbank types)
 *
 * Usage:
 *   node scripts/enrich-nb-complete.js [--dry-run]
 */

import fs from 'fs';
import path from 'path';

function loadLinkIndex(dir) {
  const index = {};
  if (!fs.existsSync(dir)) return index;
  for (const f of fs.readdirSync(dir).filter(f => f.endsWith('.json'))) {
    const data = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
    for (const [k, v] of Object.entries(data)) {
      if (k !== '_metadata' && v.primary) index[k] = v.primary;
    }
  }
  return index;
}

function loadCefrMap() {
  const map = {};
  for (const f of fs.readdirSync('vocabulary/lexicon/de').filter(f => f.endsWith('bank.json'))) {
    const data = JSON.parse(fs.readFileSync('vocabulary/lexicon/de/' + f, 'utf8'));
    for (const [k, v] of Object.entries(data)) {
      if (k !== '_metadata' && v.cefr) map[k] = v.cefr;
    }
  }
  return map;
}

function cefrFromFrequency(rank) {
  if (!rank) return 'B1';
  if (rank <= 2000) return 'A1';
  if (rank <= 6000) return 'A2';
  return 'B1';
}

function nbExplanation(entry) {
  const typeNames = {
    adv: 'adverb', prep: 'preposisjon', conj: 'konjunksjon',
    interj: 'interjeksjon', pron: 'pronomen', num: 'tallord',
    phrase: 'frase', expr: 'uttrykk', propn: 'egennavn',
    art: 'artikkel', interr: 'spørreord', contr: 'sammentrekning',
  };
  const typeName = typeNames[entry.type] || entry.type;
  return { _description: `Norsk ${typeName}: ${entry.word}.` };
}

// ========== MAIN ==========

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
if (dryRun) console.log('[DRY RUN]\n');

const nbDeLinks = loadLinkIndex('vocabulary/lexicon/links/nb-de');
const deCefr = loadCefrMap();

const stats = { cefr: 0, cefrChain: 0, cefrFreq: 0, verbClass: 0, explanation: 0 };

const bankFiles = fs.readdirSync('vocabulary/lexicon/nb').filter(f => f.endsWith('bank.json'));

for (const bankFile of bankFiles) {
  const bankPath = path.join('vocabulary/lexicon/nb', bankFile);
  const data = JSON.parse(fs.readFileSync(bankPath, 'utf8'));
  let modified = false;

  for (const [wordId, entry] of Object.entries(data)) {
    if (wordId === '_metadata') continue;

    // --- CEFR ---
    if (!entry.cefr) {
      const deId = nbDeLinks[wordId];
      const linkedCefr = deId ? deCefr[deId] : null;

      if (linkedCefr) {
        entry.cefr = linkedCefr;
        stats.cefrChain++;
      } else {
        entry.cefr = cefrFromFrequency(entry.frequency);
        stats.cefrFreq++;
      }
      stats.cefr++;
      modified = true;
    }

    // --- Verb class ---
    if (entry.type === 'verb' && entry.conjugations && !entry.verbClass) {
      // Determine from conjugation patterns
      const pret = entry.conjugations?.presens?.former?.preteritum;
      if (pret) {
        if (pret.endsWith('a') || pret.endsWith('et')) entry.verbClass = 'svak';
        else if (pret.endsWith('te') || pret.endsWith('de')) entry.verbClass = 'svak';
        else entry.verbClass = 'sterk';
      } else {
        entry.verbClass = 'svak';
      }
      stats.verbClass++;
      modified = true;
    }

    // --- Explanations ---
    if (!entry.explanation) {
      entry.explanation = nbExplanation(entry);
      stats.explanation++;
      modified = true;
    }
  }

  if (modified && !dryRun) {
    fs.writeFileSync(bankPath, JSON.stringify(data, null, 2) + '\n', 'utf8');
    console.log(`  Updated ${bankFile}`);
  }
}

console.log('\n=== NB Results ===');
console.log(`  CEFR: ${stats.cefr} (${stats.cefrChain} chain, ${stats.cefrFreq} frequency)`);
console.log(`  Verb class: ${stats.verbClass}`);
console.log(`  Explanations: ${stats.explanation}`);
