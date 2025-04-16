// Mock delle funzioni di crittografia
const cryptoUtils = {
  generateRandomBytes: (length: number): Uint8Array => {
    // Simula la generazione di bytes casuali
    return new Uint8Array(length).map(() => Math.floor(Math.random() * 256));
  },
  
  generateUUID: (): string => {
    // Simula la generazione di un UUID
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  },
  
  hashData: async (data: string | Uint8Array): Promise<Uint8Array> => {
    // Simula un'operazione di hash
    if (typeof data === 'string') {
      const encoder = new TextEncoder();
      const bytes = encoder.encode(data);
      // Crea un hash simulato (non è un vero hash crittografico)
      return new Uint8Array([...bytes].map(b => (b + 1) % 256));
    } else {
      // Crea un hash simulato (non è un vero hash crittografico)
      return new Uint8Array([...data].map(b => (b + 1) % 256));
    }
  },
  
  encryptData: async (data: string | Uint8Array, key: Uint8Array): Promise<Uint8Array> => {
    // Simula un'operazione di cifratura
    const dataBytes = typeof data === 'string' 
      ? new TextEncoder().encode(data) 
      : data;
    
    // Simuliamo una semplice operazione XOR con la chiave
    return new Uint8Array(dataBytes.map((byte, index) => 
      byte ^ key[index % key.length]
    ));
  },
  
  decryptData: async (encryptedData: Uint8Array, key: Uint8Array): Promise<Uint8Array> => {
    // Invertiamo l'operazione di cifratura (XOR)
    return new Uint8Array(encryptedData.map((byte, index) => 
      byte ^ key[index % key.length]
    ));
  },
  
  bytesToBase64: (bytes: Uint8Array): string => {
    // Simuliamo la conversione in base64
    return btoa(String.fromCharCode.apply(null, bytes as unknown as number[]));
  },
  
  base64ToBytes: (base64: string): Uint8Array => {
    // Simuliamo la conversione da base64
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  },
  
  bytesToHex: (bytes: Uint8Array): string => {
    // Converte bytes in esadecimale
    return Array.from(bytes)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  },
  
  hexToBytes: (hex: string): Uint8Array => {
    // Converte esadecimale in bytes
    const bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < hex.length; i += 2) {
      bytes[i/2] = parseInt(hex.substr(i, 2), 16);
    }
    return bytes;
  },
  
  compareBytes: (a: Uint8Array, b: Uint8Array): boolean => {
    // Confronta due array di bytes
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      if (a[i] !== b[i]) return false;
    }
    return true;
  },
  
  deriveKeyFromPassword: async (password: string, salt: Uint8Array): Promise<Uint8Array> => {
    // Simula la derivazione di una chiave da password
    const passwordBytes = new TextEncoder().encode(password);
    // Semplice simulazione, non un vero PBKDF
    return new Uint8Array([...passwordBytes, ...salt].map(b => (b * 2) % 256));
  }
};

describe('CryptoUtils', () => {
  test('dovrebbe generare bytes casuali della lunghezza specificata', () => {
    const length = 16;
    const bytes = cryptoUtils.generateRandomBytes(length);
    
    expect(bytes).toBeInstanceOf(Uint8Array);
    expect(bytes.length).toBe(length);
  });
  
  test('dovrebbe generare UUID validi', () => {
    const uuid = cryptoUtils.generateUUID();
    
    // Verifica il formato UUID
    expect(uuid).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
  });
  
  test('dovrebbe calcolare hash consistenti', async () => {
    const testData = 'test data';
    
    const hash1 = await cryptoUtils.hashData(testData);
    const hash2 = await cryptoUtils.hashData(testData);
    
    // Lo stesso input dovrebbe produrre lo stesso hash
    expect(cryptoUtils.compareBytes(hash1, hash2)).toBe(true);
    
    // Input diversi dovrebbero produrre hash diversi
    const differentHash = await cryptoUtils.hashData('different data');
    expect(cryptoUtils.compareBytes(hash1, differentHash)).toBe(false);
  });
  
  test('dovrebbe cifrare e decifrare correttamente i dati', async () => {
    const testData = 'secret data';
    const key = cryptoUtils.generateRandomBytes(16);
    
    // Cifra i dati
    const encryptedData = await cryptoUtils.encryptData(testData, key);
    
    // I dati cifrati dovrebbero essere diversi dall'originale
    expect(new TextDecoder().decode(encryptedData)).not.toBe(testData);
    
    // Decifra i dati
    const decryptedData = await cryptoUtils.decryptData(encryptedData, key);
    
    // I dati decifrati dovrebbero corrispondere all'originale
    expect(new TextDecoder().decode(decryptedData)).toBe(testData);
  });
  
  test('dovrebbe convertire tra bytes e base64 correttamente', () => {
    const originalBytes = new Uint8Array([72, 101, 108, 108, 111]); // "Hello" in ASCII
    
    // Converti in base64
    const base64 = cryptoUtils.bytesToBase64(originalBytes);
    expect(base64).toBe('SGVsbG8='); // "Hello" in base64
    
    // Converti di nuovo in bytes
    const convertedBytes = cryptoUtils.base64ToBytes(base64);
    
    // Verifica che i bytes siano gli stessi
    expect(cryptoUtils.compareBytes(originalBytes, convertedBytes)).toBe(true);
  });
  
  test('dovrebbe convertire tra bytes e hex correttamente', () => {
    const originalBytes = new Uint8Array([72, 101, 108, 108, 111]); // "Hello" in ASCII
    
    // Converti in hex
    const hex = cryptoUtils.bytesToHex(originalBytes);
    expect(hex).toBe('48656c6c6f'); // "Hello" in hex
    
    // Converti di nuovo in bytes
    const convertedBytes = cryptoUtils.hexToBytes(hex);
    
    // Verifica che i bytes siano gli stessi
    expect(cryptoUtils.compareBytes(originalBytes, convertedBytes)).toBe(true);
  });
  
  test('dovrebbe confrontare correttamente array di bytes', () => {
    const bytesA = new Uint8Array([1, 2, 3, 4, 5]);
    const bytesB = new Uint8Array([1, 2, 3, 4, 5]);
    const bytesC = new Uint8Array([1, 2, 3, 4, 6]);
    const bytesD = new Uint8Array([1, 2, 3, 4]);
    
    expect(cryptoUtils.compareBytes(bytesA, bytesB)).toBe(true);
    expect(cryptoUtils.compareBytes(bytesA, bytesC)).toBe(false);
    expect(cryptoUtils.compareBytes(bytesA, bytesD)).toBe(false);
  });
  
  test('dovrebbe derivare chiavi consistenti da password', async () => {
    const password = 'secure-password';
    const salt = cryptoUtils.generateRandomBytes(8);
    
    const key1 = await cryptoUtils.deriveKeyFromPassword(password, salt);
    const key2 = await cryptoUtils.deriveKeyFromPassword(password, salt);
    
    // Lo stesso password e salt dovrebbero produrre la stessa chiave
    expect(cryptoUtils.compareBytes(key1, key2)).toBe(true);
    
    // Password diversa dovrebbe produrre chiave diversa
    const differentKey = await cryptoUtils.deriveKeyFromPassword('different-password', salt);
    expect(cryptoUtils.compareBytes(key1, differentKey)).toBe(false);
  });
}); 