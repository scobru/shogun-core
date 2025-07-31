import { BasePlugin } from "../base";
import { ShogunCore } from "../../index";
import { Web3SigningCredential } from "./web3Signer";
import { ConnectionResult, Web3ConectorPluginInterface } from "./types";
import { ethers } from "ethers";
import { AuthResult, SignUpResult } from "../../types/shogun";
import { ISEAPair } from "gun";
/**
 * Plugin per la gestione delle funzionalità Web3 in ShogunCore
 */
export declare class Web3ConnectorPlugin extends BasePlugin implements Web3ConectorPluginInterface {
    name: string;
    version: string;
    description: string;
    private Web3;
    private signer;
    /**
     * @inheritdoc
     */
    initialize(core: ShogunCore): void;
    /**
     * @inheritdoc
     */
    destroy(): void;
    /**
     * Assicura che il modulo Web3 sia inizializzato
     * @private
     */
    private assertMetaMask;
    /**
     * Assicura che il signer sia inizializzato
     * @private
     */
    private assertSigner;
    /**
     * @inheritdoc
     */
    isAvailable(): boolean;
    /**
     * @inheritdoc
     */
    connectMetaMask(): Promise<ConnectionResult>;
    /**
     * @inheritdoc
     */
    generateCredentials(address: string): Promise<ISEAPair>;
    /**
     * @inheritdoc
     */
    cleanup(): void;
    /**
     * @inheritdoc
     */
    setCustomProvider(rpcUrl: string, privateKey: string): void;
    /**
     * @inheritdoc
     */
    getSigner(): Promise<ethers.Signer>;
    /**
     * @inheritdoc
     */
    getProvider(): Promise<ethers.JsonRpcProvider | ethers.BrowserProvider>;
    /**
     * @inheritdoc
     */
    generatePassword(signature: string): Promise<string>;
    /**
     * @inheritdoc
     */
    verifySignature(message: string, signature: string): Promise<string>;
    /**
     * Creates a new Web3 signing credential
     * CONSISTENT with normal Web3 approach
     */
    createSigningCredential(address: string): Promise<Web3SigningCredential>;
    /**
     * Creates an authenticator function for Web3 signing
     */
    createAuthenticator(address: string): (data: any) => Promise<string>;
    /**
     * Creates a derived key pair from Web3 credential
     */
    createDerivedKeyPair(address: string, extra?: string[]): Promise<{
        pub: string;
        priv: string;
        epub: string;
        epriv: string;
    }>;
    /**
     * Signs data with derived keys after Web3 verification
     */
    signWithDerivedKeys(data: any, address: string, extra?: string[]): Promise<string>;
    /**
     * Get signing credential by address
     */
    getSigningCredential(address: string): Web3SigningCredential | undefined;
    /**
     * List all signing credentials
     */
    listSigningCredentials(): Web3SigningCredential[];
    /**
     * Remove a signing credential
     */
    removeSigningCredential(address: string): boolean;
    /**
     * Creates a Gun user from Web3 signing credential
     * This ensures the SAME user is created as with normal approach
     */
    createGunUserFromSigningCredential(address: string): Promise<{
        success: boolean;
        userPub?: string;
        error?: string;
    }>;
    /**
     * Get the Gun user public key for a signing credential
     */
    getGunUserPubFromSigningCredential(address: string): string | undefined;
    /**
     * Get the password (for consistency checking)
     */
    getPassword(address: string): string | undefined;
    /**
     * Verify consistency between oneshot and normal approaches
     * This ensures both approaches create the same Gun user
     */
    verifyConsistency(address: string, expectedUserPub?: string): Promise<{
        consistent: boolean;
        actualUserPub?: string;
        expectedUserPub?: string;
    }>;
    /**
     * Complete oneshot workflow that creates the SAME Gun user as normal approach
     * This is the recommended method for oneshot signing with full consistency
     */
    setupConsistentOneshotSigning(address: string): Promise<{
        credential: Web3SigningCredential;
        authenticator: (data: any) => Promise<string>;
        gunUser: {
            success: boolean;
            userPub?: string;
            error?: string;
        };
        username: string;
        password: string;
    }>;
    /**
     * Login con Web3
     * @param address - Indirizzo Ethereum
     * @returns {Promise<AuthResult>} Risultato dell'autenticazione
     * @description Autentica l'utente usando le credenziali del wallet Web3 dopo la verifica della firma
     */
    login(address: string): Promise<AuthResult>;
    /**
     * Register new user with Web3 wallet
     * @param address - Ethereum address
     * @returns {Promise<SignUpResult>} Registration result
     */
    signUp(address: string): Promise<SignUpResult>;
}
export type { Web3ConectorPluginInterface } from "./types";
