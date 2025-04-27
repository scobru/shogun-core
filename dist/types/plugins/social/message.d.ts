export declare enum MessageType {
    _TWEET = "@TWEET@",
    Post = "POST",
    Moderation = "MODERATION",
    Profile = "PROFILE",
    Connection = "CONNECTION",
    File = "FILE",
    Private = "PRIVATE"
}
export type MessageOption = {
    type: MessageType;
    creator?: string;
    createdAt?: Date;
};
export declare class Message {
    type: MessageType;
    creator: string;
    createdAt: Date;
    static getType(type: string): MessageType | null;
    constructor(opt: MessageOption);
    toJSON(): void;
    toHex(): void;
}
export declare enum PostMessageSubType {
    Default = "",
    Repost = "REPOST",
    Reply = "REPLY",
    MirrorPost = "M_POST",
    MirrorReply = "M_REPLY"
}
export type PostMessagePayload = {
    topic: string;
    title: string;
    content: string;
    reference: string;
    attachment: string;
};
export type PostJSON = {
    type: MessageType;
    messageId: string;
    hash: string;
    createdAt: number;
    subtype: PostMessageSubType;
    payload: PostMessagePayload;
    meta?: any;
};
export type PostMessageOption = {
    subtype: PostMessageSubType;
    payload: {
        topic?: string;
        title?: string;
        content?: string;
        reference?: string;
        attachment?: string;
    };
    hash?: string;
} & MessageOption;
export declare class Post extends Message {
    subtype: PostMessageSubType;
    payload: PostMessagePayload;
    tweetId?: string;
    static fromHex(hex: string): Post;
    static getSubtype(subtype: string): PostMessageSubType;
    constructor(opt: PostMessageOption);
    hash(): string;
    toJSON(): PostJSON;
    toHex(): string;
}
export declare enum ModerationMessageSubType {
    Like = "LIKE",
    Block = "BLOCK",
    ThreadBlock = "THREAD_HIDE_BLOCK",
    ThreadFollow = "THREAD_SHOW_FOLLOW",
    ThreadMention = "THREAD_ONLY_MENTION",
    Global = "GLOBAL",
    Default = ""
}
export type ModerationMessagePayload = {
    reference: string;
};
export type ModerationJSON = {
    type: MessageType;
    messageId: string;
    hash: string;
    createdAt: number;
    subtype: ModerationMessageSubType;
    payload: ModerationMessagePayload;
};
export type ModerationMessageOption = {
    subtype: ModerationMessageSubType;
    payload: {
        reference?: string;
    };
} & MessageOption;
export declare class Moderation extends Message {
    subtype: ModerationMessageSubType;
    payload: ModerationMessagePayload;
    static fromHex(hex: string): Moderation;
    static getSubtype(subtype: string): ModerationMessageSubType;
    constructor(opt: ModerationMessageOption);
    hash(): string;
    toJSON(): ModerationJSON;
    toHex(): string;
}
export declare enum ConnectionMessageSubType {
    Follow = "FOLLOW",
    Block = "BLOCK",
    MemberInvite = "MEMBER_INVITE",
    MemberAccept = "MEMBER_ACCEPT",
    Default = ""
}
export type ConnectionMessagePayload = {
    name: string;
};
export type ConnectionJSON = {
    type: MessageType;
    messageId: string;
    hash: string;
    createdAt: number;
    subtype: ConnectionMessageSubType;
    payload: ConnectionMessagePayload;
};
export type ConnectionMessageOption = {
    subtype: ConnectionMessageSubType;
    payload: {
        name: string;
    };
} & MessageOption;
export declare class Connection extends Message {
    type: MessageType.Connection;
    subtype: ConnectionMessageSubType;
    payload: ConnectionMessagePayload;
    static fromHex(hex: string): Connection;
    static getSubtype(subtype: string): ConnectionMessageSubType;
    constructor(opt: ConnectionMessageOption);
    hash(): string;
    toJSON(): ConnectionJSON;
    toHex(): string;
}
export declare enum ProfileMessageSubType {
    Default = "",
    Name = "NAME",
    Bio = "BIO",
    ProfileImage = "PROFILE_IMAGE",
    CoverImage = "COVER_IMAGE",
    Website = "WEBSITE",
    TwitterVerification = "TWT_VERIFICATION",
    Group = "GROUP",
    Custom = "CUSTOM"
}
export type ProfileMessagePayload = {
    key: string;
    value: string;
};
export type ProfileJSON = {
    type: MessageType;
    messageId: string;
    hash: string;
    createdAt: number;
    subtype: ProfileMessageSubType;
    payload: ProfileMessagePayload;
};
export type ProfileMessageOption = {
    subtype: ProfileMessageSubType;
    payload: {
        key?: string;
        value?: string;
    };
} & MessageOption;
export declare class Profile extends Message {
    subtype: ProfileMessageSubType;
    payload: ProfileMessagePayload;
    static fromHex(hex: string): Profile;
    static getSubtype(subtype: string): ProfileMessageSubType;
    constructor(opt: ProfileMessageOption);
    hash(): string;
    toJSON(): ProfileJSON;
    toHex(): string;
}
export declare enum PrivateMessageSubType {
    Direct = "DIRECT",
    GroupChat = "GROUP_CHAT",
    SystemNotification = "SYSTEM",
    ReadReceipt = "READ_RECEIPT",
    Default = ""
}
export type PrivateMessagePayload = {
    recipient: string;
    recipients?: string[];
    content: string;
    isEncrypted: boolean;
    metadata?: {
        attachmentType?: string;
        attachmentUrl?: string;
        replyToId?: string;
    };
};
export type PrivateJSON = {
    type: MessageType;
    messageId: string;
    hash: string;
    createdAt: number;
    subtype: PrivateMessageSubType;
    payload: PrivateMessagePayload;
};
export type PrivateMessageOption = {
    subtype: PrivateMessageSubType;
    payload: {
        recipient: string;
        recipients?: string[];
        content: string;
        isEncrypted?: boolean;
        metadata?: {
            attachmentType?: string;
            attachmentUrl?: string;
            replyToId?: string;
        };
    };
} & MessageOption;
export declare class PrivateMessage extends Message {
    subtype: PrivateMessageSubType;
    payload: PrivateMessagePayload;
    static fromHex(hex: string): PrivateMessage;
    static getSubtype(subtype: string): PrivateMessageSubType;
    constructor(opt: PrivateMessageOption);
    hash(): string;
    toJSON(): PrivateJSON;
    toHex(): string;
}
export declare function parseMessageId(id: string): {
    hash: string;
    creator: string;
};
