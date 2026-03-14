/**
 * generate-fr-links.js
 *
 * Generates bidirectional links between French and Norwegian Bokmål / English.
 * Unlike de/es which have separate translation files, FR translations are
 * embedded in the core/fr source data (entry.translations.nb / .en).
 *
 * Generates:
 *   - fr-nb / nb-fr  (French ↔ Norwegian Bokmål)
 *   - fr-en / en-fr  (French ↔ English)
 *
 * Usage:
 *   node scripts/generate-fr-links.js
 *
 * Requires:
 *   vocabulary/core/fr/*.json     (source data with embedded translations)
 *   vocabulary/lexicon/nb/*.json  (NB lexicon for validation)
 *   vocabulary/lexicon/en/*.json  (EN lexicon for validation)
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

const VOCAB_BASE = 'vocabulary';
const LEXICON_BASE = join(VOCAB_BASE, 'lexicon');
const LINKS_BASE = join(LEXICON_BASE, 'links');
const FR_SOURCE = join(VOCAB_BASE, 'core', 'fr');

const BANK_FILES = [
  'nounbank.json', 'verbbank.json', 'adjectivebank.json',
  'generalbank.json', 'articlesbank.json', 'numbersbank.json',
  'phrasesbank.json', 'pronounsbank.json',
];

// Map FR types to standard types used in NB/EN word IDs
const FR_TYPE_MAP = {
  verbe: 'verb',
  article: 'art',
  ordinal: 'num',
};

// Standard suffix-to-type mapping
const SUFFIX_TO_TYPE = {
  noun: 'noun', verb: 'verb', adj: 'adj', adv: 'adv',
  prep: 'prep', conj: 'conj', interj: 'interj', pron: 'pron',
  art: 'art', num: 'num', phrase: 'phrase', interr: 'interr',
  propn: 'propn', contr: 'contr', expr: 'expr',
  verbe: 'verb', article: 'art', ordinal: 'num',
};

function inferTypeFromId(id) {
  const parts = id.split('_');
  if (parts.length >= 2) {
    const suffix = parts[parts.length - 1];
    if (SUFFIX_TO_TYPE[suffix]) return SUFFIX_TO_TYPE[suffix];
  }
  return 'adv';
}

function normalizeNbId(word, type) {
  let normalized = word.toLowerCase().trim();
  if (normalized.startsWith('å ')) normalized = normalized.substring(2);
  normalized = normalized.replace(/\s+/g, '_');
  normalized = normalized.replace(/\s*\(.*?\)\s*/g, '');
  normalized = normalized.replace(/^_+|_+$/g, '');
  normalized = normalized.replace(/[^a-zæøå0-9_]/g, '');
  return `${normalized}_${type}`;
}

function normalizeEnId(word, type) {
  let normalized = word.toLowerCase().trim();
  if (normalized.startsWith('to ')) normalized = normalized.substring(3);
  normalized = normalized.replace(/\s+/g, '_');
  normalized = normalized.replace(/\s*\(.*?\)\s*/g, '');
  normalized = normalized.replace(/^_+|_+$/g, '');
  normalized = normalized.replace(/[^a-z0-9_]/g, '');
  return `${normalized}_${type}`;
}

function splitAlts(text) {
  // Split on comma or slash, handling "å gjøre, å lage" and "to do, to make"
  return text.split(/\s*[,\/]\s*/).map(s => s.trim()).filter(s => s.length > 0);
}

function cleanWord(text) {
  return text.replace(/\s*\(.*?\)\s*/g, '').trim();
}

// Load word IDs from a language lexicon
function loadWordIds(lang) {
  const ids = new Set();
  for (const bf of ['nounbank.json', 'verbbank.json', 'adjectivebank.json', 'generalbank.json']) {
    const fp = join(LEXICON_BASE, lang, bf);
    if (existsSync(fp)) {
      const data = JSON.parse(readFileSync(fp, 'utf8'));
      const { _metadata, ...entries } = data;
      Object.keys(entries).forEach(id => ids.add(id));
    }
  }
  return ids;
}

