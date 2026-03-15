/**
 * Enrich ES and FR verb conjugations:
 *   - Restructure presens from flat arrays to pronoun-labeled objects
 *   - Add pretérito indefinido / passé composé tenses
 *   - Add verb class (group)
 *   - Add grammar feature references
 *
 * For preteritum and perfektum, uses rule-based generation for regular verbs
 * and a lookup table for common irregular verbs.
 *
 * Usage:
 *   node scripts/enrich-es-fr-verbs.js [--dry-run] [es|fr]
 */

import fs from 'fs';
import path from 'path';

// ========== SPANISH ==========

const ES_PRONOUNS = ['yo', 'tú', 'él/ella', 'nosotros', 'vosotros', 'ellos/ellas'];

// Pretérito indefinido (simple past) — regular conjugation
function esPreteritumRegular(stem, group) {
  if (group === 'ar') {
    return { yo: stem + 'é', tú: stem + 'aste', 'él/ella': stem + 'ó', nosotros: stem + 'amos', vosotros: stem + 'asteis', 'ellos/ellas': stem + 'aron' };
  } else {
    // -er and -ir share the same preteritum endings
    return { yo: stem + 'í', tú: stem + 'iste', 'él/ella': stem + 'ió', nosotros: stem + 'imos', vosotros: stem + 'isteis', 'ellos/ellas': stem + 'ieron' };
  }
}

// Participio pasado — regular
function esParticiple(stem, group) {
  if (group === 'ar') return stem + 'ado';
  return stem + 'ido';
}

// Perfektum (pretérito perfecto): he/has/ha/hemos/habéis/han + participio
function esPerfektum(participle) {
  return {
    participle,
    auxiliary: 'haber',
    former: {
      yo: 'he ' + participle,
      tú: 'has ' + participle,
      'él/ella': 'ha ' + participle,
      nosotros: 'hemos ' + participle,
      vosotros: 'habéis ' + participle,
      'ellos/ellas': 'han ' + participle,
    },
  };
}

