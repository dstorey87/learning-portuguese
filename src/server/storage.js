import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.resolve(__dirname, '../../data');
const storePath = path.join(dataDir, 'auth-store.json');

function ensureDataDir() {
    if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
    }
}

function readStore() {
    ensureDataDir();
    if (!fs.existsSync(storePath)) {
        return { users: {}, subscriptions: {} };
    }
    try {
        const raw = fs.readFileSync(storePath, 'utf8');
        return JSON.parse(raw);
    } catch (err) {
        console.error('[store] Failed to read store, recreating', err);
        return { users: {}, subscriptions: {} };
    }
}

function writeStore(store) {
    ensureDataDir();
    const payload = JSON.stringify(store, null, 2);
    fs.writeFileSync(storePath, payload, 'utf8');
}

export function upsertUser(user) {
    const store = readStore();
    const existing = store.users[user.id] || {};
    store.users[user.id] = {
        ...existing,
        ...user,
        updatedAt: Date.now()
    };
    writeStore(store);
    return store.users[user.id];
}

export function getUserById(id) {
    const store = readStore();
    return store.users[id] || null;
}

export function getUserByGoogleId(googleId) {
    const store = readStore();
    const entry = Object.values(store.users).find(u => u.googleId === googleId);
    return entry || null;
}

export function setSubscription(userId, subscription) {
    const store = readStore();
    store.subscriptions[userId] = {
        ...subscription,
        updatedAt: Date.now()
    };
    writeStore(store);
    return store.subscriptions[userId];
}

export function getSubscription(userId) {
    const store = readStore();
    return store.subscriptions[userId] || { active: false };
}

export function getStoreSnapshot() {
    return readStore();
}
