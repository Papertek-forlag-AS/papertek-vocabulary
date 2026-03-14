/**
 * generate-en-nb-links.js
 *
 * Generates English ↔ Norwegian links by triangulation through
 * intermediate languages (DE, ES, FR).
 *
 * Triangulation: if DE:haus links to both NB:hus and EN:house,
 * then EN:house should link to NB:hus.
 *
 * Also derives EN ↔ NN links via the NB→NN mapping.
 *
 * Generates:
 *   - en-nb / nb-en  (English ↔ Norwegian Bokmål)
 *   - en-nn / nn-en  (English ↔ Norwegian Nynorsk)
 *
 * Usage:
 *   node scripts/generate-en-nb-links.js
 *
 * Requires:
 *   vocabulary/lexicon/links/{source}-nb/*.json  (de-nb, es-nb, fr-nb)
 *   vocabulary/lexicon/links/{source}-en/*.json  (de-en, es-en, fr-en)
 *   vocabulary/lexicon/nb/*.json  (NB lexicon for validation)
 *   vocabulary/lexicon/en/*.json  (EN lexicon for validation)
 *   vocabulary/lexicon/nn/nb-to-nn-map.json  (for NN derivation)
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync } from 'fs';
import { join } from 'path';

const LEXICON_BASE = join('vocabulary', 'lexicon');
const LINKS_BASE = join(LEXICON_BASE, 'links');

// Intermediate languages that have both {lang}-nb and {lang}-en links
const BRIDGE_LANGS = ['de', 'es', 'fr'];

// Load word IDs from a language lexicon
function loadWordIds(lang) {
  const ids = new Set();
  for (const bf of ['nounbank.json', 'verbbank.json', 'adjectivebank.json', 'generalbank.json']) {
    const fp = join(LEXICON_BASE, lang, bf);
    if (existsSync(fp)) {
      const data = JSON.parse(readFileSync(fp, 'utf8'));
      const { _metadata, ...entries } = data;
      Object.keys(entries).forEach(id => ids.add(id));
    }
  }
  return ids;
}

// Load all links from a pair directory → Map<sourceId, linkObject>
function loadLinkPair(pair) {
  const pairDir = join(LINKS_BASE, pair);
  if (!existsSync(pairDir)) return new Map();

  const links = new Map();
  const files = readdirSync(pairDir).filter(f => f.endsWith('.json'));
  for (const file of files) {
    const data = JSON.parse(readFileSync(join(pairDir, file), 'utf8'));
    const { _metadata, ...entries } = data;
    for (const [id, link] of Object.entries(entries)) {
      links.set(id, { ...link, _bank: file.replace('.json', '') });
    }
  }
  return links;
}

// Determine which bank a word ID belongs to
function guessBankForId(wordId) {
  const parts = wordId.split('_');
  const suffix = parts[parts.length - 1];
  const map = {
    noun: 'nounbank', verb: 'verbbank', adj: 'adjectivebank',
  };
  return map[suffix] || 'generalbank';
}

// ─── Main ────────────────────────────────────────────────────────────────

console.log('Generating EN ↔ NB links by triangulation...\n');

const nbWordIds = loadWordIds('nb');
const enWordIds = loadWordIds('en');
console.log(`  NB lexicon: ${nbWordIds.size} word IDs`);
console.log(`  EN lexicon: ${enWordIds.size} word IDs\n`);

// ═══════════════════════════════════════════════════════════════════════════
// Phase 1: Triangulate EN ↔ NB through intermediate languages
// ═══════════════════════════════════════════════════════════════════════════

// Map: enWordId → { primary: nbWordId, alternatives: Set, sources: [] }
const enToNbMap = new Map();

for (const bridge of BRIDGE_LANGS) {
  const nbLinks = loadLinkPair(`${bridge}-nb`);
  const enLinks = loadLinkPair(`${bridge}-en`);

  if (nbLinks.size === 0 || enLinks.size === 0) {
    console.log(`  Skipping ${bridge} bridge (nb: ${nbLinks.size}, en: ${enLinks.size} links)`);
    continue;
  }

  let bridgeCount = 0;

  // For each bridge word that has BOTH nb and en links
  for (const [bridgeId, nbLink] of nbLinks) {
    const enLink = enLinks.get(bridgeId);
    if (!enLink) continue;

    const nbPrimary = nbLink.primary;
    const enPrimary = enLink.primary;

    if (!nbWordIds.has(nbPrimary) || !enWordIds.has(enPrimary)) continue;

    // Record en→nb mapping
    if (!enToNbMap.has(enPrimary)) {
      enToNbMap.set(enPrimary, { primary: nbPrimary, alternatives: new Set(), examples: [], sources: [] });
    }
    const mapping = enToNbMap.get(enPrimary);
    mapping.sources.push(bridge);

    // If this bridge provides examples, keep them (prefer examples from first bridge)
    if (nbLink.examples && mapping.examples.length === 0) {
      // Use NB examples as the target sentences (they're already in Norwegian)
      // We don't have direct EN→NB sentence pairs, but we preserve what we can
      mapping.nbExamples = nbLink.examples;
    }

    // Add NB alternatives from bridge
    if (nbLink.alternatives) {
      for (const alt of nbLink.alternatives) {
        if (nbWordIds.has(alt) && alt !== mapping.primary) {
          mapping.alternatives.add(alt);
        }
      }
    }

    // Also process EN alternatives → same NB word
    if (enLink.alternatives) {
      for (const enAlt of enLink.alternatives) {
        if (!enWordIds.has(enAlt)) continue;
        if (!enToNbMap.has(enAlt)) {
          enToNbMap.set(enAlt, { primary: nbPrimary, alternatives: new Set(), examples: [], sources: [bridge] });
        } else {
          // If already mapped to a different NB word, add this NB word as alternative
          const altMapping = enToNbMap.get(enAlt);
          if (altMapping.primary !== nbPrimary) {
            altMapping.alternatives.add(nbPrimary);
          }
        }
      }
    }

    // Also handle NB alternatives → same EN word
    if (nbLink.alternatives) {
      for (const nbAlt of nbLink.alternatives) {
        if (nbWordIds.has(nbAlt) && nbAlt !== mapping.primary) {
          mapping.alternatives.add(nbAlt);
        }
      }
    }

    bridgeCount++;
  }

  console.log(`  ${bridge.toUpperCase()} bridge: ${bridgeCount} triangulated connections`);
}

console.log(`\n  Total unique EN→NB mappings: ${enToNbMap.size}\n`);

// ═══════════════════════════════════════════════════════════════════════════
// Write EN-NB and NB-EN links
// ═══════════════════════════════════════════════════════════════════════════

console.log('--- EN ↔ NB links ---');

mkdirSync(join(LINKS_BASE, 'en-nb'), { recursive: true });
mkdirSync(join(LINKS_BASE, 'nb-en'), { recursive: true });

// Group by bank
const enNbByBank = {};
for (const [enId, mapping] of enToNbMap) {
  const bank = guessBankForId(enId);
  if (!enNbByBank[bank]) enNbByBank[bank] = {};

  const link = { primary: mapping.primary };
  const alts = [...mapping.alternatives].filter(a => a !== mapping.primary);
  if (alts.length > 0) link.alternatives = alts;

  enNbByBank[bank][enId] = link;
}

let totalEnNb = 0, totalNbEn = 0;

for (const [bankName, links] of Object.entries(enNbByBank)) {
  const count = Object.keys(links).length;
  if (count === 0) continue;

  // Sort and write forward (en→nb)
  const sorted = {};
  for (const key of Object.keys(links).sort()) sorted[key] = links[key];

  writeFileSync(join(LINKS_BASE, 'en-nb', `${bankName}.json`), JSON.stringify({
    _metadata: { from: 'en', to: 'nb', bank: bankName, generatedAt: new Date().toISOString(), totalLinks: count },
    ...sorted,
  }, null, 2) + '\n');
  console.log(`  en-nb/${bankName}: ${count} links`);
  totalEnNb += count;

  // Build reverse (nb→en)
  const reverseMap = new Map();
  for (const [enId, link] of Object.entries(sorted)) {
    const nbId = link.primary;
    if (!reverseMap.has(nbId)) {
      reverseMap.set(nbId, { primary: null, alternatives: [] });
    }
    const rev = reverseMap.get(nbId);
    if (!rev.primary) rev.primary = enId;
    else rev.alternatives.push(enId);

    if (link.alternatives) {
      for (const altNbId of link.alternatives) {
        if (!reverseMap.has(altNbId)) {
          reverseMap.set(altNbId, { primary: null, alternatives: [] });
        }
        const altRev = reverseMap.get(altNbId);
        if (!altRev.primary) altRev.primary = enId;
        else altRev.alternatives.push(enId);
      }
    }
  }

  const reverseLinks = {};
  for (const [nbId, rev] of reverseMap) {
    if (!rev.primary) continue;
    const entry = { primary: rev.primary };
    if (rev.alternatives.length > 0) entry.alternatives = rev.alternatives;
    reverseLinks[nbId] = entry;
  }

  const sortedReverse = {};
  for (const key of Object.keys(reverseLinks).sort()) sortedReverse[key] = reverseLinks[key];

  writeFileSync(join(LINKS_BASE, 'nb-en', `${bankName}.json`), JSON.stringify({
    _metadata: { from: 'nb', to: 'en', bank: bankName, generatedAt: new Date().toISOString(), totalLinks: Object.keys(sortedReverse).length },
    ...sortedReverse,
  }, null, 2) + '\n');
  console.log(`  nb-en/${bankName}: ${Object.keys(sortedReverse).length} links`);
  totalNbEn += Object.keys(sortedReverse).length;
}

// ═══════════════════════════════════════════════════════════════════════════
// Phase 2: Derive EN ↔ NN from EN ↔ NB + NB→NN map
// ═══════════════════════════════════════════════════════════════════════════

console.log('\n--- EN ↔ NN links (via en-nb → nb→nn) ---');

const nnMapPath = join(LEXICON_BASE, 'nn', 'nb-to-nn-map.json');
if (!existsSync(nnMapPath)) {
  console.log('  Skipping EN↔NN (nb-to-nn-map.json not found)');
} else {
  const nbToNnMap = JSON.parse(readFileSync(nnMapPath, 'utf8'));
  const nnWordIds = loadWordIds('nn');
  console.log(`  NN lexicon: ${nnWordIds.size} word IDs, NB→NN map: ${Object.keys(nbToNnMap).length} entries\n`);

  mkdirSync(join(LINKS_BASE, 'en-nn'), { recursive: true });
  mkdirSync(join(LINKS_BASE, 'nn-en'), { recursive: true });

  let totalEnNn = 0, totalNnEn = 0;

  for (const [bankName, links] of Object.entries(enNbByBank)) {
    const enNnLinks = {};
    const nnEnReverseMap = new Map();

    for (const [enId, nbLink] of Object.entries(links)) {
      const nbPrimary = nbLink.primary;
      const nnPrimary = nbToNnMap[nbPrimary];
      if (!nnPrimary || !nnWordIds.has(nnPrimary)) continue;

      const link = { primary: nnPrimary };

      // Remap alternatives
      if (nbLink.alternatives) {
        const nnAlts = nbLink.alternatives
          .map(nbAlt => nbToNnMap[nbAlt])
          .filter(nnAlt => nnAlt && nnWordIds.has(nnAlt));
        if (nnAlts.length > 0) link.alternatives = nnAlts;
      }

      enNnLinks[enId] = link;

      // Build reverse
      if (!nnEnReverseMap.has(nnPrimary)) {
        nnEnReverseMap.set(nnPrimary, { primary: null, alternatives: [] });
      }
      const rev = nnEnReverseMap.get(nnPrimary);
      if (!rev.primary) rev.primary = enId;
      else rev.alternatives.push(enId);

      if (link.alternatives) {
        for (const altNnId of link.alternatives) {
          if (!nnEnReverseMap.has(altNnId)) {
            nnEnReverseMap.set(altNnId, { primary: null, alternatives: [] });
          }
          const altRev = nnEnReverseMap.get(altNnId);
          if (!altRev.primary) altRev.primary = enId;
          else altRev.alternatives.push(enId);
        }
      }
    }

    const fwdCount = Object.keys(enNnLinks).length;
    if (fwdCount === 0) continue;

    // Sort and write en-nn
    const sorted = {};
    for (const key of Object.keys(enNnLinks).sort()) sorted[key] = enNnLinks[key];

    writeFileSync(join(LINKS_BASE, 'en-nn', `${bankName}.json`), JSON.stringify({
      _metadata: { from: 'en', to: 'nn', bank: bankName, generatedAt: new Date().toISOString(), totalLinks: fwdCount },
      ...sorted,
    }, null, 2) + '\n');
    console.log(`  en-nn/${bankName}: ${fwdCount} links`);
    totalEnNn += fwdCount;

    // Write nn-en reverse
    const reverseLinks = {};
    for (const [nnId, rev] of nnEnReverseMap) {
      if (!rev.primary) continue;
      const entry = { primary: rev.primary };
      if (rev.alternatives.length > 0) entry.alternatives = rev.alternatives;
      reverseLinks[nnId] = entry;
    }

    const sortedReverse = {};
    for (const key of Object.keys(reverseLinks).sort()) sortedReverse[key] = reverseLinks[key];

    writeFileSync(join(LINKS_BASE, 'nn-en', `${bankName}.json`), JSON.stringify({
      _metadata: { from: 'nn', to: 'en', bank: bankName, generatedAt: new Date().toISOString(), totalLinks: Object.keys(sortedReverse).length },
      ...sortedReverse,
    }, null, 2) + '\n');
    console.log(`  nn-en/${bankName}: ${Object.keys(sortedReverse).length} links`);
    totalNnEn += Object.keys(sortedReverse).length;
  }

  console.log(`\n  EN↔NN total: en-nn=${totalEnNn}, nn-en=${totalNnEn}`);
}

// ═══════════════════════════════════════════════════════════════════════════
// Summary
// ═══════════════════════════════════════════════════════════════════════════

console.log('\n=== Summary ===');
console.log(`  en-nb: ${totalEnNb} links`);
console.log(`  nb-en: ${totalNbEn} links`);
console.log(`  Link pairs created: en-nb, nb-en, en-nn, nn-en`);
