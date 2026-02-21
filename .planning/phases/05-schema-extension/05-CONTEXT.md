# Phase 5: Schema Extension - Context

**Gathered:** 2026-02-21
**Status:** Ready for planning

<domain>
## Phase Boundary

Extend adjective.schema.json with a declension block, exception flags (undeclinable, nicht_komparierbar), and grammar feature registration. The schema becomes the validated gate for all downstream data entry in Phases 6-8. No actual adjective data is written in this phase — only the schema and grammar feature definitions.

</domain>

<decisions>
## Implementation Decisions

### Declension nesting structure
- Nesting order: degree > article type > case > gender/number
- Path example: `declension.positiv.stark.nominativ.maskulin = "großer"`
- Superlativ contains only `schwach` (grammatically correct — superlative always uses weak declension)
- Positiv and komparativ contain all three: `stark`, `schwach`, `gemischt`
- Gender/number level: `maskulin`, `feminin`, `neutrum`, `plural` as peers (no separate singular/plural nesting)
- Leaf values are plain strings (the declined form), not objects

### Property naming convention
- German terms only throughout the declension block
- Article types: `stark`, `schwach`, `gemischt`
- Cases: `nominativ`, `akkusativ`, `dativ`, `genitiv`
- Degrees: `positiv`, `komparativ`, `superlativ`
- Gender/number: `maskulin`, `feminin`, `neutrum`, `plural`
- Clean up the existing comparison block: remove English aliases (`positive`, `comparative`, `superlative`) — only keep German terms (`positiv`, `komparativ`, `superlativ`)

### Flag interaction rules
- `undeclinable: true` — schema must forbid `declension` block. Validation catches mistakes (e.g., no declension data for lila)
- `nicht_komparierbar: true` — schema must forbid `comparison` block. No comparison data for absolute adjectives
- `nicht_komparierbar: true` — schema must enforce `declension` contains only `positiv` (no `komparativ`/`superlativ` degrees)
- Both flags are optional — omission means false. Normal adjectives carry neither flag

### Genitive toggle
- Add `grammar_adjective_genitive` as a new feature in grammar-features.json
- Depends on `grammar_adjective_declension` (user must enable declension before genitive toggle appears)
- Norwegian description: "Adjektivendelser i genitiv"
- English description: "Adjective endings in genitive case"
- `grammar_adjective_declension` is already registered (confirmed present) — no changes needed to it

### Claude's Discretion
- Whether to add a `dependsOn` field broadly to the grammar features schema or just as a one-off for the genitive toggle
- JSON Schema `$ref` structure and validation keyword choices
- How to implement the conditional validation (if/then/else vs oneOf for flag interaction)

</decisions>

<specifics>
## Specific Ideas

- Full example structure for a regular adjective (groß):
  ```json
  "declension": {
    "positiv": {
      "stark": {
        "nominativ": { "maskulin": "großer", "feminin": "große", "neutrum": "großes", "plural": "große" },
        "akkusativ": { ... },
        "dativ": { ... },
        "genitiv": { ... }
      },
      "schwach": { ... },
      "gemischt": { ... }
    },
    "komparativ": { ... },
    "superlativ": {
      "schwach": { ... }
    }
  }
  ```
- Non-comparable adjective (tot) carries `nicht_komparierbar: true`, declension has only `positiv`, no comparison block
- Undeclinable adjective (lila) carries `undeclinable: true`, no declension block at all

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 05-schema-extension*
*Context gathered: 2026-02-21*
