import { BasePlugin } from "../base";
import { ShogunCore } from "../../index";
import { MetaMask } from "./connector/metamask";
import { MetaMaskPluginInterface } from "./types";
import { MetaMaskCredentials, ConnectionResult } from "../../types/metamask";
import { log, logError } from "../../utils/logger";
import { ethers } from "ethers";

/**
 * Plugin per la gestione delle funzionalità MetaMask in ShogunCore
 */
export class MetaMaskPlugin extends BasePlugin implements MetaMaskPluginInterface {
  name = "metamask";
  version = "1.0.0";
  description = "Provides MetaMask wallet connection and authentication for ShogunCore";
  
  private metamask: MetaMask | null = null;
  
  /**
   * @inheritdoc
   */
  initialize(core: ShogunCore): void {
    super.initialize(core);
    
    // Inizializziamo il modulo MetaMask
    this.metamask = new MetaMask();
    
    log("MetaMask plugin initialized");
  }
  
  /**
   * @inheritdoc
   */
  destroy(): void {
    if (this.metamask) {
      this.metamask.cleanup();
    }
    this.metamask = null;
    super.destroy();
    log("MetaMask plugin destroyed");
  }
  
  /**
   * Assicura che il modulo MetaMask sia inizializzato
   * @private
   */
  private assertMetaMask(): MetaMask {
    this.assertInitialized();
    if (!this.metamask) {
      throw new Error("MetaMask module not initialized");
    }
    return this.metamask;
  }
  
  /**
   * @inheritdoc
   */
  isAvailable(): boolean {
    return this.assertMetaMask().isAvailable();
  }
  
  /**
   * @inheritdoc
   */
  async connectMetaMask(): Promise<ConnectionResult> {
    return this.assertMetaMask().connectMetaMask();
  }
  
  /**
   * @inheritdoc
   */
  async generateCredentials(address: string): Promise<MetaMaskCredentials> {
    return this.assertMetaMask().generateCredentials(address);
  }
  
  /**
   * @inheritdoc
   */
  cleanup(): void {
    this.assertMetaMask().cleanup();
  }
  
  /**
   * @inheritdoc
   */
  setCustomProvider(rpcUrl: string, privateKey: string): void {
    this.assertMetaMask().setCustomProvider(rpcUrl, privateKey);
  }
  
  /**
   * @inheritdoc
   */
  async getSigner(): Promise<ethers.Signer> {
    return this.assertMetaMask().getSigner();
  }
  
  /**
   * @inheritdoc
   */
  async generatePassword(signature: string): Promise<string> {
    return this.assertMetaMask().generatePassword(signature);
  }
  
  /**
   * @inheritdoc
   */
  async verifySignature(message: string, signature: string): Promise<string> {
    return this.assertMetaMask().verifySignature(message, signature);
  }
}

// Export only the interface, not the plugin itself again
export { MetaMaskPluginInterface } from './types'; 