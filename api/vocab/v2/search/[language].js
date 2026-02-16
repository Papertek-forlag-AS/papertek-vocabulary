import fs from 'fs';
import path from 'path';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, X-API-Key',
  'Cache-Control': 'public, max-age=3600, s-maxage=86400',
};

const LANGUAGE_MAP = {
  german: 'de', de: 'de', deutsch: 'de',
  spanish: 'es', es: 'es', espanol: 'es',
  french: 'fr', fr: 'fr', francais: 'fr',
};

function setCors(res) {
  Object.entries(corsHeaders).forEach(([key, value]) => res.setHeader(key, value));
}

function getVocabBasePath() {
  return path.join(process.cwd(), 'vocabulary');
}

// Module-level cache for search indices (survives across warm invocations)
const indexCache = {};

function loadSearchIndex(vocabBase, langCode) {
  const cacheKey = langCode;
  if (indexCache[cacheKey]) return indexCache[cacheKey];

  const indexPath = path.join(vocabBase, 'dictionary', langCode, 'search-index.json');
  if (!fs.existsSync(indexPath)) return null;

  const data = JSON.parse(fs.readFileSync(indexPath, 'utf-8'));
  indexCache[cacheKey] = data;
  return data;
}

/**
 * Search the index for matching entries.
 *
 * Priority:
 * 1. Prefix match on word (score 100)
 * 2. Prefix match on translation (score 200)
 * 3. Contains match on word (score 300)
 * 4. Contains match on translation (score 400)
 *
 * Within each priority band, sort by frequency (lower = more common).
 */
function searchIndex(index, query, options) {
  const q = query.toLowerCase();
  const { lang = 'nb', limit = 10, type, cefr, source } = options;

  const cefrSet = cefr ? new Set(cefr.split(',').map(s => s.trim().toUpperCase())) : null;
  const results = [];

  for (const entry of index.entries) {
    // Apply filters
    if (type && entry.t !== type) continue;
    if (cefrSet && entry.c && !cefrSet.has(entry.c)) continue;
    if (source === 'curriculum' && !entry.cur) continue;
    if (source === 'dictionary' && entry.cur) continue;

    const wordLower = entry.w.toLowerCase();
    const transLower = entry.tr?.[lang]?.toLowerCase() || '';

    // Frequency rank for sorting (null = high number = least common)
    const freq = entry.f || 999999;

    if (wordLower.startsWith(q)) {
      results.push({ entry, matchType: 'prefix', matchField: 'word', score: 100 + freq / 1000000 });
    } else if (transLower.startsWith(q)) {
      results.push({ entry, matchType: 'prefix', matchField: 'translation', score: 200 + freq / 1000000 });
    } else if (wordLower.includes(q)) {
      results.push({ entry, matchType: 'contains', matchField: 'word', score: 300 + freq / 1000000 });
    } else if (transLower.includes(q)) {
      results.push({ entry, matchType: 'contains', matchField: 'translation', score: 400 + freq / 1000000 });
    }
  }

  results.sort((a, b) => a.score - b.score);

  const totalMatches = results.length;
  const limited = results.slice(0, limit);

  return {
    totalMatches,
    results: limited.map(r => ({
      wordId: r.entry.id,
      word: r.entry.w,
      type: r.entry.t,
      genus: r.entry.g || undefined,
      translation: r.entry.tr?.[lang] || null,
      cefr: r.entry.c || null,
      frequency: r.entry.f || null,
      curriculum: r.entry.cur || false,
      matchType: r.matchType,
      matchField: r.matchField,
    })),
  };
}

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    setCors(res);
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    setCors(res);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { language, q, lang = 'nb', limit: limitStr = '10', type, cefr, source = 'all' } = req.query;

  // Validate language
  const langCode = language ? LANGUAGE_MAP[language.toLowerCase()] : null;
  if (!langCode) {
    setCors(res);
    return res.status(400).json({
      error: 'Invalid language',
      available: [...new Set(Object.values(LANGUAGE_MAP))],
    });
  }

  // Validate query
  if (!q || q.length < 2) {
    setCors(res);
    return res.status(400).json({
      error: 'Query parameter "q" is required and must be at least 2 characters',
    });
  }

  // Validate limit
  const limit = Math.min(Math.max(parseInt(limitStr, 10) || 10, 1), 50);

  // Validate source
  if (!['all', 'curriculum', 'dictionary'].includes(source)) {
    setCors(res);
    return res.status(400).json({
      error: 'Invalid source parameter',
      available: ['all', 'curriculum', 'dictionary'],
    });
  }

  try {
    const vocabBase = getVocabBasePath();
    const index = loadSearchIndex(vocabBase, langCode);

    if (!index) {
      setCors(res);
      return res.status(404).json({
        error: 'Search index not found for this language',
        language: langCode,
      });
    }

    const { totalMatches, results } = searchIndex(index, q, { lang, limit, type, cefr, source });

    const response = {
      _meta: {
        query: q,
        language: langCode,
        translationLang: lang,
        totalMatches,
        returned: results.length,
        limit,
      },
      results,
    };

    setCors(res);
    res.setHeader('Content-Type', 'application/json');
    return res.status(200).json(response);
  } catch (error) {
    console.error('Search API error:', error);
    setCors(res);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
