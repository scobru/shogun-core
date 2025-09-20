/**
 * Manages plugin registration, validation, and lifecycle
 */
export class PluginManager {
    plugins = new Map();
    core;
    constructor(core) {
        this.core = core;
    }
    /**
     * Register a plugin with the Shogun SDK
     * @param plugin Plugin instance to register
     * @throws Error if a plugin with the same name is already registered
     */
    register(plugin) {
        try {
            if (!plugin.name) {
                if (typeof console !== "undefined" && console.error) {
                    console.error("Plugin registration failed: Plugin must have a name");
                }
                return;
            }
            if (this.plugins.has(plugin.name)) {
                if (typeof console !== "undefined" && console.warn) {
                    console.warn(`Plugin "${plugin.name}" is already registered. Skipping.`);
                }
                return;
            }
            // Initialize plugin with core instance
            plugin.initialize(this.core);
            this.plugins.set(plugin.name, plugin);
            this.core.emit("plugin:registered", {
                name: plugin.name,
                version: plugin.version || "unknown",
                category: plugin._category || "unknown",
            });
        }
        catch (error) {
            if (typeof console !== "undefined" && console.error) {
                console.error(`Error registering plugin "${plugin.name}":`, error);
            }
        }
    }
    /**
     * Unregister a plugin from the Shogun SDK
     * @param name Name of the plugin to unregister
     */
    unregister(name) {
        try {
            const plugin = this.plugins.get(name);
            if (!plugin) {
                if (typeof console !== "undefined" && console.warn) {
                    console.warn(`Plugin "${name}" not found for unregistration`);
                }
                return false;
            }
            // Destroy plugin if it has a destroy method
            if (typeof plugin.destroy === "function") {
                try {
                    plugin.destroy();
                }
                catch (destroyError) {
                    if (typeof console !== "undefined" && console.error) {
                        console.error(`Error destroying plugin "${name}":`, destroyError);
                    }
                }
            }
            this.plugins.delete(name);
            this.core.emit("plugin:unregistered", {
                name: plugin.name,
            });
            return true;
        }
        catch (error) {
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
    getPlugin(name) {
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
        return plugin;
    }
    /**
     * Get information about all registered plugins
     * @returns Array of plugin information objects
     */
    getPluginsInfo() {
        const pluginsInfo = [];
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
    getPluginCount() {
        return this.plugins.size;
    }
    /**
     * Check if all plugins are properly initialized
     * @returns Object with initialization status for each plugin
     */
    getPluginsInitializationStatus() {
        const status = {};
        this.plugins.forEach((plugin, name) => {
            try {
                // Verifica se il plugin ha un metodo per controllare l'inizializzazione
                if (typeof plugin.assertInitialized === "function") {
                    plugin.assertInitialized();
                    status[name] = { initialized: true };
                }
                else {
                    // Fallback: verifica se il plugin ha un riferimento al core
                    status[name] = {
                        initialized: !!plugin.core,
                        error: !plugin.core
                            ? "No core reference found"
                            : undefined,
                    };
                }
            }
            catch (error) {
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
    validatePluginSystem() {
        const status = this.getPluginsInitializationStatus();
        const totalPlugins = Object.keys(status).length;
        const initializedPlugins = Object.values(status).filter((s) => s.initialized).length;
        const failedPlugins = Object.entries(status)
            .filter(([_, s]) => !s.initialized)
            .map(([name, _]) => name);
        const warnings = [];
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
    reinitializeFailedPlugins() {
        const status = this.getPluginsInitializationStatus();
        const failedPlugins = Object.entries(status)
            .filter(([_, s]) => !s.initialized)
            .map(([name, _]) => name);
        const success = [];
        const failed = [];
        failedPlugins.forEach((pluginName) => {
            try {
                const plugin = this.plugins.get(pluginName);
                if (!plugin) {
                    failed.push({ name: pluginName, error: "Plugin not found" });
                    return;
                }
                // Reinizializza il plugin
                plugin.initialize(this.core);
                success.push(pluginName);
            }
            catch (error) {
                const errorMessage = error instanceof Error ? error.message : String(error);
                failed.push({ name: pluginName, error: errorMessage });
                if (typeof console !== "undefined" && console.error) {
                    console.error(`[PluginManager] Failed to reinitialize plugin ${pluginName}:`, error);
                }
            }
        });
        return { success, failed };
    }
    /**
     * Check plugin compatibility with current ShogunCore version
     * @returns Object with compatibility information
     */
    checkPluginCompatibility() {
        const compatible = [];
        const incompatible = [];
        const unknown = [];
        this.plugins.forEach((plugin) => {
            const pluginInfo = {
                name: plugin.name,
                version: plugin.version || "unknown",
            };
            // Verifica se il plugin ha informazioni di compatibilità
            if (typeof plugin.getCompatibilityInfo === "function") {
                try {
                    const compatibilityInfo = plugin.getCompatibilityInfo();
                    if (compatibilityInfo && compatibilityInfo.compatible) {
                        compatible.push(pluginInfo);
                    }
                    else {
                        incompatible.push({
                            ...pluginInfo,
                            reason: compatibilityInfo?.reason || "Unknown compatibility issue",
                        });
                    }
                }
                catch (error) {
                    unknown.push(pluginInfo);
                }
            }
            else {
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
    getPluginSystemDebugInfo() {
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
    hasPlugin(name) {
        return this.plugins.has(name);
    }
    /**
     * Get all plugins of a specific category
     * @param category Category of plugins to filter
     * @returns Array of plugins in the specified category
     */
    getPluginsByCategory(category) {
        const result = [];
        this.plugins.forEach((plugin) => {
            if (plugin._category === category) {
                result.push(plugin);
            }
        });
        return result;
    }
}
