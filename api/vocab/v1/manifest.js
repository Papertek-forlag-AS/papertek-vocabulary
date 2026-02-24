import fs from 'fs';
import path from 'path';

// CORS headers for external API access
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, X-API-Key',
  'Cache-Control': 'public, max-age=3600, s-maxage=86400', // 1hr browser, 24hr CDN
};

// Map ISO language codes to human-readable names
const LANGUAGE_NAMES = {
  de: 'German',
  es: 'Spanish',
  fr: 'French',
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

    // Read core languages from banks/
    const banksPath = path.join(vocabPath, 'banks');
    const coreLanguages = fs.readdirSync(banksPath)
      .filter(f => fs.statSync(path.join(banksPath, f)).isDirectory());

    // Read translation packs
    const translationsPath = path.join(vocabPath, 'translations');
    const translationPacks = fs.readdirSync(translationsPath)
      .filter(f => fs.statSync(path.join(translationsPath, f)).isDirectory());

    // Build core manifests from banks/ structure
    const core = {};
    for (const lang of coreLanguages) {
      const manifestPath = path.join(banksPath, lang, 'manifest.json');
      if (fs.existsSync(manifestPath)) {
        const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));

        // Check for audio folder
        const audioPath = path.join(banksPath, lang, 'audio');
        const hasAudio = fs.existsSync(audioPath);
        const audioCount = hasAudio
          ? fs.readdirSync(audioPath).filter(f => f.endsWith('.mp3')).length
          : 0;

        // New manifest structure: manifest.banks keys = bank file names
        // manifest.summary.curriculumWords = total curriculum words (v1 returns curriculum only)
        const bankFiles = Object.keys(manifest.banks || {});

        core[lang] = {
          language: LANGUAGE_NAMES[lang] || lang,
          version: manifest._metadata.generatedAt,
          totalWords: manifest.summary?.curriculumWords || 0,
          files: bankFiles,
          updatedAt: manifest._metadata.generatedAt,
          endpoint: `/api/vocab/v1/core/${lang}`,
          audio: hasAudio ? {
            baseUrl: `/shared/vocabulary/banks/${lang}/audio`,
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

    // Build curricula info
    const curricula = [];
    const curriculaMeta = {
      'tysk1-vg1':   { language: 'de', name: 'Wir sprechen Deutsch 1 VG1' },
      'tysk1-vg2':   { language: 'de', name: 'Wir sprechen Deutsch 1 VG2' },
      'tysk2-vg1':   { language: 'de', name: 'Wir sprechen Deutsch 2 VG1' },
      'tysk2-vg2':   { language: 'de', name: 'Wir sprechen Deutsch 2 VG2' },
      'us-8':        { language: 'de', name: 'Deutsch für die Mittelstufe 8' },
      'us-9':        { language: 'de', name: 'Deutsch für die Mittelstufe 9' },
      'us-10':       { language: 'de', name: 'Deutsch für die Mittelstufe 10' },
      'spansk1-vg1': { language: 'es', name: 'Buen viaje 1 VG1' },
    };
    const curriculaPath = path.join(vocabPath, 'curricula');
    if (fs.existsSync(curriculaPath)) {
      const files = fs.readdirSync(curriculaPath)
        .filter(f => f.startsWith('vocab-manifest-') && f.endsWith('.json'));
      for (const f of files) {
        const id = f.replace('vocab-manifest-', '').replace('.json', '');
        const meta = curriculaMeta[id] || { language: 'unknown', name: id };
        curricula.push({
          id,
          language: meta.language,
          name: meta.name,
          endpoint: `/api/vocab/v1/curricula/${id}`,
        });
      }
    }

    // Build dictionary info (v2 endpoints) from banks/ manifests
    const dictionary = {};
    for (const lang of coreLanguages) {
      const bankManifestPath = path.join(banksPath, lang, 'manifest.json');
      if (fs.existsSync(bankManifestPath)) {
        const bankManifest = JSON.parse(fs.readFileSync(bankManifestPath, 'utf-8'));
        dictionary[lang] = {
          version: bankManifest._metadata.generatedAt,
          totalWords: bankManifest.summary?.totalWords || 0,
          curriculumWords: bankManifest.summary?.curriculumWords || 0,
          dictionaryOnlyWords: bankManifest.summary?.dictionaryOnlyWords || 0,
          searchEndpoint: `/api/vocab/v2/search/${lang}`,
          lookupEndpoint: `/api/vocab/v2/lookup/${lang}/{wordId}`,
        };
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
      curricula: curricula.length > 0 ? curricula : null,
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
