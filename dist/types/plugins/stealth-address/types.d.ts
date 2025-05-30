import { ethers } from "ethers";
/**
 * Interface for ephemeral key pairs used in stealth transactions
 */
export interface EphemeralKeyPair {
    pub: string;
    priv: string;
    epub: string;
    epriv: string;
}
/**
 * Interface for stealth transaction data
 */
export interface StealthData {
    recipientPublicKey: string;
    ephemeralKeyPair: EphemeralKeyPair;
    timestamp: number;
    encryptedRandomNumber?: string;
    stealthAddress: string;
}
/**
 * Interface for stealth address generation result
 */
export interface StealthAddressResult {
    stealthAddress: string;
    ephemeralPublicKey: string;
    encryptedRandomNumber: string;
    recipientPublicKey: string;
}
/**
 * Type for log levels in stealth operations
 */
export type LogLevel = "info" | "error" | "debug" | "warn";
/**
 * Interface for structured logging messages
 */
export interface LogMessage {
    timestamp: string;
    level: LogLevel;
    message: string;
    data?: any;
}
/**
 * Interfaccia per il plugin Stealth
 */
export interface StealthPluginInterface {
    /**
     * Genera una coppia di chiavi effimere per comunicazioni stealth
     * @returns Promise con la coppia di chiavi generata
     */
    generateEphemeralKeyPair(): Promise<{
        privateKey: string;
        publicKey: string;
    }>;
    /**
     * Genera un indirizzo stealth utilizzando una chiave pubblica
     * @param publicKey Chiave pubblica del destinatario
     * @param ephemeralPrivateKey Chiave privata effimera per la generazione
     * @returns Promise con il risultato dell'indirizzo stealth
     */
    generateStealthAddress(publicKey: string, ephemeralPrivateKey: string): Promise<StealthAddressResult>;
    /**
     * Scandisce gli indirizzi stealth per verificare se sono indirizzati all'utente
     * @param addresses Array di dati stealth da scansionare
     * @param privateKeyOrSpendKey Chiave privata o chiave di spesa dell'utente
     * @returns Promise con gli indirizzi che appartengono all'utente
     */
    scanStealthAddresses(addresses: StealthData[], privateKeyOrSpendKey: string): Promise<StealthData[]>;
    /**
     * Verifica la proprietà di un indirizzo stealth
     * @param stealthData Dati dell'indirizzo stealth
     * @param privateKeyOrSpendKey Chiave privata o chiave di spesa dell'utente
     * @returns Promise che indica se l'indirizzo appartiene all'utente
     */
    isStealthAddressMine(stealthData: StealthData, privateKeyOrSpendKey: string): Promise<boolean>;
    /**
     * Recupera la chiave privata di un indirizzo stealth
     * @param stealthData Dati dell'indirizzo stealth
     * @param privateKeyOrSpendKey Chiave privata o chiave di spesa dell'utente
     * @returns Promise con la chiave privata recuperata
     */
    getStealthPrivateKey(stealthData: StealthData, privateKeyOrSpendKey: string): Promise<string>;
    /**
     * Apre un indirizzo stealth utilizzando la chiave pubblica effimera e le chiavi dell'utente
     * @param stealthAddress Indirizzo stealth da aprire
     * @param encryptedRandomNumber Numero casuale crittografato
     * @param ephemeralPublicKey Chiave pubblica effimera utilizzata per generare l'indirizzo
     * @param spendingKeyPair Coppia di chiavi di spesa dell'utente
     * @param viewingKeyPair Coppia di chiavi di visualizzazione dell'utente
     * @returns Promise con il wallet dell'indirizzo stealth
     */
    openStealthAddress(stealthAddress: string, encryptedRandomNumber: string, ephemeralPublicKey: string, spendingKeyPair: EphemeralKeyPair, viewingKeyPair: EphemeralKeyPair): Promise<ethers.Wallet>;
}
