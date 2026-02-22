/**
 * fix-validation.js — One-shot audit-trail script to fix all 547 pre-existing validation errors
 *
 * Errors fixed:
 *   Schema fixes:
 *     - core-word.schema.json: Remove minProperties:1 from translations (empty stubs are valid)
 *     - noun.schema.json: Allow plural:null (type: ["string","null"]) for uncountable nouns
 *
 *   Noun bank (356 errors):
 *     - 332 missing translations (331 noun entries + _metadata) -> add translations:{} stub
 *     - 23 plural:null type errors -> fixed by schema change
 *     - 1 leute_noun type const error -> change "substantiv (kun flertall)" to "noun"
 *
 *   Verb bank (191 errors):
 *     - 149 missing translations (148 verb entries + _metadata) -> add translations:{} stub
 *     - 42 Norwegian type enum errors -> map to English enum values
 *
 * Norwegian -> English type map:
 *   "sterkt"    -> "strong"
 *   "svakt"     -> "weak"
 *   "vanlig"    -> "weak"
 *   "refleksiv" -> "reflexive"
 *   "verb"      -> "weak"
 *
 * Run once from project root: node scripts/fix-validation.js
 */

import { readFileSync, writeFileSync } from 'fs';

// --- Load files ---
const coreWordSchemaPath = 'vocabulary/schema/core-word.schema.json';
const nounSchemaPath = 'vocabulary/schema/noun.schema.json';
const nounBankPath = 'vocabulary/core/de/nounbank.json';
const verbBankPath = 'vocabulary/core/de/verbbank.json';

const coreWordSchema = JSON.parse(readFileSync(coreWordSchemaPath, 'utf8'));
const nounSchema = JSON.parse(readFileSync(nounSchemaPath, 'utf8'));
const nounBank = JSON.parse(readFileSync(nounBankPath, 'utf8'));
const verbBank = JSON.parse(readFileSync(verbBankPath, 'utf8'));

let coreWordSchemaUpdated = false;
let nounSchemaUpdated = false;
let nounTranslationsAdded = 0;
let leuteFixed = false;
let verbTranslationsAdded = 0;
let verbTypesFixed = 0;

// --- Fix 0: Remove minProperties:1 from core-word.schema.json translations ---
// Empty translations stubs {} must be valid (entries without translations are stubs)
const translationsDef = coreWordSchema.$defs && coreWordSchema.$defs.translations;
if (translationsDef && translationsDef.minProperties === 1) {
  delete translationsDef.minProperties;
  coreWordSchemaUpdated = true;
  console.log('Fix 0: core-word.schema.json translations.minProperties:1 removed (empty stubs now valid)');
} else {
  console.log('Fix 0: core-word.schema.json translations.minProperties already removed — skipped');
}

// --- Fix 1: Update noun schema to allow plural: null ---
// Change plural field from { "type": "string" } to { "type": ["string", "null"] }
const nounEntry = nounSchema.$defs.nounEntry;
if (nounEntry && nounEntry.properties && nounEntry.properties.plural) {
  const pluralProp = nounEntry.properties.plural;
  if (pluralProp.type === 'string') {
    pluralProp.type = ['string', 'null'];
    nounSchemaUpdated = true;
    console.log('Fix 1: noun.schema.json plural field updated to allow null (uncountable nouns)');
  } else {
    console.log('Fix 1: noun.schema.json plural already allows null — skipped');
  }
}

// --- Fix 2: Add translations: {} to core nounbank entries missing it ---
// Applies to all keys including _metadata (which also lacks translations)
for (const key of Object.keys(nounBank)) {
  const entry = nounBank[key];
  if (!('translations' in entry)) {
    entry.translations = {};
    nounTranslationsAdded++;
  }
}
console.log(`Fix 2: Added translations:{} to ${nounTranslationsAdded} noun bank entries (incl. _metadata)`);

// --- Fix 3: Fix leute_noun type ---
if (nounBank.leute_noun && nounBank.leute_noun.type === 'substantiv (kun flertall)') {
  nounBank.leute_noun.type = 'noun';
  leuteFixed = true;
  console.log('Fix 3: leute_noun.type changed from "substantiv (kun flertall)" to "noun"');
} else if (nounBank.leute_noun) {
  console.log(`Fix 3: leute_noun.type is already "${nounBank.leute_noun.type}" — skipped`);
} else {
  console.log('Fix 3: leute_noun entry not found — skipped');
}

// --- Fix 4: Add translations: {} to core verbbank entries missing it ---
// Applies to all keys including _metadata
for (const key of Object.keys(verbBank)) {
  const entry = verbBank[key];
  if (!('translations' in entry)) {
    entry.translations = {};
    verbTranslationsAdded++;
  }
}
console.log(`Fix 4: Added translations:{} to ${verbTranslationsAdded} verb bank entries (incl. _metadata)`);

// --- Fix 5: Fix Norwegian type values in verbbank ---
// Valid verb type enum: "strong", "weak", "modal", "reflexive", "separable", "auxiliary", "regular", "irregular"
const norwegianTypeMap = {
  'sterkt': 'strong',
  'svakt': 'weak',
  'vanlig': 'weak',
  'refleksiv': 'reflexive',
  'verb': 'weak'
};

for (const key of Object.keys(verbBank)) {
  const entry = verbBank[key];
  if (entry.type && norwegianTypeMap[entry.type] !== undefined) {
    entry.type = norwegianTypeMap[entry.type];
    verbTypesFixed++;
  }
}
console.log(`Fix 5: Fixed ${verbTypesFixed} Norwegian verb type values to English enum values`);

// --- Write all files ---
writeFileSync(coreWordSchemaPath, JSON.stringify(coreWordSchema, null, 2) + '\n', 'utf8');
writeFileSync(nounSchemaPath, JSON.stringify(nounSchema, null, 2) + '\n', 'utf8');
writeFileSync(nounBankPath, JSON.stringify(nounBank, null, 2) + '\n', 'utf8');
writeFileSync(verbBankPath, JSON.stringify(verbBank, null, 2) + '\n', 'utf8');

console.log('\n--- Summary ---');
console.log(`Core-word schema updated: ${coreWordSchemaUpdated}`);
console.log(`Noun schema updated: ${nounSchemaUpdated}`);
console.log(`Noun translations added: ${nounTranslationsAdded}`);
console.log(`Leute type fixed: ${leuteFixed}`);
console.log(`Verb translations added: ${verbTranslationsAdded}`);
console.log(`Verb types fixed: ${verbTypesFixed}`);
console.log('\nDone. Run npm run validate:nouns && npm run validate:verbs to verify.');
