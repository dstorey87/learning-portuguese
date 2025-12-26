/**
 * AI Service
 * 
 * Provides AI-powered language learning features:
 * - Pronunciation feedback via Ollama
 * - Translation evaluation
 * - Grammar explanations
 * - Study recommendations
 * - Chat interface for tutoring
 * 
 * Uses local Ollama for privacy - no cloud dependency.
 * 
 * @module services/AIService
 */

// ============================================================================
// CONFIGURATION
// ============================================================================

/**
 * AI Service configuration
 */
export const AI_CONFIG = {
    ollamaUrl: 'http://localhost:11434',
    defaultModel: 'qwen2.5:7b',
    fallbackModel: 'llama3.1:8b',
    defaultTemperature: 0.7,
    maxTokens: 200,
    chatMaxTokens: 500,
    timeout: 30000,
    retryAttempts: 2,
    retryDelay: 1000
};

/**
 * AI Provider types
 */
export const AI_PROVIDERS = {
    OLLAMA: 'ollama',
    RULES: 'rules',
    BUILTIN: 'built-in'
};

/**
 * Feedback types
 */
export const FEEDBACK_TYPES = {
    PRONUNCIATION: 'pronunciation',
    TRANSLATION: 'translation',
    GRAMMAR: 'grammar',
    CHAT: 'chat'
};

// ============================================================================
// STATE
// ============================================================================

let state = {
    ollamaAvailable: null,
    availableModels: [],
    selectedModel: AI_CONFIG.defaultModel,
    lastCheck: null,
    isChecking: false
};

// ============================================================================
// OLLAMA CONNECTION
// ============================================================================

/**
 * Check if Ollama is running and get available models
 * @returns {Promise<Object>} Status object
 */
export async function checkOllamaStatus() {
    if (state.isChecking) {
        return { available: state.ollamaAvailable, models: state.availableModels };
    }
    
    state.isChecking = true;
    
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        
        const response = await fetch(`${AI_CONFIG.ollamaUrl}/api/tags`, {
            method: 'GET',
            signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
            state.ollamaAvailable = false;
            state.lastCheck = Date.now();
            state.isChecking = false;
            return { available: false, models: [] };
        }
        
        const data = await response.json();
        state.availableModels = data.models?.map(m => m.name) || [];
        state.ollamaAvailable = state.availableModels.length > 0;
        
        // Select best available model
        if (state.availableModels.includes(AI_CONFIG.defaultModel)) {
            state.selectedModel = AI_CONFIG.defaultModel;
        } else if (state.availableModels.includes(AI_CONFIG.fallbackModel)) {
            state.selectedModel = AI_CONFIG.fallbackModel;
        } else if (state.availableModels.length > 0) {
            state.selectedModel = state.availableModels[0];
        }
        
        state.lastCheck = Date.now();
        state.isChecking = false;
        
        console.log('🤖 Ollama status:', { 
            available: state.ollamaAvailable, 
            models: state.availableModels, 
            selected: state.selectedModel 
        });
        
        return {
            available: state.ollamaAvailable,
            models: state.availableModels,
            selected: state.selectedModel
        };
        
    } catch (error) {
        console.warn('Ollama not available:', error.message);
        state.ollamaAvailable = false;
        state.lastCheck = Date.now();
        state.isChecking = false;
        return { available: false, models: [], error: error.message };
    }
}

/**
 * Get current AI status
 * @returns {Object} Current status
 */
export function getAIStatus() {
    return {
        available: state.ollamaAvailable,
        models: state.availableModels,
        selectedModel: state.selectedModel,
        lastCheck: state.lastCheck,
        provider: state.ollamaAvailable ? AI_PROVIDERS.OLLAMA : AI_PROVIDERS.RULES
    };
}

/**
 * Set the AI model to use
 * @param {string} modelName - Model name
 * @returns {boolean} Success
 */
export function setModel(modelName) {
    if (state.availableModels.includes(modelName)) {
        state.selectedModel = modelName;
        return true;
    }
    return false;
}

// ============================================================================
// OLLAMA API
// ============================================================================

