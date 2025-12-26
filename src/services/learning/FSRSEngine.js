/**
 * FSRS-5 Spaced Repetition Algorithm
 * 
 * Modern replacement for the 30-year-old SM-2 algorithm.
 * Based on: https://github.com/open-spaced-repetition/fsrs4anki
 * 
 * Key improvements over SM-2:
 * - Learns from user's actual review history
 * - Predicts memory stability more accurately
 * - Adapts to individual learning patterns
 * - Similar performance to SM-17 (latest SuperMemo)
 * 
 * @see https://github.com/open-spaced-repetition/fsrs4anki/wiki/The-Algorithm
 */

// Rating enum
export const Rating = {
    Again: 1,  // Complete blackout, wrong answer
    Hard: 2,   // Correct but with difficulty
    Good: 3,   // Correct with some hesitation
    Easy: 4    // Perfect, instant recall
};

// Card state enum
export const State = {
    New: 0,
    Learning: 1,
    Review: 2,
    Relearning: 3
};

/**
 * FSRS-5 Engine for spaced repetition scheduling
 */
export class FSRSEngine {
    constructor(params = {}) {
        // FSRS-5 default parameters (optimized from millions of reviews)
        // These can be personalized per-user through optimization
        this.params = {
            // Weight parameters w[0] to w[16]
            w: params.w || [
                0.4,    // w[0]: initial stability for Again
                0.6,    // w[1]: initial stability for Hard
                2.4,    // w[2]: initial stability for Good
                5.8,    // w[3]: initial stability for Easy
                4.93,   // w[4]: difficulty mean reversion
                0.94,   // w[5]: difficulty mean reversion speed
                0.86,   // w[6]: difficulty update factor
                0.01,   // w[7]: stability after failure base
                1.49,   // w[8]: stability increase factor
                0.14,   // w[9]: stability decrease rate
                0.94,   // w[10]: recall probability effect
                2.18,   // w[11]: failure stability factor
                0.05,   // w[12]: difficulty effect on failure
                0.34,   // w[13]: stability effect on failure
                1.26,   // w[14]: retrievability effect on failure
                0.29,   // w[15]: hard penalty
                2.61    // w[16]: easy bonus
            ],
            // Target retention rate (90% = review when 10% chance of forgetting)
            requestRetention: params.requestRetention || 0.9,
            // Maximum interval in days
            maximumInterval: params.maximumInterval || 36500,
            // Fuzz factor for randomization (prevents clustering)
            enableFuzz: params.enableFuzz !== false
        };
    }

    /**
     * Create a new card for a word
     * @param {string} wordId - Unique word identifier
     * @returns {Object} Initial card state
     */
    createCard(wordId) {
        return {
            wordId,
            state: State.New,
            difficulty: 0,
            stability: 0,
            due: new Date(),
            lastReview: null,
            reps: 0,
            lapses: 0,
            elapsedDays: 0,
            scheduledDays: 0
        };
    }

    /**
     * Schedule next review based on rating
     * @param {Object} card - Current card state
     * @param {number} rating - User rating (1-4)
     * @param {Date} now - Current time (optional, for testing)
     * @returns {Object} Updated card with new schedule
     */
    schedule(card, rating, now = new Date()) {
        // Clone card to avoid mutation
        const newCard = { ...card };
        
        // Calculate elapsed days since last review
        if (newCard.lastReview) {
            newCard.elapsedDays = this.daysBetween(newCard.lastReview, now);
        }

        // Update based on current state
        switch (newCard.state) {
            case State.New:
                return this.scheduleNew(newCard, rating, now);
            case State.Learning:
            case State.Relearning:
                return this.scheduleLearning(newCard, rating, now);
            case State.Review:
                return this.scheduleReview(newCard, rating, now);
            default:
                return this.scheduleNew(newCard, rating, now);
        }
    }

    /**
     * Schedule a new card
     */
    scheduleNew(card, rating, now) {
        card.reps = 1;
        card.lastReview = now;
        
        // Initial difficulty (starts at 5, range 1-10)
        card.difficulty = this.initDifficulty(rating);
        
        // Initial stability based on rating
        card.stability = this.initStability(rating);
        
        if (rating === Rating.Again) {
            // Failed - stay in learning
            card.state = State.Learning;
            card.scheduledDays = 0;
            card.due = this.addMinutes(now, 1); // Review in 1 minute
        } else if (rating === Rating.Hard) {
            card.state = State.Learning;
            card.scheduledDays = 0;
            card.due = this.addMinutes(now, 5); // Review in 5 minutes
        } else if (rating === Rating.Good) {
            card.state = State.Learning;
            card.scheduledDays = 0;
            card.due = this.addMinutes(now, 10); // Review in 10 minutes
        } else {
            // Easy - graduate immediately
            card.state = State.Review;
            const interval = this.nextInterval(card.stability);
            card.scheduledDays = interval;
            card.due = this.addDays(now, interval);
        }
        
        return card;
    }

