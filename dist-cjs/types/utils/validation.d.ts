/**
 * Valida uno username secondo le regole comuni
 */
export declare function validateUsername(username: string): boolean;
/**
 * Valida una email
 */
export declare function validateEmail(email: string): boolean;
/**
 * Valida un provider OAuth supportato
 * @deprecated OAuth has been removed from Shogun Core
 */
export declare function validateProvider(provider: string): boolean;
/**
 * Genera uno username uniforme a partire da provider e userInfo
 * Esempio: google_utente, github_12345, nostr_pubkey, web3_0xabc...
 */
export declare function generateUsernameFromIdentity(provider: string, userInfo: {
    id?: string;
    email?: string;
    name?: string;
}): string;
/**
 * Genera una password deterministica sicura a partire da un salt
 * Usare per OAuth, Web3, Nostr, ecc.
 */
export declare function generateDeterministicPassword(salt: string): string;
