/**
 * Esempio completo che mostra le differenze tra i vari metodi dell'API ShogunCore
 *
 * Questo esempio dimostra:
 * - get() vs getData() vs getNode() vs node() vs chain()
 * - put() vs set() vs putUserData() vs setUserData()
 * - remove() vs removeUserData()
 * - Operazioni globali vs operazioni utente
 */

import { AutoQuickStart } from "../gundb/api";
import { createGun } from "../gundb/db";

async function demonstrateAPIDifferences() {
  console.log("🚀 Iniziamo il test delle differenze API...\n");

  // 1. Setup iniziale
  const quickStart = new AutoQuickStart({
    peers: ["https://peer.wallie.io/gun"],
    appScope: "test-api",
  });

  await quickStart.init();
  const api = quickStart.api;

  console.log("✅ Setup completato\n");

  // 2. Test operazioni GLOBALI (senza autenticazione)
  console.log("📊 === TEST OPERAZIONI GLOBALI ===\n");

  // Test get() - restituisce dati direttamente o null
  console.log("🔍 Test get():");
  const globalData = await api.get("global/test");
  console.log('get("global/test"):', globalData); // null se non esiste

  // Test getNode() - restituisce nodo Gun per operazioni di chaining
  console.log("\n🔗 Test getNode():");
  const globalNode = api.getNode("global/test");
  console.log('getNode("global/test"):', typeof globalNode); // Gun node object

  // Test node() - alias di getNode()
  console.log("\n🔗 Test node():");
  const globalNode2 = api.node("global/test");
  console.log('node("global/test"):', typeof globalNode2); // Gun node object

  // Test chain() - wrapper con metodi di convenienza
  console.log("\n⛓️ Test chain():");
  const globalChain = api.chain("global/test");
  console.log('chain("global/test"):', Object.keys(globalChain)); // ['get', 'put', 'set', 'once', 'then', 'map']

  // Test put() vs set() - operazioni globali
  console.log("\n💾 Test put() vs set():");

  const testData = { message: "Hello Global!", timestamp: Date.now() };

  const putResult = await api.put("global/test", testData);
  console.log("put() result:", putResult); // boolean

  const setResult = await api.set("global/test2", {
    ...testData,
    method: "set",
  });
  console.log("set() result:", setResult); // boolean

  // Verifica che i dati siano stati salvati
  const retrievedData1 = await api.get("global/test");
  const retrievedData2 = await api.get("global/test2");
  console.log("Retrieved put data:", retrievedData1);
  console.log("Retrieved set data:", retrievedData2);

  // Test remove() - operazione globale
  console.log("\n🗑️ Test remove():");
  const removeResult = await api.remove("global/test2");
  console.log("remove() result:", removeResult); // boolean

  const removedData = await api.get("global/test2");
  console.log("Data after remove:", removedData); // null

  // 3. Test autenticazione
  console.log("\n\n🔐 === TEST AUTENTICAZIONE ===\n");

  const username = "testuser_" + Date.now();
  const password = "testpass123";

  // Test signup
  console.log("📝 Test signup():");
  const signupResult = await api.signup(username, password);
  console.log("signup result:", signupResult);

  if (signupResult) {
    console.log("✅ Utente creato:", signupResult.username);

    // Test login
    console.log("\n🔑 Test login():");
    const loginResult = await api.login(username, password);
    console.log("login result:", loginResult);

    if (loginResult) {
      console.log("✅ Login riuscito:", loginResult.username);

      // 4. Test operazioni UTENTE (con autenticazione)
      console.log("\n\n👤 === TEST OPERAZIONI UTENTE ===\n");

      // Test getUserData() - restituisce dati utente direttamente
      console.log("🔍 Test getUserData():");
      const userData = await api.getUserData("profile");
      console.log('getUserData("profile"):', userData); // null se non esiste

      // Test putUserData() vs setUserData() - operazioni utente
      console.log("\n💾 Test putUserData() vs setUserData():");

      const profileData = {
        name: "Test User",
        email: "test@example.com",
        bio: "Test bio",
        preferences: {
          theme: "dark",
          notifications: true,
        },
      };

      const putUserResult = await api.putUserData("profile", profileData);
      console.log("putUserData() result:", putUserResult); // boolean

      const settingsData = {
        language: "it",
        timezone: "Europe/Rome",
        privacy: "public",
      };

      const setUserResult = await api.setUserData("settings", settingsData);
      console.log("setUserData() result:", setUserResult); // boolean

      // Verifica che i dati utente siano stati salvati
      const retrievedProfile = await api.getUserData("profile");
      const retrievedSettings = await api.getUserData("settings");
      console.log("Retrieved profile:", retrievedProfile);
      console.log("Retrieved settings:", retrievedSettings);

      // Test getUserNode() - nodo utente per operazioni avanzate
      console.log("\n🔗 Test getUserNode():");
      try {
        const userNode = api.getUserNode("profile");
        console.log('getUserNode("profile"):', typeof userNode); // Gun node object
      } catch (error) {
        console.log("getUserNode error:", (error as Error).message);
      }

      // Test removeUserData() - rimozione dati utente
      console.log("\n🗑️ Test removeUserData():");
      const removeUserResult = await api.removeUserData("settings");
      console.log("removeUserData() result:", removeUserResult); // boolean

      const removedUserData = await api.getUserData("settings");
      console.log("User data after remove:", removedUserData); // null

      // 5. Test metodi di convenienza
      console.log("\n\n🛠️ === TEST METODI DI CONVENIENZA ===\n");

      // Test updateProfile()
      console.log("👤 Test updateProfile():");
      const profileUpdate = {
        name: "Updated Test User",
        bio: "Updated bio",
        avatar: "https://example.com/avatar.jpg",
      };
      const profileResult = await api.updateProfile(profileUpdate);
      console.log("updateProfile() result:", profileResult);

      const updatedProfile = await api.getProfile();
      console.log("Updated profile:", updatedProfile);

      // Test saveSettings()
      console.log("\n⚙️ Test saveSettings():");
      const settings = {
        theme: "light",
        language: "en",
        notifications: false,
      };
      const settingsResult = await api.saveSettings(settings);
      console.log("saveSettings() result:", settingsResult);

      const savedSettings = await api.getSettings();
      console.log("Saved settings:", savedSettings);

      // Test createCollection()
      console.log("\n📚 Test createCollection():");
      const todos = {
        "1": { id: "1", text: "Learn ShogunCore", completed: false },
        "2": { id: "2", text: "Build awesome app", completed: false },
        "3": { id: "3", text: "Deploy to production", completed: true },
      };
      const collectionResult = await api.createCollection("todos", todos);
      console.log("createCollection() result:", collectionResult);

      const todosCollection = await api.getCollection("todos");
      console.log("Todos collection:", todosCollection);

      // Test addToCollection()
      console.log("\n➕ Test addToCollection():");
      const newTodo = { id: "4", text: "Test API methods", completed: false };
      const addResult = await api.addToCollection("todos", "4", newTodo);
      console.log("addToCollection() result:", addResult);

      const updatedCollection = await api.getCollection("todos");
      console.log("Updated collection:", updatedCollection);

      // Test removeFromCollection()
      console.log("\n➖ Test removeFromCollection():");
      const removeFromCollectionResult = await api.removeFromCollection(
        "todos",
        "3",
      );
      console.log("removeFromCollection() result:", removeFromCollectionResult);

      const finalCollection = await api.getCollection("todos");
      console.log("Final collection:", finalCollection);

      // 6. Test utility methods
      console.log("\n\n🔧 === TEST METODI UTILITY ===\n");

      // Test getCurrentUser()
      console.log("👤 Test getCurrentUser():");
      const currentUser = api.getCurrentUser();
      console.log("Current user:", currentUser);

      // Test isLoggedIn()
      console.log("\n🔐 Test isLoggedIn():");
      const isLoggedIn = api.isLoggedIn();
      console.log("Is logged in:", isLoggedIn);

      // Test userExists()
      console.log("\n🔍 Test userExists():");
      const userExists = await api.userExists(username);
      console.log(`User ${username} exists:`, userExists);

      // Test getUser()
      console.log("\n👥 Test getUser():");
      const userInfo = await api.getUser(username);
      console.log("User info:", userInfo);

      // Test logout
      console.log("\n🚪 Test logout():");
      api.logout();
      const isLoggedInAfter = api.isLoggedIn();
      console.log("Is logged in after logout:", isLoggedInAfter);
    } else {
      console.log("❌ Login fallito");
    }
  } else {
    console.log("❌ Signup fallito");
  }

  // 7. Test array utilities
  console.log("\n\n📊 === TEST ARRAY UTILITIES ===\n");

  const testArray = [
    { id: "1", name: "Item 1", value: 100 },
    { id: "2", name: "Item 2", value: 200 },
    { id: "3", name: "Item 3", value: 300 },
  ];

  console.log("Original array:", testArray);

  // Test arrayToIndexedObject()
  const indexedObject = api.arrayToIndexedObject(testArray);
  console.log("Array to indexed object:", indexedObject);

  // Test indexedObjectToArray()
  const backToArray = api.indexedObjectToArray(indexedObject);
  console.log("Indexed object back to array:", backToArray);

  console.log("\n✅ Test completato!");
}

