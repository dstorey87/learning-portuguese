/**
 * Admin Dashboard
 * 
 * Provides admin functionality:
 * - User list with "Log in as" controls
 * - AI action feed per user (time-windowed)
 * - Global event log for ALL users (when logged in as admin)
 * - Rescue triggers and lessons created
 * - Event processing status
 * 
 * @module pages/admin/AdminDashboard
 */

import * as Logger from '../../services/Logger.js';
import { getUser, isAdmin } from '../../services/AuthService.js';
import { userStorage } from '../../services/userStorage.js';

// ============================================================================
// CONSTANTS
// ============================================================================

const ADMIN_STORAGE_KEY = 'admin_action_log';
const GLOBAL_EVENT_LOG_KEY = 'global_event_log';
const MAX_ACTIONS_PER_USER = 500;
const MAX_GLOBAL_EVENTS = 1000;
const DEFAULT_TIME_WINDOW = 24 * 60 * 60 * 1000; // 24 hours

// ============================================================================
// STATE
// ============================================================================

let adminState = {
    users: [],
    selectedUserId: null,
    actionLog: {},
    globalEventLog: [],
    timeWindow: DEFAULT_TIME_WINDOW,
    isImpersonating: false,
    originalAdminId: null,
    refreshInterval: null
};

// ============================================================================
// GLOBAL EVENT LOGGING (captures ALL user events)
// ============================================================================

/**
 * Log a global event (visible to admin regardless of which user triggered it)
 * This captures all learning interactions across all users
 */
export function logGlobalEvent(event) {
    const entry = {
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        userId: event.userId || 'unknown',
        eventType: event.eventType || event.type || 'unknown',
        details: event.data || event.details || event,
        source: event.source || 'app'
    };
    
    adminState.globalEventLog.unshift(entry);
    
    // Also log to per-user action log
    if (entry.userId && entry.userId !== 'unknown') {
        logAIAction(entry.userId, {
            type: entry.eventType,
            details: entry.details,
            source: entry.source
        });
    }
    
    // Trim to max size
    if (adminState.globalEventLog.length > MAX_GLOBAL_EVENTS) {
        adminState.globalEventLog = adminState.globalEventLog.slice(0, MAX_GLOBAL_EVENTS);
    }
    
    // Persist
    saveGlobalEventLog();
    
    return entry;
}

/**
 * Get all global events within time window
 */
export function getGlobalEvents(windowMs = DEFAULT_TIME_WINDOW) {
    const cutoff = Date.now() - windowMs;
    return adminState.globalEventLog.filter(e => e.timestamp >= cutoff);
}

function saveGlobalEventLog() {
    try {
        // Store in localStorage without user prefix (global)
        localStorage.setItem(GLOBAL_EVENT_LOG_KEY, JSON.stringify(adminState.globalEventLog));
    } catch (e) {
        Logger.warn('Failed to save global event log', { error: e.message });
    }
}

function loadGlobalEventLog() {
    try {
        const saved = localStorage.getItem(GLOBAL_EVENT_LOG_KEY);
        if (saved) {
            adminState.globalEventLog = JSON.parse(saved);
        }
    } catch (e) {
        Logger.warn('Failed to load global event log', { error: e.message });
    }
}

// ============================================================================
// ACTION LOGGING
// ============================================================================

/**
 * Log an AI action for a user
 */
export function logAIAction(userId, action) {
    if (!adminState.actionLog[userId]) {
        adminState.actionLog[userId] = [];
    }
    
    const entry = {
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        ...action
    };
    
    adminState.actionLog[userId].unshift(entry);
    
    // Trim to max size
    if (adminState.actionLog[userId].length > MAX_ACTIONS_PER_USER) {
        adminState.actionLog[userId] = adminState.actionLog[userId].slice(0, MAX_ACTIONS_PER_USER);
    }
    
    // Persist
    saveActionLog();
    
    return entry;
}

/**
 * Get actions for a user within time window
 */
export function getUserActions(userId, windowMs = DEFAULT_TIME_WINDOW) {
    const actions = adminState.actionLog[userId] || [];
    const cutoff = Date.now() - windowMs;
    return actions.filter(a => a.timestamp >= cutoff);
}

