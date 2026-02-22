# Phase 13: Perfektum Data - Research

**Researched:** 2026-02-22
**Domain:** JSON data editing — German Perfektum conjugations for 144 verbs in core verbbank
**Confidence:** HIGH

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| PERF-01 | All 148 German verbs have past participle in `conjugations.perfektum.participle` | Direct inspection: 0 of 148 entries currently have perfektum data. Target = 144 non-verbphrase entries (4 verbphrases are Out of Scope per REQUIREMENTS.md). Participle formation rules documented below. |
| PERF-02 | All 148 German verbs have auxiliary selection (haben/sein/both) in `conjugations.perfektum.auxiliary` | Classification complete: ~112 haben, ~17 sein, 6 both (dual), 7 modals (special). Full table in Architecture Patterns section. |
| PERF-03 | All 148 German verbs have full 6-pronoun Perfektum conjugation in `conjugations.perfektum.former` | Former = auxiliary present + participle. Pattern confirmed: `"ich": "habe/bin + participle"` × 6 pronouns. Schema: `tenseConjugation.former` is `additionalProperties: string`. |
| PERF-04 | Dual-auxiliary verbs (~6) have `dual_auxiliary: true` and `auxiliary_note` explaining when each auxiliary applies | Confirmed 6 dual-auxiliary verbs: fahren, fliegen, schwimmen, laufen, ausziehen, wegfahren. Schema has `dual_auxiliary: boolean` and `auxiliary_note: object<string>` — both ready from Phase 11. |
| PERF-05 | Modal verbs have appropriate Perfektum forms with `modal_note` documenting Ersatzinfinitiv | 7 modals identified: mögen, können, müssen, wollen, dürfen, sollen, möchten. Ersatzinfinitiv pattern documented. Schema has `modal_note: string`. möchten is a special defective case. |
| PERF-06 | Separable verbs have correct ge- position (between prefix and stem: aufgestanden) | 19 separable verbs confirmed (separable: true flag). Ge-insertion rule: prefix + ge + stem participle. All 19 listed with their participles. |
| PERF-07 | Inseparable prefix verbs correctly omit ge- in past participle (besucht, not *gebesucht) | 17 inseparable verbs flagged in Phase 12. No ge- for be-, er-, ver-, ent-, unter- (inseparable use). All 17 listed with correct participles. |
</phase_requirements>

---

## Summary

Phase 13 is a pure data-entry phase — no schema changes, no code changes, no new libraries. The schema was extended in Phase 11 to accept all required Perfektum fields (`participle`, `auxiliary`, `auxiliary_note`, `dual_auxiliary`, `modal_note`, `feature`). Phase 12 flagged the 17 inseparable verbs. Phase 13 only needs to write JSON data into the existing structure.

The scope is 144 non-verbphrase entries (the 4 `_verbphrase` entries are Out of Scope per REQUIREMENTS.md "Verbphrase Perfektum" out of scope item). All 144 entries currently have `conjugations.preteritum`; the perfektum block is missing on all 144. The data pattern for the `former` object is straightforward: the auxiliary verb conjugated in present tense + the past participle (e.g., `"ich": "habe gemacht"` for haben verbs, `"ich": "bin gegangen"` for sein verbs). The participle itself is the linguistically interesting part — participle formation follows 8 rules documented below, with several irregular strong and mixed verbs.

The recommended approach is a single-plan execution: write a one-off Node.js script (ESM, following project convention from `scripts/sync-preteritum.js`) that injects perfektum data from a hardcoded data table into the verbbank. This eliminates transcription errors across 144 entries and provides an audit trail. Direct JSON editing is viable for isolated spot corrections but not for the full 144-entry scope.

**Primary recommendation:** Write one Node.js ESM script (`scripts/add-perfektum.js`) containing a hardcoded map of all 144 perfektum entries, then execute and validate with AJV. Keep the baseline of 191 pre-existing AJV errors — Phase 13 must not increase this count.

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| AJV | ^8.18.0 (installed) | JSON Schema 2020-12 validation | Already in devDependencies; baseline = 191 core verbbank errors (pre-existing) |
| Node.js (built-in) | runtime | Read/write JSON files, run script | No install needed; project is ESM (type: module) |

