import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, X-API-Key',
};

function setCors(res) {
  Object.entries(corsHeaders).forEach(([key, value]) => res.setHeader(key, value));
}

const LANGUAGE_NAMES = {
  de: 'Tysk',
  en: 'Engelsk',
  es: 'Spansk',
  fr: 'Fransk',
  nb: 'Norsk bokmål',
  nn: 'Nynorsk',
};

const INTERNAL_FIELDS = ['_generatedFrom', '_enriched'];

function resolveDataPath(obj, dataPath) {
  const parts = dataPath.split('.');
  let current = obj;
  for (const part of parts) {
    if (current === undefined || current === null) return undefined;
    current = current[part];
  }
  return current;
}

function computeContentHash(langPath) {
  const bankFiles = fs.readdirSync(langPath)
    .filter(f => f.endsWith('bank.json'))
    .sort();

  const hash = crypto.createHash('sha256');
  for (const file of bankFiles) {
    hash.update(fs.readFileSync(path.join(langPath, file)));
  }
  return hash.digest('hex').substring(0, 8);
}

function loadOutgoingLinks(linksPath, language) {
  const links = {}; // { targetLang: { wordId: linkData } }

  if (!fs.existsSync(linksPath)) return links;

  const linkDirs = fs.readdirSync(linksPath)
    .filter(f => f.startsWith(`${language}-`) && fs.statSync(path.join(linksPath, f)).isDirectory());

  for (const dir of linkDirs) {
    const targetLang = dir.split('-')[1];
    links[targetLang] = {};

    const linkFiles = fs.readdirSync(path.join(linksPath, dir))
      .filter(f => f.endsWith('.json'));

    for (const file of linkFiles) {
      const data = JSON.parse(fs.readFileSync(path.join(linksPath, dir, file), 'utf8'));
      for (const [wordId, entry] of Object.entries(data)) {
        if (wordId === '_metadata') continue;
        links[targetLang][wordId] = entry;
      }
    }
  }

  return links;
}

function loadTargetWordIndex(lexiconPath, targetLanguages) {
  const index = {}; // { lang: { wordId: word } }

  for (const lang of targetLanguages) {
    const langPath = path.join(lexiconPath, lang);
    if (!fs.existsSync(langPath)) continue;

    index[lang] = {};
    const bankFiles = fs.readdirSync(langPath)
      .filter(f => f.endsWith('bank.json'));

    for (const file of bankFiles) {
      const data = JSON.parse(fs.readFileSync(path.join(langPath, file), 'utf8'));
      for (const [wordId, entry] of Object.entries(data)) {
        if (wordId === '_metadata') continue;
        index[lang][wordId] = entry.word;
      }
    }
  }

  return index;
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
    const langPath = path.join(lexiconPath, language);

    if (!fs.existsSync(langPath)) {
      setCors(res);
      return res.status(404).json({
        error: 'Language not found',
        available: fs.readdirSync(lexiconPath)
          .filter(f => f !== 'links' && f !== 'grammar-features.json' &&
            fs.statSync(path.join(lexiconPath, f)).isDirectory()),
      });
    }

    // Compute content hash for version + ETag
    const version = computeContentHash(langPath);

    // Conditional request — return 304 if data hasn't changed
    const ifNoneMatch = req.headers['if-none-match'];
    if (ifNoneMatch && (ifNoneMatch === `"${version}"` || ifNoneMatch === version)) {
      setCors(res);
      res.setHeader('ETag', `"${version}"`);
      res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=86400');
      return res.status(304).end();
    }

    // Load all bank files for this language
    const bankFileNames = fs.readdirSync(langPath)
      .filter(f => f.endsWith('bank.json'))
      .sort();

    const banks = {};
    let totalWords = 0;
    for (const file of bankFileNames) {
      const bankName = file.replace('.json', '');
      const data = JSON.parse(fs.readFileSync(path.join(langPath, file), 'utf8'));
      const { _metadata, ...entries } = data;
      banks[bankName] = entries;
      totalWords += Object.keys(entries).length;
    }

    // Load outgoing links (all target languages, all link bank files, indexed by wordId)
    const linksPath = path.join(lexiconPath, 'links');
    const outgoingLinks = loadOutgoingLinks(linksPath, language);

    // Pre-load target language word index for translation resolution
    const targetWordIndex = loadTargetWordIndex(lexiconPath, Object.keys(outgoingLinks));

    // Load grammar feature definitions + categories for this language
    const gfPath = path.join(lexiconPath, 'grammar-features.json');
    let grammarFeaturesDefs = [];
    let grammarCategories = [];
    if (fs.existsSync(gfPath)) {
      const gfData = JSON.parse(fs.readFileSync(gfPath, 'utf8'));
      grammarFeaturesDefs = gfData[language]?.features || [];
      grammarCategories = gfData[language]?.categories || [];
    }

    // Set response headers
    setCors(res);
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=86400');
    res.setHeader('ETag', `"${version}"`);

    // Stream response to bypass Vercel 4.5 MB body limit
    const metadata = {
      language,
      languageName: LANGUAGE_NAMES[language] || language,
      version,
      totalWords,
      generatedAt: new Date().toISOString(),
    };

    res.write(`{"_metadata":${JSON.stringify(metadata)}`);
    res.write(`,"_grammarFeatures":${JSON.stringify({ features: grammarFeaturesDefs, categories: grammarCategories })}`);

    const bankNames = Object.keys(banks);
    for (let bi = 0; bi < bankNames.length; bi++) {
      const bankName = bankNames[bi];
      const entries = banks[bankName];
      const wordIds = Object.keys(entries);

      res.write(`,"${bankName}":{`);

      for (let ei = 0; ei < wordIds.length; ei++) {
        const wordId = wordIds[ei];
        const entry = { ...entries[wordId] };

        // Strip internal fields
        for (const field of INTERNAL_FIELDS) {
          delete entry[field];
        }

        // Resolve links for this entry
        const linkedTo = {};
        for (const [targetLang, targetLinks] of Object.entries(outgoingLinks)) {
          const linkData = targetLinks[wordId];
          if (linkData) {
            const resolved = { ...linkData };
            // Resolve translation: follow primary to target language, read word
            if (resolved.primary && targetWordIndex[targetLang]) {
              const translatedWord = targetWordIndex[targetLang][resolved.primary];
              if (translatedWord) {
                resolved.translation = translatedWord;
              }
            }
            linkedTo[targetLang] = resolved;
          }
        }
        if (Object.keys(linkedTo).length > 0) {
          entry.linkedTo = linkedTo;
        }

        // Compute applicable grammar features
        if (grammarFeaturesDefs.length > 0) {
          const matched = [];
          for (const feature of grammarFeaturesDefs) {
            if (feature.dataPath && resolveDataPath(entry, feature.dataPath) !== undefined) {
              matched.push(feature.id);
            }
          }
          if (matched.length > 0) {
            entry.grammarFeatures = matched;
          }
        }

        if (ei > 0) res.write(',');
        res.write(`${JSON.stringify(wordId)}:${JSON.stringify(entry)}`);
      }

      res.write('}');
    }

    res.write('}');
    res.end();
  } catch (error) {
    console.error('v3 Export API error:', error);
    setCors(res);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
