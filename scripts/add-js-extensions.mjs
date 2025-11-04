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
// Matches: from "./path" or from '../path' or export * from "./path" or import("./path")
const importExportRegex = /(?:from|import\()\s*['"](\.\.?\/[^'"]+?)(['"])/g;

function resolveImportPath(importPath, currentFileDir) {
  // Skip if it's already has an extension
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
  }

  // Check if it's a file with .js extension
  if (existsSync(fullPath + ".js")) {
    return importPath + ".js";
  }

  // If neither exists, assume it should be .js (default behavior)
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

      // Fix import/export statements
      content = content.replace(importExportRegex, (match, path, quote) => {
        // Skip if it's already has an extension or if it's a directory import (ends with /)
        if (path.endsWith("/")) {
          return match;
        }
        // Skip if already has a file extension
        if (path.match(/\.(js|json|ts|tsx|mjs|cjs)$/)) {
          return match;
        }
        // Skip node_modules imports (absolute imports)
        if (!path.startsWith("./") && !path.startsWith("../")) {
          return match;
        }

        const resolvedPath = resolveImportPath(path, fileDir);
        return match.replace(path + quote, resolvedPath + quote);
      });

      if (content !== originalContent) {
        writeFileSync(fullPath, content, "utf8");
        console.log(`[add-js-extensions] Fixed imports in ${fullPath}`);
      }
    }
  }
}

if (statSync(distPath).isDirectory()) {
  console.log(
    "[add-js-extensions] Adding .js extensions to relative imports..."
  );
  addJsExtensions(distPath);
  console.log("[add-js-extensions] Done!");
} else {
  console.warn("[add-js-extensions] dist/src directory not found, skipping...");
}
