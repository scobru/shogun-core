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
    method?: 'standard' | 'legacy';
    sharedSecret?: string;
}
/**
 * Interface for stealth address generation result
 */
export interface StealthAddressResult {
    stealthAddress: string;
    ephemeralPublicKey: string;
    recipientPublicKey: string;
}
/**
 * Type for log levels in stealth operations
 */
export type LogLevel = 'info' | 'error' | 'debug' | 'warn';
/**
 * Interface for structured logging messages
 */
export interface LogMessage {
    timestamp: string;
    level: LogLevel;
    message: string;
    data?: any;
}
