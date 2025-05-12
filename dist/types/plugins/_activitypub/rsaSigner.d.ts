import Gun from "gun";
import "gun/sea";
export type RSAKeyPair = {
    publicKey: string;
    privateKey: string;
};
export declare class RsaSigner {
    private gun;
    private user;
    constructor(gun: typeof Gun, user: any);
    init(): Promise<void>;
    private generateRSAKeyPair;
    private arrayBufferToPem;
    private storeEncryptedKeyPair;
    private getStoredKeys;
    signHttpRequest(headers: Record<string, string>, requestTarget: string): Promise<string>;
    private importPrivateKey;
    createActivity(type: string, actorId: string, object: any): Promise<any>;
    createNote(actorId: string, content: string): Promise<any>;
    createFollow(actorId: string, target: string): Promise<any>;
    createUndoFollow(actorId: string, followActivity: any): Promise<any>;
    createLike(actorId: string, object: string): Promise<any>;
    createUndoLike(actorId: string, likeActivity: any): Promise<any>;
    createAnnounce(actorId: string, object: string): Promise<any>;
    createDelete(actorId: string, object: string): Promise<any>;
}
export declare class ActivityPubClient {
    private signer;
    constructor(signer: RsaSigner);
    sendActivity(actorId: string, targetInbox: string, activity: any): Promise<void>;
    private digestBody;
}
