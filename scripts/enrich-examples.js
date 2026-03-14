/**
 * enrich-examples.js
 *
 * Adds examples (sentence pairs) and explanations to NB, EN, and NN entries.
 *
 * Data sources:
 *   - de-nb translations: 613 entries with German→Norwegian example sentences
 *   - de-en translations: 365 entries with German→English example sentences
 *   - Paired de-en + de-nb: creates EN→NB example pairs (same German source)
 *   - NB morphology data: generates explanation text from conjugations/forms
 *
 * Usage:
 *   node scripts/enrich-examples.js
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

const VOCAB_BASE = 'vocabulary';
const TRANS_BASE = join(VOCAB_BASE, 'translations');
const LEXICON_BASE = join(VOCAB_BASE, 'lexicon');
const LINKS_BASE = join(LEXICON_BASE, 'links');

const BANK_FILES = [
  'nounbank.json', 'verbbank.json', 'adjectivebank.json',
  'generalbank.json', 'articlesbank.json', 'numbersbank.json',
  'phrasesbank.json', 'pronounsbank.json',
];

// ═══════════════════════════════════════════════════════════════════════════
// 1. Load translation data with examples and explanations
// ═══════════════════════════════════════════════════════════════════════════

// Map: sourceWordId → { examples, explanation, translation }
function loadTranslations(pair) {
  const map = new Map();
  const dir = join(TRANS_BASE, pair);
  if (!existsSync(dir)) return map;
  for (const bf of BANK_FILES) {
    const fp = join(dir, bf);
    if (!existsSync(fp)) continue;
    const data = JSON.parse(readFileSync(fp, 'utf8'));
    const { _metadata, ...entries } = data;
    for (const [id, entry] of Object.entries(entries)) {
      map.set(id, entry);
    }
  }
  return map;
}

// Map: targetWordId → [sourceWordId, ...]
function loadReverseLinks(pair) {
  const map = new Map();
  const dir = join(LINKS_BASE, pair);
  if (!existsSync(dir)) return map;
  for (const bf of BANK_FILES) {
    const fp = join(dir, bf);
    if (!existsSync(fp)) continue;
    const data = JSON.parse(readFileSync(fp, 'utf8'));
    const { _metadata, ...entries } = data;
    for (const [id, link] of Object.entries(entries)) {
      if (!map.has(id)) map.set(id, []);
      map.get(id).push({ sourceId: link.primary, alternatives: link.alternatives || [] });
    }
  }
  return map;
}

console.log('Loading translation data...');
const deNbTrans = loadTranslations('de-nb');
const deEnTrans = loadTranslations('de-en');
const esNbTrans = loadTranslations('es-nb');
console.log(`  de-nb: ${deNbTrans.size} entries`);
console.log(`  de-en: ${deEnTrans.size} entries`);
console.log(`  es-nb: ${esNbTrans.size} entries`);

console.log('Loading link data...');
const nbDeLinks = loadReverseLinks('nb-de');
const nbEsLinks = loadReverseLinks('nb-es');
const enDeLinks = loadReverseLinks('en-de');
console.log(`  nb-de: ${nbDeLinks.size} entries`);
console.log(`  nb-es: ${nbEsLinks.size} entries`);
console.log(`  en-de: ${enDeLinks.size} entries`);

// ═══════════════════════════════════════════════════════════════════════════
// 2. Generate NB explanation text from morphology
// ═══════════════════════════════════════════════════════════════════════════

function generateNbExplanation(entry) {
  const word = entry.word;
  const type = entry.type;

  if (type === 'verb' && entry.conjugations?.presens?.former) {
    const f = entry.conjugations.presens.former;
    const cls = entry.verbClass === 'sterk' ? 'Sterkt verb' :
      entry.verbClass === 'uregelmessig' ? 'Uregelmessig verb' : 'Svakt verb';
    const parts = [`${cls}`];
    if (f.presens && f.preteritum && f.perfektum_partisipp) {
      parts.push(`Bøyes: ${f.presens} – ${f.preteritum} – har ${f.perfektum_partisipp}`);
    }
    return parts.join('. ') + '.';
  }

  if (type === 'noun' && entry.genus) {
    const genusName = entry.genus === 'm' ? 'Maskulint' :
      entry.genus === 'f' ? 'Feminint' : 'Nøytralt';
    const article = entry.genus === 'm' ? 'en' : entry.genus === 'f' ? 'ei' : 'et';
    const parts = [`${genusName} substantiv (${article} ${word})`];
    if (entry.forms?.ubestemt?.flertall) {
      parts.push(`Flertall: ${entry.forms.ubestemt.flertall}`);
    }
    return parts.join('. ') + '.';
  }

  if (type === 'adj' && entry.comparison) {
    const c = entry.comparison;
    return `Adjektiv. Gradbøying: ${c.positiv} – ${c.komparativ} – ${c.superlativ}.`;
  }

  return null;
}

function generateNnExplanation(entry) {
  const word = entry.word;
  const type = entry.type;

  if (type === 'verb' && entry.conjugations?.presens?.former) {
    const f = entry.conjugations.presens.former;
    const cls = entry.verbClass === 'sterk' ? 'Sterkt verb' :
      entry.verbClass === 'uregelmessig' ? 'Uregelrett verb' : 'Svakt verb';
    const parts = [`${cls}`];
    if (f.presens && f.preteritum && f.perfektum_partisipp) {
      parts.push(`Bøying: ${f.presens} – ${f.preteritum} – har ${f.perfektum_partisipp}`);
    }
    return parts.join('. ') + '.';
  }

  if (type === 'noun' && entry.genus) {
    const genusName = entry.genus === 'm' ? 'Maskulint' :
      entry.genus === 'f' ? 'Feminint' : 'Nøytralt';
    const article = entry.genus === 'm' ? 'ein' : entry.genus === 'f' ? 'ei' : 'eit';
    const parts = [`${genusName} substantiv (${article} ${word})`];
    if (entry.forms?.ubestemt?.flertall) {
      parts.push(`Fleirtal: ${entry.forms.ubestemt.flertall}`);
    }
    return parts.join('. ') + '.';
  }

  if (type === 'adj' && entry.comparison) {
    const c = entry.comparison;
    return `Adjektiv. Gradbøying: ${c.positiv} – ${c.komparativ} – ${c.superlativ}.`;
  }

  return null;
}

function generateEnExplanation(entry) {
  const word = entry.word;
  const type = entry.type;

  if (type === 'verb' && entry.conjugations) {
    const c = entry.conjugations;
    const cls = entry.verbClass === 'irregular' ? 'Uregelrett verb' : 'Regelrett verb';
    const parts = [`${cls} på engelsk`];
    if (c.past?.former?.simple && c.perfect?.participle) {
      parts.push(`Bøyes: ${word} – ${c.past.former.simple} – ${c.perfect.participle}`);
    }
    return parts.join('. ') + '.';
  }

  if (type === 'adj' && entry.comparison) {
    const c = entry.comparison;
    return `Engelsk adjektiv. Gradbøying: ${c.positive} – ${c.comparative} – ${c.superlative}.`;
  }

  return null;
}

// ═══════════════════════════════════════════════════════════════════════════
// 3. Enrich NB entries
// ═══════════════════════════════════════════════════════════════════════════

console.log('\n--- Enriching NB entries ---');

let nbExamples = 0, nbExplanations = 0;

for (const bankFile of ['nounbank.json', 'verbbank.json', 'adjectivebank.json', 'generalbank.json']) {
  const fp = join(LEXICON_BASE, 'nb', bankFile);
  if (!existsSync(fp)) continue;

  const data = JSON.parse(readFileSync(fp, 'utf8'));
  const { _metadata, ...entries } = data;

  for (const [nbId, entry] of Object.entries(entries)) {
    // Add examples from de-nb translations (via nb-de reverse links)
    if (!entry.examples || entry.examples.length === 0) {
      const deLinks = nbDeLinks.get(nbId) || [];
      const examples = [];

      for (const { sourceId } of deLinks) {
        const trans = deNbTrans.get(sourceId);
        if (trans?.examples) {
          for (const ex of trans.examples) {
            // Reverse: NB sentence as source, DE as target
            examples.push({ sentence: ex.translation, translation: ex.sentence });
          }
        }
      }

      // Also check es-nb
      const esLinks = nbEsLinks.get(nbId) || [];
      for (const { sourceId } of esLinks) {
        const trans = esNbTrans.get(sourceId);
        if (trans?.examples) {
          for (const ex of trans.examples) {
            examples.push({ sentence: ex.translation, translation: ex.sentence });
          }
        }
      }

      if (examples.length > 0) {
        // Deduplicate by sentence
        const seen = new Set();
        entry.examples = examples.filter(ex => {
          const key = ex.sentence;
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        }).slice(0, 5); // Max 5 examples
        nbExamples++;
      }
    }

    // Add explanation
    if (!entry.explanation) {
      // First try from DE translation explanation
      const deLinks = nbDeLinks.get(nbId) || [];
      let foundExplanation = null;
      for (const { sourceId } of deLinks) {
        const trans = deNbTrans.get(sourceId);
        if (trans?.explanation?._description) {
          foundExplanation = trans.explanation._description;
          break;
        }
      }

      if (foundExplanation) {
        entry.explanation = { _description: foundExplanation };
        nbExplanations++;
      } else {
        // Generate from morphology
        const gen = generateNbExplanation(entry);
        if (gen) {
          entry.explanation = { _description: gen };
          nbExplanations++;
        }
      }
    }
  }

  writeFileSync(fp, JSON.stringify({ _metadata, ...entries }, null, 2) + '\n');
}

console.log(`  Examples added: ${nbExamples} entries`);
console.log(`  Explanations added: ${nbExplanations} entries`);

// ═══════════════════════════════════════════════════════════════════════════
// 4. Enrich EN entries
// ═══════════════════════════════════════════════════════════════════════════

console.log('\n--- Enriching EN entries ---');

let enExamples = 0, enExplanations = 0;

for (const bankFile of ['nounbank.json', 'verbbank.json', 'adjectivebank.json', 'generalbank.json']) {
  const fp = join(LEXICON_BASE, 'en', bankFile);
  if (!existsSync(fp)) continue;

  const data = JSON.parse(readFileSync(fp, 'utf8'));
  const { _metadata, ...entries } = data;

  for (const [enId, entry] of Object.entries(entries)) {
    // Add examples: pair de-en + de-nb examples (same DE source sentence)
    if (!entry.examples || entry.examples.length === 0) {
      const deLinks = enDeLinks.get(enId) || [];
      const examples = [];

      for (const { sourceId } of deLinks) {
        const enTrans = deEnTrans.get(sourceId);
        const nbTrans = deNbTrans.get(sourceId);

        if (enTrans?.examples && nbTrans?.examples) {
          // Build map of DE sentence → NB translation
          const deToNb = new Map();
          for (const ex of nbTrans.examples) {
            deToNb.set(ex.sentence, ex.translation);
          }

          // Pair EN translations with NB translations via shared DE source
          for (const ex of enTrans.examples) {
            const nbSentence = deToNb.get(ex.sentence);
            if (nbSentence) {
              examples.push({ sentence: ex.translation, translation: nbSentence });
            }
          }
        }
      }

      if (examples.length > 0) {
        const seen = new Set();
        entry.examples = examples.filter(ex => {
          const key = ex.sentence;
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        }).slice(0, 5);
        enExamples++;
      }
    }

    // Add explanation
    if (!entry.explanation) {
      // Try from DE translation explanation (already in Norwegian for de-en)
      const deLinks = enDeLinks.get(enId) || [];
      let foundExplanation = null;
      for (const { sourceId } of deLinks) {
        const trans = deEnTrans.get(sourceId);
        if (trans?.explanation?._description) {
          foundExplanation = trans.explanation._description;
          break;
        }
      }

      if (foundExplanation) {
        entry.explanation = { _description: foundExplanation };
        enExplanations++;
      } else {
        const gen = generateEnExplanation(entry);
        if (gen) {
          entry.explanation = { _description: gen };
          enExplanations++;
        }
      }
    }
  }

  writeFileSync(fp, JSON.stringify({ _metadata, ...entries }, null, 2) + '\n');
}

console.log(`  Examples added: ${enExamples} entries`);
console.log(`  Explanations added: ${enExplanations} entries`);

// ═══════════════════════════════════════════════════════════════════════════
// 5. Enrich NN entries
// ═══════════════════════════════════════════════════════════════════════════

console.log('\n--- Enriching NN entries ---');

// Load nb-to-nn word map for transforming NB sentences
const nnMapPath = join(LEXICON_BASE, 'nn', 'nb-to-nn-map.json');
const nbToNnMap = existsSync(nnMapPath)
  ? JSON.parse(readFileSync(nnMapPath, 'utf8'))
  : {};

// Load NB entries for reference
const nbEntries = new Map();
for (const bankFile of ['nounbank.json', 'verbbank.json', 'adjectivebank.json', 'generalbank.json']) {
  const fp = join(LEXICON_BASE, 'nb', bankFile);
  if (!existsSync(fp)) continue;
  const data = JSON.parse(readFileSync(fp, 'utf8'));
  const { _metadata, ...entries } = data;
  for (const [id, entry] of Object.entries(entries)) {
    nbEntries.set(id, entry);
  }
}

// Build reverse map: nn-id → nb-id
const nnToNbMap = {};
for (const [nbId, nnId] of Object.entries(nbToNnMap)) {
  nnToNbMap[nnId] = nbId;
}

let nnExplanations = 0;

for (const bankFile of ['nounbank.json', 'verbbank.json', 'adjectivebank.json', 'generalbank.json']) {
  const fp = join(LEXICON_BASE, 'nn', bankFile);
  if (!existsSync(fp)) continue;

  const data = JSON.parse(readFileSync(fp, 'utf8'));
  const { _metadata, ...entries } = data;

  for (const [nnId, entry] of Object.entries(entries)) {
    // Add explanation from NN morphology (don't try to transfer NB examples - sentences would be in BM)
    if (!entry.explanation) {
      const gen = generateNnExplanation(entry);
      if (gen) {
        entry.explanation = { _description: gen };
        nnExplanations++;
      }
    }
  }

  writeFileSync(fp, JSON.stringify({ _metadata, ...entries }, null, 2) + '\n');
}

console.log(`  Explanations added: ${nnExplanations} entries`);
console.log(`  (NN examples skipped — NB sentences would be bokmål, not nynorsk)`);

// ═══════════════════════════════════════════════════════════════════════════
// Summary
// ═══════════════════════════════════════════════════════════════════════════

console.log('\n=== Summary ===');
console.log(`  NB: ${nbExamples} examples, ${nbExplanations} explanations`);
console.log(`  EN: ${enExamples} examples, ${enExplanations} explanations`);
console.log(`  NN: ${nnExplanations} explanations`);
