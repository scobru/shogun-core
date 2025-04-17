import { log, logError } from "./logger";
/**
 * Tipi di errore che possono verificarsi nell'applicazione
 */
export var ErrorType;
(function (ErrorType) {
    ErrorType["AUTHENTICATION"] = "AuthenticationError";
    ErrorType["AUTHORIZATION"] = "AuthorizationError";
    ErrorType["VALIDATION"] = "ValidationError";
    ErrorType["NETWORK"] = "NetworkError";
    ErrorType["DATABASE"] = "DatabaseError";
    ErrorType["WALLET"] = "WalletError";
    ErrorType["DID"] = "DIDError";
    ErrorType["STORAGE"] = "StorageError";
    ErrorType["ENCRYPTION"] = "EncryptionError";
    ErrorType["SIGNATURE"] = "SignatureError";
    ErrorType["ENVIRONMENT"] = "EnvironmentError";
    ErrorType["SECURITY"] = "SecurityError";
    ErrorType["GUN"] = "GunError";
    ErrorType["STEALTH"] = "StealthError";
    ErrorType["WEBAUTHN"] = "WebAuthnError";
    ErrorType["PLUGIN"] = "PluginError";
    ErrorType["UNKNOWN"] = "UnknownError";
    ErrorType["CONNECTOR"] = "CONNECTOR";
    ErrorType["GENERAL"] = "GENERAL";
})(ErrorType || (ErrorType = {}));
/**
 * Wrapper per standardizzare gli errori
 * @param type - Tipo di errore
 * @param code - Codice errore
 * @param message - Messaggio errore
 * @param originalError - Errore originale
 * @returns Un oggetto di errore strutturato
 */
export function createError(type, code, message, originalError) {
    return {
        type,
        code,
        message,
        originalError,
        timestamp: Date.now(),
    };
}
/**
 * Funzione di utilità per gestire gli errori in modo consistente
 * @param error - L'errore da gestire
 * @param options - Opzioni di configurazione
 * @returns Risultato dell'operazione o il risultato della callback
 */
export function handleError(error, options = {}) {
    // Impostazioni di default
    const { message = error instanceof Error ? error.message : String(error), throwError = false, logError = true, callback, } = options;
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
        }
        else {
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
    /**
     * Gestisce un errore registrandolo e notificando gli ascoltatori
     * @param error - L'errore da gestire
     */
    static handleError(error) {
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
    static handle(type, code, message, originalError, logLevel = "error") {
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
    static getRecentErrors(count = 10) {
        return this.errors.slice(-Math.min(count, this.errors.length));
    }
    /**
     * Aggiunge un ascoltatore per gli errori
     * @param listener - Funzione che verrà chiamata quando si verifica un errore
     */
    static addListener(listener) {
        this.listeners.push(listener);
    }
    /**
     * Rimuove un ascoltatore per gli errori
     * @param listener - Funzione da rimuovere
     */
    static removeListener(listener) {
        const index = this.listeners.indexOf(listener);
        if (index !== -1) {
            this.listeners.splice(index, 1);
        }
    }
    /**
     * Notifica tutti gli ascoltatori di un errore
     * @param error - Errore da notificare
     */
    static notifyListeners(error) {
        for (const listener of this.listeners) {
            try {
                listener(error);
            }
            catch (listenerError) {
                logError(`Error in error listener: ${listenerError}`);
            }
        }
    }
    /**
     * Funzione helper per formattare messaggi di errore dagli errori nativi
     * @param error - Errore da formattare
     * @returns Messaggio di errore formattato
     */
    static formatError(error) {
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
            }
            catch (e) {
                return `Object: ${Object.prototype.toString.call(error)}`;
            }
        }
        return String(error);
    }
    /**
     * Error handling with retry logic
     */
    static async withRetry(fn, errorType, errorCode, maxRetries = 3, retryDelay = 1000) {
        let lastError;
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                return await fn();
            }
            catch (error) {
                lastError = error;
                const delay = retryDelay * attempt;
                if (attempt < maxRetries) {
                    log(`Retrying operation after ${delay}ms (attempt ${attempt}/${maxRetries})`);
                    await new Promise((resolve) => setTimeout(resolve, delay));
                }
            }
        }
        // If we got here, all retries failed
        throw this.handle(errorType, errorCode, `Operation failed after ${maxRetries} attempts`, lastError);
    }
}
ErrorHandler.errors = [];
ErrorHandler.maxErrors = 100;
ErrorHandler.listeners = [];
