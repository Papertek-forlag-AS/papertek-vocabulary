# GSD State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-22)

**Core value:** Complete, correct vocabulary data so Leksihjelp's inflection search can find any German word form and return the base entry.
**Current focus:** Phase 14 — Noun Declension Data (schema foundation and validation tooling complete)

## Current Position

Phase: 14 of 15 in v1.2 (Noun Declension Data)
Plan: 1 of TBD complete
Status: Phase 14 Plan 01 complete — schema foundation done; ready for Plan 02 (data injection)
Last activity: 2026-02-22 — Phase 14 Plan 01 executed (noun schema + validate:nouns tooling)

Progress: [██████░░░░] 65% (v1.2)

## Performance Metrics

**By Milestone:**

| Milestone | Phases | Plans | Timeline |
|-----------|--------|-------|----------|
| v1.0 | 2 | 1 (+1 pre-GSD) | 2026-02-20 |
| v1.1 | 8 | 8 | 2026-02-20 → 2026-02-22 (3 days) |
| v1.2 | 5 | TBD | In progress |
| Phase 13 Plan 01 | 3 min | 2 tasks | 2 files |
| Phase 14 Plan 01 | 1 min | 1 task | 3 files |

## Accumulated Context

### Decisions

Decisions logged in PROJECT.md Key Decisions table.
Recent decisions affecting v1.2:

- Additive noun cases approach: add `singular`/`plural` sub-objects alongside existing flat `bestemt`/`ubestemt` — never replace flat fields (avoids migration of 223 entries)
- Preteritum dict-bank backfill included in v1.2 scope (AUDIT-03) — confirmed sync gap; cleaner than deferring
- Explicit storage for all participles and noun case forms — no rule engines (mirrors adjective declension precedent)
- Phase 11 (2026-02-22): All schema extensions additive-only; pre-existing AJV errors (356 noun, ~130 verb) are data quality debt not introduced by schema changes
- Phase 11 (2026-02-22): grammar_noun_declension positioned as parent before grammar_genitiv, mirroring grammar_adjective_declension/grammar_adjective_genitive pattern
- Phase 12 (2026-02-22): 17 confirmed inseparable prefix verbs (not 20 as estimated in roadmap); geben/gehen/gewinnen excluded — ge- is part of the stem, not a prefix
- Phase 12 (2026-02-22): sync-preteritum.js uses ESM import/export (project convention from package.json type:module); plan mentioned CommonJS but ESM is correct
- Phase 12 (2026-02-22): inseparable flag synced to dict verbbank in AUDIT-03 same pass as preteritum — efficient housekeeping aligned with dual-bank sync principle
- Phase 12 (2026-02-22): weak_masculine NOT synced to dict nounbank in phase 12; deferred to Phase 15 (Sync & Integration) as scoped
- [Phase 13-perfektum-data]: sich_vorbereiten participle: 'vorbereitet' (not 'vorgebereitet') — exception to separable ge-insertion rule; bereiten-base behaves like a root verb in Partizip II
- [Phase 13-perfektum-data]: moechten_modal participle: 'gemocht' from underlying mögen with modal_note — defective verb has no true Perfektum, mirrors preteritum treatment
- [Phase 14-noun-declension-data]: declension_type is optional (not in required array) — entries without it remain valid until Plan 02 injects data
- [Phase 14-noun-declension-data]: Pre-existing 356-error AJV baseline confirmed; Phase 14 Plan 01 introduces zero new errors

### Blockers/Concerns

- CDN cache: Vercel s-maxage=86400 — after deploy, up to 24h before new data reaches Leksihjelp end users unless CDN is purged manually.
- Noun `cases` structural decision codified in Phase 11 schema (RESOLVED 2026-02-22).

### Pending Todos

- (none)

## Session Continuity

Last session: 2026-02-22
Stopped at: Phase 14 Plan 01 complete — noun schema + validate:nouns tooling (3 files, 1 task commit)
Resume file: N/A — continue with Phase 14 Plan 02 (noun declension data injection for all 331 nouns)
