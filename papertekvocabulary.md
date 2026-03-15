# Papertek Vocabulary API — Integration Reference

You are integrating with the Papertek Vocabulary API, a REST API serving vocabulary data for Norwegian language learning applications. It provides a two-way dictionary with grammar enrichment, audio pronunciation, and curriculum mapping across 6 languages.

## Base URL

```
https://vocab.papertek.no/api/vocab
```

## Languages and word counts

| Code | Language | Words | Audio | CEFR |
|------|----------|-------|-------|------|
| `de` | German (Tysk) | 3,454 | Yes | A1/A2/B1 |
| `en` | English (Engelsk) | 3,795 | Yes | A1/A2/B1 |
| `es` | Spanish (Spansk) | 3,483 | Yes | A1/A2/B1 |
| `fr` | French (Fransk) | 3,446 | Yes | A1/A2/B1 |
| `nb` | Norwegian Bokmål | 3,649 | Yes | A1/A2/B1 |
| `nn` | Nynorsk | 3,643 | Yes | A1/A2/B1 |

**Total: 21,470 words** across all languages.

## API versions

- **V3** (current, recommended) — Two-way dictionary with full grammar, links, and bulk export
- **V2** — Dictionary search and lookup (still available)
- **V1** — Legacy core vocabulary and curricula (still available)

---

## V3 Endpoints (recommended)

### GET /v3/manifest

Returns the full API manifest with all languages, link pairs, grammar features, and endpoint URLs.

Each language entry includes:
- `totalWords`, `enrichedWords`, `banks` — word counts
- `version` — content hash (changes only when data changes)
- `audioVersion` — audio content hash
- `exportEndpoint`, `lookupEndpoint`, `searchEndpoint`, `listEndpoint`, `audioEndpoint`

Use the manifest to discover available data and check for updates.

### GET /v3/export/{language}

**Bulk export** — returns the entire language as a single JSON response. This is the primary endpoint for building offline language packs.

Response structure:
```json
{
  "_metadata": {
    "language": "de",
    "languageName": "Tysk",
    "version": "434f0ffd",
    "totalWords": 3454,
    "generatedAt": "2026-03-15T..."
  },
  "_grammarFeatures": {
    "features": [
      {
        "id": "grammar_de_presens",
        "name": "Presens",
        "nameEn": "Present Tense",
        "category": "verbs",
        "appliesTo": ["verb"],
        "dataPath": "conjugations.presens"
      }
    ],
    "categories": [
      { "id": "verbs", "name": "Verb", "nameEn": "Verbs" }
    ]
  },
  "nounbank": {
    "haus_noun": {
      "word": "Haus",
      "type": "noun",
      "genus": "n",
      "plural": "die Häuser",
      "forms": {
        "ubestemt": { "entall": "ein Haus", "flertall": "die Häuser" },
        "bestemt": { "entall": "das Haus", "flertall": "die Häuser" }
      },
      "cefr": "A1",
      "frequency": 155,
      "audio": "substantiv_haus.mp3",
      "typos": ["Haus"],
      "explanation": { "_description": "Tysk nøytralt (das) substantiv. Flertall: die Häuser." },
      "examples": [
        { "sentence": "Das Haus ist groß.", "translation": "Huset er stort.", "lang": "de" }
      ],
      "linkedTo": {
        "nb": { "primary": "hus_noun", "translation": "hus" },
        "en": { "primary": "house_noun", "translation": "house" }
      },
      "grammarFeatures": ["grammar_de_genus", "grammar_de_plural"]
    }
  },
  "verbbank": { ... },
  "adjectivebank": { ... },
  "generalbank": { ... }
}
```

**Caching:** Supports `ETag` / `If-None-Match` — send the `version` hash and get `304 Not Modified` if data hasn't changed.

**Banks vary by language:** DE/ES/FR have 8 banks (nounbank, verbbank, adjectivebank, generalbank, articlesbank, numbersbank, phrasesbank, pronounsbank). EN/NB/NN have 4 banks (the other types are folded into generalbank).

### GET /v3/lookup/{language}/{wordId}

Single word lookup with all grammar data and resolved links.

### GET /v3/search/{language}?q={query}

Full-text search with type and CEFR filtering.

### GET /v3/translate/{from}/{to}?q={query}

Two-way translation lookup between any language pair.

### GET /v3/links/{pair}/{wordId}?resolve=true

Direct bidirectional link lookup with optional target word resolution.

### GET /v3/list/{language}

Returns all word IDs for a language (for bulk operations).

---

## V1 Endpoints (legacy, still available)

### GET /v1/manifest

Overview of all languages, translation pairs, curricula, and downloads.

### GET /v1/core/{language}

Core vocabulary banks for DE, ES, FR.

### GET /v1/translations/{pair}

Translations for a language pair (de-en, de-nb, es-en, es-nb, fr-nb).