### Supporting

No additional libraries needed. This phase is JSON data entry with a scripted injection approach.

**Installation:** None required.

---

## Architecture Patterns

### File Layout

```
vocabulary/
└── core/de/
    └── verbbank.json    # 148 entries — add perfektum block to 144 of them (4 verbphrases excluded)

scripts/
└── add-perfektum.js    # One-off data injection script (created by this phase)
```

### Pattern 1: Perfektum Block Structure

**What:** The schema-defined shape for a perfektum tense conjugation entry.
**Source:** `vocabulary/schema/verb.schema.json` — `$defs/tenseConjugation` (Phase 11 extension)

```json
// Standard haben verb (e.g., machen_verb):
"perfektum": {
  "participle": "gemacht",
  "auxiliary": "haben",
  "former": {
    "ich": "habe gemacht",
    "du": "hast gemacht",
    "er/sie/es": "hat gemacht",
    "wir": "haben gemacht",
    "ihr": "habt gemacht",
    "sie/Sie": "haben gemacht"
  },
  "feature": "grammar_perfektum"
}

// Standard sein verb (e.g., gehen_verb):
"perfektum": {
  "participle": "gegangen",
  "auxiliary": "sein",
  "former": {
    "ich": "bin gegangen",
    "du": "bist gegangen",
    "er/sie/es": "ist gegangen",
    "wir": "sind gegangen",
    "ihr": "seid gegangen",
    "sie/Sie": "sind gegangen"
  },
  "feature": "grammar_perfektum"
}

// Dual-auxiliary verb (e.g., fahren_verb):
"perfektum": {
  "participle": "gefahren",
  "auxiliary": "both",
  "dual_auxiliary": true,
  "auxiliary_note": {
    "sein": "Bewegung ohne Objekt: Ich bin nach Berlin gefahren.",
    "haben": "Mit Objekt (transitiv): Ich habe das Auto gefahren."
  },
  "former": {
    "ich": "bin/habe gefahren",
    "du": "bist/hast gefahren",
    "er/sie/es": "ist/hat gefahren",
    "wir": "sind/haben gefahren",
    "ihr": "seid/habt gefahren",
    "sie/Sie": "sind/haben gefahren"
  },
  "feature": "grammar_perfektum"
}

// Modal verb (e.g., können_verb):
"perfektum": {
  "participle": "können",
  "auxiliary": "haben",
  "modal_note": "Ersatzinfinitiv: with a dependent infinitive, use 'singen können' not 'gekonnt'. E.g., 'Er hat singen können.' Standalone (no infinitive): 'Er hat es gekonnt.'",
  "former": {
    "ich": "habe gekonnt",
    "du": "hast gekonnt",
    "er/sie/es": "hat gekonnt",
    "wir": "haben gekonnt",
    "ihr": "habt gekonnt",
    "sie/Sie": "haben gekonnt"
  },
  "feature": "grammar_perfektum"
}
```

### Pattern 2: Script Injection (recommended approach)

**What:** Node.js ESM script reads verbbank, merges perfektum blocks from a hardcoded data table, writes back.
**Why:** 144 entries — scripted approach prevents transcription errors; provides audit trail.

```javascript
// scripts/add-perfektum.js (ESM — project convention from package.json type:module)
import { readFileSync, writeFileSync } from 'fs';

const VERBBANK_PATH = 'vocabulary/core/de/verbbank.json';
const verbbank = JSON.parse(readFileSync(VERBBANK_PATH, 'utf8'));

// Perfektum data table: key -> { participle, auxiliary, former, feature, ...special }
const PERFEKTUM_DATA = {
  // ... (full table: 137 standard + 6 dual-aux + 7 modal = 150 entries minus 4 verbphrases = 144 true verbs)
};

let added = 0;
let skipped = 0;

for (const [key, perfData] of Object.entries(PERFEKTUM_DATA)) {
  if (!verbbank[key]) { console.warn(`MISSING: ${key}`); skipped++; continue; }
  verbbank[key].conjugations = {
    ...verbbank[key].conjugations,
    perfektum: perfData
  };
  added++;
}

writeFileSync(VERBBANK_PATH, JSON.stringify(verbbank, null, 2));
console.log(`Added: ${added}, Skipped: ${skipped}`);
// Expected: Added: 144, Skipped: 0
```

