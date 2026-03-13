/**
 * generate-links.js
 *
 * Phase 2 of the two-way dictionary: generates bidirectional links
 * between source language words and Norwegian Bokmål lexicon entries.
 *
 * Reads translations/{lang}-nb/*.json and maps source word IDs to
 * NB lexicon word IDs. Generates both forward (de-nb) and reverse
 * (nb-de) link files.
 *
 * Usage:
 *   node scripts/generate-links.js
 *
 * Output:
 *   vocabulary/lexicon/links/de-nb/*.json   (forward links)
 *   vocabulary/lexicon/links/nb-de/*.json   (reverse links)
 *   vocabulary/lexicon/links/es-nb/*.json
 *   vocabulary/lexicon/links/nb-es/*.json
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync } from 'fs';
import { join } from 'path';

const VOCAB_BASE = 'vocabulary';
const TRANS_BASE = join(VOCAB_BASE, 'translations');
const LEXICON_BASE = join(VOCAB_BASE, 'lexicon');
const LINKS_BASE = join(LEXICON_BASE, 'links');
const NB_BASE = join(LEXICON_BASE, 'nb');

const NB_PAIRS = ['de-nb', 'es-nb'];

const BANK_FILES = [
  'nounbank.json',
  'verbbank.json',
  'adjectivebank.json',
  'generalbank.json',
  'articlesbank.json',
  'numbersbank.json',
  'phrasesbank.json',
  'pronounsbank.json',
];

// Map source word ID suffix to NB word type (same as generate-nb-lexicon.js)
const SUFFIX_TO_TYPE = {
  noun: 'noun', verb: 'verb', adj: 'adj', adv: 'adv',
  prep: 'prep', conj: 'conj', interj: 'interj', pron: 'pron',
  art: 'art', num: 'num', phrase: 'phrase', interr: 'interr',
  propn: 'propn', contr: 'contr', expr: 'expr',
  dem_pron: 'pron', poss_pron: 'pron', dobj_pron: 'pron',
  iobj_pron: 'pron', refl_pron: 'pron', possessiv: 'pron',
  modal: 'verb', verbphrase: 'phrase', general: 'adv', land: 'propn',
};

// Which NB bank each type maps to
const TYPE_TO_NB_BANK = {
  noun: 'nounbank', verb: 'verbbank', adj: 'adjectivebank',
  adv: 'generalbank', prep: 'generalbank', conj: 'generalbank',
  interj: 'generalbank', pron: 'generalbank', art: 'generalbank',
  num: 'generalbank', phrase: 'generalbank', interr: 'generalbank',
  propn: 'generalbank', contr: 'generalbank', expr: 'generalbank',
};

/**
 * Normalize a Norwegian word into a word ID (must match generate-nb-lexicon.js)
 */
function normalizeToId(word, type) {
  let normalized = word.toLowerCase().trim();
  if (normalized.startsWith('å ')) normalized = normalized.substring(2);
  normalized = normalized.replace(/\s+/g, '_');
  normalized = normalized.replace(/\s*\(.*?\)\s*/g, '');
  normalized = normalized.replace(/^_+|_+$/g, '');
  normalized = normalized.replace(/[^a-zæøå0-9_]/g, '');
  return `${normalized}_${type}`;
}

function getTypeFromSourceId(sourceId) {
  const parts = sourceId.split('_');
  if (parts.length >= 3) {
    const twoPartSuffix = parts.slice(-2).join('_');
    if (SUFFIX_TO_TYPE[twoPartSuffix]) return SUFFIX_TO_TYPE[twoPartSuffix];
  }
  if (parts.length >= 2) {
    const suffix = parts[parts.length - 1];
    if (SUFFIX_TO_TYPE[suffix]) return SUFFIX_TO_TYPE[suffix];
  }
  return 'adv';
}

function splitAlternatives(translation) {
  return translation.split(/\s*\/\s*/).map(s => s.trim()).filter(s => s.length > 0);
}

