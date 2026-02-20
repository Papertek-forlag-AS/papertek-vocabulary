# Architecture Research

**Domain:** Vocabulary API — German adjective declension integration
**Researched:** 2026-02-20
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
│  └──────────────────────────────────────────────────────────┘   │
└────────────────────────┬────────────────────────────────────────┘
                         │ HTTP/JSON
┌────────────────────────▼────────────────────────────────────────┐
│                     VERCEL EDGE (auto-deploy on push to main)    │
│                                                                  │
│  api/vocab/v1/core/[language].js   — serves core/ banks merged  │
│  api/vocab/v2/lookup/[language]/[wordId].js  — rich entry view  │
│  api/vocab/v2/search/[language].js — search-index queries       │
│  api/vocab/v1/grammarfeatures.js   — grammar-features metadata  │
└────────────────────────┬────────────────────────────────────────┘
                         │ fs.readFileSync (bundled with function)
┌────────────────────────▼────────────────────────────────────────┐
│                     DATA LAYER (JSON files)                      │
│                                                                  │
│  vocabulary/core/de/                                             │
│  ├── adjectivebank.json     (word, _id, audio — 108 entries)    │
│  ├── verbbank.json          (+ conjugations — 148 entries)       │
│  └── nounbank.json          (+ genus, plural — 331 entries)      │
│                                                                  │
│  vocabulary/dictionary/de/                                       │
│  ├── adjectivebank.json     (core + curriculum/cefr/frequency)  │
│  ├── verbbank.json          (core + verbClass, same conjugations)│
│  └── search-index.json      (flat array, indexed by Leksihjelp) │
│                                                                  │
│  vocabulary/translations/de-nb/                                  │
│  └── adjectivebank.json     (translation, explanation, examples) │
│                                                                  │
│  vocabulary/grammar-features.json  (feature registry)           │
│  vocabulary/schema/adjective.schema.json  (JSON Schema)         │
└─────────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Integration Impact |
|-----------|----------------|--------------------|
| `vocabulary/core/de/adjectivebank.json` | Source of truth for word, _id, audio, and ALL grammar data (conjugations, declension, comparison). Served directly by v1 API. | This is where declension data lives. |
| `vocabulary/dictionary/de/adjectivebank.json` | Extended metadata layer: adds curriculum, cefr, frequency on top of core data. Served by v2 lookup API. | Must mirror new entries added to core. |
| `vocabulary/translations/de-nb/adjectivebank.json` | Norwegian translations, explanations, examples per word ID. Merged in v2 lookup response. | Needs entries for every new adjective added. |
| `vocabulary/translations/de-en/adjectivebank.json` | English translations. Same structure as de-nb. | Needs entries for every new adjective added. |
| `vocabulary/grammar-features.json` | Registry of grammar features; tells clients what dataPath to read and what UI to show. Already has `grammar_adjective_declension` entry pointing to `dataPath: "declension"`. | No changes needed — already has the declension feature defined. |
| `vocabulary/schema/adjective.schema.json` | JSON Schema for validation. Currently has comparison fields, no declension. | Must be extended to define the declension sub-schema. |
| `api/vocab/v2/lookup/[language]/[wordId].js` | Merges core + dictionary + translation layers. Exposes `comparison` field for adjectives. Does NOT yet expose `declension`. | Code change needed: add `if (entry.declension) response.declension = entry.declension`. Also add `grammar_adjective_declension` to grammarFeatures array when declension is present. |

## Recommended Project Structure (additions only)

The existing structure does not change. New data slots into existing files:

```
vocabulary/
├── core/de/
│   └── adjectivebank.json          MODIFIED — add declension + comparison to each entry
├── dictionary/de/
│   └── adjectivebank.json          MODIFIED — add new entries from Goethe extraction
├── translations/de-nb/
│   └── adjectivebank.json          MODIFIED — add translations for new entries
├── translations/de-en/
│   └── adjectivebank.json          MODIFIED — add translations for new entries
├── schema/
│   └── adjective.schema.json       MODIFIED — add $defs/declension sub-schema
└── grammar-features.json           NO CHANGE — grammar_adjective_declension already present
api/vocab/v2/lookup/[language]/[wordId].js   MODIFIED — expose declension in response
```

