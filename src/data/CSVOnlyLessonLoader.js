/**
 * CSV-Only Lesson Loader
 * 
 * This is the ONLY source of lesson data. All lesson content comes from CSV files.
 * AI can create new lessons simply by adding a CSV file and updating lesson_metadata.json.
 * 
 * CSV Schema:
 * word_id,portuguese,english,pronunciation,type,grammar_notes,cultural_note,tip,example1_pt,example1_en,example2_pt,example2_en,image
 * 
 * @module data/CSVOnlyLessonLoader
 */

// ============================================================================
// CONFIGURATION
// ============================================================================

export const LESSON_TIERS = {
    BUILDING_BLOCKS: 1,
    ESSENTIAL: 2,
    DAILY_TOPICS: 3,
    ADVANCED: 4
};

const CATEGORY_TO_TIER = {
    'Building Blocks': LESSON_TIERS.BUILDING_BLOCKS,
    'Essential Communication': LESSON_TIERS.ESSENTIAL,
    'Daily Topics': LESSON_TIERS.DAILY_TOPICS,
    'Advanced': LESSON_TIERS.ADVANCED
};

// ============================================================================
// CSV PARSING
// ============================================================================

/**
 * Parse a single CSV line, handling quoted values with commas
 */
function parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
            result.push(current.trim());
            current = '';
        } else {
            current += char;
        }
    }
    result.push(current.trim());
    return result;
}

/**
 * Parse CSV string into array of objects
 */
function parseCSV(csvString) {
    const lines = csvString.trim().split('\n');
    if (lines.length < 2) return [];
    
    const headers = parseCSVLine(lines[0]);
    const data = [];
    
    for (let i = 1; i < lines.length; i++) {
        const values = parseCSVLine(lines[i]);
        if (values.length >= headers.length) {
            const row = {};
            headers.forEach((header, index) => {
                row[header] = values[index] || '';
            });
            data.push(row);
        }
    }
    return data;
}

/**
 * Transform CSV row into word object
 * Parses ALL CSV columns including helper information
 */
function transformCSVRow(row) {
    const examples = [];
    if (row.example1_pt) {
        examples.push({ pt: row.example1_pt, en: row.example1_en || '' });
    }
    if (row.example2_pt) {
        examples.push({ pt: row.example2_pt, en: row.example2_en || '' });
    }
    if (row.example3_pt) {
        examples.push({ pt: row.example3_pt, en: row.example3_en || '' });
    }
    // Support old format too
    if (row.example_pt && examples.length === 0) {
        examples.push({ pt: row.example_pt, en: row.example_en || '' });
    }

    // Parse distractors from semicolon-separated string
    const distractors = row.distractors 
        ? row.distractors.split(';').map(d => d.trim()).filter(Boolean)
        : [];

    return {
        id: row.word_id || row.portuguese?.toLowerCase().replace(/\s+/g, '_') || '',
        pt: row.portuguese || row.word || '',
        en: row.english || row.translation || '',
        audio: (row.portuguese || row.word || '').toLowerCase().replace(/\s+/g, '-'),
        pronunciation: row.pronunciation || row.sounds_like || '',
        type: row.type || 'vocabulary',
        difficulty: row.difficulty || 'beginner_1',
        // Helper information - critical for learning
        mnemonic: row.mnemonic || '',
        grammarNotes: row.grammar_notes || '',
        culturalNote: row.cultural_note || '',
        aiTip: row.tip || '',
        examples: examples,
        image: row.image || '',
        // Distractors for quiz options
        distractors: distractors,
        exerciseOrder: parseInt(row.exercise_order) || 0
    };
}

// ============================================================================
// CACHE
// ============================================================================

let metadataCache = null;
let lessonsCache = null;
let topicsCache = null;
let isInitialized = false;
let initPromise = null;

// ============================================================================
// INITIALIZATION - Must be called before using sync functions
// ============================================================================

/**
 * Initialize the lesson loader - loads all CSV data.
 * Must be awaited before using synchronous functions.
 */
export async function initLessonLoader() {
    if (isInitialized) return;
    if (initPromise) return initPromise;
    
    initPromise = (async () => {
        console.log('[CSVOnlyLessonLoader] Initializing...');
        await loadMetadata();
        await loadAllLessonsInternal();
        await loadAllTopicsInternal();
        isInitialized = true;
        console.log(`[CSVOnlyLessonLoader] Loaded ${lessonsCache.length} lessons from CSV files`);
    })();
    
    return initPromise;
}

// ============================================================================
// METADATA LOADING
// ============================================================================

