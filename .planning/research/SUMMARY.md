# Project Research Summary

**Project:** Papertek Vocabulary API — v1.2 German Perfektum & Noun Declension
**Domain:** Additive JSON data milestone on a deployed Vercel serverless vocabulary API
**Researched:** 2026-02-22
**Confidence:** HIGH

## Executive Summary

This is a data-and-schema milestone, not a new product build. The v1.1 system is fully deployed and working: Vercel edge functions serving zero-runtime-dependency JSON banks for German vocabulary, with ajv schema validation and a search index already in place. v1.2 adds two bounded, well-understood grammar datasets — Perfektum conjugations for 148 verbs and full 4-case noun declension for 331 nouns — using the same patterns established by the adjective declension work in v1.1. No new technologies, no new API endpoints, and no new infrastructure are required.

The recommended approach is schema-first, data-second, index-last. Extend verb.schema.json and noun.schema.json before any data entry to catch structural errors early, then build Perfektum data (simpler: one auxiliary + one participle per verb) in parallel with noun declension (heavier: ~5,296 cells across all cases), then rebuild the search index as a final derived artifact. Critically, all data changes must cascade to both the core bank (serving Leksihjelp v1 inflection) and the dictionary bank (serving v2 lookup) simultaneously — the existing preteritum sync gap (preteritum data confirmed absent from the dictionary bank for all 148 verbs) demonstrates the cost of breaking this rule.

The principal risks are concentrated in the data entry phases, not the code. German grammar has enough irregularities — separable verb ge- position, inseparable prefix no-ge- rule, n-Deklination weak masculine nouns, dual-auxiliary verbs, modal Ersatzinfinitiv, dative plural -n suppression for -s plurals — that any algorithmic generation will silently produce wrong forms for 15–25% of entries. The proven mitigation, established by adjective declension in v1.1, is explicit storage for every form. A second high-risk decision is the noun `cases` schema structure: 223 nouns already have partial case data in a flat bestemt/ubestemt format; adding plural dimensions to the same key creates a structural conflict that must be resolved by schema design before any noun data is written.

## Key Findings

### Recommended Stack

The existing stack is entirely sufficient. Node.js 18+ (running 25.2.1 locally), JSON Schema 2020-12 via ajv@8.18.0 + ajv-formats@3.0.1, and plain JSON files are all already in place. Zero new packages, no build step changes, no new infrastructure.

**Core technologies:**
- Node.js ESM (`"type": "module"`): all data generation scripts and validation — already the runtime; built-in `fs` and `JSON` cover all needs
- JSON Schema 2020-12 via ajv@8.18.0: extend verb.schema.json and noun.schema.json for new fields — already the schema language, already installed
- JSON plain files: Perfektum and noun case data storage — existing data layer; API reads via `fs.readFileSync`; no database needed

**What does NOT change:** Vercel serverless functions, zero runtime dependencies, dual-bank file layout, search-index format, translation banks.

**New scripts needed (patterns already exist in `scripts/validate-adjectives.js`):**
- `scripts/validate-verbs.js` — mirrors `scripts/validate-adjectives.js` exactly
- `scripts/validate-nouns.js` — mirrors `scripts/validate-adjectives.js` exactly
- `scripts/build-search-index.js` — adds `pp` (past participle) field to verb entries and rebuilds the search index

### Expected Features

**Must have (table stakes — P1):**
- Past participle (Partizip II) per verb, stored explicitly in `conjugations.perfektum.participle` — 148 verbs; strong/mixed/separable/inseparable all irregular
- Auxiliary selection (haben/sein) per verb, stored as `conjugations.perfektum.auxiliary` — required for correct Perfektum display
- Full 6-pronoun Perfektum conjugation table per verb in `conjugations.perfektum.former` — matches presens/preteritum pattern exactly
- Noun nominativ: complete for all 331 nouns (223 already partial; 108 missing)
- Noun akkusativ: complete for all 331 nouns (186 already partial; 145 missing)
- Noun dativ: all 331 nouns (0 currently; entirely new data)
- Noun genitiv: all 331 nouns (0 currently; most irregular case, highest data entry burden)
- Search index: `pp` field added to 148 verb entries (enables past-participle lookup via v2 text search API)
- Dual-bank sync: all changes to both core and dictionary banks simultaneously

