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
import { speak, speakPortuguese, stop as stopTTS, isSpeaking } from '../../services/TTSService.js';
import { getPronunciationAssessor } from '../../services/PronunciationAssessor.js';
import * as Logger from '../../services/Logger.js';
import { eventStream } from '../../services/eventStreaming.js';

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
        this.isInitialized = false;
        this.isProcessing = false;
        this.isVoiceMode = false;
        this.isListening = false;
        this.isAssessingPronunciation = false;
        this.container = null;
        this.userId = null;
        this.lastAIResponse = null;
        this.interimTranscriptElement = null;
    }

    async initialize(userId = 'default') {
        this.userId = userId;
        
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
                    <div class="ai-header-actions">
                        <button class="ai-voice-toggle" id="aiVoiceToggle" title="Toggle voice mode">🎤</button>
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
        this.addWelcomeMessage();
        
        return this.container;
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
                background: var(--card-bg, #1e1e2e);
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
            
            .ai-chat-messages {
                flex: 1;
                overflow-y: auto;
                padding: 16px;
                display: flex;
                flex-direction: column;
                gap: 12px;
                max-height: 300px;
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
                background: var(--bg-secondary, #2a2a3e);
                border-bottom-left-radius: 4px;
            }
            
            .ai-message.user .message-content {
                background: var(--primary, #667eea);
                color: white;
                border-bottom-right-radius: 4px;
            }
            
            .ai-message.assistant .message-content strong {
                color: var(--primary, #667eea);
            }
            
            .ai-suggestions {
                display: flex;
                flex-wrap: wrap;
                gap: 8px;
                padding: 8px 16px;
                border-top: 1px solid var(--border, #333);
            }
            
            .ai-suggestion {
                padding: 6px 12px;
                background: var(--bg-secondary, #2a2a3e);
                border: 1px solid var(--border, #444);
                border-radius: 16px;
                font-size: 12px;
                cursor: pointer;
                transition: all 0.2s;
                color: var(--text, #e0e0e0);
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
                border-top: 1px solid var(--border, #333);
            }
            
            .ai-chat-input textarea {
                flex: 1;
                background: var(--bg-secondary, #2a2a3e);
                border: 1px solid var(--border, #444);
                border-radius: 20px;
                padding: 10px 16px;
                font-size: 14px;
                color: var(--text, #e0e0e0);
                resize: none;
                max-height: 100px;
                font-family: inherit;
            }
            
            .ai-chat-input textarea:focus {
                outline: none;
                border-color: var(--primary, #667eea);
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
        const voiceToggle = document.getElementById('aiVoiceToggle');
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

    async sendMessage() {
        const input = document.getElementById('aiInput');
        const message = input?.value.trim();
        
        if (!message || this.isProcessing) return;
        
        input.value = '';
        input.style.height = 'auto';
        
        // Add user message to UI
        this.addMessageToUI('user', message);
        
        // Track event (non-blocking)
        try {
            eventStream.track('ai_chat_message', { 
                messageLength: message.length,
                source: 'text'
            });
        } catch (e) {
            // Event tracking failed - continue anyway
        }
        
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
                
                // Speak response if in voice mode
                if (this.isVoiceMode && this.voiceConversation) {
                    await this.voiceConversation.speakText(result.response);
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
        }
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
        if (status) status.textContent = 'Listening... Speak now';
        
        // Show interim transcript element
        this.showInterimTranscript();
        
        // Set up interim result listener
        const interimUnsub = this.webSpeechService.on(RECOGNITION_EVENTS.INTERIM_RESULT, (interim) => {
            this.updateInterimTranscript(interim.text);
        });
        
        try {
            Logger.info('ai_chat', 'Starting voice recognition');
            
            // Listen for speech (10 second timeout)
            const result = await this.webSpeechService.listen(10000);
            
            // Hide interim transcript
            this.hideInterimTranscript();
            interimUnsub(); // Clean up listener
            
            if (result.text && result.text.trim()) {
                Logger.info('ai_chat', 'Voice input received', { text: result.text, confidence: result.confidence });
                
                // Show what user said
                this.addMessageToUI('user', result.text);
                
                // Update status
                if (status) status.textContent = 'Processing...';
                
                // Send to AI
                await this.sendMessage(result.text);
                
                // Speak the AI response if we got one
                if (this.lastAIResponse && this.isVoiceMode) {
                    await this.speakAIResponse(this.lastAIResponse);
                }
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
            voiceToggle?.classList.add('speaking');
            voiceToggle?.classList.remove('listening');
            if (status) status.textContent = 'Speaking...';
            
            // Use Edge-TTS with European Portuguese voice
            await speakPortuguese(text, {
                onStart: () => Logger.debug('ai_chat', 'TTS started'),
                onEnd: () => Logger.debug('ai_chat', 'TTS ended')
            });
        } catch (error) {
            Logger.warn('ai_chat', 'TTS failed, response displayed as text only', { error: error.message });
        } finally {
            voiceToggle?.classList.remove('speaking');
            if (status) status.textContent = 'Ready to help';
        }
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
            await speakPortuguese(wordToPronounce);
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
            // Listen for user attempt
            const result = await this.webSpeechService.listen(8000);
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
                await speakPortuguese(wordToPronounce);
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
        await speakPortuguese(word);
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
