# Phase 2: Add German Preteritum Conjugations - Context

**Gathered:** 2026-02-20
**Status:** Ready for planning

<domain>
## Phase Boundary

Add preteritum conjugations to all 148 German verbs in `verbbank.json`. Each verb gets a `conjugations.preteritum` object with `former` (6 pronoun keys) and `feature: "grammar_preteritum"`. Format matches existing `presens` structure. No new API endpoints needed — existing `/api/vocab/v1/core/german` serves the data.

</domain>

<decisions>
## Implementation Decisions

### Data sourcing
- AI-generated conjugations with automated + manual verification
- Claude generates all forms using standard German grammar knowledge (Duden-level)
- Grammar reference source is Claude's discretion — use most reliable approach
- Irregular/strong verbs prioritized first since they carry highest error risk
- Each verb looked up individually, even regular weak verbs — no purely formulaic generation

### Verb edge cases
- Modal verbs (können, müssen, dürfen, sollen, wollen, mögen): same `preteritum.former` structure with 6 pronouns, plus add `"verb_type": "modal"` metadata tag
- Separable prefix verbs (aufstehen, anfangen): store full form with prefix — e.g. `"ich": "stand auf"`, `"du": "standst auf"`
- Reflexive verbs (sich waschen, sich freuen): include reflexive pronoun in conjugation value — e.g. `"ich": "wusch mich"`, `"du": "wuschst dich"`
- All 148 verbs get preteritum regardless of how common the form is in spoken German
- Verbs with rarely-used preteritum: include the form but add a marker in the vocabulary data indicating rare usage

### Quality assurance
- Automated structural checks: all 6 pronoun keys present, non-empty string values
- Automated pattern checks: weak verbs validated against -te/-test/-te/-ten/-tet/-ten pattern; strong verbs flagged if they accidentally match the weak pattern
- Manual spot-check: ~20 verbs sampled across a mix of types (strong, weak, modal, separable, reflexive)
- Auto fix-and-recheck loop: if verification finds errors, Claude attempts to fix and re-runs verification until clean

### Batch strategy
- Process all 148 verbs in a single pass
- One commit for all preteritum data (clean git history)
- Commit locally only — user pushes to main when ready

### Claude's Discretion
- Specific grammar reference approach for lookups
- Exact rare-usage marker format (could be a boolean field, a note field, etc.)
- Order of verbs within the single processing pass
- Verification script implementation details

</decisions>

<specifics>
## Specific Ideas

- Irregulars first for extra care, then remaining verbs — prioritize accuracy on the forms students are most likely to encounter
- Reflexive pronouns included in conjugation values so Leksihjelp can match full past-tense forms in text
- Separable prefix verbs store the complete written form (e.g. "stand auf") matching how they appear in actual German sentences

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 02-add-german-preteritum-conjugations*
*Context gathered: 2026-02-20*
