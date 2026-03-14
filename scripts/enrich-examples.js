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
 * Each example includes a `lang` field indicating the translation language,
 * so apps can filter examples by the active language pair.
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

const ENRICHABLE_BANKS = ['nounbank.json', 'verbbank.json', 'adjectivebank.json', 'generalbank.json'];

// ═══════════════════════════════════════════════════════════════════════════
// Data loading helpers
// ═══════════════════════════════════════════════════════════════════════════

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
const nnDeLinks = loadReverseLinks('nn-de');
const nnEsLinks = loadReverseLinks('nn-es');
console.log(`  nb-de: ${nbDeLinks.size}, nb-es: ${nbEsLinks.size}, en-de: ${enDeLinks.size}`);
console.log(`  nn-de: ${nnDeLinks.size}, nn-es: ${nnEsLinks.size}`);

// ═══════════════════════════════════════════════════════════════════════════
// NB → NN sentence approximation
// ═══════════════════════════════════════════════════════════════════════════

const NB_TO_NN_WORDS = {
  'jeg': 'eg', 'ikke': 'ikkje', 'noe': 'noko', 'noen': 'nokon',
  'hva': 'kva', 'hvem': 'kven', 'hvor': 'kvar', 'hvordan': 'korleis',
  'hvorfor': 'kvifor', 'hvis': 'viss', 'mye': 'mykje',
  'også': 'òg', 'bare': 'berre', 'nå': 'no', 'dem': 'dei',
  'de': 'dei', 'deres': 'deira', 'hennes': 'hennar',
  'hjemme': 'heime', 'hjem': 'heim', 'sammen': 'saman',
  'ennå': 'enno', 'annet': 'anna', 'annen': 'annan',
  'etter': 'etter', 'mellom': 'mellom',
};

