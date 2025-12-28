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
 * @updated Phase 14 - Enhanced with new speech services
 * @updated Phase 4 - Accordion-based lesson options panel
 */

import { AudioVisualizer, RECORDING_STATE } from './AudioVisualizer.js';
import { LessonOptionsPanel, createLessonOptionsPanel } from './LessonOptionsPanel.js';
import { 
    getWebSpeechService, 
    isWebSpeechAvailable,
    RECOGNITION_EVENTS 
} from '../../services/WebSpeechService.js';
import { 
    calculateScore as phoneticScore,
    PHONETIC_CONFIG 
} from '../../services/PhoneticScorer.js';
import { createLogger } from '../../services/Logger.js';
import eventStream from '../../services/eventStreaming.js';
import { 
    recordPronunciationAttempt, 
    getCompletedLessons, 
    getLearnedWords 
} from '../../services/ProgressTracker.js';
import { getLessonImage } from './LessonCard.js';
import { getAllLessons } from '../../data/LessonLoader.js';

// Create logger for this module
const logger = createLogger({ context: 'ChallengeRenderer' });

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
    SENTENCE: 'sentence',
    // Rich challenge types from building-blocks
    MULTIPLE_CHOICE: 'multiple-choice',
    TRANSLATE: 'translate',
    FILL_BLANK: 'fill-blank',
    // Additional challenge types
    MATCH: 'match',
    SENTENCE_BUILDER: 'sentence-builder',
    CONJUGATION: 'conjugation',
    // Rescue-specific challenge types (learning style drills)
    RESCUE_KEYWORD: 'rescue-keyword-mnemonic',
    RESCUE_MULTI_SENSORY: 'rescue-multi-sensory',
    RESCUE_MEMORY_PALACE: 'rescue-memory-palace',
    RESCUE_ACTIVE_RECALL: 'rescue-active-recall',
    RESCUE_SPACED_REPETITION: 'rescue-spaced-repetition',
    RESCUE_FEYNMAN: 'rescue-feynman',
    RESCUE_CONTEXT_FLOOD: 'rescue-context-flood'
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
 * Uses PHONETIC_CONFIG for consistency with scoring service
 */
export const CHALLENGE_CONFIG = {
    passThreshold: 85,
    pronunciationPassScore: PHONETIC_CONFIG.fairScore, // 60 - synced with PhoneticScorer
    pronunciationGoodScore: PHONETIC_CONFIG.goodScore, // 75
    pronunciationExcellentScore: PHONETIC_CONFIG.excellentScore, // 90
    maxPronunciationAttempts: 3,
    animationDuration: 200,
    autoPlayDelay: 300
};

// Rescue challenge type registry for quick lookup
const RESCUE_CHALLENGE_TYPES = new Set([
    CHALLENGE_TYPES.RESCUE_KEYWORD,
    CHALLENGE_TYPES.RESCUE_MULTI_SENSORY,
    CHALLENGE_TYPES.RESCUE_MEMORY_PALACE,
    CHALLENGE_TYPES.RESCUE_ACTIVE_RECALL,
    CHALLENGE_TYPES.RESCUE_SPACED_REPETITION,
    CHALLENGE_TYPES.RESCUE_FEYNMAN,
    CHALLENGE_TYPES.RESCUE_CONTEXT_FLOOD
]);

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
 * Resolve the best image for a challenge, prioritizing word/challenge images
 * and falling back to lesson-level imagery.
 */
function resolveChallengeImage(challenge, lesson) {
    const toBackground = (value) => {
        if (!value) return null;
        return value.startsWith('url(') ? value : `url('${value}')`;
    };

    const challengeImage = toBackground(challenge.image || challenge.media?.image);
    const wordRemote = toBackground(buildWordRemoteImage(challenge.word, lesson));
    const wordImage = toBackground(challenge.word?.image || challenge.word?.media?.image);
    const wordSvg = buildWordSvg(challenge.word, lesson);
    const lessonImage = lesson ? getLessonImage(lesson) : getLessonImage({ topicId: 'default' });
    // Prefer remote word art → explicit word image → SVG → lesson image
    return challengeImage || wordRemote || wordImage || wordSvg || lessonImage;
}

// Generate a deterministic inline SVG for each word so every challenge has a unique, relevant visual
function buildWordSvg(word, lesson) {
    if (!word) return null;
    const base = `${word.pt || word.en || 'word'}-${lesson?.title || ''}`.toLowerCase();
    let hash = 0;
    for (let i = 0; i < base.length; i += 1) {
        hash = (hash << 5) - hash + base.charCodeAt(i);
        hash |= 0;
    }
    const hue = Math.abs(hash) % 360;
    const hue2 = (Math.abs(hash * 7)) % 360;
    const pt = (word.pt || '').slice(0, 18);
    const en = (word.en || '').slice(0, 22);
    const svg = `
<svg xmlns='http://www.w3.org/2000/svg' width='400' height='250'>
  <defs>
    <linearGradient id='wg' x1='0' y1='0' x2='1' y2='1'>
      <stop offset='0%' stop-color='hsl(${hue},70%,48%)' />
      <stop offset='100%' stop-color='hsl(${hue2},70%,35%)' />
    </linearGradient>
  </defs>
  <rect width='400' height='250' rx='18' fill='url(#wg)' />
  <text x='24' y='120' fill='rgba(255,255,255,0.95)' font-family='Arial, sans-serif' font-size='28' font-weight='700'>${pt}</text>
  <text x='24' y='160' fill='rgba(255,255,255,0.85)' font-family='Arial, sans-serif' font-size='16'>${en}</text>
</svg>`;
    return `url('data:image/svg+xml;utf8,${encodeURIComponent(svg)}')`;
}

// Build a deterministic, vocab-aware remote image for the current word
const WORD_IMAGE_POOL = [
    'photo-1503676382389-4809596d5290',
    'photo-1500530855697-b586d89ba3ee',
    'photo-1484795819573-86ae049cb815',
    'photo-1501004318641-b39e6451bec6',
    'photo-1501004318641-44fdc4482f5b',
    'photo-1485846234645-a62644f84728',
    'photo-1504384308090-c894fdcc538d',
    'photo-1473181488821-2d23949a045a',
    'photo-1520607162513-77705c0f0d4a'
];

// Semantic keyword mapping for abstract/grammar words that don't have direct visual representations
const WORD_KEYWORD_MAP = {
    // Pronouns - use visual concepts instead of the word itself
    'i': 'person,self,portrait,me',
    'you': 'people,pointing,conversation',
    'he': 'man,male,portrait',
    'she': 'woman,female,portrait',
    'we': 'group,team,together,friends',
    'they': 'people,crowd,group',
    // Verbs
    'to be': 'existence,identity,being',
    'to have': 'possession,holding,hands',
    'to go': 'walking,journey,movement',
    'to want': 'desire,wishing,hoping',
    'to speak': 'talking,conversation,speech',
    // Articles/grammar words - use abstract visuals
    'the': 'object,thing,pointing',
    'a': 'single,one,item',
    'and': 'connection,together,joining',
    'or': 'choice,options,decision',
    'but': 'contrast,however,difference',
    'because': 'reason,thinking,logic',
    'if': 'question,maybe,possibility',
    'with': 'together,companionship,pair',
    'for': 'purpose,gift,giving',
    'from': 'origin,source,direction',
    'in': 'inside,interior,location',
    'on': 'surface,above,placement',
    'at': 'location,place,spot',
    // Question words
    'what': 'question,curious,wondering',
    'who': 'person,identity,mystery',
    'where': 'location,map,place',
    'when': 'time,clock,calendar',
    'why': 'question,reason,thinking',
    'how': 'method,process,learning',
    // Negation
    'yes': 'affirmative,thumbs-up,positive',
    'no': 'negative,stop,rejection',
    'never': 'prohibition,never,forbidden',
    'always': 'infinity,forever,constant',
    'nothing': 'empty,void,absence',
    // Possessives
    'my': 'mine,ownership,personal',
    'your': 'yours,giving,sharing',
    'his': 'male,possession,his',
    'her': 'female,possession,hers',
    'our': 'group,shared,community',
    'their': 'others,group,collective'
};

