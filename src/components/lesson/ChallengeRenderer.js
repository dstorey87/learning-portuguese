/**
 * Challenge Renderer Component
 * 
 * Handles rendering and interaction for all challenge types in the lesson flow:
 * - Learn Word (introduction phase)
 * - Pronunciation (speech practice)
 * - Multiple Choice Quiz (MCQ)
 * - Type Answer (fill in blank)
 * - Listen & Type (audio comprehension)
 * - Sentence Practice (contextual usage)
 * - Lesson Complete (results screen)
 * 
 * @module components/lesson/ChallengeRenderer
 */

// ============================================================================
// CONFIGURATION
// ============================================================================

/**
 * Challenge type constants
 * @readonly
 * @enum {string}
 */
export const CHALLENGE_TYPES = {
    LEARN_WORD: 'learn-word',
    PRONUNCIATION: 'pronunciation',
    MCQ: 'mcq',
    TYPE_ANSWER: 'type-answer',
    LISTEN_TYPE: 'listen-type',
    SENTENCE: 'sentence'
};

/**
 * Challenge phase constants
 * @readonly
 * @enum {string}
 */
export const CHALLENGE_PHASES = {
    LEARN: 'learn',
    PRONOUNCE: 'pronounce',
    PRACTICE: 'practice',
    APPLY: 'apply'
};

/**
 * Default configuration for challenges
 */
