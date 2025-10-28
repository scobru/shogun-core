/**
 * Esempio di utilizzo del CryptoIdentityManager
 * Mostra come le identità crypto vengono generate automaticamente dopo l'autenticazione SEA
 */

import { ShogunCore, CryptoIdentityManager } from "../index";

// Esempio di utilizzo
async function cryptoIdentityExample() {
  console.log("🚀 Avvio esempio CryptoIdentityManager");

  // 1. Inizializza ShogunCore
  const core = new ShogunCore({
    gunOptions: {
      peers: ["https://peer.wallie.io/gun","https://shogunnode.scobrudot.dev/gun","https://shogunnode2.scobrudot.dev/gun","https://lindanode.scobrudot.dev/gun"],
      radisk: false,
      localStorage: false,
    },
  });

  console.log("✅ ShogunCore inizializzato");

  // 2. Registra un nuovo utente (genera automaticamente SEA pair)
  const username = `scobru`;
  const signupResult = await core.signUp(username, "francos88");

  if (!signupResult.success) {
    console.error("❌ Registrazione fallita:", signupResult.error);
    return;
  }

  console.log("✅ Utente registrato:", {
    username: signupResult.username,
    userPub: signupResult.userPub,
    hasSEAPair: !!signupResult.sea,
  });

  // 3. Le identità crypto sono state generate automaticamente durante la registrazione
  // Possiamo accedervi tramite il CryptoIdentityManager
  const cryptoManager = new CryptoIdentityManager(core);

  // 4. Recupera le identità crypto dell'utente corrente
  const identitiesResult = await cryptoManager.getCurrentUserIdentities();

  if (identitiesResult.success && identitiesResult.identities) {
    const identities = identitiesResult.identities;

    console.log("🔐 Identità crypto generate automaticamente:");
    console.log("- RSA Key Pair:", !!identities.rsa);
    console.log("- AES Symmetric Key:", !!identities.aes);
    console.log("- Signal Protocol Identity:", !!identities.signal);
    console.log("- PGP Key Pair:", !!identities.pgp);
    console.log("- MLS Group:", !!identities.mls);
    console.log("- SFrame Key:", !!identities.sframe);
    console.log("- Created At:", new Date(identities.createdAt).toISOString());
    console.log("- Version:", identities.version);
  } else {
    console.error(
      "❌ Errore nel recupero delle identità:",
      identitiesResult.error,
    );
  }

  // 5. Esempio di login con utente esistente
  console.log("\n🔄 Test login con utente esistente...");

  const loginResult = await core.login(username, "francos88");

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

  // 6. Esempio di rigenerazione forzata delle identità
  console.log("\n🔄 Test rigenerazione identità...");

  if (signupResult.sea) {
    const regenerateResult = await cryptoManager.setupCryptoIdentities(
      username,
      signupResult.sea,
      true, // forceRegenerate = true
    );

    if (regenerateResult.success) {
      console.log("✅ Identità crypto rigenerate:", regenerateResult.savedKeys);
    } else {
      console.error("❌ Rigenerazione fallita:", regenerateResult.error);
    }
  }

  console.log("\n🎉 Esempio completato!");
}

// Esempio di utilizzo con diversi metodi di autenticazione
async function multiAuthExample() {
  console.log("\n🔐 Esempio con diversi metodi di autenticazione");

  const core = new ShogunCore({
    gunOptions: {
      peers: ["https://peer.wallie.io/gun","https://shogunnode.scobrudot.dev/gun","https://shogunnode2.scobrudot.dev/gun","https://lindanode.scobrudot.dev/gun"],
      radisk: false,
      localStorage: false,
    },
  });

  // Esempio con WebAuthn (se disponibile)
  try {
    const webauthnPlugin = core.getAuthenticationMethod("webauthn");
    if (webauthnPlugin) {
      console.log("🔐 Test WebAuthn signup...");

      const webauthnResult = await (webauthnPlugin as any).signUp(
        "alice_webauthn",
      );

      if (webauthnResult.success) {
        console.log("✅ WebAuthn signup riuscito");

        // Le identità crypto vengono generate automaticamente anche con WebAuthn
        const cryptoManager = new CryptoIdentityManager(core);
        const identities = await cryptoManager.getCurrentUserIdentities();

        if (identities.success) {
          console.log("✅ Identità crypto generate con WebAuthn");
        }
      }
    }
  } catch (error) {
    console.log("ℹ️ WebAuthn non disponibile:", error);
  }

  // Esempio con ZK-Proof (se disponibile)
  try {
    const zkPlugin = core.getAuthenticationMethod("zkproof");
    if (zkPlugin) {
      console.log("🔐 Test ZK-Proof signup...");

      // ZK-Proof non richiede password, usa il metodo corretto
      const zkResult = await (zkPlugin as any).signUp();

      if (zkResult.success) {
        console.log("✅ ZK-Proof signup riuscito");

        // Le identità crypto vengono generate automaticamente anche con ZK-Proof
        const cryptoManager = new CryptoIdentityManager(core);
        const identities = await cryptoManager.getCurrentUserIdentities();

        if (identities.success) {
          console.log("✅ Identità crypto generate con ZK-Proof");
        }
      } else {
        console.log("ℹ️ ZK-Proof signup non riuscito:", zkResult.error);
      }
    } else {
      console.log("ℹ️ ZK-Proof plugin non disponibile");
    }
  } catch (error) {
    console.log(
      "ℹ️ ZK-Proof test saltato:",
      error instanceof Error ? error.message : String(error),
    );
  }
}

// Funzione principale per eseguire gli esempi
export async function runCryptoIdentityExamples() {
  try {
    await cryptoIdentityExample();
    await multiAuthExample();
  } catch (error) {
    console.error("❌ Errore durante l'esecuzione degli esempi:", error);
  }
}

// Esegui gli esempi se il file viene eseguito direttamente
if (typeof window === "undefined" && require.main === module) {
  runCryptoIdentityExamples();
}
