/**
 * API Key Manager Component
 * Secure interface for managing image API keys (Pexels, Pixabay)
 * 
 * Features:
 * - Add/remove API keys
 * - Test key validity
 * - Show key status (valid, invalid, rate limited)
 * - Masked display for security
 */

export class APIKeyManager {
    constructor(container) {
        this.container = container;
        this.apis = {
            pexels: {
                name: 'Pexels',
                icon: '📸',
                testUrl: 'https://api.pexels.com/v1/search?query=test&per_page=1',
                headerKey: 'Authorization',
                docsUrl: 'https://www.pexels.com/api/',
                freeInfo: 'Free: 200 requests/hour, unlimited with approval'
            },
            pixabay: {
                name: 'Pixabay',
                icon: '🖼️',
                testUrl: 'https://pixabay.com/api/?q=test&per_page=3',
                queryKey: 'key',
                docsUrl: 'https://pixabay.com/api/docs/',
                freeInfo: 'Free: 100 requests/minute'
            },
            openverse: {
                name: 'Openverse',
                icon: '🌐',
                testUrl: 'https://api.openverse.org/v1/images/?q=test&page_size=1',
                headerKey: 'Authorization',
                authPrefix: 'Bearer ',
                docsUrl: 'https://api.openverse.org/v1/',
                freeInfo: 'Free: 100 requests/day (10K with approval) - 800M CC images'
            }
        };
    }

    render() {
        const keys = this._getStoredKeys();
        
        this.container.innerHTML = `
            <div class="api-key-manager">
                <div class="api-key-header">
                    <h3>🔑 Image API Keys</h3>
                    <p class="api-key-subtitle">
                        Configure API keys for image search. Both services are <strong>100% free</strong>.
                    </p>
                </div>

                <div class="api-cards">
                    ${Object.entries(this.apis).map(([id, api]) => this._renderApiCard(id, api, keys[id])).join('')}
                </div>

                <div class="api-key-info">
                    <h4>📋 Quick Setup Guide</h4>
                    <ol>
                        <li><strong>Pexels</strong>: Visit <a href="https://www.pexels.com/api/" target="_blank">pexels.com/api</a> → Create account → Get API key</li>
                        <li><strong>Pixabay</strong>: Visit <a href="https://pixabay.com/api/docs/" target="_blank">pixabay.com/api/docs</a> → Sign up → Copy API key</li>
                        <li><strong>Openverse</strong>: Visit <a href="https://api.openverse.org/v1/" target="_blank">api.openverse.org</a> → Register → Get OAuth token</li>
                        <li>Paste keys above and click "Test" to verify</li>
                    </ol>
                    <p class="info-note">
                        ℹ️ Keys are stored locally in your browser. They are never sent to any server except the respective API services.
                    </p>
                </div>
            </div>
        `;

        this._attachEventListeners();
    }

    _renderApiCard(id, api, storedKey) {
        const hasKey = !!storedKey;
        const maskedKey = hasKey ? this._maskKey(storedKey) : '';
        
        return `
            <div class="api-card ${hasKey ? 'has-key' : ''}" data-api="${id}">
                <div class="api-card-header">
                    <span class="api-icon">${api.icon}</span>
                    <span class="api-name">${api.name}</span>
                    <span class="api-status" id="status-${id}">
                        ${hasKey ? '✅ Configured' : '⚠️ Not Set'}
                    </span>
                </div>
                
                <div class="api-card-body">
                    <p class="api-free-info">${api.freeInfo}</p>
                    
                    <div class="api-key-input-group">
                        <input 
                            type="password" 
                            id="key-${id}" 
                            class="api-key-input"
                            placeholder="Paste your ${api.name} API key"
                            value="${storedKey || ''}"
                            autocomplete="off"
                        />
                        <button 
                            class="btn-icon btn-toggle-visibility" 
                            data-target="key-${id}"
                            title="Show/hide key"
                        >
                            👁️
                        </button>
                    </div>
                    
                    ${hasKey ? `<div class="masked-key">${maskedKey}</div>` : ''}
                    
                    <div class="api-card-actions">
                        <button class="btn btn-sm btn-primary btn-save" data-api="${id}">
                            💾 Save
                        </button>
                        <button class="btn btn-sm btn-secondary btn-test" data-api="${id}">
                            🧪 Test
                        </button>
                        ${hasKey ? `
                            <button class="btn btn-sm btn-danger btn-remove" data-api="${id}">
                                🗑️ Remove
                            </button>
                        ` : ''}
                        <a href="${api.docsUrl}" target="_blank" class="btn btn-sm btn-link">
                            📖 Get Key
                        </a>
                    </div>
                    
                    <div class="api-test-result" id="result-${id}"></div>
                </div>
            </div>
        `;
    }

