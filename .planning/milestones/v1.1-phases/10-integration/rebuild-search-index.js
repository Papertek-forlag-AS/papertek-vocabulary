// .planning/phases/10-integration/rebuild-search-index.js
// Rebuilds vocabulary/dictionary/de/search-index.json and search-index.pretty.json
// by replacing all adj entries from the current adjectivebank and translation files.
//
// Expected output: 3454 total entries (365 adj + 3089 non-adj)

import { readFileSync, writeFileSync } from 'fs';

const ROOT = process.cwd();

// Read source data
const adjBank = JSON.parse(readFileSync(`${ROOT}/vocabulary/dictionary/de/adjectivebank.json`, 'utf8'));
const nbTrans = JSON.parse(readFileSync(`${ROOT}/vocabulary/translations/de-nb/adjectivebank.json`, 'utf8'));
const enTrans = JSON.parse(readFileSync(`${ROOT}/vocabulary/translations/de-en/adjectivebank.json`, 'utf8'));
const existingIndex = JSON.parse(readFileSync(`${ROOT}/vocabulary/dictionary/de/search-index.pretty.json`, 'utf8'));

// Build fresh adj entries for ALL 365 adjectives from current adjectivebank
const adjEntries = [];
for (const [id, entry] of Object.entries(adjBank)) {
  if (id === '_metadata') continue;
  adjEntries.push({
    id: entry._id,
    w: entry.word,
    t: 'adj',
    f: entry.frequency || null,
    c: entry.cefr || null,
    cur: entry.curriculum || false,
    tr: {
      nb: nbTrans[id]?.translation || null,
      en: enTrans[id]?.translation || null,
    }
  });
}

// Keep all non-adj entries from the existing index unchanged
const nonAdjEntries = existingIndex.entries.filter(e => e.t !== 'adj');

// Merge and sort by id for determinism
const allEntries = [...nonAdjEntries, ...adjEntries];
allEntries.sort((a, b) => a.id.localeCompare(b.id));

const newIndex = {
  _meta: {
    ...existingIndex._meta,
    totalEntries: allEntries.length,
    generatedAt: new Date().toISOString(),
  },
  entries: allEntries,
};

// Write minified (API reads this file)
writeFileSync(
  `${ROOT}/vocabulary/dictionary/de/search-index.json`,
  JSON.stringify(newIndex) + '\n'
);

// Write pretty (human-readable reference)
writeFileSync(
  `${ROOT}/vocabulary/dictionary/de/search-index.pretty.json`,
  JSON.stringify(newIndex, null, 2) + '\n'
);

console.log(`Wrote ${allEntries.length} entries (${adjEntries.length} adj + ${nonAdjEntries.length} non-adj)`);
console.log(`Expected: 3454 entries (365 adj + ${3454 - 365} non-adj)`);

if (allEntries.length !== 3454) {
  console.error(`ERROR: Expected 3454 entries but got ${allEntries.length}`);
  process.exitCode = 1;
} else if (adjEntries.length !== 365) {
  console.error(`ERROR: Expected 365 adj entries but got ${adjEntries.length}`);
  process.exitCode = 1;
} else {
  console.log('OK: Entry counts match expected values.');
}
