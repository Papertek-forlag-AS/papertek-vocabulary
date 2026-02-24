import fs from 'fs';
import path from 'path';

// CORS headers for external API access
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, X-API-Key',
  'Cache-Control': 'public, max-age=3600, s-maxage=86400', // 1hr browser, 24hr CDN
};

// Valid languages - map user-friendly names to folder names on disk
// Note: Vercel deployment uses ISO codes (de, es, fr) as folder names
const LANGUAGE_MAP = {
  'german': 'de',
  'de': 'de',
  'deutsch': 'de',
  'spanish': 'es',
  'es': 'es',
  'espanol': 'es',
  'french': 'fr',
  'fr': 'fr',
  'francais': 'fr'
};

// Get the vocabulary base path - try multiple locations
function getVocabBasePath() {
  return path.join(process.cwd(), 'vocabulary');
}

export default async function handler(req, res) {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    Object.entries(corsHeaders).forEach(([key, value]) => res.setHeader(key, value));
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    Object.entries(corsHeaders).forEach(([key, value]) => res.setHeader(key, value));
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { language, debug } = req.query;

  // Normalize language input
  const normalizedLang = language ? LANGUAGE_MAP[language.toLowerCase()] : null;

  if (!normalizedLang) {
    Object.entries(corsHeaders).forEach(([key, value]) => res.setHeader(key, value));
    return res.status(400).json({
      error: 'Invalid language',
      available: Object.keys(LANGUAGE_MAP)
    });
  }

  try {
    const vocabBase = getVocabBasePath();
    const langPath = path.join(vocabBase, 'banks', normalizedLang);

    // Debug mode - show paths being checked
    if (debug === 'true') {
      const banksPath = path.join(vocabBase, 'banks');
      Object.entries(corsHeaders).forEach(([key, value]) => res.setHeader(key, value));
      return res.status(200).json({
        debug: true,
        cwd: process.cwd(),
        vocabBase,
        langPath,
        vocabBaseExists: fs.existsSync(vocabBase),
        langPathExists: fs.existsSync(langPath),
        cwdContents: fs.existsSync(process.cwd()) ? fs.readdirSync(process.cwd()) : [],
        vocabBaseContents: fs.existsSync(vocabBase) ? fs.readdirSync(vocabBase) : [],
        banksContents: fs.existsSync(banksPath) ? fs.readdirSync(banksPath) : [],
      });
    }

    // Check if language folder exists
    if (!fs.existsSync(langPath)) {
      Object.entries(corsHeaders).forEach(([key, value]) => res.setHeader(key, value));
      return res.status(404).json({
        error: 'Language not found',
        path: langPath,
        vocabBaseExists: fs.existsSync(vocabBase)
      });
    }

    // Load manifest to get curriculum IDs for filtering
    const manifestPath = path.join(langPath, 'manifest.json');
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));

    // Build a Set of curriculum IDs per bank from manifest.banks[bankName].ids
    const curriculumIdsByBank = {};
    for (const [bankName, bankInfo] of Object.entries(manifest.banks)) {
      curriculumIdsByBank[bankName] = new Set(bankInfo.ids);
    }

    // Optional: get specific bank via query param ?bank=verbbank
    const { bank } = req.query;

    if (bank) {
      // Return single bank file
      const bankFile = bank.endsWith('.json') ? bank : `${bank}.json`;
      const bankPath = path.join(langPath, bankFile);

      if (!fs.existsSync(bankPath)) {
        Object.entries(corsHeaders).forEach(([key, value]) => res.setHeader(key, value));
        return res.status(404).json({
          error: 'Bank not found',
          available: fs.readdirSync(langPath).filter(f => f.endsWith('.json') && f !== 'manifest.json' && !f.endsWith('search-index.json'))
        });
      }

      const data = JSON.parse(fs.readFileSync(bankPath, 'utf-8'));
      const bankName = bank.replace('.json', '');
      const curriculumIds = curriculumIdsByBank[bankName];

      // Filter to only curriculum entries (plus _metadata if present)
      let filtered;
      if (curriculumIds) {
        const { _metadata, ...words } = data;
        const curriculumWords = {};
        for (const [wordId, wordData] of Object.entries(words)) {
          if (curriculumIds.has(wordId)) {
            curriculumWords[wordId] = wordData;
          }
        }
        filtered = _metadata ? { _metadata, ...curriculumWords } : curriculumWords;
      } else {
        filtered = data;
      }

      Object.entries(corsHeaders).forEach(([key, value]) => res.setHeader(key, value));
      res.setHeader('Content-Type', 'application/json');
      return res.status(200).json(filtered);
    }

    // Return all banks combined
    const files = fs.readdirSync(langPath).filter(f => f.endsWith('.json'));
    const combined = {
      _metadata: {
        language: language.toLowerCase(),
        requestedAt: new Date().toISOString(),
        banks: []
      }
    };

    for (const file of files) {
      if (file === 'manifest.json') continue;
      if (file === 'search-index.json') continue;

      const bankName = file.replace('.json', '');
      const data = JSON.parse(fs.readFileSync(path.join(langPath, file), 'utf-8'));

      // Remove internal metadata from each bank, filter to curriculum entries only
      const { _metadata, ...words } = data;
      const curriculumIds = curriculumIdsByBank[bankName];
      if (curriculumIds) {
        const curriculumWords = {};
        for (const [wordId, wordData] of Object.entries(words)) {
          if (curriculumIds.has(wordId)) {
            curriculumWords[wordId] = wordData;
          }
        }
        combined[bankName] = curriculumWords;
      } else {
        combined[bankName] = words;
      }
      combined._metadata.banks.push(bankName);
    }

    Object.entries(corsHeaders).forEach(([key, value]) => res.setHeader(key, value));
    res.setHeader('Content-Type', 'application/json');
    return res.status(200).json(combined);

  } catch (error) {
    console.error('Core API error:', error);
    Object.entries(corsHeaders).forEach(([key, value]) => res.setHeader(key, value));
    return res.status(500).json({ error: 'Internal server error' });
  }
}
