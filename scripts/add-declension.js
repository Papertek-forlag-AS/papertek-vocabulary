/**
 * add-declension.js
 *
 * Phase 14-02: Inject complete 4-case declension data for all 331 German nouns
 * in the core nounbank. Replaces legacy flat bestemt/ubestemt format with new
 * forms.singular/plural structure.
 *
 * Target: vocabulary/core/de/nounbank.json
 *
 * Categories:
 *   - N-Deklination (weak) — 11 nouns
 *   - Plural-only — 3 nouns
 *   - Uncountable — 28 nouns (months + holidays + school subjects + substances)
 *   - -s plural exception — 26 nouns (dative plural = nominative plural)
 *   - Regular masculine (strong) — ~98 nouns
 *   - Regular feminine (strong) — ~105 nouns
 *   - Regular neuter (strong) — ~66 nouns
 *
 * Features assigned:
 *   - nominativ: "grammar_noun_declension"
 *   - genitiv: "grammar_genitiv"
 *   - akkusativ: no feature field
 *   - dativ: no feature field
 *
 * Intro values: Preserved from existing nominativ case data where present.
 *
 * Expected output: Added: 331, Skipped: 0, Missing: 0
 */
import { readFileSync, writeFileSync } from 'fs';

const NOUNBANK_PATH = 'vocabulary/core/de/nounbank.json';
const nounbank = JSON.parse(readFileSync(NOUNBANK_PATH, 'utf8'));

// ---------------------------------------------------------------------------
// Helper builders
// ---------------------------------------------------------------------------
// Article paradigm:
//        Nom    Akk    Dat    Gen
//  m:   der    den    dem    des  (+noun: -s/-es genitiv suffix; akk: den/einen)
//  f:   die    die    der    der  (no noun modification in any case)
//  n:   das    das    dem    des  (+noun: -s/-es genitiv suffix)
//  pl:  die    die    den    der  (dat pl: +n unless already -n or -s)
//
// Indef:
//  m: ein/einen/einem/eines
//  f: eine/eine/einer/einer
//  n: ein/ein/einem/eines
//  pl: bare noun (no article)

/**
 * Standard masculine noun (strong)
 * @param {string} word - nominativ singular (e.g. "Hund")
 * @param {string} plural - nominativ plural bare (e.g. "Hunde")
 * @param {string} genSuffix - suffix for genitiv singular (e.g. "es" or "s")
 */
function m(word, plural, genSuffix = 'es') {
  const datPl = _datPl(plural);
  return {
    declension_type: 'strong',
    cases: {
      nominativ: { forms: {
        singular: { definite: `der ${word}`, indefinite: `ein ${word}` },
        plural: { definite: `die ${plural}`, indefinite: plural },
      }},
      akkusativ: { forms: {
        singular: { definite: `den ${word}`, indefinite: `einen ${word}` },
        plural: { definite: `die ${plural}`, indefinite: plural },
      }},
      dativ: { forms: {
        singular: { definite: `dem ${word}`, indefinite: `einem ${word}` },
        plural: { definite: `den ${datPl}`, indefinite: datPl },
      }},
      genitiv: { forms: {
        singular: { definite: `des ${word}${genSuffix}`, indefinite: `eines ${word}${genSuffix}` },
        plural: { definite: `der ${plural}`, indefinite: plural },
      }},
    },
  };
}

/**
 * Standard feminine noun (strong)
 * @param {string} word - nominativ singular (e.g. "Katze")
 * @param {string} plural - nominativ plural bare (e.g. "Katzen")
 */
function f(word, plural) {
  const datPl = _datPl(plural);
  return {
    declension_type: 'strong',
    cases: {
      nominativ: { forms: {
        singular: { definite: `die ${word}`, indefinite: `eine ${word}` },
        plural: { definite: `die ${plural}`, indefinite: plural },
      }},
      akkusativ: { forms: {
        singular: { definite: `die ${word}`, indefinite: `eine ${word}` },
        plural: { definite: `die ${plural}`, indefinite: plural },
      }},
      dativ: { forms: {
        singular: { definite: `der ${word}`, indefinite: `einer ${word}` },
        plural: { definite: `den ${datPl}`, indefinite: datPl },
      }},
      genitiv: { forms: {
        singular: { definite: `der ${word}`, indefinite: `einer ${word}` },
        plural: { definite: `der ${plural}`, indefinite: plural },
      }},
    },
  };
}

/**
 * Standard neuter noun (strong)
 * @param {string} word - nominativ singular (e.g. "Kind")
 * @param {string} plural - nominativ plural bare (e.g. "Kinder")
 * @param {string} genSuffix - suffix for genitiv singular
 */
function n(word, plural, genSuffix = 'es') {
  const datPl = _datPl(plural);
  return {
    declension_type: 'strong',
    cases: {
      nominativ: { forms: {
        singular: { definite: `das ${word}`, indefinite: `ein ${word}` },
        plural: { definite: `die ${plural}`, indefinite: plural },
      }},
      akkusativ: { forms: {
        singular: { definite: `das ${word}`, indefinite: `ein ${word}` },
        plural: { definite: `die ${plural}`, indefinite: plural },
      }},
      dativ: { forms: {
        singular: { definite: `dem ${word}`, indefinite: `einem ${word}` },
        plural: { definite: `den ${datPl}`, indefinite: datPl },
      }},
      genitiv: { forms: {
        singular: { definite: `des ${word}${genSuffix}`, indefinite: `eines ${word}${genSuffix}` },
        plural: { definite: `der ${plural}`, indefinite: plural },
      }},
    },
  };
}

