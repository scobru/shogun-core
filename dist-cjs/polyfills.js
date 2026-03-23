"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.setBufferPolyfill = void 0;
const buffer_1 = require("buffer");
// Ensure process is available for browser
if (typeof window !== 'undefined') {
    if (!window.process) {
        window.process = { env: {} };
    }
    if (!window.global) {
        window.global = window;
    }
}
// Export a function to manually set Buffer
// This should be called by users before importing shogun-core if using Vite
// Webpack projects should use ProvidePlugin which makes Buffer available automatically
const setBufferPolyfill = (Buffer) => {
    if (typeof window !== 'undefined') {
        window.Buffer = Buffer;
        window.global = window.global || window;
        window.global.Buffer = Buffer;
    }
    if (typeof globalThis !== 'undefined') {
        globalThis.Buffer = Buffer;
    }
};
exports.setBufferPolyfill = setBufferPolyfill;
// Try to set Buffer from window if it's already available (from bundler)
if (typeof window !== 'undefined' &&
    window.Buffer &&
    typeof Buffer === 'undefined') {
    (0, exports.setBufferPolyfill)(window.Buffer);
}
else if (typeof globalThis !== 'undefined' && typeof Buffer === 'undefined') {
    (0, exports.setBufferPolyfill)(buffer_1.Buffer);
}