/**
 * Call Ollama API with retry logic
 * @param {string} systemPrompt - System prompt
 * @param {string} userPrompt - User prompt
 * @param {Object} options - Options
 * @returns {Promise<string>} Response text
 */
async function callOllama(systemPrompt, userPrompt, options = {}) {
    const { 
        temperature = AI_CONFIG.defaultTemperature, 
        maxTokens = AI_CONFIG.maxTokens,
        retries = AI_CONFIG.retryAttempts
    } = options;
    
    let lastError = null;
    
    for (let attempt = 0; attempt <= retries; attempt++) {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), AI_CONFIG.timeout);
            
            const response = await fetch(`${AI_CONFIG.ollamaUrl}/api/generate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                signal: controller.signal,
                body: JSON.stringify({
                    model: state.selectedModel,
                    prompt: userPrompt,
                    system: systemPrompt,
                    stream: false,
                    options: {
                        temperature,
                        num_predict: maxTokens
                    }
                })
            });
            
            clearTimeout(timeoutId);
            
            if (!response.ok) {
                throw new Error(`Ollama API error: ${response.status}`);
            }
            
            const data = await response.json();
            return data.response?.trim() || '';
            
        } catch (error) {
            lastError = error;
            if (attempt < retries) {
                await new Promise(r => setTimeout(r, AI_CONFIG.retryDelay * (attempt + 1)));
            }
        }
    }
    
    throw lastError;
}

/**
 * Stream response from Ollama
 * @param {string} systemPrompt - System prompt
 * @param {string} userPrompt - User prompt  
 * @param {Function} onToken - Callback for each token
 * @param {Object} options - Options
 * @returns {Promise<string>} Full response
 */
export async function streamOllama(systemPrompt, userPrompt, onToken, options = {}) {
    const { 
        temperature = AI_CONFIG.defaultTemperature, 
        maxTokens = AI_CONFIG.chatMaxTokens 
    } = options;
    
    const response = await fetch(`${AI_CONFIG.ollamaUrl}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            model: state.selectedModel,
            prompt: userPrompt,
            system: systemPrompt,
            stream: true,
            options: {
                temperature,
                num_predict: maxTokens
            }
        })
    });
    
    if (!response.ok) {
        throw new Error(`Ollama API error: ${response.status}`);
    }
    
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullResponse = '';
    let done = false;
    
    while (!done) {
        const result = await reader.read();
        done = result.done;
        
        if (result.value) {
            const chunk = decoder.decode(result.value);
            const lines = chunk.split('\n').filter(Boolean);
            
            for (const line of lines) {
                try {
                    const data = JSON.parse(line);
                    if (data.response) {
                        fullResponse += data.response;
                        if (onToken) onToken(data.response);
                    }
                } catch {
                    // Skip invalid JSON lines
                }
            }
        }
    }
    
    return fullResponse;
}

// ============================================================================
// PRONUNCIATION FEEDBACK
// ============================================================================

/**
 * System prompt for pronunciation feedback
 */
const PRONUNCIATION_SYSTEM_PROMPT = `You are a strict but fair Portuguese language teacher. Your job is to give HONEST feedback on pronunciation attempts. 

RULES:
1. Never give false praise. If the student made mistakes, tell them clearly.
2. Be specific about what was wrong and how to fix it.
3. If the score is below 70%, be direct that they need more practice.
4. Mention specific Portuguese sounds they need to work on (nasal vowels, 'ão', 'lh', 'nh', etc.)
5. Keep feedback concise - 2-3 sentences maximum.
6. End with one specific thing to practice.

You respond in English, but reference Portuguese words when explaining pronunciation issues.`;

/**
 * Get feedback on pronunciation attempt
 * @param {Object} attempt - Pronunciation attempt data
 * @returns {Promise<Object>} Feedback
 */
