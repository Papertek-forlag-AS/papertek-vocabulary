/**
 * Phase 8 — Declension Verification Script
 * Spot-checks all irregular and edge-case adjective declension forms,
 * verifies coverage counts, confirms cross-bank consistency, and
 * generates IRREGULAR-REVIEW.md for human sanity-checking.
 *
 * Run: node .planning/phases/08-declension-tables/verify-declension.js
 *
 * This script is a permanent project asset — rerun after any bank data change
 * to confirm declension integrity.
 */

import { readFileSync, writeFileSync } from 'fs';

const PROJECT_ROOT = process.cwd();
const CORE_PATH = `${PROJECT_ROOT}/vocabulary/core/de/adjectivebank.json`;
const DICT_PATH = `${PROJECT_ROOT}/vocabulary/dictionary/de/adjectivebank.json`;

const core = JSON.parse(readFileSync(CORE_PATH, 'utf8'));
const dict = JSON.parse(readFileSync(DICT_PATH, 'utf8'));

let passed = 0;
let failed = 0;

/**
 * Helper: assert that actual === expected, log result.
 */
function check(label, actual, expected) {
  if (actual === expected) {
    console.log(`  PASS  ${label}`);
    passed++;
  } else {
    console.error(`  FAIL  ${label}`);
    console.error(`        expected: ${JSON.stringify(expected)}`);
    console.error(`        actual:   ${JSON.stringify(actual)}`);
    failed++;
  }
}

/**
 * Helper: shorthand to navigate declension path.
 * e.g. decl(entry, 'positiv', 'stark', 'nominativ', 'maskulin')
 */
function decl(entry, degree, article, caseKey, gender) {
  return entry?.declension?.[degree]?.[article]?.[caseKey]?.[gender];
}


// ─────────────────────────────────────────────────────────────────────────────
// 1. SUPPLETIVE IRREGULARS — POSITIV
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n1. Suppletive irregulars — positiv');

check('gut positiv stark.nom.m',      decl(core.gut_adj,  'positiv', 'stark', 'nominativ', 'maskulin'),  'guter');
check('gut positiv stark.nom.f',      decl(core.gut_adj,  'positiv', 'stark', 'nominativ', 'feminin'),   'gute');
check('viel positiv stark.nom.m',     decl(core.viel_adj, 'positiv', 'stark', 'nominativ', 'maskulin'),  'vieler');
check('hoch positiv stark.nom.m',     decl(core.hoch_adj, 'positiv', 'stark', 'nominativ', 'maskulin'),  'hoher');
// SC-3 CRITICAL: hohem must appear, hochem must NOT
check('hoch positiv stark.dat.m',     decl(core.hoch_adj, 'positiv', 'stark', 'dativ',     'maskulin'),  'hohem');
check('hoch positiv schwach.nom.m',   decl(core.hoch_adj, 'positiv', 'schwach', 'nominativ', 'maskulin'), 'hohe');
check('hoch positiv stark.nom.n',     decl(core.hoch_adj, 'positiv', 'stark', 'nominativ', 'neutrum'),   'hohes');
check('hoch positiv gemischt.nom.m',  decl(core.hoch_adj, 'positiv', 'gemischt', 'nominativ', 'maskulin'), 'hoher');


// ─────────────────────────────────────────────────────────────────────────────
// 2. SUPPLETIVE IRREGULARS — KOMPARATIV
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n2. Suppletive irregulars — komparativ');

