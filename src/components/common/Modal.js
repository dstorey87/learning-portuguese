/**
 * Modal Component
 * Reusable modal system for dialogs, alerts, and overlays
 * 
 * @module components/common/Modal
 */

/**
 * Modal configuration
 */
export const MODAL_CONFIG = {
    animationDuration: 300, // ms
    closeOnBackdropClick: true,
    closeOnEscape: true,
    focusTrap: true,
    zIndex: 1000
};

/**
 * Active modals stack for managing z-index and focus
 */
const modalStack = [];

function parseCssColorToRgb(color) {
    const c = String(color || '').trim().toLowerCase();
    if (!c || c === 'transparent') return null;

    // rgb()/rgba()
    const rgbMatch = c.match(/^rgba?\(([^)]+)\)$/);
    if (rgbMatch) {
        const parts = rgbMatch[1].split(',').map(s => s.trim());
        const r = Number(parts[0]);
        const g = Number(parts[1]);
        const b = Number(parts[2]);
        const a = parts.length >= 4 ? Number(parts[3]) : 1;
        if ([r, g, b, a].some(n => Number.isNaN(n))) return null;
        return { r, g, b, a };
    }

    // hex (#rgb, #rrggbb)
    const hexMatch = c.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
    if (hexMatch) {
        const hex = hexMatch[1];
        const full = hex.length === 3
            ? hex.split('').map(ch => ch + ch).join('')
            : hex;
        const r = parseInt(full.slice(0, 2), 16);
        const g = parseInt(full.slice(2, 4), 16);
        const b = parseInt(full.slice(4, 6), 16);
        return { r, g, b, a: 1 };
    }

    return null;
}

function relativeLuminance({ r, g, b }) {
    const toLinear = (v) => {
        const s = v / 255;
        return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
    };
    const R = toLinear(r);
    const G = toLinear(g);
    const B = toLinear(b);
    return 0.2126 * R + 0.7152 * G + 0.0722 * B;
}

function findEffectiveBackgroundColor(element) {
    // Walk up DOM until we find a non-transparent background.
    let el = element;
    while (el && el !== document.documentElement) {
        const bg = window.getComputedStyle(el).backgroundColor;
        const rgba = parseCssColorToRgb(bg);
        if (rgba && rgba.a > 0.05) return rgba;
        el = el.parentElement;
    }

    // Fallback to body background.
    const bodyBg = window.getComputedStyle(document.body).backgroundColor;
    const bodyRgba = parseCssColorToRgb(bodyBg);
    return bodyRgba || { r: 255, g: 255, b: 255, a: 1 };
}

function applyAutoModalContrast(modalOverlayEl) {
    const container = modalOverlayEl?.querySelector?.('.modal-container');
    if (!container || typeof window === 'undefined') return;

    const bg = findEffectiveBackgroundColor(container);
    const lum = relativeLuminance(bg);
    const isDark = lum < 0.45;

    // Colors for dark and light backgrounds
    const titleColor = isDark ? '#f9fafb' : '#111827';
    const textColor = isDark ? '#f3f4f6' : '#111827';
    const textSecondary = isDark ? 'rgba(243,244,246,0.86)' : '#4b5563';
    const borderColor = isDark ? 'rgba(255,255,255,0.12)' : '#e5e7eb';
    const closeColor = isDark ? 'rgba(243,244,246,0.8)' : '#6b7280';
    const closeHoverBg = isDark ? 'rgba(255,255,255,0.10)' : '#f3f4f6';
    const inputBg = isDark ? 'rgba(255,255,255,0.06)' : '#ffffff';
    const inputText = isDark ? '#f9fafb' : '#111827';
    const inputBorder = isDark ? 'rgba(255,255,255,0.18)' : '#e5e7eb';

    // Set CSS vars on the container so existing CSS can use them.
    container.style.setProperty('--modal-title-color', titleColor);
    container.style.setProperty('--modal-text-color', textColor);
    container.style.setProperty('--modal-text-secondary', textSecondary);
    container.style.setProperty('--modal-border-color', borderColor);
    container.style.setProperty('--modal-close-color', closeColor);
    container.style.setProperty('--modal-close-hover-bg', closeHoverBg);
    container.style.setProperty('--modal-input-bg', inputBg);
    container.style.setProperty('--modal-input-text', inputText);
    container.style.setProperty('--modal-input-border', inputBorder);
    container.dataset.contrast = isDark ? 'dark' : 'light';

    // FORCE inline styles on actual elements to guarantee visibility
    const title = container.querySelector('.modal-title');
    if (title) title.style.color = titleColor;

    const body = container.querySelector('.modal-body');
    if (body) body.style.color = textColor;

    const closeBtn = container.querySelector('.modal-close');
    if (closeBtn) closeBtn.style.color = closeColor;

    // Apply to ALL text-containing elements inside the modal
    container.querySelectorAll('p, span, label, div, li, h1, h2, h3, h4, h5, h6').forEach(el => {
        // Skip elements that already have explicit color via class that should stay
        if (!el.style.color && !el.classList.contains('btn') && !el.classList.contains('modal-btn')) {
            el.style.color = textColor;
        }
    });

    // Style inputs
    container.querySelectorAll('input, select, textarea').forEach(el => {
        el.style.backgroundColor = inputBg;
        el.style.color = inputText;
        el.style.borderColor = inputBorder;
    });
}

