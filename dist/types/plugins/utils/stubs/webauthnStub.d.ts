export { WebauthnStub as Webauthn };
export default WebauthnStub;
/**
 * WebAuthn stub for light version
 * Include only basic functionality - advanced features must be lazy loaded
 */
declare class WebauthnStub {
    isSupported(): boolean;
    validateUsername(): void;
    createAccount(): Promise<void>;
    authenticateUser(): Promise<void>;
    sign(): Promise<void>;
}