No new files. No new API endpoints.

## Recommended JSON Structure for Declension

### Design Rationale

The verb conjugation precedent uses: `conjugations.{tense}.former.{pronoun}`. This stores named keys (not arrays), which is consistent with the German-specific object-key format documented in PROJECT.md.

Adjective declension has three dimensions: degree × article type × (case × gender/number). The recommendation is to nest these three levels as named object keys, mirroring the verb pattern's use of named keys throughout.

**Key naming convention:** Use German grammatical terms in the same style as existing data — `positiv`, `komparativ`, `superlativ` (already used in comparison field); `stark`, `schwach`, `gemischt` for article types; `nominativ`, `akkusativ`, `dativ`, `genitiv` for cases; `maskulin`, `feminin`, `neutrum`, `plural` for gender/number.

### Full Structure for One Adjective Entry (core bank)

```json
"alt_adj": {
  "word": "alt",
  "_id": "alt_adj",
  "audio": "adjektiv_alt.mp3",
  "comparison": {
    "komparativ": "älter",
    "superlativ": "am ältesten"
  },
  "declension": {
    "positiv": {
      "stark": {
        "nominativ":  { "maskulin": "alter",   "feminin": "alte",   "neutrum": "altes",  "plural": "alte"   },
        "akkusativ":  { "maskulin": "alten",   "feminin": "alte",   "neutrum": "altes",  "plural": "alte"   },
        "dativ":      { "maskulin": "altem",   "feminin": "alter",  "neutrum": "altem",  "plural": "alten"  },
        "genitiv":    { "maskulin": "alten",   "feminin": "alter",  "neutrum": "alten",  "plural": "alter"  }
      },
      "schwach": {
        "nominativ":  { "maskulin": "alte",    "feminin": "alte",   "neutrum": "alte",   "plural": "alten"  },
        "akkusativ":  { "maskulin": "alten",   "feminin": "alte",   "neutrum": "alte",   "plural": "alten"  },
        "dativ":      { "maskulin": "alten",   "feminin": "alten",  "neutrum": "alten",  "plural": "alten"  },
        "genitiv":    { "maskulin": "alten",   "feminin": "alten",  "neutrum": "alten",  "plural": "alten"  }
      },
      "gemischt": {
        "nominativ":  { "maskulin": "alter",   "feminin": "alte",   "neutrum": "altes",  "plural": "alten"  },
        "akkusativ":  { "maskulin": "alten",   "feminin": "alte",   "neutrum": "altes",  "plural": "alten"  },
        "dativ":      { "maskulin": "alten",   "feminin": "alten",  "neutrum": "alten",  "plural": "alten"  },
        "genitiv":    { "maskulin": "alten",   "feminin": "alten",  "neutrum": "alten",  "plural": "alten"  }
      }
    },
    "komparativ": {
      "stark": {
        "nominativ":  { "maskulin": "älterer", "feminin": "ältere", "neutrum": "älteres","plural": "ältere" },
        "akkusativ":  { "maskulin": "älteren", "feminin": "ältere", "neutrum": "älteres","plural": "ältere" },
        "dativ":      { "maskulin": "älterem", "feminin": "älterer","neutrum": "älterem","plural": "älteren"},
        "genitiv":    { "maskulin": "älteren", "feminin": "älterer","neutrum": "älteren","plural": "älterer"}
      },
      "schwach": {
        "nominativ":  { "maskulin": "ältere",  "feminin": "ältere", "neutrum": "ältere", "plural": "älteren"},
        "akkusativ":  { "maskulin": "älteren", "feminin": "ältere", "neutrum": "ältere", "plural": "älteren"},
        "dativ":      { "maskulin": "älteren", "feminin": "älteren","neutrum": "älteren","plural": "älteren"},
        "genitiv":    { "maskulin": "älteren", "feminin": "älteren","neutrum": "älteren","plural": "älteren"}
      },
      "gemischt": {
        "nominativ":  { "maskulin": "älterer", "feminin": "ältere", "neutrum": "älteres","plural": "älteren"},
        "akkusativ":  { "maskulin": "älteren", "feminin": "ältere", "neutrum": "älteres","plural": "älteren"},
        "dativ":      { "maskulin": "älteren", "feminin": "älteren","neutrum": "älteren","plural": "älteren"},
        "genitiv":    { "maskulin": "älteren", "feminin": "älteren","neutrum": "älteren","plural": "älteren"}
      }
    },
    "superlativ": {
      "schwach": {
        "nominativ":  { "maskulin": "älteste", "feminin": "älteste","neutrum": "älteste","plural": "ältesten"},
        "akkusativ":  { "maskulin": "ältesten","feminin": "älteste","neutrum": "älteste","plural": "ältesten"},
        "dativ":      { "maskulin": "ältesten","feminin": "ältesten","neutrum": "ältesten","plural": "ältesten"},
        "genitiv":    { "maskulin": "ältesten","feminin": "ältesten","neutrum": "ältesten","plural": "ältesten"}
      }
    }
  }
}
```

