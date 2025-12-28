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
 * @phase Phase 4 - Lesson Layout & Options Panel (LP-006, LP-007)
 * @module components/lesson/LessonOptionsPanel
 */

import { createAccordion } from '../common/Accordion.js';
import * as Logger from '../../services/Logger.js';
import { eventStream } from '../../services/eventStreaming.js';
import { createLearnerProfiler } from '../../services/learning/LearnerProfiler.js';
import { userStorage } from '../../services/userStorage.js';
import * as AIService from '../../services/AIService.js';

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
     * Render pronunciation content with full details
     */
    pronunciation(data) {
        if (!data) return '<p class="no-content">No pronunciation guide available</p>';
        
        const { ipa, guide, tip, audioSrc, breakdown, commonMistake } = data;
        let html = '';
        
        if (ipa) {
            html += `<div class="ipa-display"><span class="ipa-label">IPA:</span> <span class="ipa-value">${ipa}</span></div>`;
        }
        
        if (guide) {
            html += `<div class="pronunciation-guide"><span class="guide-label">How to say it:</span> <span class="guide-value">${guide}</span></div>`;
        }
        
        if (breakdown) {
            html += `<div class="pronunciation-breakdown"><span class="breakdown-label">Breakdown:</span> ${breakdown}</div>`;
        }
        
        if (tip) {
            html += `<div class="pronunciation-tip"><span class="tip-icon">💡</span><span class="tip-text">${tip}</span></div>`;
        }
        
        if (commonMistake) {
            html += `<div class="pronunciation-warning"><span class="warning-icon">⚠️</span><span class="warning-label">Common mistake:</span> ${commonMistake}</div>`;
        }
        
        if (audioSrc) {
            html += `
                <button class="audio-btn pronunciation-audio" data-audio="${audioSrc}" aria-label="Play pronunciation">
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
     * Render example sentences with audio buttons
     */
    examples(data) {
        if (!data || !Array.isArray(data) || data.length === 0) {
            return '<p class="no-content">No examples available</p>';
        }
        
        const examplesHtml = data.map((ex, index) => {
            const ptText = ex.pt || ex.portuguese || ex.text;
            return `
                <div class="example-item" data-example-index="${index}">
                    <div class="example-pt">
                        <span class="example-text">${ptText}</span>
                        <button class="audio-btn example-audio" data-audio="${ptText}" aria-label="Listen to example" title="Listen">
                            🔊
                        </button>
                    </div>
                    <div class="example-en">${ex.en || ex.english || ex.translation}</div>
                    ${ex.context ? `<div class="example-context">${ex.context}</div>` : ''}
                </div>
            `;
        }).join('');
        
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
    aiTips(data, isLoading = false, isConnected = true) {
        if (isLoading) {
            return `
                <div class="ai-tips-content">
                    <div class="ai-loading">
                        <span class="loading-spinner"></span>
                        <span>Analyzing your learning patterns...</span>
                    </div>
                </div>
            `;
        }
        
        const connectionStatus = isConnected 
            ? '<span class="ai-status ai-connected" title="AI Connected">🟢</span>'
            : '<span class="ai-status ai-offline" title="AI Offline - Using cached tips">🟡</span>';
        
        if (!data || (Array.isArray(data) && data.length === 0)) {
            return `
                <div class="ai-tips-content">
                    <div class="ai-tips-header">
                        ${connectionStatus}
                        <span class="ai-tips-label">Personalized Tips</span>
                    </div>
                    <p class="ai-placeholder">Complete a few exercises to get personalized tips!</p>
                </div>
            `;
        }
        
        // Handle array or single tip
        const tips = Array.isArray(data) ? data : [data];
        
        const tipsHtml = tips.map((tip, index) => {
            const tipText = typeof tip === 'string' ? tip : (tip.tip || tip.text || tip.message);
            const tipType = tip.type || 'general';
            const priority = tip.priority || 'normal';
            return `
                <div class="ai-tip-item tip-${tipType} priority-${priority}" data-tip-index="${index}">
                    <span class="tip-icon">${getTipIcon(tipType)}</span>
                    <span class="tip-text">${tipText}</span>
                </div>
            `;
        }).join('');
        
        return `
            <div class="ai-tips-content">
                <div class="ai-tips-header">
                    ${connectionStatus}
                    <span class="ai-tips-label">Personalized Tips</span>
                    <button class="refresh-tips-btn" title="Refresh tips" aria-label="Refresh AI tips">
                        🔄
                    </button>
                </div>
                <div class="ai-tips-list">${tipsHtml}</div>
            </div>
        `;
    }
};

/**
 * Get icon for tip type
 * @param {string} type - Tip type
 * @returns {string} Icon emoji
 */
function getTipIcon(type) {
    const icons = {
        pronunciation: '🗣️',
        grammar: '📖',
        memory: '💡',
        weakness: '⚠️',
        strength: '💪',
        timing: '⏰',
        motivation: '🌟',
        general: '💭'
    };
    return icons[type] || icons.general;
}

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
            enableRealTimeUpdates: true,
            mobileBreakpoint: 767,
            drawerMode: 'auto', // 'auto' | 'always' | 'never'
            ...options
        };
        
        this.accordion = null;
        this.wordData = null;
        this.aiTipsLoading = false;
        this.aiConnected = false;
        this.eventListeners = [];
        this.eventUnsubscribe = null;
        this.learnerProfiler = null;
        this.tipRefreshDebounce = null;
        this.lastTipRefresh = 0;
        this.cachedTips = [];
        this.isDrawerExpanded = false;
        
        this.init();
    }
    
    /**
     * Initialize the panel
     */
    init() {
        this.container.classList.add('lesson-options-panel');
        
        // Initialize learner profiler for the current user
        const userId = userStorage.getCurrentUserId();
        if (userId) {
            this.learnerProfiler = createLearnerProfiler(userId);
        }
        
        // Check AI status
        this.checkAIConnection();
        
        this.render();
        this.bindEvents();
        
        // Subscribe to event streaming for real-time updates
        if (this.options.enableRealTimeUpdates) {
            this.subscribeToEvents();
        }
        
        // Initialize mobile drawer mode
        this.initMobileDrawer();
        
        Logger.debug('LessonOptionsPanel', 'Initialized with real-time updates');
    }
    
    /**
     * Check AI connection status
     */
    async checkAIConnection() {
        try {
            const status = await AIService.checkOllamaStatus();
            this.aiConnected = status.available;
            Logger.debug('LessonOptionsPanel', 'AI connection status', { connected: this.aiConnected });
        } catch (error) {
            this.aiConnected = false;
            Logger.warn('LessonOptionsPanel', 'Failed to check AI status', error);
        }
    }
    
    /**
     * Subscribe to event streaming for real-time tip updates
     */
    subscribeToEvents() {
        this.eventUnsubscribe = eventStream.subscribe((event) => {
            this.handleLearningEvent(event);
        });
        Logger.debug('LessonOptionsPanel', 'Subscribed to event stream');
    }
    
    /**
     * Handle learning events for tip updates
     * @param {Object} event - Learning event
     */
    handleLearningEvent(event) {
        // Events that should trigger tip refresh
        const tipTriggers = ['word_attempt', 'pronunciation', 'quiz_answer'];
        
        if (!tipTriggers.includes(event.eventType)) {
            return;
        }
        
        // Update learner profiler
        if (this.learnerProfiler) {
            // Map event types to profiler format
            const mappedEvent = this.mapEventForProfiler(event);
            this.learnerProfiler.processEvent(mappedEvent);
        }
        
        // Debounce tip refresh (don't refresh more than once per 5 seconds)
        const now = Date.now();
        if (now - this.lastTipRefresh < 5000) {
            clearTimeout(this.tipRefreshDebounce);
            this.tipRefreshDebounce = setTimeout(() => {
                this.refreshAITips();
            }, 5000 - (now - this.lastTipRefresh));
            return;
        }
        
        this.refreshAITips();
    }
    
    /**
     * Map event stream events to profiler format
     * @param {Object} event - Raw event
     * @returns {Object} Mapped event
     */
    mapEventForProfiler(event) {
        const { eventType, data, timestamp } = event;
        
        switch (eventType) {
            case 'word_attempt':
                return {
                    eventType: data.correct ? 'answer_correct' : 'answer_incorrect',
                    wordId: data.wordId,
                    userAnswer: data.userInput,
                    correctAnswer: data.correctAnswer,
                    responseTime: data.responseTime,
                    timestamp
                };
            case 'pronunciation':
                return {
                    eventType: 'pronunciation_score',
                    wordId: data.wordId,
                    score: data.score,
                    phonemes: data.phonemeBreakdown,
                    timestamp
                };
            case 'quiz_answer':
                return {
                    eventType: data.correct ? 'answer_correct' : 'answer_incorrect',
                    wordId: data.questionId,
                    userAnswer: data.selectedOption,
                    correctAnswer: data.correctOption,
                    responseTime: data.timeSpent,
                    timestamp
                };
            default:
                return { eventType, ...data, timestamp };
        }
    }
    
    /**
     * Refresh AI tips based on current learning data
     */
    async refreshAITips() {
        this.lastTipRefresh = Date.now();
        
        if (!this.wordData) {
            return;
        }
        
        // Show loading state briefly
        this.aiTipsLoading = true;
        this.accordion?.updateContent('aiTips', contentRenderers.aiTips(null, true, this.aiConnected));
        
        try {
            const tips = await this.generateDynamicTips();
            this.cachedTips = tips;
            this.accordion?.updateContent('aiTips', contentRenderers.aiTips(tips, false, this.aiConnected));
            Logger.debug('LessonOptionsPanel', 'AI tips refreshed', { count: tips.length });
        } catch (error) {
            Logger.warn('LessonOptionsPanel', 'Failed to refresh AI tips', error);
            // Fall back to cached tips
            this.accordion?.updateContent('aiTips', contentRenderers.aiTips(this.cachedTips, false, this.aiConnected));
        } finally {
            this.aiTipsLoading = false;
        }
    }
    
    /**
     * Generate dynamic tips based on learning data
     * @returns {Promise<Array>} Generated tips
     */
    async generateDynamicTips() {
        const tips = [];
        
        // Get recommendations from learner profiler
        if (this.learnerProfiler) {
            const recommendations = this.learnerProfiler.getRecommendations();
            recommendations.forEach(rec => {
                tips.push({
                    tip: rec.message,
                    type: rec.type,
                    priority: rec.priority,
                    data: rec.data
                });
            });
            
            // Get summary for context
            const summary = this.learnerProfiler.getSummaryForAI();
            
            // Add weakness-based tips
            if (summary.topWeaknesses && summary.topWeaknesses.length > 0) {
                const weakness = summary.topWeaknesses[0];
                tips.push({
                    tip: `You often confuse "${weakness.word1}" with "${weakness.word2}". Try creating a mental story linking them!`,
                    type: 'weakness',
                    priority: 'high'
                });
            }
            
            // Add pronunciation tips
            if (summary.pronunciationIssues && summary.pronunciationIssues.length > 0) {
                const issue = summary.pronunciationIssues[0];
                tips.push({
                    tip: `Work on the "${issue.phoneme}" sound - your average score is ${Math.round(issue.averageScore)}%. Practice slowly!`,
                    type: 'pronunciation',
                    priority: 'high'
                });
            }
        }
        
        // Add word-specific tips from AI if connected and we have word data
        if (this.aiConnected && this.wordData) {
            try {
                const aiTip = await this.getAITipForWord(this.wordData);
                if (aiTip) {
                    tips.push({
                        tip: aiTip,
                        type: 'general',
                        priority: 'normal'
                    });
                }
            } catch (error) {
                Logger.debug('LessonOptionsPanel', 'AI tip generation failed', error);
            }
        }
        
        // Fallback tips if none generated
        if (tips.length === 0) {
            tips.push({
                tip: 'Keep practicing! The more you learn, the better tips I can give you.',
                type: 'motivation',
                priority: 'low'
            });
        }
        
        // Limit to top 5 tips
        return tips.slice(0, 5);
    }
    
    /**
     * Get AI-generated tip for specific word
     * @param {Object} wordData - Word data
     * @returns {Promise<string|null>} Generated tip
     */
    async getAITipForWord(wordData) {
        const word = wordData.word || wordData.pt || wordData.portuguese;
        if (!word) return null;
        
        // Use AIService grammar help for tips
        try {
            const result = await AIService.getGrammarHelp(word, 'memory tip');
            return result.explanation;
        } catch {
            return null;
        }
    }
    
    /**
     * Initialize mobile drawer mode
     */
    initMobileDrawer() {
        // Check if we should use drawer mode
        const shouldUseDrawer = this.shouldUseDrawerMode();
        
        if (shouldUseDrawer) {
            this.container.classList.add('drawer-mode');
            this.createDrawerToggle();
        }
        
        // Listen for resize to switch modes
        const handleResize = () => {
            const useDrawer = this.shouldUseDrawerMode();
            this.container.classList.toggle('drawer-mode', useDrawer);
            
            if (useDrawer && !this.container.querySelector('.drawer-toggle')) {
                this.createDrawerToggle();
            }
        };
        
        window.addEventListener('resize', handleResize);
        this.eventListeners.push(['resize', handleResize, window]);
    }
    
    /**
     * Check if drawer mode should be used
     * @returns {boolean}
     */
    shouldUseDrawerMode() {
        if (this.options.drawerMode === 'always') return true;
        if (this.options.drawerMode === 'never') return false;
        return window.innerWidth <= this.options.mobileBreakpoint;
    }
    
    /**
     * Create mobile drawer toggle button
     */
    createDrawerToggle() {
        // Don't create if already exists
        if (this.container.querySelector('.drawer-toggle')) return;
        
        const toggle = document.createElement('button');
        toggle.className = 'drawer-toggle';
        toggle.setAttribute('aria-label', 'Toggle learning options');
        toggle.setAttribute('aria-expanded', 'false');
        toggle.innerHTML = `
            <span class="drawer-toggle-icon">📖</span>
            <span class="drawer-toggle-text">Learning Options</span>
            <span class="drawer-toggle-arrow">▲</span>
        `;
        
        toggle.addEventListener('click', () => {
            this.toggleDrawer();
        });
        
        this.container.insertBefore(toggle, this.container.firstChild);
    }
    
    /**
     * Toggle mobile drawer expanded state
     * @param {boolean} [expanded] - Force state
     */
    toggleDrawer(expanded) {
        if (expanded === undefined) {
            this.isDrawerExpanded = !this.isDrawerExpanded;
        } else {
            this.isDrawerExpanded = expanded;
        }
        
        this.container.classList.toggle('expanded', this.isDrawerExpanded);
        
        // Update ARIA
        const toggle = this.container.querySelector('.drawer-toggle');
        if (toggle) {
            toggle.setAttribute('aria-expanded', String(this.isDrawerExpanded));
        }
        
        // Dispatch event
        this.container.dispatchEvent(new CustomEvent('drawer-toggle', {
            detail: { expanded: this.isDrawerExpanded }
        }));
        
        Logger.debug('LessonOptionsPanel', 'Drawer toggled', { expanded: this.isDrawerExpanded });
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
        this.accordion = createAccordion(accordionContainer, sections, {
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
        this.accordion.updateContent('aiTips', contentRenderers.aiTips(null, true, this.aiConnected));
        
        try {
            // Generate tips using the dynamic system
            const tips = await this.generateDynamicTips();
            this.cachedTips = tips;
            this.accordion.updateContent('aiTips', contentRenderers.aiTips(tips, false, this.aiConnected));
        } catch (error) {
            Logger.warn('LessonOptionsPanel', 'Failed to load AI tips', error);
            this.accordion.updateContent('aiTips', contentRenderers.aiTips(this.cachedTips, false, this.aiConnected));
        } finally {
            this.aiTipsLoading = false;
        }
    }
    
    /**
     * Update AI tips dynamically
     * @param {Array} tips - New AI tips
     */
    updateAITips(tips) {
        this.cachedTips = tips;
        this.accordion.updateContent('aiTips', contentRenderers.aiTips(tips, false, this.aiConnected));
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
        
        // Refresh tips button
        const handleRefreshClick = (e) => {
            if (e.target.closest('.refresh-tips-btn')) {
                this.refreshAITips();
            }
        };
        
        this.container.addEventListener('click', handleRefreshClick);
        this.eventListeners.push(['click', handleRefreshClick]);
        
        // Mobile drawer - header click (only when not in drawer mode)
        const header = this.container.querySelector('.lesson-options-header');
        if (header) {
            const handleHeaderClick = () => {
                if (this.shouldUseDrawerMode() && !this.container.querySelector('.drawer-toggle')) {
                    this.toggleDrawer();
                }
            };
            header.addEventListener('click', handleHeaderClick);
            this.eventListeners.push(['click', handleHeaderClick, header]);
        }
        
        // Close drawer on outside click (mobile)
        const handleOutsideClick = (e) => {
            if (this.isDrawerExpanded && 
                this.shouldUseDrawerMode() && 
                !this.container.contains(e.target)) {
                this.toggleDrawer(false);
            }
        };
        
        document.addEventListener('click', handleOutsideClick);
        this.eventListeners.push(['click', handleOutsideClick, document]);
        
        // Close drawer on escape key
        const handleKeyDown = (e) => {
            if (e.key === 'Escape' && this.isDrawerExpanded) {
                this.toggleDrawer(false);
            }
        };
        
        document.addEventListener('keydown', handleKeyDown);
        this.eventListeners.push(['keydown', handleKeyDown, document]);
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
        return this.shouldUseDrawerMode();
    }
    
    /**
     * Get cached tips
     * @returns {Array} Cached AI tips
     */
    getCachedTips() {
        return this.cachedTips;
    }
    
    /**
     * Force refresh tips (public API)
     */
    async forceRefreshTips() {
        this.lastTipRefresh = 0; // Reset debounce
        await this.refreshAITips();
    }
    
    /**
     * Destroy the panel
     */
    destroy() {
        // Unsubscribe from event stream
        if (this.eventUnsubscribe) {
            this.eventUnsubscribe();
            this.eventUnsubscribe = null;
        }
        
        // Clear debounce timer
        if (this.tipRefreshDebounce) {
            clearTimeout(this.tipRefreshDebounce);
        }
        
        // Remove event listeners
        this.eventListeners.forEach(([event, handler, target]) => {
            (target || this.container).removeEventListener(event, handler);
        });
        this.eventListeners = [];
        
        // Destroy accordion
        if (this.accordion) {
            this.accordion.destroy();
        }
        
        // Clear references
        this.learnerProfiler = null;
        this.cachedTips = [];
        
        // Clear container
        this.container.innerHTML = '';
        this.container.classList.remove('lesson-options-panel', 'expanded', 'drawer-mode');
        
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
