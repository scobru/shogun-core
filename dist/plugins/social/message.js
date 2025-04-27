"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrivateMessage = exports.PrivateMessageSubType = exports.Profile = exports.ProfileMessageSubType = exports.Connection = exports.ConnectionMessageSubType = exports.Moderation = exports.ModerationMessageSubType = exports.Post = exports.PostMessageSubType = exports.Message = exports.MessageType = void 0;
exports.parseMessageId = parseMessageId;
const crypto_1 = __importDefault(require("crypto"));
var MessageType;
(function (MessageType) {
    MessageType["_TWEET"] = "@TWEET@";
    MessageType["Post"] = "POST";
    MessageType["Moderation"] = "MODERATION";
    MessageType["Profile"] = "PROFILE";
    MessageType["Connection"] = "CONNECTION";
    MessageType["File"] = "FILE";
    MessageType["Private"] = "PRIVATE";
})(MessageType || (exports.MessageType = MessageType = {}));
class Message {
    type;
    creator;
    createdAt;
    static getType(type) {
        switch (type.toUpperCase()) {
            case 'POST':
                return MessageType.Post;
            case 'CONNECTION':
                return MessageType.Connection;
            case 'FILE':
                return MessageType.File;
            case 'PROFILE':
                return MessageType.Profile;
            case 'MODERATION':
                return MessageType.Moderation;
            case 'PRIVATE':
                return MessageType.Private;
            default:
                return null;
        }
    }
    constructor(opt) {
        this.type = opt.type;
        this.creator = opt.creator || '';
        this.createdAt = opt.createdAt || new Date();
    }
    toJSON() {
        throw new Error('toJSON is not implemented');
    }
    toHex() {
        throw new Error('toHex is not implemented');
    }
}
exports.Message = Message;
var PostMessageSubType;
(function (PostMessageSubType) {
    PostMessageSubType["Default"] = "";
    PostMessageSubType["Repost"] = "REPOST";
    PostMessageSubType["Reply"] = "REPLY";
    PostMessageSubType["MirrorPost"] = "M_POST";
    PostMessageSubType["MirrorReply"] = "M_REPLY";
})(PostMessageSubType || (exports.PostMessageSubType = PostMessageSubType = {}));
class Post extends Message {
    subtype;
    payload;
    tweetId;
    static fromHex(hex) {
        let d = hex;
        const [type] = decodeString(d, 2, cb);
        const [subtype] = decodeString(d, 2, cb);
        const [creator] = decodeString(d, 3, cb);
        const [createdAt] = decodeNumber(d, 12, cb);
        const [topic] = decodeString(d, 3, cb);
        const [title] = decodeString(d, 3, cb);
        const [content] = decodeString(d, 6, cb);
        const [reference] = decodeString(d, 3, cb);
        const [attachment] = decodeString(d, 3, cb);
        return new Post({
            type: type,
            subtype: subtype,
            creator,
            createdAt: new Date(createdAt),
            payload: {
                topic,
                title,
                content,
                reference,
                attachment,
            },
        });
        function cb(n) {
            d = d.slice(n);
        }
    }
    static getSubtype(subtype) {
        switch (subtype) {
            case '':
                return PostMessageSubType.Default;
            case 'REPLY':
                return PostMessageSubType.Reply;
            case 'REPOST':
                return PostMessageSubType.Repost;
            case 'M_POST':
                return PostMessageSubType.MirrorPost;
            case 'M_REPLY':
                return PostMessageSubType.MirrorReply;
            default:
                return PostMessageSubType.Default;
        }
    }
    constructor(opt) {
        super(opt);
        this.type = opt.type === MessageType._TWEET ? MessageType._TWEET : MessageType.Post;
        this.tweetId = opt.type === MessageType._TWEET ? opt.hash : undefined;
        this.subtype = Post.getSubtype(opt.subtype);
        this.payload = {
            topic: opt.payload.topic || '',
            title: opt.payload.title || '',
            content: opt.payload.content || '',
            reference: opt.payload.reference || '',
            attachment: opt.payload.attachment || '',
        };
    }
    hash() {
        if (this.tweetId)
            return this.tweetId;
        return crypto_1.default.createHash('sha256').update(this.toHex()).digest('hex');
    }
    toJSON() {
        const hash = this.hash();
        return {
            messageId: this.creator ? `${this.creator}/${hash}` : hash,
            hash: hash,
            type: this.type,
            subtype: this.subtype,
            createdAt: this.createdAt.getTime(),
            payload: this.payload,
        };
    }
    toHex() {
        const type = encodeString(this.type, 2);
        const subtype = encodeString(this.subtype, 2);
        const creator = encodeString(this.creator, 3);
        const createdAt = encodeNumber(this.createdAt.getTime(), 12);
        const topic = encodeString(this.payload.topic, 3);
        const title = encodeString(this.payload.title, 3);
        const content = encodeString(this.payload.content, 6);
        const reference = encodeString(this.payload.reference, 3);
        const attachment = encodeString(this.payload.attachment, 3);
        return type + subtype + creator + createdAt + topic + title + content + reference + attachment;
    }
}
exports.Post = Post;
var ModerationMessageSubType;
(function (ModerationMessageSubType) {
    ModerationMessageSubType["Like"] = "LIKE";
    ModerationMessageSubType["Block"] = "BLOCK";
    ModerationMessageSubType["ThreadBlock"] = "THREAD_HIDE_BLOCK";
    ModerationMessageSubType["ThreadFollow"] = "THREAD_SHOW_FOLLOW";
    ModerationMessageSubType["ThreadMention"] = "THREAD_ONLY_MENTION";
    ModerationMessageSubType["Global"] = "GLOBAL";
    ModerationMessageSubType["Default"] = "";
})(ModerationMessageSubType || (exports.ModerationMessageSubType = ModerationMessageSubType = {}));
class Moderation extends Message {
    subtype;
    payload;
    static fromHex(hex) {
        let d = hex;
        const [type] = decodeString(d, 2, cb);
        const [subtype] = decodeString(d, 2, cb);
        const [creator] = decodeString(d, 3, cb);
        const [createdAt] = decodeNumber(d, 12, cb);
        const [reference] = decodeString(d, 3, cb);
        return new Moderation({
            type: type,
            subtype: subtype,
            creator,
            createdAt: new Date(createdAt),
            payload: {
                reference,
            },
        });
        function cb(n) {
            d = d.slice(n);
        }
    }
    static getSubtype(subtype) {
        switch (subtype) {
            case 'LIKE':
                return ModerationMessageSubType.Like;
            case 'BLOCK':
                return ModerationMessageSubType.Block;
            case 'THREAD_HIDE_BLOCK':
                return ModerationMessageSubType.ThreadBlock;
            case 'THREAD_SHOW_FOLLOW':
                return ModerationMessageSubType.ThreadFollow;
            case 'THREAD_ONLY_MENTION':
                return ModerationMessageSubType.ThreadMention;
            case 'GLOBAL':
                return ModerationMessageSubType.Global;
            default:
                return ModerationMessageSubType.Default;
        }
    }
    constructor(opt) {
        super(opt);
        this.type = MessageType.Moderation;
        this.subtype = Moderation.getSubtype(opt.subtype);
        this.payload = {
            reference: opt.payload.reference || '',
        };
    }
    hash() {
        return crypto_1.default.createHash('sha256').update(this.toHex()).digest('hex');
    }
    toJSON() {
        const hash = this.hash();
        return {
            messageId: `${this.creator}/${hash}`,
            hash: hash,
            type: this.type,
            subtype: this.subtype,
            createdAt: this.createdAt.getTime(),
            payload: this.payload,
        };
    }
    toHex() {
        const type = encodeString(this.type, 2);
        const subtype = encodeString(this.subtype, 2);
        const creator = encodeString(this.creator, 3);
        const createdAt = encodeNumber(this.createdAt.getTime(), 12);
        const reference = encodeString(this.payload.reference, 3);
        return type + subtype + creator + createdAt + reference;
    }
}
exports.Moderation = Moderation;
var ConnectionMessageSubType;
(function (ConnectionMessageSubType) {
    ConnectionMessageSubType["Follow"] = "FOLLOW";
    ConnectionMessageSubType["Block"] = "BLOCK";
    ConnectionMessageSubType["MemberInvite"] = "MEMBER_INVITE";
    ConnectionMessageSubType["MemberAccept"] = "MEMBER_ACCEPT";
    ConnectionMessageSubType["Default"] = "";
})(ConnectionMessageSubType || (exports.ConnectionMessageSubType = ConnectionMessageSubType = {}));
class Connection extends Message {
    type;
    subtype;
    payload;
    static fromHex(hex) {
        let d = hex;
        const [type] = decodeString(d, 2, cb);
        const [subtype] = decodeString(d, 2, cb);
        const [creator] = decodeString(d, 3, cb);
        const [createdAt] = decodeNumber(d, 12, cb);
        const [name] = decodeString(d, 3, cb);
        return new Connection({
            type: type,
            subtype: subtype,
            creator,
            createdAt: new Date(createdAt),
            payload: {
                name,
            },
        });
        function cb(n) {
            d = d.slice(n);
        }
    }
    static getSubtype(subtype) {
        switch (subtype) {
            case 'FOLLOW':
                return ConnectionMessageSubType.Follow;
            case 'BLOCK':
                return ConnectionMessageSubType.Block;
            case 'MEMBER_INVITE':
                return ConnectionMessageSubType.MemberInvite;
            case 'MEMBER_ACCEPT':
                return ConnectionMessageSubType.MemberAccept;
            default:
                return ConnectionMessageSubType.Default;
        }
    }
    constructor(opt) {
        super(opt);
        this.type = MessageType.Connection;
        this.subtype = Connection.getSubtype(opt.subtype);
        this.payload = {
            name: opt.payload.name,
        };
    }
    hash() {
        return crypto_1.default.createHash('sha256').update(this.toHex()).digest('hex');
    }
    toJSON() {
        const hash = this.hash();
        return {
            messageId: `${this.creator}/${hash}`,
            hash: hash,
            type: this.type,
            subtype: this.subtype,
            createdAt: this.createdAt.getTime(),
            payload: this.payload,
        };
    }
    toHex() {
        const type = encodeString(this.type, 2);
        const subtype = encodeString(this.subtype, 2);
        const creator = encodeString(this.creator, 3);
        const createdAt = encodeNumber(this.createdAt.getTime(), 12);
        const name = encodeString(this.payload.name, 3);
        return type + subtype + creator + createdAt + name;
    }
}
exports.Connection = Connection;
var ProfileMessageSubType;
(function (ProfileMessageSubType) {
    ProfileMessageSubType["Default"] = "";
    ProfileMessageSubType["Name"] = "NAME";
    ProfileMessageSubType["Bio"] = "BIO";
    ProfileMessageSubType["ProfileImage"] = "PROFILE_IMAGE";
    ProfileMessageSubType["CoverImage"] = "COVER_IMAGE";
    ProfileMessageSubType["Website"] = "WEBSITE";
    ProfileMessageSubType["TwitterVerification"] = "TWT_VERIFICATION";
    ProfileMessageSubType["Group"] = "GROUP";
    ProfileMessageSubType["Custom"] = "CUSTOM";
})(ProfileMessageSubType || (exports.ProfileMessageSubType = ProfileMessageSubType = {}));
class Profile extends Message {
    subtype;
    payload;
    static fromHex(hex) {
        let d = hex;
        const [type] = decodeString(d, 2, cb);
        const [subtype] = decodeString(d, 2, cb);
        const [creator] = decodeString(d, 3, cb);
        const [createdAt] = decodeNumber(d, 12, cb);
        const [key] = decodeString(d, 3, cb);
        const [value] = decodeString(d, 3, cb);
        return new Profile({
            type: type,
            subtype: subtype,
            creator,
            createdAt: new Date(createdAt),
            payload: {
                key,
                value,
            },
        });
        function cb(n) {
            d = d.slice(n);
        }
    }
    static getSubtype(subtype) {
        switch (subtype) {
            case 'NAME':
                return ProfileMessageSubType.Name;
            case 'PROFILE_IMAGE':
                return ProfileMessageSubType.ProfileImage;
            case 'COVER_IMAGE':
                return ProfileMessageSubType.CoverImage;
            case 'TWT_VERIFICATION':
                return ProfileMessageSubType.TwitterVerification;
            case 'BIO':
                return ProfileMessageSubType.Bio;
            case 'WEBSITE':
                return ProfileMessageSubType.Website;
            case 'GROUP':
                return ProfileMessageSubType.Group;
            case 'CUSTOM':
                return ProfileMessageSubType.Custom;
            default:
                return ProfileMessageSubType.Default;
        }
    }
    constructor(opt) {
        super(opt);
        this.type = MessageType.Profile;
        this.subtype = Profile.getSubtype(opt.subtype);
        this.payload = {
            key: opt.payload.key || '',
            value: opt.payload.value || '',
        };
    }
    hash() {
        return crypto_1.default.createHash('sha256').update(this.toHex()).digest('hex');
    }
    toJSON() {
        const hash = this.hash();
        return {
            messageId: `${this.creator}/${hash}`,
            hash: hash,
            type: this.type,
            subtype: this.subtype,
            createdAt: this.createdAt.getTime(),
            payload: this.payload,
        };
    }
    toHex() {
        const type = encodeString(this.type, 2);
        const subtype = encodeString(this.subtype, 2);
        const creator = encodeString(this.creator, 3);
        const createdAt = encodeNumber(this.createdAt.getTime(), 12);
        const key = encodeString(this.payload.key, 3);
        const value = encodeString(this.payload.value, 3);
        return type + subtype + creator + createdAt + key + value;
    }
}
exports.Profile = Profile;
var PrivateMessageSubType;
(function (PrivateMessageSubType) {
    PrivateMessageSubType["Direct"] = "DIRECT";
    PrivateMessageSubType["GroupChat"] = "GROUP_CHAT";
    PrivateMessageSubType["SystemNotification"] = "SYSTEM";
    PrivateMessageSubType["ReadReceipt"] = "READ_RECEIPT";
    PrivateMessageSubType["Default"] = "";
})(PrivateMessageSubType || (exports.PrivateMessageSubType = PrivateMessageSubType = {}));
class PrivateMessage extends Message {
    subtype;
    payload;
    static fromHex(hex) {
        let d = hex;
        const [type] = decodeString(d, 2, cb);
        const [subtype] = decodeString(d, 2, cb);
        const [creator] = decodeString(d, 3, cb);
        const [createdAt] = decodeNumber(d, 12, cb);
        const [recipient] = decodeString(d, 3, cb);
        const [content] = decodeString(d, 6, cb);
        const [isEncryptedStr] = decodeString(d, 1, cb);
        const isEncrypted = isEncryptedStr === '1';
        const [metadataStr] = decodeString(d, 6, cb);
        let metadata = {};
        try {
            metadata = JSON.parse(metadataStr);
        }
        catch (e) {
            // Invalid metadata, use empty object
        }
        return new PrivateMessage({
            type: type,
            subtype: subtype,
            creator,
            createdAt: new Date(createdAt),
            payload: {
                recipient,
                content,
                isEncrypted,
                metadata
            },
        });
        function cb(n) {
            d = d.slice(n);
        }
    }
    static getSubtype(subtype) {
        switch (subtype) {
            case 'DIRECT':
                return PrivateMessageSubType.Direct;
            case 'GROUP_CHAT':
                return PrivateMessageSubType.GroupChat;
            case 'SYSTEM':
                return PrivateMessageSubType.SystemNotification;
            case 'READ_RECEIPT':
                return PrivateMessageSubType.ReadReceipt;
            default:
                return PrivateMessageSubType.Default;
        }
    }
    constructor(opt) {
        super(opt);
        this.type = MessageType.Private;
        this.subtype = PrivateMessage.getSubtype(opt.subtype);
        this.payload = {
            recipient: opt.payload.recipient,
            recipients: opt.payload.recipients || [],
            content: opt.payload.content || '',
            isEncrypted: opt.payload.isEncrypted || false,
            metadata: opt.payload.metadata || {}
        };
    }
    hash() {
        return crypto_1.default.createHash('sha256').update(this.toHex()).digest('hex');
    }
    toJSON() {
        const hash = this.hash();
        return {
            messageId: `${this.creator}/${hash}`,
            hash: hash,
            type: this.type,
            subtype: this.subtype,
            createdAt: this.createdAt.getTime(),
            payload: this.payload,
        };
    }
    toHex() {
        const type = encodeString(this.type, 2);
        const subtype = encodeString(this.subtype, 2);
        const creator = encodeString(this.creator, 3);
        const createdAt = encodeNumber(this.createdAt.getTime(), 12);
        const recipient = encodeString(this.payload.recipient, 3);
        const content = encodeString(this.payload.content, 6);
        const isEncrypted = encodeString(this.payload.isEncrypted ? '1' : '0', 1);
        const metadata = encodeString(JSON.stringify(this.payload.metadata || {}), 6);
        return type + subtype + creator + createdAt + recipient + content + isEncrypted + metadata;
    }
}
exports.PrivateMessage = PrivateMessage;
function encodeString(str, maxBytes) {
    const hex = Buffer.from(str, 'utf-8').toString('hex');
    const len = hex.length;
    const hexlen = len.toString(16).padStart(maxBytes, '0');
    return `${hexlen}${hex}`;
}
function decodeString(data, maxBytes, cb) {
    const lenHex = data.slice(0, maxBytes);
    const len = parseInt(lenHex, 16);
    const str = data.slice(maxBytes, maxBytes + len);
    cb && cb(maxBytes + len);
    return [Buffer.from(str, 'hex').toString('utf-8'), maxBytes + len];
}
function encodeNumber(num, maxBytes) {
    return num.toString(16).padStart(maxBytes, '0');
}
function decodeNumber(data, maxBytes, cb) {
    const hex = data.slice(0, maxBytes);
    cb && cb(maxBytes);
    return [parseInt(hex, 16), maxBytes];
}
const HEX_64_REGEX = /\b[A-Fa-f0-9]{64}$\b/;
function parseMessageId(id) {
    const parsed = id.split('/');
    let hash = '', creator = '';
    if (parsed.length > 2) {
        return {
            hash: '',
            creator: '',
        };
    }
    if (parsed.length === 2) {
        creator = parsed[0];
        hash = parsed[1];
    }
    if (parsed.length === 1) {
        hash = parsed[0];
    }
    if (!hash || !HEX_64_REGEX.test(hash)) {
        return {
            hash: '',
            creator: '',
        };
    }
    return {
        creator,
        hash,
    };
}
