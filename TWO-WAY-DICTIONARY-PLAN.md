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
| Typos & accepted forms | Every word can have `typos` (common misspellings for word prediction in Leksihjelp) and `acceptedForms` (alternative spellings accepted in glossary tests) |

---

## Leksihjelp Integration Features

### Common Writing Errors (`typos`)

Every lexicon entry can include typical student errors. Leksihjelp uses these
for word prediction — when a student types a known misspelling, the app can
suggest the correct word:

```json
"kjøkken_noun": {
  "word": "kjøkken",
  "typos": ["kjøken", "sjøkken", "kjøkken", "kjøken"],
  ...
}
```

German example for foreign language learners:
```json
"strasse_noun": {
  "word": "Straße",
  "typos": ["Strase", "Strasse", "strase"],
  ...
}
```

### Accepted Answer Variants (`acceptedForms`)

For glossary tests — alternative spellings, informal forms, or common
simplifications that should count as correct:

```json
"los_gehts_phrase": {
  "word": "Los geht's",
  "acceptedForms": ["los gehts", "los geht's", "Los gehts"],
  ...
}
```

Both fields are defined in `lexicon-entry.schema.json` and apply to
entries in all languages. Data population happens through manual curation
and can be done incrementally.

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

### Phase 1: Schemas & NB Lexicon Foundation — DONE ✅

**Completed.** Lexicon data model defined, Norwegian word entries generated from translation data.

**What was built:**
- 5 JSON Schema files in `vocabulary/schema/lexicon/` (entry, noun, verb, adjective, link)
- `scripts/generate-nb-lexicon.js` — extracts 3,649 unique NB words from de-nb and es-nb translations
- `scripts/validate-lexicon.js` — validates entries (schema, ID uniqueness, orphan detection, link integrity)
- `vocabulary/lexicon/grammar-features.json` — 12 Norwegian grammar features for progressive disclosure
- NB lexicon: 1,596 nouns, 663 verbs, 401 adjectives, 989 general words

### Phase 2: Link Structure — DONE ✅

**Completed.** Bidirectional links between all language pairs.

**What was built:**
- `scripts/generate-links.js` — forward links (de-nb, es-nb) + auto-generated reverse links (nb-de, nb-es)
- 4,471 forward links + 4,295 reverse links, 0 orphans
- Slash alternatives split correctly, many-to-one collapsed in reverse direction

### Phase 3: Norwegian Grammar Enrichment — DONE ✅

**Completed.** Rule-based morphology engine populates NB entries with full grammar data.

**What was built:**
- `scripts/enrich-nb-lexicon.js` — Norwegian morphology engine with:
  - 30+ irregular nouns (barn→barnet/barna, mann→menn, bok→bøker, etc.)
  - 45+ irregular/strong verbs (gå→går/gikk/gått, være→er/var/vært, etc.)
  - 12 irregular adjective comparisons (stor→større/størst, god→bedre/best, etc.)
  - Rule-based generation for regular words (noun gender heuristics, verb class detection, adjective declension)
- Result: 2,589/3,649 words enriched (1,596 nouns, 592 verbs, 401 adjectives)

### Phase 4: Source Language Lexicon Views — DONE ✅

**Completed.** DE/ES/FR entries transformed into unified lexicon format.

**What was built:**
- `scripts/generate-source-lexicon.js` — reads banks/core data, outputs unified lexicon entries
- DE: 3,454 entries, ES: 989 entries, FR: 977 entries
- All existing grammar data preserved (German cases, conjugations, etc.)
- Cross-bank deduplication (e.g., ES phrases appearing in both generalbank and phrasesbank)

### Phase 5: English Lexicon — DONE ✅ (NN deferred)

**Completed for English.** Nynorsk deferred to a future phase.

**What was built:**
- `scripts/generate-en-lexicon.js` — 3,795 unique EN words from de-en and es-en translations
- `scripts/generate-en-links.js` — 4,472 forward + 4,394 reverse EN links
- EN lexicon: 1,685 nouns, 672 verbs, 414 adjectives, 1,024 general words

**Still TODO — Nynorsk (NN):**
- Generate NN lexicon, potentially using NB→NN transformation rules
- Generate links: de-nn, nn-de, nb-nn, nn-nb
- NN grammar features in grammar-features.json

### Phase 6: API v3 — DONE ✅

**Completed.** All five v3 endpoints deployed.

