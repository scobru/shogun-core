/**
 * Gun module for Shogun
 * Provides the main interface for interacting with GunDB
 * with all modules integrated into the main class
 */

// Export the main class
export * from "./gun";

// Export only the types still needed for backward compatibility
export type { Repository } from "./repository";
