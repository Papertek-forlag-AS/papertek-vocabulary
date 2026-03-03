import { readFileSync } from 'fs';

const verbbank = JSON.parse(readFileSync('vocabulary/core/de/verbbank.json', 'utf8'));
const nounbank = JSON.parse(readFileSync('vocabulary/core/de/nounbank.json', 'utf8'));

const verbKeys = [
  'besuchen_verb', 'beginnen_verb', 'bekommen_verb', 'sich_bewegen_verb',
  'entspannen_verb', 'sich_entschuldigen_verb', 'sich_entspannen_verb',
  'erklaeren_verb', 'erzaehlen_verb', 'sich_erholen_verb',
  'vergessen_verb', 'verlieren_verb', 'versprechen_verb', 'verstehen_verb',
  'vertrauen_verb', 'sich_verspaeten_verb', 'sich_unterhalten_verb'
];

const nounKeys = [
  'loewe_noun', 'affe_noun', 'hase_noun', 'neffe_noun', 'mensch_noun',
  'elefant_noun', 'baer_noun', 'nachbar_noun', 'klassenkamerad_noun',
  'superheld_noun', 'morgenmensch_noun'
];

console.log('=== VERB ENTRIES ===');
verbKeys.forEach(k => {
  const e = verbbank[k];
  if (!e) {
    console.log('MISSING:', k);
  } else {
    console.log('FOUND:', k, '| inseparable:', e.inseparable, '| fields:', Object.keys(e).join(', '));
  }
});

console.log('\n=== NOUN ENTRIES ===');
nounKeys.forEach(k => {
  const e = nounbank[k];
  if (!e) {
    console.log('MISSING:', k);
  } else {
    console.log('FOUND:', k, '| weak_masculine:', e.weak_masculine, '| fields:', Object.keys(e).join(', '));
  }
});

// Check ge- verbs are not included
console.log('\n=== GE- STEM VERBS (should NOT have inseparable) ===');
['geben_verb', 'gehen_verb', 'gewinnen_verb'].forEach(k => {
  const e = verbbank[k];
  if (!e) {
    console.log('NOT IN BANK:', k);
  } else {
    console.log(k, '| inseparable:', e.inseparable);
  }
});
