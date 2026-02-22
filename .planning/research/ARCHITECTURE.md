# Architecture Research

**Domain:** Vocabulary API — German Perfektum & Noun Declension integration (v1.2)
**Researched:** 2026-02-22
**Confidence:** HIGH (all findings from direct codebase inspection)

## Standard Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     CONSUMERS                                    │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Leksihjelp Chrome Extension                             │   │
│  │  GET /api/vocab/v1/core/german  (inflection search)      │   │
│  │  GET /api/vocab/v2/lookup/german/{id}  (detail view)     │   │
│  │  GET /api/vocab/v2/search/german?q=...  (text search)    │   │
│  └──────────────────────────────────────────────────────────┘   │
└────────────────────────┬────────────────────────────────────────┘
                         │ HTTP/JSON
┌────────────────────────▼────────────────────────────────────────┐
│                     VERCEL EDGE (auto-deploy on push to main)    │
│                                                                  │
│  api/vocab/v1/core/[language].js    — serves core/ banks merged │
│  api/vocab/v2/lookup/[language]/[wordId].js  — rich entry view  │
│  api/vocab/v2/search/[language].js  — search-index queries      │
│  api/vocab/v1/grammarfeatures.js    — grammar-features metadata │
└────────────────────────┬────────────────────────────────────────┘
                         │ fs.readFileSync (bundled with function)
┌────────────────────────▼────────────────────────────────────────┐
│                     DATA LAYER (JSON files)                      │
│                                                                  │
│  vocabulary/core/de/                                             │
│  ├── verbbank.json     (presens + preteritum; 148 entries)       │
│  └── nounbank.json     (genus, plural, partial cases; 331)       │
│                                                                  │
│  vocabulary/dictionary/de/                                       │
│  ├── verbbank.json     (core + verbClass, cefr, frequency)      │
│  ├── nounbank.json     (core + curriculum, cefr, frequency)     │
│  └── search-index.json (3,454 entries; base forms only)         │
│                                                                  │
│  vocabulary/schema/                                              │
│  ├── verb.schema.json  (tenseConjugation; no auxiliary field)   │
│  └── noun.schema.json  (cases flat bestemt/ubestemt; no sg/pl)  │
│                                                                  │
│  vocabulary/grammar-features.json  (feature registry)           │
└─────────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | v1.2 Integration Impact |
|-----------|----------------|-------------------------|
| `vocabulary/core/de/verbbank.json` | Grammar source of truth for v1 API (presens, preteritum). Leksihjelp reads this for inflection search. | Add `conjugations.perfektum` block to all 148 entries. |
| `vocabulary/dictionary/de/verbbank.json` | Extended metadata (verbClass, cefr, frequency) for v2 lookup. Mirrors core grammar data. | Add same `conjugations.perfektum` block. Dual-bank sync required. |
| `vocabulary/core/de/nounbank.json` | Grammar source of truth for v1 API (genus, plural, partial cases). | Add full 4-case declension to `cases` field for all 331 entries. |
| `vocabulary/dictionary/de/nounbank.json` | Extended metadata for nouns in v2 lookup. | Add same cases extension. Dual-bank sync required. |
| `vocabulary/dictionary/de/search-index.json` | Flat array of 3,454 base-form entries. Searched by v2 search API. Inflection lookup is client-side by Leksihjelp from the full v1 bank. | Add `pp` field (past participle) to verb entries for past-participle search. Rebuild after data changes. |
| `vocabulary/schema/verb.schema.json` | Validates verb bank entries. `tenseConjugation` has `former` and optional `feature`. | Extend `tenseConjugation` with optional `auxiliary` and `participle` fields. |
| `vocabulary/schema/noun.schema.json` | Validates noun bank entries. `caseEntry` uses flat `bestemt`/`ubestemt`. | Extend `caseEntry` to support nested `singular`/`plural` with `definite`/`indefinite`. |
| `vocabulary/grammar-features.json` | Grammar feature registry for progressive disclosure. Already has `grammar_perfektum` (dataPath: `conjugations.perfektum`). | Add `grammar_noun_declension` and `grammar_genitiv` features. |
| `api/vocab/v2/lookup/[language]/[wordId].js` | Merges core + dictionary + translation. Already passes `conjugations`, `cases`, `declension` through automatically. Already checks `entry.conjugations?.perfektum` for feature flag. | Add grammar feature detection for noun declension cases. Minor code change. |
| `api/vocab/v1/core/[language].js` | Serves all fields from core bank. Automatic passthrough. | No change — new fields picked up automatically. |
| `vocabulary/dictionary/verb-classification-de.json` | Per-tense verb class registry. Already has `perfektum` column for all 148 verbs. | No change. |

