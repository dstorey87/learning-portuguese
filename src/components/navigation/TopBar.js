/**
 * TopBar Component
 * Desktop top bar with search, stats, and actions
 * 
 * @module components/navigation/TopBar
 */

import { NAV_CONFIG, KEYBOARD_SHORTCUTS } from '../../config/routes.config.js';

/**
 * TopBar state
 */
let searchVisible = false;

/**
 * Render top bar for desktop view
 * @param {HTMLElement} container - Container to render into
 * @param {Object} options - Render options
 * @param {Object} options.stats - User stats {hearts, streak, xp}
 * @param {boolean} options.showSearch - Show search functionality
 * @param {boolean} options.showStats - Show user stats
 * @param {boolean} options.showThemeToggle - Show theme toggle
 * @param {Function} options.onSearch - Search callback
 * @param {Function} options.onThemeToggle - Theme toggle callback
 * @param {Function} options.onPremiumClick - Premium button callback
 * @param {string} options.theme - Current theme ('light' or 'dark')
 */
export function renderTopBar(container, options = {}) {
    const {
        stats = { hearts: 5, streak: 0, xp: 0 },
        showSearch = NAV_CONFIG.topBar.showSearch,
        showStats = NAV_CONFIG.topBar.showStats,
        showThemeToggle = NAV_CONFIG.topBar.showThemeToggle,
        onSearch,
        onThemeToggle,
        onPremiumClick,
        theme = 'dark'
    } = options;
    
    const html = `
        <header class="top-bar" id="topBar" role="banner">
            <div class="top-bar-left">
                ${showSearch ? `
                    <div class="search-container ${searchVisible ? 'expanded' : ''}">
                        <button class="search-toggle" id="searchToggle" aria-label="Search" title="Search (Ctrl+K)">
                            <span aria-hidden="true">🔍</span>
                        </button>
                        <input type="search" 
                               class="search-input" 
                               id="globalSearch" 
                               placeholder="Search lessons, words..." 
                               aria-label="Search lessons and words"
                               ${searchVisible ? '' : 'tabindex="-1"'}>
                        <button class="search-clear ${searchVisible ? '' : 'hidden'}" id="searchClear" aria-label="Clear search">
                            <span aria-hidden="true">✕</span>
                        </button>
                    </div>
                ` : ''}
            </div>
            
            <div class="top-bar-center">
                ${showStats ? `
                    <div class="header-stats" aria-label="Your stats">
                        <div class="stat-badge hearts-badge" title="Hearts remaining">
                            <span class="stat-icon" aria-hidden="true">❤️</span>
                            <span class="stat-value" id="topBarHearts">${stats.hearts === Infinity ? '∞' : stats.hearts}</span>
                            <span class="stat-timer" id="heartsTimer"></span>
                        </div>
                        <div class="stat-badge streak-badge" title="Day streak">
                            <span class="stat-icon" aria-hidden="true">🔥</span>
                            <span class="stat-value" id="topBarStreak">${stats.streak}</span>
                        </div>
                        <div class="stat-badge xp-badge" title="Experience points">
                            <span class="stat-icon" aria-hidden="true">⭐</span>
                            <span class="stat-value" id="topBarXP">${stats.xp}</span>
                        </div>
                    </div>
                ` : ''}
            </div>
            
            <div class="top-bar-right">
                ${showThemeToggle ? `
                    <button class="top-bar-btn theme-toggle" id="themeToggleBtn" 
                            aria-label="${theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}"
                            title="Toggle theme">
                        <span aria-hidden="true">${theme === 'dark' ? '🌙' : '☀️'}</span>
                    </button>
                ` : ''}
                <button class="top-bar-btn premium-btn" id="premiumBtn" aria-label="Premium features" title="Premium">
                    <span aria-hidden="true">👑</span>
                </button>
            </div>
        </header>
    `;
    
    container.innerHTML = html;
    
    // Setup event listeners
    setupTopBarListeners(container, { onSearch, onThemeToggle, onPremiumClick });
}

/**
 * Setup top bar event listeners
 * @param {HTMLElement} container 
 * @param {Object} callbacks 
 */