/**
 * Get all actions across all users within time window
 */
export function getAllActions(windowMs = DEFAULT_TIME_WINDOW) {
    const cutoff = Date.now() - windowMs;
    const allActions = [];
    
    for (const [userId, actions] of Object.entries(adminState.actionLog)) {
        actions
            .filter(a => a.timestamp >= cutoff)
            .forEach(a => allActions.push({ userId, ...a }));
    }
    
    return allActions.sort((a, b) => b.timestamp - a.timestamp);
}

function saveActionLog() {
    try {
        localStorage.setItem(ADMIN_STORAGE_KEY, JSON.stringify(adminState.actionLog));
    } catch (e) {
        Logger.warn('admin_dashboard', 'Failed to save action log', { error: e.message });
    }
}

function loadActionLog() {
    try {
        const saved = localStorage.getItem(ADMIN_STORAGE_KEY);
        if (saved) {
            adminState.actionLog = JSON.parse(saved);
        }
    } catch (e) {
        Logger.warn('admin_dashboard', 'Failed to load action log', { error: e.message });
    }
}

// ============================================================================
// USER IMPERSONATION
// ============================================================================

/**
 * Log in as another user (admin only)
 * Note: This sets up viewing context, not actual authentication
 */
export function impersonateUser(targetUserId) {
    const currentUser = getUser();
    
    if (!isAdmin()) {
        Logger.error('Impersonation requires admin role');
        return { success: false, error: 'Admin access required' };
    }
    
    // Save original admin ID for return
    if (!adminState.isImpersonating) {
        adminState.originalAdminId = currentUser.username || 'admin';
    }
    
    // Log the impersonation
    logAIAction(targetUserId, {
        type: 'impersonation_start',
        adminId: currentUser.username || 'admin',
        reason: 'Admin audit'
    });
    
    // Set viewing context to target user
    adminState.isImpersonating = true;
    adminState.selectedUserId = targetUserId;
    
    Logger.info('Impersonation started', { 
        adminId: adminState.originalAdminId, 
        targetUserId 
    });
    
    // Refresh dashboard to show target user's data
    refreshDashboard();
    
    return { success: true };
}

/**
 * Return to admin account
 */
export function endImpersonation() {
    if (!adminState.isImpersonating || !adminState.originalAdminId) {
        return { success: false, error: 'Not currently impersonating' };
    }
    
    const targetUserId = adminState.selectedUserId;
    
    // Log the end of impersonation
    logAIAction(targetUserId, {
        type: 'impersonation_end',
        adminId: adminState.originalAdminId,
        duration: Date.now() - (adminState.actionLog[targetUserId]?.[0]?.timestamp || Date.now())
    });
    
    adminState.isImpersonating = false;
    adminState.selectedUserId = null;
    
    Logger.info('Impersonation ended', { 
        adminId: adminState.originalAdminId, 
        wasImpersonating: targetUserId 
    });
    
    adminState.originalAdminId = null;
    
    // Refresh dashboard
    refreshDashboard();
    
    return { success: true };
}

/**
 * Check if currently impersonating
 */
export function isImpersonating() {
    return adminState.isImpersonating;
}

// ============================================================================
// USER MANAGEMENT
// ============================================================================

/**
 * Get list of all users with their stats
 */
