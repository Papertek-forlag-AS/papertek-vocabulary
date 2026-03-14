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

  try {
    const lexiconPath = path.join(process.cwd(), 'vocabulary', 'lexicon');

    // Discover lexicon languages
    const languages = {};
    const langDirs = fs.readdirSync(lexiconPath)
      .filter(f => f !== 'links' && f !== 'grammar-features.json' &&
        fs.statSync(path.join(lexiconPath, f)).isDirectory());

    for (const lang of langDirs) {
      const manifestPath = path.join(lexiconPath, lang, 'manifest.json');
      if (fs.existsSync(manifestPath)) {
        const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
        languages[lang] = {
          totalWords: manifest.summary?.totalWords || 0,
          enrichedWords: manifest.summary?.enrichedWords || manifest.summary?.totalWords || 0,
          banks: manifest.banks || {},
          lookupEndpoint: `/api/vocab/v3/lookup/${lang}/{wordId}`,
          searchEndpoint: `/api/vocab/v3/search/${lang}`,
          listEndpoint: `/api/vocab/v3/list/${lang}`,
        };
      }
    }

    // Discover link pairs
    const linksPath = path.join(lexiconPath, 'links');
    const linkPairs = [];
    if (fs.existsSync(linksPath)) {
      const pairs = fs.readdirSync(linksPath)
        .filter(f => fs.statSync(path.join(linksPath, f)).isDirectory());
      for (const pair of pairs) {
        const [from, to] = pair.split('-');
        linkPairs.push({
          pair,
          from,
          to,
          endpoint: `/api/vocab/v3/links/${pair}/{wordId}`,
        });
      }
    }

    // Load grammar features
    const grammarFeaturesPath = path.join(lexiconPath, 'grammar-features.json');
    let grammarFeatures = null;
    if (fs.existsSync(grammarFeaturesPath)) {
      const gf = JSON.parse(fs.readFileSync(grammarFeaturesPath, 'utf8'));
      const { _metadata, ...features } = gf;
      grammarFeatures = features;
    }

    const manifest = {
      api: {
        name: 'Papertek Vocabulary API — Lexicon (Two-Way Dictionary)',
        version: '3.0.0',
        description: 'Bidirectional dictionary with full grammar data for all languages',
      },
      languages,
      links: linkPairs,
      grammarFeatures,
      _generated: new Date().toISOString(),
    };

    setCors(res);
    res.setHeader('Content-Type', 'application/json');
    return res.status(200).json(manifest);
  } catch (error) {
    console.error('v3 Manifest API error:', error);
    setCors(res);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
