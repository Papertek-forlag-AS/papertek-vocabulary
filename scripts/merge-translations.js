/**
 * merge-translations.js
 *
 * Merges dict translation files (de-nb-dict/, de-en-dict/) INTO the core
 * translation directories (de-nb/, de-en/).
 *
 * Only 3 bank types have -dict/ translations: nounbank, verbbank, generalbank.
 * The 5 core-only banks (adjectivebank, articlesbank, numbersbank, phrasesbank,
 * pronounsbank) are left untouched — no action needed.
 *
 * There are 0 overlaps between core and dict translation keys (disjoint sets).
 * Merge is a simple union; core version wins on any defensive overlap.
 *
 * After merging, regenerates manifest.json in each language pair directory.
 * Also reports a gap summary: entries in merged banks lacking translations.
 *
 * Usage: node scripts/merge-translations.js
 * Or:    npm run merge:translations
 */

import { readFileSync, writeFileSync } from 'fs';

const TRANS_BASE = 'vocabulary/translations';
const BANKS_BASE = 'vocabulary/banks/de';

// Only these 3 bank types have -dict/ translation files
const DICT_BANKS = ['nounbank', 'verbbank', 'generalbank'];

// All 8 bank types in each language pair directory
const ALL_BANKS = [
  'adjectivebank',
  'articlesbank',
  'generalbank',
  'nounbank',
  'numbersbank',
  'phrasesbank',
  'pronounsbank',
  'verbbank',
];

// Language pairs to process
const LANG_PAIRS = ['de-nb', 'de-en'];

for (const pair of LANG_PAIRS) {
  console.log(`\nProcessing ${pair}...`);
  let overlapCount = 0;

  for (const bank of DICT_BANKS) {
    const corePath = `${TRANS_BASE}/${pair}/${bank}.json`;
    const dictPath = `${TRANS_BASE}/${pair}-dict/${bank}.json`;

    const coreData = JSON.parse(readFileSync(corePath, 'utf8'));
    const dictData = JSON.parse(readFileSync(dictPath, 'utf8'));

    const coreEntries = Object.keys(coreData).filter(k => k !== '_metadata');
    const dictEntries = Object.keys(dictData).filter(k => k !== '_metadata');

    // Merge: start with core entries, add dict entries. Core wins on overlap.
    const merged = {};

    // Add all core entries
    for (const key of coreEntries) {
      merged[key] = coreData[key];
    }

    // Add dict entries (core wins on overlap — defensive; should be 0 overlaps)
    let overlapsFound = 0;
    for (const key of dictEntries) {
      if (key in merged) {
        console.log(`  OVERLAP in ${pair}/${bank}: key="${key}" — keeping core version`);
        overlapsFound++;
        overlapCount++;
      } else {
        merged[key] = dictData[key];
      }
    }

    // Sort entries by key (ASCII sort — project convention)
    const sortedKeys = Object.keys(merged).sort();
    const sortedMerged = {};
    for (const key of sortedKeys) {
      sortedMerged[key] = merged[key];
    }

    // Preserve _metadata from core if present, update totalWords
    const output = {};
    if (coreData._metadata) {
      output._metadata = {
        ...coreData._metadata,
        totalWords: sortedKeys.length,
        generatedAt: new Date().toISOString(),
        mergedFrom: [`${pair}/${bank}.json`, `${pair}-dict/${bank}.json`],
      };
    }
    Object.assign(output, sortedMerged);

    writeFileSync(corePath, JSON.stringify(output, null, 2) + '\n');

    const addedFromDict = dictEntries.length - overlapsFound;
    console.log(
      `  ${pair}/${bank}: core=${coreEntries.length}, dict=${dictEntries.length}, merged=${sortedKeys.length}, added=${addedFromDict}`
    );
  }

  if (overlapCount > 0) {
    console.log(`  WARNING: ${overlapCount} overlapping keys found in ${pair} (core versions kept)`);
  }

  // Regenerate manifest.json
  const manifestPath = `${TRANS_BASE}/${pair}/manifest.json`;
  const existingManifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
  const meta = existingManifest._metadata;

  const fileCounts = {};
  let totalWords = 0;
  for (const bank of ALL_BANKS) {
    const bankPath = `${TRANS_BASE}/${pair}/${bank}.json`;
    const bankData = JSON.parse(readFileSync(bankPath, 'utf8'));
    const count = Object.keys(bankData).filter(k => k !== '_metadata').length;
    fileCounts[`${bank}.json`] = count;
    totalWords += count;
  }

  const updatedManifest = {
    _metadata: {
      ...meta,
      generatedAt: new Date().toISOString(),
      totalWords,
      files: fileCounts,
    },
  };

  writeFileSync(manifestPath, JSON.stringify(updatedManifest, null, 2) + '\n');
  console.log(`  manifest.json updated: totalWords=${totalWords}`);
}

// Gap report: entries in merged banks missing translations
console.log('\nGap report (entries missing translations):');
for (const pair of LANG_PAIRS) {
  for (const bank of DICT_BANKS) {
    const bankFile = `${BANKS_BASE}/${bank}.json`;
    const transFile = `${TRANS_BASE}/${pair}/${bank}.json`;

    const bankData = JSON.parse(readFileSync(bankFile, 'utf8'));
    const transData = JSON.parse(readFileSync(transFile, 'utf8'));

    const bankKeys = Object.keys(bankData).filter(k => k !== '_metadata');
    const transKeys = new Set(Object.keys(transData).filter(k => k !== '_metadata'));

    const missingCount = bankKeys.filter(k => !transKeys.has(k)).length;
    console.log(`  ${pair}/${bank}: ${missingCount} entries missing translations out of ${bankKeys.length}`);
  }
}

console.log('\nDone.');
