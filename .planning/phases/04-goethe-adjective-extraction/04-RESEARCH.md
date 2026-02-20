# Phase 4: Goethe Adjective Extraction - Research

**Researched:** 2026-02-20
**Domain:** German linguistics (adjective identification), JSON data processing, Goethe wordlist source files
**Confidence:** HIGH — all findings from direct inspection of source files in this repository

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

### Extraction scope
- Include all three CEFR levels: A1, A2, and B1.
- If a word appears in multiple Goethe levels, assign the lowest level (first exposure matters for learners).
- Claude determines which Goethe source lists to scan — not limited to "other" wordlists if adjectives are found in other categories.

### Edge case handling
- **Participial adjectives excluded.** Words derived from verbs (interessant, überrascht, aufregend) are NOT included in this extraction, even if they pass the attributive test. Deferred to a future milestone.
- **Compound adjectives included** if they appear in Goethe lists. Don't add compounds not in the source.
- **Dual-role words** (adverb/adjective like schnell): Claude applies judgment per word based on primary usage in German.
- **Borderline cases:** Include but flag as "needs review" so they can be checked before Phase 6 stub creation.

### Output format
- No manual review gate — attributive test + deduplication = final list. Automated quality is sufficient.
- Claude determines file location (phase directory vs vocabulary directory) and format (JSON vs markdown) based on what best serves downstream Phase 6 consumption.
- Claude determines metadata fields beyond the required word + CEFR level.

### Claude's Discretion
- Which Goethe source files to scan (all "other" lists, potentially other categories)
- Whether to flag existing bank entries missing CEFR metadata (backfill observation)
- File location and format for the candidate list
- Additional metadata fields beyond word + CEFR
- Dual-role word decisions (adverb vs adjective per word)

### Deferred Ideas (OUT OF SCOPE)
- Participial adjective extraction (interessant, überrascht, aufregend, etc.) — deferred to a future milestone. These derive from verbs and may need special treatment.
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| BANK-01 | Adjectives extracted from Goethe A1/A2/B1 "other" wordlists using attributive test ("ein ___er Mann"), deduplicated against existing 108 entries | Source files confirmed at `vocabulary/dictionary/sources/goethe-{a1,a2,b1}-words.json`. All three use `type: "other"` for adjectives. Bank has 106 entries post-Phase 3. Deduplication is a lowercase string match. |
</phase_requirements>

---

## Summary

Phase 4 is a data-analysis and linguistic-judgment task, not a code-writing task. The raw material is three Goethe source files (`goethe-a1-words.json`, `goethe-a2-words.json`, `goethe-b1-words.json`) located at `vocabulary/dictionary/sources/`. These files use a flat `type: "other"` category for everything that is not a noun or verb — meaning adjectives, adverbs, prepositions, pronouns, conjunctions, particles, interjections, and garbled parse artifacts are all mixed together. A1 has 215 "other" entries, A2 has 382, and B1 has 594. After removing phrases, prefix stubs (ending in `-`), and entries with punctuation, there are roughly 955 unique clean candidates across all levels. After deduplicating against the 106-entry adjective bank (post-Phase 3), approximately 520 remain.

Of those 520, the majority are non-adjectives (prepositions, pronouns, adverbs). The task is for Claude to apply the German attributive test ("ein ___er Mann") to each candidate. A word that can stand in that slot with the correct -er ending is a genuine adjective. Words that are past participles or present participles are excluded per the locked decision even if they technically pass the attributive test. Expected genuine new adjectives: roughly 80–150, concentrated in the B1 bucket where -ig, -lich, -isch, -los, -sam, -bar endings are common.

The output is a JSON file. JSON is strongly preferred over markdown because Phase 6 (New Entry Stubs) must iterate over candidates programmatically to create bank entries. A JSON array of candidate objects (word, cefr, source, id, review_flag) is the right format. The file belongs in `.planning/phases/04-goethe-adjective-extraction/` as a planning artifact — it is not vocabulary data yet, and Phase 6 will read it from there.

