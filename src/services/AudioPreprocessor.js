/**
 * AudioPreprocessor Service
 * 
 * Audio preprocessing pipeline for speech recognition:
 * - Resampling to 16kHz (Whisper requirement)
 * - Noise reduction
 * - Volume normalization
 * - High-pass filtering
 * - Voice Activity Detection (VAD)
 * 
 * @module AudioPreprocessor
 */

// ===========================================
// CONFIGURATION
// ===========================================

export const PREPROCESSOR_CONFIG = {
    // Target format for Whisper
    targetSampleRate: 16000,
    targetChannels: 1,
    
    // Normalization
    targetLoudness: -20,  // dBFS
    maxPeak: -1,          // dBFS (avoid clipping)
    
    // High-pass filter (remove low frequency noise)
    highPassFrequency: 80, // Hz
    highPassQ: 0.7,
    
    // Voice Activity Detection
    vadThreshold: 0.01,      // Minimum signal level
    vadMinSpeechMs: 200,     // Minimum speech duration
    vadMinSilenceMs: 300,    // Minimum silence to consider end
    
    // Noise reduction
    noiseFloor: -50,         // dB below which is considered noise
    spectralSubtractionFactor: 0.5
};

// ===========================================
// AUDIO PREPROCESSOR CLASS
// ===========================================

export class AudioPreprocessor {
    constructor(config = {}) {
        this.config = { ...PREPROCESSOR_CONFIG, ...config };
        this.audioContext = null;
    }
    
    /**
     * Get or create AudioContext
     */
    getAudioContext() {
        if (!this.audioContext || this.audioContext.state === 'closed') {
            const AudioContextClass = window.AudioContext || window.webkitAudioContext;
            this.audioContext = new AudioContextClass({
                sampleRate: this.config.targetSampleRate
            });
        }
        return this.audioContext;
    }
    
    // ===========================================
    // MAIN PROCESSING PIPELINE
    // ===========================================
    
    /**
     * Full preprocessing pipeline
     * @param {Blob|ArrayBuffer|Float32Array} audio - Input audio
     * @returns {Promise<ProcessedAudio>}
     */
    async process(audio) {
        // Convert to Float32Array
        let audioData = await this.toFloat32Array(audio);
        
        // Get original sample rate if available
        const originalSampleRate = audio.sampleRate || 44100;
        
        // Step 1: Resample to 16kHz
        if (originalSampleRate !== this.config.targetSampleRate) {
            audioData = this.resample(audioData, originalSampleRate, this.config.targetSampleRate);
        }
        
        // Step 2: Convert to mono if needed
        if (audioData.numberOfChannels > 1) {
            audioData = this.toMono(audioData);
        }
        
        // Step 3: Apply high-pass filter (remove rumble)
        audioData = this.applyHighPassFilter(audioData);
        
        // Step 4: Noise reduction (simple spectral subtraction)
        audioData = this.reduceNoise(audioData);
        
        // Step 5: Normalize volume
        audioData = this.normalize(audioData);
        
        // Step 6: Voice Activity Detection
        const vadResult = this.detectVoiceActivity(audioData);
        
        // Step 7: Trim silence from start and end
        const trimmed = this.trimSilence(audioData, vadResult);
        
        return {
            data: trimmed.data,
            sampleRate: this.config.targetSampleRate,
            duration: trimmed.data.length / this.config.targetSampleRate,
            originalDuration: audioData.length / this.config.targetSampleRate,
            hasSpeech: vadResult.hasSpeech,
            speechRatio: vadResult.speechRatio,
            trimmedStart: trimmed.trimmedStart,
            trimmedEnd: trimmed.trimmedEnd,
            rmsLevel: this.calculateRMS(trimmed.data),
            peakLevel: this.calculatePeak(trimmed.data)
        };
    }
    
    /**
     * Quick process for real-time use
     * Only applies essential processing
     */
    async quickProcess(audio) {
        let audioData = await this.toFloat32Array(audio);
        
        // Just normalize and return
        audioData = this.normalize(audioData);
        
        return {
            data: audioData,
            sampleRate: this.config.targetSampleRate
        };
    }
    
    // ===========================================
    // CONVERSION
    // ===========================================
    
