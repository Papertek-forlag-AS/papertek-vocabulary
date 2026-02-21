# Phase 9: Translations - Context

**Gathered:** 2026-02-21
**Status:** Ready for planning

<domain>
## Phase Boundary

Add Norwegian (nb) and English (en) translations for all 259 newly extracted adjectives, plus upgrade 24 simple nb entries and all 106 simple en entries to the full rich format. The result: every adjective in the bank has consistent, rich translation data in both language pairs.

</domain>

<decisions>
## Implementation Decisions

### Norwegian translation depth
- Full rich format for all 259 new entries: translation + explanation + synonyms + examples
- Upgrade the 24 existing simple nb entries (e.g. gelb_adj: "gul") to the same rich format
- Total nb work: 259 new entries + 24 upgrades = 283 entries needing rich data
- Explanation field written in Norwegian (Bokmål only)
- Bokmål only — Nynorsk will be a separate language pair (de-nn) in a future phase

### English translation depth
- Full rich format matching nb: translation + explanation + synonyms + examples
- Upgrade all 106 existing simple en entries to the rich format
- Total en work: 259 new entries + 106 upgrades = 365 entries needing rich data
- Explanation field written in English
- Full parity between nb and en — same richness level

### Example sentences
- Same German sentences used in both nb and en translations — only the target-language translation differs
- Number of examples per entry: Claude's discretion based on word complexity

### Multi-meaning handling
- `translation` field contains the primary meaning only (not slash-separated multiple meanings)
- `synonyms` array contains target-language synonyms for the primary meaning only
- New `alternativeMeanings` field added for distinct secondary meanings of the German word
- `alternativeMeanings` format: array of objects with `meaning` (string) and `context` (string) fields
  - Example: `{"meaning": "boring", "context": "figurative"}` for trocken
- This keeps synonyms pure and makes secondary meanings programmable for consuming apps

### Translation sourcing
- AI-generated translations with spot-checking
- Spot-check focus: false friends (German-Norwegian cognates with different meanings) and adjectives with irregular/nuanced meanings
- Generate a verification report (markdown) listing all flagged entries with reasoning and suggested translations for user review before commit

### Claude's Discretion
- Number of example sentences per entry (based on word complexity)
- Number of synonyms per entry
- Which entries to flag as false friends or requiring extra review
- Exact wording of explanations

</decisions>

<specifics>
## Specific Ideas

- "If we do the data correctly, apps using papertek-vocabulary can include and exclude fields as they like" — richest possible data, apps cherry-pick
- Nynorsk noted as future language pair (de-nn), not mixed into Bokmål translations
- The `alternativeMeanings` field distinguishes genuinely different meanings from synonyms, making the data programmable for different display contexts

</specifics>

<deferred>
## Deferred Ideas

- Nynorsk (de-nn) translation pair — future phase/milestone
- Translation schema validation (if alternativeMeanings needs schema support) — may be handled during planning

</deferred>

---

*Phase: 09-translations*
*Context gathered: 2026-02-21*