## Recommended Project Structure (additions only)

The existing structure does not change. New data slots into existing files:

```
vocabulary/
├── core/de/
│   ├── verbbank.json          MODIFIED — add conjugations.perfektum to all 148 entries
│   └── nounbank.json          MODIFIED — extend cases to full 4-case structure for all 331
├── dictionary/de/
│   ├── verbbank.json          MODIFIED — same perfektum additions (dual-bank sync)
│   ├── nounbank.json          MODIFIED — same cases extension (dual-bank sync)
│   └── search-index.json      MODIFIED — add pp field to verb entries; rebuild
├── schema/
│   ├── verb.schema.json       MODIFIED — add auxiliary + participle to tenseConjugation
│   └── noun.schema.json       MODIFIED — extend caseEntry for singular/plural
└── grammar-features.json      MODIFIED — add grammar_noun_declension + grammar_genitiv
api/vocab/v2/lookup/[language]/[wordId].js   MODIFIED — noun declension feature detection
```

No new files. No new API endpoints.

## Recommended JSON Structures

### Perfektum Conjugation Block (verb entries)

**Design rationale:** The preteritum precedent stores full conjugated forms in `conjugations.{tense}.former.{pronoun}`. Perfektum is a compound tense: auxiliary conjugation + invariable past participle. Storing the full phrase per pronoun (e.g., `"ich": "habe gemacht"`) is verbose but maximally explicit and matches the preteritum pattern exactly. Clients can display forms directly without knowing auxiliary conjugation rules.

The `auxiliary` and `participle` fields are stored at the tense level as metadata for UI hints (display "haben + gemacht") and for dual-auxiliary explanations. These are optional extensions to the existing `tenseConjugation` schema.

**Standard haben verb (machen):**

```json
"machen_verb": {
  "word": "machen",
  "conjugations": {
    "presens": { "former": { "ich": "mache", ... }, "feature": "grammar_presens" },
    "preteritum": { "former": { "ich": "machte", ... }, "feature": "grammar_preteritum" },
    "perfektum": {
      "auxiliary": "haben",
      "participle": "gemacht",
      "former": {
        "ich":      "habe gemacht",
        "du":       "hast gemacht",
        "er/sie/es":"hat gemacht",
        "wir":      "haben gemacht",
        "ihr":      "habt gemacht",
        "sie/Sie":  "haben gemacht"
      },
      "feature": "grammar_perfektum"
    }
  }
}
```

**Standard sein verb (fahren):**

```json
"fahren_verb": {
  "word": "fahren",
  "conjugations": {
    "presens": { "former": { "ich": "fahre", ... }, "feature": "grammar_presens" },
    "preteritum": { "former": { "ich": "fuhr", ... }, "feature": "grammar_preteritum" },
    "perfektum": {
      "auxiliary": "sein",
      "participle": "gefahren",
      "former": {
        "ich":      "bin gefahren",
        "du":       "bist gefahren",
        "er/sie/es":"ist gefahren",
        "wir":      "sind gefahren",
        "ihr":      "seid gefahren",
        "sie/Sie":  "sind gefahren"
      },
      "feature": "grammar_perfektum"
    }
  }
}
```

**Dual-auxiliary verb (hängen — transitive: hat gehangen, intransitive: ist gehangen):**

Four verbs in the 148-entry bank are dual-auxiliary: `sitzen_verb`, `liegen_verb`, `haengen_verb`, `stehen_verb`. These are standard-German verbs where regional or transitive/intransitive usage determines auxiliary. The `auxiliary_note` field stores a human-readable explanation per translation language.

