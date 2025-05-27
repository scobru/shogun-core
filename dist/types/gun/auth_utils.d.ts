import { GunInstance } from "./types";
/**
 * Adds authorization headers to Gun requests
 * @param gun The Gun instance to restrict
 * @param authToken The authorization token
 * @returns The GunDB instance for chaining
 */
export declare function restrictGunPut(gun: GunInstance<any>, authToken: string): GunInstance<any>;
