"use strict";
/**
 * Esempio di utilizzo del sistema di recupero password
 * Questo file mostra come utilizzare le funzioni setPasswordHint e forgotPassword
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.runExamples = runExamples;
const gun_1 = require("../gun/gun");
/**
 * Esempio di configurazione delle domande di sicurezza e del suggerimento per la password
 */
async function setupPasswordRecovery() {
    const gun = new gun_1.GunDB();
    // Registrazione utente (se necessario)
    const username = "mario.rossi";
    const password = "PasswordSicura123!";
    const registrationResult = await gun.signUp(username, password);
    if (!registrationResult.success) {
        console.error("Errore durante la registrazione:", registrationResult.error);
        // Se l'utente esiste già, possiamo procedere comunque con il login
        const loginResult = await gun.login(username, password);
        if (!loginResult.success) {
            console.error("Errore durante il login:", loginResult.error);
            return;
        }
    }
    // Configurazione del recupero password
    const hint = "La mia prima auto";
    // Domande di sicurezza (meglio se personalizzate e non standard)
    const securityQuestions = [
        "Nome del mio animale domestico d'infanzia?",
        "Cognome da nubile di mia madre?",
    ];
    // Risposte alle domande di sicurezza
    const securityAnswers = ["Fido", "Bianchi"];
    // Imposta il suggerimento della password e le domande di sicurezza
    const result = await gun.setPasswordHint(username, password, hint, securityQuestions, securityAnswers);
    if (result.success) {
        console.log("Recupero password configurato con successo");
    }
    else {
        console.error("Errore durante la configurazione del recupero password:", result.error);
    }
}
/**
 * Esempio di recupero del suggerimento della password
 */
async function recoverPasswordHint() {
    const gun = new gun_1.GunDB();
    const username = "mario.rossi";
    // Risposte alle domande di sicurezza
    const securityAnswers = ["Fido", "Bianchi"];
    // Recupera il suggerimento della password
    const result = await gun.forgotPassword(username, securityAnswers);
    if (result.success) {
        console.log("Suggerimento password:", result.hint);
        // A questo punto, l'utente potrebbe usare il suggerimento per ricordare la password
    }
    else {
        console.error("Errore durante il recupero del suggerimento password:", result.error);
    }
}
// Esecuzione degli esempi
async function runExamples() {
    console.log("Configurazione del recupero password...");
    await setupPasswordRecovery();
    console.log("\nRecupero del suggerimento password...");
    await recoverPasswordHint();
}
// Esegui gli esempi se il modulo viene eseguito direttamente
if (require.main === module) {
    runExamples().catch(console.error);
}
