import { EventManager } from '../../managers/EventManager';
import { ShogunEventEmitter } from '../../interfaces/events';

describe('EventManager', () => {
  let eventManager: EventManager;

  beforeEach(() => {
    eventManager = new EventManager();
  });

  it('should be defined', () => {
    expect(eventManager).toBeDefined();
  });

  it('should initialize with a ShogunEventEmitter', () => {
    const emitter = eventManager.getEventEmitter();
    expect(emitter).toBeInstanceOf(ShogunEventEmitter);
  });

  describe('on and emit', () => {
    it('should register a listener and receive emitted events with data', () => {
      const listener = jest.fn();
      const eventData = { name: 'test-plugin', version: '1.0.0', category: 'test' };

      eventManager.on('plugin:registered', listener);
      const result = eventManager.emit('plugin:registered', eventData);

      expect(result).toBe(true);
      expect(listener).toHaveBeenCalledWith(eventData);
    });

    it('should register a listener and receive emitted events without data', () => {
      const listener = jest.fn();

      eventManager.on('auth:logout', listener);
      const result = eventManager.emit('auth:logout');

      expect(result).toBe(true);
      expect(listener).toHaveBeenCalled();
    });

    it('should return false when emitting an event with no listeners', () => {
      const result = eventManager.emit('auth:logout');
      expect(result).toBe(false);
    });

    it('should support method chaining for on', () => {
      const result = eventManager.on('auth:logout', jest.fn());
      expect(result).toBe(eventManager);
    });
  });

  describe('once', () => {
    it('should only call the listener once', () => {
      const listener = jest.fn();

      eventManager.once('auth:logout', listener);

      eventManager.emit('auth:logout');
      eventManager.emit('auth:logout');

      expect(listener).toHaveBeenCalledTimes(1);
    });

    it('should support method chaining for once', () => {
      const result = eventManager.once('auth:logout', jest.fn());
      expect(result).toBe(eventManager);
    });
  });

  describe('off', () => {
    it('should remove a specific listener', () => {
      const listener = jest.fn();

      eventManager.on('auth:logout', listener);
      eventManager.off('auth:logout', listener);

      const result = eventManager.emit('auth:logout');

      expect(result).toBe(false);
      expect(listener).not.toHaveBeenCalled();
    });

    it('should support method chaining for off', () => {
      const result = eventManager.off('auth:logout', jest.fn());
      expect(result).toBe(eventManager);
    });
  });

  describe('removeAllListeners', () => {
    it('should remove all listeners for a specific event', () => {
      const listener1 = jest.fn();
      const listener2 = jest.fn();

      eventManager.on('auth:logout', listener1);
      eventManager.on('auth:logout', listener2);

      eventManager.removeAllListeners('auth:logout');

      const result = eventManager.emit('auth:logout');

      expect(result).toBe(false);
      expect(listener1).not.toHaveBeenCalled();
      expect(listener2).not.toHaveBeenCalled();
    });

    it('should remove all listeners for all events when no event name is provided', () => {
      const listener1 = jest.fn();
      const listener2 = jest.fn();

      eventManager.on('auth:logout', listener1);
      eventManager.on('plugin:unregistered', listener2);

      eventManager.removeAllListeners();

      expect(eventManager.emit('auth:logout')).toBe(false);
      expect(eventManager.emit('plugin:unregistered', { name: 'test' })).toBe(false);
      expect(listener1).not.toHaveBeenCalled();
      expect(listener2).not.toHaveBeenCalled();
    });

    it('should support method chaining for removeAllListeners', () => {
      const result = eventManager.removeAllListeners();
      expect(result).toBe(eventManager);
    });
  });

  describe('getEventEmitter', () => {
    it('should return the internal event emitter instance', () => {
      const emitter = eventManager.getEventEmitter();
      expect(emitter).toBeInstanceOf(ShogunEventEmitter);

      // Verify it's the same instance used by EventManager
      const listener = jest.fn();
      emitter.on('auth:logout', listener);
      eventManager.emit('auth:logout');
      expect(listener).toHaveBeenCalled();
    });
  });
});
