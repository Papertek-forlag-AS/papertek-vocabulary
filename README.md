# Papertek Vocabulary API

Vocabulary data and REST API for language learning applications.
Serves vocabulary for German, Spanish, and French with Norwegian/English translations.

## Live API

- **Production:** `https://vocab.papertek.no/api/vocab`
- **Documentation:** See [api/vocab/README.md](api/vocab/README.md)

## Quick Start

### API Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /api/vocab/manifest` | Available languages, translations, downloads |
| `GET /api/vocab/core/{language}` | Core vocabulary (de, es, fr) |
| `GET /api/vocab/translations/{pair}` | Translations (de-nb, de-en, etc.) |
| `GET /api/vocab/grammarfeatures` | Grammar features for progressive disclosure |
| `GET /api/vocab/search/{language}?q=...` | Full-text vocabulary search |
| `GET /api/vocab/lookup/{language}/{wordId}` | Detailed word lookup |

### Static Files (audio, downloads)

Audio files are served directly:
```
https://vocab.papertek.no/vocabulary/core/de/audio/substantiv_garten.mp3
```

Bulk downloads:
```
https://vocab.papertek.no/vocabulary/downloads/audio-de.zip
```

## Local Development

```bash
npm install
npx vercel dev
# API available at http://localhost:3000/api/vocab/manifest
```

## Data Structure

- `vocabulary/core/{de,es,fr}/` — Language-intrinsic data (words, conjugations, declensions)
- `vocabulary/translations/{pair}/` — Translation packs
- `vocabulary/curricula/` — Lesson-to-word mappings per curriculum
- `vocabulary/dictionary/` — Extended vocabulary with search index
- `vocabulary/schema/` — JSON Schema files for validation
- `vocabulary/grammar-features.json` — Grammar concept definitions

## Deployment

Deployed automatically via Vercel on push to `main`.
