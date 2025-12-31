/**
 * AI Image Curator Console
 * 
 * Admin interface for the Python image curator service.
 * Features:
 * - Real-time status display (GPU, model, progress)
 * - WebSocket connection to curator service for live updates  
 * - Start/stop curator controls
 * - View candidate images and AI selections
 * - Manual override capabilities
 * 
 * @module pages/admin/ImageCuratorConsole
 */

import * as Logger from '../../services/Logger.js';

// ============================================================================
// CONSTANTS
// ============================================================================

const CURATOR_WS_PORT = 8765;
const CURATOR_API_BASE = 'http://localhost:3001';
const POLL_INTERVAL_MS = 3000;

// ============================================================================
// STATE
// ============================================================================

let curatorState = {
    status: 'offline', // 'offline', 'connecting', 'idle', 'running', 'paused', 'error'
    connected: false,
    ws: null,
    
    // GPU info
    gpu: {
        available: false,
        count: 0,
        gpus: [],
        selectedGpu: null,
        shouldThrottle: false
    },
    
    // Vision model info
    vision: {
        available: false,
        model: null,
        modelInfo: null
    },
    
    // API info
    apis: {
        pexels: { enabled: false, keySet: false },
        pixabay: { enabled: false, keySet: false }
    },
    
    // Progress
    progress: {
        total: 0,
        processed: 0,
        succeeded: 0,
        failed: 0,
        skipped: 0,
        percent: 0
    },
    
    // Current processing
    current: {
        word: null,
        translation: null,
        lesson: null,
        candidates: [],
        selected: null
    },
    
    // Activity log
    log: [],
    
    // Config
    config: {
        model: 'llama3.2-vision',
        candidatesPerWord: 3,
        resumeOnCrash: true,
        useVision: true
    },
    
    pollTimer: null,
    lastUpdate: null
};

// ============================================================================
// WEBSOCKET CONNECTION
// ============================================================================

function connectWebSocket() {
    if (curatorState.ws && curatorState.ws.readyState === WebSocket.OPEN) {
        Logger.debug('WebSocket already connected');
        return;
    }
    
    curatorState.status = 'connecting';
    addLogEntry('info', 'Connecting to curator service...');
    
    try {
        curatorState.ws = new WebSocket(`ws://localhost:${CURATOR_WS_PORT}`);
        
        curatorState.ws.onopen = () => {
            curatorState.connected = true;
            curatorState.status = 'idle';
            addLogEntry('success', 'Connected to curator service');
            refreshConsole();
        };
        
        curatorState.ws.onmessage = (event) => {
            try {
                const msg = JSON.parse(event.data);
                handleCuratorMessage(msg);
            } catch (e) {
                Logger.warn('Failed to parse curator message', { error: e.message });
            }
        };
        
        curatorState.ws.onerror = (error) => {
            Logger.error('Curator WebSocket error', { error });
            curatorState.status = 'error';
            addLogEntry('error', 'WebSocket connection error');
            refreshConsole();
        };
        
        curatorState.ws.onclose = () => {
            curatorState.connected = false;
            curatorState.status = 'offline';
            curatorState.ws = null;
            addLogEntry('info', 'Disconnected from curator service');
            refreshConsole();
        };
        
    } catch (e) {
        curatorState.status = 'offline';
        addLogEntry('error', `Failed to connect: ${e.message}`);
        refreshConsole();
    }
}

function disconnectWebSocket() {
    if (curatorState.ws) {
        curatorState.ws.close();
        curatorState.ws = null;
    }
    curatorState.connected = false;
    curatorState.status = 'offline';
}