**Should have (P2 — quality and correctness):**
- Dual-auxiliary flag (`dual_auxiliary: true`) and `auxiliary_note` for ~6 verbs (ausziehen, fahren, fliegen, schwimmen, laufen, wegfahren)
- N-declension flag (`weak_masculine: true`) for 11 nouns (Affe, Hase, Löwe, Neffe, Bär, Elefant, Mensch, Morgenmensch, Klassenkamerad, Superheld, Nachbar)
- Grammar feature registration: `grammar_noun_declension` (unified) and `grammar_genitiv` added to grammar-features.json

**Defer (v1.2+ or v2+):**
- Verbphrase Perfektum (Rad fahren, Gassi gehen) — inflection search for phrases not supported; add only if users report confusion
- Modal Perfektum standalone forms — document with `modal_note` but do not build full paradigm
- Subjunctive II (Konjunktiv II) — separate B1+ milestone
- Futur I — separate milestone

### Architecture Approach

The architecture is entirely additive: no new endpoints, no new files, no new services. Existing JSON banks get new fields; existing schemas get new optional properties; the v2 lookup handler gets 4–5 new lines for noun declension feature detection; the search index gets a `pp` field on verb entries. All other API behavior is automatic passthrough — `entry.conjugations` and `entry.cases` are already passed through unchanged by the v2 handler (lines 218 and 213 respectively), and the v1 core handler passes through everything automatically.

**Major components and their v1.2 changes:**
1. `vocabulary/schema/verb.schema.json` — add optional `auxiliary` (enum: haben/sein/both), `participle` (string), `auxiliary_note` (object keyed by language code) to `tenseConjugation` $def
2. `vocabulary/schema/noun.schema.json` — add optional `singular`/`plural` sub-objects (each with `definite`/`indefinite` strings) to `caseEntry`; add `caseNumberForms` $def; retain existing flat `bestemt`/`ubestemt` for backward compatibility
3. `vocabulary/core/de/verbbank.json` + `vocabulary/dictionary/de/verbbank.json` — add `conjugations.perfektum` block to all 148 entries (both banks simultaneously)
4. `vocabulary/core/de/nounbank.json` + `vocabulary/dictionary/de/nounbank.json` — extend `cases` to full 4-case singular/plural structure for all 331 entries (both banks)
5. `vocabulary/grammar-features.json` — add `grammar_noun_declension` and `grammar_genitiv` features
6. `api/vocab/v2/lookup/[language]/[wordId].js` — add `grammar_noun_declension` and `grammar_genitiv` feature detection (4–5 lines; perfektum detection already present at line 234)
7. `vocabulary/dictionary/de/search-index.json` — add `pp` field to verb entries; rebuild after all data is final

**Data flow for inflection search:** Leksihjelp fetches the full v1 core bank, indexes participles and declined noun forms client-side, and resolves inflected forms to base entry IDs. The search index `pp` field additionally enables past-participle lookup via the v2 text search API. Declined noun forms are NOT added as separate search index entries — they are handled client-side from the full bank.

### Critical Pitfalls

The research identified 13 specific pitfalls. The top 5 requiring pre-emptive phase-level action:

1. **Noun `cases` schema structural conflict** — 223 nouns have existing `cases.nominativ.bestemt` (a string) that cannot coexist with a new `cases.nominativ.singular` (an object) without breaking existing clients. Resolution: add `singular`/`plural` sub-objects ALONGSIDE the existing flat fields (additive approach), never replace them. This decision must be made and codified in the schema before any noun data entry begins. Recovery cost if deferred is HIGH (migration of 223 entries plus grammar-features.json dataPath updates).

2. **Separable verb ge- position error** — 19 separable verbs have ge- inserted between prefix and stem (aufgestanden, mitgenommen, eingekauft), not before the prefix. Any script prepending ge- to the full infinitive produces wrong forms for all 19. Prevention: store every participle explicitly; no algorithmic generation for any verb category.

3. **Inseparable prefix verbs given spurious ge-** — 20 verbs with be-, ver-, er-, ent-, ge- prefixes take no ge- in the past participle (besucht, vergessen, bekommen). The schema has no `inseparable: true` flag yet. Add the flag during schema extension and mark all 20 verbs before any participle data entry.

4. **N-Deklination nouns declined as strong masculine** — 11 nouns (Bär, Elefant, Mensch, Löwe, Affe, etc.) take -(e)n endings in all non-nominative cases. A generation script without a `weak_masculine: true` flag produces "des Bärs" (wrong) instead of "des Bären". The flag must be added to the schema and applied to all 11 nouns before noun declension data entry.

