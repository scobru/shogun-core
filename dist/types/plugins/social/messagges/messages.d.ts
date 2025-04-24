import { IGunInstance } from "gun";
import { Observable } from "rxjs";
interface OperationCallbackResponse {
    errMessage?: string;
    errCode?: string;
    success?: string;
    chat?: any;
}
type OperationCallback = (response: OperationCallbackResponse) => void;
export interface ChatEntity {
    roomId: string;
    pub: string;
    latestMessage: any;
}
export interface MessageBatch {
    initial: any[];
    individual?: any;
}
export declare class MessageService {
    private gun;
    private currentUser;
    chatsList$: Observable<ChatEntity>;
    constructor(gunInstance: IGunInstance);
    createChat(publicKey: string, callback?: OperationCallback): void;
    messageList(roomId: string, pub: string): Observable<MessageBatch>;
    sendMessage(roomId: string, publicKey: string, message: string, callback?: OperationCallback): void;
    sendVoiceMessage(roomId: string, publicKey: string, voiceRecording: any, callback?: OperationCallback): void;
}
export {};
