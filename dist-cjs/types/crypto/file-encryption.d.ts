import { EncryptedFilePackage, DecryptedFileResult } from "./types";
export declare const encryptFile: (fileContent: string | ArrayBuffer | File, password: string, fileName?: string) => Promise<EncryptedFilePackage>;
export declare const decryptFile: (encryptedPackage: EncryptedFilePackage, password: string) => Promise<DecryptedFileResult>;
export declare const encryptTextFile: (textContent: string, password: string, fileName?: string) => Promise<EncryptedFilePackage>;
export declare const decryptTextFile: (encryptedPackage: EncryptedFilePackage, password: string) => Promise<DecryptedFileResult & {
    textContent: string;
}>;
export declare const encryptBinaryFile: (file: File, password: string) => Promise<EncryptedFilePackage>;
export declare const decryptBinaryFile: (encryptedPackage: EncryptedFilePackage, password: string) => Promise<DecryptedFileResult & {
    blob: Blob;
}>;
export declare const createSecureFileDownload: (data: ArrayBuffer | string | Blob, fileName: string, mimeType?: string) => void;
export declare const parseEncryptedFilePackage: (file: File) => Promise<{
    isValid: boolean;
    package?: EncryptedFilePackage;
    metadata?: any;
    error?: string;
}>;
export declare const decryptUploadedFile: (encryptedFilePackage: File, password: string) => Promise<DecryptedFileResult>;
