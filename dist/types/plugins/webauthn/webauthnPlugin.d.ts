import { BasePlugin } from "../base";
import { ShogunCore } from "../../index";
import { WebauthnPluginInterface } from "./types";
import { WebAuthnCredentials, CredentialResult } from "../../types/webauthn";
/**
 * Plugin per la gestione delle funzionalità WebAuthn in ShogunCore
 */
export declare class WebauthnPlugin extends BasePlugin implements WebauthnPluginInterface {
    name: string;
    version: string;
    description: string;
    private webauthn;
    /**
     * @inheritdoc
     */
    initialize(core: ShogunCore): void;
    /**
     * @inheritdoc
     */
    destroy(): void;
    /**
     * Assicura che il modulo WebAuthn sia inizializzato
     * @private
     */
    private assertWebauthn;
    /**
     * @inheritdoc
     */
    isSupported(): boolean;
    /**
     * @inheritdoc
     */
    generateCredentials(username: string, existingCredential?: WebAuthnCredentials | null, isLogin?: boolean): Promise<CredentialResult>;
    /**
     * @inheritdoc
     */
    createAccount(username: string, credentials: WebAuthnCredentials | null, isNewDevice?: boolean): Promise<CredentialResult>;
    /**
     * @inheritdoc
     */
    authenticateUser(username: string, salt: string | null, options?: any): Promise<CredentialResult>;
    /**
     * @inheritdoc
     */
    abortAuthentication(): void;
    /**
     * @inheritdoc
     */
    removeDevice(username: string, credentialId: string, credentials: WebAuthnCredentials): Promise<{
        success: boolean;
        updatedCredentials?: WebAuthnCredentials;
    }>;
}
export { WebauthnPluginInterface } from './types';
