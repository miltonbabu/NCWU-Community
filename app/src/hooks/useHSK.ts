import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { hskApi } from "@/lib/api";
import type {
  HSKLevel,
  HSKProgress,
  HSKQuiz,
  HSKQuizResult,
} from "@/types/hsk";

export type HSKQuizQuestion = {
  id: string;
  word_id?: number;
  word?: string;
  pinyin?: string;
  english?: string;
  question?: string;
  options?: string[];
  correct_answer?: number;
  chinese?: string;
  type?: "multiple_choice" | "pinyin" | "translation" | "fill_blank";
  correctAnswer?: string;
  points?: number;
};

export interface HSKQuiz {
  id: string;
  level: HSKLevel;
  title?: string;
  questions: HSKQuizQuestion[];
  timeLimit?: number;
  passingScore?: number;
}

export interface HSKQuizResult {
  id: string;
  quiz_id: string;
  score: number;
  total_questions: number;
  correct_answers: number;
  completed_at: string;
}

export interface WordList {
  id?: string;
  name: string;
  level: HSKLevel;
  words: string[];
  completedAt?: string;
}

function getUserStorageKey(baseKey: string): string {
  const userId = localStorage.getItem("auth_user")
    ? JSON.parse(localStorage.getItem("auth_user")!).id
    : "guest";
  return `${baseKey}_${userId}`;
}

const PROGRESS_STORAGE_KEY = "hsk_progress";
const QUIZ_RESULTS_KEY = "hsk_quiz_results";
const BOOKMARKS_KEY = "hsk_bookmarks";
const FAVORITE_PARTNERS_KEY = "favorite_partners";
const WORD_LIST_HISTORY_KEY = "word_list_history";

