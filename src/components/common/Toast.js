/**
 * Toast Notification Component
 * 
 * Provides a flexible toast notification system with:
 * - Multiple toast types (success, error, warning, info)
 * - Queue management for multiple notifications
 * - Auto-dismiss with configurable duration
 * - Progress bar indicator
 * - Click to dismiss
 * - Stacking support for multiple toasts
 * - Accessibility support (aria-live regions)
 * 
 * @module components/common/Toast
 */

// ============================================================================
// CONFIGURATION
// ============================================================================

/**
 * Toast type constants
 * @readonly
 * @enum {string}
 */
export const TOAST_TYPES = {
    SUCCESS: 'success',
    ERROR: 'error',
    WARNING: 'warning',
    INFO: 'info'
};

/**
 * Toast position constants
 * @readonly
 * @enum {string}
 */
export const TOAST_POSITIONS = {
    TOP_CENTER: 'top-center',
    TOP_RIGHT: 'top-right',
    TOP_LEFT: 'top-left',
    BOTTOM_CENTER: 'bottom-center',
    BOTTOM_RIGHT: 'bottom-right',
    BOTTOM_LEFT: 'bottom-left'
};

/**
 * Default configuration for toasts
 */
export const TOAST_CONFIG = {
    defaultDuration: 3000,
    maxToasts: 5,
    position: TOAST_POSITIONS.TOP_CENTER,
    showProgressBar: true,
    pauseOnHover: true,
    closeOnClick: true,
    gap: 12,
    animationDuration: 300
};

/**
 * Toast type styling configuration
 */
const TOAST_STYLES = {
    [TOAST_TYPES.SUCCESS]: {
        icon: '✓',
        color: '#10b981',
        bgColor: '#ecfdf5',
        borderColor: '#10b981'
    },
    [TOAST_TYPES.ERROR]: {
        icon: '✕',
        color: '#ef4444',
        bgColor: '#fef2f2',
        borderColor: '#ef4444'
    },
    [TOAST_TYPES.WARNING]: {
        icon: '⚠',
        color: '#f59e0b',
        bgColor: '#fffbeb',
        borderColor: '#f59e0b'
    },
    [TOAST_TYPES.INFO]: {
        icon: 'ℹ',
        color: '#3b82f6',
        bgColor: '#eff6ff',
        borderColor: '#3b82f6'
    }
};

// ============================================================================
// STATE MANAGEMENT
// ============================================================================

/**
 * Toast manager state
 */
const toastState = {
    container: null,
    toasts: [],
    queue: [],
    idCounter: 0,
    config: { ...TOAST_CONFIG }
};

// ============================================================================
// PRIVATE FUNCTIONS
// ============================================================================

/**
 * Get or create the toast container
 * @returns {HTMLElement} Toast container element
 */
function getContainer() {
    if (toastState.container && document.body.contains(toastState.container)) {
        return toastState.container;
    }

    const container = document.createElement('div');
    container.className = 'toast-container';
    container.setAttribute('aria-live', 'polite');
    container.setAttribute('aria-atomic', 'true');
    container.dataset.position = toastState.config.position;
    
    document.body.appendChild(container);
    toastState.container = container;
    
    return container;
}

/**
 * Calculate position styles based on configuration
 * @returns {string} CSS position styles
 */
function getPositionStyles() {
    const pos = toastState.config.position;
    const gap = toastState.config.gap;
    
    const positions = {
        'top-center': `top: ${gap}px; left: 50%; transform: translateX(-50%);`,
        'top-right': `top: ${gap}px; right: ${gap}px;`,
        'top-left': `top: ${gap}px; left: ${gap}px;`,
        'bottom-center': `bottom: ${gap}px; left: 50%; transform: translateX(-50%);`,
        'bottom-right': `bottom: ${gap}px; right: ${gap}px;`,
        'bottom-left': `bottom: ${gap}px; left: ${gap}px;`
    };
    
    return positions[pos] || positions['top-center'];
}

/**
 * Create a toast element
 * @param {Object} options - Toast options
 * @returns {HTMLElement} Toast element
 */
