import { ShogunCore } from "../../index";
import { CorePlugins, ShogunSDKConfig } from "../../interfaces/shogun";
// OAuth plugin removed - no longer supported
import { Web3ConnectorPlugin } from "../../plugins/web3/web3ConnectorPlugin";
import { NostrConnectorPlugin } from "../../plugins/nostr/nostrConnectorPlugin";
import Gun from "gun/gun";

// Mock solo le dipendenze esterne, non Gun stesso
jest.mock("../../storage/storage", () => ({
  ShogunStorage: jest.fn().mockImplementation(() => ({
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
  })),
}));

jest.mock("../../utils/errorHandler", () => ({
  ErrorHandler: jest.fn().mockImplementation(() => ({
    handleError: jest.fn(),
  })),
}));

// Mock per localStorage globale
Object.defineProperty(global, "localStorage", {
  value: {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
  },
  writable: true,
});

// Mock per sessionStorage globale
Object.defineProperty(global, "sessionStorage", {
  value: {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
  },
  writable: true,
});

// Mock per WebAuthn
const mockWebAuthn = {
  create: jest.fn().mockResolvedValue({
    id: "test-credential-id",
    response: {
      clientDataJSON: "test-client-data",
      attestationObject: "test-attestation",
    },
  }),
  get: jest.fn().mockResolvedValue({
    id: "test-credential-id",
    response: {
      clientDataJSON: "test-client-data",
      authenticatorData: "test-auth-data",
      signature: "test-signature",
    },
  }),
};

// Mock per Web3
const mockWeb3 = {
  request: jest.fn().mockResolvedValue(["0xAbC"]),
  isConnected: jest.fn().mockReturnValue(true),
};

// Mock per Nostr
const mockNostr = {
  getPublicKey: jest.fn().mockResolvedValue("nostr-pub-key"),
  signEvent: jest.fn().mockResolvedValue({
    id: "nostr-event-id",
    sig: "nostr-signature",
  }),
};

// Mock per ZK Proof
const mockZkProof = {
  generateProof: jest.fn().mockResolvedValue("zk-proof"),
  verifyProof: jest.fn().mockResolvedValue(true),
};

// Mock global objects
Object.defineProperty(global, "window", {
  value: {
    PublicKeyCredential: mockWebAuthn,
    ethereum: mockWeb3,
    nostr: mockNostr,
    zkProof: mockZkProof,
  },
  writable: true,
});

