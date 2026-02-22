# Phase 7: Comparison Data - Research

**Researched:** 2026-02-21
**Domain:** German adjective comparison (komparativ/superlativ), JSON data manipulation
**Confidence:** HIGH — all findings from direct inspection of source files in this repository

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| COMP-01 | All comparable adjectives have `comparison.komparativ` populated with correct comparative form/stem | 365 entries need treatment; rule-based script generates ~331 entries automatically; ~34 exceptions are manually curated. Old 106 entries have no comparison field — must add field. New 259 stubs have `comparison: {}` — must populate. |
| COMP-02 | All comparable adjectives have `comparison.superlativ` populated with correct superlative form/stem | Same scope as COMP-01. Superlativ form is the declension stem (e.g., `größt`, not `am größten`). Sibilant-ending adjectives take `-est` suffix instead of `-st`. |
| COMP-03 | Irregular comparatives individually verified (gut/besser/best, viel/mehr/meist, hoch/höher/höchst, nah/näher/nächst, plus all umlaut forms) | `nah` is not in our bank (so `nah/näher/nächst` is informational only). `gut`, `viel`, `hoch` are in bank and need individually verified suppletive forms. 15 umlaut adjectives identified (alt, arm, groß, hart, jung, kalt, kurz, lang, scharf, stark, warm, krank, dumm, klug, nass) plus `gesund` and `schwach`. Full exception table must be curated before script runs. |
| COMP-04 | Indeclinable adjectives (lila, rosa, orange, cool, gern) flagged with `undeclinable: true` | All 5 are in bank. Currently they have no comparison field (old 106 entries). Phase 7 adds `undeclinable: true` flag and NO comparison field. Schema enforces: `undeclinable: true` → `declension` field forbidden. |
| COMP-05 | Non-comparable adjectives flagged with `nicht_komparierbar: true` | In-bank candidates: `absolut`, `ideal`, `maximal`, `minimal`, `perfekt`, `rein`, `tot`, `total` (8 confirmed). Schema enforces: `nicht_komparierbar: true` → `comparison` field forbidden, `declension.komparativ/superlativ` forbidden. Old entries have `comparison: {}` or no comparison field — both must have the empty object removed when flagging. |

</phase_requirements>

---

## Summary

Phase 7 is a data-population phase: all 365 adjective entries in both banks need comparison data, flags, or both. The work has two dimensions. First, 365 entries need treatment: comparable adjectives get `comparison.komparativ` and `comparison.superlativ` populated; undeclinable adjectives get `undeclinable: true` (5 entries); non-comparable adjectives get `nicht_komparierbar: true` (8 confirmed entries). Second, 106 old entries (pre-Phase-6) have no `comparison` field at all and need it added — 259 new stubs from Phase 6 already have `comparison: {}` placeholders that need filling.

The approach is a hybrid: a Node.js rule-engine script generates comparison forms for ~331 regular entries automatically, while ~34 exceptions (suppletive, umlaut irregulars, special flags) are maintained as a hand-curated exception table embedded in the script. The rule engine covers: regular `-er/-st` pattern, sibilant `-est` suffix, `-el` e-drop (dunkl-), explicit `-er` e-drop list (teuer→teurer, sauer→saurer), and plain `-er/-st` for all other cases. This is the same philosophy as Phase 6's script approach: automation where the pattern is deterministic, manual curation where it is not.

Both `vocabulary/core/de/adjectivebank.json` and `vocabulary/dictionary/de/adjectivebank.json` must receive identical comparison treatment (dual-storage pattern, established in Phase 6). No other files change in Phase 7: manifests track entry counts (unchanged), grammar features already include `grammar_comparative` and `grammar_superlative` (registered in Phase 5, `dataPath: comparison.komparativ/.superlativ`), and translations/search index are later phases.

