/**
 * Tests for Multi-Storage functionality
 */

import { DataBase, GunDBStorage, LocalStorageProvider, MultiStorageManager } from "../../gundb/db";
import Gun from "gun/gun";
import SEA from "gun/sea";

// Mock Gun instance
const createMockGun = () => ({
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
    is: { pub: "test-pub", alias: "test-user" },
  })),
  get: jest.fn(),
  put: jest.fn(),
  set: jest.fn(),
  on: jest.fn(),
  once: jest.fn(),
  off: jest.fn(),
  _: {
    opt: {
      peers: {}
    }
  }
});

// Mock GunDB node
const createMockNode = () => ({
  get: jest.fn().mockReturnThis(),
  put: jest.fn().mockReturnThis(),
  then: jest.fn().mockResolvedValue(undefined),
  once: jest.fn().mockReturnThis(),
});

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

// Mock sessionStorage
const mockSessionStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

describe("Multi-Storage System", () => {
  let mockGun: any;
  let mockNode: any;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockGun = createMockGun();
    mockNode = createMockNode();

    // Mock localStorage
    Object.defineProperty(global, "localStorage", {
      value: mockLocalStorage,
      writable: true,
      configurable: true,
    });

    // Mock sessionStorage
    Object.defineProperty(global, "sessionStorage", {
      value: mockSessionStorage,
      writable: true,
      configurable: true,
    });

    // Reset mock implementations
    mockLocalStorage.getItem.mockReturnValue(null);
    mockLocalStorage.setItem.mockReturnValue(undefined);
    mockLocalStorage.removeItem.mockReturnValue(undefined);
    mockSessionStorage.getItem.mockReturnValue(null);
    mockSessionStorage.setItem.mockReturnValue(undefined);
    mockSessionStorage.removeItem.mockReturnValue(undefined);
  });

  describe("GunDBStorage", () => {
    let gunDBStorage: GunDBStorage;

    beforeEach(() => {
      gunDBStorage = new GunDBStorage(mockGun, mockNode);
    });

    it("should save pair to GunDB", async () => {
      const userPub = "test-user-pub";
      const pair = { pub: "test-pub", priv: "test-priv", epub: "test-epub", epriv: "test-epriv" };

      const result = await gunDBStorage.savePair(userPub, pair);

      expect(result).toBe(true);
      expect(mockNode.get).toHaveBeenCalledWith(userPub);
      expect(mockNode.put).toHaveBeenCalledWith(pair);
    });

    it("should load pair from GunDB", async () => {
      const userPub = "test-user-pub";
      const pair = { pub: "test-pub", priv: "test-priv", epub: "test-epub", epriv: "test-epriv" };
      
      mockNode.then.mockResolvedValue(pair);

      const result = await gunDBStorage.loadPair(userPub);

      expect(result).toEqual(pair);
      expect(mockNode.get).toHaveBeenCalledWith(userPub);
    });

    it("should remove pair from GunDB", async () => {
      const userPub = "test-user-pub";

      const result = await gunDBStorage.removePair(userPub);

      expect(result).toBe(true);
      expect(mockNode.get).toHaveBeenCalledWith(userPub);
      expect(mockNode.put).toHaveBeenCalledWith(null);
    });

    it("should handle errors gracefully", async () => {
      const userPub = "test-user-pub";
      const pair = { pub: "test-pub", priv: "test-priv", epub: "test-epub", epriv: "test-epriv" };
      
      mockNode.put.mockRejectedValue(new Error("GunDB error"));

      const result = await gunDBStorage.savePair(userPub, pair);

      expect(result).toBe(false);
    });
  });

  describe("LocalStorageProvider", () => {
    let localStorageProvider: LocalStorageProvider;

    beforeEach(() => {
      localStorageProvider = new LocalStorageProvider();
    });

    it("should save pair to localStorage", async () => {
      const userPub = "test-user-pub";
      const pair = { pub: "test-pub", priv: "test-priv", epub: "test-epub", epriv: "test-epriv" };

      const result = await localStorageProvider.savePair(userPub, pair);

      expect(result).toBe(true);
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        "shogun_pair_test-user-pub",
        JSON.stringify(pair)
      );
    });

    it("should load pair from localStorage", async () => {
      const userPub = "test-user-pub";
      const pair = { pub: "test-pub", priv: "test-priv", epub: "test-epub", epriv: "test-epriv" };
      
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(pair));

      const result = await localStorageProvider.loadPair(userPub);

      expect(result).toEqual(pair);
      expect(mockLocalStorage.getItem).toHaveBeenCalledWith("shogun_pair_test-user-pub");
    });

    it("should remove pair from localStorage", async () => {
      const userPub = "test-user-pub";

      const result = await localStorageProvider.removePair(userPub);

      expect(result).toBe(true);
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith("shogun_pair_test-user-pub");
    });

    it("should handle localStorage errors gracefully", async () => {
      const userPub = "test-user-pub";
      const pair = { pub: "test-pub", priv: "test-priv", epub: "test-epub", epriv: "test-epriv" };
      
      mockLocalStorage.setItem.mockImplementation(() => {
        throw new Error("localStorage error");
      });

      const result = await localStorageProvider.savePair(userPub, pair);

      expect(result).toBe(false);
    });
  });

  describe("MultiStorageManager", () => {
    let storageManager: MultiStorageManager;
    let mockGunDBStorage: any;
    let mockLocalStorage: any;

    beforeEach(() => {
      storageManager = new MultiStorageManager();
      
      mockGunDBStorage = {
        name: 'gundb',
        savePair: jest.fn(),
        loadPair: jest.fn(),
        removePair: jest.fn(),
      };
      
      mockLocalStorage = {
        name: 'localStorage',
        savePair: jest.fn(),
        loadPair: jest.fn(),
        removePair: jest.fn(),
      };

      storageManager.addProvider(mockGunDBStorage);
      storageManager.addProvider(mockLocalStorage);
    });

    it("should add providers correctly", () => {
      const providers = storageManager['providers'];
      expect(providers.has('gundb')).toBe(true);
      expect(providers.has('localStorage')).toBe(true);
    });

    it("should set primary provider", () => {
      storageManager.setPrimaryProvider('localStorage');
      expect(storageManager['primaryProvider']).toBe('localStorage');
    });

    it("should save pair to multiple providers", async () => {
      const userPub = "test-user-pub";
      const pair = { pub: "test-pub", priv: "test-priv", epub: "test-epub", epriv: "test-epriv" };
      
      mockGunDBStorage.savePair.mockResolvedValue(true);
      mockLocalStorage.savePair.mockResolvedValue(true);

      const result = await storageManager.savePair(userPub, pair, ['gundb', 'localStorage']);

      expect(result).toBe(true);
      expect(mockGunDBStorage.savePair).toHaveBeenCalledWith(userPub, pair);
      expect(mockLocalStorage.savePair).toHaveBeenCalledWith(userPub, pair);
    });

    it("should load pair from first available provider", async () => {
      const userPub = "test-user-pub";
      const pair = { pub: "test-pub", priv: "test-priv", epub: "test-epub", epriv: "test-epriv" };
      
      mockGunDBStorage.loadPair.mockResolvedValue(null);
      mockLocalStorage.loadPair.mockResolvedValue(pair);

      const result = await storageManager.loadPair(userPub, ['gundb', 'localStorage']);

      expect(result).toEqual(pair);
      expect(mockGunDBStorage.loadPair).toHaveBeenCalledWith(userPub);
      expect(mockLocalStorage.loadPair).toHaveBeenCalledWith(userPub);
    });

    it("should remove pair from multiple providers", async () => {
      const userPub = "test-user-pub";
      
      mockGunDBStorage.removePair.mockResolvedValue(true);
      mockLocalStorage.removePair.mockResolvedValue(false);

      const result = await storageManager.removePair(userPub, ['gundb', 'localStorage']);

      expect(result).toBe(true);
      expect(mockGunDBStorage.removePair).toHaveBeenCalledWith(userPub);
      expect(mockLocalStorage.removePair).toHaveBeenCalledWith(userPub);
    });

    it("should handle provider errors gracefully", async () => {
      const userPub = "test-user-pub";
      const pair = { pub: "test-pub", priv: "test-priv", epub: "test-epub", epriv: "test-epriv" };
      
      mockGunDBStorage.savePair.mockRejectedValue(new Error("GunDB error"));
      mockLocalStorage.savePair.mockResolvedValue(true);

      const result = await storageManager.savePair(userPub, pair, ['gundb', 'localStorage']);

      expect(result).toBe(true); // Should succeed if at least one provider succeeds
    });
  });

  describe("DataBase Multi-Storage Integration", () => {
    let db: DataBase;

    beforeEach(() => {
      mockGun = createMockGun();
      mockNode = createMockNode();
    });

    it("should initialize with custom storage configuration", () => {
      const customProvider = {
        name: 'custom',
        savePair: jest.fn(),
        loadPair: jest.fn(),
        removePair: jest.fn(),
        save: jest.fn(),
        load: jest.fn(),
        remove: jest.fn(),
        exists: jest.fn(),
      };

      db = new DataBase(mockGun, 'test-scope', {
        providers: [customProvider],
        primaryProvider: 'custom',
        customPairGenerator: async (username: string) => {
          return { pub: `custom-${username}`, priv: 'custom-priv', epub: 'custom-epub', epriv: 'custom-epriv' };
        }
      });

      expect(db).toBeDefined();
    });

    it("should add storage providers dynamically", () => {
      db = new DataBase(mockGun, 'test-scope');
      
      const customProvider = {
        name: 'custom',
        savePair: jest.fn(),
        loadPair: jest.fn(),
        removePair: jest.fn(),
        save: jest.fn(),
        load: jest.fn(),
        remove: jest.fn(),
        exists: jest.fn(),
      };

      db.addStorageProvider(customProvider);
      db.setPrimaryStorageProvider('custom');

      const providers = db.getStorageProviders();
      expect(providers).toContain('custom');
    });

    it("should save and load pairs from storage", async () => {
      db = new DataBase(mockGun, 'test-scope');
      db.initialize('test-scope');

      const userPub = "test-user-pub";
      const pair = { pub: "test-pub", priv: "test-priv", epub: "test-epub", epriv: "test-epriv" };

      // Mock the storage manager methods
      const mockSavePair = jest.fn().mockResolvedValue(true);
      const mockLoadPair = jest.fn().mockResolvedValue(pair);
      
      db['saveUserPair'] = mockSavePair;
      db['loadUserPair'] = mockLoadPair;

      const saveResult = await db.savePairToStorage(userPub, pair, ['localStorage']);
      const loadResult = await db.loadPairFromStorage(userPub, ['localStorage']);

      expect(saveResult).toBe(true);
      expect(loadResult).toEqual(pair);
    });
  });

  describe("Custom Pair Generation", () => {
    let db: DataBase;

    beforeEach(() => {
      mockGun = createMockGun();
      mockNode = createMockNode();
    });

    it("should use custom pair generator when provided", async () => {
      const customPairGenerator = jest.fn().mockResolvedValue({
        pub: 'custom-pub',
        priv: 'custom-priv',
        epub: 'custom-epub',
        epriv: 'custom-epriv'
      });

      db = new DataBase(mockGun, 'test-scope', {
        customPairGenerator
      });

      const pair = await db['generateCustomPair']('testuser');

      expect(customPairGenerator).toHaveBeenCalledWith('testuser');
      expect(pair).toEqual({
        pub: 'custom-pub',
        priv: 'custom-priv',
        epub: 'custom-epub',
        epriv: 'custom-epriv'
      });
    });

    it("should fallback to SEA.pair when no custom generator", async () => {
      // Mock SEA.pair
      const mockSEAPair = { pub: 'sea-pub', priv: 'sea-priv', epub: 'sea-epub', epriv: 'sea-epriv' };
      jest.spyOn(SEA, 'pair').mockResolvedValue(mockSEAPair);

      db = new DataBase(mockGun, 'test-scope');

      const pair = await db['generateCustomPair']('testuser');

      expect(SEA.pair).toHaveBeenCalled();
      expect(pair).toEqual(mockSEAPair);
    });
  });

  describe("Error Handling", () => {
    let storageManager: MultiStorageManager;

    beforeEach(() => {
      storageManager = new MultiStorageManager();
    });

    it("should handle non-existent providers gracefully", async () => {
      const result = await storageManager.savePair('test-pub', {} as any, ['non-existent']);
      expect(result).toBe(false);
    });

    it("should handle provider errors in loadPair", async () => {
      const mockProvider = {
        name: 'error-provider',
        loadPair: jest.fn().mockRejectedValue(new Error("Provider error")),
        savePair: jest.fn(),
        removePair: jest.fn(),
        save: jest.fn(),
        load: jest.fn(),
        remove: jest.fn(),
        exists: jest.fn(),
      };

      storageManager.addProvider(mockProvider);

      const result = await storageManager.loadPair('test-pub', ['error-provider']);
      expect(result).toBeNull();
    });

    it("should handle provider errors in removePair", async () => {
      const mockProvider = {
        name: 'error-provider',
        removePair: jest.fn().mockRejectedValue(new Error("Provider error")),
        savePair: jest.fn(),
        loadPair: jest.fn(),
        save: jest.fn(),
        load: jest.fn(),
        remove: jest.fn(),
        exists: jest.fn(),
      };

      storageManager.addProvider(mockProvider);

      const result = await storageManager.removePair('test-pub', ['error-provider']);
      expect(result).toBe(false);
    });
  });
});
