/**
 * generate-nn-lexicon.js
 *
 * Phase 8 of the two-way dictionary: generates Norwegian Nynorsk (NN)
 * lexicon entries by transforming the existing Bokmål (NB) lexicon.
 *
 * Since there are no de-nn/es-nn translation files, the NN lexicon is
 * derived from NB using systematic linguistic transformation rules:
 *   - Lexical replacements (completely different words: noe→noko, ikke→ikkje)
 *   - Spelling rules (hv-→kv-, -lig→-leg, etc.)
 *   - Noun morphology (NN-specific declension: -ar/-ane plurals, -a neuter def pl)
 *   - Verb morphology (a-infinitive for weak verbs, -ar present tense)
 *   - Adjective morphology (similar to NB with minor differences)
 *
 * Produces a mapping file (nb-to-nn-map.json) for link generation.
 *
 * Usage:
 *   node scripts/generate-nn-lexicon.js
 *
 * Output:
 *   vocabulary/lexicon/nn/nounbank.json
 *   vocabulary/lexicon/nn/verbbank.json
 *   vocabulary/lexicon/nn/adjectivebank.json
 *   vocabulary/lexicon/nn/generalbank.json
 *   vocabulary/lexicon/nn/manifest.json
 *   vocabulary/lexicon/nn/nb-to-nn-map.json  (for link generation)
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

const LEXICON_BASE = join('vocabulary', 'lexicon');
const NB_BASE = join(LEXICON_BASE, 'nb');
const NN_BASE = join(LEXICON_BASE, 'nn');

// ═══════════════════════════════════════════════════════════════════════════
// LEXICAL REPLACEMENTS — words that are completely different in NN
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Map of NB words → NN equivalents.
 * These are words where a systematic rule won't produce the right NN form.
 */
const LEXICAL_REPLACEMENTS = {
  // Pronouns & determiners
  'jeg': 'eg',
  'noe': 'noko',
  'noen': 'nokon',
  'annet': 'anna',
  'annen': 'annan',
  'andre': 'andre',
  'en': 'ein',
  'et': 'eit',
  'hennes': 'hennar',
  'deres': 'deira',
  'dem': 'dei',
  'de': 'dei',
  'hverandre': 'kvarandre',
  'seg': 'seg',

  // Question words — must be lexical, NOT hv→kv regex
  'hva': 'kva',
  'hvem': 'kven',
  'hvor': 'kvar',
  'hvordan': 'korleis',
  'hvorfor': 'kvifor',
  'hvilken': 'kva for ein',
  'hvilket': 'kva for eit',
  'hvilke': 'kva for',
  'hvis': 'viss',
  'hver': 'kvar',
  'hvert': 'kvart',

  // Adverbs
  'ikke': 'ikkje',
  'også': 'òg',
  'bare': 'berre',
  'mye': 'mykje',
  'nå': 'no',
  'allerede': 'allereie',
  'igjen': 'att',
  'fremdeles': 'framleis',
  'hjemme': 'heime',
  'hjemmefra': 'heimanfrå',
  'hjem': 'heim',
  'veldig': 'veldig',
  'alltid': 'alltid',
  'aldri': 'aldri',
  'ennå': 'enno',
  'kanskje': 'kanskje',
  'ganske': 'ganske',
  'plutselig': 'brått',
  'sammen': 'saman',
  'borte': 'borte',
  'enda': 'endå',
  'dessuten': 'dessutan',
  'iallfall': 'i alle fall',
  'selvfølgelig': 'sjølvsagt',
  'deretter': 'deretter',
  'nedenfor': 'nedanfor',
  'ovenfor': 'ovanfor',
  'utenfor': 'utanfor',
  'innenfor': 'innanfor',
  'frem': 'fram',
  'fremover': 'framover',
  'noensinne': 'nokosinne',
  'langsommere': 'saktare',

  // Prepositions
  'etter': 'etter',
  'mellom': 'mellom',
  'gjennom': 'gjennom',
  'fra': 'frå',
  'uten': 'utan',

  // Conjunctions
  'eller': 'eller',
  'men': 'men',
  'fordi': 'fordi',

  // Articles/determiners
  'egen': 'eigen',
  'eget': 'eige',
  'egne': 'eigne',

  // Common nouns with different NN forms
  'uke': 'veke',
  'språk': 'språk',
  'øvelse': 'øving',
  'størrelse': 'storleik',
  'forskjell': 'skilnad',
  'mulighet': 'moglegheit',
  'virkelighet': 'røyndom',
  'virkelig': 'verkeleg',
  'umulig': 'umogleg',
  'nødvendig': 'naudsynt',
  'selvfølge': 'sjølvsagt',
  'øyeblikk': 'augeblink',
  'søster': 'syster',
  'bror': 'bror',
  'selv': 'sjølv',
  'menneske': 'menneske',
  'sykkel': 'sykkel',
  'kirke': 'kyrkje',
  'rekke': 'rekkje',
  'elv': 'elv',
  'bygd': 'bygd',
  'gutt': 'gut',
  'datter': 'dotter',
  'navn': 'namn',
  'fornavn': 'fornamn',
  'etternavn': 'etternamn',
  'sted': 'stad',
  'bosted': 'bustad',
  'fødested': 'fødestad',
  'verksted': 'verkstad',
  'skole': 'skule',
  'barneskole': 'barneskule',
  'ungdomsskole': 'ungdomsskule',
  'vann': 'vatn',
  'øye': 'auge',
  'hånd': 'hand',
  'penger': 'pengar',
  'syk': 'sjuk',
  'sykdom': 'sjukdom',
  'sykehus': 'sjukehus',
  'sykepleier': 'sjukepleiar',
  'grønnsak': 'grønsak',
  'grønnsaker': 'grønsaker',
  'oppgave': 'oppgåve',
  'unnskyld': 'orsak',
  'venner': 'vener',
  'sulten': 'svolten',
  'morsom': 'morosam',

  // -else → NN forms (common ones)
  'begynnelse': 'byrjing',
  'fornøyelse': 'fornøying',
  'følelse': 'kjensle',
  'forberedelse': 'førebuing',
  'forbindelse': 'samband',
  'overraskelse': 'overrasking',
  'opplevelse': 'oppleving',
  'undersøkelse': 'undersøking',
  'oversettelse': 'omsetjing',
  'tillatelse': 'løyve',
  'bevegelse': 'rørsle',
  'hendelse': 'hending',
  'forkjølelse': 'forkjøling',
  'forsinkelse': 'forseinking',
  'fortsettelse': 'framhald',
  'beskrivelse': 'skildring',
  'avgjørelse': 'avgjerd',
  'oppsigelse': 'oppseiing',

  // Conjugated forms in phrases
  'bor': 'bur',
  'kommer': 'kjem',
  'heter': 'heiter',
  'finnes': 'finst',
  'virker': 'verkar',
  'beklager': 'beklagar',
  'vær': 'ver',

  // Common verbs with different NN forms
  'synge': 'syngja',
  'bruke': 'bruka',
  'like': 'lika',
  'trenge': 'trenga',
  'spørre': 'spørja',
  'bety': 'tyda',
  'synes': 'synast',

  // Common adjectives with different NN forms
  'liten': 'liten',
  'stor': 'stor',
  'gammel': 'gamal',
  'høy': 'høg',
  'alene': 'åleine',
  'annerledes': 'annleis',
  'kun': 'berre',

  // selv- → sjølv-
  'selv': 'sjølv',
  'selvstendig': 'sjølvstendig',
};

// ═══════════════════════════════════════════════════════════════════════════
// SYSTEMATIC SPELLING RULES — NB → NN transformations
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Apply systematic NB→NN spelling transformations to a word.
 * Returns the NN spelling, or the original if no rule applies.
 */
function applySpellingRules(word) {
  let w = word;

  // 1. hv- → kv- at word start for adjectives/nouns only (hvit→kvit, hvass→kvass)
  //    NOT for question words — those are handled by LEXICAL_REPLACEMENTS
  //    (hvor→kvar not kvor, hvis→viss not kvis, hvem→kven not kvem)
  const HV_LEXICAL = ['hva','hvem','hvor','hvordan','hvorfor','hvilken','hvilket','hvilke','hvis','hver','hvert'];
  if (w.match(/^hv/) && !HV_LEXICAL.includes(w)) {
    w = w.replace(/^hv/, 'kv');
  }

  // 2. -lig → -leg (vanlig→vanleg, farlig→farleg, tydelig→tydeleg)
  if (w.endsWith('lig') && w.length > 4) {
    w = w.slice(0, -3) + 'leg';
  }

  // 3. -ighet → -igheit (mulighet→moglegheit handled by lexical)
  //    -het → -heit for some words
  //    Actually, -het stays as -heit only in some NN words, not systematic
  //    Skip this — handle via lexical replacements

  // 4. Some -else → -ing patterns exist but are word-specific
  //    Skip — handle via lexical replacements

  return w;
}

/**
 * Transform a single NB word to its NN equivalent.
 * Checks lexical replacements first, then applies spelling rules.
 */
function nbToNnWord(word) {
  const lower = word.toLowerCase();

  // Check lexical replacements first (exact match)
  if (LEXICAL_REPLACEMENTS[lower]) {
    return LEXICAL_REPLACEMENTS[lower];
  }

  // Strip trailing punctuation and check again (handles "hvor?" → "kvar?")
  const punctMatch = lower.match(/^(.+?)([?!.,;:]+)$/);
  if (punctMatch) {
    const [, base, punct] = punctMatch;
    if (LEXICAL_REPLACEMENTS[base]) {
      return LEXICAL_REPLACEMENTS[base] + punct;
    }
    return applySpellingRules(base) + punct;
  }

  // Apply systematic spelling rules
  return applySpellingRules(lower);
}

/**
 * Transform a multi-word NB phrase to NN by transforming each word individually.
 * This catches BM words embedded in phrases (e.g., "heller ikke" → "heller ikkje").
 */
function nbToNnPhrase(phrase) {
  // First check if the entire phrase has a lexical replacement
  const lower = phrase.toLowerCase();
  if (LEXICAL_REPLACEMENTS[lower]) {
    return LEXICAL_REPLACEMENTS[lower];
  }

  // Transform each word individually
  const words = lower.split(/(\s+|,\s*)/); // split preserving separators
  const transformed = words.map(part => {
    if (part.match(/^[\s,]+$/)) return part; // preserve whitespace/punctuation
    return nbToNnWord(part);
  });
  return transformed.join('');
}

// ═══════════════════════════════════════════════════════════════════════════
// GENUS OVERRIDES — corrections for nouns where heuristic guessing is wrong
// These take priority over both NB-inherited genus and NN heuristic guessing.
// ═══════════════════════════════════════════════════════════════════════════

