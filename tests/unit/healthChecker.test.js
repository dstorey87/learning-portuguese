/**
 * HealthChecker Unit Tests
 * 
 * Comprehensive tests for health monitoring:
 * - Configuration constants
 * - Service checks (Ollama, TTS, Whisper, WebSpeech)
 * - UI component checks
 * - Network and performance checks
 * - Full health reports
 * - Graceful degradation
 * 
 * @module tests/unit/healthChecker.test
 */

import { test, expect } from '@playwright/test';

const TEST_PORT = 4321;
const BASE_URL = `http://localhost:${TEST_PORT}`;

// ============================================================================
// CONFIGURATION TESTS
// ============================================================================

test.describe('HealthChecker: Configuration', () => {
    test('HEALTH_STATUS has correct values', async ({ page }) => {
        await page.goto(BASE_URL);
        
        const status = await page.evaluate(async () => {
            const { HEALTH_STATUS } = await import('/src/services/HealthChecker.js');
            return HEALTH_STATUS;
        });
        
        expect(status.HEALTHY).toBe('healthy');
        expect(status.DEGRADED).toBe('degraded');
        expect(status.UNHEALTHY).toBe('unhealthy');
        expect(status.UNKNOWN).toBe('unknown');
    });
    
    test('HEALTH_CONFIG has correct defaults', async ({ page }) => {
        await page.goto(BASE_URL);
        
        const config = await page.evaluate(async () => {
            const { HEALTH_CONFIG } = await import('/src/services/HealthChecker.js');
            return HEALTH_CONFIG;
        });
        
        expect(config.defaultTimeout).toBe(5000);
        expect(config.checkInterval).toBe(30000);
        expect(config.retryAttempts).toBe(2);
        expect(config.retryDelay).toBe(1000);
    });
    
    test('HEALTH_ENDPOINTS has service URLs', async ({ page }) => {
        await page.goto(BASE_URL);
        
        const endpoints = await page.evaluate(async () => {
            const { HEALTH_ENDPOINTS } = await import('/src/services/HealthChecker.js');
            return HEALTH_ENDPOINTS;
        });
        
        expect(endpoints.ollama).toBe('http://localhost:11434');
        expect(endpoints.tts).toBe('http://localhost:5001');
        expect(endpoints.whisper).toBe('http://localhost:5002');
    });
    
    test('HEALTH_EVENTS has event names', async ({ page }) => {
        await page.goto(BASE_URL);
        
        const events = await page.evaluate(async () => {
            const { HEALTH_EVENTS } = await import('/src/services/HealthChecker.js');
            return HEALTH_EVENTS;
        });
        
        expect(events.STATUS_CHANGED).toBe('healthStatusChanged');
        expect(events.SERVICE_DOWN).toBe('healthServiceDown');
        expect(events.SERVICE_RECOVERED).toBe('healthServiceRecovered');
        expect(events.CHECK_COMPLETE).toBe('healthCheckComplete');
    });
});

// ============================================================================
// SERVICE CHECK TESTS
// ============================================================================