check('gut komparativ stark.nom.m',   decl(core.gut_adj,  'komparativ', 'stark', 'nominativ', 'maskulin'),  'besserer');
check('gut komparativ stark.nom.f',   decl(core.gut_adj,  'komparativ', 'stark', 'nominativ', 'feminin'),   'bessere');
check('gut komparativ stark.nom.n',   decl(core.gut_adj,  'komparativ', 'stark', 'nominativ', 'neutrum'),   'besseres');
check('gut komparativ stark.dat.m',   decl(core.gut_adj,  'komparativ', 'stark', 'dativ',     'maskulin'),  'besserem');
check('viel komparativ stark.nom.m',  decl(core.viel_adj, 'komparativ', 'stark', 'nominativ', 'maskulin'),  'mehrerer');
check('viel komparativ stark.nom.f',  decl(core.viel_adj, 'komparativ', 'stark', 'nominativ', 'feminin'),   'mehrere');
check('viel komparativ stark.dat.m',  decl(core.viel_adj, 'komparativ', 'stark', 'dativ',     'maskulin'),  'mehrerem');
check('hoch komparativ stark.nom.m',  decl(core.hoch_adj, 'komparativ', 'stark', 'nominativ', 'maskulin'),  'höherer');
check('hoch komparativ stark.nom.f',  decl(core.hoch_adj, 'komparativ', 'stark', 'nominativ', 'feminin'),   'höhere');
check('hoch komparativ schwach.dat.m', decl(core.hoch_adj, 'komparativ', 'schwach', 'dativ',  'maskulin'),  'höheren');


// ─────────────────────────────────────────────────────────────────────────────
// 3. SUPPLETIVE IRREGULARS — SUPERLATIV
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n3. Suppletive irregulars — superlativ');

check('gut superlativ schwach.nom.m',  decl(core.gut_adj,  'superlativ', 'schwach', 'nominativ', 'maskulin'),  'beste');
check('gut superlativ schwach.nom.f',  decl(core.gut_adj,  'superlativ', 'schwach', 'nominativ', 'feminin'),   'beste');
check('gut superlativ schwach.dat.m',  decl(core.gut_adj,  'superlativ', 'schwach', 'dativ',     'maskulin'),  'besten');
check('gut superlativ schwach.nom.n',  decl(core.gut_adj,  'superlativ', 'schwach', 'nominativ', 'neutrum'),   'beste');
check('viel superlativ schwach.nom.f', decl(core.viel_adj, 'superlativ', 'schwach', 'nominativ', 'feminin'),   'meiste');
check('viel superlativ schwach.dat.m', decl(core.viel_adj, 'superlativ', 'schwach', 'dativ',     'maskulin'),  'meisten');
check('hoch superlativ schwach.nom.n', decl(core.hoch_adj, 'superlativ', 'schwach', 'nominativ', 'neutrum'),   'höchste');
check('hoch superlativ schwach.dat.m', decl(core.hoch_adj, 'superlativ', 'schwach', 'dativ',     'maskulin'),  'höchsten');


// ─────────────────────────────────────────────────────────────────────────────
// 4. E-DROP EXCEPTIONS — POSITIV
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n4. E-drop exceptions — positiv');

check('dunkel positiv stark.nom.m',   decl(core.dunkel_adj,   'positiv', 'stark', 'nominativ', 'maskulin'),  'dunkler');
check('dunkel positiv stark.nom.f',   decl(core.dunkel_adj,   'positiv', 'stark', 'nominativ', 'feminin'),   'dunkle');
check('dunkel positiv stark.nom.n',   decl(core.dunkel_adj,   'positiv', 'stark', 'nominativ', 'neutrum'),   'dunkles');
check('dunkel positiv stark.dat.m',   decl(core.dunkel_adj,   'positiv', 'stark', 'dativ',     'maskulin'),  'dunklem');
check('dunkel positiv schwach.nom.m', decl(core.dunkel_adj,   'positiv', 'schwach', 'nominativ', 'maskulin'), 'dunkle');
check('flexibel positiv stark.nom.m', decl(core.flexibel_adj, 'positiv', 'stark', 'nominativ', 'maskulin'),  'flexibler');
check('flexibel positiv stark.nom.f', decl(core.flexibel_adj, 'positiv', 'stark', 'nominativ', 'feminin'),   'flexible');
check('flexibel positiv stark.dat.m', decl(core.flexibel_adj, 'positiv', 'stark', 'dativ',     'maskulin'),  'flexiblem');
check('teuer positiv stark.nom.m',    decl(core.teuer_adj,    'positiv', 'stark', 'nominativ', 'maskulin'),  'teurer');
check('teuer positiv stark.nom.n',    decl(core.teuer_adj,    'positiv', 'stark', 'nominativ', 'neutrum'),   'teures');
check('teuer positiv stark.dat.m',    decl(core.teuer_adj,    'positiv', 'stark', 'dativ',     'maskulin'),  'teurem');