// Common Spanish irregular verbs
const ES_IRREGULARS = {
  ser_verb: {
    group: 'irregular',
    preteritum: { yo: 'fui', tú: 'fuiste', 'él/ella': 'fue', nosotros: 'fuimos', vosotros: 'fuisteis', 'ellos/ellas': 'fueron' },
    participle: 'sido',
  },
  estar_verb: {
    group: 'irregular',
    preteritum: { yo: 'estuve', tú: 'estuviste', 'él/ella': 'estuvo', nosotros: 'estuvimos', vosotros: 'estuvisteis', 'ellos/ellas': 'estuvieron' },
    participle: 'estado',
  },
  tener_verb: {
    group: 'irregular',
    preteritum: { yo: 'tuve', tú: 'tuviste', 'él/ella': 'tuvo', nosotros: 'tuvimos', vosotros: 'tuvisteis', 'ellos/ellas': 'tuvieron' },
    participle: 'tenido',
  },
  hacer_verb: {
    group: 'irregular',
    preteritum: { yo: 'hice', tú: 'hiciste', 'él/ella': 'hizo', nosotros: 'hicimos', vosotros: 'hicisteis', 'ellos/ellas': 'hicieron' },
    participle: 'hecho',
  },
  ir_verb: {
    group: 'irregular',
    preteritum: { yo: 'fui', tú: 'fuiste', 'él/ella': 'fue', nosotros: 'fuimos', vosotros: 'fuisteis', 'ellos/ellas': 'fueron' },
    participle: 'ido',
  },
  poder_verb: {
    group: 'irregular',
    preteritum: { yo: 'pude', tú: 'pudiste', 'él/ella': 'pudo', nosotros: 'pudimos', vosotros: 'pudisteis', 'ellos/ellas': 'pudieron' },
    participle: 'podido',
  },
  querer_verb: {
    group: 'irregular',
    preteritum: { yo: 'quise', tú: 'quisiste', 'él/ella': 'quiso', nosotros: 'quisimos', vosotros: 'quisisteis', 'ellos/ellas': 'quisieron' },
    participle: 'querido',
  },
  saber_verb: {
    group: 'irregular',
    preteritum: { yo: 'supe', tú: 'supiste', 'él/ella': 'supo', nosotros: 'supimos', vosotros: 'supisteis', 'ellos/ellas': 'supieron' },
    participle: 'sabido',
  },
  decir_verb: {
    group: 'irregular',
    preteritum: { yo: 'dije', tú: 'dijiste', 'él/ella': 'dijo', nosotros: 'dijimos', vosotros: 'dijisteis', 'ellos/ellas': 'dijeron' },
    participle: 'dicho',
  },
  venir_verb: {
    group: 'irregular',
    preteritum: { yo: 'vine', tú: 'viniste', 'él/ella': 'vino', nosotros: 'vinimos', vosotros: 'vinisteis', 'ellos/ellas': 'vinieron' },
    participle: 'venido',
  },
  dar_verb: {
    group: 'irregular',
    preteritum: { yo: 'di', tú: 'diste', 'él/ella': 'dio', nosotros: 'dimos', vosotros: 'disteis', 'ellos/ellas': 'dieron' },
    participle: 'dado',
  },
  ver_verb: {
    group: 'irregular',
    preteritum: { yo: 'vi', tú: 'viste', 'él/ella': 'vio', nosotros: 'vimos', vosotros: 'visteis', 'ellos/ellas': 'vieron' },
    participle: 'visto',
  },
  poner_verb: {
    group: 'irregular',
    preteritum: { yo: 'puse', tú: 'pusiste', 'él/ella': 'puso', nosotros: 'pusimos', vosotros: 'pusisteis', 'ellos/ellas': 'pusieron' },
    participle: 'puesto',
  },
  salir_verb: {
    group: 'irregular',
    preteritum: { yo: 'salí', tú: 'saliste', 'él/ella': 'salió', nosotros: 'salimos', vosotros: 'salisteis', 'ellos/ellas': 'salieron' },
    participle: 'salido',
  },
  traer_verb: {
    group: 'irregular',
    preteritum: { yo: 'traje', tú: 'trajiste', 'él/ella': 'trajo', nosotros: 'trajimos', vosotros: 'trajisteis', 'ellos/ellas': 'trajeron' },
    participle: 'traído',
  },
  conducir_verb: {
    group: 'irregular',
    preteritum: { yo: 'conduje', tú: 'condujiste', 'él/ella': 'condujo', nosotros: 'condujimos', vosotros: 'condujisteis', 'ellos/ellas': 'condujeron' },
    participle: 'conducido',
  },
  dormir_verb: {
    group: 'irregular',
    preteritum: { yo: 'dormí', tú: 'dormiste', 'él/ella': 'durmió', nosotros: 'dormimos', vosotros: 'dormisteis', 'ellos/ellas': 'durmieron' },
    participle: 'dormido',
  },
  pedir_verb: {
    group: 'irregular',
    preteritum: { yo: 'pedí', tú: 'pediste', 'él/ella': 'pidió', nosotros: 'pedimos', vosotros: 'pedisteis', 'ellos/ellas': 'pidieron' },
    participle: 'pedido',
  },
  sentir_verb: {
    group: 'irregular',
    preteritum: { yo: 'sentí', tú: 'sentiste', 'él/ella': 'sintió', nosotros: 'sentimos', vosotros: 'sentisteis', 'ellos/ellas': 'sintieron' },
    participle: 'sentido',
  },
  morir_verb: {
    group: 'irregular',
    preteritum: { yo: 'morí', tú: 'moriste', 'él/ella': 'murió', nosotros: 'morimos', vosotros: 'moristeis', 'ellos/ellas': 'murieron' },
    participle: 'muerto',
  },
  escribir_verb: {
    group: 'irregular',
    participle: 'escrito', // regular preteritum
  },
  abrir_verb: {
    group: 'irregular',
    participle: 'abierto', // regular preteritum
  },
  volver_verb: {
    group: 'irregular',
    participle: 'vuelto',
  },
  romper_verb: {
    group: 'irregular',
    participle: 'roto',
  },
  caer_verb: {
    group: 'irregular',
    preteritum: { yo: 'caí', tú: 'caíste', 'él/ella': 'cayó', nosotros: 'caímos', vosotros: 'caísteis', 'ellos/ellas': 'cayeron' },
    participle: 'caído',
  },
  leer_verb: {
    group: 'irregular',
    preteritum: { yo: 'leí', tú: 'leíste', 'él/ella': 'leyó', nosotros: 'leímos', vosotros: 'leísteis', 'ellos/ellas': 'leyeron' },
    participle: 'leído',
  },
  'oir_verb': {
    group: 'irregular',
    preteritum: { yo: 'oí', tú: 'oíste', 'él/ella': 'oyó', nosotros: 'oímos', vosotros: 'oísteis', 'ellos/ellas': 'oyeron' },
    participle: 'oído',
  },
  elegir_verb: {
    group: 'irregular',
    preteritum: { yo: 'elegí', tú: 'elegiste', 'él/ella': 'eligió', nosotros: 'elegimos', vosotros: 'elegisteis', 'ellos/ellas': 'eligieron' },
    participle: 'elegido',
  },
};