const GENUS_OVERRIDES = {
  // --- Neuter nouns wrongly assigned masculine ---
  'aldershjem': 'n', 'alfabet': 'n', 'alternativ': 'n', 'andrespråk': 'n',
  'anlegg': 'n', 'ansikt': 'n', 'ansvar': 'n', 'antall': 'n', 'apotek': 'n',
  'apparat': 'n', 'asyl': 'n', 'avfall': 'n', 'avkom': 'n', 'avsnitt': 'n',
  'bad': 'n', 'badekar': 'n', 'baderom': 'n', 'band': 'n', 'bankkort': 'n',
  'bankregistreringsnummer': 'n', 'barnebarn': 'n', 'bein': 'n', 'bibliotek': 'n',
  'bidrag': 'n', 'blad': 'n', 'blikk': 'n', 'blod': 'n', 'bord': 'n',
  'brannvesen': 'n', 'brev': 'n', 'bryllup': 'n', 'bryst': 'n', 'bykart': 'n',
  'bytte': 'n', 'chipkort': 'n', 'dekk': 'n', 'dikt': 'n', 'diplom': 'n',
  'diskotek': 'n', 'dobbeltrom': 'n', 'e-kort': 'n', 'eksempel': 'n',
  'ektepar': 'n', 'embete': 'n', 'enkeltrom': 'n', 'etternavn': 'n',
  'eventyr': 'n', 'fag': 'n', 'felt': 'n', 'fengsel': 'n', 'fjernsyn': 'n',
  'flertall': 'n', 'forbud': 'n', 'forbruk': 'n', 'foredrag': 'n', 'forlag': 'n',
  'formål': 'n', 'fornavn': 'n', 'forhold': 'n', 'forsikringskort': 'n',
  'forsøk': 'n', 'fortau': 'n', 'fremmedspråk': 'n', 'fremskritt': 'n',
  'frimerke': 'n', 'fødselsår': 'n', 'førerkort': 'n', 'gjennomsnitt': 'n',
  'gjensyn': 'n', 'glass': 'n', 'gull': 'n', 'gulv': 'n', 'halskjede': 'n',
  'hav': 'n', 'hittegods': 'n', 'hjemland': 'n', 'hjerte': 'n', 'hjul': 'n',
  'hull': 'n', 'håp': 'n', 'innbrudd': 'n', 'innendørsbasseng': 'n',
  'innfall': 'n', 'innhold': 'n', 'innkjøp': 'n', 'innskudd': 'n',
  'inntrykk': 'n', 'institutt': 'n', 'jobbintervju': 'n', 'kaffehus': 'n',
  'kapittel': 'n', 'kjennetegn': 'n', 'kjøkken': 'n', 'kjønn': 'n', 'kjøp': 'n',
  'kjøpesenter': 'n', 'kjøretøy': 'n', 'klasserom': 'n', 'klima': 'n',
  'klimaanlegg': 'n', 'kort': 'n', 'krav': 'n', 'kredittkort': 'n',
  'krydder': 'n', 'kyss': 'n', 'lag': 'n', 'leketøy': 'n', 'leksikon': 'n',
  'loppemarked': 'n', 'lys': 'n', 'marked': 'n', 'materiale': 'n', 'middel': 'n',
  'miljø': 'n', 'mineralvann': 'n', 'minne': 'n', 'minnesmerke': 'n',
  'mobilsvar': 'n', 'motorkjøretøy': 'n', 'mottak': 'n', 'mål': 'n',
  'måltid': 'n', 'møte': 'n', 'naturfag': 'n', 'nettbrett': 'n', 'nummer': 'n',
  'nødanrop': 'n', 'nødstilfelle': 'n', 'næringsmiddel': 'n', 'offer': 'n',
  'oppdrag': 'n', 'opphold': 'n', 'opptak': 'n', 'ord': 'n', 'område': 'n',
  'par': 'n', 'passord': 'n', 'politi': 'n', 'postbud': 'n', 'postkort': 'n',
  'postnummer': 'n', 'produkt': 'n', 'program': 'n', 'punkt': 'n',
  'resultat': 'n', 'retningsnummer': 'n', 'rusmiddel': 'n', 'råd': 'n',
  'rådhus': 'n', 'salt': 'n', 'samarbeid': 'n', 'samfunn': 'n', 'semester': 'n',
  'senter': 'n', 'sertifikat': 'n', 'sjukehus': 'n', 'sykehus': 'n', 'skip': 'n',
  'skjema': 'n', 'slott': 'n', 'smør': 'n', 'smørbrød': 'n', 'soverom': 'n',
  'spor': 'n', 'standpunkt': 'n', 'stearinlys': 'n', 'steg': 'n', 'stipend': 'n',
  'stoff': 'n', 'svar': 'n', 'symbol': 'n', 'system': 'n', 'sår': 'n', 'tak': 'n',
  'tall': 'n', 'tegn': 'n', 'telefonnummer': 'n', 'telt': 'n', 'tema': 'n',
  'tidspunkt': 'n', 'tidsskrift': 'n', 'tilbud': 'n', 'tilfelle': 'n',
  'tillegg': 'n', 'torg': 'n', 'trafikklys': 'n', 'trafikkskilt': 'n',
  'transportmiddel': 'n', 'treningssenter': 'n', 'trinn': 'n', 'trommesett': 'n',
  'universitet': 'n', 'unntak': 'n', 'utsagn': 'n', 'utland': 'n',
  'utstillingsvindu': 'n', 'utstyr': 'n', 'uttrykk': 'n', 'utvalg': 'n',
  'valg': 'n', 'varehus': 'n', 'vaskemiddel': 'n', 'veikryss': 'n', 'vindu': 'n',
  'visittkort': 'n', 'vitnemål': 'n', 'værvarsel': 'n', 'yrke': 'n', 'ønske': 'n',
  'navn': 'n',
  // --- Feminine nouns wrongly assigned masculine ---
  'adresse': 'f', 'ambassade': 'f', 'angst': 'f', 'ankomst': 'f', 'annonse': 'f',
  'avreise': 'f', 'avtale': 'f', 'avtalebok': 'f', 'bakke': 'f', 'biologibok': 'f',
  'bluse': 'f', 'bolle': 'f', 'bremse': 'f', 'brosjyre': 'f', 'bølge': 'f',
  'bønne': 'f', 'børste': 'f', 'dame': 'f', 'drikke': 'f', 'dukke': 'f',
  'e-bok': 'f', 'eske': 'f', 'evne': 'f', 'fagkvinne': 'f', 'farge': 'f',
  'ferge': 'f', 'flate': 'f', 'flue': 'f', 'flukt': 'f', 'flyvertinne': 'f',
  'fløyte': 'f', 'fru': 'f', 'frukt': 'f', 'frykt': 'f', 'følelse': 'f',
  'gate': 'f', 'gave': 'f', 'glede': 'f', 'grense': 'f', 'gruppe': 'f',
  'gryte': 'f', 'gåte': 'f', 'havn': 'f', 'heltinne': 'f', 'hemmelighet': 'f',
  'hjemmeside': 'f', 'husleie': 'f', 'husmor': 'f', 'hylle': 'f', 'hytte': 'f',
  'høne': 'f', 'høyde': 'f', 'interesse': 'f', 'jente': 'f', 'jernbane': 'f',
  'jord': 'f', 'kanne': 'f', 'kasse': 'f', 'klasse': 'f', 'klasseprøve': 'f',
  'klokke': 'f', 'kone': 'f', 'konkurranse': 'f', 'kraft': 'f', 'kusine': 'f',
  'kvinne': 'f', 'kåpe': 'f', 'lampe': 'f', 'lengde': 'f', 'lenke': 'f',
  'leppe': 'f', 'linje': 'f', 'liste': 'f', 'lommebok': 'f', 'lue': 'f',
  'luft': 'f', 'lykke': 'f', 'læringsgruppe': 'f', 'løve': 'f', 'mappe': 'f',
  'matte': 'f', 'mattelekse': 'f', 'matteoppgave': 'f', 'mengde': 'f',
  'messe': 'f', 'morgenrutine': 'f', 'musikkundervisning': 'f', 'nettside': 'f',
  'niese': 'f', 'notatbok': 'f', 'olje': 'f', 'oppgave': 'f', 'ordbok': 'f',
  'pakke': 'f', 'personlighet': 'f', 'pille': 'f', 'plante': 'f', 'plikt': 'f',
  'plomme': 'f', 'politikvinne': 'f', 'pose': 'f', 'prøve': 'f', 'pute': 'f',
  'pære': 'f', 'pølse': 'f', 'reise': 'f', 'rekkefølge': 'f', 'ringeklokke': 'f',
  'rolle': 'f', 'rose': 'f', 'runde': 'f', 'salve': 'f', 'samtale': 'f',
  'sannhet': 'f', 'scene': 'f', 'side': 'f', 'sjanse': 'f', 'skade': 'f',
  'skilpadde': 'f', 'skilsmisse': 'f', 'skinke': 'f', 'skive': 'f', 'skje': 'f',
  'skrivebok': 'f', 'slange': 'f', 'smerte': 'f', 'sprøyte': 'f', 'stemme': 'f',
  'stjerne': 'f', 'strømpe': 'f', 'suppe': 'f', 'såpe': 'f', 'søppelbøtte': 'f',
  'tale': 'f', 'tante': 'f', 'tavle': 'f', 'tunge': 'f', 'turnering': 'f',
  'tåre': 'f', 'ulempe': 'f', 'ulykke': 'f', 'undervisning': 'f', 'vane': 'f',
  'vekkerklokke': 'f', 'venninne': 'f', 'vertinne': 'f', 'veske': 'f',
  'væske': 'f', 'øy': 'f', 'elv': 'f', 'bestemor': 'f',
  // --- Wrongly assigned neuter, should be masculine/feminine ---
  'beboer': 'm', 'bedriftseier': 'm', 'bekjent': 'm', 'bensin': 'm',
  'bensinstasjon': 'm', 'beskjed': 'm', 'besteforeldre': 'm', 'generasjon': 'm',
  'geografi': 'm', 'gevinst': 'm',
  // --- -else/-ing/-het wrongly assigned neuter, should be feminine ---
  'bebreidelse': 'f', 'bedrift': 'f', 'bedring': 'f', 'befolkning': 'f',
  'begrunnelse': 'f', 'begynnelse': 'f', 'bekreftelse': 'f', 'bekymring': 'f',
  'beliggenhet': 'f', 'beskjeftigelse': 'f', 'beskrivelse': 'f', 'betaling': 'f',
  'betingelse': 'f', 'betydning': 'f', 'bevegelse': 'f',
  // --- Round 2 genus corrections (113 entries) ---
  // Neuter wrongly masculine
  'bygg': 'n', 'etternamn': 'n', 'fornamn': 'n', 'foto': 'n', 'fotografi': 'n',
  'fotoapparat': 'n', 'framhald': 'n', 'følge': 'n', 'hefte': 'n', 'hensyn': 'n',
  'hjørne': 'n', 'hotell': 'n', 'håndkle': 'n', 'internett': 'n', 'jordbær': 'n',
  'kamera': 'n', 'kompromiss': 'n', 'konsulat': 'n', 'kors': 'n', 'kostyme': 'n',
  'lager': 'n', 'landbruk': 'n', 'lokale': 'n', 'lokaltog': 'n',
  'lommetørkle': 'n', 'mel': 'n', 'merke': 'n', 'metall': 'n',
  'motorhavari': 'n', 'namn': 'n', 'orkester': 'n', 'papir': 'n',
  'personale': 'n', 'plaster': 'n', 'prospekt': 'n', 'samtykke': 'n',
  'sete': 'n', 'sirkus': 'n', 'studie': 'n', 'teppe': 'n', 'toalett': 'n',
  'tog': 'n', 'tårn': 'n', 'verktøy': 'n', 'ungdomsherberge': 'n', 'vitne': 'n',
  'samband': 'n',
  // Feminine wrongly masculine
  'ambulanse': 'f', 'bagasje': 'f', 'borg': 'f', 'bredde': 'f',
  'dagsrytme': 'f', 'deltid': 'f', 'drue': 'f', 'eng': 'f', 'etasje': 'f',
  'forskrift': 'f', 'fortid': 'f', 'frisyre': 'f', 'garderobe': 'f',
  'gjeld': 'f', 'gågate': 'f', 'heltid': 'f', 'hete': 'f',
  'historielekse': 'f', 'hjelp': 'f', 'hud': 'f', 'kabine': 'f',
  'kantine': 'f', 'kiste': 'f', 'kjensle': 'f', 'kjole': 'f',
  'kjørebane': 'f', 'kontortid': 'f', 'krise': 'f', 'kulde': 'f',
  'kurve': 'f', 'lyst': 'f', 'lære': 'f', 'møye': 'f', 'nerve': 'f',
  'nål': 'f', 'oppgåve': 'f', 'oppskrift': 'f', 'overskrift': 'f',
  'overtid': 'f', 'presse': 'f', 'påske': 'f', 'rekkje': 'f', 'ro': 'f',
  'seng': 'f', 'skranke': 'f', 'snue': 'f', 'sone': 'f', 'støtte': 'f',
  'sykekasse': 'f', 't-skjorte': 'f', 'tannbørste': 'f',
  'telefonsamtale': 'f', 'tiltale': 'f', 'tåke': 'f', 'underskrift': 'f',
  'utsikt': 'f', 'utgave': 'f', 'vare': 'f', 'varme': 'f', 'vase': 'f',
  // Feminine wrongly neuter
  'byrjing': 'f', 'skildring': 'f', 'rørsle': 'f',
  // Masculine wrongly feminine
  'honning': 'm', 'kylling': 'm', 'lærling': 'm', 'slektning': 'm',
  'utlending': 'm',
  // Masculine wrongly neuter
  'bustad': 'm', 'fødestad': 'm', 'verkstad': 'm', 'sum': 'm',
  'røyndom': 'm',
};

