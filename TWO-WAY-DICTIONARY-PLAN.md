# Two-Way Dictionary Plan

## The Problem

Today, papertek-vocabulary is a **one-way vocabulary API**. It answers one question well:

> "What does this German word mean in Norwegian?"

But it cannot answer the reverse:

> "What is the German word for 'hage'?"

And it cannot tell you anything about the Norwegian word itself — no grammar, no plural, no gender. The Norwegian side is just a flat string like `"å hente"` or `"hage"`.

A true **two-way dictionary** means both languages are first-class citizens with rich linguistic data, and you can traverse in either direction. It also enables **NB-NB**, **NB-NN**, and **monolingual dictionaries** — not just cross-language lookup.

---

## Decisions Made

| Question | Decision |
|----------|----------|
| Grammar depth | **Full declension/conjugation tables** with grammar features, same depth as German — because this will also serve as a NB-NB and NB-NN dictionary |
| Which languages first | **Norwegian Bokmål (NB) first**, then English (EN) and Nynorsk (NN) later |
| Word ID format | **Same format as German**: `hage_noun`, `hente_verb` (no language prefix) |
| Duplicate translations | **One NB entry, multiple links** — e.g. single `omraade_noun` linked from `bereich_noun`, `gebiet_noun`, `gegend_noun` |
| Slash alternatives | **Split into separate entries** — `"middag / kveldsmat"` becomes two entries: `middag_noun` and `kveldsmat_noun` |
| Target languages | **NB, EN, NN** — all three will be first-class lexicon languages (NB first, EN and NN in later phases) |

---

## Design Principles

1. **Zero disruption** — v1 and v2 APIs remain untouched. Existing apps (webapps, Leksihjelp) keep working without changes until they're ready to migrate.
2. **Additive only** — All new work lives in new directories (`vocabulary/lexicon/`, `api/vocab/v3/`). Nothing in `banks/`, `translations/`, `core/`, `v1/`, `v2/` is modified or removed.
3. **Sunset later** — After all consuming apps have migrated to v3, we delete the old directories and endpoints.
4. **Full linguistic depth** — Every lexicon language gets grammar features, declension tables, and conjugation data comparable to what German currently has.

---

## Architecture: The Lexicon Model

Instead of "source language word + flat translation string", we introduce a **lexicon** where every word in every language is a first-class entry, and **links** connect them.

### Directory Structure

```
vocabulary/
├── banks/              # UNCHANGED — existing DE/ES/FR word banks
├── core/               # UNCHANGED — legacy core vocabulary
├── translations/       # UNCHANGED — existing one-way translation packs
├── curricula/          # UNCHANGED
├── schema/             # Extended with new schemas
│   ├── lexicon/                              (NEW)
│   │   ├── lexicon-entry.schema.json         Base entry schema (all languages)
│   │   ├── lexicon-noun.schema.json          Noun-specific fields
│   │   ├── lexicon-verb.schema.json          Verb-specific fields
│   │   ├── lexicon-adjective.schema.json     Adjective-specific fields
│   │   └── lexicon-link.schema.json          Link/relationship schema
├── lexicon/                                  (NEW — the two-way dictionary)
│   ├── nb/                                   Norwegian Bokmål
│   │   ├── nounbank.json
│   │   ├── verbbank.json
│   │   ├── adjectivebank.json
│   │   ├── generalbank.json
│   │   ├── search-index.json
│   │   └── manifest.json
│   ├── en/                                   English (later phase)
│   ├── nn/                                   Nynorsk (later phase)
│   ├── de/                                   German (generated from banks/)
│   ├── es/                                   Spanish (generated from banks/)
│   ├── links/                                Bidirectional relationships
│   │   ├── de-nb/                            Per-bank link files
│   │   │   ├── nounbank.json
│   │   │   ├── verbbank.json
│   │   │   └── ...
│   │   ├── nb-de/                            Auto-generated reverse
│   │   │   └── ...
│   │   ├── es-nb/
│   │   └── nb-es/
│   └── grammar-features.json                 Grammar features for all lexicon languages
api/vocab/
├── v1/                 # UNCHANGED
├── v2/                 # UNCHANGED
└── v3/                 # NEW — two-way dictionary endpoints
    ├── lookup/[language]/[wordId].js
    ├── search/[language].js
    ├── links/[pair]/[wordId].js
    ├── translate/[from]/[to].js
    └── manifest.js
```

