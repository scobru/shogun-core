/**
 * PGP Example - Simple and Immediate
 * Demonstrates basic PGP functionality:
 * - Key generation
 * - Message encryption/decryption
 * - Digital signing
 * - Signature verification
 */
declare function simplePGPExample(): Promise<{
    success: boolean;
    messageDecrypted: boolean;
    signatureValid: boolean;
    error?: undefined;
} | {
    success: boolean;
    error: string;
    messageDecrypted?: undefined;
    signatureValid?: undefined;
}>;
declare function advancedPGPExample(): Promise<{
    success: boolean;
    groupMessaging: boolean;
    keyManagement: boolean;
    exportImport: boolean;
    error?: undefined;
} | {
    success: boolean;
    error: string;
    groupMessaging?: undefined;
    keyManagement?: undefined;
    exportImport?: undefined;
}>;
declare function runAllPGPExamples(): Promise<{
    simple: {
        success: boolean;
        messageDecrypted: boolean;
        signatureValid: boolean;
        error?: undefined;
    } | {
        success: boolean;
        error: string;
        messageDecrypted?: undefined;
        signatureValid?: undefined;
    };
    advanced: {
        success: boolean;
        groupMessaging: boolean;
        keyManagement: boolean;
        exportImport: boolean;
        error?: undefined;
    } | {
        success: boolean;
        error: string;
        groupMessaging?: undefined;
        keyManagement?: undefined;
        exportImport?: undefined;
    };
    demo: {
        success: boolean;
        messageDecrypted: boolean;
        signatureValid: boolean;
        aliceKeyInfo: any;
        bobKeyInfo: any;
        demonstration: {
            keyGeneration: boolean;
            encryption: boolean;
            decryption: boolean;
            signing: boolean;
            verification: boolean;
            keyManagement: boolean;
        };
    };
    allPassed: boolean;
}>;
export { simplePGPExample, advancedPGPExample, runAllPGPExamples };
