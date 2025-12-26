/**
 * AI Tutor - Honest Language Learning Feedback
 * 
 * Provides truthful feedback on pronunciation and language practice.
 * Uses Ollama locally for privacy and honesty - no cloud dependency.
 * 
 * Philosophy: A good teacher is honest, not falsely encouraging.
 * We tell learners exactly what they need to improve.
 */

// Ollama configuration
const OLLAMA_URL = 'http://localhost:11434';
const DEFAULT_MODEL = 'qwen2.5:7b'; // Good balance of speed and quality
const FALLBACK_MODEL = 'llama3.1:8b';

// State
let ollamaAvailable = null;
let availableModels = [];
let selectedModel = DEFAULT_MODEL;

/**
 * Check if Ollama is running and get available models
 */
export async function checkOllamaStatus() {
    try {
        const response = await fetch(`${OLLAMA_URL}/api/tags`, {
            method: 'GET'
        });
        
        if (!response.ok) {
            ollamaAvailable = false;
            return { available: false, models: [] };
        }
        
        const data = await response.json();
        availableModels = data.models?.map(m => m.name) || [];
        ollamaAvailable = availableModels.length > 0;
        
        // Select best available model
        if (availableModels.includes(DEFAULT_MODEL)) {
            selectedModel = DEFAULT_MODEL;
        } else if (availableModels.includes(FALLBACK_MODEL)) {
            selectedModel = FALLBACK_MODEL;
        } else if (availableModels.length > 0) {
            selectedModel = availableModels[0];
        }
        
        console.log('🤖 Ollama status:', { available: ollamaAvailable, models: availableModels, selected: selectedModel });
        
        return {
            available: ollamaAvailable,
            models: availableModels,
            selected: selectedModel
        };
        
    } catch (error) {
        console.warn('Ollama not available:', error.message);
        ollamaAvailable = false;
        return { available: false, models: [], error: error.message };
    }
}

/**
 * Get honest feedback on pronunciation attempt
 * @param {Object} attempt - Pronunciation attempt data
 * @param {string} attempt.expected - What they should have said
 * @param {string} attempt.transcribed - What they actually said
 * @param {number} attempt.score - Automatic score (0-100)
 * @param {string[]} attempt.missedWords - Words that weren't matched
 * @returns {Promise<Object>} Detailed, honest feedback
 */
export async function getPronunciationFeedback(attempt) {
    const { expected, transcribed, score, missedWords = [], matchedWords = [] } = attempt;
    
    // If Ollama not available, use rule-based feedback
    if (!ollamaAvailable) {
        return getRuleBasedFeedback(attempt);
    }
    
    const systemPrompt = `You are a strict but fair Portuguese language teacher. Your job is to give HONEST feedback on pronunciation attempts. 

RULES:
1. Never give false praise. If the student made mistakes, tell them clearly.
2. Be specific about what was wrong and how to fix it.
3. If the score is below 70%, be direct that they need more practice.
4. Mention specific Portuguese sounds they need to work on (nasal vowels, 'ão', 'lh', 'nh', etc.)
5. Keep feedback concise - 2-3 sentences maximum.
6. End with one specific thing to practice.

You respond in English, but reference Portuguese words when explaining pronunciation issues.`;

    const userPrompt = `Student tried to say: "${expected}"
They actually said: "${transcribed}"
Automatic score: ${score}%
Matched words: ${matchedWords.join(', ') || 'none'}
Missed words: ${missedWords.join(', ') || 'none'}

Give honest feedback. Do NOT be overly encouraging if they made significant mistakes.`;

    try {
        const response = await callOllama(systemPrompt, userPrompt);
        
        return {
            feedback: response,
            source: 'ollama',
            model: selectedModel,
            timestamp: Date.now()
        };
        
    } catch (error) {
        console.warn('Ollama feedback failed, using rules:', error);
        return getRuleBasedFeedback(attempt);
    }
}

/**
 * Get feedback on a translation or sentence construction
 */
export async function getTranslationFeedback(attempt) {
    const { original, userTranslation, correctTranslation } = attempt;
    
    if (!ollamaAvailable) {
        return getRuleBasedTranslationFeedback(attempt);
    }
    
    const systemPrompt = `You are a Portuguese language teacher evaluating translations from English to European Portuguese (PT-PT, not Brazilian).

RULES:
1. Point out grammatical errors directly.
2. Note if they used Brazilian Portuguese instead of European Portuguese.
3. Explain gender agreement issues (o/a endings).
4. Note verb conjugation mistakes.
5. Be honest - if it's wrong, say so clearly.
6. Keep feedback to 2-3 sentences.`;

    const userPrompt = `Original English: "${original}"
Student's translation: "${userTranslation}"
Correct translation: "${correctTranslation}"

Evaluate their translation honestly. Point out specific errors.`;

    try {
        const response = await callOllama(systemPrompt, userPrompt);
        
        return {
            feedback: response,
            source: 'ollama',
            model: selectedModel
        };
        
    } catch (error) {
        return getRuleBasedTranslationFeedback(attempt);
    }
}