export function useHSKProgress() {
  const { isAuthenticated, user } = useAuth();
  const [progress, setProgress] = useState<Record<number, HSKProgress>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadProgress = useCallback(async () => {
    if (isAuthenticated && user) {
      try {
        setLoading(true);
        setError(null);
        const response = await hskApi.getProgress();
        if (response.success && response.data) {
          const progressMap: Record<number, HSKProgress> = {};
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (response.data as any[]).forEach((item: Record<string, unknown>) => {
            const level = item.level as HSKLevel;
            progressMap[level] = {
              level: level,
              wordsLearned: item.words_learned as number,
              totalWords: item.total_words as number,
              quizzesTaken: item.quizzes_taken as number,
              averageScore: item.average_score as number,
              lastStudied: item.last_studied as string,
              masteredWords: JSON.parse(
                (item.mastered_words as string) || "[]",
              ),
              practicingWords: JSON.parse(
                (item.practicing_words as string) || "[]",
              ),
            };
          });
          setProgress(progressMap);
        }
      } catch (err) {
        setError("Failed to load progress");
        console.error("Error loading HSK progress:", err);
      } finally {
        setLoading(false);
      }
    } else {
      // Fallback to localStorage for guests
      const storageKey = getUserStorageKey(PROGRESS_STORAGE_KEY);
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        try {
          setProgress(JSON.parse(stored));
        } catch {
          setProgress({});
        }
      }
      setLoading(false);
    }
  }, [isAuthenticated, user]);

  useEffect(() => {
    loadProgress();
  }, [loadProgress]);

  const getLevelProgress = useCallback(
    (level: HSKLevel): HSKProgress => {
      return (
        progress[level] || {
          level,
          wordsLearned: 0,
          totalWords: 150 * level,
          quizzesTaken: 0,
          averageScore: 0,
          lastStudied: "",
          masteredWords: [],
          practicingWords: [],
        }
      );
    },
    [progress],
  );

  const markWordLearned = useCallback(
    async (level: HSKLevel, wordId: string, mastered: boolean = false) => {
      const current = getLevelProgress(level);
      const isAlreadyLearned =
        current.practicingWords.includes(wordId) ||
        current.masteredWords.includes(wordId);

      let newProgress: HSKProgress;
      if (mastered) {
        newProgress = {
          ...current,
          wordsLearned: isAlreadyLearned
            ? current.wordsLearned
            : current.wordsLearned + 1,
          lastStudied: new Date().toISOString(),
          masteredWords: [
            ...current.masteredWords.filter((id) => id !== wordId),
            wordId,
          ],
          practicingWords: current.practicingWords.filter(
            (id) => id !== wordId,
          ),
        };
      } else {
        if (current.practicingWords.includes(wordId)) return;
        newProgress = {
          ...current,
          wordsLearned: isAlreadyLearned
            ? current.wordsLearned
            : current.wordsLearned + 1,
          lastStudied: new Date().toISOString(),
          practicingWords: [...current.practicingWords, wordId],
        };
      }

      setProgress((prev) => ({
        ...prev,
        [level]: newProgress,
      }));

      // Save to API if authenticated
      if (isAuthenticated && user) {
        try {
          await hskApi.updateProgress({
            level: newProgress.level,
            words_learned: newProgress.wordsLearned,
            total_words: newProgress.totalWords,
            quizzes_taken: newProgress.quizzesTaken,
            average_score: newProgress.averageScore,
            last_studied: newProgress.lastStudied,
            mastered_words: newProgress.masteredWords,
            practicing_words: newProgress.practicingWords,
          });
        } catch (err) {
          console.error("Error updating HSK progress:", err);
        }
      } else {
        // Save to localStorage for guests
        const storageKey = getUserStorageKey(PROGRESS_STORAGE_KEY);
        localStorage.setItem(
          storageKey,
          JSON.stringify({
            ...progress,
            [level]: newProgress,
          }),
        );
      }
    },
    [getLevelProgress, progress, isAuthenticated, user],
  );

  const updateQuizStats = useCallback(
    async (level: HSKLevel, score: number) => {
      const current = getLevelProgress(level);
      const newQuizzesTaken = current.quizzesTaken + 1;
      const newAverage =
        (current.averageScore * current.quizzesTaken + score) / newQuizzesTaken;

      const newProgress = {
        ...current,
        quizzesTaken: newQuizzesTaken,
        averageScore: Math.round(newAverage * 10) / 10,
        lastStudied: new Date().toISOString(),
      };

      setProgress((prev) => ({
        ...prev,
        [level]: newProgress,
      }));

      // Save to API if authenticated
      if (isAuthenticated && user) {
        try {
          await hskApi.updateProgress({
            level: newProgress.level,
            words_learned: newProgress.wordsLearned,
            total_words: newProgress.totalWords,
            quizzes_taken: newProgress.quizzesTaken,
            average_score: newProgress.averageScore,
            last_studied: newProgress.lastStudied,
            mastered_words: newProgress.masteredWords,
            practicing_words: newProgress.practicingWords,
          });
        } catch (err) {
          console.error("Error updating quiz stats:", err);
        }
      } else {
        // Save to localStorage for guests
        const storageKey = getUserStorageKey(PROGRESS_STORAGE_KEY);
        localStorage.setItem(
          storageKey,
          JSON.stringify({
            ...progress,
            [level]: newProgress,
          }),
        );
      }
    },
    [getLevelProgress, progress, isAuthenticated, user],
  );

  const getOverallProgress = useCallback(() => {
    const levels = Object.keys(progress).map(Number) as HSKLevel[];
    const totalWordsLearned = levels.reduce(
      (sum, level) => sum + (progress[level]?.wordsLearned || 0),
      0,
    );
    const totalQuizzes = levels.reduce(
      (sum, level) => sum + (progress[level]?.quizzesTaken || 0),
      0,
    );
    const avgScores = levels
      .filter((l) => progress[l]?.quizzesTaken > 0)
      .map((l) => progress[l].averageScore);
    const overallAverage =
      avgScores.length > 0
        ? avgScores.reduce((a, b) => a + b, 0) / avgScores.length
        : 0;

    return {
      totalWordsLearned,
      totalQuizzes,
      overallAverage: Math.round(overallAverage * 10) / 10,
      levelsCompleted: levels.filter((l) => {
        const p = progress[l];
        return p && p.masteredWords.length >= p.totalWords * 0.8;
      }).length,
    };
  }, [progress]);

  return {
    progress,
    loading,
    error,
    getLevelProgress,
    markWordLearned,
    updateQuizStats,
    getOverallProgress,
    refreshProgress: loadProgress,
  };
}

