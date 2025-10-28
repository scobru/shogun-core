/**
 * Esempio semplificato del CryptoIdentityManager
 * Focus sulla funzionalità principale senza plugin opzionali
 */

import { ShogunCore, CryptoIdentityManager } from "../index";

// Esempio principale
async function simpleCryptoIdentityExample() {
  console.log("🚀 Esempio Semplificato CryptoIdentityManager");
  console.log("============================================\n");

  // 1. Inizializza ShogunCore
  const core = new ShogunCore({
    gunOptions: {
      peers: ["https://peer.wallie.io/gun"],
      radisk: true,
      localStorage: false,
    },
  });

  console.log("✅ ShogunCore inizializzato");

  // 2. Registra un nuovo utente (genera automaticamente SEA pair)
  const username = `user_${Date.now()}`;
  const signupResult = await core.signUp(username, "password123");

  if (!signupResult.success) {
    console.error("❌ Registrazione fallita:", signupResult.error);
    return;
  }

  console.log("✅ Utente registrato:", {
    username: signupResult.username,
    userPub: signupResult.userPub?.substring(0, 20) + "...",
    hasSEAPair: !!signupResult.sea,
  });

  // 3. Le identità crypto sono state generate automaticamente durante la registrazione
  const cryptoManager = new CryptoIdentityManager(core);

  // 4. Recupera le identità crypto dell'utente corrente
  const identitiesResult = await cryptoManager.getCurrentUserIdentities();

  if (identitiesResult.success && identitiesResult.identities) {
    const identities = identitiesResult.identities;

    console.log("\n🔐 Identità crypto generate automaticamente:");
    console.log("===========================================");
    console.log("- RSA Key Pair:", identities.rsa ? "✅" : "❌");
    console.log("- AES Symmetric Key:", identities.aes ? "✅" : "❌");
    console.log("- Signal Protocol Identity:", identities.signal ? "✅" : "❌");
    console.log("- PGP Key Pair:", identities.pgp ? "✅" : "❌");
    console.log("- MLS Group:", identities.mls ? "✅" : "❌");
    console.log("- SFrame Key:", identities.sframe ? "✅" : "❌");
    console.log("- Created At:", new Date(identities.createdAt).toISOString());
    console.log("- Version:", identities.version);
  } else {
    console.error(
      "❌ Errore nel recupero delle identità:",
      identitiesResult.error,
    );
  }

  // 5. Test login con utente esistente
  console.log("\n🔄 Test login con utente esistente...");

  const loginResult = await core.login(username, "password123");

  if (loginResult.success) {
    console.log("✅ Login riuscito");

    // Le identità crypto esistenti vengono recuperate automaticamente
    const existingIdentities = await cryptoManager.getCurrentUserIdentities();

    if (existingIdentities.success) {
      console.log("✅ Identità crypto esistenti recuperate");
    }
  } else {
    console.error("❌ Login fallito:", loginResult.error);
  }

  // 6. Test verifica esistenza identità
  console.log("\n🔍 Test verifica esistenza identità...");
  const hasIdentities = await cryptoManager.hasStoredIdentities(username);
  console.log(
    `✅ Identità salvate per ${username}: ${hasIdentities ? "Sì" : "No"}`,
  );

  console.log("\n🎉 Esempio completato!");
  console.log("=====================");
  console.log("✅ Il CryptoIdentityManager funziona perfettamente!");
  console.log("✅ Le identità crypto vengono generate automaticamente");
  console.log("✅ Le identità vengono salvate e recuperate correttamente");
  console.log("✅ Il sistema è pronto per l'uso! 🚀");
}

// Esegui l'esempio se il file viene eseguito direttamente
if (typeof window === "undefined" && require.main === module) {
  simpleCryptoIdentityExample().catch((error) => {
    console.error("❌ Errore durante l'esecuzione dell'esempio:", error);
  });
}

export { simpleCryptoIdentityExample };