/**
 * Get a grammar explanation
 */
export async function getGrammarHelp(topic, context = '') {
    if (!ollamaAvailable) {
        return getBuiltInGrammarHelp(topic);
    }
    
    const systemPrompt = `You are a Portuguese language teacher explaining European Portuguese (PT-PT) grammar. Be clear and concise. Use examples. Keep explanations under 100 words.`;
    
    const userPrompt = `Explain this Portuguese grammar topic: ${topic}
${context ? `Context: ${context}` : ''}

Give a clear, brief explanation with 1-2 examples.`;

    try {
        const response = await callOllama(systemPrompt, userPrompt);
        return { explanation: response, source: 'ollama' };
    } catch (error) {
        return getBuiltInGrammarHelp(topic);
    }
}

/**
 * Call Ollama API
 */
async function callOllama(systemPrompt, userPrompt, options = {}) {
    const { temperature = 0.7, maxTokens = 200 } = options;
    
    const response = await fetch(`${OLLAMA_URL}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            model: selectedModel,
            prompt: userPrompt,
            system: systemPrompt,
            stream: false,
            options: {
                temperature,
                num_predict: maxTokens
            }
        })
    });
    
    if (!response.ok) {
        throw new Error(`Ollama API error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.response?.trim() || '';
}

/**
 * Rule-based feedback when Ollama not available
 */
function getRuleBasedFeedback(attempt) {
    const { expected, score, missedWords = [] } = attempt;
    
    let feedback = '';
    let tips = [];
    
    // Score-based response
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
    
    // Check for common Portuguese sounds
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
    
    // Add practice suggestion
    if (score < 70) {
        tips.push('Try listening to the audio 2-3 times before speaking.');
    }
    
    return {
        feedback,
        tips,
        source: 'rules',
        isHonest: true
    };
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
            source: 'rules',
            correct: true
        };
    }
    
    let feedback = 'Your translation differs from the expected answer.';
    const tips = [];
    
    // Check for common issues
    if (userNorm.includes('você') && correctNorm.includes('tu')) {
        tips.push('In Portugal, "tu" is more common than "você" for informal speech.');
    }
    
    if (userNorm.includes('a gente') && correctNorm.includes('nós')) {
        tips.push('"A gente" is more Brazilian. Use "nós" for European Portuguese.');
    }
    
    // Gender check
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
        source: 'rules',
        correct: false
    };
}

/**
 * Built-in grammar explanations
 */
function getBuiltInGrammarHelp(topic) {
    const grammarRules = {
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
        }
    };
    
    const key = topic.toLowerCase().replace(/[^a-z_]/g, '');
    const rule = grammarRules[key] || grammarRules['ser_estar'];
    
    return {
        ...rule,
        source: 'built-in'
    };
}

/**
 * Generate study recommendations based on user performance
 */
export function getStudyRecommendations(userData) {
    const { mistakes = [], learnedWords = [], lessonAccuracy = [] } = userData;
    
    const recommendations = [];
    
    // Analyze mistakes
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
    
    // Check overall accuracy
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
    
    // Vocabulary size check
    if (learnedWords.length < 50) {
        recommendations.push({
            priority: 'medium',
            area: 'Vocabulary Building',
            suggestion: `You have ${learnedWords.length} words. Aim for 50+ words before focusing on conversation practice.`
        });
    }
    
    return recommendations;
}

/**
 * Analyze patterns in user mistakes
 */
function analyzeMistakePatterns(mistakes) {
    let nasalErrors = 0;
    let genderErrors = 0;
    let verbErrors = 0;
    
    mistakes.forEach(mistake => {
        const word = (mistake.pt || '').toLowerCase();
        // Context could be used for more targeted tips in the future
        
        if (/[ãõ]|ão|ãe|õe/.test(word)) nasalErrors++;
        if (/obrigad[oa]|bonit[oa]|pront[oa]/.test(word)) genderErrors++;
        if (/estou|sou|tenho|vou/.test(word)) verbErrors++;
    });
    
    return { nasalErrors, genderErrors, verbErrors };
}

// Initialize on load
checkOllamaStatus().catch(() => {});

// Export
export default {
    checkOllamaStatus,
    getPronunciationFeedback,
    getTranslationFeedback,
    getGrammarHelp,
    getStudyRecommendations,
    OLLAMA_URL,
    DEFAULT_MODEL
};
