/**
 * add-perfektum.js
 *
 * Phase 13: Inject Perfektum conjugation data for all 144 non-verbphrase verb entries
 * in the core verbbank.
 *
 * Target: vocabulary/core/de/verbbank.json
 *
 * Rules applied:
 *   - Weak regular:   ge + stem + t           (machen -> gemacht)
 *   - Strong:         ge + vowel-change + en   (singen -> gesungen)
 *   - Mixed:          ge + consonant-change + t (bringen -> gebracht)
 *   - Inseparable:    NO ge-                   (besuchen -> besucht)
 *   - Separable:      prefix + ge + stem       (aufstehen -> aufgestanden)
 *   - -ieren:         stem + t, NO ge-          (dekorieren -> dekoriert)
 *   - Modal:          ge + stem + t standalone  (können -> gekonnt)
 *   - Dual-auxiliary: both sein and haben       (fahren: bin/habe gefahren)
 *   - Reflexive:      reflexive pronoun in former (sich waschen: habe mich gewaschen)
 *
 * Special resolutions (from PLAN open questions):
 *   - sich_vorbereiten: "vorbereitet" (not "vorgebereitet" — known exception)
 *   - haengen: "gehangen" strong intransitive as default
 *   - moechten_modal: "gemocht" from underlying mögen, with modal_note
 *
 * Expected output: Added: 144, Skipped: 0, Missing: 0
 */
import { readFileSync, writeFileSync } from 'fs';

const VERBBANK_PATH = 'vocabulary/core/de/verbbank.json';
const verbbank = JSON.parse(readFileSync(VERBBANK_PATH, 'utf8'));

// ---------------------------------------------------------------------------
// Helper builders
// ---------------------------------------------------------------------------

function haben(participle, extra = {}) {
  return {
    participle,
    auxiliary: 'haben',
    former: {
      'ich': `habe ${participle}`,
      'du': `hast ${participle}`,
      'er/sie/es': `hat ${participle}`,
      'wir': `haben ${participle}`,
      'ihr': `habt ${participle}`,
      'sie/Sie': `haben ${participle}`,
    },
    feature: 'grammar_perfektum',
    ...extra,
  };
}

function sein(participle, extra = {}) {
  return {
    participle,
    auxiliary: 'sein',
    former: {
      'ich': `bin ${participle}`,
      'du': `bist ${participle}`,
      'er/sie/es': `ist ${participle}`,
      'wir': `sind ${participle}`,
      'ihr': `seid ${participle}`,
      'sie/Sie': `sind ${participle}`,
    },
    feature: 'grammar_perfektum',
    ...extra,
  };
}

function both(participle, seinNote, habenNote) {
  return {
    participle,
    auxiliary: 'both',
    dual_auxiliary: true,
    auxiliary_note: {
      sein: seinNote,
      haben: habenNote,
    },
    former: {
      'ich': `bin/habe ${participle}`,
      'du': `bist/hast ${participle}`,
      'er/sie/es': `ist/hat ${participle}`,
      'wir': `sind/haben ${participle}`,
      'ihr': `seid/habt ${participle}`,
      'sie/Sie': `sind/haben ${participle}`,
    },
    feature: 'grammar_perfektum',
  };
}

function modal(participle, modalNote) {
  return {
    participle,
    auxiliary: 'haben',
    modal_note: modalNote,
    former: {
      'ich': `habe ${participle}`,
      'du': `hast ${participle}`,
      'er/sie/es': `hat ${participle}`,
      'wir': `haben ${participle}`,
      'ihr': `habt ${participle}`,
      'sie/Sie': `haben ${participle}`,
    },
    feature: 'grammar_perfektum',
  };
}

