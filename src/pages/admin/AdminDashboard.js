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
import { AI_CONFIG as PIPELINE_AI_CONFIG } from '../../config/constants.js';
import { AI_CONFIG as AI_SERVICE_CONFIG, checkOllamaStatus, setModel as setAIServiceModel } from '../../services/AIService.js';
import { parseCSV } from '../../services/CSVLessonLoader.js';

// ============================================================================
// CONSTANTS
// ============================================================================

const ADMIN_STORAGE_KEY = 'admin_action_log';
const GLOBAL_EVENT_LOG_KEY = 'global_event_log';
const ADMIN_AI_SETTINGS_KEY = 'admin_ai_settings';
const ADMIN_INGESTION_KEY = 'admin_ingested_lessons';
const MAX_ACTIONS_PER_USER = 500;
const MAX_GLOBAL_EVENTS = 1000;
const DEFAULT_TIME_WINDOW = 24 * 60 * 60 * 1000; // 24 hours

const CSV_TEMPLATE_PATH = '/src/data/templates/csv_lesson_template.csv';
const STATIC_IMAGE_OPTIONS = [
    { id: 'default', label: 'Default', path: 'assets/lesson-thumbs/default.svg' },
    { id: 'building', label: 'Building Blocks', path: 'assets/lesson-thumbs/building-blocks.svg' },
    { id: 'essentials', label: 'Essentials', path: 'assets/lesson-thumbs/essentials.svg' },
    { id: 'phrase', label: 'Phrase Hacks', path: 'assets/lesson-thumbs/phrase-hacks.svg' }
];

const DEFAULT_INGESTION_FORM = {
    lessonId: '',
    title: '',
    titlePt: '',
    category: 'Building Blocks',
    tier: 1,
    order: 1,
    description: '',
    icon: '📚',
    image: STATIC_IMAGE_OPTIONS[0].path,
    imageStrategy: 'static',
    estimatedMinutes: 10
};

const DEFAULT_AI_SETTINGS = {
    preferredModel: AI_SERVICE_CONFIG.defaultModel || PIPELINE_AI_CONFIG.model || 'qwen2.5:7b',
    fallbackModel: AI_SERVICE_CONFIG.fallbackModel || PIPELINE_AI_CONFIG.fallbackModel || 'qwen2.5:3b',
    temperature: AI_SERVICE_CONFIG.defaultTemperature || PIPELINE_AI_CONFIG.temperature || 0.7,
    useFallback: true
};

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
    refreshInterval: null,
    aiSettings: { ...DEFAULT_AI_SETTINGS },
    aiStatus: {
        available: null,
        models: [],
        selectedModel: DEFAULT_AI_SETTINGS.preferredModel,
        lastCheck: null,
        provider: null
    },
    ingestion: {
        form: { ...DEFAULT_INGESTION_FORM },
        preview: null,
        staged: [],
        error: null
    }
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
// AI CONTROLS
// ============================================================================

function loadAdminAISettings() {
    try {
        const saved = localStorage.getItem(ADMIN_AI_SETTINGS_KEY);
        if (saved) {
            adminState.aiSettings = { ...DEFAULT_AI_SETTINGS, ...JSON.parse(saved) };
        }
    } catch (e) {
        adminState.aiSettings = { ...DEFAULT_AI_SETTINGS };
    }
}

function saveAdminAISettings() {
    try {
        localStorage.setItem(ADMIN_AI_SETTINGS_KEY, JSON.stringify(adminState.aiSettings));
    } catch (e) {
        Logger.warn('Failed to persist admin AI settings', { error: e.message });
    }
}

async function refreshAIStatus() {
    try {
        const status = await checkOllamaStatus();
        adminState.aiStatus = {
            available: status.available,
            models: status.models || [],
            selectedModel: status.selected || adminState.aiSettings.preferredModel,
            lastCheck: Date.now(),
            provider: status.available ? 'ollama' : 'rules'
        };

        // Keep preferred model in sync with runtime selection
        if (status.selected) {
            adminState.aiSettings.preferredModel = status.selected;
            saveAdminAISettings();
        }

        refreshDashboard();
        return status;
    } catch (e) {
        adminState.aiStatus = {
            available: false,
            models: [],
            selectedModel: adminState.aiSettings.preferredModel,
            lastCheck: Date.now(),
            provider: 'rules',
            error: e.message
        };
        refreshDashboard();
        return adminState.aiStatus;
    }
}

