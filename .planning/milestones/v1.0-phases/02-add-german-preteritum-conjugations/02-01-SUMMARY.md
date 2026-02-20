---
phase: 02-add-german-preteritum-conjugations
plan: 01
subsystem: database
tags: [german, vocabulary, conjugations, preteritum, verbbank]

# Dependency graph
requires:
  - phase: 01-fix-german-noun-plurals
    provides: validated verbbank.json structure and JSON format conventions
provides:
  - Complete preteritum conjugations for all 148 German verbs in verbbank.json
  - Separable, reflexive, modal, weak, strong, and verbphrase patterns all covered
  - grammar_preteritum feature tag on every entry
  - verb_type: modal metadata on all 7 modal verbs
affects:
  - api serving verbbank.json (inflection search for past-tense forms)
  - Leksihjelp search (war -> sein, ging -> gehen, etc.)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Preteritum stored as conjugations.preteritum.former object with 6 pronoun keys (same shape as presens)"
    - "Separable verbs store full written forms with separated prefix at end (stand auf, not aufstand)"
    - "Reflexive verbs embed reflexive pronouns in conjugation values (wusch mich, freute sich)"
    - "preteritum_rare: true flag marks verbs where Perfekt dominates in spoken German"
    - "möchten uses wollte forms with preteritum_note explaining the substitution"

key-files:
  created: []
  modified:
    - vocabulary/core/de/verbbank.json

key-decisions:
  - "Strong verbs each looked up individually; no ablaut patterns applied formulaically"
  - "möchten given wollte forms (not mögen's mochte) since möchten is Konjunktiv II, not an independent verb"
  - "preteritum_rare applied to weak verbs and most reflexive/routine verbs where Perfekt dominates speech"
  - "hängen treated as strong (hing) since the intransitive sense (to hang) is strong; transitive sense is weak but less common in this context"
  - "wissen treated as mixed (wusste) - follows weak endings but historically strong"
  - "kennen treated as mixed (kannte) - Mischverb with weak preteritum endings"

patterns-established:
  - "Preteritum pronoun keys: ich, du, er/sie/es, wir, ihr, sie/Sie"
  - "feature tag value: grammar_preteritum"
  - "Separable verbs: prefix at string end with space separator"

requirements-completed:
  - VERB-01
  - VERB-02

# Metrics
duration: 12min
completed: 2026-02-20
---

# Phase 02 Plan 01: Add German Preteritum Conjugations Summary

**Preteritum conjugations for all 148 German verbs covering strong ablaut, modal, separable prefix, reflexive pronoun, weak -te, and verbphrase patterns — verified with 20 linguistic spot-checks**

## Performance

- **Duration:** 12 min
- **Started:** 2026-02-20T09:40:40Z
- **Completed:** 2026-02-20T09:52:26Z
- **Tasks:** 2
- **Files modified:** 1

## Accomplishments

- Added `conjugations.preteritum` to all 148 German verb entries in verbbank.json
- Strong/irregular verbs (sein->war, gehen->ging, kommen->kam, schreiben->schrieb, etc.) use correct ablaut forms looked up individually
- Modal verbs (können, müssen, dürfen, sollen, wollen, mögen, möchten) tagged with `verb_type: "modal"` and correct preteritum forms
- Separable prefix verbs store full separated written forms (stand auf, rief an, sah fern, schlief ein)
- Reflexive verbs embed reflexive pronouns in conjugation values (wusch mich, zog mich an, regte mich auf)
- Verbphrases conjugate only the verb component (fuhr Rad, ging Gassi, wurde fertig, blieb liegen)
- All 20 linguistic spot-checks pass with 0 errors; JSON valid; 0 verbs missing preteritum

## Task Commits

Each task was committed atomically:

1. **Task 1+2: Add preteritum conjugations to all 148 German verbs** - `9a15a41` (feat)

**Plan metadata:** (docs: complete plan — to follow)

## Files Created/Modified

- `vocabulary/core/de/verbbank.json` - All 148 verb entries extended with conjugations.preteritum; 1845 lines inserted

## Decisions Made

- Strong verbs each individually verified — no ablaut pattern extrapolation
- möchten uses wollte forms with `preteritum_note` (möchten is Konjunktiv II of mögen, has no independent preteritum)
- hängen conjugated as strong (hing/hingen) — intransitive sense "to hang" is strong in German
- wissen uses mixed form wusste (historically strong, modern weak endings)
- kennen uses kannte (Mischverb — mixed verb with weak preteritum)
- preteritum_rare: true applied to weak/colloquial verbs where Perfekt dominates spoken usage

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed 4 typos in pronoun forms introduced during data generation**
- **Found during:** Task 2 (linguistic verification)
- **Issue:** 4 incorrect forms: `antworten_verb` ihr="antworte tet" (space), `sich_vorbereiten_verb` du="bereitetes" (wrong ending), `sich_schminken_verb` ihr="schminkte euch" (wrong tense ending), `sich_aergern_verb`/`sich_aergern_ueber_verb` ihr="ärgert euch" (present-tense form)
- **Fix:** Corrected to: antwortetet, bereitetest dich vor, schminktet euch, ärgerten euch / ärgerten euch über
- **Files modified:** vocabulary/core/de/verbbank.json
- **Verification:** Full verification suite re-run with 0 errors after fixes
- **Committed in:** 9a15a41 (part of task commit)

---

**Total deviations:** 1 auto-fixed (Rule 1 - Bug)
**Impact on plan:** All fixes necessary for linguistic correctness. No scope creep.

## Issues Encountered

None beyond the 4 minor typos auto-fixed during verification.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- verbbank.json now contains complete preteritum data for all 148 German verbs
- API endpoint `/api/vocab/v1/core/german` will serve preteritum data without any code changes
- Leksihjelp inflection search can now match past-tense forms (war, ging, kam, fuhr, etc.) to base entries
- Milestone v1.0 German Data Completeness objective achieved for verb data

---
*Phase: 02-add-german-preteritum-conjugations*
*Completed: 2026-02-20*