// ═══════════════════════════════════════════════════════════════════════════
// NN WORD ID GENERATION
// ═══════════════════════════════════════════════════════════════════════════

function normalizeToId(word, type) {
  let normalized = word.toLowerCase().trim();
  if (normalized.startsWith('å ')) normalized = normalized.substring(2);
  normalized = normalized.replace(/\s+/g, '_');
  normalized = normalized.replace(/\s*\(.*?\)\s*/g, '');
  normalized = normalized.replace(/^_+|_+$/g, '');
  normalized = normalized.replace(/[^a-zæøå0-9_]/g, '');
  return `${normalized}_${type}`;
}

// ═══════════════════════════════════════════════════════════════════════════
// NN NOUN MORPHOLOGY
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Irregular NN nouns: word → { genus, plural, forms }
 * Many overlap with NB but with different plural/definite patterns.
 */
const IRREGULAR_NOUNS_NN = {
  'barn': { genus: 'n', plural: 'born', bestEntall: 'barnet', bestFlertall: 'borna' },
  'mann': { genus: 'm', plural: 'menn', bestEntall: 'mannen', bestFlertall: 'mennene' },
  'bok': { genus: 'f', plural: 'bøker', bestEntall: 'boka', bestFlertall: 'bøkene' },
  'bror': { genus: 'm', plural: 'brør', bestEntall: 'broren', bestFlertall: 'brørne' },
  'syster': { genus: 'f', plural: 'systrer', bestEntall: 'systera', bestFlertall: 'systrene' },
  'søster': { genus: 'f', plural: 'søstrer', bestEntall: 'søstera', bestFlertall: 'søstrene' },
  'mor': { genus: 'f', plural: 'mødrer', bestEntall: 'mora', bestFlertall: 'mødrene' },
  'far': { genus: 'm', plural: 'fedrar', bestEntall: 'faren', bestFlertall: 'fedrane' },
  'dotter': { genus: 'f', plural: 'døtrer', bestEntall: 'dottera', bestFlertall: 'døtrene' },
  'datter': { genus: 'f', plural: 'døtrer', bestEntall: 'dottera', bestFlertall: 'døtrene' },
  'auge': { genus: 'n', plural: 'auge', bestEntall: 'auget', bestFlertall: 'auga' },
  'øye': { genus: 'n', plural: 'auge', bestEntall: 'auget', bestFlertall: 'auga' },
  'øre': { genus: 'n', plural: 'øyre', bestEntall: 'øyret', bestFlertall: 'øyra' },
  'tre': { genus: 'n', plural: 'tre', bestEntall: 'treet', bestFlertall: 'trea' },
  'kne': { genus: 'n', plural: 'kne', bestEntall: 'kneet', bestFlertall: 'knea' },
  'fot': { genus: 'm', plural: 'føter', bestEntall: 'foten', bestFlertall: 'føtene' },
  'hand': { genus: 'f', plural: 'hender', bestEntall: 'handa', bestFlertall: 'hendene' },
  'hånd': { genus: 'f', plural: 'hender', bestEntall: 'handa', bestFlertall: 'hendene' },
  'natt': { genus: 'f', plural: 'netter', bestEntall: 'natta', bestFlertall: 'nettene' },
  'tann': { genus: 'f', plural: 'tenner', bestEntall: 'tanna', bestFlertall: 'tennene' },
  'ku': { genus: 'f', plural: 'kyr', bestEntall: 'kua', bestFlertall: 'kyrne' },
  'mus': { genus: 'f', plural: 'mus', bestEntall: 'musa', bestFlertall: 'musene' },
  'and': { genus: 'f', plural: 'ender', bestEntall: 'anda', bestFlertall: 'endene' },
  'gås': { genus: 'f', plural: 'gåser', bestEntall: 'gåsa', bestFlertall: 'gåsene' },
  'tid': { genus: 'f', plural: 'tider', bestEntall: 'tida', bestFlertall: 'tidene' },
  'stad': { genus: 'm', plural: 'stader', bestEntall: 'staden', bestFlertall: 'stadene' },
  'sted': { genus: 'm', plural: 'stader', bestEntall: 'staden', bestFlertall: 'stadene' },
  'vatn': { genus: 'n', plural: 'vatn', bestEntall: 'vatnet', bestFlertall: 'vatna' },
  'vann': { genus: 'n', plural: 'vatn', bestEntall: 'vatnet', bestFlertall: 'vatna' },
  'land': { genus: 'n', plural: 'land', bestEntall: 'landet', bestFlertall: 'landa' },
  'hus': { genus: 'n', plural: 'hus', bestEntall: 'huset', bestFlertall: 'husa' },
  'år': { genus: 'n', plural: 'år', bestEntall: 'året', bestFlertall: 'åra' },
  'dag': { genus: 'm', plural: 'dagar', bestEntall: 'dagen', bestFlertall: 'dagane' },
  'ting': { genus: 'm', plural: 'ting', bestEntall: 'tingen', bestFlertall: 'tinga' },
  'veke': { genus: 'f', plural: 'veker', bestEntall: 'veka', bestFlertall: 'vekene' },
  'kyrkje': { genus: 'f', plural: 'kyrkjer', bestEntall: 'kyrkja', bestFlertall: 'kyrkjene' },
};

/**
 * Heuristic genus guessing for NN.
 * Same base rules as NB — NN uses the same 3-gender system.
 */
function guessGenusNN(word) {
  if (word.match(/(skap|verk|stykke|smål|ment|ium|um|eri)$/)) return 'n';
  if (word.match(/^(be|ge)/) && word.length > 4) return 'n';

  // NN preserves feminine more strictly than BM
  if (word.match(/(ing|ung|heit|nad)$/) && word.length > 4) return 'f';
  if (word.match(/(else|heit)$/)) return 'f';
  // -e ending nouns are often feminine in NN
  if (word.endsWith('e') && word.length > 3) return 'f';

  return 'm';
}

/**
 * Generate NN noun forms. Key differences from NB:
 * - Masculine plural: -ar (not -er), definite plural: -ane (not -ene)
 * - Neuter definite plural: -a (not -ene)
 * - Feminine: mostly same as NB
 */
function generateNounFormsNN(word, genus) {
  let plural, bestEntall, bestFlertall;

  if (genus === 'n') {
    // Neuter nouns in NN
    if (word.endsWith('e')) {
      // -e neuter: eit eple → eplet, eple, epla
      plural = word;
      bestEntall = word + 't';
      bestFlertall = word.slice(0, -1) + 'a';
    } else if (word.match(/(eri|ment|ium|um)$/)) {
      // Latin/long endings
      plural = word;
      bestEntall = word + 'et';
      bestFlertall = word + 'a';
    } else {
      // Monosyllabic/short neuter: eit hus → huset, hus, husa
      plural = word;
      bestEntall = word + 'et';
      bestFlertall = word + 'a';
    }
  } else if (genus === 'f') {
    // Feminine nouns in NN
    if (word.endsWith('e')) {
      // -e feminine: ei jente → jenta, jenter, jentene
      plural = word + 'r';
      bestEntall = word.slice(0, -1) + 'a';
      bestFlertall = word + 'ne';
    } else if (word.endsWith('ing') || word.endsWith('ung')) {
      // -ing/-ung: ei øving → øvinga, øvingar, øvingane
      plural = word + 'ar';
      bestEntall = word + 'a';
      bestFlertall = word + 'ane';
    } else if (word.endsWith('heit')) {
      // -heit: ei moglegheit → moglegheita, moglegheiter, moglegheitene
      plural = word + 'er';
      bestEntall = word + 'a';
      bestFlertall = word + 'ene';
    } else if (word.endsWith('else')) {
      // -else: same as NB mostly
      plural = word + 'r';
      bestEntall = word + 'n';
      bestFlertall = word + 'ne';
    } else {
      // Other feminine: ei bok → boka, bøker, bøkene (irregular handled above)
      plural = word + 'er';
      bestEntall = word + 'a';
      bestFlertall = word + 'ene';
    }
  } else {
    // Masculine nouns in NN — KEY DIFFERENCES from NB
    if (word.endsWith('e')) {
      // -e masculine: ein gut(e) → guten, gutar, gutane
      plural = word.slice(0, -1) + 'ar';
      bestEntall = word + 'n';
      bestFlertall = word.slice(0, -1) + 'ane';
    } else if (word.endsWith('ar')) {
      // -ar: ein lærar → læraren, lærarar, lærarane
      plural = word + 'ar';
      bestEntall = word + 'en';
      bestFlertall = word + 'ane';
    } else if (word.endsWith('er')) {
      // -er masculine: same word, NN-style plurals
      plural = word + 'ar';
      bestEntall = word + 'en';
      bestFlertall = word + 'ane';
    } else if (word.endsWith('el')) {
      // -el: ein onkel → onkelen, onklar, onklane
      plural = word.slice(0, -2) + 'lar';
      bestEntall = word + 'en';
      bestFlertall = word.slice(0, -2) + 'lane';
    } else {
      // Consonant-ending masculine: ein stol → stolen, stolar, stolane
      plural = word + 'ar';
      bestEntall = word + 'en';
      bestFlertall = word + 'ane';
    }
  }

  return { plural, bestEntall, bestFlertall };
}

