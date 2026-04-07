import { useState, useEffect, useRef } from "react";
import { useTheme } from "@/components/ThemeProvider";
import { useAuth } from "@/contexts/AuthContext";
import {
  BookOpen,
  Target,
  Brain,
  BarChart3,
  Download,
  FileText,
  ChevronRight,
  Book,
  Headphones,
  TrendingUp,
  ArrowLeft,
  Heart,
} from "lucide-react";
import { Link } from "react-router-dom";
import type { HSKLevel, GrammarStats } from "@/types/hsk";
import { hskGrammarApi } from "@/lib/api";
import GrammarQuiz from "@/components/GrammarQuiz";
import GrammarStudyMode from "@/components/GrammarStudyMode";
import GrammarProgress from "@/components/GrammarProgress";
import GrammarPatternExplorer from "@/components/GrammarPatternExplorer";
import GrammarDownloads from "@/components/GrammarDownloads";
import GrammarSentenceBrowser from "@/components/GrammarSentenceBrowser";
import type { GrammarQuizResult } from "@/types/hsk";
import { useSavedGrammarSentences } from "@/hooks/useSavedGrammarSentences";

type GrammarSubTab =
  | "learn"
  | "study"
  | "quiz"
  | "patterns"
  | "progress"
  | "export"
  | "saved";

const levelConfig: Record<
  number,
  {
    gradient: string;
    bgGradient: string;
    icon: string;
    color: string;
    title: string;
    description: string;
    solidColor: string;
    darkBg: string;
    lightBg: string;
    sentenceColors: string[];
  }
> = {
  1: {
    gradient: "from-emerald-400 via-teal-500 to-cyan-500",
    bgGradient: "from-emerald-500/20 via-teal-500/20 to-cyan-500/20",
    icon: "🎯",
    color: "emerald",
    title: "HSK 1 - Beginner",
    description: "Basic grammar patterns for everyday conversations",
    solidColor: "#10b981",
    darkBg: "bg-emerald-900/30",
    lightBg: "bg-emerald-50",
    sentenceColors: ["#34d399", "#10b981", "#059669", "#047857", "#065f46"],
  },
  2: {
    gradient: "from-blue-400 via-cyan-500 to-indigo-500",
    bgGradient: "from-blue-500/20 via-cyan-500/20 to-indigo-500/20",
    icon: "📚",
    color: "blue",
    title: "HSK 2 - Elementary",
    description: "Elementary grammar structures",
    solidColor: "#3b82f6",
    darkBg: "bg-blue-900/30",
    lightBg: "bg-blue-50",
    sentenceColors: ["#60a5fa", "#3b82f6", "#2563eb", "#1d4ed8", "#1e40af"],
  },
  3: {
    gradient: "from-violet-400 via-purple-500 to-pink-500",
    bgGradient: "from-violet-500/20 via-purple-500/20 to-pink-500/20",
    icon: "🚀",
    color: "violet",
    title: "HSK 3 - Intermediate",
    description: "Intermediate grammar patterns",
    solidColor: "#8b5cf6",
    darkBg: "bg-violet-900/30",
    lightBg: "bg-violet-50",
    sentenceColors: ["#a78bfa", "#8b5cf6", "#7c3aed", "#6d28d9", "#5b21b6"],
  },
  4: {
    gradient: "from-amber-400 via-orange-500 to-red-500",
    bgGradient: "from-amber-500/20 via-orange-500/20 to-red-500/20",
    icon: "⭐",
    color: "amber",
    title: "HSK 4 - Upper-Intermediate",
    description: "Complex grammatical structures",
    solidColor: "#f59e0b",
    darkBg: "bg-amber-900/30",
    lightBg: "bg-amber-50",
    sentenceColors: ["#fbbf24", "#f59e0b", "#d97706", "#b45309", "#92400e"],
  },
  5: {
    gradient: "from-rose-400 via-pink-500 to-red-500",
    bgGradient: "from-rose-500/20 via-pink-500/20 to-red-500/20",
    icon: "💎",
    color: "rose",
    title: "HSK 5 - Advanced",
    description: "Advanced grammar mastery",
    solidColor: "#f43f5e",
    darkBg: "bg-rose-900/30",
    lightBg: "bg-rose-50",
    sentenceColors: ["#fb7185", "#f43f5e", "#e11d48", "#be123c", "#9f1239"],
  },
  6: {
    gradient: "from-red-400 via-rose-500 to-orange-500",
    bgGradient: "from-red-500/20 via-rose-500/20 to-orange-500/20",
    icon: "🏆",
    color: "red",
    title: "HSK 6 - Proficient",
    description: "Master level grammar skills",
    solidColor: "#ef4444",
    darkBg: "bg-red-900/30",
    lightBg: "bg-red-50",
    sentenceColors: ["#f87171", "#ef4444", "#dc2626", "#b91c1c", "#991b1b"],
  },
};