5. **Dual-bank sync failure compounding pre-existing debt** — preteritum data is confirmed absent from `vocabulary/dictionary/de/verbbank.json` for all 148 verbs, even though the core bank has it. If Perfektum follows the same pattern, the v2 lookup API will never return Perfektum data. Prevention: write every data change to both banks in the same commit; audit the dictionary bank as the first action of the Perfektum data phase.

## Implications for Roadmap

Based on research, suggested phase structure:

### Phase 1: Schema Extensions + Grammar Features Registry
**Rationale:** Schema defines the structural contract. Every subsequent data phase validates against these schemas. The noun `cases` structural conflict — the highest-risk decision in the milestone — must be resolved here before any data is written. The `inseparable: true` verb flag and `weak_masculine: true` noun flag must exist before generation scripts run.
**Delivers:** Updated verb.schema.json (auxiliary, participle, auxiliary_note optional fields in tenseConjugation; entry-level inseparable flag); updated noun.schema.json (singular/plural sub-objects additive in caseEntry; weak_masculine flag); two new grammar features registered in grammar-features.json (grammar_noun_declension, grammar_genitiv).
**Addresses:** Schema foundation for both Perfektum and noun declension; inseparable prefix flag (Pitfall 3); weak masculine noun flag (Pitfall 7); dual-auxiliary flag (Pitfall 1); noun cases structural conflict resolution (Pitfall 8).
**Avoids:** Schema validation failures blocking data entry; structural migrations mid-milestone.

### Phase 2: Pre-Entry Data Audit and Cleanup
**Rationale:** Before data entry begins, known data quality issues must be resolved. Plural markers like "(ingen flertall)" must become `null`. The 11 n-Deklination nouns must be flagged `weak_masculine: true`. The 19 separable and 20 inseparable verbs must be flagged. The dictionary verbbank preteritum gap must be assessed — the team must explicitly decide: backfill preteritum to the dictionary bank now (recommended) or formally defer to v1.3.
**Delivers:** Normalized nounbank with `plural: null` for all uncountable nouns; `weak_masculine: true` applied to 11 nouns; `inseparable: true` applied to 20 verbs; `separable: true` confirmed on 19 verbs; explicit written decision on preteritum dictionary bank backfill.
**Avoids:** Plural-only and uncountable nouns given wrong forms (Pitfall 10); n-Deklination error (Pitfall 7); inseparable prefix error (Pitfall 3); preteritum sync debt compounding for Perfektum (Pitfall 11).

### Phase 3: Perfektum Data — Core Verbbank
**Rationale:** Perfektum is the simpler of the two data tracks. Each verb needs one auxiliary choice and one past participle — the 6 conjugated forms derive mechanically from those two values. Process by group to ensure correct handling: (1) sein/haben/werden first (most irregular participles — mandatory test cases); (2) modals (7 entries — special handling, store modal_note); (3) separable verbs (19 — ge- between prefix and stem); (4) inseparable verbs (20 — no ge-); (5) reflexive verbs (26 — pronoun agreement per person); (6) verbphrases (4 — outside main loop, manually); (7) remaining regular verbs. Validate against updated verb.schema.json after each group.
**Delivers:** `conjugations.perfektum` block (auxiliary, participle, former x6, feature) in all 148 core verbbank entries; `npm run validate:verbs` passing.
**Avoids:** Sein/haben/werden irregular participles (Pitfall 12); separable ge- position (Pitfall 2); inseparable spurious ge- (Pitfall 3); modal Ersatzinfinitiv confusion (Pitfall 4); reflexive pronoun agreement errors (Pitfall 5); verbphrase errors (Pitfall 6).

### Phase 4: Perfektum Data — Dictionary Verbbank Sync + Search Index
**Rationale:** Dual-bank sync is a hard constraint, made explicit as its own phase to prevent it from being treated as an afterthought. The dictionary verbbank is what the v2 lookup API reads. The search index rebuild adds the `pp` field to verb entries and is done immediately after the dictionary bank is finalized (search index is derived from the dictionary bank).
**Delivers:** `conjugations.perfektum` mirrored to all 148 curriculum entries in `vocabulary/dictionary/de/verbbank.json`; `npm run validate:verbs` passing on the dictionary bank; `pp` field added to verb entries in `vocabulary/dictionary/de/search-index.json`; both search-index.json and search-index.pretty.json updated.
**Avoids:** Dictionary bank sync failure (Pitfall 11); search index omission; Vercel CDN cache confusion (deploy and purge immediately after this phase).

