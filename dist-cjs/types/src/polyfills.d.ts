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
export declare const setBufferPolyfill: (Buffer: any) => void;
export {};