test.describe('HealthChecker: Service Checks', () => {
    test('checkOllama returns status object', async ({ page }) => {
        await page.goto(BASE_URL);
        
        const result = await page.evaluate(async () => {
            const { checkOllama, HEALTH_STATUS } = await import('/src/services/HealthChecker.js');
            const status = await checkOllama();
            return {
                hasStatus: status.status !== undefined,
                hasLastCheck: status.lastCheck !== undefined,
                hasResponseTime: status.responseTime !== undefined,
                hasMessage: status.message !== undefined,
                validStatus: Object.values(HEALTH_STATUS).includes(status.status)
            };
        });
        
        expect(result.hasStatus).toBe(true);
        expect(result.hasLastCheck).toBe(true);
        expect(result.hasResponseTime).toBe(true);
        expect(result.hasMessage).toBe(true);
        expect(result.validStatus).toBe(true);
    });
    
    test('checkTTS returns status object', async ({ page }) => {
        await page.goto(BASE_URL);
        
        const result = await page.evaluate(async () => {
            const { checkTTS, HEALTH_STATUS } = await import('/src/services/HealthChecker.js');
            const status = await checkTTS();
            return {
                hasStatus: status.status !== undefined,
                validStatus: Object.values(HEALTH_STATUS).includes(status.status)
            };
        });
        
        expect(result.hasStatus).toBe(true);
        expect(result.validStatus).toBe(true);
    });
    
    test('checkWhisper returns status object', async ({ page }) => {
        await page.goto(BASE_URL);
        
        const result = await page.evaluate(async () => {
            const { checkWhisper, HEALTH_STATUS } = await import('/src/services/HealthChecker.js');
            const status = await checkWhisper();
            return {
                hasStatus: status.status !== undefined,
                validStatus: Object.values(HEALTH_STATUS).includes(status.status)
            };
        });
        
        expect(result.hasStatus).toBe(true);
        expect(result.validStatus).toBe(true);
    });
    
    test('checkWebSpeech returns browser capabilities', async ({ page }) => {
        await page.goto(BASE_URL);
        
        const result = await page.evaluate(async () => {
            const { checkWebSpeech } = await import('/src/services/HealthChecker.js');
            const status = checkWebSpeech();
            return {
                hasStatus: status.status !== undefined,
                hasSynthesis: typeof status.synthesis === 'boolean',
                hasRecognition: typeof status.recognition === 'boolean',
                hasVoiceCount: typeof status.voiceCount === 'number',
                hasPortugueseVoice: typeof status.hasPortugueseVoice === 'boolean'
            };
        });
        
        expect(result.hasStatus).toBe(true);
        expect(result.hasSynthesis).toBe(true);
        expect(result.hasRecognition).toBe(true);
        expect(result.hasVoiceCount).toBe(true);
        expect(result.hasPortugueseVoice).toBe(true);
    });
    
    test('checkAllServices checks all services concurrently', async ({ page }) => {
        await page.goto(BASE_URL);
        
        const result = await page.evaluate(async () => {
            const { checkAllServices } = await import('/src/services/HealthChecker.js');
            const services = await checkAllServices();
            return {
                hasOllama: services.ollama !== undefined,
                hasTTS: services.tts !== undefined,
                hasWhisper: services.whisper !== undefined,
                hasWebSpeech: services.webSpeech !== undefined
            };
        });
        
        expect(result.hasOllama).toBe(true);
        expect(result.hasTTS).toBe(true);
        expect(result.hasWhisper).toBe(true);
        expect(result.hasWebSpeech).toBe(true);
    });
});

// ============================================================================
// UI COMPONENT CHECK TESTS
// ============================================================================

test.describe('HealthChecker: UI Component Checks', () => {
    test('checkUIComponents returns component statuses', async ({ page }) => {
        await page.goto(BASE_URL);
        
        const result = await page.evaluate(async () => {
            const { checkUIComponents } = await import('/src/services/HealthChecker.js');
            const components = checkUIComponents();
            return {
                isObject: typeof components === 'object',
                hasComponents: Object.keys(components).length > 0
            };
        });
        
        expect(result.isObject).toBe(true);
        expect(result.hasComponents).toBe(true);
    });
    
    test('component check includes required properties', async ({ page }) => {
        await page.goto(BASE_URL);
        
        const result = await page.evaluate(async () => {
            const { checkUIComponents } = await import('/src/services/HealthChecker.js');
            const components = checkUIComponents();
            const firstComponent = Object.values(components)[0];
            return {
                hasName: firstComponent.name !== undefined,
                hasExists: typeof firstComponent.exists === 'boolean',
                hasVisible: typeof firstComponent.visible === 'boolean',
                hasEnabled: typeof firstComponent.enabled === 'boolean',
                hasStatus: firstComponent.status !== undefined,
                hasRequired: typeof firstComponent.required === 'boolean'
            };
        });
        
        expect(result.hasName).toBe(true);
        expect(result.hasExists).toBe(true);
        expect(result.hasVisible).toBe(true);
        expect(result.hasEnabled).toBe(true);
        expect(result.hasStatus).toBe(true);
        expect(result.hasRequired).toBe(true);
    });
    
    test('getUIHealthSummary returns summary statistics', async ({ page }) => {
        await page.goto(BASE_URL);
        
        const summary = await page.evaluate(async () => {
            const { checkUIComponents, getUIHealthSummary } = 
                await import('/src/services/HealthChecker.js');
            checkUIComponents();
            return getUIHealthSummary();
        });
        
        expect(typeof summary.total).toBe('number');
        expect(typeof summary.healthy).toBe('number');
        expect(typeof summary.degraded).toBe('number');
        expect(typeof summary.unhealthy).toBe('number');
        expect(Array.isArray(summary.requiredMissing)).toBe(true);
    });
});

