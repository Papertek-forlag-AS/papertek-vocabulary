/**
 * generate-en-links.js
 *
 * Generates bidirectional links between source languages and English.
 * Same approach as generate-links.js but for EN pairs.
 *
 * Usage:
 *   node scripts/generate-en-links.js
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

const VOCAB_BASE = 'vocabulary';
const TRANS_BASE = join(VOCAB_BASE, 'translations');
const LEXICON_BASE = join(VOCAB_BASE, 'lexicon');
const LINKS_BASE = join(LEXICON_BASE, 'links');
const EN_BASE = join(LEXICON_BASE, 'en');

const EN_PAIRS = ['de-en', 'es-en'];

const BANK_FILES = [
  'nounbank.json', 'verbbank.json', 'adjectivebank.json',
  'generalbank.json', 'articlesbank.json', 'numbersbank.json',
  'phrasesbank.json', 'pronounsbank.json',
];

const SUFFIX_TO_TYPE = {
  noun: 'noun', verb: 'verb', adj: 'adj', adv: 'adv',
  prep: 'prep', conj: 'conj', interj: 'interj', pron: 'pron',
  art: 'art', num: 'num', phrase: 'phrase', interr: 'interr',
  propn: 'propn', contr: 'contr', expr: 'expr',
  dem_pron: 'pron', poss_pron: 'pron', dobj_pron: 'pron',
  iobj_pron: 'pron', refl_pron: 'pron', possessiv: 'pron',
  modal: 'verb', verbphrase: 'phrase', general: 'adv', land: 'propn',
};

function normalizeToId(word, type) {
  let normalized = word.toLowerCase().trim();
  if (normalized.startsWith('to ')) normalized = normalized.substring(3);
  normalized = normalized.replace(/\s+/g, '_');
  normalized = normalized.replace(/\s*\(.*?\)\s*/g, '');
  normalized = normalized.replace(/^_+|_+$/g, '');
  normalized = normalized.replace(/[^a-z0-9_]/g, '');
  return `${normalized}_${type}`;
}

function getTypeFromSourceId(sourceId) {
  const parts = sourceId.split('_');
  if (parts.length >= 3) {
    const s = parts.slice(-2).join('_');
    if (SUFFIX_TO_TYPE[s]) return SUFFIX_TO_TYPE[s];
  }
  if (parts.length >= 2) {
    const s = parts[parts.length - 1];
    if (SUFFIX_TO_TYPE[s]) return SUFFIX_TO_TYPE[s];
  }
  return 'adv';
}

function splitAlts(t) { return t.split(/\s*\/\s*/).map(s => s.trim()).filter(s => s.length > 0); }
function cleanWord(t) { return t.replace(/\s*\(.*?\)\s*/g, '').trim(); }

// Load EN word IDs
const enWordIds = new Set();
for (const bf of ['nounbank.json', 'verbbank.json', 'adjectivebank.json', 'generalbank.json']) {
  const fp = join(EN_BASE, bf);
  if (existsSync(fp)) {
    const d = JSON.parse(readFileSync(fp, 'utf8'));
    const { _metadata, ...entries } = d;
    Object.keys(entries).forEach(id => enWordIds.add(id));
  }
}
console.log(`Loaded ${enWordIds.size} EN word IDs\n`);

let totalForward = 0, totalReverse = 0;

