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
};
/** Possible events that the auth-manager can take. */
export declare const events: {
    create: "create";
    authenticate: "authenticate";
    disconnect: "disconnect";
    fail: "fail";
    success: "success";
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
