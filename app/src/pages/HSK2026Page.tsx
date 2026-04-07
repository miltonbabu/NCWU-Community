import { useState, useEffect, useCallback, useRef } from "react";
import { Link } from "react-router-dom";
import { useTheme } from "@/components/ThemeProvider";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
} from "@/components/ui/carousel";
import { api } from "@/lib/api";
import {
  BookOpen,
  Search,
  ChevronRight,
  Star,
  CheckCircle,
  Loader2,
  MessageSquare,
  Copy,
  Share2,
  Heart,
  Volume2,
  Play,
  Pause,
  RotateCcw,
  Shuffle,
  Layers,
  Presentation,
  Sparkles,
  ChevronLeft,
  Settings,
  X,
  Eye,
  EyeOff,
  Keyboard,
  Target,
  Languages,
  Users,
  Globe,
} from "lucide-react";
import { hskApi } from "@/lib/api";
import { toast } from "sonner";
import VocabularyQuiz from "@/components/VocabularyQuiz";

interface HSKWord {
  id: number;
  word: string;
  pinyin: string;
  pos: string;
  english?: string;
  level?: number | string;
}

interface WordCardProps {
  word: HSKWord;
  index: number;
  isDark: boolean;
  isLearned: boolean;
  isSaved: boolean;
  onToggleLearned: (wordId: number, wordData: HSKWord) => void;
  onToggleSaved: (wordId: number, wordData: HSKWord) => void;
  onCopy: () => void;
  onShare: () => void;
  onSpeak: () => void;
}

interface PaginationControlsProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  isDark: boolean;
}

function PaginationControls({
  currentPage,
  totalPages,
  onPageChange,
  isDark,
}: PaginationControlsProps) {
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      // Show all pages
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Show first page
      pages.push(1);

      if (currentPage > 3) {
        pages.push("...");
      }

      // Show pages around current page
      for (
        let i = Math.max(2, currentPage - 1);
        i <= Math.min(totalPages - 1, currentPage + 1);
        i++
      ) {
        if (!pages.includes(i)) {
          pages.push(i);
        }
      }

      if (currentPage < totalPages - 2) {
        pages.push("...");
      }

      // Show last page
      if (!pages.includes(totalPages)) {
        pages.push(totalPages);
      }
    }

    return pages;
  };

  return (
    <div className="flex items-center justify-center gap-2 mt-8">
      <Button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className={`px-3 py-1.5 text-sm ${
          currentPage === 1
            ? "opacity-50 cursor-not-allowed"
            : "hover:scale-105"
        }`}
        variant="outline"
      >
        Previous
      </Button>

      <div className="flex items-center gap-1">
        {getPageNumbers().map((page, index) =>
          page === "..." ? (
            <span
              key={`ellipsis-${index}`}
              className={`px-3 py-1.5 ${
                isDark ? "text-slate-400" : "text-slate-500"
              }`}
            >
              ...
            </span>
          ) : (
            <Button
              key={page}
              onClick={() => onPageChange(page as number)}
              variant={currentPage === page ? "default" : "outline"}
              className={`w-10 h-10 p-0 ${
                currentPage === page
                  ? "bg-blue-500 hover:bg-blue-600 text-white"
                  : isDark
                    ? "bg-slate-800 hover:bg-slate-700"
                    : "bg-white hover:bg-slate-100"
              }`}
            >
              {page}
            </Button>
          ),
        )}
      </div>

      <Button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className={`px-3 py-1.5 text-sm ${
          currentPage === totalPages
            ? "opacity-50 cursor-not-allowed"
            : "hover:scale-105"
        }`}
        variant="outline"
      >
        Next
      </Button>
    </div>
  );
}

const posToEnglish: Record<string, string> = {
  动: "Verb",
  名: "Noun",
  形: "Adjective",
  副: "Adverb",
  代: "Pronoun",
  介: "Preposition",
  连: "Conjunction",
  助: "Particle",
  叹: "Interjection",
  量: "Measure Word",
  数: "Number",
  前: "Prefix",
  后: "Suffix",
  象: "Onomatopoeia",
  v: "Verb",
  n: "Noun",
  adj: "Adjective",
  adv: "Adverb",
  pron: "Pronoun",
  prep: "Preposition",
  conj: "Conjunction",
  part: "Particle",
  int: "Interjection",
  mw: "Measure Word",
  num: "Number",
};

const getPosInEnglish = (pos: string): string => {
  return posToEnglish[pos] || pos;
};

