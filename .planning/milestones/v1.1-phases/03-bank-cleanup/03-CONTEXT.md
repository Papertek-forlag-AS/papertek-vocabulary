# Phase 3: Bank Cleanup - Context

**Gathered:** 2026-02-20
**Status:** Ready for planning

<domain>
## Phase Boundary

Resolve data quality issues in the existing adjective bank. Remove corrupt/misclassified entries, fix validation errors, and achieve zero schema validation errors on all remaining entries. No new data is added — this is strictly cleanup of what exists.

</domain>

<decisions>
## Implementation Decisions

### Problematic entries
- `beste_adj`: Remove entirely from the adjective bank. It's a superlative form of "gut" — the correct place for this data is the comparison block on "gut" in Phase 7.
- `Lieblings-`: Reclassify to another bank (not an adjective — it's a prefix). Claude determines the best destination bank based on existing bank structure.
- Any other non-adjectives discovered during cleanup: same treatment — reclassify to appropriate bank, don't just delete.

### Discovery policy
- Run both schema validation AND semantic checks (duplicates, misspelled German words, incorrect word forms).
- Schema failures: auto-fix and log every change in commit messages.
- Semantic issues (misspellings): auto-correct obvious cases and log every correction in commit messages.
- Unfixable entries (missing core data, completely garbled): remove them.

### Data preservation
- Git history is the archive — no separate archive files for removed/changed entries.
- All changes logged in commit messages (no separate changelog file).
- Final commit states the new entry count and summarizes what was removed/reclassified.
- Removals cascade across all banks: core bank, dictionary bank, AND translation files stay in sync.

### Claude's Discretion
- Destination bank for `Lieblings-` and any other reclassified entries
- Which fields count as "required" vs "optional" for this validation pass (guided by schema + translations-optional rule from success criteria)
- Order of operations for cleanup steps
- How to structure validation tooling (script vs manual)

</decisions>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 03-bank-cleanup*
*Context gathered: 2026-02-20*
