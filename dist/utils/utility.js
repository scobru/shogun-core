"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isPlatformWeb = void 0;
exports.delay = delay;
exports.errorAfter = errorAfter;
exports.randomString = randomString;
/**
 * Checks if the application is running in a web environment
 */
const isPlatformWeb = () => {
    return typeof window !== "undefined";
};
exports.isPlatformWeb = isPlatformWeb;
/**
 * Delays execution for the specified time
 * @param ms - Milliseconds to delay
 * @param passthrough - Optional value to pass through the promise
 * @returns Promise that resolves with the passthrough value
 */
function delay(ms, passthrough) {
    return new Promise((resolve) => setTimeout(() => resolve(passthrough), ms));
}
/**
 * Creates a timeout that rejects with an error
 */
async function errorAfter(ms, error) {
    return new Promise((_, reject) => {
        setTimeout(() => {
            reject(error);
        }, ms);
    });
}
/**
 * Generates a random string with specified length
 * @param length - Length of the string
 * @returns Random string
 */
function randomString(length = 16) {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let result = "";
    const randValues = new Uint8Array(length);
    crypto.getRandomValues(randValues);
    for (let i = 0; i < length; i++) {
        result += chars.charAt(randValues[i] % chars.length);
    }
    return result;
}
