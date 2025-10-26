import { BasePlugin } from "../base";
import { ShogunCore } from "../../core";
import {
  SmartWalletPluginInterface,
  SmartWalletConfig,
  WalletCreateResult,
  WalletInfo,
  ExecutionResult,
  ProposalInfo,
  RecoveryRequest,
} from "./types";
import { ethers } from "ethers";
import { ErrorHandler, ErrorType } from "../../utils/errorHandler";

// Smart Wallet ABIs
const SMART_WALLET_FACTORY_ABI = [
  "function createWallet(address owner, uint256 requiredSignatures, uint256 requiredGuardians) external returns (address wallet)",
  "function createWalletWithGuardians(address owner, address[] memory guardians, uint256 requiredSignatures, uint256 requiredGuardians) external returns (address wallet)",
  "function getOwnerWallets(address owner) external view returns (address[] memory)",
  "event WalletCreated(address indexed wallet, address indexed owner, uint256 indexed walletIndex)",
];

const SMART_WALLET_ABI = [
  // Signer management
  "function addSigner(address signer) external",
  "function removeSigner(address signer) external",
  "function setRequiredSignatures(uint256 requiredSignatures) external",
  "function signers(address) external view returns (bool)",
  "function requiredSignatures() external view returns (uint256)",
  "function owner() external view returns (address)",

  // Guardian management
  "function addGuardian(address guardian) external",
  "function removeGuardian(address guardian) external",
  "function setRequiredGuardians(uint256 requiredGuardians) external",
  "function guardians(address) external view returns (bool)",
  "function requiredGuardians() external view returns (uint256)",

  // Execution
  "function execute(address target, bytes calldata data, uint256 value) external returns (bool success, bytes memory returnData)",
  "function executeBatch(address[] memory targets, bytes[] memory data, uint256[] memory values) external returns (bool[] memory results)",

  // Multi-sig
  "function proposeExecution(address target, bytes calldata data) external returns (uint256 proposalId)",
  "function approveProposal(uint256 proposalId) external",
  "function getProposal(uint256 proposalId) external view returns (address target, bytes memory data, address proposer, uint256 approvals, bool executed)",
  "function hasApprovedProposal(uint256 proposalId, address signer) external view returns (bool)",

  // Recovery
  "function initiateRecovery(address newOwner) external",
  "function approveRecovery() external",
  "function executeRecovery() external",
  "function getRecoveryRequest() external view returns (address newOwner, uint256 unlockTime, uint256 approvals)",
  "function hasApprovedRecovery(address guardian) external view returns (bool)",

  "event SignerAdded(address indexed signer)",
  "event GuardianAdded(address indexed guardian)",
  "event ExecutionExecuted(uint256 indexed proposalId, bool success)",
  "event RecoveryExecuted(address indexed newOwner)",
];

/**
 * Smart Wallet Plugin for Shogun Core
 * Provides integration with Smart Wallet contracts for account abstraction
 */
