/**
 * WebSpeechService Unit Tests
 * Tests for the enhanced Web Speech API service with pt-PT optimization
 */

import { test, expect } from '@playwright/test';

const HOME_URL = 'http://localhost:4321/';

// Helper to execute code in browser context
async function evalInPage(page, fn) {
    return page.evaluate(fn);
}

test.describe('WebSpeechService Unit Tests', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto(HOME_URL);
        await page.waitForLoadState('networkidle');
    });

    // Configuration Tests
    test('WEBSPEECH-T001: WEBSPEECH_CONFIG has correct default values', async ({ page }) => {
        const result = await evalInPage(page, async () => {
            const { WEBSPEECH_CONFIG } = await import('/src/services/WebSpeechService.js');
            return {
                hasLanguage: 'language' in WEBSPEECH_CONFIG,
                hasFallbackLanguages: 'fallbackLanguages' in WEBSPEECH_CONFIG,
                hasMaxAlternatives: 'maxAlternatives' in WEBSPEECH_CONFIG,
                hasDefaultTimeout: 'defaultTimeoutMs' in WEBSPEECH_CONFIG,
                language: WEBSPEECH_CONFIG.language,
                maxAlternatives: WEBSPEECH_CONFIG.maxAlternatives
            };
        });
        
        expect(result.hasLanguage).toBe(true);
        expect(result.hasFallbackLanguages).toBe(true);
        expect(result.hasMaxAlternatives).toBe(true);
        expect(result.hasDefaultTimeout).toBe(true);
        expect(result.language).toBe('pt-PT');
        expect(result.maxAlternatives).toBeGreaterThanOrEqual(3);
    });

    test('WEBSPEECH-T002: RECOGNITION_STATES has all required states', async ({ page }) => {
        const result = await evalInPage(page, async () => {
            const { RECOGNITION_STATES } = await import('/src/services/WebSpeechService.js');
            return {
                hasIdle: 'IDLE' in RECOGNITION_STATES,
                hasStarting: 'STARTING' in RECOGNITION_STATES,
                hasListening: 'LISTENING' in RECOGNITION_STATES,
                hasProcessing: 'PROCESSING' in RECOGNITION_STATES,
                hasStopped: 'STOPPED' in RECOGNITION_STATES,
                hasError: 'ERROR' in RECOGNITION_STATES
            };
        });
        
        expect(result.hasIdle).toBe(true);
        expect(result.hasStarting).toBe(true);
        expect(result.hasListening).toBe(true);
        expect(result.hasProcessing).toBe(true);
        expect(result.hasStopped).toBe(true);
        expect(result.hasError).toBe(true);
    });

    test('WEBSPEECH-T003: RECOGNITION_EVENTS has all event types', async ({ page }) => {
        const result = await evalInPage(page, async () => {
            const { RECOGNITION_EVENTS } = await import('/src/services/WebSpeechService.js');
            return {
                hasStateChange: 'STATE_CHANGE' in RECOGNITION_EVENTS,
                hasStart: 'START' in RECOGNITION_EVENTS,
                hasResult: 'RESULT' in RECOGNITION_EVENTS,
                hasError: 'ERROR' in RECOGNITION_EVENTS,
                hasEnd: 'END' in RECOGNITION_EVENTS
            };
        });
        
        expect(result.hasStateChange).toBe(true);
        expect(result.hasStart).toBe(true);
        expect(result.hasResult).toBe(true);
        expect(result.hasError).toBe(true);
        expect(result.hasEnd).toBe(true);
    });

    test('WEBSPEECH-T004: SPEECH_ERRORS has user-friendly messages', async ({ page }) => {
        const result = await evalInPage(page, async () => {
            const { SPEECH_ERRORS } = await import('/src/services/WebSpeechService.js');
            return {
                hasNoSpeech: 'no-speech' in SPEECH_ERRORS,
                hasAudioCapture: 'audio-capture' in SPEECH_ERRORS,
                hasNotAllowed: 'not-allowed' in SPEECH_ERRORS,
                hasNetwork: 'network' in SPEECH_ERRORS,
                noSpeechMessage: SPEECH_ERRORS['no-speech']?.message,
                noSpeechRecoverable: SPEECH_ERRORS['no-speech']?.recoverable
            };
        });
        
        expect(result.hasNoSpeech).toBe(true);
        expect(result.hasAudioCapture).toBe(true);
        expect(result.hasNotAllowed).toBe(true);
        expect(result.hasNetwork).toBe(true);
        expect(result.noSpeechMessage).toBeTruthy();
        expect(result.noSpeechRecoverable).toBe(true);
    });

    // Normalization Tests
    test('WEBSPEECH-T010: normalizePortuguese handles common variations', async ({ page }) => {
        const result = await evalInPage(page, async () => {
            const { normalizePortuguese } = await import('/src/services/WebSpeechService.js');
            return {
                basic: normalizePortuguese('Olá, como está?'),
                withPunctuation: normalizePortuguese('Bom dia!!!'),
                multipleSpaces: normalizePortuguese('obrigado    muito'),
                phonetic: normalizePortuguese('bon dia') // Should map to 'bom dia'
            };
        });
        
        expect(result.basic).toBe('olá como está');
        expect(result.withPunctuation).toBe('bom dia');
        expect(result.multipleSpaces).toBe('obrigado muito');
        expect(result.phonetic).toBe('bom dia');
    });

    test('WEBSPEECH-T011: normalizePreserveAccents keeps diacritics', async ({ page }) => {
        const result = await evalInPage(page, async () => {
            const { normalizePreserveAccents } = await import('/src/services/WebSpeechService.js');
            return {
                withAccents: normalizePreserveAccents('Não está?'),
                cedilla: normalizePreserveAccents('Coração'),
                circumflex: normalizePreserveAccents('Você')
            };
        });
        
        expect(result.withAccents).toBe('não está');
        expect(result.cedilla).toBe('coração');
        expect(result.circumflex).toBe('você');
    });

    test('WEBSPEECH-T012: stripDiacritics removes all accents', async ({ page }) => {
        const result = await evalInPage(page, async () => {
            const { stripDiacritics } = await import('/src/services/WebSpeechService.js');
            return {
                nasal: stripDiacritics('não'),
                cedilla: stripDiacritics('coração'),
                acute: stripDiacritics('café'),
                circumflex: stripDiacritics('você')
            };
        });
        
        expect(result.nasal).toBe('nao');
        expect(result.cedilla).toBe('coracao');
        expect(result.acute).toBe('cafe');
        expect(result.circumflex).toBe('voce');
    });

    // Class Tests
    test('WEBSPEECH-T020: WebSpeechService can be instantiated', async ({ page }) => {
        const result = await evalInPage(page, async () => {
            const { WebSpeechService } = await import('/src/services/WebSpeechService.js');
            const service = new WebSpeechService();
            return {
                isInstance: service instanceof WebSpeechService,
                hasIsAvailable: typeof service.isAvailable === 'function',
                hasGetState: typeof service.getState === 'function',
                hasStart: typeof service.start === 'function',
                hasStop: typeof service.stop === 'function'
            };
        });
        
        expect(result.isInstance).toBe(true);
        expect(result.hasIsAvailable).toBe(true);
        expect(result.hasGetState).toBe(true);
        expect(result.hasStart).toBe(true);
        expect(result.hasStop).toBe(true);
    });

    test('WEBSPEECH-T021: WebSpeechService accepts custom config', async ({ page }) => {
        const result = await evalInPage(page, async () => {
            const { WebSpeechService } = await import('/src/services/WebSpeechService.js');
            const service = new WebSpeechService({ 
                language: 'pt-BR',
                defaultTimeoutMs: 8000
            });
            return {
                hasConfig: 'config' in service,
                language: service.config.language,
                timeout: service.config.defaultTimeoutMs
            };
        });
        
        expect(result.hasConfig).toBe(true);
        expect(result.language).toBe('pt-BR');
        expect(result.timeout).toBe(8000);
    });

    test('WEBSPEECH-T022: WebSpeechService starts in IDLE state', async ({ page }) => {
        const result = await evalInPage(page, async () => {
            const { WebSpeechService, RECOGNITION_STATES } = await import('/src/services/WebSpeechService.js');
            const service = new WebSpeechService();
            return {
                state: service.getState(),
                isIdle: service.getState() === RECOGNITION_STATES.IDLE
            };
        });
        
        expect(result.state).toBe('idle');
        expect(result.isIdle).toBe(true);
    });

    test('WEBSPEECH-T023: isListening() returns correct boolean', async ({ page }) => {
        const result = await evalInPage(page, async () => {
            const { WebSpeechService } = await import('/src/services/WebSpeechService.js');
            const service = new WebSpeechService();
            return {
                isListening: service.isListening(),
                isBoolean: typeof service.isListening() === 'boolean'
            };
        });
        
        expect(result.isListening).toBe(false);
        expect(result.isBoolean).toBe(true);
    });

    // Event System Tests
    test('WEBSPEECH-T030: on() subscribes to events', async ({ page }) => {
        const result = await evalInPage(page, async () => {
            const { WebSpeechService, RECOGNITION_EVENTS } = await import('/src/services/WebSpeechService.js');
            const service = new WebSpeechService();
            let eventReceived = false;
            
            const unsubscribe = service.on(RECOGNITION_EVENTS.STATE_CHANGE, () => {
                eventReceived = true;
            });
            
            return {
                hasUnsubscribe: typeof unsubscribe === 'function',
                hasListeners: service.listeners.size > 0
            };
        });
        
        expect(result.hasUnsubscribe).toBe(true);
        expect(result.hasListeners).toBe(true);
    });

    test('WEBSPEECH-T031: off() unsubscribes from events', async ({ page }) => {
        const result = await evalInPage(page, async () => {
            const { WebSpeechService, RECOGNITION_EVENTS } = await import('/src/services/WebSpeechService.js');
            const service = new WebSpeechService();
            const callback = () => {};
            
            service.on(RECOGNITION_EVENTS.STATE_CHANGE, callback);
            const sizeBefore = service.listeners.get(RECOGNITION_EVENTS.STATE_CHANGE)?.size || 0;
            
            service.off(RECOGNITION_EVENTS.STATE_CHANGE, callback);
            const sizeAfter = service.listeners.get(RECOGNITION_EVENTS.STATE_CHANGE)?.size || 0;
            
            return {
                sizeBefore,
                sizeAfter,
                removed: sizeAfter < sizeBefore
            };
        });
        
        expect(result.sizeBefore).toBe(1);
        expect(result.sizeAfter).toBe(0);
        expect(result.removed).toBe(true);
    });

    // Singleton Tests
    test('WEBSPEECH-T040: getWebSpeechService() returns singleton', async ({ page }) => {
        const result = await evalInPage(page, async () => {
            const { getWebSpeechService, resetWebSpeechService } = await import('/src/services/WebSpeechService.js');
            
            resetWebSpeechService();
            const instance1 = getWebSpeechService();
            const instance2 = getWebSpeechService();
            
            return {
                isSame: instance1 === instance2
            };
        });
        
        expect(result.isSame).toBe(true);
    });

    test('WEBSPEECH-T041: resetWebSpeechService() clears singleton', async ({ page }) => {
        const result = await evalInPage(page, async () => {
            const { getWebSpeechService, resetWebSpeechService } = await import('/src/services/WebSpeechService.js');
            
            const instance1 = getWebSpeechService();
            resetWebSpeechService();
            const instance2 = getWebSpeechService();
            
            return {
                areDifferent: instance1 !== instance2
            };
        });
        
        expect(result.areDifferent).toBe(true);
    });

    // Utility Function Tests
    test('WEBSPEECH-T050: isWebSpeechAvailable() checks browser support', async ({ page }) => {
        const result = await evalInPage(page, async () => {
            const { isWebSpeechAvailable } = await import('/src/services/WebSpeechService.js');
            const available = isWebSpeechAvailable();
            return {
                isBoolean: typeof available === 'boolean',
                value: available
            };
        });
        
        expect(result.isBoolean).toBe(true);
        // Chromium should have SpeechRecognition
        expect(result.value).toBe(true);
    });

    test('WEBSPEECH-T051: detectPortugueseSupport() returns array', async ({ page }) => {
        const result = await evalInPage(page, async () => {
            const { detectPortugueseSupport } = await import('/src/services/WebSpeechService.js');
            const supported = await detectPortugueseSupport();
            return {
                isArray: Array.isArray(supported),
                hasPtPT: supported.includes('pt-PT'),
                hasPtBR: supported.includes('pt-BR')
            };
        });
        
        expect(result.isArray).toBe(true);
        expect(result.hasPtPT).toBe(true);
        expect(result.hasPtBR).toBe(true);
    });

    // Default Export Tests
    test('WEBSPEECH-T060: default export includes all public functions', async ({ page }) => {
        const result = await evalInPage(page, async () => {
            const webSpeechModule = await import('/src/services/WebSpeechService.js');
            const defaultExport = webSpeechModule.default;
            
            return {
                hasConfig: 'WEBSPEECH_CONFIG' in defaultExport,
                hasStates: 'RECOGNITION_STATES' in defaultExport,
                hasEvents: 'RECOGNITION_EVENTS' in defaultExport,
                hasErrors: 'SPEECH_ERRORS' in defaultExport,
                hasClass: 'WebSpeechService' in defaultExport,
                hasGetSingleton: 'getWebSpeechService' in defaultExport,
                hasReset: 'resetWebSpeechService' in defaultExport,
                hasNormalize: 'normalizePortuguese' in defaultExport,
                hasPreserveAccents: 'normalizePreserveAccents' in defaultExport,
                hasStripDiacritics: 'stripDiacritics' in defaultExport,
                hasIsAvailable: 'isWebSpeechAvailable' in defaultExport
            };
        });
        
        expect(result.hasConfig).toBe(true);
        expect(result.hasStates).toBe(true);
        expect(result.hasEvents).toBe(true);
        expect(result.hasErrors).toBe(true);
        expect(result.hasClass).toBe(true);
        expect(result.hasGetSingleton).toBe(true);
        expect(result.hasReset).toBe(true);
        expect(result.hasNormalize).toBe(true);
        expect(result.hasPreserveAccents).toBe(true);
        expect(result.hasStripDiacritics).toBe(true);
        expect(result.hasIsAvailable).toBe(true);
    });
});
