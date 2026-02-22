/**
 * fix-verb-fields.js
 *
 * Phase 16 DATA-02 + DATA-03: Classify verb types, add presens conjugations, sync to dict.
 *
 * Part A — Type Classification (DATA-02):
 *   - All 148 core verbbank entries get a type field
 *   - Priority: reflexive > separable > modal > irregular > regular
 *   - Reclassifies: strong → irregular, weak → regular (with exceptions)
 *   - Tags array for secondary traits on multi-trait verbs
 *
 * Part B — Presens Conjugations (DATA-03):
 *   - 12 non-verbphrase verbs missing presens get complete presens.former objects
 *
 * Part C — Sync to Dict Verbbank:
 *   - Mirrors type, tags, presens changes from core to dict for matching entries
 *
 * Source: vocabulary/core/de/verbbank.json
 * Target: vocabulary/dictionary/de/verbbank.json
 */
import { readFileSync, writeFileSync } from 'fs';

const CORE_PATH = 'vocabulary/core/de/verbbank.json';
const DICT_PATH = 'vocabulary/dictionary/de/verbbank.json';

const core = JSON.parse(readFileSync(CORE_PATH, 'utf8'));
const dict = JSON.parse(readFileSync(DICT_PATH, 'utf8'));

// ============================================================
// PART A — TYPE CLASSIFICATION
// ============================================================

// Explicit type map: entries that require non-default classification.
// Priority order: reflexive > separable > modal > irregular > regular

const VERBPHRASE_KEYS = new Set([
  'rad_fahren_verbphrase',
  'musik_hoeren_verbphrase',
  'gassi_gehen_verbphrase',
  'fertig_werden_verbphrase',
]);

const MODAL_KEYS = new Set([
  'moegen_verb',
  'koennen_verb',
  'muessen_verb',
  'wollen_verb',
  'duerfen_verb',
  'sollen_verb',
  'moechten_modal',
]);

// Separable non-reflexive verbs (identified from bank keys + separable flag)
// Format: key => tags (optional secondary traits)
const SEPARABLE_MAP = {
  anfangen_verb:        ['irregular'],  // fängt an (a→ä), strong
  anrufen_verb:         ['irregular'],  // rief an, strong
  aufwachen_verb:       [],             // regular conjugation
  aufstehen_verb:       ['irregular'],  // stand auf, strong
  aufraeumen_verb:      [],             // regular conjugation
  ausziehen_verb:       ['irregular'],  // zog aus, strong
  einladen_verb:        ['irregular'],  // lud ein, strong
  einpacken_verb:       [],             // regular conjugation
  einkaufen_verb:       [],             // regular conjugation
  einschlafen_verb:     ['irregular'],  // schlief ein, strong (a→ä in presens)
  fernsehen_verb:       ['irregular'],  // sieht fern (e→ie), strong
  mitnehmen_verb:       ['irregular'],  // nimmt mit (e→i), strong
  mitbringen_verb:      ['irregular'],  // brachte mit, mixed
  mitkommen_verb:       ['irregular'],  // kam mit, strong
  wegfahren_verb:       ['irregular'],  // fährt weg (a→ä), strong
  liegen_bleiben_verb:  ['irregular'],  // bleibt liegen, strong compound
  spazieren_gehen_verb: ['irregular'],  // geht spazieren, strong compound
  zaehneputzen_verb:    [],             // putzen is regular
};

// Reflexive verbs: all sich_ prefix keys
// Secondary tags for separable or irregular forms
const REFLEXIVE_TAGS = {
  sich_treffen_verb:    ['irregular'],  // traf (strong)
  sich_waschen_verb:    ['irregular'],  // wusch (strong)
  sich_anziehen_verb:   ['separable', 'irregular'],  // separable + zog (strong)
  sich_aufregen_verb:   ['separable'],  // separable, regular conjugation
  sich_ausruhen_verb:   ['separable'],  // separable, regular conjugation
  sich_vorbereiten_verb:['separable'],  // separable, regular conjugation
  sich_unterhalten_verb:['irregular'],  // unterhielt (strong)
};

