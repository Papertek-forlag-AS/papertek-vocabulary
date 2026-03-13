/**
 * enrich-nb-lexicon.js
 *
 * Phase 3 of the two-way dictionary: enriches Norwegian Bokmål
 * skeleton entries with grammar data using Norwegian morphology rules.
 *
 * Norwegian is highly regular. This script applies rule-based
 * morphology to generate:
 *   - Nouns: genus inference, plural, 4-form declension (ubestemt/bestemt x entall/flertall)
 *   - Verbs: all tense forms (infinitiv, presens, preteritum, perfektum partisipp, imperativ)
 *   - Adjectives: comparison forms and gender/number/definiteness declension
 *
 * Entries that already have a definite form from translation data use that
 * as a reference to infer genus and validate generated forms.
 *
 * Usage:
 *   node scripts/enrich-nb-lexicon.js
 *
 * Modifies in place:
 *   vocabulary/lexicon/nb/nounbank.json
 *   vocabulary/lexicon/nb/verbbank.json
 *   vocabulary/lexicon/nb/adjectivebank.json
 *   vocabulary/lexicon/nb/manifest.json
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

const NB_BASE = join('vocabulary', 'lexicon', 'nb');

// ═══════════════════════════════════════════════════════════════════════════
// NORWEGIAN NOUN MORPHOLOGY
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Known irregular nouns: word → { genus, plural, forms }
 */
const IRREGULAR_NOUNS = {
  'barn': { genus: 'n', plural: 'barn', bestEntall: 'barnet', bestFlertall: 'barna' },
  'mann': { genus: 'm', plural: 'menn', bestEntall: 'mannen', bestFlertall: 'mennene' },
  'bok': { genus: 'f', plural: 'bøker', bestEntall: 'boka', bestFlertall: 'bøkene' },
  'bror': { genus: 'm', plural: 'brødre', bestEntall: 'broren', bestFlertall: 'brødrene' },
  'søster': { genus: 'f', plural: 'søstre', bestEntall: 'søsteren', bestFlertall: 'søstrene' },
  'mor': { genus: 'f', plural: 'mødre', bestEntall: 'mora', bestFlertall: 'mødrene' },
  'far': { genus: 'm', plural: 'fedre', bestEntall: 'faren', bestFlertall: 'fedrene' },
  'datter': { genus: 'f', plural: 'døtre', bestEntall: 'datteren', bestFlertall: 'døtrene' },
  'øye': { genus: 'n', plural: 'øyne', bestEntall: 'øyet', bestFlertall: 'øynene' },
  'øre': { genus: 'n', plural: 'ører', bestEntall: 'øret', bestFlertall: 'ørene' },
  'tre': { genus: 'n', plural: 'trær', bestEntall: 'treet', bestFlertall: 'trærne' },
  'kne': { genus: 'n', plural: 'knær', bestEntall: 'kneet', bestFlertall: 'knærne' },
  'fot': { genus: 'm', plural: 'føtter', bestEntall: 'foten', bestFlertall: 'føttene' },
  'hånd': { genus: 'f', plural: 'hender', bestEntall: 'hånda', bestFlertall: 'hendene' },
  'natt': { genus: 'f', plural: 'netter', bestEntall: 'natta', bestFlertall: 'nettene' },
  'tann': { genus: 'f', plural: 'tenner', bestEntall: 'tanna', bestFlertall: 'tennene' },
  'ku': { genus: 'f', plural: 'kuer', bestEntall: 'kua', bestFlertall: 'kuene' },
  'mus': { genus: 'f', plural: 'mus', bestEntall: 'musa', bestFlertall: 'musene' },
  'and': { genus: 'f', plural: 'ender', bestEntall: 'anda', bestFlertall: 'endene' },
  'gås': { genus: 'f', plural: 'gjess', bestEntall: 'gåsa', bestFlertall: 'gjessene' },
  'tid': { genus: 'f', plural: 'tider', bestEntall: 'tida', bestFlertall: 'tidene' },
  'sted': { genus: 'n', plural: 'steder', bestEntall: 'stedet', bestFlertall: 'stedene' },
  'vann': { genus: 'n', plural: 'vann', bestEntall: 'vannet', bestFlertall: 'vannene' },
  'land': { genus: 'n', plural: 'land', bestEntall: 'landet', bestFlertall: 'landene' },
  'hus': { genus: 'n', plural: 'hus', bestEntall: 'huset', bestFlertall: 'husene' },
  'år': { genus: 'n', plural: 'år', bestEntall: 'året', bestFlertall: 'årene' },
  'dag': { genus: 'm', plural: 'dager', bestEntall: 'dagen', bestFlertall: 'dagene' },
  'ting': { genus: 'm', plural: 'ting', bestEntall: 'tingen', bestFlertall: 'tingene' },
};

