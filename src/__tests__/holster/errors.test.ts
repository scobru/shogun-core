import {
  HolsterError,
  AuthError,
  InvalidCredentials,
  UserExists,
  TimeoutError,
  MultipleAuthError,
  NetworkError,
} from "../../holster/errors";

describe("Error Classes", () => {
  describe("HolsterError", () => {
    it("should create HolsterError with custom message", () => {
      const error = new HolsterError("Custom holster error");

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(HolsterError);
      expect(error.name).toBe("HolsterError");
      expect(error.message).toBe("Custom holster error");
    });

    it("should create HolsterError with empty message", () => {
      const error = new HolsterError("");

      expect(error.name).toBe("HolsterError");
      expect(error.message).toBe("");
    });
  });

  describe("AuthError", () => {
    it("should create AuthError with custom message", () => {
      const error = new AuthError("Custom auth error");

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(HolsterError);
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
      expect(error).toBeInstanceOf(HolsterError);
      expect(error).toBeInstanceOf(AuthError);
      expect(error).toBeInstanceOf(InvalidCredentials);
      expect(error.name).toBe("InvalidCredentials");
      expect(error.message).toBe("Credenziali non valide");
    });

    it("should create InvalidCredentials with custom message", () => {
      const error = new InvalidCredentials(
        "Custom invalid credentials message",
      );

      expect(error.name).toBe("InvalidCredentials");
      expect(error.message).toBe("Custom invalid credentials message");
    });
  });

  describe("UserExists", () => {
    it("should create UserExists with default message", () => {
      const error = new UserExists();

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(HolsterError);
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
      expect(error).toBeInstanceOf(HolsterError);
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
      expect(error).toBeInstanceOf(HolsterError);
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
      expect(error).toBeInstanceOf(HolsterError);
      expect(error).toBeInstanceOf(NetworkError);
      expect(error.name).toBe("HolsterError"); // Inherits from HolsterError
      expect(error.message).toBe("Custom network error");
    });

    it("should create NetworkError with empty message", () => {
      const error = new NetworkError("");

      expect(error.name).toBe("HolsterError");
      expect(error.message).toBe("");
    });
  });

  describe("Error inheritance chain", () => {
    it("should maintain proper inheritance hierarchy", () => {
      const holsterError = new HolsterError("holster");
      const authError = new AuthError("auth");
      const invalidCreds = new InvalidCredentials();
      const userExists = new UserExists();
      const timeoutError = new TimeoutError();
      const multipleAuth = new MultipleAuthError();
      const networkError = new NetworkError("network");

      // Verifica che tutti gli errori siano istanze di Error
      expect(holsterError).toBeInstanceOf(Error);
      expect(authError).toBeInstanceOf(Error);
      expect(invalidCreds).toBeInstanceOf(Error);
      expect(userExists).toBeInstanceOf(Error);
      expect(timeoutError).toBeInstanceOf(Error);
      expect(multipleAuth).toBeInstanceOf(Error);
      expect(networkError).toBeInstanceOf(Error);

      // Verifica che tutti gli errori siano istanze di HolsterError
      expect(holsterError).toBeInstanceOf(HolsterError);
      expect(authError).toBeInstanceOf(HolsterError);
      expect(invalidCreds).toBeInstanceOf(HolsterError);
      expect(userExists).toBeInstanceOf(HolsterError);
      expect(timeoutError).toBeInstanceOf(HolsterError);
      expect(multipleAuth).toBeInstanceOf(HolsterError);
      expect(networkError).toBeInstanceOf(HolsterError);

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
      const holsterError = new HolsterError("test");
      const authError = new AuthError("test");
      const invalidCreds = new InvalidCredentials();

      expect(holsterError.stack).toBeDefined();
      expect(authError.stack).toBeDefined();
      expect(invalidCreds.stack).toBeDefined();
    });
  });

  describe("Error message handling", () => {
    it("should handle various message types", () => {
      const stringMessage = new HolsterError("string message");
      const emptyMessage = new HolsterError("");
      const numberMessage = new HolsterError(123 as any);
      const objectMessage = new HolsterError({ key: "value" } as any);

      expect(stringMessage.message).toBe("string message");
      expect(emptyMessage.message).toBe("");
      expect(numberMessage.message).toBe("123");
      expect(objectMessage.message).toBe("[object Object]");
    });
  });
});
