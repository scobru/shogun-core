export { DIDStub as ShogunDID };
export default DIDStub;
/**
 * DID stub for light version
 * Include only basic functionality - advanced features must be lazy loaded
 */
declare class DIDStub {
    createDID(): Promise<void>;
    getCurrentUserDID(): Promise<void>;
    resolveDID(): Promise<void>;
    authenticateWithDID(): Promise<void>;
    updateDIDDocument(): Promise<void>;
    deactivateDID(): Promise<void>;
    isValidDID(): void;
}
