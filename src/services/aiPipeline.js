/**
 * AI Pipeline Service
 * Manages communication with Ollama and processes learning data
 */

import { AI_CONFIG, API_ENDPOINTS } from '../config/constants.js';
import { userStorage } from './userStorage.js';
import { eventStream } from './eventStreaming.js';

class AIPipelineService {
    constructor() {
        this.isAvailable = false;
        this.lastCheck = null;
        this.memoryCache = new Map();
        
        // Subscribe to event batches
        window.addEventListener('ai-event-batch', (e) => {
            this.processEventBatch(e.detail.events);
        });
    }

    /**
     * Check if Ollama is available
     */
    async checkAvailability() {
        try {
            const response = await fetch(`${API_ENDPOINTS.ollama}/api/tags`, {
                method: 'GET',
                signal: AbortSignal.timeout(5000),
            });
            this.isAvailable = response.ok;
            this.lastCheck = Date.now();
            return this.isAvailable;
        } catch (error) {
            console.warn('[AI Pipeline] Ollama not available:', error.message);
            this.isAvailable = false;
            this.lastCheck = Date.now();
            return false;
        }
    }

    /**
     * Get AI status for monitoring
     */
    getStatus() {
        return {
            available: this.isAvailable,
            lastCheck: this.lastCheck,
            model: AI_CONFIG.model,
            endpoint: API_ENDPOINTS.ollama,
        };
    }

    /**
     * Process a batch of user events
     */
    async processEventBatch(events) {
        if (!this.isAvailable) {
            console.log('[AI Pipeline] Skipping batch - AI unavailable');
            return;
        }

        // Analyze events for patterns
        const analysis = this._analyzeEvents(events);
        
        // Update user learning profile
        this._updateLearningProfile(analysis);
        
        // Check if custom lesson needed
        if (analysis.strugglingWords.length > 0) {
            await this._checkForCustomLesson(analysis.strugglingWords);
        }
    }

    /**
     * Generate a tip for a specific word
     */
    async generateTip(wordId, wordData) {
        if (!this.isAvailable) {
            return this._getFallbackTip(wordId);
        }

        const learningData = this._getUserLearningData();
        const previousTips = userStorage.get('aiTips') || [];
        
        const prompt = this._buildTipPrompt(wordData, learningData, previousTips);
        
        try {
            const response = await this._queryOllama(prompt);
            const tip = this._parseTipResponse(response);
            
            // Save tip to prevent repetition
            previousTips.push({ wordId, tip, timestamp: Date.now() });
            userStorage.set('aiTips', previousTips.slice(-100));
            
            return tip;
        } catch (error) {
            console.error('[AI Pipeline] Tip generation failed:', error);
            return this._getFallbackTip(wordId);
        }
    }

    /**
     * Chat with AI tutor
     */
    async chat(message, context = {}) {
        if (!this.isAvailable) {
            return {
                success: false,
                message: 'AI tutor is temporarily unavailable. Please try again later.',
            };
        }

        const chatHistory = userStorage.get('aiChat') || [];
        const learningData = this._getUserLearningData();
        
        const systemPrompt = this._buildChatSystemPrompt(learningData);
        const messages = this._buildChatMessages(chatHistory, message, systemPrompt);
        
        try {
            const response = await this._queryOllama(messages, true);
            
            // Save to chat history
            chatHistory.push({ role: 'user', content: message, timestamp: Date.now() });
            chatHistory.push({ role: 'assistant', content: response, timestamp: Date.now() });
            userStorage.set('aiChat', chatHistory.slice(-50));
            
            return {
                success: true,
                message: response,
            };
        } catch (error) {
            console.error('[AI Pipeline] Chat failed:', error);
            return {
                success: false,
                message: 'Sorry, I had trouble responding. Please try again.',
            };
        }
    }

    /**
     * Generate a custom mini-lesson for struggling concepts
     */
    async generateCustomLesson(wordIds) {
        if (!this.isAvailable) {
            return null;
        }

        const learningData = this._getUserLearningData();
        const words = wordIds.map(id => this._getWordData(id)).filter(Boolean);
        
        const prompt = this._buildCustomLessonPrompt(words, learningData);
        
        try {
            const response = await this._queryOllama(prompt);
            const lesson = this._parseCustomLessonResponse(response);
            
            return lesson;
        } catch (error) {
            console.error('[AI Pipeline] Custom lesson generation failed:', error);
            return null;
        }
    }

    // === Private methods ===

