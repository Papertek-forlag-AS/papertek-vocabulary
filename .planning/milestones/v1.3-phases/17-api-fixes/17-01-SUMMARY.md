---
phase: 17-api-fixes
plan: 01
subsystem: api
tags: [v2-lookup, grammar-features, adjective-declension, german]

# Dependency graph
requires:
  - phase: 16-data-fixes
    provides: corrected verbbank verb types and noun fields used by v2 lookup
  - phase: 11-adjective-declension
    provides: grammar_adjective_genitive feature ID in grammar-features.json
provides:
  - v2 lookup handler with consistent grammar_presens ID for German verb presens
  - grammar_adjective_genitive feature flag emission for adjectives with genitiv declension data
  - declensionAlternatives field surfaced in v2 response for adjectives with alternative forms
affects: [leksihjelp-chrome-extension, api-consumers]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Grammar feature IDs use language-native terms (grammar_presens for German, grammar_present for Spanish/French)"
    - "camelCase snake_case conversion for API response fields (declension_alternatives -> declensionAlternatives)"

key-files:
  created: []
  modified:
    - api/vocab/v2/lookup/[language]/[wordId].js
    - vocabulary/grammar-features.json

key-decisions:
  - "German presens feature uses grammar_presens (not grammar_present) — matches German terminology, aligns with preteritum/perfektum naming convention"
  - "Spanish and French retain grammar_present — their languages use generic present tense terminology"
  - "Adjective genitive check covers all three declension types (stark/schwach/gemischt)"

patterns-established:
  - "Grammar feature IDs use language-native names: grammar_presens (de), grammar_present (es/fr)"

requirements-completed: [API-01, API-02, API-03]

# Metrics
duration: 1min
completed: 2026-02-22
---

# Phase 17 Plan 01: API Fixes Summary

**v2 lookup handler fixed with consistent grammar_presens ID, adjective genitive feature flag, and declensionAlternatives field surfacing**

## Performance

- **Duration:** ~1 min
- **Started:** 2026-02-22T22:00:37Z
- **Completed:** 2026-02-22T22:01:36Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- Renamed German presens grammar feature ID from `grammar_present` to `grammar_presens` in both the handler and grammar-features.json (API-01)
- Added `grammar_adjective_genitive` feature flag emission for adjectives with genitiv declension data in any of stark/schwach/gemischt tables (API-02)
- Surfaced `declension_alternatives` as camelCased `declensionAlternatives` in v2 response for adjectives with alternative forms (API-03)

## Task Commits

Each task was committed atomically:

1. **Task 1: Fix grammar_present to grammar_presens and add adjective genitive feature flag** - `f474b7d` (fix)
2. **Task 2: Surface declension_alternatives as declensionAlternatives** - `126918b` (feat)

**Plan metadata:** `7f4a962` (docs: complete plan)

## Files Created/Modified
- `api/vocab/v2/lookup/[language]/[wordId].js` - Fixed grammar_presens ID, added grammar_adjective_genitive check, added declensionAlternatives field
- `vocabulary/grammar-features.json` - Updated German presens feature ID from grammar_present to grammar_presens

## Decisions Made
- German presens feature ID uses `grammar_presens` (not `grammar_present`) — aligns with the German-native naming convention already established by `grammar_preteritum` and `grammar_perfektum`
- Spanish (`grammar_present`) and French (`grammar_present`) entries unchanged — their languages legitimately use the generic present tense term
- Adjective genitive check covers all three declension table types: stark, schwach, gemischt — defensive check ensures any adjective with genitiv in any type gets the flag

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All three API-01/02/03 requirements are complete
- v2 lookup handler is ready for Leksihjelp Chrome extension consumption without special-casing grammar feature IDs
- Any adjective with `declension_alternatives` in the bank will automatically surface the field

---
*Phase: 17-api-fixes*
*Completed: 2026-02-22*
