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

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') { setCors(res); return res.status(200).end(); }
  if (req.method !== 'GET') { setCors(res); return res.status(405).json({ error: 'Method not allowed' }); }

  const { language } = req.query;

  if (!language) {
    setCors(res);
    return res.status(400).json({ error: 'language parameter is required' });
  }

  try {
    const lexiconPath = path.join(process.cwd(), 'vocabulary', 'lexicon');
    const indexPath = path.join(lexiconPath, language, 'search-index.json');

    if (!fs.existsSync(indexPath)) {
      setCors(res);
      return res.status(404).json({
        error: 'Language not found',
        language,
        available: fs.readdirSync(lexiconPath)
          .filter(f => f !== 'links' && f !== 'grammar-features.json' &&
            fs.statSync(path.join(lexiconPath, f)).isDirectory()),
      });
    }

    const index = JSON.parse(fs.readFileSync(indexPath, 'utf8'));
    const entries = index.entries || [];
    const ids = entries.map(e => e.id);

    setCors(res);
    res.setHeader('Content-Type', 'application/json');
    return res.status(200).json({
      language,
      total: ids.length,
      ids,
    });
  } catch (error) {
    console.error('v3 List API error:', error);
    setCors(res);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