export function getUserList() {
    // Get all users from localStorage by scanning for user-prefixed keys
    const userIds = new Set();
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        // Match user-prefixed keys like "userId_progress" or "userId_events"
        const match = key.match(/^([^_]+)_(?:progress|events|portulingo_progress|learner_profile|stuckWords)/);
        if (match && match[1] !== 'admin' && match[1] !== 'global') {
            userIds.add(match[1]);
        }
    }
    
    // Also check the auth storage for logged users
    try {
        const authData = localStorage.getItem('portugueseAuth');
        if (authData) {
            const auth = JSON.parse(authData);
            if (auth.username) {
                userIds.add(auth.username);
            }
        }
    } catch (e) {
        // Ignore parse errors
    }
    
    // Add admin user
    userIds.add('admin');
    
    const users = Array.from(userIds).map(userId => {
        const actions = getUserActions(userId, DEFAULT_TIME_WINDOW);
        let userEvents = [];
        try {
            const eventsData = localStorage.getItem(`${userId}_events`);
            if (eventsData) {
                userEvents = JSON.parse(eventsData) || [];
            }
        } catch (e) {
            // Ignore
        }
        
        return {
            userId,
            username: userId,
            isAdmin: userId === 'admin',
            role: userId === 'admin' ? 'admin' : 'user',
            recentActionCount: actions.length,
            lastAction: actions[0]?.timestamp || null,
            totalEvents: userEvents.length,
            stuckWordsCount: getStuckWordsCount(userId),
            rescueLessonsCreated: countRescueLessons(userId)
        };
    });
    
    return users.sort((a, b) => {
        // Admin first, then by recent activity
        if (a.isAdmin) return -1;
        if (b.isAdmin) return 1;
        return (b.lastAction || 0) - (a.lastAction || 0);
    });
}

function getStuckWordsCount(userId) {
    try {
        const stuckData = localStorage.getItem(`${userId}_stuck_words`);
        if (stuckData) {
            const parsed = JSON.parse(stuckData);
            return Object.values(parsed.words || {}).filter(w => w.stuckSince).length;
        }
    } catch (e) {
        // Ignore
    }
    return 0;
}

function countRescueLessons(userId) {
    try {
        const customLessons = localStorage.getItem(`${userId}_custom_lessons`);
        if (customLessons) {
            const parsed = JSON.parse(customLessons);
            return parsed.filter(l => l.isRescueLesson).length;
        }
    } catch (e) {
        // Ignore
    }
    return 0;
}

// ============================================================================
// DASHBOARD RENDERING
// ============================================================================

/**
 * Render the admin dashboard HTML
 */
export function renderAdminDashboard() {
    if (!isAdmin()) {
        return `
            <div class="admin-dashboard admin-locked">
                <h2>🔒 Admin Access Required</h2>
                <p>Please log in as an administrator to access this dashboard.</p>
            </div>
        `;
    }
    
    const users = getUserList();
    const recentActions = getAllActions(adminState.timeWindow);
    const globalEvents = getGlobalEvents(adminState.timeWindow);
    
    return `
        <div class="admin-dashboard">
            <header class="admin-header">
                <h2>🛡️ Admin Dashboard</h2>
                ${adminState.isImpersonating ? `
                    <div class="impersonation-banner">
                        ⚠️ Viewing as: <strong>${adminState.selectedUserId}</strong>
                        <button onclick="window.adminDashboard.endImpersonation()" class="btn-small btn-warning">
                            Return to Admin View
                        </button>
                    </div>
                ` : ''}
            </header>
            
            <div class="admin-grid">
                <!-- User List Panel -->
                <section class="admin-panel user-list-panel">
                    <h3>👥 Users (${users.length})</h3>
                    <div class="user-list">
                        ${users.map(user => renderUserCard(user)).join('')}
                    </div>
                </section>
                
                <!-- Global Event Log (ALL users) -->
                <section class="admin-panel global-events-panel">
                    <h3>📊 Global Event Log (All Users)</h3>
                    <div class="time-filter">
                        <label>Show last:</label>
                        <select onchange="window.adminDashboard.setTimeWindow(this.value)">
                            <option value="3600000" ${adminState.timeWindow === 3600000 ? 'selected' : ''}>1 hour</option>
                            <option value="86400000" ${adminState.timeWindow === 86400000 ? 'selected' : ''}>24 hours</option>
                            <option value="604800000" ${adminState.timeWindow === 604800000 ? 'selected' : ''}>7 days</option>
                        </select>
                        <button onclick="window.adminDashboard.refreshDashboard()" class="btn-small">🔄 Refresh</button>
                    </div>
                    <div class="global-event-feed">
                        ${globalEvents.length === 0 ? 
                            '<p class="muted">No events recorded yet. User interactions will appear here.</p>' :
                            globalEvents.slice(0, 100).map(e => renderGlobalEventEntry(e)).join('')
                        }
                    </div>
                </section>
                
                <!-- AI Activity Feed -->
                <section class="admin-panel activity-panel">
                    <h3>🤖 AI Activity Feed</h3>
                    <div class="activity-feed">
                        ${recentActions.length === 0 ? 
                            '<p class="muted">No recent AI activity</p>' :
                            recentActions.slice(0, 50).map(a => renderActionEntry(a)).join('')
                        }
                    </div>
                </section>
                
                <!-- Stats Panel -->
                <section class="admin-panel stats-panel">
                    <h3>📊 Quick Stats</h3>
                    <div class="stats-grid">
                        <div class="stat-card">
                            <span class="stat-value">${users.length}</span>
                            <span class="stat-label">Total Users</span>
                        </div>
                        <div class="stat-card">
                            <span class="stat-value">${globalEvents.length}</span>
                            <span class="stat-label">Events (${getTimeWindowLabel()})</span>
                        </div>
                        <div class="stat-card">
                            <span class="stat-value">${users.reduce((sum, u) => sum + u.stuckWordsCount, 0)}</span>
                            <span class="stat-label">Stuck Words</span>
                        </div>
                        <div class="stat-card">
                            <span class="stat-value">${users.reduce((sum, u) => sum + u.rescueLessonsCreated, 0)}</span>
                            <span class="stat-label">Rescue Lessons</span>
                        </div>
                    </div>
                    
                    <!-- Logger Stats -->
                    <div class="logger-stats">
                        <h4>📝 Logger Statistics</h4>
                        <div id="loggerStatsContent">
                            ${renderLoggerStats()}
                        </div>
                    </div>
                </section>

                <!-- Logger History -->
                <section class="admin-panel logs-panel">
                    <h3>📜 Recent Logs (All Users)</h3>
                    <div class="activity-feed">
                        ${renderLoggerHistory()}
                    </div>
                </section>
            </div>
        </div>
    `;
}

