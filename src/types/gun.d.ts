/**
 * Definizioni dei tipi per Gun.js
 */

declare module "gun" {
  export interface IGunInstance<T = any> {
    get(path: string): IGunChainReference<T>;
    put(data: Partial<T>): IGunChainReference<T>;
    set(data: Partial<T>): IGunChainReference<T>;
    map(): IGunChainReference<T>;
    on(callback: (data: T, key: string) => void): IGunChainReference<T>;
    once(callback: (data: T, key: string) => void): IGunChainReference<T>;
    user(): IGunUserInstance;
  }

  export interface IGunChainReference<T = any> extends IGunInstance<T> {
    _: {
      "#": string;
      ">": { [key: string]: number };
      [key: string]: any;
    };
  }

  export interface IGunUserInstance extends IGunInstance {
    is: {
      pub: string;
      [key: string]: any;
    };
  }

 
}
