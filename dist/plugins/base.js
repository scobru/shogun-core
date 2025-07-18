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
        this.core = core;
        this.appToken = appToken;
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
