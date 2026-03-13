# Two-Way Dictionary Plan

## The Problem

Today, papertek-vocabulary is a **one-way vocabulary API**. It answers one question well:

> "What does this German word mean in Norwegian?"

But it cannot answer the reverse:

> "What is the German word for 'hage'?"

And it cannot tell you anything about the Norwegian word itself — no grammar, no plural, no gender. The Norwegian side is just a flat string like `"å hente"` or `"hage"`.

A true **two-way dictionary** means both languages are first-class citizens with rich linguistic data, and you can traverse in either direction.

---

## Design Principles

1. **Zero disruption** — v1 and v2 APIs remain untouched. Existing apps (webapps, Leksihjelp) keep working on the current endpoints without any changes until they're ready to migrate.
2. **Additive only** — All new work lives in new directories (`vocabulary/lexicon/`, `api/vocab/v3/`). Nothing in the existing `banks/`, `translations/`, `core/`, `v1/`, `v2/` is modified or removed.
3. **Sunset later** — After all consuming apps have migrated to v3, we delete the old directories and endpoints in a clean removal phase.

---

## Architecture: The Lexicon Model

Instead of "source language word + flat translation string", we introduce a **lexicon** where every word in every language is a first-class entry, and **links** connect them.

### New directory structure

```
vocabulary/
├── banks/          # UNCHANGED — existing German/Spanish/French word banks
├── core/           # UNCHANGED — legacy core vocabulary
├── translations/   # UNCHANGED — existing one-way translation packs
├── curricula/      # UNCHANGED
├── schema/         # Extended with new schemas
│   ├── lexicon-entry.schema.json    (NEW)
│   └── lexicon-link.schema.json     (NEW)
├── lexicon/                         (NEW — the two-way dictionary)
│   ├── nb/                          Norwegian lexicon entries
│   │   ├── verbbank.json
│   │   ├── nounbank.json
│   │   ├── adjectivebank.json
│   │   └── generalbank.json
│   ├── en/                          English lexicon entries
│   │   ├── verbbank.json
│   │   ├── nounbank.json
│   │   └── ...
│   ├── de/                          German entries (generated from existing banks/)
│   │   └── ...
│   └── links/                       Bidirectional word relationships
│       ├── de-nb.json
│       ├── nb-de.json               (reverse of de-nb, auto-generated)
│       ├── de-en.json
│       ├── en-de.json
│       ├── es-nb.json
│       └── ...
api/vocab/
├── v1/             # UNCHANGED
├── v2/             # UNCHANGED
└── v3/             # NEW — two-way dictionary endpoints
    ├── lookup/[language]/[wordId].js
    ├── search/[language].js
    ├── links/[pair]/[wordId].js
    └── manifest.js
```

### Lexicon Entry (target language word as first-class citizen)

Example: Norwegian noun "hage"

```json
{
  "hage_noun": {
    "word": "hage",
    "type": "noun",
    "language": "nb",
    "genus": "m",
    "plural": "hager",
    "definite": {
      "singular": "hagen",
      "plural": "hagene"
    },
    "audio": "hage.mp3",
    "frequency": 12500,
    "cefr": "A1"
  }
}
```

Example: Norwegian verb "å hente"

```json
{
  "hente_verb": {
    "word": "hente",
    "type": "verb",
    "language": "nb",
    "infinitive": "å hente",
    "present": "henter",
    "past": "hentet",
    "perfect": "har hentet",
    "imperative": "hent",
    "audio": "hente.mp3"
  }
}
```

### Links (bidirectional word relationships)

`lexicon/links/de-nb.json`:

```json
{
  "_metadata": {
    "from": "de",
    "to": "nb",
    "generatedAt": "2026-03-13T00:00:00Z"
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
    "context": "Physical garden, yard"
  },
  "abholen_verb": {
    "primary": "hente_verb",
    "alternatives": ["plukke_opp_verb"],
    "examples": [
      {
        "source": "Ich hole dich ab.",
        "target": "Jeg henter deg."
      }
    ]
  }
}
```

The **reverse link** `lexicon/links/nb-de.json` is auto-generated from `de-nb.json` by a build script, inverting primary/alternative mappings.

### German entries in the lexicon

