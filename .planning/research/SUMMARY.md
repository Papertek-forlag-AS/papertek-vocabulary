# Project Research Summary

**Project:** Papertek Vocabulary API — v1.1 German Adjective Declension
**Domain:** JSON vocabulary data repo — additive grammar data milestone on a deployed system
**Researched:** 2026-02-20
**Confidence:** HIGH

## Executive Summary

This is a data-entry milestone, not a product build. The entire technology stack (Node.js ESM, Vercel serverless, JSON files, JSON Schema 2020-12) is already deployed and working. The v1.1 milestone adds German adjective declension tables and comparative/superlative stems to an existing 108-entry adjective bank, plus a one-time extraction of genuine adjectives from a 1,191-entry Goethe "other" bucket. No new infrastructure, no new API endpoints, and no new runtime dependencies are required. The recommended approach follows the exact precedent set by v1.0 preteritum conjugations: build a Node.js helper script to generate form data, hand-verify every irregular form individually, store explicit full forms (not derivation rules), and validate with ajv before committing.

The recommended delivery order is: extract new adjectives from the Goethe bucket first (to fix the final adjective count before any grammar data entry begins), extend the JSON Schema, stub new entries in both data banks, then enter comparison data and declension tables — with translations running in parallel with declension data entry. The single most important architectural insight is that declension data must be written to BOTH the core bank (read by the v1 API for Leksihjelp inflection search) and the dictionary bank (read by the v2 lookup API for detail views). Missing either file makes the feature partially broken.

The key risks are data quality risks, not technical risks: irregular stems (gut/besser/best-, viel/mehr/meist-, hoch/hoh-), indeclinable adjectives (lila, rosa, orange, cool, gern), problematic existing entries (beste_adj as a standalone entry, Lieblings- as a prefix stored in the adjective bank), and false positives from the Goethe extraction (adverbs, particles, parse artifacts). Every one of these is known and documented — prevention is a pre-data-entry cleanup checklist and a mandatory spot-check list during data entry, not additional technology.

---

## Key Findings

### Recommended Stack

The stack is entirely fixed by the existing system. No new decisions are needed. Node.js >= 18.0.0, Vercel serverless functions, and JSON files as the data layer are the only technologies involved. The only optional addition is ajv 8.18.0 + ajv-formats 3.0.1 as devDependencies if a `npm run validate:adjectives` script is written — these are the correct versions as of 2026-02-20 and compatible with JSON Schema 2020-12. Adding them is recommended but not blocking.

**Core technologies:**
- Node.js >= 18.0.0 (ESM): All scripting (helper scripts, classification script, validation) — already the runtime, no additions needed
- JSON (plain files): All data storage in adjectivebank.json files — unchanged data layer
- JSON Schema 2020-12: Schema validation for the adjective.schema.json extension — already in use throughout the project
- ajv 8.18.0 (devDependency): Optional validation script to catch malformed declension tables pre-commit — add if writing `validate:adjectives`

**What NOT to use:** No database, no TypeScript compilation, no LLM API calls at runtime, no npm libraries for German grammar, no Python scripts. The project constraint of zero runtime dependencies should be maintained.

For full details: `.planning/research/STACK.md`

### Expected Features

The milestone goal is inflection search: a student reading "Das ältere Auto" can look up "ältere" and resolve it to the base entry "alt". This requires full declension tables per adjective, stored as structured JSON. The research identifies a clean P1/P2/P3 priority split.

**Must have (table stakes — P1):**
- Adjective extraction from generalbank "other" wordlist — expands the bank before grammar data entry
- Norwegian (nb) and English (en) translations for all newly extracted adjectives — required for Leksihjelp display
- Comparative and superlative stems for all adjectives — unlocks inflection search on compared forms
- Adjective schema extension with `declension` block — required gate for all declension data
- Positiv declension tables (stark/schwach/gemischt, 4 cases, 4 gender/number) for all adjectives — the core milestone goal

**Should have (P2, add within v1.1 if possible):**
- `undeclinable: true` flag on lila, rosa, orange, cool, gern — prevents phantom index entries
- `nicht_komparierbar` flag for participial adjectives that don't form comparatives (überrascht, gespannt, bewölkt)
- `intro` field on declension block — mirrors existing verb conjugation progressive disclosure pattern

**Defer (v1.x and later):**
- Comparative/superlative declension tables — only if Leksihjelp inflection search shows need after v1.1
- Genitive case declension — A1/A2 learners rarely encounter genitive adjective forms
- Noun full case declension tables and German Perfektum conjugations — out of scope (v2+)

