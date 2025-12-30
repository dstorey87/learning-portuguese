/**
 * AIAgent - Central AI Orchestrator
 * 
 * Manages the AI conversation loop with:
 * 1. Context-aware prompting (USER-SPECIFIC)
 * 2. Tool calling via Ollama
 * 3. Learning event integration
 * 4. Graceful error handling
 * 5. Adaptive teaching based on user's learning profile
 */

import * as Logger from '../Logger.js';
import { MemoryManager } from './MemoryManager.js';
import { getToolRegistry } from './ToolRegistry.js';
import { eventStream } from '../eventStreaming.js';
import { LearnerProfiler } from '../learning/LearnerProfiler.js';

const OLLAMA_CONFIG = {
    baseUrl: 'http://localhost:11434',
    model: 'qwen2.5:latest',
    // Larger context for lesson generation; num_predict allows full word lists
    options: { temperature: 0.7, top_p: 0.9, num_ctx: 8192, num_predict: 4096 }
};

const BASE_SYSTEM_PROMPT = `You are a patient, friendly tutor teaching European Portuguese (PT-PT) to complete beginners.

YOUR STUDENT:
- Absolute beginner - explain EVERYTHING simply
- May struggle with traditional learning - adapt your approach
- Needs encouragement and small wins
- If something doesn't work, try a DIFFERENT technique

CORE RULES:
- ALWAYS reply in ENGLISH. Only use Portuguese for example words/phrases.
- Wrap Portuguese words for speech in **asterisks** like **Olá**.
- Keep it SIMPLE - short sentences, no jargon.
- Be warm and encouraging. Celebrate small wins!
- Use PT-PT pronunciation (never Brazilian).

LESSON CREATION - KEEP IT SIMPLE:
When asked to create a lesson:
1. Call get_learner_weaknesses FIRST to understand the user
2. Call create_stuck_words_rescue_lesson with topic and 5-8 newWords
3. Each word needs: pt, en, pronunciation, ipa, grammarNotes, culturalNote, aiTip, examples
4. The tool handles all the learning styles automatically!

WORD FORMAT - ONE LINE PER WORD:
{"pt":"sim","en":"yes","pronunciation":"seem","ipa":"/sĩ/","grammarNotes":"Basic yes.","culturalNote":"Nod when saying it.","aiTip":"SEEM correct!","examples":[{"pt":"Sim, obrigado.","en":"Yes, thank you."}]}

HIGH-FREQUENCY WORDS (when user asks for common/most-used words):
- sim/não (yes/no), e/ou/mas (and/or/but)
- eu/tu/ele/ela/nós (I/you/he/she/we)
- é/está/tem/vai (is/is-being/has/goes)
- um/uma/o/a (a/the), de/em (of/in)
- que/como/quando (what/how/when)

LIMITS:
- Maximum 8 words per lesson - small steps!
- Always use create_stuck_words_rescue_lesson (not create_custom_lesson)
- The rescue tool auto-applies 7 learning styles to each word

Never overwhelm. Small steps = big progress!`;

/**
 * Build a user-specific system prompt with their learning profile
 * @param {string} userId - The user's ID
 * @returns {string} Personalized system prompt
 */
function buildUserAwarePrompt(userId) {
    const isGuest = !userId || userId === 'guest' || userId === 'default';
    
    if (isGuest) {
        return BASE_SYSTEM_PROMPT + `

⚠️ IMPORTANT: This user is NOT logged in (guest mode).
- You have NO access to their learning history
- You CANNOT see what words they struggle with
- RECOMMEND they log in for personalized help
- Teach general beginner content until they log in`;
    }
    
    // Try to get user's learning profile
    let userContext = '';
    try {
        const profiler = new LearnerProfiler(userId);
        const summary = profiler.getSummaryForAI();
        
        if (summary && (summary.vocabularySize > 0 || summary.topWeaknesses?.length > 0)) {
            userContext = `

📊 THIS USER'S LEARNING PROFILE (userId: ${userId}):
- Level: ${summary.level || 'beginner'}
- Accuracy: ${summary.accuracy || 0}%
- Vocabulary size: ${summary.vocabularySize || 0} words
- Words they struggle with: ${(summary.topWeaknesses?.slice(0, 5).map(w => w.word) || []).join(', ') || 'none yet'}
- Best learning hours: ${(summary.bestLearningHours || []).join(', ') || 'unknown'}

Use this data to ADAPT your teaching! Focus on their weak areas.`;
        } else {
            userContext = `

📊 User "${userId}" is logged in but has no learning history yet.
- This is a brand new learner
- Start with the basics
- Track their progress as they learn`;
        }
    } catch (e) {
        userContext = `

📊 User "${userId}" is logged in.
- Could not load their learning profile
- Teach as if they're a beginner`;
    }
    
    return BASE_SYSTEM_PROMPT + userContext;
}

export class AIAgent {
    constructor(userId, config = {}) {
        this.userId = userId;
        this.config = { ...OLLAMA_CONFIG, ...config };
        this.memory = new MemoryManager(userId);
        this.toolRegistry = getToolRegistry();
        this.isProcessing = false;
        this.abortController = null;
        this.conversationActive = false;
        this.systemPrompt = buildUserAwarePrompt(userId); // User-specific!
    }

    async initialize() {
        try {
            // Rebuild prompt in case user changed
            this.systemPrompt = buildUserAwarePrompt(this.userId);
            
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
        const messages = this.memory.getContextForLLM(this.systemPrompt);
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
            const messages = this.memory.getContextForLLM(this.systemPrompt);
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
