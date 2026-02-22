# Phase 12: Pre-Entry Audit - Research

**Researched:** 2026-02-22
**Domain:** JSON data editing — German vocabulary banks (core verbbank, core nounbank, dictionary verbbank)
**Confidence:** HIGH

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| AUDIT-01 | All 20 inseparable prefix verbs (be-, ver-, er-, ent-, ge- prefixed) have `inseparable: true` in the core verbbank and pass schema validation | Direct inspection: 148 core verbs identified; 17 have confirmed inseparable prefixes (roadmap estimate of 20 may be slightly off — plan must identify the definitive list). Schema already has `inseparable` boolean field from Phase 11. |
| AUDIT-02 | All 11 n-Deklination nouns have `weak_masculine: true` in the core nounbank and pass schema validation | Direct inspection: all 11 n-Deklination nouns identified and confirmed present in core nounbank (loewe_noun, affe_noun, hase_noun, neffe_noun, mensch_noun, elefant_noun, baer_noun, nachbar_noun, klassenkamerad_noun, superheld_noun, morgenmensch_noun). Schema has `weak_masculine` boolean from Phase 11. |
| AUDIT-03 | Preteritum conjugations are present for all 148 verbs in `vocabulary/dictionary/de/verbbank.json` | Direct inspection: 0 of 148 shared verbs in dictionary verbbank have preteritum; core verbbank has preteritum for all 148. Sync = copy `conjugations.preteritum` from core to dictionary for each matching key. |
</phase_requirements>

---

## Summary

Phase 12 is a pure data-editing phase — no schema changes, no code changes, no new libraries. All three requirements are JSON file edits to two or three existing files.

AUDIT-01 and AUDIT-02 are flag-setting operations: add `"inseparable": true` to identified verb entries in `vocabulary/core/de/verbbank.json`, and add `"weak_masculine": true` to identified noun entries in `vocabulary/core/de/nounbank.json`. Both flags are already defined in the schemas from Phase 11, so no schema changes are needed and no existing data will be broken. The flags are entry-level booleans that simply need to be inserted.

AUDIT-03 is a sync operation: copy the `conjugations.preteritum` block from each of the 148 verbs in the core verbbank into the matching entry in the dictionary verbbank. The core has had preteritum since Phase 2 (v1.0); the dictionary verbbank was never synced. The sync is mechanical: for each key in core verbbank, if the key exists in dict verbbank (all 148 do), copy the `preteritum` sub-object from `core_entry.conjugations` into `dict_entry.conjugations`. The dict verbbank has extra fields (`cefr`, `frequency`, `curriculum`, `verbClass`) that must be preserved.

**Primary recommendation:** Write a one-off Node.js script to execute the AUDIT-03 sync (148 entries, 0 error margin acceptable — script is the safe approach), and handle AUDIT-01/02 as direct JSON edits (17 verbs and 11 nouns are small enough to edit by hand with verification).

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| AJV | ^8.18.0 (installed) | JSON Schema 2020-12 validation | Already in devDependencies; used in validate-adjectives.js pattern |
| Node.js (built-in) | runtime | Read/write JSON files, run scripts | No install needed |

### Supporting

No additional libraries needed. This phase is JSON data editing with optional Node.js scripting for the sync task.

**Installation:** None required — all dependencies already installed.

---

## Architecture Patterns

### File Layout

```
vocabulary/
├── core/de/
│   ├── verbbank.json        # 148 verbs — add inseparable: true (AUDIT-01), source of preteritum (AUDIT-03)
│   └── nounbank.json        # 331 nouns — add weak_masculine: true (AUDIT-02)
└── dictionary/de/
    └── verbbank.json        # 679 verbs — 148 overlap with core; copy preteritum here (AUDIT-03)
```

### Pattern 1: Adding a Boolean Flag to Existing Entries (AUDIT-01, AUDIT-02)

**What:** Insert `"inseparable": true` at the entry level of specific verb objects; insert `"weak_masculine": true` at the entry level of specific noun objects.
**When to use:** Targeted entry-level boolean additions. Field is already defined in schema from Phase 11.

