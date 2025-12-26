/**
 * Logger Service
 * 
 * Provides structured logging with:
 * - Log levels (debug, info, warn, error)
 * - Contextual prefixes
 * - Console output with styling
 * - Log history for debugging
 * - Performance timing
 * 
 * @module services/Logger
 */

// ============================================================================
// CONFIGURATION
// ============================================================================

/**
 * Log levels
 */
export const LOG_LEVELS = {
    DEBUG: 0,
    INFO: 1,
    WARN: 2,
    ERROR: 3,
    NONE: 4
};

/**
 * Logger configuration
 */
export const LOGGER_CONFIG = {
    maxHistorySize: 500,
    enableConsole: true,
    enableHistory: true,
    timestampFormat: 'HH:mm:ss.SSS',
    defaultLevel: LOG_LEVELS.INFO
};

/**
 * Log level colors for console styling
 */
const LEVEL_STYLES = {
    [LOG_LEVELS.DEBUG]: 'color: #9E9E9E',
    [LOG_LEVELS.INFO]: 'color: #2196F3',
    [LOG_LEVELS.WARN]: 'color: #FF9800; font-weight: bold',
    [LOG_LEVELS.ERROR]: 'color: #F44336; font-weight: bold'
};

/**
 * Log level labels
 */
const LEVEL_LABELS = {
    [LOG_LEVELS.DEBUG]: 'DEBUG',
    [LOG_LEVELS.INFO]: 'INFO',
    [LOG_LEVELS.WARN]: 'WARN',
    [LOG_LEVELS.ERROR]: 'ERROR'
};

// ============================================================================
// STATE
// ============================================================================

