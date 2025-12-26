/**
 * Sidebar Component
 * Desktop sidebar navigation with collapsible functionality
 * 
 * @module components/navigation/Sidebar
 */

import { 
    ROUTES,
    NAV_CONFIG,
    BREAKPOINTS,
    ACCESS_LEVELS,
    getMainNavRoutes,
    getDesktopOnlyRoutes,
    isDesktopViewport,
    isTabletViewport
} from '../../config/routes.config.js';

/**
 * Sidebar state
 */
let isCollapsed = false;
let currentPage = 'home';

/**
 * Initialize sidebar state from localStorage
 */
export function initSidebarState() {
    const saved = localStorage.getItem('sidebarCollapsed');
    if (saved !== null) {
        isCollapsed = saved === 'true';
    } else {
        // Default: collapsed on tablet, expanded on desktop
        isCollapsed = isTabletViewport();
    }
    return isCollapsed;
}

/**
 * Get collapsed state
 * @returns {boolean}
 */
export function getSidebarCollapsed() {
    return isCollapsed;
}

/**
 * Set current page
 * @param {string} pageId 
 */
export function setCurrentPage(pageId) {
    currentPage = pageId;
}

/**
 * Toggle sidebar collapsed state
 * @returns {boolean} New collapsed state
 */
export function toggleSidebar() {
    isCollapsed = !isCollapsed;
    localStorage.setItem('sidebarCollapsed', isCollapsed);
    
    const sidebar = document.querySelector('.sidebar');
    if (sidebar) {
        sidebar.classList.toggle('collapsed', isCollapsed);
        updateSidebarLabels(sidebar, isCollapsed);
        updateToggleIcon(sidebar, isCollapsed);
    }
    
    // Update body class for main content margin
    document.body.classList.toggle('sidebar-collapsed', isCollapsed);
    
    // Dispatch event for other components
    window.dispatchEvent(new CustomEvent('sidebarToggle', { 
        detail: { collapsed: isCollapsed } 
    }));
    
    return isCollapsed;
}

/**
 * Update sidebar labels visibility
 * @param {HTMLElement} sidebar 
 * @param {boolean} collapsed 
 */
function updateSidebarLabels(sidebar, collapsed) {
    sidebar.querySelectorAll('.nav-label, .logo-text').forEach(el => {
        el.classList.toggle('hidden', collapsed);
    });
    
    // Update stats layout
    const stats = sidebar.querySelector('.user-stats');
    if (stats) {
        stats.classList.toggle('compact', collapsed);
    }
}

/**
 * Update toggle button icon
 * @param {HTMLElement} sidebar 
 * @param {boolean} collapsed 
 */
function updateToggleIcon(sidebar, collapsed) {
    const toggle = sidebar.querySelector('.sidebar-toggle .toggle-icon');
    if (toggle) {
        toggle.textContent = collapsed ? '→' : '←';
    }
}

/**
 * Render sidebar navigation
 * @param {HTMLElement} container - Container to render into
 * @param {Object} options - Render options
 * @param {string} options.accessLevel - User access level
 * @param {Function} options.onNavigate - Navigation callback
 * @param {Function} options.onLogoClick - Logo click callback
 * @param {Object} options.stats - User stats {hearts, streak, xp}
 */
export function renderSidebar(container, options = {}) {
    const { 
        accessLevel = ACCESS_LEVELS.PUBLIC,
        onNavigate,
        onLogoClick,
        stats = { hearts: 5, streak: 0, xp: 0 }
    } = options;
    
    // Initialize collapsed state
    initSidebarState();
    
    // Get routes based on access level
    const mainRoutes = getMainNavRoutes(accessLevel);
    const adminRoutes = accessLevel === ACCESS_LEVELS.ADMIN 
        ? getDesktopOnlyRoutes(accessLevel) 
        : [];
    
    const html = `
        <aside class="sidebar ${isCollapsed ? 'collapsed' : ''}" id="sidebar" role="navigation" aria-label="Main navigation">
            <div class="sidebar-header">
                <button class="logo-btn" id="sidebarLogoBtn" aria-label="PortuLingo Home" title="Home (triple-click for admin)">
                    <span class="logo-icon" aria-hidden="true">🇵🇹</span>
                    <span class="logo-text ${isCollapsed ? 'hidden' : ''}">PortuLingo</span>
                </button>
                <button class="sidebar-toggle" id="sidebarToggle" aria-label="${isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}" title="Toggle sidebar (Alt+S)">
                    <span class="toggle-icon" aria-hidden="true">${isCollapsed ? '→' : '←'}</span>
                </button>
            </div>
            
            <nav class="sidebar-nav" role="menubar" aria-label="Main menu">
                ${renderNavItems(mainRoutes, isCollapsed)}
                
                ${adminRoutes.length > 0 ? `
                    <div class="sidebar-divider" role="separator"></div>
                    <div class="sidebar-section-label ${isCollapsed ? 'hidden' : ''}">Admin</div>
                    ${renderNavItems(adminRoutes, isCollapsed)}
                ` : ''}
            </nav>
            
            <div class="sidebar-footer">
                <div class="user-stats ${isCollapsed ? 'compact' : ''}" aria-label="Your stats">
                    <span class="stat" title="Hearts remaining">
                        <span aria-hidden="true">❤️</span>
                        <span class="stat-value" id="sidebarHearts">${stats.hearts === Infinity ? '∞' : stats.hearts}</span>
                        <span class="stat-label ${isCollapsed ? 'hidden' : ''}">Hearts</span>
                    </span>
                    <span class="stat" title="Day streak">
                        <span aria-hidden="true">🔥</span>
                        <span class="stat-value" id="sidebarStreak">${stats.streak}</span>
                        <span class="stat-label ${isCollapsed ? 'hidden' : ''}">Streak</span>
                    </span>
                    <span class="stat" title="Experience points">
                        <span aria-hidden="true">⭐</span>
                        <span class="stat-value" id="sidebarXP">${stats.xp}</span>
                        <span class="stat-label ${isCollapsed ? 'hidden' : ''}">XP</span>
                    </span>
                </div>
            </div>
        </aside>
    `;
    
    container.innerHTML = html;
    
    // Update body class
    document.body.classList.add('has-sidebar');
    document.body.classList.toggle('sidebar-collapsed', isCollapsed);
    
    // Setup event listeners
    setupSidebarListeners(container, { onNavigate, onLogoClick });
}

