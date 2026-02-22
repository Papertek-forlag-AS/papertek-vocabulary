# GSD State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-22)

**Core value:** Complete, correct vocabulary data so Leksihjelp's inflection search can find any German word form and return the base entry.
**Current focus:** Phase 13 — Perfektum Data (144 verb Perfektum conjugation blocks complete)

## Current Position

Phase: 13 of 15 in v1.2 (Perfektum Data)
Plan: 1 of 1 complete
Status: Phase 13 complete — ready for Phase 14 (Noun Declension Data)
Last activity: 2026-02-22 — Phase 13 Plan 01 executed (Perfektum data for all 144 verbs)

Progress: [█████░░░░░] 60% (v1.2)

## Performance Metrics

**By Milestone:**

| Milestone | Phases | Plans | Timeline |
|-----------|--------|-------|----------|
| v1.0 | 2 | 1 (+1 pre-GSD) | 2026-02-20 |
| v1.1 | 8 | 8 | 2026-02-20 → 2026-02-22 (3 days) |
| v1.2 | 5 | TBD | In progress |
| Phase 13 Plan 01 | 3 min | 2 tasks | 2 files |

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

### Blockers/Concerns

- CDN cache: Vercel s-maxage=86400 — after deploy, up to 24h before new data reaches Leksihjelp end users unless CDN is purged manually.
- Noun `cases` structural decision codified in Phase 11 schema (RESOLVED 2026-02-22).

### Pending Todos

- (none)

## Session Continuity

Last session: 2026-02-22
Stopped at: Phase 13 Plan 01 complete — Perfektum data injected for all 144 verbs (2 files, 1 task commit)
Resume file: N/A — start with `/gsd:plan-phase 14` for Noun Declension Data phase
