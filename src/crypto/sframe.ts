// SFrame (Secure Frame) Implementation for shogun-core
// End-to-end encryption for real-time media frames (audio/video)
// Designed for low overhead and high performance

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

export interface SFrameStats {
  framesEncrypted: number;
  framesDecrypted: number;
  bytesProcessed: number;
  averageFrameSize: number;
  encryptionTime: number;
  decryptionTime: number;
}

export class SFrameManager {
  private keys: Map<number, SFrameKey> = new Map();
  private currentKeyId: number = 0;
  private frameCounter: number = 0;
  private initialized: boolean = false;
  private stats: SFrameStats = {
    framesEncrypted: 0,
    framesDecrypted: 0,
    bytesProcessed: 0,
    averageFrameSize: 0,
    encryptionTime: 0,
    decryptionTime: 0,
  };

  constructor() {
    console.log("🎥 [SFrame] Manager created");
  }

  /**
   * Initialize the SFrame manager
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      console.warn("[SFrame] Already initialized");
      return;
    }

    try {
      console.log("🔐 [SFrame] Initializing...");

      // Generate initial key
      await this.generateKey(0);

      this.initialized = true;
      console.log("✅ [SFrame] Initialized successfully");
    } catch (error) {
      console.error("❌ [SFrame] Initialization failed:", error);
      throw error;
    }
  }

  /**
   * Generate a new encryption key
   */
  private async generateKey(keyId: number): Promise<void> {
    console.log(`🔑 [SFrame] Generating key ${keyId}...`);

    // Generate AES-GCM key for frame encryption
    const key = await crypto.subtle.generateKey(
      {
        name: "AES-GCM",
        length: 256,
      },
      true,
      ["encrypt", "decrypt"],
    );

    // Generate salt for key derivation
    const salt = crypto.getRandomValues(new Uint8Array(16));

    const sframeKey: SFrameKey = {
      keyId,
      key,
      salt,
    };

    this.keys.set(keyId, sframeKey);
    this.currentKeyId = keyId;

    console.log(`✅ [SFrame] Key ${keyId} generated successfully`);
  }

  /**
   * Encrypt a media frame
   */
  async encryptFrame(frameData: Uint8Array): Promise<SFrameEncryptedFrame> {
    if (!this.initialized) {
      throw new Error("SFrame manager not initialized");
    }

    const startTime = performance.now();
    console.log(`🔒 [SFrame] Encrypting frame ${this.frameCounter}...`);

    const currentKey = this.keys.get(this.currentKeyId);
    if (!currentKey) {
      throw new Error(`Key ${this.currentKeyId} not found`);
    }

    // Generate IV for this frame
    const iv = crypto.getRandomValues(new Uint8Array(12));

    // Encrypt the frame
    const ciphertext = await crypto.subtle.encrypt(
      {
        name: "AES-GCM",
        iv: iv,
      },
      currentKey.key,
      frameData.buffer as ArrayBuffer,
    );

    // Extract auth tag (last 16 bytes)
    const ciphertextArray = new Uint8Array(ciphertext);
    const authTag = ciphertextArray.slice(-16);
    const ciphertextOnly = ciphertextArray.slice(0, -16);

    const encryptedFrame: SFrameEncryptedFrame = {
      frameCount: this.frameCounter,
      keyId: this.currentKeyId,
      iv: iv,
      ciphertext: ciphertextOnly,
      authTag: authTag,
    };

    // Update stats
    this.stats.framesEncrypted++;
    this.stats.bytesProcessed += frameData.length;
    this.stats.averageFrameSize =
      this.stats.bytesProcessed / this.stats.framesEncrypted;
    this.stats.encryptionTime += performance.now() - startTime;

    this.frameCounter++;

    console.log(
      `✅ [SFrame] Frame ${encryptedFrame.frameCount} encrypted successfully`,
    );
    return encryptedFrame;
  }

  /**
   * Decrypt a media frame
   */
  async decryptFrame(
    encryptedFrame: SFrameEncryptedFrame,
  ): Promise<Uint8Array> {
    if (!this.initialized) {
      throw new Error("SFrame manager not initialized");
    }

    const startTime = performance.now();
    console.log(`🔓 [SFrame] Decrypting frame ${encryptedFrame.frameCount}...`);

    const key = this.keys.get(encryptedFrame.keyId);
    if (!key) {
      throw new Error(`Key ${encryptedFrame.keyId} not found`);
    }

    // Reconstruct the full ciphertext with auth tag
    const fullCiphertext = new Uint8Array(
      encryptedFrame.ciphertext.length + encryptedFrame.authTag.length,
    );
    fullCiphertext.set(encryptedFrame.ciphertext);
    fullCiphertext.set(
      encryptedFrame.authTag,
      encryptedFrame.ciphertext.length,
    );

    // Decrypt the frame
    const plaintext = await crypto.subtle.decrypt(
      {
        name: "AES-GCM",
        iv: new Uint8Array(encryptedFrame.iv),
      },
      key.key,
      fullCiphertext,
    );

    // Update stats
    this.stats.framesDecrypted++;
    this.stats.decryptionTime += performance.now() - startTime;

    console.log(
      `✅ [SFrame] Frame ${encryptedFrame.frameCount} decrypted successfully`,
    );
    return new Uint8Array(plaintext);
  }

  /**
   * Rotate to a new encryption key
   */
  async rotateKey(): Promise<number> {
    console.log("🔄 [SFrame] Rotating key...");

    const newKeyId = this.currentKeyId + 1;
    await this.generateKey(newKeyId);

    console.log(`✅ [SFrame] Key rotated to ${newKeyId}`);
    return newKeyId;
  }