/**
 * Modal types for predefined styling
 */
export const MODAL_TYPES = {
    DEFAULT: 'default',
    ALERT: 'alert',
    CONFIRM: 'confirm',
    FULLSCREEN: 'fullscreen',
    DRAWER: 'drawer',
    TOAST: 'toast'
};

/**
 * Create a modal instance
 * @param {Object} options - Modal options
 * @param {string} options.id - Unique modal ID
 * @param {string} options.title - Modal title
 * @param {string|HTMLElement} options.content - Modal content
 * @param {string} options.type - Modal type (default, alert, confirm, fullscreen)
 * @param {boolean} options.showClose - Show close button
 * @param {Array} options.buttons - Array of button configs {label, action, variant}
 * @param {Function} options.onOpen - Callback when modal opens
 * @param {Function} options.onClose - Callback when modal closes
 * @param {boolean} options.closeOnBackdrop - Close when clicking backdrop
 * @returns {Object} Modal instance with show, hide, destroy methods
 */
export function createModal(options = {}) {
    const {
        id = `modal-${Date.now()}`,
        title = '',
        content = '',
        type = MODAL_TYPES.DEFAULT,
        showClose = true,
        buttons = [],
        onOpen = null,
        onClose = null,
        closeOnBackdrop = MODAL_CONFIG.closeOnBackdropClick,
        className = ''
    } = options;

    let modalElement = null;
    let isOpen = false;
    let previousFocus = null;

    /**
     * Render modal HTML
     */
    function render() {
        const buttonsHtml = buttons.map(btn => `
            <button class="modal-btn ${btn.variant || 'primary'}" data-action="${btn.action || 'close'}">
                ${btn.label}
            </button>
        `).join('');

        const html = `
            <div class="modal-overlay" data-modal-id="${id}">
                <div class="modal-container modal-${type} ${className}">
                    ${title ? `
                        <div class="modal-header">
                            <h2 class="modal-title">${title}</h2>
                            ${showClose ? '<button class="modal-close" aria-label="Close">✕</button>' : ''}
                        </div>
                    ` : (showClose ? '<button class="modal-close floating" aria-label="Close">✕</button>' : '')}
                    <div class="modal-body">
                        ${typeof content === 'string' ? content : ''}
                    </div>
                    ${buttons.length > 0 ? `
                        <div class="modal-footer">
                            ${buttonsHtml}
                        </div>
                    ` : ''}
                </div>
            </div>
        `;

        const wrapper = document.createElement('div');
        wrapper.innerHTML = html;
        modalElement = wrapper.firstElementChild;

        // If content is an element, append it
        if (typeof content !== 'string' && content instanceof HTMLElement) {
            modalElement.querySelector('.modal-body').appendChild(content);
        }

        // Event listeners
        setupEventListeners();

        return modalElement;
    }

    /**
     * Setup modal event listeners
     */
    function setupEventListeners() {
        // Close button
        const closeBtn = modalElement.querySelector('.modal-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', hide);
        }

        // Backdrop click
        if (closeOnBackdrop) {
            modalElement.addEventListener('click', (e) => {
                if (e.target === modalElement) {
                    hide();
                }
            });
        }

        // Button actions
        modalElement.querySelectorAll('.modal-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const action = btn.dataset.action;
                if (action === 'close') {
                    hide();
                } else {
                    // Dispatch custom event for action
                    const event = new CustomEvent('modalAction', {
                        detail: { action, modalId: id }
                    });
                    modalElement.dispatchEvent(event);
                }
            });
        });

        // Escape key
        if (MODAL_CONFIG.closeOnEscape) {
            document.addEventListener('keydown', handleEscape);
        }
    }

    /**
     * Handle escape key press
     */
    function handleEscape(e) {
        if (e.key === 'Escape' && isOpen && modalStack[modalStack.length - 1] === id) {
            hide();
        }
    }

    /**
     * Show the modal
     */
    function show() {
        if (isOpen) return;

        // Save previous focus
        previousFocus = document.activeElement;

        // Render if not already
        if (!modalElement) {
            render();
        }

        // Add to DOM
        document.body.appendChild(modalElement);
        modalStack.push(id);

        // Auto-pick readable text colors based on computed background (light/dark).
        try {
            applyAutoModalContrast(modalElement);
        } catch {
            // ignore
        }

        // Update z-index based on stack position
        modalElement.style.zIndex = MODAL_CONFIG.zIndex + modalStack.length;

        // Trigger reflow for animation
        modalElement.offsetHeight;
        modalElement.classList.add('visible');

        // Prevent body scroll
        document.body.style.overflow = 'hidden';

        isOpen = true;

        // Focus first focusable element
        setTimeout(() => {
            const focusable = modalElement.querySelector('button, input, [tabindex]:not([tabindex="-1"])');
            if (focusable) focusable.focus();
        }, MODAL_CONFIG.animationDuration);

        // Callback
        if (onOpen) onOpen();

        return modalInstance;
    }

    /**
     * Hide the modal
     */
    function hide() {
        if (!isOpen) return;

        modalElement.classList.remove('visible');

        // Remove from stack
        const stackIndex = modalStack.indexOf(id);
        if (stackIndex > -1) {
            modalStack.splice(stackIndex, 1);
        }

        // Remove after animation
        setTimeout(() => {
            if (modalElement && modalElement.parentNode) {
                modalElement.parentNode.removeChild(modalElement);
            }

            // Restore body scroll if no more modals
            if (modalStack.length === 0) {
                document.body.style.overflow = '';
            }

            // Restore focus
            if (previousFocus) {
                previousFocus.focus();
            }
        }, MODAL_CONFIG.animationDuration);

        isOpen = false;

        // Callback
        if (onClose) onClose();

        return modalInstance;
    }

    /**
     * Destroy modal completely
     */
    function destroy() {
        hide();
        document.removeEventListener('keydown', handleEscape);
        modalElement = null;
    }

    /**
     * Update modal content
     */
    function setContent(newContent) {
        if (!modalElement) return;
        const body = modalElement.querySelector('.modal-body');
        if (body) {
            if (typeof newContent === 'string') {
                body.innerHTML = newContent;
            } else if (newContent instanceof HTMLElement) {
                body.innerHTML = '';
                body.appendChild(newContent);
            }
        }
    }

    /**
     * Get modal element
     */
    function getElement() {
        return modalElement;
    }

    const modalInstance = {
        id,
        show,
        hide,
        destroy,
        setContent,
        getElement,
        isOpen: () => isOpen
    };

    return modalInstance;
}

