import { useState, useEffect, useCallback } from "react";
import {
  Eye,
  EyeOff,
  Volume2,
  Check,
  Bookmark,
  BookmarkCheck,
  ChevronLeft,
  ChevronRight,
  Brain,
} from "lucide-react";
import type { HSKLevel, HSKGrammarSentence } from "@/types/hsk";
import { hskGrammarApi } from "@/lib/api";
import { toast } from "sonner";

interface GrammarStudyModeProps {
  isDark: boolean;
  level: HSKLevel;
}

export default function GrammarStudyMode({
  isDark,
  level,
}: GrammarStudyModeProps) {
  const [sentences, setSentences] = useState<HSKGrammarSentence[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showPinyin, setShowPinyin] = useState(false);
  const [showEnglish, setShowEnglish] = useState(false);
  const [showPattern, setShowPattern] = useState(false);
  const [bookmarked, setBookmarked] = useState<number[]>([]);
  const [mastered, setMastered] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [audioPlaying, setAudioPlaying] = useState<number | null>(null);

  useEffect(() => {
    loadSentences();
    loadProgress();
  }, [level]);

  const loadSentences = async () => {
    if (!level || level < 1 || level > 6) {
      console.warn("Invalid level in GrammarStudyMode:", level);
      return;
    }
    try {
      setLoading(true);
      const response = await hskGrammarApi.getGrammarByLevel(level, 1, 50);

      if (response.success && response.data) {
        setSentences(response.data.sentences);
      }
    } catch (error) {
      console.error("Error loading sentences:", error);
      toast.error("Failed to load sentences");
    } finally {
      setLoading(false);
    }
  };

  const loadProgress = () => {
    const saved = localStorage.getItem(`grammar-progress-${level}`);
    if (saved) {
      const progress = JSON.parse(saved);
      setBookmarked(progress.practicedSentences || []);
      setMastered(progress.masteredSentences || []);
    }
  };

  const saveProgress = (sentenceId: number, action: "bookmark" | "master") => {
    const saved = localStorage.getItem(`grammar-progress-${level}`);
    let progress = saved
      ? JSON.parse(saved)
      : {
          level,
          sentencesLearned: 0,
          totalSentences: sentences.length,
          practicedSentences: [],
          masteredSentences: [],
          lastStudied: null,
          studyStreak: 0,
          timeSpentMinutes: 0,
          weakSentences: [],
        };

    if (
      action === "bookmark" &&
      !progress.practicedSentences.includes(sentenceId)
    ) {
      progress.practicedSentences.push(sentenceId);
      progress.sentencesLearned = progress.practicedSentences.length;
      progress.lastStudied = new Date().toISOString();
    } else if (
      action === "master" &&
      !progress.masteredSentences.includes(sentenceId)
    ) {
      progress.masteredSentences.push(sentenceId);
      const weakIndex = progress.weakSentences.indexOf(sentenceId);
      if (weakIndex > -1) {
        progress.weakSentences.splice(weakIndex, 1);
      }
    }

    localStorage.setItem(`grammar-progress-${level}`, JSON.stringify(progress));
    setBookmarked(progress.practicedSentences);
    setMastered(progress.masteredSentences);
  };

  const playAudio = useCallback(
    (sentence: HSKGrammarSentence) => {
      if (!sentence.audioFile) {
        toast.error("No audio available");
        return;
      }

      const audio = new Audio(
        hskGrammarApi.getAudioUrl(level, sentence.audioFile),
      );
      setAudioPlaying(sentence.id);

      audio.onended = () => setAudioPlaying(null);
      audio.onerror = () => setAudioPlaying(null);

      audio.play().catch((err) => {
        console.error("Error playing audio:", err);
        setAudioPlaying(null);
        toast.error("Failed to play audio");
      });
    },
    [level],
  );

  const nextCard = () => {
    if (currentIndex < sentences.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setShowPinyin(false);
      setShowEnglish(false);
      setShowPattern(false);
    }
  };

  const prevCard = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setShowPinyin(false);
      setShowEnglish(false);
      setShowPattern(false);
    }
  };

  const handleBookmark = () => {
    const sentence = sentences[currentIndex];
    if (bookmarked.includes(sentence.id)) {
      toast.info("Removed from practiced");
      setBookmarked(bookmarked.filter((id) => id !== sentence.id));
    } else {
      toast.success("Marked as practiced ✓");
      saveProgress(sentence.id, "bookmark");
    }
  };

  const handleMaster = () => {
    const sentence = sentences[currentIndex];
    if (mastered.includes(sentence.id)) {
      toast.info("Removed from mastered");
      setMastered(mastered.filter((id) => id !== sentence.id));
    } else {
      toast.success("Marked as mastered! 🎉");
      saveProgress(sentence.id, "master");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-500/20 border-t-indigo-500"></div>
      </div>
    );
  }

  if (sentences.length === 0) {
    return (
      <div className="text-center py-12">
        <Brain
          className={`w-16 h-16 mx-auto mb-4 ${isDark ? "text-slate-600" : "text-slate-300"}`}
        />
        <p className={isDark ? "text-slate-400" : "text-slate-500"}>
          No sentences available
        </p>
      </div>
    );
  }

  const currentSentence = sentences[currentIndex];
  const isBookmarked = bookmarked.includes(currentSentence.id);
  const isMastered = mastered.includes(currentSentence.id);

  const levelColors: Record<number, { gradient: string }> = {
    1: { gradient: "from-emerald-500/20 via-teal-500/20 to-cyan-500/20" },
    2: { gradient: "from-blue-500/20 via-cyan-500/20 to-indigo-500/20" },
    3: { gradient: "from-violet-500/20 via-purple-500/20 to-pink-500/20" },
    4: { gradient: "from-amber-500/20 via-orange-500/20 to-red-500/20" },
    5: { gradient: "from-rose-500/20 via-pink-500/20 to-red-500/20" },
    6: { gradient: "from-red-500/20 via-rose-500/20 to-orange-500/20" },
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
    <div className="space-y-3 md:space-y-6 max-w-4xl mx-auto">
      {/* Progress Bar */}
      <div
        className={`backdrop-blur-xl rounded-xl md:rounded-2xl p-3 md:p-4 ${isDark ? "bg-white/5 border border-white/10" : "bg-white/50 border border-black/5"}`}
      >
        <div className="flex items-center justify-between mb-1.5">
          <span
            className={`text-xs md:text-sm font-medium ${isDark ? "text-white" : "text-slate-900"}`}
          >
            {currentIndex + 1}/{sentences.length}
          </span>
          <div className="flex gap-3 md:gap-4 text-xs">
            <span
              className={`${isDark ? "text-indigo-400" : "text-indigo-600"}`}
            >
              ✓ {bookmarked.length}
            </span>
            <span className={`${isDark ? "text-green-400" : "text-green-600"}`}>
              ★ {mastered.length}
            </span>
          </div>
        </div>
        <div
          className={`h-1 md:h-1.5 rounded-full overflow-hidden ${isDark ? "bg-white/10" : "bg-black/5"}`}
        >
          <div
            className={`h-full bg-gradient-to-r ${colors.gradient} backdrop-blur-sm transition-all duration-500`}
            style={{
              width: `${((currentIndex + 1) / sentences.length) * 100}%`,
            }}
          />
        </div>
      </div>

      {/* Flashcard */}
      <div
        className={`relative min-h-[280px] sm:min-h-[350px] md:min-h-[420px] flex items-center justify-center p-4 sm:p-5 md:p-8 rounded-2xl md:rounded-3xl backdrop-blur-2xl ${isDark ? "bg-white/5 border border-white/10" : "bg-white/70 border border-black/5"} shadow-xl md:shadow-2xl overflow-hidden`}
      >
        {/* Background decoration */}
        <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-gradient-to-bl from-emerald-500/10 via-teal-500/5 to-transparent rounded-bl-full blur-2xl" />
        <div className="absolute bottom-0 left-0 w-1/3 h-1/3 bg-gradient-to-tr from-cyan-500/10 via-teal-500/5 to-transparent rounded-tr-full blur-xl" />

        <div className="relative z-10 w-full max-w-2xl">
          {/* Controls */}
          <div className="flex items-center justify-between mb-3 md:mb-6">
            <button
              onClick={handleBookmark}
              className={`group p-2 md:p-3 rounded-lg md:rounded-xl backdrop-blur-sm transition-all duration-300 ${
                isBookmarked
                  ? "bg-indigo-500/30 text-indigo-400"
                  : isDark
                    ? "bg-white/10 hover:bg-white/20 text-white/60"
                    : "bg-black/5 hover:bg-black/10 text-slate-600"
              }`}
            >
              {isBookmarked ? (
                <BookmarkCheck className="w-4 h-4 md:w-5 md:h-5" />
              ) : (
                <Bookmark className="w-4 h-4 md:w-5 md:h-5" />
              )}
            </button>

            <button
              onClick={handleMaster}
              className={`group p-2 md:p-3 rounded-lg md:rounded-xl backdrop-blur-sm transition-all duration-300 ${
                isMastered
                  ? "bg-green-500/30 text-green-400"
                  : isDark
                    ? "bg-white/10 hover:bg-white/20 text-white/60"
                    : "bg-black/5 hover:bg-black/10 text-slate-600"
              }`}
            >
              <Check className="w-4 h-4 md:w-5 md:h-5" />
            </button>
          </div>

          {/* Main content */}
          <div className="text-center space-y-3 md:space-y-5">
            {/* Chinese sentence */}
            <div className="space-y-1.5 md:space-y-2">
              <p
                className={`text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold leading-snug md:leading-relaxed ${isDark ? "text-white" : "text-slate-900"}`}
              >
                {currentSentence.sentenceClean}
              </p>

              {showPinyin ? (
                <p
                  className={`text-lg md:text-xl lg:text-2xl ${isDark ? "text-indigo-400" : "text-indigo-600"}`}
                >
                  {currentSentence.pinyin}
                </p>
              ) : (
                <button
                  onClick={() => setShowPinyin(true)}
                  className={`inline-flex items-center gap-1.5 md:gap-2 px-3 py-1.5 md:px-4 md:py-2 rounded-lg text-xs md:text-sm backdrop-blur-sm transition-all ${
                    isDark
                      ? "bg-white/10 hover:bg-white/20 text-white/60"
                      : "bg-black/5 hover:bg-black/10 text-slate-500"
                  }`}
                >
                  <Eye className="w-3.5 h-3.5 md:w-4 md:h-4" />
                  Pinyin
                </button>
              )}
            </div>

            {/* English */}
            {showEnglish ? (
              <div
                className={`p-3 md:p-4 rounded-lg md:rounded-xl backdrop-blur-sm ${isDark ? "bg-white/10" : "bg-black/5"}`}
              >
                <p
                  className={`text-base md:text-lg lg:text-xl ${isDark ? "text-slate-300" : "text-slate-700"}`}
                >
                  {currentSentence.english}
                </p>
              </div>
            ) : (
              <button
                onClick={() => setShowEnglish(true)}
                className={`inline-flex items-center gap-1.5 md:gap-2 px-3 py-1.5 md:px-4 md:py-2 rounded-lg text-xs md:text-sm backdrop-blur-sm transition-all ${
                  isDark
                    ? "bg-white/10 hover:bg-white/20 text-white/60"
                    : "bg-black/5 hover:bg-black/10 text-slate-500"
                }`}
              >
                <Eye className="w-3.5 h-3.5 md:w-4 md:h-4" />
                English
              </button>
            )}

            {/* Pattern */}
            {showPattern ? (
              <div
                className={`p-3 md:p-4 rounded-lg md:rounded-xl backdrop-blur-sm ${isDark ? "bg-indigo-500/10 border border-indigo-500/20" : "bg-indigo-50 border border-indigo-100"}`}
              >
                <p
                  className={`text-xs md:text-sm font-semibold mb-0.5 md:mb-1 ${isDark ? "text-indigo-400" : "text-indigo-600"}`}
                >
                  Grammar Pattern
                </p>
                <p
                  className={`text-sm md:text-base lg:text-lg ${isDark ? "text-white" : "text-slate-900"}`}
                >
                  {currentSentence.grammarPattern}
                </p>
              </div>
            ) : (
              <button
                onClick={() => setShowPattern(true)}
                className={`inline-flex items-center gap-1.5 md:gap-2 px-3 py-1.5 md:px-4 md:py-2 rounded-lg text-xs md:text-sm backdrop-blur-sm transition-all ${
                  isDark
                    ? "bg-white/10 hover:bg-white/20 text-white/60"
                    : "bg-black/5 hover:bg-black/10 text-slate-500"
                }`}
              >
                <Brain className="w-3.5 h-3.5 md:w-4 md:h-4" />
                Pattern
              </button>
            )}

            {/* Audio button */}
            <button
              onClick={() => playAudio(currentSentence)}
              className={`inline-flex items-center gap-2 md:gap-3 px-4 py-2 md:px-6 md:py-3 rounded-lg md:rounded-xl text-sm md:text-base font-medium transition-all backdrop-blur-sm ${
                audioPlaying === currentSentence.id
                  ? "bg-gradient-to-r from-indigo-500 to-purple-600 text-white"
                  : isDark
                    ? "bg-white/10 hover:bg-white/20 text-white"
                    : "bg-black/5 hover:bg-black/10 text-slate-900"
              }`}
            >
              <Volume2 className="w-4 h-4 md:w-5 md:h-5" />
              {audioPlaying === currentSentence.id ? "Playing..." : "Audio"}
            </button>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between gap-2 md:gap-4">
        <button
          onClick={prevCard}
          disabled={currentIndex === 0}
          className={`flex items-center gap-1.5 md:gap-2 px-4 py-2 md:px-6 md:py-3 rounded-lg md:rounded-xl text-sm md:text-base font-medium transition-all backdrop-blur-sm ${
            currentIndex === 0
              ? "opacity-50 cursor-not-allowed"
              : isDark
                ? "bg-white/10 hover:bg-white/20 text-white"
                : "bg-black/5 hover:bg-black/10 text-slate-900"
          }`}
        >
          <ChevronLeft className="w-4 h-4 md:w-5 md:h-5" />
          <span className="hidden sm:inline">Prev</span>
        </button>

        {/* Dots */}
        <div className="flex items-center gap-1 md:gap-1.5 overflow-x-auto max-w-full px-2">
          {sentences
            .slice(Math.max(0, currentIndex - 5), currentIndex + 6)
            .map((_, idx) => {
              const actualIndex = Math.max(0, currentIndex - 5) + idx;
              return (
                <button
                  key={actualIndex}
                  onClick={() => {
                    setCurrentIndex(actualIndex);
                    setShowPinyin(false);
                    setShowEnglish(false);
                    setShowPattern(false);
                  }}
                  className={`w-1.5 h-1.5 md:w-2 md:h-2 rounded-full transition-all flex-shrink-0 ${
                    actualIndex === currentIndex
                      ? "bg-indigo-500 w-3 md:w-4"
                      : isDark
                        ? "bg-white/30"
                        : "bg-black/30"
                  }`}
                />
              );
            })}
        </div>

        <button
          onClick={nextCard}
          disabled={currentIndex === sentences.length - 1}
          className={`flex items-center gap-1.5 md:gap-2 px-4 py-2 md:px-6 md:py-3 rounded-lg md:rounded-xl text-sm md:text-base font-medium transition-all backdrop-blur-sm ${
            currentIndex === sentences.length - 1
              ? "opacity-50 cursor-not-allowed"
              : isDark
                ? "bg-white/10 hover:bg-white/20 text-white"
                : "bg-black/5 hover:bg-black/10 text-slate-900"
          }`}
        >
          <span className="hidden sm:inline">Next</span>
          <ChevronRight className="w-4 h-4 md:w-5 md:h-5" />
        </button>
      </div>

      {/* Quick actions */}
      <div
        className={`flex items-center justify-center p-2.5 md:p-4 rounded-xl md:rounded-2xl backdrop-blur-xl ${isDark ? "bg-white/5 border border-white/10" : "bg-white/50 border border-black/5"}`}
      >
        <button
          onClick={() => {
            const allVisible = showPinyin && showEnglish && showPattern;
            setShowPinyin(!allVisible);
            setShowEnglish(!allVisible);
            setShowPattern(!allVisible);
          }}
          className={`flex items-center gap-2 px-4 py-2 md:px-5 md:py-2.5 rounded-lg md:rounded-xl text-sm md:text-base font-medium backdrop-blur-sm transition-all ${
            showPinyin && showEnglish && showPattern
              ? "bg-indigo-500/20 text-indigo-400"
              : isDark
                ? "bg-white/10 hover:bg-white/20 text-white/80"
                : "bg-black/5 hover:bg-black/10 text-slate-700"
          }`}
        >
          {showPinyin && showEnglish && showPattern ? (
            <>
              <EyeOff className="w-4 h-4 md:w-5 md:h-5" />
              <span>Hide All</span>
            </>
          ) : (
            <>
              <Eye className="w-4 h-4 md:w-5 md:h-5" />
              <span>Show All</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
