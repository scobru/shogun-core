import { ShogunCore } from "../core";
import { ShogunPlugin } from "../interfaces/plugin";
import { PluginCategory } from "../interfaces/shogun";
import { EventEmitter } from "../utils/eventEmitter";

/**
 * Classe base per tutti i plugin di ShogunCore
 * Fornisce funzionalità comuni e implementazione base dell'interfaccia ShogunPlugin
 */
export abstract class BasePlugin extends EventEmitter implements ShogunPlugin {
  /** Nome univoco del plugin - deve essere implementato dalle sottoclassi */
  abstract name: string;

  /** Versione del plugin - deve essere implementata dalle sottoclassi */
  abstract version: string;

  /** Descrizione opzionale del plugin */
  description?: string;

  /** Categoria del plugin */
  _category?: PluginCategory;

  /** Riferimento all'istanza di ShogunCore */
  protected core: ShogunCore | null = null;

  /**
   * Inizializza il plugin con un'istanza di ShogunCore
   * @param core Istanza di ShogunCore
   */
  initialize(core: ShogunCore): void {
    this.core = core;
  }

  /**
   * Distrugge il plugin e libera le risorse
   */
  destroy(): void {
    try {
      // Emetti evento di distruzione
      this.emit("destroyed", {
        name: this.name,
        version: this.version,
      });

      this.core = null;
    } catch (error) {
      console.error(`[${this.name}] Error during plugin destruction:`, error);
    }
  }

  /**
   * Verifica che il plugin sia stato inizializzato prima di usare il core
   * @throws Error se il plugin non è stato inizializzato
   * @returns L'istanza di ShogunCore non null
   */
  protected assertInitialized(): ShogunCore {
    if (!this.core) {
      throw new Error(`Plugin ${this.name} not initialized`);
    }
    return this.core;
  }
}