for (const pair of EN_PAIRS) {
  const pairDir = join(TRANS_BASE, pair);
  if (!existsSync(pairDir)) continue;

  const sourceLang = pair.split('-')[0];
  const forwardDir = join(LINKS_BASE, pair);
  const reverseDir = join(LINKS_BASE, `en-${sourceLang}`);
  mkdirSync(forwardDir, { recursive: true });
  mkdirSync(reverseDir, { recursive: true });

  let sourceBanks = {};
  const sbd = existsSync(join(VOCAB_BASE, 'banks', sourceLang))
    ? join(VOCAB_BASE, 'banks', sourceLang)
    : existsSync(join(VOCAB_BASE, 'core', sourceLang))
      ? join(VOCAB_BASE, 'core', sourceLang) : null;
  if (sbd) {
    for (const bf of BANK_FILES) {
      const bp = join(sbd, bf);
      if (existsSync(bp)) {
        const d = JSON.parse(readFileSync(bp, 'utf8'));
        const { _metadata, ...entries } = d;
        Object.assign(sourceBanks, entries);
      }
    }
  }

  for (const bankFile of BANK_FILES) {
    const fp = join(pairDir, bankFile);
    if (!existsSync(fp)) continue;
    const data = JSON.parse(readFileSync(fp, 'utf8'));
    const { _metadata, ...entries } = data;
    if (Object.keys(entries).length === 0) continue;

    const bankName = bankFile.replace('.json', '');
    const forwardLinks = {};

    for (const [sourceId, te] of Object.entries(entries)) {
      if (!te.translation) continue;
      let type;
      if (sourceBanks[sourceId]?.type) {
        type = SUFFIX_TO_TYPE[sourceBanks[sourceId].type] || getTypeFromSourceId(sourceId);
      } else {
        type = getTypeFromSourceId(sourceId);
      }

      const alts = splitAlts(te.translation);
      const primaryId = normalizeToId(cleanWord(alts[0]), type);
      if (!enWordIds.has(primaryId)) continue;

      const link = { primary: primaryId };
      const altIds = alts.slice(1).map(a => normalizeToId(cleanWord(a), type)).filter(id => enWordIds.has(id));
      if (altIds.length > 0) link.alternatives = altIds;
      if (te.examples?.length > 0) link.examples = te.examples.map(ex => ({ source: ex.sentence, target: ex.translation }));
      if (te.explanation?._description) link.explanation = te.explanation._description;
      if (te.synonyms?.length > 0) link.synonyms = te.synonyms;

      forwardLinks[sourceId] = link;
      totalForward++;
    }

    if (Object.keys(forwardLinks).length === 0) continue;

    // Sort and write forward
    const sf = {};
    for (const k of Object.keys(forwardLinks).sort()) sf[k] = forwardLinks[k];
    writeFileSync(join(forwardDir, bankFile), JSON.stringify({
      _metadata: { from: sourceLang, to: 'en', bank: bankName, generatedAt: new Date().toISOString(), totalLinks: Object.keys(sf).length },
      ...sf,
    }, null, 2) + '\n');

    // Build reverse
    const reverseMap = new Map();
    for (const [srcId, link] of Object.entries(sf)) {
      const enId = link.primary;
      if (!reverseMap.has(enId)) reverseMap.set(enId, { primary: null, alternatives: [], examples: [] });
      const rev = reverseMap.get(enId);
      if (!rev.primary) {
        rev.primary = srcId;
        if (link.examples) rev.examples = link.examples.map(ex => ({ source: ex.target, target: ex.source }));
      } else {
        rev.alternatives.push(srcId);
      }
      if (link.alternatives) {
        for (const altId of link.alternatives) {
          if (!reverseMap.has(altId)) reverseMap.set(altId, { primary: null, alternatives: [], examples: [] });
          const ar = reverseMap.get(altId);
          if (!ar.primary) ar.primary = srcId; else ar.alternatives.push(srcId);
        }
      }
    }

    const reverseLinks = {};
    for (const [enId, rev] of reverseMap) {
      if (!rev.primary) continue;
      const re = { primary: rev.primary };
      if (rev.alternatives.length > 0) re.alternatives = rev.alternatives;
      if (rev.examples?.length > 0) re.examples = rev.examples;
      reverseLinks[enId] = re;
      totalReverse++;
    }

    const sr = {};
    for (const k of Object.keys(reverseLinks).sort()) sr[k] = reverseLinks[k];
    writeFileSync(join(reverseDir, bankFile), JSON.stringify({
      _metadata: { from: 'en', to: sourceLang, bank: bankName, generatedAt: new Date().toISOString(), totalLinks: Object.keys(sr).length },
      ...sr,
    }, null, 2) + '\n');

    console.log(`  ${pair}/${bankName}: ${Object.keys(sf).length} forward, ${Object.keys(sr).length} reverse`);
  }
  console.log();
}

console.log(`=== Summary ===`);
console.log(`  Forward links: ${totalForward}`);
console.log(`  Reverse links: ${totalReverse}`);
