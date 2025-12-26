/**
 * Navigation Manager
 * Central controller for navigation across the application
 * Integrates routes.config.js with all navigation components
 * 
 * @module components/navigation/NavigationManager
 */

import { 
    ROUTES,
    NAV_CONFIG,
    ACCESS_LEVELS,
    getRouteById,
    getRouteByHash,
    canAccessRoute,
    getViewportType,
    isMobileViewport,
    isTabletViewport,
    isDesktopViewport,
    KEYBOARD_SHORTCUTS
} from '../../config/routes.config.js';

import { 
    renderSidebar, 
    updateSidebarStats, 
    destroySidebar,
    setCurrentPage as setSidebarPage,
    setSidebarCollapsed
} from './Sidebar.js';

import { 
    renderTopBar, 
    updateTopBarStats, 
    destroyTopBar 
} from './TopBar.js';

import { 
    renderBottomNav, 
    updateBottomNavActive, 
    destroyBottomNav,
    setCurrentPage as setBottomNavPage
} from './BottomNav.js';

import { 
    renderMobileDrawer, 
    updateDrawerStats, 
    closeDrawer, 
    destroyMobileDrawer,
    toggleDrawer
} from './MobileDrawer.js';

import { 
    renderBreadcrumb, 
    clearBreadcrumb 
} from './Breadcrumb.js';

/**
 * Navigation state
 */
let currentPage = 'home';
let currentAccessLevel = ACCESS_LEVELS.PUBLIC;
let userStats = { hearts: 5, streak: 0, xp: 0 };
let userInfo = null;
let initialized = false;
let navigationCallbacks = {};

/**
 * Initialize navigation system
 * @param {Object} options - Initialization options
 * @param {string} options.accessLevel - User access level
 * @param {Object} options.stats - Initial user stats
 * @param {Object} options.user - User info
 * @param {Function} options.onNavigate - Navigation callback
 * @param {Function} options.onThemeToggle - Theme toggle callback
 * @param {Function} options.onSearch - Search callback
 * @param {Function} options.onAdminTrigger - Admin trigger callback
 * @param {string} options.theme - Current theme
 */
export function initNavigationManager(options = {}) {
    const {
        accessLevel = ACCESS_LEVELS.PUBLIC,
        stats = { hearts: 5, streak: 0, xp: 0 },
        user = null,
        onNavigate,
        onThemeToggle,
        onSearch,
        onAdminTrigger,
        theme = 'dark'
    } = options;
    
    currentAccessLevel = accessLevel;
    userStats = stats;
    userInfo = user;
    navigationCallbacks = { onNavigate, onThemeToggle, onSearch, onAdminTrigger };
    
    // Get initial page from hash
    const hash = window.location.hash.replace('#', '') || 'home';
    const route = getRouteByHash(hash);
    currentPage = (route && canAccessRoute(route.id, accessLevel)) ? route.id : 'home';
    
    // Render navigation based on viewport
    renderNavigationForViewport({ theme });
    
    // Setup event listeners
    setupNavigationListeners();
    
    initialized = true;
    console.log('[NavigationManager] Initialized');
    
    return {
        navigate: navigateTo,
        updateStats,
        updateUser,
        setAccessLevel,
        getCurrentPage: () => currentPage,
        destroy: destroyNavigation
    };
}

/**
 * Render navigation components based on current viewport
 * @param {Object} options 
 */