### Phase 5: Noun Declension — Core Nounbank
**Rationale:** Noun declension is the heaviest data task: 331 × 16 cells = 5,296 cells. Process in sub-groups: (1) plural-only nouns (Eltern, Ferien — plural forms only); (2) uncountable nouns (singular only); (3) n-Deklination nouns (-(e)n endings in all non-nominative cases); (4) -s plural nouns (26 entries — dative plural = nominative plural, no -n suffix); (5) standard nouns by gender. Add `singular`/`plural` sub-objects alongside existing flat `bestemt`/`ubestemt` on nominativ — do not remove existing data. Validate against updated noun.schema.json after each sub-group.
**Delivers:** Full 4-case singular/plural structure added to `cases` for all 331 core nounbank entries; existing flat nominativ data preserved unchanged; `npm run validate:nouns` passing.
**Avoids:** N-Deklination error (Pitfall 7); dative plural -n on -s nouns (Pitfall 9); plural-only/uncountable wrong forms (Pitfall 10); noun cases structural conflict (Pitfall 8 — resolved by additive approach from Phase 1).

### Phase 6: Noun Declension — Dictionary Nounbank Sync + v2 Handler Update
**Rationale:** Mirror noun cases to the dictionary bank (331 entries within the 1,641-entry dictionary nounbank, identified by curriculum flag). Update the v2 lookup handler with noun declension feature detection (4–5 lines). Run `npm run validate:nouns` on both banks.
**Delivers:** Full declension data in `vocabulary/dictionary/de/nounbank.json`; v2 lookup handler at `api/vocab/v2/lookup/[language]/[wordId].js` emitting `grammar_noun_declension` and `grammar_genitiv` feature flags when data is present; both nounbanks validated.
**Avoids:** v2 API missing noun declension data; dictionary bank sync failure pattern.

