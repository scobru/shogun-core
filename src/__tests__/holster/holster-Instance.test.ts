// Mock Holster per evitare problemi di import
jest.mock("@mblaney/holster", () => {
    const mockHolster = function () {
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
    mockHolster.SEA = {
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
    };
    return mockHolster;
});


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

import { HolsterInstance } from "../../holster/holster-Instance";

describe("HolsterInstance", () => {
  let holsterInstance: HolsterInstance;
  let mockHolster: any;

  beforeEach(() => {
    jest.clearAllMocks();

    // Create a more realistic mock Holster instance
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

    mockHolster = {
      on: jest.fn(),
      off: jest.fn(),
      once: jest.fn(),
      emit: jest.fn(),
      get: jest.fn(),
      put: jest.fn(),
      set: jest.fn(),
      user: jest.fn(() => mockUserInstance),
      SEA: {
        pair: jest.fn(),
        encrypt: jest.fn(),
        decrypt: jest.fn(),
        sign: jest.fn(),
        verify: jest.fn(),
        work: jest.fn(),
        secret: jest.fn(),
        opt: jest.fn(),
      }
    };

    holsterInstance = new HolsterInstance(mockHolster);
  });

  describe("Constructor", () => {
    it("should create HolsterInstance with default configuration", () => {
      expect(holsterInstance).toBeDefined();
      expect(holsterInstance.holster).toBeDefined();
      // Note: user might be null initially
      expect(holsterInstance.user).toBeDefined();
    });

    it("should create HolsterInstance with custom configuration", () => {
      const customInstance = new HolsterInstance(mockHolster, "custom-scope");
      expect(customInstance).toBeDefined();
    });

    it("should handle constructor errors gracefully", () => {
      expect(() => new HolsterInstance(null as any)).toThrow(
        "Holster instance is required but was not provided",
      );
    });
  });

  describe("Event System", () => {
    it("should emit and listen to events", () => {
      const mockListener = jest.fn();
      holsterInstance.on("test-event", mockListener);

      holsterInstance.emit("test-event", "test-data");
      expect(mockListener).toHaveBeenCalledWith("test-data");
    });

    it("should remove event listeners", () => {
      const mockListener = jest.fn();
      holsterInstance.on("test-event", mockListener);
      holsterInstance.off("test-event", mockListener);

      holsterInstance.emit("test-event", "test-data");
      expect(mockListener).not.toHaveBeenCalled();
    });
  });

  describe("Basic Operations", () => {
    it("should handle basic operations without errors", () => {
      // Test that basic operations don't throw errors
      expect(() => holsterInstance.getHolster()).not.toThrow();
      expect(() => holsterInstance.getCurrentUser()).not.toThrow();
      expect(() => holsterInstance.isLoggedIn()).not.toThrow();
    });
  });
});
