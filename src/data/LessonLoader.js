/**
 * Lesson Loader Service
 * 
 * Unified lesson loading with proper ordering:
 * 1. Building Blocks (Tier 1) - Must learn first
 * 2. Essential Communication (Tier 2) - After basics
 * 3. Daily Topics (Tier 3) - Progressive learning
 * 
 * @module data/LessonLoader
 */

import { buildingBlocksTopic, getBuildingBlockLessons } from './building-blocks/index.js';
import { topics as legacyTopics, getAllLessonsFlat as getLegacyLessons } from '../../data.js';

// ============================================================================
// CONFIGURATION
// ============================================================================

/**
 * Tier definitions for lesson ordering
 */
export const LESSON_TIERS = {
    BUILDING_BLOCKS: 1,
    ESSENTIAL: 2,
    DAILY_TOPICS: 3,
    ADVANCED: 4
};

/**
 * Topic tier mapping
 */
const TOPIC_TIER_MAP = {
    'building-blocks': LESSON_TIERS.BUILDING_BLOCKS,
    'greetings': LESSON_TIERS.ESSENTIAL,
    'essentials': LESSON_TIERS.ESSENTIAL,
    'phrase-hacks': LESSON_TIERS.ESSENTIAL,
    'fundamentals': LESSON_TIERS.DAILY_TOPICS,
    'travel': LESSON_TIERS.DAILY_TOPICS,
    'cafe': LESSON_TIERS.DAILY_TOPICS,
    'daily-life': LESSON_TIERS.ADVANCED,
    'work': LESSON_TIERS.ADVANCED
};

// ============================================================================
// STATE
// ============================================================================

let cachedTopics = null;
let cachedLessons = null;

// ============================================================================
// TOPIC LOADING
// ============================================================================

/**
 * Get all topics with building blocks first
 * @returns {Array} Ordered array of topics
 */
export function getAllTopics() {
    if (cachedTopics) return cachedTopics;
    
    // Start with building blocks
    const topics = [buildingBlocksTopic];
    
    // Add legacy topics with tier info
    // Priority: topic.tier > TOPIC_TIER_MAP > default (DAILY_TOPICS)
    legacyTopics.forEach(topic => {
        const tier = topic.tier ?? TOPIC_TIER_MAP[topic.id] ?? LESSON_TIERS.DAILY_TOPICS;
        topics.push({
            ...topic,
            tier
        });
    });
    
    // Sort by tier, then by order property if available
    cachedTopics = topics.sort((a, b) => {
        const tierDiff = (a.tier || 99) - (b.tier || 99);
        if (tierDiff !== 0) return tierDiff;
        return (a.order || 0) - (b.order || 0);
    });
    
    return cachedTopics;
}

/**
 * Get a topic by ID
 * @param {string} topicId - Topic ID
 * @returns {Object|null} Topic object or null
 */
export function getTopicById(topicId) {
    return getAllTopics().find(t => t.id === topicId) || null;
}

// ============================================================================
// LESSON LOADING
// ============================================================================

/**
 * Get all lessons flattened with proper ordering
 * Building blocks come FIRST, then other tiers
 * @returns {Array} Ordered array of all lessons
 */
export function getAllLessons() {
    if (cachedLessons) return cachedLessons;
    
    const lessons = [];
    
    // Add building blocks lessons first (Tier 1)
    const bbLessons = getBuildingBlockLessons();
    bbLessons.forEach((lesson, index) => {
        lessons.push({
            ...lesson,
            topicId: 'building-blocks',
            topicTitle: 'Building Blocks',
            tier: LESSON_TIERS.BUILDING_BLOCKS,
            globalOrder: index,
            gated: false
        });
    });
    
    // Add legacy lessons with tier info
    // Priority: lesson.tier > topic.tier > TOPIC_TIER_MAP > default
    const legacyFlat = getLegacyLessons();
    legacyFlat.forEach((lesson, index) => {
        const topic = getTopicById(lesson.topicId);
        const tier = lesson.tier ?? topic?.tier ?? TOPIC_TIER_MAP[lesson.topicId] ?? LESSON_TIERS.DAILY_TOPICS;
        lessons.push({
            ...lesson,
            tier,
            globalOrder: 100 + index, // After building blocks
            // Building blocks must be completed before gated content
            requiresBuildingBlocks: lesson.gated
        });
    });
    
    // Sort: Tier first, then by globalOrder within tier
    cachedLessons = lessons.sort((a, b) => {
        if (a.tier !== b.tier) return a.tier - b.tier;
        return a.globalOrder - b.globalOrder;
    });
    
    return cachedLessons;
}

/**
 * Get a specific lesson by ID
 * @param {string|number} lessonId - Lesson ID
 * @returns {Object|null} Lesson object or null
 */
export function getLessonById(lessonId) {
    const normalizedId = String(lessonId).toLowerCase();
    return getAllLessons().find(l => 
        String(l.id).toLowerCase() === normalizedId
    ) || null;
}

