"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.events = exports.states = exports.StateMachineEvent = void 0;
exports.use_machine = use_machine;
exports.auth_state_machine = auth_state_machine;
/** A state machine event with optional data */
class StateMachineEvent {
    type;
    data;
    constructor(type, data = {}) {
        this.type = type;
        this.data = data;
    }
}
exports.StateMachineEvent = StateMachineEvent;
/**
 *
 * @param machine - A machine function that defines state transitions.
 * @param initial - The initial state of the machine.
 */
function use_machine(machine, initial) {
    let state = initial;
    let subs = new Map();
    function subscribe(cb) {
        const id = crypto.randomUUID();
        subs.set(id, cb);
        cb(state);
        return () => {
            subs.delete(id);
        };
    }
    function set(event) {
        state = machine(state, event);
        for (const sub of subs.values()) {
            sub(state);
        }
    }
    return {
        /**
         * Subscribe to state updates.
         * @returns an unsubscriber */
        subscribe,
        /** attempt to update the state machine */
        set,
    };
}
/** Possible states that the auth-manager can be in. */
exports.states = {
    /** The user is in an un-busy and unauthorized state.*/
    disconnected: "disconnected",
    /** A user is currently being created. */
    creating: "creating",
    /** A user is currently being authorized. */
    pending: "pending",
    /** The user is in an un-busy and authorized state. */
    authorized: "authorized",
    /** The user is currently logging out. */
    leaving: "leaving",
};
/** Possible events that the auth-manager can take. */
exports.events = {
    create: "create",
    authenticate: "authenticate",
    disconnect: "disconnect",
    fail: "fail",
    success: "success",
};
class StateTransitionError extends Error {
    state;
    event;
    constructor(message, state, event) {
        super(message);
        this.state = state;
        this.event = event;
    }
}
/**
 * Defines possible transitions from the states in the auth manager.
 *
 * @param state - The current state.
 * @param event The event that has happend.
 * @returns The new state.
 */
function auth_state_machine(state, event) {
    const transition_error = new StateTransitionError("Not a valid state transition", state, event.type);
    switch (state) {
        // User is disconnected and unbusy
        case exports.states.disconnected:
            if (event.type === exports.events.create) {
                return exports.states.creating;
            }
            if (event.type === exports.events.authenticate) {
                return exports.states.pending;
            }
            throw transition_error;
        // User is creating and busy
        case exports.states.creating:
            if (event.type === exports.events.fail) {
                return exports.states.disconnected;
            }
            if (event.type === exports.events.success) {
                return exports.states.disconnected;
            }
            throw transition_error;
        // User is logging in and busy
        case exports.states.pending:
            if (event.type === exports.events.fail) {
                return exports.states.disconnected;
            }
            if (event.type === exports.events.success) {
                return exports.states.authorized;
            }
            throw transition_error;
        // User is authorized and unbusy
        case exports.states.authorized:
            if (event.type === exports.events.disconnect) {
                return exports.states.leaving;
            }
            throw transition_error;
        // User is leaving and busy
        case exports.states.leaving:
            if (event.type === exports.events.fail) {
                return exports.states.authorized;
            }
            if (event.type === exports.events.success) {
                return exports.states.disconnected;
            }
            throw transition_error;
        default:
            throw transition_error;
    }
}