**Primary recommendation:** Scan all three Goethe source files' `type: "other"` entries. Verb/noun categories do not contain adjectives (confirmed by inspection). Process lowest-level-first for cross-level deduplication. Output `04-candidates.json` in the phase directory, structured as a JSON array for easy Phase 6 iteration.

---

## Standard Stack

This phase has no external library dependencies. The work is:
1. Read source JSON files with Node.js `require()` or `JSON.parse(fs.readFileSync(...))`
2. Apply linguistic judgment (Claude, not code) to each candidate
3. Write output JSON with `fs.writeFileSync`

### Core

| Tool | Version | Purpose | Why Standard |
|------|---------|---------|--------------|
| Node.js | v25 (project) | Read source files, write output | Already the project runtime; no new dependency needed |
| Built-in `fs` module | native | File I/O | Sufficient for this task; no streaming required |

### Supporting

None required. No npm packages needed for this phase.

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Manual review of each word | Regex-based pre-filter then review remainder | Pre-filter by suffix (-ig, -lich, -isch, -los) catches most adjectives but misses irregular ones (gut, hoch, arm). Manual review is slower but catches everything |
| JSON output | Markdown table | Markdown is readable but Phase 6 cannot iterate it programmatically without a parser |

**Installation:** None required.

---

## Architecture Patterns

### Source File Structure

All three Goethe source files follow the same schema:

```json
{
  "_meta": {
    "source": "Goethe-Institut Start Deutsch 1 Wortliste",
    "cefr": "A1",
    "parsedAt": "2026-02-13T10:47:46.953Z",
    "totalEntries": 701,
    "byType": { "other": 215, "verb": 165, "noun": 321 }
  },
  "words": [
    { "word": "alt", "type": "other", "cefr": "A1", "source": "goethe-a1", "isSubEntry": false },
    { "word": "groß", "type": "other", "cefr": "A1", "source": "goethe-a1", "isSubEntry": false }
  ]
}
```

Key fields: `word` (the raw string), `type` (scan only `"other"`), `cefr` (the level of that file), `source` (goethe-a1/a2/b1), `isSubEntry` (flag for sub-entries — keep both main and sub).

### Source File Stats

| File | Location | CEFR | Total entries | "other" entries |
|------|----------|------|---------------|-----------------|
| `goethe-a1-words.json` | `vocabulary/dictionary/sources/` | A1 | 701 | 215 |
| `goethe-a2-words.json` | `vocabulary/dictionary/sources/` | A2 | 1108 | 382 |
| `goethe-b1-words.json` | `vocabulary/dictionary/sources/` | B1 | 2598 | 594 |

### Existing Bank Structure (Deduplication Target)

The bank to deduplicate against is `vocabulary/core/de/adjectivebank.json`. Post-Phase 3 it has exactly 106 entries. The bank does NOT have CEFR metadata in the core file — that lives in `vocabulary/dictionary/de/adjectivebank.json`. For deduplication, only the `word` field matters (case-insensitive match).

```json
{
  "_metadata": { ... },
  "schoen_adj": { "word": "schön", "_id": "schoen_adj", "audio": "adjektiv_schoen.mp3" },
  "gross_adj": { "word": "groß", "_id": "gross_adj", "audio": "adjektiv_gross.mp3" }
}
```

All 106 entries in the dictionary bank carry `"cefr": "A1"` — this is because all existing entries were added in v1.0 and categorized as A1 regardless of their actual Goethe level. This is an observation for Phase 6; it does not affect Phase 4's deduplication step.

### _id Generation Pattern

Phase 6 will need _ids. Including them in the Phase 4 output avoids re-deriving them later. The pattern is consistent:

```
word (lowercase) + umlaut-substitution + "_adj"
  ü → ue
  ö → oe
  ä → ae
  ß → ss
```

