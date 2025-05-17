"use strict";
/**
 * Utility functions for working with the relay system
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.RelayVerifier = exports.RelayEventType = void 0;
exports.getRelayUrls = getRelayUrls;
exports.getRegisteredPubKeys = getRegisteredPubKeys;
exports.getSubscriptionHistory = getSubscriptionHistory;
exports.getRelayPerformance = getRelayPerformance;
exports.getNetworkSummary = getNetworkSummary;
exports.subscribeToRelayEvents = subscribeToRelayEvents;
exports.getUsageDataForChart = getUsageDataForChart;
const ethers_1 = require("ethers");
const relay_1 = require("./relay");
const events_1 = require("events");
const errorHandler_1 = require("../utils/errorHandler");
const logger_1 = require("../utils/logger");
var RelayEventType;
(function (RelayEventType) {
    RelayEventType["NEW_SUBSCRIPTION"] = "newSubscription";
    RelayEventType["SUBSCRIPTION_EXPIRED"] = "subscriptionExpired";
    RelayEventType["RELAY_REGISTERED"] = "relayRegistered";
    RelayEventType["RELAY_DEACTIVATED"] = "relayDeactivated";
    RelayEventType["RELAY_REACTIVATED"] = "relayReactivated";
})(RelayEventType || (exports.RelayEventType = RelayEventType = {}));
// Event emitter singleton per gli eventi relay
const relayEventEmitter = new events_1.EventEmitter();
/**
 * Fetch all relay URLs from the registry
 * @param registry - Registry instance
 * @param onlyActive - Whether to only fetch active relays (default: true)
 * @returns Array of relay URLs and addresses
 */
async function getRelayUrls(registry, onlyActive = true) {
    try {
        const urls = [];
        let offset = 0;
        const limit = 100;
        let hasMore = true;
        // Paginate through all relays
        while (hasMore) {
            const page = await registry.getAllRelays(onlyActive, offset, limit);
            if (!page || page.relays.length === 0) {
                hasMore = false;
                continue;
            }
            // Get info for each relay
            for (const relayAddress of page.relays) {
                const info = await registry.getRelayInfo(relayAddress);
                if (info && info.url) {
                    urls.push({
                        url: info.url,
                        address: relayAddress,
                    });
                }
            }
            // Check if there are more relays to fetch
            offset += page.relays.length;
            hasMore = offset < Number(page.total);
        }
        return urls;
    }
    catch (error) {
        console.error("Failed to fetch relay URLs:", error);
        return [];
    }
}
/**
 * Retrieve all public keys registered in relays and group them
 * @param registry - Registry instance
 * @param entryPoint - EntryPoint instance
 * @param userAddresses - Optional list of user addresses to check
 * @param onlyActive - Whether to only fetch active relays (default: true)
 * @returns Grouped public keys with their associated relays
 */
