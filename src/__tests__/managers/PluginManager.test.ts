import { PluginManager } from '../../managers/PluginManager';
import { IShogunCore, PluginCategory } from '../../interfaces/shogun';
import { ShogunPlugin } from '../../interfaces/plugin';

describe('PluginManager', () => {
  let pluginManager: PluginManager;
  let mockCore: jest.Mocked<IShogunCore>;

  beforeEach(() => {
    mockCore = {
      emit: jest.fn(),
      on: jest.fn(),
      off: jest.fn(),
      once: jest.fn(),
    } as any;

    pluginManager = new PluginManager(mockCore);

    // Spy on console.error and console.warn to avoid noise in tests and verify calls
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should be defined', () => {
    expect(pluginManager).toBeDefined();
  });

  describe('register', () => {
    it('should register a valid plugin', () => {
      const mockPlugin: ShogunPlugin = {
        name: 'test-plugin',
        version: '1.0.0',
        _category: PluginCategory.Utility,
        initialize: jest.fn(),
      };

      pluginManager.register(mockPlugin);

      expect(pluginManager.hasPlugin('test-plugin')).toBe(true);
      expect(mockPlugin.initialize).toHaveBeenCalledWith(mockCore);
      expect(mockCore.emit).toHaveBeenCalledWith('plugin:registered', {
        name: 'test-plugin',
        version: '1.0.0',
        category: PluginCategory.Utility,
      });
    });

    it('should handle plugin without name', () => {
      const mockPlugin = {
        version: '1.0.0',
        initialize: jest.fn(),
      } as any as ShogunPlugin;

      pluginManager.register(mockPlugin);

      expect(pluginManager.getPluginCount()).toBe(0);
      expect(console.error).toHaveBeenCalledWith(
        'Plugin registration failed: Plugin must have a name',
      );
    });

    it('should handle duplicate registration', () => {
      const mockPlugin: ShogunPlugin = {
        name: 'test-plugin',
        version: '1.0.0',
        initialize: jest.fn(),
      };

      pluginManager.register(mockPlugin);
      pluginManager.register(mockPlugin);

      expect(pluginManager.getPluginCount()).toBe(1);
      expect(console.warn).toHaveBeenCalledWith(
        'Plugin "test-plugin" is already registered. Skipping.',
      );
    });

    it('should handle initialization errors', () => {
      const mockPlugin: ShogunPlugin = {
        name: 'error-plugin',
        version: '1.0.0',
        initialize: jest.fn(() => {
          throw new Error('Init failed');
        }),
      };

      pluginManager.register(mockPlugin);

      expect(console.error).toHaveBeenCalledWith(
        'Error registering plugin "error-plugin":',
        expect.any(Error),
      );
    });

    it('should use default values for version and category if missing', () => {
      const mockPlugin: ShogunPlugin = {
        name: 'minimal-plugin',
      } as any;
      mockPlugin.initialize = jest.fn();

      pluginManager.register(mockPlugin);

      expect(mockCore.emit).toHaveBeenCalledWith('plugin:registered', {
        name: 'minimal-plugin',
        version: 'unknown',
        category: 'unknown',
      });
    });
  });

  describe('unregister', () => {
    it('should unregister an existing plugin', () => {
      const mockPlugin: ShogunPlugin = {
        name: 'test-plugin',
        version: '1.0.0',
        initialize: jest.fn(),
      };

      pluginManager.register(mockPlugin);
      const result = pluginManager.unregister('test-plugin');

      expect(result).toBe(true);
      expect(pluginManager.hasPlugin('test-plugin')).toBe(false);
      expect(mockCore.emit).toHaveBeenCalledWith('plugin:unregistered', {
        name: 'test-plugin',
      });
    });

    it('should call destroy if present', () => {
      const mockPlugin: ShogunPlugin & { destroy: jest.Mock } = {
        name: 'test-plugin',
        version: '1.0.0',
        initialize: jest.fn(),
        destroy: jest.fn(),
      };

      pluginManager.register(mockPlugin);
      pluginManager.unregister('test-plugin');

      expect(mockPlugin.destroy).toHaveBeenCalled();
    });

    it('should return false if plugin not found', () => {
      const result = pluginManager.unregister('non-existent');

      expect(result).toBe(false);
      expect(console.warn).toHaveBeenCalledWith(
        'Plugin "non-existent" not found for unregistration',
      );
    });

    it('should handle errors during destruction', () => {
      const mockPlugin: ShogunPlugin & { destroy: jest.Mock } = {
        name: 'error-plugin',
        version: '1.0.0',
        initialize: jest.fn(),
        destroy: jest.fn(() => {
          throw new Error('Destroy failed');
        }),
      };

      pluginManager.register(mockPlugin);
      const result = pluginManager.unregister('error-plugin');

      expect(result).toBe(true); // Still removed from map
      expect(console.error).toHaveBeenCalledWith(
        'Error destroying plugin "error-plugin":',
        expect.any(Error),
      );
    });
  });

  describe('Retrieval and Info Methods', () => {
    const plugin1: ShogunPlugin = {
      name: 'plugin1',
      version: '1.0.0',
      _category: PluginCategory.Authentication,
      description: 'First plugin',
      initialize: jest.fn(),
    };

    const plugin2: ShogunPlugin = {
      name: 'plugin2',
      version: '2.0.0',
      _category: PluginCategory.Utility,
      initialize: jest.fn(),
    };

    beforeEach(() => {
      pluginManager.register(plugin1);
      pluginManager.register(plugin2);
    });

    it('getPlugin should return the correct plugin', () => {
      expect(pluginManager.getPlugin('plugin1')).toBe(plugin1);
      expect(pluginManager.getPlugin('plugin2')).toBe(plugin2);
    });

    it('getPlugin should return undefined for non-existent plugin', () => {
      expect(pluginManager.getPlugin('non-existent')).toBeUndefined();
      expect(console.warn).toHaveBeenCalledWith(
        'Plugin "non-existent" not found',
      );
    });

    it('getPlugin should handle invalid names', () => {
      expect(pluginManager.getPlugin('')).toBeUndefined();
      expect(pluginManager.getPlugin(null as any)).toBeUndefined();
      expect(console.warn).toHaveBeenCalledWith(
        'Invalid plugin name provided to getPlugin',
      );
    });

    it('hasPlugin should return correct boolean', () => {
      expect(pluginManager.hasPlugin('plugin1')).toBe(true);
      expect(pluginManager.hasPlugin('non-existent')).toBe(false);
    });

    it('getPluginCount should return correct count', () => {
      expect(pluginManager.getPluginCount()).toBe(2);
    });

    it('getPluginsInfo should return info for all plugins', () => {
      const info = pluginManager.getPluginsInfo();
      expect(info).toHaveLength(2);
      expect(info).toContainEqual({
        name: 'plugin1',
        version: '1.0.0',
        category: PluginCategory.Authentication,
        description: 'First plugin',
      });
      expect(info).toContainEqual({
        name: 'plugin2',
        version: '2.0.0',
        category: PluginCategory.Utility,
        description: undefined,
      });
    });

    it('getPluginsByCategory should filter correctly', () => {
      const authPlugins = pluginManager.getPluginsByCategory(
        PluginCategory.Authentication,
      );
      expect(authPlugins).toHaveLength(1);
      expect(authPlugins[0].name).toBe('plugin1');

      const utilityPlugins = pluginManager.getPluginsByCategory(
        PluginCategory.Utility,
      );
      expect(utilityPlugins).toHaveLength(1);
      expect(utilityPlugins[0].name).toBe('plugin2');

      const walletPlugins = pluginManager.getPluginsByCategory(
        PluginCategory.Wallet,
      );
      expect(walletPlugins).toHaveLength(0);
    });
  });

  describe('Health and Status Methods', () => {
    it('getPluginsInitializationStatus should return correct status', () => {
      const mockPlugin1: any = {
        name: 'p1',
        initialize: jest.fn(),
        assertInitialized: jest.fn(),
      };
      const mockPlugin2: any = {
        name: 'p2',
        initialize: jest.fn(),
        core: mockCore,
      };
      const mockPlugin3: any = {
        name: 'p3',
        initialize: jest.fn(),
        assertInitialized: jest.fn(() => {
          throw new Error('Not initialized');
        }),
      };
      const mockPlugin4: any = {
        name: 'p4',
        initialize: jest.fn(),
        // Neither assertInitialized nor core
      };

      pluginManager.register(mockPlugin1);
      pluginManager.register(mockPlugin2);
      pluginManager.register(mockPlugin3);
      pluginManager.register(mockPlugin4);

      const status = pluginManager.getPluginsInitializationStatus();

      expect(status['p1']).toEqual({ initialized: true });
      expect(status['p2']).toEqual({ initialized: true });
      expect(status['p3']).toEqual({
        initialized: false,
        error: 'Not initialized',
      });
      expect(status['p4']).toEqual({
        initialized: false,
        error: 'No core reference found',
      });
    });

    it('validatePluginSystem should return correct validation results', () => {
      // Case 1: No plugins
      const validationEmpty = pluginManager.validatePluginSystem();
      expect(validationEmpty.totalPlugins).toBe(0);
      expect(validationEmpty.warnings).toContain('No plugins registered');

      // Case 2: Mix of initialized and failed
      const mockPlugin1: any = {
        name: 'p1',
        initialize: jest.fn(),
        core: mockCore,
      };
      const mockPlugin2: any = { name: 'p2', initialize: jest.fn() }; // fails because no core/assertInitialized
      pluginManager.register(mockPlugin1);
      pluginManager.register(mockPlugin2);

      const validation = pluginManager.validatePluginSystem();
      expect(validation.totalPlugins).toBe(2);
      expect(validation.initializedPlugins).toBe(1);
      expect(validation.failedPlugins).toContain('p2');
      expect(validation.warnings).toContain('Failed plugins: p2');
    });

    it('reinitializeFailedPlugins should attempt to reinitialize failed plugins', () => {
      const mockPlugin1: any = {
        name: 'p1',
        initialize: jest.fn(),
        core: mockCore,
      };
      const mockPlugin2: any = {
        name: 'p2',
        initialize: jest.fn(),
        // No core initially to mark it as failed
      };

      pluginManager.register(mockPlugin1);
      pluginManager.register(mockPlugin2);

      const result = pluginManager.reinitializeFailedPlugins();

      expect(result.success).toContain('p2');
      expect(mockPlugin2.initialize).toHaveBeenCalledWith(mockCore);
    });

    it('reinitializeFailedPlugins should handle reinitialization errors', () => {
      const mockPlugin: any = {
        name: 'p1',
        initialize: jest
          .fn()
          .mockImplementationOnce(() => {}) // register succeeds
          .mockImplementationOnce(() => {
            throw new Error('Still failing');
          }), // reinitialize fails
      };

      pluginManager.register(mockPlugin);
      // Manually make it "failed" by removing core if it was set (but it wasn't set by mock)

      const result = pluginManager.reinitializeFailedPlugins();

      expect(result.failed).toContainEqual({
        name: 'p1',
        error: 'Still failing',
      });
      expect(console.error).toHaveBeenCalledWith(
        '[PluginManager] Failed to reinitialize plugin p1:',
        expect.any(Error),
      );
    });
  });

  describe('Compatibility and Debug Methods', () => {
    it('checkPluginCompatibility should return correct results', () => {
      const mockPlugin1: any = {
        name: 'p1',
        version: '1.0.0',
        initialize: jest.fn(),
        getCompatibilityInfo: jest.fn(() => ({ compatible: true })),
      };
      const mockPlugin2: any = {
        name: 'p2',
        version: '2.0.0',
        initialize: jest.fn(),
        getCompatibilityInfo: jest.fn(() => ({
          compatible: false,
          reason: 'Too old',
        })),
      };
      const mockPlugin3: any = {
        name: 'p3',
        version: '3.0.0',
        initialize: jest.fn(),
        // No getCompatibilityInfo
      };
      const mockPlugin4: any = {
        name: 'p4',
        version: '4.0.0',
        initialize: jest.fn(),
        getCompatibilityInfo: jest.fn(() => {
          throw new Error('Comp error');
        }),
      };

      pluginManager.register(mockPlugin1);
      pluginManager.register(mockPlugin2);
      pluginManager.register(mockPlugin3);
      pluginManager.register(mockPlugin4);

      const result = pluginManager.checkPluginCompatibility();

      expect(result.compatible).toContainEqual({
        name: 'p1',
        version: '1.0.0',
      });
      expect(result.incompatible).toContainEqual({
        name: 'p2',
        version: '2.0.0',
        reason: 'Too old',
      });
      expect(result.unknown).toContainEqual({ name: 'p3', version: '3.0.0' });
      expect(result.unknown).toContainEqual({ name: 'p4', version: '4.0.0' });
    });

    it('getPluginSystemDebugInfo should return comprehensive info', () => {
      const mockPlugin: any = {
        name: 'test-plugin',
        version: '1.0.0',
        _category: PluginCategory.Utility,
        initialize: jest.fn(),
        core: mockCore,
      };
      pluginManager.register(mockPlugin);

      const debugInfo = pluginManager.getPluginSystemDebugInfo();

      expect(debugInfo).toHaveProperty('shogunCoreVersion');
      expect(debugInfo.totalPlugins).toBe(1);
      expect(debugInfo.plugins).toHaveLength(1);
      expect(debugInfo.plugins[0].name).toBe('test-plugin');
      expect(debugInfo.initializationStatus).toHaveProperty('test-plugin');
      expect(debugInfo.validation).toBeDefined();
      expect(debugInfo.compatibility).toBeDefined();
    });
  });
});
