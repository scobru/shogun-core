import { RxJSHolster } from '../../gundb/rxjs-holster';

describe('RxJSHolster', () => {
  let mockHolster: any;
  let rxjsHolster: RxJSHolster;
  let mockUser: any;
  let mockNode: any;

  beforeEach(() => {
    mockNode = {
      get: jest.fn().mockReturnThis(),
      next: jest.fn().mockReturnThis(), // Holster uses next() for chaining
      put: jest.fn().mockImplementation((data, cb) => {
        if (cb) cb({ ok: 1 });
        return mockNode;
      }),
      on: jest.fn(),
      off: jest.fn(),
    };

    mockUser = {
      is: { pub: 'test-pub' },
      get: jest.fn().mockReturnValue(mockNode),
      put: jest.fn().mockImplementation((data, cb) => {
        if (cb) cb({ ok: 1 });
        return mockUser;
      }),
    };

    mockHolster = {
      user: jest.fn().mockReturnValue(mockUser),
      get: jest.fn().mockReturnValue(mockNode),
      put: jest.fn().mockImplementation((data, cb) => {
        if (cb) cb({ ok: 1 });
        return mockHolster;
      }),
    };

    rxjsHolster = new RxJSHolster(mockHolster);
  });

  describe('observe', () => {
    it('should observe and emit data', (done) => {
      const testData = { foo: 'bar' };
      mockNode.on.mockImplementation((cb) => {
        cb(testData);
        return () => {};
      });

      rxjsHolster.observe('path').subscribe((data) => {
        expect(mockHolster.get).toHaveBeenCalledWith('path');
        expect(data).toEqual(testData);
        done();
      });
    });

    it('should use distinctUntilChanged (using deepEqual)', () => {
        const testData = { foo: 'bar' };
        let emitCount = 0;

        const subscription = rxjsHolster.observe('path').subscribe(() => {
          emitCount++;
        });

        const onCall = mockNode.on.mock.calls[0][0];

        // Emit same data twice
        onCall(testData);
        onCall({ ...testData }); // Different object reference, same content

        expect(emitCount).toBe(1);
        subscription.unsubscribe();
    });

    it('should emit if data changes', () => {
        const testData = { foo: 'bar' };
        let emitCount = 0;

        const subscription = rxjsHolster.observe('path').subscribe(() => {
          emitCount++;
        });

        const onCall = mockNode.on.mock.calls[0][0];

        onCall(testData);
        onCall({ foo: 'baz' });

        expect(emitCount).toBe(2);
        subscription.unsubscribe();
    });
  });
});
