// Mock for CryptoIdentityManager to avoid MLS issues in tests
export class CryptoIdentityManager {
  constructor() {
    // Constructor no longer requires parameters
  }

  async generateAllIdentities(username: string, seaPair: any) {
    return {
      success: true,
      identities: {
        rsa: { publicKey: "mock_rsa_pub", privateKey: "mock_rsa_priv" },
        aes: { k: "mock_aes_key" },
        signal: { identityKeyPair: "mock_signal_key" },
        pgp: { publicKey: "mock_pgp_pub", privateKey: "mock_pgp_priv" },
        mls: { groupId: "mock_group_id", memberId: username },
        sframe: { keyId: 1 },
        createdAt: Date.now(),
        version: "1.0.0",
      },
    };
  }

  async setupCryptoIdentities(
    username: string,
    seaPair: any,
    forceRegenerate = false,
  ) {
    return this.generateAllIdentities(username, seaPair);
  }
}
