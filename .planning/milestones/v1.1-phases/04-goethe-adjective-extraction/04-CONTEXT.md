# Phase 4: Goethe Adjective Extraction - Context

**Gathered:** 2026-02-20
**Status:** Ready for planning

<domain>
## Phase Boundary

Extract genuine adjectives from the Goethe wordlists, deduplicate against the existing 106-entry adjective bank (post-Phase 3 cleanup), verify each candidate with the attributive test ("ein ___er Mann"), and produce a curated candidate list with CEFR levels. No bank entries are created — that's Phase 6.

</domain>

<decisions>
## Implementation Decisions

### Extraction scope
- Include all three CEFR levels: A1, A2, and B1.
- If a word appears in multiple Goethe levels, assign the lowest level (first exposure matters for learners).
- Claude determines which Goethe source lists to scan — not limited to "other" wordlists if adjectives are found in other categories.

### Edge case handling
- **Participial adjectives excluded.** Words derived from verbs (interessant, überrascht, aufregend) are NOT included in this extraction, even if they pass the attributive test. Deferred to a future milestone.
- **Compound adjectives included** if they appear in Goethe lists. Don't add compounds not in the source.
- **Dual-role words** (adverb/adjective like schnell): Claude applies judgment per word based on primary usage in German.
- **Borderline cases:** Include but flag as "needs review" so they can be checked before Phase 6 stub creation.

### Output format
- No manual review gate — attributive test + deduplication = final list. Automated quality is sufficient.
- Claude determines file location (phase directory vs vocabulary directory) and format (JSON vs markdown) based on what best serves downstream Phase 6 consumption.
- Claude determines metadata fields beyond the required word + CEFR level.

### Claude's Discretion
- Which Goethe source files to scan (all "other" lists, potentially other categories)
- Whether to flag existing bank entries missing CEFR metadata (backfill observation)
- File location and format for the candidate list
- Additional metadata fields beyond word + CEFR
- Dual-role word decisions (adverb vs adjective per word)

</decisions>

<specifics>
## Specific Ideas

- The attributive test ("ein ___er Mann") is the definitive inclusion criteria — if it works, it's a genuine adjective (unless it's a participial form).
- Lowest CEFR level wins for duplicates across levels — learners encounter it at the lowest level first.

</specifics>

<deferred>
## Deferred Ideas

- Participial adjective extraction (interessant, überrascht, aufregend, etc.) — deferred to a future milestone. These derive from verbs and may need special treatment.

</deferred>

---

*Phase: 04-goethe-adjective-extraction*
*Context gathered: 2026-02-20*
