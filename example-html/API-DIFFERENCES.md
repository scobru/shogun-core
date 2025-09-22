# Differenze tra i metodi API ShogunCore

Questo documento spiega le differenze principali tra i vari metodi dell'API ShogunCore.

## 🔍 Metodi GET

### `get(path: string)`
- **Restituisce**: Dati direttamente o `null`
- **Uso**: Per ottenere dati una volta sola
- **Esempio**: `const data = await api.get('users/123')`

### `getNode(path: string)`
- **Restituisce**: Nodo Gun per operazioni di chaining
- **Uso**: Per operazioni avanzate come `.map()`, `.on()`, etc.
- **Esempio**: `const node = api.getNode('users/123')`

### `node(path: string)`
- **Restituisce**: Alias di `getNode()`
- **Uso**: Stesso di `getNode()`
- **Esempio**: `const node = api.node('users/123')`

### `chain(path: string)`
- **Restituisce**: Wrapper con metodi di convenienza
- **Uso**: Per operazioni fluide e chaining
- **Metodi disponibili**: `get`, `put`, `set`, `once`, `then`, `map`
- **Esempio**: 
```typescript
const chain = api.chain('users/123');
const data = await chain.once();
const success = await chain.put({ name: 'John' });
```

### `getUserData(path: string)`
- **Restituisce**: Dati utente direttamente o `null`
- **Uso**: Per ottenere dati dell'utente autenticato
- **Richiede**: Login
- **Esempio**: `const profile = await api.getUserData('profile')`

## 💾 Metodi PUT/SET

### `put(path: string, data: any)`
- **Restituisce**: `boolean` (successo/fallimento)
- **Uso**: Salva dati globali
- **Esempio**: `const success = await api.put('global/data', { message: 'Hello' })`

### `set(path: string, data: any)`
- **Restituisce**: `boolean` (successo/fallimento)
- **Uso**: Come `put()` ma con semantica diversa
- **Esempio**: `const success = await api.set('global/data', { message: 'Hello' })`

### `putUserData(path: string, data: any)`
- **Restituisce**: `boolean` (successo/fallimento)
- **Uso**: Salva dati dell'utente autenticato
- **Richiede**: Login
- **Esempio**: `const success = await api.putUserData('profile', { name: 'John' })`

### `setUserData(path: string, data: any)`
- **Restituisce**: `boolean` (successo/fallimento)
- **Uso**: Come `putUserData()` ma con semantica diversa
- **Richiede**: Login
- **Esempio**: `const success = await api.setUserData('settings', { theme: 'dark' })`

## 🗑️ Metodi REMOVE

### `remove(path: string)`
- **Restituisce**: `boolean` (successo/fallimento)
- **Uso**: Rimuove dati globali
- **Esempio**: `const success = await api.remove('global/data')`

### `removeUserData(path: string)`
- **Restituisce**: `boolean` (successo/fallimento)
- **Uso**: Rimuove dati dell'utente autenticato
- **Richiede**: Login
- **Esempio**: `const success = await api.removeUserData('profile')`

## 🔐 Autenticazione

### `signup(username: string, password: string)`
- **Restituisce**: `{ userPub: string, username: string } | null`
- **Uso**: Crea nuovo utente
- **Esempio**: `const user = await api.signup('john', 'password123')`

### `login(username: string, password: string)`
- **Restituisce**: `{ userPub: string, username: string } | null`
- **Uso**: Autentica utente esistente
- **Esempio**: `const user = await api.login('john', 'password123')`

### `logout()`
- **Restituisce**: `void`
- **Uso**: Disconnette utente corrente
- **Esempio**: `api.logout()`

### `isLoggedIn()`
- **Restituisce**: `boolean`
- **Uso**: Controlla se utente è autenticato
- **Esempio**: `const loggedIn = api.isLoggedIn()`

## 👤 Utility Utente

### `getCurrentUser()`
- **Restituisce**: `{ pub: string, username?: string } | null`
- **Uso**: Ottiene info utente corrente
- **Esempio**: `const user = api.getCurrentUser()`

### `getUser(alias: string)`
- **Restituisce**: `{ userPub: string, username: string } | null`
- **Uso**: Ottiene info utente per alias
- **Esempio**: `const user = await api.getUser('john')`

