/**
 * VoiceConversation - Real-Time Voice Interaction Pipeline
 * 
 * Implements the full voice conversation flow:
 * VAD → STT → LLM → TTS with <300ms latency target
 */

import * as Logger from '../Logger.js';
import { getSileroVAD } from './SileroVAD.js';
import { getAIAgent } from '../ai/AIAgent.js';
import { eventStream } from '../eventStreaming.js';

const VOICE_CONFIG = {
    sttEndpoint: 'http://localhost:5000/transcribe',
    ttsEndpoint: 'http://localhost:3001/synthesize',
    defaultVoice: 'pt-PT-DuarteNeural',
    speechRate: 1.0,
    autoPlay: true,
    silenceTimeout: 1500,
    maxRecordingTime: 30000
};

export class VoiceConversation {
    constructor(userId, config = {}) {
        this.userId = userId;
        this.config = { ...VOICE_CONFIG, ...config };
        this.vad = getSileroVAD();
        this.agent = getAIAgent(userId);
        this.isActive = false;
        this.audioQueue = [];
        this.currentAudio = null;
        this.metrics = { totalConversations: 0, averageLatency: 0, sttErrors: 0, ttsErrors: 0 };
        this.callbacks = { onTranscript: null, onResponse: null, onSpeaking: null, onListening: null, onError: null };
    }

    async initialize() {
        try {
            const vadInit = await this.vad.initialize();
            if (!vadInit.success) throw new Error(`VAD init failed: ${vadInit.error}`);
            const agentInit = await this.agent.initialize();
            if (!agentInit.success) Logger.warn('voice_conversation', 'Agent init failed, text-only mode');
            Logger.info('voice_conversation', 'Voice conversation initialized');
            return { success: true };
        } catch (error) {
            Logger.error('voice_conversation', 'Initialization failed', { error: error.message });
            return { success: false, error: error.message };
        }
    }

    async start(callbacks = {}) {
        if (this.isActive) return { success: false, error: 'Already active' };
        this.callbacks = { ...this.callbacks, ...callbacks };
        try {
            const result = await this.vad.start({
                onSpeechStart: () => this.handleSpeechStart(),
                onSpeechEnd: (audio) => this.handleSpeechEnd(audio)
            });
            if (!result.success) throw new Error(result.error);
            this.isActive = true;
            this.metrics.totalConversations++;
            try { eventStream.track('voice_conversation_start', { userId: this.userId }); } catch (e) { /* ignore */ }
            Logger.info('voice_conversation', 'Voice conversation started');
            this.callbacks.onListening?.();
            return { success: true };
        } catch (error) {
            Logger.error('voice_conversation', 'Failed to start', { error: error.message });
            return { success: false, error: error.message };
        }
    }

    handleSpeechStart() {
        Logger.debug('voice_conversation', 'User speaking');
        this.stopCurrentAudio();
        this.callbacks.onSpeaking?.('user');
    }

    async handleSpeechEnd(audioData) {
        Logger.debug('voice_conversation', 'Processing speech', { samples: audioData.length });
        const startTime = Date.now();
        try {
            const transcript = await this.transcribe(audioData);
            if (!transcript || transcript.trim().length === 0) {
                Logger.debug('voice_conversation', 'Empty transcript, ignoring');
                this.callbacks.onListening?.();
                return;
            }
            this.callbacks.onTranscript?.(transcript);
            try { eventStream.track('voice_transcript', { userId: this.userId, transcript, audioLength: audioData.length / 16000 }); } catch (e) { /* ignore */ }
            const response = await this.agent.processInput(transcript, { source: 'voice' });
            if (!response.success) throw new Error(response.error);
            this.callbacks.onResponse?.(response.response);
            await this.speak(response.response);
            const latency = Date.now() - startTime;
            this.updateLatencyMetrics(latency);
            Logger.info('voice_conversation', 'Turn complete', { latency });
        } catch (error) {
            Logger.error('voice_conversation', 'Turn failed', { error: error.message });
            this.callbacks.onError?.(error.message);
        } finally {
            if (this.isActive) this.callbacks.onListening?.();
        }
    }

