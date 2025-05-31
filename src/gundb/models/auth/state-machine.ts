/** Transistion function that takes a state and event and outputs a new state */
interface Machine {
  (state: AUTH_STATE, event: StateMachineEvent): AUTH_STATE;
}

/** A state machine event with optional data */
export class StateMachineEvent {
  type: AUTH_EVENT;
  data: any;

  constructor(type: AUTH_EVENT, data: any = {}) {
    this.type = type;
    this.data = data;
  }
}

/**
 *
 * @param machine - A machine function that defines state transitions.
 * @param initial - The initial state of the machine.
 */
export function use_machine(machine: Machine, initial: AUTH_STATE) {
  let state = initial;
  let subs = new Map<string, (state: AUTH_STATE) => any>();
  let stateWaiters = new Map<AUTH_STATE, Array<(success: boolean) => void>>();

  function subscribe(cb: (state: AUTH_STATE) => any) {
    const id = crypto.randomUUID();
    subs.set(id, cb);
    cb(state);

    return () => {
      subs.delete(id);
    };
  }

  function set(event: StateMachineEvent): void {
    const previousState = state;
    state = machine(state, event);

    // Notify subscribers
    for (const sub of subs.values()) {
      sub(state);
    }

    // Notify state waiters
    const waiters = stateWaiters.get(state);
    if (waiters) {
      waiters.forEach((resolve) => resolve(true));
      stateWaiters.delete(state);
    }
  }

  function getCurrentState(): AUTH_STATE {
    return state;
  }

  function waitForState(
    targetState: AUTH_STATE,
    timeoutMs: number = 10000,
  ): Promise<boolean> {
    return new Promise((resolve) => {
      // If already in target state, resolve immediately
      if (state === targetState) {
        resolve(true);
        return;
      }

      // Add to waiters
      if (!stateWaiters.has(targetState)) {
        stateWaiters.set(targetState, []);
      }
      stateWaiters.get(targetState)!.push(resolve);

      // Set timeout
      setTimeout(() => {
        const waiters = stateWaiters.get(targetState);
        if (waiters) {
          const index = waiters.indexOf(resolve);
          if (index > -1) {
            waiters.splice(index, 1);
            if (waiters.length === 0) {
              stateWaiters.delete(targetState);
            }
          }
        }
        resolve(false);
      }, timeoutMs);
    });
  }

  function isAuthenticated(): boolean {
    return (
      state === states.authorized ||
      state === states.wallet_initializing ||
      state === states.wallet_ready
    );
  }

  function isWalletReady(): boolean {
    return state === states.wallet_ready;
  }

  function isBusy(): boolean {
    return (
      state === states.creating ||
      state === states.pending ||
      state === states.leaving ||
      state === states.wallet_initializing
    );
  }

  function canStartAuth(): boolean {
    return state === states.disconnected;
  }

  function canLogout(): boolean {
    return (
      state === states.authorized ||
      state === states.wallet_ready ||
      state === states.wallet_initializing
    );
  }

  function getStateDescription(): string {
    switch (state) {
      case states.disconnected:
        return "User is disconnected and ready for authentication";
      case states.creating:
        return "User account creation in progress";
      case states.pending:
        return "User authentication in progress";
      case states.authorized:
        return "User is authenticated and ready";
      case states.leaving:
        return "User logout in progress";
      case states.wallet_initializing:
        return "Wallet initialization in progress";
      case states.wallet_ready:
        return "Wallet is ready and available";
      default:
        return `Unknown state: ${state}`;
    }
  }

  return {
    /**
     * Subscribe to state updates.
     * @returns an unsubscriber */
    subscribe,
    /** attempt to update the state machine */
    set,
    /** Get the current state */
    getCurrentState,
    /** Wait for a specific state */
    waitForState,
    /** Check if user is authenticated */
    isAuthenticated,
    /** Check if wallet is ready */
    isWalletReady,
    /** Check if state machine is in a busy state */
    isBusy,
    /** Check if authentication can be started */
    canStartAuth,
    /** Check if logout can be performed */
    canLogout,
    /** Get human-readable state description */
    getStateDescription,
  };
}

/** Possible states that the auth-manager can be in. */
export const states = {
  /** The user is in an un-busy and unauthorized state.*/
  disconnected: "disconnected" as const,
  /** A user is currently being created. */
  creating: "creating" as const,
  /** A user is currently being authorized. */
  pending: "pending" as const,
  /** The user is in an un-busy and authorized state. */
  authorized: "authorized" as const,
  /** The user is currently logging out. */
  leaving: "leaving" as const,
  /** Wallet initialization is in progress. */
  wallet_initializing: "wallet_initializing" as const,
  /** Wallet is ready and available. */
  wallet_ready: "wallet_ready" as const,
};

/** Possible events that the auth-manager can take. */
export const events = {
  create: "create" as const,
  authenticate: "authenticate" as const,
  disconnect: "disconnect" as const,
  fail: "fail" as const,
  success: "success" as const,
  wallet_init_start: "wallet_init_start" as const,
  wallet_init_success: "wallet_init_success" as const,
  wallet_init_fail: "wallet_init_fail" as const,
};

export type AUTH_EVENT = keyof typeof events;
export type AUTH_STATE = keyof typeof states;

class StateTransitionError extends Error {
  constructor(
    message: string,
    public state: AUTH_STATE,
    public event: AUTH_EVENT,
  ) {
    super(message);
  }
}

/**
 * Defines possible transitions from the states in the auth manager.
 *
 * @param state - The current state.
 * @param event The event that has happend.
 * @returns The new state.
 */
export function auth_state_machine(
  state: AUTH_STATE,
  event: StateMachineEvent,
): AUTH_STATE {
  const transition_error = new StateTransitionError(
    "Not a valid state transition",
    state,
    event.type,
  );

  switch (state) {
    // User is disconnected and unbusy
    case states.disconnected:
      if (event.type === events.create) {
        return states.creating;
      }
      if (event.type === events.authenticate) {
        return states.pending;
      }
      throw transition_error;
    // User is creating and busy
    case states.creating:
      if (event.type === events.fail) {
        return states.disconnected;
      }
      if (event.type === events.success) {
        return states.disconnected;
      }
      throw transition_error;
    // User is logging in and busy
    case states.pending:
      if (event.type === events.fail) {
        return states.disconnected;
      }
      if (event.type === events.success) {
        return states.authorized;
      }
      throw transition_error;
    // User is authorized and unbusy
    case states.authorized:
      if (event.type === events.disconnect) {
        return states.leaving;
      }
      if (event.type === events.wallet_init_start) {
        return states.wallet_initializing;
      }
      throw transition_error;
    // User is leaving and busy
    case states.leaving:
      if (event.type === events.fail) {
        return states.authorized;
      }
      if (event.type === events.success) {
        return states.disconnected;
      }
      throw transition_error;
    // Wallet is being initialized
    case states.wallet_initializing:
      if (event.type === events.wallet_init_success) {
        return states.wallet_ready;
      }
      if (event.type === events.wallet_init_fail) {
        return states.authorized;
      }
      if (event.type === events.disconnect) {
        return states.leaving;
      }
      throw transition_error;
    // Wallet is ready
    case states.wallet_ready:
      if (event.type === events.disconnect) {
        return states.leaving;
      }
      throw transition_error;
    default:
      throw transition_error;
  }
}
