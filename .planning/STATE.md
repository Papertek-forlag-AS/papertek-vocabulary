# GSD State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-23)

**Core value:** Complete, correct vocabulary data so Leksihjelp's inflection search can find any German word form and return the base entry.
**Current focus:** Phase 21 — Translation Consolidation

## Current Position

Phase: 21 of 23 (Translation Consolidation)
Plan: 2 of 2 in current phase (21-02 complete — phase done)
Status: In progress
Last activity: 2026-02-23 — 21-02 deleted de-nb-dict/, de-en-dict/, vocabulary/dictionary/de/; 17 files removed, search index unchanged at 3454 entries

Progress: [████████████████████░░░░░░░░░░] 65% (19/23 phases complete across all milestones)

## Performance Metrics

**By Milestone:**

| Milestone | Phases | Plans | Timeline |
|-----------|--------|-------|----------|
| v1.0 | 2 | 1 (+1 pre-GSD) | 2026-02-20 |
| v1.1 | 8 | 8 | 2026-02-20 → 2026-02-22 (3 days) |
| v1.2 | 5 | 8 | 2026-02-14 → 2026-02-22 (8 days) |
| v1.3 | 4 | 6 | 2026-02-22 → 2026-02-23 (2 days) |
| v2.0 | 4 (planned) | TBD | Started 2026-02-23 |

## Accumulated Context

### Decisions

Decisions logged in PROJECT.md Key Decisions table (20 decisions).
Key decisions relevant to v2.0:
- Dual-bank storage (v1.3) was the resolved pattern — v2.0 eliminates it
- Core manifest replaces implicit "in core bank = curriculum" pattern
- External API contracts (Leksihjelp) must not break — v1 response shape frozen
- Dict bank is the authoritative merge base (superset); core-exclusive fields are additive-only (20-01)
- adjectivebank has 106 curriculum entries, not 365 — dict bank already had 259 adjectives with curriculum:false (20-01)
- pp field read from merged verbbank's conjugations.perfektum.participle directly — no separate core verbbank load needed (20-02)
- Search index canonical location is vocabulary/banks/de/search-index.json (20-02)
- [Phase 21-translation-consolidation]: Phase 21-01: Translation merge uses simple union (zero overlaps confirmed across all 6 bank/pair combos); core version wins defensively on any overlap
- [Phase 21-translation-consolidation]: Phase 21-01: build-search-index.js simplified to single-map translation lookup — no more curr vs dict distinction
- [Phase 21-translation-consolidation]: Phase 21-02: Delete proceeded only after 6/6 merge verification checks passed (0 missing, 0 mismatches); translation directories now clean (de-nb, de-en, es-en, es-nb, fr-nb only)

### Pending Todos

- (none)

### Blockers/Concerns

- CDN cache: Vercel s-maxage=86400 — after deploy, up to 24h before new data reaches Leksihjelp end users.
- Pre-migration snapshot needed: capture v1 and v2 API responses before migration starts (enables VALID-02 and VALID-03 verification in Phase 23).

## Session Continuity

Last session: 2026-02-23
Stopped at: 21-02 complete — Phase 21 fully done; all -dict/ dirs and vocabulary/dictionary/de/ deleted
Resume with: `/gsd:execute-phase 22` (API migration)
