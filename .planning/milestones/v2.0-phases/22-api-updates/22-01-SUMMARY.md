---
phase: 22-api-updates
plan: 01
subsystem: api
tags: [api, migration, banks, vocabulary-path]
dependency_graph:
  requires: [21-02]
  provides: [API-01, API-02, API-03, API-04, API-05]
  affects: [vercel-api, leksihjelp-consumer]
tech_stack:
  added: []
  patterns: [manifest-curriculum-filtering, banks-path-migration]
key_files:
  created: []
  modified:
    - api/vocab/v1/core/[language].js
    - api/vocab/v1/manifest.js
    - api/vocab/v2/search/[language].js
    - api/vocab/v2/lookup/[language]/[wordId].js
decisions:
  - "Audio URL updated to /shared/vocabulary/banks/{lang}/audio to match post-cleanup file location"
  - "v1 core curriculum filtering uses Set-based lookup from manifest.banks[bank].ids for O(1) per-entry checks"
  - "search-index.json excluded from combined all-banks response in v1 core handler (not a bank file)"
  - "v1 manifest totalWords now reports curriculumWords from summary (v1 is curriculum-only endpoint)"
metrics:
  duration_minutes: 4
  completed_date: 2026-02-24
  tasks_completed: 2
  tasks_total: 2
  files_modified: 4
---

# Phase 22 Plan 01: API Handler Migration to vocabulary/banks/ Summary

All 4 API handlers migrated from old vocabulary/core/ and vocabulary/dictionary/ paths to the consolidated vocabulary/banks/ structure with manifest-based curriculum filtering.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Migrate v1 core and manifest handlers to banks/de/ | c04f8f6 | api/vocab/v1/core/[language].js, api/vocab/v1/manifest.js |
| 2 | Migrate v2 search and lookup handlers to banks/de/ | 8438c0e | api/vocab/v2/search/[language].js, api/vocab/v2/lookup/[language]/[wordId].js |

## What Was Built

**v1 core handler** (`api/vocab/v1/core/[language].js`):
- Changed data source from `vocabulary/core/{lang}` to `vocabulary/banks/{lang}`
- Added manifest-based curriculum filtering: loads `manifest.json`, builds `Set` of curriculum IDs per bank from `manifest.banks[bankName].ids`
- Single bank requests (`?bank=verbbank`): filters response to curriculum entries only
- All-banks requests: filters each bank to curriculum entries before merging
- Debug mode updated to show `banksContents` instead of `coreContents`
- `search-index.json` explicitly excluded from combined response iteration

**v1 manifest handler** (`api/vocab/v1/manifest.js`):
- Changed `corePath` to `banksPath` pointing at `vocabulary/banks/`
- New manifest structure adapter: reads `manifest.banks` keys for file list, `manifest.summary.curriculumWords` for totalWords (v1 is curriculum-only), `manifest._metadata.generatedAt` for version/updatedAt
- Language names derived from `LANGUAGE_NAMES` map (`de` -> "German") since new manifest lacks `targetLanguageName`
- Dictionary section rebuilt: reads from `vocabulary/banks/{lang}/manifest.json`, uses `summary.totalWords`, `summary.curriculumWords`, `summary.dictionaryOnlyWords`
- Audio baseUrl updated to `/shared/vocabulary/banks/{lang}/audio`

**v2 search handler** (`api/vocab/v2/search/[language].js`):
- `loadSearchIndex()` path changed from `vocabulary/dictionary/{lang}/search-index.json` to `vocabulary/banks/{lang}/search-index.json`
- All search logic, scoring, and response shape unchanged

**v2 lookup handler** (`api/vocab/v2/lookup/[language]/[wordId].js`):
- Direct bank lookup path changed from `vocabulary/dictionary/{lang}/` to `vocabulary/banks/{lang}/`
- `findWordInAllBanks()` variable renamed from `dictPath` to `banksPath`, path updated to `vocabulary/banks/{lang}`
- Audio URL updated from `/shared/vocabulary/core/{lang}/audio/{file}` to `/shared/vocabulary/banks/{lang}/audio/{file}`
- Translation lookup still reads from `vocabulary/translations/{pair}/` (correct, unchanged from Phase 21)

## Verification Results

- All 4 files: 0 references to `vocabulary/core/` or `vocabulary/dictionary/` in data-reading paths
- All 4 files: pass ESM syntax check via `node -e "import(...)"`
- `vocabulary/banks` path confirmed in 6 locations across 4 handlers
- Manifest curriculum filtering logic confirmed: Set-based per-bank ID lookup

## Decisions Made

1. **Audio URL updated proactively** — both manifest and lookup handlers updated to `/shared/vocabulary/banks/{lang}/audio` to match file location after Plan 22-02 deletes `vocabulary/core/de/`. This avoids a two-step deploy.

2. **v1 core uses Set-based curriculum filtering** — `new Set(bankInfo.ids)` built once per bank at request time. Efficient for the filtering loop over merged bank entries.

3. **search-index.json excluded from v1 combined response** — added explicit `continue` guard in the files loop to skip `search-index.json` since it is not a bank data file.

4. **v1 manifest totalWords = curriculumWords** — since v1 core returns curriculum-only entries, the manifest's `totalWords` field now reports `manifest.summary.curriculumWords` (867) rather than the total bank count (3454). This accurately represents what the v1 endpoint serves.

## Deviations from Plan

None — plan executed exactly as written.

## Self-Check: PASSED

Files created/modified:
- FOUND: api/vocab/v1/core/[language].js
- FOUND: api/vocab/v1/manifest.js
- FOUND: api/vocab/v2/search/[language].js
- FOUND: api/vocab/v2/lookup/[language]/[wordId].js

Commits:
- FOUND: c04f8f6 (feat(22-01): migrate v1 core and manifest handlers)
- FOUND: 8438c0e (feat(22-01): migrate v2 search and lookup handlers)
