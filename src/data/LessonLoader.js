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

// Topic keyword mapping to drive more relevant remote images
const TOPIC_KEYWORDS = {
    'building-blocks': ['grammar', 'structure', 'basics'],
    'greetings': ['greeting', 'handshake', 'hello'],
    'basic-greetings': ['greeting', 'handshake', 'hello'],
    'essentials': ['everyday', 'daily', 'basics'],
    'everyday-essentials': ['daily life', 'routine'],
    'phrase-hacks': ['phrases', 'conversation'],
    'travel': ['travel', 'journey', 'transport'],
    'cafe': ['coffee', 'cafe', 'food'],
    'cafe-food': ['coffee', 'food'],
    'language-fundamentals': ['language', 'words', 'alphabet'],
    'numbers': ['numbers', 'math'],
    'time': ['clock', 'time'],
    'colors': ['colors', 'palette'],
    'family': ['family', 'people'],
    'work': ['office', 'work'],
    'daily-life': ['daily', 'city']
};

// Curated Unsplash IDs per topic to guarantee image availability (static IDs, still varied by seed)
const TOPIC_IMAGE_POOLS = {
    'building-blocks': [
        'photo-1503676260728-1c00da094a0b',
        'photo-1485846234645-a62644f84728',
        'photo-1485846234645-74ebc7c3f17a'
    ],
    'greetings': [
        'photo-1524504388940-b1c1722653e1',
        'photo-1519085360753-af0119f7cbe7'
    ],
    'essentials': [
        'photo-1504384308090-c894fdcc538d',
        'photo-1520607162513-77705c0f0d4a'
    ],
    'phrase-hacks': [
        'photo-1507525428034-b723cf961d3e',
        'photo-1441974231531-c6227db76b6e'
    ],
    'travel': [
        'photo-1500530855697-b586d89ba3ee',
        'photo-1505761671935-60b3a7427bad'
    ],
    'cafe': [
        'photo-1509042239860-f550ce710b93',
        'photo-1459257868276-5e65389e2722'
    ],
    'language-fundamentals': [
        'photo-1488590528505-98d2b5aba04b',
        'photo-1473181488821-2d23949a045a'
    ],
    'numbers': [
        'photo-1505693416388-ac5ce068fe85',
        'photo-1509228627152-72ae9ae6848d'
    ],
    'time': [
        'photo-1501139083538-0139583c060f',
        'photo-1441974231531-c6227db76b6e'
    ],
    'colors': [
        'photo-1501004318641-b39e6451bec6',
        'photo-1501004318641-44fdc4482f5b'
    ],
    'family': [
        'photo-1487412720507-e7ab37603c6f',
        'photo-1489945052260-4f21c52268e0'
    ],
    'work': [
        'photo-1517245386807-bb43f82c33c4',
        'photo-1521737604893-d14cc237f11d'
    ],
    'daily-life': [
        'photo-1500530855697-b586d89ba3ee',
        'photo-1520607162513-77705c0f0d4a'
    ],
    default: [
        'photo-1484795819573-86ae049cb815',
        'photo-1500530855697-b586d89ba3ee'
    ]
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
    [LESSON_TIERS.BUILDING_BLOCKS]: '/assets/lesson-thumbs/building-blocks.svg',
    [LESSON_TIERS.ESSENTIAL]: '/assets/lesson-thumbs/essentials.svg',
    [LESSON_TIERS.DAILY_TOPICS]: '/assets/lesson-thumbs/phrase-hacks.svg',
    [LESSON_TIERS.ADVANCED]: '/assets/lesson-thumbs/default.svg'
};

/**
 * Fallback image when all else fails (local-only to avoid remote dependency)
 */
const FALLBACK_IMAGE = '/assets/lesson-thumbs/default.svg';

function hashString(value = '') {
    let hash = 0;
    for (let i = 0; i < value.length; i += 1) {
        hash = (hash << 5) - hash + value.charCodeAt(i);
        hash |= 0;
    }
    return Math.abs(hash);
}

function pickFromPool(pool = [], seed = 0) {
    if (!pool.length) return null;
    const index = seed % pool.length;
    return pool[index];
}

