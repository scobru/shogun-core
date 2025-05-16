"use strict";
/**
 * Shogun Protocol Contracts SDK
 * This file provides interfaces and ABIs for interacting with the Shogun Protocol smart contracts
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseContract = exports.ENTRY_POINT_ABI = exports.SIMPLE_RELAY_ABI = exports.REGISTRY_ABI = exports.RelayOperatingMode = void 0;
const ethers_1 = require("ethers");
const errorHandler_1 = require("../utils/errorHandler");
const logger_1 = require("../utils/logger");
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
exports.REGISTRY_ABI = REGISTRY_ABI;
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
exports.SIMPLE_RELAY_ABI = SIMPLE_RELAY_ABI;
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
exports.ENTRY_POINT_ABI = ENTRY_POINT_ABI;
// Enum for Relay operating mode
var RelayOperatingMode;
(function (RelayOperatingMode) {
    RelayOperatingMode[RelayOperatingMode["SINGLE"] = 0] = "SINGLE";
    RelayOperatingMode[RelayOperatingMode["PROTOCOL"] = 1] = "PROTOCOL";
})(RelayOperatingMode || (exports.RelayOperatingMode = RelayOperatingMode = {}));
// Base class for contract interactions
class BaseContract {
    provider = null;
    signer = null;
    contract = null;
    contractAddress;
    constructor(address, abi, config) {
        this.contractAddress = address;
        // Setup provider
        if (config.provider) {
            this.provider = config.provider;
        }
        else if (config.providerUrl) {
            this.provider = new ethers_1.ethers.JsonRpcProvider(config.providerUrl);
        }
        // Setup signer
        this.signer = config.signer || null;
        // Initialize contract
        if (!this.provider) {
            (0, logger_1.logError)("No provider available for contract initialization");
            return;
        }
        try {
            if (this.signer) {
                this.contract = new ethers_1.ethers.Contract(address, abi, this.signer);
            }
            else {
                this.contract = new ethers_1.ethers.Contract(address, abi, this.provider);
            }
        }
        catch (error) {
            errorHandler_1.ErrorHandler.handle(errorHandler_1.ErrorType.CONTRACT, "CONTRACT_INIT_FAILED", `Failed to initialize contract at ${address}`, error);
        }
    }
    /**
     * Set a new provider
     * @param provider - The new provider
     */
    setProvider(provider) {
        this.provider = provider;
        if (this.contract) {
            this.contract = this.contract.connect(provider);
        }
    }
    /**
     * Set a new signer
     * @param signer - The new signer
     */
    setSigner(signer) {
        this.signer = signer;
        if (this.contract && this.signer) {
            this.contract = this.contract.connect(signer);
        }
    }
    /**
     * Get the contract address
     * @returns The contract address
     */
    getAddress() {
        return this.contractAddress;
    }
}
exports.BaseContract = BaseContract;
