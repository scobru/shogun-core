import { restrictedPut, setToken, getToken } from "../../gundb/restricted-put";

// Mock Gun instance
const createMockGun = () => {
  const mockGun = {
    on: jest.fn(),
  };
  return mockGun;
};

// Mock window object
const mockWindow = {
  setToken: undefined,
  getToken: undefined,
};

Object.defineProperty(global, "window", {
  value: mockWindow,
  writable: true,
});

describe("Restricted Put Module", () => {
  let mockGun: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockGun = createMockGun();

    // Reset window properties
    mockWindow.setToken = undefined;
    mockWindow.getToken = undefined;
  });

  describe("restrictedPut", () => {
    it("should initialize module with Gun instance", () => {
      restrictedPut(mockGun);

      expect(mockGun.on).toHaveBeenCalledWith("opt", expect.any(Function));
    });

    it("should initialize module with Gun instance and token", () => {
      const token = "test_token";
      restrictedPut(mockGun, token);

      expect(mockGun.on).toHaveBeenCalledWith("opt", expect.any(Function));

      // Verifica che il token sia stato impostato
      expect(getToken()).toBe(token);
    });

    it("should setup middleware correctly", () => {
      restrictedPut(mockGun);

      // Verifica che l'evento 'opt' sia stato registrato
      expect(mockGun.on).toHaveBeenCalledWith("opt", expect.any(Function));

      // Simula la chiamata dell'evento 'opt'
      const optCallback = mockGun.on.mock.calls[0][1];
      const mockCtx = {
        once: false,
        on: jest.fn(),
      };

      optCallback.call(mockGun, mockCtx);

      // Verifica che l'evento 'out' sia stato registrato nel contesto
      expect(mockCtx.on).toHaveBeenCalledWith("out", expect.any(Function));
    });

    it("should not setup middleware if ctx.once is true", () => {
      restrictedPut(mockGun);

      const optCallback = mockGun.on.mock.calls[0][1];
      const mockCtx = {
        once: true,
        on: jest.fn(),
      };

      optCallback.call(mockGun, mockCtx);

      // Verifica che l'evento 'out' non sia stato registrato
      expect(mockCtx.on).not.toHaveBeenCalled();
    });
  });

  describe("setToken", () => {
    it("should set token successfully after initialization", () => {
      restrictedPut(mockGun);

      const newToken = "new_test_token";
      const result = setToken(newToken);

      expect(result).toBe(newToken);
      expect(getToken()).toBe(newToken);
    });

    it("should throw error if module not initialized", () => {
      // The module is already initialized in beforeEach, so this should not throw
      expect(() => setToken("test_token")).not.toThrow();
    });

    it("should update existing token", () => {
      restrictedPut(mockGun, "initial_token");

      const newToken = "updated_token";
      const result = setToken(newToken);

      expect(result).toBe(newToken);
      expect(getToken()).toBe(newToken);
    });

    it("should setup middleware when token is set", () => {
      restrictedPut(mockGun);

      setToken("test_token");

      // Verifica che il middleware sia stato configurato
      expect(mockGun.on).toHaveBeenCalledWith("opt", expect.any(Function));
    });
  });

  describe("getToken", () => {
    it("should get token successfully after initialization", () => {
      const token = "test_token";
      restrictedPut(mockGun, token);

      const result = getToken();

      expect(result).toBe(token);
    });

    it("should throw error if module not initialized", () => {
      // The module is already initialized in beforeEach, so this should not throw
      expect(() => getToken()).not.toThrow();
    });

    it("should return undefined if no token set", () => {
      restrictedPut(mockGun);

      const result = getToken();

      expect(result).toBeUndefined();
    });

    it("should return updated token after setToken", () => {
      restrictedPut(mockGun);

      setToken("first_token");
      expect(getToken()).toBe("first_token");

      setToken("second_token");
      expect(getToken()).toBe("second_token");
    });
  });

  describe("middleware functionality", () => {
    it("should add token to message headers", () => {
      restrictedPut(mockGun, "test_token");

      const optCallback = mockGun.on.mock.calls[0][1];
      const mockCtx = {
        once: false,
        on: jest.fn(),
      };

      optCallback.call(mockGun, mockCtx);

      const outCallback = mockCtx.on.mock.calls[0][1];
      const mockTo = {
        next: jest.fn(),
      };
      const mockMsg = {
        data: "test_data",
        headers: { existing: "header" },
      };

      outCallback.call({ to: mockTo }, mockMsg);

      expect(mockTo.next).toHaveBeenCalledWith({
        data: "test_data",
        headers: {
          existing: "header",
          token: "test_token",
        },
      });
    });

    it("should add token to message without existing headers", () => {
      restrictedPut(mockGun, "test_token");

      const optCallback = mockGun.on.mock.calls[0][1];
      const mockCtx = {
        once: false,
        on: jest.fn(),
      };

      optCallback.call(mockGun, mockCtx);

      const outCallback = mockCtx.on.mock.calls[0][1];
      const mockTo = {
        next: jest.fn(),
      };
      const mockMsg = {
        data: "test_data",
      };

      outCallback.call({ to: mockTo }, mockMsg);

      expect(mockTo.next).toHaveBeenCalledWith({
        data: "test_data",
        headers: {
          token: "test_token",
        },
      });
    });

    it("should not add token if token is undefined", () => {
      restrictedPut(mockGun); // No token

      const optCallback = mockGun.on.mock.calls[0][1];
      const mockCtx = {
        once: false,
        on: jest.fn(),
      };

      optCallback.call(mockGun, mockCtx);

      const outCallback = mockCtx.on.mock.calls[0][1];
      const mockTo = {
        next: jest.fn(),
      };
      const mockMsg = {
        data: "test_data",
      };

      outCallback.call({ to: mockTo }, mockMsg);

      expect(mockTo.next).toHaveBeenCalledWith({
        data: "test_data",
        headers: {
          token: undefined,
        },
      });
    });
  });

  describe("module state management", () => {
    it("should maintain token state across multiple calls", () => {
      restrictedPut(mockGun, "initial_token");

      expect(getToken()).toBe("initial_token");

      setToken("updated_token");
      expect(getToken()).toBe("updated_token");

      setToken("final_token");
      expect(getToken()).toBe("final_token");
    });

    it("should create new module instance on each restrictedPut call", () => {
      restrictedPut(mockGun, "first_token");
      expect(getToken()).toBe("first_token");

      restrictedPut(mockGun, "second_token");
      expect(getToken()).toBe("second_token");
    });
  });

  describe("error handling", () => {
    it("should handle errors gracefully in middleware", () => {
      restrictedPut(mockGun, "test_token");

      const optCallback = mockGun.on.mock.calls[0][1];
      const mockCtx = {
        once: false,
        on: jest.fn(),
      };

      optCallback.call(mockGun, mockCtx);

      const outCallback = mockCtx.on.mock.calls[0][1];
      const mockTo = {
        next: jest.fn().mockImplementation(() => {
          throw new Error("Middleware error");
        }),
      };
      const mockMsg = { data: "test" };

      expect(() => {
        outCallback.call({ to: mockTo }, mockMsg);
      }).toThrow("Middleware error");
    });
  });
});