function buildWordRemoteImage(word, lesson) {
    if (!word) return null;
    
    // Get English translation
    const english = (word.en || word.english || '').toLowerCase().trim();
    if (!english) return null;
    
    // Check for mapped keywords for abstract/grammar words
    let keywords = WORD_KEYWORD_MAP[english];
    
    if (!keywords) {
        // For concrete nouns/adjectives, use the English word directly
        // Clean it up for URL usage
        keywords = english.replace(/[^a-z0-9\s]/gi, '').replace(/\s+/g, ',');
    }
    
    // Add unique signature based on Portuguese word to get variety
    const sig = Math.abs((word.pt || word.id || english).split('').reduce((h, ch) => ((h << 5) - h + ch.charCodeAt(0)) | 0, 0));
    
    // Use Unsplash Source API for semantic image search
    return `https://source.unsplash.com/400x250/?${encodeURIComponent(keywords)}&sig=${sig}`;
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
        pt: option.pt,
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
    const words = lesson.words || [];
    const sentences = lesson.sentences || [];
    const learnedWords = options.learnedWords || [];
    const challenges = [];
    let challengeIndex = 0;
    
    // Phase 1: Learn new words (always generate for any lesson with words)
    words.forEach((word, idx) => {
        challenges.push({
            type: CHALLENGE_TYPES.LEARN_WORD,
            word,
            phase: CHALLENGE_PHASES.LEARN,
            index: challengeIndex++
        });
    });
    
    // If lesson has custom rich challenges, use them after the learn phase
    if (lesson.challenges && lesson.challenges.length > 0) {
        lesson.challenges.forEach(challenge => {
            challenges.push({
                ...challenge,
                index: challengeIndex++,
                // Ensure word reference is resolved if challenge references word by index
                word: typeof challenge.wordIndex === 'number' 
                    ? lesson.words?.[challenge.wordIndex] 
                    : challenge.word
            });
        });
        
        return challenges;
    }
    
    // FALLBACK: Auto-generate practice challenges from words (legacy lessons)
    
    // Phase 2: Pronunciation practice - say each word
    const pronWords = shuffleArray([...words]).slice(0, Math.min(4, words.length));
    pronWords.forEach(word => {
        challenges.push({
            type: CHALLENGE_TYPES.PRONUNCIATION,
            word,
            phase: CHALLENGE_PHASES.PRONOUNCE,
            maxAttempts: CHALLENGE_CONFIG.maxPronunciationAttempts,
            index: challengeIndex++
        });
    });
    
    // Phase 3: Multiple choice quizzes
    const shuffledWords = shuffleArray([...words]);
    shuffledWords.forEach(word => {
        challenges.push({
            type: CHALLENGE_TYPES.MCQ,
            word,
            phase: CHALLENGE_PHASES.PRACTICE,
            options: buildQuizOptions(word, words, learnedWords),
            index: challengeIndex++
        });
    });
    
    // Phase 4: Type the Portuguese (fill in blank)
    const fillWords = shuffleArray([...words]).slice(0, Math.min(5, words.length));
    fillWords.forEach(word => {
        challenges.push({
            type: CHALLENGE_TYPES.TYPE_ANSWER,
            word,
            phase: CHALLENGE_PHASES.PRACTICE,
            options: buildQuizOptions(word, words, learnedWords),
            index: challengeIndex++
        });
    });
    
    // Phase 5: Listen and type
    const listenWords = shuffleArray([...words]).slice(0, Math.min(3, words.length));
    listenWords.forEach(word => {
        challenges.push({
            type: CHALLENGE_TYPES.LISTEN_TYPE,
            word,
            phase: CHALLENGE_PHASES.PRACTICE,
            options: buildQuizOptions(word, words, learnedWords),
            index: challengeIndex++
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
        
        // Feature flags
        this.useAccordionLayout = options.useAccordionLayout !== false; // Default to true
        this.isHardMode = !!options.isHardMode;
        
        // Track LessonOptionsPanel instance for cleanup
        this.optionsPanel = null;
    }

    /**
     * Update hard mode preference (typing required when true)
     * @param {boolean} hard
     */
    setHardMode(hard) {
        this.isHardMode = !!hard;
    }

    /**
     * Update speaker gender
     * @param {string} gender - 'male' or 'female'
     */
    setSpeakerGender(gender) {
        this.speakerGender = gender;
    }
    
    /**
     * Cleanup resources
     */
    destroy() {
        if (this.optionsPanel) {
            this.optionsPanel.destroy();
            this.optionsPanel = null;
        }
    }

    /**
     * Render a challenge based on type
     * @param {HTMLElement} container - Container element
     * @param {Object} challenge - Challenge data
     * @param {Object} state - Lesson state
     */
    render(container, challenge, state) {
        // Cleanup previous optionsPanel if any
        if (this.optionsPanel) {
            this.optionsPanel.destroy();
            this.optionsPanel = null;
        }
        
        // Animate transition
        container.classList.add('challenge-exit');
        
        setTimeout(() => {
            container.innerHTML = '';
            container.classList.remove('challenge-exit');
            container.classList.add('challenge-enter');
            
            switch (challenge.type) {
                case CHALLENGE_TYPES.LEARN_WORD:
                    if (this.useAccordionLayout) {
                        this.renderLearnWordAccordion(container, challenge, state);
                    } else {
                        this.renderLearnWord(container, challenge, state);
                    }
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
                // Rich challenge types from building-blocks
                case CHALLENGE_TYPES.MULTIPLE_CHOICE:
                    this.renderMultipleChoice(container, challenge, state);
                    break;
                case CHALLENGE_TYPES.TRANSLATE:
                    this.renderTranslate(container, challenge, state);
                    break;
                case CHALLENGE_TYPES.FILL_BLANK:
                    this.renderFillBlank(container, challenge, state);
                    break;
                case CHALLENGE_TYPES.MATCH:
                    this.renderMatch(container, challenge, state);
                    break;
                case CHALLENGE_TYPES.SENTENCE_BUILDER:
                    this.renderSentenceBuilder(container, challenge, state);
                    break;
                case CHALLENGE_TYPES.CONJUGATION:
                    this.renderConjugation(container, challenge, state);
                    break;
                case CHALLENGE_TYPES.RESCUE_KEYWORD:
                case CHALLENGE_TYPES.RESCUE_MULTI_SENSORY:
                case CHALLENGE_TYPES.RESCUE_MEMORY_PALACE:
                case CHALLENGE_TYPES.RESCUE_ACTIVE_RECALL:
                case CHALLENGE_TYPES.RESCUE_SPACED_REPETITION:
                case CHALLENGE_TYPES.RESCUE_FEYNMAN:
                case CHALLENGE_TYPES.RESCUE_CONTEXT_FLOOD:
                    this.renderRescueChallenge(container, challenge, state);
                    break;
                default:
                    console.warn(`Unknown challenge type: ${challenge.type}`);
                    this._renderUnknownChallenge(container, challenge, state);
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
        const hoverHint = escapeHtml(this._getEnglishHoverHint(word, knowledge));
        
        let cardHTML = `
            <div class="challenge-card learn-card learn-card-rich">
                <div class="challenge-instruction">📚 Learn This Word</div>
                
                <div class="learn-word-header">
                    <div class="learn-portuguese-main">${escapeHtml(resolved)}</div>
                    ${hasKnowledge && knowledge.ipa ? `<div class="learn-ipa">${escapeHtml(knowledge.ipa)}</div>` : ''}
                    <div class="learn-english-main hover-gloss" data-gloss="${hoverHint}">${escapeHtml(word.en)}</div>
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
        
        // Create a container for the audio visualizer (reused across attempts)
        let visualizerContainer = container.querySelector('.pronunciation-visualizer-container');
        if (!visualizerContainer) {
            visualizerContainer = document.createElement('div');
            visualizerContainer.className = 'pronunciation-visualizer-container';
            const actionsDiv = container.querySelector('.learn-card-actions');
            if (actionsDiv) actionsDiv.after(visualizerContainer);
        }
        
        // Create AudioVisualizer instance
        const visualizer = new AudioVisualizer({
            onStateChange: (visualizerState) => {
                logger.debug('Visualizer state:', visualizerState);
            }
        });
        
        document.getElementById('practiceBtn').addEventListener('click', async () => {
            const btn = document.getElementById('practiceBtn');
            
            // Remove any existing feedback
            const existingFeedback = container.querySelector('.pronunciation-feedback');
            if (existingFeedback) existingFeedback.remove();
            
            // Check Web Speech availability first
            if (!isWebSpeechAvailable()) {
                this._showPronunciationFeedback(container, null, resolved, {
                    message: 'not supported',
                    code: 'not-supported'
                });
                return;
            }
            
            // Show visualizer
            visualizerContainer.innerHTML = '';
            visualizer.create(visualizerContainer);
            visualizer.setState(RECORDING_STATE.READY);
            
            btn.innerHTML = '<span class="recording-dot"></span> Recording...';
            btn.classList.add('recording');
            btn.disabled = true;
            
            let stream = null;
            const startTime = Date.now();
            
            try {
                // Get microphone access for visualization
                stream = await navigator.mediaDevices.getUserMedia({ 
                    audio: { 
                        echoCancellation: true, 
                        noiseSuppression: true,
                        autoGainControl: true
                    } 
                });
                
                // Start visualizer
                await visualizer.start(stream);
                
                // Get the WebSpeechService
                const speechService = getWebSpeechService();
                
                // Listen for speech
                const recognitionResult = await speechService.listen(5000, {
                    continuous: false,
                    interimResults: false
                });
                
                // Stop visualizer
                visualizer.stop();
                
                // Stop stream tracks
                if (stream) {
                    stream.getTracks().forEach(track => track.stop());
                }
                
                // Score the result using PhoneticScorer
                const transcribed = recognitionResult.text || '';
                const scoreResult = phoneticScore(transcribed, resolved, {
                    wordKnowledge: knowledge
                });
                
                // Merge recognition result data into score result
                scoreResult.transcribed = transcribed;
                scoreResult.alternatives = recognitionResult.alternatives || [];
                scoreResult.confidence = recognitionResult.confidence || 0;
                
                const responseTime = Date.now() - startTime;
                
                // Stream the pronunciation event to AI pipeline (MANDATORY per instructions)
                try {
                    eventStream.emit('learning_event', {
                        eventType: 'pronunciation_score',
                        wordId: getWordKey(word),
                        word: resolved,
                        timestamp: Date.now(),
                        score: scoreResult.score,
                        rating: scoreResult.rating,
                        transcribed,
                        expected: resolved,
                        responseTime,
                        phonemeIssues: scoreResult.phonemeIssues || [],
                        confidence: scoreResult.confidence
                    });
                } catch (streamErr) {
                    logger.warn('Failed to stream pronunciation event', streamErr);
                }
                
                if (scoreResult && scoreResult.score > 0) {
                    visualizer.setState(RECORDING_STATE.COMPLETE, { 
                        message: `Score: ${Math.round(scoreResult.score)}%` 
                    });
                    this._showPronunciationFeedback(container, scoreResult, resolved);
                } else {
                    visualizer.setState(RECORDING_STATE.ERROR, { message: 'No speech detected' });
                    this._showPronunciationFeedback(container, null, resolved);
                }
            } catch (err) {
                logger.error('Speech recognition error:', err);
                
                // Stop stream tracks on error
                if (stream) {
                    stream.getTracks().forEach(track => track.stop());
                }
                
                visualizer.stop();
                visualizer.setState(RECORDING_STATE.ERROR, { message: err.message?.substring(0, 30) });
                this._showPronunciationFeedback(container, null, resolved, err);
            }
            
            btn.innerHTML = '🎤 Try Again';
            btn.classList.remove('recording');
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
     * Render Learn Word challenge with accordion layout (Phase 4)
     * Split layout: Word card on left, expandable options panel on right
     * 
     * @param {HTMLElement} container - Container element
     * @param {Object} challenge - Challenge data
     * @param {Object} state - Lesson state
     */
    renderLearnWordAccordion(container, challenge, state) {
        const word = challenge.word;
        const resolved = resolveWordForm(word, this.speakerGender);
        const alt = getAlternateForm(word, this.speakerGender);
        
        const knowledge = this.getWordKnowledge(resolved);
        const hasKnowledge = knowledge !== null;
        const hoverHint = escapeHtml(this._getEnglishHoverHint(word, knowledge));
        const learnWordCount = state.challenges.filter(c => c.type === CHALLENGE_TYPES.LEARN_WORD).length;
        const lessonImage = resolveChallengeImage(challenge, state.lesson);
        const lessonProgressPct = Math.min(100, Math.round(((state.currentIndex + 1) / state.challenges.length) * 100));
        const completedLessonIds = new Set(getCompletedLessons().map(entry => entry.lessonId || entry.id));
        const completedLessons = completedLessonIds.size;
        const totalLessons = Math.max(1, getAllLessons().length);
        const overallPct = Math.min(100, Math.round((completedLessons / totalLessons) * 100));
        const learnedWordsCount = getLearnedWords().length;
        
        // Build the split layout HTML
        const layoutHTML = `
            <div class="lesson-split-layout">
                <!-- Left: Word Card Main Content -->
                <div class="lesson-main-content">
                    <div class="challenge-card learn-card learn-card-accordion">
                        <div class="challenge-instruction">📚 Learn This Word</div>
                        
                        <div class="learn-word-display">
                            <div class="learn-portuguese-main">${escapeHtml(resolved)}</div>
                            ${hasKnowledge && knowledge.ipa ? `<div class="learn-ipa">${escapeHtml(knowledge.ipa)}</div>` : ''}
                            <div class="learn-english-main hover-gloss" data-gloss="${hoverHint}">${escapeHtml(word.en)}</div>
                            ${alt ? `<div class="learn-alt-form">Also: ${escapeHtml(alt)}</div>` : ''}
                        </div>
                        
                        <div class="learn-card-actions">
                            <button class="btn-listen-main" id="listenBtn">🔊 Listen</button>
                            <button class="btn-save-word" id="saveWordBtn" data-pt="${escapeHtml(resolved)}" data-en="${escapeHtml(word.en)}">💾 Save</button>
                            <button class="btn-practice-say" id="practiceBtn">🎤 Practice</button>
                        </div>
                        
                        <div class="pronunciation-visualizer-container"></div>
                        
                        <div class="challenge-footer">
                            <div class="word-progress-indicator">Word ${challenge.index + 1} of ${learnWordCount}</div>
                            <button class="btn-continue" id="continueBtn">I've Got It! Continue →</button>
                        </div>
                    </div>
                </div>
                
                <!-- Right: Options Panel with Progress + Image -->
                <div class="lesson-side-panel">
                        <div class="lesson-context-card">
                        <div class="lesson-context-image" style="background-image: ${lessonImage}" aria-hidden="true"></div>
                        <div class="lesson-progress-stack">
                            <div class="progress-row">
                                <div class="progress-label">This lesson</div>
                                <div class="progress-bar compact">
                                    <div class="progress-fill" style="width:${lessonProgressPct}%"></div>
                                </div>
                                <div class="progress-value">${lessonProgressPct}%</div>
                                <div class="progress-sub">${state.currentIndex + 1} / ${state.challenges.length} steps</div>
                            </div>
                            <div class="progress-row">
                                <div class="progress-label">Overall</div>
                                <div class="progress-bar compact">
                                    <div class="progress-fill overall" style="width:${overallPct}%"></div>
                                </div>
                                <div class="progress-value">${overallPct}%</div>
                                <div class="progress-sub">Lessons: ${completedLessons} / ${totalLessons} · Words learned: ${learnedWordsCount}</div>
                            </div>
                        </div>
                    </div>
                    <div class="lesson-options-container" id="optionsPanelContainer"></div>
                </div>
            </div>
        `;
        
        container.innerHTML = layoutHTML;
        
        // Initialize the LessonOptionsPanel
        const panelContainer = container.querySelector('#optionsPanelContainer');
        this.optionsPanel = createLessonOptionsPanel(panelContainer, {
            singleOpen: true,
            persistLastOpen: true,
            onAudioPlay: (audioSrc) => {
                this.playWord(audioSrc);
            },
            onSectionChange: (sectionId, isOpen) => {
                // Track user interaction for AI
                try {
                    eventStream.emit('learning_event', {
                        eventType: 'section_toggle',
                        wordId: getWordKey(word),
                        sectionId,
                        isOpen,
                        timestamp: Date.now()
                    });
                } catch (e) {
                    logger.warn('Failed to stream section toggle event', e);
                }
            }
        });
        
        // Build word data for the panel
        const wordData = this._buildWordDataForPanel(word, knowledge, resolved);
        this.optionsPanel.setWordData(wordData);
        
        // Auto-play audio
        setTimeout(() => this.playWord(resolved), CHALLENGE_CONFIG.autoPlayDelay + 100);
        
        // Bind event listeners
        this._bindLearnWordAccordionEvents(container, word, knowledge, state, resolved);
    }
    
    /**
     * Build word data object for LessonOptionsPanel
     * 
     * Priority order for data:
     * 1. Lesson word object (word.pronunciation, word.grammarNotes, etc.)
     * 2. Word knowledge database (knowledge object)
     * 3. Auto-generated fallback
     * 
     * @private
     */
    _buildWordDataForPanel(word, knowledge, resolved) {
        const hasKnowledge = knowledge !== null;
        
        // Check if word has rich data from lesson file
        const hasWordData = word && (
            word.pronunciation || 
            word.grammarNotes || 
            word.examples || 
            word.culturalNote ||
            word.aiTip
        );
        
        // Build pronunciation data - prioritize word > knowledge > generated
        let pronunciation;
        if (hasKnowledge && knowledge.pronunciation) {
            // Word knowledge database has detailed pronunciation object
            pronunciation = {
                ipa: knowledge.ipa,
                guide: knowledge.pronunciation.guide,
                tip: knowledge.pronunciation.tip,
                breakdown: knowledge.pronunciation.breakdown,
                commonMistake: knowledge.pronunciation.commonMistake
            };
        } else if (word.pronunciation) {
            // Lesson word has simple pronunciation string
            pronunciation = {
                guide: word.pronunciation,
                tip: `Pronunciation: "${word.pronunciation}"`,
                breakdown: null,
                commonMistake: null
            };
        } else {
            // Generate fallback
            pronunciation = {
                guide: this.generatePronunciationTip(resolved),
                tip: `Challenge: ${this.getPronunciationChallengeType(resolved)}`,
                breakdown: null,
                commonMistake: null
            };
        }
        
        // Build examples array - prefer word data, then knowledge
        let examples = null;
        if (word.examples && word.examples.length > 0) {
            examples = word.examples;
        } else if (hasKnowledge && knowledge.examples) {
            examples = knowledge.examples;
        } else {
            examples = [{
                pt: `${resolved}…`,
                en: word.en ? `Try saying "${resolved}" when you mean "${word.en}".` : 'Use this in a short sentence to lock it in.',
                context: 'Starter example — this will personalize after your first attempts.'
            }];
        }
        
        // Build grammar - prefer word data
        const grammar = word.grammarNotes
            || (hasKnowledge ? knowledge.grammar : null)
            || { note: 'Keep the EU Portuguese sound; if this has gender, match the ending to the noun you pair it with.' };
        
        // Build cultural note - prefer word data
        const cultural = word.culturalNote
            || (hasKnowledge ? knowledge.cultural : null)
            || 'Common in Portugal — focus on European pronunciation and rhythm.';
        
        // Build memory hints
        const memory = hasKnowledge && (knowledge.etymology || knowledge.memoryTrick) ? {
            etymology: knowledge.etymology,
            trick: knowledge.memoryTrick
        } : {
            etymology: hasKnowledge ? knowledge?.etymology : null,
            trick: `Link "${resolved}" with "${word.en || 'its meaning'}" — picture a quick scene that forces you to say it aloud.`
        };
        
        // Build usage context
        const usage = hasKnowledge && knowledge.usage ? {
            formality: knowledge.usage.formality,
            context: knowledge.usage.context,
            alternatives: knowledge.usage.alternative ? [knowledge.usage.alternative] : null
        } : {
            formality: 'Neutral',
            context: `Use "${resolved}" to communicate "${word.en || 'this idea'}" in everyday speech. Try it in a greeting or quick reply.`,
            alternatives: null
        };
        
        // Build AI tips - static from word data as initial, dynamic loaded later
        let aiTips = null;
        if (word.aiTip) {
            aiTips = [{ tip: word.aiTip, type: 'static', priority: 'normal' }];
        } else {
            aiTips = [{
                tip: 'Complete one quick round with this word to unlock personalized AI tips. Start with Personal Pronouns if you want an easy win.',
                type: 'motivation',
                priority: 'low'
            }];
        }
        
        return {
            word: resolved,
            wordId: getWordKey(word),
            english: word.en,
            type: word.type || null,
            pronunciation,
            memory,
            examples,
            grammar,
            usage,
            cultural,
            aiTips
        };
    }

    /**
     * Build a lightweight English-only hover hint to keep learning playful without spoiling Portuguese answers
     * @private
     */
    _getEnglishHoverHint(word, knowledge) {
        if (knowledge?.memoryTrick) return `Memory hint: ${knowledge.memoryTrick}`;
        if (word.aiTip) return `AI tip: ${word.aiTip}`;
        if (knowledge?.etymology) return `Origin: ${knowledge.etymology}`;
        if (knowledge?.usage?.context) return `Usage: ${knowledge.usage.context}`;
        return 'Quick hint: say it aloud with the stress on the bold syllable';
    }
    
    /**
     * Bind event listeners for accordion learn word view
     * @private
     */
    _bindLearnWordAccordionEvents(container, word, knowledge, state, resolved) {
        // Listen button
        document.getElementById('listenBtn').addEventListener('click', () => {
            this.playWord(resolved);
        });
        
        // Save button
        document.getElementById('saveWordBtn').addEventListener('click', (e) => {
            const btn = e.target;
            this.saveToFlashcards(btn.dataset.pt, btn.dataset.en, state.lesson.title);
            btn.textContent = '✓ Saved!';
            btn.disabled = true;
        });
        
        // Get the visualizer container
        const visualizerContainer = container.querySelector('.pronunciation-visualizer-container');
        
        // Create AudioVisualizer instance
        const visualizer = new AudioVisualizer({
            onStateChange: (visualizerState) => {
                logger.debug('Visualizer state:', visualizerState);
            }
        });
        
        // Practice button - pronunciation practice
        document.getElementById('practiceBtn').addEventListener('click', async () => {
            const btn = document.getElementById('practiceBtn');
            
            // Remove any existing feedback
            const existingFeedback = container.querySelector('.pronunciation-feedback');
            if (existingFeedback) existingFeedback.remove();
            
            // Check Web Speech availability
            if (!isWebSpeechAvailable()) {
                this._showPronunciationFeedback(container, null, resolved, {
                    message: 'not supported',
                    code: 'not-supported'
                });
                return;
            }
            
            // Show visualizer
            visualizerContainer.innerHTML = '';
            visualizer.create(visualizerContainer);
            visualizer.setState(RECORDING_STATE.READY);
            
            btn.innerHTML = '<span class="recording-dot"></span> Recording...';
            btn.classList.add('recording');
            btn.disabled = true;
            
            let stream = null;
            const startTime = Date.now();
            
            try {
                // Get microphone access
                stream = await navigator.mediaDevices.getUserMedia({
                    audio: {
                        echoCancellation: true,
                        noiseSuppression: true,
                        autoGainControl: true
                    }
                });
                
                // Start visualizer
                await visualizer.start(stream);

                // Get the WebSpeechService
                const speechService = getWebSpeechService();
                
                // Listen for speech
                const recognitionResult = await speechService.listen(5000, {
                    continuous: false,
                    interimResults: false
                });
                
                // Stop visualizer
                visualizer.stop();
                
                // Stop stream tracks
                if (stream) {
                    stream.getTracks().forEach(track => track.stop());
                }
                
                // Score the result using PhoneticScorer
                const transcribed = recognitionResult.text || '';
                const scoreResult = phoneticScore(transcribed, resolved, {
                    wordKnowledge: knowledge
                });
                
                // Merge recognition result data
                scoreResult.transcribed = transcribed;
                scoreResult.alternatives = recognitionResult.alternatives || [];
                scoreResult.confidence = recognitionResult.confidence || 0;
                
                const responseTime = Date.now() - startTime;
                
                // Stream to AI pipeline (MANDATORY)
                try {
                    eventStream.emit('learning_event', {
                        eventType: 'pronunciation_score',
                        wordId: getWordKey(word),
                        word: resolved,
                        timestamp: Date.now(),
                        score: scoreResult.score,
                        rating: scoreResult.rating,
                        transcribed,
                        expected: resolved,
                        responseTime,
                        phonemeIssues: scoreResult.phonemeIssues || [],
                        confidence: scoreResult.confidence
                    });
                } catch (streamErr) {
                    logger.warn('Failed to stream pronunciation event', streamErr);
                }
                
                if (scoreResult && scoreResult.score > 0) {
                    visualizer.setState(RECORDING_STATE.COMPLETE, {
                        message: `Score: ${Math.round(scoreResult.score)}%`
                    });
                    this._showPronunciationFeedback(container, scoreResult, resolved);
                    
                    // Update AI tips based on score
                    if (this.optionsPanel && scoreResult.phonemeIssues?.length > 0) {
                        const tips = scoreResult.phonemeIssues.map(issue => ({
                            tip: `Focus on the "${issue.phoneme}" sound - ${issue.suggestion || 'practice slowly'}`
                        }));
                        this.optionsPanel.updateAITips(tips);
                    }
                } else {
                    visualizer.setState(RECORDING_STATE.ERROR, { message: 'No speech detected' });
                    this._showPronunciationFeedback(container, null, resolved);
                }
            } catch (err) {
                logger.error('Speech recognition error:', err);
                
                if (stream) {
                    stream.getTracks().forEach(track => track.stop());
                }
                
                visualizer.stop();
                visualizer.setState(RECORDING_STATE.ERROR, { message: err.message?.substring(0, 30) });
                this._showPronunciationFeedback(container, null, resolved, err);
            }
            
            btn.innerHTML = '🎤 Try Again';
            btn.classList.remove('recording');
            btn.disabled = false;
        });
        
        // Continue button
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
     * Render easy-mode selectable answers (no typing)
     * @param {HTMLElement} container
     * @param {Object} config
     * @param {Object} config.word
     * @param {string} config.instruction
     * @param {string} config.prompt
     * @param {Array} config.options
     * @param {string} config.answerKey
     * @param {Function} [config.autoPlay]
     * @param {Object} state
     * @private
     */
    _renderSelectableAnswer(container, config, state) {
        const { word, instruction, prompt, options = [], answerKey, autoPlay } = config;
        const resolvedOptions = options.length ? options : [{ key: answerKey, en: word.en, pt: word.pt }];
        const lessonTitle = state.lesson?.title || 'Lesson';

        container.innerHTML = `
            <div class="challenge-card type-card">
                <div class="challenge-instruction">${instruction}</div>
                <div class="type-prompt">${escapeHtml(prompt)}</div>
                <div class="mcq-options">
                    ${resolvedOptions.map(opt => `
                        <button class="mcq-option" data-key="${escapeHtml(opt.key)}">
                            <div class="mcq-option-pt">${escapeHtml(opt.pt || opt.en || '')}</div>
                            <div class="mcq-option-en">${escapeHtml(opt.en || '')}</div>
                        </button>
                    `).join('')}
                </div>
                <button class="btn-save-word btn-save-small" id="saveWordBtn" data-pt="${escapeHtml(word.pt)}" data-en="${escapeHtml(word.en)}">💾 Save</button>
                <div class="challenge-footer">
                    <button class="btn-continue hidden" id="continueBtn">Continue</button>
                </div>
            </div>
        `;

        if (typeof autoPlay === 'function') {
            autoPlay();
        }

        const saveBtn = container.querySelector('#saveWordBtn');
        if (saveBtn) {
            saveBtn.addEventListener('click', (e) => {
                const btn = e.target;
                this.saveToFlashcards(btn.dataset.pt, btn.dataset.en, lessonTitle);
                btn.textContent = '✓ Saved!';
                btn.disabled = true;
            });
        }

        const buttons = Array.from(container.querySelectorAll('.mcq-option'));
        const continueBtn = container.querySelector('#continueBtn');

        buttons.forEach(btn => {
            btn.addEventListener('click', () => {
                buttons.forEach(b => b.disabled = true);
                const isCorrect = btn.dataset.key === answerKey;
                if (isCorrect) {
                    btn.classList.add('correct');
                    this._showFeedback(true, word.pt || word.en);
                    state.correct++;
                    this.onCorrect(word, state);
                } else {
                    btn.classList.add('incorrect');
                    buttons.forEach(b => { if (b.dataset.key === answerKey) b.classList.add('correct'); });
                    this._showFeedback(false, word.pt || word.en);
                    state.mistakes++;
                    state.wrongAnswers.push({ word: word.pt, english: word.en, type: 'select' });
                    this._handleMistake(state);
                }

                if (continueBtn) {
                    continueBtn.classList.remove('hidden');
                    continueBtn.addEventListener('click', () => this.onChallengeComplete(state), { once: true });
                }
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

        // Easy mode: offer selectable answers instead of typing
        if (!this.isHardMode) {
            const options = (challenge.options && challenge.options.length)
                ? challenge.options
                : buildQuizOptions(word, state.lesson?.words || [], getLearnedWords());

            this._renderSelectableAnswer(container, {
                instruction: 'Choose the Portuguese word',
                prompt: word.en,
                word,
                answerKey: getWordKey(word),
                options,
                autoPlay: () => setTimeout(() => this.playWord(answer), CHALLENGE_CONFIG.autoPlayDelay)
            }, state);
            return;
        }
        
        container.innerHTML = `
            <div class="challenge-card type-card">
                <div class="challenge-instruction">Hard mode: type this in Portuguese</div>
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

        // Easy mode: selectable answers after listening
        if (!this.isHardMode) {
            const options = (challenge.options && challenge.options.length)
                ? challenge.options
                : buildQuizOptions(word, state.lesson?.words || [], getLearnedWords());

            this._renderSelectableAnswer(container, {
                instruction: 'Select what you heard',
                prompt: '🔊 Listen and pick the right Portuguese word',
                word,
                answerKey: getWordKey(word),
                options,
                autoPlay: () => setTimeout(() => this.playWord(answer), CHALLENGE_CONFIG.autoPlayDelay)
            }, state);
            return;
        }
        
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
     * Render Rescue challenge (creative learning styles for stuck words)
     * @param {HTMLElement} container
     * @param {Object} challenge
     * @param {Object} state
     */
    renderRescueChallenge(container, challenge, state) {
        const word = challenge.word || {};
        const resolved = resolveWordForm(word, this.speakerGender);
        const steps = Array.isArray(challenge.steps) && challenge.steps.length
            ? challenge.steps
            : ['Say the word aloud twice.', 'Write it once.', 'Use it in a new sentence.'];

        const styleTitle = challenge.title || 'Rescue Drill';
        const styleIcon = challenge.icon || '💡';
        const desc = challenge.description || 'Break the plateau using a focused micro-exercise.';
        const progressLabel = `Challenge ${state.currentIndex + 1} of ${state.challenges.length}`;

        container.innerHTML = `
            <div class="challenge-card rescue-card">
                <div class="rescue-head">
                    <div class="rescue-pill">${styleIcon} ${escapeHtml(styleTitle)}</div>
                    <div class="rescue-word">${escapeHtml(resolved || word.pt || '')}</div>
                    <div class="rescue-meaning">${escapeHtml(word.en || '')}</div>
                    ${word.isStuckWord ? '<span class="rescue-stuck">Stuck word focus</span>' : ''}
                </div>
                <div class="rescue-desc">${escapeHtml(desc)}</div>
                <ol class="rescue-steps">
                    ${steps.map(step => `<li>${escapeHtml(step)}</li>`).join('')}
                </ol>
                <div class="rescue-actions">
                    <button class="btn-listen-main" id="listenBtn">🔊 Play</button>
                    <button class="btn-continue" id="continueBtn">Mark Done →</button>
                </div>
                <div class="challenge-footer subtle">${escapeHtml(progressLabel)}</div>
            </div>
        `;

        const listenBtn = container.querySelector('#listenBtn');
        if (listenBtn) {
            listenBtn.addEventListener('click', () => this.playWord(resolved));
        }
        container.querySelector('#continueBtn').addEventListener('click', () => {
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
            
            const startTime = Date.now();
            
            try {
                // Check Web Speech availability
                if (!isWebSpeechAvailable()) {
                    throw new Error('Speech recognition not supported in this browser');
                }
                
                // Get WebSpeechService and listen
                const speechService = getWebSpeechService();
                const recognitionResult = await speechService.listen(5000, {
                    continuous: false,
                    interimResults: false
                });
                
                // Score with PhoneticScorer
                const transcribed = recognitionResult.text || '';
                const score = phoneticScore(transcribed, resolved, {
                    wordKnowledge: knowledge
                });
                
                // Merge recognition data into score
                score.transcribed = transcribed;
                score.alternatives = recognitionResult.alternatives || [];
                score.confidence = recognitionResult.confidence || 0;
                
                const responseTime = Date.now() - startTime;
                
                // Stream to AI pipeline (MANDATORY)
                try {
                    eventStream.emit('learning_event', {
                        eventType: 'pronunciation_score',
                        wordId: getWordKey(word),
                        word: resolved,
                        timestamp: Date.now(),
                        score: score.score,
                        rating: score.rating,
                        transcribed,
                        expected: resolved,
                        responseTime,
                        attemptNumber: currentAttempt,
                        phonemeIssues: score.phonemeIssues || [],
                        confidence: score.confidence
                    });
                } catch (streamErr) {
                    logger.warn('Failed to stream pronunciation event', streamErr);
                }
                
                // Record to ProgressTracker for long-term tracking (SPEECH-053)
                try {
                    recordPronunciationAttempt(getWordKey(word), {
                        score: score.score,
                        rating: score.rating,
                        phonemeIssues: score.phonemeIssues || [],
                        transcription: transcribed,
                        expected: resolved
                    });
                } catch (trackErr) {
                    logger.warn('Failed to record pronunciation progress', trackErr);
                }
                
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
                logger.error('Pronunciation test error:', err);
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
     * Display pronunciation result with enhanced phoneme feedback
     * @private
     */
    _displayPronunciationResult(score, expected, attempt, maxAttempts, hasPassed, passThreshold, state, word, bestScore) {
        const scoreDisplay = document.getElementById('resultScore');
        const comparison = document.getElementById('resultComparison');
        const feedback = document.getElementById('resultFeedback');
        const actionArea = document.getElementById('actionArea');
        const recordBtn = document.getElementById('recordBtn');
        
        const scorePercent = Math.round(score.score);
        const scoreClass = scorePercent >= PHONETIC_CONFIG.excellentScore ? 'excellent' : 
                          scorePercent >= PHONETIC_CONFIG.goodScore ? 'good' : 
                          scorePercent >= PHONETIC_CONFIG.fairScore ? 'fair' : 
                          scorePercent >= PHONETIC_CONFIG.needsWorkScore ? 'needs-work' : 'poor';
        
        // Use emoji from PhoneticScorer if available, otherwise fallback
        const emoji = score.emoji || 
                     (scorePercent >= 90 ? '🎉' : scorePercent >= 75 ? '👍' : 
                      scorePercent >= 60 ? '💪' : scorePercent >= 40 ? '🔄' : '😅');
        
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
        let comparisonHTML = `
            <div class="comparison-row">
                <span class="comparison-label">Expected:</span>
                <span class="comparison-value expected">${escapeHtml(expected)}</span>
            </div>
            <div class="comparison-row">
                <span class="comparison-label">We heard:</span>
                <span class="comparison-value heard">${escapeHtml(heard)}</span>
            </div>
        `;
        
        // Add word match details if available
        if (score.wordMatch) {
            const wm = score.wordMatch;
            if (wm.closeMatches && wm.closeMatches.length > 0) {
                comparisonHTML += `
                    <div class="comparison-details">
                        <span class="details-label">Close matches:</span>
                        ${wm.closeMatches.map(m => `
                            <span class="close-match">"${escapeHtml(m.heard)}" → "${escapeHtml(m.expected)}"</span>
                        `).join(', ')}
                    </div>
                `;
            }
            if (wm.missed && wm.missed.length > 0) {
                comparisonHTML += `
                    <div class="comparison-details missed">
                        <span class="details-label">Missed:</span>
                        ${wm.missed.map(w => `<span class="missed-word">${escapeHtml(w)}</span>`).join(', ')}
                    </div>
                `;
            }
        }
        comparison.innerHTML = comparisonHTML;
        
        // Enhanced feedback with phoneme issues and tips
        let feedbackHTML = `
            <div class="feedback-message ${hasPassed ? 'passed' : ''}">${escapeHtml(score.feedback || '')}</div>
        `;
        
        // Add phoneme-level tips if available
        if (score.phonemeIssues && score.phonemeIssues.length > 0) {
            feedbackHTML += `
                <div class="phoneme-tips">
                    <div class="tips-header">🎯 Sound-specific tips:</div>
                    <ul class="tips-list">
                        ${score.phonemeIssues.slice(0, 3).map(issue => `
                            <li class="tip-item">
                                <span class="phoneme-pattern">${escapeHtml(issue.pattern)}</span>
                                <span class="phoneme-tip">${escapeHtml(issue.tip)}</span>
                            </li>
                        `).join('')}
                    </ul>
                </div>
            `;
        } else if (score.tips && score.tips.length > 0) {
            // Fallback to general tips
            feedbackHTML += `
                <div class="general-tips">
                    <div class="tips-header">💡 Tips:</div>
                    <ul class="tips-list">
                        ${score.tips.slice(0, 2).map(tip => `
                            <li class="tip-item">${escapeHtml(tip)}</li>
                        `).join('')}
                    </ul>
                </div>
            `;
        }
        
        // Show progressive feedback based on attempt number
        if (!hasPassed && attempt < maxAttempts) {
            const progressiveHints = [
                'Listen carefully to the pronunciation, then try again.',
                'Focus on the difficult sounds. Take your time.',
                'Almost there! Pay attention to the nasal sounds.'
            ];
            feedbackHTML += `
                <div class="progressive-hint">
                    ${progressiveHints[Math.min(attempt - 1, progressiveHints.length - 1)]}
                </div>
            `;
        }
        
        feedback.innerHTML = feedbackHTML;
        
        actionArea.classList.remove('hidden');
        
        const retryBtn = document.getElementById('retryBtn');
        const continueBtn = document.getElementById('continueBtn');
        const wordKey = getWordKey(word);
        const hasAttemptsLeft = attempt < maxAttempts;

        // Track per-attempt scoring so we can adjust difficulty without blocking progress
        state.pronunciationLog = state.pronunciationLog || [];
        state.pronunciationLog.push({ word: wordKey, score: scorePercent, passed: hasPassed, attempt });
        
        // Mark weak words immediately if the user has not passed yet (no hard stop)
        if (!hasPassed) {
            state.weakWords = state.weakWords || [];
            if (!state.weakWords.find(w => getWordKey(w) === wordKey)) {
                state.weakWords.push(word);
            }
        }

        // Always let the learner continue; retry stays available while attempts remain
        continueBtn.classList.remove('hidden');
        continueBtn.textContent = hasPassed
            ? 'Continue →'
            : (hasAttemptsLeft ? 'Continue (we will keep tracking) →' : 'Continue (need more practice) →');

        if (hasPassed) {
            retryBtn.classList.add('hidden');
            document.getElementById('pronunciationCard').classList.add('challenge-passed');
        } else {
            document.getElementById('pronunciationCard').classList.add('challenge-failed');
            retryBtn.classList.toggle('hidden', !hasAttemptsLeft);
            if (hasAttemptsLeft) {
                recordBtn.classList.remove('hidden');
            }
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

    // ============================================================================
    // RICH CHALLENGE TYPE RENDERERS (Building Blocks)
    // ============================================================================

    /**
     * Render Multiple Choice challenge (rich format from building-blocks)
     * Different from MCQ - uses question/options/correct structure
     * 
     * @param {HTMLElement} container - Container element
     * @param {Object} challenge - Challenge data: { type, question, options, correct, explanation }
     * @param {Object} state - Lesson state
     */
    renderMultipleChoice(container, challenge, state) {
        const { question, options, correct, explanation } = challenge;
        
        container.innerHTML = `
            <div class="challenge-card multiple-choice-card">
                <div class="challenge-instruction">📝 Multiple Choice</div>
                <div class="mc-question">${escapeHtml(question)}</div>
                <div class="mc-options" id="mcOptions">
                    ${options.map((opt, i) => `
                        <button class="mc-option" data-index="${i}">
                            <span class="option-letter">${String.fromCharCode(65 + i)}</span>
                            <span class="option-text">${escapeHtml(opt)}</span>
                        </button>
                    `).join('')}
                </div>
                <div class="challenge-feedback" id="feedback"></div>
                <div class="challenge-explanation hidden" id="explanation">
                    ${explanation ? `<div class="explanation-text">💡 ${escapeHtml(explanation)}</div>` : ''}
                </div>
                <div class="challenge-footer hidden" id="footerActions">
                    <button class="btn-continue" id="continueBtn">Continue →</button>
                </div>
            </div>
        `;
        
        const optionsContainer = document.getElementById('mcOptions');
        const buttons = optionsContainer.querySelectorAll('.mc-option');
        
        buttons.forEach(btn => {
            btn.addEventListener('click', () => {
                const selectedIdx = parseInt(btn.dataset.index, 10);
                const isCorrect = selectedIdx === correct;
                
                // Disable all buttons
                buttons.forEach(b => b.disabled = true);
                
                // Mark selected and correct
                btn.classList.add(isCorrect ? 'correct' : 'incorrect');
                if (!isCorrect) {
                    buttons[correct].classList.add('correct');
                }
                
                // Show feedback
                this._showFeedback(isCorrect, options[correct]);
                
                // Show explanation
                if (explanation) {
                    document.getElementById('explanation').classList.remove('hidden');
                }
                
                // Update state
                if (isCorrect) {
                    state.correct++;
                    this.onCorrect(challenge, state);
                    
                    // Stream event
                    try {
                        eventStream.emit('learning_event', {
                            eventType: 'answer_correct',
                            challengeType: 'multiple-choice',
                            question: question.substring(0, 50),
                            timestamp: Date.now()
                        });
                    } catch (e) { /* ignore */ }
                } else {
                    state.mistakes++;
                    state.wrongAnswers.push({ 
                        question, 
                        selected: options[selectedIdx],
                        correct: options[correct],
                        type: 'multiple-choice' 
                    });
                    this._handleMistake(state);
                    
                    // Stream event
                    try {
                        eventStream.emit('learning_event', {
                            eventType: 'answer_incorrect',
                            challengeType: 'multiple-choice',
                            question: question.substring(0, 50),
                            userAnswer: options[selectedIdx],
                            correctAnswer: options[correct],
                            timestamp: Date.now()
                        });
                    } catch (e) { /* ignore */ }
                }
                
                // Show continue button
                document.getElementById('footerActions').classList.remove('hidden');
                document.getElementById('continueBtn').addEventListener('click', () => {
                    this.onChallengeComplete(state);
                });
            });
        });
    }

    /**
     * Render Translate challenge
     * User types translation from English to Portuguese (or vice versa)
     * 
     * @param {HTMLElement} container - Container element
     * @param {Object} challenge - Challenge data: { type, prompt, answer, hints, direction }
     * @param {Object} state - Lesson state
     */
    renderTranslate(container, challenge, state) {
        const { prompt, answer, hints = [], direction = 'en-to-pt' } = challenge;
        const directionLabel = direction === 'en-to-pt' 
            ? 'Translate to Portuguese' 
            : 'Translate to English';
        
        container.innerHTML = `
            <div class="challenge-card translate-card">
                <div class="challenge-instruction">✍️ ${directionLabel}</div>
                <div class="translate-prompt">"${escapeHtml(prompt)}"</div>
                ${hints.length > 0 ? `
                    <details class="translate-hints">
                        <summary>💡 Show hints</summary>
                        <ul class="hints-list">
                            ${hints.map(hint => `<li>${escapeHtml(hint)}</li>`).join('')}
                        </ul>
                    </details>
                ` : ''}
                <input type="text" class="translate-input" id="translateInput" 
                       placeholder="Type your translation..." 
                       autocomplete="off" autocapitalize="off">
                <div class="challenge-feedback" id="feedback"></div>
                <div class="challenge-footer">
                    <button class="btn-skip" id="skipBtn">Skip</button>
                    <button class="btn-check" id="checkBtn">Check Answer</button>
                </div>
            </div>
        `;
        
        const input = document.getElementById('translateInput');
        const checkBtn = document.getElementById('checkBtn');
        const skipBtn = document.getElementById('skipBtn');
        
        // Focus input
        setTimeout(() => input.focus(), 100);
        
        // Check answer
        const checkAnswer = () => {
            const userAnswer = input.value.trim();
            if (!userAnswer) return;
            
            // Normalize both for comparison
            const normalizedUser = normalizeText(userAnswer);
            const normalizedCorrect = normalizeText(answer);
            
            // Allow for some flexibility - also check if it starts/ends correctly
            const isExactMatch = normalizedUser === normalizedCorrect;
            const isCloseMatch = normalizedCorrect.includes(normalizedUser) || 
                                 normalizedUser.includes(normalizedCorrect);
            const isCorrect = isExactMatch || (isCloseMatch && normalizedUser.length > normalizedCorrect.length * 0.7);
            
            input.disabled = true;
            checkBtn.disabled = true;
            skipBtn.disabled = true;
            
            if (isCorrect) {
                input.classList.add('correct');
                this._showFeedback(true);
                state.correct++;
                this.onCorrect(challenge, state);
                
                try {
                    eventStream.emit('learning_event', {
                        eventType: 'answer_correct',
                        challengeType: 'translate',
                        prompt: prompt.substring(0, 50),
                        timestamp: Date.now()
                    });
                } catch (e) { /* ignore */ }
            } else {
                input.classList.add('incorrect');
                this._showFeedback(false, answer);
                state.mistakes++;
                state.wrongAnswers.push({
                    prompt,
                    userAnswer,
                    correct: answer,
                    type: 'translate'
                });
                this._handleMistake(state);
                
                try {
                    eventStream.emit('learning_event', {
                        eventType: 'answer_incorrect',
                        challengeType: 'translate',
                        prompt: prompt.substring(0, 50),
                        userAnswer,
                        correctAnswer: answer,
                        timestamp: Date.now()
                    });
                } catch (e) { /* ignore */ }
            }
            
            // Replace buttons with continue
            const footer = container.querySelector('.challenge-footer');
            footer.innerHTML = '<button class="btn-continue" id="continueBtn">Continue →</button>';
            document.getElementById('continueBtn').addEventListener('click', () => {
                this.onChallengeComplete(state);
            });
        };
        
        checkBtn.addEventListener('click', checkAnswer);
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') checkAnswer();
        });
        
        skipBtn.addEventListener('click', () => {
            this._showFeedback(false, answer);
            state.skipped = (state.skipped || 0) + 1;
            
            const footer = container.querySelector('.challenge-footer');
            footer.innerHTML = '<button class="btn-continue" id="continueBtn">Continue →</button>';
            document.getElementById('continueBtn').addEventListener('click', () => {
                this.onChallengeComplete(state);
            });
        });
    }

    /**
     * Render Fill-in-the-Blank challenge
     * User selects the correct option to fill the blank in a sentence
     * 
     * @param {HTMLElement} container - Container element
     * @param {Object} challenge - Challenge data: { type, sentence, options, correct, context, explanation }
     * @param {Object} state - Lesson state
     */
    renderFillBlank(container, challenge, state) {
        const { sentence, options, correct, context, explanation } = challenge;
        
        // Replace ___ with styled blank
        const displaySentence = sentence.replace(/_{2,}/g, '<span class="fill-blank">______</span>');
        
        container.innerHTML = `
            <div class="challenge-card fill-blank-card">
                <div class="challenge-instruction">🔤 Fill in the Blank</div>
                ${context ? `<div class="fill-context">${escapeHtml(context)}</div>` : ''}
                <div class="fill-sentence">${displaySentence}</div>
                <div class="fill-options" id="fillOptions">
                    ${options.map((opt, i) => `
                        <button class="fill-option" data-index="${i}">${escapeHtml(opt)}</button>
                    `).join('')}
                </div>
                <div class="challenge-feedback" id="feedback"></div>
                <div class="challenge-explanation hidden" id="explanation">
                    ${explanation ? `<div class="explanation-text">💡 ${escapeHtml(explanation)}</div>` : ''}
                </div>
                <div class="challenge-footer hidden" id="footerActions">
                    <button class="btn-continue" id="continueBtn">Continue →</button>
                </div>
            </div>
        `;
        
        const optionsContainer = document.getElementById('fillOptions');
        const buttons = optionsContainer.querySelectorAll('.fill-option');
        const blankSpan = container.querySelector('.fill-blank');
        
        buttons.forEach(btn => {
            btn.addEventListener('click', () => {
                const selectedIdx = parseInt(btn.dataset.index, 10);
                const isCorrect = selectedIdx === correct;
                
                // Disable all buttons
                buttons.forEach(b => b.disabled = true);
                
                // Mark selected and correct
                btn.classList.add(isCorrect ? 'correct' : 'incorrect');
                if (!isCorrect) {
                    buttons[correct].classList.add('correct');
                }
                
                // Fill in the blank with the selected answer
                if (blankSpan) {
                    blankSpan.textContent = options[selectedIdx];
                    blankSpan.classList.add(isCorrect ? 'filled-correct' : 'filled-incorrect');
                }
                
                // Show feedback
                this._showFeedback(isCorrect, options[correct]);
                
                // Show explanation
                if (explanation) {
                    document.getElementById('explanation').classList.remove('hidden');
                }
                
                // Update state
                if (isCorrect) {
                    state.correct++;
                    this.onCorrect(challenge, state);
                    
                    try {
                        eventStream.emit('learning_event', {
                            eventType: 'answer_correct',
                            challengeType: 'fill-blank',
                            sentence: sentence.substring(0, 50),
                            timestamp: Date.now()
                        });
                    } catch (e) { /* ignore */ }
                } else {
                    state.mistakes++;
                    state.wrongAnswers.push({
                        sentence,
                        selected: options[selectedIdx],
                        correct: options[correct],
                        type: 'fill-blank'
                    });
                    this._handleMistake(state);
                    
                    try {
                        eventStream.emit('learning_event', {
                            eventType: 'answer_incorrect',
                            challengeType: 'fill-blank',
                            sentence: sentence.substring(0, 50),
                            userAnswer: options[selectedIdx],
                            correctAnswer: options[correct],
                            timestamp: Date.now()
                        });
                    } catch (e) { /* ignore */ }
                }
                
                // Show continue button
                document.getElementById('footerActions').classList.remove('hidden');
                document.getElementById('continueBtn').addEventListener('click', () => {
                    this.onChallengeComplete(state);
                });
            });
        });
    }

    /**
     * Render Match challenge - pair matching exercise
     * 
     * @param {HTMLElement} container - Container element
     * @param {Object} challenge - Challenge data: { type, prompt, pairs, shuffled }
     * @param {Object} state - Lesson state
     */
    renderMatch(container, challenge, state) {
        const { prompt, pairs, shuffled = true } = challenge;
        
        // Create separate arrays for left and right items
        const leftItems = pairs.map((p, i) => ({ text: p.left, pairIndex: i }));
        const rightItems = pairs.map((p, i) => ({ text: p.right, pairIndex: i }));
        
        // Shuffle if enabled
        if (shuffled) {
            shuffleArray(leftItems);
            shuffleArray(rightItems);
        }
        
        container.innerHTML = `
            <div class="challenge-card match-card">
                <div class="challenge-instruction">🔗 Match the Pairs</div>
                ${prompt ? `<div class="match-prompt">${escapeHtml(prompt)}</div>` : ''}
                <div class="match-container">
                    <div class="match-column match-left" id="matchLeft">
                        ${leftItems.map((item, i) => `
                            <button class="match-item" data-side="left" data-pair="${item.pairIndex}" data-idx="${i}">
                                ${escapeHtml(item.text)}
                            </button>
                        `).join('')}
                    </div>
                    <div class="match-column match-right" id="matchRight">
                        ${rightItems.map((item, i) => `
                            <button class="match-item" data-side="right" data-pair="${item.pairIndex}" data-idx="${i}">
                                ${escapeHtml(item.text)}
                            </button>
                        `).join('')}
                    </div>
                </div>
                <div class="match-progress">
                    <span id="matchedCount">0</span> / ${pairs.length} matched
                </div>
                <div class="challenge-feedback" id="feedback"></div>
                <div class="challenge-footer hidden" id="footerActions">
                    <button class="btn-continue" id="continueBtn">Continue →</button>
                </div>
            </div>
        `;
        
        let selectedLeft = null;
        let selectedRight = null;
        let matchedPairs = new Set();
        let mistakes = 0;
        
        const leftButtons = container.querySelectorAll('.match-left .match-item');
        const rightButtons = container.querySelectorAll('.match-right .match-item');
        const allButtons = container.querySelectorAll('.match-item');
        
        const checkMatch = () => {
            if (selectedLeft === null || selectedRight === null) return;
            
            const leftBtn = container.querySelector(`.match-left .match-item[data-idx="${selectedLeft}"]`);
            const rightBtn = container.querySelector(`.match-right .match-item[data-idx="${selectedRight}"]`);
            
            const leftPair = parseInt(leftBtn.dataset.pair, 10);
            const rightPair = parseInt(rightBtn.dataset.pair, 10);
            
            if (leftPair === rightPair) {
                // Correct match
                leftBtn.classList.add('matched');
                rightBtn.classList.add('matched');
                leftBtn.disabled = true;
                rightBtn.disabled = true;
                matchedPairs.add(leftPair);
                
                document.getElementById('matchedCount').textContent = matchedPairs.size;
                
                // Check if all matched
                if (matchedPairs.size === pairs.length) {
                    const isFullyCorrect = mistakes === 0;
                    
                    setTimeout(() => {
                        this._showFeedback(true);
                        document.getElementById('footerActions').classList.remove('hidden');
                        
                        if (isFullyCorrect) {
                            state.correct++;
                            this.onCorrect(challenge, state);
                        }
                        
                        try {
                            eventStream.emit('learning_event', {
                                eventType: 'answer_correct',
                                challengeType: 'match',
                                pairsCount: pairs.length,
                                mistakes,
                                timestamp: Date.now()
                            });
                        } catch (e) { /* ignore */ }
                        
                        document.getElementById('continueBtn').addEventListener('click', () => {
                            this.onChallengeComplete(state);
                        });
                    }, 300);
                }
            } else {
                // Wrong match
                leftBtn.classList.add('wrong-match');
                rightBtn.classList.add('wrong-match');
                mistakes++;
                
                setTimeout(() => {
                    leftBtn.classList.remove('wrong-match', 'selected');
                    rightBtn.classList.remove('wrong-match', 'selected');
                }, 500);
                
                try {
                    eventStream.emit('learning_event', {
                        eventType: 'answer_incorrect',
                        challengeType: 'match',
                        leftText: leftBtn.textContent.trim(),
                        rightText: rightBtn.textContent.trim(),
                        timestamp: Date.now()
                    });
                } catch (e) { /* ignore */ }
            }
            
            // Reset selection
            selectedLeft = null;
            selectedRight = null;
            allButtons.forEach(b => b.classList.remove('selected'));
        };
        
        leftButtons.forEach((btn, idx) => {
            btn.addEventListener('click', () => {
                if (btn.disabled) return;
                leftButtons.forEach(b => b.classList.remove('selected'));
                btn.classList.add('selected');
                selectedLeft = idx;
                checkMatch();
            });
        });
        
        rightButtons.forEach((btn, idx) => {
            btn.addEventListener('click', () => {
                if (btn.disabled) return;
                rightButtons.forEach(b => b.classList.remove('selected'));
                btn.classList.add('selected');
                selectedRight = idx;
                checkMatch();
            });
        });
    }

    /**
     * Render Sentence Builder challenge - word ordering exercise
     * 
     * @param {HTMLElement} container - Container element
     * @param {Object} challenge - Challenge data: { type, prompt, targetSentence, words, distractors, explanation }
     * @param {Object} state - Lesson state
     */
    renderSentenceBuilder(container, challenge, state) {
        const { prompt, targetSentence, words, distractors = [], explanation } = challenge;
        
        // Combine words and distractors, shuffle
        const allWords = [...words.map(w => ({ text: w, isDistractor: false }))];
        if (distractors.length > 0) {
            distractors.forEach(d => allWords.push({ text: d, isDistractor: true }));
        }
        shuffleArray(allWords);
        
        container.innerHTML = `
            <div class="challenge-card sentence-builder-card">
                <div class="challenge-instruction">🧩 Build the Sentence</div>
                ${prompt ? `<div class="builder-prompt">"${escapeHtml(prompt)}"</div>` : ''}
                <div class="builder-answer" id="builderAnswer">
                    <span class="builder-placeholder">Tap words below to build the sentence</span>
                </div>
                <div class="builder-words" id="builderWords">
                    ${allWords.map((w, i) => `
                        <button class="builder-word ${w.isDistractor ? 'distractor' : ''}" data-idx="${i}" data-text="${escapeHtml(w.text)}">
                            ${escapeHtml(w.text)}
                        </button>
                    `).join('')}
                </div>
                <div class="builder-actions">
                    <button class="btn-clear" id="clearBtn">Clear</button>
                    <button class="btn-check" id="checkBtn">Check Answer</button>
                </div>
                <div class="challenge-feedback" id="feedback"></div>
                <div class="challenge-explanation hidden" id="explanation">
                    ${explanation ? `<div class="explanation-text">💡 ${escapeHtml(explanation)}</div>` : ''}
                </div>
                <div class="challenge-footer hidden" id="footerActions">
                    <button class="btn-continue" id="continueBtn">Continue →</button>
                </div>
            </div>
        `;
        
        const answerArea = document.getElementById('builderAnswer');
        const wordsArea = document.getElementById('builderWords');
        const wordButtons = wordsArea.querySelectorAll('.builder-word');
        const clearBtn = document.getElementById('clearBtn');
        const checkBtn = document.getElementById('checkBtn');
        
        let selectedWords = [];
        
        const updateAnswerDisplay = () => {
            if (selectedWords.length === 0) {
                answerArea.innerHTML = '<span class="builder-placeholder">Tap words below to build the sentence</span>';
            } else {
                answerArea.innerHTML = selectedWords.map((w, i) => `
                    <span class="answer-word" data-pos="${i}">${escapeHtml(w)}</span>
                `).join('');
                
                // Allow removing words by clicking
                answerArea.querySelectorAll('.answer-word').forEach(span => {
                    span.addEventListener('click', () => {
                        const pos = parseInt(span.dataset.pos, 10);
                        const removedWord = selectedWords[pos];
                        selectedWords.splice(pos, 1);
                        
                        // Re-enable the word button
                        const wordBtn = wordsArea.querySelector(`.builder-word[data-text="${CSS.escape(removedWord)}"]`);
                        if (wordBtn) wordBtn.disabled = false;
                        
                        updateAnswerDisplay();
                    });
                });
            }
        };
        
        wordButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                if (btn.disabled) return;
                
                selectedWords.push(btn.dataset.text);
                btn.disabled = true;
                updateAnswerDisplay();
            });
        });
        
        clearBtn.addEventListener('click', () => {
            selectedWords = [];
            wordButtons.forEach(btn => btn.disabled = false);
            updateAnswerDisplay();
            document.getElementById('feedback').innerHTML = '';
            document.getElementById('explanation').classList.add('hidden');
        });
        
        checkBtn.addEventListener('click', () => {
            const userAnswer = selectedWords.join(' ');
            const normalizedUser = normalizeText(userAnswer);
            const normalizedTarget = normalizeText(targetSentence);
            
            const isCorrect = normalizedUser === normalizedTarget;
            
            // Disable all interactions
            wordButtons.forEach(btn => btn.disabled = true);
            checkBtn.disabled = true;
            
            this._showFeedback(isCorrect, targetSentence);
            
            if (explanation) {
                document.getElementById('explanation').classList.remove('hidden');
            }
            
            if (isCorrect) {
                state.correct++;
                answerArea.classList.add('correct-answer');
                this.onCorrect(challenge, state);
                
                try {
                    eventStream.emit('learning_event', {
                        eventType: 'answer_correct',
                        challengeType: 'sentence-builder',
                        targetSentence: targetSentence.substring(0, 50),
                        timestamp: Date.now()
                    });
                } catch (e) { /* ignore */ }
            } else {
                state.mistakes++;
                answerArea.classList.add('incorrect-answer');
                state.wrongAnswers.push({
                    targetSentence,
                    userAnswer,
                    type: 'sentence-builder'
                });
                this._handleMistake(state);
                
                try {
                    eventStream.emit('learning_event', {
                        eventType: 'answer_incorrect',
                        challengeType: 'sentence-builder',
                        targetSentence: targetSentence.substring(0, 50),
                        userAnswer: userAnswer.substring(0, 50),
                        timestamp: Date.now()
                    });
                } catch (e) { /* ignore */ }
            }
            
            document.getElementById('footerActions').classList.remove('hidden');
            document.getElementById('continueBtn').addEventListener('click', () => {
                this.onChallengeComplete(state);
            });
        });
    }

    /**
     * Render Conjugation challenge - verb conjugation practice
     * 
     * @param {HTMLElement} container - Container element
     * @param {Object} challenge - Challenge data: { type, verb, tense, person, answer, translation, hint }
     * @param {Object} state - Lesson state
     */
    renderConjugation(container, challenge, state) {
        const { verb, tense, person, answer, translation, hint } = challenge;
        
        container.innerHTML = `
            <div class="challenge-card conjugation-card">
                <div class="challenge-instruction">📝 Conjugate the Verb</div>
                <div class="conjugation-verb">
                    <span class="verb-infinitive">${escapeHtml(verb)}</span>
                    <span class="verb-arrow">→</span>
                    <span class="verb-context">${escapeHtml(person)} (${escapeHtml(tense)})</span>
                </div>
                ${translation ? `<div class="conjugation-translation">"${escapeHtml(translation)}"</div>` : ''}
                <div class="conjugation-input-area">
                    <input type="text" id="conjugationInput" class="conjugation-input" 
                           placeholder="Type the conjugated form..." autocomplete="off" autocapitalize="off">
                    ${hint ? `<button class="hint-btn" id="hintBtn" title="Show hint">💡</button>` : ''}
                </div>
                <div class="hint-area hidden" id="hintArea">
                    ${hint ? `<span class="hint-text">${escapeHtml(hint)}</span>` : ''}
                </div>
                <div class="challenge-actions">
                    <button class="btn-check" id="checkBtn">Check Answer</button>
                </div>
                <div class="challenge-feedback" id="feedback"></div>
                <div class="challenge-footer hidden" id="footerActions">
                    <button class="btn-continue" id="continueBtn">Continue →</button>
                </div>
            </div>
        `;
        
        const input = document.getElementById('conjugationInput');
        const checkBtn = document.getElementById('checkBtn');
        const hintBtn = document.getElementById('hintBtn');
        const hintArea = document.getElementById('hintArea');
        
        // Auto-focus
        setTimeout(() => input.focus(), 100);
        
        // Hint button
        if (hintBtn) {
            hintBtn.addEventListener('click', () => {
                hintArea.classList.toggle('hidden');
            });
        }
        
        const checkAnswer = () => {
            const userAnswer = input.value.trim();
            if (!userAnswer) return;
            
            const normalizedUser = normalizeText(userAnswer);
            const normalizedAnswer = normalizeText(answer);
            
            const isCorrect = normalizedUser === normalizedAnswer;
            
            input.disabled = true;
            checkBtn.disabled = true;
            if (hintBtn) hintBtn.disabled = true;
            
            input.classList.add(isCorrect ? 'correct-input' : 'incorrect-input');
            
            this._showFeedback(isCorrect, answer);
            
            if (isCorrect) {
                state.correct++;
                this.onCorrect(challenge, state);
                
                try {
                    eventStream.emit('learning_event', {
                        eventType: 'answer_correct',
                        challengeType: 'conjugation',
                        verb,
                        tense,
                        person,
                        timestamp: Date.now()
                    });
                } catch (e) { /* ignore */ }
            } else {
                state.mistakes++;
                state.wrongAnswers.push({
                    verb,
                    tense,
                    person,
                    userAnswer,
                    correctAnswer: answer,
                    type: 'conjugation'
                });
                this._handleMistake(state);
                
                try {
                    eventStream.emit('learning_event', {
                        eventType: 'answer_incorrect',
                        challengeType: 'conjugation',
                        verb,
                        tense,
                        person,
                        userAnswer,
                        correctAnswer: answer,
                        timestamp: Date.now()
                    });
                } catch (e) { /* ignore */ }
            }
            
            document.getElementById('footerActions').classList.remove('hidden');
            document.getElementById('continueBtn').addEventListener('click', () => {
                this.onChallengeComplete(state);
            });
        };
        
        checkBtn.addEventListener('click', checkAnswer);
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') checkAnswer();
        });
    }

    /**
     * Render fallback for unknown challenge types
     * @private
     */
    _renderUnknownChallenge(container, challenge, state) {
        container.innerHTML = `
            <div class="challenge-card unknown-card">
                <div class="challenge-instruction">⚠️ Unknown Challenge Type</div>
                <div class="unknown-info">
                    <p>Challenge type "${escapeHtml(challenge.type)}" is not yet supported.</p>
                    <pre>${escapeHtml(JSON.stringify(challenge, null, 2).substring(0, 500))}</pre>
                </div>
                <div class="challenge-footer">
                    <button class="btn-continue" id="continueBtn">Skip & Continue →</button>
                </div>
            </div>
        `;
        
        document.getElementById('continueBtn').addEventListener('click', () => {
            this.onChallengeComplete(state);
        });
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