// Explicitly irregular verbs (strong stems, formerly "strong" or untyped)
const IRREGULAR_KEYS = new Set([
  // Was "strong" — reclassify
  'sein_verb',
  'lesen_verb',
  'essen_verb',
  'nehmen_verb',
  'haben_verb',
  'fressen_verb',
  'tragen_verb',
  'sehen_verb',
  'treffen_verb',
  'fahren_verb',
  'schreiben_verb',
  'sprechen_verb',
  'werden_verb',
  'schlafen_verb',
  'sitzen_verb',
  'verstehen_verb',
  'helfen_verb',
  'liegen_verb',
  'wissen_verb',
  'geben_verb',
  'vergessen_verb',
  'klingen_verb',
  'stehen_verb',
  'laufen_verb',
  'springen_verb',
  'gewinnen_verb',
  'verlieren_verb',
  'versprechen_verb',
  // Untyped but irregular
  'finden_verb',      // fand
  'beginnen_verb',    // begann
  'schwimmen_verb',   // schwamm
  'singen_verb',      // sang
  'trinken_verb',     // trank
  'fliegen_verb',     // flog
  'scheinen_verb',    // schien
  'bleiben_verb',     // blieb
  'bringen_verb',     // brachte (mixed)
  'kennen_verb',      // kannte (mixed)
  'bekommen_verb',    // bekam (inseparable irregular)
  'gehen_verb',       // ging
]);

// Counters
let reclassified = 0;    // strong/weak → new type
let newlyTyped = 0;      // untyped → type
let presensAdded = 0;
let tagsAdded = 0;

// ============================================================
// Classify a single entry
// ============================================================
function classifyEntry(key, entry) {
  const wasTyped = entry.type !== undefined;
  const oldType = entry.type;
  let newType = null;
  let newTags = null;

  if (VERBPHRASE_KEYS.has(key)) {
    newType = 'verbphrase';
  } else if (MODAL_KEYS.has(key)) {
    newType = 'modal';
  } else if (key.startsWith('sich_')) {
    newType = 'reflexive';
    if (REFLEXIVE_TAGS[key] && REFLEXIVE_TAGS[key].length > 0) {
      newTags = REFLEXIVE_TAGS[key];
    }
  } else if (SEPARABLE_MAP.hasOwnProperty(key)) {
    newType = 'separable';
    if (SEPARABLE_MAP[key].length > 0) {
      newTags = SEPARABLE_MAP[key];
    }
  } else if (IRREGULAR_KEYS.has(key)) {
    newType = 'irregular';
  } else {
    // Everything else: regular (formerly "weak" or untyped regular)
    newType = 'regular';
  }

  // Track stats
  if (wasTyped && oldType !== newType) {
    reclassified++;
  } else if (!wasTyped) {
    newlyTyped++;
  }

  if (newTags) tagsAdded++;

  return { newType, newTags };
}

// ============================================================
// PART B — PRESENS CONJUGATIONS
// ============================================================

const PRESENS_DATA = {
  reisen_verb: {
    former: {
      'ich': 'reise',
      'du': 'reist',
      'er/sie/es': 'reist',
      'wir': 'reisen',
      'ihr': 'reist',
      'sie/Sie': 'reisen',
    },
    feature: 'grammar_presens',
  },
  fernsehen_verb: {
    former: {
      'ich': 'sehe fern',
      'du': 'siehst fern',
      'er/sie/es': 'sieht fern',
      'wir': 'sehen fern',
      'ihr': 'seht fern',
      'sie/Sie': 'sehen fern',
    },
    feature: 'grammar_presens',
  },
  bekommen_verb: {
    former: {
      'ich': 'bekomme',
      'du': 'bekommst',
      'er/sie/es': 'bekommt',
      'wir': 'bekommen',
      'ihr': 'bekommt',
      'sie/Sie': 'bekommen',
    },
    feature: 'grammar_presens',
  },
  klettern_verb: {
    former: {
      'ich': 'klettere',
      'du': 'kletterst',
      'er/sie/es': 'klettert',
      'wir': 'klettern',
      'ihr': 'klettert',
      'sie/Sie': 'klettern',
    },
    feature: 'grammar_presens',
  },
  wegfahren_verb: {
    former: {
      'ich': 'fahre weg',
      'du': 'fährst weg',
      'er/sie/es': 'fährt weg',
      'wir': 'fahren weg',
      'ihr': 'fahrt weg',
      'sie/Sie': 'fahren weg',
    },
    feature: 'grammar_presens',
  },
  liegen_bleiben_verb: {
    former: {
      'ich': 'bleibe liegen',
      'du': 'bleibst liegen',
      'er/sie/es': 'bleibt liegen',
      'wir': 'bleiben liegen',
      'ihr': 'bleibt liegen',
      'sie/Sie': 'bleiben liegen',
    },
    feature: 'grammar_presens',
  },
  sich_aergern_ueber_verb: {
    former: {
      'ich': 'ärgere mich über',
      'du': 'ärgerst dich über',
      'er/sie/es': 'ärgert sich über',
      'wir': 'ärgern uns über',
      'ihr': 'ärgert euch über',
      'sie/Sie': 'ärgern sich über',
    },
    feature: 'grammar_presens',
  },
  mitkommen_verb: {
    former: {
      'ich': 'komme mit',
      'du': 'kommst mit',
      'er/sie/es': 'kommt mit',
      'wir': 'kommen mit',
      'ihr': 'kommt mit',
      'sie/Sie': 'kommen mit',
    },
    feature: 'grammar_presens',
  },
  spazieren_gehen_verb: {
    former: {
      'ich': 'gehe spazieren',
      'du': 'gehst spazieren',
      'er/sie/es': 'geht spazieren',
      'wir': 'gehen spazieren',
      'ihr': 'geht spazieren',
      'sie/Sie': 'gehen spazieren',
    },
    feature: 'grammar_presens',
  },
  zaehneputzen_verb: {
    // Following established preteritum pattern: "putzte Zähne"
    former: {
      'ich': 'putze Zähne',
      'du': 'putzt Zähne',
      'er/sie/es': 'putzt Zähne',
      'wir': 'putzen Zähne',
      'ihr': 'putzt Zähne',
      'sie/Sie': 'putzen Zähne',
    },
    feature: 'grammar_presens',
  },
  ausziehen_verb: {
    former: {
      'ich': 'ziehe aus',
      'du': 'ziehst aus',
      'er/sie/es': 'zieht aus',
      'wir': 'ziehen aus',
      'ihr': 'zieht aus',
      'sie/Sie': 'ziehen aus',
    },
    feature: 'grammar_presens',
  },
  einschlafen_verb: {
    former: {
      'ich': 'schlafe ein',
      'du': 'schläfst ein',
      'er/sie/es': 'schläft ein',
      'wir': 'schlafen ein',
      'ihr': 'schlaft ein',
      'sie/Sie': 'schlafen ein',
    },
    feature: 'grammar_presens',
  },
};

