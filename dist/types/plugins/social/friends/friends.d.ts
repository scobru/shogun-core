import { Observable } from "rxjs";
import { IGunInstance } from "gun";
interface OperationCallbackResponse {
    errMessage?: string;
    errCode?: string;
    success?: string;
}
type OperationCallback = (response: OperationCallbackResponse) => void;
export interface FriendEntity {
    key: string;
    pub: string;
    alias: string;
    displayName?: string;
    about?: string;
}
export declare class FriendService {
    private readonly gun;
    private readonly currentUser;
    private readonly certificateManager;
    friendRequests$: Observable<FriendEntity | undefined>;
    friendsList$: Observable<FriendEntity | undefined>;
    constructor(gunInstance: IGunInstance);
    addFriendRequest(publicKey: string, callback?: OperationCallback): void;
    acceptFriendRequest(params: {
        key: string;
        publicKey: string;
    }, callback?: OperationCallback): void;
    rejectFriendRequest(key: string, callback?: OperationCallback): void;
}
export {};
