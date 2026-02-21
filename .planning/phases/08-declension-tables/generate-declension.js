/**
 * Phase 8 — Declension Table Generation
 * Populates declension.positiv, declension.komparativ, and declension.superlativ
 * for all 360 declinable adjective entries in both core and dictionary banks.
 *
 * - 360 declinable adjectives get declension.positiv (stark/schwach/gemischt × 4 cases × 4 gender/number)
 * - 352 comparable adjectives also get declension.komparativ (full articleBlock) and declension.superlativ (schwach only)
 * - 8 nicht_komparierbar adjectives get declension.positiv only
 * - 5 undeclinable adjectives are skipped (no declension data)
 *
 * Run: node .planning/phases/08-declension-tables/generate-declension.js
 * Validate: node scripts/validate-adjectives.js
 */

import { readFileSync, writeFileSync } from 'fs';

// ===== ENDING TABLES (constant — same for all adjectives) =====
// Source: Standard German grammar — stark/schwach/gemischt declension endings.
// These never vary per adjective. All variation is in the stem, not the endings.
const ENDINGS = {
  stark: {
    nominativ:  { maskulin: 'er', feminin: 'e',  neutrum: 'es', plural: 'e'  },
    akkusativ:  { maskulin: 'en', feminin: 'e',  neutrum: 'es', plural: 'e'  },
    dativ:      { maskulin: 'em', feminin: 'er', neutrum: 'em', plural: 'en' },
    genitiv:    { maskulin: 'en', feminin: 'er', neutrum: 'en', plural: 'er' },
  },
  schwach: {
    nominativ:  { maskulin: 'e',  feminin: 'e',  neutrum: 'e',  plural: 'en' },
    akkusativ:  { maskulin: 'en', feminin: 'e',  neutrum: 'e',  plural: 'en' },
    dativ:      { maskulin: 'en', feminin: 'en', neutrum: 'en', plural: 'en' },
    genitiv:    { maskulin: 'en', feminin: 'en', neutrum: 'en', plural: 'en' },
  },
  gemischt: {
    nominativ:  { maskulin: 'er', feminin: 'e',  neutrum: 'es', plural: 'en' },
    akkusativ:  { maskulin: 'en', feminin: 'e',  neutrum: 'es', plural: 'en' },
    dativ:      { maskulin: 'en', feminin: 'en', neutrum: 'en', plural: 'en' },
    genitiv:    { maskulin: 'en', feminin: 'en', neutrum: 'en', plural: 'en' },
  },
};

// ===== POSITIV STEM EXCEPTIONS =====
// Only adjectives where the positiv declension stem differs from the base word.
// Source: Duden German grammar.
// Key: _id of the adjective entry
// Value: the stem to use for ALL positiv declined forms
const POSITIV_STEM_EXCEPTIONS = {
  'hoch_adj':     'hoh',     // hoch → hoher, hohe, hohes, hohem (NOT hochem — SC-3 critical check)
  'dunkel_adj':   'dunkl',   // dunkel → dunkler, dunkle, dunkles, dunklem (unstressed -el → e-drop)
  'flexibel_adj': 'flexibl', // flexibel → flexibler, flexible, flexibles (unstressed -el → e-drop)
  'teuer_adj':    'teur',    // teuer → teurer, teure, teures, teurem (Duden preferred; teur- stem)
};
// NOT exceptions (full word used as-is):
// parallel_adj: paralleler/parallele etc. (stressed final syllable, no e-drop)
// sauber_adj:   sauberer/saubere etc. (sauberes is standard — no e-drop)
// bitter_adj:   bitteres is standard
// lecker_adj:   leckeres is standard
// All -ell adjectives (aktuell, finanziell, etc.): no e-drop — double-l is a different pattern

// ===== KOMPARATIV BLOCK EXCEPTIONS =====
// Adjectives where the standard algorithm cannot generate the correct komparativ
// article block. These entries provide hand-curated pre-built article blocks.
//
// viel_adj: comparison.komparativ = 'mehr'
//   'mehr' does not end in '-er' so it cannot be used directly as a stem
//   with standard endings (mehr + er = mehrer, which is wrong).
//   The correct declined comparative forms are based on 'mehrere' but with
//   special handling of the trailing 'e': mehrerer/mehrere/mehreres/mehrerem etc.
//   These forms are hand-curated from Duden standard German grammar.
//   (Source: Plan 08-01, Task 1 action, KOMPARATIV_EXCEPTIONS section)
const KOMPARATIV_BLOCK_EXCEPTIONS = {
  'viel_adj': {
    stark: {
      nominativ: { maskulin: 'mehrerer',  feminin: 'mehrere',  neutrum: 'mehreres', plural: 'mehrere'  },
      akkusativ: { maskulin: 'mehreren',  feminin: 'mehrere',  neutrum: 'mehreres', plural: 'mehrere'  },
      dativ:     { maskulin: 'mehrerem',  feminin: 'mehrerer', neutrum: 'mehrerem', plural: 'mehreren' },
      genitiv:   { maskulin: 'mehreren',  feminin: 'mehrerer', neutrum: 'mehreren', plural: 'mehrerer' },
    },
    schwach: {
      nominativ: { maskulin: 'mehrere',   feminin: 'mehrere',  neutrum: 'mehrere',  plural: 'mehreren' },
      akkusativ: { maskulin: 'mehreren',  feminin: 'mehrere',  neutrum: 'mehrere',  plural: 'mehreren' },
      dativ:     { maskulin: 'mehreren',  feminin: 'mehreren', neutrum: 'mehreren', plural: 'mehreren' },
      genitiv:   { maskulin: 'mehreren',  feminin: 'mehreren', neutrum: 'mehreren', plural: 'mehreren' },
    },
    gemischt: {
      nominativ: { maskulin: 'mehrerer',  feminin: 'mehrere',  neutrum: 'mehreres', plural: 'mehreren' },
      akkusativ: { maskulin: 'mehreren',  feminin: 'mehrere',  neutrum: 'mehreres', plural: 'mehreren' },
      dativ:     { maskulin: 'mehreren',  feminin: 'mehreren', neutrum: 'mehreren', plural: 'mehreren' },
      genitiv:   { maskulin: 'mehreren',  feminin: 'mehreren', neutrum: 'mehreren', plural: 'mehreren' },
    },
  },
};