/**
 * N-Deklination noun (weak masculine)
 * -(e)n in ALL non-nominative singular; NO -s genitiv suffix
 * @param {string} word - nominativ singular (e.g. "Mensch")
 * @param {string} plural - nominativ plural bare (already ends in -(e)n)
 * @param {string} ending - suffix for non-nom singular ("en" or "n")
 */
function weak(word, plural, ending = 'en') {
  const nonNom = `${word}${ending}`;
  const datPl = _datPl(plural);
  return {
    declension_type: 'weak',
    cases: {
      nominativ: { forms: {
        singular: { definite: `der ${word}`, indefinite: `ein ${word}` },
        plural: { definite: `die ${plural}`, indefinite: plural },
      }},
      akkusativ: { forms: {
        singular: { definite: `den ${nonNom}`, indefinite: `einen ${nonNom}` },
        plural: { definite: `die ${plural}`, indefinite: plural },
      }},
      dativ: { forms: {
        singular: { definite: `dem ${nonNom}`, indefinite: `einem ${nonNom}` },
        plural: { definite: `den ${datPl}`, indefinite: datPl },
      }},
      genitiv: { forms: {
        // N-Deklination: NO -s suffix on genitiv — only -(e)n ending
        singular: { definite: `des ${nonNom}`, indefinite: `eines ${nonNom}` },
        plural: { definite: `der ${plural}`, indefinite: plural },
      }},
    },
  };
}

/**
 * Plural-only noun (e.g. Eltern, Ferien, Leute)
 * singular: null in all 4 cases
 * @param {string} plural - nominativ plural bare
 * @param {string} datPlForm - dative plural bare (may differ from nom pl)
 */
function pluralOnly(plural, datPlForm) {
  const datPl = datPlForm !== undefined ? datPlForm : _datPl(plural);
  return {
    declension_type: 'plural-only',
    cases: {
      nominativ: { forms: {
        singular: null,
        plural: { definite: `die ${plural}`, indefinite: plural },
      }},
      akkusativ: { forms: {
        singular: null,
        plural: { definite: `die ${plural}`, indefinite: plural },
      }},
      dativ: { forms: {
        singular: null,
        plural: { definite: `den ${datPl}`, indefinite: datPl },
      }},
      genitiv: { forms: {
        singular: null,
        plural: { definite: `der ${plural}`, indefinite: plural },
      }},
    },
  };
}

/**
 * Uncountable noun (no plural)
 * plural: null in all 4 cases
 * @param {string} word - nominativ singular
 * @param {'m'|'f'|'n'} genus
 */
function uncountable(word, genus) {
  const [nomArt, akkArt, datArt, genArt] =
    genus === 'm' ? ['der', 'den', 'dem', 'des'] :
    genus === 'f' ? ['die', 'die', 'der', 'der'] :
                   ['das', 'das', 'dem', 'des'];
  const [nomIndef, akkIndef, datIndef, genIndef] =
    genus === 'm' ? ['ein', 'einen', 'einem', 'eines'] :
    genus === 'f' ? ['eine', 'eine', 'einer', 'einer'] :
                   ['ein', 'ein', 'einem', 'eines'];
  // Genitiv suffix for m/n (no suffix for f)
  let genWord = word;
  if (genus === 'm' || genus === 'n') {
    // -es for monosyllabic or sibilant endings, -s for polysyllabic
    const sibilant = /[sßzx]$/i.test(word);
    const vowelCount = (word.match(/[aeiouäöü]/gi) || []).length;
    genWord = word + (sibilant || vowelCount <= 1 ? 'es' : 's');
  }
  return {
    declension_type: 'uncountable',
    cases: {
      nominativ: { forms: {
        singular: { definite: `${nomArt} ${word}`, indefinite: `${nomIndef} ${word}` },
        plural: null,
      }},
      akkusativ: { forms: {
        singular: { definite: `${akkArt} ${word}`, indefinite: `${akkIndef} ${word}` },
        plural: null,
      }},
      dativ: { forms: {
        singular: { definite: `${datArt} ${word}`, indefinite: `${datIndef} ${word}` },
        plural: null,
      }},
      genitiv: { forms: {
        singular: { definite: `${genArt} ${genWord}`, indefinite: `${genIndef} ${genWord}` },
        plural: null,
      }},
    },
  };
}

/**
 * Masculine noun with -s plural (dative plural = nominative plural, no -n added)
 */