```json
// Before (vocabulary/core/de/verbbank.json — besuchen_verb):
"besuchen_verb": {
  "word": "besuchen",
  "type": "weak",
  "conjugations": { ... },
  "_id": "besuchen_verb",
  "audio": "verb_besuchen.mp3"
}

// After:
"besuchen_verb": {
  "word": "besuchen",
  "type": "weak",
  "inseparable": true,
  "conjugations": { ... },
  "_id": "besuchen_verb",
  "audio": "verb_besuchen.mp3"
}
```

```json
// Before (vocabulary/core/de/nounbank.json — loewe_noun):
"loewe_noun": {
  "word": "Löwe",
  "genus": "m",
  "plural": "die Löwen",
  ...
}

// After:
"loewe_noun": {
  "word": "Löwe",
  "genus": "m",
  "weak_masculine": true,
  "plural": "die Löwen",
  ...
}
```

### Pattern 2: Preteritum Sync via Script (AUDIT-03)

**What:** Copy `conjugations.preteritum` from core verbbank to dictionary verbbank for all 148 matching entries.
**When to use:** 148 entries with zero tolerance for error — scripted is safer than manual.

```javascript
// Sync script pattern (Node.js ESM — follows validate-adjectives.js convention):
import { readFileSync, writeFileSync } from 'fs';

const core = JSON.parse(readFileSync('vocabulary/core/de/verbbank.json', 'utf8'));
const dict = JSON.parse(readFileSync('vocabulary/dictionary/de/verbbank.json', 'utf8'));

let synced = 0;
let skipped = 0;

for (const key of Object.keys(core)) {
  if (key === '_metadata') continue;
  if (!dict[key]) { skipped++; continue; }

  const coreConjs = core[key].conjugations || {};
  if (!coreConjs.preteritum) { skipped++; continue; }

  // Merge: add preteritum to dict entry's conjugations
  dict[key].conjugations = {
    ...dict[key].conjugations,
    preteritum: coreConjs.preteritum
  };

  // Also sync inseparable flag if set
  if (core[key].inseparable) {
    dict[key].inseparable = true;
  }

  synced++;
}

writeFileSync('vocabulary/dictionary/de/verbbank.json', JSON.stringify(dict, null, 2));
console.log(`Synced: ${synced}, skipped: ${skipped}`);
// Expected output: Synced: 148, skipped: 0
```

### Pattern 3: AJV Validation (follows existing project pattern)

```javascript
// From scripts/validate-adjectives.js — the project's validation pattern:
import Ajv2020 from 'ajv/dist/2020.js';
import { readFileSync } from 'fs';

const coreSchema = JSON.parse(readFileSync('vocabulary/schema/core-word.schema.json', 'utf8'));
const verbSchema = JSON.parse(readFileSync('vocabulary/schema/verb.schema.json', 'utf8'));
const verbbank = JSON.parse(readFileSync('vocabulary/core/de/verbbank.json', 'utf8'));

const ajv = new Ajv2020({ strict: false, allErrors: true });
ajv.addSchema(coreSchema, 'core-word.schema.json');
ajv.addSchema(verbSchema);
const validate = ajv.getSchema('https://papertek.no/schemas/vocabulary/verb.schema.json');
const valid = validate(verbbank);
// Note: pre-existing errors (149 "missing translations", 42 "enum" errors) exist on core verbbank
// These are pre-existing data quality debt from Phase 11 — not introduced by Phase 12
```

### Anti-Patterns to Avoid

