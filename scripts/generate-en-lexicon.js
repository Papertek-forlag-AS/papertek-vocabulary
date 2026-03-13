/**
 * generate-en-lexicon.js
 *
 * Phase 5: Generates English (EN) lexicon entries from existing
 * translation data (de-en, es-en).
 *
 * Same approach as generate-nb-lexicon.js but adapted for English:
 * - No gender/definite forms
 * - Strips "to " prefix from verbs for base form
 * - Handles slash alternatives the same way
 *
 * Usage:
 *   node scripts/generate-en-lexicon.js
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

const VOCAB_BASE = 'vocabulary';
const TRANS_BASE = join(VOCAB_BASE, 'translations');
const LEXICON_BASE = join(VOCAB_BASE, 'lexicon');
const EN_BASE = join(LEXICON_BASE, 'en');

const EN_PAIRS = ['de-en', 'es-en'];

const BANK_FILES = [
  'nounbank.json', 'verbbank.json', 'adjectivebank.json',
  'generalbank.json', 'articlesbank.json', 'numbersbank.json',
  'phrasesbank.json', 'pronounsbank.json',
];

const SUFFIX_TO_TYPE = {
  noun: 'noun', verb: 'verb', adj: 'adj', adv: 'adv',
  prep: 'prep', conj: 'conj', interj: 'interj', pron: 'pron',
  art: 'art', num: 'num', phrase: 'phrase', interr: 'interr',
  propn: 'propn', contr: 'contr', expr: 'expr',
  dem_pron: 'pron', poss_pron: 'pron', dobj_pron: 'pron',
  iobj_pron: 'pron', refl_pron: 'pron', possessiv: 'pron',
  modal: 'verb', verbphrase: 'phrase', general: 'adv', land: 'propn',
};

const TYPE_TO_EN_BANK = {
  noun: 'nounbank', verb: 'verbbank', adj: 'adjectivebank',
  adv: 'generalbank', prep: 'generalbank', conj: 'generalbank',
  interj: 'generalbank', pron: 'generalbank', art: 'generalbank',
  num: 'generalbank', phrase: 'generalbank', interr: 'generalbank',
  propn: 'generalbank', contr: 'generalbank', expr: 'generalbank',
};

function normalizeToId(word, type) {
  let normalized = word.toLowerCase().trim();
  // Strip "to " prefix for verbs
  if (normalized.startsWith('to ')) normalized = normalized.substring(3);
  normalized = normalized.replace(/\s+/g, '_');
  normalized = normalized.replace(/\s*\(.*?\)\s*/g, '');
  normalized = normalized.replace(/^_+|_+$/g, '');
  normalized = normalized.replace(/[^a-z0-9_]/g, '');
  return `${normalized}_${type}`;
}

function getTypeFromSourceId(sourceId) {
  const parts = sourceId.split('_');
  if (parts.length >= 3) {
    const twoPartSuffix = parts.slice(-2).join('_');
    if (SUFFIX_TO_TYPE[twoPartSuffix]) return SUFFIX_TO_TYPE[twoPartSuffix];
  }
  if (parts.length >= 2) {
    const suffix = parts[parts.length - 1];
    if (SUFFIX_TO_TYPE[suffix]) return SUFFIX_TO_TYPE[suffix];
  }
  return 'adv';
}

function splitAlternatives(translation) {
  return translation.split(/\s*\/\s*/).map(s => s.trim()).filter(s => s.length > 0);
}

function parseTranslation(translation) {
  const contextMatch = translation.match(/\(([^)]+)\)/);
  const context = contextMatch ? contextMatch[1] : null;
  const cleanWord = translation.replace(/\s*\(.*?\)\s*/g, '').trim();
  return { word: cleanWord, context };
}

function buildEntry(word, type, sources, context) {
  const entry = { word, type };

  if (type === 'verb') {
    // Store bare infinitive
    entry.word = word.startsWith('to ') ? word.substring(3) : word;
  }

  if (context) entry.usageNotes = context;
  entry._generatedFrom = sources.join(', ');
  entry._enriched = false;
  return entry;
}

// ─── Main ────────────────────────────────────────────────────────────────

console.log('Generating English (EN) lexicon...\n');

const enWords = new Map();
let totalEntries = 0, totalSlashSplits = 0, totalDuplicates = 0;

