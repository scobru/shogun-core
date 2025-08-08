import { EventEmitter } from "../../utils/eventEmitter";

describe("EventEmitter", () => {
  let emitter: EventEmitter;

  beforeEach(() => {
    emitter = new EventEmitter();
  });

  describe("on", () => {
    it("should register event listeners", () => {
      const listener = jest.fn();
      emitter.on("test-event", listener);

      emitter.emit("test-event", { data: "test" });

      expect(listener).toHaveBeenCalledWith({ data: "test" });
    });

    it("should register multiple listeners for same event", () => {
      const listener1 = jest.fn();
      const listener2 = jest.fn();

      emitter.on("test-event", listener1);
      emitter.on("test-event", listener2);

      emitter.emit("test-event", { data: "test" });

      expect(listener1).toHaveBeenCalledWith({ data: "test" });
      expect(listener2).toHaveBeenCalledWith({ data: "test" });
    });

    it("should handle events without data", () => {
      const listener = jest.fn();
      emitter.on("test-event", listener);

      emitter.emit("test-event");

      expect(listener).toHaveBeenCalledWith(undefined);
    });
  });

  describe("emit", () => {
    it("should return false for non-existent events", () => {
      const result = emitter.emit("non-existent");
      expect(result).toBe(false);
    });

    it("should return true for existing events", () => {
      const listener = jest.fn();
      emitter.on("test-event", listener);

      const result = emitter.emit("test-event", { data: "test" });

      expect(result).toBe(true);
    });

    it("should handle listener errors gracefully", () => {
      const consoleSpy = jest.spyOn(console, "error").mockImplementation();
      const listener = jest.fn().mockImplementation(() => {
        throw new Error("Listener error");
      });

      emitter.on("test-event", listener);

      // Should not throw
      expect(() => emitter.emit("test-event")).not.toThrow();

      expect(consoleSpy).toHaveBeenCalledWith(
        "Error in event listener for test-event:",
        expect.any(Error),
      );

      consoleSpy.mockRestore();
    });
  });

  describe("off", () => {
    it("should remove specific listener", () => {
      const listener1 = jest.fn();
      const listener2 = jest.fn();

      emitter.on("test-event", listener1);
      emitter.on("test-event", listener2);

      emitter.off("test-event", listener1);

      emitter.emit("test-event", { data: "test" });

      expect(listener1).not.toHaveBeenCalled();
      expect(listener2).toHaveBeenCalledWith({ data: "test" });
    });

    it("should remove event when no listeners remain", () => {
      const listener = jest.fn();
      emitter.on("test-event", listener);

      emitter.off("test-event", listener);

      const result = emitter.emit("test-event");
      expect(result).toBe(false);
    });

    it("should handle removing non-existent listener", () => {
      const listener = jest.fn();
      const nonExistentListener = jest.fn();

      emitter.on("test-event", listener);
      emitter.off("test-event", nonExistentListener);

      emitter.emit("test-event");

      expect(listener).toHaveBeenCalled();
    });

    it("should handle removing listener from non-existent event", () => {
      const listener = jest.fn();

      // Should not throw
      expect(() => emitter.off("non-existent", listener)).not.toThrow();
    });
  });

  describe("once", () => {
    it("should call listener only once", () => {
      const listener = jest.fn();
      emitter.once("test-event", listener);

      emitter.emit("test-event", { data: "first" });
      emitter.emit("test-event", { data: "second" });

      expect(listener).toHaveBeenCalledTimes(1);
      expect(listener).toHaveBeenCalledWith({ data: "first" });
    });

    it("should remove listener after first call", () => {
      const listener = jest.fn();
      emitter.once("test-event", listener);

      emitter.emit("test-event");
      emitter.emit("test-event");

      expect(listener).toHaveBeenCalledTimes(1);
    });
  });

  describe("removeAllListeners", () => {
    it("should remove all listeners for specific event", () => {
      const listener1 = jest.fn();
      const listener2 = jest.fn();

      emitter.on("event1", listener1);
      emitter.on("event2", listener2);

      emitter.removeAllListeners("event1");

      emitter.emit("event1");
      emitter.emit("event2");

      expect(listener1).not.toHaveBeenCalled();
      expect(listener2).toHaveBeenCalled();
    });

    it("should remove all listeners when no event specified", () => {
      const listener1 = jest.fn();
      const listener2 = jest.fn();

      emitter.on("event1", listener1);
      emitter.on("event2", listener2);

      emitter.removeAllListeners();

      emitter.emit("event1");
      emitter.emit("event2");

      expect(listener1).not.toHaveBeenCalled();
      expect(listener2).not.toHaveBeenCalled();
    });

    it("should handle removing listeners from non-existent event", () => {
      // Should not throw
      expect(() => emitter.removeAllListeners("non-existent")).not.toThrow();
    });
  });

  describe("symbol events", () => {
    it("should handle symbol events", () => {
      const symbol = Symbol("test-event");
      const listener = jest.fn();

      emitter.on(symbol, listener);
      emitter.emit(symbol, { data: "test" });

      expect(listener).toHaveBeenCalledWith({ data: "test" });
    });

    it("should handle symbol events in removeAllListeners", () => {
      const symbol = Symbol("test-event");
      const listener = jest.fn();

      emitter.on(symbol, listener);
      emitter.removeAllListeners(symbol);

      emitter.emit(symbol);

      expect(listener).not.toHaveBeenCalled();
    });
  });

  describe("multiple events", () => {
    it("should handle multiple different events", () => {
      const listener1 = jest.fn();
      const listener2 = jest.fn();

      emitter.on("event1", listener1);
      emitter.on("event2", listener2);

      emitter.emit("event1", { data: "data1" });
      emitter.emit("event2", { data: "data2" });

      expect(listener1).toHaveBeenCalledWith({ data: "data1" });
      expect(listener2).toHaveBeenCalledWith({ data: "data2" });
    });
  });

  describe("event data types", () => {
    it("should handle various data types", () => {
      const listener = jest.fn();
      emitter.on("test-event", listener);

      const testData = [
        "string",
        123,
        { object: "data" },
        [1, 2, 3],
        null,
        undefined,
      ];

      testData.forEach((data) => {
        emitter.emit("test-event", data);
      });

      expect(listener).toHaveBeenCalledTimes(testData.length);
      testData.forEach((data, index) => {
        expect(listener).toHaveBeenNthCalledWith(index + 1, data);
      });
    });
  });
});
