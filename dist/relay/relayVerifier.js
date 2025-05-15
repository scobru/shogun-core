"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RelayVerifier = void 0;
const ethers_1 = require("ethers");
const errorHandler_1 = require("../utils/errorHandler");
const logger_1 = require("../utils/logger");
// ABI for the RelayRegistry contract
const RELAY_REGISTRY_ABI = [
    "function getRelayDetails(address _relayContractAddress) external view returns (address owner_, string memory url_, uint256 subscribers_, uint256 pendingRewards_, uint256 stake_, uint256 stakePercentage_)",
    "function getAllRelayContracts() external view returns (address[] memory)",
    "function getRelayCount() external view returns (uint256)",
    "function isRegistered(address _relayContractAddress) external view returns (bool)",
    "function isUserSubscribedToRelay(address _relayContractAddress, address _user) external view returns (bool)",
    "function subscribeToRelay(address _relayContractAddress, uint256 _months, bytes calldata _pubKey) external payable",
    "function getRelaySubscriptionPrice() external view returns (uint256)",
    "function getProtocolPrice() external view returns (uint256)",
    "function getUserActiveRelays(address _user) external view returns (address[] memory)",
    "function getSystemStats() external view returns (uint256 totalRelays_, uint256 totalStakedAmount_, uint256 totalSubscribers_, uint256 totalFeesAccumulated_, uint256 totalRewardsDistributed_)",
    "function distributeRewards() external",
    "function isDistributionDue() external view returns (bool)",
    "function protocolPrice() external view returns (uint256)",
    "function protocolFeePercentage() external view returns (uint256)",
    "function minStakeRequired() external view returns (uint256)",
    "function totalStaked() external view returns (uint256)",
];
// ABI for the IndividualRelay contract
const INDIVIDUAL_RELAY_ABI = [
    "function isSubscriptionActive(address _user) external view returns (bool)",
    "function subscribe(uint256 _months, bytes calldata _pubKey) external payable",
    "function getUserSubscriptionInfo(address _user) external view returns (uint256 expires, bytes memory pubKey)",
    "function isAuthorizedByPubKey(bytes calldata _pubKey) external view returns (bool)",
    "function pricePerMonth() external view returns (uint256)",
    "function getRelayOperationalConfig() external view returns (string memory _url, uint256 _price, uint256 _daysInMonth, uint256 _stake)",
    "function getOwner() external view returns (address)",
    "function ownerStake() external view returns (uint256)",
    "function stakeLockPeriod() external view returns (uint256)",
    "function getStakeStatus() external view returns (uint256 currentStake, uint256 lockPeriod, uint256 lockedUntil, bool canWithdraw)",
    "function addStake() external payable",
    "function withdrawStake(uint256 _amount) external",
    "function isRegistered() external view returns (bool)",
];
/**
 * RelayVerifier - A class to interact with the Shogun relay network
 * using the RelayRegistry and IndividualRelay contracts
 */