// ─────────────────────────────────────────────────────────────────────────────
// 5. E-DROP EXCEPTIONS — KOMPARATIV AND SUPERLATIV
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n5. E-drop exceptions — komparativ and superlativ');

// dunkel: comparison.komparativ = 'dunkler' (rule-generated with e-drop)
// dunkler (full komparativ form) + endings:
//   stark.nom.m: dunkler + er = dunklerer
//   stark.nom.f: dunkler + e  = dunklere
//   stark.dat.m: dunkler + em = dunklereм (not dunklerer — dat.m is 'em', dat.f is 'er')
//   stark.dat.f: dunkler + er = dunklerer
check('dunkel komparativ stark.nom.m',  decl(core.dunkel_adj, 'komparativ', 'stark', 'nominativ', 'maskulin'),  'dunklerer');
check('dunkel komparativ stark.nom.f',  decl(core.dunkel_adj, 'komparativ', 'stark', 'nominativ', 'feminin'),   'dunklere');
check('dunkel komparativ stark.dat.m',  decl(core.dunkel_adj, 'komparativ', 'stark', 'dativ',     'maskulin'),  'dunklerem');
check('dunkel komparativ stark.dat.f',  decl(core.dunkel_adj, 'komparativ', 'stark', 'dativ',     'feminin'),   'dunklerer');

// dunkel superlativ: comparison.superlativ = 'dunkelst' (full word + st from rule engine)
check('dunkel superlativ schwach.nom.m', decl(core.dunkel_adj, 'superlativ', 'schwach', 'nominativ', 'maskulin'), 'dunkelste');
check('dunkel superlativ schwach.dat.m', decl(core.dunkel_adj, 'superlativ', 'schwach', 'dativ',     'maskulin'), 'dunkelsten');

// teuer: comparison.komparativ = 'teurer' (from EXCEPTIONS table)
// teurer (full komparativ form) + er = teurerer
check('teuer komparativ stark.nom.m',   decl(core.teuer_adj, 'komparativ', 'stark', 'nominativ', 'maskulin'),  'teurerer');
check('teuer komparativ stark.nom.n',   decl(core.teuer_adj, 'komparativ', 'stark', 'nominativ', 'neutrum'),   'teureres');
check('teuer komparativ stark.dat.m',   decl(core.teuer_adj, 'komparativ', 'stark', 'dativ',     'maskulin'),  'teurerem');

// teuer superlativ: comparison.superlativ = 'teuerst' (from EXCEPTIONS table)
check('teuer superlativ schwach.nom.m', decl(core.teuer_adj, 'superlativ', 'schwach', 'nominativ', 'maskulin'), 'teuerste');
check('teuer superlativ schwach.dat.m', decl(core.teuer_adj, 'superlativ', 'schwach', 'dativ',     'maskulin'), 'teuersten');


// ─────────────────────────────────────────────────────────────────────────────
// 6. REGULAR ADJECTIVE SANITY CHECKS
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n6. Regular adjective sanity checks');