// ============================================================================
// NETWORK CHECK TESTS
// ============================================================================

test.describe('HealthChecker: Network Checks', () => {
    test('checkNetwork returns network status', async ({ page }) => {
        await page.goto(BASE_URL);
        
        const result = await page.evaluate(async () => {
            const { checkNetwork, HEALTH_STATUS } = await import('/src/services/HealthChecker.js');
            const status = checkNetwork();
            return {
                hasStatus: status.status !== undefined,
                hasOnline: typeof status.online === 'boolean',
                hasLastCheck: status.lastCheck !== undefined,
                hasType: status.type !== undefined,
                validStatus: Object.values(HEALTH_STATUS).includes(status.status)
            };
        });
        
        expect(result.hasStatus).toBe(true);
        expect(result.hasOnline).toBe(true);
        expect(result.hasLastCheck).toBe(true);
        expect(result.validStatus).toBe(true);
    });
    
    test('checkNetwork reflects navigator.onLine', async ({ page }) => {
        await page.goto(BASE_URL);
        
        const result = await page.evaluate(async () => {
            const { checkNetwork } = await import('/src/services/HealthChecker.js');
            const status = checkNetwork();
            return {
                networkOnline: status.online,
                navigatorOnline: navigator.onLine
            };
        });
        
        expect(result.networkOnline).toBe(result.navigatorOnline);
    });
});

// ============================================================================
// PERFORMANCE METRICS TESTS
// ============================================================================

test.describe('HealthChecker: Performance Metrics', () => {
    test('getPerformanceMetrics returns metrics', async ({ page }) => {
        await page.goto(BASE_URL);
        
        const result = await page.evaluate(async () => {
            const { getPerformanceMetrics, HEALTH_STATUS } = 
                await import('/src/services/HealthChecker.js');
            const metrics = getPerformanceMetrics();
            return {
                hasStatus: metrics.status !== undefined,
                validStatus: Object.values(HEALTH_STATUS).includes(metrics.status)
            };
        });
        
        expect(result.hasStatus).toBe(true);
        expect(result.validStatus).toBe(true);
    });
    
    test('getPerformanceMetrics includes timing data', async ({ page }) => {
        await page.goto(BASE_URL);
        
        const result = await page.evaluate(async () => {
            const { getPerformanceMetrics } = await import('/src/services/HealthChecker.js');
            const metrics = getPerformanceMetrics();
            // Performance API may not be fully available in test context
            return {
                hasLoadTime: metrics.loadTime !== undefined || metrics.message !== undefined,
                hasDomReady: metrics.domReady !== undefined || metrics.message !== undefined
            };
        });
        
        expect(result.hasLoadTime).toBe(true);
    });
});

// ============================================================================
// FULL HEALTH CHECK TESTS
// ============================================================================