// Tests
describe("Plugin end-to-end flows", () => {
  let config: ShogunSDKConfig;
  let core: ShogunCore;
  let gun: any;
  const originalWindow = global.window as any;

  beforeEach(async () => {
    // Create a real Gun instance with minimal configuration for testing
    gun = Gun({
      peers: [], // No peers for isolated tests
      localStorage: false, // Disable localStorage for tests
      axe: false, // Disable axe for tests
      multicast: false, // Disable multicast for tests
      radisk: true, // Enable radisk for tests
      rindexed: true, // Enable rindexed for tests
      webrtc: true, // Enable webrtc for tests
    });

    config = {
      webauthn: { enabled: true },
      web3: { enabled: true },
      nostr: { enabled: true },
      zkproof: { enabled: true },
      peers: ["http://localhost:8765/gun"],
      gun: gun, // Pass the real Gun instance
    } as any;
    
    // Simula ambiente browser per WebAuthn
    (global as any).window = { PublicKeyCredential: function () {} } as any;
    core = new ShogunCore(config);
    // Wait for plugins to be registered
    await core.initialize();
  });

  afterEach(() => {
    jest.clearAllMocks();
    // Ripristina window
    (global as any).window = originalWindow;
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
    const res = await nostr.login("nostr-pub-key");
    expect(res.success).toBe(true);
    expect(loginSpy).toHaveBeenCalled();
    const evt = (loginSpy.mock.calls[0] || [])[0];
    expect(evt?.method).toBe("nostr");
  });

  it("Nostr signUp emits auth:signup and succeeds", async () => {
    const signupSpy = jest.fn();
    core.on("auth:signup", signupSpy as any);
    const nostr = core.getPlugin<NostrConnectorPlugin>(CorePlugins.Nostr)!;
    const res = await nostr.signUp("nostr-pub-key");
    expect(res.success).toBe(true);
    expect(signupSpy).toHaveBeenCalled();
    const evt = (signupSpy.mock.calls[0] || [])[0];
    expect(evt?.method).toBe("nostr");
  });

  it("WebAuthn login succeeds with browser support mocked", async () => {
    const webauthn = core.getPlugin<any>(CorePlugins.WebAuthn)!;
    const res = await webauthn.login();
    expect(res.success).toBe(true);
  });

  it("WebAuthn signUp succeeds with browser support mocked", async () => {
    const webauthn = core.getPlugin<any>(CorePlugins.WebAuthn)!;
    const res = await webauthn.signUp();
    expect(res.success).toBe(true);
  });

  it("ZK Proof login succeeds", async () => {
    const zkproof = core.getPlugin<any>(CorePlugins.ZkProof)!;
    const res = await zkproof.login("zk-proof");
    expect(res.success).toBe(true);
  });

  it("ZK Proof signUp succeeds", async () => {
    const zkproof = core.getPlugin<any>(CorePlugins.ZkProof)!;
    const res = await zkproof.signUp("zk-proof");
    expect(res.success).toBe(true);
  });

  it("Plugin registration works correctly", () => {
    expect(core.getPlugin(CorePlugins.Web3)).toBeDefined();
    expect(core.getPlugin(CorePlugins.Nostr)).toBeDefined();
    expect(core.getPlugin(CorePlugins.WebAuthn)).toBeDefined();
    expect(core.getPlugin(CorePlugins.ZkProof)).toBeDefined();
  });

  it("Plugin events are emitted correctly", async () => {
    const loginSpy = jest.fn();
    const signupSpy = jest.fn();
    
    core.on("auth:login", loginSpy as any);
    core.on("auth:signup", signupSpy as any);

    const web3 = core.getPlugin<Web3ConnectorPlugin>(CorePlugins.Web3)!;
    await web3.login("0xAbC");
    await web3.signUp("0xabc");

    expect(loginSpy).toHaveBeenCalled();
    expect(signupSpy).toHaveBeenCalled();
  });

  it("Plugin error handling works correctly", async () => {
    // Mock Web3 to throw an error
    mockWeb3.request.mockRejectedValueOnce(new Error("Web3 error"));
    
    const web3 = core.getPlugin<Web3ConnectorPlugin>(CorePlugins.Web3)!;
    const res = await web3.login("0xAbC");
    
    expect(res.success).toBe(false);
    expect(res.error).toBeDefined();
  });

  it("Plugin configuration is respected", () => {
    const configWithDisabledWeb3 = {
      web3: { enabled: false },
      nostr: { enabled: true },
      webauthn: { enabled: false },
      zkproof: { enabled: false },
      peers: [],
      gun: gun,
    } as any;

    const coreWithDisabledWeb3 = new ShogunCore(configWithDisabledWeb3);
    
    expect(coreWithDisabledWeb3.getPlugin(CorePlugins.Web3)).toBeUndefined();
    expect(coreWithDisabledWeb3.getPlugin(CorePlugins.Nostr)).toBeDefined();
    expect(coreWithDisabledWeb3.getPlugin(CorePlugins.WebAuthn)).toBeUndefined();
    expect(coreWithDisabledWeb3.getPlugin(CorePlugins.ZkProof)).toBeUndefined();
  });

  it("Plugin lifecycle works correctly", async () => {
    const web3 = core.getPlugin<Web3ConnectorPlugin>(CorePlugins.Web3)!;
    
    // Test plugin initialization
    expect(web3).toBeDefined();
    expect(web3.isInitialized).toBe(true);
    
    // Test plugin methods
    expect(typeof web3.login).toBe("function");
    expect(typeof web3.signUp).toBe("function");
    expect(typeof web3.logout).toBe("function");
  });

  it("Plugin state management works correctly", async () => {
    const web3 = core.getPlugin<Web3ConnectorPlugin>(CorePlugins.Web3)!;
    
    // Test initial state
    expect(web3.isLoggedIn).toBe(false);
    
    // Test login state change
    await web3.login("0xAbC");
    expect(web3.isLoggedIn).toBe(true);
    
    // Test logout state change
    await web3.logout();
    expect(web3.isLoggedIn).toBe(false);
  });
});