function renderNavigationForViewport(options = {}) {
    const { theme = 'dark' } = options;
    const viewport = getViewportType();
    
    // Get or create containers
    const sidebarContainer = getOrCreateContainer('sidebar-container');
    const topBarContainer = getOrCreateContainer('topbar-container');
    const bottomNavContainer = getOrCreateContainer('bottomnav-container');
    const drawerContainer = getOrCreateContainer('drawer-container');
    const breadcrumbContainer = document.getElementById('breadcrumb-container');
    
    // Navigate handler
    const handleNavigate = (pageId) => {
        navigateTo(pageId);
    };
    
    // Render components based on viewport
    if (viewport === 'desktop' || viewport === 'tablet') {
        // Desktop/Tablet: Sidebar + TopBar
        renderSidebar(sidebarContainer, {
            accessLevel: currentAccessLevel,
            onNavigate: handleNavigate,
            onLogoClick: () => handleLogoClick(),
            stats: userStats
        });
        
        renderTopBar(topBarContainer, {
            stats: userStats,
            theme,
            onSearch: navigationCallbacks.onSearch,
            onThemeToggle: navigationCallbacks.onThemeToggle,
            onPremiumClick: () => console.log('Premium clicked')
        });
        
        // Auto-collapse sidebar on tablet
        if (viewport === 'tablet') {
            setSidebarCollapsed(true);
        }
        
        // Hide mobile nav
        destroyBottomNav();
        destroyMobileDrawer();
    } else {
        // Mobile: BottomNav + Drawer
        renderBottomNav(bottomNavContainer, {
            accessLevel: currentAccessLevel,
            onNavigate: handleNavigate,
            onMoreClick: toggleDrawer
        });
        
        renderMobileDrawer(drawerContainer, {
            accessLevel: currentAccessLevel,
            onNavigate: handleNavigate,
            stats: userStats,
            user: userInfo
        });
        
        // Hide desktop nav
        destroySidebar();
        destroyTopBar();
    }
    
    // Render breadcrumb if container exists
    if (breadcrumbContainer) {
        renderBreadcrumb(breadcrumbContainer, {
            currentPage,
            onNavigate: handleNavigate
        });
    }
    
    // Set initial active states
    setSidebarPage(currentPage);
    setBottomNavPage(currentPage);
}

/**
 * Get or create a container element
 * @param {string} id 
 * @returns {HTMLElement}
 */
function getOrCreateContainer(id) {
    let container = document.getElementById(id);
    if (!container) {
        container = document.createElement('div');
        container.id = id;
        document.body.appendChild(container);
    }
    return container;
}

/**
 * Setup navigation event listeners
 */
function setupNavigationListeners() {
    // Hash change
    window.addEventListener('hashchange', handleHashChange);
    
    // Resize (viewport change)
    window.addEventListener('resize', debounce(handleResize, 150));
    
    // Keyboard shortcuts
    document.addEventListener('keydown', handleKeyboardShortcuts);
}

/**
 * Handle hash change
 */
function handleHashChange() {
    const hash = window.location.hash.replace('#', '') || 'home';
    const route = getRouteByHash(hash);
    
    if (route && canAccessRoute(route.id, currentAccessLevel)) {
        switchPageInternal(route.id, false);
    }
}

/**
 * Handle resize (viewport changes)
 */
let lastViewport = null;
function handleResize() {
    const viewport = getViewportType();
    
    if (lastViewport !== viewport) {
        lastViewport = viewport;
        renderNavigationForViewport();
        console.log(`[NavigationManager] Viewport changed to: ${viewport}`);
    }
}

/**
 * Handle keyboard shortcuts
 * @param {KeyboardEvent} e 
 */
function handleKeyboardShortcuts(e) {
    // Don't handle if typing in an input
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        return;
    }
    
    // Alt+H for Home
    if (e.altKey && e.key === 'h') {
        e.preventDefault();
        navigateTo('home');
    }
    // Alt+L for Learn
    else if (e.altKey && e.key === 'l') {
        e.preventDefault();
        navigateTo('learn');
    }
    // Alt+P for Practice
    else if (e.altKey && e.key === 'p') {
        e.preventDefault();
        navigateTo('practice');
    }
    // Alt+U for Profile (User)
    else if (e.altKey && e.key === 'u') {
        e.preventDefault();
        navigateTo('profile');
    }
    // Alt+S for toggle sidebar
    else if (e.altKey && e.key === 's') {
        e.preventDefault();
        const { toggleSidebar } = require('./Sidebar.js');
        toggleSidebar();
    }
}

/**
 * Handle logo click (triple-click for admin)
 */
let logoClickCount = 0;
let logoClickTimer = null;
function handleLogoClick() {
    logoClickCount++;
    
    if (logoClickTimer) {
        clearTimeout(logoClickTimer);
    }
    
    logoClickTimer = setTimeout(() => {
        logoClickCount = 0;
    }, 1000);
    
    if (logoClickCount >= 3) {
        logoClickCount = 0;
        navigationCallbacks.onAdminTrigger && navigationCallbacks.onAdminTrigger();
    } else {
        navigateTo('home');
    }
}

