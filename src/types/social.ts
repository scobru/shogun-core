/**
 * Configurazione per il Social Plugin
 */
export interface SocialConfig {
  cacheDuration: number;
}

/**
 * Entry di cache generica
 */
export interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

/**
 * Schema base di un messaggio sociale
 */
export interface SocialMessage {
  id: string; // ID univoco basato sul contenuto
  type: MessageType; // Tipo principale del messaggio
  subtype: MessageSubtype; // Sottotipo che descrive lo scopo secondario
  creator: string; // Identificativo dell'utente creatore (userPub)
  createdAt: number; // Timestamp Unix in secondi
  payload: any; // Oggetto contenente i dati specifici del messaggio
}

/**
 * Tipi principali di messaggio
 */
export enum MessageType {
  POST = "POST",
  PROFILE = "PROFILE",
  MODERATION = "MODERATION",
  CONNECTION = "CONNECTION",
  FILE = "FILE",
}

/**
 * Sottotipi di messaggio
 */
export enum MessageSubtype {
  // Post subtypes
  EMPTY = "",
  REPLY = "REPLY",
  REPOST = "REPOST",

  // Profile subtypes
  NICKNAME = "NICKNAME",
  BIO = "BIO",
  PROFILE_IMAGE = "PROFILE_IMAGE",
  CUSTOM = "CUSTOM",

  // Moderation subtypes
  LIKE = "LIKE",
  BLOCK = "BLOCK",

  // Connection subtypes
  FOLLOW = "FOLLOW",

  // File subtypes
  TORRENT = "TORRENT",
  IPFS = "IPFS",
}

/**
 * Messaggio di tipo Post
 */
export interface PostMessage extends SocialMessage {
  type: MessageType.POST;
  subtype: MessageSubtype.EMPTY | MessageSubtype.REPLY | MessageSubtype.REPOST;
  payload: {
    topic?: string; // Argomento del post per facilitare la scoperta
    title?: string; // Titolo del post
    content: string; // Contenuto in formato testo/markdown
    reference?: string; // ID del post a cui si fa riferimento (per reply/repost)
    attachment?: string; // URL o hash di un file allegato
  };
}

/**
 * Messaggio di tipo Moderation (like)
 */
export interface ModerationMessage extends SocialMessage {
  type: MessageType.MODERATION;
  subtype: MessageSubtype.LIKE | MessageSubtype.BLOCK;
  payload: {
    reference: string; // ID del messaggio a cui si applica la moderazione
  };
}

/**
 * Messaggio di tipo Connection (follow)
 */
export interface ConnectionMessage extends SocialMessage {
  type: MessageType.CONNECTION;
  subtype: MessageSubtype.FOLLOW | MessageSubtype.BLOCK;
  payload: {
    name: string; // Identificativo dell'utente da seguire/bloccare
  };
}

/**
 * Messaggio di tipo Profile
 */
export interface ProfileMessage extends SocialMessage {
  type: MessageType.PROFILE;
  subtype:
    | MessageSubtype.NICKNAME
    | MessageSubtype.BIO
    | MessageSubtype.PROFILE_IMAGE
    | MessageSubtype.CUSTOM;
  payload: {
    key?: string; // Chiave personalizzata (solo per CUSTOM)
    value: string; // Valore del dato di profilo
  };
}

/**
 * Messaggio di tipo File
 */
export interface FileMessage extends SocialMessage {
  type: MessageType.FILE;
  subtype: MessageSubtype.TORRENT | MessageSubtype.IPFS;
  payload: {
    name: string; // Nome del file
    mimeType: string; // Tipo MIME del file
    data: string; // URI magnetico o hash IPFS
  };
}

/**
 * Tipo unione di tutti i messaggi possibili
 */
export type Message =
  | PostMessage
  | ModerationMessage
  | ConnectionMessage
  | ProfileMessage
  | FileMessage;

/**
 * Rappresentazione semplificata di un post per le API client
 */
export interface Post {
  id: string;
  author: string;
  content: string;
  title?: string;
  topic?: string;
  attachment?: string;
  timestamp: number;
  reference?: string;
  hashtags?: Record<string, boolean>; // Oggetto hashtag per GunDB
  hashtagsList?: string[]; // Array di hashtag per uso interno
  imageData?: string; // Dati dell'immagine (base64 o URL)
}

/**
 * Rappresentazione semplificata di un commento per le API client
 */
export interface Comment {
  id: string;
  author: string;
  content: string;
  timestamp: number;
  postId: string;
}

/**
 * Struttura del profilo utente
 */
export interface UserProfile {
  pub: string; // Identificativo pubblico dell'utente
  alias?: string; // Nome visualizzato
  bio?: string; // Biografia
  profileImage?: string; // URL o hash dell'immagine profilo
  followers: string[]; // Array di userPub che seguono questo profilo
  following: string[]; // Array di userPub che questo profilo segue
  customFields?: Record<string, string>; // Campi personalizzati
}

/**
 * Risultato della timeline
 */
export interface TimelineResult {
  messages: Message[];
  error?: string;
}

/**
 * Interfaccia del Social Plugin
 */
export interface SocialPluginInterface {
  // Metodi per messaggi generici
  createMessage(message: Partial<Message>): Promise<Message | null>;
  getMessage(id: string): Promise<Message | null>;

  // Metodi per post
  createPost(
    content: string,
    title?: string,
    topic?: string,
    attachment?: string
  ): Promise<PostMessage | null>;
  replyToPost(postId: string, content: string): Promise<PostMessage | null>;
  repostMessage(postId: string, comment?: string): Promise<PostMessage | null>;

  // Post con immagine
  postWithImage(content: string, imageData: string): Promise<Post | null>;

  // Ricerca per hashtag
  searchByHashtag(hashtag: string): Promise<Post[]>;

  // Eliminazione post
  deletePost(postId: string): Promise<boolean>;

  // Metodi per like e moderazione
  likeMessage(messageId: string): Promise<boolean>;
  unlikeMessage(messageId: string): Promise<boolean>;
  getLikes(messageId: string): Promise<string[]>;

  // Metodi per profili e connessioni
  getProfile(pub: string): Promise<UserProfile>;
  updateProfile(
    field: MessageSubtype,
    value: string,
    key?: string
  ): Promise<boolean>;
  follow(pub: string): Promise<boolean>;
  unfollow(pub: string): Promise<boolean>;

  // Timeline e ricerca
  getTimeline(): Promise<TimelineResult>;
  getMessagesByType(
    type: MessageType,
    subtype?: MessageSubtype
  ): Promise<Message[]>;

  // Utilità
  cleanup(): void;
}
