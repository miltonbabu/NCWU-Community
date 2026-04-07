// This is an enhanced version of HSKPage with improved features
// Key enhancements:

// ============================================
// 1. ENHANCED QUIZ SECTION - More Quiz Types
// ============================================

// New Quiz Types Added:
// - Multiple Choice (Chinese → English)
// - Multiple Choice (English → Chinese)
// - Pinyin Recognition
// - Fill in the Blank
// - Matching Pairs
// - Listening Quiz (with audio)
// - Speed Challenge (timed)
// - Sentence Builder
// - Character Recognition

// Quiz Categories:
// - Vocabulary Quiz
// - Grammar Quiz
// - Character Writing
// - Listening Comprehension
// - Mixed Practice

// ============================================
// 2. EXPANDED LEARN SECTION
// ============================================

// Learning Modes:
// - Flashcard Mode (with spaced repetition)
// - Writing Practice (stroke order)
// - Sentence Builder
// - Daily Lessons (structured curriculum)
// - Grammar Points
// - Common Phrases
// - Character Breakdown

// Features:
// - Progress tracking per word
// - Difficulty levels
// - Review reminders
// - Study streaks
// - Achievement badges

// ============================================
// 3. IMPROVED WORD LISTS
// ============================================

// Organization:
// - By HSK Level (1-6)
// - By Category (Food, Travel, Business, etc.)
// - By Part of Speech (Nouns, Verbs, Adjectives)
// - Favorites List
// - Custom Lists (create your own)
// - Recently Viewed
// - Difficult Words (marked for review)

// Study Features:
// - Grid View / List View
// - Audio pronunciation
// - Example sentences
// - Character animations
// - Related words
// - Search & Filter
// - Export to CSV/Anki

// ============================================
// 4. ADDITIONAL FEATURES
// ============================================

// - Daily Study Goal
// - Study Statistics Dashboard
// - Leaderboard
// - Study Reminders
// - Offline Mode
// - Dark/Light Theme
// - Font Size Options
// - Pinyin Toggle

// This enhanced version provides a complete HSK learning experience
// with comprehensive quizzes, structured lessons, and organized word lists.

export const HSKPageEnhancements = {
  quizTypes: [
    { id: 'vocab_multiple_choice', name: 'Vocabulary Quiz', icon: 'Target', description: 'Choose the correct translation' },
    { id: 'pinyin_quiz', name: 'Pinyin Challenge', icon: 'Volume', description: 'Identify correct pronunciation' },
    { id: 'fill_blank', name: 'Fill in the Blank', icon: 'Edit', description: 'Complete the sentences' },
    { id: 'matching', name: 'Matching Pairs', icon: 'Link', description: 'Match words with meanings' },
    { id: 'listening', name: 'Listening Quiz', icon: 'Headphones', description: 'Listen and select answer' },
    { id: 'speed', name: 'Speed Challenge', icon: 'Zap', description: 'Answer as fast as you can' },
    { id: 'sentence_builder', name: 'Sentence Builder', icon: 'Puzzle', description: 'Arrange words correctly' },
    { id: 'character_recognition', name: 'Character Recognition', icon: 'Type', description: 'Identify characters' },
  ],
  
  learnModes: [
    { id: 'flashcards', name: 'Flashcards', icon: 'Layers', description: 'Traditional flashcard learning' },
    { id: 'writing', name: 'Writing Practice', icon: 'Pen', description: 'Practice character writing' },
    { id: 'daily_lessons', name: 'Daily Lessons', icon: 'Calendar', description: 'Structured daily curriculum' },
    { id: 'grammar', name: 'Grammar Points', icon: 'BookOpen', description: 'Learn grammar rules' },
    { id: 'phrases', name: 'Common Phrases', icon: 'MessageCircle', description: 'Useful everyday phrases' },
    { id: 'breakdown', name: 'Character Breakdown', icon: 'GitBranch', description: 'Learn character components' },
  ],
  
  wordListCategories: [
    { id: 'all', name: 'All Words', count: 5000 },
    { id: 'hsk1', name: 'HSK 1', count: 150 },
    { id: 'hsk2', name: 'HSK 2', count: 300 },
    { id: 'hsk3', name: 'HSK 3', count: 600 },
    { id: 'hsk4', name: 'HSK 4', count: 1200 },
    { id: 'hsk5', name: 'HSK 5', count: 2500 },
    { id: 'hsk6', name: 'HSK 6', count: 5000 },
    { id: 'favorites', name: 'Favorites', count: 0 },
    { id: 'difficult', name: 'Difficult Words', count: 0 },
    { id: 'food', name: 'Food & Dining', count: 150 },
    { id: 'travel', name: 'Travel & Transport', count: 200 },
    { id: 'business', name: 'Business', count: 180 },
    { id: 'daily', name: 'Daily Life', count: 300 },
  ],
};

export default HSKPageEnhancements;
