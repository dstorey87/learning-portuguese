/**
 * AIAgent - Central AI Orchestrator
 * 
 * Manages the AI conversation loop with:
 * 1. Context-aware prompting
 * 2. Tool calling via Ollama
 * 3. Learning event integration
 * 4. Graceful error handling
 */

import * as Logger from '../Logger.js';
import { MemoryManager } from './MemoryManager.js';
import { getToolRegistry } from './ToolRegistry.js';
import { eventStream } from '../eventStreaming.js';

const OLLAMA_CONFIG = {
    baseUrl: 'http://localhost:11434',
    model: 'qwen2.5:latest',
    // Smaller context window for faster responses; raise num_ctx if needed
    options: { temperature: 0.75, top_p: 0.9, num_ctx: 2048, num_predict: 256 }
};

const SYSTEM_PROMPT = `You are a concise, friendly tutor teaching European Portuguese (PT-PT) to English speakers.
Rules:
- ALWAYS reply in ENGLISH. Only use Portuguese for example words/phrases.
- When showing Portuguese, mark it with **palavra** so it gets audio buttons.
- Use PT-PT pronunciation and vocabulary (never Brazilian).
- Keep answers SHORT (1-3 sentences) unless asked for detail.
- Be encouraging but honest about mistakes.`;

export class AIAgent {
    constructor(userId, config = {}) {
        this.userId = userId;
        this.config = { ...OLLAMA_CONFIG, ...config };
        this.memory = new MemoryManager(userId);
        this.toolRegistry = getToolRegistry();
        this.isProcessing = false;
        this.abortController = null;
        this.conversationActive = false;
    }

    async initialize() {
        try {
            const health = await this.checkOllamaHealth();
            if (!health.available) {
                Logger.warn('ai_agent', 'Ollama not available', { error: health.error });
                return { success: false, error: 'AI service not available' };
            }
            this.conversationActive = true;
            Logger.info('ai_agent', 'Agent initialized', { model: this.config.model });
            return { success: true, model: this.config.model };
        } catch (error) {
            Logger.error('ai_agent', 'Initialization failed', { error: error.message });
            return { success: false, error: error.message };
        }
    }

    async checkOllamaHealth() {
        try {
            const response = await fetch(`${this.config.baseUrl}/api/tags`, { method: 'GET', signal: AbortSignal.timeout(5000) });
            if (!response.ok) return { available: false, error: 'Ollama not responding' };
            const data = await response.json();
            const hasModel = data.models?.some(m => m.name.includes(this.config.model.split(':')[0]));
            return { available: true, hasModel, models: data.models?.map(m => m.name) };
        } catch (error) {
            return { available: false, error: error.message };
        }
    }

    async processInput(userMessage, context = {}) {
        if (this.isProcessing) {
            return { success: false, error: 'Already processing a message' };
        }
        this.isProcessing = true;
        this.abortController = new AbortController();
        try {
            this.memory.addMessage('user', userMessage, { isRecent: true, ...context });
            try {
                eventStream.track('user_message', { userId: this.userId, messageLength: userMessage.length });
            } catch (e) { /* Event tracking failed - continue */ }
            const response = await this.generateResponse();
            return { success: true, response };
        } catch (error) {
            if (error.name === 'AbortError') {
                Logger.info('ai_agent', 'Request aborted');
                return { success: false, error: 'Request cancelled' };
            }
            Logger.error('ai_agent', 'Processing failed', { error: error.message });
            return { success: false, error: error.message };
        } finally {
            this.isProcessing = false;
            this.abortController = null;
        }
    }

