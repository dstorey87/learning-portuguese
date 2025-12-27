/**
 * AIChat Component - Interactive AI Tutor Chat Interface
 * 
 * Provides a chat interface for the AI Portuguese tutor with:
 * - Text messaging
 * - Voice input/output (WebSpeechService + TTSService)
 * - Real-time AI responses
 * - Context-aware suggestions
 * - Pronunciation assessment
 * - Inline audio playback for Portuguese words
 * 
 * @module AIChat
 * @since Phase 15 - Voice Integration Excellence
 */

import { getAIAgent } from '../../services/ai/AIAgent.js';
import { ensureToolHandlersInitialized } from '../../services/ai/ToolHandlers.js';
import { getWebSpeechService, isWebSpeechAvailable, RECOGNITION_EVENTS } from '../../services/WebSpeechService.js';
import { speak, speakPortuguese, speakEnglish, checkServerHealth, stop as stopTTS, isSpeaking, getAvailableVoices, DEFAULT_ENGLISH_VOICE, DEFAULT_PORTUGUESE_VOICE, DEFAULT_PORTUGUESE_RATE } from '../../services/TTSService.js';
import { getPronunciationAssessor } from '../../services/PronunciationAssessor.js';
import * as Logger from '../../services/Logger.js';
import { eventStream } from '../../services/eventStreaming.js';
import { createModal } from '../common/Modal.js';

const CHAT_CONFIG = {
    maxMessages: 50,
    typingDelay: 30,
    suggestionCount: 3
};

const QUICK_PROMPTS = [
    { text: 'Help me pronounce this word', icon: '🎤' },
    { text: 'What words should I review?', icon: '📚' },
    { text: 'Explain the grammar here', icon: '📝' },
    { text: 'Give me a practice sentence', icon: '✍️' }
];

class AIChatComponent {
    constructor() {
        this.agent = null;
        this.webSpeechService = null;
        this.pronunciationAssessor = null;
        this.messages = [];
        this.pendingMessages = [];
        this.isInitialized = false;
        this.isProcessing = false;
        this.isVoiceMode = false;
        this.isListening = false;
        this.isHandsFreeMode = false;
        this.autoSpeakReplies = true;
        this.audioUnlocked = false;
        this.handsFreeSessionId = null;
        this.isAssessingPronunciation = false;
        this.container = null;
        this.userId = null;
        this.lastAIResponse = null;
        this.interimTranscriptElement = null;

        // TTS server badge interval (for periodic health check)
        this.ttsStatusInterval = null;
        this.lastTTSOnline = null; // null = unknown

        // Voice settings (user-selectable)
        this.englishVoiceId = DEFAULT_ENGLISH_VOICE;
        this.portugueseVoiceId = DEFAULT_PORTUGUESE_VOICE;
        this.portugueseRate = DEFAULT_PORTUGUESE_RATE;
        this.genderLock = 'male';
        this.warnedTTSFallback = false;
    }

    enforceGenderLockVoices() {
        if (this.genderLock !== 'male') return;

        const voices = getAvailableVoices();
        const voiceById = new Map((voices.all || []).map(v => [v.id, v]));

        const pickMale = (list, fallbackId) => {
            const items = Array.isArray(list) ? list : [];
            const recommended = items.find(v => v.gender === 'male' && v.recommended);
            if (recommended?.id) return recommended.id;
            const anyMale = items.find(v => v.gender === 'male');
            return anyMale?.id || fallbackId;
        };

        const desiredEnglish = pickMale(voices.english, DEFAULT_ENGLISH_VOICE);
        const desiredPortuguese = pickMale(voices.portugal, DEFAULT_PORTUGUESE_VOICE);

        const currentEnglishGender = voiceById.get(this.englishVoiceId)?.gender;
        const currentPortugueseGender = voiceById.get(this.portugueseVoiceId)?.gender;

        let changed = false;
        if (!this.englishVoiceId || currentEnglishGender !== 'male') {
            this.englishVoiceId = desiredEnglish;
            changed = true;
        }
        if (!this.portugueseVoiceId || currentPortugueseGender !== 'male') {
            this.portugueseVoiceId = desiredPortuguese;
            changed = true;
        }

        if (changed) {
            try {
                localStorage.setItem(`${this.userId}_ai_tts_enVoice`, this.englishVoiceId);
                localStorage.setItem(`${this.userId}_ai_tts_ptVoice`, this.portugueseVoiceId);
            } catch {
                // ignore
            }
        }
    }

    async initialize(userId = 'default') {
        this.userId = userId;

        // Load preferences (must be user-isolated)
        try {
            const autoSpeakRaw = localStorage.getItem(`${this.userId}_ai_autoSpeakReplies`);
            this.autoSpeakReplies = autoSpeakRaw == null ? true : autoSpeakRaw === 'true';

            const enVoiceRaw = localStorage.getItem(`${this.userId}_ai_tts_enVoice`);
            const ptVoiceRaw = localStorage.getItem(`${this.userId}_ai_tts_ptVoice`);
            const ptRateRaw = localStorage.getItem(`${this.userId}_ai_tts_ptRate`);
            const genderLockRaw = localStorage.getItem(`${this.userId}_ai_tts_genderLock`);

            if (typeof enVoiceRaw === 'string' && enVoiceRaw.trim()) this.englishVoiceId = enVoiceRaw;
            if (typeof ptVoiceRaw === 'string' && ptVoiceRaw.trim()) this.portugueseVoiceId = ptVoiceRaw;
            if (typeof ptRateRaw === 'string' && ptRateRaw.trim()) {
                const parsed = Number(ptRateRaw);
                if (!Number.isNaN(parsed)) this.portugueseRate = parsed;
            }

            if (genderLockRaw === 'off') this.genderLock = 'off';
        } catch {
            // ignore
        }

        // If the user wants consistent male voices, enforce it immediately (even if old prefs had mixed genders).
        this.enforceGenderLockVoices();
        
        // Initialize tool handlers first
        ensureToolHandlersInitialized();
        
        // Get AI agent instance
        this.agent = getAIAgent(userId);
        const agentResult = await this.agent.initialize();
        
        if (!agentResult.success) {
            Logger.warn('ai_chat', 'AI agent not available, text-only mode', { error: agentResult.error });
        }
        
        // Initialize WebSpeechService for voice recognition
        this.webSpeechService = getWebSpeechService();
        const voiceAvailable = isWebSpeechAvailable();
        
        if (!voiceAvailable) {
            Logger.warn('ai_chat', 'Web Speech API not available in this browser');
        } else {
            Logger.info('ai_chat', 'Web Speech API available for voice input');
        }
        
        // Initialize pronunciation assessor
        this.pronunciationAssessor = getPronunciationAssessor();
        
        this.isInitialized = true;
        Logger.info('ai_chat', 'AI Chat initialized', { userId, aiAvailable: agentResult.success, voiceAvailable });
        
        return { success: true, aiAvailable: agentResult.success, voiceAvailable };
    }

    render(containerId) {
        this.container = document.getElementById(containerId);
        if (!this.container) {
            this.container = document.createElement('div');
            this.container.id = containerId;
            document.body.appendChild(this.container);
        }
        
        this.container.innerHTML = `
            <div class="ai-chat-widget" id="aiChatWidget">
                <div class="ai-chat-header">
                    <div class="ai-avatar">🤖</div>
                    <div class="ai-info">
                        <span class="ai-name">Portuguese Tutor</span>
                        <span class="ai-status" id="aiStatus">Ready to help</span>
                    </div>
                    <span class="ai-tts-badge" id="aiTTSBadge" title="TTS voice server status">⏳</span>
                    <div class="ai-header-actions">
                        <button class="ai-auto-speak-toggle" id="aiAutoSpeakToggle" title="Auto-speak assistant replies">🔊</button>
                        <button class="ai-handsfree-toggle" id="aiHandsFreeToggle" title="Hands-free voice call (listen ↔ speak)">📞</button>
                        <button class="ai-voice-toggle" id="aiVoiceToggle" title="Toggle voice mode">🎤</button>
                        <button class="ai-voice-settings" id="aiVoiceSettings" title="AI voice settings">⚙️</button>
                        <button class="ai-minimize" id="aiMinimize" title="Minimize">−</button>
                    </div>
                </div>
                
                <div class="ai-chat-messages" id="aiMessages">
                    <div class="ai-message assistant">
                        <div class="message-content">
                            Olá! 👋 I'm your Portuguese tutor. Ask me anything about European Portuguese - vocabulary, grammar, pronunciation, or just practice conversation with me!
                        </div>
                    </div>
                </div>
                
                <div class="ai-suggestions" id="aiSuggestions">
                    ${QUICK_PROMPTS.map(p => `
                        <button class="ai-suggestion" data-prompt="${p.text}">
                            ${p.icon} ${p.text}
                        </button>
                    `).join('')}
                </div>
                
                <div class="ai-chat-input">
                    <div class="ai-voice-indicator" id="aiVoiceIndicator" style="display: none;">
                        <div class="voice-waves">
                            <span></span><span></span><span></span><span></span><span></span>
                        </div>
                        <span class="voice-status">Listening...</span>
                    </div>
                    <textarea 
                        id="aiInput" 
                        placeholder="Type your message or click 🎤 to speak..."
                        rows="1"
                    ></textarea>
                    <button class="ai-send-btn" id="aiSendBtn" title="Send message">
                        <span class="send-icon">➤</span>
                    </button>
                </div>
            </div>
        `;
        
        this.attachStyles();
        this.attachEventListeners();
        this.syncSettingsUI();
        this.addWelcomeMessage();

        // Start periodic TTS health badge updates
        this.startTTSBadgePolling();
        
        return this.container;
    }