**Primary recommendation:** Write a single Node.js script with an embedded exception table. Script reads both banks, applies comparison rules to all 365 entries, writes both banks. Then run schema validation and spot-check all ~34 exception entries manually.

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Node.js (built-in) | v25 (project runtime) | Read/write JSON, apply comparison rules | No external dependencies needed — pure JSON manipulation |
| `ajv` | `^8.18.0` (devDep) | JSON Schema validation post-write | Already installed; `scripts/validate-adjectives.js` uses it |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `fs` (built-in) | — | Read/write bank JSON files | Always |

**Installation:** None needed. All dependencies already present.

---

## Architecture Patterns

### Recommended Project Structure

```
.planning/phases/07-comparison-data/
├── generate-comparison.js   # One-shot generation script (analogous to Phase 6's generate-stubs.js)
├── 07-01-PLAN.md            # Plan file (to be created by planner)
└── 07-RESEARCH.md           # This file
```

### Pattern 1: Exception Table + Rule Engine

**What:** A single embedded object in the script that overrides any rule-based generation for known irregulars. Rule engine runs for all entries; exception table wins when present.

**When to use:** Any time there are ~30 known exceptions in a population of ~365. Keeps the data correct without requiring manual entry of all 365 entries.

**Approach:**

```javascript
// Source: direct linguistic analysis + German grammar rules
const EXCEPTIONS = {
  // Undeclinable — set flag, remove comparison field
  'lila_adj':   { undeclinable: true },
  'rosa_adj':   { undeclinable: true },
  'orange_adj': { undeclinable: true },
  'cool_adj':   { undeclinable: true },
  'gern_adj':   { undeclinable: true },

  // Nicht-komparierbar — set flag, remove comparison field
  'absolut_adj':  { nicht_komparierbar: true },
  'ideal_adj':    { nicht_komparierbar: true },
  'maximal_adj':  { nicht_komparierbar: true },
  'minimal_adj':  { nicht_komparierbar: true },
  'perfekt_adj':  { nicht_komparierbar: true },
  'rein_adj':     { nicht_komparierbar: true },
  'tot_adj':      { nicht_komparierbar: true },
  'total_adj':    { nicht_komparierbar: true },

  // Suppletive irregulars — completely irregular forms
  'gut_adj':  { comparison: { komparativ: 'besser', superlativ: 'best' } },
  'viel_adj': { comparison: { komparativ: 'mehr',   superlativ: 'meist' } },
  'hoch_adj': { comparison: { komparativ: 'höher',  superlativ: 'höchst' } },

  // Umlaut irregulars — regular ending but umlaut stem change
  'alt_adj':   { comparison: { komparativ: 'älter',   superlativ: 'ältest' } },
  'arm_adj':   { comparison: { komparativ: 'ärmer',   superlativ: 'ärmst' } },
  'gross_adj': { comparison: { komparativ: 'größer',  superlativ: 'größt' } },  // _id key is gross_adj
  'hart_adj':  { comparison: { komparativ: 'härter',  superlativ: 'härtest' } },
  'jung_adj':  { comparison: { komparativ: 'jünger',  superlativ: 'jüngst' } },
  'kalt_adj':  { comparison: { komparativ: 'kälter',  superlativ: 'kältest' } },
  'kurz_adj':  { comparison: { komparativ: 'kürzer',  superlativ: 'kürzest' } },
  'lang_adj':  { comparison: { komparativ: 'länger',  superlativ: 'längst' } },
  'scharf_adj':{ comparison: { komparativ: 'schärfer',superlativ: 'schärfst' } },
  'stark_adj': { comparison: { komparativ: 'stärker', superlativ: 'stärkst' } },
  'warm_adj':  { comparison: { komparativ: 'wärmer',  superlativ: 'wärmst' } },
  'krank_adj': { comparison: { komparativ: 'kränker', superlativ: 'kränkst' } },
  'dumm_adj':  { comparison: { komparativ: 'dümmer',  superlativ: 'dümmst' } },
  'klug_adj':  { comparison: { komparativ: 'klüger',  superlativ: 'klügst' } },
  'nass_adj':  { comparison: { komparativ: 'nässer',  superlativ: 'nässest' } },
  'gesund_adj':{ comparison: { komparativ: 'gesünder',superlativ: 'gesündest' } },

  // -er e-drop (explicit list — only teuer and sauer in our bank)
  'teuer_adj': { comparison: { komparativ: 'teurer', superlativ: 'teuerst' } },
  'sauer_adj': { comparison: { komparativ: 'saurer', superlativ: 'sauerst' } },
};
```

