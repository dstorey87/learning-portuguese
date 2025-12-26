/**
 * LessonCard Component
 * Renders lesson cards in the lesson grid
 * 
 * @module components/lesson/LessonCard
 */

/**
 * LessonCard configuration
 */
export const LESSON_CARD_CONFIG = {
    defaultImage: 'https://images.unsplash.com/photo-1555881400-74d7acaacd8b?w=400&h=250&fit=crop',
    imageWidth: 400,
    imageHeight: 250
};

/**
 * Get lesson thumbnail image URL
 * Uses lesson.image or generates a fallback based on topic
 * @param {Object} lesson - Lesson object
 * @returns {string} Image URL
 */
export function getLessonImage(lesson) {
    if (lesson.image) return lesson.image;
    
    // Topic-based fallback images
    const topicImages = {
        'greetings': 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=400&h=250&fit=crop',
        'numbers': 'https://images.unsplash.com/photo-1596496050827-8299e0220de1?w=400&h=250&fit=crop',
        'food': 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&h=250&fit=crop',
        'travel': 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=400&h=250&fit=crop',
        'family': 'https://images.unsplash.com/photo-1511895426328-dc8714191300?w=400&h=250&fit=crop',
        'weather': 'https://images.unsplash.com/photo-1504608524841-42fe6f032b4b?w=400&h=250&fit=crop',
        'time': 'https://images.unsplash.com/photo-1501139083538-0139583c060f?w=400&h=250&fit=crop',
        'building-blocks': 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=400&h=250&fit=crop',
        'pronouns': 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=400&h=250&fit=crop',
        'articles': 'https://images.unsplash.com/photo-1457369804613-52c61a468e7d?w=400&h=250&fit=crop',
        'default': LESSON_CARD_CONFIG.defaultImage
    };
    
    const topicKey = lesson.topicId?.toLowerCase() || 'default';
    return topicImages[topicKey] || topicImages.default;
}

/**
 * Calculate lesson completion percentage
 * @param {Object} lesson - Lesson object
 * @param {Object} userData - User progress data
 * @returns {number} Completion percentage 0-100
 */
export function getLessonProgress(lesson, userData) {
    if (!userData?.completedLessons) return 0;
    
    // Check if lesson is in completed list
    if (userData.completedLessons.includes(lesson.id)) {
        return 100;
    }
    
    // Calculate partial progress based on words learned
    const learnedWords = userData.learnedWords || [];
    const lessonWords = lesson.words || [];
    
    if (lessonWords.length === 0) return 0;
    
    const learnedCount = lessonWords.filter(w => 
        learnedWords.some(lw => lw.portuguese === w.portuguese)
    ).length;
    
    return Math.round((learnedCount / lessonWords.length) * 100);
}

/**
 * Get lesson difficulty badge
 * @param {string} level - Lesson level (A1, A2, B1, etc.)
 * @returns {Object} Badge with class and label
 */
export function getDifficultyBadge(level) {
    const badges = {
        'A1': { class: 'badge-beginner', label: 'Beginner', color: '#58cc02' },
        'A2': { class: 'badge-elementary', label: 'Elementary', color: '#1cb0f6' },
        'B1': { class: 'badge-intermediate', label: 'Intermediate', color: '#ff9600' },
        'B2': { class: 'badge-upper', label: 'Upper Int.', color: '#ff4b4b' },
        'C1': { class: 'badge-advanced', label: 'Advanced', color: '#a560e8' },
        'C2': { class: 'badge-mastery', label: 'Mastery', color: '#ffc800' }
    };
    
    return badges[level] || { class: 'badge-default', label: level, color: '#afafbf' };
}

/**
 * Render a single lesson card
 * @param {Object} lesson - Lesson data
 * @param {Object} options - Render options
 * @param {Object} options.userData - User progress data
 * @param {boolean} options.showProgress - Whether to show progress bar
 * @param {Function} options.onClick - Click handler
 * @returns {HTMLElement} Lesson card element
 */