**Key anti-features to avoid:** Do not store full inflected forms (data balloons 6x with redundancy); do not attempt automated adjective extraction without human review; do not generate declension for genitive as a first pass.

For full details: `.planning/research/FEATURES.md`

### Architecture Approach

The architecture requires no new components. Seven existing files are modified; one (grammar-features.json) already has the `grammar_adjective_declension` feature registered and needs no change. The v1 core API passes through all fields automatically — no code change needed for inflection search. The only required API code change is two lines in the v2 lookup handler to expose `declension` in the rich response.

The critical structural decision: declension data lives in BOTH `vocabulary/core/de/adjectivebank.json` (for Leksihjelp v1 inflection search) AND `vocabulary/dictionary/de/adjectivebank.json` (for v2 detail view). The precedent from nounbank.json confirms this dual-storage pattern. The JSON structure uses nested named objects following the verb conjugation precedent: `declension.positiv.stark.nominativ.maskulin = "alter"`. Superlativ stores only `schwach` declension (grammatically correct — superlatives require a definite article). This reduces per-adjective cell count from 144 to 112.

**Major components and their changes:**

1. `vocabulary/core/de/adjectivebank.json` — MODIFIED: add `comparison` and `declension` to all 108 existing entries; add new extracted entries
2. `vocabulary/dictionary/de/adjectivebank.json` — MODIFIED: mirror grammar data + add new entries with curriculum/cefr/frequency metadata
3. `vocabulary/schema/adjective.schema.json` — MODIFIED: add `declension` $defs (declinedDegree, declinedDegreeSuperlativ, caseBlock, genderBlock)
4. `vocabulary/translations/de-nb/adjectivebank.json` and `de-en/adjectivebank.json` — MODIFIED: add translations for new entries
5. `vocabulary/dictionary/de/search-index.json` — MODIFIED: rebuild after new entries added
6. `api/vocab/v2/lookup/[language]/[wordId].js` — MODIFIED: expose `declension` field; push `grammar_adjective_declension` to grammarFeatures array

For full details: `.planning/research/ARCHITECTURE.md`

### Critical Pitfalls

Research identified 12 specific pitfalls. The top 6 that require pre-emptive phase-level action:

1. **"hoch" stem changes to "hoh-" before endings** — store an `attributiv_stem` field; all declined forms built from it, not the base word. Spot-check: "hohem" must appear, "hochem" must not.

2. **Indeclinable adjectives (lila, rosa, orange, cool) and non-attributive "gern" given declension tables** — add `indeclinable: true` flag to schema and these entries BEFORE running any declension generation. The flag must cause the generation script to skip these entries.

3. **Suppletive comparatives computed formulaically** — gut, viel, gern have no stem relationship to their comparatives (besser, mehr, lieber). Process these first, verify individually. Mandatory spot-check list analogous to the preteritum sein/gehen spot-checks.

4. **"beste_adj" standalone entry collides with gut's superlative** — check all curriculum manifests for "beste_adj" before adding comparison data to "gut". If it appears in curricula, document the intentional duplication; if not, remove it.

5. **Goethe "other" bucket extracts false adjectives and duplicates** — 262 entries appear across multiple CEFR levels; many existing bank adjectives appear in the bucket. Extraction must deduplicate first, then cross-reference the 108-entry bank, then apply the "ein ___er Mann" attributive test for each candidate. Expected yield: 60–100 genuinely new adjectives.

6. **Schema declares `"required": ["translations"]` but 0 of 108 entries have a translations field** — ajv validation will fail on every existing entry. Fix schema (make translations optional) before writing any validation scripts.

For full details: `.planning/research/PITFALLS.md`

---

## Implications for Roadmap

The architecture research provides a concrete 8-phase build order with clear dependencies. The roadmap should follow this structure directly. Phases 5, 6, and 7 can run in parallel after their shared dependency (Phase 3) completes.

### Phase 1: Pre-entry Cleanup

**Rationale:** Two existing data quality issues (beste_adj collision risk, Lieblings- as a non-adjective in the bank) must be resolved before any grammar data is written, or they corrupt the generation step. Schema must also be corrected (translations required → optional) before any validation scripts run.
**Delivers:** A clean adjective bank with accurate schema, no orphan entries, no mis-typed entries.
**Addresses:** Pitfalls 8 (beste_adj), 12 (Lieblings-), 9 (schema translations mismatch)
**Avoids:** Data corruption in downstream generation phases

### Phase 2: Goethe Adjective Extraction