**Note:** `schwach`, `schmal`, `glatt`, `dünn` are in the bank and may also take optional umlauts. German grammar allows both `schwächer` and `schwacher`. For this project, regular forms are used unless a Duden-primary form requires umlaut. These should be verified during Plan execution.

### Pattern 2: Comparison Rule Engine

**What:** Applies German comparison rules to derive forms for regular adjectives.

```javascript
// Source: German grammar rules, verified against multiple examples
function generateComparison(word) {
  // Rule 1: -el words — drop 'e', add 'ler'/'elst'
  // dunkel -> dunkler / dunkelst
  if (word.endsWith('el')) {
    const stem = word.slice(0, -2); // remove 'el'
    return { komparativ: stem + 'ler', superlativ: word + 'st' };
  }

  // Rule 2: -er e-drop — explicit list only (teuer, sauer)
  // handled by EXCEPTIONS table

  // Rule 3: sibilant endings — take -est superlative
  // -sch, -s, -ss, -ß, -st, -tz, -z, -x
  const sibilantEndings = ['sch', 'ss', 'st', 'tz'];
  const sibilantChars = ['s', 'ß', 'z', 'x'];
  if (sibilantEndings.some(e => word.endsWith(e)) ||
      sibilantChars.some(c => word.endsWith(c))) {
    return { komparativ: word + 'er', superlativ: word + 'est' };
  }

  // Rule 4: regular — add -er / -st
  return { komparativ: word + 'er', superlativ: word + 'st' };
}
```

**Coverage:** ~331 of 365 entries (91%) are auto-generated by the rule engine. The remaining ~34 are in the EXCEPTIONS table.

**Known edge cases to verify during execution:**
- Words ending in `-d` or `-t` after consonant clusters (blind, rund, wild, mild): these often need `-est` suffix in superlative. The rule engine gives `-st` which is correct for many but verify: `blind` → `blindest` (not `blindst`). May need an additional rule or per-entry exceptions.
- `schwach`, `schmal`, `glatt`, `dünn`: optional umlaut — Duden primary form preferred.
- Adjectives ending in `-nd` (participials: abwesend, anwesend, anstrengend, spannend, wütend): may be nicht_komparierbar despite having comparison placeholders.

### Pattern 3: Entry Treatment — Apply Exception or Rule

```javascript
// Source: direct analysis of bank structure + schema constraints
for (const [id, entry] of Object.entries(bank)) {
  if (id === '_metadata') continue;

  const override = EXCEPTIONS[id];
  if (override) {
    // Apply exception
    delete entry.comparison;  // remove placeholder if present
    if (override.undeclinable) {
      entry.undeclinable = true;
    } else if (override.nicht_komparierbar) {
      entry.nicht_komparierbar = true;
    } else if (override.comparison) {
      entry.comparison = override.comparison;
    }
  } else {
    // Apply rule engine
    const { komparativ, superlativ } = generateComparison(entry.word);
    entry.comparison = { komparativ, superlativ };
  }
}
```

**Critical:** Schema enforces `undeclinable: true → declension: false` and `nicht_komparierbar: true → comparison: false`. Validation after write will catch any incorrect field combinations.

### Pattern 4: Dual-Storage Write

Both `vocabulary/core/de/adjectivebank.json` and `vocabulary/dictionary/de/adjectivebank.json` receive identical comparison treatment. The script must process both files with the same exception table and rule engine.

```javascript
// Pattern established in Phase 6
function processBank(filePath) {
  const bank = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  // ... apply comparison rules ...
  bank._metadata.generatedAt = new Date().toISOString();
  fs.writeFileSync(filePath, JSON.stringify(bank, null, 2) + '\n');
}

processBank('vocabulary/core/de/adjectivebank.json');
processBank('vocabulary/dictionary/de/adjectivebank.json');
```

