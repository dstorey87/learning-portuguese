# PortuLingo - Learn European Portuguese 🇵🇹

A free, interactive website for learning European Portuguese word-by-word, inspired by Duolingo.

Current version: **0.1.0**

## Features

✅ **100% Free Hosting** - Designed for GitHub Pages, Netlify, or Vercel
✅ **Word-by-Word Learning** - Focus on memorizing individual words
✅ **Audio Pronunciation** - Hover over words to hear European Portuguese pronunciation
✅ **Personal Vault** - Track all words you've learned
✅ **Quick Review Quiz** - Drill yourself on learned words
✅ **User Dashboard** - Monitor progress and manage settings
✅ **Completed Lesson Badges** - See which lessons you’ve finished
✅ **Versioned Build** - Footer badge shows current app version
✅ **Premium Paywall** - Unlock advanced features (placeholder for payment integration)
✅ **Gender-Switching Voice** - Choose male or female voice for audio
✅ **Progress Tracking** - Streak counter and completion percentage
✅ **Responsive Design** - Works on desktop and mobile

## Free Hosting Options

### GitHub Pages (Recommended)
1. Create a GitHub account
2. Create a new repository named `learning-portuguese`
3. Upload all files (index.html, styles.css, app.js)
4. Go to Settings → Pages
5. Select main branch as source
6. Your site will be live at `https://yourusername.github.io/learning-portuguese`

### Netlify
1. Sign up at netlify.com
2. Drag and drop the folder
3. Get instant deployment

### Vercel
1. Sign up at vercel.com
2. Import your GitHub repository
3. Auto-deploy on every update

## Technology Stack

- **Pure HTML/CSS/JavaScript** - No frameworks needed
- **Web Speech API** - For text-to-speech pronunciation
- **LocalStorage** - For saving user progress
- **Responsive CSS Grid** - Modern layout
- **Google Fonts** - Poppins typography

## Future Enhancements

- [ ] AI Chat Integration for conversation practice
- [ ] Pronunciation feedback using speech recognition
- [ ] Intermediate and advanced lessons
- [ ] Payment gateway integration (Stripe/PayPal)
- [ ] Mobile app version
- [ ] Spaced repetition algorithm
- [ ] Community features
- [ ] Achievement system
- [ ] Smarter review quizzes (multiple choice + spaced repetition)

## Getting Started

Simply open `index.html` in a web browser, or deploy to any of the free hosting platforms above.

## Manual End-to-End Test Plan (v0.1.0)

- Load site, ensure version pill shows v0.1.0.
- Start Basic Greetings lesson, complete it, confirm streak increments and vault shows learned words.
- Open dashboard: progress updates, account status is Free Plan.
- Run Quick Review Quiz: complete 3-5 questions, verify scoring and correct/incorrect states.
- Attempt Travel Essentials lesson (id > 5) as free user: paywall appears.
- Click Subscribe in paywall: premium unlocks, paywall hides, Travel Essentials becomes accessible.
- Re-open dashboard: progress reflects unlocked lessons and premium status text.
- Use Reset Progress: vault clears, streak resets, progress returns to 0%.

## Browser Compatibility

- Chrome/Edge: Full support
- Firefox: Full support
- Safari: Full support (may require user interaction for audio)

---

**License:** Free to use and modify
**Created:** 2025
