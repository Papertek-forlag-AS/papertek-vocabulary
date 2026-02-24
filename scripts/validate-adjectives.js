import Ajv2020 from 'ajv/dist/2020.js';
import { readFileSync } from 'fs';

const coreSchema = JSON.parse(readFileSync('vocabulary/schema/core-word.schema.json', 'utf8'));
const adjSchema = JSON.parse(readFileSync('vocabulary/schema/adjective.schema.json', 'utf8'));
const adjBank = JSON.parse(readFileSync('vocabulary/banks/de/adjectivebank.json', 'utf8'));

const ajv = new Ajv2020({ strict: false, allErrors: true });
ajv.addSchema(coreSchema, 'core-word.schema.json');
ajv.addSchema(adjSchema);

const validate = ajv.getSchema('https://papertek.no/schemas/vocabulary/adjective.schema.json');
if (!validate) { console.error('Schema not found'); process.exit(1); }

const valid = validate(adjBank);
if (valid) {
  const count = Object.keys(adjBank).filter(k => k !== '_metadata').length;
  console.log(`PASS: All ${count} adjective entries validate against schema`);
  process.exit(0);
} else {
  console.error('FAIL: Validation errors:');
  console.error(JSON.stringify(validate.errors, null, 2));
  process.exit(1);
}
