/**
 * ToolRegistry - AI Agent Tool Definitions
 * 
 * Defines all tools available to the AI agent with JSON Schema validation.
 * Tools integrate with existing services for Portuguese language learning.
 */

import * as Logger from '../Logger.js';

export const TOOL_DEFINITIONS = [
    {
        type: 'function',
        function: {
            name: 'get_due_words',
            description: 'Get words that are due for review based on spaced repetition schedule. Returns words the user should practice now.',
            parameters: {
                type: 'object',
                properties: {
                    limit: { type: 'number', description: 'Maximum number of words to return (default: 10)', default: 10 },
                    category: { type: 'string', description: 'Optional category filter (e.g., "pronouns", "verbs", "greetings")' },
                    includeNew: { type: 'boolean', description: 'Whether to include new words not yet learned', default: true }
                },
                required: []
            }
        }
    },
    {
        type: 'function',
        function: {
            name: 'record_answer',
            description: 'Record the user\'s answer to a word/phrase review. Updates spaced repetition schedule and triggers learning events.',
            parameters: {
                type: 'object',
                properties: {
                    wordId: { type: 'string', description: 'The unique identifier of the word/phrase' },
                    rating: { type: 'number', description: 'Quality rating: 1=Again (forgot), 2=Hard, 3=Good, 4=Easy', enum: [1, 2, 3, 4] },
                    responseTime: { type: 'number', description: 'Time in milliseconds the user took to respond' },
                    userAnswer: { type: 'string', description: 'The answer the user provided (for error tracking)' }
                },
                required: ['wordId', 'rating']
            }
        }
    },
    {
        type: 'function',
        function: {
            name: 'speak_portuguese',
            description: 'Speak Portuguese text using text-to-speech. Uses high-quality neural Portuguese voices.',
            parameters: {
                type: 'object',
                properties: {
                    text: { type: 'string', description: 'The Portuguese text to speak' },
                    voice: { type: 'string', description: 'Voice to use: "duarte" (male) or "raquel" (female)', enum: ['duarte', 'raquel'], default: 'duarte' },
                    speed: { type: 'number', description: 'Speech rate multiplier (0.5 to 2.0)', minimum: 0.5, maximum: 2.0, default: 1.0 }
                },
                required: ['text']
            }
        }
    },
    {
        type: 'function',
        function: {
            name: 'get_pronunciation_guide',
            description: 'Get detailed pronunciation guide for a Portuguese word or phrase, including IPA transcription and tips.',
            parameters: {
                type: 'object',
                properties: {
                    text: { type: 'string', description: 'The Portuguese word or phrase' },
                    includeAudio: { type: 'boolean', description: 'Whether to also speak the word', default: false }
                },
                required: ['text']
            }
        }
    },
    {
        type: 'function',
        function: {
            name: 'analyze_pronunciation',
            description: 'Analyze the user\'s pronunciation of a Portuguese word by comparing their audio to the expected pronunciation.',
            parameters: {
                type: 'object',
                properties: {
                    expectedText: { type: 'string', description: 'The Portuguese text the user attempted to pronounce' },
                    userTranscript: { type: 'string', description: 'The transcribed text from user\'s speech' },
                    audioData: { type: 'string', description: 'Base64-encoded audio data (optional for detailed phoneme analysis)' }
                },
                required: ['expectedText', 'userTranscript']
            }
        }
    },
    {
        type: 'function',
        function: {
            name: 'search_portuguese',
            description: 'Search for information about Portuguese words, grammar, or expressions from trusted sources like Priberam dictionary, Infopédia, and Portuguese language resources.',
            parameters: {
                type: 'object',
                properties: {
                    query: { type: 'string', description: 'The search query (word, phrase, or grammar question)' },
                    sources: { type: 'array', items: { type: 'string', enum: ['priberam', 'infopedia', 'ciberduvidas', 'linguee', 'forvo', 'europeanportuguese'] }, description: 'Specific sources to search (defaults to all)', default: ['priberam', 'infopedia'] }
                },
                required: ['query']
            }
        }
    },
    {
        type: 'function',
        function: {
            name: 'get_lesson_context',
            description: 'Get information about the current lesson or a specific lesson by ID. Includes word list, grammar notes, and progress.',
            parameters: {
                type: 'object',
                properties: {
                    lessonId: { type: 'string', description: 'Optional lesson ID. If not provided, returns current active lesson.' },
                    includeProgress: { type: 'boolean', description: 'Whether to include user\'s progress on this lesson', default: true }
                },
                required: []
            }
        }
    }
];