export function useHSKQuiz() {
  const { isAuthenticated, user } = useAuth();
  const [currentQuiz, setCurrentQuiz] = useState<HSKQuiz | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [startTime, setStartTime] = useState<number>(0);
  const [quizResults, setQuizResults] = useState<HSKQuizResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadQuizResults = useCallback(async () => {
    if (isAuthenticated && user) {
      try {
        setLoading(true);
        setError(null);
        const response = await hskApi.getQuizResults();
        if (response.success && response.data) {
          setQuizResults(
            (response.data as Record<string, unknown>[]).map((item) => ({
              quizId: item.quiz_id as string,
              score: item.score as number,
              totalPoints: item.total_points as number,
              correctAnswers: item.correct_answers as number,
              totalQuestions: item.total_questions as number,
              timeSpent: item.time_spent as number,
              completedAt: item.completed_at as string,
              answers: JSON.parse((item.answers as string) || "[]"),
            })),
          );
        }
      } catch (err) {
        setError("Failed to load quiz results");
        console.error("Error loading quiz results:", err);
      } finally {
        setLoading(false);
      }
    } else {
      // Fallback to localStorage for guests
      const storageKey = getUserStorageKey(QUIZ_RESULTS_KEY);
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        try {
          setQuizResults(JSON.parse(stored));
        } catch {
          setQuizResults([]);
        }
      }
      setLoading(false);
    }
  }, [isAuthenticated, user]);

  useEffect(() => {
    loadQuizResults();
  }, [loadQuizResults]);

  const startQuiz = useCallback((quiz: HSKQuiz) => {
    setCurrentQuiz(quiz);
    setCurrentQuestionIndex(0);
    setAnswers({});
    setStartTime(Date.now());
  }, []);

  const answerQuestion = useCallback((questionId: string, answer: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: answer }));
  }, []);

  const nextQuestion = useCallback(() => {
    if (
      currentQuiz &&
      currentQuestionIndex < currentQuiz.questions.length - 1
    ) {
      setCurrentQuestionIndex((prev) => prev + 1);
    }
  }, [currentQuiz, currentQuestionIndex]);

  const previousQuestion = useCallback(() => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1);
    }
  }, [currentQuestionIndex]);

  const submitQuiz = useCallback(async () => {
    if (!currentQuiz) return null;

    const timeSpent = Math.round((Date.now() - startTime) / 1000);
    let correctAnswers = 0;
    let totalPoints = 0;

    const answerDetails = currentQuiz.questions.map((q) => {
      const userAnswer = answers[q.id] || "";
      let correctAnswer = "";
      if (q.correct_answer !== undefined && q.options[q.correct_answer]) {
        correctAnswer = q.options[q.correct_answer];
      } else if (q.correctAnswer) {
        correctAnswer = q.correctAnswer;
      }
      const correct = userAnswer.toLowerCase() === correctAnswer.toLowerCase();
      if (correct) {
        correctAnswers++;
        totalPoints += 1;
      }
      return {
        questionId: q.id,
        answer: userAnswer,
        correct,
      };
    });

    const result = {
      quizId: currentQuiz.id,
      score: totalPoints,
      totalPoints: currentQuiz.questions.length,
      correctAnswers,
      totalQuestions: currentQuiz.questions.length,
      timeSpent,
      completedAt: new Date().toISOString(),
      answers: answerDetails,
      questionTypes: [],
      wordRange: { start: 0, end: currentQuiz.questions.length },
    };

    setQuizResults((prev) => [...prev, result]);
    setCurrentQuiz(null);

    // Save to API if authenticated
    if (isAuthenticated && user) {
      try {
        await hskApi.addQuizResult({
          quiz_id: result.quizId,
          score: result.score,
          total_points: result.totalPoints,
          correct_answers: result.correctAnswers,
          total_questions: result.totalQuestions,
          time_spent: result.timeSpent,
          completed_at: result.completedAt,
          answers: result.answers,
        });
      } catch (err) {
        console.error("Error saving quiz result:", err);
      }
    } else {
      // Save to localStorage for guests
      const storageKey = getUserStorageKey(QUIZ_RESULTS_KEY);
      localStorage.setItem(
        storageKey,
        JSON.stringify([...quizResults, result]),
      );
    }

    return result;
  }, [currentQuiz, answers, startTime, quizResults, isAuthenticated, user]);

  const getQuizHistory = useCallback(
    (level?: HSKLevel) => {
      if (level) {
        return quizResults.filter((r) => r.quizId.startsWith(`hsk${level}-`));
      }
      return quizResults;
    },
    [quizResults],
  );

  return {
    currentQuiz,
    currentQuestionIndex,
    answers,
    quizResults,
    loading,
    error,
    startQuiz,
    answerQuestion,
    nextQuestion,
    previousQuestion,
    submitQuiz,
    getQuizHistory,
    refreshQuizResults: loadQuizResults,
    isLastQuestion: currentQuiz
      ? currentQuestionIndex === currentQuiz.questions.length - 1
      : false,
    isFirstQuestion: currentQuestionIndex === 0,
  };
}