function setupTopBarListeners(container, callbacks = {}) {
    const { onSearch, onThemeToggle, onPremiumClick } = callbacks;
    
    // Search functionality
    const searchToggle = container.querySelector('#searchToggle');
    const searchInput = container.querySelector('#globalSearch');
    const searchClear = container.querySelector('#searchClear');
    const searchContainer = container.querySelector('.search-container');
    
    if (searchToggle && searchInput) {
        searchToggle.addEventListener('click', () => {
            searchVisible = !searchVisible;
            searchContainer?.classList.toggle('expanded', searchVisible);
            searchClear?.classList.toggle('hidden', !searchVisible);
            
            if (searchVisible) {
                searchInput.removeAttribute('tabindex');
                searchInput.focus();
            } else {
                searchInput.setAttribute('tabindex', '-1');
                searchInput.value = '';
            }
        });
        
        searchInput.addEventListener('input', (e) => {
            onSearch && onSearch(e.target.value);
        });
        
        searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                searchVisible = false;
                searchContainer?.classList.remove('expanded');
                searchClear?.classList.add('hidden');
                searchInput.setAttribute('tabindex', '-1');
                searchInput.value = '';
                searchToggle.focus();
            }
        });
    }
    
    if (searchClear) {
        searchClear.addEventListener('click', () => {
            searchInput.value = '';
            searchInput.focus();
            onSearch && onSearch('');
        });
    }
    
    // Theme toggle
    const themeToggle = container.querySelector('#themeToggleBtn');
    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            onThemeToggle && onThemeToggle();
        });
    }
    
    // Premium button
    const premiumBtn = container.querySelector('#premiumBtn');
    if (premiumBtn) {
        premiumBtn.addEventListener('click', () => {
            onPremiumClick && onPremiumClick();
        });
    }
    
    // Global keyboard shortcut for search
    document.addEventListener('keydown', handleGlobalShortcuts);
}

/**
 * Handle global keyboard shortcuts
 * @param {KeyboardEvent} e 
 */
function handleGlobalShortcuts(e) {
    // Ctrl+K or Cmd+K for search
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        const searchToggle = document.querySelector('#searchToggle');
        searchToggle?.click();
    }
}

/**
 * Update top bar stats display
 * @param {Object} stats - { hearts, streak, xp }
 */
export function updateTopBarStats(stats) {
    const { hearts, streak, xp } = stats;
    
    const heartsEl = document.getElementById('topBarHearts');
    const streakEl = document.getElementById('topBarStreak');
    const xpEl = document.getElementById('topBarXP');
    
    if (heartsEl) {
        heartsEl.textContent = hearts === Infinity ? '∞' : hearts;
        heartsEl.classList.toggle('unlimited', hearts === Infinity);
    }
    if (streakEl) streakEl.textContent = streak;
    if (xpEl) xpEl.textContent = xp;
}

/**
 * Update hearts timer display
 * @param {string} timerText - Timer text to display (e.g., "5:00")
 */
export function updateHeartsTimer(timerText) {
    const timerEl = document.getElementById('heartsTimer');
    if (timerEl) {
        timerEl.textContent = timerText;
        timerEl.classList.toggle('visible', !!timerText);
    }
}

/**
 * Update theme toggle button
 * @param {string} theme - Current theme ('light' or 'dark')
 */
export function updateThemeButton(theme) {
    const btn = document.getElementById('themeToggleBtn');
    if (btn) {
        const icon = btn.querySelector('span');
        if (icon) {
            icon.textContent = theme === 'dark' ? '🌙' : '☀️';
        }
        btn.setAttribute('aria-label', theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
    }
}

/**
 * Show/hide search
 * @param {boolean} show 
 */
export function setSearchVisible(show) {
    const searchContainer = document.querySelector('.search-container');
    const searchInput = document.querySelector('#globalSearch');
    const searchClear = document.querySelector('#searchClear');
    
    searchVisible = show;
    searchContainer?.classList.toggle('expanded', show);
    searchClear?.classList.toggle('hidden', !show);
    
    if (searchInput) {
        if (show) {
            searchInput.removeAttribute('tabindex');
            searchInput.focus();
        } else {
            searchInput.setAttribute('tabindex', '-1');
            searchInput.value = '';
        }
    }
}

/**
 * Cleanup top bar listeners
 */
export function destroyTopBar() {
    document.removeEventListener('keydown', handleGlobalShortcuts);
    const topBar = document.getElementById('topBar');
    if (topBar) {
        topBar.remove();
    }
}

export default {
    renderTopBar,
    updateTopBarStats,
    updateHeartsTimer,
    updateThemeButton,
    setSearchVisible,
    destroyTopBar
};
