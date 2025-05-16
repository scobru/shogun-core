/**
 * Relay module - Provides interaction with the Shogun Protocol Relay system
 */

// Export all relay SDK components

// Contract interfaces and ABIs
export * from "./base";

// Registry functionality
export * from "./registry";

// SimpleRelay functionality
export * from "./relay";

// EntryPoint functionality
export * from "./entryPoint";

export { EntryPoint } from "./entryPoint";
export type { EntryPointConfig } from "./entryPoint";
export { Registry } from "./registry";
export type { RegistryConfig } from "./registry";
export { SimpleRelay } from "./relay";
export type { SimpleRelayConfig, SubscriptionInfo } from "./relay";
export type {
  RelayInfo,
  RelayPage,
  RelayConfig,
  BaseContract,
  ContractConfig,
  SubscriptionDetails,
} from "./base";
export {
  getRelayUrls,
  getRegisteredPubKeys,
  getSubscriptionHistory,
  getRelayPerformance,
  getNetworkSummary,
  subscribeToRelayEvents,
  getUsageDataForChart,
  RelayEventType,
} from "./utils";
export type {
  RegisteredPubKey,
  GroupedPubKeys,
  RelayPerformance,
  NetworkSummary,
  ChartDataPoint,
  ChartData,
  RelayEvent,
} from "./utils";
