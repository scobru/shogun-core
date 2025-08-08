import {
  ErrorHandler,
  createError,
  ErrorType,
  ShogunError,
} from "../../utils/errorHandler";

describe("ErrorHandler", () => {
  beforeEach(() => {
    ErrorHandler.clearErrors();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("createError", () => {
    it("should create a structured error object", () => {
      const originalError = new Error("Original error");
      const error = createError(
        ErrorType.AUTHENTICATION,
        "AUTH_001",
        "Authentication failed",
        originalError
      );

      expect(error).toEqual({
        type: ErrorType.AUTHENTICATION,
        code: "AUTH_001",
        message: "Authentication failed",
        originalError,
        timestamp: expect.any(Number),
      });
    });

    it("should create error without original error", () => {
      const error = createError(
        ErrorType.VALIDATION,
        "VAL_001",
        "Invalid input"
      );

      expect(error).toEqual({
        type: ErrorType.VALIDATION,
        code: "VAL_001",
        message: "Invalid input",
        originalError: undefined,
        timestamp: expect.any(Number),
      });
    });
  });

  describe("handle", () => {
    it("should handle error and return structured error", () => {
      const originalError = new Error("Test error");
      const error = ErrorHandler.handle(
        ErrorType.NETWORK,
        "NET_001",
        "Network timeout",
        originalError
      );

      expect(error.type).toBe(ErrorType.NETWORK);
      expect(error.code).toBe("NET_001");
      expect(error.message).toBe("Network timeout - Error: Test error");
      expect(error.originalError).toBe(originalError);
    });

    it("should log essential errors to console", () => {
      const consoleSpy = jest.spyOn(console, "error").mockImplementation();

      ErrorHandler.handle(
        ErrorType.AUTHENTICATION,
        "AUTH_001",
        "Authentication failed"
      );

      expect(consoleSpy).toHaveBeenCalledWith(
        "[AuthenticationError] AUTH_001: Authentication failed"
      );

      consoleSpy.mockRestore();
    });

    it("should not log non-essential errors to console", () => {
      const consoleSpy = jest.spyOn(console, "error").mockImplementation();
      
      ErrorHandler.handle(
        ErrorType.VALIDATION,
        "VAL_001",
        "Validation error"
      );

      expect(consoleSpy).not.toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });

  describe("handleAndThrow", () => {
    it("should handle error and throw it", () => {
      expect(() => {
        ErrorHandler.handleAndThrow(
          ErrorType.SECURITY,
          "SEC_001",
          "Security violation"
        );
      }).toThrow("Security violation");
    });
  });

  describe("getRecentErrors", () => {
    it("should return recent errors", () => {
      ErrorHandler.handle(ErrorType.AUTHENTICATION, "AUTH_001", "Error 1");
      ErrorHandler.handle(ErrorType.VALIDATION, "VAL_001", "Error 2");
      ErrorHandler.handle(ErrorType.NETWORK, "NET_001", "Error 3");

      const recentErrors = ErrorHandler.getRecentErrors(2);
      expect(recentErrors).toHaveLength(2);
      expect(recentErrors[0].message).toBe("Error 2");
      expect(recentErrors[1].message).toBe("Error 3");
    });

    it("should return all errors if count exceeds total", () => {
      ErrorHandler.handle(ErrorType.AUTHENTICATION, "AUTH_001", "Error 1");
      ErrorHandler.handle(ErrorType.VALIDATION, "VAL_001", "Error 2");

      const recentErrors = ErrorHandler.getRecentErrors(10);
      expect(recentErrors).toHaveLength(2);
    });
  });

  describe("addListener and removeListener", () => {
    it("should add and notify listeners", () => {
      const listener = jest.fn();
      ErrorHandler.addListener(listener);

      ErrorHandler.handle(ErrorType.AUTHENTICATION, "AUTH_001", "Test error");

      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({
          type: ErrorType.AUTHENTICATION,
          code: "AUTH_001",
          message: "Test error",
        })
      );
    });

    it("should remove listeners", () => {
      const listener = jest.fn();
      ErrorHandler.addListener(listener);
      ErrorHandler.removeListener(listener);

      ErrorHandler.handle(ErrorType.AUTHENTICATION, "AUTH_001", "Test error");

      expect(listener).not.toHaveBeenCalled();
    });
  });

  describe("formatError", () => {
    it("should format Error objects", () => {
      const error = new Error("Test error");
      const formatted = ErrorHandler.formatError(error);
      expect(formatted).toContain("Test error");
    });

    it("should format string errors", () => {
      const formatted = ErrorHandler.formatError("String error");
      expect(formatted).toBe("String error");
    });

    it("should format unknown errors", () => {
      const formatted = ErrorHandler.formatError({ custom: "error" });
      expect(formatted).toContain(`{"custom":"error"}`);
    });
  });

  describe("withRetry", () => {
    it("should retry failed operations", async () => {
      let attempts = 0;
      const failingOperation = jest.fn().mockImplementation(() => {
        attempts++;
        if (attempts < 3) {
          throw new Error("Temporary failure");
        }
        return "success";
      });

      const result = await ErrorHandler.withRetry(
        failingOperation,
        ErrorType.NETWORK,
        "NET_001",
        3,
        100
      );

      expect(result).toBe("success");
      expect(failingOperation).toHaveBeenCalledTimes(3);
    });

    it("should throw after max retries", async () => {
      const failingOperation = jest.fn().mockRejectedValue(new Error("Persistent failure"));

      await expect(
        ErrorHandler.withRetry(
          failingOperation,
          ErrorType.NETWORK,
          "NET_001",
          2,
          100
        )
      ).rejects.toThrow("Operation failed after 2 attempts - Error: Persistent failure");

      expect(failingOperation).toHaveBeenCalledTimes(2);
    });

    it("should succeed on first attempt", async () => {
      const successfulOperation = jest.fn().mockResolvedValue("success");

      const result = await ErrorHandler.withRetry(
        successfulOperation,
        ErrorType.NETWORK,
        "NET_001"
      );

      expect(result).toBe("success");
      expect(successfulOperation).toHaveBeenCalledTimes(1);
    });
  });

  describe("clearErrors", () => {
    it("should clear all stored errors", () => {
      ErrorHandler.handle(ErrorType.AUTHENTICATION, "AUTH_001", "Error 1");
      ErrorHandler.handle(ErrorType.VALIDATION, "VAL_001", "Error 2");

      ErrorHandler.clearErrors();

      const recentErrors = ErrorHandler.getRecentErrors();
      expect(recentErrors).toHaveLength(0);
    });
  });

  describe("getErrorStats", () => {
    it("should return error statistics", () => {
      ErrorHandler.handle(ErrorType.AUTHENTICATION, "AUTH_001", "Error 1");
      ErrorHandler.handle(ErrorType.AUTHENTICATION, "AUTH_002", "Error 2");
      ErrorHandler.handle(ErrorType.VALIDATION, "VAL_001", "Error 3");

      const stats = ErrorHandler.getErrorStats();

      expect(stats.total).toBe(3);
      expect(stats.byType).toEqual({
        AuthenticationError: 2,
        ValidationError: 1,
      });
      expect(stats.byCode).toEqual({
        AUTH_001: 1,
        AUTH_002: 1,
        VAL_001: 1,
      });
    });
  });

  describe("debug", () => {
    let originalNodeEnv: string | undefined;

    beforeEach(() => {
      originalNodeEnv = process.env.NODE_ENV;
    });

    afterEach(() => {
      process.env.NODE_ENV = originalNodeEnv;
    });

    it("should log debug messages when NODE_ENV is development", () => {
      process.env.NODE_ENV = "development";
      const consoleSpy = jest.spyOn(console, "log").mockImplementation();

      ErrorHandler.debug(
        ErrorType.VALIDATION,
        "VAL_001",
        "Debug message",
        "debug"
      );

      expect(consoleSpy).toHaveBeenCalledWith(
        "[ValidationError.VAL_001] (DEBUG) Debug message"
      );

      consoleSpy.mockRestore();
    });

    it("should not log debug messages when NODE_ENV is not development", () => {
      process.env.NODE_ENV = "test";
      const consoleSpy = jest.spyOn(console, "log").mockImplementation();

      ErrorHandler.debug(
        ErrorType.VALIDATION,
        "VAL_001",
        "Debug message",
        "debug"
      );

      expect(consoleSpy).not.toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });

  describe("setExternalLogger", () => {
    it("should set external logger", () => {
      const externalLogger = jest.fn();
      ErrorHandler.setExternalLogger(externalLogger);

      ErrorHandler.handle(ErrorType.AUTHENTICATION, "AUTH_001", "Test error");

      expect(externalLogger).toHaveBeenCalledWith(
        expect.objectContaining({
          type: ErrorType.AUTHENTICATION,
          code: "AUTH_001",
          message: "Test error",
        })
      );
    });
  });
}); 