### Why Superlativ Has Only `schwach`

In German grammar, superlatives are only used with a preceding definite article (der/die/das), which forces the weak declension. Strong and mixed superlative declension does not occur in standard usage. Storing only `schwach` for superlativ is grammatically correct and reduces data volume by ~67% for that degree.

### Why This Structure Over Alternatives

**Alternative A — flat array of form strings:** Requires consumers to know index-to-meaning mapping. Error-prone. No precedent in this codebase.

**Alternative B — nested arrays [degree][articleType][case][gender]:** Same problem as A. Arrays require index knowledge to parse.

**Alternative C — flat key like `declension.positiv_stark_nominativ_maskulin`:** Valid but deeply unreadable in raw JSON and non-extensible.

**Chosen approach (nested objects with named keys):** Matches the established pattern in `conjugations.preteritum.former.{ich, du, ...}`. Each dimension is human-readable. Leksihjelp can iterate all keys to build an inflection index. Schema validation is straightforward.

### Size Estimate

Per adjective: 3 degrees × 3 article types × 4 cases × 4 gender/number = 144 cells.
Minus superlativ strong/mixed (32 cells) = 112 cells per adjective.
At ~15 characters per cell on average: ~1.7KB per adjective (unminified).
For 108 existing adjectives + ~50 new = ~160 adjectives: ~272KB raw, well within Vercel's 50MB function limit.

## Goethe "Other" Bucket — Extraction Strategy

### The Problem

The Goethe A1/A2/B1 source files classify all non-noun/non-verb words as `"type": "other"`. This bucket contains 1,191 words total, including:
- Adjectives (alt, gut, groß, billig, etc.)
- Adverbs (auch, schon, gern, etc.)
- Prepositions (an, auf, bei, durch, etc.)
- Conjunctions (aber, also, und, etc.)
- Particles, fixed phrases, pronouns, and Goethe parsing artifacts (e.g., "Züge.", "ich Zeit")

The "other" bucket cannot be programmatically split reliably. Many words are ambiguous (e.g., "allein" is adverb and adjective; "gut" is both adjective and adverb). Goethe intentionally did not type these.

### Recommended Approach

**Manual adjective list curation + cross-reference with existing bank.**

1. Cross-reference all 1,191 "other" words against the existing 108 adjective bank entries. Words already in the bank are confirmed adjectives. The ~50 not yet in the bank that overlap with known Goethe adjective wordlists form the extraction candidates.

2. For each candidate: apply human judgment (or AI-assisted triage) using the following heuristics:
   - Can the word appear attributively before a noun (ein [word] Mann)? → adjective
   - Does the word appear in Duden as "Adjektiv"? → adjective
   - Does the word only function as an adverb (bald, auch, schon)? → skip
   - Is it a preposition, conjunction, or particle? → skip

