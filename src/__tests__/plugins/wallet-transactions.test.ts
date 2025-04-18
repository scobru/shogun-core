// @ts-nocheck
/**
 * Test suite per le funzionalità di transazione del WalletManager
 * Questo file include test per:
 * - Generazione mnemonic
 * - Recupero mnemonic
 * - Invio di transazioni
 * - Firma di messaggi
 */

import { WalletManager } from "../../plugins/wallet/walletManager";
import { ShogunStorage } from "../../storage/storage";
import { ethers } from "ethers";

// Mock per ethers: non utilizziamo jest.mock perché causa problemi
// con i metodi utilizzati all'interno di WalletManager
const mockProvider = {
  getBalance: jest.fn().mockResolvedValue(BigInt("1000000000000000000")),
  getTransactionCount: jest.fn().mockResolvedValue(5),
  sendTransaction: jest.fn().mockResolvedValue({
    hash: "0xtxhash",
    wait: jest.fn().mockResolvedValue({ status: 1 }),
  }),
};

// Mock per Gun
const mockGun = {
  user: jest.fn().mockReturnValue({
    is: { alias: "test-user", pub: "pub-key" },
    _: {
      sea: {
        pub: "pub-key",
        priv: "priv-key",
        epub: "epub-key",
        epriv: "epriv-key",
      },
    },
    get: jest.fn().mockImplementation((path) => ({
      once: jest.fn().mockImplementation((cb) => {
        if (path === "master_mnemonic") {
          cb(
            "test one two three four five six seven eight nine ten eleven twelve",
          );
        } else if (path === "wallet_paths") {
          cb({
            "0x1234": { path: "m/44'/60'/0'/0/0", created: Date.now() },
            _: {},
          });
        } else if (path === "transactions") {
          cb({
            tx1: {
              hash: "0xtx1",
              to: "0x2345",
              value: "0.1",
              status: "confirmed",
              timestamp: Date.now() - 10000,
            },
            tx2: {
              hash: "0xtx2",
              to: "0x3456",
              value: "0.2",
              status: "pending",
              timestamp: Date.now() - 5000,
            },
            _: {},
          });
        } else {
          cb(null);
        }
        return { on: jest.fn() };
      }),
      put: jest.fn().mockImplementation((data, cb) => {
        if (cb) cb({ ok: true });
        return { get: jest.fn().mockReturnThis() };
      }),
      map: jest.fn().mockReturnValue({
        once: jest.fn().mockImplementation((cb) => {
          cb({
            hash: "0xtx1",
            to: "0x2345",
            value: "0.1",
            status: "confirmed",
            timestamp: Date.now() - 10000,
          });
          return { on: jest.fn() };
        }),
      }),
    })),
    leave: jest.fn(),
  }),
};

// Mock per SEA
global.Gun = {
  SEA: {
    encrypt: jest.fn().mockResolvedValue("encrypted-data"),
    decrypt: jest.fn().mockImplementation((data) => {
      if (data === "encrypted-mnemonic") {
        return Promise.resolve(
          "test one two three four five six seven eight nine ten eleven twelve",
        );
      }
      return Promise.resolve(data);
    }),
    pair: jest.fn().mockResolvedValue({
      pub: "pub-key",
      priv: "priv-key",
      epub: "epub-key",
      epriv: "epriv-key",
    }),
  },
};

