import { Observable } from "rxjs";
import { IGunInstance } from "gun";
import { IGunChainReference } from "../types/gun";
import { GunDataNode } from '../../../gun/types/gun/GunDataNode';
import { GunSchema } from "../../../gun/types";

export class GunRxJS {
  private readonly gun: IGunInstance;

  constructor(gun: IGunInstance) {
    this.gun = gun;
  }

  /**
   * Crea un Observable da un riferimento Gun
   */
  public observe<T extends GunSchema>(path: string): Observable<T> {
    return new Observable<T>((subscriber) => {
      const ref = this.gun.get(path);

      const callback = (data: T) => {
        if (data === null || data === undefined) {
          subscriber.next(null as T);
          return;
        }
        subscriber.next(data);
      };

      ref.on((data: GunDataNode<T>) => {
        if (data === null || data === undefined) {
          subscriber.next(null as T);
          return;
        }
        subscriber.next(data as T);
      });

      // Cleanup quando l'Observable viene unsubscribed
      return () => {
        ref.off();
      };
    });
  }
}
