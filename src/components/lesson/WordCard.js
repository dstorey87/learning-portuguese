/**
 * Word Card Component
 * 
 * Provides karaoke-style word and sentence cards with:
 * - Character-by-character highlighting during speech
 * - Word-by-word highlighting for sentences
 * - Progress bar animation
 * - Click to hear functionality
 * - Edge-TTS integration with Web Speech fallback
 * 
 * @module components/lesson/WordCard
 */

// ============================================================================
// CONFIGURATION
// ============================================================================

/**
 * Word card configuration
 */
export const WORD_CARD_CONFIG = {
    defaultRate: 0.6,
    minDurationMs: 500,
    sentenceMinDurationMs: 1000,
    charDurationFactor: 80,
    sentenceCharDurationFactor: 60,
    highlightDelay: 500,
    sentenceHighlightDelay: 600
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

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
 * Wrap each character in a span for karaoke highlighting
 * @param {string} text - Text to wrap
 * @param {string} className - CSS class for spans
 * @returns {string} HTML string with wrapped characters
 */
export function wrapCharsInSpans(text, className) {
    return text.split('').map((char, i) => 
        char === ' ' 
            ? `<span class="${className} space" data-index="${i}"> </span>`
            : `<span class="${className}" data-index="${i}">${escapeHtml(char)}</span>`
    ).join('');
}

/**
 * Wrap each word in a span for word highlighting
 * @param {string} text - Text to wrap
 * @param {string} className - CSS class for spans
 * @returns {string} HTML string with wrapped words
 */
export function wrapWordsInSpans(text, className) {
    return text.split(/\s+/).map((word, i) => 
        `<span class="${className}" data-index="${i}">${escapeHtml(word)}</span>`
    ).join(' ');
}

/**
 * Clear all karaoke highlights from a card
 * @param {HTMLElement} card - Card element
 */
export function clearKaraokeHighlights(card) {
    card.querySelectorAll('.highlighted, .current').forEach(el => {
        el.classList.remove('highlighted', 'current');
    });
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
 * Get word index from character index
 * @param {string} text - Full text
 * @param {number} charIndex - Character index
 * @returns {number} Word index
 */
export function getWordIndexFromCharIndex(text, charIndex) {
    const beforeCursor = text.substring(0, charIndex);
    return beforeCursor.split(/\s+/).length - 1;
}

// ============================================================================
// WORD CARD CLASS
// ============================================================================

/**
 * WordCard - Creates karaoke-style word cards with audio
 */
export class WordCard {
    /**
     * Create a WordCard instance
     * @param {Object} options - Options
     * @param {Function} options.speak - TTS speak function (returns promise)
     * @param {Function} options.checkServerHealth - Check TTS server health
     * @param {Function} options.getSpeechRate - Get current speech rate
     * @param {string} options.speakerGender - User's speaker gender
     */
    constructor(options = {}) {
        this.speak = options.speak || (async () => {});
        this.checkServerHealth = options.checkServerHealth || (async () => false);
        this.getSpeechRate = options.getSpeechRate || (() => WORD_CARD_CONFIG.defaultRate);
        this.speakerGender = options.speakerGender || 'male';
        this.defaultVoice = options.defaultVoice || 'pt-PT-RaquelNeural';
    }

    /**
     * Update speaker gender
     * @param {string} gender - 'male' or 'female'
     */
    setSpeakerGender(gender) {
        this.speakerGender = gender;
    }

    /**
     * Create a word card element
     * @param {Object} word - Word object with pt, en, and optional gendered fields
     * @returns {HTMLElement} Word card element
     */
    create(word) {
        const resolved = resolveWordForm(word, this.speakerGender);
        const alt = getAlternateForm(word, this.speakerGender);
        const card = document.createElement('div');
        card.className = 'word-card karaoke-card';
        
        const ptChars = wrapCharsInSpans(resolved, 'pt-char');
        const enChars = wrapCharsInSpans(word.en, 'en-char');
        
        card.innerHTML = `
            <div class="karaoke-word">
                <div class="portuguese karaoke-text" data-text="${escapeHtml(resolved)}">${ptChars}</div>
                <div class="english karaoke-text" data-text="${escapeHtml(word.en)}">${enChars}</div>
                ${alt ? `<div class="alt-form">Alternate: ${escapeHtml(alt)}</div>` : ''}
                <div class="play-hint">🔊 Click to hear</div>
            </div>
            <div class="karaoke-progress" aria-hidden="true"></div>
        `;
        
        card.addEventListener('click', () => {
            this.playWithKaraokeHighlight(card, resolved, word.en);
        });
        
        return card;
    }

    /**
     * Create a sentence card element
     * @param {Object} sentence - Sentence object with pt and en
     * @returns {HTMLElement} Sentence card element
     */
    createSentence(sentence) {
        const card = document.createElement('div');
        card.className = 'sentence-card karaoke-card';
        
        const ptWordSpans = wrapWordsInSpans(sentence.pt, 'pt-word');
        const enWordSpans = wrapWordsInSpans(sentence.en, 'en-word');
        
        card.innerHTML = `
            <div class="karaoke-sentence">
                <div class="portuguese karaoke-text sentence-text">${ptWordSpans}</div>
                <div class="english karaoke-text sentence-text">${enWordSpans}</div>
                <div class="play-hint">🔊 Click to hear sentence</div>
            </div>
            <div class="karaoke-progress" aria-hidden="true"></div>
        `;
        
        card.addEventListener('click', () => {
            this.playWithWordHighlight(card, sentence.pt, sentence.en);
        });
        
        return card;
    }

    /**
     * Play word with character-by-character karaoke highlighting
     * @param {HTMLElement} card - Card element
     * @param {string} ptText - Portuguese text
     * @param {string} enText - English text (unused but kept for consistency)
     */
    async playWithKaraokeHighlight(card, ptText, _enText) {
        clearKaraokeHighlights(card);
        
        card.classList.add('playing');
        const progressBar = card.querySelector('.karaoke-progress');
        if (progressBar) progressBar.style.width = '0%';
        
        const ptChars = card.querySelectorAll('.pt-char');
        const enChars = card.querySelectorAll('.en-char');
        const totalChars = ptChars.length;
        
        const rate = this.getSpeechRate();
        const estimatedDuration = Math.max(
            WORD_CARD_CONFIG.minDurationMs, 
            (ptText.length * WORD_CARD_CONFIG.charDurationFactor) / rate
        );
        
        let currentCharIndex = 0;
        let animationId = null;
        let startTime = null;
        
        const animateHighlight = (timestamp) => {
            if (!startTime) startTime = timestamp;
            const elapsed = timestamp - startTime;
            const progress = Math.min(elapsed / estimatedDuration, 1);
            
            if (progressBar) progressBar.style.width = `${progress * 100}%`;
            
            const targetCharIndex = Math.floor(progress * totalChars);
            
            while (currentCharIndex <= targetCharIndex && currentCharIndex < totalChars) {
                if (ptChars[currentCharIndex]) {
                    ptChars[currentCharIndex].classList.add('highlighted');
                }
                const enIndex = Math.floor((currentCharIndex / totalChars) * enChars.length);
                if (enChars[enIndex] && !enChars[enIndex].classList.contains('highlighted')) {
                    enChars[enIndex].classList.add('highlighted');
                }
                currentCharIndex++;
            }
            
            if (progress < 1) {
                animationId = requestAnimationFrame(animateHighlight);
            } else {
                ptChars.forEach(c => c.classList.add('highlighted'));
                enChars.forEach(c => c.classList.add('highlighted'));
                setTimeout(() => {
                    clearKaraokeHighlights(card);
                    card.classList.remove('playing');
                    if (progressBar) progressBar.style.width = '0%';
                }, WORD_CARD_CONFIG.highlightDelay);
            }
        };
        
        const cleanup = () => {
            if (animationId) cancelAnimationFrame(animationId);
            clearKaraokeHighlights(card);
            card.classList.remove('playing');
            if (progressBar) progressBar.style.width = '0%';
        };
        
        const finishAnimation = () => {
            if (animationId) cancelAnimationFrame(animationId);
            ptChars.forEach(c => c.classList.add('highlighted'));
            enChars.forEach(c => c.classList.add('highlighted'));
            setTimeout(() => {
                clearKaraokeHighlights(card);
                card.classList.remove('playing');
                if (progressBar) progressBar.style.width = '0%';
            }, WORD_CARD_CONFIG.highlightDelay);
        };
        
        // Try Edge-TTS first
        try {
            const serverOk = await this.checkServerHealth();
            if (serverOk) {
                startTime = null;
                animationId = requestAnimationFrame(animateHighlight);
                
                await this.speak(ptText, {
                    voice: this.defaultVoice,
                    rate: rate,
                    onEnd: finishAnimation,
                    onError: cleanup
                });
                return;
            }
        } catch (e) {
            console.warn('Edge-TTS unavailable for karaoke:', e.message);
            cleanup();
        }
        
        // Fallback to Web Speech API
        await this._playWithWebSpeech(ptText, rate, animateHighlight, finishAnimation, cleanup);
    }

    /**
     * Play sentence with word-by-word highlighting
     * @param {HTMLElement} card - Card element
     * @param {string} ptText - Portuguese text
     * @param {string} enText - English text (unused)
     */
    async playWithWordHighlight(card, ptText, _enText) {
        clearKaraokeHighlights(card);
        
        card.classList.add('playing');
        const progressBar = card.querySelector('.karaoke-progress');
        if (progressBar) progressBar.style.width = '0%';
        
        const ptWords = card.querySelectorAll('.pt-word');
        const enWords = card.querySelectorAll('.en-word');
        const totalWords = ptWords.length;
        
        const rate = this.getSpeechRate();
        const estimatedDuration = Math.max(
            WORD_CARD_CONFIG.sentenceMinDurationMs,
            (ptText.length * WORD_CARD_CONFIG.sentenceCharDurationFactor) / rate
        );
        
        let currentWordIndex = 0;
        let animationId = null;
        let startTime = null;
        
        const animateHighlight = (timestamp) => {
            if (!startTime) startTime = timestamp;
            const elapsed = timestamp - startTime;
            const progress = Math.min(elapsed / estimatedDuration, 1);
            
            if (progressBar) progressBar.style.width = `${progress * 100}%`;
            
            const targetWordIndex = Math.floor(progress * totalWords);
            
            while (currentWordIndex <= targetWordIndex && currentWordIndex < totalWords) {
                ptWords.forEach(w => w.classList.remove('current'));
                enWords.forEach(w => w.classList.remove('current'));
                
                if (ptWords[currentWordIndex]) {
                    ptWords[currentWordIndex].classList.add('highlighted', 'current');
                }
                const enIndex = Math.min(
                    Math.floor((currentWordIndex / totalWords) * enWords.length),
                    enWords.length - 1
                );
                if (enWords[enIndex]) {
                    enWords[enIndex].classList.add('highlighted', 'current');
                }
                currentWordIndex++;
            }
            
            if (progress < 1) {
                animationId = requestAnimationFrame(animateHighlight);
            } else {
                ptWords.forEach(w => { w.classList.add('highlighted'); w.classList.remove('current'); });
                enWords.forEach(w => { w.classList.add('highlighted'); w.classList.remove('current'); });
                setTimeout(() => {
                    clearKaraokeHighlights(card);
                    card.classList.remove('playing');
                    if (progressBar) progressBar.style.width = '0%';
                }, WORD_CARD_CONFIG.sentenceHighlightDelay);
            }
        };
        
        const cleanup = () => {
            if (animationId) cancelAnimationFrame(animationId);
            clearKaraokeHighlights(card);
            card.classList.remove('playing');
            if (progressBar) progressBar.style.width = '0%';
        };
        
        const finishAnimation = () => {
            if (animationId) cancelAnimationFrame(animationId);
            ptWords.forEach(w => { w.classList.add('highlighted'); w.classList.remove('current'); });
            enWords.forEach(w => { w.classList.add('highlighted'); w.classList.remove('current'); });
            setTimeout(() => {
                clearKaraokeHighlights(card);
                card.classList.remove('playing');
                if (progressBar) progressBar.style.width = '0%';
            }, WORD_CARD_CONFIG.sentenceHighlightDelay);
        };
        
        // Try Edge-TTS first
        try {
            const serverOk = await this.checkServerHealth();
            if (serverOk) {
                startTime = null;
                animationId = requestAnimationFrame(animateHighlight);
                
                await this.speak(ptText, {
                    voice: this.defaultVoice,
                    rate: rate,
                    onEnd: finishAnimation,
                    onError: cleanup
                });
                return;
            }
        } catch (e) {
            console.warn('Edge-TTS unavailable for word highlight:', e.message);
            cleanup();
        }
        
        // Fallback to Web Speech API with word boundary support
        await this._playWithWebSpeechWords(
            ptText, rate, totalWords, ptWords, enWords,
            animateHighlight, finishAnimation, cleanup
        );
    }

    /**
     * Play using Web Speech API (fallback for characters)
     * @private
     */
    async _playWithWebSpeech(text, rate, onAnimate, onFinish, onError) {
        if (!('speechSynthesis' in window)) {
            console.warn('Speech synthesis not supported');
            onError();
            return;
        }
        
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'pt-PT';
        utterance.rate = rate;
        
        let voices = speechSynthesis.getVoices();
        if (voices.length === 0) {
            await new Promise(resolve => {
                speechSynthesis.onvoiceschanged = () => {
                    voices = speechSynthesis.getVoices();
                    resolve();
                };
                setTimeout(resolve, 500);
            });
        }
        
        const ptPTVoice = voices.find(v => v.lang === 'pt-PT') ||
                         voices.find(v => v.lang.startsWith('pt-PT'));
        if (ptPTVoice) utterance.voice = ptPTVoice;
        
        utterance.onstart = () => requestAnimationFrame(onAnimate);
        utterance.onend = onFinish;
        utterance.onerror = onError;
        
        speechSynthesis.cancel();
        speechSynthesis.speak(utterance);
    }

    /**
     * Play using Web Speech API with word boundary events (fallback for sentences)
     * @private
     */
    async _playWithWebSpeechWords(text, rate, totalWords, ptWords, enWords, onAnimate, onFinish, onError) {
        if (!('speechSynthesis' in window)) {
            console.warn('Speech synthesis not supported');
            onError();
            return;
        }
        
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'pt-PT';
        utterance.rate = rate;
        
        let voices = speechSynthesis.getVoices();
        if (voices.length === 0) {
            await new Promise(resolve => {
                speechSynthesis.onvoiceschanged = () => {
                    voices = speechSynthesis.getVoices();
                    resolve();
                };
                setTimeout(resolve, 500);
            });
        }
        
        const ptPTVoice = voices.find(v => v.lang === 'pt-PT') ||
                         voices.find(v => v.lang.startsWith('pt-PT'));
        if (ptPTVoice) utterance.voice = ptPTVoice;
        
        // Use boundary events for word-level sync
        utterance.onboundary = (event) => {
            if (event.name === 'word') {
                const wordIndex = getWordIndexFromCharIndex(text, event.charIndex);
                if (wordIndex >= 0 && wordIndex < totalWords) {
                    ptWords.forEach(w => w.classList.remove('current'));
                    enWords.forEach(w => w.classList.remove('current'));
                    
                    if (ptWords[wordIndex]) {
                        ptWords[wordIndex].classList.add('highlighted', 'current');
                    }
                    const enIndex = Math.min(
                        Math.floor((wordIndex / totalWords) * enWords.length),
                        enWords.length - 1
                    );
                    if (enWords[enIndex]) {
                        enWords[enIndex].classList.add('highlighted', 'current');
                    }
                }
            }
        };
        
        utterance.onstart = () => requestAnimationFrame(onAnimate);
        utterance.onend = onFinish;
        utterance.onerror = onError;
        
        speechSynthesis.cancel();
        speechSynthesis.speak(utterance);
    }
}

// ============================================================================
// FACTORY FUNCTIONS
// ============================================================================

/**
 * Create a word card (standalone function)
 * @param {Object} word - Word object
 * @param {Object} options - WordCard options
 * @returns {HTMLElement} Word card element
 */
export function createWordCard(word, options = {}) {
    const cardInstance = new WordCard(options);
    return cardInstance.create(word);
}

/**
 * Create a sentence card (standalone function)
 * @param {Object} sentence - Sentence object
 * @param {Object} options - WordCard options
 * @returns {HTMLElement} Sentence card element
 */
export function createSentenceCard(sentence, options = {}) {
    const cardInstance = new WordCard(options);
    return cardInstance.createSentence(sentence);
}

// ============================================================================
// DEFAULT EXPORT
// ============================================================================

export default WordCard;
