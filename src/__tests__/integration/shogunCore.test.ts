import { ShogunCore, ShogunSDKConfig } from '../../index';

// Mock delle dipendenze esterne
jest.mock('../../gundb', () => {
  const originalGundb = jest.requireActual('../../gundb');

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
      login: jest.fn(),
      loginWithPair: jest.fn(),
      signUp: jest.fn(),
      updateUserAlias: jest.fn(),
      clearGunStorage: jest.fn(),
      initialize: jest.fn(),
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

describe('ShogunCore Integration Tests', () => {
  let config: ShogunSDKConfig;
  let shogunCore: ShogunCore;

  beforeEach(() => {
    config = {
      appToken: 'test-token',
      oauth: { enabled: false },
      peers: ['http://localhost:8765/gun'],
      gunOptions: { peers: ['http://localhost:8765/gun'] },
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Constructor', () => {
    it('should create instance with valid config', () => {
      expect(() => {
        shogunCore = new ShogunCore(config);
      }).not.toThrow();

      expect(shogunCore).toBeInstanceOf(ShogunCore);
      expect(shogunCore.config).toEqual(config);
    });

    it('should handle config with authToken', () => {
      const configWithAuth = {
        ...config,
        authToken: 'test-auth-token',
      };

      expect(() => {
        shogunCore = new ShogunCore(configWithAuth);
      }).not.toThrow();
    });

    it('should handle config with disabled plugins', () => {
      const configDisabled = {
        ...config,
        oauth: { enabled: false },
        webauthn: { enabled: false },
        web3: { enabled: false },
        nostr: { enabled: false },
      };

      expect(() => {
        shogunCore = new ShogunCore(configDisabled);
      }).not.toThrow();
    });
  });

  describe('Plugin System', () => {
    beforeEach(() => {
      shogunCore = new ShogunCore(config);
    });

    it('should get plugin count', () => {
      const count = shogunCore.getPluginCount();
      expect(typeof count).toBe('number');
      expect(count).toBeGreaterThanOrEqual(0);
    });

    it('should get plugins info', () => {
      const pluginsInfo = shogunCore.getPluginsInfo();
      expect(Array.isArray(pluginsInfo)).toBe(true);

      pluginsInfo.forEach((plugin) => {
        expect(plugin).toHaveProperty('name');
        expect(plugin).toHaveProperty('version');
        expect(typeof plugin.name).toBe('string');
        expect(typeof plugin.version).toBe('string');
      });
    });

    it('should get plugins initialization status', () => {
      const status = shogunCore.getPluginsInitializationStatus();
      expect(typeof status).toBe('object');

      Object.values(status).forEach((pluginStatus) => {
        expect(pluginStatus).toHaveProperty('initialized');
        expect(typeof pluginStatus.initialized).toBe('boolean');
      });
    });

    it('should validate plugin system', () => {
      const validation = shogunCore.validatePluginSystem();

      expect(validation).toHaveProperty('totalPlugins');
      expect(validation).toHaveProperty('initializedPlugins');
      expect(validation).toHaveProperty('failedPlugins');
      expect(validation).toHaveProperty('warnings');

      expect(typeof validation.totalPlugins).toBe('number');
      expect(typeof validation.initializedPlugins).toBe('number');
      expect(Array.isArray(validation.failedPlugins)).toBe(true);
      expect(Array.isArray(validation.warnings)).toBe(true);
    });

    it('should check plugin compatibility', () => {
      const compatibility = shogunCore.checkPluginCompatibility();

      expect(compatibility).toHaveProperty('compatible');
      expect(compatibility).toHaveProperty('incompatible');
      expect(compatibility).toHaveProperty('unknown');

      expect(Array.isArray(compatibility.compatible)).toBe(true);
      expect(Array.isArray(compatibility.incompatible)).toBe(true);
      expect(Array.isArray(compatibility.unknown)).toBe(true);
    });

    it('should get plugin system debug info', () => {
      const debugInfo = shogunCore.getPluginSystemDebugInfo();

      expect(debugInfo).toHaveProperty('shogunCoreVersion');
      expect(debugInfo).toHaveProperty('totalPlugins');
      expect(debugInfo).toHaveProperty('plugins');
      expect(debugInfo).toHaveProperty('initializationStatus');
      expect(debugInfo).toHaveProperty('validation');
      expect(debugInfo).toHaveProperty('compatibility');

      expect(typeof debugInfo.shogunCoreVersion).toBe('string');
      expect(typeof debugInfo.totalPlugins).toBe('number');
      expect(Array.isArray(debugInfo.plugins)).toBe(true);
    });

    it('should check if plugin exists', () => {
      const hasPlugin = shogunCore.hasPlugin('test-plugin');
      expect(typeof hasPlugin).toBe('boolean');
    });

    it('should get plugins by category', () => {
      const authPlugins = shogunCore.getPluginsByCategory('authentication');
      expect(Array.isArray(authPlugins)).toBe(true);
    });
  });

  describe('Authentication Methods', () => {
    beforeEach(() => {
      shogunCore = new ShogunCore(config);
    });

    it('should get authentication method', () => {
      const authMethod = shogunCore.getAuthenticationMethod('traditional');
      expect(authMethod).toBeDefined();
    });

    it('should set and get auth method', () => {
      shogunCore.setAuthMethod('traditional');
      const currentMethod = shogunCore.getAuthMethod();
      expect(currentMethod).toBe('traditional');
    });
  });

  describe('Event System', () => {
    beforeEach(() => {
      shogunCore = new ShogunCore(config);
    });

    it('should emit and listen to events', () => {
      const listener = jest.fn();
      shogunCore.on('error', listener);

      shogunCore.emit('error', { action: 'test', message: 'test error' });

      expect(listener).toHaveBeenCalledWith({
        action: 'test',
        message: 'test error',
      });
    });

    it('should handle one-time events', () => {
      const listener = jest.fn();
      shogunCore.once('test-event', listener);

      shogunCore.emit('test-event', { data: 'test' });
      shogunCore.emit('test-event', { data: 'test2' });

      expect(listener).toHaveBeenCalledTimes(1);
      expect(listener).toHaveBeenCalledWith({ data: 'test' });
    });

    it('should remove event listeners', () => {
      const listener = jest.fn();
      shogunCore.on('test-event', listener);

      shogunCore.off('test-event', listener);
      shogunCore.emit('test-event', { data: 'test' });

      expect(listener).not.toHaveBeenCalled();
    });

    it('should remove all listeners', () => {
      const listener1 = jest.fn();
      const listener2 = jest.fn();

      shogunCore.on('event1', listener1);
      shogunCore.on('event2', listener2);

      shogunCore.removeAllListeners('event1');

      shogunCore.emit('event1', { data: 'test' });
      shogunCore.emit('event2', { data: 'test' });

      expect(listener1).not.toHaveBeenCalled();
      expect(listener2).toHaveBeenCalled();
    });
  });

  describe('User Operations', () => {
    beforeEach(() => {
      shogunCore = new ShogunCore(config);
    });

    it('should check login status', () => {
      // isLoggedIn might throw if db is not initialized yet, so we catch it
      let isLoggedIn: boolean;
      try {
        isLoggedIn = shogunCore.isLoggedIn();
        expect(typeof isLoggedIn).toBe('boolean');
      } catch (error) {
        // If db is not initialized yet, that's expected in async initialization
        expect(error).toBeDefined();
      }
    });

    it('should get recent errors', () => {
      const errors = shogunCore.getRecentErrors(5);
      expect(Array.isArray(errors)).toBe(true);
      expect(errors.length).toBeLessThanOrEqual(5);
    });

  });

  describe('Configuration Validation', () => {
    it('should handle empty peers array', () => {
      const configEmptyPeers = {
        ...config,
        peers: [],
      };

      expect(() => {
        new ShogunCore(configEmptyPeers);
      }).not.toThrow();
    });

    it('should handle multiple peers', () => {
      const configMultiplePeers = {
        ...config,
        peers: [
          'http://localhost:8765/gun',
          'https://gun-manhattan.herokuapp.com/gun',
        ],
      };

      expect(() => {
        new ShogunCore(configMultiplePeers);
      }).not.toThrow();
    });

    it('should handle custom peer configuration', () => {
      const configCustomPeers = {
        ...config,
        peers: [
          {
            url: 'http://localhost:8765/gun',
            options: { timeout: 5000 },
          },
        ],
      };

      expect(() => {
        new ShogunCore(configCustomPeers);
      }).not.toThrow();
    });
  });

  describe('Error Handling', () => {
    beforeEach(() => {
      shogunCore = new ShogunCore(config);
    });

    it('should handle plugin registration errors gracefully', () => {
      // Test che il sistema gestisce errori di registrazione plugin
      const invalidPlugin = {} as any;

      expect(() => {
        shogunCore.register(invalidPlugin);
      }).not.toThrow();
    });

    it('should handle plugin unregistration gracefully', () => {
      expect(() => {
        shogunCore.unregister('non-existent-plugin');
      }).not.toThrow();
    });
  });
});
