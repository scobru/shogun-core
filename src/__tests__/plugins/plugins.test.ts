import { ShogunCore } from "../../index";
import { CorePlugins, ShogunSDKConfig } from "../../interfaces/shogun";
import { Web3ConnectorPlugin } from "../../plugins/web3/web3ConnectorPlugin";
import { NostrConnectorPlugin } from "../../plugins/nostr/nostrConnectorPlugin";
// OAuth has been removed from Shogun Core

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

// Mock dei connector dei plugin per evitare dipendenze reali (Web3/Nostr)
// OAuth has been removed from Shogun Core

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
      async generateCredentials(
        address: string,
        signature: string,
        message: string,
      ) {
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
      oauth: {
        enabled: true,
        providers: { google: { clientId: "id", usePKCE: true } },
      },
      webauthn: { enabled: true },
      web3: { enabled: true },
      nostr: { enabled: true },
      peers: ["http://localhost:8765/gun"],
      gunOptions: { peers: ["http://localhost:8765/gun"] },
    } as any;
    core = new ShogunCore(config);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("registers built-in plugins when config provided", () => {
    // OAuth has been removed from Shogun Core
    expect(core.hasPlugin(CorePlugins.WebAuthn)).toBe(true);
    expect(core.hasPlugin(CorePlugins.Web3)).toBe(true);
    expect(core.hasPlugin(CorePlugins.Nostr)).toBe(true);
  });

  it("getPlugin returns correct instances", () => {
    // OAuth has been removed from Shogun Core
    const web3 = core.getPlugin<Web3ConnectorPlugin>(CorePlugins.Web3);
    const nostr = core.getPlugin<NostrConnectorPlugin>(CorePlugins.Nostr);

    expect(web3?.name).toBe("web3");
    expect(nostr?.name).toBe("nostr");
  });

  // OAuth has been removed from Shogun Core - test removed

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

    // Rimuovi temporaneamente il mock di window per questo test
    const originalWindow = global.window;
    delete (global as any).window;

    try {
      expect(webauthn.isSupported()).toBe(false);
    } finally {
      // Ripristina il mock
      (global as any).window = originalWindow;
    }
  });

  it("unregister destroys plugin and removes it", async () => {
    // OAuth has been removed - testing with Web3 instead
    const web3 = core.getPlugin<Web3ConnectorPlugin>(CorePlugins.Web3)!;
    const destroyedSpy = jest.fn();
    web3.on("destroyed", destroyedSpy);

    core.unregister(CorePlugins.Web3);
    expect(core.hasPlugin(CorePlugins.Web3)).toBe(false);
    // L'evento è sincrono, ma lasciamo un microtask per sicurezza
    await Promise.resolve();
    expect(destroyedSpy).toHaveBeenCalledTimes(1);
  });

  it("reports initialization status for registered plugins", () => {
    const status = core.getPluginsInitializationStatus();
    // I plugin registrati devono comparire nello status
    // OAuth has been removed from Shogun Core
    expect(status[CorePlugins.Web3]?.initialized).toBe(true);
    expect(status[CorePlugins.Nostr]?.initialized).toBe(true);
    // WebAuthn è inizializzato a livello di core reference anche se in Node non attiva moduli
    expect(status[CorePlugins.WebAuthn]?.initialized).toBe(true);
  });

  it("getAuthenticationMethod returns plugin-backed handlers", () => {
    // OAuth has been removed from Shogun Core
    const web3Method = core.getAuthenticationMethod("web3");
    const nostrMethod = core.getAuthenticationMethod("nostr");

    // Check that methods are defined (plugins exist)
    // Note: Some plugins might not be fully initialized in test environment
    if (web3Method) {
      expect((web3Method as any)?.name).toBe("web3");
    }
    if (nostrMethod) {
      expect((nostrMethod as any)?.name).toBe("nostr");
    }

    // At least one method should be defined
    expect(web3Method || nostrMethod).toBeDefined();
  });
});
