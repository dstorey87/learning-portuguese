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

import 'dotenv/config';
import compression from 'compression';
import cors from 'cors';
import express from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import morgan from 'morgan';
import { EdgeTTS } from 'node-edge-tts';
import fs from 'fs';
import { randomUUID } from 'crypto';
import os from 'os';
import path from 'path';
import multer from 'multer';
import { registerAuth } from './src/server/auth.js';
import { registerBilling } from './src/server/billing.js';

// Global error handlers to prevent silent crashes
process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
});
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

const ENV = process.env.NODE_ENV || 'development';
const PORT = Number(process.env.TTS_PORT || 3001);
const RATE_LIMIT_WINDOW_MS = Number(process.env.RATE_LIMIT_WINDOW_MS || 60000);
const RATE_LIMIT_MAX = Number(process.env.RATE_LIMIT_MAX || 90);

const ADDITIONAL_ORIGINS = (process.env.CORS_ORIGINS || '')
    .split(',')
    .map(origin => origin.trim())
    .filter(Boolean);

const app = express();
app.set('trust proxy', 1);

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

// Lesson asset/data locations for admin editing
const LESSON_CSV_DIR = path.join(process.cwd(), 'src', 'data', 'csv');
const LESSON_META_PATH = path.join(process.cwd(), 'src', 'data', 'lesson_metadata.json');
const LESSON_IMAGE_DIR = path.join(process.cwd(), 'assets', 'lesson-thumbs');

if (!fs.existsSync(LESSON_CSV_DIR)) fs.mkdirSync(LESSON_CSV_DIR, { recursive: true });
if (!fs.existsSync(LESSON_IMAGE_DIR)) fs.mkdirSync(LESSON_IMAGE_DIR, { recursive: true });

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

// Allow all local dev origins (including file:// which reports a null origin) so the
// browser can reach the TTS server from any local serve port.
const LOCAL_ORIGINS = [
    'http://localhost:4174',
    'http://127.0.0.1:4174',
    'http://localhost:4321',
    'http://127.0.0.1:4321',
    'http://localhost:5173',
    'http://127.0.0.1:5173'
];

function isLocalOrigin(origin = '') {
    if (!origin || origin === 'null') return true; // file:// requests present null
    if (LOCAL_ORIGINS.includes(origin)) return true;
    return /^https?:\/\/(localhost|127\.0\.0\.1):\d+$/i.test(origin);
}

function isAllowedOrigin(origin = '') {
    if (isLocalOrigin(origin)) return true;
    if (ADDITIONAL_ORIGINS.includes(origin)) return true;
    return false;
}

const upload = multer({
    storage: multer.diskStorage({
        destination: (req, file, cb) => cb(null, LESSON_IMAGE_DIR),
        filename: (req, file, cb) => {
            const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
            cb(null, `${Date.now()}_${safeName}`);
        }
    }),
    fileFilter: (req, file, cb) => {
        if (!file.mimetype.startsWith('image/')) {
            return cb(new Error('Only image uploads are allowed'));
        }
        cb(null, true);
    },
    limits: { fileSize: 5 * 1024 * 1024 }
});

app.use(helmet({
    crossOriginResourcePolicy: false,
    contentSecurityPolicy: false
}));

app.use(compression());

app.use(morgan('combined', {
    skip: (req) => req.path === '/health'
}));

app.use(cors({
    origin(origin, callback) {
        if (isAllowedOrigin(origin)) return callback(null, true);
        return callback(null, false);
    },
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'CSRF-Token'],
    credentials: true,
    optionsSuccessStatus: 200
}));

// Stripe webhook needs raw body and must skip JSON parser
app.use('/stripe/webhook', express.raw({ type: 'application/json' }));
app.use((req, res, next) => {
    if (req.originalUrl === '/stripe/webhook') return next();
    return express.json()(req, res, next);
});

registerAuth(app);
registerBilling(app);

const ttsLimiter = rateLimit({
    windowMs: RATE_LIMIT_WINDOW_MS,
    max: RATE_LIMIT_MAX,
    standardHeaders: true,
    legacyHeaders: false
});

app.use('/tts', ttsLimiter);

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        service: 'edge-tts',
        package: 'node-edge-tts',
        environment: ENV,
        voices: Object.keys(VOICE_CATALOG).length,
        defaultVoice: DEFAULT_VOICE,
        rateLimit: {
            windowMs: RATE_LIMIT_WINDOW_MS,
            max: RATE_LIMIT_MAX
        },
        allowedOrigins: {
            local: LOCAL_ORIGINS.length,
            additional: ADDITIONAL_ORIGINS.length
        }
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