**Rationale:** The complete adjective list must be fixed before grammar data entry begins. Starting grammar work on 108 entries, then discovering 40–80 more entries need to be added, forces rework on comparison and declension data. Fix the count first.
**Delivers:** A definitive list of new adjective entries (word + _id + CEFR source) — no bank file changes yet, just the curated list
**Addresses:** Adjective extraction feature (P1), Pitfall 5 (false positives), Pitfall 10 (duplicates)
**Avoids:** Rework caused by expanding the entry list mid-grammar-entry

### Phase 3: Schema Extension

**Rationale:** Schema defines the contract. Having schema in place before data entry means every entry can be validated during creation. Adding `indeclinable` and `nicht_komparierbar` flags here (before generation) ensures the generation script can act on them.
**Delivers:** Extended adjective.schema.json with declension $defs, `indeclinable` flag, `nicht_komparierbar` flag; ajv validation script passing on existing bank
**Addresses:** Schema extension feature (P1 gate), Pitfall 2 (indeclinable flag), Pitfall 7 (participial adjectives), Pitfall 9 (schema repair)
**Avoids:** Schema validation failures blocking data entry; generating wrong forms for indeclinable entries

### Phase 4: New Entry Stubs

**Rationale:** Translation and declension data are keyed by `_id`. IDs must exist in both banks before translation authors or grammar data scripts can reference them.
**Delivers:** Bare minimum entries (word, _id, audio placeholder, curriculum, cefr, frequency) in both core and dictionary banks for newly extracted adjectives
**Addresses:** New entries feature (prerequisite for all downstream grammar and translation work)
**Avoids:** ID-reference errors in translations and grammar data phases

### Phase 5: Comparison Data

**Rationale:** Comparative stems are inputs to comparative declension generation. Populating and validating comparison data separately from the 144-cell declension table allows incremental verification. Irregular forms (gut, viel, gern, hoch) are processed first.
**Delivers:** `comparison.komparativ` and `comparison.superlativ` for all adjectives in core bank; all irregular forms individually verified
**Addresses:** Comparison feature (P1), Pitfall 3 (suppletive comparatives), Pitfall 7 (nicht_komparierbar participials)
**Avoids:** Silent errors in comparative stems propagating into comparative declension tables

### Phase 6: Declension Tables

**Rationale:** The largest data entry task. Comparison stems (Phase 5) are inputs for comparative and superlative declined forms. All entry IDs must exist (Phase 4). Generate using a Node.js helper script (stem + standard ending table), then verify irregular entries individually.
**Delivers:** Full `declension` object for all adjectives in both core and dictionary banks; 112 cells per adjective (positiv stark/schwach/gemischt + komparativ stark/schwach/gemischt + superlativ schwach)
**Addresses:** Declension tables feature (P1 — core milestone goal), Pitfall 1 (hoch stem), Pitfall 6 (teuer elision)
**Avoids:** Anti-patterns from ARCHITECTURE.md (storing only in dictionary bank, generating without verifying irregular stems)

### Phase 7: Translations for New Entries (parallel with Phase 6)

**Rationale:** Translations depend only on entry IDs (established in Phase 4), not on declension data. Can run concurrently with Phase 6 to compress timeline.
**Delivers:** Norwegian (de-nb) and English (de-en) translation entries for all newly extracted adjectives
**Addresses:** Translations feature (P1)
**Avoids:** Missing translations blocking Leksihjelp display of new entries

### Phase 8: Search Index Rebuild and API Code Change

**Rationale:** The search index is a derived artifact — rebuild after all new entries are in the dictionary bank. The API code change (two lines in v2 lookup handler) is last because the data must exist before the code change is meaningful.
**Delivers:** Rebuilt search-index.json with new adjective entries; v2 lookup API exposing `declension` field and `grammar_adjective_declension` grammar feature
**Addresses:** Search visibility of new adjectives; v2 rich response completeness
**Avoids:** Anti-Pattern 4 (adding declension cells to search index — do not do this)

### Phase Ordering Rationale

- **Cleanup before extraction:** Data quality issues in the existing bank corrupt downstream generation if not resolved first
- **Extraction before grammar data:** Fixing the entry count before grammar entry eliminates rework
- **Schema before data:** Enables validation during entry, not after
- **Comparison before declension:** Comparative stems are inputs to comparative declined forms
- **Translations and declension in parallel:** No dependency between them beyond entry IDs; parallelizing compresses the critical path
- **Search index and API last:** Both are derived artifacts that require all data to be stable

### Research Flags

Phases with established patterns — standard implementation, no additional research needed:
- **Phase 1 (Cleanup):** Curriculum manifest grep and schema field removal — straightforward
- **Phase 3 (Schema):** Modeled directly on noun.schema.json `cases` block and verb conjugation precedent
- **Phase 7 (Translations):** Established pattern from existing 108 entries
- **Phase 8 (Search + API):** Two-line API change; search index rebuild script already exists

