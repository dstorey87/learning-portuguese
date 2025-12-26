/**
 * Logger Unit Tests
 * 
 * Comprehensive tests for logging service:
 * - Configuration constants
 * - Core logging functions
 * - Contextual logging
 * - Performance timing
 * - History management
 * - Special logging features
 * 
 * @module tests/unit/logger.test
 */

import { test, expect } from '@playwright/test';

const TEST_PORT = 4321;
const BASE_URL = `http://localhost:${TEST_PORT}`;

// ============================================================================
// CONFIGURATION TESTS
// ============================================================================

test.describe('Logger: Configuration', () => {
    test('LOG_LEVELS has correct numeric values', async ({ page }) => {
        await page.goto(BASE_URL);
        
        const levels = await page.evaluate(async () => {
            const { LOG_LEVELS } = await import('/src/services/Logger.js');
            return LOG_LEVELS;
        });
        
        expect(levels.DEBUG).toBe(0);
        expect(levels.INFO).toBe(1);
        expect(levels.WARN).toBe(2);
        expect(levels.ERROR).toBe(3);
        expect(levels.NONE).toBe(4);
    });
    
    test('LOGGER_CONFIG has correct defaults', async ({ page }) => {
        await page.goto(BASE_URL);
        
        const config = await page.evaluate(async () => {
            const { LOGGER_CONFIG } = await import('/src/services/Logger.js');
            return LOGGER_CONFIG;
        });
        
        expect(config.maxHistorySize).toBe(500);
        expect(config.enableConsole).toBe(true);
        expect(config.enableHistory).toBe(true);
        expect(config.timestampFormat).toBe('HH:mm:ss.SSS');
        expect(config.defaultLevel).toBe(1); // INFO
    });
});

// ============================================================================
// CORE LOGGING TESTS
// ============================================================================

test.describe('Logger: Core Logging', () => {
    test('debug logs at debug level', async ({ page }) => {
        await page.goto(BASE_URL);
        
        const result = await page.evaluate(async () => {
            const { debug, setLevel, LOG_LEVELS, clearHistory, getHistory } = 
                await import('/src/services/Logger.js');
            clearHistory();
            setLevel(LOG_LEVELS.DEBUG);
            debug('Test debug message');
            return getHistory({ limit: 1 });
        });
        
        expect(result.length).toBe(1);
        expect(result[0].levelLabel).toBe('DEBUG');
        expect(result[0].message).toContain('Test debug message');
    });
    
    test('info logs at info level', async ({ page }) => {
        await page.goto(BASE_URL);
        
        const result = await page.evaluate(async () => {
            const { info, clearHistory, getHistory } = await import('/src/services/Logger.js');
            clearHistory();
            info('Test info message');
            return getHistory({ limit: 1 });
        });
        
        expect(result.length).toBe(1);
        expect(result[0].levelLabel).toBe('INFO');
    });
    
    test('warn logs at warn level', async ({ page }) => {
        await page.goto(BASE_URL);
        
        const result = await page.evaluate(async () => {
            const { warn, clearHistory, getHistory } = await import('/src/services/Logger.js');
            clearHistory();
            warn('Test warning');
            return getHistory({ limit: 1 });
        });
        
        expect(result.length).toBe(1);
        expect(result[0].levelLabel).toBe('WARN');
    });
    
    test('error logs at error level', async ({ page }) => {
        await page.goto(BASE_URL);
        
        const result = await page.evaluate(async () => {
            const { error, clearHistory, getHistory } = await import('/src/services/Logger.js');
            clearHistory();
            error('Test error');
            return getHistory({ limit: 1 });
        });
        
        expect(result.length).toBe(1);
        expect(result[0].levelLabel).toBe('ERROR');
    });
    
    test('logs with multiple arguments', async ({ page }) => {
        await page.goto(BASE_URL);
        
        const result = await page.evaluate(async () => {
            const { info, clearHistory, getHistory } = await import('/src/services/Logger.js');
            clearHistory();
            info('Message', 123, { key: 'value' });
            return getHistory({ limit: 1 });
        });
        
        expect(result[0].args.length).toBe(3);
        expect(result[0].message).toContain('Message');
        expect(result[0].message).toContain('123');
    });
    
    test('log level filtering works', async ({ page }) => {
        await page.goto(BASE_URL);
        
        const result = await page.evaluate(async () => {
            const { debug, info, setLevel, LOG_LEVELS, clearHistory, getHistory } = 
                await import('/src/services/Logger.js');
            clearHistory();
            setLevel(LOG_LEVELS.INFO); // Should filter out DEBUG
            debug('Should not appear');
            info('Should appear');
            return getHistory();
        });
        
        expect(result.length).toBe(1);
        expect(result[0].levelLabel).toBe('INFO');
    });
});

