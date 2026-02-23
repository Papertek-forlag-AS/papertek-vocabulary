# Phase 21: Translation Consolidation - Context

**Gathered:** 2026-02-23
**Status:** Ready for planning

<domain>
## Phase Boundary

Merge translation directories (de-nb + de-nb-dict, de-en + de-en-dict) into single directories per language pair. Delete the -dict/ directories and update all codebase references. Also clean up the old vocabulary/dictionary/de/ directory since banks are now merged (Phase 20).

</domain>

<decisions>
## Implementation Decisions

### Merge conflict handling
- Deep-merge fields when both core and dict have translations for the same entry — combine all unique translation data from both sources
- Claude's discretion on which source takes priority for overlapping fields and whether to log conflicts

### Dict-only cleanup
- Delete de-nb-dict/ and de-en-dict/ directories after merging — no archiving needed (git history is backup)
- Find and update all codebase references to -dict/ paths as part of this phase (not deferred to Phase 22)
- Also clean up vocabulary/dictionary/de/ directory since merged banks now live under vocabulary/banks/de/
- Claude's discretion on whether to keep, regenerate, or remove the translation manifest.json in de-nb/

### Translation completeness
- Preserve all translations — dict-only entries (non-curriculum) keep their translations in merged directories
- Union of both sources — include any entry that has a translation in either core or dict
- Verify and report gaps: log any merged bank entries missing translations (informational, not blocking)
- Claude's discretion on whether to regenerate all 8 files consistently or keep core files as-is for banks without dict translations

### Claude's Discretion
- Merge priority strategy for overlapping fields
- Whether to log merge conflicts (based on data volume)
- New standalone script vs extending merge-banks.js
- Translation manifest.json handling
- File regeneration approach for banks with single-source translations

</decisions>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 21-translation-consolidation*
*Context gathered: 2026-02-23*