export function useStudyResources() {
  const { isAuthenticated, user } = useAuth();
  const [bookmarkedResources, setBookmarkedResources] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadBookmarks = useCallback(async () => {
    if (isAuthenticated && user) {
      try {
        setLoading(true);
        setError(null);
        const response = await hskApi.getBookmarks();
        if (response.success && response.data) {
          setBookmarkedResources(response.data as string[]);
        }
      } catch (err) {
        setError("Failed to load bookmarks");
        console.error("Error loading bookmarks:", err);
      } finally {
        setLoading(false);
      }
    } else {
      // Fallback to localStorage for guests
      const storageKey = getUserStorageKey(BOOKMARKS_KEY);
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        try {
          setBookmarkedResources(JSON.parse(stored));
        } catch {
          setBookmarkedResources([]);
        }
      }
      setLoading(false);
    }
  }, [isAuthenticated, user]);

  useEffect(() => {
    loadBookmarks();
  }, [loadBookmarks]);

  const toggleBookmark = useCallback(
    async (resourceId: string) => {
      const newBookmarks = bookmarkedResources.includes(resourceId)
        ? bookmarkedResources.filter((id) => id !== resourceId)
        : [...bookmarkedResources, resourceId];

      setBookmarkedResources(newBookmarks);

      // Save to API if authenticated
      if (isAuthenticated && user) {
        try {
          if (bookmarkedResources.includes(resourceId)) {
            await hskApi.removeBookmark(resourceId);
          } else {
            await hskApi.addBookmark(resourceId);
          }
        } catch (err) {
          console.error("Error toggling bookmark:", err);
        }
      } else {
        // Save to localStorage for guests
        const storageKey = getUserStorageKey(BOOKMARKS_KEY);
        localStorage.setItem(storageKey, JSON.stringify(newBookmarks));
      }
    },
    [bookmarkedResources, isAuthenticated, user],
  );

  const isBookmarked = useCallback(
    (resourceId: string) => {
      return bookmarkedResources.includes(resourceId);
    },
    [bookmarkedResources],
  );

  return {
    bookmarkedResources,
    loading,
    error,
    toggleBookmark,
    isBookmarked,
    refreshBookmarks: loadBookmarks,
  };
}

export function useLanguagePartners() {
  const { isAuthenticated, user } = useAuth();
  const [favoritePartners, setFavoritePartners] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadFavorites = useCallback(async () => {
    if (isAuthenticated && user) {
      try {
        setLoading(true);
        setError(null);
        const response = await hskApi.getFavoritePartners();
        if (response.success && response.data) {
          setFavoritePartners(response.data as string[]);
        }
      } catch (err) {
        setError("Failed to load favorite partners");
        console.error("Error loading favorite partners:", err);
      } finally {
        setLoading(false);
      }
    } else {
      // Fallback to localStorage for guests
      const storageKey = getUserStorageKey(FAVORITE_PARTNERS_KEY);
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        try {
          setFavoritePartners(JSON.parse(stored));
        } catch {
          setFavoritePartners([]);
        }
      }
      setLoading(false);
    }
  }, [isAuthenticated, user]);

  useEffect(() => {
    loadFavorites();
  }, [loadFavorites]);

  const toggleFavorite = useCallback(
    async (partnerId: string) => {
      const newFavorites = favoritePartners.includes(partnerId)
        ? favoritePartners.filter((id) => id !== partnerId)
        : [...favoritePartners, partnerId];

      setFavoritePartners(newFavorites);

      // Save to API if authenticated
      if (isAuthenticated && user) {
        try {
          if (favoritePartners.includes(partnerId)) {
            await hskApi.removeFavoritePartner(partnerId);
          } else {
            await hskApi.addFavoritePartner(partnerId);
          }
        } catch (err) {
          console.error("Error toggling favorite partner:", err);
        }
      } else {
        // Save to localStorage for guests
        const storageKey = getUserStorageKey(FAVORITE_PARTNERS_KEY);
        localStorage.setItem(storageKey, JSON.stringify(newFavorites));
      }
    },
    [favoritePartners, isAuthenticated, user],
  );

  const isFavorite = useCallback(
    (partnerId: string) => {
      return favoritePartners.includes(partnerId);
    },
    [favoritePartners],
  );

  return {
    favoritePartners,
    loading,
    error,
    toggleFavorite,
    isFavorite,
    refreshFavorites: loadFavorites,
  };
}

