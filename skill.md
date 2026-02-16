# Papertek Vocabulary API — AI Skill Reference

You are connecting to the Papertek Vocabulary API, a read-only REST API serving vocabulary data for language learning applications.

## Base URL

```
https://papertek-vocabulary.vercel.app/api/vocab
```

## Available languages

- `de` — German (870 core words, 3196 dictionary words)
- `es` — Spanish (870 core words)
- `fr` — French (870 core words)

## Translation pairs

`de-en`, `de-nb`, `es-en`, `es-nb`, `fr-nb`

## Endpoints

### GET /v1/manifest

Returns API overview with all available languages, translation pairs, curricula, and dictionary info. Call this first to discover what data is available.

### GET /v1/core/{language}

Returns core vocabulary banks for a language.

- `language` (path, required): `de`, `es`, or `fr`
- `bank` (query, optional): return a single bank — `verbbank`, `nounbank`, `adjectivebank`, `articlesbank`, `generalbank`, `numbersbank`, `phrasesbank`, `pronounsbank`

Example: `/v1/core/de?bank=verbbank`

Each word entry includes the word, type, audio filename, and grammar data (conjugations for verbs, genus/plural/cases for nouns, comparison forms for adjectives).

### GET /v1/translations/{pair}

Returns translations for a language pair.

- `pair` (path, required): `de-en`, `de-nb`, `es-en`, `es-nb`, `fr-nb`
- `bank` (query, optional): return a single bank

Example: `/v1/translations/de-en`

Each entry includes translation, synonyms, examples, and explanations.

### GET /v1/grammarfeatures

Returns grammar feature metadata for progressive disclosure in learning apps.

- `language` (query, optional): `de`, `es`, or `fr`. Omit for all languages.

Example: `/v1/grammarfeatures?language=de`

Returns feature IDs like `grammar_present`, `grammar_articles`, `grammar_dative` with descriptions and the data paths they correspond to.

### GET /v1/curricula

Returns a list of all available curriculum manifests with id, language, and name.

### GET /v1/curricula/{curriculumId}

Returns a curriculum manifest mapping lessons to word IDs and grammar features.

- `curriculumId` (path, required): `tysk1-vg1`, `tysk1-vg2`, `tysk2-vg1`, `tysk2-vg2`, `us-8`, `us-9`, `us-10`, `spansk1-vg1`

Example: `/v1/curricula/tysk1-vg1`

Response structure:
```json
{
  "lessons": {
    "1.1": {
      "words": ["sein_verb", "haben_verb", "und_conj"],
      "features": ["grammar_present", "grammar_pronouns_ich_du"]
    }
  }
}
```

### GET /v2/search/{language}

Full-text search across vocabulary.

- `language` (path, required): `de`, `es`, or `fr`
- `q` (query, required): search query, minimum 2 characters
- `lang` (query, optional): translation language — `nb` (default) or `en`
- `limit` (query, optional): max results 1–50, default 10
- `type` (query, optional): filter by word type — `verb`, `noun`, `adjective`, etc.
- `cefr` (query, optional): filter by CEFR level — `A1`, `A2`, `B1` (comma-separated)
- `source` (query, optional): `all` (default), `curriculum`, `dictionary`

Example: `/v2/search/de?q=haus&limit=5`

Results are ranked: prefix matches on word first, then prefix matches on translation, then contains matches, sorted by word frequency within each band.

### GET /v2/lookup/{language}/{wordId}

Detailed lookup for a single word with all grammatical data.

- `language` (path, required): `de`, `es`, or `fr`
- `wordId` (path, required): word identifier, e.g. `haus_noun`, `sein_verb`
- `lang` (query, optional): translation language — `nb` (default) or `en`

Example: `/v2/lookup/de/haus_noun`

Returns: word, type, genus, plural, audio, translation, conjugations, cases, CEFR level, frequency, grammar features, and more.

## Word ID format

Word IDs follow the pattern `{word}_{type}`, for example:
- `sein_verb`, `haben_verb`
- `haus_noun`, `garten_noun`
- `gross_adj`, `schnell_adj`
- `und_conj`, `aus_prep`
- `hallo_interj`

Multi-part type suffixes: `dem_pron`, `poss_pron`, `refl_pron`, `dobj_pron`, `iobj_pron`

## Audio

Audio files are MP3, accessible at:
```
https://papertek-vocabulary.vercel.app/vocabulary/core/{lang}/audio/{filename}
```

The `audio` field on word entries contains the filename (e.g. `substantiv_haus.mp3`).

## Caching

All responses include `Cache-Control: public, max-age=3600, s-maxage=86400`. Data changes infrequently.

## CORS

All endpoints return `Access-Control-Allow-Origin: *`. Safe to call from any browser application.

## Usage guidelines

- This is a free, public, read-only API
- Please cache responses on your end when possible
- Do not make excessive automated requests — be respectful of shared resources
