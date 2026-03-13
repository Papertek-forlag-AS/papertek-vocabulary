/**
 * generate-source-lexicon.js
 *
 * Phase 4: Generates standardized lexicon entries for source languages
 * (German, Spanish, French) from existing banks/ and core/ data.
 *
 * These are generated views — banks/ remains the source of truth.
 * The lexicon/ entries use the same unified format as NB entries,
 * making them queryable through the same v3 API.
 *
 * Usage:
 *   node scripts/generate-source-lexicon.js          (all languages)
 *   node scripts/generate-source-lexicon.js de        (German only)
 *   node scripts/generate-source-lexicon.js es        (Spanish only)
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync } from 'fs';
import { join } from 'path';

const VOCAB_BASE = 'vocabulary';
const LEXICON_BASE = join(VOCAB_BASE, 'lexicon');

const BANK_FILES = [
  'nounbank.json', 'verbbank.json', 'adjectivebank.json',
  'generalbank.json', 'articlesbank.json', 'numbersbank.json',
  'phrasesbank.json', 'pronounsbank.json',
];

/**
 * Resolve language data directory (banks/ preferred over core/)
 */
function resolveLangPath(langCode) {
  const banksPath = join(VOCAB_BASE, 'banks', langCode);
  if (existsSync(banksPath)) return banksPath;
  const corePath = join(VOCAB_BASE, 'core', langCode);
  if (existsSync(corePath)) return corePath;
  return null;
}

/**
 * Transform a source bank entry into a unified lexicon entry.
 * Preserves all grammar data but normalizes the structure.
 */
function transformEntry(id, entry, langCode) {
  const lexEntry = {
    word: entry.word,
    type: entry.type || inferTypeFromId(id),
  };

  // Preserve core fields
  if (entry.audio) lexEntry.audio = entry.audio;
  if (entry.cefr) lexEntry.cefr = entry.cefr;
  if (entry.frequency) lexEntry.frequency = entry.frequency;
  if (entry.curriculum !== undefined) lexEntry.curriculum = entry.curriculum;
  if (entry.tags) lexEntry.tags = entry.tags;
  if (entry.register) lexEntry.register = entry.register;
  if (entry.usageNotes) lexEntry.usageNotes = entry.usageNotes;
  if (entry.etymology) lexEntry.etymology = entry.etymology;

  // Noun fields
  if (entry.genus) lexEntry.genus = entry.genus;
  if (entry.plural) lexEntry.plural = entry.plural;
  if (entry.cases) lexEntry.cases = entry.cases;
  if (entry.declension_type) lexEntry.declensionType = entry.declension_type;
  if (entry.weak_masculine) lexEntry.weakMasculine = entry.weak_masculine;

  // Verb fields
  if (entry.conjugations) lexEntry.conjugations = entry.conjugations;
  if (entry.verbClass) lexEntry.verbClass = entry.verbClass;
  if (entry.separable) lexEntry.separable = entry.separable;
  if (entry.separablePrefix) lexEntry.separablePrefix = entry.separablePrefix;
  if (entry.inseparable) lexEntry.inseparable = entry.inseparable;

  // Adjective fields
  if (entry.comparison) lexEntry.comparison = entry.comparison;
  if (entry.declension) lexEntry.declension = entry.declension;
  if (entry.undeclinable) lexEntry.undeclinable = entry.undeclinable;
  if (entry.nicht_komparierbar) lexEntry.nichtKomparierbar = entry.nicht_komparierbar;

  // Lesson intro
  if (entry.intro) lexEntry.intro = entry.intro;

  // Collocations and related words
  if (entry.collocations) lexEntry.collocations = entry.collocations;
  if (entry.relatedWords) lexEntry.relatedWords = entry.relatedWords;

  // Mark as generated
  lexEntry._generatedFrom = `${langCode}/banks`;
  lexEntry._enriched = true;

  return lexEntry;
}

function inferTypeFromId(id) {
  const parts = id.split('_');
  return parts[parts.length - 1] || 'unknown';
}

// ─── Main ────────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const targetLangs = args.length > 0 && args[0] !== 'all'
  ? [args[0]]
  : ['de', 'es', 'fr'];

console.log('Generating source language lexicon views...\n');

for (const langCode of targetLangs) {
  const sourcePath = resolveLangPath(langCode);
  if (!sourcePath) {
    console.log(`  Skipping ${langCode} (no data directory found)`);
    continue;
  }

  const outDir = join(LEXICON_BASE, langCode);
  mkdirSync(outDir, { recursive: true });

  let totalEntries = 0;
  const bankCounts = {};

  for (const bankFile of BANK_FILES) {
    const bankPath = join(sourcePath, bankFile);
    if (!existsSync(bankPath)) continue;

    const data = JSON.parse(readFileSync(bankPath, 'utf8'));
    const { _metadata, ...entries } = data;

    if (Object.keys(entries).length === 0) continue;

    const bankName = bankFile.replace('.json', '');
    const lexEntries = {};

    for (const [id, entry] of Object.entries(entries)) {
      lexEntries[id] = transformEntry(id, entry, langCode);
    }

    // Sort alphabetically
    const sorted = {};
    for (const key of Object.keys(lexEntries).sort()) {
      sorted[key] = lexEntries[key];
    }

    const count = Object.keys(sorted).length;
    bankCounts[bankName] = count;
    totalEntries += count;

    const output = {
      _metadata: {
        language: langCode,
        bank: bankName,
        generatedAt: new Date().toISOString(),
        description: `${langCode.toUpperCase()} lexicon view — generated from ${sourcePath.includes('banks') ? 'banks' : 'core'}`,
        totalEntries: count,
        source: sourcePath,
      },
      ...sorted,
    };

    const outPath = join(outDir, bankFile);
    writeFileSync(outPath, JSON.stringify(output, null, 2) + '\n');
    console.log(`  ${outPath} (${count} entries)`);
  }

  // Write manifest
  const manifest = {
    _metadata: {
      language: langCode,
      generatedAt: new Date().toISOString(),
      description: `${langCode.toUpperCase()} lexicon view — generated from existing vocabulary data`,
    },
    summary: {
      totalWords: totalEntries,
    },
    banks: bankCounts,
    source: sourcePath,
  };

  writeFileSync(join(outDir, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
  console.log(`  ${langCode}: ${totalEntries} total entries\n`);
}

console.log('Done.');
