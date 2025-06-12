import Gun from "gun";
import { Web3Connector } from "./web3Connector";
import { Web3Signer } from "./web3Signer";

const web3Chain = () => {
  const web3 = new Web3Connector();
  const signer = new Web3Signer(web3);

  // Initialize the web3 chain object if it doesn't exist
  if (!(Gun.chain as any).web3) {
    (Gun.chain as any).web3 = {};
  }

  (Gun.chain as any).web3.connect = async function () {
    return await web3.connectMetaMask();
  };

  (Gun.chain as any).web3.generateCredentials = async function (
    address: string,
  ) {
    return await web3.generateCredentials(address);
  };

  (Gun.chain as any).web3.getSigner = async function () {
    return await web3.getSigner();
  };

  (Gun.chain as any).web3.getProvider = async function () {
    return await web3.getProvider();
  };

  (Gun.chain as any).web3.signMessage = async function (message: string) {
    const signer = await web3.getSigner();
    return await signer.signMessage(message);
  };

  (Gun.chain as any).web3.verifySignature = async function (
    message: string,
    signature: string,
  ) {
    return await web3.verifySignature(message, signature);
  };

  (Gun.chain as any).web3.isMetaMaskAvailable = function () {
    return Web3Connector.isMetaMaskAvailable();
  };

  /**
   * Setup oneshot signing for an Ethereum address
   * Creates signing credential with consistent password generation
   */
  (Gun.chain as any).web3.setupOneshotSigning = async function (
    address: string,
  ) {
    return await signer.createSigningCredential(address);
  };

  /**
   * Create authenticator for Web3 signing
   * Returns a function that can be used with SEA.sign
   */
  (Gun.chain as any).web3.createAuthenticator = function (address: string) {
    return signer.createAuthenticator(address);
  };

  /**
   * Create derived key pair from Web3 credential
   * Uses the same password generation as normal Web3 approach
   */
  (Gun.chain as any).web3.createDerivedKeyPair = async function (
    address: string,
    extra?: string[],
  ) {
    return await signer.createDerivedKeyPair(address, extra);
  };

  /**
   * Quick sign method that combines Web3 verification with derived key signing
   * Similar to webauthn.js but for Web3
   */
  (Gun.chain as any).web3.quickSign = async function (
    data: any,
    address: string,
    extra?: string[],
  ) {
    return await signer.signWithDerivedKeys(data, address, extra);
  };

  /**
   * Creates a Gun user from Web3 signing credential
   * Ensures SAME user as normal approach
   */
  (Gun.chain as any).web3.createGunUserFromSigningCredential = async function (
    address: string,
  ) {
    return await signer.createGunUser(address, this);
  };

  /**
   * Get the Gun user public key for a signing credential
   */
  (Gun.chain as any).web3.getGunUserPubFromSigningCredential = function (
    address: string,
  ) {
    return signer.getGunUserPub(address);
  };

  /**
   * Get the password (for consistency checking)
   */
  (Gun.chain as any).web3.getPassword = function (address: string) {
    return signer.getPassword(address);
  };

  /**
   * Verify consistency between oneshot and normal approaches
   */
  (Gun.chain as any).web3.verifyConsistency = async function (
    address: string,
    expectedUserPub?: string,
  ) {
    return await signer.verifyConsistency(address, expectedUserPub);
  };

  /**
   * Complete consistent oneshot signing workflow
   * Creates the SAME Gun user as normal approach
   */
  (Gun.chain as any).web3.setupConsistentOneshotSigning = async function (
    address: string,
  ) {
    const credential = await signer.createSigningCredential(address);
    const authenticator = signer.createAuthenticator(address);
    const gunUser = await signer.createGunUser(address, this);

    return {
      credential,
      authenticator,
      gunUser,
      username: credential.username,
      password: credential.password,
    };
  };
};

export default web3Chain;
