/**
 * Progress Chart Component
 * 
 * Provides progress visualization including:
 * - Hearts, XP, and Streak displays
 * - Skill statistics dashboard
 * - Fix pack recommendations
 * - Progress bars and circular charts
 * 
 * @module components/common/ProgressChart
 */

// ============================================================================
// CONFIGURATION
// ============================================================================

/**
 * Progress chart configuration
 */
export const PROGRESS_CONFIG = {
    // Stats thresholds
    focusThreshold: 3,      // misses >= 3 = focus
    watchThreshold: 1,      // misses >= 1 = watch
    maxFixPacks: 3,         // Maximum fix packs to show
    
    // Animation
    animationDuration: 500,
    countUpDuration: 1000,
    
    // Colors (CSS variables when possible)
    colors: {
        heart: '#ef4444',
        xp: '#fbbf24',
        streak: '#f97316',
        focus: '#ef4444',
        watch: '#f59e0b',
        solid: '#10b981'
    }
};

/**
 * Skill definitions for analysis
 */
export const SKILL_DEFINITIONS = [
    {
        id: 'nasal',
        label: 'Nasal vowels',
        predicate: word => /ão|õe|ães|ãos|em\b|ens/.test((word.pt || '').toLowerCase()),
        fix: 'Shadow pão/mão/coração slowly at 0.9×, 5 reps each, focusing on nasal release.'
    },
    {
        id: 'gender',
        label: 'Gender agreement',
        predicate: word => {
            const pt = (word.pt || '').toLowerCase();
            return Boolean(word.gendered || word.ptFem || /a$/.test(pt) || /o$/.test(pt));
        },
        fix: 'Drill masc↔fem pairs aloud (obrigado/obrigada, pronto/pronta). Alternate every repetition.'
    },
    {
        id: 'ser_estar',
        label: 'Ser vs. Estar',
        predicate: word => /\bser\b|\bestar\b|sou|estou|és|é|somos|estão/.test((word.pt || '').toLowerCase()),
        fix: 'Build 3 mini sentences for ser (identity), 3 for estar (state/location); read, then record.'
    },
    {
        id: 'por_para',
        label: 'Por vs. Para',
        predicate: word => /\bpor\b|\bpara\b/.test((word.pt || '').toLowerCase()),
        fix: 'Write 4 contrasts: "para Lisboa" (destination) vs "por Lisboa" (through); say each aloud twice.'
    },
    {
        id: 'tenses',
        label: 'Tenses & time',
        predicate: word => /amanh[ãa]|ontem|depois|antes|semana|m[eê]s|ano|vou|fui|iria/.test((word.pt || '').toLowerCase()) || /(will|yesterday|tomorrow|later)/.test((word.en || '').toLowerCase()),
        fix: 'Say past→present→future for one verb (fui/vou/trabalharei); record and compare rhythm.'
    }
];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Escape HTML special characters
 * @param {string} text - Text to escape
 * @returns {string} Escaped HTML
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Format time in minutes to readable string
 * @param {number} minutes - Minutes remaining
 * @returns {string} Formatted time string
 */
export function formatTime(minutes) {
    if (minutes <= 0) return 'Ready!';
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}

/**
 * Get severity level based on miss count
 * @param {number} misses - Number of misses
 * @returns {Object} Severity info {level, label, color}
 */
export function getSeverity(misses) {
    if (misses >= PROGRESS_CONFIG.focusThreshold) {
        return { level: 'focus', label: 'Focus', color: PROGRESS_CONFIG.colors.focus };
    }
    if (misses >= PROGRESS_CONFIG.watchThreshold) {
        return { level: 'watch', label: 'Watch', color: PROGRESS_CONFIG.colors.watch };
    }
    return { level: 'solid', label: 'Solid', color: PROGRESS_CONFIG.colors.solid };
}

/**
 * Animate counting up a number
 * @param {HTMLElement} element - Element to animate
 * @param {number} start - Start value
 * @param {number} end - End value
 * @param {number} duration - Animation duration in ms
 */
