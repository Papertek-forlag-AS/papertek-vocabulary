# Milestones

## v1.0 — German Data Completeness (Shipped: 2026-02-20)

**Phases:** 2 | **Plans:** 1 (Phase 1 pre-GSD) | **Tasks:** 2
**Git range:** a3f2398 → 15aef56
**Data files:** 9,188 lines JSON (verbbank.json + nounbank.json)

**Key accomplishments:**
- All 29 German nouns with missing plurals patched (null for uncountable, correct forms for countable)
- All German noun entries have genus (m/f/n) and clean word fields (no article prefixes)
- All 148 German verbs now have preteritum conjugations with correct ablaut forms
- Modal verbs tagged with `verb_type: "modal"` and correct preteritum
- Separable prefix verbs store separated forms; reflexive verbs include pronouns
- Leksihjelp inflection search can now match German past-tense verb forms

**Requirements:** 5/5 satisfied (NOUN-01, NOUN-02, NOUN-03, VERB-01, VERB-02)

**Known tech debt:**
- 2 nouns with declension-based plural but no top-level `plural` field (product decision)
- 1 plural-only noun (leute_noun) without `genus` field (linguistically no gender)

**Archive:** `.planning/milestones/v1.0-ROADMAP.md`, `.planning/milestones/v1.0-REQUIREMENTS.md`

**Last phase number:** 2

---
