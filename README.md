# PortuLingo - Learn European Portuguese 🇵🇹

A professional, AI-powered language learning platform for European Portuguese, featuring real-time adaptive learning, comprehensive pronunciation training, and a modern Duolingo-inspired interface.

**Current version:** 2.0.0 (Major Restructure)  
**Status:** Active Development

---

## 🎯 Vision

PortuLingo transforms language learning by combining:

- **Pedagogically-ordered lessons** - Building blocks first (pronouns, connectors, articles) before phrases
- **Real-time AI adaptation** - Learns from every interaction to personalize your experience
- **Comprehensive pronunciation training** - IPA guides, phoneme analysis, and speech recognition
- **Modern, accessible UI** - Desktop sidebar + mobile bottom navigation following 2025 best practices
- **Graceful degradation** - Core learning works even when AI/voice services are offline

---

## 🏗️ Architecture Overview

We're building a **modular, maintainable codebase** with clear separation of concerns:

```
src/
├── components/     # Reusable UI components (Modal, Toast, Cards)
├── services/       # Business logic (Auth, AI, Voice, Lessons)
├── pages/          # Page-level components (Home, Learn, Practice, Profile)
├── stores/         # State management
├── data/           # Lesson content (JSON + CSV format)
├── styles/         # Modular CSS (variables, components, animations)
├── config/         # App configuration
└── utils/          # Utility functions
```

**Key Principles:**
- Maximum 500 lines per file
- Single responsibility per module
- Comprehensive test coverage for all components
- Real-time logging for AI pipeline consumption

---

## ✨ Core Features

### 📚 Learning System
- **Building Blocks First** - Pronouns, connectors, articles before greetings
- **Rich Word Cards** - IPA, pronunciation guides, etymology, memory tricks, examples, grammar notes, cultural insights
- **Multiple Challenge Types** - Multiple choice, fill-in-blank, translation, pronunciation
- **SRS (Spaced Repetition)** - Bucketed review system for optimal retention
- **Personal Vault** - Track all learned words with search and filtering

### 🤖 AI-Powered Features
- **Local AI Tutor** - Ollama-powered (no cloud API keys required)
- **Real-Time Tips** - Dynamic AI tips based on your mistake patterns
- **Custom Lessons** - AI generates personalized mini-lessons after 5+ failures
- **Pronunciation Feedback** - Phoneme-specific guidance for Portuguese sounds
- **Skill Gap Detection** - Auto-identifies trouble areas (nasals, gender, ser/estar)

### 🗣️ Voice & Pronunciation
- **EU-PT Only** - European Portuguese voices exclusively (no Brazilian)
- **System + Bundled Voices** - Uses device voices when available, Piper TTS fallback
- **Speed Control** - Adjustable playback speed (0.5x - 2.0x)
- **Speech Recognition** - Practice pronunciation with instant feedback
- **Phoneme Analysis** - Detects nasals, sibilants, digraphs, rhotics, stress patterns

### 👤 User System
- **Hearts System** - 5 lives, 30-minute regeneration
- **XP & Streaks** - Gamification to maintain motivation
- **Admin Mode** - User management, data adjustment, unlimited hearts
- **Progress Tracking** - Per-lesson accuracy, time-on-task, weak word tracking

### 🖥️ Modern UI
- **Page-Based Navigation** - Home, Learn, Practice, Profile
- **Desktop** - Collapsible left sidebar
- **Mobile** - Bottom tab bar + hamburger drawer
- **Dark/Light Mode** - Persisted theme preference
- **Accordion Panels** - Lesson options with single-open behavior

---

## 🚀 Development Phases

