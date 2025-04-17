// Mock per localStorage e sessionStorage
require("mock-local-storage");

// Assicura che localStorage funzioni correttamente
if (typeof localStorage === "undefined" || !localStorage.setItem) {
  // Console.log silenzioso per i test
  const silentConsole = {
    log: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  };

  // Salva il console originale
  const originalConsole = global.console;

  // Sostituisci temporaneamente console per evitare output di errori durante l'inizializzazione
  global.console = silentConsole;

  try {
    global.localStorage = {
      _data: {},
      getItem: jest.fn(function (key) {
        return this._data[key] || null;
      }),
      setItem: jest.fn(function (key, value) {
        this._data[key] = value;
      }),
      removeItem: jest.fn(function (key) {
        delete this._data[key];
      }),
      clear: jest.fn(function () {
        this._data = {};
      }),
    };
  } finally {
    // Ripristina il console originale
    global.console = originalConsole;
  }
}

// Aggiungi TextEncoder e TextDecoder globali
global.TextEncoder = require("util").TextEncoder;
global.TextDecoder = require("util").TextDecoder;

// Mock per crypto
global.crypto = {
  getRandomValues: function (buffer) {
    return require("crypto").randomFillSync(buffer);
  },
  subtle: {},
};

// Mock per window
global.window = {
  localStorage: global.localStorage,
  sessionStorage: global.sessionStorage,
  location: {
    protocol: "https:",
    host: "localhost",
    hostname: "localhost",
    origin: "https://localhost",
  },
  URL: {
    createObjectURL: jest.fn(),
    revokeObjectURL: jest.fn(),
  },
  crypto: global.crypto,
  atob: (b64) => Buffer.from(b64, "base64").toString("binary"),
  btoa: (str) => Buffer.from(str, "binary").toString("base64"),
};

// Mock per navigator
global.navigator = {
  ...global.navigator,
  credentials: {
    create: jest.fn().mockResolvedValue({
      id: "test-credential-id",
      type: "public-key",
      rawId: new Uint8Array([1, 2, 3, 4]),
      response: {
        clientDataJSON: new Uint8Array([5, 6, 7, 8]),
        attestationObject: new Uint8Array([9, 10, 11, 12]),
      },
      getClientExtensionResults: jest.fn().mockReturnValue({}),
    }),
    get: jest.fn().mockResolvedValue({
      id: "test-credential-id",
      type: "public-key",
      rawId: new Uint8Array([1, 2, 3, 4]),
      response: {
        clientDataJSON: new Uint8Array([5, 6, 7, 8]),
        authenticatorData: new Uint8Array([9, 10, 11, 12]),
        signature: new Uint8Array([13, 14, 15, 16]),
      },
      getClientExtensionResults: jest.fn().mockReturnValue({}),
    }),
  },
};

// Mock per EventTarget
class MockEventTarget {
  constructor() {
    this.listeners = {};
  }

  addEventListener(type, callback) {
    if (!this.listeners[type]) {
      this.listeners[type] = [];
    }
    this.listeners[type].push(callback);
  }

  removeEventListener(type, callback) {
    if (!this.listeners[type]) return;
    this.listeners[type] = this.listeners[type].filter(
      (listener) => listener !== callback
    );
  }

  dispatchEvent(event) {
    if (!this.listeners[event.type]) return true;
    this.listeners[event.type].forEach((callback) => callback(event));
    return !event.defaultPrevented;
  }
}

global.EventTarget = MockEventTarget;

// Mock per AbortController
global.AbortController = class AbortController {
  constructor() {
    this.signal = { aborted: false };
  }
  abort() {
    this.signal.aborted = true;
  }
};

// Mock per Gun (se necessario)
jest.mock("gun", () => {
  const Gun = jest.fn().mockImplementation(() => {
    return {
      user: jest.fn().mockReturnThis(),
      create: jest.fn(),
      auth: jest.fn(),
      get: jest.fn().mockReturnThis(),
      put: jest.fn().mockReturnThis(),
      set: jest.fn().mockReturnThis(),
      on: jest.fn(),
      once: jest.fn(),
      map: jest.fn(),
      back: jest.fn().mockReturnThis(),
      recall: jest.fn().mockReturnThis(),
    };
  });

  Gun.SEA = {
    pair: jest.fn().mockResolvedValue({
      pub: "mock-pub",
      priv: "mock-priv",
      epub: "mock-epub",
      epriv: "mock-epriv",
    }),
    sign: jest.fn().mockResolvedValue("mock-signature"),
    verify: jest.fn().mockResolvedValue("mock-verified"),
    encrypt: jest.fn().mockResolvedValue("mock-encrypted"),
    decrypt: jest.fn().mockResolvedValue("mock-decrypted"),
    secret: jest.fn().mockResolvedValue("mock-shared-secret"),
    work: jest.fn().mockResolvedValue("mock-work-result"),
  };

  Gun.text = {
    random: jest.fn().mockReturnValue("random-string"),
  };

  Gun.on = jest.fn();

  return Gun;
});

