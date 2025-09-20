import { ShogunPlugin } from "../interfaces/plugin";
import { PluginCategory } from "../interfaces/shogun";
import { IShogunCore } from "../interfaces/shogun";
import { CorePlugins } from "../interfaces/shogun";

/**
 * Manages plugin registration, validation, and lifecycle
 */
export class PluginManager {
  private plugins: Map<string, ShogunPlugin> = new Map();
  private core: IShogunCore;

  constructor(core: IShogunCore) {
    this.core = core;
  }

  /**
   * Register a plugin with the Shogun SDK
   * @param plugin Plugin instance to register
   * @throws Error if a plugin with the same name is already registered
   */
  register(plugin: ShogunPlugin): void {
    try {
      if (!plugin.name) {
        if (typeof console !== "undefined" && console.error) {
          console.error("Plugin registration failed: Plugin must have a name");
        }
        return;
      }

      if (this.plugins.has(plugin.name)) {
        if (typeof console !== "undefined" && console.warn) {
          console.warn(
            `Plugin "${plugin.name}" is already registered. Skipping.`,
          );
        }
        return;
      }

      // Initialize plugin with core instance
      plugin.initialize(this.core as any);

      this.plugins.set(plugin.name, plugin);

      this.core.emit("plugin:registered", {
        name: plugin.name,
        version: plugin.version || "unknown",
        category: plugin._category || "unknown",
      });
    } catch (error) {
      if (typeof console !== "undefined" && console.error) {
        console.error(`Error registering plugin "${plugin.name}":`, error);
      }
    }
  }

  /**
   * Unregister a plugin from the Shogun SDK
   * @param name Name of the plugin to unregister
   */
  unregister(name: string): boolean {
    try {
      const plugin = this.plugins.get(name);

      if (!plugin) {
        if (typeof console !== "undefined" && console.warn) {
          console.warn(`Plugin "${name}" not found for unregistration`);
        }
        return false;
      }

      // Destroy plugin if it has a destroy method
      if (typeof (plugin as any).destroy === "function") {
        try {
          (plugin as any).destroy();
        } catch (destroyError) {
          if (typeof console !== "undefined" && console.error) {
            console.error(`Error destroying plugin "${name}":`, destroyError);
          }
        }
      }

      this.plugins.delete(name);

      this.core.emit("plugin:unregistered", {
        name: plugin.name,
      } as any);

      return true;
    } catch (error) {
      if (typeof console !== "undefined" && console.error) {
        console.error(`Error unregistering plugin "${name}":`, error);
      }
      return false;
    }
  }

  /**
   * Retrieve a registered plugin by name
   * @param name Name of the plugin
   * @returns The requested plugin or undefined if not found
   * @template T Type of the plugin or its public interface
   */
  getPlugin<T = ShogunPlugin>(name: string): T | undefined {
    if (!name || typeof name !== "string") {
      if (typeof console !== "undefined" && console.warn) {
        console.warn("Invalid plugin name provided to getPlugin");
      }
      return undefined;
    }

    const plugin = this.plugins.get(name);
    if (!plugin) {
      if (typeof console !== "undefined" && console.warn) {
        console.warn(`Plugin "${name}" not found`);
      }
      return undefined;
    }

    return plugin as T;
  }

  /**
   * Get information about all registered plugins
   * @returns Array of plugin information objects
   */
  getPluginsInfo(): Array<{
    name: string;
    version: string;
    category?: PluginCategory;
    description?: string;
  }> {
    const pluginsInfo: Array<{
      name: string;
      version: string;
      category?: PluginCategory;
      description?: string;
    }> = [];

    this.plugins.forEach((plugin) => {
      pluginsInfo.push({
        name: plugin.name,
        version: plugin.version || "unknown",
        category: plugin._category,
        description: plugin.description,
      });
    });

    return pluginsInfo;
  }

  /**
   * Get the total number of registered plugins
   * @returns Number of registered plugins
   */
  getPluginCount(): number {
    return this.plugins.size;
  }

  /**
   * Check if all plugins are properly initialized
   * @returns Object with initialization status for each plugin
   */
  getPluginsInitializationStatus(): Record<
    string,
    { initialized: boolean; error?: string }
  > {
    const status: Record<string, { initialized: boolean; error?: string }> = {};

    this.plugins.forEach((plugin, name) => {
      try {
        // Verifica se il plugin ha un metodo per controllare l'inizializzazione
        if (typeof (plugin as any).assertInitialized === "function") {
          (plugin as any).assertInitialized();
          status[name] = { initialized: true };
        } else {
          // Fallback: verifica se il plugin ha un riferimento al core
          status[name] = {
            initialized: !!(plugin as any).core,
            error: !(plugin as any).core
              ? "No core reference found"
              : undefined,
          };
        }
      } catch (error) {
        status[name] = {
          initialized: false,
          error: error instanceof Error ? error.message : String(error),
        };
      }
    });

    return status;
  }