| Phase | Description | Status |
|-------|-------------|--------|
| **Phase 1** | Foundation & File Structure | ✅ Complete |
| **Phase 1B** | Service Integration & Cleanup | 🔄 In Progress |
| **Phase 2** | Lesson Reordering (Building Blocks First) | ⏳ Planned |
| **Phase 3** | Navigation Redesign | ⏳ Planned |
| **Phase 4** | Lesson Layout & Options Panel | ⏳ Planned |
| **Phase 5** | Real-Time AI Pipeline | ⏳ Planned |
| **Phase 6** | AI Governance Dashboard | ⏳ Planned |
| **Phase 7** | Authentication System | ⏳ Planned |
| **Phase 8** | Voice System Fixes | ⏳ Planned |
| **Phase 9** | Monitoring & Health Checks | ⏳ Planned |
| **Phase 10** | UI Polish & Animations | ⏳ Planned |
| **Phase 11** | Practice & Flashcards | ⏳ Planned |
| **Phase 12** | Graceful Degradation | ⏳ Planned |

See [IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md) for detailed task breakdowns.

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | Vanilla JavaScript (ES Modules), HTML5, CSS3 |
| **Testing** | Playwright (E2E), Unit tests |
| **Linting** | ESLint |
| **AI** | Ollama (local LLM, no API keys) |
| **TTS** | Piper EU-PT, System voices, Edge-TTS |
| **Hosting** | GitHub Pages / Netlify / Vercel |

---

## 📦 Installation & Setup

### Prerequisites
- Node.js 18+
- Git

### Quick Start

```bash
# Clone the repository
git clone https://github.com/dstorey87/learning-portuguese.git
cd learning-portuguese

# Install dependencies
npm install

# Start local development server
npm run serve

# Run tests
npm test
```

### Optional: AI Features

For AI tutor functionality, install Ollama:

```bash
# Install Ollama (see https://ollama.ai)
# Then pull the recommended model:
ollama pull qwen2.5:7b
```

### Optional: Neural TTS Server

For high-quality neural voices:

```bash
cd tts-server
pip install -r requirements.txt
python server.py
```

---

## 📂 Project Structure

```
learning_portuguese/
├── index.html              # App shell (minimal HTML)
├── package.json            # Dependencies & scripts
├── playwright.config.js    # E2E test configuration
├── server.js               # Development server
│
├── src/                    # All source code
│   ├── components/         # Reusable UI components
│   │   ├── common/         # Modal, Toast, ProgressChart
│   │   ├── lesson/         # LessonCard, WordCard, ChallengeRenderer
│   │   └── navigation/     # Sidebar, TopBar, Breadcrumb
│   │
│   ├── services/           # Business logic
│   │   ├── AIService.js    # Ollama integration
│   │   ├── AuthService.js  # User authentication
│   │   ├── VoiceService.js # Voice playback
│   │   ├── TTSService.js   # Text-to-speech
│   │   ├── LessonService.js# Lesson management
│   │   └── Logger.js       # Event logging for AI
│   │
│   ├── data/               # Lesson content
│   ├── pages/              # Page components
│   ├── stores/             # State management
│   ├── styles/             # Modular CSS
│   └── config/             # Configuration
│
├── tests/                  # Test files
│   ├── e2e/                # End-to-end tests
│   ├── unit/               # Unit tests
│   └── smoke.spec.js       # Smoke tests
│
├── docs/                   # Documentation
└── tts-server/             # Neural TTS backend
```

---

## 🧪 Testing

```bash
# Run all tests
npm test

# Run specific test file
npx playwright test tests/smoke.spec.js

# Run tests with UI
npx playwright test --ui
```

### Test Coverage Goals
- **Unit Tests**: All services and utilities
- **Integration Tests**: Module interactions
- **E2E Tests**: Full user journeys
- **Component Registry**: Health checks for monitoring dashboard

---

## 🤝 Contributing

### Mandatory Workflow

1. **Create a feature branch** (never work on main)
   ```bash
   git checkout -b feature/TASK-ID-description
   ```

2. **Implement changes** with tests

3. **Run lint and tests**
   ```bash
   npm test
   ```

4. **Commit with task ID**
   ```bash
   git commit -m "[TASK-ID] Description of change"
   ```

5. **Merge to main immediately** after tests pass

6. **Delete the feature branch**

See [.github/copilot-instructions.md](.github/copilot-instructions.md) for detailed contribution guidelines.

---

