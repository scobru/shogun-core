import {
  GunError,
  AuthError,
  InvalidCredentials,
  UserExists,
  TimeoutError,
  MultipleAuthError,
  NetworkError,
} from "../../gundb/errors";

describe("Error Classes", () => {
  describe("GunError", () => {
    it("should create GunError with custom message", () => {
      const error = new GunError("Custom gun error");

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(GunError);
      expect(error.name).toBe("GunError");
      expect(error.message).toBe("Custom gun error");
    });

    it("should create GunError with empty message", () => {
      const error = new GunError("");

      expect(error.name).toBe("GunError");
      expect(error.message).toBe("");
    });
  });

  describe("AuthError", () => {
    it("should create AuthError with custom message", () => {
      const error = new AuthError("Custom auth error");

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(GunError);
      expect(error).toBeInstanceOf(AuthError);
      expect(error.name).toBe("AuthError");
      expect(error.message).toBe("Custom auth error");
    });

    it("should create AuthError with empty message", () => {
      const error = new AuthError("");

      expect(error.name).toBe("AuthError");
      expect(error.message).toBe("");
    });
  });

  describe("InvalidCredentials", () => {
    it("should create InvalidCredentials with default message", () => {
      const error = new InvalidCredentials();

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(GunError);
      expect(error).toBeInstanceOf(AuthError);
      expect(error).toBeInstanceOf(InvalidCredentials);
      expect(error.name).toBe("InvalidCredentials");
      expect(error.message).toBe("Credenziali non valide");
    });

    it("should create InvalidCredentials with custom message", () => {
      const error = new InvalidCredentials(
        "Custom invalid credentials message"
      );

      expect(error.name).toBe("InvalidCredentials");
      expect(error.message).toBe("Custom invalid credentials message");
    });
  });

  describe("UserExists", () => {
    it("should create UserExists with default message", () => {
      const error = new UserExists();

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(GunError);
      expect(error).toBeInstanceOf(AuthError);
      expect(error).toBeInstanceOf(UserExists);
      expect(error.name).toBe("UserExists");
      expect(error.message).toBe("Utente già esistente");
    });

    it("should create UserExists with custom message", () => {
      const error = new UserExists("Custom user exists message");

      expect(error.name).toBe("UserExists");
      expect(error.message).toBe("Custom user exists message");
    });
  });

  describe("TimeoutError", () => {
    it("should create TimeoutError with default message", () => {
      const error = new TimeoutError();

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(GunError);
      expect(error).toBeInstanceOf(TimeoutError);
      expect(error.name).toBe("TimeoutError");
      expect(error.message).toBe("Timeout durante l'operazione");
    });

    it("should create TimeoutError with custom message", () => {
      const error = new TimeoutError("Custom timeout message");

      expect(error.name).toBe("TimeoutError");
      expect(error.message).toBe("Custom timeout message");
    });
  });

  describe("MultipleAuthError", () => {
    it("should create MultipleAuthError with default message", () => {
      const error = new MultipleAuthError();

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(GunError);
      expect(error).toBeInstanceOf(AuthError);
      expect(error).toBeInstanceOf(MultipleAuthError);
      expect(error.name).toBe("MultipleAuthError");
      expect(error.message).toBe("Autenticazione multipla in corso");
    });

    it("should create MultipleAuthError with custom message", () => {
      const error = new MultipleAuthError("Custom multiple auth message");

      expect(error.name).toBe("MultipleAuthError");
      expect(error.message).toBe("Custom multiple auth message");
    });
  });

  describe("NetworkError", () => {
    it("should create NetworkError with custom message", () => {
      const error = new NetworkError("Custom network error");

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(GunError);
      expect(error).toBeInstanceOf(NetworkError);
      expect(error.name).toBe("GunError"); // Inherits from GunError
      expect(error.message).toBe("Custom network error");
    });

    it("should create NetworkError with empty message", () => {
      const error = new NetworkError("");

      expect(error.name).toBe("GunError");
      expect(error.message).toBe("");
    });
  });

  describe("Error inheritance chain", () => {
    it("should maintain proper inheritance hierarchy", () => {
      const gunError = new GunError("gun");
      const authError = new AuthError("auth");
      const invalidCreds = new InvalidCredentials();
      const userExists = new UserExists();
      const timeoutError = new TimeoutError();
      const multipleAuth = new MultipleAuthError();
      const networkError = new NetworkError("network");

      // Verifica che tutti gli errori siano istanze di Error
      expect(gunError).toBeInstanceOf(Error);
      expect(authError).toBeInstanceOf(Error);
      expect(invalidCreds).toBeInstanceOf(Error);
      expect(userExists).toBeInstanceOf(Error);
      expect(timeoutError).toBeInstanceOf(Error);
      expect(multipleAuth).toBeInstanceOf(Error);
      expect(networkError).toBeInstanceOf(Error);

      // Verifica che tutti gli errori siano istanze di GunError
      expect(gunError).toBeInstanceOf(GunError);
      expect(authError).toBeInstanceOf(GunError);
      expect(invalidCreds).toBeInstanceOf(GunError);
      expect(userExists).toBeInstanceOf(GunError);
      expect(timeoutError).toBeInstanceOf(GunError);
      expect(multipleAuth).toBeInstanceOf(GunError);
      expect(networkError).toBeInstanceOf(GunError);

      // Verifica che gli errori di autenticazione siano istanze di AuthError
      expect(authError).toBeInstanceOf(AuthError);
      expect(invalidCreds).toBeInstanceOf(AuthError);
      expect(userExists).toBeInstanceOf(AuthError);
      expect(multipleAuth).toBeInstanceOf(AuthError);

      // Verifica che gli errori specifici siano istanze delle loro classi
      expect(invalidCreds).toBeInstanceOf(InvalidCredentials);
      expect(userExists).toBeInstanceOf(UserExists);
      expect(timeoutError).toBeInstanceOf(TimeoutError);
      expect(multipleAuth).toBeInstanceOf(MultipleAuthError);
      expect(networkError).toBeInstanceOf(NetworkError);
    });
  });

  describe("Error stack traces", () => {
    it("should have stack traces", () => {
      const gunError = new GunError("test");
      const authError = new AuthError("test");
      const invalidCreds = new InvalidCredentials();

      expect(gunError.stack).toBeDefined();
      expect(authError.stack).toBeDefined();
      expect(invalidCreds.stack).toBeDefined();
    });
  });

  describe("Error message handling", () => {
    it("should handle various message types", () => {
      const stringMessage = new GunError("string message");
      const emptyMessage = new GunError("");
      const numberMessage = new GunError(123 as any);
      const objectMessage = new GunError({ key: "value" } as any);

      expect(stringMessage.message).toBe("string message");
      expect(emptyMessage.message).toBe("");
      expect(numberMessage.message).toBe("123");
      expect(objectMessage.message).toBe("[object Object]");
    });
  });
});
