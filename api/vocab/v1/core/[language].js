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
    const langPath = path.join(vocabBase, 'core', normalizedLang);

    // Debug mode - show paths being checked
    if (debug === 'true') {
      const corePath = path.join(vocabBase, 'core');
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
        coreContents: fs.existsSync(corePath) ? fs.readdirSync(corePath) : [],
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
          available: fs.readdirSync(langPath).filter(f => f.endsWith('.json') && f !== 'manifest.json')
        });
      }

      const data = JSON.parse(fs.readFileSync(bankPath, 'utf-8'));
      Object.entries(corsHeaders).forEach(([key, value]) => res.setHeader(key, value));
      res.setHeader('Content-Type', 'application/json');
      return res.status(200).json(data);
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

      const bankName = file.replace('.json', '');
      const data = JSON.parse(fs.readFileSync(path.join(langPath, file), 'utf-8'));

      // Remove internal metadata from each bank, add to combined
      const { _metadata, ...words } = data;
      combined[bankName] = words;
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
