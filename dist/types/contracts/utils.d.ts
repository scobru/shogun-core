/**
 * Utility functions for working with the relay system
 */
import { Registry } from "./registry";
import { SimpleRelay } from "./relay";
import { EntryPoint } from "./entryPoint";
export interface RegisteredPubKey {
    relayAddress: string;
    relayUrl: string;
    pubKey: string;
    userAddress?: string;
    expires?: bigint;
}
export interface GroupedPubKeys {
    [pubKey: string]: {
        pubKey: string;
        relays: {
            relayAddress: string;
            relayUrl: string;
            userAddress?: string;
            expires?: bigint;
        }[];
    };
}
export interface RelayPerformance {
    uptime: number;
    responseTime: number;
    successRate: number;
    lastChecked: string;
}
export interface NetworkSummary {
    totalRelays: number;
    activeRelays: number;
    totalSubscriptions: number;
    activeSubscriptions: number;
    averagePrice: string;
    totalProcessedAmount: string;
    totalFeesCollected: string;
}
export interface ChartDataPoint {
    label: string;
    value: number;
}
export interface ChartData {
    dataPoints: ChartDataPoint[];
    title: string;
    description: string;
}
export declare enum RelayEventType {
    NEW_SUBSCRIPTION = "newSubscription",
    SUBSCRIPTION_EXPIRED = "subscriptionExpired",
    RELAY_REGISTERED = "relayRegistered",
    RELAY_DEACTIVATED = "relayDeactivated",
    RELAY_REACTIVATED = "relayReactivated"
}
export interface RelayEvent {
    type: RelayEventType;
    timestamp: number;
    relayAddress?: string;
    userAddress?: string;
    transactionHash?: string;
    data?: any;
}
/**
 * Fetch all relay URLs from the registry
 * @param registry - Registry instance
 * @param onlyActive - Whether to only fetch active relays (default: true)
 * @returns Array of relay URLs and addresses
 */
export declare function getRelayUrls(registry: Registry, onlyActive?: boolean): Promise<Array<{
    url: string;
    address: string;
}>>;
/**
 * Retrieve all public keys registered in relays and group them
 * @param registry - Registry instance
 * @param entryPoint - EntryPoint instance
 * @param userAddresses - Optional list of user addresses to check
 * @param onlyActive - Whether to only fetch active relays (default: true)
 * @returns Grouped public keys with their associated relays
 */
export declare function getRegisteredPubKeys(registry: Registry, entryPoint: EntryPoint, userAddresses?: string[], onlyActive?: boolean): Promise<GroupedPubKeys>;
/**
 * Ottieni la cronologia delle sottoscrizioni nel periodo specificato
 * @param entryPoint - Istanza di EntryPoint
 * @param timeframe - Periodo di tempo ('day', 'week', 'month')
 * @returns Array di oggetti con date e conteggio sottoscrizioni
 */
export declare function getSubscriptionHistory(entryPoint: EntryPoint, timeframe?: "day" | "week" | "month"): Promise<Array<{
    date: string;
    count: number;
}>>;
/**
 * Ottieni le metriche di performance di un relay
 * @param registry - Istanza di Registry
 * @param relayAddress - Indirizzo del relay
 * @returns Oggetto con metriche di performance
 */
export declare function getRelayPerformance(registry: Registry, relayAddress: string): Promise<RelayPerformance>;
/**
 * Ottiene un riepilogo di tutte le informazioni della rete relay
 * @param registry - Istanza di Registry
 * @param entryPoint - Istanza di EntryPoint
 * @returns Oggetto con statistiche di rete
 */
export declare function getNetworkSummary(registry: Registry, entryPoint: EntryPoint): Promise<NetworkSummary>;
/**
 * Iscriviti agli eventi dei relay
 * @param registry - Istanza di Registry
 * @param callback - Funzione di callback da eseguire quando si verifica un evento
 * @returns Funzione per annullare l'iscrizione
 */
export declare function subscribeToRelayEvents(registry: Registry, callback: (event: RelayEvent) => void): () => void;
/**
 * Ottieni dati per grafici relativi all'utilizzo dei relay
 * @param entryPoint - Istanza di EntryPoint
 * @param metric - Metrica da visualizzare ('subscriptions', 'revenue', 'users')
 * @param period - Periodo di tempo ('daily', 'weekly', 'monthly')
 * @returns Dati formattati per grafici
 */
export declare function getUsageDataForChart(entryPoint: EntryPoint, metric: "subscriptions" | "revenue" | "users", period: "daily" | "weekly" | "monthly"): Promise<ChartData>;
/**
 * Create a combined relay verifier that can check public key authorization across all contract types
 */
export declare class RelayVerifier {
    private registry;
    private entryPoint;
    private simpleRelay;
    /**
     * Create a new RelayVerifier
     * @param registry - Optional Registry instance
     * @param entryPoint - Optional EntryPoint instance
     * @param simpleRelay - Optional SimpleRelay instance
     */
    constructor(registry?: Registry, entryPoint?: EntryPoint, simpleRelay?: SimpleRelay);
    /**
     * Check if a public key is authorized (subscribed) to any relay
     * @param registryAddress - The address of the registry (or any value if checking directly)
     * @param pubKey - The public key to check (hex string or Uint8Array)
     * @returns True if the public key is authorized, false otherwise
     */
    isPublicKeyAuthorized(registryAddress: string, pubKey: string | Uint8Array): Promise<boolean>;
    /**
     * Check if a user is subscribed to a specific relay
     * @param relayAddress - The address of the relay
     * @param pubKey - The public key to check (hex string or Uint8Array)
     * @returns True if the user is subscribed, false otherwise
     */
    isUserSubscribedToRelay(relayAddress: string, pubKey: string | Uint8Array): Promise<boolean>;
    /**
     * Get all relays from registry
     * @param onlyActive - If true, only return active relays
     * @param offset - Starting index for pagination
     * @param limit - Maximum number of items to return
     * @returns Array of relay addresses
     */
    getAllRelays(onlyActive?: boolean, offset?: number, limit?: number): Promise<string[]>;
    /**
     * Set registry instance
     * @param registry - The Registry instance
     */
    setRegistry(registry: Registry): void;
    /**
     * Set entryPoint instance
     * @param entryPoint - The EntryPoint instance
     */
    setEntryPoint(entryPoint: EntryPoint): void;
    /**
     * Set simpleRelay instance
     * @param simpleRelay - The SimpleRelay instance
     */
    setSimpleRelay(simpleRelay: SimpleRelay): void;
}