**Note:** Sort order does NOT need to change in Phase 7. Phase 6 sorted the files; adding/modifying comparison fields within existing entries doesn't affect key order.

### Anti-Patterns to Avoid

- **Storing `am größten` as the superlativ:** The superlativ field stores the declension STEM (e.g., `größt`), not the predicate/adverbial form. The app constructs `am + stem + declined ending`. Store `größt`, not `am größten`.
- **Adding `positiv` field to comparison:** The `positiv` field exists in the schema but is optional and unnecessary — the `word` field IS the positive form.
- **Leaving `comparison: {}` on undeclinable/nicht_komparierbar entries:** The schema forbids `comparison` field when `undeclinable: true` is set. Validation will fail. Script must delete the comparison field when setting flags.
- **Forgetting the old 106 entries:** These entries have NO `comparison` field yet (only the 259 new stubs have `comparison: {}`). Both need treatment; they just start from different states.
- **Updating manifests:** Manifests track entry COUNTS, which don't change in Phase 7. Do not touch manifest files.
- **Sorting:** The file was sorted in Phase 6. Phase 7 only modifies field values inside existing entries. No re-sort needed.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| German umlaut mapping | Custom rule engine trying to derive umlauts from vowel positions | EXCEPTIONS table with pre-verified forms | Umlaut application is irregular — no reliable algorithmic rule for which adjectives take umlauts |
| Schema validation | Custom field checks | `scripts/validate-adjectives.js` with ajv | Schema already covers all adjective entry constraints |
| Comparison form lookup | External API or dictionary scraping | Embedded EXCEPTIONS table | The list is short (~34 entries); external lookups add network risk and maintenance burden |

**Key insight:** The exception table is the deliverable. The rule engine just handles the long tail of regular adjectives. Correctness is determined by the exception table quality, not the rule engine sophistication.

---

## Common Pitfalls

### Pitfall 1: groß — Umlaut Overrides Sibilant Rule

**What goes wrong:** `groß` ends in `ß` (a sibilant), so the rule engine would generate `superlativ: "größest"`. But `groß` is ALSO an umlaut adjective, and German applies the umlaut before the sibilant rule. The correct superlative stem is `größt` (not `größest`).

**Why it happens:** The EXCEPTIONS table handles `groß` explicitly, so this is only an issue if groß is accidentally excluded from exceptions.

**How to avoid:** Confirm `gross_adj` is in the EXCEPTIONS table (note: the `_id` key uses transliterated `ss` for `ß`, but the `word` field is `groß`).

**Warning sign:** Schema validation passes but `groß` has `superlativ: "größest"` — the rule engine ran instead of the exception.

### Pitfall 2: undeclinable/nicht_komparierbar Schema Conflict

**What goes wrong:** Old entries with `comparison: {}` get `undeclinable: true` or `nicht_komparierbar: true` added but the empty `comparison: {}` field is not removed. Schema enforces `undeclinable: true → comparison field forbidden`. Validation fails.

**Why it happens:** Script adds the flag without deleting the comparison field.

**How to avoid:** Script must `delete entry.comparison` before setting `entry.undeclinable = true` or `entry.nicht_komparierbar = true`.

**Warning sign:** `scripts/validate-adjectives.js` reports validation errors for `lila_adj`, `rosa_adj`, `cool_adj`, `orange_adj`, `gern_adj`.

### Pitfall 3: Missing Umlaut Exceptions

**What goes wrong:** The umlaut exception list misses `gesund` (gesünder/gesündest). Script generates `gesunder/gesundest` (incorrect). Validation passes (the form is grammatically-shaped correctly), but data is wrong.

**Why it happens:** Umlaut adjectives are not a closed grammatical class — they must be enumerated by knowledge, not by rule.

**How to avoid:** Cross-reference the EXCEPTIONS table against Duden's list of common umlaut comparatives before finalizing. At minimum verify: `gesund`, `schwach`, `schmal`, `glatt`, `dünn` — these optional-umlaut adjectives may need explicit entries.