test.describe('HealthChecker: Full Health Check', () => {
    test('runFullHealthCheck returns complete report', async ({ page }) => {
        await page.goto(BASE_URL);
        
        const report = await page.evaluate(async () => {
            const { runFullHealthCheck } = await import('/src/services/HealthChecker.js');
            return await runFullHealthCheck();
        });
        
        expect(report.overall).toBeDefined();
        expect(report.lastCheck).toBeDefined();
        expect(report.services).toBeDefined();
        expect(report.ui).toBeDefined();
        expect(report.network).toBeDefined();
        expect(report.performance).toBeDefined();
    });
    
    test('getHealthReport returns current report', async ({ page }) => {
        await page.goto(BASE_URL);
        
        const report = await page.evaluate(async () => {
            const { runFullHealthCheck, getHealthReport } = 
                await import('/src/services/HealthChecker.js');
            await runFullHealthCheck();
            return getHealthReport();
        });
        
        expect(report.overall).toBeDefined();
        expect(report.uiSummary).toBeDefined();
    });
    
    test('getOverallStatus returns valid status', async ({ page }) => {
        await page.goto(BASE_URL);
        
        const result = await page.evaluate(async () => {
            const { runFullHealthCheck, getOverallStatus, HEALTH_STATUS } = 
                await import('/src/services/HealthChecker.js');
            await runFullHealthCheck();
            const overall = getOverallStatus();
            return {
                status: overall,
                validStatus: Object.values(HEALTH_STATUS).includes(overall)
            };
        });
        
        expect(result.validStatus).toBe(true);
    });
});

// ============================================================================
// SERVICE STATUS TESTS
// ============================================================================

test.describe('HealthChecker: Service Status', () => {
    test('getServiceStatus returns status for known service', async ({ page }) => {
        await page.goto(BASE_URL);
        
        const result = await page.evaluate(async () => {
            const { checkOllama, getServiceStatus } = await import('/src/services/HealthChecker.js');
            await checkOllama();
            return getServiceStatus('ollama');
        });
        
        expect(result).not.toBeNull();
        expect(result.status).toBeDefined();
    });
    
    test('getServiceStatus returns null for unknown service', async ({ page }) => {
        await page.goto(BASE_URL);
        
        const result = await page.evaluate(async () => {
            const { getServiceStatus } = await import('/src/services/HealthChecker.js');
            return getServiceStatus('nonexistent');
        });
        
        expect(result).toBeNull();
    });
    
    test('isServiceAvailable returns boolean', async ({ page }) => {
        await page.goto(BASE_URL);
        
        const result = await page.evaluate(async () => {
            const { checkWebSpeech, isServiceAvailable } = 
                await import('/src/services/HealthChecker.js');
            checkWebSpeech();
            return {
                webSpeech: isServiceAvailable('webSpeech'),
                nonexistent: isServiceAvailable('nonexistent')
            };
        });
        
        expect(typeof result.webSpeech).toBe('boolean');
        expect(result.nonexistent).toBe(false);
    });
});

// ============================================================================
// MONITORING TESTS
// ============================================================================

test.describe('HealthChecker: Monitoring', () => {
    test('startMonitoring starts interval', async ({ page }) => {
        await page.goto(BASE_URL);
        
        const result = await page.evaluate(async () => {
            const { startMonitoring, isMonitoring, stopMonitoring } = 
                await import('/src/services/HealthChecker.js');
            startMonitoring(60000); // Long interval to prevent multiple runs
            const monitoring = isMonitoring();
            stopMonitoring();
            return monitoring;
        });
        
        expect(result).toBe(true);
    });
    
    test('stopMonitoring stops interval', async ({ page }) => {
        await page.goto(BASE_URL);
        
        const result = await page.evaluate(async () => {
            const { startMonitoring, stopMonitoring, isMonitoring } = 
                await import('/src/services/HealthChecker.js');
            startMonitoring(60000);
            stopMonitoring();
            return isMonitoring();
        });
        
        expect(result).toBe(false);
    });
    
    test('isMonitoring returns correct state', async ({ page }) => {
        await page.goto(BASE_URL);
        
        const result = await page.evaluate(async () => {
            const { isMonitoring, stopMonitoring } = await import('/src/services/HealthChecker.js');
            stopMonitoring(); // Ensure stopped
            return isMonitoring();
        });
        
        expect(result).toBe(false);
    });
});

// ============================================================================
// EVENT SUBSCRIPTION TESTS
// ============================================================================

