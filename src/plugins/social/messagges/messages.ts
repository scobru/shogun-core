import { IGunInstance, IGunUserInstance, SEA } from "gun";
import { Observable } from "rxjs";
import { v4 } from "uuid";

interface OperationCallbackResponse {
  errMessage?: string;
  errCode?: string;
  success?: string;
  chat?: any;
}

type OperationCallback = (response: OperationCallbackResponse) => void;

export interface ChatEntity {
  roomId: string;
  pub: string;
  latestMessage: any;
}

export interface MessageBatch {
  initial: any[];
  individual?: any;
}

export class MessageService {
  private gun: IGunInstance;
  private currentUser: IGunUserInstance;

  public chatsList$: Observable<ChatEntity>;

  constructor(gunInstance: IGunInstance) {
    this.gun = gunInstance;
    this.currentUser = this.gun.user() as IGunUserInstance;

    this.chatsList$ = new Observable<ChatEntity>((subscriber) => {
      this.gun
        .user()
        .get("chats")
        .on((chats: any) => {
          for (const pub in chats || {}) {
            try {
              const details = JSON.parse(chats[pub]);
              if (details) {
                subscriber.next({
                  roomId: details.roomId,
                  pub: details.pub,
                  latestMessage: details.latestMessage,
                });
              }
            } catch {} // ignore
          }
        });
    });
  }

  public createChat(
    publicKey: string,
    callback: OperationCallback = () => {}
  ): void {
    this.gun
      .user()
      .get("chats")
      .get(publicKey)
      .once(async (exists) => {
        if (exists) {
          return callback({
            errMessage: "The chat already exists. Opening it now.",
            errCode: "chat-already-exists",
            chat: JSON.parse(exists),
          });
        }

        const friend = await (this.gun.user(publicKey) as any).once();
        const userPair = await (this.gun.user() as any)._.sea;
        const userPub = userPair.pub;
        if (!userPub) {
          return callback({
            errMessage: "Could not find pub.",
            errCode: "failed-to-find-pub",
          });
        }
        if (!friend) {
          return callback({
            errMessage: "Could not find friend.",
            errCode: "failed-to-find-friend",
          });
        }

        const cert = this.gun
          .user(publicKey)
          .get("certificates")
          .get(userPub)
          .get("chats");
        if (!cert) {
          return callback({
            errMessage: "Could not find friend certificate to create chat",
            errCode: "failed-to-find-friend-chats-certificate",
          });
        }

        const roomId = v4();
        const newChat = JSON.stringify({
          pub: userPub,
          roomId,
          latestMessage: {},
        });

        this.gun
          .user(publicKey)
          .get("chats")
          .get(userPub)
          .put(
            newChat,
            (ack: any) => {
              if (ack.err)
                return callback({
                  errMessage: ack.err,
                  errCode: "chat-creation-error",
                });
              this.gun
                .user()
                .get("chats")
                .get(publicKey)
                .put(
                  JSON.stringify({
                    pub: friend.pub,
                    roomId,
                    latestMessage: {},
                  }),
                  (ack: any) => {
                    if (ack.err)
                      return callback({
                        errMessage: ack.err,
                        errCode: "chat-creation-error",
                      });
                    return callback({
                      success: "Created a chat with friend.",
                      chat: { pub: friend.pub, roomId },
                    });
                  }
                );
            },
            //@ts-ignore
            { opt: { cert } }
          );
      });
  }

  public messageList(roomId: string, pub: string): Observable<MessageBatch> {
    return new Observable<MessageBatch>((subscriber) => {
      async () => {
        const userPair = await (this.gun.user() as any)._.sea;
        const friend = await (this.gun.user(pub) as any).once();
        this.gun
          .user()
          .get("messages")
          .get(roomId)
          .once(async (messages) => {
            const initial: any[] = [];
            for (const key in messages || {}) {
              const encrypted = messages[key].toString();
              const secret = await SEA.secret(friend.epub, userPair);
              const decrypted = await SEA.decrypt(encrypted, secret as string);
              if (decrypted) {
                const item = { ...decrypted, encrypted: true };
                if (!initial.some((m) => m.id === item.id)) {
                  initial.push(item);
                }
              }
            }
            subscriber.next({ initial });
            this.gun
              .user()
              .get("messages")
              .get(roomId)
              .map()
              .once(async (msg) => {
                const encrypted = msg.toString();
                if (encrypted.startsWith("SEA")) {
                  const secret2 = await SEA.secret(friend.epub, userPair);
                  const dec = await SEA.decrypt(encrypted, secret2 as string);
                  if (dec && !initial.some((m) => m.id === dec.id)) {
                    subscriber.next({
                      individual: { ...dec, encrypted: true },
                      initial: [],
                    });
                  }
                }
              });
          });
      };
    });
  }

