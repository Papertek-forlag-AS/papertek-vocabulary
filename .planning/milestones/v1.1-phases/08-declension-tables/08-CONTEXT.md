# Phase 8: Declension Tables - Context

**Gathered:** 2026-02-21
**Status:** Ready for planning

<domain>
## Phase Boundary

Populate full declension data for all 365 adjectives across positiv and komparativ degrees. Every declinable adjective gets stark/schwach/gemischt article blocks with 4 cases x 4 gender/number. Data written to both core and dictionary banks. Superlativ declension scope is Claude's discretion (roadmap success criteria reference it). This is a data generation + verification phase, not a schema change phase.

</domain>

<decisions>
## Implementation Decisions

### Declension scope by adjective type
- 352 comparable adjectives get positiv + komparativ declension blocks (stark/schwach/gemischt each)
- 8 nicht-komparierbar adjectives get positiv declension only (no komparativ or superlativ)
- 5 undeclinable adjectives keep `"declension": {}` — no declension data generated
- Superlativ declension (schwach only): Claude's discretion — roadmap success criteria SC-2 mentions superlativ blocks, so Claude should evaluate whether to include them to satisfy the requirement

### Irregular stem handling
- All 27+ irregular adjectives get equal verification care — no category is less important
- Independent stem lookup for all irregulars — do NOT rely solely on comparison data from Phase 7
- Source of truth: Duden prescriptive standard German
- Suppletive (gut/viel/hoch), umlaut (17), e-drop (2), consonant-cluster (5) all treated with full attention

### Data completeness
- Every cell must be filled (Claude's discretion on handling truly disputed forms)
- Automated verification script — permanent project asset, reusable for future data changes
- Verification flags errors and continues (does not stop on first error) — all failures reported at end
- Committed markdown review report listing all irregular declension forms for human sanity-checking
- Dual-bank storage: Claude follows existing project pattern for core/dictionary bank relationship

### Variant declined forms
- Follow Duden preferred form as the primary value for each cell
- Standard Duden e-elision rules for -el adjectives (dunkler, edler, flexibler)
- Per-adjective Duden lookup for -er adjectives — no blanket e-drop rule (teures is standard, sauberes is standard)
- Store alternative accepted forms alongside primary form for adjectives with genuine Duden-recognized variants (~10-15 adjectives)
- Alternatives must be machine-distinguishable from the primary form so downstream apps can choose to show or ignore them
- Purpose of alternatives: test tools recognize them as accepted answers; dictionaries/learning apps decide whether to display

### Claude's Discretion
- Superlativ declension inclusion (evaluate against roadmap SC-2)
- Marking mechanism for alternative forms (must be code-recognizable, not break existing schema consumers)
- Core/dictionary bank relationship for declension data (follow existing dual-bank pattern)
- Handling of genuinely disputed/uncertain forms (fill with most standard form vs leave blank)
- Execution batching strategy (all at once vs by category vs by difficulty)

</decisions>

<specifics>
## Specific Ideas

- Alternatives are for test-tool acceptance — a learner typing "teuerer" instead of "teurer" should get it marked correct if Duden accepts both
- Downstream consumers (dictionary app, learning app) decide whether to show alternatives — the data just needs to mark them
- The irregular review report should make it easy for a human to scan and spot obvious errors (like "hochem" appearing when it should be "hohem")

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 08-declension-tables*
*Context gathered: 2026-02-21*