// ===== DECLENSION ALTERNATIVES =====
// Alternative accepted forms stored at entry level (NOT inside the declension object).
// Schema: declension.$def has additionalProperties: false — alternatives CANNOT go inside it.
//         adjectiveEntry has NO additionalProperties restriction — extra keys ARE allowed at entry level.
//
// Only entries with genuine Duden-recognized variants are included here.
// Structure: sparse — only cells that have confirmed Duden alternatives.
//
// teuer_adj: Primary uses teur- stem (Duden preferred form).
//   Duden also accepts the forms derived from the full word 'teuer' as the stem (teuer- forms).
//   e.g., teurem (primary) / teuerem (also accepted)
//        teure  (primary) / teuere  (also accepted)
//        teures (primary) / teueres (also accepted)
//        teurer (primary) / teuerer (also accepted)
//        teuren (primary) / teueren (also accepted)
// The alternatives are the teuer- stem forms.
const DECLENSION_ALTERNATIVES = {
  'teuer_adj': {
    positiv: {
      stark: {
        nominativ: { maskulin: 'teuerer', feminin: 'teuere', neutrum: 'teueres', plural: 'teuere' },
        akkusativ: { maskulin: 'teueren', feminin: 'teuere', neutrum: 'teueres', plural: 'teuere' },
        dativ:     { maskulin: 'teuerem', feminin: 'teuerer', neutrum: 'teuerem', plural: 'teueren' },
        genitiv:   { maskulin: 'teueren', feminin: 'teuerer', neutrum: 'teueren', plural: 'teuerer' },
      },
      schwach: {
        nominativ: { maskulin: 'teuere', feminin: 'teuere', neutrum: 'teuere', plural: 'teueren' },
        akkusativ: { maskulin: 'teueren', feminin: 'teuere', neutrum: 'teuere', plural: 'teueren' },
        dativ:     { maskulin: 'teueren', feminin: 'teueren', neutrum: 'teueren', plural: 'teueren' },
        genitiv:   { maskulin: 'teueren', feminin: 'teueren', neutrum: 'teueren', plural: 'teueren' },
      },
      gemischt: {
        nominativ: { maskulin: 'teuerer', feminin: 'teuere', neutrum: 'teueres', plural: 'teueren' },
        akkusativ: { maskulin: 'teueren', feminin: 'teuere', neutrum: 'teueres', plural: 'teueren' },
        dativ:     { maskulin: 'teueren', feminin: 'teueren', neutrum: 'teueren', plural: 'teueren' },
        genitiv:   { maskulin: 'teueren', feminin: 'teueren', neutrum: 'teueren', plural: 'teueren' },
      },
    },
  },
};


// ===== BLOCK BUILDER FUNCTIONS =====

/**
 * Applies endings to a stem to produce a full caseBlock.
 * @param {string} stem - The adjective stem
 * @param {object} endingsTable - One of ENDINGS.stark / ENDINGS.schwach / ENDINGS.gemischt
 * @returns {object} caseBlock: { nominativ, akkusativ, dativ, genitiv }
 */
function makeCaseBlock(stem, endingsTable) {
  const block = {};
  for (const [caseKey, genders] of Object.entries(endingsTable)) {
    block[caseKey] = {};
    for (const [gender, ending] of Object.entries(genders)) {
      block[caseKey][gender] = stem + ending;
    }
  }
  return block;
}

/**
 * Builds a full article block (stark/schwach/gemischt) for a given stem.
 * Used for positiv and komparativ degrees.
 * @param {string} stem - The adjective stem
 * @returns {object} articleBlock: { stark, schwach, gemischt }
 */
function makeArticleBlock(stem) {
  return {
    stark:    makeCaseBlock(stem, ENDINGS.stark),
    schwach:  makeCaseBlock(stem, ENDINGS.schwach),
    gemischt: makeCaseBlock(stem, ENDINGS.gemischt),
  };
}