// ============================================================================
// CONTEXTUAL LOGGING TESTS
// ============================================================================

test.describe('Logger: Contextual Logging', () => {
    test('createLogger creates logger with context', async ({ page }) => {
        await page.goto(BASE_URL);
        
        const result = await page.evaluate(async () => {
            const { createLogger, clearHistory, getHistory } = await import('/src/services/Logger.js');
            clearHistory();
            const logger = createLogger('TestModule');
            logger.info('Context message');
            return getHistory({ limit: 1 });
        });
        
        expect(result[0].context).toBe('TestModule');
        expect(result[0].prefix).toBe('[TestModule]');
    });
    
    test('createLogger has all log methods', async ({ page }) => {
        await page.goto(BASE_URL);
        
        const methods = await page.evaluate(async () => {
            const { createLogger } = await import('/src/services/Logger.js');
            const logger = createLogger('Test');
            return {
                hasDebug: typeof logger.debug === 'function',
                hasInfo: typeof logger.info === 'function',
                hasWarn: typeof logger.warn === 'function',
                hasError: typeof logger.error === 'function',
                hasTime: typeof logger.time === 'function',
                hasTimeEnd: typeof logger.timeEnd === 'function',
                hasGroup: typeof logger.group === 'function',
                hasGroupEnd: typeof logger.groupEnd === 'function'
            };
        });
        
        expect(methods.hasDebug).toBe(true);
        expect(methods.hasInfo).toBe(true);
        expect(methods.hasWarn).toBe(true);
        expect(methods.hasError).toBe(true);
        expect(methods.hasTime).toBe(true);
        expect(methods.hasTimeEnd).toBe(true);
    });
    
    test('setContext sets global context', async ({ page }) => {
        await page.goto(BASE_URL);
        
        const result = await page.evaluate(async () => {
            const { info, setContext, clearContext, clearHistory, getHistory } = 
                await import('/src/services/Logger.js');
            clearHistory();
            setContext('GlobalContext');
            info('With context');
            clearContext();
            info('Without context');
            return getHistory();
        });
        
        expect(result[0].context).toBe('GlobalContext');
        expect(result[1].context).toBeNull();
    });
    
    test('clearContext removes global context', async ({ page }) => {
        await page.goto(BASE_URL);
        
        const result = await page.evaluate(async () => {
            const { info, setContext, clearContext, clearHistory, getHistory } = 
                await import('/src/services/Logger.js');
            clearHistory();
            setContext('Test');
            clearContext();
            info('No context');
            return getHistory({ limit: 1 });
        });
        
        expect(result[0].context).toBeNull();
    });
});

// ============================================================================
// CONFIGURATION CONTROL TESTS
// ============================================================================

test.describe('Logger: Configuration Control', () => {
    test('setLevel changes log level', async ({ page }) => {
        await page.goto(BASE_URL);
        
        const result = await page.evaluate(async () => {
            const { setLevel, getLevel, LOG_LEVELS } = await import('/src/services/Logger.js');
            setLevel(LOG_LEVELS.WARN);
            const level = getLevel();
            setLevel(LOG_LEVELS.INFO); // Reset
            return level;
        });
        
        expect(result).toBe(2); // WARN
    });
    
    test('getLevel returns current level', async ({ page }) => {
        await page.goto(BASE_URL);
        
        const level = await page.evaluate(async () => {
            const { getLevel } = await import('/src/services/Logger.js');
            return getLevel();
        });
        
        expect(typeof level).toBe('number');
    });
    
    test('setConsoleEnabled toggles console output', async ({ page }) => {
        await page.goto(BASE_URL);
        
        const result = await page.evaluate(async () => {
            const { setConsoleEnabled, getStats } = await import('/src/services/Logger.js');
            setConsoleEnabled(false);
            const disabled = getStats().consoleEnabled;
            setConsoleEnabled(true);
            const enabled = getStats().consoleEnabled;
            return { disabled, enabled };
        });
        
        expect(result.disabled).toBe(false);
        expect(result.enabled).toBe(true);
    });
    
    test('setHistoryEnabled toggles history', async ({ page }) => {
        await page.goto(BASE_URL);
        
        const result = await page.evaluate(async () => {
            const { setHistoryEnabled, getStats } = await import('/src/services/Logger.js');
            setHistoryEnabled(false);
            const disabled = getStats().historyEnabled;
            setHistoryEnabled(true);
            const enabled = getStats().historyEnabled;
            return { disabled, enabled };
        });
        
        expect(result.disabled).toBe(false);
        expect(result.enabled).toBe(true);
    });
});

