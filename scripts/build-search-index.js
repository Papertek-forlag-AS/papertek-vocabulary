/**
 * build-search-index.js
 *
 * Phase 15 SYNC-03: Full rebuild of vocabulary/dictionary/de/search-index.json
 * from all dict banks + translation files + core verbbank (for pp field).
 *
 * All 8 dict banks are read:
 *   verbbank, nounbank, adjectivebank, generalbank,
 *   articlesbank, numbersbank, phrasesbank, pronounsbank
 *
 * Translation lookup (curriculum first, dict as fallback):
 *   de-nb / de-en (curriculum)
 *   de-nb-dict / de-en-dict (dict-only, noun/verb/general)
 *
 * Verb entry fields: id, w, t, f, c, cur, vc, sep, pp, tr.nb, tr.en
 * Noun entry fields: id, w, t, f, c, cur, g, tr.nb, tr.en
 * Other entry fields: id, w, t, f, c, cur, tr.nb, tr.en
 *
 * Phase 10 decision: entries sorted alphabetically by id.
 * User decision: NO case hints on noun entries in the search index.
 * User decision: pp = bare participle (e.g. "angefangen", not "hat angefangen").
 * User decision: Full rebuild (not partial) to guarantee no stale data.
 */

import { readFileSync, writeFileSync } from 'fs';

const BASE = 'vocabulary/dictionary/de';
const TRANS_BASE = 'vocabulary/translations';

// ── Load all 8 dict banks ──────────────────────────────────────────────────
const verbBank     = JSON.parse(readFileSync(`${BASE}/verbbank.json`,       'utf8'));
const nounBank     = JSON.parse(readFileSync(`${BASE}/nounbank.json`,       'utf8'));
const adjBank      = JSON.parse(readFileSync(`${BASE}/adjectivebank.json`,  'utf8'));
const generalBank  = JSON.parse(readFileSync(`${BASE}/generalbank.json`,    'utf8'));
const articlesBank = JSON.parse(readFileSync(`${BASE}/articlesbank.json`,   'utf8'));
const numbersBank  = JSON.parse(readFileSync(`${BASE}/numbersbank.json`,    'utf8'));
const phrasesBank  = JSON.parse(readFileSync(`${BASE}/phrasesbank.json`,    'utf8'));
const pronounsBank = JSON.parse(readFileSync(`${BASE}/pronounsbank.json`,   'utf8'));

// ── Load core verbbank for pp field lookup ─────────────────────────────────
const coreVerbBank = JSON.parse(readFileSync('vocabulary/core/de/verbbank.json', 'utf8'));
const ppMap = {};  // { verb_id: participle_string }
for (const [key, entry] of Object.entries(coreVerbBank)) {
  if (key === '_metadata') continue;
  const participle = entry?.conjugations?.perfektum?.participle;
  if (participle) ppMap[key] = participle;
}

// ── Load translation files ─────────────────────────────────────────────────
// Curriculum translations
const currNb = {
  verb:        JSON.parse(readFileSync(`${TRANS_BASE}/de-nb/verbbank.json`,        'utf8')),
  noun:        JSON.parse(readFileSync(`${TRANS_BASE}/de-nb/nounbank.json`,        'utf8')),
  adj:         JSON.parse(readFileSync(`${TRANS_BASE}/de-nb/adjectivebank.json`,   'utf8')),
  general:     JSON.parse(readFileSync(`${TRANS_BASE}/de-nb/generalbank.json`,     'utf8')),
  articles:    JSON.parse(readFileSync(`${TRANS_BASE}/de-nb/articlesbank.json`,    'utf8')),
  numbers:     JSON.parse(readFileSync(`${TRANS_BASE}/de-nb/numbersbank.json`,     'utf8')),
  phrases:     JSON.parse(readFileSync(`${TRANS_BASE}/de-nb/phrasesbank.json`,     'utf8')),
  pronouns:    JSON.parse(readFileSync(`${TRANS_BASE}/de-nb/pronounsbank.json`,    'utf8')),
};
const currEn = {
  verb:        JSON.parse(readFileSync(`${TRANS_BASE}/de-en/verbbank.json`,        'utf8')),
  noun:        JSON.parse(readFileSync(`${TRANS_BASE}/de-en/nounbank.json`,        'utf8')),
  adj:         JSON.parse(readFileSync(`${TRANS_BASE}/de-en/adjectivebank.json`,   'utf8')),
  general:     JSON.parse(readFileSync(`${TRANS_BASE}/de-en/generalbank.json`,     'utf8')),
  articles:    JSON.parse(readFileSync(`${TRANS_BASE}/de-en/articlesbank.json`,    'utf8')),
  numbers:     JSON.parse(readFileSync(`${TRANS_BASE}/de-en/numbersbank.json`,     'utf8')),
  phrases:     JSON.parse(readFileSync(`${TRANS_BASE}/de-en/phrasesbank.json`,     'utf8')),
  pronouns:    JSON.parse(readFileSync(`${TRANS_BASE}/de-nb/pronounsbank.json`,    'utf8')),
};
// Dict-only translations (noun, verb, general)
const dictNb = {
  verb:    JSON.parse(readFileSync(`${TRANS_BASE}/de-nb-dict/verbbank.json`,    'utf8')),
  noun:    JSON.parse(readFileSync(`${TRANS_BASE}/de-nb-dict/nounbank.json`,    'utf8')),
  general: JSON.parse(readFileSync(`${TRANS_BASE}/de-nb-dict/generalbank.json`, 'utf8')),
};
const dictEn = {
  verb:    JSON.parse(readFileSync(`${TRANS_BASE}/de-en-dict/verbbank.json`,    'utf8')),
  noun:    JSON.parse(readFileSync(`${TRANS_BASE}/de-en-dict/nounbank.json`,    'utf8')),
  general: JSON.parse(readFileSync(`${TRANS_BASE}/de-en-dict/generalbank.json`, 'utf8')),
};