async function getRegisteredPubKeys(registry, entryPoint, userAddresses, onlyActive = true) {
    try {
        const pubKeys = [];
        const relayUrls = await getRelayUrls(registry, onlyActive);
        if (userAddresses && userAddresses.length > 0) {
            // If we have specific user addresses, check their subscriptions
            for (const userAddress of userAddresses) {
                for (const relay of relayUrls) {
                    const hasKey = await entryPoint.hasRegisteredPubKey(userAddress, relay.address);
                    if (hasKey) {
                        const details = await entryPoint.getSubscriptionDetails(userAddress, relay.address);
                        if (details && details.pubKey) {
                            pubKeys.push({
                                relayAddress: relay.address,
                                relayUrl: relay.url,
                                pubKey: details.pubKey,
                                userAddress,
                                expires: details.expires,
                            });
                        }
                    }
                }
            }
        }
        else {
            // Without specific user addresses, we need to use an alternative approach
            // Here we'll use batch checking for known public keys against each relay
            // This is a placeholder implementation that needs to be adapted to your specific needs
            // For example, you might have a way to query all public keys from a relay directly
            // For demonstration purposes, we'll create a SimpleRelay instance for each relay
            // and try to get information about active subscribers
            for (const relay of relayUrls) {
                try {
                    const simpleRelay = new relay_1.SimpleRelay({
                        relayAddress: relay.address,
                        registryAddress: registry.getAddress(),
                        providerUrl: registry.getAddress() ? undefined : undefined,
                    });
                    // Note: The SimpleRelay contract would need a method to list all subscribers
                    // or active public keys. Without such a method, this approach is limited.
                    // You might need to implement event listeners for subscription events
                    // and build a cache of public keys from those events.
                    // Example (pseudo-code) if your contract had such functionality:
                    // const activeKeys = await simpleRelay.getActivePublicKeys();
                    // for (const keyData of activeKeys) {
                    //   pubKeys.push({
                    //     relayAddress: relay.address,
                    //     relayUrl: relay.url,
                    //     pubKey: keyData.pubKey,
                    //     userAddress: keyData.user,
                    //     expires: keyData.expires
                    //   });
                    // }
                }
                catch (error) {
                    console.error(`Error processing relay ${relay.address}:`, error);
                }
            }
        }
        // Group public keys
        const groupedPubKeys = {};
        for (const entry of pubKeys) {
            if (!groupedPubKeys[entry.pubKey]) {
                groupedPubKeys[entry.pubKey] = {
                    pubKey: entry.pubKey,
                    relays: [],
                };
            }
            groupedPubKeys[entry.pubKey].relays.push({
                relayAddress: entry.relayAddress,
                relayUrl: entry.relayUrl,
                userAddress: entry.userAddress,
                expires: entry.expires,
            });
        }
        return groupedPubKeys;
    }
    catch (error) {
        console.error("Failed to fetch registered public keys:", error);
        return {};
    }
}
/**
 * Ottieni la cronologia delle sottoscrizioni nel periodo specificato
 * @param entryPoint - Istanza di EntryPoint
 * @param timeframe - Periodo di tempo ('day', 'week', 'month')
 * @returns Array di oggetti con date e conteggio sottoscrizioni
 */
async function getSubscriptionHistory(entryPoint, timeframe = "month") {
    try {
        // Questa implementazione è un mock che simula dati di sottoscrizioni nel tempo
        // In un'implementazione reale, dovresti ottenere i dati effettivi dal contratto o da un database
        const now = new Date();
        const result = [];
        let daysToGenerate;
        switch (timeframe) {
            case "day":
                daysToGenerate = 24; // Per un giorno, generiamo dati orari
                for (let i = 0; i < daysToGenerate; i++) {
                    const date = new Date(now);
                    date.setHours(date.getHours() - i);
                    result.push({
                        date: date.toISOString(),
                        // Generazione di numeri casuali per simulare i dati
                        count: Math.floor(Math.random() * 10) + 1,
                    });
                }
                break;
            case "week":
                daysToGenerate = 7;
                for (let i = 0; i < daysToGenerate; i++) {
                    const date = new Date(now);
                    date.setDate(date.getDate() - i);
                    result.push({
                        date: date.toISOString().split("T")[0],
                        count: Math.floor(Math.random() * 25) + 5,
                    });
                }
                break;
            case "month":
            default:
                daysToGenerate = 30;
                for (let i = 0; i < daysToGenerate; i++) {
                    const date = new Date(now);
                    date.setDate(date.getDate() - i);
                    result.push({
                        date: date.toISOString().split("T")[0],
                        count: Math.floor(Math.random() * 50) + 10,
                    });
                }
                break;
        }
        // In un'implementazione reale, potresti utilizzare i log degli eventi di sottoscrizione dal contratto
        // per compilare questi dati, o mantenere un database con queste informazioni aggiornate in tempo reale
        // Ordina per data
        return result.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    }
    catch (error) {
        console.error("Failed to fetch subscription history:", error);
        return [];
    }
}
/**
 * Ottieni le metriche di performance di un relay
 * @param registry - Istanza di Registry
 * @param relayAddress - Indirizzo del relay
 * @returns Oggetto con metriche di performance
 */