export async function getPronunciationFeedback(attempt) {
    const { expected, transcribed, score, missedWords = [], matchedWords = [] } = attempt;
    
    if (!state.ollamaAvailable) {
        return getRuleBasedPronunciationFeedback(attempt);
    }
    
    const userPrompt = `Student tried to say: "${expected}"
They actually said: "${transcribed}"
Automatic score: ${score}%
Matched words: ${matchedWords.join(', ') || 'none'}
Missed words: ${missedWords.join(', ') || 'none'}

Give honest feedback. Do NOT be overly encouraging if they made significant mistakes.`;

    try {
        const response = await callOllama(PRONUNCIATION_SYSTEM_PROMPT, userPrompt);
        
        return {
            feedback: response,
            source: AI_PROVIDERS.OLLAMA,
            model: state.selectedModel,
            type: FEEDBACK_TYPES.PRONUNCIATION,
            timestamp: Date.now()
        };
        
    } catch (error) {
        console.warn('Ollama feedback failed, using rules:', error);
        return getRuleBasedPronunciationFeedback(attempt);
    }
}

/**
 * Rule-based pronunciation feedback
 * @param {Object} attempt - Attempt data
 * @returns {Object} Feedback
 */
function getRuleBasedPronunciationFeedback(attempt) {
    const { expected, score, missedWords = [] } = attempt;
    
    let feedback = '';
    const tips = [];
    
    if (score >= 90) {
        feedback = 'Good pronunciation! Your speech was clear.';
    } else if (score >= 70) {
        feedback = 'Decent attempt, but some words need work.';
        if (missedWords.length > 0) {
            feedback += ` Focus on: ${missedWords.slice(0, 2).join(', ')}.`;
        }
    } else if (score >= 50) {
        feedback = 'This needs more practice. Several words were unclear or missing.';
    } else {
        feedback = 'Let\'s try again more slowly. The pronunciation was quite different from the target.';
    }
    
    const hasNasalVowels = /[ãõ]|ão|ãe|õe/i.test(expected);
    const hasLH = /lh/i.test(expected);
    const hasNH = /nh/i.test(expected);
    
    if (hasNasalVowels && score < 80) {
        tips.push('Practice nasal vowels (ão, ãe). They should resonate in your nose.');
    }
    if (hasLH && score < 80) {
        tips.push('The "lh" sound is like "li" in "million".');
    }
    if (hasNH && score < 80) {
        tips.push('The "nh" sound is like "ny" in "canyon".');
    }
    if (score < 70) {
        tips.push('Try listening to the audio 2-3 times before speaking.');
    }
    
    return {
        feedback,
        tips,
        source: AI_PROVIDERS.RULES,
        type: FEEDBACK_TYPES.PRONUNCIATION,
        isHonest: true,
        timestamp: Date.now()
    };
}

// ============================================================================
// TRANSLATION FEEDBACK
// ============================================================================

/**
 * System prompt for translation feedback
 */
const TRANSLATION_SYSTEM_PROMPT = `You are a Portuguese language teacher evaluating translations from English to European Portuguese (PT-PT, not Brazilian).

RULES:
1. Point out grammatical errors directly.
2. Note if they used Brazilian Portuguese instead of European Portuguese.
3. Explain gender agreement issues (o/a endings).
4. Note verb conjugation mistakes.
5. Be honest - if it's wrong, say so clearly.
6. Keep feedback to 2-3 sentences.`;

/**
 * Get feedback on translation attempt
 * @param {Object} attempt - Translation attempt
 * @returns {Promise<Object>} Feedback
 */
export async function getTranslationFeedback(attempt) {
    const { original, userTranslation, correctTranslation } = attempt;
    
    if (!state.ollamaAvailable) {
        return getRuleBasedTranslationFeedback(attempt);
    }
    
    const userPrompt = `Original English: "${original}"
Student's translation: "${userTranslation}"
Correct translation: "${correctTranslation}"

Evaluate their translation honestly. Point out specific errors.`;

    try {
        const response = await callOllama(TRANSLATION_SYSTEM_PROMPT, userPrompt);
        
        return {
            feedback: response,
            source: AI_PROVIDERS.OLLAMA,
            model: state.selectedModel,
            type: FEEDBACK_TYPES.TRANSLATION,
            timestamp: Date.now()
        };
        
    } catch (error) {
        return getRuleBasedTranslationFeedback(attempt);
    }
}

/**
 * Rule-based translation feedback
 */