function mS(word, plural, genSuffix = 's') {
  return {
    declension_type: 'strong',
    cases: {
      nominativ: { forms: {
        singular: { definite: `der ${word}`, indefinite: `ein ${word}` },
        plural: { definite: `die ${plural}`, indefinite: plural },
      }},
      akkusativ: { forms: {
        singular: { definite: `den ${word}`, indefinite: `einen ${word}` },
        plural: { definite: `die ${plural}`, indefinite: plural },
      }},
      dativ: { forms: {
        singular: { definite: `dem ${word}`, indefinite: `einem ${word}` },
        plural: { definite: `den ${plural}`, indefinite: plural }, // no -n added for -s plurals
      }},
      genitiv: { forms: {
        singular: { definite: `des ${word}${genSuffix}`, indefinite: `eines ${word}${genSuffix}` },
        plural: { definite: `der ${plural}`, indefinite: plural },
      }},
    },
  };
}

/**
 * Feminine noun with -s plural (dative plural = nominative plural, no -n added)
 */
function fS(word, plural) {
  return {
    declension_type: 'strong',
    cases: {
      nominativ: { forms: {
        singular: { definite: `die ${word}`, indefinite: `eine ${word}` },
        plural: { definite: `die ${plural}`, indefinite: plural },
      }},
      akkusativ: { forms: {
        singular: { definite: `die ${word}`, indefinite: `eine ${word}` },
        plural: { definite: `die ${plural}`, indefinite: plural },
      }},
      dativ: { forms: {
        singular: { definite: `der ${word}`, indefinite: `einer ${word}` },
        plural: { definite: `den ${plural}`, indefinite: plural }, // no -n added for -s plurals
      }},
      genitiv: { forms: {
        singular: { definite: `der ${word}`, indefinite: `einer ${word}` },
        plural: { definite: `der ${plural}`, indefinite: plural },
      }},
    },
  };
}

/**
 * Neuter noun with -s plural (dative plural = nominative plural, no -n added)
 */
function nS(word, plural, genSuffix = 's') {
  return {
    declension_type: 'strong',
    cases: {
      nominativ: { forms: {
        singular: { definite: `das ${word}`, indefinite: `ein ${word}` },
        plural: { definite: `die ${plural}`, indefinite: plural },
      }},
      akkusativ: { forms: {
        singular: { definite: `das ${word}`, indefinite: `ein ${word}` },
        plural: { definite: `die ${plural}`, indefinite: plural },
      }},
      dativ: { forms: {
        singular: { definite: `dem ${word}`, indefinite: `einem ${word}` },
        plural: { definite: `den ${plural}`, indefinite: plural }, // no -n added for -s plurals
      }},
      genitiv: { forms: {
        singular: { definite: `des ${word}${genSuffix}`, indefinite: `eines ${word}${genSuffix}` },
        plural: { definite: `der ${plural}`, indefinite: plural },
      }},
    },
  };
}

/**
 * Compute dative plural from nominative plural.
 * Add -n unless plural already ends in -n or -s.
 */
function _datPl(plural) {
  if (plural.endsWith('n') || plural.endsWith('s')) return plural;
  return plural + 'n';
}

// ---------------------------------------------------------------------------
// DECLENSION_DATA: complete data for all 331 nouns
// ---------------------------------------------------------------------------

