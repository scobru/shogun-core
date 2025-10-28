# Shogun Core Crypto Module

Il modulo crypto di Shogun Core fornisce funzionalità crittografiche avanzate per applicazioni decentralizzate, inclusi algoritmi di crittografia simmetrica, asimmetrica, hashing, crittografia file e protocolli di sicurezza moderni come Signal Protocol e Double Ratchet.

## 🚀 Caratteristiche

### Crittografia Simmetrica (AES-GCM)
- Generazione chiavi AES-256
- Crittografia/decrittografia con AES-GCM
- Derivazione chiavi da password (PBKDF2)

### Crittografia Asimmetrica (RSA-OAEP)
- Generazione coppie di chiavi RSA-4096
- Crittografia/decrittografia RSA-OAEP
- Serializzazione/deserializzazione chiavi JWK

### Funzioni di Hashing
- SHA-256, SHA-512
- SHA3-512 (con fallback)
- Generazione stringhe casuali crittografiche

### Crittografia File
- Crittografia file con password
- Supporto file di testo e binari
- Download sicuro di file crittografati
- Validazione pacchetti crittografati

### Signal Protocol (X3DH + Double Ratchet)
- Implementazione completa del protocollo Signal
- Scambio chiavi X3DH con X25519
- Firma digitale Ed25519
- Forward secrecy e out-of-order message handling

### Double Ratchet Protocol
- Crittografia end-to-end continua
- Ratcheting delle chiavi DH
- Gestione messaggi saltati
- Serializzazione stato per persistenza

### PGP/OpenPGP (RFC 4880)
- Generazione coppie di chiavi RSA-4096
- Crittografia/decrittografia asimmetrica
- Firma digitale e verifica
- Gestione chiavi e fingerprint
- Export/import in formato armored e binary
- Compatibilità standard OpenPGP

## 📦 Installazione

```bash
# Il modulo crypto è incluso in shogun-core
npm install shogun-core
```

## 🔧 Utilizzo

### Con React Context (Raccomandato)

```tsx
import { CryptoProvider, useCrypto } from 'shogun-core';

function App() {
  return (
    <CryptoProvider>
      <MyComponent />
    </CryptoProvider>
  );
}

function MyComponent() {
  const crypto = useCrypto();
  
  const handleEncrypt = async () => {
    // Genera chiave simmetrica
    const key = await crypto.generateSymmetricKey();
    const deserializedKey = await crypto.deserializeSymmetricKey(key);
    
    // Critta messaggio
    const encrypted = await crypto.encryptWithSymmetricKey('Messaggio segreto', deserializedKey);
    console.log('Messaggio crittografato:', encrypted);
    
    // Decritta messaggio
    const decrypted = await crypto.decryptWithSymmetricKey(encrypted, deserializedKey);
    console.log('Messaggio decrittografato:', decrypted);
  };
  
  return <button onClick={handleEncrypt}>Cripta Messaggio</button>;
}
```

### Utilizzo Standalone

```typescript
import { 
  randomString, 
  sha256Hash, 
  generateKeyPair, 
  encrypt, 
  decrypt 
} from 'shogun-core';

async function cryptoExample() {
  // Genera stringa casuale
  const random = randomString('prefix-');
  
  // Hash dati
  const hash = await sha256Hash({ data: 'test' });
  
  // Genera coppia chiavi RSA
  const keyPair = await generateKeyPair();
  
  // Critta con chiave pubblica
  const publicKey = await deserializePublicKey(keyPair.publicKey);
  const encrypted = await encrypt('Messaggio segreto', publicKey);
  
  // Decritta con chiave privata
  const privateKey = await deserializePrivateKey(keyPair.privateKey);
  const decrypted = await decrypt(encrypted, privateKey);
  
  console.log('Decrittografato:', decrypted);
}
```

### Crittografia File

```typescript
import { encryptFile, decryptFile, createSecureFileDownload } from 'shogun-core';

async function fileEncryptionExample(file: File) {
  const password = 'miaPasswordSicura123';
  
  // Critta file
  const encryptedPackage = await encryptFile(file, password);
  
  // Scarica file crittografato
  const encryptedData = JSON.stringify(encryptedPackage, null, 2);
  createSecureFileDownload(encryptedData, `${file.name}.encrypted`, 'application/json');
  
  // Per decrittografare
  const decryptedResult = await decryptFile(encryptedPackage, password);
  console.log('File decrittografato:', decryptedResult.fileName);
}
```

### Signal Protocol

```typescript
import { demonstrateSignalProtocol } from 'shogun-core';

async function signalExample() {
  const result = await demonstrateSignalProtocol();
  
  if (result.success) {
    console.log('✅ Protocollo Signal funzionante');
    console.log('Alice e Bob hanno lo stesso segreto:', result.aliceSecret === result.bobSecret);
  }
}
```