// Funzione per mostrare le differenze principali
function showAPIDifferences() {
  console.log(`
📋 === RIEPILOGO DIFFERENZE API ===

🔍 METODI GET:
• get(path)           → Restituisce dati direttamente o null
• getNode(path)       → Restituisce nodo Gun per chaining (.map(), .on(), etc.)
• node(path)          → Alias di getNode()
• chain(path)         → Wrapper con metodi di convenienza (get, put, set, once, then, map)
• getUserData(path)   → Come get() ma per dati utente (richiede login)

💾 METODI PUT/SET:
• put(path, data)     → Salva dati globali, restituisce boolean
• set(path, data)     → Come put() ma con semantica diversa
• putUserData(path, data) → Salva dati utente, restituisce boolean
• setUserData(path, data) → Come putUserData() ma con semantica diversa

🗑️ METODI REMOVE:
• remove(path)        → Rimuove dati globali, restituisce boolean
• removeUserData(path) → Rimuove dati utente, restituisce boolean

🔐 AUTENTICAZIONE:
• signup(username, password) → Crea nuovo utente
• login(username, password)  → Autentica utente esistente
• logout()                   → Disconnette utente
• isLoggedIn()               → Controlla se utente è autenticato

👤 UTILITY UTENTE:
• getCurrentUser()    → Info utente corrente
• getUser(alias)      → Info utente per alias
• userExists(alias)   → Controlla se utente esiste

🛠️ METODI DI CONVENIENZA:
• updateProfile(data) → Aggiorna profilo utente
• getProfile()        → Ottiene profilo utente
• saveSettings(data)  → Salva impostazioni utente
• getSettings()       → Ottiene impostazioni utente
• createCollection(name, items) → Crea collezione
• addToCollection(name, id, item) → Aggiunge item a collezione
• getCollection(name) → Ottiene collezione
• removeFromCollection(name, id) → Rimuove item da collezione

📊 ARRAY UTILITIES:
• arrayToIndexedObject(arr) → Converte array in oggetto indicizzato per GunDB
• indexedObjectToArray(obj) → Converte oggetto indicizzato in array
  `);
}

// Esegui il test
if (require.main === module) {
  showAPIDifferences();
  demonstrateAPIDifferences().catch(console.error);
}

export { demonstrateAPIDifferences, showAPIDifferences };