function getTimeWindowLabel() {
    if (adminState.timeWindow <= 3600000) return '1h';
    if (adminState.timeWindow <= 86400000) return '24h';
    return '7d';
}

function renderGlobalEventEntry(event) {
    const time = new Date(event.timestamp).toLocaleTimeString();
    const date = new Date(event.timestamp).toLocaleDateString();
    
    const typeIcons = {
        'word_attempt': '📝',
        'pronunciation': '🎤',
        'quiz_answer': '❓',
        'lesson_nav': '📚',
        'session_start': '🟢',
        'session_end': '🔴',
        'ui_action': '👆',
        'chat': '💬',
        'tool_call': '🔧',
        'lesson_created': '📚',
        'rescue_lesson': '🆘',
        'error': '❌',
        'tip_generated': '💡'
    };
    
    const icon = typeIcons[event.eventType] || '📌';
    
    // Format details for display
    let detailsStr = '';
    if (event.details) {
        if (typeof event.details === 'string') {
            detailsStr = event.details;
        } else {
            const keys = Object.keys(event.details).slice(0, 3);
            detailsStr = keys.map(k => `${k}: ${JSON.stringify(event.details[k]).slice(0, 30)}`).join(', ');
        }
    }
    
    return `
        <div class="global-event-entry event-type-${event.eventType}">
            <span class="event-icon">${icon}</span>
            <div class="event-content">
                <div class="event-header">
                    <span class="event-user" title="User ID">${event.userId}</span>
                    <span class="event-type">${event.eventType}</span>
                    <span class="event-time">${time}</span>
                </div>
                ${detailsStr ? `<div class="event-detail">${detailsStr}</div>` : ''}
            </div>
        </div>
    `;
}