Examples from the bank:
- `schön` → `schoen_adj`
- `groß` → `gross_adj`
- `grün` → `gruen_adj`
- `weiß` → `weiss_adj`
- `alt` → `alt_adj`

### Recommended Output Format

```json
[
  {
    "word": "arbeitslos",
    "_id": "arbeitslos_adj",
    "cefr": "A1",
    "source": "goethe-a1",
    "review": false
  },
  {
    "word": "billig",
    "_id": "billig_adj",
    "cefr": "A1",
    "source": "goethe-a1",
    "review": false
  },
  {
    "word": "gleich",
    "_id": "gleich_adj",
    "cefr": "A1",
    "source": "goethe-a1",
    "review": true,
    "review_note": "primarily adverb, but 'ein gleiches Recht' is used"
  }
]
```

**Fields:**
- `word`: base form (as it appears in the Goethe list, trimmed)
- `_id`: pre-computed adjective bank ID (umlaut-substituted + `_adj`)
- `cefr`: lowest Goethe level where this word appears (`A1`, `A2`, or `B1`)
- `source`: the goethe-X source tag for traceability
- `review`: boolean — `true` for borderline cases
- `review_note`: optional string — reason for flagging (only present when `review: true`)

**Output location:** `.planning/phases/04-goethe-adjective-extraction/04-candidates.json`

This is a planning artifact (not vocabulary data), consistent with where Phase 3's intermediate outputs lived. Phase 6 reads it from this path to create bank stubs.

### Anti-Patterns to Avoid

- **Scanning verb/noun categories:** Confirmed by inspection that adjectives appear exclusively in `type: "other"`. Nouns are properly typed as nouns, verbs as verbs.
- **Case-sensitive deduplication:** The bank has `schön` not `Schön`. Goethe lists are also lowercase for adjectives. Do case-insensitive comparison to be safe.
- **Using `isSubEntry: true` as an exclusion criterion:** Sub-entries in Goethe lists are often valid words (e.g., `geöffnet` appears as a sub-entry of `öffnen`). Include them — apply the attributive test regardless of `isSubEntry` value.
- **Treating "participial" too broadly:** Only exclude words that are directly derived from verbs. The decision says "interessant, überrascht, aufregend" as examples. Do not exclude all -t endings — `kaputt`, `tot`, `laut`, `breit` are genuine adjectives. The criterion is: "is this a past or present participle of a known verb?"

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Linguistic part-of-speech detection | POS tagger (spaCy, TreeTagger) | Claude's judgment + attributive test | The attributive test is the locked criterion; a POS tagger would give different results and can't replicate "ein ___er Mann" logic |
| Umlaut normalization for IDs | Custom regex | Follow the existing bank's exact substitution pattern | The bank uses ü→ue, ö→oe, ä→ae, ß→ss — verified from actual entries |

**Key insight:** This phase is intentionally a Claude-judgment task, not an automated extraction. The "other" category contains ~520 non-bank words; a rule-based classifier would incorrectly include adverbs (gleich, doch, schon) and miss irregular adjectives. Human-equivalent judgment is required.

---

## Common Pitfalls

### Pitfall 1: Garbled Entries in Source Data

**What goes wrong:** The Goethe source files contain parse artifacts from the original PDF parsing. Examples in A1: `"deindenn"`, `"diesdir"`, `"Feierfeiern"`, `"jedjetzt"`, `"nächstder Name, -n"`, `"letztdie Leute (pl.)"`. These are two entries that were merged by the parser.

**Why it happens:** The Goethe wordlists are PDFs; the parsing script combined adjacent words from layout columns.

**How to avoid:** Discard any entry that looks garbled (two German words concatenated without space, or a word followed immediately by an article). These are clearly not valid single words and will not pass the attributive test anyway.

**Warning signs:** Words that contain `der`, `die`, `das`, `ein` mid-string; or CamelCase mid-word without a logical compound meaning.

