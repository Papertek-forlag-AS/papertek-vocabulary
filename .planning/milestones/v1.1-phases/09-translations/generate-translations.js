#!/usr/bin/env node
// generate-translations.js
// Phase 9: Translation generation script
// Reads translation data from nb-data.json and en-data.json (pre-written by batches),
// merges with existing translation files, sorts alphabetically by key, writes output,
// and updates manifests.
//
// Usage: node .planning/phases/09-translations/generate-translations.js

import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, '../../..');

function processTranslationFile(filePath, newAndUpgradedEntries) {
  const existing = JSON.parse(readFileSync(filePath, 'utf8'));
  const { _metadata, ...existingEntries } = existing;

  // Merge: new/upgraded entries override existing; keep untouched existing entries
  const merged = { ...existingEntries, ...newAndUpgradedEntries };
  const sortedKeys = Object.keys(merged).sort();

  const result = { _metadata };
  for (const key of sortedKeys) {
    result[key] = merged[key];
  }

  const entryCount = sortedKeys.length;
  writeFileSync(filePath, JSON.stringify(result, null, 2) + '\n', 'utf8');
  console.log(`Wrote ${entryCount} entries to ${filePath}`);
  return entryCount;
}

function updateManifest(manifestPath, adjCount, totalWordsDelta) {
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
  const oldAdj = manifest._metadata.files['adjectivebank.json'];
  const oldTotal = manifest._metadata.totalWords;
  manifest._metadata.files['adjectivebank.json'] = adjCount;
  manifest._metadata.totalWords = oldTotal + totalWordsDelta;
  writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n', 'utf8');
  console.log(`Updated manifest ${manifestPath}: adjectivebank.json ${oldAdj} -> ${adjCount}, totalWords ${oldTotal} -> ${manifest._metadata.totalWords}`);
}

// Load translation data from batch data files
const nbData = JSON.parse(readFileSync(join(__dirname, 'nb-data.json'), 'utf8'));
const enData = JSON.parse(readFileSync(join(__dirname, 'en-data.json'), 'utf8'));

console.log(`Loaded ${Object.keys(nbData).length} nb entries from nb-data.json`);
console.log(`Loaded ${Object.keys(enData).length} en entries from en-data.json`);

// Process NB translations
const nbPath = join(ROOT, 'vocabulary/translations/de-nb/adjectivebank.json');
const nbCount = processTranslationFile(nbPath, nbData);

// Process EN translations
const enPath = join(ROOT, 'vocabulary/translations/de-en/adjectivebank.json');
const enCount = processTranslationFile(enPath, enData);

// Update manifests (259 new entries added: delta = 259)
// Current manifest count is 108 (includes _metadata in old count),
// actual data entries = 106. New total = 365.
// totalWords delta: 365 - 106 = 259
const nbManifest = join(ROOT, 'vocabulary/translations/de-nb/manifest.json');
updateManifest(nbManifest, nbCount, 259);

const enManifest = join(ROOT, 'vocabulary/translations/de-en/manifest.json');
updateManifest(enManifest, enCount, 259);

console.log('\nDone. Summary:');
console.log(`  NB entries: ${nbCount}`);
console.log(`  EN entries: ${enCount}`);
