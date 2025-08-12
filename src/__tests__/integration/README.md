# Integration Tests con GunDB Reale

Questo directory contiene test di integrazione che utilizzano un'istanza reale di GunDB in memoria per testare il comportamento effettivo del sistema senza mock.

## Approccio

Invece di utilizzare mock per GunDB, questi test utilizzano un'istanza reale di Gun configurata per funzionare completamente in memoria:

```typescript
const gun = Gun({
  file: false,           // Disabilita il salvataggio su file
  localStorage: false,   // Disabilita localStorage
  radisk: false,         // Disabilita radisk
  multicast: false,      // Disabilita multicast
  axe: false,           // Disabilita axe
  axe_in: false,        // Disabilita axe_in
  axe_out: false,       // Disabilita axe_out
});
```

## Vantaggi

1. **Test Realistici**: I test verificano il comportamento effettivo di GunDB
2. **Nessun Mock**: Elimina la complessità di mockare GunDB
3. **Isolamento**: Ogni test utilizza una nuova istanza di Gun
4. **Persistenza Reale**: Testa la persistenza effettiva dei dati

## File di Test

### `user_manager.integration.test.ts`
Test completi per le funzionalità di gestione utenti:
- Registrazione utenti
- Autenticazione
- Gestione errori
- Persistenza dati
- Stato di autenticazione

### `saveUser.integration.test.ts`
Test focalizzati sulla funzione `saveUser` (equivalente a `signUp`):
- Salvataggio e autenticazione
- Gestione duplicati
- Validazione password
- Gestione errori
- Verifica persistenza

## Esecuzione

### Eseguire tutti i test di integrazione:
```bash
yarn test:integration
```

### Eseguire i test di integrazione in modalità watch:
```bash
yarn test:integration:watch
```

### Eseguire un test specifico:
```bash
yarn test:integration -- --testNamePattern="saveUser"
```

## Configurazione

I test utilizzano una configurazione Jest separata (`jest.integration.config.js`) che:
- Aumenta il timeout a 30 secondi
- Configura l'ambiente Node.js
- Abilita la copertura del codice
- Permette connessioni di rete reali

## Esempio di Test

```typescript
it('dovrebbe salvare un utente e autenticarlo correttamente', async () => {
  const username = 'integ_testuser_' + Date.now();
  const password = 'integ_testpassword123!';

  const result = await saveUser(username, password);

  expect(result.success).toBe(true);
  expect(result.user.username).toBe(username);
  expect(result.user.pub).toBeDefined();

  // Verifichiamo che l'utente sia stato salvato su GunDB
  const user = await new Promise((resolve) => {
    gun.get('users').get(username).once((data) => {
      resolve(data);
    });
  });

  expect(user).toBeDefined();
  expect(user.pub).toBeDefined();
  expect(user.username).toBe(username);
});
```

## Best Practices

1. **Usernames Unici**: Utilizza `Date.now()` per creare usernames unici
2. **Cleanup**: Pulisci lo stato dopo ogni test
3. **Timeout**: I test di integrazione possono richiedere più tempo
4. **Isolamento**: Ogni test dovrebbe essere indipendente

## Troubleshooting

### Errori di Timeout
- Aumenta il timeout nel file di configurazione
- Verifica che GunDB sia inizializzato correttamente

### Errori di Connessione
- I test utilizzano GunDB in memoria, non richiedono connessioni esterne
- Verifica che le dipendenze siano installate correttamente

### Errori di Autenticazione
- Assicurati che le password rispettino i requisiti di sicurezza
- Verifica che l'utente non esista già prima del test
