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

  const { pair, wordId } = req.query;

  if (!pair || !wordId) {
    setCors(res);
    return res.status(400).json({ error: 'pair and wordId parameters are required' });
  }

  // Validate pair format (e.g., "de-nb", "nb-de")
  const parts = pair.split('-');
  if (parts.length !== 2 || parts[0].length !== 2 || parts[1].length !== 2) {
    setCors(res);
    return res.status(400).json({ error: 'Invalid pair format. Use ISO codes like de-nb, nb-de' });
  }

  try {
    const linksPath = path.join(process.cwd(), 'vocabulary', 'lexicon', 'links', pair);

    if (!fs.existsSync(linksPath)) {
      setCors(res);
      const availablePairs = [];
      const linksBase = path.join(process.cwd(), 'vocabulary', 'lexicon', 'links');
      if (fs.existsSync(linksBase)) {
        fs.readdirSync(linksBase)
          .filter(f => fs.statSync(path.join(linksBase, f)).isDirectory())
          .forEach(f => availablePairs.push(f));
      }
      return res.status(404).json({ error: 'Link pair not found', pair, available: availablePairs });
    }

    // Search all bank files in the pair directory
    const bankFiles = fs.readdirSync(linksPath).filter(f => f.endsWith('.json'));
    let linkEntry = null;
    let foundInBank = null;

    for (const bankFile of bankFiles) {
      const data = JSON.parse(fs.readFileSync(path.join(linksPath, bankFile), 'utf8'));
      if (data[wordId]) {
        linkEntry = data[wordId];
        foundInBank = bankFile.replace('.json', '');
        break;
      }
    }

    if (!linkEntry) {
      setCors(res);
      return res.status(404).json({ error: 'No link found for word', wordId, pair });
    }

    // Optionally resolve the linked word entries
    const resolve = req.query.resolve === 'true';
    const [fromLang, toLang] = parts;

    const response = {
      _meta: {
        wordId,
        from: fromLang,
        to: toLang,
        bank: foundInBank,
      },
      ...linkEntry,
    };

    // If resolve=true, include the full target word entry
    if (resolve && linkEntry.primary) {
      const lexiconPath = path.join(process.cwd(), 'vocabulary', 'lexicon');
      const targetLangPath = path.join(lexiconPath, toLang);

      if (fs.existsSync(targetLangPath)) {
        const targetBankFiles = fs.readdirSync(targetLangPath).filter(f => f.endsWith('bank.json'));
        for (const tbf of targetBankFiles) {
          const tData = JSON.parse(fs.readFileSync(path.join(targetLangPath, tbf), 'utf8'));
          if (tData[linkEntry.primary]) {
            response.resolvedPrimary = tData[linkEntry.primary];
            break;
          }
        }
      }
    }

    setCors(res);
    res.setHeader('Content-Type', 'application/json');
    return res.status(200).json(response);
  } catch (error) {
    console.error('v3 Links API error:', error);
    setCors(res);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
