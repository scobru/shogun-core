/**
 * Type for any event data
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
export type EventData = Record<string, unknown>;

/**
 * Generic event listener type
 */
export type Listener<T = unknown> = (data: T) => void;

/**
 * Event type che può essere string o symbol per compatibilità con Node.js EventEmitter
 */
export type EventType = string | symbol;

/**
 * Simple event emitter implementation with generic event types
 */
export class EventEmitter<Events extends Record<string, unknown> = Record<string, unknown>> {
  private events: Map<EventType, Array<(data: unknown) => void>>;
  constructor() {
    if (stryMutAct_9fa48("6327")) {
      {}
    } else {
      stryCov_9fa48("6327");
      this.events = new Map();
    }
  }

  /**
   * Registers an event listener
   */
  on(event: EventType, listener: (data: unknown) => void): void {
    if (stryMutAct_9fa48("6328")) {
      {}
    } else {
      stryCov_9fa48("6328");
      if (stryMutAct_9fa48("6331") ? false : stryMutAct_9fa48("6330") ? true : stryMutAct_9fa48("6329") ? this.events.has(event) : (stryCov_9fa48("6329", "6330", "6331"), !this.events.has(event))) {
        if (stryMutAct_9fa48("6332")) {
          {}
        } else {
          stryCov_9fa48("6332");
          this.events.set(event, stryMutAct_9fa48("6333") ? ["Stryker was here"] : (stryCov_9fa48("6333"), []));
        }
      }
      stryMutAct_9fa48("6334") ? this.events.get(event).push(listener) : (stryCov_9fa48("6334"), this.events.get(event)?.push(listener));
    }
  }

  /**
   * Emits an event with arguments
   */
  emit(event: EventType, data?: unknown): boolean {
    if (stryMutAct_9fa48("6335")) {
      {}
    } else {
      stryCov_9fa48("6335");
      if (stryMutAct_9fa48("6338") ? false : stryMutAct_9fa48("6337") ? true : stryMutAct_9fa48("6336") ? this.events.has(event) : (stryCov_9fa48("6336", "6337", "6338"), !this.events.has(event))) return stryMutAct_9fa48("6339") ? true : (stryCov_9fa48("6339"), false);
      const listeners = stryMutAct_9fa48("6342") ? this.events.get(event) && [] : stryMutAct_9fa48("6341") ? false : stryMutAct_9fa48("6340") ? true : (stryCov_9fa48("6340", "6341", "6342"), this.events.get(event) || (stryMutAct_9fa48("6343") ? ["Stryker was here"] : (stryCov_9fa48("6343"), [])));
      listeners.forEach(listener => {
        if (stryMutAct_9fa48("6344")) {
          {}
        } else {
          stryCov_9fa48("6344");
          try {
            if (stryMutAct_9fa48("6345")) {
              {}
            } else {
              stryCov_9fa48("6345");
              listener(data);
            }
          } catch (error) {
            if (stryMutAct_9fa48("6346")) {
              {}
            } else {
              stryCov_9fa48("6346");
              console.error(stryMutAct_9fa48("6347") ? `` : (stryCov_9fa48("6347"), `Error in event listener for ${String(event)}:`), error);
            }
          }
        }
      });
      return stryMutAct_9fa48("6348") ? false : (stryCov_9fa48("6348"), true);
    }
  }

  /**
   * Removes an event listener
   */
  off(event: EventType, listener: (data: unknown) => void): void {
    if (stryMutAct_9fa48("6349")) {
      {}
    } else {
      stryCov_9fa48("6349");
      if (stryMutAct_9fa48("6352") ? false : stryMutAct_9fa48("6351") ? true : stryMutAct_9fa48("6350") ? this.events.has(event) : (stryCov_9fa48("6350", "6351", "6352"), !this.events.has(event))) return;
      const listeners = stryMutAct_9fa48("6355") ? this.events.get(event) && [] : stryMutAct_9fa48("6354") ? false : stryMutAct_9fa48("6353") ? true : (stryCov_9fa48("6353", "6354", "6355"), this.events.get(event) || (stryMutAct_9fa48("6356") ? ["Stryker was here"] : (stryCov_9fa48("6356"), [])));
      const index = listeners.indexOf(listener);
      if (stryMutAct_9fa48("6359") ? index === -1 : stryMutAct_9fa48("6358") ? false : stryMutAct_9fa48("6357") ? true : (stryCov_9fa48("6357", "6358", "6359"), index !== (stryMutAct_9fa48("6360") ? +1 : (stryCov_9fa48("6360"), -1)))) {
        if (stryMutAct_9fa48("6361")) {
          {}
        } else {
          stryCov_9fa48("6361");
          listeners.splice(index, 1);
          if (stryMutAct_9fa48("6364") ? listeners.length !== 0 : stryMutAct_9fa48("6363") ? false : stryMutAct_9fa48("6362") ? true : (stryCov_9fa48("6362", "6363", "6364"), listeners.length === 0)) {
            if (stryMutAct_9fa48("6365")) {
              {}
            } else {
              stryCov_9fa48("6365");
              this.events.delete(event);
            }
          } else {
            if (stryMutAct_9fa48("6366")) {
              {}
            } else {
              stryCov_9fa48("6366");
              this.events.set(event, listeners);
            }
          }
        }
      }
    }
  }

  /**
   * Registers a one-time event listener
   */
  once(event: EventType, listener: (data: unknown) => void): void {
    if (stryMutAct_9fa48("6367")) {
      {}
    } else {
      stryCov_9fa48("6367");
      const onceWrapper = (data: unknown) => {
        if (stryMutAct_9fa48("6368")) {
          {}
        } else {
          stryCov_9fa48("6368");
          listener(data);
          this.off(event, onceWrapper);
        }
      };
      this.on(event, onceWrapper);
    }
  }

  /**
   * Removes all listeners for an event or all events
   */
  removeAllListeners(event?: EventType): void {
    if (stryMutAct_9fa48("6369")) {
      {}
    } else {
      stryCov_9fa48("6369");
      if (stryMutAct_9fa48("6371") ? false : stryMutAct_9fa48("6370") ? true : (stryCov_9fa48("6370", "6371"), event)) {
        if (stryMutAct_9fa48("6372")) {
          {}
        } else {
          stryCov_9fa48("6372");
          this.events.delete(event);
        }
      } else {
        if (stryMutAct_9fa48("6373")) {
          {}
        } else {
          stryCov_9fa48("6373");
          this.events.clear();
        }
      }
    }
  }
}