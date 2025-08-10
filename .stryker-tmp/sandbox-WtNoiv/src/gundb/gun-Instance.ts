/**
 * GunDB class with enhanced features:
 * - Dynamic peer linking
 * - Support for remove/unset operations
 * - Direct authentication through Gun.user()
 */
// @ts-nocheck
function stryNS_9fa48() {
  var g = typeof globalThis === 'object' && globalThis && globalThis.Math === Math && globalThis || new Function("return this")();
  var ns = g.__stryker__ || (g.__stryker__ = {});
  if (ns.activeMutant === undefined && g.process && g.process.env && g.process.env.__STRYKER_ACTIVE_MUTANT__) {
    ns.activeMutant = g.process.env.__STRYKER_ACTIVE_MUTANT__;
  }
  function retrieveNS() {
    return ns;
  }
  stryNS_9fa48 = retrieveNS;
  return retrieveNS();
}
stryNS_9fa48();
function stryCov_9fa48() {
  var ns = stryNS_9fa48();
  var cov = ns.mutantCoverage || (ns.mutantCoverage = {
    static: {},
    perTest: {}
  });
  function cover() {
    var c = cov.static;
    if (ns.currentTestId) {
      c = cov.perTest[ns.currentTestId] = cov.perTest[ns.currentTestId] || {};
    }
    var a = arguments;
    for (var i = 0; i < a.length; i++) {
      c[a[i]] = (c[a[i]] || 0) + 1;
    }
  }
  stryCov_9fa48 = cover;
  cover.apply(null, arguments);
}
function stryMutAct_9fa48(id) {
  var ns = stryNS_9fa48();
  function isActive(id) {
    if (ns.activeMutant === id) {
      if (ns.hitCount !== void 0 && ++ns.hitCount > ns.hitLimit) {
        throw new Error('Stryker: Hit count limit reached (' + ns.hitCount + ')');
      }
      return true;
    }
    return false;
  }
  stryMutAct_9fa48 = isActive;
  return isActive(id);
}
import type { GunUser, UserInfo, AuthCallback, GunData, GunNode, UserExistenceResult, EventData, EventListener, GunOperationResult } from "./types";
import type { AuthResult, SignUpResult } from "../types/shogun";
import Gun from "gun/gun";
import SEA from "gun/sea";
import "gun/lib/then.js";
import "gun/lib/radisk.js";
import "gun/lib/store.js";
import "gun/lib/rindexed.js";
import "gun/lib/webrtc.js";
import "gun/lib/yson.js";
import { restrictedPut } from "./restricted-put";
import derive, { DeriveOptions } from "./derive";
import type { IGunUserInstance, IGunInstance, IGunChain, ISEAPair } from "gun/types";
import { ErrorHandler, ErrorType } from "../utils/errorHandler";
import { EventEmitter } from "../utils/eventEmitter";
import { GunDataEventData, GunPeerEventData } from "../types/events";
import { GunRxJS } from "./gun-rxjs";
import * as GunErrors from "./errors";
import * as crypto from "./crypto";

/**
 * Interface for username lookup results
 */
interface UsernameLookupResult {
  pub?: string;
  userPub?: string;
  username?: string;
  source: string;
  immutable: boolean;
  hash?: string;
  [key: string]: any;
}

/**
 * Configuration constants for timeouts and security
 */
const CONFIG = {
  TIMEOUTS: {
    LOOKUP_FROZEN_SPACE: 2000,
    LOOKUP_DIRECT_MAPPING: 1500,
    LOOKUP_ALTERNATE_KEY: 1500,
    LOOKUP_COMPREHENSIVE: 1500,
    USER_DATA_OPERATION: 5000,
    STRATEGY_TIMEOUT: 3000
  },
  RATE_LIMITING: {
    MAX_LOGIN_ATTEMPTS: 5,
    LOGIN_COOLDOWN_MS: 300000,
    // 5 minutes
    MAX_SIGNUP_ATTEMPTS: 3,
    SIGNUP_COOLDOWN_MS: 600000 // 10 minutes
  },
  PASSWORD: {
    MIN_LENGTH: 12,
    REQUIRE_UPPERCASE: true,
    REQUIRE_LOWERCASE: true,
    REQUIRE_NUMBERS: true,
    REQUIRE_SPECIAL_CHARS: true
  }
} as const;

/**
 * Rate limiting storage for login/signup attempts
 */
interface RateLimitEntry {
  attempts: number;
  lastAttempt: number;
  cooldownUntil?: number;
}
class GunInstance {
  public gun: IGunInstance<any>;
  public user: IGunUserInstance<any> | null = null;
  public crypto: typeof crypto;
  public sea: typeof SEA;
  public node: IGunChain<any, IGunInstance<any>, IGunInstance<any>, string>;
  private readonly onAuthCallbacks: Array<AuthCallback> = stryMutAct_9fa48("293") ? ["Stryker was here"] : (stryCov_9fa48("293"), []);
  private readonly eventEmitter: EventEmitter;

  // Rate limiting storage
  private readonly rateLimitStorage = new Map<string, RateLimitEntry>();

  // Integrated modules
  private _rxjs?: GunRxJS;
  constructor(gun: IGunInstance<any>, appScope: string = stryMutAct_9fa48("294") ? "" : (stryCov_9fa48("294"), "shogun")) {
    if (stryMutAct_9fa48("295")) {
      {}
    } else {
      stryCov_9fa48("295");
      // Initialize event emitter
      this.eventEmitter = new EventEmitter();

      // Validate Gun instance
      if (stryMutAct_9fa48("298") ? false : stryMutAct_9fa48("297") ? true : stryMutAct_9fa48("296") ? gun : (stryCov_9fa48("296", "297", "298"), !gun)) {
        if (stryMutAct_9fa48("299")) {
          {}
        } else {
          stryCov_9fa48("299");
          throw new Error(stryMutAct_9fa48("300") ? "" : (stryCov_9fa48("300"), "Gun instance is required but was not provided"));
        }
      }
      if (stryMutAct_9fa48("303") ? typeof gun === "object" : stryMutAct_9fa48("302") ? false : stryMutAct_9fa48("301") ? true : (stryCov_9fa48("301", "302", "303"), typeof gun !== (stryMutAct_9fa48("304") ? "" : (stryCov_9fa48("304"), "object")))) {
        if (stryMutAct_9fa48("305")) {
          {}
        } else {
          stryCov_9fa48("305");
          throw new Error(stryMutAct_9fa48("306") ? `` : (stryCov_9fa48("306"), `Gun instance must be an object, received: ${typeof gun}`));
        }
      }
      if (stryMutAct_9fa48("309") ? typeof gun.user === "function" : stryMutAct_9fa48("308") ? false : stryMutAct_9fa48("307") ? true : (stryCov_9fa48("307", "308", "309"), typeof gun.user !== (stryMutAct_9fa48("310") ? "" : (stryCov_9fa48("310"), "function")))) {
        if (stryMutAct_9fa48("311")) {
          {}
        } else {
          stryCov_9fa48("311");
          throw new Error(stryMutAct_9fa48("312") ? `` : (stryCov_9fa48("312"), `Gun instance is invalid: gun.user is not a function. Received gun.user type: ${typeof gun.user}`));
        }
      }
      if (stryMutAct_9fa48("315") ? typeof gun.get === "function" : stryMutAct_9fa48("314") ? false : stryMutAct_9fa48("313") ? true : (stryCov_9fa48("313", "314", "315"), typeof gun.get !== (stryMutAct_9fa48("316") ? "" : (stryCov_9fa48("316"), "function")))) {
        if (stryMutAct_9fa48("317")) {
          {}
        } else {
          stryCov_9fa48("317");
          throw new Error(stryMutAct_9fa48("318") ? `` : (stryCov_9fa48("318"), `Gun instance is invalid: gun.get is not a function. Received gun.get type: ${typeof gun.get}`));
        }
      }
      if (stryMutAct_9fa48("321") ? typeof gun.on === "function" : stryMutAct_9fa48("320") ? false : stryMutAct_9fa48("319") ? true : (stryCov_9fa48("319", "320", "321"), typeof gun.on !== (stryMutAct_9fa48("322") ? "" : (stryCov_9fa48("322"), "function")))) {
        if (stryMutAct_9fa48("323")) {
          {}
        } else {
          stryCov_9fa48("323");
          throw new Error(stryMutAct_9fa48("324") ? `` : (stryCov_9fa48("324"), `Gun instance is invalid: gun.on is not a function. Received gun.on type: ${typeof gun.on}`));
        }
      }
      this.gun = gun;
      this.user = this.gun.user().recall(stryMutAct_9fa48("325") ? {} : (stryCov_9fa48("325"), {
        sessionStorage: stryMutAct_9fa48("326") ? false : (stryCov_9fa48("326"), true)
      }));
      this.subscribeToAuthEvents();
      this.crypto = crypto;
      this.sea = SEA;
      this.node = null as unknown as IGunChain<any, IGunInstance<any>, IGunInstance<any>, string>;
    }
  }

  /**
   * Initialize the GunInstance asynchronously
   * This method should be called after construction to perform async operations
   */
  async initialize(appScope: string = stryMutAct_9fa48("327") ? "" : (stryCov_9fa48("327"), "shogun")): Promise<void> {
    if (stryMutAct_9fa48("328")) {
      {}
    } else {
      stryCov_9fa48("328");
      try {
        if (stryMutAct_9fa48("329")) {
          {}
        } else {
          stryCov_9fa48("329");
          const sessionResult = this.restoreSession();
          this.node = this.gun.get(appScope);
          if (stryMutAct_9fa48("331") ? false : stryMutAct_9fa48("330") ? true : (stryCov_9fa48("330", "331"), sessionResult.success)) {
            // Session automatically restored
          } else {
            // No previous session to restore
          }
        }
      } catch (error) {
        if (stryMutAct_9fa48("332")) {
          {}
        } else {
          stryCov_9fa48("332");
          console.error(stryMutAct_9fa48("333") ? "" : (stryCov_9fa48("333"), "Error during automatic session restoration:"), error);
        }
      }
    }
  }
  private subscribeToAuthEvents() {
    if (stryMutAct_9fa48("334")) {
      {}
    } else {
      stryCov_9fa48("334");
      this.gun.on(stryMutAct_9fa48("335") ? "" : (stryCov_9fa48("335"), "auth"), (ack: any) => {
        if (stryMutAct_9fa48("336")) {
          {}
        } else {
          stryCov_9fa48("336");
          // Auth event received

          if (stryMutAct_9fa48("338") ? false : stryMutAct_9fa48("337") ? true : (stryCov_9fa48("337", "338"), ack.err)) {
            if (stryMutAct_9fa48("339")) {
              {}
            } else {
              stryCov_9fa48("339");
              ErrorHandler.handle(ErrorType.GUN, stryMutAct_9fa48("340") ? "" : (stryCov_9fa48("340"), "AUTH_EVENT_ERROR"), ack.err, new Error(ack.err));
            }
          } else {
            if (stryMutAct_9fa48("341")) {
              {}
            } else {
              stryCov_9fa48("341");
              this.notifyAuthListeners(stryMutAct_9fa48("344") ? ack.sea?.pub && "" : stryMutAct_9fa48("343") ? false : stryMutAct_9fa48("342") ? true : (stryCov_9fa48("342", "343", "344"), (stryMutAct_9fa48("345") ? ack.sea.pub : (stryCov_9fa48("345"), ack.sea?.pub)) || (stryMutAct_9fa48("346") ? "Stryker was here!" : (stryCov_9fa48("346"), ""))));
            }
          }
        }
      });
    }
  }
  private notifyAuthListeners(pub: string): void {
    if (stryMutAct_9fa48("347")) {
      {}
    } else {
      stryCov_9fa48("347");
      const user = this.gun.user();
      this.onAuthCallbacks.forEach(stryMutAct_9fa48("348") ? () => undefined : (stryCov_9fa48("348"), cb => cb(user)));
    }
  }

  /**
   * Emits a Gun data event
   * @private
   */
  private emitDataEvent(eventType: "gun:put" | "gun:get" | "gun:set" | "gun:remove", path: string, data?: GunData, success: boolean = stryMutAct_9fa48("349") ? false : (stryCov_9fa48("349"), true), error?: string): void {
    if (stryMutAct_9fa48("350")) {
      {}
    } else {
      stryCov_9fa48("350");
      const eventData: GunDataEventData = stryMutAct_9fa48("351") ? {} : (stryCov_9fa48("351"), {
        path,
        data,
        success,
        error,
        timestamp: Date.now()
      });
      this.eventEmitter.emit(eventType, eventData);
    }
  }

  /**
   * Emits a Gun peer event
   * @private
   */
  private emitPeerEvent(action: "add" | "remove" | "connect" | "disconnect", peer: string): void {
    if (stryMutAct_9fa48("352")) {
      {}
    } else {
      stryCov_9fa48("352");
      const eventData: GunPeerEventData = stryMutAct_9fa48("353") ? {} : (stryCov_9fa48("353"), {
        peer,
        action,
        timestamp: Date.now()
      });
      this.eventEmitter.emit(stryMutAct_9fa48("354") ? `` : (stryCov_9fa48("354"), `gun:peer:${action}`), eventData);
    }
  }

  /**
   * Adds an event listener
   * @param event Event name
   * @param listener Event listener function
   */
  on(event: string | symbol, listener: EventListener): void {
    if (stryMutAct_9fa48("355")) {
      {}
    } else {
      stryCov_9fa48("355");
      this.eventEmitter.on(event, listener);
    }
  }

  /**
   * Removes an event listener
   * @param event Event name
   * @param listener Event listener function
   */
  off(event: string | symbol, listener: EventListener): void {
    if (stryMutAct_9fa48("356")) {
      {}
    } else {
      stryCov_9fa48("356");
      this.eventEmitter.off(event, listener);
    }
  }

  /**
   * Adds a one-time event listener
   * @param event Event name
   * @param listener Event listener function
   */
  once(event: string | symbol, listener: EventListener): void {
    if (stryMutAct_9fa48("357")) {
      {}
    } else {
      stryCov_9fa48("357");
      this.eventEmitter.once(event, listener);
    }
  }

  /**
   * Emits an event
   * @param event Event name
   * @param data Event data
   */
  emit(event: string | symbol, data?: EventData): boolean {
    if (stryMutAct_9fa48("358")) {
      {}
    } else {
      stryCov_9fa48("358");
      return this.eventEmitter.emit(event, data);
    }
  }

  /**
   * Adds a new peer to the network
   * @param peer URL of the peer to add
   */
  addPeer(peer: string): void {
    if (stryMutAct_9fa48("359")) {
      {}
    } else {
      stryCov_9fa48("359");
      this.gun.opt(stryMutAct_9fa48("360") ? {} : (stryCov_9fa48("360"), {
        peers: stryMutAct_9fa48("361") ? [] : (stryCov_9fa48("361"), [peer])
      }));
      this.emitPeerEvent(stryMutAct_9fa48("362") ? "" : (stryCov_9fa48("362"), "add"), peer);
      console.log(stryMutAct_9fa48("363") ? `` : (stryCov_9fa48("363"), `Added new peer: ${peer}`));
    }
  }

  /**
   * Removes a peer from the network
   * @param peer URL of the peer to remove
   */
  removePeer(peer: string): void {
    if (stryMutAct_9fa48("364")) {
      {}
    } else {
      stryCov_9fa48("364");
      try {
        if (stryMutAct_9fa48("365")) {
          {}
        } else {
          stryCov_9fa48("365");
          // Get current peers from Gun instance
          const gunOpts = (this.gun as any)._.opt;
          if (stryMutAct_9fa48("368") ? gunOpts || gunOpts.peers : stryMutAct_9fa48("367") ? false : stryMutAct_9fa48("366") ? true : (stryCov_9fa48("366", "367", "368"), gunOpts && gunOpts.peers)) {
            if (stryMutAct_9fa48("369")) {
              {}
            } else {
              stryCov_9fa48("369");
              // Remove the peer from the peers object
              delete gunOpts.peers[peer];

              // Also try to close the connection if it exists
              const peerConnection = gunOpts.peers[peer];
              if (stryMutAct_9fa48("372") ? peerConnection || typeof peerConnection.close === "function" : stryMutAct_9fa48("371") ? false : stryMutAct_9fa48("370") ? true : (stryCov_9fa48("370", "371", "372"), peerConnection && (stryMutAct_9fa48("374") ? typeof peerConnection.close !== "function" : stryMutAct_9fa48("373") ? true : (stryCov_9fa48("373", "374"), typeof peerConnection.close === (stryMutAct_9fa48("375") ? "" : (stryCov_9fa48("375"), "function")))))) {
                if (stryMutAct_9fa48("376")) {
                  {}
                } else {
                  stryCov_9fa48("376");
                  peerConnection.close();
                }
              }
              this.emitPeerEvent(stryMutAct_9fa48("377") ? "" : (stryCov_9fa48("377"), "remove"), peer);
              console.log(stryMutAct_9fa48("378") ? `` : (stryCov_9fa48("378"), `Removed peer: ${peer}`));
            }
          } else {
            if (stryMutAct_9fa48("379")) {
              {}
            } else {
              stryCov_9fa48("379");
              console.log(stryMutAct_9fa48("380") ? `` : (stryCov_9fa48("380"), `Peer not found in current connections: ${peer}`));
            }
          }
        }
      } catch (error) {
        if (stryMutAct_9fa48("381")) {
          {}
        } else {
          stryCov_9fa48("381");
          console.error(stryMutAct_9fa48("382") ? `` : (stryCov_9fa48("382"), `Error removing peer ${peer}:`), error);
        }
      }
    }
  }

  /**
   * Gets the list of currently connected peers
   * @returns Array of peer URLs
   */
  getCurrentPeers(): string[] {
    if (stryMutAct_9fa48("383")) {
      {}
    } else {
      stryCov_9fa48("383");
      try {
        if (stryMutAct_9fa48("384")) {
          {}
        } else {
          stryCov_9fa48("384");
          const gunOpts = (this.gun as any)._.opt;
          if (stryMutAct_9fa48("387") ? gunOpts || gunOpts.peers : stryMutAct_9fa48("386") ? false : stryMutAct_9fa48("385") ? true : (stryCov_9fa48("385", "386", "387"), gunOpts && gunOpts.peers)) {
            if (stryMutAct_9fa48("388")) {
              {}
            } else {
              stryCov_9fa48("388");
              return stryMutAct_9fa48("389") ? Object.keys(gunOpts.peers) : (stryCov_9fa48("389"), Object.keys(gunOpts.peers).filter(peer => {
                if (stryMutAct_9fa48("390")) {
                  {}
                } else {
                  stryCov_9fa48("390");
                  const peerObj = gunOpts.peers[peer];
                  // Check if peer is actually connected (not just configured)
                  return stryMutAct_9fa48("393") ? peerObj && peerObj.wire || peerObj.wire.hied !== "bye" : stryMutAct_9fa48("392") ? false : stryMutAct_9fa48("391") ? true : (stryCov_9fa48("391", "392", "393"), (stryMutAct_9fa48("395") ? peerObj || peerObj.wire : stryMutAct_9fa48("394") ? true : (stryCov_9fa48("394", "395"), peerObj && peerObj.wire)) && (stryMutAct_9fa48("397") ? peerObj.wire.hied === "bye" : stryMutAct_9fa48("396") ? true : (stryCov_9fa48("396", "397"), peerObj.wire.hied !== (stryMutAct_9fa48("398") ? "" : (stryCov_9fa48("398"), "bye")))));
                }
              }));
            }
          }
          return stryMutAct_9fa48("399") ? ["Stryker was here"] : (stryCov_9fa48("399"), []);
        }
      } catch (error) {
        if (stryMutAct_9fa48("400")) {
          {}
        } else {
          stryCov_9fa48("400");
          console.error(stryMutAct_9fa48("401") ? "" : (stryCov_9fa48("401"), "Error getting current peers:"), error);
          return stryMutAct_9fa48("402") ? ["Stryker was here"] : (stryCov_9fa48("402"), []);
        }
      }
    }
  }

  /**
   * Gets the list of all configured peers (connected and disconnected)
   * @returns Array of peer URLs
   */
  getAllConfiguredPeers(): string[] {
    if (stryMutAct_9fa48("403")) {
      {}
    } else {
      stryCov_9fa48("403");
      try {
        if (stryMutAct_9fa48("404")) {
          {}
        } else {
          stryCov_9fa48("404");
          const gunOpts = (this.gun as any)._.opt;
          if (stryMutAct_9fa48("407") ? gunOpts || gunOpts.peers : stryMutAct_9fa48("406") ? false : stryMutAct_9fa48("405") ? true : (stryCov_9fa48("405", "406", "407"), gunOpts && gunOpts.peers)) {
            if (stryMutAct_9fa48("408")) {
              {}
            } else {
              stryCov_9fa48("408");
              return Object.keys(gunOpts.peers);
            }
          }
          return stryMutAct_9fa48("409") ? ["Stryker was here"] : (stryCov_9fa48("409"), []);
        }
      } catch (error) {
        if (stryMutAct_9fa48("410")) {
          {}
        } else {
          stryCov_9fa48("410");
          console.error(stryMutAct_9fa48("411") ? "" : (stryCov_9fa48("411"), "Error getting configured peers:"), error);
          return stryMutAct_9fa48("412") ? ["Stryker was here"] : (stryCov_9fa48("412"), []);
        }
      }
    }
  }

  /**
   * Gets detailed information about all peers
   * @returns Object with peer information
   */
  getPeerInfo(): {
    [peer: string]: {
      connected: boolean;
      status: string;
    };
  } {
    if (stryMutAct_9fa48("413")) {
      {}
    } else {
      stryCov_9fa48("413");
      try {
        if (stryMutAct_9fa48("414")) {
          {}
        } else {
          stryCov_9fa48("414");
          const gunOpts = (this.gun as any)._.opt;
          const peerInfo: {
            [peer: string]: {
              connected: boolean;
              status: string;
            };
          } = {};
          if (stryMutAct_9fa48("417") ? gunOpts || gunOpts.peers : stryMutAct_9fa48("416") ? false : stryMutAct_9fa48("415") ? true : (stryCov_9fa48("415", "416", "417"), gunOpts && gunOpts.peers)) {
            if (stryMutAct_9fa48("418")) {
              {}
            } else {
              stryCov_9fa48("418");
              Object.keys(gunOpts.peers).forEach(peer => {
                if (stryMutAct_9fa48("419")) {
                  {}
                } else {
                  stryCov_9fa48("419");
                  const peerObj = gunOpts.peers[peer];
                  const isConnected = stryMutAct_9fa48("422") ? peerObj && peerObj.wire || peerObj.wire.hied !== "bye" : stryMutAct_9fa48("421") ? false : stryMutAct_9fa48("420") ? true : (stryCov_9fa48("420", "421", "422"), (stryMutAct_9fa48("424") ? peerObj || peerObj.wire : stryMutAct_9fa48("423") ? true : (stryCov_9fa48("423", "424"), peerObj && peerObj.wire)) && (stryMutAct_9fa48("426") ? peerObj.wire.hied === "bye" : stryMutAct_9fa48("425") ? true : (stryCov_9fa48("425", "426"), peerObj.wire.hied !== (stryMutAct_9fa48("427") ? "" : (stryCov_9fa48("427"), "bye")))));
                  const status = isConnected ? stryMutAct_9fa48("428") ? "" : (stryCov_9fa48("428"), "connected") : (stryMutAct_9fa48("431") ? peerObj || peerObj.wire : stryMutAct_9fa48("430") ? false : stryMutAct_9fa48("429") ? true : (stryCov_9fa48("429", "430", "431"), peerObj && peerObj.wire)) ? stryMutAct_9fa48("432") ? "" : (stryCov_9fa48("432"), "disconnected") : stryMutAct_9fa48("433") ? "" : (stryCov_9fa48("433"), "not_initialized");
                  peerInfo[peer] = stryMutAct_9fa48("434") ? {} : (stryCov_9fa48("434"), {
                    connected: isConnected,
                    status: status
                  });
                }
              });
            }
          }
          return peerInfo;
        }
      } catch (error) {
        if (stryMutAct_9fa48("435")) {
          {}
        } else {
          stryCov_9fa48("435");
          console.error(stryMutAct_9fa48("436") ? "" : (stryCov_9fa48("436"), "Error getting peer info:"), error);
          return {};
        }
      }
    }
  }

  /**
   * Reconnects to a specific peer
   * @param peer URL of the peer to reconnect
   */
  reconnectToPeer(peer: string): void {
    if (stryMutAct_9fa48("437")) {
      {}
    } else {
      stryCov_9fa48("437");
      try {
        if (stryMutAct_9fa48("438")) {
          {}
        } else {
          stryCov_9fa48("438");
          // First remove the peer
          this.removePeer(peer);

          // Add it back immediately instead of with timeout
          this.addPeer(peer);
          console.log(stryMutAct_9fa48("439") ? `` : (stryCov_9fa48("439"), `Reconnected to peer: ${peer}`));
        }
      } catch (error) {
        if (stryMutAct_9fa48("440")) {
          {}
        } else {
          stryCov_9fa48("440");
          console.error(stryMutAct_9fa48("441") ? `` : (stryCov_9fa48("441"), `Error reconnecting to peer ${peer}:`), error);
        }
      }
    }
  }

  /**
   * Clears all peers and optionally adds new ones
   * @param newPeers Optional array of new peers to add
   */
  resetPeers(newPeers?: string[]): void {
    if (stryMutAct_9fa48("442")) {
      {}
    } else {
      stryCov_9fa48("442");
      try {
        if (stryMutAct_9fa48("443")) {
          {}
        } else {
          stryCov_9fa48("443");
          const gunOpts = (this.gun as any)._.opt;
          if (stryMutAct_9fa48("446") ? gunOpts || gunOpts.peers : stryMutAct_9fa48("445") ? false : stryMutAct_9fa48("444") ? true : (stryCov_9fa48("444", "445", "446"), gunOpts && gunOpts.peers)) {
            if (stryMutAct_9fa48("447")) {
              {}
            } else {
              stryCov_9fa48("447");
              // Clear all existing peers
              Object.keys(gunOpts.peers).forEach(peer => {
                if (stryMutAct_9fa48("448")) {
                  {}
                } else {
                  stryCov_9fa48("448");
                  this.removePeer(peer);
                }
              });

              // Add new peers if provided
              if (stryMutAct_9fa48("451") ? newPeers || newPeers.length > 0 : stryMutAct_9fa48("450") ? false : stryMutAct_9fa48("449") ? true : (stryCov_9fa48("449", "450", "451"), newPeers && (stryMutAct_9fa48("454") ? newPeers.length <= 0 : stryMutAct_9fa48("453") ? newPeers.length >= 0 : stryMutAct_9fa48("452") ? true : (stryCov_9fa48("452", "453", "454"), newPeers.length > 0)))) {
                if (stryMutAct_9fa48("455")) {
                  {}
                } else {
                  stryCov_9fa48("455");
                  newPeers.forEach(peer => {
                    if (stryMutAct_9fa48("456")) {
                      {}
                    } else {
                      stryCov_9fa48("456");
                      this.addPeer(peer);
                    }
                  });
                }
              }
              console.log(stryMutAct_9fa48("457") ? `` : (stryCov_9fa48("457"), `Gun database reset with ${newPeers ? newPeers.length : 0} peers: ${newPeers ? newPeers.join(stryMutAct_9fa48("458") ? "" : (stryCov_9fa48("458"), ", ")) : stryMutAct_9fa48("459") ? "" : (stryCov_9fa48("459"), "none")}`));
            }
          }
        }
      } catch (error) {
        if (stryMutAct_9fa48("460")) {
          {}
        } else {
          stryCov_9fa48("460");
          console.error(stryMutAct_9fa48("461") ? "" : (stryCov_9fa48("461"), "Error resetting peers:"), error);
        }
      }
    }
  }

  /**
   * Registers an authentication callback
   * @param callback Function to call on auth events
   * @returns Function to unsubscribe the callback
   */
  onAuth(callback: AuthCallback): () => void {
    if (stryMutAct_9fa48("462")) {
      {}
    } else {
      stryCov_9fa48("462");
      this.onAuthCallbacks.push(callback);
      const user = this.gun.user();
      if (stryMutAct_9fa48("465") ? user || user.is : stryMutAct_9fa48("464") ? false : stryMutAct_9fa48("463") ? true : (stryCov_9fa48("463", "464", "465"), user && user.is)) callback(user);
      return () => {
        if (stryMutAct_9fa48("466")) {
          {}
        } else {
          stryCov_9fa48("466");
          const i = this.onAuthCallbacks.indexOf(callback);
          if (stryMutAct_9fa48("469") ? i === -1 : stryMutAct_9fa48("468") ? false : stryMutAct_9fa48("467") ? true : (stryCov_9fa48("467", "468", "469"), i !== (stryMutAct_9fa48("470") ? +1 : (stryCov_9fa48("470"), -1)))) this.onAuthCallbacks.splice(i, 1);
        }
      };
    }
  }

