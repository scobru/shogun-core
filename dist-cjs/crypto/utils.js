"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.throttle = exports.debounce = exports.restoreBackup = exports.createBackup = exports.compareFiles = exports.createFileHash = exports.isTextFile = exports.getFileExtension = exports.sanitizeFileName = exports.createProgressCallback = exports.formatDuration = exports.formatBytes = exports.measurePerformance = exports.generateSecurePassword = exports.validatePassword = void 0;
// Common utility functions for crypto operations
const validatePassword = (password) => {
    // Basic password validation
    return password.length >= 8;
};
exports.validatePassword = validatePassword;
const generateSecurePassword = (length = 16) => {
    const charset = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
    const randomValues = crypto.getRandomValues(new Uint8Array(length));
    let password = "";
    for (let i = 0; i < length; i++) {
        password += charset[randomValues[i] % charset.length];
    }
    return password;
};
exports.generateSecurePassword = generateSecurePassword;
const measurePerformance = async (operation, operationName) => {
    const start = performance.now();
    const result = await operation();
    const end = performance.now();
    const duration = end - start;
    console.log(`⏱️ ${operationName} took ${duration.toFixed(2)}ms`);
    return { result, duration };
};
exports.measurePerformance = measurePerformance;
const formatBytes = (bytes) => {
    if (bytes === 0)
        return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};
exports.formatBytes = formatBytes;
const formatDuration = (ms) => {
    if (ms < 1000)
        return `${ms.toFixed(2)}ms`;
    if (ms < 60000)
        return `${(ms / 1000).toFixed(2)}s`;
    return `${(ms / 60000).toFixed(2)}m`;
};
exports.formatDuration = formatDuration;
const createProgressCallback = (onProgress, total) => {
    let current = 0;
    return {
        increment: (amount = 1) => {
            current += amount;
            const progress = Math.min((current / total) * 100, 100);
            onProgress(progress);
        },
        setProgress: (progress) => {
            current = (progress / 100) * total;
            onProgress(progress);
        },
        complete: () => {
            current = total;
            onProgress(100);
        },
    };
};
exports.createProgressCallback = createProgressCallback;
const sanitizeFileName = (fileName) => {
    // Remove or replace invalid characters
    return fileName.replace(/[<>:"/\\|?*]/g, "_");
};
exports.sanitizeFileName = sanitizeFileName;
const getFileExtension = (fileName) => {
    const lastDot = fileName.lastIndexOf(".");
    return lastDot !== -1 ? fileName.substring(lastDot + 1).toLowerCase() : "";
};
exports.getFileExtension = getFileExtension;
const isTextFile = (fileName) => {
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
    const extension = (0, exports.getFileExtension)(fileName);
    return textExtensions.includes(extension);
};
exports.isTextFile = isTextFile;
const createFileHash = async (file) => {
    const buffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
};
exports.createFileHash = createFileHash;
const compareFiles = async (file1, file2) => {
    if (file1.size !== file2.size)
        return false;
    const hash1 = await (0, exports.createFileHash)(file1);
    const hash2 = await (0, exports.createFileHash)(file2);
    return hash1 === hash2;
};
exports.compareFiles = compareFiles;
const createBackup = (data) => {
    return JSON.stringify({
        data,
        timestamp: new Date().toISOString(),
        version: "1.0",
    }, null, 2);
};
exports.createBackup = createBackup;
const restoreBackup = (backupString) => {
    const backup = JSON.parse(backupString);
    if (!backup.timestamp || !backup.data) {
        throw new Error("Invalid backup format");
    }
    return backup.data;
};
exports.restoreBackup = restoreBackup;
const debounce = (func, wait) => {
    let timeout;
    return (...args) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), wait);
    };
};
exports.debounce = debounce;
const throttle = (func, limit) => {
    let inThrottle;
    return (...args) => {
        if (!inThrottle) {
            func(...args);
            inThrottle = true;
            setTimeout(() => (inThrottle = false), limit);
        }
    };
};
exports.throttle = throttle;
