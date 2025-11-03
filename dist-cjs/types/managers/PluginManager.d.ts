import { ShogunPlugin } from "../interfaces/plugin";
import { PluginCategory } from "../interfaces/shogun";
import { IShogunCore } from "../interfaces/shogun";
/**
 * Manages plugin registration, validation, and lifecycle
 */
export declare class PluginManager {
    private plugins;
    private core;
    constructor(core: IShogunCore);
    /**
     * Register a plugin with the Shogun SDK
     * @param plugin Plugin instance to register
     * @throws Error if a plugin with the same name is already registered
     */
    register(plugin: ShogunPlugin): void;
    /**
     * Unregister a plugin from the Shogun SDK
     * @param name Name of the plugin to unregister
     */
    unregister(name: string): boolean;
    /**
     * Retrieve a registered plugin by name
     * @param name Name of the plugin
     * @returns The requested plugin or undefined if not found
     * @template T Type of the plugin or its public interface
     */
    getPlugin<T = ShogunPlugin>(name: string): T | undefined;
    /**
     * Get information about all registered plugins
     * @returns Array of plugin information objects
     */
    getPluginsInfo(): Array<{
        name: string;
        version: string;
        category?: PluginCategory;
        description?: string;
    }>;
    /**
     * Get the total number of registered plugins
     * @returns Number of registered plugins
     */
    getPluginCount(): number;
    /**
     * Check if all plugins are properly initialized
     * @returns Object with initialization status for each plugin
     */
    getPluginsInitializationStatus(): Record<string, {
        initialized: boolean;
        error?: string;
    }>;
    /**
     * Validate plugin system integrity
     * @returns Object with validation results
     */
    validatePluginSystem(): {
        totalPlugins: number;
        initializedPlugins: number;
        failedPlugins: string[];
        warnings: string[];
    };
    /**
     * Attempt to reinitialize failed plugins
     * @returns Object with reinitialization results
     */
    reinitializeFailedPlugins(): {
        success: string[];
        failed: Array<{
            name: string;
            error: string;
        }>;
    };
    /**
     * Check plugin compatibility with current ShogunCore version
     * @returns Object with compatibility information
     */
    checkPluginCompatibility(): {
        compatible: Array<{
            name: string;
            version: string;
        }>;
        incompatible: Array<{
            name: string;
            version: string;
            reason: string;
        }>;
        unknown: Array<{
            name: string;
            version: string;
        }>;
    };
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
        initializationStatus: Record<string, {
            initialized: boolean;
            error?: string;
        }>;
        validation: {
            totalPlugins: number;
            initializedPlugins: number;
            failedPlugins: string[];
            warnings: string[];
        };
        compatibility: {
            compatible: Array<{
                name: string;
                version: string;
            }>;
            incompatible: Array<{
                name: string;
                version: string;
                reason: string;
            }>;
            unknown: Array<{
                name: string;
                version: string;
            }>;
        };
    };
    /**
     * Check if a plugin is registered
     * @param name Name of the plugin to check
     * @returns true if the plugin is registered, false otherwise
     */
    hasPlugin(name: string): boolean;
    /**
     * Get all plugins of a specific category
     * @param category Category of plugins to filter
     * @returns Array of plugins in the specified category
     */
    getPluginsByCategory(category: PluginCategory): ShogunPlugin[];
}
