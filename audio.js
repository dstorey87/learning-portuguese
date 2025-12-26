/**
 * audio.js - BRIDGE FILE
 * 
 * Re-exports from src/services/VoiceService.js for backwards compatibility.
 * This file will be removed once app.js is updated to import directly from services.
 * 
 * @deprecated Use imports from './src/services/VoiceService.js' directly
 */

// Re-export everything from the new VoiceService
export {
    // Configuration
    VOICE_CONFIG,
    VOICE_ENGINES,
    VOICE_PROVIDERS,
    
    // State
    getLastVoiceUsed,
    
    // Downloaded voices
    getDownloadedVoices,
    markVoiceDownloaded,
    isVoiceDownloaded,
    getDownloadableVoices,
    
    // Bundled voices
    getBundledVoiceStatus,
    isBundledVoiceReady,
    getBundledVoiceOptions,
    getBundledVoiceCount,
    clearBundledVoice,
    startBundledVoiceDownload,
    
    // Voice selection
    ensureVoicesReady,
    getPortugueseVoiceOptions,
    getEngineVoiceOptions,
    
    // Speak
    speakWord,
    speakSentence,
    speakWithEngine,
    stopSpeech,
    
    // Default export
    default as VoiceService
} from './src/services/VoiceService.js';
