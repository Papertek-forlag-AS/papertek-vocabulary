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
  if (req.method === 'OPTIONS') {
    setCors(res);
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    setCors(res);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { curriculumId } = req.query;

  try {
    const curriculaPath = path.join(process.cwd(), 'vocabulary', 'curricula');
    const filePath = path.join(curriculaPath, `vocab-manifest-${curriculumId}.json`);

    if (!fs.existsSync(filePath)) {
      // List available curricula for the error response
      const available = fs.readdirSync(curriculaPath)
        .filter(f => f.startsWith('vocab-manifest-') && f.endsWith('.json'))
        .map(f => f.replace('vocab-manifest-', '').replace('.json', ''));

      setCors(res);
      return res.status(404).json({
        error: 'Curriculum not found',
        available,
      });
    }

    const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

    setCors(res);
    res.setHeader('Content-Type', 'application/json');
    return res.status(200).json(data);
  } catch (error) {
    console.error('Curriculum API error:', error);
    setCors(res);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