// Semantic keyword mapping for lesson topics -> relevant Unsplash search terms
const LESSON_KEYWORD_MAP = {
    // Building blocks - abstract concepts need visual metaphors
    'personal-pronouns': 'faces,portrait,group of people,conversation',
    'bb-001': 'faces,portrait,group of people,conversation',
    'pronouns': 'faces,portrait,group of people,conversation',
    'verb-ser': 'id card,portrait,passport,identity',
    'bb-002': 'id card,portrait,passport,identity',
    'verb-estar': 'feelings,mood,street scene,location',
    'bb-003': 'feelings,mood,street scene,location',
    'verb-ter': 'holding object,hands,belongings,ownership',
    'bb-004': 'holding object,hands,belongings,ownership',
    'articles': 'books,typography,letters,reading',
    'bb-005': 'books,typography,letters,reading',
    'connectors': 'connectors,conjunctions,and or but,binding words',
    'bb-007': 'connectors,conjunctions,and or but,binding words',
    'prepositions': 'maps,arrows,direction,signpost',
    'question-words': 'question mark,curious person,thinking,chat',
    'negation': 'decision,yes or no,stop sign,cross mark',
    'possessives': 'holding belongings,personal items,locker',
    // Greetings and essentials
    'greetings': 'greeting,handshake,hello,waving',
    'essential-greetings': 'greeting,hello,waving',
    'polite-starts': 'polite,formal,greeting',
    'rapid-replies': 'conversation,chat,talking',
    'mini-dialogues': 'dialogue,conversation,people-talking',
    // Numbers and time
    'numbers': 'numbers,counting,digits',
    'time': 'clock,time,watch',
    'days': 'calendar,week,schedule',
    'months': 'calendar,seasons,year',
    // Daily life
    'cafe': 'coffee,cafe,espresso,pastry',
    'cafe-survival': 'coffee-shop,barista,cafe',
    'restaurant': 'restaurant,food,dining',
    'restaurant-cheats': 'restaurant,menu,waiter',
    'travel': 'travel,journey,airport,suitcase',
    'instant-travel': 'travel,tourist,vacation',
    'getting-around': 'city,street,transport,bus',
    // Language fundamentals
    'colors': 'colors,rainbow,paint,palette',
    'family': 'family,parents,children,home',
    'weather': 'weather,sky,clouds,sun',
    'seasons': 'seasons,nature,landscape',
    'verbs': 'action,movement,doing',
    'adjectives': 'description,qualities,feelings',
    // Fallback topics
    'building-blocks': 'learning,education,blocks,foundation',
    'fundamentals': 'education,learning,study,books',
    'phrase-hacks': 'speech,talking,phrases,conversation',
    'essentials': 'everyday,daily,routine,life'
};

function extractEnglishKeywords(lesson) {
    if (!Array.isArray(lesson.words) || lesson.words.length === 0) return '';

    const stopWords = new Set(['i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them', 'your', 'my']);

    const words = lesson.words
        .slice(0, 5)
        .map(w => (w.en || w.english || '').toLowerCase().trim())
        .filter(Boolean)
        .map(text => text.replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim())
        .filter(Boolean)
        .filter(word => word.length >= 3 && !stopWords.has(word));

    // De-duplicate while preserving order
    return Array.from(new Set(words)).join(',');
}

function getLessonKeywords(lesson) {
    // Try to find specific keywords based on lesson title/id
    const titleKey = normalizeKey(lesson.title || '');
    const idKey = normalizeKey(lesson.id || '');
    const topicKey = normalizeKey(lesson.topicId || '');

    // Extract English words up front so the query always anchors to user-facing vocabulary
    const englishKeywords = extractEnglishKeywords(lesson);

    const mappedKeywords = LESSON_KEYWORD_MAP[titleKey]
        || LESSON_KEYWORD_MAP[idKey]
        || LESSON_KEYWORD_MAP[topicKey];

    // Check for partial matches in title
    let partialKeywords = null;
    if (!mappedKeywords) {
        for (const [key, keywords] of Object.entries(LESSON_KEYWORD_MAP)) {
            if (titleKey.includes(key) || key.includes(titleKey)) {
                partialKeywords = keywords;
                break;
            }
        }
    }

    // Build a combined keyword string that always includes English vocab when available
    // Prefer curated lesson keywords; only fall back to English vocab if no mapping exists.
    if (mappedKeywords) return mappedKeywords;
    if (partialKeywords) return partialKeywords;
    if (englishKeywords.trim()) return englishKeywords;

    // Default to Portugal/Portuguese theme
    return 'portugal,lisbon,portuguese,learning';
}

function buildSmartImageUrl(lesson) {
    const keywords = getLessonKeywords(lesson);
    // Use Unsplash Source API which actually searches by keywords
    // Add a unique sig based on lesson id to get different images for similar keywords
    const sig = hashString(lesson.id || lesson.title || 'lesson');
    return `https://source.unsplash.com/400x250/?${encodeURIComponent(keywords)}&sig=${sig}`;
}

