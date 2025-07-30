"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BasePlugin = void 0;
const eventEmitter_1 = require("../utils/eventEmitter");
/**
 * Classe base per tutti i plugin di ShogunCore
 * Fornisce funzionalità comuni e implementazione base dell'interfaccia ShogunPlugin
 */
class BasePlugin extends eventEmitter_1.EventEmitter {
    /** Descrizione opzionale del plugin */
    description;
    /** Categoria del plugin */
    _category;
    /** Riferimento all'istanza di ShogunCore */
    core = null;
    /** Token dell'app */
    appToken;
    /**
     * Inizializza il plugin con un'istanza di ShogunCore
     * @param core Istanza di ShogunCore
     */
    initialize(core, appToken) {
        try {
            if (!core) {
                throw new Error("ShogunCore instance is required for plugin initialization");
            }
            console.log(`[${this.name}] Initializing plugin...`);
            this.core = core;
            this.appToken = appToken;
            console.log(`[${this.name}] Plugin initialized successfully`);
            // Emetti evento di inizializzazione
            this.emit("initialized", {
                name: this.name,
                version: this.version,
                category: this._category,
            });
        }
        catch (error) {
            console.error(`[${this.name}] Failed to initialize plugin:`, error);
            throw new Error(`Failed to initialize plugin ${this.name}: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    /**
     * Distrugge il plugin e libera le risorse
     */
    destroy() {
        try {
            console.log(`[${this.name}] Destroying plugin...`);
            // Emetti evento di distruzione
            this.emit("destroyed", {
                name: this.name,
                version: this.version,
            });
            this.core = null;
            this.appToken = undefined;
            console.log(`[${this.name}] Plugin destroyed successfully`);
        }
        catch (error) {
            console.error(`[${this.name}] Error during plugin destruction:`, error);
        }
    }
    /**
     * Verifica che il plugin sia stato inizializzato prima di usare il core
     * @throws Error se il plugin non è stato inizializzato
     * @returns L'istanza di ShogunCore non null
     */
    assertInitialized() {
        if (!this.core) {
            throw new Error(`Plugin ${this.name} not initialized`);
        }
        return this.core;
    }
}
exports.BasePlugin = BasePlugin;