const DECLENSION_DATA = {

  // =========================================================================
  // N-DEKLINATION (weak masculine) — 11 nouns
  // All take -(e)n in akkusativ/dativ/genitiv singular, NO -s genitiv suffix
  // =========================================================================

  superheld_noun:     weak('Superheld',     'Superhelden',     'en'),
  mensch_noun:        weak('Mensch',         'Menschen',        'en'),
  elefant_noun:       weak('Elefant',        'Elefanten',       'en'),
  loewe_noun:         weak('Löwe',           'Löwen',           'n'),
  affe_noun:          weak('Affe',           'Affen',           'n'),
  baer_noun:          weak('Bär',            'Bären',           'en'),
  klassenkamerad_noun:weak('Klassenkamerad', 'Klassenkameraden','en'),
  morgenmensch_noun:  weak('Morgenmensch',   'Morgenmenschen',  'en'),
  hase_noun:          weak('Hase',           'Hasen',           'n'),
  neffe_noun:         weak('Neffe',          'Neffen',          'n'),
  nachbar_noun:       weak('Nachbar',        'Nachbarn',        'n'), // -n not -en

  // =========================================================================
  // PLURAL-ONLY — 3 nouns  (singular: null in all 4 cases)
  // =========================================================================

  eltern_noun: pluralOnly('Eltern',  'Eltern'),   // dat pl: den Eltern (already ends -n)
  ferien_noun: pluralOnly('Ferien',  'Ferien'),   // dat pl: den Ferien (already ends -n)
  leute_noun:  pluralOnly('Leute',   'Leuten'),   // dat pl: den Leuten (+n)

  // =========================================================================
  // UNCOUNTABLE — 28 nouns  (plural: null in all 4 cases)
  // =========================================================================

  // School subjects
  mathematik_noun:  uncountable('Mathematik', 'f'),
  mathe_noun:       uncountable('Mathe',      'f'),
  biologie_noun:    uncountable('Biologie',   'f'),
  deutsch_noun:     uncountable('Deutsch',    'n'),
  politik_noun:     uncountable('Politik',    'f'),
  unterricht_noun:  uncountable('Unterricht', 'm'),
  musikunterricht_noun: uncountable('Musikunterricht', 'm'),
  sportunterricht_noun: uncountable('Sportunterricht', 'm'),

  // Substances / mass nouns
  milch_noun:   uncountable('Milch',   'f'),
  obst_noun:    uncountable('Obst',    'n'),
  fleisch_noun: uncountable('Fleisch', 'n'),
  wasser_noun:  uncountable('Wasser',  'n'),
  hunger_noun:  uncountable('Hunger',  'm'),
  stress_noun:  uncountable('Stress',  'm'),
  tennis_noun:  uncountable('Tennis',  'n'),

  // Appearance / abstract mass
  aussehen_noun: uncountable('Aussehen', 'n'),
  musik_noun:    uncountable('Musik',    'f'),
  wetter_noun:   uncountable('Wetter',   'n'),

  // Holidays (singular only in nounbank)
  weihnachten_noun: uncountable('Weihnachten', 'n'),
  ostern_noun:      uncountable('Ostern',      'n'),
  karneval_noun:    uncountable('Karneval',    'm'),
  halloween_noun:   uncountable('Halloween',   'n'),

  // Months (nounbank has plural: null)
  januar_noun:   uncountable('Januar',   'm'),
  februar_noun:  uncountable('Februar',  'm'),
  maerz_noun:    uncountable('März',     'm'),
  april_noun:    uncountable('April',    'm'),
  mai_noun:      uncountable('Mai',      'm'),
  juni_noun:     uncountable('Juni',     'm'),
  juli_noun:     uncountable('Juli',     'm'),
  august_noun:   uncountable('August',   'm'),
  september_noun:uncountable('September','m'),
  oktober_noun:  uncountable('Oktober',  'm'),
  november_noun: uncountable('November', 'm'),
  dezember_noun: uncountable('Dezember', 'm'),

  // =========================================================================
  // -s PLURAL NOUNS — 26 nouns
  // Dative plural = nominative plural (no -n suffix for -s plurals)
  // =========================================================================

  // Neuter -s plural
  auto_noun:       nS('Auto',       'Autos',       's'),
  foto_noun:       nS('Foto',       'Fotos',       's'),
  hobby_noun:      nS('Hobby',      'Hobbys',      's'),
  kino_noun:       nS('Kino',       'Kinos',       's'),
  cafe_noun:       nS('Café',       'Cafés',       's'),
  restaurant_noun: nS('Restaurant', 'Restaurants', 's'),
  eis_noun:        nS('Eis',        'Eis',         'es'), // des Eises
  muesli_noun:     nS('Müsli',      'Müslis',      's'),
  interview_noun:  nS('Interview',  'Interviews',  's'),
  baby_noun:       nS('Baby',       'Babys',       's'),
  highlight_noun:  nS('Highlight',  'Highlights',  's'),
  tshirt_noun:     nS('T-Shirt',    'T-Shirts',    's'),

  // Masculine -s plural
  park_noun:    mS('Park',    'Parks',    's'),
  blog_noun:    mS('Blog',    'Blogs',    's'),
  zoo_noun:     mS('Zoo',     'Zoos',     's'),
  test_noun:    mS('Test',    'Tests',    'es'),
  cousin_noun:  mS('Cousin',  'Cousins',  's'),
  tee_noun:     mS('Tee',     'Tees',     's'),
  kaffee_noun:  mS('Kaffee',  'Kaffees',  's'),
  joghurt_noun: mS('Joghurt', 'Joghurts', 's'),
  reis_noun:    mS('Reis',    'Reis',     'es'), // des Reises (rarely used but correct)

  // Feminine -s plural
  oma_noun:               fS('Oma',                'Omas'),
  sonnencreme_noun:       fS('Sonnencreme',         'Sonnencremes'),
  party_noun:             fS('Party',              'Partys'),
  ueberraschungsparty_noun: fS('Überraschungsparty','Überraschungspartys'),

  // Masculine with -s plural (Opa — kinship term, genus m, -s plural)
  opa_noun: mS('Opa', 'Opas', 's'),

  // =========================================================================
  // REGULAR MASCULINE (strong)
  // =========================================================================

  // Family / relationships
  vater_noun:     m('Vater',     'Väter',       's'),
  bruder_noun:    m('Bruder',    'Brüder',      's'),
  freund_noun:    m('Freund',    'Freunde',     'es'),
  sohn_noun:      m('Sohn',      'Söhne',       'es'),
  onkel_noun:     m('Onkel',     'Onkel',       's'),   // dat pl: den Onkeln
  grossvater_noun:m('Großvater', 'Großväter',   's'),
  ehemann_noun:   m('Ehemann',   'Ehemänner',   's'),
  enkel_noun:     m('Enkel',     'Enkel',       's'),   // dat pl: den Enkeln

  // People / roles
  kellner_noun:   m('Kellner',   'Kellner',     's'),   // dat pl: den Kellnern
  lehrer_noun:    m('Lehrer',    'Lehrer',      's'),
  tierpfleger_noun: m('Tierpfleger','Tierpfleger','s'),
  jaeger_noun:    m('Jäger',     'Jäger',       's'),
  schueler_noun:  m('Schüler',   'Schüler',     's'),
  mitschueler_noun:m('Mitschüler','Mitschüler',  's'),
  koerperteil_noun:m('Körperteil','Körperteile', 's'),
  bleistift_noun: m('Bleistift', 'Bleistifte',  's'),
  kugelschreiber_noun:m('Kugelschreiber','Kugelschreiber','s'),

  // Days of week
  montag_noun:   m('Montag',    'Montage',    's'),
  dienstag_noun: m('Dienstag',  'Dienstage',  's'),
  mittwoch_noun: m('Mittwoch',  'Mittwoche',  's'),
  donnerstag_noun:m('Donnerstag','Donnerstage','s'),
  freitag_noun:  m('Freitag',   'Freitage',   's'),
  samstag_noun:  m('Samstag',   'Samstage',   's'),
  sonntag_noun:  m('Sonntag',   'Sonntage',   's'),

  // Time / periods
  tag_noun:       m('Tag',       'Tage',        'es'),
  nachmittag_noun:m('Nachmittag','Nachmittage', 's'),
  abend_noun:     m('Abend',     'Abende',      's'),
  morgen_noun:    m('Morgen',    'Morgen',      's'),   // pl same as sg
  mittag_noun:    m('Mittag',    'Mittage',     's'),
  monat_noun:     m('Monat',     'Monate',      's'),

  // Nature / weather (masculine)
  regen_noun:   m('Regen',   'Regen',   's'),  // pl same as sg
  schnee_noun:  m('Schnee',  'Schnee',  's'),  // rarely plural
  himmel_noun:  m('Himmel',  'Himmel',  's'),
  nebel_noun:   m('Nebel',   'Nebel',   's'),
  grad_noun:    m('Grad',    'Grade',   's'),

  // Places
  supermarkt_noun: m('Supermarkt','Supermärkte','s'),
  flughafen_noun:  m('Flughafen', 'Flughäfen',  's'),
  berg_noun:       m('Berg',      'Berge',      'es'),
  see_noun:        m('See',       'Seen',       's'),
  ort_noun:        m('Ort',       'Orte',       'es'),
  hochsprung_noun: m('Hochsprung','Hochsprünge','s'),
  weitsprung_noun: m('Weitsprung','Weitsprünge','s'),
  strand_noun:     m('Strand',    'Strände',    's'),

  // Food / drinks (masculine)
  salat_noun:    m('Salat',    'Salate',     's'),
  hamburger_noun:m('Hamburger','Hamburger',  's'),
  kuchen_noun:   m('Kuchen',   'Kuchen',     's'),
  apfelsaft_noun:m('Apfelsaft','Apfelsäfte', 's'),
  kaese_noun:    m('Käse',     'Käse',       's'),
  saft_noun:     m('Saft',     'Säfte',      'es'),
  apfel_noun:    m('Apfel',    'Äpfel',      's'),

  // Clothing (masculine)
  pullover_noun: m('Pullover', 'Pullover', 's'),
  rock_noun:     m('Rock',     'Röcke',    'es'),
  schuhe_noun:   m('Schuh',    'Schuhe',   's'), // key is schuhe_noun, word is Schuh

  // Academic / school (masculine)
  charakter_noun:  m('Charakter',  'Charaktere',    's'),
  sport_noun:      m('Sport',      'Sportarten',    's'), // irregular plural
  fussball_noun:   m('Fußball',    'Fußbälle',      's'),
  plan_noun:       m('Plan',       'Pläne',         's'),
  vorschlag_noun:  m('Vorschlag',  'Vorschläge',    's'),
  spass_noun:      m('Spaß',       'Späße',         'es'),
  ball_noun:       m('Ball',       'Bälle',         's'),
  basketball_noun: m('Basketball', 'Basketbälle',   's'),
  meter_noun:      m('Meter',      'Meter',         's'), // pl same as sg
  wind_noun:       m('Wind',       'Winde',         'es'),
  lieblingssport_noun: m('Lieblingssport','Lieblingssportarten','s'),
  stundenplan_noun:m('Stundenplan','Stundenpläne',  's'),

  // Celebrations (masculine)
  brauch_noun:     m('Brauch',     'Bräuche',   's'),
  geburtstag_noun: m('Geburtstag', 'Geburtstage','s'),

  // Animals (masculine)
  hund_noun:    m('Hund',   'Hunde',  'es'),
  tiger_noun:   m('Tiger',  'Tiger',  's'),
  fisch_noun:   m('Fisch',  'Fische', 'es'),
  hamster_noun: m('Hamster','Hamster','s'),
  goldfisch_noun:m('Goldfisch','Goldfische','es'),
  vogel_noun:   m('Vogel',  'Vögel',  's'),
  hals_noun:    m('Hals',   'Hälse',  'es'),
  wolf_noun:    m('Wolf',   'Wölfe',  'es'),
  fuchs_noun:   m('Fuchs',  'Füchse', 'es'),

  // Home / furniture (masculine)
  spiegel_noun:   m('Spiegel', 'Spiegel', 's'),
  bus_noun:       m('Bus',     'Busse',   'ses'), // des Busses
  rucksack_noun:  m('Rucksack','Rucksäcke','s'),

  // Travel / outdoors (masculine)
  urlaub_noun: m('Urlaub', 'Urlaube', 's'),
  traum_noun:  m('Traum',  'Träume',  's'),
  koffer_noun: m('Koffer', 'Koffer',  's'),
  pass_noun:   m('Pass',   'Pässe',   'es'),
  sommer_noun: m('Sommer', 'Sommer',  's'),
  fruehling_noun:m('Frühling','Frühlinge','s'),
  herbst_noun: m('Herbst', 'Herbste', 's'),
  winter_noun: m('Winter', 'Winter',  's'),
  wecker_noun: m('Wecker', 'Wecker',  's'),

  // Other masculine
  garten_noun:  m('Garten',  'Gärten',  's'),
  platz_noun:   m('Platz',   'Plätze',  'es'),
  kaefig_noun:  m('Käfig',   'Käfige',  's'),
  film_noun:    m('Film',    'Filme',   's'),
  zahn_noun:    m('Zahn',    'Zähne',   'es'),
  kopf_noun:    m('Kopf',    'Köpfe',   'es'),
  mund_noun:    m('Mund',    'Münder',  'es'),

  // =========================================================================
  // REGULAR FEMININE (strong)
  // =========================================================================

  // Family
  mutter_noun:     f('Mutter',      'Mütter'),
  schwester_noun:  f('Schwester',   'Schwestern'),
  freundin_noun:   f('Freundin',    'Freundinnen'),
  tochter_noun:    f('Tochter',     'Töchter'),
  tante_noun:      f('Tante',       'Tanten'),
  grossmutter_noun:f('Großmutter',  'Großmütter'),
  ehefrau_noun:    f('Ehefrau',     'Ehefrauen'),
  enkelin_noun:    f('Enkelin',     'Enkelinnen'),
  nichte_noun:     f('Nichte',      'Nichten'),
  cousine_noun:    f('Cousine',     'Cousinen'),
  jaegerin_noun:   f('Jägerin',     'Jägerinnen'),
  mitschuelerin_noun:f('Mitschülerin','Mitschülerinnen'),
  schuelerin_noun: f('Schülerin',   'Schülerinnen'),
  frau_noun:       f('Frau',        'Frauen'),

  // School / academic (feminine)
  schule_noun:     f('Schule',      'Schulen'),
  note_noun:       f('Note',        'Noten'),
  klasse_noun:     f('Klasse',      'Klassen'),
  sprache_noun:    f('Sprache',     'Sprachen'),
  glocke_noun:     f('Glocke',      'Glocken'),
  gitarre_noun:    f('Gitarre',     'Gitarren'),
  grundschule_noun:f('Grundschule', 'Grundschulen'),
  realschule_noun: f('Realschule',  'Realschulen'),
  mathehausaufgabe_noun: f('Mathehausaufgabe','Mathehausaufgaben'),
  geschichtshausaufgabe_noun: f('Geschichtshausaufgabe','Geschichtshausaufgaben'),
  geschichte_noun: f('Geschichte',  'Geschichten'),
  hausaufgabe_noun:f('Hausaufgabe', 'Hausaufgaben'),
  aufgabe_noun:    f('Aufgabe',     'Aufgaben'),
  matheaufgabe_noun:f('Matheaufgabe','Matheaufgaben'),
  wahrheit_noun:   f('Wahrheit',    'Wahrheiten'),
  lerngruppe_noun: f('Lerngruppe',  'Lerngruppen'),
  notiz_noun:      f('Notiz',       'Notizen'),
  pruefung_noun:   f('Prüfung',     'Prüfungen'),
  pruefungen_noun: f('Prüfung',     'Prüfungen'), // alt key (plural in use as noun label)

  // Time (feminine)
  freizeit_noun:   f('Freizeit',    'Freizeiten'),
  stunde_noun:     f('Stunde',      'Stunden'),
  sekunde_noun:    f('Sekunde',     'Sekunden'),
  minute_noun:     f('Minute',      'Minuten'),
  uhrzeit_noun:    f('Uhrzeit',     'Uhrzeiten'),
  woche_noun:      f('Woche',       'Wochen'),
  nacht_noun:      f('Nacht',       'Nächte'),
  jahreszeit_noun: f('Jahreszeit',  'Jahreszeiten'),
  fahrradtour_noun:f('Fahrradtour', 'Fahrradtouren'),

  // Places (feminine)
  stadt_noun:      f('Stadt',       'Städte'),
  natur_noun:      f('Natur',       'Naturen'),
  seilbahn_noun:   f('Seilbahn',    'Seilbahnen'),
  sonne_noun:      f('Sonne',       'Sonnen'),
  schultasche_noun:f('Schultasche', 'Schultaschen'),

  // Food (feminine)
  banane_noun:     f('Banane',      'Bananen'),
  flasche_noun:    f('Flasche',     'Flaschen'),
  schokolade_noun: f('Schokolade',  'Schokoladen'),
  gurke_noun:      f('Gurke',       'Gurken'),
  tomate_noun:     f('Tomate',      'Tomaten'),
  nudeln_noun:     f('Nudel',       'Nudeln'),   // sing: Nudel, key: nudeln_noun
  tomatensosse_noun:f('Tomatensoße','Tomatensoßen'),
  zwiebel_noun:    f('Zwiebel',     'Zwiebeln'),
  pizza_noun:      f('Pizza',       'Pizzen'),
  rechnung_noun:   f('Rechnung',    'Rechnungen'),
  kartoffel_noun:  f('Kartoffel',   'Kartoffeln'),
  orange_noun:     f('Orange',      'Orangen'),
  birne_noun:      f('Birne',       'Birnen'),
  suppe_noun:      f('Suppe',       'Suppen'),

  // Clothing (feminine)
  hose_noun:       f('Hose',        'Hosen'),
  jacke_noun:      f('Jacke',       'Jacken'),
  farbe_noun:      f('Farbe',       'Farben'),

  // Body (feminine)
  nase_noun:       f('Nase',        'Nasen'),
  groesse_noun:    f('Größe',       'Größen'),
  persoenlichkeit_noun:f('Persönlichkeit','Persönlichkeiten'),

  // Celebrations / events (feminine)
  geburtstagstorte_noun:f('Geburtstagstorte','Geburtstagstorten'),
  tradition_noun:  f('Tradition',   'Traditionen'),
  freundschaft_noun:f('Freundschaft','Freundschaften'),
  adresse_noun:    f('Adresse',     'Adressen'),

  // Daily routine (feminine)
  morgenroutine_noun:f('Morgenroutine','Morgenroutinen'),
  marmelade_noun:  f('Marmelade',   'Marmeladen'),
  zahnbuerste_noun:f('Zahnbürste',  'Zahnbürsten'),
  dusche_noun:     f('Dusche',      'Duschen'),
  uhr_noun:        f('Uhr',         'Uhren'),
  tafel_noun:      f('Tafel',       'Tafeln'),

  // Nature / weather (feminine)
  wolke_noun:      f('Wolke',       'Wolken'),
  temperatur_noun: f('Temperatur',  'Temperaturen'),
  sommerferien_noun:f('Sommerferien','Sommerferien'), // plural-ish form but treated as f

  // Travel (feminine)
  badesachen_noun:    f('Badesachen',    'Badesachen'),   // pl form used as noun
  sommerkleidung_noun:f('Sommerkleidung','Sommerkleidungen'),

  // Abstract / misc (feminine)
  familie_noun:    f('Familie',     'Familien'),
  frage_noun:      f('Frage',       'Fragen'),
  regel_noun:      f('Regel',       'Regeln'),
  zeit_noun:       f('Zeit',        'Zeiten'),
  arbeit_noun:     f('Arbeit',      'Arbeiten'),
  tuer_noun:       f('Tür',         'Türen'),
  idee_noun:       f('Idee',        'Ideen'),
  hilfe_noun:      f('Hilfe',       'Hilfen'),
  zusammenfassung_noun:f('Zusammenfassung','Zusammenfassungen'),
  arbeid_paagar_noun: f('Arbeit im Gange','Arbeiten'), // special entry

  // Animals (feminine)
  katze_noun:      f('Katze',       'Katzen'),
  maus_noun:       f('Maus',        'Mäuse'),
  schlange_noun:   f('Schlange',    'Schlangen'),
  schildkroete_noun:f('Schildkröte','Schildkröten'),
  kuh_noun:        f('Kuh',         'Kühe'),
  ente_noun:       f('Ente',        'Enten'),
  giraffe_noun:    f('Giraffe',     'Giraffen'),

  // =========================================================================
  // REGULAR NEUTER (strong)
  // =========================================================================

  // Family (neuter)
  geschwister_noun: n('Geschwister', 'Geschwister', 's'),
  kind_noun:        n('Kind',        'Kinder',      'es'),

  // School (neuter)
  lieblingsfach_noun:  n('Lieblingsfach',  'Lieblingsfächer', 's'),
  wochenende_noun:     n('Wochenende',     'Wochenenden',     's'),
  computerspiel_noun:  n('Computerspiel',  'Computerspiele',  's'),
  schuljahr_noun:      n('Schuljahr',      'Schuljahre',      's'),
  projekt_noun:        n('Projekt',        'Projekte',        's'),
  biologiebuch_noun:   n('Biologiebuch',   'Biologiebücher',  's'),
  turnier_noun:        n('Turnier',        'Turniere',        's'),
  heft_noun:           n('Heft',           'Hefte',           's'),
  klassenzimmer_noun:  n('Klassenzimmer',  'Klassenzimmer',   's'),
  spiel_noun:          n('Spiel',          'Spiele',          's'),
  klavier_noun:        n('Klavier',        'Klaviere',        's'),
  fahrrad_noun:        n('Fahrrad',        'Fahrräder',       's'),

  // Food / meals (neuter)
  brot_noun:       n('Brot',       'Brote',      'es'),
  gemuese_noun:    n('Gemüse',     'Gemüse',     's'),
  ei_noun:         n('Ei',         'Eier',       's'), // des Eis (monosyllabic but not sibilant)
  abendessen_noun: n('Abendessen', 'Abendessen', 's'),
  fruehstueck_noun:n('Frühstück',  'Frühstücke', 's'),
  mittagessen_noun:n('Mittagessen','Mittagessen', 's'),

  // Clothing (neuter)
  hemd_noun: n('Hemd',  'Hemden', 's'),
  kleid_noun:n('Kleid', 'Kleider','s'),

  // Body (neuter)
  auge_noun: n('Auge',  'Augen',  's'),
  haar_noun: n('Haar',  'Haare',  's'),

  // Animals (neuter)
  kaninchen_noun:  n('Kaninchen', 'Kaninchen', 's'),
  tier_noun:       n('Tier',      'Tiere',     's'),
  haustier_noun:   n('Haustier',  'Haustiere', 's'),
  das_haustier_noun:n('Haustier', 'Haustiere', 's'), // alt key
  futter_noun:     n('Futter',    'Futter',    's'),
  fell_noun:       n('Fell',      'Felle',     's'),
  aquarium_noun:   n('Aquarium',  'Aquarien',  's'),
  lieblingstier_noun:n('Lieblingstier','Lieblingstiere','s'),
  pferd_noun:      n('Pferd',     'Pferde',    's'),
  schwein_noun:    n('Schwein',   'Schweine',  's'),
  huhn_noun:       n('Huhn',      'Hühner',    's'),
  schaf_noun:      n('Schaf',     'Schafe',    's'),

  // Other neuter (misc)
  essen_noun:   n('Essen',   'Essen',   's'),
  leben_noun:   n('Leben',   'Leben',   's'),
  viertel_noun: n('Viertel', 'Viertel', 's'),
  jahr_noun:    n('Jahr',    'Jahre',   's'),

  // Geography / travel (neuter)
  gebirge_noun:     n('Gebirge',    'Gebirge',    's'),
  flugzeug_noun:    n('Flugzeug',   'Flugzeuge',  's'),
  reiseziel_noun:   n('Reiseziel',  'Reiseziele', 's'),
  schwimmbad_noun:  n('Schwimmbad', 'Schwimmbäder','s'),

  // Celebrations / events (neuter)
  geschenk_noun:    n('Geschenk',   'Geschenke',  's'),
  fest_noun:        n('Fest',       'Feste',      's'),
  geburtstagskind_noun:n('Geburtstagskind','Geburtstagskinder','s'),
  kompliment_noun:  n('Kompliment', 'Komplimente','s'),
  schokoladenei_noun:n('Schokoladenei','Schokoladeneier','s'),

  // Abstract / misc (neuter)
  geheimnis_noun: n('Geheimnis', 'Geheimnisse', 'ses'), // des Geheimnisses
  getraenk_noun:  n('Getränk',   'Getränke',    's'),
  problem_noun:   n('Problem',   'Probleme',    's'),
  gefuehl_noun:   n('Gefühl',    'Gefühle',     's'),

  // Home (neuter)
  bett_noun:         n('Bett',         'Betten',         's'),
  haus_noun:         n('Haus',         'Häuser',         'es'), // des Hauses
  wohnzimmer_noun:   n('Wohnzimmer',   'Wohnzimmer',     's'),
  zimmer_noun:       n('Zimmer',       'Zimmer',         's'),
  badezimmer_noun:   n('Badezimmer',   'Badezimmer',     's'),

  // Other neuter
  broetchen_noun: n('Brötchen', 'Brötchen', 's'),
  buch_noun:      n('Buch',     'Bücher',   's'),
  konzert_noun:   n('Konzert',  'Konzerte', 's'),
  theater_noun:   n('Theater',  'Theater',  's'),

  // Misc neuter that need specific forms
  gewitter_noun: n('Gewitter', 'Gewitter', 's'),


};


