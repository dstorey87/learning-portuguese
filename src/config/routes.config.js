/**
 * Routes Configuration
 * Central configuration for all application routes and navigation
 * 
 * @module config/routes
 */

/**
 * Route access levels
 */
export const ACCESS_LEVELS = {
    PUBLIC: 'public',      // Anyone can access
    USER: 'user',          // Logged in users
    ADMIN: 'admin'         // Admin only
};

/**
 * Navigation display modes
 */
export const NAV_DISPLAY = {
    ALWAYS: 'always',      // Show in all nav types
    DESKTOP: 'desktop',    // Show only in desktop sidebar
    MOBILE: 'mobile',      // Show only in mobile nav
    DRAWER: 'drawer',      // Show only in mobile drawer menu
    HIDDEN: 'hidden'       // Not shown in navigation (accessed by route only)
};

/**
 * Main route definitions
 * Each route defines a page/section of the application
 */
export const ROUTES = {
    // Core pages
    home: {
        id: 'home',
        path: '/',
        hash: '#home',
        label: 'Home',
        icon: '🏠',
        access: ACCESS_LEVELS.PUBLIC,
        display: NAV_DISPLAY.ALWAYS,
        priority: 1,
        description: 'Welcome page and getting started'
    },
    learn: {
        id: 'learn',
        path: '/learn',
        hash: '#learn',
        label: 'Learn',
        icon: '📚',
        access: ACCESS_LEVELS.PUBLIC,
        display: NAV_DISPLAY.ALWAYS,
        priority: 2,
        description: 'Browse and start lessons',
        children: [
            {
                id: 'lesson',
                path: '/learn/:lessonId',
                hash: '#lesson',
                label: 'Lesson',
                icon: '📖',
                access: ACCESS_LEVELS.PUBLIC,
                display: NAV_DISPLAY.HIDDEN
            }
        ]
    },
    practice: {
        id: 'practice',
        path: '/practice',
        hash: '#practice',
        label: 'Practice',
        icon: '🎯',
        access: ACCESS_LEVELS.PUBLIC,
        display: NAV_DISPLAY.ALWAYS,
        priority: 3,
        description: 'Review and practice learned words'
    },
    profile: {
        id: 'profile',
        path: '/profile',
        hash: '#profile',
        label: 'Profile',
        icon: '👤',
        access: ACCESS_LEVELS.USER,
        display: NAV_DISPLAY.ALWAYS,
        priority: 4,
        description: 'Your learning profile and stats'
    },
    
    // Admin pages
    admin: {
        id: 'admin',
        path: '/admin',
        hash: '#admin',
        label: 'Admin',
        icon: '⚙️',
        access: ACCESS_LEVELS.ADMIN,
        display: NAV_DISPLAY.DESKTOP,
        priority: 10,
        description: 'Admin settings and user management'
    },
    monitoring: {
        id: 'monitoring',
        path: '/monitoring',
        hash: '#monitoring',
        label: 'Monitor',
        icon: '📊',
        access: ACCESS_LEVELS.ADMIN,
        display: NAV_DISPLAY.DESKTOP,
        priority: 11,
        description: 'System health and monitoring'
    },
    
    // Additional pages accessible via drawer
    settings: {
        id: 'settings',
        path: '/settings',
        hash: '#settings',
        label: 'Settings',
        icon: '⚙️',
        access: ACCESS_LEVELS.USER,
        display: NAV_DISPLAY.DRAWER,
        priority: 20,
        description: 'App preferences and settings'
    },
    help: {
        id: 'help',
        path: '/help',
        hash: '#help',
        label: 'Help',
        icon: '❓',
        access: ACCESS_LEVELS.PUBLIC,
        display: NAV_DISPLAY.DRAWER,
        priority: 21,
        description: 'Help and FAQ'
    }
};

/**
 * Responsive breakpoints for navigation
 */
export const BREAKPOINTS = {
    mobile: 0,      // 0 - 767px: Bottom nav + drawer
    tablet: 768,    // 768 - 1023px: Collapsed sidebar
    desktop: 1024   // 1024+: Full sidebar
};

/**
 * Navigation behavior configuration
 */
export const NAV_CONFIG = {
    // Sidebar settings
    sidebar: {
        width: 240,
        collapsedWidth: 64,
        defaultCollapsed: false,
        collapseOnTablet: true,
        animationDuration: 300
    },
    
    // Bottom nav settings (mobile)
    bottomNav: {
        height: 64,
        maxItems: 5  // Maximum items in bottom nav
    },
    
    // Drawer menu settings (mobile)
    drawer: {
        width: 280,
        animationDuration: 300,
        overlay: true
    },
    
    // Topbar settings
    topBar: {
        height: 64,
        showSearch: true,
        showStats: true,
        showThemeToggle: true
    },
    
    // General settings
    scrollTopOnNavigate: true,
    updateUrlHash: true,
    rememberCollapsed: true
};

/**
 * Keyboard shortcuts for navigation
 */
export const KEYBOARD_SHORTCUTS = {
    home: 'Alt+H',
    learn: 'Alt+L',
    practice: 'Alt+P',
    profile: 'Alt+U',
    toggleSidebar: 'Alt+S',
    search: 'Ctrl+K',
    escape: 'Escape'
};

/**
 * Get routes for a specific navigation type
 * @param {string} displayType - NAV_DISPLAY value
 * @param {string} accessLevel - User's access level
 * @returns {Array} Filtered and sorted routes
 */