function createToastElement(options) {
    const { id, message, type, duration, showProgress } = options;
    const style = TOAST_STYLES[type] || TOAST_STYLES[TOAST_TYPES.INFO];
    
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.dataset.toastId = id;
    toast.setAttribute('role', 'alert');
    
    // Build toast content
    const iconEl = document.createElement('span');
    iconEl.className = 'toast-icon';
    iconEl.textContent = style.icon;
    iconEl.setAttribute('aria-hidden', 'true');
    
    const contentEl = document.createElement('div');
    contentEl.className = 'toast-content';
    
    const messageEl = document.createElement('span');
    messageEl.className = 'toast-message';
    messageEl.textContent = message;
    
    contentEl.appendChild(messageEl);
    
    const closeBtn = document.createElement('button');
    closeBtn.className = 'toast-close';
    closeBtn.innerHTML = '×';
    closeBtn.setAttribute('aria-label', 'Close notification');
    closeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        dismissToast(id);
    });
    
    toast.appendChild(iconEl);
    toast.appendChild(contentEl);
    toast.appendChild(closeBtn);
    
    // Add progress bar if enabled
    if (showProgress && duration > 0) {
        const progressWrapper = document.createElement('div');
        progressWrapper.className = 'toast-progress-wrapper';
        
        const progressBar = document.createElement('div');
        progressBar.className = 'toast-progress';
        progressBar.style.animationDuration = `${duration}ms`;
        
        progressWrapper.appendChild(progressBar);
        toast.appendChild(progressWrapper);
    }
    
    // Click to dismiss
    if (toastState.config.closeOnClick) {
        toast.style.cursor = 'pointer';
        toast.addEventListener('click', () => dismissToast(id));
    }
    
    // Pause on hover
    if (toastState.config.pauseOnHover && duration > 0) {
        toast.addEventListener('mouseenter', () => {
            const toastData = toastState.toasts.find(t => t.id === id);
            if (toastData && toastData.timeoutId) {
                clearTimeout(toastData.timeoutId);
                toastData.paused = true;
                const progressEl = toast.querySelector('.toast-progress');
                if (progressEl) {
                    progressEl.style.animationPlayState = 'paused';
                }
            }
        });
        
        toast.addEventListener('mouseleave', () => {
            const toastData = toastState.toasts.find(t => t.id === id);
            if (toastData && toastData.paused) {
                toastData.paused = false;
                const remaining = toastData.remainingTime || duration / 2;
                toastData.timeoutId = setTimeout(() => dismissToast(id), remaining);
                const progressEl = toast.querySelector('.toast-progress');
                if (progressEl) {
                    progressEl.style.animationPlayState = 'running';
                }
            }
        });
    }
    
    return toast;
}

/**
 * Process the toast queue
 */
function processQueue() {
    const maxToasts = toastState.config.maxToasts;
    
    while (toastState.queue.length > 0 && toastState.toasts.length < maxToasts) {
        const options = toastState.queue.shift();
        displayToast(options);
    }
}

/**
 * Display a toast immediately
 * @param {Object} options - Toast options
 */
function displayToast(options) {
    const container = getContainer();
    const toast = createToastElement(options);
    
    // Add to container
    if (toastState.config.position.startsWith('bottom')) {
        container.insertBefore(toast, container.firstChild);
    } else {
        container.appendChild(toast);
    }
    
    // Trigger animation
    requestAnimationFrame(() => {
        toast.classList.add('toast-visible');
    });
    
    // Set up auto-dismiss
    let timeoutId = null;
    if (options.duration > 0) {
        timeoutId = setTimeout(() => dismissToast(options.id), options.duration);
    }
    
    // Track toast
    toastState.toasts.push({
        id: options.id,
        element: toast,
        timeoutId,
        remainingTime: options.duration,
        paused: false
    });
}

/**
 * Dismiss a toast by ID
 * @param {number} id - Toast ID
 */
function dismissToast(id) {
    const index = toastState.toasts.findIndex(t => t.id === id);
    if (index === -1) return;
    
    const toastData = toastState.toasts[index];
    const toast = toastData.element;
    
    // Clear timeout
    if (toastData.timeoutId) {
        clearTimeout(toastData.timeoutId);
    }
    
    // Animate out
    toast.classList.remove('toast-visible');
    toast.classList.add('toast-exiting');
    
    // Remove after animation
    setTimeout(() => {
        if (toast.parentNode) {
            toast.parentNode.removeChild(toast);
        }
        
        // Remove from state
        toastState.toasts = toastState.toasts.filter(t => t.id !== id);
        
        // Process queue
        processQueue();
    }, toastState.config.animationDuration);
}

