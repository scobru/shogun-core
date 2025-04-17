import { ShogunStorage } from "../../storage/storage";

describe("ShogunStorage", () => {
  let storage: ShogunStorage;
  const testKey = "test-key";
  const testValue = { data: "test-value", number: 123 };
  const testValueStr = JSON.stringify(testValue);

  beforeEach(() => {
    // Pulisce localStorage e sessionStorage prima di ogni test
    localStorage.clear();
    sessionStorage.clear();
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
    // Backup dell'implementazione originale
    const originalLocalStorage = global.localStorage;

    try {
      // Creiamo un mock che lancia errori in modo controllato
      const mockLocalStorage = {
        getItem: jest.fn().mockImplementation(() => {
          throw new Error("localStorage not available");
        }),
        setItem: jest.fn().mockImplementation(() => {
          throw new Error("localStorage not available");
        }),
        removeItem: jest.fn().mockImplementation(() => {
          throw new Error("localStorage not available");
        }),
        clear: jest.fn().mockImplementation(() => {
          throw new Error("localStorage not available");
        }),
      };

      // Sostituisci localStorage con il nostro mock
      Object.defineProperty(global, "localStorage", {
        value: mockLocalStorage,
        writable: true,
      });

      // Creiamo un nuovo ShogunStorage che userà il nostro mock
      const fallbackStorage = new ShogunStorage();

      // Anche con localStorage che lancia errori, dovrebbe funzionare usando Map interno
      const testItem = JSON.stringify(testValue);
      fallbackStorage.setItem(testKey, testItem);
      const retrievedValue = fallbackStorage.getItem(testKey);

      // Se l'operazione ha successo, il valore sarà recuperato dal Map interno
      expect(retrievedValue).toBe(testItem);
    } finally {
      // Ripristina localStorage originale
      Object.defineProperty(global, "localStorage", {
        value: originalLocalStorage,
        writable: true,
      });
    }
  });
});
