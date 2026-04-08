import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useTheme } from "@/components/ThemeProvider";
import { useAuth } from "@/contexts/AuthContext";
import {
  BookOpen,
  Trophy,
  Clock,
  Star,
  Play,
  Check,
  X,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  Heart,
  Bookmark,
  Users,
  Video,
  FileText,
  Headphones,
  ExternalLink,
  Search,
  Target,
  Award,
  MessageCircle,
  LogIn,
  Lock,
  Volume2,
  VolumeX,
  GraduationCap,
  ArrowRight,
  Trash2,
  BookMarked,
  Moon,
  Sun,
  Share2,
  Globe,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import type {
  HSKLevel,
  HSKProgress,
  HSKQuiz,
  HSKQuizResult,
  StudyResource,
  QuizSettings,
} from "@/types/hsk";
import { hskLevelLabels } from "@/types/hsk";
import { generateQuiz } from "@/utils/quizGenerator";
import QuizSettingsComponent from "@/components/QuizSettings";
import QuizResults from "@/components/QuizResults";
import { useHSKProgress, useHSKQuiz, useStudyResources } from "@/hooks/useHSK";
import { useSavedWords, type SavedWord } from "@/hooks/useSavedWords";
import { useLearnedWords, type LearnedWord } from "@/hooks/useLearnedWords";
import { Link, useNavigate } from "react-router-dom";
import { hsk1Vocabulary, type VocabularyWord } from "@/data/hsk1Vocabulary";
import { hsk2Vocabulary } from "@/data/hsk2Vocabulary";
import { hsk3Vocabulary } from "@/data/hsk3Vocabulary";
import { hsk4Vocabulary } from "@/data/hsk4Vocabulary";
import RandomVocabularyQuiz from "@/components/RandomVocabularyQuiz";

const allVocabulary: Record<number, VocabularyWord[]> = {
  1: hsk1Vocabulary,
  2: hsk2Vocabulary,
  3: hsk3Vocabulary,
  4: hsk4Vocabulary,
};

const sampleResources: StudyResource[] = [
  {
    id: "r1",
    title: "HSK 1 Complete Course",
    description:
      "Comprehensive video course covering all HSK 1 vocabulary and grammar",
    type: "video",
    level: 1,
    url: "#",
    duration: "10 hours",
    author: "ChinesePod",
    tags: ["beginner", "vocabulary", "grammar"],
    rating: 4.8,
    downloads: 15000,
    createdAt: "2025-01-15",
  },
  {
    id: "r2",
    title: "HSK 1 Vocabulary Flashcards",
    description:
      "PDF flashcards for all 150 HSK 1 words with pinyin and examples",
    type: "pdf",
    level: 1,
    url: "#",
    author: "HSK Academy",
    tags: ["vocabulary", "flashcards", "pdf"],
    rating: 4.6,
    downloads: 25000,
    createdAt: "2025-02-01",
  },
  {
    id: "r3",
    title: "HSK 2 Listening Practice",
    description: "Audio exercises to improve listening comprehension for HSK 2",
    type: "audio",
    level: 2,
    url: "#",
    duration: "5 hours",
    author: "Mandarin Corner",
    tags: ["listening", "practice", "audio"],
    rating: 4.7,
    downloads: 8000,
    createdAt: "2025-01-20",
  },
  {
    id: "r4",
    title: "HSK 3 Grammar Guide",
    description: "Complete grammar explanations and exercises for HSK 3 level",
    type: "pdf",
    level: 3,
    url: "#",
    author: "AllSet Learning",
    tags: ["grammar", "intermediate", "exercises"],
    rating: 4.5,
    downloads: 5000,
    createdAt: "2025-02-10",
  },
  {
    id: "r5",
    title: "HSK 4 Reading Comprehension",
    description: "Practice reading passages with questions at HSK 4 level",
    type: "exercise",
    level: 4,
    url: "#",
    author: "HSK Online",
    tags: ["reading", "comprehension", "practice"],
    rating: 4.4,
    downloads: 3000,
    createdAt: "2025-02-15",
  },
  {
    id: "r6",
    title: "HSK 5 Advanced Vocabulary",
    description:
      "Advanced vocabulary building for HSK 5 with example sentences",
    type: "video",
    level: 5,
    url: "#",
    duration: "15 hours",
    author: "YoYo Chinese",
    tags: ["advanced", "vocabulary", "video"],
    rating: 4.9,
    downloads: 2000,
    createdAt: "2025-03-01",
  },
];

type TabType =
  | "learn"
  | "quiz"
  | "resources"
  | "wordlists"
  | "saved"
  | "learned";

function HighlightedSentence({
  sentence,
  highlight,
  isDark,
}: {
  sentence: string;
  highlight: string;
  isDark: boolean;
}) {
  const parts = sentence.split(new RegExp(`(${highlight})`, "gi"));

  return (
    <span>
      {parts.map((part, index) =>
        part.toLowerCase() === highlight.toLowerCase() ? (
          <span
            key={index}
            className={`font-bold ${
              isDark
                ? "text-amber-400 bg-amber-500/20 px-1 rounded"
                : "text-amber-600 bg-amber-100 px-1 rounded"
            }`}
          >
            {part}
          </span>
        ) : (
          <span key={index}>{part}</span>
        ),
      )}
    </span>
  );
}

// Global Vocabulary Search Component
interface SearchResult {
  word: VocabularyWord;
  level: number;
  globalId: number;
}

function GlobalVocabularySearch({ isDark }: { isDark: boolean }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Combine all vocabulary from all levels with global IDs
  const allLevelsVocabulary = useMemo<SearchResult[]>(
    () => [
      ...hsk1Vocabulary.map((word, idx) => ({
        word,
        level: 1,
        globalId: idx + 1,
      })),
      ...hsk2Vocabulary.map((word, idx) => ({
        word,
        level: 2,
        globalId: idx + 151,
      })),
      ...hsk3Vocabulary.map((word, idx) => ({
        word,
        level: 3,
        globalId: idx + 301,
      })),
      ...hsk4Vocabulary.map((word, idx) => ({
        word,
        level: 4,
        globalId: idx + 501,
      })),
    ],
    [],
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target as Node)
      ) {
        // Clear search when clicking outside
        setSearchTerm("");
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const searchResults = useMemo(() => {
    if (searchTerm.trim().length === 0) {
      return [];
    }

    const term = searchTerm.toLowerCase().trim();
    const isNumericSearch =
      !isNaN(parseInt(term, 10)) && parseInt(term, 10) > 0;
    const searchNumber = isNumericSearch ? parseInt(term, 10) : 0;

    const results = allLevelsVocabulary.filter(({ word, globalId }) => {
      if (isNumericSearch) {
        // Search by word ID within level
        return globalId === searchNumber;
      }
      // Text search
      return (
        word.chinese.toLowerCase().includes(term) ||
        word.pinyin.toLowerCase().includes(term) ||
        word.english.toLowerCase().includes(term)
      );
    });

    return results.slice(0, 10); // Limit to 10 results
  }, [searchTerm, allLevelsVocabulary]);

  const showResults = searchTerm.trim().length > 0;

  const getLevelColor = (level: number) => {
    const colors: Record<number, string> = {
      1: "bg-emerald-500",
      2: "bg-blue-500",
      3: "bg-violet-500",
      4: "bg-amber-500",
      5: "bg-rose-500",
      6: "bg-red-500",
    };
    return colors[level] || "bg-slate-500";
  };

  const getLevelBgColor = (level: number) => {
    const colors: Record<number, string> = {
      1: isDark ? "bg-emerald-500/20" : "bg-emerald-100",
      2: isDark ? "bg-blue-500/20" : "bg-blue-100",
      3: isDark ? "bg-violet-500/20" : "bg-violet-100",
      4: isDark ? "bg-amber-500/20" : "bg-amber-100",
      5: isDark ? "bg-rose-500/20" : "bg-rose-100",
      6: isDark ? "bg-red-500/20" : "bg-red-100",
    };
    return colors[level] || (isDark ? "bg-slate-500/20" : "bg-slate-100");
  };

  const getLevelTextColor = (level: number) => {
    const colors: Record<number, string> = {
      1: isDark ? "text-emerald-400" : "text-emerald-600",
      2: isDark ? "text-blue-400" : "text-blue-600",
      3: isDark ? "text-violet-400" : "text-violet-600",
      4: isDark ? "text-amber-400" : "text-amber-600",
      5: isDark ? "text-rose-400" : "text-rose-600",
      6: isDark ? "text-red-400" : "text-red-600",
    };
    return colors[level] || (isDark ? "text-slate-400" : "text-slate-600");
  };

  const getLevelBorderColor = (level: number) => {
    const colors: Record<number, string> = {
      1: isDark ? "border-emerald-500/30" : "border-emerald-200",
      2: isDark ? "border-blue-500/30" : "border-blue-200",
      3: isDark ? "border-violet-500/30" : "border-violet-200",
      4: isDark ? "border-amber-500/30" : "border-amber-200",
    };
    return colors[level] || (isDark ? "border-slate-700" : "border-slate-200");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setSearchTerm("");
      inputRef.current?.blur();
    }
  };

  return (
    <div ref={searchRef} className="mb-6 relative">
      {/* Header Section */}
      <div className="flex items-center gap-2 mb-3">
        <div
          className={`p-2 rounded-lg ${
            isDark
              ? "bg-gradient-to-br from-indigo-500 to-purple-600"
              : "bg-gradient-to-br from-indigo-500 to-purple-600"
          }`}
        >
          <Search className="w-4 h-4 text-white" />
        </div>
        <div>
          <h2
            className={`text-lg font-bold ${
              isDark ? "text-white" : "text-slate-900"
            }`}
          >
            Search Vocabulary
          </h2>
        </div>
      </div>

      {/* Search Container */}
      <div
        className={`p-3 rounded-xl border-2 backdrop-blur-xl transition-all duration-300 ${
          isFocused
            ? isDark
              ? "bg-slate-800/80 border-indigo-500 shadow-lg shadow-indigo-500/20"
              : "bg-white border-indigo-500 shadow-lg shadow-indigo-500/20"
            : isDark
              ? "bg-slate-800/60 border-slate-700 hover:border-slate-600"
              : "bg-white border-slate-200 shadow-sm hover:border-slate-300"
        }`}
      >
        {/* Main Search Input */}
        <div className="relative">
          <div
            className={`absolute left-3 top-1/2 -translate-y-1/2 transition-colors ${
              isFocused
                ? isDark
                  ? "text-indigo-400"
                  : "text-indigo-600"
                : isDark
                  ? "text-slate-500"
                  : "text-slate-400"
            }`}
          >
            <Search className="w-4 h-4" />
          </div>
          <input
            ref={inputRef}
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            onKeyDown={handleKeyDown}
            placeholder="Chinese / Pinyin / English / #Number"
            className={`w-full pl-9 pr-10 py-2.5 text-sm rounded-lg border-2 outline-none transition-all ${
              isDark
                ? "bg-slate-900/60 border-slate-700 text-white placeholder-slate-500 focus:border-indigo-500 focus:bg-slate-900/80"
                : "bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:bg-white"
            }`}
          />
          {searchTerm ? (
            <button
              onClick={() => {
                setSearchTerm("");
                inputRef.current?.focus();
              }}
              className={`absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-md transition-all ${
                isDark
                  ? "hover:bg-slate-700 text-slate-400 hover:text-slate-200"
                  : "hover:bg-slate-200 text-slate-500 hover:text-slate-700"
              }`}
            >
              <X className="w-4 h-4" />
            </button>
          ) : (
            <div
              className={`absolute right-3 top-1/2 -translate-y-1/2 px-1.5 py-0.5 rounded text-xs font-medium ${
                isDark
                  ? "bg-slate-700 text-slate-400"
                  : "bg-slate-200 text-slate-500"
              }`}
            >
              ⌘K
            </div>
          )}
        </div>

        {/* Search Tips */}
        {!searchTerm && (
          <div
            className={`mt-3 flex flex-wrap items-center gap-1.5 text-xs ${
              isDark ? "text-slate-500" : "text-slate-400"
            }`}
          >
            <span className="font-medium">Examples:</span>
            <button
              onClick={() => setSearchTerm("我")}
              className={`px-1.5 py-0.5 rounded transition-colors ${
                isDark
                  ? "bg-slate-700/50 hover:bg-slate-700 hover:text-slate-300"
                  : "bg-slate-100 hover:bg-slate-200 hover:text-slate-600"
              }`}
            >
              我
            </button>
            <button
              onClick={() => setSearchTerm("wǒ")}
              className={`px-1.5 py-0.5 rounded transition-colors ${
                isDark
                  ? "bg-slate-700/50 hover:bg-slate-700 hover:text-slate-300"
                  : "bg-slate-100 hover:bg-slate-200 hover:text-slate-600"
              }`}
            >
              wǒ
            </button>
            <button
              onClick={() => setSearchTerm("I")}
              className={`px-1.5 py-0.5 rounded transition-colors ${
                isDark
                  ? "bg-slate-700/50 hover:bg-slate-700 hover:text-slate-300"
                  : "bg-slate-100 hover:bg-slate-200 hover:text-slate-600"
              }`}
            >
              I
            </button>
            <button
              onClick={() => setSearchTerm("1")}
              className={`px-1.5 py-0.5 rounded transition-colors ${
                isDark
                  ? "bg-slate-700/50 hover:bg-slate-700 hover:text-slate-300"
                  : "bg-slate-100 hover:bg-slate-200 hover:text-slate-600"
              }`}
            >
              #1
            </button>
          </div>
        )}

        {/* Search Results */}
        {showResults && searchResults.length > 0 && (
          <div
            className={`mt-4 max-h-80 overflow-y-auto rounded-xl border-2 ${
              isDark
                ? "bg-slate-900/90 border-slate-700"
                : "bg-white border-slate-200"
            }`}
          >
            <div
              className={`sticky top-0 px-4 py-2 text-sm font-medium border-b flex items-center justify-between ${
                isDark
                  ? "bg-slate-800 border-slate-700 text-slate-300"
                  : "bg-slate-50 border-slate-200 text-slate-600"
              }`}
            >
              <span>
                Found{" "}
                <span className="font-bold text-indigo-500">
                  {searchResults.length}
                </span>{" "}
                result{searchResults.length !== 1 ? "s" : ""}
              </span>
              <span className="text-xs">Press ESC to close</span>
            </div>
            {searchResults.map(({ word, level, globalId }, index) => (
              <div
                key={`${level}-${word.id}`}
                className={`px-4 py-3 border-b last:border-b-0 transition-all cursor-pointer ${
                  isDark
                    ? "border-slate-800 hover:bg-slate-800/70"
                    : "border-slate-100 hover:bg-indigo-50/50"
                }`}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div
                      className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center text-lg font-bold ${
                        isDark
                          ? "bg-slate-800 text-white"
                          : "bg-slate-100 text-slate-900"
                      }`}
                    >
                      {word.chinese.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`text-lg font-bold ${
                            isDark ? "text-white" : "text-slate-900"
                          }`}
                        >
                          {word.chinese}
                        </span>
                        <span
                          className={`text-sm ${
                            isDark ? "text-indigo-400" : "text-indigo-600"
                          }`}
                        >
                          {word.pinyin}
                        </span>
                      </div>
                      <p
                        className={`text-sm truncate ${
                          isDark ? "text-slate-400" : "text-slate-600"
                        }`}
                      >
                        {word.english}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span
                      className={`text-xs px-2 py-1 rounded-md ${
                        isDark
                          ? "bg-slate-800 text-slate-500"
                          : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      #{globalId}
                    </span>
                    <div
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${getLevelBgColor(
                        level,
                      )} ${getLevelTextColor(level)} border ${getLevelBorderColor(
                        level,
                      )}`}
                    >
                      <div
                        className={`w-2 h-2 rounded-full ${getLevelColor(
                          level,
                        )}`}
                      />
                      HSK {level}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* No Results */}
        {showResults &&
          searchResults.length === 0 &&
          searchTerm.trim().length > 0 && (
            <div
              className={`mt-4 p-8 text-center rounded-xl border-2 border-dashed ${
                isDark
                  ? "bg-slate-800/40 border-slate-700"
                  : "bg-slate-50 border-slate-200"
              }`}
            >
              <div
                className={`w-16 h-16 mx-auto mb-3 rounded-full flex items-center justify-center ${
                  isDark ? "bg-slate-800" : "bg-slate-100"
                }`}
              >
                <Search
                  className={`w-8 h-8 ${
                    isDark ? "text-slate-600" : "text-slate-400"
                  }`}
                />
              </div>
              <p
                className={`text-sm font-medium ${
                  isDark ? "text-slate-300" : "text-slate-600"
                }`}
              >
                No words found for &quot;{searchTerm}&quot;
              </p>
              <p
                className={`text-xs mt-1 ${
                  isDark ? "text-slate-500" : "text-slate-400"
                }`}
              >
                Try searching with different keywords
              </p>
            </div>
          )}

        {/* Level Indicators */}
        <div
          className={`mt-4 pt-4 border-t flex items-center justify-between ${
            isDark ? "border-slate-700" : "border-slate-200"
          }`}
        >
          <div className="flex items-center gap-2">
            <span
              className={`text-xs font-medium ${
                isDark ? "text-slate-400" : "text-slate-500"
              }`}
            >
              Levels:
            </span>
            <div className="flex items-center gap-1.5">
              {[
                { level: 1, color: "bg-emerald-500" },
                { level: 2, color: "bg-blue-500" },
                { level: 3, color: "bg-violet-500" },
                { level: 4, color: "bg-amber-500" },
              ].map(({ level, color }) => (
                <div
                  key={level}
                  className={`flex items-center gap-1 px-2 py-1 rounded-md ${
                    isDark ? "bg-slate-800" : "bg-slate-100"
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${color}`} />
                  <span
                    className={`text-xs font-medium ${
                      isDark ? "text-slate-400" : "text-slate-600"
                    }`}
                  >
                    {level}
                  </span>
                </div>
              ))}
            </div>
          </div>
          <span
            className={`text-sm font-bold ${
              isDark ? "text-indigo-400" : "text-indigo-600"
            }`}
          >
            {allLevelsVocabulary.length.toLocaleString()} words
          </span>
        </div>
      </div>
    </div>
  );
}

interface LearnedWordsTabProps {
  isDark: boolean;
  learnedWords: LearnedWord[];
  toggleLearnedWord: (
    word: VocabularyWord,
    level: HSKLevel,
  ) => Promise<boolean>;
  isAuthenticated: boolean;
  onShowLoginPrompt: (action: string) => void;
}

function LearnedWordsTab({
  isDark,
  learnedWords,
  toggleLearnedWord,
  isAuthenticated,
  onShowLoginPrompt,
}: LearnedWordsTabProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLevel, setSelectedLevel] = useState<HSKLevel | "all">("all");

  const filteredWords = learnedWords.filter((word) => {
    const wordLevel = String(word.level);
    const filterLevel = String(selectedLevel);
    if (filterLevel !== "all" && wordLevel !== filterLevel) return false;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        word.chinese.toLowerCase().includes(query) ||
        word.pinyin.toLowerCase().includes(query) ||
        word.english.toLowerCase().includes(query)
      );
    }
    return true;
  });

  const handleToggleLearned = (learnedWord: LearnedWord) => {
    if (!isAuthenticated) {
      onShowLoginPrompt("toggle learned words");
      return;
    }
    const allVocab = allVocabulary[learnedWord.level] || [];
    const vocabWord = allVocab.find((v) => v.id === learnedWord.wordId);
    if (vocabWord) {
      toggleLearnedWord(vocabWord, learnedWord.level).then((isLearned) => {
        toast.success(
          isLearned ? "Word marked as learned!" : "Word removed from learned",
        );
      });
    }
  };

  return (
    <div className="space-y-6">
      <div
        className={`flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-2xl border backdrop-blur-xl ${
          isDark
            ? "bg-emerald-500/10 border-emerald-500/30"
            : "bg-emerald-50 border-emerald-200"
        }`}
      >
        <div>
          <h2
            className={`text-lg font-bold ${
              isDark ? "text-white" : "text-slate-900"
            }`}
          >
            Learned Words
          </h2>
          <p
            className={`text-xs ${
              isDark ? "text-slate-400" : "text-slate-500"
            }`}
          >
            {learnedWords.length} words marked as learned
          </p>
        </div>
        {learnedWords.length > 0 && (
          <button
            onClick={() => {
              if (!isAuthenticated) {
                onShowLoginPrompt("clear learned words");
                return;
              }
              if (
                window.confirm(
                  `Remove all ${learnedWords.length} learned words?`,
                )
              ) {
                learnedWords.forEach((w) => {
                  const allVocab = allVocabulary[w.level] || [];
                  const vocabWord = allVocab.find((v) => v.id === w.wordId);
                  if (vocabWord) toggleLearnedWord(vocabWord, w.level);
                });
                toast.success("All learned words cleared");
              }
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500 hover:bg-red-600 text-white font-medium transition-all text-sm"
          >
            <Trash2 className="w-4 h-4" />
            Clear All
          </button>
        )}
      </div>

      {learnedWords.length > 0 ? (
        <>
          <div
            className={`p-3 rounded-xl border-2 backdrop-blur-xl ${
              isDark
                ? "bg-slate-800/60 border-slate-700"
                : "bg-white border-slate-200 shadow-sm"
            }`}
          >
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedLevel("all")}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  selectedLevel === "all"
                    ? "bg-emerald-500 text-white"
                    : isDark
                      ? "bg-slate-700 hover:bg-slate-600 text-slate-300"
                      : "bg-slate-100 hover:bg-slate-200 text-slate-600"
                }`}
              >
                All Levels
              </button>
              {([1, 2, 3, 4] as HSKLevel[]).map((level) => (
                <button
                  key={level}
                  onClick={() => setSelectedLevel(level)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    selectedLevel === level
                      ? "bg-emerald-500 text-white"
                      : isDark
                        ? "bg-slate-700 hover:bg-slate-600 text-slate-300"
                        : "bg-slate-100 hover:bg-slate-200 text-slate-600"
                  }`}
                >
                  HSK {level}
                </button>
              ))}
            </div>

            <div className="relative mt-3">
              <Search
                className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${
                  isDark ? "text-slate-400" : "text-slate-500"
                }`}
              />
              <input
                type="text"
                placeholder="Search learned words..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full pl-10 pr-4 py-2 rounded-lg text-sm border-2 outline-none transition-all ${
                  isDark
                    ? "bg-slate-900 border-slate-700 text-white placeholder:text-slate-500 focus:border-emerald-500"
                    : "bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-emerald-500"
                }`}
              />
            </div>
          </div>

          <div className="grid gap-3">
            {(filteredWords.length > 0 ? filteredWords : learnedWords).map(
              (word) => (
                <div
                  key={word.id}
                  className={`p-4 rounded-xl border transition-all ${
                    isDark
                      ? "bg-slate-800/60 border-slate-700 hover:border-emerald-500/50"
                      : "bg-white border-slate-200 hover:border-emerald-300 hover:shadow-md"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <span
                        className={`text-xl font-bold shrink-0 ${
                          isDark ? "text-white" : "text-slate-900"
                        }`}
                      >
                        {word.chinese || "—"}
                      </span>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${
                          isDark
                            ? "bg-emerald-500/20 text-emerald-400"
                            : "bg-emerald-100 text-emerald-700"
                        }`}
                      >
                        HSK {word.level ?? "?"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span
                        className={`text-sm truncate ${
                          isDark ? "text-slate-400" : "text-slate-500"
                        }`}
                      >
                        {word.pinyin || "—"}
                      </span>
                      <button
                        onClick={() => handleToggleLearned(word)}
                        className={`p-2 rounded-lg transition-all ${
                          isDark
                            ? "bg-slate-700 hover:bg-red-500/20 text-emerald-400 hover:text-red-400"
                            : "bg-slate-100 hover:bg-red-100 text-emerald-500 hover:text-red-500"
                        }`}
                        title="Remove from learned"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <p
                    className={`mt-2 text-sm break-words ${
                      isDark ? "white/70" : "text-slate-600"
                    }`}
                  >
                    {word.english || "No translation available"}
                  </p>
                  {word.partOfSpeech && (
                    <span
                      className={`inline-block mt-1 text-xs px-2 py-0.5 rounded ${
                        isDark
                          ? "bg-slate-700 text-slate-300"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {word.partOfSpeech}
                    </span>
                  )}
                </div>
              ),
            )}
          </div>

          {learnedWords.length === 0 && (
            <div
              className={`text-center py-12 rounded-xl border-2 border-dashed ${
                isDark
                  ? "border-slate-700 text-slate-400"
                  : "border-slate-200 text-slate-500"
              }`}
            >
              <Check className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="font-medium">No words match your filter</p>
              <p className="text-sm mt-1">Try a different search or level</p>
            </div>
          )}
        </>
      ) : (
        <div
          className={`text-center py-16 rounded-xl border-2 border-dashed ${
            isDark
              ? "border-slate-700 text-slate-400"
              : "border-slate-200 text-slate-500"
          }`}
        >
          <Check className="w-16 h-16 mx-auto mb-4 opacity-20" />
          <h3
            className={`text-lg font-bold mb-2 ${
              isDark ? "text-white" : "text-slate-900"
            }`}
          >
            No Learned Words Yet
          </h3>
          <p className="text-sm max-w-md mx-auto">
            Mark words as learned by clicking the{" "}
            <Check className="w-4 h-4 inline" /> button on any word in the
            vocabulary list.
          </p>
        </div>
      )}
    </div>
  );
}

interface SavedWordsTabProps {
  isDark: boolean;
  savedWords: SavedWord[];
  removeSavedWord: (wordId: string) => void;
  isAuthenticated: boolean;
  onShowLoginPrompt: (action: string) => void;
}

function SavedWordsTab({
  isDark,
  savedWords,
  removeSavedWord,
  isAuthenticated,
  onShowLoginPrompt,
}: SavedWordsTabProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLevel, setSelectedLevel] = useState<HSKLevel | "all">("all");
  const [studyMode, setStudyMode] = useState(false);
  const [currentStudyIndex, setCurrentStudyIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [playingWord, setPlayingWord] = useState<string | null>(null);

  const filteredWords = savedWords.filter((word) => {
    if (selectedLevel !== "all" && word.level !== selectedLevel) return false;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        word.chinese.toLowerCase().includes(query) ||
        word.pinyin.toLowerCase().includes(query) ||
        word.english.toLowerCase().includes(query)
      );
    }
    return true;
  });

  const speakWord = (text: string, wordId: string) => {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
    }
    setTimeout(() => {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "zh-CN";
      utterance.rate = 0.8;
      setPlayingWord(wordId);
      utterance.onend = () => setPlayingWord(null);
      utterance.onerror = () => setPlayingWord(null);
      speechSynthesis.speak(utterance);
    }, 100);
  };

  const stopSpeaking = () => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      setPlayingWord(null);
    }
  };

  const handleRemoveWord = (wordId: string) => {
    removeSavedWord(wordId);
    toast.success("Word removed from saved");
  };

  const startStudyMode = () => {
    if (!isAuthenticated) {
      onShowLoginPrompt("study saved words");
      return;
    }
    if (filteredWords.length === 0) {
      toast.error("No words to study");
      return;
    }
    setStudyMode(true);
    setCurrentStudyIndex(0);
    setShowAnswer(false);
  };

  const exitStudyMode = () => {
    setStudyMode(false);
    setCurrentStudyIndex(0);
    setShowAnswer(false);
    stopSpeaking();
  };

  const nextWord = () => {
    if (currentStudyIndex < filteredWords.length - 1) {
      setCurrentStudyIndex((prev) => prev + 1);
      setShowAnswer(false);
    }
  };

  const prevWord = () => {
    if (currentStudyIndex > 0) {
      setCurrentStudyIndex((prev) => prev - 1);
      setShowAnswer(false);
    }
  };

  const getLevelColor = (level: number) => {
    const colors: Record<number, string> = {
      1: "bg-emerald-500",
      2: "bg-blue-500",
      3: "bg-violet-500",
      4: "bg-amber-500",
      5: "bg-rose-500",
      6: "bg-red-500",
    };
    return colors[level] || "bg-slate-500";
  };

  if (studyMode && filteredWords.length > 0) {
    const currentWord = filteredWords[currentStudyIndex];
    const isPlaying = playingWord === currentWord.id;

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <button
            onClick={exitStudyMode}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all ${
              isDark
                ? "bg-white/10 hover:bg-white/20 text-white"
                : "bg-slate-100 hover:bg-slate-200 text-slate-900"
            }`}
          >
            <ChevronLeft className="w-4 h-4" />
            Exit Study Mode
          </button>
          <div className="flex items-center gap-2">
            <span
              className={`text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}
            >
              {currentStudyIndex + 1} / {filteredWords.length}
            </span>
          </div>
        </div>

        <div
          className={`p-8 rounded-2xl border backdrop-blur-xl ${
            isDark
              ? "bg-slate-800/60 border-slate-700"
              : "bg-white border-slate-200 shadow-sm"
          }`}
        >
          <div className="text-center space-y-6">
            <div
              className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium ${
                isDark
                  ? "bg-slate-700 text-slate-300"
                  : "bg-slate-100 text-slate-600"
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${getLevelColor(currentWord.level)}`}
              />
              HSK {currentWord.level}
            </div>

            <div className="space-y-4">
              <p
                className={`text-6xl font-bold ${
                  isDark ? "text-white" : "text-slate-900"
                }`}
              >
                {currentWord.chinese}
              </p>
              {showAnswer && (
                <>
                  <p
                    className={`text-2xl ${
                      isDark ? "text-indigo-400" : "text-indigo-600"
                    }`}
                  >
                    {currentWord.pinyin}
                  </p>
                  <p
                    className={`text-xl ${
                      isDark ? "text-slate-300" : "text-slate-700"
                    }`}
                  >
                    {currentWord.english}
                  </p>
                  <span
                    className={`inline-block px-3 py-1 rounded-full text-sm ${
                      isDark
                        ? "bg-slate-700 text-slate-300"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {currentWord.partOfSpeech}
                  </span>
                </>
              )}
            </div>

            <div className="flex items-center justify-center gap-4">
              <button
                onClick={() =>
                  isPlaying
                    ? stopSpeaking()
                    : speakWord(currentWord.chinese, currentWord.id)
                }
                className={`p-3 rounded-xl transition-all ${
                  isPlaying
                    ? "bg-indigo-500 text-white"
                    : isDark
                      ? "bg-slate-700 hover:bg-slate-600 text-slate-300"
                      : "bg-slate-100 hover:bg-slate-200 text-slate-600"
                }`}
              >
                {isPlaying ? (
                  <VolumeX className="w-6 h-6" />
                ) : (
                  <Volume2 className="w-6 h-6" />
                )}
              </button>
              {!showAnswer ? (
                <button
                  onClick={() => setShowAnswer(true)}
                  className="px-6 py-3 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white font-medium"
                >
                  Show Answer
                </button>
              ) : (
                <button
                  onClick={() => setShowAnswer(false)}
                  className={`px-6 py-3 rounded-xl font-medium ${
                    isDark
                      ? "bg-slate-700 hover:bg-slate-600 text-white"
                      : "bg-slate-200 hover:bg-slate-300 text-slate-700"
                  }`}
                >
                  Hide Answer
                </button>
              )}
            </div>

            {showAnswer && currentWord.exampleSentence && (
              <div
                className={`mt-6 p-4 rounded-xl ${
                  isDark ? "bg-slate-700/50" : "bg-slate-50"
                }`}
              >
                <p
                  className={`text-sm font-medium mb-2 ${
                    isDark ? "text-emerald-400" : "text-emerald-600"
                  }`}
                >
                  Example
                </p>
                <p className={isDark ? "text-white" : "text-slate-900"}>
                  {currentWord.exampleSentence}
                </p>
                {currentWord.examplePinyin && (
                  <p
                    className={`text-sm mt-1 ${
                      isDark ? "text-slate-400" : "text-slate-500"
                    }`}
                  >
                    {currentWord.examplePinyin}
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center justify-between mt-8 pt-6 border-t border-slate-200 dark:border-slate-700">
            <button
              onClick={prevWord}
              disabled={currentStudyIndex === 0}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all ${
                currentStudyIndex === 0
                  ? "opacity-50 cursor-not-allowed"
                  : isDark
                    ? "bg-slate-700 hover:bg-slate-600 text-white"
                    : "bg-slate-100 hover:bg-slate-200 text-slate-900"
              }`}
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </button>

            <div className="flex gap-1">
              {filteredWords.map((_, idx) => (
                <div
                  key={idx}
                  className={`w-2 h-2 rounded-full ${
                    idx === currentStudyIndex
                      ? "bg-indigo-500"
                      : idx < currentStudyIndex
                        ? "bg-emerald-500"
                        : isDark
                          ? "bg-slate-600"
                          : "bg-slate-200"
                  }`}
                />
              ))}
            </div>

            <button
              onClick={nextWord}
              disabled={currentStudyIndex === filteredWords.length - 1}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all ${
                currentStudyIndex === filteredWords.length - 1
                  ? "opacity-50 cursor-not-allowed"
                  : isDark
                    ? "bg-slate-700 hover:bg-slate-600 text-white"
                    : "bg-slate-100 hover:bg-slate-200 text-slate-900"
              }`}
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div
            className={`p-2 rounded-lg ${
              isDark
                ? "bg-gradient-to-br from-rose-500 to-pink-600"
                : "bg-gradient-to-br from-rose-500 to-pink-600"
            }`}
          >
            <BookMarked className="w-4 h-4 text-white" />
          </div>
          <div>
            <h2
              className={`text-lg font-bold ${
                isDark ? "text-white" : "text-slate-900"
              }`}
            >
              Saved Words
            </h2>
            <p
              className={`text-xs ${
                isDark ? "text-slate-400" : "text-slate-500"
              }`}
            >
              {savedWords.length} words saved
            </p>
          </div>
        </div>

        {savedWords.length > 0 && (
          <button
            onClick={startStudyMode}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white font-medium transition-all"
          >
            <BookOpen className="w-4 h-4" />
            Study Saved Words
          </button>
        )}
      </div>

      {savedWords.length > 0 ? (
        <>
          <div
            className={`p-3 rounded-xl border-2 backdrop-blur-xl ${
              isDark
                ? "bg-slate-800/60 border-slate-700"
                : "bg-white border-slate-200 shadow-sm"
            }`}
          >
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedLevel("all")}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  selectedLevel === "all"
                    ? "bg-indigo-500 text-white"
                    : isDark
                      ? "bg-slate-700 hover:bg-slate-600 text-slate-300"
                      : "bg-slate-100 hover:bg-slate-200 text-slate-600"
                }`}
              >
                All Levels
              </button>
              {([1, 2, 3, 4, 5, 6] as HSKLevel[]).map((level) => (
                <button
                  key={level}
                  onClick={() => setSelectedLevel(level)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    selectedLevel === level
                      ? "bg-indigo-500 text-white"
                      : isDark
                        ? "bg-slate-700 hover:bg-slate-600 text-slate-300"
                        : "bg-slate-100 hover:bg-slate-200 text-slate-600"
                  }`}
                >
                  HSK {level}
                </button>
              ))}
            </div>

            <div className="relative mt-3">
              <Search
                className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${
                  isDark ? "text-slate-400" : "text-slate-500"
                }`}
              />
              <input
                type="text"
                placeholder="Search saved words..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full pl-10 pr-4 py-2 rounded-lg text-sm border-2 outline-none transition-all ${
                  isDark
                    ? "bg-slate-900/60 border-slate-700 text-white placeholder-slate-500 focus:border-indigo-500"
                    : "bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:border-indigo-500"
                }`}
              />
            </div>
          </div>

          <div className="grid gap-3">
            {filteredWords.map((word) => {
              const isPlaying = playingWord === word.id;

              return (
                <div
                  key={word.id}
                  className={`p-4 rounded-xl border transition-all ${
                    isDark
                      ? "bg-slate-800/60 border-slate-700 hover:border-slate-600"
                      : "bg-white border-slate-200 hover:shadow-md"
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div
                        className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center text-lg font-bold ${
                          isDark
                            ? "bg-slate-700 text-white"
                            : "bg-slate-100 text-slate-900"
                        }`}
                      >
                        {word.chinese.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className={`text-lg font-bold ${
                              isDark ? "text-white" : "text-slate-900"
                            }`}
                          >
                            {word.chinese}
                          </span>
                          <span
                            className={`text-sm ${
                              isDark ? "text-indigo-400" : "text-indigo-600"
                            }`}
                          >
                            {word.pinyin}
                          </span>
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full ${
                              isDark
                                ? "bg-slate-700 text-slate-300"
                                : "bg-slate-100 text-slate-600"
                            }`}
                          >
                            HSK {word.level}
                          </span>
                        </div>
                        <p
                          className={`text-sm truncate ${
                            isDark ? "text-slate-400" : "text-slate-600"
                          }`}
                        >
                          {word.english}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={() =>
                          isPlaying
                            ? stopSpeaking()
                            : speakWord(word.chinese, word.id)
                        }
                        className={`p-2 rounded-lg transition-all ${
                          isPlaying
                            ? "bg-indigo-500 text-white"
                            : isDark
                              ? "bg-slate-700 hover:bg-slate-600 text-slate-300"
                              : "bg-slate-100 hover:bg-slate-200 text-slate-600"
                        }`}
                        title={isPlaying ? "Stop" : "Listen"}
                      >
                        {isPlaying ? (
                          <VolumeX className="w-4 h-4" />
                        ) : (
                          <Volume2 className="w-4 h-4" />
                        )}
                      </button>
                      <button
                        onClick={() => handleRemoveWord(word.id)}
                        className={`p-2 rounded-lg transition-all ${
                          isDark
                            ? "bg-rose-500/20 hover:bg-rose-500/30 text-rose-400"
                            : "bg-rose-100 hover:bg-rose-200 text-rose-500"
                        }`}
                        title="Remove from saved"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {filteredWords.length === 0 && (
            <div
              className={`p-8 rounded-xl border-2 border-dashed text-center ${
                isDark
                  ? "bg-slate-800/40 border-slate-700"
                  : "bg-slate-50 border-slate-200"
              }`}
            >
              <Search className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p
                className={`text-sm ${
                  isDark ? "text-slate-400" : "text-slate-500"
                }`}
              >
                No words found matching your search
              </p>
            </div>
          )}
        </>
      ) : (
        <div
          className={`p-12 rounded-2xl border-2 border-dashed text-center ${
            isDark
              ? "bg-slate-800/40 border-slate-700"
              : "bg-slate-50 border-slate-200"
          }`}
        >
          <div
            className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${
              isDark ? "bg-slate-800" : "bg-slate-100"
            }`}
          >
            <BookMarked
              className={`w-8 h-8 ${
                isDark ? "text-slate-600" : "text-slate-400"
              }`}
            />
          </div>
          <h3
            className={`text-lg font-medium mb-2 ${
              isDark ? "text-slate-300" : "text-slate-600"
            }`}
          >
            No saved words yet
          </h3>
          <p
            className={`text-sm ${
              isDark ? "text-slate-500" : "text-slate-400"
            }`}
          >
            Click the heart icon on any word to save it here
          </p>
        </div>
      )}
    </div>
  );
}