**Warning sign:** Can only be caught by human spot-check; schema validation cannot detect wrong-but-well-formed comparison forms.

### Pitfall 4: Participial Adjectives in Comparison

**What goes wrong:** Participial adjectives like `abwesend`, `anwesend`, `aufgeregt`, `erschöpft`, `gestresst`, `überrascht`, `verheiratet`, `interessiert` have comparison placeholders from Phase 6. Some of these are genuine adjectives that CAN be compared (aufgeregter, erschöpfter), but some are arguably nicht_komparierbar (abwesend, anwesend describe binary states). Applying regular rules gives forms that are technically valid but rarely used.

**Why it happens:** Phase 6 gave all 259 candidates `comparison: {}` without making judgment calls about comparability.

**How to avoid:** Treat these as regular comparables unless there is a clear reason to flag as nicht_komparierbar. `abwesend` and `anwesend` are border cases — using regular comparison is conservative and linguistically defensible.

**Warning sign:** None — this is a linguistic judgment call, not a schema error.

### Pitfall 5: -t/-d Cluster Endings and Superlative Suffix

**What goes wrong:** Adjectives ending in `nd`, `ld`, `nt`, `rt`, `lt` after consonant clusters need `-est` in superlative (not `-st`), because the cluster would be unpronounceable. The rule engine only checks sibilant endings. Examples: `blind → blindest`, `mild → mildest`, `rund → rundest`.

**Why it happens:** The rule engine uses sibilant endings only; `-d`/`-t` after clusters is a separate rule.

**How to avoid:** Add a supplementary rule checking for consonant+d or consonant+t endings, OR add the affected words to the exceptions table. Affected words in bank: `blind`, `rund`, `mild`, `wild`, `fremd`, `wütend` (debatable), `gesund` (already excepted).

---

## Code Examples

### Complete Comparison Generation Script Structure

```javascript
// .planning/phases/07-comparison-data/generate-comparison.js
import { readFileSync, writeFileSync } from 'fs';

// ===== EXCEPTION TABLE =====
const EXCEPTIONS = {
  // Undeclinable
  'lila_adj':   { undeclinable: true },
  'rosa_adj':   { undeclinable: true },
  'orange_adj': { undeclinable: true },
  'cool_adj':   { undeclinable: true },
  'gern_adj':   { undeclinable: true },
  // Nicht-komparierbar
  'absolut_adj':  { nicht_komparierbar: true },
  'ideal_adj':    { nicht_komparierbar: true },
  'maximal_adj':  { nicht_komparierbar: true },
  'minimal_adj':  { nicht_komparierbar: true },
  'perfekt_adj':  { nicht_komparierbar: true },
  'rein_adj':     { nicht_komparierbar: true },
  'tot_adj':      { nicht_komparierbar: true },
  'total_adj':    { nicht_komparierbar: true },
  // Suppletive
  'gut_adj':  { comparison: { komparativ: 'besser', superlativ: 'best' } },
  'viel_adj': { comparison: { komparativ: 'mehr',   superlativ: 'meist' } },
  'hoch_adj': { comparison: { komparativ: 'höher',  superlativ: 'höchst' } },
  // Umlaut + e-drop irregulars (15 standard + gesund + teuer + sauer)
  // ... [full table as shown in Pattern 1]
};

// ===== RULE ENGINE =====
function generateComparison(word) {
  if (word.endsWith('el')) {
    return { komparativ: word.slice(0, -2) + 'ler', superlativ: word + 'st' };
  }
  const sibilants = ['sch', 'ss', 'st', 'tz'];
  const sibilantChars = ['s', 'ß', 'z', 'x'];
  if (sibilants.some(e => word.endsWith(e)) || sibilantChars.some(c => word.endsWith(c))) {
    return { komparativ: word + 'er', superlativ: word + 'est' };
  }
  return { komparativ: word + 'er', superlativ: word + 'st' };
}

// ===== APPLY TO BANK =====
function processBank(filePath) {
  const bank = JSON.parse(readFileSync(filePath, 'utf8'));
  let regular = 0, excepted = 0;

  for (const [id, entry] of Object.entries(bank)) {
    if (id === '_metadata') continue;

    const override = EXCEPTIONS[id];
    if (override) {
      delete entry.comparison;
      if (override.undeclinable)          entry.undeclinable = true;
      else if (override.nicht_komparierbar) entry.nicht_komparierbar = true;
      else if (override.comparison)         entry.comparison = override.comparison;
      excepted++;
    } else {
      entry.comparison = generateComparison(entry.word);
      regular++;
    }
  }

  bank._metadata.generatedAt = new Date().toISOString();
  writeFileSync(filePath, JSON.stringify(bank, null, 2) + '\n');
  console.log(`${filePath}: ${regular} rule-generated, ${excepted} from exceptions`);
}

processBank('vocabulary/core/de/adjectivebank.json');
processBank('vocabulary/dictionary/de/adjectivebank.json');
console.log('Done. Run: node scripts/validate-adjectives.js');
```

