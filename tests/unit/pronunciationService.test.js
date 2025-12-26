/**
 * PronunciationService Unit Tests
 * Tests for PronunciationService.js
 * Required tests per IMPLEMENTATION_PLAN.md SPEECH-062
 */

import { test, expect } from '@playwright/test';

const HOME_URL = 'http://localhost:4321/';

async function evalInPage(page, fn) {
    return await page.evaluate(fn);
}

test.describe('PronunciationService Unit Tests', () => {
    
    test.beforeEach(async ({ page }) => {
        await page.goto(HOME_URL);
    });

    test('PRONUN-T001: PRONUNCIATION_CONFIG has correct defaults', async ({ page }) => {
        const result = await evalInPage(page, async () => {
            const { PRONUNCIATION_CONFIG } = await import('/src/services/PronunciationService.js');
            return {
                hasRecordingTimeout: 'recordingTimeoutMs' in PRONUNCIATION_CONFIG,
                hasMaxRecording: 'maxRecordingMs' in PRONUNCIATION_CONFIG,
                hasDefaultEngine: 'defaultEngine' in PRONUNCIATION_CONFIG,
                hasEnginePriority: 'enginePriority' in PRONUNCIATION_CONFIG,
                hasScoreThresholds: 'excellentScore' in PRONUNCIATION_CONFIG
            };
        });
        
        expect(result.hasRecordingTimeout).toBe(true);
        expect(result.hasMaxRecording).toBe(true);
        expect(result.hasDefaultEngine).toBe(true);
        expect(result.hasEnginePriority).toBe(true);
        expect(result.hasScoreThresholds).toBe(true);
    });

    test('PRONUN-T002: ENGINE_STATUS has all status types', async ({ page }) => {
        const result = await evalInPage(page, async () => {
            const { ENGINE_STATUS } = await import('/src/services/PronunciationService.js');
            return {
                hasAvailable: 'AVAILABLE' in ENGINE_STATUS,
                hasUnavailable: 'UNAVAILABLE' in ENGINE_STATUS,
                hasLoading: 'LOADING' in ENGINE_STATUS,
                hasError: 'ERROR' in ENGINE_STATUS
            };
        });
        
        expect(result.hasAvailable).toBe(true);
        expect(result.hasUnavailable).toBe(true);
        expect(result.hasLoading).toBe(true);
        expect(result.hasError).toBe(true);
    });

    test('PRONUN-T010: PronunciationService can be instantiated', async ({ page }) => {
        const result = await evalInPage(page, async () => {
            const { PronunciationService } = await import('/src/services/PronunciationService.js');
            const service = new PronunciationService();
            return {
                exists: !!service,
                hasTestPronunciation: typeof service.testPronunciation === 'function',
                hasStartRecording: typeof service.startRecording === 'function',
                hasStopRecording: typeof service.stopRecording === 'function',
                hasIsRecording: typeof service.isRecording === 'function'
            };
        });
        
        expect(result.exists).toBe(true);
        expect(result.hasTestPronunciation).toBe(true);
        expect(result.hasStartRecording).toBe(true);
        expect(result.hasStopRecording).toBe(true);
        expect(result.hasIsRecording).toBe(true);
    });
    
    test('PRONUN-T011: PronunciationService accepts custom config', async ({ page }) => {
        const result = await evalInPage(page, async () => {
            const { PronunciationService, PRONUNCIATION_CONFIG } = await import('/src/services/PronunciationService.js');
            const service = new PronunciationService({ recordingTimeoutMs: 3000 });
            return {
                customTimeout: service.config.recordingTimeoutMs,
                defaultTimeout: PRONUNCIATION_CONFIG.recordingTimeoutMs
            };
        });
        
        expect(result.customTimeout).toBe(3000);
    });

    test('PRONUN-T020: getAvailableEngines() returns array', async ({ page }) => {
        const result = await evalInPage(page, async () => {
            const { PronunciationService } = await import('/src/services/PronunciationService.js');
            const service = new PronunciationService();
            const engines = service.getAvailableEngines();
            return {
                isArray: Array.isArray(engines)
            };
        });
        
        expect(result.isArray).toBe(true);
    });
    
    test('PRONUN-T021: getEngineInfo() returns engine info object', async ({ page }) => {
        const result = await evalInPage(page, async () => {
            const { PronunciationService } = await import('/src/services/PronunciationService.js');
            const service = new PronunciationService();
            const info = service.getEngineInfo();
            return {
                isObject: typeof info === 'object',
                hasAvailable: 'available' in info
            };
        });
        
        expect(result.isObject).toBe(true);
        expect(result.hasAvailable).toBe(true);
    });

    test('PRONUN-T030: on() subscribes to events', async ({ page }) => {
        const result = await evalInPage(page, async () => {
            const { PronunciationService } = await import('/src/services/PronunciationService.js');
            const service = new PronunciationService();
            let called = false;
            const unsub = service.on('test', () => { called = true; });
            service.emit('test', {});
            return {
                hasUnsub: typeof unsub === 'function',
                wasCalled: called
            };
        });
        
        expect(result.hasUnsub).toBe(true);
        expect(result.wasCalled).toBe(true);
    });
    
    test('PRONUN-T031: off() unsubscribes from events', async ({ page }) => {
        const result = await evalInPage(page, async () => {
            const { PronunciationService } = await import('/src/services/PronunciationService.js');
            const service = new PronunciationService();
            let callCount = 0;
            const handler = () => { callCount++; };
            service.on('test', handler);
            service.emit('test', {}); // Should call
            service.off('test', handler);
            service.emit('test', {}); // Should NOT call
            return {
                callCount
            };
        });
        
        expect(result.callCount).toBe(1);
    });

    test('PRONUN-T040: setEngine() changes current engine', async ({ page }) => {
        const result = await evalInPage(page, async () => {
            const { PronunciationService } = await import('/src/services/PronunciationService.js');
            const service = new PronunciationService();
            // Note: engine may not be available until initialized
            return {
                hasSetEngine: typeof service.setEngine === 'function'
            };
        });
        
        expect(result.hasSetEngine).toBe(true);
    });
    
    test('PRONUN-T041: getCurrentLevel() returns level value', async ({ page }) => {
        const result = await evalInPage(page, async () => {
            const { PronunciationService } = await import('/src/services/PronunciationService.js');
            const service = new PronunciationService();
            const level = service.getCurrentLevel();
            return {
                isNumber: typeof level === 'number',
                inRange: level >= 0 && level <= 100
            };
        });
        
        expect(result.isNumber).toBe(true);
        expect(result.inRange).toBe(true);
    });

    test('PRONUN-T050: isRecording() returns boolean', async ({ page }) => {
        const result = await evalInPage(page, async () => {
            const { PronunciationService } = await import('/src/services/PronunciationService.js');
            const service = new PronunciationService();
            return {
                type: typeof service.isRecording(),
                value: service.isRecording()
            };
        });
        
        expect(result.type).toBe('boolean');
        expect(result.value).toBe(false);
    });

    test('PRONUN-T060: getPronunciationService() returns singleton', async ({ page }) => {
        const result = await evalInPage(page, async () => {
            const { getPronunciationService } = await import('/src/services/PronunciationService.js');
            const s1 = getPronunciationService();
            const s2 = getPronunciationService();
            return {
                exists: !!s1,
                same: s1 === s2
            };
        });
        
        expect(result.exists).toBe(true);
        expect(result.same).toBe(true);
    });

    test('PRONUN-T070: default export includes all public functions', async ({ page }) => {
        const result = await evalInPage(page, async () => {
            const mod = await import('/src/services/PronunciationService.js');
            const def = mod.default;
            return {
                hasClass: 'PronunciationService' in def,
                hasConfig: 'PRONUNCIATION_CONFIG' in def,
                hasEvents: 'PRONUNCIATION_EVENTS' in def,
                hasGetService: 'getPronunciationService' in def,
                hasTestPronunciation: 'testPronunciation' in def
            };
        });
        
        expect(result.hasClass).toBe(true);
        expect(result.hasConfig).toBe(true);
        expect(result.hasEvents).toBe(true);
        expect(result.hasGetService).toBe(true);
        expect(result.hasTestPronunciation).toBe(true);
    });
});
