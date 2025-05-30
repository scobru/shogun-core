import { ethers } from "ethers";

import {
  BaseEvent,
  BaseConfig,
  BaseCacheEntry,
  BaseBackupOptions,
  BaseImportOptions,
} from "../../types/common";

export interface WalletInfo {
  wallet: any;
  path: string;
  address: string;
  getAddressString(): string;
}

/**
 * Interface defining a wallet's derivation path and creation timestamp
 */
export interface WalletPath {
  path: string;
  created: number;
}

/**
 * Interface for caching wallet balances
 */
export interface BalanceCache extends BaseCacheEntry<string> {
  balance: string;
}

/**
 * Interface for exporting wallet data
 */
export interface WalletExport {
  address: string;
  privateKey: string;
  path: string;
  created: number;
}

/**
 * Wallet configuration options
 */
export interface WalletConfig extends BaseConfig {
  rpcUrl?: string;
  defaultGasLimit?: number;
  balanceCacheTTL?: number;
}

/**
 * Transaction options
 */
export interface TransactionOptions extends BaseConfig {
  gasLimit?: number;
  gasPrice?: string;
  nonce?: number;
  maxFeePerGas?: string;
  maxPriorityFeePerGas?: string;
}

/**
 * Wallet backup options
 */
export interface WalletBackupOptions extends BaseBackupOptions {
  includePrivateKeys?: boolean;
}

/**
 * Wallet import options
 */
export interface WalletImportOptions extends BaseImportOptions {
  validateAddresses?: boolean;
}

/**
 * Wallet event types
 */
export enum WalletEventType {
  WALLET_CREATED = "walletCreated",
  WALLET_IMPORTED = "walletImported",
  BALANCE_UPDATED = "balanceUpdated",
  TRANSACTION_SENT = "transactionSent",
  TRANSACTION_CONFIRMED = "transactionConfirmed",
  ERROR = "error",
}

/**
 * Wallet event data
 */
export interface WalletEvent extends BaseEvent {
  type: WalletEventType;
}

/**
 * Interfaccia per il plugin del wallet manager
 */
export interface HDWalletPluginInterface {
  /**
   * Ottiene il wallet principale
   * @returns Il wallet principale o null se non disponibile
   */
  getMainWallet(): ethers.Wallet | null;

  /**
   * Ottiene il credenziali wallet principale
   * @returns Il wallet principale o null se non disponibile
   */
  getMainWalletCredentials(): { address: string; priv: string };

  /**
   * Crea un nuovo wallet
   * @returns Promise con l'informazione del wallet creato
   */
  createWallet(): Promise<WalletInfo>;

  /**
   * Carica tutti i wallet dell'utente
   * @returns Promise con array di wallet information
   */
  loadWallets(): Promise<WalletInfo[]>;

  /**
   * Firma un messaggio con un wallet
   * @param wallet Wallet da utilizzare per la firma
   * @param message Messaggio da firmare
   * @returns Promise con la firma del messaggio
   */
  signMessage(
    wallet: ethers.Wallet,
    message: string | Uint8Array,
  ): Promise<string>;

  /**
   * Verifica una firma
   * @param message Messaggio firmato
   * @param signature Firma da verificare
   * @returns Indirizzo che ha firmato il messaggio
   */
  verifySignature(message: string | Uint8Array, signature: string): string;

  /**
   * Firma una transazione
   * @param wallet Wallet per la firma
   * @param toAddress Indirizzo destinatario
   * @param value Importo da inviare
   * @returns Promise con la transazione firmata
   */
  signTransaction(
    wallet: ethers.Wallet,
    toAddress: string,
    value: string,
  ): Promise<string>;

  /**
   * Ottiene indirizzi derivati da una mnemonic usando lo standard BIP-44
   * @param mnemonic Mnemonic phrase
   * @param count Numero di indirizzi da derivare
   * @returns Array di indirizzi Ethereum
   */
  getStandardBIP44Addresses(mnemonic: string, count?: number): string[];

  /**
   * Genera una nuova mnemonic phrase
   * @returns Nuova mnemonic phrase
   */
  generateNewMnemonic(): string;

  // Metodi di esportazione
  exportMnemonic(password?: string): Promise<string>;
  exportWalletKeys(password?: string): Promise<string>;
  exportGunPair(password?: string): Promise<string>;
  exportAllUserData(password: string): Promise<string>;

  // Metodi di importazione
  importMnemonic(mnemonicData: string, password?: string): Promise<boolean>;
  importWalletKeys(walletsData: string, password?: string): Promise<number>;
  importGunPair(pairData: string, password?: string): Promise<boolean>;
  importAllUserData(
    backupData: string,
    password: string,
    options?: {
      importMnemonic?: boolean;
      importWallets?: boolean;
      importGunPair?: boolean;
    },
  ): Promise<{
    success: boolean;
    mnemonicImported?: boolean;
    walletsImported?: number;
    gunPairImported?: boolean;
  }>;

  /**
   * Imposta l'URL RPC per le connessioni alla rete Ethereum
   * @param rpcUrl URL del provider RPC da utilizzare
   * @returns true se l'URL è stato impostato con successo
   */
  setRpcUrl(rpcUrl: string): boolean;

  /**
   * Ottiene l'URL RPC configurato
   * @returns L'URL del provider corrente o null se non impostato
   */
  getRpcUrl(): string | null;
}