### `userExists(alias: string)`
- **Restituisce**: `boolean`
- **Uso**: Controlla se utente esiste
- **Esempio**: `const exists = await api.userExists('john')`

## 🛠️ Metodi di Convenienza

### `updateProfile(data: object)`
- **Restituisce**: `boolean`
- **Uso**: Aggiorna profilo utente
- **Richiede**: Login
- **Esempio**: `const success = await api.updateProfile({ name: 'John', bio: 'Developer' })`

### `getProfile()`
- **Restituisce**: `Record<string, unknown> | null`
- **Uso**: Ottiene profilo utente
- **Richiede**: Login
- **Esempio**: `const profile = await api.getProfile()`

### `saveSettings(data: object)`
- **Restituisce**: `boolean`
- **Uso**: Salva impostazioni utente
- **Richiede**: Login
- **Esempio**: `const success = await api.saveSettings({ theme: 'dark', language: 'it' })`

### `getSettings()`
- **Restituisce**: `Record<string, unknown> | null`
- **Uso**: Ottiene impostazioni utente
- **Richiede**: Login
- **Esempio**: `const settings = await api.getSettings()`

## 📚 Gestione Collezioni

### `createCollection(name: string, items: object)`
- **Restituisce**: `boolean`
- **Uso**: Crea collezione di dati
- **Richiede**: Login
- **Esempio**: `const success = await api.createCollection('todos', { '1': { id: '1', text: 'Learn' } })`

### `addToCollection(name: string, id: string, item: any)`
- **Restituisce**: `boolean`
- **Uso**: Aggiunge item a collezione
- **Richiede**: Login
- **Esempio**: `const success = await api.addToCollection('todos', '2', { id: '2', text: 'Build' })`

### `getCollection(name: string)`
- **Restituisce**: `Record<string, unknown> | null`
- **Uso**: Ottiene collezione
- **Richiede**: Login
- **Esempio**: `const todos = await api.getCollection('todos')`

### `removeFromCollection(name: string, id: string)`
- **Restituisce**: `boolean`
- **Uso**: Rimuove item da collezione
- **Richiede**: Login
- **Esempio**: `const success = await api.removeFromCollection('todos', '1')`

## 📊 Array Utilities

### `arrayToIndexedObject(arr: Array<{id: string|number}>)`
- **Restituisce**: `Record<string, T>`
- **Uso**: Converte array in oggetto indicizzato per GunDB
- **Esempio**: 
```typescript
const arr = [{ id: '1', name: 'Item 1' }, { id: '2', name: 'Item 2' }];
const obj = api.arrayToIndexedObject(arr);
// Risultato: { '1': { id: '1', name: 'Item 1' }, '2': { id: '2', name: 'Item 2' } }
```

### `indexedObjectToArray(obj: Record<string, T>)`
- **Restituisce**: `T[]`
- **Uso**: Converte oggetto indicizzato in array
- **Esempio**: 
```typescript
const obj = { '1': { id: '1', name: 'Item 1' }, '2': { id: '2', name: 'Item 2' } };
const arr = api.indexedObjectToArray(obj);
// Risultato: [{ id: '1', name: 'Item 1' }, { id: '2', name: 'Item 2' }]
```

## 🎯 Quando Usare Cosa

### Per operazioni semplici:
- `get()` - per leggere dati una volta
- `put()` - per salvare dati globali
- `remove()` - per rimuovere dati globali

### Per operazioni utente:
- `getUserData()` - per leggere dati utente
- `putUserData()` - per salvare dati utente
- `removeUserData()` - per rimuovere dati utente

### Per operazioni avanzate:
- `getNode()` o `node()` - per chaining e operazioni Gun native
- `chain()` - per operazioni fluide

### Per gestione profili:
- `updateProfile()` - per aggiornare profilo
- `getProfile()` - per ottenere profilo
- `saveSettings()` - per salvare impostazioni
- `getSettings()` - per ottenere impostazioni

### Per collezioni:
- `createCollection()` - per creare collezione
- `addToCollection()` - per aggiungere item
- `getCollection()` - per ottenere collezione
- `removeFromCollection()` - per rimuovere item