  /**
   * Helper method to navigate to a nested path by splitting and chaining .get() calls
   * @param node Starting Gun node
   * @param path Path string (e.g., "test/data/marco")
   * @returns Gun node at the specified path
   */
  private navigateToPath(node: GunNode, path: string): GunNode {
    if (stryMutAct_9fa48("471")) {
      {}
    } else {
      stryCov_9fa48("471");
      if (stryMutAct_9fa48("474") ? !path && typeof path !== "string" : stryMutAct_9fa48("473") ? false : stryMutAct_9fa48("472") ? true : (stryCov_9fa48("472", "473", "474"), (stryMutAct_9fa48("475") ? path : (stryCov_9fa48("475"), !path)) || (stryMutAct_9fa48("477") ? typeof path === "string" : stryMutAct_9fa48("476") ? false : (stryCov_9fa48("476", "477"), typeof path !== (stryMutAct_9fa48("478") ? "" : (stryCov_9fa48("478"), "string")))))) return node;

      // Sanitize path to remove any control characters or invalid characters
      const sanitizedPath = stryMutAct_9fa48("479") ? path.replace(/[\x00-\x1F\x7F]/g, "") // Remove control characters
      .replace(/[^\w\-._/]/g, "") // Only allow alphanumeric, hyphens, dots, underscores, and slashes
      : (stryCov_9fa48("479"), path.replace(stryMutAct_9fa48("480") ? /[^\x00-\x1F\x7F]/g : (stryCov_9fa48("480"), /[\x00-\x1F\x7F]/g), stryMutAct_9fa48("481") ? "Stryker was here!" : (stryCov_9fa48("481"), "")) // Remove control characters
      .replace(stryMutAct_9fa48("483") ? /[^\W\-._/]/g : stryMutAct_9fa48("482") ? /[\w\-._/]/g : (stryCov_9fa48("482", "483"), /[^\w\-._/]/g), stryMutAct_9fa48("484") ? "Stryker was here!" : (stryCov_9fa48("484"), "")) // Only allow alphanumeric, hyphens, dots, underscores, and slashes
      .trim());
      if (stryMutAct_9fa48("487") ? false : stryMutAct_9fa48("486") ? true : stryMutAct_9fa48("485") ? sanitizedPath : (stryCov_9fa48("485", "486", "487"), !sanitizedPath)) return node;

      // Split path by '/' and filter out empty segments
      const pathSegments = stryMutAct_9fa48("489") ? sanitizedPath.split("/").map(segment => segment.trim()).filter(segment => segment.length > 0) : stryMutAct_9fa48("488") ? sanitizedPath.split("/").filter(segment => segment.length > 0).map(segment => segment.trim()) : (stryCov_9fa48("488", "489"), sanitizedPath.split(stryMutAct_9fa48("490") ? "" : (stryCov_9fa48("490"), "/")).filter(stryMutAct_9fa48("491") ? () => undefined : (stryCov_9fa48("491"), segment => stryMutAct_9fa48("495") ? segment.length <= 0 : stryMutAct_9fa48("494") ? segment.length >= 0 : stryMutAct_9fa48("493") ? false : stryMutAct_9fa48("492") ? true : (stryCov_9fa48("492", "493", "494", "495"), segment.length > 0))).map(stryMutAct_9fa48("496") ? () => undefined : (stryCov_9fa48("496"), segment => stryMutAct_9fa48("497") ? segment : (stryCov_9fa48("497"), segment.trim()))).filter(stryMutAct_9fa48("498") ? () => undefined : (stryCov_9fa48("498"), segment => stryMutAct_9fa48("502") ? segment.length <= 0 : stryMutAct_9fa48("501") ? segment.length >= 0 : stryMutAct_9fa48("500") ? false : stryMutAct_9fa48("499") ? true : (stryCov_9fa48("499", "500", "501", "502"), segment.length > 0))));

      // Chain .get() calls for each path segment
      return pathSegments.reduce((currentNode, segment) => {
        if (stryMutAct_9fa48("503")) {
          {}
        } else {
          stryCov_9fa48("503");
          return currentNode.get(segment);
        }
      }, node);
    }
  }

  /**
   * Gets the Gun instance
   * @returns Gun instance
   */
  getGun(): IGunInstance<any> {
    if (stryMutAct_9fa48("504")) {
      {}
    } else {
      stryCov_9fa48("504");
      return this.gun;
    }
  }

  /**
   * Gets the current user
   * @returns Current user object or null
   */
  getCurrentUser(): UserInfo | null {
    if (stryMutAct_9fa48("505")) {
      {}
    } else {
      stryCov_9fa48("505");
      try {
        if (stryMutAct_9fa48("506")) {
          {}
        } else {
          stryCov_9fa48("506");
          const user = this.gun.user();
          const pub = stryMutAct_9fa48("508") ? user.is?.pub : stryMutAct_9fa48("507") ? user?.is.pub : (stryCov_9fa48("507", "508"), user?.is?.pub);
          return pub ? stryMutAct_9fa48("509") ? {} : (stryCov_9fa48("509"), {
            pub,
            user
          }) : null;
        }
      } catch (error) {
        if (stryMutAct_9fa48("510")) {
          {}
        } else {
          stryCov_9fa48("510");
          console.error(stryMutAct_9fa48("511") ? "" : (stryCov_9fa48("511"), "Error getting current user:"), error);
          return null;
        }
      }
    }
  }

  /**
   * Gets the current user instance
   * @returns User instance
   */
  getUser(): GunUser {
    if (stryMutAct_9fa48("512")) {
      {}
    } else {
      stryCov_9fa48("512");
      return this.gun.user();
    }
  }

  /**
   * Gets a node at the specified path
   * @param path Path to the node
   * @returns Gun node
   */
  get(path: string): any {
    if (stryMutAct_9fa48("513")) {
      {}
    } else {
      stryCov_9fa48("513");
      return this.navigateToPath(this.gun, path);
    }
  }

  /**
   * Gets data at the specified path (one-time read)
   * @param path Path to get the data from
   * @returns Promise resolving to the data
   */
  async getData(path: string): Promise<GunData> {
    if (stryMutAct_9fa48("514")) {
      {}
    } else {
      stryCov_9fa48("514");
      return new Promise(resolve => {
        if (stryMutAct_9fa48("515")) {
          {}
        } else {
          stryCov_9fa48("515");
          this.navigateToPath(this.gun, path).once((data: GunData) => {
            if (stryMutAct_9fa48("516")) {
              {}
            } else {
              stryCov_9fa48("516");
              // Emit event for the operation
              this.emitDataEvent(stryMutAct_9fa48("517") ? "" : (stryCov_9fa48("517"), "gun:get"), path, data, stryMutAct_9fa48("518") ? false : (stryCov_9fa48("518"), true));
              resolve(data);
            }
          });
        }
      });
    }
  }

  /**
   * Puts data at the specified path
   * @param path Path to store data
   * @param data Data to store
   * @returns Promise resolving to operation result
   */
  async put(path: string, data: GunData): Promise<GunOperationResult> {
    if (stryMutAct_9fa48("519")) {
      {}
    } else {
      stryCov_9fa48("519");
      return new Promise(resolve => {
        if (stryMutAct_9fa48("520")) {
          {}
        } else {
          stryCov_9fa48("520");
          this.navigateToPath(this.gun, path).put(data, (ack: any) => {
            if (stryMutAct_9fa48("521")) {
              {}
            } else {
              stryCov_9fa48("521");
              const result = ack.err ? stryMutAct_9fa48("522") ? {} : (stryCov_9fa48("522"), {
                success: stryMutAct_9fa48("523") ? true : (stryCov_9fa48("523"), false),
                error: ack.err
              }) : stryMutAct_9fa48("524") ? {} : (stryCov_9fa48("524"), {
                success: stryMutAct_9fa48("525") ? false : (stryCov_9fa48("525"), true)
              });

              // Emit event for the operation
              this.emitDataEvent(stryMutAct_9fa48("526") ? "" : (stryCov_9fa48("526"), "gun:put"), path, data, stryMutAct_9fa48("527") ? ack.err : (stryCov_9fa48("527"), !ack.err), ack.err);
              resolve(result);
            }
          });
        }
      });
    }
  }

  /**
   * Sets data at the specified path
   * @param path Path to store data
   * @param data Data to store
   * @returns Promise resolving to operation result
   */
  async set(path: string, data: GunData): Promise<GunOperationResult> {
    if (stryMutAct_9fa48("528")) {
      {}
    } else {
      stryCov_9fa48("528");
      return new Promise(resolve => {
        if (stryMutAct_9fa48("529")) {
          {}
        } else {
          stryCov_9fa48("529");
          this.navigateToPath(this.gun, path).set(data, (ack: any) => {
            if (stryMutAct_9fa48("530")) {
              {}
            } else {
              stryCov_9fa48("530");
              const result = ack.err ? stryMutAct_9fa48("531") ? {} : (stryCov_9fa48("531"), {
                success: stryMutAct_9fa48("532") ? true : (stryCov_9fa48("532"), false),
                error: ack.err
              }) : stryMutAct_9fa48("533") ? {} : (stryCov_9fa48("533"), {
                success: stryMutAct_9fa48("534") ? false : (stryCov_9fa48("534"), true)
              });

              // Emit event for the operation
              this.emitDataEvent(stryMutAct_9fa48("535") ? "" : (stryCov_9fa48("535"), "gun:set"), path, data, stryMutAct_9fa48("536") ? ack.err : (stryCov_9fa48("536"), !ack.err), ack.err);
              resolve(result);
            }
          });
        }
      });
    }
  }

  /**
   * Removes data at the specified path
   * @param path Path to remove
   * @returns Promise resolving to operation result
   */
  async remove(path: string): Promise<GunOperationResult> {
    if (stryMutAct_9fa48("537")) {
      {}
    } else {
      stryCov_9fa48("537");
      return new Promise(resolve => {
        if (stryMutAct_9fa48("538")) {
          {}
        } else {
          stryCov_9fa48("538");
          this.navigateToPath(this.gun, path).put(null, (ack: any) => {
            if (stryMutAct_9fa48("539")) {
              {}
            } else {
              stryCov_9fa48("539");
              const result = ack.err ? stryMutAct_9fa48("540") ? {} : (stryCov_9fa48("540"), {
                success: stryMutAct_9fa48("541") ? true : (stryCov_9fa48("541"), false),
                error: ack.err
              }) : stryMutAct_9fa48("542") ? {} : (stryCov_9fa48("542"), {
                success: stryMutAct_9fa48("543") ? false : (stryCov_9fa48("543"), true)
              });

              // Emit event for the operation
              this.emitDataEvent(stryMutAct_9fa48("544") ? "" : (stryCov_9fa48("544"), "gun:remove"), path, null, stryMutAct_9fa48("545") ? ack.err : (stryCov_9fa48("545"), !ack.err), ack.err);
              resolve(result);
            }
          });
        }
      });
    }
  }

  /**
   * Checks if a user is currently logged in
   * @returns True if logged in
   */
  isLoggedIn(): boolean {
    if (stryMutAct_9fa48("546")) {
      {}
    } else {
      stryCov_9fa48("546");
      try {
        if (stryMutAct_9fa48("547")) {
          {}
        } else {
          stryCov_9fa48("547");
          const user = this.gun.user();
          return stryMutAct_9fa48("548") ? !(user && user.is && user.is.pub) : (stryCov_9fa48("548"), !(stryMutAct_9fa48("549") ? user && user.is && user.is.pub : (stryCov_9fa48("549"), !(stryMutAct_9fa48("552") ? user && user.is || user.is.pub : stryMutAct_9fa48("551") ? false : stryMutAct_9fa48("550") ? true : (stryCov_9fa48("550", "551", "552"), (stryMutAct_9fa48("554") ? user || user.is : stryMutAct_9fa48("553") ? true : (stryCov_9fa48("553", "554"), user && user.is)) && user.is.pub)))));
        }
      } catch (error) {
        if (stryMutAct_9fa48("555")) {
          {}
        } else {
          stryCov_9fa48("555");
          console.error(stryMutAct_9fa48("556") ? "" : (stryCov_9fa48("556"), "Error checking login status:"), error);
          return stryMutAct_9fa48("557") ? true : (stryCov_9fa48("557"), false);
        }
      }
    }
  }

  /**
   * Attempts to restore user session from local storage
   * @returns Promise resolving to session restoration result
   */
  restoreSession(): {
    success: boolean;
    userPub?: string;
    error?: string;
  } {
    if (stryMutAct_9fa48("558")) {
      {}
    } else {
      stryCov_9fa48("558");
      try {
        if (stryMutAct_9fa48("559")) {
          {}
        } else {
          stryCov_9fa48("559");
          if (stryMutAct_9fa48("562") ? typeof localStorage !== "undefined" : stryMutAct_9fa48("561") ? false : stryMutAct_9fa48("560") ? true : (stryCov_9fa48("560", "561", "562"), typeof localStorage === (stryMutAct_9fa48("563") ? "" : (stryCov_9fa48("563"), "undefined")))) {
            if (stryMutAct_9fa48("564")) {
              {}
            } else {
              stryCov_9fa48("564");
              return stryMutAct_9fa48("565") ? {} : (stryCov_9fa48("565"), {
                success: stryMutAct_9fa48("566") ? true : (stryCov_9fa48("566"), false),
                error: stryMutAct_9fa48("567") ? "" : (stryCov_9fa48("567"), "localStorage not available")
              });
            }
          }
          const sessionInfo = localStorage.getItem(stryMutAct_9fa48("568") ? "" : (stryCov_9fa48("568"), "gun/session"));
          const pairInfo = localStorage.getItem(stryMutAct_9fa48("569") ? "" : (stryCov_9fa48("569"), "gun/pair"));
          if (stryMutAct_9fa48("572") ? !sessionInfo && !pairInfo : stryMutAct_9fa48("571") ? false : stryMutAct_9fa48("570") ? true : (stryCov_9fa48("570", "571", "572"), (stryMutAct_9fa48("573") ? sessionInfo : (stryCov_9fa48("573"), !sessionInfo)) || (stryMutAct_9fa48("574") ? pairInfo : (stryCov_9fa48("574"), !pairInfo)))) {
            if (stryMutAct_9fa48("575")) {
              {}
            } else {
              stryCov_9fa48("575");
              // No saved session found
              return stryMutAct_9fa48("576") ? {} : (stryCov_9fa48("576"), {
                success: stryMutAct_9fa48("577") ? true : (stryCov_9fa48("577"), false),
                error: stryMutAct_9fa48("578") ? "" : (stryCov_9fa48("578"), "No saved session")
              });
            }
          }
          let session, pair;
          try {
            if (stryMutAct_9fa48("579")) {
              {}
            } else {
              stryCov_9fa48("579");
              session = JSON.parse(sessionInfo);
              pair = JSON.parse(pairInfo);
            }
          } catch (parseError) {
            if (stryMutAct_9fa48("580")) {
              {}
            } else {
              stryCov_9fa48("580");
              console.error(stryMutAct_9fa48("581") ? "" : (stryCov_9fa48("581"), "Error parsing session data:"), parseError);
              // Clear corrupted data
              localStorage.removeItem(stryMutAct_9fa48("582") ? "" : (stryCov_9fa48("582"), "gun/session"));
              localStorage.removeItem(stryMutAct_9fa48("583") ? "" : (stryCov_9fa48("583"), "gun/pair"));
              return stryMutAct_9fa48("584") ? {} : (stryCov_9fa48("584"), {
                success: stryMutAct_9fa48("585") ? true : (stryCov_9fa48("585"), false),
                error: stryMutAct_9fa48("586") ? "" : (stryCov_9fa48("586"), "Corrupted session data")
              });
            }
          }

          // Validate session data structure
          if (stryMutAct_9fa48("589") ? (!session.username || !session.pair) && !session.userPub : stryMutAct_9fa48("588") ? false : stryMutAct_9fa48("587") ? true : (stryCov_9fa48("587", "588", "589"), (stryMutAct_9fa48("591") ? !session.username && !session.pair : stryMutAct_9fa48("590") ? false : (stryCov_9fa48("590", "591"), (stryMutAct_9fa48("592") ? session.username : (stryCov_9fa48("592"), !session.username)) || (stryMutAct_9fa48("593") ? session.pair : (stryCov_9fa48("593"), !session.pair)))) || (stryMutAct_9fa48("594") ? session.userPub : (stryCov_9fa48("594"), !session.userPub)))) {
            if (stryMutAct_9fa48("595")) {
              {}
            } else {
              stryCov_9fa48("595");
              // Invalid session data, clearing storage
              localStorage.removeItem(stryMutAct_9fa48("596") ? "" : (stryCov_9fa48("596"), "gun/session"));
              localStorage.removeItem(stryMutAct_9fa48("597") ? "" : (stryCov_9fa48("597"), "gun/pair"));
              return stryMutAct_9fa48("598") ? {} : (stryCov_9fa48("598"), {
                success: stryMutAct_9fa48("599") ? true : (stryCov_9fa48("599"), false),
                error: stryMutAct_9fa48("600") ? "" : (stryCov_9fa48("600"), "Incomplete session data")
              });
            }
          }

          // Check if session is expired
          if (stryMutAct_9fa48("603") ? session.expiresAt || Date.now() > session.expiresAt : stryMutAct_9fa48("602") ? false : stryMutAct_9fa48("601") ? true : (stryCov_9fa48("601", "602", "603"), session.expiresAt && (stryMutAct_9fa48("606") ? Date.now() <= session.expiresAt : stryMutAct_9fa48("605") ? Date.now() >= session.expiresAt : stryMutAct_9fa48("604") ? true : (stryCov_9fa48("604", "605", "606"), Date.now() > session.expiresAt)))) {
            if (stryMutAct_9fa48("607")) {
              {}
            } else {
              stryCov_9fa48("607");
              // Session expired, clearing storage
              localStorage.removeItem(stryMutAct_9fa48("608") ? "" : (stryCov_9fa48("608"), "gun/session"));
              localStorage.removeItem(stryMutAct_9fa48("609") ? "" : (stryCov_9fa48("609"), "gun/pair"));
              return stryMutAct_9fa48("610") ? {} : (stryCov_9fa48("610"), {
                success: stryMutAct_9fa48("611") ? true : (stryCov_9fa48("611"), false),
                error: stryMutAct_9fa48("612") ? "" : (stryCov_9fa48("612"), "Session expired")
              });
            }
          }

          // Attempt to restore user session
          try {
            if (stryMutAct_9fa48("613")) {
              {}
            } else {
              stryCov_9fa48("613");
              const userInstance = this.gun.user();
              if (stryMutAct_9fa48("616") ? false : stryMutAct_9fa48("615") ? true : stryMutAct_9fa48("614") ? userInstance : (stryCov_9fa48("614", "615", "616"), !userInstance)) {
                if (stryMutAct_9fa48("617")) {
                  {}
                } else {
                  stryCov_9fa48("617");
                  console.error(stryMutAct_9fa48("618") ? "" : (stryCov_9fa48("618"), "Gun user instance not available"));
                  localStorage.removeItem(stryMutAct_9fa48("619") ? "" : (stryCov_9fa48("619"), "gun/session"));
                  localStorage.removeItem(stryMutAct_9fa48("620") ? "" : (stryCov_9fa48("620"), "gun/pair"));
                  return stryMutAct_9fa48("621") ? {} : (stryCov_9fa48("621"), {
                    success: stryMutAct_9fa48("622") ? true : (stryCov_9fa48("622"), false),
                    error: stryMutAct_9fa48("623") ? "" : (stryCov_9fa48("623"), "Gun user instance not available")
                  });
                }
              }

              // Set the user pair
              try {
                if (stryMutAct_9fa48("624")) {
                  {}
                } else {
                  stryCov_9fa48("624");
                  (userInstance as any)._ = stryMutAct_9fa48("625") ? {} : (stryCov_9fa48("625"), {
                    ...userInstance._,
                    sea: session.pair
                  });
                }
              } catch (pairError) {
                if (stryMutAct_9fa48("626")) {
                  {}
                } else {
                  stryCov_9fa48("626");
                  console.error(stryMutAct_9fa48("627") ? "" : (stryCov_9fa48("627"), "Error setting user pair:"), pairError);
                }
              }

              // Attempt to recall user session
              try {
                if (stryMutAct_9fa48("628")) {
                  {}
                } else {
                  stryCov_9fa48("628");
                  const recallResult = userInstance.recall(stryMutAct_9fa48("629") ? {} : (stryCov_9fa48("629"), {
                    sessionStorage: stryMutAct_9fa48("630") ? false : (stryCov_9fa48("630"), true)
                  }));
                  // console.log("recallResult", recallResult);
                }
              } catch (recallError) {
                if (stryMutAct_9fa48("631")) {
                  {}
                } else {
                  stryCov_9fa48("631");
                  console.error(stryMutAct_9fa48("632") ? "" : (stryCov_9fa48("632"), "Error during recall:"), recallError);
                }
              }

              // Verify session restoration success
              if (stryMutAct_9fa48("635") ? userInstance.is || userInstance.is.pub === session.userPub : stryMutAct_9fa48("634") ? false : stryMutAct_9fa48("633") ? true : (stryCov_9fa48("633", "634", "635"), userInstance.is && (stryMutAct_9fa48("637") ? userInstance.is.pub !== session.userPub : stryMutAct_9fa48("636") ? true : (stryCov_9fa48("636", "637"), userInstance.is.pub === session.userPub)))) {
                if (stryMutAct_9fa48("638")) {
                  {}
                } else {
                  stryCov_9fa48("638");
                  this.user = userInstance;
                  // Session restored successfully for user
                  return stryMutAct_9fa48("639") ? {} : (stryCov_9fa48("639"), {
                    success: stryMutAct_9fa48("640") ? false : (stryCov_9fa48("640"), true),
                    userPub: session.userPub
                  });
                }
              } else {
                if (stryMutAct_9fa48("641")) {
                  {}
                } else {
                  stryCov_9fa48("641");
                  // Session restoration verification failed
                  localStorage.removeItem(stryMutAct_9fa48("642") ? "" : (stryCov_9fa48("642"), "gun/session"));
                  localStorage.removeItem(stryMutAct_9fa48("643") ? "" : (stryCov_9fa48("643"), "gun/pair"));
                  return stryMutAct_9fa48("644") ? {} : (stryCov_9fa48("644"), {
                    success: stryMutAct_9fa48("645") ? true : (stryCov_9fa48("645"), false),
                    error: stryMutAct_9fa48("646") ? "" : (stryCov_9fa48("646"), "Session verification failed")
                  });
                }
              }
            }
          } catch (error) {
            if (stryMutAct_9fa48("647")) {
              {}
            } else {
              stryCov_9fa48("647");
              console.error(stryMutAct_9fa48("648") ? `` : (stryCov_9fa48("648"), `Error restoring session: ${error}`));
              this.clearGunStorage();
              return stryMutAct_9fa48("649") ? {} : (stryCov_9fa48("649"), {
                success: stryMutAct_9fa48("650") ? true : (stryCov_9fa48("650"), false),
                error: stryMutAct_9fa48("651") ? `` : (stryCov_9fa48("651"), `Session restoration failed: ${error}`)
              });
            }
          }
        }
      } catch (mainError) {
        if (stryMutAct_9fa48("652")) {
          {}
        } else {
          stryCov_9fa48("652");
          console.error(stryMutAct_9fa48("653") ? `` : (stryCov_9fa48("653"), `Error in restoreSession: ${mainError}`));
          return stryMutAct_9fa48("654") ? {} : (stryCov_9fa48("654"), {
            success: stryMutAct_9fa48("655") ? true : (stryCov_9fa48("655"), false),
            error: stryMutAct_9fa48("656") ? `` : (stryCov_9fa48("656"), `Session restoration failed: ${mainError}`)
          });
        }
      }
      return stryMutAct_9fa48("657") ? {} : (stryCov_9fa48("657"), {
        success: stryMutAct_9fa48("658") ? true : (stryCov_9fa48("658"), false),
        error: stryMutAct_9fa48("659") ? "" : (stryCov_9fa48("659"), "No session data available")
      });
    }
  }
  logout(): void {
    if (stryMutAct_9fa48("660")) {
      {}
    } else {
      stryCov_9fa48("660");
      try {
        if (stryMutAct_9fa48("661")) {
          {}
        } else {
          stryCov_9fa48("661");
          const currentUser = this.gun.user();
          if (stryMutAct_9fa48("664") ? !currentUser && !currentUser.is : stryMutAct_9fa48("663") ? false : stryMutAct_9fa48("662") ? true : (stryCov_9fa48("662", "663", "664"), (stryMutAct_9fa48("665") ? currentUser : (stryCov_9fa48("665"), !currentUser)) || (stryMutAct_9fa48("666") ? currentUser.is : (stryCov_9fa48("666"), !currentUser.is)))) {
            if (stryMutAct_9fa48("667")) {
              {}
            } else {
              stryCov_9fa48("667");
              console.log(stryMutAct_9fa48("668") ? "" : (stryCov_9fa48("668"), "No user logged in, skipping logout"));
              return;
            }
          }

          // Log out user
          try {
            if (stryMutAct_9fa48("669")) {
              {}
            } else {
              stryCov_9fa48("669");
              currentUser.leave();
            }
          } catch (gunError) {
            if (stryMutAct_9fa48("670")) {
              {}
            } else {
              stryCov_9fa48("670");
              console.error(stryMutAct_9fa48("671") ? "" : (stryCov_9fa48("671"), "Error during Gun logout:"), gunError);
            }
          }

          // Clear user reference
          this.user = null;

          // Clear local session data
          try {
            // Clear session data if needed
          } catch (error) {
            if (stryMutAct_9fa48("672")) {
              {}
            } else {
              stryCov_9fa48("672");
              console.error(stryMutAct_9fa48("673") ? "" : (stryCov_9fa48("673"), "Error clearing local session data:"), error);
            }
          }

          // Clear session storage
          try {
            if (stryMutAct_9fa48("674")) {
              {}
            } else {
              stryCov_9fa48("674");
              if (stryMutAct_9fa48("677") ? typeof sessionStorage === "undefined" : stryMutAct_9fa48("676") ? false : stryMutAct_9fa48("675") ? true : (stryCov_9fa48("675", "676", "677"), typeof sessionStorage !== (stryMutAct_9fa48("678") ? "" : (stryCov_9fa48("678"), "undefined")))) {
                if (stryMutAct_9fa48("679")) {
                  {}
                } else {
                  stryCov_9fa48("679");
                  sessionStorage.removeItem(stryMutAct_9fa48("680") ? "" : (stryCov_9fa48("680"), "gunSessionData"));
                  // Session storage cleared
                }
              }
            }
          } catch (error) {
            if (stryMutAct_9fa48("681")) {
              {}
            } else {
              stryCov_9fa48("681");
              console.error(stryMutAct_9fa48("682") ? "" : (stryCov_9fa48("682"), "Error clearing session storage:"), error);
            }
          }

          // Logout completed successfully
        }
      } catch (error) {
        if (stryMutAct_9fa48("683")) {
          {}
        } else {
          stryCov_9fa48("683");
          console.error(stryMutAct_9fa48("684") ? "" : (stryCov_9fa48("684"), "Error during logout:"), error);
        }
      }
    }
  }

  /**
   * Debug method: Clears all Gun-related data from local and session storage
   * This is useful for debugging and testing purposes
   * @warning This will completely reset the user's local Gun data
   */
  clearGunStorage(): void {
    if (stryMutAct_9fa48("685")) {
      {}
    } else {
      stryCov_9fa48("685");
      try {
        if (stryMutAct_9fa48("686")) {
          {}
        } else {
          stryCov_9fa48("686");
          // Clearing all Gun-related storage data...

          // Clear localStorage
          if (stryMutAct_9fa48("689") ? typeof localStorage === "undefined" : stryMutAct_9fa48("688") ? false : stryMutAct_9fa48("687") ? true : (stryCov_9fa48("687", "688", "689"), typeof localStorage !== (stryMutAct_9fa48("690") ? "" : (stryCov_9fa48("690"), "undefined")))) {
            if (stryMutAct_9fa48("691")) {
              {}
            } else {
              stryCov_9fa48("691");
              try {
                if (stryMutAct_9fa48("692")) {
                  {}
                } else {
                  stryCov_9fa48("692");
                  const keysToRemove: string[] = stryMutAct_9fa48("693") ? ["Stryker was here"] : (stryCov_9fa48("693"), []);
                  for (let i = 0; stryMutAct_9fa48("696") ? i >= localStorage.length : stryMutAct_9fa48("695") ? i <= localStorage.length : stryMutAct_9fa48("694") ? false : (stryCov_9fa48("694", "695", "696"), i < localStorage.length); stryMutAct_9fa48("697") ? i-- : (stryCov_9fa48("697"), i++)) {
                    if (stryMutAct_9fa48("698")) {
                      {}
                    } else {
                      stryCov_9fa48("698");
                      const key = localStorage.key(i);
                      if (stryMutAct_9fa48("701") ? key || key.startsWith("gun/") : stryMutAct_9fa48("700") ? false : stryMutAct_9fa48("699") ? true : (stryCov_9fa48("699", "700", "701"), key && (stryMutAct_9fa48("702") ? key.endsWith("gun/") : (stryCov_9fa48("702"), key.startsWith(stryMutAct_9fa48("703") ? "" : (stryCov_9fa48("703"), "gun/")))))) {
                        if (stryMutAct_9fa48("704")) {
                          {}
                        } else {
                          stryCov_9fa48("704");
                          keysToRemove.push(key);
                        }
                      }
                    }
                  }
                  keysToRemove.forEach(stryMutAct_9fa48("705") ? () => undefined : (stryCov_9fa48("705"), key => localStorage.removeItem(key)));

                  // Cleared items from localStorage
                }
              } catch (error) {
                if (stryMutAct_9fa48("706")) {
                  {}
                } else {
                  stryCov_9fa48("706");
                  console.error(stryMutAct_9fa48("707") ? "" : (stryCov_9fa48("707"), "Error clearing localStorage:"), error);
                }
              }
            }
          }

          // Clear sessionStorage
          if (stryMutAct_9fa48("710") ? typeof sessionStorage === "undefined" : stryMutAct_9fa48("709") ? false : stryMutAct_9fa48("708") ? true : (stryCov_9fa48("708", "709", "710"), typeof sessionStorage !== (stryMutAct_9fa48("711") ? "" : (stryCov_9fa48("711"), "undefined")))) {
            if (stryMutAct_9fa48("712")) {
              {}
            } else {
              stryCov_9fa48("712");
              try {
                if (stryMutAct_9fa48("713")) {
                  {}
                } else {
                  stryCov_9fa48("713");
                  sessionStorage.removeItem(stryMutAct_9fa48("714") ? "" : (stryCov_9fa48("714"), "gunSessionData"));
                  // Session storage cleared
                }
              } catch (error) {
                if (stryMutAct_9fa48("715")) {
                  {}
                } else {
                  stryCov_9fa48("715");
                  console.error(stryMutAct_9fa48("716") ? "" : (stryCov_9fa48("716"), "Error clearing sessionStorage:"), error);
                }
              }
            }
          }

          // Clear current user
          if (stryMutAct_9fa48("718") ? false : stryMutAct_9fa48("717") ? true : (stryCov_9fa48("717", "718"), this.user)) {
            if (stryMutAct_9fa48("719")) {
              {}
            } else {
              stryCov_9fa48("719");
              try {
                if (stryMutAct_9fa48("720")) {
                  {}
                } else {
                  stryCov_9fa48("720");
                  this.user.leave();
                  this.user = null;
                  // User logged out
                }
              } catch (logoutError) {
                if (stryMutAct_9fa48("721")) {
                  {}
                } else {
                  stryCov_9fa48("721");
                  console.error(stryMutAct_9fa48("722") ? "" : (stryCov_9fa48("722"), "Error during logout:"), logoutError);
                }
              }
            }
          }

          // All Gun-related storage data cleared
        }
      } catch (error) {
        if (stryMutAct_9fa48("723")) {
          {}
        } else {
          stryCov_9fa48("723");
          console.error(stryMutAct_9fa48("724") ? "" : (stryCov_9fa48("724"), "Error clearing storage data:"), error);
        }
      }
    }
  }