/**
 * Get lessons for a specific topic
 * @param {string} topicId - Topic ID
 * @returns {Array} Array of lessons
 */
export function getLessonsByTopic(topicId) {
    return getAllLessons().filter(l => l.topicId === topicId);
}

/**
 * Get lessons by tier
 * @param {number} tier - Tier number (1-4)
 * @returns {Array} Array of lessons
 */
export function getLessonsByTier(tier) {
    return getAllLessons().filter(l => l.tier === tier);
}

// ============================================================================
// PREREQUISITE SYSTEM
// ============================================================================

/**
 * Check if user has completed all building blocks
 * @param {Array} completedLessonIds - Array of completed lesson IDs
 * @returns {boolean} True if all building blocks are complete
 */
export function areBuildingBlocksComplete(completedLessonIds) {
    const bbLessons = getBuildingBlockLessons();
    const bbIds = bbLessons.map(l => l.id);
    return bbIds.every(id => completedLessonIds.includes(id));
}

/**
 * Get building blocks completion status
 * @param {Array} completedLessonIds - Array of completed lesson IDs
 * @returns {Object} Status object with count and percentage
 */
export function getBuildingBlocksProgress(completedLessonIds) {
    const bbLessons = getBuildingBlockLessons();
    const bbIds = bbLessons.map(l => l.id);
    const completed = bbIds.filter(id => completedLessonIds.includes(id));
    
    return {
        total: bbLessons.length,
        completed: completed.length,
        remaining: bbLessons.length - completed.length,
        percentage: Math.round((completed.length / bbLessons.length) * 100),
        isComplete: completed.length === bbLessons.length,
        completedIds: completed,
        remainingIds: bbIds.filter(id => !completedLessonIds.includes(id))
    };
}

/**
 * Check if a lesson is available for the user
 * @param {string|number} lessonId - Lesson ID to check
 * @param {Array} completedLessonIds - Array of completed lesson IDs
 * @returns {Object} Availability status
 */
export function checkLessonAvailability(lessonId, completedLessonIds) {
    const lesson = getLessonById(lessonId);
    
    if (!lesson) {
        return {
            available: false,
            reason: 'Lesson not found',
            lesson: null
        };
    }
    
    // Building blocks are always available
    if (lesson.tier === LESSON_TIERS.BUILDING_BLOCKS) {
        // Check if prerequisites within building blocks are met
        if (lesson.prerequisites && lesson.prerequisites.length > 0) {
            const prereqsMet = lesson.prerequisites.every(
                prereqId => completedLessonIds.includes(prereqId)
            );
            
            if (!prereqsMet) {
                return {
                    available: false,
                    reason: 'Complete prerequisite lessons first',
                    lesson,
                    prerequisites: lesson.prerequisites,
                    missingPrereqs: lesson.prerequisites.filter(
                        id => !completedLessonIds.includes(id)
                    )
                };
            }
        }
        
        return { available: true, reason: null, lesson };
    }
    
    // For gated content, check building blocks completion
    if (lesson.gated || lesson.requiresBuildingBlocks) {
        const bbProgress = getBuildingBlocksProgress(completedLessonIds);
        
        if (!bbProgress.isComplete) {
            return {
                available: false,
                reason: `Complete Building Blocks first (${bbProgress.completed}/${bbProgress.total})`,
                lesson,
                buildingBlocksProgress: bbProgress
            };
        }
    }
    
    // Check lesson-specific prerequisites
    if (lesson.prerequisites && lesson.prerequisites.length > 0) {
        const prereqsMet = lesson.prerequisites.every(
            prereqId => completedLessonIds.includes(prereqId)
        );
        
        if (!prereqsMet) {
            return {
                available: false,
                reason: 'Complete prerequisite lessons first',
                lesson,
                prerequisites: lesson.prerequisites,
                missingPrereqs: lesson.prerequisites.filter(
                    id => !completedLessonIds.includes(id)
                )
            };
        }
    }
    
    return { available: true, reason: null, lesson };
}

/**
 * Get the next recommended lesson for user
 * @param {Array} completedLessonIds - Array of completed lesson IDs
 * @returns {Object|null} Next lesson or null if all complete
 */
export function getNextRecommendedLesson(completedLessonIds) {
    const allLessons = getAllLessons();
    
    // Find first incomplete lesson that's available
    for (const lesson of allLessons) {
        if (completedLessonIds.includes(lesson.id)) continue;
        
        const availability = checkLessonAvailability(lesson.id, completedLessonIds);
        if (availability.available) {
            return lesson;
        }
    }
    
    return null;
}

/**
 * Get lessons available to start now
 * @param {Array} completedLessonIds - Array of completed lesson IDs
 * @returns {Array} Array of available lessons
 */
export function getAvailableLessons(completedLessonIds) {
    return getAllLessons().filter(lesson => {
        if (completedLessonIds.includes(lesson.id)) return false;
        const availability = checkLessonAvailability(lesson.id, completedLessonIds);
        return availability.available;
    });
}

