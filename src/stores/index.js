/**
 * Stores Index
 * State management for the application
 * 
 * @module stores
 */

// User state
// export { userStore } from './userStore.js';

// Learning state
// export { lessonStore } from './lessonStore.js';
// export { progressStore } from './progressStore.js';

// UI state
// export { uiStore } from './uiStore.js';
// export { navigationStore } from './navigationStore.js';

// AI state
// export { aiStore } from './aiStore.js';

// Placeholder export until stores are built
export const STORES_VERSION = '0.1.0';

/**
 * Simple reactive store factory
 * @param {*} initialState 
 * @returns {Object} Store with get, set, subscribe methods
 */
export function createStore(initialState) {
    let state = initialState;
    const listeners = new Set();

    return {
        get: () => state,
        set: (newState) => {
            state = typeof newState === 'function' ? newState(state) : newState;
            listeners.forEach(fn => fn(state));
        },
        subscribe: (fn) => {
            listeners.add(fn);
            return () => listeners.delete(fn);
        }
    };
}