export function animateCount(element, start, end, duration = PROGRESS_CONFIG.countUpDuration) {
    const startTime = performance.now();
    const diff = end - start;
    
    const animate = (currentTime) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Ease out quad
        const eased = 1 - (1 - progress) * (1 - progress);
        const current = Math.round(start + diff * eased);
        
        element.textContent = current;
        
        if (progress < 1) {
            requestAnimationFrame(animate);
        }
    };
    
    requestAnimationFrame(animate);
}

// ============================================================================
// STATS DISPLAY CLASS
// ============================================================================

/**
 * StatsDisplay - Manages header stats (hearts, XP, streak)
 */
export class StatsDisplay {
    /**
     * Create a StatsDisplay instance
     * @param {Object} options - Options
     * @param {Function} options.getHearts - Function to get hearts count
     * @param {Function} options.getXP - Function to get XP count
     * @param {Function} options.getStreak - Function to get streak count
     * @param {Function} options.getTimeToNextHeart - Function to get minutes until next heart
     * @param {number} options.maxHearts - Maximum hearts (default 5)
     */
    constructor(options = {}) {
        this.getHearts = options.getHearts || (() => 5);
        this.getXP = options.getXP || (() => 0);
        this.getStreak = options.getStreak || (() => 0);
        this.getTimeToNextHeart = options.getTimeToNextHeart || (() => 0);
        this.maxHearts = options.maxHearts || 5;
        
        this.elements = {
            heartsCount: null,
            heartsTimer: null,
            xpCount: null,
            streakCount: null
        };
    }

    /**
     * Bind to DOM elements
     * @param {Object} selectors - Element ID selectors
     */
    bind(selectors = {}) {
        this.elements.heartsCount = document.getElementById(selectors.heartsCount || 'heartsCount');
        this.elements.heartsTimer = document.getElementById(selectors.heartsTimer || 'heartsTimer');
        this.elements.xpCount = document.getElementById(selectors.xpCount || 'xpCount');
        this.elements.streakCount = document.getElementById(selectors.streakCount || 'streakCount');
    }

    /**
     * Update hearts display
     */
    updateHearts() {
        const hearts = this.getHearts();
        
        if (this.elements.heartsCount) {
            if (hearts === Infinity) {
                this.elements.heartsCount.textContent = '∞';
                this.elements.heartsCount.classList.add('unlimited');
            } else {
                this.elements.heartsCount.textContent = hearts;
                this.elements.heartsCount.classList.remove('unlimited');
            }
        }
        
        if (this.elements.heartsTimer) {
            if (hearts < this.maxHearts && hearts !== Infinity) {
                this.elements.heartsTimer.textContent = formatTime(this.getTimeToNextHeart());
                this.elements.heartsTimer.style.display = 'inline';
            } else {
                this.elements.heartsTimer.style.display = 'none';
            }
        }
    }

    /**
     * Update XP display
     * @param {boolean} animate - Whether to animate the change
     */
    updateXP(animate = false) {
        if (!this.elements.xpCount) return;
        
        const xp = this.getXP();
        if (animate) {
            const current = parseInt(this.elements.xpCount.textContent) || 0;
            animateCount(this.elements.xpCount, current, xp);
        } else {
            this.elements.xpCount.textContent = xp;
        }
    }

    /**
     * Update streak display
     */
    updateStreak() {
        if (!this.elements.streakCount) return;
        this.elements.streakCount.textContent = this.getStreak();
    }

    /**
     * Update all stats
     */
    updateAll() {
        this.updateHearts();
        this.updateXP();
        this.updateStreak();
    }

