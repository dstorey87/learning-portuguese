/**
 * Data Index
 * Lesson content and structured learning data
 * 
 * @module data
 */

// Building blocks lessons (pronouns, connectors, articles)
// export { buildingBlocksLessons } from './lessons/buildingBlocks.js';

// Essential communication lessons
// export { essentialLessons } from './lessons/essential.js';

// Daily topics lessons
// export { dailyTopicsLessons } from './lessons/dailyTopics.js';

// Word database with pronunciation, examples, grammar
// export { wordDatabase } from './words/database.js';

// Static tips database (fallback when AI unavailable)
// export { staticTips } from './tips/staticTips.js';

// Placeholder export until data is migrated
export const DATA_VERSION = '0.1.0';

// Lesson order configuration
export const LESSON_ORDER = {
    categories: [
        'building-blocks',    // Pronouns, connectors, articles FIRST
        'essential',          // Greetings, basic communication
        'daily-topics'        // Food, travel, etc.
    ],
    buildingBlocksFirst: true
};
