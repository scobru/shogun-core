import {
  SocialConfig,
  UserProfile,
  TimelineResult,
  Post,
  Comment,
} from "../../types/social";

/**
 * Interfaccia per il plugin Social
 */
export interface SocialPluginInterface {
  /**
   * Ottiene il profilo di un utente
   * @param pub Identificativo pubblico dell'utente
   * @returns Promise con il profilo utente
   */
  getProfile(pub: string): Promise<UserProfile>;

  /**
   * Crea un nuovo post
   * @param content Contenuto del post
   * @returns Promise con il post creato o null in caso di errore
   */
  post(content: string): Promise<Post | null>;

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
   * Ottiene i like di un post
   * @param postId ID del post
   * @returns Promise con lista di ID utenti che hanno messo like
   */
  getLikes(postId: string): Promise<string[]>;

  /**
   * Aggiunge un commento a un post
   * @param postId ID del post
   * @param content Contenuto del commento
   * @returns Promise con il commento creato o null in caso di errore
   */
  addComment(postId: string, content: string): Promise<Comment | null>;

  /**
   * Ottiene i commenti di un post
   * @param postId ID del post
   * @returns Promise con lista di commenti
   */
  getComments(postId: string): Promise<Comment[]>;

  /**
   * Ottiene la timeline dell'utente
   * @returns Promise con il risultato della timeline
   */
  getTimeline(): Promise<TimelineResult>;

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
}
