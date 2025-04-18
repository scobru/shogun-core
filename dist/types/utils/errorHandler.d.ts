import { LogLevel } from "../types/common";
/**
 * Tipi di errore che possono verificarsi nell'applicazione
 */
export declare enum ErrorType {
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
    GENERAL = "GENERAL"
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
export declare function createError(type: ErrorType, code: string, message: string, originalError?: Error | unknown): ShogunError;
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
export declare function handleError(error: any, options?: ErrorOptions): ErrorResult | any;
/**
 * Gestore centralizzato per errori
 */
export declare class ErrorHandler {
    private static errors;
    private static maxErrors;
    private static listeners;
    /**
     * Gestisce un errore registrandolo e notificando gli ascoltatori
     * @param error - L'errore da gestire
     */
    static handleError(error: ShogunError): void;
    /**
     * Gestisce un errore grezzo convertendolo in ShogunError
     * @param type - Tipo errore
     * @param code - Codice errore
     * @param message - Messaggio errore
     * @param originalError - Errore originale
     */
    static handle(type: ErrorType, code: string, message: string, originalError?: Error | unknown, logLevel?: LogLevel): ShogunError;
    /**
     * Recupera gli ultimi N errori
     * @param count - Numero di errori da recuperare
     * @returns Lista degli errori più recenti
     */
    static getRecentErrors(count?: number): ShogunError[];
    /**
     * Aggiunge un ascoltatore per gli errori
     * @param listener - Funzione che verrà chiamata quando si verifica un errore
     */
    static addListener(listener: (error: ShogunError) => void): void;
    /**
     * Rimuove un ascoltatore per gli errori
     * @param listener - Funzione da rimuovere
     */
    static removeListener(listener: (error: ShogunError) => void): void;
    /**
     * Notifica tutti gli ascoltatori di un errore
     * @param error - Errore da notificare
     */
    private static notifyListeners;
    /**
     * Funzione helper per formattare messaggi di errore dagli errori nativi
     * @param error - Errore da formattare
     * @returns Messaggio di errore formattato
     */
    static formatError(error: Error | unknown): string;
    /**
     * Error handling with retry logic
     */
    static withRetry<T>(fn: () => Promise<T>, errorType: ErrorType, errorCode: string, maxRetries?: number, retryDelay?: number): Promise<T>;
}
