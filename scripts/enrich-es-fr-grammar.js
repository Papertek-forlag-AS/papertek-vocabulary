/**
 * Comprehensive grammar enrichment for ES and FR:
 *   1. Noun forms (article + singular/plural, definite/indefinite)
 *   2. Adjective comparison (comparative/superlative)
 *   3. Explanations (Norwegian grammar descriptions)
 *   4. Examples (sentence pairs from link data, or generated templates)
 *
 * Usage:
 *   node scripts/enrich-es-fr-grammar.js [--dry-run] [es|fr]
 */

import fs from 'fs';
import path from 'path';

// ========== SPANISH NOUNS ==========

const ES_ARTICLES = {
  m: { def_sg: 'el', def_pl: 'los', indef_sg: 'un', indef_pl: 'unos' },
  f: { def_sg: 'la', def_pl: 'las', indef_sg: 'una', indef_pl: 'unas' },
};

function esNounForms(word, genus, plural) {
  const art = ES_ARTICLES[genus];
  if (!art) return null;
  return {
    ubestemt: { entall: art.indef_sg + ' ' + word, flertall: art.indef_pl + ' ' + plural },
    bestemt: { entall: art.def_sg + ' ' + word, flertall: art.def_pl + ' ' + plural },
  };
}

// ========== FRENCH NOUNS ==========

const FR_ARTICLES = {
  m: { def_sg: 'le', def_pl: 'les', indef_sg: 'un', indef_pl: 'des' },
  f: { def_sg: 'la', def_pl: 'les', indef_sg: 'une', indef_pl: 'des' },
};

function startsWithVowel(word) {
  return /^[aeéèêiîoôuûhœæ]/i.test(word);
}

function frNounForms(word, genus, plural) {
  const art = FR_ARTICLES[genus];
  if (!art) return null;
  const vowel = startsWithVowel(word);
  const defSg = vowel ? "l'" + word : art.def_sg + ' ' + word;
  return {
    ubestemt: { entall: art.indef_sg + ' ' + word, flertall: art.indef_pl + ' ' + plural },
    bestemt: { entall: defSg, flertall: art.def_pl + ' ' + plural },
  };
}

// ========== ADJECTIVE COMPARISON ==========

// Spanish irregular comparatives
const ES_IRREGULAR_COMP = {
  bueno: { komparativ: 'mejor', superlativ: 'el/la mejor' },
  malo: { komparativ: 'peor', superlativ: 'el/la peor' },
  grande: { komparativ: 'mayor', superlativ: 'el/la mayor' },
  pequeno: { komparativ: 'menor', superlativ: 'el/la menor' },
};

function esComparison(word) {
  const normalized = word.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const irr = ES_IRREGULAR_COMP[normalized];
  if (irr) return { positiv: word, komparativ: irr.komparativ, superlativ: irr.superlativ };
  return { positiv: word, komparativ: 'más ' + word, superlativ: 'el/la más ' + word };
}

// French irregular comparatives
const FR_IRREGULAR_COMP = {
  bon: { komparativ: 'meilleur', superlativ: 'le/la meilleur(e)' },
  mauvais: { komparativ: 'pire', superlativ: 'le/la pire' },
  petit: { komparativ: 'moindre', superlativ: 'le/la moindre' },
};

function frComparison(word) {
  const irr = FR_IRREGULAR_COMP[word];
  if (irr) return { positiv: word, komparativ: irr.komparativ, superlativ: irr.superlativ };
  return { positiv: word, komparativ: 'plus ' + word, superlativ: 'le/la plus ' + word };
}

// ========== EXPLANATIONS ==========

const GENUS_NB = { m: 'maskulint', f: 'feminint', n: 'nøytralt' };
const GENUS_ES = { m: 'maskulint (el)', f: 'feminint (la)' };
const GENUS_FR = { m: 'maskulint (le)', f: 'feminint (la)' };

function esNounExplanation(entry) {
  const g = GENUS_ES[entry.genus] || '';
  const pl = entry.plural ? `Flertall: ${entry.plural}.` : '';
  return { _description: `Spansk ${g} substantiv. ${pl}`.trim() };
}