async function getRelayPerformance(registry, relayAddress) {
    try {
        // Verifica che il relay esista e sia attivo
        const isRegistered = await registry.isRegisteredRelay(relayAddress);
        if (!isRegistered) {
            throw new Error(`Relay ${relayAddress} non è registrato`);
        }
        const relayInfo = await registry.getRelayInfo(relayAddress);
        if (!relayInfo) {
            throw new Error(`Impossibile ottenere informazioni per il relay ${relayAddress}`);
        }
        // In un'implementazione reale, qui potresti fare una richiesta al relay
        // per misurare il tempo di risposta e altri parametri
        // Per ora, generiamo dati di esempio
        // Mock dei dati di performance
        const performance = {
            uptime: relayInfo.active ? Math.random() * 5 + 95 : 0, // 95-100% se attivo, 0% se inattivo
            responseTime: Math.floor(Math.random() * 500) + 50, // 50-550ms
            successRate: relayInfo.active ? Math.random() * 10 + 90 : 0, // 90-100% se attivo, 0% se inattivo
            lastChecked: new Date().toISOString(),
        };
        return performance;
    }
    catch (error) {
        console.error(`Failed to fetch performance for relay ${relayAddress}:`, error);
        // Restituisci valori di default in caso di errore
        return {
            uptime: 0,
            responseTime: 0,
            successRate: 0,
            lastChecked: new Date().toISOString(),
        };
    }
}
/**
 * Ottiene un riepilogo di tutte le informazioni della rete relay
 * @param registry - Istanza di Registry
 * @param entryPoint - Istanza di EntryPoint
 * @returns Oggetto con statistiche di rete
 */
async function getNetworkSummary(registry, entryPoint) {
    try {
        // Ottieni tutti i relay
        const relaysPaginated = await registry.getAllRelays(false, 0, 1000);
        if (!relaysPaginated) {
            throw new Error("Impossibile ottenere l'elenco dei relay");
        }
        // Conta i relay attivi
        let activeRelays = 0;
        for (const relayAddress of relaysPaginated.relays) {
            const isActive = await registry.isRelayActive(relayAddress);
            if (isActive) {
                activeRelays++;
            }
        }
        // Ottieni le statistiche dal contratto EntryPoint
        const stats = await entryPoint.getStatistics();
        // Calcola il prezzo medio (questo è un mock - in un'implementazione reale dovresti
        // ottenere i prezzi effettivi dai contratti SimpleRelay)
        let totalPrice = ethers_1.ethers.parseEther("0");
        let relayCount = 0;
        // In un'implementazione reale, dovresti ottenere il prezzo da ogni relay
        // Per ora, simuliamo un prezzo medio
        const averagePrice = ethers_1.ethers.parseEther("0.01");
        return {
            totalRelays: Number(relaysPaginated.total),
            activeRelays,
            totalSubscriptions: stats ? Number(stats.totalSubscriptions) : 0,
            activeSubscriptions: stats ? Number(stats.totalSubscriptions) * 0.7 : 0, // Assumiamo che il 70% sia attivo
            averagePrice: ethers_1.ethers.formatEther(averagePrice),
            totalProcessedAmount: stats
                ? ethers_1.ethers.formatEther(stats.totalAmountProcessed)
                : "0",
            totalFeesCollected: stats
                ? ethers_1.ethers.formatEther(stats.totalFeesCollected)
                : "0",
        };
    }
    catch (error) {
        console.error("Failed to fetch network summary:", error);
        // Restituisci valori di default in caso di errore
        return {
            totalRelays: 0,
            activeRelays: 0,
            totalSubscriptions: 0,
            activeSubscriptions: 0,
            averagePrice: "0",
            totalProcessedAmount: "0",
            totalFeesCollected: "0",
        };
    }
}
/**
 * Iscriviti agli eventi dei relay
 * @param registry - Istanza di Registry
 * @param callback - Funzione di callback da eseguire quando si verifica un evento
 * @returns Funzione per annullare l'iscrizione
 */
