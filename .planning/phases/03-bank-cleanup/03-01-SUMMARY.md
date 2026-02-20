---
phase: 03-bank-cleanup
plan: 01
subsystem: database
tags: [vocabulary, json, schema, ajv, validation, adjective-bank, german]

# Dependency graph
requires: []
provides:
  - Clean adjective bank with 106 valid entries (removed beste_adj, reclassified Lieblings-)
  - Translations-optional adjective schema (required: [])
  - lieblings-_expr in generalbank (core, dictionary, translations nb+en, search index)
  - ajv-based validation script at scripts/validate-adjectives.js
  - Consistent manifest counts: adjectivebank 106, generalbank 186
affects: [04-goethe-extraction, 05-adjective-schema, 06-adjective-stubs, 07-comparison, 08-declension, 09-translations, 10-integration]

# Tech tracking
tech-stack:
  added: [ajv@8.x, ajv-formats@3.x]
  patterns: [Bank cleanup cascades across core/dictionary/translations/search-index/curricula/manifest — all files stay in sync]

key-files:
  created:
    - scripts/validate-adjectives.js
  modified:
    - vocabulary/schema/adjective.schema.json
    - vocabulary/core/de/adjectivebank.json
    - vocabulary/dictionary/de/adjectivebank.json
    - vocabulary/translations/de-nb/adjectivebank.json
    - vocabulary/translations/de-en/adjectivebank.json
    - vocabulary/core/de/generalbank.json
    - vocabulary/dictionary/de/generalbank.json
    - vocabulary/translations/de-nb/generalbank.json
    - vocabulary/translations/de-en/generalbank.json
    - vocabulary/dictionary/de/search-index.json
    - vocabulary/dictionary/de/search-index.pretty.json
    - vocabulary/dictionary/de/manifest.json
    - vocabulary/curricula/vocab-manifest-tysk1-vg1.json
    - vocabulary/curricula/vocab-manifest-us-9.json

key-decisions:
  - "Adjective schema translations changed to optional (required: []) — translations live in separate translation files by design"
  - "beste_adj removed entirely — superlative of gut, correct place is comparison block on gut in Phase 7"
  - "Lieblings- reclassified to generalbank as type expr (lieblings-_expr) — it is a prefix, not an adjective"
  - "Bank cleanup cascades to all 7 file layers: core/dictionary/translations-nb/translations-en/search-index-pretty/search-index-min/manifest"

patterns-established:
  - "Entry removal cascades: core bank, dictionary bank, 2 translation files, both search index files, curricula manifests, manifest counts"
  - "Entry reclassification: remove from source bank (all layers), add to target bank (all layers), update search index id and b field"
  - "Search index totalEntries tracks actual entry count — update whenever entries are added/removed"

requirements-completed: [CLEAN-01, CLEAN-02, CLEAN-03]

# Metrics
duration: 5min
completed: 2026-02-20
---

# Phase 3 Plan 01: Bank Cleanup Summary

**Adjective bank cleaned from 108 to 106 entries: beste_adj removed, Lieblings- reclassified to generalbank as expr type, schema translations made optional, ajv validation confirms zero errors**

## Performance

- **Duration:** 5 min
- **Started:** 2026-02-20T13:23:15Z
- **Completed:** 2026-02-20T13:28:31Z
- **Tasks:** 3
- **Files modified:** 14

## Accomplishments

- Removed beste_adj (superlative of "gut") from all 8 file layers — zero orphaned references
- Reclassified Lieblings- from adjectivebank (lieblings-_adj) to generalbank (lieblings-_expr, type: expr) across all 6 relevant files
- Made adjective schema translations optional (required: [] instead of required: ["translations"]) — eliminates schema validation errors for entries without inline translations
- Updated search index totalEntries from 3196 to 3195 and manifest counts to reflect final state: adjectivebank 106, generalbank 186
- Created scripts/validate-adjectives.js using ajv 2020-12 — confirms all 106 entries pass validation
- Semantic checks confirm zero _id mismatches, zero duplicate words, all type fields correct

## Task Commits

Each task was committed atomically:

1. **Task 1: Fix schema and remove beste_adj from all files** - `5f2da5f` (fix)
2. **Task 2: Reclassify Lieblings- from adjective bank to general bank** - `50eaaa4` (fix)
3. **Task 3: Run full validation and confirm clean state** - `1f15080` (feat)

## Files Created/Modified

- `scripts/validate-adjectives.js` - ajv-based schema validation script for adjective bank
- `vocabulary/schema/adjective.schema.json` - Changed required: ["translations"] to required: []
- `vocabulary/core/de/adjectivebank.json` - Removed beste_adj and lieblings-_adj (106 entries remain)
- `vocabulary/dictionary/de/adjectivebank.json` - Same removals
- `vocabulary/translations/de-nb/adjectivebank.json` - Same removals
- `vocabulary/translations/de-en/adjectivebank.json` - Same removals
- `vocabulary/core/de/generalbank.json` - Added lieblings-_expr (186 entries)
- `vocabulary/dictionary/de/generalbank.json` - Added lieblings-_expr with curriculum/cefr/frequency fields
- `vocabulary/translations/de-nb/generalbank.json` - Added lieblings-_expr with Norwegian translation and explanation
- `vocabulary/translations/de-en/generalbank.json` - Added lieblings-_expr with English translation
- `vocabulary/dictionary/de/search-index.pretty.json` - Removed beste_adj and lieblings-_adj entries; added lieblings-_expr; totalEntries 3196->3195
- `vocabulary/dictionary/de/search-index.json` - Same changes (minified)
- `vocabulary/dictionary/de/manifest.json` - adjectivebank 108->106, generalbank 185->186, totalWords/curriculumWords 868->867, top-level totalWords 3196->3195
- `vocabulary/curricula/vocab-manifest-tysk1-vg1.json` - Removed beste_adj from lesson 9.1
- `vocabulary/curricula/vocab-manifest-us-9.json` - Removed beste_adj from lesson 1.1

## Decisions Made

- Translations made optional in adjective schema: the adjective bank stores structural adjective data; translations live in separate translation files. This is the design established in Phase 1 and mirrored in other bank schemas.
- Lieblings- classified as `expr` (expression) in generalbank: it is a word-forming prefix, not an adjective. `expr` is the most neutral type that fits non-standard grammatical categories in the existing type enum.
- beste_adj removed without reclassification: as a superlative form, its data will be captured in the `comparison` block of the `gut_adj` entry during Phase 7 (comparison forms).

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None — all file edits applied cleanly, all JSON remained valid throughout.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Adjective bank is clean and validated: 106 entries, zero schema errors, no misclassified entries
- Phase 4 (Goethe Extraction) can proceed against this clean baseline
- The validation script at `scripts/validate-adjectives.js` can be reused after Phase 6 (stubs) to confirm new entries also pass

## Self-Check: PASSED

All files verified:
- FOUND: scripts/validate-adjectives.js
- FOUND: vocabulary/schema/adjective.schema.json
- FOUND: vocabulary/core/de/adjectivebank.json
- FOUND: vocabulary/dictionary/de/manifest.json
- FOUND: .planning/phases/03-bank-cleanup/03-01-SUMMARY.md

All commits verified:
- 5f2da5f: fix(03-bank-cleanup): make translations optional in schema and remove beste_adj from all banks
- 50eaaa4: fix(03-bank-cleanup): reclassify Lieblings- to generalbank and update manifest
- 1f15080: feat(03-bank-cleanup): add adjective validation script and confirm clean bank

---
*Phase: 03-bank-cleanup*
*Completed: 2026-02-20*
