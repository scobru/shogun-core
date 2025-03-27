import { log, logError } from "./logger";

/**
 * Tipi di errore che possono verificarsi nell'applicazione
 */
export enum ErrorType {
  AUTHENTICATION = "AUTHENTICATION",
  WALLET = "WALLET",
  GUN = "GUN",
  NETWORK = "NETWORK",
  DID = "DID",
  STORAGE = "STORAGE",
  WEBAUTHN = "WEBAUTHN",
  STEALTH = "STEALTH",
  VALIDATION = "VALIDATION",
  UNKNOWN = "UNKNOWN",
}

/**
 * Interfaccia standard per errori di Shogun
 */
export interface ShogunError {
  type: ErrorType;
  code: string;
  message: string;
  originalError?: Error | any;
  timestamp: number;
}

/**
 * Wrapper per standardizzare gli errori
 * @param type - Tipo di errore
 * @param code - Codice errore
 * @param message - Messaggio errore
 * @param originalError - Errore originale
 * @returns Un oggetto di errore strutturato
 */
export function createError(
  type: ErrorType,
  code: string,
  message: string,
  originalError?: Error | any,
): ShogunError {
  return {
    type,
    code,
    message,
    originalError,
    timestamp: Date.now(),
  };
}

/**
 * Gestore centralizzato per errori
 */
export class ErrorHandler {
  private static errors: ShogunError[] = [];
  private static maxErrors: number = 100;
  private static listeners: Array<(error: ShogunError) => void> = [];

  /**
   * Gestisce un errore registrandolo e notificando gli ascoltatori
   * @param error - L'errore da gestire
   */
  static handleError(error: ShogunError): void {
    // Log l'errore
    logError(`[${error.type}] ${error.code}: ${error.message}`);

    // Conserva l'errore nella memoria
    this.errors.push(error);

    // Mantiene solo gli ultimi maxErrors
    if (this.errors.length > this.maxErrors) {
      this.errors = this.errors.slice(-this.maxErrors);
    }

    // Notifica gli ascoltatori
    this.notifyListeners(error);
  }

  /**
   * Gestisce un errore grezzo convertendolo in ShogunError
   * @param type - Tipo errore
   * @param code - Codice errore
   * @param message - Messaggio errore
   * @param originalError - Errore originale
   */
  static handle(
    type: ErrorType,
    code: string,
    message: string,
    originalError?: Error | any,
  ): void {
    const error = createError(type, code, message, originalError);
    this.handleError(error);
  }

  /**
   * Recupera gli ultimi N errori
   * @param count - Numero di errori da recuperare
   * @returns Lista degli errori più recenti
   */
  static getRecentErrors(count: number = 10): ShogunError[] {
    return this.errors.slice(-Math.min(count, this.errors.length));
  }

  /**
   * Aggiunge un ascoltatore per gli errori
   * @param listener - Funzione che verrà chiamata quando si verifica un errore
   */
  static addListener(listener: (error: ShogunError) => void): void {
    this.listeners.push(listener);
  }

  /**
   * Rimuove un ascoltatore per gli errori
   * @param listener - Funzione da rimuovere
   */
  static removeListener(listener: (error: ShogunError) => void): void {
    const index = this.listeners.indexOf(listener);
    if (index !== -1) {
      this.listeners.splice(index, 1);
    }
  }

  /**
   * Notifica tutti gli ascoltatori di un errore
   * @param error - Errore da notificare
   */
  private static notifyListeners(error: ShogunError): void {
    for (const listener of this.listeners) {
      try {
        listener(error);
      } catch (listenerError) {
        logError(`Error in error listener: ${listenerError}`);
      }
    }
  }

  /**
   * Funzione helper per formattare messaggi di errore dagli errori nativi
   * @param error - Errore da formattare
   * @returns Messaggio di errore formattato
   */
  static formatError(error: Error | any): string {
    if (error instanceof Error) {
      return error.message;
    }
    return String(error);
  }
}
