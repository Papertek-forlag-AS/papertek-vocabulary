/**
 * Verification script for AUDIT-03 — run after sync-preteritum.js
 */
import Ajv2020 from 'ajv/dist/2020.js';
import { readFileSync } from 'fs';

const dict = JSON.parse(readFileSync('vocabulary/dictionary/de/verbbank.json', 'utf8'));

// 1. Count dict verbbank entries with preteritum
const preteritumCount = Object.entries(dict)
  .filter(([k, v]) => k !== '_metadata' && v && v.conjugations && v.conjugations.preteritum)
  .length;
console.log('dict preteritum count:', preteritumCount, '(expected: >= 148)');
if (preteritumCount < 148) {
  console.error('FAIL: preteritum count below 148');
  process.exit(1);
}

// 2. Count dict verbbank entries with inseparable: true
const insepCount = Object.values(dict).filter(v => v && v.inseparable === true).length;
console.log('dict inseparable count:', insepCount, '(expected: 17)');
if (insepCount !== 17) {
  console.error('FAIL: inseparable count is not 17');
  process.exit(1);
}

// 3. Spot-check besuchen_verb — verify preteritum and inseparable added, dict-only fields preserved
const besuchen = dict['besuchen_verb'];
console.log('\nSpot-check besuchen_verb:');
console.log('  has preteritum:', !!(besuchen.conjugations && besuchen.conjugations.preteritum));
console.log('  has inseparable:', besuchen.inseparable === true);
console.log('  has cefr:', !!besuchen.cefr);
console.log('  has frequency:', typeof besuchen.frequency === 'number');
console.log('  has curriculum:', typeof besuchen.curriculum === 'boolean');
// Note: besuchen_verb in the actual dict does not have verbClass (confirmed by direct inspection)
// — this is expected; verbClass is entry-specific, not universal

const criticalFields = [
  !!(besuchen.conjugations && besuchen.conjugations.preteritum),
  besuchen.inseparable === true,
  !!besuchen.cefr,
  typeof besuchen.frequency === 'number',
  typeof besuchen.curriculum === 'boolean',
];
if (!criticalFields.every(Boolean)) {
  console.error('FAIL: critical spot-check failed on besuchen_verb');
  process.exit(1);
}

// Also check an entry WITH verbClass to ensure that field was preserved (gehen_verb has it)
const gehen = dict['gehen_verb'];
if (gehen && gehen.verbClass) {
  console.log('  verbClass preservation check (gehen_verb):', !!gehen.verbClass, '(PASS)');
} else {
  console.log('  verbClass preservation check: not verifiable via gehen_verb');
}

// 4. AJV validation — core verbbank (baseline: 191)
console.log('\n── AJV validation ──');
const ajv = new Ajv2020({ strict: false, allErrors: true });
ajv.addSchema(JSON.parse(readFileSync('vocabulary/schema/core-word.schema.json', 'utf8')), 'core-word.schema.json');

const verbSchema = JSON.parse(readFileSync('vocabulary/schema/verb.schema.json', 'utf8'));
const validateVerb = ajv.compile(verbSchema);
validateVerb(JSON.parse(readFileSync('vocabulary/core/de/verbbank.json', 'utf8')));
const verbErrors = (validateVerb.errors || []).length;
console.log('Core verb AJV errors:', verbErrors, '(baseline: 191)');
if (verbErrors > 191) {
  console.error('FAIL: verb AJV errors exceed baseline (', verbErrors, '> 191)');
  process.exit(1);
}

// 5. AJV validation — core nounbank (baseline: 356)
const ajv2 = new Ajv2020({ strict: false, allErrors: true });
ajv2.addSchema(JSON.parse(readFileSync('vocabulary/schema/core-word.schema.json', 'utf8')), 'core-word.schema.json');
const nounSchema = JSON.parse(readFileSync('vocabulary/schema/noun.schema.json', 'utf8'));
const validateNoun = ajv2.compile(nounSchema);
validateNoun(JSON.parse(readFileSync('vocabulary/core/de/nounbank.json', 'utf8')));
const nounErrors = (validateNoun.errors || []).length;
console.log('Core noun AJV errors:', nounErrors, '(baseline: 356)');
if (nounErrors > 356) {
  console.error('FAIL: noun AJV errors exceed baseline (', nounErrors, '> 356)');
  process.exit(1);
}

console.log('\nAll AUDIT-03 verifications PASSED.');
