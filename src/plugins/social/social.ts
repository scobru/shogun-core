import { logDebug, logError,  } from "../../utils/logger";
import { EventEmitter } from "../../utils/eventEmitter";
import {
  UserProfile,
} from "./types";

import { IGunInstance } from "gun";
import Ajv from "ajv";

// AJV schema validator instance
const ajv = new Ajv();

// Schema for validating messages
const messageSchema = {
  type: "object",
  required: ["type", "creator"],
  properties: {
    type: { type: "string" },
    creator: { type: "string" },
    createdAt: { 
      oneOf: [
        { type: "number" },
        { type: "string", pattern: "^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}.*Z$" }, // ISO date string
        { type: "object" } // For Date objects, we'll validate them in code
      ]
    },
    subtype: { type: "string" },
    payload: {
      type: "object",
      properties: {
        content: { type: "string" },
        topic: { type: "string" },
        title: { type: "string" },
        reference: { type: "string" },
        attachment: { type: "string" },
        key: { type: "string" },
        value: { type: "string" },
        recipient: { type: "string" },
        name: { type: "string" }
      }
    }
  },
  additionalProperties: true
};

// Compile schema
const validateMessage = ajv.compile(messageSchema);

/**
 * Plugin Social che utilizza Gun DB
 */
export class Social extends EventEmitter {
  private readonly gun: IGunInstance<any>;
  public readonly user: any;
  private readonly profileCache = new Map<
    string,
    { data: UserProfile; timestamp: number }
  >();
  private readonly cacheDuration = 5 * 60 * 1000; // 5 minuti


  constructor(gunInstance: IGunInstance<any>) {
    super();
    this.gun = gunInstance;
    this.user = this.gun.user().recall({ sessionStorage: true });

  }

  /**
   * Metodo per loggare messaggi di debug
   */
  private debug(message: string, ...args: unknown[]): void {
    logDebug(`[Social] ${message}`, ...args);
  }

  /**
   * Metodo per loggare errori
   */
  private error(message: string, ...args: unknown[]): void {
    logError(`[Social] ${message}`, ...args);
  }

  /**
   * Pulisce le cache e i listener
   */
  public cleanup(): void {
    this.profileCache.clear();
    this.removeAllListeners();
  }

  /**
   * Sanitize and validate a message object
   * @param message The message to validate
   * @returns The sanitized message or throws an error if invalid
   */
  private sanitizeMessage(message: any): any {
    // Convert Date objects to timestamps before validation
    if (message.createdAt instanceof Date) {
      message = {
        ...message,
        createdAt: message.createdAt.getTime()
      };
    }

    // Basic validation using AJV
    const valid = validateMessage(message);
    if (!valid) {
      console.error("Message validation failed:", validateMessage.errors);
      throw new Error(`Invalid message format: ${JSON.stringify(validateMessage.errors)}`);
    }

    // Sanitize content fields and prevent XSS
    if (message.payload && typeof message.payload === 'object') {
      const payload = message.payload as Record<string, unknown>;
      
      if (typeof payload.content === 'string') {
        // Basic content sanitization - strip HTML tags
        payload.content = payload.content
          .replace(/<[^>]*>/g, '')
          .trim();
      }
      
      // Sanitize other text fields
      const fieldsToSanitize = ['topic', 'title', 'reference', 'attachment', 'key', 'value', 'recipient', 'name'];
      fieldsToSanitize.forEach(field => {
        if (typeof payload[field] === 'string') {
          payload[field] = (payload[field] as string)
            .replace(/<[^>]*>/g, '')
            .trim();
        }
      });
    }

    return message;
  }

