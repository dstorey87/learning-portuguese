/**
 * Edge-TTS Backend Server
 * Provides high-quality neural Portuguese TTS via Microsoft Edge API
 * Uses node-edge-tts for proper Node.js support
 * 
 * Voices supported:
 * - pt-PT-DuarteNeural (Male, Portugal) - Recommended for EU-PT
 * - pt-PT-RaquelNeural (Female, Portugal) - Recommended for EU-PT
 * - pt-BR-AntonioNeural (Male, Brazil)
 * - pt-BR-FranciscaNeural (Female, Brazil)
 * - pt-BR-MacerioMultilingualNeural (Male, Brazil, Multilingual)
 * - pt-BR-ThalitaMultilingualNeural (Female, Brazil, Multilingual)
 */

import express from 'express';
import cors from 'cors';
import { EdgeTTS } from 'node-edge-tts';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { randomUUID } from 'crypto';

// Global error handlers to prevent silent crashes
process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
});
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

const app = express();
const PORT = process.env.TTS_PORT || 3001;

// Voice catalog with metadata
const VOICE_CATALOG = {
    // English voices (for AI responses - must be clearly understandable)
    'en-GB-SoniaNeural': {
        name: 'Sonia',
        gender: 'female',
        locale: 'en-GB',
        region: 'United Kingdom',
        quality: 'neural',
        recommended: true,
        description: 'Clear British English female voice'
    },
    'en-US-JennyNeural': {
        name: 'Jenny',
        gender: 'female',
        locale: 'en-US',
        region: 'United States',
        quality: 'neural',
        recommended: true,
        description: 'Clear American English female voice'
    },
    'en-US-GuyNeural': {
        name: 'Guy',
        gender: 'male',
        locale: 'en-US',
        region: 'United States',
        quality: 'neural',
        description: 'Clear American English male voice'
    },
    // European Portuguese (preferred for EU-PT learning)
    'pt-PT-DuarteNeural': {
        name: 'Duarte',
        gender: 'male',
        locale: 'pt-PT',
        region: 'Portugal',
        quality: 'neural',
        recommended: true,
        description: 'Clear male voice, perfect for European Portuguese'
    },
    'pt-PT-RaquelNeural': {
        name: 'Raquel',
        gender: 'female',
        locale: 'pt-PT',
        region: 'Portugal',
        quality: 'neural',
        recommended: true,
        description: 'Natural female voice, great for beginners'
    },
    // Brazilian Portuguese (included for variety)
    'pt-BR-AntonioNeural': {
        name: 'António',
        gender: 'male',
        locale: 'pt-BR',
        region: 'Brazil',
        quality: 'neural',
        description: 'Brazilian male voice'
    },
    'pt-BR-FranciscaNeural': {
        name: 'Francisca',
        gender: 'female',
        locale: 'pt-BR',
        region: 'Brazil',
        quality: 'neural',
        description: 'Brazilian female voice'
    },
    'pt-BR-MacerioMultilingualNeural': {
        name: 'Macério',
        gender: 'male',
        locale: 'pt-BR',
        region: 'Brazil',
        quality: 'neural-multilingual',
        description: 'Multilingual male voice with wide language support'
    },
    'pt-BR-ThalitaMultilingualNeural': {
        name: 'Thalita',
        gender: 'female',
        locale: 'pt-BR',
        region: 'Brazil',
        quality: 'neural-multilingual',
        description: 'Multilingual female voice with wide language support'
    }
};

// Default to European Portuguese male voice (learner preference: consistent male voices)
const DEFAULT_VOICE = 'pt-PT-DuarteNeural';

// Temp directory for audio files
const TEMP_DIR = path.join(os.tmpdir(), 'portulingo-tts');
if (!fs.existsSync(TEMP_DIR)) {
    fs.mkdirSync(TEMP_DIR, { recursive: true });
}

// Cleanup old temp files periodically (files older than 5 minutes)
setInterval(() => {
    try {
        const files = fs.readdirSync(TEMP_DIR);
        const now = Date.now();
        files.forEach(file => {
            const filePath = path.join(TEMP_DIR, file);
            const stats = fs.statSync(filePath);
            if (now - stats.mtimeMs > 5 * 60 * 1000) {
                fs.unlinkSync(filePath);
            }
        });
    } catch (e) {
        // Ignore cleanup errors
    }
}, 60000);

app.use(cors({
    origin: ['http://localhost:4174', 'http://127.0.0.1:4174', 'http://localhost:4321', 'http://127.0.0.1:4321', 'http://localhost:5173'],
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type']
}));

