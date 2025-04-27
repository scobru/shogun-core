"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Social = void 0;
const logger_1 = require("../../utils/logger");
const eventEmitter_1 = require("../../utils/eventEmitter");
/**
 * Plugin Social che utilizza Gun DB
 */
class Social extends eventEmitter_1.EventEmitter {
    gun;
    user;
    profileCache = new Map();
    cacheDuration = 5 * 60 * 1000; // 5 minuti
    constructor(gunInstance) {
        super();
        this.gun = gunInstance;
        this.user = this.gun.user().recall({ sessionStorage: true });
    }
    /**
     * Metodo per loggare messaggi di debug
     */
    debug(message, ...args) {
        (0, logger_1.logDebug)(`[Social] ${message}`, ...args);
    }
    /**
     * Metodo per loggare errori
     */
    error(message, ...args) {
        (0, logger_1.logError)(`[Social] ${message}`, ...args);
    }
    /**
     * Pulisce le cache e i listener
     */
    cleanup() {
        this.profileCache.clear();
        this.removeAllListeners();
    }
    /**
     * Stores any message conforming to the standard message schema
     * @param message Message object following the message schema
     * @returns The message ID (hash)
     */
    async storeMessage(message) {
        console.log("storeMessage called with:", JSON.stringify(message));
        if (!this.user.is || !this.user.is.pub) {
            console.error("storeMessage failed: user not authenticated");
            throw new Error("Non autenticato");
        }
        // Ensure creator is current user's pub key
        if (message.creator !== this.user.is.pub) {
            console.error(`storeMessage failed: creator mismatch - message.creator: ${message.creator}, user.is.pub: ${this.user.is.pub}`);
            throw new Error("Creator must be current user");
        }
        console.log("storeMessage: authentication checks passed");
        // Validate POST message content is not empty
        if (message.type === "POST" || message.type === "Post") {
            const content = message.payload?.content || message.content || "";
            if (!content.trim()) {
                console.error("storeMessage failed: POST message with empty content");
                throw new Error("Post content cannot be empty");
            }
        }
        try {
            // Generate hash as per message algorithm
            const type = message.type?.toUpperCase() || '';
            const creator = message.creator || '';
            const createdAt = message.createdAt instanceof Date ?
                message.createdAt.getTime() :
                (typeof message.createdAt === 'number' ? message.createdAt : Date.now());
            const messageSubtype = message.subtype || '';
            const messagePayload = JSON.stringify(message.payload || {});
            // Simplified version - we use a standardized format for hashing
            const content = `${type}:${messageSubtype}:${creator}:${createdAt}:${messagePayload}`;
            console.log("storeMessage: content for hashing:", content);
            const hashBuffer = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(content));
            const hashArray = Array.from(new Uint8Array(hashBuffer));
            const messageHash = hashArray
                .map((byte) => byte.toString(16).padStart(2, "0"))
                .join("");
            const messageId = `${creator}/${messageHash}`;
            console.log("storeMessage: generated messageId:", messageId);
            // Store the message
            console.log("storeMessage: storing message in GunDB");
            // Create a flattened version of the message for GunDB storage
            const storableMessage = {
                ...message,
                // Ensure payload is a string to prevent GunDB nested object issues
                payload: typeof message.payload === 'string'
                    ? message.payload
                    : JSON.stringify(message.payload),
                // Add top-level content field for backward compatibility
                content: message.payload?.content || '',
                // Store all important payload fields at the top level for better indexing
                topic: message.payload?.topic || '',
                title: message.payload?.title || '',
                attachment: message.payload?.attachment || '',
                reference: message.payload?.reference || ''
            };
            console.log("storeMessage: prepared message for storage:", JSON.stringify(storableMessage));
            await new Promise((resolve, reject) => {
                this.gun
                    .user()
                    .get("messages")
                    .get(messageHash)
                    .put(storableMessage, (ack) => {
                    if (ack && ack.err) {
                        console.error("storeMessage: GunDB error:", ack.err);
                        reject(new Error(ack.err));
                    }
                    else {
                        console.log("storeMessage: GunDB message stored successfully");
                        resolve();
                    }
                });
            });
            console.log("storeMessage: successfully completed");
            return messageId;
        }
        catch (error) {
            console.error("storeMessage: unexpected error:", error);
            throw error;
        }
    }
}
exports.Social = Social;