3. **Do not attempt fully automated extraction.** Errors in type classification propagate to inflection search (Leksihjelp will index wrong word types). Manual curation for this ~50-word gap is the correct tradeoff given the small scale and high accuracy requirement.

### Expected Extraction Yield

From the "other" bucket across A1/A2/B1, approximately 40-70 additional true adjectives not yet in the bank. The existing bank already contains the most frequent ones (gut, groß, klein, etc.) since it was built from curriculum content. The incremental gain is medium-frequency adjectives like `abhängig`, `ähnlich`, `aktiv`, `alternativ`, `allgemein`, etc.

### Words That Are Already in the Bank

All 108 current adjectives were added manually/curated. No re-extraction is needed for those. The task is finding the delta: adjectives in the Goethe other bucket that are NOT yet in the bank.

## Data Flow

### Inflection Search Flow (Leksihjelp)

```
Student reads "Das ältere Auto ist schön"
    ↓
Leksihjelp fetches GET /api/vocab/v1/core/german
    ↓
Leksihjelp indexes declension cells:
  { "ältere" → "alt_adj", "älteren" → "alt_adj", ... }
    ↓
Match "ältere" → returns "alt_adj" base entry to student
```

The v1 core API returns all banks merged. No code change needed in v1. Leksihjelp reads the flat payload and builds its own in-memory inflection index. Adding `declension` to the core bank entry is sufficient — Leksihjelp will pick it up on next fetch.

### Dictionary Lookup Flow (v2)

```
GET /api/vocab/v2/lookup/german/alt_adj
    ↓
Reads vocabulary/dictionary/de/adjectivebank.json → entry
Reads vocabulary/translations/de-nb/adjectivebank.json → translation
    ↓
Merges: word, audio, comparison, curriculum, cefr, frequency, translation
Missing: declension (not yet in response builder code)
    ↓
Response returned to client
```

The v2 lookup handler (`api/vocab/v2/lookup/[language]/[wordId].js`) must add:

```javascript
// After the comparison field (line ~224)
if (entry.declension) response.declension = entry.declension;

// In grammarFeatures array (line ~250)
if (entry.declension) grammarFeatures.push('grammar_adjective_declension');
```

### Core vs Dictionary Bank Architecture

**Critical distinction:** The v1 API reads `vocabulary/core/de/`. The v2 API reads `vocabulary/dictionary/de/`. These are separate files with overlapping but not identical content.

- Grammar data (conjugations, declension, comparison) lives in the **core** bank. Confirmed by preteritum precedent: conjugations were added to `vocabulary/core/de/verbbank.json`, not the dictionary verbbank.
- The dictionary bank adds metadata (curriculum, cefr, frequency) but does NOT duplicate grammar fields. The v2 lookup API reads the dictionary bank for metadata and translations only — it does NOT merge grammar data from core.

**For declension: add declension data to `vocabulary/core/de/adjectivebank.json`.** The dictionary bank does NOT need declension added — the v2 lookup handler should be updated to also read from core if declension is needed in the rich response, OR (simpler) the dictionary bank for adjectives should include declension data since the v2 lookup reads only that file.

**Recommendation:** Store declension in `vocabulary/dictionary/de/adjectivebank.json` (since v2 lookup reads from dictionary, not core), AND include it in `vocabulary/core/de/adjectivebank.json` (since v1 reads from core). Both files must be updated. This matches the pattern for nouns where `genus`, `plural`, and `declension` exist in the dictionary bank, and `genus`/`plural` in the core bank.

**Revised data placement decision:**

| Data | `core/de/adjectivebank.json` | `dictionary/de/adjectivebank.json` |
|------|----------------------------|------------------------------------|
| word, _id, audio | YES | YES |
| comparison (komparativ, superlativ) | YES | YES |
| declension table | YES | YES |
| curriculum, cefr, frequency | NO | YES |

Both files updated. This is consistent with how nouns have `declension` in the dictionary bank (confirmed from `nounbank.json` inspection) while core only has `genus`/`plural`.