### GET /v1/grammarfeatures

Grammar feature metadata for progressive disclosure.

### GET /v1/curricula

Lists all curriculum manifests.

### GET /v1/curricula/{curriculumId}

Returns lesson-to-word mapping for a specific curriculum:

```json
{
  "lessons": {
    "1.1": {
      "words": ["sein_verb", "haben_verb", "und_conj"],
      "features": ["grammar_presens", "grammar_pronouns_ich_du"]
    }
  }
}
```

Available curricula:
- `tysk1-vg1`, `tysk1-vg2`, `tysk2-vg1`, `tysk2-vg2` (German, Wir sprechen Deutsch)
- `us-8`, `us-9`, `us-10` (German, Deutsch für die Mittelstufe)
- `spansk1-vg1` (Spanish, Buen viaje)

---

## Word entry fields

Every word entry may contain these fields (not all entries have all fields):

| Field | Type | Description |
|-------|------|-------------|
| `word` | string | The word in the target language |
| `type` | string | Part of speech: noun, verb, adj, adv, prep, conj, etc. |
| `genus` | string | Grammatical gender: m, f, n (nouns only) |
| `plural` | string | Plural form (nouns only) |
| `forms` | object | Full noun declension (singular/plural × definite/indefinite) |
| `conjugations` | object | Verb conjugation tables (presens, preteritum, perfektum) |
| `verbClass` | string | Verb group (weak/strong/irregular, -ar/-er/-ir, etc.) |
| `auxiliary` | string | Auxiliary verb (har/er for NB/NN, haben/sein for DE) |
| `comparison` | object | Adjective gradation (positiv, komparativ, superlativ) |
| `declension` | object | Adjective declension by gender/number/definiteness |
| `cefr` | string | Difficulty level: A1, A2, B1 |
| `frequency` | number | Corpus frequency rank (lower = more common) |
| `curriculum` | boolean | Whether the word is in the curriculum (DE only) |
| `audio` | string | Audio filename (e.g., "verb_essen.mp3") |
| `typos` | array | Common misspellings for fuzzy matching |
| `acceptedForms` | array | Alternative accepted forms |
| `explanation` | object | Norwegian grammar description (`_description` field) |
| `examples` | array | Sentence pairs: `{ sentence, translation, lang }` |
| `linkedTo` | object | Links to other languages with resolved translations |
| `grammarFeatures` | array | Applicable grammar feature IDs |

## Word ID format

`{word}_{type}` — lowercase, no accents, underscores for spaces:
- `haus_noun`, `essen_verb`, `gross_adj`, `und_conj`
- Multi-part suffixes: `dem_pron`, `poss_pron`
- French verbs use `_verbe` suffix: `parler_verbe`, `manger_verbe`

## Conjugation structure

Conjugation tables have pronoun-labeled forms and grammar feature references:

**German:**
```json
{
  "presens": {
    "former": { "ich": "esse", "du": "isst", "er/sie/es": "isst", "wir": "essen", "ihr": "esst", "sie/Sie": "essen" },
    "feature": "grammar_de_presens"
  },
  "preteritum": { "former": { "ich": "aß", ... }, "feature": "grammar_de_preteritum" },
  "perfektum": { "participle": "gegessen", "auxiliary": "haben", "former": { ... }, "feature": "grammar_de_perfektum" }
}
```

**Spanish:**
```json
{
  "presens": { "former": { "yo": "como", "tú": "comes", "él/ella": "come", "nosotros": "comemos", "vosotros": "coméis", "ellos/ellas": "comen" } },
  "preteritum": { "former": { "yo": "comí", ... } },
  "perfektum": { "participle": "comido", "auxiliary": "haber", "former": { "yo": "he comido", ... } }
}
```

**French:**
```json
{
  "presens": { "former": { "je": "mange", "tu": "manges", "il/elle": "mange", "nous": "mangeons", "vous": "mangez", "ils/elles": "mangent" } },
  "imparfait": { "former": { "je": "mangeais", ... } },
  "passe_compose": { "participle": "mangé", "auxiliary": "avoir", "former": { "je": "j'ai mangé", ... } }
}
```

**Norwegian (NB/NN):**
```json
{
  "presens": {
    "former": { "infinitiv": "å spise", "presens": "spiser", "preteritum": "spiste", "perfektum_partisipp": "spist", "imperativ": "spis" },
    "auxiliary": "har"
  }
}
```

**English:**
```json
{
  "present": { "former": { "I": "eat", "you": "eat", "he/she": "eats", "we": "eat", "they": "eat" } },
  "past": { "former": { "simple": "ate" } },
  "perfect": { "former": { "participle": "eaten" } }
}
```

## Audio files

Audio is served as static files. Every entry in every language has an `audio` field pointing to an MP3 file.

