import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import type { HSKLevel } from '@/types/hsk';

export interface SavedGrammarSentence {
  id: string;
  sentenceId: number;
  level: HSKLevel;
  sentenceClean: string;
  pinyin: string;
  english: string;
  grammarPattern?: string;
  topic?: string;
  tags?: string[];
  audioFile?: string;
  savedAt: string;
}

const SAVED_GRAMMAR_KEY = 'hsk_saved_grammar';

function getUserStorageKey(baseKey: string): string {
  const userId = localStorage.getItem('auth_user') ? JSON.parse(localStorage.getItem('auth_user')!).id : 'guest';
  return `${baseKey}_${userId}`;
}

export function useSavedGrammarSentences() {
  const { isAuthenticated, user } = useAuth();
  const [savedSentences, setSavedSentences] = useState<SavedGrammarSentence[]>([]);
  const [loading, setLoading] = useState(true);

  const loadSavedSentences = useCallback(async () => {
    const storageKey = getUserStorageKey(SAVED_GRAMMAR_KEY);
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      try {
        setSavedSentences(JSON.parse(stored));
      } catch {
        setSavedSentences([]);
      }
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadSavedSentences();
  }, [loadSavedSentences]);

  const saveSentence = useCallback(async (sentence: SavedGrammarSentence) => {
    const newSavedSentences = [...savedSentences, sentence];
    setSavedSentences(newSavedSentences);
    
    const storageKey = getUserStorageKey(SAVED_GRAMMAR_KEY);
    localStorage.setItem(storageKey, JSON.stringify(newSavedSentences));
  }, [savedSentences]);

  const removeSavedSentence = useCallback(async (sentenceId: string) => {
    const newSavedSentences = savedSentences.filter(s => s.id !== sentenceId);
    setSavedSentences(newSavedSentences);
    
    const storageKey = getUserStorageKey(SAVED_GRAMMAR_KEY);
    localStorage.setItem(storageKey, JSON.stringify(newSavedSentences));
  }, [savedSentences]);

  const isSentenceSaved = useCallback((sentenceId: number, level: HSKLevel) => {
    return savedSentences.some(s => s.sentenceId === sentenceId && s.level === level);
  }, [savedSentences]);

  const getSavedSentenceById = useCallback((id: string) => {
    return savedSentences.find(s => s.id === id);
  }, [savedSentences]);

  const toggleSaveSentence = useCallback(async (
    sentence: {
      id: number;
      level: HSKLevel;
      sentenceClean: string;
      pinyin: string;
      english: string;
      grammarPattern?: string;
      topic?: string;
      tags?: string[];
      audioFile?: string;
    }
  ) => {
    const id = `${sentence.level}-${sentence.id}`;
    if (isSentenceSaved(sentence.id, sentence.level)) {
      await removeSavedSentence(id);
      return false;
    } else {
      const savedSentence: SavedGrammarSentence = {
        id,
        sentenceId: sentence.id,
        level: sentence.level,
        sentenceClean: sentence.sentenceClean,
        pinyin: sentence.pinyin,
        english: sentence.english,
        grammarPattern: sentence.grammarPattern,
        topic: sentence.topic,
        tags: sentence.tags,
        audioFile: sentence.audioFile,
        savedAt: new Date().toISOString(),
      };
      await saveSentence(savedSentence);
      return true;
    }
  }, [isSentenceSaved, removeSavedSentence, saveSentence]);

  const getSavedSentencesByLevel = useCallback((level?: HSKLevel) => {
    if (level) {
      return savedSentences.filter(s => s.level === level);
    }
    return savedSentences;
  }, [savedSentences]);

  const clearAllSavedSentences = useCallback(async () => {
    setSavedSentences([]);
    const storageKey = getUserStorageKey(SAVED_GRAMMAR_KEY);
    localStorage.removeItem(storageKey);
  }, []);

  return {
    savedSentences,
    loading,
    saveSentence,
    removeSavedSentence,
    isSentenceSaved,
    toggleSaveSentence,
    getSavedSentencesByLevel,
    getSavedSentenceById,
    clearAllSavedSentences,
    refreshSavedSentences: loadSavedSentences,
  };
}
