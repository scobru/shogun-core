import { ShogunCore } from "../core";
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
   * Metodo opzionale per inizializzare il plugin
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
  getPlugin<T = ShogunPlugin>(name: string): T | undefined;

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

  /**
   * Ottiene informazioni su tutti i plugin registrati
   * @returns Array di oggetti con informazioni sui plugin
   */
  getPluginsInfo(): Array<{
    name: string;
    version: string;
    category?: PluginCategory;
    description?: string;
  }>;

  /**
   * Ottiene il numero totale di plugin registrati
   * @returns Numero di plugin registrati
   */
  getPluginCount(): number;

  /**
   * Verifica se tutti i plugin sono inizializzati correttamente
   * @returns Oggetto con stato di inizializzazione per ogni plugin
   */
  getPluginsInitializationStatus(): Record<
    string,
    { initialized: boolean; error?: string }
  >;

  /**
   * Valida l'integrità del sistema di plugin
   * @returns Oggetto con risultati della validazione
   */
  validatePluginSystem(): {
    totalPlugins: number;
    initializedPlugins: number;
    failedPlugins: string[];
    warnings: string[];
  };

  /**
   * Tenta di reinizializzare i plugin falliti
   * @returns Oggetto con risultati della reinizializzazione
   */
  reinitializeFailedPlugins(): {
    success: string[];
    failed: Array<{ name: string; error: string }>;
  };

  /**
   * Verifica la compatibilità dei plugin con la versione corrente di ShogunCore
   * @returns Oggetto con informazioni sulla compatibilità
   */
  checkPluginCompatibility(): {
    compatible: Array<{ name: string; version: string }>;
    incompatible: Array<{ name: string; version: string; reason: string }>;
    unknown: Array<{ name: string; version: string }>;
  };

  /**
   * Ottiene informazioni complete di debug sul sistema di plugin
   * @returns Informazioni complete di debug del sistema di plugin
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
  };
}