// ─── Main ────────────────────────────────────────────────────────────────

console.log('Generating French links from embedded translations...\n');

const nbWordIds = loadWordIds('nb');
const enWordIds = loadWordIds('en');
console.log(`  NB lexicon: ${nbWordIds.size} word IDs`);
console.log(`  EN lexicon: ${enWordIds.size} word IDs\n`);

// Create output directories
for (const dir of ['fr-nb', 'nb-fr', 'fr-en', 'en-fr']) {
  mkdirSync(join(LINKS_BASE, dir), { recursive: true });
}

let totalFrNb = 0, totalNbFr = 0, totalFrEn = 0, totalEnFr = 0;

for (const bankFile of BANK_FILES) {
  const sourcePath = join(FR_SOURCE, bankFile);
  if (!existsSync(sourcePath)) continue;

  const data = JSON.parse(readFileSync(sourcePath, 'utf8'));
  const { _metadata, ...entries } = data;
  if (Object.keys(entries).length === 0) continue;

  const bankName = bankFile.replace('.json', '');
  const frNbLinks = {};
  const frEnLinks = {};
  const nbFrReverseMap = new Map();
  const enFrReverseMap = new Map();

  for (const [frId, entry] of Object.entries(entries)) {
    // Determine target type
    const frType = entry.type || inferTypeFromId(frId);
    const targetType = FR_TYPE_MAP[frType] || SUFFIX_TO_TYPE[frType] || frType;

    // ── FR → NB ──
    if (entry.translations?.nb) {
      const alts = splitAlts(entry.translations.nb);
      const primaryId = normalizeNbId(cleanWord(alts[0]), targetType);

      if (nbWordIds.has(primaryId)) {
        const link = { primary: primaryId };
        const altIds = alts.slice(1)
          .map(a => normalizeNbId(cleanWord(a), targetType))
          .filter(id => nbWordIds.has(id));
        if (altIds.length > 0) link.alternatives = altIds;

        frNbLinks[frId] = link;

        // Build reverse map
        if (!nbFrReverseMap.has(primaryId)) {
          nbFrReverseMap.set(primaryId, { primary: null, alternatives: [] });
        }
        const rev = nbFrReverseMap.get(primaryId);
        if (!rev.primary) rev.primary = frId;
        else rev.alternatives.push(frId);

        if (link.alternatives) {
          for (const altId of link.alternatives) {
            if (!nbFrReverseMap.has(altId)) {
              nbFrReverseMap.set(altId, { primary: null, alternatives: [] });
            }
            const ar = nbFrReverseMap.get(altId);
            if (!ar.primary) ar.primary = frId;
            else ar.alternatives.push(frId);
          }
        }
      }
    }

    // ── FR → EN ──
    if (entry.translations?.en) {
      const alts = splitAlts(entry.translations.en);
      const primaryId = normalizeEnId(cleanWord(alts[0]), targetType);

      if (enWordIds.has(primaryId)) {
        const link = { primary: primaryId };
        const altIds = alts.slice(1)
          .map(a => normalizeEnId(cleanWord(a), targetType))
          .filter(id => enWordIds.has(id));
        if (altIds.length > 0) link.alternatives = altIds;

        frEnLinks[frId] = link;

        // Build reverse map
        if (!enFrReverseMap.has(primaryId)) {
          enFrReverseMap.set(primaryId, { primary: null, alternatives: [] });
        }
        const rev = enFrReverseMap.get(primaryId);
        if (!rev.primary) rev.primary = frId;
        else rev.alternatives.push(frId);

        if (link.alternatives) {
          for (const altId of link.alternatives) {
            if (!enFrReverseMap.has(altId)) {
              enFrReverseMap.set(altId, { primary: null, alternatives: [] });
            }
            const ar = enFrReverseMap.get(altId);
            if (!ar.primary) ar.primary = frId;
            else ar.alternatives.push(frId);
          }
        }
      }
    }
  }

  // Write fr-nb
  if (Object.keys(frNbLinks).length > 0) {
    const sorted = {};
    for (const k of Object.keys(frNbLinks).sort()) sorted[k] = frNbLinks[k];
    writeFileSync(join(LINKS_BASE, 'fr-nb', bankFile), JSON.stringify({
      _metadata: { from: 'fr', to: 'nb', bank: bankName, generatedAt: new Date().toISOString(), totalLinks: Object.keys(sorted).length },
      ...sorted,
    }, null, 2) + '\n');
    totalFrNb += Object.keys(sorted).length;
    console.log(`  fr-nb/${bankName}: ${Object.keys(sorted).length} links`);
  }

  // Write nb-fr
  const nbFrLinks = {};
  for (const [nbId, rev] of nbFrReverseMap) {
    if (!rev.primary) continue;
    const entry = { primary: rev.primary };
    if (rev.alternatives.length > 0) entry.alternatives = rev.alternatives;
    nbFrLinks[nbId] = entry;
  }
  if (Object.keys(nbFrLinks).length > 0) {
    const sorted = {};
    for (const k of Object.keys(nbFrLinks).sort()) sorted[k] = nbFrLinks[k];
    writeFileSync(join(LINKS_BASE, 'nb-fr', bankFile), JSON.stringify({
      _metadata: { from: 'nb', to: 'fr', bank: bankName, generatedAt: new Date().toISOString(), totalLinks: Object.keys(sorted).length },
      ...sorted,
    }, null, 2) + '\n');
    totalNbFr += Object.keys(sorted).length;
    console.log(`  nb-fr/${bankName}: ${Object.keys(sorted).length} links`);
  }

  // Write fr-en
  if (Object.keys(frEnLinks).length > 0) {
    const sorted = {};
    for (const k of Object.keys(frEnLinks).sort()) sorted[k] = frEnLinks[k];
    writeFileSync(join(LINKS_BASE, 'fr-en', bankFile), JSON.stringify({
      _metadata: { from: 'fr', to: 'en', bank: bankName, generatedAt: new Date().toISOString(), totalLinks: Object.keys(sorted).length },
      ...sorted,
    }, null, 2) + '\n');
    totalFrEn += Object.keys(sorted).length;
    console.log(`  fr-en/${bankName}: ${Object.keys(sorted).length} links`);
  }

  // Write en-fr
  const enFrLinks = {};
  for (const [enId, rev] of enFrReverseMap) {
    if (!rev.primary) continue;
    const entry = { primary: rev.primary };
    if (rev.alternatives.length > 0) entry.alternatives = rev.alternatives;
    enFrLinks[enId] = entry;
  }
  if (Object.keys(enFrLinks).length > 0) {
    const sorted = {};
    for (const k of Object.keys(enFrLinks).sort()) sorted[k] = enFrLinks[k];
    writeFileSync(join(LINKS_BASE, 'en-fr', bankFile), JSON.stringify({
      _metadata: { from: 'en', to: 'fr', bank: bankName, generatedAt: new Date().toISOString(), totalLinks: Object.keys(sorted).length },
      ...sorted,
    }, null, 2) + '\n');
    totalEnFr += Object.keys(sorted).length;
    console.log(`  en-fr/${bankName}: ${Object.keys(sorted).length} links`);
  }
}

console.log('\n=== Summary ===');
console.log(`  fr-nb: ${totalFrNb} links`);
console.log(`  nb-fr: ${totalNbFr} links`);
console.log(`  fr-en: ${totalFrEn} links`);
console.log(`  en-fr: ${totalEnFr} links`);
console.log(`  Total: ${totalFrNb + totalNbFr + totalFrEn + totalEnFr} links`);
