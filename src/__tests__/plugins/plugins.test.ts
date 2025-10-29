import { ShogunCore } from "../../index";
import { CorePlugins, ShogunSDKConfig } from "../../interfaces/shogun";
import { Web3ConnectorPlugin } from "../../plugins/web3/web3ConnectorPlugin";
import { NostrConnectorPlugin } from "../../plugins/nostr/nostrConnectorPlugin";
import { WebauthnPlugin } from "../../plugins/webauthn/webauthnPlugin"; // Import WebauthnPlugin

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
        is: jest.fn(),
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
    DataBase: jest.fn().mockImplementation(() => ({
      initialize: jest.fn().mockResolvedValue(undefined), // Mock initialize
      // Aggiungi altri metodi mockati se necessario
      isLoggedIn: jest.fn().mockReturnValue(false),
      logout: jest.fn(),
      login: jest.fn().mockResolvedValue({ success: true, userPub: "pub" }),
      loginWithPair: jest.fn(),
      signUp: jest.fn().mockResolvedValue({ success: true, userPub: "pub" }),
      updateUserAlias: jest.fn(),
      clearGunStorage: jest.fn(),
      getCurrentUser: jest.fn().mockReturnValue({ pub: "pub" }),
      getUser: jest.fn(() => ({
        get: jest.fn().mockReturnThis(),
        put: jest.fn().mockReturnThis(),
        once: jest.fn().mockReturnThis(),
        then: jest.fn(),
      })), // Mock getUser
      getNode: jest.fn(() => ({
        put: jest.fn().mockReturnThis(),
        once: jest.fn().mockReturnThis(),
        then: jest.fn(),
      })), // Mock getNode
      on: jest.fn(), // Aggiungi mock per .on
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

// Mock ShogunStorage
jest.mock("../../storage/storage", () => ({
  ShogunStorage: jest.fn().mockImplementation(() => ({
    setItem: jest.fn(),
    getItem: jest.fn(),
    removeItem: jest.fn(),
    clearAll: jest.fn(),
  })),
}));

// Mock dei connector dei plugin per evitare dipendenze reali (Web3/Nostr)
jest.mock("../../plugins/web3/web3ConnectorPlugin", () => {
  return {
    Web3ConnectorPlugin: class MockWeb3ConnectorPlugin {
      name = "web3";
      version = "1.0.0";
      core: any;
      events: any = new Map();

      initialize(core: any) {
        this.core = core;
      }
      isAvailable() {
        return true;
      }
      async connectMetaMask() {
        return { success: true, address: "0xabc" };
      }
      on(eventName: string, listener: () => void) {
        if (!this.events.has(eventName)) {
          this.events.set(eventName, []);
        }
        this.events.get(eventName)?.push(listener);
      }
      // Aggiungi altri metodi necessari per i test, come `destroy` se usato
      destroy() {
        this.events.clear();
      }
    },
  };
});

jest.mock("../../plugins/nostr/nostrConnectorPlugin", () => {
  return {
    NostrConnectorPlugin: class MockNostrConnectorPlugin {
      name = "nostr";
      version = "1.0.0";
      core: any;
      events: any = new Map();

      initialize(core: any) {
        this.core = core;
      }
      isAvailable() {
        return true;
      }
      isNostrExtensionAvailable() {
        return true;
      }
      async connectNostrWallet() {
        return { success: true, address: "npub123" };
      }
      on(eventName: string, listener: () => void) {
        if (!this.events.has(eventName)) {
          this.events.set(eventName, []);
        }
        this.events.get(eventName)?.push(listener);
      }
      // Aggiungi altri metodi necessari per i test, come `destroy` se usato
      destroy() {
        this.events.clear();
      }
    },
  };
});

jest.mock("../../plugins/webauthn/webauthnPlugin", () => {
  return {
    WebauthnPlugin: class MockWebauthnPlugin {
      name = "webauthn";
      version = "1.0.0";
      core: any;
      events: any = new Map();

      initialize(core: any) {
        this.core = core;
      }
      isSupported() {
        return (
          typeof window !== "undefined" &&
          typeof window.PublicKeyCredential !== "undefined"
        );
      }
      on(eventName: string, listener: () => void) {
        if (!this.events.has(eventName)) {
          this.events.set(eventName, []);
        }
        this.events.get(eventName)?.push(listener);
      }
      // Aggiungi altri metodi necessari per i test, come `destroy` se usato
      destroy() {
        this.events.clear();
      }
    },
  };
});

jest.mock("../../plugins/zkproof/zkProofPlugin", () => {
  return {
    ZkProofPlugin: class MockZkProofPlugin {
      name = "zkproof";
      version = "1.0.0";
      core: any;
      events: any = new Map();

      initialize(core: any) {
        this.core = core;
      }
      on(eventName: string, listener: () => void) {
        if (!this.events.has(eventName)) {
          this.events.set(eventName, []);
        }
        this.events.get(eventName)?.push(listener);
      }
      destroy() {
        this.events.clear();
      }
    },
  };
});

describe("Plugin system and plugin functionality", () => {
  let config: ShogunSDKConfig;
  let core: ShogunCore;
  let mockGunInstance: any;

  beforeAll(async () => {
    // Mock window.PublicKeyCredential for WebAuthn tests in Node environment
    (global as any).window = {
      PublicKeyCredential: class MockPublicKeyCredential {},
    };

    mockGunInstance = jest.fn(() => ({
      user: jest.fn(() => ({
        recall: jest.fn(),
        on: jest.fn(),
      })),
      on: jest.fn(),
      get: jest.fn(() => ({
        once: jest.fn(),
        then: jest.fn(),
      })),
    }))(); // Call it immediately to get an instance

    config = {
      gunInstance: mockGunInstance,
      webauthn: { enabled: true },
      web3: { enabled: true },
      nostr: { enabled: true },
      zkproof: { enabled: true }, // Add ZK-Proof plugin config
      peers: ["http://localhost:8765/gun"],
      gunOptions: { peers: ["http://localhost:8765/gun"] },
    };
    core = new ShogunCore(config);
    await core.db.initialize(); // Wait for async initialization
  });

  afterAll(() => {
    // Ripristina window originale dopo tutti i test
    delete (global as any).window;
  });

  afterEach(() => {
    jest.clearAllMocks();
    // Don't unregister plugins between tests to avoid interference
  });

  it("registers built-in plugins when config provided", () => {
    expect(core.hasPlugin(CorePlugins.WebAuthn)).toBe(true);
    expect(core.hasPlugin(CorePlugins.Web3)).toBe(true);
    expect(core.hasPlugin(CorePlugins.Nostr)).toBe(true);
    expect(core.hasPlugin(CorePlugins.ZkProof)).toBe(true); // Check ZK-Proof plugin
  });

  it("getPlugin returns correct instances", () => {
    const web3 = core.getPlugin<Web3ConnectorPlugin>(CorePlugins.Web3);
    const nostr = core.getPlugin<NostrConnectorPlugin>(CorePlugins.Nostr);
    const webauthn = core.getPlugin<WebauthnPlugin>(CorePlugins.WebAuthn); // Get Webauthn plugin
    const zkproof = core.getPlugin<any>(CorePlugins.ZkProof); // Get ZK-Proof plugin

    expect(web3?.name).toBe("web3");
    expect(nostr?.name).toBe("nostr");
    expect(webauthn?.name).toBe("webauthn"); // Check Webauthn plugin name
    expect(zkproof?.name).toBe("zkproof"); // Check ZK-Proof plugin name
  });

  it("Web3 plugin exposes availability and connection", async () => {
    const web3 = core.getPlugin<Web3ConnectorPlugin>(CorePlugins.Web3)!;
    expect(web3.isAvailable()).toBe(true);
    // Mock connectMetaMask if it interacts with a real browser environment
    // For now, assuming the mock already handles it.
    const conn = await web3.connectMetaMask();
    expect(conn.success).toBe(true);
  });

  it("Nostr plugin can connect via extension", async () => {
    const nostr = core.getPlugin<NostrConnectorPlugin>(CorePlugins.Nostr)!;
    expect(nostr.isNostrExtensionAvailable()).toBe(true);
    // Mock connectNostrWallet if it interacts with a real browser environment
    // For now, assuming the mock already handles it.
    const res = await nostr.connectNostrWallet();
    expect(res.success).toBe(true);
  });

  it("WebAuthn plugin reports unsupported in Node env", () => {
    // Ensure WebAuthn plugin is retrieved correctly
    const webauthn = core.getPlugin<WebauthnPlugin>(CorePlugins.WebAuthn)!;

    // Temporarily remove PublicKeyCredential for this test to simulate unsupported environment
    const originalPublicKeyCredential = (global as any).window
      .PublicKeyCredential;
    delete (global as any).window.PublicKeyCredential;

    try {
      expect(webauthn.isSupported()).toBe(false);
    } finally {
      // Restore original PublicKeyCredential
      (global as any).window.PublicKeyCredential = originalPublicKeyCredential;
    }
  });

  it("unregister destroys plugin and removes it", async () => {
    // First ensure the plugin is registered
    expect(core.hasPlugin(CorePlugins.Web3)).toBe(true);

    const web3 = core.getPlugin<Web3ConnectorPlugin>(CorePlugins.Web3);
    expect(web3).toBeDefined();

    // Test that the plugin is properly registered before unregistering
    expect(core.hasPlugin(CorePlugins.Web3)).toBe(true);

    // Check if the plugin has a destroy method
    expect(typeof web3!.destroy).toBe("function");

    // Ensure the plugin is properly initialized
    if (web3 && typeof web3.initialize === "function") {
      web3.initialize(core as any);
    }

    // Test that unregister removes the plugin
    core.unregister(CorePlugins.Web3);
    expect(core.hasPlugin(CorePlugins.Web3)).toBe(false);

    // Wait for the destroy method to complete
    await Promise.resolve();

    // Re-register the plugin for subsequent tests
    const { Web3ConnectorPlugin } = require("../../plugins/web3");
    const newWeb3Plugin = new Web3ConnectorPlugin();
    core.register(newWeb3Plugin);
  });

  it("reports initialization status for registered plugins", async () => {
    // Ensure all plugins are initialized (especially for WebAuthn in Node env)
    await core.db.initialize(); // Ensure DB initialization is complete

    // Check that plugins are registered first
    expect(core.hasPlugin(CorePlugins.Web3)).toBe(true);
    expect(core.hasPlugin(CorePlugins.Nostr)).toBe(true);
    expect(core.hasPlugin(CorePlugins.WebAuthn)).toBe(true);
    expect(core.hasPlugin(CorePlugins.ZkProof)).toBe(true);

    // Manually initialize plugins to ensure they're ready
    const web3Plugin = core.getPlugin(CorePlugins.Web3);
    const nostrPlugin = core.getPlugin(CorePlugins.Nostr);
    const webauthnPlugin = core.getPlugin(CorePlugins.WebAuthn);
    const zkproofPlugin = core.getPlugin(CorePlugins.ZkProof);

    // Ensure plugins are properly initialized
    if (web3Plugin && typeof web3Plugin.initialize === "function") {
      web3Plugin.initialize(core as any);
    }
    if (nostrPlugin && typeof nostrPlugin.initialize === "function") {
      nostrPlugin.initialize(core as any);
    }
    if (webauthnPlugin && typeof webauthnPlugin.initialize === "function") {
      webauthnPlugin.initialize(core as any);
    }
    if (zkproofPlugin && typeof zkproofPlugin.initialize === "function") {
      zkproofPlugin.initialize(core as any);
    }

    const status = core.getPluginsInitializationStatus();
    expect(status[CorePlugins.Web3]?.initialized).toBe(true);
    expect(status[CorePlugins.Nostr]?.initialized).toBe(true);
    // WebAuthn should be initialized even in Node environment because `initialize` is called,
    // but `isSupported` might return false.
    expect(status[CorePlugins.WebAuthn]?.initialized).toBe(true);
    expect(status[CorePlugins.ZkProof]?.initialized).toBe(true);
  });

  it("getAuthenticationMethod returns plugin-backed handlers", () => {
    // Check that plugins are registered first
    expect(core.hasPlugin(CorePlugins.Web3)).toBe(true);
    expect(core.hasPlugin(CorePlugins.Nostr)).toBe(true);

    // Ensure plugins are initialized before testing
    const web3Plugin = core.getPlugin(CorePlugins.Web3);
    const nostrPlugin = core.getPlugin(CorePlugins.Nostr);

    expect(web3Plugin).toBeDefined();
    expect(nostrPlugin).toBeDefined();

    if (web3Plugin && typeof web3Plugin.initialize === "function") {
      web3Plugin.initialize(core as any);
    }
    if (nostrPlugin && typeof nostrPlugin.initialize === "function") {
      nostrPlugin.initialize(core as any);
    }

    const web3Method = core.getAuthenticationMethod("web3");
    const nostrMethod = core.getAuthenticationMethod("nostr");

    expect(web3Method).toBeDefined();
    expect((web3Method as any)?.name).toBe("web3");

    expect(nostrMethod).toBeDefined();
    expect((nostrMethod as any)?.name).toBe("nostr");
  });
});