export const CHALLENGE_CONFIG = {
    passThreshold: 85,
    pronunciationPassScore: 65,
    maxPronunciationAttempts: 3,
    animationDuration: 200,
    autoPlayDelay: 300
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Normalize text for comparison (removes accents, lowercase)
 * @param {string} value - Text to normalize
 * @returns {string} Normalized text
 */
export function normalizeText(value) {
    return (value || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/\p{Diacritic}/gu, '')
        .replace(/[^a-z0-9\s]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

/**
 * Escape HTML special characters
 * @param {string} text - Text to escape
 * @returns {string} Escaped HTML
 */
export function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Shuffle array using Fisher-Yates algorithm
 * @param {Array} list - Array to shuffle
 * @returns {Array} Shuffled copy
 */
export function shuffleArray(list) {
    const arr = [...list];
    for (let i = arr.length - 1; i > 0; i -= 1) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

/**
 * Get unique key for a word
 * @param {Object} word - Word object
 * @returns {string} Unique key
 */
export function getWordKey(word) {
    return `${word.pt}|${word.en}`;
}

/**
 * Resolve word form based on speaker gender
 * @param {Object} word - Word object
 * @param {string} speakerGender - 'male' or 'female'
 * @returns {string} Resolved Portuguese word
 */
export function resolveWordForm(word, speakerGender) {
    if (word.gendered && speakerGender === 'female' && word.ptFem) return word.ptFem;
    return word.pt;
}

/**
 * Get alternate gender form of word
 * @param {Object} word - Word object
 * @param {string} speakerGender - Current speaker gender
 * @returns {string} Alternate form or empty string
 */
export function getAlternateForm(word, speakerGender) {
    if (!word.gendered) return '';
    if (speakerGender === 'female' && word.pt) return word.pt;
    if (speakerGender === 'male' && word.ptFem) return word.ptFem;
    return '';
}

/**
 * Build quiz options with distractors
 * @param {Object} correctWord - The correct answer word
 * @param {Array} pool - Pool of words for distractors
 * @param {Array} [learnedWords=[]] - Previously learned words for variety
 * @returns {Array} Array of option objects
 */
export function buildQuizOptions(correctWord, pool, learnedWords = []) {
    const poolOthers = pool.filter(w => getWordKey(w) !== getWordKey(correctWord));
    const globalOthers = learnedWords.filter(w => getWordKey(w) !== getWordKey(correctWord));
    const combined = shuffleArray([...poolOthers, ...globalOthers]);
    const distractors = combined.slice(0, 3);
    const options = shuffleArray([correctWord, ...distractors]);
    return options.map(option => ({
        key: getWordKey(option),
        en: option.en,
        lessonId: option.lessonId || correctWord.lessonId
    }));
}

// ============================================================================
// CHALLENGE BUILDER
// ============================================================================

/**
 * Build the sequence of challenges for a lesson
 * @param {Object} lesson - Lesson data object
 * @param {Object} [options={}] - Build options
 * @param {Array} [options.learnedWords=[]] - Previously learned words
 * @returns {Array} Array of challenge objects
 */
export function buildLessonChallenges(lesson, options = {}) {
    const challenges = [];
    const words = lesson.words || [];
    const sentences = lesson.sentences || [];
    const learnedWords = options.learnedWords || [];
    
    // Phase 1: Learn new words (listen & see)
    words.forEach((word, idx) => {
        challenges.push({
            type: CHALLENGE_TYPES.LEARN_WORD,
            word,
            phase: CHALLENGE_PHASES.LEARN,
            index: idx
        });
    });
    
    // Phase 2: Pronunciation practice - say each word
    const pronWords = shuffleArray([...words]).slice(0, Math.min(4, words.length));
    pronWords.forEach(word => {
        challenges.push({
            type: CHALLENGE_TYPES.PRONUNCIATION,
            word,
            phase: CHALLENGE_PHASES.PRONOUNCE,
            maxAttempts: CHALLENGE_CONFIG.maxPronunciationAttempts
        });
    });
    
    // Phase 3: Multiple choice quizzes
    const shuffledWords = shuffleArray([...words]);
    shuffledWords.forEach(word => {
        challenges.push({
            type: CHALLENGE_TYPES.MCQ,
            word,
            phase: CHALLENGE_PHASES.PRACTICE,
            options: buildQuizOptions(word, words, learnedWords)
        });
    });
    
    // Phase 4: Type the Portuguese (fill in blank)
    const fillWords = shuffleArray([...words]).slice(0, Math.min(5, words.length));
    fillWords.forEach(word => {
        challenges.push({
            type: CHALLENGE_TYPES.TYPE_ANSWER,
            word,
            phase: CHALLENGE_PHASES.PRACTICE
        });
    });
    
    // Phase 5: Listen and type
    const listenWords = shuffleArray([...words]).slice(0, Math.min(3, words.length));
    listenWords.forEach(word => {
        challenges.push({
            type: CHALLENGE_TYPES.LISTEN_TYPE,
            word,
            phase: CHALLENGE_PHASES.PRACTICE
        });
    });
    
    // Phase 6: Sentences
    sentences.forEach(sentence => {
        challenges.push({
            type: CHALLENGE_TYPES.SENTENCE,
            sentence,
            phase: CHALLENGE_PHASES.APPLY
        });
    });
    
    return challenges;
}

// ============================================================================
// CHALLENGE RENDERER CLASS
// ============================================================================

/**
 * Challenge Renderer - manages rendering and state for lesson challenges
 */
export class ChallengeRenderer {
    /**
     * Create a ChallengeRenderer instance
     * @param {Object} options - Renderer options
     * @param {Function} options.playWord - Function to play audio for a word
     * @param {Function} options.getWordKnowledge - Function to get word knowledge data
     * @param {Function} options.generatePronunciationTip - Function to generate pronunciation tips
     * @param {Function} options.getPronunciationChallengeType - Function to get pronunciation challenge type
     * @param {Function} options.testPronunciation - Function to test pronunciation
     * @param {Function} options.saveToFlashcards - Function to save word to flashcards
     * @param {Function} options.loseHeart - Function to handle heart loss
     * @param {Function} options.getHearts - Function to get current hearts
     * @param {Function} options.hasHearts - Function to check if user has hearts
     * @param {string} options.speakerGender - User's speaker gender preference
     */
    constructor(options = {}) {
        this.playWord = options.playWord || (() => {});
        this.getWordKnowledge = options.getWordKnowledge || (() => null);
        this.generatePronunciationTip = options.generatePronunciationTip || (() => '');
        this.getPronunciationChallengeType = options.getPronunciationChallengeType || (() => 'normal');
        this.testPronunciation = options.testPronunciation || (async () => ({ bestScore: { score: 0 } }));
        this.saveToFlashcards = options.saveToFlashcards || (() => {});
        this.loseHeart = options.loseHeart || (() => true);
        this.getHearts = options.getHearts || (() => 5);
        this.hasHearts = options.hasHearts || (() => true);
        this.speakerGender = options.speakerGender || 'male';
        
        // Callbacks
        this.onChallengeComplete = options.onChallengeComplete || (() => {});
        this.onMistake = options.onMistake || (() => {});
        this.onCorrect = options.onCorrect || (() => {});
        this.onHeartsUpdate = options.onHeartsUpdate || (() => {});
        this.onShowHeartsModal = options.onShowHeartsModal || (() => {});
    }

    /**
     * Update speaker gender
     * @param {string} gender - 'male' or 'female'
     */
    setSpeakerGender(gender) {
        this.speakerGender = gender;
    }

    /**
     * Render a challenge based on type
     * @param {HTMLElement} container - Container element
     * @param {Object} challenge - Challenge data
     * @param {Object} state - Lesson state
     */
    render(container, challenge, state) {
        // Animate transition
        container.classList.add('challenge-exit');
        
        setTimeout(() => {
            container.innerHTML = '';
            container.classList.remove('challenge-exit');
            container.classList.add('challenge-enter');
            
            switch (challenge.type) {
                case CHALLENGE_TYPES.LEARN_WORD:
                    this.renderLearnWord(container, challenge, state);
                    break;
                case CHALLENGE_TYPES.PRONUNCIATION:
                    this.renderPronunciation(container, challenge, state);
                    break;
                case CHALLENGE_TYPES.MCQ:
                    this.renderMCQ(container, challenge, state);
                    break;
                case CHALLENGE_TYPES.TYPE_ANSWER:
                    this.renderTypeAnswer(container, challenge, state);
                    break;
                case CHALLENGE_TYPES.LISTEN_TYPE:
                    this.renderListenType(container, challenge, state);
                    break;
                case CHALLENGE_TYPES.SENTENCE:
                    this.renderSentence(container, challenge, state);
                    break;
                default:
                    console.warn(`Unknown challenge type: ${challenge.type}`);
            }
            
            setTimeout(() => container.classList.remove('challenge-enter'), CHALLENGE_CONFIG.animationDuration + 100);
        }, CHALLENGE_CONFIG.animationDuration);
    }

    /**
     * Render Learn Word challenge
     * @param {HTMLElement} container - Container element
     * @param {Object} challenge - Challenge data
     * @param {Object} state - Lesson state
     */
    renderLearnWord(container, challenge, state) {
        const word = challenge.word;
        const resolved = resolveWordForm(word, this.speakerGender);
        const alt = getAlternateForm(word, this.speakerGender);
        
        const knowledge = this.getWordKnowledge(resolved);
        const hasKnowledge = knowledge !== null;
        
        let cardHTML = `
            <div class="challenge-card learn-card learn-card-rich">
                <div class="challenge-instruction">📚 Learn This Word</div>
                
                <div class="learn-word-header">
                    <div class="learn-portuguese-main">${escapeHtml(resolved)}</div>
                    ${hasKnowledge && knowledge.ipa ? `<div class="learn-ipa">${escapeHtml(knowledge.ipa)}</div>` : ''}
                    <div class="learn-english-main">${escapeHtml(word.en)}</div>
                    ${alt ? `<div class="learn-alt-form">Also: ${escapeHtml(alt)}</div>` : ''}
                    <button class="btn-listen-main" id="listenBtn">🔊 Listen</button>
                </div>`;
        
        // Pronunciation section
        cardHTML += `
                <div class="learn-section pronunciation-section">
                    <div class="section-header">🗣️ Pronunciation</div>`;
        
        if (hasKnowledge && knowledge.pronunciation) {
            const p = knowledge.pronunciation;
            cardHTML += `
                    <div class="pronunciation-guide">${escapeHtml(p.guide)}</div>
                    ${p.breakdown ? `<div class="pronunciation-breakdown">Breakdown: ${escapeHtml(p.breakdown)}</div>` : ''}
                    <div class="pronunciation-tip">
                        <span class="tip-icon">💡</span>
                        <span class="tip-text">${escapeHtml(p.tip)}</span>
                    </div>
                    ${p.commonMistake ? `<div class="common-mistake">
                        <span class="mistake-icon">⚠️</span>
                        <span class="mistake-label">Common mistake:</span> ${escapeHtml(p.commonMistake)}
                    </div>` : ''}`;
        } else {
            const tip = this.generatePronunciationTip(resolved);
            const challengeType = this.getPronunciationChallengeType(resolved);
            cardHTML += `
                    <div class="pronunciation-tip">
                        <span class="tip-icon">💡</span>
                        <span class="tip-text">${escapeHtml(tip)}</span>
                    </div>
                    <div class="challenge-type-badge ${challengeType}">${challengeType}</div>`;
        }
        cardHTML += `</div>`;
        
        // Memory & Etymology section
        if (hasKnowledge && (knowledge.etymology || knowledge.memoryTrick)) {
            cardHTML += `
                <div class="learn-section memory-section">
                    <div class="section-header">🧠 Remember It</div>
                    ${knowledge.etymology ? `<div class="etymology">
                        <span class="etymology-label">Origin:</span> ${escapeHtml(knowledge.etymology)}
                    </div>` : ''}
                    ${knowledge.memoryTrick ? `<div class="memory-trick">
                        <span class="trick-icon">💭</span>
                        ${escapeHtml(knowledge.memoryTrick)}
                    </div>` : ''}
                </div>`;
        }
        
        // Examples section
        if (hasKnowledge && knowledge.examples && knowledge.examples.length > 0) {
            cardHTML += `
                <div class="learn-section examples-section">
                    <div class="section-header">📝 Example Sentences</div>
                    <div class="examples-list">`;
            
            knowledge.examples.forEach((ex, i) => {
                cardHTML += `
                        <div class="example-item" data-example="${i}">
                            <div class="example-pt">
                                ${escapeHtml(ex.pt)}
                                <button class="btn-listen-example" data-text="${escapeHtml(ex.pt)}" title="Listen">🔊</button>
                            </div>
                            <div class="example-en">${escapeHtml(ex.en)}</div>
                            ${ex.context ? `<div class="example-context">${escapeHtml(ex.context)}</div>` : ''}
                        </div>`;
            });
            
            cardHTML += `
                    </div>
                </div>`;
        }
        
        // Grammar notes
        if (hasKnowledge && knowledge.grammar) {
            cardHTML += `
                <div class="learn-section grammar-section">
                    <div class="section-header">📖 Grammar Note</div>
                    <div class="grammar-note">${escapeHtml(knowledge.grammar)}</div>
                </div>`;
        }
        
        // Usage context
        if (hasKnowledge && knowledge.usage) {
            const u = knowledge.usage;
            cardHTML += `
                <div class="learn-section usage-section">
                    <div class="section-header">🎯 When to Use</div>
                    <div class="usage-formality">Formality: <span class="formality-badge">${escapeHtml(u.formality)}</span></div>
                    <div class="usage-context">${escapeHtml(u.context)}</div>
                    ${u.alternative ? `<div class="usage-alternative">
                        <span class="alt-label">Alternative:</span> ${escapeHtml(u.alternative)}
                    </div>` : ''}
                </div>`;
        }
        
        // Cultural note
        if (hasKnowledge && knowledge.cultural) {
            cardHTML += `
                <div class="learn-section cultural-section">
                    <div class="section-header">🇵🇹 Cultural Insight</div>
                    <div class="cultural-note">${escapeHtml(knowledge.cultural)}</div>
                </div>`;
        }
        
        // Footer with actions
        const learnWordCount = state.challenges.filter(c => c.type === CHALLENGE_TYPES.LEARN_WORD).length;
        cardHTML += `
                <div class="learn-card-actions">
                    <button class="btn-save-word" id="saveWordBtn" data-pt="${escapeHtml(resolved)}" data-en="${escapeHtml(word.en)}">💾 Save to Flashcards</button>
                    <button class="btn-practice-say" id="practiceBtn">🎤 Practice Saying It</button>
                </div>
                <div class="challenge-footer">
                    <div class="word-progress-indicator">Word ${challenge.index + 1} of ${learnWordCount}</div>
                    <button class="btn-continue" id="continueBtn">I've Got It! Continue →</button>
                </div>
            </div>
        `;
        
        container.innerHTML = cardHTML;
        
        // Auto-play audio
        setTimeout(() => this.playWord(resolved), CHALLENGE_CONFIG.autoPlayDelay + 100);
        
        // Event listeners
        document.getElementById('listenBtn').addEventListener('click', () => this.playWord(resolved));
        
        document.getElementById('saveWordBtn').addEventListener('click', (e) => {
            const btn = e.target;
            this.saveToFlashcards(btn.dataset.pt, btn.dataset.en, state.lesson.title);
            btn.textContent = '✓ Saved!';
            btn.disabled = true;
        });
        
        document.getElementById('practiceBtn').addEventListener('click', async () => {
            const btn = document.getElementById('practiceBtn');
            btn.textContent = '🎤 Listening...';
            btn.disabled = true;
            
            try {
                const result = await this.testPronunciation(resolved, {
                    maxAttempts: 1,
                    timeoutMs: 5000,
                    wordKnowledge: knowledge
                });
                if (result && result.bestScore) {
                    this._showPronunciationFeedback(container, result.bestScore, resolved);
                } else {
                    this._showPronunciationFeedback(container, null, resolved);
                }
            } catch (err) {
                console.error('Speech recognition error:', err);
                this._showPronunciationFeedback(container, null, resolved, err);
            }
            
            btn.textContent = '🎤 Try Again';
            btn.disabled = false;
        });
        
        // Listen buttons for examples
        container.querySelectorAll('.btn-listen-example').forEach(btn => {
            btn.addEventListener('click', () => this.playWord(btn.dataset.text));
        });
        
        document.getElementById('continueBtn').addEventListener('click', () => {
            this.onChallengeComplete(state);
        });
    }

    /**
     * Show pronunciation feedback overlay
     * @private
     */
    _showPronunciationFeedback(container, scoreResult, expected, error = null) {
        const existingFeedback = container.querySelector('.pronunciation-feedback');
        if (existingFeedback) existingFeedback.remove();
        
        const feedbackDiv = document.createElement('div');
        feedbackDiv.className = 'pronunciation-feedback';
        
        if (error) {
            // Handle specific error types with helpful guidance
            let errorMessage = '';
            let errorHelp = '';
            
            if (error.message?.includes('not-allowed') || error.message?.includes('denied')) {
                errorMessage = '🎤 Microphone Access Denied';
                errorHelp = `
                    <div class="error-help">
                        <p>To practice pronunciation, please allow microphone access:</p>
                        <ol>
                            <li>Click the lock/site settings icon in your browser's address bar</li>
                            <li>Find "Microphone" and set it to "Allow"</li>
                            <li>Refresh the page and try again</li>
                        </ol>
                    </div>
                `;
            } else if (error.message?.includes('NotFoundError') || error.message?.includes('no microphone')) {
                errorMessage = '🔌 No Microphone Found';
                errorHelp = `
                    <div class="error-help">
                        <p>Please connect a microphone to practice pronunciation:</p>
                        <ul>
                            <li>Check if your microphone is plugged in</li>
                            <li>Try using a headset with a built-in mic</li>
                            <li>Check your system sound settings</li>
                        </ul>
                    </div>
                `;
            } else if (error.message?.includes('network') || !navigator.onLine) {
                errorMessage = '📡 Network Error';
                errorHelp = `
                    <div class="error-help">
                        <p>Speech recognition requires an internet connection.</p>
                        <p>Please check your network and try again.</p>
                    </div>
                `;
            } else if (error.message?.includes('not supported')) {
                errorMessage = '🌐 Browser Not Supported';
                errorHelp = `
                    <div class="error-help">
                        <p>Your browser doesn't support speech recognition.</p>
                        <p>Please try using:</p>
                        <ul>
                            <li>Google Chrome (recommended)</li>
                            <li>Microsoft Edge</li>
                            <li>Safari (on Mac/iOS)</li>
                        </ul>
                    </div>
                `;
            } else {
                errorMessage = '❓ Something Went Wrong';
                errorHelp = `
                    <div class="error-help">
                        <p>${escapeHtml(error.message || 'Please try again.')}</p>
                    </div>
                `;
            }
            
            feedbackDiv.innerHTML = `
                <div class="feedback-error speech-error">
                    <div class="error-title">${errorMessage}</div>
                    ${errorHelp}
                </div>
            `;
        } else if (!scoreResult || scoreResult.score === null || scoreResult.rating === 'no-speech') {
            feedbackDiv.innerHTML = `
                <div class="feedback-error">
                    <span class="feedback-icon">❓</span>
                    <span>Couldn't hear you clearly. Make sure your microphone is working and try again.</span>
                    <div class="error-tips">
                        <p>💡 Tips:</p>
                        <ul>
                            <li>Speak clearly and close to your microphone</li>
                            <li>Wait for the "Listening..." indicator before speaking</li>
                            <li>Try in a quieter environment</li>
                        </ul>
                    </div>
                </div>
            `;
        } else {
            const score = scoreResult.score;
            let ratingClass = 'needs-work';
            let ratingText = 'Keep practicing';
            let icon = '🔄';
            
            if (score >= 90) { ratingClass = 'excellent'; ratingText = 'Excellent! 🎉'; icon = '✨'; }
            else if (score >= 70) { ratingClass = 'good'; ratingText = 'Good job!'; icon = '👍'; }
            else if (score >= 50) { ratingClass = 'fair'; ratingText = 'Getting there'; icon = '💪'; }
            
            feedbackDiv.innerHTML = `
                <div class="feedback-result ${ratingClass}">
                    <div class="feedback-score">
                        <span class="score-icon">${icon}</span>
                        <span class="score-value">${Math.round(score)}%</span>
                        <span class="score-label">${ratingText}</span>
                    </div>
                    <div class="feedback-comparison">
                        <div class="expected-text">
                            <span class="comparison-label">Expected:</span>
                            <span class="comparison-value">${escapeHtml(expected)}</span>
                        </div>
                        ${scoreResult.transcribed ? `
                        <div class="heard-text">
                            <span class="comparison-label">We heard:</span>
                            <span class="comparison-value">${escapeHtml(scoreResult.transcribed)}</span>
                        </div>
                        ` : ''}
                    </div>
                    ${scoreResult.tips && scoreResult.tips.length > 0 ? `
                    <div class="feedback-tips">
                        <span class="tips-label">💡 Tips:</span>
                        <ul>
                            ${scoreResult.tips.slice(0, 2).map(tip => `<li>${escapeHtml(tip)}</li>`).join('')}
                        </ul>
                    </div>
                    ` : ''}
                </div>
            `;
        }
        
        const actionsDiv = container.querySelector('.learn-card-actions');
        if (actionsDiv) actionsDiv.after(feedbackDiv);
    }

    /**
     * Render MCQ challenge
     * @param {HTMLElement} container - Container element
     * @param {Object} challenge - Challenge data
     * @param {Object} state - Lesson state
     */
    renderMCQ(container, challenge, state) {
        const word = challenge.word;
        const resolved = resolveWordForm(word, this.speakerGender);
        const options = challenge.options;
        
        container.innerHTML = `
            <div class="challenge-card mcq-card">
                <div class="challenge-instruction">What does this mean?</div>
                <div class="mcq-prompt">
                    <span class="mcq-word">${escapeHtml(resolved)}</span>
                    <button class="btn-listen-small" id="listenBtn">🔊</button>
                </div>
                <div class="mcq-options" id="mcqOptions">
                    ${options.map((opt, i) => `
                        <button class="mcq-option" data-key="${opt.key}" data-index="${i}">
                            ${escapeHtml(opt.en)}
                        </button>
                    `).join('')}
                </div>
                <div class="challenge-feedback" id="feedback"></div>
                <button class="btn-save-word btn-save-small" id="saveWordBtn" data-pt="${escapeHtml(resolved)}" data-en="${escapeHtml(word.en)}">💾 Save</button>
                <div class="challenge-footer hidden" id="footerActions">
                    <button class="btn-continue" id="continueBtn">Continue</button>
                </div>
            </div>
        `;
        
        document.getElementById('listenBtn').addEventListener('click', () => this.playWord(resolved));
        document.getElementById('saveWordBtn').addEventListener('click', (e) => {
            const btn = e.target;
            this.saveToFlashcards(btn.dataset.pt, btn.dataset.en, state.lesson.title);
            btn.textContent = '✓ Saved!';
            btn.disabled = true;
        });
        
        const correctKey = getWordKey(word);
        const optionsContainer = document.getElementById('mcqOptions');
        const buttons = optionsContainer.querySelectorAll('.mcq-option');
        
        buttons.forEach(btn => {
            btn.addEventListener('click', () => {
                const selected = btn.dataset.key;
                const isCorrect = selected === correctKey;
                
                buttons.forEach(b => b.disabled = true);
                
                if (isCorrect) {
                    btn.classList.add('correct');
                    this._showFeedback(true, word.en);
                    state.correct++;
                    this.onCorrect(word, state);
                } else {
                    btn.classList.add('incorrect');
                    buttons.forEach(b => {
                        if (b.dataset.key === correctKey) b.classList.add('correct');
                    });
                    this._showFeedback(false, word.en);
                    state.mistakes++;
                    state.wrongAnswers.push({ word: resolved, english: word.en, type: 'mcq' });
                    this._handleMistake(state);
                }
                
                document.getElementById('footerActions').classList.remove('hidden');
                document.getElementById('continueBtn').addEventListener('click', () => {
                    this.onChallengeComplete(state);
                });
            });
        });
    }

    /**
     * Render Type Answer challenge
     * @param {HTMLElement} container - Container element
     * @param {Object} challenge - Challenge data
     * @param {Object} state - Lesson state
     */
    renderTypeAnswer(container, challenge, state) {
        const word = challenge.word;
        const answer = resolveWordForm(word, this.speakerGender);
        
        container.innerHTML = `
            <div class="challenge-card type-card">
                <div class="challenge-instruction">Write this in Portuguese</div>
                <div class="type-prompt">${escapeHtml(word.en)}</div>
                <input type="text" class="type-input" id="typeInput" placeholder="Type in Portuguese..." autocomplete="off" autocapitalize="off">
                <div class="challenge-feedback" id="feedback"></div>
                <button class="btn-save-word btn-save-small" id="saveWordBtn" data-pt="${escapeHtml(answer)}" data-en="${escapeHtml(word.en)}">💾 Save</button>
                <div class="challenge-footer">
                    <button class="btn-skip" id="skipBtn">Skip</button>
                    <button class="btn-check" id="checkBtn">Check</button>
                </div>
            </div>
        `;
        
        document.getElementById('saveWordBtn').addEventListener('click', (e) => {
            const btn = e.target;
            this.saveToFlashcards(btn.dataset.pt, btn.dataset.en, state.lesson.title);
            btn.textContent = '✓ Saved!';
            btn.disabled = true;
        });
        
        const input = document.getElementById('typeInput');
        const checkBtn = document.getElementById('checkBtn');
        const skipBtn = document.getElementById('skipBtn');
        
        input.focus();
        
        const checkAnswer = () => {
            const typed = normalizeText(input.value);
            const target = normalizeText(answer);
            const isCorrect = typed === target;
            
            input.disabled = true;
            checkBtn.disabled = true;
            skipBtn.disabled = true;
            
            if (isCorrect) {
                input.classList.add('correct');
                this._showFeedback(true, answer);
                state.correct++;
                this.onCorrect(word, state);
            } else {
                input.classList.add('incorrect');
                this._showFeedback(false, answer);
                state.mistakes++;
                state.wrongAnswers.push({ word: answer, english: word.en, type: 'type' });
                this._handleMistake(state);
            }
            
            checkBtn.textContent = 'Continue';
            checkBtn.disabled = false;
            checkBtn.classList.remove('btn-check');
            checkBtn.classList.add('btn-continue');
            checkBtn.onclick = () => this.onChallengeComplete(state);
        };
        
        checkBtn.addEventListener('click', checkAnswer);
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') checkAnswer();
        });
        
        skipBtn.addEventListener('click', () => {
            state.mistakes++;
            state.wrongAnswers.push({ word: answer, english: word.en, type: 'skip' });
            this._handleMistake(state);
            this._showFeedback(false, answer);
            input.disabled = true;
            checkBtn.textContent = 'Continue';
            checkBtn.classList.remove('btn-check');
            checkBtn.classList.add('btn-continue');
            checkBtn.onclick = () => this.onChallengeComplete(state);
        });
    }

    /**
     * Render Listen & Type challenge
     * @param {HTMLElement} container - Container element
     * @param {Object} challenge - Challenge data
     * @param {Object} state - Lesson state
     */
    renderListenType(container, challenge, state) {
        const word = challenge.word;
        const answer = resolveWordForm(word, this.speakerGender);
        
        container.innerHTML = `
            <div class="challenge-card listen-type-card">
                <div class="challenge-instruction">Type what you hear</div>
                <button class="btn-listen-large" id="listenBtn">🔊</button>
                <input type="text" class="type-input" id="typeInput" placeholder="Type what you hear..." autocomplete="off" autocapitalize="off">
                <div class="challenge-feedback" id="feedback"></div>
                <button class="btn-save-word btn-save-small" id="saveWordBtn" data-pt="${escapeHtml(answer)}" data-en="${escapeHtml(word.en)}">💾 Save</button>
                <div class="challenge-footer">
                    <button class="btn-skip" id="skipBtn">Skip</button>
                    <button class="btn-check" id="checkBtn">Check</button>
                </div>
            </div>
        `;
        
        // Auto-play audio
        setTimeout(() => this.playWord(answer), CHALLENGE_CONFIG.autoPlayDelay);
        
        document.getElementById('listenBtn').addEventListener('click', () => this.playWord(answer));
        document.getElementById('saveWordBtn').addEventListener('click', (e) => {
            const btn = e.target;
            this.saveToFlashcards(btn.dataset.pt, btn.dataset.en, state.lesson.title);
            btn.textContent = '✓ Saved!';
            btn.disabled = true;
        });
        
        const input = document.getElementById('typeInput');
        const checkBtn = document.getElementById('checkBtn');
        const skipBtn = document.getElementById('skipBtn');
        
        input.focus();
        
        const checkAnswer = () => {
            const typed = normalizeText(input.value);
            const target = normalizeText(answer);
            const isCorrect = typed === target;
            
            input.disabled = true;
            checkBtn.disabled = true;
            skipBtn.disabled = true;
            
            if (isCorrect) {
                input.classList.add('correct');
                this._showFeedback(true, answer);
                state.correct++;
                this.onCorrect(word, state);
            } else {
                input.classList.add('incorrect');
                this._showFeedback(false, answer);
                state.mistakes++;
                state.wrongAnswers.push({ word: answer, english: word.en, type: 'listen' });
                this._handleMistake(state);
            }
            
            checkBtn.textContent = 'Continue';
            checkBtn.disabled = false;
            checkBtn.classList.remove('btn-check');
            checkBtn.classList.add('btn-continue');
            checkBtn.onclick = () => this.onChallengeComplete(state);
        };
        
        checkBtn.addEventListener('click', checkAnswer);
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') checkAnswer();
        });
        
        skipBtn.addEventListener('click', () => {
            state.mistakes++;
            state.wrongAnswers.push({ word: answer, english: word.en, type: 'skip' });
            this._handleMistake(state);
            this._showFeedback(false, answer);
            input.disabled = true;
            checkBtn.textContent = 'Continue';
            checkBtn.classList.remove('btn-check');
            checkBtn.classList.add('btn-continue');
            checkBtn.onclick = () => this.onChallengeComplete(state);
        });
    }

    /**
     * Render Sentence challenge
     * @param {HTMLElement} container - Container element
     * @param {Object} challenge - Challenge data
     * @param {Object} state - Lesson state
     */
    renderSentence(container, challenge, state) {
        const sentence = challenge.sentence;
        
        container.innerHTML = `
            <div class="challenge-card sentence-card-challenge">
                <div class="challenge-instruction">Listen and repeat</div>
                <div class="sentence-display">
                    <div class="sentence-pt">${escapeHtml(sentence.pt)}</div>
                    <div class="sentence-en">${escapeHtml(sentence.en)}</div>
                </div>
                <button class="btn-listen-large" id="listenBtn">🔊 Listen</button>
                <button class="btn-save-word btn-save-small" id="saveWordBtn" data-pt="${escapeHtml(sentence.pt)}" data-en="${escapeHtml(sentence.en)}">💾 Save Sentence</button>
                <div class="challenge-footer">
                    <button class="btn-continue" id="continueBtn">Continue</button>
                </div>
            </div>
        `;
        
        // Auto-play
        setTimeout(() => this.playWord(sentence.pt), CHALLENGE_CONFIG.autoPlayDelay);
        
        document.getElementById('listenBtn').addEventListener('click', () => this.playWord(sentence.pt));
        document.getElementById('saveWordBtn').addEventListener('click', (e) => {
            const btn = e.target;
            this.saveToFlashcards(btn.dataset.pt, btn.dataset.en, state.lesson.title, 'sentence');
            btn.textContent = '✓ Saved!';
            btn.disabled = true;
        });
        document.getElementById('continueBtn').addEventListener('click', () => {
            this.onChallengeComplete(state);
        });
    }

    /**
     * Render Pronunciation challenge
     * @param {HTMLElement} container - Container element
     * @param {Object} challenge - Challenge data
     * @param {Object} state - Lesson state
     */
    renderPronunciation(container, challenge, state) {
        const word = challenge.word;
        const resolved = resolveWordForm(word, this.speakerGender);
        const knowledge = this.getWordKnowledge(resolved);
        const maxAttempts = challenge.maxAttempts || CHALLENGE_CONFIG.maxPronunciationAttempts;
        const passScore = CHALLENGE_CONFIG.pronunciationPassScore;
        
        const pronInfo = knowledge?.pronunciation;
        const hasPronounciation = pronInfo && pronInfo.ipa;
        
        const pronChallenges = state.challenges.filter(c => c.type === CHALLENGE_TYPES.PRONUNCIATION);
        const currentPronIndex = pronChallenges.findIndex(c => c === challenge) + 1;
        
        container.innerHTML = `
            <div class="challenge-card pronunciation-card" id="pronunciationCard">
                <div class="challenge-header">
                    <div class="challenge-instruction">🎤 Say this word aloud</div>
                    <div class="attempt-tracker" id="attemptTracker">
                        Attempt <span id="attemptNum">1</span> of ${maxAttempts}
                    </div>
                </div>
                
                <div class="pronunciation-target">
                    <div class="target-word" id="targetWord">${escapeHtml(resolved)}</div>
                    ${hasPronounciation ? `
                        <div class="pronunciation-guide">
                            <span class="ipa">[${escapeHtml(pronInfo.ipa)}]</span>
                            ${pronInfo.breakdown ? `<span class="breakdown">${escapeHtml(pronInfo.breakdown)}</span>` : ''}
                        </div>
                    ` : ''}
                    <button class="btn-listen-large" id="listenBtn">🔊 Listen First</button>
                </div>
                
                ${pronInfo?.tip ? `
                    <div class="pronunciation-tip">
                        <span class="tip-icon">💡</span>
                        <span class="tip-text">${escapeHtml(pronInfo.tip)}</span>
                    </div>
                ` : ''}
                
                <div class="pronunciation-meaning">
                    <span class="meaning-label">Meaning:</span>
                    <span class="meaning-text">${escapeHtml(word.en)}</span>
                </div>
                
                <div class="pronunciation-controls">
                    <button class="btn-record" id="recordBtn">
                        <span class="record-icon">🎙️</span>
                        <span class="record-text">Tap to Speak</span>
                    </button>
                    <div class="recording-indicator hidden" id="recordingIndicator">
                        <span class="pulse"></span> Listening...
                    </div>
                </div>
                
                <div class="pronunciation-result hidden" id="resultArea">
                    <div class="result-score" id="resultScore"></div>
                    <div class="result-comparison" id="resultComparison"></div>
                    <div class="result-feedback" id="resultFeedback"></div>
                </div>
                
                <div class="pronunciation-actions hidden" id="actionArea">
                    <button class="btn-retry" id="retryBtn">🔄 Try Again</button>
                    <button class="btn-continue" id="continueBtn">Continue →</button>
                </div>
                
                <div class="challenge-footer">
                    <div class="word-progress-indicator">Pronunciation ${currentPronIndex} of ${pronChallenges.length}</div>
                </div>
            </div>
        `;
        
        let currentAttempt = 0;
        let bestScore = null;
        let passed = false;
        
        document.getElementById('listenBtn').addEventListener('click', () => this.playWord(resolved));
        setTimeout(() => this.playWord(resolved), CHALLENGE_CONFIG.autoPlayDelay);
        
        const recordBtn = document.getElementById('recordBtn');
        const recordingIndicator = document.getElementById('recordingIndicator');
        const resultArea = document.getElementById('resultArea');
        const actionArea = document.getElementById('actionArea');
        const attemptNumSpan = document.getElementById('attemptNum');
        
        recordBtn.addEventListener('click', async () => {
            if (passed || currentAttempt >= maxAttempts) return;
            
            currentAttempt++;
            attemptNumSpan.textContent = currentAttempt;
            
            recordBtn.classList.add('hidden');
            recordingIndicator.classList.remove('hidden');
            resultArea.classList.add('hidden');
            actionArea.classList.add('hidden');
            
            try {
                const result = await this.testPronunciation(resolved, {
                    maxAttempts: 1,
                    timeoutMs: 5000,
                    wordKnowledge: knowledge
                });
                
                const score = result.bestScore;
                
                if (!bestScore || score.score > bestScore.score) {
                    bestScore = score;
                }
                
                if (score.score >= passScore) {
                    passed = true;
                }
                
                recordingIndicator.classList.add('hidden');
                resultArea.classList.remove('hidden');
                
                this._displayPronunciationResult(
                    score, resolved, currentAttempt, maxAttempts, 
                    passed, passScore, state, word, bestScore
                );
                
            } catch (err) {
                console.error('Pronunciation test error:', err);
                recordingIndicator.classList.add('hidden');
                recordBtn.classList.remove('hidden');
                
                resultArea.classList.remove('hidden');
                document.getElementById('resultScore').innerHTML = `
                    <div class="score-display error">
                        <span class="score-emoji">❌</span>
                        <span class="score-text">Error</span>
                    </div>
                `;
                document.getElementById('resultFeedback').innerHTML = `
                    <div class="feedback-error">${escapeHtml(err.message)}</div>
                `;
                actionArea.classList.remove('hidden');
            }
        });
    }

    /**
     * Display pronunciation result
     * @private
     */
    _displayPronunciationResult(score, expected, attempt, maxAttempts, hasPassed, passThreshold, state, word, bestScore) {
        const scoreDisplay = document.getElementById('resultScore');
        const comparison = document.getElementById('resultComparison');
        const feedback = document.getElementById('resultFeedback');
        const actionArea = document.getElementById('actionArea');
        const recordBtn = document.getElementById('recordBtn');
        
        const scorePercent = Math.round(score.score);
        const scoreClass = scorePercent >= 90 ? 'excellent' : 
                          scorePercent >= 75 ? 'good' : 
                          scorePercent >= 60 ? 'fair' : 
                          scorePercent >= 40 ? 'needs-work' : 'poor';
        
        const emoji = scorePercent >= 90 ? '🎉' : scorePercent >= 75 ? '👍' : scorePercent >= 60 ? '💪' : scorePercent >= 40 ? '🔄' : '😅';
        
        scoreDisplay.innerHTML = `
            <div class="score-display ${scoreClass}">
                <div class="score-meter">
                    <div class="score-fill" style="width: ${scorePercent}%"></div>
                    <div class="pass-marker" style="left: ${passThreshold}%"></div>
                </div>
                <div class="score-value">
                    <span class="score-emoji">${emoji}</span>
                    <span class="score-number">${scorePercent}%</span>
                    <span class="score-label">${score.rating || 'Score'}</span>
                </div>
            </div>
        `;
        
        const heard = score.transcribed || '(nothing detected)';
        comparison.innerHTML = `
            <div class="comparison-row">
                <span class="comparison-label">Expected:</span>
                <span class="comparison-value expected">${escapeHtml(expected)}</span>
            </div>
            <div class="comparison-row">
                <span class="comparison-label">We heard:</span>
                <span class="comparison-value heard">${escapeHtml(heard)}</span>
            </div>
        `;
        
        feedback.innerHTML = `
            <div class="feedback-message ${hasPassed ? 'passed' : ''}">${score.feedback || ''}</div>
        `;
        
        actionArea.classList.remove('hidden');
        
        const retryBtn = document.getElementById('retryBtn');
        const continueBtn = document.getElementById('continueBtn');
        
        if (hasPassed) {
            retryBtn.classList.add('hidden');
            continueBtn.classList.remove('hidden');
            continueBtn.textContent = 'Continue →';
            document.getElementById('pronunciationCard').classList.add('challenge-passed');
        } else if (attempt >= maxAttempts) {
            retryBtn.classList.add('hidden');
            continueBtn.classList.remove('hidden');
            continueBtn.textContent = 'Continue (need more practice) →';
            document.getElementById('pronunciationCard').classList.add('challenge-failed');
            
            if (!state.weakWords) state.weakWords = [];
            if (!state.weakWords.find(w => getWordKey(w) === getWordKey(word))) {
                state.weakWords.push(word);
            }
        } else {
            retryBtn.classList.remove('hidden');
            continueBtn.classList.add('hidden');
            recordBtn.classList.remove('hidden');
        }
        
        retryBtn.onclick = () => {
            resultArea.classList.add('hidden');
            actionArea.classList.add('hidden');
            recordBtn.classList.remove('hidden');
        };
        
        continueBtn.onclick = () => {
            if (bestScore) {
                state.pronunciationScores = state.pronunciationScores || {};
                state.pronunciationScores[getWordKey(word)] = bestScore.score;
            }
            this.onChallengeComplete(state);
        };
    }

    /**
     * Show challenge feedback
     * @private
     */
    _showFeedback(isCorrect, correctAnswer = null) {
        const feedback = document.getElementById('feedback');
        if (!feedback) return;
        
        if (isCorrect) {
            feedback.innerHTML = `<div class="feedback-correct">✓ Correct!</div>`;
            feedback.className = 'challenge-feedback success';
        } else {
            feedback.innerHTML = `
                <div class="feedback-incorrect">✗ Incorrect</div>
                ${correctAnswer ? `<div class="feedback-answer">Correct answer: <strong>${escapeHtml(correctAnswer)}</strong></div>` : ''}
            `;
            feedback.className = 'challenge-feedback error';
        }
    }

    /**
     * Handle mistake (heart loss)
     * @private
     */
    _handleMistake(state) {
        const stillHasHearts = this.loseHeart();
        this.onHeartsUpdate();
        this.onMistake(state);
        
        if (!stillHasHearts && !this.hasHearts()) {
            setTimeout(() => this.onShowHeartsModal(), 500);
        }
    }
}

// ============================================================================
// DEFAULT EXPORT
// ============================================================================

export default ChallengeRenderer;
