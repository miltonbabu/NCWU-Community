import { useState, useEffect, useCallback, useRef } from "react";
import {
  RotateCcw,
  CheckCircle,
  XCircle,
  Award,
  ChevronRight,
  Volume2,
  Target,
  Clock,
  Trophy,
  Shuffle,
  ListOrdered,
  Play,
  Share2,
  Twitter,
  Facebook,
  Link2,
  Settings,
  Timer,
  Check,
} from "lucide-react";
import type {
  HSKLevel,
  HSKGrammarSentence,
  GrammarQuizQuestion,
  GrammarQuizResult,
} from "@/types/hsk";
import { hskGrammarApi } from "@/lib/api";
import { toast } from "sonner";

const quizTypeLabels: Record<GrammarQuizQuestion["type"], string> = {
  fill_blank: "Fill in the Blank",
  pattern_choice: "Choose the Pattern",
  match_english: "Match English",
  listen_select: "Listen & Select",
  rearrange: "Rearrange Words",
};

interface QuizSettings {
  questionCount: number;
  isRandom: boolean;
  timerEnabled: boolean;
  timerMinutes: number;
}

interface GrammarQuizProps {
  isDark: boolean;
  level: HSKLevel;
  onComplete: (result: GrammarQuizResult) => void;
  onExit: () => void;
}

