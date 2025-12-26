/**
 * SileroVAD - Voice Activity Detection for Browser
 * 
 * Implements browser-based VAD using Silero VAD model via ONNX Runtime.
 * Detects speech start/end for efficient voice conversation.
 */

import * as Logger from '../Logger.js';

const VAD_CONFIG = {
    sampleRate: 16000,
    frameSamples: 1536,
    positiveSpeechThreshold: 0.5,
    negativeSpeechThreshold: 0.35,
    redemptionFrames: 8,
    preSpeechPadFrames: 1,
    minSpeechFrames: 3,
    submitUserSpeechOnPause: false
};

export class SileroVAD {
    constructor(config = {}) {
        this.config = { ...VAD_CONFIG, ...config };
        this.session = null;
        this.isListening = false;
        this.audioContext = null;
        this.workletNode = null;
        this.stream = null;
        this.state = { h: null, c: null, sr: null };
        this.frameBuffer = [];
        this.speaking = false;
        this.speechFrames = 0;
        this.silenceFrames = 0;
        this.callbacks = { onSpeechStart: null, onSpeechEnd: null, onVADMisfire: null };
    }

    async initialize() {
        try {
            if (typeof ort === 'undefined') {
                await this.loadONNXRuntime();
            }
            this.session = await ort.InferenceSession.create('/models/silero_vad.onnx', { executionProviders: ['wasm'] });
            this.initializeState();
            Logger.info('silero_vad', 'VAD initialized');
            return { success: true };
        } catch (error) {
            Logger.error('silero_vad', 'Initialization failed', { error: error.message });
            return { success: false, error: error.message };
        }
    }

    async loadONNXRuntime() {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/onnxruntime-web@1.17.0/dist/ort.min.js';
            script.onload = resolve;
            script.onerror = () => reject(new Error('Failed to load ONNX Runtime'));
            document.head.appendChild(script);
        });
    }

    initializeState() {
        const zeros = (shape) => new ort.Tensor('float32', new Float32Array(shape.reduce((a, b) => a * b, 1)), shape);
        this.state = { h: zeros([2, 1, 64]), c: zeros([2, 1, 64]), sr: new ort.Tensor('int64', BigInt64Array.from([BigInt(this.config.sampleRate)]), [1]) };
    }

    async start(callbacks = {}) {
        if (this.isListening) {
            Logger.warn('silero_vad', 'Already listening');
            return { success: false, error: 'Already listening' };
        }
        this.callbacks = { ...this.callbacks, ...callbacks };
        try {
            this.stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, sampleRate: this.config.sampleRate } });
            this.audioContext = new AudioContext({ sampleRate: this.config.sampleRate });
            await this.audioContext.audioWorklet.addModule(this.createWorkletProcessor());
            const source = this.audioContext.createMediaStreamSource(this.stream);
            this.workletNode = new AudioWorkletNode(this.audioContext, 'vad-processor');
            this.workletNode.port.onmessage = (event) => this.processAudioFrame(event.data);
            source.connect(this.workletNode);
            this.isListening = true;
            Logger.info('silero_vad', 'VAD started');
            return { success: true };
        } catch (error) {
            Logger.error('silero_vad', 'Failed to start', { error: error.message });
            return { success: false, error: error.message };
        }
    }

    createWorkletProcessor() {
        const processorCode = `
            class VADProcessor extends AudioWorkletProcessor {
                constructor() {
                    super();
                    this.buffer = [];
                    this.frameSamples = ${this.config.frameSamples};
                }
                process(inputs) {
                    const input = inputs[0][0];
                    if (!input) return true;
                    this.buffer.push(...input);
                    while (this.buffer.length >= this.frameSamples) {
                        const frame = this.buffer.splice(0, this.frameSamples);
                        this.port.postMessage(new Float32Array(frame));
                    }
                    return true;
                }
            }
            registerProcessor('vad-processor', VADProcessor);
        `;
        const blob = new Blob([processorCode], { type: 'application/javascript' });
        return URL.createObjectURL(blob);
    }

    async processAudioFrame(audioData) {
        if (!this.session) return;
        try {
            const inputTensor = new ort.Tensor('float32', audioData, [1, audioData.length]);
            const feeds = { input: inputTensor, h: this.state.h, c: this.state.c, sr: this.state.sr };
            const results = await this.session.run(feeds);
            const probability = results.output.data[0];
            this.state.h = results.hn;
            this.state.c = results.cn;
            this.handleVADResult(probability, audioData);
        } catch (error) {
            Logger.error('silero_vad', 'Frame processing failed', { error: error.message });
        }
    }

    handleVADResult(probability, audioData) {
        const isSpeech = probability > this.config.positiveSpeechThreshold;
        const isSilence = probability < this.config.negativeSpeechThreshold;
        if (isSpeech) {
            this.silenceFrames = 0;
            this.speechFrames++;
            this.frameBuffer.push(audioData);
            if (!this.speaking && this.speechFrames >= this.config.minSpeechFrames) {
                this.speaking = true;
                Logger.debug('silero_vad', 'Speech started');
                this.callbacks.onSpeechStart?.();
            }
        } else if (isSilence && this.speaking) {
            this.silenceFrames++;
            this.frameBuffer.push(audioData);
            if (this.silenceFrames >= this.config.redemptionFrames) {
                this.speaking = false;
                const speechAudio = this.combineFrames(this.frameBuffer);
                this.frameBuffer = [];
                this.speechFrames = 0;
                Logger.debug('silero_vad', 'Speech ended', { frames: speechAudio.length / this.config.frameSamples });
                this.callbacks.onSpeechEnd?.(speechAudio);
            }
        } else if (!this.speaking) {
            this.frameBuffer = this.frameBuffer.slice(-this.config.preSpeechPadFrames);
            this.speechFrames = 0;
        }
    }

    combineFrames(frames) {
        const totalLength = frames.reduce((sum, f) => sum + f.length, 0);
        const combined = new Float32Array(totalLength);
        let offset = 0;
        for (const frame of frames) {
            combined.set(frame, offset);
            offset += frame.length;
        }
        return combined;
    }

    stop() {
        if (!this.isListening) return;
        this.workletNode?.disconnect();
        this.stream?.getTracks().forEach(track => track.stop());
        this.audioContext?.close();
        this.isListening = false;
        this.speaking = false;
        this.frameBuffer = [];
        this.speechFrames = 0;
        this.silenceFrames = 0;
        this.initializeState();
        Logger.info('silero_vad', 'VAD stopped');
    }

    getStatus() {
        return { isListening: this.isListening, isSpeaking: this.speaking, sessionLoaded: !!this.session };
    }
}

let vadInstance = null;
export function getSileroVAD(config) {
    if (!vadInstance) vadInstance = new SileroVAD(config);
    return vadInstance;
}

export default SileroVAD;