### Norwegian Noun — Full Entry Example

```json
{
  "hage_noun": {
    "word": "hage",
    "type": "noun",
    "genus": "m",
    "plural": "hager",
    "forms": {
      "ubestemt": {
        "entall": "hage",
        "flertall": "hager"
      },
      "bestemt": {
        "entall": "hagen",
        "flertall": "hagene"
      }
    },
    "cefr": "A1",
    "frequency": 12500
  }
}
```

Norwegian nouns use a simpler system than German — no case declension, but **4 forms** (ubestemt/bestemt x entall/flertall) which is the core of Norwegian noun grammar.

### Norwegian Verb — Full Entry Example

```json
{
  "hente_verb": {
    "word": "hente",
    "type": "verb",
    "conjugations": {
      "presens": {
        "former": {
          "infinitiv": "å hente",
          "presens": "henter",
          "preteritum": "hentet",
          "perfektum_partisipp": "hentet",
          "imperativ": "hent",
          "presens_partisipp": "hentende"
        },
        "auxiliary": "har",
        "feature": "grammar_nb_presens"
      }
    },
    "verbClass": "svak",
    "cefr": "A1"
  }
}
```

Norwegian verbs are simpler than German — no person conjugation (same form for all persons), but they have **tense forms** (infinitive, present, past, past participle, imperative, present participle) and verb classes (svak/sterk/uregelmessig).

### Norwegian Adjective — Full Entry Example

```json
{
  "stor_adj": {
    "word": "stor",
    "type": "adj",
    "comparison": {
      "positiv": "stor",
      "komparativ": "større",
      "superlativ": "størst"
    },
    "declension": {
      "positiv": {
        "maskulin": "stor",
        "feminin": "stor",
        "noytrum": "stort",
        "flertall": "store",
        "bestemt": "store"
      },
      "komparativ": {
        "alle": "større"
      },
      "superlativ": {
        "ubestemt": "størst",
        "bestemt": "største"
      }
    },
    "cefr": "A1"
  }
}
```

Norwegian adjectives inflect by gender (m/f/n), number, and definiteness — plus comparison forms.

### Link Structure

`lexicon/links/de-nb/nounbank.json`:

```json
{
  "_metadata": {
    "from": "de",
    "to": "nb",
    "bank": "nounbank",
    "generatedAt": "2026-03-13T00:00:00Z",
    "totalLinks": 1641
  },
  "garten_noun": {
    "primary": "hage_noun",
    "alternatives": [],
    "examples": [
      {
        "source": "Wir sitzen im Garten.",
        "target": "Vi sitter i hagen."
      }
    ],
    "explanation": "Fysisk hage, hageområde"
  },
  "abend_noun": {
    "primary": "kveld_noun",
    "alternatives": [],
    "examples": [
      {
        "source": "Guten Abend!",
        "target": "God kveld!"
      }
    ]
  }
}
```

The **reverse link** `lexicon/links/nb-de/nounbank.json` is auto-generated, inverting the mappings so `kveld_noun` maps back to `abend_noun`.

### German Lexicon Entries (Generated)

