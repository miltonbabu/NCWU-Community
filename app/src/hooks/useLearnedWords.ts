import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { hskApi } from "@/lib/api";
import type { HSKLevel } from "@/types/hsk";
import type { VocabularyWord } from "@/data/hsk1Vocabulary";

export interface LearnedWord {
  id: string;
  wordId: number;
  level: HSKLevel;
  chinese: string;
  pinyin: string;
  english: string;
  partOfSpeech: string;
  learnedAt: string;
}

const LEARNED_WORDS_KEY = "hsk_learned_words";

function getUserStorageKey(baseKey: string): string {
  const userId = localStorage.getItem("auth_user")
    ? JSON.parse(localStorage.getItem("auth_user")!).id
    : "guest";
  return `${baseKey}_${userId}`;
}

export function useLearnedWords() {
  const { isAuthenticated, user } = useAuth();
  const [learnedWords, setLearnedWords] = useState<LearnedWord[]>([]);
  const [loading, setLoading] = useState(true);

  const loadLearnedWords = useCallback(async () => {
    if (isAuthenticated && user) {
      try {
        setLoading(true);
        const response = await hskApi.getLearnedWords();
        if (response?.success && response.data) {
          const words = Array.isArray(response.data)
            ? response.data
            : (response.data as any).words || [];
          const formattedWords: LearnedWord[] = words.map((w: any) => ({
            id: w.id || `${w.level}-${w.word_id}`,
            wordId: w.word_id,
            level: w.level,
            chinese: w.word,
            pinyin: w.pinyin,
            english: w.english,
            partOfSpeech: w.pos || "",
            learnedAt: w.learned_at || new Date().toISOString(),
          }));
          setLearnedWords(formattedWords);
        } else {
        }
      } catch (err) {
        console.error("Error loading learned words:", err);
        const storageKey = getUserStorageKey(LEARNED_WORDS_KEY);
        const stored = localStorage.getItem(storageKey);
        if (stored) {
          try {
            setLearnedWords(JSON.parse(stored));
          } catch {
            setLearnedWords([]);
          }
        }
      } finally {
        setLoading(false);
      }
    } else {
      const storageKey = getUserStorageKey(LEARNED_WORDS_KEY);
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        try {
          setLearnedWords(JSON.parse(stored));
        } catch {
          setLearnedWords([]);
        }
      }
      setLoading(false);
    }
  }, [isAuthenticated, user]);

  useEffect(() => {
    loadLearnedWords();
  }, [loadLearnedWords]);

  const toggleLearnedWord = useCallback(
    async (word: VocabularyWord, level: HSKLevel): Promise<boolean> => {
      const id = `${level}-${word.id}`;
      const alreadyLearned = learnedWords.some(
        (w) => w.wordId === word.id && w.level === level,
      );

      let newLearnedWords: LearnedWord[];
      if (alreadyLearned) {
        newLearnedWords = learnedWords.filter((w) => w.id !== id);
      } else {
        const learnedWord: LearnedWord = {
          id,
          wordId: word.id,
          level,
          chinese: word.chinese,
          pinyin: word.pinyin,
          english: word.english,
          partOfSpeech: word.partOfSpeech,
          learnedAt: new Date().toISOString(),
        };
        newLearnedWords = [...learnedWords, learnedWord];
      }

      setLearnedWords(newLearnedWords);

      if (isAuthenticated && user) {
        try {
          await hskApi.toggleLearnedWord({
            word_id: word.id,
            word: word.chinese,
            pinyin: word.pinyin,
            english: word.english,
            pos: word.partOfSpeech,
            level: level as number,
          });
          setTimeout(() => loadLearnedWords(), 300);
        } catch (err) {
          console.error("Error toggling learned word:", err);
        }
      }

      const storageKey = getUserStorageKey(LEARNED_WORDS_KEY);
      localStorage.setItem(storageKey, JSON.stringify(newLearnedWords));

      return !alreadyLearned;
    },
    [learnedWords, isAuthenticated, user, loadLearnedWords],
  );

  const isWordLearned = useCallback(
    (wordId: number, level: HSKLevel): boolean => {
      return learnedWords.some((w) => w.wordId === wordId && w.level === level);
    },
    [learnedWords],
  );

  const getLearnedWordsByLevel = useCallback(
    (level?: HSKLevel) => {
      if (level) return learnedWords.filter((w) => w.level === level);
      return learnedWords;
    },
    [learnedWords],
  );

  const clearAllLearnedWords = useCallback(async () => {
    setLearnedWords([]);

    if (isAuthenticated && user) {
      try {
        await hskApi.clearData();
      } catch (err) {
        console.error("Error clearing learned words:", err);
      }
    }

    const storageKey = getUserStorageKey(LEARNED_WORDS_KEY);
    localStorage.removeItem(storageKey);
  }, [isAuthenticated, user]);

  return {
    learnedWords,
    loading,
    toggleLearnedWord,
    isWordLearned,
    getLearnedWordsByLevel,
    clearAllLearnedWords,
    refreshLearnedWords: loadLearnedWords,
  };
}
