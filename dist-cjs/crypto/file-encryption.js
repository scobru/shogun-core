"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.decryptUploadedFile = exports.parseEncryptedFilePackage = exports.createSecureFileDownload = exports.decryptBinaryFile = exports.encryptBinaryFile = exports.decryptTextFile = exports.encryptTextFile = exports.decryptFile = exports.encryptFile = void 0;
const symmetric_1 = require("./symmetric");
const hashing_1 = require("./hashing");
const encryptFile = async (fileContent, password, fileName = "") => {
    try {
        const { key, salt } = await (0, symmetric_1.deriveKeyFromPassword)(password);
        // Generate random IV
        const iv = crypto.getRandomValues(new Uint8Array(12));
        // Convert file content to appropriate format
        let dataToEncrypt;
        if (typeof fileContent === "string") {
            dataToEncrypt = new TextEncoder().encode(fileContent).buffer;
        }
        else if (fileContent instanceof ArrayBuffer) {
            dataToEncrypt = fileContent;
        }
        else if (fileContent instanceof File) {
            dataToEncrypt = await fileContent.arrayBuffer();
        }
        else {
            throw new Error("Unsupported file content type");
        }
        // Encrypt the file content
        const encryptedData = await crypto.subtle.encrypt({
            name: "AES-GCM",
            iv: iv,
        }, key, dataToEncrypt);
        // Return encrypted package
        return {
            encryptedData: (0, hashing_1.arrayBufferToBase64)(encryptedData),
            iv: (0, hashing_1.arrayBufferToBase64)(iv.buffer),
            salt: (0, hashing_1.arrayBufferToBase64)(salt),
            fileName: fileName,
            timestamp: new Date().toISOString(),
            originalSize: dataToEncrypt.byteLength,
        };
    }
    catch (error) {
        console.error("Error encrypting file:", error);
        throw error instanceof Error ? error : new Error("Unknown error occurred");
    }
};
exports.encryptFile = encryptFile;
const decryptFile = async (encryptedPackage, password) => {
    try {
        const { encryptedData, iv, salt, fileName, originalSize } = encryptedPackage;
        // Convert base64 back to ArrayBuffer
        const saltBuffer = (0, hashing_1.base64ToArrayBuffer)(salt);
        const ivBuffer = (0, hashing_1.base64ToArrayBuffer)(iv);
        const dataBuffer = (0, hashing_1.base64ToArrayBuffer)(encryptedData);
        // Derive the same key using password and salt
        const { key } = await (0, symmetric_1.deriveKeyFromPassword)(password, saltBuffer);
        // Decrypt the data
        const decryptedData = await crypto.subtle.decrypt({
            name: "AES-GCM",
            iv: ivBuffer,
        }, key, dataBuffer);
        return {
            data: decryptedData,
            fileName: fileName,
            originalSize: originalSize,
            decryptedSize: decryptedData.byteLength,
        };
    }
    catch (error) {
        console.error("Error decrypting file:", error);
        throw new Error("Failed to decrypt file. Check password and try again.");
    }
};
exports.decryptFile = decryptFile;
const encryptTextFile = async (textContent, password, fileName = "encrypted.txt") => {
    return await (0, exports.encryptFile)(textContent, password, fileName);
};
exports.encryptTextFile = encryptTextFile;
const decryptTextFile = async (encryptedPackage, password) => {
    const result = await (0, exports.decryptFile)(encryptedPackage, password);
    const textContent = new TextDecoder().decode(result.data);
    return {
        ...result,
        textContent: textContent,
    };
};
exports.decryptTextFile = decryptTextFile;
const encryptBinaryFile = async (file, password) => {
    if (!(file instanceof File)) {
        throw new Error("Expected File object for binary encryption");
    }
    const encryptedPackage = await (0, exports.encryptFile)(file, password, file.name);
    return {
        ...encryptedPackage,
        mimeType: file.type,
        fileSize: file.size,
    };
};
exports.encryptBinaryFile = encryptBinaryFile;
const decryptBinaryFile = async (encryptedPackage, password) => {
    const result = await (0, exports.decryptFile)(encryptedPackage, password);
    return {
        ...result,
        blob: new Blob([result.data], {
            type: encryptedPackage.mimeType || "application/octet-stream",
        }),
        mimeType: encryptedPackage.mimeType,
    };
};
exports.decryptBinaryFile = decryptBinaryFile;
const createSecureFileDownload = (data, fileName, mimeType = "application/octet-stream") => {
    let blob;
    if (data instanceof ArrayBuffer) {
        blob = new Blob([data], { type: mimeType });
    }
    else if (typeof data === "string") {
        blob = new Blob([data], { type: "text/plain" });
    }
    else {
        blob = data; // Assume it's already a Blob
    }
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
};
exports.createSecureFileDownload = createSecureFileDownload;
const parseEncryptedFilePackage = async (file) => {
    try {
        // Read the file content
        const content = await file.text();
        // Parse as JSON
        const parsed = JSON.parse(content);
        // Validate required properties
        const requiredProperties = [
            "encryptedData",
            "iv",
            "salt",
            "fileName",
            "timestamp",
            "originalSize",
        ];
        for (const prop of requiredProperties) {
            if (!parsed.hasOwnProperty(prop)) {
                throw new Error(`Missing required property: ${prop}`);
            }
        }
        // Validate data types
        if (typeof parsed.encryptedData !== "string") {
            throw new Error("encryptedData must be a base64 string");
        }
        if (typeof parsed.iv !== "string") {
            throw new Error("iv must be a base64 string");
        }
        if (typeof parsed.salt !== "string") {
            throw new Error("salt must be a base64 string");
        }
        if (typeof parsed.fileName !== "string") {
            throw new Error("fileName must be a string");
        }
        if (typeof parsed.originalSize !== "number") {
            throw new Error("originalSize must be a number");
        }
        return {
            isValid: true,
            package: parsed,
            metadata: {
                fileName: parsed.fileName,
                originalSize: parsed.originalSize,
                timestamp: parsed.timestamp,
                type: parsed.type || "unknown",
                mimeType: parsed.mimeType || null,
            },
        };
    }
    catch (error) {
        return {
            isValid: false,
            error: error instanceof Error ? error.message : "Unknown error occurred",
            package: undefined,
            metadata: undefined,
        };
    }
};
exports.parseEncryptedFilePackage = parseEncryptedFilePackage;
const decryptUploadedFile = async (encryptedFilePackage, password) => {
    try {
        // First validate the package
        const validation = await (0, exports.parseEncryptedFilePackage)(encryptedFilePackage);
        if (!validation.isValid) {
            throw new Error(`Invalid encrypted file package: ${validation.error}`);
        }
        const { package: pkg, metadata } = validation;
        // Decrypt the file
        const decryptedResult = await (0, exports.decryptFile)(pkg, password);
        // Return enhanced result with metadata
        return {
            ...decryptedResult,
            isTextFile: metadata?.type === "text" || metadata?.mimeType?.startsWith("text/"),
            textContent: metadata?.type === "text"
                ? new TextDecoder().decode(decryptedResult.data)
                : undefined,
        };
    }
    catch (error) {
        console.error("Error decrypting uploaded file:", error);
        const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
        throw new Error(`Failed to decrypt uploaded file: ${errorMessage}`);
    }
};
exports.decryptUploadedFile = decryptUploadedFile;
