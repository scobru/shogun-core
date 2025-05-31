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
    let stateWaiters = new Map();
    function subscribe(cb) {
        const id = crypto.randomUUID();
        subs.set(id, cb);
        cb(state);
        return () => {
            subs.delete(id);
        };
    }
    function set(event) {
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
    function getCurrentState() {
        return state;
    }
    function waitForState(targetState, timeoutMs = 10000) {
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
            stateWaiters.get(targetState).push(resolve);
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
    function isAuthenticated() {
        return (state === exports.states.authorized ||
            state === exports.states.wallet_initializing ||
            state === exports.states.wallet_ready);
    }
    function isWalletReady() {
        return state === exports.states.wallet_ready;
    }
    function isBusy() {
        return (state === exports.states.creating ||
            state === exports.states.pending ||
            state === exports.states.leaving ||
            state === exports.states.wallet_initializing);
    }
    function canStartAuth() {
        return state === exports.states.disconnected;
    }
    function canLogout() {
        return (state === exports.states.authorized ||
            state === exports.states.wallet_ready ||
            state === exports.states.wallet_initializing);
    }
    function getStateDescription() {
        switch (state) {
            case exports.states.disconnected:
                return "User is disconnected and ready for authentication";
            case exports.states.creating:
                return "User account creation in progress";
            case exports.states.pending:
                return "User authentication in progress";
            case exports.states.authorized:
                return "User is authenticated and ready";
            case exports.states.leaving:
                return "User logout in progress";
            case exports.states.wallet_initializing:
                return "Wallet initialization in progress";
            case exports.states.wallet_ready:
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
    /** Wallet initialization is in progress. */
    wallet_initializing: "wallet_initializing",
    /** Wallet is ready and available. */
    wallet_ready: "wallet_ready",
};
/** Possible events that the auth-manager can take. */
exports.events = {
    create: "create",
    authenticate: "authenticate",
    disconnect: "disconnect",
    fail: "fail",
    success: "success",
    wallet_init_start: "wallet_init_start",
    wallet_init_success: "wallet_init_success",
    wallet_init_fail: "wallet_init_fail",
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
            if (event.type === exports.events.wallet_init_start) {
                return exports.states.wallet_initializing;
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
        // Wallet is being initialized
        case exports.states.wallet_initializing:
            if (event.type === exports.events.wallet_init_success) {
                return exports.states.wallet_ready;
            }
            if (event.type === exports.events.wallet_init_fail) {
                return exports.states.authorized;
            }
            if (event.type === exports.events.disconnect) {
                return exports.states.leaving;
            }
            throw transition_error;
        // Wallet is ready
        case exports.states.wallet_ready:
            if (event.type === exports.events.disconnect) {
                return exports.states.leaving;
            }
            throw transition_error;
        default:
            throw transition_error;
    }
}