    /**
     * Create stats HTML for header
     * @returns {string} HTML string
     */
    static createHeaderHTML() {
        return `
            <div class="header-stats">
                <div class="stat-item hearts" title="Lives remaining">
                    <span class="stat-icon">❤️</span>
                    <span class="stat-value" id="heartsCount">5</span>
                    <span class="stat-timer" id="heartsTimer"></span>
                </div>
                <div class="stat-item xp" title="Experience points">
                    <span class="stat-icon">⚡</span>
                    <span class="stat-value" id="xpCount">0</span>
                </div>
                <div class="stat-item streak" title="Day streak">
                    <span class="stat-icon">🔥</span>
                    <span class="stat-value" id="streakCount">0</span>
                </div>
            </div>
        `;
    }
}

// ============================================================================
// SKILL ANALYZER CLASS
// ============================================================================

/**
 * SkillAnalyzer - Analyzes learning data for skill insights
 */
export class SkillAnalyzer {
    /**
     * Create a SkillAnalyzer instance
     * @param {Array} skillDefinitions - Skill definitions (defaults to SKILL_DEFINITIONS)
     */
    constructor(skillDefinitions = SKILL_DEFINITIONS) {
        this.skillDefinitions = skillDefinitions;
        this.stats = [];
    }

    /**
     * Get word key for tracking
     * @param {Object} word - Word object
     * @returns {string} Unique key
     */
    getWordKey(word) {
        return `${word.pt}::${word.en}`;
    }

    /**
     * Analyze skills from user data
     * @param {Object} userData - User data object
     * @returns {Array} Analyzed skill stats
     */
    analyze(userData) {
        const { learnedWords = [], mistakes = [], successes = [] } = userData;
        
        // Build attempt map
        const attemptsByKey = new Map();
        mistakes.forEach(m => {
            attemptsByKey.set(m.key, { misses: m.count || 0, hits: 0 });
        });
        successes.forEach(s => {
            const existing = attemptsByKey.get(s.key) || { misses: 0, hits: 0 };
            existing.hits += s.count || 0;
            attemptsByKey.set(s.key, existing);
        });

        // Calculate stats for each skill
        this.stats = this.skillDefinitions.map(def => ({
            ...def,
            misses: 0,
            attempts: 0,
            accuracy: 100,
            wordKeys: [],
            example: null
        }));

        learnedWords.forEach(word => {
            const matches = this.skillDefinitions.filter(def => def.predicate(word));
            if (!matches.length) return;
            
            const counts = attemptsByKey.get(this.getWordKey(word)) || { misses: 0, hits: 0 };
            const attempts = (counts.misses || 0) + (counts.hits || 0);
            
            matches.forEach(def => {
                const stat = this.stats.find(s => s.id === def.id);
                stat.misses += counts.misses || 0;
                stat.attempts += attempts;
                stat.wordKeys.push(this.getWordKey(word));
                
                if (!stat.example || (counts.misses || 0) > (stat.example?.misses || 0)) {
                    stat.example = { word, misses: counts.misses || 0 };
                }
            });
        });

        // Calculate accuracy
        this.stats.forEach(stat => {
            stat.accuracy = stat.attempts 
                ? Math.round(((stat.attempts - stat.misses) / stat.attempts) * 100) 
                : 100;
        });

        return this.stats;
    }

    /**
     * Get skills sorted by priority (most misses first)
     * @returns {Array} Sorted skill stats
     */
    getSortedByPriority() {
        return [...this.stats].sort((a, b) => (b.misses || 0) - (a.misses || 0));
    }

    /**
     * Get skills needing attention
     * @returns {Array} Skills with misses > 0
     */
    getSkillsNeedingAttention() {
        return this.stats.filter(s => s.misses > 0);
    }

    /**
     * Get fix packs (top priority skills to work on)
     * @param {number} limit - Max number to return
     * @returns {Array} Fix pack suggestions
     */
    getFixPacks(limit = PROGRESS_CONFIG.maxFixPacks) {
        const sorted = this.getSortedByPriority();
        const focused = sorted.filter(stat => stat.misses > 0).slice(0, limit);
        return focused.length ? focused : sorted.slice(0, Math.min(2, sorted.length));
    }
}

