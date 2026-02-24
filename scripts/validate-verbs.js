import Ajv2020 from 'ajv/dist/2020.js';
import { readFileSync } from 'fs';

const verbBankPath = process.env.VERB_BANK || 'vocabulary/banks/de/verbbank.json';

const coreSchema = JSON.parse(readFileSync('vocabulary/schema/core-word.schema.json', 'utf8'));
const verbSchema = JSON.parse(readFileSync('vocabulary/schema/verb.schema.json', 'utf8'));
const verbBank = JSON.parse(readFileSync(verbBankPath, 'utf8'));

// Strip _metadata — schemas validate word entries only, not the bank metadata object
const { _metadata, ...verbEntries } = verbBank;

const ajv = new Ajv2020({ strict: false, allErrors: true });
ajv.addSchema(coreSchema, 'core-word.schema.json');
ajv.addSchema(verbSchema);

const validate = ajv.getSchema('https://papertek.no/schemas/vocabulary/verb.schema.json');
if (!validate) { console.error('Schema not found'); process.exit(1); }

const valid = validate(verbEntries);
if (valid) {
  const count = Object.keys(verbEntries).length;
  console.log(`PASS: All ${count} verb entries validate against schema`);
  process.exit(0);
} else {
  const errorCount = (validate.errors || []).length;
  console.error(`FAIL: ${errorCount} validation error(s) found`);
  console.error(JSON.stringify(validate.errors, null, 2));
  process.exit(1);
}