// Irregular participles only (preteritum is regular)
const ES_IRREGULAR_PARTICIPLES = {
  descubrir: 'descubierto',
  devolver: 'devuelto',
  resolver: 'resuelto',
  cubrir: 'cubierto',
  freír: 'frito',
  imprimir: 'impreso',
  satisfacer: 'satisfecho',
};

function enrichEsVerb(wordId, entry) {
  const word = entry.word;
  const irr = ES_IRREGULARS[wordId];

  // Determine verb group
  let group;
  if (irr?.group) {
    group = irr.group;
  } else if (word.endsWith('ar') || word.endsWith('arse')) {
    group = '-ar';
  } else if (word.endsWith('er') || word.endsWith('erse')) {
    group = '-er';
  } else if (word.endsWith('ir') || word.endsWith('irse')) {
    group = '-ir';
  } else {
    group = 'irregular';
  }

  // Get stem (remove -ar/-er/-ir/-arse/-erse/-irse)
  let stem = word;
  if (word.endsWith('arse') || word.endsWith('erse') || word.endsWith('irse')) {
    stem = word.slice(0, -4);
  } else if (word.endsWith('ar') || word.endsWith('er') || word.endsWith('ir')) {
    stem = word.slice(0, -2);
  }
  const groupBase = word.endsWith('arse') ? 'ar' : word.endsWith('erse') ? 'er' : word.endsWith('irse') ? 'ir' :
    word.endsWith('ar') ? 'ar' : word.endsWith('er') ? 'er' : word.endsWith('ir') ? 'ir' : 'ir';

  // Restructure presens with pronoun labels
  const presensFormer = entry.conjugations?.presens?.former;
  let presens;
  if (Array.isArray(presensFormer) && presensFormer.length === 6) {
    presens = {};
    ES_PRONOUNS.forEach((p, i) => { presens[p] = presensFormer[i]; });
  } else if (typeof presensFormer === 'object' && !Array.isArray(presensFormer)) {
    presens = presensFormer; // already structured
  }

  // Preteritum
  let preteritum;
  if (irr?.preteritum) {
    preteritum = irr.preteritum;
  } else {
    preteritum = esPreteritumRegular(stem, groupBase);
  }

  // Participle and perfektum
  let participle;
  if (irr?.participle) {
    participle = irr.participle;
  } else if (ES_IRREGULAR_PARTICIPLES[word]) {
    participle = ES_IRREGULAR_PARTICIPLES[word];
  } else {
    participle = esParticiple(stem, groupBase);
  }

  const perfektum = esPerfektum(participle);

  // Build enriched conjugations
  const conjugations = {
    presens: {
      former: presens,
      feature: 'grammar_es_presens',
    },
    preteritum: {
      former: preteritum,
      feature: 'grammar_es_preteritum',
    },
    perfektum: {
      ...perfektum,
      feature: 'grammar_es_perfektum',
    },
  };

  return { conjugations, verbClass: group };
}

// ========== FRENCH ==========

const FR_PRONOUNS = ['je', 'tu', 'il/elle', 'nous', 'vous', 'ils/elles'];

// Passé composé auxiliary forms
const AVOIR_PRESENS = { je: "j'ai", tu: 'as', 'il/elle': 'a', nous: 'avons', vous: 'avez', 'ils/elles': 'ont' };
const ETRE_PRESENS = { je: 'suis', tu: 'es', 'il/elle': 'est', nous: 'sommes', vous: 'êtes', 'ils/elles': 'sont' };

