import Gun from "gun";
import "gun/sea";

export type RSAKeyPair = {
  publicKey: string;
  privateKey: string;
};

export class RsaSigner {
  private gun: typeof Gun;
  private user: any;

  constructor(gun: typeof Gun, user: any) {
    this.gun = gun;
    this.user = user;
  }

  async init() {
    const keys = await this.getStoredKeys();
    if (!keys) {
      const newKeys = await this.generateRSAKeyPair();
      await this.storeEncryptedKeyPair(newKeys);
    }
  }

  private async generateRSAKeyPair(): Promise<RSAKeyPair> {
    const keyPair = await window.crypto.subtle.generateKey(
      {
        name: "RSASSA-PKCS1-v1_5",
        modulusLength: 2048,
        publicExponent: new Uint8Array([1, 0, 1]),
        hash: "SHA-256",
      },
      true,
      ["sign", "verify"],
    );

    const pub = await window.crypto.subtle.exportKey("spki", keyPair.publicKey);
    const priv = await window.crypto.subtle.exportKey(
      "pkcs8",
      keyPair.privateKey,
    );

    return {
      publicKey: this.arrayBufferToPem(pub, "PUBLIC KEY"),
      privateKey: this.arrayBufferToPem(priv, "PRIVATE KEY"),
    };
  }

  private arrayBufferToPem(buffer: ArrayBuffer, label: string): string {
    const base64 = btoa(String.fromCharCode(...new Uint8Array(buffer)));
    const chunks = base64.match(/.{1,64}/g)?.join("\n") ?? "";
    return `-----BEGIN ${label}-----\n${chunks}\n-----END ${label}-----`;
  }

  private async storeEncryptedKeyPair(pair: RSAKeyPair) {
    const encrypted = await Gun.SEA.encrypt(pair.privateKey, this.user._.sea);
    this.user.get("rsa_keys").put({
      publicKey: pair.publicKey,
      privateKey: encrypted,
    });
  }

  private async getStoredKeys(): Promise<RSAKeyPair | null> {
    return new Promise((resolve) => {
      this.user.get("rsa_keys").once(async (data: any) => {
        if (!data || !data.publicKey || !data.privateKey) return resolve(null);
        try {
          const decryptedPriv = await Gun.SEA.decrypt(
            data.privateKey,
            this.user._.sea,
          );
          resolve({ publicKey: data.publicKey, privateKey: decryptedPriv });
        } catch {
          resolve(null);
        }
      });
    });
  }

  async signHttpRequest(
    headers: Record<string, string>,
    requestTarget: string,
  ): Promise<string> {
    const keys = await this.getStoredKeys();
    if (!keys) throw new Error("No RSA key pair found");

    const headersToSign = [
      "(request-target)",
      ...Object.keys(headers).map((h) => h.toLowerCase()),
    ];
    const signatureBase = headersToSign
      .map((h) =>
        h === "(request-target)"
          ? `(request-target): ${requestTarget}`
          : `${h}: ${headers[h]}`,
      )
      .join("\n");

    const privateKey = await this.importPrivateKey(keys.privateKey);
    const encoder = new TextEncoder();
    const signature = await window.crypto.subtle.sign(
      { name: "RSASSA-PKCS1-v1_5" },
      privateKey,
      encoder.encode(signatureBase),
    );

    const signatureB64 = btoa(
      String.fromCharCode(...new Uint8Array(signature)),
    );
    const keyId = `${this.user.is.pub}#main-key`;

    return `keyId=\"${keyId}\",algorithm=\"rsa-sha256\",headers=\"${headersToSign.join(" ")}\",signature=\"${signatureB64}\"`;
  }

  private async importPrivateKey(pem: string): Promise<CryptoKey> {
    const b64 = pem.replace(/-----(BEGIN|END) PRIVATE KEY-----|\n/g, "");
    const binary = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
    return await window.crypto.subtle.importKey(
      "pkcs8",
      binary.buffer,
      {
        name: "RSASSA-PKCS1-v1_5",
        hash: "SHA-256",
      },
      false,
      ["sign"],
    );
  }

  async createActivity(
    type: string,
    actorId: string,
    object: any,
  ): Promise<any> {
    return {
      "@context": "https://www.w3.org/ns/activitystreams",
      id: `${actorId}/activities/${Date.now()}`,
      type,
      actor: actorId,
      object,
      published: new Date().toISOString(),
    };
  }

  async createNote(actorId: string, content: string): Promise<any> {
    return this.createActivity("Create", actorId, {
      type: "Note",
      content,
    });
  }

  async createFollow(actorId: string, target: string): Promise<any> {
    return this.createActivity("Follow", actorId, target);
  }

  async createUndoFollow(actorId: string, followActivity: any): Promise<any> {
    return this.createActivity("Undo", actorId, followActivity);
  }

  async createLike(actorId: string, object: string): Promise<any> {
    return this.createActivity("Like", actorId, object);
  }

  async createUndoLike(actorId: string, likeActivity: any): Promise<any> {
    return this.createActivity("Undo", actorId, likeActivity);
  }

  async createAnnounce(actorId: string, object: string): Promise<any> {
    return this.createActivity("Announce", actorId, object);
  }

  async createDelete(actorId: string, object: string): Promise<any> {
    return this.createActivity("Delete", actorId, object);
  }
}

export class ActivityPubClient {
  constructor(private signer: RsaSigner) {}

  async sendActivity(actorId: string, targetInbox: string, activity: any) {
    const date = new Date().toUTCString();
    const body = JSON.stringify(activity);

    const headers: Record<string, string> = {
      host: new URL(targetInbox).host,
      date,
      "content-type": "application/activity+json",
      digest: `SHA-256=${await this.digestBody(body)}`,
    };

    const sig = await this.signer.signHttpRequest(
      headers,
      `post ${new URL(targetInbox).pathname}`,
    );

    await fetch(targetInbox, {
      method: "POST",
      headers: {
        ...headers,
        Signature: sig,
      },
      body,
    });
  }

  private async digestBody(body: string): Promise<string> {
    const encoder = new TextEncoder();
    const hash = await crypto.subtle.digest("SHA-256", encoder.encode(body));
    return btoa(String.fromCharCode(...new Uint8Array(hash)));
  }
}