function getRuleBasedTranslationFeedback(attempt) {
    const { userTranslation, correctTranslation } = attempt;
    
    const userNorm = userTranslation.toLowerCase().trim();
    const correctNorm = correctTranslation.toLowerCase().trim();
    
    if (userNorm === correctNorm) {
        return {
            feedback: 'Correct! Your translation matches.',
            source: AI_PROVIDERS.RULES,
            type: FEEDBACK_TYPES.TRANSLATION,
            correct: true,
            timestamp: Date.now()
        };
    }
    
    let feedback = 'Your translation differs from the expected answer.';
    const tips = [];
    
    if (userNorm.includes('você') && correctNorm.includes('tu')) {
        tips.push('In Portugal, "tu" is more common than "você" for informal speech.');
    }
    if (userNorm.includes('a gente') && correctNorm.includes('nós')) {
        tips.push('"A gente" is more Brazilian. Use "nós" for European Portuguese.');
    }
    
    const genderPairs = [['o', 'a'], ['um', 'uma'], ['ele', 'ela']];
    genderPairs.forEach(([masc]) => {
        if (userNorm.includes(masc) !== correctNorm.includes(masc)) {
            tips.push('Check gender agreement in your nouns and articles.');
        }
    });
    
    return {
        feedback,
        tips,
        expected: correctTranslation,
        source: AI_PROVIDERS.RULES,
        type: FEEDBACK_TYPES.TRANSLATION,
        correct: false,
        timestamp: Date.now()
    };
}

// ============================================================================
// GRAMMAR HELP
// ============================================================================

/**
 * Built-in grammar explanations
 */
const GRAMMAR_RULES = {
    'ser_estar': {
        title: 'Ser vs. Estar',
        explanation: 'SER is for permanent characteristics (Eu sou professor = I am a teacher). ESTAR is for temporary states or locations (Eu estou cansado = I am tired, Ela está em casa = She is at home).',
        examples: ['Eu sou português (permanent identity)', 'Eu estou feliz (temporary feeling)']
    },
    'por_para': {
        title: 'Por vs. Para',
        explanation: 'POR expresses cause, exchange, or movement through (Obrigado por ajudar = Thanks for helping). PARA expresses purpose or destination (Isto é para ti = This is for you).',
        examples: ['Vou por Lisboa (through Lisbon)', 'Vou para Lisboa (to Lisbon)']
    },
    'gender': {
        title: 'Gender Agreement',
        explanation: 'Portuguese nouns are masculine or feminine. Adjectives must agree: o gato preto (black cat, masc), a casa branca (white house, fem). Even "thank you" changes: obrigado (if you\'re male), obrigada (if you\'re female).',
        examples: ['O livro novo (new book, masc)', 'A cadeira nova (new chair, fem)']
    },
    'nasal_vowels': {
        title: 'Nasal Vowels',
        explanation: 'Portuguese has nasal vowels marked with til (~) or followed by m/n. Let air pass through your nose: pão (bread), mãe (mother), não (no). Practice by holding your nose - you should feel vibration.',
        examples: ['pão [powng]', 'coração [koo-rah-sowng]', 'bem [bayng]']
    },
    'articles': {
        title: 'Definite & Indefinite Articles',
        explanation: 'Definite articles: o (masc sing), a (fem sing), os (masc pl), as (fem pl). Indefinite: um, uma, uns, umas. Portuguese uses articles more than English - "o João" (the João) is normal.',
        examples: ['O livro (the book)', 'Uma casa (a house)', 'Os gatos (the cats)']
    },
    'pronouns': {
        title: 'Personal Pronouns',
        explanation: 'Subject pronouns: eu (I), tu (you informal), você (you formal), ele/ela (he/she), nós (we), eles/elas (they). In Portugal, "tu" is common among friends; "você" is more formal.',
        examples: ['Eu sou (I am)', 'Tu és (you are)', 'Nós somos (we are)']
    }
};

/**
 * Get grammar explanation
 * @param {string} topic - Grammar topic
 * @param {string} context - Optional context
 * @returns {Promise<Object>} Explanation
 */
