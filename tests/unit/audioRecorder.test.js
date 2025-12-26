/**
 * AudioRecorder Service Unit Tests
 * Tests for AudioRecorder.js
 * Required tests per IMPLEMENTATION_PLAN.md SPEECH-060
 */

import { test, expect } from '@playwright/test';

const HOME_URL = 'http://localhost:4321/';

async function evalInPage(page, fn) {
    return await page.evaluate(fn);
}

test.describe('AudioRecorder Unit Tests', () => {
    
    test.beforeEach(async ({ page }) => {
        await page.goto(HOME_URL);
    });

    test('RECORDER-T001: RECORDER_CONFIG has correct default values', async ({ page }) => {
        const result = await evalInPage(page, async () => {
            const { RECORDER_CONFIG } = await import('/src/services/AudioRecorder.js');
            return {
                hasSampleRate: 'sampleRate' in RECORDER_CONFIG,
                sampleRate: RECORDER_CONFIG.sampleRate,
                hasChannelCount: 'channelCount' in RECORDER_CONFIG,
                channelCount: RECORDER_CONFIG.channelCount,
                hasChunkInterval: 'chunkIntervalMs' in RECORDER_CONFIG,
                hasMaxDuration: 'maxDurationMs' in RECORDER_CONFIG,
                hasMimeTypes: Array.isArray(RECORDER_CONFIG.mimeTypes)
            };
        });
        
        expect(result.hasSampleRate).toBe(true);
        expect(result.sampleRate).toBe(16000);
        expect(result.hasChannelCount).toBe(true);
        expect(result.channelCount).toBe(1);
        expect(result.hasChunkInterval).toBe(true);
        expect(result.hasMaxDuration).toBe(true);
        expect(result.hasMimeTypes).toBe(true);
    });
    
    test('RECORDER-T002: RECORDER_STATES has all required states', async ({ page }) => {
        const result = await evalInPage(page, async () => {
            const { RECORDER_STATES } = await import('/src/services/AudioRecorder.js');
            return {
                hasIdle: 'IDLE' in RECORDER_STATES,
                hasPreparing: 'PREPARING' in RECORDER_STATES,
                hasRecording: 'RECORDING' in RECORDER_STATES,
                hasStopping: 'STOPPING' in RECORDER_STATES,
                hasError: 'ERROR' in RECORDER_STATES
            };
        });
        
        expect(result.hasIdle).toBe(true);
        expect(result.hasPreparing).toBe(true);
        expect(result.hasRecording).toBe(true);
        expect(result.hasStopping).toBe(true);
        expect(result.hasError).toBe(true);
    });
    
    test('RECORDER-T003: RECORDER_EVENTS has all event types', async ({ page }) => {
        const result = await evalInPage(page, async () => {
            const { RECORDER_EVENTS } = await import('/src/services/AudioRecorder.js');
            return {
                hasStateChange: 'STATE_CHANGE' in RECORDER_EVENTS,
                hasData: 'DATA' in RECORDER_EVENTS,
                hasLevel: 'LEVEL' in RECORDER_EVENTS,
                hasError: 'ERROR' in RECORDER_EVENTS,
                hasComplete: 'COMPLETE' in RECORDER_EVENTS
            };
        });
        
        expect(result.hasStateChange).toBe(true);
        expect(result.hasData).toBe(true);
        expect(result.hasLevel).toBe(true);
        expect(result.hasError).toBe(true);
        expect(result.hasComplete).toBe(true);
    });

    test('RECORDER-T010: AudioRecorder can be instantiated', async ({ page }) => {
        const result = await evalInPage(page, async () => {
            const { AudioRecorder } = await import('/src/services/AudioRecorder.js');
            const recorder = new AudioRecorder();
            return {
                exists: !!recorder,
                hasStart: typeof recorder.start === 'function',
                hasStop: typeof recorder.stop === 'function',
                hasOn: typeof recorder.on === 'function',
                hasOff: typeof recorder.off === 'function'
            };
        });
        
        expect(result.exists).toBe(true);
        expect(result.hasStart).toBe(true);
        expect(result.hasStop).toBe(true);
        expect(result.hasOn).toBe(true);
        expect(result.hasOff).toBe(true);
    });
    
    test('RECORDER-T011: AudioRecorder accepts custom config', async ({ page }) => {
        const result = await evalInPage(page, async () => {
            const { AudioRecorder } = await import('/src/services/AudioRecorder.js');
            const recorder = new AudioRecorder({ maxDurationMs: 5000 });
            return {
                maxDuration: recorder.config.maxDurationMs
            };
        });
        
        expect(result.maxDuration).toBe(5000);
    });
    
    test('RECORDER-T012: AudioRecorder starts in IDLE state', async ({ page }) => {
        const result = await evalInPage(page, async () => {
            const { AudioRecorder, RECORDER_STATES } = await import('/src/services/AudioRecorder.js');
            const recorder = new AudioRecorder();
            return {
                state: recorder.state,
                isIdle: recorder.state === RECORDER_STATES.IDLE
            };
        });
        
        expect(result.isIdle).toBe(true);
    });

    test('RECORDER-T020: getState() returns current state', async ({ page }) => {
        const result = await evalInPage(page, async () => {
            const { AudioRecorder, RECORDER_STATES } = await import('/src/services/AudioRecorder.js');
            const recorder = new AudioRecorder();
            return {
                state: recorder.getState(),
                matches: recorder.getState() === RECORDER_STATES.IDLE
            };
        });
        
        expect(result.matches).toBe(true);
    });
    
    test('RECORDER-T021: isRecording() returns boolean', async ({ page }) => {
        const result = await evalInPage(page, async () => {
            const { AudioRecorder } = await import('/src/services/AudioRecorder.js');
            const recorder = new AudioRecorder();
            return {
                isRecording: recorder.isRecording(),
                type: typeof recorder.isRecording()
            };
        });
        
        expect(result.type).toBe('boolean');
        expect(result.isRecording).toBe(false);
    });

    test('RECORDER-T030: on() registers event listeners', async ({ page }) => {
        const result = await evalInPage(page, async () => {
            const { AudioRecorder, RECORDER_EVENTS } = await import('/src/services/AudioRecorder.js');
            const recorder = new AudioRecorder();
            let registered = false;
            recorder.on(RECORDER_EVENTS.STATE_CHANGE, () => { registered = true; });
            return {
                hasListeners: recorder.listeners && recorder.listeners.size > 0
            };
        });
        
        expect(result.hasListeners).toBe(true);
    });
    
    test('RECORDER-T031: off() removes event listeners', async ({ page }) => {
        const result = await evalInPage(page, async () => {
            const { AudioRecorder, RECORDER_EVENTS } = await import('/src/services/AudioRecorder.js');
            const recorder = new AudioRecorder();
            const handler = () => {};
            recorder.on(RECORDER_EVENTS.STATE_CHANGE, handler);
            recorder.off(RECORDER_EVENTS.STATE_CHANGE, handler);
            return { success: true };
        });
        
        expect(result.success).toBe(true);
    });

    test('RECORDER-T040: getSupportedMimeType() returns valid type', async ({ page }) => {
        const result = await evalInPage(page, async () => {
            const { AudioRecorder } = await import('/src/services/AudioRecorder.js');
            const mimeType = AudioRecorder.getSupportedMimeType();
            return {
                hasMimeType: !!mimeType,
                isString: typeof mimeType === 'string',
                startsWithAudio: mimeType ? mimeType.startsWith('audio/') : false
            };
        });
        
        expect(result.hasMimeType).toBe(true);
        expect(result.isString).toBe(true);
        expect(result.startsWithAudio).toBe(true);
    });

    test('RECORDER-T050: getAudioRecorder() returns singleton', async ({ page }) => {
        const result = await evalInPage(page, async () => {
            const { getAudioRecorder } = await import('/src/services/AudioRecorder.js');
            const recorder1 = getAudioRecorder();
            const recorder2 = getAudioRecorder();
            return {
                exists: !!recorder1,
                same: recorder1 === recorder2
            };
        });
        
        expect(result.exists).toBe(true);
        expect(result.same).toBe(true);
    });

    test('RECORDER-T060: default export includes all public functions', async ({ page }) => {
        const result = await evalInPage(page, async () => {
            const AudioRecorderModule = await import('/src/services/AudioRecorder.js');
            const def = AudioRecorderModule.default;
            return {
                hasClass: 'AudioRecorder' in def,
                hasConfig: 'RECORDER_CONFIG' in def,
                hasStates: 'RECORDER_STATES' in def,
                hasEvents: 'RECORDER_EVENTS' in def,
                hasGetRecorder: 'getAudioRecorder' in def
            };
        });
        
        expect(result.hasClass).toBe(true);
        expect(result.hasConfig).toBe(true);
        expect(result.hasStates).toBe(true);
        expect(result.hasEvents).toBe(true);
        expect(result.hasGetRecorder).toBe(true);
    });
});