function applyModelSelection(modelName) {
    if (!modelName) return;
    adminState.aiSettings.preferredModel = modelName;

    // Update both AI stacks so chat/pipeline stay aligned
    AI_SERVICE_CONFIG.defaultModel = modelName;
    PIPELINE_AI_CONFIG.model = modelName;
    setAIServiceModel(modelName);

    saveAdminAISettings();
    logGlobalEvent({
        userId: 'admin',
        eventType: 'admin_model_change',
        details: { model: modelName, availableModels: adminState.aiStatus.models }
    });
    refreshDashboard();
}

function updateFallbackModel(modelName) {
    if (!modelName) return;
    adminState.aiSettings.fallbackModel = modelName;
    AI_SERVICE_CONFIG.fallbackModel = modelName;
    PIPELINE_AI_CONFIG.fallbackModel = modelName;
    saveAdminAISettings();
    refreshDashboard();
}

function updateTemperature(value) {
    const temp = Number(value);
    if (Number.isNaN(temp)) return;
    const clamped = Math.min(Math.max(temp, 0), 1.5);
    adminState.aiSettings.temperature = clamped;
    AI_SERVICE_CONFIG.defaultTemperature = clamped;
    PIPELINE_AI_CONFIG.temperature = clamped;
    saveAdminAISettings();
    refreshDashboard();
}

function getModelOptions() {
    const known = new Set([
        adminState.aiSettings.preferredModel,
        adminState.aiSettings.fallbackModel,
        PIPELINE_AI_CONFIG.model,
        PIPELINE_AI_CONFIG.fallbackModel,
        AI_SERVICE_CONFIG.defaultModel,
        AI_SERVICE_CONFIG.fallbackModel
    ].filter(Boolean));
    (adminState.aiStatus.models || []).forEach(m => known.add(m));
    return Array.from(known).filter(Boolean);
}

// ============================================================================
// INGESTION CONTROLS
// ============================================================================

function loadIngestionState() {
    try {
        const saved = localStorage.getItem(ADMIN_INGESTION_KEY);
        if (saved) {
            const parsed = JSON.parse(saved);
            adminState.ingestion.form = { ...DEFAULT_INGESTION_FORM, ...(parsed.form || {}) };
            adminState.ingestion.staged = parsed.staged || [];
        }
    } catch (e) {
        adminState.ingestion.form = { ...DEFAULT_INGESTION_FORM };
        adminState.ingestion.staged = [];
    }
}

function saveIngestionState() {
    try {
        localStorage.setItem(ADMIN_INGESTION_KEY, JSON.stringify({
            form: adminState.ingestion.form,
            staged: adminState.ingestion.staged
        }));
    } catch (e) {
        Logger.warn('Failed to persist ingestion state', { error: e.message });
    }
}

async function handleCSVUpload(event) {
    const file = event.target?.files?.[0];
    if (!file) return;
    try {
        const text = await file.text();
        const rows = parseCSV(text);
        const columns = rows[0] ? Object.keys(rows[0]) : [];
        adminState.ingestion.preview = {
            filename: file.name,
            rows,
            columns,
            totalRows: rows.length
        };
        adminState.ingestion.error = rows.length ? null : 'CSV contains no rows';
        event.target.value = '';
        refreshDashboard();
    } catch (e) {
        adminState.ingestion.error = 'Failed to parse CSV';
        refreshDashboard();
    }
}

function updateIngestionField(field, value) {
    const numericFields = ['tier', 'order', 'estimatedMinutes'];
    if (numericFields.includes(field)) {
        adminState.ingestion.form[field] = Number(value) || 0;
    } else {
        adminState.ingestion.form[field] = value;
    }
    saveIngestionState();
    refreshDashboard();
}

function stageLessonFromPreview() {
    const { preview, form } = adminState.ingestion;
    if (!preview || !preview.rows?.length) {
        adminState.ingestion.error = 'Upload a CSV before staging a lesson.';
        refreshDashboard();
        return;
    }

    const metadata = {
        id: form.lessonId || preview.filename?.replace(/\.csv$/i, '') || `lesson_${Date.now()}`,
        title: form.title || preview.filename || 'Custom Lesson',
        titlePt: form.titlePt || form.title || preview.filename || 'Lição personalizada',
        category: form.category || 'Building Blocks',
        tier: Number(form.tier) || 1,
        order: Number(form.order) || 1,
        description: form.description || '',
        icon: form.icon || '📚',
        image: form.image,
        imageStrategy: 'static',
        estimatedMinutes: Number(form.estimatedMinutes) || 10,
        source: 'admin_csv',
        createdAt: new Date().toISOString(),
        rowCount: preview.rows.length
    };

    const lessonPackage = {
        metadata,
        rows: preview.rows,
        columns: preview.columns
    };

    adminState.ingestion.staged.unshift(lessonPackage);
    adminState.ingestion.error = null;
    saveIngestionState();
    refreshDashboard();
}