export function useWordListHistory() {
  const { isAuthenticated, user } = useAuth();
  const [wordListHistory, setWordListHistory] = useState<WordList[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadWordLists = useCallback(async () => {
    if (isAuthenticated && user) {
      try {
        setLoading(true);
        setError(null);
        const response = await hskApi.getWordLists();
        if (response.success && response.data) {
          setWordListHistory(response.data as WordList[]);
        }
      } catch (err) {
        setError("Failed to load word lists");
        console.error("Error loading word lists:", err);
      } finally {
        setLoading(false);
      }
    } else {
      // Fallback to localStorage for guests
      const storageKey = getUserStorageKey(WORD_LIST_HISTORY_KEY);
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        try {
          setWordListHistory(JSON.parse(stored));
        } catch {
          setWordListHistory([]);
        }
      }
      setLoading(false);
    }
  }, [isAuthenticated, user]);

  useEffect(() => {
    loadWordLists();
  }, [loadWordLists]);

  const addWordList = useCallback(
    async (list: WordList) => {
      setWordListHistory((prev) => [list, ...prev]);

      // Save to API if authenticated
      if (isAuthenticated && user) {
        try {
          await hskApi.addWordList({
            name: list.name,
            level: list.level,
            words: list.words,
            completed_at: list.completedAt,
          });
        } catch (err) {
          console.error("Error adding word list:", err);
        }
      } else {
        // Save to localStorage for guests
        const storageKey = getUserStorageKey(WORD_LIST_HISTORY_KEY);
        localStorage.setItem(
          storageKey,
          JSON.stringify([list, ...wordListHistory]),
        );
      }
    },
    [wordListHistory, isAuthenticated, user],
  );

  const removeWordList = useCallback(
    async (id: string) => {
      setWordListHistory((prev) => prev.filter((list) => list.id !== id));

      // Save to API if authenticated
      if (isAuthenticated && user) {
        try {
          await hskApi.removeWordList(id);
        } catch (err) {
          console.error("Error removing word list:", err);
        }
      } else {
        // Save to localStorage for guests
        const storageKey = getUserStorageKey(WORD_LIST_HISTORY_KEY);
        localStorage.setItem(
          storageKey,
          JSON.stringify(wordListHistory.filter((list) => list.id !== id)),
        );
      }
    },
    [wordListHistory, isAuthenticated, user],
  );

  const clearAllData = useCallback(async () => {
    if (isAuthenticated && user) {
      try {
        const response = await hskApi.clearData();
        if (response.success) {
          setWordListHistory([]);
          return true;
        }
        return false;
      } catch (err) {
        console.error("Error clearing HSK data:", err);
        return false;
      }
    } else {
      // Clear localStorage for guests
      const keys = [
        PROGRESS_STORAGE_KEY,
        QUIZ_RESULTS_KEY,
        BOOKMARKS_KEY,
        FAVORITE_PARTNERS_KEY,
        WORD_LIST_HISTORY_KEY,
      ];
      keys.forEach((key) => {
        const storageKey = getUserStorageKey(key);
        localStorage.removeItem(storageKey);
      });
      setWordListHistory([]);
      return true;
    }
  }, [isAuthenticated, user]);

  return {
    wordListHistory,
    setWordListHistory,
    loading,
    error,
    addWordList,
    removeWordList,
    clearAllData,
    refreshWordLists: loadWordLists,
  };
}
