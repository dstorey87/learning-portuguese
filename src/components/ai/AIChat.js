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
        this.messages = [];
        this.isInitialized = false;
        this.isProcessing = false;
        this.isVoiceMode = false;
        this.isListening = false;
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
        
        const messageEl = document.createElement('div');
        messageEl.className = `ai-message ${role}`;
        messageEl.innerHTML = `<div class="message-content">${this.formatMessage(content)}</div>`;
        
        messagesContainer.appendChild(messageEl);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
        
        // Store message
        this.messages.push({ role, content, timestamp: Date.now() });
        
        // Trim old messages
        if (this.messages.length > CHAT_CONFIG.maxMessages) {
            this.messages = this.messages.slice(-CHAT_CONFIG.maxMessages);
        }
    }

    formatMessage(content) {
        // Convert markdown-like formatting
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

    async toggleVoiceMode() {
        const voiceToggle = document.getElementById('aiVoiceToggle');
        const voiceIndicator = document.getElementById('aiVoiceIndicator');
        const input = document.getElementById('aiInput');
        
        if (!this.voiceConversation) {
            this.addMessageToUI('assistant', 'Voice mode is not available. Please check your microphone settings.');
            return;
        }
        
        this.isVoiceMode = !this.isVoiceMode;
        voiceToggle?.classList.toggle('active', this.isVoiceMode);
        
        if (this.isVoiceMode) {
            // Start voice conversation
            voiceIndicator.style.display = 'flex';
            input.style.display = 'none';
            
            await this.voiceConversation.start({
                onTranscript: (text) => {
                    this.addMessageToUI('user', text);
                },
                onResponse: (text) => {
                    this.addMessageToUI('assistant', text);
                },
                onSpeaking: (who) => {
                    const status = document.getElementById('aiStatus');
                    if (status) status.textContent = who === 'user' ? 'Listening...' : 'Speaking...';
                },
                onListening: () => {
                    const status = document.getElementById('aiStatus');
                    if (status) status.textContent = 'Listening...';
                },
                onError: (error) => {
                    this.addMessageToUI('assistant', `Voice error: ${error}`);
                }
            });
        } else {
            // Stop voice conversation
            this.voiceConversation.stop();
            voiceIndicator.style.display = 'none';
            input.style.display = 'block';
            
            const status = document.getElementById('aiStatus');
            if (status) status.textContent = 'Ready to help';
        }
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

// Singleton instance
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
