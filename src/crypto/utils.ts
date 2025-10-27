// Common utility functions for crypto operations
export const validatePassword = (password: string): boolean => {
  // Basic password validation
  return password.length >= 8;
};

export const generateSecurePassword = (length = 16): string => {
  const charset =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
  const randomValues = crypto.getRandomValues(new Uint8Array(length));
  let password = "";

  for (let i = 0; i < length; i++) {
    password += charset[randomValues[i] % charset.length];
  }

  return password;
};

export const measurePerformance = async <T>(
  operation: () => Promise<T>,
  operationName: string,
): Promise<{ result: T; duration: number }> => {
  const start = performance.now();
  const result = await operation();
  const end = performance.now();
  const duration = end - start;

  console.log(`⏱️ ${operationName} took ${duration.toFixed(2)}ms`);

  return { result, duration };
};

export const formatBytes = (bytes: number): string => {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

export const formatDuration = (ms: number): string => {
  if (ms < 1000) return `${ms.toFixed(2)}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(2)}s`;
  return `${(ms / 60000).toFixed(2)}m`;
};

export const createProgressCallback = (
  onProgress: (progress: number) => void,
  total: number,
) => {
  let current = 0;

  return {
    increment: (amount = 1) => {
      current += amount;
      const progress = Math.min((current / total) * 100, 100);
      onProgress(progress);
    },
    setProgress: (progress: number) => {
      current = (progress / 100) * total;
      onProgress(progress);
    },
    complete: () => {
      current = total;
      onProgress(100);
    },
  };
};

export const sanitizeFileName = (fileName: string): string => {
  // Remove or replace invalid characters
  return fileName.replace(/[<>:"/\\|?*]/g, "_");
};

export const getFileExtension = (fileName: string): string => {
  const lastDot = fileName.lastIndexOf(".");
  return lastDot !== -1 ? fileName.substring(lastDot + 1).toLowerCase() : "";
};

export const isTextFile = (fileName: string): boolean => {
  const textExtensions = [
    "txt",
    "md",
    "json",
    "js",
    "ts",
    "html",
    "css",
    "xml",
    "csv",
  ];
  const extension = getFileExtension(fileName);
  return textExtensions.includes(extension);
};

export const createFileHash = async (file: File): Promise<string> => {
  const buffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
};

export const compareFiles = async (
  file1: File,
  file2: File,
): Promise<boolean> => {
  if (file1.size !== file2.size) return false;

  const hash1 = await createFileHash(file1);
  const hash2 = await createFileHash(file2);

  return hash1 === hash2;
};

export const createBackup = (data: any): string => {
  return JSON.stringify(
    {
      data,
      timestamp: new Date().toISOString(),
      version: "1.0",
    },
    null,
    2,
  );
};

export const restoreBackup = (backupString: string): any => {
  const backup = JSON.parse(backupString);

  if (!backup.timestamp || !backup.data) {
    throw new Error("Invalid backup format");
  }

  return backup.data;
};

export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number,
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;

  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number,
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean;

  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};