    _attachEventListeners() {
        // Save buttons
        this.container.querySelectorAll('.btn-save').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const apiId = e.target.dataset.api;
                this._saveKey(apiId);
            });
        });

        // Test buttons
        this.container.querySelectorAll('.btn-test').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const apiId = e.target.dataset.api;
                this._testKey(apiId);
            });
        });

        // Remove buttons
        this.container.querySelectorAll('.btn-remove').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const apiId = e.target.dataset.api;
                this._removeKey(apiId);
            });
        });

        // Toggle visibility buttons
        this.container.querySelectorAll('.btn-toggle-visibility').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const inputId = e.currentTarget.dataset.target;
                const input = document.getElementById(inputId);
                input.type = input.type === 'password' ? 'text' : 'password';
                e.currentTarget.textContent = input.type === 'password' ? '👁️' : '🙈';
            });
        });

        // Enter key to save
        this.container.querySelectorAll('.api-key-input').forEach(input => {
            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    const apiId = input.id.replace('key-', '');
                    this._saveKey(apiId);
                }
            });
        });
    }

    _saveKey(apiId) {
        const input = document.getElementById(`key-${apiId}`);
        const key = input.value.trim();
        
        if (!key) {
            this._showResult(apiId, 'error', 'Please enter an API key');
            return;
        }

        const keys = this._getStoredKeys();
        keys[apiId] = key;
        this._setStoredKeys(keys);
        
        this._showResult(apiId, 'success', 'Key saved! Click "Test" to verify.');
        this._updateStatus(apiId, true);
        
        // Also save to environment format for Python
        this._exportForPython();
        
        // Re-render to show remove button
        this.render();
    }

    async _testKey(apiId) {
        const input = document.getElementById(`key-${apiId}`);
        const key = input.value.trim() || this._getStoredKeys()[apiId];
        
        if (!key) {
            this._showResult(apiId, 'error', 'No API key to test');
            return;
        }

        this._showResult(apiId, 'loading', 'Testing...');
        
        const api = this.apis[apiId];
        
        try {
            let response;
            
            if (apiId === 'pexels') {
                response = await fetch(api.testUrl, {
                    headers: { 'Authorization': key }
                });
            } else if (apiId === 'pixabay') {
                const url = `${api.testUrl}&key=${key}`;
                response = await fetch(url);
            } else if (apiId === 'openverse') {
                response = await fetch(api.testUrl, {
                    headers: { 'Authorization': `Bearer ${key}` }
                });
            }

            if (response.ok) {
                const data = await response.json();
                const resultCount = apiId === 'pexels' 
                    ? data.photos?.length 
                    : apiId === 'pixabay'
                    ? data.hits?.length
                    : data.results?.length;
                    
                this._showResult(apiId, 'success', 
                    `✅ Valid! Found ${resultCount} test result(s). Rate limits OK.`);
                this._updateStatus(apiId, true, 'valid');
            } else if (response.status === 401 || response.status === 403) {
                this._showResult(apiId, 'error', '❌ Invalid API key');
                this._updateStatus(apiId, true, 'invalid');
            } else if (response.status === 429) {
                this._showResult(apiId, 'warning', '⚠️ Rate limited. Key is valid but try again later.');
                this._updateStatus(apiId, true, 'rate-limited');
            } else {
                this._showResult(apiId, 'error', `Error: HTTP ${response.status}`);
            }
        } catch (err) {
            this._showResult(apiId, 'error', `Network error: ${err.message}`);
        }
    }

    _removeKey(apiId) {
        if (!confirm(`Remove ${this.apis[apiId].name} API key?`)) {
            return;
        }
        
        const keys = this._getStoredKeys();
        delete keys[apiId];
        this._setStoredKeys(keys);
        
        this._exportForPython();
        this.render();
    }

    _showResult(apiId, type, message) {
        const resultDiv = document.getElementById(`result-${apiId}`);
        resultDiv.className = `api-test-result ${type}`;
        resultDiv.textContent = message;
    }

    _updateStatus(apiId, hasKey, validity = null) {
        const statusEl = document.getElementById(`status-${apiId}`);
        if (!hasKey) {
            statusEl.textContent = '⚠️ Not Set';
            statusEl.className = 'api-status not-set';
        } else if (validity === 'valid') {
            statusEl.textContent = '✅ Valid';
            statusEl.className = 'api-status valid';
        } else if (validity === 'invalid') {
            statusEl.textContent = '❌ Invalid';
            statusEl.className = 'api-status invalid';
        } else if (validity === 'rate-limited') {
            statusEl.textContent = '⏳ Rate Limited';
            statusEl.className = 'api-status rate-limited';
        } else {
            statusEl.textContent = '✅ Configured';
            statusEl.className = 'api-status configured';
        }
    }

    _maskKey(key) {
        if (!key || key.length < 8) return '••••••••';
        return key.substring(0, 4) + '••••••••' + key.substring(key.length - 4);
    }

    _getStoredKeys() {
        try {
            const stored = localStorage.getItem('portulingo_api_keys');
            return stored ? JSON.parse(stored) : {};
        } catch {
            return {};
        }
    }

    _setStoredKeys(keys) {
        localStorage.setItem('portulingo_api_keys', JSON.stringify(keys));
    }

    _exportForPython() {
        // Export keys in a format the Python curator can read
        const keys = this._getStoredKeys();
        const envFormat = {
            PEXELS_API_KEY: keys.pexels || '',
            PIXABAY_API_KEY: keys.pixabay || '',
            OPENVERSE_API_KEY: keys.openverse || ''
        };
        localStorage.setItem('portulingo_api_keys_env', JSON.stringify(envFormat));
    }

    // Public methods for other components
    getKeys() {
        return this._getStoredKeys();
    }

    hasValidKeys() {
        const keys = this._getStoredKeys();
        return !!(keys.pexels || keys.pixabay || keys.openverse);
    }

    getPexelsKey() {
        return this._getStoredKeys().pexels || null;
    }

    getPixabayKey() {
        return this._getStoredKeys().pixabay || null;
    }

    getOpenverseKey() {
        return this._getStoredKeys().openverse || null;
    }
}

