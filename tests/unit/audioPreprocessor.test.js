/**
 * AudioPreprocessor Service Unit Tests
 * Tests for AudioPreprocessor.js
 * Required tests per IMPLEMENTATION_PLAN.md SPEECH-061
 */

import { test, expect } from '@playwright/test';

const HOME_URL = 'http://localhost:4321/';

async function evalInPage(page, fn) {
    return await page.evaluate(fn);
}

test.describe('AudioPreprocessor Unit Tests', () => {
    
    test.beforeEach(async ({ page }) => {
        await page.goto(HOME_URL);
    });

    test('PREPROC-T001: PREPROCESSOR_CONFIG has correct default values', async ({ page }) => {
        const result = await evalInPage(page, async () => {
            const { PREPROCESSOR_CONFIG } = await import('/src/services/AudioPreprocessor.js');
            return {
                hasTargetSampleRate: 'targetSampleRate' in PREPROCESSOR_CONFIG,
                targetSampleRate: PREPROCESSOR_CONFIG.targetSampleRate,
                hasTargetChannels: 'targetChannels' in PREPROCESSOR_CONFIG,
                targetChannels: PREPROCESSOR_CONFIG.targetChannels,
                hasTargetLoudness: 'targetLoudness' in PREPROCESSOR_CONFIG,
                hasHighPassFreq: 'highPassFrequency' in PREPROCESSOR_CONFIG,
                hasVadThreshold: 'vadThreshold' in PREPROCESSOR_CONFIG
            };
        });
        
        expect(result.hasTargetSampleRate).toBe(true);
        expect(result.targetSampleRate).toBe(16000);
        expect(result.hasTargetChannels).toBe(true);
        expect(result.targetChannels).toBe(1);
        expect(result.hasTargetLoudness).toBe(true);
        expect(result.hasHighPassFreq).toBe(true);
        expect(result.hasVadThreshold).toBe(true);
    });

    test('PREPROC-T010: AudioPreprocessor can be instantiated', async ({ page }) => {
        const result = await evalInPage(page, async () => {
            const { AudioPreprocessor } = await import('/src/services/AudioPreprocessor.js');
            const preprocessor = new AudioPreprocessor();
            return {
                exists: !!preprocessor,
                hasProcess: typeof preprocessor.process === 'function',
                hasQuickProcess: typeof preprocessor.quickProcess === 'function',
                hasDestroy: typeof preprocessor.destroy === 'function'
            };
        });
        
        expect(result.exists).toBe(true);
        expect(result.hasProcess).toBe(true);
        expect(result.hasQuickProcess).toBe(true);
        expect(result.hasDestroy).toBe(true);
    });
    
    test('PREPROC-T011: AudioPreprocessor accepts custom config', async ({ page }) => {
        const result = await evalInPage(page, async () => {
            const { AudioPreprocessor } = await import('/src/services/AudioPreprocessor.js');
            const preprocessor = new AudioPreprocessor({ vadThreshold: 0.05 });
            return {
                vadThreshold: preprocessor.config.vadThreshold
            };
        });
        
        expect(result.vadThreshold).toBe(0.05);
    });

    test('PREPROC-T020: getAudioContext() returns AudioContext', async ({ page }) => {
        const result = await evalInPage(page, async () => {
            const { AudioPreprocessor } = await import('/src/services/AudioPreprocessor.js');
            const preprocessor = new AudioPreprocessor();
            const ctx = preprocessor.getAudioContext();
            return {
                exists: !!ctx,
                hasSampleRate: typeof ctx.sampleRate === 'number'
            };
        });
        
        expect(result.exists).toBe(true);
        expect(result.hasSampleRate).toBe(true);
    });

    test('PREPROC-T030: calculateRMS() computes RMS correctly', async ({ page }) => {
        const result = await evalInPage(page, async () => {
            const { AudioPreprocessor } = await import('/src/services/AudioPreprocessor.js');
            const preprocessor = new AudioPreprocessor();
            
            const silence = new Float32Array(100).fill(0);
            const noise = new Float32Array(100).fill(0.5);
            
            return {
                silenceRMS: preprocessor.calculateRMS(silence),
                noiseRMS: preprocessor.calculateRMS(noise)
            };
        });
        
        expect(result.silenceRMS).toBe(0);
        expect(result.noiseRMS).toBe(0.5);
    });
    
    test('PREPROC-T031: calculatePeak() finds max value', async ({ page }) => {
        const result = await evalInPage(page, async () => {
            const { AudioPreprocessor } = await import('/src/services/AudioPreprocessor.js');
            const preprocessor = new AudioPreprocessor();
            const audio = new Float32Array([0.1, 0.5, 0.8, 0.3, 0.2]);
            return { peak: preprocessor.calculatePeak(audio) };
        });
        
        // Use toBeCloseTo for floating point comparison
        expect(result.peak).toBeCloseTo(0.8, 5);
    });

    test('PREPROC-T040: resample() changes sample count', async ({ page }) => {
        const result = await evalInPage(page, async () => {
            const { AudioPreprocessor } = await import('/src/services/AudioPreprocessor.js');
            const preprocessor = new AudioPreprocessor();
            const audio = new Float32Array(44100);
            const resampled = preprocessor.resample(audio, 44100, 16000);
            return {
                originalLength: audio.length,
                resampledLength: resampled.length,
                expectedLength: 16000
            };
        });
        
        expect(result.resampledLength).toBe(result.expectedLength);
    });

    test('PREPROC-T050: normalize() scales audio', async ({ page }) => {
        const result = await evalInPage(page, async () => {
            const { AudioPreprocessor } = await import('/src/services/AudioPreprocessor.js');
            const preprocessor = new AudioPreprocessor();
            const quiet = new Float32Array(100).fill(0.1);
            const normalized = preprocessor.normalize(quiet);
            const peak = preprocessor.calculatePeak(normalized);
            return { increased: peak > 0.1 };
        });
        
        expect(result.increased).toBe(true);
    });

    test('PREPROC-T060: detectVoiceActivity() returns VAD result', async ({ page }) => {
        const result = await evalInPage(page, async () => {
            const { AudioPreprocessor } = await import('/src/services/AudioPreprocessor.js');
            const preprocessor = new AudioPreprocessor();
            const audio = new Float32Array(16000);
            const vad = preprocessor.detectVoiceActivity(audio);
            return {
                hasHasSpeech: 'hasSpeech' in vad,
                hasSpeechRatio: 'speechRatio' in vad
            };
        });
        
        expect(result.hasHasSpeech).toBe(true);
        expect(result.hasSpeechRatio).toBe(true);
    });

    test('PREPROC-T070: applyHighPassFilter() returns filtered audio', async ({ page }) => {
        const result = await evalInPage(page, async () => {
            const { AudioPreprocessor } = await import('/src/services/AudioPreprocessor.js');
            const preprocessor = new AudioPreprocessor();
            const audio = new Float32Array(1600);
            const filtered = preprocessor.applyHighPassFilter(audio);
            return {
                sameLength: filtered.length === audio.length,
                isFloat32Array: filtered instanceof Float32Array
            };
        });
        
        expect(result.sameLength).toBe(true);
        expect(result.isFloat32Array).toBe(true);
    });

    test('PREPROC-T080: reduceNoise() returns processed audio', async ({ page }) => {
        const result = await evalInPage(page, async () => {
            const { AudioPreprocessor } = await import('/src/services/AudioPreprocessor.js');
            const preprocessor = new AudioPreprocessor();
            const audio = new Float32Array(16000);
            const processed = preprocessor.reduceNoise(audio);
            return {
                sameLength: processed.length === audio.length,
                isFloat32Array: processed instanceof Float32Array
            };
        });
        
        expect(result.sameLength).toBe(true);
        expect(result.isFloat32Array).toBe(true);
    });

    test('PREPROC-T090: encodeWAV() creates valid WAV buffer', async ({ page }) => {
        const result = await evalInPage(page, async () => {
            const { AudioPreprocessor } = await import('/src/services/AudioPreprocessor.js');
            const preprocessor = new AudioPreprocessor();
            const audio = new Float32Array(1600);
            const wav = preprocessor.encodeWAV(audio, 16000);
            const view = new DataView(wav);
            const riff = String.fromCharCode(
                view.getUint8(0), view.getUint8(1), 
                view.getUint8(2), view.getUint8(3)
            );
            return {
                isArrayBuffer: wav instanceof ArrayBuffer,
                hasHeader: riff === 'RIFF'
            };
        });
        
        expect(result.isArrayBuffer).toBe(true);
        expect(result.hasHeader).toBe(true);
    });

    test('PREPROC-T100: getAudioPreprocessor() returns singleton', async ({ page }) => {
        const result = await evalInPage(page, async () => {
            const { getAudioPreprocessor } = await import('/src/services/AudioPreprocessor.js');
            const p1 = getAudioPreprocessor();
            const p2 = getAudioPreprocessor();
            return {
                exists: !!p1,
                same: p1 === p2
            };
        });
        
        expect(result.exists).toBe(true);
        expect(result.same).toBe(true);
    });

    test('PREPROC-T110: default export includes all public functions', async ({ page }) => {
        const result = await evalInPage(page, async () => {
            const mod = await import('/src/services/AudioPreprocessor.js');
            const def = mod.default;
            return {
                hasClass: 'AudioPreprocessor' in def,
                hasConfig: 'PREPROCESSOR_CONFIG' in def,
                hasGetPreprocessor: 'getAudioPreprocessor' in def
            };
        });
        
        expect(result.hasClass).toBe(true);
        expect(result.hasConfig).toBe(true);
        expect(result.hasGetPreprocessor).toBe(true);
    });
});
