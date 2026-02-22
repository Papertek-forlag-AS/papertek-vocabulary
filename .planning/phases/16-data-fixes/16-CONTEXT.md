# Phase 16: Data Fixes - Context

**Gathered:** 2026-02-22
**Status:** Ready for planning

<domain>
## Phase Boundary

Correct missing/wrong fields across noun and verb data banks. Six specific requirements (DATA-01 through DATA-06): add missing genus fields, add verb type classification, fill 12 missing presens conjugations, fix manifest counts, populate plural fields for declension-based nouns, and handle plural-only noun genus.

</domain>

<decisions>
## Implementation Decisions

### Verb type classification
- Single `type` field per verb using priority order: reflexive > separable > modal > irregular > regular
- When a verb fits multiple categories, the highest-priority trait wins
- Add a secondary `tags` array for traits not captured by the primary type (e.g., type: "separable", tags: ["irregular"])
- Apply rules uniformly across all 148 entries — no special-cased verbs

### Missing conjugation sourcing
- Claude uses best judgment for conjugation forms, drawing from knowledge of German grammar — no formal reference citation required
- All 6 pronoun forms required for every presens conjugation (ich, du, er/sie/es, wir, ihr, sie/Sie)
- Separable verbs use separated form in conjugations (e.g., "ich fange an", "du fängst an")

### Plural-only noun handling
- Claude's Discretion: genus representation for plural-only nouns like "Leute" (null with documentation, omit, or special marker — Claude picks cleanest approach for data model)
- Plural field format matches existing noun conventions in the data (Claude checks and follows suit)

### Entry-level verification
- When touching morgenmensch_noun to add genus, also verify all other required fields on that entry
- When touching the 12 verbs to add presens conjugations, also verify type, other conjugations, and all required fields on those entries
- Opportunistic completeness: if we're editing an entry, make sure it's fully correct

### Manifest count fix
- Claude's Discretion: determine safest approach for DATA-04 (update manifest to match data vs. verify expected counts first)

### Validation approach
- Run existing validation scripts after all fixes
- Spot-check a sample of changed entries manually
- Full regression check: verify all previously-passing validations still pass after changes
- Trivial issues discovered outside DATA-01–06 scope get fixed in-pass; larger issues noted for backlog

</decisions>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches. The requirements (DATA-01 through DATA-06) are prescriptive enough to guide implementation.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 16-data-fixes*
*Context gathered: 2026-02-22*
