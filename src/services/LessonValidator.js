/**
 * LessonValidator.js
 * 
 * Validates lesson data against JSON schemas.
 * Ensures AI-generated lessons meet quality standards.
 * 
 * @module LessonValidator
 * @since Phase 4B - Lesson Architecture
 */

import { createLogger } from './Logger.js';

const logger = createLogger({ context: 'LessonValidator' });

// ============================================================================
// Schema Definitions (inline for browser compatibility)
// ============================================================================

/**
 * Valid challenge types
 */
export const VALID_CHALLENGE_TYPES = [
    'learn-word',
    'pronunciation',
    'mcq',
    'type-answer',
    'listen-type',
    'sentence',
    'multiple-choice',
    'translate',
    'fill-blank',
    'match',
    'sentence-builder',
    'conjugation',
    'dialogue-role-play'
];

/**
 * Valid lesson tiers
 */
export const VALID_TIERS = [1, 2, 3, 4];

/**
 * Valid difficulty levels
 */
export const VALID_LEVELS = ['beginner', 'intermediate', 'advanced'];

/**
 * Valid lesson statuses
 */
export const VALID_STATUSES = ['draft', 'review', 'approved', 'published'];

// ============================================================================
// Validation Result Class
// ============================================================================

/**
 * Validation result with errors and warnings
 */
export class ValidationResult {
    constructor() {
        this.valid = true;
        this.errors = [];
        this.warnings = [];
    }
    
    addError(path, message) {
        this.valid = false;
        this.errors.push({ path, message });
    }
    
    addWarning(path, message) {
        this.warnings.push({ path, message });
    }
    
    merge(other) {
        if (!other.valid) this.valid = false;
        this.errors.push(...other.errors);
        this.warnings.push(...other.warnings);
    }
    
    toObject() {
        return {
            valid: this.valid,
            errorCount: this.errors.length,
            warningCount: this.warnings.length,
            errors: this.errors,
            warnings: this.warnings
        };
    }
}

// ============================================================================
// Validator Class
// ============================================================================

/**
 * LessonValidator - validates lesson data
 */
export class LessonValidator {
    constructor(options = {}) {
        this.strictMode = options.strictMode ?? false;
        this.allowAIContent = options.allowAIContent ?? true;
    }
    
    /**
     * Validate a complete lesson
     * @param {Object} lesson - Lesson data to validate
     * @returns {ValidationResult}
     */
    validateLesson(lesson) {
        const result = new ValidationResult();
        
        // Required fields
        if (!lesson) {
            result.addError('lesson', 'Lesson data is required');
            return result;
        }
        
        // ID validation
        if (!lesson.id) {
            result.addError('id', 'Lesson ID is required');
        } else if (!/^[a-z0-9-]+$/.test(lesson.id)) {
            result.addError('id', 'Lesson ID must be kebab-case (lowercase letters, numbers, hyphens)');
        }
        
        // Title validation
        if (!lesson.title) {
            result.addError('title', 'Lesson title is required');
        } else if (lesson.title.length > 100) {
            result.addError('title', 'Lesson title must be 100 characters or less');
        }
        
        // Topic validation
        if (!lesson.topic) {
            result.addError('topic', 'Topic is required');
        }
        
        // Tier validation
        if (lesson.tier !== undefined && !VALID_TIERS.includes(lesson.tier)) {
            result.addError('tier', `Tier must be one of: ${VALID_TIERS.join(', ')}`);
        }
        
        // Level validation
        if (lesson.level && !VALID_LEVELS.includes(lesson.level)) {
            result.addError('level', `Level must be one of: ${VALID_LEVELS.join(', ')}`);
        }
        
        // Words validation (required, non-empty)
        if (!lesson.words || !Array.isArray(lesson.words)) {
            result.addError('words', 'Words array is required');
        } else if (lesson.words.length === 0) {
            result.addError('words', 'Lesson must have at least one word');
        } else {
            // Validate each word
            lesson.words.forEach((word, index) => {
                const wordResult = this.validateWord(word, `words[${index}]`);
                result.merge(wordResult);
            });
        }
        
        // Sentences validation (optional)
        if (lesson.sentences && Array.isArray(lesson.sentences)) {
            lesson.sentences.forEach((sentence, index) => {
                const sentenceResult = this.validateSentence(sentence, `sentences[${index}]`);
                result.merge(sentenceResult);
            });
        }
        
        // Challenges validation (optional)
        if (lesson.challenges && Array.isArray(lesson.challenges)) {
            lesson.challenges.forEach((challenge, index) => {
                const challengeResult = this.validateChallenge(challenge, `challenges[${index}]`, lesson);
                result.merge(challengeResult);
            });
        }
        
        // Prerequisites validation
        if (lesson.prerequisites && Array.isArray(lesson.prerequisites)) {
            lesson.prerequisites.forEach((prereq, index) => {
                if (typeof prereq !== 'string' || !prereq) {
                    result.addError(`prerequisites[${index}]`, 'Prerequisite must be a non-empty string');
                }
            });
        }
        
        // Metadata validation
        if (lesson.metadata) {
            const metaResult = this.validateMetadata(lesson.metadata);
            result.merge(metaResult);
        }
        
        // AI config validation
        if (lesson.aiConfig) {
            const aiResult = this.validateAIConfig(lesson.aiConfig);
            result.merge(aiResult);
        }
        
        // Quality checks (warnings, not errors)
        this.runQualityChecks(lesson, result);
        
        logger.debug('Lesson validation complete', {
            lessonId: lesson.id,
            valid: result.valid,
            errors: result.errors.length,
            warnings: result.warnings.length
        });
        
        return result;
    }
    