/**
 * Render navigation items
 * @param {Array} routes - Routes to render
 * @param {boolean} collapsed - Whether sidebar is collapsed
 * @returns {string} HTML string
 */
function renderNavItems(routes, collapsed) {
    return routes.map(route => `
        <button class="sidebar-item ${currentPage === route.id ? 'active' : ''}" 
                data-page="${route.id}"
                role="menuitem"
                aria-current="${currentPage === route.id ? 'page' : 'false'}"
                title="${route.label}${route.description ? ': ' + route.description : ''}">
            <span class="nav-icon" aria-hidden="true">${route.icon}</span>
            <span class="nav-label ${collapsed ? 'hidden' : ''}">${route.label}</span>
        </button>
    `).join('');
}

/**
 * Setup sidebar event listeners
 * @param {HTMLElement} container 
 * @param {Object} callbacks 
 */
function setupSidebarListeners(container, callbacks = {}) {
    const { onNavigate, onLogoClick } = callbacks;
    
    // Navigation items
    container.querySelectorAll('.sidebar-item').forEach(item => {
        item.addEventListener('click', () => {
            const pageId = item.dataset.page;
            setCurrentPage(pageId);
            updateActiveState(container, pageId);
            onNavigate && onNavigate(pageId);
        });
        
        // Keyboard support
        item.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                item.click();
            }
        });
    });
    
    // Toggle button
    const toggle = container.querySelector('#sidebarToggle');
    if (toggle) {
        toggle.addEventListener('click', toggleSidebar);
    }
    
    // Logo button
    const logoBtn = container.querySelector('#sidebarLogoBtn');
    if (logoBtn) {
        logoBtn.addEventListener('click', () => {
            onLogoClick && onLogoClick();
        });
    }
    
    // Keyboard navigation within sidebar
    setupKeyboardNavigation(container);
}

/**
 * Setup keyboard navigation for sidebar
 * @param {HTMLElement} container 
 */
function setupKeyboardNavigation(container) {
    const items = container.querySelectorAll('.sidebar-item');
    
    items.forEach((item, index) => {
        item.addEventListener('keydown', (e) => {
            let targetIndex = index;
            
            switch (e.key) {
                case 'ArrowDown':
                    e.preventDefault();
                    targetIndex = (index + 1) % items.length;
                    break;
                case 'ArrowUp':
                    e.preventDefault();
                    targetIndex = (index - 1 + items.length) % items.length;
                    break;
                case 'Home':
                    e.preventDefault();
                    targetIndex = 0;
                    break;
                case 'End':
                    e.preventDefault();
                    targetIndex = items.length - 1;
                    break;
                default:
                    return;
            }
            
            items[targetIndex].focus();
        });
    });
}

/**
 * Update active state of nav items
 * @param {HTMLElement} container 
 * @param {string} activePageId 
 */
function updateActiveState(container, activePageId) {
    container.querySelectorAll('.sidebar-item').forEach(item => {
        const isActive = item.dataset.page === activePageId;
        item.classList.toggle('active', isActive);
        item.setAttribute('aria-current', isActive ? 'page' : 'false');
    });
}

/**
 * Update sidebar stats display
 * @param {Object} stats - { hearts, streak, xp }
 */
export function updateSidebarStats(stats) {
    const { hearts, streak, xp } = stats;
    
    const heartsEl = document.getElementById('sidebarHearts');
    const streakEl = document.getElementById('sidebarStreak');
    const xpEl = document.getElementById('sidebarXP');
    
    if (heartsEl) heartsEl.textContent = hearts === Infinity ? '∞' : hearts;
    if (streakEl) streakEl.textContent = streak;
    if (xpEl) xpEl.textContent = xp;
}

/**
 * Set sidebar collapsed state programmatically
 * @param {boolean} collapsed 
 */
export function setSidebarCollapsed(collapsed) {
    if (isCollapsed !== collapsed) {
        toggleSidebar();
    }
}

/**
 * Destroy sidebar (cleanup)
 */
export function destroySidebar() {
    document.body.classList.remove('has-sidebar', 'sidebar-collapsed');
    const sidebar = document.getElementById('sidebar');
    if (sidebar) {
        sidebar.remove();
    }
}

export default {
    initSidebarState,
    getSidebarCollapsed,
    setCurrentPage,
    toggleSidebar,
    renderSidebar,
    updateSidebarStats,
    setSidebarCollapsed,
    destroySidebar
};
