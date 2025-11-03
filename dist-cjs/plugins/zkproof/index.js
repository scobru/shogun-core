"use strict";
/**
 * ZK-Proof Plugin for Shogun Core
 *
 * Provides Zero-Knowledge Proof authentication using Semaphore protocol
 *
 * Features:
 * - Anonymous authentication without revealing identity
 * - Multi-device support via trapdoor backup
 * - Privacy-preserving group membership proofs
 * - Compatible with Gun decentralized storage
 *
 * @example
 * ```typescript
 * // Initialize Shogun with ZK-Proof plugin
 * const shogun = new ShogunCore({
 *   peers: ['https://gun-manhattan.herokuapp.com/gun'],
 *   zkproof: {
 *     enabled: true,
 *     defaultGroupId: 'my-app-users'
 *   }
 * });
 *
 * await shogun.initialize();
 *
 * // Get the plugin
 * const zkPlugin = shogun.getPlugin<ZkProofPlugin>('zkproof');
 *
 * // Sign up with ZK-Proof
 * const signupResult = await zkPlugin.signUp();
 * if (signupResult.success) {
 *   console.log('Trapdoor (save this!):', signupResult.seedPhrase);
 *   console.log('Public commitment:', signupResult.username);
 * }
 *
 * // Login with trapdoor
 * const loginResult = await zkPlugin.login(trapdoor);
 * if (loginResult.success) {
 *   console.log('Logged in anonymously!');
 * }
 * ```
 *
 * @module zkproof
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.CredentialType = exports.ZkCredentials = exports.ZkProofConnector = exports.ZkProofPlugin = void 0;
var zkProofPlugin_1 = require("./zkProofPlugin");
Object.defineProperty(exports, "ZkProofPlugin", { enumerable: true, get: function () { return zkProofPlugin_1.ZkProofPlugin; } });
var zkProofConnector_1 = require("./zkProofConnector");
Object.defineProperty(exports, "ZkProofConnector", { enumerable: true, get: function () { return zkProofConnector_1.ZkProofConnector; } });
var zkCredentials_1 = require("./zkCredentials");
Object.defineProperty(exports, "ZkCredentials", { enumerable: true, get: function () { return zkCredentials_1.ZkCredentials; } });
Object.defineProperty(exports, "CredentialType", { enumerable: true, get: function () { return zkCredentials_1.CredentialType; } });
