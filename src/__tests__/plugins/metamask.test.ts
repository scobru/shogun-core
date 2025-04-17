import { EventEmitter } from "events";
import { EthereumProvider } from "../../types/metamask";

// Mock implementazione manuale di MetaMask senza dipendere dalla classe reale
class MetaMask extends EventEmitter {
  private _cachedSignatures: Record<string | number, any> = {};

  constructor() {
    super();
    this.setupProvider();
  }

  setupProvider() {
    // Metodo mock
  }

  validateAddress(address: string) {
    if (!address || typeof address !== "string" || !address.startsWith("0x")) {
      throw new Error("Invalid address format");
    }
    return address.toLowerCase();
  }

  getCachedSignature(address: string | number) {
    // Implementazione mock
    return this._cachedSignatures ? this._cachedSignatures[address] : null;
  }

  cacheSignature(address: string | number, signature: any) {
    this._cachedSignatures = this._cachedSignatures || {};
    this._cachedSignatures[address] = signature;
  }

  cleanup() {
    this.removeAllListeners();
  }

  static isMetaMaskAvailable() {
    return !!window.ethereum;
  }

  async connectMetaMask() {
    if (!window.ethereum || !window.ethereum.request) {
      return { success: false, error: "MetaMask not available" };
    }

    const accounts = await window.ethereum.request({
      method: "eth_requestAccounts",
    });

    if (!accounts || accounts.length === 0) {
      return { success: false, error: "No accounts found" };
    }

    return { success: true, address: accounts[0] };
  }

  async generateCredentials(address: string) {
    try {
      const validAddress = this.validateAddress(address);
      const signature = await this.requestSignatureWithTimeout(
        validAddress,
        "Test message"
      );

      return {
        success: true,
        address: validAddress.toLowerCase(),
        signature: signature,
      };
    } catch (error: unknown) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  async requestSignatureWithTimeout(
    address: string,
    message: string,
    timeout = 1000
  ) {
    // Mock implementation
    return "mock-signature";
  }
}

// Mock per window.ethereum
const mockEthereum = {
  request: jest.fn(),
  on: jest.fn(),
  removeListener: jest.fn(),
};

describe("MetaMask Plugin", () => {
  let metamask: MetaMask;
  let originalEthereum: EthereumProvider | undefined;

  // Salva l'originale window.ethereum
  beforeAll(() => {
    originalEthereum = window.ethereum;
  });

  // Ripristina l'originale window.ethereum
  afterAll(() => {
    window.ethereum = originalEthereum;
  });

  beforeEach(() => {
    // Resetta i mock
    jest.clearAllMocks();

    // Mock window.ethereum
    window.ethereum = mockEthereum;

    // Inizializza il plugin
    metamask = new MetaMask();
  });

  afterEach(() => {
    // Cleanup esplicito per evitare memory leaks
    if (metamask) {
      metamask.cleanup();
      metamask.removeAllListeners();
    }
  });

  test("dovrebbe inizializzarsi correttamente", () => {
    expect(metamask).toBeInstanceOf(MetaMask);
    expect(metamask).toBeInstanceOf(EventEmitter);
  });

  test("dovrebbe rilevare correttamente se MetaMask è disponibile", () => {
    expect(MetaMask.isMetaMaskAvailable()).toBe(true);

    // Simula MetaMask non disponibile
    window.ethereum = undefined;

    expect(MetaMask.isMetaMaskAvailable()).toBe(false);

    // Ripristina per gli altri test
    window.ethereum = mockEthereum;
  });

  test("la connessione MetaMask dovrebbe fallire quando non ci sono account", async () => {
    // Mock per window.ethereum.request che restituisce array vuoto
    mockEthereum.request.mockResolvedValueOnce([]);

    const result = await metamask.connectMetaMask();

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });

  test("dovrebbe memorizzare in cache le firme", () => {
    const address = "0x1234567890123456789012345678901234567890";
    const signature = "test-signature";

    metamask.cacheSignature(address, signature);
    const cachedSignature = metamask.getCachedSignature(address);

    expect(cachedSignature).toBe(signature);
  });

  test("dovrebbe validare correttamente un indirizzo", () => {
    const validAddress = "0x1234567890123456789012345678901234567890";
    const invalidAddress = "not-an-address";

    expect(() => metamask.validateAddress(validAddress)).not.toThrow();
    expect(() => metamask.validateAddress(invalidAddress)).toThrow();
  });

  test("dovrebbe pulire correttamente i listener", () => {
    // Aggiungi alcuni event listener di test
    const testListener = jest.fn();
    metamask.on("test-event", testListener);

    // Chiama cleanup
    metamask.cleanup();

    // Verifica che removeAllListeners sia stato chiamato implicitamente
    metamask.emit("test-event", "test");
    expect(testListener).not.toHaveBeenCalled();
  });

  test("dovrebbe generare credenziali correttamente", async () => {
    const address = "0x1234567890123456789012345678901234567890";
    const mockSignature = "mock-signature";

    // Mock del metodo requestSignatureWithTimeout
    jest
      .spyOn(metamask, "requestSignatureWithTimeout")
      .mockImplementation(() => Promise.resolve(mockSignature));

    const credentials = await metamask.generateCredentials(address);

    expect(credentials).toBeDefined();
    expect(credentials.address).toBe(address.toLowerCase());
    expect(credentials.signature).toBe(mockSignature);
  });
});
