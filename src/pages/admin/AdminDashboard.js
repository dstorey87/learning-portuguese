/**
 * Admin Dashboard
 * 
 * Provides admin functionality:
 * - User list with "Log in as" controls
 * - AI action feed per user (time-windowed)
 * - Rescue triggers and lessons created
 * - Event processing status
 * 
 * @module pages/admin/AdminDashboard
 */

import * as Logger from '../../services/Logger.js';
import { getUser, isAdmin, getAllUsers, loginAsUser, logout } from '../../services/AuthService.js';
import { eventStream } from '../../services/eventStreaming.js';
import { userStorage } from '../../services/userStorage.js';

// ============================================================================
// CONSTANTS
// ============================================================================

const ADMIN_STORAGE_KEY = 'admin_action_log';
const MAX_ACTIONS_PER_USER = 500;
const DEFAULT_TIME_WINDOW = 24 * 60 * 60 * 1000; // 24 hours

// ============================================================================
// STATE
// ============================================================================

let adminState = {
    users: [],
    selectedUserId: null,
    actionLog: {},
    timeWindow: DEFAULT_TIME_WINDOW,
    isImpersonating: false,
    originalAdminId: null
};

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
 */
export function impersonateUser(targetUserId) {
    const currentUser = getUser();
    
    if (!isAdmin()) {
        Logger.error('admin_dashboard', 'Impersonation requires admin role');
        return { success: false, error: 'Admin access required' };
    }
    
    // Save original admin ID for return
    if (!adminState.isImpersonating) {
        adminState.originalAdminId = currentUser.userId;
    }
    
    // Log the impersonation
    logAIAction(targetUserId, {
        type: 'impersonation_start',
        adminId: currentUser.userId,
        reason: 'Admin audit'
    });
    
    // Switch to target user
    const result = loginAsUser(targetUserId);
    
    if (result.success) {
        adminState.isImpersonating = true;
        adminState.selectedUserId = targetUserId;
        
        Logger.info('admin_dashboard', 'Impersonation started', { 
            adminId: adminState.originalAdminId, 
            targetUserId 
        });
    }
    
    return result;
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
    
    // Switch back to admin
    const result = loginAsUser(adminState.originalAdminId);
    
    if (result.success) {
        adminState.isImpersonating = false;
        adminState.selectedUserId = null;
        
        Logger.info('admin_dashboard', 'Impersonation ended', { 
            adminId: adminState.originalAdminId, 
            wasImpersonating: targetUserId 
        });
    }
    
    adminState.originalAdminId = null;
    return result;
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
    const users = getAllUsers();
    
    return users.map(user => {
        const actions = getUserActions(user.userId, DEFAULT_TIME_WINDOW);
        const userEvents = userStorage.get('events') || [];
        
        return {
            ...user,
            recentActionCount: actions.length,
            lastAction: actions[0]?.timestamp || null,
            totalEvents: userEvents.length,
            stuckWordsCount: getStuckWordsCount(user.userId),
            rescueLessonsCreated: countRescueLessons(user.userId)
        };
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
    
    return `
        <div class="admin-dashboard">
            <header class="admin-header">
                <h2>🛡️ Admin Dashboard</h2>
                ${adminState.isImpersonating ? `
                    <div class="impersonation-banner">
                        ⚠️ Impersonating: <strong>${adminState.selectedUserId}</strong>
                        <button onclick="window.adminDashboard.endImpersonation()" class="btn-small btn-warning">
                            Return to Admin
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
                
                <!-- AI Activity Feed -->
                <section class="admin-panel activity-panel">
                    <h3>🤖 AI Activity Feed</h3>
                    <div class="time-filter">
                        <label>Show last:</label>
                        <select onchange="window.adminDashboard.setTimeWindow(this.value)">
                            <option value="3600000">1 hour</option>
                            <option value="86400000" selected>24 hours</option>
                            <option value="604800000">7 days</option>
                        </select>
                    </div>
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
                            <span class="stat-value">${recentActions.length}</span>
                            <span class="stat-label">AI Actions (24h)</span>
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
                </section>
            </div>
        </div>
    `;
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
    
    // Subscribe to AI events for logging
    window.addEventListener('ai-tool-call', (e) => {
        const userId = e.detail.userId || userStorage.getCurrentUserId();
        if (userId) {
            logAIAction(userId, {
                type: 'tool_call',
                details: e.detail
            });
        }
    });
    
    window.addEventListener('ai-chat-response', (e) => {
        const userId = e.detail.userId || userStorage.getCurrentUserId();
        if (userId) {
            logAIAction(userId, {
                type: 'chat',
                details: { messageLength: e.detail.response?.length || 0 }
            });
        }
    });
    
    window.addEventListener('ai-rescue-lesson-needed', (e) => {
        const { userId, wordKeys } = e.detail;
        if (userId) {
            logAIAction(userId, {
                type: 'rescue_lesson',
                details: { wordCount: wordKeys.length, words: wordKeys.slice(0, 5) }
            });
        }
    });
    
    // Expose to window for onclick handlers
    window.adminDashboard = {
        impersonateUser,
        endImpersonation,
        viewUserActions,
        setTimeWindow,
        refreshDashboard
    };
    
    Logger.info('admin_dashboard', 'Admin dashboard initialized');
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
