/**
 * VoiceService Unit Tests
 * Tests for src/services/VoiceService.js
 * 
 * Component Test Registry: TEST-003
 * Required tests: VOICE-T001 through VOICE-T015
 */

import { test, expect } from '@playwright/test';

// Helper to run code in browser context with VoiceService loaded
async function withVoiceService(page, fn) {
    await page.goto('http://localhost:4321');
    return page.evaluate(fn);
}

test.describe('VoiceService Unit Tests', () => {
    
    // VOICE-T001: VOICE_CONFIG exists with valid structure
    test('VOICE-T001: VOICE_CONFIG has required properties', async ({ page }) => {
        const result = await withVoiceService(page, async () => {
            const { VOICE_CONFIG } = await import('./src/services/VoiceService.js');
            return {
                hasConfig: !!VOICE_CONFIG,
                hasDefaultRate: typeof VOICE_CONFIG?.defaultRate === 'number',
                hasVoicesLoadTimeout: typeof VOICE_CONFIG?.voicesLoadTimeout === 'number',
                hasDefaultGender: typeof VOICE_CONFIG?.defaultGender === 'string'
            };
        });
        
        expect(result.hasConfig).toBe(true);
        expect(result.hasDefaultRate).toBe(true);
        expect(result.hasVoicesLoadTimeout).toBe(true);
        expect(result.hasDefaultGender).toBe(true);
    });
    
    // VOICE-T002: VOICE_ENGINES has valid engine types
    test('VOICE-T002: VOICE_ENGINES contains expected engines', async ({ page }) => {
        const result = await withVoiceService(page, async () => {
            const { VOICE_ENGINES } = await import('./src/services/VoiceService.js');
            return {
                hasEngines: !!VOICE_ENGINES,
                hasWebSpeech: VOICE_ENGINES?.WEBSPEECH === 'webspeech',
                hasBundled: VOICE_ENGINES?.BUNDLED === 'bundled'
            };
        });
        
        expect(result.hasEngines).toBe(true);
        expect(result.hasWebSpeech).toBe(true);
        expect(result.hasBundled).toBe(true);
    });
    
    // VOICE-T003: getLastVoiceUsed() returns status object
    test('VOICE-T003: getLastVoiceUsed() returns status object', async ({ page }) => {
        const result = await withVoiceService(page, async () => {
            const { getLastVoiceUsed } = await import('./src/services/VoiceService.js');
            const status = getLastVoiceUsed();
            return {
                hasStatus: 'status' in status,
                hasEngine: 'engine' in status,
                hasTimestamp: typeof status.timestamp === 'number',
                statusValue: status.status
            };
        });
        
        expect(result.hasStatus).toBe(true);
        expect(result.hasEngine).toBe(true);
        expect(result.hasTimestamp).toBe(true);
        expect(result.statusValue).toBe('idle');
    });
    
    // VOICE-T004: getDownloadedVoices() returns array
    test('VOICE-T004: getDownloadedVoices() returns array', async ({ page }) => {
        const result = await withVoiceService(page, async () => {
            const { getDownloadedVoices } = await import('./src/services/VoiceService.js');
            const voices = getDownloadedVoices();
            return {
                isArray: Array.isArray(voices)
            };
        });
        
        expect(result.isArray).toBe(true);
    });
    
    // VOICE-T005: markVoiceDownloaded() persists to storage
    test('VOICE-T005: markVoiceDownloaded() persists to storage', async ({ page }) => {
        const result = await withVoiceService(page, async () => {
            const { markVoiceDownloaded, getDownloadedVoices, isVoiceDownloaded } = await import('./src/services/VoiceService.js');
            
            // Clear any existing data
            localStorage.removeItem('ptDownloadedVoicesV1');
            
            // Mark a test voice as downloaded
            markVoiceDownloaded('test-voice-123');
            
            return {
                inList: getDownloadedVoices().includes('test-voice-123'),
                isDownloaded: isVoiceDownloaded('test-voice-123'),
                notDownloaded: !isVoiceDownloaded('nonexistent-voice')
            };
        });
        
        expect(result.inList).toBe(true);
        expect(result.isDownloaded).toBe(true);
        expect(result.notDownloaded).toBe(true);
    });
    
    // VOICE-T006: getDownloadableVoices() returns catalog with status
    test('VOICE-T006: getDownloadableVoices() returns voice catalog', async ({ page }) => {
        const result = await withVoiceService(page, async () => {
            const { getDownloadableVoices } = await import('./src/services/VoiceService.js');
            const voices = getDownloadableVoices();
            return {
                isArray: Array.isArray(voices),
                hasVoices: voices.length > 0,
                firstHasKey: voices[0]?.key !== undefined,
                firstHasName: voices[0]?.name !== undefined,
                firstHasDownloaded: 'downloaded' in (voices[0] || {})
            };
        });
        
        expect(result.isArray).toBe(true);
        expect(result.hasVoices).toBe(true);
        expect(result.firstHasKey).toBe(true);
        expect(result.firstHasName).toBe(true);
        expect(result.firstHasDownloaded).toBe(true);
    });
    
    // VOICE-T007: getBundledVoiceStatus() returns meta object
    test('VOICE-T007: getBundledVoiceStatus() returns status', async ({ page }) => {
        const result = await withVoiceService(page, async () => {
            const { getBundledVoiceStatus } = await import('./src/services/VoiceService.js');
            const status = getBundledVoiceStatus();
            return {
                hasDownloaded: 'downloaded' in status,
                hasSizeBytes: 'sizeBytes' in status,
                hasVersion: 'version' in status
            };
        });
        
        expect(result.hasDownloaded).toBe(true);
        expect(result.hasSizeBytes).toBe(true);
        expect(result.hasVersion).toBe(true);
    });
    
    // VOICE-T008: isBundledVoiceReady() returns boolean
    test('VOICE-T008: isBundledVoiceReady() returns boolean', async ({ page }) => {
        const result = await withVoiceService(page, async () => {
            const { isBundledVoiceReady } = await import('./src/services/VoiceService.js');
            const ready = isBundledVoiceReady();
            return {
                isBoolean: typeof ready === 'boolean'
            };
        });
        
        expect(result.isBoolean).toBe(true);
    });
    
    // VOICE-T009: getBundledVoiceOptions() returns array of options
    test('VOICE-T009: getBundledVoiceOptions() returns voice options', async ({ page }) => {
        const result = await withVoiceService(page, async () => {
            const { getBundledVoiceOptions } = await import('./src/services/VoiceService.js');
            const options = getBundledVoiceOptions();
            return {
                isArray: Array.isArray(options),
                hasOptions: options.length > 0,
                firstHasKey: options[0]?.key !== undefined,
                firstHasName: options[0]?.name !== undefined
            };
        });
        
        expect(result.isArray).toBe(true);
        expect(result.hasOptions).toBe(true);
        expect(result.firstHasKey).toBe(true);
        expect(result.firstHasName).toBe(true);
    });
    
    // VOICE-T010: getBundledVoiceCount() returns gender counts
    test('VOICE-T010: getBundledVoiceCount() returns counts', async ({ page }) => {
        const result = await withVoiceService(page, async () => {
            const { getBundledVoiceCount } = await import('./src/services/VoiceService.js');
            const counts = getBundledVoiceCount();
            return {
                hasMale: typeof counts.male === 'number',
                hasFemale: typeof counts.female === 'number',
                hasTotal: typeof counts.total === 'number',
                totalMatches: counts.total === counts.male + counts.female
            };
        });
        
        expect(result.hasMale).toBe(true);
        expect(result.hasFemale).toBe(true);
        expect(result.hasTotal).toBe(true);
        expect(result.totalMatches).toBe(true);
    });
    
    // VOICE-T011: clearBundledVoice() resets status
    test('VOICE-T011: clearBundledVoice() resets status', async ({ page }) => {
        const result = await withVoiceService(page, async () => {
            const { clearBundledVoice, getBundledVoiceStatus } = await import('./src/services/VoiceService.js');
            
            clearBundledVoice();
            const status = getBundledVoiceStatus();
            
            return {
                downloaded: status.downloaded
            };
        });
        
        expect(result.downloaded).toBe(false);
    });
    
    // VOICE-T012: ensureVoicesReady() returns voices array
    test('VOICE-T012: ensureVoicesReady() returns array', async ({ page }) => {
        const result = await withVoiceService(page, async () => {
            const { ensureVoicesReady } = await import('./src/services/VoiceService.js');
            const voices = await ensureVoicesReady();
            return {
                isArray: Array.isArray(voices)
            };
        });
        
        expect(result.isArray).toBe(true);
    });
    
    // VOICE-T013: getPortugueseVoiceOptions() returns structured data
    test('VOICE-T013: getPortugueseVoiceOptions() returns voice data', async ({ page }) => {
        const result = await withVoiceService(page, async () => {
            const { getPortugueseVoiceOptions } = await import('./src/services/VoiceService.js');
            const data = await getPortugueseVoiceOptions('female');
            return {
                hasOptions: Array.isArray(data.options),
                hasMaleVoices: Array.isArray(data.maleVoices),
                hasFemaleVoices: Array.isArray(data.femaleVoices),
                hasTotalCount: typeof data.totalCount === 'number'
            };
        });
        
        expect(result.hasOptions).toBe(true);
        expect(result.hasMaleVoices).toBe(true);
        expect(result.hasFemaleVoices).toBe(true);
        expect(result.hasTotalCount).toBe(true);
    });
    
    // VOICE-T014: getEngineVoiceOptions() returns array
    test('VOICE-T014: getEngineVoiceOptions() returns options', async ({ page }) => {
        const result = await withVoiceService(page, async () => {
            const { getEngineVoiceOptions } = await import('./src/services/VoiceService.js');
            const options = getEngineVoiceOptions('webspeech', 'pt-PT');
            return {
                isArray: Array.isArray(options)
            };
        });
        
        expect(result.isArray).toBe(true);
    });
    
    // VOICE-T015: speakWord() function exists and is callable
    test('VOICE-T015: speakWord() is a function', async ({ page }) => {
        const result = await withVoiceService(page, async () => {
            const { speakWord } = await import('./src/services/VoiceService.js');
            return {
                isFunction: typeof speakWord === 'function'
            };
        });
        
        expect(result.isFunction).toBe(true);
    });
    
    // VOICE-T016: speakSentence() function exists
    test('VOICE-T016: speakSentence() is a function', async ({ page }) => {
        const result = await withVoiceService(page, async () => {
            const { speakSentence } = await import('./src/services/VoiceService.js');
            return {
                isFunction: typeof speakSentence === 'function'
            };
        });
        
        expect(result.isFunction).toBe(true);
    });
    
    // VOICE-T017: speakWithEngine() function exists
    test('VOICE-T017: speakWithEngine() is a function', async ({ page }) => {
        const result = await withVoiceService(page, async () => {
            const { speakWithEngine } = await import('./src/services/VoiceService.js');
            return {
                isFunction: typeof speakWithEngine === 'function'
            };
        });
        
        expect(result.isFunction).toBe(true);
    });
    
    // VOICE-T018: stopSpeech() function exists and is callable
    test('VOICE-T018: stopSpeech() is a function', async ({ page }) => {
        const result = await withVoiceService(page, async () => {
            const { stopSpeech } = await import('./src/services/VoiceService.js');
            return {
                isFunction: typeof stopSpeech === 'function'
            };
        });
        
        expect(result.isFunction).toBe(true);
    });
    
    // VOICE-T019: startBundledVoiceDownload() returns controller
    test('VOICE-T019: startBundledVoiceDownload() returns controller', async ({ page }) => {
        const result = await withVoiceService(page, async () => {
            const { startBundledVoiceDownload } = await import('./src/services/VoiceService.js');
            const controller = startBundledVoiceDownload({
                voiceKey: 'test-key',
                onProgress: () => {},
                onError: () => {}
            });
            
            // Immediately cancel to prevent actual download
            const hasCancel = typeof controller?.cancel === 'function';
            const hasIsCanceled = typeof controller?.isCanceled === 'function';
            
            if (hasCancel) {
                controller.cancel();
            }
            
            return {
                hasCancel,
                hasIsCanceled
            };
        });
        
        expect(result.hasCancel).toBe(true);
        expect(result.hasIsCanceled).toBe(true);
    });
});
