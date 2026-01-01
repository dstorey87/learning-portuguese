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
import eventStream from '../../services/eventStreaming.js';
import { parseCSV } from '../../services/CSVLessonLoader.js';
import { loadLessonMetadata } from '../../services/CSVLessonLoader.js';
import { 
    getImageCoverageStats, 
    getWordsMissingImages, 
    getWordsWithUnverifiedImages,
    IMAGE_CATEGORIES 
} from '../../config/imageConfig.js';
import { renderImageCuratorConsole, initImageCuratorConsole, cleanupImageCuratorConsole } from './ImageCuratorConsole.js';
import { renderAPIKeyManager, initAPIKeyManager, cleanupAPIKeyManager } from './APIKeyManager.js';

// ============================================================================
// CONSTANTS
// ============================================================================

const ADMIN_STORAGE_KEY = 'admin_action_log';
const GLOBAL_EVENT_LOG_KEY = 'global_event_log';
const ADMIN_AI_SETTINGS_KEY = 'admin_ai_settings';
const ADMIN_INGESTION_KEY = 'admin_ingested_lessons';
const ADMIN_USER_BACKUPS_KEY = 'admin_user_backups';
const ADMIN_USER_BACKUP_PREFIX = 'admin_user_backup_';
const LESSON_STATE_STORAGE_KEY = 'lessonSession';
const ADMIN_PANEL_STATE_KEY = 'admin_panel_collapsed_state';
const ADMIN_API_BASE = 'http://localhost:3001';
const MAX_ACTIONS_PER_USER = 500;
const MAX_GLOBAL_EVENTS = 1000;
const DEFAULT_TIME_WINDOW = 24 * 60 * 60 * 1000; // 24 hours
const PROGRESS_STORAGE_KEY = 'portulingo_progress';
const REQUIRED_CSV_COLUMNS = ['word_id', 'portuguese', 'english', 'pronunciation', 'type', 'difficulty', 'tip', 'example_pt', 'example_en'];
const DEFAULT_LESSON_COLUMNS = [...REQUIRED_CSV_COLUMNS, 'incorrect_answers', 'image'];

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
    },
    lessonEditor: {
        lessons: [],
        categories: {},
        selectedLessonId: null,
        csv: { rows: [], columns: [] },
        meta: null,
        loading: false,
        saving: false,
        error: null,
        message: null
    },
    backups: [],
    // Image management state
    imageStats: {
        total: 0,
        withImages: 0,
        withoutImages: 0,
        verified: 0,
        coverage: 0,
        verificationRate: 0
    },
    missingImages: [],
    unverifiedImages: [],
    // Panel collapsed state (persisted)
    collapsedPanels: {}
};

let refreshTimer = null;

// ============================================================================
// PANEL COLLAPSE/EXPAND FUNCTIONALITY
// ============================================================================

/**
 * Load collapsed panel state from localStorage
 */
function loadPanelCollapsedState() {
    try {
        const saved = localStorage.getItem(ADMIN_PANEL_STATE_KEY);
        if (saved) {
            adminState.collapsedPanels = JSON.parse(saved);
        }
    } catch (e) {
        Logger.warn('Failed to load panel collapsed state', { error: e.message });
    }
}

/**
 * Save collapsed panel state to localStorage
 */
function savePanelCollapsedState() {
    try {
        localStorage.setItem(ADMIN_PANEL_STATE_KEY, JSON.stringify(adminState.collapsedPanels));
    } catch (e) {
        Logger.warn('Failed to save panel collapsed state', { error: e.message });
    }
}

/**
 * Toggle panel collapsed state
 * @param {string} panelId - Panel identifier
 */
function togglePanelCollapsed(panelId) {
    adminState.collapsedPanels[panelId] = !adminState.collapsedPanels[panelId];
    savePanelCollapsedState();
    
    // Update the DOM directly for smooth animation
    const panel = document.querySelector(`[data-panel-id="${panelId}"]`);
    if (panel) {
        panel.classList.toggle('collapsed', adminState.collapsedPanels[panelId]);
    }
}

/**
 * Check if a panel is collapsed
 * @param {string} panelId - Panel identifier
 * @returns {boolean}
 */
function isPanelCollapsed(panelId) {
    return !!adminState.collapsedPanels[panelId];
}

/**
 * Initialize collapsible panels - add click handlers
 */
function initCollapsiblePanels() {
    // Use event delegation on the admin dashboard container
    // This handles dynamically rendered panels and survives re-renders
    const dashboard = document.querySelector('.admin-dashboard');
    if (!dashboard) return;
    
    // Only add the listener once
    if (dashboard.dataset.collapsibleInit) return;
    dashboard.dataset.collapsibleInit = 'true';
    
    dashboard.addEventListener('click', (e) => {
        // Check if click is on a panel header
        const header = e.target.closest('.admin-panel.collapsible .panel-header');
        if (!header) return;
        
        // Don't toggle if clicking on buttons or inputs within header
        if (e.target.closest('button, input, select, a, label')) {
            return;
        }
        
        const panel = header.closest('.admin-panel.collapsible');
        const panelId = panel?.getAttribute('data-panel-id');
        if (panelId) {
            togglePanelCollapsed(panelId);
        }
    });
    
    // Apply initial collapsed state to all panels
    applyCollapsedStates();
}

