/**
 * Common Components Index
 * 
 * @module components/common
 */

export {
    createModal,
    showAlert,
    showConfirm,
    showHeartsModal,
    showLoginModal,
    showPaywallModal,
    MODAL_TYPES,
    MODAL_CONFIG,
    default as Modal
} from './Modal.js';

export {
    showToast,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    showNotification,
    dismiss as dismissToast,
    dismissAll as dismissAllToasts,
    configure as configureToast,
    initToast,
    getActiveCount as getToastCount,
    getQueueLength as getToastQueueLength,
    TOAST_TYPES,
    TOAST_POSITIONS,
    TOAST_CONFIG,
    default as Toast
} from './Toast.js';

// Future exports
// export { Button } from './Button.js';
// export { StatusIndicator } from './StatusIndicator.js';
// export { Accordion } from './Accordion.js';
