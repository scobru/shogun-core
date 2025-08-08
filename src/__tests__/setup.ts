// Setup globale per i test
import { TextEncoder, TextDecoder } from "util";

// Polyfill per TextEncoder/TextDecoder in ambiente Node.js
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder as any;

// Mock localStorage per test
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.localStorage = localStorageMock;

// Mock crypto per test
Object.defineProperty(global, "crypto", {
  value: {
    getRandomValues: jest.fn(),
    subtle: {
      generateKey: jest.fn(),
      encrypt: jest.fn(),
      decrypt: jest.fn(),
    },
  },
});

// Mock window per test browser-like
Object.defineProperty(global, "window", {
  value: {
    localStorage: localStorageMock,
    crypto: global.crypto,
  },
});

// Cleanup dopo ogni test
afterEach(() => {
  jest.clearAllMocks();
  localStorageMock.getItem.mockClear();
  localStorageMock.setItem.mockClear();
  localStorageMock.removeItem.mockClear();
  localStorageMock.clear.mockClear();
});