- **Editing dictionary verbbank manually for 148 verbs:** Error-prone at scale. Use the sync script.
- **Forgetting to preserve dict-only fields:** `cefr`, `frequency`, `curriculum`, `verbClass` exist only in the dictionary verbbank. The sync script must merge, not replace.
- **Treating pre-existing AJV errors as Phase 12 failures:** Core verbbank has 191 pre-existing AJV errors (149 `required: translations` + 42 `enum`); core nounbank has 356. These are data quality debt from before Phase 12. Phase 12 only needs to confirm that new flags do NOT introduce new errors.
- **Adding `inseparable: false` to non-inseparable verbs:** The flag means "this verb has an inseparable prefix." Non-inseparable verbs simply omit the field. Never add `inseparable: false`.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| JSON validation | Custom validator | AJV 8.x (already installed) | Industry-standard JSON Schema 2020-12 validator; already used in project |
| Preteritum existence check | Manual count | Node.js script counting keys | Zero chance of miscounting; repeatable |
| Sync completeness | Manual comparison | Script comparing before/after | Catches any missing/extra entries programmatically |

**Key insight:** This phase is data editing, not code building. The only "code" is a one-off sync script for AUDIT-03.

---

## Common Pitfalls

### Pitfall 1: Wrong Count for Inseparable Verbs

**What goes wrong:** The roadmap says "20 inseparable prefix verbs." Research finds 17 confirmed. Planning to 20 and then finding only 17 verbs that qualify.
**Why it happens:** The roadmap count was an estimate, not an audit. Some borderline cases (geben/gehen/gewinnen start with "ge-" but are root verbs, not ge-prefixed) could inflate the count.
**How to avoid:** The plan must use the audited list of 17 confirmed inseparable verbs (below), not assume 20. If the user has additional verbs in mind, they should be identified explicitly.
**Warning signs:** Trying to find more than 17 inseparable prefix verbs without clear linguistic justification.

### Pitfall 2: Including Root Verbs That Start with ge-

**What goes wrong:** `geben`, `gehen`, `gewinnen` all start with "ge-" but are NOT ge-prefixed. The "ge-" is part of the stem, not an inseparable prefix. These must NOT get `inseparable: true`.
**Why it happens:** Automated prefix matching on string prefixes.
**How to avoid:** Cross-check: a verb is ge-prefixed only if removing "ge-" yields a meaningful base verb (e.g., "gelingen" — ge + "lingen" [rare base]; but gehen = go, no meaningful root without "ge-").
**Warning signs:** Adding `inseparable: true` to geben, gehen, or gewinnen.

### Pitfall 3: Forgetting sich unterhalten in the Inseparable List

**What goes wrong:** "unterhalten" can be separable (unter-halten = to hold underneath) OR inseparable (unterhalten = to entertain/chat with). In the verbbank, `sich unterhalten` (to have a conversation) is the inseparable form and needs `inseparable: true`.
**Why it happens:** unter- is a "dual prefix" (can be separable or inseparable depending on meaning).
**How to avoid:** `sich unterhalten` = to converse/chat. Conjugation: "er unterhält sich" (inseparable in presens). Past participle will be "unterhalten" (no ge-). Mark as inseparable.
**Warning signs:** Missing sich unterhalten from the inseparable list.

### Pitfall 4: Overwriting Dict-Only Fields in AUDIT-03

**What goes wrong:** Copying the entire core verb entry to dict, replacing `cefr`, `frequency`, `curriculum`, `verbClass` fields that only exist in the dict verbbank.
**Why it happens:** Naive replacement of the dict entry with the core entry.
**How to avoid:** Only add `conjugations.preteritum` to the existing dict entry's `conjugations` object. Merge, never replace.
**Warning signs:** After sync, dict entries missing `cefr`, `frequency`, or `curriculum` fields.

### Pitfall 5: Pre-Existing Validation Errors Treated as New Failures

**What goes wrong:** Running AJV validation after Phase 12 changes and seeing 191 verb errors and 356 noun errors, incorrectly concluding Phase 12 broke something.
**Why it happens:** Pre-existing data quality debt is not obvious without baseline measurement.
**How to avoid:** Establish baseline error counts BEFORE Phase 12 edits, then verify new error count is same or lower after edits.
**Baseline (confirmed by research):**
- Core verbbank: 191 AJV errors (149 missing `translations` + 42 `enum` type mismatches)
- Core nounbank: 356 AJV errors (332 missing `translations` + 23 `type` + 1 `const`)
- These are pre-existing — Phase 12 must not add to these counts.
**Warning signs:** Error count increases above baseline after adding flags.

