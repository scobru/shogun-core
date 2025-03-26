"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isPlatformWeb = exports.isGunInstance = void 0;
exports.delay = delay;
exports.errorAfter = errorAfter;
/**
 * Checks if an object is a Gun instance
 */
const isGunInstance = (gun) => {
    return !!gun?.user && !!gun?.constructor?.SEA;
};
exports.isGunInstance = isGunInstance;
/**
 * Checks if the application is running in a web environment
 */
const isPlatformWeb = () => {
    return typeof window !== "undefined";
};
exports.isPlatformWeb = isPlatformWeb;
/**
 * Creates a timeout that resolves with a passthrough value
 */
function delay(ms, passthrough) {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve(passthrough);
        }, ms);
    });
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