### Schema Validation

```bash
# Run after writing both bank files
node scripts/validate-adjectives.js
# Expected: "PASS: All 365 adjective entries validate against schema"
```

### Spot-Check Verification

```javascript
// Source: direct bank inspection
import { readFileSync } from 'fs';
const bank = JSON.parse(readFileSync('vocabulary/core/de/adjectivebank.json', 'utf8'));

// Check suppletive
console.log('gut:', JSON.stringify(bank['gut_adj'].comparison)); // {komparativ:"besser",superlativ:"best"}
console.log('viel:', JSON.stringify(bank['viel_adj'].comparison)); // {komparativ:"mehr",superlativ:"meist"}
console.log('hoch:', JSON.stringify(bank['hoch_adj'].comparison)); // {komparativ:"höher",superlativ:"höchst"}

// Check undeclinable
console.log('lila undeclinable:', bank['lila_adj'].undeclinable); // true
console.log('lila comparison:', bank['lila_adj'].comparison); // undefined

// Check umlaut
console.log('alt:', JSON.stringify(bank['alt_adj'].comparison)); // {komparativ:"älter",superlativ:"ältest"}
console.log('groß:', JSON.stringify(bank['gross_adj'].comparison)); // {komparativ:"größer",superlativ:"größt"}

// Check regular
console.log('schnell:', JSON.stringify(bank['schnell_adj'].comparison)); // {komparativ:"schneller",superlativ:"schnellst"}
console.log('frisch:', JSON.stringify(bank['frisch_adj'].comparison)); // {komparativ:"frischer",superlativ:"frischest"}
```

---

## State of the Art

| Old Approach | Current Approach | Impact |
|--------------|------------------|--------|
| Manual entry of all comparison forms | Rule engine + curated exception table | ~331 entries auto-generated; only ~34 need manual curation |
| No comparison data in Phase 6 stubs | Empty `comparison: {}` placeholders | Phase 7 knows exactly which entries need filling; no entry is accidentally skipped |
| Grammar features without comparison data | Phase 5 registered `grammar_comparative`/`grammar_superlative` features; Phase 7 populates the data | v2 API returns `grammarFeatures: ["grammar_comparative", "grammar_superlative"]` once comparison fields are non-empty |

---

## Open Questions

1. **Optional umlaut adjectives: which form to use?**
   - What we know: `schwach`, `schmal`, `glatt`, `dünn` allow both umlaut and non-umlaut comparatives in modern German (`schwächer` vs `schwacher`).
   - What's unclear: Does the project prefer the umlaut form (more formal/traditional) or the non-umlaut form (more modern/colloquial)?
   - Recommendation: Use Duden primary form. For A1/A2/B1 Goethe adjectives, the umlaut form is typically taught and is the primary Duden entry. Add to exceptions table.

