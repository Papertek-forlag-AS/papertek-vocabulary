/**
 * fix-manifest-counts.js
 *
 * Audit-trail script for manifest count corrections (DATA-04).
 *
 * Dynamically counts actual entries in every bank file referenced by each
 * manifest and updates the manifests to reflect reality. Safe to re-run at
 * any time as a health check — it is idempotent.
 *
 * Usage: node scripts/fix-manifest-counts.js
 */

import { readFileSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

// ─── Helpers ────────────────────────────────────────────────────────────────

function readJSON(relPath) {
  return JSON.parse(readFileSync(resolve(ROOT, relPath), 'utf8'));
}

function writeJSON(relPath, data) {
  writeFileSync(resolve(ROOT, relPath), JSON.stringify(data, null, 2) + '\n', 'utf8');
}

/**
 * Count non-_metadata entries in a bank file.
 */
function countEntries(bankPath) {
  const data = readJSON(bankPath);
  return Object.keys(data).filter(k => k !== '_metadata').length;
}

/**
 * Count entries where curriculum === true.
 */
function countCurriculumEntries(bankPath) {
  const data = readJSON(bankPath);
  return Object.values(data).filter(
    v => v && typeof v === 'object' && v.curriculum === true
  ).length;
}

/**
 * Print a comparison table row.
 */
function row(bank, oldCount, newCount) {
  const changed = oldCount !== newCount;
  const marker = changed ? ' <-- UPDATED' : '';
  console.log(`  ${bank.padEnd(22)} old=${String(oldCount).padStart(5)}  new=${String(newCount).padStart(5)}${marker}`);
}

// ─── Core Manifest ──────────────────────────────────────────────────────────

const CORE_MANIFEST_PATH = 'vocabulary/core/de/manifest.json';
const CORE_DIR = 'vocabulary/core/de';

function fixCoreManifest() {
  console.log('\n=== CORE MANIFEST ===');
  const manifest = readJSON(CORE_MANIFEST_PATH);
  const meta = manifest._metadata;
  let changed = false;

  const bankNames = Object.keys(meta.files);
  const newFileCounts = {};

  for (const bank of bankNames) {
    const bankPath = `${CORE_DIR}/${bank}`;
    const actual = countEntries(bankPath);
    const declared = meta.files[bank];
    row(bank, declared, actual);
    newFileCounts[bank] = actual;
    if (actual !== declared) changed = true;
  }

  const oldTotal = meta.totalWords;
  const newTotal = Object.values(newFileCounts).reduce((a, b) => a + b, 0);
  row('_metadata.totalWords', oldTotal, newTotal);
  if (newTotal !== oldTotal) changed = true;

  if (changed) {
    meta.files = newFileCounts;
    meta.totalWords = newTotal;
    meta.generatedAt = new Date().toISOString();
    writeJSON(CORE_MANIFEST_PATH, manifest);
    console.log('  => Core manifest updated.');
  } else {
    console.log('  => Core manifest already accurate — no changes needed.');
  }
}

// ─── Dict Manifest ──────────────────────────────────────────────────────────

const DICT_MANIFEST_PATH = 'vocabulary/dictionary/de/manifest.json';
const DICT_DIR = 'vocabulary/dictionary/de';

function fixDictManifest() {
  console.log('\n=== DICT MANIFEST ===');
  const manifest = readJSON(DICT_MANIFEST_PATH);
  const meta = manifest._metadata;
  let changed = false;

  // --- _metadata.files counts ---
  console.log('\n  _metadata.files counts:');
  const bankNames = Object.keys(meta.files);
  const newFileCounts = {};

  for (const bank of bankNames) {
    const bankPath = `${DICT_DIR}/${bank}`;
    const actual = countEntries(bankPath);
    const declared = meta.files[bank];
    row(bank, declared, actual);
    newFileCounts[bank] = actual;
    if (actual !== declared) changed = true;
  }

  // --- _metadata.totalWords (sum of _metadata.files) ---
  console.log('\n  Derived totals:');
  const oldMetaTotal = meta.totalWords;
  const newMetaTotal = Object.values(newFileCounts).reduce((a, b) => a + b, 0);
  row('_metadata.totalWords', oldMetaTotal, newMetaTotal);
  if (newMetaTotal !== oldMetaTotal) changed = true;

  // --- top-level totalWords (sum of all actual dict entries) ---
  const oldTopTotal = manifest.totalWords;
  // totalWords at top level = same as _metadata.totalWords (all dict entries)
  const newTopTotal = newMetaTotal;
  row('totalWords (top-level)', oldTopTotal, newTopTotal);
  if (newTopTotal !== oldTopTotal) changed = true;

  // --- curriculumWords (entries with curriculum:true across all dict banks) ---
  const oldCurriculum = manifest.curriculumWords;
  let newCurriculum = 0;
  for (const bank of bankNames) {
    const bankPath = `${DICT_DIR}/${bank}`;
    newCurriculum += countCurriculumEntries(bankPath);
  }
  row('curriculumWords', oldCurriculum, newCurriculum);
  if (newCurriculum !== oldCurriculum) changed = true;

  // --- dictionaryOnlyWords = totalWords - curriculumWords ---
  const oldDictOnly = manifest.dictionaryOnlyWords;
  const newDictOnly = newTopTotal - newCurriculum;
  row('dictionaryOnlyWords', oldDictOnly, newDictOnly);
  if (newDictOnly !== oldDictOnly) changed = true;

  // --- _metadata.curriculumWords + dictionaryOnlyWords ---
  const oldMetaCurriculum = meta.curriculumWords;
  const oldMetaDictOnly = meta.dictionaryOnlyWords;
  if (newCurriculum !== oldMetaCurriculum) {
    row('_metadata.curriculumWords', oldMetaCurriculum, newCurriculum);
    changed = true;
  }
  if (newDictOnly !== oldMetaDictOnly) {
    row('_metadata.dictionaryOnlyWords', oldMetaDictOnly, newDictOnly);
    changed = true;
  }

  if (changed) {
    // Update _metadata
    meta.files = newFileCounts;
    meta.totalWords = newMetaTotal;
    meta.curriculumWords = newCurriculum;
    meta.dictionaryOnlyWords = newDictOnly;
    meta.generatedAt = new Date().toISOString();

    // Update top-level fields
    manifest.totalWords = newTopTotal;
    manifest.curriculumWords = newCurriculum;
    manifest.dictionaryOnlyWords = newDictOnly;
    manifest.updatedAt = new Date().toISOString();

    writeJSON(DICT_MANIFEST_PATH, manifest);
    console.log('\n  => Dict manifest updated.');
  } else {
    console.log('\n  => Dict manifest already accurate — no changes needed.');
  }
}

// ─── Main ───────────────────────────────────────────────────────────────────

console.log('fix-manifest-counts.js — DATA-04 audit-trail');
console.log('Counting actual entries in bank files and comparing to manifests...');

fixCoreManifest();
fixDictManifest();

console.log('\nDone.');