  /**
   * Debug method: Tests Gun connectivity and returns status information
   * This is useful for debugging connection issues
   */
  async testConnectivity(): Promise<any> {
    if (stryMutAct_9fa48("725")) {
      {}
    } else {
      stryCov_9fa48("725");
      try {
        if (stryMutAct_9fa48("726")) {
          {}
        } else {
          stryCov_9fa48("726");
          // Testing Gun connectivity...

          const testNode = this.gun.get(stryMutAct_9fa48("727") ? "" : (stryCov_9fa48("727"), "test_connectivity"));
          const testValue = stryMutAct_9fa48("728") ? `` : (stryCov_9fa48("728"), `test_${Date.now()}`);

          // Test write operation
          let writeResult = stryMutAct_9fa48("729") ? true : (stryCov_9fa48("729"), false);
          try {
            if (stryMutAct_9fa48("730")) {
              {}
            } else {
              stryCov_9fa48("730");
              await new Promise((resolve, reject) => {
                if (stryMutAct_9fa48("731")) {
                  {}
                } else {
                  stryCov_9fa48("731");
                  testNode.put(testValue, (ack: any) => {
                    if (stryMutAct_9fa48("732")) {
                      {}
                    } else {
                      stryCov_9fa48("732");
                      if (stryMutAct_9fa48("734") ? false : stryMutAct_9fa48("733") ? true : (stryCov_9fa48("733", "734"), ack.err)) {
                        if (stryMutAct_9fa48("735")) {
                          {}
                        } else {
                          stryCov_9fa48("735");
                          reject(ack.err);
                        }
                      } else {
                        if (stryMutAct_9fa48("736")) {
                          {}
                        } else {
                          stryCov_9fa48("736");
                          resolve(ack);
                        }
                      }
                    }
                  });
                }
              });
              writeResult = stryMutAct_9fa48("737") ? false : (stryCov_9fa48("737"), true);
            }
          } catch (writeError) {
            if (stryMutAct_9fa48("738")) {
              {}
            } else {
              stryCov_9fa48("738");
              console.error(stryMutAct_9fa48("739") ? "" : (stryCov_9fa48("739"), "Write test failed:"), writeError);
            }
          }

          // Test read operation
          let readResult = stryMutAct_9fa48("740") ? true : (stryCov_9fa48("740"), false);
          try {
            if (stryMutAct_9fa48("741")) {
              {}
            } else {
              stryCov_9fa48("741");
              const result = await new Promise((resolve, reject) => {
                if (stryMutAct_9fa48("742")) {
                  {}
                } else {
                  stryCov_9fa48("742");
                  testNode.once((data: any) => {
                    if (stryMutAct_9fa48("743")) {
                      {}
                    } else {
                      stryCov_9fa48("743");
                      if (stryMutAct_9fa48("746") ? data !== testValue : stryMutAct_9fa48("745") ? false : stryMutAct_9fa48("744") ? true : (stryCov_9fa48("744", "745", "746"), data === testValue)) {
                        if (stryMutAct_9fa48("747")) {
                          {}
                        } else {
                          stryCov_9fa48("747");
                          resolve(data);
                        }
                      } else {
                        if (stryMutAct_9fa48("748")) {
                          {}
                        } else {
                          stryCov_9fa48("748");
                          reject(stryMutAct_9fa48("749") ? "" : (stryCov_9fa48("749"), "Data mismatch"));
                        }
                      }
                    }
                  });
                }
              });
              readResult = stryMutAct_9fa48("750") ? false : (stryCov_9fa48("750"), true);
            }
          } catch (readError) {
            if (stryMutAct_9fa48("751")) {
              {}
            } else {
              stryCov_9fa48("751");
              console.error(stryMutAct_9fa48("752") ? "" : (stryCov_9fa48("752"), "Read test failed:"), readError);
            }
          }
          const result = stryMutAct_9fa48("753") ? {} : (stryCov_9fa48("753"), {
            writeTest: writeResult,
            readTest: readResult,
            peers: this.getCurrentPeers(),
            timestamp: new Date().toISOString()
          });

          // Connectivity test completed
          return result;
        }
      } catch (error) {
        if (stryMutAct_9fa48("754")) {
          {}
        } else {
          stryCov_9fa48("754");
          console.error(stryMutAct_9fa48("755") ? "" : (stryCov_9fa48("755"), "Error testing connectivity:"), error);
          return stryMutAct_9fa48("756") ? {} : (stryCov_9fa48("756"), {
            error: error,
            timestamp: new Date().toISOString()
          });
        }
      }
    }
  }

  /**
   * Accesses the RxJS module for reactive programming
   * @returns GunRxJS instance
   */
  rx(): GunRxJS {
    if (stryMutAct_9fa48("757")) {
      {}
    } else {
      stryCov_9fa48("757");
      if (stryMutAct_9fa48("760") ? false : stryMutAct_9fa48("759") ? true : stryMutAct_9fa48("758") ? this._rxjs : (stryCov_9fa48("758", "759", "760"), !this._rxjs)) {
        if (stryMutAct_9fa48("761")) {
          {}
        } else {
          stryCov_9fa48("761");
          this._rxjs = new GunRxJS(this.gun);
        }
      }
      return this._rxjs;
    }
  }