### Pitfall 2: Same Word Appears at Multiple CEFR Levels

**What goes wrong:** A word like `arbeitslos` appears in A1, A2, and B1 "other" lists. If processed naively, it could be listed three times or assigned B1 instead of A1.

**Why it happens:** The Goethe lists are cumulative — lower-level words recur in higher-level lists. There are 103 words that appear in all three levels, 222 shared between A2 and B1, 116 between A1 and B1.

**How to avoid:** Process A1 first, then A2 (skip if already seen), then B1 (skip if already seen). The first occurrence wins — it gets the lowest CEFR level. A `Set` of already-processed word strings is the right data structure.

**Warning signs:** Duplicate `word` values in the output candidates list.

### Pitfall 3: Participial Exclusion Requires Verb Knowledge

**What goes wrong:** Excluding words like `geöffnet` (past participle of öffnen) is obvious. But `bekannt` (past participle of kennen), `verheiratet` (past participle of heiraten), and `ausreichend` (present participle of ausreichen) require knowing the verb. Words like `anwesend` and `abwesend` are historically from Latin participles but now function primarily as adjectives — these are borderline.

**Why it happens:** German adjectives and participles share morphological forms.

**How to avoid:** The rule from the context is: if the word "derives from a verb" it is excluded. Use `ge-` prefix + `-t`/`-en` ending as the primary heuristic for past participles. Present participles end in `-end`. Flag cases where you are uncertain (anwesend, abwesend) as `review: true`.

**Known participials to exclude from Goethe lists** (not already in bank):
- `geöffnet` (A1) — past participle of öffnen
- `aufregend` (A2) — present participle of aufregen
- `dringend` (A2) — present participle of dringen
- `abwesend` (B1) — historically participial, now primarily used as adj → flag as review
- `anwesend` (B1) — same as abwesend → flag as review
- `ausreichend` (B1) — present participle of ausreichen
- `befriedigend` (B1) — present participle of befriedigen
- `entspannend` (B1) — present participle of entspannen
- `wütend` (B1) — originally participial, now primarily adj → flag as review

Note: `spannend` and `anstrengend` are already in the bank and will be excluded by deduplication regardless.

### Pitfall 4: Dual-Role Words — Not All Adverbs Are Excluded

**What goes wrong:** Over-excluding words that can be both adjective and adverb. The existing bank already includes many dual-role words: `schnell`, `gern`, `weit`, `hoch`, `lang`, `kurz`, `leise`, `laut`, `leicht`, `schwer`, `hart`. The standard is "primary usage" — a word primarily used as an adjective is included even if it also serves as an adverb.

**Why it happens:** German adjectives freely appear as adverbs in predicative position without any morphological change. The question is always "can it be used attributively before a noun?"

**How to avoid:** Apply the attributive test literally. If "ein ___ Mann" sounds natural with the word in that slot, it qualifies. Reserve exclusion for words where the adverbial use is overwhelmingly dominant and the attributive use is ungrammatical (e.g., `sehr`, `auch`, `schon` never work in "ein sehr/auch/schon-er Mann").

**Specific dual-role cases from the A1 list to resolve:**
- `gleich` → can be attributive ("ein gleiches Recht") → include, flag review
- `leise`, `laut` → already in bank — excluded by deduplication
- `gern` → already in bank — excluded by deduplication
- `viel`, `wenig` → already in bank — excluded by deduplication

### Pitfall 5: The bank currently shows ALL entries as CEFR A1 in the dictionary bank

**What goes wrong:** If someone checks the dictionary bank to see "which adjectives already have CEFR A1" to decide what to add, they will see all 106 have A1. This is misleading — it is an artifact of v1.0 data entry, not a meaningful CEFR assignment.

**Why it happens:** The v1.0 entries were all assigned CEFR A1 without systematic Goethe cross-referencing.

