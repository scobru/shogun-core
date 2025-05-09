import {
  StealthAddressResult,
  StealthData,
  EphemeralKeyPair,
} from "../../types/stealth";
import { ethers } from "ethers";

/**
 * Interfaccia per il plugin Stealth
 */
export interface StealthPluginInterface {
  /**
   * Genera una coppia di chiavi effimere per comunicazioni stealth
   * @returns Promise con la coppia di chiavi generata
   */
  generateEphemeralKeyPair(): Promise<{
    privateKey: string;
    publicKey: string;
  }>;

  /**
   * Genera un indirizzo stealth utilizzando una chiave pubblica
   * @param publicKey Chiave pubblica del destinatario
   * @param ephemeralPrivateKey Chiave privata effimera per la generazione
   * @returns Promise con il risultato dell'indirizzo stealth
   */
  generateStealthAddress(
    publicKey: string,
    ephemeralPrivateKey: string,
  ): Promise<StealthAddressResult>;

  /**
   * Scandisce gli indirizzi stealth per verificare se sono indirizzati all'utente
   * @param addresses Array di dati stealth da scansionare
   * @param privateKeyOrSpendKey Chiave privata o chiave di spesa dell'utente
   * @returns Promise con gli indirizzi che appartengono all'utente
   */
  scanStealthAddresses(
    addresses: StealthData[],
    privateKeyOrSpendKey: string,
  ): Promise<StealthData[]>;

  /**
   * Verifica la proprietà di un indirizzo stealth
   * @param stealthData Dati dell'indirizzo stealth
   * @param privateKeyOrSpendKey Chiave privata o chiave di spesa dell'utente
   * @returns Promise che indica se l'indirizzo appartiene all'utente
   */
  isStealthAddressMine(
    stealthData: StealthData,
    privateKeyOrSpendKey: string,
  ): Promise<boolean>;

  /**
   * Recupera la chiave privata di un indirizzo stealth
   * @param stealthData Dati dell'indirizzo stealth
   * @param privateKeyOrSpendKey Chiave privata o chiave di spesa dell'utente
   * @returns Promise con la chiave privata recuperata
   */
  getStealthPrivateKey(
    stealthData: StealthData,
    privateKeyOrSpendKey: string,
  ): Promise<string>;

  /**
   * Apre un indirizzo stealth utilizzando la chiave pubblica effimera e le chiavi dell'utente
   * @param stealthAddress Indirizzo stealth da aprire
   * @param ephemeralPublicKey Chiave pubblica effimera utilizzata per generare l'indirizzo
   * @param pair Coppia di chiavi dell'utente
   * @returns Promise con il wallet dell'indirizzo stealth
   */
  openStealthAddress(
    stealthAddress: string,
    ephemeralPublicKey: string,
    pair: EphemeralKeyPair,
  ): Promise<ethers.Wallet>;
}
