---
phase: 21-translation-consolidation
plan: 01
subsystem: data
tags: [translations, merge, vocabulary, de-nb, de-en, search-index]

# Dependency graph
requires:
  - phase: 20-bank-manifest-consolidation
    provides: merged vocabulary banks in vocabulary/banks/de/ used by build-search-index.js

provides:
  - Merged Norwegian translation files (de-nb/): nounbank 1641, verbbank 679, generalbank 673
  - Merged English translation files (de-en/): nounbank 1641, verbbank 679, generalbank 674
  - scripts/merge-translations.js (ESM migration script for translation consolidation)
  - Simplified build-search-index.js (single translation dir per language pair, no -dict/ fallback)
  - Simplified v2 lookup API handler (no -dict/ fallback code)
  - Updated manifest.json files in de-nb/ and de-en/ with accurate post-merge counts

affects:
  - 21-02 (plan 02 will delete the now-redundant -dict/ directories)
  - 22-api-migration (v2 lookup handler now reads from merged translation dirs)
  - 23-validation (search index built from merged translations)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Single translation directory per language pair (no -dict/ fallback)"
    - "Translation merge: simple union of core + dict (disjoint sets, zero overlaps)"

key-files:
  created:
    - scripts/merge-translations.js
  modified:
    - vocabulary/translations/de-nb/nounbank.json
    - vocabulary/translations/de-nb/verbbank.json
    - vocabulary/translations/de-nb/generalbank.json
    - vocabulary/translations/de-nb/manifest.json
    - vocabulary/translations/de-en/nounbank.json
    - vocabulary/translations/de-en/verbbank.json
    - vocabulary/translations/de-en/generalbank.json
    - vocabulary/translations/de-en/manifest.json
    - scripts/build-search-index.js
    - api/vocab/v2/lookup/[language]/[wordId].js
    - package.json

key-decisions:
  - "Zero overlaps confirmed between core and -dict/ translation sets — simple union merge"
  - "Core version wins on any overlap (defensive — unreachable in practice)"
  - "merge-translations.js intentionally retains -dict/ path references (it is the migration tool that reads those dirs)"
  - "build-search-index.js renamed currNb/currEn to nb/en (no more 'curr vs dict' distinction)"
  - "validate:nouns:dict and validate:verbs:dict scripts removed from package.json (referenced non-existent dict bank structure)"
  - "Gap report shows 0 missing translations in all 6 merged bank/language-pair combinations"

patterns-established:
  - "Translation consolidation: after merge, single dir per pair is the canonical source"
  - "build-search-index.js getTranslation() simplified to single-map lookup (no fallback)"

requirements-completed: [TRANS-01, TRANS-02]

# Metrics
duration: 15min
completed: 2026-02-23
---

# Phase 21 Plan 01: Translation Consolidation Summary

**Merged de-nb-dict/ and de-en-dict/ translations into core de-nb/ and de-en/ directories, eliminating the dual-directory pattern for all 3 affected banks (nounbank 1641, verbbank 679, generalbank 673/674 entries)**

## Performance

- **Duration:** ~15 min
- **Started:** 2026-02-23T~12:00Z
- **Completed:** 2026-02-23
- **Tasks:** 2
- **Files modified:** 11

## Accomplishments

- Created scripts/merge-translations.js — ESM migration script (patterned after merge-banks.js) that merges -dict/ translations into core dirs, sorts by key, updates manifests, reports gaps
- Merged all 6 affected translation files (3 banks x 2 language pairs): zero overlaps, exact union, ASCII-sorted keys
- Removed all -dict/ references from active codebase: build-search-index.js simplified to single-map translation lookup; v2 lookup handler's -dict/ fallback block removed
- Search index rebuilt identically post-simplification: 3454 entries, 144 verbs with pp

## Task Commits

Each task was committed atomically:

1. **Task 1: Create translation merge script and merge all translations** - `79d0e42` (feat)
2. **Task 2: Update all codebase references from -dict/ to single translation directories** - `27b3d81` (feat)

**Plan metadata:** (pending final commit)

## Files Created/Modified

- `scripts/merge-translations.js` - ESM script merging core + dict translations into single dirs; adds merge:translations npm script
- `vocabulary/translations/de-nb/nounbank.json` - Merged: 331 core + 1310 dict = 1641 entries
- `vocabulary/translations/de-nb/verbbank.json` - Merged: 148 core + 531 dict = 679 entries
- `vocabulary/translations/de-nb/generalbank.json` - Merged: 186 core + 487 dict = 673 entries
- `vocabulary/translations/de-nb/manifest.json` - Updated: totalWords=3454
- `vocabulary/translations/de-en/nounbank.json` - Merged: 331 core + 1310 dict = 1641 entries
- `vocabulary/translations/de-en/verbbank.json` - Merged: 148 core + 531 dict = 679 entries
- `vocabulary/translations/de-en/generalbank.json` - Merged: 187 core + 487 dict = 674 entries
- `vocabulary/translations/de-en/manifest.json` - Updated: totalWords=3455
- `scripts/build-search-index.js` - Removed dictNb/dictEn; simplified getTranslation() to single map; renamed currNb/currEn to nb/en; updated header comment
- `api/vocab/v2/lookup/[language]/[wordId].js` - Removed dictTranslationBankPath and -dict/ fallback block
- `package.json` - Removed validate:nouns:dict, validate:verbs:dict; cleaned up validate:all; added merge:translations script

## Decisions Made

- **Zero overlaps = simple union:** Confirmed all 6 bank/pair combos have 0 overlapping keys. Merge is pure union with core winning defensively.
- **merge-translations.js retains -dict/ references:** This is the migration tool; it reads from those dirs intentionally. Not a violation of "no active -dict/ references."
- **Renamed currNb/currEn to nb/en:** With the dual-directory pattern gone, the "curr" vs "dict" distinction is meaningless. Cleaner names reflect the new single-source reality.
- **validate:nouns:dict and validate:verbs:dict removed:** These scripts pointed to vocabulary/dictionary/de/ which is being deleted in Plan 02. Removing them now prevents confusion.
- **Gap report shows 0 missing translations:** All entries in the merged nounbank/verbbank/generalbank have corresponding translations — complete coverage.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Translation directories de-nb/ and de-en/ are now the single authoritative source for all translations
- de-nb-dict/ and de-en-dict/ directories still exist (will be deleted in Plan 02)
- build-search-index.js and v2 lookup API are already reading from merged dirs — no breakage expected when -dict/ dirs are deleted
- Ready for Plan 02: delete redundant -dict/ directories

---
*Phase: 21-translation-consolidation*
*Completed: 2026-02-23*

## Self-Check: PASSED

- scripts/merge-translations.js: FOUND
- vocabulary/translations/de-nb/nounbank.json: FOUND (1641 entries)
- vocabulary/translations/de-en/nounbank.json: FOUND (1641 entries)
- .planning/phases/21-translation-consolidation/21-01-SUMMARY.md: FOUND
- commit 79d0e42 (Task 1): FOUND
- commit 27b3d81 (Task 2): FOUND
- No -dict/ references in build-search-index.js or api/: VERIFIED
- Search index rebuild: 3454 entries, 144 verbs with pp (UNCHANGED)
