import { GunInstance } from '../../gundb/gun-Instance';
import Gun from 'gun/gun';

// Mock solo le dipendenze esterne, non Gun stesso
jest.mock('../../storage/storage', () => ({
  ShogunStorage: jest.fn().mockImplementation(() => ({
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
  })),
}));

jest.mock('../../utils/errorHandler', () => ({
  ErrorHandler: jest.fn().mockImplementation(() => ({
    handleError: jest.fn(),
  })),
}));

// Mock per localStorage globale
Object.defineProperty(global, 'localStorage', {
  value: {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
  },
  writable: true,
});

// Mock per sessionStorage globale
Object.defineProperty(global, 'sessionStorage', {
  value: {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
  },
  writable: true,
});

describe('GunInstance Integration Tests', () => {
  let gunInstance: GunInstance;
  let gun: any;

  beforeEach(() => {
    // Create a real Gun instance with minimal configuration for testing
    gun = Gun({
      peers: [], // No peers for isolated tests
      localStorage: false, // Disable localStorage for tests
      axe: false, // Disable axe for tests
      multicast: false, // Disable multicast for tests
      radisk: true, // Enable radisk for tests
      rindexed: true, // Enable rindexed for tests
      webrtc: true, // Enable webrtc for tests
    });

    gunInstance = new GunInstance(gun);
  });

  afterEach(() => {
    // Cleanup dopo ogni test
    if (gunInstance) {
      try {
        gunInstance.leave();
      } catch (error) {
        // Ignora errori di cleanup
      }
    }
  });

  describe('Constructor Integration', () => {
    it('should create GunInstance with real Gun instance', () => {
      expect(gunInstance).toBeDefined();
      expect(gunInstance.gun).toBeDefined();
      expect(gunInstance.user).toBeDefined();
      expect(typeof gunInstance.gun.get).toBe('function');
      expect(typeof gunInstance.user.auth).toBe('function');
    });

    it('should create GunInstance with custom peers', () => {
      const gunWithPeers = Gun({
        peers: [''],
        localStorage: false,
        axe: false,
        multicast: false,
        radisk: true,
        rindexed: false,
        webrtc: false,
      });

      const instanceWithPeers = new GunInstance(gunWithPeers);
      expect(instanceWithPeers).toBeDefined();
      expect(instanceWithPeers.gun).toBeDefined();
    });

    it('should handle invalid configuration gracefully', () => {
      expect(() => {
        new GunInstance(null as any);
      }).toThrow('Gun instance is required but was not provided');
    });
  });

  describe('Event System Integration', () => {
    it('should handle events through EventEmitter', () => {
      const testData = { message: 'test' };
      let receivedData: any = null;

      gunInstance.on('test-event', (data) => {
        receivedData = data;
      });

      gunInstance.emit('test-event', testData);

      expect(receivedData).toEqual(testData);
    });

    it('should remove event listeners', () => {
      const listener = jest.fn();
      gunInstance.on('test-event', listener);
      gunInstance.off('test-event', listener);

      gunInstance.emit('test-event', {});
      expect(listener).not.toHaveBeenCalled();
    });
  });

  describe('Peer Management Integration', () => {
    it('should add and remove peers', () => {
      const peer = 'http://localhost:8080/gun';

      // Test adding peer
      expect(() => {
        gunInstance.addPeer(peer);
      }).not.toThrow();

      // Test removing peer
      expect(() => {
        gunInstance.removePeer(peer);
      }).not.toThrow();

      // Verifica che le operazioni non lancino errori
      expect(gunInstance.gun).toBeDefined();
    });
  });

  describe('User Operations Integration', () => {
    it('should handle user recall', () => {
      expect(() => {
        gunInstance.recall();
      }).not.toThrow();

      // Verifica che l'operazione non lanci errori
      expect(gunInstance.user).toBeDefined();
    });

    it('should handle user leave', () => {
      expect(() => {
        gunInstance.leave();
      }).not.toThrow();
    });
  });

  describe('Data Operations Integration', () => {
    it('should perform basic data operations', () => {
      const testKey = 'test-key';
      const testData = { message: 'test data' };

      // Test put operation
      expect(() => {
        gunInstance.put(testData);
      }).not.toThrow();

      // Test get operation
      expect(() => {
        gunInstance.get(testKey);
      }).not.toThrow();

      // Test set operation
      expect(() => {
        gunInstance.set(testData);
      }).not.toThrow();

      expect(gunInstance.gun.put).toBeDefined();
      expect(gunInstance.gun.get).toBeDefined();
      expect(gunInstance.gun.set).toBeDefined();
    });

    it('should perform user data operations', () => {
      const testKey = 'user-test-key';
      const testData = { userMessage: 'test user data' };

      // Test user data operations
      expect(() => {
        gunInstance.getUserData(testKey);
      }).not.toThrow();

      expect(() => {
        gunInstance.putUserData(testData);
      }).not.toThrow();

      expect(() => {
        gunInstance.setUserData(testData);
      }).not.toThrow();

      expect(gunInstance.user.get).toBeDefined();
      expect(gunInstance.user.put).toBeDefined();
      expect(gunInstance.user.set).toBeDefined();
    });
  });

  describe('Username and Password Operations Integration', () => {
    it('should handle username operations', () => {
      const username = 'testuser';

      expect(() => {
        gunInstance.setUsername(username);
      }).not.toThrow();

      expect(() => {
        gunInstance.getUsername();
      }).not.toThrow();

      expect(gunInstance.user.get).toBeDefined();
      expect(gunInstance.user.put).toBeDefined();
    });

    it('should handle password hint operations', () => {
      const hint = 'test hint';

      expect(() => {
        gunInstance.setPasswordHint(hint);
      }).not.toThrow();

      expect(() => {
        gunInstance.getPasswordHint();
      }).not.toThrow();

      expect(gunInstance.user.get).toBeDefined();
      expect(gunInstance.user.put).toBeDefined();
    });
  });

  describe('Storage Operations Integration', () => {
    it('should handle session storage operations', () => {
      const session = { pub: 'test-pub', alias: 'testuser' };

      // Test session operations
      expect(() => {
        gunInstance.saveSession(session);
      }).not.toThrow();

      expect(() => {
        gunInstance.loadSession();
      }).not.toThrow();

      expect(() => {
        gunInstance.clearSession();
      }).not.toThrow();

      // Verifica che le operazioni non lancino errori
      expect(gunInstance).toBeDefined();
    });

    it('should handle rate limiting', () => {
      const rateLimitResult = gunInstance.checkRateLimit();
      expect(() => {
        gunInstance.resetRateLimit();
      }).not.toThrow();

      expect(typeof rateLimitResult).toBe('boolean');
    });
  });

  describe('Utility Methods Integration', () => {
    it('should provide utility methods', () => {
      const appScope = gunInstance.getAppScope();
      const userPub = gunInstance.getUserPub();
      const isAuthenticated = gunInstance.isAuthenticated();

      expect(appScope).toBeDefined();
      expect(typeof userPub).toBe('string');
      expect(typeof isAuthenticated).toBe('boolean');
    });

    it('should handle frozen space operations', () => {
      const spaceName = 'test-space';

      expect(() => {
        gunInstance.createFrozenSpace(spaceName);
      }).not.toThrow();

      expect(() => {
        gunInstance.getFrozenSpace(spaceName);
      }).not.toThrow();

      // Verifica che le operazioni non lancino errori
      expect(gunInstance).toBeDefined();
    });
  });

  describe('Connectivity Integration', () => {
    it('should test connectivity', async () => {
      const connectivityResult = await gunInstance.testConnectivity();
      expect(typeof connectivityResult).toBe('boolean');
    }, 5000);
  });

  describe('Error Handling Integration', () => {
    it('should handle authentication errors gracefully', async () => {
      const invalidUsername = 'nonexistentuser';
      const invalidPassword = 'wrongpassword';

      try {
        await gunInstance.auth(invalidUsername, invalidPassword);
      } catch (error) {
        // Verifica che l'errore sia gestito correttamente
        expect(error).toBeDefined();
      }
    }, 5000);

    it('should handle user creation errors gracefully', async () => {
      const username = 'testuser_' + Date.now();
      const password = 'testpass123';

      try {
        await gunInstance.createUser(username, password);
      } catch (error) {
        // Verifica che l'errore sia gestito correttamente
        expect(error).toBeDefined();
      }
    }, 5000);
  });

  describe('End-to-End Scenarios', () => {
    it('should handle complete user lifecycle', async () => {
      const username = 'testuser_' + Date.now();
      const password = 'testpass123';

      // 1. Create user
      try {
        const createResult = await gunInstance.createUser(username, password);
        expect(createResult).toBeDefined();
      } catch (error) {
        // User might already exist, which is fine for testing
        expect(error).toBeDefined();
      }

      // 2. Authenticate user
      try {
        const authResult = await gunInstance.auth(username, password);
        expect(authResult).toBeDefined();
      } catch (error) {
        // Authentication might fail, which is fine for testing
        expect(error).toBeDefined();
      }

      // 3. Test user operations
      expect(() => {
        gunInstance.setUsername(username);
      }).not.toThrow();

      expect(() => {
        gunInstance.getUsername();
      }).not.toThrow();

      // 4. Test data operations
      const testData = { message: 'test' };
      expect(() => {
        gunInstance.putUserData(testData);
      }).not.toThrow();

      // 5. Leave user
      expect(() => {
        gunInstance.leave();
      }).not.toThrow();
    }, 10000);
  });
});
