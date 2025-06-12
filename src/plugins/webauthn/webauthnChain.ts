import Gun from "gun";
import { Webauthn } from "./webauthn";
import { WebAuthnSigner } from "./webauthnSigner";

const webauthnChain = () => {
  const webauthn = new Webauthn();
  const signer = new WebAuthnSigner(webauthn);

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

  (Gun.chain as any).webauthn.createSigningCredential = async function (
    username: string,
  ) {
    return await signer.createSigningCredential(username);
  };

  (Gun.chain as any).webauthn.createAuthenticator = function (
    credentialId: string,
  ) {
    return signer.createAuthenticator(credentialId);
  };

  (Gun.chain as any).webauthn.createDerivedKeyPair = async function (
    credentialId: string,
    username: string,
    extra?: string[],
  ) {
    return await signer.createDerivedKeyPair(credentialId, username, extra);
  };

  (Gun.chain as any).webauthn.signWithDerivedKeys = async function (
    data: any,
    credentialId: string,
    username: string,
    extra?: string[],
  ) {
    return await signer.signWithDerivedKeys(
      data,
      credentialId,
      username,
      extra,
    );
  };

  (Gun.chain as any).webauthn.getSigningCredential = function (
    credentialId: string,
  ) {
    return signer.getCredential(credentialId);
  };

  (Gun.chain as any).webauthn.listSigningCredentials = function () {
    return signer.listCredentials();
  };

  (Gun.chain as any).webauthn.removeSigningCredential = function (
    credentialId: string,
  ) {
    return signer.removeCredential(credentialId);
  };

  (Gun.chain as any).webauthn.setupOneshotSigning = async function (
    username: string,
  ) {
    const credential = await signer.createSigningCredential(username);
    const authenticator = signer.createAuthenticator(credential.id);

    return {
      credential,
      authenticator,
      pub: credential.pub,
    };
  };

  (Gun.chain as any).webauthn.quickSign = async function (
    data: any,
    credentialId: string,
    username: string,
    extra?: string[],
  ) {
    return await signer.signWithDerivedKeys(
      data,
      credentialId,
      username,
      extra,
    );
  };

  // === CONSISTENCY METHODS ===

  /**
   * Creates a Gun user from WebAuthn signing credential
   * Ensures SAME user as normal approach
   */
  (Gun.chain as any).webauthn.createGunUserFromSigningCredential =
    async function (credentialId: string, username: string) {
      return await signer.createGunUser(credentialId, username, this);
    };

  /**
   * Get the Gun user public key for a signing credential
   */
  (Gun.chain as any).webauthn.getGunUserPubFromSigningCredential = function (
    credentialId: string,
  ) {
    return signer.getGunUserPub(credentialId);
  };

  /**
   * Get the hashed credential ID (for consistency checking)
   */
  (Gun.chain as any).webauthn.getHashedCredentialId = function (
    credentialId: string,
  ) {
    return signer.getHashedCredentialId(credentialId);
  };

  /**
   * Verify consistency between oneshot and normal approaches
   */
  (Gun.chain as any).webauthn.verifyConsistency = async function (
    credentialId: string,
    username: string,
    expectedUserPub?: string,
  ) {
    return await signer.verifyConsistency(
      credentialId,
      username,
      expectedUserPub,
    );
  };

  /**
   * Complete consistent oneshot signing workflow
   * Creates the SAME Gun user as normal approach
   */
  (Gun.chain as any).webauthn.setupConsistentOneshotSigning = async function (
    username: string,
  ) {
    const credential = await signer.createSigningCredential(username);
    const authenticator = signer.createAuthenticator(credential.id);
    const gunUser = await signer.createGunUser(credential.id, username, this);

    return {
      credential,
      authenticator,
      gunUser,
      pub: credential.pub,
      hashedCredentialId: credential.hashedCredentialId,
    };
  };
};

export default webauthnChain;
