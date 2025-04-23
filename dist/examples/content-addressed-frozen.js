"use strict";
/**
 * Esempio di utilizzo di content addressing (hash) combinato con Frozen Space
 * Questa combinazione offre sia immutabilità che riferimenti deterministici
 */
Object.defineProperty(exports, "__esModule", { value: true });
const gun_1 = require("../gun/gun");
/**
 * Dimostra come salvare e recuperare dati usando content addressing in Frozen Space
 */
async function contentAddressedStorage() {
    const gun = new gun_1.GunDB();
    // Dati di esempio da rendere immutabili
    const documentoLegale = {
        titolo: "Contratto di Servizio",
        versione: "1.0",
        data: new Date().toISOString(),
        contenuto: "Questo documento stabilisce i termini e le condizioni per...",
        firme: ["Alice", "Bob"],
        timestamp: Date.now(),
    };
    console.log("=== SALVATAGGIO DOCUMENTO USANDO CONTENT ADDRESSING E FROZEN SPACE ===");
    console.log("Documento originale:", documentoLegale);
    try {
        // 1. Salva il documento generando automaticamente l'hash dal contenuto
        const hash = await gun.addHashedToFrozenSpace("documenti", documentoLegale);
        console.log(`\nDocumento salvato con hash: ${hash}`);
        // 2. Recupera il documento usando l'hash
        console.log("\n=== RECUPERO DOCUMENTO USANDO L'HASH ===");
        const documentoRecuperato = await gun.getHashedFrozenData("documenti", hash);
        console.log("Documento recuperato:", documentoRecuperato);
        // 3. Verifica l'integrità dei dati
        console.log("\n=== VERIFICA INTEGRITÀ DEI DATI ===");
        try {
            const documentoVerificato = await gun.getHashedFrozenData("documenti", hash, true);
            console.log("✓ Integrità verificata: i dati corrispondono all'hash");
        }
        catch (error) {
            console.error("✗ Errore di integrità:", error);
        }
        // 4. Tentativo di modifica (non dovrebbe essere possibile)
        console.log("\n=== TENTATIVO DI MODIFICA DEL DOCUMENTO ===");
        const documentoModificato = {
            ...documentoLegale,
            contenuto: "CONTENUTO MODIFICATO FRAUDOLENTEMENTE",
        };
        try {
            // Tenta di sovrascrivere lo stesso hash con dati diversi
            await gun.addToFrozenSpace("documenti", hash, documentoModificato);
            // Verifica se la modifica ha avuto effetto
            const documentoDopo = await gun.getHashedFrozenData("documenti", hash);
            console.log("Documento dopo tentativo di modifica:", documentoDopo);
            if (documentoDopo.contenuto === documentoLegale.contenuto) {
                console.log("✓ Il documento è rimasto immutato (protezione Frozen Space funzionante)");
            }
            else {
                console.log("✗ Il documento è stato modificato (protezione Frozen Space non funzionante)");
            }
        }
        catch (err) {
            console.error("Errore durante il tentativo di modifica:", err);
        }
        // 5. Creiamo un indice per riferirsi a documenti specifici
        console.log("\n=== CREAZIONE INDICE PER RIFERIMENTO AI DOCUMENTI ===");
        await gun.savePublicData("indice_documenti", "contratto_servizio_v1", {
            tipo: "contratto",
            hash: hash,
            dataCreazione: new Date().toISOString(),
        });
        console.log("Indice creato per il documento");
        // 6. Recupero tramite indice
        console.log("\n=== RECUPERO TRAMITE INDICE ===");
        const indice = await gun.getPublicData("indice_documenti", "contratto_servizio_v1");
        console.log("Indice recuperato:", indice);
        if (indice && indice.hash) {
            console.log("Recupero documento tramite hash nell'indice...");
            const docDaIndice = await gun.getHashedFrozenData("documenti", indice.hash);
            console.log("Documento recuperato tramite indice:", docDaIndice);
        }
    }
    catch (error) {
        console.error("Errore durante l'esecuzione dell'esempio:", error);
    }
}
/**
 * Esegue l'esempio
 */
async function runExample() {
    await contentAddressedStorage();
}
// Esegui l'esempio se il modulo viene eseguito direttamente
if (require.main === module) {
    runExample().catch(console.error);
}