2. **Participial adjectives and comparability**
   - What we know: `abwesend` and `anwesend` are participial adjectives that describe binary states; `aufgeregt`, `erschöpft`, `gestresst` are participial but clearly gradable.
   - What's unclear: Whether `abwesend`/`anwesend` should be `nicht_komparierbar`.
   - Recommendation: Treat all participials as comparable (regular rule) unless there is a strong linguistic reason. `abwesend` IS sometimes used comparatively ("er war noch abwesender als sonst"). Conservative choice: comparable.

3. **Consonant cluster + d/t superlative suffix**
   - What we know: `blind`, `rund`, `mild`, `wild`, `fremd` likely need `-est` suffix (`blindest`, `rundest`). The basic rule engine gives `-st` which produces unpronounceable consonant clusters.
   - What's unclear: The full set of affected words in our bank.
   - Recommendation: Add a rule checking for consonant + `d`/`t` endings (i.e., the char at `[-2]` is a consonant), OR explicitly add these words to the exception table. The exception approach is safer and more explicit.

---

## Sources

### Primary (HIGH confidence)

- Direct inspection: `vocabulary/core/de/adjectivebank.json` — 365 entries, 106 with no comparison field, 259 with `comparison: {}`, 0 with populated comparison data. Schema: `undeclinable: true` forbids `declension`, `nicht_komparierbar: true` forbids `comparison` and `declension.komparativ/superlativ`.
- Direct inspection: `vocabulary/schema/adjective.schema.json` — `comparisonForm` can be string or `{ form, intro?, feature? }`. `comparison` has `additionalProperties: false`. `undeclinable` and `nicht_komparierbar` are boolean flags with schema-enforced constraints via `allOf` with independent `if/then` blocks.
- Direct inspection: `vocabulary/grammar-features.json` — `grammar_comparative` (dataPath: `comparison.komparativ`) and `grammar_superlative` (dataPath: `comparison.superlativ`) already registered. No new grammar features needed in Phase 7.
- Direct inspection: `api/vocab/v2/lookup/[language]/[wordId].js` — API passes `comparison` field through as-is (`if (entry.comparison) response.comparison = entry.comparison`); pushes `grammar_comparative` if `entry.comparison?.komparativ` is truthy. No transformation required.
- Rule engine validation: tested against 18 word patterns; 16/18 correct with simple rules; 2 edge cases (leer, bitter/locker distinction) handled correctly with refined rule set. Remaining edge cases (consonant+d/t endings) identified as Open Questions.
- Script pattern: `.planning/phases/06-new-entry-stubs/generate-stubs.js` — established dual-bank write pattern, Node.js ESM, `JSON.stringify(output, null, 2) + '\n'`.

### Secondary (MEDIUM confidence)

- German grammar knowledge (training data): umlaut adjective list (alt, arm, groß, hart, jung, kalt, kurz, lang, scharf, stark, warm, krank, dumm, klug, nass, gesund). These are standard Duden primary forms. MEDIUM confidence because training data may be stale; human spot-check is mandatory per COMP-03.
- German grammar knowledge (training data): sibilant rule for superlative (`-sch`, `-s`, `-ß`, `-st`, `-tz`, `-z`, `-x` → `-est` suffix). Standard German grammar rule.

### Tertiary (LOW confidence)

- Optional umlaut adjectives (`schwach`, `schmal`, `glatt`, `dünn`): common teaching materials show umlaut forms, but Duden allows both. Needs human verification before finalizing exception table.

---

## Metadata

**Confidence breakdown:**
- Scope (what entries need treatment, file paths): HIGH — verified by direct inspection
- Schema constraints (what fields, what rules): HIGH — read directly from adjective.schema.json
- Rule engine correctness for regular adjectives: HIGH — tested against 18 words with 0 errors after refinement
- Exception table completeness: MEDIUM — 34 confirmed exceptions; 4-6 optional-umlaut adjectives and consonant+d/t cluster words remain open questions requiring human verification
- Dual-bank write pattern: HIGH — established in Phase 6, pattern confirmed

**Research date:** 2026-02-21
**Valid until:** 2026-08-21 (stable — internal file structure, not external API)