// Verbs that use être as auxiliary
const FR_ETRE_VERBS = new Set([
  'aller', 'venir', 'arriver', 'partir', 'entrer', 'sortir', 'monter', 'descendre',
  'naître', 'mourir', 'rester', 'tomber', 'retourner', 'devenir', 'revenir', 'passer',
]);

// Imparfait (imperfect) — always regular from nous-presens stem
function frImparfait(stem) {
  return {
    je: stem + 'ais', tu: stem + 'ais', 'il/elle': stem + 'ait',
    nous: stem + 'ions', vous: stem + 'iez', 'ils/elles': stem + 'aient',
  };
}

// Participé passé — regular
function frParticiple(stem, group) {
  if (group === '-er') return stem + 'é';
  if (group === '-ir') return stem + 'i';
  if (group === '-re') return stem + 'u';
  return stem + 'é';
}

// Passé composé
function frPasseCompose(participle, auxiliary) {
  const auxForms = auxiliary === 'être' ? ETRE_PRESENS : AVOIR_PRESENS;
  const former = {};
  for (const [pron, auxForm] of Object.entries(auxForms)) {
    if (pron === 'je' && auxiliary === 'avoir') {
      former[pron] = auxForm + ' ' + participle;
    } else {
      former[pron] = auxForm + ' ' + participle;
    }
  }
  return { participle, auxiliary, former };
}