### Pattern 3: Reflexive Verb Former Format

Reflexive verbs carry the reflexive pronoun in the `former` forms, mirroring the pattern established in `presens` and `preteritum`:

```json
// sich_waschen_verb — reflexive, haben auxiliary
"perfektum": {
  "participle": "gewaschen",
  "auxiliary": "haben",
  "former": {
    "ich": "habe mich gewaschen",
    "du": "hast dich gewaschen",
    "er/sie/es": "hat sich gewaschen",
    "wir": "haben uns gewaschen",
    "ihr": "habt euch gewaschen",
    "sie/Sie": "haben sich gewaschen"
  },
  "feature": "grammar_perfektum"
}
```

### Anti-Patterns to Avoid

- **Adding ge- to inseparable prefix verbs:** `besuchen -> *gebesucht` is wrong; correct = `besucht`.
- **Adding ge- to -ieren verbs:** `dekorieren -> *gedekoriert` is wrong; correct = `dekoriert`.
- **Wrong ge- position in separable verbs:** `aufstehen -> *geaufgestanden` is wrong; correct = `aufgestanden`.
- **Omitting ge- from separable verbs:** `aufstehen -> *aufstanden` is wrong; correct = `aufgestanden`.
- **Replacing the entire `conjugations` object:** Use `{ ...verbbank[key].conjugations, perfektum: ... }` to preserve existing `presens` and `preteritum`.
- **Using "feature": "grammar_presens" on perfektum:** Must be `"feature": "grammar_perfektum"` — matches the feature ID registered in grammar-features.json.
- **Missing reflexive pronoun in former:** `sich waschen` former must include `mich/dich/sich/uns/euch/sich`.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| JSON validation | Custom validator | AJV 8.x (already installed) | Industry-standard; already used in validate-adjectives.js |
| Perfektum injection | Manual JSON editing × 144 | Node.js ESM script with data table | Zero transcription errors; repeatable; audit trail |
| Participle correctness | Rule engine | Hardcoded data table (explicit storage) | German exceptions make rule engines fragile — project decision from STATE.md |

**Key insight:** The project decision is explicit storage for all participle forms (mirrors adjective declension precedent). Do not attempt algorithmic participle generation — hardcode all 144 entries.

---

## Common Pitfalls

### Pitfall 1: Including Verbphrases in Scope

**What goes wrong:** Writing perfektum data for `rad_fahren_verbphrase`, `musik_hoeren_verbphrase`, `gassi_gehen_verbphrase`, `fertig_werden_verbphrase`.
**Why it happens:** PERF-01 says "All 148 German verbs" but the bank has 144 true verbs + 4 verbphrases = 148 total. REQUIREMENTS.md explicitly marks "Verbphrase Perfektum" as Out of Scope.
**How to avoid:** Target 144 non-verbphrase entries. The success criteria "All 148 verbs" in the roadmap is an overcount — it should say 144. The 4 verbphrases have `_verbphrase` suffix and can be filtered with `k.endsWith('_verbphrase')`.
**Warning signs:** Trying to write Perfektum for "Rad fahren".

### Pitfall 2: Wrong ge- Handling for Separable Verbs

**What goes wrong:** Writing participle of `aufstehen` as `aufstanden` (no ge-) or `geaufgestanden` (ge- at start).
**Why it happens:** Applying the inseparable rule (no ge-) to separable verbs.
**How to avoid:** Separable verbs: prefix + "ge" + stem-participle. `auf + ge + standen = aufgestanden`. The ge- goes BETWEEN prefix and stem.
**Warning signs:** Any separable verb participle starting with "ge-" at position 0.

