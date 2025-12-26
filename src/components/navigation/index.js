/**
 * Navigation Components Index
 * 
 * @module components/navigation
 */

// Main Navigation (legacy - for backward compatibility)
export {
    NAV_CONFIG,
    getCurrentPage,
    isMobile,
    switchPage,
    initPageFromHash,
    handleLogoClick,
    renderSidebar as renderLegacySidebar,
    renderBottomNav as renderLegacyBottomNav,
    initNavigation,
    updateNavStats,
    default as Navigation
} from './Navigation.js';

// New modular components
export {
    initSidebarState,
    getSidebarCollapsed,
    setCurrentPage as setSidebarCurrentPage,
    toggleSidebar,
    renderSidebar,
    updateSidebarStats,
    setSidebarCollapsed,
    destroySidebar,
    default as Sidebar
} from './Sidebar.js';

export {
    renderTopBar,
    updateTopBarStats,
    updateHeartsTimer,
    updateThemeButton,
    setSearchVisible,
    destroyTopBar,
    default as TopBar
} from './TopBar.js';

export {
    setCurrentPage as setBottomNavCurrentPage,
    renderBottomNav,
    updateBottomNavActive,
    showNavBadge,
    hideNavBadge,
    destroyBottomNav,
    default as BottomNav
} from './BottomNav.js';

export {
    isDrawerOpen,
    openDrawer,
    closeDrawer,
    toggleDrawer,
    renderMobileDrawer,
    updateDrawerStats,
    updateDrawerUser,
    destroyMobileDrawer,
    default as MobileDrawer
} from './MobileDrawer.js';

export {
    renderBreadcrumb,
    updateBreadcrumb,
    addBreadcrumbItem,
    clearBreadcrumb,
    default as Breadcrumb
} from './Breadcrumb.js';

// Navigation Manager (new unified controller)
export {
    initNavigationManager,
    navigateTo,
    updateStats as updateNavManagerStats,
    updateUser,
    setAccessLevel,
    getCurrentPage as getNavManagerCurrentPage,
    destroyNavigation,
    default as NavigationManager
} from './NavigationManager.js';