// ============================================================================
// PERFORMANCE TIMING TESTS
// ============================================================================

test.describe('Logger: Performance Timing', () => {
    test('startTimer and endTimer measure time', async ({ page }) => {
        await page.goto(BASE_URL);
        
        const duration = await page.evaluate(async () => {
            const { startTimer, endTimer, setLevel, LOG_LEVELS } = 
                await import('/src/services/Logger.js');
            setLevel(LOG_LEVELS.DEBUG);
            startTimer('test-timer');
            await new Promise(r => setTimeout(r, 50));
            return endTimer('test-timer');
        });
        
        expect(duration).toBeGreaterThanOrEqual(40); // Allow some variance
    });
    
    test('endTimer warns for non-existent timer', async ({ page }) => {
        await page.goto(BASE_URL);
        
        const result = await page.evaluate(async () => {
            const { endTimer, clearHistory, getHistory } = await import('/src/services/Logger.js');
            clearHistory();
            const duration = endTimer('nonexistent-timer');
            return { duration, history: getHistory({ limit: 1 }) };
        });
        
        expect(result.duration).toBe(0);
        expect(result.history[0].levelLabel).toBe('WARN');
    });
    
    test('timeAsync times async function', async ({ page }) => {
        await page.goto(BASE_URL);
        
        const result = await page.evaluate(async () => {
            const { timeAsync, setLevel, LOG_LEVELS } = await import('/src/services/Logger.js');
            setLevel(LOG_LEVELS.DEBUG);
            const value = await timeAsync('async-test', async () => {
                await new Promise(r => setTimeout(r, 30));
                return 'result';
            });
            return value;
        });
        
        expect(result).toBe('result');
    });
    
    test('timeSync times sync function', async ({ page }) => {
        await page.goto(BASE_URL);
        
        const result = await page.evaluate(async () => {
            const { timeSync, setLevel, LOG_LEVELS } = await import('/src/services/Logger.js');
            setLevel(LOG_LEVELS.DEBUG);
            return timeSync('sync-test', () => {
                let sum = 0;
                for (let i = 0; i < 1000; i++) sum += i;
                return sum;
            });
        });
        
        expect(result).toBe(499500);
    });
    
    test('timeAsync handles errors', async ({ page }) => {
        await page.goto(BASE_URL);
        
        const result = await page.evaluate(async () => {
            const { timeAsync, setLevel, LOG_LEVELS } = await import('/src/services/Logger.js');
            setLevel(LOG_LEVELS.DEBUG);
            try {
                await timeAsync('error-test', async () => {
                    throw new Error('Test error');
                });
                return { caught: false };
            } catch (e) {
                return { caught: true, message: e.message };
            }
        });
        
        expect(result.caught).toBe(true);
        expect(result.message).toBe('Test error');
    });
});

// ============================================================================
// HISTORY TESTS
// ============================================================================

