import fs from 'fs';
import path from 'path';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, X-API-Key',
  'Cache-Control': 'public, max-age=3600, s-maxage=86400',
};

function setCors(res) {
  Object.entries(corsHeaders).forEach(([key, value]) => res.setHeader(key, value));
}

// Map word ID suffixes to bank file names
const TYPE_TO_BANK = {
  noun: 'nounbank', verb: 'verbbank', adj: 'adjectivebank',
  adv: 'generalbank', prep: 'generalbank', conj: 'generalbank',
  interj: 'generalbank', pron: 'generalbank', art: 'generalbank',
  num: 'generalbank', phrase: 'generalbank', interr: 'generalbank',
  propn: 'generalbank', contr: 'generalbank', expr: 'generalbank',
  dem_pron: 'generalbank', poss_pron: 'generalbank',
  dobj_pron: 'generalbank', iobj_pron: 'generalbank',
  refl_pron: 'generalbank', possessiv: 'generalbank',
};

function wordIdToBank(wordId) {
  const parts = wordId.split('_');
  if (parts.length >= 3) {
    const twoPartSuffix = parts.slice(-2).join('_');
    if (TYPE_TO_BANK[twoPartSuffix]) return TYPE_TO_BANK[twoPartSuffix];
  }
  if (parts.length >= 2) {
    const suffix = parts[parts.length - 1];
    if (TYPE_TO_BANK[suffix]) return TYPE_TO_BANK[suffix];
  }
  return null;
}

function findWordInAllBanks(langPath, wordId) {
  const files = fs.readdirSync(langPath).filter(f => f.endsWith('bank.json'));
  for (const file of files) {
    const data = JSON.parse(fs.readFileSync(path.join(langPath, file), 'utf8'));
    if (data[wordId]) return { entry: data[wordId], bank: file.replace('.json', '') };
  }
  return null;
}

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') { setCors(res); return res.status(200).end(); }
  if (req.method !== 'GET') { setCors(res); return res.status(405).json({ error: 'Method not allowed' }); }

  const { language, wordId } = req.query;

  if (!language || !wordId) {
    setCors(res);
    return res.status(400).json({ error: 'language and wordId parameters are required' });
  }

  try {
    const lexiconPath = path.join(process.cwd(), 'vocabulary', 'lexicon');
    const langPath = path.join(lexiconPath, language);

    if (!fs.existsSync(langPath)) {
      setCors(res);
      return res.status(404).json({ error: 'Language not found', available: fs.readdirSync(lexiconPath).filter(f => f !== 'links' && f !== 'grammar-features.json') });
    }

    // Try direct bank lookup first
    let entry = null;
    let bankName = null;
    const guessedBank = wordIdToBank(wordId);

    if (guessedBank) {
      const bankPath = path.join(langPath, `${guessedBank}.json`);
      if (fs.existsSync(bankPath)) {
        const data = JSON.parse(fs.readFileSync(bankPath, 'utf8'));
        if (data[wordId]) {
          entry = data[wordId];
          bankName = guessedBank;
        }
      }
    }

    // Fallback: search all banks
    if (!entry) {
      const result = findWordInAllBanks(langPath, wordId);
      if (result) {
        entry = result.entry;
        bankName = result.bank;
      }
    }

    if (!entry) {
      setCors(res);
      return res.status(404).json({ error: 'Word not found', wordId, language });
    }

    // Load links to other languages
    const linksPath = path.join(lexiconPath, 'links');
    const linkedTo = {};

    if (fs.existsSync(linksPath)) {
      const linkDirs = fs.readdirSync(linksPath)
        .filter(f => f.startsWith(`${language}-`) && fs.statSync(path.join(linksPath, f)).isDirectory());

      for (const dir of linkDirs) {
        const targetLang = dir.split('-')[1];
        const linkBankPath = path.join(linksPath, dir, `${bankName}.json`);
        if (fs.existsSync(linkBankPath)) {
          const linkData = JSON.parse(fs.readFileSync(linkBankPath, 'utf8'));
          if (linkData[wordId]) {
            linkedTo[targetLang] = linkData[wordId];
          }
        }
      }
    }

    // Build grammar features list
    const grammarFeatures = [];
    const gfPath = path.join(lexiconPath, 'grammar-features.json');
    if (fs.existsSync(gfPath)) {
      const gfData = JSON.parse(fs.readFileSync(gfPath, 'utf8'));
      const langFeatures = gfData[language]?.features || [];
      for (const feature of langFeatures) {
        if (feature.dataPath && resolveDataPath(entry, feature.dataPath) !== undefined) {
          grammarFeatures.push(feature.id);
        }
      }
    }

    const response = {
      _meta: {
        wordId,
        language,
        bank: bankName,
      },
      ...entry,
    };

    if (Object.keys(linkedTo).length > 0) response.linkedTo = linkedTo;
    if (grammarFeatures.length > 0) response.grammarFeatures = grammarFeatures;

    setCors(res);
    res.setHeader('Content-Type', 'application/json');
    return res.status(200).json(response);
  } catch (error) {
    console.error('v3 Lookup API error:', error);
    setCors(res);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

function resolveDataPath(obj, dataPath) {
  const parts = dataPath.split('.');
  let current = obj;
  for (const part of parts) {
    if (current === undefined || current === null) return undefined;
    current = current[part];
  }
  return current;
}
