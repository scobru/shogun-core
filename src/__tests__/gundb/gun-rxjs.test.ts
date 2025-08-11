import { GunRxJS } from '../../gundb/gun-rxjs';
import { Observable } from 'rxjs';
import { IGunInstance, IGunUserInstance } from 'gun';

// Mock RxJS con implementazione semplificata
jest.mock('rxjs', () => ({
  Observable: jest.fn().mockImplementation((fn) => {
    const observable = {
      pipe: jest.fn(() => observable),
      subscribe: jest.fn(),
    };
    if (fn) {
      // Simula la chiamata del subscriber
      const mockSubscriber = {
        next: jest.fn(),
        error: jest.fn(),
        complete: jest.fn(),
      };
      fn(mockSubscriber);
    }
    return observable;
  }),
}));

jest.mock('rxjs/operators', () => ({
  distinctUntilChanged: jest.fn(() => (source: any) => source),
}));

describe('GunRxJS', () => {
  let gunRxJS: GunRxJS;
  let mockGun: jest.Mocked<IGunInstance<any>>;
  let mockUser: jest.Mocked<IGunUserInstance<any>>;
  let mockNode: any;

  beforeEach(() => {
    jest.clearAllMocks();

    // Create mock node
    mockNode = {
      on: jest.fn(),
      off: jest.fn(),
      put: jest.fn(),
      set: jest.fn(),
      once: jest.fn(),
      map: jest.fn(() => mockNode),
      get: jest.fn(() => mockNode),
    };

    // Create mock user
    mockUser = {
      is: { pub: 'test-pub' },
      get: jest.fn(() => mockNode),
      put: jest.fn(),
      set: jest.fn(),
      once: jest.fn(),
      on: jest.fn(),
      off: jest.fn(),
      leave: jest.fn(),
      recall: jest.fn(),
      create: jest.fn(),
      auth: jest.fn(),
    } as any;

    // Create mock gun instance
    mockGun = {
      user: jest.fn(() => mockUser),
      get: jest.fn(() => mockNode),
      put: jest.fn(),
      set: jest.fn(),
      once: jest.fn(),
      on: jest.fn(),
      off: jest.fn(),
    } as any;

    gunRxJS = new GunRxJS(mockGun);
  });

  describe('Constructor', () => {
    it('should create GunRxJS instance with gun instance', () => {
      expect(gunRxJS).toBeDefined();
      expect(mockGun.user).toHaveBeenCalled();
    });
  });

  describe('getUser', () => {
    it('should return the current user', () => {
      const result = gunRxJS.getUser();
      expect(result).toBe(mockUser);
    });
  });

  describe('getUserPub', () => {
    it('should return user public key when available', () => {
      const result = gunRxJS.getUserPub();
      expect(result).toBe('test-pub');
    });

    it('should return undefined when user pub is not available', () => {
      mockUser.is = undefined;
      const result = gunRxJS.getUserPub();
      expect(result).toBeUndefined();
    });
  });

  describe('observe', () => {
    it('should create observable for string path', () => {
      const result = gunRxJS.observe('test-path');

      expect(mockGun.get).toHaveBeenCalledWith('test-path');
      expect(Observable).toHaveBeenCalled();
      expect(result).toBeDefined();
      expect(typeof result.pipe).toBe('function');
    });

    it('should create observable for array path', () => {
      const result = gunRxJS.observe(['path1', 'path2']);

      expect(mockGun.get).toHaveBeenCalledWith('path1');
      expect(Observable).toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it('should create observable for node', () => {
      const result = gunRxJS.observe(mockNode);

      expect(Observable).toHaveBeenCalled();
      expect(result).toBeDefined();
    });
  });

  describe('observeUser', () => {
    it('should create user observe observable', () => {
      const result = gunRxJS.observeUser();

      expect(mockUser.get).toHaveBeenCalledWith('~');
      expect(Observable).toHaveBeenCalled();
      expect(result).toBeDefined();
    });
  });

  describe('userGet', () => {
    it('should create user get observable', () => {
      const result = gunRxJS.userGet('test-path');

      expect(mockUser.get).toHaveBeenCalledWith('test-path');
      expect(Observable).toHaveBeenCalled();
      expect(result).toBeDefined();
    });
  });

  describe('put', () => {
    it('should create put observable', () => {
      const data = { test: 'data' };
      const result = gunRxJS.put(data);

      expect(mockGun.put).toHaveBeenCalledWith(data);
      expect(Observable).toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it('should create put observable with callback', () => {
      const data = { test: 'data' };
      const callback = jest.fn();
      const result = gunRxJS.put(data, callback);

      expect(mockGun.put).toHaveBeenCalledWith(data, callback);
      expect(Observable).toHaveBeenCalled();
      expect(result).toBeDefined();
    });
  });

  describe('set', () => {
    it('should create set observable', () => {
      const data = { test: 'data' };
      const result = gunRxJS.set(data);

      expect(mockGun.set).toHaveBeenCalledWith(data);
      expect(Observable).toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it('should create set observable with callback', () => {
      const data = { test: 'data' };
      const callback = jest.fn();
      const result = gunRxJS.set(data, callback);

      expect(mockGun.set).toHaveBeenCalledWith(data, callback);
      expect(Observable).toHaveBeenCalled();
      expect(result).toBeDefined();
    });
  });

  describe('once', () => {
    it('should create once observable', () => {
      const result = gunRxJS.once();

      expect(mockGun.once).toHaveBeenCalled();
      expect(Observable).toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it('should create once observable with callback', () => {
      const callback = jest.fn();
      const result = gunRxJS.once(callback);

      expect(mockGun.once).toHaveBeenCalledWith(callback);
      expect(Observable).toHaveBeenCalled();
      expect(result).toBeDefined();
    });
  });

  describe('userPut', () => {
    it('should create user put observable', () => {
      const data = { test: 'data' };
      const result = gunRxJS.userPut(data);

      expect(mockUser.put).toHaveBeenCalledWith(data);
      expect(Observable).toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it('should create user put observable with callback', () => {
      const data = { test: 'data' };
      const callback = jest.fn();
      const result = gunRxJS.userPut(data, callback);

      expect(mockUser.put).toHaveBeenCalledWith(data, callback);
      expect(Observable).toHaveBeenCalled();
      expect(result).toBeDefined();
    });
  });

  describe('userSet', () => {
    it('should create user set observable', () => {
      const data = { test: 'data' };
      const result = gunRxJS.userSet(data);

      expect(mockUser.set).toHaveBeenCalledWith(data);
      expect(Observable).toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it('should create user set observable with callback', () => {
      const data = { test: 'data' };
      const callback = jest.fn();
      const result = gunRxJS.userSet(data, callback);

      expect(mockUser.set).toHaveBeenCalledWith(data, callback);
      expect(Observable).toHaveBeenCalled();
      expect(result).toBeDefined();
    });
  });

  describe('userOnce', () => {
    it('should create user once observable', () => {
      const result = gunRxJS.userOnce();

      expect(mockUser.once).toHaveBeenCalled();
      expect(Observable).toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it('should create user once observable with callback', () => {
      const callback = jest.fn();
      const result = gunRxJS.userOnce(callback);

      expect(mockUser.once).toHaveBeenCalledWith(callback);
      expect(Observable).toHaveBeenCalled();
      expect(result).toBeDefined();
    });
  });

  describe('match', () => {
    it('should match data correctly', () => {
      const data = { name: 'test', age: 25 };
      const matchData = { name: 'test' };

      const result = gunRxJS.match(data, matchData);
      expect(result).toBe(true);
    });

    it('should not match when data is different', () => {
      const data = { name: 'test', age: 25 };
      const matchData = { name: 'different' };

      const result = gunRxJS.match(data, matchData);
      expect(result).toBe(false);
    });

    it('should handle null/undefined data', () => {
      expect(gunRxJS.match(null, {})).toBe(false);
      expect(gunRxJS.match(undefined, {})).toBe(false);
      expect(gunRxJS.match({}, null)).toBe(false);
      expect(gunRxJS.match({}, undefined)).toBe(false);
    });
  });

  describe('Edge cases', () => {
    it('should handle undefined user gracefully', () => {
      mockGun.user.mockReturnValue(undefined as any);
      expect(() => new GunRxJS(mockGun)).not.toThrow();
    });

    it('should handle empty string paths', () => {
      const result = gunRxJS.observe('');
      expect(result).toBeDefined();
    });

    it('should handle null/undefined data in match', () => {
      expect(gunRxJS.match(null, {})).toBe(false);
      expect(gunRxJS.match(undefined, {})).toBe(false);
    });
  });
});