/**
 * Apply collapsed state to all panels (called after render)
 */
function applyCollapsedStates() {
    const panels = document.querySelectorAll('.admin-panel.collapsible[data-panel-id]');
    panels.forEach(panel => {
        const panelId = panel.getAttribute('data-panel-id');
        if (adminState.collapsedPanels[panelId]) {
            panel.classList.add('collapsed');
        } else {
            panel.classList.remove('collapsed');
        }
    });
}

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

        const progress = getUserProgressSummary(userId);
        const hasBackup = hasBackupForUser(userId);

        return {
            userId,
            username: userId,
            isAdmin: userId === 'admin',
            role: userId === 'admin' ? 'admin' : 'user',
            recentActionCount: actions.length,
            lastAction: actions[0]?.timestamp || null,
            totalEvents: userEvents.length,
            stuckWordsCount: getStuckWordsCount(userId),
            rescueLessonsCreated: countRescueLessons(userId),
            progress,
            hasBackup
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

function getUserProgressSummary(userId) {
    const result = {
        totalLessons: 0,
        averageAccuracy: null,
        lastAccuracy: null,
        learnedWords: 0,
        inProgress: null
    };

    try {
        const raw = localStorage.getItem(`${userId}_${PROGRESS_STORAGE_KEY}`);
        if (raw) {
            const progress = JSON.parse(raw);
            const lessons = progress.completedLessons || [];
            result.totalLessons = lessons.length;
            result.learnedWords = (progress.learnedWords || []).length;
            if (lessons.length) {
                const accuracies = lessons
                    .map(l => (typeof l.accuracy === 'number' ? l.accuracy : null))
                    .filter(val => val !== null && !Number.isNaN(val));
                if (accuracies.length) {
                    result.averageAccuracy = Math.round(accuracies.reduce((a, b) => a + b, 0) / accuracies.length);
                    result.lastAccuracy = accuracies[accuracies.length - 1];
                }
            }
        }
    } catch (e) {
        Logger.warn('Failed to read user progress', { userId, error: e.message });
    }

    try {
        const sessionRaw = localStorage.getItem(`${userId}_${LESSON_STATE_STORAGE_KEY}`);
        if (sessionRaw) {
            const session = JSON.parse(sessionRaw);
            const total = Array.isArray(session.challenges) ? session.challenges.length : 0;
            const index = Number(session.currentIndex || 0);
            const percent = total > 0 ? Math.min(100, Math.round((index / total) * 100)) : 0;
            result.inProgress = {
                lessonId: session.lessonId || session.lesson?.id || 'unknown',
                percent
            };
        }
    } catch (e) {
        Logger.warn('Failed to read active lesson session', { userId, error: e.message });
    }

    return result;
}

function hasBackupForUser(userId) {
    if (!adminState.backups?.length) return false;
    return adminState.backups.some(entry => entry.userId === userId);
}

function captureUserBackup(userId) {
    const items = [];
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key.startsWith(`${userId}_`)) {
            items.push({ key, value: localStorage.getItem(key) });
        }
    }

    return {
        id: `${userId}_${Date.now()}`,
        userId,
        createdAt: new Date().toISOString(),
        items,
        actionLog: adminState.actionLog[userId] || [],
        globalEvents: adminState.globalEventLog.filter(e => e.userId === userId)
    };
}

function persistUserBackup(backup) {
    try {
        localStorage.setItem(`${ADMIN_USER_BACKUP_PREFIX}${backup.id}`, JSON.stringify(backup));
        const index = loadBackupIndex();
        index.unshift({ id: backup.id, userId: backup.userId, createdAt: backup.createdAt });
        adminState.backups = index;
        saveBackupIndex(index);
    } catch (e) {
        Logger.warn('Failed to persist user backup', { userId: backup.userId, error: e.message });
    }
}

function getLatestBackupId(userId) {
    const entry = (adminState.backups || []).find(b => b.userId === userId);
    return entry ? entry.id : null;
}

function deleteUserWithBackup(userId) {
    if (!userId || userId === 'admin') {
        alert('Cannot delete admin user.');
        return;
    }

    const confirmed = confirm(`Delete user ${userId}? This will backup and remove their data.`);
    if (!confirmed) return;

    const backup = captureUserBackup(userId);
    persistUserBackup(backup);

    // Remove user-specific storage keys
    try {
        userStorage.deleteAllForUser(userId, true);
    } catch (e) {
        Logger.warn('Fallback deleteAllForUser failed, clearing manually', { error: e.message });
    }
    const prefix = `${userId}_`;
    const keysToDelete = [];
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key.startsWith(prefix)) {
            keysToDelete.push(key);
        }
    }
    keysToDelete.forEach(k => localStorage.removeItem(k));

    // Remove logs
    delete adminState.actionLog[userId];
    adminState.globalEventLog = adminState.globalEventLog.filter(e => e.userId !== userId);
    saveActionLog();
    saveGlobalEventLog();

    Logger.info('User deleted with backup', { userId, backupId: backup.id });
    requestDashboardRefresh();
}

