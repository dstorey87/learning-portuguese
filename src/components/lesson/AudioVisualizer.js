/**
 * AudioVisualizer.js
 * Real-time visual feedback components for pronunciation practice
 * 
 * Features:
 * - Waveform visualization (SPEECH-030)
 * - Volume level indicator (SPEECH-031)
 * - Recording state animations (SPEECH-032)
 */

/**
 * Audio Visualizer configuration
 */
export const VISUALIZER_CONFIG = {
    // Waveform settings
    waveform: {
        width: 280,
        height: 60,
        lineWidth: 2,
        fftSize: 256,
        smoothingTimeConstant: 0.8
    },
    // Volume meter settings
    volume: {
        thresholds: {
            tooQuiet: 10,
            good: 20,
            tooLoud: 80
        },
        updateInterval: 50 // ms
    },
    // Animation durations
    animation: {
        pulse: 1000,
        fadeIn: 300,
        fadeOut: 200
    },
    // Colors
    colors: {
        waveform: {
            line: 'var(--accent, #667eea)',
            background: 'var(--surface-subtle, #f8fafc)'
        },
        volume: {
            quiet: '#f59e0b',
            good: '#22c55e',
            loud: '#ef4444',
            track: 'var(--surface-subtle, #e5e7eb)'
        },
        recording: {
            active: '#ef4444',
            ready: '#22c55e',
            processing: '#3b82f6'
        }
    }
};

/**
 * Recording states for UI
 */
export const RECORDING_STATE = {
    IDLE: 'idle',
    READY: 'ready',
    COUNTDOWN: 'countdown',
    RECORDING: 'recording',
    PROCESSING: 'processing',
    COMPLETE: 'complete',
    ERROR: 'error'
};

/**
 * AudioVisualizer class
 * Manages visual feedback during pronunciation practice
 */
export class AudioVisualizer {
    constructor(options = {}) {
        this.config = { ...VISUALIZER_CONFIG, ...options };
        this.audioContext = null;
        this.analyser = null;
        this.mediaStream = null;
        this.isActive = false;
        this.animationFrameId = null;
        this.volumeIntervalId = null;
        
        // DOM elements
        this.container = null;
        this.canvas = null;
        this.canvasCtx = null;
        this.volumeMeter = null;
        this.stateIndicator = null;
        
        // State
        this.currentState = RECORDING_STATE.IDLE;
        this.onStateChange = options.onStateChange || null;
        this.onVolumeChange = options.onVolumeChange || null;
    }
    
    /**
     * Initialize the visualizer in a container
     * @param {HTMLElement} container - Parent element for visualizer
     * @returns {HTMLElement} The created visualizer element
     */
    create(container) {
        this.container = container;
        
        // Create wrapper
        const wrapper = document.createElement('div');
        wrapper.className = 'audio-visualizer';
        wrapper.innerHTML = `
            <div class="visualizer-state" id="vizState">
                <div class="state-icon">🎤</div>
                <div class="state-text">Ready to listen</div>
            </div>
            <canvas class="visualizer-waveform" id="vizWaveform" 
                width="${this.config.waveform.width}" 
                height="${this.config.waveform.height}">
            </canvas>
            <div class="visualizer-volume" id="vizVolume">
                <div class="volume-label">Volume</div>
                <div class="volume-track">
                    <div class="volume-fill" id="volumeFill"></div>
                </div>
                <div class="volume-status" id="volumeStatus">Ready</div>
            </div>
        `;
        
        container.appendChild(wrapper);
        
        // Store references
        this.canvas = wrapper.querySelector('#vizWaveform');
        this.canvasCtx = this.canvas.getContext('2d');
        this.volumeMeter = wrapper.querySelector('#vizVolume');
        this.stateIndicator = wrapper.querySelector('#vizState');
        
        // Set initial state
        this.setState(RECORDING_STATE.IDLE);
        
        return wrapper;
    }
    
