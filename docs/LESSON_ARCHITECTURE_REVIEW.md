# Lesson System Architecture Review & Recommendations

> **Date:** December 26, 2025  
> **Purpose:** Enable dynamic lesson creation by local LLM  
> **Priority:** Critical - Current architecture limits immersive learning

---

## Executive Summary

**Problem:** The current lesson system is heavily hardcoded, preventing dynamic lesson generation by the AI.

**Impact:**
- ❌ LLM cannot add new lessons without code changes
- ❌ Rich challenge data in building blocks is **completely ignored**
- ❌ Fixed challenge sequence for all lessons (learn → pronounce → mcq → type → listen)
- ❌ Mnemonics, grammar cards, dialogues all hardcoded
- ❌ Topic tiers, lesson images hardcoded

**Solution:** Data-driven architecture with JSON schema validation

---

## Current Architecture Problems

### 1. Two Incompatible Data Formats

```
data.js (Legacy)          vs       building-blocks/*.js (Rich)
├── Simple words/sentences         ├── Words with pronunciation, grammar, examples
├── No challenges array            ├── Rich challenges array (unused!)
├── Numeric IDs                    ├── String IDs (bb-001)
└── No prerequisites               └── Prerequisites, tiers, AI tips
```

**🔴 The rich `challenges` array in building blocks is NEVER rendered.**

### 2. Hardcoded Challenge Sequence

```javascript
// ChallengeRenderer.js - buildLessonChallenges()
// ALWAYS generates this fixed sequence regardless of lesson data:
1. Learn all words
2. Pronounce 4 random words  
3. MCQ all words
4. Type 5 random words
5. Listen & type 3 random words
6. All sentences
```

**What we HAVE but DON'T USE:**
```javascript
// Building blocks lessons have rich challenges like:
challenges: [
    { type: 'translate', prompt: '...', answer: '...', hints: [...] },
    { type: 'fill-blank', sentence: '...', options: [...] },
    { type: 'match', pairs: [...] },
    { type: 'conjugation', verb: '...', tenses: [...] }
]
```

### 3. Hardcoded Content Maps

| Content | Location | Items |
|---------|----------|-------|
| Lesson images | app.js:71-87 | 26 fixed URLs |
| Mnemonics | app.js:163-184 | ~20 specific words |
| Grammar cards | app.js:297-364 | 4 fixed cards |
| Dialogues | app.js:186-294 | 3 fixed dialogues |
| Topic tiers | LessonLoader.js:27-36 | 8 fixed topics |

---

## Proposed Architecture

### 1. Unified JSON-Based Lesson Format

```
src/data/
├── schema/
│   ├── lesson.schema.json      # Validates all lessons
│   ├── word.schema.json        # Validates word objects
│   └── challenge.schema.json   # Validates challenge objects
├── lessons/
│   ├── building-blocks/
│   │   ├── _topic.json         # Topic metadata
│   │   ├── pronouns.json
│   │   ├── verb-ser.json
│   │   └── ...
│   ├── greetings/
│   │   ├── _topic.json
│   │   ├── essential.json
│   │   └── ...
│   └── travel/
│       └── ...
├── grammar/
│   ├── cards.json              # All grammar cards
│   └── rules.json              # Grammar rules database
├── dialogues/
│   └── conversations.json      # All interactive dialogues
└── mnemonics/
    └── memory-tricks.json      # Searchable mnemonic database
```