/**
 * Infer genus from a known definite form ending.
 */
function inferGenusFromDefinite(word, definiteForm) {
  if (!definiteForm) return null;
  const def = definiteForm.toLowerCase();

  // Neuter: -et ending (barnet, huset, vannet)
  if (def.endsWith('et')) return 'n';

  // Feminine: -a ending (boka, jenta, kua)
  if (def.endsWith('a')) return 'f';

  // Masculine: -en ending (gutten, stolen, mannen)
  if (def.endsWith('en')) return 'm';

  return null;
}

/**
 * Generate all 4 noun forms using Norwegian morphology rules.
 */
function enrichNoun(word, existingEntry) {
  const w = word.toLowerCase();

  // Check irregulars first
  if (IRREGULAR_NOUNS[w]) {
    const irr = IRREGULAR_NOUNS[w];
    return {
      genus: irr.genus,
      plural: irr.plural,
      forms: {
        ubestemt: { entall: w, flertall: irr.plural },
        bestemt: { entall: irr.bestEntall, flertall: irr.bestFlertall },
      },
    };
  }

  // Try to infer genus from existing definite form
  const existingDefinite = existingEntry?.forms?.bestemt?.entall;
  let genus = inferGenusFromDefinite(w, existingDefinite);

  // If no existing definite, use heuristics
  if (!genus) {
    genus = guessGenus(w);
  }

  // Generate forms based on genus and word ending
  const { plural, bestEntall, bestFlertall } = generateNounForms(w, genus);

  // If we already have a definite form, prefer it over generated
  const finalBestEntall = existingDefinite || bestEntall;

  return {
    genus,
    plural,
    forms: {
      ubestemt: { entall: w, flertall: plural },
      bestemt: { entall: finalBestEntall, flertall: bestFlertall },
    },
  };
}

/**
 * Heuristic genus guessing based on word ending patterns.
 * Norwegian gender assignment is partly systematic, partly lexical.
 */
function guessGenus(word) {
  // Common neuter patterns
  if (word.match(/(skap|verk|stykke|smål|sted|ment|ium|um|eri|eri)$/)) return 'n';
  if (word.match(/^(be|ge)/) && word.length > 4) return 'n'; // Germanic ge-/be- prefixes often neuter

  // Common feminine patterns (less common in bokmål, many are m/f)
  if (word.match(/(ing|ung|het|else|heit|nad|skap)$/) && word.length > 4) return 'f';

  // Common masculine patterns (default for most Norwegian nouns)
  // In Bokmål, masculine is the default/most common gender
  return 'm';
}

/**
 * Generate plural and definite forms based on word ending and genus.
 */
