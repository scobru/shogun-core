import { RxJS } from '../../gundb/rxjs';
import { of, throwError } from 'rxjs';
import { IGunInstance } from 'gun';

describe('RxJS GunDB Wrapper', () => {
  let mockGun: any;
  let rxjs: RxJS;
  let mockUser: any;
  let mockNode: any;

  beforeEach(() => {
    mockNode = {
      get: jest.fn().mockReturnThis(),
      put: jest.fn().mockImplementation((data, cb) => {
        if (cb) cb({ ok: 1 });
        return mockNode;
      }),
      set: jest.fn().mockImplementation((data, cb) => {
        if (cb) cb({ ok: 1 });
        return mockNode;
      }),
      on: jest.fn(),
      once: jest.fn(),
      off: jest.fn(),
      map: jest.fn().mockReturnThis(),
    };

    mockUser = {
      is: { pub: 'test-pub' },
      get: jest.fn().mockReturnValue(mockNode),
      put: jest.fn().mockImplementation((data, cb) => {
        if (cb) cb({ ok: 1 });
        return mockUser;
      }),
      set: jest.fn().mockImplementation((data, cb) => {
        if (cb) cb({ ok: 1 });
        return mockUser;
      }),
      on: jest.fn(),
      once: jest.fn(),
      off: jest.fn(),
    };

    mockGun = {
      user: jest.fn().mockReturnValue(mockUser),
      get: jest.fn().mockReturnValue(mockNode),
      put: jest.fn().mockImplementation((data, cb) => {
        if (cb) cb({ ok: 1 });
        return mockGun;
      }),
      set: jest.fn().mockImplementation((data, cb) => {
        if (cb) cb({ ok: 1 });
        return mockGun;
      }),
      on: jest.fn(),
      once: jest.fn(),
      off: jest.fn(),
    };

    rxjs = new RxJS(mockGun as unknown as IGunInstance<any>);
  });

  describe('Constructor and Basic Getters', () => {
    it('should initialize with a gun instance', () => {
      expect(rxjs).toBeDefined();
      expect(mockGun.user).toHaveBeenCalled();
    });

    it('should return the user instance', () => {
      expect(rxjs.getUser()).toBe(mockUser);
    });

    it('should return the user public key', () => {
      expect(rxjs.getUserPub()).toBe('test-pub');
    });

    it('should return undefined if user public key is missing', () => {
      mockUser.is = undefined;
      expect(rxjs.getUserPub()).toBeUndefined();
    });
  });

  describe('observe', () => {
    it('should observe a string path', (done) => {
      const testData = { foo: 'bar' };
      mockNode.on.mockImplementation((cb) => {
        cb(testData, 'key');
        return () => {};
      });

      rxjs.observe('path').subscribe((data) => {
        expect(mockGun.get).toHaveBeenCalledWith('path');
        expect(data).toEqual(testData);
        done();
      });
    });

    it('should observe an array path', (done) => {
      const testData = { foo: 'bar' };
      rxjs.observe(['path1', 'path2']).subscribe((data) => {
        expect(mockGun.get).toHaveBeenCalledWith('path1');
        expect(mockNode.get).toHaveBeenCalledWith('path2');
        expect(data).toEqual(testData);
        done();
      });

      // Trigger the callback
      const onCall = mockNode.on.mock.calls[0][0];
      onCall(testData, 'key');
    });

    it('should observe a direct node', (done) => {
      const testData = { foo: 'bar' };
      rxjs.observe(mockNode).subscribe((data) => {
        expect(data).toEqual(testData);
        done();
      });

      const onCall = mockNode.on.mock.calls[0][0];
      onCall(testData, 'key');
    });

    it('should remove gun metadata', (done) => {
      const testData = { foo: 'bar', _: { '#': 'soul' }, '#': 'id' };
      mockNode.on.mockImplementation((cb) => {
        cb(testData, 'key');
        return () => {};
      });

      rxjs.observe('path').subscribe((data) => {
        expect(data).toEqual({ foo: 'bar' });
        done();
      });
    });

    it('should handle nested objects for metadata removal', (done) => {
      const testData = {
        foo: {
          bar: 'baz',
          _: { '#': 'inner-soul' }
        },
        _: { '#': 'outer-soul' }
      };
      mockNode.on.mockImplementation((cb) => {
        cb(testData, 'key');
        return () => {};
      });

      rxjs.observe('path').subscribe((data) => {
        expect(data).toEqual({ foo: { bar: 'baz' } });
        done();
      });
    });

    it('should handle null or undefined data', (done) => {
      mockNode.on.mockImplementation((cb) => {
        cb(null, 'key');
        return () => {};
      });

      rxjs.observe('path').subscribe((data) => {
        expect(data).toBeNull();
        done();
      });
    });

    it('should use distinctUntilChanged', () => {
      const testData = { foo: 'bar' };
      let emitCount = 0;

      const subscription = rxjs.observe('path').subscribe(() => {
        emitCount++;
      });

      const onCall = mockNode.on.mock.calls[0][0];

      // Emit same data twice
      onCall(testData, 'key');
      onCall({ ...testData }, 'key'); // Different object reference, same content

      expect(emitCount).toBe(1);
      subscription.unsubscribe();
    });

    it('should cleanup on unsubscribe', () => {
      const unsubMock = jest.fn();
      mockNode.on.mockReturnValue(unsubMock);

      const subscription = rxjs.observe('path').subscribe();
      subscription.unsubscribe();

      expect(unsubMock).toHaveBeenCalled();
      expect(mockNode.off).toHaveBeenCalled();
    });
  });

  describe('match', () => {
    it('should match items in a collection', (done) => {
      const item1 = { id: 1, name: 'one' };
      const item2 = { id: 2, name: 'two' };

      mockNode.map.mockReturnThis();
      mockNode.on.mockImplementation((cb) => {
        cb(item1, 'key1');
        cb(item2, 'key2');
        return () => {};
      });

      rxjs.match('collection').subscribe((items) => {
        if (items.length === 2) {
          expect(items).toContainEqual(item1);
          expect(items).toContainEqual(item2);
          done();
        }
      });
    });

    it('should filter items with matchFn', (done) => {
      const item1 = { id: 1, name: 'one', active: true };
      const item2 = { id: 2, name: 'two', active: false };

      mockNode.on.mockImplementation((cb) => {
        cb(item1, 'key1');
        cb(item2, 'key2');
        return () => {};
      });

      rxjs.match('collection', (data) => data.active).subscribe((items) => {
        expect(items).toEqual([item1]);
        done();
      });
    });

    it('should handle item removal when matchFn returns false', (done) => {
      const item1 = { id: 1, name: 'one', active: true };
      let emitCount = 0;

      rxjs.match('collection', (data) => data.active).subscribe((items) => {
        emitCount++;
        if (emitCount === 1) {
          expect(items).toEqual([item1]);
          // Simulate update that now fails matchFn
          const onCall = mockNode.on.mock.calls[0][0];
          onCall({ ...item1, active: false }, 'key1');
        } else if (emitCount === 2) {
          expect(items).toEqual([]);
          done();
        }
      });

      const onCall = mockNode.on.mock.calls[0][0];
      onCall(item1, 'key1');
    });

    it('should return empty array and complete if path is missing', (done) => {
      rxjs.match(null).subscribe({
        next: (items) => {
          expect(items).toEqual([]);
        },
        complete: () => {
          done();
        }
      });
    });
  });

  describe('put and putCompat', () => {
    it('should put data to a path', (done) => {
      const testData = { foo: 'bar' };
      rxjs.put('path', testData).subscribe((data) => {
        expect(mockGun.get).toHaveBeenCalledWith('path');
        expect(mockNode.put).toHaveBeenCalledWith(testData, expect.any(Function));
        expect(data).toEqual(testData);
        done();
      });
    });

    it('should put data to an array path', (done) => {
        const testData = { foo: 'bar' };
        rxjs.put(['p1', 'p2'], testData).subscribe(() => {
          expect(mockGun.get).toHaveBeenCalledWith('p1');
          expect(mockNode.get).toHaveBeenCalledWith('p2');
          done();
        });
      });

    it('should put data to root if path is not a string or array', (done) => {
      const testData = { foo: 'bar' };
      rxjs.put(testData).subscribe(() => {
        expect(mockGun.put).toHaveBeenCalledWith(testData, expect.any(Function));
        done();
      });
    });

    it('should handle errors in put', (done) => {
      mockNode.put.mockImplementation((data, cb) => cb({ err: 'put error' }));
      rxjs.put('path', { foo: 'bar' }).subscribe({
        error: (err) => {
          expect(err.message).toBe('put error');
          done();
        }
      });
    });

    it('should support putCompat', (done) => {
      const testData = { foo: 'bar' };
      const callback = jest.fn();
      rxjs.putCompat(testData, callback).subscribe((data) => {
        expect(mockGun.put).toHaveBeenCalledWith(testData, expect.any(Function));
        expect(callback).toHaveBeenCalledWith({ ok: 1 });
        expect(data).toEqual(testData);
        done();
      });
    });
  });

  describe('set and setCompat', () => {
    it('should set data to a path', (done) => {
      const testData = { foo: 'bar' };
      rxjs.set('path', testData).subscribe((data) => {
        expect(mockGun.get).toHaveBeenCalledWith('path');
        expect(mockNode.set).toHaveBeenCalledWith(testData, expect.any(Function));
        expect(data).toEqual(testData);
        done();
      });
    });

    it('should handle errors in set', (done) => {
      mockNode.set.mockImplementation((data, cb) => cb({ err: 'set error' }));
      rxjs.set('path', { foo: 'bar' }).subscribe({
        error: (err) => {
          expect(err.message).toBe('set error');
          done();
        }
      });
    });

    it('should support setCompat', (done) => {
      const testData = 'item';
      const callback = jest.fn();
      rxjs.setCompat(testData, callback).subscribe((data) => {
        expect(mockGun.set).toHaveBeenCalled();
        expect(callback).toHaveBeenCalledWith({ ok: 1 });
        expect(data).toEqual(testData);
        done();
      });
    });
  });

  describe('once', () => {
    it('should get data once', (done) => {
      const testData = { foo: 'bar' };
      mockNode.once.mockImplementation((cb) => {
        cb(testData, 'key');
      });

      rxjs.once('path').subscribe({
        next: (data) => {
          expect(mockGun.get).toHaveBeenCalledWith('path');
          expect(data).toEqual(testData);
        },
        complete: () => {
          done();
        }
      });
    });

    it('should handle null/undefined data in once', (done) => {
      mockNode.once.mockImplementation((cb) => {
        cb(undefined);
      });

      rxjs.once('path').subscribe({
        next: (data) => {
          expect(data).toBeNull();
        },
        complete: () => {
          done();
        }
      });
    });
  });

  describe('compute', () => {
    it('should compute value from string paths', (done) => {
      mockGun.get.mockImplementation((path: string) => {
        return {
          on: (cb: any) => {
            if (path === 'a') cb(10, 'a');
            if (path === 'b') cb(20, 'b');
            return () => {};
          },
          off: jest.fn()
        };
      });

      rxjs.compute(['a', 'b'], (a, b) => a + b).subscribe((result) => {
        expect(result).toBe(30);
        done();
      });
    });

    it('should compute value from observables', (done) => {
      const obs1 = of(100);
      const obs2 = of(200);

      rxjs.compute([obs1, obs2], (v1, v2) => v1 + v2).subscribe((result) => {
        expect(result).toBe(300);
        done();
      });
    });

    it('should handle errors in computeFn', (done) => {
      rxjs.compute([of(1), of(2)], () => {
        throw new Error('compute error');
      }).subscribe({
        error: (err) => {
          expect(err.message).toBe('compute error');
          done();
        }
      });
    });

    it('should handle source observable errors', (done) => {
        const errorObs = throwError(() => new Error('source error'));
        rxjs.compute([of(1), errorObs], (v1, v2) => v1 + v2).subscribe({
          error: (err) => {
            expect(err.message).toBe('source error');
            done();
          }
        });
      });
  });

  describe('User Operations', () => {
    it('should perform userPut with path', (done) => {
      const testData = { profile: 'data' };
      rxjs.userPut('profile', testData).subscribe((data) => {
        expect(mockGun.user).toHaveBeenCalled();
        expect(mockUser.get).toHaveBeenCalledWith('profile');
        expect(mockNode.put).toHaveBeenCalledWith(testData, expect.any(Function));
        expect(data).toEqual(testData);
        done();
      });
    });

    it('should perform userPut without path', (done) => {
      const testData = { profile: 'data' };
      rxjs.userPut(testData).subscribe((data) => {
        expect(mockGun.user).toHaveBeenCalled();
        expect(mockUser.put).toHaveBeenCalledWith(testData, expect.any(Function));
        done();
      });
    });

    it('should perform userSet with path', (done) => {
      const testData = { item: 'val' };
      rxjs.userSet('collection', testData).subscribe((data) => {
        expect(mockUser.get).toHaveBeenCalledWith('collection');
        expect(mockNode.set).toHaveBeenCalledWith(testData, expect.any(Function));
        done();
      });
    });

    it('should perform userSet without path', (done) => {
        const testData = { item: 'val' };
        rxjs.userSet(testData).subscribe((data) => {
          expect(mockUser.set).toHaveBeenCalledWith(testData, expect.any(Function));
          done();
        });
      });

    it('should perform userOnce with path', (done) => {
      const testData = { val: 123 };
      mockNode.once.mockImplementation((cb) => {
        cb(testData, { err: null });
      });

      rxjs.userOnce('path').subscribe((data) => {
        expect(mockUser.get).toHaveBeenCalledWith('path');
        expect(data).toEqual(testData);
        done();
      });
    });

    it('should perform userOnce without path', (done) => {
        mockUser.once.mockImplementation((cb: any) => {
          cb({ val: 456 }, { err: null });
        });

        rxjs.userOnce().subscribe((data) => {
          expect(mockUser.once).toHaveBeenCalled();
          expect(data).toEqual({ val: 456 });
          done();
        });
      });

    it('should handle errors in userOnce', (done) => {
        mockUser.once.mockImplementation((cb: any) => {
            cb(null, { err: 'user once error' });
        });

        rxjs.userOnce().subscribe({
            error: (err) => {
                expect(err.message).toBe('user once error');
                done();
            }
        });
    });

    it('should perform userGet', (done) => {
      const testData = { foo: 'bar' };
      mockNode.on.mockImplementation((cb) => {
        cb(testData, 'key');
        return () => {};
      });

      rxjs.userGet('profile').subscribe((data) => {
        expect(mockUser.get).toHaveBeenCalledWith('profile');
        expect(data).toEqual(testData);
        done();
      });
    });

    it('should observe user with path', (done) => {
      rxjs.observeUser('settings').subscribe(() => {
        expect(mockUser.get).toHaveBeenCalledWith('settings');
        done();
      });
      const onCall = mockNode.on.mock.calls[0][0];
      onCall({}, 'key');
    });

    it('should observe user without path (root)', (done) => {
      rxjs.observeUser().subscribe(() => {
        expect(mockUser.get).toHaveBeenCalledWith('~');
        done();
      });
      const onCall = mockNode.on.mock.calls[0][0];
      onCall({}, 'key');
    });
  });
});