/**
 * Look up translation for an entry id from a set of translation maps.
 * Curriculum (curr) takes priority; dict-only (dict) is the fallback.
 *
 * @param {string} id - entry key (e.g. "anfangen_verb")
 * @param {string} bankType - which group to look in: 'verb'|'noun'|'adj'|'general'|'articles'|...
 * @param {object} currMap - curriculum language map (object with translation files)
 * @param {object} dictMap - dict-only language map (only verb/noun/general)
 * @returns {string|undefined}
 */
function getTranslation(id, bankType, currMap, dictMap) {
  const currSource = currMap[bankType];
  if (currSource && currSource[id]?.translation) return currSource[id].translation;
  const dictSource = dictMap[bankType];
  if (dictSource && dictSource[id]?.translation) return dictSource[id].translation;
  return undefined;
}

/**
 * Build a compact search index entry from a bank entry.
 *
 * @param {string} id - entry key
 * @param {object} entry - raw bank entry
 * @param {string} bankType - 'verb'|'noun'|'adj'|'general'|'articles'|'numbers'|'phrases'|'pronouns'
 * @returns {object} compact index entry
 */
function buildEntry(id, entry, bankType) {
  // Determine the search index type
  // For generalbank: entries have a .type field (interj, phrase, adv, etc.)
  //   entries WITHOUT a .type field use 'general'
  // For all other banks: fixed types
  const bankTypeMap = {
    verb:      'verb',
    noun:      'noun',
    adj:       'adj',
    articles:  entry.type || 'art',   // articlesbank entries have type (art, contr)
    numbers:   'num',
    phrases:   'phrase',
    pronouns:  'pron',
  };

  let t;
  if (bankType === 'general') {
    t = entry.type || 'general';
  } else {
    t = bankTypeMap[bankType];
  }

  const nb = getTranslation(id, bankType, currNb, dictNb);
  const en = getTranslation(id, bankType, currEn, dictEn);

  const indexEntry = {
    id,
    w:   entry.word,
    t,
    f:   entry.frequency,
    c:   entry.cefr,
    cur: entry.curriculum || false,
  };

  // Type-specific fields
  if (t === 'verb') {
    // vc: verbClass.default (only if verbClass exists)
    if (entry.verbClass?.default) {
      indexEntry.vc = entry.verbClass.default;
    }
    // sep: verbClass.separable (the prefix, e.g. "an") — only if set
    if (entry.verbClass?.separable) {
      indexEntry.sep = entry.verbClass.separable;
    }
    // pp: bare participle from core verbbank
    if (ppMap[id]) {
      indexEntry.pp = ppMap[id];
    }
  } else if (t === 'noun') {
    // g: genus (gender) — no case hints per user decision
    if (entry.genus) {
      indexEntry.g = entry.genus;
    }
  }
  // adj and all other types: no extra fields beyond base

  // Translation
  const tr = {};
  if (nb) tr.nb = nb;
  if (en) tr.en = en;
  if (Object.keys(tr).length > 0) {
    indexEntry.tr = tr;
  }

  return indexEntry;
}

// ── Build entries from all banks ───────────────────────────────────────────
const entries = [];

const banks = [
  { data: verbBank,     type: 'verb' },
  { data: nounBank,     type: 'noun' },
  { data: adjBank,      type: 'adj' },
  { data: generalBank,  type: 'general' },
  { data: articlesBank, type: 'articles' },
  { data: numbersBank,  type: 'numbers' },
  { data: phrasesBank,  type: 'phrases' },
  { data: pronounsBank, type: 'pronouns' },
];

for (const { data, type } of banks) {
  for (const [key, entry] of Object.entries(data)) {
    if (key === '_metadata') continue;
    entries.push(buildEntry(key, entry, type));
  }
}

// ── Sort alphabetically by id (Phase 10 decision) ─────────────────────────
entries.sort((a, b) => a.id.localeCompare(b.id));

// ── Write output ───────────────────────────────────────────────────────────
const output = {
  _meta: {
    language:           'de',
    totalEntries:       entries.length,
    generatedAt:        new Date().toISOString(),
    version:            '1.0.0',
    translationLanguages: ['nb', 'en'],
  },
  entries,
};

writeFileSync(`${BASE}/search-index.json`, JSON.stringify(output, null, 2));
console.log(`Total entries: ${entries.length}`);
const verbEntries = entries.filter(e => e.t === 'verb');
const withPP = verbEntries.filter(e => e.pp);
console.log(`Verbs: ${verbEntries.length}, verbs with pp: ${withPP.length}`);
