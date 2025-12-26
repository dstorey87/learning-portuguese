/**
 * Breadcrumb Component
 * Shows navigation breadcrumb trail for nested pages
 * 
 * @module components/navigation/Breadcrumb
 */

import { getBreadcrumbTrail } from '../../config/routes.config.js';

/**
 * Render breadcrumb navigation
 * @param {HTMLElement} container - Container to render into
 * @param {Object} options - Render options
 * @param {string} options.currentPage - Current page ID
 * @param {Array} options.customTrail - Custom breadcrumb trail (overrides auto-generated)
 * @param {Function} options.onNavigate - Navigation callback
 * @param {boolean} options.showIcons - Show icons in breadcrumb items
 */
export function renderBreadcrumb(container, options = {}) {
    const { 
        currentPage = 'home',
        customTrail = null,
        onNavigate,
        showIcons = true
    } = options;
    
    // Get breadcrumb trail
    const trail = customTrail || getBreadcrumbTrail(currentPage);
    
    // Don't show breadcrumb if only home or empty
    if (trail.length <= 1) {
        container.innerHTML = '';
        return;
    }
    
    const html = `
        <nav class="breadcrumb" aria-label="Breadcrumb navigation">
            <ol class="breadcrumb-list">
                ${trail.map((item, index) => {
                    const isLast = index === trail.length - 1;
                    return `
                        <li class="breadcrumb-item ${isLast ? 'current' : ''}">
                            ${isLast ? `
                                <span class="breadcrumb-text" aria-current="page">
                                    ${showIcons ? `<span class="breadcrumb-icon" aria-hidden="true">${item.icon}</span>` : ''}
                                    <span class="breadcrumb-label">${item.label}</span>
                                </span>
                            ` : `
                                <button class="breadcrumb-link" data-page="${item.id}" title="Go to ${item.label}">
                                    ${showIcons ? `<span class="breadcrumb-icon" aria-hidden="true">${item.icon}</span>` : ''}
                                    <span class="breadcrumb-label">${item.label}</span>
                                </button>
                                <span class="breadcrumb-separator" aria-hidden="true">›</span>
                            `}
                        </li>
                    `;
                }).join('')}
            </ol>
        </nav>
    `;
    
    container.innerHTML = html;
    
    // Setup event listeners
    setupBreadcrumbListeners(container, { onNavigate });
}

/**
 * Setup breadcrumb event listeners
 * @param {HTMLElement} container 
 * @param {Object} callbacks 
 */
function setupBreadcrumbListeners(container, callbacks = {}) {
    const { onNavigate } = callbacks;
    
    container.querySelectorAll('.breadcrumb-link').forEach(link => {
        link.addEventListener('click', () => {
            const pageId = link.dataset.page;
            onNavigate && onNavigate(pageId);
        });
        
        link.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                link.click();
            }
        });
    });
}

/**
 * Update breadcrumb for a new page
 * @param {HTMLElement} container - Container with breadcrumb
 * @param {string} pageId - New page ID
 * @param {Object} options - Same options as renderBreadcrumb
 */
export function updateBreadcrumb(container, pageId, options = {}) {
    renderBreadcrumb(container, { ...options, currentPage: pageId });
}

/**
 * Add custom item to breadcrumb trail
 * @param {HTMLElement} container - Container with breadcrumb
 * @param {Object} item - Item to add {id, label, icon}
 * @param {Object} options - Render options
 */
export function addBreadcrumbItem(container, item, options = {}) {
    const { onNavigate } = options;
    
    const list = container.querySelector('.breadcrumb-list');
    if (!list) return;
    
    // Remove "current" class from last item
    const lastItem = list.querySelector('.breadcrumb-item.current');
    if (lastItem) {
        lastItem.classList.remove('current');
        // Convert text to link
        const text = lastItem.querySelector('.breadcrumb-text');
        if (text) {
            const pageId = text.dataset?.page || lastItem.querySelector('[data-page]')?.dataset.page;
            const label = text.querySelector('.breadcrumb-label')?.textContent;
            const icon = text.querySelector('.breadcrumb-icon')?.textContent;
            
            lastItem.innerHTML = `
                <button class="breadcrumb-link" data-page="${pageId}" title="Go to ${label}">
                    ${icon ? `<span class="breadcrumb-icon" aria-hidden="true">${icon}</span>` : ''}
                    <span class="breadcrumb-label">${label}</span>
                </button>
                <span class="breadcrumb-separator" aria-hidden="true">›</span>
            `;
            
            const newLink = lastItem.querySelector('.breadcrumb-link');
            newLink?.addEventListener('click', () => {
                onNavigate && onNavigate(pageId);
            });
        }
    }
    
    // Add new item
    const newItem = document.createElement('li');
    newItem.className = 'breadcrumb-item current';
    newItem.innerHTML = `
        <span class="breadcrumb-text" aria-current="page">
            ${item.icon ? `<span class="breadcrumb-icon" aria-hidden="true">${item.icon}</span>` : ''}
            <span class="breadcrumb-label">${item.label}</span>
        </span>
    `;
    list.appendChild(newItem);
}

/**
 * Clear breadcrumb
 * @param {HTMLElement} container 
 */
export function clearBreadcrumb(container) {
    container.innerHTML = '';
}

export default {
    renderBreadcrumb,
    updateBreadcrumb,
    addBreadcrumbItem,
    clearBreadcrumb
};