Phases that may benefit from targeted research during planning:
- **Phase 2 (Extraction):** The actual content of the Goethe "other" bucket should be reviewed manually before the phase plan is written. The research estimates 60–100 new adjectives but this should be confirmed by counting candidates before scope is set.
- **Phase 6 (Declension):** Before writing the helper script, confirm with the Leksihjelp codebase which field names it reads when building its inflection index. If Leksihjelp has not yet been updated to read `declension`, the data format must match what Leksihjelp expects, not just what the schema defines.

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Direct codebase inspection; version numbers verified via npm; no decisions needed beyond optional ajv devDependency |
| Features | HIGH | German adjective declension grammar is stable and well-documented; feature scope derived from direct codebase inspection (108 entries, existing schema, grammar-features.json); irregular adjective list is a closed set |
| Architecture | HIGH | All findings from direct codebase inspection; dual-bank pattern confirmed from nounbank.json precedent; 8-phase build order derived from verified data dependencies |
| Pitfalls | HIGH | 12 pitfalls identified from codebase analysis + German grammar expertise; each has a verified source (entry in adjectivebank.json, schema inspection, or grammar rule) |

**Overall confidence:** HIGH

### Gaps to Address

- **Leksihjelp field name confirmation:** The PITFALLS and ARCHITECTURE research flag that Leksihjelp must be confirmed to index the `comparison` and `declension` fields by those exact names. If Leksihjelp uses different field names or has not yet been updated to read declension data, the data schema shape must be coordinated before data entry begins. Recovery from a field name mismatch is HIGH cost (requires Leksihjelp code change out of scope for this repo). Confirm before Phase 3.

- **Extraction candidate count:** The estimate of 60–100 new adjectives from the Goethe "other" bucket is based on heuristics. The actual count should be verified by running a cross-reference of the 1,191 entries against the 108-entry bank and applying the "ein ___er Mann" test to candidates before the Phase 2 scope is locked. This affects Phase 4 (stub count), Phase 6 (declension entry volume), and Phase 7 (translation entry volume).

- **"beste_adj" curriculum status:** Whether this entry should be removed or retained depends on whether it appears in curriculum manifests. This must be checked (grep) before Phase 1 cleanup is finalized. Not a blocker for research, but must be resolved before Phase 5 (comparison data for gut).

- **Leksihjelp CDN cache:** The Vercel CDN uses s-maxage=86400 (24-hour cache). After deploying declension data, Leksihjelp integration must account for up to 24 hours before the new data is visible to end users unless the CDN is purged manually.

---

## Sources

### Primary (HIGH confidence)

- Direct codebase inspection — `vocabulary/core/de/adjectivebank.json` (108 entries), `vocabulary/dictionary/de/adjectivebank.json`, `vocabulary/dictionary/de/nounbank.json`, `vocabulary/core/de/verbbank.json`, `vocabulary/schema/adjective.schema.json`, `vocabulary/grammar-features.json`, `api/vocab/v2/lookup/[language]/[wordId].js`, `api/vocab/v1/core/[language].js`
- Direct inspection of Goethe source files — `vocabulary/dictionary/sources/goethe-a1-words.json`, `goethe-a2-words.json`, `goethe-b1-words.json`
- `npm info ajv` and `npm info ajv-formats` — versions 8.18.0 and 3.0.1 confirmed as of 2026-02-20
- `.planning/milestones/v1.0-phases/02-add-german-preteritum-conjugations/` — preteritum architectural precedent

### Secondary (MEDIUM confidence)

- German adjective declension paradigm — standard descriptive grammar (Duden Grammatik, Dreyer/Schmitt, Hammer's German Grammar); declension endings are stable in modern standard German
- Irregular comparatives/superlatives — the suppletive set (gut/besser/best, viel/mehr/meist, hoch/höher/höchst, nah/näher/nächst) is a closed set in standard references
- Indeclinable adjective list — lila/rosa/orange/prima universally listed as indeclinable; gern treated as indeclinable for attributive use

### Tertiary (MEDIUM confidence — design decisions by analogy)

- `undeclinable: true` and `nicht_komparierbar` flags — design decision based on analogy with existing `preteritum_rare: true` pattern; not externally sourced but consistent with established codebase conventions
- `intro` field on declension block — pattern from verbbank `conjugations.preteritum.intro`; no external source needed

---
*Research completed: 2026-02-20*
*Ready for roadmap: yes*
