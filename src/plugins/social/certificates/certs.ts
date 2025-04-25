import { IGunInstance, SEA } from "gun";

interface CertificateCallbackResponse {
  errMessage?: string;
  errCode?: string;
  certificate?: string;
  success?: string;
}

type CertificateCallback = (response: CertificateCallbackResponse) => void;

export class CertificateService {
  private readonly gun: IGunInstance;

  constructor(gunInstance: IGunInstance) {
    this.gun = gunInstance;
  }

  async generateFriendRequestsCertificate(
    callback: CertificateCallback = () => {}
  ): Promise<void> {
    const exists = this.gun
      .user()
      .get("certificates")
      .get("friendRequests")
      .once();

    if (exists) return;

    const userPair = await (this.gun.user() as any)._.sea;

    const cb = () => {
      console.log("Certificato generato");
    };

    const certificate = await SEA.certify(
      ["*"],
      [{ "*": "friendRequests" }],
      userPair,
      cb
    );

    this.gun
      .user()
      .get("certificates")
      .get("friendRequests")
      .put(certificate, (ack: any) => {
        if (ack.err) {
          return callback({
            errMessage: "Errore durante il salvataggio del certificato",
            errCode: "gun-put-error",
          });
        } else {
          return callback({
            certificate,
            success: "Generated new friend requests certificate.",
          });
        }
      });
  }

  async generateAddFriendCertificate(
    publicKey: string,
    callback: CertificateCallback = () => {}
  ): Promise<void> {
    const exists = this.gun
      .user()
      .get("certificates")
      .get(publicKey)
      .get("addFriend")
      .once();

    if (exists) return;

    const certificate = await SEA.certify(
      [publicKey],
      [{ "*": "friends" }],
      await (this.gun.user() as any)._.sea,
      () => {
        console.log("Certificato generato");
      }
    );

    this.gun
      .user()
      .get("certificates")
      .get(publicKey)
      .get("addFriend")
      .put(certificate, (ack: any) => {
        if (ack.err) {
          return callback({
            errMessage: "Errore durante il salvataggio del certificato",
            errCode: "gun-put-error",
          });
        } else {
          return callback({
            certificate,
            success:
              "Generated certificate for requested friend to add user back.",
          });
        }
      });
  }

  async createChatsCertificate(
    publicKey: string,
    callback: CertificateCallback = () => {}
  ): Promise<void> {
    const exists = this.gun
      .user()
      .get("certificates")
      .get(publicKey)
      .get("chats")
      .once();

    if (exists) return;

    const certificate = await SEA.certify(
      [publicKey],
      [{ "*": "chats" }],
      await (this.gun.user() as any)._.sea,
      () => {
        console.log("Certificato generato");
      }
    );

    this.gun
      .user()
      .get("certificates")
      .get(publicKey)
      .get("chats")
      .put(certificate, (ack: any) => {
        if (ack.err) {
          return callback({
            errMessage: "Errore durante il salvataggio del certificato",
            errCode: "chats-certificate-creation-error",
          });
        } else {
          return callback({
            certificate,
            success: "Generated new chats certificate.",
          });
        }
      });
  }

  async createMessagesCertificate(
    publicKey: string,
    callback: CertificateCallback = () => {}
  ): Promise<void> {
    const exists = this.gun
      .user()
      .get("certificates")
      .get(publicKey)
      .get("messages")
      .once();

    if (exists) return;

    const certificate = await SEA.certify(
      [publicKey],
      [{ "*": "messages" }],
      await (this.gun.user() as any)._.sea,
      () => {
        console.log("Certificato generato");
      }
    );

    this.gun
      .user()
      .get("certificates")
      .get(publicKey)
      .get("messages")
      .put(certificate, (ack: any) => {
        if (ack.err) {
          return callback({
            errMessage: "Errore durante il salvataggio del certificato",
            errCode: "messages-certificate-creation-error",
          });
        } else {
          return callback({
            certificate,
            success: "Generated new messages certificate.",
          });
        }
      });
  }
}
