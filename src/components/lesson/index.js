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

// Future exports
// export { WordCard } from './WordCard.js';
// export { OptionsPanel } from './OptionsPanel.js';
