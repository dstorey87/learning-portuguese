/**
 * ai-tutor.js - BRIDGE FILE
 * 
 * Re-exports from src/services/AIService.js for backwards compatibility.
 * This file will be removed once app.js is updated to import directly from services.
 * 
 * @deprecated Use imports from './src/services/AIService.js' directly
 */

// Re-export everything from the new AIService
export {
    // Configuration
    AI_CONFIG,
    AI_PROVIDERS,
    FEEDBACK_TYPES,
    
    // Status checking
    checkOllamaStatus,
    getAIStatus,
    setModel,
    initAIService,
    
    // Pronunciation feedback
    getPronunciationFeedback,
    
    // Translation feedback
    getTranslationFeedback,
    
    // Grammar help
    getGrammarHelp,
    getGrammarTopics,
    
    // Study recommendations
    getStudyRecommendations,
    
    // Chat interface
    chat,
    streamChat,
    streamOllama,
    
    // Default export
    default as AIService
} from './src/services/AIService.js';

// Legacy constants for backwards compatibility
export const OLLAMA_URL = 'http://localhost:11434';
export const DEFAULT_MODEL = 'qwen2.5:7b';