function parseTranslation(translation) {
  const cleanWord = translation.replace(/\s*\(.*?\)\s*/g, '').trim();
  return cleanWord;
}

// ─── Load NB lexicon word IDs for validation ──────────────────────────────

const nbWordIds = new Set();
for (const bankFile of ['nounbank.json', 'verbbank.json', 'adjectivebank.json', 'generalbank.json']) {
  const filePath = join(NB_BASE, bankFile);
  if (existsSync(filePath)) {
    const data = JSON.parse(readFileSync(filePath, 'utf8'));
    const { _metadata, ...entries } = data;
    Object.keys(entries).forEach(id => nbWordIds.add(id));
  }
}
console.log(`Loaded ${nbWordIds.size} NB lexicon word IDs for validation\n`);

// ─── Generate forward links ──────────────────────────────────────────────

let totalForwardLinks = 0;
let totalReverseLinks = 0;
let orphanedLinks = 0;

for (const pair of NB_PAIRS) {
  const pairDir = join(TRANS_BASE, pair);
  if (!existsSync(pairDir)) {
    console.log(`  Skipping ${pair} (not found)`);
    continue;
  }

  const sourceLang = pair.split('-')[0];
  const forwardDir = join(LINKS_BASE, pair);
  const reverseDir = join(LINKS_BASE, `nb-${sourceLang}`);
  mkdirSync(forwardDir, { recursive: true });
  mkdirSync(reverseDir, { recursive: true });

  // Load source banks for type info
  let sourceBanks = {};
  const sourceBankDir = existsSync(join(VOCAB_BASE, 'banks', sourceLang))
    ? join(VOCAB_BASE, 'banks', sourceLang)
    : existsSync(join(VOCAB_BASE, 'core', sourceLang))
      ? join(VOCAB_BASE, 'core', sourceLang)
      : null;

  if (sourceBankDir) {
    for (const bankFile of BANK_FILES) {
      const bankPath = join(sourceBankDir, bankFile);
      if (existsSync(bankPath)) {
        const data = JSON.parse(readFileSync(bankPath, 'utf8'));
        const { _metadata, ...entries } = data;
        Object.assign(sourceBanks, entries);
      }
    }
  }

  // Process each bank file
  for (const bankFile of BANK_FILES) {
    const filePath = join(pairDir, bankFile);
    if (!existsSync(filePath)) continue;

    const data = JSON.parse(readFileSync(filePath, 'utf8'));
    const { _metadata, ...entries } = data;
    if (Object.keys(entries).length === 0) continue;

    const forwardLinks = {};
    const bankName = bankFile.replace('.json', '');

    for (const [sourceId, transEntry] of Object.entries(entries)) {
      if (!transEntry.translation) continue;

      // Determine type
      let type;
      if (sourceBanks[sourceId] && sourceBanks[sourceId].type) {
        type = SUFFIX_TO_TYPE[sourceBanks[sourceId].type] || getTypeFromSourceId(sourceId);
      } else {
        type = getTypeFromSourceId(sourceId);
      }

      const alternatives = splitAlternatives(transEntry.translation);
      const primaryWord = parseTranslation(alternatives[0]);
      const primaryId = normalizeToId(primaryWord, type);

      // Validate primary exists in NB lexicon
      if (!nbWordIds.has(primaryId)) {
        orphanedLinks++;
        continue;
      }

      // Build alternative IDs (skip first, that's the primary)
      const altIds = [];
      for (let i = 1; i < alternatives.length; i++) {
        const altWord = parseTranslation(alternatives[i]);
        const altId = normalizeToId(altWord, type);
        if (nbWordIds.has(altId)) {
          altIds.push(altId);
        }
      }

      // Build the link entry
      const link = {
        primary: primaryId,
      };

      if (altIds.length > 0) {
        link.alternatives = altIds;
      }

      // Carry over examples
      if (transEntry.examples && transEntry.examples.length > 0) {
        link.examples = transEntry.examples.map(ex => ({
          source: ex.sentence,
          target: ex.translation,
        }));
      }

      // Carry over explanation
      if (transEntry.explanation && transEntry.explanation._description) {
        link.explanation = transEntry.explanation._description;
      }

      // Carry over synonyms
      if (transEntry.synonyms && transEntry.synonyms.length > 0) {
        link.synonyms = transEntry.synonyms;
      }

      forwardLinks[sourceId] = link;
      totalForwardLinks++;
    }

    if (Object.keys(forwardLinks).length === 0) continue;

    // Sort forward links alphabetically
    const sortedForward = {};
    for (const key of Object.keys(forwardLinks).sort()) {
      sortedForward[key] = forwardLinks[key];
    }

    // Write forward link file
    const forwardOutput = {
      _metadata: {
        from: sourceLang,
        to: 'nb',
        bank: bankName,
        generatedAt: new Date().toISOString(),
        totalLinks: Object.keys(sortedForward).length,
      },
      ...sortedForward,
    };
    const forwardPath = join(forwardDir, bankFile);
    writeFileSync(forwardPath, JSON.stringify(forwardOutput, null, 2) + '\n');
    console.log(`  Forward: ${forwardPath} (${Object.keys(sortedForward).length} links)`);

    // ─── Generate reverse links ────────────────────────────────────────

    // Invert: for each NB word, collect all source words that link to it
    const reverseMap = new Map();

    for (const [sourceId, link] of Object.entries(sortedForward)) {
      // Primary link: nb word → source word
      const nbId = link.primary;
      if (!reverseMap.has(nbId)) {
        reverseMap.set(nbId, { primary: null, alternatives: [], examples: [] });
      }
      const rev = reverseMap.get(nbId);

      if (!rev.primary) {
        rev.primary = sourceId;
        // Carry over examples (reversed direction labels)
        if (link.examples) {
          rev.examples = link.examples.map(ex => ({
            source: ex.target,
            target: ex.source,
          }));
        }
      } else {
        // Multiple source words map to same NB word → add as alternative
        rev.alternatives.push(sourceId);
      }

      // Also create reverse entries for alternatives
      if (link.alternatives) {
        for (const altNbId of link.alternatives) {
          if (!reverseMap.has(altNbId)) {
            reverseMap.set(altNbId, { primary: null, alternatives: [], examples: [] });
          }
          const altRev = reverseMap.get(altNbId);
          if (!altRev.primary) {
            altRev.primary = sourceId;
          } else {
            altRev.alternatives.push(sourceId);
          }
        }
      }
    }

    // Build reverse link entries
    const reverseLinks = {};
    for (const [nbId, rev] of reverseMap) {
      if (!rev.primary) continue;

      const reverseEntry = { primary: rev.primary };
      if (rev.alternatives.length > 0) {
        reverseEntry.alternatives = rev.alternatives;
      }
      if (rev.examples && rev.examples.length > 0) {
        reverseEntry.examples = rev.examples;
      }
      reverseLinks[nbId] = reverseEntry;
      totalReverseLinks++;
    }

    // Sort and write
    const sortedReverse = {};
    for (const key of Object.keys(reverseLinks).sort()) {
      sortedReverse[key] = reverseLinks[key];
    }

    const reverseOutput = {
      _metadata: {
        from: 'nb',
        to: sourceLang,
        bank: bankName,
        generatedAt: new Date().toISOString(),
        totalLinks: Object.keys(sortedReverse).length,
      },
      ...sortedReverse,
    };
    const reversePath = join(reverseDir, bankFile);
    writeFileSync(reversePath, JSON.stringify(reverseOutput, null, 2) + '\n');
    console.log(`  Reverse: ${reversePath} (${Object.keys(sortedReverse).length} links)`);
  }

  console.log();
}

// ─── Summary ──────────────────────────────────────────────────────────────

console.log('=== Summary ===');
console.log(`  Forward links generated: ${totalForwardLinks}`);
console.log(`  Reverse links generated: ${totalReverseLinks}`);
console.log(`  Orphaned (NB word not found): ${orphanedLinks}`);
console.log(`\n  Output: ${LINKS_BASE}/`);
