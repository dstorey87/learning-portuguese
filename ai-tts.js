/**
 * ai-tts.js - BRIDGE FILE
 * 
 * Re-exports from src/services/TTSService.js for backwards compatibility.
 * This file will be removed once app.js is updated to import directly from services.
 * 
 * @deprecated Use imports from './src/services/TTSService.js' directly
 */

// Re-export everything from the new TTSService
export {
    // Configuration
    TTS_CONFIG,
    TTS_ENGINES,
    TTS_LOCALES,
    EDGE_VOICES,
    
    // Server health
    checkServerHealth,
    getServerStatus,
    refreshServerStatus,
    
    // Voice selection
    getAvailableVoices,
    getVoice,
    getRecommendedVoice,
    
    // Speak functions
    speak,
    speakWithVoice,
    speakPortuguese,
    
    // Playback control
    stop,
    isSpeaking,
    getPlaybackState,
    
    // Initialization
    initTTSService,
    
    // Default export
    default as default
} from './src/services/TTSService.js';

// Legacy alias for backwards compatibility
export { TTS_CONFIG as TTS_SERVER_URL } from './src/services/TTSService.js';