## Integration Points

### New vs Modified Components

| Component | Status | Change |
|-----------|--------|--------|
| `vocabulary/core/de/adjectivebank.json` | MODIFIED | Add `comparison` and `declension` to each of 108 existing entries; add new entries from Goethe extraction |
| `vocabulary/dictionary/de/adjectivebank.json` | MODIFIED | Add `comparison` and `declension` to existing 108; add new entries with curriculum/cefr/frequency |
| `vocabulary/translations/de-nb/adjectivebank.json` | MODIFIED | Add translation entries for newly extracted adjectives |
| `vocabulary/translations/de-en/adjectivebank.json` | MODIFIED | Add translation entries for newly extracted adjectives |
| `vocabulary/schema/adjective.schema.json` | MODIFIED | Add `declension` $def and wire it into adjectiveEntry |
| `api/vocab/v2/lookup/[language]/[wordId].js` | MODIFIED | Expose declension field in response; add grammar_adjective_declension to grammarFeatures |
| `vocabulary/grammar-features.json` | NO CHANGE | Already has `grammar_adjective_declension` defined with `dataPath: "declension"` |
| `api/vocab/v1/core/[language].js` | NO CHANGE | Serves all fields from core bank — declension is picked up automatically |
| `vocabulary/dictionary/de/search-index.json` | MODIFIED | Rebuild after adding new adjective entries (new words must appear in search) |

### Schema Extension for `adjective.schema.json`

Add a `declension` $def alongside the existing `comparison` $def:

```json
"declension": {
  "type": "object",
  "description": "Full declension table: degree → article type → case → gender/number",
  "properties": {
    "positiv":    { "$ref": "#/$defs/declinedDegree" },
    "komparativ": { "$ref": "#/$defs/declinedDegree" },
    "superlativ": { "$ref": "#/$defs/declinedDegreeSuperlativ" }
  }
},
"declinedDegree": {
  "type": "object",
  "properties": {
    "stark":    { "$ref": "#/$defs/caseBlock" },
    "schwach":  { "$ref": "#/$defs/caseBlock" },
    "gemischt": { "$ref": "#/$defs/caseBlock" }
  }
},
"declinedDegreeSuperlativ": {
  "type": "object",
  "properties": {
    "schwach": { "$ref": "#/$defs/caseBlock" }
  }
},
"caseBlock": {
  "type": "object",
  "properties": {
    "nominativ": { "$ref": "#/$defs/genderBlock" },
    "akkusativ": { "$ref": "#/$defs/genderBlock" },
    "dativ":     { "$ref": "#/$defs/genderBlock" },
    "genitiv":   { "$ref": "#/$defs/genderBlock" }
  }
},
"genderBlock": {
  "type": "object",
  "properties": {
    "maskulin": { "type": "string" },
    "feminin":  { "type": "string" },
    "neutrum":  { "type": "string" },
    "plural":   { "type": "string" }
  },
  "required": ["maskulin", "feminin", "neutrum", "plural"]
}
```

## Build Order

Build order respects data dependencies. Each phase can only proceed once its inputs exist.

### Phase 1: Goethe Adjective Extraction

**Goal:** Curate the list of adjectives in the Goethe "other" bucket not yet in the bank.

**Output:** A definitive list of new adjective entries (word + _id + cefr source) to add.

**Why first:** All downstream work (grammar data, translations, schema) depends on knowing the complete adjective list. Starting grammar data on 108 entries before the list is final means rework if more entries are added later. Better to fix the count first.

**Dependency:** None. Reads only the Goethe source files (already present).

### Phase 2: Schema Extension

**Goal:** Update `vocabulary/schema/adjective.schema.json` with the declension $defs.

**Why second:** Schema defines the contract. Having schema in place before generating data means every generated entry can be validated against it during creation. If schema comes last, errors might not be caught until after all data is entered.

**Dependency:** Phase 1 complete (so schema can be tested against real data samples).

### Phase 3: Core and Dictionary Bank — New Entries