```json
"haengen_verb": {
  "word": "hängen",
  "conjugations": {
    "perfektum": {
      "auxiliary": "both",
      "participle": "gehangen",
      "auxiliary_note": {
        "nb": "Transitiv (noe henger opp): hat gehangen. Intransitiv (noe henger): ist gehangen.",
        "en": "Transitive (hang something): hat gehangen. Intransitive (be hanging): ist gehangen."
      },
      "former": {
        "ich":      "hat/ist gehangen",
        "du":       "hast/bist gehangen",
        "er/sie/es":"hat/ist gehangen",
        "wir":      "haben/sind gehangen",
        "ihr":      "habt/seid gehangen",
        "sie/Sie":  "haben/sind gehangen"
      },
      "feature": "grammar_perfektum"
    }
  }
}
```

### Noun Case Declension Block (noun entries)

**Design rationale:** The existing `cases` field stores partial case data with flat `bestemt`/`ubestemt` keys at the case level (Norwegian terms, singular only). For v1.2 full declension, each case needs both singular and plural, each with definite and indefinite article. The structure is extended to add nested `singular`/`plural` within each case — using German-aligned terms `definite`/`indefinite` to match the adjective declension convention.

The existing flat `bestemt`/`ubestemt` values on nominativ (used for 223 nouns in the curriculum progression) are retained as-is for backward compatibility. The new `singular`/`plural` sub-objects are ADDED alongside them, not replacing them. This avoids any breaking change for Leksihjelp's existing nominativ usage.

**Full 4-case noun entry (Mann):**

```json
"mann_noun": {
  "word": "Mann",
  "genus": "m",
  "plural": "Männer",
  "cases": {
    "nominativ": {
      "bestemt":   "der Mann",
      "ubestemt":  "ein Mann",
      "singular":  { "definite": "der Mann",    "indefinite": "ein Mann"    },
      "plural":    { "definite": "die Männer",   "indefinite": "Männer"      }
    },
    "akkusativ": {
      "singular":  { "definite": "den Mann",    "indefinite": "einen Mann"  },
      "plural":    { "definite": "die Männer",   "indefinite": "Männer"      }
    },
    "dativ": {
      "singular":  { "definite": "dem Mann",    "indefinite": "einem Mann"  },
      "plural":    { "definite": "den Männern",  "indefinite": "Männern"     }
    },
    "genitiv": {
      "singular":  { "definite": "des Mannes",  "indefinite": "eines Mannes"},
      "plural":    { "definite": "der Männer",   "indefinite": "Männer"      }
    }
  }
}
```

**Plural-only noun (Eltern — already has cases in bank):**

```json
"eltern_noun": {
  "word": "Eltern",
  "genus": "pl",
  "plural": null,
  "cases": {
    "nominativ": {
      "bestemt":  "die Eltern",
      "ubestemt": "Eltern",
      "plural":   { "definite": "die Eltern", "indefinite": "Eltern" }
    },
    "akkusativ": {
      "plural":   { "definite": "die Eltern", "indefinite": "Eltern" }
    },
    "dativ": {
      "plural":   { "definite": "den Eltern", "indefinite": "Eltern" }
    },
    "genitiv": {
      "plural":   { "definite": "der Eltern", "indefinite": "Eltern" }
    }
  }
}
```

**Why this additive approach over a breaking change:**
- 223 noun entries already have `cases.nominativ.bestemt`/`ubestemt`. These are read by Leksihjelp for curriculum exercises. Removing them would break existing functionality.
- Adding `singular`/`plural` sub-objects alongside is a pure extension — consumers that only read the flat fields continue working.
- New consumers (Leksihjelp v1.2 update) can read the richer `singular`/`plural` structure.

### Search Index Extension for Past Participles

The search index (`dictionary/de/search-index.json`) contains one entry per word — only the base form `w`. Inflection search is done client-side by Leksihjelp reading the full v1 bank. However, past participles are particularly important for inflection lookup because they often look nothing like the infinitive (`gefahren` vs `fahren`).

Add a `pp` field to verb entries in the search index. The v2 search handler already searches `entry.w` — updating it to also search `entry.pp` when present enables past-participle lookup via the API's text search:

```json
{
  "id": "fahren_verb",
  "w": "fahren",
  "t": "verb",
  "pp": "gefahren",
  "f": 372,
  "c": "A1",
  "cur": true,
  "vc": "strong",
  "tr": { "nb": "å kjøre / å reise", "en": "to drive / to travel" }
}
```

