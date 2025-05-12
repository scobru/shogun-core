import { log, logError } from "./logger";
import { LogLevel } from "../types/common";

/**
 * Tipi di errore che possono verificarsi nell'applicazione
 */
export enum ErrorType {
  AUTHENTICATION = "AuthenticationError",
  AUTHORIZATION = "AuthorizationError",
  VALIDATION = "ValidationError",
  NETWORK = "NetworkError",
  DATABASE = "DatabaseError",
  WALLET = "WalletError",
  DID = "DIDError",
  STORAGE = "StorageError",
  ENCRYPTION = "EncryptionError",
  SIGNATURE = "SignatureError",
  ENVIRONMENT = "EnvironmentError",
  SECURITY = "SecurityError",
  GUN = "GunError",
  STEALTH = "StealthError",
  WEBAUTHN = "WebAuthnError",
  PLUGIN = "PluginError",
  UNKNOWN = "UnknownError",
  CONNECTOR = "CONNECTOR",
  GENERAL = "GENERAL",
  CONTRACT = "CONTRACT",
}

/**
 * Interfaccia standard per errori di Shogun
 */
export interface ShogunError {
  type: ErrorType;
  code: string;
  message: string;
  originalError?: Error | unknown;
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
  originalError?: Error | unknown,
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
 * Opzioni di configurazione per il gestore di errori
 */
export interface ErrorOptions {
  message?: string;
  throwError?: boolean;
  logError?: boolean;
  callback?: ErrorCallback;
}

/**
 * Tipo della funzione di callback per errori
 */
export type ErrorCallback = (error: any) => any;

/**
 * Risultato standardizzato per gestione errori
 */
export interface ErrorResult {
  success: boolean;
  message: string;
  error?: any;
}

/**
 * Funzione di utilità per gestire gli errori in modo consistente
 * @param error - L'errore da gestire
 * @param options - Opzioni di configurazione
 * @returns Risultato dell'operazione o il risultato della callback
 */
export function handleError(
  error: any,
  options: ErrorOptions = {},
): ErrorResult | any {
  // Impostazioni di default
  const {
    message = error instanceof Error ? error.message : String(error),
    throwError = false,
    logError = true,
    callback,
  } = options;

  // Log dell'errore se richiesto
  if (logError) {
    console.error(`[ERROR] ${message}`, error);
  }

  // Se è stata fornita una callback, la eseguiamo e restituiamo il suo risultato
  if (typeof callback === "function") {
    return callback(error);
  }

  // Se è richiesto di lanciare l'errore, lo lanciamo
  if (throwError) {
    if (error instanceof Error) {
      throw error;
    } else {
      throw new Error(message);
    }
  }

  // Altrimenti restituiamo un oggetto di risultato standard
  return {
    success: false,
    message,
    error,
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
    originalError?: Error | unknown,
    logLevel: LogLevel = "error",
  ): ShogunError {
    // Create a formatted error message
    const finalMessage = originalError
      ? `${message} - ${this.formatError(originalError)}`
      : message;

    // Log the error
    switch (logLevel) {
      case "debug":
        log(`[${type}.${code}] (DEBUG) ${finalMessage}`);
        break;
      case "warn":
        log(`[${type}.${code}] (WARN) ${finalMessage}`);
        break;
      case "info":
        log(`[${type}.${code}] (INFO) ${finalMessage}`);
        break;
      case "error":
      default:
        log(`[${type}.${code}] (ERROR) ${finalMessage}`);
        if (originalError && originalError instanceof Error) {
          log(originalError.stack || "No stack trace available");
        }
        break;
    }

    const error = createError(type, code, finalMessage, originalError);
    this.handleError(error);
    return error;
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
  static formatError(error: Error | unknown): string {
    if (!error) {
      return "Unknown error";
    }

    if (error instanceof Error) {
      return `${error.name}: ${error.message}`;
    }

    if (typeof error === "string") {
      return error;
    }

    if (typeof error === "object") {
      try {
        return JSON.stringify(error);
      } catch (e) {
        return `Object: ${Object.prototype.toString.call(error)}`;
      }
    }

    return String(error);
  }

  /**
   * Error handling with retry logic
   */
  static async withRetry<T>(
    fn: () => Promise<T>,
    errorType: ErrorType,
    errorCode: string,
    maxRetries = 3,
    retryDelay = 1000,
  ): Promise<T> {
    let lastError: unknown;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;
        const delay = retryDelay * attempt;

        if (attempt < maxRetries) {
          log(
            `Retrying operation after ${delay}ms (attempt ${attempt}/${maxRetries})`,
          );
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }

    // If we got here, all retries failed
    throw this.handle(
      errorType,
      errorCode,
      `Operation failed after ${maxRetries} attempts`,
      lastError,
    );
  }
}
