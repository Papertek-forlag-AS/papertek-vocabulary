/**
 * build-lexicon-search-index.js
 *
 * Phase 7: Builds compact search indices for lexicon languages.
 * Used by the v3 search API for fast word lookup.
 *
 * Usage:
 *   node scripts/build-lexicon-search-index.js           (all languages)
 *   node scripts/build-lexicon-search-index.js nb         (Norwegian only)
 *   node scripts/build-lexicon-search-index.js de nb es   (multiple)
 */

import { readFileSync, writeFileSync, existsSync, readdirSync } from 'fs';
import { join } from 'path';

const LEXICON_BASE = join('vocabulary', 'lexicon');

const args = process.argv.slice(2);

// Discover languages or use provided ones
let targetLangs;
if (args.length > 0 && args[0] !== 'all') {
  targetLangs = args;
} else {
  targetLangs = readdirSync(LEXICON_BASE)
    .filter(f => {
      const p = join(LEXICON_BASE, f);
      return f !== 'links' && f !== 'grammar-features.json' &&
        existsSync(p) && require('fs').statSync(p).isDirectory();
    });
}

console.log('Building lexicon search indices...\n');

for (const lang of targetLangs) {
  const langPath = join(LEXICON_BASE, lang);
  if (!existsSync(langPath)) {
    console.log(`  Skipping ${lang} (not found)`);
    continue;
  }

  const bankFiles = readdirSync(langPath).filter(f => f.endsWith('bank.json'));
  const entries = [];

  for (const bankFile of bankFiles) {
    const data = JSON.parse(readFileSync(join(langPath, bankFile), 'utf8'));
    const { _metadata, ...words } = data;

    for (const [id, entry] of Object.entries(words)) {
      const indexEntry = {
        id,
        w: entry.word,
        t: entry.type || null,
      };

      // Add genus for nouns
      if (entry.genus) indexEntry.g = entry.genus;

      // Add CEFR
      if (entry.cefr) indexEntry.c = entry.cefr;

      // Add frequency
      if (entry.frequency) indexEntry.f = entry.frequency;

      // Add verb class
      if (entry.verbClass) indexEntry.vc = entry.verbClass;

      // Add curriculum flag
      if (entry.curriculum) indexEntry.cur = true;

      // Add typos for fuzzy matching in search
      if (entry.typos && entry.typos.length > 0) indexEntry.typos = entry.typos;

      // Add accepted forms
      if (entry.acceptedForms && entry.acceptedForms.length > 0) indexEntry.af = entry.acceptedForms;

      entries.push(indexEntry);
    }
  }

  // Sort alphabetically by id
  entries.sort((a, b) => a.id.localeCompare(b.id));

  const index = {
    _metadata: {
      language: lang,
      generatedAt: new Date().toISOString(),
      totalEntries: entries.length,
    },
    entries,
  };

  const outPath = join(langPath, 'search-index.json');
  writeFileSync(outPath, JSON.stringify(index) + '\n'); // No pretty-print for size
  const sizeKb = Math.round(Buffer.byteLength(JSON.stringify(index)) / 1024);
  console.log(`  ${outPath} (${entries.length} entries, ${sizeKb} KB)`);
}

console.log('\nDone.');
