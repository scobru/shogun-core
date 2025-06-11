import Gun from "gun";
import { Web3Connector } from "./web3Connector";

const web3Chain = () => {
  const web3 = new Web3Connector();

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

  (Gun.chain as any).verifySignature = async function (
    message: string,
    signature: string,
  ) {
    return await web3.verifySignature(message, signature);
  };

  (Gun.chain as any).isMetaMaskAvailable = function () {
    return Web3Connector.isMetaMaskAvailable();
  };
};

export default web3Chain;
