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
    },
    {
        type: 'function',
        function: {
            name: 'get_learner_weaknesses',
            description: 'Analyze the learner\'s profile to identify weaknesses, confusion pairs, pronunciation issues, and words that need practice. Use this before creating custom lessons.',
            parameters: {
                type: 'object',
                properties: {
                    includeConfusionPairs: { type: 'boolean', description: 'Include words the user frequently confuses', default: true },
                    includePronunciationIssues: { type: 'boolean', description: 'Include phonemes and words with poor pronunciation scores', default: true },
                    includeSRSDue: { type: 'boolean', description: 'Include words due for spaced repetition review', default: true },
                    limit: { type: 'number', description: 'Maximum items per category', default: 10 }
                },
                required: []
            }
        }
    },
    {
        type: 'function',
        function: {
            name: 'create_custom_lesson',
            description: `Create a FULL, high-quality Portuguese lesson that appears in the Learn page. 
IMPORTANT: Each word MUST have pt, en, and SHOULD have pronunciation, ipa, grammarNotes, culturalNote, aiTip, and examples.
The lesson will auto-generate challenges if none provided. After creating, use verify_custom_lesson to check quality.
Naming: Lessons get IDs like AI-001-topic-name automatically.`,
            parameters: {
                type: 'object',
                properties: {
                    title: { type: 'string', description: 'Lesson title (e.g., "Essential Portuguese Greetings")' },
                    description: { type: 'string', description: 'What learners will master in this lesson' },
                    topic: { type: 'string', description: 'Topic category (e.g., "greetings", "verbs", "food", "travel")' },
                    focusArea: {
                        type: 'string',
                        enum: ['pronunciation', 'vocabulary', 'grammar', 'confusion_pairs', 'mixed'],
                        description: 'Primary focus area'
                    },
                    words: {
                        type: 'array',
                        items: {
                            type: 'object',
                            properties: {
                                pt: { type: 'string', description: 'Portuguese word/phrase (REQUIRED)' },
                                en: { type: 'string', description: 'English translation (REQUIRED)' },
                                pronunciation: { type: 'string', description: 'Phonetic pronunciation (e.g., "oh-la")' },
                                ipa: { type: 'string', description: 'IPA notation (e.g., "/ɔˈla/")' },
                                type: { type: 'string', description: 'Word type (noun, verb, adjective, etc.)' },
                                grammarNotes: { type: 'string', description: 'Grammar explanation and usage rules' },
                                culturalNote: { type: 'string', description: 'Cultural context or when to use' },
                                aiTip: { type: 'string', description: 'Memory tip or learning advice' },
                                examples: { 
                                    type: 'array', 
                                    items: { 
                                        type: 'object',
                                        properties: {
                                            pt: { type: 'string', description: 'Example sentence in Portuguese' },
                                            en: { type: 'string', description: 'English translation' }
                                        }
                                    },
                                    description: 'Example sentences showing word in context'
                                }
                            },
                            required: ['pt', 'en']
                        },
                        description: 'Array of 5-8 words with FULL details for a quality lesson'
                    },
                    sentences: {
                        type: 'array',
                        items: {
                            type: 'object',
                            properties: {
                                pt: { type: 'string' },
                                en: { type: 'string' }
                            }
                        },
                        description: 'Practice sentences (auto-generated from examples if not provided)'
                    },
                    challenges: {
                        type: 'array',
                        items: {
                            type: 'object',
                            properties: {
                                type: { type: 'string', enum: ['multiple-choice', 'translate', 'fill-blank'], description: 'Challenge type' },
                                question: { type: 'string', description: 'Question text' },
                                prompt: { type: 'string', description: 'For translate: sentence to translate' },
                                options: { type: 'array', items: { type: 'string' } },
                                correct: { type: 'number', description: 'Index of correct option (0-based)' },
                                answer: { type: 'string', description: 'Correct answer for translate' },
                                explanation: { type: 'string' }
                            }
                        },
                        description: 'Challenges (auto-generated if not provided)'
                    },
                    difficulty: {
                        type: 'string',
                        enum: ['beginner', 'intermediate', 'advanced'],
                        default: 'beginner'
                    }
                },
                required: ['title', 'words']
            }
        }
    },
    {
        type: 'function',
        function: {
            name: 'verify_custom_lesson',
            description: 'Check if a created lesson has all required components and good quality. Use after create_custom_lesson to ensure the lesson is complete.',
            parameters: {
                type: 'object',
                properties: {
                    lessonId: { type: 'string', description: 'The lesson ID returned from create_custom_lesson (e.g., "AI-001-greetings")' }
                },
                required: ['lessonId']
            }
        }
    },
    {
        type: 'function',
        function: {
            name: 'get_custom_lessons',
            description: 'Get all AI-generated custom lessons for this user.',
            parameters: {
                type: 'object',
                properties: {
                    includeCompleted: { type: 'boolean', description: 'Include lessons the user has completed', default: true }
                },
                required: []
            }
        }
    },
    {
        type: 'function',
        function: {
            name: 'delete_custom_lesson',
            description: 'Delete a custom lesson by ID (user can discard lessons they don\'t want).',
            parameters: {
                type: 'object',
                properties: {
                    lessonId: { type: 'string', description: 'ID of the custom lesson to delete' }
                },
                required: ['lessonId']
            }
        }
    },
    {
        type: 'function',
        function: {
            name: 'lookup_word',
            description: 'Look up a Portuguese word in the lesson database to get complete information including translation, IPA, examples, and grammar notes.',
            parameters: {
                type: 'object',
                properties: {
                    word: { type: 'string', description: 'The Portuguese word to look up (e.g., "obrigado", "eu", "bom dia")' },
                    includeExamples: { type: 'boolean', description: 'Include example sentences', default: true }
                },
                required: ['word']
            }
        }
    },
    {
        type: 'function',
        function: {
            name: 'get_available_lessons',
            description: 'Get a list of all available lessons the user can study. Use this to recommend specific lessons to the user.',
            parameters: {
                type: 'object',
                properties: {
                    topic: { type: 'string', description: 'Filter by topic (e.g., "Building Blocks", "Basic Greetings")' },
                    includeProgress: { type: 'boolean', description: 'Include user progress for each lesson', default: true },
                    limit: { type: 'number', description: 'Maximum lessons to return', default: 10 }
                },
                required: []
            }
        }
    },
    {
        type: 'function',
        function: {
            name: 'start_lesson',
            description: 'Start a specific lesson for the user. Use this after recommending a lesson.',
            parameters: {
                type: 'object',
                properties: {
                    lessonId: { type: 'string', description: 'The ID of the lesson to start' }
                },
                required: ['lessonId']
            }
        }
    },
    
    // ========================================================================
    // STUCK WORDS RESCUE TOOLS
    // ========================================================================
    
    {
        type: 'function',
        function: {
            name: 'get_stuck_words',
            description: 'Get words the user is struggling with (failed 3+ times). Use this before creating rescue lessons to identify what words need extra help.',
            parameters: {
                type: 'object',
                properties: {
                    category: { type: 'string', description: 'Filter by category (e.g., "pronouns", "verbs", "greetings")' },
                    limit: { type: 'number', description: 'Maximum words to return', default: 10 },
                    includeRescued: { type: 'boolean', description: 'Include words that were already rescued', default: false }
                },
                required: []
            }
        }
    },
    {
        type: 'function',
        function: {
            name: 'generate_mnemonic_story',
            description: 'Generate keyword mnemonic building blocks for a stuck word. The AI should use this to create a vivid story connecting a sound-alike English word to the Portuguese meaning. Research shows this is 2-3x more effective than rote learning.',
            parameters: {
                type: 'object',
                properties: {
                    pt: { type: 'string', description: 'The Portuguese word' },
                    en: { type: 'string', description: 'The English translation' },
                    wordKey: { type: 'string', description: 'Word key for tracking rescue attempts (pt|en format)' }
                },
                required: ['pt', 'en']
            }
        }
    },
    {
        type: 'function',
        function: {
            name: 'create_memory_palace_scene',
            description: 'Create a memory palace (method of loci) exercise for multiple stuck words. Places each word in a room of a familiar location with vivid imagery.',
            parameters: {
                type: 'object',
                properties: {
                    words: { 
                        type: 'array', 
                        items: { 
                            type: 'object',
                            properties: {
                                pt: { type: 'string' },
                                en: { type: 'string' }
                            }
                        },
                        description: 'Array of words to place in the memory palace (max 7)' 
                    },
                    location: { type: 'string', description: 'Familiar location to use (e.g., "your home", "your workplace")', default: 'your home' }
                },
                required: ['words']
            }
        }
    },
    {
        type: 'function',
        function: {
            name: 'generate_multi_sensory_drill',
            description: 'Create a multi-sensory learning drill that engages visual, auditory, kinesthetic, and motor channels. Especially effective for pronunciation issues.',
            parameters: {
                type: 'object',
                properties: {
                    pt: { type: 'string', description: 'The Portuguese word' },
                    en: { type: 'string', description: 'The English translation' },
                    wordKey: { type: 'string', description: 'Word key for tracking (pt|en format)' },
                    includeAudio: { type: 'boolean', description: 'Play audio as part of the drill', default: true }
                },
                required: ['pt', 'en']
            }
        }
    },
    {
        type: 'function',
        function: {
            name: 'create_minimal_pairs_contrast',
            description: 'Create a minimal pairs exercise comparing two similar/confusing words. Essential for distinguishing words the user frequently mixes up.',
            parameters: {
                type: 'object',
                properties: {
                    word1: { 
                        type: 'object',
                        properties: {
                            pt: { type: 'string' },
                            en: { type: 'string' }
                        },
                        description: 'First word in the pair' 
                    },
                    word2: { 
                        type: 'object',
                        properties: {
                            pt: { type: 'string' },
                            en: { type: 'string' }
                        },
                        description: 'Second word in the pair' 
                    },
                    includeAudio: { type: 'boolean', description: 'Play both words for audio comparison', default: true }
                },
                required: ['word1', 'word2']
            }
        }
    },
    {
        type: 'function',
        function: {
            name: 'generate_context_flood',
            description: 'Generate a request for 10+ example sentences showing a word in varied contexts. Helps solidify meaning and usage patterns.',
            parameters: {
                type: 'object',
                properties: {
                    pt: { type: 'string', description: 'The Portuguese word' },
                    en: { type: 'string', description: 'The English translation' },
                    wordKey: { type: 'string', description: 'Word key for tracking' },
                    count: { type: 'number', description: 'Number of sentences to generate', default: 10 }
                },
                required: ['pt', 'en']
            }
        }
    },
    {
        type: 'function',
        function: {
            name: 'create_stuck_words_rescue_lesson',
            description: `Create a HYBRID lesson that combines the user's requested topic WITH their stuck words. 
This is the KEY tool for smart lesson generation - it finds stuck words RELEVANT to the topic and includes them.
Example: User asks for "numbers lesson" - if they're stuck on "dois" and "três", include those with rescue techniques.`,
            parameters: {
                type: 'object',
                properties: {
                    topic: { type: 'string', description: 'The lesson topic the user requested' },
                    title: { type: 'string', description: 'Lesson title' },
                    description: { type: 'string', description: 'Lesson description' },
                    newWords: {
                        type: 'array',
                        items: {
                            type: 'object',
                            properties: {
                                pt: { type: 'string' },
                                en: { type: 'string' },
                                pronunciation: { type: 'string' },
                                ipa: { type: 'string' },
                                grammarNotes: { type: 'string' },
                                culturalNote: { type: 'string' },
                                aiTip: { type: 'string' },
                                examples: { type: 'array', items: { type: 'object' } }
                            },
                            required: ['pt', 'en']
                        },
                        description: 'New words for the topic'
                    },
                    includeStuckWords: { type: 'boolean', description: 'Whether to find and include relevant stuck words', default: true },
                    maxStuckWords: { type: 'number', description: 'Maximum stuck words to include', default: 3 },
                    difficulty: { type: 'string', enum: ['beginner', 'intermediate', 'advanced'], default: 'beginner' },
                    rescueTechniques: { 
                        type: 'array', 
                        items: { type: 'string', enum: ['keyword_mnemonic', 'memory_palace', 'multi_sensory', 'minimal_pairs', 'context_flood', 'etymology', 'spaced_retrieval'] },
                        description: 'Rescue techniques to focus on for stuck words'
                    }
                },
                required: ['newWords']
            }
        }
    },
    {
        type: 'function',
        function: {
            name: 'record_word_failure',
            description: 'Record when a user fails a word (wrong answer, poor pronunciation). After 3 failures, the word becomes "stuck" and eligible for rescue techniques.',
            parameters: {
                type: 'object',
                properties: {
                    wordKey: { type: 'string', description: 'Word key (pt|en format)' },
                    pt: { type: 'string', description: 'Portuguese word' },
                    en: { type: 'string', description: 'English translation' },
                    failureType: { type: 'string', enum: ['quiz_wrong', 'pronunciation_poor', 'timeout', 'skipped', 'confusion'], description: 'Type of failure' },
                    confusedWith: { type: 'string', description: 'Word it was confused with (if applicable)' },
                    pronunciationScore: { type: 'number', description: 'Pronunciation score 0-100 (if applicable)' },
                    category: { type: 'string', description: 'Word category' }
                },
                required: ['pt', 'en', 'failureType']
            }
        }
    },
    {
        type: 'function',
        function: {
            name: 'get_rescue_techniques',
            description: 'Get recommended rescue techniques for a specific stuck word, based on its failure patterns.',
            parameters: {
                type: 'object',
                properties: {
                    wordKey: { type: 'string', description: 'Word key (pt|en format)' },
                    pt: { type: 'string', description: 'Portuguese word' },
                    en: { type: 'string', description: 'English translation' }
                },
                required: ['pt', 'en']
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
