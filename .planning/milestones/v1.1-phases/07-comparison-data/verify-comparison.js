/**
 * Phase 7 — Comprehensive spot-check and data integrity verification (Task 2).
 * Verifies all ~35 exception entries plus cross-bank consistency and coverage.
 *
 * Run: node .planning/phases/07-comparison-data/verify-comparison.js
 */

import { readFileSync } from 'fs';

const core = JSON.parse(readFileSync('vocabulary/core/de/adjectivebank.json', 'utf8'));
const dict = JSON.parse(readFileSync('vocabulary/dictionary/de/adjectivebank.json', 'utf8'));

let passed = 0;
let failed = 0;

function check(label, actual, expected) {
  if (actual === expected) {
    console.log('PASS:', label);
    passed++;
  } else {
    console.log('FAIL:', label, '| expected:', JSON.stringify(expected), '| got:', JSON.stringify(actual));
    failed++;
  }
}

// ── 1. Suppletive irregulars ──────────────────────────────────────────────
console.log('\n=== 1. Suppletive irregulars ===');
check('gut komparativ',   core.gut_adj?.comparison?.komparativ,  'besser');
check('gut superlativ',   core.gut_adj?.comparison?.superlativ,  'best');
check('viel komparativ',  core.viel_adj?.comparison?.komparativ, 'mehr');
check('viel superlativ',  core.viel_adj?.comparison?.superlativ, 'meist');
check('hoch komparativ',  core.hoch_adj?.comparison?.komparativ, 'höher');
check('hoch superlativ',  core.hoch_adj?.comparison?.superlativ, 'höchst');
// nah_adj is NOT in the bank — verified in Task 1 research

// ── 2. Umlaut irregulars ─────────────────────────────────────────────────
console.log('\n=== 2. Umlaut irregulars (15 + gesund + schwach) ===');
check('alt komparativ',    core.alt_adj?.comparison?.komparativ,    'älter');
check('alt superlativ',    core.alt_adj?.comparison?.superlativ,    'ältest');
check('arm komparativ',    core.arm_adj?.comparison?.komparativ,    'ärmer');
check('arm superlativ',    core.arm_adj?.comparison?.superlativ,    'ärmst');
check('groß komparativ',   core.gross_adj?.comparison?.komparativ,  'größer');
check('groß superlativ',   core.gross_adj?.comparison?.superlativ,  'größt');
check('hart komparativ',   core.hart_adj?.comparison?.komparativ,   'härter');
check('hart superlativ',   core.hart_adj?.comparison?.superlativ,   'härtest');
check('jung komparativ',   core.jung_adj?.comparison?.komparativ,   'jünger');
check('jung superlativ',   core.jung_adj?.comparison?.superlativ,   'jüngst');
check('kalt komparativ',   core.kalt_adj?.comparison?.komparativ,   'kälter');
check('kalt superlativ',   core.kalt_adj?.comparison?.superlativ,   'kältest');
check('kurz komparativ',   core.kurz_adj?.comparison?.komparativ,   'kürzer');
check('kurz superlativ',   core.kurz_adj?.comparison?.superlativ,   'kürzest');
check('lang komparativ',   core.lang_adj?.comparison?.komparativ,   'länger');
check('lang superlativ',   core.lang_adj?.comparison?.superlativ,   'längst');
check('scharf komparativ', core.scharf_adj?.comparison?.komparativ, 'schärfer');
check('scharf superlativ', core.scharf_adj?.comparison?.superlativ, 'schärfst');
check('stark komparativ',  core.stark_adj?.comparison?.komparativ,  'stärker');
check('stark superlativ',  core.stark_adj?.comparison?.superlativ,  'stärkst');
check('warm komparativ',   core.warm_adj?.comparison?.komparativ,   'wärmer');
check('warm superlativ',   core.warm_adj?.comparison?.superlativ,   'wärmst');
check('krank komparativ',  core.krank_adj?.comparison?.komparativ,  'kränker');
check('krank superlativ',  core.krank_adj?.comparison?.superlativ,  'kränkst');
check('dumm komparativ',   core.dumm_adj?.comparison?.komparativ,   'dümmer');
check('dumm superlativ',   core.dumm_adj?.comparison?.superlativ,   'dümmst');
check('klug komparativ',   core.klug_adj?.comparison?.komparativ,   'klüger');
check('klug superlativ',   core.klug_adj?.comparison?.superlativ,   'klügst');
check('nass komparativ',   core.nass_adj?.comparison?.komparativ,   'nässer');
check('nass superlativ',   core.nass_adj?.comparison?.superlativ,   'nässest');
check('gesund komparativ', core.gesund_adj?.comparison?.komparativ, 'gesünder');
check('gesund superlativ', core.gesund_adj?.comparison?.superlativ, 'gesündest');
check('schwach komparativ',core.schwach_adj?.comparison?.komparativ,'schwächer');
check('schwach superlativ',core.schwach_adj?.comparison?.superlativ,'schwächst');

