import { EventEmitter } from "../../utils/eventEmitter";
import { IGunInstance } from "gun";
/**
 * Plugin Social che utilizza Gun DB
 */
export declare class Social extends EventEmitter {
    private readonly gun;
    readonly user: any;
    private readonly profileCache;
    private readonly cacheDuration;
    constructor(gunInstance: IGunInstance<any>);
    /**
     * Metodo per loggare messaggi di debug
     */
    private debug;
    /**
     * Metodo per loggare errori
     */
    private error;
    /**
     * Pulisce le cache e i listener
     */
    cleanup(): void;
    /**
     * Sanitize and validate a message object
     * @param message The message to validate
     * @returns The sanitized message or throws an error if invalid
     */
    private sanitizeMessage;
    /**
     * Stores any message conforming to the standard message schema
     * @param message Message object following the message schema
     * @returns The message ID (hash)
     */
    storeMessage(message: any): Promise<string | null>;
}