### 2. Lesson Schema (lesson.schema.json)

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "required": ["id", "title", "topic", "tier", "level", "words"],
  "properties": {
    "id": {
      "type": "string",
      "pattern": "^[a-z0-9-]+$",
      "description": "Unique lesson identifier"
    },
    "title": { "type": "string" },
    "topic": { "type": "string" },
    "tier": { 
      "type": "integer", 
      "minimum": 1, 
      "maximum": 4,
      "description": "1=Building Blocks, 2=Essential, 3=Daily, 4=Advanced"
    },
    "level": { 
      "enum": ["beginner", "intermediate", "advanced"] 
    },
    "description": { "type": "string" },
    "estimatedTime": { "type": "string" },
    "prerequisites": { 
      "type": "array", 
      "items": { "type": "string" }
    },
    "image": {
      "type": "object",
      "properties": {
        "url": { "type": "string", "format": "uri" },
        "alt": { "type": "string" },
        "credit": { "type": "string" }
      }
    },
    "words": {
      "type": "array",
      "items": { "$ref": "word.schema.json" }
    },
    "sentences": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["pt", "en"],
        "properties": {
          "pt": { "type": "string" },
          "en": { "type": "string" },
          "audio": { "type": "string" },
          "context": { "type": "string" }
        }
      }
    },
    "challenges": {
      "type": "array",
      "items": { "$ref": "challenge.schema.json" },
      "description": "Custom challenges. If empty, auto-generate from words."
    },
    "grammar": {
      "type": "object",
      "description": "Lesson-specific grammar references"
    },
    "dialogues": {
      "type": "array",
      "items": { "type": "string" },
      "description": "IDs of dialogues to include"
    },
    "aiConfig": {
      "type": "object",
      "properties": {
        "focusAreas": { "type": "array", "items": { "type": "string" } },
        "commonMistakes": { "type": "array", "items": { "type": "string" } },
        "dynamicTipTriggers": { "type": "array" }
      }
    },
    "metadata": {
      "type": "object",
      "properties": {
        "createdBy": { "enum": ["human", "ai"] },
        "createdAt": { "type": "string", "format": "date-time" },
        "version": { "type": "string" },
        "tags": { "type": "array", "items": { "type": "string" } }
      }
    }
  }
}
```

### 3. Word Schema (word.schema.json)

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "required": ["pt", "en"],
  "properties": {
    "pt": { "type": "string", "description": "Portuguese word/phrase" },
    "en": { "type": "string", "description": "English translation" },
    "audio": { "type": "string", "description": "Audio file key" },
    "ptFem": { "type": "string", "description": "Feminine form if gendered" },
    "gendered": { "type": "boolean", "default": false },
    
    "pronunciation": {
      "type": "object",
      "properties": {
        "ipa": { "type": "string" },
        "guide": { "type": "string" },
        "breakdown": { "type": "string" },
        "tip": { "type": "string" },
        "commonMistake": { "type": "string" },
        "difficulty": { "enum": ["easy", "medium", "hard", "very-hard"] }
      }
    },
    
    "grammar": {
      "type": "object",
      "properties": {
        "type": { "type": "string" },
        "person": { "type": "string" },
        "number": { "enum": ["singular", "plural"] },
        "gender": { "enum": ["masculine", "feminine", "neutral"] },
        "notes": { "type": "string" }
      }
    },
    
    "examples": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "pt": { "type": "string" },
          "en": { "type": "string" },
          "context": { "type": "string" }
        }
      }
    },
    
    "memory": {
      "type": "object",
      "properties": {
        "mnemonic": { "type": "string" },
        "etymology": { "type": "string" },
        "cognate": { "type": "string" },
        "visualTip": { "type": "string" }
      }
    },
    
    "cultural": { "type": "string" },
    "aiTip": { "type": "string" }
  }
}
```

