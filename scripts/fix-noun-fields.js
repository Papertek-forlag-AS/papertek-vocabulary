/**
 * fix-noun-fields.js — One-shot audit-trail script to fix missing noun fields
 *
 * Fixes applied:
 *
 *   Fix 1 — DATA-01: morgenmensch_noun missing genus in dict nounbank
 *     - Add genus: "m" after the word field (consistent with core entry structure)
 *
 *   Fix 2 — DATA-05: Top-level plural missing for declension-based nouns
 *     - zusammenfassung_noun: add plural: "Zusammenfassungen" after genus in BOTH banks
 *     - hilfe_noun: add plural: "Hilfen" after genus in BOTH banks
 *
 *   Fix 3 — DATA-06: leute_noun genus missing for plural-only noun
 *     - Add genus: null to leute_noun in BOTH banks
 *     - Note: eltern_noun and ferien_noun already have genus: "pl" — not modified
 *
 * Run once from project root: node scripts/fix-noun-fields.js
 */

import { readFileSync, writeFileSync } from 'fs';

const CORE_PATH = 'vocabulary/core/de/nounbank.json';
const DICT_PATH = 'vocabulary/dictionary/de/nounbank.json';

const core = JSON.parse(readFileSync(CORE_PATH, 'utf8'));
const dict = JSON.parse(readFileSync(DICT_PATH, 'utf8'));

/**
 * Insert a field at a specific position in an object (after a given key).
 * Returns a new object with the field inserted in the correct position.
 */
function insertFieldAfter(obj, afterKey, newKey, newValue) {
  const result = {};
  let inserted = false;
  for (const [k, v] of Object.entries(obj)) {
    result[k] = v;
    if (k === afterKey && !inserted) {
      result[newKey] = newValue;
      inserted = true;
    }
  }
  // If afterKey wasn't found, insert at beginning (fallback)
  if (!inserted) {
    return { [newKey]: newValue, ...obj };
  }
  return result;
}

let changes = [];

// ---------------------------------------------------------------------------
// Fix 1 — DATA-01: Add genus: "m" to morgenmensch_noun in dict nounbank
// ---------------------------------------------------------------------------
const dictMorgen = dict['morgenmensch_noun'];
if (!dictMorgen) {
  console.log('Fix 1: morgenmensch_noun not found in dict nounbank — SKIPPED');
} else if ('genus' in dictMorgen) {
  console.log(`Fix 1: morgenmensch_noun already has genus "${dictMorgen.genus}" in dict — SKIPPED`);
} else {
  // Insert genus after word field
  dict['morgenmensch_noun'] = insertFieldAfter(dictMorgen, 'word', 'genus', 'm');
  changes.push('Fix 1: Added genus:"m" to morgenmensch_noun in dict nounbank (after word field)');
  console.log('Fix 1: Added genus:"m" to morgenmensch_noun in dict nounbank');
}

// ---------------------------------------------------------------------------
// Fix 2 — DATA-05: Add top-level plural to zusammenfassung_noun and hilfe_noun
// ---------------------------------------------------------------------------

// zusammenfassung_noun — core
const coreZusammen = core['zusammenfassung_noun'];
if (!coreZusammen) {
  console.log('Fix 2a: zusammenfassung_noun not found in core nounbank — SKIPPED');
} else if ('plural' in coreZusammen) {
  console.log(`Fix 2a: zusammenfassung_noun already has plural "${coreZusammen.plural}" in core — SKIPPED`);
} else {
  core['zusammenfassung_noun'] = insertFieldAfter(coreZusammen, 'genus', 'plural', 'Zusammenfassungen');
  changes.push('Fix 2a: Added plural:"Zusammenfassungen" to zusammenfassung_noun in core nounbank');
  console.log('Fix 2a: Added plural:"Zusammenfassungen" to zusammenfassung_noun in core nounbank');
}

// zusammenfassung_noun — dict
const dictZusammen = dict['zusammenfassung_noun'];
if (!dictZusammen) {
  console.log('Fix 2b: zusammenfassung_noun not found in dict nounbank — SKIPPED');
} else if ('plural' in dictZusammen) {
  console.log(`Fix 2b: zusammenfassung_noun already has plural "${dictZusammen.plural}" in dict — SKIPPED`);
} else {
  dict['zusammenfassung_noun'] = insertFieldAfter(dictZusammen, 'genus', 'plural', 'Zusammenfassungen');
  changes.push('Fix 2b: Added plural:"Zusammenfassungen" to zusammenfassung_noun in dict nounbank');
  console.log('Fix 2b: Added plural:"Zusammenfassungen" to zusammenfassung_noun in dict nounbank');
}

