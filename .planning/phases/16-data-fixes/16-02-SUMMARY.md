---
phase: 16-data-fixes
plan: 02
subsystem: database
tags: [verbbank, conjugation, schema, german, vocabulary-data]

# Dependency graph
requires:
  - phase: 16-data-fixes
    provides: Phase context and DATA-02/DATA-03 requirements
provides:
  - All 148 core verbbank entries with type field (regular/irregular/modal/separable/reflexive/verbphrase)
  - Tags arrays on 20 multi-trait verbs capturing secondary classification
  - 12 presens conjugation objects added to non-verbphrase verbs missing them
  - verb.schema.json with optional tags array property
  - Dict verbbank synced: 137 entries updated with type, tags, and presens
affects:
  - 16-03-PLAN (audit verification of DATA-02/DATA-03)
  - Any future phase touching verbbank or inflection search

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Priority order for verb classification: reflexive > separable > modal > irregular > regular"
    - "Tags array captures secondary traits not represented by primary type"
    - "Audit-trail scripts: read-classify-write with console.log summary counts"
    - "Dict sync: only update entries that exist in both banks, preserve dict-only fields"

key-files:
  created:
    - scripts/fix-verb-fields.js
  modified:
    - vocabulary/schema/verb.schema.json
    - vocabulary/core/de/verbbank.json
    - vocabulary/dictionary/de/verbbank.json

key-decisions:
  - "Priority order for multi-trait verbs: reflexive > separable > modal > irregular > regular"
  - "Tags array for secondary traits only when verb has actual secondary characteristic — no empty arrays"
  - "strong → irregular, weak → regular; existing strong/weak enum values kept for schema backward compatibility"
  - "Zaehneputzen presens follows established preteritum pattern: ich putze Zaehne"
  - "sich_anziehen classified reflexive with tags [separable, irregular] — reflexive takes priority"

patterns-established:
  - "Verb type classification priority: reflexive > separable > modal > irregular > regular"
  - "Tags array: secondary traits only, never empty"
  - "presens placed as first key in conjugations object (chronological tense order)"

requirements-completed: [DATA-02, DATA-03]

# Metrics
duration: 12min
completed: 2026-02-22
---

# Phase 16 Plan 02: Verb Type Classification Summary

**All 148 core verbbank entries classified with type + tags, 12 presens conjugations added, dict synced — DATA-02 and DATA-03 satisfied**

## Performance

- **Duration:** 12 min
- **Started:** 2026-02-22T20:57:09Z
- **Completed:** 2026-02-22T21:09:00Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments

- All 148 core verbbank entries now have a `type` field: 53 regular, 40 irregular, 26 reflexive, 18 separable, 7 modal, 4 verbphrase
- 20 multi-trait verbs get `tags` arrays (e.g., `type: "separable", tags: ["irregular"]` for wegfahren)
- 12 non-verbphrase verbs missing presens conjugations now have complete 6-pronoun presens objects
- verb.schema.json updated with optional `tags` array property (enum: regular, irregular, modal, separable, reflexive, inseparable)
- Dict verbbank synced: 137 entries updated with new type, tags, and presens data
- AJV validation passes for both core (148 entries) and dict (679 entries)

## Task Commits

Each task was committed atomically:

1. **Task 1: Update verb schema to support tags array** - `bac3690` (feat)
2. **Task 2: Create verb fix script — classify types, add presens, sync to dict** - `e16fb3b` (feat)

## Files Created/Modified

- `vocabulary/schema/verb.schema.json` - Added optional tags array property with enum of secondary traits
- `scripts/fix-verb-fields.js` - Audit-trail script: classifies all 148 verb types, adds 12 presens conjugations, syncs to dict
- `vocabulary/core/de/verbbank.json` - All 148 entries typed, 20 with tags, 12 new presens conjugations
- `vocabulary/dictionary/de/verbbank.json` - 137 entries synced with type, tags, and presens from core

## Decisions Made

- Priority order for multi-trait verbs established: reflexive > separable > modal > irregular > regular
- Tags array used only for secondary traits (never empty arrays on single-trait verbs)
- `strong` renamed to `irregular`, `weak` renamed to `regular` throughout (enum preserves old values for backward compat)
- Special reclassifications: bekommen (weak → irregular), wegfahren/mitkommen/einschlafen/ausziehen (weak → separable+irregular), liegen_bleiben/spazieren_gehen (weak → separable+irregular), zaehneputzen (weak → separable)
- Zaehneputzen presens follows existing preteritum convention: "putze Zähne" (no "mir die")

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- DATA-02 satisfied: all 148 entries have type field, zero undefined, zero strong/weak
- DATA-03 satisfied: all 144 non-verbphrase verbs have complete presens.former with 6 pronoun forms
- Ready for Phase 16 Plan 03 (audit/verification run)
- Dict verbbank in sync with core for type, tags, and presens fields

---
*Phase: 16-data-fixes*
*Completed: 2026-02-22*
