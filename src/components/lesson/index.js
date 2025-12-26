/**
 * Lesson Components Index
 * 
 * @module components/lesson
 */

export {
    LESSON_CARD_CONFIG,
    getLessonImage,
    getLessonProgress,
    getDifficultyBadge,
    renderLessonCard,
    renderLessonGrid,
    filterLessons,
    sortLessons,
    default as LessonCard
} from './LessonCard.js';

export {
    CHALLENGE_TYPES,
    CHALLENGE_PHASES,
    CHALLENGE_CONFIG,
    normalizeText,
    escapeHtml,
    shuffleArray,
    getWordKey,
    resolveWordForm,
    getAlternateForm,
    buildQuizOptions,
    buildLessonChallenges,
    ChallengeRenderer,
    default as ChallengeRendererDefault
} from './ChallengeRenderer.js';

export {
    WORD_CARD_CONFIG,
    escapeHtml as escapeHtmlWord,
    wrapCharsInSpans,
    wrapWordsInSpans,
    clearKaraokeHighlights,
    resolveWordForm as resolveWordFormCard,
    getAlternateForm as getAlternateFormCard,
    getWordIndexFromCharIndex,
    WordCard,
    createWordCard,
    createSentenceCard,
    default as WordCardDefault
} from './WordCard.js';

// Future exports
// export { OptionsPanel } from './OptionsPanel.js';
