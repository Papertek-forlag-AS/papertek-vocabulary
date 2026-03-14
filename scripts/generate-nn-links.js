/**
 * generate-nn-links.js
 *
 * Phase 8: Generates bidirectional links for Norwegian Nynorsk (NN).
 *
 * Creates links by composing existing NB links with the NB→NN mapping:
 *   - nb-nn / nn-nb  (direct NB↔NN equivalence)
 *   - de-nn / nn-de  (via de-nb + nb→nn mapping)
 *   - es-nn / nn-es  (via es-nb + nb→nn mapping)
 *
 * Usage:
 *   node scripts/generate-nn-links.js
 *
 * Requires:
 *   vocabulary/lexicon/nn/nb-to-nn-map.json  (from generate-nn-lexicon.js)
 *   vocabulary/lexicon/links/de-nb/*.json
 *   vocabulary/lexicon/links/es-nb/*.json
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync } from 'fs';
import { join } from 'path';

const LEXICON_BASE = join('vocabulary', 'lexicon');
const LINKS_BASE = join(LEXICON_BASE, 'links');
const NN_BASE = join(LEXICON_BASE, 'nn');

// Load NB→NN mapping
const mapPath = join(NN_BASE, 'nb-to-nn-map.json');
if (!existsSync(mapPath)) {
  console.error('ERROR: nb-to-nn-map.json not found. Run generate-nn-lexicon.js first.');
  process.exit(1);
}
const nbToNnMap = JSON.parse(readFileSync(mapPath, 'utf8'));
console.log(`Loaded NB→NN mapping (${Object.keys(nbToNnMap).length} entries)\n`);

// Load NN word IDs for validation
const nnWordIds = new Set();
for (const bankFile of ['nounbank.json', 'verbbank.json', 'adjectivebank.json', 'generalbank.json']) {
  const filePath = join(NN_BASE, bankFile);
  if (existsSync(filePath)) {
    const data = JSON.parse(readFileSync(filePath, 'utf8'));
    const { _metadata, ...entries } = data;
    Object.keys(entries).forEach(id => nnWordIds.add(id));
  }
}
console.log(`Loaded ${nnWordIds.size} NN word IDs for validation\n`);

let totalLinks = 0;

// ═══════════════════════════════════════════════════════════════════════════
// 1. Generate nb-nn and nn-nb links (direct equivalence)
// ═══════════════════════════════════════════════════════════════════════════

console.log('--- NB ↔ NN links ---');

// Group mappings by type/bank
const nbNnByBank = {
  nounbank: {},
  verbbank: {},
  adjectivebank: {},
  generalbank: {},
};

// Determine which bank an NB ID belongs to by checking existing NB data
const nbBankLookup = {};
for (const bankName of ['nounbank', 'verbbank', 'adjectivebank', 'generalbank']) {
  const nbPath = join(LEXICON_BASE, 'nb', `${bankName}.json`);
  if (existsSync(nbPath)) {
    const data = JSON.parse(readFileSync(nbPath, 'utf8'));
    const { _metadata, ...entries } = data;
    for (const id of Object.keys(entries)) {
      nbBankLookup[id] = bankName;
    }
  }
}

// Build nb→nn forward links
for (const [nbId, nnId] of Object.entries(nbToNnMap)) {
  if (!nnWordIds.has(nnId)) continue;
  const bank = nbBankLookup[nbId] || 'generalbank';
  if (!nbNnByBank[bank]) nbNnByBank[bank] = {};
  nbNnByBank[bank][nbId] = { primary: nnId };
}

const nbNnDir = join(LINKS_BASE, 'nb-nn');
const nnNbDir = join(LINKS_BASE, 'nn-nb');
mkdirSync(nbNnDir, { recursive: true });
mkdirSync(nnNbDir, { recursive: true });

for (const [bankName, links] of Object.entries(nbNnByBank)) {
  const count = Object.keys(links).length;
  if (count === 0) continue;

  // Sort
  const sorted = {};
  for (const key of Object.keys(links).sort()) {
    sorted[key] = links[key];
  }

  // Write forward: nb→nn
  const forwardOutput = {
    _metadata: {
      from: 'nb',
      to: 'nn',
      bank: bankName,
      generatedAt: new Date().toISOString(),
      totalLinks: count,
    },
    ...sorted,
  };
  const forwardPath = join(nbNnDir, `${bankName}.json`);
  writeFileSync(forwardPath, JSON.stringify(forwardOutput, null, 2) + '\n');
  console.log(`  Forward: ${forwardPath} (${count} links)`);
  totalLinks += count;

  // Generate reverse: nn→nb
  const reverseLinks = {};
  for (const [nbId, link] of Object.entries(sorted)) {
    const nnId = link.primary;
    if (!reverseLinks[nnId]) {
      reverseLinks[nnId] = { primary: nbId };
    } else {
      // Multiple NB words map to same NN word
      if (!reverseLinks[nnId].alternatives) {
        reverseLinks[nnId].alternatives = [];
      }
      reverseLinks[nnId].alternatives.push(nbId);
    }
  }

  const sortedReverse = {};
  for (const key of Object.keys(reverseLinks).sort()) {
    sortedReverse[key] = reverseLinks[key];
  }

  const reverseOutput = {
    _metadata: {
      from: 'nn',
      to: 'nb',
      bank: bankName,
      generatedAt: new Date().toISOString(),
      totalLinks: Object.keys(sortedReverse).length,
    },
    ...sortedReverse,
  };
  const reversePath = join(nnNbDir, `${bankName}.json`);
  writeFileSync(reversePath, JSON.stringify(reverseOutput, null, 2) + '\n');
  console.log(`  Reverse: ${reversePath} (${Object.keys(sortedReverse).length} links)`);
  totalLinks += Object.keys(sortedReverse).length;
}

// ═══════════════════════════════════════════════════════════════════════════
// 2. Generate de-nn and nn-de links (via de-nb → nb→nn)
// 3. Generate es-nn and nn-es links (via es-nb → nb→nn)
// ═══════════════════════════════════════════════════════════════════════════

const sourcePairs = ['de', 'es'];

for (const sourceLang of sourcePairs) {
  const nbPairDir = join(LINKS_BASE, `${sourceLang}-nb`);
  if (!existsSync(nbPairDir)) {
    console.log(`\n  Skipping ${sourceLang}-nn (no ${sourceLang}-nb links found)`);
    continue;
  }

  console.log(`\n--- ${sourceLang.toUpperCase()} ↔ NN links (via ${sourceLang}-nb → nb→nn) ---`);

  const forwardDir = join(LINKS_BASE, `${sourceLang}-nn`);
  const reverseDir = join(LINKS_BASE, `nn-${sourceLang}`);
  mkdirSync(forwardDir, { recursive: true });
  mkdirSync(reverseDir, { recursive: true });

  // Read each bank file from {source}-nb links
  const bankFiles = readdirSync(nbPairDir).filter(f => f.endsWith('.json'));

  for (const bankFile of bankFiles) {
    const nbLinkData = JSON.parse(readFileSync(join(nbPairDir, bankFile), 'utf8'));
    const { _metadata, ...nbLinks } = nbLinkData;

    const forwardLinks = {};
    const reverseMap = new Map();

    for (const [sourceId, nbLink] of Object.entries(nbLinks)) {
      // Remap NB target → NN target
      const nbPrimary = nbLink.primary;
      const nnPrimary = nbToNnMap[nbPrimary];

      if (!nnPrimary || !nnWordIds.has(nnPrimary)) continue;

      const link = { primary: nnPrimary };

      // Remap alternatives
      if (nbLink.alternatives) {
        const nnAlts = nbLink.alternatives
          .map(nbAlt => nbToNnMap[nbAlt])
          .filter(nnAlt => nnAlt && nnWordIds.has(nnAlt));
        if (nnAlts.length > 0) {
          link.alternatives = nnAlts;
        }
      }

      // Carry over examples, explanation, synonyms
      if (nbLink.examples) link.examples = nbLink.examples;
      if (nbLink.explanation) link.explanation = nbLink.explanation;
      if (nbLink.synonyms) link.synonyms = nbLink.synonyms;

      forwardLinks[sourceId] = link;

      // Build reverse map
      if (!reverseMap.has(nnPrimary)) {
        reverseMap.set(nnPrimary, { primary: null, alternatives: [], examples: [] });
      }
      const rev = reverseMap.get(nnPrimary);
      if (!rev.primary) {
        rev.primary = sourceId;
        if (link.examples) {
          rev.examples = link.examples.map(ex => ({
            source: ex.target,
            target: ex.source,
          }));
        }
      } else {
        rev.alternatives.push(sourceId);
      }

      // Reverse for alternatives
      if (link.alternatives) {
        for (const altNnId of link.alternatives) {
          if (!reverseMap.has(altNnId)) {
            reverseMap.set(altNnId, { primary: null, alternatives: [], examples: [] });
          }
          const altRev = reverseMap.get(altNnId);
          if (!altRev.primary) {
            altRev.primary = sourceId;
          } else {
            altRev.alternatives.push(sourceId);
          }
        }
      }
    }

    const fwdCount = Object.keys(forwardLinks).length;
    if (fwdCount === 0) continue;

    // Sort and write forward
    const sortedFwd = {};
    for (const key of Object.keys(forwardLinks).sort()) {
      sortedFwd[key] = forwardLinks[key];
    }

    const forwardOutput = {
      _metadata: {
        from: sourceLang,
        to: 'nn',
        bank: bankFile.replace('.json', ''),
        generatedAt: new Date().toISOString(),
        totalLinks: fwdCount,
      },
      ...sortedFwd,
    };
    writeFileSync(join(forwardDir, bankFile), JSON.stringify(forwardOutput, null, 2) + '\n');
    console.log(`  Forward: ${join(forwardDir, bankFile)} (${fwdCount} links)`);
    totalLinks += fwdCount;

    // Build and write reverse
    const reverseLinks = {};
    for (const [nnId, rev] of reverseMap) {
      if (!rev.primary) continue;
      const entry = { primary: rev.primary };
      if (rev.alternatives.length > 0) entry.alternatives = rev.alternatives;
      if (rev.examples.length > 0) entry.examples = rev.examples;
      reverseLinks[nnId] = entry;
    }

    const sortedRev = {};
    for (const key of Object.keys(reverseLinks).sort()) {
      sortedRev[key] = reverseLinks[key];
    }

    const reverseOutput = {
      _metadata: {
        from: 'nn',
        to: sourceLang,
        bank: bankFile.replace('.json', ''),
        generatedAt: new Date().toISOString(),
        totalLinks: Object.keys(sortedRev).length,
      },
      ...sortedRev,
    };
    writeFileSync(join(reverseDir, bankFile), JSON.stringify(reverseOutput, null, 2) + '\n');
    console.log(`  Reverse: ${join(reverseDir, bankFile)} (${Object.keys(sortedRev).length} links)`);
    totalLinks += Object.keys(sortedRev).length;
  }
}

// Summary
console.log('\n=== Summary ===');
console.log(`  Total links generated: ${totalLinks}`);
console.log(`  Link pairs: nb-nn, nn-nb, de-nn, nn-de, es-nn, nn-es`);
console.log(`\n  Output: ${LINKS_BASE}/`);