  /**
   * Stores any message conforming to the standard message schema
   * @param message Message object following the message schema
   * @returns The message ID (hash)
   */
  public async storeMessage(message: any): Promise<string | null> {
    console.log("storeMessage called with:", JSON.stringify(message));

    if (!this.user.is || !this.user.is.pub) {
      console.error("storeMessage failed: user not authenticated");
      throw new Error("Non autenticato");
    }

    // Ensure creator is current user's pub key
    if (message.creator !== this.user.is.pub) {
      console.error(
        `storeMessage failed: creator mismatch - message.creator: ${message.creator}, user.is.pub: ${this.user.is.pub}`
      );
      throw new Error("Creator must be current user");
    }

    console.log("storeMessage: authentication checks passed");

    // Sanitize and validate message
    try {
      message = this.sanitizeMessage(message);
    } catch (error) {
      console.error("storeMessage failed: message validation error", error);
      throw error;
    }

    // Validate POST message content is not empty
    const messageType = typeof message.type === 'string' ? message.type.toUpperCase() : '';
    const isPostType = messageType === 'POST';
    
    if (isPostType) {
      // Access content safely with type checking
      const content = 
        (message.payload && typeof message.payload === 'object' && typeof message.payload.content === 'string'
          ? message.payload.content
          : '') || 
        (typeof message.content === 'string' ? message.content : '');
          
      if (!content.trim()) {
        console.error("storeMessage failed: POST message with empty content");
        throw new Error("Post content cannot be empty");
      }
    }

    try {
      // Generate hash as per message algorithm
      const type = typeof message.type === 'string' ? message.type.toUpperCase() : '';
      const creator = typeof message.creator === 'string' ? message.creator : '';
      const createdAt = message.createdAt instanceof Date ? 
        message.createdAt.getTime() : 
        (typeof message.createdAt === 'number' ? message.createdAt : Date.now());
      
      // Safely extract subtype
      const messageSubtype = typeof message.subtype === 'string' ? message.subtype : '';
      
      // Safely extract and stringify payload
      const messagePayload = message.payload ? 
        (typeof message.payload === 'string' ? message.payload : JSON.stringify(message.payload)) : 
        '{}';

      // Simplified version - we use a standardized format for hashing
      const content = `${type}:${messageSubtype}:${creator}:${createdAt}:${messagePayload}`;
      console.log("storeMessage: content for hashing:", content);

      const hashBuffer = await crypto.subtle.digest(
        "SHA-256",
        new TextEncoder().encode(content)
      );
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const messageHash = hashArray
        .map((byte) => byte.toString(16).padStart(2, "0"))
        .join("");

      const messageId = `${creator}/${messageHash}`;
      console.log("storeMessage: generated messageId:", messageId);

      // Store the message
      console.log("storeMessage: storing message in GunDB");
      
      // Create a flattened version of the message for GunDB storage
      // Safely extract all properties with type checks
      const storableMessage = {
        ...message,
        // Ensure payload is a string to prevent GunDB nested object issues
        payload: typeof message.payload === 'string' 
          ? message.payload 
          : JSON.stringify(message.payload || {}),
        // Add top-level content field for backward compatibility
        content: message.payload && typeof message.payload === 'object' && typeof message.payload.content === 'string'
          ? message.payload.content
          : (typeof message.content === 'string' ? message.content : ''),
        // Store all important payload fields at the top level for better indexing
        topic: message.payload && typeof message.payload === 'object' && typeof message.payload.topic === 'string'
          ? message.payload.topic 
          : '',
        title: message.payload && typeof message.payload === 'object' && typeof message.payload.title === 'string'
          ? message.payload.title 
          : '',
        attachment: message.payload && typeof message.payload === 'object' && typeof message.payload.attachment === 'string'
          ? message.payload.attachment 
          : '',
        reference: message.payload && typeof message.payload === 'object' && typeof message.payload.reference === 'string'
          ? message.payload.reference 
          : ''
      };
      
      console.log("storeMessage: prepared message for storage:", JSON.stringify(storableMessage));
      
      await new Promise<void>((resolve, reject) => {
        this.gun
          .user()
          .get("messages")
          .get(messageHash)
          .put(storableMessage, (ack: any) => {
            if (ack && ack.err) {
              console.error("storeMessage: GunDB error:", ack.err);
              reject(new Error(ack.err));
            } else {
              console.log("storeMessage: GunDB message stored successfully");
              resolve();
            }
          });
      });

      console.log("storeMessage: successfully completed");
      return messageId;
    } catch (error) {
      console.error("storeMessage: unexpected error:", error);
      throw error;
    }
  }
}
