import { writeFileSync, mkdirSync, readFileSync, readdirSync, statSync, copyFileSync } from 'fs';
import { dirname, resolve, join, relative } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const distPath = resolve(__dirname, '../dist');
const distCjsPath = resolve(__dirname, '../dist-cjs');

// Copy all non-js files from dist to dist-cjs
function copyNonJsFiles(src, dest) {
  const entries = readdirSync(src, { withFileTypes: true });
  
  for (const entry of entries) {
    const srcPath = join(src, entry.name);
    const destPath = join(dest, entry.name);
    
    if (entry.isDirectory()) {
      if (entry.name === 'browser') continue; // Skip browser bundle
      mkdirSync(destPath, { recursive: true });
      copyNonJsFiles(srcPath, destPath);
    } else if (!entry.name.endsWith('.js') && !entry.name.endsWith('.js.map')) {
      // Copy non-JS files (types, etc.)
      copyFileSync(srcPath, destPath);
    }
  }
}

// Copy type definitions and other non-JS files
if (statSync(distPath).isDirectory()) {
  mkdirSync(distCjsPath, { recursive: true });
  copyNonJsFiles(distPath, distCjsPath);
}

console.log('[make-cjs] Copied non-JS files from dist to dist-cjs');