    async _queryOllama(prompt, isChat = false) {
        const endpoint = isChat 
            ? `${API_ENDPOINTS.ollama}/api/chat`
            : `${API_ENDPOINTS.ollama}/api/generate`;
        
        const body = isChat 
            ? { model: AI_CONFIG.model, messages: prompt, stream: false }
            : { 
                model: AI_CONFIG.model, 
                prompt, 
                stream: false,
                options: {
                    temperature: AI_CONFIG.temperature,
                    top_p: AI_CONFIG.topP,
                    num_predict: AI_CONFIG.maxTokens,
                    repeat_penalty: AI_CONFIG.repeatPenalty,
                }
            };
        
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
            signal: AbortSignal.timeout(AI_CONFIG.timeout),
        });
        
        if (!response.ok) {
            throw new Error(`Ollama request failed: ${response.status}`);
        }
        
        const data = await response.json();
        return isChat ? data.message?.content : data.response;
    }

    _analyzeEvents(events) {
        const wordAttempts = {};
        const pronunciationScores = {};
        
        events.forEach(event => {
            if (event.eventType === 'word_attempt') {
                const wordId = event.data.wordId;
                if (!wordAttempts[wordId]) {
                    wordAttempts[wordId] = { correct: 0, incorrect: 0 };
                }
                if (event.data.correct) {
                    wordAttempts[wordId].correct++;
                } else {
                    wordAttempts[wordId].incorrect++;
                }
            }
            
            if (event.eventType === 'pronunciation') {
                const wordId = event.data.wordId;
                if (!pronunciationScores[wordId]) {
                    pronunciationScores[wordId] = [];
                }
                pronunciationScores[wordId].push(event.data.score);
            }
        });
        
        // Identify struggling words
        const strugglingWords = Object.entries(wordAttempts)
            .filter(([_, data]) => data.incorrect >= 5)
            .map(([wordId]) => wordId);
        
        return {
            wordAttempts,
            pronunciationScores,
            strugglingWords,
        };
    }

    _updateLearningProfile(analysis) {
        const profile = userStorage.get('learning') || {
            weakWords: [],
            strongWords: [],
            averagePronunciation: 0,
            totalAttempts: 0,
        };
        
        // Update weak words
        analysis.strugglingWords.forEach(wordId => {
            if (!profile.weakWords.includes(wordId)) {
                profile.weakWords.push(wordId);
            }
        });
        
        userStorage.set('learning', profile);
    }

    async _checkForCustomLesson(strugglingWords) {
        // Check if we've already offered a custom lesson for these words
        const offeredLessons = userStorage.get('customLessonsOffered') || [];
        const newStruggles = strugglingWords.filter(w => !offeredLessons.includes(w));
        
        if (newStruggles.length > 0) {
            console.log('[AI Pipeline] Triggering custom lesson for:', newStruggles);
            window.dispatchEvent(new CustomEvent('ai-custom-lesson-needed', {
                detail: { wordIds: newStruggles }
            }));
            
            // Mark as offered
            offeredLessons.push(...newStruggles);
            userStorage.set('customLessonsOffered', offeredLessons);
        }
    }

    _getUserLearningData() {
        return {
            profile: userStorage.get('learning') || {},
            recentEvents: (userStorage.get('events') || []).slice(-100),
            progress: userStorage.get('progress') || {},
        };
    }

    _getWordData(wordId) {
        // Will be connected to data module
        return window.wordDatabase?.[wordId] || null;
    }

    _buildTipPrompt(wordData, learningData, previousTips) {
        return `ROLE: You are a Portuguese language tutor specializing in European Portuguese.

CONTEXT:
- User struggles with: ${learningData.profile.weakWords?.join(', ') || 'none identified'}
- Previous tips given: ${previousTips.length}

TASK: Generate a memorable tip for the Portuguese word "${wordData.word}".
- Meaning: ${wordData.meaning}
- Pronunciation: ${wordData.pronunciation}

FORMAT:
- Start with the Portuguese word in bold
- Include a memorable mnemonic (use humor, visuals, or stories)
- Keep under 100 words

CONSTRAINTS:
- ONLY European Portuguese, never Brazilian
- Don't repeat tips already given`;
    }

    _buildChatSystemPrompt(learningData) {
        return `You are PortuLingo's AI tutor, specializing in European Portuguese (PT-PT).
        
User Learning Profile:
- Weak areas: ${learningData.profile.weakWords?.join(', ') || 'none identified'}
- Total attempts: ${learningData.profile.totalAttempts || 0}

Guidelines:
- Always use European Portuguese, never Brazilian
- Be encouraging but honest
- Keep responses concise
- Use IPA for pronunciation when helpful`;
    }

    _buildChatMessages(history, newMessage, systemPrompt) {
        const messages = [{ role: 'system', content: systemPrompt }];
        
        // Add recent history
        history.slice(-10).forEach(msg => {
            messages.push({ role: msg.role, content: msg.content });
        });
        
        messages.push({ role: 'user', content: newMessage });
        
        return messages;
    }

    _buildCustomLessonPrompt(words, learningData) {
        return `Create a custom mini-lesson for a user struggling with these Portuguese words:
${words.map(w => `- ${w.word}: ${w.meaning}`).join('\n')}

The lesson should:
1. Explain common patterns or connections between the words
2. Provide memorable mnemonics
3. Include 2-3 practice sentences
4. Be under 300 words

User has failed these words 5+ times.`;
    }

    _parseTipResponse(response) {
        return response.trim();
    }

    _parseCustomLessonResponse(response) {
        return {
            content: response.trim(),
            createdAt: Date.now(),
        };
    }

    _getFallbackTip(wordId) {
        return 'Practice makes perfect! Try saying this word slowly and clearly.';
    }
}

// Export singleton instance
export const aiPipeline = new AIPipelineService();
export default aiPipeline;