// ============================================================================
// SKILL DASHBOARD CLASS
// ============================================================================

/**
 * SkillDashboard - Renders skill statistics and fix packs
 */
export class SkillDashboard {
    /**
     * Create a SkillDashboard instance
     * @param {Object} options - Options
     * @param {Function} options.onDrillClick - Callback when drill button clicked
     */
    constructor(options = {}) {
        this.analyzer = new SkillAnalyzer();
        this.onDrillClick = options.onDrillClick || (() => {});
        this.elements = {
            stats: null,
            fixPacks: null
        };
    }

    /**
     * Bind to DOM elements
     * @param {Object} selectors - Element ID selectors
     */
    bind(selectors = {}) {
        this.elements.stats = document.getElementById(selectors.stats || 'skillStats');
        this.elements.fixPacks = document.getElementById(selectors.fixPacks || 'fixPackList');
    }

    /**
     * Render the skill dashboard
     * @param {Object} userData - User data for analysis
     */
    render(userData) {
        const stats = this.analyzer.analyze(userData);
        
        this.renderStats(stats);
        this.renderFixPacks();
    }

    /**
     * Render skill statistics
     * @param {Array} stats - Analyzed stats
     */
    renderStats(stats) {
        if (!this.elements.stats) return;
        
        if (!stats.length) {
            this.elements.stats.innerHTML = '<p class="muted">Complete a lesson to see skill stats.</p>';
            return;
        }

        const sorted = this.analyzer.getSortedByPriority();
        
        this.elements.stats.innerHTML = sorted
            .map(stat => {
                const severity = getSeverity(stat.misses);
                return `
                    <div class="skill-card ${severity.level}" data-skill="${escapeHtml(stat.id)}">
                        <div class="skill-title">${escapeHtml(stat.label)}</div>
                        <div class="skill-accuracy">${stat.accuracy}% accuracy</div>
                        <div class="skill-meta">${stat.misses || 0} misses · ${stat.attempts || 0} attempts</div>
                        <span class="skill-pill">${severity.label}</span>
                    </div>
                `;
            })
            .join('');
    }

    /**
     * Render fix pack recommendations
     */
    renderFixPacks() {
        if (!this.elements.fixPacks) return;
        
        const fixPacks = this.analyzer.getFixPacks();
        
        if (!fixPacks.length) {
            this.elements.fixPacks.innerHTML = '<p class="muted">No fix packs yet—make a few attempts first.</p>';
            return;
        }

        this.elements.fixPacks.innerHTML = fixPacks
            .map(stat => {
                const example = stat.example?.word?.pt 
                    ? `Try: ${escapeHtml(stat.example.word.pt)}` 
                    : 'Pick any word in this skill.';
                return `
                    <div class="fix-pack">
                        <div class="fix-title">${escapeHtml(stat.label)}</div>
                        <p class="fix-body">${escapeHtml(stat.fix)}</p>
                        <p class="fix-example muted">${example}</p>
                        <button class="btn-small" data-fix="${escapeHtml(stat.id)}">Drill now</button>
                    </div>
                `;
            })
            .join('');

        // Bind drill buttons
        this.elements.fixPacks.querySelectorAll('button[data-fix]').forEach(btn => {
            btn.addEventListener('click', () => {
                const skillId = btn.getAttribute('data-fix');
                this.onDrillClick(skillId, this.analyzer.stats.find(s => s.id === skillId));
            });
        });
    }

    /**
     * Get stats for a specific skill
     * @param {string} skillId - Skill ID
     * @returns {Object|null} Skill stats
     */
    getSkillStats(skillId) {
        return this.analyzer.stats.find(s => s.id === skillId) || null;
    }
}

// ============================================================================
// PROGRESS BAR CLASS
// ============================================================================

/**
 * ProgressBar - Creates animated progress bars
 */