function subscribeToRelayEvents(registry, callback) {
    // In un'implementazione reale, dovresti ascoltare gli eventi effettivi dal contratto
    // Questo è un mock che simula eventi periodici per scopi dimostrativi
    // Ascolta l'emitter di eventi
    relayEventEmitter.on("relayEvent", callback);
    // Simula eventi casuali ogni 10 secondi
    const interval = setInterval(() => {
        const eventTypes = Object.values(RelayEventType);
        const randomType = eventTypes[Math.floor(Math.random() * eventTypes.length)];
        const event = {
            type: randomType,
            timestamp: Date.now(),
            relayAddress: `0x${Math.random().toString(16).substring(2, 42)}`,
            userAddress: randomType.includes("Subscription")
                ? `0x${Math.random().toString(16).substring(2, 42)}`
                : undefined,
            transactionHash: `0x${Math.random().toString(16).substring(2, 66)}`,
        };
        relayEventEmitter.emit("relayEvent", event);
    }, 10000);
    // Restituisci una funzione per annullare l'iscrizione e fermare la simulazione
    return () => {
        clearInterval(interval);
        relayEventEmitter.removeListener("relayEvent", callback);
    };
}
/**
 * Ottieni dati per grafici relativi all'utilizzo dei relay
 * @param entryPoint - Istanza di EntryPoint
 * @param metric - Metrica da visualizzare ('subscriptions', 'revenue', 'users')
 * @param period - Periodo di tempo ('daily', 'weekly', 'monthly')
 * @returns Dati formattati per grafici
 */
async function getUsageDataForChart(entryPoint, metric, period) {
    try {
        // Questa è un'implementazione mock che genera dati casuali
        // In un'implementazione reale, dovresti ottenere i dati effettivi dal contratto o da un database
        const now = new Date();
        const dataPoints = [];
        let daysToGenerate = 0;
        let title = "";
        let description = "";
        // Configura il periodo
        switch (period) {
            case "daily":
                daysToGenerate = 24;
                break;
            case "weekly":
                daysToGenerate = 7;
                break;
            case "monthly":
            default:
                daysToGenerate = 30;
                break;
        }
        // Genera dati in base alla metrica
        for (let i = 0; i < daysToGenerate; i++) {
            const date = new Date(now);
            if (period === "daily") {
                date.setHours(date.getHours() - i);
                const label = `${date.getHours()}:00`;
                let value = 0;
                switch (metric) {
                    case "subscriptions":
                        value = Math.floor(Math.random() * 15) + 1;
                        break;
                    case "revenue":
                        value = Math.random() * 0.5 + 0.1; // 0.1-0.6 ETH
                        break;
                    case "users":
                        value = Math.floor(Math.random() * 20) + 5;
                        break;
                }
                dataPoints.push({ label, value });
            }
            else {
                date.setDate(date.getDate() - i);
                const label = date.toISOString().split("T")[0];
                let value = 0;
                switch (metric) {
                    case "subscriptions":
                        value = Math.floor(Math.random() * 50) + 10;
                        break;
                    case "revenue":
                        value = Math.random() * 2 + 0.5; // 0.5-2.5 ETH
                        break;
                    case "users":
                        value = Math.floor(Math.random() * 100) + 20;
                        break;
                }
                dataPoints.push({ label, value });
            }
        }
        // Configura titolo e descrizione
        switch (metric) {
            case "subscriptions":
                title = "Sottoscrizioni";
                description = `Numero di sottoscrizioni ${period === "daily" ? "giornaliere" : period === "weekly" ? "settimanali" : "mensili"}`;
                break;
            case "revenue":
                title = "Ricavi";
                description = `Ricavi ${period === "daily" ? "giornalieri" : period === "weekly" ? "settimanali" : "mensili"} in ETH`;
                break;
            case "users":
                title = "Utenti";
                description = `Numero di utenti attivi ${period === "daily" ? "giornalieri" : period === "weekly" ? "settimanali" : "mensili"}`;
                break;
        }
        // Ordina per data
        const sortedDataPoints = dataPoints.sort((a, b) => {
            if (period === "daily") {
                return (parseInt(a.label.split(":")[0]) - parseInt(b.label.split(":")[0]));
            }
            else {
                return new Date(a.label).getTime() - new Date(b.label).getTime();
            }
        });
        return {
            dataPoints: sortedDataPoints,
            title,
            description,
        };
    }
    catch (error) {
        console.error(`Failed to fetch chart data for ${metric}:`, error);
        return {
            dataPoints: [],
            title: "Errore",
            description: "Impossibile caricare i dati",
        };
    }
}
/**
 * Create a combined relay verifier that can check public key authorization across all contract types
 */