app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        service: 'edge-tts',
        package: 'node-edge-tts',
        voices: Object.keys(VOICE_CATALOG).length,
        defaultVoice: DEFAULT_VOICE
    });
});

// Get available voices
app.get('/voices', (req, res) => {
    const voices = Object.entries(VOICE_CATALOG).map(([id, meta]) => ({
        id,
        ...meta,
        shortName: id,
        available: true
    }));
    
    // Group by region
    const portugal = voices.filter(v => v.locale === 'pt-PT');
    const brazil = voices.filter(v => v.locale === 'pt-BR');
    
    res.json({
        total: voices.length,
        portugal: {
            count: portugal.length,
            voices: portugal
        },
        brazil: {
            count: brazil.length,
            voices: brazil
        },
        all: voices,
        default: DEFAULT_VOICE,
        recommended: voices.filter(v => v.recommended)
    });
});

// Convert rate from percentage string to node-edge-tts format
function parseRate(rateStr) {
    if (!rateStr || rateStr === '+0%' || rateStr === 'default') {
        return 'default';
    }
    return rateStr;
}

// Text-to-speech endpoint
app.post('/tts', async (req, res) => {
    const { text, voice = DEFAULT_VOICE, rate = '+0%', pitch = '+0Hz' } = req.body;
    
    if (!text || typeof text !== 'string' || text.trim().length === 0) {
        return res.status(400).json({ error: 'Text is required' });
    }
    
    // Sanitize text
    const sanitizedText = text.trim().slice(0, 5000);
    
    // Validate voice - default to PT-PT if invalid
    const selectedVoice = VOICE_CATALOG[voice] ? voice : DEFAULT_VOICE;
    const voiceMeta = VOICE_CATALOG[selectedVoice];
    
    // Generate unique temp file path
    const tempFile = path.join(TEMP_DIR, `${randomUUID()}.mp3`);
    
    try {
        // Create EdgeTTS instance with selected voice
        const ttsEngine = new EdgeTTS({
            voice: selectedVoice,
            lang: voiceMeta.locale,
            outputFormat: 'audio-24khz-48kbitrate-mono-mp3',
            rate: parseRate(rate),
            pitch: pitch === '+0Hz' ? 'default' : pitch,
            timeout: 15000
        });
        
        // Generate audio file
        await ttsEngine.ttsPromise(sanitizedText, tempFile);
        
        // Read the file and send it
        const audioBuffer = fs.readFileSync(tempFile);
        
        // Clean up temp file
        fs.unlinkSync(tempFile);
        // Also clean up subtitle file if it was created
        const subtitleFile = tempFile + '.json';
        if (fs.existsSync(subtitleFile)) {
            fs.unlinkSync(subtitleFile);
        }
        
        res.set({
            'Content-Type': 'audio/mpeg',
            'Content-Length': audioBuffer.length,
            'X-Voice-Used': selectedVoice,
            'X-Voice-Name': voiceMeta.name,
            'X-Voice-Region': voiceMeta.region
        });
        
        res.send(audioBuffer);
        
    } catch (error) {
        // Clean up temp file on error
        try {
            if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile);
        } catch (e) { /* ignore */ }
        
        console.error('TTS generation failed:', error);
        res.status(500).json({ 
            error: 'TTS generation failed',
            message: error.message || String(error),
            voice: selectedVoice
        });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`
╔══════════════════════════════════════════════════════════════╗
║           🎤 Edge-TTS Server Running                         ║
╠══════════════════════════════════════════════════════════════╣
║  Port: ${PORT}                                                  ║
║  Health: http://localhost:${PORT}/health                        ║
║  Voices: http://localhost:${PORT}/voices                        ║
║  TTS:    POST http://localhost:${PORT}/tts                      ║
╠══════════════════════════════════════════════════════════════╣
║  English Voices (for explanations):                          ║
║  🇬🇧 UK:      Sonia (F) ← Recommended                          ║
║  🇺🇸 US:      Jenny (F), Guy (M)                               ║
╠══════════════════════════════════════════════════════════════╣
║  Portuguese Voices (for examples):                           ║
║  🇵🇹 Portugal: Duarte (M), Raquel (F) ← Recommended           ║
║  🇧🇷 Brazil:   António (M), Francisca (F),                    ║
║               Macério (M), Thalita (F)                       ║
╚══════════════════════════════════════════════════════════════╝
    `);
});

export default app;