// Common French irregular verbs
const FR_IRREGULARS = {
  etre_verbe: {
    group: 'irregular',
    imparfaitStem: 'ét',
    participle: 'été', auxiliary: 'avoir',
  },
  avoir_verbe: {
    group: 'irregular',
    imparfaitStem: 'av',
    preteritum: { je: 'avais', tu: 'avais', 'il/elle': 'avait', nous: 'avions', vous: 'aviez', 'ils/elles': 'avaient' },
    participle: 'eu', auxiliary: 'avoir',
  },
  aller_verbe: {
    group: 'irregular',
    imparfaitStem: 'all',
    participle: 'allé', auxiliary: 'être',
  },
  faire_verbe: {
    group: 'irregular',
    imparfaitStem: 'fais',
    participle: 'fait', auxiliary: 'avoir',
  },
  dire_verbe: {
    group: 'irregular',
    imparfaitStem: 'dis',
    participle: 'dit', auxiliary: 'avoir',
  },
  pouvoir_verbe: {
    group: 'irregular',
    imparfaitStem: 'pouv',
    participle: 'pu', auxiliary: 'avoir',
  },
  vouloir_verbe: {
    group: 'irregular',
    imparfaitStem: 'voul',
    participle: 'voulu', auxiliary: 'avoir',
  },
  savoir_verbe: {
    group: 'irregular',
    imparfaitStem: 'sav',
    participle: 'su', auxiliary: 'avoir',
  },
  devoir_verbe: {
    group: 'irregular',
    imparfaitStem: 'dev',
    participle: 'dû', auxiliary: 'avoir',
  },
  venir_verbe: {
    group: 'irregular',
    imparfaitStem: 'ven',
    participle: 'venu', auxiliary: 'être',
  },
  tenir_verbe: {
    group: 'irregular',
    imparfaitStem: 'ten',
    participle: 'tenu', auxiliary: 'avoir',
  },
  prendre_verbe: {
    group: 'irregular',
    imparfaitStem: 'pren',
    participle: 'pris', auxiliary: 'avoir',
  },
  comprendre_verbe: {
    group: 'irregular',
    imparfaitStem: 'compren',
    participle: 'compris', auxiliary: 'avoir',
  },
  apprendre_verbe: {
    group: 'irregular',
    imparfaitStem: 'appren',
    participle: 'appris', auxiliary: 'avoir',
  },
  mettre_verbe: {
    group: 'irregular',
    imparfaitStem: 'mett',
    participle: 'mis', auxiliary: 'avoir',
  },
  connaitre_verbe: {
    group: 'irregular',
    imparfaitStem: 'connaiss',
    participle: 'connu', auxiliary: 'avoir',
  },
  croire_verbe: {
    group: 'irregular',
    imparfaitStem: 'croy',
    participle: 'cru', auxiliary: 'avoir',
  },
  voir_verbe: {
    group: 'irregular',
    imparfaitStem: 'voy',
    participle: 'vu', auxiliary: 'avoir',
  },
  lire_verbe: {
    group: 'irregular',
    imparfaitStem: 'lis',
    participle: 'lu', auxiliary: 'avoir',
  },
  ecrire_verbe: {
    group: 'irregular',
    imparfaitStem: 'écriv',
    participle: 'écrit', auxiliary: 'avoir',
  },
  boire_verbe: {
    group: 'irregular',
    imparfaitStem: 'buv',
    participle: 'bu', auxiliary: 'avoir',
  },
  vivre_verbe: {
    group: 'irregular',
    imparfaitStem: 'viv',
    participle: 'vécu', auxiliary: 'avoir',
  },
  mourir_verbe: {
    group: 'irregular',
    imparfaitStem: 'mour',
    participle: 'mort', auxiliary: 'être',
  },
  naitre_verbe: {
    group: 'irregular',
    imparfaitStem: 'naiss',
    participle: 'né', auxiliary: 'être',
  },
  partir_verbe: {
    group: 'irregular',
    imparfaitStem: 'part',
    participle: 'parti', auxiliary: 'être',
  },
  sortir_verbe: {
    group: 'irregular',
    imparfaitStem: 'sort',
    participle: 'sorti', auxiliary: 'être',
  },
  dormir_verbe: {
    group: 'irregular',
    imparfaitStem: 'dorm',
    participle: 'dormi', auxiliary: 'avoir',
  },
  ouvrir_verbe: {
    group: 'irregular',
    imparfaitStem: 'ouvr',
    participle: 'ouvert', auxiliary: 'avoir',
  },
  offrir_verbe: {
    group: 'irregular',
    imparfaitStem: 'offr',
    participle: 'offert', auxiliary: 'avoir',
  },
  recevoir_verbe: {
    group: 'irregular',
    imparfaitStem: 'recev',
    participle: 'reçu', auxiliary: 'avoir',
  },
  conduire_verbe: {
    group: 'irregular',
    imparfaitStem: 'conduis',
    participle: 'conduit', auxiliary: 'avoir',
  },
  construire_verbe: {
    group: 'irregular',
    imparfaitStem: 'construis',
    participle: 'construit', auxiliary: 'avoir',
  },
  produire_verbe: {
    group: 'irregular',
    imparfaitStem: 'produis',
    participle: 'produit', auxiliary: 'avoir',
  },
  suivre_verbe: {
    group: 'irregular',
    imparfaitStem: 'suiv',
    participle: 'suivi', auxiliary: 'avoir',
  },
  plaire_verbe: {
    group: 'irregular',
    imparfaitStem: 'plais',
    participle: 'plu', auxiliary: 'avoir',
  },
  revenir_verbe: {
    group: 'irregular',
    imparfaitStem: 'reven',
    participle: 'revenu', auxiliary: 'être',
  },
  devenir_verbe: {
    group: 'irregular',
    imparfaitStem: 'deven',
    participle: 'devenu', auxiliary: 'être',
  },
  tomber_verbe: {
    group: '-er',
    participle: 'tombé', auxiliary: 'être',
  },
  arriver_verbe: {
    group: '-er',
    participle: 'arrivé', auxiliary: 'être',
  },
  entrer_verbe: {
    group: '-er',
    participle: 'entré', auxiliary: 'être',
  },
  rester_verbe: {
    group: '-er',
    participle: 'resté', auxiliary: 'être',
  },
  monter_verbe: {
    group: '-er',
    participle: 'monté', auxiliary: 'être',
  },
  retourner_verbe: {
    group: '-er',
    participle: 'retourné', auxiliary: 'être',
  },
  descendre_verbe: {
    group: 'irregular',
    imparfaitStem: 'descend',
    participle: 'descendu', auxiliary: 'être',
  },
  passer_verbe: {
    group: '-er',
    participle: 'passé', auxiliary: 'être',
  },
};

