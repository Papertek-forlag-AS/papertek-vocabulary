# Papertek Vocabulary API

A free, open API providing vocabulary data for language learning applications.

## Base URL

```
https://www.papertek.no/api/vocab/v1
```

## Endpoints

### GET /manifest

Returns available languages and translation packs.

**Example:**
```bash
curl https://www.papertek.no/api/vocab/v1/manifest
```

**Response:**
```json
{
  "api": {
    "name": "Papertek Vocabulary API",
    "version": "1.0.0"
  },
  "core": {
    "german": {
      "language": "German",
      "version": "1.0.0",
      "totalWords": 870,
      "files": ["adjectivebank", "articlesbank", "generalbank", ...],
      "endpoint": "/api/vocab/v1/core/german"
    },
    "spanish": { ... }
  },
  "translations": {
    "german-to-norwegian": {
      "from": "german",
      "to": "norwegian",
      "endpoint": "/api/vocab/v1/translations/german-to-norwegian"
    },
    ...
  }
}
```

---

### GET /core/{language}

Returns core vocabulary for a language (words, conjugations, declensions).

**Parameters:**
- `language` (path): `german`, `spanish`
- `bank` (query, optional): Get single bank: `verbbank`, `nounbank`, `adjectivebank`, etc.

**Examples:**
```bash
# Get all German vocabulary
curl https://www.papertek.no/api/vocab/v1/core/german

# Get only German verbs
curl https://www.papertek.no/api/vocab/v1/core/german?bank=verbbank
```

**Response (full):**
```json
{
  "_metadata": {
    "language": "german",
    "banks": ["verbbank", "nounbank", "adjectivebank", ...]
  },
  "verbbank": {
    "sein_verb": {
      "word": "sein",
      "type": "strong",
      "audio": "verb_sein.mp3",
      "conjugations": {
        "presens": {
          "former": {
            "ich": "bin",
            "du": "bist",
            ...
          }
        }
      }
    },
    ...
  },
  "nounbank": {
    "garten_noun": {
      "word": "Garten",
      "genus": "m",
      "plural": "Gärten",
      "audio": "substantiv_garten.mp3",
      "_id": "garten_noun"
    },
    ...
  },
  ...
}
```

---

### GET /translations/{pair}

Returns translations for a language pair.

**Parameters:**
- `pair` (path): `german-to-norwegian`, `german-to-english`, `spanish-to-norwegian`, `spanish-to-english`, `french-to-norwegian`
- `bank` (query, optional): Get single bank

**Examples:**
```bash
# Get all German-to-English translations
curl https://www.papertek.no/api/vocab/v1/translations/german-to-english

# Get only verb translations
curl https://www.papertek.no/api/vocab/v1/translations/german-to-english?bank=verbbank
```

**Response:**
```json
{
  "_metadata": {
    "pair": "german-to-english",
    "from": "german",
    "to": "english",
    "banks": ["verbbank", "nounbank", ...]
  },
  "verbbank": {
    "sein_verb": {
      "translation": "to be",
      "synonyms": ["to exist"],
      "explanation": { ... }
    },
    ...
  }
}
```

---

### GET /grammarfeatures

Returns available grammar features for progressive disclosure. Each language has different grammar concepts that can be shown/hidden based on user settings.

**Parameters:**
- `language` (query, optional): `german`, `de`, `spanish`, `es`, `french`, `fr`

**Examples:**
```bash
# Get all languages' features
curl https://www.papertek.no/api/vocab/v1/grammarfeatures

# Get German grammar features only
curl https://www.papertek.no/api/vocab/v1/grammarfeatures?language=german
```

**Response (for German):**
```json
{
  "language": "German",
  "features": [
    {
      "id": "grammar_present",
      "name": "Presens",
      "nameEn": "Present Tense",
      "description": "Nåtid - bøyning av verb i presens",
      "category": "verbs",
      "appliesTo": ["verb"],
      "dataPath": "conjugations.presens"
    },
    {
      "id": "grammar_articles",
      "name": "Artikler",
      "nameEn": "Articles",
      "description": "Bestemte (der/die/das) og ubestemte (ein/eine) artikler",
      "category": "nouns",
      "appliesTo": ["noun"]
    },
    {
      "id": "grammar_comparative",
      "name": "Komparativ",
      "nameEn": "Comparative",
      "description": "Gradbøyning komparativ (større, bedre)",
      "category": "adjectives",
      "appliesTo": ["adjective"]
    }
    // ... more features
  ],
  "categories": [
    { "id": "verbs", "name": "Verb", "nameEn": "Verbs" },
    { "id": "nouns", "name": "Substantiv", "nameEn": "Nouns" },
    { "id": "adjectives", "name": "Adjektiv", "nameEn": "Adjectives" }
  ]
}
```

