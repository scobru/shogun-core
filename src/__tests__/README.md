# Test Suite di Shogun Core

Questa directory contiene i test automatizzati per la libreria Shogun Core, organizzati per moduli e funzionalità.

## Struttura

- `core.test.ts` - Test per la classe principale ShogunCore
- `utils/` - Test per le utilities
  - `config.test.ts` - Test per la configurazione globale
  - `errorHandler.test.ts` - Test per il sistema di gestione errori
- `storage/` - Test per le funzionalità di storage
  - `storage.test.ts` - Test per la classe ShogunStorage
- `plugins/` - Test per i plugin
  - `metamask.test.ts` - Test per il plugin MetaMask
  - `webauthn.test.ts` - Test per il plugin WebAuthn

## Esecuzione dei test

Per eseguire tutti i test:

```bash
npm test
```

Per eseguire i test con watch mode (utile durante lo sviluppo):

```bash
npm run test:watch
```

Per generare un report di copertura del codice:

```bash
npm run test:coverage
```

## Mocking

I test utilizzano mock per diverse API e dipendenze esterne:

- `jest.setup.js` contiene mock globali per:
  - localStorage e sessionStorage
  - window.crypto
  - GunDB
  - Altri oggetti del browser

## Aggiungere Nuovi Test

Quando aggiungi nuove funzionalità, segui queste linee guida per i test:

1. Crea un nuovo file di test nella directory appropriata
2. Segui il pattern `nome-funzionalità.test.ts`
3. Includi test per:
   - Casi d'uso normali
   - Gestione degli errori
   - Edge case
   - Prestazioni (quando rilevante)

## Convenzioni di Naming

- Test file: `[component-name].test.ts`
- Test suite: `describe('ComponentName', () => { ... })`
- Test cases: `test('dovrebbe fare qualcosa', () => { ... })`

## Best Practices

1. **Isolamento** - Ogni test dovrebbe essere indipendente dagli altri
2. **Ripristino** - Usa `beforeEach` per ripristinare lo stato tra i test
3. **Descrittivo** - I nomi dei test dovrebbero descrivere il comportamento, non l'implementazione
4. **Completezza** - Testa sia i percorsi positivi che negativi del codice 