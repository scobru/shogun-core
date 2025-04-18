import Gun from "gun";
import "gun/sea";

const seaMemo = new Map();

export const encrypt = async (value: any, epriv: any) => {
  const encrypted = await Gun.SEA.encrypt(value, { epriv });
  seaMemo.set(encrypted, value);
  return encrypted;
};

export const decrypt = async (value: string, epriv: any) => {
  if (seaMemo.has(value)) return seaMemo.get(value);
  const decrypted = await Gun.SEA.decrypt(value, { epriv });
  if (decrypted !== undefined) seaMemo.set(value, decrypted);
  return decrypted;
};

export const sign = async (data: any, pair: { priv: string; pub: string; }) => {
  return await Gun.SEA.sign(data, pair);
};

export const verify = async (signed: string, pub: string | { pub: string; }) => {
  return await Gun.SEA.verify(signed, pub);
};

export const generateKeyPair = async () => {
  return await Gun.SEA.pair();
};
