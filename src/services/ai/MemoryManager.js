/**
 * MemoryManager - Context Window Management for AI Agent
 * 
 * Implements sliding window context management with:
 * 1. Token counting and budget management
 * 2. Priority-based message retention
 * 3. Automatic summarization of older context
 * 4. Session persistence
 */

import * as Logger from '../Logger.js';

const DEFAULT_CONFIG = {
    maxTokens: 4096,
    reservedForResponse: 1024,
    systemPromptBudget: 800,
    toolResultBudget: 500,
    summarizationThreshold: 0.8,
    minMessagesToKeep: 4,
    compressionRatio: 0.3
};

const MessagePriority = {
    SYSTEM: 10,
    TOOL_RESULT: 8,
    USER_RECENT: 7,
    ASSISTANT_RECENT: 6,
    USER_OLD: 3,
    ASSISTANT_OLD: 2,
    SUMMARY: 5
};

export class MemoryManager {
    constructor(userId, config = {}) {
        this.userId = userId;
        this.config = { ...DEFAULT_CONFIG, ...config };
        this.messages = [];
        this.summaries = [];
        this.totalTokensUsed = 0;
        this.sessionId = this.generateSessionId();
        this.loadSession();
    }

    generateSessionId() {
        return `${this.userId}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    }

    loadSession() {
        const key = `${this.userId}_ai_memory`;
        try {
            const saved = localStorage.getItem(key);
            if (saved) {
                const data = JSON.parse(saved);
                if (this.isRecentSession(data.lastUpdated)) {
                    this.messages = data.messages || [];
                    this.summaries = data.summaries || [];
                    this.sessionId = data.sessionId || this.sessionId;
                    this.recalculateTokens();
                    Logger.info('memory_manager', 'Session restored', { messageCount: this.messages.length });
                }
            }
        } catch (error) {
            Logger.warn('memory_manager', 'Failed to load session', { error: error.message });
        }
    }

    isRecentSession(lastUpdated) {
        if (!lastUpdated) return false;
        const hoursSince = (Date.now() - new Date(lastUpdated).getTime()) / (1000 * 60 * 60);
        return hoursSince < 24;
    }

    saveSession() {
        const key = `${this.userId}_ai_memory`;
        try {
            localStorage.setItem(key, JSON.stringify({
                sessionId: this.sessionId,
                messages: this.messages.slice(-50),
                summaries: this.summaries.slice(-5),
                lastUpdated: new Date().toISOString()
            }));
        } catch (error) {
            Logger.error('memory_manager', 'Failed to save session', { error: error.message });
        }
    }

    estimateTokens(text) {
        if (!text) return 0;
        const words = text.split(/\s+/).length;
        const chars = text.length;
        return Math.ceil(Math.max(words * 1.3, chars / 4));
    }

    addMessage(role, content, metadata = {}) {
        const tokens = this.estimateTokens(content);
        const message = {
            id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
            role,
            content,
            tokens,
            timestamp: Date.now(),
            priority: this.calculatePriority(role, metadata),
            metadata
        };
        this.messages.push(message);
        this.totalTokensUsed += tokens;
        if (this.shouldCompress()) this.compress();
        if (this.messages.length % 5 === 0) this.saveSession();
        return message;
    }

    calculatePriority(role, metadata) {
        if (role === 'system') return MessagePriority.SYSTEM;
        if (role === 'tool') return MessagePriority.TOOL_RESULT;
        if (metadata.isRecent !== false) {
            return role === 'user' ? MessagePriority.USER_RECENT : MessagePriority.ASSISTANT_RECENT;
        }
        return role === 'user' ? MessagePriority.USER_OLD : MessagePriority.ASSISTANT_OLD;
    }

    shouldCompress() {
        const availableTokens = this.config.maxTokens - this.config.reservedForResponse;
        return this.totalTokensUsed > availableTokens * this.config.summarizationThreshold;
    }

    compress() {
        Logger.debug('memory_manager', 'Starting compression', { currentTokens: this.totalTokensUsed });
        const systemMessages = this.messages.filter(m => m.role === 'system');
        const nonSystemMessages = this.messages.filter(m => m.role !== 'system');
        if (nonSystemMessages.length <= this.config.minMessagesToKeep) return;
        const recentCount = Math.max(this.config.minMessagesToKeep, Math.ceil(nonSystemMessages.length * 0.3));
        const recentMessages = nonSystemMessages.slice(-recentCount);
        const olderMessages = nonSystemMessages.slice(0, -recentCount);
        if (olderMessages.length > 0) {
            const summary = this.createSummary(olderMessages);
            this.summaries.push(summary);
            if (this.summaries.length > 5) this.summaries = this.summaries.slice(-5);
        }
        this.messages = [...systemMessages, ...recentMessages];
        this.recalculateTokens();
        Logger.info('memory_manager', 'Compression complete', { newTokens: this.totalTokensUsed, summarized: olderMessages.length });
    }

    createSummary(messages) {
        const userMessages = messages.filter(m => m.role === 'user').map(m => m.content);
        const assistantMessages = messages.filter(m => m.role === 'assistant').map(m => m.content);
        const topicsDiscussed = this.extractTopics(messages);
        const wordsReviewed = this.extractWordsReviewed(messages);
        return {
            id: `summary_${Date.now()}`,
            createdAt: Date.now(),
            messageCount: messages.length,
            timeRange: { start: messages[0]?.timestamp, end: messages[messages.length - 1]?.timestamp },
            topicsDiscussed,
            wordsReviewed,
            keyPoints: this.extractKeyPoints(userMessages, assistantMessages),
            tokens: this.estimateTokens(JSON.stringify({ topicsDiscussed, wordsReviewed }))
        };
    }

    extractTopics(messages) {
        const topics = new Set();
        const topicPatterns = [/lesson|lição/i, /pronunciation|pronúncia/i, /grammar|gramática/i, /vocabulary|vocabulário/i, /verb|verbo/i, /conjugat/i];
        for (const msg of messages) {
            for (const pattern of topicPatterns) {
                if (pattern.test(msg.content)) topics.add(pattern.source.split('|')[0].toLowerCase());
            }
        }
        return [...topics];
    }

    extractWordsReviewed(messages) {
        const words = new Set();
        for (const msg of messages) {
            if (msg.metadata?.wordId) words.add(msg.metadata.wordId);
            if (msg.metadata?.words) msg.metadata.words.forEach(w => words.add(w));
        }
        return [...words];
    }

    extractKeyPoints(userMessages, assistantMessages) {
        const points = [];
        if (userMessages.length > 0) points.push(`User asked ${userMessages.length} questions`);
        if (assistantMessages.length > 0) points.push(`Assistant provided ${assistantMessages.length} responses`);
        return points;
    }

    recalculateTokens() {
        this.totalTokensUsed = this.messages.reduce((sum, m) => sum + m.tokens, 0);
    }

    getContextForLLM(systemPrompt) {
        const availableTokens = this.config.maxTokens - this.config.reservedForResponse;
        const systemTokens = this.estimateTokens(systemPrompt);
        let tokenBudget = availableTokens - systemTokens;
        const contextMessages = [{ role: 'system', content: systemPrompt }];
        const summaryContext = this.getSummaryContext(Math.min(tokenBudget * 0.2, 300));
        if (summaryContext) {
            contextMessages.push({ role: 'system', content: `Previous context: ${summaryContext}` });
            tokenBudget -= this.estimateTokens(summaryContext);
        }
        const conversationMessages = this.messages.filter(m => m.role !== 'system').slice().reverse();
        const includedMessages = [];
        for (const msg of conversationMessages) {
            if (tokenBudget - msg.tokens < 0) break;
            includedMessages.unshift({ role: msg.role, content: msg.content });
            tokenBudget -= msg.tokens;
        }
        return [...contextMessages, ...includedMessages];
    }

    getSummaryContext(tokenBudget) {
        if (this.summaries.length === 0) return null;
        const parts = [];
        let tokens = 0;
        for (const summary of this.summaries.slice().reverse()) {
            const part = `Topics: ${summary.topicsDiscussed.join(', ')}. Words: ${summary.wordsReviewed.slice(0, 10).join(', ')}`;
            const partTokens = this.estimateTokens(part);
            if (tokens + partTokens > tokenBudget) break;
            parts.unshift(part);
            tokens += partTokens;
        }
        return parts.length > 0 ? parts.join(' | ') : null;
    }

    getStats() {
        return {
            sessionId: this.sessionId,
            totalMessages: this.messages.length,
            totalTokens: this.totalTokensUsed,
            summaryCount: this.summaries.length,
            availableTokens: this.config.maxTokens - this.config.reservedForResponse - this.totalTokensUsed,
            compressionNeeded: this.shouldCompress()
        };
    }

    clearSession() {
        this.messages = [];
        this.summaries = [];
        this.totalTokensUsed = 0;
        this.sessionId = this.generateSessionId();
        localStorage.removeItem(`${this.userId}_ai_memory`);
        Logger.info('memory_manager', 'Session cleared');
    }
}

export function createMemoryManager(userId, config) { return new MemoryManager(userId, config); }
export default MemoryManager;