check('schnell positiv stark.nom.m',   decl(core.schnell_adj, 'positiv',   'stark',  'nominativ', 'maskulin'), 'schneller');
check('schnell positiv stark.dat.m',   decl(core.schnell_adj, 'positiv',   'stark',  'dativ',     'maskulin'), 'schnellem');
check('schnell komparativ stark.nom.m', decl(core.schnell_adj, 'komparativ', 'stark', 'nominativ', 'maskulin'), 'schnellerer');
check('schnell komparativ stark.nom.f', decl(core.schnell_adj, 'komparativ', 'stark', 'nominativ', 'feminin'),  'schnellere');
check('schnell komparativ stark.dat.m', decl(core.schnell_adj, 'komparativ', 'stark', 'dativ',     'maskulin'), 'schnellerem');
check('schnell superlativ schwach.nom.m', decl(core.schnell_adj, 'superlativ', 'schwach', 'nominativ', 'maskulin'), 'schnellste');
check('schnell superlativ schwach.dat.m', decl(core.schnell_adj, 'superlativ', 'schwach', 'dativ',    'maskulin'), 'schnellsten');

// Umlaut sanity check (verify umlaut word handled correctly)
// schoen_adj uses oe encoding; comparison data has 'schöner', 'schönst'
check('schoen positiv stark.nom.f',   decl(core.schoen_adj, 'positiv',   'stark',  'nominativ', 'feminin'),  'schöne');
check('schoen komparativ stark.nom.m', decl(core.schoen_adj, 'komparativ', 'stark', 'nominativ', 'maskulin'), 'schönerer');
check('schoen superlativ schwach.nom.m', decl(core.schoen_adj, 'superlativ', 'schwach', 'nominativ', 'maskulin'), 'schönste');

// Umlaut irregulars check
check('alt komparativ stark.nom.m',   decl(core.alt_adj,   'komparativ', 'stark', 'nominativ', 'maskulin'),  'älterer');
check('jung komparativ stark.nom.m',  decl(core.jung_adj,  'komparativ', 'stark', 'nominativ', 'maskulin'),  'jüngerer');
check('gross komparativ stark.nom.m', decl(core.gross_adj, 'komparativ', 'stark', 'nominativ', 'maskulin'),  'größerer');
check('lang superlativ schwach.nom.m', decl(core.lang_adj, 'superlativ', 'schwach', 'nominativ', 'maskulin'), 'längste');
check('kurz superlativ schwach.nom.m', decl(core.kurz_adj, 'superlativ', 'schwach', 'nominativ', 'maskulin'), 'kürzeste');


// ─────────────────────────────────────────────────────────────────────────────
// 7. NICHT_KOMPARIERBAR CHECKS
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n7. Nicht_komparierbar checks');

check('absolut has declension.positiv', !!core.absolut_adj.declension?.positiv,    true);
check('absolut no declension.komparativ', core.absolut_adj.declension?.komparativ, undefined);
check('absolut no declension.superlativ', core.absolut_adj.declension?.superlativ, undefined);
check('absolut positiv stark.nom.m',    decl(core.absolut_adj, 'positiv', 'stark', 'nominativ', 'maskulin'), 'absoluter');
check('perfekt has declension.positiv', !!core.perfekt_adj.declension?.positiv,    true);
check('perfekt no declension.komparativ', core.perfekt_adj.declension?.komparativ, undefined);
check('ideal has declension.positiv',   !!core.ideal_adj.declension?.positiv,      true);
check('total positiv stark.nom.m',      decl(core.total_adj, 'positiv', 'stark', 'nominativ', 'maskulin'),   'totaler');


// ─────────────────────────────────────────────────────────────────────────────
// 8. UNDECLINABLE CHECKS
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n8. Undeclinable checks');

check('lila has no declension key',   core.lila_adj.declension,   undefined);
check('cool has no declension key',   core.cool_adj.declension,   undefined);
check('rosa has no declension key',   core.rosa_adj.declension,   undefined);
check('orange has no declension key', core.orange_adj.declension, undefined);
check('gern has no declension key',   core.gern_adj.declension,   undefined);


// ─────────────────────────────────────────────────────────────────────────────
// 9. COVERAGE COUNTS (DECL-01 through DECL-05)
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n9. Coverage counts');

