/**
 * build-search-index.js
 *
 * Builds search-index.json for any supported language (de, es, fr).
 * Reads all bank files from the language's data directory and produces
 * a compact search index sorted alphabetically by id.
 *
 * Usage:
 *   node scripts/build-search-index.js de
 *   node scripts/build-search-index.js es
 *   node scripts/build-search-index.js fr
 *   node scripts/build-search-index.js all   (builds all three)
 *
 * Translation sources:
 *   - German (de): separate translation files in vocabulary/translations/de-{nb,en}/
 *   - Spanish/French: inline translations in bank entries (.translations.nb, .translations.en)
 *   - Falls back to separate translation files if inline translations are missing
 */

import { readFileSync, writeFileSync, existsSync, readdirSync } from 'fs';
import { join } from 'path';

const VOCAB_BASE = 'vocabulary';
const TRANS_BASE = join(VOCAB_BASE, 'translations');

// Bank file name → internal type key
const BANK_TYPE_MAP = {
  verbbank:      'verb',
  nounbank:      'noun',
  adjectivebank: 'adj',
  generalbank:   'general',
  articlesbank:  'articles',
  numbersbank:   'numbers',
  phrasesbank:   'phrases',
  pronounsbank:  'pronouns',
};

/**
 * Resolve the data directory for a language (banks/ or core/)
 */
function resolveLangPath(langCode) {
  const banksPath = join(VOCAB_BASE, 'banks', langCode);
  if (existsSync(banksPath)) return banksPath;

  const corePath = join(VOCAB_BASE, 'core', langCode);
  if (existsSync(corePath)) return corePath;

  return null;
}

/**
 * Load translation files for a language pair (e.g. de-nb).
 * Returns an object keyed by bank type, or null if the pair doesn't exist.
 */
function loadTranslationPair(langCode, transLang) {
  const pairDir = join(TRANS_BASE, `${langCode}-${transLang}`);
  if (!existsSync(pairDir)) return null;

  const translations = {};
  for (const [fileName, bankType] of Object.entries(BANK_TYPE_MAP)) {
    const filePath = join(pairDir, `${fileName}.json`);
    if (existsSync(filePath)) {
      translations[bankType] = JSON.parse(readFileSync(filePath, 'utf8'));
    }
  }
  return translations;
}

/**
 * Get translation for a word from either inline entry data or separate translation files.
 */
function getTranslation(entry, id, bankType, transLang, translationFiles) {
  // Try inline translations first (fr/es store translations in the entry)
  if (entry.translations?.[transLang]) {
    return entry.translations[transLang];
  }

  // Fall back to separate translation files (de uses this)
  if (translationFiles) {
    const source = translationFiles[bankType];
    if (source?.[id]?.translation) return source[id].translation;
  }

  return undefined;
}

/**
 * Determine the search index type for an entry.
 */
function resolveType(entry, bankType) {
  const fixedTypes = {
    verb:     'verb',
    noun:     'noun',
    adj:      'adj',
    numbers:  'num',
    phrases:  'phrase',
    pronouns: 'pron',
  };

  if (bankType === 'general') {
    return entry.type || 'general';
  }

  if (bankType === 'articles') {
    // Normalize language-specific article types
    const entryType = entry.type || '';
    if (entryType === 'article' || entryType === 'articulo') return 'art';
    if (entryType === 'contraction') return 'contr';
    return entry.type || 'art';
  }

  // For verbs, normalize language-specific type names
  if (bankType === 'verb') {
    return 'verb'; // normalise 'verbe' (fr) → 'verb'
  }

  return fixedTypes[bankType] || bankType;
}

/**
 * Build a compact search index entry.
 */
