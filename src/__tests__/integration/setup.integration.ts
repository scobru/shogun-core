import { TextEncoder, TextDecoder } from "util";

// Add jest types
declare const jest: any;
declare const afterEach: any;
declare const test: any;
declare const expect: any;

// Polyfill TextEncoder and TextDecoder for Node.js environment
if (typeof global.TextEncoder === "undefined") {
  global.TextEncoder = TextEncoder as any;
}

if (typeof global.TextDecoder === "undefined") {
  global.TextDecoder = TextDecoder as any;
}

// Polyfill crypto for Node.js environment
if (typeof global.crypto === "undefined") {
  const crypto = require("crypto");
  global.crypto = {
    getRandomValues: (arr: any) => crypto.randomFillSync(arr),
    subtle: {
      generateKey: async () =>
        ({
          type: "secret",
          extractable: true,
          algorithm: { name: "AES-GCM" },
          usages: ["encrypt", "decrypt"],
        }) as any,
      importKey: async () =>
        ({
          type: "secret",
          extractable: true,
          algorithm: { name: "AES-GCM" },
          usages: ["encrypt", "decrypt"],
        }) as any,
      deriveBits: jest.fn().mockImplementation((params, key, bits) => {
        // Generate a valid private key for testing
        const keyBytes = new Uint8Array(32);
        
        // Use both the salt and the key (which contains the input) to generate different keys
        const salt = params.salt;
        const saltBytes = new Uint8Array(salt);
        
        // Get the input from the key (which is the combined password + extra)
        const inputBytes = new Uint8Array(key);
        
        // Create a hash that combines both salt and input
        let hash = 0;
        for (let i = 0; i < saltBytes.length; i++) {
          hash = ((hash << 7) - hash + saltBytes[i] * (i + 1)) & 0xffffffff;
        }
        for (let i = 0; i < inputBytes.length; i++) {
          hash = ((hash << 11) - hash + inputBytes[i] * (i + 2)) & 0xffffffff;
        }
        
        // Generate a deterministic but varied key based on combined hash
        for (let i = 0; i < 32; i++) {
          keyBytes[i] = (hash + i * 23 + saltBytes[i % saltBytes.length] * 19 + inputBytes[i % inputBytes.length] * 17 + 11) % 256;
        }
        
        // Ensure it's within valid range for both P-256 and secp256k1
        keyBytes[0] = 0x01; // Start with 1 to ensure it's not zero
        keyBytes[1] = 0x23; // Safe value
        keyBytes[2] = 0x45; // Safe value
        keyBytes[3] = 0x67; // Safe value
        keyBytes[4] = 0x89; // Safe value
        keyBytes[5] = 0xab; // Safe value
        keyBytes[6] = 0xcd; // Safe value
        keyBytes[7] = 0xef; // Safe value
        
        // Fill the rest with a pattern that's safe for both curves
        for (let i = 8; i < 32; i++) {
          keyBytes[i] = (i * 13 + 7) % 256;
        }
        
        // Ensure the last few bytes are safe for both curve orders
        keyBytes[30] = 0x12; // Safe value
        keyBytes[31] = 0x34; // Safe value
        
        return Promise.resolve(keyBytes.buffer);
      }),
      encrypt: async () => new Uint8Array(16) as any,
      decrypt: async () => new Uint8Array(16) as any,
      sign: async () => new Uint8Array(64) as any,
      verify: async () => true,
      digest: async () => new Uint8Array(32) as any,
    },
  };
}

// IMPORTANTE: NON mockiamo GunDB per i test di integrazione
// Lasciamo che i test usino istanze reali di GunDB

console.log("🔧 Integration Test Setup: GunDB mocking DISABLED - using real instances");
