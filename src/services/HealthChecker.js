/**
 * Health Checker Service
 * 
 * Comprehensive system health monitoring:
 * - Service status checks (AI, TTS, Voice)
 * - UI component validation
 * - Network connectivity
 * - Performance metrics
 * - Graceful degradation support
 * 
 * @module services/HealthChecker
 */

// ============================================================================
// CONFIGURATION
// ============================================================================

/**
 * Health status levels
 */
export const HEALTH_STATUS = {
    HEALTHY: 'healthy',
    DEGRADED: 'degraded',
    UNHEALTHY: 'unhealthy',
    UNKNOWN: 'unknown'
};

/**
 * Health check configuration
 */
export const HEALTH_CONFIG = {
    defaultTimeout: 5000,
    checkInterval: 30000,
    retryAttempts: 2,
    retryDelay: 1000
};

/**
 * Service endpoints
 */
export const HEALTH_ENDPOINTS = {
    ollama: 'http://localhost:11434',
    tts: 'http://localhost:5001',
    whisper: 'http://localhost:5002'
};

/**
 * Health events
 */
export const HEALTH_EVENTS = {
    STATUS_CHANGED: 'healthStatusChanged',
    SERVICE_DOWN: 'healthServiceDown',
    SERVICE_RECOVERED: 'healthServiceRecovered',
    CHECK_COMPLETE: 'healthCheckComplete'
};

// ============================================================================
// STATE
// ============================================================================

let state = {
    services: {},
    ui: {},
    network: {},
    performance: {},
    lastCheck: null,
    checkInterval: null,
    previousStatus: null
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Fetch with timeout
 * @param {string} url - URL to fetch
 * @param {number} timeout - Timeout in ms
 * @returns {Promise<Response>} Fetch response
 */
async function fetchWithTimeout(url, timeout = HEALTH_CONFIG.defaultTimeout) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    try {
        const response = await fetch(url, { signal: controller.signal });
        clearTimeout(timeoutId);
        return response;
    } catch (error) {
        clearTimeout(timeoutId);
        throw error;
    }
}

/**
 * Retry operation
 * @param {Function} fn - Function to retry
 * @param {number} attempts - Number of attempts
 * @param {number} delay - Delay between attempts
 * @returns {Promise<*>} Result
 */
