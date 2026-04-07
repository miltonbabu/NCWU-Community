import { useState, useEffect, useCallback, useRef } from "react";
import { Link } from "react-router-dom";
import {
  Search,
  Play,
  Pause,
  ChevronLeft,
  ChevronRight,
  Filter,
  X,
  BookOpen,
  Heart,
  Share2,
  MessageCircle,
  ExternalLink,
} from "lucide-react";
import type { HSKLevel, HSKGrammarSentence, GrammarTopic } from "@/types/hsk";
import { hskGrammarApi } from "@/lib/api";
import { toast } from "sonner";
import { useSavedGrammarSentences } from "@/hooks/useSavedGrammarSentences";

interface GrammarSentenceBrowserProps {
  isDark: boolean;
  level: HSKLevel;
}

const levelColors: Record<
  number,
  {
    gradient: string;
    solidColor: string;
    cardColors: {
      bgLight: string;
      bgDark: string;
      borderLight: string;
      borderDark: string;
    }[];
  }
> = {
  1: {
    gradient: "from-emerald-500 to-teal-600",
    solidColor: "#10b981",
    cardColors: [
      {
        bgLight: "bg-emerald-50",
        bgDark: "bg-emerald-500/15",
        borderLight: "border-emerald-300",
        borderDark: "border-emerald-500/30",
      },
      {
        bgLight: "bg-lime-50",
        bgDark: "bg-lime-500/15",
        borderLight: "border-lime-300",
        borderDark: "border-lime-500/30",
      },
      {
        bgLight: "bg-teal-50",
        bgDark: "bg-teal-500/15",
        borderLight: "border-teal-300",
        borderDark: "border-teal-500/30",
      },
      {
        bgLight: "bg-green-50",
        bgDark: "bg-green-500/15",
        borderLight: "border-green-300",
        borderDark: "border-green-500/30",
      },
      {
        bgLight: "bg-cyan-50",
        bgDark: "bg-cyan-500/15",
        borderLight: "border-cyan-300",
        borderDark: "border-cyan-500/30",
      },
    ],
  },
  2: {
    gradient: "from-blue-500 to-cyan-600",
    solidColor: "#3b82f6",
    cardColors: [
      {
        bgLight: "bg-blue-50",
        bgDark: "bg-blue-500/15",
        borderLight: "border-blue-300",
        borderDark: "border-blue-500/30",
      },
      {
        bgLight: "bg-indigo-50",
        bgDark: "bg-indigo-500/15",
        borderLight: "border-indigo-300",
        borderDark: "border-indigo-500/30",
      },
      {
        bgLight: "bg-sky-50",
        bgDark: "bg-sky-500/15",
        borderLight: "border-sky-300",
        borderDark: "border-sky-500/30",
      },
      {
        bgLight: "bg-cyan-50",
        bgDark: "bg-cyan-500/15",
        borderLight: "border-cyan-300",
        borderDark: "border-cyan-500/30",
      },
      {
        bgLight: "bg-violet-50",
        bgDark: "bg-violet-500/15",
        borderLight: "border-violet-300",
        borderDark: "border-violet-500/30",
      },
    ],
  },
  3: {
    gradient: "from-violet-500 to-purple-600",
    solidColor: "#8b5cf6",
    cardColors: [
      {
        bgLight: "bg-violet-50",
        bgDark: "bg-violet-500/15",
        borderLight: "border-violet-300",
        borderDark: "border-violet-500/30",
      },
      {
        bgLight: "bg-purple-50",
        bgDark: "bg-purple-500/15",
        borderLight: "border-purple-300",
        borderDark: "border-purple-500/30",
      },
      {
        bgLight: "bg-fuchsia-50",
        bgDark: "bg-fuchsia-500/15",
        borderLight: "border-fuchsia-300",
        borderDark: "border-fuchsia-500/30",
      },
      {
        bgLight: "bg-pink-50",
        bgDark: "bg-pink-500/15",
        borderLight: "border-pink-300",
        borderDark: "border-pink-500/30",
      },
      {
        bgLight: "bg-plum-50",
        bgDark: "bg-plum-500/15",
        borderLight: "border-plum-200",
        borderDark: "border-plum-500/25",
      },
    ],
  },
  4: {
    gradient: "from-amber-500 to-orange-600",
    solidColor: "#f59e0b",
    cardColors: [
      {
        bgLight: "bg-amber-50",
        bgDark: "bg-amber-500/15",
        borderLight: "border-amber-300",
        borderDark: "border-amber-500/30",
      },
      {
        bgLight: "bg-orange-50",
        bgDark: "bg-orange-500/15",
        borderLight: "border-orange-300",
        borderDark: "border-orange-500/30",
      },
      {
        bgLight: "bg-yellow-50",
        bgDark: "bg-yellow-500/15",
        borderLight: "border-yellow-300",
        borderDark: "border-yellow-500/30",
      },
      {
        bgLight: "bg-amber-100",
        bgDark: "bg-amber-400/15",
        borderLight: "border-amber-400",
        borderDark: "border-amber-400/30",
      },
      {
        bgLight: "bg-orange-100",
        bgDark: "bg-orange-400/15",
        borderLight: "border-orange-400",
        borderDark: "border-orange-400/30",
      },
    ],
  },
  5: {
    gradient: "from-rose-500 to-pink-600",
    solidColor: "#f43f5e",
    cardColors: [
      {
        bgLight: "bg-rose-50",
        bgDark: "bg-rose-500/15",
        borderLight: "border-rose-300",
        borderDark: "border-rose-500/30",
      },
      {
        bgLight: "bg-pink-50",
        bgDark: "bg-pink-500/15",
        borderLight: "border-pink-300",
        borderDark: "border-pink-500/30",
      },
      {
        bgLight: "bg-red-50",
        bgDark: "bg-red-500/15",
        borderLight: "border-red-300",
        borderDark: "border-red-500/30",
      },
      {
        bgLight: "bg-fuchsia-50",
        bgDark: "bg-fuchsia-500/15",
        borderLight: "border-fuchsia-300",
        borderDark: "border-fuchsia-500/30",
      },
      {
        bgLight: "bg-rose-100",
        bgDark: "bg-rose-400/15",
        borderLight: "border-rose-400",
        borderDark: "border-rose-400/30",
      },
    ],
  },
  6: {
    gradient: "from-red-500 to-rose-600",
    solidColor: "#ef4444",
    cardColors: [
      {
        bgLight: "bg-red-50",
        bgDark: "bg-red-500/15",
        borderLight: "border-red-300",
        borderDark: "border-red-500/30",
      },
      {
        bgLight: "bg-rose-50",
        bgDark: "bg-rose-500/15",
        borderLight: "border-rose-300",
        borderDark: "border-rose-500/30",
      },
      {
        bgLight: "bg-orange-50",
        bgDark: "bg-orange-500/15",
        borderLight: "border-orange-300",
        borderDark: "border-orange-500/30",
      },
      {
        bgLight: "bg-red-100",
        bgDark: "bg-red-400/15",
        borderLight: "border-red-400",
        borderDark: "border-red-400/30",
      },
      {
        bgLight: "bg-rose-100",
        bgDark: "bg-rose-400/15",
        borderLight: "border-rose-400",
        borderDark: "border-rose-400/30",
      },
    ],
  },
};

