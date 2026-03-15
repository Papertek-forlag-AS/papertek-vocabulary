/**
 * Import new ES/FR translations from generated JSON files.
 *
 * Reads nb-es-translations.json / nb-fr-translations.json and:
 *   1. Creates new lexicon entries in the target language banks
 *   2. Creates bidirectional links (nb↔es, nb↔fr, es↔en, fr↔en, etc.)
 *   3. Runs the enrichment pipeline on new entries (CEFR, frequency, conjugations, etc.)
 *
 * Usage:
 *   node scripts/import-new-translations.js [--dry-run] [es|fr]
 */

import fs from 'fs';
import path from 'path';

const TYPE_TO_BANK = {
  noun: 'nounbank', verb: 'verbbank', verbe: 'verbbank',
  adj: 'adjectivebank',
  adv: 'generalbank', prep: 'generalbank', conj: 'generalbank',
  interj: 'generalbank', pron: 'generalbank', num: 'generalbank',
  phrase: 'generalbank', expr: 'generalbank', propn: 'generalbank',
  art: 'generalbank', article: 'generalbank', interr: 'generalbank',
  contr: 'generalbank', possessiv: 'generalbank',
};

function loadBankData(langDir) {
  const banks = {};
  for (const f of fs.readdirSync(langDir).filter(f => f.endsWith('bank.json'))) {
    const bankName = f.replace('.json', '');
    banks[bankName] = JSON.parse(fs.readFileSync(path.join(langDir, f), 'utf8'));
  }
  return banks;
}

function saveBankData(langDir, banks) {
  for (const [bankName, data] of Object.entries(banks)) {
    fs.writeFileSync(
      path.join(langDir, bankName + '.json'),
      JSON.stringify(data, null, 2) + '\n',
      'utf8'
    );
  }
}

function loadLinkData(linkDir) {
  const links = {};
  if (!fs.existsSync(linkDir)) {
    fs.mkdirSync(linkDir, { recursive: true });
    return links;
  }
  for (const f of fs.readdirSync(linkDir).filter(f => f.endsWith('.json'))) {
    const bankName = f.replace('.json', '');
    links[bankName] = JSON.parse(fs.readFileSync(path.join(linkDir, f), 'utf8'));
  }
  return links;
}

function saveLinkData(linkDir, links) {
  fs.mkdirSync(linkDir, { recursive: true });
  for (const [bankName, data] of Object.entries(links)) {
    fs.writeFileSync(
      path.join(linkDir, bankName + '.json'),
      JSON.stringify(data, null, 2) + '\n',
      'utf8'
    );
  }
}

function ensureBank(banks, bankName) {
  if (!banks[bankName]) {
    banks[bankName] = { _metadata: { language: '', bank: bankName, generatedAt: new Date().toISOString() } };
  }
  return banks[bankName];
}

function ensureLinkBank(links, bankName) {
  if (!links[bankName]) links[bankName] = {};
  return links[bankName];
}

// ========== Main ==========

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const languages = args.filter(a => !a.startsWith('--'));

if (languages.length === 0) {
  console.log('Usage: node scripts/import-new-translations.js [--dry-run] <es|fr>');
  process.exit(0);
}

if (dryRun) console.log('[DRY RUN]\n');

const sourcesDir = 'vocabulary/dictionary/sources';

for (const lang of languages) {
  const transFile = lang === 'es'
    ? path.join(sourcesDir, 'nb-es-translations.json')
    : path.join(sourcesDir, 'nb-fr-translations.json');

  if (!fs.existsSync(transFile)) {
    console.log(`${lang}: translation file not found: ${transFile}`);
    continue;
  }

  const translations = JSON.parse(fs.readFileSync(transFile, 'utf8'));
  const nbIds = Object.keys(translations);
  console.log(`\n=== ${lang.toUpperCase()} ===`);
  console.log(`Translations to import: ${nbIds.length}`);

  // Load existing data
  const langDir = `vocabulary/lexicon/${lang}`;
  const banks = loadBankData(langDir);

  // Load NB data for reference
  const nbBanks = loadBankData('vocabulary/lexicon/nb');

  // Load existing link data
  const nbToLangLinks = loadLinkData(`vocabulary/lexicon/links/nb-${lang}`);
  const langToNbLinks = loadLinkData(`vocabulary/lexicon/links/${lang}-nb`);

  let created = 0, skipped = 0, errors = 0;
  const wordField = lang === 'es' ? 'esWord' : 'frWord';
  const idField = lang === 'es' ? 'esWordId' : 'frWordId';

  for (const [nbId, trans] of Object.entries(translations)) {
    const targetWord = trans[wordField];
    const targetId = trans[idField];

    if (!targetWord || !targetId) { errors++; continue; }

    // Determine type from the target ID suffix
    const parts = targetId.split('_');
    const typeSuffix = parts[parts.length - 1];
    // For two-part suffixes
    let type = typeSuffix;
    if (parts.length >= 3) {
      const twoPartSuffix = parts.slice(-2).join('_');
      if (TYPE_TO_BANK[twoPartSuffix]) type = twoPartSuffix;
    }

    const bankName = TYPE_TO_BANK[type] || 'generalbank';
    const bank = ensureBank(banks, bankName);

    // Skip if entry already exists
    if (bank[targetId]) { skipped++; continue; }

    // Create the entry
    const entry = {
      word: targetWord,
      type: type,
    };

    if (trans.genus) entry.genus = trans.genus;
    if (trans.plural) entry.plural = trans.plural;

    entry._generatedFrom = `nb-${lang}/expansion`;
    entry._enriched = false;

    bank[targetId] = entry;

    // Create bidirectional links
    // NB → lang
    const nbEntry = findNbEntry(nbBanks, nbId);
    const nbBankName = nbEntry?.bank || bankName;
    const nbLinkBank = ensureLinkBank(nbToLangLinks, nbBankName);
    if (!nbLinkBank[nbId]) {
      nbLinkBank[nbId] = { primary: targetId };
    }

    // lang → NB
    const langLinkBank = ensureLinkBank(langToNbLinks, bankName);
    if (!langLinkBank[targetId]) {
      langLinkBank[targetId] = { primary: nbId };
    }

    created++;
  }

  console.log(`Created: ${created} new entries`);
  console.log(`Skipped: ${skipped} (already existed)`);
  console.log(`Errors: ${errors}`);

  if (!dryRun && created > 0) {
    saveBankData(langDir, banks);
    saveLinkData(`vocabulary/lexicon/links/nb-${lang}`, nbToLangLinks);
    saveLinkData(`vocabulary/lexicon/links/${lang}-nb`, langToNbLinks);
    console.log(`Written to ${langDir} and link directories`);

    // Update per-language manifest
    const manifestPath = path.join(langDir, 'manifest.json');
    let totalWords = 0;
    for (const [bankName, data] of Object.entries(banks)) {
      totalWords += Object.keys(data).filter(k => k !== '_metadata').length;
    }
    const manifest = {
      _metadata: { language: lang, generatedAt: new Date().toISOString() },
      summary: { totalWords },
      banks: {},
    };
    for (const [bankName, data] of Object.entries(banks)) {
      manifest.banks[bankName] = Object.keys(data).filter(k => k !== '_metadata').length;
    }
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
    console.log(`Updated manifest: ${totalWords} total words`);
  }
}

function findNbEntry(nbBanks, nbId) {
  for (const [bankName, data] of Object.entries(nbBanks)) {
    if (data[nbId]) return { ...data[nbId], bank: bankName };
  }
  return null;
}