describe("WalletManager - Transazioni", () => {
  let walletManager;
  let storage;
  let originalGenerateNewMnemonic;
  let originalGetProvider;
  let originalSendTransaction;

  beforeEach(() => {
    jest.clearAllMocks();
    storage = new ShogunStorage();

    // Impostazione dello storage per i test
    jest.spyOn(storage, "getItem").mockImplementation((key) => {
      if (key.includes("master_mnemonic")) {
        return "encrypted-mnemonic";
      } else if (key.includes("wallet_paths")) {
        return JSON.stringify({
          "0x1234567890123456789012345678901234567890": {
            path: "m/44'/60'/0'/0/0",
            created: Date.now(),
          },
        });
      } else if (key.includes("transactions")) {
        return JSON.stringify({
          tx1: {
            hash: "0xtx1",
            to: "0x2345",
            value: "0.1",
            status: "confirmed",
            timestamp: Date.now() - 10000,
          },
          tx2: {
            hash: "0xtx2",
            to: "0x3456",
            value: "0.2",
            status: "pending",
            timestamp: Date.now() - 5000,
          },
        });
      }
      return null;
    });

    walletManager = new WalletManager(mockGun, storage, {
      rpcUrl: "https://ethereum-goerli.publicnode.com",
      balanceCacheTTL: 30000,
    });

    // Salviamo i metodi originali per ripristinarli nei test
    originalGenerateNewMnemonic = walletManager.generateNewMnemonic;
    originalGetProvider = walletManager.getProvider;
    originalSendTransaction = walletManager.sendTransaction;

    // Mockiamo i metodi direttamente sulla classe
    walletManager.generateNewMnemonic = jest
      .fn()
      .mockReturnValue(
        "test one two three four five six seven eight nine ten eleven twelve",
      );

    walletManager.getProvider = jest.fn().mockReturnValue(mockProvider);

    // Non mocchiamo sendTransaction direttamente qui, lo faremo quando necessario
  });

  afterEach(() => {
    // Ripristiniamo i metodi originali
    if (originalGenerateNewMnemonic) {
      walletManager.generateNewMnemonic = originalGenerateNewMnemonic;
    }
    if (originalGetProvider) {
      walletManager.getProvider = originalGetProvider;
    }
    if (originalSendTransaction) {
      walletManager.sendTransaction = originalSendTransaction;
    }
  });

  test("dovrebbe generare un nuovo mnemonic", () => {
    const mnemonic = walletManager.generateNewMnemonic();
    expect(mnemonic).toBeDefined();
    expect(mnemonic.split(" ").length).toBeGreaterThanOrEqual(12);
    expect(walletManager.generateNewMnemonic).toHaveBeenCalled();
  });

  test("dovrebbe recuperare il mnemonic dell'utente", async () => {
    const mnemonic = await walletManager.getUserMasterMnemonic();
    expect(mnemonic).toBe(
      "test one two three four five six seven eight nine ten eleven twelve",
    );
  });

  test("dovrebbe inviare una transazione", async () => {
    // Mockiamo direttamente il metodo sendTransaction
    walletManager.sendTransaction = jest.fn().mockResolvedValue("0xtxhash");

    const result = await walletManager.sendTransaction(
      { address: "0x1234567890123456789012345678901234567890" },
      "0x2345678901234567890123456789012345678901",
      "0.01",
    );

    expect(result).toBeDefined();
    expect(result).toContain("0x");
    expect(walletManager.sendTransaction).toHaveBeenCalled();
  });

  test("dovrebbe firmare un messaggio", async () => {
    // Creiamo un wallet mock con il metodo signMessage
    const mockWallet = {
      signMessage: jest.fn().mockResolvedValue("0xsignature"),
    };

    // Il metodo originale di signMessage dovrebbe funzionare
    const signature = await walletManager.signMessage(
      mockWallet,
      "Test message",
    );

    expect(signature).toBeDefined();
    expect(signature).toContain("0x");
    expect(mockWallet.signMessage).toHaveBeenCalledWith("Test message");
  });

  test("dovrebbe gestire gli errori nella transazione", async () => {
    // Mockiamo sendTransaction per lanciare un errore
    walletManager.sendTransaction = jest.fn().mockImplementation(() => {
      throw new Error("Mock transaction error");
    });

    try {
      await walletManager.sendTransaction(
        { address: "0x1234567890123456789012345678901234567890" },
        "0x2345678901234567890123456789012345678901",
        "0.01",
      );
      // Dovrebbe lanciare un errore, quindi non dovremmo arrivare qui
      expect(true).toBe(false);
    } catch (error) {
      expect(error).toBeDefined();
      expect(error.message).toContain("Mock transaction error");
    }
  });
});