For German (and Spanish, French), lexicon entries are **generated from the existing banks/** — not duplicated. A build script reads `banks/de/nounbank.json` and produces `lexicon/de/nounbank.json` in the standardized lexicon format. This means:

- **banks/** remains the source of truth for the learning languages
- **lexicon/de/** is a derived view, rebuilt on demand
- No data duplication or sync burden

---

## Phased Implementation

### Phase 1: Norwegian Lexicon Foundation

**Goal:** Create first-class Norwegian word entries for all words that currently appear as translations.

Tasks:
1. Define `lexicon-entry.schema.json` — language-agnostic word schema
2. Write `scripts/generate-nb-lexicon.js` — reads all `translations/de-nb/*.json` and `translations/es-nb/*.json`, extracts unique Norwegian words, creates structured entries with basic grammar (type inferred from source word type)
3. Manually enrich a pilot set (~50 common nouns) with Norwegian grammar (genus, plural, definite forms)
4. Create `vocabulary/lexicon/nb/` directory with the generated banks

**Deliverable:** `lexicon/nb/nounbank.json`, `verbbank.json`, etc. with Norwegian words as first-class entries.

### Phase 2: Link Structure

**Goal:** Replace flat translation strings with structured bidirectional links.

Tasks:
1. Define `lexicon-link.schema.json`
2. Write `scripts/generate-links.js` — reads existing `translations/de-nb/` and produces `lexicon/links/de-nb.json` with proper word ID references
3. Write `scripts/generate-reverse-links.js` — produces `lexicon/links/nb-de.json` from the forward links
4. Carry over existing examples and explanations from translation packs into the link data

**Deliverable:** `lexicon/links/de-nb.json`, `lexicon/links/nb-de.json` with bidirectional traversal.

### Phase 3: German Lexicon View

**Goal:** Generate standardized lexicon entries for German from the existing banks.

Tasks:
1. Write `scripts/generate-de-lexicon.js` — reads `banks/de/*.json` and outputs `lexicon/de/*.json` in the unified lexicon format
2. Same for Spanish (`banks/es/`) and French (`core/fr/`)

**Deliverable:** `lexicon/de/`, `lexicon/es/`, `lexicon/fr/` — all generated, not manually maintained.

### Phase 4: English Lexicon

**Goal:** Add English as a first-class lexicon language.

Tasks:
1. Generate English lexicon entries from `translations/de-en/` and `translations/es-en/`
2. Generate `lexicon/links/de-en.json`, `lexicon/links/en-de.json`

**Deliverable:** `lexicon/en/` with English word entries and bidirectional links.

### Phase 5: API v3

**Goal:** New API endpoints that expose the two-way dictionary.

Endpoints:
- `GET /api/vocab/v3/lookup/{language}/{wordId}` — full word entry from any language
- `GET /api/vocab/v3/search/{language}?q=...` — search within any language's lexicon
- `GET /api/vocab/v3/links/{from}-{to}/{wordId}` — get linked words across languages
- `GET /api/vocab/v3/translate/{from}/{to}?q=...` — convenience: search + link in one call
- `GET /api/vocab/v3/manifest` — updated manifest including lexicon metadata

Key: v1 and v2 endpoints are **completely untouched** and continue serving existing apps.

### Phase 6: Search Index for All Languages

**Goal:** Build search indices for Norwegian and English (German/Spanish already have them).

Tasks:
1. Extend `scripts/build-search-index.js` to work with lexicon entries
2. Generate `lexicon/nb/search-index.json`, `lexicon/en/search-index.json`

### Phase 7: App Migration & Sunset

**Goal:** Migrate consuming apps to v3, then remove old structure.

Tasks:
1. Update webapps to use v3 endpoints
2. Update Leksihjelp to use v3 endpoints
3. Verify all apps work with v3
4. Remove `vocabulary/translations/` directory
5. Remove `api/vocab/v1/` and `api/vocab/v2/` endpoints
6. Remove `vocabulary/banks/` and `vocabulary/core/` (lexicon is now the source of truth)

---

## Backward Compatibility Guarantee

| Component | During build phases (1-6) | After migration (phase 7) |
|-----------|--------------------------|---------------------------|
| `api/vocab/v1/*` | Unchanged, working | Removed |
| `api/vocab/v2/*` | Unchanged, working | Removed |
| `api/vocab/v3/*` | New, available | Primary API |
| `vocabulary/banks/` | Unchanged, source of truth | Removed (lexicon is source) |
| `vocabulary/translations/` | Unchanged | Removed |
| `vocabulary/lexicon/` | New, growing | Primary data store |

Your existing webapps and Leksihjelp will **never break** during phases 1-6. They keep hitting v1/v2 which are completely isolated from the new work. You migrate each app on your own schedule, and only after everything is on v3 do we clean up.

---

## What We're NOT Doing

- **Not modifying existing bank files** — they stay as-is
- **Not modifying v1/v2 API handlers** — they stay as-is
- **Not duplicating data** — German/Spanish/French lexicon entries are generated views
- **Not building a database** — still file-based JSON, same deployment model
- **Not changing the Vercel setup** — new endpoints are just additional serverless functions

---

## Open Questions

1. **Norwegian grammar depth** — How much Norwegian grammar do we want? Just genus + plural + definite forms? Or full declension tables like we have for German?
2. **Which languages first?** — Should we start with Norwegian (nb) since that's the primary translation target, then English?
3. **Manual enrichment** — Norwegian word grammar can't be fully auto-generated from the German translations. How do we want to handle enrichment? Manual curation? External data source?
4. **Lexicon ID format** — Should Norwegian word IDs follow the same `word_type` pattern (e.g., `hage_noun`)? Or should we use a language-prefixed format (e.g., `nb:hage_noun`) to avoid collisions?
