// @ts-nocheck
import { TextEncoder, TextDecoder } from "util";

if (typeof global.TextEncoder === "undefined") {
  global.TextEncoder = TextEncoder;
}

if (typeof global.TextDecoder === "undefined") {
  global.TextDecoder = TextDecoder as any;
}

// Cleanup dopo ogni test
afterEach(() => {
  jest.clearAllMocks();
});

// Dummy test to make this a valid test suite
test("dummy test", () => {
  expect(true).toBe(true);
});