// ============================================================================
// Wrapper functions for AdminDashboard integration
// ============================================================================

let apiKeyManagerInstance = null;

/**
 * Render API Key Manager HTML
 * @returns {string} HTML for the API Key Manager section
 */
export function renderAPIKeyManager() {
    return `
        <div class="admin-section api-key-manager-wrapper">
            <div id="apiKeyManagerContent">
                <!-- Content will be rendered by initAPIKeyManager -->
                <div class="api-key-loading">Loading API Key Manager...</div>
            </div>
        </div>
    `;
}

/**
 * Initialize the API Key Manager
 * Called after DOM is ready
 */
export function initAPIKeyManager() {
    let container = document.getElementById('apiKeyManagerContent');

    // If the inner container is missing, re-render the wrapper inside the panel
    if (!container) {
        const outer = document.getElementById('apiKeyManagerContainer');
        if (outer) {
            outer.innerHTML = renderAPIKeyManager();
            container = document.getElementById('apiKeyManagerContent');
        }
    }

    if (!container) {
        return;
    }
    
    apiKeyManagerInstance = new APIKeyManager(container);
    apiKeyManagerInstance.render();
}

/**
 * Cleanup API Key Manager resources
 */
export function cleanupAPIKeyManager() {
    apiKeyManagerInstance = null;
}

/**
 * Get the API Key Manager instance
 * @returns {APIKeyManager|null}
 */
export function getAPIKeyManager() {
    return apiKeyManagerInstance;
}

export default APIKeyManager;
