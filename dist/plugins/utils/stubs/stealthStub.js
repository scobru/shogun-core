/**
 * Stealth stub for light version
 * Include only basic functionality - advanced features must be lazy loaded
 */
class StealthStub {
    constructor() {
        console.warn("Stealth functionality disabled in light version. Import full version or lazy load Stealth module.");
    }
    formatPublicKey() {
        throw new Error("Stealth functionality disabled in light version");
    }
    async createAccount() {
        throw new Error("Stealth functionality disabled in light version");
    }
    async generateStealthAddress() {
        throw new Error("Stealth functionality disabled in light version");
    }
    async openStealthAddress() {
        throw new Error("Stealth functionality disabled in light version");
    }
    async getPublicKey() {
        throw new Error("Stealth functionality disabled in light version");
    }
    prepareStealthKeysForSaving() {
        throw new Error("Stealth functionality disabled in light version");
    }
    deriveWalletFromSecret() {
        throw new Error("Stealth functionality disabled in light version");
    }
}
export { StealthStub as Stealth };
export default StealthStub;
