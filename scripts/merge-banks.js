/**
 * merge-banks.js
 *
 * Merges core + dictionary bank pairs into single merged bank files under
 * vocabulary/banks/de/. Deep-merges core-exclusive fields into dict entries
 * for shared entries. Dict-only entries are left unchanged.
 *
 * Also generates vocabulary/banks/de/manifest.json listing curriculum entry IDs.
 *
 * Usage: node scripts/merge-banks.js
 * Or:    npm run merge:banks
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';

const BANKS = [
  'nounbank',
  'verbbank',
  'adjectivebank',
  'generalbank',
  'articlesbank',
  'numbersbank',
  'phrasesbank',
  'pronounsbank',
];

const CORE_DIR = 'vocabulary/core/de';
const DICT_DIR = 'vocabulary/dictionary/de';
const OUTPUT_DIR = 'vocabulary/banks/de';

// Ensure output directory exists
if (!existsSync(OUTPUT_DIR)) {
  mkdirSync(OUTPUT_DIR, { recursive: true });
}

const manifestBanks = {};
let grandTotalWords = 0;
let grandCurriculumWords = 0;
let grandDictOnlyWords = 0;

for (const bank of BANKS) {
  const corePath = `${CORE_DIR}/${bank}.json`;
  const dictPath = `${DICT_DIR}/${bank}.json`;

  const coreData = JSON.parse(readFileSync(corePath, 'utf8'));
  const dictData = JSON.parse(readFileSync(dictPath, 'utf8'));

  const coreEntries = Object.keys(coreData).filter(k => k !== '_metadata');
  const dictEntries = Object.keys(dictData).filter(k => k !== '_metadata');

  // Start with dict as base (superset). Deep-merge core-exclusive fields into shared entries.
  const merged = {};
  let fieldsMergedCount = 0;
  const fieldsMergedNames = new Set();

  for (const key of dictEntries) {
    const dictEntry = { ...dictData[key] };

    if (coreData[key]) {
      // Shared entry: copy core-exclusive fields (fields not present in dict entry)
      const coreEntry = coreData[key];
      for (const field of Object.keys(coreEntry)) {
        if (!(field in dictEntry)) {
          dictEntry[field] = coreEntry[field];
          fieldsMergedNames.add(field);
          fieldsMergedCount++;
        }
      }
    }
    // Dict-only entries: left unchanged (just copied)

    merged[key] = dictEntry;
  }

  // Sort entries by _id (ASCII sort — project convention)
  const sortedKeys = Object.keys(merged).sort();
  const sortedMerged = {};
  for (const key of sortedKeys) {
    sortedMerged[key] = merged[key];
  }

  // Count curriculum vs dict-only entries
  const curriculumCount = sortedKeys.filter(k => sortedMerged[k].curriculum === true).length;
  const dictOnlyCount = sortedKeys.length - curriculumCount;
  const totalCount = sortedKeys.length;

  // Build _metadata block
  const metadata = {
    source: 'merged',
    packId: 'german',
    targetLanguage: 'german',
    generatedAt: new Date().toISOString(),
    description: 'Merged bank (core + dictionary)',
    totalEntries: totalCount,
    curriculumEntries: curriculumCount,
    dictionaryOnlyEntries: dictOnlyCount,
  };

  // Write output file: _metadata first, then sorted entries
  const output = { _metadata: metadata, ...sortedMerged };
  const outputPath = `${OUTPUT_DIR}/${bank}.json`;
  writeFileSync(outputPath, JSON.stringify(output, null, 2) + '\n');

  // Collect curriculum IDs for manifest
  const curriculumIds = sortedKeys
    .filter(k => sortedMerged[k].curriculum === true)
    .sort();

  manifestBanks[bank] = {
    total: totalCount,
    curriculum: curriculumCount,
    dictionaryOnly: dictOnlyCount,
    ids: curriculumIds,
  };

  grandTotalWords += totalCount;
  grandCurriculumWords += curriculumCount;
  grandDictOnlyWords += dictOnlyCount;

  // Console output
  const mergedFieldsStr =
    fieldsMergedNames.size > 0
      ? `[${[...fieldsMergedNames].join(', ')}] (${fieldsMergedCount} field-additions)`
      : 'none';
  console.log(
    `${bank}: total=${totalCount}, curriculum=${curriculumCount}, dictOnly=${dictOnlyCount}, coreFields=${mergedFieldsStr}`
  );
}

// Build manifest
const manifest = {
  _metadata: {
    packId: 'german',
    type: 'core-manifest',
    generatedAt: new Date().toISOString(),
    description: 'Identifies curriculum entries within merged banks',
  },
  banks: manifestBanks,
  summary: {
    totalWords: grandTotalWords,
    curriculumWords: grandCurriculumWords,
    dictionaryOnlyWords: grandDictOnlyWords,
  },
};

writeFileSync(`${OUTPUT_DIR}/manifest.json`, JSON.stringify(manifest, null, 2) + '\n');

console.log('');
console.log('Manifest summary:');
console.log(`  totalWords:        ${grandTotalWords}`);
console.log(`  curriculumWords:   ${grandCurriculumWords}`);
console.log(`  dictionaryOnly:    ${grandDictOnlyWords}`);
console.log(`  Output:            ${OUTPUT_DIR}/`);
console.log('Done.');
