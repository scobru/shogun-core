import { EncryptedFilePackage, DecryptedFileResult } from "./types";
import { deriveKeyFromPassword } from "./symmetric";
import { arrayBufferToBase64, base64ToArrayBuffer } from "./hashing";

export const encryptFile = async (
  fileContent: string | ArrayBuffer | File,
  password: string,
  fileName = "",
): Promise<EncryptedFilePackage> => {
  try {
    const { key, salt } = await deriveKeyFromPassword(password);

    // Generate random IV
    const iv = crypto.getRandomValues(new Uint8Array(12));

    // Convert file content to appropriate format
    let dataToEncrypt: ArrayBuffer;
    if (typeof fileContent === "string") {
      dataToEncrypt = new TextEncoder().encode(fileContent).buffer;
    } else if (fileContent instanceof ArrayBuffer) {
      dataToEncrypt = fileContent;
    } else if (fileContent instanceof File) {
      dataToEncrypt = await fileContent.arrayBuffer();
    } else {
      throw new Error("Unsupported file content type");
    }

    // Encrypt the file content
    const encryptedData = await crypto.subtle.encrypt(
      {
        name: "AES-GCM",
        iv: iv,
      },
      key,
      dataToEncrypt,
    );

    // Return encrypted package
    return {
      encryptedData: arrayBufferToBase64(encryptedData),
      iv: arrayBufferToBase64(iv.buffer),
      salt: arrayBufferToBase64(salt as ArrayBuffer),
      fileName: fileName,
      timestamp: new Date().toISOString(),
      originalSize: dataToEncrypt.byteLength,
    };
  } catch (error) {
    console.error("Error encrypting file:", error);
    throw error instanceof Error ? error : new Error("Unknown error occurred");
  }
};

export const decryptFile = async (
  encryptedPackage: EncryptedFilePackage,
  password: string,
): Promise<DecryptedFileResult> => {
  try {
    const { encryptedData, iv, salt, fileName, originalSize } =
      encryptedPackage;

    // Convert base64 back to ArrayBuffer
    const saltBuffer = base64ToArrayBuffer(salt);
    const ivBuffer = base64ToArrayBuffer(iv);
    const dataBuffer = base64ToArrayBuffer(encryptedData);

    // Derive the same key using password and salt
    const { key } = await deriveKeyFromPassword(password, saltBuffer);

    // Decrypt the data
    const decryptedData = await crypto.subtle.decrypt(
      {
        name: "AES-GCM",
        iv: ivBuffer,
      },
      key,
      dataBuffer,
    );

    return {
      data: decryptedData,
      fileName: fileName,
      originalSize: originalSize,
      decryptedSize: decryptedData.byteLength,
    };
  } catch (error) {
    console.error("Error decrypting file:", error);
    throw new Error("Failed to decrypt file. Check password and try again.");
  }
};

export const encryptTextFile = async (
  textContent: string,
  password: string,
  fileName = "encrypted.txt",
): Promise<EncryptedFilePackage> => {
  return await encryptFile(textContent, password, fileName);
};

export const decryptTextFile = async (
  encryptedPackage: EncryptedFilePackage,
  password: string,
): Promise<DecryptedFileResult & { textContent: string }> => {
  const result = await decryptFile(encryptedPackage, password);
  const textContent = new TextDecoder().decode(result.data);
  return {
    ...result,
    textContent: textContent,
  };
};

export const encryptBinaryFile = async (
  file: File,
  password: string,
): Promise<EncryptedFilePackage> => {
  if (!(file instanceof File)) {
    throw new Error("Expected File object for binary encryption");
  }

  const encryptedPackage = await encryptFile(file, password, file.name);
  return {
    ...encryptedPackage,
    mimeType: file.type,
    fileSize: file.size,
  };
};

export const decryptBinaryFile = async (
  encryptedPackage: EncryptedFilePackage,
  password: string,
): Promise<DecryptedFileResult & { blob: Blob }> => {
  const result = await decryptFile(encryptedPackage, password);
  return {
    ...result,
    blob: new Blob([result.data], {
      type: encryptedPackage.mimeType || "application/octet-stream",
    }),
    mimeType: encryptedPackage.mimeType,
  };
};

export const createSecureFileDownload = (
  data: ArrayBuffer | string | Blob,
  fileName: string,
  mimeType = "application/octet-stream",
): void => {
  let blob: Blob;
  if (data instanceof ArrayBuffer) {
    blob = new Blob([data], { type: mimeType });
  } else if (typeof data === "string") {
    blob = new Blob([data], { type: "text/plain" });
  } else {
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

export const parseEncryptedFilePackage = async (
  file: File,
): Promise<{
  isValid: boolean;
  package?: EncryptedFilePackage;
  metadata?: any;
  error?: string;
}> => {
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
  } catch (error) {
    return {
      isValid: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
      package: undefined,
      metadata: undefined,
    };
  }
};

export const decryptUploadedFile = async (
  encryptedFilePackage: File,
  password: string,
): Promise<DecryptedFileResult> => {
  try {
    // First validate the package
    const validation = await parseEncryptedFilePackage(encryptedFilePackage);
    if (!validation.isValid) {
      throw new Error(`Invalid encrypted file package: ${validation.error}`);
    }

    const { package: pkg, metadata } = validation;

    // Decrypt the file
    const decryptedResult = await decryptFile(pkg!, password);

    // Return enhanced result with metadata
    return {
      ...decryptedResult,
      isTextFile:
        metadata?.type === "text" || metadata?.mimeType?.startsWith("text/"),
      textContent:
        metadata?.type === "text"
          ? new TextDecoder().decode(decryptedResult.data)
          : undefined,
    };
  } catch (error) {
    console.error("Error decrypting uploaded file:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";
    throw new Error(`Failed to decrypt uploaded file: ${errorMessage}`);
  }
};
