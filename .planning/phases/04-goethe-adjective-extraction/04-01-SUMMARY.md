---
phase: 04-goethe-adjective-extraction
plan: 01
subsystem: data
tags: [german, adjectives, goethe, cefr, extraction, linguistics, json]

# Dependency graph
requires:
  - phase: 03-bank-cleanup
    provides: 106-entry adjective bank (post-cleanup) used as deduplication target

provides:
  - 04-candidates.json with 259 adjective candidates, each with word, _id, cefr, source, review fields
  - Definitive deduplication: zero overlap with existing 106-entry bank
  - CEFR-level traceability: each candidate carries its lowest Goethe level (A1/A2/B1)
  - 13 borderline cases flagged with review: true and review_note for human confirmation
  - Pre-computed _id values following established umlaut-substitution + _adj pattern

affects:
  - 06-new-entry-stubs (reads 04-candidates.json to create bank stubs)
  - 07-adjective-comparison (needs candidate count for scope estimation)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Attributive test ("ein ___er Mann") as definitive German adjective classification criterion
    - Lowest-level-wins deduplication: process A1 first, then A2, then B1
    - Clean filter: discard spaces, punctuation, garbled entries, uppercase mid-word

key-files:
  created:
    - .planning/phases/04-goethe-adjective-extraction/04-candidates.json
  modified: []

key-decisions:
  - "Final candidate count 259 exceeds pre-execution estimate of 80-150 — the estimate was based on rough morphological heuristics; 259 is the correct result after applying the attributive test to all candidates"
  - "13 borderline cases flagged for review: 8 lexicalized participials (bekannt, verheiratet, beliebt, berühmt, bestimmt, interessiert, verwandt, kompliziert), 3 historically-participial-now-adjective (abwesend, anwesend, wütend), 2 dual-role (gleich, bereit)"
  - "Garbled PDF parse artifacts excluded: diesdir, jedjetzt, feierfeiern, eigeneigentlich, irgendirgendein"
  - "13 participials explicitly excluded: geöffnet, aufregend, dringend, ausreichend, befriedigend, entspannend, besetzt, untersagt, dauernd, gehängt, gekauft, geklappt, gekündigt"

patterns-established:
  - "Phase 4 artifacts live in .planning/phases/04-goethe-adjective-extraction/ as planning files, not vocabulary data"
  - "Adjective _id pattern: word.toLowerCase().replace(umlauts).concat('_adj') — consistent with all 106 bank entries"

requirements-completed:
  - BANK-01

# Metrics
duration: 10min
completed: 2026-02-20
---

# Phase 4 Plan 01: Goethe Adjective Extraction Summary

**259 new adjective candidates extracted from 1191 Goethe A1/A2/B1 'other' entries, deduplicated against the 106-entry bank, each passing the 'ein ___er Mann' attributive test with CEFR levels and pre-computed _ids**

## Performance

- **Duration:** 10 min
- **Started:** 2026-02-20T14:41:16Z
- **Completed:** 2026-02-20T14:50:55Z
- **Tasks:** 2
- **Files modified:** 1

## Accomplishments
- Read and processed 1191 'other' entries across three Goethe source files (A1: 215, A2: 382, B1: 594)
- Applied clean filter removing 242 garbled/punctuation/multi-word entries, then deduplicated against 106-entry bank (155 removed) and cross-level duplicates (279 removed), yielding 515 unique candidates
- Applied German attributive test to all 515 candidates: 13 participials excluded, 243 non-adjectives excluded, 259 genuine adjectives included
- Produced `04-candidates.json` with full metadata, stats, and alphabetically sorted candidates array ready for Phase 6 programmatic iteration
- All 14 automated verification checks pass: JSON validity, field completeness, _id pattern, deduplication, participial exclusion, stats integrity

## Task Commits

Each task was committed atomically:

1. **Tasks 1 + 2: Extract, classify, and write candidates JSON** - `c419aea` (feat)

**Plan metadata:** (docs commit follows)

## Files Created/Modified
- `.planning/phases/04-goethe-adjective-extraction/04-candidates.json` - 259 adjective candidates with `_meta` header, stats, and candidates array sorted alphabetically by word

## Decisions Made
- **Count 259 exceeds estimate:** Pre-execution estimate was 80-150 (from rough morphological heuristic in research). Actual count after applying the attributive test to all 515 candidates is 259. The estimate was explicitly noted as LOW-confidence in the research file. All 259 are genuine adjectives — count is correct.
- **13 borderline review cases included:** Lexicalized participials (bekannt, verheiratet, beliebt, berühmt, bestimmt, interessiert, verwandt, kompliziert), historically-participial-now-adjective (abwesend, anwesend, wütend per locked decision), and dual-role ambiguous cases (gleich — primarily adverb; bereit — primarily predicative). All flagged with review: true and specific review_note.
- **Garbled PDF artifact handling:** Added explicit exclusion list for known garbled entries (diesdir, jedjetzt, feierfeiern, eigeneigentlich, irgendirgendein) in addition to the general clean filter (uppercase mid-word, punctuation, spaces).
- **Tasks 1 and 2 committed together:** Both tasks are pure data-analysis work with no intermediate artifact committed separately; a single commit reflects the complete atomic unit.

## Deviations from Plan

None - plan executed exactly as written. The working set (515) differs slightly from the research estimate (520) due to improved garbled entry detection. All deviation rules 1-4 had no triggers.

## Issues Encountered
- Initial clean filter missed garbled entries like `feierfeiern` (lowercased to avoid the uppercase mid-word check). Fixed by adding an explicit exclusion list for known garbled artifacts identified during the print inspection step.
- Stats integrity check failed on first run because review-case words (abwesend, anwesend, wütend, etc.) were in `reviewCases` but not in the `adjectives` set — they fell through to `nonAdjectivesExcluded`. Fixed by ensuring all review cases are explicitly in the `adjectives` set.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- `04-candidates.json` is ready for Phase 6 (New Entry Stubs) to iterate programmatically
- Each candidate has all required fields: word, _id, cefr, source, review (and review_note where review: true)
- Phase 6 should resolve the 13 flagged review cases before creating bank stubs for those words
- Blocker update: actual candidate count is 259 (not 60-100 as originally estimated) — Phase 6 scope is now well-defined

---
*Phase: 04-goethe-adjective-extraction*
*Completed: 2026-02-20*