async function withRetry(fn, attempts = HEALTH_CONFIG.retryAttempts, delay = HEALTH_CONFIG.retryDelay) {
    let lastError;
    
    for (let i = 0; i < attempts; i++) {
        try {
            return await fn();
        } catch (error) {
            lastError = error;
            if (i < attempts - 1) {
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    }
    
    throw lastError;
}

/**
 * Dispatch health event
 * @param {string} eventName - Event name
 * @param {Object} detail - Event detail
 */
function dispatchHealthEvent(eventName, detail) {
    window.dispatchEvent(new CustomEvent(eventName, { detail }));
}

// ============================================================================
// SERVICE CHECKS
// ============================================================================

/**
 * Check Ollama AI service
 * @returns {Promise<Object>} Service status
 */
export async function checkOllama() {
    const start = performance.now();
    
    try {
        const response = await fetchWithTimeout(`${HEALTH_ENDPOINTS.ollama}/api/tags`);
        const responseTime = Math.round(performance.now() - start);
        
        if (response.ok) {
            const data = await response.json();
            const modelCount = data.models?.length || 0;
            
            state.services.ollama = {
                status: HEALTH_STATUS.HEALTHY,
                lastCheck: Date.now(),
                responseTime,
                message: `${modelCount} models available`,
                models: data.models?.map(m => m.name) || []
            };
        } else {
            state.services.ollama = {
                status: HEALTH_STATUS.DEGRADED,
                lastCheck: Date.now(),
                responseTime,
                message: `HTTP ${response.status}`,
                error: true
            };
        }
    } catch (error) {
        state.services.ollama = {
            status: HEALTH_STATUS.UNHEALTHY,
            lastCheck: Date.now(),
            responseTime: Math.round(performance.now() - start),
            message: error.name === 'AbortError' ? 'Timeout' : error.message,
            error: true
        };
    }
    
    return state.services.ollama;
}

/**
 * Check TTS service
 * @returns {Promise<Object>} Service status
 */
export async function checkTTS() {
    const start = performance.now();
    
    try {
        const response = await fetchWithTimeout(`${HEALTH_ENDPOINTS.tts}/health`);
        const responseTime = Math.round(performance.now() - start);
        
        state.services.tts = {
            status: response.ok ? HEALTH_STATUS.HEALTHY : HEALTH_STATUS.DEGRADED,
            lastCheck: Date.now(),
            responseTime,
            message: response.ok ? 'Connected' : `HTTP ${response.status}`
        };
    } catch (error) {
        state.services.tts = {
            status: HEALTH_STATUS.UNHEALTHY,
            lastCheck: Date.now(),
            responseTime: Math.round(performance.now() - start),
            message: error.name === 'AbortError' ? 'Timeout' : error.message,
            error: true
        };
    }
    
    return state.services.tts;
}

/**
 * Check Whisper speech recognition
 * @returns {Promise<Object>} Service status
 */
export async function checkWhisper() {
    const start = performance.now();
    
    try {
        const response = await fetchWithTimeout(`${HEALTH_ENDPOINTS.whisper}/health`);
        const responseTime = Math.round(performance.now() - start);
        
        state.services.whisper = {
            status: response.ok ? HEALTH_STATUS.HEALTHY : HEALTH_STATUS.DEGRADED,
            lastCheck: Date.now(),
            responseTime,
            message: response.ok ? 'Connected' : `HTTP ${response.status}`
        };
    } catch (error) {
        state.services.whisper = {
            status: HEALTH_STATUS.UNHEALTHY,
            lastCheck: Date.now(),
            responseTime: Math.round(performance.now() - start),
            message: error.name === 'AbortError' ? 'Timeout' : error.message,
            error: true
        };
    }
    
    return state.services.whisper;
}

/**
 * Check Web Speech API
 * @returns {Object} Speech API status
 */
export function checkWebSpeech() {
    const synthesis = 'speechSynthesis' in window;
    const recognition = 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
    
    let voices = [];
    if (synthesis) {
        voices = speechSynthesis.getVoices();
    }
    
    const hasPortugueseVoice = voices.some(v => 
        v.lang.startsWith('pt') || v.lang.includes('Portuguese')
    );
    
    state.services.webSpeech = {
        status: synthesis && recognition ? HEALTH_STATUS.HEALTHY : 
                synthesis ? HEALTH_STATUS.DEGRADED : HEALTH_STATUS.UNHEALTHY,
        lastCheck: Date.now(),
        synthesis,
        recognition,
        voiceCount: voices.length,
        hasPortugueseVoice,
        message: !synthesis ? 'Speech synthesis unavailable' :
                 !recognition ? 'Speech recognition unavailable' :
                 'All features available'
    };
    
    return state.services.webSpeech;
}

/**
 * Check all services
 * @returns {Promise<Object>} All service statuses
 */
export async function checkAllServices() {
    const [ollama, tts, whisper] = await Promise.all([
        checkOllama().catch(() => ({ status: HEALTH_STATUS.UNHEALTHY })),
        checkTTS().catch(() => ({ status: HEALTH_STATUS.UNHEALTHY })),
        checkWhisper().catch(() => ({ status: HEALTH_STATUS.UNHEALTHY }))
    ]);
    
    checkWebSpeech();
    
    return {
        ollama,
        tts,
        whisper,
        webSpeech: state.services.webSpeech
    };
}

// ============================================================================
// UI COMPONENT CHECKS
// ============================================================================

/**
 * UI component definitions
 */
const UI_COMPONENTS = {
    // Navigation
    'nav.sidebar': { selector: '.sidebar, #sidebar, nav', required: false },
    'nav.mobileBar': { selector: '.mobile-nav, #mobile-nav, .bottom-nav', required: false },
    
    // Voice controls
    'voice.playBtn': { selector: '#playAudio, .play-audio-btn, [data-play-audio]', required: true },
    'voice.recordBtn': { selector: '#recordBtn, .record-btn, [data-record]', required: false },
    'voice.speedControl': { selector: '#voiceSpeed, .voice-speed, [data-voice-speed]', required: false },
    
    // Lesson controls  
    'lesson.container': { selector: '#lessonView, .lesson-view, .lesson-container', required: true },
    'lesson.prevBtn': { selector: '#prevWord, .prev-word-btn, [data-prev]', required: false },
    'lesson.nextBtn': { selector: '#nextWord, .next-word-btn, [data-next]', required: false },
    
    // AI controls
    'ai.chatBtn': { selector: '#aiChatBtn, .ai-chat-btn, [data-ai-chat]', required: false },
    'ai.tipSection': { selector: '#aiTips, .ai-tips, [data-ai-tips]', required: false },
    
    // Core views
    'view.home': { selector: '#homeView, .home-view, [data-view="home"]', required: true },
    'view.dashboard': { selector: '#dashboardView, .dashboard-view', required: false }
};

/**
 * Check single UI component
 * @param {string} name - Component name
 * @param {Object} config - Component config
 * @returns {Object} Component status
 */
function checkUIComponent(name, config) {
    const element = document.querySelector(config.selector);
    const exists = !!element;
    const visible = exists && element.offsetParent !== null;
    const enabled = exists && !element.disabled;
    
    let status;
    if (!exists) {
        status = config.required ? HEALTH_STATUS.UNHEALTHY : HEALTH_STATUS.UNKNOWN;
    } else if (!visible) {
        status = HEALTH_STATUS.DEGRADED;
    } else {
        status = HEALTH_STATUS.HEALTHY;
    }
    
    return {
        name,
        exists,
        visible,
        enabled,
        status,
        required: config.required,
        selector: config.selector
    };
}

/**
 * Check all UI components
 * @returns {Object} UI component statuses
 */
export function checkUIComponents() {
    const results = {};
    
    for (const [name, config] of Object.entries(UI_COMPONENTS)) {
        results[name] = checkUIComponent(name, config);
    }
    
    state.ui = results;
    return results;
}

/**
 * Get UI health summary
 * @returns {Object} UI health summary
 */
export function getUIHealthSummary() {
    const components = Object.values(state.ui);
    
    return {
        total: components.length,
        healthy: components.filter(c => c.status === HEALTH_STATUS.HEALTHY).length,
        degraded: components.filter(c => c.status === HEALTH_STATUS.DEGRADED).length,
        unhealthy: components.filter(c => c.status === HEALTH_STATUS.UNHEALTHY).length,
        requiredMissing: components.filter(c => c.required && !c.exists).map(c => c.name)
    };
}

// ============================================================================
// NETWORK CHECKS
// ============================================================================

/**
 * Check network connectivity
 * @returns {Object} Network status
 */
export function checkNetwork() {
    const online = navigator.onLine;
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    
    state.network = {
        status: online ? HEALTH_STATUS.HEALTHY : HEALTH_STATUS.UNHEALTHY,
        online,
        lastCheck: Date.now(),
        type: connection?.type || 'unknown',
        effectiveType: connection?.effectiveType || 'unknown',
        downlink: connection?.downlink || null,
        rtt: connection?.rtt || null
    };
    
    return state.network;
}

// ============================================================================
// PERFORMANCE METRICS
// ============================================================================

/**
 * Get performance metrics
 * @returns {Object} Performance metrics
 */
export function getPerformanceMetrics() {
    const perf = performance.getEntriesByType('navigation')[0];
    
    if (!perf) {
        return {
            status: HEALTH_STATUS.UNKNOWN,
            message: 'Performance API not available'
        };
    }
    
    const loadTime = Math.round(perf.loadEventEnd - perf.startTime);
    const domReady = Math.round(perf.domContentLoadedEventEnd - perf.startTime);
    const ttfb = Math.round(perf.responseStart - perf.requestStart);
    
    state.performance = {
        status: loadTime < 3000 ? HEALTH_STATUS.HEALTHY :
                loadTime < 5000 ? HEALTH_STATUS.DEGRADED : HEALTH_STATUS.UNHEALTHY,
        lastCheck: Date.now(),
        loadTime,
        domReady,
        ttfb,
        memoryUsage: performance.memory ? {
            usedJSHeapSize: Math.round(performance.memory.usedJSHeapSize / 1048576),
            totalJSHeapSize: Math.round(performance.memory.totalJSHeapSize / 1048576),
            jsHeapSizeLimit: Math.round(performance.memory.jsHeapSizeLimit / 1048576)
        } : null
    };
    
    return state.performance;
}

// ============================================================================
// FULL HEALTH CHECK
// ============================================================================

/**
 * Run full health check
 * @returns {Promise<Object>} Complete health report
 */
export async function runFullHealthCheck() {
    const previousStatus = getOverallStatus();
    
    // Run all checks in parallel where possible
    const [services] = await Promise.all([
        checkAllServices()
    ]);
    
    // Run synchronous checks
    checkUIComponents();
    checkNetwork();
    getPerformanceMetrics();
    
    state.lastCheck = Date.now();
    
    const currentStatus = getOverallStatus();
    
    // Emit events for status changes
    if (previousStatus !== currentStatus) {
        dispatchHealthEvent(HEALTH_EVENTS.STATUS_CHANGED, {
            previous: previousStatus,
            current: currentStatus
        });
    }
    
    // Check for service recovery/failure
    for (const [serviceName, status] of Object.entries(state.services)) {
        const prevServiceStatus = state.previousStatus?.services?.[serviceName]?.status;
        
        if (prevServiceStatus === HEALTH_STATUS.UNHEALTHY && status.status === HEALTH_STATUS.HEALTHY) {
            dispatchHealthEvent(HEALTH_EVENTS.SERVICE_RECOVERED, { service: serviceName });
        } else if (prevServiceStatus === HEALTH_STATUS.HEALTHY && status.status === HEALTH_STATUS.UNHEALTHY) {
            dispatchHealthEvent(HEALTH_EVENTS.SERVICE_DOWN, { service: serviceName });
        }
    }
    
    state.previousStatus = { services: { ...state.services } };
    
    dispatchHealthEvent(HEALTH_EVENTS.CHECK_COMPLETE, { report: getHealthReport() });
    
    return getHealthReport();
}

// ============================================================================
// OVERALL STATUS
// ============================================================================

/**
 * Get overall health status
 * @returns {string} Overall status
 */
export function getOverallStatus() {
    const statuses = [];
    
    // Add service statuses
    for (const service of Object.values(state.services)) {
        if (service?.status) {
            statuses.push(service.status);
        }
    }
    
    // Add required UI component statuses
    for (const component of Object.values(state.ui)) {
        if (component?.required && component.status) {
            statuses.push(component.status);
        }
    }
    
    // Add network status
    if (state.network?.status) {
        statuses.push(state.network.status);
    }
    
    if (statuses.length === 0) return HEALTH_STATUS.UNKNOWN;
    if (statuses.includes(HEALTH_STATUS.UNHEALTHY)) return HEALTH_STATUS.UNHEALTHY;
    if (statuses.includes(HEALTH_STATUS.DEGRADED)) return HEALTH_STATUS.DEGRADED;
    return HEALTH_STATUS.HEALTHY;
}

// ============================================================================
// HEALTH REPORT
// ============================================================================

/**
 * Get complete health report
 * @returns {Object} Health report
 */
export function getHealthReport() {
    return {
        overall: getOverallStatus(),
        lastCheck: state.lastCheck,
        services: { ...state.services },
        ui: state.ui,
        uiSummary: getUIHealthSummary(),
        network: state.network,
        performance: state.performance
    };
}

/**
 * Get service status
 * @param {string} serviceName - Service name
 * @returns {Object|null} Service status
 */
export function getServiceStatus(serviceName) {
    return state.services[serviceName] || null;
}

/**
 * Check if service is available
 * @param {string} serviceName - Service name
 * @returns {boolean} True if available
 */
export function isServiceAvailable(serviceName) {
    const status = state.services[serviceName]?.status;
    return status === HEALTH_STATUS.HEALTHY || status === HEALTH_STATUS.DEGRADED;
}

// ============================================================================
// MONITORING
// ============================================================================

/**
 * Start health monitoring
 * @param {number} interval - Check interval in ms
 */
export function startMonitoring(interval = HEALTH_CONFIG.checkInterval) {
    stopMonitoring();
    runFullHealthCheck();
    state.checkInterval = setInterval(() => runFullHealthCheck(), interval);
}

/**
 * Stop health monitoring
 */
export function stopMonitoring() {
    if (state.checkInterval) {
        clearInterval(state.checkInterval);
        state.checkInterval = null;
    }
}

/**
 * Check if monitoring is active
 * @returns {boolean} True if monitoring
 */
export function isMonitoring() {
    return state.checkInterval !== null;
}

// ============================================================================
// EVENT SUBSCRIPTIONS
// ============================================================================

/**
 * Subscribe to health event
 * @param {string} eventName - Event name
 * @param {Function} callback - Event callback
 * @returns {Function} Unsubscribe function
 */
export function onHealthEvent(eventName, callback) {
    window.addEventListener(eventName, callback);
    return () => window.removeEventListener(eventName, callback);
}

// ============================================================================
// GRACEFUL DEGRADATION
// ============================================================================

/**
 * Get degradation recommendations
 * @returns {Object} Degradation recommendations
 */
export function getDegradationRecommendations() {
    const recommendations = {
        features: {},
        alternatives: []
    };
    
    // AI service down
    if (!isServiceAvailable('ollama')) {
        recommendations.features.aiChat = { available: false, reason: 'AI service offline' };
        recommendations.features.aiTips = { available: false, reason: 'AI service offline' };
        recommendations.alternatives.push('Use built-in grammar tips instead of AI suggestions');
    }
    
    // TTS service down
    if (!isServiceAvailable('tts')) {
        if (state.services.webSpeech?.synthesis) {
            recommendations.features.tts = { available: true, degraded: true, reason: 'Using browser voices' };
            recommendations.alternatives.push('Neural TTS unavailable, using browser voices');
        } else {
            recommendations.features.tts = { available: false, reason: 'No TTS available' };
        }
    }
    
    // Speech recognition down
    if (!isServiceAvailable('whisper') && !state.services.webSpeech?.recognition) {
        recommendations.features.pronunciation = { available: false, reason: 'Speech recognition unavailable' };
        recommendations.alternatives.push('Manual pronunciation practice (no automatic feedback)');
    }
    
    // Network offline
    if (!state.network?.online) {
        recommendations.features.sync = { available: false, reason: 'Offline' };
        recommendations.alternatives.push('Progress will sync when connection is restored');
    }
    
    return recommendations;
}

// ============================================================================
// DEFAULT EXPORT
// ============================================================================

export default {
    // Status constants
    HEALTH_STATUS,
    HEALTH_CONFIG,
    HEALTH_ENDPOINTS,
    HEALTH_EVENTS,
    
    // Service checks
    checkOllama,
    checkTTS,
    checkWhisper,
    checkWebSpeech,
    checkAllServices,
    
    // UI checks
    checkUIComponents,
    getUIHealthSummary,
    
    // Other checks
    checkNetwork,
    getPerformanceMetrics,
    
    // Full check
    runFullHealthCheck,
    
    // Status
    getOverallStatus,
    getHealthReport,
    getServiceStatus,
    isServiceAvailable,
    
    // Monitoring
    startMonitoring,
    stopMonitoring,
    isMonitoring,
    
    // Events
    onHealthEvent,
    
    // Degradation
    getDegradationRecommendations
};