    syncSettingsUI() {
        const autoSpeakToggle = document.getElementById('aiAutoSpeakToggle');
        if (this.autoSpeakReplies) autoSpeakToggle?.classList.add('active');
        else autoSpeakToggle?.classList.remove('active');

        const handsFreeToggle = document.getElementById('aiHandsFreeToggle');
        if (this.isHandsFreeMode) handsFreeToggle?.classList.add('active');
        else handsFreeToggle?.classList.remove('active');
    }

    /**
     * Update the TTS server status badge (Online/Offline)
     * Called once on render, then periodically.
     */
    async updateTTSBadge() {
        const badge = document.getElementById('aiTTSBadge');
        if (!badge) return;
        try {
            const online = await checkServerHealth().catch(() => false);
            const wasOffline = this.lastTTSOnline === false;
            const wasUnknown = this.lastTTSOnline === null;
            this.lastTTSOnline = online;
            
            if (online) {
                badge.textContent = '🔊';
                badge.title = 'TTS server: Online (neural voices)';
                badge.classList.remove('offline');
                badge.classList.add('online');
                
                // If server just came online, show success message
                if (wasOffline) {
                    this.addMessageToUI('system', '✅ TTS server connected! Neural Portuguese voices are now available.');
                }
            } else {
                badge.textContent = '📵';
                badge.title = 'TTS server: Offline - Click for instructions';
                badge.classList.remove('online');
                badge.classList.add('offline');
                
                // Only show warning on first check or if we just went offline
                if (wasUnknown || (!wasOffline && this.lastTTSOnline === false)) {
                    this.showTTSOfflineWarning();
                }
            }
        } catch {
            badge.textContent = '⏳';
            badge.title = 'TTS server: checking…';
            badge.classList.remove('online', 'offline');
        }
    }

    /**
     * Show warning message when TTS server is offline with instructions
     */
    showTTSOfflineWarning() {
        if (this.warnedTTSFallback) return;
        this.warnedTTSFallback = true;
        
        this.addMessageToUI('system', 
            '⚠️ TTS server offline - using browser fallback voice.\n\n' +
            'For better neural Portuguese voices, start the server:\n' +
            '```\nnode server.js\n```\n' +
            'Run this command in your project folder.'
        );
    }

    /**
     * Start periodic TTS badge check (every 15 seconds)
     */
    startTTSBadgePolling() {
        if (this.ttsStatusInterval) return;
        
        // Add click handler to badge for showing instructions
        const badge = document.getElementById('aiTTSBadge');
        if (badge) {
            badge.style.cursor = 'pointer';
            badge.addEventListener('click', () => {
                if (!this.lastTTSOnline) {
                    this.warnedTTSFallback = false; // Reset to show message again
                    this.showTTSOfflineWarning();
                } else {
                    this.addMessageToUI('system', '✅ TTS server is running with neural Portuguese voices (pt-PT-DuarteNeural).');
                }
            });
        }
        
        // Initial check
        this.updateTTSBadge();
        this.ttsStatusInterval = setInterval(() => this.updateTTSBadge(), 15000);
    }

    /**
     * Stop periodic TTS badge check
     */
    stopTTSBadgePolling() {
        if (this.ttsStatusInterval) {
            clearInterval(this.ttsStatusInterval);
            this.ttsStatusInterval = null;
        }
    }