    /**
     * Schedule a learning/relearning card
     */
    scheduleLearning(card, rating, now) {
        card.reps += 1;
        card.lastReview = now;
        
        if (rating === Rating.Again) {
            // Reset to start of learning
            card.lapses += card.state === State.Relearning ? 0 : 1;
            card.stability = this.initStability(Rating.Again);
            card.due = this.addMinutes(now, 1);
        } else if (rating === Rating.Hard) {
            card.due = this.addMinutes(now, 5);
        } else if (rating === Rating.Good) {
            // Graduate to review
            card.state = State.Review;
            card.stability = this.initStability(Rating.Good);
            const interval = this.nextInterval(card.stability);
            card.scheduledDays = interval;
            card.due = this.addDays(now, interval);
        } else {
            // Easy - graduate with bonus
            card.state = State.Review;
            card.stability = this.initStability(Rating.Easy);
            const interval = this.nextInterval(card.stability);
            card.scheduledDays = interval;
            card.due = this.addDays(now, interval);
        }
        
        return card;
    }

    /**
     * Schedule a review card
     */
    scheduleReview(card, rating, now) {
        card.reps += 1;
        card.lastReview = now;
        
        // Calculate retrievability (probability of recall)
        const retrievability = this.forgettingCurve(card.elapsedDays, card.stability);
        
        if (rating === Rating.Again) {
            // Lapse - forgot the card
            card.lapses += 1;
            card.state = State.Relearning;
            card.stability = this.nextForgetStability(
                card.difficulty,
                card.stability,
                retrievability
            );
            card.scheduledDays = 0;
            card.due = this.addMinutes(now, 5);
        } else {
            // Recalled successfully
            card.state = State.Review;
            card.difficulty = this.nextDifficulty(card.difficulty, rating);
            card.stability = this.nextRecallStability(
                card.difficulty,
                card.stability,
                retrievability,
                rating
            );
            const interval = this.nextInterval(card.stability);
            card.scheduledDays = interval;
            card.due = this.addDays(now, this.applyFuzz(interval));
        }
        
        return card;
    }

    /**
     * Initialize difficulty based on first rating
     * Difficulty ranges from 1 (easy) to 10 (hard)
     */
    initDifficulty(rating) {
        const w = this.params.w;
        // D0 = w[4] - (rating - 3) * w[5]
        const d0 = w[4] - (rating - 3) * w[5];
        return Math.min(10, Math.max(1, d0));
    }

    /**
     * Initialize stability based on first rating
     * Stability is the time in days for retention to drop to 90%
     */
    initStability(rating) {
        const w = this.params.w;
        // S0 = w[rating - 1]
        return Math.max(0.1, w[rating - 1]);
    }

    /**
     * Calculate next difficulty after review
     */
    nextDifficulty(d, rating) {
        const w = this.params.w;
        // D' = D - w[6] * (rating - 3)
        // With mean reversion: D' = w[7] * D0(3) + (1 - w[7]) * D'
        const delta = -w[6] * (rating - 3);
        const nextD = d + delta;
        const d0 = this.initDifficulty(Rating.Good);
        const meanReverted = w[5] * d0 + (1 - w[5]) * nextD;
        return Math.min(10, Math.max(1, meanReverted));
    }

    /**
     * Calculate next stability after successful recall
     */
    nextRecallStability(d, s, r, rating) {
        const w = this.params.w;
        
        // Hard penalty and easy bonus
        const hardPenalty = rating === Rating.Hard ? w[15] : 1;
        const easyBonus = rating === Rating.Easy ? w[16] : 1;
        
        // S' = S * (1 + e^w[8] * (11 - D) * S^(-w[9]) * (e^(w[10]*(1-R)) - 1) * hardPenalty * easyBonus)
        const newS = s * (
            1 +
            Math.exp(w[8]) *
            (11 - d) *
            Math.pow(s, -w[9]) *
            (Math.exp(w[10] * (1 - r)) - 1) *
            hardPenalty *
            easyBonus
        );
        
        return Math.max(0.1, newS);
    }

    /**
     * Calculate next stability after forgetting (lapse)
     */
    nextForgetStability(d, s, r) {
        const w = this.params.w;
        
        // S' = w[11] * D^(-w[12]) * ((S + 1)^w[13] - 1) * e^(w[14] * (1 - R))
        const newS = w[11] *
            Math.pow(d, -w[12]) *
            (Math.pow(s + 1, w[13]) - 1) *
            Math.exp(w[14] * (1 - r));
        
        return Math.max(0.1, newS);
    }

