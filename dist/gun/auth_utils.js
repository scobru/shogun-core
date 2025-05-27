"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.restrictGunPut = restrictGunPut;
const logger_1 = require("../utils/logger");
/**
 * Adds authorization headers to Gun requests
 * @param gun The Gun instance to restrict
 * @param authToken The authorization token
 * @returns The GunDB instance for chaining
 */
function restrictGunPut(gun, authToken) {
    if (!gun) {
        (0, logger_1.logError)("No Gun instance provided");
        return gun;
    }
    if (!authToken) {
        (0, logger_1.logError)("No auth token provided for Gun requests");
        return gun;
    }
    console.log(`Setting up authorization headers with token: ${authToken.substring(0, 3)}...`);
    gun.on("out", function (ctx) {
        // Only add headers to put operations that are going over the network
        if (ctx.put) {
            // Adds headers for put
            ctx.headers = {
                token: authToken,
                "Content-Type": "application/json",
                Accept: "application/json",
                Authorization: `Bearer ${authToken}`,
            };
            // Debug outgoing request
            console.log(`Adding auth headers to outgoing Gun request`);
        }
        var to = this.to;
        to.next(ctx); // pass to next middleware
    });
    return gun;
}
// Standalone function that can be easily exposed in the browser
if (typeof window !== "undefined") {
    window.restrictGunPut = restrictGunPut;
}