For noun declined forms (e.g., `des Mannes`, `den Männern`): these are NOT added to the search index as separate fields. German noun declension inflection lookup is handled client-side from the full bank, consistent with how adjective inflection is handled. Adding 8-16 form strings per noun would more than triple the search index size (from 3,454 to ~8,000+ entries or significantly larger entries) for marginal benefit given client-side handling already works.

### Grammar Features Extension

Add two new features to `vocabulary/grammar-features.json` under the German `features` array:

```json
{
  "id": "grammar_noun_declension",
  "name": "Substantivbøyning",
  "nameEn": "Noun Declension",
  "description": "Alle fire kasus (nominativ, akkusativ, dativ, genitiv) i entall og flertall",
  "descriptionEn": "All four cases (nominative, accusative, dative, genitive) in singular and plural",
  "category": "nouns",
  "appliesTo": ["noun"],
  "dataPath": "cases"
},
{
  "id": "grammar_genitiv",
  "name": "Genitiv",
  "nameEn": "Genitive",
  "description": "Genitiv kasus (des/der/eines/einer)",
  "descriptionEn": "Genitive case",
  "category": "nouns",
  "appliesTo": ["noun"],
  "dataPath": "cases.genitiv",
  "dependsOn": "grammar_noun_declension"
}
```

### v2 Lookup Handler Extension

The existing handler already passes through `conjugations` (including `perfektum`), `cases`, and `declension`. The only required change is adding grammar feature detection for noun declension:

```javascript
// Existing (unchanged):
if (entry.conjugations?.perfektum) grammarFeatures.push('grammar_perfektum');

// Add after existing case checks:
if (entry.cases?.nominativ?.singular || entry.cases?.akkusativ?.singular ||
    entry.cases?.dativ?.singular || entry.cases?.genitiv?.singular) {
  grammarFeatures.push('grammar_noun_declension');
}
if (entry.cases?.genitiv?.singular || entry.cases?.genitiv?.plural) {
  grammarFeatures.push('grammar_genitiv');
}
```

### Schema Extension: verb.schema.json

The `tenseConjugation` definition needs two optional fields added to the `tenseConjugation` $def:

```json
"tenseConjugation": {
  "type": "object",
  "properties": {
    "intro":       { "type": "string", "pattern": "^[0-9]+\\.[0-9]+$" },
    "feature":     { "type": "string" },
    "auxiliary":   { "type": "string", "enum": ["haben", "sein", "both"] },
    "participle":  { "type": "string", "description": "Past participle form" },
    "auxiliary_note": {
      "type": "object",
      "description": "Explanation of dual auxiliary usage, keyed by language code",
      "additionalProperties": { "type": "string" }
    },
    "former": {
      "type": "object",
      "additionalProperties": { "type": "string" }
    }
  },
  "required": ["former"]
}
```

### Schema Extension: noun.schema.json

Extend `caseEntry` to allow both the existing flat form and the new nested singular/plural structure:

```json
"caseEntry": {
  "type": "object",
  "properties": {
    "intro":     { "type": "string", "pattern": "^[0-9]+\\.[0-9]+$" },
    "feature":   { "type": "string" },
    "bestemt":   { "type": "string", "description": "Definite form (legacy, retained for backward compat)" },
    "ubestemt":  { "type": "string", "description": "Indefinite form (legacy, retained for backward compat)" },
    "singular":  { "$ref": "#/$defs/caseNumberForms" },
    "plural":    { "$ref": "#/$defs/caseNumberForms" }
  }
},
"caseNumberForms": {
  "type": "object",
  "properties": {
    "definite":   { "type": "string" },
    "indefinite": { "type": "string" }
  },
  "additionalProperties": false
}
```

## Data Flow

### Inflection Search Flow (Leksihjelp — Perfektum)

```
Student reads "Ich bin gestern gefahren"
    ↓
Leksihjelp fetches GET /api/vocab/v1/core/german (full bank)
    ↓
Leksihjelp indexes conjugations.perfektum.participle cells:
  { "gefahren" → "fahren_verb", "gemacht" → "machen_verb", ... }
    ↓
Match "gefahren" → returns "fahren_verb" base entry to student
```

Additionally, v2 text search will find past participles via the new `pp` field in search-index.json.

### Inflection Search Flow (Leksihjelp — Noun Declension)

