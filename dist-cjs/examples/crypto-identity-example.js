"use strict";
/**
 * Esempio di utilizzo del CryptoIdentityManager
 * Mostra come generare le identità crypto
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.runCryptoIdentityExamples = runCryptoIdentityExamples;
// Import SEA as side-effect to load it globally
require("gun/sea");
require("gun/lib/then");
require("gun/axe");
// Ensure Gun.SEA is available globally
// In Node.js, SEA should attach to Gun.SEA or globalThis.SEA
if (typeof window === "undefined") {
    // Node.js environment
    const GunModule = require("gun");
    if (GunModule && GunModule.SEA) {
        globalThis.Gun = GunModule;
        globalThis.SEA = GunModule.SEA;
    }
}
// Suppress expected Gun.js SEA verification errors globally
// These errors are normal when verifying non-existent or corrupted data
const originalLog = console.log;
const originalError = console.error;
let errorSuppressionActive = false;
const suppressedLog = (...args) => {
    if (!errorSuppressionActive) {
        originalLog.apply(console, args);
        return;
    }
    const message = args.join(" ");
    // Suppress expected SEA verification errors
    if (message.includes("Signature did not match") ||
        message.includes("base64Text") ||
        message.includes("Could not decrypt") ||
        message.includes("Argument 'base64Text' is not Base64 encoded")) {
        return; // Suppress these expected errors
    }
    originalLog.apply(console, args);
};
const suppressedError = (...args) => {
    if (!errorSuppressionActive) {
        originalError.apply(console, args);
        return;
    }
    const message = args.join(" ");
    if (message.includes("Signature did not match") ||
        message.includes("base64Text") ||
        message.includes("Could not decrypt") ||
        message.includes("Argument 'base64Text' is not Base64 encoded")) {
        return;
    }
    originalError.apply(console, args);
};
// Enable error suppression
errorSuppressionActive = true;
console.log = suppressedLog;
console.error = suppressedError;
const index_1 = require("../index");
// Esempio base di generazione identità
async function basicIdentityExample() {
    console.log("🚀 Avvio esempio CryptoIdentityManager");
    // Assicurati che SEA sia disponibile
    if (!globalThis.SEA && !globalThis.Gun?.SEA) {
        await new Promise((resolve) => setTimeout(resolve, 100));
    }
    // Genera un SEA pair di esempio per il test
    // In un'app reale, questo verrebbe dall'autenticazione
    const SEA = globalThis.SEA || globalThis.Gun?.SEA;
    if (!SEA) {
        console.error("❌ SEA non disponibile. Assicurati che gun/sea sia importato.");
        return;
    }
    console.log("✅ SEA disponibile");
    // Genera un SEA pair di esempio
    const exampleUser = "example_user_" + Date.now();
    const examplePassword = "example_password";
    console.log(`🔐 Generazione SEA pair di esempio per: ${exampleUser}`);
    const seaPair = await SEA.pair();
    if (!seaPair) {
        console.error("❌ Impossibile generare SEA pair di esempio");
        return;
    }
    console.log("✅ SEA pair generato");
    // Inizializza CryptoIdentityManager
    const cryptoManager = new index_1.CryptoIdentityManager();
    // Genera le identità crypto
    console.log("🔐 Generazione delle identità crypto...");
    const generateResult = await cryptoManager.generateAllIdentities(exampleUser, seaPair);
    if (generateResult.success && generateResult.identities) {
        const identities = generateResult.identities;
        console.log("✅ Identità crypto generate con successo!");
        console.log("🔐 Identità crypto generate:");
        console.log("- RSA Key Pair:", !!identities.rsa);
        console.log("- AES Symmetric Key:", !!identities.aes);
        console.log("- Signal Protocol Identity:", !!identities.signal);
        console.log("- PGP Key Pair:", !!identities.pgp);
        console.log("- MLS Group:", !!identities.mls);
        console.log("- SFrame Key:", !!identities.sframe);
        console.log("- Created At:", new Date(identities.createdAt).toISOString());
        console.log("- Version:", identities.version);
        console.log("\nℹ️ Nota: Le identità generate dovranno essere salvate lato frontend se necessario.");
        // Esempio di come serializzare le identità per il salvataggio
        const identitiesJson = JSON.stringify(identities);
        console.log(`\n📦 Identità serializzate (${identitiesJson.length} caratteri)`);
        console.log("💡 Puoi criptare e salvare questa stringa usando SEA.encrypt() lato frontend");
    }
    else {
        console.warn("⚠️ Impossibile generare le identità crypto:", generateResult.error);
    }
    console.log("\n🎉 Esempio completato!");
    // Restore original console methods at the end
    errorSuppressionActive = false;
    console.log = originalLog;
    console.error = originalError;
}
// Esempio di rigenerazione delle identità
async function regenerateIdentityExample() {
    console.log("\n🔄 Esempio di rigenerazione identità");
    const SEA = globalThis.SEA || globalThis.Gun?.SEA;
    if (!SEA) {
        console.error("❌ SEA non disponibile");
        return;
    }
    const exampleUser = "example_user_regenerate";
    const seaPair = await SEA.pair();
    const cryptoManager = new index_1.CryptoIdentityManager();
    console.log("🔐 Prima generazione...");
    const firstResult = await cryptoManager.generateAllIdentities(exampleUser, seaPair);
    if (firstResult.success && firstResult.identities) {
        console.log("✅ Prima generazione completata");
        console.log("- RSA:", !!firstResult.identities.rsa);
        console.log("- AES:", !!firstResult.identities.aes);
    }
    console.log("\n🔐 Seconda generazione (nuove identità)...");
    const secondResult = await cryptoManager.generateAllIdentities(exampleUser, seaPair);
    if (secondResult.success && secondResult.identities) {
        console.log("✅ Seconda generazione completata");
        console.log("- RSA:", !!secondResult.identities.rsa);
        console.log("- AES:", !!secondResult.identities.aes);
        console.log("ℹ️ Nota: Ogni generazione crea nuove identità uniche");
    }
    // Restore original console methods at the end
    errorSuppressionActive = false;
    console.log = originalLog;
    console.error = originalError;
}
// Esempio usando setupCryptoIdentities (wrapper)
async function setupIdentityExample() {
    console.log("\n🔧 Esempio usando setupCryptoIdentities");
    const SEA = globalThis.SEA || globalThis.Gun?.SEA;
    if (!SEA) {
        console.error("❌ SEA non disponibile");
        return;
    }
    const exampleUser = "example_user_setup";
    const seaPair = await SEA.pair();
    const cryptoManager = new index_1.CryptoIdentityManager();
    console.log("🔐 Usando setupCryptoIdentities (wrapper)...");
    const result = await cryptoManager.setupCryptoIdentities(exampleUser, seaPair, false);
    if (result.success && result.identities) {
        console.log("✅ Identità generate usando setupCryptoIdentities");
        console.log("- RSA:", !!result.identities.rsa);
        console.log("- AES:", !!result.identities.aes);
        console.log("- Signal:", !!result.identities.signal);
        console.log("- PGP:", !!result.identities.pgp);
        console.log("- MLS:", !!result.identities.mls);
        console.log("- SFrame:", !!result.identities.sframe);
    }
    // Restore original console methods at the end
    errorSuppressionActive = false;
    console.log = originalLog;
    console.error = originalError;
}
// Funzione principale per eseguire gli esempi
async function runCryptoIdentityExamples() {
    try {
        await basicIdentityExample();
        await regenerateIdentityExample();
        await setupIdentityExample();
    }
    catch (error) {
        console.error("❌ Errore durante l'esecuzione degli esempi:", error);
    }
    finally {
        // Always restore console methods
        errorSuppressionActive = false;
        console.log = originalLog;
        console.error = originalError;
    }
}
// Esegui gli esempi se il file viene eseguito direttamente
if (typeof window === "undefined" && require.main === module) {
    runCryptoIdentityExamples();
}