    /**
     * Convert various audio formats to Float32Array
     */
    async toFloat32Array(audio) {
        // Already Float32Array
        if (audio instanceof Float32Array) {
            return audio;
        }
        
        // Blob to ArrayBuffer
        if (audio instanceof Blob) {
            audio = await audio.arrayBuffer();
        }
        
        // ArrayBuffer - decode to AudioBuffer
        if (audio instanceof ArrayBuffer) {
            const audioContext = this.getAudioContext();
            try {
                const audioBuffer = await audioContext.decodeAudioData(audio);
                return audioBuffer.getChannelData(0);
            } catch (err) {
                console.error('Failed to decode audio:', err);
                throw new Error('Failed to decode audio data');
            }
        }
        
        // AudioBuffer
        if (audio.getChannelData) {
            return audio.getChannelData(0);
        }
        
        throw new Error('Unsupported audio format');
    }
    
    /**
     * Convert Float32Array to Blob
     */
    toBlob(audioData, sampleRate = 16000) {
        // Create WAV file
        const wavBuffer = this.encodeWAV(audioData, sampleRate);
        return new Blob([wavBuffer], { type: 'audio/wav' });
    }
    
    /**
     * Encode Float32Array as WAV
     */
    encodeWAV(samples, sampleRate = 16000) {
        const buffer = new ArrayBuffer(44 + samples.length * 2);
        const view = new DataView(buffer);
        
        // WAV header
        const writeString = (offset, string) => {
            for (let i = 0; i < string.length; i++) {
                view.setUint8(offset + i, string.charCodeAt(i));
            }
        };
        
        writeString(0, 'RIFF');
        view.setUint32(4, 36 + samples.length * 2, true);
        writeString(8, 'WAVE');
        writeString(12, 'fmt ');
        view.setUint32(16, 16, true);  // PCM format
        view.setUint16(20, 1, true);   // PCM format
        view.setUint16(22, 1, true);   // Mono
        view.setUint32(24, sampleRate, true);
        view.setUint32(28, sampleRate * 2, true); // Byte rate
        view.setUint16(32, 2, true);   // Block align
        view.setUint16(34, 16, true);  // Bits per sample
        writeString(36, 'data');
        view.setUint32(40, samples.length * 2, true);
        
        // Convert float samples to 16-bit PCM
        let offset = 44;
        for (let i = 0; i < samples.length; i++) {
            const sample = Math.max(-1, Math.min(1, samples[i]));
            view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
            offset += 2;
        }
        
        return buffer;
    }
    
    // ===========================================
    // RESAMPLING
    // ===========================================
    
    /**
     * Resample audio to target sample rate
     * Uses linear interpolation for simplicity
     */
    resample(audioData, fromRate, toRate) {
        if (fromRate === toRate) return audioData;
        
        const ratio = fromRate / toRate;
        const newLength = Math.round(audioData.length / ratio);
        const result = new Float32Array(newLength);
        
        for (let i = 0; i < newLength; i++) {
            const srcIndex = i * ratio;
            const srcIndexFloor = Math.floor(srcIndex);
            const srcIndexCeil = Math.min(srcIndexFloor + 1, audioData.length - 1);
            const fraction = srcIndex - srcIndexFloor;
            
            // Linear interpolation
            result[i] = audioData[srcIndexFloor] * (1 - fraction) + 
                       audioData[srcIndexCeil] * fraction;
        }
        
        return result;
    }
    
    /**
     * Convert stereo to mono
     */
    toMono(audioData) {
        // If it's already mono Float32Array, return as-is
        if (audioData instanceof Float32Array) {
            return audioData;
        }
        
        // AudioBuffer with multiple channels
        if (audioData.numberOfChannels > 1) {
            const channels = [];
            for (let i = 0; i < audioData.numberOfChannels; i++) {
                channels.push(audioData.getChannelData(i));
            }
            
            const mono = new Float32Array(channels[0].length);
            for (let i = 0; i < mono.length; i++) {
                let sum = 0;
                for (const channel of channels) {
                    sum += channel[i];
                }
                mono[i] = sum / channels.length;
            }
            return mono;
        }
        
        return audioData.getChannelData(0);
    }
    
    // ===========================================
    // FILTERING
    // ===========================================
    