export async function getGrammarHelp(topic, context = '') {
    if (!state.ollamaAvailable) {
        return getBuiltInGrammarHelp(topic);
    }
    
    const systemPrompt = `You are a Portuguese language teacher explaining European Portuguese (PT-PT) grammar. Be clear and concise. Use examples. Keep explanations under 100 words.`;
    
    const userPrompt = `Explain this Portuguese grammar topic: ${topic}
${context ? `Context: ${context}` : ''}

Give a clear, brief explanation with 1-2 examples.`;

    try {
        const response = await callOllama(systemPrompt, userPrompt);
        return { 
            explanation: response, 
            source: AI_PROVIDERS.OLLAMA,
            type: FEEDBACK_TYPES.GRAMMAR,
            timestamp: Date.now()
        };
    } catch (error) {
        return getBuiltInGrammarHelp(topic);
    }
}

/**
 * Get built-in grammar help
 */
function getBuiltInGrammarHelp(topic) {
    const key = topic.toLowerCase().replace(/[^a-z_]/g, '');
    const rule = GRAMMAR_RULES[key] || GRAMMAR_RULES['ser_estar'];
    
    return {
        ...rule,
        source: AI_PROVIDERS.BUILTIN,
        type: FEEDBACK_TYPES.GRAMMAR,
        timestamp: Date.now()
    };
}

/**
 * Get all available grammar topics
 * @returns {Array} Grammar topics
 */
export function getGrammarTopics() {
    return Object.entries(GRAMMAR_RULES).map(([id, rule]) => ({
        id,
        title: rule.title
    }));
}

// ============================================================================
// STUDY RECOMMENDATIONS
// ============================================================================

/**
 * Analyze mistake patterns
 * @param {Array} mistakes - User mistakes
 * @returns {Object} Pattern analysis
 */
function analyzeMistakePatterns(mistakes) {
    let nasalErrors = 0;
    let genderErrors = 0;
    let verbErrors = 0;
    
    mistakes.forEach(mistake => {
        const word = (mistake.pt || '').toLowerCase();
        
        if (/[ãõ]|ão|ãe|õe/.test(word)) nasalErrors++;
        if (/obrigad[oa]|bonit[oa]|pront[oa]/.test(word)) genderErrors++;
        if (/estou|sou|tenho|vou/.test(word)) verbErrors++;
    });
    
    return { nasalErrors, genderErrors, verbErrors };
}

/**
 * Generate study recommendations
 * @param {Object} userData - User learning data
 * @returns {Array} Recommendations
 */
export function getStudyRecommendations(userData) {
    const { mistakes = [], learnedWords = [], lessonAccuracy = [] } = userData;
    
    const recommendations = [];
    const mistakePatterns = analyzeMistakePatterns(mistakes);
    
    if (mistakePatterns.nasalErrors > 2) {
        recommendations.push({
            priority: 'high',
            area: 'Nasal Vowels',
            suggestion: 'Practice words with ão, ãe, õe. Record yourself and compare to native audio.',
            practice: ['pão', 'mãe', 'não', 'coração']
        });
    }
    
    if (mistakePatterns.genderErrors > 2) {
        recommendations.push({
            priority: 'high',
            area: 'Gender Agreement',
            suggestion: 'Review masculine/feminine noun endings. Most -o words are masculine, most -a words are feminine.',
            practice: ['o livro / a casa', 'bonito / bonita', 'obrigado / obrigada']
        });
    }
    
    const avgAccuracy = lessonAccuracy.length > 0 
        ? lessonAccuracy.reduce((a, b) => a + b, 0) / lessonAccuracy.length 
        : 0;
    
    if (avgAccuracy < 60) {
        recommendations.push({
            priority: 'medium',
            area: 'Review Basics',
            suggestion: 'Your accuracy is below 60%. Consider reviewing earlier lessons before moving forward.'
        });
    }
    
    if (learnedWords.length < 50) {
        recommendations.push({
            priority: 'medium',
            area: 'Vocabulary Building',
            suggestion: `You have ${learnedWords.length} words. Aim for 50+ words before focusing on conversation practice.`
        });
    }
    
    return recommendations;
}

