/**
 * AudioRecorder Service
 * 
 * Professional audio recording service with:
 * - MediaRecorder integration
 * - Real-time audio analysis
 * - Stream management
 * - Event-driven architecture
 * 
 * @module AudioRecorder
 */

// ===========================================
// CONFIGURATION
// ===========================================

export const RECORDER_CONFIG = {
    // Audio constraints
    sampleRate: 16000,  // 16kHz for speech recognition
    channelCount: 1,    // Mono
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true,
    
    // Recording settings
    chunkIntervalMs: 100,   // Data collection interval
    maxDurationMs: 30000,   // Max recording time (30s)
    minDurationMs: 500,     // Min recording time (0.5s)
    
    // Audio formats (priority order)
    mimeTypes: [
        'audio/webm;codecs=opus',
        'audio/webm',
        'audio/ogg;codecs=opus',
        'audio/mp4'
    ]
};

export const RECORDER_STATES = {
    IDLE: 'idle',
    PREPARING: 'preparing',
    RECORDING: 'recording',
    PAUSED: 'paused',
    STOPPING: 'stopping',
    ERROR: 'error'
};

export const RECORDER_EVENTS = {
    STATE_CHANGE: 'stateChange',
    DATA: 'data',
    LEVEL: 'level',
    ERROR: 'error',
    COMPLETE: 'complete'
};

// ===========================================
// AUDIO RECORDER CLASS
// ===========================================

/**
 * AudioRecorder - Manages audio recording with real-time analysis
 */
export class AudioRecorder {
    constructor(config = {}) {
        this.config = { ...RECORDER_CONFIG, ...config };
        
        // State
        this.state = RECORDER_STATES.IDLE;
        this.mediaRecorder = null;
        this.audioStream = null;
        this.audioContext = null;
        this.analyser = null;
        this.chunks = [];
        this.startTime = null;
        
        // Event listeners
        this.listeners = new Map();
        
        // Level analysis
        this.levelInterval = null;
        this.dataArray = null;
    }
    
    // ===========================================
    // EVENT HANDLING
    // ===========================================
    