function renderLoggerStats() {
    try {
        const stats = Logger.getStats();
        return `
            <div class="logger-stat-row">
                <span>Total Logs:</span> <strong>${stats.totalLogs}</strong>
            </div>
            <div class="logger-stat-row">
                <span>Debug:</span> ${stats.counts.debug} |
                <span>Info:</span> ${stats.counts.info} |
                <span>Warn:</span> ${stats.counts.warn} |
                <span>Error:</span> ${stats.counts.error}
            </div>
            <div class="logger-stat-row">
                <span>Console:</span> ${stats.consoleEnabled ? '✅' : '❌'} |
                <span>History:</span> ${stats.historyEnabled ? '✅' : '❌'}
            </div>
        `;
    } catch (e) {
        return '<p class="muted">Logger stats unavailable</p>';
    }
}

function renderLoggerHistory() {
    try {
        const entries = Logger.getHistory({ limit: 50 });
        if (!entries.length) return '<p class="muted">No log history yet.</p>';
        return entries
            .slice(-50)
            .reverse()
            .map(entry => {
                return `
                    <div class="action-entry action-type-${entry.levelLabel?.toLowerCase() || 'info'}">
                        <span class="action-icon">${entry.levelLabel || 'LOG'}</span>
                        <div class="action-content">
                            <div class="action-header">
                                <span class="action-user">${entry.context || 'app'}</span>
                                <span class="action-time">${entry.timestamp}</span>
                            </div>
                            <div class="action-detail">${entry.message}</div>
                        </div>
                    </div>
                `;
            })
            .join('');
    } catch (e) {
        return '<p class="muted">Failed to load log history.</p>';
    }
}

function renderUserCard(user) {
    const isCurrentUser = user.userId === getUser().userId;
    
    return `
        <div class="user-card ${isCurrentUser ? 'current-user' : ''}" data-user-id="${user.userId}">
            <div class="user-info">
                <span class="user-avatar">${user.isAdmin ? '👑' : '👤'}</span>
                <div class="user-details">
                    <strong>${user.username || user.userId}</strong>
                    <small class="muted">${user.role || 'user'}</small>
                </div>
            </div>
            <div class="user-stats">
                <span title="Recent AI actions">🤖 ${user.recentActionCount}</span>
                <span title="Stuck words">📛 ${user.stuckWordsCount}</span>
                <span title="Rescue lessons">🆘 ${user.rescueLessonsCreated}</span>
            </div>
            <div class="user-actions">
                ${!isCurrentUser && !adminState.isImpersonating ? `
                    <button onclick="window.adminDashboard.impersonateUser('${user.userId}')" 
                            class="btn-small btn-secondary" title="Log in as this user">
                        🔑 Login as
                    </button>
                ` : ''}
                <button onclick="window.adminDashboard.viewUserActions('${user.userId}')" 
                        class="btn-small" title="View AI actions">
                    📋 Actions
                </button>
            </div>
        </div>
    `;
}

function renderActionEntry(action) {
    const time = new Date(action.timestamp).toLocaleTimeString();
    const date = new Date(action.timestamp).toLocaleDateString();
    
    const typeIcons = {
        'chat': '💬',
        'tool_call': '🔧',
        'lesson_created': '📚',
        'rescue_lesson': '🆘',
        'impersonation_start': '🔑',
        'impersonation_end': '🔒',
        'error': '❌',
        'tip_generated': '💡'
    };
    
    const icon = typeIcons[action.type] || '📝';
    
    return `
        <div class="action-entry action-type-${action.type}">
            <span class="action-icon">${icon}</span>
            <div class="action-content">
                <div class="action-header">
                    <span class="action-user">${action.userId}</span>
                    <span class="action-time">${time} ${date}</span>
                </div>
                <div class="action-detail">
                    <strong>${action.type}</strong>
                    ${action.details ? `: ${JSON.stringify(action.details).slice(0, 100)}...` : ''}
                </div>
            </div>
        </div>
    `;
}

// ============================================================================
// DASHBOARD CONTROLLER
// ============================================================================

/**
 * Set time window filter
 */
export function setTimeWindow(ms) {
    adminState.timeWindow = parseInt(ms);
    refreshDashboard();
}

/**
 * View actions for a specific user
 */
