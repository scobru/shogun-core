import { NostrConnectorPlugin } from '../../../plugins/nostr/nostrConnectorPlugin';
import { ShogunCore } from '../../../index';
import { NostrConnector } from '../../../plugins/nostr/nostrConnector';
import { NostrSigner } from '../../../plugins/nostr/nostrSigner';
import { ErrorHandler, ErrorType } from '../../../utils/errorHandler';

// Mock dependencies
jest.mock('../../../plugins/nostr/nostrConnector');
jest.mock('../../../plugins/nostr/nostrSigner');
jest.mock('../../../utils/errorHandler');

const MockNostrConnector = NostrConnector as jest.MockedClass<typeof NostrConnector>;
const MockNostrSigner = NostrSigner as jest.MockedClass<typeof NostrSigner>;

describe('NostrConnectorPlugin', () => {
  let plugin: NostrConnectorPlugin;
  let mockCore: ShogunCore;
  let mockConnector: jest.Mocked<NostrConnector>;
  let mockSigner: jest.Mocked<NostrSigner>;

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup mocks
    mockConnector = {
      isAvailable: jest.fn(),
      isNostrExtensionAvailable: jest.fn(),
      connectNostrWallet: jest.fn(),
      connectBitcoinWallet: jest.fn(),
      cleanup: jest.fn(),
      clearSignatureCache: jest.fn(),
      verifySignature: jest.fn(),
      generatePassword: jest.fn(),
      createSigningCredential: jest.fn(),
      createAuthenticator: jest.fn(),
      createDerivedKeyPair: jest.fn(),
      signWithDerivedKeys: jest.fn(),
      getSigningCredential: jest.fn(),
      listSigningCredentials: jest.fn(),
      removeSigningCredential: jest.fn(),
      createGunUserFromSigningCredential: jest.fn(),
      getGunUserPubFromSigningCredential: jest.fn(),
      getPassword: jest.fn(),
      verifyConsistency: jest.fn(),
      setupConsistentOneshotSigning: jest.fn(),
    } as any;

    mockSigner = {
      sign: jest.fn(),
      verify: jest.fn(),
    } as any;

    MockNostrConnector.mockImplementation(() => mockConnector);
    MockNostrSigner.mockImplementation(() => mockSigner);

    mockCore = {
      // Add minimal mock properties as needed
    } as any;

    plugin = new NostrConnectorPlugin();
  });

  describe('Constructor', () => {
    it('should create NostrConnectorPlugin with correct properties', () => {
      expect(plugin.name).toBe('nostr');
      expect(plugin.version).toBe('1.0.0');
      expect(plugin.description).toContain('Bitcoin wallet connection');
    });
  });

  describe('initialize', () => {
    it('should initialize plugin with core and create connector/signer', () => {
      plugin.initialize(mockCore);

      expect(plugin['core']).toBe(mockCore);
      expect(MockNostrConnector).toHaveBeenCalled();
      expect(MockNostrSigner).toHaveBeenCalledWith(mockConnector);
    });
  });

  describe('destroy', () => {
    it('should cleanup resources when destroyed', () => {
      plugin.initialize(mockCore);
      plugin.destroy();

      expect(mockConnector.cleanup).toHaveBeenCalled();
      expect(plugin['bitcoinConnector']).toBeNull();
      expect(plugin['signer']).toBeNull();
    });

    it('should handle destroy when not initialized', () => {
      expect(() => plugin.destroy()).not.toThrow();
    });
  });

  describe('isAvailable', () => {
    beforeEach(() => {
      plugin.initialize(mockCore);
    });

    it('should return availability status from connector', () => {
      mockConnector.isAvailable.mockReturnValue(true);

      const result = plugin.isAvailable();

      expect(result).toBe(true);
      expect(mockConnector.isAvailable).toHaveBeenCalled();
    });

    it('should throw error when not initialized', () => {
      const uninitializedPlugin = new NostrConnectorPlugin();

      expect(() => uninitializedPlugin.isAvailable()).toThrow('Plugin nostr not initialized');
    });
  });

  describe('isAlbyAvailable', () => {
    beforeEach(() => {
      plugin.initialize(mockCore);
    });

    it('should return Nostr extension availability', () => {
      mockConnector.isNostrExtensionAvailable.mockReturnValue(true);

      const result = plugin.isAlbyAvailable();

      expect(result).toBe(true);
      expect(mockConnector.isNostrExtensionAvailable).toHaveBeenCalled();
    });
  });

  describe('isNostrExtensionAvailable', () => {
    beforeEach(() => {
      plugin.initialize(mockCore);
    });

    it('should return Nostr extension availability', () => {
      mockConnector.isNostrExtensionAvailable.mockReturnValue(false);

      const result = plugin.isNostrExtensionAvailable();

      expect(result).toBe(false);
      expect(mockConnector.isNostrExtensionAvailable).toHaveBeenCalled();
    });
  });

  describe('connectNostrWallet', () => {
    beforeEach(() => {
      plugin.initialize(mockCore);
    });

    it('should connect to Nostr wallet successfully', async () => {
      const mockResult = {
        success: true,
        address: 'npub123',
        publicKey: 'pubkey123',
      };

      mockConnector.connectNostrWallet.mockResolvedValue(mockResult);

      const result = await plugin.connectNostrWallet();

      expect(result).toEqual(mockResult);
      expect(mockConnector.connectNostrWallet).toHaveBeenCalled();
    });

    it('should handle connection failure', async () => {
      const mockResult = {
        success: false,
        error: 'Connection failed',
      };

      mockConnector.connectNostrWallet.mockResolvedValue(mockResult);

      const result = await plugin.connectNostrWallet();

      expect(result).toEqual(mockResult);
    });
  });

  describe('connectBitcoinWallet', () => {
    beforeEach(() => {
      plugin.initialize(mockCore);
    });

    it('should connect to Bitcoin wallet with default type', async () => {
      const mockResult = {
        success: true,
        address: 'bc1address',
      };

      mockConnector.connectBitcoinWallet.mockResolvedValue(mockResult);

      const result = await plugin.connectBitcoinWallet();

      expect(result).toEqual(mockResult);
      expect(mockConnector.connectBitcoinWallet).toHaveBeenCalledWith('nostr');
    });

    it('should connect to Bitcoin wallet with specified type', async () => {
      const mockResult = {
        success: true,
        address: 'bc1address',
      };

      mockConnector.connectBitcoinWallet.mockResolvedValue(mockResult);

      const result = await plugin.connectBitcoinWallet('alby');

      expect(result).toEqual(mockResult);
      expect(mockConnector.connectBitcoinWallet).toHaveBeenCalledWith('alby');
    });
  });

  describe('generateCredentials', () => {
    beforeEach(() => {
      plugin.initialize(mockCore);
    });

    it('should generate credentials successfully', async () => {
      const mockCredentials = {
        username: 'npub123',
        password: 'generated_password',
        address: 'npub123',
        signature: 'sig123',
      };

      mockConnector.generateCredentials.mockResolvedValue(mockCredentials);

      const result = await plugin.generateCredentials('npub123', 'sig123', 'message');

      expect(result).toEqual(mockCredentials);
      expect(mockConnector.generateCredentials).toHaveBeenCalledWith('npub123', 'sig123', 'message');
    });
  });

  describe('cleanup', () => {
    beforeEach(() => {
      plugin.initialize(mockCore);
    });

    it('should cleanup connector', () => {
      plugin.cleanup();

      expect(mockConnector.cleanup).toHaveBeenCalled();
    });
  });

  describe('clearSignatureCache', () => {
    beforeEach(() => {
      plugin.initialize(mockCore);
    });

    it('should clear signature cache for specific address', () => {
      plugin.clearSignatureCache('npub123');

      expect(mockConnector.clearSignatureCache).toHaveBeenCalledWith('npub123');
    });

    it('should clear all signature cache when no address provided', () => {
      plugin.clearSignatureCache();

      expect(mockConnector.clearSignatureCache).toHaveBeenCalledWith();
    });
  });

  describe('verifySignature', () => {
    beforeEach(() => {
      plugin.initialize(mockCore);
    });

    it('should verify signature successfully', async () => {
      mockConnector.verifySignature.mockResolvedValue(true);

      const result = await plugin.verifySignature('message', 'signature', 'npub123');

      expect(result).toBe(true);
      expect(mockConnector.verifySignature).toHaveBeenCalledWith('message', 'signature', 'npub123');
    });

    it('should return false for invalid signature', async () => {
      mockConnector.verifySignature.mockResolvedValue(false);

      const result = await plugin.verifySignature('message', 'invalid', 'npub123');

      expect(result).toBe(false);
    });
  });

  describe('generatePassword', () => {
    beforeEach(() => {
      plugin.initialize(mockCore);
    });

    it('should generate password from signature', async () => {
      mockConnector.generatePassword.mockResolvedValue('generated_password');

      const result = await plugin.generatePassword('signature123');

      expect(result).toBe('generated_password');
      expect(mockConnector.generatePassword).toHaveBeenCalledWith('signature123');
    });
  });

  describe('createSigningCredential', () => {
    beforeEach(() => {
      plugin.initialize(mockCore);
    });

    it('should create signing credential successfully', async () => {
      const mockCredential = {
        address: 'npub123',
        publicKey: 'pubkey123',
        privateKey: 'privkey123',
      };

      mockConnector.createSigningCredential.mockResolvedValue(mockCredential);

      const result = await plugin.createSigningCredential('npub123');

      expect(result).toEqual(mockCredential);
      expect(mockConnector.createSigningCredential).toHaveBeenCalledWith('npub123');
    });
  });

  describe('createAuthenticator', () => {
    beforeEach(() => {
      plugin.initialize(mockCore);
    });

    it('should create authenticator function', () => {
      const mockAuthenticator = jest.fn();
      mockConnector.createAuthenticator.mockReturnValue(mockAuthenticator);

      const result = plugin.createAuthenticator('npub123');

      expect(result).toBe(mockAuthenticator);
      expect(mockConnector.createAuthenticator).toHaveBeenCalledWith('npub123');
    });
  });

  describe('createDerivedKeyPair', () => {
    beforeEach(() => {
      plugin.initialize(mockCore);
    });

    it('should create derived key pair', async () => {
      const mockKeyPair = {
        pub: 'pub123',
        priv: 'priv123',
        epub: 'epub123',
        epriv: 'epriv123',
      };

      mockConnector.createDerivedKeyPair.mockResolvedValue(mockKeyPair);

      const result = await plugin.createDerivedKeyPair('npub123', ['extra1', 'extra2']);

      expect(result).toEqual(mockKeyPair);
      expect(mockConnector.createDerivedKeyPair).toHaveBeenCalledWith('npub123', ['extra1', 'extra2']);
    });
  });

  describe('signWithDerivedKeys', () => {
    beforeEach(() => {
      plugin.initialize(mockCore);
    });

    it('should sign data with derived keys', async () => {
      mockConnector.signWithDerivedKeys.mockResolvedValue('signed_data');

      const result = await plugin.signWithDerivedKeys({ data: 'test' }, 'npub123', ['extra']);

      expect(result).toBe('signed_data');
      expect(mockConnector.signWithDerivedKeys).toHaveBeenCalledWith({ data: 'test' }, 'npub123', ['extra']);
    });
  });

  describe('getSigningCredential', () => {
    beforeEach(() => {
      plugin.initialize(mockCore);
    });

    it('should return signing credential if exists', () => {
      const mockCredential = {
        address: 'npub123',
        publicKey: 'pubkey123',
      };

      mockConnector.getSigningCredential.mockReturnValue(mockCredential);

      const result = plugin.getSigningCredential('npub123');

      expect(result).toEqual(mockCredential);
      expect(mockConnector.getSigningCredential).toHaveBeenCalledWith('npub123');
    });

    it('should return undefined if credential not found', () => {
      mockConnector.getSigningCredential.mockReturnValue(undefined);

      const result = plugin.getSigningCredential('npub123');

      expect(result).toBeUndefined();
    });
  });

  describe('listSigningCredentials', () => {
    beforeEach(() => {
      plugin.initialize(mockCore);
    });

    it('should return list of signing credentials', () => {
      const mockCredentials = [
        { address: 'npub123', publicKey: 'pubkey123' },
        { address: 'npub456', publicKey: 'pubkey456' },
      ];

      mockConnector.listSigningCredentials.mockReturnValue(mockCredentials);

      const result = plugin.listSigningCredentials();

      expect(result).toEqual(mockCredentials);
      expect(mockConnector.listSigningCredentials).toHaveBeenCalled();
    });
  });

  describe('removeSigningCredential', () => {
    beforeEach(() => {
      plugin.initialize(mockCore);
    });

    it('should remove signing credential successfully', () => {
      mockConnector.removeSigningCredential.mockReturnValue(true);

      const result = plugin.removeSigningCredential('npub123');

      expect(result).toBe(true);
      expect(mockConnector.removeSigningCredential).toHaveBeenCalledWith('npub123');
    });

    it('should return false if credential not found', () => {
      mockConnector.removeSigningCredential.mockReturnValue(false);

      const result = plugin.removeSigningCredential('npub123');

      expect(result).toBe(false);
    });
  });

  describe('createGunUserFromSigningCredential', () => {
    beforeEach(() => {
      plugin.initialize(mockCore);
    });

    it('should create Gun user successfully', async () => {
      const mockResult = {
        success: true,
        userPub: 'gun_pub_123',
      };

      mockConnector.createGunUserFromSigningCredential.mockResolvedValue(mockResult);

      const result = await plugin.createGunUserFromSigningCredential('npub123');

      expect(result).toEqual(mockResult);
      expect(mockConnector.createGunUserFromSigningCredential).toHaveBeenCalledWith('npub123');
    });

    it('should handle Gun user creation failure', async () => {
      const mockResult = {
        success: false,
        error: 'Creation failed',
      };

      mockConnector.createGunUserFromSigningCredential.mockResolvedValue(mockResult);

      const result = await plugin.createGunUserFromSigningCredential('npub123');

      expect(result).toEqual(mockResult);
    });
  });

  describe('getGunUserPubFromSigningCredential', () => {
    beforeEach(() => {
      plugin.initialize(mockCore);
    });

    it('should return Gun user public key', () => {
      mockConnector.getGunUserPubFromSigningCredential.mockReturnValue('gun_pub_123');

      const result = plugin.getGunUserPubFromSigningCredential('npub123');

      expect(result).toBe('gun_pub_123');
      expect(mockConnector.getGunUserPubFromSigningCredential).toHaveBeenCalledWith('npub123');
    });

    it('should return undefined if not found', () => {
      mockConnector.getGunUserPubFromSigningCredential.mockReturnValue(undefined);

      const result = plugin.getGunUserPubFromSigningCredential('npub123');

      expect(result).toBeUndefined();
    });
  });

  describe('getPassword', () => {
    beforeEach(() => {
      plugin.initialize(mockCore);
    });

    it('should return password for address', () => {
      mockConnector.getPassword.mockReturnValue('stored_password');

      const result = plugin.getPassword('npub123');

      expect(result).toBe('stored_password');
      expect(mockConnector.getPassword).toHaveBeenCalledWith('npub123');
    });

    it('should return undefined if password not found', () => {
      mockConnector.getPassword.mockReturnValue(undefined);

      const result = plugin.getPassword('npub123');

      expect(result).toBeUndefined();
    });
  });

  describe('verifyConsistency', () => {
    beforeEach(() => {
      plugin.initialize(mockCore);
    });

    it('should verify consistency successfully', async () => {
      const mockResult = {
        consistent: true,
        actualUserPub: 'gun_pub_123',
        expectedUserPub: 'gun_pub_123',
      };

      mockConnector.verifyConsistency.mockResolvedValue(mockResult);

      const result = await plugin.verifyConsistency('npub123', 'gun_pub_123');

      expect(result).toEqual(mockResult);
      expect(mockConnector.verifyConsistency).toHaveBeenCalledWith('npub123', 'gun_pub_123');
    });

    it('should detect inconsistency', async () => {
      const mockResult = {
        consistent: false,
        actualUserPub: 'gun_pub_123',
        expectedUserPub: 'gun_pub_456',
      };

      mockConnector.verifyConsistency.mockResolvedValue(mockResult);

      const result = await plugin.verifyConsistency('npub123', 'gun_pub_456');

      expect(result.consistent).toBe(false);
    });
  });

  describe('setupConsistentOneshotSigning', () => {
    beforeEach(() => {
      plugin.initialize(mockCore);
    });

    it('should setup consistent oneshot signing', async () => {
      const mockResult = {
        credential: { address: 'npub123', publicKey: 'pubkey123' },
        authenticator: jest.fn(),
        gunUser: { success: true, userPub: 'gun_pub_123' },
        username: 'npub123',
        password: 'generated_password',
      };

      mockConnector.setupConsistentOneshotSigning.mockResolvedValue(mockResult);

      const result = await plugin.setupConsistentOneshotSigning('npub123');

      expect(result).toEqual(mockResult);
      expect(mockConnector.setupConsistentOneshotSigning).toHaveBeenCalledWith('npub123');
    });
  });

  describe('login', () => {
    beforeEach(() => {
      plugin.initialize(mockCore);
    });

    it('should perform login successfully', async () => {
      const mockAuthResult = {
        success: true,
        user: { id: 'npub123', address: 'npub123' },
      };

      // Mock the internal flow
      jest.spyOn(plugin, 'setupConsistentOneshotSigning').mockResolvedValue({
        credential: { address: 'npub123', publicKey: 'pubkey123' },
        authenticator: jest.fn(),
        gunUser: { success: true, userPub: 'gun_pub_123' },
        username: 'npub123',
        password: 'generated_password',
      });

      // Mock core authentication
      plugin['core'] = {
        authenticate: jest.fn().mockResolvedValue(mockAuthResult),
      } as any;

      const result = await plugin.login('npub123');

      expect(result).toEqual(mockAuthResult);
    });

    it('should handle login failure', async () => {
      const mockAuthResult = {
        success: false,
        error: 'Authentication failed',
      };

      jest.spyOn(plugin, 'setupConsistentOneshotSigning').mockResolvedValue({
        credential: { address: 'npub123', publicKey: 'pubkey123' },
        authenticator: jest.fn(),
        gunUser: { success: false, error: 'Gun user creation failed' },
        username: 'npub123',
        password: 'generated_password',
      });

      const result = await plugin.login('npub123');

      expect(result.success).toBe(false);
    });
  });

  describe('signUp', () => {
    beforeEach(() => {
      plugin.initialize(mockCore);
    });

    it('should perform signup successfully', async () => {
      const mockSignUpResult = {
        success: true,
        user: { id: 'npub123', address: 'npub123' },
      };

      jest.spyOn(plugin, 'setupConsistentOneshotSigning').mockResolvedValue({
        credential: { address: 'npub123', publicKey: 'pubkey123' },
        authenticator: jest.fn(),
        gunUser: { success: true, userPub: 'gun_pub_123' },
        username: 'npub123',
        password: 'generated_password',
      });

      plugin['core'] = {
        signUp: jest.fn().mockResolvedValue(mockSignUpResult),
      } as any;

      const result = await plugin.signUp('npub123');

      expect(result).toEqual(mockSignUpResult);
    });
  });

  describe('loginWithBitcoinWallet', () => {
    beforeEach(() => {
      plugin.initialize(mockCore);
    });

    it('should login with Bitcoin wallet', async () => {
      const mockAuthResult = {
        success: true,
        user: { id: 'bc1address', address: 'bc1address' },
      };

      jest.spyOn(plugin, 'login').mockResolvedValue(mockAuthResult);

      const result = await plugin.loginWithBitcoinWallet('bc1address');

      expect(result).toEqual(mockAuthResult);
      expect(plugin.login).toHaveBeenCalledWith('bc1address');
    });
  });

  describe('signUpWithBitcoinWallet', () => {
    beforeEach(() => {
      plugin.initialize(mockCore);
    });

    it('should signup with Bitcoin wallet', async () => {
      const mockAuthResult = {
        success: true,
        user: { id: 'bc1address', address: 'bc1address' },
      };

      jest.spyOn(plugin, 'signUp').mockResolvedValue(mockAuthResult);

      const result = await plugin.signUpWithBitcoinWallet('bc1address');

      expect(result).toEqual(mockAuthResult);
      expect(plugin.signUp).toHaveBeenCalledWith('bc1address');
    });
  });

  describe('Error handling', () => {
    it('should handle connector initialization errors', () => {
      MockNostrConnector.mockImplementation(() => {
        throw new Error('Connector initialization failed');
      });

      expect(() => {
        plugin.initialize(mockCore);
      }).toThrow('Connector initialization failed');
    });

    it('should handle signer initialization errors', () => {
      MockNostrSigner.mockImplementation(() => {
        throw new Error('Signer initialization failed');
      });

      expect(() => {
        plugin.initialize(mockCore);
      }).toThrow('Signer initialization failed');
    });
  });
});
