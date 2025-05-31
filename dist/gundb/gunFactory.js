"use strict";
/**
 * Gun Factory - Ensures Gun is properly initialized with all necessary extensions
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createGunInstance = createGunInstance;
exports.validateGunInstance = validateGunInstance;
exports.getGunInfo = getGunInfo;
const gun_1 = __importDefault(require("gun"));
require("gun/sea"); // SEA extension for user authentication
require("gun/lib/radix");
require("gun/lib/radisk");
require("gun/lib/store");
require("gun/lib/rindexed");
const logger_1 = require("../utils/logger");
/**
 * Creates a properly configured Gun instance with all necessary extensions
 * @param options Gun configuration options
 * @returns Configured Gun instance
 */
function createGunInstance(options = {}) {
    (0, logger_1.log)("Creating Gun instance with factory");
    // Validate Gun is available
    if (!gun_1.default) {
        throw new Error("Gun is not available. Make sure Gun is properly imported.");
    }
    if (typeof gun_1.default !== "function") {
        throw new Error(`Gun must be a function, received: ${typeof gun_1.default}`);
    }
    // Create a minimal configuration that works in both browser and Node.js
    const gunConfig = {};
    // Add peers if provided
    if (options.peers && options.peers.length > 0) {
        gunConfig.peers = options.peers;
    }
    // Only add storage options if explicitly requested and in appropriate environment
    if (typeof window !== "undefined") {
        // Browser environment - enable localStorage
        if (options.localStorage !== false) {
            gunConfig.localStorage = true;
        }
    }
    else {
        // Node.js environment - be more careful with file storage
        if (options.radisk === true) {
            gunConfig.radisk = true;
        }
        if (options.file === true) {
            gunConfig.file = true;
        }
    }
    // Add other options
    if (options.multicast === true) {
        gunConfig.multicast = true;
    }
    if (options.axe === true) {
        gunConfig.axe = true;
    }
    (0, logger_1.log)(`Creating Gun with config:`, gunConfig);
    try {
        // Use Gun constructor with minimal config
        const gunInstance = (0, gun_1.default)(gunConfig);
        // Validate the created instance
        if (!gunInstance) {
            throw new Error("Gun instance creation returned null or undefined");
        }
        if (typeof gunInstance !== "object") {
            throw new Error(`Gun instance must be an object, received: ${typeof gunInstance}`);
        }
        // Validate required methods exist
        if (typeof gunInstance.user !== "function") {
            throw new Error("Gun instance is missing required method: user");
        }
        if (typeof gunInstance.get !== "function") {
            throw new Error("Gun instance is missing required method: get");
        }
        if (typeof gunInstance.on !== "function") {
            throw new Error("Gun instance is missing required method: on");
        }
        if (typeof gunInstance.opt !== "function") {
            throw new Error("Gun instance is missing required method: opt");
        }
        // Test user method specifically
        try {
            const user = gunInstance.user();
            if (!user || typeof user !== "object") {
                throw new Error("Gun user() method did not return a valid user object");
            }
            (0, logger_1.log)("Gun user method validated successfully");
        }
        catch (error) {
            (0, logger_1.logError)("Gun user method validation failed:", error);
            throw new Error(`Gun user method validation failed: ${error}`);
        }
        (0, logger_1.log)("Gun instance created and validated successfully");
        return gunInstance;
    }
    catch (error) {
        (0, logger_1.logError)("Error creating Gun instance:", error);
        throw new Error(`Failed to create Gun instance: ${error}`);
    }
}
/**
 * Validates an existing Gun instance
 * @param gunInstance Gun instance to validate
 * @returns true if valid, throws error if invalid
 */
function validateGunInstance(gunInstance) {
    if (!gunInstance) {
        throw new Error("Gun instance is null or undefined");
    }
    if (typeof gunInstance !== "object") {
        throw new Error(`Gun instance must be an object, received: ${typeof gunInstance}`);
    }
    // Check required methods individually
    if (typeof gunInstance.user !== "function") {
        throw new Error(`Gun instance is missing required method: user (type: ${typeof gunInstance.user})`);
    }
    if (typeof gunInstance.get !== "function") {
        throw new Error(`Gun instance is missing required method: get (type: ${typeof gunInstance.get})`);
    }
    if (typeof gunInstance.on !== "function") {
        throw new Error(`Gun instance is missing required method: on (type: ${typeof gunInstance.on})`);
    }
    if (typeof gunInstance.opt !== "function") {
        throw new Error(`Gun instance is missing required method: opt (type: ${typeof gunInstance.opt})`);
    }
    // Test user method
    try {
        const user = gunInstance.user();
        if (!user || typeof user !== "object") {
            throw new Error("Gun user() method did not return a valid user object");
        }
    }
    catch (error) {
        throw new Error(`Gun user method validation failed: ${error}`);
    }
    return true;
}
/**
 * Gets Gun version and extension information
 * @returns Gun information object
 */
function getGunInfo() {
    const extensions = [];
    // Check for common Gun extensions
    if (gun_1.default.SEA)
        extensions.push("SEA");
    if (gun_1.default.chain)
        extensions.push("chain");
    if (gun_1.default.on)
        extensions.push("on");
    return {
        version: gun_1.default.version,
        extensions,
    };
}