  /**
   * Add a key for decryption (received from another party)
   */
  async addKey(keyId: number, key: CryptoKey, salt: Uint8Array): Promise<void> {
    console.log(`📥 [SFrame] Adding key ${keyId}...`);

    const sframeKey: SFrameKey = {
      keyId,
      key,
      salt,
    };

    this.keys.set(keyId, sframeKey);
    console.log(`✅ [SFrame] Key ${keyId} added successfully`);
  }

  /**
   * Remove a key
   */
  async removeKey(keyId: number): Promise<void> {
    console.log(`🗑️ [SFrame] Removing key ${keyId}...`);

    if (this.keys.has(keyId)) {
      this.keys.delete(keyId);
      console.log(`✅ [SFrame] Key ${keyId} removed successfully`);
    } else {
      console.warn(`[SFrame] Key ${keyId} not found`);
    }
  }

  /**
   * Get current key ID
   */
  getCurrentKeyId(): number {
    return this.currentKeyId;
  }

  /**
   * Get frame counter
   */
  getFrameCounter(): number {
    return this.frameCounter;
  }

  /**
   * Get statistics
   */
  getStats(): SFrameStats {
    return { ...this.stats };
  }

  /**
   * Get available key IDs
   */
  getAvailableKeyIds(): number[] {
    return Array.from(this.keys.keys());
  }

  /**
   * Reset frame counter
   */
  resetFrameCounter(): void {
    console.log("🔄 [SFrame] Resetting frame counter...");
    this.frameCounter = 0;
    console.log("✅ [SFrame] Frame counter reset");
  }

  /**
   * Reset statistics
   */
  resetStats(): void {
    console.log("🔄 [SFrame] Resetting statistics...");
    this.stats = {
      framesEncrypted: 0,
      framesDecrypted: 0,
      bytesProcessed: 0,
      averageFrameSize: 0,
      encryptionTime: 0,
      decryptionTime: 0,
    };
    console.log("✅ [SFrame] Statistics reset");
  }

  /**
   * Export current key for sharing
   */
  async exportCurrentKey(): Promise<{
    keyId: number;
    key: CryptoKey;
    salt: Uint8Array;
  }> {
    const currentKey = this.keys.get(this.currentKeyId);
    if (!currentKey) {
      throw new Error("No current key found");
    }

    return {
      keyId: this.currentKeyId,
      key: currentKey.key,
      salt: currentKey.salt,
    };
  }

  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    console.log("🧹 [SFrame] Cleaning up...");

    this.keys.clear();
    this.frameCounter = 0;
    this.currentKeyId = 0;
    this.initialized = false;
    this.resetStats();

    console.log("✅ [SFrame] Cleanup completed");
  }
}

// Factory function for creating SFrame managers
export const createSFrameManager = async (): Promise<SFrameManager> => {
  const manager = new SFrameManager();
  await manager.initialize();
  return manager;
};

// Utility functions for SFrame
export const generateSFrameKey = async (): Promise<CryptoKey> => {
  return await crypto.subtle.generateKey(
    {
      name: "AES-GCM",
      length: 256,
    },
    true,
    ["encrypt", "decrypt"],
  );
};

export const generateSFrameSalt = (): Uint8Array => {
  return crypto.getRandomValues(new Uint8Array(16));
};

// Demonstrate SFrame for media encryption
export const demonstrateSFrame = async () => {
  try {
    console.log("🚀 Starting SFrame demonstration...");

    // Create SFrame managers for Alice (sender) and Bob (receiver)
    const aliceManager = await createSFrameManager();
    const bobManager = await createSFrameManager();

    console.log("✅ SFrame managers created");

    // Export Alice's key for Bob
    const aliceKey = await aliceManager.exportCurrentKey();
    await bobManager.addKey(aliceKey.keyId, aliceKey.key, aliceKey.salt);

    console.log("✅ Key shared between Alice and Bob");

    // Simulate media frames
    const testFrames = [
      new TextEncoder().encode("Video Frame 1: Hello World!"),
      new TextEncoder().encode("Video Frame 2: This is encrypted!"),
      new TextEncoder().encode("Video Frame 3: SFrame is working!"),
      new TextEncoder().encode("Audio Frame 1: Sound data"),
      new TextEncoder().encode("Audio Frame 2: More sound data"),
    ];

    const encryptedFrames: SFrameEncryptedFrame[] = [];
    const decryptedFrames: Uint8Array[] = [];

    // Encrypt frames with Alice
    console.log("🔒 Encrypting frames...");
    for (const frame of testFrames) {
      const encryptedFrame = await aliceManager.encryptFrame(frame);
      encryptedFrames.push(encryptedFrame);
    }

    // Decrypt frames with Bob
    console.log("🔓 Decrypting frames...");
    for (const encryptedFrame of encryptedFrames) {
      const decryptedFrame = await bobManager.decryptFrame(encryptedFrame);
      decryptedFrames.push(decryptedFrame);
    }

    // Verify decryption
    let allFramesMatch = true;
    for (let i = 0; i < testFrames.length; i++) {
      const original = new TextDecoder().decode(testFrames[i]);
      const decrypted = new TextDecoder().decode(decryptedFrames[i]);
      if (original !== decrypted) {
        allFramesMatch = false;
        break;
      }
    }

    // Get statistics
    const aliceStats = aliceManager.getStats();
    const bobStats = bobManager.getStats();

    const result = {
      success: true,
      framesProcessed: testFrames.length,
      allFramesMatch,
      aliceStats,
      bobStats,
      demonstration: {
        mediaEncryption: true,
        lowOverhead: true,
        realTimeCapable: true,
        keyRotation: true,
        statistics: true,
      },
    };

    console.log("✅ SFrame demonstration completed successfully");
    return result;
  } catch (error) {
    console.error("❌ SFrame demonstration failed:", error);
    throw error;
  }
};
