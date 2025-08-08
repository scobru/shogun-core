import { ShogunStorage } from "../../storage/storage";

// Mock localStorage
const localStorageMock = (() => {
  let store: { [key: string]: string } = {};
  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value.toString();
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    }),
  };
})();

Object.defineProperty(global, "localStorage", {
  value: localStorageMock,
  writable: true,
});

Object.defineProperty(global, "window", {
  value: {
    localStorage: localStorageMock,
  },
  writable: true,
});

describe("ShogunStorage", () => {
  let originalNodeEnv: string | undefined;

  beforeEach(() => {
    localStorageMock.clear();
    jest.clearAllMocks();
    originalNodeEnv = process.env.NODE_ENV;
  });

  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv;
  });

  // These tests run with NODE_ENV = 'development' to enable localStorage interaction
  describe("when in development mode (localStorage enabled)", () => {
    let storage: ShogunStorage;

    beforeEach(() => {
      process.env.NODE_ENV = "development";
      storage = new ShogunStorage();
    });

    it("constructor should load existing keypair from localStorage", () => {
      const mockPair = { pub: "test-pub", priv: "test-priv" };
      localStorageMock.setItem("shogun_keypair", JSON.stringify(mockPair));

      const newStorage = new ShogunStorage();
      expect(newStorage.getPairSync()).toEqual(mockPair);
      expect(localStorageMock.getItem).toHaveBeenCalledWith("shogun_keypair");
    });

    it("setPair should store pair in localStorage", async () => {
      const mockPair = { pub: "test-pub", priv: "test-priv" };
      await storage.setPair(mockPair);
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        "shogun_keypair",
        JSON.stringify(mockPair),
      );
    });

    it("clearAll should clear localStorage", () => {
      storage.clearAll();
      expect(localStorageMock.removeItem).toHaveBeenCalledWith(
        "shogun_keypair",
      );
    });

    it("setItem should store in localStorage", () => {
      const testData = { key: "value" };
      storage.setItem("test-key", JSON.stringify(testData));
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        "test-key",
        JSON.stringify(testData),
      );
    });

    it("removeItem should remove item from localStorage", () => {
      storage.removeItem("test-key");
      expect(localStorageMock.removeItem).toHaveBeenCalledWith("test-key");
    });

    it("should handle localStorage errors gracefully in constructor", () => {
      localStorageMock.getItem.mockImplementation(() => {
        throw new Error("localStorage error");
      });
      expect(() => new ShogunStorage()).not.toThrow();
    });
  });

  // These tests run with the default NODE_ENV = 'test' to disable localStorage
  describe("when in test mode (localStorage disabled)", () => {
    let storage: ShogunStorage;

    beforeEach(() => {
      process.env.NODE_ENV = "test";
      storage = new ShogunStorage();
    });

    it("constructor should not use localStorage", () => {
      new ShogunStorage();
      expect(localStorageMock.getItem).not.toHaveBeenCalled();
    });

    it("setPair should not use localStorage", async () => {
      const mockPair = { pub: "test-pub", priv: "test-priv" };
      await storage.setPair(mockPair);
      expect(localStorageMock.setItem).not.toHaveBeenCalled();
    });

    it("clearAll should not use localStorage", () => {
      storage.clearAll();
      expect(localStorageMock.removeItem).not.toHaveBeenCalled();
    });

    it("setItem should not use localStorage", () => {
      storage.setItem("test-key", "test-value");
      expect(localStorageMock.setItem).not.toHaveBeenCalled();
    });

    it("removeItem should not use localStorage", () => {
      storage.removeItem("test-key");
      expect(localStorageMock.removeItem).not.toHaveBeenCalled();
    });
  });

  // General tests that are environment-agnostic
  describe("Core in-memory functionality", () => {
    let storage: ShogunStorage;

    beforeEach(() => {
      storage = new ShogunStorage();
    });

    it("constructor should initialize with an empty store", () => {
      expect(storage.getPairSync()).toBeNull();
    });

    it("getPair and getPairSync should return null when no pair is stored", async () => {
      expect(await storage.getPair()).toBeNull();
      expect(storage.getPairSync()).toBeNull();
    });

    it("setPair should store pair in memory", async () => {
      const mockPair = { pub: "test-pub", priv: "test-priv" };
      await storage.setPair(mockPair);
      expect(storage.getPairSync()).toEqual(mockPair);
      expect(await storage.getPair()).toEqual(mockPair);
    });

    it("clearAll should clear the memory store", async () => {
      await storage.setPair({ pub: "test-pub", priv: "test-priv" });
      storage.clearAll();
      expect(storage.getPairSync()).toBeNull();
    });

    it("setItem should store item in memory", () => {
      const testData = { key: "value" };
      storage.setItem("test-key", JSON.stringify(testData));
      expect(storage.getItem("test-key")).toBe(JSON.stringify(testData));
    });

    it("getItem should return null for non-existent key", () => {
      expect(storage.getItem("nonexistent")).toBeNull();
    });

    it("removeItem should remove item from memory", () => {
      storage.setItem("test-key", "test-value");
      storage.removeItem("test-key");
      expect(storage.getItem("test-key")).toBeNull();
    });

    it("should handle non-JSON strings correctly", () => {
      const testString = "plain string";
      storage.setItem("test-key", testString);
      const result = storage.getItem("test-key");
      expect(result).toBe(testString);
    });
  });
});
