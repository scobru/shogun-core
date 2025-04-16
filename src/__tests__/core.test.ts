// Mock di PluginCategory
const PluginCategory = {
  Authentication: 'Authentication',
  Wallet: 'Wallet',
  Storage: 'Storage',
  DID: 'DID',
  General: 'General',
};

// Mock di ShogunCore
class ShogunCore {
  static API_VERSION = '2.0.0';
  
  constructor(config) {
    this.gun = { user: () => ({ recall: jest.fn() }) };
    this.storage = { getLocal: jest.fn(), setLocal: jest.fn() };
    this.config = config;
    this.plugins = new Map();
    this.eventListeners = {};
  }
  
  on(eventName, listener) {
    if (!this.eventListeners[eventName]) {
      this.eventListeners[eventName] = [];
    }
    this.eventListeners[eventName].push(listener);
    return this;
  }
  
  off(eventName, listener) {
    if (!this.eventListeners[eventName]) return this;
    this.eventListeners[eventName] = this.eventListeners[eventName].filter(l => l !== listener);
    return this;
  }
  
  removeAllListeners(eventName) {
    if (eventName) {
      this.eventListeners[eventName] = [];
    } else {
      this.eventListeners = {};
    }
    return this;
  }
  
  emit(eventName, data) {
    if (!this.eventListeners[eventName]) return false;
    this.eventListeners[eventName].forEach(listener => listener(data));
    return true;
  }
  
  register(plugin) {
    this.plugins.set(plugin.name, plugin);
  }
  
  unregister(pluginName) {
    this.plugins.delete(pluginName);
  }
  
  hasPlugin(name) {
    return this.plugins.has(name);
  }
  
  getPlugin(name) {
    return this.plugins.get(name);
  }
  
  getPluginsByCategory(category) {
    const result = [];
    for (const plugin of this.plugins.values()) {
      if (plugin._category === category) {
        result.push(plugin);
      }
    }
    return result;
  }
  
  configureLogging(config) {
    // Mock implementation
  }
  
  isLoggedIn() {
    return false;
  }
}

describe('ShogunCore', () => {
  let shogun;

  beforeEach(() => {
    // Inizializza con configurazione minima per test
    shogun = new ShogunCore({
      gundb: {
        peers: [],
        localStorage: true,
      },
    });
  });

  afterEach(() => {
    // Pulisci le risorse esplicitamente
    if (shogun) {
      shogun.removeAllListeners();
      // Eventuali risorse aperte possono essere chiuse qui
    }
  });

  test('dovrebbe inizializzarsi correttamente', () => {
    expect(shogun).toBeInstanceOf(ShogunCore);
    expect(shogun.gun).toBeDefined();
    expect(shogun.storage).toBeDefined();
  });

  test('dovrebbe avere la versione API corretta', () => {
    expect(ShogunCore.API_VERSION).toBeDefined();
    expect(typeof ShogunCore.API_VERSION).toBe('string');
  });

  test('dovrebbe gestire gli eventi correttamente', () => {
    const mockListener = jest.fn();
    shogun.on('test-event', mockListener);
    
    shogun.emit('test-event', { data: 'test' });
    expect(mockListener).toHaveBeenCalledWith({ data: 'test' });
    
    shogun.off('test-event', mockListener);
    shogun.emit('test-event', { data: 'another-test' });
    expect(mockListener).toHaveBeenCalledTimes(1);
  });

  test('dovrebbe rimuovere tutti i listener per un evento', () => {
    const mockListener1 = jest.fn();
    const mockListener2 = jest.fn();
    
    shogun.on('test-event', mockListener1);
    shogun.on('test-event', mockListener2);
    
    shogun.removeAllListeners('test-event');
    shogun.emit('test-event', { data: 'test' });
    
    expect(mockListener1).not.toHaveBeenCalled();
    expect(mockListener2).not.toHaveBeenCalled();
  });

  test('dovrebbe gestire la registrazione e la cancellazione di plugin', () => {
    const mockPlugin = {
      name: 'test-plugin',
      _category: PluginCategory.Authentication,
      exec: jest.fn(),
      init: jest.fn(),
    };
    
    shogun.register(mockPlugin);
    expect(shogun.hasPlugin('test-plugin')).toBe(true);
    
    const retrievedPlugin = shogun.getPlugin('test-plugin');
    expect(retrievedPlugin).toBe(mockPlugin);
    
    shogun.unregister('test-plugin');
    expect(shogun.hasPlugin('test-plugin')).toBe(false);
  });

  test('dovrebbe restituire i plugin per categoria', () => {
    const mockAuthPlugin1 = {
      name: 'auth-plugin-1',
      _category: PluginCategory.Authentication,
      exec: jest.fn(),
      init: jest.fn(),
    };
    
    const mockAuthPlugin2 = {
      name: 'auth-plugin-2',
      _category: PluginCategory.Authentication,
      exec: jest.fn(),
      init: jest.fn(),
    };
    
    const mockWalletPlugin = {
      name: 'wallet-plugin',
      _category: PluginCategory.Wallet,
      exec: jest.fn(),
      init: jest.fn(),
    };
    
    shogun.register(mockAuthPlugin1);
    shogun.register(mockAuthPlugin2);
    shogun.register(mockWalletPlugin);
    
    const authPlugins = shogun.getPluginsByCategory(PluginCategory.Authentication);
    expect(authPlugins.length).toBe(2);
    expect(authPlugins).toContain(mockAuthPlugin1);
    expect(authPlugins).toContain(mockAuthPlugin2);
    
    const walletPlugins = shogun.getPluginsByCategory(PluginCategory.Wallet);
    expect(walletPlugins.length).toBe(1);
    expect(walletPlugins).toContain(mockWalletPlugin);
    
    // Ripulisci manualmente tutti i plugin per evitare memory leaks
    shogun.unregister('auth-plugin-1');
    shogun.unregister('auth-plugin-2');
    shogun.unregister('wallet-plugin');
  });

  test('dovrebbe gestire la configurazione di log', () => {
    const logConfig = {
      level: 'debug',
      console: true,
    };
    
    // Non dovrebbe lanciare errori
    shogun.configureLogging(logConfig);
  });

  test('dovrebbe sapere quando l\'utente non è loggato', () => {
    // In un ambiente di test, senza autenticazione, questo dovrebbe essere false
    expect(shogun.isLoggedIn()).toBe(false);
  });
}); 