    /**
     * Validate a word object
     */
    validateWord(word, path = 'word') {
        const result = new ValidationResult();
        
        if (!word) {
            result.addError(path, 'Word is required');
            return result;
        }
        
        // Required fields
        if (!word.pt) {
            result.addError(`${path}.pt`, 'Portuguese word is required');
        }
        if (!word.en) {
            result.addError(`${path}.en`, 'English translation is required');
        }
        
        // Pronunciation validation
        if (word.pronunciation) {
            if (word.pronunciation.difficulty && 
                !['easy', 'medium', 'hard', 'very-hard'].includes(word.pronunciation.difficulty)) {
                result.addError(`${path}.pronunciation.difficulty`, 
                    'Difficulty must be: easy, medium, hard, or very-hard');
            }
        }
        
        // Grammar validation
        if (word.grammar) {
            if (word.grammar.number && !['singular', 'plural'].includes(word.grammar.number)) {
                result.addError(`${path}.grammar.number`, 'Number must be: singular or plural');
            }
            if (word.grammar.gender && !['masculine', 'feminine', 'neutral'].includes(word.grammar.gender)) {
                result.addError(`${path}.grammar.gender`, 'Gender must be: masculine, feminine, or neutral');
            }
        }
        
        // Examples validation
        if (word.examples && Array.isArray(word.examples)) {
            word.examples.forEach((example, index) => {
                if (!example.pt) {
                    result.addError(`${path}.examples[${index}].pt`, 'Portuguese example is required');
                }
                if (!example.en) {
                    result.addError(`${path}.examples[${index}].en`, 'English translation is required');
                }
            });
        }
        
        // Quality warnings
        if (!word.pronunciation) {
            result.addWarning(`${path}`, 'Word is missing pronunciation data');
        }
        if (!word.examples || word.examples.length === 0) {
            result.addWarning(`${path}`, 'Word has no example sentences');
        }
        
        return result;
    }
    
    /**
     * Validate a sentence object
     */
    validateSentence(sentence, path = 'sentence') {
        const result = new ValidationResult();
        
        if (!sentence) {
            result.addError(path, 'Sentence is required');
            return result;
        }
        
        if (!sentence.pt) {
            result.addError(`${path}.pt`, 'Portuguese sentence is required');
        }
        if (!sentence.en) {
            result.addError(`${path}.en`, 'English translation is required');
        }
        
        return result;
    }
    
    /**
     * Validate a challenge object
     */
    validateChallenge(challenge, path = 'challenge', lesson = null) {
        const result = new ValidationResult();
        
        if (!challenge) {
            result.addError(path, 'Challenge is required');
            return result;
        }
        
        // Type validation
        if (!challenge.type) {
            result.addError(`${path}.type`, 'Challenge type is required');
            return result;
        }
        
        if (!VALID_CHALLENGE_TYPES.includes(challenge.type)) {
            result.addError(`${path}.type`, 
                `Invalid challenge type: ${challenge.type}. Valid types: ${VALID_CHALLENGE_TYPES.join(', ')}`);
            return result;
        }
        
        // Type-specific validation
        switch (challenge.type) {
            case 'multiple-choice':
                result.merge(this.validateMultipleChoice(challenge, path));
                break;
            case 'translate':
                result.merge(this.validateTranslate(challenge, path));
                break;
            case 'fill-blank':
                result.merge(this.validateFillBlank(challenge, path));
                break;
            case 'match':
                result.merge(this.validateMatch(challenge, path));
                break;
            case 'sentence-builder':
                result.merge(this.validateSentenceBuilder(challenge, path));
                break;
            case 'conjugation':
                result.merge(this.validateConjugation(challenge, path));
                break;
            case 'learn-word':
            case 'pronunciation':
            case 'mcq':
            case 'type-answer':
            case 'listen-type':
                // Word index validation
                if (challenge.wordIndex !== undefined && lesson) {
                    if (challenge.wordIndex < 0 || challenge.wordIndex >= lesson.words.length) {
                        result.addError(`${path}.wordIndex`, 
                            `Word index ${challenge.wordIndex} is out of bounds`);
                    }
                }
                break;
        }
        
        return result;
    }
    