    /**
     * Apply high-pass filter to remove low frequency noise
     */
    applyHighPassFilter(audioData) {
        const freq = this.config.highPassFrequency;
        const Q = this.config.highPassQ;
        const sampleRate = this.config.targetSampleRate;
        
        // Calculate biquad filter coefficients
        const w0 = 2 * Math.PI * freq / sampleRate;
        const alpha = Math.sin(w0) / (2 * Q);
        
        const b0 = (1 + Math.cos(w0)) / 2;
        const b1 = -(1 + Math.cos(w0));
        const b2 = (1 + Math.cos(w0)) / 2;
        const a0 = 1 + alpha;
        const a1 = -2 * Math.cos(w0);
        const a2 = 1 - alpha;
        
        // Normalize coefficients
        const nb0 = b0 / a0;
        const nb1 = b1 / a0;
        const nb2 = b2 / a0;
        const na1 = a1 / a0;
        const na2 = a2 / a0;
        
        // Apply filter
        const output = new Float32Array(audioData.length);
        let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
        
        for (let i = 0; i < audioData.length; i++) {
            const x0 = audioData[i];
            const y0 = nb0 * x0 + nb1 * x1 + nb2 * x2 - na1 * y1 - na2 * y2;
            
            output[i] = y0;
            
            x2 = x1;
            x1 = x0;
            y2 = y1;
            y1 = y0;
        }
        
        return output;
    }
    
    // ===========================================
    // NOISE REDUCTION
    // ===========================================
    
    /**
     * Simple noise reduction using spectral subtraction
     * Good for steady-state noise like fans or hum
     */
    reduceNoise(audioData) {
        // Estimate noise floor from first 100ms (assume silence)
        const noiseSamples = Math.min(
            Math.round(0.1 * this.config.targetSampleRate),
            Math.floor(audioData.length / 10)
        );
        
        // Calculate noise floor RMS
        let noiseSum = 0;
        for (let i = 0; i < noiseSamples; i++) {
            noiseSum += audioData[i] * audioData[i];
        }
        const noiseRMS = Math.sqrt(noiseSum / noiseSamples);
        
        // Apply soft noise gate
        const threshold = noiseRMS * 2; // 6dB above noise floor
        const factor = this.config.spectralSubtractionFactor;
        
        const output = new Float32Array(audioData.length);
        
        for (let i = 0; i < audioData.length; i++) {
            const sample = audioData[i];
            const level = Math.abs(sample);
            
            if (level < threshold) {
                // Reduce low-level signals
                output[i] = sample * (1 - factor * (threshold - level) / threshold);
            } else {
                output[i] = sample;
            }
        }
        
        return output;
    }
    
    // ===========================================
    // NORMALIZATION
    // ===========================================
    
    /**
     * Normalize audio volume
     */
    normalize(audioData) {
        const peak = this.calculatePeak(audioData);
        
        if (peak === 0) return audioData;
        
        // Target peak level in linear scale
        const targetPeak = Math.pow(10, this.config.maxPeak / 20);
        const gain = targetPeak / peak;
        
        // Apply gain (with limiting)
        const output = new Float32Array(audioData.length);
        for (let i = 0; i < audioData.length; i++) {
            output[i] = Math.max(-1, Math.min(1, audioData[i] * gain));
        }
        
        return output;
    }
    
    /**
     * Calculate RMS level
     */
    calculateRMS(audioData) {
        let sum = 0;
        for (let i = 0; i < audioData.length; i++) {
            sum += audioData[i] * audioData[i];
        }
        return Math.sqrt(sum / audioData.length);
    }
    
    /**
     * Calculate peak level
     */
    calculatePeak(audioData) {
        let peak = 0;
        for (let i = 0; i < audioData.length; i++) {
            const abs = Math.abs(audioData[i]);
            if (abs > peak) peak = abs;
        }
        return peak;
    }
    
    // ===========================================
    // VOICE ACTIVITY DETECTION
    // ===========================================
    
