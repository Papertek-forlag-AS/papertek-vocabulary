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

// Static metadata for each curriculum
const CURRICULA_META = {
  'tysk1-vg1':   { language: 'de', name: 'Wir sprechen Deutsch 1 VG1' },
  'tysk1-vg2':   { language: 'de', name: 'Wir sprechen Deutsch 1 VG2' },
  'tysk2-vg1':   { language: 'de', name: 'Wir sprechen Deutsch 2 VG1' },
  'tysk2-vg2':   { language: 'de', name: 'Wir sprechen Deutsch 2 VG2' },
  'us-8':        { language: 'de', name: 'Deutsch für die Mittelstufe 8' },
  'us-9':        { language: 'de', name: 'Deutsch für die Mittelstufe 9' },
  'us-10':       { language: 'de', name: 'Deutsch für die Mittelstufe 10' },
  'spansk1-vg1': { language: 'es', name: 'Buen viaje 1 VG1' },
};

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    setCors(res);
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    setCors(res);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const curriculaPath = path.join(process.cwd(), 'vocabulary', 'curricula');
    const files = fs.readdirSync(curriculaPath)
      .filter(f => f.startsWith('vocab-manifest-') && f.endsWith('.json'));

    const curricula = files.map(f => {
      const id = f.replace('vocab-manifest-', '').replace('.json', '');
      const meta = CURRICULA_META[id] || { language: 'unknown', name: id };
      return {
        id,
        language: meta.language,
        name: meta.name,
        endpoint: `/api/vocab/v1/curricula/${id}`,
      };
    });

    setCors(res);
    res.setHeader('Content-Type', 'application/json');
    return res.status(200).json({ curricula });
  } catch (error) {
    console.error('Curricula list API error:', error);
    setCors(res);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
