/**
 * Rappresentazione semplificata di un post per le API client
 */
export interface Post {
  id: string;
  author: string;
  content: string;
  timestamp: number;

  // Campi opzionali
  title?: string;
  topic?: string; // Può contenere hashtag separati da un carattere (es. "#tech #news")
  attachment?: string; // URL o dati Base64 di qualsiasi allegato (immagine, file, ecc.)
  reference?: string;

  // Campi per interazioni
  likes?: Record<string, boolean>; // Utenti che hanno messo like
  comments?: Record<string, any>; // Commenti associati

  // Campi opzionali per struttura interna
  payload?: {
    content?: string;
    attachment?: string;
  };
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
  customFields: Record<string, string>; // Campi personalizzati - richiesto dallo schema
}

/**
 * Tipi di messaggio supportati
 */
export enum MessageType {
  POST = "post",
  DIRECT = "direct",
  NOTIFICATION = "notification",
  SYSTEM = "system",
}

/**
 * Sottotipi di messaggio
 */
export enum MessageSubtype {
  EMPTY = "",
  TEXT = "text",
  IMAGE = "image",
  LIKE = "like",
  COMMENT = "comment",
  FOLLOW = "follow",
}

/**
 * Messaggio generico per la timeline
 */
export interface Message {
  id: string;
  type: MessageType;
  subtype: MessageSubtype;
  creator: string;
  createdAt: number;
  payload: Record<string, any>;
}

/**
 * Messaggio tipo post per la timeline
 */
export interface PostMessage extends Message {
  type: MessageType.POST;
  payload: {
    content: string;
    attachment?: string;
  };
  likes?: Record<string, boolean>;
}

/**
 * Risultato della timeline
 */
export interface TimelineResult {
  messages: Message[];
  error?: string;
}

/**
 * Interfaccia per il plugin Social
 */
export interface SocialPluginInterface {
  /**
   * Crea un nuovo post
   * @param content Contenuto del post
   * @param options Opzioni aggiuntive (titolo, argomento, allegato, riferimento)
   * @returns Promise con il post creato o null in caso di errore
   */
  post(
    content: string,
    options?: {
      title?: string;
      topic?: string; // Può contenere hashtag (es. "#tech #news")
      attachment?: string;
      reference?: string;
    }
  ): Promise<Post | null>;

  /**
   * Mette like a un post
   * @param postId ID del post
   * @returns Promise con esito dell'operazione
   */
  likePost(postId: string): Promise<boolean>;

  /**
   * Rimuove il like da un post
   * @param postId ID del post
   * @returns Promise con esito dell'operazione
   */
  unlikePost(postId: string): Promise<boolean>;



  /**
   * Aggiunge un commento a un post
   * @param postId ID del post
   * @param content Contenuto del commento
   * @returns Promise con il commento creato o null in caso di errore
   */
  addComment(postId: string, content: string): Promise<Comment | null>;


  /**
   * Segue un utente
   * @param pub Identificativo pubblico dell'utente da seguire
   * @returns Promise con esito dell'operazione
   */
  follow(pub: string): Promise<boolean>;

  /**
   * Smette di seguire un utente
   * @param pub Identificativo pubblico dell'utente da non seguire più
   * @returns Promise con esito dell'operazione
   */
  unfollow(pub: string): Promise<boolean>;

  /**
   * Rilascia le risorse e pulisce le cache
   */
  cleanup(): void;


  storeMessage(message: Message): Promise<string>;
}


