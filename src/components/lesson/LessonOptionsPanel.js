/**
 * LessonOptionsPanel Component
 * 
 * Right-side panel with expandable sections for lesson content.
 * Uses Accordion component for single-open behavior.
 * 
 * Sections:
 * - Pronunciation Guide: IPA, tips, audio controls
 * - Remember It: Etymology, memory tricks
 * - Example Sentences: Context-rich examples
 * - Grammar Notes: Rules, conjugations, patterns
 * - When to Use: Formality, context, alternatives
 * - Cultural Insight: Portugal-specific usage
 * - AI Tips: Dynamic, personalized suggestions
 * 
 * @phase Phase 4 - Lesson Layout & Options Panel
 * @module components/lesson/LessonOptionsPanel
 */

import { createAccordion } from '../common/Accordion.js';
import * as Logger from '../../services/Logger.js';

// Section configuration
const SECTION_CONFIG = {
    pronunciation: {
        id: 'pronunciation',
        title: 'Pronunciation',
        icon: '🔊',
        defaultOpen: true,
        dataKey: 'pronunciation'
    },
    memory: {
        id: 'memory',
        title: 'Remember It',
        icon: '💡',
        defaultOpen: false,
        dataKey: 'memory'
    },
    examples: {
        id: 'examples',
        title: 'Example Sentences',
        icon: '📝',
        defaultOpen: false,
        dataKey: 'examples'
    },
    grammar: {
        id: 'grammar',
        title: 'Grammar Notes',
        icon: '📖',
        defaultOpen: false,
        dataKey: 'grammar'
    },
    usage: {
        id: 'usage',
        title: 'When to Use',
        icon: '🎯',
        defaultOpen: false,
        dataKey: 'usage'
    },
    cultural: {
        id: 'cultural',
        title: 'Cultural Insight',
        icon: '🇵🇹',
        defaultOpen: false,
        dataKey: 'cultural'
    },
    aiTips: {
        id: 'aiTips',
        title: 'AI Tips',
        icon: '🤖',
        defaultOpen: false,
        dataKey: 'aiTips',
        dynamic: true
    }
};

// Section order
const SECTION_ORDER = [
    'pronunciation',
    'memory',
    'examples',
    'grammar',
    'usage',
    'cultural',
    'aiTips'
];

/**
 * Content renderers for each section type
 */