    /**
     * Start audio visualization
     * @param {MediaStream} stream - Audio stream from getUserMedia
     */
    async start(stream) {
        if (this.isActive) return;
        
        try {
            this.mediaStream = stream;
            
            // Create audio context and analyser
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.analyser = this.audioContext.createAnalyser();
            this.analyser.fftSize = this.config.waveform.fftSize;
            this.analyser.smoothingTimeConstant = this.config.waveform.smoothingTimeConstant;
            
            // Connect stream to analyser
            const source = this.audioContext.createMediaStreamSource(stream);
            source.connect(this.analyser);
            
            this.isActive = true;
            this.setState(RECORDING_STATE.RECORDING);
            
            // Start visualizations
            this._drawWaveform();
            this._updateVolumeMeter();
            
        } catch (err) {
            console.error('Failed to start audio visualization:', err);
            this.setState(RECORDING_STATE.ERROR);
            throw err;
        }
    }
    
    /**
     * Stop audio visualization
     */
    stop() {
        this.isActive = false;
        
        // Cancel animation frames
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
        
        // Clear volume interval
        if (this.volumeIntervalId) {
            clearInterval(this.volumeIntervalId);
            this.volumeIntervalId = null;
        }
        
        // Close audio context
        if (this.audioContext && this.audioContext.state !== 'closed') {
            this.audioContext.close();
        }
        
        this.audioContext = null;
        this.analyser = null;
        
        // Clear canvas
        if (this.canvasCtx) {
            this.canvasCtx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        }
        
        this.setState(RECORDING_STATE.IDLE);
    }
    
    /**
     * Set visualizer state
     * @param {string} state - One of RECORDING_STATE values
     * @param {Object} options - Additional state options
     */
    setState(state, options = {}) {
        this.currentState = state;
        
        if (!this.stateIndicator) return;
        
        const iconEl = this.stateIndicator.querySelector('.state-icon');
        const textEl = this.stateIndicator.querySelector('.state-text');
        
        // Remove all state classes
        this.stateIndicator.className = 'visualizer-state';
        
        switch (state) {
            case RECORDING_STATE.IDLE:
                iconEl.textContent = '🎤';
                textEl.textContent = 'Ready to listen';
                this.stateIndicator.classList.add('state-idle');
                break;
                
            case RECORDING_STATE.READY:
                iconEl.textContent = '🎯';
                textEl.textContent = 'Click to record';
                this.stateIndicator.classList.add('state-ready');
                break;
                
            case RECORDING_STATE.COUNTDOWN:
                iconEl.textContent = options.count || '3';
                textEl.textContent = 'Get ready...';
                this.stateIndicator.classList.add('state-countdown');
                break;
                
            case RECORDING_STATE.RECORDING:
                iconEl.textContent = '🔴';
                textEl.textContent = 'Listening...';
                this.stateIndicator.classList.add('state-recording', 'pulse');
                break;
                
            case RECORDING_STATE.PROCESSING:
                iconEl.textContent = '⏳';
                textEl.textContent = 'Processing...';
                this.stateIndicator.classList.add('state-processing', 'spin');
                break;
                
            case RECORDING_STATE.COMPLETE:
                iconEl.textContent = '✅';
                textEl.textContent = options.message || 'Done!';
                this.stateIndicator.classList.add('state-complete');
                break;
                
            case RECORDING_STATE.ERROR:
                iconEl.textContent = '❌';
                textEl.textContent = options.message || 'Error occurred';
                this.stateIndicator.classList.add('state-error');
                break;
        }
        
        // Trigger callback
        if (this.onStateChange) {
            this.onStateChange(state, options);
        }
    }
    
    /**
     * Run countdown before recording
     * @param {number} seconds - Countdown duration
     * @returns {Promise} Resolves when countdown complete
     */
    countdown(seconds = 3) {
        return new Promise((resolve) => {
            let count = seconds;
            
            const tick = () => {
                if (count > 0) {
                    this.setState(RECORDING_STATE.COUNTDOWN, { count });
                    count--;
                    setTimeout(tick, 1000);
                } else {
                    resolve();
                }
            };
            
            tick();
        });
    }
    