function frNounExplanation(entry) {
  const g = GENUS_FR[entry.genus] || '';
  const pl = entry.plural ? `Flertall: ${entry.plural}.` : '';
  return { _description: `Fransk ${g} substantiv. ${pl}`.trim() };
}

function esVerbExplanation(entry) {
  const vc = entry.verbClass || '';
  const group = vc.startsWith('-') ? `Regelmessig ${vc}-verb.` : vc === 'irregular' ? 'Uregelmessig verb.' : '';
  const pres = entry.conjugations?.presens?.former;
  const forms = pres ? `Presens: ${pres['yo'] || ''} – ${pres['él/ella'] || ''} – ${pres['ellos/ellas'] || ''}` : '';
  const part = entry.conjugations?.perfektum?.participle;
  const perf = part ? `Partisipp: ${part}.` : '';
  return { _description: `${group} ${forms}. ${perf}`.replace(/\s+/g, ' ').trim() };
}

function frVerbExplanation(entry) {
  const vc = entry.verbClass || '';
  const group = vc.startsWith('-') ? `Regelmessig ${vc}-verb.` : vc === 'irregular' ? 'Uregelmessig verb.' : '';
  const pres = entry.conjugations?.presens?.former;
  const forms = pres ? `Presens: ${pres['je'] || ''} – ${pres['il/elle'] || ''} – ${pres['ils/elles'] || ''}` : '';
  const pc = entry.conjugations?.passe_compose;
  const perf = pc ? `Passé composé: ${pc.auxiliary} + ${pc.participle}.` : '';
  return { _description: `${group} ${forms}. ${perf}`.replace(/\s+/g, ' ').trim() };
}

function esAdjExplanation(entry) {
  const comp = entry.comparison;
  if (!comp) return { _description: `Spansk adjektiv: ${entry.word}.` };
  return { _description: `Spansk adjektiv. Komparativ: ${comp.komparativ}. Superlativ: ${comp.superlativ}.` };
}

function frAdjExplanation(entry) {
  const comp = entry.comparison;
  if (!comp) return { _description: `Fransk adjektiv: ${entry.word}.` };
  return { _description: `Fransk adjektiv. Komparativ: ${comp.komparativ}. Superlativ: ${comp.superlativ}.` };
}

function generalExplanation(lang, entry) {
  const langName = lang === 'es' ? 'Spansk' : 'Fransk';
  const typeNames = {
    adv: 'adverb', prep: 'preposisjon', conj: 'konjunksjon', interj: 'interjeksjon',
    pron: 'pronomen', num: 'tallord', art: 'artikkel', phrase: 'frase',
    expr: 'uttrykk', propn: 'egennavn', interr: 'spørreord', contr: 'sammentrekning',
  };
  const typeName = typeNames[entry.type] || entry.type;
  return { _description: `${langName} ${typeName}: ${entry.word}.` };
}

// ========== EXAMPLES from link data ==========

function loadLinkExamples(linkDir) {
  const examples = {}; // wordId → [{source, target}]
  if (!fs.existsSync(linkDir)) return examples;
  for (const f of fs.readdirSync(linkDir).filter(f => f.endsWith('.json'))) {
    const data = JSON.parse(fs.readFileSync(path.join(linkDir, f), 'utf8'));
    for (const [k, v] of Object.entries(data)) {
      if (k === '_metadata') continue;
      if (v.examples?.length > 0) {
        examples[k] = v.examples;
      }
    }
  }
  return examples;
}

// Load NB translations for generating example templates
function loadNbTranslations(linkDir) {
  const translations = {}; // wordId → nbWordId
  if (!fs.existsSync(linkDir)) return translations;
  for (const f of fs.readdirSync(linkDir).filter(f => f.endsWith('.json'))) {
    const data = JSON.parse(fs.readFileSync(path.join(linkDir, f), 'utf8'));
    for (const [k, v] of Object.entries(data)) {
      if (k !== '_metadata' && v.primary) translations[k] = v.primary;
    }
  }
  return translations;
}

