import {
  readdirSync,
  readFileSync,
  writeFileSync,
  statSync,
  existsSync,
} from "fs";
import { join, dirname, resolve, extname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const distPath = resolve(__dirname, "../dist/src");

// Regex to match relative imports/exports that need .js extension
// Matches:
// - import ... from "./path" or import ... from '../path'
// - export * from "./path" or export { ... } from "./path"
// - import("./path") or require("./path")
// - import "./path" (side-effect imports)
const importExportRegex = /(?:from|import\()\s*['"](\.\.?\/[^'"]+?)(['"])/g;
// Also match side-effect imports: import "./path"
const sideEffectImportRegex = /^import\s+['"](\.\.?\/[^'"]+?)(['"])/gm;

function resolveImportPath(importPath, currentFileDir) {
  // Skip if it already has an extension
  if (extname(importPath)) {
    return importPath;
  }

  // Skip node_modules imports (absolute imports)
  if (!importPath.startsWith("./") && !importPath.startsWith("../")) {
    return importPath;
  }

  // Resolve the full path
  const fullPath = resolve(currentFileDir, importPath);

  // Check if it's a directory with index.js
  if (existsSync(fullPath) && statSync(fullPath).isDirectory()) {
    if (existsSync(join(fullPath, "index.js"))) {
      return importPath + "/index.js";
    }
    // If directory exists but no index.js, assume it should be /index.js
    return importPath + "/index.js";
  }

  // Check if it's a file with .js extension
  if (existsSync(fullPath + ".js")) {
    return importPath + ".js";
  }

  // Check if the file exists without extension (shouldn't happen in compiled JS, but just in case)
  if (existsSync(fullPath)) {
    // File exists without extension, assume it's .js
    return importPath + ".js";
  }

  // If file doesn't exist, assume it should be .js (default behavior for ESM)
  // This handles cases where the file might not be compiled yet or is in a different location
  return importPath + ".js";
}

function addJsExtensions(dir, baseDir = dir) {
  const entries = readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = join(dir, entry.name);

    if (entry.isDirectory()) {
      addJsExtensions(fullPath, baseDir);
    } else if (entry.name.endsWith(".js")) {
      let content = readFileSync(fullPath, "utf8");
      let originalContent = content;
      const fileDir = dirname(fullPath);

      // Fix import/export statements (from ... and import(...))
      content = content.replace(importExportRegex, (match, path, quote) => {
        // Skip if it's already a directory import (ends with /)
        if (path.endsWith("/")) {
          return match;
        }
        // Skip if already has a file extension
        if (path.match(/\.(js|json|ts|tsx|mjs|cjs|css|scss)$/)) {
          return match;
        }
        // Skip node_modules imports (absolute imports)
        if (!path.startsWith("./") && !path.startsWith("../")) {
          return match;
        }

        const resolvedPath = resolveImportPath(path, fileDir);
        if (resolvedPath !== path) {
          return match.replace(path + quote, resolvedPath + quote);
        }
        return match;
      });

      // Fix side-effect imports (import "./path")
      content = content.replace(sideEffectImportRegex, (match, path, quote) => {
        // Skip if it's already a directory import (ends with /)
        if (path.endsWith("/")) {
          return match;
        }
        // Skip if already has a file extension
        if (path.match(/\.(js|json|ts|tsx|mjs|cjs|css|scss)$/)) {
          return match;
        }
        // Skip node_modules imports (absolute imports)
        if (!path.startsWith("./") && !path.startsWith("../")) {
          return match;
        }

        const resolvedPath = resolveImportPath(path, fileDir);
        if (resolvedPath !== path) {
          return match.replace(path + quote, resolvedPath + quote);
        }
        return match;
      });

      if (content !== originalContent) {
        writeFileSync(fullPath, content, "utf8");
        console.log(`[add-js-extensions] Fixed imports in ${fullPath}`);
      }
    }
  }
}

// Check if dist/src exists
if (existsSync(distPath) && statSync(distPath).isDirectory()) {
  console.log(
    "[add-js-extensions] Adding .js extensions to relative imports in dist/src..."
  );
  addJsExtensions(distPath);
  console.log("[add-js-extensions] Done!");
} else {
  console.warn(
    `[add-js-extensions] dist/src directory not found at ${distPath}, skipping...`
  );
  process.exit(0); // Exit successfully even if directory doesn't exist
}