For German, lexicon entries are **generated from existing banks/** — never manually maintained:

```
banks/de/nounbank.json  →  (build script)  →  lexicon/de/nounbank.json
```

This means `banks/` stays the source of truth during the transition. After sunset, `lexicon/de/` becomes the source of truth.

---

## Norwegian Grammar Features

New `nb` section in `vocabulary/lexicon/grammar-features.json`:

```json
{
  "nb": {
    "language": "Norwegian",
    "languageNative": "Norsk bokmål",
    "features": [
      {
        "id": "grammar_nb_genus",
        "name": "Kjønn",
        "nameEn": "Gender",
        "description": "Substantivets grammatiske kjønn (maskulin, feminin, nøytrum)",
        "descriptionEn": "Grammatical gender of nouns (masculine, feminine, neuter)",
        "category": "nouns",
        "appliesTo": ["noun"],
        "dataPath": "genus"
      },
      {
        "id": "grammar_nb_bestemt_form",
        "name": "Bestemt form",
        "nameEn": "Definite Form",
        "description": "Bestemt form entall og flertall (hagen, hagene)",
        "descriptionEn": "Definite singular and plural forms",
        "category": "nouns",
        "appliesTo": ["noun"],
        "dataPath": "forms.bestemt"
      },
      {
        "id": "grammar_nb_flertall",
        "name": "Flertall",
        "nameEn": "Plural",
        "description": "Flertallsformer av substantiv",
        "descriptionEn": "Plural forms of nouns",
        "category": "nouns",
        "appliesTo": ["noun"],
        "dataPath": "forms.ubestemt.flertall"
      },
      {
        "id": "grammar_nb_noun_forms",
        "name": "Alle bøyningsformer",
        "nameEn": "All Declension Forms",
        "description": "Alle fire former: ubestemt/bestemt x entall/flertall",
        "descriptionEn": "All four forms: indefinite/definite x singular/plural",
        "category": "nouns",
        "appliesTo": ["noun"],
        "dataPath": "forms"
      },
      {
        "id": "grammar_nb_presens",
        "name": "Presens",
        "nameEn": "Present Tense",
        "description": "Bøyning av verb i presens",
        "descriptionEn": "Present tense verb forms",
        "category": "verbs",
        "appliesTo": ["verb"],
        "dataPath": "conjugations.presens"
      },
      {
        "id": "grammar_nb_preteritum",
        "name": "Preteritum",
        "nameEn": "Past Tense",
        "description": "Bøyning av verb i preteritum",
        "descriptionEn": "Past tense verb forms",
        "category": "verbs",
        "appliesTo": ["verb"],
        "dataPath": "conjugations.presens.former.preteritum"
      },
      {
        "id": "grammar_nb_perfektum",
        "name": "Perfektum",
        "nameEn": "Present Perfect",
        "description": "Perfektum partisipp (har/er + partisipp)",
        "descriptionEn": "Perfect participle form",
        "category": "verbs",
        "appliesTo": ["verb"],
        "dataPath": "conjugations.presens.former.perfektum_partisipp"
      },
      {
        "id": "grammar_nb_imperativ",
        "name": "Imperativ",
        "nameEn": "Imperative",
        "description": "Bydeform (hent!, skriv!)",
        "descriptionEn": "Imperative/command form",
        "category": "verbs",
        "appliesTo": ["verb"],
        "dataPath": "conjugations.presens.former.imperativ"
      },
      {
        "id": "grammar_nb_verb_class",
        "name": "Verbklasse",
        "nameEn": "Verb Class",
        "description": "Svak, sterk eller uregelmessig",
        "descriptionEn": "Weak, strong, or irregular",
        "category": "verbs",
        "appliesTo": ["verb"],
        "dataPath": "verbClass"
      },
      {
        "id": "grammar_nb_komparativ",
        "name": "Komparativ",
        "nameEn": "Comparative",
        "description": "Gradbøyning komparativ (større, bedre)",
        "descriptionEn": "Comparative adjective forms",
        "category": "adjectives",
        "appliesTo": ["adj"],
        "dataPath": "comparison.komparativ"
      },
      {
        "id": "grammar_nb_superlativ",
        "name": "Superlativ",
        "nameEn": "Superlative",
        "description": "Gradbøyning superlativ (størst, best)",
        "descriptionEn": "Superlative adjective forms",
        "category": "adjectives",
        "appliesTo": ["adj"],
        "dataPath": "comparison.superlativ"
      },
      {
        "id": "grammar_nb_adj_declension",
        "name": "Adjektivbøyning",
        "nameEn": "Adjective Declension",
        "description": "Bøyning etter kjønn, tall og bestemthet",
        "descriptionEn": "Inflection by gender, number, and definiteness",
        "category": "adjectives",
        "appliesTo": ["adj"],
        "dataPath": "declension"
      }
    ],
    "categories": [
      { "id": "verbs", "name": "Verb", "nameEn": "Verbs" },
      { "id": "nouns", "name": "Substantiv", "nameEn": "Nouns" },
      { "id": "adjectives", "name": "Adjektiv", "nameEn": "Adjectives" }
    ]
  }
}
```

---

## Phased Implementation

### Phase 1: Schemas & NB Lexicon Foundation (current)

**Goal:** Define the lexicon data model and generate initial Norwegian word entries from existing translation data.

**Step 1.1 — Lexicon Schemas**
Create JSON Schema files for validation:
- `vocabulary/schema/lexicon/lexicon-entry.schema.json` — base entry (word, type, cefr, frequency)
- `vocabulary/schema/lexicon/lexicon-noun.schema.json` — NB noun: genus, forms (ubestemt/bestemt x entall/flertall)
- `vocabulary/schema/lexicon/lexicon-verb.schema.json` — NB verb: conjugation forms, verbClass, auxiliary
- `vocabulary/schema/lexicon/lexicon-adjective.schema.json` — NB adj: comparison, declension by gender/number/definiteness
- `vocabulary/schema/lexicon/lexicon-link.schema.json` — link: primary, alternatives, examples, explanation

**Step 1.2 — Norwegian Lexicon Generator Script**
`scripts/generate-nb-lexicon.js`:
1. Read all `translations/de-nb/*.json` and `translations/es-nb/*.json`
2. Extract unique Norwegian words (deduplicate across sources)
3. Split slash-separated translations (`"middag / kveldsmat"` → two entries)
4. Infer word type from source word type (German noun → Norwegian noun)
5. Extract existing definite forms from translation data (284 nouns already have `definite` field)
6. Generate word IDs using `word_type` convention (normalize: lowercase, strip `å `, replace special chars)
7. Output `vocabulary/lexicon/nb/nounbank.json`, `verbbank.json`, `adjectivebank.json`, `generalbank.json`
8. Generate `vocabulary/lexicon/nb/manifest.json` with counts

**Step 1.3 — Grammar Features**
Create `vocabulary/lexicon/grammar-features.json` with the `nb` grammar features section (see above).

**Step 1.4 — Validation Script**
`scripts/validate-lexicon.js`:
- Validate all lexicon entries against schemas
- Check for ID uniqueness
- Check for orphaned entries (words with no links)

**Data scope for Phase 1:**
- ~2,800 unique Norwegian words extracted from de-nb (3,454 entries minus duplicates)
- ~800 additional from es-nb (1,017 entries minus overlap with de-nb)
- Most will start as **skeleton entries** (word + type only) — grammar data is populated in enrichment phases
- ~284 nouns already have definite form data from existing translations

### Phase 2: Link Structure

**Goal:** Create bidirectional links between German/Spanish and Norwegian lexicon entries.

**Step 2.1 — Forward Links**
`scripts/generate-links.js`:
1. Read `translations/de-nb/*.json`
2. For each translation entry, create a link from German word ID → Norwegian word ID
3. Carry over `examples`, `explanation`, `synonyms` from translation data
4. Handle slash-alternatives: `"middag / kveldsmat"` → primary: `middag_noun`, alternative: `kveldsmat_noun`
5. Output `vocabulary/lexicon/links/de-nb/*.json` (one file per bank)
6. Repeat for `es-nb`

**Step 2.2 — Reverse Links**
`scripts/generate-reverse-links.js`:
1. Read `lexicon/links/de-nb/*.json`
2. Invert: for each German → Norwegian link, create Norwegian → German entry
3. Handle many-to-one: if 3 German words link to `omraade_noun`, the reverse has `omraade_noun` → 3 German alternatives
4. Output `vocabulary/lexicon/links/nb-de/*.json`
5. Repeat for `nb-es`

### Phase 3: Norwegian Grammar Enrichment

**Goal:** Populate the skeleton NB entries with full grammar data.

This is the **content-heavy phase** — Norwegian grammar can't be auto-generated from German translations.

**Strategy:**
1. Build a grammar enrichment script that reads an external source or manual CSV
2. Start with the most common words (by frequency or curriculum overlap)
3. Noun enrichment: genus, plural, 4-form declension table
4. Verb enrichment: tense forms (infinitive, presens, preteritum, perfektum partisipp, imperativ), verb class, auxiliary
5. Adjective enrichment: comparison forms, gender/number/definiteness declension

**Potential data sources:**
- Ordbok API (ordbok.uib.no) — if available
- Manual curation in spreadsheet → import script
- Norwegian frequency lists for prioritization

### Phase 4: German Lexicon View

**Goal:** Generate standardized lexicon entries for German from existing banks.

`scripts/generate-de-lexicon.js`:
- Read `banks/de/*.json` → output `lexicon/de/*.json` in unified lexicon format
- Same for `banks/es/` and `core/fr/`
- These are generated views, not manually maintained

### Phase 5: English & Nynorsk Lexicon

**Goal:** Add EN and NN as first-class lexicon languages.

- EN: Extract from `translations/de-en/` and `translations/es-en/`, same approach as NB
- NN: Can potentially be partially generated from NB entries using known NB→NN transformation rules, then manually corrected
- Generate links: `de-en`, `en-de`, `de-nn`, `nn-de`, `nb-nn`, `nn-nb`

### Phase 6: API v3

**Goal:** New API endpoints that expose the two-way dictionary.

Endpoints:
- `GET /api/vocab/v3/lookup/{language}/{wordId}` — full word entry from any language
- `GET /api/vocab/v3/search/{language}?q=...` — search within any language's lexicon
- `GET /api/vocab/v3/links/{from}-{to}/{wordId}` — get linked words across languages
- `GET /api/vocab/v3/translate/{from}/{to}?q=...` — convenience: search + follow link
- `GET /api/vocab/v3/manifest` — manifest with lexicon metadata for all languages

v1 and v2 endpoints are **completely untouched**.

### Phase 7: Search Index

**Goal:** Build search indices for all lexicon languages.

- Extend `scripts/build-search-index.js` to work with lexicon entries
- Generate `lexicon/nb/search-index.json`, `lexicon/en/search-index.json`, etc.

### Phase 8: App Migration & Sunset

**Goal:** Migrate consuming apps to v3, then remove old structure.

1. Update webapps to use v3 endpoints
2. Update Leksihjelp to use v3 endpoints
3. Verify all apps work with v3
4. Remove `vocabulary/translations/`, `api/vocab/v1/`, `api/vocab/v2/`
5. `vocabulary/lexicon/` becomes the sole data store

---

## Backward Compatibility Guarantee

| Component | During phases 1-7 | After migration (phase 8) |
|-----------|-------------------|---------------------------|
| `api/vocab/v1/*` | Unchanged, working | Removed |
| `api/vocab/v2/*` | Unchanged, working | Removed |
| `api/vocab/v3/*` | New, available | Primary API |
| `vocabulary/banks/` | Unchanged, source of truth | Removed |
| `vocabulary/translations/` | Unchanged | Removed |
| `vocabulary/lexicon/` | New, growing | Primary data store |

Existing webapps and Leksihjelp **never break** during phases 1-7. Migration happens on your schedule.

---

## What We're NOT Doing

- **Not modifying existing bank files** — they stay as-is
- **Not modifying v1/v2 API handlers** — they stay as-is
- **Not building a database** — still file-based JSON, same Vercel deployment
- **Not duplicating source-language data** — DE/ES/FR lexicon entries are generated views

---

## Current Data Inventory

| Source | Entries | Enriched | Norwegian words with definite form |
|--------|---------|----------|-----------------------------------|
| `de-nb/nounbank` | 1,641 | 18% (examples/explanations) | 284 have `definite` field |
| `de-nb/verbbank` | 679 | 22% | — |
| `de-nb/adjectivebank` | 365 | 100% (all have examples + explanations) | — |
| `de-nb/generalbank` | 673 | 9% | — |
| `de-nb/other` | 96 | varies | — |
| `es-nb/total` | 1,017 | ~6% | — |
| `fr-nb/total` | 0 | empty placeholders | — |
| **Total Norwegian translations** | **~4,471** | | |
| **Estimated unique NB words** | **~3,000-3,500** | | |
