export { StealthStub as Stealth };
export default StealthStub;
/**
 * Stealth stub for light version
 * Include only basic functionality - advanced features must be lazy loaded
 */
declare class StealthStub {
    formatPublicKey(): void;
    createAccount(): Promise<void>;
    generateStealthAddress(): Promise<void>;
    openStealthAddress(): Promise<void>;
    getPublicKey(): Promise<void>;
    prepareStealthKeysForSaving(): void;
    deriveWalletFromSecret(): void;
}