const coreEntries = Object.entries(core).filter(([k]) => k !== '_metadata');

const withPositiv    = coreEntries.filter(([,v]) => v.declension?.positiv).length;
const withKomparativ = coreEntries.filter(([,v]) => v.declension?.komparativ).length;
const withSuperlativ = coreEntries.filter(([,v]) => v.declension?.superlativ).length;
const undeclinable   = coreEntries.filter(([,v]) => v.undeclinable).length;
const noDeclension   = coreEntries.filter(([,v]) => v.declension === undefined && !v.undeclinable).length;
const total          = coreEntries.length;

check('DECL-01: 360 entries have declension.positiv',    withPositiv,    360);
check('DECL-02: 352 entries have declension.komparativ', withKomparativ, 352);
check('DECL-03: 352 entries have declension.superlativ', withSuperlativ, 352);
check('DECL-04: 5 undeclinable entries',                 undeclinable,   5);
check('DECL-04: 0 declinable entries missing declension', noDeclension,  0);
check('Total entries: 365',                              total,          365);

console.log(`\n  Coverage summary: ${withPositiv} positiv, ${withKomparativ} komparativ, ${withSuperlativ} superlativ, ${undeclinable} undeclinable`);


// ─────────────────────────────────────────────────────────────────────────────
// 10. CROSS-BANK CONSISTENCY (DECL-05)
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n10. Cross-bank consistency');

let mismatches = 0;
for (const [id, coreEntry] of coreEntries) {
  const dictEntry = dict[id];
  if (!dictEntry) {
    console.error(`  MISMATCH  ${id}: entry exists in core but not in dict`);
    mismatches++;
    continue;
  }
  const coreDeclStr = JSON.stringify(coreEntry.declension);
  const dictDeclStr = JSON.stringify(dictEntry.declension);
  if (coreDeclStr !== dictDeclStr) {
    console.error(`  MISMATCH  ${id}: declension data differs between core and dict`);
    mismatches++;
  }
}

if (mismatches === 0) {
  console.log(`  PASS  Cross-bank consistency: 0 mismatches across ${coreEntries.length} entries`);
  passed++;
} else {
  console.error(`  FAIL  Cross-bank consistency: ${mismatches} mismatches found`);
  failed++;
}


// ─────────────────────────────────────────────────────────────────────────────
// 11. ALTERNATIVE FORMS CHECK
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n11. Alternative forms');

check('teuer has declension_alternatives key', !!core.teuer_adj.declension_alternatives, true);
check('teuer alternatives positiv stark.nom.m', core.teuer_adj.declension_alternatives?.positiv?.stark?.nominativ?.maskulin, 'teuerer');
check('teuer alternatives positiv stark.dat.m', core.teuer_adj.declension_alternatives?.positiv?.stark?.dativ?.maskulin, 'teuerem');
check('teuer alternatives positiv schwach.nom.m', core.teuer_adj.declension_alternatives?.positiv?.schwach?.nominativ?.maskulin, 'teuere');


// ─────────────────────────────────────────────────────────────────────────────
// FINAL SUMMARY
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n' + '─'.repeat(60));
console.log(`TOTAL: ${passed} passed, ${failed} failed`);
if (failed === 0) {
  console.log('ALL CHECKS PASSED');
} else {
  console.error(`${failed} CHECK(S) FAILED — see errors above`);
}
console.log('─'.repeat(60));


// ─────────────────────────────────────────────────────────────────────────────
// GENERATE IRREGULAR-REVIEW.MD
// ─────────────────────────────────────────────────────────────────────────────

function getForm(entry, degree, article, caseKey, gender) {
  return entry?.declension?.[degree]?.[article]?.[caseKey]?.[gender] ?? '—';
}