function buildEntry(id, entry, bankType, transLangs, translationFilesByLang) {
  const t = resolveType(entry, bankType);

  const indexEntry = {
    id,
    w:   entry.word,
    t,
    f:   entry.frequency || undefined,
    c:   entry.cefr || undefined,
    cur: entry.curriculum || false,
  };

  // Noun: include genus
  if (bankType === 'noun' && entry.genus) {
    indexEntry.g = entry.genus;
  }

  // Verb: include verb class, separable prefix, past participle
  if (bankType === 'verb') {
    if (entry.verbClass?.default) indexEntry.vc = entry.verbClass.default;
    if (entry.verbClass?.separable) indexEntry.sep = entry.verbClass.separable;
    if (entry.verbType) indexEntry.vc = entry.verbType; // es uses verbType
    if (entry.group) indexEntry.vc = `group${entry.group}`; // fr uses group number
    const participle = entry.conjugations?.perfektum?.participle;
    if (participle) indexEntry.pp = participle;
  }

  // Translations
  const tr = {};
  for (const lang of transLangs) {
    const translation = getTranslation(entry, id, bankType, lang, translationFilesByLang[lang]);
    if (translation) tr[lang] = translation;
  }
  if (Object.keys(tr).length > 0) indexEntry.tr = tr;

  // Clean up undefined fields
  if (indexEntry.f === undefined) delete indexEntry.f;
  if (indexEntry.c === undefined) delete indexEntry.c;

  return indexEntry;
}

/**
 * Build the search index for a language.
 */
function buildSearchIndex(langCode) {
  const langPath = resolveLangPath(langCode);
  if (!langPath) {
    console.error(`No data directory found for language: ${langCode}`);
    process.exit(1);
  }

  console.log(`\nBuilding search index for ${langCode} (${langPath})`);

  // Determine available translation languages
  const transLangs = [];
  const translationFilesByLang = {};

  for (const tl of ['nb', 'en']) {
    const pairDir = join(TRANS_BASE, `${langCode}-${tl}`);
    if (existsSync(pairDir)) {
      transLangs.push(tl);
      translationFilesByLang[tl] = loadTranslationPair(langCode, tl);
    } else {
      // Even without separate files, inline translations may exist
      transLangs.push(tl);
      translationFilesByLang[tl] = null;
    }
  }

  // Load all bank files
  const bankFiles = readdirSync(langPath).filter(f => f.endsWith('bank.json'));
  const entries = [];

  for (const file of bankFiles) {
    const bankName = file.replace('.json', '');
    const bankType = BANK_TYPE_MAP[bankName];
    if (!bankType) {
      console.warn(`  Skipping unknown bank file: ${file}`);
      continue;
    }

    const data = JSON.parse(readFileSync(join(langPath, file), 'utf8'));
    let bankCount = 0;

    for (const [key, entry] of Object.entries(data)) {
      if (key === '_metadata') continue;
      entries.push(buildEntry(key, entry, bankType, transLangs, translationFilesByLang));
      bankCount++;
    }

    console.log(`  ${bankName}: ${bankCount} entries`);
  }

  // Sort alphabetically by id
  entries.sort((a, b) => a.id.localeCompare(b.id));

  // Determine which translation languages actually have data
  const activeLangs = transLangs.filter(lang =>
    entries.some(e => e.tr?.[lang])
  );

  const output = {
    _meta: {
      language:             langCode,
      totalEntries:         entries.length,
      generatedAt:          new Date().toISOString(),
      version:              '1.0.0',
      translationLanguages: activeLangs,
    },
    entries,
  };

  writeFileSync(join(langPath, 'search-index.json'), JSON.stringify(output, null, 2));
  console.log(`  Total: ${entries.length} entries → ${langPath}/search-index.json`);

  // Stats
  const verbs = entries.filter(e => e.t === 'verb');
  const nouns = entries.filter(e => e.g);
  const withTr = entries.filter(e => e.tr);
  console.log(`  Verbs: ${verbs.length}, Nouns: ${nouns.length}, With translations: ${withTr.length}`);
}

// ── CLI ──────────────────────────────────────────────────────────────────────
const lang = process.argv[2];
if (!lang) {
  console.error('Usage: node scripts/build-search-index.js <de|es|fr|all>');
  process.exit(1);
}

if (lang === 'all') {
  for (const l of ['de', 'es', 'fr']) {
    buildSearchIndex(l);
  }
} else {
  buildSearchIndex(lang);
}