    /**
     * Detect voice activity in audio
     */
    detectVoiceActivity(audioData) {
        const frameSize = Math.round(this.config.targetSampleRate * 0.02); // 20ms frames
        const threshold = this.config.vadThreshold;
        
        const frames = [];
        let speechFrames = 0;
        
        for (let i = 0; i < audioData.length; i += frameSize) {
            const frame = audioData.slice(i, i + frameSize);
            const energy = this.calculateRMS(frame);
            const isSpeech = energy > threshold;
            
            frames.push({
                start: i,
                end: Math.min(i + frameSize, audioData.length),
                energy,
                isSpeech
            });
            
            if (isSpeech) speechFrames++;
        }
        
        // Find speech regions
        const speechRegions = this.findSpeechRegions(frames);
        
        return {
            frames,
            speechRegions,
            hasSpeech: speechRegions.length > 0,
            speechFrames,
            totalFrames: frames.length,
            speechRatio: speechFrames / frames.length
        };
    }
    
    /**
     * Find continuous speech regions
     */
    findSpeechRegions(frames) {
        const regions = [];
        let currentRegion = null;
        
        const minSpeechFrames = Math.ceil(
            this.config.vadMinSpeechMs / 20  // 20ms per frame
        );
        const minSilenceFrames = Math.ceil(
            this.config.vadMinSilenceMs / 20
        );
        
        let silenceCount = 0;
        
        for (let i = 0; i < frames.length; i++) {
            const frame = frames[i];
            
            if (frame.isSpeech) {
                if (!currentRegion) {
                    currentRegion = { start: frame.start, end: frame.end };
                } else {
                    currentRegion.end = frame.end;
                }
                silenceCount = 0;
            } else {
                if (currentRegion) {
                    silenceCount++;
                    if (silenceCount >= minSilenceFrames) {
                        // End of speech region
                        if ((currentRegion.end - currentRegion.start) >= minSpeechFrames * 20 * 16) {
                            regions.push(currentRegion);
                        }
                        currentRegion = null;
                        silenceCount = 0;
                    }
                }
            }
        }
        
        // Handle final region
        if (currentRegion) {
            regions.push(currentRegion);
        }
        
        return regions;
    }
    
    /**
     * Trim silence from start and end
     */
    trimSilence(audioData, vadResult) {
        if (!vadResult.hasSpeech || vadResult.speechRegions.length === 0) {
            return {
                data: audioData,
                trimmedStart: 0,
                trimmedEnd: 0
            };
        }
        
        // Find first and last speech
        const firstSpeech = vadResult.speechRegions[0];
        const lastSpeech = vadResult.speechRegions[vadResult.speechRegions.length - 1];
        
        // Add small padding (50ms)
        const padding = Math.round(0.05 * this.config.targetSampleRate);
        const start = Math.max(0, firstSpeech.start - padding);
        const end = Math.min(audioData.length, lastSpeech.end + padding);
        
        return {
            data: audioData.slice(start, end),
            trimmedStart: start,
            trimmedEnd: audioData.length - end
        };
    }
    
    // ===========================================
    // CLEANUP
    // ===========================================
    
    /**
     * Close audio context and cleanup
     */
    destroy() {
        if (this.audioContext && this.audioContext.state !== 'closed') {
            this.audioContext.close();
        }
        this.audioContext = null;
    }
}

// ===========================================
// SINGLETON INSTANCE
// ===========================================

let preprocessorInstance = null;

/**
 * Get shared preprocessor instance
 */
export function getAudioPreprocessor(config = {}) {
    if (!preprocessorInstance) {
        preprocessorInstance = new AudioPreprocessor(config);
    }
    return preprocessorInstance;
}

// ===========================================
// CONVENIENCE FUNCTIONS
// ===========================================

/**
 * Process audio blob for speech recognition
 */
export async function prepareForRecognition(audioBlob) {
    const preprocessor = getAudioPreprocessor();
    return await preprocessor.process(audioBlob);
}

/**
 * Convert audio to WAV format
 */
export async function convertToWAV(audio) {
    const preprocessor = getAudioPreprocessor();
    const processed = await preprocessor.process(audio);
    return preprocessor.toBlob(processed.data, processed.sampleRate);
}

/**
 * Quick check if audio has speech
 */
export async function hasSpeech(audio) {
    const preprocessor = getAudioPreprocessor();
    const audioData = await preprocessor.toFloat32Array(audio);
    const vad = preprocessor.detectVoiceActivity(audioData);
    return vad.hasSpeech;
}

// ===========================================
// DEFAULT EXPORT
// ===========================================

export default {
    AudioPreprocessor,
    PREPROCESSOR_CONFIG,
    getAudioPreprocessor,
    prepareForRecognition,
    convertToWAV,
    hasSpeech
};