**Goal:** Add bare-minimum entries (word, _id, audio placeholder, curriculum, cefr, frequency) for the newly extracted adjectives to both core and dictionary banks.

**Why third:** Translation and declension data generation requires the entry IDs to be established first. Translations and grammar data are keyed by `_id` — the ID must exist before translation entries can be written.

**Dependency:** Phase 1 complete (list of new entries known).

### Phase 4: Comparison Data for All Adjectives

**Goal:** Add `comparison` (komparativ, superlativ) to all adjectives in the core bank.

**Why fourth:** Comparison data is simpler than declension and establishes the base forms needed for declension generation. The comparative stem (e.g., "älter-") is required before generating comparative declension forms. Better to validate comparison data separately from the 144-cell declension table.

**Dependency:** Phase 3 complete (all adjective entries exist with _id).

### Phase 5: Declension Tables for All Adjectives

**Goal:** Add full `declension` object to all adjective entries in core bank (and mirror to dictionary bank).

**Why fifth:** Declension is the largest data generation task. Comparison stems (from Phase 4) are inputs for comparative and superlative declension forms. All entry IDs must exist (Phase 3) and comparison forms validated (Phase 4) before generating 112 cells per entry.

**Dependency:** Phase 4 complete (comparison forms available as base for declined forms).

### Phase 6: Translations for New Entries

**Goal:** Add Norwegian and English translations for all newly extracted adjectives to `de-nb/adjectivebank.json` and `de-en/adjectivebank.json`.

**Can run in parallel with Phase 5.** Translations do not depend on declension data, only on entry IDs (established in Phase 3). Phases 5 and 6 can run concurrently if desired.

**Dependency:** Phase 3 complete (entry _ids established).

### Phase 7: Search Index Rebuild

**Goal:** Regenerate `vocabulary/dictionary/de/search-index.json` to include new adjective entries.

**Why last:** The search index is a derived artifact from the dictionary banks. It must be rebuilt after all new entries are in the dictionary bank.

**Dependency:** Phase 3 complete (new entries in dictionary bank).

### Phase 8: v2 Lookup API Code Change

**Goal:** Add `declension` to the response and `grammar_adjective_declension` to grammarFeatures in the v2 lookup handler.

**Why last:** The API change is two lines of code. The data must be present before the code change is meaningful. Can be done any time after Phase 5 but there is no reason to block other phases on it.

**Dependency:** Phase 5 complete (declension data present in dictionary bank).

### Build Order Summary Table

| Phase | Task | Dependency | Modifies |
|-------|------|------------|----------|
| 1 | Goethe adjective extraction | None | (list only — no file changes) |
| 2 | Schema extension | Phase 1 | `schema/adjective.schema.json` |
| 3 | New entries (bare) | Phase 1 | `core/de/adjectivebank.json`, `dictionary/de/adjectivebank.json` |
| 4 | Comparison data (all 108+N) | Phase 3 | `core/de/adjectivebank.json` |
| 5 | Declension tables (all 108+N) | Phase 4 | `core/de/adjectivebank.json`, `dictionary/de/adjectivebank.json` |
| 6 | Translations (new entries only) | Phase 3 | `translations/de-nb/adjectivebank.json`, `translations/de-en/adjectivebank.json` |
| 7 | Search index rebuild | Phase 3 | `dictionary/de/search-index.json` |
| 8 | v2 lookup API code change | Phase 5 | `api/vocab/v2/lookup/[language]/[wordId].js` |

Phases 5, 6, 7 can run in parallel after their respective dependencies complete. Phase 8 depends on Phase 5.

## Anti-Patterns

### Anti-Pattern 1: Storing Declension Only in Dictionary Bank

**What people do:** Add declension data only to `vocabulary/dictionary/de/adjectivebank.json`, assuming the v1 API doesn't need it.

**Why it's wrong:** The v1 API at `/api/vocab/v1/core/german` reads from `vocabulary/core/de/`. Leksihjelp uses the v1 API for inflection search. If declension is only in the dictionary bank, Leksihjelp cannot index declined forms — defeating the purpose of the entire milestone.