**How to avoid:** Phase 4 does NOT need to fix the existing bank's CEFR data. This is an observation for later. The deduplication check only asks "is this word already in the bank by word string?" — not "does the bank have the correct CEFR for this word?"

---

## Code Examples

### Reading and Filtering Goethe Source Files

```javascript
// Source: direct inspection of vocabulary/dictionary/sources/goethe-a1-words.json structure
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '../..');

const a1 = JSON.parse(readFileSync(path.join(root, 'vocabulary/dictionary/sources/goethe-a1-words.json'), 'utf8'));
const a2 = JSON.parse(readFileSync(path.join(root, 'vocabulary/dictionary/sources/goethe-a2-words.json'), 'utf8'));
const b1 = JSON.parse(readFileSync(path.join(root, 'vocabulary/dictionary/sources/goethe-b1-words.json'), 'utf8'));

// Filter to clean single-word "other" entries
function getCleanOthers(data) {
  return data.words.filter(w => {
    if (w.type !== 'other') return false;
    const word = w.word;
    if (word.includes(' ') || word.includes('.') || word.includes('!')) return false;
    if (word.includes('?') || word.includes(',') || word.includes('/')) return false;
    if (word.endsWith('-') || word.startsWith('-')) return false;
    if (word.includes('(') || word.includes(')')) return false;
    return true;
  });
}
```

### Reading the Bank for Deduplication

```javascript
// Source: direct inspection of vocabulary/core/de/adjectivebank.json
const coreBank = JSON.parse(readFileSync(
  path.join(root, 'vocabulary/core/de/adjectivebank.json'), 'utf8'
));
const { _metadata, ...bankEntries } = coreBank;

// Build lowercase set for deduplication
const bankWords = new Set(
  Object.values(bankEntries).map(e => e.word.toLowerCase())
);
```

### Cross-Level Deduplication (Lowest Level Wins)

```javascript
// Process A1 first, then A2, then B1 — first seen wins
const seen = new Set(); // tracks processed words
const candidates = [];  // final candidate list (before linguistic filter)

for (const [data, _level] of [[a1, 'A1'], [a2, 'A2'], [b1, 'B1']]) {
  for (const entry of getCleanOthers(data)) {
    const lower = entry.word.toLowerCase();
    if (seen.has(lower)) continue;   // already seen at lower level
    if (bankWords.has(lower)) continue; // already in bank
    seen.add(lower);
    candidates.push(entry);
    // At this point: apply attributive test + participial exclusion to decide
    // whether to include in final output
  }
}
```

### _id Generation

```javascript
// Source: pattern observed across all 106 entries in vocabulary/core/de/adjectivebank.json
function toAdjectiveId(word) {
  return word
    .toLowerCase()
    .replace(/ü/g, 'ue')
    .replace(/ö/g, 'oe')
    .replace(/ä/g, 'ae')
    .replace(/ß/g, 'ss')
    + '_adj';
}

// Examples:
// toAdjectiveId('schön') → 'schoen_adj'
// toAdjectiveId('groß') → 'gross_adj'
// toAdjectiveId('arbeitslos') → 'arbeitslos_adj'
```

### Writing the Output

```javascript
import { writeFileSync } from 'fs';

const output = {
  "_meta": {
    "generatedAt": new Date().toISOString(),
    "sourceFiles": ["goethe-a1-words.json", "goethe-a2-words.json", "goethe-b1-words.json"],
    "bankEntriesAtGeneration": 106,
    "description": "Adjective candidates extracted from Goethe A1/A2/B1 other wordlists, deduplicated against 106-entry adjective bank. Participial adjectives excluded."
  },
  "candidates": [
    // Each entry: { word, _id, cefr, source, review, review_note? }
  ]
};

writeFileSync(
  path.join(root, '.planning/phases/04-goethe-adjective-extraction/04-candidates.json'),
  JSON.stringify(output, null, 2),
  'utf8'
);
```

---

## State of the Art