// Pick a deterministic, curated Unsplash photo ID per topic to avoid blank/blocked responses
function buildTopicPoolImage(lesson) {
    const topicKey = normalizeKey(lesson.topicId || lesson.topicTitle);
    const pool = TOPIC_IMAGE_POOLS[topicKey] || TOPIC_IMAGE_POOLS.default;
    if (!pool || pool.length === 0) return null;

    const seed = hashString(lesson.id || lesson.title || topicKey);
    const imageId = pickFromPool(pool, seed);
    if (!imageId) return null;

    return `https://images.unsplash.com/${imageId}?auto=format&fit=crop&w=800&h=500&q=75`;
}

function buildSvgPlaceholder(lesson) {
    const base = `${lesson.topicId || 'lesson'}-${lesson.title || 'portuguese'}`.toLowerCase();
    const hash = hashString(base || 'lesson');
    const hue1 = hash % 360;
    const hue2 = (hash * 7) % 360;
    const title = (lesson.title || 'Portuguese').slice(0, 26);
    const topic = (lesson.topicTitle || lesson.topicId || '').slice(0, 22);
    const icon = topicKeyIcon(lesson.topicId);
    const firstWord = lesson.words?.[0];
    const wordEn = (firstWord?.en || firstWord?.english || '').slice(0, 18);
    const wordPt = (firstWord?.pt || '').slice(0, 18);
    const svg = `
<svg xmlns='http://www.w3.org/2000/svg' width='400' height='250'>
    <defs>
        <linearGradient id='g' x1='0' y1='0' x2='1' y2='1'>
            <stop offset='0%' stop-color='hsl(${hue1},70%,45%)' />
            <stop offset='100%' stop-color='hsl(${hue2},70%,35%)' />
        </linearGradient>
    </defs>
    <rect width='400' height='250' rx='18' fill='url(#g)' />
    <text x='26' y='72' fill='rgba(255,255,255,0.9)' font-family='Arial, sans-serif' font-size='42'>${icon}</text>
    <text x='26' y='132' fill='rgba(255,255,255,0.95)' font-family='Arial, sans-serif' font-size='24' font-weight='700'>${title}</text>
    <text x='26' y='170' fill='rgba(255,255,255,0.8)' font-family='Arial, sans-serif' font-size='16'>${topic}</text>
    ${wordEn ? `<text x='26' y='205' fill='rgba(255,255,255,0.82)' font-family='Arial, sans-serif' font-size='14'>EN: ${wordEn}</text>` : ''}
    ${wordPt ? `<text x='26' y='225' fill='rgba(255,255,255,0.75)' font-family='Arial, sans-serif' font-size='13'>PT: ${wordPt}</text>` : ''}
</svg>`;
    return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

// Local, deterministic assets to guarantee paint even when network sources fail
const LOCAL_LESSON_IMAGES = {
    // Topic-level mappings
    'building-blocks': '/assets/lesson-thumbs/building-blocks.svg',
    'greetings': '/assets/lesson-thumbs/basic-greetings.svg',
    'essentials': '/assets/lesson-thumbs/essentials.svg',
    'basic-greetings': '/assets/lesson-thumbs/basic-greetings.svg',
    'everyday-essentials': '/assets/lesson-thumbs/essentials.svg',
    'phrase-hacks': '/assets/lesson-thumbs/phrase-hacks.svg',
    'language-fundamentals': '/assets/lesson-thumbs/fundamentals.svg',
    // Default
    default: '/assets/lesson-thumbs/default.svg'
};

const TIER_LOCAL_IMAGES = {
    [LESSON_TIERS.BUILDING_BLOCKS]: LOCAL_LESSON_IMAGES['building-blocks'],
    [LESSON_TIERS.ESSENTIAL]: LOCAL_LESSON_IMAGES['essentials'],
    [LESSON_TIERS.DAILY_TOPICS]: LOCAL_LESSON_IMAGES['phrase-hacks'],
    [LESSON_TIERS.ADVANCED]: LOCAL_LESSON_IMAGES.default
};

const normalizeKey = (value) => String(value || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

function topicKeyIcon(topicId) {
    const key = normalizeKey(topicId);
    const icons = {
        'building-blocks': '🧱',
        'greetings': '🤝',
        'basic-greetings': '🤝',
        'essentials': '✨',
        'everyday-essentials': '✨',
        'phrase-hacks': '💬',
        'travel': '✈️',
        'cafe': '☕',
        'cafe-food': '🥐',
        'language-fundamentals': '📘',
        'numbers': '🔢',
        'time': '⏰',
        'colors': '🎨',
        'family': '👪',
        'work': '💼',
        'daily-life': '🏙️'
    };
    return icons[key] || '🇵🇹';
}

function getLocalLessonImage(lesson) {
    const topicKey = normalizeKey(lesson.topicId) || normalizeKey(lesson.topicTitle);
    if (topicKey && LOCAL_LESSON_IMAGES[topicKey]) return LOCAL_LESSON_IMAGES[topicKey];

    const topicText = `${lesson.topicTitle || ''} ${lesson.topicId || ''}`.toLowerCase();
    if (topicText.includes('greet')) return LOCAL_LESSON_IMAGES['basic-greetings'];
    if (topicText.includes('phrase')) return LOCAL_LESSON_IMAGES['phrase-hacks'];
    if (topicText.includes('essential') || topicText.includes('everyday')) return LOCAL_LESSON_IMAGES['essentials'];
    if (topicText.includes('fundamental') || topicText.includes('language')) return LOCAL_LESSON_IMAGES['fundamentals'];

    const titleText = (lesson.title || '').toLowerCase();
    if (titleText.includes('greet')) return LOCAL_LESSON_IMAGES['basic-greetings'];
    if (titleText.includes('travel') || titleText.includes('restaurant') || titleText.includes('cafe')) return LOCAL_LESSON_IMAGES['essentials'];
    if (titleText.includes('phrase') || titleText.includes('rapid')) return LOCAL_LESSON_IMAGES['phrase-hacks'];
    if (titleText.includes('number') || titleText.includes('time') || titleText.includes('days') || titleText.includes('months') || titleText.includes('family') || titleText.includes('colors')) return LOCAL_LESSON_IMAGES['fundamentals'];

    if (lesson.tier && TIER_LOCAL_IMAGES[lesson.tier]) return TIER_LOCAL_IMAGES[lesson.tier];
    return LOCAL_LESSON_IMAGES.default;
}

/**
 * Get lesson image with fallback chain
 * Priority: lesson.image > topic.defaultImage > tier default > fallback
 * 
 * @param {Object} lesson - Lesson object
 * @returns {Object} Image object with url and alt
 */
export function getLessonImage(lesson) {
    const localUrl = getLocalLessonImage(lesson);
    const svgUrl = buildSvgPlaceholder(lesson);
    const pooledUrl = buildTopicPoolImage(lesson);
    const smartUrl = buildSmartImageUrl(lesson);
    // Keep the keyword-based URL first so tests (and analytics) still see vocab-driven queries,
    // but layer a curated pool photo behind it to avoid plain gradients if the search URL fails.
    const remoteUrl = smartUrl || pooledUrl;
    const remoteFallbackUrl = smartUrl && pooledUrl ? pooledUrl : null;

    // 1. Lesson-specific image (keep if provided), still expose svg/local for layering
    if (lesson.image?.url) {
        return {
            url: lesson.image.url,
            localUrl,
            remoteUrl: lesson.image.url,
            remoteFallbackUrl,
            svgUrl,
            alt: lesson.image.alt || `Image for ${lesson.title}`,
            credit: lesson.image.credit || null
        };
    }

    // 2. Curated pool image per topic to avoid empty/solid-color results; fall back to smart keyword search
    if (remoteUrl) {
        return {
            url: remoteUrl,
            localUrl,
            remoteUrl,
            remoteFallbackUrl,
            svgUrl,
            alt: `${lesson.title} illustration`,
            credit: 'Unsplash Featured'
        };
    }

    // 3. Deterministic inline SVG placeholder (offline-safe, unique per lesson)
    if (svgUrl) {
        return {
            url: svgUrl,
            localUrl,
            remoteUrl: null,
            svgUrl,
            alt: `${lesson.title} illustration`,
            credit: 'Generated'
        };
    }
    
    // 4. Topic default image (only if local path)
    const topic = getTopicById(lesson.topicId);
    if (topic?.defaultImage && topic.defaultImage.startsWith('/')) {
        return {
            url: topic.defaultImage,
            localUrl,
            remoteUrl: null,
            svgUrl: null,
            alt: `${topic.title} topic image`,
            credit: topic.imageCredit || null
        };
    }
    
    // 5. Tier default image (local-only)
    const tier = lesson.tier || LESSON_TIERS.DAILY_TOPICS;
    if (TIER_DEFAULT_IMAGES[tier]) {
        return {
            url: TIER_DEFAULT_IMAGES[tier],
            localUrl,
            remoteUrl: null,
            svgUrl: null,
            alt: `${lesson.title} lesson image`,
            credit: 'Local'
        };
    }
    
    // 6. Ultimate fallback (local-only)
    return {
        url: FALLBACK_IMAGE,
        localUrl,
        remoteUrl: null,
        svgUrl: null,
        alt: `${lesson.title} lesson image`,
        credit: 'Local'
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