### 4. Challenge Schema (challenge.schema.json)

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "required": ["type"],
  "oneOf": [
    {
      "properties": {
        "type": { "const": "learn-word" },
        "wordIndex": { "type": "integer" }
      }
    },
    {
      "properties": {
        "type": { "const": "pronunciation" },
        "wordIndex": { "type": "integer" },
        "maxAttempts": { "type": "integer", "default": 3 },
        "passScore": { "type": "integer", "default": 60 }
      }
    },
    {
      "properties": {
        "type": { "const": "multiple-choice" },
        "question": { "type": "string" },
        "options": { "type": "array", "items": { "type": "string" } },
        "correct": { "type": "integer" },
        "explanation": { "type": "string" }
      },
      "required": ["question", "options", "correct"]
    },
    {
      "properties": {
        "type": { "const": "translate" },
        "direction": { "enum": ["pt-to-en", "en-to-pt"], "default": "en-to-pt" },
        "prompt": { "type": "string" },
        "answer": { "type": "string" },
        "alternatives": { "type": "array", "items": { "type": "string" } },
        "hints": { "type": "array", "items": { "type": "string" } }
      },
      "required": ["prompt", "answer"]
    },
    {
      "properties": {
        "type": { "const": "fill-blank" },
        "sentence": { "type": "string", "description": "Use ___ for blank" },
        "options": { "type": "array", "items": { "type": "string" } },
        "correct": { "type": "integer" },
        "explanation": { "type": "string" }
      },
      "required": ["sentence", "options", "correct"]
    },
    {
      "properties": {
        "type": { "const": "match" },
        "prompt": { "type": "string" },
        "pairs": {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "left": { "type": "string" },
              "right": { "type": "string" }
            }
          }
        }
      },
      "required": ["pairs"]
    },
    {
      "properties": {
        "type": { "const": "listen-type" },
        "wordIndex": { "type": "integer" },
        "showHint": { "type": "boolean", "default": false }
      }
    },
    {
      "properties": {
        "type": { "const": "sentence-builder" },
        "targetSentence": { "type": "string" },
        "words": { "type": "array", "items": { "type": "string" } },
        "distractors": { "type": "array", "items": { "type": "string" } }
      },
      "required": ["targetSentence", "words"]
    },
    {
      "properties": {
        "type": { "const": "conjugation" },
        "verb": { "type": "string" },
        "tense": { "type": "string" },
        "person": { "type": "string" },
        "answer": { "type": "string" }
      },
      "required": ["verb", "tense", "person", "answer"]
    },
    {
      "properties": {
        "type": { "const": "dialogue-role-play" },
        "dialogueId": { "type": "string" },
        "role": { "enum": ["speaker-a", "speaker-b"] }
      },
      "required": ["dialogueId", "role"]
    }
  ]
}
```

---

## Implementation Roadmap

### Phase 1: Data Migration (Priority: High)

| Task | Effort | Impact |
|------|--------|--------|
| Create JSON schemas | 2 hours | Enables validation |
| Convert data.js to JSON | 4 hours | Standardizes legacy |
| Convert building-blocks to JSON | 2 hours | Already structured |
| Create LessonValidator service | 2 hours | Validates AI-generated |
| Update LessonLoader for JSON | 2 hours | Unified loading |

### Phase 2: Dynamic Challenge Rendering (Priority: Critical)

| Task | Effort | Impact |
|------|--------|--------|
| Read challenges from lesson data | 1 hour | **Enables rich challenges** |
| Implement TranslateChallenge | 2 hours | New challenge type |
| Implement FillBlankChallenge | 2 hours | New challenge type |
| Implement MatchChallenge | 3 hours | New challenge type |
| Implement SentenceBuilderChallenge | 3 hours | New challenge type |
| Implement ConjugationChallenge | 2 hours | Verb practice |
| Auto-generate challenges as fallback | 2 hours | Backwards compatible |

### Phase 3: Content Externalization (Priority: Medium)

| Task | Effort | Impact |
|------|--------|--------|
| Move mnemonics to JSON | 1 hour | AI can add mnemonics |
| Move grammar cards to JSON | 1 hour | AI can add grammar |
| Move dialogues to JSON | 2 hours | AI can create dialogues |
| Add lesson images to data | 1 hour | Dynamic images |
| Remove topic tier hardcoding | 1 hour | New topics work |

### Phase 4: AI Lesson Generation (Priority: High)

| Task | Effort | Impact |
|------|--------|--------|
| Create LessonGenerator service | 4 hours | AI creates lessons |
| Add lesson validation pipeline | 2 hours | Quality assurance |
| Create lesson template prompts | 2 hours | Consistent generation |
| Add lesson preview/testing UI | 4 hours | Human review |
| Implement lesson approval flow | 2 hours | Admin control |

---

## Sample AI-Generated Lesson

Here's what the AI should be able to create:

```json
{
  "id": "food-restaurant-ordering",
  "title": "Ordering at a Restaurant",
  "topic": "food",
  "tier": 2,
  "level": "beginner",
  "description": "Learn essential phrases for dining out in Portugal.",
  "estimatedTime": "15 min",
  "prerequisites": ["food-basics"],
  
  "image": {
    "url": "/images/lessons/restaurant.jpg",
    "alt": "Portuguese restaurant scene"
  },
  
  "words": [
    {
      "pt": "a ementa",
      "en": "the menu",
      "pronunciation": {
        "ipa": "/ɐ ɨˈmẽtɐ/",
        "guide": "ah eh-MEN-tah",
        "tip": "The 'e' sounds like 'eh', not 'ee'"
      },
      "grammar": { "type": "noun", "gender": "feminine" },
      "examples": [
        { "pt": "Pode trazer a ementa, por favor?", "en": "Can you bring the menu, please?" }
      ],
      "memory": {
        "cognate": "Related to English 'menu' (from Latin 'minuta')"
      }
    }
  ],
  
  "sentences": [
    {
      "pt": "Uma mesa para dois, por favor.",
      "en": "A table for two, please.",
      "context": "When entering a restaurant"
    }
  ],
  
  "challenges": [
    {
      "type": "multiple-choice",
      "question": "How do you ask for the menu in Portuguese?",
      "options": [
        "Onde está a ementa?",
        "Pode trazer a ementa?",
        "Quero a ementa.",
        "A ementa, agora!"
      ],
      "correct": 1,
      "explanation": "'Pode trazer' (Can you bring) is the polite way to ask."
    },
    {
      "type": "translate",
      "direction": "en-to-pt",
      "prompt": "A table for two, please.",
      "answer": "Uma mesa para dois, por favor.",
      "alternatives": ["Mesa para dois, por favor."],
      "hints": ["mesa = table", "para = for", "dois = two"]
    },
    {
      "type": "dialogue-role-play",
      "dialogueId": "restaurant-ordering-basic",
      "role": "speaker-a"
    }
  ],
  
  "aiConfig": {
    "focusAreas": ["polite requests", "restaurant vocabulary"],
    "commonMistakes": ["forgetting 'por favor'", "wrong gender for nouns"]
  },
  
  "metadata": {
    "createdBy": "ai",
    "createdAt": "2025-12-26T15:30:00Z",
    "version": "1.0.0",
    "tags": ["food", "restaurant", "practical", "conversation"]
  }
}
```

---

## API for AI Lesson Generation

### Service Interface

```javascript
// src/services/LessonGenerator.js

