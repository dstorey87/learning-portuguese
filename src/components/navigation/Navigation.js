/**
 * Navigation Component
 * Handles sidebar (desktop) and bottom nav (mobile) navigation
 * 
 * @module components/navigation/Navigation
 */

/**
 * Navigation configuration
 */
export const NAV_CONFIG = {
    pages: [
        { id: 'home', icon: '🏠', label: 'Home' },
        { id: 'learn', icon: '📚', label: 'Learn' },
        { id: 'practice', icon: '🎯', label: 'Practice' },
        { id: 'profile', icon: '👤', label: 'Profile' }
    ],
    adminPages: [
        { id: 'admin', icon: '⚙️', label: 'Admin' },
        { id: 'monitoring', icon: '📊', label: 'Monitor' }
    ],
    breakpoint: 768 // px - below this use bottom nav
};

/**
 * Navigation state
 */
let currentPage = 'home';
let logoClickCount = 0;
let logoClickTimer = null;
let isMobileView = window.innerWidth < NAV_CONFIG.breakpoint;

/**
 * Get current page
 * @returns {string} Current page ID
 */
export function getCurrentPage() {
    return currentPage;
}

/**
 * Check if mobile view
 * @returns {boolean}
 */
export function isMobile() {
    return window.innerWidth < NAV_CONFIG.breakpoint;
}

/**
 * Switch to a page
 * @param {string} pageName - Page ID to switch to
 * @param {Object} options - Switch options
 * @param {boolean} options.updateHash - Whether to update URL hash (default: true)
 * @param {boolean} options.scrollTop - Whether to scroll to top (default: true)
 */
export function switchPage(pageName, options = {}) {
    const { updateHash = true, scrollTop = true } = options;
    
    const pages = document.querySelectorAll('.page');
    const tabs = document.querySelectorAll('.nav-tab, .sidebar-item');
    
    // Update page visibility
    pages.forEach(page => {
        page.classList.remove('active');
        if (page.dataset.page === pageName) {
            page.classList.add('active');
        }
    });
    
    // Update nav tab/item active state
    tabs.forEach(tab => {
        tab.classList.remove('active');
        if (tab.dataset.page === pageName) {
            tab.classList.add('active');
        }
    });
    
    currentPage = pageName;
    
    if (updateHash) {
        window.location.hash = pageName;
    }
    
    if (scrollTop) {
        window.scrollTo(0, 0);
    }
    
    // Dispatch custom event for other components to react
    window.dispatchEvent(new CustomEvent('pageChange', { 
        detail: { page: pageName, previousPage: currentPage } 
    }));
    
    // Trigger page-specific updates
    onPageSwitch(pageName);
}

/**
 * Called after page switch - triggers page-specific updates
 * @param {string} pageName 
 */
function onPageSwitch(pageName) {
    // These will be handled by event listeners in the main app
    // This is just for any navigation-specific updates
    console.log(`[Navigation] Switched to page: ${pageName}`);
}

/**
 * Initialize page from URL hash
 */
export function initPageFromHash() {
    const hash = window.location.hash.replace('#', '') || 'home';
    const allPages = [...NAV_CONFIG.pages, ...NAV_CONFIG.adminPages].map(p => p.id);
    const page = allPages.includes(hash) ? hash : 'home';
    switchPage(page, { updateHash: false });
}

/**
 * Handle logo click (triple-click for admin)
 * @param {Function} onAdminTrigger - Callback when admin login should show
 * @param {Function} onAdminLogout - Callback when admin should logout
 * @param {Function} isAdminFn - Function to check if currently admin
 */
export function handleLogoClick(onAdminTrigger, onAdminLogout, isAdminFn) {
    logoClickCount++;
    
    if (logoClickTimer) {
        clearTimeout(logoClickTimer);
    }
    
    logoClickTimer = setTimeout(() => {
        logoClickCount = 0;
    }, 1000);
    
    if (logoClickCount >= 3) {
        logoClickCount = 0;
        if (isAdminFn && isAdminFn()) {
            onAdminLogout && onAdminLogout();
        } else {
            onAdminTrigger && onAdminTrigger();
        }
    } else {
        switchPage('home');
    }
}

/**
 * Render sidebar for desktop view
 * @param {HTMLElement} container - Container to render sidebar into
 * @param {Object} options - Render options
 * @param {boolean} options.isAdmin - Whether user is admin
 * @param {boolean} options.collapsed - Whether sidebar is collapsed
 */
export function renderSidebar(container, options = {}) {
    const { isAdmin = false, collapsed = false } = options;
    
    const pages = isAdmin 
        ? [...NAV_CONFIG.pages, ...NAV_CONFIG.adminPages]
        : NAV_CONFIG.pages;
    
    const html = `
        <aside class="sidebar ${collapsed ? 'collapsed' : ''}" id="sidebar">
            <div class="sidebar-header">
                <button class="logo-btn" id="sidebarLogoBtn">
                    <span class="logo-icon">🇵🇹</span>
                    <span class="logo-text ${collapsed ? 'hidden' : ''}">PortuLingo</span>
                </button>
                <button class="sidebar-toggle" id="sidebarToggle">
                    <span class="toggle-icon">${collapsed ? '→' : '←'}</span>
                </button>
            </div>
            <nav class="sidebar-nav">
                ${pages.map(page => `
                    <button class="sidebar-item ${currentPage === page.id ? 'active' : ''}" 
                            data-page="${page.id}">
                        <span class="nav-icon">${page.icon}</span>
                        <span class="nav-label ${collapsed ? 'hidden' : ''}">${page.label}</span>
                    </button>
                `).join('')}
            </nav>
            <div class="sidebar-footer">
                <div class="user-stats ${collapsed ? 'compact' : ''}">
                    <span class="stat" title="Hearts">❤️ <span id="sidebarHearts">5</span></span>
                    <span class="stat" title="Streak">🔥 <span id="sidebarStreak">0</span></span>
                    <span class="stat" title="XP">⭐ <span id="sidebarXP">0</span></span>
                </div>
            </div>
        </aside>
    `;
    
    container.innerHTML = html;
    setupSidebarListeners(container, options);
}