// Reflexive + haben
function habenRefl(participle, refl = {}) {
  // refl: { ich: 'mich', du: 'dich', ersiees: 'sich', wir: 'uns', ihr: 'euch', sieSie: 'sich' }
  const r = { ich: 'mich', du: 'dich', ersiees: 'sich', wir: 'uns', ihr: 'euch', sieSie: 'sich', ...refl };
  return {
    participle,
    auxiliary: 'haben',
    former: {
      'ich': `habe ${r.ich} ${participle}`,
      'du': `hast ${r.du} ${participle}`,
      'er/sie/es': `hat ${r.ersiees} ${participle}`,
      'wir': `haben ${r.wir} ${participle}`,
      'ihr': `habt ${r.ihr} ${participle}`,
      'sie/Sie': `haben ${r.sieSie} ${participle}`,
    },
    feature: 'grammar_perfektum',
  };
}

// Reflexive + sein
function seinRefl(participle, refl = {}) {
  const r = { ich: 'mich', du: 'dich', ersiees: 'sich', wir: 'uns', ihr: 'euch', sieSie: 'sich', ...refl };
  return {
    participle,
    auxiliary: 'sein',
    former: {
      'ich': `bin ${r.ich} ${participle}`,
      'du': `bist ${r.du} ${participle}`,
      'er/sie/es': `ist ${r.ersiees} ${participle}`,
      'wir': `sind ${r.wir} ${participle}`,
      'ihr': `seid ${r.ihr} ${participle}`,
      'sie/Sie': `sind ${r.sieSie} ${participle}`,
    },
    feature: 'grammar_perfektum',
  };
}

// ---------------------------------------------------------------------------
// PERFEKTUM_DATA: all 144 non-verbphrase verb entries
// ---------------------------------------------------------------------------