export class ProgressBar {
    /**
     * Create a progress bar element
     * @param {Object} options - Options
     * @param {number} options.value - Current value (0-100)
     * @param {number} options.max - Maximum value (default 100)
     * @param {string} options.label - Label text
     * @param {string} options.color - Bar color
     * @param {boolean} options.showPercent - Show percentage text
     * @returns {HTMLElement} Progress bar element
     */
    static create(options = {}) {
        const { 
            value = 0, 
            max = 100, 
            label = '', 
            color = 'var(--accent)',
            showPercent = true 
        } = options;
        
        const percent = Math.min(100, Math.round((value / max) * 100));
        
        const container = document.createElement('div');
        container.className = 'progress-bar-container';
        container.setAttribute('role', 'progressbar');
        container.setAttribute('aria-valuenow', value);
        container.setAttribute('aria-valuemin', 0);
        container.setAttribute('aria-valuemax', max);
        
        container.innerHTML = `
            ${label ? `<div class="progress-label">${escapeHtml(label)}</div>` : ''}
            <div class="progress-track">
                <div class="progress-fill" style="width: ${percent}%; background: ${color}"></div>
            </div>
            ${showPercent ? `<div class="progress-percent">${percent}%</div>` : ''}
        `;
        
        return container;
    }

    /**
     * Update a progress bar
     * @param {HTMLElement} container - Progress bar container
     * @param {number} value - New value
     * @param {number} max - Maximum value
     * @param {boolean} animate - Whether to animate
     */
    static update(container, value, max = 100, animate = true) {
        const percent = Math.min(100, Math.round((value / max) * 100));
        const fill = container.querySelector('.progress-fill');
        const percentEl = container.querySelector('.progress-percent');
        
        container.setAttribute('aria-valuenow', value);
        
        if (fill) {
            if (animate) {
                fill.style.transition = `width ${PROGRESS_CONFIG.animationDuration}ms ease-out`;
            }
            fill.style.width = `${percent}%`;
        }
        
        if (percentEl) {
            percentEl.textContent = `${percent}%`;
        }
    }
}

// ============================================================================
// CIRCULAR PROGRESS CLASS
// ============================================================================

/**
 * CircularProgress - Creates circular progress indicators
 */
export class CircularProgress {
    /**
     * Create a circular progress element
     * @param {Object} options - Options
     * @param {number} options.value - Current value (0-100)
     * @param {number} options.size - Size in pixels (default 80)
     * @param {number} options.strokeWidth - Stroke width (default 8)
     * @param {string} options.color - Progress color
     * @param {string} options.label - Center label
     * @returns {HTMLElement} Circular progress element
     */
    static create(options = {}) {
        const {
            value = 0,
            size = 80,
            strokeWidth = 8,
            color = 'var(--accent)',
            label = ''
        } = options;
        
        const radius = (size - strokeWidth) / 2;
        const circumference = 2 * Math.PI * radius;
        const offset = circumference - (value / 100) * circumference;
        
        const container = document.createElement('div');
        container.className = 'circular-progress';
        container.style.width = `${size}px`;
        container.style.height = `${size}px`;
        
        container.innerHTML = `
            <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
                <circle 
                    class="circular-progress-bg"
                    cx="${size / 2}" 
                    cy="${size / 2}" 
                    r="${radius}"
                    fill="none"
                    stroke="var(--surface)"
                    stroke-width="${strokeWidth}"
                />
                <circle 
                    class="circular-progress-fill"
                    cx="${size / 2}" 
                    cy="${size / 2}" 
                    r="${radius}"
                    fill="none"
                    stroke="${color}"
                    stroke-width="${strokeWidth}"
                    stroke-linecap="round"
                    stroke-dasharray="${circumference}"
                    stroke-dashoffset="${offset}"
                    transform="rotate(-90 ${size / 2} ${size / 2})"
                />
            </svg>
            <div class="circular-progress-label">${escapeHtml(label) || `${Math.round(value)}%`}</div>
        `;
        
        return container;
    }