```
Student reads "des Mannes"
    ↓
Leksihjelp fetches GET /api/vocab/v1/core/german (full bank)
    ↓
Leksihjelp indexes cases.{case}.singular.definite / indefinite cells:
  { "des Mannes" → "mann_noun", "dem Mann" → "mann_noun", ... }
    ↓
Match "des Mannes" → returns "mann_noun" base entry to student
```

### Dictionary Lookup Flow (v2 — verb with Perfektum)

```
GET /api/vocab/v2/lookup/german/fahren_verb
    ↓
Reads vocabulary/dictionary/de/verbbank.json → entry
  (entry.conjugations.perfektum is present after v1.2 data update)
    ↓
Handler: if (entry.conjugations) response.conjugations = entry.conjugations
Handler: if (entry.conjugations?.perfektum) grammarFeatures.push('grammar_perfektum')
    ↓ (already implemented — no code change needed for perfektum)
Response includes perfektum conjugation table and feature flag
```

### Dictionary Lookup Flow (v2 — noun with declension)

```
GET /api/vocab/v2/lookup/german/mann_noun
    ↓
Reads vocabulary/dictionary/de/nounbank.json → entry
  (entry.cases has full 4-case structure after v1.2 data update)
    ↓
Handler: if (entry.cases) response.cases = entry.cases
Handler: new detection logic → grammarFeatures.push('grammar_noun_declension', 'grammar_genitiv')
    ↓
Response includes full case declension table and feature flags
```

### Dual-Bank Sync Pattern

Core and dictionary banks are maintained as separate files with IDENTICAL grammar data. The pattern established by adjective declension:

```
Core bank update  →  Dictionary bank update  (always both, never only one)
       ↓
Schema validation against verb.schema.json or noun.schema.json
       ↓
Search index rebuild (derived artifact from dictionary bank)
```

The translation banks (`translations/de-nb/`, `translations/de-en/`) are NOT affected by Perfektum or noun declension additions — these features add grammar data to verb/noun entries that already exist in the translation banks.

## Integration Points

### New vs Modified Components

| Component | Status | Change Description |
|-----------|--------|--------------------|
| `vocabulary/core/de/verbbank.json` | MODIFIED | Add `conjugations.perfektum` (auxiliary, participle, former x6, feature) to all 148 entries |
| `vocabulary/dictionary/de/verbbank.json` | MODIFIED | Same Perfektum block (dual-bank sync). Note: dictionary verbbank has 679 entries total; only the 148 core entries need updating for v1.2 |
| `vocabulary/core/de/nounbank.json` | MODIFIED | Extend `cases` to full 4-case singular/plural structure for all 331 entries |
| `vocabulary/dictionary/de/nounbank.json` | MODIFIED | Same cases extension (dual-bank sync). Dictionary nounbank has 1,641 entries; only the 331 core entries are in scope |
| `vocabulary/schema/verb.schema.json` | MODIFIED | Add `auxiliary`, `participle`, `auxiliary_note` as optional fields to `tenseConjugation` $def |
| `vocabulary/schema/noun.schema.json` | MODIFIED | Add `singular`/`plural` as optional nested objects within `caseEntry`; add `caseNumberForms` $def |
| `vocabulary/grammar-features.json` | MODIFIED | Add `grammar_noun_declension` and `grammar_genitiv` entries under German features |
| `api/vocab/v2/lookup/[language]/[wordId].js` | MODIFIED | Add grammar feature detection for noun declension cases (4-5 lines) |
| `vocabulary/dictionary/de/search-index.json` | MODIFIED | Add `pp` (past participle) field to verb entries; rebuild index after bank updates |
| `api/vocab/v1/core/[language].js` | NO CHANGE | Serves all fields from core bank — new fields picked up automatically |
| `vocabulary/dictionary/verb-classification-de.json` | NO CHANGE | Already has `perfektum` classification column for all verbs |
| Translation banks (`translations/de-nb/`, `translations/de-en/`) | NO CHANGE | No new entries added; grammar data is language-intrinsic |

### What is Already in Place (No Work Needed)

