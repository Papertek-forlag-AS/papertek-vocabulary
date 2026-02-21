/**
 * Phase 7 — Comparison Data Generation
 * Populates comparison.komparativ and comparison.superlativ for all 365 adjective
 * entries in both core and dictionary banks. Flags undeclinable and nicht_komparierbar
 * adjectives. Uses an embedded exception table for ~35 irregular/special entries
 * and a rule engine for the remaining ~330 regular entries.
 *
 * Run: node .planning/phases/07-comparison-data/generate-comparison.js
 * Validate: node scripts/validate-adjectives.js
 */

import { readFileSync, writeFileSync } from 'fs';

// ===== EXCEPTION TABLE =====
// Keyed by _id (same as bank key). Overrides rule engine for all irregular entries.
// Sources: German grammar (Duden primary forms), direct bank inspection.

const EXCEPTIONS = {

  // ── Undeclinable ─────────────────────────────────────────────────────────
  // These adjectives do not decline. Schema forbids both comparison and declension
  // when undeclinable: true. Script must delete both fields when applying.
  'lila_adj':   { undeclinable: true },
  'rosa_adj':   { undeclinable: true },
  'orange_adj': { undeclinable: true },
  'cool_adj':   { undeclinable: true },
  'gern_adj':   { undeclinable: true },

  // ── Nicht-komparierbar ───────────────────────────────────────────────────
  // These adjectives describe absolute states (cannot be compared).
  // Schema forbids comparison when nicht_komparierbar: true. Declension placeholder
  // is kept for Phase 8 (positiv declension still applies).
  'absolut_adj':  { nicht_komparierbar: true },
  'ideal_adj':    { nicht_komparierbar: true },
  'maximal_adj':  { nicht_komparierbar: true },
  'minimal_adj':  { nicht_komparierbar: true },
  'perfekt_adj':  { nicht_komparierbar: true },
  'rein_adj':     { nicht_komparierbar: true },
  'tot_adj':      { nicht_komparierbar: true },
  'total_adj':    { nicht_komparierbar: true },

  // ── Suppletive irregulars ────────────────────────────────────────────────
  // Completely irregular forms — no relationship to base word.
  // Note: nah_adj is NOT in the bank; informational only per research.
  'gut_adj':  { comparison: { komparativ: 'besser',  superlativ: 'best' } },
  'viel_adj': { comparison: { komparativ: 'mehr',    superlativ: 'meist' } },
  'hoch_adj': { comparison: { komparativ: 'höher',   superlativ: 'höchst' } },

  // ── Umlaut irregulars ────────────────────────────────────────────────────
  // Regular -er/-st endings but with umlaut stem change. Duden primary forms.
  'alt_adj':    { comparison: { komparativ: 'älter',    superlativ: 'ältest' } },
  'arm_adj':    { comparison: { komparativ: 'ärmer',    superlativ: 'ärmst' } },
  'gross_adj':  { comparison: { komparativ: 'größer',   superlativ: 'größt' } },  // _id uses 'ss' for 'ß'
  'hart_adj':   { comparison: { komparativ: 'härter',   superlativ: 'härtest' } },
  'jung_adj':   { comparison: { komparativ: 'jünger',   superlativ: 'jüngst' } },
  'kalt_adj':   { comparison: { komparativ: 'kälter',   superlativ: 'kältest' } },
  'kurz_adj':   { comparison: { komparativ: 'kürzer',   superlativ: 'kürzest' } },
  'lang_adj':   { comparison: { komparativ: 'länger',   superlativ: 'längst' } },
  'scharf_adj': { comparison: { komparativ: 'schärfer', superlativ: 'schärfst' } },
  'stark_adj':  { comparison: { komparativ: 'stärker',  superlativ: 'stärkst' } },
  'warm_adj':   { comparison: { komparativ: 'wärmer',   superlativ: 'wärmst' } },
  'krank_adj':  { comparison: { komparativ: 'kränker',  superlativ: 'kränkst' } },
  'dumm_adj':   { comparison: { komparativ: 'dümmer',   superlativ: 'dümmst' } },
  'klug_adj':   { comparison: { komparativ: 'klüger',   superlativ: 'klügst' } },
  'nass_adj':   { comparison: { komparativ: 'nässer',   superlativ: 'nässest' } },
  'gesund_adj': { comparison: { komparativ: 'gesünder', superlativ: 'gesündest' } },
  'schwach_adj':{ comparison: { komparativ: 'schwächer',superlativ: 'schwächst' } },

  // ── -er e-drop irregulars ────────────────────────────────────────────────
  // Words ending in -er where the -e- is dropped in komparativ.
  // Only teuer and sauer in our bank (rule engine handles -el words separately).
  'teuer_adj':  { comparison: { komparativ: 'teurer',  superlativ: 'teuerst' } },
  'sauer_adj':  { comparison: { komparativ: 'saurer',  superlativ: 'sauerst' } },

  // ── Consonant cluster + d/t superlative exceptions ───────────────────────
  // Adjectives ending in consonant+d or consonant+t where adding -st would
  // produce an unpronounceable cluster. These take -est superlative suffix.
  // Rule engine only checks sibilant endings; these need explicit exceptions.
  'blind_adj':  { comparison: { komparativ: 'blinder',  superlativ: 'blindest' } },
  'rund_adj':   { comparison: { komparativ: 'runder',   superlativ: 'rundest' } },
  'mild_adj':   { comparison: { komparativ: 'milder',   superlativ: 'mildest' } },
  'wild_adj':   { comparison: { komparativ: 'wilder',   superlativ: 'wildest' } },
  'fremd_adj':  { comparison: { komparativ: 'fremder',  superlativ: 'fremdest' } },
};