function enrichNounNN(word, genus) {
  const w = word.toLowerCase();

  // Check NN irregulars
  if (IRREGULAR_NOUNS_NN[w]) {
    const irr = IRREGULAR_NOUNS_NN[w];
    return {
      genus: irr.genus,
      plural: irr.plural,
      forms: {
        ubestemt: { entall: w, flertall: irr.plural },
        bestemt: { entall: irr.bestEntall, flertall: irr.bestFlertall },
      },
    };
  }

  // Use genus override first, then provided genus, then heuristic
  const g = GENUS_OVERRIDES[w] || genus || guessGenusNN(w);
  const { plural, bestEntall, bestFlertall } = generateNounFormsNN(w, g);

  return {
    genus: g,
    plural,
    forms: {
      ubestemt: { entall: w, flertall: plural },
      bestemt: { entall: bestEntall, flertall: bestFlertall },
    },
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// NN VERB MORPHOLOGY
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Irregular NN verbs.
 * Many overlap with NB but with NN-specific forms.
 */
const IRREGULAR_VERBS_NN = {
  'vera': { cls: 'uregelmessig', presens: 'er', preteritum: 'var', partisipp: 'vore', imperativ: 'ver', aux: 'har' },
  'være': { cls: 'uregelmessig', presens: 'er', preteritum: 'var', partisipp: 'vore', imperativ: 'ver', aux: 'har' },
  'ha': { cls: 'uregelmessig', presens: 'har', preteritum: 'hadde', partisipp: 'hatt', imperativ: 'ha', aux: 'har' },
  'bli': { cls: 'sterk', presens: 'blir', preteritum: 'vart', partisipp: 'vorte', imperativ: 'bli', aux: 'er' },
  'gå': { cls: 'sterk', presens: 'går', preteritum: 'gjekk', partisipp: 'gått', imperativ: 'gå', aux: 'har' },
  'koma': { cls: 'sterk', presens: 'kjem', preteritum: 'kom', partisipp: 'kome', imperativ: 'kom', aux: 'har' },
  'komme': { cls: 'sterk', presens: 'kjem', preteritum: 'kom', partisipp: 'kome', imperativ: 'kom', aux: 'har' },
  'ta': { cls: 'sterk', presens: 'tek', preteritum: 'tok', partisipp: 'teke', imperativ: 'ta', aux: 'har' },
  'gje': { cls: 'sterk', presens: 'gjev', preteritum: 'gav', partisipp: 'gjeve', imperativ: 'gje', aux: 'har' },
  'gi': { cls: 'sterk', presens: 'gjev', preteritum: 'gav', partisipp: 'gjeve', imperativ: 'gje', aux: 'har' },
  'seia': { cls: 'sterk', presens: 'seier', preteritum: 'sa', partisipp: 'sagt', imperativ: 'sei', aux: 'har' },
  'si': { cls: 'sterk', presens: 'seier', preteritum: 'sa', partisipp: 'sagt', imperativ: 'sei', aux: 'har' },
  'sjå': { cls: 'sterk', presens: 'ser', preteritum: 'såg', partisipp: 'sett', imperativ: 'sjå', aux: 'har' },
  'se': { cls: 'sterk', presens: 'ser', preteritum: 'såg', partisipp: 'sett', imperativ: 'sjå', aux: 'har' },
  'gjera': { cls: 'uregelmessig', presens: 'gjer', preteritum: 'gjorde', partisipp: 'gjort', imperativ: 'gjer', aux: 'har' },
  'gjøre': { cls: 'uregelmessig', presens: 'gjer', preteritum: 'gjorde', partisipp: 'gjort', imperativ: 'gjer', aux: 'har' },
  'vita': { cls: 'uregelmessig', presens: 'veit', preteritum: 'visste', partisipp: 'visst', imperativ: 'vit', aux: 'har' },
  'vite': { cls: 'uregelmessig', presens: 'veit', preteritum: 'visste', partisipp: 'visst', imperativ: 'vit', aux: 'har' },
  'finna': { cls: 'sterk', presens: 'finn', preteritum: 'fann', partisipp: 'funne', imperativ: 'finn', aux: 'har' },
  'finne': { cls: 'sterk', presens: 'finn', preteritum: 'fann', partisipp: 'funne', imperativ: 'finn', aux: 'har' },
  'stå': { cls: 'sterk', presens: 'står', preteritum: 'stod', partisipp: 'stått', imperativ: 'stå', aux: 'har' },
  'liggja': { cls: 'sterk', presens: 'ligg', preteritum: 'låg', partisipp: 'lege', imperativ: 'ligg', aux: 'har' },
  'ligge': { cls: 'sterk', presens: 'ligg', preteritum: 'låg', partisipp: 'lege', imperativ: 'ligg', aux: 'har' },
  'sitja': { cls: 'sterk', presens: 'sit', preteritum: 'sat', partisipp: 'sete', imperativ: 'sit', aux: 'har' },
  'sitte': { cls: 'sterk', presens: 'sit', preteritum: 'sat', partisipp: 'sete', imperativ: 'sit', aux: 'har' },
  'dra': { cls: 'sterk', presens: 'dreg', preteritum: 'drog', partisipp: 'drege', imperativ: 'dra', aux: 'har' },
  'drikka': { cls: 'sterk', presens: 'drikk', preteritum: 'drakk', partisipp: 'drukke', imperativ: 'drikk', aux: 'har' },
  'drikke': { cls: 'sterk', presens: 'drikk', preteritum: 'drakk', partisipp: 'drukke', imperativ: 'drikk', aux: 'har' },
  'skriva': { cls: 'sterk', presens: 'skriv', preteritum: 'skreiv', partisipp: 'skrive', imperativ: 'skriv', aux: 'har' },
  'skrive': { cls: 'sterk', presens: 'skriv', preteritum: 'skreiv', partisipp: 'skrive', imperativ: 'skriv', aux: 'har' },
  'lesa': { cls: 'sterk', presens: 'les', preteritum: 'las', partisipp: 'lese', imperativ: 'les', aux: 'har' },
  'lese': { cls: 'sterk', presens: 'les', preteritum: 'las', partisipp: 'lese', imperativ: 'les', aux: 'har' },
  'forstå': { cls: 'sterk', presens: 'forstår', preteritum: 'forstod', partisipp: 'forstått', imperativ: 'forstå', aux: 'har' },
  'eta': { cls: 'sterk', presens: 'et', preteritum: 'åt', partisipp: 'ete', imperativ: 'et', aux: 'har' },
  'spise': { cls: 'sterk', presens: 'et', preteritum: 'åt', partisipp: 'ete', imperativ: 'et', aux: 'har' },
  'sova': { cls: 'sterk', presens: 'søv', preteritum: 'sov', partisipp: 'sove', imperativ: 'sov', aux: 'har' },
  'sove': { cls: 'sterk', presens: 'søv', preteritum: 'sov', partisipp: 'sove', imperativ: 'sov', aux: 'har' },
  'springa': { cls: 'sterk', presens: 'spring', preteritum: 'sprang', partisipp: 'sprunge', imperativ: 'spring', aux: 'har' },
  'løpe': { cls: 'sterk', presens: 'spring', preteritum: 'sprang', partisipp: 'sprunge', imperativ: 'spring', aux: 'har' },
  'syngja': { cls: 'sterk', presens: 'syng', preteritum: 'song', partisipp: 'sunge', imperativ: 'syng', aux: 'har' },
  'synge': { cls: 'sterk', presens: 'syng', preteritum: 'song', partisipp: 'sunge', imperativ: 'syng', aux: 'har' },
  'bera': { cls: 'sterk', presens: 'ber', preteritum: 'bar', partisipp: 'bore', imperativ: 'ber', aux: 'har' },
  'bære': { cls: 'sterk', presens: 'ber', preteritum: 'bar', partisipp: 'bore', imperativ: 'ber', aux: 'har' },
  'falla': { cls: 'sterk', presens: 'fell', preteritum: 'fall', partisipp: 'falle', imperativ: 'fall', aux: 'har' },
  'falle': { cls: 'sterk', presens: 'fell', preteritum: 'fall', partisipp: 'falle', imperativ: 'fall', aux: 'har' },
  'halda': { cls: 'sterk', presens: 'held', preteritum: 'heldt', partisipp: 'halde', imperativ: 'hald', aux: 'har' },
  'holde': { cls: 'sterk', presens: 'held', preteritum: 'heldt', partisipp: 'halde', imperativ: 'hald', aux: 'har' },
  'leggja': { cls: 'uregelmessig', presens: 'legg', preteritum: 'la', partisipp: 'lagt', imperativ: 'legg', aux: 'har' },
  'legge': { cls: 'uregelmessig', presens: 'legg', preteritum: 'la', partisipp: 'lagt', imperativ: 'legg', aux: 'har' },
  'setja': { cls: 'uregelmessig', presens: 'set', preteritum: 'sette', partisipp: 'sett', imperativ: 'set', aux: 'har' },
  'sette': { cls: 'uregelmessig', presens: 'set', preteritum: 'sette', partisipp: 'sett', imperativ: 'set', aux: 'har' },
  'selja': { cls: 'uregelmessig', presens: 'sel', preteritum: 'selde', partisipp: 'selt', imperativ: 'sel', aux: 'har' },
  'selge': { cls: 'uregelmessig', presens: 'sel', preteritum: 'selde', partisipp: 'selt', imperativ: 'sel', aux: 'har' },
  'fortelja': { cls: 'uregelmessig', presens: 'fortel', preteritum: 'fortalde', partisipp: 'fortalt', imperativ: 'fortel', aux: 'har' },
  'fortelle': { cls: 'uregelmessig', presens: 'fortel', preteritum: 'fortalde', partisipp: 'fortalt', imperativ: 'fortel', aux: 'har' },
  'le': { cls: 'sterk', presens: 'ler', preteritum: 'lo', partisipp: 'ledd', imperativ: 'le', aux: 'har' },
  'fly': { cls: 'sterk', presens: 'flyg', preteritum: 'flaug', partisipp: 'floge', imperativ: 'flyg', aux: 'har' },
  'flyga': { cls: 'sterk', presens: 'flyg', preteritum: 'flaug', partisipp: 'floge', imperativ: 'flyg', aux: 'har' },
  'hjelpa': { cls: 'sterk', presens: 'hjelp', preteritum: 'hjelpte', partisipp: 'hjelpt', imperativ: 'hjelp', aux: 'har' },
  'hjelpe': { cls: 'sterk', presens: 'hjelp', preteritum: 'hjelpte', partisipp: 'hjelpt', imperativ: 'hjelp', aux: 'har' },
  'høyra': { cls: 'svak', presens: 'høyrer', preteritum: 'høyrde', partisipp: 'høyrt', imperativ: 'høyr', aux: 'har' },
  'høre': { cls: 'svak', presens: 'høyrer', preteritum: 'høyrde', partisipp: 'høyrt', imperativ: 'høyr', aux: 'har' },
  'køyra': { cls: 'svak', presens: 'køyrer', preteritum: 'køyrde', partisipp: 'køyrt', imperativ: 'køyr', aux: 'har' },
  'kjøre': { cls: 'svak', presens: 'køyrer', preteritum: 'køyrde', partisipp: 'køyrt', imperativ: 'køyr', aux: 'har' },
  'læra': { cls: 'svak', presens: 'lærer', preteritum: 'lærte', partisipp: 'lært', imperativ: 'lær', aux: 'har' },
  'lære': { cls: 'svak', presens: 'lærer', preteritum: 'lærte', partisipp: 'lært', imperativ: 'lær', aux: 'har' },
  'heita': { cls: 'uregelmessig', presens: 'heiter', preteritum: 'heitte', partisipp: 'heitt', imperativ: 'heit', aux: 'har' },
  'hete': { cls: 'uregelmessig', presens: 'heiter', preteritum: 'heitte', partisipp: 'heitt', imperativ: 'heit', aux: 'har' },
  'synast': { cls: 'uregelmessig', presens: 'synest', preteritum: 'syntest', partisipp: 'synst', imperativ: '-', aux: 'har' },
  'synes': { cls: 'uregelmessig', presens: 'synest', preteritum: 'syntest', partisipp: 'synst', imperativ: '-', aux: 'har' },
  'kunna': { cls: 'uregelmessig', presens: 'kan', preteritum: 'kunne', partisipp: 'kunna', imperativ: '-', aux: 'har' },
  'kunne': { cls: 'uregelmessig', presens: 'kan', preteritum: 'kunne', partisipp: 'kunna', imperativ: '-', aux: 'har' },
  'vilja': { cls: 'uregelmessig', presens: 'vil', preteritum: 'ville', partisipp: 'vilja', imperativ: '-', aux: 'har' },
  'ville': { cls: 'uregelmessig', presens: 'vil', preteritum: 'ville', partisipp: 'vilja', imperativ: '-', aux: 'har' },
  'skulla': { cls: 'uregelmessig', presens: 'skal', preteritum: 'skulle', partisipp: 'skulla', imperativ: '-', aux: 'har' },
  'skulle': { cls: 'uregelmessig', presens: 'skal', preteritum: 'skulle', partisipp: 'skulla', imperativ: '-', aux: 'har' },
  'måtta': { cls: 'uregelmessig', presens: 'må', preteritum: 'måtte', partisipp: 'måtta', imperativ: '-', aux: 'har' },
  'måtte': { cls: 'uregelmessig', presens: 'må', preteritum: 'måtte', partisipp: 'måtta', imperativ: '-', aux: 'har' },
  'burda': { cls: 'uregelmessig', presens: 'bør', preteritum: 'burde', partisipp: 'burd', imperativ: '-', aux: 'har' },
  'burde': { cls: 'uregelmessig', presens: 'bør', preteritum: 'burde', partisipp: 'burd', imperativ: '-', aux: 'har' },
  'tora': { cls: 'uregelmessig', presens: 'tør', preteritum: 'torde', partisipp: 'tort', imperativ: '-', aux: 'har' },
  'tørre': { cls: 'uregelmessig', presens: 'tør', preteritum: 'torde', partisipp: 'tort', imperativ: '-', aux: 'har' },
  'trekkja': { cls: 'sterk', presens: 'trekk', preteritum: 'drog', partisipp: 'drege', imperativ: 'trekk', aux: 'har' },
  'trekke': { cls: 'sterk', presens: 'trekk', preteritum: 'drog', partisipp: 'drege', imperativ: 'trekk', aux: 'har' },
  'bryta': { cls: 'sterk', presens: 'bryt', preteritum: 'braut', partisipp: 'brote', imperativ: 'bryt', aux: 'har' },
  'bryte': { cls: 'sterk', presens: 'bryt', preteritum: 'braut', partisipp: 'brote', imperativ: 'bryt', aux: 'har' },
  'treffe': { cls: 'sterk', presens: 'treff', preteritum: 'traff', partisipp: 'truffe', imperativ: 'treff', aux: 'har' },
  'veksa': { cls: 'uregelmessig', presens: 'veks', preteritum: 'voks', partisipp: 'vakse', imperativ: 'veks', aux: 'har' },
  'vokse': { cls: 'uregelmessig', presens: 'veks', preteritum: 'voks', partisipp: 'vakse', imperativ: 'veks', aux: 'har' },
  'få': { cls: 'sterk', presens: 'får', preteritum: 'fekk', partisipp: 'fått', imperativ: 'få', aux: 'har' },
  'skje': { cls: 'sterk', presens: 'skjer', preteritum: 'skjedde', partisipp: 'skjedd', imperativ: '-', aux: 'har' },
  'la': { cls: 'sterk', presens: 'lèt', preteritum: 'let', partisipp: 'late', imperativ: 'lat', aux: 'har' },
  'slå': { cls: 'sterk', presens: 'slår', preteritum: 'slo', partisipp: 'slege', imperativ: 'slå', aux: 'har' },
  'oppleva': { cls: 'svak', presens: 'opplever', preteritum: 'opplevde', partisipp: 'opplevd', imperativ: 'opplev', aux: 'har' },
  'oppleve': { cls: 'svak', presens: 'opplever', preteritum: 'opplevde', partisipp: 'opplevd', imperativ: 'opplev', aux: 'har' },
  // Strong verbs missing from initial list
  'brenna': { cls: 'sterk', presens: 'brenn', preteritum: 'brann', partisipp: 'brunne', imperativ: 'brenn', aux: 'har' },
  'brenne': { cls: 'sterk', presens: 'brenn', preteritum: 'brann', partisipp: 'brunne', imperativ: 'brenn', aux: 'har' },
  'frysa': { cls: 'sterk', presens: 'frys', preteritum: 'fraus', partisipp: 'frose', imperativ: 'frys', aux: 'har' },
  'fryse': { cls: 'sterk', presens: 'frys', preteritum: 'fraus', partisipp: 'frose', imperativ: 'frys', aux: 'har' },
  'gripa': { cls: 'sterk', presens: 'grip', preteritum: 'greip', partisipp: 'gripe', imperativ: 'grip', aux: 'har' },
  'gripe': { cls: 'sterk', presens: 'grip', preteritum: 'greip', partisipp: 'gripe', imperativ: 'grip', aux: 'har' },
  'stiga': { cls: 'sterk', presens: 'stig', preteritum: 'steig', partisipp: 'stige', imperativ: 'stig', aux: 'har' },
  'stige': { cls: 'sterk', presens: 'stig', preteritum: 'steig', partisipp: 'stige', imperativ: 'stig', aux: 'har' },
  'vinna': { cls: 'sterk', presens: 'vinn', preteritum: 'vann', partisipp: 'vunne', imperativ: 'vinn', aux: 'har' },
  'vinne': { cls: 'sterk', presens: 'vinn', preteritum: 'vann', partisipp: 'vunne', imperativ: 'vinn', aux: 'har' },
  'stikka': { cls: 'sterk', presens: 'stikk', preteritum: 'stakk', partisipp: 'stukke', imperativ: 'stikk', aux: 'har' },
  'stikke': { cls: 'sterk', presens: 'stikk', preteritum: 'stakk', partisipp: 'stukke', imperativ: 'stikk', aux: 'har' },
  'bita': { cls: 'sterk', presens: 'bit', preteritum: 'beit', partisipp: 'bite', imperativ: 'bit', aux: 'har' },
  'bite': { cls: 'sterk', presens: 'bit', preteritum: 'beit', partisipp: 'bite', imperativ: 'bit', aux: 'har' },
  'skyta': { cls: 'sterk', presens: 'skyt', preteritum: 'skaut', partisipp: 'skote', imperativ: 'skyt', aux: 'har' },
  'skyte': { cls: 'sterk', presens: 'skyt', preteritum: 'skaut', partisipp: 'skote', imperativ: 'skyt', aux: 'har' },
  'skyva': { cls: 'sterk', presens: 'skyv', preteritum: 'skuva', partisipp: 'skuve', imperativ: 'skyv', aux: 'har' },
  'skyve': { cls: 'sterk', presens: 'skyv', preteritum: 'skuva', partisipp: 'skuve', imperativ: 'skyv', aux: 'har' },
  'stinka': { cls: 'sterk', presens: 'stink', preteritum: 'stank', partisipp: 'stunke', imperativ: 'stink', aux: 'har' },
  'stinke': { cls: 'sterk', presens: 'stink', preteritum: 'stank', partisipp: 'stunke', imperativ: 'stink', aux: 'har' },
  'gråta': { cls: 'sterk', presens: 'grèt', preteritum: 'gret', partisipp: 'gråte', imperativ: 'grèt', aux: 'har' },
  'gråte': { cls: 'sterk', presens: 'grèt', preteritum: 'gret', partisipp: 'gråte', imperativ: 'grèt', aux: 'har' },
  'be': { cls: 'sterk', presens: 'bed', preteritum: 'bad', partisipp: 'bede', imperativ: 'be', aux: 'har' },
  'lyge': { cls: 'sterk', presens: 'lyg', preteritum: 'laug', partisipp: 'loge', imperativ: 'lyg', aux: 'har' },
  'lyve': { cls: 'sterk', presens: 'lyg', preteritum: 'laug', partisipp: 'loge', imperativ: 'lyg', aux: 'har' },
  'rida': { cls: 'sterk', presens: 'rid', preteritum: 'reid', partisipp: 'ride', imperativ: 'rid', aux: 'har' },
  'ri': { cls: 'sterk', presens: 'rid', preteritum: 'reid', partisipp: 'ride', imperativ: 'rid', aux: 'har' },
  'velje': { cls: 'sterk', presens: 'vel', preteritum: 'valde', partisipp: 'valt', imperativ: 'vel', aux: 'har' },
  'velge': { cls: 'sterk', presens: 'vel', preteritum: 'valde', partisipp: 'valt', imperativ: 'vel', aux: 'har' },
  'tegje': { cls: 'sterk', presens: 'teg', preteritum: 'tagde', partisipp: 'tagd', imperativ: 'teg', aux: 'har' },
  'tie': { cls: 'sterk', presens: 'teg', preteritum: 'tagde', partisipp: 'tagd', imperativ: 'teg', aux: 'har' },
  'vege': { cls: 'sterk', presens: 'veg', preteritum: 'vog', partisipp: 'vege', imperativ: 'veg', aux: 'har' },
  'veie': { cls: 'sterk', presens: 'veg', preteritum: 'vog', partisipp: 'vege', imperativ: 'veg', aux: 'har' },
  'skrike': { cls: 'sterk', presens: 'skrik', preteritum: 'skreik', partisipp: 'skrike', imperativ: 'skrik', aux: 'har' },
  'overdrive': { cls: 'sterk', presens: 'overdriv', preteritum: 'overdreiv', partisipp: 'overdrive', imperativ: 'overdriv', aux: 'har' },
  'underskrive': { cls: 'sterk', presens: 'underskriv', preteritum: 'underskreiv', partisipp: 'underskrive', imperativ: 'underskriv', aux: 'har' },
  'lide': { cls: 'sterk', presens: 'lid', preteritum: 'leid', partisipp: 'lide', imperativ: 'lid', aux: 'har' },
  'følgje': { cls: 'svak', presens: 'følgjer', preteritum: 'følgde', partisipp: 'følgd', imperativ: 'følg', aux: 'har' },
  'følge': { cls: 'svak', presens: 'følgjer', preteritum: 'følgde', partisipp: 'følgd', imperativ: 'følg', aux: 'har' },
  'gjelde': { cls: 'sterk', presens: 'gjeld', preteritum: 'gjaldt', partisipp: 'golde', imperativ: 'gjeld', aux: 'har' },
  'lede': { cls: 'svak', presens: 'leier', preteritum: 'leidde', partisipp: 'leidd', imperativ: 'lei', aux: 'har' },
  'dreie': { cls: 'svak', presens: 'dreier', preteritum: 'dreidde', partisipp: 'dreidd', imperativ: 'drei', aux: 'har' },
  'leige': { cls: 'svak', presens: 'leiger', preteritum: 'leigde', partisipp: 'leigd', imperativ: 'leig', aux: 'har' },
  'leie': { cls: 'svak', presens: 'leiger', preteritum: 'leigde', partisipp: 'leigd', imperativ: 'leig', aux: 'har' },
  'krevje': { cls: 'svak', presens: 'krev', preteritum: 'kravde', partisipp: 'kravd', imperativ: 'krev', aux: 'har' },
  'kreve': { cls: 'svak', presens: 'krev', preteritum: 'kravde', partisipp: 'kravd', imperativ: 'krev', aux: 'har' },
  // Compound verbs of strong stems
  'beskriva': { cls: 'sterk', presens: 'beskriv', preteritum: 'beskreiv', partisipp: 'beskrive', imperativ: 'beskriv', aux: 'har' },
  'beskrive': { cls: 'sterk', presens: 'beskriv', preteritum: 'beskreiv', partisipp: 'beskrive', imperativ: 'beskriv', aux: 'har' },
  'beholda': { cls: 'sterk', presens: 'beheld', preteritum: 'beheldt', partisipp: 'behalde', imperativ: 'behald', aux: 'har' },
  'beholde': { cls: 'sterk', presens: 'beheld', preteritum: 'beheldt', partisipp: 'behalde', imperativ: 'behald', aux: 'har' },
  'forekomma': { cls: 'sterk', presens: 'førekjem', preteritum: 'førekom', partisipp: 'førekome', imperativ: 'førekom', aux: 'har' },
  'forekomme': { cls: 'sterk', presens: 'førekjem', preteritum: 'førekom', partisipp: 'førekome', imperativ: 'førekom', aux: 'har' },
  'ankomma': { cls: 'sterk', presens: 'ankjem', preteritum: 'ankom', partisipp: 'ankome', imperativ: 'ankom', aux: 'har' },
  'ankomme': { cls: 'sterk', presens: 'ankjem', preteritum: 'ankom', partisipp: 'ankome', imperativ: 'ankom', aux: 'har' },
  'tilgi': { cls: 'sterk', presens: 'tilgjev', preteritum: 'tilgav', partisipp: 'tilgjeve', imperativ: 'tilgje', aux: 'har' },
  'overta': { cls: 'sterk', presens: 'overtek', preteritum: 'overtok', partisipp: 'overteke', imperativ: 'overta', aux: 'har' },
  'foreta': { cls: 'sterk', presens: 'føretek', preteritum: 'føretok', partisipp: 'føreteke', imperativ: 'føreta', aux: 'har' },
  'foretrekka': { cls: 'sterk', presens: 'føretrekk', preteritum: 'føretrekte', partisipp: 'føretrekt', imperativ: 'føretrekk', aux: 'har' },
  'foretrekke': { cls: 'sterk', presens: 'føretrekk', preteritum: 'føretrekte', partisipp: 'føretrekt', imperativ: 'føretrekk', aux: 'har' },
  'forskriva': { cls: 'sterk', presens: 'forskriv', preteritum: 'forskreiv', partisipp: 'forskrive', imperativ: 'forskriv', aux: 'har' },
  'forskrive': { cls: 'sterk', presens: 'forskriv', preteritum: 'forskreiv', partisipp: 'forskrive', imperativ: 'forskriv', aux: 'har' },
  'tilby': { cls: 'sterk', presens: 'tilbyd', preteritum: 'tilbaud', partisipp: 'tilbode', imperativ: 'tilby', aux: 'har' },
  'grunnleggja': { cls: 'uregelmessig', presens: 'grunnlegg', preteritum: 'grunnla', partisipp: 'grunnlagt', imperativ: 'grunnlegg', aux: 'har' },
  'grunnlegga': { cls: 'uregelmessig', presens: 'grunnlegg', preteritum: 'grunnla', partisipp: 'grunnlagt', imperativ: 'grunnlegg', aux: 'har' },
  'fastsetta': { cls: 'uregelmessig', presens: 'fastset', preteritum: 'fastsette', partisipp: 'fastsett', imperativ: 'fastset', aux: 'har' },
  'fastsette': { cls: 'uregelmessig', presens: 'fastset', preteritum: 'fastsette', partisipp: 'fastsett', imperativ: 'fastset', aux: 'har' },
  'ansetta': { cls: 'uregelmessig', presens: 'anset', preteritum: 'ansette', partisipp: 'ansett', imperativ: 'anset', aux: 'har' },
  'ansette': { cls: 'uregelmessig', presens: 'anset', preteritum: 'ansette', partisipp: 'ansett', imperativ: 'anset', aux: 'har' },
  'oversetta': { cls: 'uregelmessig', presens: 'overset', preteritum: 'oversette', partisipp: 'oversett', imperativ: 'overset', aux: 'har' },
  'oversette': { cls: 'uregelmessig', presens: 'overset', preteritum: 'oversette', partisipp: 'oversett', imperativ: 'overset', aux: 'har' },
  'inntreffa': { cls: 'sterk', presens: 'inntreff', preteritum: 'inntraff', partisipp: 'inntruffe', imperativ: 'inntreff', aux: 'har' },
  'inntreffe': { cls: 'sterk', presens: 'inntreff', preteritum: 'inntraff', partisipp: 'inntruffe', imperativ: 'inntreff', aux: 'har' },
  'unngå': { cls: 'sterk', presens: 'unngår', preteritum: 'unngjekk', partisipp: 'unngått', imperativ: 'unngå', aux: 'har' },
  'oppgi': { cls: 'sterk', presens: 'oppgjev', preteritum: 'oppgav', partisipp: 'oppgjeve', imperativ: 'oppgje', aux: 'har' },
  'forbli': { cls: 'sterk', presens: 'forblir', preteritum: 'forblei', partisipp: 'forblidd', imperativ: 'forbli', aux: 'er' },
  'innta': { cls: 'sterk', presens: 'inntek', preteritum: 'inntok', partisipp: 'innteke', imperativ: 'innta', aux: 'har' },
  'påstå': { cls: 'sterk', presens: 'påstår', preteritum: 'påstod', partisipp: 'påstått', imperativ: 'påstå', aux: 'har' },
};

/**
 * NB verb → NN verb word transformation.
 * Many weak NB -e verbs become -a in NN.
 */
const VERB_NB_TO_NN = {
  'være': 'vera',
  'komme': 'koma',
  'gjøre': 'gjera',
  'vite': 'vita',
  'finne': 'finna',
  'ligge': 'liggja',
  'sitte': 'sitja',
  'drikke': 'drikka',
  'skrive': 'skriva',
  'lese': 'lesa',
  'spise': 'eta',
  'sove': 'sova',
  'løpe': 'springa',
  'synge': 'syngja',
  'bære': 'bera',
  'falle': 'falla',
  'holde': 'halda',
  'legge': 'leggja',
  'sette': 'setja',
  'selge': 'selja',
  'fortelle': 'fortelja',
  'hjelpe': 'hjelpa',
  'hete': 'heita',
  'synes': 'synast',
  'bryte': 'bryta',
  'trekke': 'trekkja',
  'vokse': 'veksa',
  'spørre': 'spørja',
  'bruke': 'bruka',
  'like': 'lika',
  'trenge': 'trenga',
  'høre': 'høyra',
  'kjøre': 'køyra',
  'lære': 'læra',
  'brenne': 'brenna',
  'fryse': 'frysa',
  'gripe': 'gripa',
  'stige': 'stiga',
  'vinne': 'vinna',
  'stikke': 'stikka',
  'bite': 'bita',
  'skyte': 'skyta',
  'skyve': 'skyva',
  'stinke': 'stinka',
  'gråte': 'gråta',
  'lage': 'laga',
  'klargjøre': 'klargjera',
  'kunngjøre': 'kunngjera',
  'rengjøre': 'reingjera',
  'forberede': 'førebu',
  'undre': 'undra',
  'glede': 'gleda',
  'klare': 'klara',
  'melde': 'melda',
  'fly': 'flyga',
  'kunne': 'kunna',
  'ville': 'vilja',
  'skulle': 'skulla',
  'måtte': 'måtta',
  'burde': 'burda',
  'tørre': 'tora',
};

/**
 * Determine if a regular NB weak verb should use -a infinitive in NN.
 * General rule: most weak type 1 verbs (double consonant stems) → -a in NN.
 */
function shouldUseAInfinitive(nbWord) {
  const w = nbWord.toLowerCase();
  if (!w.endsWith('e')) return false;
  const stem = w.slice(0, -1);

  // Double consonant stems → a-verb in NN
  if (stem.match(/(kk|pp|tt|ss|ll|nn|mm|gg|bb|dd|ff)$/)) return true;

  // -nk, -ng, -sk stems → a-verb
  if (stem.match(/(nk|ng|sk|rk|lp|mp|nt|nd|ft|kt|pt|st)$/)) return true;

  return false;
}

/**
 * Known strong verb stems — if a compound verb ends with one of these,
 * inherit the strong conjugation pattern.
 */
const STRONG_VERB_STEMS = {
  'gå': { cls: 'sterk', presens: 'går', preteritum: 'gjekk', partisipp: 'gått', imperativ: 'gå', aux: 'har' },
  'stå': { cls: 'sterk', presens: 'står', preteritum: 'stod', partisipp: 'stått', imperativ: 'stå', aux: 'har' },
  'slå': { cls: 'sterk', presens: 'slår', preteritum: 'slo', partisipp: 'slege', imperativ: 'slå', aux: 'har' },
  'ta': { cls: 'sterk', presens: 'tek', preteritum: 'tok', partisipp: 'teke', imperativ: 'ta', aux: 'har' },
  'gi': { cls: 'sterk', presens: 'gjev', preteritum: 'gav', partisipp: 'gjeve', imperativ: 'gje', aux: 'har' },
  'dra': { cls: 'sterk', presens: 'dreg', preteritum: 'drog', partisipp: 'drege', imperativ: 'dra', aux: 'har' },
  'bli': { cls: 'sterk', presens: 'blir', preteritum: 'vart', partisipp: 'vorte', imperativ: 'bli', aux: 'er' },
  'koma': { cls: 'sterk', presens: 'kjem', preteritum: 'kom', partisipp: 'kome', imperativ: 'kom', aux: 'har' },
  'finna': { cls: 'sterk', presens: 'finn', preteritum: 'fann', partisipp: 'funne', imperativ: 'finn', aux: 'har' },
  'halda': { cls: 'sterk', presens: 'held', preteritum: 'heldt', partisipp: 'halde', imperativ: 'hald', aux: 'har' },
  'setja': { cls: 'uregelmessig', presens: 'set', preteritum: 'sette', partisipp: 'sett', imperativ: 'set', aux: 'har' },
  'leggja': { cls: 'uregelmessig', presens: 'legg', preteritum: 'la', partisipp: 'lagt', imperativ: 'legg', aux: 'har' },
};

/**
 * Try to match a compound verb against known strong stems.
 * E.g., "oppstå" → prefix "opp" + stem "stå"
 * Excludes short stems (ta, gi, dra) from compound matching to avoid
 * false positives (kasta, flytta etc. ending in "ta" are NOT compounds).
 */
const COMPOUND_MIN_STEM_LENGTH = 3; // Only match stems >= 3 chars
function matchCompoundStrongVerb(word) {
  for (const [stem, forms] of Object.entries(STRONG_VERB_STEMS)) {
    if (stem.length < COMPOUND_MIN_STEM_LENGTH) continue;
    if (word.endsWith(stem) && word.length > stem.length) {
      const prefix = word.slice(0, -stem.length);
      // Prefix should be a known Norwegian prefix
      if (prefix.match(/^(an|av|be|for|fore|fra|gjen|inn|med|mis|ned|om|opp|over|på|sam|til|u|un|unn|under|ut|ved|å)$/)) {
        return { prefix, stem, forms };
      }
    }
  }
  return null;
}

/**
 * Extract the verb part from a multi-word verb phrase.
 * "kaste seg" → { verb: "kaste", particles: ["seg"] }
 * "gi opp" → { verb: "gi", particles: ["opp"] }
 * "ta med seg" → { verb: "ta", particles: ["med", "seg"] }
 */
function splitVerbPhrase(word) {
  const parts = word.split(' ');
  if (parts.length === 1) return { verb: word, particles: [] };
  return { verb: parts[0], particles: parts.slice(1) };
}

/**
 * Generate NN verb conjugation.
 */
function enrichVerbNN(nnWord) {
  const w = nnWord.toLowerCase();

  // Handle multi-word verbs: conjugate only the verb part
  const { verb, particles } = splitVerbPhrase(w);
  const particleSuffix = particles.length > 0 ? ' ' + particles.join(' ') : '';

  // If multi-word, conjugate the verb part only
  const conjugTarget = particles.length > 0 ? verb : w;

  // Check NN irregulars (try full phrase first, then verb part alone)
  const irrFull = IRREGULAR_VERBS_NN[w];
  const irrVerb = IRREGULAR_VERBS_NN[conjugTarget];
  const irr = irrFull || irrVerb;

  if (irr) {
    return {
      verbClass: irr.cls,
      auxiliary: irr.aux,
      conjugations: {
        presens: {
          former: {
            infinitiv: `å ${w}`,
            presens: irr.presens + particleSuffix,
            preteritum: irr.preteritum + particleSuffix,
            perfektum_partisipp: irr.partisipp,
            imperativ: irr.imperativ === '-' ? '-' : irr.imperativ + particleSuffix,
          },
          auxiliary: irr.aux,
          feature: 'grammar_nn_presens',
        },
      },
    };
  }

  // Check compound strong verbs (oppstå, unngå, anslå, etc.)
  const compound = matchCompoundStrongVerb(conjugTarget);
  if (compound) {
    const { prefix, forms } = compound;
    return {
      verbClass: forms.cls,
      auxiliary: forms.aux,
      conjugations: {
        presens: {
          former: {
            infinitiv: `å ${w}`,
            presens: prefix + forms.presens + particleSuffix,
            preteritum: prefix + forms.preteritum + particleSuffix,
            perfektum_partisipp: prefix + forms.partisipp,
            imperativ: prefix + forms.imperativ + particleSuffix,
          },
          auxiliary: forms.aux,
          feature: 'grammar_nn_presens',
        },
      },
    };
  }

  // Regular verb rules for NN
  let presens, preteritum, partisipp, imperativ, verbClass, aux;
  aux = 'har';
  const cj = conjugTarget; // the verb part to conjugate

  if (cj.endsWith('era')) {
    // -era verbs (Latin): akseptera → aksepterer, aksepterte, akseptert
    verbClass = 'svak';
    presens = cj.slice(0, -1) + 'er';
    preteritum = cj.slice(0, -1) + 'te';
    partisipp = cj.slice(0, -1) + 't';
    imperativ = cj.slice(0, -2) + 'r'; // akseptera → akseptér
  } else if (cj.endsWith('ere')) {
    // Some NN verbs keep -ere form: akseptere → aksepterer, aksepterte, akseptert
    verbClass = 'svak';
    presens = cj + 'r';
    preteritum = cj.slice(0, -1) + 'te';
    partisipp = cj.slice(0, -1) + 't';
    imperativ = cj.slice(0, -1); // strip final -e: akseptere → aksepter
  } else if (cj.endsWith('a') && !cj.endsWith('ja')) {
    // a-verbs (NN weak class 1): kasta → kastar, kasta, kasta
    verbClass = 'svak';
    presens = cj + 'r';
    preteritum = cj;
    partisipp = cj;
    imperativ = cj.slice(0, -1);
  } else if (cj.endsWith('ja')) {
    // -ja verbs (NN): spørja → spør, spurde, spurt
    // These are often irregular — handled above. Fallback:
    verbClass = 'svak';
    const stem = cj.slice(0, -2);
    presens = stem;
    preteritum = stem + 'de';
    partisipp = stem + 'd';
    imperativ = stem;
  } else if (cj.endsWith('ast') || cj.endsWith('st')) {
    // s-passive/reflexive: synast
    verbClass = 'uregelmessig';
    presens = cj.replace(/ast$/, 'est').replace(/st$/, 'st');
    preteritum = cj.replace(/ast$/, 'test').replace(/st$/, 'test');
    partisipp = cj.replace(/ast$/, 'st').replace(/st$/, 'st');
    imperativ = '-';
  } else if (cj.endsWith('le') || cj.endsWith('re') || cj.endsWith('ne') || cj.endsWith('me')) {
    // -le/-re/-ne/-me verbs: these are typically a-verbs in NN
    // behandle → behandlar, behandla, behandla
    // ordne → ordnar, ordna, ordna
    // fornærme → fornærmar, fornærma, fornærma
    verbClass = 'svak';
    presens = cj + 'r';
    preteritum = cj.slice(0, -1) + 'a';
    partisipp = cj.slice(0, -1) + 'a';
    // Imperative: keep at least 3 chars to be pronounceable
    const imp = cj.slice(0, -1);
    imperativ = imp.length >= 3 ? imp : cj;
  } else if (cj.endsWith('ge')) {
    // -ge verbs in NN: pret ends in -ga (beklaga, oppdaga, klaga)
    verbClass = 'svak';
    presens = cj + 'r';
    preteritum = cj.slice(0, -1) + 'a';
    partisipp = cj.slice(0, -1) + 'a';
    imperativ = cj.slice(0, -1);
  } else if (cj.endsWith('de')) {
    // -de verbs in NN: pret ends in -dde or -da
    const stem = cj.slice(0, -1);
    verbClass = 'svak';
    presens = cj + 'r';
    preteritum = stem + 'de';
    partisipp = stem + 'd';
    imperativ = stem.length >= 3 ? stem : cj;
  } else if (cj.endsWith('ve')) {
    // -ve verbs in NN: pret ends in -vde (levde, prøvde, øvde)
    const stem = cj.slice(0, -1);
    verbClass = 'svak';
    presens = cj + 'r';
    preteritum = stem + 'de';
    partisipp = stem + 'd';
    imperativ = stem;
  } else if (cj.endsWith('te') && !cj.match(/(kk|pp|ss|ll|nn|mm|gg|bb|dd|ff|ng|nk|sk|rk|lp|mp|nt|nd|ft|kt|pt|st)e$/)) {
    // -te verbs (NOT double consonant stems): NN pret ends in -a
    // starte → startar, starta, starta (not startte)
    verbClass = 'svak';
    presens = cj + 'r';
    preteritum = cj.slice(0, -1) + 'a';
    partisipp = cj.slice(0, -1) + 'a';
    imperativ = cj.slice(0, -1);
  } else if (cj.endsWith('e')) {
    // Other e-verbs (NN weak class 2): leve → lever, levde, levd
    const stem = cj.slice(0, -1);
    verbClass = 'svak';
    presens = cj + 'r';
    preteritum = stem + 'te';
    partisipp = stem + 't';
    imperativ = stem.length >= 3 ? stem : cj;
  } else {
    // Monosyllabic: bu → bur, budde, budd
    verbClass = 'svak';
    presens = cj + 'r';
    preteritum = cj + 'dde';
    partisipp = cj + 'dd';
    imperativ = cj;
  }

  return {
    verbClass,
    auxiliary: aux,
    conjugations: {
      presens: {
        former: {
          infinitiv: `å ${w}`,
          presens: presens + particleSuffix,
          preteritum: preteritum + particleSuffix,
          perfektum_partisipp: partisipp,
          imperativ: imperativ === '-' ? '-' : imperativ + particleSuffix,
        },
        auxiliary: aux,
        feature: 'grammar_nn_presens',
      },
    },
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// NN ADJECTIVE MORPHOLOGY
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Irregular NN adjective declensions (full override).
 */
const IRREGULAR_ADJ_DECLENSION_NN = {
  'liten': {
    comparison: { positiv: 'liten', komparativ: 'mindre', superlativ: 'minst' },
    declension: {
      positiv: { maskulin: 'liten', feminin: 'lita', noytrum: 'lite', flertall: 'små', bestemt: 'vesle' },
      komparativ: { alle: 'mindre' },
      superlativ: { ubestemt: 'minst', bestemt: 'minste' },
    },
  },
  'annan': {
    comparison: { positiv: 'annan', komparativ: '-', superlativ: '-' },
    declension: {
      positiv: { maskulin: 'annan', feminin: 'anna', noytrum: 'anna', flertall: 'andre', bestemt: 'andre' },
      komparativ: { alle: '-' },
      superlativ: { ubestemt: '-', bestemt: '-' },
    },
  },
};

const IRREGULAR_ADJECTIVES_NN = {
  'god': { komparativ: 'betre', superlativ: 'best' },
  'stor': { komparativ: 'større', superlativ: 'størst' },
  'liten': { komparativ: 'mindre', superlativ: 'minst' },
  'ung': { komparativ: 'yngre', superlativ: 'yngst' },
  'gamal': { komparativ: 'eldre', superlativ: 'eldst' },
  'gammel': { komparativ: 'eldre', superlativ: 'eldst' },
  'lang': { komparativ: 'lengre', superlativ: 'lengst' },
  'tung': { komparativ: 'tyngre', superlativ: 'tyngst' },
  'mange': { komparativ: 'fleire', superlativ: 'flest' },
  'mykje': { komparativ: 'meir', superlativ: 'mest' },
  'mye': { komparativ: 'meir', superlativ: 'mest' },
  'dårleg': { komparativ: 'verre', superlativ: 'verst' },
  'dårlig': { komparativ: 'verre', superlativ: 'verst' },
  'få': { komparativ: 'færre', superlativ: 'færrast' },
  'nær': { komparativ: 'nærare', superlativ: 'nærast' },
};

function enrichAdjectiveNN(word) {
  const w = word.toLowerCase();

  // Check for fully irregular declension (liten, annan)
  if (IRREGULAR_ADJ_DECLENSION_NN[w]) {
    return IRREGULAR_ADJ_DECLENSION_NN[w];
  }

  // Comparison forms
  let komparativ, superlativ;
  if (IRREGULAR_ADJECTIVES_NN[w]) {
    komparativ = IRREGULAR_ADJECTIVES_NN[w].komparativ;
    superlativ = IRREGULAR_ADJECTIVES_NN[w].superlativ;
  } else if (w.endsWith('eg') || w.endsWith('leg') || w.endsWith('sam') || w.length > 7) {
    // Long adjectives use "meir/mest" in NN (not "mer/mest")
    komparativ = `meir ${w}`;
    superlativ = `mest ${w}`;
  } else if (w.endsWith('e')) {
    komparativ = w + 're';
    superlativ = w.slice(0, -1) + 'st';
  } else {
    komparativ = w + 'are';
    superlativ = w + 'ast';
  }

  // Superlativ bestemt: add -e, but not if already ends in -e
  const superBestemt = superlativ.endsWith('e') ? superlativ : superlativ + 'e';

  // Declension (same structure as NB, but with NN-specific rules)
  let noytrum, flertall, bestemt;

  if (w.endsWith('e')) {
    noytrum = w;
    flertall = w;
    bestemt = w;
  } else if (w.endsWith('ig') || w.endsWith('eg')) {
    // KEY NN DIFFERENCE: -ig/-eg adjectives do NOT add -t in neuter
    noytrum = w;
    flertall = w + 'e';
    bestemt = w + 'e';
  } else if (w.endsWith('sk')) {
    noytrum = w;
    flertall = w + 'e';
    bestemt = w + 'e';
  } else if (w.endsWith('t')) {
    noytrum = w;
    flertall = w + 'e';
    bestemt = w + 'e';
  } else if (w.endsWith('d') && w.length <= 5) {
    // Short -d adjectives: glad → glad (no -t in neuter)
    noytrum = w;
    flertall = w + 'e';
    bestemt = w + 'e';
  } else if (w.match(/(dd|tt|nn|mm|ll|ss|kk|pp)$/)) {
    noytrum = w;
    flertall = w + 'e';
    bestemt = w + 'e';
  } else {
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
        bestemt: superBestemt,
      },
    },
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN — Transform NB → NN
// ═══════════════════════════════════════════════════════════════════════════

console.log('Generating Norwegian Nynorsk (NN) lexicon from Bokmål (NB)...\n');

mkdirSync(NN_BASE, { recursive: true });

const nbToNnMap = {}; // Maps NB word ID → NN word ID (for link generation)
const bankNames = ['nounbank', 'verbbank', 'adjectivebank', 'generalbank'];
const nnBanks = {};
const stats = { total: 0, enriched: 0, skipped: 0 };

for (const bankName of bankNames) {
  const nbPath = join(NB_BASE, `${bankName}.json`);
  if (!existsSync(nbPath)) {
    console.log(`  Skipping ${bankName} (not found)`);
    continue;
  }

  const nbData = JSON.parse(readFileSync(nbPath, 'utf8'));
  const { _metadata, ...nbEntries } = nbData;

  const nnEntries = {};
  let enrichedCount = 0;

  for (const [nbId, nbEntry] of Object.entries(nbEntries)) {
    stats.total++;

    const nbWord = nbEntry.word;
    const type = nbEntry.type;

    // Transform word NB → NN
    let nnWord;

    if (type === 'verb') {
      // Check verb-specific replacements first (full word)
      nnWord = VERB_NB_TO_NN[nbWord.toLowerCase()];

      if (!nnWord) {
        // For multi-word verbs, transform each part independently
        const parts = nbWord.toLowerCase().split(' ');
        const transformedParts = parts.map((part, i) => {
          // First part is the verb — check verb map and a-infinitive
          if (i === 0) {
            if (VERB_NB_TO_NN[part]) return VERB_NB_TO_NN[part];
            if (shouldUseAInfinitive(part)) return part.slice(0, -1) + 'a';
            return nbToNnWord(part);
          }
          // Other parts are particles/pronouns — apply general word rules
          return nbToNnWord(part);
        });
        nnWord = transformedParts.join(' ');
      }

      // For single-word regular weak verbs: check if -e → -a
      if (!nnWord.includes(' ') && nnWord === nbWord.toLowerCase() && shouldUseAInfinitive(nbWord)) {
        nnWord = nbWord.toLowerCase().slice(0, -1) + 'a';
      }
    } else {
      // For non-verbs: transform each word in multi-word phrases too
      nnWord = nbWord.includes(' ') ? nbToNnPhrase(nbWord) : nbToNnWord(nbWord);
    }

    // Generate NN word ID
    const nnId = normalizeToId(nnWord, type);

    // Track mapping
    nbToNnMap[nbId] = nnId;

    // Build NN entry
    const nnEntry = {
      word: nnWord,
      type,
    };

    // Apply NN-specific morphology
    let enriched = false;

    if (type === 'noun') {
      if (nnWord.includes(' ') && nnWord.split(' ').length > 2) {
        stats.skipped++;
      } else {
        try {
          // Carry genus from NB if available
          const genus = nbEntry.genus || null;
          const enrichment = enrichNounNN(nnWord, genus);
          nnEntry.genus = enrichment.genus;
          nnEntry.plural = enrichment.plural;
          nnEntry.forms = enrichment.forms;
          enriched = true;
        } catch (e) {
          stats.skipped++;
        }
      }
    } else if (type === 'verb') {
      if (nnWord.includes(' ') && nnWord.split(' ').length > 3) {
        stats.skipped++;
      } else {
        try {
          const enrichment = enrichVerbNN(nnWord);
          nnEntry.verbClass = enrichment.verbClass;
          nnEntry.auxiliary = enrichment.auxiliary;
          nnEntry.conjugations = enrichment.conjugations;
          enriched = true;
        } catch (e) {
          stats.skipped++;
        }
      }
    } else if (type === 'adj') {
      if (nnWord.includes(' ') && nnWord.split(' ').length > 2) {
        stats.skipped++;
      } else {
        try {
          const enrichment = enrichAdjectiveNN(nnWord);
          nnEntry.comparison = enrichment.comparison;
          nnEntry.declension = enrichment.declension;
          enriched = true;
        } catch (e) {
          stats.skipped++;
        }
      }
    }

    nnEntry._enriched = enriched;
    nnEntry._nnSource = 'auto-nb';
    nnEntry._nbEquivalent = nbId;

    if (enriched) {
      enrichedCount++;
      stats.enriched++;
    }

    // Carry over non-grammar fields from NB
    if (nbEntry.cefr) nnEntry.cefr = nbEntry.cefr;
    if (nbEntry.frequency) nnEntry.frequency = nbEntry.frequency;
    if (nbEntry.tags) nnEntry.tags = nbEntry.tags;
    if (nbEntry.usageNotes) nnEntry.usageNotes = nbEntry.usageNotes;
    if (nbEntry._generatedFrom) nnEntry._generatedFrom = nbEntry._generatedFrom;

    nnEntries[nnId] = nnEntry;
  }

  // Sort alphabetically
  const sorted = {};
  for (const key of Object.keys(nnEntries).sort()) {
    sorted[key] = nnEntries[key];
  }

  const count = Object.keys(sorted).length;
  nnBanks[bankName] = count;

  // Write bank file
  const output = {
    _metadata: {
      language: 'nn',
      languageName: 'Norsk nynorsk',
      bank: bankName,
      generatedAt: new Date().toISOString(),
      description: `Norwegian Nynorsk ${bankName} — generated from Bokmål via NB→NN transformation`,
      totalEntries: count,
      enrichedEntries: enrichedCount,
      skeletonEntries: count - enrichedCount,
    },
    ...sorted,
  };

  const outPath = join(NN_BASE, `${bankName}.json`);
  writeFileSync(outPath, JSON.stringify(output, null, 2) + '\n');
  console.log(`  Wrote ${outPath} (${count} entries, ${enrichedCount} enriched)`);
}

// Write manifest
const totalWords = Object.values(nnBanks).reduce((a, b) => a + b, 0);
const manifest = {
  _metadata: {
    language: 'nn',
    languageName: 'Norsk nynorsk',
    generatedAt: new Date().toISOString(),
    description: 'Norwegian Nynorsk lexicon — Phase 8, derived from Bokmål via NB→NN transformation',
  },
  summary: {
    totalWords,
    enrichedWords: stats.enriched,
    skeletonWords: totalWords - stats.enriched,
  },
  banks: nnBanks,
  sources: ['nb (transformed)'],
};

writeFileSync(join(NN_BASE, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');

// Write NB→NN mapping for link generation
writeFileSync(
  join(NN_BASE, 'nb-to-nn-map.json'),
  JSON.stringify(nbToNnMap, null, 2) + '\n'
);

// Summary
console.log('\n=== Summary ===');
console.log(`  Total NB entries processed: ${stats.total}`);
console.log(`  NN entries generated:       ${totalWords}`);
console.log(`  Enriched (with grammar):    ${stats.enriched}`);
console.log(`  Skeleton (no grammar):      ${totalWords - stats.enriched}`);
for (const [bank, count] of Object.entries(nnBanks)) {
  console.log(`    ${bank}: ${count}`);
}
console.log(`\n  Output: ${NN_BASE}/`);
console.log(`  NB→NN mapping: ${join(NN_BASE, 'nb-to-nn-map.json')}`);
