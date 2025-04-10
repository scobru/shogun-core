import { ShogunCore } from "../index";
import { ShogunPlugin } from "../types/plugin";

/**
 * Classe base per tutti i plugin di ShogunCore
 * Fornisce funzionalità comuni e implementazione base dell'interfaccia ShogunPlugin
 */
export abstract class BasePlugin implements ShogunPlugin {
  /** Nome univoco del plugin - deve essere implementato dalle sottoclassi */
  abstract name: string;
  
  /** Versione del plugin - deve essere implementata dalle sottoclassi */
  abstract version: string;
  
  /** Descrizione opzionale del plugin */
  description?: string;
  
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
    this.core = null;
  }
  
  /**
   * Verifica che il plugin sia stato inizializzato prima di usare il core
   * @throws Error se il plugin non è stato inizializzato
   */
  protected assertInitialized(): void {
    if (!this.core) {
      throw new Error(`Plugin ${this.name} not initialized`);
    }
  }
} 