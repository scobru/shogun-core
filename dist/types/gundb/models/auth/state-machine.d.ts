/** Transistion function that takes a state and event and outputs a new state */
interface Machine {
    (state: AUTH_STATE, event: StateMachineEvent): AUTH_STATE;
}
/** A state machine event with optional data */
export declare class StateMachineEvent {
    type: AUTH_EVENT;
    data: any;
    constructor(type: AUTH_EVENT, data?: any);
}
/**
 *
 * @param machine - A machine function that defines state transitions.
 * @param initial - The initial state of the machine.
 */
export declare function use_machine(machine: Machine, initial: AUTH_STATE): {
    /**
     * Subscribe to state updates.
     * @returns an unsubscriber */
    subscribe: (cb: (state: AUTH_STATE) => any) => () => void;
    /** attempt to update the state machine */
    set: (event: StateMachineEvent) => void;
    /** Get the current state */
    getCurrentState: () => AUTH_STATE;
    /** Wait for a specific state */
    waitForState: (targetState: AUTH_STATE, timeoutMs?: number) => Promise<boolean>;
    /** Check if user is authenticated */
    isAuthenticated: () => boolean;
    /** Check if wallet is ready */
    isWalletReady: () => boolean;
    /** Check if state machine is in a busy state */
    isBusy: () => boolean;
    /** Check if authentication can be started */
    canStartAuth: () => boolean;
    /** Check if logout can be performed */
    canLogout: () => boolean;
    /** Get human-readable state description */
    getStateDescription: () => string;
};
/** Possible states that the auth-manager can be in. */
export declare const states: {
    /** The user is in an un-busy and unauthorized state.*/
    disconnected: "disconnected";
    /** A user is currently being created. */
    creating: "creating";
    /** A user is currently being authorized. */
    pending: "pending";
    /** The user is in an un-busy and authorized state. */
    authorized: "authorized";
    /** The user is currently logging out. */
    leaving: "leaving";
    /** Wallet initialization is in progress. */
    wallet_initializing: "wallet_initializing";
    /** Wallet is ready and available. */
    wallet_ready: "wallet_ready";
};
/** Possible events that the auth-manager can take. */
export declare const events: {
    create: "create";
    authenticate: "authenticate";
    disconnect: "disconnect";
    fail: "fail";
    success: "success";
    wallet_init_start: "wallet_init_start";
    wallet_init_success: "wallet_init_success";
    wallet_init_fail: "wallet_init_fail";
};
export type AUTH_EVENT = keyof typeof events;
export type AUTH_STATE = keyof typeof states;
/**
 * Defines possible transitions from the states in the auth manager.
 *
 * @param state - The current state.
 * @param event The event that has happend.
 * @returns The new state.
 */
export declare function auth_state_machine(state: AUTH_STATE, event: StateMachineEvent): AUTH_STATE;
export {};