function buildIrregularTable(entries) {
  const rows = [];
  const header = `| Adjective | Category | Pos stem | stark nom.m | stark dat.m | stark nom.n | Komp base | komp stark nom.m | Sup stem | sup schwach nom.m |`;
  const sep    = `|-----------|----------|----------|-------------|-------------|-------------|-----------|-----------------|----------|-------------------|`;
  rows.push(header);
  rows.push(sep);

  for (const { id, word, category, positivStem, kompForm, supForm } of entries) {
    const entry = core[id];
    if (!entry) continue;

    const posNomM  = getForm(entry, 'positiv', 'stark', 'nominativ', 'maskulin');
    const posDatM  = getForm(entry, 'positiv', 'stark', 'dativ', 'maskulin');
    const posNomN  = getForm(entry, 'positiv', 'stark', 'nominativ', 'neutrum');
    const kompNomM = entry.declension?.komparativ ? getForm(entry, 'komparativ', 'stark', 'nominativ', 'maskulin') : '—';
    const supNomM  = entry.declension?.superlativ ? getForm(entry, 'superlativ', 'schwach', 'nominativ', 'maskulin') : '—';

    rows.push(
      `| ${word} | ${category} | ${positivStem} | ${posNomM} | ${posDatM} | ${posNomN} | ${kompForm ?? '—'} | ${kompNomM} | ${supForm ?? '—'} | ${supNomM} |`
    );
  }

  return rows.join('\n');
}