class RelayVerifier {
    registry = null;
    entryPoint = null;
    simpleRelay = null;
    /**
     * Create a new RelayVerifier
     * @param registry - Optional Registry instance
     * @param entryPoint - Optional EntryPoint instance
     * @param simpleRelay - Optional SimpleRelay instance
     */
    constructor(registry, entryPoint, simpleRelay) {
        this.registry = registry ?? null;
        this.entryPoint = entryPoint ?? null;
        this.simpleRelay = simpleRelay ?? null;
    }
    /**
     * Check if a public key is authorized (subscribed) to any relay
     * @param registryAddress - The address of the registry (or any value if checking directly)
     * @param pubKey - The public key to check (hex string or Uint8Array)
     * @returns True if the public key is authorized, false otherwise
     */
    async isPublicKeyAuthorized(registryAddress, pubKey) {
        try {
            // First try simpleRelay if available (most direct)
            if (this.simpleRelay) {
                try {
                    const isSubscribed = await this.simpleRelay.isSubscribed(pubKey);
                    if (isSubscribed)
                        return true;
                }
                catch (error) {
                    (0, logger_1.logError)("Error checking SimpleRelay subscription:", error);
                }
            }
            // Then try entryPoint for protocol-mode relays
            if (this.entryPoint && this.registry) {
                try {
                    // Get all relays from registry
                    const relaysPage = await this.registry.getAllRelays(true, 0, 100);
                    if (relaysPage && relaysPage.relays && relaysPage.relays.length > 0) {
                        // Check each relay via entryPoint
                        for (const relayAddress of relaysPage.relays) {
                            const isPubKeySubscribed = await this.entryPoint.isPubKeySubscribed(relayAddress, pubKey);
                            if (isPubKeySubscribed)
                                return true;
                        }
                    }
                }
                catch (error) {
                    (0, logger_1.logError)("Error checking EntryPoint subscriptions:", error);
                }
            }
            return false;
        }
        catch (error) {
            errorHandler_1.ErrorHandler.handle(errorHandler_1.ErrorType.CONTRACT, "RELAY_VERIFIER_ERROR", "Error in isPublicKeyAuthorized check", error);
            return false;
        }
    }
    /**
     * Check if a user is subscribed to a specific relay
     * @param relayAddress - The address of the relay
     * @param pubKey - The public key to check (hex string or Uint8Array)
     * @returns True if the user is subscribed, false otherwise
     */
    async isUserSubscribedToRelay(relayAddress, pubKey) {
        try {
            // If we have the individual relay, check directly
            if (this.simpleRelay && this.simpleRelay.getAddress() === relayAddress) {
                return await this.simpleRelay.isSubscribed(pubKey);
            }
            // Otherwise try via EntryPoint
            if (this.entryPoint) {
                return await this.entryPoint.isPubKeySubscribed(relayAddress, pubKey);
            }
            return false;
        }
        catch (error) {
            errorHandler_1.ErrorHandler.handle(errorHandler_1.ErrorType.CONTRACT, "RELAY_VERIFIER_ERROR", `Error checking subscription to relay ${relayAddress}`, error);
            return false;
        }
    }
    /**
     * Get all relays from registry
     * @param onlyActive - If true, only return active relays
     * @param offset - Starting index for pagination
     * @param limit - Maximum number of items to return
     * @returns Array of relay addresses
     */
    async getAllRelays(onlyActive = true, offset = 0, limit = 100) {
        try {
            if (!this.registry) {
                return [];
            }
            const relaysPage = await this.registry.getAllRelays(onlyActive, offset, limit);
            return relaysPage?.relays || [];
        }
        catch (error) {
            errorHandler_1.ErrorHandler.handle(errorHandler_1.ErrorType.CONTRACT, "RELAY_VERIFIER_ERROR", "Error getting all relays", error);
            return [];
        }
    }
    /**
     * Set registry instance
     * @param registry - The Registry instance
     */
    setRegistry(registry) {
        this.registry = registry;
    }
    /**
     * Set entryPoint instance
     * @param entryPoint - The EntryPoint instance
     */
    setEntryPoint(entryPoint) {
        this.entryPoint = entryPoint;
    }
    /**
     * Set simpleRelay instance
     * @param simpleRelay - The SimpleRelay instance
     */
    setSimpleRelay(simpleRelay) {
        this.simpleRelay = simpleRelay;
    }
}
exports.RelayVerifier = RelayVerifier;