const PERFEKTUM_DATA = {

  // -------------------------------------------------------------------------
  // SEIN + HABEN core auxiliaries
  // -------------------------------------------------------------------------

  sein_verb: sein('gewesen'),
  haben_verb: haben('gehabt'),

  // -------------------------------------------------------------------------
  // REGULAR WEAK VERBS — haben, ge + stem + t
  // -------------------------------------------------------------------------

  heissen_verb: haben('geheißen'),        // weak regular (mixed/strong in some grammars but commonly listed as regular; participle: geheißen)
  wohnen_verb: haben('gewohnt'),
  schauen_verb: haben('geschaut'),
  spielen_verb: haben('gespielt'),
  shoppen_verb: haben('geshopped'),       // anglicism; Perfektum: hat geshopped
  lernen_verb: haben('gelernt'),
  finden_verb: haben('gefunden'),          // strong: ge+fund+en
  klingeln_verb: haben('geklingelt'),
  lesen_verb: haben('gelesen'),            // strong: ge+les+en
  kochen_verb: haben('gekocht'),
  malen_verb: haben('gemalt'),
  machen_verb: haben('gemacht'),
  kaufen_verb: haben('gekauft'),
  brauchen_verb: haben('gebraucht'),
  hoeren_verb: haben('gehört'),
  hoffen_verb: haben('gehofft'),
  fuettern_verb: haben('gefüttert'),
  streicheln_verb: haben('gestreichelt'),
  fressen_verb: haben('gefressen'),        // strong: ge+fress+en
  leben_verb: haben('gelebt'),
  oeffnen_verb: haben('geöffnet'),
  jagen_verb: haben('gejagt'),
  tragen_verb: haben('getragen'),          // strong: ge+trag+en (trägt, trug, getragen)
  sehen_verb: haben('gesehen'),            // strong: ge+seh+en
  treffen_verb: haben('getroffen'),        // strong: ge+troff+en
  wandern_verb: sein('gewandert'),         // sein: movement/journey
  traeumen_verb: haben('geträumt'),
  sagen_verb: haben('gesagt'),
  schreiben_verb: haben('geschrieben'),    // strong: ge+schrieb+en
  packen_verb: haben('gepackt'),
  scheinen_verb: haben('geschienen'),      // strong: ge+schien+en
  lieben_verb: haben('geliebt'),
  stimmen_verb: haben('gestimmt'),
  sprechen_verb: haben('gesprochen'),      // strong: ge+sproch+en
  dauern_verb: haben('gedauert'),
  feiern_verb: haben('gefeiert'),
  kennen_verb: haben('gekannt'),           // mixed: ge+kann+t
  fruehstuecken_verb: haben('gefrühstückt'),
  grillen_verb: haben('gegrillt'),
  planen_verb: haben('geplant'),
  sitzen_verb: haben('gesessen'),          // strong: ge+sess+en
  lachen_verb: haben('gelacht'),
  fragen_verb: haben('gefragt'),
  helfen_verb: haben('geholfen'),          // strong: ge+holf+en
  laecheln_verb: haben('gelächelt'),
  wecken_verb: haben('geweckt'),
  liegen_verb: haben('gelegen'),           // strong: ge+leg+en
  putzen_verb: haben('geputzt'),
  arbeiten_verb: haben('gearbeitet'),
  wissen_verb: haben('gewusst'),           // mixed: ge+wuss+t
  geben_verb: haben('gegeben'),            // strong: ge+geb+en
  klingen_verb: haben('geklungen'),        // strong: ge+klung+en
  haengen_verb: haben('gehangen'),         // strong intransitive: ge+hang+en (default usage)
  stehen_verb: haben('gestanden'),         // strong: ge+stand+en
  warten_verb: haben('gewartet'),
  springen_verb: sein('gesprungen'),       // sein: motion upward/jump-directed
  glauben_verb: haben('geglaubt'),
  gewinnen_verb: haben('gewonnen'),        // strong: ge+wonn+en
  danken_verb: haben('gedankt'),
  antworten_verb: haben('geantwortet'),
  zeigen_verb: haben('gezeigt'),
  bringen_verb: haben('gebracht'),         // mixed: ge+bracht (irregular)
  reisen_verb: sein('gereist'),            // sein: travel/motion
  klettern_verb: sein('geklettert'),       // sein: movement upward
  liegen_bleiben_verb: sein('liegen geblieben'),   // compound: liegen + bleiben
  spazieren_gehen_verb: sein('spazieren gegangen'), // compound: spazieren + gehen
  zaehneputzen_verb: haben('Zähne geputzt'),        // noun + verb compound; capital Z preserved

  // -------------------------------------------------------------------------
  // STRONG VERBS — sein auxiliary (motion / change of state)
  // -------------------------------------------------------------------------

  kommen_verb: sein('gekommen'),
  gehen_verb: sein('gegangen'),
  werden_verb: sein('geworden'),
  bleiben_verb: sein('geblieben'),
  schlafen_verb: haben('geschlafen'),      // strong: ge+schlaf+en — NOTE: haben (not movement)

  // -------------------------------------------------------------------------
  // STRONG VERBS — haben auxiliary (activity/eating/singing etc.)
  // -------------------------------------------------------------------------

  essen_verb: haben('gegessen'),           // strong: ge+gess+en
  nehmen_verb: haben('genommen'),          // strong: ge+nomm+en
  trinken_verb: haben('getrunken'),        // strong: ge+trunk+en
  singen_verb: haben('gesungen'),          // strong: ge+sung+en
  tanzen_verb: haben('getanzt'),

  // -------------------------------------------------------------------------
  // -IEREN VERBS — no ge- prefix (stem + t)
  // -------------------------------------------------------------------------

  interessieren_verb: haben('interessiert'),
  dekorieren_verb: haben('dekoriert'),
  sich_rasieren_verb: habenRefl('rasiert'),
  sich_interessieren_verb: habenRefl('interessiert'),
  sich_konzentrieren_verb: habenRefl('konzentriert'),

  // -------------------------------------------------------------------------
  // INSEPARABLE PREFIX VERBS — 17 entries, NO ge-
  // -------------------------------------------------------------------------

  entspannen_verb: haben('entspannt'),
  beginnen_verb: haben('begonnen'),        // strong inseparable: be+gonn+en
  besuchen_verb: haben('besucht'),
  verstehen_verb: haben('verstanden'),     // strong inseparable: ver+stand+en
  vergessen_verb: haben('vergessen'),      // strong inseparable: ver+gess+en
  verlieren_verb: haben('verloren'),       // strong inseparable: ver+lor+en
  vertrauen_verb: haben('vertraut'),
  versprechen_verb: haben('versprochen'),  // strong inseparable: ver+sproch+en
  erklaeren_verb: haben('erklärt'),
  erzaehlen_verb: haben('erzählt'),
  bekommen_verb: haben('bekommen'),        // strong inseparable: be+komm+en

  // Reflexive inseparable verbs — NO ge-
  sich_entschuldigen_verb: habenRefl('entschuldigt'),
  sich_verspaeten_verb: habenRefl('verspätet'),
  sich_entspannen_verb: habenRefl('entspannt'),
  sich_erholen_verb: habenRefl('erholt'),
  sich_unterhalten_verb: habenRefl('unterhalten'),   // strong inseparable: unter+halt+en
  sich_bewegen_verb: habenRefl('bewegt'),

  // -------------------------------------------------------------------------
  // SEPARABLE VERBS — 19 entries, ge- between prefix and stem
  // -------------------------------------------------------------------------

  mitnehmen_verb: haben('mitgenommen'),    // strong: mit+ge+nommen
  einpacken_verb: haben('eingepackt'),
  anrufen_verb: haben('angerufen'),        // strong: an+ge+rufen
  anfangen_verb: haben('angefangen'),      // strong: an+ge+fangen
  einladen_verb: haben('eingeladen'),      // strong: ein+ge+laden
  einkaufen_verb: haben('eingekauft'),
  sich_anziehen_verb: habenRefl('angezogen'),   // strong separable reflexive: an+ge+zogen
  aufwachen_verb: sein('aufgewacht'),      // change-of-state: auf+ge+wacht
  aufstehen_verb: sein('aufgestanden'),    // change-of-state: auf+ge+standen
  sich_aufregen_verb: habenRefl('aufgeregt'),
  sich_ausruhen_verb: habenRefl('ausgeruht'),
  sich_vorbereiten_verb: habenRefl('vorbereitet'),  // exception: vorbereitet (not vorgebereitet)
  mitbringen_verb: haben('mitgebracht'),   // mixed separable: mit+ge+bracht
  aufraeumen_verb: haben('aufgeräumt'),
  fernsehen_verb: haben('ferngesehen'),    // strong: fern+ge+sehen
  wegfahren_verb: both(
    'weggefahren',
    'Abfahrt / Fortbewegung: Ich bin weggefahren.',
    'Transitiv (selten): Ich habe das Auto weggefahren.'
  ),
  mitkommen_verb: sein('mitgekommen'),     // movement: mit+ge+kommen
  ausziehen_verb: both(
    'ausgezogen',
    'Umzug / Auszug: Ich bin aus der Wohnung ausgezogen.',
    'Ausziehen (Kleidung): Ich habe den Mantel ausgezogen.'
  ),
  einschlafen_verb: sein('eingeschlafen'), // change-of-state: ein+ge+schlafen

  // -------------------------------------------------------------------------
  // DUAL-AUXILIARY VERBS — 6 entries (some also listed in separable above)
  // -------------------------------------------------------------------------

  fahren_verb: both(
    'gefahren',
    'Gerichtete Bewegung: Ich bin nach Berlin gefahren.',
    'Mit Objekt (transitiv): Ich habe das Auto gefahren.'
  ),
  fliegen_verb: both(
    'geflogen',
    'Gerichtete Fortbewegung: Ich bin nach Paris geflogen.',
    'Mit Objekt (transitiv): Ich habe das Flugzeug geflogen.'
  ),
  schwimmen_verb: both(
    'geschwommen',
    'Gerichtete Bewegung: Ich bin über den See geschwommen.',
    'Aktivität ohne Richtung: Ich habe eine Stunde geschwommen.'
  ),
  laufen_verb: both(
    'gelaufen',
    'Gerichtete Bewegung: Ich bin nach Hause gelaufen.',
    'Aktivität / Sport: Ich habe 10 km gelaufen.'
  ),

  // -------------------------------------------------------------------------
  // MODAL VERBS — 7 entries (Ersatzinfinitiv, all haben)
  // -------------------------------------------------------------------------

  moegen_verb: modal(
    'gemocht',
    'Ersatzinfinitiv: Mit abhängigem Infinitiv wird der Infinitiv verwendet, nicht das Partizip. Z.B. "Er hat singen mögen." Ohne Infinitiv (alleinstehend): "Er hat es gemocht."'
  ),
  koennen_verb: modal(
    'gekonnt',
    'Ersatzinfinitiv: Mit abhängigem Infinitiv wird der Infinitiv verwendet, nicht das Partizip. Z.B. "Er hat singen können." Ohne Infinitiv (alleinstehend): "Er hat es gekonnt."'
  ),
  muessen_verb: modal(
    'gemusst',
    'Ersatzinfinitiv: Mit abhängigem Infinitiv wird der Infinitiv verwendet, nicht das Partizip. Z.B. "Er hat kommen müssen." Ohne Infinitiv (alleinstehend): "Er hat es gemusst."'
  ),
  wollen_verb: modal(
    'gewollt',
    'Ersatzinfinitiv: Mit abhängigem Infinitiv wird der Infinitiv verwendet, nicht das Partizip. Z.B. "Er hat gehen wollen." Ohne Infinitiv (alleinstehend): "Er hat es gewollt."'
  ),
  duerfen_verb: modal(
    'gedurft',
    'Ersatzinfinitiv: Mit abhängigem Infinitiv wird der Infinitiv verwendet, nicht das Partizip. Z.B. "Er hat gehen dürfen." Ohne Infinitiv (alleinstehend): "Er hat es gedurft."'
  ),
  sollen_verb: modal(
    'gesollt',
    'Ersatzinfinitiv: Mit abhängigem Infinitiv wird der Infinitiv verwendet, nicht das Partizip. Z.B. "Er hat kommen sollen." Ohne Infinitiv (alleinstehend): "Er hat es gesollt."'
  ),
  moechten_modal: modal(
    'gemocht',
    'möchten hat kein eigenes Perfektum. Als Konjunktiv II von mögen wird gemocht als Partizip II verwendet. In der Praxis wird "hat gewollt" oder "hat mögen" benutzt.'
  ),

  // -------------------------------------------------------------------------
  // REFLEXIVE VERBS (non-inseparable, non-separable) — haben
  // -------------------------------------------------------------------------

  sich_treffen_verb: habenRefl('getroffen'),     // strong: ge+troff+en
  sich_freuen_auf_verb: habenRefl('gefreut'),
  sich_waschen_verb: habenRefl('gewaschen'),     // strong: ge+wasch+en
  sich_duschen_verb: habenRefl('geduscht'),
  sich_kaemmen_verb: habenRefl('gekämmt'),
  sich_schminken_verb: habenRefl('geschminkt'),
  sich_freuen_verb: habenRefl('gefreut'),
  sich_fuehlen_verb: habenRefl('gefühlt'),
  sich_freuen_ueber_verb: habenRefl('gefreut'),
  sich_aergern_verb: habenRefl('geärgert'),
  sich_langweilen_verb: habenRefl('gelangweilt'),
  sich_setzen_verb: habenRefl('gesetzt'),
  sich_aergern_ueber_verb: habenRefl('geärgert'),

};

// ---------------------------------------------------------------------------
// Inject perfektum into verbbank
// ---------------------------------------------------------------------------

let added = 0;
let skipped = 0;
const missing = [];

for (const [key, perfData] of Object.entries(PERFEKTUM_DATA)) {
  if (!verbbank[key]) {
    console.warn(`MISSING FROM VERBBANK: ${key}`);
    missing.push(key);
    skipped++;
    continue;
  }
  verbbank[key].conjugations = {
    ...verbbank[key].conjugations,
    perfektum: perfData,
  };
  added++;
}

writeFileSync(VERBBANK_PATH, JSON.stringify(verbbank, null, 2));

console.log(`Added: ${added}, Skipped: ${skipped}, Missing: ${missing.length}`);

if (missing.length > 0) {
  console.error('Missing keys:', missing);
  process.exit(1);
}
