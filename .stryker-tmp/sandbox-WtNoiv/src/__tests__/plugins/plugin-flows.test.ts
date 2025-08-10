// @ts-nocheck
import { ShogunCore } from "../../index";
import { CorePlugins, ShogunSDKConfig } from "../../types/shogun";
import { OAuthPlugin } from "../../plugins/oauth/oauthPlugin";
import { Web3ConnectorPlugin } from "../../plugins/web3/web3ConnectorPlugin";
import { NostrConnectorPlugin } from "../../plugins/nostr/nostrConnectorPlugin";

// Mock GunDB layer with user recall returning an object supporting put()
jest.mock("../../gundb", () => {
  const originalGundb = jest.requireActual("../../gundb");
  return {
    ...originalGundb,
    Gun: jest.fn(() => ({
      user: jest.fn(() => ({
        recall: jest.fn(() => ({
          put: jest.fn(),
          _: { sea: { pub: "pub", priv: "priv", epub: "epub", epriv: "epriv" } },
        })),
        create: jest.fn(),
        auth: jest.fn(),
        leave: jest.fn(),
        get: jest.fn(),
        put: jest.fn(),
        on: jest.fn(),
        once: jest.fn(),
        off: jest.fn(),
      })),
      get: jest.fn(() => ({
        map: jest.fn(),
        once: jest.fn(),
        put: jest.fn(),
        on: jest.fn(),
        off: jest.fn(),
      })),
      on: jest.fn(),
      once: jest.fn(),
      off: jest.fn(),
    })),
    GunInstance: jest.fn().mockImplementation(() => ({
      gun: {
        user: jest.fn(() => ({
          recall: jest.fn(() => ({ put: jest.fn(), _: { sea: { pub: "pub" } } })),
        })),
        on: jest.fn(),
      },
      on: jest.fn(),
      isLoggedIn: jest.fn().mockReturnValue(false),
      logout: jest.fn(),
      login: jest.fn().mockResolvedValue({ success: true, userPub: "pub" }),
      loginWithPair: jest.fn(),
      signUp: jest.fn().mockResolvedValue({ success: true, userPub: "pub" }),
      updateUserAlias: jest.fn().mockResolvedValue({ success: true }),
      clearGunStorage: jest.fn(),
      initialize: jest.fn(),
      getCurrentUser: jest.fn().mockReturnValue({ pub: "pub" }),
    })),
    SEA: {
      pair: jest.fn(),
      sign: jest.fn(),
      verify: jest.fn(),
      encrypt: jest.fn(),
      decrypt: jest.fn(),
      secret: jest.fn(),
    },
    restrictedPut: jest.fn(),
  };
});

// OAuth connector mock with full flow
jest.mock("../../plugins/oauth/oauthConnector", () => {
  return {
    OAuthConnector: class MockOAuthConnector {
      private cfg: any;
      private cache: Record<string, any> = {};
      constructor(cfg?: any) { this.cfg = cfg || {}; }
      updateConfig(cfg: any) { this.cfg = { ...this.cfg, ...cfg }; }
      isSupported() { return true; }
      getAvailableProviders() { return ["google", "github"]; }
      async initiateOAuth(provider: string) {
        return { success: true, authUrl: `https://auth.example/${provider}` };
      }
      async completeOAuth(provider: string, code: string, state?: string) {
        const userInfo = { id: "123", email: "user@example.com", name: "Test User", picture: "https://example.com/pic.png" };
        this.cache[`${provider}:123`] = userInfo;
        return { success: true, userInfo };
      }
      async generateCredentials(userInfo: any, provider: string) {
        return { username: `${provider}:${userInfo.email}`, key: { pub: "pub", priv: "priv", epub: "epub", epriv: "epriv" } };
      }
      getCachedUserInfo(userId: string, provider: string) { return this.cache[`${provider}:${userId}`] || null; }
      clearUserCache() { this.cache = {}; }
      cleanup() {}
    },
  };
});

// Web3 connector mock
jest.mock("../../plugins/web3/web3Connector", () => {
  return {
    Web3Connector: class MockWeb3Connector {
      isAvailable() { return true; }
      async connectMetaMask() { return { success: true, address: "0xabc" }; }
      async generateCredentials(_address: string) { return { pub: "pub", priv: "priv", epub: "epub", epriv: "epriv" }; }
      cleanup() {}
      setCustomProvider() {}
      async getSigner() { return {} as any; }
      async getProvider() { return {} as any; }
      async generatePassword(_signature: string) { return "password"; }
      async verifySignature(_message: string, _signature: string) { return "0xabc"; }
    },
  };
});

// Nostr connector mock
jest.mock("../../plugins/nostr/nostrConnector", () => {
  return {
    MESSAGE_TO_SIGN: "Please sign to authenticate",
    deriveNostrKeys: async () => ({ pub: "pub", priv: "priv", epub: "epub", epriv: "epriv" }),
    NostrConnector: class MockNostrConnector {
      isAvailable() { return true; }
      isNostrExtensionAvailable() { return true; }
      async connectWallet(_type: string) { return { success: true, address: "npub123" }; }
      async requestSignature(_address: string, _message: string) { return "signature"; }
      async generateCredentials(address: string, signature: string, message: string) {
        return { username: address, key: { pub: "pub", priv: "priv", epub: "epub", epriv: "epriv" }, message, signature };
      }
      verifySignature() { return true; }
      generatePassword() { return "password"; }
      cleanup() {}
      clearSignatureCache() {}
    },
  };
});

