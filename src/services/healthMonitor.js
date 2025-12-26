/**
 * Health Monitor Service
 * Checks status of all components and reports health
 */

import { API_ENDPOINTS } from '../config/constants.js';

class HealthMonitorService {
    constructor() {
        this.componentStatus = {};
        this.lastFullCheck = null;
        this.checkInterval = null;
    }

    /**
     * Start automatic health checks
     */
    startMonitoring(intervalMs = 30000) {
        this.runFullCheck();
        this.checkInterval = setInterval(() => this.runFullCheck(), intervalMs);
    }

    /**
     * Stop automatic health checks
     */
    stopMonitoring() {
        if (this.checkInterval) {
            clearInterval(this.checkInterval);
            this.checkInterval = null;
        }
    }

    /**
     * Run a full health check of all components
     */
    async runFullCheck() {
        const checks = await Promise.all([
            this.checkOllama(),
            this.checkTTS(),
            this.checkWhisper(),
            this.checkUIComponents(),
        ]);

        this.lastFullCheck = Date.now();
        
        // Emit health update event
        window.dispatchEvent(new CustomEvent('health-update', {
            detail: { status: this.componentStatus, timestamp: this.lastFullCheck }
        }));

        return this.componentStatus;
    }

    /**
     * Check Ollama AI service
     */
    async checkOllama() {
        try {
            const response = await fetch(`${API_ENDPOINTS.ollama}/api/tags`, {
                signal: AbortSignal.timeout(5000),
            });
            
            this.componentStatus.ollama = {
                status: response.ok ? 'healthy' : 'degraded',
                lastCheck: Date.now(),
                message: response.ok ? 'Connected' : `HTTP ${response.status}`,
            };
        } catch (error) {
            this.componentStatus.ollama = {
                status: 'unhealthy',
                lastCheck: Date.now(),
                message: error.message,
                error: true,
            };
        }
        return this.componentStatus.ollama;
    }

    /**
     * Check TTS service
     */
    async checkTTS() {
        try {
            const response = await fetch(`${API_ENDPOINTS.tts}/health`, {
                signal: AbortSignal.timeout(5000),
            });
            
            this.componentStatus.tts = {
                status: response.ok ? 'healthy' : 'degraded',
                lastCheck: Date.now(),
                message: response.ok ? 'Connected' : `HTTP ${response.status}`,
            };
        } catch (error) {
            this.componentStatus.tts = {
                status: 'unhealthy',
                lastCheck: Date.now(),
                message: error.message,
                error: true,
            };
        }
        return this.componentStatus.tts;
    }

    /**
     * Check Whisper speech recognition service
     */
    async checkWhisper() {
        try {
            const response = await fetch(`${API_ENDPOINTS.whisper}/health`, {
                signal: AbortSignal.timeout(5000),
            });
            
            this.componentStatus.whisper = {
                status: response.ok ? 'healthy' : 'degraded',
                lastCheck: Date.now(),
                message: response.ok ? 'Connected' : `HTTP ${response.status}`,
            };
        } catch (error) {
            this.componentStatus.whisper = {
                status: 'unhealthy',
                lastCheck: Date.now(),
                message: error.message,
                error: true,
            };
        }
        return this.componentStatus.whisper;
    }

    /**
     * Check UI components exist and work
     */
    checkUIComponents() {
        const components = {
            // Navigation
            'nav.sidebar': { selector: '.sidebar, #sidebar', required: true },
            'nav.mobileBar': { selector: '.mobile-nav, #mobile-nav', required: false },
            
            // Voice controls
            'voice.playBtn': { selector: '#playAudio, .play-audio-btn', required: true },
            'voice.recordBtn': { selector: '#recordBtn, .record-btn', required: true },
            'voice.speedControl': { selector: '#voiceSpeed, .voice-speed', required: false },
            
            // Lesson controls
            'lesson.prevBtn': { selector: '#prevWord, .prev-word-btn', required: true },
            'lesson.nextBtn': { selector: '#nextWord, .next-word-btn', required: true },
            
            // AI controls
            'ai.chatBtn': { selector: '#aiChatBtn, .ai-chat-btn', required: false },
            'ai.tipSection': { selector: '#aiTips, .ai-tips', required: false },
        };

        const results = {};
        
        for (const [name, config] of Object.entries(components)) {
            const element = document.querySelector(config.selector);
            const exists = !!element;
            const visible = exists && element.offsetParent !== null;
            
            results[name] = {
                exists,
                visible,
                status: exists ? (visible ? 'healthy' : 'hidden') : 'missing',
                required: config.required,
                selector: config.selector,
            };
        }

        this.componentStatus.ui = results;
        return results;
    }

    /**
     * Get overall health status
     */
    getOverallStatus() {
        const statuses = {
            healthy: 0,
            degraded: 0,
            unhealthy: 0,
        };

        // Check services
        ['ollama', 'tts', 'whisper'].forEach(service => {
            const status = this.componentStatus[service]?.status || 'unknown';
            if (statuses[status] !== undefined) {
                statuses[status]++;
            }
        });

        // Check required UI components
        if (this.componentStatus.ui) {
            Object.values(this.componentStatus.ui).forEach(comp => {
                if (comp.required) {
                    if (comp.status === 'healthy') statuses.healthy++;
                    else if (comp.status === 'hidden') statuses.degraded++;
                    else statuses.unhealthy++;
                }
            });
        }

        if (statuses.unhealthy > 0) return 'unhealthy';
        if (statuses.degraded > 0) return 'degraded';
        return 'healthy';
    }

    /**
     * Get health report for admin dashboard
     */
    getHealthReport() {
        return {
            overall: this.getOverallStatus(),
            lastCheck: this.lastFullCheck,
            services: {
                ollama: this.componentStatus.ollama,
                tts: this.componentStatus.tts,
                whisper: this.componentStatus.whisper,
            },
            ui: this.componentStatus.ui,
        };
    }
}

// Export singleton instance
export const healthMonitor = new HealthMonitorService();
export default healthMonitor;
