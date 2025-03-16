/**
 * Checks if an object is a Gun instance
 */
export const isGunInstance = (gun) => {
    return !!gun?.user && !!gun?.constructor?.SEA;
};
/**
 * Checks if the application is running in a web environment
 */
export const isPlatformWeb = () => {
    return typeof window !== "undefined";
};
/**
 * Creates a timeout that resolves with a passthrough value
 */
export function delay(ms, passthrough) {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve(passthrough);
        }, ms);
    });
}
/**
 * Creates a timeout that rejects with an error
 */
export async function errorAfter(ms, error) {
    return new Promise((_, reject) => {
        setTimeout(() => {
            reject(error);
        }, ms);
    });
}