    async transcribe(audioData) {
        try {
            const wavBuffer = this.encodeWAV(audioData, 16000);
            const formData = new FormData();
            formData.append('audio', new Blob([wavBuffer], { type: 'audio/wav' }), 'speech.wav');
            formData.append('language', 'pt');
            const response = await fetch(this.config.sttEndpoint, { method: 'POST', body: formData, signal: AbortSignal.timeout(10000) });
            if (!response.ok) throw new Error(`STT error: ${response.status}`);
            const data = await response.json();
            return data.text || data.transcript || '';
        } catch (error) {
            this.metrics.sttErrors++;
            Logger.error('voice_conversation', 'Transcription failed', { error: error.message });
            throw error;
        }
    }

    encodeWAV(samples, sampleRate) {
        const buffer = new ArrayBuffer(44 + samples.length * 2);
        const view = new DataView(buffer);
        const writeString = (offset, string) => { for (let i = 0; i < string.length; i++) view.setUint8(offset + i, string.charCodeAt(i)); };
        writeString(0, 'RIFF');
        view.setUint32(4, 36 + samples.length * 2, true);
        writeString(8, 'WAVE');
        writeString(12, 'fmt ');
        view.setUint32(16, 16, true);
        view.setUint16(20, 1, true);
        view.setUint16(22, 1, true);
        view.setUint32(24, sampleRate, true);
        view.setUint32(28, sampleRate * 2, true);
        view.setUint16(32, 2, true);
        view.setUint16(34, 16, true);
        writeString(36, 'data');
        view.setUint32(40, samples.length * 2, true);
        const offset = 44;
        for (let i = 0; i < samples.length; i++) {
            const s = Math.max(-1, Math.min(1, samples[i]));
            view.setInt16(offset + i * 2, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
        }
        return buffer;
    }

    async speak(text) {
        if (!text) return;
        this.callbacks.onSpeaking?.('assistant');
        try {
            const response = await fetch(this.config.ttsEndpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text, voice: this.config.defaultVoice, rate: this.config.speechRate }),
                signal: AbortSignal.timeout(15000)
            });
            if (!response.ok) throw new Error(`TTS error: ${response.status}`);
            const audioBlob = await response.blob();
            const audioUrl = URL.createObjectURL(audioBlob);
            await this.playAudio(audioUrl);
            URL.revokeObjectURL(audioUrl);
            try {
                eventStream.track('tts_played', { userId: this.userId, timestamp: Date.now(), textLength: text.length });
            } catch (e) { /* ignore if no user logged in */ }
        } catch (error) {
            this.metrics.ttsErrors++;
            Logger.error('voice_conversation', 'TTS failed', { error: error.message });
        }
    }

    playAudio(url) {
        return new Promise((resolve, reject) => {
            this.currentAudio = new Audio(url);
            this.currentAudio.onended = () => { this.currentAudio = null; resolve(); };
            this.currentAudio.onerror = (e) => { this.currentAudio = null; reject(e); };
            this.currentAudio.play().catch(reject);
        });
    }

    stopCurrentAudio() {
        if (this.currentAudio) {
            this.currentAudio.pause();
            this.currentAudio = null;
        }
    }

    updateLatencyMetrics(latency) {
        const n = this.metrics.totalConversations;
        this.metrics.averageLatency = (this.metrics.averageLatency * (n - 1) + latency) / n;
    }

    stop() {
        if (!this.isActive) return;
        this.vad.stop();
        this.stopCurrentAudio();
        this.isActive = false;
        try {
            eventStream.track('voice_conversation_end', { userId: this.userId, timestamp: Date.now(), metrics: this.metrics });
        } catch (e) { /* ignore if no user logged in */ }
        Logger.info('voice_conversation', 'Voice conversation stopped', { metrics: this.metrics });
    }

    async speakText(text, voice, rate) {
        const originalVoice = this.config.defaultVoice;
        const originalRate = this.config.speechRate;
        if (voice) this.config.defaultVoice = voice;
        if (rate) this.config.speechRate = rate;
        try {
            await this.speak(text);
        } finally {
            this.config.defaultVoice = originalVoice;
            this.config.speechRate = originalRate;
        }
    }

    getStatus() {
        return { isActive: this.isActive, vadStatus: this.vad.getStatus(), metrics: this.metrics };
    }

    setVoice(voice) { this.config.defaultVoice = voice; }
    setSpeechRate(rate) { this.config.speechRate = Math.max(0.5, Math.min(2.0, rate)); }
}

let conversationInstance = null;
export function getVoiceConversation(userId) {
    if (!conversationInstance || conversationInstance.userId !== userId) {
        conversationInstance = new VoiceConversation(userId);
    }
    return conversationInstance;
}

export default VoiceConversation;
