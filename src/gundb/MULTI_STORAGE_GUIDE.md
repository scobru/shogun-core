# Multi-Storage System per GunDB

Il sistema multi-storage permette di separare la creazione dei pair SEA dal loro salvataggio, offrendo la possibilità di utilizzare storage multipli per le credenziali degli utenti.

## Caratteristiche Principali

- **Separazione delle Responsabilità**: La creazione dei pair SEA è separata dal salvataggio
- **Storage Multipli**: Supporto per GunDB, localStorage, cloud storage e storage personalizzati
- **Flessibilità**: Ogni utente può scegliere dove salvare le proprie credenziali
- **Fallback**: Se un storage fallisce, il sistema prova con altri provider
- **Personalizzazione**: Possibilità di implementare generatori di pair personalizzati

## Interfacce

### StorageProvider
```typescript
interface StorageProvider {
  name: string;
  save(key: string, data: any): Promise<boolean>;
  load(key: string): Promise<any>;
  remove(key: string): Promise<boolean>;
  exists(key: string): Promise<boolean>;
}
```

### SEAStorageProvider
```typescript
interface SEAStorageProvider extends StorageProvider {
  savePair(userPub: string, pair: ISEAPair): Promise<boolean>;
  loadPair(userPub: string): Promise<ISEAPair | null>;
  removePair(userPub: string): Promise<boolean>;
}
```

## Provider di Storage Inclusi

### GunDBStorage
Salva i pair direttamente nel database GunDB.

```typescript
const gunDBStorage = new GunDBStorage(gun, node);
```

### LocalStorageProvider
Salva i pair nel localStorage del browser.

```typescript
const localStorageProvider = new LocalStorageProvider();
```

## Utilizzo Base

### Configurazione Multi-Storage

```typescript
import { DataBase, GunDBStorage, LocalStorageProvider } from './gundb/db';

const gun = Gun({
  peers: ['https://gunjs.herokuapp.com/gun']
});

const db = new DataBase(gun, 'shogun', {
  providers: [
    new LocalStorageProvider(),
    new GunDBStorage(gun, node)
  ],
  primaryProvider: 'localStorage', // Usa localStorage come primario
  customPairGenerator: async (username: string) => {
    // Genera pair con parametri personalizzati
    return await SEA.pair();
  }
});

db.initialize('shogun');
```

### Signup con Storage Multipli

```typescript
// Signup che salva in entrambi gli storage
const signupResult = await db.signUpWithCustomStorage('username', 'password', {
  storageProviders: ['localStorage', 'gundb'], // Salva in entrambi
  skipGunDBCreation: false // Crea anche in GunDB
});

if (signupResult.success) {
  console.log('Signup successful:', signupResult);
}
```

### Login con Storage Personalizzato

```typescript
// Login che carica pair da storage personalizzato
const loginResult = await db.loginWithCustomStorage('username', 'password', {
  storageProviders: ['localStorage', 'gundb'],
  loadPairFromStorage: true // Carica pair da storage invece che da GunDB
});

if (loginResult.success) {
  console.log('Login successful:', loginResult);
}
```

## Gestione Manuale dei Pair

### Salvare Pair in Storage Specifici

```typescript
const userPub = 'user123';
const pair = await SEA.pair();

// Salva pair in storage specifici
const saveResult = await db.savePairToStorage(userPub, pair, ['localStorage', 'gundb']);
console.log('Pair saved:', saveResult);
```

### Caricare Pair da Storage Specifici

```typescript
// Carica pair da storage specifici
const loadedPair = await db.loadPairFromStorage(userPub, ['localStorage', 'gundb']);
console.log('Pair loaded:', loadedPair);
```

### Rimuovere Pair da Storage Specifici

```typescript
// Rimuove pair da storage specifici
const removeResult = await db.removePairFromStorage(userPub, ['localStorage', 'gundb']);
console.log('Pair removed:', removeResult);
```

## Provider di Storage Personalizzati

### Esempio: Cloud Storage Provider

```typescript
class CloudStorageProvider implements SEAStorageProvider {
  name = 'cloud';
  private apiEndpoint: string;
  private apiKey: string;

  constructor(apiEndpoint: string, apiKey: string) {
    this.apiEndpoint = apiEndpoint;
    this.apiKey = apiKey;
  }

  async savePair(userPub: string, pair: ISEAPair): Promise<boolean> {
    try {
      const response = await fetch(`${this.apiEndpoint}/users/${userPub}/pair`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(pair)
      });
      return response.ok;
    } catch (error) {
      console.error('Error saving pair to cloud:', error);
      return false;
    }
  }

  async loadPair(userPub: string): Promise<ISEAPair | null> {
    try {
      const response = await fetch(`${this.apiEndpoint}/users/${userPub}/pair`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
        }
      });
      
      if (response.ok) {
        return await response.json();
      }
      return null;
    } catch (error) {
      console.error('Error loading pair from cloud:', error);
      return null;
    }
  }

  async removePair(userPub: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.apiEndpoint}/users/${userPub}/pair`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
        }
      });
      return response.ok;
    } catch (error) {
      return false;
    }
  }

  // Implementazioni standard StorageProvider
  async save(key: string, data: any): Promise<boolean> {
    // Implementazione per dati generici
    return true;
  }

  async load(key: string): Promise<any> {
    // Implementazione per dati generici
    return null;
  }

  async remove(key: string): Promise<boolean> {
    // Implementazione per dati generici
    return true;
  }

  async exists(key: string): Promise<boolean> {
    // Implementazione per dati generici
    return false;
  }
}
```

### Utilizzo del Provider Personalizzato

```typescript
const cloudProvider = new CloudStorageProvider('https://api.example.com', 'your-api-key');