// Mock per ethers
jest.mock("ethers", () => {
  const originalModule = jest.requireActual("ethers");

  return {
    ...originalModule,
    BrowserProvider: jest.fn().mockImplementation(() => ({
      getSigner: jest.fn().mockResolvedValue({
        getAddress: jest
          .fn()
          .mockResolvedValue("0x1234567890123456789012345678901234567890"),
        signMessage: jest.fn().mockResolvedValue("0xmocksignature"),
      }),
      on: jest.fn(),
      removeAllListeners: jest.fn(),
    })),
    JsonRpcProvider: jest.fn().mockImplementation(() => ({
      getBalance: jest
        .fn()
        .mockResolvedValue({ toString: () => "1000000000000000000" }),
      getTransactionCount: jest.fn().mockResolvedValue(0),
      getTransactionReceipt: jest.fn().mockResolvedValue({ status: 1 }),
      getGasPrice: jest
        .fn()
        .mockResolvedValue({ toString: () => "20000000000" }),
    })),
    Wallet: {
      createRandom: jest.fn().mockReturnValue({
        address: "0x1234567890123456789012345678901234567890",
        privateKey: "0xprivatekey",
        signMessage: jest.fn().mockResolvedValue("0xsignature"),
        connect: jest.fn().mockReturnThis(),
      }),
      fromPhrase: jest.fn().mockReturnValue({
        address: "0x1234567890123456789012345678901234567890",
        privateKey: "0xprivatekey",
        signMessage: jest.fn().mockResolvedValue("0xsignature"),
        connect: jest.fn().mockReturnThis(),
      }),
      fromPrivateKey: jest.fn().mockReturnValue({
        address: "0x1234567890123456789012345678901234567890",
        privateKey: "0xprivatekey",
        signMessage: jest.fn().mockResolvedValue("0xsignature"),
        connect: jest.fn().mockReturnThis(),
      }),
    },
    getDefaultProvider: jest.fn(),
    isAddress: jest.fn().mockImplementation((address) => {
      return address && typeof address === "string" && address.startsWith("0x");
    }),
    getAddress: jest.fn().mockImplementation((address) => address),
    parseEther: jest.fn().mockImplementation((value) => ({
      toString: () => "1000000000000000000",
    })),
    formatEther: jest.fn().mockImplementation((value) => "1.0"),
    HDNodeWallet: originalModule.HDNodeWallet,
    Mnemonic: originalModule.Mnemonic,
    randomBytes: jest.fn().mockImplementation((length) => {
      return new Uint8Array(length).fill(1);
    }),
  };
});

// Gestione teardown dopo ogni test
afterEach(() => {
  // Pulisci tutti i mock
  jest.clearAllMocks();

  // Resetta i timer
  jest.useRealTimers();

  // Pulizia di localStorage e sessionStorage
  localStorage.clear();
  sessionStorage.clear();

  // Pulizia di eventuali modifiche a window ed EventTarget
  if (global.window._eventListeners) {
    global.window._eventListeners = {};
  }
});

// Gestione teardown alla fine di tutti i test
afterAll(() => {
  // Assicurati che non ci siano timer attivi
  jest.useRealTimers();

  // Pulizia delle reference circolari che potrebbero causare memory leaks
  if (global.gc) {
    global.gc();
  }
});

// Per garantire risultati di test stabili e non casuali
process.env.NODE_ENV = "test";

// Sopprimiamo messaggi di log non necessari durante i test
if (process.env.NODE_ENV === "test") {
  const originalConsoleLog = console.log;
  const originalConsoleInfo = console.info;
  const originalConsoleDebug = console.debug;

  console.log = (...args) => {
    // Permetti solo alcuni messaggi di log durante i test
    if (process.env.DEBUG) {
      originalConsoleLog(...args);
    }
  };

  console.info = (...args) => {
    // Permetti solo alcuni messaggi di info durante i test
    if (process.env.DEBUG) {
      originalConsoleInfo(...args);
    }
  };

  console.debug = (...args) => {
    // Permetti solo alcuni messaggi di debug durante i test
    if (process.env.DEBUG) {
      originalConsoleDebug(...args);
    }
  };

  // Gli errori li lasciamo visibili per il debugging
}

// Riduciamo il timeout di Jest se necessario
if (!global.jasmine) {
  // jasmine is undefined in Jest, but we need to set this property for some reason
  global.jasmine = {};
}