// hilfe_noun — core
const coreHilfe = core['hilfe_noun'];
if (!coreHilfe) {
  console.log('Fix 2c: hilfe_noun not found in core nounbank — SKIPPED');
} else if ('plural' in coreHilfe) {
  console.log(`Fix 2c: hilfe_noun already has plural "${coreHilfe.plural}" in core — SKIPPED`);
} else {
  core['hilfe_noun'] = insertFieldAfter(coreHilfe, 'genus', 'plural', 'Hilfen');
  changes.push('Fix 2c: Added plural:"Hilfen" to hilfe_noun in core nounbank');
  console.log('Fix 2c: Added plural:"Hilfen" to hilfe_noun in core nounbank');
}

// hilfe_noun — dict
const dictHilfe = dict['hilfe_noun'];
if (!dictHilfe) {
  console.log('Fix 2d: hilfe_noun not found in dict nounbank — SKIPPED');
} else if ('plural' in dictHilfe) {
  console.log(`Fix 2d: hilfe_noun already has plural "${dictHilfe.plural}" in dict — SKIPPED`);
} else {
  dict['hilfe_noun'] = insertFieldAfter(dictHilfe, 'genus', 'plural', 'Hilfen');
  changes.push('Fix 2d: Added plural:"Hilfen" to hilfe_noun in dict nounbank');
  console.log('Fix 2d: Added plural:"Hilfen" to hilfe_noun in dict nounbank');
}

// ---------------------------------------------------------------------------
// Fix 3 — DATA-06: Add genus: "pl" to leute_noun in both banks
// Use "pl" (plural-only) matching eltern_noun and ferien_noun convention.
// Note: genus:null would fail schema validation (enum requires string value).
// The established pattern in this codebase for plural-only nouns is genus:"pl".
// ---------------------------------------------------------------------------

// leute_noun — core
const coreLeute = core['leute_noun'];
if (!coreLeute) {
  console.log('Fix 3a: leute_noun not found in core nounbank — SKIPPED');
} else if ('genus' in coreLeute) {
  console.log(`Fix 3a: leute_noun already has genus "${coreLeute.genus}" in core — SKIPPED`);
} else {
  // Insert genus after word field (consistent with other noun entries)
  core['leute_noun'] = insertFieldAfter(coreLeute, 'word', 'genus', 'pl');
  changes.push('Fix 3a: Added genus:"pl" to leute_noun in core nounbank (plural-only, matches eltern/ferien convention)');
  console.log('Fix 3a: Added genus:"pl" to leute_noun in core nounbank');
}

// leute_noun — dict
const dictLeute = dict['leute_noun'];
if (!dictLeute) {
  console.log('Fix 3b: leute_noun not found in dict nounbank — SKIPPED');
} else if ('genus' in dictLeute) {
  console.log(`Fix 3b: leute_noun already has genus "${dictLeute.genus}" in dict — SKIPPED`);
} else {
  // Insert genus after word field
  dict['leute_noun'] = insertFieldAfter(dictLeute, 'word', 'genus', 'pl');
  changes.push('Fix 3b: Added genus:"pl" to leute_noun in dict nounbank (plural-only, matches eltern/ferien convention)');
  console.log('Fix 3b: Added genus:"pl" to leute_noun in dict nounbank');
}

// ---------------------------------------------------------------------------
// Write files
// ---------------------------------------------------------------------------
writeFileSync(CORE_PATH, JSON.stringify(core, null, 2) + '\n', 'utf8');
writeFileSync(DICT_PATH, JSON.stringify(dict, null, 2) + '\n', 'utf8');

console.log('\n--- Summary ---');
console.log(`Total changes applied: ${changes.length}`);
changes.forEach((c, i) => console.log(`  ${i + 1}. ${c}`));
console.log('\nDone. Run npm run validate:nouns && npm run validate:nouns:dict to verify.');