export function viewUserActions(userId) {
    adminState.selectedUserId = userId;
    
    const actions = getUserActions(userId, adminState.timeWindow);
    
    // Show in modal or panel
    const modal = document.createElement('div');
    modal.className = 'modal admin-modal';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>AI Actions for ${userId}</h3>
                <button class="close-btn" onclick="this.closest('.modal').remove()">×</button>
            </div>
            <div class="modal-body">
                ${actions.length === 0 ? 
                    '<p class="muted">No actions in selected time window</p>' :
                    actions.map(a => renderActionEntry({ userId, ...a })).join('')
                }
            </div>
        </div>
    `;
    modal.style.display = 'flex';
    document.body.appendChild(modal);
}

/**
 * Refresh the dashboard display
 */
export function refreshDashboard() {
    const container = document.getElementById('adminDashboardContainer');
    if (container) {
        container.innerHTML = renderAdminDashboard();
    }
}

// ============================================================================
// INITIALIZATION
// ============================================================================

/**
 * Initialize the admin dashboard
 */
export function initAdminDashboard() {
    loadActionLog();
    loadGlobalEventLog();
    
    // Subscribe to AI events for logging
    window.addEventListener('ai-tool-call', (e) => {
        const userId = e.detail.userId || userStorage.getCurrentUserId() || 'unknown';
        logGlobalEvent({
            userId,
            eventType: 'tool_call',
            details: e.detail,
            source: 'ai-agent'
        });
    });
    
    window.addEventListener('ai-chat-response', (e) => {
        const userId = e.detail.userId || userStorage.getCurrentUserId() || 'unknown';
        logGlobalEvent({
            userId,
            eventType: 'chat',
            details: { messageLength: e.detail.response?.length || 0 },
            source: 'ai-chat'
        });
    });
    
    window.addEventListener('ai-rescue-lesson-needed', (e) => {
        const { userId, wordKeys } = e.detail;
        logGlobalEvent({
            userId: userId || 'unknown',
            eventType: 'rescue_lesson',
            details: { wordCount: wordKeys?.length || 0, words: wordKeys?.slice(0, 5) },
            source: 'stuck-words'
        });
    });
    
    // Subscribe to event streaming batch events
    window.addEventListener('ai-event-batch', (e) => {
        const events = e.detail?.events || [];
        events.forEach(event => {
            logGlobalEvent({
                userId: event.userId || 'unknown',
                eventType: event.eventType,
                details: event.data,
                source: 'event-stream'
            });
        });
    });
    
    // Subscribe to learning events
    window.addEventListener('learning_event', (e) => {
        logGlobalEvent({
            userId: e.detail?.userId || userStorage.getCurrentUserId() || 'unknown',
            eventType: e.detail?.eventType || 'learning',
            details: e.detail,
            source: 'learning'
        });
    });
    
    // Start auto-refresh if admin
    if (isAdmin()) {
        startAutoRefresh();
    }
    
    // Expose to window for onclick handlers
    window.adminDashboard = {
        impersonateUser,
        endImpersonation,
        viewUserActions,
        setTimeWindow,
        refreshDashboard,
        logGlobalEvent,
        getGlobalEvents
    };
    
    Logger.info('Admin dashboard initialized');
}

/**
 * Start auto-refresh interval
 */
function startAutoRefresh() {
    if (adminState.refreshInterval) {
        clearInterval(adminState.refreshInterval);
    }
    // Refresh every 30 seconds when on admin page
    adminState.refreshInterval = setInterval(() => {
        const adminPage = document.getElementById('page-admin');
        if (adminPage && adminPage.classList.contains('active')) {
            refreshDashboard();
        }
    }, 30000);
}

/**
 * Stop auto-refresh
 */
function stopAutoRefresh() {
    if (adminState.refreshInterval) {
        clearInterval(adminState.refreshInterval);
        adminState.refreshInterval = null;
    }
}

// Auto-initialize when loaded
if (typeof window !== 'undefined') {
    initAdminDashboard();
}

export default {
    logAIAction,
    getUserActions,
    getAllActions,
    impersonateUser,
    endImpersonation,
    isImpersonating,
    getUserList,
    renderAdminDashboard,
    initAdminDashboard
};
