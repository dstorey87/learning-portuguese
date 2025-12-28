/**
 * Accordion Component
 * 
 * Provides collapsible/expandable panel behavior with:
 * - Single-open mode (only one panel open at a time)
 * - Smooth animations (300ms)
 * - Icon rotation on expand/collapse
 * - Keyboard navigation (Enter/Space to toggle)
 * - Mobile-friendly touch targets
 * 
 * @module components/common/Accordion
 * @phase Phase 4 - Lesson Layout & Options Panel
 */

// ============================================================================
// CONFIGURATION
// ============================================================================

/**
 * Accordion configuration
 * @readonly
 */
export const ACCORDION_CONFIG = {
    animationDuration: 300, // ms
    singleOpen: true, // Only one panel open at a time
    defaultOpenIndex: 0, // First panel open by default (-1 for none)
    iconExpanded: '▼',
    iconCollapsed: '▶',
    storageKeyPrefix: 'accordion_state_'
};

/**
 * Accordion events
 * @readonly
 * @enum {string}
 */
export const ACCORDION_EVENTS = {
    PANEL_OPEN: 'accordion:panel:open',
    PANEL_CLOSE: 'accordion:panel:close',
    STATE_CHANGE: 'accordion:state:change'
};

// ============================================================================
// ACCORDION PANEL CLASS
// ============================================================================

/**
 * AccordionPanel - Individual expandable panel
 */
export class AccordionPanel {
    /**
     * Create an AccordionPanel
     * @param {Object} options - Panel options
     * @param {string} options.id - Unique panel ID
     * @param {string} options.title - Panel header title
     * @param {string} options.icon - Panel icon (emoji or HTML)
     * @param {string|HTMLElement} options.content - Panel content (HTML string or element)
     * @param {boolean} options.isOpen - Initial open state
     * @param {Function} options.onToggle - Callback when toggled
     */
    constructor(options = {}) {
        this.id = options.id || `panel-${Date.now()}`;
        this.title = options.title || 'Panel';
        this.icon = options.icon || '';
        this.content = options.content || '';
        this.isOpen = options.isOpen || false;
        this.onToggle = options.onToggle || (() => {});
        this.element = null;
        this.headerElement = null;
        this.contentElement = null;
        this.contentInner = null;
    }

