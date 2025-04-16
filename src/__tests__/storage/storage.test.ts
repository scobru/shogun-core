import { ShogunStorage } from '../../storage/storage';

describe('ShogunStorage', () => {
  let storage: ShogunStorage;
  const testKey = 'test-key';
  const testValue = { data: 'test-value', number: 123 };

  beforeEach(() => {
    // Pulisce localStorage e sessionStorage prima di ogni test
    localStorage.clear();
    sessionStorage.clear();
    storage = new ShogunStorage();
  });

  test('dovrebbe inizializzarsi correttamente', () => {
    expect(storage).toBeInstanceOf(ShogunStorage);
  });

  test('dovrebbe salvare e recuperare dati dal localStorage', () => {
    storage.setLocal(testKey, testValue);
    const retrievedValue = storage.getLocal(testKey);
    expect(retrievedValue).toEqual(testValue);
  });

  test('dovrebbe salvare e recuperare dati dal sessionStorage', () => {
    storage.setSession(testKey, testValue);
    const retrievedValue = storage.getSession(testKey);
    expect(retrievedValue).toEqual(testValue);
  });

  test('dovrebbe rimuovere i dati dal localStorage', () => {
    storage.setLocal(testKey, testValue);
    storage.removeLocal(testKey);
    const retrievedValue = storage.getLocal(testKey);
    expect(retrievedValue).toBeNull();
  });

  test('dovrebbe rimuovere i dati dal sessionStorage', () => {
    storage.setSession(testKey, testValue);
    storage.removeSession(testKey);
    const retrievedValue = storage.getSession(testKey);
    expect(retrievedValue).toBeNull();
  });

  test('dovrebbe gestire valori undefined', () => {
    storage.setLocal(testKey, undefined);
    const retrievedValue = storage.getLocal(testKey);
    expect(retrievedValue).toBeNull();
  });

  test('dovrebbe pulire tutto il localStorage', () => {
    storage.setLocal('key1', 'value1');
    storage.setLocal('key2', 'value2');
    storage.clearLocal();
    expect(storage.getLocal('key1')).toBeNull();
    expect(storage.getLocal('key2')).toBeNull();
  });

  test('dovrebbe pulire tutto il sessionStorage', () => {
    storage.setSession('key1', 'value1');
    storage.setSession('key2', 'value2');
    storage.clearSession();
    expect(storage.getSession('key1')).toBeNull();
    expect(storage.getSession('key2')).toBeNull();
  });

  test('dovrebbe gestire strutture di dati complesse', () => {
    const complexData = {
      name: 'Test User',
      settings: {
        theme: 'dark',
        notifications: true,
      },
      items: [1, 2, 3, { id: 1, value: 'test' }]
    };
    
    storage.setLocal(testKey, complexData);
    const retrievedValue = storage.getLocal(testKey);
    expect(retrievedValue).toEqual(complexData);
  });

  test('dovrebbe gestire localStorage non disponibile', () => {
    // Simula localStorage non disponibile
    const originalLocalStorage = global.localStorage;
    Object.defineProperty(global, 'localStorage', {
      get: () => undefined
    });
    
    const fallbackStorage = new ShogunStorage();
    fallbackStorage.setLocal(testKey, testValue);
    const retrievedValue = fallbackStorage.getLocal(testKey);
    
    // Ripristina localStorage originale
    Object.defineProperty(global, 'localStorage', {
      get: () => originalLocalStorage
    });
    
    // Anche se localStorage non è disponibile, il test non dovrebbe fallire
    expect(retrievedValue).toBeNull();
  });
}); 