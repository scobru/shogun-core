import { GunRxJS } from "../../gundb/gun-rxjs";
import { Observable } from "rxjs";
import { IGunInstance, IGunUserInstance } from "gun";

// Mock RxJS con implementazione semplificata
jest.mock("rxjs", () => ({
  Observable: jest.fn().mockImplementation((fn) => {
    const observable = {
      pipe: jest.fn(() => observable),
      subscribe: jest.fn(),
    };
    if (fn) {
      // Simula la chiamata del subscriber
      const mockSubscriber = {
        next: jest.fn(),
        error: jest.fn(),
        complete: jest.fn(),
      };
      fn(mockSubscriber);
    }
    return observable;
  }),
}));

jest.mock("rxjs/operators", () => ({
  distinctUntilChanged: jest.fn(() => (source: any) => source),
}));

describe("GunRxJS", () => {
  let gunRxJS: GunRxJS;
  let mockGun: jest.Mocked<IGunInstance<any>>;
  let mockUser: jest.Mocked<IGunUserInstance<any>>;
  let mockNode: any;

  beforeEach(() => {
    jest.clearAllMocks();

    // Create mock node
    mockNode = {
      on: jest.fn(),
      off: jest.fn(),
      put: jest.fn((data, callback) => {
        if (callback) callback({ ok: 1 });
        return mockNode;
      }),
      set: jest.fn((data, callback) => {
        if (callback) callback({ ok: 1 });
        return mockNode;
      }),
      once: jest.fn((callback) => {
        if (callback) callback({ test: "data" });
        return mockNode;
      }),
      map: jest.fn(() => ({
        on: jest.fn((callback) => {
          if (callback) callback({ test: "data" }, "test-key");
          return { off: jest.fn() };
        }),
        off: jest.fn(),
      })),
      get: jest.fn(() => mockNode),
    };

    // Create mock user
    mockUser = {
      is: { pub: "test-pub" },
      get: jest.fn(() => mockNode),
      put: jest.fn((data, callback) => {
        if (callback) callback({ ok: 1 });
        return mockUser;
      }),
      set: jest.fn((data, callback) => {
        if (callback) callback({ ok: 1 });
        return mockUser;
      }),
      once: jest.fn((callback) => {
        if (callback) callback({ test: "data" });
        return mockUser;
      }),
      on: jest.fn(),
      off: jest.fn(),
      leave: jest.fn(),
      recall: jest.fn(),
      create: jest.fn(),
      auth: jest.fn(),
    } as any;

    // Create mock gun instance
    mockGun = {
      user: jest.fn(() => mockUser),
      get: jest.fn(() => mockNode),
      put: jest.fn((data, callback) => {
        if (callback) callback({ ok: 1 });
        return mockGun;
      }),
      set: jest.fn((data, callback) => {
        if (callback) callback({ ok: 1 });
        return mockGun;
      }),
      once: jest.fn((callback) => {
        if (callback) callback({ test: "data" });
        return mockGun;
      }),
      on: jest.fn(),
      off: jest.fn(),
      map: jest.fn(() => ({
        on: jest.fn((callback) => {
          if (callback) callback({ test: "data" }, "test-key");
          return { off: jest.fn() };
        }),
        off: jest.fn(),
      })),
    } as any;

    gunRxJS = new GunRxJS(mockGun);
  });

  describe("Constructor", () => {
    it("should create GunRxJS instance with gun instance", () => {
      expect(gunRxJS).toBeDefined();
      expect(mockGun.user).toHaveBeenCalled();
    });
  });

  describe("getUser", () => {
    it("should return the current user", () => {
      const result = gunRxJS.getUser();
      expect(result).toBe(mockUser);
    });
  });

  describe("getUserPub", () => {
    it("should return user public key when available", () => {
      const result = gunRxJS.getUserPub();
      expect(result).toBe("test-pub");
    });

    it("should return undefined when user pub is not available", () => {
      mockUser.is = undefined;
      const result = gunRxJS.getUserPub();
      expect(result).toBeUndefined();
    });
  });

  describe("observe", () => {
    it("should create observable for string path", () => {
      const result = gunRxJS.observe("test-path");

      expect(mockGun.get).toHaveBeenCalledWith("test-path");
      expect(Observable).toHaveBeenCalled();
      expect(result).toBeDefined();
      expect(typeof result.pipe).toBe("function");
    });

    it("should create observable for array path", () => {
      const result = gunRxJS.observe(["path1", "path2"]);

      expect(mockGun.get).toHaveBeenCalledWith("path1");
      expect(Observable).toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it("should create observable for node", () => {
      const result = gunRxJS.observe(mockNode);

      expect(Observable).toHaveBeenCalled();
      expect(result).toBeDefined();
    });
  });

  describe("observeUser", () => {
    it("should create user observe observable", () => {
      const result = gunRxJS.observeUser();

      expect(mockUser.get).toHaveBeenCalledWith("~");
      expect(Observable).toHaveBeenCalled();
      expect(result).toBeDefined();
    });
  });

  describe("userGet", () => {
    it("should create user get observable", () => {
      const result = gunRxJS.userGet("test-path");

      expect(mockUser.get).toHaveBeenCalledWith("test-path");
      expect(Observable).toHaveBeenCalled();
      expect(result).toBeDefined();
    });
  });

  describe("put", () => {
    it("should create put observable", () => {
      const data = { test: "data" };
      const result = gunRxJS.put(data);

      expect(Observable).toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it("should create put observable with callback", () => {
      const data = { test: "data" };
      const callback = jest.fn();
      const result = gunRxJS.put(data, callback);

      expect(Observable).toHaveBeenCalled();
      expect(result).toBeDefined();
    });
  });

  describe("set", () => {
    it("should create set observable", () => {
      const data = { test: "data" };
      const result = gunRxJS.set(data);

      expect(Observable).toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it("should create set observable with callback", () => {
      const data = { test: "data" };
      const callback = jest.fn();
      const result = gunRxJS.set(data, callback);

      expect(Observable).toHaveBeenCalled();
      expect(result).toBeDefined();
    });
  });

  describe("once", () => {
    it("should create once observable", () => {
      const result = gunRxJS.once();

      expect(Observable).toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it("should create once observable with path", () => {
      const result = gunRxJS.once("test-path");

      expect(Observable).toHaveBeenCalled();
      expect(result).toBeDefined();
    });
  });

  describe("userPut", () => {
    it("should create user put observable", () => {
      const data = { test: "data" };
      const result = gunRxJS.userPut(data);

      expect(Observable).toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it("should create user put observable with callback", () => {
      const data = { test: "data" };
      const callback = jest.fn();
      const result = gunRxJS.userPut(data, callback);

      expect(Observable).toHaveBeenCalled();
      expect(result).toBeDefined();
    });
  });

  describe("userSet", () => {
    it("should create user set observable", () => {
      const data = { test: "data" };
      const result = gunRxJS.userSet(data);

      expect(Observable).toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it("should create user set observable with callback", () => {
      const data = { test: "data" };
      const callback = jest.fn();
      const result = gunRxJS.userSet(data, callback);

      expect(Observable).toHaveBeenCalled();
      expect(result).toBeDefined();
    });
  });

  describe("userOnce", () => {
    it("should create user once observable", () => {
      const result = gunRxJS.userOnce();

      expect(Observable).toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it("should create user once observable with callback", () => {
      const callback = jest.fn();
      const result = gunRxJS.userOnce(callback);

      expect(Observable).toHaveBeenCalled();
      expect(result).toBeDefined();
    });
  });

  describe("match", () => {
    it("should create match observable", () => {
      const matchData = { name: "test" };

      const result = gunRxJS.match(
        "test-path",
        (item) => item.name === matchData.name,
      );
      expect(Observable).toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it("should create match observable without filter", () => {
      const result = gunRxJS.match("test-path");
      expect(Observable).toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it("should handle null/undefined data", () => {
      const result = gunRxJS.match(null);
      expect(Observable).toHaveBeenCalled();
      expect(result).toBeDefined();
    });
  });

  describe("Edge cases", () => {
    it("should handle undefined user gracefully", () => {
      mockUser.is = undefined;
      const result = gunRxJS.getUserPub();
      expect(result).toBeUndefined();
    });

    it("should handle empty string paths", () => {
      const result = gunRxJS.observe("");
      expect(Observable).toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it("should handle null/undefined data in match", () => {
      const result1 = gunRxJS.match(null);
      const result2 = gunRxJS.match(undefined);

      expect(Observable).toHaveBeenCalled();
      expect(result1).toBeDefined();
      expect(result2).toBeDefined();
    });
  });
});
