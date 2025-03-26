/**
 * WebAuthn stub for light version
 * Include only basic functionality - advanced features must be lazy loaded
 */
class WebauthnStub {
  constructor() {
    console.warn("WebAuthn functionality disabled in light version. Import full version or lazy load WebAuthn module.");
  }

  isSupported() {
    return false;
  }

  validateUsername() {
    throw new Error("WebAuthn functionality disabled in light version");
  }

  async createAccount() {
    throw new Error("WebAuthn functionality disabled in light version");
  }

  async authenticateUser() {
    throw new Error("WebAuthn functionality disabled in light version");
  }

  async sign() {
    throw new Error("WebAuthn functionality disabled in light version");
  }
}

export { WebauthnStub as Webauthn };
export default WebauthnStub; 