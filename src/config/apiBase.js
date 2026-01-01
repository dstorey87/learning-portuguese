// Centralized API base resolution to avoid stale or invalid hosts.
const DEFAULT_API_BASE = 'http://localhost:3001';
const TRYCLOUDFLARE_RE = /trycloudflare\.com/i;

function isHttpUrl(value) {
    try {
        const url = new URL(value);
        return url.protocol === 'http:' || url.protocol === 'https:';
    } catch {
        return false;
    }
}

function deriveLocalApiBase() {
    if (typeof window === 'undefined') return null;
    const origin = window.location?.origin;
    if (!origin || origin === 'null' || origin.startsWith('file:')) return null;
    try {
        const url = new URL(origin);
        // Default dev setup serves UI on 4321 and API on 3001; swap if needed.
        if (url.port === '4321') url.port = '3001';
        return url.toString();
    } catch {
        return null;
    }
}

export function resolveApiBase() {
    const candidates = [];
    const globalOverride = typeof window !== 'undefined'
        ? (window.PORTULINGO_API_URL || window.PORTULINGO_API_BASE)
        : null;
    if (globalOverride) candidates.push(globalOverride);

    if (typeof window !== 'undefined') {
        try {
            const stored = localStorage.getItem('portulingo_api_base');
            if (stored) candidates.push(stored);
        } catch (err) {
            console.warn('[API] unable to read stored api base', err);
        }
        const local = deriveLocalApiBase();
        if (local) candidates.push(local);
    }

    candidates.push(DEFAULT_API_BASE);

    const unique = [...new Set(candidates.filter(Boolean))];
    const preferred = unique.find((base) => isHttpUrl(base) && !TRYCLOUDFLARE_RE.test(base))
        || unique.find(isHttpUrl)
        || DEFAULT_API_BASE;

    if (typeof window !== 'undefined') {
        try {
            localStorage.setItem('portulingo_api_base', preferred);
        } catch {
            /* ignore */
        }
    }

    return preferred;
}

export { DEFAULT_API_BASE };
