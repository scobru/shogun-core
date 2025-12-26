declare module 'gun/lib/yson' {}
declare module 'gun/lib/serve' {}
declare module 'gun/lib/store' {}
declare module 'gun/lib/rfs' {}
declare module 'gun/lib/rs3' {}
declare module 'gun/lib/wire' {}
declare module 'gun/lib/multicast' {}
declare module 'gun/lib/stats' {}

declare module 'gun/sea' {
  interface WorkOptions {
    name?: string;
    [key: string]: any;
  }

  interface SEA {
    work(
      data: string,
      pair: any,
      callback: any,
      options?: WorkOptions,
    ): Promise<string>;
    encrypt(data: string, key: string): Promise<string>;
    decrypt(encryptedData: string, key: string): Promise<string>;
    sign(data: string, pair: any): Promise<string>;
    verify(data: string, signature: string, pub: string): Promise<boolean>;
    pair(): Promise<any>;
    [key: string]: any;
  }

  const SEA: SEA;
  export default SEA;
}

declare module 'gun/axe' {}

// Extend Gun chain interface to include .then() method
declare global {
  interface IGunChain<T, TKey, TValue, TContext> {
    then(
      callback: (data: TValue) => void,
    ): IGunChain<T, TKey, TValue, TContext>;
  }
}
