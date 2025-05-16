/**
 * Shogun Protocol Contracts SDK
 * This file provides interfaces and ABIs for interacting with the Shogun Protocol smart contracts
 */

import { ethers } from "ethers";
import { ErrorHandler, ErrorType } from "../utils/errorHandler";
import { log, logError } from "../utils/logger";

// ABI for the Registry contract
const REGISTRY_ABI = [
  // Read functions
  "function isRegisteredRelay(address _relayAddress) external view returns (bool)",
  "function isRelayActive(address _relayAddress) external view returns (bool)",
  "function findRelayByUrl(string calldata _url) external view returns (address)",
  "function getRelayInfo(address _relayAddress) external view returns (address owner, string memory url, string memory metadata, uint256 registrationTime, bool active)",
  "function getRelayCountByOwner(address _owner) external view returns (uint256)",
  "function getRelaysByOwner(address _owner, uint256 _offset, uint256 _limit) external view returns (tuple(address[] relays, uint256 total, uint256 offset, uint256 limit))",
  "function getAllRelays(bool _onlyActive, uint256 _offset, uint256 _limit) external view returns (tuple(address[] relays, uint256 total, uint256 offset, uint256 limit))",

  // Write functions
  "function registerRelay(address _relayAddress, string calldata _url, string calldata _metadata) external",
  "function updateRelay(address _relayAddress, string calldata _newUrl, string calldata _newMetadata) external",
  "function deactivateRelay(address _relayAddress) external",
  "function reactivateRelay(address _relayAddress) external",
  "function setRegistrationOpen(bool _isOpen) external",
];

// ABI for the SimpleRelay contract
const SIMPLE_RELAY_ABI = [
  // Read functions
  "function isSubscriptionActive(address _user) external view returns (bool)",
  "function getUserSubscriptionInfo(address _user) external view returns (uint256 expires, bytes memory pubKey)",
  "function isAuthorizedByPubKey(bytes calldata _pubKey) external view returns (bool)",
  "function isSubscribed(bytes calldata _pubKey) external view returns (bool)",
  "function pricePerMonth() external view returns (uint256)",
  "function daysPerMonth() external view returns (uint256)",
  "function relayUrl() external view returns (string)",
  "function getRelayOperationalConfig() external view returns (string memory _url, uint256 _price, uint256 _daysInMonth)",

  // Protocol Integration functions
  "function mode() external view returns (uint8)",
  "function registryAddress() external view returns (address)",
  "function entryPointAddress() external view returns (address)",
  "function isRegisteredInRegistry() external view returns (bool)",
  "function getRelayMode() external view returns (uint8 _mode, address _registry, address _entryPoint, bool _isRegistered)",

  // Protocol Integration write functions
  "function setRegistry(address _registryAddress, bool _autoRegister, string calldata _metadata) external",
  "function setEntryPoint(address _entryPointAddress, bool _enableProtocolMode) external",
  "function setOperatingMode(uint8 _newMode) external",
  "function registerInRegistry(string calldata _metadata) external",

  // Write functions
  "function subscribe(uint256 _months, bytes calldata _pubKey) external payable",
  "function setPrice(uint256 _newPrice) external",
  "function setDaysPerMonth(uint256 _days) external",
  "function updateRelayUrl(string calldata _newUrl) external",
  "function withdrawFunds() external",
  "function decommissionAndWithdrawAllFunds() external",
  "function execute(address _to, uint256 _value, bytes calldata _data) external returns (bool success, bytes memory result)",
];