    /**
     * Draw waveform visualization
     * @private
     */
    _drawWaveform() {
        if (!this.isActive || !this.analyser) return;
        
        const bufferLength = this.analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        this.analyser.getByteTimeDomainData(dataArray);
        
        const { width, height } = this.canvas;
        const ctx = this.canvasCtx;
        
        // Clear canvas with background
        ctx.fillStyle = this.config.colors.waveform.background;
        ctx.fillRect(0, 0, width, height);
        
        // Draw center line
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, height / 2);
        ctx.lineTo(width, height / 2);
        ctx.stroke();
        
        // Draw waveform
        ctx.lineWidth = this.config.waveform.lineWidth;
        ctx.strokeStyle = this.config.colors.waveform.line;
        ctx.beginPath();
        
        const sliceWidth = width / bufferLength;
        let x = 0;
        
        for (let i = 0; i < bufferLength; i++) {
            const v = dataArray[i] / 128.0;
            const y = (v * height) / 2;
            
            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
            
            x += sliceWidth;
        }
        
        ctx.lineTo(width, height / 2);
        ctx.stroke();
        
        // Continue animation loop
        this.animationFrameId = requestAnimationFrame(() => this._drawWaveform());
    }
    
    /**
     * Update volume meter
     * @private
     */
    _updateVolumeMeter() {
        if (!this.isActive || !this.analyser) return;
        
        const update = () => {
            if (!this.isActive || !this.analyser) return;
            
            const dataArray = new Uint8Array(this.analyser.frequencyBinCount);
            this.analyser.getByteFrequencyData(dataArray);
            
            // Calculate average volume
            const sum = dataArray.reduce((a, b) => a + b, 0);
            const avg = sum / dataArray.length;
            const volume = Math.round((avg / 255) * 100);
            
            this._setVolumeLevel(volume);
            
            // Trigger callback
            if (this.onVolumeChange) {
                this.onVolumeChange(volume);
            }
        };
        
        // Update at regular intervals
        this.volumeIntervalId = setInterval(update, this.config.volume.updateInterval);
        update(); // Initial update
    }
    
    /**
     * Set volume meter level
     * @private
     * @param {number} level - Volume level (0-100)
     */
    _setVolumeLevel(level) {
        if (!this.volumeMeter) return;
        
        const fill = this.volumeMeter.querySelector('#volumeFill');
        const status = this.volumeMeter.querySelector('#volumeStatus');
        
        if (!fill || !status) return;
        
        const { thresholds } = this.config.volume;
        const colors = this.config.colors.volume;
        
        // Set fill width
        fill.style.width = `${Math.min(100, level)}%`;
        
        // Set color and status based on thresholds
        if (level < thresholds.tooQuiet) {
            fill.style.backgroundColor = colors.quiet;
            status.textContent = 'Too quiet - speak louder';
            status.className = 'volume-status status-quiet';
        } else if (level > thresholds.tooLoud) {
            fill.style.backgroundColor = colors.loud;
            status.textContent = 'Too loud - move back';
            status.className = 'volume-status status-loud';
        } else {
            fill.style.backgroundColor = colors.good;
            status.textContent = 'Good level ✓';
            status.className = 'volume-status status-good';
        }
    }
    
    /**
     * Show temporary message
     * @param {string} message - Message to display
     * @param {string} type - 'success' | 'error' | 'info'
     * @param {number} duration - Display duration in ms
     */
    showMessage(message, type = 'info', duration = 2000) {
        if (!this.stateIndicator) return;
        
        const textEl = this.stateIndicator.querySelector('.state-text');
        const iconEl = this.stateIndicator.querySelector('.state-icon');
        
        // Store original content
        const originalText = textEl.textContent;
        const originalIcon = iconEl.textContent;
        const originalClass = this.stateIndicator.className;
        
        // Set message
        textEl.textContent = message;
        iconEl.textContent = type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️';
        this.stateIndicator.className = `visualizer-state state-${type}`;
        
        // Restore after duration
        setTimeout(() => {
            textEl.textContent = originalText;
            iconEl.textContent = originalIcon;
            this.stateIndicator.className = originalClass;
        }, duration);
    }
    
    /**
     * Destroy the visualizer and clean up
     */
    destroy() {
        this.stop();
        
        if (this.container) {
            const wrapper = this.container.querySelector('.audio-visualizer');
            if (wrapper) {
                wrapper.remove();
            }
        }
        
        this.container = null;
        this.canvas = null;
        this.canvasCtx = null;
        this.volumeMeter = null;
        this.stateIndicator = null;
    }
}