    /**
     * Create the panel DOM element
     * @returns {HTMLElement} Panel element
     */
    create() {
        this.element = document.createElement('div');
        this.element.className = `accordion-panel ${this.isOpen ? 'open' : 'closed'}`;
        this.element.id = this.id;
        this.element.setAttribute('data-panel-id', this.id);

        // Header (clickable)
        this.headerElement = document.createElement('button');
        this.headerElement.className = 'accordion-header';
        this.headerElement.setAttribute('type', 'button');
        this.headerElement.setAttribute('aria-expanded', this.isOpen ? 'true' : 'false');
        this.headerElement.setAttribute('aria-controls', `${this.id}-content`);
        
        this.headerElement.innerHTML = `
            <span class="accordion-icon-wrapper">
                ${this.icon ? `<span class="accordion-section-icon">${this.icon}</span>` : ''}
                <span class="accordion-title">${this.title}</span>
            </span>
            <span class="accordion-toggle-icon" aria-hidden="true">
                ${this.isOpen ? ACCORDION_CONFIG.iconExpanded : ACCORDION_CONFIG.iconCollapsed}
            </span>
        `;

        // Content container
        this.contentElement = document.createElement('div');
        this.contentElement.className = 'accordion-content';
        this.contentElement.id = `${this.id}-content`;
        this.contentElement.setAttribute('role', 'region');
        this.contentElement.setAttribute('aria-labelledby', this.id);
        
        // Content inner (for height animation)
        this.contentInner = document.createElement('div');
        this.contentInner.className = 'accordion-content-inner';
        
        if (typeof this.content === 'string') {
            this.contentInner.innerHTML = this.content;
        } else if (this.content instanceof HTMLElement) {
            this.contentInner.appendChild(this.content);
        }
        
        this.contentElement.appendChild(this.contentInner);

        // Set initial height
        if (this.isOpen) {
            this.contentElement.style.maxHeight = 'none';
        } else {
            this.contentElement.style.maxHeight = '0px';
        }

        // Event listeners
        this.headerElement.addEventListener('click', (e) => {
            e.preventDefault();
            this.toggle();
        });

        this.headerElement.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                this.toggle();
            }
        });

        this.element.appendChild(this.headerElement);
        this.element.appendChild(this.contentElement);

        return this.element;
    }

    /**
     * Toggle panel open/closed
     */
    toggle() {
        if (this.isOpen) {
            this.close();
        } else {
            this.open();
        }
    }

    /**
     * Open the panel with animation
     */
    open() {
        if (this.isOpen) return;
        
        this.isOpen = true;
        this.element.classList.remove('closed');
        this.element.classList.add('open', 'animating');
        this.headerElement.setAttribute('aria-expanded', 'true');
        
        // Update toggle icon
        const toggleIcon = this.headerElement.querySelector('.accordion-toggle-icon');
        if (toggleIcon) {
            toggleIcon.textContent = ACCORDION_CONFIG.iconExpanded;
        }

        // Animate height
        const contentHeight = this.contentInner.scrollHeight;
        this.contentElement.style.maxHeight = `${contentHeight}px`;

        // After animation, set to none for dynamic content
        setTimeout(() => {
            this.element.classList.remove('animating');
            this.contentElement.style.maxHeight = 'none';
        }, ACCORDION_CONFIG.animationDuration);

        this.onToggle(this.id, true);
        this._dispatchEvent(ACCORDION_EVENTS.PANEL_OPEN);
    }

    /**
     * Close the panel with animation
     */
    close() {
        if (!this.isOpen) return;
        
        this.isOpen = false;
        this.element.classList.add('animating');
        this.headerElement.setAttribute('aria-expanded', 'false');
        
        // Update toggle icon
        const toggleIcon = this.headerElement.querySelector('.accordion-toggle-icon');
        if (toggleIcon) {
            toggleIcon.textContent = ACCORDION_CONFIG.iconCollapsed;
        }

        // Get current height then animate to 0
        const contentHeight = this.contentInner.scrollHeight;
        this.contentElement.style.maxHeight = `${contentHeight}px`;
        
        // Force reflow
        this.contentElement.offsetHeight;
        
        this.contentElement.style.maxHeight = '0px';

        setTimeout(() => {
            this.element.classList.remove('open', 'animating');
            this.element.classList.add('closed');
        }, ACCORDION_CONFIG.animationDuration);

        this.onToggle(this.id, false);
        this._dispatchEvent(ACCORDION_EVENTS.PANEL_CLOSE);
    }

    /**
     * Update panel content
     * @param {string|HTMLElement} newContent - New content
     */
    updateContent(newContent) {
        this.content = newContent;
        if (typeof newContent === 'string') {
            this.contentInner.innerHTML = newContent;
        } else if (newContent instanceof HTMLElement) {
            this.contentInner.innerHTML = '';
            this.contentInner.appendChild(newContent);
        }
        
        // Update height if open
        if (this.isOpen) {
            this.contentElement.style.maxHeight = 'none';
        }
    }

    /**
     * Dispatch custom event
     * @private
     */
    _dispatchEvent(eventName) {
        const event = new CustomEvent(eventName, {
            detail: { panelId: this.id, isOpen: this.isOpen },
            bubbles: true
        });
        this.element?.dispatchEvent(event);
    }
}

// ============================================================================
// ACCORDION CLASS
// ============================================================================

/**
 * Accordion - Container for multiple panels with single-open behavior
 */
export class Accordion {
    /**
     * Create an Accordion
     * @param {Object} options - Accordion options
     * @param {string} options.id - Unique accordion ID
     * @param {Array} options.panels - Array of panel configs
     * @param {boolean} options.singleOpen - Only allow one panel open
     * @param {number} options.defaultOpenIndex - Index of initially open panel (-1 for none)
     * @param {boolean} options.persistState - Save/restore state to localStorage
     * @param {Function} options.onPanelChange - Callback when any panel changes
     */
    constructor(options = {}) {
        this.id = options.id || `accordion-${Date.now()}`;
        this.singleOpen = options.singleOpen ?? ACCORDION_CONFIG.singleOpen;
        this.defaultOpenIndex = options.defaultOpenIndex ?? ACCORDION_CONFIG.defaultOpenIndex;
        this.persistState = options.persistState ?? false;
        this.onPanelChange = options.onPanelChange || (() => {});
        
        this.panels = [];
        this.panelConfigs = options.panels || [];
        this.element = null;
        this.openPanelId = null;
        this.eventHandlers = { change: [] };
    }

