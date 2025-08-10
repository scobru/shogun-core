// @ts-nocheck
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
    /**
     * Inizializza il plugin con un'istanza di ShogunCore
     * @param core Istanza di ShogunCore
     */
    initialize(core) {
        this.core = core;
    }
    /**
     * Distrugge il plugin e libera le risorse
     */
    destroy() {
        try {
            // Emetti evento di distruzione
            this.emit("destroyed", {
                name: this.name,
                version: this.version,
            });
            this.core = null;
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
