import { useState, useEffect, useCallback } from 'react';
import { hskGrammarApi } from '@/lib/api';
import type { HSKGrammarSentence, GrammarTopic, GrammarDataResponse } from '@/types/hsk';

export function useHSKGrammar(level: number) {
  const [sentences, setSentences] = useState<HSKGrammarSentence[]>([]);
  const [topics, setTopics] = useState<GrammarTopic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);

  const loadGrammar = useCallback(async (pageNum: number = 1) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await hskGrammarApi.getGrammarByLevel(level, pageNum, 50, selectedTopic || undefined);
      
      if (response.success && response.data) {
        setSentences(response.data.sentences);
        setTotal(response.data.total);
        setPage(response.data.page);
        setTotalPages(response.data.totalPages);
      } else {
        setError(response.error || 'Failed to load grammar data');
      }
    } catch (err) {
      setError('Failed to load grammar data');
      console.error('Error loading grammar:', err);
    } finally {
      setLoading(false);
    }
  }, [level, selectedTopic]);

  const loadTopics = useCallback(async () => {
    try {
      const response = await hskGrammarApi.getTopics(level);
      if (response.success && response.data) {
        setTopics(response.data);
      }
    } catch (err) {
      console.error('Error loading topics:', err);
    }
  }, [level]);

  useEffect(() => {
    loadGrammar(1);
    loadTopics();
  }, [loadGrammar, loadTopics]);

  const changePage = useCallback((newPage: number) => {
    loadGrammar(newPage);
  }, [loadGrammar]);

  const changeTopic = useCallback((topic: string | null) => {
    setSelectedTopic(topic);
    setPage(1);
  }, []);

  return {
    sentences,
    topics,
    loading,
    error,
    page,
    totalPages,
    total,
    selectedTopic,
    changePage,
    changeTopic,
    refresh: loadGrammar,
  };
}

export function useHSKGrammarSearch() {
  const [results, setResults] = useState<HSKGrammarSentence[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');

  const search = useCallback(async (query: string, level?: number, pageNum: number = 1) => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setSearchQuery(query);

      const response = await hskGrammarApi.searchGrammar(query, level, pageNum, 50);
      
      if (response.success && response.data) {
        setResults(response.data.sentences);
        setTotal(response.data.total);
        setPage(response.data.page);
        setTotalPages(response.data.totalPages);
      } else {
        setError(response.error || 'Search failed');
      }
    } catch (err) {
      setError('Search failed');
      console.error('Error searching grammar:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const clearSearch = useCallback(() => {
    setResults([]);
    setSearchQuery('');
    setPage(1);
    setTotalPages(1);
    setTotal(0);
  }, []);

  const changePage = useCallback((newPage: number, level?: number) => {
    if (searchQuery) {
      search(searchQuery, level, newPage);
    }
  }, [searchQuery, search]);

  return {
    results,
    loading,
    error,
    page,
    totalPages,
    total,
    searchQuery,
    search,
    clearSearch,
    changePage,
  };
}

export function useGrammarAudio() {
  const [playingAudio, setPlayingAudio] = useState<string | null>(null);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);

  const playAudio = useCallback((level: number, filename: string) => {
    if (audioElement) {
      audioElement.pause();
      audioElement.currentTime = 0;
    }

    const audioKey = `${level}-${filename}`;
    const url = hskGrammarApi.getAudioUrl(level, filename);
    const audio = new Audio(url);
    
    setAudioElement(audio);
    setPlayingAudio(audioKey);

    audio.onended = () => {
      setPlayingAudio(null);
    };

    audio.onerror = () => {
      setPlayingAudio(null);
      console.error('Error playing audio:', filename);
    };

    audio.play().catch(err => {
      setPlayingAudio(null);
      console.error('Error playing audio:', err);
    });
  }, [audioElement]);

  const stopAudio = useCallback(() => {
    if (audioElement) {
      audioElement.pause();
      audioElement.currentTime = 0;
      setPlayingAudio(null);
    }
  }, [audioElement]);

  const isPlaying = useCallback((level: number, filename: string) => {
    return playingAudio === `${level}-${filename}`;
  }, [playingAudio]);

  useEffect(() => {
    return () => {
      if (audioElement) {
        audioElement.pause();
      }
    };
  }, [audioElement]);

  return {
    playAudio,
    stopAudio,
    isPlaying,
    playingAudio,
  };
}
