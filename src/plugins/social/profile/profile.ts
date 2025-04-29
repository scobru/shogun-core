import { logDebug, logError } from "../../../utils/logger";
import { EventEmitter } from "../../../utils/eventEmitter";
import { IGunInstance } from "gun";
import { UserProfile } from "../types";

/**
 * Service dedicato alla gestione dei profili utente
 */
export class Profile extends EventEmitter {
  private readonly gun: IGunInstance<any>;
  private readonly profileCache = new Map<
    string,
    { data: UserProfile; timestamp: number }
  >();
  private readonly cacheDuration = 5 * 60 * 1000; // 5 minuti

  constructor(gunInstance: IGunInstance<any>) {
    super();
    this.gun = gunInstance;
  }

  /**
   * Ottieni il profilo di un utente
   * @param pub Chiave pubblica dell'utente
   * @returns Profilo dell'utente
   */
  public async getProfile(pub: string): Promise<UserProfile> {
    // Controlla se il profilo è nella cache
    const cached = this.profileCache.get(pub);
    if (cached && Date.now() - cached.timestamp < this.cacheDuration) {
      return cached.data;
    }

    // Profilo vuoto con dati minimi
    const profile: UserProfile = {
      pub,
      followers: [],
      following: [],
      customFields: {},
    };

    try {
      // Ottieni dati profilo
      await new Promise<void>((resolve) => {
        this.gun
          .user(pub)
          .get('_')
          .once((userData: any) => {
            if (userData) {
              if (userData.alias) profile.alias = userData.alias;
              if (userData.bio) profile.bio = userData.bio;
              if (userData.profileImage)
                profile.profileImage = userData.profileImage;
            }
            resolve();
          });
      });

      // Recuperare i follower e following - questo sarà fatto dal FollowerService

      // Salva in cache
      this.profileCache.set(pub, { data: profile, timestamp: Date.now() });
      return profile;
    } catch (err) {
      logError(`Errore caricamento profilo: ${err}`);
      return profile;
    }
  }

  /**
   * Aggiorna un campo del profilo
   * @param field Nome del campo da aggiornare
   * @param value Nuovo valore
   * @returns true se l'operazione è riuscita
   */
  public async updateProfile(field: string, value: string): Promise<boolean> {
    const user = this.gun.user();
    if (!user.is || !user.is.pub) {
      throw new Error("Non autenticato");
    }

    try {
      await new Promise<void>((resolve, reject) => {
        this.gun
          .user()
          .get("profile")
          .get(field)
          .put(value, (ack: any) => {
            if (ack.err) reject(new Error(ack.err));
            else resolve();
          });
      });

      // Invalida cache
      this.profileCache.delete(user.is.pub);
      
      // Emetti evento
      this.emit("profile:update", { field, value });
      
      return true;
    } catch (err) {
      logError(`Errore aggiornamento profilo: ${err}`);
      return false;
    }
  }

  /**
   * Aggiorna campi multipli del profilo
   * @param fields Record di campo-valore da aggiornare
   * @returns true se l'operazione è riuscita
   */
  public async updateProfileFields(fields: Record<string, string>): Promise<boolean> {
    const user = this.gun.user();
    if (!user.is || !user.is.pub) {
      throw new Error("Non autenticato");
    }

    try {
      for (const [field, value] of Object.entries(fields)) {
        await new Promise<void>((resolve, reject) => {
          this.gun
            .user()
            .get("profile")
            .get(field)
            .put(value, (ack: any) => {
              if (ack.err) reject(new Error(ack.err));
              else resolve();
            });
        });
      }

      // Invalida cache
      this.profileCache.delete(user.is.pub);
      
      // Emetti evento
      this.emit("profile:update:multiple", fields);
      
      return true;
    } catch (err) {
      logError(`Errore aggiornamento campi profilo: ${err}`);
      return false;
    }
  }

  /**
   * Pulisce la cache dei profili
   */
  public clearCache(): void {
    this.profileCache.clear();
    logDebug("Cache profili pulita");
  }
} 