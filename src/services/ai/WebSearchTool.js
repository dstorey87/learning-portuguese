/**
 * WebSearchTool - Whitelisted Portuguese Resource Search
 * 
 * Searches trusted Portuguese language resources:
 * - Priberam Dictionary (PT-PT definitions)
 * - Infopédia (Porto Editora dictionary)
 * - Ciberdúvidas (grammar questions)
 * - Linguee (translations with context)
 * - Forvo (pronunciation by natives)
 * - European Portuguese Info (learning resource)
 */

import * as Logger from '../Logger.js';

const SOURCES = {
    priberam: {
        name: 'Priberam Dictionary',
        baseUrl: 'https://dicionario.priberam.org',
        searchUrl: (query) => `https://dicionario.priberam.org/${encodeURIComponent(query)}`,
        description: 'Authoritative PT-PT dictionary with definitions, synonyms, and etymology'
    },
    infopedia: {
        name: 'Infopédia',
        baseUrl: 'https://www.infopedia.pt',
        searchUrl: (query) => `https://www.infopedia.pt/dicionarios/lingua-portuguesa/${encodeURIComponent(query)}`,
        description: 'Porto Editora dictionary - comprehensive Portuguese definitions'
    },
    ciberduvidas: {
        name: 'Ciberdúvidas',
        baseUrl: 'https://ciberduvidas.iscte-iul.pt',
        searchUrl: (query) => `https://ciberduvidas.iscte-iul.pt/pesquisa?q=${encodeURIComponent(query)}`,
        description: 'Expert answers to Portuguese grammar and usage questions'
    },
    linguee: {
        name: 'Linguee',
        baseUrl: 'https://www.linguee.pt',
        searchUrl: (query) => `https://www.linguee.pt/portugues-ingles/search?source=auto&query=${encodeURIComponent(query)}`,
        description: 'Translation examples in real-world context'
    },
    forvo: {
        name: 'Forvo',
        baseUrl: 'https://forvo.com',
        searchUrl: (query) => `https://forvo.com/search/${encodeURIComponent(query)}/pt/`,
        description: 'Native speaker pronunciations'
    },
    europeanportuguese: {
        name: 'European Portuguese',
        baseUrl: 'https://www.europeanportuguese.info',
        searchUrl: (query) => `https://www.europeanportuguese.info/?s=${encodeURIComponent(query)}`,
        description: 'Learning resources focused on PT-PT'
    }
};

export class WebSearchTool {
    constructor() {
        this.cache = new Map();
        this.cacheTimeout = 30 * 60 * 1000;
        this.rateLimitDelay = 1000;
        this.lastRequestTime = 0;
    }

    async search(query, sourceIds = ['priberam', 'infopedia']) {
        if (!query || query.trim().length === 0) {
            return { success: false, error: 'Query is required' };
        }
        const cacheKey = `${query}_${sourceIds.sort().join(',')}`;
        const cached = this.getFromCache(cacheKey);
        if (cached) {
            Logger.debug('web_search', 'Cache hit', { query });
            return { success: true, results: cached, fromCache: true };
        }
        const results = [];
        for (const sourceId of sourceIds) {
            const source = SOURCES[sourceId];
            if (!source) {
                Logger.warn('web_search', 'Unknown source', { sourceId });
                continue;
            }
            try {
                await this.respectRateLimit();
                const result = await this.searchSource(source, query);
                results.push({ source: sourceId, sourceName: source.name, ...result });
            } catch (error) {
                Logger.error('web_search', 'Source search failed', { sourceId, error: error.message });
                results.push({ source: sourceId, sourceName: source.name, success: false, error: error.message });
            }
        }
        if (results.some(r => r.success)) {
            this.setCache(cacheKey, results);
        }
        return { success: true, query, results, timestamp: Date.now() };
    }

    async searchSource(source, query) {
        const url = source.searchUrl(query);
        try {
            const response = await fetch(url, {
                method: 'GET',
                headers: { 'Accept': 'text/html,application/xhtml+xml', 'User-Agent': 'Mozilla/5.0 (compatible; PortugueseLearner/1.0)' },
                signal: AbortSignal.timeout(10000)
            });
            if (!response.ok) {
                return { success: false, error: `HTTP ${response.status}`, url };
            }
            const html = await response.text();
            const extracted = this.extractContent(html, source.baseUrl);
            return { success: true, url, content: extracted, description: source.description };
        } catch (error) {
            if (error.name === 'TimeoutError') {
                return { success: false, error: 'Request timeout', url };
            }
            return { success: false, error: error.message, url };
        }
    }

    extractContent(html, baseUrl) {
        const text = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '').replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
        let content = text.substring(0, 2000);
        if (baseUrl.includes('priberam')) {
            const defMatch = text.match(/(?:significado|definição)[:\s]*(.*?)(?:\.|$)/i);
            if (defMatch) content = defMatch[1].trim();
        }
        return content;
    }

    async respectRateLimit() {
        const now = Date.now();
        const timeSince = now - this.lastRequestTime;
        if (timeSince < this.rateLimitDelay) {
            await new Promise(resolve => setTimeout(resolve, this.rateLimitDelay - timeSince));
        }
        this.lastRequestTime = Date.now();
    }

    getFromCache(key) {
        const cached = this.cache.get(key);
        if (!cached) return null;
        if (Date.now() - cached.timestamp > this.cacheTimeout) {
            this.cache.delete(key);
            return null;
        }
        return cached.data;
    }

    setCache(key, data) {
        this.cache.set(key, { data, timestamp: Date.now() });
        if (this.cache.size > 100) {
            const oldestKey = this.cache.keys().next().value;
            this.cache.delete(oldestKey);
        }
    }

    getAvailableSources() {
        return Object.entries(SOURCES).map(([id, source]) => ({ id, name: source.name, description: source.description, baseUrl: source.baseUrl }));
    }

    buildSearchUrl(sourceId, query) {
        const source = SOURCES[sourceId];
        return source ? source.searchUrl(query) : null;
    }

    clearCache() {
        this.cache.clear();
        Logger.info('web_search', 'Cache cleared');
    }
}

let webSearchInstance = null;
export function getWebSearch() {
    if (!webSearchInstance) webSearchInstance = new WebSearchTool();
    return webSearchInstance;
}

export default WebSearchTool;