let state = {
    level: LOGGER_CONFIG.defaultLevel,
    history: [],
    enableConsole: LOGGER_CONFIG.enableConsole,
    enableHistory: LOGGER_CONFIG.enableHistory,
    timers: {},
    contextPrefix: null
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Format timestamp
 * @returns {string} Formatted timestamp
 */
function formatTimestamp() {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    const ms = String(now.getMilliseconds()).padStart(3, '0');
    return `${hours}:${minutes}:${seconds}.${ms}`;
}

/**
 * Format log message
 * @param {number} level - Log level
 * @param {string} context - Context prefix
 * @param {Array} args - Log arguments
 * @returns {Object} Formatted log entry
 */
function formatLogEntry(level, context, args) {
    const timestamp = formatTimestamp();
    const levelLabel = LEVEL_LABELS[level];
    const prefix = context ? `[${context}]` : '';
    
    return {
        timestamp,
        level,
        levelLabel,
        context,
        prefix,
        args,
        message: args.map(arg => {
            if (typeof arg === 'object') {
                try {
                    return JSON.stringify(arg);
                } catch (e) {
                    return String(arg);
                }
            }
            return String(arg);
        }).join(' ')
    };
}

/**
 * Add to history
 * @param {Object} entry - Log entry
 */
function addToHistory(entry) {
    if (!state.enableHistory) return;
    
    state.history.push(entry);
    
    // Trim history if too large
    if (state.history.length > LOGGER_CONFIG.maxHistorySize) {
        state.history = state.history.slice(-LOGGER_CONFIG.maxHistorySize);
    }
}

/**
 * Output to console
 * @param {Object} entry - Log entry
 */
function outputToConsole(entry) {
    if (!state.enableConsole) return;
    
    const style = LEVEL_STYLES[entry.level];
    const formattedPrefix = `%c[${entry.timestamp}] [${entry.levelLabel}]${entry.prefix ? ' ' + entry.prefix : ''}`;
    
    switch (entry.level) {
        case LOG_LEVELS.DEBUG:
            console.debug(formattedPrefix, style, ...entry.args);
            break;
        case LOG_LEVELS.INFO:
            console.info(formattedPrefix, style, ...entry.args);
            break;
        case LOG_LEVELS.WARN:
            console.warn(formattedPrefix, style, ...entry.args);
            break;
        case LOG_LEVELS.ERROR:
            console.error(formattedPrefix, style, ...entry.args);
            break;
        default:
            console.log(formattedPrefix, style, ...entry.args);
    }
}

// ============================================================================
// CORE LOGGING FUNCTIONS
// ============================================================================

/**
 * Log message at specified level
 * @param {number} level - Log level
 * @param {string} context - Context prefix
 * @param {...*} args - Log arguments
 */
function log(level, context, ...args) {
    if (level < state.level) return;
    
    const entry = formatLogEntry(level, context, args);
    addToHistory(entry);
    outputToConsole(entry);
}

/**
 * Debug level log
 * @param {...*} args - Log arguments
 */
export function debug(...args) {
    log(LOG_LEVELS.DEBUG, state.contextPrefix, ...args);
}

/**
 * Info level log
 * @param {...*} args - Log arguments
 */
export function info(...args) {
    log(LOG_LEVELS.INFO, state.contextPrefix, ...args);
}

/**
 * Warning level log
 * @param {...*} args - Log arguments
 */
export function warn(...args) {
    log(LOG_LEVELS.WARN, state.contextPrefix, ...args);
}

/**
 * Error level log
 * @param {...*} args - Log arguments
 */
export function error(...args) {
    log(LOG_LEVELS.ERROR, state.contextPrefix, ...args);
}

// ============================================================================
// CONTEXTUAL LOGGING
// ============================================================================

/**
 * Create a logger with context prefix
 * @param {string} context - Context name
 * @returns {Object} Logger with context
 */
export function createLogger(context) {
    return {
        debug: (...args) => log(LOG_LEVELS.DEBUG, context, ...args),
        info: (...args) => log(LOG_LEVELS.INFO, context, ...args),
        warn: (...args) => log(LOG_LEVELS.WARN, context, ...args),
        error: (...args) => log(LOG_LEVELS.ERROR, context, ...args),
        time: (label) => startTimer(`${context}:${label}`),
        timeEnd: (label) => endTimer(`${context}:${label}`),
        group: (label) => groupStart(`${context}: ${label}`),
        groupEnd: () => groupEnd()
    };
}

/**
 * Set global context prefix
 * @param {string} context - Context prefix
 */
export function setContext(context) {
    state.contextPrefix = context;
}

/**
 * Clear global context prefix
 */
export function clearContext() {
    state.contextPrefix = null;
}

// ============================================================================
// CONFIGURATION
// ============================================================================

/**
 * Set log level
 * @param {number} level - Log level
 */
export function setLevel(level) {
    if (level >= LOG_LEVELS.DEBUG && level <= LOG_LEVELS.NONE) {
        state.level = level;
    }
}

/**
 * Get current log level
 * @returns {number} Log level
 */
export function getLevel() {
    return state.level;
}

/**
 * Enable/disable console output
 * @param {boolean} enabled - Enable console
 */
export function setConsoleEnabled(enabled) {
    state.enableConsole = enabled;
}

/**
 * Enable/disable history
 * @param {boolean} enabled - Enable history
 */
export function setHistoryEnabled(enabled) {
    state.enableHistory = enabled;
}

// ============================================================================
// PERFORMANCE TIMING
// ============================================================================

/**
 * Start performance timer
 * @param {string} label - Timer label
 */
export function startTimer(label) {
    state.timers[label] = performance.now();
}

/**
 * End performance timer and log duration
 * @param {string} label - Timer label
 * @returns {number} Duration in ms
 */
export function endTimer(label) {
    const start = state.timers[label];
    if (start === undefined) {
        warn(`Timer '${label}' does not exist`);
        return 0;
    }
    
    const duration = performance.now() - start;
    delete state.timers[label];
    
    debug(`⏱️ ${label}: ${duration.toFixed(2)}ms`);
    return duration;
}

/**
 * Time an async function
 * @param {string} label - Timer label
 * @param {Function} fn - Function to time
 * @returns {Promise<*>} Function result
 */
export async function timeAsync(label, fn) {
    startTimer(label);
    try {
        const result = await fn();
        endTimer(label);
        return result;
    } catch (err) {
        endTimer(label);
        throw err;
    }
}

/**
 * Time a sync function
 * @param {string} label - Timer label
 * @param {Function} fn - Function to time
 * @returns {*} Function result
 */
export function timeSync(label, fn) {
    startTimer(label);
    try {
        const result = fn();
        endTimer(label);
        return result;
    } catch (err) {
        endTimer(label);
        throw err;
    }
}

// ============================================================================
// GROUPING
// ============================================================================

/**
 * Start console group
 * @param {string} label - Group label
 */
export function groupStart(label) {
    if (state.enableConsole) {
        console.group(label);
    }
}

/**
 * Start collapsed console group
 * @param {string} label - Group label
 */
export function groupStartCollapsed(label) {
    if (state.enableConsole) {
        console.groupCollapsed(label);
    }
}

/**
 * End console group
 */
export function groupEnd() {
    if (state.enableConsole) {
        console.groupEnd();
    }
}

// ============================================================================
// HISTORY
// ============================================================================

/**
 * Get log history
 * @param {Object} options - Filter options
 * @returns {Array} Log history
 */
export function getHistory(options = {}) {
    let history = [...state.history];
    
    if (options.level !== undefined) {
        history = history.filter(entry => entry.level >= options.level);
    }
    
    if (options.context) {
        history = history.filter(entry => entry.context === options.context);
    }
    
    if (options.search) {
        const searchLower = options.search.toLowerCase();
        history = history.filter(entry => 
            entry.message.toLowerCase().includes(searchLower)
        );
    }
    
    if (options.limit) {
        history = history.slice(-options.limit);
    }
    
    return history;
}

/**
 * Get error history
 * @param {number} limit - Max entries
 * @returns {Array} Error logs
 */
export function getErrors(limit = 50) {
    return getHistory({ level: LOG_LEVELS.ERROR, limit });
}

/**
 * Get warnings history
 * @param {number} limit - Max entries
 * @returns {Array} Warning logs
 */
export function getWarnings(limit = 50) {
    return getHistory({ level: LOG_LEVELS.WARN, limit })
        .filter(entry => entry.level === LOG_LEVELS.WARN);
}

/**
 * Clear log history
 */
export function clearHistory() {
    state.history = [];
}

/**
 * Export history as string
 * @returns {string} Log history as text
 */
export function exportHistory() {
    return state.history.map(entry => 
        `[${entry.timestamp}] [${entry.levelLabel}]${entry.prefix ? ' ' + entry.prefix : ''} ${entry.message}`
    ).join('\n');
}

// ============================================================================
// SPECIAL LOGGING
// ============================================================================

/**
 * Log object with formatted JSON
 * @param {string} label - Label for object
 * @param {Object} obj - Object to log
 */
export function logObject(label, obj) {
    if (state.level > LOG_LEVELS.DEBUG) return;
    
    if (state.enableConsole) {
        console.log(`%c${label}:`, 'color: #9C27B0; font-weight: bold');
        console.dir(obj);
    }
}

/**
 * Log table data
 * @param {Array} data - Array of objects
 */
export function logTable(data) {
    if (state.level > LOG_LEVELS.DEBUG) return;
    
    if (state.enableConsole && console.table) {
        console.table(data);
    }
}

/**
 * Log with stack trace
 * @param {...*} args - Log arguments
 */
export function trace(...args) {
    if (state.level > LOG_LEVELS.DEBUG) return;
    
    if (state.enableConsole) {
        console.trace(...args);
    }
}

/**
 * Assert condition and log error if false
 * @param {boolean} condition - Condition to assert
 * @param {...*} args - Log arguments if assertion fails
 */
export function assert(condition, ...args) {
    if (!condition) {
        error('Assertion failed:', ...args);
    }
}

// ============================================================================
// UTILITY EXPORTS
// ============================================================================

/**
 * Check if debug logging is enabled
 * @returns {boolean} True if debug enabled
 */
export function isDebugEnabled() {
    return state.level <= LOG_LEVELS.DEBUG;
}

/**
 * Get logger statistics
 * @returns {Object} Logger stats
 */
export function getStats() {
    const counts = { debug: 0, info: 0, warn: 0, error: 0 };
    
    for (const entry of state.history) {
        switch (entry.level) {
            case LOG_LEVELS.DEBUG: counts.debug++; break;
            case LOG_LEVELS.INFO: counts.info++; break;
            case LOG_LEVELS.WARN: counts.warn++; break;
            case LOG_LEVELS.ERROR: counts.error++; break;
        }
    }
    
    return {
        totalLogs: state.history.length,
        counts,
        activeTimers: Object.keys(state.timers).length,
        currentLevel: LEVEL_LABELS[state.level],
        consoleEnabled: state.enableConsole,
        historyEnabled: state.enableHistory
    };
}

// ============================================================================
// DEFAULT EXPORT
// ============================================================================

export default {
    // Log levels
    LOG_LEVELS,
    LOGGER_CONFIG,
    
    // Core logging
    debug,
    info,
    warn,
    error,
    
    // Contextual
    createLogger,
    setContext,
    clearContext,
    
    // Configuration
    setLevel,
    getLevel,
    setConsoleEnabled,
    setHistoryEnabled,
    
    // Timing
    startTimer,
    endTimer,
    timeAsync,
    timeSync,
    
    // Grouping
    groupStart,
    groupStartCollapsed,
    groupEnd,
    
    // History
    getHistory,
    getErrors,
    getWarnings,
    clearHistory,
    exportHistory,
    
    // Special
    logObject,
    logTable,
    trace,
    assert,
    
    // Utilities
    isDebugEnabled,
    getStats
};
