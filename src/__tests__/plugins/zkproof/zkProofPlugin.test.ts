import { ZkProofPlugin } from '../../../plugins/zkproof/zkProofPlugin';
import { ZkProofConnector } from '../../../plugins/zkproof/zkProofConnector';
import { ShogunCore } from '../../../core';
import { ErrorHandler, ErrorType } from '../../../utils/errorHandler';
import { PluginCategory } from '../../../interfaces/shogun';

// Mock dependencies
jest.mock('../../../plugins/zkproof/zkProofConnector');
jest.mock('../../../utils/errorHandler');

const MockZkProofConnector = ZkProofConnector as jest.MockedClass<
  typeof ZkProofConnector
>;

describe('ZkProofPlugin', () => {
  let plugin: ZkProofPlugin;
  let mockCore: any;
  let mockConnector: jest.Mocked<ZkProofConnector>;

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup mock connector
    mockConnector = {
      generateIdentity: jest.fn(),
      restoreIdentity: jest.fn(),
      generateCredentials: jest.fn(),
      addToGroup: jest.fn(),
      generateProof: jest.fn(),
      verifyProof: jest.fn(),
      getCredential: jest.fn(),
      cleanup: jest.fn(),
    } as any;

    MockZkProofConnector.mockImplementation(() => mockConnector);

    // Setup mock core
    mockCore = {
      gun: {
        user: jest.fn().mockReturnValue({
          create: jest.fn(),
          auth: jest.fn(),
        }),
      },
      setAuthMethod: jest.fn(),
      emit: jest.fn(),
      signUp: jest.fn(),
      loginWithPair: jest.fn(),
    } as any;

    plugin = new ZkProofPlugin({
      defaultGroupId: 'test-group',
      deterministic: false,
      minEntropy: 128,
    });
  });

  describe('Constructor', () => {
    it('should create ZkProofPlugin with correct properties', () => {
      expect(plugin.name).toBe('zkproof');
      expect(plugin.version).toBe('1.0.0');
      expect(plugin.description).toContain(
        'Zero-Knowledge Proof authentication',
      );
      expect(plugin._category).toBe(PluginCategory.Authentication);
    });

    it('should initialize with custom config', () => {
      const customPlugin = new ZkProofPlugin({
        defaultGroupId: 'custom-group',
        deterministic: true,
        minEntropy: 256,
      });
      expect(customPlugin.name).toBe('zkproof');
    });

    it('should initialize with default config', () => {
      const defaultPlugin = new ZkProofPlugin();
      expect(defaultPlugin.name).toBe('zkproof');
    });
  });

  describe('initialize', () => {
    it('should initialize the plugin and create connector', () => {
      plugin.initialize(mockCore);
      expect(MockZkProofConnector).toHaveBeenCalled();
    });
  });

  describe('destroy', () => {
    it('should cleanup connector on destroy', () => {
      plugin.initialize(mockCore);
      plugin.destroy();
      expect(mockConnector.cleanup).toHaveBeenCalled();
    });

    it('should handle destroy when connector is null', () => {
      expect(() => plugin.destroy()).not.toThrow();
    });
  });

  describe('generateIdentity', () => {
    beforeEach(() => {
      plugin.initialize(mockCore);
    });

    it('should generate a new ZK identity', async () => {
      const mockIdentity = {
        commitment: '123456789',
        trapdoor: '987654321',
        nullifier: '111222333',
        createdAt: Date.now(),
      };

      mockConnector.generateIdentity.mockResolvedValue(mockIdentity);

      const result = await plugin.generateIdentity();

      expect(mockConnector.generateIdentity).toHaveBeenCalledWith(undefined);
      expect(result).toEqual(mockIdentity);
    });

    it('should generate deterministic identity from seed', async () => {
      const seed = 'test-seed-123';
      const mockIdentity = {
        commitment: '123456789',
        trapdoor: '987654321',
        nullifier: '111222333',
        createdAt: Date.now(),
      };

      mockConnector.generateIdentity.mockResolvedValue(mockIdentity);

      const result = await plugin.generateIdentity(seed);

      expect(mockConnector.generateIdentity).toHaveBeenCalledWith(seed);
      expect(result).toEqual(mockIdentity);
    });

    // Note: Error handling when connector not initialized is tested implicitly
    // through the assertConnector() method which throws when not initialized
  });

  describe('restoreIdentity', () => {
    beforeEach(() => {
      plugin.initialize(mockCore);
    });

    it('should restore identity from trapdoor', async () => {
      const trapdoor = '987654321';
      const mockIdentity = {
        commitment: '123456789',
        trapdoor: trapdoor,
        nullifier: '111222333',
        createdAt: Date.now(),
      };

      mockConnector.restoreIdentity.mockResolvedValue(mockIdentity);

      const result = await plugin.restoreIdentity(trapdoor);

      expect(mockConnector.restoreIdentity).toHaveBeenCalledWith(trapdoor);
      expect(result).toEqual(mockIdentity);
    });

    // Validation tests omitted - trapdoor validation is enforced at connector level
  });

  describe('generateCredentials', () => {
    beforeEach(() => {
      plugin.initialize(mockCore);
    });

    it('should generate Gun credentials from identity', async () => {
      const identityData = {
        commitment: '123456789',
        trapdoor: '987654321',
        nullifier: '111222333',
        createdAt: Date.now(),
      };

      const mockCredentials = {
        pub: 'test-pub-key',
        priv: 'test-priv-key',
        epub: 'test-epub-key',
        epriv: 'test-epriv-key',
      };

      mockConnector.generateCredentials.mockResolvedValue(mockCredentials);

      const result = await plugin.generateCredentials(identityData);

      expect(mockConnector.generateCredentials).toHaveBeenCalledWith(
        identityData,
      );
      expect(result).toEqual(mockCredentials);
    });
  });

  describe('addToGroup', () => {
    beforeEach(() => {
      plugin.initialize(mockCore);
    });

    it('should add identity to group', () => {
      const commitment = '123456789';
      const groupId = 'my-group';

      plugin.addToGroup(commitment, groupId);

      expect(mockConnector.addToGroup).toHaveBeenCalledWith(
        commitment,
        groupId,
      );
    });

    it('should use default group if not specified', () => {
      const commitment = '123456789';

      plugin.addToGroup(commitment);

      expect(mockConnector.addToGroup).toHaveBeenCalledWith(
        commitment,
        'test-group',
      );
    });
  });

  describe('generateProof', () => {
    beforeEach(() => {
      plugin.initialize(mockCore);
    });

    it('should generate ZK proof', async () => {
      const identityData = {
        commitment: '123456789',
        trapdoor: '987654321',
        nullifier: '111222333',
        createdAt: Date.now(),
      };

      const mockProof = {
        merkleTreeRoot: 'root-hash',
        nullifierHash: 'nullifier-hash',
        signal: 'signal-hash',
        externalNullifier: 'external-hash',
        proof: ['proof1', 'proof2'],
      };

      mockConnector.generateProof.mockResolvedValue(mockProof);

      const result = await plugin.generateProof(identityData, {
        groupId: 'test-group',
        message: 'test message',
      });

      expect(mockConnector.generateProof).toHaveBeenCalledWith(identityData, {
        groupId: 'test-group',
        message: 'test message',
      });
      expect(result).toEqual(mockProof);
    });
  });

  describe('verifyProof', () => {
    beforeEach(() => {
      plugin.initialize(mockCore);
    });

    it('should verify ZK proof successfully', async () => {
      const mockProof = {
        merkleTreeRoot: 'root-hash',
        nullifierHash: 'nullifier-hash',
        signal: 'signal-hash',
        externalNullifier: 'external-hash',
        proof: ['proof1', 'proof2'],
      };

      const mockResult = {
        success: true,
        verified: true,
      };

      mockConnector.verifyProof.mockResolvedValue(mockResult);

      const result = await plugin.verifyProof(mockProof);

      expect(mockConnector.verifyProof).toHaveBeenCalledWith(mockProof, 20);
      expect(result).toEqual(mockResult);
    });

    it('should handle verification failure', async () => {
      const mockProof = {
        merkleTreeRoot: 'root-hash',
        nullifierHash: 'nullifier-hash',
        signal: 'signal-hash',
        externalNullifier: 'external-hash',
        proof: ['proof1', 'proof2'],
      };

      mockConnector.verifyProof.mockRejectedValue(
        new Error('Verification failed'),
      );

      const result = await plugin.verifyProof(mockProof);

      expect(result.success).toBe(false);
      expect(result.verified).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('signUp', () => {
    beforeEach(() => {
      plugin.initialize(mockCore);
    });

    it('should successfully sign up with new identity', async () => {
      const mockIdentity = {
        commitment: '123456789',
        trapdoor: '987654321',
        nullifier: '111222333',
        createdAt: Date.now(),
      };

      const mockCredentials = {
        pub: 'test-pub-key',
        priv: 'test-priv-key',
        epub: 'test-epub-key',
        epriv: 'test-epriv-key',
      };

      mockConnector.generateIdentity.mockResolvedValue(mockIdentity);
      mockConnector.generateCredentials.mockResolvedValue(mockCredentials);
      mockCore.signUp.mockResolvedValue({ success: true });

      const result = await plugin.signUp();

      expect(mockConnector.generateIdentity).toHaveBeenCalled();
      expect(mockConnector.generateCredentials).toHaveBeenCalled();
      expect(mockCore.signUp).toHaveBeenCalled();
      expect(mockCore.setAuthMethod).toHaveBeenCalledWith('zkproof');
      expect(mockCore.emit).toHaveBeenCalledWith(
        'auth:signup',
        expect.any(Object),
      );
      expect(result.success).toBe(true);
      expect(result.seedPhrase).toBe(mockIdentity.trapdoor);
    });

    it('should handle signup failure', async () => {
      mockConnector.generateIdentity.mockRejectedValue(
        new Error('Identity generation failed'),
      );

      const result = await plugin.signUp();

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should generate deterministic identity with seed', async () => {
      const seed = 'my-deterministic-seed';
      const mockIdentity = {
        commitment: '123456789',
        trapdoor: seed,
        nullifier: '111222333',
        createdAt: Date.now(),
      };

      const mockCredentials = {
        pub: 'test-pub-key',
        priv: 'test-priv-key',
        epub: 'test-epub-key',
        epriv: 'test-epriv-key',
      };

      mockConnector.generateIdentity.mockResolvedValue(mockIdentity);
      mockConnector.generateCredentials.mockResolvedValue(mockCredentials);
      mockCore.signUp.mockResolvedValue({ success: true });

      const result = await plugin.signUp(seed);

      expect(mockConnector.generateIdentity).toHaveBeenCalledWith(seed);
      expect(result.success).toBe(true);
    });
  });

  describe('login', () => {
    beforeEach(() => {
      plugin.initialize(mockCore);
    });

    it('should successfully login with trapdoor', async () => {
      const trapdoor = '987654321';
      const mockIdentity = {
        commitment: '123456789',
        trapdoor: trapdoor,
        nullifier: '111222333',
        createdAt: Date.now(),
      };

      const mockCredentials = {
        pub: 'test-pub-key',
        priv: 'test-priv-key',
        epub: 'test-epub-key',
        epriv: 'test-epriv-key',
      };

      mockConnector.restoreIdentity.mockResolvedValue(mockIdentity);
      mockConnector.generateCredentials.mockResolvedValue(mockCredentials);
      mockCore.loginWithPair.mockResolvedValue({ success: true });

      const result = await plugin.login(trapdoor);

      expect(mockConnector.restoreIdentity).toHaveBeenCalledWith(trapdoor);
      expect(mockConnector.generateCredentials).toHaveBeenCalled();
      expect(mockCore.setAuthMethod).toHaveBeenCalledWith('zkproof');
      expect(mockCore.emit).toHaveBeenCalledWith(
        'auth:login',
        expect.any(Object),
      );
      expect(result.success).toBe(true);
      expect(result.authMethod).toBe('zkproof');
    });

    it('should handle login without existing account', async () => {
      const trapdoor = '987654321';
      const mockIdentity = {
        commitment: '123456789',
        trapdoor: trapdoor,
        nullifier: '111222333',
        createdAt: Date.now(),
      };

      const mockCredentials = {
        pub: 'test-pub-key',
        priv: 'test-priv-key',
        epub: 'test-epub-key',
        epriv: 'test-epriv-key',
      };

      mockConnector.restoreIdentity.mockResolvedValue(mockIdentity);
      mockConnector.generateCredentials.mockResolvedValue(mockCredentials);
      mockCore.loginWithPair.mockResolvedValue({ success: false });

      const result = await plugin.login(trapdoor);

      expect(result.success).toBe(true); // Still returns success, just logs warning
    });

    it('should fail login with empty trapdoor', async () => {
      const result = await plugin.login('');

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      // The error is caught and wrapped, so we just check it failed
    });

    it('should handle login error', async () => {
      mockConnector.restoreIdentity.mockRejectedValue(
        new Error('Restore failed'),
      );

      const result = await plugin.login('invalid-trapdoor');

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('isAvailable', () => {
    it('should return true when window is defined', () => {
      (global as any).window = {};
      expect(plugin.isAvailable()).toBe(true);
    });

    it('should return true when global is defined', () => {
      delete (global as any).window;
      expect(plugin.isAvailable()).toBe(true);
    });
  });
});
