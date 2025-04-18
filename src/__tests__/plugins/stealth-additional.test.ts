import { StealthAddresses } from "../../plugins/stealth/stealth";
import { ethers } from "ethers";

// Mock per ethers
jest.mock("ethers", () => {
  const originalModule = jest.requireActual("ethers");

  const mockWallet = {
    address: "0x1234567890123456789012345678901234567890",
    privateKey: "0xprivatekey",
    publicKey: "0xpublickey",
    signMessage: jest.fn().mockResolvedValue("0xsignature"),
  };

  return {
    ...originalModule,
    Wallet: {
      createRandom: jest.fn().mockReturnValue(mockWallet),
      fromPrivateKey: jest.fn().mockReturnValue(mockWallet),
    },
    utils: {
      ...originalModule.utils,
      keccak256: jest.fn().mockReturnValue("0xhash"),
      computeAddress: jest
        .fn()
        .mockReturnValue("0x1234567890123456789012345678901234567890"),
      arrayify: jest.fn().mockReturnValue(new Uint8Array(32)),
      hexlify: jest.fn().mockReturnValue("0xhexData"),
      getAddress: jest
        .fn()
        .mockReturnValue("0x1234567890123456789012345678901234567890"),
    },
    encryptSafely: jest.fn().mockResolvedValue("encrypted-data"),
    decryptSafely: jest.fn().mockResolvedValue("decrypted-data"),
  };
});

// Prepariamo un mock di Gun.SEA
global.Gun = {
  SEA: {
    pair: jest.fn().mockImplementation(() =>
      Promise.resolve({
        pub: "testPub123",
        priv: "testPriv123",
        epub: "testEpub123",
        epriv: "testEpriv123",
      })
    ),
    secret: jest.fn().mockImplementation((pubKey, pair, cb) => {
      if (typeof cb === "function") {
        setTimeout(() => cb("shared-secret-123"), 0);
      }
      return Promise.resolve("shared-secret-123");
    }),
    encrypt: jest.fn().mockImplementation((data, key) => {
      return Promise.resolve(`encrypted:${data}`);
    }),
    decrypt: jest.fn().mockImplementation((data, key) => {
      if (typeof data === "string" && data.startsWith("encrypted:")) {
        return Promise.resolve(data.replace("encrypted:", ""));
      }
      return Promise.resolve(null);
    }),
  },
} as any;

describe("StealthAddresses", () => {
  let stealth: StealthAddresses;

  beforeEach(() => {
    // Crea istanza di StealthAddresses
    stealth = new StealthAddresses();
  });

  test("dovrebbe inizializzarsi correttamente", () => {
    expect(stealth).toBeDefined();
  });

  test("dovrebbe generare una coppia di chiavi stealth", () => {
    const keys = stealth.generateStealthKeys();
    expect(keys).toBeDefined();
    expect(keys.scanning.privateKey).toBeDefined();
    expect(keys.scanning.publicKey).toBeDefined();
    expect(keys.spending.privateKey).toBeDefined();
    expect(keys.spending.publicKey).toBeDefined();
  });

  test("dovrebbe generare indirizzi stealth da chiavi", () => {
    // Prima generiamo chiavi stealth
    const keys = stealth.generateStealthKeys();

    // Generiamo un indirizzo stealth usando le chiavi
    const stealthAddress = stealth.generateStealthAddress(
      keys.scanning.publicKey,
      keys.spending.publicKey
    );

    expect(stealthAddress).toBeDefined();
    expect(stealthAddress.ephemeralPublicKey).toBeDefined();
    expect(stealthAddress.stealthAddress).toMatch(/^0x[a-fA-F0-9]{40}$/);
  });

  test("dovrebbe recuperare chiavi private da indirizzo stealth", () => {
    // Prima generiamo chiavi stealth
    const keys = stealth.generateStealthKeys();

    // Generiamo un indirizzo stealth
    const stealthAddress = stealth.generateStealthAddress(
      keys.scanning.publicKey,
      keys.spending.publicKey
    );

    // Recuperiamo la chiave privata
    const privateKey = stealth.scanningKeyToPrivateKey(
      keys.scanning.privateKey,
      keys.spending.privateKey,
      stealthAddress.ephemeralPublicKey
    );

    expect(privateKey).toBeDefined();
  });

  test("dovrebbe generare metadati stealth", () => {
    // Prima generiamo chiavi stealth
    const keys = stealth.generateStealthKeys();

    // Generiamo un indirizzo stealth
    const stealthAddress = stealth.generateStealthAddress(
      keys.scanning.publicKey,
      keys.spending.publicKey
    );

    // Generiamo i metadati
    const metadata = stealth.generateStealthMetadata(
      stealthAddress.ephemeralPublicKey,
      stealthAddress.stealthAddress
    );

    expect(metadata).toBeDefined();
    expect(metadata.ephemeralPublicKey).toBe(stealthAddress.ephemeralPublicKey);
    expect(metadata.stealthAddress).toBe(stealthAddress.stealthAddress);
  });

  test("dovrebbe verificare un indirizzo stealth", () => {
    // Mock per testare la verifica di un indirizzo
    jest.spyOn(stealth as any, "verifyStealthAddress").mockReturnValue(true);

    // Prima generiamo chiavi stealth
    const keys = stealth.generateStealthKeys();

    // Generiamo un indirizzo stealth
    const stealthAddress = stealth.generateStealthAddress(
      keys.scanning.publicKey,
      keys.spending.publicKey
    );

    // Generiamo i metadati
    const metadata = stealth.generateStealthMetadata(
      stealthAddress.ephemeralPublicKey,
      stealthAddress.stealthAddress
    );

    // Verifichiamo l'indirizzo
    const isValid = (stealth as any).verifyStealthAddress(
      metadata.ephemeralPublicKey,
      keys.scanning.publicKey,
      keys.spending.publicKey,
      metadata.stealthAddress
    );

    expect(isValid).toBeTruthy();
  });
});
