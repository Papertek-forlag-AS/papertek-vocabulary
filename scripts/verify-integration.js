/**
 * verify-integration.js
 *
 * End-to-end health check for the consolidated single-bank vocabulary structure.
 * Verifies all 5 SYNC requirements against vocabulary/banks/de/ (merged banks).
 *
 * SYNC-01: Perfektum conjugations present on 144 verb entries in merged verbbank
 * SYNC-02: Noun declension (4 cases, declension_type, weak_masculine) on 331 noun entries
 * SYNC-03: search-index.json has pp field on all verb entries with perfektum
 * SYNC-04: v2 lookup handler emits grammar_noun_declension, grammar_genitiv,
 *           grammar_perfektum feature flags and exposes inseparable,
 *           weakMasculine, declensionType response fields
 * SYNC-05: AJV schema validation passes on merged noun and verb banks
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
const verbBank    = JSON.parse(readFileSync('vocabulary/banks/de/verbbank.json',    'utf8'));
const nounBank    = JSON.parse(readFileSync('vocabulary/banks/de/nounbank.json',    'utf8'));
const searchIndex = JSON.parse(readFileSync('vocabulary/banks/de/search-index.json', 'utf8'));
const handlerSource = readFileSync('api/vocab/v2/lookup/[language]/[wordId].js', 'utf8');

const verbKeys = Object.keys(verbBank).filter(k => k !== '_metadata');
const nounKeys = Object.keys(nounBank).filter(k => k !== '_metadata');

// Strip _metadata for schema validation
const { _metadata: _vm, ...verbEntries } = verbBank;
const { _metadata: _nm, ...nounEntries } = nounBank;

// ─────────────────────────────────────────────────────────────────────────
// SYNC-01: Perfektum conjugations in merged verbbank
// ─────────────────────────────────────────────────────────────────────────
console.log('\n── SYNC-01: Perfektum conjugations ──');

const verbsWithPerfektum = verbKeys.filter(k => verbBank[k]?.conjugations?.perfektum?.participle);
check('SYNC-01: Merged verbbank has 144 verbs with perfektum.participle', verbsWithPerfektum.length === 144);

// Spot-checks
check('SYNC-01: anfangen_verb pp === "angefangen"',
  verbBank['anfangen_verb']?.conjugations?.perfektum?.participle === 'angefangen');
check('SYNC-01: besuchen_verb pp === "besucht"',
  verbBank['besuchen_verb']?.conjugations?.perfektum?.participle === 'besucht');
check('SYNC-01: moechten_modal pp === "gemocht"',
  verbBank['moechten_modal']?.conjugations?.perfektum?.participle === 'gemocht');

// ─────────────────────────────────────────────────────────────────────────
// SYNC-02: Noun declension data in merged nounbank
// ─────────────────────────────────────────────────────────────────────────
console.log('\n── SYNC-02: Noun declension data ──');

const nounsWithNominativ = nounKeys.filter(k => nounBank[k]?.cases?.nominativ);
check('SYNC-02: Merged nounbank has 331 nouns with cases.nominativ', nounsWithNominativ.length === 331);

// Every noun with nominativ must have all 4 cases
const missingCases = nounsWithNominativ.filter(k => {
  return !['nominativ','akkusativ','dativ','genitiv'].every(c => nounBank[k]?.cases?.[c]);
});
check('SYNC-02: All 331 nouns with nominativ have all 4 cases', missingCases.length === 0);

// weak_masculine nouns present
const weakMascNouns = nounKeys.filter(k => nounBank[k]?.weak_masculine === true);
check('SYNC-02: Merged nounbank has at least 1 weak_masculine noun', weakMascNouns.length > 0);

// Spot-checks
check('SYNC-02: hund_noun has 4 cases in merged nounbank',
  ['nominativ','akkusativ','dativ','genitiv'].every(c => nounBank['hund_noun']?.cases?.[c]));
check('SYNC-02: baer_noun has weak_masculine in merged nounbank',
  nounBank['baer_noun']?.weak_masculine === true);

// ─────────────────────────────────────────────────────────────────────────
// SYNC-03: search-index.json has pp field on verb entries with perfektum
// ─────────────────────────────────────────────────────────────────────────
console.log('\n── SYNC-03: Search index pp field ──');

const indexEntries = searchIndex.entries;
const indexVerbs   = indexEntries.filter(e => e.t === 'verb');
const indexVerbsWithPP = indexVerbs.filter(e => e.pp);

check('SYNC-03: search-index.json total entries >= 3400', indexEntries.length >= 3400);
check('SYNC-03: search-index.json has 144 verb entries with pp field', indexVerbsWithPP.length === 144);

// pp values spot-check
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
// SYNC-05: AJV schema validation passes on merged banks
// ─────────────────────────────────────────────────────────────────────────
console.log('\n── SYNC-05: AJV schema validation ──');

const coreSchema = JSON.parse(readFileSync('vocabulary/schema/core-word.schema.json', 'utf8'));
const nounSchema = JSON.parse(readFileSync('vocabulary/schema/noun.schema.json',      'utf8'));
const verbSchema = JSON.parse(readFileSync('vocabulary/schema/verb.schema.json',      'utf8'));

function validateBank(entries, schema, schemaId, bankLabel) {
  const ajv = new Ajv2020({ strict: false, allErrors: true });
  ajv.addSchema(coreSchema, 'core-word.schema.json');
  ajv.addSchema(schema);
  const validate = ajv.getSchema(schemaId);
  if (!validate) {
    check(`SYNC-05: ${bankLabel} — schema not found`, false);
    return;
  }
  const valid = validate(entries);
  const count = Object.keys(entries).length;
  check(
    `SYNC-05: ${bankLabel} (${count} entries) passes AJV validation`,
    valid
  );
}

validateBank(
  nounEntries,
  nounSchema,
  'https://papertek.no/schemas/vocabulary/noun.schema.json',
  'Merged nounbank'
);

validateBank(
  verbEntries,
  verbSchema,
  'https://papertek.no/schemas/vocabulary/verb.schema.json',
  'Merged verbbank'
);

// ─────────────────────────────────────────────────────────────────────────
// Summary
// ─────────────────────────────────────────────────────────────────────────
console.log('\n──────────────────────────────────────');
if (failures === 0) {
  console.log(`ALL CHECKS PASSED — vocabulary/banks/de/ single-bank structure verified`);
} else {
  console.error(`${failures} check(s) FAILED — see FAIL lines above`);
}
process.exit(failures > 0 ? 1 : 0);