**Individual files:**
```
/vocabulary/banks/de/audio/{filename}     (German)
/vocabulary/core/es/audio/{filename}      (Spanish)
/vocabulary/core/fr/audio/{filename}      (French)
/vocabulary/lexicon/en/audio/{filename}   (English)
/vocabulary/lexicon/nb/audio/{filename}   (Norwegian Bokmål)
/vocabulary/lexicon/nn/audio/{filename}   (Norwegian Nynorsk)
```

**ZIP downloads (all files per language):**
```
/vocabulary/downloads/audio-de.zip   (27.9 MB)
/vocabulary/downloads/audio-es.zip   (46.6 MB)
/vocabulary/downloads/audio-fr.zip   (44.6 MB)
/vocabulary/downloads/audio-en.zip   (55.5 MB)
/vocabulary/downloads/audio-nb.zip   (44.6 MB)
/vocabulary/downloads/audio-nn.zip   (44.8 MB)
```

The manifest includes `audioVersion` (content hash) and `audioEndpoint` (ZIP URL) per language.

## Search indices

Compact pre-built search indices for fast client-side search:
```
/vocabulary/lexicon/{language}/search-index.json
```

Each entry contains: `id`, `w` (word), `t` (type), `g` (genus), `c` (CEFR), `f` (frequency), `vc` (verb class), `cur` (curriculum flag), `typos`, `af` (accepted forms).

## Translation links

The `linkedTo` field on export entries contains resolved translations to other languages:

```json
"linkedTo": {
  "nb": {
    "primary": "hus_noun",
    "translation": "hus",
    "examples": [
      { "source": "Das Haus ist groß.", "target": "Huset er stort." }
    ],
    "alternatives": ["bolig_noun"],
    "synonyms": ["bolig", "bygning"],
    "explanation": "..."
  }
}
```

Not all link entries have examples/alternatives/synonyms — only `primary` and `translation` are guaranteed.

30 bidirectional link pairs connect all language combinations (de↔en, de↔es, de↔fr, de↔nb, de↔nn, en↔es, en↔fr, en↔nb, en↔nn, es↔fr, es↔nb, es↔nn, fr↔nb, fr↔nn, nb↔nn). All pairs have 83%+ coverage — students can look up any word and find translations in all other languages.

## Consumer patterns

### Pattern A: Build-time bundling (papertek-webapps)

1. Fetch `/v3/manifest` — discover languages and versions
2. For each language: fetch `/v3/export/{lang}` — save as JSON
3. Download audio ZIPs from `audioEndpoint`
4. Fetch curricula from `/v1/curricula/{id}`
5. Bundle everything into the deployment

Use `If-None-Match` with the version hash to skip unchanged languages between builds.

### Pattern B: Runtime language packs (Leksihjelp)

1. Fetch `/v3/manifest` — check `version` per language against cached version
2. If outdated: fetch `/v3/export/{lang}` — store in IndexedDB
3. Optionally: download audio ZIP from `audioEndpoint` — store blobs in IndexedDB
4. All lookups served from local cache — zero API calls during use

### Pattern C: Live API (interactive dictionary)

Use `/v3/search`, `/v3/lookup`, and `/v3/translate` endpoints for real-time lookups. Responses are CDN-cached.

## Caching

| Resource | Cache-Control |
|----------|---------------|
| API responses | `public, max-age=3600, s-maxage=86400` |
| Export endpoint | `public, max-age=86400, s-maxage=86400` + ETag |
| Audio files | `public, max-age=31536000, immutable` |
| Audio ZIPs | `public, max-age=86400` |

## CORS

All endpoints return `Access-Control-Allow-Origin: *`. Safe to call from any browser application.

## Enrichment coverage

All entries have: word, type, CEFR level, explanation, examples (sentence pairs with Norwegian translation), and audio pronunciation.

| Feature | DE | EN | ES | FR | NB | NN |
|---------|-----|-----|-----|-----|-----|-----|
| CEFR | 100% | 100% | 100% | 100% | 100% | 100% |
| Conjugations | 100% | 99.9% | 100% | 100% | 100% | 100% |
| Noun forms | 100% | 100% | 100% | 100% | 100% | 100% |
| Adj comparison | 100% | 99.8% | 97% | 99% | 100% | 100% |
| Explanations | 100% | 100% | 100% | 100% | 100% | 100% |
| Examples | 100% | 100% | 100% | 100% | 100% | 100% |
| Audio | 100% | 100% | 100% | 100% | 100% | 100% |
| Typos | 60% | 26% | 44% | 48% | 52% | 55% |

## Data pipeline

Build commands for regenerating data:

```bash
npm run build:lexicon-all          # Full rebuild pipeline
npm run validate:lexicon            # Validate all entries and links
npm run build:lexicon-search-index  # Rebuild compact search indices
npm run link:audio                  # Link audio files to lexicon entries
```