/**
 * Load lesson metadata from JSON
 */
async function loadMetadata() {
    if (metadataCache) return metadataCache;
    
    try {
        const response = await fetch('/src/data/lesson_metadata.json');
        if (!response.ok) throw new Error(`Failed to load metadata: ${response.status}`);
        metadataCache = await response.json();
        return metadataCache;
    } catch (error) {
        console.error('Error loading lesson metadata:', error);
        return { lessons: {}, categories: {} };
    }
}

// ============================================================================
// CSV LOADING
// ============================================================================

/**
 * Load and parse a single CSV file
 */
async function loadCSVFile(filename) {
    try {
        const response = await fetch(`/src/data/csv/${filename}`);
        if (!response.ok) throw new Error(`Failed to load ${filename}: ${response.status}`);
        const csvText = await response.text();
        return parseCSV(csvText);
    } catch (error) {
        console.error(`Error loading CSV ${filename}:`, error);
        return [];
    }
}

/**
 * Load a single lesson from its CSV file
 */
async function loadLessonFromCSV(lessonId, lessonMeta) {
    if (!lessonMeta.csvFile) {
        console.warn(`No CSV file defined for lesson: ${lessonId}`);
        return null;
    }
    
    const csvData = await loadCSVFile(lessonMeta.csvFile);
    if (csvData.length === 0) {
        console.warn(`No data in CSV file: ${lessonMeta.csvFile}`);
        return null;
    }
    
    const words = csvData.map(transformCSVRow);
    const tier = lessonMeta.tier || CATEGORY_TO_TIER[lessonMeta.category] || LESSON_TIERS.DAILY_TOPICS;
    
    // Generate sentences from word examples
    const sentences = words
        .flatMap(w => w.examples)
        .filter(e => e.pt && e.en)
        .slice(0, 8);
    
    // Determine template ID based on lesson content
    const templateId = determineTemplateId(lessonMeta, words);
    
    return {
        id: lessonMeta.id,
        title: lessonMeta.title,
        titlePt: lessonMeta.titlePt || '',
        topic: lessonMeta.category?.toLowerCase().replace(/\s+/g, '-') || 'general',
        topicId: lessonMeta.category?.toLowerCase().replace(/\s+/g, '-') || 'general',
        topicTitle: lessonMeta.category || 'General',
        tier: tier,
        level: lessonMeta.level || 'beginner',
        description: lessonMeta.description || '',
        prerequisites: lessonMeta.prerequisites || [],
        estimatedTime: `${lessonMeta.estimatedMinutes || 10} min`,
        icon: lessonMeta.icon || '📚',
        order: lessonMeta.order || 0,
        tags: lessonMeta.tags || [],
        templateId: templateId,
        difficultyLevel: lessonMeta.difficultyLevel || 'beginner',
        words: words,
        sentences: sentences,
        // NOTE: Don't pre-generate challenges - let TemplateBuilder handle it
        // This ensures learn-word, MCQ, pronunciation phases are properly created
        challenges: [],
        source: 'csv'
    };
}

/**
 * Determine template ID based on lesson metadata and content
 */
function determineTemplateId(lessonMeta, words) {
    // Allow explicit templateId in metadata
    if (lessonMeta.templateId) return lessonMeta.templateId;
    
    // Check for numbers in title or words
    const isNumbers = lessonMeta.title?.toLowerCase().includes('number') ||
                      lessonMeta.id?.includes('number') ||
                      words.some(w => /^\d+$/.test(w.pt));
    if (isNumbers) return 'numbers';
    
    // Check for grammar-heavy content
    const hasGrammar = words.some(w => w.grammarNotes?.length > 20) ||
                       lessonMeta.title?.toLowerCase().includes('verb') ||
                       lessonMeta.title?.toLowerCase().includes('pronoun') ||
                       lessonMeta.title?.toLowerCase().includes('article') ||
                       lessonMeta.title?.toLowerCase().includes('preposition') ||
                       lessonMeta.title?.toLowerCase().includes('possessive') ||
                       lessonMeta.title?.toLowerCase().includes('negation') ||
                       lessonMeta.title?.toLowerCase().includes('connector');
    if (hasGrammar) return 'grammar';
    
    // Check for conversation-style content
    const isConversation = lessonMeta.title?.toLowerCase().includes('ordering') ||
                           lessonMeta.title?.toLowerCase().includes('café') ||
                           lessonMeta.id?.includes('ordering');
    if (isConversation) return 'conversation';
    
    // Default to standard
    return 'standard';
}

/**
 * Generate basic challenges from words
 */