function loadNbWords() {
  const words = {};
  const dir = 'vocabulary/lexicon/nb';
  for (const f of fs.readdirSync(dir).filter(f => f.endsWith('bank.json'))) {
    const data = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
    for (const [k, v] of Object.entries(data)) {
      if (k !== '_metadata') words[k] = v.word;
    }
  }
  return words;
}

// ========== MAIN ==========

function processLanguage(lang, dryRun) {
  const lexiconDir = `vocabulary/lexicon/${lang}`;
  const langName = lang === 'es' ? 'Spansk' : 'Fransk';

  // Load link examples and NB data
  const linkExamples = loadLinkExamples(`vocabulary/lexicon/links/${lang}-nb`);
  const nbTranslations = loadNbTranslations(`vocabulary/lexicon/links/${lang}-nb`);
  const nbWords = loadNbWords();

  const stats = {
    nounForms: 0, comparison: 0, explanation: 0, examples: 0,
  };

  const bankFiles = fs.readdirSync(lexiconDir).filter(f => f.endsWith('bank.json'));

  for (const bankFile of bankFiles) {
    const bankPath = path.join(lexiconDir, bankFile);
    const data = JSON.parse(fs.readFileSync(bankPath, 'utf8'));
    let modified = false;

    for (const [wordId, entry] of Object.entries(data)) {
      if (wordId === '_metadata') continue;

      // --- Noun forms ---
      if (entry.type === 'noun' && entry.genus && entry.plural && !entry.forms) {
        const forms = lang === 'es' ? esNounForms(entry.word, entry.genus, entry.plural)
          : frNounForms(entry.word, entry.genus, entry.plural);
        if (forms) {
          entry.forms = forms;
          stats.nounForms++;
          modified = true;
        }
      }

      // --- Adjective comparison ---
      if (entry.type === 'adj' && !entry.comparison) {
        entry.comparison = lang === 'es' ? esComparison(entry.word) : frComparison(entry.word);
        stats.comparison++;
        modified = true;
      }

      // --- Explanation ---
      if (!entry.explanation) {
        if (entry.type === 'noun') {
          entry.explanation = lang === 'es' ? esNounExplanation(entry) : frNounExplanation(entry);
        } else if (entry.type === 'verb' || entry.type === 'verbe') {
          entry.explanation = lang === 'es' ? esVerbExplanation(entry) : frVerbExplanation(entry);
        } else if (entry.type === 'adj') {
          entry.explanation = lang === 'es' ? esAdjExplanation(entry) : frAdjExplanation(entry);
        } else {
          entry.explanation = generalExplanation(lang, entry);
        }
        stats.explanation++;
        modified = true;
      }

      // --- Examples from link data ---
      if (!entry.examples) {
        const linkEx = linkExamples[wordId];
        if (linkEx && linkEx.length > 0) {
          entry.examples = linkEx.map(ex => ({
            sentence: ex.source || ex.target,
            translation: ex.target || ex.source,
            lang: lang,
          }));
          stats.examples++;
          modified = true;
        }
      }
    }

    if (modified && !dryRun) {
      fs.writeFileSync(bankPath, JSON.stringify(data, null, 2) + '\n', 'utf8');
      console.log(`  Updated ${bankFile}`);
    }
  }

  return stats;
}

// --- Entry point ---

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const languages = args.filter(a => !a.startsWith('--'));

if (languages.length === 0) {
  console.log('Usage: node scripts/enrich-es-fr-grammar.js [--dry-run] <es|fr>');
  process.exit(0);
}

if (dryRun) console.log('[DRY RUN]\n');

for (const lang of languages) {
  console.log(`\n=== ${lang.toUpperCase()} ===`);
  const stats = processLanguage(lang, dryRun);
  console.log(`\nResults:`);
  console.log(`  Noun forms: ${stats.nounForms}`);
  console.log(`  Adj comparison: ${stats.comparison}`);
  console.log(`  Explanations: ${stats.explanation}`);
  console.log(`  Examples (from links): ${stats.examples}`);
}