test.describe('Logger: History Management', () => {
    test('getHistory returns all logs', async ({ page }) => {
        await page.goto(BASE_URL);
        
        const history = await page.evaluate(async () => {
            const { info, clearHistory, getHistory } = await import('/src/services/Logger.js');
            clearHistory();
            info('First');
            info('Second');
            info('Third');
            return getHistory();
        });
        
        expect(history.length).toBe(3);
    });
    
    test('getHistory filters by level', async ({ page }) => {
        await page.goto(BASE_URL);
        
        const history = await page.evaluate(async () => {
            const { info, warn, error, clearHistory, getHistory, LOG_LEVELS } = 
                await import('/src/services/Logger.js');
            clearHistory();
            info('Info');
            warn('Warning');
            error('Error');
            return getHistory({ level: LOG_LEVELS.WARN });
        });
        
        expect(history.length).toBe(2); // WARN and ERROR
    });
    
    test('getHistory filters by context', async ({ page }) => {
        await page.goto(BASE_URL);
        
        const history = await page.evaluate(async () => {
            const { createLogger, clearHistory, getHistory } = 
                await import('/src/services/Logger.js');
            clearHistory();
            const loggerA = createLogger('ModuleA');
            const loggerB = createLogger('ModuleB');
            loggerA.info('From A');
            loggerB.info('From B');
            loggerA.info('Also from A');
            return getHistory({ context: 'ModuleA' });
        });
        
        expect(history.length).toBe(2);
    });
    
    test('getHistory filters by search', async ({ page }) => {
        await page.goto(BASE_URL);
        
        const history = await page.evaluate(async () => {
            const { info, clearHistory, getHistory } = await import('/src/services/Logger.js');
            clearHistory();
            info('User logged in');
            info('Data loaded');
            info('User logged out');
            return getHistory({ search: 'user' });
        });
        
        expect(history.length).toBe(2);
    });
    
    test('getHistory limits results', async ({ page }) => {
        await page.goto(BASE_URL);
        
        const history = await page.evaluate(async () => {
            const { info, clearHistory, getHistory } = await import('/src/services/Logger.js');
            clearHistory();
            for (let i = 0; i < 10; i++) {
                info(`Message ${i}`);
            }
            return getHistory({ limit: 3 });
        });
        
        expect(history.length).toBe(3);
        // Should get the last 3
        expect(history[2].message).toContain('Message 9');
    });
    
    test('getErrors returns only errors', async ({ page }) => {
        await page.goto(BASE_URL);
        
        const errors = await page.evaluate(async () => {
            const { info, error, clearHistory, getErrors } = await import('/src/services/Logger.js');
            clearHistory();
            info('Info message');
            error('Error 1');
            error('Error 2');
            return getErrors();
        });
        
        expect(errors.length).toBe(2);
        expect(errors.every(e => e.levelLabel === 'ERROR')).toBe(true);
    });
    
    test('getWarnings returns only warnings', async ({ page }) => {
        await page.goto(BASE_URL);
        
        const warnings = await page.evaluate(async () => {
            const { info, warn, error, clearHistory, getWarnings } = 
                await import('/src/services/Logger.js');
            clearHistory();
            info('Info');
            warn('Warning 1');
            warn('Warning 2');
            error('Error');
            return getWarnings();
        });
        
        expect(warnings.length).toBe(2);
        expect(warnings.every(w => w.levelLabel === 'WARN')).toBe(true);
    });
    
    test('clearHistory removes all logs', async ({ page }) => {
        await page.goto(BASE_URL);
        
        const result = await page.evaluate(async () => {
            const { info, clearHistory, getHistory } = await import('/src/services/Logger.js');
            info('Message');
            clearHistory();
            return getHistory();
        });
        
        expect(result.length).toBe(0);
    });
    
    test('exportHistory returns formatted string', async ({ page }) => {
        await page.goto(BASE_URL);
        
        const exported = await page.evaluate(async () => {
            const { info, clearHistory, exportHistory } = await import('/src/services/Logger.js');
            clearHistory();
            info('Test message');
            return exportHistory();
        });
        
        expect(exported).toContain('[INFO]');
        expect(exported).toContain('Test message');
    });
    
    test('history is limited to maxHistorySize', async ({ page }) => {
        await page.goto(BASE_URL);
        
        const result = await page.evaluate(async () => {
            const { info, clearHistory, getHistory, LOGGER_CONFIG } = 
                await import('/src/services/Logger.js');
            clearHistory();
            // Log more than max
            for (let i = 0; i < LOGGER_CONFIG.maxHistorySize + 50; i++) {
                info(`Message ${i}`);
            }
            return {
                count: getHistory().length,
                max: LOGGER_CONFIG.maxHistorySize
            };
        });
        
        expect(result.count).toBeLessThanOrEqual(result.max);
    });
});

// ============================================================================
// SPECIAL LOGGING TESTS
// ============================================================================