export function renderLessonCard(lesson, options = {}) {
    const { userData = {}, showProgress = true, onClick = null } = options;
    
    const imageUrl = getLessonImage(lesson);
    const progress = getLessonProgress(lesson, userData);
    const badge = getDifficultyBadge(lesson.level);
    const isActive = userData.activeLesson === lesson.id;
    const isCompleted = progress === 100;
    const isPremium = lesson.gated && !userData.isPremium;
    
    const card = document.createElement('div');
    card.className = `lesson-card ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''} ${isPremium ? 'locked' : ''}`;
    card.dataset.lessonId = lesson.id;
    
    const wordCount = lesson.words?.length || 0;
    const sentenceCount = lesson.sentences?.length || 0;
    
    card.innerHTML = `
        <div class="lesson-thumb" style="background-image: url('${imageUrl}')">
            ${isCompleted ? '<div class="completion-overlay"><span class="check-icon">✓</span></div>' : ''}
            ${isPremium ? '<div class="premium-overlay"><span class="lock-icon">🔒</span></div>' : ''}
        </div>
        <div class="lesson-content">
            <div class="lesson-meta">
                <span class="topic-tag">${lesson.topicTitle || lesson.topicId || 'General'}</span>
                <span class="level-badge" style="background-color: ${badge.color}">${badge.label}</span>
            </div>
            <h3 class="lesson-title">${lesson.title}</h3>
            <p class="lesson-stats">
                <span class="stat-item">📝 ${wordCount} words</span>
                ${sentenceCount > 0 ? `<span class="stat-item">💬 ${sentenceCount} sentences</span>` : ''}
            </p>
            ${showProgress && progress > 0 ? `
                <div class="lesson-progress">
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${progress}%"></div>
                    </div>
                    <span class="progress-text">${progress}%</span>
                </div>
            ` : ''}
            <div class="lesson-badges">
                ${isPremium ? '<span class="badge-premium">⭐ Premium</span>' : ''}
                ${isActive ? '<span class="badge-active">📖 In progress</span>' : ''}
                ${isCompleted ? '<span class="badge-completed">✅ Completed</span>' : ''}
            </div>
        </div>
    `;
    
    if (onClick && !isPremium) {
        card.addEventListener('click', () => onClick(lesson));
        card.style.cursor = 'pointer';
    } else if (isPremium) {
        card.addEventListener('click', () => {
            // Dispatch event for premium paywall
            window.dispatchEvent(new CustomEvent('showPaywall', { detail: { lesson } }));
        });
        card.style.cursor = 'pointer';
    }
    
    return card;
}

/**
 * Render a grid of lesson cards
 * @param {HTMLElement} container - Container element
 * @param {Array} lessons - Array of lesson objects
 * @param {Object} options - Render options
 */
export function renderLessonGrid(container, lessons, options = {}) {
    const { 
        userData = {}, 
        showProgress = true, 
        onLessonClick = null,
        emptyMessage = 'No lessons available for this filter.'
    } = options;
    
    container.innerHTML = '';
    
    if (!lessons || lessons.length === 0) {
        container.innerHTML = `<p class="muted empty-message">${emptyMessage}</p>`;
        return;
    }
    
    lessons.forEach(lesson => {
        const card = renderLessonCard(lesson, {
            userData,
            showProgress,
            onClick: onLessonClick
        });
        container.appendChild(card);
    });
}

/**
 * Filter lessons by criteria
 * @param {Array} lessons - All lessons
 * @param {Object} filters - Filter criteria
 * @param {string} filters.topic - Topic ID to filter by
 * @param {string} filters.level - Level to filter by
 * @param {boolean} filters.includePremium - Include premium lessons
 * @param {boolean} filters.onlyCompleted - Only show completed
 * @param {boolean} filters.onlyIncomplete - Only show incomplete
 * @param {Object} userData - User data for filtering
 * @returns {Array} Filtered lessons
 */
export function filterLessons(lessons, filters = {}, userData = {}) {
    const { 
        topic = 'all', 
        level = 'all', 
        includePremium = true,
        onlyCompleted = false,
        onlyIncomplete = false
    } = filters;
    
    return lessons.filter(lesson => {
        // Topic filter
        if (topic !== 'all' && lesson.topicId !== topic) return false;
        
        // Level filter
        if (level !== 'all' && lesson.level !== level) return false;
        
        // Premium filter
        if (!includePremium && lesson.gated && !userData.isPremium) return false;
        
        // Completion filters
        const progress = getLessonProgress(lesson, userData);
        if (onlyCompleted && progress !== 100) return false;
        if (onlyIncomplete && progress === 100) return false;
        
        return true;
    });
}

/**
 * Sort lessons by criteria
 * @param {Array} lessons - Lessons to sort
 * @param {string} sortBy - Sort field (title, level, progress, recent)
 * @param {boolean} ascending - Sort direction
 * @param {Object} userData - User data for progress sorting
 * @returns {Array} Sorted lessons
 */
export function sortLessons(lessons, sortBy = 'title', ascending = true, userData = {}) {
    const sorted = [...lessons];
    
    const levelOrder = { 'A1': 1, 'A2': 2, 'B1': 3, 'B2': 4, 'C1': 5, 'C2': 6 };
    
    sorted.sort((a, b) => {
        let comparison = 0;
        
        switch (sortBy) {
            case 'title':
                comparison = a.title.localeCompare(b.title);
                break;
            case 'level':
                comparison = (levelOrder[a.level] || 99) - (levelOrder[b.level] || 99);
                break;
            case 'progress':
                comparison = getLessonProgress(a, userData) - getLessonProgress(b, userData);
                break;
            case 'words':
                comparison = (a.words?.length || 0) - (b.words?.length || 0);
                break;
            default:
                comparison = 0;
        }
        
        return ascending ? comparison : -comparison;
    });
    
    return sorted;
}

// Default export
export default {
    LESSON_CARD_CONFIG,
    getLessonImage,
    getLessonProgress,
    getDifficultyBadge,
    renderLessonCard,
    renderLessonGrid,
    filterLessons,
    sortLessons
};
