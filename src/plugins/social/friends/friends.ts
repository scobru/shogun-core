import { Observable } from "rxjs";
import { CertificateService } from "../certificates/certs";
import { IGunInstance, IGunUserInstance } from "gun";

interface OperationCallbackResponse {
  errMessage?: string;
  errCode?: string;
  success?: string;
}

type OperationCallback = (response: OperationCallbackResponse) => void;

export interface FriendEntity {
  key: string;
  pub: string;
  alias: string;
  displayName?: string;
  about?: string;
}

export class FriendService {
  private readonly gun: IGunInstance;
  private readonly currentUser: any;
  private readonly certificateManager: CertificateService;

  public friendRequests$: Observable<FriendEntity | undefined>;
  public friendsList$: Observable<FriendEntity | undefined>;

  constructor(gunInstance: IGunInstance) {
    this.gun = gunInstance;
    this.currentUser = this.gun?.user() as IGunUserInstance;
    this.certificateManager = new CertificateService(gunInstance);

    this.friendRequests$ = new Observable<FriendEntity | undefined>(
      (subscriber) => {
        this.gun
          .user()
          .get("friendRequests")
          .map((pub: string, key: string) => {
            if (pub) {
              const user = this.gun.user(pub) as any;
              user.once((_user: any) => {
                if (_user?.info && _user.pub && _user.alias) {
                  this.gun.get(_user.info["#"]).on((data: any) => {
                    subscriber.next({
                      key,
                      pub: _user.pub,
                      alias: _user.alias,
                      displayName: data.displayName,
                      about: data.about || undefined,
                    });
                  });
                } else if (_user?.pub && _user.alias) {
                  subscriber.next({
                    key,
                    pub: _user.pub,
                    alias: _user.alias,
                  });
                }
              });
            } else {
              subscriber.next(undefined);
            }
          });
      }
    );

    this.friendsList$ = new Observable<FriendEntity | undefined>(
      (subscriber) => {
        this.gun
          .user()
          .get("friends")
          .map((pub: string, key: string) => {
            if (pub) {
              const user = this.gun.user(pub) as any;
              user.once((_user: any) => {
                if (_user?.info && _user.pub && _user.alias) {
                  this.gun.get(_user.info["#"]).on((data: any) => {
                    subscriber.next({
                      key,
                      pub: _user.pub,
                      alias: _user.alias,
                      displayName: data.displayName,
                      about: data.about || undefined,
                    });
                  });
                } else if (_user?.pub && _user.alias) {
                  subscriber.next({
                    key,
                    pub: _user.pub,
                    alias: _user.alias,
                  });
                }
              });
            } else {
              subscriber.next(undefined);
            }
          });
      }
    );
  }

  public addFriendRequest(
    publicKey: string,
    callback: OperationCallback = () => {}
  ): void {
    (async () => {
      const cert = this.gun
        .user(publicKey)
        .get("certificates")
        .get("friendRequests")
        .once();

      this.gun
        .user(publicKey)
        .get("friendRequests")
        .set(
          this.currentUser.is.pub,
          (ack: any) => {
            if (ack.err) {
              return callback({
                errMessage: ack.err,
                errCode: "friend-request-error",
              });
            } else {
              this.certificateManager.generateAddFriendCertificate(
                publicKey,
                (res) =>
                  res.errMessage
                    ? callback(res)
                    : callback({ success: "Friend request sent successfully." })
              );
            }
          },
          // @ts-ignore
          { opt: { cert } }
        );
    })();
  }

  public acceptFriendRequest(
    params: { key: string; publicKey: string },
    callback: OperationCallback = () => {}
  ): void {
    const { key, publicKey } = params;

    this.gun
      .user()
      .get("friendRequests")
      .get(key)
      .put(null, async (ack: any) => {
        if (ack.err) {
          return callback({
            errMessage: ack.err,
            errCode: "accept-friend-request-failed",
          });
        }

        const cert = this.gun
          .user(publicKey)
          .get("certificates")
          .get(this.currentUser.is.pub)
          .get("addFriend")
          .once();

        this.gun
          .user(publicKey)
          .get("friends")
          .set(
            this.currentUser.is.pub,
            (ack: any) => {
              if (ack.err) {
                return callback({
                  errMessage: ack.err,
                  errCode: "add-friend-failed",
                });
              }
              this.gun
                .user()
                .get("friends")
                .put(publicKey, (ack: any) => {
                  if (ack.err) {
                    return callback({
                      errMessage: ack.err,
                      errCode: "add-friend-failed",
                    });
                  }
                  return callback({ success: "Added friend successfully." });
                });
            },
            // @ts-ignore
            { opt: { cert } }
          );
      });
  }

  public rejectFriendRequest(
    key: string,
    callback: OperationCallback = () => {}
  ): void {
    this.gun
      .user()
      .get("friendRequests")
      .get(key)
      .put(null, (err: any) => {
        if (err) {
          return callback({
            errMessage: err,
            errCode: "reject-friend-request-failed",
          });
        }
        return callback({ success: "Friend request removed successfully." });
      });
  }
}
