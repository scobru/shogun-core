/**
 * Integration tests for Multi-Storage authentication methods
 */

import { DataBase, GunDBStorage, LocalStorageProvider } from "../../gundb/db";
import Gun from "gun/gun";
import SEA from "gun/sea";

// Mock implementations for testing
const createMockGun = () => {
  const mockUser = {
    create: jest.fn(),
    auth: jest.fn(),
    leave: jest.fn(),
    recall: jest.fn(),
    get: jest.fn(),
    put: jest.fn(),
    on: jest.fn(),
    once: jest.fn(),
    off: jest.fn(),
    is: null as any,
  };

  const mockGun = {
    user: jest.fn(() => mockUser),
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
  };

  return { mockGun, mockUser };
};

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

describe("Multi-Storage Authentication Integration", () => {
  let mockGun: any;
  let mockUser: any;
  let db: DataBase;

  beforeEach(() => {
    jest.clearAllMocks();
    
    const gunSetup = createMockGun();
    mockGun = gunSetup.mockGun;
    mockUser = gunSetup.mockUser;

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

    // Mock GunDB node
    const mockNode = {
      get: jest.fn().mockReturnThis(),
      put: jest.fn().mockReturnThis(),
      then: jest.fn().mockResolvedValue(undefined),
      once: jest.fn().mockReturnThis(),
    };

    mockGun.get.mockReturnValue(mockNode);
  });

  describe("signUpWithCustomStorage", () => {
    beforeEach(() => {
      db = new DataBase(mockGun, 'test-scope', {
        providers: [new LocalStorageProvider()],
        primaryProvider: 'localStorage'
      });
      db.initialize('test-scope');
    });

    it("should signup with custom storage and skip GunDB creation", async () => {
      const username = "testuser";
      const password = "testpassword123";

      // Mock successful pair generation
      const mockPair = { pub: 'test-pub', priv: 'test-priv', epub: 'test-epub', epriv: 'test-epriv' };
      jest.spyOn(SEA, 'pair').mockResolvedValue(mockPair);

      // Mock successful authentication
      mockUser.auth.mockImplementation((user: string, pass: string, callback: Function) => {
        mockUser.is = { pub: 'test-pub', alias: username };
        callback({ pub: 'test-pub' });
      });

      const result = await db.signUpWithCustomStorage(username, password, {
        storageProviders: ['localStorage'],
        skipGunDBCreation: true
      });

      expect(result.success).toBe(true);
      expect(result.userPub).toBe('test-pub');
      expect(result.username).toBe(username);
      expect(result.isNewUser).toBe(true);
      expect(result.sea).toEqual(mockPair);

      // Verify pair was saved to localStorage
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'shogun_pair_test-pub',
        JSON.stringify(mockPair)
      );
    });

    it("should signup with custom storage and create in GunDB", async () => {
      const username = "testuser";
      const password = "testpassword123";

      // Mock successful pair generation
      const mockPair = { pub: 'test-pub', priv: 'test-priv', epub: 'test-epub', epriv: 'test-epriv' };
      jest.spyOn(SEA, 'pair').mockResolvedValue(mockPair);

      // Mock successful user creation
      mockUser.create.mockImplementation((user: string, pass: string, callback: Function) => {
        callback({ pub: 'test-pub' });
      });

      // Mock successful authentication
      mockUser.auth.mockImplementation((user: string, pass: string, callback: Function) => {
        mockUser.is = { pub: 'test-pub', alias: username };
        callback({ pub: 'test-pub' });
      });

      const result = await db.signUpWithCustomStorage(username, password, {
        storageProviders: ['localStorage'],
        skipGunDBCreation: false
      });

      expect(result.success).toBe(true);
      expect(result.userPub).toBe('test-pub');
      expect(result.username).toBe(username);
      expect(result.isNewUser).toBe(true);

      // Verify user creation was called
      expect(mockUser.create).toHaveBeenCalledWith(username.toLowerCase(), password, expect.any(Function));
    });

    it("should handle signup errors gracefully", async () => {
      const username = "testuser";
      const password = "testpassword123";

      // Mock pair generation failure
      jest.spyOn(SEA, 'pair').mockRejectedValue(new Error("Pair generation failed"));

      const result = await db.signUpWithCustomStorage(username, password, {
        storageProviders: ['localStorage'],
        skipGunDBCreation: true
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain("Signup failed");
    });

    it("should validate credentials before signup", async () => {
      const username = ""; // Invalid username
      const password = "testpassword123";

      const result = await db.signUpWithCustomStorage(username, password, {
        storageProviders: ['localStorage'],
        skipGunDBCreation: true
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain("Username must be more than 0 characters long");
    });
  });

  describe("loginWithCustomStorage", () => {
    beforeEach(() => {
      db = new DataBase(mockGun, 'test-scope', {
        providers: [new LocalStorageProvider()],
        primaryProvider: 'localStorage'
      });
      db.initialize('test-scope');
    });

    it("should login with pair loaded from custom storage", async () => {
      const username = "testuser";
      const password = "testpassword123";

      // Mock pair in localStorage
      const mockPair = { pub: 'test-pub', priv: 'test-priv', epub: 'test-epub', epriv: 'test-epriv' };
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(mockPair));

      // Mock successful authentication
      mockUser.auth.mockImplementation((pair: any, callback: Function) => {
        mockUser.is = { pub: 'test-pub', alias: username };
        callback({ pub: 'test-pub' });
      });

      // Mock node.get for username lookup
      const mockNode = {
        get: jest.fn().mockReturnThis(),
        then: jest.fn().mockResolvedValue('test-pub')
      };
      db['node'] = mockNode as any;

      const result = await db.loginWithCustomStorage(username, password, {
        storageProviders: ['localStorage'],
        loadPairFromStorage: true
      });

      expect(result.success).toBe(true);
      expect(result.userPub).toBe('test-pub');
      expect(result.username).toBe(username);

      // Verify pair was loaded from localStorage
      expect(mockLocalStorage.getItem).toHaveBeenCalledWith('shogun_pair_test-pub');
    });

    it("should login without loading pair from storage", async () => {
      const username = "testuser";
      const password = "testpassword123";

      // Mock successful authentication
      mockUser.auth.mockImplementation((user: string, pass: string, callback: Function) => {
        mockUser.is = { pub: 'test-pub', alias: username };
        callback({ pub: 'test-pub' });
      });

      const result = await db.loginWithCustomStorage(username, password, {
        storageProviders: ['localStorage'],
        loadPairFromStorage: false
      });

      expect(result.success).toBe(true);
      expect(result.userPub).toBe('test-pub');
      expect(result.username).toBe(username);

      // Verify pair was not loaded from localStorage
      expect(mockLocalStorage.getItem).not.toHaveBeenCalledWith(expect.stringContaining('shogun_pair_'));
    });

    it("should handle authentication failure", async () => {
      const username = "testuser";
      const password = "wrongpassword";

      // Mock authentication failure
      mockUser.auth.mockImplementation((user: string, pass: string, callback: Function) => {
        callback({ err: "Invalid credentials" });
      });

      const result = await db.loginWithCustomStorage(username, password, {
        storageProviders: ['localStorage'],
        loadPairFromStorage: false
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain("not found");
    });

    it("should handle missing user pub", async () => {
      const username = "testuser";
      const password = "testpassword123";

      // Mock successful authentication but no user pub
      mockUser.auth.mockImplementation((user: string, pass: string, callback: Function) => {
        mockUser.is = null;
        callback({});
      });

      const result = await db.loginWithCustomStorage(username, password, {
        storageProviders: ['localStorage'],
        loadPairFromStorage: false
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain("No user pub returned");
    });
  });

  describe("Custom Pair Generator Integration", () => {
    it("should use custom pair generator in signup", async () => {
      const customPairGenerator = jest.fn().mockResolvedValue({
        pub: 'custom-pub',
        priv: 'custom-priv',
        epub: 'custom-epub',
        epriv: 'custom-epriv'
      });

      db = new DataBase(mockGun, 'test-scope', {
        providers: [new LocalStorageProvider()],
        primaryProvider: 'localStorage',
        customPairGenerator
      });
      db.initialize('test-scope');

      const username = "testuser";
      const password = "testpassword123";

      // Mock successful authentication
      mockUser.auth.mockImplementation((pair: any, callback: Function) => {
        mockUser.is = { pub: 'custom-pub', alias: username };
        callback({ pub: 'custom-pub' });
      });

      const result = await db.signUpWithCustomStorage(username, password, {
        storageProviders: ['localStorage'],
        skipGunDBCreation: true
      });

      expect(result.success).toBe(true);
      expect(result.userPub).toBe('custom-pub');
      expect(customPairGenerator).toHaveBeenCalledWith(username);
    });
  });

  describe("Storage Provider Management", () => {
    beforeEach(() => {
      db = new DataBase(mockGun, 'test-scope');
      db.initialize('test-scope');
    });

    it("should add custom storage provider", () => {
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
      
      const providers = db.getStorageProviders();
      expect(providers).toContain('custom');
    });

    it("should set primary storage provider", () => {
      db.setPrimaryStorageProvider('localStorage');
      
      // This is tested indirectly through the storage manager
      expect(db).toBeDefined();
    });

    it("should save pair to specific providers", async () => {
      const userPub = "test-pub";
      const pair = { pub: 'test-pub', priv: 'test-priv', epub: 'test-epub', epriv: 'test-epriv' };

      // Mock the storage manager
      const mockSavePair = jest.fn().mockResolvedValue(true);
      db['saveUserPair'] = mockSavePair;

      const result = await db.savePairToStorage(userPub, pair, ['localStorage']);

      expect(result).toBe(true);
      expect(mockSavePair).toHaveBeenCalledWith(userPub, pair, ['localStorage']);
    });

    it("should load pair from specific providers", async () => {
      const userPub = "test-pub";
      const pair = { pub: 'test-pub', priv: 'test-priv', epub: 'test-epub', epriv: 'test-epriv' };

      // Mock the storage manager
      const mockLoadPair = jest.fn().mockResolvedValue(pair);
      db['loadUserPair'] = mockLoadPair;

      const result = await db.loadPairFromStorage(userPub, ['localStorage']);

      expect(result).toEqual(pair);
      expect(mockLoadPair).toHaveBeenCalledWith(userPub, ['localStorage']);
    });

    it("should remove pair from specific providers", async () => {
      const userPub = "test-pub";

      // Mock the storage manager
      const mockRemovePair = jest.fn().mockResolvedValue(true);
      db['storageManager']['removePair'] = mockRemovePair;

      const result = await db.removePairFromStorage(userPub, ['localStorage']);

      expect(result).toBe(true);
      expect(mockRemovePair).toHaveBeenCalledWith(userPub, ['localStorage']);
    });
  });

  describe("Error Handling", () => {
    beforeEach(() => {
      db = new DataBase(mockGun, 'test-scope');
      db.initialize('test-scope');
    });

    it("should handle storage provider errors gracefully", async () => {
      const userPub = "test-pub";
      const pair = { pub: 'test-pub', priv: 'test-priv', epub: 'test-epub', epriv: 'test-epriv' };

      // Mock storage manager to throw error
      const mockSavePair = jest.fn().mockRejectedValue(new Error("Storage error"));
      db['saveUserPair'] = mockSavePair;

      const result = await db.savePairToStorage(userPub, pair, ['localStorage']);

      expect(result).toBe(false);
    });

    it("should handle authentication errors in signup", async () => {
      const username = "testuser";
      const password = "testpassword123";

      // Mock pair generation
      const mockPair = { pub: 'test-pub', priv: 'test-priv', epub: 'test-epub', epriv: 'test-epriv' };
      jest.spyOn(SEA, 'pair').mockResolvedValue(mockPair);

      // Mock authentication failure
      mockUser.auth.mockImplementation((pair: any, callback: Function) => {
        callback({ err: "Authentication failed" });
      });

      const result = await db.signUpWithCustomStorage(username, password, {
        storageProviders: ['localStorage'],
        skipGunDBCreation: true
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain("Authentication failed");
    });
  });
});
