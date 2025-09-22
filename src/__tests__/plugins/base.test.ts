import { BasePlugin } from "../../plugins/base";
import { PluginCategory } from "../../interfaces/shogun";

// Create a concrete implementation of BasePlugin for testing
class TestPlugin extends BasePlugin {
  name = "test-plugin";
  version = "1.0.0";
  description = "A test plugin for unit testing";
  _category = PluginCategory.Utility;

  // Add a test method that uses assertInitialized
  testMethod() {
    const core = this.assertInitialized();
    return core;
  }
}

describe("BasePlugin", () => {
  let plugin: TestPlugin;
  let mockCore: any;

  beforeEach(() => {
    plugin = new TestPlugin();
    mockCore = {
      gun: {},
      db: {},
      rx: {},
      storage: {},
      config: {},
      on: jest.fn(),
      off: jest.fn(),
      emit: jest.fn(),
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("constructor", () => {
    it("should create a plugin instance with correct properties", () => {
      expect(plugin.name).toBe("test-plugin");
      expect(plugin.version).toBe("1.0.0");
      expect(plugin.description).toBe("A test plugin for unit testing");
      expect(plugin._category).toBe(PluginCategory.Utility);
      expect(plugin.core).toBeNull();
    });

    it("should extend EventEmitter", () => {
      expect(plugin.on).toBeDefined();
      expect(plugin.off).toBeDefined();
      expect(plugin.emit).toBeDefined();
      expect(typeof plugin.on).toBe("function");
      expect(typeof plugin.off).toBe("function");
      expect(typeof plugin.emit).toBe("function");
    });
  });

  describe("initialize", () => {
    it("should set the core reference", () => {
      expect(plugin.core).toBeNull();

      plugin.initialize(mockCore);

      expect(plugin.core).toBe(mockCore);
    });

    it("should allow re-initialization with different core", () => {
      const mockCore2 = { ...mockCore, id: "core2" };

      plugin.initialize(mockCore);
      expect(plugin.core).toBe(mockCore);

      plugin.initialize(mockCore2);
      expect(plugin.core).toBe(mockCore2);
    });
  });

  describe("destroy", () => {
    it("should emit destroyed event and clear core reference", () => {
      const mockListener = jest.fn();
      plugin.on("destroyed", mockListener);

      plugin.initialize(mockCore);
      expect(plugin.core).toBe(mockCore);

      plugin.destroy();

      expect(mockListener).toHaveBeenCalledWith({
        name: "test-plugin",
        version: "1.0.0",
      });
      expect(plugin.core).toBeNull();
    });

    it("should handle errors during destruction gracefully", () => {
      const consoleSpy = jest
        .spyOn(console, "error")
        .mockImplementation(() => {});

      class ErrorPlugin extends BasePlugin {
        name = "error-plugin";
        version = "1.0.0";

        destroy(): void {
          super.destroy();
          throw new Error("Test error during destruction");
        }
      }

      const errorPlugin = new ErrorPlugin();
      errorPlugin.initialize(mockCore);

      // The error should be thrown and not caught by the parent's try-catch
      expect(() => errorPlugin.destroy()).toThrow(
        "Test error during destruction",
      );

      // The console.error should not be called because the error is thrown after super.destroy()
      expect(consoleSpy).not.toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    it("should work even if not initialized", () => {
      expect(plugin.core).toBeNull();

      expect(() => plugin.destroy()).not.toThrow();

      expect(plugin.core).toBeNull();
    });
  });

  describe("assertInitialized", () => {
    it("should return core when plugin is initialized", () => {
      plugin.initialize(mockCore);

      const result = plugin.testMethod();

      expect(result).toBe(mockCore);
    });

    it("should throw error when plugin is not initialized", () => {
      expect(plugin.core).toBeNull();

      expect(() => plugin.testMethod()).toThrow(
        "Plugin test-plugin not initialized",
      );
    });

    it("should throw error when core is null after initialization", () => {
      plugin.initialize(mockCore);
      plugin.core = null;

      expect(() => plugin.testMethod()).toThrow(
        "Plugin test-plugin not initialized",
      );
    });
  });

  describe("event emitter functionality", () => {
    it("should emit and handle custom events", () => {
      const mockListener = jest.fn();
      const eventData = { test: "data" };

      plugin.on("custom-event", mockListener);
      const result = plugin.emit("custom-event", eventData);

      expect(result).toBe(true);
      expect(mockListener).toHaveBeenCalledWith(eventData);
    });

    it("should handle multiple listeners", () => {
      const mockListener1 = jest.fn();
      const mockListener2 = jest.fn();
      const eventData = { test: "data" };

      plugin.on("multi-event", mockListener1);
      plugin.on("multi-event", mockListener2);

      const result = plugin.emit("multi-event", eventData);

      expect(result).toBe(true);
      expect(mockListener1).toHaveBeenCalledWith(eventData);
      expect(mockListener2).toHaveBeenCalledWith(eventData);
    });

    it("should remove listeners correctly", () => {
      const mockListener = jest.fn();
      const eventData = { test: "data" };

      plugin.on("remove-event", mockListener);
      plugin.emit("remove-event", eventData);
      expect(mockListener).toHaveBeenCalledTimes(1);

      plugin.off("remove-event", mockListener);
      plugin.emit("remove-event", eventData);
      expect(mockListener).toHaveBeenCalledTimes(1); // Should not be called again
    });

    it("should return false when no listeners are attached", () => {
      const result = plugin.emit("no-listeners", {});
      expect(result).toBe(false);
    });
  });

  describe("plugin lifecycle", () => {
    it("should handle complete plugin lifecycle", () => {
      const lifecycleEvents: any[] = [];
      const mockListener = jest.fn((data: any) => {
        lifecycleEvents.push(data);
      });

      plugin.on("destroyed", mockListener);

      plugin.initialize(mockCore);
      expect(plugin.core).toBe(mockCore);

      plugin.destroy();
      expect(plugin.core).toBeNull();

      // Check that the event was emitted with the correct data
      expect(mockListener).toHaveBeenCalledWith({
        name: "test-plugin",
        version: "1.0.0",
      });

      // Should throw after destruction
      expect(() => plugin.testMethod()).toThrow(
        "Plugin test-plugin not initialized",
      );
    });
  });

  describe("abstract properties", () => {
    it("should require name and version to be implemented", () => {
      // This test ensures that abstract properties are properly enforced
      // The TestPlugin implementation provides these, so this should work
      expect(plugin.name).toBeDefined();
      expect(plugin.version).toBeDefined();
      expect(typeof plugin.name).toBe("string");
      expect(typeof plugin.version).toBe("string");
    });
  });

  describe("optional properties", () => {
    it("should handle optional description property", () => {
      class MinimalPlugin extends BasePlugin {
        name = "minimal-plugin";
        version = "1.0.0";
        // No description or category
      }

      const minimalPlugin = new MinimalPlugin();

      expect(minimalPlugin.name).toBe("minimal-plugin");
      expect(minimalPlugin.version).toBe("1.0.0");
      expect(minimalPlugin.description).toBeUndefined();
      expect(minimalPlugin._category).toBeUndefined();
    });

    it("should handle optional category property", () => {
      class CategoryPlugin extends BasePlugin {
        name = "category-plugin";
        version = "1.0.0";
        _category = PluginCategory.Authentication;
      }

      const categoryPlugin = new CategoryPlugin();

      expect(categoryPlugin._category).toBe(PluginCategory.Authentication);
    });
  });
});