    attachStyles() {
        if (document.getElementById('ai-chat-styles')) return;
        
        const styles = document.createElement('style');
        styles.id = 'ai-chat-styles';
        styles.textContent = `
            .ai-chat-widget {
                position: fixed;
                bottom: 80px;
                right: 20px;
                width: 380px;
                max-width: calc(100vw - 40px);
                max-height: 500px;
                background: #1f2937;
                color: #e5e7eb;
                border-radius: 16px;
                box-shadow: 0 8px 32px rgba(0,0,0,0.3);
                display: flex;
                flex-direction: column;
                z-index: 1000;
                font-family: 'Nunito', sans-serif;
                overflow: hidden;
                transition: transform 0.3s ease, opacity 0.3s ease;
            }
            
            .ai-chat-widget.minimized {
                transform: translateY(calc(100% - 50px));
            }
            
            .ai-chat-header {
                display: flex;
                align-items: center;
                gap: 12px;
                padding: 12px 16px;
                background: var(--primary, #667eea);
                color: white;
                cursor: pointer;
            }
            
            .ai-avatar {
                font-size: 28px;
            }
            
            .ai-info {
                flex: 1;
                display: flex;
                flex-direction: column;
            }
            
            .ai-name {
                font-weight: 700;
                font-size: 14px;
            }
            
            .ai-status {
                font-size: 11px;
                opacity: 0.85;
            }

            /* TTS server status badge */
            .ai-tts-badge {
                display: inline-flex;
                align-items: center;
                justify-content: center;
                min-width: 28px;
                height: 20px;
                font-size: 12px;
                padding: 0 6px;
                border-radius: 10px;
                background: rgba(255,255,255,0.25);
                color: #fff;
                font-weight: 600;
                cursor: help;
                flex-shrink: 0;
                transition: background 0.2s;
            }
            .ai-tts-badge.online {
                background: #22c55e; /* green */
            }
            .ai-tts-badge.offline {
                background: #ef4444; /* red */
            }
            
            .ai-header-actions {
                display: flex;
                gap: 8px;
            }
            
            .ai-header-actions button {
                background: rgba(255,255,255,0.2);
                border: none;
                width: 32px;
                height: 32px;
                border-radius: 8px;
                cursor: pointer;
                font-size: 16px;
                transition: background 0.2s;
            }
            
            .ai-header-actions button:hover {
                background: rgba(255,255,255,0.3);
            }
            
            .ai-voice-toggle.active {
                background: #22c55e !important;
            }

            .ai-auto-speak-toggle.active {
                background: #0ea5e9 !important;
            }

            .ai-handsfree-toggle.active {
                background: #ef4444 !important;
                animation: pulse-red 1.5s infinite;
            }

            @keyframes pulse-red {
                0%, 100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.35); }
                50% { box-shadow: 0 0 0 10px rgba(239, 68, 68, 0); }
            }
            
            .ai-chat-messages {
                flex: 1;
                overflow-y: auto;
                padding: 16px;
                display: flex;
                flex-direction: column;
                gap: 12px;
                max-height: 300px;
                background: #111827;
            }
            
            .ai-message {
                display: flex;
                gap: 8px;
                max-width: 85%;
            }
            
            .ai-message.user {
                align-self: flex-end;
                flex-direction: row-reverse;
            }
            
            .ai-message .message-content {
                padding: 10px 14px;
                border-radius: 16px;
                font-size: 14px;
                line-height: 1.5;
            }
            
            .ai-message.assistant .message-content {
                background: #374151;
                color: #f3f4f6 !important;
                border-bottom-left-radius: 4px;
            }
            
            .ai-message.user .message-content {
                background: var(--primary, #667eea);
                color: white;
                border-bottom-right-radius: 4px;
            }
            
            .ai-message.assistant .message-content strong {
                color: #a5b4fc;
            }

            .ai-message.system .message-content {
                background: rgba(34, 197, 94, 0.15);
                color: #bbf7d0;
                border-radius: 12px;
            }
            
            .ai-suggestions {
                display: flex;
                flex-wrap: wrap;
                gap: 8px;
                padding: 8px 16px;
                border-top: 1px solid rgba(255,255,255,0.1);
                background: #1f2937;
            }
            
            .ai-suggestion {
                padding: 6px 12px;
                background: #374151;
                border: 1px solid #4b5563;
                border-radius: 16px;
                font-size: 12px;
                cursor: pointer;
                transition: all 0.2s;
                color: #e5e7eb !important;
            }
            
            .ai-suggestion:hover {
                background: var(--primary, #667eea);
                color: white;
                border-color: var(--primary, #667eea);
            }
            
            .ai-chat-input {
                display: flex;
                align-items: flex-end;
                gap: 8px;
                padding: 12px 16px;
                border-top: 1px solid #374151;
                background: #1f2937;
            }
            
            .ai-chat-input textarea {
                flex: 1;
                background: #111827;
                border: 1px solid #4b5563;
                border-radius: 20px;
                padding: 10px 16px;
                font-size: 14px;
                color: #f3f4f6;
                resize: none;
                max-height: 100px;
                font-family: inherit;
            }
            
            .ai-chat-input textarea:focus {
                outline: none;
                border-color: #667eea;
            }
            
            .ai-chat-input textarea::placeholder {
                color: #9ca3af;
            }
            
            .ai-send-btn {
                width: 40px;
                height: 40px;
                background: var(--primary, #667eea);
                border: none;
                border-radius: 50%;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: transform 0.2s, background 0.2s;
            }
            
            .ai-send-btn:hover {
                transform: scale(1.05);
            }
            
            .ai-send-btn:disabled {
                opacity: 0.5;
                cursor: not-allowed;
            }
            
            .send-icon {
                color: white;
                font-size: 18px;
            }
            
            .ai-voice-indicator {
                display: flex;
                align-items: center;
                gap: 12px;
                padding: 8px 16px;
                background: var(--bg-secondary, #2a2a3e);
                border-radius: 20px;
                flex: 1;
            }
            
            .voice-waves {
                display: flex;
                gap: 3px;
                align-items: center;
            }
            
            .voice-waves span {
                width: 3px;
                height: 15px;
                background: var(--primary, #667eea);
                border-radius: 2px;
                animation: wave 0.5s ease-in-out infinite;
            }
            
            .voice-waves span:nth-child(2) { animation-delay: 0.1s; }
            .voice-waves span:nth-child(3) { animation-delay: 0.2s; }
            .voice-waves span:nth-child(4) { animation-delay: 0.3s; }
            .voice-waves span:nth-child(5) { animation-delay: 0.4s; }
            
            @keyframes wave {
                0%, 100% { transform: scaleY(0.5); }
                50% { transform: scaleY(1.5); }
            }
            
            .typing-indicator {
                display: flex;
                gap: 4px;
                padding: 12px 16px;
            }
            
            .typing-indicator span {
                width: 8px;
                height: 8px;
                background: var(--text-muted, #888);
                border-radius: 50%;
                animation: typing 1s infinite;
            }
            
            .typing-indicator span:nth-child(2) { animation-delay: 0.2s; }
            .typing-indicator span:nth-child(3) { animation-delay: 0.4s; }
            
            @keyframes typing {
                0%, 100% { opacity: 0.3; }
                50% { opacity: 1; }
            }
            
            /* Voice mode styles */
            .ai-voice-toggle.listening {
                background: #f97316 !important;
                animation: pulse-orange 1.5s infinite;
            }
            
            .ai-voice-toggle.speaking {
                background: #8b5cf6 !important;
                animation: pulse-purple 1s infinite;
            }
            
            @keyframes pulse-orange {
                0%, 100% { box-shadow: 0 0 0 0 rgba(249, 115, 22, 0.4); }
                50% { box-shadow: 0 0 0 10px rgba(249, 115, 22, 0); }
            }
            
            @keyframes pulse-purple {
                0%, 100% { box-shadow: 0 0 0 0 rgba(139, 92, 246, 0.4); }
                50% { box-shadow: 0 0 0 8px rgba(139, 92, 246, 0); }
            }
            
            /* Interim transcript (live transcription) */
            .ai-message.interim {
                opacity: 0.7;
            }
            
            .ai-message.interim .message-content {
                background: var(--bg-secondary, #2a2a3e);
                border: 1px dashed var(--border, #444);
            }
            
            .interim-text {
                font-style: italic;
            }
            
            .voice-indicator-dots {
                display: inline-flex;
                gap: 2px;
                margin-left: 8px;
            }
            
            .voice-indicator-dots span {
                width: 4px;
                height: 4px;
                background: var(--primary, #667eea);
                border-radius: 50%;
                animation: bounce 1.4s ease-in-out infinite;
            }
            
            .voice-indicator-dots span:nth-child(2) { animation-delay: 0.2s; }
            .voice-indicator-dots span:nth-child(3) { animation-delay: 0.4s; }
            
            @keyframes bounce {
                0%, 80%, 100% { transform: scale(0); }
                40% { transform: scale(1); }
            }
            
            /* Inline audio buttons for Portuguese words */
            .portuguese-word {
                display: inline;
                color: var(--primary, #667eea);
            }
            
            .inline-audio-btn {
                display: inline-flex;
                align-items: center;
                justify-content: center;
                background: transparent;
                border: none;
                cursor: pointer;
                font-size: 12px;
                padding: 0 2px;
                margin-left: 2px;
                opacity: 0.7;
                transition: opacity 0.2s, transform 0.2s;
                vertical-align: middle;
            }
            
            .inline-audio-btn:hover {
                opacity: 1;
                transform: scale(1.2);
            }
            
            .inline-audio-btn:active {
                transform: scale(0.9);
            }
            
            /* IPA pronunciation */
            .ipa {
                font-family: 'Lucida Sans Unicode', 'DejaVu Sans', monospace;
                color: var(--text-muted, #888);
                font-size: 0.9em;
            }
            
            /* System messages */
            .ai-message.system .message-content {
                background: var(--bg-tertiary, #1a1a2e);
                border-left: 3px solid var(--primary, #667eea);
                font-size: 13px;
            }
            
            /* Pronunciation Feedback */
            .pronunciation-feedback {
                padding: 12px;
                border-radius: 12px;
                background: var(--bg-secondary, #2a2a3e);
            }
            
            .pronunciation-feedback.excellent {
                border: 2px solid #22c55e;
                background: rgba(34, 197, 94, 0.1);
            }
            
            .pronunciation-feedback.good {
                border: 2px solid #3b82f6;
                background: rgba(59, 130, 246, 0.1);
            }
            
            .pronunciation-feedback.fair {
                border: 2px solid #f59e0b;
                background: rgba(245, 158, 11, 0.1);
            }
            
            .pronunciation-feedback.needs-work {
                border: 2px solid #ef4444;
                background: rgba(239, 68, 68, 0.1);
            }
            
            .pronunciation-feedback .score-badge {
                display: flex;
                align-items: center;
                gap: 8px;
                margin-bottom: 8px;
            }
            
            .pronunciation-feedback .score-badge .emoji {
                font-size: 24px;
            }
            
            .pronunciation-feedback .score-badge .score {
                font-size: 20px;
                font-weight: bold;
                color: var(--text, #e0e0e0);
            }
            
            .pronunciation-feedback .feedback-text {
                margin: 8px 0;
                color: var(--text, #e0e0e0);
            }
            
            .pronunciation-feedback .feedback-tips {
                margin: 8px 0;
                padding-left: 20px;
                color: var(--text-muted, #aaa);
                font-size: 13px;
            }
            
            .pronunciation-feedback .feedback-tips li {
                margin: 4px 0;
            }
            
            .pronunciation-feedback .replay-btn {
                display: inline-flex;
                align-items: center;
                gap: 6px;
                margin-top: 8px;
                padding: 8px 12px;
                background: var(--primary, #667eea);
                border: none;
                border-radius: 8px;
                color: white;
                font-size: 13px;
                cursor: pointer;
                transition: background 0.2s, transform 0.2s;
            }
            
            .pronunciation-feedback .replay-btn:hover {
                background: var(--primary-dark, #5a6fd6);
                transform: scale(1.02);
            }
            
            /* Mobile responsive */
            @media (max-width: 480px) {
                .ai-chat-widget {
                    bottom: 70px;
                    right: 10px;
                    left: 10px;
                    width: auto;
                }
            }
        `;
        document.head.appendChild(styles);
    }