function clearStagedLessons() {
    adminState.ingestion.staged = [];
    adminState.ingestion.preview = null;
    adminState.ingestion.form = { ...DEFAULT_INGESTION_FORM };
    adminState.ingestion.error = null;
    saveIngestionState();
    refreshDashboard();
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
                        <button onclick="window.adminDashboard.endImpersonation()" class="btn-small btn-warning">Return to Admin View</button>
                    </div>
                ` : ''}
            </header>

            <div class="admin-top-grid">
                ${renderAIControls()}
                ${renderLessonIngestion()}
            </div>

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

function renderAIControls() {
    const status = adminState.aiStatus || {};
    const settings = adminState.aiSettings || DEFAULT_AI_SETTINGS;
    const models = getModelOptions();
    const lastCheck = status.lastCheck ? new Date(status.lastCheck).toLocaleTimeString() : 'never';

    return `
        <section class="admin-panel ai-controls-panel">
            <div class="panel-header">
                <div>
                    <h3>🤖 AI Controls</h3>
                    <p class="muted small-text">Model registry, runtime status, and tutor levers.</p>
                </div>
                <div class="panel-actions">
                    <button onclick="window.adminDashboard.refreshAIStatus()" class="btn-small">🔄 Check Ollama</button>
                </div>
            </div>
            <div class="ai-status-row">
                <span class="pill ${status.available ? 'pill-success' : 'pill-danger'}">${status.available ? 'Ollama online' : 'Offline / fallback'}</span>
                <span class="pill">Active: ${settings.preferredModel}</span>
                <span class="pill">Fallback: ${settings.fallbackModel}</span>
                <span class="muted">Last check: ${lastCheck}</span>
            </div>
            <div class="admin-form-grid ai-form-grid">
                <label>
                    <span>Active model</span>
                    <select onchange="window.adminDashboard.setActiveModel(this.value)">
                        ${models.map(model => `<option value="${model}" ${model === settings.preferredModel ? 'selected' : ''}>${model}</option>`).join('')}
                    </select>
                </label>
                <label>
                    <span>Fallback model</span>
                    <input type="text" value="${sanitize(settings.fallbackModel)}" oninput="window.adminDashboard.updateFallbackModel(this.value)" />
                </label>
                <label>
                    <span>Temperature</span>
                    <input type="number" min="0" max="1.5" step="0.1" value="${settings.temperature}" onchange="window.adminDashboard.updateTemperature(this.value)" />
                </label>
            </div>
            <div class="ai-note">
                <p class="muted">Use local models for accuracy and stability. Avoid dynamic image pulls; pair lessons with static assets.</p>
                ${status.models?.length ? `<p class="muted small-text">Discovered models: ${status.models.join(', ')}</p>` : '<p class="muted small-text">No models discovered yet. Start Ollama then refresh.</p>'}
            </div>
        </section>
    `;
}

function renderLessonIngestion() {
    const { form, preview, staged, error } = adminState.ingestion;
    return `
        <section class="admin-panel ingestion-panel">
            <div class="panel-header">
                <div>
                    <h3>📥 Lesson CSV Ingestion</h3>
                    <p class="muted small-text">Upload CSV from template, validate, and stage with static imagery.</p>
                </div>
                <div class="panel-actions">
                    <a class="btn-small" href="${CSV_TEMPLATE_PATH}" download>⬇️ Download template</a>
                    <label class="btn-small file-input-btn" for="adminCsvUpload">📂 Upload CSV</label>
                    <input id="adminCsvUpload" type="file" accept=".csv" style="display:none" onchange="window.adminDashboard.handleCSVUpload(event)" />
                </div>
            </div>
            <div class="admin-form-grid">
                <label><span>Lesson ID</span><input value="${sanitize(form.lessonId)}" oninput="window.adminDashboard.updateIngestionField('lessonId', this.value)" placeholder="e.g., 099_custom_topic" /></label>
                <label><span>Title (EN)</span><input value="${sanitize(form.title)}" oninput="window.adminDashboard.updateIngestionField('title', this.value)" placeholder="English title" /></label>
                <label><span>Title (PT)</span><input value="${sanitize(form.titlePt)}" oninput="window.adminDashboard.updateIngestionField('titlePt', this.value)" placeholder="Título em Português" /></label>
                <label><span>Category</span><input value="${sanitize(form.category)}" oninput="window.adminDashboard.updateIngestionField('category', this.value)" placeholder="Building Blocks" /></label>
                <label><span>Tier</span><input type="number" min="1" max="3" value="${form.tier}" oninput="window.adminDashboard.updateIngestionField('tier', this.value)" /></label>
                <label><span>Order</span><input type="number" min="1" value="${form.order}" oninput="window.adminDashboard.updateIngestionField('order', this.value)" /></label>
                <label><span>Icon</span><input value="${sanitize(form.icon)}" oninput="window.adminDashboard.updateIngestionField('icon', this.value)" placeholder="Emoji or short code" /></label>
                <label><span>Estimated Minutes</span><input type="number" min="5" max="45" value="${form.estimatedMinutes}" oninput="window.adminDashboard.updateIngestionField('estimatedMinutes', this.value)" /></label>
                <label class="span-2"><span>Description</span><textarea rows="2" oninput="window.adminDashboard.updateIngestionField('description', this.value)">${form.description || ''}</textarea></label>
                <label><span>Image (static asset)</span>
                    <select onchange="window.adminDashboard.updateIngestionField('image', this.value)">
                        ${STATIC_IMAGE_OPTIONS.map(opt => `<option value="${opt.path}" ${opt.path === form.image ? 'selected' : ''}>${opt.label} (${opt.path})</option>`).join('')}
                        <option value="${sanitize(form.image)}" ${STATIC_IMAGE_OPTIONS.every(opt => opt.path !== form.image) ? 'selected' : ''}>Custom path</option>
                    </select>
                </label>
                <label><span>Custom image path</span><input value="${sanitize(form.image)}" oninput="window.adminDashboard.updateIngestionField('image', this.value)" placeholder="assets/lesson-thumbs/default.svg" /></label>
            </div>
            ${error ? `<p class="error-text">${error}</p>` : ''}
            ${preview ? renderCSVPreview(preview) : '<p class="muted">Upload a CSV to see a preview. Template enforces word_id, portuguese, english, pronunciation, type, difficulty, tip, example_pt, example_en, image.</p>'}
            <div class="ingestion-actions">
                <button class="btn-small" onclick="window.adminDashboard.stageLessonFromPreview()">✅ Stage lesson</button>
                <button class="btn-small btn-secondary" onclick="window.adminDashboard.clearStagedLessons()">🗑️ Clear staged</button>
            </div>
            ${renderStagedLessons(staged)}
        </section>
    `;
}

function renderCSVPreview(preview) {
    if (!preview?.rows?.length) {
        return '<p class="muted">No rows found in CSV.</p>';
    }
    const headers = preview.columns || Object.keys(preview.rows[0]);
    const rows = preview.rows.slice(0, 5);
    return `
        <div class="ingestion-preview">
            <div class="preview-header">
                <strong>${preview.filename}</strong>
                <span class="muted">${preview.totalRows} rows</span>
            </div>
            <div class="table-scroll">
                <table>
                    <thead><tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr></thead>
                    <tbody>
                        ${rows.map(row => `<tr>${headers.map(h => `<td>${sanitize(row[h] || '')}</td>`).join('')}</tr>`).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

function renderStagedLessons(staged) {
    if (!staged || staged.length === 0) {
        return '<p class="muted">No staged lessons yet.</p>';
    }
    return `
        <div class="staged-lessons">
            ${staged.map(lesson => `
                <div class="staged-card">
                    <div>
                        <strong>${lesson.metadata.id}</strong>
                        <p class="muted small-text">${lesson.metadata.title} / ${lesson.metadata.titlePt}</p>
                    </div>
                    <div class="staged-meta">
                        <span class="pill">${lesson.rows.length} rows</span>
                        <span class="pill">Tier ${lesson.metadata.tier}</span>
                        <a class="btn-small" href="data:application/json;charset=utf-8,${encodeURIComponent(JSON.stringify(lesson, null, 2))}" download="${lesson.metadata.id}.json">⬇️ Package</a>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
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
                    <button onclick="window.adminDashboard.impersonateUser('${user.userId}')" class="btn-small btn-secondary" title="Log in as this user">🔑 Login as</button>
                ` : ''}
                <button onclick="window.adminDashboard.viewUserActions('${user.userId}')" class="btn-small" title="View AI actions">📋 Actions</button>
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

function sanitize(value) {
    if (value === null || value === undefined) return '';
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
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
    loadAdminAISettings();
    loadIngestionState();

    // Kick off AI status check without blocking render
    refreshAIStatus();

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
        getGlobalEvents,
        setActiveModel: applyModelSelection,
        refreshAIStatus,
        updateFallbackModel,
        updateTemperature,
        handleCSVUpload,
        updateIngestionField,
        stageLessonFromPreview,
        clearStagedLessons
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