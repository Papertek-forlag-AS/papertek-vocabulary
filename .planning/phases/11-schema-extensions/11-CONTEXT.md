# Phase 11: Schema Extensions - Context

**Gathered:** 2026-02-22
**Status:** Ready for planning

<domain>
## Phase Boundary

Extend verb and noun JSON schemas to accept Perfektum and 4-case declension fields; register two new grammar features. No actual data population — just schema changes and feature registration.

</domain>

<decisions>
## Implementation Decisions

### Perfektum data shape
- `former` holds **full compound forms**: `"ich": "habe gemacht"` (not just the conjugated auxiliary)
- `participle` stored separately as a string (e.g., `"participle": "gemacht"`)
- `auxiliary` stored as string: `"haben"`, `"sein"`, or `"both"`
- Dual-auxiliary verbs (~6): single `former` block using the more common auxiliary, with `dual_auxiliary: true` flag
- `auxiliary_note` is an **object** keyed by auxiliary: `{ "haben": "transitive use (...)", "sein": "intransitive movement (...)" }`
- `modal_note` is a **string** explaining Ersatzinfinitiv behavior (only on modal verbs)
- `former` for modals contains the standard participle form (e.g., `"habe gekonnt"`), with `modal_note` explaining the alternative

### Case entry structure
- **Replace** existing flat `bestemt`/`ubestemt` with new `forms` wrapper — no additive coexistence
- `forms` contains `singular` and `plural` sub-objects, each with `definite`/`indefinite` string values
- Plural-only nouns: `singular: null`, plural populated
- Uncountable nouns: `plural: null`, singular populated
- Both `singular` and `plural` always present (null when inapplicable)
- `forms` sits inside the case entry alongside `intro` and `feature`
- Existing nominativ-only case data will be migrated to the new structure in Phase 14

### Grammar feature naming
- `grammar_noun_declension`: name "Kasusboyning", nameEn "Noun Declension", description "Kasusboyning av substantiv (nominativ, akkusativ, dativ, genitiv)"
- `grammar_genitiv`: name "Genitiv", nameEn "Genitive Case", description "Genitivboyning av substantiv (des/der/des)", **dependsOn** `grammar_noun_declension`
- Progressive disclosure works: existing per-case features (grammar_accusative_indefinite, grammar_dative, etc.) continue to control individual case visibility; grammar_noun_declension is the "full view" toggle

### Field naming language
- New case sub-objects use **English naming**: `singular`/`plural` and `definite`/`indefinite`
- Existing `declension` field (Norwegian-style number forms) will also be migrated from `entall`/`flertall`/`bestemt`/`ubestemt` to `singular`/`plural`/`definite`/`indefinite` — migration happens in Phase 14
- Schema should support both naming conventions during transition (already does)

### Claude's Discretion
- `dataPath` values for the two new grammar features
- `appliesTo` and `category` for the two new grammar features
- Whether to remove Norwegian-named schema aliases after migration or keep both permanently

</decisions>

<specifics>
## Specific Ideas

- Progressive case disclosure is important: students must be able to enable only nominativ + akkusativ without seeing dativ/genitiv. The per-case feature system already supports this.
- The `grammar_genitiv` depends on `grammar_noun_declension` (same pattern as `grammar_adjective_genitive` depends on `grammar_adjective_declension`)

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 11-schema-extensions*
*Context gathered: 2026-02-22*