// ============================================================
// APPLY CHANGES TO CORE VERBBANK
// ============================================================

// Track which keys were modified (for dict sync)
const modifiedKeys = new Set();

for (const key of Object.keys(core)) {
  if (key === '_metadata') continue;

  const entry = core[key];
  const { newType, newTags } = classifyEntry(key, entry);

  let modified = false;

  // Apply type
  if (entry.type !== newType) {
    entry.type = newType;
    modified = true;
  }

  // Apply tags (only if present)
  if (newTags && newTags.length > 0) {
    entry.tags = newTags;
    modified = true;
  } else if (entry.tags !== undefined && (!newTags || newTags.length === 0)) {
    // Remove any existing tags if no secondary traits
    delete entry.tags;
    modified = true;
  }

  // Apply presens conjugation (Part B)
  if (PRESENS_DATA[key]) {
    if (!entry.conjugations) entry.conjugations = {};

    // Place presens FIRST in conjugations
    const existingConjs = { ...entry.conjugations };
    entry.conjugations = {
      presens: PRESENS_DATA[key],
      ...existingConjs,
    };
    presensAdded++;
    modified = true;
  }

  if (modified) modifiedKeys.add(key);
}

// ============================================================
// PART C — SYNC TO DICT VERBBANK
// ============================================================

let dictSynced = 0;
let dictSkipped = 0;

for (const key of modifiedKeys) {
  if (key === '_metadata') continue;

  const coreEntry = core[key];
  const dictEntry = dict[key];

  if (!dictEntry) {
    dictSkipped++;
    continue;
  }

  // Sync type
  if (coreEntry.type !== undefined) {
    dict[key].type = coreEntry.type;
  }

  // Sync tags
  if (coreEntry.tags && coreEntry.tags.length > 0) {
    dict[key].tags = coreEntry.tags;
  } else if (dict[key].tags !== undefined) {
    delete dict[key].tags;
  }

  // Sync presens
  if (coreEntry.conjugations?.presens) {
    dict[key].conjugations = {
      presens: coreEntry.conjugations.presens,
      ...(dictEntry.conjugations || {}),
    };
  }

  dictSynced++;
}

// ============================================================
// WRITE OUTPUT
// ============================================================

writeFileSync(CORE_PATH, JSON.stringify(core, null, 2));
writeFileSync(DICT_PATH, JSON.stringify(dict, null, 2));

console.log('=== fix-verb-fields.js complete ===');
console.log(`Reclassified (strong/weak → new type): ${reclassified}`);
console.log(`Newly typed (was untyped): ${newlyTyped}`);
console.log(`Tags arrays added: ${tagsAdded}`);
console.log(`Presens conjugations added: ${presensAdded}`);
console.log(`Dict entries synced: ${dictSynced}, skipped (not in dict): ${dictSkipped}`);
