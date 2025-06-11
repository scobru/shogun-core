import Gun from "gun";
import { Webauthn } from "./webauthn";

const webauthnChain = () => {
  const webauthn = new Webauthn();

  (Gun.chain as any).webauthn = {};

  (Gun.chain as any).webauthn.isSupported = function () {
    return webauthn.isSupported();
  };

  (Gun.chain as any).webauthn.createAccount = async function (
    username: string,
    credentials: any = null,
    isNewDevice = false,
  ) {
    return await webauthn.createAccount(username, credentials, isNewDevice);
  };

  (Gun.chain as any).webauthn.authenticateUser = async function (
    username: string,
    salt: string,
    options: any = {},
  ) {
    return await webauthn.authenticateUser(username, salt, options);
  };

  (Gun.chain as any).webauthn.generateCredentials = async function (
    username: string,
    existingCredential: any = null,
    isLogin = false,
  ) {
    return await webauthn.generateCredentials(
      username,
      existingCredential,
      isLogin,
    );
  };

  (Gun.chain as any).webauthn.abortAuthentication = function () {
    return webauthn.abortAuthentication();
  };

  (Gun.chain as any).webauthn.removeDevice = async function (
    username: string,
    credentialId: string,
    credentials: any,
  ) {
    return await webauthn.removeDevice(username, credentialId, credentials);
  };

  (Gun.chain as any).webauthn.sign = async function (
    data: Record<string, unknown>,
  ) {
    return await webauthn.sign(data);
  };

  (Gun.chain as any).webauthn.validateUsername = function (username: string) {
    return webauthn.validateUsername(username);
  };
};

export default webauthnChain;