// ============================================================================
// PUBLIC API
// ============================================================================

/**
 * Show a toast notification
 * @param {string} message - Message to display
 * @param {string} [type='info'] - Toast type (success, error, warning, info)
 * @param {Object} [options={}] - Additional options
 * @param {number} [options.duration] - Duration in ms (0 for persistent)
 * @param {boolean} [options.showProgress] - Show progress bar
 * @returns {number} Toast ID for programmatic control
 */
export function showToast(message, type = TOAST_TYPES.INFO, options = {}) {
    const id = ++toastState.idCounter;
    
    const toastOptions = {
        id,
        message,
        type: Object.values(TOAST_TYPES).includes(type) ? type : TOAST_TYPES.INFO,
        duration: options.duration !== undefined ? options.duration : toastState.config.defaultDuration,
        showProgress: options.showProgress !== undefined ? options.showProgress : toastState.config.showProgressBar
    };
    
    // Queue or display immediately
    if (toastState.toasts.length >= toastState.config.maxToasts) {
        toastState.queue.push(toastOptions);
    } else {
        displayToast(toastOptions);
    }
    
    return id;
}

/**
 * Show a success toast
 * @param {string} message - Message to display
 * @param {Object} [options={}] - Additional options
 * @returns {number} Toast ID
 */
export function showSuccess(message, options = {}) {
    return showToast(message, TOAST_TYPES.SUCCESS, options);
}

/**
 * Show an error toast
 * @param {string} message - Message to display
 * @param {Object} [options={}] - Additional options
 * @returns {number} Toast ID
 */
export function showError(message, options = {}) {
    return showToast(message, TOAST_TYPES.ERROR, { duration: 5000, ...options });
}

/**
 * Show a warning toast
 * @param {string} message - Message to display
 * @param {Object} [options={}] - Additional options
 * @returns {number} Toast ID
 */
export function showWarning(message, options = {}) {
    return showToast(message, TOAST_TYPES.WARNING, options);
}

/**
 * Show an info toast
 * @param {string} message - Message to display
 * @param {Object} [options={}] - Additional options
 * @returns {number} Toast ID
 */
export function showInfo(message, options = {}) {
    return showToast(message, TOAST_TYPES.INFO, options);
}

/**
 * Legacy notification function (for backward compatibility)
 * @param {string} message - Message to display
 * @param {string} [type='info'] - Toast type
 * @returns {number} Toast ID
 */
export function showNotification(message, type = 'info') {
    return showToast(message, type);
}

/**
 * Dismiss a specific toast
 * @param {number} id - Toast ID to dismiss
 */
export function dismiss(id) {
    dismissToast(id);
}

/**
 * Dismiss all toasts
 */
export function dismissAll() {
    // Clear queue
    toastState.queue = [];
    
    // Dismiss all active toasts
    [...toastState.toasts].forEach(t => dismissToast(t.id));
}

/**
 * Configure toast settings
 * @param {Object} config - Configuration options
 */
export function configure(config = {}) {
    Object.assign(toastState.config, config);
    
    // Update container position if it exists
    if (toastState.container) {
        toastState.container.dataset.position = toastState.config.position;
    }
}

/**
 * Get current toast count
 * @returns {number} Number of active toasts
 */
export function getActiveCount() {
    return toastState.toasts.length;
}

/**
 * Get queue length
 * @returns {number} Number of queued toasts
 */
export function getQueueLength() {
    return toastState.queue.length;
}

/**
 * Initialize toast system (optional - auto-initializes on first use)
 * @param {Object} [config={}] - Initial configuration
 */
export function initToast(config = {}) {
    configure(config);
    getContainer(); // Create container
    console.log('[Toast] System initialized');
}

// ============================================================================
// DEFAULT EXPORT
// ============================================================================

/**
 * Toast namespace for grouped access
 */
const Toast = {
    // Types
    TYPES: TOAST_TYPES,
    POSITIONS: TOAST_POSITIONS,
    
    // Core functions
    show: showToast,
    success: showSuccess,
    error: showError,
    warning: showWarning,
    info: showInfo,
    
    // Legacy compatibility
    notify: showNotification,
    
    // Control functions
    dismiss,
    dismissAll,
    configure,
    
    // Utilities
    getActiveCount,
    getQueueLength,
    init: initToast
};

export default Toast;
