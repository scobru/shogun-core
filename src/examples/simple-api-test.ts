/**
 * Esempio semplice che mostra le differenze principali tra i metodi API
 */

import { AutoQuickStart } from "../gundb/api";

async function simpleAPITest() {
  console.log("🚀 Test semplice API ShogunCore\n");

  // Setup
  const quickStart = new AutoQuickStart({
    peers: ["https://peer.wallie.io/gun"],
    appScope: "simple-test",
  });

  await quickStart.init();
  const api = quickStart.api;

  // === DIFFERENZE PRINCIPALI ===

  console.log("📊 === DIFFERENZE GET ===\n");

  // 1. get() - restituisce dati direttamente
  const data1 = await api.get("test/path");
  console.log('get("test/path"):', data1); // null o dati

  // 2. getNode() - restituisce nodo Gun per chaining
  const node1 = api.getNode("test/path");
  console.log('getNode("test/path"):', typeof node1); // "object" (Gun node)

  // 3. node() - alias di getNode()
  const node2 = api.node("test/path");
  console.log('node("test/path"):', typeof node2); // "object" (Gun node)

  // 4. chain() - wrapper con metodi di convenienza
  const chain1 = api.chain("test/path");
  console.log('chain("test/path"):', Object.keys(chain1)); // ['get', 'put', 'set', 'once', 'then', 'map']

  console.log("\n💾 === DIFFERENZE PUT/SET ===\n");

  const testData = { message: "Hello World", timestamp: Date.now() };

  // 1. put() - salva dati globali
  const putResult = await api.put("global/data", testData);
  console.log("put() result:", putResult); // true/false

  // 2. set() - come put() ma semantica diversa
  const setResult = await api.set("global/data2", {
    ...testData,
    method: "set",
  });
  console.log("set() result:", setResult); // true/false

  // Verifica
  const retrieved1 = await api.get("global/data");
  const retrieved2 = await api.get("global/data2");
  console.log("Retrieved put data:", retrieved1);
  console.log("Retrieved set data:", retrieved2);

  console.log("\n🗑️ === DIFFERENZE REMOVE ===\n");

  // remove() - rimuove dati globali
  const removeResult = await api.remove("global/data2");
  console.log("remove() result:", removeResult); // true/false

  const afterRemove = await api.get("global/data2");
  console.log("Data after remove:", afterRemove); // null

  console.log("\n🔐 === TEST AUTENTICAZIONE ===\n");

  // Signup e login
  const username = "testuser_" + Date.now();
  const password = "testpass123";

  const signupResult = await api.signup(username, password);
  console.log("Signup result:", signupResult);

  if (signupResult) {
    const loginResult = await api.login(username, password);
    console.log("Login result:", loginResult);

    if (loginResult) {
      console.log("\n👤 === OPERAZIONI UTENTE ===\n");

      // getUserData() - per dati utente
      const userData = await api.getUserData("profile");
      console.log('getUserData("profile"):', userData); // null o dati utente

      // putUserData() - salva dati utente
      const profileData = { name: "Test User", email: "test@example.com" };
      const putUserResult = await api.putUserData("profile", profileData);
      console.log("putUserData() result:", putUserResult); // true/false

      // Verifica dati utente
      const retrievedProfile = await api.getUserData("profile");
      console.log("Retrieved profile:", retrievedProfile);

      // removeUserData() - rimuove dati utente
      const removeUserResult = await api.removeUserData("profile");
      console.log("removeUserData() result:", removeUserResult); // true/false

      const afterRemoveUser = await api.getUserData("profile");
      console.log("User data after remove:", afterRemoveUser); // null

      // Logout
      api.logout();
      console.log("Logged out");
    }
  }

  console.log("\n✅ Test completato!");
}

// Esegui il test
if (require.main === module) {
  simpleAPITest().catch(console.error);
}

export { simpleAPITest };