function approximateNnSentence(nbSentence) {
  // Simple word-level substitution for common BM→NN differences
  return nbSentence.replace(/\b(\w+)\b/g, (match) => {
    const lower = match.toLowerCase();
    const replacement = NB_TO_NN_WORDS[lower];
    if (!replacement) return match;
    // Preserve original capitalization
    if (match[0] === match[0].toUpperCase()) {
      return replacement[0].toUpperCase() + replacement.slice(1);
    }
    return replacement;
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// Explanation generators
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
// Collect examples from translations for a word via its reverse links
// ═══════════════════════════════════════════════════════════════════════════

function collectExamplesFromTranslations(wordId, reverseLinksMap, translationsMap, lang, reverseSentences) {
  const links = reverseLinksMap.get(wordId) || [];
  const examples = [];
  for (const { sourceId } of links) {
    const trans = translationsMap.get(sourceId);
    if (!trans?.examples) continue;
    for (const ex of trans.examples) {
      if (reverseSentences) {
        // Reverse: target-language sentence as "sentence", source-language sentence as "translation"
        examples.push({ sentence: ex.translation, translation: ex.sentence, lang });
      } else {
        examples.push({ sentence: ex.sentence, translation: ex.translation, lang });
      }
    }
  }
  return examples;
}

function dedupeAndLimit(examples, max = 5) {
  const seen = new Set();
  return examples.filter(ex => {
    const key = ex.sentence + '|' + ex.lang;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }).slice(0, max);
}

// ═══════════════════════════════════════════════════════════════════════════
// 1. Enrich NB entries (examples with lang tags + explanations)
// ═══════════════════════════════════════════════════════════════════════════

console.log('\n--- Enriching NB entries ---');
let nbExamplesCount = 0, nbExplanationsCount = 0;

for (const bankFile of ENRICHABLE_BANKS) {
  const fp = join(LEXICON_BASE, 'nb', bankFile);
  if (!existsSync(fp)) continue;
  const data = JSON.parse(readFileSync(fp, 'utf8'));
  const { _metadata, ...entries } = data;

  for (const [nbId, entry] of Object.entries(entries)) {
    // Replace or add examples with lang tags
    const allExamples = [];

    // DE examples (reversed: NB sentence as source, DE as translation)
    allExamples.push(...collectExamplesFromTranslations(nbId, nbDeLinks, deNbTrans, 'de', true));
    // ES examples
    allExamples.push(...collectExamplesFromTranslations(nbId, nbEsLinks, esNbTrans, 'es', true));

    if (allExamples.length > 0) {
      entry.examples = dedupeAndLimit(allExamples, 6);
      nbExamplesCount++;
    }

    // Explanation
    if (!entry.explanation) {
      const deLinks = nbDeLinks.get(nbId) || [];
      let found = null;
      for (const { sourceId } of deLinks) {
        const trans = deNbTrans.get(sourceId);
        if (trans?.explanation?._description) { found = trans.explanation._description; break; }
      }
      if (found) {
        entry.explanation = { _description: found };
        nbExplanationsCount++;
      } else {
        const gen = generateNbExplanation(entry);
        if (gen) { entry.explanation = { _description: gen }; nbExplanationsCount++; }
      }
    }
  }

  writeFileSync(fp, JSON.stringify({ _metadata, ...entries }, null, 2) + '\n');
}
console.log(`  Examples: ${nbExamplesCount} entries`);
console.log(`  Explanations: ${nbExplanationsCount} entries`);

// ═══════════════════════════════════════════════════════════════════════════
// 2. Enrich EN entries (examples + explanations)
// ═══════════════════════════════════════════════════════════════════════════

console.log('\n--- Enriching EN entries ---');
let enExamplesCount = 0, enExplanationsCount = 0;

for (const bankFile of ENRICHABLE_BANKS) {
  const fp = join(LEXICON_BASE, 'en', bankFile);
  if (!existsSync(fp)) continue;
  const data = JSON.parse(readFileSync(fp, 'utf8'));
  const { _metadata, ...entries } = data;

  for (const [enId, entry] of Object.entries(entries)) {
    // EN examples: pair de-en + de-nb examples via shared DE source sentence
    if (!entry.examples || entry.examples.length === 0) {
      const deLinks = enDeLinks.get(enId) || [];
      const examples = [];

      for (const { sourceId } of deLinks) {
        const enTrans = deEnTrans.get(sourceId);
        const nbTrans = deNbTrans.get(sourceId);

        if (enTrans?.examples && nbTrans?.examples) {
          const deToNb = new Map();
          for (const ex of nbTrans.examples) {
            deToNb.set(ex.sentence, ex.translation);
          }
          for (const ex of enTrans.examples) {
            const nbSentence = deToNb.get(ex.sentence);
            if (nbSentence) {
              examples.push({ sentence: ex.translation, translation: nbSentence, lang: 'nb' });
            }
          }
        }
      }

      if (examples.length > 0) {
        entry.examples = dedupeAndLimit(examples, 5);
        enExamplesCount++;
      }
    }

    // Explanation
    if (!entry.explanation) {
      const deLinks = enDeLinks.get(enId) || [];
      let found = null;
      for (const { sourceId } of deLinks) {
        const trans = deEnTrans.get(sourceId);
        if (trans?.explanation?._description) { found = trans.explanation._description; break; }
      }
      if (found) {
        entry.explanation = { _description: found };
        enExplanationsCount++;
      } else {
        const gen = generateEnExplanation(entry);
        if (gen) { entry.explanation = { _description: gen }; enExplanationsCount++; }
      }
    }
  }

  writeFileSync(fp, JSON.stringify({ _metadata, ...entries }, null, 2) + '\n');
}
console.log(`  Examples: ${enExamplesCount} entries`);
console.log(`  Explanations: ${enExplanationsCount} entries`);

// ═══════════════════════════════════════════════════════════════════════════
// 3. Enrich NN entries (examples via nn-de + NB→NN approximation)
// ═══════════════════════════════════════════════════════════════════════════

console.log('\n--- Enriching NN entries ---');
let nnExamplesCount = 0, nnExplanationsCount = 0;

for (const bankFile of ENRICHABLE_BANKS) {
  const fp = join(LEXICON_BASE, 'nn', bankFile);
  if (!existsSync(fp)) continue;
  const data = JSON.parse(readFileSync(fp, 'utf8'));
  const { _metadata, ...entries } = data;

  for (const [nnId, entry] of Object.entries(entries)) {
    // NN examples: use nn-de links → de-nb translations → approximate NB→NN
    if (!entry.examples || entry.examples.length === 0) {
      const allExamples = [];

      // Via DE
      const deLinks = nnDeLinks.get(nnId) || [];
      for (const { sourceId } of deLinks) {
        const trans = deNbTrans.get(sourceId);
        if (!trans?.examples) continue;
        for (const ex of trans.examples) {
          // ex.translation is the NB sentence, ex.sentence is the DE sentence
          const nnSentence = approximateNnSentence(ex.translation);
          allExamples.push({ sentence: nnSentence, translation: ex.sentence, lang: 'de' });
        }
      }

      // Via ES
      const esLinks = nnEsLinks.get(nnId) || [];
      for (const { sourceId } of esLinks) {
        const trans = esNbTrans.get(sourceId);
        if (!trans?.examples) continue;
        for (const ex of trans.examples) {
          const nnSentence = approximateNnSentence(ex.translation);
          allExamples.push({ sentence: nnSentence, translation: ex.sentence, lang: 'es' });
        }
      }

      if (allExamples.length > 0) {
        entry.examples = dedupeAndLimit(allExamples, 6);
        nnExamplesCount++;
      }
    }

    // Explanation
    if (!entry.explanation) {
      const gen = generateNnExplanation(entry);
      if (gen) { entry.explanation = { _description: gen }; nnExplanationsCount++; }
    }
  }

  writeFileSync(fp, JSON.stringify({ _metadata, ...entries }, null, 2) + '\n');
}
console.log(`  Examples: ${nnExamplesCount} entries`);
console.log(`  Explanations: ${nnExplanationsCount} entries`);

// ═══════════════════════════════════════════════════════════════════════════
// Summary
// ═══════════════════════════════════════════════════════════════════════════

console.log('\n=== Summary ===');
console.log(`  NB: ${nbExamplesCount} examples (with lang tags), ${nbExplanationsCount} explanations`);
console.log(`  EN: ${enExamplesCount} examples (EN→NB pairs), ${enExplanationsCount} explanations`);
console.log(`  NN: ${nnExamplesCount} examples (NB→NN approximated), ${nnExplanationsCount} explanations`);