// ============================================================================
// LESSON IMAGES
// ============================================================================

/**
 * Default images by tier
 */
const TIER_DEFAULT_IMAGES = {
    [LESSON_TIERS.BUILDING_BLOCKS]: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=400&h=250&fit=crop',
    [LESSON_TIERS.ESSENTIAL]: 'https://images.unsplash.com/photo-1555421689-d68471e189f2?w=400&h=250&fit=crop',
    [LESSON_TIERS.DAILY_TOPICS]: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=250&fit=crop',
    [LESSON_TIERS.ADVANCED]: 'https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=400&h=250&fit=crop'
};

/**
 * Fallback image when all else fails
 */
const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1513185158878-8d8c2a2a3da3?w=400&h=250&fit=crop';

/**
 * Get lesson image with fallback chain
 * Priority: lesson.image > topic.defaultImage > tier default > fallback
 * 
 * @param {Object} lesson - Lesson object
 * @returns {Object} Image object with url and alt
 */
export function getLessonImage(lesson) {
    // 1. Lesson has its own image
    if (lesson.image?.url) {
        return {
            url: lesson.image.url,
            alt: lesson.image.alt || `Image for ${lesson.title}`,
            credit: lesson.image.credit || null
        };
    }
    
    // 2. Topic has default image
    const topic = getTopicById(lesson.topicId);
    if (topic?.defaultImage) {
        return {
            url: topic.defaultImage,
            alt: `${topic.title} topic image`,
            credit: topic.imageCredit || null
        };
    }
    
    // 3. Tier default image
    const tier = lesson.tier || LESSON_TIERS.DAILY_TOPICS;
    if (TIER_DEFAULT_IMAGES[tier]) {
        return {
            url: TIER_DEFAULT_IMAGES[tier],
            alt: `${lesson.title} lesson image`,
            credit: 'Unsplash'
        };
    }
    
    // 4. Ultimate fallback
    return {
        url: FALLBACK_IMAGE,
        alt: `${lesson.title} lesson image`,
        credit: 'Unsplash'
    };
}

/**
 * Set topic default image
 * @param {string} topicId - Topic ID
 * @param {string} imageUrl - Image URL
 */
export function setTopicDefaultImage(topicId, imageUrl) {
    const topic = getTopicById(topicId);
    if (topic) {
        topic.defaultImage = imageUrl;
        // Clear cache to reflect changes
        clearCache();
    }
}

// ============================================================================
// STATS & INFO
// ============================================================================

/**
 * Get overall progress stats
 * @param {Array} completedLessonIds - Array of completed lesson IDs
 * @returns {Object} Progress statistics
 */
export function getProgressStats(completedLessonIds) {
    const allLessons = getAllLessons();
    const buildingBlocks = getLessonsByTier(LESSON_TIERS.BUILDING_BLOCKS);
    const essentials = getLessonsByTier(LESSON_TIERS.ESSENTIAL);
    const dailyTopics = getLessonsByTier(LESSON_TIERS.DAILY_TOPICS);
    const advanced = getLessonsByTier(LESSON_TIERS.ADVANCED);
    
    const countCompleted = (lessons) => 
        lessons.filter(l => completedLessonIds.includes(l.id)).length;
    
    return {
        total: {
            lessons: allLessons.length,
            completed: countCompleted(allLessons),
            percentage: Math.round((countCompleted(allLessons) / allLessons.length) * 100)
        },
        buildingBlocks: {
            lessons: buildingBlocks.length,
            completed: countCompleted(buildingBlocks),
            percentage: Math.round((countCompleted(buildingBlocks) / buildingBlocks.length) * 100)
        },
        essentials: {
            lessons: essentials.length,
            completed: countCompleted(essentials),
            percentage: Math.round((countCompleted(essentials) / essentials.length) * 100)
        },
        dailyTopics: {
            lessons: dailyTopics.length,
            completed: countCompleted(dailyTopics),
            percentage: Math.round((countCompleted(dailyTopics) / dailyTopics.length) * 100)
        },
        advanced: {
            lessons: advanced.length,
            completed: countCompleted(advanced),
            percentage: Math.round((countCompleted(advanced) / advanced.length) * 100)
        }
    };
}

/**
 * Clear cached data (useful for testing)
 */
export function clearCache() {
    cachedTopics = null;
    cachedLessons = null;
}

// ============================================================================
// DEFAULT EXPORT
// ============================================================================

export default {
    // Tiers
    LESSON_TIERS,
    
    // Topic functions
    getAllTopics,
    getTopicById,
    
    // Lesson functions
    getAllLessons,
    getLessonById,
    getLessonsByTopic,
    getLessonsByTier,
    
    // Images
    getLessonImage,
    setTopicDefaultImage,
    
    // Prerequisites
    areBuildingBlocksComplete,
    getBuildingBlocksProgress,
    checkLessonAvailability,
    getNextRecommendedLesson,
    getAvailableLessons,
    
    // Stats
    getProgressStats,
    clearCache
};