class LessonGenerator {
    /**
     * Generate a new lesson using local LLM
     * @param {Object} request - Generation request
     * @returns {Promise<Object>} Generated lesson data
     */
    async generateLesson(request) {
        const { 
            topic,           // e.g., "food", "travel"
            focus,           // e.g., "ordering at restaurants"
            level,           // beginner, intermediate, advanced
            wordCount,       // target number of words (5-15)
            includeGrammar,  // specific grammar points to cover
            prerequisites,   // lessons that should come before
            targetTime       // estimated completion time
        } = request;
        
        // 1. Build prompt with schema requirements
        // 2. Call local Ollama LLM
        // 3. Validate against schema
        // 4. Return lesson or errors
    }
    
    /**
     * Validate a lesson against schema
     */
    async validateLesson(lesson) {
        // JSON schema validation
        // Check word/challenge consistency
        // Verify all references exist
    }
    
    /**
     * Add a validated lesson to the system
     */
    async addLesson(lesson, options = {}) {
        const { approved = false, preview = true } = options;
        // Store in appropriate location
        // Update indexes
        // Trigger cache invalidation
    }
}
```

### Generation Request Flow

```
User/Admin Request
       ↓
┌─────────────────┐
│ LessonGenerator │
│   - Build prompt│
│   - Call LLM    │
└────────┬────────┘
         ↓
┌─────────────────┐
│ LessonValidator │
│   - Schema check│
│   - Consistency │
└────────┬────────┘
         ↓
   Valid? ─── No ──→ Return errors, retry
     │
    Yes
     ↓
┌─────────────────┐
│ Preview/Review  │
│   - Admin sees  │
│   - Can edit    │
└────────┬────────┘
         ↓
   Approved?
     │
    Yes
     ↓
┌─────────────────┐
│ LessonStore     │
│   - Save JSON   │
│   - Update index│
│   - Clear cache │
└─────────────────┘
```

---

## Quick Wins (Implement Now)

### 1. Use Existing Challenge Data

```javascript
// ChallengeRenderer.js - buildLessonChallenges()

export function buildLessonChallenges(lesson, options = {}) {
    // NEW: If lesson has custom challenges, use them!
    if (lesson.challenges && lesson.challenges.length > 0) {
        return lesson.challenges.map((challenge, idx) => ({
            ...challenge,
            index: idx
        }));
    }
    
    // FALLBACK: Auto-generate from words (existing behavior)
    return buildAutoChallenges(lesson, options);
}
```

### 2. Dynamic Topic Tiers

```javascript
// LessonLoader.js

function getTopicTier(topic) {
    // Check if topic has tier property
    if (topic.tier) return topic.tier;
    
    // Fallback to mapping
    return TOPIC_TIER_MAP[topic.id] || LESSON_TIERS.DAILY_TOPICS;
}
```

### 3. Lesson Image Fallbacks

```javascript
// Get lesson image with fallbacks
function getLessonImage(lesson) {
    // 1. Lesson has its own image
    if (lesson.image?.url) return lesson.image.url;
    
    // 2. Topic has default image
    const topic = getTopicById(lesson.topic);
    if (topic?.defaultImage) return topic.defaultImage;
    
    // 3. Category default
    return CATEGORY_DEFAULTS[lesson.tier] || '/images/default-lesson.jpg';
}
```

---

## Success Criteria

| Criteria | Current | Target |
|----------|---------|--------|
| Lesson data format | 2 incompatible | 1 unified JSON |
| Challenge types supported | 6 hardcoded | 12+ data-driven |
| Can AI add lessons? | ❌ No | ✅ Yes |
| Can AI add grammar? | ❌ No | ✅ Yes |
| Can AI create dialogues? | ❌ No | ✅ Yes |
| Time to add new lesson | Hours (code) | Minutes (JSON) |
| Validation | None | Schema-based |

---

## Next Steps

1. **Immediate:** Fix `buildLessonChallenges()` to use lesson.challenges
2. **This Week:** Create JSON schemas and migrate data.js
3. **Next Week:** Implement new challenge type renderers
4. **Following Week:** Build LessonGenerator service for AI

---

*This document should be updated as implementation progresses.*
