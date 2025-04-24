import { Observable } from "rxjs";
import { distinctUntilChanged } from "rxjs/operators";
import { IGunInstance, IGunUserInstance } from "gun/types";

/**
 * RxJS Integration for GunDB
 * Provides reactive programming capabilities for GunDB data
 */
export class GunRxJS {
  private gun: IGunInstance<any>;
  private user: IGunUserInstance<any>;

  /**
   * Initialize GunRxJS with a GunDB instance
   * @param gun - GunDB instance
   */
  constructor(gun: IGunInstance<any>) {
    this.gun = gun;
    this.user = gun.user().recall({ sessionStorage: true });
  }

  /**
   * Get the current user
   * @returns The current user
   */
  getUser(): IGunUserInstance<any> {
    return this.user;
  }

  /**
   * Get the current user's public key
   * @returns The current user's public key
   */
  getUserPub(): string | undefined {
    return this.user.is?.pub;
  }

  /**
   * Observe a Gun node for changes
   * @param path - Path to observe (can be a string or a Gun chain)
   * @returns Observable that emits whenever the node changes
   */
  observe<T>(path: string | any): Observable<T> {
    return new Observable<T>((subscriber) => {
      const node = typeof path === "string" ? this.gun.get(path) : path;

      // Subscribe to changes
      const unsub = node.on((data: T, key: string) => {
        if (data === null || data === undefined) {
          subscriber.next(null as unknown as T);
          return;
        }

        // Remove Gun metadata before emitting
        if (typeof data === "object" && data !== null) {
          const cleanData = this.removeGunMeta(data);
          subscriber.next(cleanData as T);
        } else {
          subscriber.next(data);
        }
      });

      // Return teardown logic
      return () => {
        if (unsub && typeof unsub === "function") {
          unsub();
        }
        node.off();
      };
    }).pipe(
      distinctUntilChanged((prev, curr) => {
        return JSON.stringify(prev) === JSON.stringify(curr);
      })
    );
  }

  /**
   * Match data based on Gun's '.map()' and convert to Observable
   * @param path - Path to the collection
   * @param matchFn - Optional function to filter results
   * @returns Observable array of matched items
   */
  match<T>(
    path: string | any,
    matchFn?: (data: any) => boolean
  ): Observable<T[]> {
    return new Observable<T[]>((subscriber) => {
      const node = typeof path === "string" ? this.gun.get(path) : path;
      const results: Record<string, T> = {};

      const unsub = node.map().on((data: T, key: string) => {
        // Skip soul key which is Gun's internal reference
        if (key === "_" || !data) return;

        if (matchFn && !matchFn(data)) {
          // If matchFn is provided and returns false, remove item
          if (results[key]) {
            delete results[key];
            subscriber.next(Object.values(results));
          }
          return;
        }

        const cleanData =
          typeof data === "object" ? this.removeGunMeta(data) : data;
        results[key] = cleanData as T;
        subscriber.next(Object.values(results));
      });

      // Return teardown logic
      return () => {
        if (unsub && typeof unsub === "function") {
          unsub();
        }
        node.off();
      };
    });
  }

  /**
   * Put data and return an Observable
   * @param path - Path where to put the data
   * @param data - Data to put
   * @returns Observable that completes when the put is acknowledged
   */
  put<T>(path: string | any, data: T): Observable<T> {
    const node = typeof path === "string" ? this.gun.get(path) : path;

    return new Observable<T>((subscriber) => {
      node.put(data, (ack: any) => {
        if (ack.err) {
          subscriber.error(new Error(ack.err));
        } else {
          subscriber.next(data);
          subscriber.complete();
        }
      });
    });
  }

  /**
   * Set data on a node and return an Observable
   * @param path - Path to the collection
   * @param data - Data to set
   * @returns Observable that completes when the set is acknowledged
   */
  set<T>(path: string | any, data: T): Observable<T> {
    const node = typeof path === "string" ? this.gun.get(path) : path;

    return new Observable<T>((subscriber) => {
      node.set(data, (ack: any) => {
        if (ack.err) {
          subscriber.error(new Error(ack.err));
        } else {
          subscriber.next(data);
          subscriber.complete();
        }
      });
    });
  }

