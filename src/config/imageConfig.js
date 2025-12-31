/**
 * Image Configuration - Curated Images Only
 * 
 * This module provides image utilities for the vocabulary learning app.
 * 
 * IMPORTANT: Dynamic keyword-based image lookup has been REMOVED.
 * All images MUST be explicitly provided via CSV image_url field.
 * 
 * If a vocabulary item lacks an image_url, the "image not found" placeholder
 * will be shown, and the challenge may be skipped (depending on settings).
 * 
 * Image Metadata Schema (for CSV):
 * - image_url: Full URL to the curated image
 * - image_alt: Alt text for accessibility (describes what's in the image)
 * - image_desc: Description of how this image represents the word
 * - image_category: Category for organization (noun, verb, place, etc.)
 * - image_verified: Boolean - has a human/AI verified image-word match?
 */

// Static placeholder for missing/unverified images
const IMAGE_NOT_FOUND_PATH = '/assets/images/image-not-found.svg';

/**
 * Challenge types that REQUIRE images to be shown.
 * Challenges of these types will be SKIPPED if the word has no image.
 * No heart loss occurs for auto-skipped challenges.
 * 
 * Challenge types NOT in this set will show even without images (e.g., pronunciation)
 */
export const IMAGE_REQUIRED_CHALLENGE_TYPES = Object.freeze({
    'mcq': true,              // Multiple choice needs visual context
    'multiple-choice': true,  // Rich multiple choice needs visual
    'match': true,            // Matching exercises need images
    'type-answer': false,     // Can type without seeing image
    'listen-type': false,     // Audio-focused, no image needed
    'pronunciation': false,   // Speech practice, no image needed
    'learn-word': false,      // Learning screen shows image if available but not required
    'fill-blank': false,      // Fill in blank can work without image
    'translate': false,       // Translation can work without image
    'sentence': false,        // Sentence practice doesn't need images
    'sentence-builder': false // Can build sentences without images
});

/**
 * Check if a challenge type requires images
 * @param {string} challengeType - The type of challenge
 * @returns {boolean} - True if this challenge type requires an image to be shown
 */
export function challengeRequiresImage(challengeType) {
    if (!challengeType) return false;
    const normalized = String(challengeType).toLowerCase();
    return IMAGE_REQUIRED_CHALLENGE_TYPES[normalized] === true;
}

/**
 * Valid image categories for organization
 */
export const IMAGE_CATEGORIES = Object.freeze({
    NOUN: 'noun',
    VERB: 'verb', 
    ADJECTIVE: 'adjective',
    PLACE: 'place',
    PERSON: 'person',
    FOOD: 'food',
    ANIMAL: 'animal',
    OBJECT: 'object',
    ABSTRACT: 'abstract',
    NUMBER: 'number',
    TIME: 'time',
    COLOR: 'color',
    BODY: 'body',
    TRANSPORT: 'transport',
    WEATHER: 'weather',
    FAMILY: 'family',
    EMOTION: 'emotion',
    OTHER: 'other'
});

/**
 * Image metadata schema for validation
 */
export const IMAGE_METADATA_SCHEMA = {
    image_url: { type: 'string', required: true, description: 'Full URL to the image' },
    image_alt: { type: 'string', required: true, description: 'Alt text for accessibility' },
    image_desc: { type: 'string', required: false, description: 'Description of how image represents word' },
    image_category: { type: 'string', required: false, enum: Object.values(IMAGE_CATEGORIES) },
    image_verified: { type: 'boolean', required: false, default: false },
    image_source: { type: 'string', required: false, description: 'Source/attribution for the image' }
};

/**
 * Get the placeholder image for missing/unverified images
 * @returns {string} Path to the placeholder image
 */
export function getImageNotFoundPlaceholder() {
    return IMAGE_NOT_FOUND_PATH;
}

/**
 * Check if a value looks like a valid image URL
 * @param {*} value - Value to check
 * @returns {boolean} - True if it looks like a valid image URL
 */
export function isValidImageUrl(value) {
    if (!value) return false;
    const str = String(value).trim();
    
    // Must be a proper URL or data URI
    const isHttp = str.startsWith('http://') || str.startsWith('https://');
    const isDataUri = str.startsWith('data:image/');
    const isRelativePath = str.startsWith('/assets/') || str.startsWith('./assets/');
    
    return isHttp || isDataUri || isRelativePath;
}

/**
 * Check if an image URL is the placeholder
 * @param {string} url - URL to check
 * @returns {boolean} - True if it's the placeholder image
 */
export function isPlaceholderImage(url) {
    if (!url) return false;
    return url.includes('image-not-found');
}

/**
 * Get image URL for a word - EXPLICIT URLS ONLY
 * No dynamic keyword matching. Returns placeholder if no valid URL found.
 * 
 * @param {Object} word - Word object with image_url field
 * @returns {Object} - { url: string, isPlaceholder: boolean, needsCuration: boolean }
 */