function generateChallenges(words) {
    const challenges = [];
    
    // Multiple choice: What does X mean?
    words.slice(0, 4).forEach((word, i) => {
        const otherWords = words.filter((_, j) => j !== i).slice(0, 3);
        challenges.push({
            type: 'multiple-choice',
            question: `What does "${word.pt}" mean?`,
            options: [word.en, ...otherWords.map(w => w.en)].sort(() => Math.random() - 0.5),
            correct: [word.en, ...otherWords.map(w => w.en)].sort(() => Math.random() - 0.5).indexOf(word.en),
            explanation: word.aiTip || `"${word.pt}" means "${word.en}"`
        });
    });
    
    // Translation challenges
    words.slice(0, 3).forEach(word => {
        if (word.examples.length > 0) {
            challenges.push({
                type: 'translate',
                prompt: word.examples[0].en,
                answer: word.examples[0].pt,
                hints: [`${word.pt} = ${word.en}`]
            });
        }
    });
    
    return challenges;
}

// ============================================================================
// INTERNAL LOADERS (called during init)
// ============================================================================

async function loadAllTopicsInternal() {
    const metadata = await loadMetadata();
    const topics = [];
    
    for (const [name, config] of Object.entries(metadata.categories || {})) {
        const topicId = name.toLowerCase().replace(/\s+/g, '-');
        topics.push({
            id: topicId,
            title: name,
            description: config.description || '',
            tier: config.tier || LESSON_TIERS.DAILY_TOPICS,
            color: config.color || '#4CAF50',
            icon: config.icon || '📚',
            gated: config.tier > 1,
            order: config.tier || 99,
            lessons: []
        });
    }
    
    topics.sort((a, b) => a.tier - b.tier);
    topicsCache = topics;
}

async function loadAllLessonsInternal() {
    const metadata = await loadMetadata();
    const lessons = [];
    
    for (const [lessonId, lessonMeta] of Object.entries(metadata.lessons || {})) {
        const lesson = await loadLessonFromCSV(lessonId, lessonMeta);
        if (lesson) {
            lessons.push(lesson);
        }
    }
    
    lessons.sort((a, b) => {
        if (a.tier !== b.tier) return a.tier - b.tier;
        return (a.order || 0) - (b.order || 0);
    });
    
    lessonsCache = lessons;
}

// ============================================================================
// PUBLIC API - SYNCHRONOUS (requires initLessonLoader() first)
// ============================================================================

/**
 * Get all topics (categories) - SYNCHRONOUS
 * @returns {Array} Array of topics, or empty array if not initialized
 */
export function getAllTopics() {
    if (!isInitialized) {
        console.warn('[CSVOnlyLessonLoader] Not initialized. Call await initLessonLoader() first.');
        return [];
    }
    return topicsCache || [];
}

/**
 * Get a topic by ID - SYNCHRONOUS
 */
export function getTopicById(topicId) {
    return getAllTopics().find(t => t.id === topicId) || null;
}

/**
 * Get all lessons - SYNCHRONOUS
 * @returns {Array} Array of lessons, or empty array if not initialized
 */
export function getAllLessons() {
    if (!isInitialized) {
        console.warn('[CSVOnlyLessonLoader] Not initialized. Call await initLessonLoader() first.');
        return [];
    }
    return lessonsCache || [];
}

/**
 * Get a lesson by ID - SYNCHRONOUS
 */
export function getLessonById(lessonId) {
    return getAllLessons().find(l => l.id === lessonId) || null;
}

/**
 * Get lessons by topic - SYNCHRONOUS
 */
export function getLessonsByTopic(topicId) {
    return getAllLessons().filter(l => l.topicId === topicId);
}

/**
 * Get lessons by tier - SYNCHRONOUS
 */
export function getLessonsByTier(tier) {
    return getAllLessons().filter(l => l.tier === tier);
}

/**
 * Check if building blocks are complete - SYNCHRONOUS
 */
export function areBuildingBlocksComplete(completedLessonIds) {
    const bbLessons = getLessonsByTier(LESSON_TIERS.BUILDING_BLOCKS);
    return bbLessons.every(l => completedLessonIds.includes(l.id));
}

/**
 * Get building blocks progress - SYNCHRONOUS
 */
export function getBuildingBlocksProgress(completedLessonIds) {
    const bbLessons = getLessonsByTier(LESSON_TIERS.BUILDING_BLOCKS);
    const completed = bbLessons.filter(l => completedLessonIds.includes(l.id));
    
    return {
        total: bbLessons.length,
        completed: completed.length,
        remaining: bbLessons.length - completed.length,
        percentage: bbLessons.length > 0 ? Math.round((completed.length / bbLessons.length) * 100) : 0,
        isComplete: completed.length === bbLessons.length
    };
}

