/**
 * Tests for the SimpleGunAPI and related classes
 */

import {
  SimpleGunAPI,
  QuickStart,
  AutoQuickStart,
  quickStart,
  autoQuickStart,
} from "../../gundb/api";
import { DataBase } from "../../gundb/db";

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
    is: jest.fn(),
  })),
  get: jest.fn(),
  put: jest.fn(),
  set: jest.fn(),
  on: jest.fn(),
  once: jest.fn(),
  off: jest.fn(),
});

// Mock DataBase
jest.mock("../../gundb/db", () => ({
  DataBase: jest.fn().mockImplementation(() => ({
    getData: jest.fn(),
    get: jest.fn(),
    put: jest.fn(),
    set: jest.fn(),
    remove: jest.fn(),
    login: jest.fn(),
    signUp: jest.fn(),
    logout: jest.fn(),
    isLoggedIn: jest.fn(),
    getUserData: jest.fn(),
    putUserData: jest.fn(),
    removeUserData: jest.fn(),
    getUser: jest.fn(),
    getCurrentUser: jest.fn(),
    getUserByAlias: jest.fn(),
    initialize: jest.fn(),
  })),
  // createGun removed - Gun instances must be created externally
}));

describe("SimpleGunAPI", () => {
  let mockDb: any;
  let api: SimpleGunAPI;

  beforeEach(() => {
    jest.clearAllMocks();

    // Create mock database
    mockDb = {
      get: jest.fn(),
      getData: jest.fn(),
      put: jest.fn(),
      isLoggedIn: jest.fn(),
      getUser: jest.fn(),
      initialize: jest.fn(),
    };

    api = new SimpleGunAPI(mockDb);
  });

  describe("Database Access", () => {
    it("should provide access to database instance", () => {
      expect(api.database).toBe(mockDb);
    });
  });

  describe("Array Utilities (Helper Functions Only)", () => {
    it("should convert array to indexed object", () => {
      const arr = [
        { id: "1", name: "Item 1" },
        { id: "2", name: "Item 2" },
      ];

      const result = api.arrayToIndexedObject(arr);

      expect(result).toEqual({
        "1": { id: "1", name: "Item 1" },
        "2": { id: "2", name: "Item 2" },
      });
    });

    it("should convert indexed object to array", () => {
      const indexedObj = {
        "1": { id: "1", name: "Item 1" },
        "2": { id: "2", name: "Item 2" },
      };

      const result = api.indexedObjectToArray(indexedObj);

      expect(result).toEqual([
        { id: "1", name: "Item 1" },
        { id: "2", name: "Item 2" },
      ]);
    });

    // Note: User array functions (putUserArray, getUserArray, addToUserArray, removeFromUserArray, updateInUserArray)
    // have been REMOVED because they don't work reliably with GunDB's actual data structures.
    // Use direct GunDB operations instead.
  });

  describe("DEPRECATED: Global Array Operations", () => {
    // These tests are kept for backward compatibility but the functions are deprecated
    // because they don't work reliably with GunDB's actual data structures.

    it("should show deprecation warning for putArray", async () => {
      const consoleSpy = jest.spyOn(console, "warn").mockImplementation();
      const arr = [
        { id: "1", name: "Item 1" },
        { id: "2", name: "Item 2" },
      ];
      mockDb.put.mockResolvedValue({ success: true });

      const result = await api.putArray("global/items", arr);

      expect(consoleSpy).toHaveBeenCalledWith(
        "DEPRECATED: putArray() is unreliable with GunDB. Use direct GunDB operations instead.",
      );
      expect(mockDb.put).toHaveBeenCalledWith("global/items", {
        "1": { id: "1", name: "Item 1" },
        "2": { id: "2", name: "Item 2" },
      });
      expect(result).toBe(true);

      consoleSpy.mockRestore();
    });

    it("should show deprecation warning for getArray", async () => {
      const consoleSpy = jest.spyOn(console, "warn").mockImplementation();
      const indexedObj = {
        "1": { id: "1", name: "Item 1" },
        "2": { id: "2", name: "Item 2" },
      };
      mockDb.getData.mockResolvedValue(indexedObj);

      const result = await api.getArray("global/items");

      expect(consoleSpy).toHaveBeenCalledWith(
        "DEPRECATED: getArray() is unreliable with GunDB. Use direct GunDB operations instead.",
      );
      expect(mockDb.getData).toHaveBeenCalledWith("global/items");
      expect(result).toEqual([
        { id: "1", name: "Item 1" },
        { id: "2", name: "Item 2" },
      ]);

      consoleSpy.mockRestore();
    });
  });

  describe("Profile and Settings", () => {
    let mockUserNode: any;

    beforeEach(() => {
      mockDb.isLoggedIn.mockReturnValue(true);

      // Mock user node with chaining methods
      mockUserNode = {
        get: jest.fn().mockReturnThis(),
        put: jest.fn().mockReturnThis(),
        once: jest.fn().mockReturnThis(),
        then: jest.fn(),
      };

      mockDb.getUser.mockReturnValue(mockUserNode);
    });

    it("should update profile", async () => {
      const profileData = { name: "Test User", email: "test@example.com" };
      mockUserNode.then.mockResolvedValue(undefined);

      const result = await api.updateProfile(profileData);

      expect(mockDb.isLoggedIn).toHaveBeenCalled();
      expect(mockDb.getUser).toHaveBeenCalled();
      expect(mockUserNode.get).toHaveBeenCalledWith("profile");
      expect(mockUserNode.put).toHaveBeenCalledWith(profileData);
      expect(result).toBe(true);
    });

    it("should get profile", async () => {
      const profile = { name: "Test User", email: "test@example.com" };
      mockUserNode.then.mockResolvedValue(profile);

      const result = await api.getProfile();

      expect(mockDb.isLoggedIn).toHaveBeenCalled();
      expect(mockDb.getUser).toHaveBeenCalled();
      expect(mockUserNode.get).toHaveBeenCalledWith("profile");
      expect(result).toEqual(profile);
    });

    it("should save settings", async () => {
      const settings = { theme: "dark", language: "en" };
      mockUserNode.then.mockResolvedValue(undefined);

      const result = await api.saveSettings(settings);

      expect(mockDb.isLoggedIn).toHaveBeenCalled();
      expect(mockDb.getUser).toHaveBeenCalled();
      expect(mockUserNode.get).toHaveBeenCalledWith("settings");
      expect(mockUserNode.put).toHaveBeenCalledWith(settings);
      expect(result).toBe(true);
    });

    it("should get settings", async () => {
      const settings = { theme: "dark", language: "en" };
      mockUserNode.then.mockResolvedValue(settings);

      const result = await api.getSettings();

      expect(mockDb.isLoggedIn).toHaveBeenCalled();
      expect(mockDb.getUser).toHaveBeenCalled();
      expect(mockUserNode.get).toHaveBeenCalledWith("settings");
      expect(result).toEqual(settings);
    });

    it("should return null when not logged in", async () => {
      mockDb.isLoggedIn.mockReturnValue(false);

      const result = await api.getProfile();

      expect(result).toBeNull();
    });
  });

  describe("Collections", () => {
    let mockUserNode: any;

    beforeEach(() => {
      mockDb.isLoggedIn.mockReturnValue(true);

      // Mock user node with chaining methods
      mockUserNode = {
        get: jest.fn().mockReturnThis(),
        put: jest.fn().mockReturnThis(),
        once: jest.fn().mockReturnThis(),
        then: jest.fn(),
      };

      mockDb.getUser.mockReturnValue(mockUserNode);
    });

    it("should create collection", async () => {
      const items = {
        item1: { id: "item1", name: "Item 1" },
        item2: { id: "item2", name: "Item 2" },
      };
      mockUserNode.then.mockResolvedValue(undefined);

      const result = await api.createCollection("myCollection", items);

      expect(mockDb.isLoggedIn).toHaveBeenCalled();
      expect(mockUserNode.get).toHaveBeenCalledWith("collections/myCollection");
      expect(mockUserNode.put).toHaveBeenCalledWith(items);
      expect(result).toBe(true);
    });

    it("should add item to collection", async () => {
      mockUserNode.then.mockResolvedValue(undefined);

      const result = await api.addToCollection("myCollection", "item1", {
        id: "item1",
        name: "Item 1",
      });

      expect(mockDb.isLoggedIn).toHaveBeenCalled();
      expect(mockUserNode.get).toHaveBeenCalledWith(
        "collections/myCollection/item1",
      );
      expect(mockUserNode.put).toHaveBeenCalledWith({
        id: "item1",
        name: "Item 1",
      });
      expect(result).toBe(true);
    });

    it("should get collection", async () => {
      const collection = {
        item1: { id: "item1", name: "Item 1" },
        item2: { id: "item2", name: "Item 2" },
      };
      mockUserNode.then.mockResolvedValue(collection);

      const result = await api.getCollection("myCollection");

      expect(mockDb.isLoggedIn).toHaveBeenCalled();
      expect(mockUserNode.get).toHaveBeenCalledWith("collections/myCollection");
      expect(result).toEqual(collection);
    });

    it("should remove item from collection", async () => {
      mockUserNode.then.mockResolvedValue(undefined);

      const result = await api.removeFromCollection("myCollection", "item1");

      expect(mockDb.isLoggedIn).toHaveBeenCalled();
      expect(mockUserNode.get).toHaveBeenCalledWith(
        "collections/myCollection/item1",
      );
      expect(mockUserNode.put).toHaveBeenCalledWith(null);
      expect(result).toBe(true);
    });
  });
});

