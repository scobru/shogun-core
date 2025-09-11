import { HolsterRxJS } from "../../holster/holster-rxjs";
import { Observable } from "rxjs";

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

describe("HolsterRxJS", () => {
  let holsterRxJS: HolsterRxJS;
  let mockHolster: any;
  let mockUser: any;
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

    // Create mock holster instance
    mockHolster = {
      user: jest.fn(() => mockUser),
      get: jest.fn(() => mockNode),
      put: jest.fn((data, callback) => {
        if (callback) callback({ ok: 1 });
        return mockHolster;
      }),
      set: jest.fn((data, callback) => {
        if (callback) callback({ ok: 1 });
        return mockHolster;
      }),
      once: jest.fn((callback) => {
        if (callback) callback({ test: "data" });
        return mockHolster;
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

    holsterRxJS = new HolsterRxJS(mockHolster);
  });

  describe("Constructor", () => {
    it("should create HolsterRxJS instance with holster instance", () => {
      expect(holsterRxJS).toBeDefined();
      expect(mockHolster.user).toHaveBeenCalled();
    });
  });

  describe("getUser", () => {
    it("should return the current user", () => {
      const result = holsterRxJS.getUser();
      expect(result).toBe(mockUser);
    });
  });

  describe("getUserPub", () => {
    it("should return user public key when available", () => {
      const result = holsterRxJS.getUserPub();
      expect(result).toBe("test-pub");
    });

    it("should return undefined when user pub is not available", () => {
      mockUser.is = undefined;
      const result = holsterRxJS.getUserPub();
      expect(result).toBeUndefined();
    });
  });

  describe("observe", () => {
    it("should create observable for string path", () => {
      const result = holsterRxJS.observe("test-path");

      expect(mockHolster.get).toHaveBeenCalledWith("test-path");
      expect(Observable).toHaveBeenCalled();
      expect(result).toBeDefined();
      expect(typeof result.pipe).toBe("function");
    });

    it("should create observable for array path", () => {
      const result = holsterRxJS.observe(["path1", "path2"]);

      expect(mockHolster.get).toHaveBeenCalledWith("path1");
      expect(Observable).toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it("should create observable for node", () => {
      const result = holsterRxJS.observe(mockNode);

      expect(Observable).toHaveBeenCalled();
      expect(result).toBeDefined();
    });
  });

  describe("observeUser", () => {
    it("should create user observe observable", () => {
      const result = holsterRxJS.observeUser();

      expect(mockUser.get).toHaveBeenCalledWith("~");
      expect(Observable).toHaveBeenCalled();
      expect(result).toBeDefined();
    });
  });

  describe("userGet", () => {
    it("should create user get observable", () => {
      const result = holsterRxJS.userGet("test-path");

      expect(mockUser.get).toHaveBeenCalledWith("test-path");
      expect(Observable).toHaveBeenCalled();
      expect(result).toBeDefined();
    });
  });

  describe("put", () => {
    it("should create put observable", () => {
      const data = { test: "data" };
      const result = holsterRxJS.put("test-path", data);

      expect(Observable).toHaveBeenCalled();
      expect(result).toBeDefined();
    });
  });

  describe("set", () => {
    it("should create set observable", () => {
      const data = { test: "data" };
      const result = holsterRxJS.set("test-path", data);

      expect(Observable).toHaveBeenCalled();
      expect(result).toBeDefined();
    });
  });

  describe("once", () => {
    it("should create once observable", () => {
      const result = holsterRxJS.once();

      expect(Observable).toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it("should create once observable with path", () => {
      const result = holsterRxJS.once("test-path");

      expect(Observable).toHaveBeenCalled();
      expect(result).toBeDefined();
    });
  });

  describe("userPut", () => {
    it("should create user put observable", () => {
      const data = { test: "data" };
      const result = holsterRxJS.userPut("test-path", data);

      expect(Observable).toHaveBeenCalled();
      expect(result).toBeDefined();
    });
  });

  describe("userSet", () => {
    it("should create user set observable", () => {
      const data = { test: "data" };
      const result = holsterRxJS.userSet("test-path", data);

      expect(Observable).toHaveBeenCalled();
      expect(result).toBeDefined();
    });
  });

  describe("userOnce", () => {
    it("should create user once observable", () => {
      const result = holsterRxJS.userOnce();

      expect(Observable).toHaveBeenCalled();
      expect(result).toBeDefined();
    });
  });

  describe("match", () => {
    it("should create match observable", () => {
      const matchData = { name: "test" };

      const result = holsterRxJS.match(
        "test-path",
        (item) => item.name === matchData.name,
      );
      expect(Observable).toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it("should create match observable without filter", () => {
      const result = holsterRxJS.match("test-path");
      expect(Observable).toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it("should handle null/undefined data", () => {
      const result = holsterRxJS.match(null);
      expect(Observable).toHaveBeenCalled();
      expect(result).toBeDefined();
    });
  });

  describe("Edge cases", () => {
    it("should handle undefined user gracefully", () => {
      mockUser.is = undefined;
      const result = holsterRxJS.getUserPub();
      expect(result).toBeUndefined();
    });

    it("should handle empty string paths", () => {
      const result = holsterRxJS.observe("");
      expect(Observable).toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it("should handle null/undefined data in match", () => {
      const result1 = holsterRxJS.match(null);
      const result2 = holsterRxJS.match(undefined);

      expect(Observable).toHaveBeenCalled();
      expect(result1).toBeDefined();
      expect(result2).toBeDefined();
    });
  });
});