const contentRenderers = {
    /**
     * Render pronunciation content
     */
    pronunciation(data) {
        if (!data) return '<p class="no-content">No pronunciation guide available</p>';
        
        const { ipa, guide, tip, audioSrc } = data;
        let html = '';
        
        if (ipa) {
            html += `<div class="ipa">${ipa}</div>`;
        }
        
        if (guide) {
            html += `<div class="pronunciation-guide">${guide}</div>`;
        }
        
        if (tip) {
            html += `<div class="tip">💡 ${tip}</div>`;
        }
        
        if (audioSrc) {
            html += `
                <button class="audio-btn" data-audio="${audioSrc}" aria-label="Play pronunciation">
                    🔊 Listen
                </button>
            `;
        }
        
        return html || '<p class="no-content">No pronunciation guide available</p>';
    },

    /**
     * Render memory/etymology content
     */
    memory(data) {
        if (!data) return '<p class="no-content">No memory aids available</p>';
        
        const { etymology, trick, mnemonic } = data;
        let html = '';
        
        if (etymology) {
            html += `<div class="etymology"><strong>Origin:</strong> ${etymology}</div>`;
        }
        
        if (trick || mnemonic) {
            html += `<div class="memory-trick">${trick || mnemonic}</div>`;
        }
        
        return html || '<p class="no-content">No memory aids available</p>';
    },

    /**
     * Render example sentences
     */
    examples(data) {
        if (!data || !Array.isArray(data) || data.length === 0) {
            return '<p class="no-content">No examples available</p>';
        }
        
        const examplesHtml = data.map(ex => `
            <div class="example-item">
                <div class="example-pt">${ex.pt || ex.portuguese || ex.text}</div>
                <div class="example-en">${ex.en || ex.english || ex.translation}</div>
            </div>
        `).join('');
        
        return `<div class="examples-list">${examplesHtml}</div>`;
    },

    /**
     * Render grammar notes
     */
    grammar(data) {
        if (!data) return '<p class="no-content">No grammar notes available</p>';
        
        // Handle string or object
        if (typeof data === 'string') {
            return `<div class="grammar-note">${data}</div>`;
        }
        
        const { note, rules, conjugation, pattern } = data;
        let html = '';
        
        if (note) {
            html += `<div class="grammar-note">${note}</div>`;
        }
        
        if (rules && Array.isArray(rules)) {
            html += `<ul class="grammar-rules">`;
            rules.forEach(rule => {
                html += `<li>${rule}</li>`;
            });
            html += `</ul>`;
        }
        
        if (conjugation) {
            html += `<div class="conjugation-table">${conjugation}</div>`;
        }
        
        if (pattern) {
            html += `<div class="grammar-pattern"><strong>Pattern:</strong> ${pattern}</div>`;
        }
        
        return html || '<p class="no-content">No grammar notes available</p>';
    },

    /**
     * Render usage context
     */
    usage(data) {
        if (!data) return '<p class="no-content">No usage information available</p>';
        
        const { formality, context, alternatives, whenToUse } = data;
        let html = '';
        
        if (formality) {
            const formalityClass = formality.toLowerCase();
            html += `
                <div class="usage-formality">
                    <span class="badge badge-${formalityClass}">${formality}</span>
                </div>
            `;
        }
        
        if (context || whenToUse) {
            html += `<div class="usage-context">${context || whenToUse}</div>`;
        }
        
        if (alternatives && Array.isArray(alternatives)) {
            html += `<div class="usage-alt"><strong>Alternatives:</strong> ${alternatives.join(', ')}</div>`;
        }
        
        return html || '<p class="no-content">No usage information available</p>';
    },

    /**
     * Render cultural insight
     */
    cultural(data) {
        if (!data) return '<p class="no-content">No cultural insight available</p>';
        
        // Handle string or object
        const insight = typeof data === 'string' ? data : (data.insight || data.note || data.text);
        
        if (!insight) return '<p class="no-content">No cultural insight available</p>';
        
        return `<div class="cultural-note">${insight}</div>`;
    },

    /**
     * Render AI tips (dynamic content)
     */
    aiTips(data, isLoading = false) {
        if (isLoading) {
            return `
                <div class="ai-tips-content">
                    <div class="ai-loading">Analyzing your learning patterns...</div>
                </div>
            `;
        }
        
        if (!data || (Array.isArray(data) && data.length === 0)) {
            return `
                <div class="ai-tips-content">
                    <p class="ai-placeholder">Complete a few exercises to get personalized tips!</p>
                </div>
            `;
        }
        
        // Handle array or single tip
        const tips = Array.isArray(data) ? data : [data];
        
        const tipsHtml = tips.map(tip => {
            const tipText = typeof tip === 'string' ? tip : (tip.tip || tip.text || tip.message);
            return `<div class="ai-tip-item">${tipText}</div>`;
        }).join('');
        
        return `<div class="ai-tips-content">${tipsHtml}</div>`;
    }
};

/**
 * LessonOptionsPanel Class
 */
export class LessonOptionsPanel {
    /**
     * Create a lesson options panel
     * @param {HTMLElement|string} container - Container element or selector
     * @param {Object} options - Configuration options
     */
    constructor(container, options = {}) {
        this.container = typeof container === 'string'
            ? document.querySelector(container)
            : container;
        
        if (!this.container) {
            throw new Error('LessonOptionsPanel: Container element not found');
        }
        
        this.options = {
            singleOpen: true,
            defaultSection: 'pronunciation',
            persistLastOpen: true,
            storageKey: 'lessonOptionsLastOpen',
            showHeader: true,
            headerTitle: '📖 Learning Options',
            onSectionChange: null,
            onAudioPlay: null,
            ...options
        };
        
        this.accordion = null;
        this.wordData = null;
        this.aiTipsLoading = false;
        this.eventListeners = [];
        
        this.init();
    }
    