const db = new DataBase(gun, 'shogun', {
  providers: [
    new LocalStorageProvider(),
    cloudProvider
  ],
  primaryProvider: 'cloud'
});

// Signup che usa solo cloud storage
const result = await db.signUpWithCustomStorage('clouduser', 'password', {
  storageProviders: ['cloud'],
  skipGunDBCreation: true // Solo salva nel cloud, non crea in GunDB
});
```

## Gestione Dinamica dei Provider

### Aggiungere Provider Dinamicamente

```typescript
const db = new DataBase(gun, 'shogun');
db.initialize('shogun');

// Aggiungi provider dinamicamente
const customProvider = new CloudStorageProvider('https://backup-api.example.com', 'backup-key');
db.addStorageProvider(customProvider);

// Cambia il provider primario
db.setPrimaryStorageProvider('cloud');

// Ottieni la lista dei provider disponibili
const providers = db.getStorageProviders();
console.log('Available providers:', providers);
```

## Generatori di Pair Personalizzati

### Esempio: Generatore con Parametri Personalizzati

```typescript
async function customPairGenerator(username: string): Promise<ISEAPair> {
  // Genera un pair con parametri personalizzati basati sull'username
  const pair = await SEA.pair();
  
  // Aggiungi metadati personalizzati se necessario
  console.log(`Generated custom pair for user: ${username}`);
  
  return pair;
}

const db = new DataBase(gun, 'shogun', {
  customPairGenerator: customPairGenerator
});
```

## Esempi di Configurazione Avanzata

### Configurazione per Applicazioni Enterprise

```typescript
const db = new DataBase(gun, 'enterprise-app', {
  providers: [
    new LocalStorageProvider(), // Per cache locale
    new CloudStorageProvider('https://enterprise-api.com', 'enterprise-key'), // Per backup cloud
    new GunDBStorage(gun, node) // Per sincronizzazione peer-to-peer
  ],
  primaryProvider: 'cloud', // Usa cloud come storage primario
  customPairGenerator: async (username: string) => {
    // Genera pair con criteri di sicurezza enterprise
    const pair = await SEA.pair();
    
    // Aggiungi validazioni aggiuntive
    if (username.length < 3) {
      throw new Error('Username too short for enterprise requirements');
    }
    
    return pair;
  }
});
```

### Configurazione per Applicazioni Mobile

```typescript
const db = new DataBase(gun, 'mobile-app', {
  providers: [
    new LocalStorageProvider(), // Per storage locale
    new CloudStorageProvider('https://mobile-api.com', 'mobile-key') // Per sincronizzazione
  ],
  primaryProvider: 'localStorage', // Usa storage locale come primario
  customPairGenerator: async (username: string) => {
    // Genera pair ottimizzati per mobile
    const pair = await SEA.pair();
    
    // Aggiungi ottimizzazioni per dispositivi mobili
    console.log(`Generated mobile-optimized pair for: ${username}`);
    
    return pair;
  }
});
```

## Gestione degli Errori

Il sistema multi-storage gestisce automaticamente gli errori:

- Se un provider fallisce, prova con gli altri
- Se tutti i provider falliscono, restituisce `false` o `null`
- Gli errori vengono loggati ma non interrompono l'esecuzione

```typescript
// Esempio di gestione errori
try {
  const result = await db.signUpWithCustomStorage('username', 'password', {
    storageProviders: ['localStorage', 'cloud']
  });
  
  if (!result.success) {
    console.error('Signup failed:', result.error);
  }
} catch (error) {
  console.error('Unexpected error:', error);
}
```

## Best Practices

1. **Usa sempre più di un provider** per garantire la resilienza
2. **Configura un provider primario** appropriato per il tuo caso d'uso
3. **Implementa logging** per monitorare le operazioni di storage
4. **Testa i provider** individualmente prima di usarli in produzione
5. **Gestisci gli errori** appropriatamente per ogni provider

## Compatibilità

Il sistema multi-storage è completamente compatibile con:
- Metodi di autenticazione esistenti (`signUp`, `login`)
- Plugin di autenticazione (Web3, OAuth, WebAuthn, etc.)
- Sistemi di storage esistenti
- Configurazioni GunDB esistenti
