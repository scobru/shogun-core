import { ShogunCore } from "../../index";
import { CorePlugins, ShogunSDKConfig } from "../../types/shogun";
import { OAuthPlugin } from "../../plugins/oauth/oauthPlugin";
import { Web3ConnectorPlugin } from "../../plugins/web3/web3ConnectorPlugin";
import { NostrConnectorPlugin } from "../../plugins/nostr/nostrConnectorPlugin";

// Mock delle dipendenze di GunDB per evitare side-effects e ambiente browser
jest.mock("../../gundb", () => {
  const originalGundb = jest.requireActual("../../gundb");
  return {
    ...originalGundb,
    Gun: jest.fn(() => ({
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
          recall: jest.fn(),
        })),
        on: jest.fn(),
      },
      on: jest.fn(),
      isLoggedIn: jest.fn().mockReturnValue(false),
      logout: jest.fn(),
      login: jest.fn().mockResolvedValue({ success: true, userPub: "pub" }),
      loginWithPair: jest.fn(),
      signUp: jest.fn().mockResolvedValue({ success: true, userPub: "pub" }),
      updateUserAlias: jest.fn(),
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

// Mock dei connector dei plugin per evitare dipendenze reali (OAuth/Web3/Nostr)
jest.mock("../../plugins/oauth/oauthConnector", () => {
  return {
    OAuthConnector: class MockOAuthConnector {
      private cfg: any;
      constructor(cfg?: any) {
        this.cfg = cfg || {};
      }
      updateConfig(cfg: any) {
        this.cfg = { ...this.cfg, ...cfg };
      }
      isSupported() {
        return true;
      }
      getAvailableProviders() {
        return ["google", "github"];
      }
      async initiateOAuth(provider: string) {
        return { success: true, authUrl: `https://auth.example/${provider}` };
      }
      async completeOAuth(provider: string, code: string, state?: string) {
        return {
          success: true,
          userInfo: {
            id: "123",
            email: "user@example.com",
            name: "Test User",
            picture: "https://example.com/pic.png",
          },
        };
      }
      async generateCredentials(userInfo: any, provider: string) {
        return {
          username: `${provider}:${userInfo.email}`,
          key: { pub: "pub", priv: "priv", epub: "epub", epriv: "epriv" },
        };
      }
      cleanup() {}
      clearUserCache() {}
    },
  };
});

jest.mock("../../plugins/web3/web3Connector", () => {
  return {
    Web3Connector: class MockWeb3Connector {
      isAvailable() {
        return true;
      }
      async connectMetaMask() {
        return { success: true, address: "0xabc" };
      }
      async generateCredentials(_address: string) {
        return { pub: "pub", priv: "priv", epub: "epub", epriv: "epriv" };
      }
      cleanup() {}
      setCustomProvider() {}
      async getSigner() {
        return {} as any;
      }
      async getProvider() {
        return {} as any;
      }
      async generatePassword(_signature: string) {
        return "password";
      }
      async verifySignature(_message: string, _signature: string) {
        return "0xabc";
      }
    },
  };
});

jest.mock("../../plugins/nostr/nostrConnector", () => {
  return {
    MESSAGE_TO_SIGN: "Please sign to authenticate",
    deriveNostrKeys: async () => ({
      pub: "pub",
      priv: "priv",
      epub: "epub",
      epriv: "epriv",
    }),
    NostrConnector: class MockNostrConnector {
      isAvailable() {
        return true;
      }
      isNostrExtensionAvailable() {
        return true;
      }
      async connectWallet(_type: string) {
        return { success: true, address: "npub123" };
      }
      async requestSignature(_address: string, _message: string) {
        return "signature";
      }
      async generateCredentials(address: string, signature: string, message: string) {
        return {
          username: address,
          key: { pub: "pub", priv: "priv", epub: "epub", epriv: "epriv" },
          message,
          signature,
        };
      }
      verifySignature() {
        return true;
      }
      generatePassword() {
        return "password";
      }
      cleanup() {}
      clearSignatureCache() {}
    },
  };
});

describe("Plugin system and plugin functionality", () => {
  let config: ShogunSDKConfig;
  let core: ShogunCore;

  beforeEach(() => {
    config = {
      oauth: { enabled: true, providers: { google: { clientId: "id", usePKCE: true } } },
      webauthn: { enabled: true },
      web3: { enabled: true },
      nostr: { enabled: true },
      peers: ["http://localhost:8765/gun"],
    } as any;
    core = new ShogunCore(config);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("registers built-in plugins when config provided", () => {
    expect(core.hasPlugin(CorePlugins.OAuth)).toBe(true);
    expect(core.hasPlugin(CorePlugins.WebAuthn)).toBe(true);
    expect(core.hasPlugin(CorePlugins.Web3)).toBe(true);
    expect(core.hasPlugin(CorePlugins.Nostr)).toBe(true);
  });

  it("getPlugin returns correct instances", () => {
    const oauth = core.getPlugin<OAuthPlugin>(CorePlugins.OAuth);
    const web3 = core.getPlugin<Web3ConnectorPlugin>(CorePlugins.Web3);
    const nostr = core.getPlugin<NostrConnectorPlugin>(CorePlugins.Nostr);

    expect(oauth?.name).toBe("oauth");
    expect(web3?.name).toBe("web3");
    expect(nostr?.name).toBe("nostr");
  });

  it("OAuthPlugin login returns redirect flow (pendingAuth)", async () => {
    const oauth = core.getPlugin<OAuthPlugin>(CorePlugins.OAuth)!;
    const result = await oauth.login("google" as any);
    expect(result.success).toBe(true);
    expect(result.pendingAuth).toBe(true);
    expect(typeof result.redirectUrl).toBe("string");
    expect(result.provider).toBe("google");
  });

  it("Web3 plugin exposes availability and connection", async () => {
    const web3 = core.getPlugin<Web3ConnectorPlugin>(CorePlugins.Web3)!;
    expect(web3.isAvailable()).toBe(true);
    const conn = await web3.connectMetaMask();
    expect(conn.success).toBe(true);
  });

  it("Nostr plugin can connect via extension", async () => {
    const nostr = core.getPlugin<NostrConnectorPlugin>(CorePlugins.Nostr)!;
    expect(nostr.isNostrExtensionAvailable()).toBe(true);
    const res = await nostr.connectNostrWallet();
    expect(res.success).toBe(true);
  });

  it("WebAuthn plugin reports unsupported in Node env", () => {
    // In ambiente Node non esiste window, quindi non supportato
    // L'inizializzazione non deve lanciare errori e isSupported deve essere false
    const webauthn = core.getPlugin<any>(CorePlugins.WebAuthn)!;
    expect(webauthn.isSupported()).toBe(false);
  });

  it("unregister destroys plugin and removes it", async () => {
    const oauth = core.getPlugin<OAuthPlugin>(CorePlugins.OAuth)!;
    const destroyedSpy = jest.fn();
    oauth.on("destroyed", destroyedSpy);

    core.unregister(CorePlugins.OAuth);
    expect(core.hasPlugin(CorePlugins.OAuth)).toBe(false);
    // L'evento è sincrono, ma lasciamo un microtask per sicurezza
    await Promise.resolve();
    expect(destroyedSpy).toHaveBeenCalledTimes(1);
  });

  it("reports initialization status for registered plugins", () => {
    const status = core.getPluginsInitializationStatus();
    // I plugin registrati devono comparire nello status
    expect(status[CorePlugins.OAuth]?.initialized).toBe(true);
    expect(status[CorePlugins.Web3]?.initialized).toBe(true);
    expect(status[CorePlugins.Nostr]?.initialized).toBe(true);
    // WebAuthn è inizializzato a livello di core reference anche se in Node non attiva moduli
    expect(status[CorePlugins.WebAuthn]?.initialized).toBe(true);
  });

  it("getAuthenticationMethod returns plugin-backed handlers", () => {
    const oauthMethod = core.getAuthenticationMethod("oauth");
    const web3Method = core.getAuthenticationMethod("web3");
    const nostrMethod = core.getAuthenticationMethod("nostr");
    expect((oauthMethod as any)?.name).toBe("oauth");
    expect((web3Method as any)?.name).toBe("web3");
    expect((nostrMethod as any)?.name).toBe("nostr");
  });
});
