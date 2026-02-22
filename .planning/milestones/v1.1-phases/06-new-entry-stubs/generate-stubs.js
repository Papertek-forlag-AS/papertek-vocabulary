/**
 * Phase 6 — New Entry Stubs
 * Generates stub entries for all 259 Phase 4 adjective candidates,
 * merges with existing 106 entries, sorts alphabetically, and updates manifests.
 */

import { readFileSync, writeFileSync } from 'fs';

const PROJECT_ROOT = process.cwd();

// ─── Step 1: Read inputs ─────────────────────────────────────────────────────

const candidateData = JSON.parse(
  readFileSync(`${PROJECT_ROOT}/.planning/phases/04-goethe-adjective-extraction/04-candidates.json`, 'utf8')
);
const candidates = candidateData.candidates;

// Build frequency rank map (line number 1-based = rank)
const freqLines = readFileSync(
  `${PROJECT_ROOT}/vocabulary/dictionary/frequency/de_50k.txt`,
  'utf8'
).split('\n');
const rankMap = {};
freqLines.forEach((line, i) => {
  const word = line.split(/\s+/)[0];
  if (word) rankMap[word] = i + 1;
});

const coreBank = JSON.parse(
  readFileSync(`${PROJECT_ROOT}/vocabulary/core/de/adjectivebank.json`, 'utf8')
);
const dictBank = JSON.parse(
  readFileSync(`${PROJECT_ROOT}/vocabulary/dictionary/de/adjectivebank.json`, 'utf8')
);

// ─── Step 2: Safety checks ───────────────────────────────────────────────────

if (candidates.length !== 259) {
  console.error(`ERROR: Expected 259 candidates, got ${candidates.length}`);
  process.exit(1);
}

const existingCoreIds = new Set(Object.keys(coreBank).filter(k => k !== '_metadata'));
const existingDictIds = new Set(Object.keys(dictBank).filter(k => k !== '_metadata'));

const overlaps = candidates.filter(c => existingCoreIds.has(c._id) || existingDictIds.has(c._id));
if (overlaps.length > 0) {
  console.error('ERROR: Duplicate _ids found:', overlaps.map(c => c._id));
  process.exit(1);
}

console.log(`Safety checks passed: ${candidates.length} candidates, 0 overlaps`);
console.log(`Existing entries — Core: ${existingCoreIds.size}, Dict: ${existingDictIds.size}`);

// ─── Step 3: Construct core bank stubs ──────────────────────────────────────

let freqZeroCount = 0;

for (const c of candidates) {
  const stem = c._id.replace('_adj', '');
  coreBank[c._id] = {
    word: c.word,
    _id: c._id,
    audio: `adjektiv_${stem}.mp3`,
    comparison: {},
    declension: {}
  };
}

// ─── Step 4: Construct dictionary bank stubs ─────────────────────────────────

for (const c of candidates) {
  const stem = c._id.replace('_adj', '');
  const freq = rankMap[c.word] ?? 0;
  if (freq === 0) freqZeroCount++;
  dictBank[c._id] = {
    word: c.word,
    _id: c._id,
    audio: `adjektiv_${stem}.mp3`,
    curriculum: false,
    cefr: c.cefr,
    frequency: freq,
    comparison: {},
    declension: {}
  };
}

// ─── Step 5: Sort and reassemble both banks ──────────────────────────────────

function sortBank(bank) {
  const { _metadata, ...entries } = bank;
  const updatedMetadata = { ..._metadata, generatedAt: new Date().toISOString() };
  const sorted = Object.fromEntries(
    Object.entries(entries).sort(([a], [b]) => a.localeCompare(b))
  );
  return { _metadata: updatedMetadata, ...sorted };
}

const coreBankSorted = sortBank(coreBank);
const dictBankSorted = sortBank(dictBank);

// Verify counts
const coreFinalKeys = Object.keys(coreBankSorted).filter(k => k !== '_metadata');
const dictFinalKeys = Object.keys(dictBankSorted).filter(k => k !== '_metadata');

console.log(`Core bank entries after merge: ${coreFinalKeys.length}`);
console.log(`Dict bank entries after merge: ${dictFinalKeys.length}`);

