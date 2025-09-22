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
import { DataBase, createGun } from "../../gundb/db";

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
  createGun: jest.fn(() => createMockGun()),
}));

describe("SimpleGunAPI", () => {
  let mockDb: any;
  let api: SimpleGunAPI;

  beforeEach(() => {
    jest.clearAllMocks();

    // Create mock database
    mockDb = {
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
    };

    api = new SimpleGunAPI(mockDb);
  });

  describe("Basic Data Operations", () => {
    it("should get data successfully", async () => {
      const testData = { name: "test", value: 123 };
      mockDb.getData.mockResolvedValue(testData);

      const result = await api.get("test/path");

      expect(mockDb.getData).toHaveBeenCalledWith("test/path");
      expect(result).toEqual(testData);
    });

    it("should return null when get fails", async () => {
      mockDb.getData.mockRejectedValue(new Error("Get failed"));

      const result = await api.get("test/path");

      expect(result).toBeNull();
    });

    it("should get node for chaining", () => {
      const mockNode = { get: jest.fn(), put: jest.fn() };
      mockDb.get.mockReturnValue(mockNode);

      const result = api.getNode("test/path");

      expect(mockDb.get).toHaveBeenCalledWith("test/path");
      expect(result).toBe(mockNode);
    });

    it("should get node for direct chaining", () => {
      const mockNode = { get: jest.fn(), put: jest.fn() };
      mockDb.get.mockReturnValue(mockNode);

      const result = api.node("test/path");

      expect(mockDb.get).toHaveBeenCalledWith("test/path");
      expect(result).toBe(mockNode);
    });

    it("should put data successfully", async () => {
      const testData = { name: "test" };
      mockDb.put.mockResolvedValue({ success: true });

      const result = await api.put("test/path", testData);

      expect(mockDb.put).toHaveBeenCalledWith("test/path", testData);
      expect(result).toBe(true);
    });

    it("should return false when put fails", async () => {
      mockDb.put.mockRejectedValue(new Error("Put failed"));

      const result = await api.put("test/path", { data: "test" });

      expect(result).toBe(false);
    });

    it("should set data successfully", async () => {
      const testData = { name: "test" };
      mockDb.set.mockResolvedValue({ success: true });

      const result = await api.set("test/path", testData);

      expect(mockDb.set).toHaveBeenCalledWith("test/path", testData);
      expect(result).toBe(true);
    });

    it("should remove data successfully", async () => {
      mockDb.remove.mockResolvedValue({ success: true });

      const result = await api.remove("test/path");

      expect(mockDb.remove).toHaveBeenCalledWith("test/path");
      expect(result).toBe(true);
    });
  });

  describe("Chain Operations", () => {
    it("should create chain with proper methods", () => {
      const mockNode = { map: jest.fn() };
      mockDb.get.mockReturnValue(mockNode);

      const chain = api.chain("test/path");

      expect(chain).toHaveProperty("get");
      expect(chain).toHaveProperty("put");
      expect(chain).toHaveProperty("set");
      expect(chain).toHaveProperty("once");
      expect(chain).toHaveProperty("then");
      expect(chain).toHaveProperty("map");
    });

    it("should handle chain put operation", async () => {
      const mockNode = { map: jest.fn() };
      mockDb.get.mockReturnValue(mockNode);
      mockDb.put.mockResolvedValue({ success: true });

      const chain = api.chain("test/path");
      const result = await chain.put({ data: "test" });

      expect(mockDb.put).toHaveBeenCalledWith("test/path", { data: "test" });
      expect(result).toBe(true);
    });

    it("should handle chain get operation", () => {
      const mockNode = { map: jest.fn() };
      mockDb.get.mockReturnValue(mockNode);

      const chain = api.chain("test/path");
      const subChain = chain.get("subpath");

      expect(subChain).toBeDefined();
    });

    it("should handle chain map operation", () => {
      const mockMap = jest.fn();
      const mockNode = { map: mockMap };
      mockDb.get.mockReturnValue(mockNode);

      const chain = api.chain("test/path");
      const callback = (value: any, key: string) => value;
      chain.map(callback);

      expect(mockMap).toHaveBeenCalledWith(callback);
    });
  });

  describe("Authentication Operations", () => {
    it("should login successfully", async () => {
      const loginResult = {
        success: true,
        userPub: "user123",
        username: "testuser",
      };
      mockDb.login.mockResolvedValue(loginResult);

      const result = await api.login("testuser", "password");

      expect(mockDb.login).toHaveBeenCalledWith("testuser", "password");
      expect(result).toEqual({
        userPub: "user123",
        username: "testuser",
      });
    });

    it("should return null when login fails", async () => {
      mockDb.login.mockResolvedValue({ success: false });

      const result = await api.login("testuser", "wrongpassword");

      expect(result).toBeNull();
    });

    it("should signup successfully", async () => {
      const signupResult = {
        success: true,
        userPub: "user123",
        username: "newuser",
      };
      mockDb.signUp.mockResolvedValue(signupResult);

      const result = await api.signup("newuser", "password");

      expect(mockDb.signUp).toHaveBeenCalledWith("newuser", "password");
      expect(result).toEqual({
        userPub: "user123",
        username: "newuser",
      });
    });

    it("should logout", () => {
      api.logout();

      expect(mockDb.logout).toHaveBeenCalled();
    });

    it("should check if logged in", () => {
      mockDb.isLoggedIn.mockReturnValue(true);

      const result = api.isLoggedIn();

      expect(mockDb.isLoggedIn).toHaveBeenCalled();
      expect(result).toBe(true);
    });
  });

  describe("User Data Operations", () => {
    beforeEach(() => {
      mockDb.isLoggedIn.mockReturnValue(true);
    });

    it("should get user data successfully", async () => {
      const userData = { profile: { name: "test" } };
      mockDb.getUserData.mockResolvedValue(userData);

      const result = await api.getUserData("profile");

      expect(mockDb.getUserData).toHaveBeenCalledWith("profile");
      expect(result).toEqual(userData);
    });

    it("should return null when user not logged in", async () => {
      mockDb.isLoggedIn.mockReturnValue(false);

      const result = await api.getUserData("profile");

      expect(result).toBeNull();
    });

    it("should put user data successfully", async () => {
      const userData = { name: "test" };
      mockDb.putUserData.mockResolvedValue(undefined);

      const result = await api.putUserData("profile", userData);

      expect(mockDb.putUserData).toHaveBeenCalledWith("profile", userData);
      expect(result).toBe(true);
    });

    it("should set user data successfully", async () => {
      const userData = { name: "test" };
      mockDb.putUserData.mockResolvedValue(undefined);

      const result = await api.setUserData("profile", userData);

      expect(mockDb.putUserData).toHaveBeenCalledWith("profile", userData);
      expect(result).toBe(true);
    });

    it("should remove user data successfully", async () => {
      mockDb.removeUserData.mockResolvedValue(undefined);

      const result = await api.removeUserData("profile");

      expect(mockDb.removeUserData).toHaveBeenCalledWith("profile");
      expect(result).toBe(true);
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

  describe("User Management", () => {
    it("should get current user", () => {
      const user = { pub: "user123", alias: "testuser" };
      mockDb.getCurrentUser.mockReturnValue(user);

      const result = api.getCurrentUser();

      expect(mockDb.getCurrentUser).toHaveBeenCalled();
      expect(result).toEqual({
        pub: "user123",
        username: "testuser",
      });
    });

    it("should check if user exists", async () => {
      const user = { userPub: "user123", username: "testuser" };
      mockDb.getUserByAlias.mockResolvedValue(user);

      const result = await api.userExists("testuser");

      expect(mockDb.getUserByAlias).toHaveBeenCalledWith("testuser");
      expect(result).toBe(true);
    });

    it("should get user by alias", async () => {
      const user = { userPub: "user123", username: "testuser" };
      mockDb.getUserByAlias.mockResolvedValue(user);

      const result = await api.getUser("testuser");

      expect(mockDb.getUserByAlias).toHaveBeenCalledWith("testuser");
      expect(result).toEqual({
        userPub: "user123",
        username: "testuser",
      });
    });
  });

  describe("Profile and Settings", () => {
    beforeEach(() => {
      mockDb.isLoggedIn.mockReturnValue(true);
    });

    it("should update profile", async () => {
      const profileData = { name: "Test User", email: "test@example.com" };
      mockDb.putUserData.mockResolvedValue(undefined);

      const result = await api.updateProfile(profileData);

      expect(mockDb.putUserData).toHaveBeenCalledWith("profile", profileData);
      expect(result).toBe(true);
    });

    it("should get profile", async () => {
      const profile = { name: "Test User", email: "test@example.com" };
      mockDb.getUserData.mockResolvedValue(profile);

      const result = await api.getProfile();

      expect(mockDb.getUserData).toHaveBeenCalledWith("profile");
      expect(result).toEqual(profile);
    });

    it("should save settings", async () => {
      const settings = { theme: "dark", language: "en" };
      mockDb.putUserData.mockResolvedValue(undefined);

      const result = await api.saveSettings(settings);

      expect(mockDb.putUserData).toHaveBeenCalledWith("settings", settings);
      expect(result).toBe(true);
    });

    it("should get settings", async () => {
      const settings = { theme: "dark", language: "en" };
      mockDb.getUserData.mockResolvedValue(settings);

      const result = await api.getSettings();

      expect(mockDb.getUserData).toHaveBeenCalledWith("settings");
      expect(result).toEqual(settings);
    });
  });

  describe("Collections", () => {
    beforeEach(() => {
      mockDb.isLoggedIn.mockReturnValue(true);
    });

    it("should create collection", async () => {
      const items = {
        item1: { id: "item1", name: "Item 1" },
        item2: { id: "item2", name: "Item 2" },
      };
      mockDb.putUserData.mockResolvedValue(undefined);

      const result = await api.createCollection("myCollection", items);

      expect(mockDb.putUserData).toHaveBeenCalledWith(
        "collections/myCollection",
        items,
      );
      expect(result).toBe(true);
    });

    it("should add item to collection", async () => {
      mockDb.putUserData.mockResolvedValue(undefined);

      const result = await api.addToCollection("myCollection", "item1", {
        id: "item1",
        name: "Item 1",
      });

      expect(mockDb.putUserData).toHaveBeenCalledWith(
        "collections/myCollection/item1",
        { id: "item1", name: "Item 1" },
      );
      expect(result).toBe(true);
    });

    it("should get collection", async () => {
      const collection = {
        item1: { id: "item1", name: "Item 1" },
        item2: { id: "item2", name: "Item 2" },
      };
      mockDb.getUserData.mockResolvedValue(collection);

      const result = await api.getCollection("myCollection");

      expect(mockDb.getUserData).toHaveBeenCalledWith(
        "collections/myCollection",
      );
      expect(result).toEqual(collection);
    });

    it("should remove item from collection", async () => {
      mockDb.removeUserData.mockResolvedValue(undefined);

      const result = await api.removeFromCollection("myCollection", "item1");

      expect(mockDb.removeUserData).toHaveBeenCalledWith(
        "collections/myCollection/item1",
      );
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

  beforeEach(() => {
    jest.clearAllMocks();

    autoQuickStart = new AutoQuickStart({
      peers: ["http://localhost:8765/gun"],
      appScope: "test-scope",
    });
  });

  it("should create with default config", () => {
    const auto = new AutoQuickStart();

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
    const gun = autoQuickStart.gun;

    expect(gun).toBeDefined();
  });
});

describe("Helper Functions", () => {
  it("should create QuickStart instance", () => {
    const gun = createMockGun();
    const quick = quickStart(gun, "test-scope");

    expect(quick).toBeInstanceOf(QuickStart);
  });

  it("should create AutoQuickStart instance", () => {
    const auto = autoQuickStart({
      peers: ["http://localhost:8765/gun"],
      appScope: "test-scope",
    });

    expect(auto).toBeInstanceOf(AutoQuickStart);
  });
});

describe("Error Handling", () => {
  let mockDb: any;
  let api: SimpleGunAPI;

  beforeEach(() => {
    jest.clearAllMocks();

    mockDb = {
      getData: jest.fn(),
      put: jest.fn(),
      set: jest.fn(),
      remove: jest.fn(),
      login: jest.fn(),
      signUp: jest.fn(),
      getUserData: jest.fn(),
      putUserData: jest.fn(),
      removeUserData: jest.fn(),
      getCurrentUser: jest.fn(),
      getUserByAlias: jest.fn(),
      isLoggedIn: jest.fn(),
    };

    api = new SimpleGunAPI(mockDb);
  });

  it("should handle get errors gracefully", async () => {
    mockDb.getData.mockRejectedValue(new Error("Network error"));

    const result = await api.get("test/path");

    expect(result).toBeNull();
  });

  it("should handle put errors gracefully", async () => {
    mockDb.put.mockRejectedValue(new Error("Put failed"));

    const result = await api.put("test/path", { data: "test" });

    expect(result).toBe(false);
  });

  it("should handle login errors gracefully", async () => {
    mockDb.login.mockRejectedValue(new Error("Login failed"));

    const result = await api.login("user", "pass");

    expect(result).toBeNull();
  });

  it("should handle user data errors gracefully", async () => {
    mockDb.isLoggedIn.mockReturnValue(true);
    mockDb.getUserData.mockRejectedValue(new Error("Get user data failed"));

    const result = await api.getUserData("profile");

    expect(result).toBeNull();
  });
});
