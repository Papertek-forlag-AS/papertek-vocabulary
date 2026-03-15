/**
 * Generate missing bidirectional links between all language pairs
 * by chaining through NB as a pivot language.
 *
 * Example: DE→NB→ES creates DE↔ES links.
 *
 * For each missing pair, finds entries in both languages that link to
 * the same NB word and creates a direct link between them.
 *
 * Usage:
 *   node scripts/generate-transitive-links.js [--dry-run]
 */

import fs from 'fs';
import path from 'path';

const LANGUAGES = ['de', 'en', 'es', 'fr', 'nb', 'nn'];

function loadLinks(pair) {
  const dir = `vocabulary/lexicon/links/${pair}`;
  const index = {};
  if (!fs.existsSync(dir)) return index;
  for (const f of fs.readdirSync(dir).filter(f => f.endsWith('.json'))) {
    const bankName = f.replace('.json', '');
    const data = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
    for (const [k, v] of Object.entries(data)) {
      if (k !== '_metadata') index[k] = { ...v, _bank: bankName };
    }
  }
  return index;
}

function loadWordIndex(lang) {
  const dir = `vocabulary/lexicon/${lang}`;
  const index = {};
  for (const f of fs.readdirSync(dir).filter(f => f.endsWith('bank.json'))) {
    const bankName = f.replace('.json', '');
    const data = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
    for (const [k, v] of Object.entries(data)) {
      if (k !== '_metadata') index[k] = { word: v.word, type: v.type, bank: bankName };
    }
  }
  return index;
}

const TYPE_TO_BANK = {
  noun: 'nounbank', verb: 'verbbank', verbe: 'verbbank',
  adj: 'adjectivebank',
  adv: 'generalbank', prep: 'generalbank', conj: 'generalbank',
  interj: 'generalbank', pron: 'generalbank', num: 'generalbank',
  phrase: 'generalbank', expr: 'generalbank', propn: 'generalbank',
  art: 'generalbank', article: 'generalbank', interr: 'generalbank',
  contr: 'generalbank', possessiv: 'generalbank',
  // ES-specific banks
  articulo: 'articlesbank',
};

function getBank(wordId, type, lang) {
  // Check language-specific bank files that might exist
  if (['de', 'es', 'fr'].includes(lang)) {
    if (type === 'art' || type === 'article' || type === 'articulo') return 'articlesbank';
    if (type === 'num') return 'numbersbank';
    if (type === 'phrase') return 'phrasesbank';
    if (type === 'pron' || type === 'possessiv') return 'pronounsbank';
  }
  return TYPE_TO_BANK[type] || 'generalbank';
}

function saveLinkDir(linkDir, links) {
  fs.mkdirSync(linkDir, { recursive: true });
  // Group by bank
  const byBank = {};
  for (const [wordId, linkData] of Object.entries(links)) {
    const bank = linkData._bank || 'generalbank';
    if (!byBank[bank]) byBank[bank] = {};
    const { _bank, ...data } = linkData;
    byBank[bank][wordId] = data;
  }
  for (const [bank, data] of Object.entries(byBank)) {
    const filePath = path.join(linkDir, bank + '.json');
    // Merge with existing if present
    let existing = {};
    if (fs.existsSync(filePath)) {
      existing = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    }
    const merged = { ...existing, ...data };
    fs.writeFileSync(filePath, JSON.stringify(merged, null, 2) + '\n', 'utf8');
  }
}

// ========== MAIN ==========

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
if (dryRun) console.log('[DRY RUN]\n');

// Load all existing link indices
console.log('Loading existing links...');
const allLinks = {};
for (const from of LANGUAGES) {
  for (const to of LANGUAGES) {
    if (from === to) continue;
    allLinks[`${from}-${to}`] = loadLinks(`${from}-${to}`);
  }
}

// Load word indices for all languages
const wordIndices = {};
for (const lang of LANGUAGES) {
  wordIndices[lang] = loadWordIndex(lang);
}

// Build NB reverse index: for each NB word, which words in other languages link to it?
// nbId → { de: deId, en: enId, es: esId, fr: frId, nn: nnId }
console.log('Building NB pivot index...');
const nbPivot = {};
for (const lang of LANGUAGES) {
  if (lang === 'nb') continue;
  const langToNb = allLinks[`${lang}-nb`];
  for (const [langId, linkData] of Object.entries(langToNb)) {
    const nbId = linkData.primary;
    if (!nbId) continue;
    if (!nbPivot[nbId]) nbPivot[nbId] = {};
    nbPivot[nbId][lang] = langId;
  }
}

// For each pair that needs links, generate them via NB pivot
console.log('Generating transitive links...\n');
let totalGenerated = 0;

for (const from of LANGUAGES) {
  for (const to of LANGUAGES) {
    if (from === to || from === 'nb' || to === 'nb') continue;

    const pair = `${from}-${to}`;
    const existing = allLinks[pair];
    const existingCount = Object.keys(existing).length;
    const fromCount = Object.keys(wordIndices[from]).length;

    // Skip if already well-covered (>90%)
    if (existingCount / fromCount > 0.9) continue;

    const newLinks = {};
    let generated = 0;

    // For each NB pivot word, check if both languages are connected
    for (const [nbId, connected] of Object.entries(nbPivot)) {
      const fromId = connected[from];
      const toId = connected[to];

      if (!fromId || !toId) continue;
      if (existing[fromId]) continue; // already has a link

      const toWord = wordIndices[to][toId];
      if (!toWord) continue;

      const fromWord = wordIndices[from][fromId];
      if (!fromWord) continue;

      const bank = fromWord.bank || getBank(fromId, fromWord.type, from);

      newLinks[fromId] = {
        primary: toId,
        _bank: bank,
      };
      generated++;
    }

    if (generated > 0) {
      console.log(`${pair}: +${generated} new links (was ${existingCount}, now ${existingCount + generated})`);
      totalGenerated += generated;

      if (!dryRun) {
        const linkDir = `vocabulary/lexicon/links/${pair}`;
        saveLinkDir(linkDir, newLinks);
      }
    }
  }
}

console.log(`\nTotal new links: ${totalGenerated}`);
