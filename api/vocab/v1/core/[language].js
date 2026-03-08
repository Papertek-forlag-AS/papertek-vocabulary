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

// Get the vocabulary base path
function getVocabBasePath() {
  return path.join(process.cwd(), 'vocabulary');
}

// Resolve the language data directory — checks banks/ first, then core/
function resolveLangPath(vocabBase, langCode) {
  const banksPath = path.join(vocabBase, 'banks', langCode);
  if (fs.existsSync(banksPath)) return banksPath;

  const corePath = path.join(vocabBase, 'core', langCode);
  if (fs.existsSync(corePath)) return corePath;

  return null;
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

  const { language } = req.query;

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
    const langPath = resolveLangPath(vocabBase, normalizedLang);

    // Check if language folder exists
    if (!langPath) {
      Object.entries(corsHeaders).forEach(([key, value]) => res.setHeader(key, value));
      return res.status(404).json({
        error: 'Language not found'
      });
    }

    // Optional: get specific bank via query param ?bank=verbbank
    const { bank } = req.query;

    if (bank) {
      // Return single bank file (sanitize to prevent path traversal)
      const safeBankName = path.basename(bank.replace('.json', ''));
      const bankFile = `${safeBankName}.json`;
      const bankPath = path.join(langPath, bankFile);

      if (!fs.existsSync(bankPath)) {
        Object.entries(corsHeaders).forEach(([key, value]) => res.setHeader(key, value));
        return res.status(404).json({
          error: 'Bank not found',
          available: fs.readdirSync(langPath).filter(f => f.endsWith('.json') && f !== 'manifest.json' && !f.endsWith('search-index.json'))
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
      if (file === 'search-index.json') continue;

      const bankName = file.replace('.json', '');
      const data = JSON.parse(fs.readFileSync(path.join(langPath, file), 'utf-8'));
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