- `grammar_perfektum` is already registered in `grammar-features.json` with correct `dataPath: "conjugations.perfektum"`
- `api/vocab/v2/lookup` already checks `entry.conjugations?.perfektum` and emits `grammar_perfektum`
- `api/vocab/v2/lookup` already passes `entry.cases` and `entry.declension` through to the response
- `vocabulary/dictionary/verb-classification-de.json` already has `perfektum` column on all 148 verbs
- The `tenseConjugation` pattern (former + feature) is battle-tested and extensible
- All 148 verbs exist in both core and dictionary banks; no new entries needed

## Data Volume Estimates

| Feature | Entries | Cells per Entry | Total Cells | Comparison |
|---------|---------|-----------------|-------------|------------|
| Perfektum (verbs) | 148 | ~9 (auxiliary, participle, 6 pronoun forms, feature) | ~1,332 values | Trivial vs 39,800 adjective cells |
| Noun declension | 331 | 16 (4 cases x 2 numbers x 2 articles) | 5,296 cells | ~13% of adjective workload |

Perfektum data entry is fast (one participle + one auxiliary per verb = ~2 decisions each). The 6 pronoun forms are mechanically derived from the auxiliary choice — `sein` → ist/bist/bin/sind/seid/sind; `haben` → hat/hast/habe/haben/habt/haben — combined with the invariable participle.

Noun declension is the heavier task: 331 nouns × 16 cells = 5,296 cells to verify. However, many German noun declension cells are predictable: nominativ and akkusativ are identical for feminine and neuter nouns; plural indefinite is always the bare plural form; dative plural adds `-n` to the plural if it doesn't already end in `-n` or `-s`. The exception rate is lower than for verbs (where ablaut is unpredictable) or adjectives (where multiple article types interact).

## Build Order

Build order respects data and schema dependencies. Schema must precede data; data must precede index rebuild.

### Phase 1: Schema Extensions

**Goal:** Extend `verb.schema.json` and `noun.schema.json` for the new fields.

**Why first:** Schema defines the contract. Data can be validated against schema during entry. Errors caught early. Running schema first also surfaces any design issues with the chosen structure before data entry begins.

**Dependency:** None.

**Files modified:** `vocabulary/schema/verb.schema.json`, `vocabulary/schema/noun.schema.json`

### Phase 2: Grammar Features Registry

**Goal:** Add `grammar_noun_declension` and `grammar_genitiv` to `vocabulary/grammar-features.json`.

**Why second:** The grammar features registry is consumed by both the v2 lookup API and by Leksihjelp. Adding features before data exists is safe — features are only emitted when data is present (handler checks `entry.cases?.genitiv?.singular`).

**Can run in parallel with Phase 1.**

**Dependency:** None.

**Files modified:** `vocabulary/grammar-features.json`

### Phase 3: Perfektum Data — Core Verbbank

**Goal:** Add `conjugations.perfektum` to all 148 entries in `vocabulary/core/de/verbbank.json`.

**Why third:** Perfektum is the simpler of the two new data features. Each verb needs: one auxiliary choice, one past participle form, and six full-phrase forms derived mechanically from auxiliary + participle. Verify each participle individually against Duden (strong verbs have irregular participles; weak verbs are formulaic with `ge-` + stem + `-t`).

**Dependency:** Phase 1 complete (schema available for validation).

**Files modified:** `vocabulary/core/de/verbbank.json`

### Phase 4: Perfektum Data — Dictionary Verbbank Sync

**Goal:** Mirror the Perfektum block from core to all 148 matching entries in `vocabulary/dictionary/de/verbbank.json`.

**Why fourth:** Dual-bank sync is a hard constraint. The dictionary bank is what the v2 lookup API reads. Perfektum must be in both files. Dictionary verbbank has 679 entries; only the 148 curriculum entries need updating (identified by `curriculum: true`).

**Dependency:** Phase 3 complete.

**Files modified:** `vocabulary/dictionary/de/verbbank.json`

### Phase 5: Noun Declension Data — Core Nounbank

**Goal:** Extend `cases` in all 331 entries in `vocabulary/core/de/nounbank.json` to include full 4-case singular/plural structure.

**Why fifth:** Noun declension is the largest data task. 331 × 16 cells = 5,296 cells. Additive approach: retain existing `bestemt`/`ubestemt` flat values on nominativ (223 entries already have them) and add `singular`/`plural` sub-objects. Special handling needed for plural-only nouns (`genus: pl`) — skip `singular` object; for uncountable nouns (`plural: null`) — skip `plural` object.