/**
 * Quick alert modal
 * @param {string} message - Alert message
 * @param {string} title - Alert title
 * @returns {Promise} Resolves when closed
 */
export function showAlert(message, title = 'Alert') {
    return new Promise(resolve => {
        const modal = createModal({
            title,
            content: `<p class="modal-message">${message}</p>`,
            type: MODAL_TYPES.ALERT,
            buttons: [{ label: 'OK', action: 'close', variant: 'primary' }],
            onClose: () => {
                modal.destroy();
                resolve();
            }
        });
        modal.show();
    });
}

/**
 * Quick confirm modal
 * @param {string} message - Confirm message
 * @param {string} title - Confirm title
 * @returns {Promise<boolean>} Resolves with true/false
 */
export function showConfirm(message, title = 'Confirm') {
    return new Promise(resolve => {
        const modal = createModal({
            title,
            content: `<p class="modal-message">${message}</p>`,
            type: MODAL_TYPES.CONFIRM,
            buttons: [
                { label: 'Cancel', action: 'cancel', variant: 'secondary' },
                { label: 'OK', action: 'confirm', variant: 'primary' }
            ],
            closeOnBackdrop: false
        });

        modal.getElement()?.addEventListener('modalAction', (e) => {
            const confirmed = e.detail.action === 'confirm';
            modal.destroy();
            resolve(confirmed);
        });

        modal.show();
    });
}