  /**
   * Validates password strength according to security requirements
   */
  private validatePasswordStrength(password: string): {
    valid: boolean;
    error?: string;
  } {
    if (stryMutAct_9fa48("762")) {
      {}
    } else {
      stryCov_9fa48("762");
      if (stryMutAct_9fa48("766") ? password.length >= CONFIG.PASSWORD.MIN_LENGTH : stryMutAct_9fa48("765") ? password.length <= CONFIG.PASSWORD.MIN_LENGTH : stryMutAct_9fa48("764") ? false : stryMutAct_9fa48("763") ? true : (stryCov_9fa48("763", "764", "765", "766"), password.length < CONFIG.PASSWORD.MIN_LENGTH)) {
        if (stryMutAct_9fa48("767")) {
          {}
        } else {
          stryCov_9fa48("767");
          return stryMutAct_9fa48("768") ? {} : (stryCov_9fa48("768"), {
            valid: stryMutAct_9fa48("769") ? true : (stryCov_9fa48("769"), false),
            error: stryMutAct_9fa48("770") ? `` : (stryCov_9fa48("770"), `Password must be at least ${CONFIG.PASSWORD.MIN_LENGTH} characters long`)
          });
        }
      }
      const validations = stryMutAct_9fa48("771") ? ["Stryker was here"] : (stryCov_9fa48("771"), []);
      if (stryMutAct_9fa48("774") ? CONFIG.PASSWORD.REQUIRE_UPPERCASE || !/[A-Z]/.test(password) : stryMutAct_9fa48("773") ? false : stryMutAct_9fa48("772") ? true : (stryCov_9fa48("772", "773", "774"), CONFIG.PASSWORD.REQUIRE_UPPERCASE && (stryMutAct_9fa48("775") ? /[A-Z]/.test(password) : (stryCov_9fa48("775"), !(stryMutAct_9fa48("776") ? /[^A-Z]/ : (stryCov_9fa48("776"), /[A-Z]/)).test(password))))) {
        if (stryMutAct_9fa48("777")) {
          {}
        } else {
          stryCov_9fa48("777");
          validations.push(stryMutAct_9fa48("778") ? "" : (stryCov_9fa48("778"), "uppercase letter"));
        }
      }
      if (stryMutAct_9fa48("781") ? CONFIG.PASSWORD.REQUIRE_LOWERCASE || !/[a-z]/.test(password) : stryMutAct_9fa48("780") ? false : stryMutAct_9fa48("779") ? true : (stryCov_9fa48("779", "780", "781"), CONFIG.PASSWORD.REQUIRE_LOWERCASE && (stryMutAct_9fa48("782") ? /[a-z]/.test(password) : (stryCov_9fa48("782"), !(stryMutAct_9fa48("783") ? /[^a-z]/ : (stryCov_9fa48("783"), /[a-z]/)).test(password))))) {
        if (stryMutAct_9fa48("784")) {
          {}
        } else {
          stryCov_9fa48("784");
          validations.push(stryMutAct_9fa48("785") ? "" : (stryCov_9fa48("785"), "lowercase letter"));
        }
      }
      if (stryMutAct_9fa48("788") ? CONFIG.PASSWORD.REQUIRE_NUMBERS || !/\d/.test(password) : stryMutAct_9fa48("787") ? false : stryMutAct_9fa48("786") ? true : (stryCov_9fa48("786", "787", "788"), CONFIG.PASSWORD.REQUIRE_NUMBERS && (stryMutAct_9fa48("789") ? /\d/.test(password) : (stryCov_9fa48("789"), !(stryMutAct_9fa48("790") ? /\D/ : (stryCov_9fa48("790"), /\d/)).test(password))))) {
        if (stryMutAct_9fa48("791")) {
          {}
        } else {
          stryCov_9fa48("791");
          validations.push(stryMutAct_9fa48("792") ? "" : (stryCov_9fa48("792"), "number"));
        }
      }
      if (stryMutAct_9fa48("795") ? CONFIG.PASSWORD.REQUIRE_SPECIAL_CHARS || !/[!@#$%^&*(),.?":{}|<>]/.test(password) : stryMutAct_9fa48("794") ? false : stryMutAct_9fa48("793") ? true : (stryCov_9fa48("793", "794", "795"), CONFIG.PASSWORD.REQUIRE_SPECIAL_CHARS && (stryMutAct_9fa48("796") ? /[!@#$%^&*(),.?":{}|<>]/.test(password) : (stryCov_9fa48("796"), !(stryMutAct_9fa48("797") ? /[^!@#$%^&*(),.?":{}|<>]/ : (stryCov_9fa48("797"), /[!@#$%^&*(),.?":{}|<>]/)).test(password))))) {
        if (stryMutAct_9fa48("798")) {
          {}
        } else {
          stryCov_9fa48("798");
          validations.push(stryMutAct_9fa48("799") ? "" : (stryCov_9fa48("799"), "special character"));
        }
      }
      if (stryMutAct_9fa48("803") ? validations.length <= 0 : stryMutAct_9fa48("802") ? validations.length >= 0 : stryMutAct_9fa48("801") ? false : stryMutAct_9fa48("800") ? true : (stryCov_9fa48("800", "801", "802", "803"), validations.length > 0)) {
        if (stryMutAct_9fa48("804")) {
          {}
        } else {
          stryCov_9fa48("804");
          return stryMutAct_9fa48("805") ? {} : (stryCov_9fa48("805"), {
            valid: stryMutAct_9fa48("806") ? true : (stryCov_9fa48("806"), false),
            error: stryMutAct_9fa48("807") ? `` : (stryCov_9fa48("807"), `Password must contain at least one: ${validations.join(stryMutAct_9fa48("808") ? "" : (stryCov_9fa48("808"), ", "))}`)
          });
        }
      }
      return stryMutAct_9fa48("809") ? {} : (stryCov_9fa48("809"), {
        valid: stryMutAct_9fa48("810") ? false : (stryCov_9fa48("810"), true)
      });
    }
  }

  /**
   * Checks rate limiting for login attempts
   */
  private checkRateLimit(username: string, operation: "login" | "signup"): {
    allowed: boolean;
    error?: string;
  } {
    if (stryMutAct_9fa48("811")) {
      {}
    } else {
      stryCov_9fa48("811");
      const key = stryMutAct_9fa48("812") ? `` : (stryCov_9fa48("812"), `${operation}:${stryMutAct_9fa48("813") ? username.toUpperCase() : (stryCov_9fa48("813"), username.toLowerCase())}`);
      const now = Date.now();
      const entry = this.rateLimitStorage.get(key);
      const maxAttempts = (stryMutAct_9fa48("816") ? operation !== "login" : stryMutAct_9fa48("815") ? false : stryMutAct_9fa48("814") ? true : (stryCov_9fa48("814", "815", "816"), operation === (stryMutAct_9fa48("817") ? "" : (stryCov_9fa48("817"), "login")))) ? CONFIG.RATE_LIMITING.MAX_LOGIN_ATTEMPTS : CONFIG.RATE_LIMITING.MAX_SIGNUP_ATTEMPTS;
      const cooldownMs = (stryMutAct_9fa48("820") ? operation !== "login" : stryMutAct_9fa48("819") ? false : stryMutAct_9fa48("818") ? true : (stryCov_9fa48("818", "819", "820"), operation === (stryMutAct_9fa48("821") ? "" : (stryCov_9fa48("821"), "login")))) ? CONFIG.RATE_LIMITING.LOGIN_COOLDOWN_MS : CONFIG.RATE_LIMITING.SIGNUP_COOLDOWN_MS;
      if (stryMutAct_9fa48("824") ? false : stryMutAct_9fa48("823") ? true : stryMutAct_9fa48("822") ? entry : (stryCov_9fa48("822", "823", "824"), !entry)) {
        if (stryMutAct_9fa48("825")) {
          {}
        } else {
          stryCov_9fa48("825");
          this.rateLimitStorage.set(key, stryMutAct_9fa48("826") ? {} : (stryCov_9fa48("826"), {
            attempts: 1,
            lastAttempt: now
          }));
          return stryMutAct_9fa48("827") ? {} : (stryCov_9fa48("827"), {
            allowed: stryMutAct_9fa48("828") ? false : (stryCov_9fa48("828"), true)
          });
        }
      }

      // Check if still in cooldown
      if (stryMutAct_9fa48("831") ? entry.cooldownUntil || now < entry.cooldownUntil : stryMutAct_9fa48("830") ? false : stryMutAct_9fa48("829") ? true : (stryCov_9fa48("829", "830", "831"), entry.cooldownUntil && (stryMutAct_9fa48("834") ? now >= entry.cooldownUntil : stryMutAct_9fa48("833") ? now <= entry.cooldownUntil : stryMutAct_9fa48("832") ? true : (stryCov_9fa48("832", "833", "834"), now < entry.cooldownUntil)))) {
        if (stryMutAct_9fa48("835")) {
          {}
        } else {
          stryCov_9fa48("835");
          const remainingTime = Math.ceil(stryMutAct_9fa48("836") ? (entry.cooldownUntil - now) * 60000 : (stryCov_9fa48("836"), (stryMutAct_9fa48("837") ? entry.cooldownUntil + now : (stryCov_9fa48("837"), entry.cooldownUntil - now)) / 60000));
          return stryMutAct_9fa48("838") ? {} : (stryCov_9fa48("838"), {
            allowed: stryMutAct_9fa48("839") ? true : (stryCov_9fa48("839"), false),
            error: stryMutAct_9fa48("840") ? `` : (stryCov_9fa48("840"), `Too many attempts. Please try again in ${remainingTime} minutes.`)
          });
        }
      }

      // Reset if cooldown period has passed
      if (stryMutAct_9fa48("843") ? entry.cooldownUntil || now >= entry.cooldownUntil : stryMutAct_9fa48("842") ? false : stryMutAct_9fa48("841") ? true : (stryCov_9fa48("841", "842", "843"), entry.cooldownUntil && (stryMutAct_9fa48("846") ? now < entry.cooldownUntil : stryMutAct_9fa48("845") ? now > entry.cooldownUntil : stryMutAct_9fa48("844") ? true : (stryCov_9fa48("844", "845", "846"), now >= entry.cooldownUntil)))) {
        if (stryMutAct_9fa48("847")) {
          {}
        } else {
          stryCov_9fa48("847");
          this.rateLimitStorage.set(key, stryMutAct_9fa48("848") ? {} : (stryCov_9fa48("848"), {
            attempts: 1,
            lastAttempt: now
          }));
          return stryMutAct_9fa48("849") ? {} : (stryCov_9fa48("849"), {
            allowed: stryMutAct_9fa48("850") ? false : (stryCov_9fa48("850"), true)
          });
        }
      }

      // Increment attempts
      stryMutAct_9fa48("851") ? entry.attempts-- : (stryCov_9fa48("851"), entry.attempts++);
      entry.lastAttempt = now;
      if (stryMutAct_9fa48("855") ? entry.attempts <= maxAttempts : stryMutAct_9fa48("854") ? entry.attempts >= maxAttempts : stryMutAct_9fa48("853") ? false : stryMutAct_9fa48("852") ? true : (stryCov_9fa48("852", "853", "854", "855"), entry.attempts > maxAttempts)) {
        if (stryMutAct_9fa48("856")) {
          {}
        } else {
          stryCov_9fa48("856");
          entry.cooldownUntil = stryMutAct_9fa48("857") ? now - cooldownMs : (stryCov_9fa48("857"), now + cooldownMs);
          const cooldownMinutes = Math.ceil(stryMutAct_9fa48("858") ? cooldownMs * 60000 : (stryCov_9fa48("858"), cooldownMs / 60000));
          return stryMutAct_9fa48("859") ? {} : (stryCov_9fa48("859"), {
            allowed: stryMutAct_9fa48("860") ? true : (stryCov_9fa48("860"), false),
            error: stryMutAct_9fa48("861") ? `` : (stryCov_9fa48("861"), `Too many ${operation} attempts. Please try again in ${cooldownMinutes} minutes.`)
          });
        }
      }
      this.rateLimitStorage.set(key, entry);
      return stryMutAct_9fa48("862") ? {} : (stryCov_9fa48("862"), {
        allowed: stryMutAct_9fa48("863") ? false : (stryCov_9fa48("863"), true)
      });
    }
  }

  /**
   * Resets rate limiting for successful authentication
   */
  private resetRateLimit(username: string, operation: "login" | "signup"): void {
    if (stryMutAct_9fa48("864")) {
      {}
    } else {
      stryCov_9fa48("864");
      const key = stryMutAct_9fa48("865") ? `` : (stryCov_9fa48("865"), `${operation}:${stryMutAct_9fa48("866") ? username.toUpperCase() : (stryCov_9fa48("866"), username.toLowerCase())}`);
      this.rateLimitStorage.delete(key);
    }
  }

  /**
   * Validates signup credentials with enhanced security
   */
  private validateSignupCredentials(username: string, password: string, pair?: ISEAPair | null): {
    valid: boolean;
    error?: string;
  } {
    if (stryMutAct_9fa48("867")) {
      {}
    } else {
      stryCov_9fa48("867");
      // Check rate limiting first
      const rateLimitCheck = this.checkRateLimit(username, stryMutAct_9fa48("868") ? "" : (stryCov_9fa48("868"), "signup"));
      if (stryMutAct_9fa48("871") ? false : stryMutAct_9fa48("870") ? true : stryMutAct_9fa48("869") ? rateLimitCheck.allowed : (stryCov_9fa48("869", "870", "871"), !rateLimitCheck.allowed)) {
        if (stryMutAct_9fa48("872")) {
          {}
        } else {
          stryCov_9fa48("872");
          return stryMutAct_9fa48("873") ? {} : (stryCov_9fa48("873"), {
            valid: stryMutAct_9fa48("874") ? true : (stryCov_9fa48("874"), false),
            error: rateLimitCheck.error
          });
        }
      }

      // Validate username
      if (stryMutAct_9fa48("877") ? !username && username.length < 1 : stryMutAct_9fa48("876") ? false : stryMutAct_9fa48("875") ? true : (stryCov_9fa48("875", "876", "877"), (stryMutAct_9fa48("878") ? username : (stryCov_9fa48("878"), !username)) || (stryMutAct_9fa48("881") ? username.length >= 1 : stryMutAct_9fa48("880") ? username.length <= 1 : stryMutAct_9fa48("879") ? false : (stryCov_9fa48("879", "880", "881"), username.length < 1)))) {
        if (stryMutAct_9fa48("882")) {
          {}
        } else {
          stryCov_9fa48("882");
          return stryMutAct_9fa48("883") ? {} : (stryCov_9fa48("883"), {
            valid: stryMutAct_9fa48("884") ? true : (stryCov_9fa48("884"), false),
            error: stryMutAct_9fa48("885") ? "" : (stryCov_9fa48("885"), "Username must be more than 0 characters long!")
          });
        }
      }

      // Validate username format (alphanumeric and some special chars only)
      if (stryMutAct_9fa48("888") ? false : stryMutAct_9fa48("887") ? true : stryMutAct_9fa48("886") ? /^[a-zA-Z0-9._-]+$/.test(username) : (stryCov_9fa48("886", "887", "888"), !(stryMutAct_9fa48("892") ? /^[^a-zA-Z0-9._-]+$/ : stryMutAct_9fa48("891") ? /^[a-zA-Z0-9._-]$/ : stryMutAct_9fa48("890") ? /^[a-zA-Z0-9._-]+/ : stryMutAct_9fa48("889") ? /[a-zA-Z0-9._-]+$/ : (stryCov_9fa48("889", "890", "891", "892"), /^[a-zA-Z0-9._-]+$/)).test(username))) {
        if (stryMutAct_9fa48("893")) {
          {}
        } else {
          stryCov_9fa48("893");
          return stryMutAct_9fa48("894") ? {} : (stryCov_9fa48("894"), {
            valid: stryMutAct_9fa48("895") ? true : (stryCov_9fa48("895"), false),
            error: stryMutAct_9fa48("896") ? "" : (stryCov_9fa48("896"), "Username can only contain letters, numbers, dots, underscores, and hyphens")
          });
        }
      }

      // If using pair authentication, skip password validation
      if (stryMutAct_9fa48("898") ? false : stryMutAct_9fa48("897") ? true : (stryCov_9fa48("897", "898"), pair)) {
        if (stryMutAct_9fa48("899")) {
          {}
        } else {
          stryCov_9fa48("899");
          return stryMutAct_9fa48("900") ? {} : (stryCov_9fa48("900"), {
            valid: stryMutAct_9fa48("901") ? false : (stryCov_9fa48("901"), true)
          });
        }
      }

      // Validate password strength
      return this.validatePasswordStrength(password);
    }
  }

  /**
   * Checks if user exists by attempting authentication
   */
  private async checkUserExistence(username: string, password: string, pair?: ISEAPair | null): Promise<UserExistenceResult> {
    if (stryMutAct_9fa48("902")) {
      {}
    } else {
      stryCov_9fa48("902");
      return new Promise<UserExistenceResult>(resolve => {
        if (stryMutAct_9fa48("903")) {
          {}
        } else {
          stryCov_9fa48("903");
          if (stryMutAct_9fa48("905") ? false : stryMutAct_9fa48("904") ? true : (stryCov_9fa48("904", "905"), pair)) {
            if (stryMutAct_9fa48("906")) {
              {}
            } else {
              stryCov_9fa48("906");
              this.gun.user().auth(pair, (ack: any) => {
                if (stryMutAct_9fa48("907")) {
                  {}
                } else {
                  stryCov_9fa48("907");
                  if (stryMutAct_9fa48("909") ? false : stryMutAct_9fa48("908") ? true : (stryCov_9fa48("908", "909"), ack.err)) {
                    if (stryMutAct_9fa48("910")) {
                      {}
                    } else {
                      stryCov_9fa48("910");
                      resolve(stryMutAct_9fa48("911") ? {} : (stryCov_9fa48("911"), {
                        exists: stryMutAct_9fa48("912") ? true : (stryCov_9fa48("912"), false),
                        error: ack.err
                      }));
                    }
                  } else {
                    if (stryMutAct_9fa48("913")) {
                      {}
                    } else {
                      stryCov_9fa48("913");
                      resolve(stryMutAct_9fa48("914") ? {} : (stryCov_9fa48("914"), {
                        exists: stryMutAct_9fa48("915") ? false : (stryCov_9fa48("915"), true),
                        userPub: stryMutAct_9fa48("916") ? this.gun.user().is.pub : (stryCov_9fa48("916"), this.gun.user().is?.pub)
                      }));
                    }
                  }
                }
              });
            }
          } else {
            if (stryMutAct_9fa48("917")) {
              {}
            } else {
              stryCov_9fa48("917");
              this.gun.user().auth(username, password, (ack: any) => {
                if (stryMutAct_9fa48("918")) {
                  {}
                } else {
                  stryCov_9fa48("918");
                  if (stryMutAct_9fa48("920") ? false : stryMutAct_9fa48("919") ? true : (stryCov_9fa48("919", "920"), ack.err)) {
                    if (stryMutAct_9fa48("921")) {
                      {}
                    } else {
                      stryCov_9fa48("921");
                      resolve(stryMutAct_9fa48("922") ? {} : (stryCov_9fa48("922"), {
                        exists: stryMutAct_9fa48("923") ? true : (stryCov_9fa48("923"), false),
                        error: ack.err
                      }));
                    }
                  } else {
                    if (stryMutAct_9fa48("924")) {
                      {}
                    } else {
                      stryCov_9fa48("924");
                      resolve(stryMutAct_9fa48("925") ? {} : (stryCov_9fa48("925"), {
                        exists: stryMutAct_9fa48("926") ? false : (stryCov_9fa48("926"), true),
                        userPub: stryMutAct_9fa48("927") ? this.gun.user().is.pub : (stryCov_9fa48("927"), this.gun.user().is?.pub)
                      }));
                    }
                  }
                }
              });
            }
          }
        }
      });
    }
  }

  /**
   * Creates a new user in Gun
   */
  private async createNewUser(username: string, password: string): Promise<{
    success: boolean;
    error?: string;
    userPub?: string;
  }> {
    if (stryMutAct_9fa48("928")) {
      {}
    } else {
      stryCov_9fa48("928");
      return new Promise<{
        success: boolean;
        error?: string;
        userPub?: string;
      }>(resolve => {
        if (stryMutAct_9fa48("929")) {
          {}
        } else {
          stryCov_9fa48("929");
          // Validate inputs before creating user
          if (stryMutAct_9fa48("932") ? (!username || typeof username !== "string") && username.trim().length === 0 : stryMutAct_9fa48("931") ? false : stryMutAct_9fa48("930") ? true : (stryCov_9fa48("930", "931", "932"), (stryMutAct_9fa48("934") ? !username && typeof username !== "string" : stryMutAct_9fa48("933") ? false : (stryCov_9fa48("933", "934"), (stryMutAct_9fa48("935") ? username : (stryCov_9fa48("935"), !username)) || (stryMutAct_9fa48("937") ? typeof username === "string" : stryMutAct_9fa48("936") ? false : (stryCov_9fa48("936", "937"), typeof username !== (stryMutAct_9fa48("938") ? "" : (stryCov_9fa48("938"), "string")))))) || (stryMutAct_9fa48("940") ? username.trim().length !== 0 : stryMutAct_9fa48("939") ? false : (stryCov_9fa48("939", "940"), (stryMutAct_9fa48("941") ? username.length : (stryCov_9fa48("941"), username.trim().length)) === 0)))) {
            if (stryMutAct_9fa48("942")) {
              {}
            } else {
              stryCov_9fa48("942");
              resolve(stryMutAct_9fa48("943") ? {} : (stryCov_9fa48("943"), {
                success: stryMutAct_9fa48("944") ? true : (stryCov_9fa48("944"), false),
                error: stryMutAct_9fa48("945") ? "" : (stryCov_9fa48("945"), "Invalid username provided")
              }));
              return;
            }
          }
          if (stryMutAct_9fa48("948") ? (!password || typeof password !== "string") && password.length === 0 : stryMutAct_9fa48("947") ? false : stryMutAct_9fa48("946") ? true : (stryCov_9fa48("946", "947", "948"), (stryMutAct_9fa48("950") ? !password && typeof password !== "string" : stryMutAct_9fa48("949") ? false : (stryCov_9fa48("949", "950"), (stryMutAct_9fa48("951") ? password : (stryCov_9fa48("951"), !password)) || (stryMutAct_9fa48("953") ? typeof password === "string" : stryMutAct_9fa48("952") ? false : (stryCov_9fa48("952", "953"), typeof password !== (stryMutAct_9fa48("954") ? "" : (stryCov_9fa48("954"), "string")))))) || (stryMutAct_9fa48("956") ? password.length !== 0 : stryMutAct_9fa48("955") ? false : (stryCov_9fa48("955", "956"), password.length === 0)))) {
            if (stryMutAct_9fa48("957")) {
              {}
            } else {
              stryCov_9fa48("957");
              resolve(stryMutAct_9fa48("958") ? {} : (stryCov_9fa48("958"), {
                success: stryMutAct_9fa48("959") ? true : (stryCov_9fa48("959"), false),
                error: stryMutAct_9fa48("960") ? "" : (stryCov_9fa48("960"), "Invalid password provided")
              }));
              return;
            }
          }

          // Sanitize username
          const sanitizedUsername = this.sanitizeUsername(username);
          if (stryMutAct_9fa48("963") ? sanitizedUsername.length !== 0 : stryMutAct_9fa48("962") ? false : stryMutAct_9fa48("961") ? true : (stryCov_9fa48("961", "962", "963"), sanitizedUsername.length === 0)) {
            if (stryMutAct_9fa48("964")) {
              {}
            } else {
              stryCov_9fa48("964");
              resolve(stryMutAct_9fa48("965") ? {} : (stryCov_9fa48("965"), {
                success: stryMutAct_9fa48("966") ? true : (stryCov_9fa48("966"), false),
                error: stryMutAct_9fa48("967") ? "" : (stryCov_9fa48("967"), "Username contains only invalid characters")
              }));
              return;
            }
          }
          this.gun.user().create(sanitizedUsername, password, (ack: any) => {
            if (stryMutAct_9fa48("968")) {
              {}
            } else {
              stryCov_9fa48("968");
              if (stryMutAct_9fa48("970") ? false : stryMutAct_9fa48("969") ? true : (stryCov_9fa48("969", "970"), ack.err)) {
                if (stryMutAct_9fa48("971")) {
                  {}
                } else {
                  stryCov_9fa48("971");
                  console.error(stryMutAct_9fa48("972") ? `` : (stryCov_9fa48("972"), `User creation error: ${ack.err}`));
                  resolve(stryMutAct_9fa48("973") ? {} : (stryCov_9fa48("973"), {
                    success: stryMutAct_9fa48("974") ? true : (stryCov_9fa48("974"), false),
                    error: ack.err
                  }));
                }
              } else {
                if (stryMutAct_9fa48("975")) {
                  {}
                } else {
                  stryCov_9fa48("975");
                  // Validate that we got a userPub from creation
                  const userPub = ack.pub;
                  if (stryMutAct_9fa48("978") ? (!userPub || typeof userPub !== "string") && userPub.trim().length === 0 : stryMutAct_9fa48("977") ? false : stryMutAct_9fa48("976") ? true : (stryCov_9fa48("976", "977", "978"), (stryMutAct_9fa48("980") ? !userPub && typeof userPub !== "string" : stryMutAct_9fa48("979") ? false : (stryCov_9fa48("979", "980"), (stryMutAct_9fa48("981") ? userPub : (stryCov_9fa48("981"), !userPub)) || (stryMutAct_9fa48("983") ? typeof userPub === "string" : stryMutAct_9fa48("982") ? false : (stryCov_9fa48("982", "983"), typeof userPub !== (stryMutAct_9fa48("984") ? "" : (stryCov_9fa48("984"), "string")))))) || (stryMutAct_9fa48("986") ? userPub.trim().length !== 0 : stryMutAct_9fa48("985") ? false : (stryCov_9fa48("985", "986"), (stryMutAct_9fa48("987") ? userPub.length : (stryCov_9fa48("987"), userPub.trim().length)) === 0)))) {
                    if (stryMutAct_9fa48("988")) {
                      {}
                    } else {
                      stryCov_9fa48("988");
                      console.error(stryMutAct_9fa48("989") ? "" : (stryCov_9fa48("989"), "User creation successful but no userPub returned:"), ack);
                      resolve(stryMutAct_9fa48("990") ? {} : (stryCov_9fa48("990"), {
                        success: stryMutAct_9fa48("991") ? true : (stryCov_9fa48("991"), false),
                        error: stryMutAct_9fa48("992") ? "" : (stryCov_9fa48("992"), "User creation successful but no userPub returned")
                      }));
                    }
                  } else {
                    if (stryMutAct_9fa48("993")) {
                      {}
                    } else {
                      stryCov_9fa48("993");
                      console.log(stryMutAct_9fa48("994") ? `` : (stryCov_9fa48("994"), `User created successfully with userPub: ${userPub}`));
                      resolve(stryMutAct_9fa48("995") ? {} : (stryCov_9fa48("995"), {
                        success: stryMutAct_9fa48("996") ? false : (stryCov_9fa48("996"), true),
                        userPub: userPub
                      }));
                    }
                  }
                }
              }
            }
          });
        }
      });
    }
  }

  /**
   * Authenticates user after creation
   */
  private async authenticateNewUser(username: string, password: string, pair?: ISEAPair | null): Promise<{
    success: boolean;
    error?: string;
    userPub?: string;
  }> {
    if (stryMutAct_9fa48("997")) {
      {}
    } else {
      stryCov_9fa48("997");
      return new Promise<{
        success: boolean;
        error?: string;
        userPub?: string;
      }>(resolve => {
        if (stryMutAct_9fa48("998")) {
          {}
        } else {
          stryCov_9fa48("998");
          // Validate inputs before authentication
          if (stryMutAct_9fa48("1001") ? (!username || typeof username !== "string") && username.trim().length === 0 : stryMutAct_9fa48("1000") ? false : stryMutAct_9fa48("999") ? true : (stryCov_9fa48("999", "1000", "1001"), (stryMutAct_9fa48("1003") ? !username && typeof username !== "string" : stryMutAct_9fa48("1002") ? false : (stryCov_9fa48("1002", "1003"), (stryMutAct_9fa48("1004") ? username : (stryCov_9fa48("1004"), !username)) || (stryMutAct_9fa48("1006") ? typeof username === "string" : stryMutAct_9fa48("1005") ? false : (stryCov_9fa48("1005", "1006"), typeof username !== (stryMutAct_9fa48("1007") ? "" : (stryCov_9fa48("1007"), "string")))))) || (stryMutAct_9fa48("1009") ? username.trim().length !== 0 : stryMutAct_9fa48("1008") ? false : (stryCov_9fa48("1008", "1009"), (stryMutAct_9fa48("1010") ? username.length : (stryCov_9fa48("1010"), username.trim().length)) === 0)))) {
            if (stryMutAct_9fa48("1011")) {
              {}
            } else {
              stryCov_9fa48("1011");
              resolve(stryMutAct_9fa48("1012") ? {} : (stryCov_9fa48("1012"), {
                success: stryMutAct_9fa48("1013") ? true : (stryCov_9fa48("1013"), false),
                error: stryMutAct_9fa48("1014") ? "" : (stryCov_9fa48("1014"), "Invalid username provided")
              }));
              return;
            }
          }

          // Skip password validation when using pair authentication
          if (stryMutAct_9fa48("1017") ? !pair || !password || typeof password !== "string" || password.length === 0 : stryMutAct_9fa48("1016") ? false : stryMutAct_9fa48("1015") ? true : (stryCov_9fa48("1015", "1016", "1017"), (stryMutAct_9fa48("1018") ? pair : (stryCov_9fa48("1018"), !pair)) && (stryMutAct_9fa48("1020") ? (!password || typeof password !== "string") && password.length === 0 : stryMutAct_9fa48("1019") ? true : (stryCov_9fa48("1019", "1020"), (stryMutAct_9fa48("1022") ? !password && typeof password !== "string" : stryMutAct_9fa48("1021") ? false : (stryCov_9fa48("1021", "1022"), (stryMutAct_9fa48("1023") ? password : (stryCov_9fa48("1023"), !password)) || (stryMutAct_9fa48("1025") ? typeof password === "string" : stryMutAct_9fa48("1024") ? false : (stryCov_9fa48("1024", "1025"), typeof password !== (stryMutAct_9fa48("1026") ? "" : (stryCov_9fa48("1026"), "string")))))) || (stryMutAct_9fa48("1028") ? password.length !== 0 : stryMutAct_9fa48("1027") ? false : (stryCov_9fa48("1027", "1028"), password.length === 0)))))) {
            if (stryMutAct_9fa48("1029")) {
              {}
            } else {
              stryCov_9fa48("1029");
              resolve(stryMutAct_9fa48("1030") ? {} : (stryCov_9fa48("1030"), {
                success: stryMutAct_9fa48("1031") ? true : (stryCov_9fa48("1031"), false),
                error: stryMutAct_9fa48("1032") ? "" : (stryCov_9fa48("1032"), "Invalid password provided")
              }));
              return;
            }
          }

          // Sanitize username to match what was used in creation
          const sanitizedUsername = this.sanitizeUsername(username);
          if (stryMutAct_9fa48("1035") ? sanitizedUsername.length !== 0 : stryMutAct_9fa48("1034") ? false : stryMutAct_9fa48("1033") ? true : (stryCov_9fa48("1033", "1034", "1035"), sanitizedUsername.length === 0)) {
            if (stryMutAct_9fa48("1036")) {
              {}
            } else {
              stryCov_9fa48("1036");
              resolve(stryMutAct_9fa48("1037") ? {} : (stryCov_9fa48("1037"), {
                success: stryMutAct_9fa48("1038") ? true : (stryCov_9fa48("1038"), false),
                error: stryMutAct_9fa48("1039") ? "" : (stryCov_9fa48("1039"), "Username contains only invalid characters")
              }));
              return;
            }
          }
          if (stryMutAct_9fa48("1041") ? false : stryMutAct_9fa48("1040") ? true : (stryCov_9fa48("1040", "1041"), pair)) {
            if (stryMutAct_9fa48("1042")) {
              {}
            } else {
              stryCov_9fa48("1042");
              this.gun.user().auth(pair, (ack: any) => {
                if (stryMutAct_9fa48("1043")) {
                  {}
                } else {
                  stryCov_9fa48("1043");
                  console.log(stryMutAct_9fa48("1044") ? `` : (stryCov_9fa48("1044"), `Pair authentication after creation result:`), ack);
                  if (stryMutAct_9fa48("1046") ? false : stryMutAct_9fa48("1045") ? true : (stryCov_9fa48("1045", "1046"), ack.err)) {
                    if (stryMutAct_9fa48("1047")) {
                      {}
                    } else {
                      stryCov_9fa48("1047");
                      console.error(stryMutAct_9fa48("1048") ? `` : (stryCov_9fa48("1048"), `Authentication after creation failed: ${ack.err}`));
                      resolve(stryMutAct_9fa48("1049") ? {} : (stryCov_9fa48("1049"), {
                        success: stryMutAct_9fa48("1050") ? true : (stryCov_9fa48("1050"), false),
                        error: ack.err
                      }));
                    }
                  } else {
                    if (stryMutAct_9fa48("1051")) {
                      {}
                    } else {
                      stryCov_9fa48("1051");
                      // Add a small delay to ensure user state is properly set
                      setTimeout(() => {
                        if (stryMutAct_9fa48("1052")) {
                          {}
                        } else {
                          stryCov_9fa48("1052");
                          // Extract userPub from multiple possible sources
                          const userPub = stryMutAct_9fa48("1055") ? (ack.pub || this.gun.user().is?.pub) && ack.user?.pub : stryMutAct_9fa48("1054") ? false : stryMutAct_9fa48("1053") ? true : (stryCov_9fa48("1053", "1054", "1055"), (stryMutAct_9fa48("1057") ? ack.pub && this.gun.user().is?.pub : stryMutAct_9fa48("1056") ? false : (stryCov_9fa48("1056", "1057"), ack.pub || (stryMutAct_9fa48("1058") ? this.gun.user().is.pub : (stryCov_9fa48("1058"), this.gun.user().is?.pub)))) || (stryMutAct_9fa48("1059") ? ack.user.pub : (stryCov_9fa48("1059"), ack.user?.pub)));
                          console.log(stryMutAct_9fa48("1060") ? `` : (stryCov_9fa48("1060"), `Extracted userPub after pair auth: ${userPub}`));
                          console.log(stryMutAct_9fa48("1061") ? `` : (stryCov_9fa48("1061"), `User object after pair auth:`), this.gun.user());
                          console.log(stryMutAct_9fa48("1062") ? `` : (stryCov_9fa48("1062"), `User.is after pair auth:`), this.gun.user().is);
                          if (stryMutAct_9fa48("1065") ? false : stryMutAct_9fa48("1064") ? true : stryMutAct_9fa48("1063") ? userPub : (stryCov_9fa48("1063", "1064", "1065"), !userPub)) {
                            if (stryMutAct_9fa48("1066")) {
                              {}
                            } else {
                              stryCov_9fa48("1066");
                              console.error(stryMutAct_9fa48("1067") ? "" : (stryCov_9fa48("1067"), "Authentication successful but no userPub found"));
                              resolve(stryMutAct_9fa48("1068") ? {} : (stryCov_9fa48("1068"), {
                                success: stryMutAct_9fa48("1069") ? true : (stryCov_9fa48("1069"), false),
                                error: stryMutAct_9fa48("1070") ? "" : (stryCov_9fa48("1070"), "No userPub returned from authentication")
                              }));
                            }
                          } else {
                            if (stryMutAct_9fa48("1071")) {
                              {}
                            } else {
                              stryCov_9fa48("1071");
                              resolve(stryMutAct_9fa48("1072") ? {} : (stryCov_9fa48("1072"), {
                                success: stryMutAct_9fa48("1073") ? false : (stryCov_9fa48("1073"), true),
                                userPub: userPub
                              }));
                            }
                          }
                        }
                      }, 100);
                    }
                  }
                }
              });
            }
          } else {
            if (stryMutAct_9fa48("1074")) {
              {}
            } else {
              stryCov_9fa48("1074");
              this.gun.user().auth(sanitizedUsername, password, (ack: any) => {
                if (stryMutAct_9fa48("1075")) {
                  {}
                } else {
                  stryCov_9fa48("1075");
                  console.log(stryMutAct_9fa48("1076") ? `` : (stryCov_9fa48("1076"), `Password authentication after creation result:`), ack);
                  if (stryMutAct_9fa48("1078") ? false : stryMutAct_9fa48("1077") ? true : (stryCov_9fa48("1077", "1078"), ack.err)) {
                    if (stryMutAct_9fa48("1079")) {
                      {}
                    } else {
                      stryCov_9fa48("1079");
                      console.error(stryMutAct_9fa48("1080") ? `` : (stryCov_9fa48("1080"), `Authentication after creation failed: ${ack.err}`));
                      resolve(stryMutAct_9fa48("1081") ? {} : (stryCov_9fa48("1081"), {
                        success: stryMutAct_9fa48("1082") ? true : (stryCov_9fa48("1082"), false),
                        error: ack.err
                      }));
                    }
                  } else {
                    if (stryMutAct_9fa48("1083")) {
                      {}
                    } else {
                      stryCov_9fa48("1083");
                      // Add a small delay to ensure user state is properly set
                      setTimeout(() => {
                        if (stryMutAct_9fa48("1084")) {
                          {}
                        } else {
                          stryCov_9fa48("1084");
                          // Extract userPub from multiple possible sources
                          const userPub = stryMutAct_9fa48("1087") ? (ack.pub || this.gun.user().is?.pub) && ack.user?.pub : stryMutAct_9fa48("1086") ? false : stryMutAct_9fa48("1085") ? true : (stryCov_9fa48("1085", "1086", "1087"), (stryMutAct_9fa48("1089") ? ack.pub && this.gun.user().is?.pub : stryMutAct_9fa48("1088") ? false : (stryCov_9fa48("1088", "1089"), ack.pub || (stryMutAct_9fa48("1090") ? this.gun.user().is.pub : (stryCov_9fa48("1090"), this.gun.user().is?.pub)))) || (stryMutAct_9fa48("1091") ? ack.user.pub : (stryCov_9fa48("1091"), ack.user?.pub)));
                          console.log(stryMutAct_9fa48("1092") ? `` : (stryCov_9fa48("1092"), `Extracted userPub after password auth: ${userPub}`));
                          console.log(stryMutAct_9fa48("1093") ? `` : (stryCov_9fa48("1093"), `User object after password auth:`), this.gun.user());
                          console.log(stryMutAct_9fa48("1094") ? `` : (stryCov_9fa48("1094"), `User.is after password auth:`), this.gun.user().is);
                          if (stryMutAct_9fa48("1097") ? false : stryMutAct_9fa48("1096") ? true : stryMutAct_9fa48("1095") ? userPub : (stryCov_9fa48("1095", "1096", "1097"), !userPub)) {
                            if (stryMutAct_9fa48("1098")) {
                              {}
                            } else {
                              stryCov_9fa48("1098");
                              console.error(stryMutAct_9fa48("1099") ? "" : (stryCov_9fa48("1099"), "Authentication successful but no userPub found"));
                              resolve(stryMutAct_9fa48("1100") ? {} : (stryCov_9fa48("1100"), {
                                success: stryMutAct_9fa48("1101") ? true : (stryCov_9fa48("1101"), false),
                                error: stryMutAct_9fa48("1102") ? "" : (stryCov_9fa48("1102"), "No userPub returned from authentication")
                              }));
                            }
                          } else {
                            if (stryMutAct_9fa48("1103")) {
                              {}
                            } else {
                              stryCov_9fa48("1103");
                              resolve(stryMutAct_9fa48("1104") ? {} : (stryCov_9fa48("1104"), {
                                success: stryMutAct_9fa48("1105") ? false : (stryCov_9fa48("1105"), true),
                                userPub: userPub
                              }));
                            }
                          }
                        }
                      }, 100);
                    }
                  }
                }
              });
            }
          }
        }
      });
    }
  }

  /**
   * Signs up a new user using direct Gun authentication
   * @param username Username
   * @param password Password
   * @param pair Optional SEA pair for Web3 login
   * @returns Promise resolving to signup result
   */
  async signUp(username: string, password: string, pair?: ISEAPair | null): Promise<SignUpResult> {
    if (stryMutAct_9fa48("1106")) {
      {}
    } else {
      stryCov_9fa48("1106");
      try {
        if (stryMutAct_9fa48("1107")) {
          {}
        } else {
          stryCov_9fa48("1107");
          // Validate credentials with enhanced security
          const validation = this.validateSignupCredentials(username, password, pair);
          if (stryMutAct_9fa48("1110") ? false : stryMutAct_9fa48("1109") ? true : stryMutAct_9fa48("1108") ? validation.valid : (stryCov_9fa48("1108", "1109", "1110"), !validation.valid)) {
            if (stryMutAct_9fa48("1111")) {
              {}
            } else {
              stryCov_9fa48("1111");
              return stryMutAct_9fa48("1112") ? {} : (stryCov_9fa48("1112"), {
                success: stryMutAct_9fa48("1113") ? true : (stryCov_9fa48("1113"), false),
                error: validation.error
              });
            }
          }

          // First, check if username already exists without authentication
          const existingUserCheck = await this.checkUsernameExists(username);
          if (stryMutAct_9fa48("1115") ? false : stryMutAct_9fa48("1114") ? true : (stryCov_9fa48("1114", "1115"), existingUserCheck)) {
            if (stryMutAct_9fa48("1116")) {
              {}
            } else {
              stryCov_9fa48("1116");
              return stryMutAct_9fa48("1117") ? {} : (stryCov_9fa48("1117"), {
                success: stryMutAct_9fa48("1118") ? true : (stryCov_9fa48("1118"), false),
                error: stryMutAct_9fa48("1119") ? `` : (stryCov_9fa48("1119"), `Username '${username}' already exists. Please choose a different username or try logging in instead.`)
              });
            }
          }

          // Create new user - use different method based on authentication type
          let createResult;
          if (stryMutAct_9fa48("1121") ? false : stryMutAct_9fa48("1120") ? true : (stryCov_9fa48("1120", "1121"), pair)) {
            if (stryMutAct_9fa48("1122")) {
              {}
            } else {
              stryCov_9fa48("1122");
              // For Web3/plugin authentication, use pair-based creation
              createResult = await this.createNewUserWithPair(username, pair);
            }
          } else {
            if (stryMutAct_9fa48("1123")) {
              {}
            } else {
              stryCov_9fa48("1123");
              // For password authentication, use standard creation
              createResult = await this.createNewUser(username, password);
            }
          }
          if (stryMutAct_9fa48("1126") ? false : stryMutAct_9fa48("1125") ? true : stryMutAct_9fa48("1124") ? createResult.success : (stryCov_9fa48("1124", "1125", "1126"), !createResult.success)) {
            if (stryMutAct_9fa48("1127")) {
              {}
            } else {
              stryCov_9fa48("1127");
              return stryMutAct_9fa48("1128") ? {} : (stryCov_9fa48("1128"), {
                success: stryMutAct_9fa48("1129") ? true : (stryCov_9fa48("1129"), false),
                error: createResult.error
              });
            }
          }

          // Add a small delay to ensure user is properly registered
          await new Promise(stryMutAct_9fa48("1130") ? () => undefined : (stryCov_9fa48("1130"), resolve => setTimeout(resolve, 100)));

          // Authenticate the newly created user
          const authResult = await this.authenticateNewUser(username, password, pair);
          if (stryMutAct_9fa48("1133") ? false : stryMutAct_9fa48("1132") ? true : stryMutAct_9fa48("1131") ? authResult.success : (stryCov_9fa48("1131", "1132", "1133"), !authResult.success)) {
            if (stryMutAct_9fa48("1134")) {
              {}
            } else {
              stryCov_9fa48("1134");
              return stryMutAct_9fa48("1135") ? {} : (stryCov_9fa48("1135"), {
                success: stryMutAct_9fa48("1136") ? true : (stryCov_9fa48("1136"), false),
                error: authResult.error
              });
            }
          }

          // Validate that we have a userPub
          if (stryMutAct_9fa48("1139") ? (!authResult.userPub || typeof authResult.userPub !== "string") && authResult.userPub.trim().length === 0 : stryMutAct_9fa48("1138") ? false : stryMutAct_9fa48("1137") ? true : (stryCov_9fa48("1137", "1138", "1139"), (stryMutAct_9fa48("1141") ? !authResult.userPub && typeof authResult.userPub !== "string" : stryMutAct_9fa48("1140") ? false : (stryCov_9fa48("1140", "1141"), (stryMutAct_9fa48("1142") ? authResult.userPub : (stryCov_9fa48("1142"), !authResult.userPub)) || (stryMutAct_9fa48("1144") ? typeof authResult.userPub === "string" : stryMutAct_9fa48("1143") ? false : (stryCov_9fa48("1143", "1144"), typeof authResult.userPub !== (stryMutAct_9fa48("1145") ? "" : (stryCov_9fa48("1145"), "string")))))) || (stryMutAct_9fa48("1147") ? authResult.userPub.trim().length !== 0 : stryMutAct_9fa48("1146") ? false : (stryCov_9fa48("1146", "1147"), (stryMutAct_9fa48("1148") ? authResult.userPub.length : (stryCov_9fa48("1148"), authResult.userPub.trim().length)) === 0)))) {
            if (stryMutAct_9fa48("1149")) {
              {}
            } else {
              stryCov_9fa48("1149");
              console.error(stryMutAct_9fa48("1150") ? "" : (stryCov_9fa48("1150"), "Authentication successful but no valid userPub returned:"), authResult);
              return stryMutAct_9fa48("1151") ? {} : (stryCov_9fa48("1151"), {
                success: stryMutAct_9fa48("1152") ? true : (stryCov_9fa48("1152"), false),
                error: stryMutAct_9fa48("1153") ? "" : (stryCov_9fa48("1153"), "Authentication successful but no valid userPub returned")
              });
            }
          }

          // Set the user instance
          this.user = this.gun.user();

          // Reset rate limiting on successful signup
          this.resetRateLimit(username, stryMutAct_9fa48("1154") ? "" : (stryCov_9fa48("1154"), "signup"));

          // Run post-authentication tasks
          try {
            if (stryMutAct_9fa48("1155")) {
              {}
            } else {
              stryCov_9fa48("1155");
              console.log(stryMutAct_9fa48("1156") ? `` : (stryCov_9fa48("1156"), `Running post-auth setup with userPub: ${authResult.userPub}`));
              const postAuthResult = await this.runPostAuthOnAuthResult(username, authResult.userPub, authResult);

              // Return the post-auth result which includes the complete user data
              return postAuthResult;
            }
          } catch (postAuthError) {
            if (stryMutAct_9fa48("1157")) {
              {}
            } else {
              stryCov_9fa48("1157");
              console.error(stryMutAct_9fa48("1158") ? `` : (stryCov_9fa48("1158"), `Post-auth error: ${postAuthError}`));
              // Even if post-auth fails, the user was created and authenticated successfully
              return stryMutAct_9fa48("1159") ? {} : (stryCov_9fa48("1159"), {
                success: stryMutAct_9fa48("1160") ? false : (stryCov_9fa48("1160"), true),
                userPub: authResult.userPub,
                username: username,
                isNewUser: stryMutAct_9fa48("1161") ? false : (stryCov_9fa48("1161"), true),
                sea: (stryMutAct_9fa48("1163") ? (this.gun.user() as any)._?.sea : stryMutAct_9fa48("1162") ? (this.gun.user() as any)?._.sea : (stryCov_9fa48("1162", "1163"), (this.gun.user() as any)?._?.sea)) ? stryMutAct_9fa48("1164") ? {} : (stryCov_9fa48("1164"), {
                  pub: stryMutAct_9fa48("1165") ? (this.gun.user() as any)._.sea.pub : (stryCov_9fa48("1165"), (this.gun.user() as any)._?.sea.pub),
                  priv: stryMutAct_9fa48("1166") ? (this.gun.user() as any)._.sea.priv : (stryCov_9fa48("1166"), (this.gun.user() as any)._?.sea.priv),
                  epub: stryMutAct_9fa48("1167") ? (this.gun.user() as any)._.sea.epub : (stryCov_9fa48("1167"), (this.gun.user() as any)._?.sea.epub),
                  epriv: stryMutAct_9fa48("1168") ? (this.gun.user() as any)._.sea.epriv : (stryCov_9fa48("1168"), (this.gun.user() as any)._?.sea.epriv)
                }) : undefined
              });
            }
          }
        }
      } catch (error) {
        if (stryMutAct_9fa48("1169")) {
          {}
        } else {
          stryCov_9fa48("1169");
          console.error(stryMutAct_9fa48("1170") ? `` : (stryCov_9fa48("1170"), `Exception during signup for ${username}: ${error}`));
          return stryMutAct_9fa48("1171") ? {} : (stryCov_9fa48("1171"), {
            success: stryMutAct_9fa48("1172") ? true : (stryCov_9fa48("1172"), false),
            error: stryMutAct_9fa48("1173") ? `` : (stryCov_9fa48("1173"), `Signup failed: ${error}`)
          });
        }
      }
    }
  }

  /**
   * Creates a new user in Gun with pair-based authentication (for Web3/plugins)
   */
  private async createNewUserWithPair(username: string, pair: ISEAPair): Promise<{
    success: boolean;
    error?: string;
    userPub?: string;
  }> {
    if (stryMutAct_9fa48("1174")) {
      {}
    } else {
      stryCov_9fa48("1174");
      return new Promise<{
        success: boolean;
        error?: string;
        userPub?: string;
      }>(resolve => {
        if (stryMutAct_9fa48("1175")) {
          {}
        } else {
          stryCov_9fa48("1175");
          // Validate inputs before creating user
          if (stryMutAct_9fa48("1178") ? (!username || typeof username !== "string") && username.trim().length === 0 : stryMutAct_9fa48("1177") ? false : stryMutAct_9fa48("1176") ? true : (stryCov_9fa48("1176", "1177", "1178"), (stryMutAct_9fa48("1180") ? !username && typeof username !== "string" : stryMutAct_9fa48("1179") ? false : (stryCov_9fa48("1179", "1180"), (stryMutAct_9fa48("1181") ? username : (stryCov_9fa48("1181"), !username)) || (stryMutAct_9fa48("1183") ? typeof username === "string" : stryMutAct_9fa48("1182") ? false : (stryCov_9fa48("1182", "1183"), typeof username !== (stryMutAct_9fa48("1184") ? "" : (stryCov_9fa48("1184"), "string")))))) || (stryMutAct_9fa48("1186") ? username.trim().length !== 0 : stryMutAct_9fa48("1185") ? false : (stryCov_9fa48("1185", "1186"), (stryMutAct_9fa48("1187") ? username.length : (stryCov_9fa48("1187"), username.trim().length)) === 0)))) {
            if (stryMutAct_9fa48("1188")) {
              {}
            } else {
              stryCov_9fa48("1188");
              resolve(stryMutAct_9fa48("1189") ? {} : (stryCov_9fa48("1189"), {
                success: stryMutAct_9fa48("1190") ? true : (stryCov_9fa48("1190"), false),
                error: stryMutAct_9fa48("1191") ? "" : (stryCov_9fa48("1191"), "Invalid username provided")
              }));
              return;
            }
          }
          if (stryMutAct_9fa48("1194") ? (!pair || !pair.pub) && !pair.priv : stryMutAct_9fa48("1193") ? false : stryMutAct_9fa48("1192") ? true : (stryCov_9fa48("1192", "1193", "1194"), (stryMutAct_9fa48("1196") ? !pair && !pair.pub : stryMutAct_9fa48("1195") ? false : (stryCov_9fa48("1195", "1196"), (stryMutAct_9fa48("1197") ? pair : (stryCov_9fa48("1197"), !pair)) || (stryMutAct_9fa48("1198") ? pair.pub : (stryCov_9fa48("1198"), !pair.pub)))) || (stryMutAct_9fa48("1199") ? pair.priv : (stryCov_9fa48("1199"), !pair.priv)))) {
            if (stryMutAct_9fa48("1200")) {
              {}
            } else {
              stryCov_9fa48("1200");
              resolve(stryMutAct_9fa48("1201") ? {} : (stryCov_9fa48("1201"), {
                success: stryMutAct_9fa48("1202") ? true : (stryCov_9fa48("1202"), false),
                error: stryMutAct_9fa48("1203") ? "" : (stryCov_9fa48("1203"), "Invalid pair provided")
              }));
              return;
            }
          }

          // Sanitize username
          const sanitizedUsername = this.sanitizeUsername(username);
          if (stryMutAct_9fa48("1206") ? sanitizedUsername.length !== 0 : stryMutAct_9fa48("1205") ? false : stryMutAct_9fa48("1204") ? true : (stryCov_9fa48("1204", "1205", "1206"), sanitizedUsername.length === 0)) {
            if (stryMutAct_9fa48("1207")) {
              {}
            } else {
              stryCov_9fa48("1207");
              resolve(stryMutAct_9fa48("1208") ? {} : (stryCov_9fa48("1208"), {
                success: stryMutAct_9fa48("1209") ? true : (stryCov_9fa48("1209"), false),
                error: stryMutAct_9fa48("1210") ? "" : (stryCov_9fa48("1210"), "Username contains only invalid characters")
              }));
              return;
            }
          }

          // For pair-based authentication, we don't need to call gun.user().create()
          // because the pair already contains the cryptographic credentials
          // We just need to validate that the pair is valid and return success
          console.log(stryMutAct_9fa48("1211") ? `` : (stryCov_9fa48("1211"), `User created successfully with pair for: ${sanitizedUsername}`));
          resolve(stryMutAct_9fa48("1212") ? {} : (stryCov_9fa48("1212"), {
            success: stryMutAct_9fa48("1213") ? false : (stryCov_9fa48("1213"), true),
            userPub: pair.pub
          }));
        }
      });
    }
  }
  private async runPostAuthOnAuthResult(username: string, userPub: string, authResult: any): Promise<SignUpResult> {
    if (stryMutAct_9fa48("1214")) {
      {}
    } else {
      stryCov_9fa48("1214");
      // Setting up user profile after authentication

      try {
        if (stryMutAct_9fa48("1215")) {
          {}
        } else {
          stryCov_9fa48("1215");
          // Validate required parameters
          if (stryMutAct_9fa48("1218") ? (!username || typeof username !== "string") && username.trim().length === 0 : stryMutAct_9fa48("1217") ? false : stryMutAct_9fa48("1216") ? true : (stryCov_9fa48("1216", "1217", "1218"), (stryMutAct_9fa48("1220") ? !username && typeof username !== "string" : stryMutAct_9fa48("1219") ? false : (stryCov_9fa48("1219", "1220"), (stryMutAct_9fa48("1221") ? username : (stryCov_9fa48("1221"), !username)) || (stryMutAct_9fa48("1223") ? typeof username === "string" : stryMutAct_9fa48("1222") ? false : (stryCov_9fa48("1222", "1223"), typeof username !== (stryMutAct_9fa48("1224") ? "" : (stryCov_9fa48("1224"), "string")))))) || (stryMutAct_9fa48("1226") ? username.trim().length !== 0 : stryMutAct_9fa48("1225") ? false : (stryCov_9fa48("1225", "1226"), (stryMutAct_9fa48("1227") ? username.length : (stryCov_9fa48("1227"), username.trim().length)) === 0)))) {
            if (stryMutAct_9fa48("1228")) {
              {}
            } else {
              stryCov_9fa48("1228");
              throw new Error(stryMutAct_9fa48("1229") ? "" : (stryCov_9fa48("1229"), "Invalid username provided"));
            }
          }
          if (stryMutAct_9fa48("1232") ? (!userPub || typeof userPub !== "string") && userPub.trim().length === 0 : stryMutAct_9fa48("1231") ? false : stryMutAct_9fa48("1230") ? true : (stryCov_9fa48("1230", "1231", "1232"), (stryMutAct_9fa48("1234") ? !userPub && typeof userPub !== "string" : stryMutAct_9fa48("1233") ? false : (stryCov_9fa48("1233", "1234"), (stryMutAct_9fa48("1235") ? userPub : (stryCov_9fa48("1235"), !userPub)) || (stryMutAct_9fa48("1237") ? typeof userPub === "string" : stryMutAct_9fa48("1236") ? false : (stryCov_9fa48("1236", "1237"), typeof userPub !== (stryMutAct_9fa48("1238") ? "" : (stryCov_9fa48("1238"), "string")))))) || (stryMutAct_9fa48("1240") ? userPub.trim().length !== 0 : stryMutAct_9fa48("1239") ? false : (stryCov_9fa48("1239", "1240"), (stryMutAct_9fa48("1241") ? userPub.length : (stryCov_9fa48("1241"), userPub.trim().length)) === 0)))) {
            if (stryMutAct_9fa48("1242")) {
              {}
            } else {
              stryCov_9fa48("1242");
              console.error(stryMutAct_9fa48("1243") ? "" : (stryCov_9fa48("1243"), "Invalid userPub provided:"), stryMutAct_9fa48("1244") ? {} : (stryCov_9fa48("1244"), {
                userPub,
                type: typeof userPub,
                authResult
              }));
              throw new Error(stryMutAct_9fa48("1245") ? "" : (stryCov_9fa48("1245"), "Invalid userPub provided"));
            }
          }

          // Additional validation for userPub format
          if (stryMutAct_9fa48("1248") ? !userPub.includes(".") && userPub.length < 10 : stryMutAct_9fa48("1247") ? false : stryMutAct_9fa48("1246") ? true : (stryCov_9fa48("1246", "1247", "1248"), (stryMutAct_9fa48("1249") ? userPub.includes(".") : (stryCov_9fa48("1249"), !userPub.includes(stryMutAct_9fa48("1250") ? "" : (stryCov_9fa48("1250"), ".")))) || (stryMutAct_9fa48("1253") ? userPub.length >= 10 : stryMutAct_9fa48("1252") ? userPub.length <= 10 : stryMutAct_9fa48("1251") ? false : (stryCov_9fa48("1251", "1252", "1253"), userPub.length < 10)))) {
            if (stryMutAct_9fa48("1254")) {
              {}
            } else {
              stryCov_9fa48("1254");
              console.error(stryMutAct_9fa48("1255") ? "" : (stryCov_9fa48("1255"), "Invalid userPub format:"), userPub);
              throw new Error(stryMutAct_9fa48("1256") ? "" : (stryCov_9fa48("1256"), "Invalid userPub format"));
            }
          }

          // Sanitize username to prevent path issues
          const sanitizedUsername = this.sanitizeUsername(username);
          if (stryMutAct_9fa48("1259") ? sanitizedUsername.length !== 0 : stryMutAct_9fa48("1258") ? false : stryMutAct_9fa48("1257") ? true : (stryCov_9fa48("1257", "1258", "1259"), sanitizedUsername.length === 0)) {
            if (stryMutAct_9fa48("1260")) {
              {}
            } else {
              stryCov_9fa48("1260");
              throw new Error(stryMutAct_9fa48("1261") ? "" : (stryCov_9fa48("1261"), "Username contains only invalid characters"));
            }
          }
          console.log(stryMutAct_9fa48("1262") ? `` : (stryCov_9fa48("1262"), `Setting up user profile for ${sanitizedUsername} with userPub: ${userPub}`));
          const existingUser = await new Promise(resolve => {
            if (stryMutAct_9fa48("1263")) {
              {}
            } else {
              stryCov_9fa48("1263");
              this.gun.get(userPub).once((data: any) => {
                if (stryMutAct_9fa48("1264")) {
                  {}
                } else {
                  stryCov_9fa48("1264");
                  resolve(data);
                }
              });
            }
          });

          // Check if user already has metadata to avoid overwriting
          if (stryMutAct_9fa48("1267") ? false : stryMutAct_9fa48("1266") ? true : stryMutAct_9fa48("1265") ? existingUser : (stryCov_9fa48("1265", "1266", "1267"), !existingUser)) {
            if (stryMutAct_9fa48("1268")) {
              {}
            } else {
              stryCov_9fa48("1268");
              try {
                if (stryMutAct_9fa48("1269")) {
                  {}
                } else {
                  stryCov_9fa48("1269");
                  await new Promise((resolve, reject) => {
                    if (stryMutAct_9fa48("1270")) {
                      {}
                    } else {
                      stryCov_9fa48("1270");
                      this.gun.get(userPub).put(stryMutAct_9fa48("1271") ? {} : (stryCov_9fa48("1271"), {
                        username: sanitizedUsername
                      }), (ack: any) => {
                        if (stryMutAct_9fa48("1272")) {
                          {}
                        } else {
                          stryCov_9fa48("1272");
                          if (stryMutAct_9fa48("1274") ? false : stryMutAct_9fa48("1273") ? true : (stryCov_9fa48("1273", "1274"), ack.err)) {
                            if (stryMutAct_9fa48("1275")) {
                              {}
                            } else {
                              stryCov_9fa48("1275");
                              console.error(stryMutAct_9fa48("1276") ? `` : (stryCov_9fa48("1276"), `Error saving user metadata: ${ack.err}`));
                              reject(ack.err);
                            }
                          } else {
                            if (stryMutAct_9fa48("1277")) {
                              {}
                            } else {
                              stryCov_9fa48("1277");
                              // User metadata saved successfully
                              resolve(ack);
                            }
                          }
                        }
                      });
                    }
                  });
                }
              } catch (metadataError) {
                if (stryMutAct_9fa48("1278")) {
                  {}
                } else {
                  stryCov_9fa48("1278");
                  console.error(stryMutAct_9fa48("1279") ? `` : (stryCov_9fa48("1279"), `Error saving user metadata: ${metadataError}`));
                  // Don't throw here, continue with other operations
                }
              }

              // Create username mapping
              try {
                if (stryMutAct_9fa48("1280")) {
                  {}
                } else {
                  stryCov_9fa48("1280");
                  await new Promise((resolve, reject) => {
                    if (stryMutAct_9fa48("1281")) {
                      {}
                    } else {
                      stryCov_9fa48("1281");
                      this.node.get(stryMutAct_9fa48("1282") ? "" : (stryCov_9fa48("1282"), "usernames")).get(sanitizedUsername).put(userPub, (ack: any) => {
                        if (stryMutAct_9fa48("1283")) {
                          {}
                        } else {
                          stryCov_9fa48("1283");
                          if (stryMutAct_9fa48("1285") ? false : stryMutAct_9fa48("1284") ? true : (stryCov_9fa48("1284", "1285"), ack.err)) {
                            if (stryMutAct_9fa48("1286")) {
                              {}
                            } else {
                              stryCov_9fa48("1286");
                              reject(ack.err);
                            }
                          } else {
                            if (stryMutAct_9fa48("1287")) {
                              {}
                            } else {
                              stryCov_9fa48("1287");
                              // Username mapping created successfully
                              resolve(ack);
                            }
                          }
                        }
                      });
                    }
                  });
                }
              } catch (mappingError) {
                if (stryMutAct_9fa48("1288")) {
                  {}
                } else {
                  stryCov_9fa48("1288");
                  console.error(stryMutAct_9fa48("1289") ? `` : (stryCov_9fa48("1289"), `Error creating username mapping: ${mappingError}`));
                  // Don't throw here, continue with other operations
                }
              }

              // Add user to users collection
              try {
                if (stryMutAct_9fa48("1290")) {
                  {}
                } else {
                  stryCov_9fa48("1290");
                  await new Promise((resolve, reject) => {
                    if (stryMutAct_9fa48("1291")) {
                      {}
                    } else {
                      stryCov_9fa48("1291");
                      this.node.get(stryMutAct_9fa48("1292") ? "" : (stryCov_9fa48("1292"), "users")).set(this.gun.get(userPub), (ack: any) => {
                        if (stryMutAct_9fa48("1293")) {
                          {}
                        } else {
                          stryCov_9fa48("1293");
                          if (stryMutAct_9fa48("1295") ? false : stryMutAct_9fa48("1294") ? true : (stryCov_9fa48("1294", "1295"), ack.err)) {
                            if (stryMutAct_9fa48("1296")) {
                              {}
                            } else {
                              stryCov_9fa48("1296");
                              reject(ack.err);
                            }
                          } else {
                            if (stryMutAct_9fa48("1297")) {
                              {}
                            } else {
                              stryCov_9fa48("1297");
                              // User added to collection successfully
                              resolve(ack);
                            }
                          }
                        }
                      });
                    }
                  });
                }
              } catch (collectionError) {
                if (stryMutAct_9fa48("1298")) {
                  {}
                } else {
                  stryCov_9fa48("1298");
                  console.error(stryMutAct_9fa48("1299") ? `` : (stryCov_9fa48("1299"), `Error adding user to collection: ${collectionError}`));
                  // Don't throw here, continue with other operations
                }
              }
            }
          }
          return stryMutAct_9fa48("1300") ? {} : (stryCov_9fa48("1300"), {
            success: stryMutAct_9fa48("1301") ? false : (stryCov_9fa48("1301"), true),
            userPub: userPub,
            username: sanitizedUsername,
            isNewUser: stryMutAct_9fa48("1304") ? !existingUser && !(existingUser as any).username : stryMutAct_9fa48("1303") ? false : stryMutAct_9fa48("1302") ? true : (stryCov_9fa48("1302", "1303", "1304"), (stryMutAct_9fa48("1305") ? existingUser : (stryCov_9fa48("1305"), !existingUser)) || (stryMutAct_9fa48("1306") ? (existingUser as any).username : (stryCov_9fa48("1306"), !(existingUser as any).username))),
            // Get the SEA pair from the user object
            sea: (stryMutAct_9fa48("1308") ? (this.gun.user() as any)._?.sea : stryMutAct_9fa48("1307") ? (this.gun.user() as any)?._.sea : (stryCov_9fa48("1307", "1308"), (this.gun.user() as any)?._?.sea)) ? stryMutAct_9fa48("1309") ? {} : (stryCov_9fa48("1309"), {
              pub: stryMutAct_9fa48("1310") ? (this.gun.user() as any)._.sea.pub : (stryCov_9fa48("1310"), (this.gun.user() as any)._?.sea.pub),
              priv: stryMutAct_9fa48("1311") ? (this.gun.user() as any)._.sea.priv : (stryCov_9fa48("1311"), (this.gun.user() as any)._?.sea.priv),
              epub: stryMutAct_9fa48("1312") ? (this.gun.user() as any)._.sea.epub : (stryCov_9fa48("1312"), (this.gun.user() as any)._?.sea.epub),
              epriv: stryMutAct_9fa48("1313") ? (this.gun.user() as any)._.sea.epriv : (stryCov_9fa48("1313"), (this.gun.user() as any)._?.sea.epriv)
            }) : undefined
          });
        }
      } catch (error) {
        if (stryMutAct_9fa48("1314")) {
          {}
        } else {
          stryCov_9fa48("1314");
          console.error(stryMutAct_9fa48("1315") ? `` : (stryCov_9fa48("1315"), `Error in post-authentication setup: ${error}`));
          return stryMutAct_9fa48("1316") ? {} : (stryCov_9fa48("1316"), {
            success: stryMutAct_9fa48("1317") ? true : (stryCov_9fa48("1317"), false),
            error: stryMutAct_9fa48("1318") ? `` : (stryCov_9fa48("1318"), `Post-authentication setup failed: ${error}`)
          });
        }
      }
    }
  }

  /**
   * Normalizes username for consistent lookup
   */
  private normalizeUsername(username: string): {
    normalizedUsername: string;
    frozenKey: string;
    alternateKey: string;
  } {
    if (stryMutAct_9fa48("1319")) {
      {}
    } else {
      stryCov_9fa48("1319");
      const normalizedUsername = stryMutAct_9fa48("1321") ? username.toLowerCase() : stryMutAct_9fa48("1320") ? username.trim().toUpperCase() : (stryCov_9fa48("1320", "1321"), username.trim().toLowerCase());
      const frozenKey = stryMutAct_9fa48("1322") ? `` : (stryCov_9fa48("1322"), `#${normalizedUsername}`);
      const alternateKey = normalizedUsername;
      return stryMutAct_9fa48("1323") ? {} : (stryCov_9fa48("1323"), {
        normalizedUsername,
        frozenKey,
        alternateKey
      });
    }
  }

  /**
   * Strategy 1: Frozen space scan for immutable data
   */
  private async lookupInFrozenSpace(normalizedUsername: string): Promise<UsernameLookupResult | null> {
    if (stryMutAct_9fa48("1324")) {
      {}
    } else {
      stryCov_9fa48("1324");
      return new Promise(resolve => {
        if (stryMutAct_9fa48("1325")) {
          {}
        } else {
          stryCov_9fa48("1325");
          let found = stryMutAct_9fa48("1326") ? true : (stryCov_9fa48("1326"), false);
          this.node.get(stryMutAct_9fa48("1327") ? "" : (stryCov_9fa48("1327"), "usernames")).map().once((mappingData: any, hash: string) => {
            if (stryMutAct_9fa48("1328")) {
              {}
            } else {
              stryCov_9fa48("1328");
              if (stryMutAct_9fa48("1331") ? mappingData && mappingData.username === normalizedUsername || !found : stryMutAct_9fa48("1330") ? false : stryMutAct_9fa48("1329") ? true : (stryCov_9fa48("1329", "1330", "1331"), (stryMutAct_9fa48("1333") ? mappingData || mappingData.username === normalizedUsername : stryMutAct_9fa48("1332") ? true : (stryCov_9fa48("1332", "1333"), mappingData && (stryMutAct_9fa48("1335") ? mappingData.username !== normalizedUsername : stryMutAct_9fa48("1334") ? true : (stryCov_9fa48("1334", "1335"), mappingData.username === normalizedUsername)))) && (stryMutAct_9fa48("1336") ? found : (stryCov_9fa48("1336"), !found)))) {
                if (stryMutAct_9fa48("1337")) {
                  {}
                } else {
                  stryCov_9fa48("1337");
                  found = stryMutAct_9fa48("1338") ? false : (stryCov_9fa48("1338"), true);
                  resolve(stryMutAct_9fa48("1339") ? {} : (stryCov_9fa48("1339"), {
                    ...mappingData,
                    hash,
                    source: stryMutAct_9fa48("1340") ? "" : (stryCov_9fa48("1340"), "frozen_space"),
                    immutable: stryMutAct_9fa48("1341") ? false : (stryCov_9fa48("1341"), true)
                  }));
                }
              }
            }
          });
          setTimeout(() => {
            if (stryMutAct_9fa48("1342")) {
              {}
            } else {
              stryCov_9fa48("1342");
              if (stryMutAct_9fa48("1345") ? false : stryMutAct_9fa48("1344") ? true : stryMutAct_9fa48("1343") ? found : (stryCov_9fa48("1343", "1344", "1345"), !found)) resolve(null);
            }
          }, CONFIG.TIMEOUTS.LOOKUP_FROZEN_SPACE);
        }
      });
    }
  }

  /**
   * Strategy 2: Direct frozen mapping lookup
   */
  private async lookupDirectMapping(normalizedUsername: string, frozenKey: string): Promise<UsernameLookupResult | null> {
    if (stryMutAct_9fa48("1346")) {
      {}
    } else {
      stryCov_9fa48("1346");
      return new Promise(resolve => {
        if (stryMutAct_9fa48("1347")) {
          {}
        } else {
          stryCov_9fa48("1347");
          this.node.get(stryMutAct_9fa48("1348") ? "" : (stryCov_9fa48("1348"), "usernames")).get(frozenKey).once((data: any) => {
            if (stryMutAct_9fa48("1349")) {
              {}
            } else {
              stryCov_9fa48("1349");
              if (stryMutAct_9fa48("1351") ? false : stryMutAct_9fa48("1350") ? true : (stryCov_9fa48("1350", "1351"), data)) {
                if (stryMutAct_9fa48("1352")) {
                  {}
                } else {
                  stryCov_9fa48("1352");
                  resolve(stryMutAct_9fa48("1353") ? {} : (stryCov_9fa48("1353"), {
                    pub: data,
                    username: normalizedUsername,
                    source: stryMutAct_9fa48("1354") ? "" : (stryCov_9fa48("1354"), "direct_mapping"),
                    immutable: stryMutAct_9fa48("1355") ? true : (stryCov_9fa48("1355"), false)
                  }));
                }
              } else {
                if (stryMutAct_9fa48("1356")) {
                  {}
                } else {
                  stryCov_9fa48("1356");
                  resolve(null);
                }
              }
            }
          });
        }
      });
    }
  }

  /**
   * Strategy 3: Alternate key lookup
   */
  private async lookupAlternateKey(normalizedUsername: string, alternateKey: string): Promise<UsernameLookupResult | null> {
    if (stryMutAct_9fa48("1357")) {
      {}
    } else {
      stryCov_9fa48("1357");
      return new Promise(resolve => {
        if (stryMutAct_9fa48("1358")) {
          {}
        } else {
          stryCov_9fa48("1358");
          this.node.get(stryMutAct_9fa48("1359") ? "" : (stryCov_9fa48("1359"), "usernames")).get(alternateKey).once((data: any) => {
            if (stryMutAct_9fa48("1360")) {
              {}
            } else {
              stryCov_9fa48("1360");
              if (stryMutAct_9fa48("1362") ? false : stryMutAct_9fa48("1361") ? true : (stryCov_9fa48("1361", "1362"), data)) {
                if (stryMutAct_9fa48("1363")) {
                  {}
                } else {
                  stryCov_9fa48("1363");
                  resolve(stryMutAct_9fa48("1364") ? {} : (stryCov_9fa48("1364"), {
                    pub: data,
                    username: normalizedUsername,
                    source: stryMutAct_9fa48("1365") ? "" : (stryCov_9fa48("1365"), "alternate_key"),
                    immutable: stryMutAct_9fa48("1366") ? true : (stryCov_9fa48("1366"), false)
                  }));
                }
              } else {
                if (stryMutAct_9fa48("1367")) {
                  {}
                } else {
                  stryCov_9fa48("1367");
                  resolve(null);
                }
              }
            }
          });
        }
      });
    }
  }

  /**
   * Strategy 4: Comprehensive scan fallback
   */
  private async lookupComprehensiveScan(normalizedUsername: string, frozenKey: string, alternateKey: string): Promise<UsernameLookupResult | null> {
    if (stryMutAct_9fa48("1368")) {
      {}
    } else {
      stryCov_9fa48("1368");
      return new Promise(resolve => {
        if (stryMutAct_9fa48("1369")) {
          {}
        } else {
          stryCov_9fa48("1369");
          let found = stryMutAct_9fa48("1370") ? true : (stryCov_9fa48("1370"), false);
          this.node.get(stryMutAct_9fa48("1371") ? "" : (stryCov_9fa48("1371"), "usernames")).map().once((data: any, key: string) => {
            if (stryMutAct_9fa48("1372")) {
              {}
            } else {
              stryCov_9fa48("1372");
              if (stryMutAct_9fa48("1375") ? (key === frozenKey || key === alternateKey) && data || !found : stryMutAct_9fa48("1374") ? false : stryMutAct_9fa48("1373") ? true : (stryCov_9fa48("1373", "1374", "1375"), (stryMutAct_9fa48("1377") ? key === frozenKey || key === alternateKey || data : stryMutAct_9fa48("1376") ? true : (stryCov_9fa48("1376", "1377"), (stryMutAct_9fa48("1379") ? key === frozenKey && key === alternateKey : stryMutAct_9fa48("1378") ? true : (stryCov_9fa48("1378", "1379"), (stryMutAct_9fa48("1381") ? key !== frozenKey : stryMutAct_9fa48("1380") ? false : (stryCov_9fa48("1380", "1381"), key === frozenKey)) || (stryMutAct_9fa48("1383") ? key !== alternateKey : stryMutAct_9fa48("1382") ? false : (stryCov_9fa48("1382", "1383"), key === alternateKey)))) && data)) && (stryMutAct_9fa48("1384") ? found : (stryCov_9fa48("1384"), !found)))) {
                if (stryMutAct_9fa48("1385")) {
                  {}
                } else {
                  stryCov_9fa48("1385");
                  found = stryMutAct_9fa48("1386") ? false : (stryCov_9fa48("1386"), true);
                  resolve(stryMutAct_9fa48("1387") ? {} : (stryCov_9fa48("1387"), {
                    pub: data,
                    username: normalizedUsername,
                    source: stryMutAct_9fa48("1388") ? "" : (stryCov_9fa48("1388"), "comprehensive_scan"),
                    immutable: stryMutAct_9fa48("1389") ? true : (stryCov_9fa48("1389"), false)
                  }));
                }
              }
            }
          });
          setTimeout(() => {
            if (stryMutAct_9fa48("1390")) {
              {}
            } else {
              stryCov_9fa48("1390");
              if (stryMutAct_9fa48("1393") ? false : stryMutAct_9fa48("1392") ? true : stryMutAct_9fa48("1391") ? found : (stryCov_9fa48("1391", "1392", "1393"), !found)) resolve(null);
            }
          }, CONFIG.TIMEOUTS.LOOKUP_COMPREHENSIVE);
        }
      });
    }
  }

  /**
   * Creates lookup strategies array
   */
  private createLookupStrategies(normalizedUsername: string, frozenKey: string, alternateKey: string): Array<() => Promise<UsernameLookupResult | null>> {
    if (stryMutAct_9fa48("1394")) {
      {}
    } else {
      stryCov_9fa48("1394");
      return stryMutAct_9fa48("1395") ? [] : (stryCov_9fa48("1395"), [stryMutAct_9fa48("1396") ? () => undefined : (stryCov_9fa48("1396"), () => this.lookupInFrozenSpace(normalizedUsername)), stryMutAct_9fa48("1397") ? () => undefined : (stryCov_9fa48("1397"), () => this.lookupDirectMapping(normalizedUsername, frozenKey)), stryMutAct_9fa48("1398") ? () => undefined : (stryCov_9fa48("1398"), () => this.lookupAlternateKey(normalizedUsername, alternateKey)), stryMutAct_9fa48("1399") ? () => undefined : (stryCov_9fa48("1399"), () => this.lookupComprehensiveScan(normalizedUsername, frozenKey, alternateKey))]);
    }
  }

  /**
   * Processes lookup result to get complete user data
   */
  private async processLookupResult(result: UsernameLookupResult, normalizedUsername: string): Promise<any> {
    if (stryMutAct_9fa48("1400")) {
      {}
    } else {
      stryCov_9fa48("1400");
      // If we found a pub, try to fetch user data
      if (stryMutAct_9fa48("1403") ? typeof result.pub === "string" || result.pub : stryMutAct_9fa48("1402") ? false : stryMutAct_9fa48("1401") ? true : (stryCov_9fa48("1401", "1402", "1403"), (stryMutAct_9fa48("1405") ? typeof result.pub !== "string" : stryMutAct_9fa48("1404") ? true : (stryCov_9fa48("1404", "1405"), typeof result.pub === (stryMutAct_9fa48("1406") ? "" : (stryCov_9fa48("1406"), "string")))) && result.pub)) {
        if (stryMutAct_9fa48("1407")) {
          {}
        } else {
          stryCov_9fa48("1407");
          const pubKey = result.pub as string;
          const userData = await new Promise<any>(resolve => {
            if (stryMutAct_9fa48("1408")) {
              {}
            } else {
              stryCov_9fa48("1408");
              this.node.get(pubKey).once((data: any) => {
                if (stryMutAct_9fa48("1409")) {
                  {}
                } else {
                  stryCov_9fa48("1409");
                  resolve(stryMutAct_9fa48("1412") ? data && null : stryMutAct_9fa48("1411") ? false : stryMutAct_9fa48("1410") ? true : (stryCov_9fa48("1410", "1411", "1412"), data || null));
                }
              });
            }
          });

          // Always return an object with pub and username if possible
          if (stryMutAct_9fa48("1415") ? userData || userData.username : stryMutAct_9fa48("1414") ? false : stryMutAct_9fa48("1413") ? true : (stryCov_9fa48("1413", "1414", "1415"), userData && userData.username)) {
            if (stryMutAct_9fa48("1416")) {
              {}
            } else {
              stryCov_9fa48("1416");
              return stryMutAct_9fa48("1417") ? {} : (stryCov_9fa48("1417"), {
                ...userData,
                source: result.source,
                immutable: result.immutable,
                hash: result.hash
              });
            }
          }
          return stryMutAct_9fa48("1418") ? {} : (stryCov_9fa48("1418"), {
            pub: result.pub,
            username: normalizedUsername,
            source: result.source,
            immutable: result.immutable,
            hash: result.hash
          });
        }
      }

      // If result is already a complete object (from frozen space)
      if (stryMutAct_9fa48("1421") ? result.userPub || result.username : stryMutAct_9fa48("1420") ? false : stryMutAct_9fa48("1419") ? true : (stryCov_9fa48("1419", "1420", "1421"), result.userPub && result.username)) {
        if (stryMutAct_9fa48("1422")) {
          {}
        } else {
          stryCov_9fa48("1422");
          return result;
        }
      }
      return result;
    }
  }
  public async checkUsernameExists(username: string): Promise<any> {
    if (stryMutAct_9fa48("1423")) {
      {}
    } else {
      stryCov_9fa48("1423");
      try {
        if (stryMutAct_9fa48("1424")) {
          {}
        } else {
          stryCov_9fa48("1424");
          // Normalize username to handle variations
          const {
            normalizedUsername,
            frozenKey,
            alternateKey
          } = this.normalizeUsername(username);

          // Create multiple lookup strategies with frozen space priority
          const lookupStrategies = this.createLookupStrategies(normalizedUsername, frozenKey, alternateKey);

          // Sequential strategy execution with timeout
          for (const strategy of lookupStrategies) {
            if (stryMutAct_9fa48("1425")) {
              {}
            } else {
              stryCov_9fa48("1425");
              try {
                if (stryMutAct_9fa48("1426")) {
                  {}
                } else {
                  stryCov_9fa48("1426");
                  const result = await Promise.race(stryMutAct_9fa48("1427") ? [] : (stryCov_9fa48("1427"), [strategy(), new Promise<null>(stryMutAct_9fa48("1428") ? () => undefined : (stryCov_9fa48("1428"), (_, reject) => setTimeout(stryMutAct_9fa48("1429") ? () => undefined : (stryCov_9fa48("1429"), () => reject(new Error(stryMutAct_9fa48("1430") ? "" : (stryCov_9fa48("1430"), "Lookup timeout")))), CONFIG.TIMEOUTS.STRATEGY_TIMEOUT)))]));
                  if (stryMutAct_9fa48("1432") ? false : stryMutAct_9fa48("1431") ? true : (stryCov_9fa48("1431", "1432"), result)) {
                    if (stryMutAct_9fa48("1433")) {
                      {}
                    } else {
                      stryCov_9fa48("1433");
                      return await this.processLookupResult(result, normalizedUsername);
                    }
                  }
                }
              } catch (error) {
                // Silent for timeout or network errors
              }
            }
          }
          return null;
        }
      } catch (error) {
        if (stryMutAct_9fa48("1434")) {
          {}
        } else {
          stryCov_9fa48("1434");
          return null;
        }
      }
    }
  }

  /**
   * Performs authentication with Gun
   */
  private async performAuthentication(username: string, password: string, pair?: ISEAPair | null): Promise<{
    success: boolean;
    error?: string;
    ack?: any;
  }> {
    if (stryMutAct_9fa48("1435")) {
      {}
    } else {
      stryCov_9fa48("1435");
      return new Promise<{
        success: boolean;
        error?: string;
        ack?: any;
      }>(resolve => {
        if (stryMutAct_9fa48("1436")) {
          {}
        } else {
          stryCov_9fa48("1436");
          console.log(stryMutAct_9fa48("1437") ? `` : (stryCov_9fa48("1437"), `Attempting authentication for user: ${username}`));
          if (stryMutAct_9fa48("1439") ? false : stryMutAct_9fa48("1438") ? true : (stryCov_9fa48("1438", "1439"), pair)) {
            if (stryMutAct_9fa48("1440")) {
              {}
            } else {
              stryCov_9fa48("1440");
              this.gun.user().auth(pair, (ack: any) => {
                if (stryMutAct_9fa48("1441")) {
                  {}
                } else {
                  stryCov_9fa48("1441");
                  console.log(stryMutAct_9fa48("1442") ? `` : (stryCov_9fa48("1442"), `Pair authentication result:`), ack);
                  if (stryMutAct_9fa48("1444") ? false : stryMutAct_9fa48("1443") ? true : (stryCov_9fa48("1443", "1444"), ack.err)) {
                    if (stryMutAct_9fa48("1445")) {
                      {}
                    } else {
                      stryCov_9fa48("1445");
                      console.error(stryMutAct_9fa48("1446") ? `` : (stryCov_9fa48("1446"), `Login error for ${username}: ${ack.err}`));
                      resolve(stryMutAct_9fa48("1447") ? {} : (stryCov_9fa48("1447"), {
                        success: stryMutAct_9fa48("1448") ? true : (stryCov_9fa48("1448"), false),
                        error: ack.err
                      }));
                    }
                  } else {
                    if (stryMutAct_9fa48("1449")) {
                      {}
                    } else {
                      stryCov_9fa48("1449");
                      resolve(stryMutAct_9fa48("1450") ? {} : (stryCov_9fa48("1450"), {
                        success: stryMutAct_9fa48("1451") ? false : (stryCov_9fa48("1451"), true),
                        ack
                      }));
                    }
                  }
                }
              });
            }
          } else {
            if (stryMutAct_9fa48("1452")) {
              {}
            } else {
              stryCov_9fa48("1452");
              this.gun.user().auth(username, password, (ack: any) => {
                if (stryMutAct_9fa48("1453")) {
                  {}
                } else {
                  stryCov_9fa48("1453");
                  console.log(stryMutAct_9fa48("1454") ? `` : (stryCov_9fa48("1454"), `Password authentication result:`), ack);
                  if (stryMutAct_9fa48("1456") ? false : stryMutAct_9fa48("1455") ? true : (stryCov_9fa48("1455", "1456"), ack.err)) {
                    if (stryMutAct_9fa48("1457")) {
                      {}
                    } else {
                      stryCov_9fa48("1457");
                      console.error(stryMutAct_9fa48("1458") ? `` : (stryCov_9fa48("1458"), `Login error for ${username}: ${ack.err}`));
                      resolve(stryMutAct_9fa48("1459") ? {} : (stryCov_9fa48("1459"), {
                        success: stryMutAct_9fa48("1460") ? true : (stryCov_9fa48("1460"), false),
                        error: ack.err
                      }));
                    }
                  } else {
                    if (stryMutAct_9fa48("1461")) {
                      {}
                    } else {
                      stryCov_9fa48("1461");
                      resolve(stryMutAct_9fa48("1462") ? {} : (stryCov_9fa48("1462"), {
                        success: stryMutAct_9fa48("1463") ? false : (stryCov_9fa48("1463"), true),
                        ack
                      }));
                    }
                  }
                }
              });
            }
          }
        }
      });
    }
  }

  /**
   * Builds login result object
   */
  private buildLoginResult(username: string, userPub: string): AuthResult {
    if (stryMutAct_9fa48("1464")) {
      {}
    } else {
      stryCov_9fa48("1464");
      // Get the SEA pair from the user object
      const seaPair = stryMutAct_9fa48("1466") ? (this.gun.user() as any)._?.sea : stryMutAct_9fa48("1465") ? (this.gun.user() as any)?._.sea : (stryCov_9fa48("1465", "1466"), (this.gun.user() as any)?._?.sea);
      return stryMutAct_9fa48("1467") ? {} : (stryCov_9fa48("1467"), {
        success: stryMutAct_9fa48("1468") ? false : (stryCov_9fa48("1468"), true),
        userPub,
        username,
        // Include SEA pair for consistency with AuthResult interface
        sea: seaPair ? stryMutAct_9fa48("1469") ? {} : (stryCov_9fa48("1469"), {
          pub: seaPair.pub,
          priv: seaPair.priv,
          epub: seaPair.epub,
          epriv: seaPair.epriv
        }) : undefined
      });
    }
  }
  async login(username: string, password: string, pair?: ISEAPair | null): Promise<AuthResult> {
    if (stryMutAct_9fa48("1470")) {
      {}
    } else {
      stryCov_9fa48("1470");
      try {
        if (stryMutAct_9fa48("1471")) {
          {}
        } else {
          stryCov_9fa48("1471");
          // Check rate limiting first
          const rateLimitCheck = this.checkRateLimit(username, stryMutAct_9fa48("1472") ? "" : (stryCov_9fa48("1472"), "login"));
          if (stryMutAct_9fa48("1475") ? false : stryMutAct_9fa48("1474") ? true : stryMutAct_9fa48("1473") ? rateLimitCheck.allowed : (stryCov_9fa48("1473", "1474", "1475"), !rateLimitCheck.allowed)) {
            if (stryMutAct_9fa48("1476")) {
              {}
            } else {
              stryCov_9fa48("1476");
              return stryMutAct_9fa48("1477") ? {} : (stryCov_9fa48("1477"), {
                success: stryMutAct_9fa48("1478") ? true : (stryCov_9fa48("1478"), false),
                error: rateLimitCheck.error
              });
            }
          }
          const loginResult = await this.performAuthentication(username, password, pair);
          if (stryMutAct_9fa48("1481") ? false : stryMutAct_9fa48("1480") ? true : stryMutAct_9fa48("1479") ? loginResult.success : (stryCov_9fa48("1479", "1480", "1481"), !loginResult.success)) {
            if (stryMutAct_9fa48("1482")) {
              {}
            } else {
              stryCov_9fa48("1482");
              return stryMutAct_9fa48("1483") ? {} : (stryCov_9fa48("1483"), {
                success: stryMutAct_9fa48("1484") ? true : (stryCov_9fa48("1484"), false),
                error: stryMutAct_9fa48("1485") ? `` : (stryCov_9fa48("1485"), `User '${username}' not found. Please check your username or register first.`)
              });
            }
          }

          // Add a small delay to ensure user state is properly set
          await new Promise(stryMutAct_9fa48("1486") ? () => undefined : (stryCov_9fa48("1486"), resolve => setTimeout(resolve, 100)));
          const userPub = stryMutAct_9fa48("1487") ? this.gun.user().is.pub : (stryCov_9fa48("1487"), this.gun.user().is?.pub);
          console.log(stryMutAct_9fa48("1488") ? `` : (stryCov_9fa48("1488"), `Login authentication successful, extracted userPub: ${userPub}`));
          console.log(stryMutAct_9fa48("1489") ? `` : (stryCov_9fa48("1489"), `User object:`), this.gun.user());
          console.log(stryMutAct_9fa48("1490") ? `` : (stryCov_9fa48("1490"), `User.is:`), this.gun.user().is);
          if (stryMutAct_9fa48("1493") ? false : stryMutAct_9fa48("1492") ? true : stryMutAct_9fa48("1491") ? userPub : (stryCov_9fa48("1491", "1492", "1493"), !userPub)) {
            if (stryMutAct_9fa48("1494")) {
              {}
            } else {
              stryCov_9fa48("1494");
              return stryMutAct_9fa48("1495") ? {} : (stryCov_9fa48("1495"), {
                success: stryMutAct_9fa48("1496") ? true : (stryCov_9fa48("1496"), false),
                error: stryMutAct_9fa48("1497") ? "" : (stryCov_9fa48("1497"), "Authentication failed: No user pub returned.")
              });
            }
          }

          // Reset rate limiting on successful login
          this.resetRateLimit(username, stryMutAct_9fa48("1498") ? "" : (stryCov_9fa48("1498"), "login"));

          // Pass the userPub to runPostAuthOnAuthResult
          try {
            if (stryMutAct_9fa48("1499")) {
              {}
            } else {
              stryCov_9fa48("1499");
              await this.runPostAuthOnAuthResult(username, userPub, stryMutAct_9fa48("1500") ? {} : (stryCov_9fa48("1500"), {
                success: stryMutAct_9fa48("1501") ? false : (stryCov_9fa48("1501"), true),
                userPub: userPub
              }));
            }
          } catch (postAuthError) {
            if (stryMutAct_9fa48("1502")) {
              {}
            } else {
              stryCov_9fa48("1502");
              console.error(stryMutAct_9fa48("1503") ? `` : (stryCov_9fa48("1503"), `Post-auth error during login: ${postAuthError}`));
              // Continue with login even if post-auth fails
            }
          }

          // Save credentials for future sessions
          try {
            if (stryMutAct_9fa48("1504")) {
              {}
            } else {
              stryCov_9fa48("1504");
              const userInfo = stryMutAct_9fa48("1505") ? {} : (stryCov_9fa48("1505"), {
                username,
                pair: stryMutAct_9fa48("1506") ? pair && null : (stryCov_9fa48("1506"), pair ?? null),
                userPub: userPub
              });
              this.saveCredentials(userInfo);
            }
          } catch (saveError) {
            if (stryMutAct_9fa48("1507")) {
              {}
            } else {
              stryCov_9fa48("1507");
              console.error(stryMutAct_9fa48("1508") ? `` : (stryCov_9fa48("1508"), `Error saving credentials:`), saveError);
            }
          }
          return this.buildLoginResult(username, userPub);
        }
      } catch (error) {
        if (stryMutAct_9fa48("1509")) {
          {}
        } else {
          stryCov_9fa48("1509");
          console.error(stryMutAct_9fa48("1510") ? `` : (stryCov_9fa48("1510"), `Exception during login for ${username}: ${error}`));
          return stryMutAct_9fa48("1511") ? {} : (stryCov_9fa48("1511"), {
            success: stryMutAct_9fa48("1512") ? true : (stryCov_9fa48("1512"), false),
            error: String(error)
          });
        }
      }
    }
  }

  /**
   * Updates the user's alias (username) in Gun and saves the updated credentials
   * @param newAlias New alias/username to set
   * @returns Promise resolving to update result
   */
  async updateUserAlias(newAlias: string): Promise<{
    success: boolean;
    error?: string;
  }> {
    if (stryMutAct_9fa48("1513")) {
      {}
    } else {
      stryCov_9fa48("1513");
      try {
        if (stryMutAct_9fa48("1514")) {
          {}
        } else {
          stryCov_9fa48("1514");
          // Updating user alias to
          if (stryMutAct_9fa48("1517") ? false : stryMutAct_9fa48("1516") ? true : stryMutAct_9fa48("1515") ? this.user : (stryCov_9fa48("1515", "1516", "1517"), !this.user)) {
            if (stryMutAct_9fa48("1518")) {
              {}
            } else {
              stryCov_9fa48("1518");
              return stryMutAct_9fa48("1519") ? {} : (stryCov_9fa48("1519"), {
                success: stryMutAct_9fa48("1520") ? true : (stryCov_9fa48("1520"), false),
                error: stryMutAct_9fa48("1521") ? "" : (stryCov_9fa48("1521"), "User not authenticated")
              });
            }
          }
          await new Promise((resolve, reject) => {
            if (stryMutAct_9fa48("1522")) {
              {}
            } else {
              stryCov_9fa48("1522");
              this.user!.get(stryMutAct_9fa48("1523") ? "" : (stryCov_9fa48("1523"), "alias")).put(newAlias, (ack: any) => {
                if (stryMutAct_9fa48("1524")) {
                  {}
                } else {
                  stryCov_9fa48("1524");
                  if (stryMutAct_9fa48("1526") ? false : stryMutAct_9fa48("1525") ? true : (stryCov_9fa48("1525", "1526"), ack.err)) {
                    if (stryMutAct_9fa48("1527")) {
                      {}
                    } else {
                      stryCov_9fa48("1527");
                      reject(ack.err);
                    }
                  } else {
                    if (stryMutAct_9fa48("1528")) {
                      {}
                    } else {
                      stryCov_9fa48("1528");
                      resolve(ack);
                    }
                  }
                }
              });
            }
          });

          // User alias updated successfully to
          return stryMutAct_9fa48("1529") ? {} : (stryCov_9fa48("1529"), {
            success: stryMutAct_9fa48("1530") ? false : (stryCov_9fa48("1530"), true)
          });
        }
      } catch (error) {
        if (stryMutAct_9fa48("1531")) {
          {}
        } else {
          stryCov_9fa48("1531");
          console.error(stryMutAct_9fa48("1532") ? `` : (stryCov_9fa48("1532"), `Error updating user alias:`), error);
          return stryMutAct_9fa48("1533") ? {} : (stryCov_9fa48("1533"), {
            success: stryMutAct_9fa48("1534") ? true : (stryCov_9fa48("1534"), false),
            error: String(error)
          });
        }
      }
    }
  }

  /**
   * Encrypts session data before storage
   */
  private async encryptSessionData(data: any): Promise<string> {
    if (stryMutAct_9fa48("1535")) {
      {}
    } else {
      stryCov_9fa48("1535");
      try {
        if (stryMutAct_9fa48("1536")) {
          {}
        } else {
          stryCov_9fa48("1536");
          // Use a derived key from device fingerprint for encryption
          const deviceInfo = stryMutAct_9fa48("1537") ? navigator.userAgent - (typeof screen !== "undefined" ? screen.width + "x" + screen.height : "") : (stryCov_9fa48("1537"), navigator.userAgent + ((stryMutAct_9fa48("1540") ? typeof screen === "undefined" : stryMutAct_9fa48("1539") ? false : stryMutAct_9fa48("1538") ? true : (stryCov_9fa48("1538", "1539", "1540"), typeof screen !== (stryMutAct_9fa48("1541") ? "" : (stryCov_9fa48("1541"), "undefined")))) ? screen.width + (stryMutAct_9fa48("1542") ? "" : (stryCov_9fa48("1542"), "x")) + screen.height : stryMutAct_9fa48("1543") ? "Stryker was here!" : (stryCov_9fa48("1543"), "")));
          const encryptionKey = await SEA.work(deviceInfo, null, null, stryMutAct_9fa48("1544") ? {} : (stryCov_9fa48("1544"), {
            name: stryMutAct_9fa48("1545") ? "" : (stryCov_9fa48("1545"), "SHA-256")
          }));
          if (stryMutAct_9fa48("1548") ? false : stryMutAct_9fa48("1547") ? true : stryMutAct_9fa48("1546") ? encryptionKey : (stryCov_9fa48("1546", "1547", "1548"), !encryptionKey)) {
            if (stryMutAct_9fa48("1549")) {
              {}
            } else {
              stryCov_9fa48("1549");
              throw new Error(stryMutAct_9fa48("1550") ? "" : (stryCov_9fa48("1550"), "Failed to generate encryption key"));
            }
          }
          const encryptedData = await SEA.encrypt(JSON.stringify(data), encryptionKey);
          if (stryMutAct_9fa48("1553") ? false : stryMutAct_9fa48("1552") ? true : stryMutAct_9fa48("1551") ? encryptedData : (stryCov_9fa48("1551", "1552", "1553"), !encryptedData)) {
            if (stryMutAct_9fa48("1554")) {
              {}
            } else {
              stryCov_9fa48("1554");
              throw new Error(stryMutAct_9fa48("1555") ? "" : (stryCov_9fa48("1555"), "Failed to encrypt session data"));
            }
          }
          return encryptedData;
        }
      } catch (error) {
        if (stryMutAct_9fa48("1556")) {
          {}
        } else {
          stryCov_9fa48("1556");
          console.error(stryMutAct_9fa48("1557") ? "" : (stryCov_9fa48("1557"), "Error encrypting session data:"), error);
          throw error;
        }
      }
    }
  }

  /**
   * Decrypts session data from storage
   */
  private async decryptSessionData(encryptedData: string): Promise<any> {
    if (stryMutAct_9fa48("1558")) {
      {}
    } else {
      stryCov_9fa48("1558");
      try {
        if (stryMutAct_9fa48("1559")) {
          {}
        } else {
          stryCov_9fa48("1559");
          // Use the same device fingerprint for decryption
          const deviceInfo = stryMutAct_9fa48("1560") ? navigator.userAgent - (typeof screen !== "undefined" ? screen.width + "x" + screen.height : "") : (stryCov_9fa48("1560"), navigator.userAgent + ((stryMutAct_9fa48("1563") ? typeof screen === "undefined" : stryMutAct_9fa48("1562") ? false : stryMutAct_9fa48("1561") ? true : (stryCov_9fa48("1561", "1562", "1563"), typeof screen !== (stryMutAct_9fa48("1564") ? "" : (stryCov_9fa48("1564"), "undefined")))) ? screen.width + (stryMutAct_9fa48("1565") ? "" : (stryCov_9fa48("1565"), "x")) + screen.height : stryMutAct_9fa48("1566") ? "Stryker was here!" : (stryCov_9fa48("1566"), "")));
          const encryptionKey = await SEA.work(deviceInfo, null, null, stryMutAct_9fa48("1567") ? {} : (stryCov_9fa48("1567"), {
            name: stryMutAct_9fa48("1568") ? "" : (stryCov_9fa48("1568"), "SHA-256")
          }));
          if (stryMutAct_9fa48("1571") ? false : stryMutAct_9fa48("1570") ? true : stryMutAct_9fa48("1569") ? encryptionKey : (stryCov_9fa48("1569", "1570", "1571"), !encryptionKey)) {
            if (stryMutAct_9fa48("1572")) {
              {}
            } else {
              stryCov_9fa48("1572");
              throw new Error(stryMutAct_9fa48("1573") ? "" : (stryCov_9fa48("1573"), "Failed to generate decryption key"));
            }
          }
          const decryptedData = await SEA.decrypt(encryptedData, encryptionKey);
          if (stryMutAct_9fa48("1576") ? decryptedData !== undefined : stryMutAct_9fa48("1575") ? false : stryMutAct_9fa48("1574") ? true : (stryCov_9fa48("1574", "1575", "1576"), decryptedData === undefined)) {
            if (stryMutAct_9fa48("1577")) {
              {}
            } else {
              stryCov_9fa48("1577");
              throw new Error(stryMutAct_9fa48("1578") ? "" : (stryCov_9fa48("1578"), "Failed to decrypt session data"));
            }
          }
          return JSON.parse(decryptedData);
        }
      } catch (error) {
        if (stryMutAct_9fa48("1579")) {
          {}
        } else {
          stryCov_9fa48("1579");
          console.error(stryMutAct_9fa48("1580") ? "" : (stryCov_9fa48("1580"), "Error decrypting session data:"), error);
          throw error;
        }
      }
    }
  }
  private saveCredentials(userInfo: {
    username: string;
    pair: ISEAPair | null;
    userPub: string;
  }): void {
    if (stryMutAct_9fa48("1581")) {
      {}
    } else {
      stryCov_9fa48("1581");
      try {
        if (stryMutAct_9fa48("1582")) {
          {}
        } else {
          stryCov_9fa48("1582");
          const sessionInfo = stryMutAct_9fa48("1583") ? {} : (stryCov_9fa48("1583"), {
            username: userInfo.username,
            pair: userInfo.pair,
            userPub: userInfo.userPub,
            timestamp: Date.now(),
            expiresAt: stryMutAct_9fa48("1584") ? Date.now() - 7 * 24 * 60 * 60 * 1000 : (stryCov_9fa48("1584"), Date.now() + (stryMutAct_9fa48("1585") ? 7 * 24 * 60 * 60 / 1000 : (stryCov_9fa48("1585"), (stryMutAct_9fa48("1586") ? 7 * 24 * 60 / 60 : (stryCov_9fa48("1586"), (stryMutAct_9fa48("1587") ? 7 * 24 / 60 : (stryCov_9fa48("1587"), (stryMutAct_9fa48("1588") ? 7 / 24 : (stryCov_9fa48("1588"), 7 * 24)) * 60)) * 60)) * 1000))) // 7 days
          });
          if (stryMutAct_9fa48("1591") ? typeof sessionStorage === "undefined" : stryMutAct_9fa48("1590") ? false : stryMutAct_9fa48("1589") ? true : (stryCov_9fa48("1589", "1590", "1591"), typeof sessionStorage !== (stryMutAct_9fa48("1592") ? "" : (stryCov_9fa48("1592"), "undefined")))) {
            if (stryMutAct_9fa48("1593")) {
              {}
            } else {
              stryCov_9fa48("1593");
              // Encrypt session data before storage
              this.encryptSessionData(sessionInfo).then(encryptedData => {
                if (stryMutAct_9fa48("1594")) {
                  {}
                } else {
                  stryCov_9fa48("1594");
                  sessionStorage.setItem(stryMutAct_9fa48("1595") ? "" : (stryCov_9fa48("1595"), "gunSessionData"), encryptedData);
                }
              }).catch(error => {
                if (stryMutAct_9fa48("1596")) {
                  {}
                } else {
                  stryCov_9fa48("1596");
                  console.error(stryMutAct_9fa48("1597") ? "" : (stryCov_9fa48("1597"), "Failed to encrypt and save session data:"), error);
                  // Fallback to unencrypted storage (less secure)
                  sessionStorage.setItem(stryMutAct_9fa48("1598") ? "" : (stryCov_9fa48("1598"), "gunSessionData"), JSON.stringify(sessionInfo));
                }
              });
            }
          }
        }
      } catch (error) {
        if (stryMutAct_9fa48("1599")) {
          {}
        } else {
          stryCov_9fa48("1599");
          console.error(stryMutAct_9fa48("1600") ? `` : (stryCov_9fa48("1600"), `Error saving credentials: ${error}`));
        }
      }
    }
  }

  /**
   * Sets up security questions and password hint
   * @param username Username
   * @param password Current password
   * @param hint Password hint
   * @param securityQuestions Array of security questions
   * @param securityAnswers Array of answers to security questions
   * @returns Promise resolving with the operation result
   */
  async setPasswordHint(username: string, password: string, hint: string, securityQuestions: string[], securityAnswers: string[]): Promise<{
    success: boolean;
    error?: string;
  }> {
    if (stryMutAct_9fa48("1601")) {
      {}
    } else {
      stryCov_9fa48("1601");
      // Setting password hint for

      // Verify that the user is authenticated with password
      const loginResult = await this.login(username, password);
      if (stryMutAct_9fa48("1604") ? false : stryMutAct_9fa48("1603") ? true : stryMutAct_9fa48("1602") ? loginResult.success : (stryCov_9fa48("1602", "1603", "1604"), !loginResult.success)) {
        if (stryMutAct_9fa48("1605")) {
          {}
        } else {
          stryCov_9fa48("1605");
          return stryMutAct_9fa48("1606") ? {} : (stryCov_9fa48("1606"), {
            success: stryMutAct_9fa48("1607") ? true : (stryCov_9fa48("1607"), false),
            error: stryMutAct_9fa48("1608") ? "" : (stryCov_9fa48("1608"), "Authentication failed")
          });
        }
      }

      // Check if user was authenticated with password (not with other methods)
      const currentUser = this.getCurrentUser();
      if (stryMutAct_9fa48("1611") ? !currentUser && !currentUser.pub : stryMutAct_9fa48("1610") ? false : stryMutAct_9fa48("1609") ? true : (stryCov_9fa48("1609", "1610", "1611"), (stryMutAct_9fa48("1612") ? currentUser : (stryCov_9fa48("1612"), !currentUser)) || (stryMutAct_9fa48("1613") ? currentUser.pub : (stryCov_9fa48("1613"), !currentUser.pub)))) {
        if (stryMutAct_9fa48("1614")) {
          {}
        } else {
          stryCov_9fa48("1614");
          return stryMutAct_9fa48("1615") ? {} : (stryCov_9fa48("1615"), {
            success: stryMutAct_9fa48("1616") ? true : (stryCov_9fa48("1616"), false),
            error: stryMutAct_9fa48("1617") ? "" : (stryCov_9fa48("1617"), "User not authenticated")
          });
        }
      }
      try {
        if (stryMutAct_9fa48("1618")) {
          {}
        } else {
          stryCov_9fa48("1618");
          // Generate a proof of work from security question answers
          const answersText = securityAnswers.join(stryMutAct_9fa48("1619") ? "" : (stryCov_9fa48("1619"), "|"));
          let proofOfWork;
          try {
            if (stryMutAct_9fa48("1620")) {
              {}
            } else {
              stryCov_9fa48("1620");
              // Use SEA directly if available
              if (stryMutAct_9fa48("1623") ? SEA || SEA.work : stryMutAct_9fa48("1622") ? false : stryMutAct_9fa48("1621") ? true : (stryCov_9fa48("1621", "1622", "1623"), SEA && SEA.work)) {
                if (stryMutAct_9fa48("1624")) {
                  {}
                } else {
                  stryCov_9fa48("1624");
                  proofOfWork = await SEA.work(answersText, null, null, stryMutAct_9fa48("1625") ? {} : (stryCov_9fa48("1625"), {
                    name: stryMutAct_9fa48("1626") ? "" : (stryCov_9fa48("1626"), "SHA-256")
                  }));
                }
              } else if (stryMutAct_9fa48("1629") ? this.crypto || this.crypto.hashText : stryMutAct_9fa48("1628") ? false : stryMutAct_9fa48("1627") ? true : (stryCov_9fa48("1627", "1628", "1629"), this.crypto && this.crypto.hashText)) {
                if (stryMutAct_9fa48("1630")) {
                  {}
                } else {
                  stryCov_9fa48("1630");
                  proofOfWork = await this.crypto.hashText(answersText);
                }
              } else {
                if (stryMutAct_9fa48("1631")) {
                  {}
                } else {
                  stryCov_9fa48("1631");
                  throw new Error(stryMutAct_9fa48("1632") ? "" : (stryCov_9fa48("1632"), "Cryptographic functions not available"));
                }
              }
              if (stryMutAct_9fa48("1635") ? false : stryMutAct_9fa48("1634") ? true : stryMutAct_9fa48("1633") ? proofOfWork : (stryCov_9fa48("1633", "1634", "1635"), !proofOfWork)) {
                if (stryMutAct_9fa48("1636")) {
                  {}
                } else {
                  stryCov_9fa48("1636");
                  throw new Error(stryMutAct_9fa48("1637") ? "" : (stryCov_9fa48("1637"), "Failed to generate hash"));
                }
              }
            }
          } catch (hashError) {
            if (stryMutAct_9fa48("1638")) {
              {}
            } else {
              stryCov_9fa48("1638");
              console.error(stryMutAct_9fa48("1639") ? "" : (stryCov_9fa48("1639"), "Error generating hash:"), hashError);
              return stryMutAct_9fa48("1640") ? {} : (stryCov_9fa48("1640"), {
                success: stryMutAct_9fa48("1641") ? true : (stryCov_9fa48("1641"), false),
                error: stryMutAct_9fa48("1642") ? "" : (stryCov_9fa48("1642"), "Failed to generate security hash")
              });
            }
          }

          // Encrypt the password hint with the proof of work
          let encryptedHint;
          try {
            if (stryMutAct_9fa48("1643")) {
              {}
            } else {
              stryCov_9fa48("1643");
              if (stryMutAct_9fa48("1646") ? SEA || SEA.encrypt : stryMutAct_9fa48("1645") ? false : stryMutAct_9fa48("1644") ? true : (stryCov_9fa48("1644", "1645", "1646"), SEA && SEA.encrypt)) {
                if (stryMutAct_9fa48("1647")) {
                  {}
                } else {
                  stryCov_9fa48("1647");
                  encryptedHint = await SEA.encrypt(hint, proofOfWork);
                }
              } else if (stryMutAct_9fa48("1650") ? this.crypto || this.crypto.encrypt : stryMutAct_9fa48("1649") ? false : stryMutAct_9fa48("1648") ? true : (stryCov_9fa48("1648", "1649", "1650"), this.crypto && this.crypto.encrypt)) {
                if (stryMutAct_9fa48("1651")) {
                  {}
                } else {
                  stryCov_9fa48("1651");
                  encryptedHint = await this.crypto.encrypt(hint, proofOfWork);
                }
              } else {
                if (stryMutAct_9fa48("1652")) {
                  {}
                } else {
                  stryCov_9fa48("1652");
                  throw new Error(stryMutAct_9fa48("1653") ? "" : (stryCov_9fa48("1653"), "Encryption functions not available"));
                }
              }
              if (stryMutAct_9fa48("1656") ? false : stryMutAct_9fa48("1655") ? true : stryMutAct_9fa48("1654") ? encryptedHint : (stryCov_9fa48("1654", "1655", "1656"), !encryptedHint)) {
                if (stryMutAct_9fa48("1657")) {
                  {}
                } else {
                  stryCov_9fa48("1657");
                  throw new Error(stryMutAct_9fa48("1658") ? "" : (stryCov_9fa48("1658"), "Failed to encrypt hint"));
                }
              }
            }
          } catch (encryptError) {
            if (stryMutAct_9fa48("1659")) {
              {}
            } else {
              stryCov_9fa48("1659");
              console.error(stryMutAct_9fa48("1660") ? "" : (stryCov_9fa48("1660"), "Error encrypting hint:"), encryptError);
              return stryMutAct_9fa48("1661") ? {} : (stryCov_9fa48("1661"), {
                success: stryMutAct_9fa48("1662") ? true : (stryCov_9fa48("1662"), false),
                error: stryMutAct_9fa48("1663") ? "" : (stryCov_9fa48("1663"), "Failed to encrypt password hint")
              });
            }
          }

          // Save to the public graph, readable by anyone but only decryptable with the right answers.
          const userPub = currentUser.pub;
          const securityPayload = stryMutAct_9fa48("1664") ? {} : (stryCov_9fa48("1664"), {
            questions: JSON.stringify(securityQuestions),
            hint: encryptedHint
          });
          await new Promise<void>((resolve, reject) => {
            if (stryMutAct_9fa48("1665")) {
              {}
            } else {
              stryCov_9fa48("1665");
              (this.node.get(userPub) as any).get(stryMutAct_9fa48("1666") ? "" : (stryCov_9fa48("1666"), "security")).put(securityPayload, (ack: any) => {
                if (stryMutAct_9fa48("1667")) {
                  {}
                } else {
                  stryCov_9fa48("1667");
                  if (stryMutAct_9fa48("1669") ? false : stryMutAct_9fa48("1668") ? true : (stryCov_9fa48("1668", "1669"), ack.err)) {
                    if (stryMutAct_9fa48("1670")) {
                      {}
                    } else {
                      stryCov_9fa48("1670");
                      console.error(stryMutAct_9fa48("1671") ? "" : (stryCov_9fa48("1671"), "Error saving security data to public graph:"), ack.err);
                      reject(new Error(ack.err));
                    }
                  } else {
                    if (stryMutAct_9fa48("1672")) {
                      {}
                    } else {
                      stryCov_9fa48("1672");
                      // console.log(`Security data saved to public graph for ${userPub}`);
                      resolve();
                    }
                  }
                }
              });
            }
          });
          return stryMutAct_9fa48("1673") ? {} : (stryCov_9fa48("1673"), {
            success: stryMutAct_9fa48("1674") ? false : (stryCov_9fa48("1674"), true)
          });
        }
      } catch (error) {
        if (stryMutAct_9fa48("1675")) {
          {}
        } else {
          stryCov_9fa48("1675");
          console.error(stryMutAct_9fa48("1676") ? "" : (stryCov_9fa48("1676"), "Error setting password hint:"), error);
          return stryMutAct_9fa48("1677") ? {} : (stryCov_9fa48("1677"), {
            success: stryMutAct_9fa48("1678") ? true : (stryCov_9fa48("1678"), false),
            error: String(error)
          });
        }
      }
    }
  }

  /**
   * Recovers password hint using security question answers
   * @param username Username
   * @param securityAnswers Array of answers to security questions
   * @returns Promise resolving with the password hint
   */
  async forgotPassword(username: string, securityAnswers: string[]): Promise<{
    success: boolean;
    hint?: string;
    error?: string;
  }> {
    if (stryMutAct_9fa48("1679")) {
      {}
    } else {
      stryCov_9fa48("1679");
      // Attempting password recovery for

      try {
        if (stryMutAct_9fa48("1680")) {
          {}
        } else {
          stryCov_9fa48("1680");
          // Find the user's data
          let userData = await this.checkUsernameExists(username);

          // Patch: if userData is a string, treat as pub
          if (stryMutAct_9fa48("1683") ? typeof userData !== "string" : stryMutAct_9fa48("1682") ? false : stryMutAct_9fa48("1681") ? true : (stryCov_9fa48("1681", "1682", "1683"), typeof userData === (stryMutAct_9fa48("1684") ? "" : (stryCov_9fa48("1684"), "string")))) {
            if (stryMutAct_9fa48("1685")) {
              {}
            } else {
              stryCov_9fa48("1685");
              userData = stryMutAct_9fa48("1686") ? {} : (stryCov_9fa48("1686"), {
                pub: userData,
                username
              });
            }
          }
          if (stryMutAct_9fa48("1689") ? !userData && !userData.pub : stryMutAct_9fa48("1688") ? false : stryMutAct_9fa48("1687") ? true : (stryCov_9fa48("1687", "1688", "1689"), (stryMutAct_9fa48("1690") ? userData : (stryCov_9fa48("1690"), !userData)) || (stryMutAct_9fa48("1691") ? userData.pub : (stryCov_9fa48("1691"), !userData.pub)))) {
            if (stryMutAct_9fa48("1692")) {
              {}
            } else {
              stryCov_9fa48("1692");
              return stryMutAct_9fa48("1693") ? {} : (stryCov_9fa48("1693"), {
                success: stryMutAct_9fa48("1694") ? true : (stryCov_9fa48("1694"), false),
                error: stryMutAct_9fa48("1695") ? "" : (stryCov_9fa48("1695"), "User not found")
              });
            }
          }

          // Extract the public key from user data
          const userPub = userData.pub;
          // console.log(`Found user public key for password recovery: ${userPub}`);

          // Access the user's security data directly from their public key node
          const securityData = await new Promise<any>(resolve => {
            if (stryMutAct_9fa48("1696")) {
              {}
            } else {
              stryCov_9fa48("1696");
              (this.node.get(userPub) as any).get(stryMutAct_9fa48("1697") ? "" : (stryCov_9fa48("1697"), "security")).once((data: any) => {
                if (stryMutAct_9fa48("1698")) {
                  {}
                } else {
                  stryCov_9fa48("1698");
                  // console.log(
                  //   `Retrieved security data for user ${username}:`,
                  //   data ? "found" : "not found",
                  // );
                  resolve(data);
                }
              });
            }
          });
          if (stryMutAct_9fa48("1701") ? !securityData && !securityData.hint : stryMutAct_9fa48("1700") ? false : stryMutAct_9fa48("1699") ? true : (stryCov_9fa48("1699", "1700", "1701"), (stryMutAct_9fa48("1702") ? securityData : (stryCov_9fa48("1702"), !securityData)) || (stryMutAct_9fa48("1703") ? securityData.hint : (stryCov_9fa48("1703"), !securityData.hint)))) {
            if (stryMutAct_9fa48("1704")) {
              {}
            } else {
              stryCov_9fa48("1704");
              return stryMutAct_9fa48("1705") ? {} : (stryCov_9fa48("1705"), {
                success: stryMutAct_9fa48("1706") ? true : (stryCov_9fa48("1706"), false),
                error: stryMutAct_9fa48("1707") ? "" : (stryCov_9fa48("1707"), "No password hint found")
              });
            }
          }

          // Generate hash from security answers
          const answersText = securityAnswers.join(stryMutAct_9fa48("1708") ? "" : (stryCov_9fa48("1708"), "|"));
          let proofOfWork;
          try {
            if (stryMutAct_9fa48("1709")) {
              {}
            } else {
              stryCov_9fa48("1709");
              // Use SEA directly if available
              if (stryMutAct_9fa48("1712") ? SEA || SEA.work : stryMutAct_9fa48("1711") ? false : stryMutAct_9fa48("1710") ? true : (stryCov_9fa48("1710", "1711", "1712"), SEA && SEA.work)) {
                if (stryMutAct_9fa48("1713")) {
                  {}
                } else {
                  stryCov_9fa48("1713");
                  proofOfWork = await SEA.work(answersText, null, null, stryMutAct_9fa48("1714") ? {} : (stryCov_9fa48("1714"), {
                    name: stryMutAct_9fa48("1715") ? "" : (stryCov_9fa48("1715"), "SHA-256")
                  }));
                }
              } else if (stryMutAct_9fa48("1718") ? this.crypto || this.crypto.hashText : stryMutAct_9fa48("1717") ? false : stryMutAct_9fa48("1716") ? true : (stryCov_9fa48("1716", "1717", "1718"), this.crypto && this.crypto.hashText)) {
                if (stryMutAct_9fa48("1719")) {
                  {}
                } else {
                  stryCov_9fa48("1719");
                  proofOfWork = await this.crypto.hashText(answersText);
                }
              } else {
                if (stryMutAct_9fa48("1720")) {
                  {}
                } else {
                  stryCov_9fa48("1720");
                  throw new Error(stryMutAct_9fa48("1721") ? "" : (stryCov_9fa48("1721"), "Cryptographic functions not available"));
                }
              }
              if (stryMutAct_9fa48("1724") ? false : stryMutAct_9fa48("1723") ? true : stryMutAct_9fa48("1722") ? proofOfWork : (stryCov_9fa48("1722", "1723", "1724"), !proofOfWork)) {
                if (stryMutAct_9fa48("1725")) {
                  {}
                } else {
                  stryCov_9fa48("1725");
                  throw new Error(stryMutAct_9fa48("1726") ? "" : (stryCov_9fa48("1726"), "Failed to generate hash"));
                }
              }
            }
          } catch (hashError) {
            if (stryMutAct_9fa48("1727")) {
              {}
            } else {
              stryCov_9fa48("1727");
              console.error(stryMutAct_9fa48("1728") ? "" : (stryCov_9fa48("1728"), "Error generating hash:"), hashError);
              return stryMutAct_9fa48("1729") ? {} : (stryCov_9fa48("1729"), {
                success: stryMutAct_9fa48("1730") ? true : (stryCov_9fa48("1730"), false),
                error: stryMutAct_9fa48("1731") ? "" : (stryCov_9fa48("1731"), "Failed to generate security hash")
              });
            }
          }

          // Decrypt the password hint with the proof of work
          let hint;
          try {
            if (stryMutAct_9fa48("1732")) {
              {}
            } else {
              stryCov_9fa48("1732");
              if (stryMutAct_9fa48("1735") ? SEA || SEA.decrypt : stryMutAct_9fa48("1734") ? false : stryMutAct_9fa48("1733") ? true : (stryCov_9fa48("1733", "1734", "1735"), SEA && SEA.decrypt)) {
                if (stryMutAct_9fa48("1736")) {
                  {}
                } else {
                  stryCov_9fa48("1736");
                  hint = await SEA.decrypt(securityData.hint, proofOfWork);
                }
              } else if (stryMutAct_9fa48("1739") ? this.crypto || this.crypto.decrypt : stryMutAct_9fa48("1738") ? false : stryMutAct_9fa48("1737") ? true : (stryCov_9fa48("1737", "1738", "1739"), this.crypto && this.crypto.decrypt)) {
                if (stryMutAct_9fa48("1740")) {
                  {}
                } else {
                  stryCov_9fa48("1740");
                  hint = await this.crypto.decrypt(securityData.hint, proofOfWork);
                }
              } else {
                if (stryMutAct_9fa48("1741")) {
                  {}
                } else {
                  stryCov_9fa48("1741");
                  throw new Error(stryMutAct_9fa48("1742") ? "" : (stryCov_9fa48("1742"), "Decryption functions not available"));
                }
              }
            }
          } catch (decryptError) {
            if (stryMutAct_9fa48("1743")) {
              {}
            } else {
              stryCov_9fa48("1743");
              return stryMutAct_9fa48("1744") ? {} : (stryCov_9fa48("1744"), {
                success: stryMutAct_9fa48("1745") ? true : (stryCov_9fa48("1745"), false),
                error: stryMutAct_9fa48("1746") ? "" : (stryCov_9fa48("1746"), "Incorrect answers to security questions")
              });
            }
          }
          if (stryMutAct_9fa48("1749") ? hint !== undefined : stryMutAct_9fa48("1748") ? false : stryMutAct_9fa48("1747") ? true : (stryCov_9fa48("1747", "1748", "1749"), hint === undefined)) {
            if (stryMutAct_9fa48("1750")) {
              {}
            } else {
              stryCov_9fa48("1750");
              return stryMutAct_9fa48("1751") ? {} : (stryCov_9fa48("1751"), {
                success: stryMutAct_9fa48("1752") ? true : (stryCov_9fa48("1752"), false),
                error: stryMutAct_9fa48("1753") ? "" : (stryCov_9fa48("1753"), "Incorrect answers to security questions")
              });
            }
          }
          return stryMutAct_9fa48("1754") ? {} : (stryCov_9fa48("1754"), {
            success: stryMutAct_9fa48("1755") ? false : (stryCov_9fa48("1755"), true),
            hint: hint as string
          });
        }
      } catch (error) {
        if (stryMutAct_9fa48("1756")) {
          {}
        } else {
          stryCov_9fa48("1756");
          console.error(stryMutAct_9fa48("1757") ? "" : (stryCov_9fa48("1757"), "Error recovering password hint:"), error);
          return stryMutAct_9fa48("1758") ? {} : (stryCov_9fa48("1758"), {
            success: stryMutAct_9fa48("1759") ? true : (stryCov_9fa48("1759"), false),
            error: String(error)
          });
        }
      }
    }
  }

  /**
   * Saves user data at the specified path
   * @param path Path to save the data (supports nested paths like "test/data/marco")
   * @param data Data to save
   * @returns Promise that resolves when the data is saved
   */
  async putUserData(path: string, data: any): Promise<void> {
    if (stryMutAct_9fa48("1760")) {
      {}
    } else {
      stryCov_9fa48("1760");
      return new Promise((resolve, reject) => {
        if (stryMutAct_9fa48("1761")) {
          {}
        } else {
          stryCov_9fa48("1761");
          const user = this.gun.user();
          if (stryMutAct_9fa48("1764") ? false : stryMutAct_9fa48("1763") ? true : stryMutAct_9fa48("1762") ? user.is : (stryCov_9fa48("1762", "1763", "1764"), !user.is)) {
            if (stryMutAct_9fa48("1765")) {
              {}
            } else {
              stryCov_9fa48("1765");
              this.emitDataEvent(stryMutAct_9fa48("1766") ? "" : (stryCov_9fa48("1766"), "gun:put"), stryMutAct_9fa48("1767") ? `` : (stryCov_9fa48("1767"), `user/${path}`), data, stryMutAct_9fa48("1768") ? true : (stryCov_9fa48("1768"), false), stryMutAct_9fa48("1769") ? "" : (stryCov_9fa48("1769"), "User not authenticated"));
              reject(new Error(stryMutAct_9fa48("1770") ? "" : (stryCov_9fa48("1770"), "User not authenticated")));
              return;
            }
          }
          this.navigateToPath(user, path).put(data, (ack: any) => {
            if (stryMutAct_9fa48("1771")) {
              {}
            } else {
              stryCov_9fa48("1771");
              if (stryMutAct_9fa48("1773") ? false : stryMutAct_9fa48("1772") ? true : (stryCov_9fa48("1772", "1773"), ack.err)) {
                if (stryMutAct_9fa48("1774")) {
                  {}
                } else {
                  stryCov_9fa48("1774");
                  this.emitDataEvent(stryMutAct_9fa48("1775") ? "" : (stryCov_9fa48("1775"), "gun:put"), stryMutAct_9fa48("1776") ? `` : (stryCov_9fa48("1776"), `user/${path}`), data, stryMutAct_9fa48("1777") ? true : (stryCov_9fa48("1777"), false), ack.err);
                  reject(new Error(ack.err));
                }
              } else {
                if (stryMutAct_9fa48("1778")) {
                  {}
                } else {
                  stryCov_9fa48("1778");
                  this.emitDataEvent(stryMutAct_9fa48("1779") ? "" : (stryCov_9fa48("1779"), "gun:put"), stryMutAct_9fa48("1780") ? `` : (stryCov_9fa48("1780"), `user/${path}`), data, stryMutAct_9fa48("1781") ? false : (stryCov_9fa48("1781"), true));
                  resolve(ack);
                }
              }
            }
          });
        }
      });
    }
  }

  /**
   * Gets user data from the specified path
   * @param path Path to get the data from (supports nested paths like "test/data/marco")
   * @returns Promise that resolves with the data
   */
  async getUserData(path: string): Promise<any> {
    if (stryMutAct_9fa48("1782")) {
      {}
    } else {
      stryCov_9fa48("1782");
      return new Promise((resolve, reject) => {
        if (stryMutAct_9fa48("1783")) {
          {}
        } else {
          stryCov_9fa48("1783");
          // Validazione del path
          if (stryMutAct_9fa48("1786") ? !path && typeof path !== "string" : stryMutAct_9fa48("1785") ? false : stryMutAct_9fa48("1784") ? true : (stryCov_9fa48("1784", "1785", "1786"), (stryMutAct_9fa48("1787") ? path : (stryCov_9fa48("1787"), !path)) || (stryMutAct_9fa48("1789") ? typeof path === "string" : stryMutAct_9fa48("1788") ? false : (stryCov_9fa48("1788", "1789"), typeof path !== (stryMutAct_9fa48("1790") ? "" : (stryCov_9fa48("1790"), "string")))))) {
            if (stryMutAct_9fa48("1791")) {
              {}
            } else {
              stryCov_9fa48("1791");
              const error = stryMutAct_9fa48("1792") ? "" : (stryCov_9fa48("1792"), "Path must be a non-empty string");
              this.emitDataEvent(stryMutAct_9fa48("1793") ? "" : (stryCov_9fa48("1793"), "gun:get"), stryMutAct_9fa48("1794") ? `` : (stryCov_9fa48("1794"), `user/${path}`), null, stryMutAct_9fa48("1795") ? true : (stryCov_9fa48("1795"), false), error);
              reject(new Error(error));
              return;
            }
          }
          const user = this.gun.user();
          if (stryMutAct_9fa48("1798") ? false : stryMutAct_9fa48("1797") ? true : stryMutAct_9fa48("1796") ? user.is : (stryCov_9fa48("1796", "1797", "1798"), !user.is)) {
            if (stryMutAct_9fa48("1799")) {
              {}
            } else {
              stryCov_9fa48("1799");
              const error = stryMutAct_9fa48("1800") ? "" : (stryCov_9fa48("1800"), "User not authenticated");
              this.emitDataEvent(stryMutAct_9fa48("1801") ? "" : (stryCov_9fa48("1801"), "gun:get"), stryMutAct_9fa48("1802") ? `` : (stryCov_9fa48("1802"), `user/${path}`), null, stryMutAct_9fa48("1803") ? true : (stryCov_9fa48("1803"), false), error);
              reject(new Error(error));
              return;
            }
          }

          // Timeout per evitare attese infinite
          const timeout = setTimeout(() => {
            if (stryMutAct_9fa48("1804")) {
              {}
            } else {
              stryCov_9fa48("1804");
              const error = stryMutAct_9fa48("1805") ? "" : (stryCov_9fa48("1805"), "Operation timeout");
              this.emitDataEvent(stryMutAct_9fa48("1806") ? "" : (stryCov_9fa48("1806"), "gun:get"), stryMutAct_9fa48("1807") ? `` : (stryCov_9fa48("1807"), `user/${path}`), null, stryMutAct_9fa48("1808") ? true : (stryCov_9fa48("1808"), false), error);
              reject(new Error(error));
            }
          }, CONFIG.TIMEOUTS.USER_DATA_OPERATION); // 10 secondi di timeout

          try {
            if (stryMutAct_9fa48("1809")) {
              {}
            } else {
              stryCov_9fa48("1809");
              this.navigateToPath(user, path).once((data: any) => {
                if (stryMutAct_9fa48("1810")) {
                  {}
                } else {
                  stryCov_9fa48("1810");
                  clearTimeout(timeout);

                  // Gestisci i riferimenti GunDB
                  if (stryMutAct_9fa48("1813") ? data && typeof data === "object" || data["#"] : stryMutAct_9fa48("1812") ? false : stryMutAct_9fa48("1811") ? true : (stryCov_9fa48("1811", "1812", "1813"), (stryMutAct_9fa48("1815") ? data || typeof data === "object" : stryMutAct_9fa48("1814") ? true : (stryCov_9fa48("1814", "1815"), data && (stryMutAct_9fa48("1817") ? typeof data !== "object" : stryMutAct_9fa48("1816") ? true : (stryCov_9fa48("1816", "1817"), typeof data === (stryMutAct_9fa48("1818") ? "" : (stryCov_9fa48("1818"), "object")))))) && data[stryMutAct_9fa48("1819") ? "" : (stryCov_9fa48("1819"), "#")])) {
                    if (stryMutAct_9fa48("1820")) {
                      {}
                    } else {
                      stryCov_9fa48("1820");
                      // È un riferimento GunDB, carica i dati effettivi
                      const referencePath = data[stryMutAct_9fa48("1821") ? "" : (stryCov_9fa48("1821"), "#")];
                      this.navigateToPath(this.gun, referencePath).once((actualData: any) => {
                        if (stryMutAct_9fa48("1822")) {
                          {}
                        } else {
                          stryCov_9fa48("1822");
                          this.emitDataEvent(stryMutAct_9fa48("1823") ? "" : (stryCov_9fa48("1823"), "gun:get"), stryMutAct_9fa48("1824") ? `` : (stryCov_9fa48("1824"), `user/${path}`), actualData, stryMutAct_9fa48("1825") ? false : (stryCov_9fa48("1825"), true));
                          resolve(actualData);
                        }
                      });
                    }
                  } else {
                    if (stryMutAct_9fa48("1826")) {
                      {}
                    } else {
                      stryCov_9fa48("1826");
                      // Dati diretti, restituisci così come sono
                      this.emitDataEvent(stryMutAct_9fa48("1827") ? "" : (stryCov_9fa48("1827"), "gun:get"), stryMutAct_9fa48("1828") ? `` : (stryCov_9fa48("1828"), `user/${path}`), data, stryMutAct_9fa48("1829") ? false : (stryCov_9fa48("1829"), true));
                      resolve(data);
                    }
                  }
                }
              });
            }
          } catch (error) {
            if (stryMutAct_9fa48("1830")) {
              {}
            } else {
              stryCov_9fa48("1830");
              clearTimeout(timeout);
              const errorMsg = error instanceof Error ? error.message : stryMutAct_9fa48("1831") ? "" : (stryCov_9fa48("1831"), "Unknown error");
              this.emitDataEvent(stryMutAct_9fa48("1832") ? "" : (stryCov_9fa48("1832"), "gun:get"), stryMutAct_9fa48("1833") ? `` : (stryCov_9fa48("1833"), `user/${path}`), null, stryMutAct_9fa48("1834") ? true : (stryCov_9fa48("1834"), false), errorMsg);
              reject(error);
            }
          }
        }
      });
    }
  }

  /**
   * Derive cryptographic keys from password and optional extras
   * Supports multiple key derivation algorithms: P-256, secp256k1 (Bitcoin), secp256k1 (Ethereum)
   * @param password - Password or seed for key derivation
   * @param extra - Additional entropy (string or array of strings)
   * @param options - Derivation options to specify which key types to generate
   * @returns Promise resolving to derived keys object
   */
  async derive(password: string | number, extra?: string | string[], options?: DeriveOptions): Promise<{
    p256?: {
      pub: string;
      priv: string;
      epub: string;
      epriv: string;
    };
    secp256k1Bitcoin?: {
      pub: string;
      priv: string;
      address: string;
    };
    secp256k1Ethereum?: {
      pub: string;
      priv: string;
      address: string;
    };
  }> {
    if (stryMutAct_9fa48("1835")) {
      {}
    } else {
      stryCov_9fa48("1835");
      try {
        if (stryMutAct_9fa48("1836")) {
          {}
        } else {
          stryCov_9fa48("1836");
          // Deriving cryptographic keys with options

          // Call the derive function with the provided parameters
          const derivedKeys = await derive(password, extra, options);

          // Map the returned keys to the expected format
          const result: {
            p256?: {
              pub: string;
              priv: string;
              epub: string;
              epriv: string;
            };
            secp256k1Bitcoin?: {
              pub: string;
              priv: string;
              address: string;
            };
            secp256k1Ethereum?: {
              pub: string;
              priv: string;
              address: string;
            };
          } = {};

          // Map P-256 keys (already in correct format)
          if (stryMutAct_9fa48("1839") ? derivedKeys.pub && derivedKeys.priv && derivedKeys.epub || derivedKeys.epriv : stryMutAct_9fa48("1838") ? false : stryMutAct_9fa48("1837") ? true : (stryCov_9fa48("1837", "1838", "1839"), (stryMutAct_9fa48("1841") ? derivedKeys.pub && derivedKeys.priv || derivedKeys.epub : stryMutAct_9fa48("1840") ? true : (stryCov_9fa48("1840", "1841"), (stryMutAct_9fa48("1843") ? derivedKeys.pub || derivedKeys.priv : stryMutAct_9fa48("1842") ? true : (stryCov_9fa48("1842", "1843"), derivedKeys.pub && derivedKeys.priv)) && derivedKeys.epub)) && derivedKeys.epriv)) {
            if (stryMutAct_9fa48("1844")) {
              {}
            } else {
              stryCov_9fa48("1844");
              result.p256 = stryMutAct_9fa48("1845") ? {} : (stryCov_9fa48("1845"), {
                pub: derivedKeys.pub,
                priv: derivedKeys.priv,
                epub: derivedKeys.epub,
                epriv: derivedKeys.epriv
              });
            }
          }

          // Map Bitcoin keys (privateKey -> priv, publicKey -> pub)
          if (stryMutAct_9fa48("1847") ? false : stryMutAct_9fa48("1846") ? true : (stryCov_9fa48("1846", "1847"), derivedKeys.secp256k1Bitcoin)) {
            if (stryMutAct_9fa48("1848")) {
              {}
            } else {
              stryCov_9fa48("1848");
              result.secp256k1Bitcoin = stryMutAct_9fa48("1849") ? {} : (stryCov_9fa48("1849"), {
                pub: derivedKeys.secp256k1Bitcoin.publicKey,
                priv: derivedKeys.secp256k1Bitcoin.privateKey,
                address: derivedKeys.secp256k1Bitcoin.address
              });
            }
          }

          // Map Ethereum keys (privateKey -> priv, publicKey -> pub)
          if (stryMutAct_9fa48("1851") ? false : stryMutAct_9fa48("1850") ? true : (stryCov_9fa48("1850", "1851"), derivedKeys.secp256k1Ethereum)) {
            if (stryMutAct_9fa48("1852")) {
              {}
            } else {
              stryCov_9fa48("1852");
              result.secp256k1Ethereum = stryMutAct_9fa48("1853") ? {} : (stryCov_9fa48("1853"), {
                pub: derivedKeys.secp256k1Ethereum.publicKey,
                priv: derivedKeys.secp256k1Ethereum.privateKey,
                address: derivedKeys.secp256k1Ethereum.address
              });
            }
          }

          // Key derivation completed successfully
          return result;
        }
      } catch (error) {
        if (stryMutAct_9fa48("1854")) {
          {}
        } else {
          stryCov_9fa48("1854");
          console.error(stryMutAct_9fa48("1855") ? "" : (stryCov_9fa48("1855"), "Error during key derivation:"), error);

          // Use centralized error handler
          ErrorHandler.handle(ErrorType.ENCRYPTION, stryMutAct_9fa48("1856") ? "" : (stryCov_9fa48("1856"), "KEY_DERIVATION_FAILED"), error instanceof Error ? error.message : stryMutAct_9fa48("1857") ? "" : (stryCov_9fa48("1857"), "Failed to derive cryptographic keys"), error);
          throw error;
        }
      }
    }
  }

  /**
   * Derive P-256 keys (default Gun.SEA behavior)
   * @param password - Password for key derivation
   * @param extra - Additional entropy
   * @returns Promise resolving to P-256 keys
   */
  async deriveP256(password: string | number, extra?: string | string[]): Promise<{
    pub: string;
    priv: string;
    epub: string;
    epriv: string;
  }> {
    if (stryMutAct_9fa48("1858")) {
      {}
    } else {
      stryCov_9fa48("1858");
      const result = await this.derive(password, extra, stryMutAct_9fa48("1859") ? {} : (stryCov_9fa48("1859"), {
        includeP256: stryMutAct_9fa48("1860") ? false : (stryCov_9fa48("1860"), true)
      }));
      return result.p256!;
    }
  }

  /**
   * Derive Bitcoin secp256k1 keys with P2PKH address
   * @param password - Password for key derivation
   * @param extra - Additional entropy
   * @returns Promise resolving to Bitcoin keys and address
   */
  async deriveBitcoin(password: string | number, extra?: string | string[]): Promise<{
    pub: string;
    priv: string;
    address: string;
  }> {
    if (stryMutAct_9fa48("1861")) {
      {}
    } else {
      stryCov_9fa48("1861");
      const result = await this.derive(password, extra, stryMutAct_9fa48("1862") ? {} : (stryCov_9fa48("1862"), {
        includeSecp256k1Bitcoin: stryMutAct_9fa48("1863") ? false : (stryCov_9fa48("1863"), true)
      }));
      return result.secp256k1Bitcoin!;
    }
  }

  /**
   * Derive Ethereum secp256k1 keys with Keccak256 address
   * @param password - Password for key derivation
   * @param extra - Additional entropy
   * @returns Promise resolving to Ethereum keys and address
   */
  async deriveEthereum(password: string | number, extra?: string | string[]): Promise<{
    pub: string;
    priv: string;
    address: string;
  }> {
    if (stryMutAct_9fa48("1864")) {
      {}
    } else {
      stryCov_9fa48("1864");
      const result = await this.derive(password, extra, stryMutAct_9fa48("1865") ? {} : (stryCov_9fa48("1865"), {
        includeSecp256k1Ethereum: stryMutAct_9fa48("1866") ? false : (stryCov_9fa48("1866"), true)
      }));
      return result.secp256k1Ethereum!;
    }
  }

  /**
   * Derive all supported key types
   * @param password - Password for key derivation
   * @param extra - Additional entropy
   * @returns Promise resolving to all key types
   */
  async deriveAll(password: string | number, extra?: string | string[]): Promise<{
    p256: {
      pub: string;
      priv: string;
      epub: string;
      epriv: string;
    };
    secp256k1Bitcoin: {
      pub: string;
      priv: string;
      address: string;
    };
    secp256k1Ethereum: {
      pub: string;
      priv: string;
      address: string;
    };
  }> {
    if (stryMutAct_9fa48("1867")) {
      {}
    } else {
      stryCov_9fa48("1867");
      const result = await this.derive(password, extra, stryMutAct_9fa48("1868") ? {} : (stryCov_9fa48("1868"), {
        includeP256: stryMutAct_9fa48("1869") ? false : (stryCov_9fa48("1869"), true),
        includeSecp256k1Bitcoin: stryMutAct_9fa48("1870") ? false : (stryCov_9fa48("1870"), true),
        includeSecp256k1Ethereum: stryMutAct_9fa48("1871") ? false : (stryCov_9fa48("1871"), true)
      }));
      return stryMutAct_9fa48("1872") ? {} : (stryCov_9fa48("1872"), {
        p256: result.p256!,
        secp256k1Bitcoin: result.secp256k1Bitcoin!,
        secp256k1Ethereum: result.secp256k1Ethereum!
      });
    }
  }

  /**
   * Prepares data for freezing with metadata
   */
  private prepareFrozenData(data: any, options?: {
    description?: string;
    metadata?: Record<string, any>;
  }): any {
    if (stryMutAct_9fa48("1873")) {
      {}
    } else {
      stryCov_9fa48("1873");
      return stryMutAct_9fa48("1874") ? {} : (stryCov_9fa48("1874"), {
        data: data,
        timestamp: Date.now(),
        description: stryMutAct_9fa48("1877") ? options?.description && "" : stryMutAct_9fa48("1876") ? false : stryMutAct_9fa48("1875") ? true : (stryCov_9fa48("1875", "1876", "1877"), (stryMutAct_9fa48("1878") ? options.description : (stryCov_9fa48("1878"), options?.description)) || (stryMutAct_9fa48("1879") ? "Stryker was here!" : (stryCov_9fa48("1879"), ""))),
        metadata: stryMutAct_9fa48("1882") ? options?.metadata && {} : stryMutAct_9fa48("1881") ? false : stryMutAct_9fa48("1880") ? true : (stryCov_9fa48("1880", "1881", "1882"), (stryMutAct_9fa48("1883") ? options.metadata : (stryCov_9fa48("1883"), options?.metadata)) || {})
      });
    }
  }

  /**
   * Generates hash for frozen data
   */
  private async generateFrozenDataHash(frozenData: any): Promise<string | null> {
    if (stryMutAct_9fa48("1884")) {
      {}
    } else {
      stryCov_9fa48("1884");
      const dataString = JSON.stringify(frozenData);
      const hash = await SEA.work(dataString, null, null, stryMutAct_9fa48("1885") ? {} : (stryCov_9fa48("1885"), {
        name: stryMutAct_9fa48("1886") ? "" : (stryCov_9fa48("1886"), "SHA-256")
      }));
      return hash ? hash as string : null;
    }
  }

  /**
   * Builds the full path for frozen data
   */
  private buildFrozenPath(hash: string, options?: {
    namespace?: string;
    path?: string;
  }): string {
    if (stryMutAct_9fa48("1887")) {
      {}
    } else {
      stryCov_9fa48("1887");
      const namespace = stryMutAct_9fa48("1890") ? options?.namespace && "default" : stryMutAct_9fa48("1889") ? false : stryMutAct_9fa48("1888") ? true : (stryCov_9fa48("1888", "1889", "1890"), (stryMutAct_9fa48("1891") ? options.namespace : (stryCov_9fa48("1891"), options?.namespace)) || (stryMutAct_9fa48("1892") ? "" : (stryCov_9fa48("1892"), "default")));
      const customPath = stryMutAct_9fa48("1895") ? options?.path && "" : stryMutAct_9fa48("1894") ? false : stryMutAct_9fa48("1893") ? true : (stryCov_9fa48("1893", "1894", "1895"), (stryMutAct_9fa48("1896") ? options.path : (stryCov_9fa48("1896"), options?.path)) || (stryMutAct_9fa48("1897") ? "Stryker was here!" : (stryCov_9fa48("1897"), "")));
      return customPath ? stryMutAct_9fa48("1898") ? `` : (stryCov_9fa48("1898"), `${namespace}/${customPath}/${hash}`) : stryMutAct_9fa48("1899") ? `` : (stryCov_9fa48("1899"), `${namespace}/${hash}`);
    }
  }

  /**
   * Stores frozen data in Gun
   */
  private async storeFrozenData(frozenData: any, fullPath: string, hash: string): Promise<{
    hash: string;
    fullPath: string;
    data: any;
  }> {
    if (stryMutAct_9fa48("1900")) {
      {}
    } else {
      stryCov_9fa48("1900");
      return new Promise((resolve, reject) => {
        if (stryMutAct_9fa48("1901")) {
          {}
        } else {
          stryCov_9fa48("1901");
          const targetNode = this.navigateToPath(this.gun, fullPath);
          targetNode.put(frozenData, (ack: any) => {
            if (stryMutAct_9fa48("1902")) {
              {}
            } else {
              stryCov_9fa48("1902");
              if (stryMutAct_9fa48("1904") ? false : stryMutAct_9fa48("1903") ? true : (stryCov_9fa48("1903", "1904"), ack.err)) {
                if (stryMutAct_9fa48("1905")) {
                  {}
                } else {
                  stryCov_9fa48("1905");
                  reject(new Error(stryMutAct_9fa48("1906") ? `` : (stryCov_9fa48("1906"), `Failed to create frozen space: ${ack.err}`)));
                }
              } else {
                if (stryMutAct_9fa48("1907")) {
                  {}
                } else {
                  stryCov_9fa48("1907");
                  resolve(stryMutAct_9fa48("1908") ? {} : (stryCov_9fa48("1908"), {
                    hash: hash,
                    fullPath: fullPath,
                    data: frozenData
                  }));
                }
              }
            }
          });
        }
      });
    }
  }

  /**
   * Creates a frozen space entry for immutable data
   * @param data Data to freeze
   * @param options Optional configuration
   * @returns Promise resolving to the frozen data hash
   */
  async createFrozenSpace(data: any, options?: {
    namespace?: string;
    path?: string;
    description?: string;
    metadata?: Record<string, any>;
  }): Promise<{
    hash: string;
    fullPath: string;
    data: any;
  }> {
    if (stryMutAct_9fa48("1909")) {
      {}
    } else {
      stryCov_9fa48("1909");
      return new Promise(async (resolve, reject) => {
        if (stryMutAct_9fa48("1910")) {
          {}
        } else {
          stryCov_9fa48("1910");
          try {
            if (stryMutAct_9fa48("1911")) {
              {}
            } else {
              stryCov_9fa48("1911");
              // Prepare the data to freeze
              const frozenData = this.prepareFrozenData(data, options);

              // Generate hash for the data
              const hash = await this.generateFrozenDataHash(frozenData);
              if (stryMutAct_9fa48("1914") ? false : stryMutAct_9fa48("1913") ? true : stryMutAct_9fa48("1912") ? hash : (stryCov_9fa48("1912", "1913", "1914"), !hash)) {
                if (stryMutAct_9fa48("1915")) {
                  {}
                } else {
                  stryCov_9fa48("1915");
                  reject(new Error(stryMutAct_9fa48("1916") ? "" : (stryCov_9fa48("1916"), "Failed to generate hash for frozen data")));
                  return;
                }
              }

              // Build the full path
              const fullPath = this.buildFrozenPath(hash, options);

              // Store the frozen data
              const result = await this.storeFrozenData(frozenData, fullPath, hash);
              resolve(result);
            }
          } catch (error) {
            if (stryMutAct_9fa48("1917")) {
              {}
            } else {
              stryCov_9fa48("1917");
              reject(new Error(stryMutAct_9fa48("1918") ? `` : (stryCov_9fa48("1918"), `Error creating frozen space: ${error}`)));
            }
          }
        }
      });
    }
  }

  /**
   * Retrieves data from frozen space
   * @param hash Hash of the frozen data
   * @param namespace Optional namespace
   * @param path Optional custom path
   * @returns Promise resolving to the frozen data
   */
  async getFrozenSpace(hash: string, namespace: string = stryMutAct_9fa48("1919") ? "" : (stryCov_9fa48("1919"), "default"), path?: string): Promise<any> {
    if (stryMutAct_9fa48("1920")) {
      {}
    } else {
      stryCov_9fa48("1920");
      return new Promise((resolve, reject) => {
        if (stryMutAct_9fa48("1921")) {
          {}
        } else {
          stryCov_9fa48("1921");
          // Costruisci il percorso completo
          const fullPath = path ? stryMutAct_9fa48("1922") ? `` : (stryCov_9fa48("1922"), `${namespace}/${path}/${hash}`) : stryMutAct_9fa48("1923") ? `` : (stryCov_9fa48("1923"), `${namespace}/${hash}`);

          // Usa navigateToPath per gestire correttamente i percorsi con /
          const targetNode = this.navigateToPath(this.gun, fullPath);
          targetNode.once((data: any) => {
            if (stryMutAct_9fa48("1924")) {
              {}
            } else {
              stryCov_9fa48("1924");
              if (stryMutAct_9fa48("1927") ? false : stryMutAct_9fa48("1926") ? true : stryMutAct_9fa48("1925") ? data : (stryCov_9fa48("1925", "1926", "1927"), !data)) {
                if (stryMutAct_9fa48("1928")) {
                  {}
                } else {
                  stryCov_9fa48("1928");
                  reject(new Error(stryMutAct_9fa48("1929") ? `` : (stryCov_9fa48("1929"), `Frozen data not found: ${fullPath}`)));
                }
              } else {
                if (stryMutAct_9fa48("1930")) {
                  {}
                } else {
                  stryCov_9fa48("1930");
                  resolve(data);
                }
              }
            }
          });
        }
      });
    }
  }

  /**
   * Verifies if data matches a frozen space entry
   * @param data Data to verify
   * @param hash Expected hash
   * @param namespace Optional namespace
   * @param path Optional custom path
   * @returns Promise resolving to verification result
   */
  async verifyFrozenSpace(data: any, hash: string, namespace: string = stryMutAct_9fa48("1931") ? "" : (stryCov_9fa48("1931"), "default"), path?: string): Promise<{
    verified: boolean;
    frozenData?: any;
    error?: string;
  }> {
    if (stryMutAct_9fa48("1932")) {
      {}
    } else {
      stryCov_9fa48("1932");
      try {
        if (stryMutAct_9fa48("1933")) {
          {}
        } else {
          stryCov_9fa48("1933");
          // Genera hash dei dati forniti
          const dataString = JSON.stringify(data);
          const generatedHash = await SEA.work(dataString, null, null, stryMutAct_9fa48("1934") ? {} : (stryCov_9fa48("1934"), {
            name: stryMutAct_9fa48("1935") ? "" : (stryCov_9fa48("1935"), "SHA-256")
          }));
          if (stryMutAct_9fa48("1938") ? false : stryMutAct_9fa48("1937") ? true : stryMutAct_9fa48("1936") ? generatedHash : (stryCov_9fa48("1936", "1937", "1938"), !generatedHash)) {
            if (stryMutAct_9fa48("1939")) {
              {}
            } else {
              stryCov_9fa48("1939");
              return stryMutAct_9fa48("1940") ? {} : (stryCov_9fa48("1940"), {
                verified: stryMutAct_9fa48("1941") ? true : (stryCov_9fa48("1941"), false),
                error: stryMutAct_9fa48("1942") ? "" : (stryCov_9fa48("1942"), "Failed to generate hash")
              });
            }
          }

          // Confronta gli hash
          if (stryMutAct_9fa48("1945") ? generatedHash === hash : stryMutAct_9fa48("1944") ? false : stryMutAct_9fa48("1943") ? true : (stryCov_9fa48("1943", "1944", "1945"), generatedHash !== hash)) {
            if (stryMutAct_9fa48("1946")) {
              {}
            } else {
              stryCov_9fa48("1946");
              return stryMutAct_9fa48("1947") ? {} : (stryCov_9fa48("1947"), {
                verified: stryMutAct_9fa48("1948") ? true : (stryCov_9fa48("1948"), false),
                error: stryMutAct_9fa48("1949") ? "" : (stryCov_9fa48("1949"), "Hash mismatch")
              });
            }
          }

          // Verifica che esista nel frozen space
          const frozenData = await this.getFrozenSpace(hash, namespace, path);
          return stryMutAct_9fa48("1950") ? {} : (stryCov_9fa48("1950"), {
            verified: stryMutAct_9fa48("1951") ? false : (stryCov_9fa48("1951"), true),
            frozenData: frozenData
          });
        }
      } catch (error) {
        if (stryMutAct_9fa48("1952")) {
          {}
        } else {
          stryCov_9fa48("1952");
          return stryMutAct_9fa48("1953") ? {} : (stryCov_9fa48("1953"), {
            verified: stryMutAct_9fa48("1954") ? true : (stryCov_9fa48("1954"), false),
            error: stryMutAct_9fa48("1955") ? `` : (stryCov_9fa48("1955"), `Verification failed: ${error}`)
          });
        }
      }
    }
  }

  // Errors
  static Errors = GunErrors;

  /**
   * Sanitizes username to prevent path construction issues
   * @param username Raw username
   * @returns Sanitized username
   */
  private sanitizeUsername(username: string): string {
    if (stryMutAct_9fa48("1956")) {
      {}
    } else {
      stryCov_9fa48("1956");
      if (stryMutAct_9fa48("1959") ? !username && typeof username !== "string" : stryMutAct_9fa48("1958") ? false : stryMutAct_9fa48("1957") ? true : (stryCov_9fa48("1957", "1958", "1959"), (stryMutAct_9fa48("1960") ? username : (stryCov_9fa48("1960"), !username)) || (stryMutAct_9fa48("1962") ? typeof username === "string" : stryMutAct_9fa48("1961") ? false : (stryCov_9fa48("1961", "1962"), typeof username !== (stryMutAct_9fa48("1963") ? "" : (stryCov_9fa48("1963"), "string")))))) {
        if (stryMutAct_9fa48("1964")) {
          {}
        } else {
          stryCov_9fa48("1964");
          return stryMutAct_9fa48("1965") ? "Stryker was here!" : (stryCov_9fa48("1965"), "");
        }
      }
      return stryMutAct_9fa48("1968") ? username.toLowerCase().replace(/[\x00-\x1F\x7F]/g, "") // Remove control characters
      .replace(/[^a-zA-Z0-9._-]/g, "") // Only allow alphanumeric, dots, underscores, and hyphens
      .replace(/^[^a-zA-Z]/, "") // Must start with a letter
      .substring(0, 50) : stryMutAct_9fa48("1967") ? username.trim().toUpperCase().replace(/[\x00-\x1F\x7F]/g, "") // Remove control characters
      .replace(/[^a-zA-Z0-9._-]/g, "") // Only allow alphanumeric, dots, underscores, and hyphens
      .replace(/^[^a-zA-Z]/, "") // Must start with a letter
      .substring(0, 50) : stryMutAct_9fa48("1966") ? username.trim().toLowerCase().replace(/[\x00-\x1F\x7F]/g, "") // Remove control characters
      .replace(/[^a-zA-Z0-9._-]/g, "") // Only allow alphanumeric, dots, underscores, and hyphens
      .replace(/^[^a-zA-Z]/, "") // Must start with a letter
      : (stryCov_9fa48("1966", "1967", "1968"), username.trim().toLowerCase().replace(stryMutAct_9fa48("1969") ? /[^\x00-\x1F\x7F]/g : (stryCov_9fa48("1969"), /[\x00-\x1F\x7F]/g), stryMutAct_9fa48("1970") ? "Stryker was here!" : (stryCov_9fa48("1970"), "")) // Remove control characters
      .replace(stryMutAct_9fa48("1971") ? /[a-zA-Z0-9._-]/g : (stryCov_9fa48("1971"), /[^a-zA-Z0-9._-]/g), stryMutAct_9fa48("1972") ? "Stryker was here!" : (stryCov_9fa48("1972"), "")) // Only allow alphanumeric, dots, underscores, and hyphens
      .replace(stryMutAct_9fa48("1974") ? /^[a-zA-Z]/ : stryMutAct_9fa48("1973") ? /[^a-zA-Z]/ : (stryCov_9fa48("1973", "1974"), /^[^a-zA-Z]/), stryMutAct_9fa48("1975") ? "Stryker was here!" : (stryCov_9fa48("1975"), "")) // Must start with a letter
      .substring(0, 50)); // Limit length
    }
  }

  /**
   * Changes the username for the currently authenticated user
   * @param newUsername New username to set
   * @returns Promise resolving to the operation result
   */
  async changeUsername(newUsername: string): Promise<{
    success: boolean;
    error?: string;
    oldUsername?: string;
    newUsername?: string;
  }> {
    if (stryMutAct_9fa48("1976")) {
      {}
    } else {
      stryCov_9fa48("1976");
      try {
        if (stryMutAct_9fa48("1977")) {
          {}
        } else {
          stryCov_9fa48("1977");
          // Check if user is authenticated
          if (stryMutAct_9fa48("1980") ? false : stryMutAct_9fa48("1979") ? true : stryMutAct_9fa48("1978") ? this.isLoggedIn() : (stryCov_9fa48("1978", "1979", "1980"), !this.isLoggedIn())) {
            if (stryMutAct_9fa48("1981")) {
              {}
            } else {
              stryCov_9fa48("1981");
              return stryMutAct_9fa48("1982") ? {} : (stryCov_9fa48("1982"), {
                success: stryMutAct_9fa48("1983") ? true : (stryCov_9fa48("1983"), false),
                error: stryMutAct_9fa48("1984") ? "" : (stryCov_9fa48("1984"), "User not authenticated")
              });
            }
          }
          const currentUser = this.getCurrentUser();
          if (stryMutAct_9fa48("1987") ? !currentUser && !currentUser.pub : stryMutAct_9fa48("1986") ? false : stryMutAct_9fa48("1985") ? true : (stryCov_9fa48("1985", "1986", "1987"), (stryMutAct_9fa48("1988") ? currentUser : (stryCov_9fa48("1988"), !currentUser)) || (stryMutAct_9fa48("1989") ? currentUser.pub : (stryCov_9fa48("1989"), !currentUser.pub)))) {
            if (stryMutAct_9fa48("1990")) {
              {}
            } else {
              stryCov_9fa48("1990");
              return stryMutAct_9fa48("1991") ? {} : (stryCov_9fa48("1991"), {
                success: stryMutAct_9fa48("1992") ? true : (stryCov_9fa48("1992"), false),
                error: stryMutAct_9fa48("1993") ? "" : (stryCov_9fa48("1993"), "No authenticated user found")
              });
            }
          }
          const userPub = currentUser.pub;

          // Validate new username
          if (stryMutAct_9fa48("1996") ? (!newUsername || typeof newUsername !== "string") && newUsername.trim().length === 0 : stryMutAct_9fa48("1995") ? false : stryMutAct_9fa48("1994") ? true : (stryCov_9fa48("1994", "1995", "1996"), (stryMutAct_9fa48("1998") ? !newUsername && typeof newUsername !== "string" : stryMutAct_9fa48("1997") ? false : (stryCov_9fa48("1997", "1998"), (stryMutAct_9fa48("1999") ? newUsername : (stryCov_9fa48("1999"), !newUsername)) || (stryMutAct_9fa48("2001") ? typeof newUsername === "string" : stryMutAct_9fa48("2000") ? false : (stryCov_9fa48("2000", "2001"), typeof newUsername !== (stryMutAct_9fa48("2002") ? "" : (stryCov_9fa48("2002"), "string")))))) || (stryMutAct_9fa48("2004") ? newUsername.trim().length !== 0 : stryMutAct_9fa48("2003") ? false : (stryCov_9fa48("2003", "2004"), (stryMutAct_9fa48("2005") ? newUsername.length : (stryCov_9fa48("2005"), newUsername.trim().length)) === 0)))) {
            if (stryMutAct_9fa48("2006")) {
              {}
            } else {
              stryCov_9fa48("2006");
              return stryMutAct_9fa48("2007") ? {} : (stryCov_9fa48("2007"), {
                success: stryMutAct_9fa48("2008") ? true : (stryCov_9fa48("2008"), false),
                error: stryMutAct_9fa48("2009") ? "" : (stryCov_9fa48("2009"), "New username cannot be empty")
              });
            }
          }

          // Sanitize new username
          const sanitizedNewUsername = this.sanitizeUsername(newUsername);
          if (stryMutAct_9fa48("2012") ? sanitizedNewUsername.length !== 0 : stryMutAct_9fa48("2011") ? false : stryMutAct_9fa48("2010") ? true : (stryCov_9fa48("2010", "2011", "2012"), sanitizedNewUsername.length === 0)) {
            if (stryMutAct_9fa48("2013")) {
              {}
            } else {
              stryCov_9fa48("2013");
              return stryMutAct_9fa48("2014") ? {} : (stryCov_9fa48("2014"), {
                success: stryMutAct_9fa48("2015") ? true : (stryCov_9fa48("2015"), false),
                error: stryMutAct_9fa48("2016") ? "" : (stryCov_9fa48("2016"), "New username contains only invalid characters")
              });
            }
          }

          // Validate username format (alphanumeric and some special chars only)
          if (stryMutAct_9fa48("2019") ? false : stryMutAct_9fa48("2018") ? true : stryMutAct_9fa48("2017") ? /^[a-zA-Z0-9._-]+$/.test(sanitizedNewUsername) : (stryCov_9fa48("2017", "2018", "2019"), !(stryMutAct_9fa48("2023") ? /^[^a-zA-Z0-9._-]+$/ : stryMutAct_9fa48("2022") ? /^[a-zA-Z0-9._-]$/ : stryMutAct_9fa48("2021") ? /^[a-zA-Z0-9._-]+/ : stryMutAct_9fa48("2020") ? /[a-zA-Z0-9._-]+$/ : (stryCov_9fa48("2020", "2021", "2022", "2023"), /^[a-zA-Z0-9._-]+$/)).test(sanitizedNewUsername))) {
            if (stryMutAct_9fa48("2024")) {
              {}
            } else {
              stryCov_9fa48("2024");
              return stryMutAct_9fa48("2025") ? {} : (stryCov_9fa48("2025"), {
                success: stryMutAct_9fa48("2026") ? true : (stryCov_9fa48("2026"), false),
                error: stryMutAct_9fa48("2027") ? "" : (stryCov_9fa48("2027"), "Username can only contain letters, numbers, dots, underscores, and hyphens")
              });
            }
          }

          // Check if new username is already in use by another user
          const existingUserCheck = await this.checkUsernameExists(sanitizedNewUsername);
          if (stryMutAct_9fa48("2030") ? existingUserCheck || existingUserCheck.pub !== userPub : stryMutAct_9fa48("2029") ? false : stryMutAct_9fa48("2028") ? true : (stryCov_9fa48("2028", "2029", "2030"), existingUserCheck && (stryMutAct_9fa48("2032") ? existingUserCheck.pub === userPub : stryMutAct_9fa48("2031") ? true : (stryCov_9fa48("2031", "2032"), existingUserCheck.pub !== userPub)))) {
            if (stryMutAct_9fa48("2033")) {
              {}
            } else {
              stryCov_9fa48("2033");
              return stryMutAct_9fa48("2034") ? {} : (stryCov_9fa48("2034"), {
                success: stryMutAct_9fa48("2035") ? true : (stryCov_9fa48("2035"), false),
                error: stryMutAct_9fa48("2036") ? `` : (stryCov_9fa48("2036"), `Username '${sanitizedNewUsername}' is already in use by another user`)
              });
            }
          }

          // Get current user data to find old username
          const currentUserData = await new Promise<any>(resolve => {
            if (stryMutAct_9fa48("2037")) {
              {}
            } else {
              stryCov_9fa48("2037");
              this.gun.get(userPub).once((data: any) => {
                if (stryMutAct_9fa48("2038")) {
                  {}
                } else {
                  stryCov_9fa48("2038");
                  resolve(data);
                }
              });
            }
          });
          const oldUsername = stryMutAct_9fa48("2041") ? currentUserData?.username && "unknown" : stryMutAct_9fa48("2040") ? false : stryMutAct_9fa48("2039") ? true : (stryCov_9fa48("2039", "2040", "2041"), (stryMutAct_9fa48("2042") ? currentUserData.username : (stryCov_9fa48("2042"), currentUserData?.username)) || (stryMutAct_9fa48("2043") ? "" : (stryCov_9fa48("2043"), "unknown")));

          // If the new username is the same as the old one, no need to change
          if (stryMutAct_9fa48("2046") ? oldUsername !== sanitizedNewUsername : stryMutAct_9fa48("2045") ? false : stryMutAct_9fa48("2044") ? true : (stryCov_9fa48("2044", "2045", "2046"), oldUsername === sanitizedNewUsername)) {
            if (stryMutAct_9fa48("2047")) {
              {}
            } else {
              stryCov_9fa48("2047");
              return stryMutAct_9fa48("2048") ? {} : (stryCov_9fa48("2048"), {
                success: stryMutAct_9fa48("2049") ? false : (stryCov_9fa48("2049"), true),
                oldUsername,
                newUsername: sanitizedNewUsername
              });
            }
          }

          // Remove old username mapping if it exists
          if (stryMutAct_9fa48("2052") ? oldUsername || oldUsername !== "unknown" : stryMutAct_9fa48("2051") ? false : stryMutAct_9fa48("2050") ? true : (stryCov_9fa48("2050", "2051", "2052"), oldUsername && (stryMutAct_9fa48("2054") ? oldUsername === "unknown" : stryMutAct_9fa48("2053") ? true : (stryCov_9fa48("2053", "2054"), oldUsername !== (stryMutAct_9fa48("2055") ? "" : (stryCov_9fa48("2055"), "unknown")))))) {
            if (stryMutAct_9fa48("2056")) {
              {}
            } else {
              stryCov_9fa48("2056");
              try {
                if (stryMutAct_9fa48("2057")) {
                  {}
                } else {
                  stryCov_9fa48("2057");
                  await new Promise<void>((resolve, reject) => {
                    if (stryMutAct_9fa48("2058")) {
                      {}
                    } else {
                      stryCov_9fa48("2058");
                      this.node.get(stryMutAct_9fa48("2059") ? "" : (stryCov_9fa48("2059"), "usernames")).get(oldUsername).put(null, (ack: any) => {
                        if (stryMutAct_9fa48("2060")) {
                          {}
                        } else {
                          stryCov_9fa48("2060");
                          if (stryMutAct_9fa48("2062") ? false : stryMutAct_9fa48("2061") ? true : (stryCov_9fa48("2061", "2062"), ack.err)) {
                            if (stryMutAct_9fa48("2063")) {
                              {}
                            } else {
                              stryCov_9fa48("2063");
                              console.warn(stryMutAct_9fa48("2064") ? `` : (stryCov_9fa48("2064"), `Warning: Could not remove old username mapping: ${ack.err}`));
                            }
                          }
                          resolve();
                        }
                      });
                    }
                  });
                }
              } catch (error) {
                if (stryMutAct_9fa48("2065")) {
                  {}
                } else {
                  stryCov_9fa48("2065");
                  console.warn(stryMutAct_9fa48("2066") ? `` : (stryCov_9fa48("2066"), `Warning: Error removing old username mapping: ${error}`));
                  // Continue anyway, don't fail the operation
                }
              }
            }
          }

          // Create new username mapping
          try {
            if (stryMutAct_9fa48("2067")) {
              {}
            } else {
              stryCov_9fa48("2067");
              await new Promise<void>((resolve, reject) => {
                if (stryMutAct_9fa48("2068")) {
                  {}
                } else {
                  stryCov_9fa48("2068");
                  this.node.get(stryMutAct_9fa48("2069") ? "" : (stryCov_9fa48("2069"), "usernames")).get(sanitizedNewUsername).put(userPub, (ack: any) => {
                    if (stryMutAct_9fa48("2070")) {
                      {}
                    } else {
                      stryCov_9fa48("2070");
                      if (stryMutAct_9fa48("2072") ? false : stryMutAct_9fa48("2071") ? true : (stryCov_9fa48("2071", "2072"), ack.err)) {
                        if (stryMutAct_9fa48("2073")) {
                          {}
                        } else {
                          stryCov_9fa48("2073");
                          reject(new Error(stryMutAct_9fa48("2074") ? `` : (stryCov_9fa48("2074"), `Failed to create new username mapping: ${ack.err}`)));
                        }
                      } else {
                        if (stryMutAct_9fa48("2075")) {
                          {}
                        } else {
                          stryCov_9fa48("2075");
                          resolve();
                        }
                      }
                    }
                  });
                }
              });
            }
          } catch (error) {
            if (stryMutAct_9fa48("2076")) {
              {}
            } else {
              stryCov_9fa48("2076");
              return stryMutAct_9fa48("2077") ? {} : (stryCov_9fa48("2077"), {
                success: stryMutAct_9fa48("2078") ? true : (stryCov_9fa48("2078"), false),
                error: stryMutAct_9fa48("2079") ? `` : (stryCov_9fa48("2079"), `Failed to create new username mapping: ${error}`)
              });
            }
          }

          // Update user metadata with new username
          try {
            if (stryMutAct_9fa48("2080")) {
              {}
            } else {
              stryCov_9fa48("2080");
              await new Promise<void>((resolve, reject) => {
                if (stryMutAct_9fa48("2081")) {
                  {}
                } else {
                  stryCov_9fa48("2081");
                  this.gun.get(userPub).put(stryMutAct_9fa48("2082") ? {} : (stryCov_9fa48("2082"), {
                    username: sanitizedNewUsername
                  }), (ack: any) => {
                    if (stryMutAct_9fa48("2083")) {
                      {}
                    } else {
                      stryCov_9fa48("2083");
                      if (stryMutAct_9fa48("2085") ? false : stryMutAct_9fa48("2084") ? true : (stryCov_9fa48("2084", "2085"), ack.err)) {
                        if (stryMutAct_9fa48("2086")) {
                          {}
                        } else {
                          stryCov_9fa48("2086");
                          reject(new Error(stryMutAct_9fa48("2087") ? `` : (stryCov_9fa48("2087"), `Failed to update user metadata: ${ack.err}`)));
                        }
                      } else {
                        if (stryMutAct_9fa48("2088")) {
                          {}
                        } else {
                          stryCov_9fa48("2088");
                          resolve();
                        }
                      }
                    }
                  });
                }
              });
            }
          } catch (error) {
            if (stryMutAct_9fa48("2089")) {
              {}
            } else {
              stryCov_9fa48("2089");
              // If metadata update fails, try to revert the username mapping
              try {
                if (stryMutAct_9fa48("2090")) {
                  {}
                } else {
                  stryCov_9fa48("2090");
                  await new Promise<void>(resolve => {
                    if (stryMutAct_9fa48("2091")) {
                      {}
                    } else {
                      stryCov_9fa48("2091");
                      this.node.get(stryMutAct_9fa48("2092") ? "" : (stryCov_9fa48("2092"), "usernames")).get(sanitizedNewUsername).put(null, stryMutAct_9fa48("2093") ? () => undefined : (stryCov_9fa48("2093"), () => resolve()));
                    }
                  });
                }
              } catch (revertError) {
                if (stryMutAct_9fa48("2094")) {
                  {}
                } else {
                  stryCov_9fa48("2094");
                  console.error(stryMutAct_9fa48("2095") ? `` : (stryCov_9fa48("2095"), `Failed to revert username mapping after metadata update failure: ${revertError}`));
                }
              }
              return stryMutAct_9fa48("2096") ? {} : (stryCov_9fa48("2096"), {
                success: stryMutAct_9fa48("2097") ? true : (stryCov_9fa48("2097"), false),
                error: stryMutAct_9fa48("2098") ? `` : (stryCov_9fa48("2098"), `Failed to update user metadata: ${error}`)
              });
            }
          }
          console.log(stryMutAct_9fa48("2099") ? `` : (stryCov_9fa48("2099"), `Username changed successfully from '${oldUsername}' to '${sanitizedNewUsername}' for user ${userPub}`));
          return stryMutAct_9fa48("2100") ? {} : (stryCov_9fa48("2100"), {
            success: stryMutAct_9fa48("2101") ? false : (stryCov_9fa48("2101"), true),
            oldUsername,
            newUsername: sanitizedNewUsername
          });
        }
      } catch (error) {
        if (stryMutAct_9fa48("2102")) {
          {}
        } else {
          stryCov_9fa48("2102");
          console.error(stryMutAct_9fa48("2103") ? `` : (stryCov_9fa48("2103"), `Error changing username: ${error}`));
          return stryMutAct_9fa48("2104") ? {} : (stryCov_9fa48("2104"), {
            success: stryMutAct_9fa48("2105") ? true : (stryCov_9fa48("2105"), false),
            error: stryMutAct_9fa48("2106") ? `` : (stryCov_9fa48("2106"), `Username change failed: ${error}`)
          });
        }
      }
    }
  }
}
export { GunInstance, SEA, Gun, GunRxJS, crypto, GunErrors, derive, restrictedPut };
export type { IGunUserInstance, IGunInstance, IGunChain } from "gun/types";
export type { GunDataEventData, GunPeerEventData };
export type { DeriveOptions };