// ── 3. Consonant-cluster superlative exceptions ───────────────────────────
console.log('\n=== 3. Consonant-cluster exceptions ===');
check('blind komparativ', core.blind_adj?.comparison?.komparativ, 'blinder');
check('blind superlativ', core.blind_adj?.comparison?.superlativ, 'blindest');
check('rund komparativ',  core.rund_adj?.comparison?.komparativ,  'runder');
check('rund superlativ',  core.rund_adj?.comparison?.superlativ,  'rundest');
check('mild komparativ',  core.mild_adj?.comparison?.komparativ,  'milder');
check('mild superlativ',  core.mild_adj?.comparison?.superlativ,  'mildest');
check('wild komparativ',  core.wild_adj?.comparison?.komparativ,  'wilder');
check('wild superlativ',  core.wild_adj?.comparison?.superlativ,  'wildest');
check('fremd komparativ', core.fremd_adj?.comparison?.komparativ, 'fremder');
check('fremd superlativ', core.fremd_adj?.comparison?.superlativ, 'fremdest');

// ── 4. -er e-drop irregulars ─────────────────────────────────────────────
console.log('\n=== 4. -er e-drop irregulars ===');
check('teuer komparativ', core.teuer_adj?.comparison?.komparativ, 'teurer');
check('teuer superlativ', core.teuer_adj?.comparison?.superlativ, 'teuerst');
check('sauer komparativ', core.sauer_adj?.comparison?.komparativ, 'saurer');
check('sauer superlativ', core.sauer_adj?.comparison?.superlativ, 'sauerst');

// ── 5. Undeclinable entries ───────────────────────────────────────────────
console.log('\n=== 5. Undeclinable entries ===');
const undeclinableIds = ['lila_adj', 'rosa_adj', 'orange_adj', 'cool_adj', 'gern_adj'];
for (const id of undeclinableIds) {
  const e = core[id];
  check(id + ' undeclinable=true',   e?.undeclinable,  true);
  check(id + ' comparison=undefined',e?.comparison,    undefined);
  check(id + ' declension=undefined',e?.declension,    undefined);
}

// ── 6. Nicht-komparierbar entries ─────────────────────────────────────────
console.log('\n=== 6. Nicht-komparierbar entries ===');
const nichtKompIds = ['absolut_adj', 'ideal_adj', 'maximal_adj', 'minimal_adj', 'perfekt_adj', 'rein_adj', 'tot_adj', 'total_adj'];
for (const id of nichtKompIds) {
  const e = core[id];
  check(id + ' nicht_komparierbar=true', e?.nicht_komparierbar, true);
  check(id + ' comparison=undefined',    e?.comparison,         undefined);
}

// ── 7. Cross-bank consistency ─────────────────────────────────────────────
console.log('\n=== 7. Cross-bank consistency ===');
const coreIds = Object.keys(core).filter(k => k !== '_metadata');
let mismatches = 0;
for (const id of coreIds) {
  const ce = core[id];
  const de = dict[id];
  if (!de) {
    console.log('FAIL: dict missing entry:', id);
    mismatches++;
    continue;
  }
  const cComp = JSON.stringify(ce.comparison);
  const dComp = JSON.stringify(de.comparison);
  if (cComp !== dComp) {
    console.log('FAIL: comparison mismatch for', id, '| core:', cComp, '| dict:', dComp);
    mismatches++;
  }
  if (ce.undeclinable !== de.undeclinable) {
    console.log('FAIL: undeclinable mismatch for', id);
    mismatches++;
  }
  if (ce.nicht_komparierbar !== de.nicht_komparierbar) {
    console.log('FAIL: nicht_komparierbar mismatch for', id);
    mismatches++;
  }
}
check('Cross-bank mismatches (should be 0)', mismatches, 0);

// ── 8. Coverage check ────────────────────────────────────────────────────
console.log('\n=== 8. Coverage check ===');
const allIds = Object.keys(core).filter(k => k !== '_metadata');
const countComparable   = allIds.filter(id => core[id]?.comparison?.komparativ).length;
const countUndeclinable = allIds.filter(id => core[id]?.undeclinable === true).length;
const countNK           = allIds.filter(id => core[id]?.nicht_komparierbar === true).length;
const total             = countComparable + countUndeclinable + countNK;

console.log('  Comparable (with komparativ):', countComparable, '(expected 352)');
console.log('  Undeclinable:', countUndeclinable, '(expected 5)');
console.log('  Nicht-komparierbar:', countNK, '(expected 8)');
console.log('  Total accounted for:', total, '(expected 365)');

check('Comparable count = 352',    countComparable,   352);
check('Undeclinable count = 5',    countUndeclinable, 5);
check('Nicht-komparierbar count = 8', countNK,        8);
check('Total coverage = 365',      total,             365);

// ── Final Summary ────────────────────────────────────────────────────────
console.log('\n=== SUMMARY ===');
console.log('PASSED:', passed);
console.log('FAILED:', failed);
if (failed === 0) {
  console.log('\nALL CHECKS PASSED — COMP-03 satisfied.');
  process.exit(0);
} else {
  console.log('\nSOME CHECKS FAILED — fix issues before proceeding.');
  process.exit(1);
}