### Pitfall 6: dict verbbank has 679 entries, not 148

**What goes wrong:** Treating the dict verbbank as if it only contains the 148 core verbs. The dict verbbank has 679 entries total — 148 that overlap with core, 531 that are dict-only.
**Why it happens:** Confusion about the dual-bank architecture.
**How to avoid:** The sync script should only process keys that exist in the core verbbank (the authoritative 148), not all dict verbbank keys.
**Warning signs:** Script attempting to sync preteritum to all 679 entries (most won't have core preteritum data).

---

## Code Examples

### Verified: Current core verbbank verb entry structure

```json
// vocabulary/core/de/verbbank.json
"besuchen_verb": {
  "word": "besuchen",
  "conjugations": {
    "presens": {
      "former": {
        "ich": "besuche",
        "du": "besuchst",
        "er/sie/es": "besucht",
        "wir": "besuchen",
        "ihr": "besucht",
        "sie/Sie": "besuchen"
      },
      "feature": "grammar_presens"
    },
    "preteritum": {
      "former": {
        "ich": "besuchte",
        "du": "besuchtest",
        "er/sie/es": "besuchte",
        "wir": "besuchten",
        "ihr": "besuchtet",
        "sie/Sie": "besuchten"
      },
      "feature": "grammar_preteritum"
    }
  },
  "_id": "besuchen_verb",
  "audio": "verb_besuchen.mp3"
}
```

### Verified: Current dictionary verbbank verb entry structure (pre-sync)

```json
// vocabulary/dictionary/de/verbbank.json
"besuchen_verb": {
  "word": "besuchen",
  "conjugations": {
    "presens": {
      "former": { "ich": "besuche", ... },
      "feature": "grammar_presens"
    }
    // preteritum MISSING — this is the AUDIT-03 gap
  },
  "_id": "besuchen_verb",
  "audio": "verb_besuchen.mp3",
  "curriculum": true,
  "cefr": "A1",
  "frequency": 84,
  "verbClass": {
    "default": "strong",
    "presens": "strong",
    "preteritum": "strong",
    "perfektum": "strong"
  }
}
```

### Verified: Target state after all three audit tasks

```json
// Core verbbank — besuchen_verb after AUDIT-01:
"besuchen_verb": {
  "word": "besuchen",
  "inseparable": true,        // <-- AUDIT-01 addition
  "conjugations": { ... },
  "_id": "besuchen_verb",
  "audio": "verb_besuchen.mp3"
}

// Dictionary verbbank — besuchen_verb after AUDIT-03 (+ inseparable sync):
"besuchen_verb": {
  "word": "besuchen",
  "inseparable": true,        // <-- synced from core (AUDIT-03 bonus)
  "conjugations": {
    "presens": { ... },
    "preteritum": { ... }     // <-- AUDIT-03 addition
  },
  "_id": "besuchen_verb",
  "audio": "verb_besuchen.mp3",
  "curriculum": true,
  "cefr": "A1",
  "frequency": 84,
  "verbClass": { ... }        // preserved
}

// Core nounbank — loewe_noun after AUDIT-02:
"loewe_noun": {
  "word": "Löwe",
  "weak_masculine": true,     // <-- AUDIT-02 addition
  "genus": "m",
  "plural": "die Löwen",
  ...
}
```

### Verified: Inline validation check pattern

```bash
# Count AJV errors on core verbbank (baseline: 191 before Phase 12):
node -e "
const Ajv = require('./node_modules/ajv/dist/2020.js').default;
const { readFileSync } = require('fs');
const ajv = new Ajv({strict: false, allErrors: true});
ajv.addSchema(JSON.parse(readFileSync('vocabulary/schema/core-word.schema.json','utf8')), 'core-word.schema.json');
const v = ajv.compile(JSON.parse(readFileSync('vocabulary/schema/verb.schema.json','utf8')));
const data = JSON.parse(readFileSync('vocabulary/core/de/verbbank.json','utf8'));
v(data);
console.log('AJV error count:', (v.errors || []).length, '(baseline: 191)');
"
```

---

## Definitive Lists

### AUDIT-01: Confirmed Inseparable Prefix Verbs (17 verified, roadmap estimated 20)

| Key | Word | Prefix | Note |
|-----|------|--------|------|
| besuchen_verb | besuchen | be- | |
| beginnen_verb | beginnen | be- | |
| bekommen_verb | bekommen | be- | |
| sich_bewegen_verb | sich bewegen | be- | |
| entspannen_verb | entspannen | ent- | |
| sich_entschuldigen_verb | sich entschuldigen | ent- | |
| sich_entspannen_verb | sich entspannen | ent- | |
| erklaeren_verb | erklären | er- | |
| erzaehlen_verb | erzählen | er- | |
| sich_erholen_verb | sich erholen | er- | |
| vergessen_verb | vergessen | ver- | |
| verlieren_verb | verlieren | ver- | |
| versprechen_verb | versprechen | ver- | |
| verstehen_verb | verstehen | ver- | |
| vertrauen_verb | vertrauen | ver- | |
| sich_verspaeten_verb | sich verspäten | ver- | |
| sich_unterhalten_verb | sich unterhalten | unter- (inseparable use) | "to have a conversation" — inseparable form |

**Excluded (root verbs, not prefixed):** geben (ge- is stem), gehen (ge- is stem), gewinnen (ge- is stem)

**Note on count:** The roadmap says "20 inseparable prefix verbs." Research found 17 confirmed. The discrepancy is likely because the roadmap count was an estimate. The plan should use this audited list of 17 and note the discrepancy.

### AUDIT-02: Confirmed n-Deklination Nouns (11 verified, matches roadmap)

| Key | Word | Reason |
|-----|------|--------|
| loewe_noun | Löwe | -e ending (masculine animal) |
| affe_noun | Affe | -e ending (masculine animal) |
| hase_noun | Hase | -e ending (masculine animal) |
| neffe_noun | Neffe | -e ending (family relation) |
| mensch_noun | Mensch | special n-Deklination (des Menschen) |
| elefant_noun | Elefant | -ant ending (foreign loanword) |
| baer_noun | Bär | n-Deklination despite no -e/-ant ending (des Bären) |
| nachbar_noun | Nachbar | n-Deklination (des Nachbarn) |
| klassenkamerad_noun | Klassenkamerad | Kamerad is n-Deklination (des Kameraden) |
| superheld_noun | Superheld | Held is n-Deklination (des Helden) |
| morgenmensch_noun | Morgenmensch | compound of Mensch — n-Deklination |

### AUDIT-03: Preteritum Sync Scope

- **Source:** `vocabulary/core/de/verbbank.json` — all 148 entries have `conjugations.preteritum`
- **Target:** `vocabulary/dictionary/de/verbbank.json` — 148 of 679 entries match core keys, all 148 missing preteritum
- **Operation:** For each of 148 matching keys, copy `preteritum` object from core conjugations to dict conjugations
- **Preserve:** All dict-only fields: `cefr`, `frequency`, `curriculum`, `verbClass`
- **Optional bonus:** Also copy `inseparable: true` to dict entries that get it in core (good housekeeping, keeps banks in sync)

---

## State of the Art

| Old Approach | Current Approach | Impact |
|--------------|------------------|--------|
| No inseparable flag | `inseparable: true` (schema ready from Phase 11) | Phase 13 will use this to correctly omit ge- in past participle for these verbs |
| No weak_masculine flag | `weak_masculine: true` (schema ready from Phase 11) | Phase 14 will use this to apply -(e)n endings in all non-nominative singular cases |
| Dict verbbank missing preteritum | Synced from core verbbank | Dict verbbank (served by v2 API) will have complete conjugation data |

---

## Open Questions

1. **Definitive inseparable count: 17 or 20?**
   - What we know: Research found 17 linguistically confirmed inseparable prefix verbs in the 148-verb core bank
   - What's unclear: Did the roadmap author have 3 additional verbs in mind that this research missed?
   - Recommendation: Use the audited list of 17. If the user knows of additional inseparable verbs not on the list, the plan execution step can add them. Do not pad to 20 with doubtful candidates.

2. **Should `inseparable: true` be synced to dict verbbank in AUDIT-03?**
   - What we know: AUDIT-03 says "preteritum data backfilled to dictionary verbbank." The inseparable flag is not explicitly mentioned.
   - What's unclear: Is this a desired housekeeping step?
   - Recommendation: Yes, sync both. The dual-bank pattern (STATE.md: "All data changes must cascade to both core and dictionary banks") implies the flag should also appear in the dict bank. Doing it in AUDIT-03 while already editing the dict verbbank is efficient.

3. **Should weak_masculine be synced to dict nounbank?**
   - What we know: AUDIT-02 only mentions core nounbank. Phase 15 (Sync & Integration) handles dict bank mirroring.
   - What's unclear: Whether Phase 12 should also add weak_masculine to the dict nounbank's 11 matching nouns.
   - Recommendation: Out of scope for Phase 12. Defer to Phase 15 which explicitly handles dict bank sync. This keeps Phase 12 cleanly scoped.

---

## Sources

### Primary (HIGH confidence)

- Direct inspection: `vocabulary/core/de/verbbank.json` — 148 verbs confirmed, 0 with inseparable flag, all with preteritum, full verb list analyzed for inseparable prefixes
- Direct inspection: `vocabulary/core/de/nounbank.json` — 331 nouns confirmed, 0 with weak_masculine flag, 11 n-Deklination nouns identified from 134 masculine nouns
- Direct inspection: `vocabulary/dictionary/de/verbbank.json` — 679 entries, 148 overlap with core, 0 with preteritum, 0 with inseparable flag
- Direct inspection: `vocabulary/schema/verb.schema.json` — `inseparable` boolean field confirmed present (from Phase 11)
- Direct inspection: `vocabulary/schema/noun.schema.json` — `weak_masculine` boolean field confirmed present (from Phase 11)
- Direct inspection: `scripts/validate-adjectives.js` — AJV validation pattern for project
- AJV baseline runs: core verbbank = 191 pre-existing errors; core nounbank = 356 pre-existing errors (confirmed)
- `.planning/REQUIREMENTS.md` — AUDIT-01/02/03 definitions
- `.planning/ROADMAP.md` — Phase 12 success criteria
- `.planning/STATE.md` — decisions, context, dual-bank sync requirement

### Secondary (MEDIUM confidence)

- German grammar knowledge (training data): n-Deklination noun classification (Löwe, Affe, Hase, Neffe, Mensch, Elefant, Bär, Nachbar, Kamerad/Kameraden, Held/Helden)
- German grammar knowledge (training data): inseparable prefix classification (be-, er-, ver-, ent- always inseparable; unter- inseparable in "unterhalten")

---

## Metadata

**Confidence breakdown:**
- AUDIT-01 (inseparable flags): HIGH for data facts (verb list, schema, current state); MEDIUM for final count (17 confirmed, roadmap says 20)
- AUDIT-02 (weak_masculine flags): HIGH for all 11 nouns and their keys; verified against actual data
- AUDIT-03 (preteritum sync): HIGH — 0/148 in dict vs 148/148 in core; sync script pattern clear
- Pre-existing AJV errors: HIGH — confirmed by actual AJV runs (191 verb, 356 noun)
- Architecture patterns: HIGH — Phase 11 PLAN.md and Phase 02/10 patterns all reviewed

**Research date:** 2026-02-22
**Valid until:** 2026-04-22 (stable domain — data files and schemas won't change between now and planning)