### Pitfall 3: Wrong ge- Handling for Inseparable Verbs

**What goes wrong:** Writing `besuchen -> gebesucht` (adding ge- to inseparable verb).
**Why it happens:** Applying the default weak-verb rule without checking the inseparable flag.
**How to avoid:** For all 17 entries with `inseparable: true`, the participle has NO ge- prefix. `besuchen -> besucht`, `vergessen -> vergessen`, `bekommen -> bekommen`.
**Warning signs:** Any inseparable verb participle starting with "ge-".

### Pitfall 4: Adding ge- to -ieren Verbs

**What goes wrong:** Writing `dekorieren -> gedekoriert`, `interessieren -> geinteressiert`, `rasieren -> gerasiert`.
**Why it happens:** Applying default ge- rule to -ieren verbs.
**How to avoid:** All verbs ending in `-ieren` form the participle as stem + `t` with NO ge-. `dekorieren -> dekoriert`, `rasieren -> rasiert`, `interessieren -> interessiert`, `konzentrieren -> konzentriert`.
**Warning signs:** Any `-ieren` verb participle starting with "ge-".

### Pitfall 5: Incorrect Dual-Auxiliary Former Format

**What goes wrong:** Writing only one auxiliary form in the `former` for dual-auxiliary verbs, or writing "haben" in the auxiliary field for a verb that typically uses "sein".
**Why it happens:** Unclear how to represent both options.
**How to avoid:** Use `"auxiliary": "both"`, `"dual_auxiliary": true`, and in `former` use `"bin/habe"` slash notation, plus write `auxiliary_note` explaining the context.
**Warning signs:** fahren, fliegen, schwimmen, laufen, ausziehen, wegfahren NOT having `dual_auxiliary: true`.

### Pitfall 6: Modal Verb Ersatzinfinitiv Confusion

**What goes wrong:** Writing `können -> *gekonnt` as the standalone participle, or forgetting to note Ersatzinfinitiv behavior.
**Why it happens:** Modal verbs have two valid Perfektum patterns: standalone (`Er hat es gekonnt`) and with dependent infinitive (`Er hat singen können`).
**How to avoid:** The `participle` field should be the Partizip II form used standalone (`gekonnt`, `gemusst`, etc.). The `modal_note` must document the Ersatzinfinitiv pattern. The `former` should show the standalone form (most common in pedagogical contexts).
**Warning signs:** Modal verbs missing `modal_note` field.

### Pitfall 7: möchten Modal Special Case

**What goes wrong:** Treating `möchten_modal` the same as other modals.
**Why it happens:** `möchten` is technically a Konjunktiv II form of `mögen` used as a polite present tense. It has no standard Perfektum.
**How to avoid:** The preteritum for `möchten` already uses `wollte` forms with a `preteritum_note`. The Perfektum should similarly use `gemocht` forms (from `mögen`) with a `modal_note` explaining this is the Perfektum of the underlying `mögen` verb. Alternatively, document that `möchten` has no Perfektum and is replaced by `hat gewollt/gemocht`.
**Warning signs:** möchten_modal missing a `modal_note` explaining its special status.

### Pitfall 8: Forgetting Reflexive Pronouns in Former

**What goes wrong:** Writing `"ich": "habe gewaschen"` instead of `"ich": "habe mich gewaschen"` for reflexive verbs.
**Why it happens:** Reflexive pronoun needed in Perfektum just as in other tenses.
**How to avoid:** Check existing `presens` and `preteritum` former for reflexive pronoun pattern, then mirror it in `perfektum`. All 26 `sich_*` entries need reflexive pronouns.
**Warning signs:** Reflexive verb former forms without mich/dich/sich/uns/euch.

### Pitfall 9: Pre-Existing AJV Errors Treated as Phase 13 Failures