  /**
   * Get data once and return as Observable
   * @param path - Path to get data from
   * @returns Observable that emits the data once
   */
  once<T>(path: string | any): Observable<T> {
    const node = typeof path === "string" ? this.gun.get(path) : path;

    return new Observable<T>((subscriber) => {
      node.once((data: T) => {
        if (data === undefined || data === null) {
          subscriber.next(null as unknown as T);
          subscriber.complete();
          return;
        }

        const cleanData =
          typeof data === "object" ? this.removeGunMeta(data) : data;
        subscriber.next(cleanData as T);
        subscriber.complete();
      });
    });
  }

  /**
   * Compute derived values from gun data
   * @param sources - Array of paths or observables to compute from
   * @param computeFn - Function that computes a new value from the sources
   * @returns Observable of computed values
   */
  compute<T, R>(
    sources: Array<string | Observable<any>>,
    computeFn: (...values: T[]) => R
  ): Observable<R> {
    // Convert all sources to observables
    const observables = sources.map((source) => {
      if (typeof source === "string") {
        return this.observe<T>(source);
      }
      return source as Observable<T>;
    });

    // Combine the latest values from all sources
    return new Observable<R>((subscriber) => {
      let values: T[] = new Array(sources.length).fill(undefined);
      let completed = new Array(sources.length).fill(false);

      const subscriptions = observables.map((obs, index) => {
        return obs.subscribe({
          next: (value) => {
            values[index] = value;

            // Only compute if we have all values
            if (values.every((v) => v !== undefined)) {
              try {
                const result = computeFn(...values);
                subscriber.next(result);
              } catch (error) {
                subscriber.error(error);
              }
            }
          },
          error: (err) => subscriber.error(err),
          complete: () => {
            completed[index] = true;
            if (completed.every((c) => c)) {
              subscriber.complete();
            }
          },
        });
      });

      // Return teardown logic
      return () => {
        subscriptions.forEach((sub) => sub.unsubscribe());
      };
    });
  }

  /**
   * User put data and return an Observable (for authenticated users)
   * @param path - Path where to put the data
   * @param data - Data to put
   * @returns Observable that completes when the put is acknowledged
   */
  userPut<T>(path: string, data: T): Observable<T> {
    return new Observable<T>((subscriber) => {
      this.gun
        .user()
        .get(path)
        .put(data, (ack: any) => {
          if (ack.err) {
            subscriber.error(new Error(ack.err));
          } else {
            subscriber.next(data);
            subscriber.complete();
          }
        });
    });
  }

  /**
   * Get user data
   * @param path - Path to get data from
   * @returns Observable that emits the data once
   */
  userGet<T>(path: string): Observable<T> {
    return this.observe<T>(this.gun.user().get(path));
  }

  /**
   * Observe user data
   * @param path - Path to observe in user space
   * @returns Observable that emits whenever the user data changes
   */
  observeUser<T>(path: string): Observable<T> {
    return this.observe<T>(this.gun.user().get(path));
  }

  /**
   * Remove Gun metadata from an object
   * @param obj - Object to clean
   * @returns Cleaned object without Gun metadata
   */
  private removeGunMeta<T>(obj: T): T {
    if (!obj || typeof obj !== "object") return obj;

    // Create a clean copy
    const cleanObj: any = Array.isArray(obj) ? [] : {};

    // Copy properties, skipping Gun metadata
    Object.keys(obj).forEach((key) => {
      // Skip Gun metadata
      if (key === "_" || key === "#") return;

      const val = (obj as any)[key];
      if (val && typeof val === "object") {
        cleanObj[key] = this.removeGunMeta(val);
      } else {
        cleanObj[key] = val;
      }
    });

    return cleanObj as T;
  }
}