function enrichFrVerb(wordId, entry) {
  const word = entry.word;
  const irr = FR_IRREGULARS[wordId];

  // Determine verb group
  let group;
  if (irr?.group) {
    group = irr.group;
  } else if (word.endsWith('er')) {
    group = '-er';
  } else if (word.endsWith('ir')) {
    group = '-ir';
  } else if (word.endsWith('re')) {
    group = '-re';
  } else {
    group = 'irregular';
  }

  // Get stem
  let stem = word;
  if (word.endsWith('er') || word.endsWith('ir') || word.endsWith('re')) {
    stem = word.slice(0, word.endsWith('re') ? -2 : -2);
  }
  const groupBase = word.endsWith('er') ? '-er' : word.endsWith('ir') ? '-ir' : word.endsWith('re') ? '-re' : '-er';

  // Restructure presens with pronoun labels
  const presensFormer = entry.conjugations?.presens?.former;
  let presens;
  if (Array.isArray(presensFormer) && presensFormer.length === 6) {
    presens = {};
    FR_PRONOUNS.forEach((p, i) => { presens[p] = presensFormer[i]; });
  } else if (typeof presensFormer === 'object' && !Array.isArray(presensFormer)) {
    presens = presensFormer;
  }

  // Imparfait (preteritum equivalent)
  // Derive stem from nous-presens form (most reliable)
  let imparfaitStem;
  if (irr?.imparfaitStem) {
    imparfaitStem = irr.imparfaitStem;
  } else if (irr?.preteritum) {
    // Already have full forms
  } else if (presens) {
    // Get nous form, strip -ons
    const nousForm = presens['nous'] || presens.nous;
    if (nousForm && nousForm.endsWith('ons')) {
      imparfaitStem = nousForm.slice(0, -3);
    } else {
      imparfaitStem = stem;
    }
  } else {
    imparfaitStem = stem;
  }

  let preteritum;
  if (irr?.preteritum) {
    preteritum = irr.preteritum;
  } else if (imparfaitStem) {
    preteritum = frImparfait(imparfaitStem);
  }

  // Participle and passé composé
  const auxiliary = irr?.auxiliary || (FR_ETRE_VERBS.has(word) ? 'être' : 'avoir');
  let participle;
  if (irr?.participle) {
    participle = irr.participle;
  } else {
    participle = frParticiple(stem, groupBase);
  }

  const perfektum = frPasseCompose(participle, auxiliary);

  const conjugations = {
    presens: {
      former: presens,
      feature: 'grammar_fr_presens',
    },
    imparfait: {
      former: preteritum,
      feature: 'grammar_fr_imparfait',
    },
    passe_compose: {
      ...perfektum,
      feature: 'grammar_fr_passe_compose',
    },
  };

  return { conjugations, verbClass: group };
}

// ========== Main ==========

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const languages = args.filter(a => !a.startsWith('--'));

if (languages.length === 0) {
  console.log('Usage: node scripts/enrich-es-fr-verbs.js [--dry-run] <es|fr>');
  process.exit(0);
}

if (dryRun) console.log('[DRY RUN]\n');

for (const lang of languages) {
  const bankPath = `vocabulary/lexicon/${lang}/verbbank.json`;
  if (!fs.existsSync(bankPath)) {
    console.error(`${lang}: verbbank.json not found`);
    continue;
  }

  const data = JSON.parse(fs.readFileSync(bankPath, 'utf8'));
  let enriched = 0;

  console.log(`\n=== ${lang.toUpperCase()} ===`);

  for (const [wordId, entry] of Object.entries(data)) {
    if (wordId === '_metadata') continue;

    let result;
    if (lang === 'es') {
      result = enrichEsVerb(wordId, entry);
    } else if (lang === 'fr') {
      result = enrichFrVerb(wordId, entry);
    }

    if (result) {
      data[wordId].conjugations = result.conjugations;
      data[wordId].verbClass = result.verbClass;
      enriched++;
    }
  }

  console.log(`Enriched ${enriched} verbs`);

  if (enriched > 0) {
    // Show samples
    const sample = Object.entries(data).find(([k, v]) => k !== '_metadata');
    console.log(`\nSample (${sample[0]}):`);
    console.log(JSON.stringify(sample[1].conjugations, null, 2));

    if (!dryRun) {
      fs.writeFileSync(bankPath, JSON.stringify(data, null, 2) + '\n', 'utf8');
      console.log(`\nWritten to ${bankPath}`);
    }
  }
}
