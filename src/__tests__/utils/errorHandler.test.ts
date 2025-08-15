import {
  ErrorHandler,
  createError,
  ErrorType,
  ShogunError,
} from "../../utils/errorHandler";

describe("ErrorHandler", () => {
  beforeEach(() => {
    // Clear all errors and listeners before each test
    ErrorHandler.clearErrors();
    jest.clearAllMocks();
  });

  describe("createError", () => {
    it("should create a structured error object", () => {
      const originalError = new Error("Original error");
      const error = createError(
        ErrorType.AUTHENTICATION,
        "AUTH_001",
        "Authentication failed",
        originalError,
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
        "Validation failed",
      );

      expect(error).toEqual({
        type: ErrorType.VALIDATION,
        code: "VAL_001",
        message: "Validation failed",
        originalError: undefined,
        timestamp: expect.any(Number),
      });
    });

    it("should create error with different types", () => {
      const types = [
        ErrorType.NETWORK,
        ErrorType.DATABASE,
        ErrorType.WALLET,
        ErrorType.STORAGE,
        ErrorType.ENCRYPTION,
      ];

      types.forEach((type) => {
        const error = createError(type, "TEST_001", "Test error");
        expect(error.type).toBe(type);
      });
    });
  });

  describe("ErrorHandler.handleError", () => {
    it("should handle and store error", () => {
      const error = createError(
        ErrorType.AUTHENTICATION,
        "AUTH_001",
        "Authentication failed",
      );

      const consoleSpy = jest.spyOn(console, "error").mockImplementation();

      ErrorHandler.handleError(error);

      expect(consoleSpy).toHaveBeenCalledWith(
        "[AuthenticationError] AUTH_001: Authentication failed",
      );
      expect(ErrorHandler.getRecentErrors()).toContain(error);

      consoleSpy.mockRestore();
    });

    it("should not log non-essential errors", () => {
      const error = createError(
        ErrorType.VALIDATION,
        "VAL_001",
        "Validation failed",
      );

      const consoleSpy = jest.spyOn(console, "error").mockImplementation();

      ErrorHandler.handleError(error);

      expect(consoleSpy).not.toHaveBeenCalled();
      expect(ErrorHandler.getRecentErrors()).toContain(error);

      consoleSpy.mockRestore();
    });

    it("should limit stored errors to maxErrors", () => {
      const originalMaxErrors = (ErrorHandler as any).maxErrors;
      (ErrorHandler as any).maxErrors = 3;

      // Add more errors than the limit
      for (let i = 0; i < 5; i++) {
        const error = createError(
          ErrorType.AUTHENTICATION,
          `AUTH_${i}`,
          `Error ${i}`,
        );
        ErrorHandler.handleError(error);
      }

      const recentErrors = ErrorHandler.getRecentErrors();
      expect(recentErrors).toHaveLength(3);
      expect(recentErrors[0].code).toBe("AUTH_2");
      expect(recentErrors[2].code).toBe("AUTH_4");

      // Restore original maxErrors
      (ErrorHandler as any).maxErrors = originalMaxErrors;
    });

    it("should notify listeners when error is handled", () => {
      const error = createError(
        ErrorType.AUTHENTICATION,
        "AUTH_001",
        "Authentication failed",
      );

      const listener = jest.fn();
      ErrorHandler.addListener(listener);

      ErrorHandler.handleError(error);

      expect(listener).toHaveBeenCalledWith(error);

      ErrorHandler.removeListener(listener);
    });

    it("should call external logger if set", () => {
      const error = createError(
        ErrorType.AUTHENTICATION,
        "AUTH_001",
        "Authentication failed",
      );

      const externalLogger = jest.fn();
      ErrorHandler.setExternalLogger(externalLogger);

      ErrorHandler.handleError(error);

      expect(externalLogger).toHaveBeenCalledWith(error);
    });
  });

  describe("ErrorHandler.handle", () => {
    it("should create and handle error", () => {
      const originalError = new Error("Original error");
      const consoleSpy = jest.spyOn(console, "error").mockImplementation();

      const result = ErrorHandler.handle(
        ErrorType.AUTHENTICATION,
        "AUTH_001",
        "Authentication failed",
        originalError,
      );

      expect(result.type).toBe(ErrorType.AUTHENTICATION);
      expect(result.code).toBe("AUTH_001");
      expect(result.message).toBe("Authentication failed");
      expect(result.originalError).toBe(originalError);
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    it("should handle error with custom log level", () => {
      const consoleSpy = jest.spyOn(console, "error").mockImplementation();

      ErrorHandler.handle(
        ErrorType.VALIDATION,
        "VAL_001",
        "Validation failed",
        undefined,
        "warn",
      );

      expect(consoleSpy).not.toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });

  describe("ErrorHandler.handleAndThrow", () => {
    it("should handle error and throw it", () => {
      const originalError = new Error("Original error");
      const consoleSpy = jest.spyOn(console, "error").mockImplementation();

      expect(() => {
        ErrorHandler.handleAndThrow(
          ErrorType.AUTHENTICATION,
          "AUTH_001",
          "Authentication failed",
          originalError,
        );
      }).toThrow("Authentication failed");

      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });

  describe("ErrorHandler.getRecentErrors", () => {
    it("should return recent errors", () => {
      const error1 = createError(
        ErrorType.AUTHENTICATION,
        "AUTH_001",
        "Error 1",
      );
      const error2 = createError(ErrorType.VALIDATION, "VAL_001", "Error 2");

      ErrorHandler.handleError(error1);
      ErrorHandler.handleError(error2);

      const recentErrors = ErrorHandler.getRecentErrors();
      expect(recentErrors).toHaveLength(2);
      expect(recentErrors[0]).toBe(error1);
      expect(recentErrors[1]).toBe(error2);
    });

    it("should return limited number of errors", () => {
      for (let i = 0; i < 5; i++) {
        const error = createError(
          ErrorType.AUTHENTICATION,
          `AUTH_${i}`,
          `Error ${i}`,
        );
        ErrorHandler.handleError(error);
      }

      const recentErrors = ErrorHandler.getRecentErrors(3);
      expect(recentErrors).toHaveLength(3);
      expect(recentErrors[0].code).toBe("AUTH_2");
    });
  });

  describe("ErrorHandler listeners", () => {
    it("should add and remove listeners", () => {
      const listener1 = jest.fn();
      const listener2 = jest.fn();

      ErrorHandler.addListener(listener1);
      ErrorHandler.addListener(listener2);

      const error = createError(
        ErrorType.AUTHENTICATION,
        "AUTH_001",
        "Authentication failed",
      );

      ErrorHandler.handleError(error);

      expect(listener1).toHaveBeenCalledWith(error);
      expect(listener2).toHaveBeenCalledWith(error);

      ErrorHandler.removeListener(listener1);

      const error2 = createError(
        ErrorType.VALIDATION,
        "VAL_001",
        "Validation failed",
      );

      ErrorHandler.handleError(error2);

      expect(listener1).toHaveBeenCalledTimes(1);
      expect(listener2).toHaveBeenCalledTimes(2);
    });

    it("should handle listener errors gracefully", () => {
      const errorListener = jest.fn().mockImplementation(() => {
        throw new Error("Listener error");
      });

      ErrorHandler.addListener(errorListener);

      const error = createError(
        ErrorType.AUTHENTICATION,
        "AUTH_001",
        "Authentication failed",
      );

      // Should not throw error
      expect(() => ErrorHandler.handleError(error)).not.toThrow();

      ErrorHandler.removeListener(errorListener);
    });
  });

  describe("ErrorHandler.formatError", () => {
    it("should format Error objects", () => {
      const error = new Error("Test error");
      const formatted = ErrorHandler.formatError(error);

      expect(formatted).toContain("Error: Test error");
    });

    it("should format string errors", () => {
      const error = "String error";
      const formatted = ErrorHandler.formatError(error);

      expect(formatted).toBe("String error");
    });

    it("should format object errors", () => {
      const error = { message: "Object error", code: "ERR_001" };
      const formatted = ErrorHandler.formatError(error);

      expect(formatted).toContain("Object error");
      expect(formatted).toContain("ERR_001");
    });

    it("should handle unknown error types", () => {
      const error = null;
      const formatted = ErrorHandler.formatError(error);

      expect(formatted).toBe("Unknown error");
    });
  });

  describe("ErrorHandler.withRetry", () => {
    it("should retry failed operations", async () => {
      let attempts = 0;
      const failingFn = jest.fn().mockImplementation(() => {
        attempts++;
        if (attempts < 3) {
          throw new Error("Temporary failure");
        }
        return "success";
      });

      const result = await ErrorHandler.withRetry(
        failingFn,
        ErrorType.NETWORK,
        "NET_001",
        3,
        10,
      );

      expect(result).toBe("success");
      expect(failingFn).toHaveBeenCalledTimes(3);
    });

    it("should throw error after max retries", async () => {
      const failingFn = jest.fn().mockImplementation(() => {
        throw new Error("Persistent failure");
      });

      await expect(
        ErrorHandler.withRetry(failingFn, ErrorType.NETWORK, "NET_001", 2, 10),
      ).rejects.toThrow("Persistent failure");

      expect(failingFn).toHaveBeenCalledTimes(2);
    });

    it("should succeed on first attempt", async () => {
      const successFn = jest.fn().mockResolvedValue("success");

      const result = await ErrorHandler.withRetry(
        successFn,
        ErrorType.NETWORK,
        "NET_001",
      );

      expect(result).toBe("success");
      expect(successFn).toHaveBeenCalledTimes(1);
    });
  });

  describe("ErrorHandler.clearErrors", () => {
    it("should clear all stored errors", () => {
      const error1 = createError(
        ErrorType.AUTHENTICATION,
        "AUTH_001",
        "Error 1",
      );
      const error2 = createError(ErrorType.VALIDATION, "VAL_001", "Error 2");

      ErrorHandler.handleError(error1);
      ErrorHandler.handleError(error2);

      expect(ErrorHandler.getRecentErrors()).toHaveLength(2);

      ErrorHandler.clearErrors();

      expect(ErrorHandler.getRecentErrors()).toHaveLength(0);
    });
  });

  describe("ErrorHandler.getErrorStats", () => {
    it("should return error statistics", () => {
      const error1 = createError(
        ErrorType.AUTHENTICATION,
        "AUTH_001",
        "Error 1",
      );
      const error2 = createError(
        ErrorType.AUTHENTICATION,
        "AUTH_002",
        "Error 2",
      );
      const error3 = createError(ErrorType.VALIDATION, "VAL_001", "Error 3");

      ErrorHandler.handleError(error1);
      ErrorHandler.handleError(error2);
      ErrorHandler.handleError(error3);

      const stats = ErrorHandler.getErrorStats();

      expect(stats.total).toBe(3);
      expect(stats.byType[ErrorType.AUTHENTICATION]).toBe(2);
      expect(stats.byType[ErrorType.VALIDATION]).toBe(1);
      expect(stats.byCode["AUTH_001"]).toBe(1);
      expect(stats.byCode["AUTH_002"]).toBe(1);
      expect(stats.byCode["VAL_001"]).toBe(1);
    });

    it("should return empty stats when no errors", () => {
      const stats = ErrorHandler.getErrorStats();

      expect(stats.total).toBe(0);
      expect(Object.keys(stats.byType)).toHaveLength(0);
      expect(Object.keys(stats.byCode)).toHaveLength(0);
    });
  });

  describe("ErrorHandler.debug", () => {
    it("should log debug messages", () => {
      const consoleSpy = jest.spyOn(console, "log").mockImplementation();

      ErrorHandler.debug(
        ErrorType.AUTHENTICATION,
        "AUTH_001",
        "Debug message",
        "debug",
      );

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining(
          "[AuthenticationError] AUTH_001: Debug message",
        ),
      );

      consoleSpy.mockRestore();
    });

    it("should handle different log levels", () => {
      const consoleSpy = jest.spyOn(console, "warn").mockImplementation();

      ErrorHandler.debug(
        ErrorType.VALIDATION,
        "VAL_001",
        "Warning message",
        "warn",
      );

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("[ValidationError] VAL_001: Warning message"),
      );

      consoleSpy.mockRestore();
    });
  });

  describe("ErrorType enum", () => {
    it("should have all expected error types", () => {
      const expectedTypes = [
        "AUTHENTICATION",
        "AUTHORIZATION",
        "VALIDATION",
        "NETWORK",
        "DATABASE",
        "WALLET",
        "STORAGE",
        "ENCRYPTION",
        "SIGNATURE",
        "ENVIRONMENT",
        "SECURITY",
        "GUN",
        "STEALTH",
        "WEBAUTHN",
        "PLUGIN",
        "UNKNOWN",
        "CONNECTOR",
        "GENERAL",
        "CONTRACT",
        "BIP32",
        "ETHEREUM",
        "BITCOIN",
      ];

      expectedTypes.forEach((type) => {
        expect(ErrorType[type as keyof typeof ErrorType]).toBeDefined();
      });
    });
  });
});
