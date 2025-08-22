"use strict";
/**
 * Example usage of the GunDB Relay class
 * This file demonstrates how to create and manage GunDB relay servers
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.basicRelayExample = basicRelayExample;
exports.productionRelayExample = productionRelayExample;
exports.customRelayExample = customRelayExample;
exports.multipleRelaysExample = multipleRelaysExample;
exports.runExamples = runExamples;
const src_1 = require("../src/");
/**
 * Basic relay server example
 */
async function basicRelayExample() {
    console.log("Starting basic relay server...");
    // Create a basic relay server
    const relay = (0, src_1.createRelay)({
        port: 8765,
        host: "localhost",
        super: false,
        faith: false,
        enableFileStorage: true,
    });
    try {
        // Start the relay server
        await relay.start();
        console.log(`Relay server started at: ${relay.getRelayUrl()}`);
        console.log("Status:", relay.getStatus());
        // Keep the server running for 30 seconds
        setTimeout(async () => {
            await relay.stop();
            console.log("Relay server stopped");
        }, 30000);
    }
    catch (error) {
        console.error("Failed to start relay server:", error);
    }
}
/**
 * Production relay server example
 */
async function productionRelayExample() {
    console.log("Starting production relay server...");
    // Create a production relay server using presets
    const relay = (0, src_1.createRelay)(src_1.RelayPresets.production);
    try {
        await relay.start();
        console.log(`Production relay server started at: ${relay.getRelayUrl()}`);
        console.log("Status:", relay.getStatus());
        // Monitor health every 10 seconds
        const healthInterval = setInterval(async () => {
            const isHealthy = await relay.healthCheck();
            console.log(`Health check: ${isHealthy ? "OK" : "FAILED"}`);
            if (!isHealthy) {
                clearInterval(healthInterval);
                await relay.stop();
            }
        }, 10000);
    }
    catch (error) {
        console.error("Failed to start production relay server:", error);
    }
}
/**
 * Custom relay server with WebSocket support
 */
async function customRelayExample() {
    console.log("Starting custom relay server with WebSocket...");
    const relay = (0, src_1.createRelay)({
        port: 8766,
        host: "0.0.0.0",
        super: true,
        faith: true,
        enableFileStorage: true,
        ws: {
            // WebSocket server options
            perMessageDeflate: false,
            clientTracking: true,
        },
        http: {
            // HTTP server options
            timeout: 30000,
        },
        log: (message, ...args) => {
            console.log(`[RELAY] ${message}`, ...args);
        },
    });
    try {
        await relay.start();
        console.log(`Custom relay server started at: ${relay.getRelayUrl()}`);
        // Update configuration dynamically
        setTimeout(() => {
            relay.updateConfig({
                log: (message, ...args) => {
                    console.log(`[RELAY-UPDATED] ${message}`, ...args);
                },
            });
        }, 5000);
    }
    catch (error) {
        console.error("Failed to start custom relay server:", error);
    }
}
/**
 * Multiple relay servers example
 */
async function multipleRelaysExample() {
    console.log("Starting multiple relay servers...");
    const relays = [];
    // Create multiple relay servers on different ports
    for (let i = 0; i < 3; i++) {
        const relay = (0, src_1.createRelay)({
            port: 8765 + i,
            host: "localhost",
            super: i === 0, // First relay is super peer
            faith: true,
            enableFileStorage: true,
            log: (message, ...args) => {
                console.log(`[RELAY-${8765 + i}] ${message}`, ...args);
            },
        });
        relays.push(relay);
    }
    try {
        // Start all relay servers
        await Promise.all(relays.map((relay) => relay.start()));
        console.log("All relay servers started:");
        relays.forEach((relay) => {
            console.log(`- ${relay.getRelayUrl()}`);
        });
        // Monitor all relays
        const monitorInterval = setInterval(async () => {
            console.log("\n--- Relay Status ---");
            relays.forEach(async (relay, index) => {
                const status = relay.getStatus();
                const health = await relay.healthCheck();
                console.log(`Relay ${index + 1}: ${status.running ? "RUNNING" : "STOPPED"} | Health: ${health ? "OK" : "FAILED"} | Peers: ${status.peers}`);
            });
        }, 5000);
        // Stop all relays after 60 seconds
        setTimeout(async () => {
            clearInterval(monitorInterval);
            await Promise.all(relays.map((relay) => relay.stop()));
            console.log("All relay servers stopped");
        }, 60000);
    }
    catch (error) {
        console.error("Failed to start relay servers:", error);
    }
}
/**
 * Main function to run examples
 */
async function runExamples() {
    console.log("=== GunDB Relay Examples ===\n");
    // Uncomment the example you want to run:
    // await basicRelayExample();
    // await productionRelayExample();
    // await customRelayExample();
    // await multipleRelaysExample();
    console.log("Examples completed");
}
// The functions are already exported individually above
