/**
 * User Storage Service
 * Handles all localStorage operations with user isolation
 * ALL keys are prefixed with userId to prevent data mixing
 */

import { STORAGE_KEYS } from '../config/constants.js';

class UserStorageService {
    constructor() {
        this.currentUserId = null;
    }

    /**
     * Set the current user ID - must be called after login
     */
    setCurrentUser(userId) {
        this.currentUserId = userId;
    }

    /**
     * Get current user ID
     */
    getCurrentUserId() {
        return this.currentUserId;
    }

    /**
     * Check if a user is logged in
     */
    isLoggedIn() {
        return this.currentUserId !== null;
    }

    /**
     * Ensure user is logged in before any operation
     */
    _requireAuth() {
        if (!this.currentUserId) {
            throw new Error('No user logged in - cannot access storage');
        }
    }

    /**
     * Get data for the current user
     */
    get(key) {
        this._requireAuth();
        const fullKey = `${this.currentUserId}_${key}`;
        const data = localStorage.getItem(fullKey);
        try {
            return data ? JSON.parse(data) : null;
        } catch (e) {
            console.error(`Error parsing storage key ${fullKey}:`, e);
            return null;
        }
    }

    /**
     * Set data for the current user
     */
    set(key, value) {
        this._requireAuth();
        const fullKey = `${this.currentUserId}_${key}`;
        localStorage.setItem(fullKey, JSON.stringify(value));
    }

    /**
     * Remove data for the current user
     */
    remove(key) {
        this._requireAuth();
        const fullKey = `${this.currentUserId}_${key}`;
        localStorage.removeItem(fullKey);
    }

    /**
     * Get all keys for the current user
     */
    getAllKeys() {
        this._requireAuth();
        const prefix = `${this.currentUserId}_`;
        const keys = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key.startsWith(prefix)) {
                keys.push(key.substring(prefix.length));
            }
        }
        return keys;
    }

    /**
     * Clear all data for the current user
     */
    clearAll() {
        this._requireAuth();
        const keys = this.getAllKeys();
        keys.forEach(key => this.remove(key));
    }

    // === Admin-only methods ===

    /**
     * Get data for a specific user (admin only)
     */
    getForUser(userId, key, isAdmin = false) {
        if (!isAdmin) {
            throw new Error('Admin access required');
        }
        const fullKey = `${userId}_${key}`;
        const data = localStorage.getItem(fullKey);
        try {
            return data ? JSON.parse(data) : null;
        } catch (e) {
            console.error(`Error parsing storage key ${fullKey}:`, e);
            return null;
        }
    }

    /**
     * Delete specific data for a user (admin only)
     */
    deleteForUser(userId, key, isAdmin = false) {
        if (!isAdmin) {
            throw new Error('Admin access required');
        }
        const fullKey = `${userId}_${key}`;
        localStorage.removeItem(fullKey);
    }

    /**
     * Delete all data for a user (admin only)
     */
    deleteAllForUser(userId, isAdmin = false) {
        if (!isAdmin) {
            throw new Error('Admin access required');
        }
        const prefix = `${userId}_`;
        const keysToDelete = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key.startsWith(prefix)) {
                keysToDelete.push(key);
            }
        }
        keysToDelete.forEach(key => localStorage.removeItem(key));
    }

    /**
     * List all users with data (admin only)
     */
    listAllUsers(isAdmin = false) {
        if (!isAdmin) {
            throw new Error('Admin access required');
        }
        const userIds = new Set();
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            const match = key.match(/^([^_]+)_/);
            if (match) {
                userIds.add(match[1]);
            }
        }
        return Array.from(userIds);
    }
}

// Export singleton instance
export const userStorage = new UserStorageService();
export default userStorage;