    /**
     * Subscribe to recorder events
     * @param {string} event - Event name from RECORDER_EVENTS
     * @param {Function} callback - Event handler
     * @returns {Function} Unsubscribe function
     */
    on(event, callback) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, new Set());
        }
        this.listeners.get(event).add(callback);
        
        return () => this.off(event, callback);
    }
    
    /**
     * Unsubscribe from event
     */
    off(event, callback) {
        this.listeners.get(event)?.delete(callback);
    }
    
    /**
     * Emit event to all listeners
     */
    emit(event, data) {
        this.listeners.get(event)?.forEach(cb => {
            try {
                cb(data);
            } catch (err) {
                console.error(`AudioRecorder event handler error:`, err);
            }
        });
    }
    
    /**
     * Update state and emit change
     */
    setState(newState) {
        const oldState = this.state;
        this.state = newState;
        this.emit(RECORDER_EVENTS.STATE_CHANGE, { oldState, newState });
    }
    
    // ===========================================
    // CAPABILITY CHECKS
    // ===========================================
    
    /**
     * Check if recording is supported in this browser
     */
    static isSupported() {
        return !!(
            navigator.mediaDevices?.getUserMedia &&
            window.MediaRecorder &&
            (window.AudioContext || window.webkitAudioContext)
        );
    }
    
    /**
     * Check if secure context (required for getUserMedia)
     */
    static isSecureContext() {
        return window.isSecureContext || 
            ['localhost', '127.0.0.1', '[::1]'].includes(location.hostname);
    }
    
    /**
     * Get supported MIME type
     */
    static getSupportedMimeType() {
        for (const mimeType of RECORDER_CONFIG.mimeTypes) {
            if (MediaRecorder.isTypeSupported(mimeType)) {
                return mimeType;
            }
        }
        return 'audio/webm'; // Fallback
    }
    
    /**
     * Enumerate available audio input devices
     */
    static async getAudioDevices() {
        if (!navigator.mediaDevices?.enumerateDevices) {
            return [];
        }
        
        try {
            const devices = await navigator.mediaDevices.enumerateDevices();
            return devices
                .filter(d => d.kind === 'audioinput')
                .map(d => ({
                    deviceId: d.deviceId,
                    label: d.label || 'Microphone',
                    groupId: d.groupId
                }));
        } catch (err) {
            console.error('Failed to enumerate audio devices:', err);
            return [];
        }
    }
    
    // ===========================================
    // RECORDING LIFECYCLE
    // ===========================================
    
    /**
     * Start recording
     * @param {Object} options - Recording options
     * @returns {Promise<void>}
     */
    async start(options = {}) {
        if (this.state === RECORDER_STATES.RECORDING) {
            throw new Error('Already recording');
        }
        
        this.setState(RECORDER_STATES.PREPARING);
        
        try {
            // Request microphone access
            const constraints = {
                audio: {
                    sampleRate: { ideal: this.config.sampleRate },
                    channelCount: { ideal: this.config.channelCount },
                    echoCancellation: { ideal: this.config.echoCancellation },
                    noiseSuppression: { ideal: this.config.noiseSuppression },
                    autoGainControl: { ideal: this.config.autoGainControl },
                    ...(options.deviceId && { deviceId: { exact: options.deviceId } })
                }
            };
            
            this.audioStream = await navigator.mediaDevices.getUserMedia(constraints);
            
            // Setup audio context for level analysis
            this.setupAudioAnalysis();
            
            // Setup MediaRecorder
            const mimeType = AudioRecorder.getSupportedMimeType();
            this.mediaRecorder = new MediaRecorder(this.audioStream, { mimeType });
            
            this.chunks = [];
            
            // Handle data chunks
            this.mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    this.chunks.push(event.data);
                    this.emit(RECORDER_EVENTS.DATA, { 
                        chunk: event.data, 
                        totalChunks: this.chunks.length,
                        duration: this.getDuration()
                    });
                }
            };
            
            // Handle stop
            this.mediaRecorder.onstop = () => {
                this.handleRecordingComplete();
            };
            
            // Handle errors
            this.mediaRecorder.onerror = (event) => {
                this.handleError(new Error(event.error?.message || 'Recording error'));
            };
            
            // Start recording
            this.mediaRecorder.start(this.config.chunkIntervalMs);
            this.startTime = Date.now();
            this.setState(RECORDER_STATES.RECORDING);
            
            // Start level monitoring
            this.startLevelMonitoring();
            
            // Set max duration timeout
            if (this.config.maxDurationMs) {
                this.maxDurationTimeout = setTimeout(() => {
                    if (this.state === RECORDER_STATES.RECORDING) {
                        this.stop();
                    }
                }, this.config.maxDurationMs);
            }
            
        } catch (err) {
            this.handleError(err);
            throw err;
        }
    }
    
    /**
     * Stop recording
     * @returns {Promise<AudioRecordingResult>}
     */
    async stop() {
        if (this.state !== RECORDER_STATES.RECORDING && 
            this.state !== RECORDER_STATES.PAUSED) {
            throw new Error('Not recording');
        }
        
        // Check minimum duration
        const duration = this.getDuration();
        if (duration < this.config.minDurationMs) {
            // Wait for minimum duration
            await new Promise(r => setTimeout(r, this.config.minDurationMs - duration));
        }
        
        this.setState(RECORDER_STATES.STOPPING);
        
        return new Promise((resolve, reject) => {
            const originalOnStop = this.mediaRecorder.onstop;
            
            this.mediaRecorder.onstop = () => {
                originalOnStop?.call(this.mediaRecorder);
                resolve(this.getResult());
            };
            
            this.mediaRecorder.onerror = (err) => {
                reject(err);
            };
            
            this.mediaRecorder.stop();
        });
    }
    
    /**
     * Pause recording
     */
    pause() {
        if (this.state !== RECORDER_STATES.RECORDING) {
            return;
        }
        
        if (this.mediaRecorder.state === 'recording') {
            this.mediaRecorder.pause();
            this.setState(RECORDER_STATES.PAUSED);
            this.stopLevelMonitoring();
        }
    }
    
    /**
     * Resume recording
     */
    resume() {
        if (this.state !== RECORDER_STATES.PAUSED) {
            return;
        }
        
        if (this.mediaRecorder.state === 'paused') {
            this.mediaRecorder.resume();
            this.setState(RECORDER_STATES.RECORDING);
            this.startLevelMonitoring();
        }
    }
    
    /**
     * Cancel recording and cleanup
     */
    cancel() {
        this.cleanup();
        this.setState(RECORDER_STATES.IDLE);
    }
    
    // ===========================================
    // AUDIO ANALYSIS
    // ===========================================
    
    /**
     * Setup audio context and analyser for level monitoring
     */
    setupAudioAnalysis() {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        this.audioContext = new AudioContextClass();
        
        this.analyser = this.audioContext.createAnalyser();
        this.analyser.fftSize = 256;
        this.analyser.smoothingTimeConstant = 0.8;
        
        const source = this.audioContext.createMediaStreamSource(this.audioStream);
        source.connect(this.analyser);
        
        this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);
    }
    
    /**
     * Start emitting audio level updates
     */
    startLevelMonitoring() {
        if (this.levelInterval) return;
        
        this.levelInterval = setInterval(() => {
            if (!this.analyser || this.state !== RECORDER_STATES.RECORDING) return;
            
            this.analyser.getByteFrequencyData(this.dataArray);
            
            // Calculate RMS level
            let sum = 0;
            for (let i = 0; i < this.dataArray.length; i++) {
                sum += this.dataArray[i] * this.dataArray[i];
            }
            const rms = Math.sqrt(sum / this.dataArray.length);
            
            // Normalize to 0-100
            const level = Math.min(100, Math.round((rms / 128) * 100));
            
            // Calculate peak
            const peak = Math.max(...this.dataArray);
            const peakLevel = Math.round((peak / 255) * 100);
            
            this.emit(RECORDER_EVENTS.LEVEL, { 
                level, 
                peakLevel,
                frequencies: this.dataArray.slice(),
                duration: this.getDuration()
            });
        }, 50); // 20 FPS
    }
    
    /**
     * Stop level monitoring
     */
    stopLevelMonitoring() {
        if (this.levelInterval) {
            clearInterval(this.levelInterval);
            this.levelInterval = null;
        }
    }
    
    /**
     * Get current audio level (0-100)
     */
    getCurrentLevel() {
        if (!this.analyser) return 0;
        
        this.analyser.getByteFrequencyData(this.dataArray);
        let sum = 0;
        for (let i = 0; i < this.dataArray.length; i++) {
            sum += this.dataArray[i] * this.dataArray[i];
        }
        return Math.min(100, Math.round((Math.sqrt(sum / this.dataArray.length) / 128) * 100));
    }
    
    // ===========================================
    // RESULT HANDLING
    // ===========================================
    
    /**
     * Handle recording completion
     */
    handleRecordingComplete() {
        this.stopLevelMonitoring();
        if (this.maxDurationTimeout) {
            clearTimeout(this.maxDurationTimeout);
        }
        
        const result = this.getResult();
        this.emit(RECORDER_EVENTS.COMPLETE, result);
        
        this.cleanup();
        this.setState(RECORDER_STATES.IDLE);
    }
    
    /**
     * Get recording result
     * @returns {AudioRecordingResult}
     */
    getResult() {
        const mimeType = this.mediaRecorder?.mimeType || 'audio/webm';
        const audioBlob = new Blob(this.chunks, { type: mimeType });
        
        return {
            blob: audioBlob,
            mimeType,
            duration: this.getDuration(),
            chunks: this.chunks.length,
            size: audioBlob.size,
            timestamp: Date.now()
        };
    }
    
    /**
     * Get raw audio data as ArrayBuffer
     * @returns {Promise<ArrayBuffer>}
     */
    async getArrayBuffer() {
        const result = this.getResult();
        return await result.blob.arrayBuffer();
    }
    
    /**
     * Get audio as Float32Array (for processing)
     * @returns {Promise<Float32Array>}
     */
    async getAudioData() {
        const arrayBuffer = await this.getArrayBuffer();
        const audioContext = new (window.AudioContext || window.webkitAudioContext)({
            sampleRate: this.config.sampleRate
        });
        
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
        return audioBuffer.getChannelData(0);
    }
    
    // ===========================================
    // ERROR HANDLING
    // ===========================================
    
    /**
     * Handle recording error
     */
    handleError(error) {
        console.error('AudioRecorder error:', error);
        
        // Map error types to user-friendly messages
        let userMessage = error.message;
        let errorType = 'unknown';
        
        if (error.name === 'NotAllowedError' || error.message.includes('Permission')) {
            errorType = 'permission-denied';
            userMessage = 'Microphone access denied. Please allow microphone access in your browser settings.';
        } else if (error.name === 'NotFoundError' || error.message.includes('not found')) {
            errorType = 'not-found';
            userMessage = 'No microphone found. Please connect a microphone and try again.';
        } else if (error.name === 'NotReadableError' || error.message.includes('in use')) {
            errorType = 'in-use';
            userMessage = 'Microphone is being used by another application. Please close other apps using your microphone.';
        } else if (error.name === 'OverconstrainedError') {
            errorType = 'overconstrained';
            userMessage = 'Could not configure microphone with requested settings.';
        } else if (error.name === 'SecurityError') {
            errorType = 'security';
            userMessage = 'Microphone access blocked. Please ensure you are on HTTPS or localhost.';
        }
        
        const errorData = {
            error,
            errorType,
            userMessage,
            timestamp: Date.now()
        };
        
        this.emit(RECORDER_EVENTS.ERROR, errorData);
        this.cleanup();
        this.setState(RECORDER_STATES.ERROR);
    }
    
    // ===========================================
    // CLEANUP
    // ===========================================
    
    /**
     * Clean up all resources
     */
    cleanup() {
        // Stop level monitoring
        this.stopLevelMonitoring();
        
        // Clear timeout
        if (this.maxDurationTimeout) {
            clearTimeout(this.maxDurationTimeout);
            this.maxDurationTimeout = null;
        }
        
        // Stop media recorder
        if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
            try {
                this.mediaRecorder.stop();
            } catch (e) {
                // Ignore
            }
        }
        this.mediaRecorder = null;
        
        // Stop audio stream tracks
        if (this.audioStream) {
            this.audioStream.getTracks().forEach(track => track.stop());
            this.audioStream = null;
        }
        
        // Close audio context
        if (this.audioContext && this.audioContext.state !== 'closed') {
            try {
                this.audioContext.close();
            } catch (e) {
                // Ignore
            }
        }
        this.audioContext = null;
        this.analyser = null;
        this.dataArray = null;
        
        // Clear chunks
        this.chunks = [];
        this.startTime = null;
    }
    
    // ===========================================
    // UTILITY
    // ===========================================
    
    /**
     * Get current recording duration in ms
     */
    getDuration() {
        if (!this.startTime) return 0;
        return Date.now() - this.startTime;
    }
    
    /**
     * Get current state
     */
    getState() {
        return this.state;
    }
    
    /**
     * Check if currently recording
     */
    isRecording() {
        return this.state === RECORDER_STATES.RECORDING;
    }
    
    /**
     * Check if paused
     */
    isPaused() {
        return this.state === RECORDER_STATES.PAUSED;
    }
    
    /**
     * Destroy recorder and cleanup
     */
    destroy() {
        this.cleanup();
        this.listeners.clear();
    }
}

