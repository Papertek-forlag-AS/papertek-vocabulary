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

const indexCache = {};

function loadSearchIndex(lexiconPath, language) {
  if (indexCache[language]) return indexCache[language];
  const indexPath = path.join(lexiconPath, language, 'search-index.json');
  if (!fs.existsSync(indexPath)) return null;
  const data = JSON.parse(fs.readFileSync(indexPath, 'utf8'));
  indexCache[language] = data;
  return data;
}

function searchWord(index, query) {
  const entries = index.entries || [];
  const results = [];

  for (const entry of entries) {
    const word = (entry.w || '').toLowerCase();
    let score = 0;

    if (word === query) score = 100;
    else if (word.startsWith(query)) score = 200;
    else if (entry.typos && entry.typos.some(t => t.toLowerCase() === query)) score = 150;
    else if (entry.af && entry.af.some(f => f.toLowerCase() === query)) score = 160;

    if (score > 0) results.push({ ...entry, _score: score });
  }

  results.sort((a, b) => a._score - b._score || (a.w || '').localeCompare(b.w || ''));
  return results;
}

function findLink(linksPath, pair, wordId) {
  const pairDir = path.join(linksPath, pair);
  if (!fs.existsSync(pairDir)) return null;

  const bankFiles = fs.readdirSync(pairDir).filter(f => f.endsWith('.json'));
  for (const bankFile of bankFiles) {
    const data = JSON.parse(fs.readFileSync(path.join(pairDir, bankFile), 'utf8'));
    if (data[wordId]) return { link: data[wordId], bank: bankFile.replace('.json', '') };
  }
  return null;
}

function resolveWordEntry(lexiconPath, language, wordId) {
  const langPath = path.join(lexiconPath, language);
  if (!fs.existsSync(langPath)) return null;

  const bankFiles = fs.readdirSync(langPath).filter(f => f.endsWith('bank.json'));
  for (const bf of bankFiles) {
    const data = JSON.parse(fs.readFileSync(path.join(langPath, bf), 'utf8'));
    if (data[wordId]) return data[wordId];
  }
  return null;
}

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') { setCors(res); return res.status(200).end(); }
  if (req.method !== 'GET') { setCors(res); return res.status(405).json({ error: 'Method not allowed' }); }

  const { from, to, q, limit: limitStr = '5' } = req.query;
  const limit = Math.min(parseInt(limitStr, 10) || 5, 20);

  if (!from || !to) {
    setCors(res);
    return res.status(400).json({ error: 'from and to language parameters are required' });
  }

  if (!q || q.trim().length === 0) {
    setCors(res);
    return res.status(400).json({ error: 'q (query) parameter is required' });
  }

  try {
    const lexiconPath = path.join(process.cwd(), 'vocabulary', 'lexicon');
    const linksPath = path.join(lexiconPath, 'links');
    const pair = `${from}-${to}`;

    // Step 1: Search the source language
    const index = loadSearchIndex(lexiconPath, from);
    if (!index) {
      setCors(res);
      return res.status(404).json({
        error: 'Search index not found for source language',
        language: from,
      });
    }

    const query = q.trim().toLowerCase();
    const searchResults = searchWord(index, query).slice(0, limit);

    if (searchResults.length === 0) {
      setCors(res);
      return res.status(200).json({
        query: q.trim(),
        from,
        to,
        total: 0,
        translations: [],
      });
    }

    // Step 2: Follow links for each search result
    const translations = [];

    for (const result of searchResults) {
      const { _score, ...entry } = result;
      const linkResult = findLink(linksPath, pair, entry.id);

      if (!linkResult) continue;

      const translation = {
        source: {
          id: entry.id,
          word: entry.w,
          type: entry.t,
        },
        link: linkResult.link,
        target: null,
      };

      // Resolve the primary target word
      if (linkResult.link.primary) {
        const targetEntry = resolveWordEntry(lexiconPath, to, linkResult.link.primary);
        if (targetEntry) {
          translation.target = {
            id: linkResult.link.primary,
            ...targetEntry,
          };
        }
      }

      translations.push(translation);
    }

    setCors(res);
    res.setHeader('Content-Type', 'application/json');
    return res.status(200).json({
      query: q.trim(),
      from,
      to,
      total: translations.length,
      translations,
    });
  } catch (error) {
    console.error('v3 Translate API error:', error);
    setCors(res);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