// ============================================================================
// CHAT INTERFACE
// ============================================================================

/**
 * Chat system prompt
 */
const CHAT_SYSTEM_PROMPT = `You are a helpful Portuguese language tutor who specializes in European Portuguese (PT-PT). 

Guidelines:
1. Answer questions about Portuguese grammar, vocabulary, and culture
2. Correct mistakes kindly but clearly
3. Provide examples in Portuguese with English translations
4. When teaching new words, include pronunciation hints
5. Keep responses concise and focused
6. If asked to practice conversation, respond naturally in Portuguese with an English translation

Always distinguish between European Portuguese (Portugal) and Brazilian Portuguese when relevant.`;

/**
 * Chat with AI tutor
 * @param {string} message - User message
 * @param {Array} history - Chat history
 * @returns {Promise<Object>} Response
 */
export async function chat(message, history = []) {
    if (!state.ollamaAvailable) {
        return {
            response: "I'm sorry, the AI tutor is currently unavailable. Please check if Ollama is running.",
            source: AI_PROVIDERS.RULES,
            available: false,
            timestamp: Date.now()
        };
    }
    
    // Build context from history
    let contextPrompt = '';
    if (history.length > 0) {
        const recent = history.slice(-6); // Last 3 exchanges
        contextPrompt = 'Previous conversation:\n' + 
            recent.map(h => `${h.role}: ${h.content}`).join('\n') + '\n\n';
    }
    
    const userPrompt = contextPrompt + `Student: ${message}\n\nRespond helpfully:`;
    
    try {
        const response = await callOllama(
            CHAT_SYSTEM_PROMPT, 
            userPrompt,
            { maxTokens: AI_CONFIG.chatMaxTokens }
        );
        
        return {
            response,
            source: AI_PROVIDERS.OLLAMA,
            model: state.selectedModel,
            type: FEEDBACK_TYPES.CHAT,
            timestamp: Date.now()
        };
        
    } catch (error) {
        console.error('Chat error:', error);
        return {
            response: "I'm having trouble responding right now. Please try again.",
            source: AI_PROVIDERS.RULES,
            error: error.message,
            timestamp: Date.now()
        };
    }
}

/**
 * Stream chat response
 * @param {string} message - User message
 * @param {Function} onToken - Token callback
 * @param {Array} history - Chat history
 * @returns {Promise<string>} Full response
 */
export async function streamChat(message, onToken, history = []) {
    if (!state.ollamaAvailable) {
        const fallback = "AI tutor unavailable. Check if Ollama is running.";
        if (onToken) onToken(fallback);
        return fallback;
    }
    
    let contextPrompt = '';
    if (history.length > 0) {
        const recent = history.slice(-6);
        contextPrompt = 'Previous conversation:\n' + 
            recent.map(h => `${h.role}: ${h.content}`).join('\n') + '\n\n';
    }
    
    const userPrompt = contextPrompt + `Student: ${message}\n\nRespond helpfully:`;
    
    return streamOllama(CHAT_SYSTEM_PROMPT, userPrompt, onToken, {
        maxTokens: AI_CONFIG.chatMaxTokens
    });
}

// ============================================================================
// INITIALIZATION
// ============================================================================

/**
 * Initialize AI service
 * @returns {Promise<Object>} Init status
 */
export async function initAIService() {
    const status = await checkOllamaStatus();
    return {
        ...status,
        initialized: true,
        timestamp: Date.now()
    };
}

// Auto-initialize
checkOllamaStatus().catch(() => {});

// ============================================================================
// DEFAULT EXPORT
// ============================================================================

export default {
    // Config
    AI_CONFIG,
    AI_PROVIDERS,
    FEEDBACK_TYPES,
    
    // Status
    checkOllamaStatus,
    getAIStatus,
    setModel,
    initAIService,
    
    // Feedback
    getPronunciationFeedback,
    getTranslationFeedback,
    
    // Grammar
    getGrammarHelp,
    getGrammarTopics,
    
    // Recommendations
    getStudyRecommendations,
    
    // Chat
    chat,
    streamChat,
    streamOllama
};
