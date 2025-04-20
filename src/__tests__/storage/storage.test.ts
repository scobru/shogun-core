import { ShogunStorage } from "../../storage/storage";

describe("ShogunStorage", () => {
  let storage: ShogunStorage;
  const testKey = "test-key";
  const testValue = { data: "test-value", number: 123 };
  const testValueStr = JSON.stringify(testValue);
  let mockStorage: any;

  beforeEach(() => {
    // Pulisci localStorage prima di ogni test
    localStorage.clear();
    storage = new ShogunStorage();
  });

  test("dovrebbe inizializzarsi correttamente", () => {
    expect(storage).toBeInstanceOf(ShogunStorage);
  });

  test("dovrebbe salvare e recuperare dati usando il store interno", () => {
    storage.setItem(testKey, testValueStr);
    const retrievedValue = storage.getItem(testKey);
    expect(retrievedValue !== null ? JSON.parse(retrievedValue) : null).toEqual(
      testValue,
    );
  });

  test("dovrebbe rimuovere i dati dallo store", () => {
    storage.setItem(testKey, testValueStr);
    storage.removeItem(testKey);
    const retrievedValue = storage.getItem(testKey);
    expect(retrievedValue).toBeNull();
  });

  test("dovrebbe gestire valori undefined", () => {
    storage.setItem(testKey, "null");
    const retrievedValue = storage.getItem(testKey);
    expect(retrievedValue).toBe("null");
  });

  test("dovrebbe pulire tutto lo storage", () => {
    storage.setItem("key1", JSON.stringify("value1"));
    storage.setItem("key2", JSON.stringify("value2"));
    storage.clearAll();
    expect(storage.getItem("key1")).toBeNull();
    expect(storage.getItem("key2")).toBeNull();
  });

  test("dovrebbe gestire strutture di dati complesse", () => {
    const complexData = {
      name: "Test User",
      settings: {
        theme: "dark",
        notifications: true,
      },
      items: [1, 2, 3, { id: 1, value: "test" }],
    };

    storage.setItem(testKey, JSON.stringify(complexData));
    const retrievedValue = storage.getItem(testKey);
    expect(retrievedValue !== null ? JSON.parse(retrievedValue) : null).toEqual(
      complexData,
    );
  });

  test("dovrebbe gestire localStorage non disponibile", () => {
    // Salva i metodi originali
    const originalGetItem = Object.getOwnPropertyDescriptor(
      Storage.prototype,
      "getItem",
    );
    const originalSetItem = Object.getOwnPropertyDescriptor(
      Storage.prototype,
      "setItem",
    );
    const originalRemoveItem = Object.getOwnPropertyDescriptor(
      Storage.prototype,
      "removeItem",
    );
    const originalClear = Object.getOwnPropertyDescriptor(
      Storage.prototype,
      "clear",
    );

    // Ridefinisci i metodi per lanciare errori
    Object.defineProperty(Storage.prototype, "getItem", {
      configurable: true,
      value: () => {
        throw new Error("localStorage not available");
      },
    });
    Object.defineProperty(Storage.prototype, "setItem", {
      configurable: true,
      value: () => {
        throw new Error("localStorage not available");
      },
    });
    Object.defineProperty(Storage.prototype, "removeItem", {
      configurable: true,
      value: () => {
        throw new Error("localStorage not available");
      },
    });
    Object.defineProperty(Storage.prototype, "clear", {
      configurable: true,
      value: () => {
        throw new Error("localStorage not available");
      },
    });

    try {
      const fallbackStorage = new ShogunStorage();
      // Verifica che useLocalStorage sia impostato a false
      expect((fallbackStorage as any).useLocalStorage).toBe(false);

      // Verifica che non vengano generati errori quando si usano i metodi di storage
      expect(() => fallbackStorage.setItem("test", "value")).not.toThrow();
      expect(() => fallbackStorage.getItem("test")).not.toThrow();

      // Verifica che i dati siano memorizzati correttamente nella Map interna
      const internalMapValue = (fallbackStorage as any).store.get("test");
      expect(internalMapValue).toBe("value");
    } finally {
      // Ripristina i metodi originali
      if (originalGetItem)
        Object.defineProperty(Storage.prototype, "getItem", originalGetItem);
      if (originalSetItem)
        Object.defineProperty(Storage.prototype, "setItem", originalSetItem);
      if (originalRemoveItem)
        Object.defineProperty(
          Storage.prototype,
          "removeItem",
          originalRemoveItem,
        );
      if (originalClear)
        Object.defineProperty(Storage.prototype, "clear", originalClear);
    }
  });
});
