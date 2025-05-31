/**
 * Gun Factory - Ensures Gun is properly initialized with all necessary extensions
 */
import "gun/sea";
import "gun/lib/radix";
import "gun/lib/radisk";
import "gun/lib/store";
import "gun/lib/rindexed";
import { IGunInstance } from "gun";
export interface GunFactoryOptions {
    peers?: string[];
    localStorage?: boolean;
    radisk?: boolean;
    multicast?: boolean;
    axe?: boolean;
    file?: boolean;
    [key: string]: any;
}
/**
 * Creates a properly configured Gun instance with all necessary extensions
 * @param options Gun configuration options
 * @returns Configured Gun instance
 */
export declare function createGunInstance(options?: GunFactoryOptions): IGunInstance<any>;
/**
 * Validates an existing Gun instance
 * @param gunInstance Gun instance to validate
 * @returns true if valid, throws error if invalid
 */
export declare function validateGunInstance(gunInstance: any): boolean;
/**
 * Gets Gun version and extension information
 * @returns Gun information object
 */
export declare function getGunInfo(): {
    version?: string;
    extensions: string[];
};
