"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const index_1 = require("../index");
// Primo modo: inizializzazione manuale del plugin
function exampleManualPluginInit() {
    // Inizializza ShogunCore senza il wallet manager
    const core = new index_1.ShogunCore({
        gundb: {
            peers: ["http://localhost:8765/gun"],
        },
        providerUrl: "https://eth-mainnet.g.alchemy.com/v2/YOUR_API_KEY",
    });
    // Crea e registra il plugin wallet
    const walletPlugin = new index_1.WalletPlugin();
    walletPlugin._category = index_1.PluginCategory.Wallet;
    core.register(walletPlugin);
    // Usa il plugin wallet
    async function useWalletPlugin() {
        if (core.isLoggedIn()) {
            // Ottieni tutte le info dei wallet
            const wallets = await walletPlugin.loadWallets();
            console.log("Wallets:", wallets);
            // Crea un nuovo wallet
            const newWallet = await walletPlugin.createWallet();
            console.log("New wallet created:", newWallet);
            // Genera una nuova mnemonic
            const mnemonic = walletPlugin.generateNewMnemonic();
            console.log("New mnemonic generated:", mnemonic);
        }
        else {
            console.log("User not logged in, please authenticate first");
        }
    }
    // Login e poi usa i wallet
    async function loginAndUseWallet() {
        const result = await core.login("username", "password");
        if (result.success) {
            console.log("Login successful");
            await useWalletPlugin();
        }
        else {
            console.log("Login failed:", result.error);
        }
    }
    // Esegui l'esempio
    loginAndUseWallet().catch(console.error);
}
// Secondo modo: inizializzazione automatica del plugin tramite configurazione
function exampleAutoPluginInit() {
    // Crea il plugin prima dell'inizializzazione di ShogunCore
    const walletPlugin = new index_1.WalletPlugin();
    walletPlugin._category = index_1.PluginCategory.Wallet;
    // Inizializza ShogunCore con auto-registrazione del plugin
    const core = new index_1.ShogunCore({
        gundb: {
            peers: ["http://localhost:8765/gun"],
        },
        providerUrl: "https://eth-mainnet.g.alchemy.com/v2/YOUR_API_KEY",
        plugins: {
            autoRegister: [walletPlugin],
        },
    });
    // Usa il plugin dopo l'inizializzazione
    async function useWalletPlugin() {
        // Recupera il plugin tramite il suo nome
        const wallet = core.getPlugin("wallet");
        if (!wallet) {
            console.log("Wallet plugin not found");
            return;
        }
        if (core.isLoggedIn()) {
            // Ottieni il wallet principale
            const mainWallet = wallet.getMainWallet();
            console.log("Main wallet:", mainWallet?.address);
            // Carica tutti i wallet
            const wallets = await wallet.loadWallets();
            console.log("All wallets:", wallets.map((w) => w.address));
        }
        else {
            console.log("User not logged in, please authenticate first");
        }
    }
    // Login e poi usa i wallet
    async function signUpAndUseWallet() {
        const result = await core.signUp("newuser", "password123");
        if (result.success) {
            console.log("Registration successful");
            await useWalletPlugin();
        }
        else {
            console.log("Registration failed:", result.error);
        }
    }
    // Esegui l'esempio
    signUpAndUseWallet().catch(console.error);
}
// Esempi di utilizzo con Type Safety
function typeChecking() {
    const core = new index_1.ShogunCore({});
    const plugin = new index_1.WalletPlugin();
    plugin._category = index_1.PluginCategory.Wallet;
    core.register(plugin);
    // Type-safe access to plugin methods
    const typedPlugin = core.getPlugin("wallet");
    if (typedPlugin) {
        // Typescript riconosce tutti i metodi
        typedPlugin.generateNewMnemonic();
        typedPlugin.createWallet();
    }
    // Esempio di utilizzo del getPluginsByCategory
    const walletPlugins = core.getPluginsByCategory(index_1.PluginCategory.Wallet);
    console.log(`Found ${walletPlugins.length} wallet plugins`);
}