function handleCuratorMessage(msg) {
    curatorState.lastUpdate = Date.now();
    
    switch (msg.type) {
        case 'status':
            updateStatus(msg.data);
            break;
            
        case 'gpu':
            curatorState.gpu = msg.data;
            break;
            
        case 'progress':
            curatorState.progress = { ...curatorState.progress, ...msg.data };
            curatorState.progress.percent = curatorState.progress.total > 0 
                ? Math.round((curatorState.progress.processed / curatorState.progress.total) * 100)
                : 0;
            break;
            
        case 'current_word':
            curatorState.current.word = msg.data.word;
            curatorState.current.translation = msg.data.translation;
            curatorState.current.lesson = msg.data.lesson;
            curatorState.current.candidates = [];
            curatorState.current.selected = null;
            addLogEntry('info', `Processing: ${msg.data.word} (${msg.data.translation})`);
            break;
            
        case 'candidates':
            curatorState.current.candidates = msg.data;
            break;
            
        case 'selected':
            curatorState.current.selected = msg.data;
            addLogEntry('success', `Selected image for "${curatorState.current.word}": ${msg.data.source}`);
            break;
            
        case 'error':
            addLogEntry('error', msg.data.message || 'Unknown error');
            if (msg.data.fatal) {
                curatorState.status = 'error';
            }
            break;
            
        case 'log':
            addLogEntry(msg.data.level || 'info', msg.data.message);
            break;
            
        case 'complete':
            curatorState.status = 'idle';
            addLogEntry('success', `Curation complete: ${msg.data.succeeded}/${msg.data.total} successful`);
            break;
            
        default:
            Logger.debug('Unknown curator message type', { type: msg.type });
    }
    
    refreshConsole();
}

function updateStatus(data) {
    if (data.status) curatorState.status = data.status;
    if (data.gpu) curatorState.gpu = data.gpu;
    if (data.vision) curatorState.vision = data.vision;
    if (data.apis) curatorState.apis = data.apis;
}

// ============================================================================
// API CALLS
// ============================================================================

async function startCurator() {
    addLogEntry('info', 'Starting curator...');
    curatorState.status = 'connecting';
    refreshConsole();
    
    try {
        const response = await fetch(`${CURATOR_API_BASE}/api/curator/start`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: curatorState.config.model,
                candidates: curatorState.config.candidatesPerWord,
                resumeOnCrash: curatorState.config.resumeOnCrash,
                useVision: curatorState.config.useVision
            })
        });
        
        if (!response.ok) {
            throw new Error(`Start failed: ${response.status}`);
        }
        
        const data = await response.json();
        curatorState.status = 'running';
        addLogEntry('success', 'Curator started');
        
        // Connect WebSocket for live updates
        connectWebSocket();
        
    } catch (e) {
        curatorState.status = 'error';
        addLogEntry('error', `Failed to start curator: ${e.message}`);
    }
    
    refreshConsole();
}

async function stopCurator() {
    addLogEntry('info', 'Stopping curator...');
    
    try {
        await fetch(`${CURATOR_API_BASE}/api/curator/stop`, { method: 'POST' });
        curatorState.status = 'idle';
        addLogEntry('info', 'Curator stopped');
    } catch (e) {
        addLogEntry('error', `Failed to stop: ${e.message}`);
    }
    
    refreshConsole();
}

async function getCuratorStatus() {
    try {
        const response = await fetch(`${CURATOR_API_BASE}/api/curator/status`);
        if (response.ok) {
            const data = await response.json();
            updateStatus(data);
            curatorState.connected = true;
            refreshConsole();
        }
    } catch (e) {
        // API not available - curator service not running
        curatorState.connected = false;
        curatorState.status = 'offline';
    }
}

// ============================================================================
// LOG MANAGEMENT
// ============================================================================

function addLogEntry(level, message) {
    const entry = {
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        level,
        message
    };
    
    curatorState.log.unshift(entry);
    
    // Keep last 100 entries
    if (curatorState.log.length > 100) {
        curatorState.log = curatorState.log.slice(0, 100);
    }
}

// ============================================================================
// RENDERING
// ============================================================================

export function renderImageCuratorConsole() {
    const s = curatorState;
    
    return `
        <div class="curator-console">
            <div class="curator-header">
                <div>
                    <h3>🖼️ AI Image Curator</h3>
                    <p class="muted small-text">Automated image curation with Ollama vision models</p>
                </div>
                <div class="curator-controls">
                    <button 
                        id="btn-start-curator" 
                        class="btn-small btn-success" 
                        onclick="window.imageCurator.start()"
                        ${s.status === 'running' ? 'disabled' : ''}>
                        ▶️ Start Curator
                    </button>
                    <button 
                        id="btn-stop-curator" 
                        class="btn-small btn-danger" 
                        onclick="window.imageCurator.stop()"
                        ${s.status !== 'running' ? 'disabled' : ''}>
                        ⏹️ Stop
                    </button>
                    <button 
                        class="btn-small" 
                        onclick="window.imageCurator.refreshStatus()">
                        🔄 Refresh
                    </button>
                </div>
            </div>
            
            ${renderStatusBar()}
            ${renderConfig()}
            ${renderProgress()}
            ${renderCurrentWord()}
            ${renderActivityLog()}
        </div>
    `;
}