## 🎓 Teaching Methodology

### Lesson Order (Pedagogically Correct)

1. **Building Blocks** - Language fundamentals first
   - Personal Pronouns (eu, tu, ele/ela, nós, vocês, eles/elas)
   - Articles (o, a, os, as, um, uma)
   - Connectors (e, ou, mas, porque, quando)
   - Prepositions (de, em, para, com, por)

2. **Essential Communication**
   - Greetings (olá, bom dia, boa tarde)
   - Polite Phrases (por favor, obrigado/a, desculpe)
   - Basic Questions (o quê, quem, onde, quando)

3. **Daily Topics**
   - Numbers, Colors, Days, Months
   - Family, Food, Travel
   - Work, Health, Shopping

### Why Building Blocks First?

Traditional apps teach phrases like "Olá, como está?" before teaching:
- What "está" means (3rd person of estar)
- Why "como" vs "quanto" 
- The difference between tu/você formality

Our approach ensures **understanding**, not just memorization.

---

## 📊 Real-Time AI Pipeline

Every user interaction is logged and streamed to the AI for personalization:

| Event | Data Captured | AI Use |
|-------|---------------|--------|
| `answer_correct` | wordId, timing | Track mastery |
| `answer_incorrect` | wordId, userAnswer, correctAnswer | Identify weaknesses |
| `pronunciation_score` | wordId, phonemes, score | Pronunciation coaching |
| `lesson_complete` | duration, accuracy, mistakes | Recommend next steps |
| `word_skipped` | wordId | Detect frustration |

The AI uses this data to:
- Generate personalized tips in real-time
- Create custom mini-lessons for struggling concepts
- Adjust difficulty dynamically
- Provide phoneme-specific pronunciation guidance

---

## 🔊 Voice System

### Voice Priority
1. **System EU-PT voices** - Best quality, no download
2. **Piper bundled voice** - Downloaded on-demand (~50-120MB)
3. **Text-only fallback** - When no voice available

### Supported System Voices
- **iOS/macOS**: Siri "Joana"/"Inês"
- **Android**: Google/Samsung TTS Portuguese (Portugal)
- **Windows 11**: Natural voices "Duarte"/"Fernanda"

### Neural TTS Server
For the highest quality, run the included FastAPI server:
- Uses Edge-TTS with 6 Microsoft neural voices
- No API keys required
- Runs locally on your machine

---

## 📱 UI Patterns

### Desktop (≥768px)
- Left sidebar navigation (collapsible)
- Wide content area
- Lesson options in right panel

### Mobile (<768px)
- Bottom tab bar (Home, Learn, Practice, Profile)
- Hamburger drawer for additional options
- Lesson options in bottom sheet

---

## 🔐 Authentication & Roles

| Role | Capabilities |
|------|-------------|
| **Guest** | Limited lesson access, no progress saving |
| **User** | Full access, progress tracking, hearts system |
| **Admin** | User management, data editing, unlimited hearts |

Admin access: Triple-click logo → Enter password

---

## 📈 Roadmap

- [x] Core lesson system
- [x] Voice playback with EU-PT voices
- [x] AI tutor integration
- [x] Hearts/XP/Streak gamification
- [x] Modular codebase architecture
- [ ] Building blocks lessons (pronouns, articles)
- [ ] Real-time AI pipeline
- [ ] Monitoring dashboard
- [ ] Graceful degradation
- [ ] Payment integration (Premium tier)
- [ ] Mobile app version

---

## 🌐 Deployment

### GitHub Pages (Recommended)
1. Push to GitHub repository
2. Settings → Pages → Select main branch
3. Site live at `https://username.github.io/learning-portuguese`

### Netlify / Vercel
1. Connect GitHub repository
2. Auto-deploy on every push

---

## 📄 License

Free to use and modify.

---

## 🙏 Acknowledgments

- Voice models: Piper TTS, Microsoft Edge-TTS
- AI: Ollama project
- Inspiration: Duolingo's gamification approach
- Testing: Playwright team

---

**Built with ❤️ for Portuguese learners**
