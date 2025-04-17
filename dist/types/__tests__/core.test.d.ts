declare const PluginCategory: {
    Authentication: string;
    Wallet: string;
    Storage: string;
    DID: string;
    General: string;
};
declare class ShogunCore {
    static API_VERSION: string;
    constructor(config: any);
    on(eventName: any, listener: any): this;
    off(eventName: any, listener: any): this;
    removeAllListeners(eventName: any): this;
    emit(eventName: any, data: any): boolean;
    register(plugin: any): void;
    unregister(pluginName: any): void;
    hasPlugin(name: any): any;
    getPlugin(name: any): any;
    getPluginsByCategory(category: any): any[];
    configureLogging(config: any): void;
    isLoggedIn(): boolean;
}