// ---------------------------------------------------------------------------
// Inject declension into nounbank
// ---------------------------------------------------------------------------

let added = 0;
let skipped = 0;
const missing = [];

for (const [key, declData] of Object.entries(DECLENSION_DATA)) {
  if (!nounbank[key]) {
    console.warn(`MISSING FROM NOUNBANK: ${key}`);
    missing.push(key);
    skipped++;
    continue;
  }

  // Preserve existing intro value from nominativ case entry
  const existingIntro = nounbank[key].cases?.nominativ?.intro;

  // Set declension_type
  nounbank[key].declension_type = declData.declension_type;

  // Build the new nominativ case: merge feature + intro
  const newNominativ = {
    ...declData.cases.nominativ,
    feature: 'grammar_noun_declension',
  };
  if (existingIntro !== undefined) {
    newNominativ.intro = existingIntro;
  }

  // Build the new genitiv case: add feature
  const newGenitiv = {
    ...declData.cases.genitiv,
    feature: 'grammar_genitiv',
  };

  // Replace cases entirely with new structure
  nounbank[key].cases = {
    nominativ: newNominativ,
    akkusativ: { ...declData.cases.akkusativ },
    dativ:     { ...declData.cases.dativ },
    genitiv:   newGenitiv,
  };

  added++;
}

writeFileSync(NOUNBANK_PATH, JSON.stringify(nounbank, null, 2));

console.log(`Added: ${added}, Skipped: ${skipped}, Missing: ${missing.length}`);

if (missing.length > 0) {
  console.error('Missing keys:', missing);
  process.exit(1);
}
