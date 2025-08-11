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
      encrypt: async () => new Uint8Array(16) as any,
      decrypt: async () => new Uint8Array(16) as any,
      sign: async () => new Uint8Array(64) as any,
      verify: async () => true,
      digest: async () => new Uint8Array(32) as any,
    },
  } as any;
}

// Polyfill window object for browser-like environment
if (typeof global.window === "undefined") {
  global.window = {
    location: { href: "http://localhost:3000" },
    navigator: {
      userAgent: "Jest Test Environment",
      platform: "Win32",
    },
    document: {
      createElement: () => ({}),
      getElementById: () => null,
    },
    localStorage: {
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {},
      clear: () => {},
    },
    sessionStorage: {
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {},
      clear: () => {},
    },
    addEventListener: () => {},
    removeEventListener: () => {},
  } as any;
}

// Polyfill fetch for Node.js environment
if (typeof global.fetch === "undefined") {
  global.fetch = async () =>
    ({
      ok: true,
      json: async () => ({}),
      text: async () => "",
    }) as any;
}

// Global Gun mock
const mockGunInstance = {
  user: jest.fn(() => ({
    create: jest.fn(),
    auth: jest.fn(),
    leave: jest.fn(),
    recall: jest.fn(),
    get: jest.fn(),
    put: jest.fn(),
    on: jest.fn(),
    once: jest.fn(),
    off: jest.fn(),
  })),
  get: jest.fn(() => ({
    map: jest.fn(),
    once: jest.fn(),
    put: jest.fn(),
    on: jest.fn(),
    off: jest.fn(),
  })),
  on: jest.fn(),
  once: jest.fn(),
  off: jest.fn(),
};

// Create a mock Gun constructor
const MockGun = jest.fn(() => mockGunInstance);

// Set global Gun mock
global.Gun = MockGun as any;

// Mock Gun modules
jest.doMock("gun", () => ({
  default: MockGun,
  SEA: {
    pair: jest.fn(),
    sign: jest.fn(),
    verify: jest.fn(),
    encrypt: jest.fn(),
    decrypt: jest.fn(),
    secret: jest.fn(),
    work: jest.fn(),
  },
}));

jest.doMock("gun/gun", () => MockGun);

jest.doMock("gun/sea", () => ({
  pair: jest.fn(),
  sign: jest.fn(),
  verify: jest.fn(),
  encrypt: jest.fn(),
  decrypt: jest.fn(),
  secret: jest.fn(),
  work: jest.fn(),
}));

// Mock other Gun imports
jest.doMock("gun/lib/then.js", () => ({}));
jest.doMock("gun/lib/radisk.js", () => ({}));
jest.doMock("gun/lib/store.js", () => ({}));
jest.doMock("gun/lib/rindexed.js", () => ({}));
jest.doMock("gun/lib/webrtc.js", () => ({}));
jest.doMock("gun/lib/yson.js", () => ({}));

// Cleanup after each test
afterEach(() => {
  jest.clearAllMocks();
});

// Dummy test to make this a valid test suite
test("dummy test", () => {
  expect(true).toBe(true);
});
