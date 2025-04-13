import { ShogunCore, WalletPlugin, StealthPlugin, DIDPlugin, } from "../index";
/**
 * Esempio di utilizzo di tutti i plugin di ShogunCore
 */
async function exampleAllPlugins() {
    // Inizializziamo ShogunCore con configurazione di base
    const core = new ShogunCore({
        gundb: {
            peers: ["https://gun-server.example.com/gun"],
        },
        providerUrl: "https://eth-mainnet.g.alchemy.com/v2/YOUR_API_KEY",
    });
    // Creiamo le istanze dei plugin
    const walletPlugin = new WalletPlugin();
    const stealthPlugin = new StealthPlugin();
    const didPlugin = new DIDPlugin();
    // Registriamo i plugin
    core.register(walletPlugin);
    core.register(stealthPlugin);
    core.register(didPlugin);
    // Controlliamo che i plugin siano stati registrati correttamente
    console.log(`Wallet plugin registered: ${core.hasPlugin("wallet")}`);
    console.log(`Stealth plugin registered: ${core.hasPlugin("stealth")}`);
    console.log(`DID plugin registered: ${core.hasPlugin("did")}`);
    // Login dell'utente
    const loginResult = await core.login("username", "password");
    if (!loginResult.success) {
        console.log(`Login failed: ${loginResult.error}`);
        return;
    }
    console.log("Login successful");
    // Esempio di utilizzo del wallet plugin
    try {
        // Crea un nuovo wallet
        const newWallet = await walletPlugin.createWallet();
        console.log(`New wallet created: ${newWallet.address}`);
        // Ottieni tutti i wallet
        const wallets = await walletPlugin.loadWallets();
        console.log(`User has ${wallets.length} wallets`);
    }
    catch (error) {
        console.error("Error using wallet plugin:", error);
    }
    // Esempio di utilizzo del plugin stealth
    try {
        // Genera una coppia di chiavi effimere
        const ephemeralKeys = await stealthPlugin.generateEphemeralKeyPair();
        console.log("Generated ephemeral keys:", ephemeralKeys);
        // Esempio di generazione indirizzo stealth (utilizzando le chiavi per demo)
        const stealthAddress = await stealthPlugin.generateStealthAddress(ephemeralKeys.publicKey, ephemeralKeys.privateKey);
        console.log("Generated stealth address:", stealthAddress);
    }
    catch (error) {
        console.error("Error using stealth plugin:", error);
    }
    // Esempio di utilizzo del plugin DID
    try {
        // Assicuriamo che l'utente abbia un DID
        const userDID = await didPlugin.ensureUserHasDID();
        if (userDID) {
            console.log(`User DID: ${userDID}`);
            // Risolvi il DID per ottenere il documento
            const didDocument = await didPlugin.resolveDID(userDID);
            console.log("DID Document:", didDocument);
        }
        else {
            console.log("Failed to ensure user has DID");
        }
    }
    catch (error) {
        console.error("Error using DID plugin:", error);
    }
}
/**
 * Esempio di inizializzazione automatica dei plugin
 */
async function exampleAutoRegisterPlugins() {
    // Creiamo le istanze dei plugin
    const walletPlugin = new WalletPlugin();
    const stealthPlugin = new StealthPlugin();
    const didPlugin = new DIDPlugin();
    // Inizializziamo ShogunCore con auto-registrazione dei plugin
    const core = new ShogunCore({
        gundb: {
            peers: ["https://gun-server.example.com/gun"],
        },
        providerUrl: "https://eth-mainnet.g.alchemy.com/v2/YOUR_API_KEY",
        plugins: {
            autoRegister: [walletPlugin, stealthPlugin, didPlugin],
        },
    });
    // Verifichiamo che i plugin siano stati registrati automaticamente
    console.log(`Wallet plugin auto-registered: ${core.hasPlugin("wallet")}`);
    console.log(`Stealth plugin auto-registered: ${core.hasPlugin("stealth")}`);
    console.log(`DID plugin auto-registered: ${core.hasPlugin("did")}`);
    // Accediamo ai plugin tipizzati
    const wallet = core.getPlugin("wallet");
    const stealth = core.getPlugin("stealth");
    const did = core.getPlugin("did");
    // Verifichiamo che i plugin siano disponibili
    console.log(`Wallet plugin available: ${!!wallet}`);
    console.log(`Stealth plugin available: ${!!stealth}`);
    console.log(`DID plugin available: ${!!did}`);
}
/**
 * Esempio di interazione tra plugin
 */
async function examplePluginInteractions() {
    // Inizializziamo ShogunCore con tutti i plugin
    const core = new ShogunCore({});
    core.register(new WalletPlugin());
    core.register(new StealthPlugin());
    core.register(new DIDPlugin());
    // Login utente
    await core.login("username", "password");
    // Recuperiamo i plugin
    const wallet = core.getPlugin("wallet");
    const stealth = core.getPlugin("stealth");
    const did = core.getPlugin("did");
    if (!wallet || !stealth || !did) {
        console.error("One or more plugins not available");
        return;
    }
    try {
        // Crea un wallet
        const newWallet = await wallet.createWallet();
        console.log(`Created wallet: ${newWallet.address}`);
        // Utilizzalo per creare un DID
        const userDID = await did.ensureUserHasDID({
            services: [
                {
                    type: "EthereumAddress",
                    endpoint: `ethereum:${newWallet.address}`,
                },
            ],
        });
        console.log(`User DID with wallet service: ${userDID}`);
        // Genera chiavi stealth
        const ephemeralKeys = await stealth.generateEphemeralKeyPair();
        // Aggiorna il DID con informazioni stealth
        if (userDID) {
            const updated = await did.updateDIDDocument(userDID, {
                service: [
                    {
                        id: `${userDID}#stealth-1`,
                        type: "StealthAddress",
                        serviceEndpoint: `stealth:${ephemeralKeys.publicKey}`,
                    },
                ],
            });
            console.log(`DID updated with stealth information: ${updated}`);
        }
    }
    catch (error) {
        console.error("Error in plugin interactions:", error);
    }
}
// Esecuzione degli esempi
// exampleAllPlugins().catch(console.error);
// exampleAutoRegisterPlugins().catch(console.error);
// examplePluginInteractions().catch(console.error);