// ===== RULE ENGINE =====
// Derives comparison forms for regular adjectives (those not in EXCEPTIONS table).
// Source: German grammar rules validated against multiple examples.

function generateComparison(word) {
  // Rule 1: -el words — drop 'e', add 'ler' for komparativ; use full word + 'st' for superlativ
  // Example: dunkel → dunkler / dunkelst
  if (word.endsWith('el')) {
    const stem = word.slice(0, -2); // remove 'el'
    return { komparativ: stem + 'ler', superlativ: word + 'st' };
  }

  // Rule 2: -er e-drop adjectives (teuer, sauer) — handled by EXCEPTIONS table.
  // The rule engine does NOT apply e-drop for -er words to avoid false matches.

  // Rule 3: Sibilant endings — regular komparativ (-er) but superlativ takes -est
  // (adding -st to a sibilant produces an unpronounceable or visually confusing cluster)
  // Examples: frisch → frischer/frischest, nass → nässer/nässest (but nass is excepted)
  //           heiss → heißer/heißest, kurz → kürzer/kürzest (but kurz is excepted)
  const sibilantEndings = ['sch', 'ss', 'st', 'tz'];
  const sibilantChars   = ['s',  'ß',  'z',  'x'];
  if (
    sibilantEndings.some(e => word.endsWith(e)) ||
    sibilantChars.some(c => word.endsWith(c))
  ) {
    return { komparativ: word + 'er', superlativ: word + 'est' };
  }

  // Rule 4: Default — regular -er / -st
  return { komparativ: word + 'er', superlativ: word + 'st' };
}


// ===== BANK PROCESSOR =====

function processBank(filePath) {
  const bank = JSON.parse(readFileSync(filePath, 'utf8'));

  let countRegular       = 0;
  let countExcepted      = 0;
  let countUndeclinable  = 0;
  let countNichtKomp     = 0;

  for (const [id, entry] of Object.entries(bank)) {
    if (id === '_metadata') continue;

    const override = EXCEPTIONS[id];

    if (override) {
      // Always remove any existing comparison field first (handles both
      // old entries without comparison and new stubs with comparison: {})
      delete entry.comparison;

      if (override.undeclinable) {
        entry.undeclinable = true;
        // Schema also forbids declension when undeclinable: true
        delete entry.declension;
        countUndeclinable++;
      } else if (override.nicht_komparierbar) {
        entry.nicht_komparierbar = true;
        // Keep declension: {} for Phase 8 (positiv declension still applies)
        countNichtKomp++;
      } else if (override.comparison) {
        entry.comparison = override.comparison;
        countExcepted++;
      }

    } else {
      // Rule engine — apply to the base word
      entry.comparison = generateComparison(entry.word);
      countRegular++;
    }
  }

  bank._metadata.generatedAt = new Date().toISOString();
  writeFileSync(filePath, JSON.stringify(bank, null, 2) + '\n');

  const total = countRegular + countExcepted + countUndeclinable + countNichtKomp;
  console.log(`\n${filePath}`);
  console.log(`  Rule-generated:     ${countRegular}`);
  console.log(`  Irregular (excepted):${countExcepted}`);
  console.log(`  Undeclinable:       ${countUndeclinable}`);
  console.log(`  Nicht-komparierbar: ${countNichtKomp}`);
  console.log(`  Total entries:      ${total}`);
}


// ===== MAIN =====

const PROJECT_ROOT = process.cwd();

console.log('Phase 7: Generating comparison data for both adjective banks...');

processBank(`${PROJECT_ROOT}/vocabulary/core/de/adjectivebank.json`);
processBank(`${PROJECT_ROOT}/vocabulary/dictionary/de/adjectivebank.json`);

console.log('\nDone. Run: node scripts/validate-adjectives.js');
