import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { hskApi } from "@/lib/api";
import type { HSKLevel } from "@/types/hsk";
import type { VocabularyWord } from "@/data/hsk1Vocabulary";

export interface SavedWord {
  id: string;
  wordId: number;
  level: HSKLevel;
  chinese: string;
  pinyin: string;
  english: string;
  partOfSpeech: string;
  exampleSentence?: string;
  examplePinyin?: string;
  exampleTranslation?: string;
  savedAt: string;
}

const SAVED_WORDS_KEY = "hsk_saved_words";

function getUserStorageKey(baseKey: string): string {
  const userId = localStorage.getItem("auth_user")
    ? JSON.parse(localStorage.getItem("auth_user")!).id
    : "guest";
  return `${baseKey}_${userId}`;
}

export function useSavedWords() {
  const { isAuthenticated, user } = useAuth();
  const [savedWords, setSavedWords] = useState<SavedWord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadSavedWords = useCallback(async () => {
    if (isAuthenticated && user) {
      try {
        setLoading(true);
        setError(null);
        const response = await hskApi.getSavedWords();
        if (response?.success && response.data) {
          const words = Array.isArray(response.data) ? response.data : [];
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const formattedWords: SavedWord[] = words.map((w: any) => ({
            id: w.id || `${w.level}-${w.word_id}`,
            wordId: w.word_id,
            level: w.level,
            chinese: w.word,
            pinyin: w.pinyin,
            english: w.english,
            partOfSpeech: w.pos || "",
            savedAt: w.created_at || new Date().toISOString(),
          }));
          setSavedWords(formattedWords);
        }
      } catch (err) {
        console.error("Error loading saved words:", err);
        const storageKey = getUserStorageKey(SAVED_WORDS_KEY);
        const stored = localStorage.getItem(storageKey);
        if (stored) {
          try {
            setSavedWords(JSON.parse(stored));
          } catch {
            setSavedWords([]);
          }
        }
      } finally {
        setLoading(false);
      }
    } else {
      const storageKey = getUserStorageKey(SAVED_WORDS_KEY);
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        try {
          setSavedWords(JSON.parse(stored));
        } catch {
          setSavedWords([]);
        }
      }
      setLoading(false);
    }
  }, [isAuthenticated, user]);

  useEffect(() => {
    loadSavedWords();
  }, [loadSavedWords]);

  const saveWord = useCallback(
    async (word: VocabularyWord, level: HSKLevel) => {
      const savedWord: SavedWord = {
        id: `${level}-${word.id}`,
        wordId: word.id,
        level,
        chinese: word.chinese,
        pinyin: word.pinyin,
        english: word.english,
        partOfSpeech: word.partOfSpeech,
        exampleSentence: word.exampleSentence,
        examplePinyin: word.examplePinyin,
        exampleTranslation: word.exampleTranslation,
        savedAt: new Date().toISOString(),
      };

      const newSavedWords = [...savedWords, savedWord];
      setSavedWords(newSavedWords);

      if (isAuthenticated && user) {
        try {
          await hskApi.toggleSavedWord({
            word_id: word.id,
            word: word.chinese,
            pinyin: word.pinyin,
            english: word.english,
            pos: word.partOfSpeech,
            level: level as number,
          });
        } catch (err) {
          console.error("Error saving word:", err);
        }
      }

      const storageKey = getUserStorageKey(SAVED_WORDS_KEY);
      localStorage.setItem(storageKey, JSON.stringify(newSavedWords));
    },
    [savedWords, isAuthenticated, user],
  );

  const removeSavedWord = useCallback(
    async (wordId: string) => {
      const wordToRemove = savedWords.find((w) => w.id === wordId);
      const newSavedWords = savedWords.filter((w) => w.id !== wordId);
      setSavedWords(newSavedWords);

      if (isAuthenticated && user && wordToRemove) {
        try {
          await hskApi.removeSavedWord(wordToRemove.wordId);
        } catch (err) {
          console.error("Error removing saved word:", err);
        }
      }

      const storageKey = getUserStorageKey(SAVED_WORDS_KEY);
      localStorage.setItem(storageKey, JSON.stringify(newSavedWords));
    },
    [savedWords, isAuthenticated, user],
  );

  const isWordSaved = useCallback(
    (wordId: number, level: HSKLevel) => {
      return savedWords.some((w) => w.wordId === wordId && w.level === level);
    },
    [savedWords],
  );

  const getSavedWordById = useCallback(
    (wordId: string) => {
      return savedWords.find((w) => w.id === wordId);
    },
    [savedWords],
  );

  const toggleSaveWord = useCallback(
    async (word: VocabularyWord, level: HSKLevel) => {
      const id = `${level}-${word.id}`;
      if (isWordSaved(word.id, level)) {
        await removeSavedWord(id);
        return false;
      } else {
        await saveWord(word, level);
        return true;
      }
    },
    [isWordSaved, removeSavedWord, saveWord],
  );

  const getSavedWordsByLevel = useCallback(
    (level?: HSKLevel) => {
      if (level) {
        return savedWords.filter((w) => w.level === level);
      }
      return savedWords;
    },
    [savedWords],
  );

  const clearAllSavedWords = useCallback(async () => {
    setSavedWords([]);

    if (isAuthenticated && user) {
      try {
        await hskApi.clearData();
      } catch (err) {
        console.error("Error clearing saved words:", err);
      }
    }

    const storageKey = getUserStorageKey(SAVED_WORDS_KEY);
    localStorage.removeItem(storageKey);
  }, [isAuthenticated, user]);

  return {
    savedWords,
    loading,
    error,
    saveWord,
    removeSavedWord,
    isWordSaved,
    toggleSaveWord,
    getSavedWordsByLevel,
    getSavedWordById,
    clearAllSavedWords,
    refreshSavedWords: loadSavedWords,
  };
}
