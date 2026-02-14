# Phase 1B: Set Up `papertek-vocabulary` as Standalone Vercel Project

> **Context:** This plan file is self-contained. Drop it into the new `papertek-vocabulary`
> repo and give it to an AI agent or follow it step by step.
>
> **Source repo:** `Papertek-forlag-AS/Tysk-niv--1-versjon-1.3` (the "Wir Sprechen" monorepo)
> **Target repo:** `Papertek-forlag-AS/papertek-vocabulary` (new, standalone)
>
> **Goal:** Deploy the vocabulary API as its own Vercel project at `vocab.papertek.no`,
> independent from the webapp. The webapp keeps its local copy as fallback during transition.

---

## Table of Contents

1. [What to Copy from the Monorepo](#1-what-to-copy-from-the-monorepo)
2. [Target Folder Structure](#2-target-folder-structure)
3. [File Path Changes in API Handlers](#3-file-path-changes-in-api-handlers)
4. [New Files to Create](#4-new-files-to-create)
5. [Vercel Configuration](#5-vercel-configuration)
6. [Deployment & Domain Setup](#6-deployment--domain-setup)
7. [Verification Checklist](#7-verification-checklist)
8. [What NOT to Touch in the Monorepo](#8-what-not-to-touch-in-the-monorepo)

---

## 1. What to Copy from the Monorepo

Copy these paths from `Tysk-niv--1-versjon-1.3/` into the new repo root:

### Vocabulary Data (`shared/vocabulary/` -> `vocabulary/`)

| Source (monorepo) | Destination (new repo) | Description |
|---|---|---|
| `shared/vocabulary/core/` | `vocabulary/core/` | Core word banks (de, es, fr) + audio MP3s |
| `shared/vocabulary/translations/` | `vocabulary/translations/` | Translation packs (de-nb, de-en, es-nb, es-en, fr-nb, de-en-dict, de-nb-dict) |
| `shared/vocabulary/curricula/` | `vocabulary/curricula/` | 8 curriculum manifest JSONs |
| `shared/vocabulary/dictionary/` | `vocabulary/dictionary/` | Extended dictionary (de) + search indices |
| `shared/vocabulary/schema/` | `vocabulary/schema/` | 7 JSON Schema files for validation |
| `shared/vocabulary/compat/` | `vocabulary/compat/` | `word-id-aliases.json` |
| `shared/vocabulary/downloads/` | `vocabulary/downloads/` | 3 audio ZIPs + `manifest.json` |
| `shared/vocabulary/grammar-features.json` | `vocabulary/grammar-features.json` | Grammar features (single source of truth) |
| `shared/vocabulary/PROMOTE-WORD-TO-CURRICULUM.md` | `vocabulary/PROMOTE-WORD-TO-CURRICULUM.md` | Guide for promoting dictionary words |

### API Handlers (`api/vocab/` -> `api/vocab/`)

| Source (monorepo) | Destination (new repo) | Description |
|---|---|---|
| `api/vocab/v1/manifest.js` | `api/vocab/v1/manifest.js` | Manifest/discovery endpoint |
| `api/vocab/v1/grammarfeatures.js` | `api/vocab/v1/grammarfeatures.js` | Grammar features endpoint |
| `api/vocab/v1/core/[language].js` | `api/vocab/v1/core/[language].js` | Core vocabulary endpoint |
| `api/vocab/v1/translations/[pair].js` | `api/vocab/v1/translations/[pair].js` | Translations endpoint |
| `api/vocab/v2/search/[language].js` | `api/vocab/v2/search/[language].js` | Full-text search endpoint |
| `api/vocab/v2/lookup/[language]/[wordId].js` | `api/vocab/v2/lookup/[language]/[wordId].js` | Word lookup endpoint |
| `api/vocab/README.md` | `api/vocab/README.md` | API documentation |

### Shell Commands to Copy

```bash
# From the monorepo root (Tysk-niv--1-versjon-1.3/)
# Assuming the new repo is at ../papertek-vocabulary/

# 1. Copy vocabulary data
mkdir -p ../papertek-vocabulary/vocabulary
cp -R shared/vocabulary/core ../papertek-vocabulary/vocabulary/
cp -R shared/vocabulary/translations ../papertek-vocabulary/vocabulary/
cp -R shared/vocabulary/curricula ../papertek-vocabulary/vocabulary/
cp -R shared/vocabulary/dictionary ../papertek-vocabulary/vocabulary/
cp -R shared/vocabulary/schema ../papertek-vocabulary/vocabulary/
cp -R shared/vocabulary/compat ../papertek-vocabulary/vocabulary/
cp -R shared/vocabulary/downloads ../papertek-vocabulary/vocabulary/
cp shared/vocabulary/grammar-features.json ../papertek-vocabulary/vocabulary/
cp shared/vocabulary/PROMOTE-WORD-TO-CURRICULUM.md ../papertek-vocabulary/vocabulary/

# 2. Copy API handlers (preserve directory structure)
mkdir -p ../papertek-vocabulary/api/vocab/v1/core
mkdir -p ../papertek-vocabulary/api/vocab/v1/translations
mkdir -p ../papertek-vocabulary/api/vocab/v2/search
mkdir -p ../papertek-vocabulary/api/vocab/v2/lookup/\[language\]

cp api/vocab/v1/manifest.js ../papertek-vocabulary/api/vocab/v1/
cp api/vocab/v1/grammarfeatures.js ../papertek-vocabulary/api/vocab/v1/
cp "api/vocab/v1/core/[language].js" ../papertek-vocabulary/api/vocab/v1/core/
cp "api/vocab/v1/translations/[pair].js" ../papertek-vocabulary/api/vocab/v1/translations/
cp "api/vocab/v2/search/[language].js" ../papertek-vocabulary/api/vocab/v2/search/
cp "api/vocab/v2/lookup/[language]/[wordId].js" "../papertek-vocabulary/api/vocab/v2/lookup/[language]/"
cp api/vocab/README.md ../papertek-vocabulary/api/vocab/
```

---

## 2. Target Folder Structure

```
papertek-vocabulary/
├── api/
│   └── vocab/
│       ├── README.md                           # API documentation
│       ├── v1/
│       │   ├── manifest.js                     # GET /api/vocab/v1/manifest
│       │   ├── grammarfeatures.js              # GET /api/vocab/v1/grammarfeatures
│       │   ├── core/
│       │   │   └── [language].js               # GET /api/vocab/v1/core/{language}
│       │   └── translations/
│       │       └── [pair].js                   # GET /api/vocab/v1/translations/{pair}
│       └── v2/
│           ├── search/
│           │   └── [language].js               # GET /api/vocab/v2/search/{language}
│           └── lookup/
│               └── [language]/
│                   └── [wordId].js             # GET /api/vocab/v2/lookup/{lang}/{wordId}
├── vocabulary/                                  # All vocabulary data
│   ├── grammar-features.json                   # Grammar features (source of truth)
│   ├── PROMOTE-WORD-TO-CURRICULUM.md
│   ├── core/
│   │   ├── de/                                 # German
│   │   │   ├── adjectivebank.json
│   │   │   ├── articlesbank.json
│   │   │   ├── generalbank.json
│   │   │   ├── manifest.json
│   │   │   ├── nounbank.json
│   │   │   ├── numbersbank.json
│   │   │   ├── phrasesbank.json
│   │   │   ├── pronounsbank.json
│   │   │   ├── verbbank.json
│   │   │   └── audio/                          # ~3,567 MP3 files
│   │   ├── es/                                 # Spanish (same structure)
│   │   └── fr/                                 # French (same structure)
│   ├── translations/
│   │   ├── de-en/                              # German -> English
│   │   ├── de-en-dict/                         # German -> English (dictionary-only)
│   │   ├── de-nb/                              # German -> Norwegian
│   │   ├── de-nb-dict/                         # German -> Norwegian (dictionary-only)
│   │   ├── es-en/                              # Spanish -> English
│   │   ├── es-nb/                              # Spanish -> Norwegian
│   │   └── fr-nb/                              # French -> Norwegian
│   ├── curricula/
│   │   ├── vocab-manifest-tysk1-vg1.json
│   │   ├── vocab-manifest-tysk1-vg2.json
│   │   ├── vocab-manifest-tysk2-vg1.json
│   │   ├── vocab-manifest-tysk2-vg2.json
│   │   ├── vocab-manifest-us-8.json
│   │   ├── vocab-manifest-us-9.json
│   │   ├── vocab-manifest-us-10.json
│   │   └── vocab-manifest-spansk1-vg1.json
│   ├── dictionary/
│   │   ├── de/                                 # Extended German (3,196 words)
│   │   │   ├── adjectivebank.json
│   │   │   ├── articlesbank.json
│   │   │   ├── generalbank.json
│   │   │   ├── manifest.json
│   │   │   ├── nounbank.json
│   │   │   ├── numbersbank.json
│   │   │   ├── phrasesbank.json
│   │   │   ├── pronounsbank.json
│   │   │   ├── search-index.json
│   │   │   ├── search-index.pretty.json
│   │   │   └── verbbank.json
│   │   ├── frequency/
│   │   ├── sources/
│   │   └── verb-classification-de.json
│   ├── schema/
│   │   ├── adjective.schema.json
│   │   ├── core-word.schema.json
│   │   ├── curriculum-manifest.schema.json
│   │   ├── dictionary-word.schema.json
│   │   ├── language-pack.schema.json
│   │   ├── noun.schema.json
│   │   └── verb.schema.json
│   ├── compat/
│   │   └── word-id-aliases.json
│   └── downloads/
│       ├── audio-de.zip                        # 7.35 MB
│       ├── audio-es.zip                        # 9.32 MB
│       ├── audio-fr.zip                        # 14.22 MB
│       └── manifest.json
├── public/                                      # Static files served directly
│   └── (symlinked or copied from vocabulary/ — see build step)
├── vercel.json                                  # Vercel deployment config
├── package.json                                 # Project config
├── .gitignore
├── .gitattributes                               # Git LFS for audio
└── README.md
```

---

## 3. File Path Changes in API Handlers

**This is the critical change.** In the monorepo, all API handlers read vocabulary from:
```javascript
path.join(process.cwd(), 'public', 'shared', 'vocabulary')
```

In the new repo, vocabulary lives at the root level under `vocabulary/`. The API handlers
must be updated to read from:
```javascript
path.join(process.cwd(), 'vocabulary')
```

### Files to Update

Each API handler has a function like `getVocabBasePath()` or hardcoded paths. Here's exactly
what to change in each file:

#### `api/vocab/v1/manifest.js`
**Line 23** — Change:
```javascript
// OLD:
const vocabPath = path.join(process.cwd(), 'public', 'shared', 'vocabulary');
// NEW:
const vocabPath = path.join(process.cwd(), 'vocabulary');
```

Also update the audio base URL in the response (line 58):
```javascript
// OLD:
baseUrl: `/shared/vocabulary/core/${lang}/audio`,
// NEW:
baseUrl: `/vocabulary/core/${lang}/audio`,
```

#### `api/vocab/v1/core/[language].js`
**Lines 28-34** — Change the `getVocabBasePath()` function:
```javascript
// OLD:
function getVocabBasePath() {
  const possiblePaths = [
    path.join(process.cwd(), 'public', 'shared', 'vocabulary'),
    path.join(process.cwd(), 'shared', 'vocabulary'),
    path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..', 'public', 'shared', 'vocabulary'),
  ];
  // ...
}

// NEW:
function getVocabBasePath() {
  return path.join(process.cwd(), 'vocabulary');
}
```

#### `api/vocab/v1/translations/[pair].js`
**Line 56** — Change:
```javascript
// OLD:
const pairPath = path.join(process.cwd(), 'public', 'shared', 'vocabulary', 'translations', normalizedPair);
// NEW:
const pairPath = path.join(process.cwd(), 'vocabulary', 'translations', normalizedPair);
```

#### `api/vocab/v1/grammarfeatures.js`
**Lines 21-24** — Change the path list:
```javascript
// OLD:
const possiblePaths = [
  path.join(process.cwd(), 'public', 'shared', 'vocabulary', 'grammar-features.json'),
  path.join(process.cwd(), 'shared', 'vocabulary', 'grammar-features.json'),
];

// NEW:
const possiblePaths = [
  path.join(process.cwd(), 'vocabulary', 'grammar-features.json'),
];
```

#### `api/vocab/v2/search/[language].js`
**Lines 22-38** — Change `getVocabBasePath()`:
```javascript
// NEW:
function getVocabBasePath() {
  return path.join(process.cwd(), 'vocabulary');
}
```

#### `api/vocab/v2/lookup/[language]/[wordId].js`
**Lines 47-61** — Change `getVocabBasePath()`:
```javascript
// NEW:
function getVocabBasePath() {
  return path.join(process.cwd(), 'vocabulary');
}
```

Also update the audioUrl in the response (line 202):
```javascript
// OLD:
audioUrl: entry.audio ? `/shared/vocabulary/core/${langCode}/audio/${entry.audio}` : null,
// NEW:
audioUrl: entry.audio ? `/vocabulary/core/${langCode}/audio/${entry.audio}` : null,
```

#### Update API documentation base URL
In `api/vocab/README.md`, update all URLs from `www.papertek.no` to `vocab.papertek.no`:
```
# OLD:
https://www.papertek.no/api/vocab/v1

# NEW:
https://vocab.papertek.no/api/vocab/v1
```

---

## 4. New Files to Create

### `package.json`

```json
{
  "name": "papertek-vocabulary",
  "version": "1.0.0",
  "description": "Papertek Vocabulary API — vocabulary data and API for language learning apps",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vercel dev",
    "validate": "node scripts/validate.js",
    "validate:ids": "node scripts/check-ids.js",
    "validate:audio": "node scripts/check-audio.js",
    "validate:all": "npm run validate && npm run validate:ids && npm run validate:audio"
  },
  "engines": {
    "node": ">=18.0.0"
  }
}
```

### `vercel.json`

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "framework": null,
  "outputDirectory": ".",
  "functions": {
    "api/vocab/**/*.js": {
      "includeFiles": "vocabulary/**/*.json"
    }
  },
  "headers": [
    {
      "source": "/api/vocab/(.*)",
      "headers": [
        {
          "key": "Access-Control-Allow-Origin",
          "value": "*"
        },
        {
          "key": "Access-Control-Allow-Methods",
          "value": "GET, OPTIONS"
        },
        {
          "key": "Access-Control-Allow-Headers",
          "value": "Content-Type, X-API-Key"
        }
      ]
    },
    {
      "source": "/vocabulary/(.*)/audio/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        },
        {
          "key": "Access-Control-Allow-Origin",
          "value": "*"
        }
      ]
    },
    {
      "source": "/vocabulary/downloads/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=86400"
        },
        {
          "key": "Access-Control-Allow-Origin",
          "value": "*"
        }
      ]
    },
    {
      "source": "/vocabulary/(.*).json",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=3600, s-maxage=86400"
        },
        {
          "key": "Access-Control-Allow-Origin",
          "value": "*"
        }
      ]
    }
  ],
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/$1"
    }
  ]
}
```

### `.gitignore`

```gitignore
node_modules/
.vercel/
.env
.env.local
.DS_Store
```

### `.gitattributes` (for Git LFS on audio files)

```gitattributes
# Track audio files with Git LFS (prevents repo bloat)
vocabulary/core/*/audio/*.mp3 filter=lfs diff=lfs merge=lfs -text
vocabulary/downloads/*.zip filter=lfs diff=lfs merge=lfs -text
```

> **Note:** You can skip Git LFS initially and just commit the audio files directly.
> The repo will be ~100MB which is manageable. Add LFS later if the audio grows.

### `README.md`

```markdown
# Papertek Vocabulary API

Vocabulary data and REST API for language learning applications.
Serves vocabulary for German, Spanish, and French with Norwegian/English translations.

## Live API

- **Production:** `https://vocab.papertek.no/api/vocab/v1`
- **Documentation:** See [api/vocab/README.md](api/vocab/README.md)

## Quick Start

### API Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /api/vocab/v1/manifest` | Available languages, translations, downloads |
| `GET /api/vocab/v1/core/{language}` | Core vocabulary (de, es, fr) |
| `GET /api/vocab/v1/translations/{pair}` | Translations (de-nb, de-en, etc.) |
| `GET /api/vocab/v1/grammarfeatures` | Grammar features for progressive disclosure |
| `GET /api/vocab/v2/search/{language}?q=...` | Full-text vocabulary search |
| `GET /api/vocab/v2/lookup/{language}/{wordId}` | Detailed word lookup |

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
# API available at http://localhost:3000/api/vocab/v1/manifest
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
```

### `api/version.json` (create this new file)

```json
{
  "version": "1.0.0",
  "lastUpdated": "2026-02-14T00:00:00Z",
  "languages": {
    "de": {
      "banks": ["adjectivebank", "articlesbank", "generalbank", "nounbank", "numbersbank", "phrasesbank", "pronounsbank", "verbbank"],
      "coreWords": 870,
      "dictionaryWords": 3196,
      "audioFiles": 3567
    },
    "es": {
      "banks": ["adjectivebank", "articlesbank", "generalbank", "nounbank", "numbersbank", "phrasesbank", "pronounsbank", "verbbank"],
      "coreWords": 870,
      "audioFiles": 993
    },
    "fr": {
      "banks": ["adjectivebank", "articlesbank", "generalbank", "nounbank", "numbersbank", "phrasesbank", "pronounsbank", "verbbank"],
      "coreWords": 870,
      "audioFiles": 1457
    }
  },
  "curricula": [
    "tysk1-vg1", "tysk1-vg2", "tysk2-vg1", "tysk2-vg2",
    "us-8", "us-9", "us-10", "spansk1-vg1"
  ],
  "translationPairs": ["de-nb", "de-en", "es-nb", "es-en", "fr-nb"]
}
```

---

## 5. Vercel Configuration

### Key Difference from Monorepo

In the monorepo, the build step copies `shared/` -> `public/shared/` and Vercel serves
from `public/`. In this new repo, `vocabulary/` lives at root level and is served directly.

The `functions` block in `vercel.json` tells Vercel to bundle the JSON files with the
serverless functions:

```json
"functions": {
  "api/vocab/**/*.js": {
    "includeFiles": "vocabulary/**/*.json"
  }
}
```

**Important:** This `includeFiles` pattern bundles JSON files but NOT audio (MP3) or ZIPs.
Audio is served as static files by Vercel's CDN directly from `vocabulary/core/*/audio/`.

### Static File Serving

Vercel serves all non-API files as static assets. So these URLs will work automatically:

```
/vocabulary/core/de/audio/substantiv_garten.mp3
/vocabulary/downloads/audio-de.zip
/vocabulary/core/de/nounbank.json    (direct access, bypassing API)
```

The API endpoints add value by combining banks, normalizing language names, filtering, and
adding metadata.

---

## 6. Deployment & Domain Setup

### Step 1: Create the Vercel Project

```bash
cd papertek-vocabulary
npx vercel link
# Choose: Create new project
# Project name: papertek-vocabulary
# Framework: Other
# Root directory: ./
```

### Step 2: Deploy

```bash
npx vercel --prod
```

Or connect the GitHub repo to Vercel for auto-deploy on push.

### Step 3: Add Custom Domain

In the Vercel dashboard for `papertek-vocabulary`:

1. Go to **Settings > Domains**
2. Add `vocab.papertek.no`
3. Configure DNS (CNAME record):
   ```
   vocab.papertek.no -> cname.vercel-dns.com
   ```
4. Wait for SSL certificate provisioning

### Step 4: Verify

```bash
# Test API
curl https://vocab.papertek.no/api/vocab/v1/manifest | jq .api

# Test static audio
curl -I https://vocab.papertek.no/vocabulary/core/de/audio/substantiv_garten.mp3

# Test search
curl "https://vocab.papertek.no/api/vocab/v2/search/de?q=Haus" | jq .results

# Test downloads
curl -I https://vocab.papertek.no/vocabulary/downloads/audio-de.zip
```

---

## 7. Verification Checklist

Run through all of these before considering Phase 1B complete:

### API Endpoints
- [ ] `GET /api/vocab/v1/manifest` returns language list with correct endpoints
- [ ] `GET /api/vocab/v1/core/german` returns all German banks combined
- [ ] `GET /api/vocab/v1/core/german?bank=verbbank` returns only verbs
- [ ] `GET /api/vocab/v1/core/spanish` returns Spanish banks
- [ ] `GET /api/vocab/v1/core/french` returns French banks
- [ ] `GET /api/vocab/v1/translations/german-to-norwegian` returns translations
- [ ] `GET /api/vocab/v1/translations/de-nb` also works (ISO code alias)
- [ ] `GET /api/vocab/v1/translations/german-to-english` returns translations
- [ ] `GET /api/vocab/v1/grammarfeatures` returns all languages' features
- [ ] `GET /api/vocab/v1/grammarfeatures?language=de` returns German-only
- [ ] `GET /api/vocab/v2/search/de?q=Haus` returns search results
- [ ] `GET /api/vocab/v2/search/de?q=hus&lang=nb` finds via Norwegian translation
- [ ] `GET /api/vocab/v2/lookup/de/sein_verb` returns full verb data with conjugations
- [ ] `GET /api/vocab/v2/lookup/de/garten_noun` returns noun with genus and plural
- [ ] Invalid language returns 400 with helpful error
- [ ] Invalid endpoint returns 404

### CORS
- [ ] All API responses include `Access-Control-Allow-Origin: *`
- [ ] OPTIONS preflight requests return 200
- [ ] Fetch from `localhost:8000` works (test with browser console)
- [ ] Fetch from `www.papertek.no` works (test with browser console)

### Static Files
- [ ] Audio files accessible: `/vocabulary/core/de/audio/substantiv_garten.mp3`
- [ ] Audio files have `Cache-Control: immutable` header
- [ ] Audio files have CORS header
- [ ] Download ZIPs accessible: `/vocabulary/downloads/audio-de.zip`
- [ ] JSON files accessible directly: `/vocabulary/core/de/nounbank.json`

### Caching
- [ ] API responses have `Cache-Control: public, max-age=3600, s-maxage=86400`
- [ ] Audio files have `max-age=31536000, immutable`
- [ ] Download files have `max-age=86400`

### Data Integrity
- [ ] German: 870 core words, 3196 dictionary words
- [ ] Spanish: core banks all present
- [ ] French: core banks all present
- [ ] All 8 curriculum manifests accessible
- [ ] Grammar features: 15 German, 6 Spanish, 6 French

### Cross-Origin Test from Monorepo Webapp
- [ ] Open `www.papertek.no` or `localhost:8000` (the webapp)
- [ ] In browser console, run:
  ```javascript
  fetch('https://vocab.papertek.no/api/vocab/v1/manifest')
    .then(r => r.json())
    .then(d => console.log('Vocab API works:', d.api))
    .catch(e => console.error('CORS or network error:', e));
  ```
- [ ] Should log the API name and version without CORS errors

---

## 8. What NOT to Touch in the Monorepo

**During Phase 1B, the monorepo (`Tysk-niv--1-versjon-1.3`) stays unchanged.**

- Do NOT remove `shared/vocabulary/` from the monorepo
- Do NOT remove `api/vocab/` from the monorepo
- Do NOT modify `vocabulary-loader.js` in the webapp yet
- Do NOT modify any iOS/Android code yet

The webapp continues to use its own local copy of vocabulary data. The new vocab API runs
independently in parallel. This is a zero-risk deployment.

**Phase 2** (separate task) will modify the webapp to fetch from `vocab.papertek.no` with
the local copy as fallback. That happens only after Phase 1B is verified working.

---

## Summary of Steps

```
1. Create GitHub repo: Papertek-forlag-AS/papertek-vocabulary (private)
2. Copy vocabulary data and API handlers (see Section 1)
3. Update file paths in all 6 API handlers (see Section 3)
4. Create package.json, vercel.json, .gitignore, README.md, api/version.json (see Section 4)
5. git init && git add . && git commit -m "feat: initial vocabulary API from monorepo"
6. git remote add origin ... && git push
7. Connect to Vercel, deploy
8. Add vocab.papertek.no domain
9. Run verification checklist (Section 7)
10. Done! Monorepo untouched, vocab API lives independently.
```

**Estimated time:** 1-2 hours for an AI agent, 2-3 hours manual.