// ─── Step 6: Write bank files ────────────────────────────────────────────────

writeFileSync(
  `${PROJECT_ROOT}/vocabulary/core/de/adjectivebank.json`,
  JSON.stringify(coreBankSorted, null, 2) + '\n'
);
writeFileSync(
  `${PROJECT_ROOT}/vocabulary/dictionary/de/adjectivebank.json`,
  JSON.stringify(dictBankSorted, null, 2) + '\n'
);

console.log('Bank files written.');

// ─── Step 7: Update manifests ────────────────────────────────────────────────

const newAdjectiveCount = coreFinalKeys.length; // should be 365

// Core manifest
const coreManifest = JSON.parse(
  readFileSync(`${PROJECT_ROOT}/vocabulary/core/de/manifest.json`, 'utf8')
);
const oldCoreAdjCount = coreManifest._metadata.files['adjectivebank.json']; // was 108 (stale)
coreManifest._metadata.files['adjectivebank.json'] = newAdjectiveCount;
// Recalculate totalWords from actual file counts
const coreTotalWords = Object.values(coreManifest._metadata.files).reduce((sum, n) => sum + n, 0);
coreManifest._metadata.totalWords = coreTotalWords;
coreManifest._metadata.generatedAt = new Date().toISOString();
writeFileSync(
  `${PROJECT_ROOT}/vocabulary/core/de/manifest.json`,
  JSON.stringify(coreManifest, null, 2) + '\n'
);
console.log(`Core manifest: adjectivebank.json ${oldCoreAdjCount} → ${newAdjectiveCount}, totalWords: ${coreTotalWords}`);

// Dictionary manifest
const dictManifest = JSON.parse(
  readFileSync(`${PROJECT_ROOT}/vocabulary/dictionary/de/manifest.json`, 'utf8')
);
const oldDictAdjCount = dictManifest._metadata.files['adjectivebank.json']; // was 106
dictManifest._metadata.files['adjectivebank.json'] = newAdjectiveCount;
// Recalculate totalWords from actual file counts
const dictTotalWords = Object.values(dictManifest._metadata.files).reduce((sum, n) => sum + n, 0);
dictManifest._metadata.totalWords = dictTotalWords;
dictManifest._metadata.curriculumWords = dictManifest._metadata.curriculumWords; // unchanged (867)
// New entries are all curriculum: false — add 259 to dictionaryOnlyWords
dictManifest._metadata.dictionaryOnlyWords = (dictManifest._metadata.dictionaryOnlyWords || 0) + 259;
dictManifest._metadata.generatedAt = new Date().toISOString();
// Also update top-level fields (matches existing structure)
dictManifest.totalWords = dictManifest._metadata.totalWords;
dictManifest.curriculumWords = dictManifest._metadata.curriculumWords;
dictManifest.dictionaryOnlyWords = dictManifest._metadata.dictionaryOnlyWords;
dictManifest.updatedAt = new Date().toISOString();
writeFileSync(
  `${PROJECT_ROOT}/vocabulary/dictionary/de/manifest.json`,
  JSON.stringify(dictManifest, null, 2) + '\n'
);
console.log(`Dict manifest: adjectivebank.json ${oldDictAdjCount} → ${newAdjectiveCount}, totalWords: ${dictTotalWords}`);

// ─── Step 8: Summary ─────────────────────────────────────────────────────────

console.log('\n─── Summary ───────────────────────────────────────────────────────────');
console.log(`Candidates processed:        ${candidates.length}`);
console.log(`Core bank entries:           ${coreFinalKeys.length}`);
console.log(`Dict bank entries:           ${dictFinalKeys.length}`);
console.log(`Entries with frequency 0:    ${freqZeroCount}`);
console.log(`Core manifest totalWords:    ${coreTotalWords}`);
console.log(`Dict manifest totalWords:    ${dictTotalWords}`);
console.log(`Dict dictionaryOnlyWords:    ${dictManifest._metadata.dictionaryOnlyWords}`);
console.log(`First key (core):            ${coreFinalKeys[0]}`);
console.log(`Last key (core):             ${coreFinalKeys[coreFinalKeys.length - 1]}`);
