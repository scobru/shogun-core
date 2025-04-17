declare class Webauthn {
    constructor(config: any);
    generateChallenge(): Uint8Array<ArrayBuffer>;
    formatUsername(username: any): any;
    static isWebAuthnSupported(): boolean;
    generateCredentials(username: any, userid?: null, isLogin?: boolean): Promise<{
        success: boolean;
        username: any;
        credential: {
            id: string;
            type: string;
        };
    }>;
}
declare const mockPublicKey: Uint8Array<ArrayBuffer>;
declare const mockCredentialId: Uint8Array<ArrayBuffer>;
declare const mockCredential: {
    id: string;
    rawId: Uint8Array<ArrayBuffer>;
    response: {
        clientDataJSON: Uint8Array<ArrayBufferLike>;
        attestationObject: Uint8Array<ArrayBuffer>;
        authenticatorData: Uint8Array<ArrayBuffer>;
    };
    getClientExtensionResults: jest.Mock<any, any, any>;
    type: string;
};