  public sendMessage(
    roomId: string,
    publicKey: string,
    message: string,
    callback: OperationCallback = () => {}
  ): void {
    (async () => {
      const userPair = await (this.gun.user() as any)._.sea;
      const userPub = userPair.pub;
      const friend = await (this.gun.user(publicKey) as any).once();
      if (!userPub) {
        return callback({
          errMessage: "Could not find pub.",
          errCode: "failed-to-find-pub",
        });
      }
      const msgCert = this.gun
        .user(publicKey)
        .get("certificates")
        .get(userPub)
        .get("messages");
      if (!msgCert) {
        return callback({
          errMessage: "Could not find friend certificate to create message",
          errCode: "failed-to-find-friend-messages-certificate",
        });
      }
      const metaCert = this.gun
        .user(publicKey)
        .get("certificates")
        .get(userPub)
        .get("chats");
      if (!metaCert) {
        return callback({
          errMessage: "Could not find friend certificate to add meta to chat",
          errCode: "failed-to-find-friend-chats-certificate",
        });
      }
      const messageId = v4();
      const timeSent = Date.now();
      const secret = await SEA.secret(friend.epub, userPair);
      const encrypted = await SEA.encrypt(
        JSON.stringify({
          id: messageId,
          content: message,
          timeSent,
          sender: userPub,
          type: "text",
        }),
        secret as string
      );
      // update latest
      this.gun
        .user()
        .get("chats")
        .get(roomId)
        .get("latestMessage")
        .put(encrypted);
      this.gun
        .user(publicKey)
        .get("chats")
        .get(roomId)
        .get("latestMessage")
        .put(encrypted, () => {}, { opt: { cert: String(metaCert) } });
      // push message
      this.gun
        .user()
        .get("messages")
        .get(roomId)
        .put(encrypted, (ack: any) => {
          if (ack.err)
            return callback({
              errMessage: ack.err,
              errCode: "message-creation-error",
            });
          this.gun
            .user(publicKey)
            .get("messages")
            .get(roomId)
            .set(
              encrypted,
              (ack: any) => {
                if (ack.err)
                  return callback({
                    errMessage: ack.err,
                    errCode: "message-creation-error",
                  });
                return callback({ success: "Created a message with friend." });
              },
              //@ts-ignore
              { opt: { cert: msgCert } }
            );
        });
    })();
  }

  public sendVoiceMessage(
    roomId: string,
    publicKey: string,
    voiceRecording: any,
    callback: OperationCallback = () => {}
  ): void {
    (async () => {
      const userPair = await (this.gun.user() as any)._.sea;
      const userPub = userPair.pub;
      const friend = await (this.gun.user(publicKey) as any).once();
      if (!userPub) {
        return callback({
          errMessage: "Could not find pub.",
          errCode: "failed-to-find-pub",
        });
      }
      const msgCert = this.gun
        .user(publicKey)
        .get("certificates")
        .get(userPub)
        .get("messages");
      if (!msgCert) {
        return callback({
          errMessage: "Could not find friend certificate to create message",
          errCode: "failed-to-find-friend-messages-certificate",
        });
      }
      const metaCert = this.gun
        .user(publicKey)
        .get("certificates")
        .get(userPub)
        .get("chats");
      if (!metaCert) {
        return callback({
          errMessage: "Could not find friend certificate to add meta to chat",
          errCode: "failed-to-find-friend-chats-certificate",
        });
      }
      // update latest
      this.gun
        .user()
        .get("chats")
        .get(roomId)
        .get("latestMessage")
        .put(voiceRecording);
      this.gun
        .user(publicKey)
        .get("chats")
        .get(roomId)
        .get("latestMessage")
        .put(voiceRecording, () => {}, { opt: { cert: String(metaCert) } });
      // push voice
      this.gun
        .user()
        .get("messages")
        .get(roomId)
        .set(voiceRecording, (ack: any) => {
          if (ack.err)
            return callback({
              errMessage: ack.err,
              errCode: "message-creation-error",
            });
          this.gun
            .user(publicKey)
            .get("messages")
            .get(roomId)
            .set(
              voiceRecording,
              (ack: any) => {
                if (ack.err)
                  return callback({
                    errMessage: ack.err,
                    errCode: "message-creation-error",
                  });
                return callback({
                  success: "Created a voice message with friend.",
                });
              },
              //@ts-ignore
              { opt: { cert: msgCert } }
            );
        });
    })();
  }
}