    /**
     * Create the accordion DOM element
     * @param {HTMLElement} container - Container to append to
     * @returns {HTMLElement} Accordion element
     */
    create(container) {
        this.element = document.createElement('div');
        this.element.className = 'accordion';
        this.element.id = this.id;
        this.element.setAttribute('role', 'presentation');

        // Normalize panel configs defensively to avoid runtime errors
        this.panelConfigs = Array.isArray(this.panelConfigs)
            ? this.panelConfigs
            : this.panelConfigs
                ? Object.values(this.panelConfigs)
                : [];

        // Restore state if persisting
        const savedOpenId = this.persistState ? this._loadState() : null;

        // Create panels
        this.panelConfigs.forEach((config, index) => {
            const isOpen = savedOpenId 
                ? config.id === savedOpenId 
                : index === this.defaultOpenIndex;
            
            const panel = new AccordionPanel({
                ...config,
                isOpen,
                onToggle: (panelId, opened) => this._handlePanelToggle(panelId, opened)
            });
            
            this.panels.push(panel);
            this.element.appendChild(panel.create());
            
            if (isOpen) {
                this.openPanelId = config.id;
            }
        });

        if (container) {
            container.appendChild(this.element);
        }

        return this.element;
    }

    /**
     * Handle panel toggle with single-open logic
     * @private
     */
    _handlePanelToggle(panelId, opened) {
        if (opened && this.singleOpen) {
            // Close all other panels
            this.panels.forEach(panel => {
                if (panel.id !== panelId && panel.isOpen) {
                    panel.close();
                }
            });
            this.openPanelId = panelId;
        } else if (!opened && this.openPanelId === panelId) {
            this.openPanelId = null;
        }

        // Persist state
        if (this.persistState) {
            this._saveState();
        }

        // Callback
        this.onPanelChange(panelId, opened, this._getState());

        // Local event listeners
        this._emit('change', { panelId, sectionId: panelId, isOpen: opened, state: this._getState() });
        
        // Dispatch event
        this._dispatchEvent(ACCORDION_EVENTS.STATE_CHANGE);
    }

    /**
     * Open a specific panel by ID
     * @param {string} panelId - Panel ID to open
     */
    openPanel(panelId) {
        const panel = this.panels.find(p => p.id === panelId);
        if (panel) {
            panel.open();
        }
    }

    /**
     * Alias for openPanel (used by callers)
     * @param {string} panelId
     */
    open(panelId) {
        this.openPanel(panelId);
    }

    /**
     * Close a specific panel by ID
     * @param {string} panelId - Panel ID to close
     */
    closePanel(panelId) {
        const panel = this.panels.find(p => p.id === panelId);
        if (panel) {
            panel.close();
        }
    }

    /**
     * Alias for closePanel (used by callers)
     * @param {string} panelId
     */
    close(panelId) {
        this.closePanel(panelId);
    }

    /**
     * Close all panels
     */
    closeAll() {
        this.panels.forEach(panel => panel.close());
        this.openPanelId = null;
    }

    /**
     * Get a panel by ID
     * @param {string} panelId - Panel ID
     * @returns {AccordionPanel|undefined}
     */
    getPanel(panelId) {
        return this.panels.find(p => p.id === panelId);
    }

    /**
     * Update a panel's content
     * @param {string} panelId - Panel ID
     * @param {string|HTMLElement} content - New content
     */
    updatePanelContent(panelId, content) {
        const panel = this.getPanel(panelId);
        if (panel) {
            panel.updateContent(content);
        }
    }

    /**
     * Alias for updatePanelContent
     * @param {string} panelId
     * @param {string|HTMLElement} content
     */
    updateContent(panelId, content) {
        this.updatePanelContent(panelId, content);
    }

    /**
     * Get currently open panel IDs
     * @returns {Array<string>}
     */
    getOpenSections() {
        return this.panels.filter(p => p.isOpen).map(p => p.id);
    }

    /**
     * Register event listener
     * @param {string} eventName
     * @param {Function} handler
     */
    on(eventName, handler) {
        if (!this.eventHandlers[eventName]) {
            this.eventHandlers[eventName] = [];
        }
        this.eventHandlers[eventName].push(handler);
    }

    /**
     * Emit local event
     * @param {string} eventName
     * @param {Object} payload
     * @private
     */
    _emit(eventName, payload) {
        const handlers = this.eventHandlers[eventName] || [];
        handlers.forEach(fn => {
            try {
                fn(payload);
            } catch (e) {
                console.warn('Accordion listener error', e);
            }
        });
    }

    /**
     * Get current accordion state
     * @returns {Object} State object
     * @private
     */
    _getState() {
        return {
            openPanelId: this.openPanelId,
            panels: this.panels.map(p => ({ id: p.id, isOpen: p.isOpen }))
        };
    }

    /**
     * Save state to localStorage
     * @private
     */
    _saveState() {
        try {
            const key = ACCORDION_CONFIG.storageKeyPrefix + this.id;
            localStorage.setItem(key, JSON.stringify({ openPanelId: this.openPanelId }));
        } catch (e) {
            console.warn('Failed to save accordion state:', e);
        }
    }

