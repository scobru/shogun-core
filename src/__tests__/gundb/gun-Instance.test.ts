// Mock Gun per evitare problemi di import
jest.mock("gun", () => ({
  on: jest.fn(),
  off: jest.fn(),
  once: jest.fn(),
  emit: jest.fn(),
  get: jest.fn(),
  put: jest.fn(),
  set: jest.fn(),
  user: jest.fn(() => ({
    auth: jest.fn(),
    create: jest.fn(),
    leave: jest.fn(),
    recall: jest.fn(),
    get: jest.fn(),
    put: jest.fn(),
    set: jest.fn(),
    once: jest.fn(),
    on: jest.fn(),
    off: jest.fn(),
    emit: jest.fn(),
    is: jest.fn(() => ({ pub: "test-pub" })),
  })),
  SEA: require("gun/sea"),
}));

// Mock Gun/SEA
jest.mock("gun/sea", () => ({
  pair: jest.fn(() => ({
    pub: "test-pub",
    priv: "test-priv",
    epub: "test-epub",
    epriv: "test-epriv",
  })),
  encrypt: jest.fn(),
  decrypt: jest.fn(),
  sign: jest.fn(),
  verify: jest.fn(),
  work: jest.fn(),
  secret: jest.fn(),
  opt: jest.fn(),
}));

// Mock Gun con struttura più realistica
jest.mock("gun/gun", () => {
  const mockGun = function () {
    return {
      on: jest.fn(),
      off: jest.fn(),
      once: jest.fn(),
      emit: jest.fn(),
      get: jest.fn(),
      put: jest.fn(),
      set: jest.fn(),
      user: jest.fn(() => ({
        auth: jest.fn(),
        create: jest.fn(),
        leave: jest.fn(),
        recall: jest.fn(),
        get: jest.fn(),
        put: jest.fn(),
        set: jest.fn(),
        once: jest.fn(),
        on: jest.fn(),
        off: jest.fn(),
        emit: jest.fn(),
        is: jest.fn(() => ({ pub: "test-pub" })),
      })),
    };
  };
  mockGun.SEA = require("gun/sea");
  return mockGun;
});

// Mock tutti i moduli gun/lib
jest.mock("gun/lib/then.js", () => ({}));
jest.mock("gun/lib/radisk.js", () => ({}));
jest.mock("gun/lib/store.js", () => ({}));
jest.mock("gun/lib/rindexed.js", () => ({}));
jest.mock("gun/lib/webrtc.js", () => ({}));
jest.mock("gun/lib/axe.js", () => ({}));

// Mock localStorage e sessionStorage
Object.defineProperty(global, "localStorage", {
  value: {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
  },
  writable: true,
});

Object.defineProperty(global, "sessionStorage", {
  value: {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
  },
  writable: true,
});

import { GunInstance } from "../../gundb/gun-Instance";

describe("GunInstance", () => {
  let gunInstance: GunInstance;
  let mockGun: any;

  beforeEach(() => {
    jest.clearAllMocks();

    // Create a more realistic mock Gun instance
    const mockUserInstance = {
      auth: jest.fn(),
      create: jest.fn(),
      leave: jest.fn(),
      recall: jest.fn(() => mockUserInstance),
      get: jest.fn(),
      put: jest.fn(),
      set: jest.fn(),
      once: jest.fn(),
      on: jest.fn(),
      off: jest.fn(),
      emit: jest.fn(),
      is: jest.fn(() => ({ pub: "test-pub" })),
    };

    mockGun = {
      on: jest.fn(),
      off: jest.fn(),
      once: jest.fn(),
      emit: jest.fn(),
      get: jest.fn(),
      put: jest.fn(),
      set: jest.fn(),
      user: jest.fn(() => mockUserInstance),
    };

    gunInstance = new GunInstance(mockGun);
  });

  describe("Constructor", () => {
    it("should create GunInstance with default configuration", () => {
      expect(gunInstance).toBeDefined();
      expect(gunInstance.gun).toBeDefined();
      // Note: user might be null initially
      expect(gunInstance.user).toBeDefined();
    });

    it("should create GunInstance with custom configuration", () => {
      const customInstance = new GunInstance(mockGun, "custom-scope");
      expect(customInstance).toBeDefined();
    });

    it("should handle constructor errors gracefully", () => {
      expect(() => new GunInstance(null as any)).toThrow(
        "Gun instance is required but was not provided",
      );
    });
  });

  describe("Event System", () => {
    it("should emit and listen to events", () => {
      const mockListener = jest.fn();
      gunInstance.on("test-event", mockListener);

      gunInstance.emit("test-event", "test-data");
      expect(mockListener).toHaveBeenCalledWith("test-data");
    });

    it("should remove event listeners", () => {
      const mockListener = jest.fn();
      gunInstance.on("test-event", mockListener);
      gunInstance.off("test-event", mockListener);

      gunInstance.emit("test-event", "test-data");
      expect(mockListener).not.toHaveBeenCalled();
    });
  });

  describe("Basic Operations", () => {
    it("should handle basic operations without errors", () => {
      // Test that basic operations don't throw errors
      expect(() => gunInstance.getGun()).not.toThrow();
      expect(() => gunInstance.getCurrentUser()).not.toThrow();
      expect(() => gunInstance.isLoggedIn()).not.toThrow();
    });
  });


});