**Use case:** Build a settings UI where users select which grammar features they've learned. Filter displayed conjugations, cases, etc. based on their selections.

---

## Usage Examples

### JavaScript/TypeScript

```javascript
// Fetch German vocabulary
const response = await fetch('https://www.papertek.no/api/vocab/v1/core/german');
const germanVocab = await response.json();

// Access verbs
const verbs = germanVocab.verbbank;
console.log(verbs.sein_verb.conjugations.presens.former.ich); // "bin"
```

### Python

```python
import requests

# Get Spanish vocabulary with Norwegian translations
core = requests.get('https://www.papertek.no/api/vocab/v1/core/spanish').json()
trans = requests.get('https://www.papertek.no/api/vocab/v1/translations/spanish-to-norwegian').json()

# Merge core + translations for a word
word_id = 'ser_verb'
word = {**core['verbbank'][word_id], **trans['verbbank'][word_id]}
```

### Swift (iOS)

```swift
let url = URL(string: "https://www.papertek.no/api/vocab/v1/core/german")!
let (data, _) = try await URLSession.shared.data(from: url)
let vocab = try JSONDecoder().decode(VocabularyResponse.self, from: data)
```

---

---

## Audio Files

### Using the `audio` Property

Each vocabulary entry includes an `audio` property with the filename for pronunciation:

```json
{
  "garten_noun": {
    "word": "Garten",
    "genus": "m",
    "audio": "substantiv_garten.mp3"
  }
}
```

**To play audio:**
```javascript
const word = vocab.nounbank.garten_noun;
if (word.audio) {
  const audioUrl = `https://www.papertek.no/shared/vocabulary/core/de/audio/${word.audio}`;
  const audio = new Audio(audioUrl);
  audio.play();
}
```

**Coverage:** ~97% of vocabulary entries have audio (848 of 870 words).

### Bulk Download (Recommended)

Download all audio files for a language as a single ZIP:

```bash
# German audio (7.3 MB, 1062 files)
curl -O https://staging-tysk.vercel.app/shared/vocabulary/downloads/audio-de.zip

# Spanish audio (9.3 MB, 993 files)
curl -O https://staging-tysk.vercel.app/shared/vocabulary/downloads/audio-es.zip

# French audio (14.2 MB, 1457 files)
curl -O https://staging-tysk.vercel.app/shared/vocabulary/downloads/audio-fr.zip
```

The manifest endpoint includes download URLs and file sizes.

### Individual Files

For single files, access directly:

```
https://staging-tysk.vercel.app/shared/vocabulary/core/{lang}/audio/{filename}.mp3
```

**Examples:**
```bash
# German adjective "alt" (old)
curl https://staging-tysk.vercel.app/shared/vocabulary/core/de/audio/adjektiv_alt.mp3
```

**Naming convention:** `{wordtype}_{word}.mp3`

---

## Caching

Responses are cached:
- **Browser cache:** 1 hour
- **CDN cache:** 24 hours

For production apps, we recommend caching locally and refreshing weekly.

---

## Rate Limits

Currently no rate limits. Be respectful - cache responses rather than fetching on every app launch.

---

## Future: API Keys

API keys are optional but recommended for:
- Usage analytics (know when we update data)
- Priority support
- Higher rate limits (if needed)

To request an API key: api@papertek.no

---

## Data License

Vocabulary data is provided for educational use. Contact us for commercial licensing.

---

## Changelog

### v1.0.1 (2026-02-08)
- Added `audio` property to 621 vocabulary entries (97% coverage)
- All verbs, nouns, adjectives, pronouns, articles, and phrases now have audio links

### v1.0.0 (2026-02)
- Initial release
- German, Spanish core vocabulary
- Translations: DE/ES to Norwegian/English