    /**
     * Load state from localStorage
     * @returns {string|null} Open panel ID or null
     * @private
     */
    _loadState() {
        try {
            const key = ACCORDION_CONFIG.storageKeyPrefix + this.id;
            const saved = localStorage.getItem(key);
            if (saved) {
                const state = JSON.parse(saved);
                return state.openPanelId || null;
            }
        } catch (e) {
            console.warn('Failed to load accordion state:', e);
        }
        return null;
    }

    /**
     * Dispatch custom event
     * @private
     */
    _dispatchEvent(eventName) {
        const event = new CustomEvent(eventName, {
            detail: this._getState(),
            bubbles: true
        });
        this.element?.dispatchEvent(event);
    }

    /**
     * Destroy the accordion and clean up
     */
    destroy() {
        this.panels = [];
        this.element?.remove();
        this.element = null;
    }
}

// ============================================================================
// FACTORY FUNCTIONS
// ============================================================================

/**
 * Create an accordion with panel configurations
 * @param {HTMLElement} container - Container element
 * @param {Array} panelConfigs - Array of panel config objects
 * @param {Object} options - Accordion options
 * @returns {Accordion} Accordion instance
 */
export function createAccordion(container, panelConfigs, options = {}) {
    const panels = Array.isArray(panelConfigs)
        ? panelConfigs
        : panelConfigs
            ? Object.values(panelConfigs)
            : [];
    const accordion = new Accordion({
        panels,
        ...options
    });
    accordion.create(container);
    return accordion;
}

/**
 * Create lesson options accordion
 * @param {HTMLElement} container - Container element
 * @param {Object} wordData - Word knowledge data
 * @param {Object} options - Additional options
 * @returns {Accordion} Accordion instance
 */
export function createLessonOptionsAccordion(container, wordData = {}, options = {}) {
    const panels = [
        {
            id: 'pronunciation',
            title: 'Pronunciation',
            icon: '🗣️',
            content: wordData.pronunciation ? `
                <div class="pronunciation-guide">${wordData.pronunciation.guide || ''}</div>
                ${wordData.pronunciation.ipa ? `<div class="ipa">[${wordData.pronunciation.ipa}]</div>` : ''}
                ${wordData.pronunciation.tip ? `<div class="tip">${wordData.pronunciation.tip}</div>` : ''}
            ` : '<p>Pronunciation guide not available.</p>'
        },
        {
            id: 'remember',
            title: 'Remember It',
            icon: '🧠',
            content: wordData.memoryTrick || wordData.etymology ? `
                ${wordData.etymology ? `<div class="etymology"><strong>Origin:</strong> ${wordData.etymology}</div>` : ''}
                ${wordData.memoryTrick ? `<div class="memory-trick">💭 ${wordData.memoryTrick}</div>` : ''}
            ` : '<p>Memory tricks coming soon!</p>'
        },
        {
            id: 'examples',
            title: 'Example Sentences',
            icon: '📝',
            content: wordData.examples && wordData.examples.length > 0 ? `
                <div class="examples-list">
                    ${wordData.examples.map(ex => `
                        <div class="example-item">
                            <div class="example-pt">${ex.pt}</div>
                            <div class="example-en">${ex.en}</div>
                        </div>
                    `).join('')}
                </div>
            ` : '<p>No examples available.</p>'
        },
        {
            id: 'grammar',
            title: 'Grammar Notes',
            icon: '📖',
            content: wordData.grammar ? `
                <div class="grammar-note">${wordData.grammar}</div>
            ` : '<p>No grammar notes for this word.</p>'
        },
        {
            id: 'usage',
            title: 'When to Use',
            icon: '🎯',
            content: wordData.usage ? `
                <div class="usage-formality">Formality: <span class="badge">${wordData.usage.formality}</span></div>
                <div class="usage-context">${wordData.usage.context}</div>
                ${wordData.usage.alternative ? `<div class="usage-alt">Alternative: ${wordData.usage.alternative}</div>` : ''}
            ` : '<p>Usage context not available.</p>'
        },
        {
            id: 'cultural',
            title: 'Cultural Insight',
            icon: '🇵🇹',
            content: wordData.cultural ? `
                <div class="cultural-note">${wordData.cultural}</div>
            ` : '<p>Cultural notes coming soon!</p>'
        },
        {
            id: 'ai-tips',
            title: 'AI Tips',
            icon: '🤖',
            content: `
                <div class="ai-tips-content" id="aiTipsContent">
                    <p class="ai-loading">Loading personalized tips...</p>
                </div>
            `
        }
    ];

    return createAccordion(container, panels, {
        id: 'lesson-options',
        singleOpen: true,
        defaultOpenIndex: 0,
        persistState: true,
        ...options
    });
}

// ============================================================================
// DEFAULT EXPORT
// ============================================================================

export default Accordion;