    /**
     * Validate multiple-choice challenge
     */
    validateMultipleChoice(challenge, path) {
        const result = new ValidationResult();
        
        if (!challenge.question) {
            result.addError(`${path}.question`, 'Question is required for multiple-choice');
        }
        if (!challenge.options || !Array.isArray(challenge.options)) {
            result.addError(`${path}.options`, 'Options array is required');
        } else if (challenge.options.length < 2) {
            result.addError(`${path}.options`, 'At least 2 options are required');
        } else if (challenge.options.length > 6) {
            result.addWarning(`${path}.options`, 'More than 6 options may be overwhelming');
        }
        if (challenge.correct === undefined) {
            result.addError(`${path}.correct`, 'Correct answer index is required');
        } else if (challenge.options && (challenge.correct < 0 || challenge.correct >= challenge.options.length)) {
            result.addError(`${path}.correct`, 'Correct index is out of bounds');
        }
        
        return result;
    }
    
    /**
     * Validate translate challenge
     */
    validateTranslate(challenge, path) {
        const result = new ValidationResult();
        
        if (!challenge.prompt) {
            result.addError(`${path}.prompt`, 'Prompt is required for translate');
        }
        if (!challenge.answer) {
            result.addError(`${path}.answer`, 'Answer is required for translate');
        }
        if (challenge.direction && !['pt-to-en', 'en-to-pt'].includes(challenge.direction)) {
            result.addError(`${path}.direction`, 'Direction must be: pt-to-en or en-to-pt');
        }
        
        return result;
    }
    
    /**
     * Validate fill-blank challenge
     */
    validateFillBlank(challenge, path) {
        const result = new ValidationResult();
        
        if (!challenge.sentence) {
            result.addError(`${path}.sentence`, 'Sentence is required for fill-blank');
        } else if (!challenge.sentence.includes('___')) {
            result.addWarning(`${path}.sentence`, 'Sentence should contain ___ for the blank');
        }
        if (!challenge.options || !Array.isArray(challenge.options)) {
            result.addError(`${path}.options`, 'Options array is required');
        } else if (challenge.options.length < 2) {
            result.addError(`${path}.options`, 'At least 2 options are required');
        }
        if (challenge.correct === undefined) {
            result.addError(`${path}.correct`, 'Correct answer index is required');
        }
        
        return result;
    }
    
    /**
     * Validate match challenge
     */
    validateMatch(challenge, path) {
        const result = new ValidationResult();
        
        if (!challenge.pairs || !Array.isArray(challenge.pairs)) {
            result.addError(`${path}.pairs`, 'Pairs array is required for match');
        } else if (challenge.pairs.length < 2) {
            result.addError(`${path}.pairs`, 'At least 2 pairs are required');
        } else if (challenge.pairs.length > 8) {
            result.addWarning(`${path}.pairs`, 'More than 8 pairs may be overwhelming');
        } else {
            challenge.pairs.forEach((pair, index) => {
                if (!pair.left) {
                    result.addError(`${path}.pairs[${index}].left`, 'Left item is required');
                }
                if (!pair.right) {
                    result.addError(`${path}.pairs[${index}].right`, 'Right item is required');
                }
            });
        }
        
        return result;
    }
    
    /**
     * Validate sentence-builder challenge
     */
    validateSentenceBuilder(challenge, path) {
        const result = new ValidationResult();
        
        if (!challenge.targetSentence) {
            result.addError(`${path}.targetSentence`, 'Target sentence is required');
        }
        if (!challenge.words || !Array.isArray(challenge.words)) {
            result.addError(`${path}.words`, 'Words array is required');
        } else if (challenge.words.length < 2) {
            result.addError(`${path}.words`, 'At least 2 words are required');
        }
        
        // Validate that words can form the target sentence
        if (challenge.targetSentence && challenge.words) {
            const targetWords = challenge.targetSentence.toLowerCase()
                .replace(/[.,!?]/g, '')
                .split(/\s+/);
            const providedWords = challenge.words.map(w => w.toLowerCase());
            
            for (const word of targetWords) {
                if (!providedWords.includes(word)) {
                    result.addWarning(`${path}`, 
                        `Word "${word}" from target sentence not in words array`);
                }
            }
        }
        
        return result;
    }
    
