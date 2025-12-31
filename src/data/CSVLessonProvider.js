/**
 * CSV Lesson Provider
 * 
 * Provides lesson data from CSV files to supplement the existing JS-based lessons.
 * Loads lessons from /src/data/csv/ directory based on lesson_metadata.json config.
 * 
 * This module integrates with the existing LessonLoader to provide CSV-sourced lessons
 * alongside the JavaScript module-based lessons.
 * 
 * @module data/CSVLessonProvider
 */

import CSVLessonLoader from '../services/CSVLessonLoader.js';
import { LESSON_TIERS } from './LessonLoader.js';

// Cache for loaded lessons
let csvLessonsCache = null;
let metadataCache = null;

/**
 * Load lesson metadata from JSON file
 */
async function loadMetadata() {
    if (metadataCache) return metadataCache;
    
    try {
        const response = await fetch('/src/data/lesson_metadata.json');
        if (!response.ok) throw new Error(`Failed to load lesson metadata: ${response.status}`);
        metadataCache = await response.json();
        return metadataCache;
    } catch (error) {
        console.error('Error loading lesson metadata:', error);
        return { lessons: {}, categories: {} };
    }
}

/**
 * Map category to tier number
 */
function getCategoryTier(category) {
    const tierMap = {
        'Building Blocks': LESSON_TIERS.BUILDING_BLOCKS,
        'Essential Communication': LESSON_TIERS.ESSENTIAL,
        'Daily Topics': LESSON_TIERS.DAILY_TOPICS
    };
    return tierMap[category] || LESSON_TIERS.DAILY_TOPICS;
}

/**
 * Transform CSV word data to lesson word format
 */
function transformCSVWordToLesson(csvWord) {
    return {
        pt: csvWord.pt || csvWord.word || '',
        en: csvWord.en || csvWord.translation || '',
        audio: (csvWord.pt || csvWord.word || '').toLowerCase().replace(/\s+/g, '-'),
        pronunciation: csvWord.pronunciation || csvWord.soundsLike || null,
        type: csvWord.category || 'vocabulary',
        examples: csvWord.examples || [],
        aiTip: csvWord.aiTip || csvWord.tip || null
    };
}

/**
 * Load a single CSV lesson by ID
 * @param {string} lessonId - The lesson ID from metadata
 * @returns {Object|null} Lesson object or null if not found
 */
async function loadCSVLesson(lessonId) {
    const metadata = await loadMetadata();
    const lessonMeta = metadata.lessons[lessonId];
    
    if (!lessonMeta || !lessonMeta.csvFile) {
        return null;
    }
    
    try {
        const csvData = await CSVLessonLoader.loadCSV(lessonMeta.csvFile);
        
        if (!csvData || csvData.length === 0) {
            console.warn(`No data in CSV file: ${lessonMeta.csvFile}`);
            return null;
        }
        
        // Transform CSV rows to word objects
        const words = csvData.map(row => {
            const transformed = CSVLessonLoader.parseCSV ? 
                // If full row is already parsed
                transformCSVWordToLesson({
                    pt: row.portuguese || row.word,
                    en: row.english || row.translation,
                    pronunciation: row.sounds_like,
                    tip: row.tip,
                    examples: row.example_pt ? [{ pt: row.example_pt, en: row.example_en || '' }] : []
                }) :
                transformCSVWordToLesson(row);
            
            return transformed;
        });
        
        const tier = lessonMeta.tier || getCategoryTier(lessonMeta.category);
        
        return {
            id: lessonMeta.id,
            title: lessonMeta.title,
            titlePt: lessonMeta.titlePt,
            topic: lessonMeta.category?.toLowerCase().replace(/\s+/g, '-') || 'csv-lessons',
            topicId: `csv-${lessonMeta.category?.toLowerCase().replace(/\s+/g, '-')}` || 'csv-lessons',
            topicTitle: lessonMeta.category,
            tier: tier,
            level: 'beginner',
            templateId: 'vocabulary',
            description: lessonMeta.description,
            prerequisites: lessonMeta.prerequisites || [],
            estimatedTime: `${lessonMeta.estimatedMinutes || 10} min`,
            icon: lessonMeta.icon || '📚',
            words: words,
            sentences: [], // CSV format doesn't include separate sentences yet
            challenges: [], // Can be generated dynamically
            order: lessonMeta.order || 0,
            tags: lessonMeta.tags || [],
            source: 'csv'
        };
    } catch (error) {
        console.error(`Error loading CSV lesson ${lessonId}:`, error);
        return null;
    }
}

/**
 * Load all CSV-based lessons
 * @returns {Array} Array of lesson objects
 */
export async function loadAllCSVLessons() {
    if (csvLessonsCache) return csvLessonsCache;
    
    const metadata = await loadMetadata();
    const lessons = [];
    
    for (const [lessonId, lessonMeta] of Object.entries(metadata.lessons)) {
        if (lessonMeta.csvFile) {
            const lesson = await loadCSVLesson(lessonId);
            if (lesson) {
                lessons.push(lesson);
            }
        }
    }
    
    // Sort by tier, then by order
    lessons.sort((a, b) => {
        if (a.tier !== b.tier) return a.tier - b.tier;
        return (a.order || 0) - (b.order || 0);
    });
    
    csvLessonsCache = lessons;
    return lessons;
}

/**
 * Get CSV lessons by category/tier
 * @param {number} tier - Tier number (1-3)
 * @returns {Array} Array of lessons in that tier
 */
export async function getCSVLessonsByTier(tier) {
    const allLessons = await loadAllCSVLessons();
    return allLessons.filter(l => l.tier === tier);
}

/**
 * Get a single CSV lesson by ID
 * @param {string} lessonId - Lesson ID
 * @returns {Object|null} Lesson or null
 */
export async function getCSVLessonById(lessonId) {
    const allLessons = await loadAllCSVLessons();
    return allLessons.find(l => l.id === lessonId) || null;
}

/**
 * Get CSV lesson categories (topics)
 * @returns {Array} Array of category/topic objects
 */
export async function getCSVCategories() {
    const metadata = await loadMetadata();
    
    return Object.entries(metadata.categories).map(([name, config]) => ({
        id: name.toLowerCase().replace(/\s+/g, '-'),
        title: name,
        tier: config.tier,
        color: config.color,
        icon: config.icon,
        description: config.description,
        source: 'csv'
    }));
}

/**
 * Clear cache (for testing or forcing reload)
 */
export function clearCSVCache() {
    csvLessonsCache = null;
    metadataCache = null;
}

/**
 * Check if CSV lessons are available
 * @returns {boolean} True if CSV lesson system is configured
 */
export async function hasCSVLessons() {
    const metadata = await loadMetadata();
    return Object.keys(metadata.lessons).length > 0;
}

export default {
    loadAllCSVLessons,
    getCSVLessonsByTier,
    getCSVLessonById,
    getCSVCategories,
    clearCSVCache,
    hasCSVLessons
};
