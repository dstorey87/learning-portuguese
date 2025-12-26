/**
 * MobileDrawer Component
 * Mobile hamburger menu drawer for additional navigation items
 * 
 * @module components/navigation/MobileDrawer
 */

import { 
    NAV_CONFIG,
    ACCESS_LEVELS,
    getDrawerRoutes,
    getMainNavRoutes
} from '../../config/routes.config.js';

/**
 * Drawer state
 */
let isOpen = false;

/**
 * Check if drawer is open
 * @returns {boolean}
 */
export function isDrawerOpen() {
    return isOpen;
}

/**
 * Open the drawer
 */
export function openDrawer() {
    const drawer = document.getElementById('mobileDrawer');
    const overlay = document.getElementById('drawerOverlay');
    
    if (drawer && overlay) {
        isOpen = true;
        drawer.classList.add('open');
        overlay.classList.add('visible');
        document.body.classList.add('drawer-open');
        
        // Trap focus in drawer
        drawer.setAttribute('aria-hidden', 'false');
        const firstFocusable = drawer.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
        firstFocusable?.focus();
        
        // Dispatch event
        window.dispatchEvent(new CustomEvent('drawerOpen'));
    }
}

/**
 * Close the drawer
 */
export function closeDrawer() {
    const drawer = document.getElementById('mobileDrawer');
    const overlay = document.getElementById('drawerOverlay');
    
    if (drawer && overlay) {
        isOpen = false;
        drawer.classList.remove('open');
        overlay.classList.remove('visible');
        document.body.classList.remove('drawer-open');
        
        drawer.setAttribute('aria-hidden', 'true');
        
        // Return focus to trigger button
        const moreBtn = document.getElementById('moreNavBtn');
        moreBtn?.focus();
        
        // Dispatch event
        window.dispatchEvent(new CustomEvent('drawerClose'));
    }
}

/**
 * Toggle drawer open/close
 */
export function toggleDrawer() {
    if (isOpen) {
        closeDrawer();
    } else {
        openDrawer();
    }
}

/**
 * Render mobile drawer
 * @param {HTMLElement} container - Container to render into
 * @param {Object} options - Render options
 * @param {string} options.accessLevel - User access level
 * @param {Function} options.onNavigate - Navigation callback
 * @param {Object} options.stats - User stats {hearts, streak, xp}
 * @param {Object} options.user - User info {name, email}
 */
export function renderMobileDrawer(container, options = {}) {
    const { 
        accessLevel = ACCESS_LEVELS.PUBLIC,
        onNavigate,
        stats = { hearts: 5, streak: 0, xp: 0 },
        user = null
    } = options;
    
    // Get drawer routes
    const drawerRoutes = getDrawerRoutes(accessLevel);
    const mainRoutes = getMainNavRoutes(accessLevel);
    
    const html = `
        <div class="drawer-overlay" id="drawerOverlay" aria-hidden="true"></div>
        <aside class="mobile-drawer" id="mobileDrawer" 
               role="dialog" 
               aria-modal="true" 
               aria-label="Navigation menu"
               aria-hidden="true">
            
            <div class="drawer-header">
                <div class="drawer-user">
                    ${user ? `
                        <div class="user-avatar" aria-hidden="true">
                            ${user.name ? user.name.charAt(0).toUpperCase() : '👤'}
                        </div>
                        <div class="user-info">
                            <div class="user-name">${user.name || 'Guest'}</div>
                            ${user.email ? `<div class="user-email">${user.email}</div>` : ''}
                        </div>
                    ` : `
                        <div class="user-avatar guest" aria-hidden="true">👤</div>
                        <div class="user-info">
                            <div class="user-name">Guest</div>
                            <div class="user-hint">Sign in to save progress</div>
                        </div>
                    `}
                </div>
                <button class="drawer-close" id="drawerCloseBtn" aria-label="Close menu">
                    <span aria-hidden="true">✕</span>
                </button>
            </div>
            
            <div class="drawer-stats">
                <div class="stat-item">
                    <span class="stat-icon" aria-hidden="true">❤️</span>
                    <span class="stat-value">${stats.hearts === Infinity ? '∞' : stats.hearts}</span>
                    <span class="stat-label">Hearts</span>
                </div>
                <div class="stat-item">
                    <span class="stat-icon" aria-hidden="true">🔥</span>
                    <span class="stat-value">${stats.streak}</span>
                    <span class="stat-label">Streak</span>
                </div>
                <div class="stat-item">
                    <span class="stat-icon" aria-hidden="true">⭐</span>
                    <span class="stat-value">${stats.xp}</span>
                    <span class="stat-label">XP</span>
                </div>
            </div>
            
            <nav class="drawer-nav" role="menu" aria-label="Main navigation">
                <div class="drawer-section">
                    <div class="drawer-section-label">Navigation</div>
                    ${mainRoutes.map(route => `
                        <button class="drawer-item" 
                                data-page="${route.id}"
                                role="menuitem"
                                title="${route.description || route.label}">
                            <span class="drawer-icon" aria-hidden="true">${route.icon}</span>
                            <span class="drawer-label">${route.label}</span>
                        </button>
                    `).join('')}
                </div>
                
                ${drawerRoutes.length > 0 ? `
                    <div class="drawer-divider" role="separator"></div>
                    <div class="drawer-section">
                        <div class="drawer-section-label">More</div>
                        ${drawerRoutes.map(route => `
                            <button class="drawer-item" 
                                    data-page="${route.id}"
                                    role="menuitem"
                                    title="${route.description || route.label}">
                                <span class="drawer-icon" aria-hidden="true">${route.icon}</span>
                                <span class="drawer-label">${route.label}</span>
                            </button>
                        `).join('')}
                    </div>
                ` : ''}
            </nav>
            
            <div class="drawer-footer">
                <div class="app-version">PortuLingo v2.0</div>
            </div>
        </aside>
    `;
    
    container.innerHTML = html;
    
    // Setup event listeners
    setupDrawerListeners(container, { onNavigate });
}

