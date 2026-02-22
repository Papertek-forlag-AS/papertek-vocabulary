/**
 * verify-integration.js
 *
 * Permanent end-to-end health check for v1.2 Sync & Integration milestone.
 * Verifies all 5 SYNC requirements across core and dictionary banks.
 *
 * SYNC-01: Perfektum conjugations synced from core verbbank to dict verbbank
 * SYNC-02: Noun declension (4 cases, declension_type, weak_masculine) synced
 * SYNC-03: search-index.json has pp field on all verb entries with perfektum
 * SYNC-04: v2 lookup handler emits grammar_noun_declension, grammar_genitiv,
 *           grammar_perfektum feature flags and exposes inseparable,
 *           weakMasculine, declensionType response fields
 * SYNC-05: AJV schema validation passes on all 4 banks (0 errors)
 *
 * Usage:  node scripts/verify-integration.js
 * Script: npm run verify:integration
 *
 * Exit 0 = all checks pass. Exit 1 = one or more checks failed.
 */

import Ajv2020 from 'ajv/dist/2020.js';
import { readFileSync } from 'fs';

let failures = 0;

function check(name, condition) {
  if (!condition) {
    console.error(`FAIL: ${name}`);
    failures++;
  } else {
    console.log(`PASS: ${name}`);
  }
}

// ── Load data ─────────────────────────────────────────────────────────────
const coreVerbBank  = JSON.parse(readFileSync('vocabulary/core/de/verbbank.json',       'utf8'));
const dictVerbBank  = JSON.parse(readFileSync('vocabulary/dictionary/de/verbbank.json', 'utf8'));
const coreNounBank  = JSON.parse(readFileSync('vocabulary/core/de/nounbank.json',       'utf8'));
const dictNounBank  = JSON.parse(readFileSync('vocabulary/dictionary/de/nounbank.json', 'utf8'));
const searchIndex   = JSON.parse(readFileSync('vocabulary/dictionary/de/search-index.json', 'utf8'));
const handlerSource = readFileSync('api/vocab/v2/lookup/[language]/[wordId].js', 'utf8');

const coreVerbKeys = Object.keys(coreVerbBank).filter(k => k !== '_metadata');
const dictVerbKeys = Object.keys(dictVerbBank).filter(k => k !== '_metadata');
const coreNounKeys = Object.keys(coreNounBank).filter(k => k !== '_metadata');

// ─────────────────────────────────────────────────────────────────────────
// SYNC-01: Perfektum synced from core verbbank to dict verbbank
// ─────────────────────────────────────────────────────────────────────────
console.log('\n── SYNC-01: Perfektum conjugations ──');

const coreWithPerfektum = coreVerbKeys.filter(k => coreVerbBank[k]?.conjugations?.perfektum?.participle);
check('SYNC-01: Core verbbank has 144 verbs with perfektum.participle', coreWithPerfektum.length === 144);

// Every core verb with perfektum must have matching participle in dict
const sync01Mismatches = coreWithPerfektum.filter(k => {
  const coreParticiple = coreVerbBank[k]?.conjugations?.perfektum?.participle;
  const dictParticiple = dictVerbBank[k]?.conjugations?.perfektum?.participle;
  return coreParticiple !== dictParticiple;
});
check('SYNC-01: All 144 core perfektum participles match dict verbbank', sync01Mismatches.length === 0);

// Spot-checks
check('SYNC-01: anfangen_verb pp === "angefangen"',
  dictVerbBank['anfangen_verb']?.conjugations?.perfektum?.participle === 'angefangen');
check('SYNC-01: besuchen_verb pp === "besucht"',
  dictVerbBank['besuchen_verb']?.conjugations?.perfektum?.participle === 'besucht');
check('SYNC-01: moechten_modal pp === "gemocht" (modal with modal_note)',
  dictVerbBank['moechten_modal']?.conjugations?.perfektum?.participle === 'gemocht');

// ─────────────────────────────────────────────────────────────────────────
// SYNC-02: Noun declension synced from core nounbank to dict nounbank
// ─────────────────────────────────────────────────────────────────────────
console.log('\n── SYNC-02: Noun declension data ──');

const coreWithNominativ = coreNounKeys.filter(k => coreNounBank[k]?.cases?.nominativ);
check('SYNC-02: Core nounbank has 331 nouns with cases.nominativ', coreWithNominativ.length === 331);

// Every core noun with nominativ must also have it in dict
const sync02MissingNominativ = coreWithNominativ.filter(k => !dictNounBank[k]?.cases?.nominativ);
check('SYNC-02: All 331 core nouns with cases.nominativ are synced to dict', sync02MissingNominativ.length === 0);

// declension_type must match between core and dict
const sync02DeclTypeMismatches = coreNounKeys.filter(k => {
  if (!coreNounBank[k]?.declension_type) return false;
  return coreNounBank[k].declension_type !== dictNounBank[k]?.declension_type;
});
check('SYNC-02: declension_type matches between core and dict for all nouns', sync02DeclTypeMismatches.length === 0);

// weak_masculine must be synced for n-Deklination nouns
const coreWeakMasc = coreNounKeys.filter(k => coreNounBank[k]?.weak_masculine === true);
const sync02WeakMascMismatches = coreWeakMasc.filter(k => dictNounBank[k]?.weak_masculine !== true);
check('SYNC-02: weak_masculine synced for all n-Deklination nouns', sync02WeakMascMismatches.length === 0);