/**
 * Render bottom navigation for mobile view
 * @param {HTMLElement} container - Container to render into
 * @param {Object} options - Render options
 */
export function renderBottomNav(container, options = {}) {
    const pages = NAV_CONFIG.pages; // Mobile doesn't show admin pages in bottom nav
    
    const html = `
        <nav class="bottom-nav" id="bottomNav">
            ${pages.map(page => `
                <button class="nav-tab ${currentPage === page.id ? 'active' : ''}" 
                        data-page="${page.id}">
                    <span class="nav-icon">${page.icon}</span>
                    <span class="nav-label">${page.label}</span>
                </button>
            `).join('')}
        </nav>
    `;
    
    container.innerHTML = html;
    setupBottomNavListeners(container);
}

/**
 * Setup sidebar event listeners
 * @param {HTMLElement} container 
 * @param {Object} options 
 */
function setupSidebarListeners(container, options = {}) {
    // Nav item clicks
    container.querySelectorAll('.sidebar-item').forEach(item => {
        item.addEventListener('click', () => {
            switchPage(item.dataset.page);
        });
    });
    
    // Sidebar toggle
    const toggle = container.querySelector('#sidebarToggle');
    if (toggle) {
        toggle.addEventListener('click', () => {
            const sidebar = container.querySelector('.sidebar');
            sidebar.classList.toggle('collapsed');
            const isCollapsed = sidebar.classList.contains('collapsed');
            toggle.querySelector('.toggle-icon').textContent = isCollapsed ? '→' : '←';
            
            // Hide/show text labels
            sidebar.querySelectorAll('.nav-label, .logo-text').forEach(el => {
                el.classList.toggle('hidden', isCollapsed);
            });
            
            // Save preference
            localStorage.setItem('sidebarCollapsed', isCollapsed);
        });
    }
    
    // Logo click for admin
    const logoBtn = container.querySelector('#sidebarLogoBtn');
    if (logoBtn && options.onAdminTrigger) {
        logoBtn.addEventListener('click', () => {
            handleLogoClick(options.onAdminTrigger, options.onAdminLogout, options.isAdminFn);
        });
    }
}

/**
 * Setup bottom nav event listeners
 * @param {HTMLElement} container 
 */
function setupBottomNavListeners(container) {
    container.querySelectorAll('.nav-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            switchPage(tab.dataset.page);
        });
    });
}

/**
 * Initialize navigation - chooses sidebar or bottom nav based on viewport
 * @param {Object} options - Initialization options
 */
export function initNavigation(options = {}) {
    // Listen for hash changes
    window.addEventListener('hashchange', () => {
        initPageFromHash();
    });
    
    // Listen for resize to switch between sidebar/bottom nav
    window.addEventListener('resize', () => {
        const wasMobile = isMobileView;
        isMobileView = isMobile();
        
        if (wasMobile !== isMobileView) {
            // Viewport crossed breakpoint - re-render appropriate nav
            console.log(`[Navigation] Viewport changed to ${isMobileView ? 'mobile' : 'desktop'}`);
            // The main app will handle re-rendering based on this event
            window.dispatchEvent(new CustomEvent('viewportChange', { 
                detail: { isMobile: isMobileView } 
            }));
        }
    });
    
    // Initialize from hash
    initPageFromHash();
    
    console.log('[Navigation] Initialized');
}

/**
 * Update navigation stats display
 * @param {Object} stats - { hearts, streak, xp }
 */
export function updateNavStats(stats) {
    const { hearts, streak, xp } = stats;
    
    // Update sidebar stats
    const sidebarHearts = document.getElementById('sidebarHearts');
    const sidebarStreak = document.getElementById('sidebarStreak');
    const sidebarXP = document.getElementById('sidebarXP');
    
    if (sidebarHearts) sidebarHearts.textContent = hearts === Infinity ? '∞' : hearts;
    if (sidebarStreak) sidebarStreak.textContent = streak;
    if (sidebarXP) sidebarXP.textContent = xp;
    
    // Update header stats (for compatibility with current design)
    const heartsCount = document.getElementById('heartsCount');
    const streakCount = document.getElementById('streakCount');
    const xpCount = document.getElementById('xpCount');
    
    if (heartsCount) {
        heartsCount.textContent = hearts === Infinity ? '∞' : hearts;
        heartsCount.classList.toggle('unlimited', hearts === Infinity);
    }
    if (streakCount) streakCount.textContent = streak;
    if (xpCount) xpCount.textContent = xp;
}

// Export for use in main app
export default {
    NAV_CONFIG,
    getCurrentPage,
    isMobile,
    switchPage,
    initPageFromHash,
    handleLogoClick,
    renderSidebar,
    renderBottomNav,
    initNavigation,
    updateNavStats
};