test.describe('HealthChecker: Events', () => {
    test('onHealthEvent subscribes to events', async ({ page }) => {
        await page.goto(BASE_URL);
        
        const result = await page.evaluate(async () => {
            const { onHealthEvent, HEALTH_EVENTS } = await import('/src/services/HealthChecker.js');
            
            return new Promise(resolve => {
                const unsubscribe = onHealthEvent(HEALTH_EVENTS.CHECK_COMPLETE, (e) => {
                    unsubscribe();
                    resolve({ received: true });
                });
                
                // Dispatch test event
                window.dispatchEvent(new CustomEvent(HEALTH_EVENTS.CHECK_COMPLETE, { 
                    detail: { test: true } 
                }));
            });
        });
        
        expect(result.received).toBe(true);
    });
    
    test('onHealthEvent returns unsubscribe function', async ({ page }) => {
        await page.goto(BASE_URL);
        
        const result = await page.evaluate(async () => {
            const { onHealthEvent, HEALTH_EVENTS } = await import('/src/services/HealthChecker.js');
            const unsubscribe = onHealthEvent(HEALTH_EVENTS.STATUS_CHANGED, () => {});
            return typeof unsubscribe === 'function';
        });
        
        expect(result).toBe(true);
    });
});

// ============================================================================
// GRACEFUL DEGRADATION TESTS
// ============================================================================

test.describe('HealthChecker: Graceful Degradation', () => {
    test('getDegradationRecommendations returns recommendations', async ({ page }) => {
        await page.goto(BASE_URL);
        
        const result = await page.evaluate(async () => {
            const { runFullHealthCheck, getDegradationRecommendations } = 
                await import('/src/services/HealthChecker.js');
            await runFullHealthCheck();
            return getDegradationRecommendations();
        });
        
        expect(result.features).toBeDefined();
        expect(result.alternatives).toBeDefined();
        expect(Array.isArray(result.alternatives)).toBe(true);
    });
    
    test('recommendations include feature availability', async ({ page }) => {
        await page.goto(BASE_URL);
        
        const result = await page.evaluate(async () => {
            const { runFullHealthCheck, getDegradationRecommendations } = 
                await import('/src/services/HealthChecker.js');
            await runFullHealthCheck();
            const recs = getDegradationRecommendations();
            // Check structure of features object
            return {
                isObject: typeof recs.features === 'object'
            };
        });
        
        expect(result.isObject).toBe(true);
    });
});

// ============================================================================
// DEFAULT EXPORT TESTS
// ============================================================================

test.describe('HealthChecker: Default Export', () => {
    test('default export includes all public functions', async ({ page }) => {
        await page.goto(BASE_URL);
        
        const exports = await page.evaluate(async () => {
            const HealthChecker = (await import('/src/services/HealthChecker.js')).default;
            return Object.keys(HealthChecker);
        });
        
        expect(exports).toContain('HEALTH_STATUS');
        expect(exports).toContain('HEALTH_CONFIG');
        expect(exports).toContain('HEALTH_ENDPOINTS');
        expect(exports).toContain('HEALTH_EVENTS');
        expect(exports).toContain('checkOllama');
        expect(exports).toContain('checkTTS');
        expect(exports).toContain('checkWhisper');
        expect(exports).toContain('checkWebSpeech');
        expect(exports).toContain('checkAllServices');
        expect(exports).toContain('checkUIComponents');
        expect(exports).toContain('getUIHealthSummary');
        expect(exports).toContain('checkNetwork');
        expect(exports).toContain('getPerformanceMetrics');
        expect(exports).toContain('runFullHealthCheck');
        expect(exports).toContain('getOverallStatus');
        expect(exports).toContain('getHealthReport');
        expect(exports).toContain('getServiceStatus');
        expect(exports).toContain('isServiceAvailable');
        expect(exports).toContain('startMonitoring');
        expect(exports).toContain('stopMonitoring');
        expect(exports).toContain('isMonitoring');
        expect(exports).toContain('onHealthEvent');
        expect(exports).toContain('getDegradationRecommendations');
    });
});