// WebAuthn mocks
jest.mock("../../plugins/webauthn/webauthn", () => {
  return {
    Webauthn: class MockWebauthn {
      constructor(_gun: any) {}
      isSupported() { return true; }
      async generateCredentials(_username: string) { return { success: true, key: { pub: "pub", priv: "priv", epub: "epub", epriv: "epriv" } }; }
      async createAccount() { return { success: true }; }
      async authenticateUser() { return { success: true }; }
      abortAuthentication() {}
      async removeDevice() { return { success: true, updatedCredentials: {} as any }; }
    },
  };
});

jest.mock("../../plugins/webauthn/webauthnSigner", () => {
  return {
    WebAuthnSigner: class MockWebAuthnSigner {
      constructor(_webauthn: any) {}
      async createSigningCredential(_username: string) { return { id: "id", pub: "pub", hashedCredentialId: "hid" } as any; }
      createAuthenticator(_id: string) { return async (_data: any) => ({} as any); }
      async createDerivedKeyPair() { return { pub: "pub", priv: "priv", epub: "epub", epriv: "epriv" }; }
      async signWithDerivedKeys() { return "signature"; }
      getCredential() { return undefined; }
      listCredentials() { return []; }
      removeCredential() { return true; }
      async createGunUser() { return { success: true, userPub: "pub" }; }
      getGunUserPub() { return "pub"; }
      getHashedCredentialId() { return "hid"; }
      async verifyConsistency() { return { consistent: true, actualUserPub: "pub", expectedUserPub: "pub" }; }
    },
  };
});

// Tests
describe("Plugin end-to-end flows", () => {
  let config: ShogunSDKConfig;
  let core: ShogunCore;
  const originalWindow = global.window as any;

  beforeEach(() => {
    config = {
      oauth: { enabled: true, providers: { google: { clientId: "id", usePKCE: true } } },
      webauthn: { enabled: true },
      web3: { enabled: true },
      nostr: { enabled: true },
      peers: ["http://localhost:8765/gun"],
    } as any;
    // Simula ambiente browser per WebAuthn
    (global as any).window = { PublicKeyCredential: function () {} } as any;
    core = new ShogunCore(config);
  });

  afterEach(() => {
    jest.clearAllMocks();
    // Ripristina window
    (global as any).window = originalWindow;
  });

  it("OAuth handleOAuthCallback completes login and enriches user", async () => {
    const oauth = core.getPlugin<OAuthPlugin>(CorePlugins.OAuth)!;
    const res = await oauth.handleOAuthCallback("google" as any, "code", "state");
    expect(res.success).toBe(true);
    expect(res.user?.oauth?.provider).toBe("google");
  });

  it("Web3 login emits auth:login and succeeds", async () => {
    const loginSpy = jest.fn();
    core.on("auth:login", loginSpy as any);
    const web3 = core.getPlugin<Web3ConnectorPlugin>(CorePlugins.Web3)!;
    const res = await web3.login("0xAbC");
    expect(res.success).toBe(true);
    expect(loginSpy).toHaveBeenCalled();
    const evt = (loginSpy.mock.calls[0] || [])[0];
    expect(evt?.method).toBe("web3");
  });

  it("Web3 signUp succeeds", async () => {
    const web3 = core.getPlugin<Web3ConnectorPlugin>(CorePlugins.Web3)!;
    const res = await web3.signUp("0xabc");
    expect(res.success).toBe(true);
  });

  it("Nostr login emits auth:login and succeeds", async () => {
    const loginSpy = jest.fn();
    core.on("auth:login", loginSpy as any);
    const nostr = core.getPlugin<NostrConnectorPlugin>(CorePlugins.Nostr)!;
    const res = await nostr.login("npub123");
    expect(res.success).toBe(true);
    expect(loginSpy).toHaveBeenCalled();
    const methods = loginSpy.mock.calls.map((c: any[]) => c[0]?.method);
    // Core emette con "nostr", il plugin può emettere anche "bitcoin"
    expect(methods).toEqual(expect.arrayContaining(["nostr"]));
  });

  it("Nostr signUp emits auth:signup and succeeds", async () => {
    const signupSpy = jest.fn();
    core.on("auth:signup", signupSpy as any);
    const nostr = core.getPlugin<NostrConnectorPlugin>(CorePlugins.Nostr)!;
    const res = await nostr.signUp("npub123");
    expect(res.success).toBe(true);
    expect(signupSpy).toHaveBeenCalled();
    const methods = signupSpy.mock.calls.map((c: any[]) => c[0]?.method);
    // Core può emettere "web3" (per pair), il plugin emette "bitcoin": accetta uno dei due
    expect(methods.some((m: string) => m === "bitcoin" || m === "web3")).toBe(true);
  });

  it("WebAuthn login succeeds with browser support mocked", async () => {
    const webauthn = core.getPlugin<any>(CorePlugins.WebAuthn)!;
    const res = await webauthn.login("user1");
    expect(res.success).toBe(true);
  });

  it("WebAuthn signUp succeeds with browser support mocked", async () => {
    const webauthn = core.getPlugin<any>(CorePlugins.WebAuthn)!;
    const res = await webauthn.signUp("user2");
    expect(res.success).toBe(true);
  });
});