**What goes wrong:** Running AJV after adding perfektum data and seeing 191 errors, concluding Phase 13 broke something.
**Why it happens:** 191 pre-existing errors exist (149 missing `translations` + 42 `enum` type mismatches).
**How to avoid:** Phase 13 passes if error count remains at or below 191. Any increase means newly introduced errors.
**Baseline:** 191 errors (confirmed by research via `ajv` run on current verbbank).

---

## Code Examples

### Verified: Current tense conjugation structure (from verbbank.json)

```json
// vocabulary/core/de/verbbank.json — sein_verb (current state):
"sein_verb": {
  "word": "sein",
  "type": "strong",
  "conjugations": {
    "presens": {
      "former": { "ich": "bin", "du": "bist", "er/sie/es": "ist", "wir": "sind", "ihr": "seid", "sie/Sie": "sind" },
      "feature": "grammar_presens"
    },
    "preteritum": {
      "former": { "ich": "war", "du": "warst", "er/sie/es": "war", "wir": "waren", "ihr": "wart", "sie/Sie": "waren" },
      "feature": "grammar_preteritum"
    }
  },
  "_id": "sein_verb",
  "audio": "verb_sein.mp3"
}
```

### Verified: Target state after Phase 13 (sein_verb with perfektum)

```json
"sein_verb": {
  "word": "sein",
  "type": "strong",
  "conjugations": {
    "presens": { ... },
    "preteritum": { ... },
    "perfektum": {
      "participle": "gewesen",
      "auxiliary": "sein",
      "former": {
        "ich": "bin gewesen",
        "du": "bist gewesen",
        "er/sie/es": "ist gewesen",
        "wir": "sind gewesen",
        "ihr": "seid gewesen",
        "sie/Sie": "sind gewesen"
      },
      "feature": "grammar_perfektum"
    }
  },
  "_id": "sein_verb",
  "audio": "verb_sein.mp3"
}
```

### Verified: Schema fields available (from verb.schema.json after Phase 11)

```json
// tenseConjugation accepts:
{
  "former": { ... },          // required
  "feature": "string",        // e.g., "grammar_perfektum"
  "auxiliary": "haben|sein|both",
  "participle": "string",
  "dual_auxiliary": true,
  "auxiliary_note": { "sein": "...", "haben": "..." },
  "modal_note": "string"
}
```

### Verified: AJV validation pattern (from scripts/validate-adjectives.js)

```javascript
import Ajv2020 from 'ajv/dist/2020.js';
import { readFileSync } from 'fs';

const ajv = new Ajv2020({ strict: false, allErrors: true });
ajv.addSchema(JSON.parse(readFileSync('vocabulary/schema/core-word.schema.json', 'utf8')), 'core-word.schema.json');
ajv.addSchema(JSON.parse(readFileSync('vocabulary/schema/verb.schema.json', 'utf8')));
const validate = ajv.getSchema('https://papertek.no/schemas/vocabulary/verb.schema.json');
const data = JSON.parse(readFileSync('vocabulary/core/de/verbbank.json', 'utf8'));
validate(data);
console.log('AJV error count:', (validate.errors || []).length, '(baseline: 191)');
// Phase 13 passes if <= 191
```

---

## Definitive Data Reference

### Scope: 144 entries need perfektum (148 total - 4 verbphrases)

| Category | Count | Auxiliary |
|----------|-------|-----------|
| Regular weak (haben) | ~70 | haben |
| Strong (haben) | ~20 | haben |
| Motion/state-change (sein) | ~17 | sein |
| Inseparable (mostly haben) | 17 | haben |
| Separable motion (sein) | 6 | sein |
| Separable activity (haben) | 13 | haben |
| Dual-auxiliary | 6 | both |
| Modal (Ersatzinfinitiv) | 7 | haben |

### Participle Formation Rules (8 rules)