/**
 * Create a standalone waveform visualizer
 * @param {HTMLElement} container - Container element
 * @param {Object} options - Configuration options
 * @returns {Object} Visualizer controls
 */
export function createWaveformVisualizer(container, options = {}) {
    const config = { ...VISUALIZER_CONFIG.waveform, ...options };
    
    const canvas = document.createElement('canvas');
    canvas.className = 'waveform-canvas';
    canvas.width = config.width;
    canvas.height = config.height;
    container.appendChild(canvas);
    
    const ctx = canvas.getContext('2d');
    let analyser = null;
    let animationId = null;
    let isRunning = false;
    
    const draw = () => {
        if (!isRunning || !analyser) return;
        
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        analyser.getByteTimeDomainData(dataArray);
        
        ctx.fillStyle = config.background || 'var(--surface-subtle)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.lineWidth = config.lineWidth || 2;
        ctx.strokeStyle = config.color || 'var(--accent)';
        ctx.beginPath();
        
        const sliceWidth = canvas.width / bufferLength;
        let x = 0;
        
        for (let i = 0; i < bufferLength; i++) {
            const v = dataArray[i] / 128.0;
            const y = (v * canvas.height) / 2;
            
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
            
            x += sliceWidth;
        }
        
        ctx.stroke();
        animationId = requestAnimationFrame(draw);
    };
    
    return {
        canvas,
        start(audioAnalyser) {
            analyser = audioAnalyser;
            isRunning = true;
            draw();
        },
        stop() {
            isRunning = false;
            if (animationId) cancelAnimationFrame(animationId);
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        },
        destroy() {
            this.stop();
            canvas.remove();
        }
    };
}

/**
 * Create a standalone volume meter
 * @param {HTMLElement} container - Container element
 * @param {Object} options - Configuration options
 * @returns {Object} Meter controls
 */
export function createVolumeMeter(container, options = {}) {
    const config = { ...VISUALIZER_CONFIG.volume, ...options };
    
    const meter = document.createElement('div');
    meter.className = 'volume-meter-standalone';
    meter.innerHTML = `
        <div class="meter-bar">
            <div class="meter-fill"></div>
        </div>
        <div class="meter-label">Ready</div>
    `;
    container.appendChild(meter);
    
    const fill = meter.querySelector('.meter-fill');
    const label = meter.querySelector('.meter-label');
    
    return {
        element: meter,
        update(level) {
            fill.style.width = `${Math.min(100, level)}%`;
            
            if (level < config.thresholds.tooQuiet) {
                fill.style.backgroundColor = VISUALIZER_CONFIG.colors.volume.quiet;
                label.textContent = 'Speak louder';
            } else if (level > config.thresholds.tooLoud) {
                fill.style.backgroundColor = VISUALIZER_CONFIG.colors.volume.loud;
                label.textContent = 'Too loud';
            } else {
                fill.style.backgroundColor = VISUALIZER_CONFIG.colors.volume.good;
                label.textContent = 'Good ✓';
            }
        },
        reset() {
            fill.style.width = '0%';
            label.textContent = 'Ready';
        },
        destroy() {
            meter.remove();
        }
    };
}

// Default export
export default {
    AudioVisualizer,
    VISUALIZER_CONFIG,
    RECORDING_STATE,
    createWaveformVisualizer,
    createVolumeMeter
};