function generateNounForms(word, genus) {
  let plural, bestEntall, bestFlertall;

  if (genus === 'n') {
    // Neuter nouns
    if (word.endsWith('e')) {
      // -e neuter: et eple → eplet, epler, eplene
      plural = word.slice(0, -1) + 'er';
      bestEntall = word + 't';
      bestFlertall = word.slice(0, -1) + 'ene';
    } else if (word.match(/(eri|ment|ium|um)$/)) {
      // Latin/long endings: -er plural
      plural = word + 'er';
      bestEntall = word + 'et';
      bestFlertall = word + 'ene';
    } else {
      // Monosyllabic/short neuter: et hus → huset, hus, husene
      plural = word;
      bestEntall = word + 'et';
      bestFlertall = word + 'ene';
    }
  } else if (genus === 'f') {
    // Feminine nouns
    if (word.endsWith('e')) {
      // -e feminine: ei jente → jenta, jenter, jentene
      plural = word + 'r';
      bestEntall = word.slice(0, -1) + 'a';
      bestFlertall = word + 'ne';
    } else if (word.endsWith('ing') || word.endsWith('ung')) {
      // -ing/-ung feminine: ei øvning → øvninga, øvninger, øvningene
      plural = word + 'er';
      bestEntall = word + 'a';
      bestFlertall = word + 'ene';
    } else if (word.endsWith('het') || word.endsWith('else')) {
      // Abstract feminine: ei mulighet → muligheten, muligheter, mulighetene
      plural = word + 'er';
      bestEntall = word + 'en';
      bestFlertall = word + 'ene';
    } else {
      // Other feminine
      plural = word + 'er';
      bestEntall = word + 'a';
      bestFlertall = word + 'ene';
    }
  } else {
    // Masculine nouns (default)
    if (word.endsWith('e')) {
      // -e masculine: en gutte → gutten, gutter, guttene
      plural = word + 'r';
      bestEntall = word + 'n';
      bestFlertall = word + 'ne';
    } else if (word.endsWith('er')) {
      // -er masculine: en lærer → læreren, lærere, lærerne
      plural = word + 'e';
      bestEntall = word + 'en';
      bestFlertall = word + 'ne';
    } else if (word.endsWith('el')) {
      // -el masculine: en onkel → onkelen, onkler, onklene
      plural = word.slice(0, -2) + 'ler';
      bestEntall = word + 'en';
      bestFlertall = word.slice(0, -2) + 'lene';
    } else {
      // Consonant-ending masculine: en stol → stolen, stoler, stolene
      plural = word + 'er';
      bestEntall = word + 'en';
      bestFlertall = word + 'ene';
    }
  }

  return { plural, bestEntall, bestFlertall };
}

// ═══════════════════════════════════════════════════════════════════════════
// NORWEGIAN VERB MORPHOLOGY
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Known irregular verbs: infinitive → forms
 */
