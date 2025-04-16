// Mock per localStorage e sessionStorage
require('mock-local-storage');

// Mock per crypto
global.crypto = {
  getRandomValues: function(buffer) {
    return require('crypto').randomFillSync(buffer);
  },
  subtle: {}
};

// Mock per window
global.window = {
  localStorage: global.localStorage,
  sessionStorage: global.sessionStorage,
  location: {
    protocol: 'https:',
    host: 'localhost',
    hostname: 'localhost',
    origin: 'https://localhost',
  },
  URL: {
    createObjectURL: jest.fn(),
    revokeObjectURL: jest.fn(),
  },
  crypto: global.crypto,
  atob: (b64) => Buffer.from(b64, 'base64').toString('binary'),
  btoa: (str) => Buffer.from(str, 'binary').toString('base64'),
};

// Mock per navigator
global.navigator = {
  ...global.navigator,
  credentials: {
    create: jest.fn(),
    get: jest.fn(),
  }
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
    this.listeners[type] = this.listeners[type].filter(listener => listener !== callback);
  }
  
  dispatchEvent(event) {
    if (!this.listeners[event.type]) return true;
    this.listeners[event.type].forEach(callback => callback(event));
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
jest.mock('gun', () => {
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
    pair: jest.fn().mockResolvedValue({ pub: 'mock-pub', priv: 'mock-priv' }),
    sign: jest.fn().mockResolvedValue('mock-signature'),
    verify: jest.fn().mockResolvedValue('mock-verified'),
    encrypt: jest.fn().mockResolvedValue('mock-encrypted'),
    decrypt: jest.fn().mockResolvedValue('mock-decrypted'),
  };

  Gun.text = {
    random: jest.fn().mockReturnValue('random-string'),
  };

  Gun.on = jest.fn();
  
  return Gun;
});

// Mock per ethers
jest.mock('ethers', () => {
  return {
    BrowserProvider: jest.fn().mockImplementation(() => ({
      getSigner: jest.fn().mockResolvedValue({
        getAddress: jest.fn().mockResolvedValue('0x1234567890123456789012345678901234567890'),
      }),
      on: jest.fn(),
      removeAllListeners: jest.fn(),
    })),
    JsonRpcProvider: jest.fn(),
    Wallet: jest.fn(),
    getDefaultProvider: jest.fn(),
    isAddress: jest.fn().mockImplementation(address => {
      return address && typeof address === 'string' && address.startsWith('0x');
    }),
    getAddress: jest.fn().mockImplementation(address => address),
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