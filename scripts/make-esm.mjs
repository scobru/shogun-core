import { writeFileSync, mkdirSync, readFileSync } from 'fs';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const require = createRequire(import.meta.url);

const outPath = resolve(__dirname, '../dist/index.esm.js');
mkdirSync(dirname(outPath), { recursive: true });

// Load the CJS module to get all exports
const cjsModule = require(resolve(__dirname, '../dist/index.js'));

// Get all export names
const exportNames = Object.keys(cjsModule).filter(key => key !== 'default');

// Generate export statements
const exportStatements = exportNames.map(name => `export const ${name} = cjs.${name};`).join('\n');

const content = `// ESM facade that re-exports from CJS using interop
import * as cjs from './index.js';

${exportStatements}

export default cjs;
`;

writeFileSync(outPath, content, 'utf8');
console.log('[make-esm] Wrote', outPath);
console.log('[make-esm] Exported', exportNames.length, 'named exports');

