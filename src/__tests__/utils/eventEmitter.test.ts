import { EventEmitter, EventType, Listener } from '../../utils/eventEmitter';

describe('EventEmitter', () => {
  let emitter: EventEmitter;

  beforeEach(() => {
    emitter = new EventEmitter();
  });

  describe('Constructor', () => {
    it('should create EventEmitter instance', () => {
      expect(emitter).toBeInstanceOf(EventEmitter);
    });

    it('should initialize with empty events map', () => {
      const newEmitter = new EventEmitter();
      expect(newEmitter).toBeInstanceOf(EventEmitter);
    });
  });

  describe('on', () => {
    it('should register event listener', () => {
      const listener = jest.fn();
      emitter.on('test-event', listener);

      expect(listener).not.toHaveBeenCalled();
    });

    it('should register multiple listeners for same event', () => {
      const listener1 = jest.fn();
      const listener2 = jest.fn();

      emitter.on('test-event', listener1);
      emitter.on('test-event', listener2);

      emitter.emit('test-event', 'test-data');

      expect(listener1).toHaveBeenCalledWith('test-data');
      expect(listener2).toHaveBeenCalledWith('test-data');
    });

    it('should register listeners for different events', () => {
      const listener1 = jest.fn();
      const listener2 = jest.fn();

      emitter.on('event1', listener1);
      emitter.on('event2', listener2);

      emitter.emit('event1', 'data1');
      emitter.emit('event2', 'data2');

      expect(listener1).toHaveBeenCalledWith('data1');
      expect(listener2).toHaveBeenCalledWith('data2');
    });

    it('should handle symbol events', () => {
      const symbol = Symbol('test-event');
      const listener = jest.fn();

      emitter.on(symbol, listener);
      emitter.emit(symbol, 'test-data');

      expect(listener).toHaveBeenCalledWith('test-data');
    });
  });

  describe('emit', () => {
    it('should emit event to registered listeners', () => {
      const listener = jest.fn();
      emitter.on('test-event', listener);

      emitter.emit('test-event', 'test-data');

      expect(listener).toHaveBeenCalledWith('test-data');
    });

    it('should return true when event has listeners', () => {
      const listener = jest.fn();
      emitter.on('test-event', listener);

      const result = emitter.emit('test-event', 'test-data');

      expect(result).toBe(true);
    });

    it('should return false when event has no listeners', () => {
      const result = emitter.emit('non-existent-event', 'test-data');

      expect(result).toBe(false);
    });

    it('should emit event without data', () => {
      const listener = jest.fn();
      emitter.on('test-event', listener);

      emitter.emit('test-event');

      expect(listener).toHaveBeenCalledWith(undefined);
    });

    it('should handle listener errors gracefully', () => {
      const errorListener = jest.fn().mockImplementation(() => {
        throw new Error('Listener error');
      });
      const normalListener = jest.fn();

      emitter.on('test-event', errorListener);
      emitter.on('test-event', normalListener);

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      emitter.emit('test-event', 'test-data');

      expect(consoleSpy).toHaveBeenCalledWith(
        'Error in event listener for test-event:',
        expect.any(Error)
      );
      expect(normalListener).toHaveBeenCalledWith('test-data');

      consoleSpy.mockRestore();
    });

    it('should handle multiple listeners with errors', () => {
      const errorListener = jest.fn().mockImplementation(() => {
        throw new Error('Listener error');
      });
      const normalListener1 = jest.fn();
      const normalListener2 = jest.fn();

      emitter.on('test-event', errorListener);
      emitter.on('test-event', normalListener1);
      emitter.on('test-event', normalListener2);

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      emitter.emit('test-event', 'test-data');

      expect(consoleSpy).toHaveBeenCalledWith(
        'Error in event listener for test-event:',
        expect.any(Error)
      );
      expect(normalListener1).toHaveBeenCalledWith('test-data');
      expect(normalListener2).toHaveBeenCalledWith('test-data');

      consoleSpy.mockRestore();
    });
  });

  describe('off', () => {
    it('should remove specific listener', () => {
      const listener1 = jest.fn();
      const listener2 = jest.fn();

      emitter.on('test-event', listener1);
      emitter.on('test-event', listener2);

      emitter.off('test-event', listener1);
      emitter.emit('test-event', 'test-data');

      expect(listener1).not.toHaveBeenCalled();
      expect(listener2).toHaveBeenCalledWith('test-data');
    });

    it('should remove listener and clean up empty event', () => {
      const listener = jest.fn();
      emitter.on('test-event', listener);

      emitter.off('test-event', listener);
      const result = emitter.emit('test-event', 'test-data');

      expect(result).toBe(false);
      expect(listener).not.toHaveBeenCalled();
    });

    it('should handle removing non-existent listener', () => {
      const listener = jest.fn();
      const nonExistentListener = jest.fn();

      emitter.on('test-event', listener);
      emitter.off('test-event', nonExistentListener);
      emitter.emit('test-event', 'test-data');

      expect(listener).toHaveBeenCalledWith('test-data');
    });

    it('should handle removing listener from non-existent event', () => {
      const listener = jest.fn();

      expect(() => emitter.off('non-existent-event', listener)).not.toThrow();
    });

    it('should handle removing same listener multiple times', () => {
      const listener = jest.fn();
      emitter.on('test-event', listener);

      emitter.off('test-event', listener);
      emitter.off('test-event', listener);

      const result = emitter.emit('test-event', 'test-data');

      expect(result).toBe(false);
      expect(listener).not.toHaveBeenCalled();
    });
  });

  describe('once', () => {
    it('should register one-time listener', () => {
      const listener = jest.fn();
      emitter.once('test-event', listener);

      emitter.emit('test-event', 'test-data');
      emitter.emit('test-event', 'test-data-2');

      expect(listener).toHaveBeenCalledTimes(1);
      expect(listener).toHaveBeenCalledWith('test-data');
    });

    it('should remove listener after first emission', () => {
      const listener = jest.fn();
      emitter.once('test-event', listener);

      emitter.emit('test-event', 'test-data');
      const result = emitter.emit('test-event', 'test-data-2');

      expect(result).toBe(false);
      expect(listener).toHaveBeenCalledTimes(1);
    });

    it('should work with multiple once listeners', () => {
      const listener1 = jest.fn();
      const listener2 = jest.fn();

      emitter.once('test-event', listener1);
      emitter.once('test-event', listener2);

      emitter.emit('test-event', 'test-data');

      expect(listener1).toHaveBeenCalledWith('test-data');
      // The second listener should not be called because once listeners are removed after first emission
      expect(listener2).not.toHaveBeenCalled();
    });
  });

  describe('removeAllListeners', () => {
    it('should remove all listeners for specific event', () => {
      const listener1 = jest.fn();
      const listener2 = jest.fn();

      emitter.on('event1', listener1);
      emitter.on('event1', listener2);
      emitter.on('event2', jest.fn());

      emitter.removeAllListeners('event1');
      emitter.emit('event1', 'test-data');
      emitter.emit('event2', 'test-data');

      expect(listener1).not.toHaveBeenCalled();
      expect(listener2).not.toHaveBeenCalled();
    });

    it('should remove all listeners when no event specified', () => {
      const listener1 = jest.fn();
      const listener2 = jest.fn();

      emitter.on('event1', listener1);
      emitter.on('event2', listener2);

      emitter.removeAllListeners();
      emitter.emit('event1', 'test-data');
      emitter.emit('event2', 'test-data');

      expect(listener1).not.toHaveBeenCalled();
      expect(listener2).not.toHaveBeenCalled();
    });

    it('should handle removing listeners from non-existent event', () => {
      expect(() => emitter.removeAllListeners('non-existent-event')).not.toThrow();
    });

    it('should handle removing all listeners when no events exist', () => {
      expect(() => emitter.removeAllListeners()).not.toThrow();
    });
  });

  describe('Integration tests', () => {
    it('should handle complex event scenarios', () => {
      const results: string[] = [];
      const listener1 = (data: unknown) => results.push(`listener1: ${data}`);
      const listener2 = (data: unknown) => results.push(`listener2: ${data}`);
      const onceListener = (data: unknown) => results.push(`once: ${data}`);

      // Register listeners
      emitter.on('test-event', listener1);
      emitter.on('test-event', listener2);
      emitter.once('test-event', onceListener);

      // Emit multiple times
      emitter.emit('test-event', 'first');
      emitter.emit('test-event', 'second');

      expect(results).toEqual([
        'listener1: first',
        'listener2: first',
        'once: first',
        'listener1: second',
        'listener2: second',
      ]);
    });

    it('should handle event cleanup', () => {
      const listener1 = jest.fn();
      const listener2 = jest.fn();

      emitter.on('event1', listener1);
      emitter.on('event2', listener2);

      // Remove specific listener
      emitter.off('event1', listener1);
      emitter.emit('event1', 'data1');
      emitter.emit('event2', 'data2');

      expect(listener1).not.toHaveBeenCalled();
      expect(listener2).toHaveBeenCalledWith('data2');

      // Remove all listeners
      emitter.removeAllListeners();
      emitter.emit('event2', 'data3');

      expect(listener2).toHaveBeenCalledTimes(1);
    });

    it('should handle mixed event types', () => {
      const stringListener = jest.fn();
      const symbolListener = jest.fn();
      const symbol = Symbol('test-symbol');

      emitter.on('string-event', stringListener);
      emitter.on(symbol, symbolListener);

      emitter.emit('string-event', 'string-data');
      emitter.emit(symbol, 'symbol-data');

      expect(stringListener).toHaveBeenCalledWith('string-data');
      expect(symbolListener).toHaveBeenCalledWith('symbol-data');
    });
  });

  describe('Type definitions', () => {
    it('should work with generic event types', () => {
      interface TestEvents {
        'user-login': { userId: string; timestamp: number };
        'user-logout': { userId: string };
      }

      const typedEmitter = new EventEmitter<TestEvents>();
      const loginListener = jest.fn();
      const logoutListener = jest.fn();

      typedEmitter.on('user-login', loginListener);
      typedEmitter.on('user-logout', logoutListener);

      typedEmitter.emit('user-login', { userId: '123', timestamp: Date.now() });
      typedEmitter.emit('user-logout', { userId: '123' });

      expect(loginListener).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: '123',
          timestamp: expect.any(Number),
        })
      );
      expect(logoutListener).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: '123',
        })
      );
    });
  });
});
