/**
 * validate-lexicon.js
 *
 * Validates all lexicon entries and links:
 * - Schema validation (entries against lexicon-entry schema, links against link schema)
 * - ID uniqueness within each language
 * - Orphan detection (lexicon words with no links pointing to/from them)
 * - Link integrity (link targets exist in the target language's lexicon)
 *
 * Usage:
 *   node scripts/validate-lexicon.js           (all languages)
 *   node scripts/validate-lexicon.js nb         (Norwegian only)
 */

import { readFileSync, existsSync, readdirSync, statSync } from 'fs';
import { join } from 'path';
import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';

const LEXICON_BASE = join('vocabulary', 'lexicon');
const SCHEMA_BASE = join('vocabulary', 'schema', 'lexicon');

const args = process.argv.slice(2);

// ─── Load schemas ────────────────────────────────────────────────────────

const entrySchema = JSON.parse(readFileSync(join(SCHEMA_BASE, 'lexicon-entry.schema.json'), 'utf8'));
const linkSchema = JSON.parse(readFileSync(join(SCHEMA_BASE, 'lexicon-link.schema.json'), 'utf8'));

const ajv = new Ajv2020({ strict: false, allErrors: true });
addFormats(ajv);
ajv.addSchema(entrySchema, entrySchema.$id);
ajv.addSchema(linkSchema, linkSchema.$id);

const validateEntry = ajv.getSchema(entrySchema.$id);
const validateLink = ajv.getSchema(linkSchema.$id);

if (!validateEntry || !validateLink) {
  console.error('Failed to compile schemas');
  process.exit(1);
}

// ─── Discover languages ─────────────────────────────────────────────────

let targetLangs;
if (args.length > 0) {
  targetLangs = args;
} else {
  targetLangs = readdirSync(LEXICON_BASE)
    .filter(f => {
      const p = join(LEXICON_BASE, f);
      return f !== 'links' && !f.endsWith('.json') && existsSync(p) && statSync(p).isDirectory();
    });
}

console.log('Validating lexicon...\n');

let totalErrors = 0;
let totalWarnings = 0;

// ─── Validate lexicon entries ───────────────────────────────────────────

const allWordIds = {}; // lang -> Set of word IDs

for (const lang of targetLangs) {
  const langPath = join(LEXICON_BASE, lang);
  if (!existsSync(langPath)) {
    console.log(`  Skipping ${lang} (not found)`);
    continue;
  }

  allWordIds[lang] = new Set();
  const bankFiles = readdirSync(langPath).filter(f => f.endsWith('bank.json'));

  for (const bankFile of bankFiles) {
    const filePath = join(langPath, bankFile);
    const data = JSON.parse(readFileSync(filePath, 'utf8'));
    const { _metadata, ...entries } = data;

    // Validate each entry individually
    let bankErrors = 0;
    for (const [id, entry] of Object.entries(entries)) {
      // Check required fields
      if (!entry.word) {
        console.error(`  ERROR [${lang}/${bankFile}] ${id}: missing 'word' field`);
        bankErrors++;
      }
      if (!entry.type) {
        console.error(`  ERROR [${lang}/${bankFile}] ${id}: missing 'type' field`);
        bankErrors++;
      }

      // Check ID uniqueness
      if (allWordIds[lang].has(id)) {
        console.error(`  ERROR [${lang}/${bankFile}] ${id}: duplicate word ID`);
        bankErrors++;
      }
      allWordIds[lang].add(id);
    }

    const count = Object.keys(entries).length;
    if (bankErrors > 0) {
      console.error(`  FAIL ${lang}/${bankFile}: ${count} entries, ${bankErrors} error(s)`);
      totalErrors += bankErrors;
    } else {
      console.log(`  PASS ${lang}/${bankFile}: ${count} entries`);
    }
  }
}

// ─── Validate links ────────────────────────────────────────────────────

console.log('\nValidating links...\n');