const IRREGULAR_VERBS = {
  'være': { cls: 'uregelmessig', presens: 'er', preteritum: 'var', partisipp: 'vært', imperativ: 'vær', aux: 'har' },
  'ha': { cls: 'uregelmessig', presens: 'har', preteritum: 'hadde', partisipp: 'hatt', imperativ: 'ha', aux: 'har' },
  'bli': { cls: 'sterk', presens: 'blir', preteritum: 'ble', partisipp: 'blitt', imperativ: 'bli', aux: 'er' },
  'gå': { cls: 'sterk', presens: 'går', preteritum: 'gikk', partisipp: 'gått', imperativ: 'gå', aux: 'har' },
  'komme': { cls: 'sterk', presens: 'kommer', preteritum: 'kom', partisipp: 'kommet', imperativ: 'kom', aux: 'har' },
  'ta': { cls: 'sterk', presens: 'tar', preteritum: 'tok', partisipp: 'tatt', imperativ: 'ta', aux: 'har' },
  'gi': { cls: 'sterk', presens: 'gir', preteritum: 'ga', partisipp: 'gitt', imperativ: 'gi', aux: 'har' },
  'si': { cls: 'sterk', presens: 'sier', preteritum: 'sa', partisipp: 'sagt', imperativ: 'si', aux: 'har' },
  'se': { cls: 'sterk', presens: 'ser', preteritum: 'så', partisipp: 'sett', imperativ: 'se', aux: 'har' },
  'gjøre': { cls: 'uregelmessig', presens: 'gjør', preteritum: 'gjorde', partisipp: 'gjort', imperativ: 'gjør', aux: 'har' },
  'vite': { cls: 'uregelmessig', presens: 'vet', preteritum: 'visste', partisipp: 'visst', imperativ: 'vit', aux: 'har' },
  'finne': { cls: 'sterk', presens: 'finner', preteritum: 'fant', partisipp: 'funnet', imperativ: 'finn', aux: 'har' },
  'stå': { cls: 'sterk', presens: 'står', preteritum: 'sto', partisipp: 'stått', imperativ: 'stå', aux: 'har' },
  'ligge': { cls: 'sterk', presens: 'ligger', preteritum: 'lå', partisipp: 'ligget', imperativ: 'ligg', aux: 'har' },
  'sitte': { cls: 'sterk', presens: 'sitter', preteritum: 'satt', partisipp: 'sittet', imperativ: 'sitt', aux: 'har' },
  'dra': { cls: 'sterk', presens: 'drar', preteritum: 'dro', partisipp: 'dratt', imperativ: 'dra', aux: 'har' },
  'drikke': { cls: 'sterk', presens: 'drikker', preteritum: 'drakk', partisipp: 'drukket', imperativ: 'drikk', aux: 'har' },
  'skrive': { cls: 'sterk', presens: 'skriver', preteritum: 'skrev', partisipp: 'skrevet', imperativ: 'skriv', aux: 'har' },
  'lese': { cls: 'sterk', presens: 'leser', preteritum: 'leste', partisipp: 'lest', imperativ: 'les', aux: 'har' },
  'forstå': { cls: 'sterk', presens: 'forstår', preteritum: 'forsto', partisipp: 'forstått', imperativ: 'forstå', aux: 'har' },
  'spise': { cls: 'sterk', presens: 'spiser', preteritum: 'spiste', partisipp: 'spist', imperativ: 'spis', aux: 'har' },
  'sove': { cls: 'sterk', presens: 'sover', preteritum: 'sov', partisipp: 'sovet', imperativ: 'sov', aux: 'har' },
  'løpe': { cls: 'sterk', presens: 'løper', preteritum: 'løp', partisipp: 'løpt', imperativ: 'løp', aux: 'har' },
  'synge': { cls: 'sterk', presens: 'synger', preteritum: 'sang', partisipp: 'sunget', imperativ: 'syng', aux: 'har' },
  'bære': { cls: 'sterk', presens: 'bærer', preteritum: 'bar', partisipp: 'båret', imperativ: 'bær', aux: 'har' },
  'falle': { cls: 'sterk', presens: 'faller', preteritum: 'falt', partisipp: 'falt', imperativ: 'fall', aux: 'har' },
  'holde': { cls: 'sterk', presens: 'holder', preteritum: 'holdt', partisipp: 'holdt', imperativ: 'hold', aux: 'har' },
  'legge': { cls: 'uregelmessig', presens: 'legger', preteritum: 'la', partisipp: 'lagt', imperativ: 'legg', aux: 'har' },
  'sette': { cls: 'uregelmessig', presens: 'setter', preteritum: 'satte', partisipp: 'satt', imperativ: 'sett', aux: 'har' },
  'selge': { cls: 'uregelmessig', presens: 'selger', preteritum: 'solgte', partisipp: 'solgt', imperativ: 'selg', aux: 'har' },
  'fortelle': { cls: 'uregelmessig', presens: 'forteller', preteritum: 'fortalte', partisipp: 'fortalt', imperativ: 'fortell', aux: 'har' },
  'vokse': { cls: 'uregelmessig', presens: 'vokser', preteritum: 'vokste', partisipp: 'vokst', imperativ: 'voks', aux: 'har' },
  'le': { cls: 'sterk', presens: 'ler', preteritum: 'lo', partisipp: 'ledd', imperativ: 'le', aux: 'har' },
  'fly': { cls: 'sterk', presens: 'flyr', preteritum: 'fløy', partisipp: 'fløyet', imperativ: 'fly', aux: 'har' },
  'hjelpe': { cls: 'sterk', presens: 'hjelper', preteritum: 'hjalp', partisipp: 'hjulpet', imperativ: 'hjelp', aux: 'har' },
  'bryte': { cls: 'sterk', presens: 'bryter', preteritum: 'brøt', partisipp: 'brutt', imperativ: 'bryt', aux: 'har' },
  'binde': { cls: 'sterk', presens: 'binder', preteritum: 'bandt', partisipp: 'bundet', imperativ: 'bind', aux: 'har' },
  'treffe': { cls: 'sterk', presens: 'treffer', preteritum: 'traff', partisipp: 'truffet', imperativ: 'treff', aux: 'har' },
  'slippe': { cls: 'sterk', presens: 'slipper', preteritum: 'slapp', partisipp: 'sluppet', imperativ: 'slipp', aux: 'har' },
  'trekke': { cls: 'sterk', presens: 'trekker', preteritum: 'trakk', partisipp: 'trukket', imperativ: 'trekk', aux: 'har' },
  'hete': { cls: 'uregelmessig', presens: 'heter', preteritum: 'het', partisipp: 'hett', imperativ: 'het', aux: 'har' },
  'synes': { cls: 'uregelmessig', presens: 'synes', preteritum: 'syntes', partisipp: 'syntes', imperativ: '-', aux: 'har' },
  'kunne': { cls: 'uregelmessig', presens: 'kan', preteritum: 'kunne', partisipp: 'kunnet', imperativ: '-', aux: 'har' },
  'ville': { cls: 'uregelmessig', presens: 'vil', preteritum: 'ville', partisipp: 'villet', imperativ: '-', aux: 'har' },
  'skulle': { cls: 'uregelmessig', presens: 'skal', preteritum: 'skulle', partisipp: 'skullet', imperativ: '-', aux: 'har' },
  'måtte': { cls: 'uregelmessig', presens: 'må', preteritum: 'måtte', partisipp: 'måttet', imperativ: '-', aux: 'har' },
  'burde': { cls: 'uregelmessig', presens: 'bør', preteritum: 'burde', partisipp: 'burdet', imperativ: '-', aux: 'har' },
  'tørre': { cls: 'uregelmessig', presens: 'tør', preteritum: 'torde', partisipp: 'tort', imperativ: '-', aux: 'har' },
};

