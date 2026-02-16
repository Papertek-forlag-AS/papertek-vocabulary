import fs from 'fs';
import path from 'path';

// CORS headers for external API access
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, X-API-Key',
  'Cache-Control': 'public, max-age=3600, s-maxage=86400',
};

// Map user-friendly language names to codes
const LANGUAGE_MAP = {
  'german': 'de', 'de': 'de', 'deutsch': 'de',
  'spanish': 'es', 'es': 'es', 'espanol': 'es',
  'french': 'fr', 'fr': 'fr', 'francais': 'fr'
};

// Load grammar features from shared JSON file (single source of truth)
function loadGrammarFeatures() {
  const p = path.join(process.cwd(), 'vocabulary', 'grammar-features.json');
  if (fs.existsSync(p)) {
    const data = JSON.parse(fs.readFileSync(p, 'utf-8'));
    const { _metadata, ...languages } = data;
    return { metadata: _metadata, languages };
  }
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

  try {
    const grammarData = loadGrammarFeatures();

    if (!grammarData) {
      Object.entries(corsHeaders).forEach(([key, value]) => res.setHeader(key, value));
      return res.status(500).json({ error: 'Grammar features data not found' });
    }

    const { language } = req.query;

    // If no language specified, return all languages' features
    if (!language) {
      Object.entries(corsHeaders).forEach(([key, value]) => res.setHeader(key, value));
      res.setHeader('Content-Type', 'application/json');
      return res.status(200).json({
        _metadata: {
          description: 'Grammar features available for filtering vocabulary display',
          usage: 'Use ?language=de to get features for a specific language',
          availableLanguages: Object.keys(grammarData.languages),
          updatedAt: grammarData.metadata?.updatedAt
        },
        languages: grammarData.languages
      });
    }

    // Normalize and validate language
    const normalizedLang = LANGUAGE_MAP[language.toLowerCase()];
    if (!normalizedLang || !grammarData.languages[normalizedLang]) {
      Object.entries(corsHeaders).forEach(([key, value]) => res.setHeader(key, value));
      return res.status(400).json({
        error: 'Invalid or unsupported language',
        available: Object.keys(LANGUAGE_MAP)
      });
    }

    Object.entries(corsHeaders).forEach(([key, value]) => res.setHeader(key, value));
    res.setHeader('Content-Type', 'application/json');
    return res.status(200).json(grammarData.languages[normalizedLang]);

  } catch (error) {
    console.error('Grammar features API error:', error);
    Object.entries(corsHeaders).forEach(([key, value]) => res.setHeader(key, value));
    return res.status(500).json({ error: 'Internal server error' });
  }
}