**What was built:**
- `GET /api/vocab/v3/manifest` — discovers all lexicon languages, link pairs, grammar features
- `GET /api/vocab/v3/lookup/{language}/{wordId}` — full word entry with linked words and grammar features
- `GET /api/vocab/v3/search/{language}?q=...` — scored search with typo/acceptedForm fuzzy matching
- `GET /api/vocab/v3/links/{pair}/{wordId}` — bidirectional link lookup with optional `?resolve=true`
- `GET /api/vocab/v3/translate/{from}/{to}?q=...` — convenience: search + follow link in one call

v1 and v2 endpoints are **completely untouched**.

### Phase 7: Search Index — DONE ✅

**Completed.** Compact search indices for all lexicon languages.

**What was built:**
- `scripts/build-lexicon-search-index.js` — generates search indices with typos/acceptedForms fields
- NB: 3,649 entries (190 KB), DE: 3,454 entries (255 KB), EN: 3,795 entries (190 KB)
- ES: 989 entries (49 KB), FR: 977 entries (48 KB)

### Phase 8: Nynorsk Lexicon — TODO

**Goal:** Add Nynorsk (NN) as a first-class lexicon language.

- Generate NN lexicon entries (can partially derive from NB using known NB→NN rules)
- Manual corrections for NN-specific forms
- Generate links: de-nn, nn-de, es-nn, nn-es, nb-nn, nn-nb
- Add NN grammar features to grammar-features.json
- Build NN search index

### Phase 9: Typos & Accepted Forms Population — TODO

**Goal:** Populate the `typos` and `acceptedForms` fields with real data.

- Schema fields are ready in `lexicon-entry.schema.json`
- Search API already supports typo/acceptedForm matching
- Needs manual curation or semi-automated extraction from student error patterns
- Priority: high-frequency words and words commonly misspelled by Norwegian students

### Phase 10: App Migration & Sunset — TODO

**Goal:** Migrate consuming apps to v3, then remove old structure.

1. Update webapps to use v3 endpoints
2. Update Leksihjelp to use v3 endpoints (integrate typos/acceptedForms)
3. Verify all apps work with v3
4. Remove `vocabulary/translations/`, `api/vocab/v1/`, `api/vocab/v2/`
5. `vocabulary/lexicon/` becomes the sole data store

---

## Backward Compatibility Guarantee

| Component | During phases 1-7 (DONE) | After migration (phase 10) |
|-----------|--------------------------|----------------------------|
| `api/vocab/v1/*` | Unchanged, working | Removed |
| `api/vocab/v2/*` | Unchanged, working | Removed |
| `api/vocab/v3/*` | New, available | Primary API |
| `vocabulary/banks/` | Unchanged, source of truth | Removed |
| `vocabulary/translations/` | Unchanged | Removed |
| `vocabulary/lexicon/` | New, growing | Primary data store |

Existing webapps and Leksihjelp **never break** during phases 1-9. Migration happens on your schedule.

---

## What We're NOT Doing

- **Not modifying existing bank files** — they stay as-is
- **Not modifying v1/v2 API handlers** — they stay as-is
- **Not building a database** — still file-based JSON, same Vercel deployment
- **Not duplicating source-language data** — DE/ES/FR lexicon entries are generated views

---

## Current Lexicon Inventory

| Language | Entries | Enriched | Links (forward) | Links (reverse) |
|----------|---------|----------|-----------------|-----------------|
| NB | 3,649 | 2,589 (71%) | — | nb-de: 3,240 / nb-es: 1,055 |
| DE | 3,454 | 3,454 (100%) | de-nb: 3,454 / de-en: 3,455 | — |
| EN | 3,795 | 0 (skeleton) | — | en-de: 3,321 / en-es: 1,073 |
| ES | 989 | 989 (100%) | es-nb: 1,017 / es-en: 1,017 | — |
| FR | 977 | 977 (100%) | — (no translations yet) | — |
| NN | — | — | — | — |

**Build commands:**
- `npm run build:lexicon-all` — regenerate everything
- `npm run validate:lexicon` — validate all entries and links
- `npm run build:lexicon` — NB lexicon + links + enrichment only

## Copyright Note

All lexicon data is derived from our own existing translation files in `vocabulary/`.
The Norwegian morphology engine applies standard grammar rules (linguistic facts, not
copyrightable content). No external dictionaries, APIs, or copyrighted word lists are used.
