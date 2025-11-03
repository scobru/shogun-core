/**
 * SFrame (Secure Frame) Manager
 * End-to-end encryption for real-time media frames (audio/video)
 * Designed for low overhead and high performance
 *
 * SFrame adds ~10 bytes per frame overhead
 * Compatible with WebRTC Insertable Streams API
 */
export interface SFrameKey {
    keyId: number;
    key: CryptoKey;
    salt: Uint8Array;
}
export interface SFrameEncryptedFrame {
    frameCount: number;
    keyId: number;
    iv: Uint8Array;
    ciphertext: Uint8Array;
    authTag: Uint8Array;
}
export declare class SFrameManager {
    private keys;
    private currentKeyId;
    private frameCounter;
    private initialized;
    constructor();
    /**
     * Initialize the SFrame manager
     */
    initialize(): Promise<void>;
    /**
     * Generate a new SFrame encryption key
     */
    generateKey(keyId: number): Promise<SFrameKey>;
    /**
     * Derive an SFrame key from MLS shared secret
     * This allows SFrame to use keys derived from MLS for media encryption
     * RFC 9605 Section 5.2: MLS-based key management
     */
    deriveKeyFromMLSSecret(mlsSecret: ArrayBuffer, keyId: number, context?: string): Promise<SFrameKey>;
    /**
     * Set a shared SFrame key (e.g., from another member)
     */
    setSharedKey(sframeKey: SFrameKey): Promise<void>;
    /**
     * Set the active encryption key
     */
    setActiveKey(keyId: number): void;
    /**
     * Encrypt a media frame using SFrame
     */
    encryptFrame(frameData: ArrayBuffer): Promise<Uint8Array>;
    /**
     * Decrypt a media frame using SFrame
     */
    decryptFrame(encryptedFrame: Uint8Array): Promise<ArrayBuffer>;
    /**
     * Encrypt transform function for Insertable Streams
     * Use this with RTCRtpSender.createEncodedStreams()
     */
    createEncryptTransform(): TransformStream;
    /**
     * Decrypt transform function for Insertable Streams
     * Use this with RTCRtpReceiver.createEncodedStreams()
     */
    createDecryptTransform(): TransformStream;
    /**
     * Rotate encryption keys
     * RFC 9605: Frame counter should be reset on key rotation to prevent exhaustion
     */
    rotateKey(): Promise<number>;
    /**
     * Get current key ID
     */
    getCurrentKeyId(): number;
    /**
     * Get frame counter (for debugging)
     */
    getFrameCounter(): number;
    /**
     * Reset frame counter (use when rotating keys)
     */
    resetFrameCounter(): void;
    /**
     * Remove old keys to prevent memory bloat
     */
    cleanupOldKeys(keepLast?: number): void;
    /**
     * Get statistics
     */
    getStats(): {
        keyCount: number;
        currentKeyId: number;
        frameCounter: number;
        initialized: boolean;
    };
    /**
     * Clean up resources
     */
    destroy(): void;
    /**
     * Ensure the manager is initialized
     */
    private ensureInitialized;
}
export default SFrameManager;
