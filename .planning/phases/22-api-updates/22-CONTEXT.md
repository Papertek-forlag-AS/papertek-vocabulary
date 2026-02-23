# Phase 22: API Updates - Context

**Gathered:** 2026-02-23
**Status:** Ready for planning

<domain>
## Phase Boundary

Migrate both API versions (v1 and v2) to read exclusively from the new single-bank structure (vocabulary/banks/de/) and merged translation directories. Delete old vocabulary/core/de/ directory and remove migration scripts. Clean up all stale path references across the codebase.

</domain>

<decisions>
## Implementation Decisions

### V1 backward compatibility
- Internal-only API (single user) — strict byte-for-byte compatibility is not critical
- V1 is a candidate for deprecation in a future phase, but should remain functional for now
- Claude's discretion on response field handling (whether to strip extra fields or include enriched data from merged banks)
- Claude's discretion on compatibility strictness level

### V1 data source switch
- V1 handlers must switch to reading from vocabulary/banks/de/ (new merged location)
- V1 manifest handler should switch to vocabulary/banks/de/manifest.json
- Claude's discretion on curriculum filtering strategy (manifest IDs vs curriculum flag)
- Claude's discretion on whether v1 translation handler needs updates (may already be fine after Phase 21)

### Old path cleanup
- Delete vocabulary/core/de/ directory in this phase (after v1 switches to banks/de/)
- Find and update ALL codebase references to core/de/ paths (not just API handlers)
- Check and update vercel.json and routing configs if they reference stale data paths
- Remove merge-banks.js and merge-translations.js — one-time migration tools, git history preserves them
- Remove corresponding npm scripts (merge:banks, merge:translations)

### V2 handler changes
- V2 search handler likely needs path update to read from vocabulary/banks/de/search-index.json
- Claude's discretion on whether v2 lookup handler needs further changes (partially updated in Phase 21)
- Claude's discretion on v2 response fields (whether to expose new merged bank data)
- Claude audits all v2 handlers to determine what remains vs what was already done

### Claude's Discretion
- V1 response compatibility strictness and field handling
- Curriculum entry filtering approach for v1
- Whether v1 translation handler needs updating
- V2 response field scope
- Full audit of which v2 changes are already complete from Phases 20-21

</decisions>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches

</specifics>

<deferred>
## Deferred Ideas

- V1 API deprecation/removal — future phase

</deferred>

---

*Phase: 22-api-updates*
*Context gathered: 2026-02-23*
