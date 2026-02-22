---
phase: 13-perfektum-data
plan: "01"
subsystem: database
tags: [german, verbbank, perfektum, conjugation, json, ajv]

# Dependency graph
requires:
  - phase: 11-schema-extensions
    provides: "Perfektum fields in verb schema (participle, auxiliary, auxiliary_note, dual_auxiliary, modal_note)"
  - phase: 12-pre-entry-audit
    provides: "inseparable: true flags on 17 verbs; separable: true flags on 19 verbs"
provides:
  - "144 verb entries with complete conjugations.perfektum blocks (participle, auxiliary, former, feature)"
  - "scripts/add-perfektum.js audit-trail injection script"
  - "Dual-auxiliary annotation (dual_auxiliary + auxiliary_note) on 6 verbs"
  - "Ersatzinfinitiv modal_note documentation on 7 modal verbs"
  - "Reflexive pronoun inclusion in former forms for all 26 reflexive verbs"
affects:
  - phase-15-sync-integration
  - leksihjelp-inflection-search

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "ESM one-shot injection script pattern (follows sync-preteritum.js): read verbbank, merge data from hardcoded table, write back"
    - "Spread merge for conjugations: { ...existing.conjugations, perfektum: data } — never replace entire conjugations object"
    - "Explicit storage for all participle forms (no rule engines) — mirrors adjective declension precedent"
    - "Helper builder functions (haben/sein/both/modal/habenRefl/seinRefl) reduce verbosity in data table"

key-files:
  created:
    - scripts/add-perfektum.js
  modified:
    - vocabulary/core/de/verbbank.json

key-decisions:
  - "sich_vorbereiten participle: 'vorbereitet' (not 'vorgebereitet') — known exception to separable ge-insertion rule; bereiten-base verb behaves like a non-separable in practice"
  - "haengen participle: 'gehangen' (strong intransitive) as default — covers the common usage; transitive 'gehängt' not in scope"
  - "moechten_modal participle: 'gemocht' from underlying mögen with modal_note explaining defective status — matches treatment of preteritum which uses wollte forms with note"

patterns-established:
  - "Pattern: Helper builder functions (haben/sein/both/modal/habenRefl/seinRefl) for concise data table entry in injection scripts"
  - "Pattern: All 144 entries use feature: grammar_perfektum tag for feature-flag lookup by Leksihjelp"

requirements-completed: [PERF-01, PERF-02, PERF-03, PERF-04, PERF-05, PERF-06, PERF-07]

# Metrics
duration: 3min
completed: 2026-02-22
---

# Phase 13 Plan 01: Perfektum Data Summary

**Complete Perfektum conjugation blocks for all 144 core verbbank German verbs — participle, auxiliary selection (haben/sein/both), 6-pronoun former, and special annotations for dual-auxiliary, modal, and reflexive verbs**

## Performance

- **Duration:** ~3 min
- **Started:** 2026-02-22T10:24:34Z
- **Completed:** 2026-02-22T10:27:55Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments

- Created `scripts/add-perfektum.js` (ESM injection script, 300+ lines) with hardcoded data table for all 144 verbs and helper builders — executed cleanly with "Added: 144, Skipped: 0, Missing: 0"
- Populated `conjugations.perfektum` on all 144 non-verbphrase verb entries with participle, auxiliary, 6-pronoun former, and `feature: grammar_perfektum`
- AJV validation: 191 errors (matches baseline exactly — zero new errors introduced)
- All 47 spot-checks passed: PERF-01 through PERF-07 fully satisfied including dual-auxiliary annotations (6/6), modal_note documentation (7/7), separable ge-position (19/19), inseparable no-ge (17/17), -ieren no-ge (5/5), reflexive pronouns in former, and existing tense preservation

## Task Commits

Each task was committed atomically:

1. **Task 1: Create and execute add-perfektum.js** - `460c24f` (feat)
2. **Task 2: Validate with AJV and run comprehensive spot-checks** - (verification only — no new files; results documented here)

## Files Created/Modified

- `scripts/add-perfektum.js` — ESM one-shot injection script; hardcoded PERFEKTUM_DATA map with 144 entries; helper builders (haben/sein/both/modal/habenRefl/seinRefl); reads verbbank, merges perfektum blocks using spread, writes back; prints summary and exits 1 if any entries missing
- `vocabulary/core/de/verbbank.json` — 144 verb entries now have `conjugations.perfektum` with participle, auxiliary, former (6 pronouns), feature, and category-specific extras (dual_auxiliary, auxiliary_note, modal_note)

## Decisions Made

- `sich_vorbereiten` participle set to `vorbereitet` (not `vorgebereitet`) — this verb is an exception to the normal ge-insertion rule for separable verbs; the `bereiten` base behaves like a root verb in the Partizip II formation; native German usage overwhelmingly favors `vorbereitet`
- `haengen_verb` participle set to `gehangen` (strong intransitive, haben) as the default; the transitive `gehängt` form is not stored separately since the entry does not distinguish transitivity
- `moechten_modal` participle set to `gemocht` with modal_note explaining that `möchten` is defective and has no true Perfektum; uses the underlying `mögen`'s Partizip II; matches the preteritum treatment (which also delegates to a parent verb with a note)

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- All 144 verb entries have complete Perfektum data
- Phase 14 (Noun Declension Data) or Phase 15 (Sync and Integration) can proceed
- Phase 15 (sync-integration) can now sync `conjugations.perfektum` from core verbbank to dictionary verbbank — same pattern as sync-preteritum.js used in Phase 12
- Leksihjelp inflection search can now find past participle forms and return the base verb entry via the `grammar_perfektum` feature tag

---
*Phase: 13-perfektum-data*
*Completed: 2026-02-22*