// Irregular entries to include in the review report
// (generated from bank data — not hand-written)
const irregularEntries = [
  // Suppletive irregulars
  { id: 'hoch_adj',      word: 'hoch',     category: 'suppletive',   positivStem: 'hoh-',      kompForm: core.hoch_adj?.comparison?.komparativ,     supForm: core.hoch_adj?.comparison?.superlativ },
  { id: 'gut_adj',       word: 'gut',      category: 'suppletive',   positivStem: 'gut',       kompForm: core.gut_adj?.comparison?.komparativ,      supForm: core.gut_adj?.comparison?.superlativ },
  { id: 'viel_adj',      word: 'viel',     category: 'suppletive',   positivStem: 'viel',      kompForm: core.viel_adj?.comparison?.komparativ,     supForm: core.viel_adj?.comparison?.superlativ },

  // E-drop exceptions (positiv stem changes)
  { id: 'dunkel_adj',    word: 'dunkel',   category: 'e-drop (-el)', positivStem: 'dunkl-',    kompForm: core.dunkel_adj?.comparison?.komparativ,   supForm: core.dunkel_adj?.comparison?.superlativ },
  { id: 'flexibel_adj',  word: 'flexibel', category: 'e-drop (-el)', positivStem: 'flexibl-',  kompForm: core.flexibel_adj?.comparison?.komparativ, supForm: core.flexibel_adj?.comparison?.superlativ },
  { id: 'teuer_adj',     word: 'teuer',    category: 'e-drop (-er)', positivStem: 'teur-',     kompForm: core.teuer_adj?.comparison?.komparativ,    supForm: core.teuer_adj?.comparison?.superlativ },

  // Umlaut irregulars
  { id: 'alt_adj',       word: 'alt',      category: 'umlaut',       positivStem: 'alt',       kompForm: core.alt_adj?.comparison?.komparativ,      supForm: core.alt_adj?.comparison?.superlativ },
  { id: 'arm_adj',       word: 'arm',      category: 'umlaut',       positivStem: 'arm',       kompForm: core.arm_adj?.comparison?.komparativ,      supForm: core.arm_adj?.comparison?.superlativ },
  { id: 'gross_adj',     word: 'groß',     category: 'umlaut',       positivStem: 'groß',      kompForm: core.gross_adj?.comparison?.komparativ,    supForm: core.gross_adj?.comparison?.superlativ },
  { id: 'hart_adj',      word: 'hart',     category: 'umlaut',       positivStem: 'hart',      kompForm: core.hart_adj?.comparison?.komparativ,     supForm: core.hart_adj?.comparison?.superlativ },
  { id: 'jung_adj',      word: 'jung',     category: 'umlaut',       positivStem: 'jung',      kompForm: core.jung_adj?.comparison?.komparativ,     supForm: core.jung_adj?.comparison?.superlativ },
  { id: 'kalt_adj',      word: 'kalt',     category: 'umlaut',       positivStem: 'kalt',      kompForm: core.kalt_adj?.comparison?.komparativ,     supForm: core.kalt_adj?.comparison?.superlativ },
  { id: 'kurz_adj',      word: 'kurz',     category: 'umlaut',       positivStem: 'kurz',      kompForm: core.kurz_adj?.comparison?.komparativ,     supForm: core.kurz_adj?.comparison?.superlativ },
  { id: 'lang_adj',      word: 'lang',     category: 'umlaut',       positivStem: 'lang',      kompForm: core.lang_adj?.comparison?.komparativ,     supForm: core.lang_adj?.comparison?.superlativ },
  { id: 'scharf_adj',    word: 'scharf',   category: 'umlaut',       positivStem: 'scharf',    kompForm: core.scharf_adj?.comparison?.komparativ,   supForm: core.scharf_adj?.comparison?.superlativ },
  { id: 'stark_adj',     word: 'stark',    category: 'umlaut',       positivStem: 'stark',     kompForm: core.stark_adj?.comparison?.komparativ,    supForm: core.stark_adj?.comparison?.superlativ },
  { id: 'warm_adj',      word: 'warm',     category: 'umlaut',       positivStem: 'warm',      kompForm: core.warm_adj?.comparison?.komparativ,     supForm: core.warm_adj?.comparison?.superlativ },
  { id: 'krank_adj',     word: 'krank',    category: 'umlaut',       positivStem: 'krank',     kompForm: core.krank_adj?.comparison?.komparativ,    supForm: core.krank_adj?.comparison?.superlativ },
  { id: 'dumm_adj',      word: 'dumm',     category: 'umlaut',       positivStem: 'dumm',      kompForm: core.dumm_adj?.comparison?.komparativ,     supForm: core.dumm_adj?.comparison?.superlativ },
  { id: 'klug_adj',      word: 'klug',     category: 'umlaut',       positivStem: 'klug',      kompForm: core.klug_adj?.comparison?.komparativ,     supForm: core.klug_adj?.comparison?.superlativ },
  { id: 'nass_adj',      word: 'nass',     category: 'umlaut',       positivStem: 'nass',      kompForm: core.nass_adj?.comparison?.komparativ,     supForm: core.nass_adj?.comparison?.superlativ },
  { id: 'gesund_adj',    word: 'gesund',   category: 'umlaut',       positivStem: 'gesund',    kompForm: core.gesund_adj?.comparison?.komparativ,   supForm: core.gesund_adj?.comparison?.superlativ },
  { id: 'schwach_adj',   word: 'schwach',  category: 'umlaut',       positivStem: 'schwach',   kompForm: core.schwach_adj?.comparison?.komparativ,  supForm: core.schwach_adj?.comparison?.superlativ },

  // Consonant-cluster exceptions (superlativ -est)
  { id: 'blind_adj',     word: 'blind',    category: 'cons-cluster', positivStem: 'blind',     kompForm: core.blind_adj?.comparison?.komparativ,    supForm: core.blind_adj?.comparison?.superlativ },
  { id: 'rund_adj',      word: 'rund',     category: 'cons-cluster', positivStem: 'rund',      kompForm: core.rund_adj?.comparison?.komparativ,     supForm: core.rund_adj?.comparison?.superlativ },
  { id: 'mild_adj',      word: 'mild',     category: 'cons-cluster', positivStem: 'mild',      kompForm: core.mild_adj?.comparison?.komparativ,     supForm: core.mild_adj?.comparison?.superlativ },
  { id: 'wild_adj',      word: 'wild',     category: 'cons-cluster', positivStem: 'wild',      kompForm: core.wild_adj?.comparison?.komparativ,     supForm: core.wild_adj?.comparison?.superlativ },
  { id: 'fremd_adj',     word: 'fremd',    category: 'cons-cluster', positivStem: 'fremd',     kompForm: core.fremd_adj?.comparison?.komparativ,    supForm: core.fremd_adj?.comparison?.superlativ },
];