export default function GrammarSentenceBrowser({
  isDark,
  level,
}: GrammarSentenceBrowserProps) {
  const [sentences, setSentences] = useState<HSKGrammarSentence[]>([]);
  const [topics, setTopics] = useState<GrammarTopic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [playingAudio, setPlayingAudio] = useState<string | null>(null);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(
    null,
  );
  const [showTopicFilter, setShowTopicFilter] = useState(false);
  const [highlightedSentenceId, setHighlightedSentenceId] = useState<
    number | null
  >(null);
  const [shareModalSentence, setShareModalSentence] =
    useState<HSKGrammarSentence | null>(null);
  const [shareHeading, setShareHeading] = useState<string>("");
  const sentenceCardRefs = useRef<Map<number, HTMLDivElement>>(new Map());

  const { savedSentences, toggleSaveSentence, isSentenceSaved } =
    useSavedGrammarSentences();

  const SENTENCES_PER_PAGE = 15;

  const loadSentences = useCallback(
    async (pageNum: number = 1) => {
      if (!level || level < 1 || level > 6) {
        console.warn("Invalid level:", level);
        return;
      }
      try {
        setLoading(true);
        setError(null);

        const response = await hskGrammarApi.getGrammarByLevel(
          level,
          pageNum,
          SENTENCES_PER_PAGE,
          selectedTopic || undefined,
        );

        if (response.success && response.data) {
          setSentences(response.data.sentences);
          setTotal(response.data.total);
          setPage(response.data.page);
          setTotalPages(response.data.totalPages);
        } else {
          setError("Failed to load sentences");
        }
      } catch (err) {
        setError("Failed to load sentences");
        console.error("Error loading sentences:", err);
      } finally {
        setLoading(false);
      }
    },
    [level, selectedTopic],
  );

  const loadTopics = useCallback(async () => {
    if (!level || level < 1 || level > 6) {
      console.warn("Invalid level for topics:", level);
      return;
    }
    try {
      const response = await hskGrammarApi.getTopics(level);
      if (response.success && response.data) {
        setTopics(response.data);
      }
    } catch (err) {
      console.error("Error loading topics:", err);
    }
  }, [level]);

  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim()) {
      setIsSearching(false);
      setHighlightedSentenceId(null);
      loadSentences(1);
      return;
    }

    const numericQuery = parseInt(searchQuery.trim(), 10);
    if (!isNaN(numericQuery) && numericQuery > 0) {
      const targetPage = Math.ceil(numericQuery / SENTENCES_PER_PAGE);
      try {
        setLoading(true);
        setError(null);
        setIsSearching(true);
        setHighlightedSentenceId(numericQuery);

        const response = await hskGrammarApi.getGrammarByLevel(
          level,
          targetPage,
          SENTENCES_PER_PAGE,
          undefined,
        );

        if (response.success && response.data) {
          setSentences(response.data.sentences);
          setTotal(response.data.total);
          setPage(response.data.page);
          setTotalPages(response.data.totalPages);
          setSelectedTopic(null);
        } else {
          setError("Failed to load sentence");
        }
      } catch (err) {
        setError("Failed to load sentence");
        console.error("Error loading sentence by number:", err);
      } finally {
        setLoading(false);
      }
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setIsSearching(true);
      setHighlightedSentenceId(null);

      const response = await hskGrammarApi.searchGrammar(
        searchQuery,
        level,
        1,
        SENTENCES_PER_PAGE,
      );

      if (response.success && response.data) {
        setSentences(response.data.sentences);
        setTotal(response.data.total);
        setPage(response.data.page);
        setTotalPages(response.data.totalPages);
      } else {
        setError("Search failed");
      }
    } catch (err) {
      setError("Search failed");
      console.error("Error searching:", err);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, level, loadSentences]);

  useEffect(() => {
    loadSentences(1);
    loadTopics();
  }, [loadSentences, loadTopics]);

  useEffect(() => {
    setPage(1);
    setSelectedTopic(null);
    setSearchQuery("");
    setIsSearching(false);
    setHighlightedSentenceId(null);
  }, [level]);

  useEffect(() => {
    if (highlightedSentenceId && sentences.length > 0) {
      const timer = setTimeout(() => {
        const cardElement = sentenceCardRefs.current.get(highlightedSentenceId);
        if (cardElement) {
          cardElement.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [highlightedSentenceId, sentences]);

  const playAudio = useCallback(
    (sentence: HSKGrammarSentence) => {
      if (audioElement) {
        audioElement.pause();
        audioElement.currentTime = 0;
      }

      if (!sentence.audioFile) {
        toast.error("No audio available for this sentence");
        return;
      }

      const audioKey = `${sentence.level}-${sentence.id}`;
      const url = hskGrammarApi.getAudioUrl(sentence.level, sentence.audioFile);
      const audio = new Audio(url);

      setAudioElement(audio);
      setPlayingAudio(audioKey);

      audio.onended = () => {
        setPlayingAudio(null);
      };

      audio.onerror = () => {
        setPlayingAudio(null);
        toast.error("Failed to play audio");
      };

      audio.play().catch((err) => {
        setPlayingAudio(null);
        toast.error("Failed to play audio");
        console.error("Error playing audio:", err);
      });
    },
    [audioElement],
  );

  const stopAudio = useCallback(() => {
    if (audioElement) {
      audioElement.pause();
      audioElement.currentTime = 0;
      setPlayingAudio(null);
    }
  }, [audioElement]);

  const handlePageChange = (newPage: number) => {
    if (isSearching) {
      handleSearch();
    } else {
      loadSentences(newPage);
    }
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleTopicSelect = (topic: string | null) => {
    setSelectedTopic(topic);
    setPage(1);
    setShowTopicFilter(false);
  };

  const clearSearch = () => {
    setSearchQuery("");
    setIsSearching(false);
    loadSentences(1);
  };

  const colors = levelColors[level] || levelColors[1];

  // Guard against invalid level
  if (!level || level < 1 || level > 6) {
    return (
      <div
        className={`p-8 rounded-2xl text-center ${isDark ? "bg-white/5 text-white" : "bg-white text-slate-900"}`}
      >
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search and Filter */}
      <div
        className={`p-4 md:p-5 rounded-2xl backdrop-blur-xl shadow-lg border-2 ${
          isDark
            ? `bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border-indigo-500/30`
            : `bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-200`
        }`}
      >
        <div className="flex items-center gap-2 mb-3">
          <Search
            className={`w-5 h-5 ${isDark ? "text-indigo-400" : "text-indigo-600"}`}
          />
          <h3
            className={`font-semibold ${isDark ? "text-white" : "text-slate-800"}`}
          >
            Search & Filter Sentences
          </h3>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search
              className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? "text-white/40" : "text-slate-400"}`}
            />
            <input
              type="text"
              placeholder="Search by number, Chinese, pinyin, or English..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className={`w-full pl-10 pr-10 py-3 rounded-xl text-sm border-2 ${
                isDark
                  ? "bg-white/10 border-white/20 text-white placeholder-white/40 focus:border-indigo-500"
                  : "bg-white border-indigo-200 text-slate-900 placeholder-slate-400 focus:border-indigo-500"
              } focus:outline-none focus:ring-2 focus:ring-indigo-500/20`}
            />
            {searchQuery && (
              <button
                onClick={clearSearch}
                className={`absolute right-3 top-1/2 -translate-y-1/2 ${isDark ? "text-white/40 hover:text-white/60" : "text-slate-400 hover:text-slate-600"}`}
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleSearch}
              className={`px-5 py-3 rounded-xl text-sm font-medium transition-all shadow-md hover:shadow-lg bg-gradient-to-r ${colors.gradient} text-white hover:opacity-90`}
            >
              🔍 Search
            </button>

            <button
              onClick={() => setShowTopicFilter(!showTopicFilter)}
              className={`flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-medium transition-all shadow-md ${
                showTopicFilter || selectedTopic
                  ? `bg-gradient-to-r ${colors.gradient} text-white`
                  : isDark
                    ? "bg-white/10 hover:bg-white/20 text-white border border-white/20"
                    : "bg-white hover:bg-indigo-50 text-slate-900 border border-indigo-200"
              }`}
            >
              <Filter className="w-4 h-4" />
              <span>Topics</span>
              {selectedTopic && (
                <span className="ml-1 px-1.5 py-0.5 rounded-full bg-white/20 text-xs">
                  1
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Topic Filter Dropdown */}
        {showTopicFilter && (
          <div
            className={`mt-4 p-4 rounded-xl ${isDark ? "bg-white/5" : "bg-slate-50"}`}
          >
            <div className="flex items-center justify-between mb-3">
              <h4
                className={`text-sm font-semibold ${isDark ? "text-white" : "text-slate-900"}`}
              >
                Filter by Topic
              </h4>
              {selectedTopic && (
                <button
                  onClick={() => handleTopicSelect(null)}
                  className={`text-xs ${isDark ? "text-indigo-400 hover:text-indigo-300" : "text-indigo-600 hover:text-indigo-500"}`}
                >
                  Clear filter
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto">
              <button
                onClick={() => handleTopicSelect(null)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  selectedTopic === null
                    ? `bg-gradient-to-r ${colors.gradient} text-white`
                    : isDark
                      ? "bg-white/10 hover:bg-white/20 text-white"
                      : "bg-white hover:bg-slate-100 text-slate-900 border border-slate-200"
                }`}
              >
                All Topics
              </button>
              {topics.slice(0, 20).map((topic, idx) => {
                const topicColor =
                  colors.cardColors[idx % colors.cardColors.length];
                return (
                  <button
                    key={topic.name}
                    onClick={() => handleTopicSelect(topic.name)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all shadow-sm ${
                      selectedTopic === topic.name
                        ? `bg-gradient-to-r ${colors.gradient} text-white`
                        : isDark
                          ? `${topicColor.bgDark} ${topicColor.borderDark} text-white`
                          : `${topicColor.bgLight} ${topicColor.borderLight} text-slate-800`
                    }`}
                  >
                    {topic.name} ({topic.count})
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Stats */}
      <div
        className={`flex items-center justify-between px-4 py-2 rounded-xl ${isDark ? "bg-white/5" : "bg-slate-100"}`}
      >
        <p className={`text-sm ${isDark ? "text-white/60" : "text-slate-600"}`}>
          {isSearching
            ? `Search results: ${total} sentences`
            : `${total} sentences for HSK ${level}`}
          {selectedTopic && ` • Topic: ${selectedTopic}`}
        </p>
        <p className={`text-xs ${isDark ? "text-white/40" : "text-slate-400"}`}>
          Page {page} of {totalPages}
        </p>
      </div>

      {/* Loading */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-4 border-indigo-500/20 border-t-indigo-500"></div>
        </div>
      ) : error ? (
        <div
          className={`text-center py-12 ${isDark ? "text-red-400" : "text-red-600"}`}
        >
          <p>{error}</p>
          <button
            onClick={() => loadSentences(1)}
            className="mt-4 text-indigo-500 hover:text-indigo-400"
          >
            Try again
          </button>
        </div>
      ) : sentences.length === 0 ? (
        <div
          className={`text-center py-12 ${isDark ? "text-white/40" : "text-slate-500"}`}
        >
          <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No sentences found</p>
        </div>
      ) : (
        <>
          {/* Sentence Cards */}
          <div className="grid gap-4">
            {sentences.map((sentence, index) => {
              const isPlaying =
                playingAudio === `${sentence.level}-${sentence.id}`;
              const sentenceNumber =
                (page - 1) * SENTENCES_PER_PAGE + index + 1;
              const colorIndex = index % colors.cardColors.length;
              const cardColor = colors.cardColors[colorIndex];
              const isSaved = isSentenceSaved(sentence.id, sentence.level);

              return (
                <div
                  key={`${sentence.level}-${sentence.id}`}
                  ref={(el) => {
                    if (el) {
                      sentenceCardRefs.current.set(sentenceNumber, el);
                    }
                  }}
                  className={`p-2 md:p-5 rounded-lg md:rounded-2xl transition-all duration-200 border-2 hover:shadow-lg ${
                    highlightedSentenceId === sentenceNumber
                      ? "ring-4 ring-yellow-400 ring-offset-2"
                      : ""
                  } ${
                    isDark
                      ? `${cardColor.bgDark} ${cardColor.borderDark}`
                      : `${cardColor.bgLight} ${cardColor.borderLight}`
                  }`}
                >
                  <div className="flex flex-col md:flex-row md:items-start gap-3 md:gap-4">
                    {/* Left side: Number, Audio, and Content */}
                    <div className="flex items-start gap-2 md:gap-4 flex-1 min-w-0">
                      {/* Sentence Number */}
                      <div
                        className="flex-shrink-0 w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl flex items-center justify-center font-bold text-xs md:text-sm text-white shadow-md"
                        style={{ backgroundColor: colors.solidColor }}
                      >
                        {sentenceNumber}
                      </div>

                      {/* Audio Button */}
                      <button
                        onClick={() =>
                          isPlaying ? stopAudio() : playAudio(sentence)
                        }
                        className={`flex-shrink-0 p-2 md:p-3 rounded-lg md:rounded-xl transition-all shadow-md hover:opacity-90 ${
                          isPlaying ? "bg-indigo-600" : "bg-indigo-500"
                        } text-white`}
                        title={isPlaying ? "Stop" : "Play audio"}
                      >
                        {isPlaying ? (
                          <Pause className="w-4 h-4 md:w-5 md:h-5" />
                        ) : (
                          <Play className="w-4 h-4 md:w-5 md:h-5" />
                        )}
                      </button>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        {/* Chinese */}
                        <p
                          className={`text-lg md:text-xl md:text-2xl font-bold mb-1 ${isDark ? "text-white" : "text-slate-800"}`}
                        >
                          {sentence.sentenceClean}
                        </p>

                        {/* Pinyin */}
                        <p
                          className={`text-sm md:text-base lg:text-lg mb-2 ${isDark ? "text-indigo-300" : "text-indigo-600"}`}
                        >
                          {sentence.pinyin}
                        </p>

                        {/* English */}
                        <p
                          className={`text-xs md:text-sm lg:text-base mb-2 md:mb-3 ${isDark ? "text-slate-300" : "text-slate-700"}`}
                        >
                          {sentence.english}
                        </p>

                        {/* Pattern */}
                        {sentence.grammarPattern && (
                          <div
                            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium shadow-sm ${
                              isDark
                                ? "text-white bg-white/10"
                                : "text-slate-800 bg-white/60"
                            }`}
                          >
                            <BookOpen className="w-3 h-3" />
                            {sentence.grammarPattern}
                          </div>
                        )}

                        {/* Tags & Topic Row - Mobile optimized */}
                        <div className="flex flex-wrap items-center gap-2 mt-2 md:mt-3">
                          {/* Tags */}
                          {sentence.tags.slice(0, 2).map((tag, idx) => (
                            <span
                              key={idx}
                              className={`px-2 py-1 rounded-lg text-[10px] md:text-xs font-medium shadow-sm ${
                                isDark
                                  ? "text-white bg-white/10"
                                  : "text-slate-700 bg-white/60"
                              }`}
                            >
                              {tag}
                            </span>
                          ))}
                        </div>

                        {/* Topic - New line on mobile */}
                        {sentence.topic && (
                          <button
                            onClick={() => handleTopicSelect(sentence.topic)}
                            className={`mt-2 text-[10px] md:text-xs font-medium px-2 py-1 rounded transition-all whitespace-normal text-left leading-tight w-full md:w-auto md:inline-block border-0 ${
                              isDark
                                ? "text-slate-300 bg-white/5 hover:bg-white/10"
                                : "text-slate-600 bg-white/40 hover:bg-white/60"
                            }`}
                          >
                            📖{" "}
                            <span className="break-words">
                              {sentence.topic}
                            </span>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Right side: Share & Favorite Buttons */}
                    <div className="flex flex-row md:flex-col items-center gap-1 md:gap-2 flex-shrink-0">
                      <button
                        onClick={() => setShareModalSentence(sentence)}
                        className={`p-2 rounded-lg transition-all ${
                          isDark
                            ? "bg-white/10 hover:bg-indigo-500/20 text-slate-300 hover:text-indigo-400"
                            : "bg-white/60 hover:bg-indigo-100 text-slate-500 hover:text-indigo-500"
                        }`}
                        title="Share sentence"
                      >
                        <Share2 className="w-4 h-4 md:w-5 md:h-5" />
                      </button>
                      <button
                        onClick={() => {
                          toggleSaveSentence({
                            id: sentence.id,
                            level: sentence.level,
                            sentenceClean: sentence.sentenceClean,
                            pinyin: sentence.pinyin,
                            english: sentence.english,
                            grammarPattern: sentence.grammarPattern,
                            topic: sentence.topic,
                            tags: sentence.tags,
                            audioFile: sentence.audioFile,
                          }).then((saved) => {
                            toast.success(
                              saved
                                ? "Sentence saved!"
                                : "Sentence removed from saved",
                            );
                          });
                        }}
                        className={`p-2 rounded-lg transition-all ${
                          isSaved
                            ? "bg-rose-500 text-white"
                            : isDark
                              ? "bg-white/10 hover:bg-rose-500/20 text-slate-300 hover:text-rose-400"
                              : "bg-white/60 hover:bg-rose-100 text-slate-500 hover:text-rose-500"
                        }`}
                        title={isSaved ? "Remove from saved" : "Save sentence"}
                      >
                        <Heart
                          className={`w-4 h-4 md:w-5 md:h-5 ${isSaved ? "fill-current" : ""}`}
                        />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div
              className={`flex items-center justify-center gap-2 pt-6 ${isDark ? "border-white/10" : "border-slate-200"}`}
            >
              <button
                onClick={() => handlePageChange(page - 1)}
                disabled={page === 1}
                className={`p-2 rounded-lg transition-all ${
                  page === 1
                    ? "opacity-50 cursor-not-allowed"
                    : isDark
                      ? "hover:bg-white/10 text-white"
                      : "hover:bg-slate-100 text-slate-900"
                }`}
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (page <= 3) {
                    pageNum = i + 1;
                  } else if (page >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = page - 2 + i;
                  }

                  return (
                    <button
                      key={pageNum}
                      onClick={() => handlePageChange(pageNum)}
                      className={`w-10 h-10 rounded-lg font-medium transition-all ${
                        page === pageNum
                          ? `bg-gradient-to-r ${colors.gradient} text-white`
                          : isDark
                            ? "hover:bg-white/10 text-white"
                            : "hover:bg-slate-100 text-slate-900"
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() => handlePageChange(page + 1)}
                disabled={page === totalPages}
                className={`p-2 rounded-lg transition-all ${
                  page === totalPages
                    ? "opacity-50 cursor-not-allowed"
                    : isDark
                      ? "hover:bg-white/10 text-white"
                      : "hover:bg-slate-100 text-slate-900"
                }`}
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          )}
        </>
      )}

      {/* Share Modal */}
      {shareModalSentence && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={() => {
            setShareModalSentence(null);
            setShareHeading("");
          }}
        >
          <div
            className={`w-full max-w-md rounded-2xl border shadow-2xl ${
              isDark
                ? "bg-slate-800 border-slate-700"
                : "bg-white border-slate-200"
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className={`flex items-center justify-between p-4 border-b ${
                isDark ? "border-slate-700" : "border-slate-200"
              }`}
            >
              <h3
                className={`text-lg font-bold ${
                  isDark ? "text-white" : "text-slate-900"
                }`}
              >
                Share Grammar Sentence
              </h3>
              <button
                onClick={() => {
                  setShareModalSentence(null);
                  setShareHeading("");
                }}
                className={`p-1 rounded-lg transition-colors ${
                  isDark
                    ? "hover:bg-slate-700 text-slate-400"
                    : "hover:bg-slate-100 text-slate-500"
                }`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4">
              <div
                className={`p-4 rounded-xl mb-4 ${
                  isDark ? "bg-slate-700/50" : "bg-slate-50"
                }`}
              >
                <p
                  className={`text-xl font-bold mb-1 ${
                    isDark ? "text-white" : "text-slate-900"
                  }`}
                >
                  {shareModalSentence.sentenceClean}
                </p>
                <p
                  className={`text-sm ${
                    isDark ? "text-indigo-400" : "text-indigo-600"
                  }`}
                >
                  {shareModalSentence.pinyin}
                </p>
                <p
                  className={`text-sm mt-1 ${
                    isDark ? "text-slate-300" : "text-slate-600"
                  }`}
                >
                  {shareModalSentence.english}
                </p>
                {shareModalSentence.grammarPattern && (
                  <p
                    className={`text-xs mt-2 ${
                      isDark ? "text-slate-400" : "text-slate-500"
                    }`}
                  >
                    📖 {shareModalSentence.grammarPattern}
                  </p>
                )}
              </div>

              <div className="mb-4">
                <label
                  className={`block text-sm font-medium mb-2 ${
                    isDark ? "text-slate-300" : "text-slate-600"
                  }`}
                >
                  Post Heading (optional)
                </label>
                <input
                  type="text"
                  placeholder="Add a heading for your post..."
                  value={shareHeading}
                  onChange={(e) => setShareHeading(e.target.value)}
                  className={`w-full px-3 py-2 rounded-lg border text-sm ${
                    isDark
                      ? "bg-slate-700 border-slate-600 text-white placeholder-slate-500"
                      : "bg-white border-slate-200 text-slate-900 placeholder-slate-400"
                  }`}
                />
              </div>

              <div className="space-y-3">
                <Link
                  to="/social"
                  state={{
                    createPost: true,
                    postHeading: shareHeading || undefined,
                    postContent: `📝 Grammar Sentence (HSK ${shareModalSentence.level}):\n\n"${shareModalSentence.sentenceClean}"\n${shareModalSentence.pinyin}\n\n${shareModalSentence.english}\n\n${shareModalSentence.grammarPattern ? `📖 Pattern: ${shareModalSentence.grammarPattern}\n\n` : ""}🔗 Learn more at: ${window.location.origin}/hsk-grammar?level=${shareModalSentence.level}\n\n#HSK${shareModalSentence.level} #NCWU #HuashuiHSK #GrammarLearning #Chinese`,
                  }}
                  onClick={() => {
                    setShareModalSentence(null);
                    setShareHeading("");
                  }}
                  className={`flex items-center gap-3 w-full p-3 rounded-xl transition-all ${
                    isDark
                      ? "bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/30"
                      : "bg-indigo-50 hover:bg-indigo-100 text-indigo-600 border border-indigo-200"
                  }`}
                >
                  <div
                    className={`p-2 rounded-lg ${
                      isDark ? "bg-indigo-500/30" : "bg-indigo-100"
                    }`}
                  >
                    <MessageCircle className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium">Create Post on NCWU Social</p>
                    <p
                      className={`text-xs ${
                        isDark ? "text-indigo-400" : "text-indigo-500"
                      }`}
                    >
                      Share with #HuashuiHSK #NCWU
                    </p>
                  </div>
                </Link>

                <button
                  onClick={() => {
                    const shareText = `Check out this HSK ${shareModalSentence.level} grammar sentence:\n\n"${shareModalSentence.sentenceClean}"\n${shareModalSentence.pinyin}\n\n${shareModalSentence.english}\n\n${shareModalSentence.grammarPattern ? `Pattern: ${shareModalSentence.grammarPattern}\n\n` : ""}Learn more at: ${window.location.origin}/hsk-grammar?level=${shareModalSentence.level}\n\n#HSK${shareModalSentence.level} #NCWU #HuashuiHSK`;
                    navigator.clipboard.writeText(shareText);
                    toast.success("Copied to clipboard!");
                    setShareModalSentence(null);
                    setShareHeading("");
                  }}
                  className={`flex items-center gap-3 w-full p-3 rounded-xl transition-all ${
                    isDark
                      ? "bg-slate-700 hover:bg-slate-600 text-slate-300 border border-slate-600"
                      : "bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200"
                  }`}
                >
                  <div
                    className={`p-2 rounded-lg ${
                      isDark ? "bg-slate-600" : "bg-slate-200"
                    }`}
                  >
                    <ExternalLink className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium">Copy to Clipboard</p>
                    <p
                      className={`text-xs ${
                        isDark ? "text-slate-400" : "text-slate-500"
                      }`}
                    >
                      Copy sentence details
                    </p>
                  </div>
                </button>

                {navigator.share && (
                  <button
                    onClick={() => {
                      navigator.share({
                        title: `HSK ${shareModalSentence.level} Grammar Sentence`,
                        text: `"${shareModalSentence.sentenceClean}"\n${shareModalSentence.pinyin}\n\n${shareModalSentence.english}`,
                        url: `${window.location.origin}/hsk-grammar?level=${shareModalSentence.level}`,
                      });
                      setShareModalSentence(null);
                      setShareHeading("");
                    }}
                    className={`flex items-center gap-3 w-full p-3 rounded-xl transition-all ${
                      isDark
                        ? "bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30"
                        : "bg-emerald-50 hover:bg-emerald-100 text-emerald-600 border border-emerald-200"
                    }`}
                  >
                    <div
                      className={`p-2 rounded-lg ${
                        isDark ? "bg-emerald-500/30" : "bg-emerald-100"
                      }`}
                    >
                      <Share2 className="w-5 h-5" />
                    </div>
                    <div className="text-left">
                      <p className="font-medium">Share via App</p>
                      <p
                        className={`text-xs ${
                          isDark ? "text-emerald-400" : "text-emerald-500"
                        }`}
                      >
                        Use device share menu
                      </p>
                    </div>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