test.describe('Logger: Special Features', () => {
    test('isDebugEnabled returns correct value', async ({ page }) => {
        await page.goto(BASE_URL);
        
        const result = await page.evaluate(async () => {
            const { setLevel, LOG_LEVELS, isDebugEnabled } = await import('/src/services/Logger.js');
            setLevel(LOG_LEVELS.DEBUG);
            const enabled = isDebugEnabled();
            setLevel(LOG_LEVELS.INFO);
            const disabled = isDebugEnabled();
            return { enabled, disabled };
        });
        
        expect(result.enabled).toBe(true);
        expect(result.disabled).toBe(false);
    });
    
    test('getStats returns statistics', async ({ page }) => {
        await page.goto(BASE_URL);
        
        const stats = await page.evaluate(async () => {
            const { info, warn, error, clearHistory, getStats } = 
                await import('/src/services/Logger.js');
            clearHistory();
            info('Info 1');
            info('Info 2');
            warn('Warn');
            error('Error');
            return getStats();
        });
        
        expect(stats.totalLogs).toBe(4);
        expect(stats.counts.info).toBe(2);
        expect(stats.counts.warn).toBe(1);
        expect(stats.counts.error).toBe(1);
        expect(stats.consoleEnabled).toBeDefined();
        expect(stats.historyEnabled).toBeDefined();
    });
    
    test('assert logs error on failure', async ({ page }) => {
        await page.goto(BASE_URL);
        
        const result = await page.evaluate(async () => {
            const { assert, clearHistory, getHistory } = await import('/src/services/Logger.js');
            clearHistory();
            assert(true, 'Should not log');
            assert(false, 'Assertion failed!');
            return getHistory();
        });
        
        expect(result.length).toBe(1);
        expect(result[0].levelLabel).toBe('ERROR');
        expect(result[0].message).toContain('Assertion failed');
    });
    
    test('logObject logs object data', async ({ page }) => {
        await page.goto(BASE_URL);
        
        // logObject uses console.dir which doesn't add to history
        // Just verify it doesn't throw
        const result = await page.evaluate(async () => {
            const { logObject, setLevel, LOG_LEVELS } = await import('/src/services/Logger.js');
            setLevel(LOG_LEVELS.DEBUG);
            try {
                logObject('Test Object', { key: 'value' });
                return { success: true };
            } catch (e) {
                return { success: false, error: e.message };
            }
        });
        
        expect(result.success).toBe(true);
    });
    
    test('logTable handles array data', async ({ page }) => {
        await page.goto(BASE_URL);
        
        const result = await page.evaluate(async () => {
            const { logTable, setLevel, LOG_LEVELS } = await import('/src/services/Logger.js');
            setLevel(LOG_LEVELS.DEBUG);
            try {
                logTable([{ a: 1 }, { a: 2 }]);
                return { success: true };
            } catch (e) {
                return { success: false, error: e.message };
            }
        });
        
        expect(result.success).toBe(true);
    });
});

// ============================================================================
// GROUPING TESTS
// ============================================================================

test.describe('Logger: Grouping', () => {
    test('groupStart and groupEnd work', async ({ page }) => {
        await page.goto(BASE_URL);
        
        const result = await page.evaluate(async () => {
            const { groupStart, groupEnd, info } = await import('/src/services/Logger.js');
            try {
                groupStart('Test Group');
                info('Inside group');
                groupEnd();
                return { success: true };
            } catch (e) {
                return { success: false, error: e.message };
            }
        });
        
        expect(result.success).toBe(true);
    });
    
    test('groupStartCollapsed works', async ({ page }) => {
        await page.goto(BASE_URL);
        
        const result = await page.evaluate(async () => {
            const { groupStartCollapsed, groupEnd, info } = await import('/src/services/Logger.js');
            try {
                groupStartCollapsed('Collapsed Group');
                info('Inside collapsed');
                groupEnd();
                return { success: true };
            } catch (e) {
                return { success: false, error: e.message };
            }
        });
        
        expect(result.success).toBe(true);
    });
});

// ============================================================================
// DEFAULT EXPORT TESTS
// ============================================================================

test.describe('Logger: Default Export', () => {
    test('default export includes all public functions', async ({ page }) => {
        await page.goto(BASE_URL);
        
        const exports = await page.evaluate(async () => {
            const Logger = (await import('/src/services/Logger.js')).default;
            return Object.keys(Logger);
        });
        
        expect(exports).toContain('LOG_LEVELS');
        expect(exports).toContain('LOGGER_CONFIG');
        expect(exports).toContain('debug');
        expect(exports).toContain('info');
        expect(exports).toContain('warn');
        expect(exports).toContain('error');
        expect(exports).toContain('createLogger');
        expect(exports).toContain('setContext');
        expect(exports).toContain('clearContext');
        expect(exports).toContain('setLevel');
        expect(exports).toContain('getLevel');
        expect(exports).toContain('setConsoleEnabled');
        expect(exports).toContain('setHistoryEnabled');
        expect(exports).toContain('startTimer');
        expect(exports).toContain('endTimer');
        expect(exports).toContain('timeAsync');
        expect(exports).toContain('timeSync');
        expect(exports).toContain('groupStart');
        expect(exports).toContain('groupStartCollapsed');
        expect(exports).toContain('groupEnd');
        expect(exports).toContain('getHistory');
        expect(exports).toContain('getErrors');
        expect(exports).toContain('getWarnings');
        expect(exports).toContain('clearHistory');
        expect(exports).toContain('exportHistory');
        expect(exports).toContain('logObject');
        expect(exports).toContain('logTable');
        expect(exports).toContain('trace');
        expect(exports).toContain('assert');
        expect(exports).toContain('isDebugEnabled');
        expect(exports).toContain('getStats');
    });
});