function renderStatusBar() {
    const s = curatorState;
    const statusClass = {
        'offline': 'status-offline',
        'connecting': 'status-connecting',
        'idle': 'status-idle', 
        'running': 'status-running',
        'paused': 'status-paused',
        'error': 'status-error'
    }[s.status] || 'status-offline';
    
    const gpuText = s.gpu.available 
        ? `GPU ${s.gpu.selectedGpu ?? 0}: ${s.gpu.gpus[s.gpu.selectedGpu]?.utilization ?? 0}%`
        : 'No GPU';
    
    const visionText = s.vision.available
        ? s.vision.model
        : '❌ No vision model';
    
    const apiText = [
        s.apis.pexels?.keySet ? '✓ Pexels' : '',
        s.apis.pixabay?.keySet ? '✓ Pixabay' : ''
    ].filter(Boolean).join(', ') || '❌ No API keys';
    
    return `
        <div class="curator-status-bar">
            <div class="status-indicator ${statusClass}">
                <span class="status-dot"></span>
                <span class="status-text">${s.status.charAt(0).toUpperCase() + s.status.slice(1)}</span>
            </div>
            <div class="status-pills">
                <span class="pill ${s.gpu.available ? 'pill-success' : 'pill-muted'}" title="GPU Status">
                    🎮 ${gpuText}
                </span>
                <span class="pill ${s.vision.available ? 'pill-success' : 'pill-danger'}" title="Vision Model">
                    👁️ ${visionText}
                </span>
                <span class="pill ${(s.apis.pexels?.keySet || s.apis.pixabay?.keySet) ? 'pill-success' : 'pill-danger'}" title="Image APIs">
                    🌐 ${apiText}
                </span>
                ${s.gpu.shouldThrottle ? '<span class="pill pill-warning">⚠️ GPU Throttling</span>' : ''}
            </div>
        </div>
    `;
}

function renderConfig() {
    const c = curatorState.config;
    
    return `
        <div class="curator-config">
            <label>
                <span>Vision Model</span>
                <select id="curator-model" onchange="window.imageCurator.updateConfig('model', this.value)">
                    <option value="llama3.2-vision" ${c.model === 'llama3.2-vision' ? 'selected' : ''}>
                        llama3.2-vision (Recommended)
                    </option>
                    <option value="llava" ${c.model === 'llava' ? 'selected' : ''}>
                        llava
                    </option>
                    <option value="qwen2.5-vl" ${c.model === 'qwen2.5-vl' ? 'selected' : ''}>
                        qwen2.5-vl
                    </option>
                </select>
            </label>
            <label>
                <span>Candidates per word</span>
                <input 
                    type="number" 
                    id="curator-candidates" 
                    value="${c.candidatesPerWord}" 
                    min="1" 
                    max="10"
                    onchange="window.imageCurator.updateConfig('candidatesPerWord', parseInt(this.value))"
                >
            </label>
            <label class="checkbox-label">
                <input 
                    type="checkbox" 
                    id="curator-use-vision"
                    ${c.useVision ? 'checked' : ''}
                    onchange="window.imageCurator.updateConfig('useVision', this.checked)"
                >
                <span>Use vision model for evaluation</span>
            </label>
            <label class="checkbox-label">
                <input 
                    type="checkbox" 
                    id="curator-resume"
                    ${c.resumeOnCrash ? 'checked' : ''}
                    onchange="window.imageCurator.updateConfig('resumeOnCrash', this.checked)"
                >
                <span>Resume on crash</span>
            </label>
        </div>
    `;
}

