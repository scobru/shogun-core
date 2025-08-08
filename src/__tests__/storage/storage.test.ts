import { ShogunStorage } from "../../storage/storage";

describe("ShogunStorage", () => {
  let storage: ShogunStorage;
  let localStorageMock: any;

  beforeEach(() => {
    // Reset localStorage mock
    localStorageMock = {
      getItem: jest.fn(),
      setItem: jest.fn(),
      removeItem: jest.fn(),
      clear: jest.fn(),
    };

    // Mock localStorage globally
    Object.defineProperty(global, "localStorage", {
      value: localStorageMock,
      writable: true,
    });

    storage = new ShogunStorage();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("Constructor", () => {
    it("should initialize with empty store", () => {
      expect(storage.getPairSync()).toBeNull();
    });

    it("should load existing keypair from localStorage if available", () => {
      const mockPair = { pub: "test-pub", priv: "test-priv" };
      localStorageMock.getItem.mockReturnValue(JSON.stringify(mockPair));

      const newStorage = new ShogunStorage();
      expect(newStorage.getPairSync()).toEqual(mockPair);
    });

    it("should handle localStorage errors gracefully", () => {
      localStorageMock.setItem.mockImplementation(() => {
        throw new Error("localStorage error");
      });

      // Should not throw error
      expect(() => new ShogunStorage()).not.toThrow();
    });
  });

  describe("getPair", () => {
    it("should return null when no pair is stored", async () => {
      const result = await storage.getPair();
      expect(result).toBeNull();
    });

    it("should return stored pair", async () => {
      const mockPair = { pub: "test-pub", priv: "test-priv" };
      await storage.setPair(mockPair);

      const result = await storage.getPair();
      expect(result).toEqual(mockPair);
    });
  });

  describe("getPairSync", () => {
    it("should return null when no pair is stored", () => {
      const result = storage.getPairSync();
      expect(result).toBeNull();
    });

    it("should return stored pair synchronously", () => {
      const mockPair = { pub: "test-pub", priv: "test-priv" };
      storage.setPair(mockPair);

      const result = storage.getPairSync();
      expect(result).toEqual(mockPair);
    });
  });

  describe("setPair", () => {
    it("should store pair in memory", async () => {
      const mockPair = { pub: "test-pub", priv: "test-priv" };
      await storage.setPair(mockPair);

      expect(storage.getPairSync()).toEqual(mockPair);
    });

    it("should store pair in localStorage when available", async () => {
      const mockPair = { pub: "test-pub", priv: "test-priv" };
      await storage.setPair(mockPair);

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        "shogun_keypair",
        JSON.stringify(mockPair)
      );
    });

    it("should handle localStorage errors gracefully", async () => {
      localStorageMock.setItem.mockImplementation(() => {
        throw new Error("localStorage error");
      });

      const mockPair = { pub: "test-pub", priv: "test-priv" };
      await storage.setPair(mockPair);

      // Should still store in memory
      expect(storage.getPairSync()).toEqual(mockPair);
    });
  });

  describe("clearAll", () => {
    it("should clear memory store", () => {
      const mockPair = { pub: "test-pub", priv: "test-priv" };
      storage.setPair(mockPair);

      storage.clearAll();
      expect(storage.getPairSync()).toBeNull();
    });

    it("should clear localStorage when available", () => {
      storage.clearAll();

      expect(localStorageMock.removeItem).toHaveBeenCalledWith(
        "shogun_keypair"
      );
    });

    it("should handle localStorage errors gracefully", () => {
      localStorageMock.removeItem.mockImplementation(() => {
        throw new Error("localStorage error");
      });

      // Should not throw error
      expect(() => storage.clearAll()).not.toThrow();
    });
  });

  describe("getItem", () => {
    it("should return null for non-existent key", () => {
      const result = storage.getItem("nonexistent");
      expect(result).toBeNull();
    });

    it("should return stored item as JSON string", () => {
      const testData = { key: "value", number: 123 };
      storage.setItem("test-key", JSON.stringify(testData));

      const result = storage.getItem("test-key");
      expect(result).toBe(JSON.stringify(testData));
    });
  });

  describe("setItem", () => {
    it("should store JSON string in memory", () => {
      const testData = { key: "value" };
      storage.setItem("test-key", JSON.stringify(testData));

      const result = storage.getItem("test-key");
      expect(result).toBe(JSON.stringify(testData));
    });

    it("should store in localStorage when available", () => {
      const testData = { key: "value" };
      storage.setItem("test-key", JSON.stringify(testData));

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        "test-key",
        JSON.stringify(testData)
      );
    });

    it("should handle non-JSON strings", () => {
      const testString = "plain string";
      storage.setItem("test-key", testString);

      const result = storage.getItem("test-key");
      expect(result).toBe(testString);
    });

    it("should handle localStorage errors gracefully", () => {
      localStorageMock.setItem.mockImplementation(() => {
        throw new Error("localStorage error");
      });

      const testData = { key: "value" };
      storage.setItem("test-key", JSON.stringify(testData));

      // Should still store in memory
      const result = storage.getItem("test-key");
      expect(result).toBe(JSON.stringify(testData));
    });
  });

  describe("removeItem", () => {
    it("should remove item from memory", () => {
      storage.setItem("test-key", "test-value");
      storage.removeItem("test-key");

      const result = storage.getItem("test-key");
      expect(result).toBeNull();
    });

    it("should remove item from localStorage when available", () => {
      storage.removeItem("test-key");

      expect(localStorageMock.removeItem).toHaveBeenCalledWith("test-key");
    });

    it("should handle localStorage errors gracefully", () => {
      localStorageMock.removeItem.mockImplementation(() => {
        throw new Error("localStorage error");
      });

      // Should not throw error
      expect(() => storage.removeItem("test-key")).not.toThrow();
    });
  });

  describe("Test mode behavior", () => {
    it("should not use localStorage in test mode", () => {
      // Simulate test mode
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = "test";

      const testStorage = new ShogunStorage();
      testStorage.setItem("test-key", "test-value");

      expect(localStorageMock.setItem).not.toHaveBeenCalled();

      // Restore original env
      process.env.NODE_ENV = originalEnv;
    });
  });
});