function restoreUserFromBackup(backupId) {
    if (!backupId) return;
    const raw = localStorage.getItem(`${ADMIN_USER_BACKUP_PREFIX}${backupId}`);
    if (!raw) {
        alert('Backup not found.');
        return;
    }
    const backup = JSON.parse(raw);
    backup.items.forEach(item => localStorage.setItem(item.key, item.value));

    if (backup.actionLog) {
        adminState.actionLog[backup.userId] = backup.actionLog;
    }
    if (backup.globalEvents) {
        adminState.globalEventLog = [
            ...backup.globalEvents,
            ...adminState.globalEventLog.filter(e => e.userId !== backup.userId)
        ].slice(0, MAX_GLOBAL_EVENTS);
    }
    saveActionLog();
    saveGlobalEventLog();

    Logger.info('User restored from backup', { userId: backup.userId, backupId });
    requestDashboardRefresh();
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

// ============================================================================
// IMAGE MANAGEMENT FUNCTIONS
// ============================================================================

/**
 * Scan all lessons for image coverage statistics
 * Collects data on which words have images, which need curation
 */
async function scanImageCoverage() {
    try {
        Logger.info('Scanning image coverage across all lessons');
        
        // Load all lesson metadata
        const metadata = await loadLessonMetadata();
        const allWords = [];
        
        // For each lesson, try to load and parse its CSV
        for (const [lessonId, lessonMeta] of Object.entries(metadata.lessons || {})) {
            try {
                const csvFile = lessonMeta.csvFile || `${lessonId}.csv`;
                const response = await fetch(`/src/data/csv/${csvFile}`);
                if (!response.ok) {
                    Logger.warn(`Failed to load CSV for lesson ${lessonId}`, { status: response.status });
                    continue;
                }

                const csvText = await response.text();
                const parsed = parseCSV(csvText);
                const rows = Array.isArray(parsed) ? parsed : (parsed?.rows || []);

                // Add lesson context to each word
                rows.forEach(row => {
                    const normalized = {
                        ...row,
                        id: row.id || row.word_id,
                        word_id: row.word_id || row.id,
                        pt: row.pt || row.portuguese || row.word,
                        en: row.en || row.english || row.translation,
                        image_url: row.image_url || row.imageUrl || row.image,
                        lessonId,
                        lessonTitle: lessonMeta.title || lessonId
                    };
                    allWords.push(normalized);
                });
            } catch (e) {
                Logger.warn(`Failed to load CSV for lesson ${lessonId}`, { error: e.message });
            }
        }
        
        // Calculate coverage stats
        adminState.imageStats = getImageCoverageStats(allWords);
        adminState.missingImages = getWordsMissingImages(allWords);
        adminState.unverifiedImages = getWordsWithUnverifiedImages(allWords);
        
        Logger.info('Image coverage scan complete', { stats: adminState.imageStats });
        
        refreshDashboard();
    } catch (e) {
        Logger.error('Failed to scan image coverage', { error: e.message });
    }
}

/**
 * Export list of words missing images as CSV for curation
 */
function exportMissingImages() {
    if (!adminState.missingImages || adminState.missingImages.length === 0) {
        alert('No missing images to export. Run "Scan All Lessons" first.');
        return;
    }
    
    // Create CSV content
    const headers = ['portuguese', 'english', 'lesson_id', 'image_url', 'image_alt', 'image_verified'];
    const rows = adminState.missingImages.map(word => [
        word.pt || '',
        word.en || '',
        word.lessonId || '',
        '', // image_url - to be filled in
        '', // image_alt - to be filled in
        'false' // image_verified
    ]);
    
    const csvContent = [headers.join(','), ...rows.map(r => r.map(cell => `"${cell}"`).join(','))].join('\n');
    
    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `missing_images_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    
    Logger.info('Exported missing images list', { count: adminState.missingImages.length });
}

// ============================================================================
// AI STATUS FUNCTIONS
// ============================================================================

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

function loadBackupIndex() {
    try {
        const saved = localStorage.getItem(ADMIN_USER_BACKUPS_KEY);
        return saved ? JSON.parse(saved) : [];
    } catch (e) {
        Logger.warn('Failed to load backup index', { error: e.message });
        return [];
    }
}

function saveBackupIndex(index) {
    try {
        localStorage.setItem(ADMIN_USER_BACKUPS_KEY, JSON.stringify(index.slice(0, 50)));
    } catch (e) {
        Logger.warn('Failed to save backup index', { error: e.message });
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

// ============================================================================
// LESSON EDITOR (GUI for CSV + metadata)
// ============================================================================

async function loadLessonEditorIndex() {
    const editor = adminState.lessonEditor;
    editor.loading = true;
    editor.error = null;
    try {
        const res = await fetch(`${ADMIN_API_BASE}/admin/lessons`);
        if (!res.ok) throw new Error(`Lesson index failed (${res.status})`);
        const data = await res.json();
        editor.lessons = data.lessons || [];
        editor.categories = data.categories || {};
    } catch (e) {
        try {
            const fallback = await loadLessonMetadata();
            editor.lessons = Object.values(fallback.lessons || {});
            editor.categories = fallback.categories || {};
            editor.error = `Using local metadata (API unreachable): ${e.message}`;
        } catch (err) {
            editor.error = e.message || 'Failed to load lessons';
        }
    }
    editor.loading = false;
    requestDashboardRefresh();
}

async function selectLessonForEdit(lessonId) {
    const editor = adminState.lessonEditor;
    if (!lessonId) return;
    editor.selectedLessonId = lessonId;
    editor.loading = true;
    editor.error = null;
    editor.message = null;
    try {
        const res = await fetch(`${ADMIN_API_BASE}/admin/lessons/${lessonId}`);
        if (!res.ok) throw new Error(`Lesson fetch failed (${res.status})`);
        const data = await res.json();
        editor.meta = data.lesson;
        editor.csv = data.csv || { rows: [], columns: [] };
    } catch (e) {
        try {
            const fallbackMeta = await loadLessonMetadata();
            const lesson = fallbackMeta.lessons?.[lessonId];
            if (!lesson) throw e;
            const csvRes = await fetch(`/src/data/csv/${lesson.csvFile}`);
            const csvText = await csvRes.text();
            const rows = parseCSV(csvText);
            const columns = csvText.trim().split('\n')[0]?.split(',') || DEFAULT_LESSON_COLUMNS;
            editor.meta = lesson;
            editor.csv = { rows, columns };
            editor.error = `Using static files (API unreachable): ${e.message}`;
        } catch (fallbackError) {
            editor.error = e.message || fallbackError.message;
            editor.meta = null;
            editor.csv = { rows: [], columns: [] };
        }
    }
    editor.loading = false;
    requestDashboardRefresh();
}

function updateLessonMetaField(field, value) {
    if (!adminState.lessonEditor.meta) return;
    adminState.lessonEditor.meta = { ...adminState.lessonEditor.meta, [field]: value };
    requestDashboardRefresh();
}

function updateLessonRow(index, field, value) {
    const editor = adminState.lessonEditor;
    const rows = [...(editor.csv.rows || [])];
    if (!rows[index]) return;
    rows[index] = { ...rows[index], [field]: value };
    editor.csv.rows = rows;
    requestDashboardRefresh();
}

function addLessonRow() {
    const editor = adminState.lessonEditor;
    const columns = editor.csv.columns.length ? editor.csv.columns : DEFAULT_LESSON_COLUMNS;
    const newRow = {};
    columns.forEach(col => {
        newRow[col] = '';
    });
    editor.csv.rows = [...editor.csv.rows, newRow];
    requestDashboardRefresh();
}

function removeLessonRow(index) {
    const editor = adminState.lessonEditor;
    editor.csv.rows = editor.csv.rows.filter((_, i) => i !== index);
    requestDashboardRefresh();
}

async function uploadLessonImage(fileInput) {
    const file = fileInput?.files?.[0];
    if (!file || !adminState.lessonEditor.selectedLessonId) return;
    const editor = adminState.lessonEditor;
    editor.saving = true;
    editor.error = null;
    editor.message = null;
    try {
        const formData = new FormData();
        formData.append('image', file);
        const res = await fetch(`${ADMIN_API_BASE}/admin/lessons/${editor.selectedLessonId}/upload-image`, {
            method: 'POST',
            body: formData
        });
        if (!res.ok) throw new Error(`Upload failed (${res.status})`);
        const data = await res.json();
        updateLessonMetaField('image', data.path);
        editor.message = 'Image uploaded';
    } catch (e) {
        editor.error = e.message || 'Upload failed';
    }
    editor.saving = false;
    requestDashboardRefresh();
}

async function saveLessonEditorChanges() {
    const editor = adminState.lessonEditor;
    if (!editor.selectedLessonId || !editor.meta) return;
    editor.saving = true;
    editor.error = null;
    editor.message = null;
    try {
        const metaRes = await fetch(`${ADMIN_API_BASE}/admin/lessons/${editor.selectedLessonId}/meta`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(editor.meta)
        });
        if (!metaRes.ok) throw new Error(`Meta save failed (${metaRes.status})`);

        const columns = editor.csv.columns.length ? editor.csv.columns : DEFAULT_LESSON_COLUMNS;
        const csvRes = await fetch(`${ADMIN_API_BASE}/admin/lessons/${editor.selectedLessonId}/csv`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ rows: editor.csv.rows, columns })
        });
        if (!csvRes.ok) throw new Error(`CSV save failed (${csvRes.status})`);
        editor.message = 'Lesson saved';
    } catch (e) {
        editor.error = e.message || 'Save failed';
    }
    editor.saving = false;
    requestDashboardRefresh();
}

async function handleCSVUpload(event) {
    const file = event.target?.files?.[0];
    if (!file) return;
    try {
        const text = await file.text();
        const rows = parseCSV(text);
        const columns = rows[0] ? Object.keys(rows[0]) : [];
        const validation = validateCSV(rows, columns);
        if (!validation.valid) {
            adminState.ingestion.preview = null;
            adminState.ingestion.error = `CSV validation failed: ${validation.errors[0] || 'Unknown error'}`;
            Logger.error('CSV ingestion validation failed', { errors: validation.errors });
            event.target.value = '';
            requestDashboardRefresh();
            return;
        }

        adminState.ingestion.preview = {
            filename: file.name,
            rows,
            columns,
            totalRows: rows.length
        };
        adminState.ingestion.error = rows.length ? null : 'CSV contains no rows';
        event.target.value = '';

        // Auto-stage on successful validation for upload-and-forget flow
        stageLessonFromPreview(true);
        requestDashboardRefresh();
    } catch (e) {
        adminState.ingestion.error = 'Failed to parse CSV';
        Logger.error('CSV parse failed', { error: e.message });
        requestDashboardRefresh();
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

function stageLessonFromPreview(skipValidation = false) {
    const { preview, form } = adminState.ingestion;
    if (!preview || !preview.rows?.length) {
        adminState.ingestion.error = 'Upload a CSV before staging a lesson.';
        requestDashboardRefresh();
        return;
    }

    if (!skipValidation) {
        const validation = validateCSV(preview.rows, preview.columns || []);
        if (!validation.valid) {
            adminState.ingestion.error = `CSV validation failed: ${validation.errors[0]}`;
            Logger.error('CSV staging blocked by validation', { errors: validation.errors });
            requestDashboardRefresh();
            return;
        }
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
    Logger.info('Admin staged lesson package', { lessonId: metadata.id, rows: preview.rows.length });
    requestDashboardRefresh();
}

function clearStagedLessons() {
    adminState.ingestion.staged = [];
    adminState.ingestion.preview = null;
    adminState.ingestion.form = { ...DEFAULT_INGESTION_FORM };
    adminState.ingestion.error = null;
    saveIngestionState();
    refreshDashboard();
}

function validateCSV(rows, columns = []) {
    const errors = [];
    if (!rows || rows.length === 0) {
        errors.push('CSV contains no rows');
        return { valid: false, errors };
    }

    const cols = columns.length ? columns : Object.keys(rows[0]);
    const missingColumns = REQUIRED_CSV_COLUMNS.filter(col => !cols.includes(col));
    if (missingColumns.length) {
        errors.push(`Missing required columns: ${missingColumns.join(', ')}`);
    }

    rows.forEach((row, idx) => {
        const missing = REQUIRED_CSV_COLUMNS.filter(col => !row[col] || String(row[col]).trim() === '');
        if (missing.length) {
            errors.push(`Row ${idx + 1} missing: ${missing.join(', ')}`);
        }
    });

    const wordIds = new Set();
    rows.forEach((row, idx) => {
        const id = String(row.word_id || '').trim();
        if (id) {
            if (wordIds.has(id)) {
                errors.push(`Duplicate word_id detected: ${id} (row ${idx + 1})`);
            } else {
                wordIds.add(id);
            }
        }
    });

    return { valid: errors.length === 0, errors };
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

            ${renderImageManagement()}

            <!-- AI Image Curator Console -->
            <div id="imageCuratorContainer">
                ${renderImageCuratorConsole()}
            </div>

            <!-- API Key Management -->
            <div id="apiKeyManagerContainer" class="admin-panel">
                ${renderAPIKeyManager()}
            </div>

            ${renderLessonEditor()}

            <div class="admin-grid">
                <!-- User List Panel -->
                <section class="admin-panel user-list-panel collapsible ${isPanelCollapsed('user-list') ? 'collapsed' : ''}" data-panel-id="user-list">
                    <div class="panel-header">
                        <h3>👥 Users (${users.length})</h3>
                    </div>
                    <div class="panel-content">
                        <div class="user-list">
                            ${users.map(user => renderUserCard(user)).join('')}
                        </div>
                    </div>
                </section>

                <!-- Global Event Log (ALL users) -->
                <section class="admin-panel global-events-panel collapsible ${isPanelCollapsed('global-events') ? 'collapsed' : ''}" data-panel-id="global-events">
                    <div class="panel-header">
                        <h3>📊 Global Event Log (All Users)</h3>
                    </div>
                    <div class="panel-content">
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
                    </div>
                </section>

                <!-- AI Activity Feed -->
                <section class="admin-panel activity-panel collapsible ${isPanelCollapsed('ai-activity') ? 'collapsed' : ''}" data-panel-id="ai-activity">
                    <div class="panel-header">
                        <h3>🤖 AI Activity Feed</h3>
                    </div>
                    <div class="panel-content">
                        <div class="activity-feed">
                            ${recentActions.length === 0 ?
                                '<p class="muted">No recent AI activity</p>' :
                                recentActions.slice(0, 50).map(a => renderActionEntry(a)).join('')
                            }
                        </div>
                    </div>
                </section>

                <!-- Stats Panel -->
                <section class="admin-panel stats-panel collapsible ${isPanelCollapsed('stats') ? 'collapsed' : ''}" data-panel-id="stats">
                    <div class="panel-header">
                        <h3>📊 Quick Stats</h3>
                    </div>
                    <div class="panel-content">
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
                <section class="admin-panel logs-panel collapsible ${isPanelCollapsed('logs') ? 'collapsed' : ''}" data-panel-id="logs">
                    <div class="panel-header">
                        <h3>📜 Recent Logs (All Users)</h3>
                    </div>
                    <div class="panel-content">
                        <div class="activity-feed">
                            ${renderLoggerHistory()}
                        </div>
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
    const collapsed = isPanelCollapsed('ai-controls') ? 'collapsed' : '';

    return `
        <section class="admin-panel ai-controls-panel collapsible ${collapsed}" data-panel-id="ai-controls">
            <div class="panel-header">
                <div>
                    <h3>🤖 AI Controls</h3>
                    <p class="muted small-text">Model registry, runtime status, and tutor levers.</p>
                </div>
                <div class="panel-actions">
                    <button onclick="window.adminDashboard.refreshAIStatus()" class="btn-small">🔄 Check Ollama</button>
                </div>
            </div>
            <div class="panel-content">
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
            </div>
        </section>
    `;
}

/**
 * Render Image Management Panel
 * Shows image coverage stats for all lessons and highlights missing/unverified images
 */
function renderImageManagement() {
    const imageStats = adminState.imageStats || { total: 0, withImages: 0, withoutImages: 0, coverage: 0 };
    const missingImages = adminState.missingImages || [];
    const unverifiedImages = adminState.unverifiedImages || [];
    const collapsed = isPanelCollapsed('image-management') ? 'collapsed' : '';
    
    return `
        <section class="admin-panel image-management-panel collapsible ${collapsed}" data-panel-id="image-management">
            <div class="panel-header">
                <div>
                    <h3>🖼️ Image Management</h3>
                    <p class="muted small-text">Curated images only - no dynamic lookup. All vocabulary needs explicit image_url.</p>
                </div>
                <div class="panel-actions">
                    <button onclick="window.adminDashboard.scanImageCoverage()" class="btn-small">🔄 Scan All Lessons</button>
                    <button onclick="window.adminDashboard.exportMissingImages()" class="btn-small">📋 Export Missing</button>
                </div>
            </div>
            <div class="panel-content">
                <div class="image-stats-grid">
                    <div class="stat-card ${imageStats.coverage >= 80 ? 'stat-good' : imageStats.coverage >= 50 ? 'stat-warning' : 'stat-danger'}">
                        <div class="stat-number">${imageStats.coverage}%</div>
                        <div class="stat-label">Coverage</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-number">${imageStats.total}</div>
                        <div class="stat-label">Total Words</div>
                    </div>
                    <div class="stat-card stat-good">
                        <div class="stat-number">${imageStats.withImages}</div>
                        <div class="stat-label">With Images</div>
                    </div>
                    <div class="stat-card ${imageStats.withoutImages > 0 ? 'stat-danger' : ''}">
                        <div class="stat-number">${imageStats.withoutImages}</div>
                        <div class="stat-label">Missing Images</div>
                    </div>
                </div>
                
                ${missingImages.length > 0 ? `
                    <div class="missing-images-section">
                        <h4>⚠️ Words Missing Images (${missingImages.length})</h4>
                        <div class="missing-images-list">
                            ${missingImages.slice(0, 20).map(word => `
                                <div class="missing-image-item">
                                    <span class="word-pt">${sanitize(word.pt)}</span>
                                    <span class="word-en">${sanitize(word.en)}</span>
                                    <span class="word-lesson">${sanitize(word.lessonId || 'unknown')}</span>
                                </div>
                            `).join('')}
                            ${missingImages.length > 20 ? `<p class="muted">... and ${missingImages.length - 20} more</p>` : ''}
                        </div>
                    </div>
                ` : ''}
                
                <div class="image-help-text">
                    <p class="muted small-text">
                        📌 To add images: Edit CSV files directly, adding <code>image_url</code> column with full Unsplash URLs.<br>
                        📌 Required format: <code>https://images.unsplash.com/photo-{ID}?w=400&h=300&fit=crop</code><br>
                        📌 Words without valid image_url will show placeholder and may be skipped from lessons.
                    </p>
                </div>
            </div>
        </section>
    `;
}

function renderLessonIngestion() {
    const { form, preview, staged, error } = adminState.ingestion;
    const collapsed = isPanelCollapsed('lesson-ingestion') ? 'collapsed' : '';
    return `
        <section class="admin-panel ingestion-panel collapsible ${collapsed}" data-panel-id="lesson-ingestion">
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
            <div class="panel-content">
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
            </div>
        </section>
    `;
}

function renderLessonEditor() {
    const editor = adminState.lessonEditor;
    const categories = Object.keys(editor.categories || {});
    const lessons = editor.lessons || [];
    const meta = editor.meta || {};
    const columns = editor.csv.columns.length ? editor.csv.columns : DEFAULT_LESSON_COLUMNS;
    const collapsed = isPanelCollapsed('lesson-editor') ? 'collapsed' : '';

    const lessonSelect = lessons.length ? `
        <select onchange="window.adminDashboard.selectLessonForEdit(this.value)">
            <option value="">Select lesson…</option>
            ${lessons.map(l => `<option value="${sanitize(l.id)}" ${l.id === editor.selectedLessonId ? 'selected' : ''}>${sanitize(l.id)} — ${sanitize(l.title || '')}</option>`).join('')}
        </select>
    ` : '<span class="muted">No lessons loaded yet.</span>';

    const metaForm = editor.meta ? `
        <div class="admin-form-grid lesson-meta-grid">
            <label><span>Subject name (EN)</span><input value="${sanitize(meta.title || '')}" oninput="window.adminDashboard.updateLessonMetaField('title', this.value)" /></label>
            <label><span>Subject name (PT)</span><input value="${sanitize(meta.titlePt || '')}" oninput="window.adminDashboard.updateLessonMetaField('titlePt', this.value)" /></label>
            <label class="span-2"><span>Description</span><textarea rows="2" oninput="window.adminDashboard.updateLessonMetaField('description', this.value)">${sanitize(meta.description || '')}</textarea></label>
            <label><span>Lesson type</span>
                <select onchange="window.adminDashboard.updateLessonMetaField('category', this.value)">
                    ${categories.map(cat => `<option value="${sanitize(cat)}" ${cat === meta.category ? 'selected' : ''}>${sanitize(cat)}</option>`).join('')}
                    ${categories.includes(meta.category) ? '' : `<option value="${sanitize(meta.category || '')}" selected>${sanitize(meta.category || '')}</option>`}
                </select>
            </label>
            <label><span>Tier</span><input type="number" min="1" max="5" value="${meta.tier || 1}" oninput="window.adminDashboard.updateLessonMetaField('tier', Number(this.value))" /></label>
            <label><span>Order</span><input type="number" min="1" value="${meta.order || 1}" oninput="window.adminDashboard.updateLessonMetaField('order', Number(this.value))" /></label>
            <label><span>Icon</span><input value="${sanitize(meta.icon || '')}" oninput="window.adminDashboard.updateLessonMetaField('icon', this.value)" /></label>
            <label><span>Estimated minutes</span><input type="number" min="5" max="60" value="${meta.estimatedMinutes || 10}" oninput="window.adminDashboard.updateLessonMetaField('estimatedMinutes', Number(this.value))" /></label>
            <label><span>Difficulty levels</span><input value="${sanitize((meta.difficultyLevels || []).join(', '))}" oninput="window.adminDashboard.updateLessonMetaField('difficultyLevels', this.value.split(',').map(v => v.trim()).filter(Boolean))" placeholder="beginner_1, beginner_2" /></label>
            <label><span>CSV file</span><input value="${sanitize(meta.csvFile || '')}" disabled /></label>
            <label class="span-2">
                <span>Lesson image</span>
                <div class="lesson-image-row">
                    <input value="${sanitize(meta.image || '')}" oninput="window.adminDashboard.updateLessonMetaField('image', this.value)" />
                    <label class="btn-small file-input-btn">
                        📁 Upload
                        <input type="file" accept="image/*" style="display:none" onchange="window.adminDashboard.uploadLessonImage(this)" />
                    </label>
                </div>
                <small class="muted">Uploads save to assets/lesson-thumbs; existing image references stay untouched.</small>
            </label>
        </div>
    ` : '<p class="muted">Select a lesson to edit metadata.</p>';

    const rowsTable = editor.csv.rows.length ? editor.csv.rows.map((row, idx) => renderLessonRow(row, idx)).join('') : '<p class="muted">Select a lesson to load its CSV rows.</p>';

    return `
        <section class="admin-panel lesson-editor-panel collapsible ${collapsed}" data-panel-id="lesson-editor">
            <div class="panel-header">
                <div>
                    <h3>🗂️ Lesson Editor (CSV + metadata)</h3>
                    <p class="muted small-text">Edit questions, answers, incorrect options, metadata, and upload replacement images.</p>
                </div>
                <div class="panel-actions">
                    <button class="btn-small" onclick="window.adminDashboard.loadLessonEditorIndex()">🔍 Load lessons</button>
                    ${lessonSelect}
                </div>
            </div>
            <div class="panel-content">
                ${editor.loading ? '<p class="muted">Loading lesson data…</p>' : ''}
                ${editor.error ? `<p class="error-text">${sanitize(editor.error)}</p>` : ''}
                ${editor.message ? `<p class="success-text">${sanitize(editor.message)}</p>` : ''}
                ${metaForm}
                <div class="lesson-editor-actions">
                    <button class="btn-small" onclick="window.adminDashboard.addLessonRow()">➕ Add row</button>
                    <button class="btn-small btn-primary" onclick="window.adminDashboard.saveLessonEditorChanges()" ${editor.saving || !editor.selectedLessonId ? 'disabled' : ''}>💾 Save changes</button>
                </div>
                <div class="lesson-rows">
                    ${rowsTable}
                </div>
            </div>
        </section>
    `;
}

function renderLessonRow(row, index) {
    return `
        <div class="lesson-row" data-row-index="${index}">
            <div class="lesson-row-fields">
                <label><span>Word ID</span><input value="${sanitize(row.word_id || '')}" oninput="window.adminDashboard.updateLessonRow(${index}, 'word_id', this.value)" /></label>
                <label><span>Question (PT)</span><input value="${sanitize(row.portuguese || '')}" oninput="window.adminDashboard.updateLessonRow(${index}, 'portuguese', this.value)" /></label>
                <label><span>Answer (EN)</span><input value="${sanitize(row.english || '')}" oninput="window.adminDashboard.updateLessonRow(${index}, 'english', this.value)" /></label>
                <label><span>Incorrect answers</span><input value="${sanitize(row.incorrect_answers || '')}" oninput="window.adminDashboard.updateLessonRow(${index}, 'incorrect_answers', this.value)" placeholder="comma-separated distractors" /></label>
                <label><span>Type</span><input value="${sanitize(row.type || '')}" oninput="window.adminDashboard.updateLessonRow(${index}, 'type', this.value)" /></label>
                <label><span>Difficulty</span><input value="${sanitize(row.difficulty || '')}" oninput="window.adminDashboard.updateLessonRow(${index}, 'difficulty', this.value)" /></label>
            </div>
            <div class="lesson-row-actions">
                <button class="btn-small btn-secondary" onclick="window.adminDashboard.removeLessonRow(${index})">🗑️ Remove</button>
            </div>
        </div>
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
    const progress = user.progress || {};
    const inProgress = progress.inProgress;
    const latestBackupId = getLatestBackupId(user.userId);

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
            <div class="user-stats">
                <span title="Completed lessons">📚 ${progress.totalLessons || 0}</span>
                <span title="Avg accuracy">🎯 ${progress.averageAccuracy ?? '—'}%</span>
                <span title="Learned words">🧠 ${progress.learnedWords || 0}</span>
            </div>
            ${inProgress ? `
                <div class="user-progress-bar" title="In-progress lesson ${inProgress.lessonId}">
                    <div class="user-progress-fill" style="width:${inProgress.percent}%"></div>
                    <span>${inProgress.percent}% in ${inProgress.lessonId}</span>
                </div>
            ` : ''}
            <div class="user-actions">
                ${!isCurrentUser && !adminState.isImpersonating ? `
                    <button onclick="window.adminDashboard.impersonateUser('${user.userId}')" class="btn-small btn-secondary" title="Log in as this user">🔑 Login as</button>
                ` : ''}
                <button onclick="window.adminDashboard.viewUserActions('${user.userId}')" class="btn-small" title="View AI actions">📋 Actions</button>
                ${!user.isAdmin ? `
                    <button onclick="window.adminDashboard.deleteUserWithBackup('${user.userId}')" class="btn-small btn-danger" title="Backup then delete user">🗑️ Delete</button>
                    ${latestBackupId ? `<button onclick="window.adminDashboard.restoreUserFromBackup('${latestBackupId}')" class="btn-small btn-secondary" title="Restore last backup">⏪ Restore</button>` : ''}
                ` : ''}
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

function requestDashboardRefresh(delay = 250) {
    if (refreshTimer) {
        clearTimeout(refreshTimer);
    }
    refreshTimer = setTimeout(() => {
        refreshTimer = null;
        refreshDashboard();
    }, delay);
}

/**
 * Refresh the dashboard display
 */
export function refreshDashboard() {
    const container = document.getElementById('adminDashboardContainer');
    if (container) {
        container.innerHTML = renderAdminDashboard();
        // Re-initialize sub-components after re-render
        initImageCuratorConsole();
        initAPIKeyManager();
        // Re-initialize collapsible panels (event listener is lost on re-render)
        initCollapsiblePanels();
        // Re-apply collapsed states after re-render
        applyCollapsedStates();
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
    loadLessonEditorIndex();
    loadPanelCollapsedState();

    // Kick off AI status check without blocking render
    refreshAIStatus();

    // Initialize collapsible panels after a short delay to allow DOM to render
    setTimeout(() => {
        initCollapsiblePanels();
    }, 100);

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

        // Refresh soon after learning events to surface real-time progress
        requestDashboardRefresh(200);
    });

    // Start auto-refresh if admin
    if (isAdmin()) {
        startAutoRefresh();
        // Initialize image curator console
        initImageCuratorConsole();
        // Initialize API key manager
        initAPIKeyManager();
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
        clearStagedLessons,
        loadLessonEditorIndex,
        selectLessonForEdit,
        updateLessonMetaField,
        updateLessonRow,
        addLessonRow,
        removeLessonRow,
        uploadLessonImage,
        saveLessonEditorChanges,
        deleteUserWithBackup,
        restoreUserFromBackup,
        // Image management functions
        scanImageCoverage,
        exportMissingImages,
        // Panel collapse functions
        togglePanelCollapsed
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