    async generateResponse(depth = 0) {
        if (depth > 5) {
            Logger.warn('ai_agent', 'Max tool call depth reached');
            return 'I apologize, but I encountered an issue processing your request. Could you try rephrasing?';
        }
        const messages = this.memory.getContextForLLM(SYSTEM_PROMPT);
        const tools = this.toolRegistry.getToolsForLLM();
        const requestBody = {
            model: this.config.model,
            messages,
            tools,
            stream: false,
            options: this.config.options
        };
        const response = await fetch(`${this.config.baseUrl}/api/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody),
            signal: this.abortController?.signal
        });
        if (!response.ok) throw new Error(`Ollama error: ${response.status}`);
        const data = await response.json();
        const message = data.message;
        if (message.tool_calls && message.tool_calls.length > 0) {
            Logger.info('ai_agent', 'Tool calls requested', { count: message.tool_calls.length });
            for (const toolCall of message.tool_calls) {
                const result = await this.executeToolCall(toolCall);
                this.memory.addMessage('tool', JSON.stringify({ tool: toolCall.function.name, result }), { toolCall: true, toolName: toolCall.function.name });
            }
            return this.generateResponse(depth + 1);
        }
        const assistantMessage = message.content || '';
        this.memory.addMessage('assistant', assistantMessage, { isRecent: true });
        try {
            eventStream.track('ai_response', { userId: this.userId, responseLength: assistantMessage.length, toolsUsed: message.tool_calls?.length || 0 });
        } catch (e) { /* Event tracking failed - continue */ }
        return assistantMessage;
    }

    async executeToolCall(toolCall) {
        const { name, arguments: args } = toolCall.function;
        let parsedArgs = args;
        if (typeof args === 'string') {
            try { parsedArgs = JSON.parse(args); } catch (e) { parsedArgs = {}; void e; }
        }
        Logger.info('ai_agent', 'Executing tool', { name, args: parsedArgs });
        const result = await this.toolRegistry.execute(name, parsedArgs);
        try {
            eventStream.track('tool_execution', { userId: this.userId, toolName: name, success: result.success });
        } catch (e) { /* Event tracking failed - continue */ }
        return result;
    }

    abort() {
        if (this.abortController) {
            this.abortController.abort();
            Logger.info('ai_agent', 'Request aborted by user');
        }
    }

    getMemoryStats() { return this.memory.getStats(); }
    clearConversation() { this.memory.clearSession(); Logger.info('ai_agent', 'Conversation cleared'); }

    injectContext(context) {
        const contextStr = typeof context === 'string' ? context : JSON.stringify(context);
        this.memory.addMessage('system', `Context update: ${contextStr}`, { isContext: true });
    }

    async streamResponse(userMessage, onChunk, context = {}) {
        if (this.isProcessing) return { success: false, error: 'Already processing' };
        this.isProcessing = true;
        this.abortController = new AbortController();
        try {
            this.memory.addMessage('user', userMessage, { isRecent: true, ...context });
            const messages = this.memory.getContextForLLM(SYSTEM_PROMPT);
            const response = await fetch(`${this.config.baseUrl}/api/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ model: this.config.model, messages, stream: true, options: this.config.options }),
                signal: this.abortController?.signal
            });
            if (!response.ok) throw new Error(`Ollama error: ${response.status}`);
            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let fullResponse = '';
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                const chunk = decoder.decode(value, { stream: true });
                const lines = chunk.split('\n').filter(l => l.trim());
                for (const line of lines) {
                    try {
                        const data = JSON.parse(line);
                        if (data.message?.content) {
                            fullResponse += data.message.content;
                            onChunk(data.message.content);
                        }
                    } catch (e) { void e; }
                }
            }
            this.memory.addMessage('assistant', fullResponse, { isRecent: true });
            return { success: true, response: fullResponse };
        } catch (error) {
            if (error.name === 'AbortError') return { success: false, error: 'Cancelled' };
            Logger.error('ai_agent', 'Stream failed', { error: error.message });
            return { success: false, error: error.message };
        } finally {
            this.isProcessing = false;
            this.abortController = null;
        }
    }
}

let agentInstance = null;
export function getAIAgent(userId) {
    if (!agentInstance || agentInstance.userId !== userId) {
        agentInstance = new AIAgent(userId);
    }
    return agentInstance;
}

export default AIAgent;