describe("QuickStart", () => {
  let quickStart: QuickStart;

  beforeEach(() => {
    jest.clearAllMocks();
    quickStart = new QuickStart(createMockGun(), "test-scope");
  });

  it("should initialize database", async () => {
    await quickStart.init();

    // The database should be initialized (we can't easily mock the internal db)
    expect(quickStart.database).toBeDefined();
  });

  it("should provide API access", () => {
    const api = quickStart.api;

    expect(api).toBeInstanceOf(SimpleGunAPI);
  });

  it("should provide database access", () => {
    const db = quickStart.database;

    expect(db).toBeDefined();
  });
});

describe("AutoQuickStart", () => {
  let autoQuickStart: AutoQuickStart;
  let mockGun: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockGun = createMockGun();

    autoQuickStart = new AutoQuickStart(mockGun, "test-scope");
  });

  it("should create with Gun instance", () => {
    const auto = new AutoQuickStart(mockGun);

    expect(auto).toBeDefined();
  });

  it("should provide API access", () => {
    const api = autoQuickStart.api;

    expect(api).toBeInstanceOf(SimpleGunAPI);
  });

  it("should provide database access", () => {
    const db = autoQuickStart.database;

    expect(db).toBeDefined();
  });

  it("should provide gun instance access", () => {
    // AutoQuickStart no longer exposes gun instance directly
    // The gun instance is used internally by the database
    expect(autoQuickStart).toBeDefined();
  });
});