function renderProgress() {
    const p = curatorState.progress;
    
    if (curatorState.status !== 'running' && p.total === 0) {
        return `
            <div class="curator-progress">
                <div class="progress-empty">
                    <p class="muted">Start the curator to process vocabulary images</p>
                </div>
            </div>
        `;
    }
    
    return `
        <div class="curator-progress">
            <div class="progress-bar">
                <div class="progress-fill" style="width: ${p.percent}%"></div>
            </div>
            <div class="progress-stats">
                <span class="progress-text">${p.processed}/${p.total} words processed (${p.percent}%)</span>
                <div class="progress-details">
                    <span class="stat-success">✓ ${p.succeeded}</span>
                    <span class="stat-error">✗ ${p.failed}</span>
                    <span class="stat-skipped">⏭ ${p.skipped}</span>
                </div>
            </div>
        </div>
    `;
}

function renderCurrentWord() {
    const c = curatorState.current;
    
    if (!c.word) {
        return `
            <div class="curator-current">
                <h4>Currently Processing</h4>
                <div class="current-empty">
                    <p class="muted">Waiting for curator to start...</p>
                </div>
            </div>
        `;
    }
    
    return `
        <div class="curator-current">
            <h4>Currently Processing</h4>
            <div class="current-word-info">
                <div class="word-display">
                    <span class="word-pt">${escapeHtml(c.word)}</span>
                    <span class="word-en">(${escapeHtml(c.translation)})</span>
                </div>
                ${c.lesson ? `<span class="word-lesson">Lesson: ${escapeHtml(c.lesson)}</span>` : ''}
            </div>
            ${c.candidates.length > 0 ? renderCandidates(c.candidates, c.selected) : ''}
        </div>
    `;
}

function renderCandidates(candidates, selected) {
    return `
        <div class="candidate-images">
            ${candidates.map((img, idx) => `
                <div class="candidate ${selected?.id === img.id ? 'selected' : ''}" data-index="${idx}">
                    <img src="${escapeHtml(img.thumbnail_url || img.url)}" alt="${escapeHtml(img.alt_text || '')}" loading="lazy">
                    <div class="candidate-info">
                        <div class="candidate-score">${img.score ? `Score: ${(img.score * 10).toFixed(1)}/10` : ''}</div>
                        <div class="candidate-source">${escapeHtml(img.source)}</div>
                        ${selected?.id === img.id ? '<div class="selected-badge">✓ Selected</div>' : ''}
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

function renderActivityLog() {
    const logs = curatorState.log.slice(0, 20);
    
    return `
        <div class="curator-log">
            <h4>Activity Log</h4>
            <div class="log-container">
                ${logs.length === 0 
                    ? '<p class="muted">No activity yet</p>'
                    : logs.map(entry => `
                        <div class="log-entry log-${entry.level}">
                            <span class="log-time">${new Date(entry.timestamp).toLocaleTimeString()}</span>
                            <span class="log-message">${escapeHtml(entry.message)}</span>
                        </div>
                    `).join('')
                }
            </div>
        </div>
    `;
}

function escapeHtml(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

// ============================================================================
// REFRESH
// ============================================================================

function refreshConsole() {
    const container = document.getElementById('imageCuratorContainer');
    if (container) {
        container.innerHTML = renderImageCuratorConsole();
    }
}

function startPolling() {
    if (curatorState.pollTimer) return;
    
    curatorState.pollTimer = setInterval(() => {
        if (!curatorState.connected) {
            getCuratorStatus();
        }
    }, POLL_INTERVAL_MS);
}

function stopPolling() {
    if (curatorState.pollTimer) {
        clearInterval(curatorState.pollTimer);
        curatorState.pollTimer = null;
    }
}

// ============================================================================
// EXPORTS
// ============================================================================

export function updateConfig(key, value) {
    curatorState.config[key] = value;
    refreshConsole();
}

export function initImageCuratorConsole() {
    // Try to get initial status
    getCuratorStatus();
    
    // Start polling for status
    startPolling();
    
    // Expose to window for onclick handlers
    window.imageCurator = {
        start: startCurator,
        stop: stopCurator,
        refreshStatus: getCuratorStatus,
        updateConfig,
        getState: () => curatorState
    };
    
    Logger.info('Image Curator Console initialized');
}

export function cleanupImageCuratorConsole() {
    stopPolling();
    disconnectWebSocket();
}

export default {
    renderImageCuratorConsole,
    initImageCuratorConsole,
    cleanupImageCuratorConsole
};
