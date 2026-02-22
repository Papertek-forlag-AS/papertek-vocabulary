---
phase: 14-noun-declension-data
plan: "01"
subsystem: database
tags: [ajv, json-schema, validation, noun-declension, german]

# Dependency graph
requires:
  - phase: 11-schema-extensions
    provides: caseEntry.forms.singular/plural structure already in noun.schema.json
  - phase: 12-verbbank-data
    provides: weak_masculine flag on 11 n-Deklination nouns
provides:
  - noun.schema.json with declension_type property (strong/weak/mixed/plural-only/uncountable enum)
  - scripts/validate-nouns.js AJV validation script for nounbank
  - validate:nouns npm script entry in package.json
  - Pre-existing error baseline documented: 356 errors
affects:
  - 14-02 (data injection plan — uses validate:nouns to confirm zero new errors post-injection)
  - 15-sync-integration (dict nounbank sync relies on declension_type classification)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - AJV 2020 validation script pattern (follows validate-adjectives.js exactly)
    - npm run validate:nouns as the canonical noun validation command

key-files:
  created:
    - scripts/validate-nouns.js
  modified:
    - vocabulary/schema/noun.schema.json
    - package.json

key-decisions:
  - "declension_type is optional (not in required array) — entries without it remain valid until Plan 02 injects data"
  - "Pre-existing baseline of 356 AJV errors documented; Phase 14 Plan 01 does not introduce new errors"
  - "validate:nouns script inserted after validate:audio, before validate:all in package.json"

patterns-established:
  - "Pattern: AJV validation scripts follow validate-adjectives.js structure (Ajv2020, strict: false, allErrors: true)"

requirements-completed: [NDECL-01, NDECL-02, NDECL-03, NDECL-04, NDECL-05, NDECL-06, NDECL-07]

# Metrics
duration: 1min
completed: 2026-02-22
---

# Phase 14 Plan 01: Noun Schema Foundation Summary

**declension_type enum added to noun.schema.json and validate:nouns AJV script created, establishing the 356-error baseline for Plan 02 data injection**

## Performance

- **Duration:** ~1 min
- **Started:** 2026-02-22T11:38:27Z
- **Completed:** 2026-02-22T11:39:12Z
- **Tasks:** 1
- **Files modified:** 3

## Accomplishments
- Added `declension_type` property to `nounEntry` in noun.schema.json with 5-value enum (strong, weak, mixed, plural-only, uncountable)
- Created `scripts/validate-nouns.js` following the established validate-adjectives.js pattern using AJV 2020
- Added `validate:nouns` npm script to package.json (after validate:audio, before validate:all)
- Confirmed pre-existing AJV baseline: 356 errors (data quality debt, not introduced by this change)

## Task Commits

Each task was committed atomically:

1. **Task 1: Add declension_type to noun schema and create validate:nouns tooling** - `a9c9d4f` (feat)

**Plan metadata:** (docs commit follows)

## Files Created/Modified
- `vocabulary/schema/noun.schema.json` - Added declension_type property with enum ["strong", "weak", "mixed", "plural-only", "uncountable"] to nounEntry.properties
- `scripts/validate-nouns.js` - AJV 2020 validation script for nounbank, reports error count with pre-existing baseline note
- `package.json` - Added validate:nouns script entry

## Decisions Made
- `declension_type` is optional (NOT added to `required` array) — entries without it remain schema-valid until Plan 02 injects the actual data
- Pre-existing 356-error baseline is data quality debt (missing translations fields etc.) that predates Phase 14 and is not introduced by schema changes here
- validate:nouns script follows validate-adjectives.js exactly for consistency

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Schema foundation complete: declension_type accepted by schema, validation script ready
- Plan 02 can now inject declension data for all 331 nouns and run `npm run validate:nouns` to confirm zero new errors
- Error baseline (356) is documented for pre/post comparison

---
*Phase: 14-noun-declension-data*
*Completed: 2026-02-22*
