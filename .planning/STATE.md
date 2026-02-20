# GSD State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-20)

**Core value:** Complete, correct vocabulary data so Leksihjelp's inflection search can find any German word form and return the base entry.
**Current focus:** v1.1 German Adjective Declension — Phase 3: Bank Cleanup

## Current Position

Phase: 3 of 10 — Phase 3: Bank Cleanup (first v1.1 phase)
Plan: 0 of TBD in current phase
Status: Ready to plan
Last activity: 2026-02-20 — v1.1 roadmap created (Phases 3-10)

Progress: [░░░░░░░░░░] 0%

## Performance Metrics

**Velocity:**
- Total plans completed: 1
- Average duration: — (single plan, no trend)
- Total execution time: —

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| Phase 2 (v1.0) | 1 | — | — |

*Updated after each plan completion*

## Accumulated Context

### Decisions

Decisions logged in PROJECT.md Key Decisions table.
Recent decisions affecting v1.1:

- Store explicit full declension forms (not a rule engine) — mirrors v1.0 preteritum precedent; German exceptions make rule engines fragile
- Declension data goes in BOTH core bank (v1 API / Leksihjelp) and dictionary bank (v2 API) — dual-storage pattern confirmed from nounbank.json
- Superlativ stores only `schwach` declension (grammatically correct — superlatives require definite article)
- Build order: cleanup → extraction → schema → stubs → comparison → declension → translations → integration

### Blockers/Concerns

- Leksihjelp field name confirmation: must verify Leksihjelp indexes `comparison` and `declension` by those exact names before Phase 5 schema is locked. Mismatch is HIGH cost to fix.
- Goethe extraction candidate count: estimate 60-100 new adjectives is heuristic — confirm actual count during Phase 4 before Phase 6 stub scope is set.
- CDN cache: Vercel s-maxage=86400 — after deploy, up to 24h before new data reaches Leksihjelp end users unless CDN is purged manually.

### Pending Todos

- (none)

## Session Continuity

Last session: 2026-02-20
Stopped at: Phase 3 context gathered
Resume file: .planning/phases/03-bank-cleanup/03-CONTEXT.md