// Simple Card Component (no 3D to avoid click blocking)
const Card3D = ({
  children,
  className = "",
  isDark = false,
  level = 1,
}: {
  children: React.ReactNode;
  className?: string;
  isDark?: boolean;
  level?: number;
}) => {
  return (
    <div
      className={`relative transition-all duration-300 hover:scale-[1.02] hover:shadow-lg ${className}`}
    >
      {children}
    </div>
  );
};

export default function HSKGrammarPage() {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const { isAuthenticated } = useAuth();
  const [selectedLevel, setSelectedLevel] = useState<HSKLevel>(1);
  const [activeSubTab, setActiveSubTab] = useState<GrammarSubTab>("learn");
  const [stats, setStats] = useState<GrammarStats[]>([]);
  const [loadingStats, setLoadingStats] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const {
    savedSentences,
    toggleSaveSentence,
    isSentenceSaved,
    removeSavedSentence,
  } = useSavedGrammarSentences();

  const scrollToContent = () => {
    setTimeout(() => {
      contentRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 100);
  };

  const handleSubTabChange = (tab: GrammarSubTab) => {
    setActiveSubTab(tab);
    scrollToContent();
  };

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoadingStats(true);
        setError(null);
        const response = await hskGrammarApi.getStats();
        console.log("API Response:", response);
        if (response.success && response.data) {
          // Ensure data is an array
          const dataArray = Array.isArray(response.data) ? response.data : [];
          console.log("Data array:", dataArray);
          setStats(dataArray);
        } else {
          setError("Failed to load stats");
        }
      } catch (err) {
        console.error("Failed to fetch grammar stats:", err);
        setError(
          "Failed to load stats: " +
            (err instanceof Error ? err.message : String(err)),
        );
      } finally {
        setLoadingStats(false);
      }
    };
    fetchStats();
  }, []);

  const getLevelStats = (level: HSKLevel) => {
    if (!Array.isArray(stats) || stats.length === 0) {
      // Fallback data while loading or if API fails
      const fallbackData: Record<
        number,
        { sentences: number; topics: number }
      > = {
        1: { sentences: 625, topics: 10 },
        2: { sentences: 972, topics: 15 },
        3: { sentences: 931, topics: 20 },
        4: { sentences: 1162, topics: 25 },
        5: { sentences: 1041, topics: 30 },
        6: { sentences: 322, topics: 15 },
      };
      return fallbackData[level] || { sentences: 0, topics: 0 };
    }
    const levelStat = stats.find((s) => s.level === level);
    return {
      sentences: levelStat?.totalSentences || 0,
      topics: levelStat?.topics || 0,
    };
  };

  const handleQuizComplete = (_result: GrammarQuizResult) => {
    // Quiz completion handler
  };

  const handleExitQuiz = () => {
    setActiveSubTab("learn");
  };

  const config = levelConfig[selectedLevel];

  if (activeSubTab === "quiz") {
    return (
      <div
        className={`min-h-screen ${isDark ? "bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" : "bg-gradient-to-br from-slate-50 via-white to-slate-100"}`}
      >
        <div className="container mx-auto px-4 py-8">
          <button
            onClick={handleExitQuiz}
            className={`flex items-center gap-2 mb-6 transition-colors ${isDark ? "text-white/60 hover:text-white" : "text-slate-600 hover:text-slate-900"}`}
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Grammar
          </button>
          <GrammarQuiz
            isDark={isDark}
            level={selectedLevel}
            onComplete={handleQuizComplete}
            onExit={handleExitQuiz}
          />
        </div>
      </div>
    );
  }

  // Error display
  if (error) {
    return (
      <div
        className={`min-h-screen flex items-center justify-center ${isDark ? "bg-slate-900" : "bg-slate-50"}`}
      >
        <div
          className={`p-8 rounded-2xl text-center max-w-md ${isDark ? "bg-white/5 text-white" : "bg-white text-slate-900"}`}
        >
          <h2 className="text-2xl font-bold mb-4">Error</h2>
          <p className="mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600"
          >
            Reload Page
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen ${isDark ? "bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" : "bg-gradient-to-br from-slate-50 via-white to-slate-100"}`}
    >
      <div className="w-full max-w-6xl mx-auto px-3 sm:px-4 py-4 sm:py-8 space-y-4 sm:space-y-6 overflow-x-hidden">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sm:mb-8">
          <div className="flex-1 min-w-0">
            <h1
              className={`text-2xl sm:text-3xl md:text-4xl font-bold mb-1 sm:mb-2 truncate ${isDark ? "text-white" : "text-slate-900"}`}
            >
              🎓 HSK Grammar Master
            </h1>
            <p
              className={`text-sm sm:text-base md:text-lg ${isDark ? "text-white/60" : "text-slate-600"}`}
            >
              Learn grammar patterns with audio, flashcards, and quizzes
            </p>
          </div>

          <Link
            to="/hsk"
            className={`flex items-center justify-center gap-2 px-3 sm:px-4 py-2 rounded-xl transition-all text-sm sm:text-base whitespace-nowrap ${
              isDark
                ? "bg-white/10 hover:bg-white/20 text-white"
                : "bg-slate-100 hover:bg-slate-200 text-slate-900"
            }`}
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Back to HSK</span>
            <span className="sm:hidden">Back</span>
          </Link>
        </div>

        {/* Saved Sentences Quick Access */}
        {savedSentences.length > 0 && (
          <button
            onClick={() => handleSubTabChange("saved")}
            className={`w-full flex items-center justify-between p-3 sm:p-4 rounded-xl transition-all ${
              activeSubTab === "saved"
                ? isDark
                  ? "bg-rose-500/20 border border-rose-500/30"
                  : "bg-rose-100 border border-rose-200"
                : isDark
                  ? "bg-slate-800/50 border border-slate-700 hover:bg-slate-800"
                  : "bg-white border border-slate-200 hover:bg-slate-50"
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`p-2 rounded-lg ${isDark ? "bg-rose-500/30" : "bg-rose-200"}`}
              >
                <Heart
                  className={`w-5 h-5 ${isDark ? "text-rose-400" : "text-rose-600"} fill-current`}
                />
              </div>
              <div className="text-left">
                <p
                  className={`font-semibold ${isDark ? "text-white" : "text-slate-900"}`}
                >
                  Saved Grammar Sentences
                </p>
                <p
                  className={`text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}
                >
                  {savedSentences.length} sentence
                  {savedSentences.length !== 1 ? "s" : ""} saved
                </p>
              </div>
            </div>
            <ChevronRight
              className={`w-5 h-5 ${isDark ? "text-slate-400" : "text-slate-500"}`}
            />
          </button>
        )}

        {/* Level Selection Cards - 3D */}
        <div className="grid grid-cols-3 md:grid-cols-6 gap-2 sm:gap-3 md:gap-4">
          {([1, 2, 3, 4, 5, 6] as HSKLevel[]).map((level) => {
            const lvlConfig = levelConfig[level];
            const isActive = selectedLevel === level;
            const levelStats = getLevelStats(level);

            return (
              <Card3D
                key={level}
                isDark={isDark}
                level={level}
                className="h-full"
              >
                <button
                  onClick={() => {
                    setSelectedLevel(level);
                    setActiveSubTab("learn");
                  }}
                  className={`w-full h-full p-2 sm:p-3 md:p-4 rounded-lg sm:rounded-xl transition-all duration-300 ${
                    isActive
                      ? `${isDark ? lvlConfig.darkBg : lvlConfig.lightBg} border-2`
                      : isDark
                        ? "bg-slate-800 border border-slate-700 hover:bg-slate-700"
                        : "bg-white border border-slate-200 hover:bg-slate-50"
                  }`}
                  style={{
                    borderColor: isActive ? lvlConfig.solidColor : undefined,
                    boxShadow: isActive
                      ? `0 0 20px ${lvlConfig.solidColor}40`
                      : undefined,
                  }}
                >
                  {/* Level Badge */}
                  <div
                    className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 mx-auto mb-1 sm:mb-2 rounded-lg sm:rounded-xl flex items-center justify-center text-lg sm:text-xl md:text-2xl shadow-lg"
                    style={{
                      background: `linear-gradient(135deg, ${lvlConfig.solidColor} 0%, ${lvlConfig.solidColor}dd 100%)`,
                    }}
                  >
                    {lvlConfig.icon}
                  </div>

                  <h3
                    className={`text-xs sm:text-sm md:text-base font-bold mb-0.5 sm:mb-1 ${isDark ? "text-white" : "text-slate-900"}`}
                  >
                    HSK {level}
                  </h3>

                  <p
                    className="text-[10px] sm:text-xs md:text-sm font-medium truncate"
                    style={{ color: lvlConfig.solidColor }}
                  >
                    {loadingStats ? "..." : levelStats.sentences}{" "}
                    <span className="hidden sm:inline">sentences</span>
                    <span className="sm:hidden">sents</span>
                  </p>

                  {isActive && (
                    <div
                      className="absolute -top-1 -right-1 w-3 h-3 rounded-full animate-pulse"
                      style={{ backgroundColor: lvlConfig.solidColor }}
                    />
                  )}
                </button>
              </Card3D>
            );
          })}
        </div>

        {/* Selected Level Header - 3D */}
        <Card3D isDark={isDark} level={selectedLevel} className="h-full">
          <div
            className={`rounded-lg sm:rounded-xl p-3 sm:p-4 md:p-5 ${isDark ? config.darkBg : config.lightBg} border-2`}
            style={{ borderColor: config.solidColor }}
          >
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-lg sm:rounded-xl flex items-center justify-center text-xl sm:text-2xl md:text-3xl shadow-lg flex-shrink-0"
                  style={{
                    background: `linear-gradient(135deg, ${config.solidColor} 0%, ${config.solidColor}dd 100%)`,
                  }}
                >
                  {config.icon}
                </div>
                <div className="flex-1 min-w-0 sm:hidden">
                  <h2
                    className={`text-sm font-bold truncate ${isDark ? "text-white" : "text-slate-900"}`}
                  >
                    {config.title}
                  </h2>
                  <p
                    className={`text-[10px] truncate ${isDark ? "text-slate-400" : "text-slate-500"}`}
                  >
                    {config.description}
                  </p>
                </div>
              </div>

              <div className="hidden sm:block flex-1 min-w-0">
                <h2
                  className={`text-base md:text-lg font-bold truncate ${isDark ? "text-white" : "text-slate-900"}`}
                >
                  {config.title}
                </h2>
                <p
                  className={`text-xs md:text-sm truncate ${isDark ? "text-slate-400" : "text-slate-500"}`}
                >
                  {config.description}
                </p>
              </div>

              {/* Quick Stats - Inline with Dynamic Colors */}
              <div className="flex items-center justify-center sm:justify-end gap-4 sm:gap-3 md:gap-6">
                <div className="text-center">
                  <p
                    className="text-base sm:text-lg md:text-xl font-bold"
                    style={{ color: config.solidColor }}
                  >
                    {loadingStats
                      ? "..."
                      : getLevelStats(selectedLevel).sentences}
                  </p>
                  <p
                    className={`text-[10px] sm:text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}
                  >
                    <span className="hidden sm:inline">Sentences</span>
                    <span className="sm:hidden">Sents</span>
                  </p>
                </div>

                <div className="text-center">
                  <p
                    className="text-base sm:text-lg md:text-xl font-bold"
                    style={{ color: config.solidColor }}
                  >
                    {loadingStats ? "..." : getLevelStats(selectedLevel).topics}
                  </p>
                  <p
                    className={`text-[10px] md:text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}
                  >
                    Topics
                  </p>
                </div>
              </div>
            </div>
          </div>
        </Card3D>

        {/* Feature Cards - 3D with Dynamic Colors */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3">
          {/* Study with Flashcards */}
          <Card3D isDark={isDark} level={selectedLevel}>
            <button
              onClick={() => handleSubTabChange("study")}
              className={`w-full h-full p-3 md:p-4 rounded-xl text-left transition-all duration-300 ${
                isDark
                  ? "bg-slate-800 border border-slate-700 hover:bg-slate-700"
                  : "bg-white border border-slate-200 hover:bg-slate-50"
              }`}
              style={{
                borderColor: isDark ? undefined : config.solidColor + "30",
              }}
            >
              <div
                className="w-8 h-8 md:w-10 md:h-10 rounded-lg flex items-center justify-center mb-2 group-hover:scale-110 transition-transform"
                style={{ backgroundColor: config.solidColor }}
              >
                <Brain className="w-4 h-4 md:w-5 md:h-5 text-white" />
              </div>

              <h3
                className={`text-xs md:text-sm font-bold mb-1 ${isDark ? "text-white" : "text-slate-900"}`}
              >
                Flashcards
              </h3>

              <p
                className={`text-[10px] md:text-xs mb-2 line-clamp-2 ${isDark ? "text-slate-400" : "text-slate-500"}`}
              >
                Learn with interactive cards
              </p>

              <div
                className="flex items-center gap-1 text-[10px] md:text-xs font-medium"
                style={{ color: config.solidColor }}
              >
                Start
                <ChevronRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
              </div>
            </button>
          </Card3D>

          {/* Take a Quiz */}
          <Card3D isDark={isDark} level={selectedLevel}>
            <button
              onClick={() => handleSubTabChange("quiz")}
              className={`w-full h-full p-3 md:p-4 rounded-xl text-left transition-all duration-300 ${
                isDark
                  ? "bg-slate-800 border border-slate-700 hover:bg-slate-700"
                  : "bg-white border border-slate-200 hover:bg-slate-50"
              }`}
              style={{
                borderColor: isDark ? undefined : config.solidColor + "30",
              }}
            >
              <div
                className="w-8 h-8 md:w-10 md:h-10 rounded-lg flex items-center justify-center mb-2 group-hover:scale-110 transition-transform"
                style={{ backgroundColor: config.solidColor }}
              >
                <Target className="w-4 h-4 md:w-5 md:h-5 text-white" />
              </div>

              <h3
                className={`text-xs md:text-sm font-bold mb-1 ${isDark ? "text-white" : "text-slate-900"}`}
              >
                Quiz
              </h3>

              <p
                className={`text-[10px] md:text-xs mb-2 line-clamp-2 ${isDark ? "text-slate-400" : "text-slate-500"}`}
              >
                Test your knowledge
              </p>

              <div
                className="flex items-center gap-1 text-[10px] md:text-xs font-medium"
                style={{ color: config.solidColor }}
              >
                Start
                <ChevronRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
              </div>
            </button>
          </Card3D>

          {/* Explore Patterns */}
          <Card3D isDark={isDark} level={selectedLevel}>
            <button
              onClick={() => handleSubTabChange("patterns")}
              className={`w-full h-full p-3 md:p-4 rounded-xl text-left transition-all duration-300 ${
                isDark
                  ? "bg-slate-800 border border-slate-700 hover:bg-slate-700"
                  : "bg-white border border-slate-200 hover:bg-slate-50"
              }`}
              style={{
                borderColor: isDark ? undefined : config.solidColor + "30",
              }}
            >
              <div
                className="w-8 h-8 md:w-10 md:h-10 rounded-lg flex items-center justify-center mb-2 group-hover:scale-110 transition-transform"
                style={{ backgroundColor: config.solidColor }}
              >
                <FileText className="w-4 h-4 md:w-5 md:h-5 text-white" />
              </div>

              <h3
                className={`text-xs md:text-sm font-bold mb-1 ${isDark ? "text-white" : "text-slate-900"}`}
              >
                Patterns
              </h3>

              <p
                className={`text-[10px] md:text-xs mb-2 line-clamp-2 ${isDark ? "text-slate-400" : "text-slate-500"}`}
              >
                Browse by topic
              </p>

              <div
                className="flex items-center gap-1 text-[10px] md:text-xs font-medium"
                style={{ color: config.solidColor }}
              >
                Browse
                <ChevronRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
              </div>
            </button>
          </Card3D>

          {/* Browse Sentences */}
          <Card3D isDark={isDark} level={selectedLevel}>
            <button
              onClick={() => handleSubTabChange("learn")}
              className={`w-full h-full p-3 md:p-4 rounded-xl text-left transition-all duration-300 ${
                isDark
                  ? "bg-slate-800 border border-slate-700 hover:bg-slate-700"
                  : "bg-white border border-slate-200 hover:bg-slate-50"
              }`}
              style={{
                borderColor: isDark ? undefined : config.solidColor + "30",
              }}
            >
              <div
                className="w-8 h-8 md:w-10 md:h-10 rounded-lg flex items-center justify-center mb-2 group-hover:scale-110 transition-transform"
                style={{ backgroundColor: config.solidColor }}
              >
                <BookOpen className="w-4 h-4 md:w-5 md:h-5 text-white" />
              </div>

              <h3
                className={`text-xs md:text-sm font-bold mb-1 ${isDark ? "text-white" : "text-slate-900"}`}
              >
                Sentences
              </h3>

              <p
                className={`text-[10px] md:text-xs mb-2 line-clamp-2 ${isDark ? "text-slate-400" : "text-slate-500"}`}
              >
                View all sentences
              </p>

              <div
                className="flex items-center gap-1 text-[10px] md:text-xs font-medium"
                style={{ color: config.solidColor }}
              >
                Browse
                <ChevronRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
              </div>
            </button>
          </Card3D>

          {/* Download Resources */}
          <Card3D isDark={isDark} level={selectedLevel}>
            <button
              onClick={() => handleSubTabChange("export")}
              className={`w-full h-full p-3 md:p-4 rounded-xl text-left transition-all duration-300 ${
                isDark
                  ? "bg-slate-800 border border-slate-700 hover:bg-slate-700"
                  : "bg-white border border-slate-200 hover:bg-slate-50"
              }`}
              style={{
                borderColor: isDark ? undefined : config.solidColor + "30",
              }}
            >
              <div
                className="w-8 h-8 md:w-10 md:h-10 rounded-lg flex items-center justify-center mb-2 group-hover:scale-110 transition-transform"
                style={{ backgroundColor: config.solidColor }}
              >
                <Download className="w-4 h-4 md:w-5 md:h-5 text-white" />
              </div>

              <h3
                className={`text-xs md:text-sm font-bold mb-1 ${isDark ? "text-white" : "text-slate-900"}`}
              >
                Download
              </h3>

              <p
                className={`text-[10px] md:text-xs mb-2 line-clamp-2 ${isDark ? "text-slate-400" : "text-slate-500"}`}
              >
                Export data
              </p>

              <div
                className="flex items-center gap-1 text-[10px] md:text-xs font-medium"
                style={{ color: config.solidColor }}
              >
                Export
                <ChevronRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
              </div>
            </button>
          </Card3D>

          {/* Track Progress */}
          <Card3D isDark={isDark} level={selectedLevel}>
            <button
              onClick={() => handleSubTabChange("progress")}
              className={`w-full h-full p-3 md:p-4 rounded-xl text-left transition-all duration-300 ${
                isDark
                  ? "bg-slate-800 border border-slate-700 hover:bg-slate-700"
                  : "bg-white border border-slate-200 hover:bg-slate-50"
              }`}
              style={{
                borderColor: isDark ? undefined : config.solidColor + "30",
              }}
            >
              <div
                className="w-8 h-8 md:w-10 md:h-10 rounded-lg flex items-center justify-center mb-2 group-hover:scale-110 transition-transform"
                style={{ backgroundColor: config.solidColor }}
              >
                <BarChart3 className="w-4 h-4 md:w-5 md:h-5 text-white" />
              </div>

              <h3
                className={`text-xs md:text-sm font-bold mb-1 ${isDark ? "text-white" : "text-slate-900"}`}
              >
                Progress
              </h3>

              <p
                className={`text-[10px] md:text-xs mb-2 line-clamp-2 ${isDark ? "text-slate-400" : "text-slate-500"}`}
              >
                Track your learning
              </p>

              <div
                className="flex items-center gap-1 text-[10px] md:text-xs font-medium"
                style={{ color: config.solidColor }}
              >
                View
                <ChevronRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
              </div>
            </button>
          </Card3D>

          {/* Saved Sentences */}
          <Card3D isDark={isDark} level={selectedLevel}>
            <button
              onClick={() => handleSubTabChange("saved")}
              className={`w-full h-full p-3 md:p-4 rounded-xl text-left transition-all duration-300 ${
                isDark
                  ? "bg-slate-800 border border-slate-700 hover:bg-slate-700"
                  : "bg-white border border-slate-200 hover:bg-slate-50"
              }`}
              style={{
                borderColor: isDark ? undefined : config.solidColor + "30",
              }}
            >
              <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg flex items-center justify-center mb-2 group-hover:scale-110 transition-transform bg-rose-500">
                <Heart className="w-4 h-4 md:w-5 md:h-5 text-white" />
              </div>

              <h3
                className={`text-xs md:text-sm font-bold mb-1 ${isDark ? "text-white" : "text-slate-900"}`}
              >
                Saved
              </h3>

              <p
                className={`text-[10px] md:text-xs mb-2 line-clamp-2 ${isDark ? "text-slate-400" : "text-slate-500"}`}
              >
                {savedSentences.length} sentences saved
              </p>

              <div className="flex items-center gap-1 text-[10px] md:text-xs font-medium text-rose-500">
                View
                <ChevronRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
              </div>
            </button>
          </Card3D>
        </div>

        {/* Feature Views */}
        <div ref={contentRef} className="pt-4">
          {activeSubTab === "learn" && (
            <GrammarSentenceBrowser isDark={isDark} level={selectedLevel} />
          )}

          {activeSubTab === "study" && (
            <GrammarStudyMode isDark={isDark} level={selectedLevel} />
          )}

          {activeSubTab === "patterns" && (
            <GrammarPatternExplorer isDark={isDark} level={selectedLevel} />
          )}

          {activeSubTab === "progress" && (
            <GrammarProgress
              isDark={isDark}
              level={selectedLevel}
              totalSentences={getLevelStats(selectedLevel).sentences}
            />
          )}

          {activeSubTab === "export" && (
            <GrammarDownloads isDark={isDark} level={selectedLevel} />
          )}

          {activeSubTab === "saved" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2
                  className={`text-xl font-bold ${isDark ? "text-white" : "text-slate-900"}`}
                >
                  ❤️ Saved Grammar Sentences
                </h2>
                {savedSentences.length > 0 && (
                  <button
                    onClick={() => {
                      if (
                        confirm(
                          "Are you sure you want to clear all saved sentences?",
                        )
                      ) {
                        savedSentences.forEach((s) =>
                          removeSavedSentence(s.id),
                        );
                      }
                    }}
                    className={`text-xs px-3 py-1.5 rounded-lg transition-all ${
                      isDark
                        ? "bg-red-500/20 text-red-400 hover:bg-red-500/30"
                        : "bg-red-100 text-red-600 hover:bg-red-200"
                    }`}
                  >
                    Clear All
                  </button>
                )}
              </div>

              {savedSentences.length === 0 ? (
                <div
                  className={`p-8 rounded-2xl text-center ${isDark ? "bg-slate-800/50" : "bg-slate-100"}`}
                >
                  <Heart
                    className={`w-12 h-12 mx-auto mb-4 ${isDark ? "text-slate-600" : "text-slate-400"}`}
                  />
                  <p
                    className={`text-lg mb-2 ${isDark ? "text-white" : "text-slate-900"}`}
                  >
                    No saved sentences yet
                  </p>
                  <p
                    className={`text-sm mb-4 ${isDark ? "text-slate-400" : "text-slate-500"}`}
                  >
                    Click the heart icon on any grammar sentence to save it here
                  </p>
                  <button
                    onClick={() => handleSubTabChange("learn")}
                    className={`px-4 py-2 rounded-lg font-medium transition-all ${
                      isDark
                        ? "bg-indigo-500/20 text-indigo-400 hover:bg-indigo-500/30"
                        : "bg-indigo-100 text-indigo-600 hover:bg-indigo-200"
                    }`}
                  >
                    Browse Sentences
                  </button>
                </div>
              ) : (
                <div className="grid gap-3">
                  {savedSentences.map((sentence) => {
                    const sentenceConfig = levelConfig[sentence.level];
                    return (
                      <div
                        key={sentence.id}
                        className={`p-4 rounded-xl transition-all ${
                          isDark
                            ? "bg-slate-800 border border-slate-700 hover:border-slate-600"
                            : "bg-white border border-slate-200 hover:shadow-md"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span
                                className="px-2 py-0.5 rounded text-xs font-medium text-white"
                                style={{
                                  backgroundColor: sentenceConfig.solidColor,
                                }}
                              >
                                HSK {sentence.level}
                              </span>
                              {sentence.topic && (
                                <span
                                  className={`text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}
                                >
                                  📖 {sentence.topic}
                                </span>
                              )}
                            </div>
                            <p
                              className={`text-lg font-bold ${isDark ? "text-white" : "text-slate-900"}`}
                            >
                              {sentence.sentenceClean}
                            </p>
                            <p
                              className={`text-sm ${isDark ? "text-indigo-400" : "text-indigo-600"}`}
                            >
                              {sentence.pinyin}
                            </p>
                            <p
                              className={`text-sm mt-1 ${isDark ? "text-slate-300" : "text-slate-600"}`}
                            >
                              {sentence.english}
                            </p>
                            {sentence.grammarPattern && (
                              <p
                                className={`text-xs mt-2 ${isDark ? "text-slate-400" : "text-slate-500"}`}
                              >
                                📖 {sentence.grammarPattern}
                              </p>
                            )}
                          </div>
                          <button
                            onClick={() => removeSavedSentence(sentence.id)}
                            className={`p-2 rounded-lg transition-all ${
                              isDark
                                ? "bg-rose-500/20 text-rose-400 hover:bg-rose-500/30"
                                : "bg-rose-100 text-rose-500 hover:bg-rose-200"
                            }`}
                            title="Remove from saved"
                          >
                            <Heart className="w-5 h-5 fill-current" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