// Spot-checks
check('SYNC-02: hund_noun has 4 cases in dict nounbank',
  ['nominativ','akkusativ','dativ','genitiv'].every(c => dictNounBank['hund_noun']?.cases?.[c]));
check('SYNC-02: baer_noun has weak_masculine in dict nounbank',
  dictNounBank['baer_noun']?.weak_masculine === true);

// ─────────────────────────────────────────────────────────────────────────
// SYNC-03: search-index.json has pp field on verb entries with perfektum
// ─────────────────────────────────────────────────────────────────────────
console.log('\n── SYNC-03: Search index pp field ──');

const indexEntries = searchIndex.entries;
const indexVerbs   = indexEntries.filter(e => e.t === 'verb');
const indexVerbsWithPP = indexVerbs.filter(e => e.pp);

check('SYNC-03: search-index.json total entries >= 3400', indexEntries.length >= 3400);
check('SYNC-03: search-index.json has 144 verb entries with pp field', indexVerbsWithPP.length === 144);

// pp values must match core verbbank participles (spot-check 5 known entries)
const ppSpotChecks = [
  ['anfangen_verb', 'angefangen'],
  ['sein_verb',     'gewesen'],
  ['besuchen_verb', 'besucht'],
  ['lernen_verb',   'gelernt'],
  ['kommen_verb',   'gekommen'],
];
for (const [id, expected] of ppSpotChecks) {
  const entry = indexEntries.find(e => e.id === id);
  check(`SYNC-03: ${id} pp === "${expected}"`, entry?.pp === expected);
}

// No noun entries must have pp field
const nounEntriesWithPP = indexEntries.filter(e => e.t === 'noun' && e.pp);
check('SYNC-03: No noun entries in search index have pp field', nounEntriesWithPP.length === 0);

// ─────────────────────────────────────────────────────────────────────────
// SYNC-04: v2 lookup handler feature flags and response fields
// ─────────────────────────────────────────────────────────────────────────
console.log('\n── SYNC-04: v2 lookup handler ──');

check('SYNC-04: handler contains grammar_noun_declension push logic',
  handlerSource.includes('grammar_noun_declension'));
check('SYNC-04: handler contains grammar_genitiv push logic',
  handlerSource.includes('grammar_genitiv'));
check('SYNC-04: handler contains grammar_perfektum push logic',
  handlerSource.includes('grammar_perfektum'));
check('SYNC-04: handler exposes response.inseparable field',
  handlerSource.includes('response.inseparable'));
check('SYNC-04: handler exposes response.weakMasculine field',
  handlerSource.includes('response.weakMasculine'));
check('SYNC-04: handler exposes response.declensionType field',
  handlerSource.includes('response.declensionType'));

// ─────────────────────────────────────────────────────────────────────────
// SYNC-05: AJV schema validation passes on all 4 banks
// ─────────────────────────────────────────────────────────────────────────
console.log('\n── SYNC-05: AJV schema validation ──');

const coreSchema = JSON.parse(readFileSync('vocabulary/schema/core-word.schema.json', 'utf8'));
const nounSchema = JSON.parse(readFileSync('vocabulary/schema/noun.schema.json',      'utf8'));
const verbSchema = JSON.parse(readFileSync('vocabulary/schema/verb.schema.json',      'utf8'));

function validateBank(bank, schema, schemaId, bankLabel) {
  const ajv = new Ajv2020({ strict: false, allErrors: true });
  ajv.addSchema(coreSchema, 'core-word.schema.json');
  ajv.addSchema(schema);
  const validate = ajv.getSchema(schemaId);
  if (!validate) {
    check(`SYNC-05: ${bankLabel} — schema not found`, false);
    return;
  }
  const valid = validate(bank);
  const count = Object.keys(bank).filter(k => k !== '_metadata').length;
  check(
    `SYNC-05: ${bankLabel} (${count} entries) passes AJV validation`,
    valid
  );
}

validateBank(
  coreNounBank,
  nounSchema,
  'https://papertek.no/schemas/vocabulary/noun.schema.json',
  'Core nounbank'
);

validateBank(
  JSON.parse(readFileSync('vocabulary/dictionary/de/nounbank.json', 'utf8')),
  nounSchema,
  'https://papertek.no/schemas/vocabulary/noun.schema.json',
  'Dict nounbank'
);

validateBank(
  coreVerbBank,
  verbSchema,
  'https://papertek.no/schemas/vocabulary/verb.schema.json',
  'Core verbbank'
);

validateBank(
  dictVerbBank,
  verbSchema,
  'https://papertek.no/schemas/vocabulary/verb.schema.json',
  'Dict verbbank'
);

// ─────────────────────────────────────────────────────────────────────────
// Summary
// ─────────────────────────────────────────────────────────────────────────
console.log('\n──────────────────────────────────────');
if (failures === 0) {
  console.log(`ALL CHECKS PASSED — v1.2 Sync & Integration requirements met`);
} else {
  console.error(`${failures} check(s) FAILED — see FAIL lines above`);
}
process.exit(failures > 0 ? 1 : 0);
