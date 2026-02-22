# Phase 15: Sync & Integration - Context

**Gathered:** 2026-02-22
**Status:** Ready for planning

<domain>
## Phase Boundary

Mirror all Perfektum and noun declension data from core banks to dictionary banks, rebuild the search index from scratch, update the v2 lookup handler to emit new grammar feature flags and expose new fields, fix the 356-error validation debt, and validate end-to-end. This is the final phase of v1.2 — milestone exit state must be fully green validation.

</domain>

<decisions>
## Implementation Decisions

### Past participle search
- Add `pp` field to verb entries in `search-index.json` for client-side consumption only
- Do NOT modify the v2 search handler to match on past participles — clients download the index and handle search locally
- The v2 search/lookup API is treated as a temporary convenience; future milestone will replace it with a frontend for word lookup and community suggestions

### Sync field scope
- Sync ALL new fields from Phases 12-14, not just the 5 SYNC requirements — full parity between core and dictionary banks
- This includes: `conjugations.perfektum`, `cases` (4-case declension), `inseparable`, `weak_masculine`, `declension_type`, `auxiliary` flags
- Core bank is source of truth; dictionary bank fields get overwritten on mismatch (Claude's discretion on conflict handling — core wins)
- Full rebuild of search index (all 3454+ entries from scratch), not partial — guarantees no stale data

### Validation & error handling
- Fix the 356 pre-existing validation errors (missing translation fields, legacy plural type issues) — milestone exits with zero errors
- Add empty translation stubs and fix legacy plural types as needed to achieve clean validation
- Create a permanent `npm run verify:integration` script in `scripts/` — reusable system health check, not a throwaway phase artifact
- Sync scripts should log mismatches and continue (Claude's discretion on fail-fast vs. log-and-continue)

### Feature flag behavior
- `grammar_noun_declension` emitted for ALL nouns that have cases data — simple rule: data present = flag emitted
- `grammar_genitiv` kept as a SEPARATE flag from `grammar_noun_declension` — allows apps to unlock genitiv exercises independently
- `grammar_perfektum` — Claude checks if handler emits this already and adds it if missing
- Expose `inseparable`, `weak_masculine`, `auxiliary`, `declension_type` in the v2 lookup response body — clients get full visibility, not just internal grammarFeatures logic

### Claude's Discretion
- Search index noun fields — whether to add abbreviated case hints to noun entries in the search index (vs. keeping them in full nounbank download only)
- Past participle format — bare participle ("gewandert") vs. with auxiliary ("ist gewandert") in search index `pp` field
- Sync script architecture — reusable npm scripts vs. one-shot phase scripts (decide based on reusability)
- Conflict handling detail — core always wins, but how to log/report mismatches

</decisions>

<specifics>
## Specific Ideas

- The live search/lookup API is temporary — future milestone will replace with a frontend where users look up words and suggest vocabulary improvements
- The API's primary long-term role is serving static JSON file downloads, called periodically (e.g. at midnight) by consuming apps, not live per-request
- A future milestone will merge core and dictionary banks into a single vocabulary, using manifests to programmatically decide which words the tysk1-app uses

</specifics>

<deferred>
## Deferred Ideas

- Replace v2 search/lookup API with a word-lookup frontend with community suggestion features — future milestone
- Merge core + dictionary banks into single vocabulary with manifest-driven word selection — future milestone
- Periodic sync schedule (e.g. midnight) instead of live API calls — architectural decision for future milestone

</deferred>

---

*Phase: 15-sync-integration*
*Context gathered: 2026-02-22*