| Rule | Condition | Pattern | Example |
|------|-----------|---------|---------|
| 1 | Weak regular | ge + stem + t | machen -> gemacht |
| 2 | Strong | ge + vowel-change + en | singen -> gesungen |
| 3 | Mixed | ge + consonant-change + t | bringen -> gebracht |
| 4 | Inseparable (inseparable: true) | NO ge- | besuchen -> besucht |
| 5 | Separable (separable: true) | prefix + ge + stem-participle | aufstehen -> aufgestanden |
| 6 | -ieren verb | stem + t, NO ge- | dekorieren -> dekoriert |
| 7 | Modal (Ersatzinfinitiv) | ge + modal-stem + t for standalone | können -> gekonnt |
| 8 | Dual-auxiliary | depends on transitive/intransitive use | fahren -> gefahren (both) |

### Dual-Auxiliary Verbs (6 confirmed)

| Key | Word | Participle | sein context | haben context |
|-----|------|-----------|-------------|---------------|
| fahren_verb | fahren | gefahren | directed movement: nach Berlin gefahren | transitive: das Auto gefahren |
| fliegen_verb | fliegen | geflogen | directed flight: nach Paris geflogen | transitive: das Flugzeug geflogen |
| schwimmen_verb | schwimmen | geschwommen | directed: über den See geschwommen | activity: eine Stunde geschwommen |
| laufen_verb | laufen | gelaufen | directed: nach Hause gelaufen | activity: 10 km gelaufen |
| ausziehen_verb | ausziehen | ausgezogen | move out: aus der Wohnung ausgezogen | undress: sich ausgezogen |
| wegfahren_verb | wegfahren | weggefahren | depart: weggefahren (default sein) | transitive (rare): das Auto weggefahren |

### Modal Verbs (7 — all haben, Ersatzinfinitiv)

| Key | Word | Standalone Participle | Ersatzinfinitiv Example |
|-----|------|--------------------|------------------------|
| moegen_verb | mögen | gemocht | hat singen mögen |
| koennen_verb | können | gekonnt | hat singen können |
| muessen_verb | müssen | gemusst | hat kommen müssen |
| wollen_verb | wollen | gewollt | hat gehen wollen |
| duerfen_verb | dürfen | gedurft | hat gehen dürfen |
| sollen_verb | sollen | gesollt | hat kommen sollen |
| moechten_modal | möchten | gemocht* | *defective: uses gemocht (from mögen); note required |

### Separable Verbs (19 — ge- between prefix and stem)

| Key | Word | Participle | Auxiliary | Note |
|-----|------|-----------|-----------|------|
| mitnehmen_verb | mitnehmen | mitgenommen | haben | strong: mit+ge+nommen |
| einpacken_verb | einpacken | eingepackt | haben | weak: ein+ge+packt |
| anrufen_verb | anrufen | angerufen | haben | strong: an+ge+rufen |
| anfangen_verb | anfangen | angefangen | haben | strong: an+ge+fangen |
| einladen_verb | einladen | eingeladen | haben | strong: ein+ge+laden |
| einkaufen_verb | einkaufen | eingekauft | haben | weak: ein+ge+kauft |
| sich_anziehen_verb | sich anziehen | angezogen | haben | strong separable reflexive: an+ge+zogen |
| aufwachen_verb | aufwachen | aufgewacht | sein | change of state: auf+ge+wacht |
| aufstehen_verb | aufstehen | aufgestanden | sein | change of state: auf+ge+standen |
| sich_aufregen_verb | sich aufregen | aufgeregt | haben | reflexive sep: auf+ge+regt |
| sich_ausruhen_verb | sich ausruhen | ausgeruht | haben | reflexive sep: aus+ge+ruht |
| sich_vorbereiten_verb | sich vorbereiten | vorbereitet | haben | **VERIFY: vorgebereitet or vorbereitet?** |
| mitbringen_verb | mitbringen | mitgebracht | haben | mixed: mit+ge+bracht |
| aufraeumen_verb | aufräumen | aufgeräumt | haben | sep: auf+ge+räumt |
| fernsehen_verb | fernsehen | ferngesehen | haben | sep: fern+ge+sehen |
| wegfahren_verb | wegfahren | weggefahren | both | sep DUAL: weg+ge+gefahren |
| mitkommen_verb | mitkommen | mitgekommen | sein | sep: mit+ge+kommen |
| ausziehen_verb | ausziehen | ausgezogen | both | sep DUAL: aus+ge+zogen |
| einschlafen_verb | einschlafen | eingeschlafen | sein | sep change of state: ein+ge+schlafen |