    /**
     * Validate conjugation challenge
     */
    validateConjugation(challenge, path) {
        const result = new ValidationResult();
        
        if (!challenge.verb) {
            result.addError(`${path}.verb`, 'Verb infinitive is required');
        }
        if (!challenge.tense) {
            result.addError(`${path}.tense`, 'Tense is required');
        }
        if (!challenge.person) {
            result.addError(`${path}.person`, 'Person is required');
        }
        if (!challenge.answer) {
            result.addError(`${path}.answer`, 'Conjugated answer is required');
        }
        
        return result;
    }
    
    /**
     * Validate metadata
     */
    validateMetadata(metadata) {
        const result = new ValidationResult();
        
        if (metadata.createdBy && !['human', 'ai'].includes(metadata.createdBy)) {
            result.addError('metadata.createdBy', 'createdBy must be: human or ai');
        }
        
        if (metadata.status && !VALID_STATUSES.includes(metadata.status)) {
            result.addError('metadata.status', 
                `Status must be one of: ${VALID_STATUSES.join(', ')}`);
        }
        
        if (metadata.version && !/^\d+\.\d+\.\d+$/.test(metadata.version)) {
            result.addWarning('metadata.version', 'Version should be semantic (x.y.z)');
        }
        
        return result;
    }
    
    /**
     * Validate AI config
     */
    validateAIConfig(aiConfig) {
        const result = new ValidationResult();
        
        if (aiConfig.focusAreas && !Array.isArray(aiConfig.focusAreas)) {
            result.addError('aiConfig.focusAreas', 'focusAreas must be an array');
        }
        
        if (aiConfig.commonMistakes && !Array.isArray(aiConfig.commonMistakes)) {
            result.addError('aiConfig.commonMistakes', 'commonMistakes must be an array');
        }
        
        return result;
    }
    
    /**
     * Run quality checks (generates warnings, not errors)
     */
    runQualityChecks(lesson, result) {
        // Check for minimum content
        if (lesson.words && lesson.words.length < 3) {
            result.addWarning('words', 'Lesson has fewer than 3 words - consider adding more');
        }
        
        // Check for pronunciation data
        if (lesson.words) {
            const wordsWithPronunciation = lesson.words.filter(w => w.pronunciation);
            if (wordsWithPronunciation.length < lesson.words.length * 0.5) {
                result.addWarning('words', 'More than half of words are missing pronunciation data');
            }
        }
        
        // Check for examples
        if (lesson.words) {
            const wordsWithExamples = lesson.words.filter(w => w.examples && w.examples.length > 0);
            if (wordsWithExamples.length < lesson.words.length * 0.5) {
                result.addWarning('words', 'More than half of words have no example sentences');
            }
        }
        
        // Check for description
        if (!lesson.description) {
            result.addWarning('description', 'Lesson has no description');
        }
        
        // Check for estimated time
        if (!lesson.estimatedTime) {
            result.addWarning('estimatedTime', 'Lesson has no estimated completion time');
        }
        
        // Check AI-generated content
        if (lesson.metadata?.createdBy === 'ai' && lesson.metadata?.status === 'published') {
            if (!lesson.metadata?.reviewedBy) {
                result.addWarning('metadata', 'AI-generated lesson is published without review');
            }
        }
    }
    
    /**
     * Quick validation - returns boolean
     */
    isValid(lesson) {
        return this.validateLesson(lesson).valid;
    }
    
    /**
     * Validate multiple lessons
     */
    validateLessons(lessons) {
        const results = [];
        
        for (const lesson of lessons) {
            results.push({
                lessonId: lesson.id || 'unknown',
                ...this.validateLesson(lesson).toObject()
            });
        }
        
        const allValid = results.every(r => r.valid);
        const totalErrors = results.reduce((sum, r) => sum + r.errorCount, 0);
        const totalWarnings = results.reduce((sum, r) => sum + r.warningCount, 0);
        
        return {
            allValid,
            totalLessons: lessons.length,
            validLessons: results.filter(r => r.valid).length,
            totalErrors,
            totalWarnings,
            results
        };
    }
}

// ============================================================================
// Singleton Instance
// ============================================================================

let validatorInstance = null;

/**
 * Get singleton validator instance
 */
export function getValidator(options = {}) {
    if (!validatorInstance) {
        validatorInstance = new LessonValidator(options);
    }
    return validatorInstance;
}

/**
 * Validate a lesson (convenience function)
 */
export function validateLesson(lesson, options = {}) {
    return new LessonValidator(options).validateLesson(lesson);
}

/**
 * Check if lesson is valid (convenience function)
 */
export function isValidLesson(lesson) {
    return new LessonValidator().isValid(lesson);
}

export default LessonValidator;
