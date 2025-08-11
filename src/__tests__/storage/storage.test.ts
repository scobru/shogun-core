import { ShogunStorage } from '../../storage/storage';

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

// Mock process.env
const originalEnv = process.env;

describe('ShogunStorage', () => {
  let storage: ShogunStorage;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset process.env
    process.env = { ...originalEnv };
    
    // Mock localStorage
    Object.defineProperty(global, 'localStorage', {
      value: mockLocalStorage,
      writable: true,
    });
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('Constructor', () => {
    it('should initialize storage in test mode', () => {
      process.env.NODE_ENV = 'test';
      storage = new ShogunStorage();
      
      expect(storage).toBeDefined();
    });

    it('should initialize storage in non-test mode with localStorage available', () => {
      process.env.NODE_ENV = 'production';
      mockLocalStorage.setItem.mockReturnValue(undefined);
      mockLocalStorage.removeItem.mockReturnValue(undefined);
      mockLocalStorage.getItem.mockReturnValue('{"test": "data"}');
      
      storage = new ShogunStorage();
      
      expect(storage).toBeDefined();
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('_shogun_test', '_shogun_test');
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('_shogun_test');
      expect(mockLocalStorage.getItem).toHaveBeenCalledWith('shogun_keypair');
    });

    it('should handle localStorage not available', () => {
      process.env.NODE_ENV = 'production';
      mockLocalStorage.setItem.mockImplementation(() => {
        throw new Error('localStorage not available');
      });
      
      storage = new ShogunStorage();
      
      expect(storage).toBeDefined();
    });

    it('should handle localStorage error during initialization', () => {
      process.env.NODE_ENV = 'production';
      mockLocalStorage.setItem.mockReturnValue(undefined);
      mockLocalStorage.removeItem.mockReturnValue(undefined);
      mockLocalStorage.getItem.mockImplementation(() => {
        throw new Error('localStorage error');
      });
      
      storage = new ShogunStorage();
      
      expect(storage).toBeDefined();
    });
  });

  describe('getPair', () => {
    beforeEach(() => {
      storage = new ShogunStorage();
    });

    it('should return null when no keypair is stored', async () => {
      const result = await storage.getPair();
      expect(result).toBeNull();
    });

    it('should return stored keypair', async () => {
      const testPair = { pub: 'test-pub', priv: 'test-priv' };
      await storage.setPair(testPair);
      
      const result = await storage.getPair();
      expect(result).toEqual(testPair);
    });
  });

  describe('getPairSync', () => {
    beforeEach(() => {
      storage = new ShogunStorage();
    });

    it('should return null when no keypair is stored', () => {
      const result = storage.getPairSync();
      expect(result).toBeNull();
    });

    it('should return stored keypair', () => {
      const testPair = { pub: 'test-pub', priv: 'test-priv' };
      storage.setPair(testPair);
      
      const result = storage.getPairSync();
      expect(result).toEqual(testPair);
    });
  });

  describe('setPair', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'production';
      mockLocalStorage.setItem.mockReturnValue(undefined);
      mockLocalStorage.removeItem.mockReturnValue(undefined);
      storage = new ShogunStorage();
    });

    it('should store keypair in memory', async () => {
      const testPair = { pub: 'test-pub', priv: 'test-priv' };
      
      await storage.setPair(testPair);
      
      const result = storage.getPairSync();
      expect(result).toEqual(testPair);
    });

    it('should store keypair in localStorage when available', async () => {
      const testPair = { pub: 'test-pub', priv: 'test-priv' };
      
      await storage.setPair(testPair);
      
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'shogun_keypair',
        JSON.stringify(testPair)
      );
    });

    it('should handle localStorage error during setPair', async () => {
      const testPair = { pub: 'test-pub', priv: 'test-priv' };
      mockLocalStorage.setItem.mockImplementation(() => {
        throw new Error('localStorage error');
      });
      
      await storage.setPair(testPair);
      
      // Should still store in memory
      const result = storage.getPairSync();
      expect(result).toEqual(testPair);
    });
  });

  describe('clearAll', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'production';
      mockLocalStorage.setItem.mockReturnValue(undefined);
      mockLocalStorage.removeItem.mockReturnValue(undefined);
      storage = new ShogunStorage();
    });

    it('should clear all stored data from memory', async () => {
      const testPair = { pub: 'test-pub', priv: 'test-priv' };
      await storage.setPair(testPair);
      
      storage.clearAll();
      
      const result = storage.getPairSync();
      expect(result).toBeNull();
    });

    it('should clear data from localStorage when available', async () => {
      const testPair = { pub: 'test-pub', priv: 'test-priv' };
      await storage.setPair(testPair);
      
      storage.clearAll();
      
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('shogun_keypair');
    });

    it('should handle localStorage error during clearAll', () => {
      mockLocalStorage.removeItem.mockImplementation(() => {
        throw new Error('localStorage error');
      });
      
      storage.clearAll();
      
      // Should not throw error
      expect(storage.getPairSync()).toBeNull();
    });
  });

  describe('getItem', () => {
    beforeEach(() => {
      storage = new ShogunStorage();
    });

    it('should return null for non-existent key', () => {
      const result = storage.getItem('non-existent');
      expect(result).toBeNull();
    });

    it('should return string value directly', () => {
      storage.setItem('test-key', '"test-value"');
      
      const result = storage.getItem('test-key');
      expect(result).toBe('"test-value"');
    });

    it('should return JSON string for object value', () => {
      const testObj = { name: 'test', value: 123 };
      storage.setItem('test-key', JSON.stringify(testObj));
      
      const result = storage.getItem('test-key');
      expect(result).toBe(JSON.stringify(testObj));
    });

    it('should handle non-JSON string values', () => {
      storage.setItem('test-key', 'plain-string');
      
      const result = storage.getItem('test-key');
      expect(result).toBe('plain-string');
    });
  });

  describe('setItem', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'production';
      mockLocalStorage.setItem.mockReturnValue(undefined);
      mockLocalStorage.removeItem.mockReturnValue(undefined);
      storage = new ShogunStorage();
    });

    it('should store JSON string value', () => {
      const testObj = { name: 'test', value: 123 };
      const jsonString = JSON.stringify(testObj);
      
      storage.setItem('test-key', jsonString);
      
      const result = storage.getItem('test-key');
      expect(result).toBe(jsonString);
    });

    it('should store plain string value', () => {
      const plainString = 'plain-string-value';
      
      storage.setItem('test-key', plainString);
      
      const result = storage.getItem('test-key');
      expect(result).toBe(plainString);
    });

    it('should store in localStorage when available', () => {
      const testValue = '{"name": "test"}';
      
      storage.setItem('test-key', testValue);
      
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('test-key', testValue);
    });

    it('should handle localStorage error during setItem', () => {
      mockLocalStorage.setItem.mockImplementation(() => {
        throw new Error('localStorage error');
      });
      
      storage.setItem('test-key', 'test-value');
      
      // Should still store in memory
      const result = storage.getItem('test-key');
      expect(result).toBe('test-value');
    });

    it('should handle invalid JSON gracefully', () => {
      const invalidJson = 'invalid-json{';
      
      storage.setItem('test-key', invalidJson);
      
      const result = storage.getItem('test-key');
      expect(result).toBe(invalidJson);
    });
  });

  describe('removeItem', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'production';
      mockLocalStorage.setItem.mockReturnValue(undefined);
      mockLocalStorage.removeItem.mockReturnValue(undefined);
      storage = new ShogunStorage();
    });

    it('should remove item from memory', () => {
      storage.setItem('test-key', 'test-value');
      
      storage.removeItem('test-key');
      
      const result = storage.getItem('test-key');
      expect(result).toBeNull();
    });

    it('should remove item from localStorage when available', () => {
      storage.setItem('test-key', 'test-value');
      
      storage.removeItem('test-key');
      
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('test-key');
    });

    it('should handle localStorage error during removeItem', () => {
      mockLocalStorage.removeItem.mockImplementation(() => {
        throw new Error('localStorage error');
      });
      
      storage.setItem('test-key', 'test-value');
      storage.removeItem('test-key');
      
      // Should still remove from memory
      const result = storage.getItem('test-key');
      expect(result).toBeNull();
    });

    it('should handle removing non-existent key', () => {
      storage.removeItem('non-existent');
      
      // Should not throw error
      expect(storage.getItem('non-existent')).toBeNull();
    });
  });

  describe('Integration tests', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'production';
      mockLocalStorage.setItem.mockReturnValue(undefined);
      mockLocalStorage.removeItem.mockReturnValue(undefined);
      storage = new ShogunStorage();
    });

    it('should handle multiple operations correctly', async () => {
      // Set multiple items
      storage.setItem('key1', 'value1');
      storage.setItem('key2', '{"name": "test"}');
      
      // Set keypair
      const testPair = { pub: 'test-pub', priv: 'test-priv' };
      await storage.setPair(testPair);
      
      // Verify all items are stored
      expect(storage.getItem('key1')).toBe('value1');
      expect(storage.getItem('key2')).toBe('{"name": "test"}');
      expect(await storage.getPair()).toEqual(testPair);
      
      // Remove one item
      storage.removeItem('key1');
      expect(storage.getItem('key1')).toBeNull();
      expect(storage.getItem('key2')).toBe('{"name": "test"}');
      
      // Clear all
      storage.clearAll();
      expect(storage.getItem('key1')).toBeNull();
      expect(storage.getItem('key2')).toBeNull();
      expect(await storage.getPair()).toBeNull();
    });

    it('should handle complex object storage', () => {
      const complexObj = {
        user: {
          name: 'test-user',
          preferences: {
            theme: 'dark',
            language: 'en'
          }
        },
        metadata: {
          created: new Date().toISOString(),
          version: '1.0.0'
        }
      };
      
      storage.setItem('complex-key', JSON.stringify(complexObj));
      
      const result = storage.getItem('complex-key');
      expect(JSON.parse(result!)).toEqual(complexObj);
    });

    it('should handle edge cases', () => {
      // Empty string
      storage.setItem('empty-key', '');
      expect(storage.getItem('empty-key')).toBe('');
      
      // Null string
      storage.setItem('null-key', 'null');
      expect(storage.getItem('null-key')).toBe('null');
      
      // Special characters
      storage.setItem('special-key', '{"text": "Hello\nWorld\tTab"}');
      expect(storage.getItem('special-key')).toBe('{"text": "Hello\nWorld\tTab"}');
    });
  });

  describe('Error handling', () => {
    it('should handle localStorage completely unavailable', () => {
      // Remove localStorage from global
      Object.defineProperty(global, 'localStorage', {
        value: undefined,
        writable: true,
      });
      
      storage = new ShogunStorage();
      
      // Should still work with in-memory storage
      storage.setItem('test-key', 'test-value');
      expect(storage.getItem('test-key')).toBe('test-value');
    });

    it('should handle localStorage methods throwing errors', () => {
      process.env.NODE_ENV = 'production';
      mockLocalStorage.setItem.mockImplementation(() => {
        throw new Error('localStorage setItem error');
      });
      mockLocalStorage.getItem.mockImplementation(() => {
        throw new Error('localStorage getItem error');
      });
      mockLocalStorage.removeItem.mockImplementation(() => {
        throw new Error('localStorage removeItem error');
      });
      
      storage = new ShogunStorage();
      
      // Should still work with in-memory storage
      storage.setItem('test-key', 'test-value');
      expect(storage.getItem('test-key')).toBe('test-value');
      
      storage.removeItem('test-key');
      expect(storage.getItem('test-key')).toBeNull();
    });
  });
});
