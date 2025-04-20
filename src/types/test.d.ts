import { KeyPair } from "../types/stealth";

interface GunSEA {
  pair: jest.Mock<Promise<KeyPair>>;
  secret: jest.Mock<Promise<string>>;
  encrypt: jest.Mock<Promise<string>>;
  decrypt: jest.Mock<Promise<string | null>>;
}

interface GunType {
  SEA: GunSEA;
  text?: {
    random: jest.Mock<string>;
  };
  on?: jest.Mock;
  log?: jest.Mock;
}

declare global {
  var Gun: GunType;
  namespace jest {
    interface Mock<T = any, Y extends any[] = any> {
      mockImplementation(fn: (...args: Y) => T): this;
      mockResolvedValue<U>(value: U): this;
      mockRejectedValue<U>(value: U): this;
      mockReturnValue<U>(value: U): this;
      mockReturnThis(): this;
    }
  }
}

export {};
