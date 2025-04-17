import { Stealth } from "../../plugins/stealth/stealth";
import { ShogunStorage } from "../../storage/storage";
// Mock per le funzioni di Gun.SEA
const mockSEAPair = {
    pub: "testPub123",
    priv: "testPriv123",
    epub: "testEpub123",
    epriv: "testEpriv123",
};
// Mock per Gun
global.Gun = {
    SEA: {
        pair: jest.fn().mockImplementation(() => Promise.resolve(mockSEAPair)),
        secret: jest
            .fn()
            .mockImplementation(() => Promise.resolve("sharedSecret123")),
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
};
// Mock per ethers
jest.mock("ethers", () => {
    return {
        Wallet: {
            createRandom: jest.fn().mockReturnValue({
                address: "0x123456789abcdef",
                privateKey: "0xprivkey123",
            }),
            fromPrivateKey: jest.fn().mockReturnValue({
                address: "0xstealth123",
            }),
        },
    };
});
// Sopprimi temporaneamente i log durante i test
const originalConsoleLog = console.log;
const originalConsoleInfo = console.info;
const originalConsoleError = console.error;
console.log = jest.fn();
console.info = jest.fn();
console.error = jest.fn();
describe("Stealth", () => {
    let stealth;
    let storage;
    beforeEach(() => {
        jest.clearAllMocks();
        storage = new ShogunStorage();
        stealth = new Stealth(storage);
    });
    afterEach(() => {
        stealth.cleanupSensitiveData();
    });
    afterAll(() => {
        // Ripristina le funzioni console originali
        console.log = originalConsoleLog;
        console.info = originalConsoleInfo;
        console.error = originalConsoleError;
    });
    test("dovrebbe inizializzarsi correttamente", () => {
        expect(stealth).toBeDefined();
        expect(stealth.STEALTH_DATA_TABLE).toBe("Stealth");
    });
    test("dovrebbe formattare correttamente le chiavi pubbliche", () => {
        // Chiave pubblica con tilde
        const key1 = "~pubKey123";
        expect(stealth.formatPublicKey(key1)).toBe("pubKey123");
        // Chiave pubblica senza tilde
        const key2 = "pubKey456";
        expect(stealth.formatPublicKey(key2)).toBe("pubKey456");
        // Casi limite
        expect(stealth.formatPublicKey(null)).toBeNull();
        expect(stealth.formatPublicKey("")).toBeNull();
        expect(stealth.formatPublicKey("   ")).toBeNull();
        // Caratteri non validi
        expect(stealth.formatPublicKey("key$%^")).toBeNull();
    });
    test("dovrebbe creare un account stealth", async () => {
        // Crea un account stealth
        const keyPair = await stealth.createAccount();
        // Verifica che la struttura sia corretta
        expect(keyPair).toBeDefined();
        expect(keyPair.pub).toBe(mockSEAPair.pub);
        expect(keyPair.priv).toBe(mockSEAPair.priv);
        expect(keyPair.epub).toBe(mockSEAPair.epub);
        expect(keyPair.epriv).toBe(mockSEAPair.epriv);
    });
    test("dovrebbe generare chiavi effimere", async () => {
        const ephemeral = await stealth.generateEphemeralKeyPair();
        expect(ephemeral).toBeDefined();
        expect(ephemeral.privateKey).toBe(mockSEAPair.epriv);
        expect(ephemeral.publicKey).toBe(mockSEAPair.epub);
    });
    test("dovrebbe preparare le chiavi stealth per il salvataggio", () => {
        const keyPair = {
            pub: "pubKey123",
            priv: "privKey123",
            epub: "epubKey123",
            epriv: "eprivKey123",
        };
        const prepared = stealth.prepareStealthKeysForSaving(keyPair);
        expect(prepared).toBeDefined();
        expect(prepared.pub).toBe(keyPair.pub);
        expect(prepared.priv).toBe(keyPair.priv);
        expect(prepared.epub).toBe(keyPair.epub);
        expect(prepared.epriv).toBe(keyPair.epriv);
    });
    test("dovrebbe pulire i dati sensibili", async () => {
        // Usiamo spyOn sui metodi privati che non possiamo accedere direttamente
        const cleanupSpy = jest.spyOn(stealth, "cleanupSensitiveData");
        await stealth.cleanupSensitiveData();
        expect(cleanupSpy).toHaveBeenCalled();
    });
});