export class ToolRegistry {
    constructor() {
        this.tools = new Map();
        this.handlers = new Map();
        this.registerDefaultTools();
    }

    registerDefaultTools() {
        for (const tool of TOOL_DEFINITIONS) {
            this.register(tool.function.name, tool, null);
        }
    }

    register(name, definition, handler) {
        this.tools.set(name, definition);
        if (handler) this.handlers.set(name, handler);
        Logger.debug('tool_registry', 'Tool registered', { name });
    }

    setHandler(name, handler) {
        if (!this.tools.has(name)) {
            Logger.warn('tool_registry', 'Setting handler for unknown tool', { name });
        }
        this.handlers.set(name, handler);
    }

    get(name) { return this.tools.get(name); }
    getHandler(name) { return this.handlers.get(name); }

    getToolsForLLM() {
        return Array.from(this.tools.values());
    }

    validateCall(name, args) {
        const tool = this.tools.get(name);
        if (!tool) return { valid: false, error: `Unknown tool: ${name}` };
        const schema = tool.function.parameters;
        const required = schema.required || [];
        for (const param of required) {
            if (!(param in args)) return { valid: false, error: `Missing required parameter: ${param}` };
        }
        for (const [param, value] of Object.entries(args)) {
            const paramSchema = schema.properties[param];
            if (!paramSchema) continue;
            const typeCheck = this.validateType(value, paramSchema);
            if (!typeCheck.valid) return { valid: false, error: `Parameter ${param}: ${typeCheck.error}` };
        }
        return { valid: true };
    }

    validateType(value, schema) {
        if (schema.enum && !schema.enum.includes(value)) return { valid: false, error: `Value must be one of: ${schema.enum.join(', ')}` };
        if (schema.type === 'number') {
            if (typeof value !== 'number') return { valid: false, error: 'Expected number' };
            if (schema.minimum !== undefined && value < schema.minimum) return { valid: false, error: `Value must be >= ${schema.minimum}` };
            if (schema.maximum !== undefined && value > schema.maximum) return { valid: false, error: `Value must be <= ${schema.maximum}` };
        }
        if (schema.type === 'string' && typeof value !== 'string') return { valid: false, error: 'Expected string' };
        if (schema.type === 'boolean' && typeof value !== 'boolean') return { valid: false, error: 'Expected boolean' };
        if (schema.type === 'array' && !Array.isArray(value)) return { valid: false, error: 'Expected array' };
        return { valid: true };
    }

    async execute(name, args) {
        const validation = this.validateCall(name, args);
        if (!validation.valid) {
            Logger.warn('tool_registry', 'Invalid tool call', { name, error: validation.error });
            return { success: false, error: validation.error };
        }
        const handler = this.handlers.get(name);
        if (!handler) {
            Logger.warn('tool_registry', 'No handler for tool', { name });
            return { success: false, error: `No handler registered for tool: ${name}` };
        }
        try {
            Logger.info('tool_registry', 'Executing tool', { name, args });
            const result = await handler(args);
            return { success: true, result };
        } catch (error) {
            Logger.error('tool_registry', 'Tool execution failed', { name, error: error.message });
            return { success: false, error: error.message };
        }
    }

    listTools() {
        return Array.from(this.tools.keys());
    }

    getToolDescriptions() {
        return Array.from(this.tools.values()).map(t => ({ name: t.function.name, description: t.function.description, parameters: Object.keys(t.function.parameters.properties || {}) }));
    }
}

let toolRegistry = null;
export function getToolRegistry() {
    if (!toolRegistry) toolRegistry = new ToolRegistry();
    return toolRegistry;
}

export default ToolRegistry;
