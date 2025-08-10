// @ts-nocheck
function stryNS_9fa48() {
  var g = typeof globalThis === 'object' && globalThis && globalThis.Math === Math && globalThis || new Function("return this")();
  var ns = g.__stryker__ || (g.__stryker__ = {});
  if (ns.activeMutant === undefined && g.process && g.process.env && g.process.env.__STRYKER_ACTIVE_MUTANT__) {
    ns.activeMutant = g.process.env.__STRYKER_ACTIVE_MUTANT__;
  }
  function retrieveNS() {
    return ns;
  }
  stryNS_9fa48 = retrieveNS;
  return retrieveNS();
}
stryNS_9fa48();
function stryCov_9fa48() {
  var ns = stryNS_9fa48();
  var cov = ns.mutantCoverage || (ns.mutantCoverage = {
    static: {},
    perTest: {}
  });
  function cover() {
    var c = cov.static;
    if (ns.currentTestId) {
      c = cov.perTest[ns.currentTestId] = cov.perTest[ns.currentTestId] || {};
    }
    var a = arguments;
    for (var i = 0; i < a.length; i++) {
      c[a[i]] = (c[a[i]] || 0) + 1;
    }
  }
  stryCov_9fa48 = cover;
  cover.apply(null, arguments);
}
function stryMutAct_9fa48(id) {
  var ns = stryNS_9fa48();
  function isActive(id) {
    if (ns.activeMutant === id) {
      if (ns.hitCount !== void 0 && ++ns.hitCount > ns.hitLimit) {
        throw new Error('Stryker: Hit count limit reached (' + ns.hitCount + ')');
      }
      return true;
    }
    return false;
  }
  stryMutAct_9fa48 = isActive;
  return isActive(id);
}
import { ShogunCore } from "../index";
import { ShogunPlugin } from "../types/plugin";
import { PluginCategory } from "../types/shogun";
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
    if (stryMutAct_9fa48("3016")) {
      {}
    } else {
      stryCov_9fa48("3016");
      this.core = core;
    }
  }

  /**
   * Distrugge il plugin e libera le risorse
   */
  destroy(): void {
    if (stryMutAct_9fa48("3017")) {
      {}
    } else {
      stryCov_9fa48("3017");
      try {
        if (stryMutAct_9fa48("3018")) {
          {}
        } else {
          stryCov_9fa48("3018");
          // Emetti evento di distruzione
          this.emit(stryMutAct_9fa48("3019") ? "" : (stryCov_9fa48("3019"), "destroyed"), stryMutAct_9fa48("3020") ? {} : (stryCov_9fa48("3020"), {
            name: this.name,
            version: this.version
          }));
          this.core = null;
        }
      } catch (error) {
        if (stryMutAct_9fa48("3021")) {
          {}
        } else {
          stryCov_9fa48("3021");
          console.error(stryMutAct_9fa48("3022") ? `` : (stryCov_9fa48("3022"), `[${this.name}] Error during plugin destruction:`), error);
        }
      }
    }
  }

  /**
   * Verifica che il plugin sia stato inizializzato prima di usare il core
   * @throws Error se il plugin non è stato inizializzato
   * @returns L'istanza di ShogunCore non null
   */
  protected assertInitialized(): ShogunCore {
    if (stryMutAct_9fa48("3023")) {
      {}
    } else {
      stryCov_9fa48("3023");
      if (stryMutAct_9fa48("3026") ? false : stryMutAct_9fa48("3025") ? true : stryMutAct_9fa48("3024") ? this.core : (stryCov_9fa48("3024", "3025", "3026"), !this.core)) {
        if (stryMutAct_9fa48("3027")) {
          {}
        } else {
          stryCov_9fa48("3027");
          throw new Error(stryMutAct_9fa48("3028") ? `` : (stryCov_9fa48("3028"), `Plugin ${this.name} not initialized`));
        }
      }
      return this.core;
    }
  }
}