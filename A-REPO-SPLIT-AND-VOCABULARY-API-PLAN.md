# A — Repository Split & Vocabulary API Plan

> **Goal:** Eliminate the single-point-of-failure risk by splitting the monorepo into
> independent, well-defined repositories — and serve vocabulary through an API/CDN so
> all platforms stay in sync without rebuilding.

---

## Table of Contents

1. [Why Split](#1-why-split)
2. [Target Architecture](#2-target-architecture)
3. [Repo Definitions](#3-repo-definitions)
4. [Phase 0 — Preparation & Safety](#phase-0--preparation--safety-week-1)
5. [Phase 1 — Vocabulary Repo + CDN](#phase-1--vocabulary-repo--cdn-week-2-3)
6. [Phase 2 — Webapp Consumes API](#phase-2--webapp-consumes-vocabulary-api-week-3-4)
7. [Phase 3 — Mobile Apps Consume API](#phase-3--mobile-apps-consume-vocabulary-api-week-4-6)
8. [Phase 4 — Final Repo Separation](#phase-4--final-repo-separation-week-6-8)
9. [Vocabulary API Specification](#5-vocabulary-api-specification)
10. [Risk Analysis & Rollback](#6-risk-analysis--rollback)
11. [Decision Log](#7-decision-log)

---

## 1. Why Split

### Current Risk

The monorepo at `Papertek-forlag-AS/Tysk-niv--1-versjon-1.3` contains **everything**:

| Component | Size | Description |
|-----------|------|-------------|
| Webapp | ~150MB | 375 HTML pages, 32K lines JS, all exercises |
| iOS apps (2) | ~2.5MB | Swift code + shared iOS core (31 files) |
| Android app | ~1MB | Kotlin code (12 service/model files) |
| Vocabulary data | ~34MB | 78 JSON files across 3 languages |
| Audio files | ~51MB | Vocabulary audio (34MB) + lesson audio (17MB) |
| **Total** | **~319MB** | Single repo, single point of failure |

**If this repo is lost, corrupted, or access is revoked — everything is gone.**

### Current Coupling

```
                    ┌─────────────────────────────┐
                    │  MONOREPO (319MB)            │
                    │                              │
                    │  ┌──── Webapp ─────────┐     │
                    │  │  public/js/          │     │
                    │  │  public/*.html       │     │
                    │  │  imports JSON ───────┼──┐  │
                    │  └─────────────────────┘  │  │
                    │                           │  │
                    │  ┌──── shared/ ────────┐  │  │
                    │  │  vocabulary/ ◄──────┼──┘  │
                    │  │    core/de,es,fr/   │     │
                    │  │    translations/    │     │
                    │  │    curricula/       │     │
                    │  │    audio/ (34MB)    │     │
                    │  │  ios-core/ (31 .swift) │  │
                    │  └──────────┬──────────┘  │  │
                    │             │              │  │
                    │  ┌──── apps/ ──────────┐  │  │
                    │  │  german-trainer/    ◄┼──┘  │
                    │  │  wir-sprechen/      ◄┼──┘  │
                    │  │  android/           │     │
                    │  └────────────────────┘     │
                    │                              │
                    │  Firebase config (.firebaserc)│
                    └─────────────────────────────┘
```

**Problems:**
1. **Blast radius** — A force push, accidental deletion, or GitHub outage kills all platforms
2. **Git clone is 319MB** — Slow for contributors and CI
3. **Vocabulary updates require app rebuilds** — Fix a typo in German, must rebuild iOS + Android + redeploy webapp
4. **Audio files bloat git history** — Binary files don't delta-compress well
5. **Release cycles are tangled** — Webapp deploys in seconds, apps take days (App Store review)
6. **No versioning** — Impossible to know which vocabulary version a user's app has

---

## 2. Target Architecture

```
┌──────────────────────┐    ┌──────────────────────┐    ┌──────────────────────┐
│  REPO 1              │    │  REPO 2              │    │  REPO 3              │
│  papertek-vocabulary  │    │  papertek-webapp      │    │  papertek-apps       │
│                      │    │                      │    │                      │
│  vocabulary/         │    │  public/             │    │  ios/                │
│    core/de,es,fr/    │    │    js/               │    │    german-trainer/   │
│    translations/     │    │    *.html            │    │    wir-sprechen/     │
│    curricula/        │    │  firebase.json       │    │    shared-ios-core/  │
│    audio/            │    │  tests/              │    │  android/            │
│    schema/           │    │  package.json        │    │    app/              │
│  api/                │    │                      │    │  shared/             │
│    version.json      │    │  Fetches vocab from  │    │    firebase-config/  │
│    deploy script     │    │  CDN at runtime ───┐ │    │                      │
│                      │    │                    │ │    │  Fetches vocab from  │
│  Hosted on Firebase  │◄───┼────────────────────┘ │    │  CDN on launch ──┐  │
│  Hosting / CDN       │◄───┼──────────────────────┼────┼──────────────────┘  │
│                      │    │                      │    │                      │
│  npm package too     │    │  Firebase Hosting    │    │  App Store / Play    │
│  (optional)          │    │  (webapp deploy)     │    │  Store releases      │
└──────────────────────┘    └──────────────────────┘    └──────────────────────┘
         │                           │                           │
         │                           │                           │
         ▼                           ▼                           ▼
    ┌─────────────────────────────────────────────────────────────┐
    │              Firebase Backend (tysk01-141b1)                │
    │              Firestore / Auth / Cloud Functions             │
    └─────────────────────────────────────────────────────────────┘
```

---

## 3. Repo Definitions

### Repo 1: `papertek-vocabulary`

**Purpose:** Single source of truth for all vocabulary data and audio across all platforms.

**Contains:**
```
papertek-vocabulary/
├── core/
│   ├── de/                    # German core vocabulary
│   │   ├── nounbank.json
│   │   ├── verbbank.json
│   │   ├── adjectivebank.json
│   │   ├── generalbank.json
│   │   ├── numbersbank.json
│   │   ├── phrasesbank.json
│   │   ├── pronounsbank.json
│   │   ├── articlesbank.json
│   │   └── audio/             # German word pronunciation MP3s
│   ├── es/                    # Spanish (same structure)
│   └── fr/                    # French (same structure)
├── translations/
│   ├── de-nb/                 # German → Norwegian
│   ├── de-en/                 # German → English
│   ├── es-nb/                 # Spanish → Norwegian
│   └── es-en/                 # Spanish → English
├── curricula/
│   ├── vocab-manifest-tysk1-vg1.json
│   ├── vocab-manifest-tysk1-vg2.json
│   ├── vocab-manifest-tysk2-vg1.json
│   ├── vocab-manifest-tysk2-vg2.json
│   ├── vocab-manifest-us-8.json
│   ├── vocab-manifest-us-9.json
│   ├── vocab-manifest-us-10.json
│   └── vocab-manifest-spansk1-vg1.json
├── compat/
│   └── word-id-aliases.json   # Backward-compatible word ID mappings
├── schema/
│   ├── core-word.schema.json
│   ├── noun.schema.json
│   ├── verb.schema.json
│   ├── adjective.schema.json
│   ├── curriculum-manifest.schema.json
│   └── language-pack.schema.json
├── api/
│   ├── version.json           # { "version": "1.0.0", "lastUpdated": "2026-02-10" }
│   └── index.json             # Available languages, curricula, banks
├── scripts/
│   ├── validate.js            # Validate all JSON against schemas
│   ├── deploy.sh              # Deploy to Firebase Hosting
│   └── generate-version.js    # Auto-increment version on deploy
├── firebase.json              # Firebase Hosting config for vocab CDN
├── .firebaserc                # Firebase project (same: tysk01-141b1)
├── package.json
└── README.md
```

**Hosted at:** `https://vocab.papertek.no/v1/` (Firebase Hosting with custom domain)
or `https://tysk01-141b1.web.app/vocab/v1/` (default Firebase domain)

**Size:** ~34MB (vocabulary JSON + audio), but **no git history bloat** since audio
files are deployed, not version-tracked by git. Use Git LFS for audio or `.gitignore`
audio and store it in Firebase Storage / Cloud Storage separately.

---

### Repo 2: `papertek-webapp`

**Purpose:** The web application — all HTML pages, JavaScript, CSS, exercises, grammar.

**Contains:**
```
papertek-webapp/
├── public/
│   ├── js/
│   │   ├── vocab-trainer-multi/
│   │   │   ├── vocabulary-loader.js   # MODIFIED: fetches from CDN instead of importing JSON
│   │   │   └── ...
│   │   ├── exercises/
│   │   ├── progress/
│   │   ├── auth/
│   │   ├── sync/
│   │   ├── utils/
│   │   └── ...
│   ├── css/
│   ├── images/
│   ├── audiofiles/              # Lesson dialogue audio (stays here — webapp-specific)
│   ├── content/                 # Lesson HTML content
│   └── *.html                   # 375 page files
├── tests/
├── firebase.json                # Firebase Hosting config for webapp
├── .firebaserc
├── firestore.rules
├── package.json
├── eslint.config.js
└── README.md
```

**Key change:** `vocabulary-loader.js` fetches vocabulary from the CDN instead of
importing local JSON files. The Service Worker caches vocabulary responses.

**Size:** ~130MB (mostly lesson audio + images), dramatically smaller without vocabulary.

---

### Repo 3: `papertek-apps`

**Purpose:** iOS and Android mobile applications.

**Contains:**
```
papertek-apps/
├── ios/
│   ├── german-trainer/          # International standalone app
│   │   ├── App/
│   │   └── Resources/
│   ├── wir-sprechen/            # Norwegian curriculum app
│   │   ├── App/
│   │   └── Resources/
│   └── shared-ios-core/         # Shared Swift code (31 files)
│       ├── Config/
│       │   └── FirebaseEnvironment.swift
│       ├── Models/
│       │   ├── VocabManifest.swift
│       │   ├── VocabularyModels.swift
│       │   └── ...
│       ├── Services/
│       │   ├── VocabularyService.swift  # MODIFIED: fetches from CDN instead of bundle
│       │   ├── ManifestService.swift
│       │   ├── CloudSyncService.swift
│       │   ├── AudioService.swift       # MODIFIED: streams from CDN
│       │   └── ...
│       └── Views/
├── android/
│   ├── app/
│   │   └── src/main/
│   │       ├── java/com/papertek/tysk/
│   │       │   ├── core/
│   │       │   │   ├── VocabularyService.kt  # MODIFIED: fetches from CDN
│   │       │   │   ├── AudioService.kt       # MODIFIED: streams from CDN
│   │       │   │   └── ...
│   │       │   └── ui/
│   │       └── res/
│   └── build.gradle
├── shared/
│   └── firebase-config/         # Shared Firebase project configuration
│       ├── GoogleService-Info.plist    # iOS
│       └── google-services.json       # Android
└── README.md
```

**Key change:** `VocabularyService.swift` and `VocabularyService.kt` fetch from the
CDN on app launch instead of reading from bundled assets. They cache locally for
offline use.

**Size:** ~3MB code only (no bundled vocabulary data).

---

## Phase 0 — Preparation & Safety (Week 1)

> **Principle:** Before splitting anything, ensure we can't lose data.

### 0.1 Mirror the Monorepo

Create mirrors on a second hosting provider in case GitHub goes down or access is revoked.

```bash
# Option A: GitLab mirror
git push --mirror git@gitlab.com:papertek/Tysk-niv--1-versjon-1.3.git

# Option B: Bitbucket mirror
git push --mirror git@bitbucket.org:papertek/Tysk-niv--1-versjon-1.3.git

# Option C: Self-hosted (if you have a server)
git clone --mirror https://github.com/Papertek-forlag-AS/Tysk-niv--1-versjon-1.3.git /backup/tysk.git
```

**Set up automated daily mirror** (GitHub Actions):
```yaml
# .github/workflows/mirror.yml
name: Mirror to GitLab
on:
  schedule:
    - cron: '0 2 * * *'  # Daily at 02:00 UTC
  push:
    branches: [main, develop]
jobs:
  mirror:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      - run: |
          git push --mirror https://oauth2:${{ secrets.GITLAB_TOKEN }}@gitlab.com/papertek/Tysk-niv--1-versjon-1.3.git
```

### 0.2 Export Vocabulary Data Backup

Store a standalone backup of vocabulary outside of git entirely:

```bash
# Upload vocabulary to Firebase Storage (or Google Cloud Storage)
gsutil -m cp -r shared/vocabulary/ gs://tysk01-141b1.appspot.com/backups/vocabulary/$(date +%Y%m%d)/

# Also keep a local archive
tar czf vocabulary-backup-$(date +%Y%m%d).tar.gz shared/vocabulary/
```

### 0.3 Document Current Architecture

Create a `ARCHITECTURE.md` in the monorepo that maps:
- Which files belong to which future repo
- Which files are shared between platforms
- The Firebase project configuration
- All environment variables and secrets needed

### 0.4 Validate Vocabulary JSON

Run schema validation on all vocabulary files before splitting:

```bash
# Ensure all 78 JSON files are valid and match their schemas
npx ajv validate -s shared/vocabulary/schema/noun.schema.json -d "shared/vocabulary/core/*/nounbank.json"
npx ajv validate -s shared/vocabulary/schema/verb.schema.json -d "shared/vocabulary/core/*/verbbank.json"
# ... etc for all bank types
```

### 0.5 Create the Three Empty Repos on GitHub

```
Papertek-forlag-AS/papertek-vocabulary   (private)
Papertek-forlag-AS/papertek-webapp       (private)
Papertek-forlag-AS/papertek-apps         (private)
```

**Do not delete the monorepo.** Keep it as an archive until all three new repos
are verified working (at least 1 month after full migration).

---

## Phase 1 — Vocabulary Repo + CDN (Week 2–3)

> **Goal:** Vocabulary data served from a CDN. Webapp and apps still use local copies
> (dual-source period). This is the lowest-risk phase.

### 1.1 Create `papertek-vocabulary` Repo

```bash
# From the monorepo
mkdir /tmp/papertek-vocabulary
cp -r shared/vocabulary/* /tmp/papertek-vocabulary/
cd /tmp/papertek-vocabulary
git init
git add .
git commit -m "feat: initial vocabulary data from monorepo"
git remote add origin git@github.com:Papertek-forlag-AS/papertek-vocabulary.git
git push -u origin main
```

### 1.2 Add Version Manifest

Create `api/version.json`:
```json
{
  "version": "1.0.0",
  "lastUpdated": "2026-02-10T00:00:00Z",
  "languages": {
    "de": {
      "banks": ["nounbank", "verbbank", "adjectivebank", "generalbank", "numbersbank", "phrasesbank", "pronounsbank", "articlesbank"],
      "audioCount": 850,
      "wordCount": 2400
    },
    "es": { "banks": ["..."], "audioCount": 600, "wordCount": 1800 },
    "fr": { "banks": ["..."], "audioCount": 500, "wordCount": 1500 }
  },
  "curricula": [
    "tysk1-vg1", "tysk1-vg2", "tysk2-vg1", "tysk2-vg2",
    "us-8", "us-9", "us-10", "spansk1-vg1"
  ]
}
```

### 1.3 Add Firebase Hosting Config

`firebase.json` for the vocabulary CDN:
```json
{
  "hosting": {
    "site": "papertek-vocabulary",
    "public": ".",
    "headers": [
      {
        "source": "**/*.json",
        "headers": [
          { "key": "Cache-Control", "value": "public, max-age=3600, s-maxage=86400" },
          { "key": "Access-Control-Allow-Origin", "value": "*" }
        ]
      },
      {
        "source": "**/*.mp3",
        "headers": [
          { "key": "Cache-Control", "value": "public, max-age=604800" },
          { "key": "Access-Control-Allow-Origin", "value": "*" }
        ]
      },
      {
        "source": "api/version.json",
        "headers": [
          { "key": "Cache-Control", "value": "public, max-age=300" },
          { "key": "Access-Control-Allow-Origin", "value": "*" }
        ]
      }
    ],
    "ignore": [
      "firebase.json",
      "**/.*",
      "**/node_modules/**",
      "scripts/**",
      "schema/**"
    ]
  }
}
```

**Cache strategy:**
- `version.json`: 5 minutes (apps check for updates frequently)
- Word bank JSON: 1 hour browser / 24 hours CDN (vocabulary changes rarely)
- Audio MP3: 7 days (audio never changes once uploaded)

### 1.4 Deploy to Firebase Hosting

```bash
cd papertek-vocabulary
firebase use tysk01-141b1
firebase deploy --only hosting:papertek-vocabulary
```

**Verify:**
```bash
curl https://papertek-vocabulary.web.app/api/version.json
curl https://papertek-vocabulary.web.app/core/de/nounbank.json | head -c 200
curl -I https://papertek-vocabulary.web.app/core/de/audio/Hund.mp3
```

### 1.5 Add Validation CI

`.github/workflows/validate.yml`:
```yaml
name: Validate Vocabulary
on: [push, pull_request]
jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci
      - run: node scripts/validate.js    # Validate all JSON against schemas
      - run: node scripts/check-ids.js   # Ensure no duplicate word IDs
      - run: node scripts/check-audio.js # Ensure every word with audio=true has an MP3
```

### 1.6 Verification Checklist

- [ ] All 78 JSON files are accessible via CDN URL
- [ ] All audio files are streamable via CDN URL
- [ ] `version.json` returns correct metadata
- [ ] CORS headers allow requests from webapp domain
- [ ] Cache-Control headers are set correctly
- [ ] CI pipeline validates JSON on every push

---

## Phase 2 — Webapp Consumes Vocabulary API (Week 3–4)

> **Goal:** The webapp fetches vocabulary from the CDN instead of importing local JSON.

### 2.1 Modify `vocabulary-loader.js`

**Before (current — static imports):**
```javascript
import manifestTysk1Vg1 from '../../shared/vocabulary/curricula/vocab-manifest-tysk1-vg1.json'
    with { type: 'json' };
// ... 7 more static imports

const MANIFESTS = {
    'tysk1-vg1': manifestTysk1Vg1,
    // ...
};
```

**After (new — fetch from CDN with fallback):**
```javascript
const VOCAB_CDN = 'https://papertek-vocabulary.web.app';

// Cache manifests after first fetch
const manifestCache = {};
const bankCache = {};

async function fetchJSON(path) {
    const url = `${VOCAB_CDN}/${path}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Failed to fetch ${url}: ${response.status}`);
    return response.json();
}

async function getManifest(curriculumId) {
    if (manifestCache[curriculumId]) return manifestCache[curriculumId];
    const manifest = await fetchJSON(`curricula/vocab-manifest-${curriculumId}.json`);
    manifestCache[curriculumId] = manifest;
    return manifest;
}

async function getBank(language, bankName) {
    const key = `${language}/${bankName}`;
    if (bankCache[key]) return bankCache[key];
    const bank = await fetchJSON(`core/${language}/${bankName}.json`);
    bankCache[key] = bank;
    return bank;
}
```

### 2.2 Update the Service Worker

Add vocabulary CDN to the Service Worker caching strategy in `sw.js`:

```javascript
// Add to cache-first strategy for vocabulary
const VOCAB_CDN_ORIGIN = 'https://papertek-vocabulary.web.app';

// In fetch handler:
if (event.request.url.startsWith(VOCAB_CDN_ORIGIN)) {
    // Cache-first for vocabulary data (rarely changes)
    event.respondWith(
        caches.match(event.request).then(cached => {
            if (cached) return cached;
            return fetch(event.request).then(response => {
                const clone = response.clone();
                caches.open('vocabulary-v1').then(cache => cache.put(event.request, clone));
                return response;
            });
        })
    );
}
```

**Version check on app load:**
```javascript
// On page load, check if vocabulary has been updated
async function checkVocabularyUpdate() {
    const remote = await fetch(`${VOCAB_CDN}/api/version.json`).then(r => r.json());
    const local = localStorage.getItem('vocab-version');
    if (local !== remote.version) {
        // Clear vocabulary cache and re-fetch
        const cache = await caches.open('vocabulary-v1');
        await cache.keys().then(keys => Promise.all(keys.map(k => cache.delete(k))));
        localStorage.setItem('vocab-version', remote.version);
    }
}
```

### 2.3 Keep Local Fallback During Transition

During the transition, keep the local vocabulary files as a fallback:

```javascript
async function getManifest(curriculumId) {
    try {
        // Try CDN first
        return await fetchJSON(`curricula/vocab-manifest-${curriculumId}.json`);
    } catch (e) {
        // Fallback to local import (remove after Phase 4)
        console.warn('CDN unavailable, using local vocabulary');
        const { default: manifest } = await import(
            `../../shared/vocabulary/curricula/vocab-manifest-${curriculumId}.json`,
            { with: { type: 'json' } }
        );
        return manifest;
    }
}
```

### 2.4 Verification Checklist

- [ ] Webapp loads vocabulary from CDN in production
- [ ] Service Worker caches vocabulary responses
- [ ] Offline mode still works (cached vocabulary served)
- [ ] Version check triggers cache refresh when vocabulary updates
- [ ] Local fallback works when CDN is down
- [ ] All 21 exercise types work with CDN-loaded vocabulary
- [ ] Vocabulary trainer (all modes) works: flashcards, write, match, gender, verb-test
- [ ] Performance: First vocabulary load < 2 seconds on 3G
- [ ] No CORS errors in browser console

---

## Phase 3 — Mobile Apps Consume Vocabulary API (Week 4–6)

> **Goal:** iOS and Android apps fetch vocabulary from CDN instead of bundling it.

### 3.1 Modify iOS `VocabularyService.swift`

**Before (current — loads from app bundle):**
```swift
private func loadJSONData(resourceName: String, subdirectory: String? = nil) -> Data? {
    guard let url = Bundle.main.url(forResource: resourceName, withExtension: "json",
                                     subdirectory: subdirectory) else { return nil }
    return try? Data(contentsOf: url)
}
```

**After (new — fetch from CDN, cache locally):**
```swift
private let vocabCDN = "https://papertek-vocabulary.web.app"
private let fileManager = FileManager.default
private var cacheDir: URL { fileManager.urls(for: .cachesDirectory, in: .userDomainMask)[0] }

/// Fetch vocabulary JSON from CDN, with local file cache fallback
private func loadVocabularyData(path: String) async -> Data? {
    let cachedFile = cacheDir.appendingPathComponent("vocabulary/\(path)")

    // 1. Try CDN
    if let url = URL(string: "\(vocabCDN)/\(path)") {
        do {
            let (data, _) = try await URLSession.shared.data(from: url)
            // Save to local cache
            try fileManager.createDirectory(at: cachedFile.deletingLastPathComponent(),
                                            withIntermediateDirectories: true)
            try data.write(to: cachedFile)
            return data
        } catch {
            print("CDN unavailable for \(path): \(error)")
        }
    }

    // 2. Fallback to local cache
    if let data = try? Data(contentsOf: cachedFile) { return data }

    // 3. Last resort: bundled copy (remove after validation period)
    return Bundle.main.url(forResource: path, withExtension: nil)
        .flatMap { try? Data(contentsOf: $0) }
}
```

### 3.2 Modify iOS `AudioService.swift`

Stream audio from CDN instead of bundling MP3s:

```swift
/// Stream word pronunciation from CDN
func playWordAudio(word: String, language: String = "de") {
    let audioURL = URL(string: "\(vocabCDN)/core/\(language)/audio/\(word).mp3")!
    // AVPlayer handles streaming + caching
    let player = AVPlayer(url: audioURL)
    player.play()
}
```

### 3.3 Modify Android `VocabularyService.kt`

**Before (current — loads from APK assets):**
```kotlin
context.assets.open(filename).bufferedReader().use { it.readText() }
```

**After (new — fetch from CDN, cache in app storage):**
```kotlin
private val vocabCDN = "https://papertek-vocabulary.web.app"

suspend fun loadVocabularyData(path: String): String? {
    val cacheFile = File(context.cacheDir, "vocabulary/$path")

    // 1. Try CDN
    try {
        val url = URL("$vocabCDN/$path")
        val data = withContext(Dispatchers.IO) { url.readText() }
        cacheFile.parentFile?.mkdirs()
        cacheFile.writeText(data)
        return data
    } catch (e: Exception) {
        Log.w("VocabService", "CDN unavailable for $path", e)
    }

    // 2. Fallback to local cache
    if (cacheFile.exists()) return cacheFile.readText()

    // 3. Last resort: bundled assets (remove after validation period)
    return try { context.assets.open(path).bufferedReader().use { it.readText() } }
           catch (e: Exception) { null }
}
```

### 3.4 Add Version Check on App Launch

Both iOS and Android should check for vocabulary updates on launch:

```swift
// iOS — AppDelegate or SceneDelegate
func checkVocabularyUpdate() async {
    guard let url = URL(string: "\(vocabCDN)/api/version.json"),
          let (data, _) = try? await URLSession.shared.data(from: url),
          let remote = try? JSONDecoder().decode(VocabVersion.self, from: data) else { return }

    let localVersion = UserDefaults.standard.string(forKey: "vocab-version") ?? "0.0.0"
    if remote.version != localVersion {
        // Clear vocabulary cache → next load will re-fetch from CDN
        try? FileManager.default.removeItem(at: cacheDir.appendingPathComponent("vocabulary"))
        UserDefaults.standard.set(remote.version, forKey: "vocab-version")
    }
}
```

### 3.5 Reduce App Binary Size

Once CDN loading is verified, remove bundled vocabulary from the app:
- **iOS:** Remove vocabulary JSON + audio from Xcode "Copy Bundle Resources" build phase
- **Android:** Remove vocabulary files from `assets/` directory

**Impact:**
- iOS app size: **-34MB** (vocabulary) per language
- Android APK size: **-34MB** per language
- Faster App Store review (smaller binary)
- Users download vocabulary on first launch (with progress indicator)

### 3.6 Verification Checklist

- [ ] iOS apps load vocabulary from CDN on first launch
- [ ] Android app loads vocabulary from CDN on first launch
- [ ] Offline mode works (cached vocabulary served)
- [ ] Audio streams from CDN (no bundled MP3s)
- [ ] Version check triggers cache refresh
- [ ] App binary size reduced by ~34MB
- [ ] First-launch vocabulary download shows progress indicator
- [ ] All vocabulary trainer modes work (flashcards, write, match, gender, verb-test)
- [ ] Firebase sync still works (Firestore paths unchanged)

---

## Phase 4 — Final Repo Separation (Week 6–8)

> **Goal:** The monorepo becomes three independent repos. The monorepo is archived.

### 4.1 Create `papertek-webapp` Repo

```bash
# Use git filter-repo to extract webapp history (preserving git log)
git clone Tysk-niv--1-versjon-1.3 papertek-webapp-temp
cd papertek-webapp-temp

# Keep only webapp-relevant paths
git filter-repo \
  --path public/ \
  --path tests/ \
  --path firebase.json \
  --path .firebaserc \
  --path firestore.rules \
  --path firestore.indexes.json \
  --path package.json \
  --path package-lock.json \
  --path eslint.config.js \
  --path prettier.config.js \
  --path vitest.config.js \
  --path playwright.config.js \
  --path sw.js

# Push to new repo
git remote add origin git@github.com:Papertek-forlag-AS/papertek-webapp.git
git push -u origin main
```

### 4.2 Create `papertek-apps` Repo

```bash
git clone Tysk-niv--1-versjon-1.3 papertek-apps-temp
cd papertek-apps-temp

git filter-repo \
  --path apps/ \
  --path shared/ios-core/

# Restructure: move apps/ contents to root
# ios/german-trainer, ios/wir-sprechen, android/, shared-ios-core/

git remote add origin git@github.com:Papertek-forlag-AS/papertek-apps.git
git push -u origin main
```

### 4.3 Remove Local Vocabulary Fallbacks

Once all platforms are verified working with CDN:
1. **Webapp:** Remove the local import fallback in `vocabulary-loader.js`
2. **iOS:** Remove bundled JSON/audio from Xcode project
3. **Android:** Remove `assets/vocabulary/` from APK
4. **Webapp:** Remove `public/shared/vocabulary/` symlink/directory

### 4.4 Archive the Monorepo

```bash
# Rename the monorepo (don't delete)
# GitHub: Settings → Repository name → "Tysk-niv--1-versjon-1.3-ARCHIVED"
# GitHub: Settings → Archive this repository
```

### 4.5 Update CI/CD

Each repo gets its own GitHub Actions:

**papertek-vocabulary:**
- Validate JSON schemas on PR
- Auto-deploy to Firebase Hosting on merge to `main`
- Auto-increment version in `version.json`

**papertek-webapp:**
- Run ESLint + Prettier on PR
- Run Vitest unit tests on PR
- Run Playwright E2E tests on staging
- Deploy to Firebase Hosting on merge to `main`

**papertek-apps:**
- Build iOS (Xcode Cloud or GitHub Actions with macOS runner)
- Build Android (Gradle)
- Run unit tests
- Deploy to TestFlight / Play Console on tag

### 4.6 Final Verification

- [ ] Vocabulary repo deploys independently
- [ ] Webapp repo deploys independently
- [ ] Apps repo builds and submits independently
- [ ] A vocabulary update (fix a typo) propagates to all platforms within 1 hour
- [ ] Monorepo archived and read-only
- [ ] All three repos mirrored to secondary provider
- [ ] CI/CD pipelines running on all three repos

---

## 5. Vocabulary API Specification

### Option A: Static CDN (Recommended to Start)

All vocabulary is served as static JSON files via Firebase Hosting.

**Base URL:** `https://papertek-vocabulary.web.app` (or custom domain)

| Endpoint | Description | Cache |
|----------|-------------|-------|
| `GET /api/version.json` | Version manifest | 5 min |
| `GET /core/{lang}/nounbank.json` | Noun vocabulary | 1 hour |
| `GET /core/{lang}/verbbank.json` | Verb vocabulary | 1 hour |
| `GET /core/{lang}/adjectivebank.json` | Adjective vocabulary | 1 hour |
| `GET /core/{lang}/generalbank.json` | General vocabulary | 1 hour |
| `GET /core/{lang}/numbersbank.json` | Numbers | 1 hour |
| `GET /core/{lang}/phrasesbank.json` | Phrases | 1 hour |
| `GET /core/{lang}/pronounsbank.json` | Pronouns | 1 hour |
| `GET /core/{lang}/articlesbank.json` | Articles | 1 hour |
| `GET /core/{lang}/audio/{word}.mp3` | Word pronunciation | 7 days |
| `GET /translations/{pair}/nounbank.json` | Translation pack | 1 hour |
| `GET /curricula/vocab-manifest-{id}.json` | Curriculum manifest | 1 hour |

**Languages (`{lang}`):** `de`, `es`, `fr`
**Translation pairs (`{pair}`):** `de-nb`, `de-en`, `es-nb`, `es-en`
**Curriculum IDs:** `tysk1-vg1`, `tysk1-vg2`, `tysk2-vg1`, `tysk2-vg2`, `us-8`, `us-9`, `us-10`, `spansk1-vg1`

### Option B: Cloud Functions API (Future Enhancement)

If you later need dynamic filtering, analytics, or A/B testing:

```
GET /api/v2/vocabulary?curriculum=tysk1-vg1&chapter=1&lang=de&native=nb
GET /api/v2/vocabulary/search?q=Hund&lang=de
GET /api/v2/stats/popular-curricula
```

This can be added later as a Cloud Function in front of the same static data.
**Start with Option A. Migrate to B only if needed.**

---

## 6. Risk Analysis & Rollback

### Risks and Mitigations

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| CDN downtime | Apps can't load new vocabulary | Low | Service Worker cache (webapp), local file cache (apps), bundled fallback during transition |
| CORS issues | Webapp can't fetch vocabulary | Medium | Set `Access-Control-Allow-Origin: *` in Firebase Hosting headers |
| Version mismatch | App expects schema v2, CDN serves v1 | Low | Semantic versioning + backward-compatible changes only |
| Cache staleness | Users see old vocabulary | Low | Version check on every app launch/page load |
| Git history loss | Lose commit history for some files | Low | Use `git filter-repo` which preserves relevant history |
| Firebase Hosting limits | CDN bandwidth exceeded | Very Low | Firebase free tier: 10GB/month; Blaze plan: $0.15/GB after that |

### Rollback Procedures

**Phase 1 rollback:** Delete the vocabulary repo. Monorepo is unchanged.

**Phase 2 rollback:** Revert `vocabulary-loader.js` to use static imports.
One commit revert, deploy webapp. Takes 5 minutes.

**Phase 3 rollback:** Re-add bundled vocabulary to app build.
Requires new app submission (1–3 days for App Store review).

**Phase 4 rollback:** Unarchive monorepo. All code still exists.

### No-Go Criteria

Do NOT proceed to the next phase if:
- CDN uptime is below 99.9% during the validation period
- Any platform fails to load vocabulary from CDN in testing
- Offline functionality is broken
- Performance regression > 500ms on vocabulary load

---

## 7. Decision Log

| Decision | Chosen | Alternatives Considered | Rationale |
|----------|--------|------------------------|-----------|
| 3 repos (not 4) | Keep iOS + Android together | Separate iOS and Android repos | iOS and Android share Firebase sync logic, same release cycle, and are maintained by same team |
| Static CDN first | Firebase Hosting as static CDN | Cloud Functions API, Supabase, custom Node server | Zero server maintenance, zero cost on free tier, no cold starts, simple deployment |
| Firebase Hosting | Same Firebase project | Cloudflare R2, AWS S3 + CloudFront, Vercel | Already using Firebase, single billing, same auth domain, no new vendor |
| Git LFS for audio | Store audio in Git LFS or Firebase Storage | Commit audio directly to git | Audio files (51MB) don't diff well. LFS or external storage prevents repo bloat |
| Keep monorepo as archive | Archive, don't delete | Delete immediately | Safety net. Zero cost to keep archived repo on GitHub |
| Incremental migration | 4 phases over 8 weeks | Big-bang migration | Each phase is independently reversible. Validates assumptions before committing |

---

## Timeline Summary

```
Week 1          Week 2-3        Week 3-4        Week 4-6        Week 6-8
┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐
│ Phase 0  │   │ Phase 1  │   │ Phase 2  │   │ Phase 3  │   │ Phase 4  │
│          │   │          │   │          │   │          │   │          │
│ Mirror   │   │ Vocab    │   │ Webapp   │   │ Mobile   │   │ Final    │
│ repos    │──▶│ repo +   │──▶│ fetches  │──▶│ apps     │──▶│ split +  │
│ Backup   │   │ CDN      │   │ from CDN │   │ fetch    │   │ archive  │
│ Document │   │ deploy   │   │ + SW     │   │ from CDN │   │ monorepo │
│ Validate │   │          │   │ cache    │   │ + cache  │   │          │
└──────────┘   └──────────┘   └──────────┘   └──────────┘   └──────────┘
  LOW RISK       LOW RISK      MED RISK       MED RISK       LOW RISK
  Reversible     Reversible    Reversible     Reversible     Reversible
```

**Each phase is independently deployable and reversible.**
Proceed to the next phase only after the current phase passes its verification checklist.
