import { DoubleRatchetState, MessageEnvelope } from "./types";
export declare const initializeDoubleRatchet: (sharedSecret: ArrayBuffer, isInitiator: boolean, remotePublicKey?: CryptoKey | null, x3dhEphemeralPublic?: ArrayBuffer) => Promise<DoubleRatchetState>;
export declare const doubleRatchetEncrypt: (state: DoubleRatchetState, plaintext: string) => Promise<MessageEnvelope>;
export declare const doubleRatchetDecrypt: (state: DoubleRatchetState, messageEnvelope: MessageEnvelope) => Promise<string>;
export declare const serializeDoubleRatchetState: (state: DoubleRatchetState) => Promise<string>;
export declare const cleanupSkippedMessageKeys: (state: DoubleRatchetState, maxAge?: number) => void;
export declare const demonstrateDoubleRatchet: () => Promise<{
    success: boolean;
    aliceState: string;
    bobState: string;
    conversation: {
        from: string;
        envelope: MessageEnvelope;
    }[];
    messagesExchanged: number;
    demonstration: {
        forwardSecrecy: boolean;
        outOfOrderHandling: boolean;
        dhRatcheting: boolean;
        chainKeyUpdating: boolean;
    };
}>;
