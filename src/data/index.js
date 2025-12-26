/**
 * Data Index
 * Lesson content and structured learning data
 * 
 * @module data
 */

// Building blocks - foundational lessons (Tier 1)
export { 
    buildingBlocksTopic,
    getBuildingBlockLessons,
    getBuildingBlockLesson,
    getLessonPrerequisites,
    arePrerequisitesMet,
    pronounsLesson,
    verbSerLesson,
    verbEstarLesson,
    verbTerLesson,
    articlesLesson,
    connectorsLesson,
    prepositionsLesson,
    questionsLesson,
    negationLesson,
    possessivesLesson
} from './building-blocks/index.js';

// Lesson Loader - unified lesson access with ordering
export {
    LESSON_TIERS,
    getAllTopics,
    getTopicById,
    getAllLessons,
    getLessonById,
    getLessonsByTopic,
    getLessonsByTier,
    areBuildingBlocksComplete,
    getBuildingBlocksProgress,
    checkLessonAvailability,
    getNextRecommendedLesson,
    getAvailableLessons,
    getProgressStats,
    clearCache
} from './LessonLoader.js';

// Version
export const DATA_VERSION = '2.0.0';

// Lesson order configuration
export const LESSON_ORDER = {
    categories: [
        'building-blocks',    // Pronouns, connectors, articles FIRST
        'essential',          // Greetings, basic communication
        'daily-topics'        // Food, travel, etc.
    ],
    buildingBlocksFirst: true,
    tiers: {
        BUILDING_BLOCKS: 1,
        ESSENTIAL: 2,
        DAILY_TOPICS: 3,
        ADVANCED: 4
    }
};
