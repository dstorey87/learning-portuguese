/**
 * AI Chat Entry Point
 * 
 * Initializes the AI Chat widget as a floating button that can be
 * clicked to open the chat panel. This integrates with the existing app.
 */

import { initAIChat } from './src/components/ai/AIChat.js';
import * as Logger from './src/services/Logger.js';
import { eventStream } from './src/services/eventStreaming.js';

// Configuration
const AI_CHAT_CONFIG = {
    enabled: true,
    userId: 'default-user',
    position: 'bottom-right',
    autoShow: false
};

// State
let chatWidget = null;
let fabButton = null;

/**
 * Create the floating action button to open chat
 */
function createChatFAB() {
    // Check if already exists
    if (document.getElementById('aiChatFab')) return;
    
    const fab = document.createElement('button');
    fab.id = 'aiChatFab';
    fab.className = 'ai-chat-fab';
    fab.innerHTML = `
        <span class="fab-icon">🤖</span>
        <span class="fab-label">AI Tutor</span>
    `;
    fab.setAttribute('aria-label', 'Open AI Tutor chat');
    fab.setAttribute('title', 'Ask the AI Tutor');
    
    // Add styles
    addFabStyles();
    
    document.body.appendChild(fab);
    fabButton = fab;
    
    // Click handler
    fab.addEventListener('click', toggleChat);
    
    return fab;
}

/**
 * Add FAB styles
 */
function addFabStyles() {
    if (document.getElementById('ai-fab-styles')) return;
    
    const styles = document.createElement('style');
    styles.id = 'ai-fab-styles';
    styles.textContent = `
        .ai-chat-fab {
            position: fixed;
            bottom: 80px;
            right: 20px;
            width: auto;
            height: 48px;
            padding: 0 16px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border: none;
            border-radius: 24px;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 8px;
            z-index: 999;
            box-shadow: 0 4px 20px rgba(102, 126, 234, 0.4);
            transition: all 0.3s ease;
            font-family: 'Nunito', sans-serif;
            color: white;
        }
        
        .ai-chat-fab:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 25px rgba(102, 126, 234, 0.5);
        }
        
        .ai-chat-fab.hidden {
            transform: translateY(100px);
            opacity: 0;
            pointer-events: none;
        }
        
        .fab-icon {
            font-size: 24px;
        }
        
        .fab-label {
            font-size: 14px;
            font-weight: 600;
        }
        
        @media (max-width: 480px) {
            .ai-chat-fab {
                bottom: 70px;
                right: 10px;
                padding: 0 12px;
                height: 44px;
            }
            
            .fab-label {
                display: none;
            }
        }
        
        /* Chat container positioning */
        #aiChatContainer {
            position: fixed;
            bottom: 80px;
            right: 20px;
            z-index: 1000;
        }
    `;
    document.head.appendChild(styles);
}

/**
 * Toggle chat visibility
 */
async function toggleChat() {
    const container = document.getElementById('aiChatContainer');
    
    if (!chatWidget) {
        // Initialize chat on first open
        try {
            fabButton?.classList.add('hidden');
            chatWidget = await initAIChat(AI_CHAT_CONFIG.userId, 'aiChatContainer');
            
            // Show the container after initialization
            if (container) {
                container.style.display = 'block';
            }
            
            // Track event (non-blocking)
            try {
                eventStream.track('ai_chat_opened', { source: 'fab' });
            } catch (e) {
                // Event tracking failed - continue anyway
            }
            
            Logger.info('ai_chat', 'AI Chat initialized and opened');
        } catch (error) {
            Logger.error('ai_chat', 'Failed to initialize chat', { error: error.message });
            fabButton?.classList.remove('hidden');
            return;
        }
    } else if (container) {
        // Toggle visibility
        const isVisible = container.style.display !== 'none';
        container.style.display = isVisible ? 'none' : 'block';
        fabButton?.classList.toggle('hidden', !isVisible);
        
        // Track event (non-blocking)
        try {
            eventStream.track(isVisible ? 'ai_chat_closed' : 'ai_chat_opened', { source: 'fab' });
        } catch (e) {
            // Event tracking failed - continue anyway
        }
    }
}

/**
 * Show chat programmatically
 */
function showChat() {
    if (!chatWidget) {
        toggleChat();
    } else {
        const container = document.getElementById('aiChatContainer');
        if (container) {
            container.style.display = 'block';
            fabButton?.classList.add('hidden');
        }
    }
}

/**
 * Hide chat programmatically
 */
function hideChat() {
    const container = document.getElementById('aiChatContainer');
    if (container) {
        container.style.display = 'none';
        fabButton?.classList.remove('hidden');
    }
}

/**
 * Send a context-aware message to the AI
 */
function sendContextMessage(message, context) {
    if (chatWidget) {
        chatWidget.injectContext(context);
        // Could also auto-send the message
    }
}

/**
 * Initialize AI Chat system
 */
async function initAIChatSystem(config = {}) {
    Object.assign(AI_CHAT_CONFIG, config);
    
    // Create the container for the chat widget
    if (!document.getElementById('aiChatContainer')) {
        const container = document.createElement('div');
        container.id = 'aiChatContainer';
        container.style.display = 'none';
        document.body.appendChild(container);
    }
    
    // Create the FAB
    createChatFAB();
    
    // If autoShow is true, open the chat
    if (AI_CHAT_CONFIG.autoShow) {
        await toggleChat();
    }
    
    Logger.info('ai_chat', 'AI Chat system initialized', { config: AI_CHAT_CONFIG });
    
    return {
        show: showChat,
        hide: hideChat,
        toggle: toggleChat,
        sendContext: sendContextMessage
    };
}

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        // Delay slightly to let the main app load first
        setTimeout(() => initAIChatSystem(), 500);
    });
} else {
    setTimeout(() => initAIChatSystem(), 500);
}

// Export for external use
export { initAIChatSystem, showChat, hideChat, toggleChat, sendContextMessage };

// Expose to window for debugging
if (typeof window !== 'undefined') {
    window.aiChat = {
        init: initAIChatSystem,
        show: showChat,
        hide: hideChat,
        toggle: toggleChat,
        sendContext: sendContextMessage
    };
}