for (const pair of EN_PAIRS) {
  const pairDir = join(TRANS_BASE, pair);
  if (!existsSync(pairDir)) { console.log(`  Skipping ${pair}`); continue; }

  const sourceLang = pair.split('-')[0];
  let sourceBanks = {};
  const sourceBankDir = existsSync(join(VOCAB_BASE, 'banks', sourceLang))
    ? join(VOCAB_BASE, 'banks', sourceLang)
    : existsSync(join(VOCAB_BASE, 'core', sourceLang))
      ? join(VOCAB_BASE, 'core', sourceLang) : null;

  if (sourceBankDir) {
    for (const bf of BANK_FILES) {
      const bp = join(sourceBankDir, bf);
      if (existsSync(bp)) {
        const d = JSON.parse(readFileSync(bp, 'utf8'));
        const { _metadata, ...entries } = d;
        Object.assign(sourceBanks, entries);
      }
    }
  }

  for (const bankFile of BANK_FILES) {
    const filePath = join(pairDir, bankFile);
    if (!existsSync(filePath)) continue;
    const data = JSON.parse(readFileSync(filePath, 'utf8'));
    const { _metadata, ...entries } = data;

    for (const [sourceId, transEntry] of Object.entries(entries)) {
      if (!transEntry.translation) continue;
      totalEntries++;

      let type;
      if (sourceBanks[sourceId] && sourceBanks[sourceId].type) {
        type = SUFFIX_TO_TYPE[sourceBanks[sourceId].type] || getTypeFromSourceId(sourceId);
      } else {
        type = getTypeFromSourceId(sourceId);
      }

      const alternatives = splitAlternatives(transEntry.translation);
      if (alternatives.length > 1) totalSlashSplits++;

      for (const alt of alternatives) {
        const { word, context } = parseTranslation(alt);
        if (!word || word.length === 0) continue;
        const enId = normalizeToId(word, type);
        const sourceRef = `${pair}/${bankFile}:${sourceId}`;

        if (enWords.has(enId)) {
          enWords.get(enId).sources.push(sourceRef);
          totalDuplicates++;
        } else {
          enWords.set(enId, { word, type, sources: [sourceRef], context });
        }
      }
    }
  }
  console.log(`  Processed ${pair}`);
}

// Organize into banks
const banks = { nounbank: {}, verbbank: {}, adjectivebank: {}, generalbank: {} };

for (const [enId, data] of enWords) {
  const bankName = TYPE_TO_EN_BANK[data.type] || 'generalbank';
  banks[bankName][enId] = buildEntry(data.word, data.type, data.sources, data.context);
}

// Sort and write
mkdirSync(EN_BASE, { recursive: true });
const bankCounts = {};

for (const [bankName, entries] of Object.entries(banks)) {
  const count = Object.keys(entries).length;
  if (count === 0) continue;
  bankCounts[bankName] = count;

  const sorted = {};
  for (const key of Object.keys(entries).sort()) sorted[key] = entries[key];

  const output = {
    _metadata: {
      language: 'en',
      languageName: 'English',
      bank: bankName,
      generatedAt: new Date().toISOString(),
      totalEntries: count,
    },
    ...sorted,
  };

  const outPath = join(EN_BASE, `${bankName}.json`);
  writeFileSync(outPath, JSON.stringify(output, null, 2) + '\n');
  console.log(`  Wrote ${outPath} (${count} entries)`);
}

const totalWords = Object.values(bankCounts).reduce((a, b) => a + b, 0);
const manifest = {
  _metadata: {
    language: 'en', languageName: 'English',
    generatedAt: new Date().toISOString(),
  },
  summary: { totalWords, enrichedWords: 0, skeletonWords: totalWords },
  banks: bankCounts,
  sources: EN_PAIRS.filter(p => existsSync(join(TRANS_BASE, p))),
};
writeFileSync(join(EN_BASE, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');

console.log(`\n=== Summary ===`);
console.log(`  Entries processed: ${totalEntries}`);
console.log(`  Slash splits: ${totalSlashSplits}`);
console.log(`  Duplicates merged: ${totalDuplicates}`);
console.log(`  Unique EN words: ${totalWords}`);
for (const [b, c] of Object.entries(bankCounts)) console.log(`    ${b}: ${c}`);
