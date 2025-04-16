"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BasePlugin = void 0;
/**
 * Classe base per tutti i plugin di ShogunCore
 * Fornisce funzionalità comuni e implementazione base dell'interfaccia ShogunPlugin
 */
class BasePlugin {
    constructor() {
        /** Riferimento all'istanza di ShogunCore */
        this.core = null;
    }
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
        this.core = null;
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