    attachEventListeners() {
        const sendBtn = document.getElementById('aiSendBtn');
        const input = document.getElementById('aiInput');
        const autoSpeakToggle = document.getElementById('aiAutoSpeakToggle');
        const handsFreeToggle = document.getElementById('aiHandsFreeToggle');
        const voiceToggle = document.getElementById('aiVoiceToggle');
        const voiceSettingsBtn = document.getElementById('aiVoiceSettings');
        const minimizeBtn = document.getElementById('aiMinimize');
        const header = document.querySelector('.ai-chat-header');
        const suggestions = document.getElementById('aiSuggestions');
        
        // Send message
        sendBtn?.addEventListener('click', () => this.sendMessage());
        
        // Enter to send (Shift+Enter for newline)
        input?.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });
        
        // Auto-resize textarea
        input?.addEventListener('input', () => {
            input.style.height = 'auto';
            input.style.height = Math.min(input.scrollHeight, 100) + 'px';
        });
        
        // Voice toggle
        voiceToggle?.addEventListener('click', () => this.toggleVoiceMode());

        // Voice settings
        voiceSettingsBtn?.addEventListener('click', (e) => {
            e.stopPropagation();
            this.openVoiceSettings();
        });

        // Auto-speak toggle
        autoSpeakToggle?.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleAutoSpeak();
        });

        // Hands-free voice call toggle
        handsFreeToggle?.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleHandsFreeMode();
        });
        
        // Minimize
        minimizeBtn?.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleMinimize();
        });
        
        header?.addEventListener('click', () => {
            const widget = document.getElementById('aiChatWidget');
            if (widget?.classList.contains('minimized')) {
                this.toggleMinimize();
            }
        });
        
        // Quick prompts
        suggestions?.addEventListener('click', (e) => {
            const btn = e.target.closest('.ai-suggestion');
            if (btn) {
                const prompt = btn.dataset.prompt;
                document.getElementById('aiInput').value = prompt;
                this.sendMessage();
            }
        });
    }

    addWelcomeMessage() {
        // Already in the HTML template
    }

    async sendMessage(messageText = null, options = {}) {
        const { source = 'text' } = options;

        const input = document.getElementById('aiInput');
        const message = (typeof messageText === 'string' ? messageText : input?.value)?.trim();

        if (!message) return;

        // Clear input only for typed messages
        if (source === 'text' && input) {
            input.value = '';
            input.style.height = 'auto';
        }

        // Add user message to UI immediately
        this.addMessageToUI('user', message);

        // Track event (non-blocking)
        try {
            eventStream.track('ai_chat_message', {
                messageLength: message.length,
                source
            });
        } catch {
            // ignore
        }

        // If we're already processing, queue this message for later
        if (this.isProcessing) {
            this.pendingMessages.push({ message, source });
            return;
        }

        await this.processMessage(message, { source });
    }

    async processMessage(message, options = {}) {
        const { source = 'text' } = options;
        // Show typing indicator
        this.setProcessing(true);
        this.showTypingIndicator();

        try {
            // Process with AI agent
            const result = await this.agent.processInput(message, {
                source: 'chat',
                currentLesson: window.currentLesson
            });
            
            this.hideTypingIndicator();
            
            if (result.success) {
                this.addMessageToUI('assistant', result.response);

                const shouldSpeak = this.autoSpeakReplies && (source === 'voice' || this.isVoiceMode || this.isHandsFreeMode);
                if (shouldSpeak) {
                    await this.speakAIResponse(result.response);
                }

                try {
                    eventStream.track('ai_chat_reply', {
                        messageLength: result.response?.length || 0,
                        spoke: shouldSpeak
                    });
                } catch {
                    // ignore
                }
            } else {
                this.addMessageToUI('assistant', 
                    "I'm having trouble connecting right now. Try asking about Portuguese vocabulary, grammar, or pronunciation!"
                );
            }
        } catch (error) {
            Logger.error('ai_chat', 'Message processing failed', { error: error.message });
            this.hideTypingIndicator();
            this.addMessageToUI('assistant', 
                "Sorry, I encountered an error. Please try again!"
            );
        } finally {
            this.setProcessing(false);
            await this.drainQueuedMessages();
        }
    }

    async drainQueuedMessages() {
        if (this.isProcessing) return;
        if (!this.pendingMessages.length) return;

        const next = this.pendingMessages.shift();
        if (!next) return;

        const message = typeof next === 'string' ? next : next.message;
        const source = typeof next === 'string' ? 'text' : (next.source || 'text');
        await this.processMessage(message, { source });
    }

    addMessageToUI(role, content) {
        const messagesContainer = document.getElementById('aiMessages');
        if (!messagesContainer) return;
        
        // Store last AI response for voice mode
        if (role === 'assistant') {
            this.lastAIResponse = content;
        }
        
        const messageEl = document.createElement('div');
        messageEl.className = `ai-message ${role}`;
        
        // For assistant messages, add inline audio buttons for Portuguese words
        const formattedContent = role === 'assistant' 
            ? this.formatMessageWithAudio(content)
            : this.formatMessage(content);
        
        messageEl.innerHTML = `<div class="message-content">${formattedContent}</div>`;
        
        messagesContainer.appendChild(messageEl);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
        
        // Store message
        this.messages.push({ role, content, timestamp: Date.now() });
        
        // Trim old messages
        if (this.messages.length > CHAT_CONFIG.maxMessages) {
            this.messages = this.messages.slice(-CHAT_CONFIG.maxMessages);
        }
    }
    
    /**
     * Format message with inline audio buttons for Portuguese words
     * @param {string} content - Message content
     * @returns {string} Formatted HTML with audio buttons
     */
    formatMessageWithAudio(content) {
        // First apply standard formatting
        let formatted = content
            .replace(/`(.+?)`/g, '<code>$1</code>')
            .replace(/\/(.+?)\//g, '<span class="ipa">/$1/</span>')
            .replace(/\n/g, '<br>');
        
        // Then handle Portuguese words marked with ** - add audio buttons
        formatted = formatted.replace(/\*\*([a-záàâãéêíóôõúçñ\s]+)\*\*/gi, (match, word) => {
            const escaped = word.trim().replace(/'/g, "\\'");
            return `<strong class="portuguese-word" data-word="${escaped}">${word} <button class="inline-audio-btn" onclick="window.playPortugueseWord('${escaped}')" title="Listen to '${word}'">🔊</button></strong>`;
        });
        
        // Handle single * for emphasis (but not Portuguese words)
        formatted = formatted.replace(/\*([^*]+)\*/g, '<em>$1</em>');
        
        return formatted;
    }

    formatMessage(content) {
        // Convert markdown-like formatting (for user messages)
        return content
            .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.+?)\*/g, '<em>$1</em>')
            .replace(/`(.+?)`/g, '<code>$1</code>')
            .replace(/\/(.+?)\//g, '<span class="ipa">/$1/</span>')
            .replace(/\n/g, '<br>');
    }

    showTypingIndicator() {
        const messagesContainer = document.getElementById('aiMessages');
        if (!messagesContainer) return;
        
        const indicator = document.createElement('div');
        indicator.id = 'typingIndicator';
        indicator.className = 'ai-message assistant';
        indicator.innerHTML = `
            <div class="message-content typing-indicator">
                <span></span><span></span><span></span>
            </div>
        `;
        messagesContainer.appendChild(indicator);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    hideTypingIndicator() {
        document.getElementById('typingIndicator')?.remove();
    }

    setProcessing(processing) {
        this.isProcessing = processing;
        const sendBtn = document.getElementById('aiSendBtn');
        const status = document.getElementById('aiStatus');
        
        if (sendBtn) sendBtn.disabled = processing;
        if (status) status.textContent = processing ? 'Thinking...' : 'Ready to help';
    }

    /**
     * Toggle voice mode - using WebSpeechService for recognition
     * and TTSService for speaking AI responses
     */
    async toggleVoiceMode() {
        const voiceToggle = document.getElementById('aiVoiceToggle');
        const voiceIndicator = document.getElementById('aiVoiceIndicator');
        const input = document.getElementById('aiInput');
        const status = document.getElementById('aiStatus');

        // If hands-free is running, the mic button acts like stop.
        if (this.isHandsFreeMode) {
            this.stopHandsFreeMode();
            return;
        }
        
        // If already in voice mode, stop it
        if (this.isVoiceMode || this.isListening) {
            this.stopVoiceMode();
            return;
        }
        
        // Check if Web Speech API is available
        if (!isWebSpeechAvailable()) {
            this.addMessageToUI('assistant', '⚠️ Voice recognition is not available in your browser. Please try Chrome, Edge, or Safari.');
            return;
        }
        
        // Start voice recognition
        this.isVoiceMode = true;
        this.isListening = true;
        voiceToggle?.classList.add('active', 'listening');
        if (voiceIndicator) voiceIndicator.style.display = 'flex';
        if (input) input.style.display = 'none';
        if (status) status.textContent = 'Listening... (PT/EN)';
        
        // Show interim transcript element
        this.showInterimTranscript();

        // Attempt to unlock audio playback on the user gesture
        await this.unlockAudioPlayback();

        try {
            eventStream.track('ai_voice_start', { mode: 'push_to_talk' });
        } catch {
            // ignore
        }
        
        // Set up interim result listener
        const interimUnsub = this.webSpeechService.on(RECOGNITION_EVENTS.INTERIM_RESULT, (interim) => {
            this.updateInterimTranscript(interim.text);
        });
        
        try {
            Logger.info('ai_chat', 'Starting bilingual voice recognition (PT/EN)');
            
            // Determine preferred language based on context
            const preferredLanguage = this.getExpectedLanguageFromContext();
            
            // Use bilingual recognition - tries both Portuguese and English
            const result = await this.webSpeechService.listenBilingual(10000, { 
                waitForSpeechEnd: true, 
                postSpeechEndDelayMs: 220,
                preferredLanguage
            });
            
            // Hide interim transcript
            this.hideInterimTranscript();
            interimUnsub(); // Clean up listener
            
            if (result.text && result.text.trim()) {
                Logger.info('ai_chat', 'Voice input received', { 
                    text: result.text, 
                    confidence: result.confidence,
                    detectedLanguage: result.detectedLanguage 
                });

                try {
                    eventStream.track('ai_voice_final', { 
                        textLength: result.text.length, 
                        confidence: result.confidence,
                        detectedLanguage: result.detectedLanguage
                    });
                } catch {
                    // ignore
                }
                
                // Update status with detected language
                if (status) {
                    const langLabel = result.detectedLanguage === 'pt-PT' ? '🇵🇹' : '🇬🇧';
                    status.textContent = `Processing ${langLabel}...`;
                }
                
                // Send to AI
                await this.sendMessage(result.text, { source: 'voice', detectedLanguage: result.detectedLanguage });
            } else {
                Logger.info('ai_chat', 'No speech detected');
                if (result.noSpeech) {
                    this.addMessageToUI('assistant', "I didn't hear anything. Click the 🎤 button and try speaking again.");
                }
            }
        } catch (error) {
            Logger.error('ai_chat', 'Voice recognition error', { error: error.message });
            this.hideInterimTranscript();
            interimUnsub();
            
            // Show appropriate error message
            if (error.code === 'not-allowed') {
                this.addMessageToUI('assistant', '🎤 Microphone access denied. Please allow microphone access in your browser settings.');
            } else if (error.code === 'audio-capture') {
                this.addMessageToUI('assistant', '🎤 No microphone found. Please connect a microphone and try again.');
            } else {
                this.addMessageToUI('assistant', `Voice error: ${error.message || 'Unknown error'}. Please try again.`);
            }
        } finally {
            this.stopVoiceMode();
        }
    }

    toggleAutoSpeak() {
        this.autoSpeakReplies = !this.autoSpeakReplies;

        const btn = document.getElementById('aiAutoSpeakToggle');
        if (this.autoSpeakReplies) btn?.classList.add('active');
        else btn?.classList.remove('active');

        try {
            localStorage.setItem(`${this.userId}_ai_autoSpeakReplies`, String(this.autoSpeakReplies));
        } catch {
            // ignore
        }

        try {
            eventStream.track('ai_chat_setting', { setting: 'autoSpeakReplies', value: this.autoSpeakReplies });
        } catch {
            // ignore
        }
    }

    async toggleHandsFreeMode() {
        if (this.isHandsFreeMode) {
            this.stopHandsFreeMode();
            return;
        }

        if (!isWebSpeechAvailable()) {
            this.addMessageToUI('assistant', '⚠️ Hands-free voice needs Web Speech API. Please try Chrome or Edge.');
            return;
        }

        await this.startHandsFreeMode();
    }

    async startHandsFreeMode() {
        const handsFreeToggle = document.getElementById('aiHandsFreeToggle');
        const voiceToggle = document.getElementById('aiVoiceToggle');
        const voiceIndicator = document.getElementById('aiVoiceIndicator');
        const input = document.getElementById('aiInput');
        const status = document.getElementById('aiStatus');

        // Stop any single-turn voice mode first
        this.stopVoiceMode();

        this.isHandsFreeMode = true;
        this.isVoiceMode = true;
        this.handsFreeSessionId = (crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`);

        handsFreeToggle?.classList.add('active');
        voiceToggle?.classList.add('active');
        voiceToggle?.classList.remove('listening', 'speaking');
        if (voiceIndicator) voiceIndicator.style.display = 'flex';
        if (input) input.style.display = 'none';
        if (status) status.textContent = 'Voice call: Listening...';

        // Ensure replies are spoken in call mode
        if (!this.autoSpeakReplies) {
            this.autoSpeakReplies = true;
            document.getElementById('aiAutoSpeakToggle')?.classList.add('active');
        }

        this.syncSettingsUI();

        await this.unlockAudioPlayback();

        this.addMessageToUI('system', '📞 Voice call started. Speak naturally — I’ll listen, reply, and keep listening. Click 📞 again to stop.');

        try {
            eventStream.track('ai_voice_start', { mode: 'hands_free' });
        } catch {
            // ignore
        }

        // Run loop without blocking UI
        this.runHandsFreeLoop(this.handsFreeSessionId);
    }

    stopHandsFreeMode() {
        const handsFreeToggle = document.getElementById('aiHandsFreeToggle');
        const voiceToggle = document.getElementById('aiVoiceToggle');
        const voiceIndicator = document.getElementById('aiVoiceIndicator');
        const input = document.getElementById('aiInput');
        const status = document.getElementById('aiStatus');

        this.isHandsFreeMode = false;
        this.isVoiceMode = false;
        this.isListening = false;
        this.handsFreeSessionId = null;

        try {
            eventStream.track('ai_voice_stop', { mode: 'hands_free' });
        } catch {
            // ignore
        }

        if (this.webSpeechService) {
            this.webSpeechService.stop();
        }
        stopTTS();

        handsFreeToggle?.classList.remove('active');
        voiceToggle?.classList.remove('active', 'listening', 'speaking');
        if (voiceIndicator) voiceIndicator.style.display = 'none';
        if (input) input.style.display = 'block';
        if (status) status.textContent = 'Ready to help';

        this.hideInterimTranscript();
    }

    async runHandsFreeLoop(sessionId) {
        const status = document.getElementById('aiStatus');
        const voiceToggle = document.getElementById('aiVoiceToggle');

        while (this.isHandsFreeMode && this.handsFreeSessionId === sessionId) {
            try {
                // Don’t listen while still processing a previous turn.
                if (this.isProcessing) {
                    await new Promise(r => setTimeout(r, 150));
                    continue;
                }

                // Stop any TTS before starting recognition
                stopTTS();

                this.isListening = true;
                voiceToggle?.classList.add('listening');
                voiceToggle?.classList.remove('speaking');
                if (status) status.textContent = '📞 Listening (PT/EN)...';

                this.showInterimTranscript();

                const interimUnsub = this.webSpeechService.on(RECOGNITION_EVENTS.INTERIM_RESULT, (interim) => {
                    this.updateInterimTranscript(interim.text);
                    try {
                        eventStream.track('ai_voice_interim', { textLength: (interim.text || '').length });
                    } catch {
                        // ignore
                    }
                });

                // Determine preferred language based on conversation context
                const preferredLanguage = this.getExpectedLanguageFromContext();

                // Use bilingual recognition for hands-free mode
                const result = await this.webSpeechService.listenBilingual(9000, { 
                    waitForSpeechEnd: true, 
                    postSpeechEndDelayMs: 220,
                    preferredLanguage
                });
                interimUnsub();
                this.hideInterimTranscript();

                this.isListening = false;

                if (!this.isHandsFreeMode || this.handsFreeSessionId !== sessionId) break;

                if (!result?.text || !result.text.trim()) {
                    // No speech detected; loop continues.
                    await new Promise(r => setTimeout(r, 120));
                    continue;
                }

                // Log detected language
                Logger.info('ai_chat', 'Hands-free input', { 
                    text: result.text.substring(0, 50), 
                    detectedLanguage: result.detectedLanguage 
                });

                // One turn
                await this.sendMessage(result.text, { source: 'voice', detectedLanguage: result.detectedLanguage });
            } catch (error) {
                Logger.error('ai_chat', 'Hands-free voice loop error', { error: error.message });
                this.hideInterimTranscript();

                // Non-recoverable errors stop the call
                this.addMessageToUI('assistant', `🎤 Voice call stopped: ${error.message || 'Unknown error'}`);
                this.stopHandsFreeMode();
                break;
            }
        }
    }

    async unlockAudioPlayback() {
        if (this.audioUnlocked) return true;

        // Attempt a short silent playback; many browsers treat this as “user initiated”
        // when called directly in a click handler (mic/phone button).
        const silentWav =
            'data:audio/wav;base64,' +
            'UklGRiQAAABXQVZFZm10IBAAAAABAAEAIlYAAESsAAACABAAZGF0YQAAAAA=';

        try {
            const audio = new Audio(silentWav);
            audio.volume = 0;
            await audio.play();
            audio.pause();
            this.audioUnlocked = true;
            return true;
        } catch {
            // Some browsers may still block; we’ll rely on Web Speech fallback or user interaction.
            return false;
        }
    }
    
    /**
     * Stop voice mode and reset UI
     */
    stopVoiceMode() {
        const voiceToggle = document.getElementById('aiVoiceToggle');
        const voiceIndicator = document.getElementById('aiVoiceIndicator');
        const input = document.getElementById('aiInput');
        const status = document.getElementById('aiStatus');
        
        this.isVoiceMode = false;
        this.isListening = false;
        
        // Stop any ongoing recognition
        if (this.webSpeechService) {
            this.webSpeechService.stop();
        }
        
        // Stop any ongoing TTS
        stopTTS();
        
        // Reset UI
        voiceToggle?.classList.remove('active', 'listening', 'speaking');
        if (voiceIndicator) voiceIndicator.style.display = 'none';
        if (input) input.style.display = 'block';
        if (status) status.textContent = 'Ready to help';
        
        this.hideInterimTranscript();
    }

    /**
     * Determine expected language based on conversation context.
     * Looks at recent messages to infer if user is likely to speak Portuguese or English.
     * 
     * @returns {string} 'pt-PT' or 'en-US'
     */
    getExpectedLanguageFromContext() {
        // Check if in pronunciation assessment mode
        if (this.isAssessingPronunciation) {
            return 'pt-PT';
        }

        // Check last AI message for context clues
        if (this.lastAIResponse) {
            const response = this.lastAIResponse.toLowerCase();
            
            // If AI asked user to repeat/say something in Portuguese
            if (/repeat after me|try saying|say it|pronounce|como se diz|diga|repita|fale/i.test(response)) {
                return 'pt-PT';
            }
            
            // If AI asked a question in Portuguese or included Portuguese text to practice
            if (/[áàâãéêíóôõúç]/.test(this.lastAIResponse) || 
                /bom dia|boa tarde|como está|obrigad|por favor/i.test(response)) {
                return 'pt-PT';
            }
        }

        // Check recent user messages - if they've been speaking Portuguese, continue that
        const recentMessages = this.messages.slice(-5);
        const portugueseCount = recentMessages.filter(m => 
            m.role === 'user' && 
            (/[áàâãéêíóôõúç]/.test(m.content) || 
             /obrigad|olá|bom|sim|não|está|estou/i.test(m.content))
        ).length;

        // If user has been speaking Portuguese recently, prefer Portuguese
        if (portugueseCount >= 2) {
            return 'pt-PT';
        }

        // Default: English for general conversation with the tutor
        // But actually, since this is a Portuguese learning app, let's prefer Portuguese
        // for voice input to catch pronunciation practice attempts
        return 'pt-PT';
    }
    
    /**
     * Show interim transcript display
     */
    showInterimTranscript() {
        this.hideInterimTranscript(); // Remove any existing
        
        this.interimTranscriptElement = document.createElement('div');
        this.interimTranscriptElement.className = 'ai-message user interim';
        this.interimTranscriptElement.innerHTML = `
            <div class="message-content">
                <span class="interim-text">...</span>
                <span class="voice-indicator-dots"><span></span><span></span><span></span></span>
            </div>
        `;
        
        const messagesContainer = document.getElementById('aiMessages');
        if (messagesContainer) {
            messagesContainer.appendChild(this.interimTranscriptElement);
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }
    }
    
    /**
     * Update interim transcript text
     */
    updateInterimTranscript(text) {
        if (this.interimTranscriptElement) {
            const textSpan = this.interimTranscriptElement.querySelector('.interim-text');
            if (textSpan) {
                textSpan.textContent = text || '...';
            }
        }
    }
    
    /**
     * Hide and remove interim transcript display
     */
    hideInterimTranscript() {
        if (this.interimTranscriptElement) {
            this.interimTranscriptElement.remove();
            this.interimTranscriptElement = null;
        }
    }
    
    /**
     * Speak AI response using TTS
     * @param {string} text - Text to speak
     */
    async speakAIResponse(text) {
        const voiceToggle = document.getElementById('aiVoiceToggle');
        const status = document.getElementById('aiStatus');
        
        try {
            this.enforceGenderLockVoices();

            const serverOk = await checkServerHealth().catch(() => false);
            const allowFallback = !serverOk;
            if (allowFallback && !this.warnedTTSFallback) {
                this.warnedTTSFallback = true;
                this.addSystemMessage('ℹ️ High-quality TTS server is offline. Falling back to browser voice (may sound different). Start it with: npm run server');
            }

            voiceToggle?.classList.add('speaking');
            voiceToggle?.classList.remove('listening');

            const segments = this.splitTextForBilingualTTS(text);
            
            // DEBUG: Log segment breakdown
            console.log('[AI Chat] TTS segments:', segments.map(s => ({ lang: s.lang, text: s.text?.substring(0, 30) })));
            console.log('[AI Chat] Voice config:', { 
                englishVoiceId: this.englishVoiceId, 
                portugueseVoiceId: this.portugueseVoiceId,
                genderLock: this.genderLock,
                serverOk
            });

            for (const segment of segments) {
                if (!segment?.text) continue;

                if (segment.lang === 'pt') {
                    if (status) status.textContent = `🇵🇹 ${this.portugueseVoiceId}`;
                    const isSingleWord = /^[^\s]+$/.test(segment.text.trim());
                    // For pronunciation practice, keep Portuguese extra slow for single words.
                    const effectivePortugueseRate = isSingleWord
                        ? Math.min(this.portugueseRate, 0.58)
                        : this.portugueseRate;
                    console.log('[AI Chat] Speaking PT:', { voice: this.portugueseVoiceId, text: segment.text.substring(0, 30) });
                    const result = await speakPortuguese(segment.text, {
                        voice: this.portugueseVoiceId,
                        rate: effectivePortugueseRate,
                        // Add gentle pauses between Portuguese words for learner clarity.
                        clarity: !isSingleWord,
                        // Prefer neural Edge-TTS, but allow fallback if server is down.
                        fallbackToWebSpeech: allowFallback,
                        preferGender: this.genderLock === 'male' ? 'male' : undefined
                    });
                    // DEBUG: Show what engine/voice was actually used
                    console.log('[AI Chat] PT TTS result:', result);
                    if (result?.engine === 'webspeech') {
                        if (status) status.textContent = `⚠️ WebSpeech: ${result.voice || 'unknown'}`;
                    }
                } else {
                    if (status) status.textContent = `🇬🇧 ${this.englishVoiceId}`;
                    console.log('[AI Chat] Speaking EN:', { voice: this.englishVoiceId, text: segment.text.substring(0, 30) });
                    const result = await speakEnglish(segment.text, {
                        voice: this.englishVoiceId,
                        // Prefer neural Edge-TTS, but allow fallback if server is down.
                        fallbackToWebSpeech: allowFallback,
                        preferGender: this.genderLock === 'male' ? 'male' : undefined
                    });
                    // DEBUG: Show what engine/voice was actually used
                    console.log('[AI Chat] EN TTS result:', result);
                    if (result?.engine === 'webspeech') {
                        if (status) status.textContent = `⚠️ WebSpeech: ${result.voice || 'unknown'}`;
                    }
                }
            }
            // DEBUG: Add system message showing what was used (can be removed later)
            console.log('[AI Chat] All segments spoken. Server was:', serverOk ? 'ONLINE' : 'OFFLINE');
        } catch (error) {
            Logger.warn('ai_chat', 'TTS failed, response displayed as text only', { error: error.message });
        } finally {
            voiceToggle?.classList.remove('speaking');
            if (status) status.textContent = 'Ready to help';
        }
    }

    splitTextForBilingualTTS(text) {
        const raw = String(text || '');
        const segments = [];

        // Primary signal: Portuguese words/examples are typically bolded **like this**
        const boldRe = /\*\*([^*]+)\*\*/g;
        let lastIndex = 0;
        let match;

        while ((match = boldRe.exec(raw))) {
            if (match.index > lastIndex) {
                segments.push({ lang: 'en', text: raw.slice(lastIndex, match.index) });
            }
            segments.push({ lang: 'pt', text: match[1] });
            lastIndex = match.index + match[0].length;
        }
        if (lastIndex < raw.length) {
            segments.push({ lang: 'en', text: raw.slice(lastIndex) });
        }

        const ptChars = /[áàâãçéêíóôõúÁÀÂÃÇÉÊÍÓÔÕÚ]/;

        return segments
            .map((seg) => {
                const cleaned = this.normalizeTTSText(seg.text);
                const lang = seg.lang === 'en' && ptChars.test(cleaned) ? 'pt' : seg.lang;
                return { lang, text: cleaned };
            })
            .filter((seg) => seg.text.length > 0);
    }

    normalizeTTSText(text) {
        return String(text || '')
            // Strip markdown-ish wrappers that sound weird when spoken
            .replace(/`([^`]+)`/g, '$1')
            .replace(/\s+/g, ' ')
            .trim();
    }

    openVoiceSettings() {
        const voices = getAvailableVoices();
        const englishVoices = (voices.english || []).slice();
        const portugueseVoices = (voices.portugal || []).slice();

        const voiceMetaById = new Map((voices.all || []).map(v => [v.id, v]));

        const englishOptions = englishVoices
            .map(v => `<option value="${v.id}">${v.name} (${v.locale})</option>`)
            .join('');

        const portugueseOptions = portugueseVoices
            .map(v => `<option value="${v.id}">${v.name} (${v.locale})</option>`)
            .join('');

        const modal = createModal({
            id: 'aiVoiceSettingsModal',
            title: 'AI Voice Settings',
            content: `
                <div class="ai-voice-settings-content" style="color: var(--modal-text-color, #f3f4f6);">
                    <p style="margin:0 0 10px 0; color: inherit;">English explanations use an English voice. Portuguese examples/words use a native pt-PT voice (slower is better for learning).</p>

                    <label style="display:flex; gap:10px; align-items:center; margin:10px 0 6px 0; color: inherit;">
                        <input id="aiGenderLock" type="checkbox" ${this.genderLock === 'male' ? 'checked' : ''} />
                        <span style="color: inherit;">Lock voices to male (recommended for consistency)</span>
                    </label>

                    <label style="display:block; margin:10px 0 6px 0; color: inherit;">English voice</label>
                    <select id="aiEnglishVoiceSelect" class="modal-input" style="width:100%; background: var(--modal-input-bg, rgba(255,255,255,0.06)); color: var(--modal-input-text, #f9fafb); border: 1px solid var(--modal-input-border, rgba(255,255,255,0.18)); border-radius: 6px; padding: 8px;">
                        ${englishOptions || '<option value="">No English voices available</option>'}
                    </select>

                    <label style="display:block; margin:10px 0 6px 0; color: inherit;">Portuguese (pt-PT) voice</label>
                    <select id="aiPortugueseVoiceSelect" class="modal-input" style="width:100%; background: var(--modal-input-bg, rgba(255,255,255,0.06)); color: var(--modal-input-text, #f9fafb); border: 1px solid var(--modal-input-border, rgba(255,255,255,0.18)); border-radius: 6px; padding: 8px;">
                        ${portugueseOptions || '<option value="">No pt-PT voices available</option>'}
                    </select>

                    <label style="display:block; margin:10px 0 6px 0; color: inherit;">Portuguese speed (slower = clearer)</label>
                    <div style="display:flex; gap:10px; align-items:center; color: inherit;">
                        <input id="aiPortugueseRate" type="range" min="0.35" max="1.2" step="0.05" value="${this.portugueseRate}" style="flex:1;" />
                        <span id="aiPortugueseRateValue" style="min-width:48px; text-align:right; color: inherit;">${Number(this.portugueseRate).toFixed(2)}</span>
                    </div>

                    <p style="margin:6px 0 0 0; font-size:12px; color: inherit; opacity:0.85;">
                        Tip: 0.45-0.60 is great for "hear every letter" practice. Single-word Portuguese is auto-capped slower.
                    </p>

                    <div style="display:flex; gap:10px; margin-top:12px;">
                        <button class="modal-btn secondary" id="aiTestEnglishVoice" type="button">Test English</button>
                        <button class="modal-btn secondary" id="aiTestPortugueseVoice" type="button">Test pt-PT</button>
                    </div>
                </div>
            `,
            type: 'default',
            buttons: [
                { label: 'Cancel', action: 'close', variant: 'secondary' },
                { label: 'Save', action: 'save_voice_settings', variant: 'primary' }
            ]
        });

        modal.show();
        const el = modal.getElement();
        if (!el) return;

        const englishSelect = el.querySelector('#aiEnglishVoiceSelect');
        const portugueseSelect = el.querySelector('#aiPortugueseVoiceSelect');
        const rateInput = el.querySelector('#aiPortugueseRate');
        const rateValue = el.querySelector('#aiPortugueseRateValue');
        const genderLockInput = el.querySelector('#aiGenderLock');

        if (englishSelect && this.englishVoiceId) englishSelect.value = this.englishVoiceId;
        if (portugueseSelect && this.portugueseVoiceId) portugueseSelect.value = this.portugueseVoiceId;

        rateInput?.addEventListener('input', () => {
            if (rateValue) rateValue.textContent = Number(rateInput.value).toFixed(2);
        });

        el.querySelector('#aiTestEnglishVoice')?.addEventListener('click', async () => {
            const voice = englishSelect?.value || this.englishVoiceId;
            try {
                await speakEnglish('Hello! This is the English voice.', { voice });
            } catch {
                // ignore
            }
        });

        el.querySelector('#aiTestPortugueseVoice')?.addEventListener('click', async () => {
            const voice = portugueseSelect?.value || this.portugueseVoiceId;
            const rate = Number(rateInput?.value || this.portugueseRate);
            try {
                await speakPortuguese('Olá! Esta é a voz portuguesa.', { voice, rate });
            } catch {
                // ignore
            }
        });

        el.addEventListener('modalAction', (e) => {
            if (e.detail.action !== 'save_voice_settings') return;

            const genderLockEnabled = Boolean(genderLockInput?.checked);

            let newEnglishVoice = englishSelect?.value || DEFAULT_ENGLISH_VOICE;
            let newPortugueseVoice = portugueseSelect?.value || DEFAULT_PORTUGUESE_VOICE;
            const newPortugueseRate = Number(rateInput?.value || DEFAULT_PORTUGUESE_RATE);

            if (genderLockEnabled) {
                const enMeta = voiceMetaById.get(newEnglishVoice);
                const ptMeta = voiceMetaById.get(newPortugueseVoice);

                if (enMeta?.gender && enMeta.gender !== 'male') newEnglishVoice = DEFAULT_ENGLISH_VOICE;
                if (ptMeta?.gender && ptMeta.gender !== 'male') newPortugueseVoice = DEFAULT_PORTUGUESE_VOICE;
            }

            this.englishVoiceId = newEnglishVoice;
            this.portugueseVoiceId = newPortugueseVoice;
            this.portugueseRate = Number.isNaN(newPortugueseRate) ? DEFAULT_PORTUGUESE_RATE : newPortugueseRate;
            this.genderLock = genderLockEnabled ? 'male' : 'off';

            try {
                localStorage.setItem(`${this.userId}_ai_tts_enVoice`, this.englishVoiceId);
                localStorage.setItem(`${this.userId}_ai_tts_ptVoice`, this.portugueseVoiceId);
                localStorage.setItem(`${this.userId}_ai_tts_ptRate`, String(this.portugueseRate));
                localStorage.setItem(`${this.userId}_ai_tts_genderLock`, this.genderLock);
            } catch {
                // ignore
            }

            try {
                eventStream.track('ai_chat_setting', {
                    setting: 'voice',
                    enVoice: this.englishVoiceId,
                    ptVoice: this.portugueseVoiceId,
                    ptRate: this.portugueseRate
                });
            } catch {
                // ignore
            }

            this.addSystemMessage('✅ Voice settings saved.');
            modal.destroy();
        });
    }
    
    /**
     * Parse AI response and add inline audio buttons for Portuguese words
     * @param {string} content - AI response content
     * @returns {string} HTML with audio buttons added
     */
    parseResponseForAudio(content) {
        // Find Portuguese words marked with ** (bold)
        // e.g., **obrigado** becomes clickable with audio
        return content.replace(/\*\*([a-záàâãéêíóôõúçñ]+)\*\*/gi, (match, word) => {
            const escaped = word.replace(/'/g, "\\'");
            return `<strong class="portuguese-word" data-word="${word}">${word} <button class="inline-audio-btn" onclick="window.playPortugueseWord('${escaped}')" title="Listen to pronunciation">🔊</button></strong>`;
        });
    }
    
    /**
     * Start pronunciation assessment for a specific word
     * Called when AI asks user to pronounce something
     * @param {string} wordToPronounce - Portuguese word to assess
     */
    async assessPronunciation(wordToPronounce) {
        if (!wordToPronounce) return;
        
        // Check if voice recognition is available
        if (!isWebSpeechAvailable()) {
            this.addMessageToUI('assistant', '⚠️ Voice recognition is not available. Cannot assess pronunciation.');
            return;
        }
        
        this.isAssessingPronunciation = true;
        
        // Show prompt
        this.addSystemMessage(`🎤 Say "**${wordToPronounce}**" in Portuguese`);
        
        // Play the correct pronunciation first
        try {
            await speakPortuguese(wordToPronounce, { voice: this.portugueseVoiceId, rate: this.portugueseRate });
        } catch (error) {
            Logger.warn('ai_chat', 'Failed to play example pronunciation', { error: error.message });
        }
        
        // Wait a moment then listen
        await new Promise(r => setTimeout(r, 800));
        
        // Show listening indicator
        this.showInterimTranscript();
        const status = document.getElementById('aiStatus');
        if (status) status.textContent = 'Your turn - speak now...';
        
        try {
            // Listen for user attempt - use Portuguese recognition for pronunciation assessment
            const result = await this.webSpeechService.listen(8000, { language: 'pt-PT' });
            this.hideInterimTranscript();
            
            if (!result.text || !result.text.trim()) {
                this.addMessageToUI('assistant', "I didn't hear anything. Click 🎤 to try the pronunciation assessment again.");
                return;
            }
            
            // Show what user said
            this.addMessageToUI('user', result.text);
            
            // Assess pronunciation
            const assessment = this.pronunciationAssessor.assess(wordToPronounce, result.text);
            
            // Display feedback
            this.showPronunciationFeedback(assessment);
            
            // Log for AI learning
            if (eventStream && eventStream.emit) {
                eventStream.emit('pronunciation_assessment', {
                    word: wordToPronounce,
                    userAttempt: result.text,
                    score: assessment.score,
                    errors: assessment.errors,
                    timestamp: Date.now()
                });
            }
            
            // If score is low, play correct pronunciation again
            if (assessment.feedback.playAudio) {
                await new Promise(r => setTimeout(r, 500));
                await speakPortuguese(wordToPronounce, { voice: this.portugueseVoiceId, rate: this.portugueseRate });
            }
            
        } catch (error) {
            this.hideInterimTranscript();
            Logger.error('ai_chat', 'Pronunciation assessment failed', { error: error.message });
            this.addMessageToUI('assistant', `Error: ${error.message || 'Could not complete assessment'}`);
        } finally {
            this.isAssessingPronunciation = false;
            if (status) status.textContent = 'Ready to help';
        }
    }
    
    /**
     * Display pronunciation feedback in the chat
     * @param {Object} assessment - Assessment result from PronunciationAssessor
     */
    showPronunciationFeedback(assessment) {
        const levelClass = assessment.feedback.level || 'fair';
        const feedbackHTML = `
            <div class="pronunciation-feedback ${levelClass}">
                <div class="score-badge">
                    <span class="emoji">${assessment.feedback.emoji}</span>
                    <span class="score">${assessment.score}%</span>
                </div>
                <p class="feedback-text">${assessment.feedback.overall}</p>
                ${assessment.feedback.tips && assessment.feedback.tips.length > 0 ? `
                    <ul class="feedback-tips">
                        ${assessment.feedback.tips.map(tip => `<li>${tip}</li>`).join('')}
                    </ul>
                ` : ''}
                <button class="replay-btn" onclick="window.playPortugueseWord('${assessment.expected.replace(/'/g, "\\'")}')">
                    🔊 Hear correct pronunciation
                </button>
            </div>
        `;
        
        this.addMessageHTML('assistant', feedbackHTML);
    }
    
    /**
     * Add a system message (different styling)
     * @param {string} content - Message content
     */
    addSystemMessage(content) {
        const messagesContainer = document.getElementById('aiMessages');
        if (!messagesContainer) return;
        
        const messageEl = document.createElement('div');
        messageEl.className = 'ai-message system';
        messageEl.innerHTML = `<div class="message-content">${this.formatMessageWithAudio(content)}</div>`;
        
        messagesContainer.appendChild(messageEl);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
    
    /**
     * Add raw HTML message to UI
     * @param {string} role - Message role ('user', 'assistant', 'system')
     * @param {string} html - HTML content
     */
    addMessageHTML(role, html) {
        const messagesContainer = document.getElementById('aiMessages');
        if (!messagesContainer) return;
        
        const messageEl = document.createElement('div');
        messageEl.className = `ai-message ${role}`;
        messageEl.innerHTML = `<div class="message-content">${html}</div>`;
        
        messagesContainer.appendChild(messageEl);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    toggleMinimize() {
        const widget = document.getElementById('aiChatWidget');
        widget?.classList.toggle('minimized');
    }

    show() {
        const widget = document.getElementById('aiChatWidget');
        if (widget) {
            widget.style.display = 'flex';
            widget.classList.remove('minimized');
        }
    }

    hide() {
        const widget = document.getElementById('aiChatWidget');
        if (widget) widget.style.display = 'none';
    }

    // Inject context about current word/lesson
    injectContext(context) {
        if (this.agent) {
            this.agent.injectContext(context);
        }
    }

    /**
     * Cleanup resources when the chat is unloaded
     */
    destroy() {
        this.stopTTSBadgePolling();
        this.stopHandsFreeMode();
        this.stopVoiceMode();
        if (this.container) {
            this.container.innerHTML = '';
        }
    }
}

// ============================================================================
// Global Functions
// ============================================================================

/**
 * Global function to play Portuguese word pronunciation
 * Called from inline audio buttons in AI responses
 * @param {string} word - Portuguese word to pronounce
 */
window.playPortugueseWord = async (word) => {
    try {
        Logger.debug('ai_chat', 'Playing Portuguese word', { word });
        const chat = getAIChat();
        if (chat?.isInitialized) {
            await speakPortuguese(word, { voice: chat.portugueseVoiceId, rate: chat.portugueseRate });
        } else {
            await speakPortuguese(word);
        }
    } catch (error) {
        Logger.error('ai_chat', 'Failed to play word pronunciation', { word, error: error.message });
        console.warn('Failed to play word:', word, error);
    }
};

/**
 * Global function to start pronunciation assessment
 * Can be triggered from AI responses
 * @param {string} word - Portuguese word to assess
 */
window.assessPronunciation = async (word) => {
    const chat = getAIChat();
    if (chat && chat.isInitialized) {
        await chat.assessPronunciation(word);
    } else {
        console.warn('AI Chat not initialized, cannot assess pronunciation');
    }
};

// ============================================================================
// Singleton Instance
// ============================================================================

let chatInstance = null;

export function getAIChat() {
    if (!chatInstance) {
        chatInstance = new AIChatComponent();
    }
    return chatInstance;
}

export async function initAIChat(userId, containerId = 'aiChatContainer') {
    const chat = getAIChat();
    await chat.initialize(userId);
    chat.render(containerId);
    return chat;
}

export default AIChatComponent;
