"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PluginManager = void 0;
/**
 * Manages plugin registration, validation, and lifecycle
 */
var PluginManager = /** @class */ (function () {
    function PluginManager(core) {
        this.plugins = new Map();
        this.core = core;
    }
    /**
     * Register a plugin with the Shogun SDK
     * @param plugin Plugin instance to register
     * @throws Error if a plugin with the same name is already registered
     */
    PluginManager.prototype.register = function (plugin) {
        try {
            if (!plugin.name) {
                if (typeof console !== "undefined" && console.error) {
                    console.error("Plugin registration failed: Plugin must have a name");
                }
                return;
            }
            if (this.plugins.has(plugin.name)) {
                if (typeof console !== "undefined" && console.warn) {
                    console.warn("Plugin \"".concat(plugin.name, "\" is already registered. Skipping."));
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
                console.error("Error registering plugin \"".concat(plugin.name, "\":"), error);
            }
        }
    };
    /**
     * Unregister a plugin from the Shogun SDK
     * @param name Name of the plugin to unregister
     */
    PluginManager.prototype.unregister = function (name) {
        try {
            var plugin = this.plugins.get(name);
            if (!plugin) {
                if (typeof console !== "undefined" && console.warn) {
                    console.warn("Plugin \"".concat(name, "\" not found for unregistration"));
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
                        console.error("Error destroying plugin \"".concat(name, "\":"), destroyError);
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
                console.error("Error unregistering plugin \"".concat(name, "\":"), error);
            }
            return false;
        }
    };
    /**
     * Retrieve a registered plugin by name
     * @param name Name of the plugin
     * @returns The requested plugin or undefined if not found
     * @template T Type of the plugin or its public interface
     */
    PluginManager.prototype.getPlugin = function (name) {
        if (!name || typeof name !== "string") {
            if (typeof console !== "undefined" && console.warn) {
                console.warn("Invalid plugin name provided to getPlugin");
            }
            return undefined;
        }
        var plugin = this.plugins.get(name);
        if (!plugin) {
            if (typeof console !== "undefined" && console.warn) {
                console.warn("Plugin \"".concat(name, "\" not found"));
            }
            return undefined;
        }
        return plugin;
    };
    /**
     * Get information about all registered plugins
     * @returns Array of plugin information objects
     */
    PluginManager.prototype.getPluginsInfo = function () {
        var pluginsInfo = [];
        this.plugins.forEach(function (plugin) {
            pluginsInfo.push({
                name: plugin.name,
                version: plugin.version || "unknown",
                category: plugin._category,
                description: plugin.description,
            });
        });
        return pluginsInfo;
    };
    /**
     * Get the total number of registered plugins
     * @returns Number of registered plugins
     */
    PluginManager.prototype.getPluginCount = function () {
        return this.plugins.size;
    };
    /**
     * Check if all plugins are properly initialized
     * @returns Object with initialization status for each plugin
     */
    PluginManager.prototype.getPluginsInitializationStatus = function () {
        var status = {};
        this.plugins.forEach(function (plugin, name) {
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
    };
    /**
     * Validate plugin system integrity
     * @returns Object with validation results
     */
    PluginManager.prototype.validatePluginSystem = function () {
        var status = this.getPluginsInitializationStatus();
        var totalPlugins = Object.keys(status).length;
        var initializedPlugins = Object.values(status).filter(function (s) { return s.initialized; }).length;
        var failedPlugins = Object.entries(status)
            .filter(function (_a) {
            var _ = _a[0], s = _a[1];
            return !s.initialized;
        })
            .map(function (_a) {
            var name = _a[0], _ = _a[1];
            return name;
        });
        var warnings = [];
        if (totalPlugins === 0) {
            warnings.push("No plugins registered");
        }
        if (failedPlugins.length > 0) {
            warnings.push("Failed plugins: ".concat(failedPlugins.join(", ")));
        }
        return {
            totalPlugins: totalPlugins,
            initializedPlugins: initializedPlugins,
            failedPlugins: failedPlugins,
            warnings: warnings,
        };
    };
    /**
     * Attempt to reinitialize failed plugins
     * @returns Object with reinitialization results
     */
    PluginManager.prototype.reinitializeFailedPlugins = function () {
        var _this = this;
        var status = this.getPluginsInitializationStatus();
        var failedPlugins = Object.entries(status)
            .filter(function (_a) {
            var _ = _a[0], s = _a[1];
            return !s.initialized;
        })
            .map(function (_a) {
            var name = _a[0], _ = _a[1];
            return name;
        });
        var success = [];
        var failed = [];
        failedPlugins.forEach(function (pluginName) {
            try {
                var plugin = _this.plugins.get(pluginName);
                if (!plugin) {
                    failed.push({ name: pluginName, error: "Plugin not found" });
                    return;
                }
                // Reinizializza il plugin
                plugin.initialize(_this.core);
                success.push(pluginName);
            }
            catch (error) {
                var errorMessage = error instanceof Error ? error.message : String(error);
                failed.push({ name: pluginName, error: errorMessage });
                if (typeof console !== "undefined" && console.error) {
                    console.error("[PluginManager] Failed to reinitialize plugin ".concat(pluginName, ":"), error);
                }
            }
        });
        return { success: success, failed: failed };
    };
    /**
     * Check plugin compatibility with current ShogunCore version
     * @returns Object with compatibility information
     */
    PluginManager.prototype.checkPluginCompatibility = function () {
        var compatible = [];
        var incompatible = [];
        var unknown = [];
        this.plugins.forEach(function (plugin) {
            var pluginInfo = {
                name: plugin.name,
                version: plugin.version || "unknown",
            };
            // Verifica se il plugin ha informazioni di compatibilità
            if (typeof plugin.getCompatibilityInfo === "function") {
                try {
                    var compatibilityInfo = plugin.getCompatibilityInfo();
                    if (compatibilityInfo && compatibilityInfo.compatible) {
                        compatible.push(pluginInfo);
                    }
                    else {
                        incompatible.push(__assign(__assign({}, pluginInfo), { reason: (compatibilityInfo === null || compatibilityInfo === void 0 ? void 0 : compatibilityInfo.reason) || "Unknown compatibility issue" }));
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
        return { compatible: compatible, incompatible: incompatible, unknown: unknown };
    };
    /**
     * Get comprehensive debug information about the plugin system
     * @returns Complete plugin system debug information
     */
    PluginManager.prototype.getPluginSystemDebugInfo = function () {
        var pluginsInfo = this.getPluginsInfo();
        var initializationStatus = this.getPluginsInitializationStatus();
        var plugins = pluginsInfo.map(function (info) {
            var _a, _b;
            return (__assign(__assign({}, info), { initialized: ((_a = initializationStatus[info.name]) === null || _a === void 0 ? void 0 : _a.initialized) || false, error: (_b = initializationStatus[info.name]) === null || _b === void 0 ? void 0 : _b.error }));
        });
        return {
            shogunCoreVersion: "^1.6.6",
            totalPlugins: this.getPluginCount(),
            plugins: plugins,
            initializationStatus: initializationStatus,
            validation: this.validatePluginSystem(),
            compatibility: this.checkPluginCompatibility(),
        };
    };
    /**
     * Check if a plugin is registered
     * @param name Name of the plugin to check
     * @returns true if the plugin is registered, false otherwise
     */
    PluginManager.prototype.hasPlugin = function (name) {
        return this.plugins.has(name);
    };
    /**
     * Get all plugins of a specific category
     * @param category Category of plugins to filter
     * @returns Array of plugins in the specified category
     */
    PluginManager.prototype.getPluginsByCategory = function (category) {
        var result = [];
        this.plugins.forEach(function (plugin) {
            if (plugin._category === category) {
                result.push(plugin);
            }
        });
        return result;
    };
    return PluginManager;
}());
exports.PluginManager = PluginManager;
