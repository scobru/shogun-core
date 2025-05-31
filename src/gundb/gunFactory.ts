/**
 * Gun Factory - Ensures Gun is properly initialized with all necessary extensions
 */

import Gun from "gun";
import "gun/sea"; // SEA extension for user authentication
import "gun/lib/radix";
import "gun/lib/radisk";
import "gun/lib/store";
import "gun/lib/rindexed";
import { IGunInstance } from "gun";
import { log, logError } from "../utils/logger";

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
export function createGunInstance(
  options: GunFactoryOptions = {},
): IGunInstance<any> {
  log("Creating Gun instance with factory");

  // Validate Gun is available
  if (!Gun) {
    throw new Error(
      "Gun is not available. Make sure Gun is properly imported.",
    );
  }

  if (typeof Gun !== "function") {
    throw new Error(`Gun must be a function, received: ${typeof Gun}`);
  }

  // Create a minimal configuration that works in both browser and Node.js
  const gunConfig: any = {};

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
  } else {
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

  log(`Creating Gun with config:`, gunConfig);

  try {
    // Use Gun constructor with minimal config
    const gunInstance = Gun(gunConfig);

    // Validate the created instance
    if (!gunInstance) {
      throw new Error("Gun instance creation returned null or undefined");
    }

    if (typeof gunInstance !== "object") {
      throw new Error(
        `Gun instance must be an object, received: ${typeof gunInstance}`,
      );
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
      log("Gun user method validated successfully");
    } catch (error) {
      logError("Gun user method validation failed:", error);
      throw new Error(`Gun user method validation failed: ${error}`);
    }

    log("Gun instance created and validated successfully");
    return gunInstance;
  } catch (error) {
    logError("Error creating Gun instance:", error);
    throw new Error(`Failed to create Gun instance: ${error}`);
  }
}

/**
 * Validates an existing Gun instance
 * @param gunInstance Gun instance to validate
 * @returns true if valid, throws error if invalid
 */
export function validateGunInstance(gunInstance: any): boolean {
  if (!gunInstance) {
    throw new Error("Gun instance is null or undefined");
  }

  if (typeof gunInstance !== "object") {
    throw new Error(
      `Gun instance must be an object, received: ${typeof gunInstance}`,
    );
  }

  // Check required methods individually
  if (typeof gunInstance.user !== "function") {
    throw new Error(
      `Gun instance is missing required method: user (type: ${typeof gunInstance.user})`,
    );
  }

  if (typeof gunInstance.get !== "function") {
    throw new Error(
      `Gun instance is missing required method: get (type: ${typeof gunInstance.get})`,
    );
  }

  if (typeof gunInstance.on !== "function") {
    throw new Error(
      `Gun instance is missing required method: on (type: ${typeof gunInstance.on})`,
    );
  }

  if (typeof gunInstance.opt !== "function") {
    throw new Error(
      `Gun instance is missing required method: opt (type: ${typeof gunInstance.opt})`,
    );
  }

  // Test user method
  try {
    const user = gunInstance.user();
    if (!user || typeof user !== "object") {
      throw new Error("Gun user() method did not return a valid user object");
    }
  } catch (error) {
    throw new Error(`Gun user method validation failed: ${error}`);
  }

  return true;
}

/**
 * Gets Gun version and extension information
 * @returns Gun information object
 */
export function getGunInfo(): { version?: string; extensions: string[] } {
  const extensions: string[] = [];

  // Check for common Gun extensions
  if ((Gun as any).SEA) extensions.push("SEA");
  if ((Gun as any).chain) extensions.push("chain");
  if ((Gun as any).on) extensions.push("on");

  return {
    version: (Gun as any).version,
    extensions,
  };
}
