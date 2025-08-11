import { Web3ConnectorPlugin } from "../../../plugins/web3/web3ConnectorPlugin";
import { ShogunCore } from "../../../index";
import { Web3Connector } from "../../../plugins/web3/web3Connector";
import { Web3Signer } from "../../../plugins/web3/web3Signer";
import { ErrorHandler, ErrorType } from "../../../utils/errorHandler";
import { ethers } from "ethers";
import { ISEAPair } from "gun";

// Mock dependencies
jest.mock("../../../plugins/web3/web3Connector");
jest.mock("../../../plugins/web3/web3Signer");
jest.mock("../../../utils/errorHandler");
jest.mock("ethers");

const MockWeb3Connector = Web3Connector as jest.MockedClass<
  typeof Web3Connector
>;
const MockWeb3Signer = Web3Signer as jest.MockedClass<typeof Web3Signer>;

describe("Web3ConnectorPlugin", () => {
  let plugin: Web3ConnectorPlugin;
  let mockCore: ShogunCore;
  let mockConnector: jest.Mocked<Web3Connector>;
  let mockSigner: jest.Mocked<Web3Signer>;

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup mocks
    mockConnector = {
      isAvailable: jest.fn(),
      connectMetaMask: jest.fn(),
      generateCredentials: jest.fn(),
      cleanup: jest.fn(),
      setCustomProvider: jest.fn(),
      getSigner: jest.fn(),
      getProvider: jest.fn(),
      generatePassword: jest.fn(),
      verifySignature: jest.fn(),
      createSigningCredential: jest.fn(),
      createAuthenticator: jest.fn(),
      createDerivedKeyPair: jest.fn(),
      signWithDerivedKeys: jest.fn(),
      getSigningCredential: jest.fn(),
      listSigningCredentials: jest.fn(),
      removeSigningCredential: jest.fn(),
      createGunUserFromSigningCredential: jest.fn(),
      getGunUserPubFromSigningCredential: jest.fn(),
      getPassword: jest.fn(),
      verifyConsistency: jest.fn(),
      setupConsistentOneshotSigning: jest.fn(),
    } as any;

    mockSigner = {
      sign: jest.fn(),
      verify: jest.fn(),
    } as any;

    MockWeb3Connector.mockImplementation(() => mockConnector);
    MockWeb3Signer.mockImplementation(() => mockSigner);

    mockCore = {
      // Add minimal mock properties as needed
    } as any;

    plugin = new Web3ConnectorPlugin();
  });

  describe("Constructor", () => {
    it("should create Web3ConnectorPlugin with correct properties", () => {
      expect(plugin.name).toBe("web3");
      expect(plugin.version).toBe("1.0.0");
      expect(plugin.description).toContain("Ethereum wallet connection");
    });
  });

  describe("initialize", () => {
    it("should initialize plugin with core and create connector/signer", () => {
      plugin.initialize(mockCore);

      expect(plugin["core"]).toBe(mockCore);
      expect(MockWeb3Connector).toHaveBeenCalled();
      expect(MockWeb3Signer).toHaveBeenCalledWith(mockConnector);
    });
  });

  describe("destroy", () => {
    it("should cleanup resources when destroyed", () => {
      plugin.initialize(mockCore);
      plugin.destroy();

      expect(mockConnector.cleanup).toHaveBeenCalled();
      expect(plugin["Web3"]).toBeNull();
      expect(plugin["signer"]).toBeNull();
    });

    it("should handle destroy when not initialized", () => {
      expect(() => plugin.destroy()).not.toThrow();
    });
  });

  describe("isAvailable", () => {
    beforeEach(() => {
      plugin.initialize(mockCore);
    });

    it("should return availability status from connector", () => {
      mockConnector.isAvailable.mockReturnValue(true);

      const result = plugin.isAvailable();

      expect(result).toBe(true);
      expect(mockConnector.isAvailable).toHaveBeenCalled();
    });

    it("should throw error when not initialized", () => {
      const uninitializedPlugin = new Web3ConnectorPlugin();

      expect(() => uninitializedPlugin.isAvailable()).toThrow(
        "Plugin web3 not initialized"
      );
    });
  });

  describe("connectMetaMask", () => {
    beforeEach(() => {
      plugin.initialize(mockCore);
    });

    it("should connect to MetaMask successfully", async () => {
      const mockResult = {
        success: true,
        address: "0x1234567890123456789012345678901234567890",
        provider: "metamask",
      };

      mockConnector.connectMetaMask.mockResolvedValue(mockResult);

      const result = await plugin.connectMetaMask();

      expect(result).toEqual(mockResult);
      expect(mockConnector.connectMetaMask).toHaveBeenCalled();
    });

    it("should handle connection failure", async () => {
      const mockResult = {
        success: false,
        error: "Connection failed",
      };

      mockConnector.connectMetaMask.mockResolvedValue(mockResult);

      const result = await plugin.connectMetaMask();

      expect(result).toEqual(mockResult);
    });
  });

  describe("generateCredentials", () => {
    beforeEach(() => {
      plugin.initialize(mockCore);
    });

    it("should generate credentials successfully", async () => {
      const mockCredentials: ISEAPair = {
        pub: "pub123",
        priv: "priv123",
        epub: "epub123",
        epriv: "epriv123",
      };

      mockConnector.generateCredentials.mockResolvedValue(mockCredentials);

      const result = await plugin.generateCredentials(
        "0x1234567890123456789012345678901234567890"
      );

      expect(result).toEqual(mockCredentials);
      expect(mockConnector.generateCredentials).toHaveBeenCalledWith(
        "0x1234567890123456789012345678901234567890"
      );
    });
  });

  describe("setCustomProvider", () => {
    beforeEach(() => {
      plugin.initialize(mockCore);
    });

    it("should set custom provider", () => {
      plugin.setCustomProvider("https://rpc.example.com", "private_key_123");

      expect(mockConnector.setCustomProvider).toHaveBeenCalledWith(
        "https://rpc.example.com",
        "private_key_123"
      );
    });
  });

  describe("getSigner", () => {
    beforeEach(() => {
      plugin.initialize(mockCore);
    });

    it("should return signer from connector", async () => {
      const mockSigner = {} as ethers.Signer;
      mockConnector.getSigner.mockResolvedValue(mockSigner);

      const result = await plugin.getSigner();

      expect(result).toBe(mockSigner);
      expect(mockConnector.getSigner).toHaveBeenCalled();
    });
  });

  describe("getProvider", () => {
    beforeEach(() => {
      plugin.initialize(mockCore);
    });

    it("should return provider from connector", async () => {
      const mockProvider = {} as ethers.JsonRpcProvider;
      mockConnector.getProvider.mockResolvedValue(mockProvider);

      const result = await plugin.getProvider();

      expect(result).toBe(mockProvider);
      expect(mockConnector.getProvider).toHaveBeenCalled();
    });
  });

  describe("generatePassword", () => {
    beforeEach(() => {
      plugin.initialize(mockCore);
    });

    it("should generate password from signature", async () => {
      mockConnector.generatePassword.mockResolvedValue("generated_password");

      const result = await plugin.generatePassword("signature123");

      expect(result).toBe("generated_password");
      expect(mockConnector.generatePassword).toHaveBeenCalledWith(
        "signature123"
      );
    });
  });

  describe("verifySignature", () => {
    beforeEach(() => {
      plugin.initialize(mockCore);
    });

    it("should verify signature and return address", async () => {
      mockConnector.verifySignature.mockResolvedValue(
        "0x1234567890123456789012345678901234567890"
      );

      const result = await plugin.verifySignature("message", "signature");

      expect(result).toBe("0x1234567890123456789012345678901234567890");
      expect(mockConnector.verifySignature).toHaveBeenCalledWith(
        "message",
        "signature"
      );
    });
  });

  describe("createSigningCredential", () => {
    beforeEach(() => {
      plugin.initialize(mockCore);
    });

    it("should create signing credential successfully", async () => {
      const mockCredential = {
        address: "0x1234567890123456789012345678901234567890",
        publicKey: "pubkey123",
        privateKey: "privkey123",
      };

      mockConnector.createSigningCredential.mockResolvedValue(mockCredential);

      const result = await plugin.createSigningCredential(
        "0x1234567890123456789012345678901234567890"
      );

      expect(result).toEqual(mockCredential);
      expect(mockConnector.createSigningCredential).toHaveBeenCalledWith(
        "0x1234567890123456789012345678901234567890"
      );
    });
  });

  describe("createAuthenticator", () => {
    beforeEach(() => {
      plugin.initialize(mockCore);
    });

    it("should create authenticator function", () => {
      const mockAuthenticator = jest.fn();
      mockConnector.createAuthenticator.mockReturnValue(mockAuthenticator);

      const result = plugin.createAuthenticator(
        "0x1234567890123456789012345678901234567890"
      );

      expect(result).toBe(mockAuthenticator);
      expect(mockConnector.createAuthenticator).toHaveBeenCalledWith(
        "0x1234567890123456789012345678901234567890"
      );
    });
  });

  describe("createDerivedKeyPair", () => {
    beforeEach(() => {
      plugin.initialize(mockCore);
    });

    it("should create derived key pair", async () => {
      const mockKeyPair = {
        pub: "pub123",
        priv: "priv123",
        epub: "epub123",
        epriv: "epriv123",
      };

      mockConnector.createDerivedKeyPair.mockResolvedValue(mockKeyPair);

      const result = await plugin.createDerivedKeyPair(
        "0x1234567890123456789012345678901234567890",
        ["extra1", "extra2"]
      );

      expect(result).toEqual(mockKeyPair);
      expect(mockConnector.createDerivedKeyPair).toHaveBeenCalledWith(
        "0x1234567890123456789012345678901234567890",
        ["extra1", "extra2"]
      );
    });
  });

  describe("signWithDerivedKeys", () => {
    beforeEach(() => {
      plugin.initialize(mockCore);
    });

    it("should sign data with derived keys", async () => {
      mockConnector.signWithDerivedKeys.mockResolvedValue("signed_data");

      const result = await plugin.signWithDerivedKeys(
        { data: "test" },
        "0x1234567890123456789012345678901234567890",
        ["extra"]
      );

      expect(result).toBe("signed_data");
      expect(mockConnector.signWithDerivedKeys).toHaveBeenCalledWith(
        { data: "test" },
        "0x1234567890123456789012345678901234567890",
        ["extra"]
      );
    });
  });

  describe("getSigningCredential", () => {
    beforeEach(() => {
      plugin.initialize(mockCore);
    });

    it("should return signing credential if exists", () => {
      const mockCredential = {
        address: "0x1234567890123456789012345678901234567890",
        publicKey: "pubkey123",
      };

      mockConnector.getSigningCredential.mockReturnValue(mockCredential);

      const result = plugin.getSigningCredential(
        "0x1234567890123456789012345678901234567890"
      );

      expect(result).toEqual(mockCredential);
      expect(mockConnector.getSigningCredential).toHaveBeenCalledWith(
        "0x1234567890123456789012345678901234567890"
      );
    });

    it("should return undefined if credential not found", () => {
      mockConnector.getSigningCredential.mockReturnValue(undefined);

      const result = plugin.getSigningCredential(
        "0x1234567890123456789012345678901234567890"
      );

      expect(result).toBeUndefined();
    });
  });

  describe("listSigningCredentials", () => {
    beforeEach(() => {
      plugin.initialize(mockCore);
    });

    it("should return list of signing credentials", () => {
      const mockCredentials = [
        {
          address: "0x1234567890123456789012345678901234567890",
          publicKey: "pubkey123",
        },
        {
          address: "0x0987654321098765432109876543210987654321",
          publicKey: "pubkey456",
        },
      ];

      mockConnector.listSigningCredentials.mockReturnValue(mockCredentials);

      const result = plugin.listSigningCredentials();

      expect(result).toEqual(mockCredentials);
      expect(mockConnector.listSigningCredentials).toHaveBeenCalled();
    });
  });

  describe("removeSigningCredential", () => {
    beforeEach(() => {
      plugin.initialize(mockCore);
    });

    it("should remove signing credential successfully", () => {
      mockConnector.removeSigningCredential.mockReturnValue(true);

      const result = plugin.removeSigningCredential(
        "0x1234567890123456789012345678901234567890"
      );

      expect(result).toBe(true);
      expect(mockConnector.removeSigningCredential).toHaveBeenCalledWith(
        "0x1234567890123456789012345678901234567890"
      );
    });

    it("should return false if credential not found", () => {
      mockConnector.removeSigningCredential.mockReturnValue(false);

      const result = plugin.removeSigningCredential(
        "0x1234567890123456789012345678901234567890"
      );

      expect(result).toBe(false);
    });
  });

  describe("createGunUserFromSigningCredential", () => {
    beforeEach(() => {
      plugin.initialize(mockCore);
    });

    it("should create Gun user successfully", async () => {
      const mockResult = {
        success: true,
        userPub: "gun_pub_123",
      };

      mockConnector.createGunUserFromSigningCredential.mockResolvedValue(
        mockResult
      );

      const result = await plugin.createGunUserFromSigningCredential(
        "0x1234567890123456789012345678901234567890"
      );

      expect(result).toEqual(mockResult);
      expect(
        mockConnector.createGunUserFromSigningCredential
      ).toHaveBeenCalledWith("0x1234567890123456789012345678901234567890");
    });

    it("should handle Gun user creation failure", async () => {
      const mockResult = {
        success: false,
        error: "Creation failed",
      };

      mockConnector.createGunUserFromSigningCredential.mockResolvedValue(
        mockResult
      );

      const result = await plugin.createGunUserFromSigningCredential(
        "0x1234567890123456789012345678901234567890"
      );

      expect(result).toEqual(mockResult);
    });
  });

  describe("getGunUserPubFromSigningCredential", () => {
    beforeEach(() => {
      plugin.initialize(mockCore);
    });

    it("should return Gun user public key", () => {
      mockConnector.getGunUserPubFromSigningCredential.mockReturnValue(
        "gun_pub_123"
      );

      const result = plugin.getGunUserPubFromSigningCredential(
        "0x1234567890123456789012345678901234567890"
      );

      expect(result).toBe("gun_pub_123");
      expect(
        mockConnector.getGunUserPubFromSigningCredential
      ).toHaveBeenCalledWith("0x1234567890123456789012345678901234567890");
    });

    it("should return undefined if not found", () => {
      mockConnector.getGunUserPubFromSigningCredential.mockReturnValue(
        undefined
      );

      const result = plugin.getGunUserPubFromSigningCredential(
        "0x1234567890123456789012345678901234567890"
      );

      expect(result).toBeUndefined();
    });
  });

  describe("getPassword", () => {
    beforeEach(() => {
      plugin.initialize(mockCore);
    });

    it("should return password for address", () => {
      mockConnector.getPassword.mockReturnValue("stored_password");

      const result = plugin.getPassword(
        "0x1234567890123456789012345678901234567890"
      );

      expect(result).toBe("stored_password");
      expect(mockConnector.getPassword).toHaveBeenCalledWith(
        "0x1234567890123456789012345678901234567890"
      );
    });

    it("should return undefined if password not found", () => {
      mockConnector.getPassword.mockReturnValue(undefined);

      const result = plugin.getPassword(
        "0x1234567890123456789012345678901234567890"
      );

      expect(result).toBeUndefined();
    });
  });

  describe("verifyConsistency", () => {
    beforeEach(() => {
      plugin.initialize(mockCore);
    });

    it("should verify consistency successfully", async () => {
      const mockResult = {
        consistent: true,
        actualUserPub: "gun_pub_123",
        expectedUserPub: "gun_pub_123",
      };

      mockConnector.verifyConsistency.mockResolvedValue(mockResult);

      const result = await plugin.verifyConsistency(
        "0x1234567890123456789012345678901234567890",
        "gun_pub_123"
      );

      expect(result).toEqual(mockResult);
      expect(mockConnector.verifyConsistency).toHaveBeenCalledWith(
        "0x1234567890123456789012345678901234567890",
        "gun_pub_123"
      );
    });

    it("should detect inconsistency", async () => {
      const mockResult = {
        consistent: false,
        actualUserPub: "gun_pub_123",
        expectedUserPub: "gun_pub_456",
      };

      mockConnector.verifyConsistency.mockResolvedValue(mockResult);

      const result = await plugin.verifyConsistency(
        "0x1234567890123456789012345678901234567890",
        "gun_pub_456"
      );

      expect(result.consistent).toBe(false);
    });
  });

  describe("setupConsistentOneshotSigning", () => {
    beforeEach(() => {
      plugin.initialize(mockCore);
    });

    it("should setup consistent oneshot signing", async () => {
      const mockResult = {
        credential: {
          address: "0x1234567890123456789012345678901234567890",
          publicKey: "pubkey123",
        },
        authenticator: jest.fn(),
        gunUser: { success: true, userPub: "gun_pub_123" },
        username: "0x1234567890123456789012345678901234567890",
        password: "generated_password",
      };

      mockConnector.setupConsistentOneshotSigning.mockResolvedValue(mockResult);

      const result = await plugin.setupConsistentOneshotSigning(
        "0x1234567890123456789012345678901234567890"
      );

      expect(result).toEqual(mockResult);
      expect(mockConnector.setupConsistentOneshotSigning).toHaveBeenCalledWith(
        "0x1234567890123456789012345678901234567890"
      );
    });
  });

  describe("login", () => {
    beforeEach(() => {
      plugin.initialize(mockCore);
    });

    it("should perform login successfully", async () => {
      const mockAuthResult = {
        success: true,
        user: {
          id: "0x1234567890123456789012345678901234567890",
          address: "0x1234567890123456789012345678901234567890",
        },
      };

      jest.spyOn(plugin, "setupConsistentOneshotSigning").mockResolvedValue({
        credential: {
          address: "0x1234567890123456789012345678901234567890",
          publicKey: "pubkey123",
        },
        authenticator: jest.fn(),
        gunUser: { success: true, userPub: "gun_pub_123" },
        username: "0x1234567890123456789012345678901234567890",
        password: "generated_password",
      });

      plugin["core"] = {
        authenticate: jest.fn().mockResolvedValue(mockAuthResult),
      } as any;

      const result = await plugin.login(
        "0x1234567890123456789012345678901234567890"
      );

      expect(result).toEqual(mockAuthResult);
    });

    it("should handle login failure", async () => {
      const mockAuthResult = {
        success: false,
        error: "Authentication failed",
      };

      jest.spyOn(plugin, "setupConsistentOneshotSigning").mockResolvedValue({
        credential: {
          address: "0x1234567890123456789012345678901234567890",
          publicKey: "pubkey123",
        },
        authenticator: jest.fn(),
        gunUser: { success: false, error: "Gun user creation failed" },
        username: "0x1234567890123456789012345678901234567890",
        password: "generated_password",
      });

      const result = await plugin.login(
        "0x1234567890123456789012345678901234567890"
      );

      expect(result.success).toBe(false);
    });
  });

  describe("signUp", () => {
    beforeEach(() => {
      plugin.initialize(mockCore);
    });

    it("should perform signup successfully", async () => {
      const mockSignUpResult = {
        success: true,
        user: {
          id: "0x1234567890123456789012345678901234567890",
          address: "0x1234567890123456789012345678901234567890",
        },
      };

      jest.spyOn(plugin, "setupConsistentOneshotSigning").mockResolvedValue({
        credential: {
          address: "0x1234567890123456789012345678901234567890",
          publicKey: "pubkey123",
        },
        authenticator: jest.fn(),
        gunUser: { success: true, userPub: "gun_pub_123" },
        username: "0x1234567890123456789012345678901234567890",
        password: "generated_password",
      });

      plugin["core"] = {
        signUp: jest.fn().mockResolvedValue(mockSignUpResult),
      } as any;

      const result = await plugin.signUp(
        "0x1234567890123456789012345678901234567890"
      );

      expect(result).toEqual(mockSignUpResult);
    });
  });

  describe("Error handling", () => {
    it("should handle connector initialization errors", () => {
      MockWeb3Connector.mockImplementation(() => {
        throw new Error("Connector initialization failed");
      });

      expect(() => {
        plugin.initialize(mockCore);
      }).toThrow("Connector initialization failed");
    });

    it("should handle signer initialization errors", () => {
      MockWeb3Signer.mockImplementation(() => {
        throw new Error("Signer initialization failed");
      });

      expect(() => {
        plugin.initialize(mockCore);
      }).toThrow("Signer initialization failed");
    });
  });
});
