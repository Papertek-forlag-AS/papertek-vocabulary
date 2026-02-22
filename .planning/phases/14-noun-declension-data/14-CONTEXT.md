# Phase 14: Noun Declension Data - Context

**Gathered:** 2026-02-22
**Status:** Ready for planning

<domain>
## Phase Boundary

Add complete 4-case (Nominativ, Akkusativ, Dativ, Genitiv) declension tables for all 331 German nouns in the core nounbank. Each case gets singular and plural sub-objects with separate article and noun fields. Covers n-Deklination nouns, plural-only nouns, uncountable nouns, and all regular patterns. Does NOT include syncing to dictionary banks or search index (that's Phase 15).

</domain>

<decisions>
## Implementation Decisions

### Legacy Migration
- Replace existing flat bestemt/ubestemt case format with new singular/plural sub-objects (clean break, one format)
- Migration happens as part of the same process that adds declension data (one script, not a separate prep step)
- Existing Norwegian bestemt/ubestemt translation data must NOT be destroyed — it lives elsewhere in the entry and will be needed for the future two-way dictionary milestone
- Design German declension data structure to not conflict with eventually adding Norwegian declension alongside it

### Article Representation
- Store article and noun as separate fields in each case entry (e.g., `{ article: "der", noun: "Hund" }`)
- Use canonical/normalized article forms (not display-ready strings, not full encoded keys)
- Indefinite plural handling: Claude's discretion (no plural indefinite article exists in German)

### Edge Case Handling
- Plural-only nouns (Eltern, Ferien): singular sub-object is null, plural sub-object has data
- Uncountable nouns (Obst, Wetter): plural sub-object is null, singular sub-object has data (symmetric pattern)
- Add `declension_type` field with detailed classification: strong, weak, mixed, plural-only, uncountable
- This replaces reliance on `weak_masculine: true` alone — declension_type provides richer categorization

### Data Entry Approach
- Follow Phase 13 pattern: prepare linguistically-reviewed declension data, inject via JS script
- Split nouns by declension pattern (regular, n-Deklination, mixed, irregular) — not by gender or all-at-once
- Reference sources: Claude's discretion (Duden, Wiktionary, linguistic knowledge)
- Validation via separate script (not built into injection script) — matches Phase 13 pattern with `npm run validate`

### Claude's Discretion
- Indefinite plural field handling (omit, null, or kein- forms)
- Exact canonical article format (article strings like 'der' vs encoded keys like 'def_nom_m')
- Reference sources for declension correctness
- Exact declension pattern groupings for batch processing

</decisions>

<specifics>
## Specific Ideas

- Phase 13 (Perfektum) pattern is the proven template: scripted data injection with linguist-reviewed data
- Schema already accepts singular/plural sub-objects on caseEntry (Phase 11)
- 11 n-Deklination nouns already flagged with weak_masculine: true (Phase 12)
- 223/331 nouns have existing cases in legacy flat format that need migration
- Validation should use existing `npm run validate:nouns` against updated noun.schema.json

</specifics>

<deferred>
## Deferred Ideas

- **True Two-Way Dictionary (future milestone):** Norwegian vocabulary entries with their own declension data (bestemt/ubestemt/cases), linked bidirectionally to German entries. Norwegian lookup becomes a first-class experience — clicking a Norwegian word shows Norwegian grammar data plus connection to the German entry. Current Phase 14 decisions should not preclude this future capability.

</deferred>

---

*Phase: 14-noun-declension-data*
*Context gathered: 2026-02-22*
