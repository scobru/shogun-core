import { ShogunCore } from "../index";
import { PluginCategory } from "./shogun";
/**
 * Interfaccia di base per tutti i plugin di ShogunCore
 */
export interface ShogunPlugin {
    /** Nome univoco del plugin */
    name: string;
    /** Versione del plugin */
    version: string;
    /** Descrizione opzionale del plugin */
    description?: string;
    /** Categoria del plugin (opzionale) */
    _category?: PluginCategory;
    /**
     * Inizializza il plugin con un'istanza di ShogunCore
     * @param core Istanza di ShogunCore
     */
    initialize(core: ShogunCore): void;
    /**
     * Metodo opzionale per distruggere il plugin e liberare risorse
     */
    destroy?(): void;
}
/**
 * Interfaccia per la gestione dei plugin in ShogunCore
 */
export interface PluginManager {
    /**
     * Registra un nuovo plugin
     * @param plugin Il plugin da registrare
     */
    register(plugin: ShogunPlugin): void;
    /**
     * Cancella la registrazione di un plugin
     * @param pluginName Nome del plugin da cancellare
     */
    unregister(pluginName: string): void;
    /**
     * Recupera un plugin registrato per nome
     * @param name Nome del plugin
     * @returns Il plugin richiesto o undefined se non trovato
     * @template T Tipo del plugin o dell'interfaccia pubblica del plugin
     */
    getPlugin<T>(name: string): T | undefined;
    /**
     * Verifica se un plugin è registrato
     * @param name Nome del plugin da verificare
     * @returns true se il plugin è registrato, false altrimenti
     */
    hasPlugin(name: string): boolean;
    /**
     * Ottiene tutti i plugin di una determinata categoria
     * @param category Categoria di plugin da filtrare
     * @returns Array di plugin della categoria specificata
     */
    getPluginsByCategory(category: PluginCategory): ShogunPlugin[];
}