    /**
     * Initialize the panel
     */
    init() {
        this.container.classList.add('lesson-options-panel');
        this.render();
        this.bindEvents();
        
        Logger.debug('LessonOptionsPanel', 'Initialized');
    }
    
    /**
     * Render the panel structure
     */
    render() {
        // Create header if enabled
        let headerHtml = '';
        if (this.options.showHeader) {
            headerHtml = `
                <div class="lesson-options-header">
                    ${this.options.headerTitle}
                </div>
            `;
        }
        
        // Create body
        this.container.innerHTML = `
            ${headerHtml}
            <div class="lesson-options-body">
                <div class="accordion" id="lesson-options-accordion"></div>
            </div>
        `;
        
        // Get last open section from storage
        let defaultOpen = this.options.defaultSection;
        if (this.options.persistLastOpen) {
            const stored = localStorage.getItem(this.options.storageKey);
            if (stored && SECTION_CONFIG[stored]) {
                defaultOpen = stored;
            }
        }
        
        // Create accordion sections
        const accordionContainer = this.container.querySelector('#lesson-options-accordion');
        const sections = SECTION_ORDER.map(sectionId => {
            const config = SECTION_CONFIG[sectionId];
            return {
                id: config.id,
                title: config.title,
                icon: config.icon,
                content: this.getSectionPlaceholder(sectionId),
                defaultOpen: config.id === defaultOpen
            };
        });
        
        // Initialize accordion
        this.accordion = createAccordion(accordionContainer, {
            sections,
            singleOpen: this.options.singleOpen,
            animated: true
        });
        
        // Listen for section changes
        this.accordion.on('change', (data) => {
            const { sectionId, isOpen } = data;
            
            // Save last open section
            if (isOpen && this.options.persistLastOpen) {
                localStorage.setItem(this.options.storageKey, sectionId);
            }
            
            // Notify callback
            if (this.options.onSectionChange) {
                this.options.onSectionChange(sectionId, isOpen);
            }
            
            Logger.debug('LessonOptionsPanel', `Section ${sectionId} ${isOpen ? 'opened' : 'closed'}`);
        });
    }
    
    /**
     * Get placeholder content for a section
     * @param {string} sectionId - Section identifier
     * @returns {string} Placeholder HTML
     */
    getSectionPlaceholder(sectionId) {
        const config = SECTION_CONFIG[sectionId];
        if (config.dynamic) {
            return contentRenderers[sectionId](null, true);
        }
        return `<p class="loading-placeholder">Select a word to see ${config.title.toLowerCase()}...</p>`;
    }
    
    /**
     * Update panel with word data
     * @param {Object} data - Word data object
     */
    setWordData(data) {
        if (!data) {
            Logger.warn('LessonOptionsPanel', 'No word data provided');
            return;
        }
        
        this.wordData = data;
        
        // Update each section
        SECTION_ORDER.forEach(sectionId => {
            const config = SECTION_CONFIG[sectionId];
            const sectionData = data[config.dataKey];
            
            // Skip AI tips - handled separately
            if (config.dynamic) return;
            
            const content = contentRenderers[sectionId](sectionData);
            this.accordion.updateContent(sectionId, content);
        });
        
        // Request AI tips
        this.loadAITips(data);
        
        Logger.debug('LessonOptionsPanel', 'Word data updated', { word: data.word || data.pt });
    }
    
    /**
     * Load AI tips for current word
     * @param {Object} wordData - Word data
     */
    async loadAITips(wordData) {
        // Show loading state
        this.aiTipsLoading = true;
        this.accordion.updateContent('aiTips', contentRenderers.aiTips(null, true));
        
        try {
            // Try to get AI tips from event streaming or AI service
            const tips = await this.fetchAITips(wordData);
            this.accordion.updateContent('aiTips', contentRenderers.aiTips(tips));
        } catch (error) {
            Logger.warn('LessonOptionsPanel', 'Failed to load AI tips', error);
            this.accordion.updateContent('aiTips', contentRenderers.aiTips(null));
        } finally {
            this.aiTipsLoading = false;
        }
    }
    