### Double Ratchet

```typescript
import { demonstrateDoubleRatchet } from 'shogun-core';

async function doubleRatchetExample() {
  const result = await demonstrateDoubleRatchet();
  
  if (result.success) {
    console.log('✅ Double Ratchet funzionante');
    console.log('Messaggi scambiati:', result.messagesExchanged);
    console.log('Forward secrecy:', result.demonstration.forwardSecrecy);
  }
}
```

## 🔒 Sicurezza

### Algoritmi Supportati
- **Crittografia Simmetrica**: AES-GCM-256
- **Crittografia Asimmetrica**: RSA-OAEP-4096
- **Hashing**: SHA-256, SHA-512, SHA3-512
- **Scambio Chiavi**: X25519 (Curve25519)
- **Firme Digitali**: Ed25519
- **Derivazione Chiavi**: PBKDF2, HKDF

### Best Practices
- Usa sempre password forti (minimo 8 caratteri)
- Non condividere mai le chiavi private
- Implementa backup sicuri delle chiavi
- Usa HTTPS per tutte le comunicazioni
- Valida sempre i dati in input

## 🧪 Testing

```typescript
import { CryptoProvider } from 'shogun-core';

// Test con provider
const testCrypto = async () => {
  const crypto = new CryptoProvider({ children: null });
  // Esegui test...
};

// Test standalone
import { sha256Hash, generateKeyPair } from 'shogun-core';

const testStandalone = async () => {
  const hash = await sha256Hash('test');
  const keyPair = await generateKeyPair();
  // Verifica risultati...
};
```

## 📚 API Reference

### Hashing
- `randomString(additionalSalt?: string): string`
- `sha256Hash(input: any): Promise<string>`
- `sha512Hash(input: any): Promise<string>`
- `sha3_512Hash(input: any): Promise<string>`

### Crittografia Asimmetrica
- `generateKeyPair(): Promise<JWKKeyPair>`
- `deserializePublicKey(key: JsonWebKey | string): Promise<CryptoKey>`
- `deserializePrivateKey(key: JsonWebKey | string): Promise<CryptoKey>`
- `encrypt(message: string, publicKey: CryptoKey): Promise<string>`
- `decrypt(encryptedMessage: string, privateKey: CryptoKey): Promise<string>`

### Crittografia Simmetrica
- `generateSymmetricKey(): Promise<JsonWebKey>`
- `deserializeSymmetricKey(key: JsonWebKey | string): Promise<CryptoKey>`
- `encryptWithSymmetricKey(message: string, key: CryptoKey): Promise<EncryptedData>`
- `decryptWithSymmetricKey(encryptedData: EncryptedData, key: CryptoKey): Promise<string>`

### Crittografia File
- `encryptFile(fileContent: string | ArrayBuffer | File, password: string, fileName?: string): Promise<EncryptedFilePackage>`
- `decryptFile(encryptedPackage: EncryptedFilePackage, password: string): Promise<DecryptedFileResult>`
- `createSecureFileDownload(data: ArrayBuffer | string | Blob, fileName: string, mimeType?: string): void`

### Signal Protocol
- `initializeSignalUser(name: string): Promise<SignalUser>`
- `performSignalX3DHKeyExchange(alice: SignalUser, bobBundle: SignalPublicKeyBundle): Promise<X3DHExchangeResult>`
- `demonstrateSignalProtocol(): Promise<any>`

### Double Ratchet
- `initializeDoubleRatchet(sharedSecret: ArrayBuffer, isInitiator: boolean): Promise<DoubleRatchetState>`
- `doubleRatchetEncrypt(state: DoubleRatchetState, plaintext: string): Promise<MessageEnvelope>`
- `doubleRatchetDecrypt(state: DoubleRatchetState, messageEnvelope: MessageEnvelope): Promise<string>`

## 🤝 Contribuire

1. Fork del repository
2. Crea un branch per la feature (`git checkout -b feature/amazing-feature`)
3. Commit delle modifiche (`git commit -m 'Add amazing feature'`)
4. Push al branch (`git push origin feature/amazing-feature`)
5. Apri una Pull Request

## 📄 Licenza

Questo progetto è rilasciato sotto licenza MIT. Vedi il file `LICENSE` per maggiori dettagli.

## 🆘 Supporto

Per supporto e domande:
- Apri una issue su GitHub
- Consulta la documentazione
- Contatta il team di sviluppo

---

**Nota**: Questo modulo è progettato per essere utilizzato in ambienti sicuri. Assicurati di implementare le best practices di sicurezza appropriate per la tua applicazione.
