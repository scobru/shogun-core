"use strict";
/**
 * Esempio di utilizzo di Frozen Space in GunDB
 * Frozen Space contiene dati che possono essere solo aggiunti, non modificati o rimossi.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const gun_1 = require("../gun/gun");
/**
 * Esempio di creazione e lettura di dati in Frozen Space
 */
async function freezeData() {
    const gun = new gun_1.GunDB();
    // Esempi di dati che potrebbero essere immutabili
    const recordImmodificabile = {
        id: "tx123456",
        timestamp: Date.now(),
        operazione: "trasferimento",
        da: "alice",
        a: "bob",
        importo: 100,
        valuta: "EUR",
    };
    // Aggiungiamo un record alla collection "transazioni" in Frozen Space
    console.log("Aggiunta transazione a Frozen Space...");
    try {
        await gun.addToFrozenSpace("transazioni", "tx123456", recordImmodificabile);
        console.log("Transazione aggiunta con successo a Frozen Space");
    }
    catch (err) {
        console.error("Errore durante l'aggiunta della transazione:", err);
    }
    // Recupero del record da Frozen Space
    console.log("\nRecupero transazione da Frozen Space...");
    const transazione = await gun.getFrozenData("transazioni", "tx123456");
    console.log("Transazione recuperata:", transazione);
    // Prova a modificare il record (non dovrebbe essere possibile)
    console.log("\nTentativo di modifica della transazione in Frozen Space...");
    try {
        const txModificata = { ...recordImmodificabile, importo: 200 };
        await gun.addToFrozenSpace("transazioni", "tx123456", txModificata);
        // Verifichiamo che la modifica non abbia avuto effetto
        const transazioneDopo = await gun.getFrozenData("transazioni", "tx123456");
        console.log("Transazione dopo tentativo di modifica:", transazioneDopo);
        if (transazioneDopo.importo === 100) {
            console.log("✓ La transazione è rimasta immutata (importo ancora = 100)");
        }
        else {
            console.log("✗ La transazione è stata modificata (importo ora = " +
                transazioneDopo.importo +
                ")");
        }
    }
    catch (err) {
        console.error("Errore:", err);
    }
}
/**
 * Esempio di link tra diversi spazi
 * Mostra come un dato in Public Space può essere collegato a dati in Frozen Space
 */
async function linkAcrossSpaces() {
    const gun = new gun_1.GunDB();
    // Creazione di un record in Frozen Space
    const infoValuta = {
        codice: "EUR",
        nome: "Euro",
        simbolo: "€",
        decimali: 2,
        creato: Date.now(),
    };
    console.log("\nCreazione informazioni valuta in Frozen Space...");
    await gun.addToFrozenSpace("valute", "EUR", infoValuta);
    // Creazione di un riferimento in Public Space che punta al record in Frozen Space
    console.log("Creazione di un link in Public Space che punta al dato in Frozen Space...");
    await gun.savePublicData("lista_valute", "europa", {
        valutaUfficiale: { "#": "valute:::/EUR" }, // Link al record in Frozen Space
    });
    // Recupero del record tramite il link
    console.log("\nRecupero informazioni valuta attraverso il riferimento...");
    const europa = await gun.getPublicData("lista_valute", "europa");
    console.log("Link recuperato:", europa);
    // Seguendo il link per recuperare i dati effettivi
    if (europa && europa.valutaUfficiale) {
        console.log("Recupero dati dalla valuta collegata...");
        // In un'applicazione reale, seguireste il riferimento usando gun.get()
        const valutaInfo = await gun.getFrozenData("valute", "EUR");
        console.log("Informazioni valuta collegate:", valutaInfo);
    }
}
/**
 * Esegue gli esempi di Frozen Space
 */
async function runExamples() {
    console.log("=== ESEMPIO 1: DATI IMMUTABILI IN FROZEN SPACE ===");
    await freezeData();
    console.log("\n=== ESEMPIO 2: LINK TRA DIVERSI SPAZI ===");
    await linkAcrossSpaces();
}
// Esegui gli esempi se il modulo viene eseguito direttamente
if (require.main === module) {
    runExamples().catch(console.error);
}