// ===========================================
// SINGLETON INSTANCE
// ===========================================

let recorderInstance = null;

/**
 * Get shared AudioRecorder instance
 */
export function getAudioRecorder(config = {}) {
    if (!recorderInstance) {
        recorderInstance = new AudioRecorder(config);
    }
    return recorderInstance;
}

/**
 * Reset shared instance
 */
export function resetAudioRecorder() {
    if (recorderInstance) {
        recorderInstance.destroy();
        recorderInstance = null;
    }
}

// ===========================================
// CONVENIENCE FUNCTIONS
// ===========================================

/**
 * Quick record with promise-based API
 * @param {number} maxDurationMs - Maximum recording duration
 * @param {Object} options - Recording options
 * @returns {Promise<AudioRecordingResult>}
 */
export async function quickRecord(maxDurationMs = 5000, options = {}) {
    const recorder = new AudioRecorder({
        ...options,
        maxDurationMs
    });
    
    try {
        await recorder.start(options);
        
        // Wait for stop or max duration
        return new Promise((resolve, reject) => {
            recorder.on(RECORDER_EVENTS.COMPLETE, resolve);
            recorder.on(RECORDER_EVENTS.ERROR, reject);
            
            // Allow manual stop via returned controller
            if (options.onStart) {
                options.onStart({
                    stop: () => recorder.stop(),
                    cancel: () => recorder.cancel(),
                    getLevel: () => recorder.getCurrentLevel()
                });
            }
        });
    } catch (err) {
        recorder.destroy();
        throw err;
    }
}

/**
 * Check if recording is possible
 */
export function canRecord() {
    return AudioRecorder.isSupported() && AudioRecorder.isSecureContext();
}

/**
 * Request microphone permission
 * @returns {Promise<boolean>}
 */
export async function requestMicrophonePermission() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach(track => track.stop());
        return true;
    } catch (err) {
        console.error('Microphone permission denied:', err);
        return false;
    }
}

// ===========================================
// DEFAULT EXPORT
// ===========================================

export default {
    AudioRecorder,
    RECORDER_CONFIG,
    RECORDER_STATES,
    RECORDER_EVENTS,
    getAudioRecorder,
    resetAudioRecorder,
    quickRecord,
    canRecord,
    requestMicrophonePermission
};