export function getWordImageData(word) {
    if (!word) {
        return {
            url: IMAGE_NOT_FOUND_PATH,
            isPlaceholder: true,
            needsCuration: true,
            verified: false
        };
    }
    
    // Only check for explicit image_url field from CSV
    const explicitUrl = word.image_url || word.imageUrl;
    
    if (explicitUrl && isValidImageUrl(explicitUrl)) {
        return {
            url: explicitUrl,
            isPlaceholder: false,
            needsCuration: false,
            verified: word.image_verified === true || word.image_verified === 'true',
            alt: word.image_alt || `Image for ${word.en || word.pt || 'vocabulary'}`,
            category: word.image_category || IMAGE_CATEGORIES.OTHER
        };
    }
    
    // No valid explicit URL - return placeholder
    return {
        url: IMAGE_NOT_FOUND_PATH,
        isPlaceholder: true,
        needsCuration: true,
        verified: false,
        alt: `Missing image for ${word.en || word.pt || 'vocabulary'} - needs curation`,
        missingFor: {
            pt: word.pt || '',
            en: word.en || ''
        }
    };
}

/**
 * Check if a challenge should be skipped due to missing image
 * MUST be defined AFTER getWordImageData since it uses that function
 * 
 * @param {Object} challenge - The challenge object
 * @returns {Object} - { shouldSkip: boolean, reason: string }
 */
export function shouldSkipChallenge(challenge) {
    if (!challenge) {
        return { shouldSkip: true, reason: 'null_challenge' };
    }
    
    // Get challenge type
    const challengeType = challenge.type;
    
    // If this challenge type doesn't require images, never skip
    if (!challengeRequiresImage(challengeType)) {
        return { shouldSkip: false, reason: 'image_not_required' };
    }
    
    // Check if the word has a valid image
    const word = challenge.word;
    if (!word) {
        return { shouldSkip: true, reason: 'no_word' };
    }
    
    const imageData = getWordImageData(word);
    
    if (imageData.isPlaceholder) {
        return { 
            shouldSkip: true, 
            reason: 'missing_image',
            details: {
                wordPt: word.pt,
                wordEn: word.en,
                challengeType: challengeType
            }
        };
    }
    
    return { shouldSkip: false, reason: 'has_image' };
}

/**
 * Validate image metadata for a word
 * @param {Object} word - Word object to validate
 * @returns {Object} - { valid: boolean, errors: string[], warnings: string[] }
 */
export function validateImageMetadata(word) {
    const errors = [];
    const warnings = [];
    
    if (!word) {
        errors.push('Word object is null or undefined');
        return { valid: false, errors, warnings };
    }
    
    const url = word.image_url || word.imageUrl;
    
    if (!url) {
        errors.push(`Missing image_url for "${word.pt || word.en || 'unknown word'}"`);
    } else if (!isValidImageUrl(url)) {
        errors.push(`Invalid image_url format: "${url}"`);
    }
    
    if (!word.image_alt) {
        warnings.push(`Missing image_alt (accessibility) for "${word.pt || word.en}"`);
    }
    
    if (!word.image_verified) {
        warnings.push(`Image not verified for "${word.pt || word.en}"`);
    }
    
    return {
        valid: errors.length === 0,
        errors,
        warnings
    };
}

/**
 * Get statistics about image coverage for a lesson
 * @param {Array} words - Array of word objects
 * @returns {Object} - Coverage statistics
 */
export function getImageCoverageStats(words) {
    if (!Array.isArray(words) || words.length === 0) {
        return {
            total: 0,
            withImages: 0,
            withoutImages: 0,
            verified: 0,
            coverage: 0,
            verificationRate: 0
        };
    }
    
    let withImages = 0;
    let verified = 0;
    
    for (const word of words) {
        const imageData = getWordImageData(word);
        if (!imageData.isPlaceholder) {
            withImages++;
            if (imageData.verified) {
                verified++;
            }
        }
    }
    
    return {
        total: words.length,
        withImages,
        withoutImages: words.length - withImages,
        verified,
        coverage: Math.round((withImages / words.length) * 100),
        verificationRate: withImages > 0 ? Math.round((verified / withImages) * 100) : 0
    };
}

/**
 * Filter words that are missing images (for admin dashboard)
 * @param {Array} words - Array of word objects
 * @returns {Array} - Words missing valid images
 */
export function getWordsMissingImages(words) {
    if (!Array.isArray(words)) return [];
    
    return words.filter(word => {
        const imageData = getWordImageData(word);
        return imageData.isPlaceholder;
    }).map(word => ({
        pt: word.pt,
        en: word.en,
        id: word.id || word.word_id,
        lessonId: word.lessonId || word.lesson_id
    }));
}

/**
 * Filter words with unverified images (for admin review)
 * @param {Array} words - Array of word objects  
 * @returns {Array} - Words with images but not verified
 */
export function getWordsWithUnverifiedImages(words) {
    if (!Array.isArray(words)) return [];
    
    return words.filter(word => {
        const imageData = getWordImageData(word);
        return !imageData.isPlaceholder && !imageData.verified;
    }).map(word => ({
        pt: word.pt,
        en: word.en,
        id: word.id || word.word_id,
        image_url: word.image_url || word.imageUrl
    }));
}

// Export configuration
export default {
    IMAGE_NOT_FOUND_PATH,
    IMAGE_CATEGORIES,
    IMAGE_METADATA_SCHEMA,
    IMAGE_REQUIRED_CHALLENGE_TYPES,
    getImageNotFoundPlaceholder,
    isValidImageUrl,
    isPlaceholderImage,
    getWordImageData,
    validateImageMetadata,
    getImageCoverageStats,
    getWordsMissingImages,
    getWordsWithUnverifiedImages,
    challengeRequiresImage,
    shouldSkipChallenge
};