    /**
     * Calculate forgetting curve (retrievability)
     * R(t, S) = e^(-t/S)
     */
    forgettingCurve(elapsedDays, stability) {
        if (stability <= 0) return 0;
        return Math.exp(-elapsedDays / stability);
    }

    /**
     * Calculate next interval from stability
     * I = S * log(R) / log(0.9)
     */
    nextInterval(stability) {
        const r = this.params.requestRetention;
        const interval = stability * Math.log(r) / Math.log(0.9);
        return Math.min(
            this.params.maximumInterval,
            Math.max(1, Math.round(interval))
        );
    }

    /**
     * Apply fuzz factor to prevent clustering
     */
    applyFuzz(interval) {
        if (!this.params.enableFuzz || interval < 2.5) {
            return interval;
        }
        
        // Fuzz range: ±5% for short intervals, ±2 days for long intervals
        const fuzzRange = Math.min(
            Math.round(interval * 0.05),
            Math.max(1, Math.round(interval * 0.02))
        );
        
        const delta = Math.floor(Math.random() * (fuzzRange * 2 + 1)) - fuzzRange;
        return Math.max(1, interval + delta);
    }

    /**
     * Get all cards due for review
     * @param {Array} cards - Array of cards
     * @param {Date} now - Current time
     * @returns {Array} Cards due for review, sorted by due date
     */
    getDueCards(cards, now = new Date()) {
        return cards
            .filter(card => new Date(card.due) <= now)
            .sort((a, b) => new Date(a.due) - new Date(b.due));
    }

    /**
     * Get review statistics for a set of cards
     */
    getStatistics(cards) {
        const now = new Date();
        const stats = {
            total: cards.length,
            new: 0,
            learning: 0,
            review: 0,
            relearning: 0,
            due: 0,
            overdue: 0,
            averageStability: 0,
            averageDifficulty: 0
        };

        let totalStability = 0;
        let totalDifficulty = 0;
        let reviewCards = 0;

        for (const card of cards) {
            switch (card.state) {
                case State.New:
                    stats.new++;
                    break;
                case State.Learning:
                    stats.learning++;
                    break;
                case State.Review:
                    stats.review++;
                    break;
                case State.Relearning:
                    stats.relearning++;
                    break;
            }

            if (new Date(card.due) <= now) {
                stats.due++;
                if (card.state === State.Review && this.daysBetween(card.due, now) > 1) {
                    stats.overdue++;
                }
            }

            if (card.stability > 0) {
                totalStability += card.stability;
                reviewCards++;
            }
            if (card.difficulty > 0) {
                totalDifficulty += card.difficulty;
            }
        }

        if (reviewCards > 0) {
            stats.averageStability = totalStability / reviewCards;
            stats.averageDifficulty = totalDifficulty / reviewCards;
        }

        return stats;
    }

    /**
     * Calculate days between two dates
     */
    daysBetween(date1, date2) {
        const d1 = new Date(date1);
        const d2 = new Date(date2);
        const diff = d2.getTime() - d1.getTime();
        return diff / (1000 * 60 * 60 * 24);
    }

    /**
     * Add days to a date
     */
    addDays(date, days) {
        const result = new Date(date);
        result.setDate(result.getDate() + days);
        return result;
    }

    /**
     * Add minutes to a date
     */
    addMinutes(date, minutes) {
        const result = new Date(date);
        result.setMinutes(result.getMinutes() + minutes);
        return result;
    }

    /**
     * Migrate a card from SM-2 format to FSRS
     * @param {Object} sm2Card - Card in SM-2 format
     * @returns {Object} Card in FSRS format
     */
    migrateFromSM2(sm2Card) {
        // SM-2 uses: interval, easeFactor, repetitions
        // Map to FSRS: stability ≈ interval, difficulty ≈ 11 - easeFactor * 4
        
        const interval = sm2Card.interval || 1;
        const easeFactor = sm2Card.easeFactor || 2.5;
        
        return {
            wordId: sm2Card.wordId || sm2Card.id,
            state: interval < 1 ? State.Learning : State.Review,
            stability: Math.max(0.1, interval),
            difficulty: Math.min(10, Math.max(1, 11 - easeFactor * 4)),
            due: sm2Card.dueDate ? new Date(sm2Card.dueDate) : new Date(),
            lastReview: sm2Card.lastReview ? new Date(sm2Card.lastReview) : null,
            reps: sm2Card.repetitions || 0,
            lapses: sm2Card.lapses || 0,
            elapsedDays: 0,
            scheduledDays: interval
        };
    }
}

// Export singleton instance
export const fsrs = new FSRSEngine();
export default fsrs;
