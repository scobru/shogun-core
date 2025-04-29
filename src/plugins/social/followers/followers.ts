import { logDebug, logError, logWarn } from "../../../utils/logger";
import { EventEmitter } from "../../../utils/eventEmitter";
import { IGunInstance } from "gun";


/**
 * Service dedicato alle operazioni di follow/unfollow tra utenti
 */
export class Followers extends EventEmitter {
  private readonly gun: IGunInstance<any>;

  constructor(gunInstance: IGunInstance<any>) {
    super();
    this.gun = gunInstance;
  }

  /**
   * Segui un altro utente
   * @param targetPub Chiave pubblica dell'utente da seguire
   * @returns true se l'operazione è riuscita
   */
  public async follow(targetPub: string): Promise<boolean> {
    const user = this.gun.user();
    
    if (!user.is || !user.is.pub) {
      throw new Error("Non autenticato");
    }

    if (targetPub === user.is.pub) {
      logWarn("Non puoi seguire te stesso");
      return false;
    }

    try {
      const userPub = user.is.pub;
      logDebug(`Follow: ${userPub} → ${targetPub}`);

      // Aggiungi alla lista "following" dell'utente corrente
      await new Promise<void>((resolve, reject) => {
        this.gun
          .user()
          .get("following")
          .get(targetPub)
          .put(true, (ack: any) => {
            if (ack.err) reject(new Error(ack.err));
            else resolve();
          });
      });

      // Aggiungi alla lista "followers" dell'utente target
      await new Promise<void>((resolve, reject) => {
        this.gun
          .user(targetPub)
          .get("followers")
          .get(userPub)
          .put(true, (ack: any) => {
            if (ack.err) reject(new Error(ack.err));
            else resolve();
          });
      });

      // Notifica
      this.emit("follow", targetPub);

      return true;
    } catch (err) {
      logError(`Errore follow: ${err}`);
      return false;
    }
  }

  /**
   * Smetti di seguire un utente
   * @param targetPub Chiave pubblica dell'utente da smettere di seguire
   * @returns true se l'operazione è riuscita
   */
  public async unfollow(targetPub: string): Promise<boolean> {
    const user = this.gun.user();
    
    if (!user.is || !user.is.pub) {
      throw new Error("Non autenticato");
    }

    if (targetPub === user.is.pub) {
      logWarn("Non puoi smettere di seguire te stesso");
      return false;
    }

    try {
      const userPub = user.is.pub;
      logDebug(`Unfollow: ${userPub} ⊘ ${targetPub}`);

      // Rimuovi dalla lista "following" dell'utente corrente
      await new Promise<void>((resolve) => {
        this.gun
          .user()
          .get("following")
          .get(targetPub)
          .put(null, () => resolve());
      });

      // Rimuovi dalla lista "followers" dell'utente target
      await new Promise<void>((resolve) => {
        this.gun
          .user(targetPub)
          .get("followers")
          .get(userPub)
          .put(null, () => resolve());
      });

      // Notifica
      this.emit("unfollow", targetPub);

      return true;
    } catch (err) {
      logError(`Errore unfollow: ${err}`);
      return false;
    }
  }

  /**
   * Ottieni la lista dei follower di un utente
   * @param pub Chiave pubblica dell'utente
   * @returns Array di pub keys dei follower
   */
  public async getFollowers(pub: string): Promise<string[]> {
    const followers: string[] = [];
    
    await new Promise<void>((resolve) => {
      this.gun
        .user(pub)
        .get("followers")
        .map()
        .once((val: any, key: string) => {
          if (key !== "_" && val === true) {
            followers.push(key);
          }
        });
      setTimeout(resolve, 500);
    });
    
    return followers;
  }

  /**
   * Ottieni la lista degli utenti seguiti da un utente
   * @param pub Chiave pubblica dell'utente
   * @returns Array di pub keys degli utenti seguiti
   */
  public async getFollowing(pub: string): Promise<string[]> {
    const following: string[] = [];
    
    await new Promise<void>((resolve) => {
      this.gun
        .user(pub)
        .get("following")
        .map()
        .once((val: any, key: string) => {
          if (key !== "_" && val === true) {
            following.push(key);
          }
        });
      setTimeout(resolve, 500);
    });
    
    return following;
  }
}