const table = buildIrregularTable(irregularEntries);

// Also generate a full positiv table for hoch as an expanded verification section
function buildFullPositivTable(entry, word) {
  const articles = ['stark', 'schwach', 'gemischt'];
  const cases = ['nominativ', 'akkusativ', 'dativ', 'genitiv'];
  const genders = ['maskulin', 'feminin', 'neutrum', 'plural'];

  let out = `\n### ${word} — Full Positiv Declension Table\n\n`;
  for (const article of articles) {
    out += `**${article.charAt(0).toUpperCase() + article.slice(1)}:**\n\n`;
    out += `| Case | m | f | n | pl |\n|------|---|---|---|----|\n`;
    for (const caseKey of cases) {
      const row = genders.map(g => entry?.declension?.positiv?.[article]?.[caseKey]?.[g] ?? '—').join(' | ');
      out += `| ${caseKey} | ${row} |\n`;
    }
    out += '\n';
  }
  return out;
}

const hochTable = buildFullPositivTable(core.hoch_adj, 'hoch');

const reportDate = new Date().toISOString().slice(0, 10);

const report = `# Irregular Declension Forms — Human Review

> Generated: ${reportDate}
> Source: vocabulary/core/de/adjectivebank.json (via verify-declension.js)
> Purpose: Sanity-check all irregular declension stems. Scan for obvious errors
> like "hochem" (wrong) instead of "hohem" (correct).

## How to Use This Report

- **Positiv stem**: the base used for all positiv declined forms
- **stark nom.m**: maskulin nominativ stark (e.g., "ein hoher Berg")
- **stark dat.m**: maskulin dativ stark (e.g., "mit hohem Aufwand") — SC-3 critical check
- **stark nom.n**: neutrum nominativ stark (e.g., "ein hohes Haus")
- **Komp base**: the base form used for komparativ declension (full komparativ form)
- **komp stark nom.m**: komparativ maskulin nominativ stark (e.g., "ein höherer Berg")
- **Sup stem**: the superlativ stem from comparison.superlativ
- **sup schwach nom.m**: schwach maskulin nominativ (e.g., "der höchste Berg")

## Irregular Forms Table

${table}

## Critical Checks

The following forms MUST appear exactly as shown (common error sites):

| What you see | What it should be | What would be WRONG |
|---|---|---|
| hoch stark.dat.m | **hohem** | hochem |
| dunkel stark.nom.m | **dunkler** | dunkeler |
| dunkel stark.dat.m | **dunklem** | dunkelem |
| teuer stark.nom.n | **teures** | teueres |
| teuer stark.dat.m | **teurem** | teuerem |
| schnell komp stark.nom.m | **schnellerer** | schneller |
| hoch komp stark.nom.m | **höherer** | höher |
| gut sup schwach.nom.m | **beste** | gütest, guteste |

## SC-3 Spot Check: hoch
${hochTable}

*Expected: hoher/hohe/hohes/hohem/hohen/hohes/hohes/hoher/hohes/hoher — NOT hoch- prefix in any form*

## Verification Status

Run \`node .planning/phases/08-declension-tables/verify-declension.js\` for automated spot-checks.
All spot-checks: ${passed} passed, ${failed} failed as of ${reportDate}.
`;

const reviewPath = `${PROJECT_ROOT}/.planning/phases/08-declension-tables/IRREGULAR-REVIEW.md`;
writeFileSync(reviewPath, report);
console.log(`\nIRREGULAR-REVIEW.md written to: ${reviewPath}`);

if (failed > 0) {
  process.exit(1);
}