function readLessonMetadata() {
    try {
        const raw = fs.readFileSync(LESSON_META_PATH, 'utf-8');
        return JSON.parse(raw);
    } catch (e) {
        console.error('Failed to read lesson metadata:', e.message);
        return { lessons: {}, categories: {}, displayConfig: {} };
    }
}

function writeLessonMetadata(meta) {
    fs.writeFileSync(LESSON_META_PATH, JSON.stringify(meta, null, 2));
}

function loadLessonCsv(csvFile) {
    const csvPath = path.join(LESSON_CSV_DIR, csvFile);
    if (!fs.existsSync(csvPath)) {
        throw new Error('CSV file not found');
    }
    return fs.readFileSync(csvPath, 'utf-8');
}

function rowsToCSV(rows = [], columns = []) {
    if (!rows.length) return '';
    const headers = columns.length ? columns : Object.keys(rows[0]);
    const escape = (val) => {
        const str = val === null || val === undefined ? '' : String(val);
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
            return '"' + str.replace(/"/g, '""') + '"';
        }
        return str;
    };
    const lines = [headers.join(',')];
    rows.forEach(row => {
        lines.push(headers.map(h => escape(row[h])).join(','));
    });
    return lines.join('\n');
}

function parseCsvServer(csvString = '') {
    const trimmed = csvString.trim();
    if (!trimmed) return { columns: [], rows: [] };
    const lines = trimmed.split('\n');
    if (lines.length < 1) return { columns: [], rows: [] };
    const headers = lines[0].split(',').map(h => h.trim());
    const rows = [];
    for (let i = 1; i < lines.length; i++) {
        const values = [];
        let current = '';
        let inQuotes = false;
        const line = lines[i];
        for (let j = 0; j < line.length; j++) {
            const char = line[j];
            if (char === '"') {
                if (inQuotes && line[j + 1] === '"') {
                    current += '"';
                    j++;
                } else {
                    inQuotes = !inQuotes;
                }
            } else if (char === ',' && !inQuotes) {
                values.push(current.trim());
                current = '';
            } else {
                current += char;
            }
        }
        values.push(current.trim());
        const row = {};
        headers.forEach((h, idx) => {
            row[h] = values[idx] ?? '';
        });
        if (Object.values(row).some(v => v !== '')) {
            rows.push(row);
        }
    }
    return { columns: headers, rows };
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
            'X-Voice-Region': voiceMeta.region,
            'Access-Control-Expose-Headers': 'X-Voice-Used, X-Voice-Name, X-Voice-Region'
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

// ============================================================================
// Admin Lesson Editing APIs (for GUI editor)
// ============================================================================

app.get('/admin/lessons', (req, res) => {
    const meta = readLessonMetadata();
    res.json({ lessons: Object.values(meta.lessons || {}), categories: meta.categories || {}, displayConfig: meta.displayConfig || {} });
});

app.get('/admin/lessons/:id', (req, res) => {
    const { id } = req.params;
    const meta = readLessonMetadata();
    const lesson = meta.lessons?.[id];
    if (!lesson) {
        return res.status(404).json({ error: 'Lesson not found' });
    }
    try {
        const csvText = loadLessonCsv(lesson.csvFile || `${id}.csv`);
        const parsed = parseCsvServer(csvText);
        res.json({ lesson, csv: { ...parsed, filename: lesson.csvFile || `${id}.csv` } });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.post('/admin/lessons/:id/meta', (req, res) => {
    const { id } = req.params;
    const meta = readLessonMetadata();
    if (!meta.lessons?.[id]) {
        return res.status(404).json({ error: 'Lesson not found' });
    }
    const updates = req.body || {};
    meta.lessons[id] = {
        ...meta.lessons[id],
        ...updates,
        id
    };
    try {
        writeLessonMetadata(meta);
        res.json({ lesson: meta.lessons[id] });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.post('/admin/lessons/:id/csv', (req, res) => {
    const { id } = req.params;
    const meta = readLessonMetadata();
    const lesson = meta.lessons?.[id];
    if (!lesson) return res.status(404).json({ error: 'Lesson not found' });
    const { rows, columns } = req.body || {};
    if (!Array.isArray(rows)) return res.status(400).json({ error: 'rows must be an array' });
    try {
        const csvText = rowsToCSV(rows, columns);
        const csvPath = path.join(LESSON_CSV_DIR, lesson.csvFile || `${id}.csv`);
        fs.writeFileSync(csvPath, csvText);
        res.json({ ok: true, rows: rows.length });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.post('/admin/lessons/:id/upload-image', upload.single('image'), (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    const relativePath = `assets/lesson-thumbs/${req.file.filename}`;
    res.json({ path: relativePath });
});

// ============================================================================
// Image Curator API (controls Python curator service)
// ============================================================================

import { spawn } from 'child_process';

let curatorProcess = null;
let curatorStatus = {
    status: 'offline',
    pid: null,
    startedAt: null,
    config: {},
    progress: { total: 0, processed: 0, succeeded: 0, failed: 0, skipped: 0 }
};

// Get curator status
app.get('/api/curator/status', (req, res) => {
    // Check if process is still running
    if (curatorProcess && curatorProcess.exitCode !== null) {
        curatorStatus.status = 'offline';
        curatorStatus.pid = null;
        curatorProcess = null;
    }
    
    res.json({
        ...curatorStatus,
        gpu: { available: true, count: 2 },  // TODO: Get from Python
        vision: { available: true, model: curatorStatus.config.model || 'gemma3:4b' },
        apis: {
            pexels: { enabled: true, keySet: !!process.env.PEXELS_API_KEY },
            pixabay: { enabled: false, keySet: !!process.env.PIXABAY_API_KEY }
        }
    });
});

// Start curator
app.post('/api/curator/start', (req, res) => {
    if (curatorProcess && curatorProcess.exitCode === null) {
        return res.status(400).json({ error: 'Curator already running', pid: curatorProcess.pid });
    }
    
    const config = req.body || {};
    const model = config.model || 'gemma3:4b';
    const candidates = config.candidates || 5;
    const useVision = config.useVision !== false;
    const lesson = config.lesson || null;
    
    // Build command args
    const args = [
        'batch_curator.py',
        '--model', model,
        '--candidates', String(candidates),
        '--num-gpu-layers', '20',  // Limit GPU usage
        '--min-score', '28'
    ];
    
    if (lesson) {
        args.push('--lesson', lesson);
    }
    
    if (!useVision) {
        args.push('--no-vision');
    }
    
    try {
        curatorProcess = spawn('python', args, {
            cwd: path.join(process.cwd(), 'image-curator'),
            env: { ...process.env },
            stdio: ['pipe', 'pipe', 'pipe']
        });
        
        curatorStatus = {
            status: 'running',
            pid: curatorProcess.pid,
            startedAt: new Date().toISOString(),
            config: { model, candidates, useVision, lesson },
            progress: { total: 0, processed: 0, succeeded: 0, failed: 0, skipped: 0 }
        };
        
        // Capture output for logging
        curatorProcess.stdout.on('data', (data) => {
            const output = data.toString();
            console.log('[Curator]', output);
            
            // Parse progress from output (basic parsing)
            const progressMatch = output.match(/(\d+)\/(\d+) words processed/);
            if (progressMatch) {
                curatorStatus.progress.processed = parseInt(progressMatch[1]);
                curatorStatus.progress.total = parseInt(progressMatch[2]);
            }
        });
        
        curatorProcess.stderr.on('data', (data) => {
            console.error('[Curator Error]', data.toString());
        });
        
        curatorProcess.on('exit', (code) => {
            console.log(`[Curator] Process exited with code ${code}`);
            curatorStatus.status = code === 0 ? 'completed' : 'error';
            curatorStatus.pid = null;
            curatorProcess = null;
        });
        
        res.json({ 
            status: 'started', 
            pid: curatorProcess.pid,
            config: curatorStatus.config
        });
        
    } catch (e) {
        console.error('Failed to start curator:', e);
        res.status(500).json({ error: 'Failed to start curator', message: e.message });
    }
});

// Stop curator
app.post('/api/curator/stop', (req, res) => {
    if (!curatorProcess || curatorProcess.exitCode !== null) {
        curatorStatus.status = 'offline';
        return res.json({ status: 'not_running' });
    }
    
    try {
        curatorProcess.kill('SIGTERM');
        curatorStatus.status = 'stopping';
        
        // Force kill after 5 seconds if not stopped
        setTimeout(() => {
            if (curatorProcess && curatorProcess.exitCode === null) {
                curatorProcess.kill('SIGKILL');
            }
        }, 5000);
        
        res.json({ status: 'stopping', pid: curatorProcess.pid });
        
    } catch (e) {
        res.status(500).json({ error: 'Failed to stop curator', message: e.message });
    }
});

app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    if (res.headersSent) return next(err);
    res.status(500).json({ error: 'Internal Server Error' });
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