### Inseparable Prefix Verbs (17 — NO ge-)

| Key | Word | Participle | Prefix | Note |
|-----|------|-----------|--------|------|
| entspannen_verb | entspannen | entspannt | ent- | weak |
| beginnen_verb | beginnen | begonnen | be- | strong |
| besuchen_verb | besuchen | besucht | be- | weak |
| sich_entschuldigen_verb | sich entschuldigen | entschuldigt | ent- | weak reflexive |
| sich_verspaeten_verb | sich verspäten | verspätet | ver- | weak reflexive |
| sich_entspannen_verb | sich entspannen | entspannt | ent- | weak reflexive |
| sich_erholen_verb | sich erholen | erholt | er- | weak reflexive |
| sich_unterhalten_verb | sich unterhalten | unterhalten | unter- | strong reflexive |
| sich_bewegen_verb | sich bewegen | bewegt | be- | weak reflexive |
| verstehen_verb | verstehen | verstanden | ver- | strong |
| vergessen_verb | vergessen | vergessen | ver- | strong |
| verlieren_verb | verlieren | verloren | ver- | strong |
| vertrauen_verb | vertrauen | vertraut | ver- | weak |
| versprechen_verb | versprechen | versprochen | ver- | strong |
| erklaeren_verb | erklären | erklärt | er- | weak |
| erzaehlen_verb | erzählen | erzählt | er- | weak |
| bekommen_verb | bekommen | bekommen | be- | strong |

### Special Compound Verbs

| Key | Word | Participle | Auxiliary | Construction |
|-----|------|-----------|-----------|-------------|
| liegen_bleiben_verb | liegen bleiben | liegen geblieben | sein | infinitive + bleiben |
| spazieren_gehen_verb | spazieren gehen | spazieren gegangen | sein | infinitive + gehen |
| zaehneputzen_verb | Zähne putzen | Zähne geputzt | haben | noun + putzen (capital Z preserved) |

### -ieren Verbs (no ge-)

| Key | Word | Participle |
|-----|------|-----------|
| interessieren_verb | interessieren | interessiert |
| dekorieren_verb | dekorieren | dekoriert |
| sich_rasieren_verb | sich rasieren | rasiert |
| sich_interessieren_verb | sich interessieren | interessiert |
| sich_konzentrieren_verb | sich konzentrieren | konzentriert |

---

## Open Questions

1. **sich_vorbereiten participle: vorbereitet or vorgebereitet?**
   - What we know: vorbereiten is separable (presens: "ich bereite mich vor"). Separable rule = prefix + ge + stem. "vor" + "ge" + "bereitet" = "vorgebereitet".
   - What's unclear: Native German usage strongly favors "vorbereitet" not "vorgebereitet". This may be an exception or the rule may apply differently to this verb.
   - Recommendation: Research/verify native German. The correct form appears to be "vorbereitet" (i.e., the ge- is NOT inserted because "bereiten" is itself a base verb starting with "b"). Standard reference grammars should clarify. Flag in plan for manual verification before execution.

2. **haengen (hängen) — intransitive vs transitive participle**
   - What we know: `hängen` (intransitive, strong): Das Bild hat gehangen. `hängen` (transitive, weak): Ich habe das Bild gehängt.
   - What's unclear: The verbbank entry `haengen_verb` is listed without a transitive/intransitive indicator.
   - Recommendation: Use `gehangen` (strong, intransitive) as the default participle, and add a note in the plan. The verbbank entry likely covers the common intransitive usage.

3. **möchten Perfektum form**
   - What we know: `möchten` is a defective modal (Konjunktiv II of mögen used as polite present). Its preteritum uses `wollte` forms with a note. It has no standard independent Perfektum.
   - What's unclear: Should the participle be `gemocht` (from mögen), `gewollt` (as preteritum suggests), or should a note explain the verb has no Perfektum?
   - Recommendation: Use `gemocht` as the Partizip II (from `mögen` which `möchten` derives from), with `modal_note` explaining: "möchten has no Perfektum; 'gemocht' is the Partizip II of the underlying mögen. In practice, 'hat gewollt' or 'hat mögen' is used."

