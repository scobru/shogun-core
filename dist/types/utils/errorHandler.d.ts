/**
 * Tipi di errore che possono verificarsi nell'applicazione
 */
export declare enum ErrorType {
    AUTHENTICATION = "AUTHENTICATION",
    WALLET = "WALLET",
    GUN = "GUN",
    NETWORK = "NETWORK",
    DID = "DID",
    STORAGE = "STORAGE",
    WEBAUTHN = "WEBAUTHN",
    STEALTH = "STEALTH",
    VALIDATION = "VALIDATION",
    UNKNOWN = "UNKNOWN"
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
export declare function createError(type: ErrorType, code: string, message: string, originalError?: Error | any): ShogunError;
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
    static handle(type: ErrorType, code: string, message: string, originalError?: Error | any): void;
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
    static formatError(error: Error | any): string;
}
