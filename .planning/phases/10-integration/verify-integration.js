// .planning/phases/10-integration/verify-integration.js
// Integration verification script covering all 3 INTG requirements:
//   INTG-01: v2 lookup API exposes grammar_adjective_declension in grammarFeatures
//   INTG-02: Search index rebuilt with 365 adj entries (3454 total), all with translations
//   INTG-03: Bank manifests report 365 adjective entries

import { readFileSync } from 'fs';

const ROOT = process.cwd();

let failures = 0;

function check(label, actual, expected) {
  const ok = actual === expected;
  console.log(`${ok ? 'PASS' : 'FAIL'} ${label}: got ${JSON.stringify(actual)}, expected ${JSON.stringify(expected)}`);
  if (!ok) failures++;
}

// ─────────────────────────────────────────────
// INTG-01: grammarFeatures simulation
// ─────────────────────────────────────────────

console.log('\n=== INTG-01: grammarFeatures declension check ===\n');

const adjBank = JSON.parse(readFileSync(`${ROOT}/vocabulary/dictionary/de/adjectivebank.json`, 'utf8'));

// Helper: simulate the API grammarFeatures logic for an adj bank entry
function simulateGrammarFeatures(entry) {
  const grammarFeatures = [];
  if (entry.comparison?.komparativ) grammarFeatures.push('grammar_comparative');
  if (entry.comparison?.superlativ) grammarFeatures.push('grammar_superlative');
  // The new check added in INTG-01:
  if (entry.declension?.positiv) grammarFeatures.push('grammar_adjective_declension');
  return grammarFeatures;
}

// schnell_adj: comparable + declinable — should have all three features
const schnell = adjBank['schnell_adj'];
const schnellGF = simulateGrammarFeatures(schnell);
check('INTG-01-01: schnell_adj has grammar_adjective_declension', schnellGF.includes('grammar_adjective_declension'), true);
check('INTG-01-02: schnell_adj has grammar_comparative', schnellGF.includes('grammar_comparative'), true);
check('INTG-01-03: schnell_adj has grammar_superlative', schnellGF.includes('grammar_superlative'), true);

// lila_adj: undeclinable — should have no grammar features
const lila = adjBank['lila_adj'];
const lilaGF = simulateGrammarFeatures(lila);
check('INTG-01-04: lila_adj has NO grammar_adjective_declension', lilaGF.includes('grammar_adjective_declension'), false);
check('INTG-01-05: lila_adj has NO grammar_comparative', lilaGF.includes('grammar_comparative'), false);

// absolut_adj: nicht_komparierbar but declinable — should have declension only
const absolut = adjBank['absolut_adj'];
const absolutGF = simulateGrammarFeatures(absolut);
check('INTG-01-06: absolut_adj has grammar_adjective_declension', absolutGF.includes('grammar_adjective_declension'), true);
check('INTG-01-07: absolut_adj has NO grammar_comparative', absolutGF.includes('grammar_comparative'), false);

// Verify the actual API source file contains the string grammar_adjective_declension
const apiSource = readFileSync(`${ROOT}/api/vocab/v2/lookup/[language]/[wordId].js`, 'utf8');
const declensionCheckCount = (apiSource.match(/grammar_adjective_declension/g) || []).length;
check('INTG-01-08: API source contains grammar_adjective_declension exactly once', declensionCheckCount, 1);

// ─────────────────────────────────────────────
// INTG-02: Search index checks (minified)
// ─────────────────────────────────────────────

console.log('\n=== INTG-02: Search index counts and content ===\n');

const index = JSON.parse(readFileSync(`${ROOT}/vocabulary/dictionary/de/search-index.json`, 'utf8'));
const adjEntries = index.entries.filter(e => e.t === 'adj');

check('INTG-02-01: adj entry count (minified)', adjEntries.length, 365);
check('INTG-02-02: total entry count (minified)', index.entries.length, 3454);
check('INTG-02-03: _meta.totalEntries matches actual count (minified)', index._meta.totalEntries, index.entries.length);

// Spot-check abhaengig_adj
const abhaengig = index.entries.find(e => e.id === 'abhaengig_adj');
check('INTG-02-04: abhaengig_adj exists in index', !!abhaengig, true);
check('INTG-02-05: abhaengig_adj t === adj', abhaengig?.t, 'adj');
check('INTG-02-06: abhaengig_adj tr.nb === avhengig', abhaengig?.tr?.nb, 'avhengig');
check('INTG-02-07: abhaengig_adj tr.en === dependent', abhaengig?.tr?.en, 'dependent');
check('INTG-02-08: abhaengig_adj c === B1', abhaengig?.c, 'B1');

// Spot-check schnell_adj exists
const schnellIdx = index.entries.find(e => e.id === 'schnell_adj');
check('INTG-02-09: schnell_adj exists in index', !!schnellIdx, true);

// Verify no adj entries have null/missing tr.nb or tr.en
const missingNb = adjEntries.filter(e => !e.tr?.nb).length;
const missingEn = adjEntries.filter(e => !e.tr?.en).length;
check('INTG-02-10: no adj missing tr.nb', missingNb, 0);
check('INTG-02-11: no adj missing tr.en', missingEn, 0);

// Repeat counts on pretty file
const indexPretty = JSON.parse(readFileSync(`${ROOT}/vocabulary/dictionary/de/search-index.pretty.json`, 'utf8'));
const adjEntriesPretty = indexPretty.entries.filter(e => e.t === 'adj');
check('INTG-02-12: adj entry count (pretty)', adjEntriesPretty.length, 365);
check('INTG-02-13: total entry count (pretty)', indexPretty.entries.length, 3454);
check('INTG-02-14: _meta.totalEntries matches actual count (pretty)', indexPretty._meta.totalEntries, indexPretty.entries.length);

// ─────────────────────────────────────────────
// INTG-03: Manifest checks
// ─────────────────────────────────────────────

console.log('\n=== INTG-03: Bank manifest adjective counts ===\n');

const coreManifest = JSON.parse(readFileSync(`${ROOT}/vocabulary/core/de/manifest.json`, 'utf8'));
check('INTG-03-01: core manifest adjectivebank.json count === 365', coreManifest._metadata.files['adjectivebank.json'], 365);

const dictManifest = JSON.parse(readFileSync(`${ROOT}/vocabulary/dictionary/de/manifest.json`, 'utf8'));
check('INTG-03-02: dict manifest adjectivebank.json count === 365', dictManifest._metadata.files['adjectivebank.json'], 365);

// ─────────────────────────────────────────────
// Summary
// ─────────────────────────────────────────────

console.log(`\n${failures === 0 ? 'ALL CHECKS PASSED' : failures + ' CHECK(S) FAILED'}`);
process.exitCode = failures > 0 ? 1 : 0;