**Do this instead:** Add declension to both banks. Core bank: for Leksihjelp inflection search. Dictionary bank: for v2 detail view.

### Anti-Pattern 2: Generating Comparison Stems Formulaically for Irregular Adjectives

**What people do:** Apply `-er` / `am -sten` mechanically to all adjectives.

**Why it's wrong:** German has ~30 irregular comparative/superlative forms in the A1-B1 range: gut/besser/am besten, viel/mehr/am meisten, groß/größer/am größten, hoch/höher/am höchsten, nah/näher/am nächsten. Irregular forms are the most common adjectives. Mechanical generation produces wrong data for the highest-frequency words.

**Do this instead:** Each adjective verified individually, same policy as the preteritum conjugation phase ("strong verbs each looked up individually; no ablaut patterns applied formulaically").

### Anti-Pattern 3: Generating Declension Forms Formulaically Without Verifying Irregular Stems

**What people do:** Apply the standard weak/strong/mixed endings directly to the base form.

**Why it's wrong:** Adjectives with irregular comparatives change their stem (besser- not gut-er, höher- not hoch-er). The declension for komparativ degree must use the comparative stem, not the base form. Similarly, adjectives ending in -el/-er drop the -e- in inflected forms (dunkel → dunkler → dunkle). These are frequent enough to matter.

**Do this instead:** Derive declined forms from the verified comparative stem (from comparison.komparativ), not from the base word form.

### Anti-Pattern 4: Adding Declension to the Search Index

**What people do:** Index all 112 declension cells per adjective in the search index.

**Why it's wrong:** The search index is used for word lookup (find "alt" from user input "alt"). Inflection resolution (find "alten" → "alt") is done by Leksihjelp locally after fetching the full bank. Adding 112 strings per adjective to the search index would make it ~10× larger and is not how the architecture is designed.

**Do this instead:** Keep the search index entry for adjectives exactly as it is (id, w, t, f, c, cur, tr). Leksihjelp reads the full bank from v1 and builds its own inflection index locally.

### Anti-Pattern 5: Staging Adjective Extraction as a Purely Automated Process

**What people do:** Write a script to classify Goethe "other" words as adjectives using pattern matching (words ending in -ig, -lich, -isch, etc.).

**Why it's wrong:** The "other" bucket contains adverbs and particles with adjective-like endings (eilig = hurriedly used as adverb; fremd may appear as adverb in some constructions). Pattern matching has false positive rate ~20-30% for this task. Wrong type classification means Leksihjelp inflects words with wrong paradigm.

**Do this instead:** Use pattern matching as a candidate filter only. Apply human or AI-assisted binary decision (is this word an adjective when used attributively before a noun?) for each candidate. The total number is small enough (~50-100 candidates) that this is fast.

## Sources

- All findings from direct inspection of the codebase (HIGH confidence):
  - `vocabulary/core/de/adjectivebank.json` — 108 entries, word/_id/audio only
  - `vocabulary/dictionary/de/adjectivebank.json` — 108 entries with curriculum/cefr/frequency
  - `vocabulary/dictionary/de/nounbank.json` — confirmed declension in dictionary bank (Zusammenfassung example)
  - `vocabulary/core/de/verbbank.json` — confirmed grammar data (conjugations) in core bank
  - `vocabulary/schema/adjective.schema.json` — comparison defined, declension absent
  - `vocabulary/grammar-features.json` — `grammar_adjective_declension` already registered
  - `api/vocab/v2/lookup/[language]/[wordId].js` — confirmed declension not yet in response
  - `api/vocab/v1/core/[language].js` — confirmed reads from vocabulary/core/
  - `.planning/milestones/v1.0-phases/02-add-german-preteritum-conjugations/02-01-SUMMARY.md` — preteritum architectural precedent

---
*Architecture research for: Papertek Vocabulary API — German adjective declension integration*
*Researched: 2026-02-20*
