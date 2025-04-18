interface GunSEA {
  pair(): Promise<KeyPair>;
  secret(key: string, pair: any, cb: (secret: string) => void): Promise<string>;
  encrypt(data: string, key: string): Promise<string>;
  decrypt(data: string, key: string): Promise<string | null>;
}

interface GunType {
  SEA: GunSEA;
}

declare global {
  var Gun: GunType | undefined;
}

export {};