/**
 * Navigate to a page
 * @param {string} pageId - Page ID to navigate to
 * @param {Object} options - Navigation options
 */
export function navigateTo(pageId, options = {}) {
    const { updateHash = true, scrollTop = true } = options;
    
    // Check if route exists and user can access it
    const route = getRouteById(pageId);
    if (!route) {
        console.warn(`[NavigationManager] Unknown route: ${pageId}`);
        return false;
    }
    
    if (!canAccessRoute(pageId, currentAccessLevel)) {
        console.warn(`[NavigationManager] Access denied to: ${pageId}`);
        return false;
    }
    
    return switchPageInternal(pageId, updateHash, scrollTop);
}

/**
 * Internal page switch
 * @param {string} pageId 
 * @param {boolean} updateHash 
 * @param {boolean} scrollTop 
 */
function switchPageInternal(pageId, updateHash = true, scrollTop = true) {
    const previousPage = currentPage;
    currentPage = pageId;
    
    // Update page visibility
    const pages = document.querySelectorAll('.page');
    pages.forEach(page => {
        page.classList.remove('active');
        if (page.dataset.page === pageId) {
            page.classList.add('active');
        }
    });
    
    // Update all nav components
    setSidebarPage(pageId);
    setBottomNavPage(pageId);
    updateBottomNavActive(pageId);
    
    // Update breadcrumb
    const breadcrumbContainer = document.getElementById('breadcrumb-container');
    if (breadcrumbContainer) {
        renderBreadcrumb(breadcrumbContainer, {
            currentPage: pageId,
            onNavigate: navigateTo
        });
    }
    
    // Update URL hash
    if (updateHash) {
        window.location.hash = pageId;
    }
    
    // Scroll to top
    if (scrollTop) {
        window.scrollTo(0, 0);
    }
    
    // Close drawer if open
    closeDrawer();
    
    // Dispatch events
    window.dispatchEvent(new CustomEvent('pageChange', { 
        detail: { page: pageId, previousPage } 
    }));
    
    // Call navigation callback
    navigationCallbacks.onNavigate && navigationCallbacks.onNavigate(pageId, previousPage);
    
    console.log(`[NavigationManager] Navigated to: ${pageId}`);
    return true;
}

/**
 * Update user stats in all nav components
 * @param {Object} stats - { hearts, streak, xp }
 */
export function updateStats(stats) {
    userStats = { ...userStats, ...stats };
    
    updateSidebarStats(userStats);
    updateTopBarStats(userStats);
    updateDrawerStats(userStats);
}

/**
 * Update user info
 * @param {Object} user - { name, email }
 */
export function updateUser(user) {
    userInfo = user;
    // Re-render drawer with new user info
    const drawerContainer = document.getElementById('drawer-container');
    if (drawerContainer && isMobileViewport()) {
        renderMobileDrawer(drawerContainer, {
            accessLevel: currentAccessLevel,
            onNavigate: navigateTo,
            stats: userStats,
            user: userInfo
        });
    }
}

/**
 * Set access level and re-render navigation
 * @param {string} level - ACCESS_LEVELS value
 */
export function setAccessLevel(level) {
    currentAccessLevel = level;
    renderNavigationForViewport();
}

/**
 * Get current page
 * @returns {string}
 */
export function getCurrentPage() {
    return currentPage;
}

/**
 * Destroy navigation
 */
export function destroyNavigation() {
    window.removeEventListener('hashchange', handleHashChange);
    window.removeEventListener('resize', handleResize);
    document.removeEventListener('keydown', handleKeyboardShortcuts);
    
    destroySidebar();
    destroyTopBar();
    destroyBottomNav();
    destroyMobileDrawer();
    
    // Remove containers
    ['sidebar-container', 'topbar-container', 'bottomnav-container', 'drawer-container'].forEach(id => {
        document.getElementById(id)?.remove();
    });
    
    initialized = false;
    console.log('[NavigationManager] Destroyed');
}

/**
 * Simple debounce function
 * @param {Function} func 
 * @param {number} wait 
 * @returns {Function}
 */
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

export default {
    initNavigationManager,
    navigateTo,
    updateStats,
    updateUser,
    setAccessLevel,
    getCurrentPage,
    destroyNavigation
};