/**
 * Generate verb conjugation forms.
 * Norwegian verbs don't conjugate by person — one form per tense.
 */
function enrichVerb(word) {
  const w = word.toLowerCase();

  // Check irregulars
  if (IRREGULAR_VERBS[w]) {
    const irr = IRREGULAR_VERBS[w];
    return {
      verbClass: irr.cls,
      auxiliary: irr.aux,
      conjugations: {
        presens: {
          former: {
            infinitiv: `å ${w}`,
            presens: irr.presens,
            preteritum: irr.preteritum,
            perfektum_partisipp: irr.partisipp,
            imperativ: irr.imperativ,
          },
          auxiliary: irr.aux,
          feature: 'grammar_nb_presens',
        },
      },
    };
  }

  // Regular verb rules
  let presens, preteritum, partisipp, imperativ, verbClass, aux;
  aux = 'har'; // Default auxiliary

  if (w.endsWith('ere')) {
    // -ere verbs (Latin origin): akseptere → aksepterer, aksepterte, akseptert
    verbClass = 'svak';
    presens = w + 'r';
    preteritum = w.slice(0, -1) + 'te';
    partisipp = w.slice(0, -1) + 't';
    imperativ = w + 'r'; // often same as presens for -ere verbs
  } else if (w.endsWith('e')) {
    // Regular -e verbs: two sub-patterns
    const stem = w.slice(0, -1);

    // Check if stem ends in double consonant or certain patterns → -et past
    if (stem.match(/(kk|pp|tt|ss|ll|nn|mm|ng|nk|sk|rk|lp|mp|nt|nd|ft|kt|pt|st|gn)$/)) {
      // Type 1 weak: snakke → snakker, snakket, snakket
      verbClass = 'svak';
      presens = w + 'r';
      preteritum = w + 't';
      partisipp = w + 't';
      imperativ = stem;
    } else {
      // Type 2 weak: lære → lærer, lærte, lært
      verbClass = 'svak';
      presens = w + 'r';
      preteritum = stem + 'te';
      partisipp = stem + 't';
      imperativ = stem;
    }
  } else {
    // Monosyllabic or non -e verbs: bo → bor, bodde, bodd
    verbClass = 'svak';
    presens = w + 'r';
    preteritum = w + 'dde';
    partisipp = w + 'dd';
    imperativ = w;
  }

  return {
    verbClass,
    auxiliary: aux,
    conjugations: {
      presens: {
        former: {
          infinitiv: `å ${w}`,
          presens,
          preteritum,
          perfektum_partisipp: partisipp,
          imperativ,
        },
        auxiliary: aux,
        feature: 'grammar_nb_presens',
      },
    },
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// NORWEGIAN ADJECTIVE MORPHOLOGY
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Known irregular adjective comparisons.
 */
const IRREGULAR_ADJECTIVES = {
  'god': { komparativ: 'bedre', superlativ: 'best' },
  'stor': { komparativ: 'større', superlativ: 'størst' },
  'liten': { komparativ: 'mindre', superlativ: 'minst' },
  'ung': { komparativ: 'yngre', superlativ: 'yngst' },
  'gammel': { komparativ: 'eldre', superlativ: 'eldst' },
  'lang': { komparativ: 'lengre', superlativ: 'lengst' },
  'tung': { komparativ: 'tyngre', superlativ: 'tyngst' },
  'mange': { komparativ: 'flere', superlativ: 'flest' },
  'mye': { komparativ: 'mer', superlativ: 'mest' },
  'dårlig': { komparativ: 'verre', superlativ: 'verst' },
  'få': { komparativ: 'færre', superlativ: 'færrest' },
  'nær': { komparativ: 'nærmere', superlativ: 'nærmest' },
};

/**
 * Generate adjective declension and comparison forms.
 */
function enrichAdjective(word) {
  const w = word.toLowerCase();

  // Comparison forms
  let komparativ, superlativ;
  if (IRREGULAR_ADJECTIVES[w]) {
    komparativ = IRREGULAR_ADJECTIVES[w].komparativ;
    superlativ = IRREGULAR_ADJECTIVES[w].superlativ;
  } else if (w.endsWith('ig') || w.endsWith('lig') || w.endsWith('som') || w.length > 7) {
    // Long adjectives use "mer/mest"
    komparativ = `mer ${w}`;
    superlativ = `mest ${w}`;
  } else if (w.endsWith('e')) {
    // -e adjectives: -ere, -est
    komparativ = w + 're';
    superlativ = w.slice(0, -1) + 'st';
  } else {
    // Regular: -ere, -est
    komparativ = w + 'ere';
    superlativ = w + 'est';
  }

  // Declension: gender/number/definiteness
  let noytrum, flertall, bestemt;

  if (w.endsWith('e')) {
    // Already ends in -e: same form everywhere
    noytrum = w;
    flertall = w;
    bestemt = w;
  } else if (w.endsWith('ig')) {
    noytrum = w + 't';
    flertall = w + 'e';
    bestemt = w + 'e';
  } else if (w.endsWith('sk')) {
    // -sk adjectives: neuter same as base, plural adds -e
    noytrum = w;
    flertall = w + 'e';
    bestemt = w + 'e';
  } else if (w.endsWith('t')) {
    // Already ends in -t
    noytrum = w;
    flertall = w + 'e';
    bestemt = w + 'e';
  } else if (w.match(/(dd|tt|nn|mm|ll|ss|kk|pp)$/)) {
    // Double consonant: neuter adds -t (drops one consonant for some)
    noytrum = w + '';
    flertall = w + 'e';
    bestemt = w + 'e';
  } else {
    // Regular: -t for neuter, -e for plural/definite
    noytrum = w + 't';
    flertall = w + 'e';
    bestemt = w + 'e';
  }

  return {
    comparison: {
      positiv: w,
      komparativ,
      superlativ,
    },
    declension: {
      positiv: {
        maskulin: w,
        feminin: w,
        noytrum,
        flertall,
        bestemt,
      },
      komparativ: {
        alle: komparativ,
      },
      superlativ: {
        ubestemt: superlativ,
        bestemt: superlativ + 'e',
      },
    },
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════════════════════

console.log('Enriching Norwegian Bokmål lexicon with grammar data...\n');

let nounEnriched = 0, verbEnriched = 0, adjEnriched = 0;
let nounSkipped = 0, verbSkipped = 0, adjSkipped = 0;

// ─── Enrich nouns ─────────────────────────────────────────────────────────

const nounPath = join(NB_BASE, 'nounbank.json');
const nounData = JSON.parse(readFileSync(nounPath, 'utf8'));
const { _metadata: nounMeta, ...nouns } = nounData;

for (const [id, entry] of Object.entries(nouns)) {
  // Skip multi-word expressions and very short IDs
  if (entry.word.includes(' ') && entry.word.split(' ').length > 2) {
    nounSkipped++;
    continue;
  }

  try {
    const enrichment = enrichNoun(entry.word, entry);
    entry.genus = enrichment.genus;
    entry.plural = enrichment.plural;
    entry.forms = enrichment.forms;
    entry._enriched = true;
    nounEnriched++;
  } catch (e) {
    nounSkipped++;
  }
}

nounMeta.enrichedEntries = nounEnriched;
nounMeta.skeletonEntries = nounMeta.totalEntries - nounEnriched;
writeFileSync(nounPath, JSON.stringify({ _metadata: nounMeta, ...nouns }, null, 2) + '\n');
console.log(`  Nouns: ${nounEnriched} enriched, ${nounSkipped} skipped`);

// ─── Enrich verbs ─────────────────────────────────────────────────────────

const verbPath = join(NB_BASE, 'verbbank.json');
const verbData = JSON.parse(readFileSync(verbPath, 'utf8'));
const { _metadata: verbMeta, ...verbs } = verbData;

for (const [id, entry] of Object.entries(verbs)) {
  const baseWord = entry.word;

  // Skip multi-word verb phrases
  if (baseWord.includes(' ') && baseWord.split(' ').length > 2) {
    verbSkipped++;
    continue;
  }

  try {
    const enrichment = enrichVerb(baseWord);
    entry.verbClass = enrichment.verbClass;
    entry.auxiliary = enrichment.auxiliary;
    entry.conjugations = enrichment.conjugations;
    entry._enriched = true;
    verbEnriched++;
  } catch (e) {
    verbSkipped++;
  }
}

verbMeta.enrichedEntries = verbEnriched;
verbMeta.skeletonEntries = verbMeta.totalEntries - verbEnriched;
writeFileSync(verbPath, JSON.stringify({ _metadata: verbMeta, ...verbs }, null, 2) + '\n');
console.log(`  Verbs: ${verbEnriched} enriched, ${verbSkipped} skipped`);

// ─── Enrich adjectives ────────────────────────────────────────────────────

const adjPath = join(NB_BASE, 'adjectivebank.json');
const adjData = JSON.parse(readFileSync(adjPath, 'utf8'));
const { _metadata: adjMeta, ...adjs } = adjData;

for (const [id, entry] of Object.entries(adjs)) {
  // Skip multi-word expressions
  if (entry.word.includes(' ') && entry.word.split(' ').length > 2) {
    adjSkipped++;
    continue;
  }

  try {
    const enrichment = enrichAdjective(entry.word);
    entry.comparison = enrichment.comparison;
    entry.declension = enrichment.declension;
    entry._enriched = true;
    adjEnriched++;
  } catch (e) {
    adjSkipped++;
  }
}

adjMeta.enrichedEntries = adjEnriched;
adjMeta.skeletonEntries = adjMeta.totalEntries - adjEnriched;
writeFileSync(adjPath, JSON.stringify({ _metadata: adjMeta, ...adjs }, null, 2) + '\n');
console.log(`  Adjectives: ${adjEnriched} enriched, ${adjSkipped} skipped`);

// ─── Update manifest ──────────────────────────────────────────────────────

const manifestPath = join(NB_BASE, 'manifest.json');
const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
const totalEnriched = nounEnriched + verbEnriched + adjEnriched;
manifest.summary.enrichedWords = totalEnriched;
manifest.summary.skeletonWords = manifest.summary.totalWords - totalEnriched;
manifest._metadata.description = 'Norwegian Bokmål lexicon — Phase 3 grammar enrichment';
manifest._metadata.generatedAt = new Date().toISOString();
writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n');

// ─── Summary ──────────────────────────────────────────────────────────────

console.log('\n=== Summary ===');
console.log(`  Total enriched: ${totalEnriched} / ${manifest.summary.totalWords}`);
console.log(`  Nouns:      ${nounEnriched} enriched (${nounSkipped} skipped)`);
console.log(`  Verbs:      ${verbEnriched} enriched (${verbSkipped} skipped)`);
console.log(`  Adjectives: ${adjEnriched} enriched (${adjSkipped} skipped)`);
console.log(`  Remaining skeleton: ${manifest.summary.skeletonWords} (generalbank + skipped)`);
