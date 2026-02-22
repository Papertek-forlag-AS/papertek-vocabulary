# GSD State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-22)

**Core value:** Complete, correct vocabulary data so Leksihjelp's inflection search can find any German word form and return the base entry.
**Current focus:** v1.3 Tech Debt Cleanup — Phase 16: Data Fixes

## Current Position

Phase: 16 — Data Fixes
Plan: 03 of 3 complete
Status: Phase complete
Last activity: 2026-02-22 — Phase 16 Plan 03 complete (manifest count fixes — DATA-04)

Progress: [██████░░░░░░░░░░░░░░] 1/3 phases complete

## Performance Metrics

**By Milestone:**

| Milestone | Phases | Plans | Timeline |
|-----------|--------|-------|----------|
| v1.0 | 2 | 1 (+1 pre-GSD) | 2026-02-20 |
| v1.1 | 8 | 8 | 2026-02-20 → 2026-02-22 (3 days) |
| v1.2 | 5 | 8 | 2026-02-14 → 2026-02-22 (8 days) |
| v1.3 | 3 | TBD | 2026-02-22 → TBD |

## Accumulated Context

### Decisions

Decisions logged in PROJECT.md Key Decisions table (15 decisions, all ✓ Good or — Pending).

**Phase 16 decisions:**
- Use `genus:"pl"` for leute_noun (plural-only noun) — schema enum only allows string values; "pl" matches eltern_noun/ferien_noun convention and passes AJV validation
- Plural fields store bare noun without article (e.g. "Zusammenfassungen" not "die Zusammenfassungen") — matches existing nounbank convention
- Verb type priority order: reflexive > separable > modal > irregular > regular
- Tags array only for secondary traits — never empty arrays on single-trait verbs
- strong → irregular, weak → regular throughout verbbank (enum preserves old values for backward compat)
- scripts/fix-manifest-counts.js counts entries dynamically (no hardcoded values) — safe to re-run as health check; curriculumWords confirmed 867 by direct count

### Blockers/Concerns

- CDN cache: Vercel s-maxage=86400 — after deploy, up to 24h before new data reaches Leksihjelp end users unless CDN is purged manually.

### Pending Todos

- (none)

## Session Continuity

Last session: 2026-02-22
Stopped at: Completed 16-03-PLAN.md (manifest count fixes — DATA-04)
Resume with: Phase 16 complete — next milestone phase
