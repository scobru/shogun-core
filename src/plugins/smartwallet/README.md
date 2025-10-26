# Smart Wallet Plugin

Plugin per integrare Smart Wallet con funzionalità multi-sig e social recovery in Shogun Core.

## Funzionalità

- Creazione di Smart Wallet
- Gestione signer e guardian
- Esecuzione transazioni singole e batch
- Multi-signature workflow
- Social recovery
- Query per recuperare informazioni wallet

## Installazione

Il plugin è già incluso in Shogun Core. Per abilitarlo:

```typescript
import { ShogunCore, SmartWalletPlugin } from "shogun-core";

const shogun = new ShogunCore({
  peers: ["https://gun-manhattan.herokuapp.com/gun"],
  scope: "my-app",
  smartwallet: {
    enabled: true,
    factoryAddress: "0x...", // Indirizzo della factory deployata
    defaultRequiredSignatures: 1,
    defaultRequiredGuardians: 2,
    privateKey: "0x...", // Optional: private key per il signer
  },
});
```

## Configurazione del Signer

Il plugin ha bisogno di un signer per firmare le transazioni. Hai 3 opzioni:

### Opzione 1: Passare la private key nella config (sconsigliato per produzione)

```typescript
const shogun = new ShogunCore({
  smartwallet: {
    enabled: true,
    factoryAddress: "0x...",
    privateKey: "0x...", // ⚠️ Non esporre mai in produzione!
  },
});
```

### Opzione 2: Usare setSigner() con private key derivata da seed phrase (consigliato)

```typescript
import { derive } from "shogun-core/gundb/derive";

const smartWalletPlugin = shogun.getPlugin("smartwallet");

// Deriva EOA da seed phrase WebAuthn
const signUpResult = await webauthnPlugin.signUp("alice", {
  generateSeedPhrase: true
});

const wallet = await derive(signUpResult.seedPhrase!, "alice", {
  includeSecp256k1Ethereum: true
});

// Usa la private key derivata
await smartWalletPlugin.setSigner(wallet.secp256k1Ethereum.privateKey);
```

### Opzione 3: Connettersi a MetaMask

```typescript
const smartWalletPlugin = shogun.getPlugin("smartwallet");
await smartWalletPlugin.connectWallet();
```

## Utilizzo

### 1. Crea uno Smart Wallet

```typescript
const smartWalletPlugin = shogun.getPlugin<SmartWalletPluginInterface>("smartwallet");

// Wallet semplice (1 firma)
const result = await smartWalletPlugin.createWallet(
  userAddress,
  1, // required signatures
  2  // required guardians
);

if (result.success) {
  console.log("Wallet creato:", result.walletAddress);
}
```

### 2. Crea Wallet con Guardian

```typescript
const result = await smartWalletPlugin.createWalletWithGuardians(
  userAddress,
  [guardian1, guardian2, guardian3],
  2, // 2 firme richieste
  2  // 2 guardian per recovery
);
```

### 3. Esegui Transazioni

```typescript
// Singola transazione
const result = await smartWalletPlugin.executeTransaction(
  walletAddress,
  targetAddress,
  "0x...", // calldata
  "1000000000000000000" // 1 ETH
);

// Batch di transazioni (risparmia gas)
const batchResult = await smartWalletPlugin.executeBatch(
  walletAddress,
  [target1, target2, target3],
  [data1, data2, data3],
  ["0", "0", "0"]
);
```

### 4. Multi-Signature

```typescript
// Proponi una transazione
const proposal = await smartWalletPlugin.proposeExecution(
  walletAddress,
  targetAddress,
  calldata
);

// Altri signer approvano
await smartWalletPlugin.approveProposal(walletAddress, proposalId);
```

### 5. Social Recovery

```typescript
// Un guardian avvia recovery
await smartWalletPlugin.initiateRecovery(walletAddress, newOwnerAddress);

// Altri guardian approvano
await smartWalletPlugin.approveRecovery(walletAddress);

// Dopo 48 ore, esegui recovery
await smartWalletPlugin.executeRecovery(walletAddress);
```

### 6. Query Wallet

```typescript
// Info wallet
const walletInfo = await smartWalletPlugin.getWalletInfo(walletAddress);
console.log("Owner:", walletInfo?.owner);
console.log("Required signatures:", walletInfo?.requiredSignatures);

// Tutti i wallet di un owner
const wallets = await smartWalletPlugin.getOwnerWallets(userAddress);
console.log("Wallet dell'utente:", wallets);
```

## Integrazione Completa

### Esempio: WebAuthn → Smart Wallet

```typescript
import { ShogunCore, WebauthnPlugin, SmartWalletPlugin } from "shogun-core";

const shogun = new ShogunCore({
  peers: ["https://gun-manhattan.herokuapp.com/gun"],
  scope: "my-app",
  webauthn: { enabled: true },
  smartwallet: { 
    enabled: true,
    factoryAddress: "0x..."
  },
});

// 1. Utente si registra con WebAuthn
const webauthnPlugin = shogun.getPlugin<WebauthnPlugin>("webauthn");
const signUpResult = await webauthnPlugin.signUp("alice", {
  generateSeedPhrase: true
});

// 2. Deriva wallet Ethereum dalla seed phrase
import { deriveCredentialsFromMnemonic } from "shogun-core";
const { password } = deriveCredentialsFromMnemonic(
  signUpResult.seedPhrase!,
  "alice"
);
import { derive } from "shogun-core/gundb/derive";
const wallet = await derive(signUpResult.seedPhrase!, "alice", {
  includeSecp256k1Ethereum: true
});

// 3. Crea Smart Wallet con la chiave derivata
const smartWalletPlugin = shogun.getPlugin<SmartWalletPlugin>("smartwallet");
const walletResult = await smartWalletPlugin.createWalletWithGuardians(
  wallet.secp256k1Ethereum.address,
  [guardian1, guardian2], // Guardian per recovery
  1, // Single signature (puoi cambiare dopo)
  2  // 2 guardian per recovery
);

console.log("Smart Wallet creato:", walletResult.walletAddress);
```

## Best Practices

1. Usa multi-sig per wallet con molti fondi
2. Imposta almeno 2 guardian fidati
3. Usa batch transactions per risparmiare gas
4. Testa sempre recovery su testnet
5. Mantieni signer separati dai guardian

## Note

- Il plugin richiede che il contratto `SmartWalletFactory` sia già deployato
- Alcune funzioni necessitano di un signer configurato (MetaMask o altro)
- Recovery ha un timelock di 48 ore per sicurezza