function WordCard({
  word,
  index,
  isDark,
  isLearned,
  isSaved,
  onToggleLearned,
  onToggleSaved,
  onCopy,
  onShare,
  onSpeak,
}: WordCardProps) {
  return (
    <div
      className={`p-3 sm:p-4 rounded-xl border transition-all hover:shadow-lg ${
        isLearned
          ? isDark
            ? "bg-green-900/20 border-green-700/50"
            : "bg-green-50 border-green-200"
          : isDark
            ? "bg-slate-800/50 border-slate-700 hover:bg-slate-800"
            : "bg-white border-slate-200 hover:bg-slate-50"
      }`}
    >
      {/* Header with index and actions */}
      <div className="flex items-center justify-between mb-2 sm:mb-3">
        <div className="flex items-center gap-1 sm:gap-2">
          <span
            className={`text-[10px] sm:text-xs font-mono ${
              isDark ? "text-slate-500" : "text-slate-400"
            }`}
          >
            #{index + 1}
          </span>
          {isLearned && (
            <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-500" />
          )}
        </div>
        <div className="flex items-center gap-0.5 sm:gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onSpeak();
            }}
            className={`p-1 sm:p-1.5 rounded-lg transition-all ${
              isDark
                ? "hover:bg-slate-700 text-slate-400 hover:text-blue-400"
                : "hover:bg-slate-200 text-slate-500 hover:text-blue-600"
            }`}
            title="Listen to pronunciation"
          >
            <Volume2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onCopy();
            }}
            className={`p-1 sm:p-1.5 rounded-lg transition-all ${
              isDark
                ? "hover:bg-slate-700 text-slate-400 hover:text-green-400"
                : "hover:bg-slate-200 text-slate-500 hover:text-green-600"
            }`}
            title="Copy word"
          >
            <Copy className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onShare();
            }}
            className={`p-1 sm:p-1.5 rounded-lg transition-all ${
              isDark
                ? "hover:bg-slate-700 text-slate-400 hover:text-purple-400"
                : "hover:bg-slate-200 text-slate-500 hover:text-purple-600"
            }`}
            title="Share word"
          >
            <Share2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              console.log("HEART BUTTON CLICKED!", word.id, word);
              onToggleSaved(word.id, word);
            }}
            className={`p-1 sm:p-1.5 rounded-lg transition-all ${
              isSaved
                ? "bg-red-500/10 text-red-500 hover:bg-red-500/20"
                : isDark
                  ? "hover:bg-slate-700 text-slate-400 hover:text-red-400"
                  : "hover:bg-slate-200 text-slate-500 hover:text-red-600"
            }`}
            title={isSaved ? "Remove from saved" : "Save to favorites"}
          >
            <Heart
              className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${isSaved ? "fill-current" : ""}`}
            />
          </button>
        </div>
      </div>

      {/* Word */}
      <div className="mb-2 sm:mb-3">
        <h3
          className={`text-xl sm:text-2xl font-bold mb-1 ${
            isDark ? "text-white" : "text-slate-900"
          }`}
        >
          {word.word}
        </h3>
        <p
          className={`text-xs sm:text-sm font-mono ${
            isDark ? "text-blue-400" : "text-blue-600"
          }`}
        >
          {word.pinyin}
        </p>
      </div>

      {/* English meaning */}
      {word.english && (
        <div className="mb-2 sm:mb-3">
          <p
            className={`text-xs sm:text-sm ${
              isDark ? "text-slate-300" : "text-slate-700"
            }`}
          >
            {word.english}
          </p>
        </div>
      )}

      {/* Part of speech */}
      {word.pos && (
        <Badge
          variant="secondary"
          className={`text-[10px] sm:text-xs ${
            isDark
              ? "bg-slate-700 text-slate-300"
              : "bg-slate-200 text-slate-600"
          }`}
        >
          {getPosInEnglish(word.pos)}
        </Badge>
      )}

      {/* Footer with learn toggle */}
      <button
        onClick={() => {
          console.log("LEARNED BUTTON CLICKED!", word.id, word);
          onToggleLearned(word.id, word);
        }}
        className={`w-full mt-2 sm:mt-3 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-all ${
          isLearned
            ? isDark
              ? "bg-green-900/30 text-green-400 hover:bg-green-900/40"
              : "bg-green-100 text-green-700 hover:bg-green-200"
            : isDark
              ? "bg-slate-700 text-slate-300 hover:bg-slate-600"
              : "bg-slate-100 text-slate-700 hover:bg-slate-200"
        }`}
      >
        {isLearned ? "✓ Learned" : "Mark as Learned"}
      </button>
    </div>
  );
}

interface GrammarSentence {
  id: string;
  chinese: string;
  pinyin: string;
  english: string;
  topic?: string;
  level: number;
}

interface HSKLevel {
  level: number | string;
  title: string;
  description: string;
  wordCount: number;
  color: string;
  bgColor: string;
}

const levelInfo: HSKLevel[] = [
  {
    level: 1,
    title: "HSK 1",
    description: "Beginner - Basic vocabulary for everyday communication",
    wordCount: 300,
    color: "text-green-500",
    bgColor: "bg-green-500",
  },
  {
    level: 2,
    title: "HSK 2",
    description: "Elementary - Simple daily life topics",
    wordCount: 300,
    color: "text-blue-500",
    bgColor: "bg-blue-500",
  },
  {
    level: 3,
    title: "HSK 3",
    description: "Intermediate - Basic communication on familiar topics",
    wordCount: 600,
    color: "text-purple-500",
    bgColor: "bg-purple-500",
  },
  {
    level: 4,
    title: "HSK 4",
    description: "Upper Intermediate - Complex topics and discussions",
    wordCount: 1200,
    color: "text-orange-500",
    bgColor: "bg-orange-500",
  },
  {
    level: 5,
    title: "HSK 5",
    description: "Advanced - Professional and academic topics",
    wordCount: 2500,
    color: "text-red-500",
    bgColor: "bg-red-500",
  },
  {
    level: 6,
    title: "HSK 6",
    description: "Proficient - Complex academic and professional content",
    wordCount: 5000,
    color: "text-pink-500",
    bgColor: "bg-pink-500",
  },
  {
    level: "7-9",
    title: "HSK 7-9",
    description: "Master - Near-native fluency",
    wordCount: 5600,
    color: "text-amber-500",
    bgColor: "bg-amber-500",
  },
];

type TabType = "vocabulary" | "grammar" | "slides" | "flashcards" | "quiz";

const ITEMS_PER_PAGE = 20;

interface LearningSlideProps {
  word: HSKWord;
  index: number;
  total: number;
  isDark: boolean;
  isLearned: boolean;
  isSaved: boolean;
  onToggleLearned: () => void;
  onToggleSaved: () => void;
  onSpeak: () => void;
  showPinyin: boolean;
  showEnglish: boolean;
}

function LearningSlide({
  word,
  index,
  total,
  isDark,
  isLearned,
  isSaved,
  onToggleLearned,
  onToggleSaved,
  onSpeak,
  showPinyin,
  showEnglish,
}: LearningSlideProps) {
  return (
    <div className="h-full flex flex-col items-center justify-center p-4 sm:p-8">
      <div
        className={`w-full max-w-2xl relative overflow-hidden rounded-3xl ${
          isDark
            ? "bg-gradient-to-br from-slate-800 via-slate-900 to-slate-800 border border-slate-700/50"
            : "bg-gradient-to-br from-white via-blue-50 to-purple-50 border border-slate-200/50"
        } shadow-2xl`}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-blue-500/5 to-transparent pointer-events-none" />

        <div className="relative p-6 sm:p-10">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <span
                className={`px-3 py-1 rounded-full text-xs font-medium ${
                  isDark
                    ? "bg-blue-500/20 text-blue-400"
                    : "bg-blue-100 text-blue-600"
                }`}
              >
                {index + 1} / {total}
              </span>
              {isLearned && (
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium ${
                    isDark
                      ? "bg-green-500/20 text-green-400"
                      : "bg-green-100 text-green-600"
                  }`}
                >
                  Learned
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={onSpeak}
                className={`p-2 rounded-xl transition-all ${
                  isDark
                    ? "hover:bg-slate-700 text-slate-400 hover:text-blue-400"
                    : "hover:bg-slate-100 text-slate-500 hover:text-blue-600"
                }`}
              >
                <Volume2 className="w-5 h-5" />
              </button>
              <button
                onClick={onToggleSaved}
                className={`p-2 rounded-xl transition-all ${
                  isSaved
                    ? "bg-red-500/20 text-red-500"
                    : isDark
                      ? "hover:bg-slate-700 text-slate-400 hover:text-red-400"
                      : "hover:bg-slate-100 text-slate-500 hover:text-red-600"
                }`}
              >
                <Heart className={`w-5 h-5 ${isSaved ? "fill-current" : ""}`} />
              </button>
            </div>
          </div>

          <div className="text-center py-8">
            <h2
              className={`text-5xl sm:text-7xl font-bold mb-6 tracking-wide ${
                isDark ? "text-white" : "text-slate-900"
              }`}
              style={{
                textShadow: isDark
                  ? "0 0 40px rgba(59, 130, 246, 0.3)"
                  : "0 0 40px rgba(59, 130, 246, 0.1)",
              }}
            >
              {word.word}
            </h2>

            <div
              className={`h-1 w-24 mx-auto rounded-full mb-6 ${
                isDark
                  ? "bg-gradient-to-r from-blue-500 to-purple-500"
                  : "bg-gradient-to-r from-blue-400 to-purple-400"
              }`}
            />

            <div className="space-y-3">
              <p
                className={`text-xl sm:text-2xl font-mono transition-all duration-300 ${
                  showPinyin
                    ? isDark
                      ? "text-blue-400"
                      : "text-blue-600"
                    : "blur-sm select-none"
                }`}
              >
                {word.pinyin}
              </p>

              {word.english && (
                <p
                  className={`text-lg sm:text-xl transition-all duration-300 ${
                    showEnglish
                      ? isDark
                        ? "text-slate-300"
                        : "text-slate-700"
                      : "blur-sm select-none"
                  }`}
                >
                  {word.english}
                </p>
              )}
            </div>

            {word.pos && (
              <Badge
                className={`mt-6 text-sm ${
                  isDark
                    ? "bg-slate-700/50 text-slate-300 border border-slate-600/50"
                    : "bg-slate-100 text-slate-600 border border-slate-200"
                }`}
              >
                {getPosInEnglish(word.pos)}
              </Badge>
            )}
          </div>

          <div className="flex justify-center mt-6">
            <button
              onClick={onToggleLearned}
              className={`px-6 py-3 rounded-xl text-sm font-medium transition-all ${
                isLearned
                  ? isDark
                    ? "bg-green-500/20 text-green-400 border border-green-500/30 hover:bg-green-500/30"
                    : "bg-green-100 text-green-700 border border-green-200 hover:bg-green-200"
                  : isDark
                    ? "bg-blue-500/20 text-blue-400 border border-blue-500/30 hover:bg-blue-500/30"
                    : "bg-blue-100 text-blue-700 border border-blue-200 hover:bg-blue-200"
              }`}
            >
              {isLearned ? (
                <span className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  Learned
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  Mark as Learned
                </span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

interface FlashcardProps {
  word: HSKWord;
  index: number;
  total: number;
  isDark: boolean;
  isLearned: boolean;
  isSaved: boolean;
  onToggleLearned: () => void;
  onToggleSaved: () => void;
  onSpeak: () => void;
}

function Flashcard({
  word,
  index,
  total,
  isDark,
  isLearned,
  isSaved,
  onToggleLearned,
  onToggleSaved,
  onSpeak,
}: FlashcardProps) {
  const [isFlipped, setIsFlipped] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  const handleFlip = () => {
    if (!isAnimating) {
      setIsAnimating(true);
      setIsFlipped(!isFlipped);
      setTimeout(() => setIsAnimating(false), 300);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto" style={{ perspective: "1000px" }}>
      <div
        onClick={handleFlip}
        className="relative cursor-pointer transition-transform duration-300"
        style={{
          transformStyle: "preserve-3d",
          transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
          height: "350px",
        }}
      >
        <div
          className={`absolute inset-0 rounded-3xl overflow-hidden ${
            isDark
              ? "bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 border border-purple-500/30"
              : "bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500"
          } shadow-2xl`}
          style={{ backfaceVisibility: "hidden" }}
        >
          <div className="absolute inset-0 bg-black/10" />
          <div className="relative h-full flex flex-col items-center justify-center p-6">
            <div className="absolute top-4 left-4 flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-white/20 text-white text-xs font-medium backdrop-blur-sm">
                {index + 1} / {total}
              </span>
            </div>

            <div className="absolute top-4 right-4">
              <span className="px-3 py-1 rounded-full bg-white/20 text-white text-xs font-medium backdrop-blur-sm">
                Front
              </span>
            </div>

            <h2 className="text-5xl sm:text-6xl font-bold text-white mb-4 text-center">
              {word.word}
            </h2>

            <p className="text-xl font-mono text-white/80">{word.pinyin}</p>

            <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
              <p className="text-white/60 text-sm flex items-center gap-2">
                <Eye className="w-4 h-4" />
                Tap to reveal
              </p>
            </div>
          </div>
        </div>

        <div
          className={`absolute inset-0 rounded-3xl overflow-hidden ${
            isDark
              ? "bg-gradient-to-br from-slate-800 via-slate-900 to-slate-800 border border-slate-600/50"
              : "bg-gradient-to-br from-white via-slate-50 to-blue-50 border border-slate-200"
          } shadow-2xl`}
          style={{
            backfaceVisibility: "hidden",
            transform: "rotateY(180deg)",
          }}
        >
          <div className="relative h-full flex flex-col items-center justify-center p-6">
            <div className="absolute top-4 left-4 flex items-center gap-2">
              <span
                className={`px-3 py-1 rounded-full text-xs font-medium backdrop-blur-sm ${
                  isDark
                    ? "bg-slate-700 text-slate-300"
                    : "bg-slate-100 text-slate-600"
                }`}
              >
                {index + 1} / {total}
              </span>
            </div>

            <div className="absolute top-4 right-4">
              <span
                className={`px-3 py-1 rounded-full text-xs font-medium ${
                  isDark
                    ? "bg-purple-500/20 text-purple-400"
                    : "bg-purple-100 text-purple-600"
                }`}
              >
                Back
              </span>
            </div>

            <h2
              className={`text-4xl sm:text-5xl font-bold mb-3 ${
                isDark ? "text-white" : "text-slate-900"
              }`}
            >
              {word.word}
            </h2>

            <p
              className={`text-lg font-mono mb-4 ${
                isDark ? "text-blue-400" : "text-blue-600"
              }`}
            >
              {word.pinyin}
            </p>

            {word.english && (
              <p
                className={`text-lg text-center mb-4 ${
                  isDark ? "text-slate-300" : "text-slate-700"
                }`}
              >
                {word.english}
              </p>
            )}

            {word.pos && (
              <Badge
                className={`text-sm ${
                  isDark
                    ? "bg-slate-700/50 text-slate-300"
                    : "bg-slate-100 text-slate-600"
                }`}
              >
                {getPosInEnglish(word.pos)}
              </Badge>
            )}

            <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-3">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onSpeak();
                }}
                className={`p-2 rounded-xl transition-all ${
                  isDark
                    ? "bg-slate-700 hover:bg-slate-600 text-slate-300"
                    : "bg-slate-100 hover:bg-slate-200 text-slate-600"
                }`}
              >
                <Volume2 className="w-5 h-5" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleSaved();
                }}
                className={`p-2 rounded-xl transition-all ${
                  isSaved
                    ? "bg-red-500/20 text-red-500"
                    : isDark
                      ? "bg-slate-700 hover:bg-slate-600 text-slate-300"
                      : "bg-slate-100 hover:bg-slate-200 text-slate-600"
                }`}
              >
                <Heart className={`w-5 h-5 ${isSaved ? "fill-current" : ""}`} />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleLearned();
                }}
                className={`p-2 rounded-xl transition-all ${
                  isLearned
                    ? "bg-green-500/20 text-green-500"
                    : isDark
                      ? "bg-slate-700 hover:bg-slate-600 text-slate-300"
                      : "bg-slate-100 hover:bg-slate-200 text-slate-600"
                }`}
              >
                <CheckCircle className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function HSK2026Page() {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  const [selectedLevel, setSelectedLevel] = useState<number | string | null>(
    null,
  );
  const [activeTab, setActiveTab] = useState<TabType>("vocabulary");
  const [vocabulary, setVocabulary] = useState<HSKWord[]>([]);
  const [grammar, setGrammar] = useState<GrammarSentence[]>([]);
  const [grammarTotal, setGrammarTotal] = useState(0);
  const [grammarPage, setGrammarPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [learnedWords, setLearnedWords] = useState<Set<number>>(new Set());
  const [savedWords, setSavedWords] = useState<Set<number>>(new Set());
  const [savedWordsData, setSavedWordsData] = useState<HSKWord[]>([]);
  const [learnedWordsData, setLearnedWordsData] = useState<HSKWord[]>([]);
  const [showSavedTab, setShowSavedTab] = useState(false);
  const [showLearnedTab, setShowLearnedTab] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [slideIndex, setSlideIndex] = useState(0);
  const [isAutoPlay, setIsAutoPlay] = useState(false);
  const [autoPlaySpeed, setAutoPlaySpeed] = useState(3000);
  const [showPinyin, setShowPinyin] = useState(true);
  const [showEnglish, setShowEnglish] = useState(true);
  const [isSlidesShuffled, setIsSlidesShuffled] = useState(false);
  const [shuffledSlides, setShuffledSlides] = useState<HSKWord[]>([]);
  const [flashcardIndex, setFlashcardIndex] = useState(0);
  const [isShuffled, setIsShuffled] = useState(false);
  const [shuffledVocabulary, setShuffledVocabulary] = useState<HSKWord[]>([]);
  const autoPlayRef = useRef<NodeJS.Timeout | null>(null);

  const [showGlobalSearch, setShowGlobalSearch] = useState(false);
  const [globalSearchQuery, setGlobalSearchQuery] = useState("");
  const [globalSearchResults, setGlobalSearchResults] = useState<HSKWord[]>([]);
  const [isGlobalSearching, setIsGlobalSearching] = useState(false);
  const [globalSearchLevel, setGlobalSearchLevel] = useState<string>("");

  // Check authentication and load user's progress
  useEffect(() => {
    const checkAuthAndLoadProgress = async () => {
      const token = localStorage.getItem("auth_token");
      console.log("HSK2026Page - Checking auth, token exists:", !!token);

      if (token) {
        setIsAuthenticated(true);
        try {
          console.log("Loading learned/saved words from API...");
          // Load learned and saved words from backend
          const [learnedRes, savedRes] = await Promise.all([
            api.get("/hsk/learned-words"),
            api.get("/hsk/saved-words"),
          ]);

          console.log("Learned words response:", learnedRes);
          console.log("Saved words response:", savedRes);

          if (learnedRes.success && learnedRes.data) {
            console.log("Raw learned words data:", learnedRes.data);
            const learnedIds = new Set<number>(
              learnedRes.data.map((w: any) => {
                console.log("Processing learned word:", w);
                return w.word_id;
              }),
            );
            console.log("Loaded learned IDs:", Array.from(learnedIds));
            const firstId = learnedIds.values().next().value;
            console.log(
              "Learned IDs type check - first ID:",
              firstId,
              "typeof:",
              typeof firstId,
            );
            setLearnedWords(learnedIds);
            const learnedData: HSKWord[] = learnedRes.data.map((w: any) => ({
              id: w.word_id,
              word: w.word,
              pinyin: w.pinyin,
              pos: w.pos || "",
              english: w.english,
              level: w.level,
            }));
            setLearnedWordsData(learnedData);
          } else {
            console.error(
              "Learned words response not successful or no data:",
              learnedRes,
            );
          }

          if (savedRes.success && savedRes.data) {
            const savedIds = new Set<number>(
              savedRes.data.map((w: any) => w.word_id),
            );
            console.log("Loaded saved IDs:", Array.from(savedIds));
            setSavedWords(savedIds);
            const savedData: HSKWord[] = savedRes.data.map((w: any) => ({
              id: w.word_id,
              word: w.word,
              pinyin: w.pinyin,
              pos: w.pos || "",
              english: w.english,
              level: w.level,
            }));
            setSavedWordsData(savedData);
          }
        } catch (error) {
          console.error("Failed to load HSK progress:", error);
        }
      } else {
        console.log("No token - loading from localStorage");
        // Load from localStorage for non-authenticated users
        const localLearned = localStorage.getItem("hsk_learned_words");
        const localSaved = localStorage.getItem("hsk_saved_words");

        if (localLearned) {
          const parsed = JSON.parse(localLearned);
          console.log("Loaded from localStorage - learned:", parsed);
          setLearnedWords(new Set(parsed));
        }
        if (localSaved) {
          const parsed = JSON.parse(localSaved);
          console.log("Loaded from localStorage - saved:", parsed);
          setSavedWords(new Set(parsed));
        }
      }
    };

    checkAuthAndLoadProgress();
  }, []);

  useEffect(() => {
    document.title = "HSK 2026 - NCWU International";
  }, []);

  useEffect(() => {
    if (selectedLevel !== null) {
      if (activeTab === "vocabulary") {
        fetchVocabulary(selectedLevel);
      } else {
        fetchGrammar(selectedLevel);
      }
    }
  }, [selectedLevel, activeTab]);

  useEffect(() => {
    if (selectedLevel !== null && activeTab === "grammar") {
      fetchGrammar(selectedLevel, grammarPage);
    }
  }, [grammarPage]);

  useEffect(() => {
    if (activeTab === "slides") {
      setSlideIndex(0);
      setIsAutoPlay(false);
      setIsSlidesShuffled(false);
      setShuffledSlides([]);
    }
    if (activeTab === "flashcards") {
      setFlashcardIndex(0);
      setIsShuffled(false);
      setShuffledVocabulary([]);
    }
  }, [activeTab, selectedLevel]);

  const shuffleArray = (array: HSKWord[]): HSKWord[] => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  const performGlobalSearch = async () => {
    if (!globalSearchQuery.trim()) {
      setGlobalSearchResults([]);
      return;
    }

    setIsGlobalSearching(true);
    try {
      const response = await hskApi.searchAllWords(
        globalSearchQuery,
        globalSearchLevel ? parseInt(globalSearchLevel) : undefined,
      );
      if (response && response.length > 0) {
        setGlobalSearchResults(response);
      } else {
        setGlobalSearchResults([]);
      }
    } catch (error) {
      console.error("Global search error:", error);
      toast.error("Search failed. Please try again.");
    } finally {
      setIsGlobalSearching(false);
    }
  };

  const fetchVocabulary = async (level: number | string) => {
    setIsLoading(true);
    try {
      const response = await hskApi.getVocabulary(level);
      if (response.success && response.data) {
        setVocabulary(response.data);
      }
    } catch (error) {
      toast.error("Failed to load vocabulary");
    }
    setIsLoading(false);
  };

  const fetchGrammar = async (level: number | string, page: number = 1) => {
    setIsLoading(true);
    try {
      const levelNum =
        typeof level === "string" ? parseInt(level.split("-")[0]) : level;
      if (levelNum > 6) {
        setGrammar([]);
        setGrammarTotal(0);
        setIsLoading(false);
        return;
      }
      const baseUrl =
        import.meta.env.VITE_API_URL || "http://localhost:3001/api";
      const response = await fetch(
        `${baseUrl}/hsk/grammar/${levelNum}?page=${page}&limit=50`,
      );
      const data = await response.json();
      if (data.success && data.data) {
        setGrammar(data.data.sentences || []);
        setGrammarTotal(data.data.total || 0);
      }
    } catch (error) {
      console.error("Grammar fetch error:", error);
      toast.error("Failed to load grammar");
    }
    setIsLoading(false);
  };

  const toggleLearned = async (wordId: number, wordData?: HSKWord) => {
    console.log("toggleLearned called:", { wordId, wordData, isAuthenticated });
    const token = localStorage.getItem("auth_token");

    if (!token || !isAuthenticated) {
      // Local-only mode for non-authenticated users
      console.log("Local mode: updating learned words");
      setLearnedWords((prev) => {
        const newSet = new Set(prev);
        if (newSet.has(wordId)) {
          newSet.delete(wordId);
          console.log("Removed word from learned:", wordId);
        } else {
          newSet.add(wordId);
          console.log("Added word to learned:", wordId);
        }
        // Save to localStorage
        localStorage.setItem(
          "hsk_learned_words",
          JSON.stringify(Array.from(newSet)),
        );
        return newSet;
      });
      toast.info("Please login to save your progress permanently");
      return;
    }

    try {
      console.log("Logged in mode: sending API request for learned word");
      if (wordData) {
        console.log("Word data:", wordData);
        const response = await api.post("/hsk/learned-words", {
          word_id: wordId,
          word: wordData.word,
          pinyin: wordData.pinyin,
          english: wordData.english,
          pos: wordData.pos,
          level: wordData.level,
        });
        console.log("API response:", response);

        if (response.success) {
          setLearnedWords((prev) => {
            const newSet = new Set(prev);
            if (response.action === "added") {
              newSet.add(wordId);
              toast.success("Word marked as learned!");
              // Add to learnedWordsData
              if (wordData) {
                setLearnedWordsData((prevData) => {
                  if (!prevData.find((w) => w.id === wordId)) {
                    return [...prevData, wordData];
                  }
                  return prevData;
                });
              }
            } else {
              newSet.delete(wordId);
              toast.success("Word removed from learned");
              // Remove from learnedWordsData
              setLearnedWordsData((prevData) =>
                prevData.filter((w) => w.id !== wordId),
              );
            }
            return newSet;
          });
        }
      } else {
        console.error("wordData is undefined!");
        toast.error("Word data not available");
      }
    } catch (error) {
      toast.error("Failed to update learned status");
      console.error("API error:", error);
    }
  };

  const toggleSaved = async (wordId: number, wordData?: HSKWord) => {
    console.log("toggleSaved called:", { wordId, wordData, isAuthenticated });
    const token = localStorage.getItem("auth_token");

    if (!token || !isAuthenticated) {
      // Local-only mode for non-authenticated users
      console.log("Local mode: updating saved words");
      setSavedWords((prev) => {
        const newSet = new Set(prev);
        if (newSet.has(wordId)) {
          newSet.delete(wordId);
          console.log("Removed word from saved:", wordId);
        } else {
          newSet.add(wordId);
          console.log("Added word to saved:", wordId);
        }
        // Save to localStorage
        localStorage.setItem(
          "hsk_saved_words",
          JSON.stringify(Array.from(newSet)),
        );
        return newSet;
      });
      toast.info("Please login to save words permanently");
      return;
    }

    try {
      console.log("Logged in mode: sending API request for saved word");
      if (wordData) {
        console.log("Word data:", wordData);
        const response = await api.post("/hsk/saved-words", {
          word_id: wordId,
          word: wordData.word,
          pinyin: wordData.pinyin,
          english: wordData.english,
          pos: wordData.pos,
          level: wordData.level,
        });
        console.log("API response:", response);

        if (response.success) {
          setSavedWords((prev) => {
            const newSet = new Set(prev);
            if (response.action === "added") {
              newSet.add(wordId);
              toast.success("Word saved to favorites!");
              // Add to savedWordsData
              if (wordData) {
                setSavedWordsData((prevData) => {
                  if (!prevData.find((w) => w.id === wordId)) {
                    return [...prevData, wordData];
                  }
                  return prevData;
                });
              }
            } else {
              newSet.delete(wordId);
              toast.success("Word removed from saved");
              // Remove from savedWordsData
              setSavedWordsData((prevData) =>
                prevData.filter((w) => w.id !== wordId),
              );
            }
            return newSet;
          });
        }
      } else {
        console.error("wordData is undefined!");
        toast.error("Word data not available");
      }
    } catch (error) {
      toast.error("Failed to update saved status");
      console.error("API error:", error);
    }
  };

  const copyWord = async (word: HSKWord) => {
    const text = `${word.word} (${word.pinyin}) - ${word.english || getPosInEnglish(word.pos)}`;
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Copied to clipboard!");
    } catch (error) {
      toast.error("Failed to copy");
    }
  };

  const shareWord = async (word: HSKWord) => {
    const text = `Check out this Chinese word: ${word.word} (${word.pinyin}) - ${word.english || getPosInEnglish(word.pos)}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `HSK Word: ${word.word}`,
          text: text,
        });
      } catch (error) {
        console.log("Share canceled");
      }
    } else {
      copyWord(word);
      toast.success("Link copied to clipboard!");
    }
  };

  const speakWord = (word: string) => {
    if (!("speechSynthesis" in window)) {
      toast.error("Text-to-speech not supported");
      return;
    }
    window.speechSynthesis.cancel();
    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
    }
    setTimeout(() => {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(word);
      utterance.lang = "zh-CN";
      utterance.rate = 0.8;
      speechSynthesis.speak(utterance);
    }, 100);
  };

  // Filter vocabulary based on search query (searches across ALL data)
  const filteredVocabulary = vocabulary.filter((word) => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return true;

    // Search in Chinese character
    if (word.word?.toLowerCase().includes(query)) return true;
    // Search in Pinyin
    if (word.pinyin?.toLowerCase().includes(query)) return true;
    // Search in English meaning
    if (word.english?.toLowerCase().includes(query)) return true;
    // Search in Part of Speech
    if (word.pos?.toLowerCase().includes(query)) return true;
    // Search by word ID (number)
    if (word.id?.toString().includes(query)) return true;
    // Search by HSK level
    if (word.level?.toString().includes(query)) return true;

    return false;
  });

  // Apply tab filters (Learned/Saved)
  const getFilteredData = () => {
    if (showLearnedTab) {
      console.log(
        "=== LEARNED TAB DEBUG ===",
        "\n- learnedWordsData.length:",
        learnedWordsData.length,
        "\n- learnedWords Set:",
        Array.from(learnedWords),
      );
      const query = searchQuery.toLowerCase().trim();
      if (!query) return learnedWordsData;

      const result = learnedWordsData.filter((word) => {
        if (word.word?.toLowerCase().includes(query)) return true;
        if (word.pinyin?.toLowerCase().includes(query)) return true;
        if (word.english?.toLowerCase().includes(query)) return true;
        if (word.pos?.toLowerCase().includes(query)) return true;
        if (word.id?.toString().includes(query)) return true;
        if (word.level?.toString().includes(query)) return true;
        return false;
      });
      console.log("Learned filter result:", result.length, "words found");
      return result;
    }
    if (showSavedTab) {
      console.log(
        "=== SAVED TAB DEBUG ===",
        "\n- savedWordsData.length:",
        savedWordsData.length,
        "\n- savedWords Set:",
        Array.from(savedWords),
      );
      const query = searchQuery.toLowerCase().trim();
      if (!query) return savedWordsData;

      const result = savedWordsData.filter((word) => {
        if (word.word?.toLowerCase().includes(query)) return true;
        if (word.pinyin?.toLowerCase().includes(query)) return true;
        if (word.english?.toLowerCase().includes(query)) return true;
        if (word.pos?.toLowerCase().includes(query)) return true;
        if (word.id?.toString().includes(query)) return true;
        if (word.level?.toString().includes(query)) return true;
        return false;
      });
      console.log("Saved filter result:", result.length, "words found");
      return result;
    }
    return filteredVocabulary;
  };

  const filteredData = getFilteredData();

  const toggleSlidesShuffle = () => {
    if (isSlidesShuffled) {
      setIsSlidesShuffled(false);
      setShuffledSlides([]);
      setSlideIndex(0);
    } else {
      const shuffled = shuffleArray(filteredData);
      setIsSlidesShuffled(true);
      setShuffledSlides(shuffled);
      setSlideIndex(0);
    }
  };

  const getSlidesData = (): HSKWord[] => {
    return isSlidesShuffled ? shuffledSlides : filteredData;
  };

  const toggleFlashcardShuffle = () => {
    if (isShuffled) {
      setIsShuffled(false);
      setShuffledVocabulary([]);
      setFlashcardIndex(0);
    } else {
      const shuffled = shuffleArray(filteredData);
      setIsShuffled(true);
      setShuffledVocabulary(shuffled);
      setFlashcardIndex(0);
    }
  };

  const getFlashcardData = (): HSKWord[] => {
    return isShuffled ? shuffledVocabulary : filteredData;
  };

  useEffect(() => {
    const slidesData = getSlidesData();
    if (isAutoPlay && slidesData.length > 0) {
      autoPlayRef.current = setInterval(() => {
        setSlideIndex((prev) => (prev + 1) % slidesData.length);
      }, autoPlaySpeed);
    }
    return () => {
      if (autoPlayRef.current) {
        clearInterval(autoPlayRef.current);
      }
    };
  }, [
    isAutoPlay,
    autoPlaySpeed,
    isSlidesShuffled,
    shuffledSlides.length,
    filteredData.length,
  ]);

  // Pagination calculations
  const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentData = filteredData.slice(startIndex, endIndex);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, showLearnedTab, showSavedTab, activeTab]);

  const filteredGrammar = grammar.filter(
    (sentence) =>
      sentence.chinese?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sentence.pinyin?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sentence.english?.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const handleLevelSelect = (level: number | string) => {
    setSelectedLevel(level);
    setActiveTab("vocabulary");
    setGrammarPage(1);
  };

  return (
    <div className={`min-h-screen ${isDark ? "bg-slate-950" : "bg-slate-50"}`}>
      <Navigation />

      <main className="pt-16 pb-16">
        <div
          className={`border-b ${
            isDark
              ? "bg-slate-900/50 border-slate-800"
              : "bg-white border-slate-200"
          }`}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-1.5 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600">
                  <BookOpen className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1
                    className={`text-xl sm:text-2xl font-bold ${
                      isDark ? "text-white" : "text-slate-900"
                    }`}
                  >
                    HSK 2026
                  </h1>
                  <p
                    className={`text-xs sm:text-sm ${
                      isDark ? "text-slate-400" : "text-slate-500"
                    }`}
                  >
                    New HSK Syllabus - Vocabulary, Characters & Grammar
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Link
                  to="/hsk"
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all hover:scale-105 ${
                    isDark
                      ? "bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/20"
                      : "bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/20"
                  }`}
                >
                  <BookOpen className="w-4 h-4" />
                  HSK Page
                </Link>
                <Link
                  to="/hsk/grammar"
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all hover:scale-105 ${
                    isDark
                      ? "bg-blue-500 hover:bg-blue-400 text-white shadow-md shadow-blue-500/10"
                      : "bg-blue-500 hover:bg-blue-400 text-white shadow-md shadow-blue-500/20"
                  }`}
                >
                  <MessageSquare className="w-4 h-4" />
                  Grammar
                </Link>
                <Link
                  to="/language-exchange"
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all hover:scale-105 ${
                    isDark
                      ? "bg-blue-400 hover:bg-blue-300 text-white shadow-md shadow-blue-400/10"
                      : "bg-blue-400 hover:bg-blue-300 text-white shadow-md shadow-blue-400/20"
                  }`}
                >
                  <Languages className="w-4 h-4" />
                  Language Exchange
                </Link>
                <Link
                  to="/social"
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all hover:scale-105 ${
                    isDark
                      ? "bg-blue-300 hover:bg-blue-200 text-blue-900 shadow-md shadow-blue-300/10"
                      : "bg-blue-300 hover:bg-blue-200 text-blue-900 shadow-md shadow-blue-300/20"
                  }`}
                >
                  <Users className="w-4 h-4" />
                  Social
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {!selectedLevel ? (
            <>
              {/* Quick Access - Learned & Saved Words (Right aligned) */}
              <div className="flex justify-end gap-3 mb-6">
                {/* Learned Words Button */}
                <Button
                  onClick={async () => {
                    console.log(
                      "Learned button clicked, learnedWords.size:",
                      learnedWords.size,
                    );
                    console.log(
                      "Current vocabulary length:",
                      vocabulary.length,
                    );

                    // Always load all vocabulary to ensure we have all words
                    setIsLoading(true);
                    try {
                      const response = await hskApi.getVocabulary("all");
                      console.log("Loaded vocabulary:", response);
                      if (response.success && response.data) {
                        setVocabulary(response.data);
                        console.log(
                          "Vocabulary set, length:",
                          response.data.length,
                        );
                      }
                    } catch (error) {
                      console.error("Error loading vocabulary:", error);
                      toast.error("Failed to load vocabulary");
                    }
                    setIsLoading(false);

                    setActiveTab("vocabulary");
                    setShowLearnedTab(true);
                    setShowSavedTab(false);
                    setCurrentPage(1);
                  }}
                  className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-5 py-2.5 rounded-xl shadow-md hover:shadow-lg hover:scale-105 transition-all"
                >
                  <CheckCircle className="w-5 h-5" />
                  <div className="text-left">
                    <p className="text-sm font-bold">Learned</p>
                    <p className="text-xl font-bold">{learnedWords.size}</p>
                  </div>
                </Button>

                {/* Saved Words Button */}
                <Button
                  onClick={async () => {
                    console.log(
                      "Saved button clicked, savedWords.size:",
                      savedWords.size,
                    );
                    console.log(
                      "Current vocabulary length:",
                      vocabulary.length,
                    );

                    // Always load all vocabulary to ensure we have all words
                    setIsLoading(true);
                    try {
                      const response = await hskApi.getVocabulary("all");
                      console.log("Loaded vocabulary:", response);
                      if (response.success && response.data) {
                        setVocabulary(response.data);
                        console.log(
                          "Vocabulary set, length:",
                          response.data.length,
                        );
                      }
                    } catch (error) {
                      console.error("Error loading vocabulary:", error);
                      toast.error("Failed to load vocabulary");
                    }
                    setIsLoading(false);

                    setActiveTab("vocabulary");
                    setShowSavedTab(true);
                    setShowLearnedTab(false);
                    setCurrentPage(1);
                  }}
                  className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white px-5 py-2.5 rounded-xl shadow-md hover:shadow-lg hover:scale-105 transition-all"
                >
                  <Heart className="w-5 h-5" />
                  <div className="text-left">
                    <p className="text-sm font-bold">Saved</p>
                    <p className="text-xl font-bold">{savedWords.size}</p>
                  </div>
                </Button>
              </div>

              {/* Global Search Button */}
              <Button
                onClick={() => {
                  setShowGlobalSearch(true);
                  setGlobalSearchQuery("");
                  setGlobalSearchResults([]);
                }}
                className="flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-5 py-2.5 rounded-xl shadow-md hover:shadow-lg hover:scale-105 transition-all"
              >
                <Search className="w-5 h-5" />
                <div className="text-left">
                  <p className="text-sm font-bold">Global Search</p>
                  <p className="text-xs opacity-80">All HSK 1-9</p>
                </div>
              </Button>

              <div className="mb-6">
              <h2
                  className={`text-lg font-semibold mb-4 ${
                    isDark ? "text-white" : "text-slate-900"
                  }`}
                >
                  Select HSK Level
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {levelInfo.map((level) => (
                    <Card
                      key={level.level}
                      className={`cursor-pointer transition-all duration-200 hover:scale-[1.02] ${
                        isDark
                          ? "bg-slate-900 border-slate-700 hover:border-slate-600"
                          : "bg-white border-slate-200 hover:border-slate-300"
                      }`}
                      onClick={() => handleLevelSelect(level.level)}
                    >
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <div className={`text-2xl font-bold ${level.color}`}>
                            {level.title}
                          </div>
                          <div
                            className={`w-10 h-10 rounded-lg ${level.bgColor} flex items-center justify-center`}
                          >
                            <span className="text-white text-xs font-bold">
                              {level.level}
                            </span>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p
                          className={`text-sm mb-2 ${
                            isDark ? "text-slate-300" : "text-slate-600"
                          }`}
                        >
                          {level.description}
                        </p>
                        <div className="flex items-center justify-between">
                          <span
                            className={`text-xs ${
                              isDark ? "text-slate-400" : "text-slate-500"
                            }`}
                          >
                            {level.wordCount.toLocaleString()} words
                          </span>
                          <ChevronRight
                            className={`w-4 h-4 ${
                              isDark ? "text-slate-400" : "text-slate-500"
                            }`}
                          />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <Card
                  className={
                    isDark
                      ? "bg-slate-900 border-slate-700"
                      : "bg-white border-slate-200"
                  }
                >
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-blue-500/10">
                        <BookOpen className="w-5 h-5 text-blue-500" />
                      </div>
                      <div>
                        <p
                          className={`font-semibold ${
                            isDark ? "text-white" : "text-slate-900"
                          }`}
                        >
                          15,000+ Words
                        </p>
                        <p
                          className={`text-xs ${
                            isDark ? "text-slate-400" : "text-slate-500"
                          }`}
                        >
                          Complete vocabulary
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card
                  className={
                    isDark
                      ? "bg-slate-900 border-slate-700"
                      : "bg-white border-slate-200"
                  }
                >
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-purple-500/10">
                        <Star className="w-5 h-5 text-purple-500" />
                      </div>
                      <div>
                        <p
                          className={`font-semibold ${
                            isDark ? "text-white" : "text-slate-900"
                          }`}
                        >
                          3,000+ Characters
                        </p>
                        <p
                          className={`text-xs ${
                            isDark ? "text-slate-400" : "text-slate-500"
                          }`}
                        >
                          Hanzi to learn
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card
                  className={
                    isDark
                      ? "bg-slate-900 border-slate-700"
                      : "bg-white border-slate-200"
                  }
                >
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-green-500/10">
                        <MessageSquare className="w-5 h-5 text-green-500" />
                      </div>
                      <div>
                        <p
                          className={`font-semibold ${
                            isDark ? "text-white" : "text-slate-900"
                          }`}
                        >
                          5,000+ Sentences
                        </p>
                        <p
                          className={`text-xs ${
                            isDark ? "text-slate-400" : "text-slate-500"
                          }`}
                        >
                          Grammar examples
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          ) : (
            <>
              <div className="mb-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSelectedLevel(null);
                    setVocabulary([]);
                    setGrammar([]);
                  }}
                  className={
                    isDark
                      ? "text-slate-300 hover:text-white"
                      : "text-slate-600 hover:text-slate-900"
                  }
                >
                  <ChevronRight className="w-4 h-4 rotate-180 mr-1" />
                  Back to Levels
                </Button>
              </div>

              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div
                    className={`p-2 rounded-lg ${
                      levelInfo.find((l) => l.level === selectedLevel)?.bgColor
                    } flex items-center justify-center`}
                  >
                    <span className="text-white font-bold">
                      {selectedLevel}
                    </span>
                  </div>
                  <div>
                    <h2
                      className={`text-xl font-bold ${
                        isDark ? "text-white" : "text-slate-900"
                      }`}
                    >
                      HSK {selectedLevel}
                    </h2>
                    <p
                      className={`text-sm ${
                        isDark ? "text-slate-400" : "text-slate-500"
                      }`}
                    >
                      {activeTab === "vocabulary"
                        ? `${filteredVocabulary.length} words`
                        : `${grammarTotal} grammar sentences`}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
                  <div className="flex items-center gap-1 p-1 rounded-lg bg-slate-200 dark:bg-slate-800 overflow-x-auto">
                    <button
                      onClick={() => {
                        setActiveTab("vocabulary");
                        setShowSavedTab(false);
                        setShowLearnedTab(false);
                      }}
                      className={`px-2 sm:px-3 py-1.5 rounded-md text-xs sm:text-sm font-medium transition-all whitespace-nowrap ${
                        activeTab === "vocabulary" &&
                        !showSavedTab &&
                        !showLearnedTab
                          ? "bg-white dark:bg-slate-700 shadow-sm"
                          : "text-slate-600 dark:text-slate-400"
                      }`}
                    >
                      <BookOpen className="w-3.5 h-3.5 sm:w-4 sm:h-4 inline mr-1" />
                      Vocabulary
                    </button>
                    <button
                      onClick={() => {
                        setActiveTab("slides");
                        setShowSavedTab(false);
                        setShowLearnedTab(false);
                      }}
                      className={`px-2 sm:px-3 py-1.5 rounded-md text-xs sm:text-sm font-medium transition-all whitespace-nowrap ${
                        activeTab === "slides"
                          ? "bg-white dark:bg-slate-700 shadow-sm"
                          : "text-slate-600 dark:text-slate-400"
                      }`}
                    >
                      <Presentation className="w-3.5 h-3.5 sm:w-4 sm:h-4 inline mr-1" />
                      Slides
                    </button>
                    <button
                      onClick={() => {
                        setActiveTab("flashcards");
                        setShowSavedTab(false);
                        setShowLearnedTab(false);
                      }}
                      className={`px-2 sm:px-3 py-1.5 rounded-md text-xs sm:text-sm font-medium transition-all whitespace-nowrap ${
                        activeTab === "flashcards"
                          ? "bg-white dark:bg-slate-700 shadow-sm"
                          : "text-slate-600 dark:text-slate-400"
                      }`}
                    >
                      <Layers className="w-3.5 h-3.5 sm:w-4 sm:h-4 inline mr-1" />
                      Flashcards
                    </button>
                    <button
                      onClick={() => {
                        setActiveTab("quiz");
                        setShowSavedTab(false);
                        setShowLearnedTab(false);
                      }}
                      className={`px-2 sm:px-3 py-1.5 rounded-md text-xs sm:text-sm font-medium transition-all whitespace-nowrap ${
                        activeTab === "quiz"
                          ? "bg-white dark:bg-slate-700 shadow-sm"
                          : "text-slate-600 dark:text-slate-400"
                      }`}
                    >
                      <Target className="w-3.5 h-3.5 sm:w-4 sm:h-4 inline mr-1" />
                      Quiz
                    </button>
                    <button
                      onClick={() => {
                        setActiveTab("vocabulary");
                        setShowLearnedTab(true);
                        setShowSavedTab(false);
                      }}
                      className={`px-2 sm:px-3 py-1.5 rounded-md text-xs sm:text-sm font-medium transition-all whitespace-nowrap ${
                        showLearnedTab
                          ? "bg-white dark:bg-slate-700 shadow-sm"
                          : "text-slate-600 dark:text-slate-400"
                      }`}
                    >
                      <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 inline mr-1" />
                      Learned ({learnedWords.size})
                    </button>
                    <button
                      onClick={() => {
                        setActiveTab("vocabulary");
                        setShowSavedTab(true);
                        setShowLearnedTab(false);
                      }}
                      className={`px-2 sm:px-3 py-1.5 rounded-md text-xs sm:text-sm font-medium transition-all whitespace-nowrap ${
                        showSavedTab
                          ? "bg-white dark:bg-slate-700 shadow-sm"
                          : "text-slate-600 dark:text-slate-400"
                      }`}
                    >
                      <Heart className="w-3.5 h-3.5 sm:w-4 sm:h-4 inline mr-1" />
                      Saved ({savedWords.size})
                    </button>
                    <button
                      onClick={() => {
                        setActiveTab("grammar");
                        setShowSavedTab(false);
                        setShowLearnedTab(false);
                      }}
                      className={`px-2 sm:px-3 py-1.5 rounded-md text-xs sm:text-sm font-medium transition-all whitespace-nowrap ${
                        activeTab === "grammar"
                          ? "bg-white dark:bg-slate-700 shadow-sm"
                          : "text-slate-600 dark:text-slate-400"
                      }`}
                    >
                      <MessageSquare className="w-3.5 h-3.5 sm:w-4 sm:h-4 inline mr-1" />
                      Grammar
                    </button>
                  </div>

                  <div className="relative w-full sm:w-64 flex-shrink-0">
                    <Search
                      className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${
                        isDark ? "text-slate-400" : "text-slate-500"
                      }`}
                    />
                    <Input
                      placeholder={`Search ${showSavedTab ? "saved" : showLearnedTab ? "learned" : activeTab}...`}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className={`pl-9 w-full ${
                        isDark
                          ? "bg-slate-800 border-slate-700"
                          : "bg-slate-50 border-slate-200"
                      }`}
                    />
                  </div>
                </div>
              </div>

              {isLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                </div>
              ) : activeTab === "slides" ? (
                filteredData.length === 0 ? (
                  <div className="p-12 text-center">
                    <Presentation
                      className={`w-16 h-16 mx-auto mb-4 ${isDark ? "text-slate-600" : "text-slate-300"}`}
                    />
                    <p
                      className={`text-lg font-medium mb-2 ${isDark ? "text-white" : "text-slate-900"}`}
                    >
                      No words to display
                    </p>
                    <p className={isDark ? "text-slate-400" : "text-slate-500"}>
                      Select a level to start learning with slides
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                      <div className="flex items-center gap-2">
                        <Button
                          onClick={() => setIsAutoPlay(!isAutoPlay)}
                          className={`gap-2 ${
                            isAutoPlay
                              ? "bg-red-500 hover:bg-red-600"
                              : "bg-blue-500 hover:bg-blue-600"
                          }`}
                        >
                          {isAutoPlay ? (
                            <>
                              <Pause className="w-4 h-4" />
                              Pause
                            </>
                          ) : (
                            <>
                              <Play className="w-4 h-4" />
                              Auto Play
                            </>
                          )}
                        </Button>
                        <Button
                          onClick={toggleSlidesShuffle}
                          className={`gap-2 ${
                            isSlidesShuffled
                              ? "bg-purple-500 hover:bg-purple-600"
                              : "bg-blue-500 hover:bg-blue-600"
                          }`}
                        >
                          <Shuffle className="w-4 h-4" />
                          {isSlidesShuffled ? "Unshuffle" : "Random"}
                        </Button>
                        <Button
                          onClick={() => {
                            setSlideIndex(0);
                            if (isSlidesShuffled) {
                              setShuffledSlides(shuffleArray(filteredData));
                            }
                          }}
                          variant="outline"
                          className="gap-2"
                        >
                          <RotateCcw className="w-4 h-4" />
                          Reset
                        </Button>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setShowPinyin(!showPinyin)}
                          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                            showPinyin
                              ? isDark
                                ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                                : "bg-blue-100 text-blue-700 border border-blue-200"
                              : isDark
                                ? "bg-slate-700 text-slate-400"
                                : "bg-slate-100 text-slate-500"
                          }`}
                        >
                          {showPinyin ? (
                            <Eye className="w-4 h-4 inline mr-1" />
                          ) : (
                            <EyeOff className="w-4 h-4 inline mr-1" />
                          )}
                          Pinyin
                        </button>
                        <button
                          onClick={() => setShowEnglish(!showEnglish)}
                          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                            showEnglish
                              ? isDark
                                ? "bg-purple-500/20 text-purple-400 border border-purple-500/30"
                                : "bg-purple-100 text-purple-700 border border-purple-200"
                              : isDark
                                ? "bg-slate-700 text-slate-400"
                                : "bg-slate-100 text-slate-500"
                          }`}
                        >
                          {showEnglish ? (
                            <Eye className="w-4 h-4 inline mr-1" />
                          ) : (
                            <EyeOff className="w-4 h-4 inline mr-1" />
                          )}
                          English
                        </button>
                      </div>
                    </div>

                    <Progress
                      value={((slideIndex + 1) / getSlidesData().length) * 100}
                      className="h-2"
                    />

                    <div className="text-center text-sm text-slate-500 mb-2">
                      Word {slideIndex + 1} of {getSlidesData().length}
                      {isSlidesShuffled && (
                        <span className="ml-2 text-purple-500">(Shuffled)</span>
                      )}
                      <span className="ml-2 text-xs opacity-60">
                        ID: {getSlidesData()[slideIndex]?.id}
                      </span>
                    </div>

                    {isSlidesShuffled && (
                      <div className="text-center text-xs text-slate-400 mb-2">
                        Next:{" "}
                        {getSlidesData()
                          .slice(slideIndex + 1, slideIndex + 6)
                          .map((w) => w.id)
                          .join(", ")}
                        {slideIndex + 6 < getSlidesData().length && "..."}
                      </div>
                    )}

                    <div className="relative h-[500px] sm:h-[600px]">
                      <LearningSlide
                        word={getSlidesData()[slideIndex]}
                        index={slideIndex}
                        total={getSlidesData().length}
                        isDark={isDark}
                        isLearned={learnedWords.has(
                          getSlidesData()[slideIndex].id,
                        )}
                        isSaved={savedWords.has(getSlidesData()[slideIndex].id)}
                        onToggleLearned={() =>
                          toggleLearned(
                            getSlidesData()[slideIndex].id,
                            getSlidesData()[slideIndex],
                          )
                        }
                        onToggleSaved={() =>
                          toggleSaved(
                            getSlidesData()[slideIndex].id,
                            getSlidesData()[slideIndex],
                          )
                        }
                        onSpeak={() =>
                          speakWord(getSlidesData()[slideIndex].word)
                        }
                        showPinyin={showPinyin}
                        showEnglish={showEnglish}
                      />
                    </div>

                    <div className="flex justify-center gap-4 mt-4">
                      <Button
                        onClick={() =>
                          setSlideIndex((prev) =>
                            prev === 0 ? getSlidesData().length - 1 : prev - 1,
                          )
                        }
                        variant="outline"
                        className="gap-2"
                      >
                        <ChevronLeft className="w-4 h-4" />
                        Previous
                      </Button>
                      <Button
                        onClick={() =>
                          setSlideIndex(
                            (prev) => (prev + 1) % getSlidesData().length,
                          )
                        }
                        className="gap-2 bg-blue-500 hover:bg-blue-600"
                      >
                        Next
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </div>

                    <div className="flex justify-center gap-2 mt-4">
                      <input
                        type="range"
                        min="1000"
                        max="10000"
                        step="500"
                        value={autoPlaySpeed}
                        onChange={(e) =>
                          setAutoPlaySpeed(Number(e.target.value))
                        }
                        className="w-32"
                      />
                      <span className="text-sm text-slate-500">
                        {(autoPlaySpeed / 1000).toFixed(1)}s
                      </span>
                    </div>
                  </div>
                )
              ) : activeTab === "flashcards" ? (
                filteredData.length === 0 ? (
                  <div className="p-12 text-center">
                    <Layers
                      className={`w-16 h-16 mx-auto mb-4 ${isDark ? "text-slate-600" : "text-slate-300"}`}
                    />
                    <p
                      className={`text-lg font-medium mb-2 ${isDark ? "text-white" : "text-slate-900"}`}
                    >
                      No words to display
                    </p>
                    <p className={isDark ? "text-slate-400" : "text-slate-500"}>
                      Select a level to start practicing with flashcards
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                      <div className="flex items-center gap-2">
                        <Button
                          onClick={toggleFlashcardShuffle}
                          className={`gap-2 ${
                            isShuffled
                              ? "bg-purple-500 hover:bg-purple-600"
                              : "bg-blue-500 hover:bg-blue-600"
                          }`}
                        >
                          <Shuffle className="w-4 h-4" />
                          {isShuffled ? "Unshuffle" : "Random"}
                        </Button>
                        <Button
                          onClick={() => {
                            setFlashcardIndex(0);
                            if (isShuffled) {
                              setShuffledVocabulary(shuffleArray(filteredData));
                            }
                          }}
                          variant="outline"
                          className="gap-2"
                        >
                          <RotateCcw className="w-4 h-4" />
                          Reset
                        </Button>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge
                          className={`${
                            isDark
                              ? "bg-slate-700 text-slate-300"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          <Keyboard className="w-3 h-3 mr-1" />
                          Use arrow keys
                        </Badge>
                      </div>
                    </div>

                    <Progress
                      value={
                        ((flashcardIndex + 1) / getFlashcardData().length) * 100
                      }
                      className="h-2"
                    />

                    <div className="text-center text-sm text-slate-500 mb-2">
                      Card {flashcardIndex + 1} of {getFlashcardData().length}
                      {isShuffled && (
                        <span className="ml-2 text-purple-500">(Shuffled)</span>
                      )}
                      <span className="ml-2 text-xs opacity-60">
                        ID: {getFlashcardData()[flashcardIndex]?.id}
                      </span>
                    </div>

                    {isShuffled && (
                      <div className="text-center text-xs text-slate-400 mb-2">
                        Next:{" "}
                        {getFlashcardData()
                          .slice(flashcardIndex + 1, flashcardIndex + 6)
                          .map((w) => w.id)
                          .join(", ")}
                        {flashcardIndex + 6 < getFlashcardData().length &&
                          "..."}
                      </div>
                    )}

                    <div className="relative h-[450px] sm:h-[550px]">
                      <div className="h-full flex items-center justify-center">
                        {getFlashcardData()[flashcardIndex] ? (
                          <Flashcard
                            word={getFlashcardData()[flashcardIndex]}
                            index={flashcardIndex}
                            total={getFlashcardData().length}
                            isDark={isDark}
                            isLearned={learnedWords.has(
                              getFlashcardData()[flashcardIndex].id,
                            )}
                            isSaved={savedWords.has(
                              getFlashcardData()[flashcardIndex].id,
                            )}
                            onToggleLearned={() =>
                              toggleLearned(
                                getFlashcardData()[flashcardIndex].id,
                                getFlashcardData()[flashcardIndex],
                              )
                            }
                            onToggleSaved={() =>
                              toggleSaved(
                                getFlashcardData()[flashcardIndex].id,
                                getFlashcardData()[flashcardIndex],
                              )
                            }
                            onSpeak={() =>
                              speakWord(getFlashcardData()[flashcardIndex].word)
                            }
                          />
                        ) : (
                          <div className="text-center p-8">
                            <p
                              className={
                                isDark ? "text-slate-400" : "text-slate-500"
                              }
                            >
                              No card available
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex justify-center gap-4 mt-4">
                      <Button
                        onClick={() =>
                          setFlashcardIndex((prev) =>
                            prev === 0
                              ? getFlashcardData().length - 1
                              : prev - 1,
                          )
                        }
                        variant="outline"
                        className="gap-2"
                      >
                        <ChevronLeft className="w-4 h-4" />
                        Previous
                      </Button>
                      <Button
                        onClick={() =>
                          setFlashcardIndex(
                            (prev) => (prev + 1) % getFlashcardData().length,
                          )
                        }
                        className="gap-2 bg-blue-500 hover:bg-blue-600"
                      >
                        Next
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )
              ) : activeTab === "quiz" ? (
                <VocabularyQuiz
                  isDark={isDark}
                  vocabulary={filteredData}
                  onExit={() => setActiveTab("vocabulary")}
                  onComplete={(result) => {
                    console.log("Quiz completed:", result);
                  }}
                />
              ) : activeTab === "vocabulary" ? (
                showLearnedTab ? (
                  learnedWords.size === 0 ? (
                    <div className="p-12 text-center">
                      <CheckCircle
                        className={`w-16 h-16 mx-auto mb-4 ${isDark ? "text-slate-600" : "text-slate-300"}`}
                      />
                      <p
                        className={`text-lg font-medium mb-2 ${isDark ? "text-white" : "text-slate-900"}`}
                      >
                        No learned words yet
                      </p>
                      <p
                        className={isDark ? "text-slate-400" : "text-slate-500"}
                      >
                        Click "Mark as Learned" on word cards to track your
                        progress
                      </p>
                    </div>
                  ) : filteredData.length === 0 ? (
                    <div className="p-12 text-center">
                      <CheckCircle
                        className={`w-16 h-16 mx-auto mb-4 ${isDark ? "text-slate-600" : "text-slate-300"}`}
                      />
                      <p
                        className={`text-lg font-medium mb-2 ${isDark ? "text-white" : "text-slate-900"}`}
                      >
                        No matching learned words
                      </p>
                      <p
                        className={isDark ? "text-slate-400" : "text-slate-500"}
                      >
                        Try adjusting your search query
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {currentData.map((word, index) => (
                          <WordCard
                            key={word.id}
                            word={word}
                            index={startIndex + index}
                            isDark={isDark}
                            isLearned={learnedWords.has(word.id)}
                            isSaved={savedWords.has(word.id)}
                            onToggleLearned={() => toggleLearned(word.id, word)}
                            onToggleSaved={() => toggleSaved(word.id, word)}
                            onCopy={() => copyWord(word)}
                            onShare={() => shareWord(word)}
                            onSpeak={() => speakWord(word.word)}
                          />
                        ))}
                      </div>
                      {totalPages > 1 && (
                        <PaginationControls
                          currentPage={currentPage}
                          totalPages={totalPages}
                          onPageChange={setCurrentPage}
                          isDark={isDark}
                        />
                      )}
                    </>
                  )
                ) : showSavedTab ? (
                  savedWords.size === 0 ? (
                    <div className="p-12 text-center">
                      <Heart
                        className={`w-16 h-16 mx-auto mb-4 ${isDark ? "text-slate-600" : "text-slate-300"}`}
                      />
                      <p
                        className={`text-lg font-medium mb-2 ${isDark ? "text-white" : "text-slate-900"}`}
                      >
                        No saved words yet
                      </p>
                      <p
                        className={isDark ? "text-slate-400" : "text-slate-500"}
                      >
                        Click the heart icon on word cards to save them here
                      </p>
                    </div>
                  ) : filteredData.length === 0 ? (
                    <div className="p-12 text-center">
                      <Heart
                        className={`w-16 h-16 mx-auto mb-4 ${isDark ? "text-slate-600" : "text-slate-300"}`}
                      />
                      <p
                        className={`text-lg font-medium mb-2 ${isDark ? "text-white" : "text-slate-900"}`}
                      >
                        No matching saved words
                      </p>
                      <p
                        className={isDark ? "text-slate-400" : "text-slate-500"}
                      >
                        Try adjusting your search query
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {currentData.map((word, index) => (
                          <WordCard
                            key={word.id}
                            word={word}
                            index={startIndex + index}
                            isDark={isDark}
                            isLearned={learnedWords.has(word.id)}
                            isSaved={savedWords.has(word.id)}
                            onToggleLearned={() => toggleLearned(word.id, word)}
                            onToggleSaved={() => toggleSaved(word.id, word)}
                            onCopy={() => copyWord(word)}
                            onShare={() => shareWord(word)}
                            onSpeak={() => speakWord(word.word)}
                          />
                        ))}
                      </div>
                      {totalPages > 1 && (
                        <PaginationControls
                          currentPage={currentPage}
                          totalPages={totalPages}
                          onPageChange={setCurrentPage}
                          isDark={isDark}
                        />
                      )}
                    </>
                  )
                ) : (
                  <>
                    {filteredData.length === 0 ? (
                      <div className="p-12 text-center">
                        <BookOpen
                          className={`w-16 h-16 mx-auto mb-4 ${isDark ? "text-slate-600" : "text-slate-300"}`}
                        />
                        <p
                          className={`text-lg font-medium mb-2 ${isDark ? "text-white" : "text-slate-900"}`}
                        >
                          No words found
                        </p>
                        <p
                          className={
                            isDark ? "text-slate-400" : "text-slate-500"
                          }
                        >
                          Try adjusting your search query
                        </p>
                      </div>
                    ) : (
                      <>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                          {currentData.map((word, index) => (
                            <WordCard
                              key={word.id}
                              word={word}
                              index={startIndex + index}
                              isDark={isDark}
                              isLearned={learnedWords.has(word.id)}
                              isSaved={savedWords.has(word.id)}
                              onToggleLearned={() =>
                                toggleLearned(word.id, word)
                              }
                              onToggleSaved={() => toggleSaved(word.id, word)}
                              onCopy={() => copyWord(word)}
                              onShare={() => shareWord(word)}
                              onSpeak={() => speakWord(word.word)}
                            />
                          ))}
                        </div>
                        {totalPages > 1 && (
                          <PaginationControls
                            currentPage={currentPage}
                            totalPages={totalPages}
                            onPageChange={setCurrentPage}
                            isDark={isDark}
                          />
                        )}
                      </>
                    )}
                  </>
                )
              ) : (
                <div
                  className={`rounded-xl border ${
                    isDark
                      ? "bg-slate-900 border-slate-700"
                      : "bg-white border-slate-200"
                  }`}
                >
                  {typeof selectedLevel === "number" && selectedLevel > 6 ? (
                    <div className="p-8 text-center">
                      <MessageSquare
                        className={`w-12 h-12 mx-auto mb-4 ${isDark ? "text-slate-600" : "text-slate-400"}`}
                      />
                      <p
                        className={isDark ? "text-slate-400" : "text-slate-500"}
                      >
                        Grammar data for HSK 7-9 is not available yet.
                      </p>
                    </div>
                  ) : filteredGrammar.length === 0 ? (
                    <div className="p-8 text-center">
                      <MessageSquare
                        className={`w-12 h-12 mx-auto mb-4 ${isDark ? "text-slate-600" : "text-slate-400"}`}
                      />
                      <p
                        className={isDark ? "text-slate-400" : "text-slate-500"}
                      >
                        No grammar sentences found.
                      </p>
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-200 dark:divide-slate-700">
                      {filteredGrammar.map((sentence, index) => (
                        <div
                          key={sentence.id || index}
                          className={`p-4 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors`}
                        >
                          <div className="flex items-start gap-4">
                            <span
                              className={`text-xs font-mono mt-1 ${
                                isDark ? "text-slate-500" : "text-slate-400"
                              }`}
                            >
                              #{(grammarPage - 1) * 50 + index + 1}
                            </span>
                            <div className="flex-1">
                              <p
                                className={`text-lg font-medium mb-1 ${
                                  isDark ? "text-white" : "text-slate-900"
                                }`}
                              >
                                {sentence.chinese}
                              </p>
                              <p
                                className={`text-sm mb-1 ${
                                  isDark ? "text-slate-400" : "text-slate-500"
                                }`}
                              >
                                {sentence.pinyin}
                              </p>
                              <p
                                className={`text-sm ${
                                  isDark ? "text-blue-400" : "text-blue-600"
                                }`}
                              >
                                {sentence.english}
                              </p>
                              {sentence.topic && (
                                <Badge
                                  variant="secondary"
                                  className={`text-xs mt-2 ${
                                    isDark
                                      ? "bg-slate-700 text-slate-300"
                                      : "bg-slate-200 text-slate-600"
                                  }`}
                                >
                                  {sentence.topic}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {grammarTotal > 50 && (
                    <div
                      className={`p-4 border-t flex items-center justify-between ${
                        isDark ? "border-slate-700" : "border-slate-200"
                      }`}
                    >
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={grammarPage === 1}
                        onClick={() => setGrammarPage((p) => p - 1)}
                      >
                        Previous
                      </Button>
                      <span
                        className={`text-sm ${
                          isDark ? "text-slate-400" : "text-slate-500"
                        }`}
                      >
                        Page {grammarPage} of {Math.ceil(grammarTotal / 50)}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={grammarPage >= Math.ceil(grammarTotal / 50)}
                        onClick={() => setGrammarPage((p) => p + 1)}
                      >
                        Next
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </main>

      {/* Global Search Modal */}
      {showGlobalSearch && (
        <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div
            className={`w-full max-w-5xl max-h-[90vh] overflow-hidden ${
              isDark
                ? "bg-slate-800 border border-slate-700"
                : "bg-white border border-slate-200"
            } rounded-2xl shadow-2xl`}
          >
            <div className={`p-6 border-b ${isDark ? "border-slate-700" : "border-slate-200"}`}>
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600">
                    <Search className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2
                      className={`text-2xl font-bold ${
                        isDark ? "text-white" : "text-slate-900"
                      }`}
                    >
                      Global Search
                    </h2>
                    <p className={`text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                      Search across all HSK levels 1-9
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowGlobalSearch(false)}
                  className={`p-2 rounded-lg transition-colors ${
                    isDark
                      ? "bg-slate-700 hover:bg-slate-600 text-slate-300"
                      : "bg-slate-100 hover:bg-slate-200 text-slate-600"
                  }`}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <div className="relative flex-1">
                  <Search
                    className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 ${
                      isDark ? "text-slate-400" : "text-slate-500"
                    }`}
                  />
                  <input
                    type="text"
                    placeholder="Search by Chinese character, Pinyin, English meaning, or Word ID..."
                    value={globalSearchQuery}
                    onChange={(e) => setGlobalSearchQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        performGlobalSearch();
                      }
                    }}
                    className={`w-full pl-12 pr-4 py-4 text-lg rounded-xl border-2 transition-all ${
                      isDark
                        ? "bg-slate-700 border-slate-600 text-white placeholder-slate-400 focus:border-blue-500"
                        : "bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:border-blue-500"
                    } focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
                  />
                </div>
                <div className="flex items-center gap-3">
                  <select
                    value={globalSearchLevel}
                    onChange={(e) => setGlobalSearchLevel(e.target.value)}
                    className={`px-4 py-4 text-base rounded-xl border-2 ${
                      isDark
                        ? "bg-slate-700 border-slate-600 text-white"
                        : "bg-white border-slate-300 text-slate-900"
                    } focus:outline-none focus:border-blue-500 cursor-pointer`}
                  >
                    <option value="">All Levels</option>
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((level) => (
                      <option key={level} value={level}>
                        HSK {level}
                      </option>
                    ))}
                  </select>
                  <Button
                    onClick={performGlobalSearch}
                    disabled={isGlobalSearching || !globalSearchQuery.trim()}
                    className="px-6 py-4 text-base bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white rounded-xl shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isGlobalSearching ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        <Search className="w-5 h-5 mr-2" />
                        Search
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>

            <div className="p-6">
              {isGlobalSearching ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <Loader2
                    className={`w-10 h-10 animate-spin mb-4 ${
                      isDark ? "text-blue-400" : "text-blue-500"
                    }`}
                  />
                  <p
                    className={`text-lg ${
                      isDark ? "text-slate-400" : "text-slate-500"
                    }`}
                  >
                    Searching across all HSK levels...
                  </p>
                </div>
              ) : globalSearchResults.length === 0 ? (
                <div className="text-center py-12">
                  <Search
                    className={`w-16 h-16 mx-auto mb-4 ${
                      isDark ? "text-slate-600" : "text-slate-300"
                    }`}
                  />
                  <p
                    className={`text-lg font-medium mb-2 ${
                      isDark ? "text-white" : "text-slate-900"
                    }`}
                  >
                    No words found
                  </p>
                  <p
                    className={`${
                      isDark ? "text-slate-400" : "text-slate-500"
                    }`}
                  >
                    Try searching with a different term
                  </p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[50vh] overflow-y-auto">
                  <div className="flex items-center justify-between mb-4">
                    <p
                      className={`text-sm font-medium ${
                        isDark ? "text-slate-400" : "text-slate-500"
                      }`}
                    >
                      Found {globalSearchResults.length} results
                    </p>
                  </div>
                  {globalSearchResults.map((word) => (
                    <div
                      key={word.id}
                      className={`p-4 rounded-xl border transition-all cursor-pointer hover:scale-[1.01] ${
                        isDark
                          ? "bg-slate-700/50 border-slate-600 hover:bg-slate-700 hover:border-slate-500"
                          : "bg-slate-50 border-slate-200 hover:bg-white hover:border-slate-300 hover:shadow-md"
                      }`}
                      onClick={() => {
                        setSelectedLevel(word.level as number);
                        setVocabulary([word]);
                        setShowGlobalSearch(false);
                        setActiveTab("vocabulary");
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <span
                            className={`text-3xl font-bold ${
                              isDark ? "text-white" : "text-slate-900"
                            }`}
                          >
                            {word.word}
                          </span>
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-medium ${
                              isDark
                                ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                                : "bg-blue-100 text-blue-700 border border-blue-200"
                            }`}
                          >
                            HSK {word.level}
                          </span>
                          {word.pos && (
                            <span
                              className={`px-2 py-0.5 rounded text-xs ${
                                isDark
                                  ? "bg-slate-600 text-slate-300"
                                  : "bg-slate-200 text-slate-600"
                              }`}
                            >
                              {getPosInEnglish(word.pos)}
                            </span>
                          )}
                        </div>
                        <div className="text-right">
                          <p
                            className={`text-lg font-mono ${
                              isDark ? "text-blue-400" : "text-blue-600"
                            }`}
                          >
                            {word.pinyin}
                          </p>
                          {word.english && (
                            <p
                              className={`text-sm ${
                                isDark ? "text-slate-400" : "text-slate-500"
                              }`}
                            >
                              {word.english}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