This phase has no external technology dependency — the "state of the art" question is about German linguistic conventions.

| Topic | Finding |
|-------|---------|
| Attributive test authority | The "ein ___er Mann" test is the standard grammatical test for German adjective identification used in German grammar pedagogy (e.g., Duden Grammatik). |
| Participial distinction | In German grammar, adjectives derived from verb participles are called "Partizipaladjektive." They are grammatically adjectives when fully lexicalized, but the CONTEXT.md decision is to defer ALL participial-derived forms regardless of lexicalization status. |
| Dual-role words | German "Adjektive/Adverbien" is an established word class overlap. The standard reference (Duden §459) notes that most German adjectives can be used predicatively without change, making adverb/adjective distinction context-dependent. |

---

## Open Questions

1. **Should `abwesend` and `anwesend` be included or excluded?**
   - What we know: Both appear in B1. Both have historical participial origins but are now fully lexicalized as adjectives in modern German. "Ein abwesender Mann" and "ein anwesender Mann" are grammatical.
   - What's unclear: Whether "historically participial but now lexicalized" counts as "derived from a verb" under the context's exclusion rule.
   - Recommendation: Include with `review: true` and a note. The planner can leave the final call to Phase 6 stub creation.

2. **Should `wütend` be included or excluded?**
   - What we know: `wütend` appears in B1. Etymologically it is the present participle of `wüten` (to rage). But it is overwhelmingly used as a pure adjective and rarely if ever as a verbal participle. "Ein wütender Mann" is very natural.
   - Recommendation: Include with `review: true`. Strong candidate for inclusion.

3. **How many total candidates are expected?**
   - What we know: ~520 unique words after deduplication against the bank. Of those, the majority are prepositions, pronouns, adverbs, conjunctions.
   - Estimate: 80–150 genuine adjectives, concentrated in B1 (many -ig, -lich, -isch suffixed words).
   - This is not a question requiring external research — Claude will determine the final count by applying the attributive test.

4. **Should the `_meta` of the candidates file note which bank words have incorrect CEFR data?**
   - What we know: All 106 dictionary bank adjectives carry `"cefr": "A1"` — many are actually A2 or B1 words.
   - Recommendation: Note this as an observation in the candidates file's `_meta` block. Do not fix it in this phase. Phase 6 or a future cleanup phase can address backfill.

---

## Sources

### Primary (HIGH confidence)

- Direct inspection of `vocabulary/dictionary/sources/goethe-a1-words.json` — structure, "other" count (215), sample entries
- Direct inspection of `vocabulary/dictionary/sources/goethe-a2-words.json` — structure, "other" count (382), sample entries
- Direct inspection of `vocabulary/dictionary/sources/goethe-b1-words.json` — structure, "other" count (594), sample entries
- Direct inspection of `vocabulary/core/de/adjectivebank.json` — 106 entries, all word values, _id pattern
- Direct inspection of `vocabulary/dictionary/de/adjectivebank.json` — CEFR distribution (all 106 show A1), full field set
- Node.js data analysis scripts run against actual source files — cross-level duplicate counts, garbled entry identification, participial detection

### Secondary (MEDIUM confidence)

- None needed — all critical findings verified from source data.

### Tertiary (LOW confidence)

- Estimate of 80–150 genuine new adjectives is a rough estimate from morphological pre-filtering. Actual count determined by linguistic judgment during execution.

---

## Metadata

**Confidence breakdown:**
- Source file structure: HIGH — read directly from files
- Existing bank state: HIGH — read directly from files
- Deduplication approach: HIGH — simple string comparison, verified against file structure
- Output format recommendation: HIGH — derived from Phase 6 requirements (iteration over candidates to create bank stubs)
- Adjective count estimate: LOW — rough estimate; actual count requires applying the attributive test to ~520 words

**Research date:** 2026-02-20
**Valid until:** 2026-04-20 (source files are static; bank entry count could change only if another phase runs first)