4. **Scope: 148 vs 144 entries**
   - What we know: PERF-01 says "All 148 German verbs." The bank has 148 entries (144 true verbs + 4 verbphrases). REQUIREMENTS.md Out of Scope: "Verbphrase Perfektum."
   - Recommendation: The plan should target 144 entries and note this discrepancy. The success criteria count of "148" is an overcount that pre-dates the Out of Scope decision for verbphrases.

---

## State of the Art

| Old Approach | Current Approach | Impact |
|--------------|------------------|--------|
| No perfektum data | Add complete Perfektum block to all 144 verb entries | Phase 15 can sync to dictionary verbbank; inflection search can find past participle forms |
| Schema missing Perfektum fields | Phase 11 added all 6 required fields to tenseConjugation | No schema change needed in Phase 13 |
| Inseparable flag absent | Phase 12 added inseparable: true to 17 verbs | Phase 13 can use this flag to verify correct (no ge-) participle for inseparable verbs |
| grammar_perfektum not registered | Phase 11 registered it in grammar-features.json | Feature flag ready for app use; `"feature": "grammar_perfektum"` can be added to perfektum block |

---

## Sources

### Primary (HIGH confidence)

- Direct inspection: `vocabulary/core/de/verbbank.json` — 148 entries confirmed, 0 with perfektum data, all with preteritum, separable/inseparable flags confirmed
- Direct inspection: `vocabulary/schema/verb.schema.json` — all 6 Perfektum fields confirmed present from Phase 11 (auxiliary, participle, auxiliary_note, dual_auxiliary, modal_note + existing former/feature)
- Direct inspection: `vocabulary/grammar-features.json` — `grammar_perfektum` feature confirmed registered with `dataPath: "conjugations.perfektum"`
- Direct inspection: `scripts/sync-preteritum.js` — ESM script injection pattern for verbbank modification
- Direct inspection: `scripts/validate-adjectives.js` — AJV validation pattern
- Direct inspection: AJV baseline run on current verbbank — 191 pre-existing errors confirmed
- `.planning/phases/11-schema-extensions/11-01-SUMMARY.md` — schema extension decisions
- `.planning/phases/12-pre-entry-audit/12-RESEARCH.md` — inseparable verb list (17 verified)
- `.planning/REQUIREMENTS.md` — PERF-01 through PERF-07, Out of Scope: Verbphrase Perfektum
- `.planning/STATE.md` — decision: explicit storage for all forms (no rule engines)

### Secondary (MEDIUM confidence)

- German grammar knowledge (training data): auxiliary selection rules (sein for movement/change-of-state, haben for transitive/most intransitive); verified by known German verb forms
- German grammar knowledge: participle formation rules (8 rules documented above); standard German grammar
- German grammar knowledge: Ersatzinfinitiv behavior for modal verbs; standard German grammar
- German grammar knowledge: -ieren verbs take no ge- prefix; standard German grammar

### Tertiary (LOW confidence)

- sich_vorbereiten participle form: "vorbereitet" vs "vorgebereitet" — requires native speaker verification or authoritative grammar reference before plan execution

---

## Metadata

**Confidence breakdown:**
- Scope and data structure: HIGH — confirmed by direct file inspection
- Participle forms (regular/strong/mixed verbs): HIGH — well-established German grammar
- Auxiliary selection (haben/sein/both): HIGH — well-established German grammar rules
- Modal Ersatzinfinitiv behavior: HIGH — well-established German grammar
- sich_vorbereiten participle: LOW — conflicting signals; needs verification
- Script injection pattern: HIGH — follows verified sync-preteritum.js pattern

**Research date:** 2026-02-22
**Valid until:** 2026-04-22 (stable domain — data files and schemas won't change)
