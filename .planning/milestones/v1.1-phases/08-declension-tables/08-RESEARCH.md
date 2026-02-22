# Phase 8: Declension Tables - Research

**Researched:** 2026-02-21
**Domain:** German adjective declension (positiv/komparativ/superlativ), JSON data generation at scale
**Confidence:** HIGH — all findings from direct inspection of source files in this repository

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Declension scope by adjective type:**
- 352 comparable adjectives get positiv + komparativ declension blocks (stark/schwach/gemischt each)
- 8 nicht_komparierbar adjectives get positiv declension only (no komparativ or superlativ)
- 5 undeclinable adjectives keep `"declension": {}` — no declension data generated
- Superlativ declension (schwach only): Claude's discretion — roadmap success criteria SC-2 mentions superlativ blocks, so Claude should evaluate whether to include them to satisfy the requirement

**Irregular stem handling:**
- All 27+ irregular adjectives get equal verification care — no category is less important
- Independent stem lookup for all irregulars — do NOT rely solely on comparison data from Phase 7
- Source of truth: Duden prescriptive standard German
- Suppletive (gut/viel/hoch), umlaut (17), e-drop (2), consonant-cluster (5) all treated with full attention

**Data completeness:**
- Every cell must be filled (Claude's discretion on handling truly disputed forms)
- Automated verification script — permanent project asset, reusable for future data changes
- Verification flags errors and continues (does not stop on first error) — all failures reported at end
- Committed markdown review report listing all irregular declension forms for human sanity-checking
- Dual-bank storage: Claude follows existing project pattern for core/dictionary bank relationship

**Variant declined forms:**
- Follow Duden preferred form as the primary value for each cell
- Standard Duden e-elision rules for -el adjectives (dunkler, edler, flexibler)
- Per-adjective Duden lookup for -er adjectives — no blanket e-drop rule (teures is standard, sauberes is standard)
- Store alternative accepted forms alongside primary form for adjectives with genuine Duden-recognized variants (~10-15 adjectives)
- Alternatives must be machine-distinguishable from the primary form so downstream apps can choose to show or ignore them
- Purpose of alternatives: test tools recognize them as accepted answers; dictionaries/learning apps decide whether to display

### Claude's Discretion

- Superlativ declension inclusion (evaluate against roadmap SC-2)
- Marking mechanism for alternative forms (must be code-recognizable, not break existing schema consumers)
- Core/dictionary bank relationship for declension data (follow existing dual-bank pattern)
- Handling of genuinely disputed/uncertain forms (fill with most standard form vs leave blank)
- Execution batching strategy (all at once vs by category vs by difficulty)

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| DECL-01 | Positive degree declension tables (stark/schwach/gemischt × 4 cases × 4 gender/number) for all declinable adjectives | 360 adjectives need positiv (352 comparable + 8 nicht_komparierbar). Script derives positiv stem from `word` field with 4 stem exceptions (hoch→hoh, dunkel→dunkl, flexibel→flexibl, teuer→teur). Ending tables are constant. All 48 cells auto-generated per adjective. |
| DECL-02 | Comparative degree declension tables (stark/schwach/gemischt × 4 cases × 4 gender/number) for all comparable adjectives | 352 comparable adjectives need komparativ. Stem derived from `comparison.komparativ` by stripping trailing `-er`. Exception: `mehr` (from `viel`) does not end in `-er`; needs hand-curated forms or exception entry. All other 351 komparativ forms end in `-er` and strip cleanly. |
| DECL-03 | Superlative degree declension tables for all comparable adjectives | SC-2 in CONTEXT explicitly mentions superlativ blocks. Scope: schwach only (schema already encodes this via `superlativBlock`). 352 comparable adjectives get superlativ. Stem = `comparison.superlativ` value (already stored as bare stem, e.g., `schnellst`). Apply schwach endings (16 cells). No extra stem derivation needed. |
| DECL-04 | All declension data linguistically correct — irregular stems (hoch→hoh-, dunkel→dunkl-, teuer→teur-) individually verified | Exception table in generate script covers all irregular positiv stems. Verification script performs targeted checks: confirms `hohem` (not `hochem`), `dunklem` (not `dunkelem`), `teures` (not `teueres`). Cross-bank consistency check confirms both banks match. |
| DECL-05 | Declension data present in both core and dictionary banks (dual-storage pattern) | Same `processBank(filePath)` pattern used in Phase 7. Script writes to `vocabulary/core/de/adjectivebank.json` AND `vocabulary/dictionary/de/adjectivebank.json`. Both files receive identical treatment from the same function. |
</phase_requirements>

---

## Summary

Phase 8 is the primary data-generation deliverable of the v1.1 milestone: populate declension tables for all 360 declinable adjectives across all three degrees (where applicable). The scale is significant — approximately 39,800 individual form cells — but the approach is algorithmically tractable because German adjective declension endings are completely regular. The irregularities are confined entirely to the STEM, not the endings. This means a rule engine + stem exception table is sufficient to generate all data correctly.

The ending tables (stark/schwach/gemischt × 4 cases × 4 genders) are constant and fully established by German grammar. The stem derivation is where the work lies: positiv stems require 4 specific exception entries (hoch→hoh, dunkel→dunkl, flexibel→flexibl, teuer→teur); komparativ stems derive mechanically from `comparison.komparativ` by stripping trailing `-er` (with one exception: `mehr` from `viel`); superlativ stems are already stored verbatim in `comparison.superlativ`. The script architecture follows the Phase 7 precedent exactly: ESM Node.js, embedded exception table, `processBank()` dual-bank write, `ajv` schema validation post-write.

The superlativ degree (schwach declension only) should be included. CONTEXT.md section `Deferred Ideas` is empty and SC-2 of the roadmap success criteria explicitly states "Every comparable adjective in the core bank has `declension.komparativ` and `declension.superlativ` blocks." Including superlativ is not a decision to re-examine — it is a stated success criterion. The schema already supports this via the `superlativBlock` definition (schwach only). For alternative forms, the `declension_alternatives` key at entry level (not inside `declension`) is the correct approach: the adjective schema has no `additionalProperties` restriction at entry level, so no schema changes are required.

**Primary recommendation:** Write `generate-declension.js` with an embedded STEM_EXCEPTIONS table (~6 entries), constant ENDINGS tables, and a `processBank()` function that derives stems and builds all declension blocks. Follow with `verify-declension.js` targeting all exception entries and cross-bank consistency. Write an `IRREGULAR-REVIEW.md` report for human spot-checking.

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Node.js (built-in) | v18+ (engines field) | Read/write JSON, apply declension rules | No external dependencies needed — pure JSON manipulation |
| `ajv` | `^8.18.0` (devDep, already installed) | JSON Schema validation post-write | Already used in `scripts/validate-adjectives.js`; Phase 7 precedent |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `fs` (built-in) | — | Read/write bank JSON files | Always |

**Installation:** None needed. All dependencies already present.

---

## Architecture Patterns

### Recommended Project Structure

```
.planning/phases/08-declension-tables/
├── generate-declension.js    # One-shot generation script (same pattern as generate-comparison.js)
├── verify-declension.js      # Verification/spot-check script (permanent audit artifact)
├── IRREGULAR-REVIEW.md       # Committed markdown listing all irregular forms for human review
├── 08-CONTEXT.md             # (already exists)
└── 08-RESEARCH.md            # This file
```

### Pattern 1: Ending Tables (Constant)

**What:** German adjective ending tables are fixed — they do not vary by adjective. All variation is in the stem.

```javascript
// Source: Standard German grammar — verified against multiple reference examples
const ENDINGS = {
  stark: {
    nominativ:  { maskulin: 'er', feminin: 'e',  neutrum: 'es', plural: 'e' },
    akkusativ:  { maskulin: 'en', feminin: 'e',  neutrum: 'es', plural: 'e' },
    dativ:      { maskulin: 'em', feminin: 'er', neutrum: 'em', plural: 'en' },
    genitiv:    { maskulin: 'en', feminin: 'er', neutrum: 'en', plural: 'er' },
  },
  schwach: {
    nominativ:  { maskulin: 'e',  feminin: 'e',  neutrum: 'e',  plural: 'en' },
    akkusativ:  { maskulin: 'en', feminin: 'e',  neutrum: 'e',  plural: 'en' },
    dativ:      { maskulin: 'en', feminin: 'en', neutrum: 'en', plural: 'en' },
    genitiv:    { maskulin: 'en', feminin: 'en', neutrum: 'en', plural: 'en' },
  },
  gemischt: {
    nominativ:  { maskulin: 'er', feminin: 'e',  neutrum: 'es', plural: 'en' },
    akkusativ:  { maskulin: 'en', feminin: 'e',  neutrum: 'es', plural: 'en' },
    dativ:      { maskulin: 'en', feminin: 'en', neutrum: 'en', plural: 'en' },
    genitiv:    { maskulin: 'en', feminin: 'en', neutrum: 'en', plural: 'en' },
  },
};
```

### Pattern 2: Stem Exception Table (Positiv Stems)

**What:** Only 4 adjectives have irregular positiv declension stems (where the declined forms don't simply apply endings to the base word).

```javascript
// Source: Duden German grammar — verified forms
// Key: _id of the adjective entry
// Value: the stem to use for ALL positiv declined forms
const POSITIV_STEM_EXCEPTIONS = {
  'hoch_adj':    'hoh',     // hoch → hoher, hohe, hohes, hohem etc. (NOT hochem)
  'dunkel_adj':  'dunkl',   // dunkel → dunkler, dunkle, dunkles, dunklem (NOT dunkeler)
  'flexibel_adj':'flexibl', // flexibel → flexibler, flexible, flexibles (NOT flexibeler)
  'teuer_adj':   'teur',    // teuer → teurer, teure, teures, teurem (NOT teuerem)
};

// These adjectives are NOT exceptions (they stay as-is):
// parallel_adj: parallel (double-l, stressed syllable — no e-drop)
// sauber_adj:   sauber (sauberes is standard — no e-drop for sauber)
// bitter_adj:   bitter (bitteres is standard)
// lecker_adj:   lecker (leckeres is standard)
// All -ell adjectives (aktuell, finanziell, etc.): no e-drop
```

### Pattern 3: Stem Derivation Algorithm

**What:** Mechanical derivation of stems for komparativ and superlativ from the comparison data already in the bank.

```javascript
// Source: Direct inspection of comparison data + German grammar
function getPositivStem(id, word) {
  return POSITIV_STEM_EXCEPTIONS[id] ?? word;
}

function getKomparativStem(id, komparativForm) {
  // All komparativ forms end in -er (e.g., schneller, besser, höher)
  // EXCEPT: mehr (from viel) — handled by full exception entry
  if (!komparativForm.endsWith('er')) return null; // flag for exception handling
  return komparativForm.slice(0, -2); // strip trailing 'er'
}

// Superlativ stem is stored directly in comparison.superlativ
// e.g., schnellst, best, größt, höchst — apply schwach endings directly
// No derivation needed for superlativ.
```

### Pattern 4: Block Generation

**What:** Apply endings to a stem to produce a full caseBlock.

```javascript
function makeCaseBlock(stem, endingsTable) {
  const block = {};
  for (const [caseKey, genders] of Object.entries(endingsTable)) {
    block[caseKey] = {};
    for (const [gender, ending] of Object.entries(genders)) {
      block[caseKey][gender] = stem + ending;
    }
  }
  return block;
}

function makeArticleBlock(stem) {
  return {
    stark:    makeCaseBlock(stem, ENDINGS.stark),
    schwach:  makeCaseBlock(stem, ENDINGS.schwach),
    gemischt: makeCaseBlock(stem, ENDINGS.gemischt),
  };
}

function makeSuperlativBlock(stem) {
  return {
    schwach: makeCaseBlock(stem, ENDINGS.schwach),
  };
}
```

### Pattern 5: Per-Entry Processing with Degree Selection

**What:** Apply the right degrees based on adjective type.

```javascript
function buildDeclension(id, entry) {
  // Undeclinable: already have no declension field (Phase 7 removed it)
  if (entry.undeclinable) return null;

  const posStem = getPositivStem(id, entry.word);
  const declension = {};

  // positiv — all 360 declinable adjectives get this
  declension.positiv = makeArticleBlock(posStem);

  // komparativ + superlativ — only comparable adjectives (352)
  if (!entry.nicht_komparierbar && entry.comparison) {
    const kompForm = entry.comparison.komparativ;
    const supForm  = entry.comparison.superlativ;

    // komparativ: use full comparative as the base stem
    // (schneller → schneller as base, endings produce schnellerer/schnellere etc.)
    declension.komparativ = makeArticleBlock(kompForm);

    // superlativ: schwach only — stored stem in comparison.superlativ
    declension.superlativ = makeSuperlativBlock(supForm);
  }

  return declension;
}
```

**Critical insight on komparativ stem:** The komparativ block uses the FULL komparativ form (e.g., `schneller`) as its stem, not the stripped form (`schnell`). This is because the komparativ itself is a derived form — when declined, `schneller` produces `schnellerer` (stark.nom.m), `schnellere` (stark.nom.f), `schnelleres` (stark.nom.n), `schnellerem` (stark.dat.m). This is correct German grammar.

### Pattern 6: Dual-Bank Write (same as Phase 7)

```javascript
// Source: Established in Phase 7 (generate-comparison.js)
function processBank(filePath) {
  const bank = JSON.parse(readFileSync(filePath, 'utf8'));
  let populated = 0, skipped = 0;

  for (const [id, entry] of Object.entries(bank)) {
    if (id === '_metadata') continue;
    if (entry.undeclinable) { skipped++; continue; }

    entry.declension = buildDeclension(id, entry);
    populated++;
  }

  bank._metadata.generatedAt = new Date().toISOString();
  writeFileSync(filePath, JSON.stringify(bank, null, 2) + '\n');
  console.log(`${filePath}: ${populated} populated, ${skipped} skipped (undeclinable)`);
}

processBank('vocabulary/core/de/adjectivebank.json');
processBank('vocabulary/dictionary/de/adjectivebank.json');
```

### Pattern 7: Alternative Forms — Entry-Level Key

**What:** Adjectives with Duden-recognized variant declined forms store the alternatives in a separate `declension_alternatives` key at the entry level (NOT inside `declension`).

**Why this approach:**
- `adjectiveEntry` in the schema has NO `additionalProperties` restriction — extra keys are allowed
- `declension` has `additionalProperties: false` — adding keys inside would break schema validation
- No schema change needed
- Machine-distinguishable: apps check for `declension_alternatives` key

```javascript
// Source: Direct schema inspection (vocabulary/schema/adjective.schema.json)
// adjectiveEntry.additionalProperties: NOT SET (allows any additional fields)
// declension.additionalProperties: false (forbids extra keys)

// Structure: sparse — only cells that have genuine Duden variants
const DECLENSION_ALTERNATIVES = {
  'teuer_adj': {
    positiv: {
      stark: {
        nominativ: { maskulin: 'teurerer' }, // primary: teurer (Duden preferred)
        // All -em cells: teurem (primary) / teuerem (accepted)
        dativ: { maskulin: 'teuerem', feminin: 'teuerer', neutrum: 'teuerem' },
      },
      // ... other article types with variant cells only
    }
  },
  // ~10-14 more adjectives with genuine Duden variants
};
```

**Scope:** The CONTEXT specifies ~10-15 adjectives. The primary candidates are:
- `teuer_adj`: teur- vs teuer- forms (teurem/teuerem, teurer/teurerer, etc.)
- `-er` adjectives where e-drop is optional (Duden lookup needed per adjective)
- Adjectives with optional umlaut in komparativ (but these were resolved in Phase 7; declension follows the Phase 7 choice)

### Anti-Patterns to Avoid

- **Using the word as komparativ stem:** `schnell` + endings = `schneller` (nom.m.stark) is WRONG. The komparativ block uses the full komparativ form (`schneller`) as the base, producing `schnellerer` (nom.m.stark). This is correct German.
- **Applying -el e-drop to -ell adjectives:** `aktuell`, `finanziell`, `offiziell` etc. do NOT drop the e. Only single-l -el adjectives (dunkel, flexibel) drop it.
- **Blanket e-drop for all -er adjectives:** `sauber` → `sauberes` (NOT `saures`); `bitter` → `bitteres`. Only `teuer` has e-drop in positiv. Use POSITIV_STEM_EXCEPTIONS table.
- **Forgetting that 101 adjectives lack the declension key entirely:** 259 entries have `declension: {}` (need populating); 101 entries have NO `declension` key at all. Script must handle both: overwrite `{}` and set new key where missing.
- **Touching manifests:** Entry counts don't change in Phase 8. Do not modify manifest files.
- **Not sorting:** The file was sorted in Phase 6. Phase 8 only modifies field values inside existing entries. No re-sort needed.
- **Adding keys inside the declension object beyond positiv/komparativ/superlativ:** Schema has `additionalProperties: false` on the `declension` $def. Any extra key will fail validation.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Schema validation | Custom field-presence checks | `node scripts/validate-adjectives.js` (already exists) | ajv covers all schema constraints including additionalProperties rules |
| Irregular form lookup | External API / dictionary scraping | Embedded POSITIV_STEM_EXCEPTIONS table + Duden reference during authoring | Only 4 positiv exceptions in our bank; external lookups add network risk |
| Alternative form tracking | Mixing primary/alt in same cell | `declension_alternatives` entry-level key | Schema forbids extra keys inside declension/$defs/genderNumber; entry level is unrestricted |

**Key insight:** The ending tables are the algorithm. Once ENDINGS, POSITIV_STEM_EXCEPTIONS, and per-degree stem derivation are correct, the script is correct for all 39,800+ cells.

---

## Common Pitfalls

### Pitfall 1: Komparativ Block Stem Confusion

**What goes wrong:** Developer strips trailing `-er` from `schneller` → gets stem `schnell` → applies endings → gets `schneller` (nom.m.stark), `schnelle` (nom.f.stark). This is WRONG. The komparativ block should produce `schnellerer`, `schnellere`, `schnelleres`.

**Why it happens:** Confusion between the "stem" for the rule engine and the "base form" for declension. For declension, the FULL komparativ form IS the base: `schneller` + `er`/`e`/`es` endings = `schnellerer`/`schnellere`/`schnelleres`.

**How to avoid:** Use `entry.comparison.komparativ` directly as the base for `makeArticleBlock()`. Do NOT strip `-er` first.

**Warning signs:** Verification check `hoch komparativ stark.nom.m` shows `höher` instead of `höherer`. Success criterion: `höherer` (not `höherer` from höh- stem — komparativ uses full `höher` as base).

### Pitfall 2: hoch Positiv — hochem vs hohem

**What goes wrong:** `hoch` is declined as `hoher`, `hohe`, `hohes`, `hohem` etc. The word is `hoch` but the stem for all declined forms is `hoh`. Without the exception entry, the script generates `hochem`, `hoches`, `hocher` — all wrong.

**Why it happens:** `hoch` is the only adjective in the bank where the positiv declension stem is NOT a simple e-drop — it changes the final consonant.

**How to avoid:** `POSITIV_STEM_EXCEPTIONS['hoch_adj'] = 'hoh'`. Verification check: `stark.dativ.maskulin` must be `'hohem'` not `'hochem'`. This is explicitly listed in the success criteria (SC-3).

**Warning signs:** Success criteria spot-check shows `hochem` instead of `hohem`.

### Pitfall 3: parallel — False e-drop

**What goes wrong:** `parallel` ends in `-el`, triggering a naive `-el` e-drop rule → stem becomes `parall` → produces `paraller`, `paralle` — wrong. Correct positiv forms: `paralleler`, `parallele`, `paralleles`, `parallelем`.

**Why it happens:** The `-el` e-drop rule applies to adjectives with UNSTRESSED `-el` ending (dunkel, flexibel). `parallel` has a stressed final syllable (par-al-LEL) and does not drop the e.

**How to avoid:** Do NOT apply a blanket `-el` rule in the script. Use POSITIV_STEM_EXCEPTIONS for the 4 exceptions only; all other adjectives including `parallel` use the word as-is.

**Warning signs:** `parallel` in POSITIV_STEM_EXCEPTIONS would be wrong. Correct: `parallel` is NOT in the exceptions table.

### Pitfall 4: viel Komparativ (mehr)

**What goes wrong:** `viel` has `comparison.komparativ = 'mehr'`. The stem derivation strips trailing `er`... but `mehr` does not end in `er` (it ends in `hr`). The algorithm breaks or produces garbage.

**Why it happens:** `mehr` is the only komparativ form in the bank that does not end in `-er`.

**How to avoid:** Either (a) add `viel_adj` to a KOMPARATIV_EXCEPTIONS table with hand-curated forms, or (b) detect when `komparativForm.endsWith('er')` is false and handle as a special case. The forms of `mehr` as a declined comparative: `mehrere`/`mehrerer`/`mehreres`/`mehrerem`/`mehreren` (stark), `mehrere`/`mehrere`/`mehrere`/`mehreren` (schwach), etc.

**Warning signs:** Script crashes on `viel_adj` or generates `mhr`-prefixed forms.

### Pitfall 5: 101 Entries Without declension Key

**What goes wrong:** Script only overwrites `entry.declension = {}` entries and skips entries where the key is absent. 100 comparable adjectives (the older pre-Phase-6 entries) have NO `declension` key at all — they would get no declension data.

**Why it happens:** Phase 6 only added `declension: {}` to the 259 NEW entries; the existing 106 older entries were not all updated (101 remain without the key, 5 had it added).

**How to avoid:** Script sets `entry.declension = buildDeclension(id, entry)` unconditionally for all non-undeclinable entries — this handles both cases (existing `{}` is overwritten, missing key is created).

**Warning signs:** After generation, 101 entries still have no `declension` key. Verification count check: `entries with declension.positiv` should equal 360.

### Pitfall 6: superlativ Stem vs Form

**What goes wrong:** `comparison.superlativ` stores the bare stem (e.g., `schnellst`, `best`, `größt`, `höchst`). Applying schwach endings gives `schnellste`, `beste`, `größte`, `höchste`. This is CORRECT. But the pitfall is treating `superlativ` as if it were the adverbial form `am schnellsten` — it is not stored that way.

**Why it happens:** German superlatives are used two ways: attributive (declined, `schnellste`) and adverbial (`am schnellsten`). The comparison data stores the stem, not the adverbial form.

**How to avoid:** Apply schwach endings directly to `comparison.superlativ` value. Confirm: `gut → best → beste/besten/bestem/bester/bestes` (all correct).

---

## Code Examples

### Complete Generation Script Structure

```javascript
// .planning/phases/08-declension-tables/generate-declension.js
import { readFileSync, writeFileSync } from 'fs';

// ===== ENDING TABLES (constant — same for all adjectives) =====
const ENDINGS = {
  stark: {
    nominativ:  { maskulin: 'er', feminin: 'e',  neutrum: 'es', plural: 'e'  },
    akkusativ:  { maskulin: 'en', feminin: 'e',  neutrum: 'es', plural: 'e'  },
    dativ:      { maskulin: 'em', feminin: 'er', neutrum: 'em', plural: 'en' },
    genitiv:    { maskulin: 'en', feminin: 'er', neutrum: 'en', plural: 'er' },
  },
  schwach: {
    nominativ:  { maskulin: 'e',  feminin: 'e',  neutrum: 'e',  plural: 'en' },
    akkusativ:  { maskulin: 'en', feminin: 'e',  neutrum: 'e',  plural: 'en' },
    dativ:      { maskulin: 'en', feminin: 'en', neutrum: 'en', plural: 'en' },
    genitiv:    { maskulin: 'en', feminin: 'en', neutrum: 'en', plural: 'en' },
  },
  gemischt: {
    nominativ:  { maskulin: 'er', feminin: 'e',  neutrum: 'es', plural: 'en' },
    akkusativ:  { maskulin: 'en', feminin: 'e',  neutrum: 'es', plural: 'en' },
    dativ:      { maskulin: 'en', feminin: 'en', neutrum: 'en', plural: 'en' },
    genitiv:    { maskulin: 'en', feminin: 'en', neutrum: 'en', plural: 'en' },
  },
};

// ===== POSITIV STEM EXCEPTIONS =====
// Only adjectives where the positiv declension stem differs from the base word.
// Source: Duden German grammar, verified against standard references.
const POSITIV_STEM_EXCEPTIONS = {
  'hoch_adj':    'hoh',      // hoher, hohe, hohes, hohem (NOT hochem — SC-3 critical check)
  'dunkel_adj':  'dunkl',    // dunkler, dunkle, dunkles, dunklem (unstressed -el → e-drop)
  'flexibel_adj':'flexibl',  // flexibler, flexible, flexibles (unstressed -el → e-drop)
  'teuer_adj':   'teur',     // teurer, teure, teures, teurem (optional: teuerem as alt)
};

// ===== BLOCK HELPERS =====
function makeCaseBlock(stem, endingsTable) {
  const block = {};
  for (const [caseKey, genders] of Object.entries(endingsTable)) {
    block[caseKey] = Object.fromEntries(
      Object.entries(genders).map(([g, e]) => [g, stem + e])
    );
  }
  return block;
}

function makeArticleBlock(stem) {
  return {
    stark:    makeCaseBlock(stem, ENDINGS.stark),
    schwach:  makeCaseBlock(stem, ENDINGS.schwach),
    gemischt: makeCaseBlock(stem, ENDINGS.gemischt),
  };
}

function makeSuperlativBlock(supStem) {
  return { schwach: makeCaseBlock(supStem, ENDINGS.schwach) };
}

// ===== DECLENSION BUILDER =====
function buildDeclension(id, entry) {
  const posStem  = POSITIV_STEM_EXCEPTIONS[id] ?? entry.word;
  const declension = { positiv: makeArticleBlock(posStem) };

  if (!entry.nicht_komparierbar && entry.comparison?.komparativ) {
    const kompForm = entry.comparison.komparativ; // e.g., 'schneller', 'besser', 'höher'
    const supForm  = entry.comparison.superlativ; // e.g., 'schnellst', 'best', 'höchst'

    // komparativ: use full komparativ form as base
    // schneller + endings → schnellerer/schnellere/schnelleres/schnellerem etc.
    // viel (mehr) is a special case: mehr does not end in -er; add to exceptions
    declension.komparativ = makeArticleBlock(kompForm);
    declension.superlativ = makeSuperlativBlock(supForm);
  }

  return declension;
}

// ===== BANK PROCESSOR =====
function processBank(filePath) {
  const bank = JSON.parse(readFileSync(filePath, 'utf8'));
  let populated = 0, skipped = 0;

  for (const [id, entry] of Object.entries(bank)) {
    if (id === '_metadata') continue;
    if (entry.undeclinable) { skipped++; continue; }
    entry.declension = buildDeclension(id, entry);
    populated++;
  }

  bank._metadata.generatedAt = new Date().toISOString();
  writeFileSync(filePath, JSON.stringify(bank, null, 2) + '\n');
  console.log(`${filePath}: ${populated} populated, ${skipped} skipped`);
}

// ===== MAIN =====
processBank('vocabulary/core/de/adjectivebank.json');
processBank('vocabulary/dictionary/de/adjectivebank.json');
console.log('Done. Run: node scripts/validate-adjectives.js');
```

### Key Spot-Checks for Verification Script

```javascript
// Source: German grammar + success criteria from CONTEXT.md
const core = JSON.parse(readFileSync('vocabulary/core/de/adjectivebank.json', 'utf8'));

// SC-3 CRITICAL: hoch positiv — hohem must appear, hochem must NOT
check('hoch stark.dat.m', core.hoch_adj.declension.positiv.stark.dativ.maskulin, 'hohem');

// dunkel e-drop check
check('dunkel stark.nom.m', core.dunkel_adj.declension.positiv.stark.nominativ.maskulin, 'dunkler');
check('dunkel stark.dat.m', core.dunkel_adj.declension.positiv.stark.dativ.maskulin, 'dunklem');

// teuer e-drop check
check('teuer stark.nom.n', core.teuer_adj.declension.positiv.stark.nominativ.neutrum, 'teures');

// Regular adjective sanity check
check('schnell stark.nom.m', core.schnell_adj.declension.positiv.stark.nominativ.maskulin, 'schneller');

// Komparativ block uses FULL form as base
check('schnell komp stark.nom.m', core.schnell_adj.declension.komparativ.stark.nominativ.maskulin, 'schnellerer');
check('hoch komp stark.nom.m', core.hoch_adj.declension.komparativ.stark.nominativ.maskulin, 'höherer');

// gut suppletive: superlativ block
check('gut sup schwach.nom.m', core.gut_adj.declension.superlativ.schwach.nominativ.maskulin, 'beste');
check('gut sup schwach.dat.m', core.gut_adj.declension.superlativ.schwach.dativ.maskulin, 'besten');

// nicht_komparierbar: positiv only, no komparativ/superlativ
check('absolut has positiv',    !!core.absolut_adj.declension.positiv,    true);
check('absolut no komparativ',  core.absolut_adj.declension.komparativ,   undefined);
check('absolut no superlativ',  core.absolut_adj.declension.superlativ,   undefined);

// Coverage: 360 entries have declension.positiv (365 - 5 undeclinable)
const withPositiv = Object.entries(core)
  .filter(([k, v]) => k !== '_metadata' && v.declension?.positiv).length;
check('coverage: 360 have positiv', withPositiv, 360);
```

### Irregular Review Report (IRREGULAR-REVIEW.md)

The report should list all irregular entries' key forms in a tabular format for human scanning:

```markdown
# Irregular Declension Forms — Human Review

| Adjective | Positiv stem | Sample forms | Komparativ base | Sample forms | Superlativ stem |
|-----------|-------------|------|----------|------|--------|
| hoch | hoh- | hoher, hohe, hohem | höher | höherer, höhere | höchst → höchste |
| dunkel | dunkl- | dunkler, dunkle, dunklem | dunkler | dunklerer, dunklere | dunkelst → dunkelste |
| ... | | | | | |
```

This report is the "committed markdown review report" required by the CONTEXT.md decisions.

---

## Superlativ Degree: Include or Skip?

**Decision: Include superlativ (schwach only).**

Rationale:
- SC-2 in the roadmap success criteria explicitly states: "Every comparable adjective in the core bank has `declension.komparativ` and `declension.superlativ` blocks"
- CONTEXT.md deferred ideas section is empty — superlativ is not deferred
- Schema already defines `superlativBlock` as `{ schwach: caseBlock }` — no schema change needed
- Grammatical basis: German superlatives always require a definite article, so only schwach declension is grammatically correct (16 cells per adjective, not 48)
- Scale: 352 × 16 = 5,632 additional cells — trivial to generate programmatically

**Implementation:** `makeSuperlativBlock(supForm)` applies schwach endings to `comparison.superlativ`. The superlativ value is already the bare stem (e.g., `best`, `schnellst`, `höchst`).

---

## State of the Art

| Old Approach | Current Approach | Impact |
|--------------|------------------|--------|
| Manual entry of all declension forms | Rule engine + stem exception table (~4 exceptions) | ~39,800 cells generated programmatically from 4 exception entries + constant ending tables |
| Phase 6 stubs with `declension: {}` placeholders | Phase 8 populates all cells | v2 API can serve full declension tables |
| 101 older entries without declension key | Script adds declension key regardless of whether key was present | All 360 declinable entries uniformly populated |

**Deprecated/outdated:**
- Nothing — this is a new data population phase, not a replacement of existing patterns.

---

## Open Questions

1. **viel komparativ forms (mehr)**
   - What we know: `mehr` is the komparativ of `viel` and does not end in `-er`. The script algorithm assumes all komparativ forms end in `-er` (verified: `mehr` is the only exception in the bank).
   - What's unclear: The "correct" declined forms of `mehr` as a comparative adjective. In practice, `mehr` as a comparative is often used undeclined (`mehr Geld`, `für mehr Geld`). When declined, forms like `mehrere` (plural) exist but these conflate with `mehrere` as an indefinite pronoun.
   - Recommendation: Add `viel_adj` to a `KOMPARATIV_EXCEPTIONS` table in the script. Hand-curate the forms based on Duden. Alternative: document that `viel` komparativ declension forms are linguistically unusual and fill with the most standard available forms.

2. **teuer alternative forms — which cells have Duden-recognized variants?**
   - What we know: `teuer` positiv has `teur-` as primary stem (teures, teure, teurer, teurem). Some cells may have accepted alternate forms with `teuer-` stem (teueres, teuerere, teuerem).
   - What's unclear: Exactly which of the ~16 positiv cells have Duden-accepted alternatives (some are clearly primary-only).
   - Recommendation: Duden lookup for `teuer` declined forms during plan execution. Mark confirmed alternatives in `declension_alternatives` key. Conservative: only mark cells where Duden explicitly lists both forms.

3. **~10-15 adjectives with alternatives — which ones?**
   - What we know: CONTEXT says ~10-15 adjectives have genuine Duden-recognized variant forms. `teuer` is one confirmed case. `-er` adjectives where e-drop is per-adjective (not blanket) are the primary candidates.
   - What's unclear: The complete list. Candidates: `teuer` (teur-/teuer-), potentially `dunkel` (but e-drop is the primary Duden form, so likely no alternative).
   - Recommendation: During plan execution, do a targeted Duden lookup for each `-el` and `-er` adjective in the exception table. Limit `declension_alternatives` to confirmed cases only. Do not add speculative alternatives.

4. **Execution batching strategy**
   - What we know: 39,800 cells must be generated. Script approach means a single run generates all of them.
   - What's unclear: Whether to do all 360 in one plan or split by degree (positiv first, then komparativ+superlativ).
   - Recommendation: Single plan, single script run. The script is deterministic; there is no incremental state to manage. Phase 7 did 365 entries in ~2 minutes as a single plan.

---

## Sources

### Primary (HIGH confidence)

- Direct inspection: `vocabulary/core/de/adjectivebank.json` — 365 entries; 5 undeclinable (no declension field); 8 nicht_komparierbar (declension: {} or no key); 352 comparable; 259 with declension: {}, 101 with no declension key, 0 with populated declension data.
- Direct inspection: `vocabulary/schema/adjective.schema.json` — `genderNumber` properties are `{ type: string }`; `declension` has `additionalProperties: false`; `adjectiveEntry` has NO `additionalProperties` restriction; `superlativBlock` allows only `schwach`; ending table structure confirmed from schema $defs.
- Direct inspection: `vocabulary/dictionary/de/adjectivebank.json` — mirrors core bank structure; same dual-bank pattern established in Phase 7.
- Direct inspection: `.planning/phases/07-comparison-data/generate-comparison.js` — established patterns: ESM Node.js, embedded exception table, `processBank()` dual-bank write, `JSON.stringify(bank, null, 2) + '\n'`.
- German grammar (high confidence domain knowledge): ending tables for stark/schwach/gemischt declension are fixed and standard. Verified: `schnell` → `schneller/schnelle/schnelles/schnellem` (stark) matches expected German.
- Stem exception verification: `hoh-` stem produces `hohem` (not `hochem`) — confirmed algorithmically.
- Stem exception verification: `dunkl-` produces `dunkler/dunkle/dunkles/dunklem` — all correct.
- Stem exception verification: `teur-` produces `teurer/teure/teures/teurem` — all correct.

### Secondary (MEDIUM confidence)

- German grammar (training data): komparativ block uses full komparativ form as base stem — `schneller` produces `schnellerer/schnellere/schnelleres`. Standard German grammar, consistent with how comparative adjectives are taught.
- German grammar (training data): superlativ uses schwach-only declension — grammatically correct because German superlatives require definite article. Corroborated by schema (`superlativBlock` definition allows only `schwach`).
- CONTEXT.md SC-2 interpretation: "superlativ blocks" are included. The schema's `superlativBlock` (schwach only) matches the stated requirement.

### Tertiary (LOW confidence)

- Alternative forms for teuer and other `-er` adjectives: training data suggests `teurem` (primary) / `teuerem` (accepted) for `stark.dat.m`. Needs Duden verification during plan execution.
- Scope of ~10-15 adjectives with alternatives: estimate from CONTEXT is not enumerated. Actual count and which adjectives require Duden lookup during execution.

---

## Metadata

**Confidence breakdown:**
- Scope (entry counts, file paths, bank structure): HIGH — verified by direct inspection
- Schema constraints (what keys are allowed, what types): HIGH — read directly from adjective.schema.json
- Ending tables (stark/schwach/gemischt): HIGH — standard German grammar, verified algorithmically
- Positiv stem exceptions (hoch/dunkel/flexibel/teuer): HIGH — verified forms (hohem, dunklem, teures etc.)
- Komparativ block approach (use full form as base): MEDIUM — linguistically correct, but sample of only a few adjectives verified
- Alternative forms mechanism (declension_alternatives key): HIGH — schema inspection confirms entry level is unrestricted
- Alternative forms CONTENT (~10-15 adjectives, which cells): LOW — needs Duden lookup during execution
- viel komparativ (mehr) handling: MEDIUM — linguistically justified to use exception table; actual forms need verification

**Research date:** 2026-02-21
**Valid until:** 2026-08-21 (stable — internal file structure, not external API)
