# Roadmap: v1.0 — German Data Completeness

**2 phases** | **5 requirements mapped** | All covered ✓

| # | Phase | Goal | Requirements | Success Criteria |
|---|-------|------|--------------|-----------------|
| 1 | Fix German Noun Plurals | Every German noun entry has complete plural and genus data | NOUN-01, NOUN-02, NOUN-03 | 3 |
| 2 | Add German Preteritum Conjugations | Every German verb has preteritum conjugations for all 6 pronoun forms | VERB-01, VERB-02 | 3 |

---

## Phase Details

### Phase 1: Fix German Noun Plurals ✓ COMPLETE

**Goal:** Every German noun entry in `nounbank.json` has complete plural and genus data.

**Requirements:** NOUN-01, NOUN-02, NOUN-03

**File:** `vocabulary/core/de/nounbank.json`

**Success criteria:**
1. Zero noun entries are missing the `plural` field (explicit `null` for uncountable is acceptable)
2. All noun entries have a `genus` field (m/f/n)
3. No `word` field contains an article prefix (e.g., "das Haustier" → "Haustier")

**Completed:** 2026-02-20 — 29 entries patched (Group A: null plurals for subjects/holidays/months; Group B: correct plural forms for sports/measurements; Group C: structural fixes)

---

### Phase 2: Add German Preteritum Conjugations

**Goal:** Every German verb in `verbbank.json` has `preteritum` conjugations alongside existing `presens`, enabling Leksihjelp to match past-tense forms (e.g., "war" → "sein").

**Requirements:** VERB-01, VERB-02

**File:** `vocabulary/core/de/verbbank.json`

**Scope:** 148 verbs, all currently missing preteritum.

**Data format:**
```json
"conjugations": {
  "presens": { "former": { ... }, "feature": "grammar_presens" },
  "preteritum": {
    "former": {
      "ich": "war",
      "du": "warst",
      "er/sie/es": "war",
      "wir": "waren",
      "ihr": "wart",
      "sie/Sie": "waren"
    },
    "feature": "grammar_preteritum"
  }
}
```

**Success criteria:**
1. All 148 verbs have `conjugations.preteritum.former` with all 6 pronoun keys
2. Verification script reports 0 verbs missing preteritum
3. Strong/irregular verbs (sein, haben, werden, gehen, kommen, etc.) use correct ablaut forms

---

## Verification Commands

```bash
# Phase 1 — noun plural coverage
node << 'EOF'
const data = require('./vocabulary/core/de/nounbank.json');
const nouns = Object.values(data).filter(n => n._id);
const missing = nouns.filter(n => !('plural' in n) && !('declension' in n));
console.log('Nouns missing plural:', missing.length);
EOF

# Phase 2 — verb preteritum coverage
node << 'EOF'
const data = require('./vocabulary/core/de/verbbank.json');
const verbs = Object.values(data).filter(v => v._id);
const missing = verbs.filter(v => !(v.conjugations && v.conjugations.preteritum));
console.log('Verbs missing preteritum:', missing.length);
missing.forEach(v => console.log(' -', v._id, v.word));
EOF
```
