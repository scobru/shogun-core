import { ShogunCore } from "../index";
import { ShogunPlugin } from "../types/plugin";
import { PluginCategory } from "../types/shogun";
/**
 * Classe base per tutti i plugin di ShogunCore
 * Fornisce funzionalità comuni e implementazione base dell'interfaccia ShogunPlugin
 */
export declare abstract class BasePlugin implements ShogunPlugin {
    /** Nome univoco del plugin - deve essere implementato dalle sottoclassi */
    abstract name: string;
    /** Versione del plugin - deve essere implementata dalle sottoclassi */
    abstract version: string;
    /** Descrizione opzionale del plugin */
    description?: string;
    /** Categoria del plugin */
    _category?: PluginCategory;
    /** Riferimento all'istanza di ShogunCore */
    protected core: ShogunCore | null;
    /**
     * Inizializza il plugin con un'istanza di ShogunCore
     * @param core Istanza di ShogunCore
     */
    initialize(core: ShogunCore): void;
    /**
     * Distrugge il plugin e libera le risorse
     */
    destroy(): void;
    /**
     * Verifica che il plugin sia stato inizializzato prima di usare il core
     * @throws Error se il plugin non è stato inizializzato
     * @returns L'istanza di ShogunCore non null
     */
    protected assertInitialized(): ShogunCore;
}