/**
 * Check lesson availability - SYNCHRONOUS
 */
export function checkLessonAvailability(lessonId, completedLessonIds) {
    const lesson = getLessonById(lessonId);
    
    if (!lesson) {
        return { available: false, reason: 'Lesson not found', lesson: null };
    }
    
    if (lesson.tier === LESSON_TIERS.BUILDING_BLOCKS) {
        if (lesson.prerequisites?.length > 0) {
            const prereqsMet = lesson.prerequisites.every(p => completedLessonIds.includes(p));
            if (!prereqsMet) {
                return {
                    available: false,
                    reason: 'Complete prerequisite lessons first',
                    lesson,
                    prerequisites: lesson.prerequisites
                };
            }
        }
        return { available: true, reason: null, lesson };
    }
    
    const bbProgress = getBuildingBlocksProgress(completedLessonIds);
    if (!bbProgress.isComplete) {
        return {
            available: false,
            reason: `Complete Building Blocks first (${bbProgress.completed}/${bbProgress.total})`,
            lesson,
            buildingBlocksProgress: bbProgress
        };
    }
    
    if (lesson.prerequisites?.length > 0) {
        const prereqsMet = lesson.prerequisites.every(p => completedLessonIds.includes(p));
        if (!prereqsMet) {
            return {
                available: false,
                reason: 'Complete prerequisite lessons first',
                lesson,
                prerequisites: lesson.prerequisites
            };
        }
    }
    
    return { available: true, reason: null, lesson };
}

/**
 * Get next recommended lesson - SYNCHRONOUS
 */
export function getNextRecommendedLesson(completedLessonIds) {
    const lessons = getAllLessons();
    
    for (const lesson of lessons) {
        if (completedLessonIds.includes(lesson.id)) continue;
        const availability = checkLessonAvailability(lesson.id, completedLessonIds);
        if (availability.available) {
            return lesson;
        }
    }
    return null;
}

/**
 * Get available lessons - SYNCHRONOUS
 */
export function getAvailableLessons(completedLessonIds) {
    const lessons = getAllLessons();
    const available = [];
    
    for (const lesson of lessons) {
        if (completedLessonIds.includes(lesson.id)) continue;
        const availability = checkLessonAvailability(lesson.id, completedLessonIds);
        if (availability.available) {
            available.push(lesson);
        }
    }
    return available;
}

/**
 * Get progress stats - SYNCHRONOUS
 */
export function getProgressStats(completedLessonIds) {
    const lessons = getAllLessons();
    const byTier = {
        [LESSON_TIERS.BUILDING_BLOCKS]: { total: 0, completed: 0 },
        [LESSON_TIERS.ESSENTIAL]: { total: 0, completed: 0 },
        [LESSON_TIERS.DAILY_TOPICS]: { total: 0, completed: 0 },
        [LESSON_TIERS.ADVANCED]: { total: 0, completed: 0 }
    };
    
    lessons.forEach(l => {
        if (byTier[l.tier]) {
            byTier[l.tier].total++;
            if (completedLessonIds.includes(l.id)) {
                byTier[l.tier].completed++;
            }
        }
    });
    
    const total = lessons.length;
    const completed = completedLessonIds.filter(id => lessons.some(l => l.id === id)).length;
    const pct = (c, t) => t > 0 ? Math.round((c / t) * 100) : 0;
    
    return {
        total: { lessons: total, completed, percentage: pct(completed, total) },
        buildingBlocks: { ...byTier[1], percentage: pct(byTier[1].completed, byTier[1].total) },
        essentials: { ...byTier[2], percentage: pct(byTier[2].completed, byTier[2].total) },
        dailyTopics: { ...byTier[3], percentage: pct(byTier[3].completed, byTier[3].total) },
        advanced: { ...byTier[4], percentage: pct(byTier[4].completed, byTier[4].total) }
    };
}

/**
 * Get lesson image (placeholder implementation)
 */
export function getLessonImage(lesson) {
    return {
        url: `/assets/lesson-thumbs/${lesson.topicId || 'default'}.svg`,
        alt: `${lesson.title} lesson image`
    };
}

/**
 * Clear all caches
 */
export function clearCache() {
    metadataCache = null;
    lessonsCache = null;
    topicsCache = null;
}

// ============================================================================
// DEFAULT EXPORT
// ============================================================================

export default {
    LESSON_TIERS,
    initLessonLoader,
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
    getLessonImage,
    clearCache
};