    /**
     * Fetch AI tips (placeholder for integration)
     * @param {Object} wordData - Word data
     * @returns {Promise<Array>} AI tips
     */
    async fetchAITips(wordData) {
        // This will be integrated with AIService and eventStreaming
        // For now, return placeholder
        return new Promise((resolve) => {
            setTimeout(() => {
                // Simulate AI response based on word data
                const tips = [];
                
                if (wordData?.difficulty === 'hard' || wordData?.userStruggling) {
                    tips.push({
                        tip: "You've been practicing this word - try using it in a sentence out loud!"
                    });
                }
                
                if (wordData?.pronunciation?.tip) {
                    tips.push({
                        tip: `Focus on: ${wordData.pronunciation.tip}`
                    });
                }
                
                if (tips.length === 0) {
                    tips.push({
                        tip: "Complete more exercises to unlock personalized learning tips!"
                    });
                }
                
                resolve(tips);
            }, 500);
        });
    }
    
    /**
     * Update AI tips dynamically
     * @param {Array} tips - New AI tips
     */
    updateAITips(tips) {
        this.accordion.updateContent('aiTips', contentRenderers.aiTips(tips));
        Logger.debug('LessonOptionsPanel', 'AI tips updated', { count: tips?.length });
    }
    
    /**
     * Bind event listeners
     */
    bindEvents() {
        // Audio button clicks
        const handleAudioClick = (e) => {
            const audioBtn = e.target.closest('.audio-btn');
            if (audioBtn) {
                const audioSrc = audioBtn.dataset.audio;
                if (this.options.onAudioPlay) {
                    this.options.onAudioPlay(audioSrc);
                }
                Logger.debug('LessonOptionsPanel', 'Audio play requested', { src: audioSrc });
            }
        };
        
        this.container.addEventListener('click', handleAudioClick);
        this.eventListeners.push(['click', handleAudioClick]);
        
        // Mobile drawer toggle
        const header = this.container.querySelector('.lesson-options-header');
        if (header) {
            const handleHeaderClick = () => {
                if (window.innerWidth <= 767) {
                    this.container.classList.toggle('expanded');
                }
            };
            header.addEventListener('click', handleHeaderClick);
            this.eventListeners.push(['click', handleHeaderClick, header]);
        }
    }
    
    /**
     * Open a specific section
     * @param {string} sectionId - Section to open
     */
    openSection(sectionId) {
        if (this.accordion) {
            this.accordion.open(sectionId);
        }
    }
    
    /**
     * Close a specific section
     * @param {string} sectionId - Section to close
     */
    closeSection(sectionId) {
        if (this.accordion) {
            this.accordion.close(sectionId);
        }
    }
    
    /**
     * Toggle mobile drawer expanded state
     * @param {boolean} [expanded] - Force state
     */
    toggleDrawer(expanded) {
        if (expanded === undefined) {
            this.container.classList.toggle('expanded');
        } else {
            this.container.classList.toggle('expanded', expanded);
        }
    }
    
    /**
     * Get current open section
     * @returns {string|null} Open section ID
     */
    getOpenSection() {
        return this.accordion?.getOpenSections()[0] || null;
    }
    
    /**
     * Check if panel is in mobile drawer mode
     * @returns {boolean}
     */
    isMobileMode() {
        return window.innerWidth <= 767;
    }
    
    /**
     * Destroy the panel
     */
    destroy() {
        // Remove event listeners
        this.eventListeners.forEach(([event, handler, target]) => {
            (target || this.container).removeEventListener(event, handler);
        });
        this.eventListeners = [];
        
        // Destroy accordion
        if (this.accordion) {
            this.accordion.destroy();
        }
        
        // Clear container
        this.container.innerHTML = '';
        this.container.classList.remove('lesson-options-panel', 'expanded');
        
        Logger.debug('LessonOptionsPanel', 'Destroyed');
    }
}

/**
 * Factory function to create LessonOptionsPanel
 * @param {HTMLElement|string} container - Container element or selector
 * @param {Object} options - Configuration options
 * @returns {LessonOptionsPanel} Panel instance
 */
export function createLessonOptionsPanel(container, options = {}) {
    return new LessonOptionsPanel(container, options);
}

// Export section config for external use
export { SECTION_CONFIG, SECTION_ORDER, contentRenderers };

export default LessonOptionsPanel;