**Dependency:** Phase 1 complete (schema available for validation).

**Can run in parallel with Phases 3 and 4.**

**Files modified:** `vocabulary/core/de/nounbank.json`

### Phase 6: Noun Declension Data — Dictionary Nounbank Sync

**Goal:** Mirror the cases extension from core to all 331 matching entries in `vocabulary/dictionary/de/nounbank.json`.

**Dependency:** Phase 5 complete.

**Files modified:** `vocabulary/dictionary/de/nounbank.json`

### Phase 7: v2 Lookup Handler Update

**Goal:** Add grammar feature detection for noun declension to `api/vocab/v2/lookup/[language]/[wordId].js`.

**Why seventh:** Small code change (4-5 lines). The API already passes `cases` through automatically — this only adds the `grammar_noun_declension` and `grammar_genitiv` feature flag detection.

**Dependency:** Phase 2 complete (feature IDs defined in registry).

**Can run in parallel with Phases 3-6.**

**Files modified:** `api/vocab/v2/lookup/[language]/[wordId].js`

### Phase 8: Search Index Rebuild

**Goal:** Add `pp` field to verb entries and rebuild `vocabulary/dictionary/de/search-index.json`.

**Why last:** The search index is a derived artifact. It must be rebuilt after all data changes are complete. Adding `pp` (past participle) to verb entries requires reading the participle from the updated dictionary verbbank.

**Dependency:** Phase 4 complete (dictionary verbbank has participle data).

**Files modified:** `vocabulary/dictionary/de/search-index.json`

### Build Order Summary

| Phase | Task | Dependency | Parallel With |
|-------|------|------------|---------------|
| 1 | Schema extensions (verb + noun) | None | Phase 2 |
| 2 | Grammar features registry | None | Phase 1 |
| 3 | Perfektum data → core verbbank | Phase 1 | Phase 5 |
| 4 | Perfektum data → dictionary verbbank sync | Phase 3 | Phase 5, 6 |
| 5 | Noun declension → core nounbank | Phase 1 | Phase 3, 4 |
| 6 | Noun declension → dictionary nounbank sync | Phase 5 | Phase 4 |
| 7 | v2 lookup handler noun feature detection | Phase 2 | Phase 3, 4, 5, 6 |
| 8 | Search index rebuild (add pp field) | Phase 4 | — |

Critical path: 1 → 3 → 4 → 8 (Perfektum) and 1 → 5 → 6 (Noun declension). Phases 1-2 unblock everything. Phase 8 is the final gate.

## Anti-Patterns

### Anti-Pattern 1: Storing Perfektum Only in Dictionary Bank

**What people do:** Add `conjugations.perfektum` only to `vocabulary/dictionary/de/verbbank.json` because the v2 API is the "rich" API.

**Why it's wrong:** The v1 API reads `vocabulary/core/de/`. Leksihjelp uses v1 for inflection search. If Perfektum is only in the dictionary bank, Leksihjelp cannot index past participles — the primary inflection use case for Perfektum.

**Do this instead:** Update both banks. Core bank enables Leksihjelp client-side inflection. Dictionary bank enables v2 detail view. This mirrors the adjective declension and preteritum precedents.

### Anti-Pattern 2: Deriving Past Participles Algorithmically

**What people do:** Apply the `ge-` + stem + `-t` rule to all weak verbs and a pattern map to strong verbs.

**Why it's wrong:** German past participle exceptions are numerous and high-frequency. `sein` → `gewesen`, `gehen` → `gegangen`, `bringen` → `gebracht`, `denken` → `gedacht` (mixed verbs). Separable verbs insert `ge-` between prefix and stem (`anfangen` → `angefangen`). Verbs with inseparable prefixes have no `ge-` (`bekommen` → `bekommen`). The error rate from algorithmic derivation on a 148-verb list would be ~20-30 incorrect forms.

**Do this instead:** Look up each participle individually. The `verb-classification-de.json` already classifies all 148 verbs by type — use it as a guide for which verbs need most care (strong + mixed verbs), but verify every participle explicitly.

### Anti-Pattern 3: Replacing Existing Noun Case Structure Instead of Extending

**What people do:** Replace `cases.nominativ.bestemt`/`ubestemt` flat values with the new `singular`/`plural` nested structure, treating the old format as deprecated.

