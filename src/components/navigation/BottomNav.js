/**
 * BottomNav Component
 * Mobile bottom navigation bar with core tabs
 * 
 * @module components/navigation/BottomNav
 */

import { 
    NAV_CONFIG,
    ACCESS_LEVELS,
    getMainNavRoutes
} from '../../config/routes.config.js';

/**
 * Current page state
 */
let currentPage = 'home';

/**
 * Set current page
 * @param {string} pageId 
 */
export function setCurrentPage(pageId) {
    currentPage = pageId;
}

/**
 * Render bottom navigation for mobile
 * @param {HTMLElement} container - Container to render into
 * @param {Object} options - Render options
 * @param {string} options.accessLevel - User access level
 * @param {Function} options.onNavigate - Navigation callback
 * @param {Function} options.onMoreClick - "More" button callback for drawer
 */
export function renderBottomNav(container, options = {}) {
    const { 
        accessLevel = ACCESS_LEVELS.PUBLIC,
        onNavigate,
        onMoreClick
    } = options;
    
    // Get main routes (limited to max items)
    const maxItems = NAV_CONFIG.bottomNav.maxItems;
    let routes = getMainNavRoutes(accessLevel);
    
    // If we have more routes than max, add a "more" button
    const hasMore = routes.length > maxItems - 1;
    if (hasMore) {
        routes = routes.slice(0, maxItems - 1);
    }
    
    const html = `
        <nav class="bottom-nav" id="bottomNav" role="navigation" aria-label="Main navigation">
            ${routes.map(route => `
                <button class="nav-tab ${currentPage === route.id ? 'active' : ''}" 
                        data-page="${route.id}"
                        role="tab"
                        aria-selected="${currentPage === route.id}"
                        aria-label="${route.label}"
                        title="${route.label}">
                    <span class="nav-icon" aria-hidden="true">${route.icon}</span>
                    <span class="nav-label">${route.label}</span>
                </button>
            `).join('')}
            
            ${hasMore || onMoreClick ? `
                <button class="nav-tab more-tab" 
                        id="moreNavBtn"
                        role="tab"
                        aria-label="More options"
                        aria-haspopup="true"
                        title="More options">
                    <span class="nav-icon" aria-hidden="true">☰</span>
                    <span class="nav-label">More</span>
                </button>
            ` : ''}
        </nav>
    `;
    
    container.innerHTML = html;
    
    // Add body class for bottom padding
    document.body.classList.add('has-bottom-nav');
    
    // Setup event listeners
    setupBottomNavListeners(container, { onNavigate, onMoreClick });
}

/**
 * Setup bottom nav event listeners
 * @param {HTMLElement} container 
 * @param {Object} callbacks 
 */
function setupBottomNavListeners(container, callbacks = {}) {
    const { onNavigate, onMoreClick } = callbacks;
    
    // Navigation tabs
    container.querySelectorAll('.nav-tab:not(.more-tab)').forEach(tab => {
        tab.addEventListener('click', () => {
            const pageId = tab.dataset.page;
            setCurrentPage(pageId);
            updateActiveState(container, pageId);
            onNavigate && onNavigate(pageId);
        });
    });
    
    // More button
    const moreBtn = container.querySelector('#moreNavBtn');
    if (moreBtn) {
        moreBtn.addEventListener('click', () => {
            onMoreClick && onMoreClick();
        });
    }
    
    // Touch feedback
    container.querySelectorAll('.nav-tab').forEach(tab => {
        tab.addEventListener('touchstart', () => {
            tab.classList.add('pressed');
        });
        
        tab.addEventListener('touchend', () => {
            tab.classList.remove('pressed');
        });
        
        tab.addEventListener('touchcancel', () => {
            tab.classList.remove('pressed');
        });
    });
}

/**
 * Update active state of nav tabs
 * @param {HTMLElement} container 
 * @param {string} activePageId 
 */
function updateActiveState(container, activePageId) {
    container.querySelectorAll('.nav-tab').forEach(tab => {
        const isActive = tab.dataset.page === activePageId;
        tab.classList.toggle('active', isActive);
        tab.setAttribute('aria-selected', isActive);
    });
}

/**
 * Update bottom nav active page (called from external navigation)
 * @param {string} pageId 
 */
export function updateBottomNavActive(pageId) {
    currentPage = pageId;
    const container = document.getElementById('bottomNav');
    if (container) {
        updateActiveState(container, pageId);
    }
}

/**
 * Show badge on a nav tab
 * @param {string} pageId - Page ID to show badge on
 * @param {number|string} count - Badge count (0 or empty to hide)
 */
export function showNavBadge(pageId, count) {
    const tab = document.querySelector(`.nav-tab[data-page="${pageId}"]`);
    if (!tab) return;
    
    let badge = tab.querySelector('.nav-badge');
    
    if (!count || count === 0) {
        // Remove badge
        badge?.remove();
        return;
    }
    
    if (!badge) {
        badge = document.createElement('span');
        badge.className = 'nav-badge';
        badge.setAttribute('aria-label', `${count} notifications`);
        tab.appendChild(badge);
    }
    
    badge.textContent = count > 99 ? '99+' : count;
}

/**
 * Hide badge from a nav tab
 * @param {string} pageId 
 */
export function hideNavBadge(pageId) {
    showNavBadge(pageId, 0);
}

/**
 * Cleanup bottom nav
 */
export function destroyBottomNav() {
    document.body.classList.remove('has-bottom-nav');
    const bottomNav = document.getElementById('bottomNav');
    if (bottomNav) {
        bottomNav.remove();
    }
}

export default {
    setCurrentPage,
    renderBottomNav,
    updateBottomNavActive,
    showNavBadge,
    hideNavBadge,
    destroyBottomNav
};
