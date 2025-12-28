/**
 * Building Blocks - Lesson Index
 * 
 * TIER 1 content that must be learned first.
 * These lessons provide the foundation for constructing Portuguese sentences.
 * 
 * Learning order:
 * 1. Personal Pronouns (who)
 * 2. Verb Ser (permanent states)
 * 3. Verb Estar (temporary states)  
 * 4. Verb Ter (possession)
 * 5. Articles (the, a/an)
 * 6. Demonstratives (this, that)
 * 7. Connectors (and, but, because)
 * 8. Prepositions (to, from, in)
 * 9. Question Words (what, who, where)
 * 10. Negation & Affirmation (yes, no, never)
 * 11. Possessives (my, your, his)
 * 
 * @module data/building-blocks
 */

// Import all building block lessons (named exports)
import { pronounsLesson } from './pronouns.js';
import { verbSerLesson } from './verbs-ser.js';
import { verbEstarLesson } from './verbs-estar.js';
import { verbTerLesson } from './verbs-ter.js';
import { articlesLesson } from './articles.js';
import { connectorsLesson } from './connectors.js';
import { prepositionsLesson } from './prepositions.js';
import { questionsLesson } from './questions.js';
import { negationLesson } from './negation.js';
import { possessivesLesson } from './possessives.js';

/**
 * Building blocks topic definition
 */
export const buildingBlocksTopic = {
    id: 'building-blocks',
    title: 'Building Blocks',
    description: 'Essential grammar foundations for constructing Portuguese sentences.',
    tier: 1,
    gated: false,
    order: 0, // Should appear first
    lessons: [
        pronounsLesson,
        verbSerLesson,
        verbEstarLesson,
        verbTerLesson,
        articlesLesson,
        connectorsLesson,
        prepositionsLesson,
        questionsLesson,
        negationLesson,
        possessivesLesson,
    ]
};

/**
 * Get all building block lessons in order
 * @returns {Array} Ordered lesson list
 */
export function getBuildingBlockLessons() {
    return buildingBlocksTopic.lessons;
}

/**
 * Get a specific building block lesson by ID
 * @param {string} lessonId - Lesson ID (e.g., 'bb-001')
 * @returns {Object|null} Lesson object or null
 */
export function getBuildingBlockLesson(lessonId) {
    return buildingBlocksTopic.lessons.find(l => l.id === lessonId) || null;
}

/**
 * Get lesson prerequisites
 * @param {string} lessonId - Lesson ID
 * @returns {Array} Array of prerequisite lesson IDs
 */
export function getLessonPrerequisites(lessonId) {
    const lesson = getBuildingBlockLesson(lessonId);
    return lesson?.prerequisites || [];
}

/**
 * Check if all prerequisites are met
 * @param {string} lessonId - Lesson ID to check
 * @param {Array} completedLessons - Array of completed lesson IDs
 * @returns {boolean} True if all prerequisites are met
 */
export function arePrerequisitesMet(lessonId, completedLessons) {
    const prerequisites = getLessonPrerequisites(lessonId);
    return prerequisites.every(prereq => completedLessons.includes(prereq));
}

// Export individual lessons for direct import
export { 
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
};

export default buildingBlocksTopic;