/**
 * Builds a superlativ block (schwach only).
 * Superlatives always require a definite article in German, so only schwach
 * declension is grammatically correct (schema already encodes this via superlativBlock).
 * @param {string} supStem - The superlativ stem (e.g., 'schnellst', 'best', 'höchst')
 * @returns {object} superlativBlock: { schwach: caseBlock }
 */
function makeSuperlativBlock(supStem) {
  return {
    schwach: makeCaseBlock(supStem, ENDINGS.schwach),
  };
}


// ===== DECLENSION BUILDER =====

/**
 * Builds the complete declension object for a single adjective entry.
 * @param {string} id - The adjective's _id key (e.g., 'schnell_adj')
 * @param {object} entry - The adjective bank entry
 * @returns {object|null} declension object, or null for undeclinable adjectives
 */
function buildDeclension(id, entry) {
  // Undeclinable adjectives: no declension data (schema forbids it when undeclinable: true)
  if (entry.undeclinable) return null;

  // Get the positiv stem: use exception table or fall back to base word
  const posStem = POSITIV_STEM_EXCEPTIONS[id] ?? entry.word;

  const declension = {};

  // All 360 declinable adjectives get positiv declension (stark/schwach/gemischt)
  declension.positiv = makeArticleBlock(posStem);

  // Only comparable adjectives (352) get komparativ and superlativ.
  // nicht_komparierbar adjectives (8) get positiv only — schema forbids
  // komparativ/superlativ keys when nicht_komparierbar: true.
  if (!entry.nicht_komparierbar && entry.comparison) {
    const kompForm = entry.comparison.komparativ; // e.g., 'schneller', 'besser', 'höher', 'mehr'
    const supForm  = entry.comparison.superlativ; // e.g., 'schnellst', 'best', 'höchst', 'meist'

    // CRITICAL: Use the FULL komparativ form as the declension base — do NOT strip -er.
    // schneller (full form) + endings → schnellerer/schnellere/schnelleres (correct)
    // NOT: schnell (stripped) + endings → schneller/schnelle/schnelles (WRONG — those are positiv)
    //
    // Exception: viel_adj — comparison.komparativ = 'mehr', which cannot be used
    // directly as a stem with standard endings. Use pre-curated block instead.
    if (KOMPARATIV_BLOCK_EXCEPTIONS[id]) {
      declension.komparativ = KOMPARATIV_BLOCK_EXCEPTIONS[id];
    } else {
      declension.komparativ = makeArticleBlock(kompForm);
    }

    // Superlativ stem: comparison.superlativ already stores the bare stem (e.g., 'schnellst').
    // Apply schwach endings: schnellst + e → schnellste, schnellst + en → schnellsten, etc.
    declension.superlativ = makeSuperlativBlock(supForm);
  }

  return declension;
}


// ===== BANK PROCESSOR =====

/**
 * Reads a bank file, populates all declension data, and writes back.
 * Handles both cases:
 * - 259 newer entries with existing 'declension: {}' placeholder (Phase 6 stubs)
 * - 101 older entries with NO 'declension' key at all
 * @param {string} filePath - Absolute path to the bank JSON file
 */
function processBank(filePath) {
  const bank = JSON.parse(readFileSync(filePath, 'utf8'));

  let populated        = 0;
  let skipped          = 0;  // undeclinable entries
  let withAlternatives = 0;

  for (const [id, entry] of Object.entries(bank)) {
    if (id === '_metadata') continue;

    if (entry.undeclinable) {
      // Skip undeclinable adjectives (lila, rosa, orange, cool, gern)
      // These already have no declension field (Phase 7 removed it)
      skipped++;
      continue;
    }

    // Set declension data unconditionally — overwrites 'declension: {}' AND
    // creates the key where it was absent (101 older entries)
    entry.declension = buildDeclension(id, entry);
    populated++;

    // Add entry-level alternatives for Duden-recognized variant forms
    if (DECLENSION_ALTERNATIVES[id]) {
      entry.declension_alternatives = DECLENSION_ALTERNATIVES[id];
      withAlternatives++;
    }
  }

  bank._metadata.generatedAt = new Date().toISOString();
  writeFileSync(filePath, JSON.stringify(bank, null, 2) + '\n');

  console.log(`\n${filePath}`);
  console.log(`  Populated:         ${populated}`);
  console.log(`  Skipped (undecl):  ${skipped}`);
  console.log(`  With alternatives: ${withAlternatives}`);
  console.log(`  Total:             ${populated + skipped}`);
}


// ===== MAIN =====

const PROJECT_ROOT = process.cwd();

console.log('Phase 8: Generating declension tables for both adjective banks...');

processBank(`${PROJECT_ROOT}/vocabulary/core/de/adjectivebank.json`);
processBank(`${PROJECT_ROOT}/vocabulary/dictionary/de/adjectivebank.json`);

console.log('\nDone. Run: node scripts/validate-adjectives.js');
