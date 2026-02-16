import fs from 'fs';
import path from 'path';

// CORS headers for external API access
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, X-API-Key',
  'Cache-Control': 'public, max-age=3600, s-maxage=86400', // 1hr browser, 24hr CDN
};

export default async function handler(req, res) {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).set(corsHeaders).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).set(corsHeaders).json({ error: 'Method not allowed' });
  }

  try {
    const vocabPath = path.join(process.cwd(), 'vocabulary');

    // Read core languages
    const corePath = path.join(vocabPath, 'core');
    const coreLanguages = fs.readdirSync(corePath)
      .filter(f => fs.statSync(path.join(corePath, f)).isDirectory());

    // Read translation packs
    const translationsPath = path.join(vocabPath, 'translations');
    const translationPacks = fs.readdirSync(translationsPath)
      .filter(f => fs.statSync(path.join(translationsPath, f)).isDirectory());

    // Build core manifests
    const core = {};
    for (const lang of coreLanguages) {
      const manifestPath = path.join(corePath, lang, 'manifest.json');
      if (fs.existsSync(manifestPath)) {
        const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));

        // Check for audio folder
        const audioPath = path.join(corePath, lang, 'audio');
        const hasAudio = fs.existsSync(audioPath);
        const audioCount = hasAudio
          ? fs.readdirSync(audioPath).filter(f => f.endsWith('.mp3')).length
          : 0;

        core[lang] = {
          language: manifest._metadata.targetLanguageName,
          version: manifest._metadata.version,
          totalWords: manifest._metadata.totalWords,
          files: Object.keys(manifest._metadata.files),
          updatedAt: manifest._metadata.generatedAt,
          endpoint: `/api/vocab/v1/core/${lang}`,
          audio: hasAudio ? {
            baseUrl: `/shared/vocabulary/core/${lang}/audio`,
            fileCount: audioCount,
            format: 'mp3'
          } : null
        };
      }
    }

    // Build translation packs info
    const translations = {};
    for (const pack of translationPacks) {
      const [from, , to] = pack.split('-'); // "german-to-norwegian" -> ["german", "to", "norwegian"]
      translations[pack] = {
        from: from,
        to: to,
        endpoint: `/api/vocab/v1/translations/${pack}`
      };
    }

    // Check for bulk downloads
    const downloadsPath = path.join(vocabPath, 'downloads');
    let downloads = null;
    if (fs.existsSync(downloadsPath)) {
      const downloadManifestPath = path.join(downloadsPath, 'manifest.json');
      if (fs.existsSync(downloadManifestPath)) {
        downloads = JSON.parse(fs.readFileSync(downloadManifestPath, 'utf-8'));
      }
    }

    // Build dictionary info (v2 endpoints)
    const dictionary = {};
    const dictPath = path.join(vocabPath, 'dictionary');
    if (fs.existsSync(dictPath)) {
      const dictLanguages = fs.readdirSync(dictPath)
        .filter(f => fs.statSync(path.join(dictPath, f)).isDirectory());

      for (const lang of dictLanguages) {
        const dictManifestPath = path.join(dictPath, lang, 'manifest.json');
        if (fs.existsSync(dictManifestPath)) {
          const dictManifest = JSON.parse(fs.readFileSync(dictManifestPath, 'utf-8'));
          dictionary[lang] = {
            version: dictManifest._metadata.version,
            totalWords: dictManifest.totalWords || dictManifest._metadata.totalWords,
            curriculumWords: dictManifest.curriculumWords || dictManifest._metadata.curriculumWords,
            dictionaryOnlyWords: dictManifest.dictionaryOnlyWords || dictManifest._metadata.dictionaryOnlyWords,
            sources: dictManifest.sources || [],
            searchEndpoint: `/api/vocab/v2/search/${lang}`,
            lookupEndpoint: `/api/vocab/v2/lookup/${lang}/{wordId}`,
          };
        }
      }
    }

    const manifest = {
      api: {
        name: 'Papertek Vocabulary API',
        version: '1.1.0',
        documentation: 'https://www.papertek.no/api-docs',
      },
      core,
      translations,
      dictionary: Object.keys(dictionary).length > 0 ? dictionary : null,
      downloads: downloads ? downloads.downloads : null,
      _generated: new Date().toISOString()
    };

    // Set headers and return
    Object.entries(corsHeaders).forEach(([key, value]) => {
      res.setHeader(key, value);
    });
    res.setHeader('Content-Type', 'application/json');

    return res.status(200).json(manifest);
  } catch (error) {
    console.error('Manifest API error:', error);
    Object.entries(corsHeaders).forEach(([key, value]) => {
      res.setHeader(key, value);
    });
    return res.status(500).json({ error: 'Internal server error' });
  }
}
