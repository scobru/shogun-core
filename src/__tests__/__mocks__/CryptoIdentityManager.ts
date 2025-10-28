// Mock for CryptoIdentityManager to avoid MLS issues in tests
export class CryptoIdentityManager {
  constructor(core: any) {
    this.core = core;
  }

  async generateAllIdentities(username: string, seaPair: any) {
    return {
      success: true,
      identities: {
        rsa: { publicKey: 'mock_rsa_pub', privateKey: 'mock_rsa_priv' },
        aes: { k: 'mock_aes_key' },
        signal: { identityKeyPair: 'mock_signal_key' },
        pgp: { publicKey: 'mock_pgp_pub', privateKey: 'mock_pgp_priv' },
        mls: { groupId: 'mock_group_id', memberId: username },
        sframe: { keyId: 1 },
        createdAt: Date.now(),
        version: '1.0.0'
      }
    };
  }

  async saveIdentitiesToGun(username: string, identities: any, seaPair: any) {
    return {
      success: true,
      savedKeys: ['crypto-identities', 'crypto-identities-hash']
    };
  }

  async retrieveIdentitiesFromGun(username: string, seaPair: any) {
    return {
      success: true,
      identities: {
        rsa: { publicKey: 'mock_rsa_pub', privateKey: 'mock_rsa_priv' },
        aes: { k: 'mock_aes_key' },
        signal: { identityKeyPair: 'mock_signal_key' },
        pgp: { publicKey: 'mock_pgp_pub', privateKey: 'mock_pgp_priv' },
        mls: { groupId: 'mock_group_id', memberId: username },
        sframe: { keyId: 1 },
        createdAt: Date.now(),
        version: '1.0.0'
      }
    };
  }

  async hasStoredIdentities(username: string) {
    return true;
  }

  async setupCryptoIdentities(username: string, seaPair: any, forceRegenerate = false) {
    return {
      success: true,
      identities: {
        rsa: { publicKey: 'mock_rsa_pub', privateKey: 'mock_rsa_priv' },
        aes: { k: 'mock_aes_key' },
        signal: { identityKeyPair: 'mock_signal_key' },
        pgp: { publicKey: 'mock_pgp_pub', privateKey: 'mock_pgp_priv' },
        mls: { groupId: 'mock_group_id', memberId: username },
        sframe: { keyId: 1 },
        createdAt: Date.now(),
        version: '1.0.0'
      },
      savedKeys: ['crypto-identities', 'crypto-identities-hash']
    };
  }

  async getCurrentUserIdentities() {
    return {
      success: true,
      identities: {
        rsa: { publicKey: 'mock_rsa_pub', privateKey: 'mock_rsa_priv' },
        aes: { k: 'mock_aes_key' },
        signal: { identityKeyPair: 'mock_signal_key' },
        pgp: { publicKey: 'mock_pgp_pub', privateKey: 'mock_pgp_priv' },
        mls: { groupId: 'mock_group_id', memberId: 'mock_user' },
        sframe: { keyId: 1 },
        createdAt: Date.now(),
        version: '1.0.0'
      }
    };
  }
}