    /**
     * Update circular progress
     * @param {HTMLElement} container - Container element
     * @param {number} value - New value (0-100)
     * @param {string} label - Optional new label
     */
    static update(container, value, label = null) {
        const svg = container.querySelector('svg');
        if (!svg) return;
        
        const fill = svg.querySelector('.circular-progress-fill');
        const labelEl = container.querySelector('.circular-progress-label');
        
        const size = parseInt(container.style.width);
        const strokeWidth = parseFloat(fill.getAttribute('stroke-width'));
        const radius = (size - strokeWidth) / 2;
        const circumference = 2 * Math.PI * radius;
        const offset = circumference - (value / 100) * circumference;
        
        fill.style.transition = `stroke-dashoffset ${PROGRESS_CONFIG.animationDuration}ms ease-out`;
        fill.setAttribute('stroke-dashoffset', offset);
        
        if (labelEl) {
            labelEl.textContent = label !== null ? label : `${Math.round(value)}%`;
        }
    }
}

// ============================================================================
// LESSON PROGRESS CLASS
// ============================================================================

/**
 * LessonProgress - Tracks and displays lesson progress
 */
export class LessonProgress {
    /**
     * Create lesson progress display
     * @param {Object} options - Options
     * @param {number} options.current - Current challenge index
     * @param {number} options.total - Total challenges
     * @param {number} options.hearts - Current hearts
     * @param {number} options.correctCount - Correct answers
     * @returns {HTMLElement} Progress display element
     */
    static create(options = {}) {
        const { current = 0, total = 1, hearts = 5, correctCount = 0 } = options;
        const percent = Math.round((current / total) * 100);
        
        const container = document.createElement('div');
        container.className = 'lesson-progress';
        
        const heartsDisplay = hearts === Infinity ? '∞' : '❤️'.repeat(Math.min(hearts, 5));
        
        container.innerHTML = `
            <div class="lesson-progress-header">
                <div class="lesson-progress-hearts" title="${hearts === Infinity ? 'Unlimited' : hearts + ' hearts'}">${heartsDisplay}</div>
                <div class="lesson-progress-text">${current}/${total}</div>
            </div>
            <div class="lesson-progress-bar">
                <div class="lesson-progress-fill" style="width: ${percent}%"></div>
            </div>
            <div class="lesson-progress-stats">
                <span class="correct-count">✓ ${correctCount} correct</span>
            </div>
        `;
        
        return container;
    }

    /**
     * Update lesson progress display
     * @param {HTMLElement} container - Container element
     * @param {Object} options - Update options
     */
    static update(container, options = {}) {
        const { current, total, hearts, correctCount } = options;
        
        if (current !== undefined && total !== undefined) {
            const percent = Math.round((current / total) * 100);
            const fill = container.querySelector('.lesson-progress-fill');
            const text = container.querySelector('.lesson-progress-text');
            
            if (fill) fill.style.width = `${percent}%`;
            if (text) text.textContent = `${current}/${total}`;
        }
        
        if (hearts !== undefined) {
            const heartsEl = container.querySelector('.lesson-progress-hearts');
            if (heartsEl) {
                heartsEl.textContent = hearts === Infinity ? '∞' : '❤️'.repeat(Math.min(hearts, 5));
                heartsEl.title = hearts === Infinity ? 'Unlimited' : `${hearts} hearts`;
            }
        }
        
        if (correctCount !== undefined) {
            const correctEl = container.querySelector('.correct-count');
            if (correctEl) correctEl.textContent = `✓ ${correctCount} correct`;
        }
    }
}

// ============================================================================
// DEFAULT EXPORT
// ============================================================================

export default {
    StatsDisplay,
    SkillAnalyzer,
    SkillDashboard,
    ProgressBar,
    CircularProgress,
    LessonProgress,
    PROGRESS_CONFIG,
    SKILL_DEFINITIONS
};
