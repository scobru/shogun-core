import Gun from "gun";
import { NostrConnector } from "./nostrConnector";

const nostrChain = () => {
  const nostr = new NostrConnector();

  (Gun.chain as any).nostr = {};

  (Gun.chain as any).nostr.isAvailable = function () {
    return nostr.isAvailable();
  };

  (Gun.chain as any).nostr.isNostrExtensionAvailable = function () {
    return nostr.isNostrExtensionAvailable();
  };

  (Gun.chain as any).nostr.connectWallet = async function (
    type: "alby" | "nostr" | "manual" = "nostr",
  ) {
    return await nostr.connectWallet(type);
  };

  (Gun.chain as any).nostr.generateCredentials = async function (
    address: string,
  ) {
    return await nostr.generateCredentials(address);
  };

  (Gun.chain as any).nostr.generatePassword = async function (
    signature: string,
  ) {
    return await nostr.generatePassword(signature);
  };

  (Gun.chain as any).nostr.verifySignature = async function (
    message: string,
    signature: string,
    address: string,
  ) {
    return await nostr.verifySignature(message, signature, address);
  };

  (Gun.chain as any).nostr.getConnectedAddress = function () {
    return nostr.getConnectedAddress();
  };

  (Gun.chain as any).nostr.getConnectedType = function () {
    return nostr.getConnectedType();
  };

  (Gun.chain as any).nostr.setKeyPair = function (keyPair: any) {
    return nostr.setKeyPair(keyPair);
  };

  (Gun.chain as any).nostr.clearSignatureCache = function (address?: string) {
    return nostr.clearSignatureCache(address);
  };

  (Gun.chain as any).nostr.cleanup = function () {
    return nostr.cleanup();
  };
};

export default nostrChain;