export default function GrammarQuiz({
  isDark,
  level,
  onComplete,
  onExit,
}: GrammarQuizProps) {
  const [sentences, setSentences] = useState<HSKGrammarSentence[]>([]);
  const [questions, setQuestions] = useState<GrammarQuizQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [showResults, setShowResults] = useState(false);
  const [showSettings, setShowSettings] = useState(true);
  const [loading, setLoading] = useState(false);
  const [startTime, setStartTime] = useState(0);
  const [audioPlaying, setAudioPlaying] = useState<number | null>(null);
  const [userAnswers, setUserAnswers] = useState<
    { questionId: number; answer: string; correct: boolean }[]
  >([]);
  const [timeLeft, setTimeLeft] = useState(0);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  const playCorrectSound = useCallback(() => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new AudioContext();
      }
      const ctx = audioContextRef.current;
      if (ctx.state === "suspended") { ctx.resume(); }
      const notes = [523.25, 659.25, 783.99];
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain); gain.connect(ctx.destination);
        osc.type = "sine";
        osc.frequency.value = freq;
        const start = ctx.currentTime + i * 0.08;
        gain.gain.setValueAtTime(0.15, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.2);
        osc.start(start); osc.stop(start + 0.2);
      });
    } catch {}
  }, []);

  const [settings, setSettings] = useState<QuizSettings>({
    questionCount: 10,
    isRandom: true,
    timerEnabled: false,
    timerMinutes: 5,
  });

  const levelColors: Record<number, { gradient: string; solid: string }> = {
    1: {
      gradient: "from-emerald-500/20 via-teal-500/20 to-cyan-500/20",
      solid: "#10b981",
    },
    2: {
      gradient: "from-blue-500/20 via-cyan-500/20 to-indigo-500/20",
      solid: "#3b82f6",
    },
    3: {
      gradient: "from-violet-500/20 via-purple-500/20 to-pink-500/20",
      solid: "#8b5cf6",
    },
    4: {
      gradient: "from-amber-500/20 via-orange-500/20 to-red-500/20",
      solid: "#f59e0b",
    },
    5: {
      gradient: "from-rose-500/20 via-pink-500/20 to-red-500/20",
      solid: "#f43f5e",
    },
    6: {
      gradient: "from-red-500/20 via-rose-500/20 to-orange-500/20",
      solid: "#ef4444",
    },
  };

  const colors = levelColors[level] || levelColors[1];

  const loadSentences = useCallback(async () => {
    if (!level || level < 1 || level > 6) {
      console.warn("Invalid level in GrammarQuiz:", level);
      return;
    }
    try {
      setLoading(true);
      const response = await hskGrammarApi.getGrammarByLevel(level, 1, 500);

      if (!response.success || !response.data) {
        toast.error("Failed to load grammar sentences");
        return;
      }

      setSentences(response.data.sentences);
    } catch (error) {
      console.error("Error loading sentences:", error);
      toast.error("Failed to load quiz data");
    } finally {
      setLoading(false);
    }
  }, [level]);

  useEffect(() => {
    loadSentences();
  }, [loadSentences]);

  const finishQuiz = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    const timeSpent = Math.floor((Date.now() - startTime) / 1000);
    const result: GrammarQuizResult = {
      score: score,
      totalQuestions: questions.length,
      correctAnswers: score,
      timeSpent: timeSpent,
      completedAt: new Date().toISOString(),
      answers: userAnswers,
    };

    setShowResults(true);
    onComplete(result);
  }, [startTime, score, questions.length, userAnswers, onComplete]);

  const finishQuizRef = useRef(finishQuiz);
  finishQuizRef.current = finishQuiz;

  useEffect(() => {
    if (
      settings.timerEnabled &&
      timeLeft > 0 &&
      !showResults &&
      !showSettings
    ) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            finishQuizRef.current();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [settings.timerEnabled, timeLeft, showResults, showSettings]);

  const generateQuestions = useCallback(() => {
    if (sentences.length === 0) return;

    let selectedSentences = [...sentences];

    if (settings.isRandom) {
      selectedSentences = selectedSentences.sort(() => Math.random() - 0.5);
    }

    selectedSentences = selectedSentences.slice(0, settings.questionCount);

    const generatedQuestions: GrammarQuizQuestion[] = [];

    for (const sentence of selectedSentences) {
      const questionTypes: GrammarQuizQuestion["type"][] = [
        "fill_blank",
        "pattern_choice",
        "match_english",
        "listen_select",
      ];
      const type =
        questionTypes[Math.floor(Math.random() * questionTypes.length)];

      let question: GrammarQuizQuestion;

      if (type === "fill_blank") {
        const words = sentence.sentenceClean.split("");
        const blankIndex = Math.floor(Math.random() * words.length);
        const correctAnswer = words[blankIndex];
        words[blankIndex] = "___";

        const options = [
          correctAnswer,
          ...Array.from({ length: 3 }, () => {
            const randomSentence =
              sentences[Math.floor(Math.random() * sentences.length)];
            const randomWords = randomSentence.sentenceClean.split("");
            return randomWords[Math.floor(Math.random() * randomWords.length)];
          }).filter((v, i, a) => v !== correctAnswer && a.indexOf(v) === i),
        ].sort(() => Math.random() - 0.5);

        question = {
          id: sentence.id,
          type: "fill_blank",
          sentence,
          options,
          correctAnswer,
        };
      } else if (type === "pattern_choice") {
        const patterns = Array.from(
          new Set(sentences.map((s) => s.grammarPattern)),
        ).filter((p) => p);
        const correctAnswer = sentence.grammarPattern;
        const otherPatterns = patterns.filter((p) => p !== correctAnswer);

        const options = [correctAnswer, ...otherPatterns.slice(0, 3)].sort(
          () => Math.random() - 0.5,
        );

        question = {
          id: sentence.id,
          type: "pattern_choice",
          sentence,
          options,
          correctAnswer,
        };
      } else if (type === "match_english") {
        const correctAnswer = sentence.english;
        const otherSentences = sentences.filter((s) => s.id !== sentence.id);

        const options = [
          correctAnswer,
          ...otherSentences.slice(0, 3).map((s) => s.english),
        ].sort(() => Math.random() - 0.5);

        question = {
          id: sentence.id,
          type: "match_english",
          sentence,
          options,
          correctAnswer,
        };
      } else {
        question = {
          id: sentence.id,
          type: "listen_select",
          sentence,
          audioFile: sentence.audioFile,
          correctAnswer: sentence.sentenceClean,
          options: [
            sentence.sentenceClean,
            ...sentences
              .filter((s) => s.id !== sentence.id)
              .slice(0, 3)
              .map((s) => s.sentenceClean),
          ].sort(() => Math.random() - 0.5),
        };
      }

      generatedQuestions.push(question);
    }

    setQuestions(generatedQuestions);
    setStartTime(Date.now());
    if (settings.timerEnabled) {
      setTimeLeft(settings.timerMinutes * 60);
    }
    setShowSettings(false);
  }, [sentences, settings]);

  const playAudio = (sentence: HSKGrammarSentence) => {
    if (!sentence.audioFile) return;

    const audio = new Audio(
      hskGrammarApi.getAudioUrl(level, sentence.audioFile),
    );
    setAudioPlaying(sentence.id);

    audio.onended = () => setAudioPlaying(null);
    audio.onerror = () => setAudioPlaying(null);

    audio.play().catch((err) => {
      console.error("Error playing audio:", err);
      setAudioPlaying(null);
    });
  };

  const handleAnswer = (answer: string) => {
    if (selectedAnswer) return;

    setSelectedAnswer(answer);
    const currentQuestion = questions[currentQuestionIndex];
    const correct = answer === currentQuestion.correctAnswer;

    if (correct) {
      setScore(score + 1);
      playCorrectSound();
      toast.success("Correct! 🎉");
    } else {
      toast.error(
        `Incorrect. The answer was: ${currentQuestion.correctAnswer}`,
      );
    }

    setUserAnswers([
      ...userAnswers,
      {
        questionId: currentQuestion.id,
        answer,
        correct,
      },
    ]);
  };

  const nextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedAnswer(null);
    } else {
      finishQuiz();
    }
  };

  const restartQuiz = () => {
    setQuestions([]);
    setCurrentQuestionIndex(0);
    setSelectedAnswer(null);
    setScore(0);
    setShowResults(false);
    setShowSettings(true);
    setUserAnswers([]);
    setTimeLeft(0);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const getShareText = () => {
    const percentage = Math.round((score / questions.length) * 100);
    return `🎯 I scored ${score}/${questions.length} (${percentage}%) on HSK ${level} Grammar Quiz!\n\nTest your Chinese grammar skills at NCWU International Community! 🇨🇳`;
  };

  const shareToTwitter = () => {
    const text = encodeURIComponent(getShareText());
    window.open(`https://twitter.com/intent/tweet?text=${text}`, "_blank");
  };

  const shareToFacebook = () => {
    const url = encodeURIComponent(window.location.href);
    window.open(
      `https://www.facebook.com/sharer/sharer.php?u=${url}`,
      "_blank",
    );
  };

  const copyShareLink = () => {
    navigator.clipboard.writeText(getShareText());
    toast.success("Copied to clipboard!");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-500/20 border-t-indigo-500"></div>
      </div>
    );
  }

  if (!level || level < 1 || level > 6) {
    return (
      <div
        className={`p-8 rounded-2xl text-center ${isDark ? "bg-white/5 text-white" : "bg-white text-slate-900"}`}
      >
        <p>Loading...</p>
      </div>
    );
  }

  if (showSettings) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div
          className={`backdrop-blur-2xl rounded-3xl p-6 md:p-8 ${isDark ? "bg-white/5 border border-white/10" : "bg-white/70 border border-black/5"} shadow-xl`}
        >
          <div className="text-center mb-8">
            <div
              className={`w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br ${colors.gradient} flex items-center justify-center`}
            >
              <Target className="w-8 h-8" style={{ color: colors.solid }} />
            </div>
            <h2
              className={`text-2xl md:text-3xl font-bold mb-2 ${isDark ? "text-white" : "text-slate-900"}`}
            >
              HSK {level} Grammar Quiz
            </h2>
            <p className={`${isDark ? "text-white/60" : "text-slate-500"}`}>
              Customize your quiz experience
            </p>
          </div>

          <div className="space-y-6">
            <div>
              <label
                className={`flex items-center gap-2 text-sm font-medium mb-3 ${isDark ? "text-white" : "text-slate-900"}`}
              >
                <Settings className="w-4 h-4" />
                Number of Questions
              </label>
              <div className="flex flex-wrap gap-2">
                {[5, 10, 15, 20, 25].map((count) => (
                  <button
                    key={count}
                    onClick={() =>
                      setSettings({ ...settings, questionCount: count })
                    }
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                      settings.questionCount === count
                        ? "bg-gradient-to-r from-indigo-500 to-purple-600 text-white"
                        : isDark
                          ? "bg-white/10 hover:bg-white/20 text-white"
                          : "bg-black/5 hover:bg-black/10 text-slate-900"
                    }`}
                  >
                    {count} Questions
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label
                className={`flex items-center gap-2 text-sm font-medium mb-3 ${isDark ? "text-white" : "text-slate-900"}`}
              >
                <Shuffle className="w-4 h-4" />
                Question Order
              </label>
              <div className="flex gap-3">
                <button
                  onClick={() => setSettings({ ...settings, isRandom: true })}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                    settings.isRandom
                      ? "bg-gradient-to-r from-indigo-500 to-purple-600 text-white"
                      : isDark
                        ? "bg-white/10 hover:bg-white/20 text-white"
                        : "bg-black/5 hover:bg-black/10 text-slate-900"
                  }`}
                >
                  <Shuffle className="w-4 h-4" />
                  Random
                </button>
                <button
                  onClick={() => setSettings({ ...settings, isRandom: false })}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                    !settings.isRandom
                      ? "bg-gradient-to-r from-indigo-500 to-purple-600 text-white"
                      : isDark
                        ? "bg-white/10 hover:bg-white/20 text-white"
                        : "bg-black/5 hover:bg-black/10 text-slate-900"
                  }`}
                >
                  <ListOrdered className="w-4 h-4" />
                  Ordered
                </button>
              </div>
            </div>

            <div>
              <label
                className={`flex items-center gap-2 text-sm font-medium mb-3 ${isDark ? "text-white" : "text-slate-900"}`}
              >
                <Timer className="w-4 h-4" />
                Timer
              </label>
              <div className="flex gap-3 mb-3">
                <button
                  onClick={() =>
                    setSettings({ ...settings, timerEnabled: false })
                  }
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                    !settings.timerEnabled
                      ? "bg-gradient-to-r from-indigo-500 to-purple-600 text-white"
                      : isDark
                        ? "bg-white/10 hover:bg-white/20 text-white"
                        : "bg-black/5 hover:bg-black/10 text-slate-900"
                  }`}
                >
                  No Timer
                </button>
                <button
                  onClick={() =>
                    setSettings({ ...settings, timerEnabled: true })
                  }
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                    settings.timerEnabled
                      ? "bg-gradient-to-r from-indigo-500 to-purple-600 text-white"
                      : isDark
                        ? "bg-white/10 hover:bg-white/20 text-white"
                        : "bg-black/5 hover:bg-black/10 text-slate-900"
                  }`}
                >
                  <Clock className="w-4 h-4" />
                  Timed
                </button>
              </div>

              {settings.timerEnabled && (
                <div className="flex flex-wrap gap-2">
                  {[1, 3, 5, 10, 15].map((mins) => (
                    <button
                      key={mins}
                      onClick={() =>
                        setSettings({ ...settings, timerMinutes: mins })
                      }
                      className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                        settings.timerMinutes === mins
                          ? "bg-gradient-to-r from-indigo-500 to-purple-600 text-white"
                          : isDark
                            ? "bg-white/10 hover:bg-white/20 text-white"
                            : "bg-black/5 hover:bg-black/10 text-slate-900"
                      }`}
                    >
                      {mins} min
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-3 mt-8">
            <button
              onClick={onExit}
              className={`flex-1 px-6 py-3 rounded-xl font-medium transition-all ${
                isDark
                  ? "bg-white/10 hover:bg-white/20 text-white"
                  : "bg-black/5 hover:bg-black/10 text-slate-900"
              }`}
            >
              Cancel
            </button>
            <button
              onClick={generateQuestions}
              disabled={sentences.length === 0}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-medium hover:opacity-90 transition-all disabled:opacity-50"
            >
              <Play className="w-5 h-5" />
              Start Quiz
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (showResults) {
    const percentage = Math.round((score / questions.length) * 100);
    const timeSpent = Math.floor((Date.now() - startTime) / 1000);

    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div
          className={`backdrop-blur-2xl rounded-3xl p-8 md:p-12 text-center ${isDark ? "bg-white/5 border border-white/10" : "bg-white/70 border border-black/5"} shadow-2xl`}
        >
          <div
            className={`w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br ${colors.gradient} flex items-center justify-center`}
          >
            <Trophy
              className={`w-10 h-10 ${percentage >= 70 ? "text-yellow-400" : isDark ? "text-white/40" : "text-slate-400"}`}
            />
          </div>

          <h2
            className={`text-3xl md:text-4xl font-bold mb-4 ${isDark ? "text-white" : "text-slate-900"}`}
          >
            Quiz Complete!
          </h2>

          <div className="text-5xl md:text-6xl font-bold mb-8 bg-gradient-to-r from-indigo-500 to-purple-600 bg-clip-text text-transparent">
            {percentage}%
          </div>

          <div className="grid grid-cols-3 gap-4 mb-8">
            <div
              className={`p-4 rounded-xl backdrop-blur-sm ${isDark ? "bg-white/5" : "bg-black/5"}`}
            >
              <Award
                className={`w-6 h-6 mx-auto mb-2 ${isDark ? "text-indigo-400" : "text-indigo-600"}`}
              />
              <p
                className={`text-2xl font-bold ${isDark ? "text-white" : "text-slate-900"}`}
              >
                {score}/{questions.length}
              </p>
              <p
                className={`text-xs ${isDark ? "text-white/60" : "text-slate-500"}`}
              >
                Score
              </p>
            </div>

            <div
              className={`p-4 rounded-xl backdrop-blur-sm ${isDark ? "bg-white/5" : "bg-black/5"}`}
            >
              <Clock
                className={`w-6 h-6 mx-auto mb-2 ${isDark ? "text-indigo-400" : "text-indigo-600"}`}
              />
              <p
                className={`text-2xl font-bold ${isDark ? "text-white" : "text-slate-900"}`}
              >
                {formatTime(timeSpent)}
              </p>
              <p
                className={`text-xs ${isDark ? "text-white/60" : "text-slate-500"}`}
              >
                Time
              </p>
            </div>

            <div
              className={`p-4 rounded-xl backdrop-blur-sm ${isDark ? "bg-white/5" : "bg-black/5"}`}
            >
              <Target
                className={`w-6 h-6 mx-auto mb-2 ${isDark ? "text-indigo-400" : "text-indigo-600"}`}
              />
              <p
                className={`text-2xl font-bold ${percentage >= 80 ? "text-green-400" : percentage >= 60 ? "text-amber-400" : "text-red-400"}`}
              >
                {percentage}%
              </p>
              <p
                className={`text-xs ${isDark ? "text-white/60" : "text-slate-500"}`}
              >
                Accuracy
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-center gap-3 mb-6">
            <button
              onClick={restartQuiz}
              className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-medium hover:opacity-90 transition-all"
            >
              <RotateCcw className="w-5 h-5" />
              New Quiz
            </button>

            <button
              onClick={() => setShowShareMenu(!showShareMenu)}
              className={`flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-medium transition-all ${
                isDark
                  ? "bg-white/10 hover:bg-white/20 text-white"
                  : "bg-black/5 hover:bg-black/10 text-slate-900"
              }`}
            >
              <Share2 className="w-5 h-5" />
              Share Result
            </button>

            <button
              onClick={onExit}
              className={`px-6 py-3 rounded-xl font-medium transition-all ${
                isDark
                  ? "bg-white/10 hover:bg-white/20 text-white"
                  : "bg-black/5 hover:bg-black/10 text-slate-900"
              }`}
            >
              Back to Grammar
            </button>
          </div>

          {showShareMenu && (
            <div
              className={`p-4 rounded-xl ${isDark ? "bg-white/5" : "bg-black/5"}`}
            >
              <p
                className={`text-sm mb-3 ${isDark ? "text-white/60" : "text-slate-500"}`}
              >
                Share your achievement:
              </p>
              <div className="flex justify-center gap-3">
                <button
                  onClick={shareToTwitter}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#1DA1F2] text-white text-sm font-medium hover:opacity-90 transition-all"
                >
                  <Twitter className="w-4 h-4" />
                  Twitter
                </button>
                <button
                  onClick={shareToFacebook}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#4267B2] text-white text-sm font-medium hover:opacity-90 transition-all"
                >
                  <Facebook className="w-4 h-4" />
                  Facebook
                </button>
                <button
                  onClick={copyShareLink}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    isDark
                      ? "bg-white/10 hover:bg-white/20 text-white"
                      : "bg-black/10 hover:bg-black/20 text-slate-900"
                  }`}
                >
                  <Link2 className="w-4 h-4" />
                  Copy
                </button>
              </div>
            </div>
          )}
        </div>

        <div
          className={`backdrop-blur-xl rounded-2xl p-6 ${isDark ? "bg-white/5 border border-white/10" : "bg-white/50 border border-black/5"}`}
        >
          <h3
            className={`text-lg font-semibold mb-4 ${isDark ? "text-white" : "text-slate-900"}`}
          >
            Answer Review
          </h3>

          <div className="grid gap-3 max-h-[400px] overflow-y-auto">
            {userAnswers.map((answer, idx) => (
              <div
                key={idx}
                className={`flex items-center gap-3 p-3 rounded-xl backdrop-blur-sm ${
                  answer.correct
                    ? isDark
                      ? "bg-green-500/10 border border-green-500/20"
                      : "bg-green-50 border border-green-200"
                    : isDark
                      ? "bg-red-500/10 border border-red-500/20"
                      : "bg-red-50 border border-red-200"
                }`}
              >
                {answer.correct ? (
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                )}
                <span
                  className={`text-sm flex-1 ${isDark ? "text-white" : "text-slate-700"}`}
                >
                  Question {idx + 1}:{" "}
                  {answer.correct ? "Correct" : `Your answer: ${answer.answer}`}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];

  return (
    <div className="max-w-4xl mx-auto space-y-4 md:space-y-6">
      <div
        className={`backdrop-blur-xl rounded-xl md:rounded-2xl p-3 md:p-4 ${isDark ? "bg-white/5 border border-white/10" : "bg-white/50 border border-black/5"}`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 md:gap-3">
            <div
              className={`p-1.5 md:p-2 rounded-lg md:rounded-xl bg-gradient-to-br ${colors.gradient}`}
            >
              <Target
                className="w-4 h-4 md:w-5 md:h-5"
                style={{ color: colors.solid }}
              />
            </div>
            <div>
              <h2
                className={`text-sm md:text-base font-bold ${isDark ? "text-white" : "text-slate-900"}`}
              >
                HSK {level} Quiz
              </h2>
              <p
                className={`text-xs ${isDark ? "text-white/60" : "text-slate-500"}`}
              >
                {currentQuestionIndex + 1}/{questions.length}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 md:gap-4">
            {settings.timerEnabled && (
              <div
                className={`flex items-center gap-1.5 px-2 md:px-3 py-1 md:py-1.5 rounded-lg backdrop-blur-sm ${
                  timeLeft <= 30
                    ? "bg-red-500/20 text-red-400"
                    : isDark
                      ? "bg-white/5"
                      : "bg-black/5"
                }`}
              >
                <Clock className="w-3.5 h-3.5 md:w-4 md:h-4" />
                <span
                  className={`text-xs md:text-sm font-medium ${timeLeft <= 30 ? "text-red-400" : isDark ? "text-white" : "text-slate-900"}`}
                >
                  {formatTime(timeLeft)}
                </span>
              </div>
            )}

            <div
              className={`flex items-center gap-1.5 px-2 md:px-3 py-1 md:py-1.5 rounded-lg backdrop-blur-sm ${isDark ? "bg-white/5" : "bg-black/5"}`}
            >
              <Award
                className={`w-3.5 h-3.5 md:w-4 md:h-4 ${isDark ? "text-yellow-400" : "text-yellow-600"}`}
              />
              <span
                className={`text-xs md:text-sm font-medium ${isDark ? "text-white" : "text-slate-900"}`}
              >
                {score}
              </span>
            </div>

            <button
              onClick={onExit}
              className={`px-3 md:px-4 py-1.5 md:py-2 rounded-lg text-xs md:text-sm font-medium transition-all ${
                isDark
                  ? "bg-white/10 hover:bg-white/20 text-white"
                  : "bg-black/5 hover:bg-black/10 text-slate-900"
              }`}
            >
              Exit
            </button>
          </div>
        </div>

        <div className="flex items-center gap-1 md:gap-1.5 mt-3 md:mt-4 overflow-x-auto pb-1">
          {questions.map((_, idx) => (
            <div
              key={idx}
              className={`w-1.5 h-1.5 md:w-2 md:h-2 rounded-full transition-all flex-shrink-0 ${
                idx === currentQuestionIndex
                  ? "bg-indigo-500 w-4 md:w-6"
                  : idx < currentQuestionIndex
                    ? userAnswers[idx]?.correct
                      ? "bg-green-500"
                      : "bg-red-500"
                    : isDark
                      ? "bg-white/20"
                      : "bg-black/20"
              }`}
            />
          ))}
        </div>
      </div>

      <div
        className={`backdrop-blur-2xl rounded-2xl md:rounded-3xl p-4 md:p-6 lg:p-8 ${isDark ? "bg-white/5 border border-white/10" : "bg-white/70 border border-black/5"} shadow-xl`}
      >
        <div className="mb-4 md:mb-6">
          <span
            className={`inline-block px-2.5 md:px-3 py-0.5 md:py-1 rounded-full text-[10px] md:text-xs font-medium backdrop-blur-sm ${
              isDark
                ? "bg-indigo-500/20 text-indigo-400"
                : "bg-indigo-100 text-indigo-600"
            }`}
          >
            {quizTypeLabels[currentQuestion.type]}
          </span>
        </div>

        {currentQuestion.type === "listen_select" && (
          <button
            onClick={() => playAudio(currentQuestion.sentence)}
            className={`flex items-center gap-2 md:gap-3 px-4 md:px-5 py-2 md:py-3 rounded-lg md:rounded-xl mb-4 md:mb-6 transition-all backdrop-blur-sm ${
              audioPlaying === currentQuestion.id
                ? "bg-gradient-to-r from-indigo-500 to-purple-600 text-white"
                : isDark
                  ? "bg-white/10 hover:bg-white/20 text-white"
                  : "bg-black/5 hover:bg-black/10 text-slate-900"
            }`}
          >
            <Volume2 className="w-4 h-4 md:w-5 md:h-5" />
            <span className="text-sm md:text-base">
              {audioPlaying === currentQuestion.id
                ? "Playing..."
                : "Play Audio"}
            </span>
          </button>
        )}

        <div className="mb-6 md:mb-8">
          <p
            className={`text-xl md:text-2xl lg:text-3xl font-bold mb-2 md:mb-3 ${isDark ? "text-white" : "text-slate-900"}`}
          >
            {currentQuestion.sentence.sentenceClean}
          </p>
          <p
            className={`text-base md:text-lg lg:text-xl ${isDark ? "text-indigo-400" : "text-indigo-600"}`}
          >
            {currentQuestion.sentence.pinyin}
          </p>
          {currentQuestion.type !== "match_english" && (
            <p
              className={`text-sm md:text-base lg:text-lg mt-2 md:mt-3 ${isDark ? "text-slate-300" : "text-slate-700"}`}
            >
              {currentQuestion.sentence.english}
            </p>
          )}
        </div>

        <div className="grid gap-2 md:gap-3">
          {currentQuestion.options?.map((option, idx) => {
            let isSelected = selectedAnswer === option;
            let isCorrectAnswer = option === currentQuestion.correctAnswer;
            let showResult = selectedAnswer !== null;

            return (
              <button
                key={idx}
                onClick={() => handleAnswer(option)}
                disabled={selectedAnswer !== null}
                className={`p-3 md:p-4 lg:p-5 rounded-lg md:rounded-xl text-left transition-all backdrop-blur-sm border-2 ${
                  showResult
                    ? isCorrectAnswer
                      ? "border-green-500 bg-green-500/10"
                      : isSelected
                        ? "border-red-500 bg-red-500/10"
                        : "border-white/10 opacity-50"
                    : isSelected
                      ? "border-indigo-500 bg-indigo-500/10"
                      : isDark
                        ? "border-white/10 hover:border-white/30 hover:bg-white/5"
                        : "border-black/10 hover:border-black/20 hover:bg-black/5"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`text-sm md:text-base lg:text-lg ${isDark ? "text-white" : "text-slate-900"}`}
                  >
                    {option}
                  </span>

                  {showResult && isCorrectAnswer && (
                    <CheckCircle className="w-5 h-5 md:w-6 md:h-6 text-green-500" />
                  )}
                  {showResult && isSelected && !isCorrectAnswer && (
                    <XCircle className="w-5 h-5 md:w-6 md:h-6 text-red-500" />
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {selectedAnswer !== null && (
          <div className="mt-6 md:mt-8 flex justify-end">
            <button
              onClick={nextQuestion}
              className="flex items-center gap-2 px-6 md:px-8 py-2.5 md:py-3 rounded-lg md:rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-sm md:text-base font-medium hover:opacity-90 transition-all"
            >
              {currentQuestionIndex < questions.length - 1 ? "Next" : "Finish"}
              <ChevronRight className="w-4 h-4 md:w-5 md:h-5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