/**
 * Setup drawer event listeners
 * @param {HTMLElement} container 
 * @param {Object} callbacks 
 */
function setupDrawerListeners(container, callbacks = {}) {
    const { onNavigate } = callbacks;
    
    // Close button
    const closeBtn = container.querySelector('#drawerCloseBtn');
    if (closeBtn) {
        closeBtn.addEventListener('click', closeDrawer);
    }
    
    // Overlay click to close
    const overlay = container.querySelector('#drawerOverlay');
    if (overlay) {
        overlay.addEventListener('click', closeDrawer);
    }
    
    // Navigation items
    container.querySelectorAll('.drawer-item').forEach(item => {
        item.addEventListener('click', () => {
            const pageId = item.dataset.page;
            closeDrawer();
            onNavigate && onNavigate(pageId);
        });
    });
    
    // Escape key to close
    document.addEventListener('keydown', handleEscapeKey);
    
    // Swipe to close (touch gesture)
    setupSwipeGesture(container);
}

/**
 * Handle escape key
 * @param {KeyboardEvent} e 
 */
function handleEscapeKey(e) {
    if (e.key === 'Escape' && isOpen) {
        closeDrawer();
    }
}

/**
 * Setup swipe gesture for closing drawer
 * @param {HTMLElement} container 
 */
function setupSwipeGesture(container) {
    const drawer = container.querySelector('#mobileDrawer');
    if (!drawer) return;
    
    let touchStartX = 0;
    let touchEndX = 0;
    const minSwipeDistance = 50;
    
    drawer.addEventListener('touchstart', (e) => {
        touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });
    
    drawer.addEventListener('touchend', (e) => {
        touchEndX = e.changedTouches[0].screenX;
        handleSwipe();
    }, { passive: true });
    
    function handleSwipe() {
        const swipeDistance = touchStartX - touchEndX;
        // Swipe left to close (since drawer opens from right)
        if (swipeDistance > minSwipeDistance && isOpen) {
            closeDrawer();
        }
    }
}

/**
 * Update drawer stats
 * @param {Object} stats - { hearts, streak, xp }
 */
export function updateDrawerStats(stats) {
    const drawer = document.getElementById('mobileDrawer');
    if (!drawer) return;
    
    const statItems = drawer.querySelectorAll('.stat-item');
    if (statItems.length >= 3) {
        statItems[0].querySelector('.stat-value').textContent = stats.hearts === Infinity ? '∞' : stats.hearts;
        statItems[1].querySelector('.stat-value').textContent = stats.streak;
        statItems[2].querySelector('.stat-value').textContent = stats.xp;
    }
}

/**
 * Update drawer user info
 * @param {Object} user - { name, email }
 */
export function updateDrawerUser(user) {
    const drawer = document.getElementById('mobileDrawer');
    if (!drawer) return;
    
    const userInfo = drawer.querySelector('.drawer-user');
    if (userInfo && user) {
        const nameEl = userInfo.querySelector('.user-name');
        const avatarEl = userInfo.querySelector('.user-avatar');
        
        if (nameEl) nameEl.textContent = user.name || 'Guest';
        if (avatarEl) {
            avatarEl.textContent = user.name ? user.name.charAt(0).toUpperCase() : '👤';
            avatarEl.classList.toggle('guest', !user.name);
        }
    }
}

/**
 * Cleanup drawer
 */
export function destroyMobileDrawer() {
    document.removeEventListener('keydown', handleEscapeKey);
    document.body.classList.remove('drawer-open');
    
    const drawer = document.getElementById('mobileDrawer');
    const overlay = document.getElementById('drawerOverlay');
    
    drawer?.remove();
    overlay?.remove();
}

export default {
    isDrawerOpen,
    openDrawer,
    closeDrawer,
    toggleDrawer,
    renderMobileDrawer,
    updateDrawerStats,
    updateDrawerUser,
    destroyMobileDrawer
};
