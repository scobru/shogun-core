import {
  ShogunEventEmitter,
  AuthEventData,
  WalletEventData,
  ErrorEventData,
  GunDataEventData,
  GunPeerEventData,
} from "../../interfaces/events";

describe("Events Types", () => {
  describe("AuthEventData Interface", () => {
    it("should allow valid auth event data", () => {
      const authData: AuthEventData = {
        userPub: "test-pub-key",
        username: "testuser",
        method: "password",
        provider: "test-provider",
      };

      expect(authData.userPub).toBe("test-pub-key");
      expect(authData.username).toBe("testuser");
      expect(authData.method).toBe("password");
      expect(authData.provider).toBe("test-provider");
    });

    it("should allow minimal auth event data", () => {
      const authData: AuthEventData = {
        method: "webauthn",
      };

      expect(authData.method).toBe("webauthn");
      expect(authData.userPub).toBeUndefined();
      expect(authData.username).toBeUndefined();
      expect(authData.provider).toBeUndefined();
    });

    it("should support all auth methods", () => {
      const methods: AuthEventData["method"][] = [
        "password",
        "webauthn",
        "web3",
        "nostr",
        "oauth",
        "bitcoin",
      ];

      methods.forEach((method) => {
        const authData: AuthEventData = { method };
        expect(authData.method).toBe(method);
      });
    });
  });

  describe("WalletEventData Interface", () => {
    it("should allow valid wallet event data", () => {
      const walletData: WalletEventData = {
        address: "0x1234567890abcdef",
        path: "m/44'/60'/0'/0/0",
      };

      expect(walletData.address).toBe("0x1234567890abcdef");
      expect(walletData.path).toBe("m/44'/60'/0'/0/0");
    });

    it("should allow wallet data without path", () => {
      const walletData: WalletEventData = {
        address: "0x1234567890abcdef",
      };

      expect(walletData.address).toBe("0x1234567890abcdef");
      expect(walletData.path).toBeUndefined();
    });
  });

  describe("ErrorEventData Interface", () => {
    it("should allow valid error event data", () => {
      const errorData: ErrorEventData = {
        action: "login",
        message: "Invalid credentials",
        type: "AuthError",
        details: { code: 401 },
      };

      expect(errorData.action).toBe("login");
      expect(errorData.message).toBe("Invalid credentials");
      expect(errorData.type).toBe("AuthError");
      expect(errorData.details).toEqual({ code: 401 });
    });

    it("should allow error data without details", () => {
      const errorData: ErrorEventData = {
        action: "signup",
        message: "User already exists",
        type: "ValidationError",
      };

      expect(errorData.action).toBe("signup");
      expect(errorData.message).toBe("User already exists");
      expect(errorData.type).toBe("ValidationError");
      expect(errorData.details).toBeUndefined();
    });
  });

  describe("GunDataEventData Interface", () => {
    it("should allow valid gun data event data", () => {
      const gunData: GunDataEventData = {
        path: "users/testuser",
        data: { name: "Test User", email: "test@example.com" },
        success: true,
        timestamp: Date.now(),
      };

      expect(gunData.path).toBe("users/testuser");
      expect(gunData.data).toEqual({
        name: "Test User",
        email: "test@example.com",
      });
      expect(gunData.success).toBe(true);
      expect(gunData.timestamp).toBeGreaterThan(0);
    });

    it("should allow gun data event with error", () => {
      const gunData: GunDataEventData = {
        path: "users/testuser",
        success: false,
        error: "Permission denied",
        timestamp: Date.now(),
      };

      expect(gunData.path).toBe("users/testuser");
      expect(gunData.success).toBe(false);
      expect(gunData.error).toBe("Permission denied");
      expect(gunData.data).toBeUndefined();
    });
  });

  describe("GunPeerEventData Interface", () => {
    it("should allow valid gun peer event data", () => {
      const peerData: GunPeerEventData = {
        peer: "https://gun-manhattan.herokuapp.com/gun",
        action: "add",
        timestamp: Date.now(),
      };

      expect(peerData.peer).toBe("https://gun-manhattan.herokuapp.com/gun");
      expect(peerData.action).toBe("add");
      expect(peerData.timestamp).toBeGreaterThan(0);
    });

    it("should support all peer actions", () => {
      const actions: GunPeerEventData["action"][] = [
        "add",
        "remove",
        "connect",
        "disconnect",
      ];

      actions.forEach((action) => {
        const peerData: GunPeerEventData = {
          peer: "https://test-peer.com/gun",
          action,
          timestamp: Date.now(),
        };
        expect(peerData.action).toBe(action);
      });
    });
  });

  describe("ShogunEventEmitter", () => {
    let eventEmitter: ShogunEventEmitter;

    beforeEach(() => {
      eventEmitter = new ShogunEventEmitter();
    });

    afterEach(() => {
      eventEmitter.removeAllListeners();
    });

    describe("auth events", () => {
      it("should emit and handle auth:login event", () => {
        const mockListener = jest.fn();
        const authData: AuthEventData = {
          userPub: "test-pub",
          username: "testuser",
          method: "password",
        };

        eventEmitter.on("auth:login", mockListener);
        const result = eventEmitter.emit("auth:login", authData);

        expect(result).toBe(true);
        expect(mockListener).toHaveBeenCalledWith(authData);
      });

      it("should emit and handle auth:logout event", () => {
        const mockListener = jest.fn();

        eventEmitter.on("auth:logout", mockListener);
        const result = eventEmitter.emit("auth:logout");

        expect(result).toBe(true);
        expect(mockListener).toHaveBeenCalled();
      });

      it("should emit and handle auth:signup event", () => {
        const mockListener = jest.fn();
        const authData: AuthEventData = {
          userPub: "new-pub",
          username: "newuser",
          method: "oauth",
          provider: "google",
        };

        eventEmitter.on("auth:signup", mockListener);
        const result = eventEmitter.emit("auth:signup", authData);

        expect(result).toBe(true);
        expect(mockListener).toHaveBeenCalledWith(authData);
      });

      it("should emit and handle auth:username_changed event", () => {
        const mockListener = jest.fn();
        const usernameData = {
          oldUsername: "olduser",
          newUsername: "newuser",
          userPub: "test-pub",
        };

        eventEmitter.on("auth:username_changed", mockListener);
        const result = eventEmitter.emit("auth:username_changed", usernameData);

        expect(result).toBe(true);
        expect(mockListener).toHaveBeenCalledWith(usernameData);
      });
    });

    describe("wallet events", () => {
      it("should emit and handle wallet:created event", () => {
        const mockListener = jest.fn();
        const walletData: WalletEventData = {
          address: "0x1234567890abcdef",
          path: "m/44'/60'/0'/0/0",
        };

        eventEmitter.on("wallet:created", mockListener);
        const result = eventEmitter.emit("wallet:created", walletData);

        expect(result).toBe(true);
        expect(mockListener).toHaveBeenCalledWith(walletData);
      });
    });

    describe("gun events", () => {
      it("should emit and handle gun:put event", () => {
        const mockListener = jest.fn();
        const gunData: GunDataEventData = {
          path: "users/testuser",
          data: { name: "Test User" },
          success: true,
          timestamp: Date.now(),
        };

        eventEmitter.on("gun:put", mockListener);
        const result = eventEmitter.emit("gun:put", gunData);

        expect(result).toBe(true);
        expect(mockListener).toHaveBeenCalledWith(gunData);
      });

      it("should emit and handle gun:get event", () => {
        const mockListener = jest.fn();
        const gunData: GunDataEventData = {
          path: "users/testuser",
          success: true,
          timestamp: Date.now(),
        };

        eventEmitter.on("gun:get", mockListener);
        const result = eventEmitter.emit("gun:get", gunData);

        expect(result).toBe(true);
        expect(mockListener).toHaveBeenCalledWith(gunData);
      });

      it("should emit and handle gun:set event", () => {
        const mockListener = jest.fn();
        const gunData: GunDataEventData = {
          path: "users/testuser",
          data: { email: "test@example.com" },
          success: true,
          timestamp: Date.now(),
        };

        eventEmitter.on("gun:set", mockListener);
        const result = eventEmitter.emit("gun:set", gunData);

        expect(result).toBe(true);
        expect(mockListener).toHaveBeenCalledWith(gunData);
      });

      it("should emit and handle gun:remove event", () => {
        const mockListener = jest.fn();
        const gunData: GunDataEventData = {
          path: "users/testuser",
          success: true,
          timestamp: Date.now(),
        };

        eventEmitter.on("gun:remove", mockListener);
        const result = eventEmitter.emit("gun:remove", gunData);

        expect(result).toBe(true);
        expect(mockListener).toHaveBeenCalledWith(gunData);
      });
    });

    describe("gun peer events", () => {
      it("should emit and handle gun:peer:add event", () => {
        const mockListener = jest.fn();
        const peerData: GunPeerEventData = {
          peer: "https://test-peer.com/gun",
          action: "add",
          timestamp: Date.now(),
        };

        eventEmitter.on("gun:peer:add", mockListener);
        const result = eventEmitter.emit("gun:peer:add", peerData);

        expect(result).toBe(true);
        expect(mockListener).toHaveBeenCalledWith(peerData);
      });

      it("should emit and handle gun:peer:remove event", () => {
        const mockListener = jest.fn();
        const peerData: GunPeerEventData = {
          peer: "https://test-peer.com/gun",
          action: "remove",
          timestamp: Date.now(),
        };

        eventEmitter.on("gun:peer:remove", mockListener);
        const result = eventEmitter.emit("gun:peer:remove", peerData);

        expect(result).toBe(true);
        expect(mockListener).toHaveBeenCalledWith(peerData);
      });

      it("should emit and handle gun:peer:connect event", () => {
        const mockListener = jest.fn();
        const peerData: GunPeerEventData = {
          peer: "https://test-peer.com/gun",
          action: "connect",
          timestamp: Date.now(),
        };

        eventEmitter.on("gun:peer:connect", mockListener);
        const result = eventEmitter.emit("gun:peer:connect", peerData);

        expect(result).toBe(true);
        expect(mockListener).toHaveBeenCalledWith(peerData);
      });

      it("should emit and handle gun:peer:disconnect event", () => {
        const mockListener = jest.fn();
        const peerData: GunPeerEventData = {
          peer: "https://test-peer.com/gun",
          action: "disconnect",
          timestamp: Date.now(),
        };

        eventEmitter.on("gun:peer:disconnect", mockListener);
        const result = eventEmitter.emit("gun:peer:disconnect", peerData);

        expect(result).toBe(true);
        expect(mockListener).toHaveBeenCalledWith(peerData);
      });
    });

    describe("plugin events", () => {
      it("should emit and handle plugin:registered event", () => {
        const mockListener = jest.fn();
        const pluginData = {
          name: "test-plugin",
          version: "1.0.0",
          category: "authentication",
        };

        eventEmitter.on("plugin:registered", mockListener);
        const result = eventEmitter.emit("plugin:registered", pluginData);

        expect(result).toBe(true);
        expect(mockListener).toHaveBeenCalledWith(pluginData);
      });

      it("should emit and handle plugin:unregistered event", () => {
        const mockListener = jest.fn();
        const pluginData = {
          name: "test-plugin",
        };

        eventEmitter.on("plugin:unregistered", mockListener);
        const result = eventEmitter.emit("plugin:unregistered", pluginData);

        expect(result).toBe(true);
        expect(mockListener).toHaveBeenCalledWith(pluginData);
      });
    });

    describe("debug and error events", () => {
      it("should emit and handle debug event", () => {
        const mockListener = jest.fn();
        const debugData = {
          action: "test-action",
          data: "test-data",
          timestamp: Date.now(),
        };

        eventEmitter.on("debug", mockListener);
        const result = eventEmitter.emit("debug", debugData);

        expect(result).toBe(true);
        expect(mockListener).toHaveBeenCalledWith(debugData);
      });

      it("should emit and handle error event", () => {
        const mockListener = jest.fn();
        const errorData: ErrorEventData = {
          action: "login",
          message: "Authentication failed",
          type: "AuthError",
          details: { code: 401 },
        };

        eventEmitter.on("error", mockListener);
        const result = eventEmitter.emit("error", errorData);

        expect(result).toBe(true);
        expect(mockListener).toHaveBeenCalledWith(errorData);
      });
    });

    describe("event listener management", () => {
      it("should remove listeners correctly", () => {
        const mockListener = jest.fn();
        const authData: AuthEventData = {
          method: "password",
          username: "testuser",
        };

        eventEmitter.on("auth:login", mockListener);
        eventEmitter.emit("auth:login", authData);
        expect(mockListener).toHaveBeenCalledTimes(1);

        eventEmitter.off("auth:login", mockListener);
        eventEmitter.emit("auth:login", authData);
        expect(mockListener).toHaveBeenCalledTimes(1); // Should not be called again
      });

      it("should return false when no listeners are attached", () => {
        const authData: AuthEventData = {
          method: "password",
        };

        const result = eventEmitter.emit("auth:login", authData);
        expect(result).toBe(false);
      });

      it("should handle multiple listeners", () => {
        const mockListener1 = jest.fn();
        const mockListener2 = jest.fn();
        const authData: AuthEventData = {
          method: "webauthn",
        };

        eventEmitter.on("auth:login", mockListener1);
        eventEmitter.on("auth:login", mockListener2);

        const result = eventEmitter.emit("auth:login", authData);

        expect(result).toBe(true);
        expect(mockListener1).toHaveBeenCalledWith(authData);
        expect(mockListener2).toHaveBeenCalledWith(authData);
      });
    });
  });
});