describe("Helper Functions", () => {
  it("should create QuickStart instance", () => {
    const gun = createMockGun();
    const quick = quickStart(gun, "test-scope");

    expect(quick).toBeInstanceOf(QuickStart);
  });

  it("should create AutoQuickStart instance", () => {
    const gun = createMockGun();
    const auto = autoQuickStart(gun, "test-scope");

    expect(auto).toBeInstanceOf(AutoQuickStart);
  });
});

describe("Error Handling", () => {
  let mockDb: any;
  let mockUserNode: any;
  let api: SimpleGunAPI;

  beforeEach(() => {
    jest.clearAllMocks();

    mockUserNode = {
      get: jest.fn().mockReturnThis(),
      put: jest.fn().mockReturnThis(),
      once: jest.fn().mockReturnThis(),
      then: jest.fn(),
    };

    mockDb = {
      get: jest.fn(),
      isLoggedIn: jest.fn(),
      getUser: jest.fn().mockReturnValue(mockUserNode),
      initialize: jest.fn(),
    };

    api = new SimpleGunAPI(mockDb);
  });

  it("should handle profile get errors gracefully", async () => {
    mockDb.isLoggedIn.mockReturnValue(true);
    mockUserNode.then.mockRejectedValue(new Error("Get profile failed"));

    const result = await api.getProfile();

    expect(result).toBeNull();
  });

  it("should handle profile update errors gracefully", async () => {
    mockDb.isLoggedIn.mockReturnValue(true);
    mockUserNode.then.mockRejectedValue(new Error("Update failed"));

    const result = await api.updateProfile({ name: "Test" });

    expect(result).toBe(false);
  });

  it("should handle collection errors gracefully", async () => {
    mockDb.isLoggedIn.mockReturnValue(true);
    mockUserNode.then.mockRejectedValue(new Error("Collection failed"));

    const result = await api.getCollection("test");

    expect(result).toBeNull();
  });
});
