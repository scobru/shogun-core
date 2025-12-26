/**
 * Browser polyfills for shogun-core
 *
 * This module sets up Buffer and other Node.js polyfills for browser environments.
 * It must be imported before any other shogun-core modules that use these APIs.
 *
 * IMPORTANT: This polyfill relies on the bundler to provide Buffer.
 *
 * For Vite projects, configure vite.config.ts:
 * ```ts
 * import { defineConfig } from "vite";
 * import { Buffer } from "buffer";
 *
 * export default defineConfig({
 *   define: { global: "globalThis" },
 *   resolve: { alias: { buffer: "buffer" } },
 *   optimizeDeps: { include: ["buffer"] },
 * });
 * ```
 *
 * Then import the polyfill in your main entry file BEFORE importing shogun-core:
 * ```ts
 * import { Buffer } from "buffer";
 * import { setBufferPolyfill } from "shogun-core";
 * setBufferPolyfill(Buffer);
 * ```
 *
 * For Webpack projects, the ProvidePlugin should handle this automatically.
 */

import { Buffer as BufferPolyfill } from 'buffer';

// Ensure process is available for browser
if (typeof window !== 'undefined') {
  if (!(window as any).process) {
    (window as any).process = { env: {} };
  }

  if (!(window as any).global) {
    (window as any).global = window;
  }
}

// Export a function to manually set Buffer
// This should be called by users before importing shogun-core if using Vite
// Webpack projects should use ProvidePlugin which makes Buffer available automatically
export const setBufferPolyfill = (Buffer: any) => {
  if (typeof window !== 'undefined') {
    (window as any).Buffer = Buffer;
    (window as any).global = (window as any).global || window;
    (window as any).global.Buffer = Buffer;
  }

  if (typeof globalThis !== 'undefined') {
    (globalThis as any).Buffer = Buffer;
  }
};

// Try to set Buffer from window if it's already available (from bundler)
if (
  typeof window !== 'undefined' &&
  (window as any).Buffer &&
  typeof Buffer === 'undefined'
) {
  setBufferPolyfill((window as any).Buffer);
} else if (typeof globalThis !== 'undefined' && typeof Buffer === 'undefined') {
  setBufferPolyfill(BufferPolyfill);
}

// Export empty to make this a valid module
export {};