const linksBase = join(LEXICON_BASE, 'links');
if (existsSync(linksBase)) {
  const linkPairs = readdirSync(linksBase)
    .filter(f => statSync(join(linksBase, f)).isDirectory());

  // If specific languages were requested, filter link pairs to only those involving them
  const relevantPairs = args.length > 0
    ? linkPairs.filter(p => {
        const [from, to] = p.split('-');
        return args.includes(from) || args.includes(to);
      })
    : linkPairs;

  for (const pair of relevantPairs) {
    const pairDir = join(linksBase, pair);
    const [fromLang, toLang] = pair.split('-');
    const bankFiles = readdirSync(pairDir).filter(f => f.endsWith('.json'));

    for (const bankFile of bankFiles) {
      const filePath = join(pairDir, bankFile);
      const data = JSON.parse(readFileSync(filePath, 'utf8'));
      const { _metadata, ...links } = data;

      let linkErrors = 0;
      let brokenTargets = 0;
      let brokenSources = 0;

      for (const [sourceId, link] of Object.entries(links)) {
        // Validate link has primary
        if (!link.primary) {
          console.error(`  ERROR [links/${pair}/${bankFile}] ${sourceId}: missing 'primary' field`);
          linkErrors++;
          continue;
        }

        // Check source word exists in source language lexicon
        if (allWordIds[fromLang] && !allWordIds[fromLang].has(sourceId)) {
          brokenSources++;
        }

        // Check primary target exists in target language lexicon
        if (allWordIds[toLang] && !allWordIds[toLang].has(link.primary)) {
          brokenTargets++;
        }

        // Check alternative targets exist
        if (link.alternatives) {
          for (const altId of link.alternatives) {
            if (allWordIds[toLang] && !allWordIds[toLang].has(altId)) {
              brokenTargets++;
            }
          }
        }
      }

      const count = Object.keys(links).length;
      if (linkErrors > 0) {
        console.error(`  FAIL links/${pair}/${bankFile}: ${count} links, ${linkErrors} error(s)`);
        totalErrors += linkErrors;
      } else {
        let suffix = '';
        if (brokenSources > 0 || brokenTargets > 0) {
          const parts = [];
          if (brokenSources > 0) parts.push(`${brokenSources} source(s) not in ${fromLang} lexicon`);
          if (brokenTargets > 0) parts.push(`${brokenTargets} target(s) not in ${toLang} lexicon`);
          suffix = ` [warn: ${parts.join(', ')}]`;
          totalWarnings += brokenSources + brokenTargets;
        }
        console.log(`  PASS links/${pair}/${bankFile}: ${count} links${suffix}`);
      }
    }
  }
}

// ─── Orphan detection ──────────────────────────────────────────────────

console.log('\nChecking for orphaned entries...\n');

// Build set of all word IDs referenced in links (as sources or targets)
const linkedWordIds = {}; // lang -> Set

if (existsSync(linksBase)) {
  const linkPairs = readdirSync(linksBase)
    .filter(f => statSync(join(linksBase, f)).isDirectory());

  for (const pair of linkPairs) {
    const pairDir = join(linksBase, pair);
    const [fromLang, toLang] = pair.split('-');

    if (!linkedWordIds[fromLang]) linkedWordIds[fromLang] = new Set();
    if (!linkedWordIds[toLang]) linkedWordIds[toLang] = new Set();

    const bankFiles = readdirSync(pairDir).filter(f => f.endsWith('.json'));
    for (const bankFile of bankFiles) {
      const data = JSON.parse(readFileSync(join(pairDir, bankFile), 'utf8'));
      const { _metadata, ...links } = data;

      for (const [sourceId, link] of Object.entries(links)) {
        linkedWordIds[fromLang].add(sourceId);
        if (link.primary) linkedWordIds[toLang].add(link.primary);
        if (link.alternatives) link.alternatives.forEach(a => linkedWordIds[toLang].add(a));
      }
    }
  }
}

for (const lang of targetLangs) {
  if (!allWordIds[lang]) continue;
  const linked = linkedWordIds[lang] || new Set();
  const orphans = [...allWordIds[lang]].filter(id => !linked.has(id));

  if (orphans.length > 0) {
    console.log(`  ${lang}: ${orphans.length} orphaned entries (no links)`);
    if (orphans.length <= 10) {
      orphans.forEach(id => console.log(`    - ${id}`));
    } else {
      orphans.slice(0, 5).forEach(id => console.log(`    - ${id}`));
      console.log(`    ... and ${orphans.length - 5} more`);
    }
  } else {
    console.log(`  ${lang}: no orphans`);
  }
}

// ─── Summary ───────────────────────────────────────────────────────────

console.log('\n=== Summary ===');
for (const lang of targetLangs) {
  if (allWordIds[lang]) {
    console.log(`  ${lang}: ${allWordIds[lang].size} entries`);
  }
}
console.log(`  Errors: ${totalErrors}`);
console.log(`  Warnings: ${totalWarnings}`);

if (totalErrors > 0) {
  console.error('\nValidation FAILED');
  process.exit(1);
} else {
  console.log('\nValidation PASSED');
  process.exit(0);
}
