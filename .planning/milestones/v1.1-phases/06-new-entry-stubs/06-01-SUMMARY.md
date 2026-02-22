---
phase: 06-new-entry-stubs
plan: 01
subsystem: database
tags: [json, vocabulary, adjectives, frequency, de_50k, manifest]

# Dependency graph
requires:
  - phase: 04-goethe-adjective-extraction
    provides: "04-candidates.json with 259 pre-validated adjective candidates (word, _id, cefr, source)"
  - phase: 05-schema-extension
    provides: "adjective.schema.json accepting empty comparison: {} and declension: {} as valid"
provides:
  - "365-entry adjectivebank.json in core bank (106 existing + 259 new stubs)"
  - "365-entry adjectivebank.json in dictionary bank with curriculum/cefr/frequency metadata"
  - "Updated core manifest (totalWords: 1127, adjectivebank.json: 365)"
  - "Updated dictionary manifest (totalWords: 1126 in _metadata; 3454 top-level)"
  - "Stub entries ready for Phase 7 (comparison), Phase 8 (declension), Phase 9 (translations)"
affects:
  - phase-07-comparison
  - phase-08-declension
  - phase-09-translations
  - phase-10-search-index

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Frequency lookup: 1-based line number in de_50k.txt = frequency rank stored in bank"
    - "Sort by _id key (ASCII) not word value — deterministic across locales"
    - "_metadata first, then sorted entries when writing bank JSON files"
    - "Safety check: assert zero overlap between candidate _ids and existing bank before merge"

key-files:
  created:
    - ".planning/phases/06-new-entry-stubs/generate-stubs.js"
  modified:
    - "vocabulary/core/de/adjectivebank.json"
    - "vocabulary/dictionary/de/adjectivebank.json"
    - "vocabulary/core/de/manifest.json"
    - "vocabulary/dictionary/de/manifest.json"

key-decisions:
  - "Sort by _id key (ASCII-only, umlauts transliterated) not word value — deterministic, locale-independent"
  - "_metadata placed first in output object using destructure-and-prepend pattern"
  - "Frequency-0 used for 11 words missing from de_50k.txt corpus (alternativ, auslaendisch, berufstaetig, eckig, einheitlich, haltbar, interkulturell, pauschal, staedtisch, stilistisch, virtuell)"
  - "Top-level dict manifest totalWords (3195→3454) and dictionaryOnlyWords (2328→2587) updated separately from _metadata fields — they track different scopes"

patterns-established:
  - "Stub shape (core): { word, _id, audio: adjektiv_[stem].mp3, comparison: {}, declension: {} }"
  - "Stub shape (dict): { word, _id, audio, curriculum: false, cefr, frequency, comparison: {}, declension: {} }"
  - "Never derive _id from scratch — use pre-validated values from candidates file"
  - "Count actual entries from JSON file (not manifest) when computing new manifest totals"

requirements-completed: [BANK-02, BANK-03]

# Metrics
duration: 8min
completed: 2026-02-21
---

# Phase 6 Plan 01: New Entry Stubs Summary

**259 adjective stubs generated, merged, and sorted into both core and dictionary banks (365 total entries), with frequency ranks from de_50k.txt and updated manifests**

## Performance

- **Duration:** 8 min
- **Started:** 2026-02-21T11:22:00Z
- **Completed:** 2026-02-21T11:32:25Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments

- Generated 259 stub entries and merged with 106 existing entries in core bank (365 total)
- Generated 259 stub entries and merged with 106 existing entries in dictionary bank (365 total, with cefr/frequency/curriculum metadata)
- Both banks re-sorted alphabetically by `_id` key with `_metadata` at top
- Updated both manifests with correct counts; corrected stale core manifest (was 108, now 365)
- Schema validation passes on all 365 entries; existing entries unmodified; no deferred fields leaked in

## Task Commits

Each task was committed atomically:

1. **Task 1: Generate stubs, merge into both banks, sort, and update manifests** - `bac6234` (feat)
2. **Task 2: Schema validation and data integrity** - No additional commit (verification only, no file changes)

## Files Created/Modified

- `.planning/phases/06-new-entry-stubs/generate-stubs.js` - One-shot Node.js stub generation script
- `vocabulary/core/de/adjectivebank.json` - Extended from 106 to 365 entries, sorted by _id
- `vocabulary/dictionary/de/adjectivebank.json` - Extended from 106 to 365 entries, sorted by _id
- `vocabulary/core/de/manifest.json` - adjectivebank.json: 108→365, totalWords: 870→1127
- `vocabulary/dictionary/de/manifest.json` - adjectivebank.json: 106→365, dictionaryOnlyWords (_metadata): 0→259, top-level: 2328→2587, totalWords: 3195→3454

## Decisions Made

- Dict manifest has two `totalWords` fields with different scopes: `_metadata.totalWords` (sum of files section = curriculum bank words = 1126) and top-level `totalWords` (all dictionary entries including non-curriculum = 3454). Updated both independently.
- Core manifest stale count (108) corrected to actual (365) by counting file entries, not trusting manifest.
- Frequency-0 used for 11 corpus-missing words per user decision; `??` nullish coalescing ensures 0 not null.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed dict manifest top-level totalWords and dictionaryOnlyWords**
- **Found during:** Task 1 post-commit verification
- **Issue:** Script wrote `totalWords: 1126` and `dictionaryOnlyWords: 259` to both `_metadata` fields AND top-level fields. The top-level fields have a different scope (3195 total dictionary entries, 2328 existing dict-only words) and needed separate calculations.
- **Fix:** Updated dict manifest top-level `totalWords` to 3454 (3195 + 259) and `dictionaryOnlyWords` to 2587 (2328 + 259)
- **Files modified:** `vocabulary/dictionary/de/manifest.json`
- **Verification:** All 17 verification checks passed in Task 2
- **Committed in:** `bac6234` (included in Task 1 commit before task commit was finalized)

---

**Total deviations:** 1 auto-fixed (Rule 1 bug)
**Impact on plan:** Fix required for manifest accuracy. No scope creep.

## Issues Encountered

None — plan executed smoothly. All verification criteria met on first run of the generation script.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- 365 adjective stub entries ready for Phase 7 (comparison data population)
- Both banks have `comparison: {}` and `declension: {}` placeholders awaiting Phase 7 and 8 data
- Schema validated — all stubs conform to adjective.schema.json
- Existing 106 entries unmodified and intact
- Search index rebuild is deferred to Phase 10 (INTG-02)

---
*Phase: 06-new-entry-stubs*
*Completed: 2026-02-21*