### Phase 7: Integration Verification
**Rationale:** End-to-end spot-checks confirm the full data flow from Leksihjelp inflection search through the v1 core bank to base entry resolution, and from the v2 lookup API through the dictionary bank to grammar feature emission. This phase catches integration failures that unit-level schema validation does not catch (e.g., a field present in core but absent in dictionary, or a feature flag path that doesn't match the actual data structure).
**Delivers:** Verified integration for 5+ verbs across categories (strong, weak, separable, inseparable, reflexive, dual-auxiliary); verified integration for 5+ nouns across categories (masculine, feminine, neuter, n-Deklination, uncountable); explicit confirmation that `grammar_perfektum` and `grammar_noun_declension` feature flags appear in v2 lookup responses.
**Avoids:** Silent integration failures; CDN cache confusion (confirm purge after final deploy).

### Phase Ordering Rationale

- Schema-first is mandatory: the noun `cases` structural conflict and the missing `inseparable`/`weak_masculine` flags must be resolved before any data generation runs. Discovering these constraints mid-entry requires HIGH-cost migration.
- Perfektum (Phases 3–4) and noun declension (Phases 5–6) are independent data tracks after Phase 1–2 completion. They can be executed in parallel if resources allow, or sequentially. Sequential is recommended to reduce cognitive load.
- Search index rebuild (end of Phase 4) follows dictionary bank finalization — it is a derived artifact and rebuilding it mid-milestone wastes work.
- Each data phase ends with schema validation before the next phase begins — errors caught early have LOW recovery cost; errors found post-integration have HIGH recovery cost.
- Integration verification (Phase 7) is always last: it confirms the full system, not individual components.

### Research Flags

Phases with standard patterns — no additional research needed during planning:
- **Phase 1 (Schema Extensions):** JSON Schema 2020-12 extension patterns are well-documented; codebase has working examples in adjective.schema.json and noun.schema.json.
- **Phase 4 (Verbbank Sync + Search Index):** Mechanical copy following established dual-bank pattern; search index `pp` field addition follows existing entry structure.
- **Phase 6 (Nounbank Sync + Handler):** 4–5 lines of handler code following the exact pattern of existing `grammar_perfektum` detection at line 234.

Phases requiring careful per-item verification during execution (grammar knowledge required, not additional research):
- **Phase 3 (Perfektum data):** All 7 modals, 19 separable verbs, 20 inseparable verbs, and 26 reflexive verbs must be individually verified — Duden is the reference for irregular participles. No generation script should be trusted without spot-check against Duden for each group.
- **Phase 5 (Noun declension data):** The 11 n-Deklination nouns and 26 -s plural nouns require explicit per-noun attention. Genitive singulars for strong masculines and neuters must be individually verified (-(e)s endings vary: des Mannes vs. des Autos).

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Direct codebase inspection; no inference; zero new technologies; all version numbers confirmed by inspection |
| Features | HIGH | German grammar is a stable, well-documented domain; feature set is bounded and fully verified against current bank state (148 verbs, 331 nouns) |
| Architecture | HIGH | All findings from direct codebase inspection of all API handlers, schemas, and bank files; all integration points verified; no external API dependencies |
| Pitfalls | HIGH | Combination of direct codebase inspection (confirmed preteritum sync gap, confirmed schema conflict, confirmed missing flags) and German grammar expertise (ge- rules, n-Deklination, auxiliary selection, dative plural -n exception) |

**Overall confidence:** HIGH

### Gaps to Address

- **Noun `cases` structural decision:** Research identifies the conflict and recommends the additive approach. This decision must be written into Phase 1 as the first act before any noun schema work begins. The roadmapper should flag this as an explicit decision gate, not an implementation detail.

- **Preteritum dictionary bank backfill:** The existing preteritum data gap in the dictionary verbbank is confirmed. The team must decide during Phase 2 audit: backfill now (adds scope to v1.2) or formally defer with documentation (adds to v1.3 scope). This decision affects Phase 4 scope and should be recorded in PROJECT.md.

- **Modal Perfektum scope:** Research recommends storing standalone Perfektum forms (hat gekonnt) in `former` plus a `modal_note` about the Ersatzinfinitiv double-infinitive construction. The phase plan should specify whether möchten receives any `former` data at all (its standalone Perfektum "hat gemöcht" is non-standard). Resolve before Phase 3 begins.

- **Grammar feature IDs for nominativ and akkusativ:** grammar-features.json has `grammar_accusative_indefinite` and `grammar_accusative_definite` with `dataPath: "cases.akkusativ.ubestemt"` referencing the flat structure. If the additive approach is used, these existing paths continue to work. Confirm during Phase 1 schema work that no existing feature dataPath breaks.

## Sources

### Primary (HIGH confidence — direct codebase inspection, 2026-02-22)
- `vocabulary/core/de/verbbank.json` — 148 entries; presens + preteritum confirmed; 0 Perfektum; 7 modals, 19 separable, 26 reflexive, 20 inseparable-prefix verbs identified
- `vocabulary/dictionary/de/verbbank.json` — 679 entries; preteritum absent for all 148 shared verbs confirmed (sync debt)
- `vocabulary/core/de/nounbank.json` — 331 entries; 223 with nominativ; 186 with akkusativ; 0 dativ/genitiv; 25 uncountable; 2 plural-only; 26 with -s plural
- `vocabulary/dictionary/de/nounbank.json` — 1,641 entries; cases field confirmed
- `vocabulary/schema/verb.schema.json` — tenseConjugation has former + feature only; no auxiliary, participle, or inseparable fields
- `vocabulary/schema/noun.schema.json` — caseEntry has flat bestemt/ubestemt; no singular/plural nesting; structural conflict confirmed
- `vocabulary/grammar-features.json` — grammar_perfektum registered with correct dataPath; grammar_noun_declension absent; cases.akkusativ.ubestemt dataPath confirmed
- `api/vocab/v2/lookup/[language]/[wordId].js` — perfektum feature detection at line 234 already wired; cases passthrough at line 213 confirmed; noun declension feature detection absent
- `api/vocab/v1/core/[language].js` — passthrough architecture; new fields picked up automatically; no code change needed
- `vocabulary/dictionary/de/search-index.json` — 3,454 entries, 420 KB; no declined forms indexed; 1,641 noun entries, 679 verb entries (base forms only)
- `vocabulary/dictionary/verb-classification-de.json` — perfektum column already on all 148 verbs

### Secondary (HIGH confidence — established grammar references)
- German Perfektum auxiliary rules (haben/sein selection, dual-auxiliary verbs, Ersatzinfinitiv) — standard descriptive grammar; no ambiguity
- Participle formation rules (ge- prefix logic for separable/inseparable/-ieren verbs) — universal rules confirmed against Duden paradigm
- N-Deklination paradigm (Duden Grammatik §4) — closed set of rules; specific bank members identified by inspection
- Dative plural -n rule and -s exception — confirmed across deutsch.lingolia.com, gymglish.com, wisc.pb.unizin.org
- Noun case article tables (definite/indefinite by gender and case) — universally agreed upon; stable

---
*Research completed: 2026-02-22*
*Ready for roadmap: yes*
