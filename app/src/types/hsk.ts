export type HSKLevel = 1 | 2 | 3 | 4 | 5 | 6;

export interface HSKWord {
  id: string;
  level: HSKLevel;
  chinese: string;
  pinyin: string;
  english: string;
  partOfSpeech?: string;
  examples?: { chinese: string; pinyin: string; english: string }[];
  audio?: string;
}

export interface HSKProgress {
  level: HSKLevel;
  wordsLearned: number;
  totalWords: number;
  quizzesTaken: number;
  averageScore: number;
  lastStudied: string;
  masteredWords: string[];
  practicingWords: string[];
}

export interface HSKQuiz {
  id: string;
  level: HSKLevel;
  title: string;
  questions: HSKQuizQuestion[];
  timeLimit?: number;
  passingScore: number;
}

export interface HSKQuizQuestion {
  id: string;
  type: 'multiple_choice' | 'pinyin' | 'translation' | 'fill_blank';
  chinese?: string;
  pinyin?: string;
  english?: string;
  options?: string[];
  correctAnswer: string;
  points: number;
}

export interface HSKQuizResult {
  quizId: string;
  score: number;
  totalPoints: number;
  correctAnswers: number;
  totalQuestions: number;
  timeSpent: number;
  completedAt: string;
  answers: { questionId: string; answer: string; correct: boolean }[];
  questionTypes: QuizQuestionType[];
  wordRange: { start: number; end: number };
}

export type QuizQuestionType = 
  | 'pinyin-to-english'
  | 'english-to-chinese'
  | 'chinese-to-english'
  | 'pinyin-to-chinese'
  | 'english-to-pinyin'
  | 'chinese-to-pinyin';

export interface QuizSettings {
  questionTypes: QuizQuestionType[];
  questionCount: number;
  timeLimit: number | null;
  wordRange: { start: number; end: number };
  randomize: boolean;
}

export const quizQuestionTypeLabels: Record<QuizQuestionType, string> = {
  'pinyin-to-english': 'Pinyin → English',
  'english-to-chinese': 'English → Chinese',
  'chinese-to-english': 'Chinese → English',
  'pinyin-to-chinese': 'Pinyin → Chinese',
  'english-to-pinyin': 'English → Pinyin',
  'chinese-to-pinyin': 'Chinese → Pinyin',
};

export interface StudyResource {
  id: string;
  title: string;
  description: string;
  type: 'video' | 'pdf' | 'audio' | 'link' | 'exercise';
  level: HSKLevel;
  url: string;
  duration?: string;
  author?: string;
  tags: string[];
  rating: number;
  downloads?: number;
  createdAt: string;
}

export interface LanguagePartner {
  id: string;
  name: string;
  avatar?: string;
  nativeLanguage: string;
  targetLanguage: string;
  level: HSKLevel;
  interests: string[];
  availability: string[];
  bio?: string;
  rating: number;
  sessionsCompleted: number;
}

export const hskLevelLabels: Record<HSKLevel, string> = {
  1: 'HSK 1 (Beginner)',
  2: 'HSK 2 (Elementary)',
  3: 'HSK 3 (Intermediate)',
  4: 'HSK 4 (Upper-Intermediate)',
  5: 'HSK 5 (Advanced)',
  6: 'HSK 6 (Proficient)',
};

export const hskWordCounts: Record<HSKLevel, number> = {
  1: 150,
  2: 300,
  3: 600,
  4: 1200,
  5: 2500,
  6: 5000,
};

export interface HSKGrammarSentence {
  id: number;
  level: number;
  sentenceWithSpaces: string;
  sentenceClean: string;
  pinyin: string;
  english: string;
  audioFile: string;
  grammarPattern: string;
  tags: string[];
  topic: string;
  sourceUrl: string;
}

export interface GrammarTopic {
  name: string;
  count: number;
}

export interface GrammarDataResponse {
  sentences: HSKGrammarSentence[];
  total: number;
  page: number;
  totalPages: number;
}

export interface GrammarStats {
  level: number;
  totalSentences: number;
  topics: number;
}

export interface GrammarProgress {
  level: number;
  sentencesLearned: number;
  totalSentences: number;
  practicedSentences: number[];
  masteredSentences: number[];
  lastStudied: string | null;
  studyStreak: number;
  timeSpentMinutes: number;
  weakSentences: number[];
}

export interface GrammarQuizQuestion {
  id: number;
  type: 'fill_blank' | 'pattern_choice' | 'match_english' | 'listen_select' | 'rearrange';
  sentence: HSKGrammarSentence;
  options?: string[];
  correctAnswer: string;
  audioFile?: string;
}

export interface GrammarQuizResult {
  score: number;
  totalQuestions: number;
  correctAnswers: number;
  timeSpent: number;
  completedAt: string;
  answers: { questionId: number; answer: string; correct: boolean }[];
}

export interface GrammarPattern {
  pattern: string;
  description: string;
  examples: HSKGrammarSentence[];
  count: number;
  relatedPatterns: string[];
}