class RelayVerifier {
    registryContract = null;
    provider = null;
    signer = null;
    registryAddress;
    relayContracts = new Map();
    shogun;
    /**
     * Creates a new RelayVerifier instance
     *
     * @param config Configuration for the relay verifier
     * @param shogun Optional ShogunCore instance to reuse its provider
     * @param signer Optional ethers.Signer instance to use for contract interactions
     */
    constructor(config, shogun, signer) {
        this.registryAddress = config.registryAddress;
        this.shogun = shogun;
        this.signer = signer || null;
        // Setup the provider
        try {
            if (shogun?.provider) {
                // Reuse the provider from ShogunCore if available
                this.provider = shogun.provider;
                (0, logger_1.log)("Using provider from ShogunCore instance");
            }
            else if (config.providerUrl) {
                // Or create a new provider with the provided URL
                this.provider = new ethers_1.ethers.JsonRpcProvider(config.providerUrl);
                (0, logger_1.log)(`Created provider with URL: ${config.providerUrl}`);
            }
            else {
                (0, logger_1.logError)("No provider available. Either pass a ShogunCore instance or providerUrl");
            }
            // Initialize the registry contract if we have a provider
            if (this.signer && this.provider) {
                this.registryContract = new ethers_1.ethers.Contract(this.registryAddress, RELAY_REGISTRY_ABI, this.signer);
                (0, logger_1.log)(`RelayVerifier initialized with signer at registry ${this.registryAddress}`);
            }
            else if (this.provider) {
                this.registryContract = new ethers_1.ethers.Contract(this.registryAddress, RELAY_REGISTRY_ABI, this.provider);
                (0, logger_1.log)(`RelayVerifier initialized in read-only mode at registry ${this.registryAddress}`);
            }
        }
        catch (error) {
            errorHandler_1.ErrorHandler.handle(errorHandler_1.ErrorType.CONTRACT, "RELAY_VERIFIER_INIT_FAILED", "Failed to initialize RelayVerifier", error);
        }
    }
    /**
     * Gets an instance of the IndividualRelay contract
     *
     * @param relayAddress The address of the relay contract
     * @returns The contract instance or null if not found
     */
    async getRelayContract(relayAddress) {
        try {
            // Check if we already have this contract instance
            if (this.relayContracts.has(relayAddress)) {
                return this.relayContracts.get(relayAddress);
            }
            // Verify this is a valid relay contract through the registry
            if (!this.registryContract) {
                throw new Error("Registry contract not initialized");
            }
            const isRegistered = await this.registryContract.isRegistered(relayAddress);
            if (!isRegistered) {
                throw new Error(`Address ${relayAddress} is not a registered relay`);
            }
            // Create and store the contract instance
            const contract = this.signer
                ? new ethers_1.ethers.Contract(relayAddress, INDIVIDUAL_RELAY_ABI, this.signer)
                : new ethers_1.ethers.Contract(relayAddress, INDIVIDUAL_RELAY_ABI, this.provider);
            this.relayContracts.set(relayAddress, contract);
            return contract;
        }
        catch (error) {
            errorHandler_1.ErrorHandler.handle(errorHandler_1.ErrorType.CONTRACT, "RELAY_CONTRACT_INIT_FAILED", `Failed to initialize relay contract at ${relayAddress}`, error);
            return null;
        }
    }
    /**
     * Gets all registered relay contracts from the registry
     *
     * @returns Array of relay contract addresses
     */
    async getAllRelays() {
        try {
            if (!this.registryContract) {
                throw new Error("Registry contract not initialized");
            }
            return await this.registryContract.getAllRelayContracts();
        }
        catch (error) {
            errorHandler_1.ErrorHandler.handle(errorHandler_1.ErrorType.CONTRACT, "GET_ALL_RELAYS_FAILED", "Failed to get all relay contracts", error);
            return [];
        }
    }
    /**
     * Gets detailed information about a relay
     *
     * @param relayAddress The address of the relay to query
     * @returns Detailed relay information or null if not found
     */
    async getRelayInfo(relayAddress) {
        try {
            if (!this.registryContract) {
                throw new Error("Registry contract not initialized");
            }
            const relayContract = await this.getRelayContract(relayAddress);
            if (!relayContract) {
                throw new Error(`Failed to get relay contract at ${relayAddress}`);
            }
            // Get details from registry (now includes more information)
            const [owner, url, subscribers, pendingRewards, stake, stakePercentage] = await this.registryContract.getRelayDetails(relayAddress);
            // Get additional details from the relay contract
            const [_url, price, daysPerMonth, _stake] = await relayContract.getRelayOperationalConfig();
            return {
                address: relayAddress,
                owner,
                url,
                price,
                daysPerMonth,
                stake,
                subscribers,
                pendingRewards,
                stakePercentage,
            };
        }
        catch (error) {
            errorHandler_1.ErrorHandler.handle(errorHandler_1.ErrorType.CONTRACT, "GET_RELAY_INFO_FAILED", `Failed to get relay info for ${relayAddress}`, error);
            return null;
        }
    }
    /**
     * Gets all relays a user is actively subscribed to
     *
     * @param userAddress The Ethereum address to check
     * @returns Array of relay addresses the user is subscribed to
     */
    async getUserActiveRelays(userAddress) {
        try {
            if (!this.registryContract) {
                throw new Error("Registry contract not initialized");
            }
            if (!ethers_1.ethers.isAddress(userAddress)) {
                throw new Error("Invalid Ethereum address format");
            }
            return await this.registryContract.getUserActiveRelays(userAddress);
        }
        catch (error) {
            errorHandler_1.ErrorHandler.handle(errorHandler_1.ErrorType.CONTRACT, "GET_USER_ACTIVE_RELAYS_FAILED", `Failed to get active relays for user ${userAddress}`, error);
            return [];
        }
    }
    /**
     * Gets the stake information for a relay
     *
     * @param relayAddress The relay contract address
     * @returns Stake information or null if failed
     */
    async getStakeInfo(relayAddress) {
        try {
            const relayContract = await this.getRelayContract(relayAddress);
            if (!relayContract) {
                throw new Error(`Failed to get relay contract at ${relayAddress}`);
            }
            const [currentStake, lockPeriod, lockedUntil, canWithdraw] = await relayContract.getStakeStatus();
            return {
                currentStake,
                lockPeriod,
                lockedUntil,
                canWithdraw,
            };
        }
        catch (error) {
            errorHandler_1.ErrorHandler.handle(errorHandler_1.ErrorType.CONTRACT, "GET_STAKE_INFO_FAILED", `Failed to get stake info for relay ${relayAddress}`, error);
            return null;
        }
    }
    /**
     * Gets system-wide statistics from the relay registry
     *
     * @returns System statistics or null if failed
     */
    async getSystemStats() {
        try {
            if (!this.registryContract) {
                throw new Error("Registry contract not initialized");
            }
            const [totalRelays, totalStakedAmount, totalSubscribers, totalFeesAccumulated, totalRewardsDistributed,] = await this.registryContract.getSystemStats();
            return {
                totalRelays: Number(totalRelays),
                totalStakedAmount,
                totalSubscribers: Number(totalSubscribers),
                totalFeesAccumulated,
                totalRewardsDistributed,
            };
        }
        catch (error) {
            errorHandler_1.ErrorHandler.handle(errorHandler_1.ErrorType.CONTRACT, "GET_SYSTEM_STATS_FAILED", "Failed to get system statistics", error);
            return null;
        }
    }
    /**
     * Checks if a user is subscribed to a specific relay
     *
     * @param relayAddress The relay contract address to check
     * @param userAddress The user's Ethereum address
     * @returns True if the user is subscribed, false otherwise
     */
    async isUserSubscribedToRelay(relayAddress, userAddress) {
        try {
            if (!this.registryContract) {
                throw new Error("Registry contract not initialized");
            }
            if (!ethers_1.ethers.isAddress(userAddress) || !ethers_1.ethers.isAddress(relayAddress)) {
                throw new Error("Invalid address format");
            }
            return await this.registryContract.isUserSubscribedToRelay(relayAddress, userAddress);
        }
        catch (error) {
            errorHandler_1.ErrorHandler.handle(errorHandler_1.ErrorType.CONTRACT, "USER_SUBSCRIPTION_CHECK_FAILED", `Failed to check subscription for user ${userAddress} to relay ${relayAddress}`, error);
            return false;
        }
    }
    /**
     * Gets user subscription information for a specific relay
     *
     * @param relayAddress The relay contract address
     * @param userAddress The user's Ethereum address
     * @returns Subscription information or null if failed
     */
    async getUserSubscriptionInfo(relayAddress, userAddress) {
        try {
            const relayContract = await this.getRelayContract(relayAddress);
            if (!relayContract) {
                throw new Error(`Failed to get relay contract at ${relayAddress}`);
            }
            if (!ethers_1.ethers.isAddress(userAddress)) {
                throw new Error("Invalid Ethereum address format");
            }
            const [expires, pubKey] = await relayContract.getUserSubscriptionInfo(userAddress);
            const active = expires > BigInt(Math.floor(Date.now() / 1000));
            return { expires, pubKey, active };
        }
        catch (error) {
            errorHandler_1.ErrorHandler.handle(errorHandler_1.ErrorType.CONTRACT, "GET_USER_SUBSCRIPTION_INFO_FAILED", `Failed to get subscription info for user ${userAddress} on relay ${relayAddress}`, error);
            return null;
        }
    }
    /**
     * Checks if a public key is authorized in a specific relay
     *
     * @param relayAddress The relay contract address
     * @param publicKey The public key to check (as a byte array or hex string)
     * @returns True if authorized, false otherwise
     */
    async isPublicKeyAuthorized(relayAddress, publicKey) {
        try {
            // If debug mode is enabled, always return true
            const relayContract = await this.getRelayContract(relayAddress);
            if (!relayContract) {
                throw new Error(`Failed to get relay contract at ${relayAddress}`);
            }
            // Convert to properly formatted bytes if needed
            const formattedPubKey = typeof publicKey === "string"
                ? publicKey.startsWith("0x")
                    ? publicKey
                    : `0x${publicKey}`
                : `0x${Buffer.from(publicKey).toString("hex")}`;
            return await relayContract.isAuthorizedByPubKey(formattedPubKey);
        }
        catch (error) {
            errorHandler_1.ErrorHandler.handle(errorHandler_1.ErrorType.CONTRACT, "PUBKEY_AUTH_CHECK_FAILED", "Failed to check if public key is authorized", error);
            return false;
        }
    }
    /**
     * Gets the protocol subscription price from the registry
     *
     * @returns The price per month in wei (as BigInt) or null if failed
     */
    async getProtocolPrice() {
        try {
            if (!this.registryContract) {
                throw new Error("Registry contract not initialized");
            }
            return await this.registryContract.getProtocolPrice();
        }
        catch (error) {
            errorHandler_1.ErrorHandler.handle(errorHandler_1.ErrorType.CONTRACT, "GET_PROTOCOL_PRICE_FAILED", `Failed to get protocol price`, error);
            return null;
        }
    }
    /**
     * Gets the subscription price for a relay
     *
     * @param relayAddress The relay contract address
     * @returns The price per month in wei (as BigInt) or null if failed
     */
    async getRelayPrice(relayAddress) {
        try {
            const relayContract = await this.getRelayContract(relayAddress);
            if (!relayContract) {
                throw new Error(`Failed to get relay contract at ${relayAddress}`);
            }
            // First check if the relay uses the protocol price
            const isRegistered = await relayContract.isRegistered();
            if (isRegistered) {
                // If registered, use the protocol price
                return await this.getProtocolPrice();
            }
            else {
                // Otherwise, use the relay's own price
                return await relayContract.pricePerMonth();
            }
        }
        catch (error) {
            errorHandler_1.ErrorHandler.handle(errorHandler_1.ErrorType.CONTRACT, "GET_RELAY_PRICE_FAILED", `Failed to get price for relay ${relayAddress}`, error);
            return null;
        }
    }
    /**
     * Subscribes to a relay (requires a signer)
     *
     * @param relayAddress The relay contract address to subscribe to
     * @param months Number of months to subscribe for
     * @param pubKey Optional public key to associate with the subscription
     * @returns Transaction response or null if failed
     */
    async subscribeToRelay(relayAddress, months, pubKey) {
        try {
            if (!this.registryContract || !this.signer) {
                throw new Error("Registry contract not initialized or no signer available");
            }
            // Get the subscription price
            const pricePerMonth = await this.getRelayPrice(relayAddress);
            if (!pricePerMonth) {
                throw new Error(`Failed to get price for relay ${relayAddress}`);
            }
            // Format public key if provided
            let formattedPubKey = "0x";
            if (pubKey) {
                formattedPubKey =
                    typeof pubKey === "string"
                        ? pubKey.startsWith("0x")
                            ? pubKey
                            : `0x${pubKey}`
                        : `0x${Buffer.from(pubKey).toString("hex")}`;
            }
            // Calculate total payment
            const totalPayment = pricePerMonth * BigInt(months);
            // Subscribe through the registry
            return await this.registryContract.subscribeToRelay(relayAddress, months, formattedPubKey, { value: totalPayment });
        }
        catch (error) {
            errorHandler_1.ErrorHandler.handle(errorHandler_1.ErrorType.CONTRACT, "SUBSCRIBE_TO_RELAY_FAILED", `Failed to subscribe to relay ${relayAddress}`, error);
            return null;
        }
    }
    /**
     * Adds stake to a relay (requires a signer and relay ownership)
     *
     * @param relayAddress The relay address to add stake to
     * @param amount The amount to stake in wei
     * @returns Transaction response or null if failed
     */
    async addStake(relayAddress, amount) {
        try {
            if (!this.signer) {
                throw new Error("No signer available");
            }
            const relayContract = await this.getRelayContract(relayAddress);
            if (!relayContract) {
                throw new Error(`Failed to get relay contract at ${relayAddress}`);
            }
            return await relayContract.addStake({ value: amount });
        }
        catch (error) {
            errorHandler_1.ErrorHandler.handle(errorHandler_1.ErrorType.CONTRACT, "ADD_STAKE_FAILED", `Failed to add stake to relay ${relayAddress}`, error);
            return null;
        }
    }
    /**
     * Withdraws stake from a relay (requires a signer and relay ownership)
     *
     * @param relayAddress The relay address to withdraw stake from
     * @param amount The amount to withdraw in wei
     * @returns Transaction response or null if failed
     */
    async withdrawStake(relayAddress, amount) {
        try {
            if (!this.signer) {
                throw new Error("No signer available");
            }
            const relayContract = await this.getRelayContract(relayAddress);
            if (!relayContract) {
                throw new Error(`Failed to get relay contract at ${relayAddress}`);
            }
            return await relayContract.withdrawStake(amount);
        }
        catch (error) {
            errorHandler_1.ErrorHandler.handle(errorHandler_1.ErrorType.CONTRACT, "WITHDRAW_STAKE_FAILED", `Failed to withdraw stake from relay ${relayAddress}`, error);
            return null;
        }
    }
    /**
     * Checks if reward distribution is due
     *
     * @returns True if distribution is due, false otherwise
     */
    async isDistributionDue() {
        try {
            if (!this.registryContract) {
                throw new Error("Registry contract not initialized");
            }
            return await this.registryContract.isDistributionDue();
        }
        catch (error) {
            errorHandler_1.ErrorHandler.handle(errorHandler_1.ErrorType.CONTRACT, "IS_DISTRIBUTION_DUE_FAILED", "Failed to check if distribution is due", error);
            return false;
        }
    }
    /**
     * Distributes rewards to relay owners (can be called by anyone)
     *
     * @returns Transaction response or null if failed
     */
    async distributeRewards() {
        try {
            if (!this.registryContract || !this.signer) {
                throw new Error("Registry contract not initialized or no signer available");
            }
            return await this.registryContract.distributeRewards();
        }
        catch (error) {
            errorHandler_1.ErrorHandler.handle(errorHandler_1.ErrorType.CONTRACT, "DISTRIBUTE_REWARDS_FAILED", "Failed to distribute rewards", error);
            return null;
        }
    }
    /**
     * Updates the provider URL for the verifier
     *
     * @param providerUrl New provider URL to use
     * @returns True if provider was updated successfully
     */
    setProviderUrl(providerUrl) {
        try {
            this.provider = new ethers_1.ethers.JsonRpcProvider(providerUrl);
            if (this.provider) {
                // Reinitialize the registry contract with the new provider
                this.registryContract = this.signer
                    ? new ethers_1.ethers.Contract(this.registryAddress, RELAY_REGISTRY_ABI, this.signer)
                    : new ethers_1.ethers.Contract(this.registryAddress, RELAY_REGISTRY_ABI, this.provider);
                // Clear cached relay contracts to force recreation with new provider
                this.relayContracts.clear();
                (0, logger_1.log)(`Updated provider URL to ${providerUrl}`);
                return true;
            }
            return false;
        }
        catch (error) {
            errorHandler_1.ErrorHandler.handle(errorHandler_1.ErrorType.CONTRACT, "PROVIDER_UPDATE_FAILED", "Failed to update provider URL", error);
            return false;
        }
    }
    /**
     * Updates the registry address for the verifier
     *
     * @param registryAddress New registry address to use
     * @returns True if registry address was updated successfully
     */
    setRegistryAddress(registryAddress) {
        try {
            if (!ethers_1.ethers.isAddress(registryAddress)) {
                throw new Error("Invalid registry address format");
            }
            this.registryAddress = registryAddress;
            if (this.provider) {
                // Reinitialize the registry contract with the new address
                this.registryContract = this.signer
                    ? new ethers_1.ethers.Contract(this.registryAddress, RELAY_REGISTRY_ABI, this.signer)
                    : new ethers_1.ethers.Contract(this.registryAddress, RELAY_REGISTRY_ABI, this.provider);
                // Clear cached relay contracts as they might no longer be valid
                this.relayContracts.clear();
                (0, logger_1.log)(`Updated registry address to ${registryAddress}`);
                return true;
            }
            return false;
        }
        catch (error) {
            errorHandler_1.ErrorHandler.handle(errorHandler_1.ErrorType.CONTRACT, "REGISTRY_ADDRESS_UPDATE_FAILED", "Failed to update registry address", error);
            return false;
        }
    }
    /**
     * Updates the signer for the verifier
     *
     * @param signer New ethers.Signer instance to use
     * @returns True if signer was updated successfully
     */
    setSigner(signer) {
        try {
            this.signer = signer;
            if (this.provider) {
                // Reinitialize the registry contract with the new signer
                this.registryContract = new ethers_1.ethers.Contract(this.registryAddress, RELAY_REGISTRY_ABI, this.signer);
                // Update all cached relay contracts with the new signer
                for (const [address, _] of this.relayContracts) {
                    this.relayContracts.set(address, new ethers_1.ethers.Contract(address, INDIVIDUAL_RELAY_ABI, this.signer));
                }
                (0, logger_1.log)(`Updated signer for RelayVerifier`);
                return true;
            }
            return false;
        }
        catch (error) {
            errorHandler_1.ErrorHandler.handle(errorHandler_1.ErrorType.CONTRACT, "SIGNER_UPDATE_FAILED", "Failed to update signer", error);
            return false;
        }
    }
}
exports.RelayVerifier = RelayVerifier;
