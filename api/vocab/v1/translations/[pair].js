import fs from 'fs';
import path from 'path';

// CORS headers for external API access
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, X-API-Key',
  'Cache-Control': 'public, max-age=3600, s-maxage=86400', // 1hr browser, 24hr CDN
};

// Map user-friendly pairs to folder names on disk
// Vercel deployment uses ISO codes (de-en, de-nb, es-en, etc.)
const PAIR_MAP = {
  // German translations
  'german-to-english': 'de-en',
  'german-to-norwegian': 'de-nb',
  'de-en': 'de-en',
  'de-nb': 'de-nb',
  // Spanish translations
  'spanish-to-english': 'es-en',
  'spanish-to-norwegian': 'es-nb',
  'es-en': 'es-en',
  'es-nb': 'es-nb',
  // French translations
  'french-to-norwegian': 'fr-nb',
  'fr-nb': 'fr-nb'
};

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

  const { pair } = req.query;

  // Normalize pair parameter
  const normalizedPair = pair ? PAIR_MAP[pair.toLowerCase()] : null;

  if (!normalizedPair) {
    Object.entries(corsHeaders).forEach(([key, value]) => res.setHeader(key, value));
    return res.status(400).json({
      error: 'Invalid translation pair',
      available: Object.keys(PAIR_MAP)
    });
  }

  try {
    const pairPath = path.join(process.cwd(), 'vocabulary', 'translations', normalizedPair);

    // Check if translation folder exists
    if (!fs.existsSync(pairPath)) {
      Object.entries(corsHeaders).forEach(([key, value]) => res.setHeader(key, value));
      return res.status(404).json({ error: 'Translation pack not found' });
    }

    // Optional: get specific bank via query param ?bank=verbbank
    const { bank } = req.query;

    if (bank) {
      // Return single bank file (sanitize to prevent path traversal)
      const safeBankName = path.basename(bank.replace('.json', ''));
      const bankFile = `${safeBankName}.json`;
      const bankPath = path.join(pairPath, bankFile);

      if (!fs.existsSync(bankPath)) {
        Object.entries(corsHeaders).forEach(([key, value]) => res.setHeader(key, value));
        return res.status(404).json({
          error: 'Bank not found',
          available: fs.readdirSync(pairPath).filter(f => f.endsWith('.json') && f !== 'manifest.json')
        });
      }

      const data = JSON.parse(fs.readFileSync(bankPath, 'utf-8'));
      Object.entries(corsHeaders).forEach(([key, value]) => res.setHeader(key, value));
      res.setHeader('Content-Type', 'application/json');
      return res.status(200).json(data);
    }

    // Return all translation banks combined
    const files = fs.readdirSync(pairPath).filter(f => f.endsWith('.json'));
    const [fromLang, , toLang] = pair.split('-');

    const combined = {
      _metadata: {
        pair: pair.toLowerCase(),
        from: fromLang,
        to: toLang,
        requestedAt: new Date().toISOString(),
        banks: []
      }
    };

    for (const file of files) {
      if (file === 'manifest.json') continue;

      const bankName = file.replace('.json', '');
      const data = JSON.parse(fs.readFileSync(path.join(pairPath, file), 'utf-8'));

      // Remove internal metadata from each bank, add to combined
      const { _metadata, ...translations } = data;
      combined[bankName] = translations;
      combined._metadata.banks.push(bankName);
    }

    Object.entries(corsHeaders).forEach(([key, value]) => res.setHeader(key, value));
    res.setHeader('Content-Type', 'application/json');
    return res.status(200).json(combined);

  } catch (error) {
    console.error('Translations API error:', error);
    Object.entries(corsHeaders).forEach(([key, value]) => res.setHeader(key, value));
    return res.status(500).json({ error: 'Internal server error' });
  }
}