**Why it's wrong:** 223 noun entries already have `bestemt`/`ubestemt` data. The existing Leksihjelp curriculum exercises may read these fields. Removing them is a breaking change that could silently degrade functionality.

**Do this instead:** ADD `singular`/`plural` sub-objects alongside the existing flat values. The new structure is additive. Old consumers see no change; new consumers read the richer structure. Only after Leksihjelp explicitly migrates to the new structure should the flat fields be considered for removal.

### Anti-Pattern 4: Adding All Declined Noun Forms to the Search Index

**What people do:** Create separate search index entries for every declined form of every noun (`des Mannes`, `dem Mann`, `den Männern`, etc.) to support inflection search via the v2 search API.

**Why it's wrong:** 331 nouns × up to 16 forms = ~5,300 new entries, more than doubling the search index from 3,454 to ~8,700 entries. The search index is loaded into memory on every search request. This multiplies its footprint without architectural justification — Leksihjelp already handles noun inflection lookup client-side from the full v1 bank.

**Do this instead:** Keep the search index at one entry per word. Add `pp` for verb past participles only, since participles are commonly encountered in reading and often look completely different from the infinitive (making client-side lookup insufficient for first exposure). Noun declined forms are more predictable and are handled by the client-side inflection index.

### Anti-Pattern 5: Skipping Schema Validation After Data Entry

**What people do:** Add Perfektum or declension data directly to verbbank/nounbank without running schema validation, assuming the structure is correct.

**Why it's wrong:** Both banks have 148 and 331 entries respectively. Manual entry errors (missing `former` keys, wrong auxiliary enum value, misspelled case keys) are invisible without validation and will silently produce malformed API responses. The adjective bank validation script (`scripts/validate-adjectives.js`) provides the pattern.

**Do this instead:** Run `node scripts/validate-adjectives.js` (or equivalent scripts for verb/noun schemas) after each batch of data additions. The pattern is already established — add `validate-verbs.js` and `validate-nouns.js` following the exact same AJV2020 pattern as the existing adjective validator.

## Scaling Considerations

This API is static JSON served from Vercel's edge CDN with 86,400s cache. There is no database and no dynamic query load. Scale concerns are:

| Concern | Current | After v1.2 |
|---------|---------|------------|
| Verbbank JSON size | ~50KB core / ~150KB dict | ~60KB core / ~170KB dict (Perfektum adds ~10KB) |
| Nounbank JSON size | ~80KB core / ~400KB dict | ~150KB core / ~500KB dict (declension adds ~70KB) |
| Search index size | ~420KB | ~430KB (pp field adds ~5KB) |
| v1 response size | ~800KB combined | ~1MB combined |
| Vercel function limit | 50MB | Well within limit |

No scaling concerns for v1.2. File sizes remain small. CDN caching means repeated requests add no server load.

## Sources

All findings from direct codebase inspection (HIGH confidence):

- `vocabulary/core/de/verbbank.json` — 148 entries, presens + preteritum only; confirmed structure
- `vocabulary/dictionary/de/verbbank.json` — 679 entries, verbClass field, no preteritum_rare flag
- `vocabulary/core/de/nounbank.json` — 331 entries, 223 with nominativ cases only
- `vocabulary/dictionary/de/nounbank.json` — 1,641 entries, cases field confirmed
- `vocabulary/dictionary/de/search-index.json` — 3,454 entries, keys: id/w/t/f/c/cur/tr/g/vc/sep/b
- `vocabulary/dictionary/verb-classification-de.json` — perfektum column already on all 148 verbs
- `vocabulary/schema/verb.schema.json` — tenseConjugation has former + feature only; no auxiliary
- `vocabulary/schema/noun.schema.json` — caseEntry has flat bestemt/ubestemt; no singular/plural
- `vocabulary/grammar-features.json` — grammar_perfektum registered; grammar_noun_declension absent
- `api/vocab/v2/lookup/[language]/[wordId].js` — perfektum detection already implemented; cases passthrough present; noun declension feature detection absent
- `api/vocab/v1/core/[language].js` — passthrough architecture; no code change needed for new fields

---
*Architecture research for: Papertek Vocabulary API — German Perfektum & Noun Declension (v1.2)*
*Researched: 2026-02-22*