export function getRoutesForNav(displayType, accessLevel = ACCESS_LEVELS.PUBLIC) {
    const accessPriority = {
        [ACCESS_LEVELS.PUBLIC]: 0,
        [ACCESS_LEVELS.USER]: 1,
        [ACCESS_LEVELS.ADMIN]: 2
    };
    
    const userAccessLevel = accessPriority[accessLevel] ?? 0;
    
    return Object.values(ROUTES)
        .filter(route => {
            // Check access level
            const routeAccessLevel = accessPriority[route.access] ?? 0;
            if (routeAccessLevel > userAccessLevel) return false;
            
            // Check display type
            if (displayType === NAV_DISPLAY.ALWAYS) {
                return route.display === NAV_DISPLAY.ALWAYS;
            }
            return route.display === displayType || route.display === NAV_DISPLAY.ALWAYS;
        })
        .sort((a, b) => a.priority - b.priority);
}

/**
 * Get main navigation routes (bottom nav / sidebar main items)
 * @param {string} accessLevel - User's access level
 * @returns {Array} Main navigation routes
 */
export function getMainNavRoutes(accessLevel = ACCESS_LEVELS.PUBLIC) {
    return getRoutesForNav(NAV_DISPLAY.ALWAYS, accessLevel);
}

/**
 * Get drawer menu routes
 * @param {string} accessLevel - User's access level
 * @returns {Array} Drawer menu routes
 */
export function getDrawerRoutes(accessLevel = ACCESS_LEVELS.PUBLIC) {
    return getRoutesForNav(NAV_DISPLAY.DRAWER, accessLevel);
}

/**
 * Get desktop-only routes (admin pages)
 * @param {string} accessLevel - User's access level
 * @returns {Array} Desktop-only routes
 */
export function getDesktopOnlyRoutes(accessLevel = ACCESS_LEVELS.PUBLIC) {
    return getRoutesForNav(NAV_DISPLAY.DESKTOP, accessLevel);
}

/**
 * Get route by ID
 * @param {string} routeId - Route ID
 * @returns {Object|null} Route configuration or null
 */
export function getRouteById(routeId) {
    return ROUTES[routeId] || null;
}

/**
 * Get route by hash
 * @param {string} hash - URL hash (with or without #)
 * @returns {Object|null} Route configuration or null
 */
export function getRouteByHash(hash) {
    const cleanHash = hash.replace('#', '');
    return Object.values(ROUTES).find(r => r.id === cleanHash || r.hash === `#${cleanHash}`) || null;
}

/**
 * Check if user can access a route
 * @param {string} routeId - Route ID
 * @param {string} accessLevel - User's access level
 * @returns {boolean}
 */
export function canAccessRoute(routeId, accessLevel = ACCESS_LEVELS.PUBLIC) {
    const route = getRouteById(routeId);
    if (!route) return false;
    
    const accessPriority = {
        [ACCESS_LEVELS.PUBLIC]: 0,
        [ACCESS_LEVELS.USER]: 1,
        [ACCESS_LEVELS.ADMIN]: 2
    };
    
    const userAccessLevel = accessPriority[accessLevel] ?? 0;
    const routeAccessLevel = accessPriority[route.access] ?? 0;
    
    return userAccessLevel >= routeAccessLevel;
}

/**
 * Build breadcrumb trail for a route
 * @param {string} routeId - Current route ID
 * @returns {Array} Array of breadcrumb items [{id, label, icon}]
 */
export function getBreadcrumbTrail(routeId) {
    const trail = [];
    
    // Always start with home
    trail.push({
        id: ROUTES.home.id,
        label: ROUTES.home.label,
        icon: ROUTES.home.icon
    });
    
    // Find the route
    const route = getRouteById(routeId);
    if (!route || route.id === 'home') {
        return trail;
    }
    
    // Check if route is a child of another route
    for (const parentRoute of Object.values(ROUTES)) {
        if (parentRoute.children) {
            const child = parentRoute.children.find(c => c.id === routeId);
            if (child) {
                trail.push({
                    id: parentRoute.id,
                    label: parentRoute.label,
                    icon: parentRoute.icon
                });
                trail.push({
                    id: child.id,
                    label: child.label,
                    icon: child.icon
                });
                return trail;
            }
        }
    }
    
    // Add the current route
    trail.push({
        id: route.id,
        label: route.label,
        icon: route.icon
    });
    
    return trail;
}

/**
 * Get current viewport type based on window width
 * @returns {'mobile'|'tablet'|'desktop'}
 */
export function getViewportType() {
    const width = window.innerWidth;
    if (width >= BREAKPOINTS.desktop) return 'desktop';
    if (width >= BREAKPOINTS.tablet) return 'tablet';
    return 'mobile';
}

/**
 * Check if current viewport is mobile
 * @returns {boolean}
 */
export function isMobileViewport() {
    return window.innerWidth < BREAKPOINTS.tablet;
}

/**
 * Check if current viewport is tablet
 * @returns {boolean}
 */
export function isTabletViewport() {
    const width = window.innerWidth;
    return width >= BREAKPOINTS.tablet && width < BREAKPOINTS.desktop;
}

/**
 * Check if current viewport is desktop
 * @returns {boolean}
 */
export function isDesktopViewport() {
    return window.innerWidth >= BREAKPOINTS.desktop;
}

export default {
    ACCESS_LEVELS,
    NAV_DISPLAY,
    ROUTES,
    BREAKPOINTS,
    NAV_CONFIG,
    KEYBOARD_SHORTCUTS,
    getRoutesForNav,
    getMainNavRoutes,
    getDrawerRoutes,
    getDesktopOnlyRoutes,
    getRouteById,
    getRouteByHash,
    canAccessRoute,
    getBreadcrumbTrail,
    getViewportType,
    isMobileViewport,
    isTabletViewport,
    isDesktopViewport
};
