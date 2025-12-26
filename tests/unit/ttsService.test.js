/**
 * TTSService Unit Tests
 * Tests for src/services/TTSService.js
 * 
 * Component Test Registry: TEST-005
 * Required tests: TTS-T001 through TTS-T012
 */

import { test, expect } from '@playwright/test';

// Helper to run code in browser context with TTSService loaded
async function withTTSService(page, fn) {
    await page.goto('http://localhost:4321');
    return page.evaluate(fn);
}

test.describe('TTSService Unit Tests', () => {
    
    // TTS-T001: TTS_CONFIG exists with valid structure
    test('TTS-T001: TTS_CONFIG has required properties', async ({ page }) => {
        const result = await withTTSService(page, async () => {
            const { TTS_CONFIG } = await import('./src/services/TTSService.js');
            return {
                hasConfig: !!TTS_CONFIG,
                hasServerUrl: typeof TTS_CONFIG?.serverUrl === 'string',
                hasTimeout: typeof TTS_CONFIG?.timeout === 'number',
                hasDefaultVoice: typeof TTS_CONFIG?.defaultVoice === 'string'
            };
        });
        
        expect(result.hasConfig).toBe(true);
        expect(result.hasServerUrl).toBe(true);
        expect(result.hasTimeout).toBe(true);
        expect(result.hasDefaultVoice).toBe(true);
    });
    
    // TTS-T002: TTS_ENGINES has valid engine types
    test('TTS-T002: TTS_ENGINES contains expected engines', async ({ page }) => {
        const result = await withTTSService(page, async () => {
            const { TTS_ENGINES } = await import('./src/services/TTSService.js');
            return {
                hasEngines: !!TTS_ENGINES,
                hasEdgeTTS: TTS_ENGINES?.EDGE_TTS === 'edge-tts',
                hasWebSpeech: TTS_ENGINES?.WEB_SPEECH === 'web-speech'
            };
        });
        
        expect(result.hasEngines).toBe(true);
        expect(result.hasEdgeTTS).toBe(true);
        expect(result.hasWebSpeech).toBe(true);
    });
    
    // TTS-T003: TTS_LOCALES has valid locales
    test('TTS-T003: TTS_LOCALES contains expected locales', async ({ page }) => {
        const result = await withTTSService(page, async () => {
            const { TTS_LOCALES } = await import('./src/services/TTSService.js');
            return {
                hasLocales: !!TTS_LOCALES,
                hasPortugal: TTS_LOCALES?.PORTUGAL === 'pt-PT',
                hasBrazil: TTS_LOCALES?.BRAZIL === 'pt-BR'
            };
        });
        
        expect(result.hasLocales).toBe(true);
        expect(result.hasPortugal).toBe(true);
        expect(result.hasBrazil).toBe(true);
    });
    
    // TTS-T004: EDGE_VOICES catalog has Portuguese voices
    test('TTS-T004: EDGE_VOICES has Portuguese voices', async ({ page }) => {
        const result = await withTTSService(page, async () => {
            const { EDGE_VOICES } = await import('./src/services/TTSService.js');
            const voiceKeys = Object.keys(EDGE_VOICES);
            return {
                hasVoices: voiceKeys.length > 0,
                hasPortugalVoice: voiceKeys.some(k => k.includes('pt-PT')),
                hasBrazilVoice: voiceKeys.some(k => k.includes('pt-BR')),
                hasRaquel: 'pt-PT-RaquelNeural' in EDGE_VOICES,
                hasDuarte: 'pt-PT-DuarteNeural' in EDGE_VOICES
            };
        });
        
        expect(result.hasVoices).toBe(true);
        expect(result.hasPortugalVoice).toBe(true);
        expect(result.hasBrazilVoice).toBe(true);
        expect(result.hasRaquel).toBe(true);
        expect(result.hasDuarte).toBe(true);
    });
    
    // TTS-T005: getAvailableVoices() returns structured data
    test('TTS-T005: getAvailableVoices() returns voice catalog', async ({ page }) => {
        const result = await withTTSService(page, async () => {
            const { getAvailableVoices } = await import('./src/services/TTSService.js');
            const voices = getAvailableVoices();
            return {
                hasAll: Array.isArray(voices.all),
                hasPortugal: Array.isArray(voices.portugal),
                hasBrazil: Array.isArray(voices.brazil),
                hasByGender: voices.byGender !== undefined,
                hasRecommended: Array.isArray(voices.recommended),
                hasDefault: typeof voices.default === 'string'
            };
        });
        
        expect(result.hasAll).toBe(true);
        expect(result.hasPortugal).toBe(true);
        expect(result.hasBrazil).toBe(true);
        expect(result.hasByGender).toBe(true);
        expect(result.hasRecommended).toBe(true);
        expect(result.hasDefault).toBe(true);
    });
    
    // TTS-T006: getVoice() returns voice by ID
    test('TTS-T006: getVoice() returns voice info', async ({ page }) => {
        const result = await withTTSService(page, async () => {
            const { getVoice } = await import('./src/services/TTSService.js');
            const raquel = getVoice('pt-PT-RaquelNeural');
            const invalid = getVoice('nonexistent-voice');
            return {
                raquelExists: raquel !== null,
                raquelHasName: raquel?.name === 'Raquel',
                raquelHasLocale: raquel?.locale === 'pt-PT',
                invalidIsNull: invalid === null
            };
        });
        
        expect(result.raquelExists).toBe(true);
        expect(result.raquelHasName).toBe(true);
        expect(result.raquelHasLocale).toBe(true);
        expect(result.invalidIsNull).toBe(true);
    });
    
    // TTS-T007: getRecommendedVoice() returns appropriate voice
    test('TTS-T007: getRecommendedVoice() returns voice by gender', async ({ page }) => {
        const result = await withTTSService(page, async () => {
            const { getRecommendedVoice } = await import('./src/services/TTSService.js');
            const female = getRecommendedVoice('female', 'pt-PT');
            const male = getRecommendedVoice('male', 'pt-PT');
            return {
                femaleExists: female !== null,
                femaleIsFemale: female?.gender === 'female',
                maleExists: male !== null,
                maleIsMale: male?.gender === 'male'
            };
        });
        
        expect(result.femaleExists).toBe(true);
        expect(result.femaleIsFemale).toBe(true);
        expect(result.maleExists).toBe(true);
        expect(result.maleIsMale).toBe(true);
    });
    
    // TTS-T008: checkServerHealth() returns boolean
    test('TTS-T008: checkServerHealth() returns boolean', async ({ page }) => {
        const result = await withTTSService(page, async () => {
            const { checkServerHealth } = await import('./src/services/TTSService.js');
            const health = await checkServerHealth();
            return {
                isBoolean: typeof health === 'boolean'
            };
        });
        
        expect(result.isBoolean).toBe(true);
    });
    
    // TTS-T009: getServerStatus() returns status object
    test('TTS-T009: getServerStatus() returns status object', async ({ page }) => {
        const result = await withTTSService(page, async () => {
            const { getServerStatus } = await import('./src/services/TTSService.js');
            const status = getServerStatus();
            return {
                hasAvailable: 'available' in status,
                hasLastCheck: 'lastCheck' in status,
                hasUrl: 'url' in status
            };
        });
        
        expect(result.hasAvailable).toBe(true);
        expect(result.hasLastCheck).toBe(true);
        expect(result.hasUrl).toBe(true);
    });
    
    // TTS-T010: speak() is a function
    test('TTS-T010: speak() is a function', async ({ page }) => {
        const result = await withTTSService(page, async () => {
            const { speak } = await import('./src/services/TTSService.js');
            return {
                isFunction: typeof speak === 'function'
            };
        });
        
        expect(result.isFunction).toBe(true);
    });
    
    // TTS-T011: stop() and isSpeaking() functions exist
    test('TTS-T011: stop() and isSpeaking() are functions', async ({ page }) => {
        const result = await withTTSService(page, async () => {
            const { stop, isSpeaking } = await import('./src/services/TTSService.js');
            return {
                stopIsFunction: typeof stop === 'function',
                isSpeakingIsFunction: typeof isSpeaking === 'function'
            };
        });
        
        expect(result.stopIsFunction).toBe(true);
        expect(result.isSpeakingIsFunction).toBe(true);
    });
    
    // TTS-T012: Bridge file re-exports match TTSService
    test('TTS-T012: ai-tts.js bridge exports match TTSService', async ({ page }) => {
        const result = await withTTSService(page, async () => {
            const bridge = await import('./ai-tts.js');
            const service = await import('./src/services/TTSService.js');
            
            // Check key exports exist in both
            const exports = [
                'TTS_CONFIG',
                'TTS_ENGINES',
                'TTS_LOCALES',
                'EDGE_VOICES',
                'checkServerHealth',
                'getAvailableVoices',
                'getVoice',
                'getRecommendedVoice',
                'speak',
                'stop',
                'isSpeaking'
            ];
            
            const missingInBridge = exports.filter(e => !(e in bridge));
            const missingInService = exports.filter(e => !(e in service));
            
            return {
                bridgeHasAll: missingInBridge.length === 0,
                serviceHasAll: missingInService.length === 0,
                missingInBridge,
                missingInService
            };
        });
        
        expect(result.bridgeHasAll).toBe(true);
        expect(result.serviceHasAll).toBe(true);
    });
});