// ABI for the EntryPoint contract
const ENTRY_POINT_ABI = [
  // Read functions
  "function registry() external view returns (address)",
  "function serviceFeePercentage() external view returns (uint256)",
  "function calculateFee(uint256 _amount) external view returns (uint256)",
  "function checkSubscription(address _user, address _relayAddress) external view returns (bool)",
  "function hasRegisteredPubKey(address _user, address _relayAddress) external view returns (bool)",
  "function isPubKeySubscribed(address _relayAddress, bytes calldata _pubKey) external view returns (bool)",
  "function batchCheckPubKeySubscription(address[] calldata _relayAddresses, bytes[] calldata _pubKeys) external view returns (bool[] memory)",
  "function getSubscriptionDetails(address _user, address _relayAddress) external view returns (uint256 expires, bytes memory pubKey)",
  "function batchCheckSubscriptions(address _user, address[] calldata _relayAddresses) external view returns (bool[] memory)",
  "function batchCheckPubKeys(address _user, address[] calldata _relayAddresses) external view returns (bool[] memory)",
  "function getStatistics() external view returns (uint256 _userCount, uint256 _totalSubscriptions, uint256 _totalViaUrl, uint256 _totalViaDirect, uint256 _totalAmountProcessed, uint256 _totalFeesCollected, uint256 _currentBalance)",

  // Write functions
  "function subscribeViaUrl(string calldata _relayUrl, uint256 _months, bytes calldata _pubKey) external payable",
  "function subscribeDirect(address _relayAddress, uint256 _months, bytes calldata _pubKey) external payable",
  "function batchSubscribe(address[] calldata _relayAddresses, uint256 _months, bytes[] calldata _pubKeys) external payable",
  "function updateRegistry(address _newRegistry) external",
  "function updateServiceFee(uint256 _newFeePercentage) external",
  "function withdrawFees() external",
];

// Interface types
export interface RelayInfo {
  owner: string;
  url: string;
  metadata: string;
  registrationTime: bigint;
  active: boolean;
}

export interface RelayPage {
  relays: string[];
  total: bigint;
  offset: bigint;
  limit: bigint;
}

export interface SubscriptionDetails {
  expires: bigint;
  pubKey: string;
}

export interface RelayConfig {
  url: string;
  price: bigint;
  daysInMonth: bigint;
}

// Enum for Relay operating mode
export enum RelayOperatingMode {
  SINGLE = 0,
  PROTOCOL = 1,
}

// Interface for relay mode information
export interface RelayModeInfo {
  mode: RelayOperatingMode;
  registryAddress: string;
  entryPointAddress: string;
  isRegistered: boolean;
}

export interface EntryPointStats {
  userCount: bigint;
  totalSubscriptions: bigint;
  totalViaUrl: bigint;
  totalViaDirect: bigint;
  totalAmountProcessed: bigint;
  totalFeesCollected: bigint;
  currentBalance: bigint;
}

// Contract interaction configuration
export interface ContractConfig {
  providerUrl?: string;
  provider?: ethers.Provider;
  signer?: ethers.Signer;
  registryAddress: string;
  entryPointAddress?: string;
}

// Base class for contract interactions
abstract class BaseContract {
  protected provider: ethers.Provider | null = null;
  protected signer: ethers.Signer | null = null;
  protected contract: ethers.Contract | null = null;
  protected contractAddress: string;

  constructor(address: string, abi: string[], config: ContractConfig) {
    this.contractAddress = address;

    // Setup provider
    if (config.provider) {
      this.provider = config.provider;
    } else if (config.providerUrl) {
      this.provider = new ethers.JsonRpcProvider(config.providerUrl);
    }

    // Setup signer
    this.signer = config.signer || null;

    // Initialize contract
    if (!this.provider) {
      logError("No provider available for contract initialization");
      return;
    }

    try {
      if (this.signer) {
        this.contract = new ethers.Contract(address, abi, this.signer);
      } else {
        this.contract = new ethers.Contract(address, abi, this.provider);
      }
    } catch (error) {
      ErrorHandler.handle(
        ErrorType.CONTRACT,
        "CONTRACT_INIT_FAILED",
        `Failed to initialize contract at ${address}`,
        error,
      );
    }
  }

  /**
   * Set a new provider
   * @param provider - The new provider
   */
  setProvider(provider: ethers.Provider): void {
    this.provider = provider;
    if (this.contract) {
      this.contract = this.contract.connect(provider) as ethers.Contract;
    }
  }

  /**
   * Set a new signer
   * @param signer - The new signer
   */
  setSigner(signer: ethers.Signer): void {
    this.signer = signer;
    if (this.contract && this.signer) {
      this.contract = this.contract.connect(signer) as ethers.Contract;
    }
  }

  /**
   * Get the contract address
   * @returns The contract address
   */
  getAddress(): string {
    return this.contractAddress;
  }
}

/**
 * Export all the ABIs and interfaces for use in other modules
 */
export { REGISTRY_ABI, SIMPLE_RELAY_ABI, ENTRY_POINT_ABI, BaseContract };
