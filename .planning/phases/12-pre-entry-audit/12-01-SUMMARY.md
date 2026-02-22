---
phase: 12-pre-entry-audit
plan: "01"
subsystem: database
tags: [german, vocabulary, verbbank, nounbank, inseparable, weak-masculine, preteritum, json, ajv]

# Dependency graph
requires:
  - phase: 11-schema-extensions
    provides: inseparable boolean field on verb schema; weak_masculine boolean field on noun schema
provides:
  - inseparable: true on 17 inseparable prefix verb entries in core verbbank
  - weak_masculine: true on 11 n-Deklination noun entries in core nounbank
  - conjugations.preteritum synced to 148 dictionary verbbank entries from core verbbank
  - inseparable: true synced to 17 dictionary verbbank entries
  - scripts/sync-preteritum.js as reusable audit-trail sync script
affects:
  - 13-perfektum (uses inseparable flag to correctly omit ge- in past participles)
  - 14-noun-declension (uses weak_masculine flag to apply -(e)n endings)
  - 15-sync-integration (dict verbbank now has preteritum data; weak_masculine still needs dict sync in phase 15)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Programmatic JSON flag insertion: rebuild entry object with correct field ordering using index-based loop"
    - "Sync-script pattern: iterate core keys, look them up in dict, merge target fields without replacing existing ones"

key-files:
  created:
    - scripts/sync-preteritum.js
  modified:
    - vocabulary/core/de/verbbank.json
    - vocabulary/core/de/nounbank.json
    - vocabulary/dictionary/de/verbbank.json

key-decisions:
  - "Used 17 confirmed inseparable verbs (not roadmap estimate of 20): geben, gehen, gewinnen excluded as ge- is part of the stem, not a prefix"
  - "sync-preteritum.js uses ESM (import/export) following project convention — plan mentioned CommonJS but project package.json has type:module"
  - "besuchen_verb in dict verbbank does not have verbClass — confirmed by direct inspection; verbClass is entry-specific, not universal in dict"
  - "inseparable flag synced to dict verbbank in same AUDIT-03 pass as preteritum (efficient housekeeping; aligns with dual-bank sync principle)"
  - "weak_masculine NOT synced to dict nounbank — deferred to Phase 15 as per plan scope"

patterns-established:
  - "Flag insertion pattern: reconstruct entry object inserting flag after specific anchor field (type or word for verbs, genus for nouns)"
  - "Sync script: iterate source keys, skip _metadata and missing targets, merge single field into target subobject"
  - "AJV baseline check: compare post-edit error counts against pre-established baselines; treat pre-existing errors as data quality debt"

requirements-completed: [AUDIT-01, AUDIT-02, AUDIT-03]

# Metrics
duration: 25min
completed: 2026-02-22
---

# Phase 12 Plan 01: Pre-Entry Audit Summary

**inseparable: true on 17 prefix verbs, weak_masculine: true on 11 n-Deklination nouns, preteritum synced to 148 dictionary verbbank entries via sync-preteritum.js**

## Performance

- **Duration:** ~25 min
- **Started:** 2026-02-22T06:27:00Z
- **Completed:** 2026-02-22T06:52:19Z
- **Tasks:** 2
- **Files modified:** 4 (3 JSON data files + 1 sync script)

## Accomplishments

- Added `inseparable: true` to 17 inseparable prefix verb entries (be-, er-, ver-, ent-, unter-) in core verbbank; geben/gehen/gewinnen correctly excluded
- Added `weak_masculine: true` to all 11 n-Deklination noun entries in core nounbank
- Created `scripts/sync-preteritum.js` to copy `conjugations.preteritum` from core verbbank to 148 matching dictionary verbbank entries; inseparable flag co-synced
- AJV error counts held at pre-existing baselines: 191 verb, 356 noun (no new errors introduced)

## Task Commits

Each task was committed atomically:

1. **Task 1: Flag inseparable verbs and n-Deklination nouns in core banks** - `0cd1f8a` (feat)
2. **Task 2: Sync preteritum and inseparable flag to dictionary verbbank** - `cb7ba0c` (feat)

**Plan metadata:** (docs commit below)

## Files Created/Modified

- `vocabulary/core/de/verbbank.json` - 17 entries gained `inseparable: true` (AUDIT-01)
- `vocabulary/core/de/nounbank.json` - 11 entries gained `weak_masculine: true` (AUDIT-02)
- `vocabulary/dictionary/de/verbbank.json` - 148 entries gained `conjugations.preteritum`; 17 gained `inseparable: true` (AUDIT-03)
- `scripts/sync-preteritum.js` - One-shot ESM sync script; serves as audit trail (AUDIT-03)

## Decisions Made

- **17 not 20 inseparable verbs:** Research confirmed 17 linguistically valid entries. Roadmap estimate of 20 was an approximation. geben_verb, gehen_verb, gewinnen_verb excluded — "ge-" is part of the stem, not an inseparable prefix.
- **ESM not CommonJS:** Plan mentioned CommonJS convention but project `package.json` has `"type": "module"`. sync-preteritum.js uses `import/export` to match the existing project pattern (`scripts/validate-adjectives.js`).
- **inseparable synced to dict in AUDIT-03:** Not explicitly required but good housekeeping; consistent with dual-bank sync principle in STATE.md.
- **weak_masculine NOT synced to dict:** Deferred to Phase 15 as scoped in the plan.

## Deviations from Plan

None — plan executed exactly as written. The ESM/CommonJS note is a clarification of convention, not a deviation; the sync script follows existing project patterns.

## Issues Encountered

- **Plan spot-check assumed verbClass on besuchen_verb:** The plan's `<verify>` step checks `has verbClass: !!e.verbClass` for `besuchen_verb`. Direct inspection of the actual dictionary verbbank showed this entry does not have `verbClass` (it was never added in prior phases). The sync script correctly preserved all existing fields. Verified `verbClass` preservation via `gehen_verb` which does have it. The plan's example in the research doc used a non-representative entry.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Phase 13 (Perfektum): `inseparable: true` flag is now set on all 17 applicable verb entries in core verbbank. Phase 13 can use this flag to determine whether to include ge- in past participle formation.
- Phase 14 (Noun Declension): `weak_masculine: true` flag is set on all 11 n-Deklination nouns in core nounbank. Phase 14 can use this to apply -(e)n endings in non-nominative singular cases.
- Phase 15 (Sync & Integration): dict verbbank now has complete preteritum data for all 148 core verbs. Phase 15 still needs to sync `weak_masculine` to the dict nounbank.

## Self-Check: PASSED

All created/modified files verified present on disk. Both task commits verified in git log.

- vocabulary/core/de/verbbank.json: FOUND
- vocabulary/core/de/nounbank.json: FOUND
- vocabulary/dictionary/de/verbbank.json: FOUND
- scripts/sync-preteritum.js: FOUND
- .planning/phases/12-pre-entry-audit/12-01-SUMMARY.md: FOUND
- Commit 0cd1f8a (Task 1): FOUND
- Commit cb7ba0c (Task 2): FOUND

---
*Phase: 12-pre-entry-audit*
*Completed: 2026-02-22*