export class SmartWalletPlugin
  extends BasePlugin
  implements SmartWalletPluginInterface
{
  name = "smartwallet";
  version = "1.0.0";
  description =
    "Smart Wallet integration for Shogun Core with multi-sig and social recovery";

  private config: SmartWalletConfig;
  private factoryContract: ethers.Contract | null = null;
  private signer: ethers.Signer | null = null;

  constructor(config: SmartWalletConfig = {}) {
    super();
    this.config = {
      enabled: true,
      defaultRequiredSignatures: 1,
      defaultRequiredGuardians: 2,
      ...config,
    };
  }

  /**
   * Initialize the plugin
   */
  initialize(core: ShogunCore): void {
    super.initialize(core);

    if (!this.config.enabled) {
      console.log("[SmartWallet] Plugin disabled");
      return;
    }

    try {
      // Initialize provider and signer
      this.initProvider();

      // Initialize factory contract if address is provided
      if (this.config.factoryAddress) {
        this.initFactoryContract();
      }

      console.log("[SmartWallet] Plugin initialized successfully");
    } catch (error: any) {
      console.error("[SmartWallet] Initialization failed:", error.message);
    }
  }

  /**
   * Destroy the plugin and cleanup resources
   */
  destroy(): void {
    this.factoryContract = null;
    this.signer = null;
    super.destroy();
    console.log("[SmartWallet] Plugin destroyed");
  }

  /**
   * Initialize provider and signer
   */
  private initProvider(): void {
    if (typeof window !== "undefined" && (window as any).ethereum) {
      const provider = new ethers.BrowserProvider((window as any).ethereum);

      // Try to get signer from config, otherwise request from browser
      if (this.config.privateKey) {
        this.signer = new ethers.Wallet(this.config.privateKey, provider);
      } else {
        // Will be set when user connects wallet or provides private key
        this.signer = null;
        console.log(
          "[SmartWallet] No private key provided. Use connectWallet() or setSigner() first.",
        );
      }
    }
  }

  /**
   * Set signer with private key or wallet instance
   * This should be called after deriving the EOA from seed phrase
   */
  public async setSigner(privateKeyOrAddress: string): Promise<void> {
    try {
      if (!this.signer?.provider) {
        const provider = new ethers.BrowserProvider((window as any).ethereum);
        this.signer = new ethers.Wallet(privateKeyOrAddress, provider);
      } else {
        this.signer = new ethers.Wallet(
          privateKeyOrAddress,
          this.signer.provider,
        );
      }
      console.log("[SmartWallet] Signer updated");
    } catch (error: any) {
      console.error("[SmartWallet] Failed to set signer:", error.message);
      throw error;
    }
  }

  /**
   * Connect to MetaMask or other injected provider
   */
  public async connectWallet(): Promise<void> {
    try {
      if (typeof window !== "undefined" && (window as any).ethereum) {
        const provider = new ethers.BrowserProvider((window as any).ethereum);
        await provider.send("eth_requestAccounts", []);
        this.signer = await provider.getSigner();
        console.log(
          "[SmartWallet] Connected to wallet:",
          await this.signer.getAddress(),
        );
      } else {
        throw new Error("No Ethereum provider found");
      }
    } catch (error: any) {
      console.error("[SmartWallet] Failed to connect wallet:", error.message);
      throw error;
    }
  }

  /**
   * Initialize factory contract
   */
  private initFactoryContract(): void {
    if (!this.config.factoryAddress || !this.signer) {
      console.warn("[SmartWallet] Factory address or signer not available");
      return;
    }

    this.factoryContract = new ethers.Contract(
      this.config.factoryAddress,
      SMART_WALLET_FACTORY_ABI,
      this.signer,
    );
  }

  /**
   * Ensure signer is available
   */
  private assertSigner(): ethers.Signer {
    if (!this.signer) {
      throw new Error("Signer not available. Please connect a wallet.");
    }
    return this.signer;
  }

  /**
   * Ensure factory is initialized
   */
  private assertFactory(): ethers.Contract {
    if (!this.factoryContract) {
      throw new Error(
        "SmartWallet factory not initialized. Please deploy factory first.",
      );
    }
    return this.factoryContract;
  }

  // ============================================ Wallet Creation ============================================

  async createWallet(
    owner: string,
    requiredSignatures?: number,
    requiredGuardians?: number,
  ): Promise<WalletCreateResult> {
    try {
      const factory = this.assertFactory();
      const sig = this.assertSigner();

      const reqSig =
        requiredSignatures ?? this.config.defaultRequiredSignatures ?? 1;
      const reqGuard =
        requiredGuardians ?? this.config.defaultRequiredGuardians ?? 2;

      const tx = await factory.createWallet(owner, reqSig, reqGuard);
      const receipt = await tx.wait();

      // Extract wallet address from event
      const event = receipt.logs.find(
        (log: any) =>
          log.topics[0] === ethers.id("WalletCreated(address,address,uint256)"),
      );

      const walletAddress = event
        ? ethers.getAddress("0x" + event.topics[1].slice(-40))
        : null;

      return {
        success: true,
        walletAddress: walletAddress || undefined,
        transactionHash: receipt.hash,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async createWalletWithGuardians(
    owner: string,
    guardians: string[],
    requiredSignatures?: number,
    requiredGuardians?: number,
  ): Promise<WalletCreateResult> {
    try {
      const factory = this.assertFactory();

      const reqSig =
        requiredSignatures ?? this.config.defaultRequiredSignatures ?? 1;
      const reqGuard =
        requiredGuardians ?? this.config.defaultRequiredGuardians ?? 2;

      const tx = await factory.createWalletWithGuardians(
        owner,
        guardians,
        reqSig,
        reqGuard,
      );
      const receipt = await tx.wait();

      const event = receipt.logs.find(
        (log: any) =>
          log.topics[0] === ethers.id("WalletCreated(address,address,uint256)"),
      );

      const walletAddress = event
        ? ethers.getAddress("0x" + event.topics[1].slice(-40))
        : null;

      return {
        success: true,
        walletAddress: walletAddress || undefined,
        transactionHash: receipt.hash,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // ============================================ Wallet Management ============================================

  async getWalletInfo(walletAddress: string): Promise<WalletInfo | null> {
    try {
      const walletContract = new ethers.Contract(
        walletAddress,
        SMART_WALLET_ABI,
        this.assertSigner(),
      );

      const [owner, requiredSig, requiredGuard, currentSigner] =
        await Promise.all([
          walletContract.owner(),
          walletContract.requiredSignatures(),
          walletContract.requiredGuardians(),
          this.assertSigner().getAddress(),
        ]);

      const isSigner = await walletContract.signers(currentSigner);

      return {
        address: walletAddress,
        owner,
        isSigner,
        requiredSignatures: Number(requiredSig),
        requiredGuardians: Number(requiredGuard),
      };
    } catch (error: any) {
      console.error("[SmartWallet] Error getting wallet info:", error);
      return null;
    }
  }

  async getOwnerWallets(ownerAddress: string): Promise<string[]> {
    try {
      const factory = this.assertFactory();
      const wallets = await factory.getOwnerWallets(ownerAddress);
      return wallets;
    } catch (error: any) {
      console.error("[SmartWallet] Error getting owner wallets:", error);
      return [];
    }
  }

  // ============================================ Signer Management ============================================

  async addSigner(
    walletAddress: string,
    signer: string,
  ): Promise<ExecutionResult> {
    try {
      const walletContract = new ethers.Contract(
        walletAddress,
        SMART_WALLET_ABI,
        this.assertSigner(),
      );

      const tx = await walletContract.addSigner(signer);
      const receipt = await tx.wait();

      return {
        success: true,
        transactionHash: receipt.hash,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async removeSigner(
    walletAddress: string,
    signer: string,
  ): Promise<ExecutionResult> {
    try {
      const walletContract = new ethers.Contract(
        walletAddress,
        SMART_WALLET_ABI,
        this.assertSigner(),
      );

      const tx = await walletContract.removeSigner(signer);
      const receipt = await tx.wait();

      return {
        success: true,
        transactionHash: receipt.hash,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async setRequiredSignatures(
    walletAddress: string,
    required: number,
  ): Promise<ExecutionResult> {
    try {
      const walletContract = new ethers.Contract(
        walletAddress,
        SMART_WALLET_ABI,
        this.assertSigner(),
      );

      const tx = await walletContract.setRequiredSignatures(required);
      const receipt = await tx.wait();

      return {
        success: true,
        transactionHash: receipt.hash,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // ============================================ Guardian Management ============================================

  async addGuardian(
    walletAddress: string,
    guardian: string,
  ): Promise<ExecutionResult> {
    try {
      const walletContract = new ethers.Contract(
        walletAddress,
        SMART_WALLET_ABI,
        this.assertSigner(),
      );

      const tx = await walletContract.addGuardian(guardian);
      const receipt = await tx.wait();

      return {
        success: true,
        transactionHash: receipt.hash,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async removeGuardian(
    walletAddress: string,
    guardian: string,
  ): Promise<ExecutionResult> {
    try {
      const walletContract = new ethers.Contract(
        walletAddress,
        SMART_WALLET_ABI,
        this.assertSigner(),
      );

      const tx = await walletContract.removeGuardian(guardian);
      const receipt = await tx.wait();

      return {
        success: true,
        transactionHash: receipt.hash,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // ============================================ Execution ============================================

  async executeTransaction(
    walletAddress: string,
    target: string,
    data: string,
    value: string = "0",
  ): Promise<ExecutionResult> {
    try {
      const walletContract = new ethers.Contract(
        walletAddress,
        SMART_WALLET_ABI,
        this.assertSigner(),
      );

      const tx = await walletContract.execute(target, data, value);
      const receipt = await tx.wait();

      return {
        success: true,
        transactionHash: receipt.hash,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async executeBatch(
    walletAddress: string,
    targets: string[],
    dataArray: string[],
    values: string[],
  ): Promise<ExecutionResult> {
    try {
      const walletContract = new ethers.Contract(
        walletAddress,
        SMART_WALLET_ABI,
        this.assertSigner(),
      );

      const tx = await walletContract.executeBatch(targets, dataArray, values);
      const receipt = await tx.wait();

      return {
        success: true,
        transactionHash: receipt.hash,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // ============================================ Multi-Sig ============================================

  async proposeExecution(
    walletAddress: string,
    target: string,
    data: string,
  ): Promise<ExecutionResult> {
    try {
      const walletContract = new ethers.Contract(
        walletAddress,
        SMART_WALLET_ABI,
        this.assertSigner(),
      );

      const tx = await walletContract.proposeExecution(target, data);
      const receipt = await tx.wait();

      return {
        success: true,
        transactionHash: receipt.hash,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async approveProposal(
    walletAddress: string,
    proposalId: number,
  ): Promise<ExecutionResult> {
    try {
      const walletContract = new ethers.Contract(
        walletAddress,
        SMART_WALLET_ABI,
        this.assertSigner(),
      );

      const tx = await walletContract.approveProposal(proposalId);
      const receipt = await tx.wait();

      return {
        success: true,
        transactionHash: receipt.hash,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async getProposalInfo(
    walletAddress: string,
    proposalId: number,
  ): Promise<ProposalInfo | null> {
    try {
      const provider =
        this.assertSigner().provider || ethers.getDefaultProvider();
      const walletContract = new ethers.Contract(
        walletAddress,
        SMART_WALLET_ABI,
        provider,
      );

      const [target, data, proposer, approvals, executed] =
        await walletContract.getProposal(proposalId);

      return {
        proposalId,
        target,
        proposer,
        approvals: Number(approvals),
        executed,
      };
    } catch (error: any) {
      console.error("[SmartWallet] Error getting proposal info:", error);
      return null;
    }
  }

  // ============================================ Recovery ============================================

  async initiateRecovery(
    walletAddress: string,
    newOwner: string,
  ): Promise<ExecutionResult> {
    try {
      const walletContract = new ethers.Contract(
        walletAddress,
        SMART_WALLET_ABI,
        this.assertSigner(),
      );

      const tx = await walletContract.initiateRecovery(newOwner);
      const receipt = await tx.wait();

      return {
        success: true,
        transactionHash: receipt.hash,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async approveRecovery(walletAddress: string): Promise<ExecutionResult> {
    try {
      const walletContract = new ethers.Contract(
        walletAddress,
        SMART_WALLET_ABI,
        this.assertSigner(),
      );

      const tx = await walletContract.approveRecovery();
      const receipt = await tx.wait();

      return {
        success: true,
        transactionHash: receipt.hash,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async executeRecovery(walletAddress: string): Promise<ExecutionResult> {
    try {
      const walletContract = new ethers.Contract(
        walletAddress,
        SMART_WALLET_ABI,
        this.assertSigner(),
      );

      const tx = await walletContract.executeRecovery();
      const receipt = await tx.wait();

      return {
        success: true,
        transactionHash: receipt.hash,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async getRecoveryRequest(
    walletAddress: string,
  ): Promise<RecoveryRequest | null> {
    try {
      const provider =
        this.assertSigner().provider || ethers.getDefaultProvider();
      const walletContract = new ethers.Contract(
        walletAddress,
        SMART_WALLET_ABI,
        provider,
      );

      const [newOwner, unlockTime, approvals] =
        await walletContract.getRecoveryRequest();

      return {
        newOwner,
        unlockTime: Number(unlockTime),
        approvals: Number(approvals),
      };
    } catch (error: any) {
      console.error("[SmartWallet] Error getting recovery request:", error);
      return null;
    }
  }
}