export default function HSKPage() {
  const { isAuthenticated } = useAuth();
  const { resolvedTheme, setTheme } = useTheme();
  const navigate = useNavigate();
  const isDark = resolvedTheme === "dark";
  const [activeTab, setActiveTab] = useState<TabType>("learn");
  const [selectedLevel, setSelectedLevel] = useState<HSKLevel>(1);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [selectedVocabularyLevel, setSelectedVocabularyLevel] =
    useState<HSKLevel | null>(null);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [pendingTab, setPendingTab] = useState<TabType | null>(null);
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(
    null,
  );
  const [pendingVocabLevel, setPendingVocabLevel] = useState<
    HSKLevel | null | undefined
  >(undefined);
  const {
    getLevelProgress,
    markWordLearned,
    updateQuizStats,
    getOverallProgress,
  } = useHSKProgress();
  const { currentQuiz } = useHSKQuiz();
  const { toggleBookmark, isBookmarked } = useStudyResources();
  const { savedWords, toggleSaveWord, isWordSaved, removeSavedWord } =
    useSavedWords();
  const { learnedWords, toggleLearnedWord, isWordLearned } = useLearnedWords();
  const overallProgress = getOverallProgress();

  const handleShowLoginPrompt = (action: string) => {
    setPendingAction(action);
    setShowLoginPrompt(true);
  };

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (currentQuiz) {
        e.preventDefault();
        e.returnValue = "";
        return "";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [currentQuiz]);

  const confirmExit = () => {
    if (pendingTab) {
      setActiveTab(pendingTab);
      setPendingTab(null);
    }
    if (pendingNavigation) {
      window.location.href = pendingNavigation;
      setPendingNavigation(null);
    }
    if (pendingVocabLevel !== undefined) {
      if (pendingVocabLevel === null) {
        setSelectedVocabularyLevel(null);
      } else {
        setSelectedVocabularyLevel(pendingVocabLevel);
      }
      setPendingVocabLevel(undefined);
    }
    setShowExitConfirm(false);
  };

  const cancelExit = () => {
    setPendingTab(null);
    setPendingNavigation(null);
    setPendingVocabLevel(undefined);
    setShowExitConfirm(false);
  };

  const hskLevelData = [
    {
      level: 1 as HSKLevel,
      words: 150,
      color: "from-emerald-500 to-teal-600",
      bgColor: "bg-emerald-500/20",
      textColor: "text-emerald-400",
      description: "Beginner",
    },
    {
      level: 2 as HSKLevel,
      words: 300,
      color: "from-blue-500 to-cyan-600",
      bgColor: "bg-blue-500/20",
      textColor: "text-blue-400",
      description: "Elementary",
    },
    {
      level: 3 as HSKLevel,
      words: 600,
      color: "from-violet-500 to-purple-600",
      bgColor: "bg-violet-500/20",
      textColor: "text-violet-400",
      description: "Intermediate",
    },
    {
      level: 4 as HSKLevel,
      words: 1200,
      color: "from-amber-500 to-orange-600",
      bgColor: "bg-amber-500/20",
      textColor: "text-amber-400",
      description: "Upper-Intermediate",
    },
    {
      level: 5 as HSKLevel,
      words: 2500,
      color: "from-rose-500 to-pink-600",
      bgColor: "bg-rose-500/20",
      textColor: "text-rose-400",
      description: "Advanced",
    },
    {
      level: 6 as HSKLevel,
      words: 5000,
      color: "from-red-500 to-rose-600",
      bgColor: "bg-red-500/20",
      textColor: "text-red-400",
      description: "Proficient",
    },
    {
      level: 0 as HSKLevel,
      words: 0,
      color: "from-indigo-500 to-purple-600",
      bgColor: "bg-indigo-500/20",
      textColor: "text-indigo-400",
      description: "Grammar Master",
      isGrammar: true,
    },
  ];

  if (selectedVocabularyLevel !== null) {
    const vocabulary = allVocabulary[selectedVocabularyLevel] || [];
    return (
      <div className="min-h-screen py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={() => {
              if (currentQuiz) {
                setPendingVocabLevel(null);
                setShowExitConfirm(true);
              } else {
                setSelectedVocabularyLevel(null);
              }
            }}
            className={`flex items-center gap-2 mb-6 px-4 py-2 rounded-xl font-medium transition-all ${
              isDark
                ? "bg-white/10 hover:bg-white/20 text-white"
                : "bg-slate-100 hover:bg-slate-200 text-slate-900"
            }`}
          >
            <ChevronLeft className="w-4 h-4" />
            Back to HSK Levels
          </button>
          <VocabularyListView
            level={selectedVocabularyLevel}
            words={vocabulary}
            isDark={isDark}
            isAuthenticated={isAuthenticated}
            markWordLearned={markWordLearned}
            toggleSaveWord={toggleSaveWord}
            isWordSaved={isWordSaved}
            toggleLearnedWord={toggleLearnedWord}
            isWordLearned={isWordLearned}
          />
        </div>
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen py-8 px-4 ${isDark ? "bg-slate-950" : "bg-slate-50"}`}
    >
      <div className="max-w-6xl mx-auto">
        {/* Header with Navigation */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => {
                if (currentQuiz) {
                  setPendingNavigation("/");
                  setShowExitConfirm(true);
                } else {
                  navigate("/");
                }
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all ${
                isDark
                  ? "bg-white/10 hover:bg-white/20 text-white"
                  : "bg-slate-100 hover:bg-slate-200 text-slate-900"
              }`}
            >
              Home
            </button>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => {
                if (currentQuiz) {
                  setPendingNavigation("/language-exchange");
                  setShowExitConfirm(true);
                } else {
                  navigate("/language-exchange");
                }
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all ${
                isDark
                  ? "bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400"
                  : "bg-emerald-100 hover:bg-emerald-200 text-emerald-600"
              }`}
            >
              <Users className="w-4 h-4" />
              Language Exchange
              <ArrowRight className="w-4 h-4" />
            </button>
            <a
              href="/xingyuan-ai"
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all ${
                isDark
                  ? "bg-purple-500/20 hover:bg-purple-500/30 text-purple-400"
                  : "bg-purple-100 hover:bg-purple-200 text-purple-600"
              }`}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
              Xing Yuan AI
            </a>
            <button
              onClick={() => setTheme(isDark ? "light" : "dark")}
              className={`flex items-center justify-center p-2 rounded-xl transition-all ${
                isDark
                  ? "bg-white/10 hover:bg-white/20 text-white"
                  : "bg-slate-100 hover:bg-slate-200 text-slate-900"
              }`}
              aria-label={
                isDark ? "Switch to light mode" : "Switch to dark mode"
              }
            >
              {isDark ? (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="5" />
                  <line x1="12" y1="1" x2="12" y2="3" />
                  <line x1="12" y1="21" x2="12" y2="23" />
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                  <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                  <line x1="1" y1="12" x2="3" y2="12" />
                  <line x1="21" y1="12" x2="23" y2="12" />
                  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                  <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                </svg>
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                </svg>
              )}
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between mb-8">
          <div className="flex-1" />
          <div className="text-center flex-1">
            <h1
              className={`text-3xl md:text-4xl font-bold mb-3 ${isDark ? "text-white" : "text-slate-900"}`}
            >
              HSK Chinese Learning
            </h1>
            <p
              className={`text-lg ${isDark ? "text-slate-400" : "text-slate-600"}`}
            >
              Master Chinese with structured lessons, quizzes, and practice
            </p>
          </div>
          <div className="flex-1 flex justify-end items-center gap-2">
            <Link
              to="/hsk-2026"
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                isDark
                  ? "bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/20"
                  : "bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/20"
              }`}
            >
              <Sparkles className="w-4 h-4" />
              <span className="hidden sm:inline">HSK 2026</span>
            </Link>
            <Link
              to="/hsk/grammar"
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                isDark
                  ? "bg-blue-500/80 hover:bg-blue-500 text-white shadow-md shadow-blue-500/10"
                  : "bg-blue-500 hover:bg-blue-600 text-white shadow-md shadow-blue-500/20"
              }`}
            >
              <FileText className="w-4 h-4" />
              <span className="hidden sm:inline">Grammar</span>
            </Link>
            <button
              onClick={() => setActiveTab("saved")}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                activeTab === "saved"
                  ? isDark
                    ? "bg-blue-400 text-white"
                    : "bg-blue-400 text-white"
                  : isDark
                    ? "bg-blue-500/50 hover:bg-blue-500/70 text-white"
                    : "bg-blue-200 hover:bg-blue-300 text-blue-800"
              }`}
            >
              <BookMarked className="w-4 h-4" />
              <span className="hidden sm:inline">Saved</span>
              {savedWords.length > 0 && (
                <span
                  className={`ml-1 px-1.5 py-0.5 rounded-full text-xs ${
                    activeTab === "saved"
                      ? "bg-white/20"
                      : isDark
                        ? "bg-blue-400/30 text-blue-200"
                        : "bg-blue-100 text-blue-700"
                  }`}
                >
                  {savedWords.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab("learned")}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                activeTab === "learned"
                  ? isDark
                    ? "bg-emerald-400 text-white"
                    : "bg-emerald-400 text-white"
                  : isDark
                    ? "bg-emerald-500/50 hover:bg-emerald-500/70 text-white"
                    : "bg-emerald-200 hover:bg-emerald-300 text-emerald-800"
              }`}
            >
              <Check className="w-4 h-4" />
              <span className="hidden sm:inline">Learned</span>
              {learnedWords.length > 0 && (
                <span
                  className={`ml-1 px-1.5 py-0.5 rounded-full text-xs ${
                    activeTab === "learned"
                      ? "bg-white/20"
                      : isDark
                        ? "bg-emerald-400/30 text-emerald-200"
                        : "bg-emerald-100 text-emerald-700"
                  }`}
                >
                  {learnedWords.length}
                </span>
              )}
            </button>
          </div>
        </div>

        <div className={`grid grid-cols-2 md:grid-cols-4 gap-4 mb-8`}>
          <div
            className={`p-4 rounded-2xl border backdrop-blur-xl ${isDark ? "bg-slate-800/60 border-slate-700" : "bg-white border-slate-200 shadow-sm"}`}
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-blue-500/20">
                <BookOpen className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p
                  className={`text-2xl font-bold ${isDark ? "text-white" : "text-slate-900"}`}
                >
                  {overallProgress.totalWordsLearned}
                </p>
                <p
                  className={`text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}
                >
                  Words Learned
                </p>
              </div>
            </div>
          </div>
          <div
            className={`p-4 rounded-2xl border backdrop-blur-xl ${isDark ? "bg-slate-800/60 border-slate-700" : "bg-white border-slate-200 shadow-sm"}`}
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-green-500/20">
                <Trophy className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <p
                  className={`text-2xl font-bold ${isDark ? "text-white" : "text-slate-900"}`}
                >
                  {overallProgress.totalQuizzes}
                </p>
                <p
                  className={`text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}
                >
                  Quizzes Taken
                </p>
              </div>
            </div>
          </div>
          <div
            className={`p-4 rounded-2xl border backdrop-blur-xl ${isDark ? "bg-slate-800/60 border-slate-700" : "bg-white border-slate-200 shadow-sm"}`}
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-amber-500/20">
                <Star className="w-5 h-5 text-amber-500" />
              </div>
              <div>
                <p
                  className={`text-2xl font-bold ${isDark ? "text-white" : "text-slate-900"}`}
                >
                  {overallProgress.overallAverage}%
                </p>
                <p
                  className={`text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}
                >
                  Avg Score
                </p>
              </div>
            </div>
          </div>
          <div
            className={`p-4 rounded-2xl border backdrop-blur-xl ${isDark ? "bg-slate-800/60 border-slate-700" : "bg-white border-slate-200 shadow-sm"}`}
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-purple-500/20">
                <Award className="w-5 h-5 text-purple-500" />
              </div>
              <div>
                <p
                  className={`text-2xl font-bold ${isDark ? "text-white" : "text-slate-900"}`}
                >
                  {overallProgress.levelsCompleted}
                </p>
                <p
                  className={`text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}
                >
                  Levels Done
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Global HSK Search */}
        <GlobalVocabularySearch isDark={isDark} />

        <div className="mb-8">
          <h2
            className={`text-xl font-bold mb-4 ${isDark ? "text-white" : "text-slate-900"}`}
          >
            Select HSK Level
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {hskLevelData.map((levelData) => {
              const levelProgress = getLevelProgress(levelData.level);
              const progressPercent = Math.round(
                (levelProgress.wordsLearned / levelProgress.totalWords) * 100,
              );
              const hasVocabulary =
                allVocabulary[levelData.level] &&
                allVocabulary[levelData.level].length > 0;

              return (
                <button
                  key={levelData.level}
                  onClick={() => {
                    if (levelData.isGrammar) {
                      navigate("/hsk/grammar");
                      return;
                    }
                    if (hasVocabulary) {
                      if (currentQuiz) {
                        setPendingVocabLevel(levelData.level);
                        setShowExitConfirm(true);
                      } else {
                        setSelectedVocabularyLevel(levelData.level);
                      }
                    }
                  }}
                  disabled={!levelData.isGrammar && !hasVocabulary}
                  className={`relative p-6 rounded-2xl border transition-all duration-300 text-left overflow-hidden group ${
                    levelData.isGrammar
                      ? isDark
                        ? "bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border-indigo-500/50 hover:border-indigo-400 cursor-pointer"
                        : "bg-gradient-to-br from-indigo-50 to-purple-50 border-indigo-200 hover:border-indigo-300 hover:shadow-lg cursor-pointer"
                      : levelData.level === 1
                        ? isDark
                          ? "bg-gradient-to-br from-emerald-900/40 to-teal-900/40 border-emerald-500/30 hover:border-emerald-400 cursor-pointer"
                          : "bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-200 hover:border-emerald-300 hover:shadow-lg cursor-pointer"
                        : levelData.level === 2
                          ? isDark
                            ? "bg-gradient-to-br from-blue-900/40 to-cyan-900/40 border-blue-500/30 hover:border-blue-400 cursor-pointer"
                            : "bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200 hover:border-blue-300 hover:shadow-lg cursor-pointer"
                          : levelData.level === 3
                            ? isDark
                              ? "bg-gradient-to-br from-violet-900/40 to-purple-900/40 border-violet-500/30 hover:border-violet-400 cursor-pointer"
                              : "bg-gradient-to-br from-violet-50 to-purple-50 border-violet-200 hover:border-violet-300 hover:shadow-lg cursor-pointer"
                            : levelData.level === 4
                              ? isDark
                                ? "bg-gradient-to-br from-amber-900/40 to-orange-900/40 border-amber-500/30 hover:border-amber-400 cursor-pointer"
                                : "bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200 hover:border-amber-300 hover:shadow-lg cursor-pointer"
                              : levelData.level === 5
                                ? isDark
                                  ? "bg-gradient-to-br from-rose-900/40 to-pink-900/40 border-rose-500/30 hover:border-rose-400 cursor-pointer"
                                  : "bg-gradient-to-br from-rose-50 to-pink-50 border-rose-200 hover:border-rose-300 hover:shadow-lg cursor-pointer"
                                : levelData.level === 6
                                  ? isDark
                                    ? "bg-gradient-to-br from-red-900/40 to-rose-900/40 border-red-500/30 hover:border-red-400 cursor-pointer"
                                    : "bg-gradient-to-br from-red-50 to-rose-50 border-red-200 hover:border-red-300 hover:shadow-lg cursor-pointer"
                                  : isDark
                                    ? "bg-slate-800/30 border-slate-700/50 cursor-not-allowed opacity-50"
                                    : "bg-slate-50 border-slate-200 cursor-not-allowed opacity-50"
                  }`}
                >
                  <div
                    className={`absolute inset-0 bg-gradient-to-br ${levelData.color} opacity-0 group-hover:opacity-10 transition-opacity`}
                  />

                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-3">
                      <div
                        className={`p-3 rounded-xl bg-gradient-to-br ${levelData.color}`}
                      >
                        {levelData.isGrammar ? (
                          <FileText className="w-6 h-6 text-white" />
                        ) : (
                          <GraduationCap className="w-6 h-6 text-white" />
                        )}
                      </div>
                      {hasVocabulary && (
                        <div
                          className={`text-xs font-medium px-2 py-1 rounded-full ${levelData.bgColor} ${levelData.textColor}`}
                        >
                          {allVocabulary[levelData.level]?.length || 0} words
                        </div>
                      )}
                      {levelData.isGrammar && (
                        <div
                          className={`text-xs font-medium px-2 py-1 rounded-full ${levelData.bgColor} ${levelData.textColor}`}
                        >
                          NEW
                        </div>
                      )}
                    </div>

                    <h3
                      className={`text-xl font-bold mb-1 ${isDark ? "text-white" : "text-slate-900"}`}
                    >
                      {levelData.isGrammar
                        ? "Grammar"
                        : `HSK ${levelData.level}`}
                    </h3>
                    <p
                      className={`text-sm mb-3 ${isDark ? "text-slate-400" : "text-slate-500"}`}
                    >
                      {levelData.description}
                    </p>

                    {progressPercent > 0 && !levelData.isGrammar && (
                      <div className="mt-2">
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span
                            className={
                              isDark ? "text-slate-400" : "text-slate-500"
                            }
                          >
                            Progress
                          </span>
                          <span
                            className={
                              isDark ? "text-slate-300" : "text-slate-600"
                            }
                          >
                            {progressPercent}%
                          </span>
                        </div>
                        <div
                          className={`h-2 rounded-full overflow-hidden ${isDark ? "bg-slate-700" : "bg-slate-100"}`}
                        >
                          <div
                            className={`h-full bg-gradient-to-r ${levelData.color} transition-all`}
                            style={{ width: `${progressPercent}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {levelData.isGrammar && (
                      <Link
                        to="/hsk/grammar"
                        className="inline-flex items-center gap-2 mt-2 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-sm font-medium hover:opacity-90 transition-opacity"
                      >
                        Open Grammar
                        <ChevronRight className="w-4 h-4" />
                      </Link>
                    )}

                    {!hasVocabulary && !levelData.isGrammar && (
                      <p
                        className={`text-xs mt-2 ${isDark ? "text-slate-500" : "text-slate-400"}`}
                      >
                        Coming soon
                      </p>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Quick Access Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {/* Learn Card */}
          <div
            className={`p-5 rounded-2xl border backdrop-blur-xl transition-all ${
              isDark
                ? "bg-slate-800/60 border-slate-700 hover:border-indigo-500/50"
                : "bg-white border-slate-200 hover:shadow-lg hover:border-indigo-200"
            }`}
          >
            <div className="flex items-start justify-between mb-4">
              <div
                className={`p-3 rounded-xl ${
                  isDark ? "bg-indigo-500/20" : "bg-indigo-100"
                }`}
              >
                <BookOpen
                  className={`w-6 h-6 ${
                    isDark ? "text-indigo-400" : "text-indigo-600"
                  }`}
                />
              </div>
              <span
                className={`text-xs px-2 py-1 rounded-full ${
                  isDark
                    ? "bg-emerald-500/20 text-emerald-400"
                    : "bg-emerald-100 text-emerald-600"
                }`}
              >
                {overallProgress.totalWordsLearned} learned
              </span>
            </div>
            <h3
              className={`text-lg font-bold mb-1 ${
                isDark ? "text-white" : "text-slate-900"
              }`}
            >
              Learn Words
            </h3>
            <p
              className={`text-sm mb-4 ${
                isDark ? "text-slate-400" : "text-slate-500"
              }`}
            >
              Study vocabulary with flashcards
            </p>
            <button
              onClick={() => setActiveTab("learn")}
              className={`w-full py-2.5 rounded-xl text-sm font-medium transition-all ${
                activeTab === "learn"
                  ? "bg-indigo-500 text-white"
                  : isDark
                    ? "bg-slate-700 hover:bg-slate-600 text-white"
                    : "bg-slate-100 hover:bg-slate-200 text-slate-900"
              }`}
            >
              {activeTab === "learn" ? "Currently Learning" : "Start Learning"}
            </button>
          </div>

          {/* Quiz Card */}
          <div
            className={`p-5 rounded-2xl border backdrop-blur-xl transition-all ${
              isDark
                ? "bg-slate-800/60 border-slate-700 hover:border-amber-500/50"
                : "bg-white border-slate-200 hover:shadow-lg hover:border-amber-200"
            }`}
          >
            <div className="flex items-start justify-between mb-4">
              <div
                className={`p-3 rounded-xl ${
                  isDark ? "bg-amber-500/20" : "bg-amber-100"
                }`}
              >
                <Target
                  className={`w-6 h-6 ${
                    isDark ? "text-amber-400" : "text-amber-600"
                  }`}
                />
              </div>
              <span
                className={`text-xs px-2 py-1 rounded-full ${
                  isDark
                    ? "bg-blue-500/20 text-blue-400"
                    : "bg-blue-100 text-blue-600"
                }`}
              >
                {overallProgress.totalQuizzes} taken
              </span>
            </div>
            <h3
              className={`text-lg font-bold mb-1 ${
                isDark ? "text-white" : "text-slate-900"
              }`}
            >
              Take Quiz
            </h3>
            <p
              className={`text-sm mb-4 ${
                isDark ? "text-slate-400" : "text-slate-500"
              }`}
            >
              Test your knowledge
            </p>
            <button
              onClick={() => setActiveTab("quiz")}
              className={`w-full py-2.5 rounded-xl text-sm font-medium transition-all ${
                activeTab === "quiz"
                  ? "bg-amber-500 text-white"
                  : isDark
                    ? "bg-slate-700 hover:bg-slate-600 text-white"
                    : "bg-slate-100 hover:bg-slate-200 text-slate-900"
              }`}
            >
              {activeTab === "quiz" ? "Currently Taking Quiz" : "Start Quiz"}
            </button>
          </div>

          {/* Saved Words Card */}
          <div
            className={`p-5 rounded-2xl border backdrop-blur-xl transition-all ${
              isDark
                ? "bg-slate-800/60 border-slate-700 hover:border-rose-500/50"
                : "bg-white border-slate-200 hover:shadow-lg hover:border-rose-200"
            }`}
          >
            <div className="flex items-start justify-between mb-4">
              <div
                className={`p-3 rounded-xl ${
                  isDark ? "bg-rose-500/20" : "bg-rose-100"
                }`}
              >
                <BookMarked
                  className={`w-6 h-6 ${
                    isDark ? "text-rose-400" : "text-rose-600"
                  }`}
                />
              </div>
              <span
                className={`text-xs px-2 py-1 rounded-full ${
                  isDark
                    ? "bg-rose-500/20 text-rose-400"
                    : "bg-rose-100 text-rose-600"
                }`}
              >
                {savedWords.length} saved
              </span>
            </div>
            <h3
              className={`text-lg font-bold mb-1 ${
                isDark ? "text-white" : "text-slate-900"
              }`}
            >
              Saved Words
            </h3>
            <p
              className={`text-sm mb-4 ${
                isDark ? "text-slate-400" : "text-slate-500"
              }`}
            >
              Review your saved vocabulary
            </p>
            <button
              onClick={() => setActiveTab("saved")}
              className={`w-full py-2.5 rounded-xl text-sm font-medium transition-all ${
                activeTab === "saved"
                  ? "bg-rose-500 text-white"
                  : isDark
                    ? "bg-slate-700 hover:bg-slate-600 text-white"
                    : "bg-slate-100 hover:bg-slate-200 text-slate-900"
              }`}
            >
              {activeTab === "saved" ? "Viewing Saved" : "View Saved"}
            </button>
          </div>
        </div>

        <div
          className={`p-5 rounded-2xl border backdrop-blur-xl ${
            isDark
              ? "bg-emerald-500/10 border-emerald-500/30"
              : "bg-emerald-50 border-emerald-200"
          }`}
        >
          <div className="flex items-center gap-3 mb-3">
            <div
              className={`p-2 rounded-xl ${
                isDark ? "bg-emerald-500/20" : "bg-emerald-100"
              }`}
            >
              <Check className="w-5 h-5 text-emerald-500" />
            </div>
            <span
              className={`text-xs px-2 py-1 rounded-full ${
                isDark
                  ? "bg-emerald-500/20 text-emerald-400"
                  : "bg-emerald-100 text-emerald-600"
              }`}
            >
              {learnedWords.length} learned
            </span>
          </div>
          <h3
            className={`text-lg font-bold mb-1 ${
              isDark ? "text-white" : "text-slate-900"
            }`}
          >
            Learned Words
          </h3>
          <p
            className={`text-sm mb-4 ${
              isDark ? "text-slate-400" : "text-slate-500"
            }`}
          >
            Words you have mastered and marked as learned
          </p>
          <button
            onClick={() => setActiveTab("learned")}
            className={`w-full py-2.5 rounded-xl text-sm font-medium transition-all ${
              activeTab === "learned"
                ? "bg-emerald-500 text-white"
                : isDark
                  ? "bg-slate-700 hover:bg-slate-600 text-white"
                  : "bg-slate-100 hover:bg-slate-200 text-slate-900"
            }`}
          >
            {activeTab === "learned" ? "Viewing Learned" : "View Learned"}
          </button>
        </div>

        {/* Resources Section - Always Visible */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2
              className={`text-xl font-bold ${
                isDark ? "text-white" : "text-slate-900"
              }`}
            >
              Study Resources
            </h2>
            <button
              onClick={() => setActiveTab("resources")}
              className={`text-sm font-medium transition-colors ${
                isDark
                  ? "text-indigo-400 hover:text-indigo-300"
                  : "text-indigo-600 hover:text-indigo-700"
              }`}
            >
              {activeTab === "resources" ? "Hide Resources" : "View All"} →
            </button>
          </div>

          {activeTab === "resources" ? (
            <ResourcesTab
              isDark={isDark}
              selectedLevel={selectedLevel}
              setSelectedLevel={setSelectedLevel}
              isBookmarked={isBookmarked}
              toggleBookmark={toggleBookmark}
              isAuthenticated={isAuthenticated}
              onShowLoginPrompt={handleShowLoginPrompt}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {sampleResources.slice(0, 3).map((resource) => {
                const TypeIcon =
                  resource.type === "video"
                    ? Video
                    : resource.type === "pdf"
                      ? FileText
                      : resource.type === "audio"
                        ? Headphones
                        : BookOpen;
                return (
                  <div
                    key={resource.id}
                    onClick={() => setActiveTab("resources")}
                    className={`p-4 rounded-xl border cursor-pointer transition-all ${
                      isDark
                        ? "bg-slate-800/60 border-slate-700 hover:border-slate-600"
                        : "bg-white border-slate-200 hover:shadow-md"
                    }`}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div
                        className={`p-2 rounded-lg ${
                          isDark ? "bg-slate-700" : "bg-slate-100"
                        }`}
                      >
                        <TypeIcon
                          className={`w-4 h-4 ${
                            isDark ? "text-indigo-400" : "text-indigo-600"
                          }`}
                        />
                      </div>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ${
                          isDark
                            ? "bg-slate-700 text-slate-300"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        HSK {resource.level}
                      </span>
                    </div>
                    <h4
                      className={`font-medium text-sm mb-1 ${
                        isDark ? "text-white" : "text-slate-900"
                      }`}
                    >
                      {resource.title}
                    </h4>
                    <p
                      className={`text-xs line-clamp-2 ${
                        isDark ? "text-slate-400" : "text-slate-500"
                      }`}
                    >
                      {resource.description}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Dynamic Content Area */}
        {activeTab === "learn" && (
          <LearnTab
            isDark={isDark}
            selectedLevel={selectedLevel}
            setSelectedLevel={setSelectedLevel}
            getLevelProgress={getLevelProgress}
            markWordLearned={markWordLearned}
            isAuthenticated={isAuthenticated}
            onShowLoginPrompt={handleShowLoginPrompt}
          />
        )}

        {activeTab === "quiz" && (
          <QuizTab
            isDark={isDark}
            selectedLevel={selectedLevel}
            setSelectedLevel={setSelectedLevel}
            updateQuizStats={updateQuizStats}
            isAuthenticated={isAuthenticated}
            onShowLoginPrompt={handleShowLoginPrompt}
          />
        )}

        {activeTab === "saved" && (
          <SavedWordsTab
            isDark={isDark}
            savedWords={savedWords}
            removeSavedWord={removeSavedWord}
            isAuthenticated={isAuthenticated}
            onShowLoginPrompt={handleShowLoginPrompt}
          />
        )}

        {activeTab === "learned" && (
          <LearnedWordsTab
            isDark={isDark}
            learnedWords={learnedWords}
            toggleLearnedWord={toggleLearnedWord}
            isAuthenticated={isAuthenticated}
            onShowLoginPrompt={handleShowLoginPrompt}
          />
        )}

        {showLoginPrompt && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div
              className={`relative w-full max-w-md rounded-2xl border p-6 ${
                isDark
                  ? "bg-slate-800 border-slate-700"
                  : "bg-white border-slate-200"
              }`}
            >
              <button
                onClick={() => {
                  setShowLoginPrompt(false);
                  setPendingAction(null);
                }}
                className={`absolute top-4 right-4 p-1.5 rounded-lg transition-colors ${
                  isDark ? "hover:bg-slate-700" : "hover:bg-slate-100"
                }`}
              >
                <X
                  className={`w-5 h-5 ${isDark ? "text-slate-400" : "text-slate-500"}`}
                />
              </button>

              <div className="text-center">
                <div
                  className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4 ${
                    isDark ? "bg-indigo-500/20" : "bg-indigo-100"
                  }`}
                >
                  <LogIn
                    className={`w-8 h-8 ${isDark ? "text-indigo-400" : "text-indigo-600"}`}
                  />
                </div>

                <h3
                  className={`text-xl font-bold mb-2 ${isDark ? "text-white" : "text-slate-900"}`}
                >
                  Sign in Required
                </h3>
                <p
                  className={`text-sm mb-6 ${isDark ? "text-slate-400" : "text-slate-500"}`}
                >
                  You need to be signed in to {pendingAction}. Create an account
                  or sign in to save your progress.
                </p>

                <div className="flex gap-3">
                  <Link
                    to="/login"
                    className={`flex-1 py-2.5 rounded-xl text-center font-medium transition-colors ${
                      isDark
                        ? "bg-slate-700 hover:bg-slate-600 text-white"
                        : "bg-slate-100 hover:bg-slate-200 text-slate-900"
                    }`}
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/signup"
                    className="flex-1 py-2.5 rounded-xl text-center font-medium bg-indigo-500 hover:bg-indigo-600 text-white"
                  >
                    Create Account
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}

        {showExitConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div
              className={`relative w-full max-w-md rounded-2xl border p-6 ${
                isDark
                  ? "bg-slate-800 border-slate-700"
                  : "bg-white border-slate-200"
              }`}
            >
              <h3
                className={`text-xl font-bold mb-2 ${isDark ? "text-white" : "text-slate-900"}`}
              >
                Exit Quiz?
              </h3>
              <p
                className={`text-sm mb-6 ${isDark ? "text-slate-400" : "text-slate-500"}`}
              >
                Are you sure you want to exit the quiz? Your progress will be
                lost.
              </p>

              <div className="flex gap-3">
                <button
                  onClick={cancelExit}
                  className={`flex-1 py-2.5 rounded-xl text-center font-medium transition-colors ${
                    isDark
                      ? "bg-slate-700 hover:bg-slate-600 text-white"
                      : "bg-slate-100 hover:bg-slate-200 text-slate-900"
                  }`}
                >
                  Stay in Quiz
                </button>
                <button
                  onClick={confirmExit}
                  className="flex-1 py-2.5 rounded-xl text-center font-medium bg-red-500 hover:bg-red-600 text-white"
                >
                  Exit Quiz
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function VocabularyListView({
  level,
  words,
  isDark,
  isAuthenticated,
  markWordLearned,
  toggleSaveWord,
  isWordSaved,
  toggleLearnedWord,
  isWordLearned,
}: {
  level: HSKLevel;
  words: VocabularyWord[];
  isDark: boolean;
  isAuthenticated: boolean;
  markWordLearned: (
    level: HSKLevel,
    wordId: string,
    mastered?: boolean,
  ) => void;
  toggleSaveWord: (word: VocabularyWord, level: HSKLevel) => Promise<boolean>;
  isWordSaved: (wordId: number, level: HSKLevel) => boolean;
  toggleLearnedWord: (
    word: VocabularyWord,
    level: HSKLevel,
  ) => Promise<boolean>;
  isWordLearned: (wordId: number, level: HSKLevel) => boolean;
}) {
  const { resolvedTheme, setTheme } = useTheme();
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedWord, setExpandedWord] = useState<number | null>(null);
  const [manualPage, setManualPage] = useState(1);
  const [playingWord, setPlayingWord] = useState<number | null>(null);
  const [shareModalWord, setShareModalWord] = useState<VocabularyWord | null>(
    null,
  );
  const [shareHeading, setShareHeading] = useState<string>("");
  const wordCardRefs = useRef<Map<number, HTMLDivElement>>(new Map());

  const WORDS_PER_PAGE_LOCAL = 20;

  const levelStartId = useMemo<Record<number, number>>(
    () => ({
      1: 1,
      2: 151,
      3: 301,
      4: 501,
      5: 1201,
      6: 2501,
    }),
    [],
  );

  const getWordPosition = (wordId: number): number => {
    return wordId - (levelStartId[level] || 1) + 1;
  };

  const isNumericSearch =
    !isNaN(parseInt(searchTerm, 10)) && parseInt(searchTerm, 10) > 0;

  const computedHighlightedWordId = useMemo(() => {
    const numericQuery = parseInt(searchTerm, 10);
    if (!isNaN(numericQuery) && numericQuery > 0) {
      return (levelStartId[level] || 1) + numericQuery - 1;
    }
    return null;
  }, [searchTerm, level, levelStartId]);

  // Compute target page from search term
  const computedTargetPage = useMemo(() => {
    if (!computedHighlightedWordId) return null;
    const numericQuery = parseInt(searchTerm, 10);
    if (isNaN(numericQuery) || numericQuery <= 0) return null;
    return Math.ceil(numericQuery / WORDS_PER_PAGE_LOCAL);
  }, [computedHighlightedWordId, searchTerm]);

  // Effective current page: use computed target page during search, otherwise manual page
  const currentPage = computedTargetPage ?? manualPage;

  const filteredWords = words.filter((word) => {
    if (isNumericSearch) {
      return true;
    }
    if (!searchTerm.trim()) {
      return true;
    }
    return (
      word.chinese.includes(searchTerm) ||
      word.pinyin.toLowerCase().includes(searchTerm.toLowerCase()) ||
      word.english.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const totalPages = Math.ceil(filteredWords.length / WORDS_PER_PAGE_LOCAL);
  const startIndex = (currentPage - 1) * WORDS_PER_PAGE_LOCAL;
  const endIndex = startIndex + WORDS_PER_PAGE_LOCAL;
  const currentWords = filteredWords.slice(startIndex, endIndex);

  const toggleExpand = (id: number) => {
    setExpandedWord(expandedWord === id ? null : id);
    // Mark word as learned when expanded
    if (isAuthenticated) {
      markWordLearned(level, id.toString());
    }
  };

  const speakWord = (text: string, wordId: number) => {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
    }
    setTimeout(() => {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "zh-CN";
      utterance.rate = 0.8;
      setPlayingWord(wordId);
      utterance.onend = () => setPlayingWord(null);
      utterance.onerror = () => setPlayingWord(null);
      speechSynthesis.speak(utterance);

      if (isAuthenticated) {
        markWordLearned(level, wordId.toString());
      }
    }, 100);
  };

  const stopSpeaking = () => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      setPlayingWord(null);
    }
  };

  useEffect(() => {
    if (computedHighlightedWordId && currentWords.length > 0) {
      const timer = setTimeout(() => {
        const cardElement = wordCardRefs.current.get(computedHighlightedWordId);
        if (cardElement) {
          cardElement.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [computedHighlightedWordId, currentWords]);

  const handlePageChange = (page: number) => {
    setManualPage(page);
    setExpandedWord(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const getPartOfSpeechColor = (pos: string) => {
    const colors: Record<string, string> = {
      verb: "bg-blue-500/20 text-blue-400 border-blue-500/30",
      noun: "bg-green-500/20 text-green-400 border-green-500/30",
      adjective: "bg-purple-500/20 text-purple-400 border-purple-500/30",
      pronoun: "bg-amber-500/20 text-amber-400 border-amber-500/30",
      number: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
      adverb: "bg-rose-500/20 text-rose-400 border-rose-500/30",
      particle: "bg-slate-500/20 text-slate-400 border-slate-500/30",
      phrase: "bg-teal-500/20 text-teal-400 border-teal-500/30",
      "measure word": "bg-indigo-500/20 text-indigo-400 border-indigo-500/30",
      preposition: "bg-orange-500/20 text-orange-400 border-orange-500/30",
      conjunction: "bg-pink-500/20 text-pink-400 border-pink-500/30",
      "proper noun": "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
      "verb phrase": "bg-violet-500/20 text-violet-400 border-violet-500/30",
      interjection: "bg-red-500/20 text-red-400 border-red-500/30",
      "verb/noun": "bg-blue-500/20 text-blue-400 border-blue-500/30",
      "noun/verb": "bg-green-500/20 text-green-400 border-green-500/30",
      "adjective/adverb":
        "bg-purple-500/20 text-purple-400 border-purple-500/30",
    };
    return colors[pos] || "bg-slate-500/20 text-slate-400 border-slate-500/30";
  };

  const getNumberStyle = (id: number) => {
    const gradients = [
      {
        from: "from-rose-500",
        to: "to-pink-600",
        bg: "bg-rose-500/20",
        text: "text-rose-400",
      },
      {
        from: "from-orange-500",
        to: "to-amber-600",
        bg: "bg-orange-500/20",
        text: "text-orange-400",
      },
      {
        from: "from-amber-500",
        to: "to-yellow-600",
        bg: "bg-amber-500/20",
        text: "text-amber-400",
      },
      {
        from: "from-lime-500",
        to: "to-green-600",
        bg: "bg-lime-500/20",
        text: "text-lime-400",
      },
      {
        from: "from-emerald-500",
        to: "to-teal-600",
        bg: "bg-emerald-500/20",
        text: "text-emerald-400",
      },
      {
        from: "from-cyan-500",
        to: "to-sky-600",
        bg: "bg-cyan-500/20",
        text: "text-cyan-400",
      },
      {
        from: "from-blue-500",
        to: "to-indigo-600",
        bg: "bg-blue-500/20",
        text: "text-blue-400",
      },
      {
        from: "from-violet-500",
        to: "to-purple-600",
        bg: "bg-violet-500/20",
        text: "text-violet-400",
      },
      {
        from: "from-fuchsia-500",
        to: "to-pink-600",
        bg: "bg-fuchsia-500/20",
        text: "text-fuchsia-400",
      },
      {
        from: "from-pink-500",
        to: "to-rose-600",
        bg: "bg-pink-500/20",
        text: "text-pink-400",
      },
    ];
    const index = (id - 1) % gradients.length;
    return gradients[index];
  };

  const renderPagination = () => {
    if (totalPages <= 1) return null;

    const pages = [];
    const maxVisiblePages = 7;

    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return (
      <div
        className={`flex items-center justify-center gap-2 mt-8 pt-6 border-t ${isDark ? "border-white/10" : "border-slate-200"}`}
      >
        <button
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className={`p-2 rounded-lg transition-all ${
            currentPage === 1
              ? "opacity-50 cursor-not-allowed"
              : isDark
                ? "hover:bg-white/10 text-white"
                : "hover:bg-slate-100 text-slate-900"
          }`}
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        {startPage > 1 && (
          <>
            <button
              onClick={() => handlePageChange(1)}
              className={`w-10 h-10 rounded-lg font-medium transition-all ${
                isDark
                  ? "hover:bg-white/10 text-white"
                  : "hover:bg-slate-100 text-slate-900"
              }`}
            >
              1
            </button>
            {startPage > 2 && (
              <span
                className={`px-2 ${isDark ? "text-white/40" : "text-slate-400"}`}
              >
                ...
              </span>
            )}
          </>
        )}

        {pages.map((page) => (
          <button
            key={page}
            onClick={() => handlePageChange(page)}
            className={`w-10 h-10 rounded-lg font-medium transition-all ${
              page === currentPage
                ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-white"
                : isDark
                  ? "hover:bg-white/10 text-white"
                  : "hover:bg-slate-100 text-slate-900"
            }`}
          >
            {page}
          </button>
        ))}

        {endPage < totalPages && (
          <>
            {endPage < totalPages - 1 && (
              <span
                className={`px-2 ${isDark ? "text-white/40" : "text-slate-400"}`}
              >
                ...
              </span>
            )}
            <button
              onClick={() => handlePageChange(totalPages)}
              className={`w-10 h-10 rounded-lg font-medium transition-all ${
                isDark
                  ? "hover:bg-white/10 text-white"
                  : "hover:bg-slate-100 text-slate-900"
              }`}
            >
              {totalPages}
            </button>
          </>
        )}

        <button
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className={`p-2 rounded-lg transition-all ${
            currentPage === totalPages
              ? "opacity-50 cursor-not-allowed"
              : isDark
                ? "hover:bg-white/10 text-white"
                : "hover:bg-slate-100 text-slate-900"
          }`}
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    );
  };

  return (
    <div className="w-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600">
            <GraduationCap className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2
              className={`text-2xl font-bold ${isDark ? "text-white" : "text-slate-900"}`}
            >
              HSK {level} Vocabulary
            </h2>
            <p
              className={`text-sm ${isDark ? "text-white/60" : "text-slate-500"}`}
            >
              {filteredWords.length} words
              {searchTerm && ` matching "${searchTerm}"`}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Saved Words */}
          <button
            onClick={() => {
              // Navigate back to main HSK page and open saved tab
              window.location.href = "/hsk?tab=saved";
            }}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all ${
              isDark
                ? "bg-slate-800 hover:bg-rose-500/20 text-slate-300 hover:text-rose-400 border border-slate-700"
                : "bg-white hover:bg-rose-50 text-slate-600 hover:text-rose-500 border border-slate-200 shadow-sm"
            }`}
            title="Saved Words"
          >
            <BookMarked className="w-4 h-4" />
            <span className="hidden sm:inline">Saved</span>
          </button>

          {/* Theme Toggle */}
          <button
            onClick={() => {
              const newTheme = resolvedTheme === "dark" ? "light" : "dark";
              setTheme(newTheme);
            }}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all ${
              isDark
                ? "bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700"
                : "bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 shadow-sm"
            }`}
            title="Toggle Theme"
          >
            {isDark ? (
              <Sun className="w-4 h-4" />
            ) : (
              <Moon className="w-4 h-4" />
            )}
            <span className="hidden sm:inline">Theme</span>
          </button>

          {/* Social Page Link */}
          <Link
            to="/social"
            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all ${
              isDark
                ? "bg-slate-800 hover:bg-pink-500/20 text-slate-300 hover:text-pink-400 border border-slate-700"
                : "bg-white hover:bg-pink-50 text-slate-600 hover:text-pink-500 border border-slate-200 shadow-sm"
            }`}
            title="Social"
          >
            <Users className="w-4 h-4" />
            <span className="hidden sm:inline">Social</span>
          </Link>

          {/* Share Button */}
          <button
            onClick={() => {
              const shareData = {
                title: `HSK ${level} Vocabulary`,
                text: `Check out HSK ${level} vocabulary list!`,
                url: window.location.href,
              };
              if (navigator.share) {
                navigator.share(shareData);
              } else {
                navigator.clipboard.writeText(window.location.href);
                toast.success("Link copied to clipboard!");
              }
            }}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all ${
              isDark
                ? "bg-slate-800 hover:bg-blue-500/20 text-slate-300 hover:text-blue-400 border border-slate-700"
                : "bg-white hover:bg-blue-50 text-slate-600 hover:text-blue-500 border border-slate-200 shadow-sm"
            }`}
            title="Share"
          >
            <Share2 className="w-4 h-4" />
            <span className="hidden sm:inline">Share</span>
          </button>

          {/* Language Exchange */}
          <Link
            to="/language-exchange"
            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all ${
              isDark
                ? "bg-slate-800 hover:bg-emerald-500/20 text-slate-300 hover:text-emerald-400 border border-slate-700"
                : "bg-white hover:bg-emerald-50 text-slate-600 hover:text-emerald-500 border border-slate-200 shadow-sm"
            }`}
            title="Language Exchange"
          >
            <Globe className="w-4 h-4" />
            <span className="hidden sm:inline">Exchange</span>
          </Link>

          {/* AI Assistant */}
          <a
            href="/xingyuan-ai"
            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all ${
              isDark
                ? "bg-gradient-to-r from-violet-500/20 to-purple-500/20 hover:from-violet-500/30 hover:to-purple-500/30 text-violet-300 border border-violet-500/30"
                : "bg-gradient-to-r from-violet-50 to-purple-50 hover:from-violet-100 hover:to-purple-100 text-violet-600 border border-violet-200 shadow-sm"
            }`}
            title="AI Assistant"
          >
            <Sparkles className="w-4 h-4" />
            <span className="hidden sm:inline">AI</span>
          </a>
        </div>
      </div>

      <div className="relative mb-6">
        <Search
          className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 ${
            isDark ? "text-white/40" : "text-slate-400"
          }`}
        />
        <input
          type="text"
          placeholder="Search by number, Chinese, Pinyin, or English..."
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            const numericQuery = parseInt(e.target.value, 10);
            if (isNaN(numericQuery) || numericQuery <= 0) {
              setManualPage(1);
            }
          }}
          className={`w-full pl-12 pr-4 py-3 rounded-xl text-base transition-all ${
            isDark
              ? "bg-white/5 border-white/10 text-white placeholder:text-white/40 focus:border-emerald-500/50"
              : "bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-emerald-500"
          } border focus:outline-none focus:ring-2 focus:ring-emerald-500/20`}
        />
        {searchTerm && (
          <button
            onClick={() => setSearchTerm("")}
            className={`absolute right-4 top-1/2 -translate-y-1/2 p-1 rounded-full ${
              isDark
                ? "text-white/40 hover:text-white/70 hover:bg-white/10"
                : "text-slate-400 hover:text-slate-600 hover:bg-slate-100"
            }`}
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="grid gap-3">
        {currentWords.map((word) => {
          const wordPosition = getWordPosition(word.id);
          const numberStyle = getNumberStyle(wordPosition);
          const isPlaying = playingWord === word.id;
          const isSaved = isWordSaved(word.id, level);
          const isLearned = isWordLearned(word.id, level);

          const getLevelCardStyle = (lvl: HSKLevel) => {
            const styles: Record<number, { light: string; dark: string }> = {
              1: {
                light:
                  "bg-emerald-100/70 border-emerald-300 hover:border-emerald-400",
                dark: "bg-emerald-400/15 border-emerald-400/40 hover:bg-emerald-400/25 hover:border-emerald-400/60",
              },
              2: {
                light: "bg-sky-100/70 border-sky-300 hover:border-sky-400",
                dark: "bg-sky-400/15 border-sky-400/40 hover:bg-sky-400/25 hover:border-sky-400/60",
              },
              3: {
                light:
                  "bg-violet-100/70 border-violet-300 hover:border-violet-400",
                dark: "bg-violet-400/15 border-violet-400/40 hover:bg-violet-400/25 hover:border-violet-400/60",
              },
              4: {
                light:
                  "bg-amber-100/70 border-amber-300 hover:border-amber-400",
                dark: "bg-amber-400/15 border-amber-400/40 hover:bg-amber-400/25 hover:border-amber-400/60",
              },
              5: {
                light: "bg-rose-100/70 border-rose-300 hover:border-rose-400",
                dark: "bg-rose-400/15 border-rose-400/40 hover:bg-rose-400/25 hover:border-rose-400/60",
              },
              6: {
                light:
                  "bg-orange-100/70 border-orange-300 hover:border-orange-400",
                dark: "bg-orange-400/15 border-orange-400/40 hover:bg-orange-400/25 hover:border-orange-400/60",
              },
            };
            return styles[lvl] || styles[1];
          };

          const cardStyle = getLevelCardStyle(level);

          return (
            <div
              key={word.id}
              ref={(el) => {
                if (el) {
                  wordCardRefs.current.set(word.id, el);
                }
              }}
              className={`rounded-xl overflow-hidden transition-all duration-300 ${
                computedHighlightedWordId === word.id
                  ? "ring-4 ring-yellow-400 ring-offset-2"
                  : ""
              } ${
                isDark
                  ? `${cardStyle.dark} hover:shadow-lg`
                  : `${cardStyle.light} hover:shadow-lg`
              } border`}
            >
              <div
                className="p-4 cursor-pointer"
                onClick={() => toggleExpand(word.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    <div
                      className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm ${
                        isDark
                          ? `${numberStyle.bg} ${numberStyle.text}`
                          : `bg-gradient-to-br ${numberStyle.from} ${numberStyle.to} text-white`
                      }`}
                    >
                      {getWordPosition(word.id)}
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (isPlaying) {
                          stopSpeaking();
                        } else {
                          speakWord(word.chinese, word.id);
                        }
                      }}
                      className={`p-2 rounded-lg transition-all flex-shrink-0 ${
                        isPlaying
                          ? "bg-cyan-500 text-white"
                          : isDark
                            ? "bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400"
                            : "bg-cyan-100 hover:bg-cyan-200 text-cyan-600"
                      }`}
                      title={isPlaying ? "Stop" : "Listen to pronunciation"}
                    >
                      {isPlaying ? (
                        <VolumeX className="w-5 h-5" />
                      ) : (
                        <Volume2 className="w-5 h-5" />
                      )}
                    </button>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 flex-wrap">
                        <span
                          className={`text-2xl font-bold ${
                            isDark ? "text-white" : "text-slate-900"
                          }`}
                        >
                          {word.chinese}
                        </span>
                        <span
                          className={`text-lg ${
                            isDark ? "text-emerald-400" : "text-emerald-600"
                          }`}
                        >
                          {word.pinyin}
                        </span>
                        <span
                          className={`px-2 py-0.5 text-xs font-medium rounded-full border ${
                            isDark
                              ? getPartOfSpeechColor(word.partOfSpeech)
                              : "bg-slate-100 text-slate-600 border-slate-200"
                          }`}
                        >
                          {word.partOfSpeech}
                        </span>
                      </div>
                      <p
                        className={`text-base mt-1 ${
                          isDark ? "text-white/70" : "text-slate-600"
                        }`}
                      >
                        {word.english}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShareModalWord(word);
                      }}
                      className={`p-2 rounded-lg transition-all ${
                        isDark
                          ? "bg-slate-700 hover:bg-indigo-500/20 text-slate-400 hover:text-indigo-400"
                          : "bg-slate-100 hover:bg-indigo-100 text-slate-400 hover:text-indigo-500"
                      }`}
                      title="Share word"
                    >
                      <Share2 className="w-5 h-5" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleLearnedWord(word, level).then((learned) => {
                          toast.success(
                            learned
                              ? "Word marked as learned!"
                              : "Word removed from learned",
                          );
                        });
                      }}
                      className={`p-2 rounded-lg transition-all ${
                        isLearned
                          ? "bg-emerald-500 text-white"
                          : isDark
                            ? "bg-slate-700 hover:bg-emerald-500/20 text-slate-400 hover:text-emerald-400"
                            : "bg-slate-100 hover:bg-emerald-100 text-slate-400 hover:text-emerald-500"
                      }`}
                      title={
                        isLearned ? "Remove from learned" : "Mark as learned"
                      }
                    >
                      <Check
                        className={`w-5 h-5 ${isLearned ? "fill-current" : ""}`}
                      />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleSaveWord(word, level).then((saved) => {
                          toast.success(
                            saved ? "Word saved!" : "Word removed from saved",
                          );
                        });
                      }}
                      className={`p-2 rounded-lg transition-all ${
                        isSaved
                          ? "bg-rose-500 text-white"
                          : isDark
                            ? "bg-slate-700 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400"
                            : "bg-slate-100 hover:bg-rose-100 text-slate-400 hover:text-rose-500"
                      }`}
                      title={isSaved ? "Remove from saved" : "Save word"}
                    >
                      <Heart
                        className={`w-5 h-5 ${isSaved ? "fill-current" : ""}`}
                      />
                    </button>
                    <div
                      className={`transition-transform duration-300 ${
                        expandedWord === word.id ? "rotate-180" : ""
                      }`}
                    >
                      <ChevronDown
                        className={`w-5 h-5 ${
                          isDark ? "text-white/40" : "text-slate-400"
                        }`}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {expandedWord === word.id && (
                <div
                  className={`px-4 pb-4 pt-0 border-t ${
                    isDark ? "border-white/10" : "border-slate-100"
                  }`}
                >
                  <div className="mt-4 space-y-3">
                    {word.exampleSentence && (
                      <div>
                        <p
                          className={`text-xs font-semibold uppercase tracking-wider mb-1 ${
                            isDark ? "text-emerald-400" : "text-emerald-600"
                          }`}
                        >
                          Example Sentence
                        </p>
                        <p
                          className={`text-base ${
                            isDark ? "text-white" : "text-slate-900"
                          }`}
                        >
                          <HighlightedSentence
                            sentence={word.exampleSentence}
                            highlight={word.chinese}
                            isDark={isDark}
                          />
                        </p>
                        {word.examplePinyin && (
                          <p
                            className={`text-sm mt-1 ${
                              isDark
                                ? "text-emerald-400/70"
                                : "text-emerald-600"
                            }`}
                          >
                            {word.examplePinyin}
                          </p>
                        )}
                        <p
                          className={`text-sm ${
                            isDark ? "text-white/60" : "text-slate-500"
                          }`}
                        >
                          {word.exampleTranslation}
                        </p>
                      </div>
                    )}

                    {word.notes && (
                      <div>
                        <p
                          className={`text-xs font-semibold uppercase tracking-wider mb-1 ${
                            isDark ? "text-amber-400" : "text-amber-600"
                          }`}
                        >
                          Notes
                        </p>
                        <p
                          className={`text-sm ${
                            isDark ? "text-white/70" : "text-slate-600"
                          }`}
                        >
                          {word.notes}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {filteredWords.length === 0 && (
        <div
          className={`text-center py-12 ${
            isDark ? "text-white/50" : "text-slate-500"
          }`}
        >
          <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p className="text-lg">No words found matching "{searchTerm}"</p>
          <button
            onClick={() => setSearchTerm("")}
            className="mt-4 text-emerald-500 hover:text-emerald-400 font-medium"
          >
            Clear search
          </button>
        </div>
      )}

      {renderPagination()}

      {/* Share Modal */}
      {shareModalWord && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={() => setShareModalWord(null)}
        >
          <div
            className={`w-full max-w-md rounded-2xl border shadow-2xl ${
              isDark
                ? "bg-slate-800 border-slate-700"
                : "bg-white border-slate-200"
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
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
                Share Word
              </h3>
              <button
                onClick={() => setShareModalWord(null)}
                className={`p-1 rounded-lg transition-colors ${
                  isDark
                    ? "hover:bg-slate-700 text-slate-400"
                    : "hover:bg-slate-100 text-slate-500"
                }`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Word Preview */}
            <div className="p-4">
              <div
                className={`p-4 rounded-xl mb-4 ${
                  isDark ? "bg-slate-700/50" : "bg-slate-50"
                }`}
              >
                <p
                  className={`text-2xl font-bold mb-1 ${
                    isDark ? "text-white" : "text-slate-900"
                  }`}
                >
                  {shareModalWord.chinese}
                </p>
                <p
                  className={`text-sm ${
                    isDark ? "text-indigo-400" : "text-indigo-600"
                  }`}
                >
                  {shareModalWord.pinyin}
                </p>
                <p
                  className={`text-sm mt-1 ${
                    isDark ? "text-slate-300" : "text-slate-600"
                  }`}
                >
                  {shareModalWord.english}
                </p>
              </div>

              {/* Heading Input */}
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

              {/* Share Options */}
              <div className="space-y-3">
                {/* Create Post on NCWU Social */}
                <Link
                  to="/social"
                  state={{
                    createPost: true,
                    postHeading: shareHeading || undefined,
                    postContent: `📚 I am learning: ${shareModalWord.chinese} (${shareModalWord.pinyin}) - ${shareModalWord.english}\n\n🔗 Learn more HSK words at: ${window.location.origin}/hsk\n\n#HSK${level} #NCWU #HuashuiHSK #LanguageLearning #Chinese`,
                  }}
                  onClick={() => {
                    setShareModalWord(null);
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

                {/* Copy Link */}
                <button
                  onClick={() => {
                    const shareText = `Check out this HSK word: "${shareModalWord.chinese}" (${shareModalWord.pinyin}) - ${shareModalWord.english}\n\nLearn more at: ${window.location.origin}/hsk?level=${level}&word=${shareModalWord.id}\n\n#HSK${level} #NCWU #HuashuiHSK`;
                    navigator.clipboard.writeText(shareText);
                    toast.success("Copied to clipboard!");
                    setShareModalWord(null);
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
                    <p className="font-medium">Copy Link</p>
                    <p
                      className={`text-xs ${
                        isDark ? "text-slate-400" : "text-slate-500"
                      }`}
                    >
                      Copy word details and link
                    </p>
                  </div>
                </button>

                {/* Native Share (Mobile) */}
                {navigator.share && (
                  <button
                    onClick={() => {
                      navigator.share({
                        title: `HSK Word: ${shareModalWord.chinese}`,
                        text: `"${shareModalWord.chinese}" (${shareModalWord.pinyin}) - ${shareModalWord.english}`,
                        url: `${window.location.origin}/hsk?level=${level}&word=${shareModalWord.id}`,
                      });
                      setShareModalWord(null);
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
                      <p className="font-medium">Share via...</p>
                      <p
                        className={`text-xs ${
                          isDark ? "text-emerald-400" : "text-emerald-500"
                        }`}
                      >
                        Use your device's share menu
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

interface LearnTabProps {
  isDark: boolean;
  selectedLevel: HSKLevel;
  setSelectedLevel: (level: HSKLevel) => void;
  getLevelProgress: (level: HSKLevel) => HSKProgress;
  markWordLearned: (
    level: HSKLevel,
    wordId: string,
    mastered?: boolean,
  ) => void;
  isAuthenticated: boolean;
  onShowLoginPrompt: (action: string) => void;
}

function LearnTab({
  isDark,
  selectedLevel,
  setSelectedLevel,
  getLevelProgress,
  markWordLearned,
  isAuthenticated,
  onShowLoginPrompt,
}: LearnTabProps) {
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const levelProgress = getLevelProgress(selectedLevel);
  // Use actual vocabulary data instead of sampleWords
  const levelWords = allVocabulary[selectedLevel] || [];

  const handleNextWord = () => {
    if (currentWordIndex < levelWords.length - 1) {
      setCurrentWordIndex((prev) => prev + 1);
      setShowAnswer(false);
    }
  };

  const handlePrevWord = () => {
    if (currentWordIndex > 0) {
      setCurrentWordIndex((prev) => prev - 1);
      setShowAnswer(false);
    }
  };

  const handleMarkLearned = (mastered: boolean) => {
    if (!isAuthenticated) {
      onShowLoginPrompt("track your learning progress");
      return;
    }
    const word = levelWords[currentWordIndex];
    if (word) {
      markWordLearned(selectedLevel, String(word.id), mastered);
      toast.success(mastered ? "Word mastered!" : "Added to practicing");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        {([1, 2, 3, 4, 5, 6] as HSKLevel[]).map((level) => {
          const lp = getLevelProgress(level);
          const progressPercent = Math.round(
            (lp.wordsLearned / lp.totalWords) * 100,
          );
          return (
            <button
              key={level}
              onClick={() => {
                setSelectedLevel(level);
                setCurrentWordIndex(0);
              }}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all relative overflow-hidden ${
                selectedLevel === level
                  ? isDark
                    ? "bg-indigo-500 text-white"
                    : "bg-indigo-500 text-white"
                  : isDark
                    ? "bg-slate-700 hover:bg-slate-600 text-slate-300"
                    : "bg-slate-100 hover:bg-slate-200 text-slate-600"
              }`}
            >
              <span className="relative z-10">HSK {level}</span>
              {progressPercent > 0 && (
                <div
                  className="absolute bottom-0 left-0 h-1 bg-green-500 transition-all"
                  style={{ width: `${progressPercent}%` }}
                />
              )}
            </button>
          );
        })}
      </div>

      <div
        className={`p-6 rounded-2xl border backdrop-blur-xl ${isDark ? "bg-slate-800/60 border-slate-700" : "bg-white border-slate-200 shadow-sm"}`}
      >
        <div className="flex items-center justify-between mb-4">
          <h2
            className={`text-xl font-bold ${isDark ? "text-white" : "text-slate-900"}`}
          >
            {hskLevelLabels[selectedLevel]}
          </h2>
          <div className="flex items-center gap-2">
            <span
              className={`text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}
            >
              {levelProgress.wordsLearned} / {levelProgress.totalWords} words
            </span>
            <div
              className={`w-32 h-2 rounded-full overflow-hidden ${isDark ? "bg-slate-700" : "bg-slate-200"}`}
            >
              <div
                className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all"
                style={{
                  width: `${(levelProgress.wordsLearned / levelProgress.totalWords) * 100}%`,
                }}
              />
            </div>
          </div>
        </div>

        {levelWords.length > 0 ? (
          <div className="space-y-4">
            <div
              className={`p-8 rounded-xl text-center ${isDark ? "bg-slate-700/50" : "bg-slate-50"}`}
            >
              <p
                className={`text-5xl font-bold mb-4 ${isDark ? "text-white" : "text-slate-900"}`}
              >
                {levelWords[currentWordIndex]?.chinese}
              </p>
              <p
                className={`text-2xl mb-2 ${isDark ? "text-indigo-400" : "text-indigo-600"}`}
              >
                {levelWords[currentWordIndex]?.pinyin}
              </p>
              {showAnswer && (
                <div className="mt-4 space-y-2">
                  <p
                    className={`text-xl ${isDark ? "text-slate-300" : "text-slate-700"}`}
                  >
                    {levelWords[currentWordIndex]?.english}
                  </p>
                  <p
                    className={`text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}
                  >
                    {levelWords[currentWordIndex]?.partOfSpeech}
                  </p>
                  {levelWords[currentWordIndex]?.exampleSentence && (
                    <div
                      className={`mt-4 p-4 rounded-lg ${isDark ? "bg-slate-600/50" : "bg-slate-100"}`}
                    >
                      <p
                        className={`text-sm mb-2 ${isDark ? "text-slate-400" : "text-slate-500"}`}
                      >
                        Example:
                      </p>
                      <p
                        className={`text-lg ${isDark ? "text-white" : "text-slate-900"}`}
                      >
                        {levelWords[currentWordIndex]?.exampleSentence}
                      </p>
                      <p
                        className={`text-sm ${isDark ? "text-indigo-400" : "text-indigo-600"}`}
                      >
                        {levelWords[currentWordIndex]?.examplePinyin}
                      </p>
                      <p
                        className={`text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}
                      >
                        {levelWords[currentWordIndex]?.exampleTranslation}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center justify-between">
              <button
                onClick={handlePrevWord}
                disabled={currentWordIndex === 0}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-colors ${
                  currentWordIndex === 0
                    ? "opacity-50 cursor-not-allowed"
                    : isDark
                      ? "hover:bg-slate-700 text-slate-300"
                      : "hover:bg-slate-100 text-slate-600"
                }`}
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </button>

              <div className="flex items-center gap-2">
                {!showAnswer ? (
                  <button
                    onClick={() => setShowAnswer(true)}
                    className="px-4 py-2 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white"
                  >
                    Show Answer
                  </button>
                ) : (
                  <>
                    <button
                      onClick={() => handleMarkLearned(false)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-xl ${
                        isDark
                          ? "bg-slate-700 hover:bg-slate-600 text-slate-300"
                          : "bg-slate-100 hover:bg-slate-200 text-slate-600"
                      }`}
                    >
                      <Check className="w-4 h-4" />
                      Practicing
                      {!isAuthenticated && (
                        <Lock className="w-3 h-3 ml-1 opacity-50" />
                      )}
                    </button>
                    <button
                      onClick={() => handleMarkLearned(true)}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-green-500 hover:bg-green-600 text-white"
                    >
                      <Star className="w-4 h-4" />
                      Mastered
                      {!isAuthenticated && (
                        <Lock className="w-3 h-3 ml-1 opacity-50" />
                      )}
                    </button>
                  </>
                )}
              </div>

              <button
                onClick={handleNextWord}
                disabled={currentWordIndex === levelWords.length - 1}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-colors ${
                  currentWordIndex === levelWords.length - 1
                    ? "opacity-50 cursor-not-allowed"
                    : isDark
                      ? "hover:bg-slate-700 text-slate-300"
                      : "hover:bg-slate-100 text-slate-600"
                }`}
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <div className="flex justify-center gap-1 mt-4">
              {levelWords.map((_, idx) => (
                <div
                  key={idx}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    idx === currentWordIndex
                      ? "bg-indigo-500"
                      : idx < currentWordIndex
                        ? "bg-green-500"
                        : isDark
                          ? "bg-slate-600"
                          : "bg-slate-200"
                  }`}
                />
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <p className={isDark ? "text-slate-400" : "text-slate-500"}>
              No words available for this level yet.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

interface QuizTabProps {
  isDark: boolean;
  selectedLevel: HSKLevel;
  setSelectedLevel: (level: HSKLevel) => void;
  updateQuizStats: (level: HSKLevel, score: number) => void;
  isAuthenticated: boolean;
  onShowLoginPrompt: (action: string) => void;
}

function QuizTab({
  isDark,
  selectedLevel,
  setSelectedLevel,
  updateQuizStats,
  isAuthenticated,
  onShowLoginPrompt,
}: QuizTabProps) {
  const {
    currentQuiz,
    currentQuestionIndex,
    answers,
    startQuiz,
    answerQuestion,
    nextQuestion,
    previousQuestion,
    submitQuiz,
    isLastQuestion,
    isFirstQuestion,
  } = useHSKQuiz();
  const [quizResult, setQuizResult] = useState<HSKQuizResult | null>(null);
  const [showVocabularyQuiz, setShowVocabularyQuiz] = useState(false);
  const [vocabQuizLevel, setVocabQuizLevel] = useState<HSKLevel>(1);
  const [showQuizSettings, setShowQuizSettings] = useState(false);
  const [currentQuizSettings, setCurrentQuizSettings] =
    useState<QuizSettings | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [timeEnded, setTimeEnded] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const handleSubmit = useCallback(async () => {
    const result = await submitQuiz();
    if (result) {
      setQuizResult(result);
      const percentage = Math.round((result.score / result.totalPoints) * 100);
      if (isAuthenticated) {
        updateQuizStats(selectedLevel, percentage);
      }
    }
  }, [isAuthenticated, selectedLevel, submitQuiz, updateQuizStats]);

  useEffect(() => {
    if (currentQuiz?.timeLimit && !quizResult) {
      const totalSeconds = currentQuiz.timeLimit;

      timerRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
          // Initialize on first tick if needed
          if (prev === null) {
            return totalSeconds;
          }
          if (prev <= 1) {
            if (timerRef.current) {
              clearInterval(timerRef.current);
            }
            if (prev === 1) {
              setTimeEnded(true);
              handleSubmit();
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      // Cleanup: clear interval and reset timer state
      return () => {
        if (timerRef.current) {
          clearInterval(timerRef.current);
        }
        // Reset timer state when effect cleans up (quiz changes or ends)
        setTimeRemaining(null);
      };
    }
    // When no timer is active, ensure state is cleared
    // This runs when quiz has no timeLimit or quizResult exists
    return () => {
      // No-op cleanup for non-timer case
    };
  }, [currentQuiz?.id, currentQuiz?.timeLimit, quizResult, handleSubmit]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleStartCustomQuiz = (settings: QuizSettings) => {
    if (!isAuthenticated) {
      onShowLoginPrompt("take quizzes and save your results");
      return;
    }

    const vocabulary = allVocabulary[selectedLevel];
    if (!vocabulary) return;

    const quiz = generateQuiz(vocabulary, settings, selectedLevel);
    setCurrentQuizSettings(settings);
    setQuizResult(null);

    const hskQuiz: HSKQuiz = {
      id: quiz.id,
      level: quiz.level,
      title: quiz.title,
      questions: quiz.questions,
      timeLimit: quiz.timeLimit || undefined,
      passingScore: quiz.passingScore,
    };

    startQuiz(hskQuiz);
    setShowQuizSettings(false);
  };

  if (quizResult && currentQuizSettings) {
    return (
      <QuizResults
        result={quizResult}
        settings={currentQuizSettings}
        level={selectedLevel}
        isDark={isDark}
        timeEnded={timeEnded}
        onRetry={() => {
          setQuizResult(null);
          setTimeEnded(false);
          setShowQuizSettings(true);
        }}
      />
    );
  }

  if (currentQuiz) {
    const question = currentQuiz.questions[currentQuestionIndex];

    // Determine what to show based on question content
    const showChinese =
      question.chinese && !question.english && !question.pinyin;
    const showEnglish =
      question.english && !question.chinese && !question.pinyin;
    const showPinyin =
      question.pinyin && !question.chinese && !question.english;
    const showChineseWithPinyin =
      question.chinese && question.pinyin && !question.english;

    return (
      <div
        className={`p-4 sm:p-6 rounded-2xl border backdrop-blur-xl ${isDark ? "bg-slate-800/60 border-slate-700" : "bg-white border-slate-200 shadow-sm"}`}
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
          <h2
            className={`text-lg font-bold ${isDark ? "text-white" : "text-slate-900"}`}
          >
            {currentQuiz.title}
          </h2>
          <div className="flex items-center gap-4">
            {timeRemaining !== null && (
              <div
                className={`flex items-center gap-2 px-4 py-2 rounded-xl font-mono ${
                  timeRemaining <= 60
                    ? "bg-red-500/20 animate-pulse"
                    : timeRemaining <= 300
                      ? "bg-amber-500/20"
                      : isDark
                        ? "bg-emerald-500/20"
                        : "bg-emerald-100"
                }`}
              >
                <Clock
                  className={`w-4 h-4 ${
                    timeRemaining <= 60
                      ? "text-red-400"
                      : timeRemaining <= 300
                        ? "text-amber-400"
                        : isDark
                          ? "text-emerald-400"
                          : "text-emerald-600"
                  }`}
                />
                <span
                  className={`text-xl font-bold ${
                    timeRemaining <= 60
                      ? "text-red-400"
                      : timeRemaining <= 300
                        ? "text-amber-400"
                        : isDark
                          ? "text-emerald-400"
                          : "text-emerald-600"
                  }`}
                >
                  {formatTime(timeRemaining)}
                </span>
              </div>
            )}
            <span
              className={`text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}
            >
              Question {currentQuestionIndex + 1} /{" "}
              {currentQuiz.questions.length}
            </span>
          </div>
        </div>

        <div
          className={`p-4 sm:p-6 rounded-xl mb-6 ${isDark ? "bg-slate-700/50" : "bg-slate-50"}`}
        >
          {/* Show Chinese character */}
          {showChinese && (
            <>
              <p
                className={`text-2xl sm:text-3xl font-bold text-center mb-2 ${isDark ? "text-white" : "text-slate-900"}`}
              >
                {question.chinese}
              </p>
              <p
                className={`text-center text-sm sm:text-base ${isDark ? "text-slate-400" : "text-slate-500"}`}
              >
                What does this mean?
              </p>
            </>
          )}

          {/* Show English word */}
          {showEnglish && (
            <>
              <p
                className={`text-xl sm:text-2xl font-bold text-center mb-2 ${isDark ? "text-white" : "text-slate-900"}`}
              >
                {question.english}
              </p>
              <p
                className={`text-center text-sm sm:text-base ${isDark ? "text-slate-400" : "text-slate-500"}`}
              >
                Select the correct Chinese character
              </p>
            </>
          )}

          {/* Show Pinyin */}
          {showPinyin && (
            <>
              <p
                className={`text-2xl sm:text-3xl font-bold text-center mb-2 ${isDark ? "text-white" : "text-slate-900"}`}
              >
                {question.pinyin}
              </p>
              <p
                className={`text-center text-sm sm:text-base ${isDark ? "text-slate-400" : "text-slate-500"}`}
              >
                Select the correct answer
              </p>
            </>
          )}

          {/* Show Chinese with Pinyin hint */}
          {showChineseWithPinyin && (
            <>
              <p
                className={`text-2xl sm:text-3xl font-bold text-center mb-2 ${isDark ? "text-white" : "text-slate-900"}`}
              >
                {question.chinese}
              </p>
              <p
                className={`text-center text-base sm:text-lg mb-2 ${isDark ? "text-indigo-400" : "text-indigo-600"}`}
              >
                {question.pinyin}
              </p>
              <p
                className={`text-center text-sm sm:text-base ${isDark ? "text-slate-400" : "text-slate-500"}`}
              >
                What does this mean?
              </p>
            </>
          )}
        </div>

        {question.options ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
            {question.options.map((option: string, idx: number) => {
              const isSelected = answers[question.id] === option;
              const correctAnswerValue = question.correctAnswer || (question.correct_answer !== undefined ? question.options[question.correct_answer] : "");
              const isCorrect = option === correctAnswerValue;
              const hasAnswered = answers[question.id] !== undefined;

              return (
                <button
                  key={idx}
                  onClick={() => answerQuestion(question.id, option)}
                  className={`p-3 sm:p-4 rounded-xl text-left transition-all ${
                    hasAnswered
                      ? isCorrect
                        ? "bg-emerald-500 text-white ring-2 ring-emerald-400"
                        : isSelected
                          ? "bg-red-500 text-white ring-2 ring-red-400"
                          : isDark
                            ? "bg-slate-700/50 text-slate-400"
                            : "bg-slate-100/50 text-slate-400"
                      : isSelected
                        ? "bg-indigo-500 text-white ring-2 ring-indigo-400"
                        : isDark
                          ? "bg-slate-700 hover:bg-slate-600 text-slate-300"
                          : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm sm:text-base">{option}</span>
                    {hasAnswered &&
                      (isCorrect ? (
                        <Check className="w-4 h-4 sm:w-5 sm:h-5" />
                      ) : isSelected ? (
                        <X className="w-4 h-4 sm:w-5 sm:h-5" />
                      ) : null)}
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          <input
            type="text"
            value={answers[question.id] || ""}
            onChange={(e) => answerQuestion(question.id, e.target.value)}
            placeholder="Type your answer..."
            className={`w-full p-3 sm:p-4 rounded-xl text-sm sm:text-lg mb-6 ${
              isDark
                ? "bg-slate-700 text-white placeholder-slate-400 border-slate-600"
                : "bg-slate-50 text-slate-900 placeholder-slate-400 border-slate-200"
            } border`}
          />
        )}

        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
          <button
            onClick={previousQuestion}
            disabled={isFirstQuestion}
            className={`flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-3 rounded-xl font-semibold transition-all w-full sm:w-auto ${
              isFirstQuestion
                ? "opacity-50 cursor-not-allowed bg-slate-200 text-slate-400 dark:bg-slate-700 dark:text-slate-500"
                : "bg-amber-500 hover:bg-amber-600 text-white shadow-lg shadow-amber-500/30"
            }`}
          >
            <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
            Previous
          </button>

          {isLastQuestion ? (
            <button
              onClick={handleSubmit}
              className="flex items-center gap-2 px-6 sm:px-8 py-2 sm:py-3 rounded-xl font-semibold bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/30 transition-all w-full sm:w-auto"
            >
              <Check className="w-4 h-4 sm:w-5 sm:h-5" />
              Submit Quiz
            </button>
          ) : (
            <button
              onClick={nextQuestion}
              className="flex items-center gap-2 px-6 sm:px-8 py-2 sm:py-3 rounded-xl font-semibold bg-indigo-500 hover:bg-indigo-600 text-white shadow-lg shadow-indigo-500/30 transition-all w-full sm:w-auto"
            >
              Next
              <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        {([1, 2, 3, 4, 5, 6] as HSKLevel[]).map((level) => (
          <button
            key={level}
            onClick={() => setSelectedLevel(level)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              selectedLevel === level
                ? "bg-indigo-500 text-white"
                : isDark
                  ? "bg-slate-700 hover:bg-slate-600 text-slate-300"
                  : "bg-slate-100 hover:bg-slate-200 text-slate-600"
            }`}
          >
            HSK {level}
          </button>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Custom Quiz Creation Card */}
        <div
          className={`p-6 rounded-2xl border backdrop-blur-xl ${isDark ? "bg-slate-800/60 border-slate-700" : "bg-white border-slate-200 shadow-sm"}`}
        >
          <div className="flex items-start gap-4">
            <div
              className={`p-3 rounded-xl ${
                isDark ? "bg-indigo-500/20" : "bg-indigo-100"
              }`}
            >
              <Target
                className={`w-6 h-6 ${
                  isDark ? "text-indigo-400" : "text-indigo-600"
                }`}
              />
            </div>
            <div className="flex-1">
              <h3
                className={`text-lg font-bold mb-2 ${
                  isDark ? "text-white" : "text-slate-900"
                }`}
              >
                Custom HSK {selectedLevel} Quiz
              </h3>
              <p
                className={`text-sm mb-4 ${
                  isDark ? "text-slate-400" : "text-slate-500"
                }`}
              >
                Create a personalized quiz with your preferred settings. Choose
                question types, word range, and more.
              </p>
              <div className="flex flex-wrap gap-2 mb-4">
                <span
                  className={`text-xs px-2 py-1 rounded-full ${
                    isDark
                      ? "bg-slate-700 text-slate-300"
                      : "bg-slate-100 text-slate-600"
                  }`}
                >
                  Multiple Question Types
                </span>
                <span
                  className={`text-xs px-2 py-1 rounded-full ${
                    isDark
                      ? "bg-slate-700 text-slate-300"
                      : "bg-slate-100 text-slate-600"
                  }`}
                >
                  Custom Word Range
                </span>
                <span
                  className={`text-xs px-2 py-1 rounded-full ${
                    isDark
                      ? "bg-slate-700 text-slate-300"
                      : "bg-slate-100 text-slate-600"
                  }`}
                >
                  Optional Timer
                </span>
              </div>
              <button
                onClick={() => setShowQuizSettings(true)}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white"
              >
                <Play className="w-4 h-4" />
                Create Quiz
                {!isAuthenticated && (
                  <Lock className="w-3 h-3 ml-1 opacity-70" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Quiz Settings Modal */}
        <QuizSettingsComponent
          isOpen={showQuizSettings}
          onClose={() => setShowQuizSettings(false)}
          onStart={handleStartCustomQuiz}
          level={selectedLevel}
          isDark={isDark}
        />
      </div>

      {/* Vocabulary Quiz Section */}
      <div className="mt-8">
        <h3
          className={`text-xl font-bold mb-4 ${isDark ? "text-white" : "text-slate-900"}`}
        >
          Random Vocabulary Quiz
        </h3>
        <p className={`mb-4 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
          Test your knowledge with 10 random vocabulary questions from your
          selected HSK level.
        </p>

        {showVocabularyQuiz ? (
          <RandomVocabularyQuiz
            level={vocabQuizLevel}
            onClose={() => setShowVocabularyQuiz(false)}
          />
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {([1, 2, 3, 4] as HSKLevel[]).map((level) => {
              const levelColors: Record<number, { from: string; to: string }> =
                {
                  1: { from: "from-emerald-500", to: "to-teal-600" },
                  2: { from: "from-blue-500", to: "to-cyan-600" },
                  3: { from: "from-violet-500", to: "to-purple-600" },
                  4: { from: "from-amber-500", to: "to-orange-600" },
                };
              const colors = levelColors[level];

              return (
                <div
                  key={level}
                  className={`p-5 rounded-2xl border backdrop-blur-xl ${
                    isDark
                      ? "bg-slate-800/60 border-slate-700"
                      : "bg-white border-slate-200 shadow-sm"
                  }`}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div
                      className={`p-2.5 rounded-xl bg-gradient-to-br ${colors.from} ${colors.to}`}
                    >
                      <Target className="w-5 h-5 text-white" />
                    </div>
                    <h4
                      className={`text-lg font-bold ${
                        isDark ? "text-white" : "text-slate-900"
                      }`}
                    >
                      HSK {level} Quiz
                    </h4>
                  </div>
                  <p
                    className={`text-sm mb-4 ${
                      isDark ? "text-slate-400" : "text-slate-500"
                    }`}
                  >
                    10 random vocabulary questions
                  </p>
                  <button
                    onClick={() => {
                      if (!isAuthenticated) {
                        onShowLoginPrompt("take quizzes and save your results");
                        return;
                      }
                      setVocabQuizLevel(level);
                      setShowVocabularyQuiz(true);
                    }}
                    className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-medium bg-gradient-to-r ${colors.from} ${colors.to} text-white hover:shadow-lg transition-all`}
                  >
                    <Play className="w-4 h-4" />
                    Start Quiz
                    {!isAuthenticated && (
                      <Lock className="w-3 h-3 ml-1 opacity-70" />
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

interface ResourcesTabProps {
  isDark: boolean;
  selectedLevel: HSKLevel;
  setSelectedLevel: (level: HSKLevel) => void;
  isBookmarked: (id: string) => boolean;
  toggleBookmark: (id: string) => void;
  isAuthenticated: boolean;
  onShowLoginPrompt: (action: string) => void;
}

function ResourcesTab({
  isDark,
  selectedLevel,
  setSelectedLevel,
  isBookmarked,
  toggleBookmark,
  isAuthenticated,
  onShowLoginPrompt,
}: ResourcesTabProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");

  const filteredResources = sampleResources.filter((r) => {
    if (r.level !== selectedLevel) return false;
    if (typeFilter !== "all" && r.type !== typeFilter) return false;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        r.title.toLowerCase().includes(query) ||
        r.description.toLowerCase().includes(query)
      );
    }
    return true;
  });

  const typeIcons = {
    video: Video,
    pdf: FileText,
    audio: Headphones,
    link: ExternalLink,
    exercise: BookOpen,
  };

  const handleToggleBookmark = (id: string) => {
    if (!isAuthenticated) {
      onShowLoginPrompt("bookmark resources");
      return;
    }
    toggleBookmark(id);
    toast.success(
      isBookmarked(id) ? "Bookmark removed" : "Resource bookmarked",
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        {([1, 2, 3, 4, 5, 6] as HSKLevel[]).map((level) => (
          <button
            key={level}
            onClick={() => setSelectedLevel(level)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              selectedLevel === level
                ? "bg-indigo-500 text-white"
                : isDark
                  ? "bg-slate-700 hover:bg-slate-600 text-slate-300"
                  : "bg-slate-100 hover:bg-slate-200 text-slate-600"
            }`}
          >
            HSK {level}
          </button>
        ))}
      </div>

      <div
        className={`p-4 rounded-2xl border backdrop-blur-xl ${isDark ? "bg-slate-800/60 border-slate-700" : "bg-white border-slate-200 shadow-sm"}`}
      >
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search
              className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? "text-slate-400" : "text-slate-500"}`}
            />
            <input
              type="text"
              placeholder="Search resources..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full pl-10 pr-4 py-2 rounded-xl text-sm border ${
                isDark
                  ? "bg-slate-700 border-slate-600 text-white placeholder-slate-400"
                  : "bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400"
              } outline-none`}
            />
          </div>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className={`px-3 py-2 rounded-xl text-sm border ${
              isDark
                ? "bg-slate-700 border-slate-600 text-white"
                : "bg-slate-50 border-slate-200 text-slate-900"
            } outline-none`}
          >
            <option value="all">All Types</option>
            <option value="video">Videos</option>
            <option value="pdf">PDFs</option>
            <option value="audio">Audio</option>
            <option value="exercise">Exercises</option>
          </select>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {filteredResources.length > 0 ? (
          filteredResources.map((resource) => {
            const TypeIcon = typeIcons[resource.type];
            return (
              <div
                key={resource.id}
                className={`p-5 rounded-2xl border backdrop-blur-xl ${isDark ? "bg-slate-800/60 border-slate-700" : "bg-white border-slate-200 shadow-sm"}`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-2 rounded-xl ${isDark ? "bg-slate-700" : "bg-slate-100"}`}
                    >
                      <TypeIcon
                        className={`w-5 h-5 ${isDark ? "text-indigo-400" : "text-indigo-600"}`}
                      />
                    </div>
                    <div>
                      <h3
                        className={`font-bold ${isDark ? "text-white" : "text-slate-900"}`}
                      >
                        {resource.title}
                      </h3>
                      <p
                        className={`text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}
                      >
                        {resource.author}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleToggleBookmark(resource.id)}
                    className={`p-2 rounded-lg transition-colors ${
                      isBookmarked(resource.id)
                        ? "text-amber-500"
                        : isDark
                          ? "hover:bg-slate-700 text-slate-400"
                          : "hover:bg-slate-100 text-slate-400"
                    }`}
                  >
                    <Bookmark
                      className={`w-5 h-5 ${isBookmarked(resource.id) ? "fill-current" : ""}`}
                    />
                  </button>
                </div>
                <p
                  className={`text-sm mb-3 ${isDark ? "text-slate-400" : "text-slate-500"}`}
                >
                  {resource.description}
                </p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                      <span
                        className={`text-sm ${isDark ? "text-slate-300" : "text-slate-600"}`}
                      >
                        {resource.rating}
                      </span>
                    </div>
                    {resource.duration && (
                      <span
                        className={`text-xs ${isDark ? "text-slate-500" : "text-slate-400"}`}
                      >
                        {resource.duration}
                      </span>
                    )}
                  </div>
                  <a
                    href={resource.url}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm ${
                      isDark
                        ? "bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-400"
                        : "bg-indigo-100 hover:bg-indigo-200 text-indigo-600"
                    }`}
                  >
                    View
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            );
          })
        ) : (
          <div
            className={`col-span-2 p-8 rounded-2xl border text-center ${isDark ? "bg-slate-800/60 border-slate-700" : "bg-white border-slate-200 shadow-sm"}`}
          >
            <p className={isDark ? "text-slate-400" : "text-slate-500"}>
              No resources found for this level.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
