# GSD State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-22)

**Core value:** Complete, correct vocabulary data so Leksihjelp's inflection search can find any German word form and return the base entry.
**Current focus:** v1.3 Tech Debt Cleanup — Phase 19: Curriculum Manifest Fix

## Current Position

Phase: 19 — Curriculum Manifest Fix
Plan: 01 of 1 complete
Status: Phase complete
Last activity: 2026-02-23 — Phase 19 Plan 01 complete (curriculum manifest grammar_presens fix — INTEG-01, INTEG-02)

Progress: [████████████████████] 4/4 phases complete

## Performance Metrics

**By Milestone:**

| Milestone | Phases | Plans | Timeline |
|-----------|--------|-------|----------|
| v1.0 | 2 | 1 (+1 pre-GSD) | 2026-02-20 |
| v1.1 | 8 | 8 | 2026-02-20 → 2026-02-22 (3 days) |
| v1.2 | 5 | 8 | 2026-02-14 → 2026-02-22 (8 days) |
| v1.3 | 3 | TBD | 2026-02-22 → TBD |
| Phase 19 P01 | 1 | 2 tasks | 2 files |

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

**Phase 17 decisions:**
- German presens feature ID uses `grammar_presens` (not `grammar_present`) — aligns with German-native naming convention established by grammar_preteritum/grammar_perfektum
- Spanish and French retain `grammar_present` — their languages use generic present tense terminology
- Adjective genitive check covers stark/schwach/gemischt — defensive check ensures any adjective with genitiv in any declension type gets the feature flag

**Phase 18 decisions:**
- validate:all order: core banks (nouns, verbs, adjectives) first, dict variants (nouns:dict, verbs:dict) second, integration last — integration depends on all banks being valid
- Use && chaining in validate:all for fail-fast behavior — stop on first error, no point running dict or integration if core banks fail
- Remove three phantom scripts (validate.js, check-ids.js, check-audio.js) — clean scripts section preferred over stubs

**Phase 19 decisions:**
- All 32 grammar_present occurrences replaced (plan stated 31, actual count was 32 — all replaced for full consistency)

### Blockers/Concerns

- CDN cache: Vercel s-maxage=86400 — after deploy, up to 24h before new data reaches Leksihjelp end users unless CDN is purged manually.

### Pending Todos

- (none)

## Session Continuity

Last session: 2026-02-23
Stopped at: Completed 19-01-PLAN.md (curriculum manifest grammar_presens fix — INTEG-01, INTEG-02)
Resume with: Phase 19 complete — all grammar_present IDs replaced with grammar_presens in manifest and README
