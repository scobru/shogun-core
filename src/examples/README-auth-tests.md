# Authentication Test Scripts

Questi script testano la funzionalità di signup e login con username e password in ShogunCore.

## Script Disponibili

### 1. `quick-auth-test.ts` - Test Rapido
```bash
npx ts-node src/examples/quick-auth-test.ts
```
**Cosa fa:**
- Testa signup, login e logout di base
- Esegue rapidamente i test essenziali
- Perfetto per verificare che tutto funzioni

### 2. `auth-test.ts` - Test Completo
```bash
npx ts-node src/examples/auth-test.ts
```
**Cosa fa:**
- Test completo di autenticazione
- Testa operazioni sui dati mentre loggato
- Testa gestione degli errori
- Testa re-login dopo logout
- Testa credenziali invalide

### 3. `timeout-test.ts` - Test Timeout
```bash
npx ts-node src/examples/timeout-test.ts
```
**Cosa fa:**
- Testa il meccanismo di timeout (10 secondi)
- Verifica che le operazioni non si blocchino
- Testa credenziali invalide e utenti inesistenti
- Test di stress con operazioni multiple

## Come Eseguire i Test

### Prerequisiti
```bash
# Installa le dipendenze
cd shogun-core
npm install

# Oppure con yarn
yarn install
```

### Esecuzione
```bash
# Test rapido (raccomandato per iniziare)
npx ts-node src/examples/quick-auth-test.ts

# Test completo
npx ts-node src/examples/auth-test.ts

# Test timeout
npx ts-node src/examples/timeout-test.ts
```

## Cosa Aspettarsi

### ✅ Test di Successo
- Signup completato in < 5 secondi
- Login completato in < 5 secondi
- Logout funzionante
- Re-login funzionante
- Gestione errori corretta

### ⚠️ Possibili Problemi
- **Timeout > 10 secondi**: Problema di rete o relay Gun
- **Signup fallisce**: Username già esistente o problema di rete
- **Login fallisce**: Credenziali errate o problema di rete

## Debugging

### Se i Test Falliscono
1. **Controlla la connessione internet**
2. **Verifica che i relay Gun siano raggiungibili**:
   - https://peer.wallie.io/gun
   - https://gun-manhattan.herokuapp.com/gun
   - https://gun.defucc.me/gun

3. **Controlla i log della console** per errori specifici

### Log di Debug
I test includono logging dettagliato per aiutare a identificare i problemi:
- Tempo di esecuzione delle operazioni
- Risultati dettagliati di ogni operazione
- Messaggi di errore specifici

## Modifiche Recenti

### Timeout Mechanism
- Aggiunto timeout di 10 secondi per prevenire il blocco
- Messaggi di errore informativi se il timeout viene raggiunto
- Gestione graceful degli errori di rete

### Backward Compatibility
- `shogunCore.gun` ora punta a `shogunCore.transport.gun`
- Accesso multiplo al Gun instance
- Debug methods disponibili in `window.shogunDebug`

## Esempi di Output

### Test di Successo
```
🚀 Quick Authentication Test

✓ ShogunCore initialized
Testing with username: quicktest_1703123456789

🔄 Testing signup...
✓ Signup successful

🔄 Testing login...
✓ Login successful
✓ User is logged in: true

🔄 Testing logout...
✓ Logout completed
✓ User is logged out: true

✅ All tests passed! Authentication system is working correctly.
```

### Test con Timeout
```
⏱️ ShogunCore Timeout Test

📦 === INITIALIZATION ===
✓ ShogunCore initialized successfully

🧪 === TEST 1: NORMAL SIGNUP ===
Testing signup with username: timeouttest_1703123456789
Expected: Should complete within 10 seconds

✓ Signup completed in 2341ms
✓ Signup completed in reasonable time
Signup result: { success: true, error: 'None' }
```