/**
 * Show hearts modal (specific to this app)
 * @param {Object} options - Hearts modal options
 * @param {number} options.hearts - Current hearts count
 * @param {number} options.maxHearts - Maximum hearts
 * @param {string} options.refillTime - Time until next heart
 * @param {Function} options.onRefill - Callback for refill action
 */
export function showHeartsModal(options = {}) {
    const { hearts = 0, maxHearts = 5, refillTime = '5:00', onRefill = null } = options;
    
    const heartsDisplay = '❤️'.repeat(hearts) + '🖤'.repeat(maxHearts - hearts);
    
    const modal = createModal({
        id: 'heartsModal',
        title: '💔 Out of Hearts!',
        content: `
            <div class="hearts-modal-content">
                <div class="hearts-display">${heartsDisplay}</div>
                <p>You've run out of hearts! Hearts refill over time.</p>
                <div class="refill-timer">
                    <span class="timer-label">Next heart in:</span>
                    <span class="timer-value" id="refillCountdown">${refillTime}</span>
                </div>
            </div>
        `,
        type: MODAL_TYPES.ALERT,
        buttons: [
            { label: 'Wait', action: 'close', variant: 'secondary' },
            { label: '🎬 Watch Ad', action: 'refill', variant: 'primary' }
        ],
        className: 'hearts-modal'
    });

    if (onRefill) {
        modal.getElement()?.addEventListener('modalAction', (e) => {
            if (e.detail.action === 'refill') {
                onRefill();
                modal.hide();
            }
        });
    }

    return modal;
}

/**
 * Show login modal
 * @param {Object} options - Login modal options
 * @param {Function} options.onLogin - Login callback with password
 * @returns {Object} Modal instance
 */
export function showLoginModal(options = {}) {
    const { onLogin = null } = options;
    
    const modal = createModal({
        id: 'loginModal',
        title: '🔐 Admin Login',
        content: `
            <div class="login-modal-content">
                <input type="password" 
                       id="adminPassword" 
                       class="modal-input" 
                       placeholder="Enter admin password"
                       autocomplete="current-password">
                <p class="error-message" id="loginError" style="display: none;"></p>
            </div>
        `,
        type: MODAL_TYPES.DEFAULT,
        buttons: [
            { label: 'Cancel', action: 'close', variant: 'secondary' },
            { label: 'Login', action: 'login', variant: 'primary' }
        ],
        className: 'login-modal'
    });

    const element = modal.getElement();
    
    // Password input enter key
    const setupInput = () => {
        const input = element?.querySelector('#adminPassword');
        if (input) {
            input.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' && onLogin) {
                    onLogin(input.value);
                }
            });
            // Focus input after modal opens
            setTimeout(() => input.focus(), MODAL_CONFIG.animationDuration + 50);
        }
    };

    if (onLogin) {
        element?.addEventListener('modalAction', (e) => {
            if (e.detail.action === 'login') {
                const input = element.querySelector('#adminPassword');
                onLogin(input?.value || '');
            }
        });
    }

    // Override show to setup input
    const originalShow = modal.show;
    modal.show = () => {
        originalShow();
        setupInput();
        return modal;
    };

    return modal;
}

/**
 * Show paywall modal
 * @param {Object} options - Paywall options
 * @param {Function} options.onUpgrade - Upgrade callback
 * @returns {Object} Modal instance
 */
export function showPaywallModal(options = {}) {
    const { onUpgrade = null } = options;
    
    const modal = createModal({
        id: 'paywall',
        title: '⭐ Premium Content',
        content: `
            <div class="paywall-content">
                <div class="paywall-features">
                    <div class="feature">✓ Unlimited hearts</div>
                    <div class="feature">✓ All premium lessons</div>
                    <div class="feature">✓ Ad-free experience</div>
                    <div class="feature">✓ Priority AI support</div>
                </div>
                <p class="paywall-message">Upgrade to Premium to unlock this content!</p>
            </div>
        `,
        type: MODAL_TYPES.DEFAULT,
        buttons: [
            { label: 'Maybe Later', action: 'close', variant: 'secondary' },
            { label: 'Upgrade Now', action: 'upgrade', variant: 'primary' }
        ],
        className: 'paywall-modal'
    });

    if (onUpgrade) {
        modal.getElement()?.addEventListener('modalAction', (e) => {
            if (e.detail.action === 'upgrade') {
                onUpgrade();
            }
        });
    }

    return modal;
}

// Default export
export default {
    createModal,
    showAlert,
    showConfirm,
    showHeartsModal,
    showLoginModal,
    showPaywallModal,
    MODAL_TYPES,
    MODAL_CONFIG
};
