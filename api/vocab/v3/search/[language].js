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

// Module-level cache for search indices
const indexCache = {};

function loadSearchIndex(lexiconPath, language) {
  const cacheKey = language;
  if (indexCache[cacheKey]) return indexCache[cacheKey];

  const indexPath = path.join(lexiconPath, language, 'search-index.json');
  if (!fs.existsSync(indexPath)) return null;

  const data = JSON.parse(fs.readFileSync(indexPath, 'utf8'));
  indexCache[cacheKey] = data;
  return data;
}

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') { setCors(res); return res.status(200).end(); }
  if (req.method !== 'GET') { setCors(res); return res.status(405).json({ error: 'Method not allowed' }); }

  const { language, q, type, cefr, limit: limitStr = '20' } = req.query;
  const limit = Math.min(parseInt(limitStr, 10) || 20, 100);

  if (!language) {
    setCors(res);
    return res.status(400).json({ error: 'language parameter is required' });
  }

  if (!q || q.trim().length === 0) {
    setCors(res);
    return res.status(400).json({ error: 'q (query) parameter is required' });
  }

  try {
    const lexiconPath = path.join(process.cwd(), 'vocabulary', 'lexicon');
    const index = loadSearchIndex(lexiconPath, language);

    if (!index) {
      setCors(res);
      return res.status(404).json({
        error: 'Search index not found for language',
        language,
        hint: 'Run npm run build:lexicon-search-index to generate',
      });
    }

    const query = q.trim().toLowerCase();
    const entries = index.entries || [];

    // Score and filter
    const results = [];
    for (const entry of entries) {
      // Type filter
      if (type && entry.t !== type) continue;
      // CEFR filter
      if (cefr && entry.c !== cefr) continue;

      const word = (entry.w || '').toLowerCase();
      let score = 0;

      // Exact match
      if (word === query) {
        score = 100;
      }
      // Prefix match
      else if (word.startsWith(query)) {
        score = 200;
      }
      // Contains match
      else if (word.includes(query)) {
        score = 300;
      }
      // Check typos field for fuzzy matching
      else if (entry.typos && entry.typos.some(t => t.toLowerCase() === query)) {
        score = 150; // Typo match ranks between exact and prefix
      }
      // Check accepted forms
      else if (entry.af && entry.af.some(f => f.toLowerCase() === query)) {
        score = 160;
      }

      if (score > 0) {
        results.push({ ...entry, _score: score });
      }
    }

    // Sort by score (lower = better), then alphabetically
    results.sort((a, b) => a._score - b._score || (a.w || '').localeCompare(b.w || ''));

    // Limit
    const limited = results.slice(0, limit);

    // Clean up score from response
    const clean = limited.map(({ _score, ...rest }) => rest);

    setCors(res);
    res.setHeader('Content-Type', 'application/json');
    return res.status(200).json({
      query: q.trim(),
      language,
      total: results.length,
      results: clean,
    });
  } catch (error) {
    console.error('v3 Search API error:', error);
    setCors(res);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