  /**
   * Validate plugin system integrity
   * @returns Object with validation results
   */
  validatePluginSystem(): {
    totalPlugins: number;
    initializedPlugins: number;
    failedPlugins: string[];
    warnings: string[];
  } {
    const status = this.getPluginsInitializationStatus();
    const totalPlugins = Object.keys(status).length;
    const initializedPlugins = Object.values(status).filter(
      (s) => s.initialized,
    ).length;
    const failedPlugins = Object.entries(status)
      .filter(([_, s]) => !s.initialized)
      .map(([name, _]) => name);
    const warnings: string[] = [];

    if (totalPlugins === 0) {
      warnings.push("No plugins registered");
    }

    if (failedPlugins.length > 0) {
      warnings.push(`Failed plugins: ${failedPlugins.join(", ")}`);
    }

    return {
      totalPlugins,
      initializedPlugins,
      failedPlugins,
      warnings,
    };
  }

  /**
   * Attempt to reinitialize failed plugins
   * @returns Object with reinitialization results
   */
  reinitializeFailedPlugins(): {
    success: string[];
    failed: Array<{ name: string; error: string }>;
  } {
    const status = this.getPluginsInitializationStatus();
    const failedPlugins = Object.entries(status)
      .filter(([_, s]) => !s.initialized)
      .map(([name, _]) => name);

    const success: string[] = [];
    const failed: Array<{ name: string; error: string }> = [];

    failedPlugins.forEach((pluginName) => {
      try {
        const plugin = this.plugins.get(pluginName);
        if (!plugin) {
          failed.push({ name: pluginName, error: "Plugin not found" });
          return;
        }

        // Reinizializza il plugin
        plugin.initialize(this.core as any);

        success.push(pluginName);
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        failed.push({ name: pluginName, error: errorMessage });
        if (typeof console !== "undefined" && console.error) {
          console.error(
            `[PluginManager] Failed to reinitialize plugin ${pluginName}:`,
            error,
          );
        }
      }
    });

    return { success, failed };
  }

  /**
   * Check plugin compatibility with current ShogunCore version
   * @returns Object with compatibility information
   */
  checkPluginCompatibility(): {
    compatible: Array<{ name: string; version: string }>;
    incompatible: Array<{ name: string; version: string; reason: string }>;
    unknown: Array<{ name: string; version: string }>;
  } {
    const compatible: Array<{ name: string; version: string }> = [];
    const incompatible: Array<{
      name: string;
      version: string;
      reason: string;
    }> = [];
    const unknown: Array<{ name: string; version: string }> = [];

    this.plugins.forEach((plugin) => {
      const pluginInfo = {
        name: plugin.name,
        version: plugin.version || "unknown",
      };

      // Verifica se il plugin ha informazioni di compatibilità
      if (typeof (plugin as any).getCompatibilityInfo === "function") {
        try {
          const compatibilityInfo = (plugin as any).getCompatibilityInfo();
          if (compatibilityInfo && compatibilityInfo.compatible) {
            compatible.push(pluginInfo);
          } else {
            incompatible.push({
              ...pluginInfo,
              reason:
                compatibilityInfo?.reason || "Unknown compatibility issue",
            });
          }
        } catch (error) {
          unknown.push(pluginInfo);
        }
      } else {
        // Se non ha informazioni di compatibilità, considera sconosciuto
        unknown.push(pluginInfo);
      }
    });

    return { compatible, incompatible, unknown };
  }

  /**
   * Get comprehensive debug information about the plugin system
   * @returns Complete plugin system debug information
   */
  getPluginSystemDebugInfo(): {
    shogunCoreVersion: string;
    totalPlugins: number;
    plugins: Array<{
      name: string;
      version: string;
      category?: PluginCategory;
      description?: string;
      initialized: boolean;
      error?: string;
    }>;
    initializationStatus: Record<
      string,
      { initialized: boolean; error?: string }
    >;
    validation: {
      totalPlugins: number;
      initializedPlugins: number;
      failedPlugins: string[];
      warnings: string[];
    };
    compatibility: {
      compatible: Array<{ name: string; version: string }>;
      incompatible: Array<{ name: string; version: string; reason: string }>;
      unknown: Array<{ name: string; version: string }>;
    };
  } {
    const pluginsInfo = this.getPluginsInfo();
    const initializationStatus = this.getPluginsInitializationStatus();

    const plugins = pluginsInfo.map((info) => ({
      ...info,
      initialized: initializationStatus[info.name]?.initialized || false,
      error: initializationStatus[info.name]?.error,
    }));

    return {
      shogunCoreVersion: "^1.6.6",
      totalPlugins: this.getPluginCount(),
      plugins,
      initializationStatus,
      validation: this.validatePluginSystem(),
      compatibility: this.checkPluginCompatibility(),
    };
  }

  /**
   * Check if a plugin is registered
   * @param name Name of the plugin to check
   * @returns true if the plugin is registered, false otherwise
   */
  hasPlugin(name: string): boolean {
    return this.plugins.has(name);
  }

  /**
   * Get all plugins of a specific category
   * @param category Category of plugins to filter
   * @returns Array of plugins in the specified category
   */
  getPluginsByCategory(category: PluginCategory): ShogunPlugin[] {
    const result: ShogunPlugin[] = [];
    this.plugins.forEach((plugin) => {
      if (plugin._category === category) {
        result.push(plugin);
      }
    });
    return result;
  }
}
