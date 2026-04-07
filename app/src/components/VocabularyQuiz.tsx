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
  Play,
} from "lucide-react";
import { toast } from "sonner";

interface HSKWord {
  id: number;
  word: string;
  pinyin: string;
  pos: string;
  english?: string;
  level?: number | string;
}

interface VocabularyQuizQuestion {
  id: number;
  type: "match_english" | "match_pinyin" | "fill_pinyin" | "listen_select";
  word: HSKWord;
  options: string[];
  correctAnswer: string;
}

interface VocabularyQuizResult {
  score: number;
  totalQuestions: number;
  timeSpent: number;
  percentage: number;
}

interface QuizSettings {
  questionCount: number;
  isRandom: boolean;
  timerEnabled: boolean;
  timerMinutes: number;
}

interface VocabularyQuizProps {
  isDark: boolean;
  vocabulary: HSKWord[];
  onExit: () => void;
  onComplete?: (result: VocabularyQuizResult) => void;
}

const quizTypeLabels: Record<VocabularyQuizQuestion["type"], string> = {
  match_english: "Match English Meaning",
  match_pinyin: "Match Pinyin",
  fill_pinyin: "Fill in Pinyin",
  listen_select: "Listen & Select",
};

export default function VocabularyQuiz({
  isDark,
  vocabulary,
  onExit,
  onComplete,
}: VocabularyQuizProps) {
  const [questions, setQuestions] = useState<VocabularyQuizQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [showResults, setShowResults] = useState(false);
  const [showSettings, setShowSettings] = useState(true);
  const [startTime, setStartTime] = useState(0);
  const [userAnswers, setUserAnswers] = useState<
    { questionId: number; answer: string; correct: boolean }[]
  >([]);
  const [timeLeft, setTimeLeft] = useState(0);
  const [quizTimeSpent, setQuizTimeSpent] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
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

  const finishQuiz = useCallback(() => {
    const timeSpent = Math.floor((Date.now() - startTime) / 1000);
    setQuizTimeSpent(timeSpent);
    setShowResults(true);
    const finalScore = userAnswers.filter((a) => a.correct).length;
    const result: VocabularyQuizResult = {
      score: finalScore,
      totalQuestions: questions.length,
      timeSpent,
      percentage: Math.round((finalScore / questions.length) * 100),
    };
    onComplete?.(result);
  }, [startTime, userAnswers, questions.length, onComplete]);

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
            finishQuiz();
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
  }, [settings.timerEnabled, timeLeft, showResults, showSettings, finishQuiz]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const speakWord = (word: string) => {
    if (!("speechSynthesis" in window)) return;
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

  const generateQuestions = useCallback(() => {
    if (vocabulary.length === 0) {
      toast.error("No vocabulary available for quiz");
      return;
    }

    let selectedWords = [...vocabulary];

    if (settings.isRandom) {
      selectedWords = selectedWords.sort(() => Math.random() - 0.5);
    }

    selectedWords = selectedWords.slice(0, settings.questionCount);

    const generatedQuestions: VocabularyQuizQuestion[] = [];

    for (const word of selectedWords) {
      const questionTypes: VocabularyQuizQuestion["type"][] = [
        "match_english",
        "match_pinyin",
        "fill_pinyin",
      ];
      const type =
        questionTypes[Math.floor(Math.random() * questionTypes.length)];

      let question: VocabularyQuizQuestion;

      if (type === "match_english") {
        const correctAnswer = word.english || "No translation";
        const otherWords = vocabulary.filter((w) => w.id !== word.id);
        const wrongAnswers = otherWords
          .slice(0, 3)
          .map((w) => w.english || "No translation");

        const options = [correctAnswer, ...wrongAnswers].sort(
          () => Math.random() - 0.5,
        );

        question = {
          id: word.id,
          type: "match_english",
          word,
          options,
          correctAnswer,
        };
      } else if (type === "match_pinyin") {
        const correctAnswer = word.pinyin;
        const otherWords = vocabulary.filter((w) => w.id !== word.id);
        const wrongAnswers = otherWords.slice(0, 3).map((w) => w.pinyin);

        const options = [correctAnswer, ...wrongAnswers].sort(
          () => Math.random() - 0.5,
        );

        question = {
          id: word.id,
          type: "match_pinyin",
          word,
          options,
          correctAnswer,
        };
      } else {
        const correctAnswer = word.pinyin;
        const otherWords = vocabulary.filter((w) => w.id !== word.id);
        const wrongAnswers = otherWords.slice(0, 3).map((w) => w.pinyin);

        const options = [correctAnswer, ...wrongAnswers].sort(
          () => Math.random() - 0.5,
        );

        question = {
          id: word.id,
          type: "fill_pinyin",
          word,
          options,
          correctAnswer,
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
  }, [vocabulary, settings]);

  const handleAnswer = (answer: string) => {
    if (selectedAnswer !== null) return;

    setSelectedAnswer(answer);
    const currentQuestion = questions[currentQuestionIndex];
    const isCorrect = answer === currentQuestion.correctAnswer;

    if (isCorrect) {
      setScore((prev) => prev + 1);
      playCorrectSound();
      toast.success("Correct!", { duration: 1000 });
    } else {
      toast.error(`Incorrect. Answer: ${currentQuestion.correctAnswer}`, {
        duration: 2000,
      });
    }

    setUserAnswers((prev) => [
      ...prev,
      {
        questionId: currentQuestion.id,
        answer,
        correct: isCorrect,
      },
    ]);
  };

  const nextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
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

  if (showSettings) {
    return (
      <div className="max-w-2xl mx-auto">
        <div
          className={`backdrop-blur-2xl rounded-3xl p-6 md:p-8 ${
            isDark
              ? "bg-white/5 border border-white/10"
              : "bg-white/70 border border-black/5"
          } shadow-2xl`}
        >
          <div className="text-center mb-8">
            <div
              className={`w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-indigo-500/20 via-purple-500/20 to-pink-500/20 flex items-center justify-center`}
            >
              <Target className="w-8 h-8 text-indigo-400" />
            </div>
            <h2
              className={`text-2xl md:text-3xl font-bold mb-2 ${
                isDark ? "text-white" : "text-slate-900"
              }`}
            >
              Vocabulary Quiz
            </h2>
            <p
              className={`text-sm ${isDark ? "text-white/60" : "text-slate-500"}`}
            >
              Test your HSK vocabulary knowledge
            </p>
          </div>

          <div className="space-y-6">
            <div>
              <label
                className={`block text-sm font-medium mb-3 ${
                  isDark ? "text-white/80" : "text-slate-700"
                }`}
              >
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
                    {count}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label
                className={`block text-sm font-medium mb-3 ${
                  isDark ? "text-white/80" : "text-slate-700"
                }`}
              >
                Question Order
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() => setSettings({ ...settings, isRandom: true })}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
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
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                    !settings.isRandom
                      ? "bg-gradient-to-r from-indigo-500 to-purple-600 text-white"
                      : isDark
                        ? "bg-white/10 hover:bg-white/20 text-white"
                        : "bg-black/5 hover:bg-black/10 text-slate-900"
                  }`}
                >
                  Sequential
                </button>
              </div>
            </div>

            <div>
              <label
                className={`flex items-center gap-3 cursor-pointer ${
                  isDark ? "text-white/80" : "text-slate-700"
                }`}
              >
                <input
                  type="checkbox"
                  checked={settings.timerEnabled}
                  onChange={(e) =>
                    setSettings({ ...settings, timerEnabled: e.target.checked })
                  }
                  className="w-5 h-5 rounded border-2 border-indigo-500 text-indigo-500 focus:ring-indigo-500"
                />
                <span className="text-sm font-medium">Enable Timer</span>
              </label>

              {settings.timerEnabled && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {[3, 5, 10, 15].map((mins) => (
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
              disabled={vocabulary.length === 0}
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
    const timeSpent = quizTimeSpent;

    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div
          className={`backdrop-blur-2xl rounded-3xl p-8 md:p-12 text-center ${
            isDark
              ? "bg-white/5 border border-white/10"
              : "bg-white/70 border border-black/5"
          } shadow-2xl`}
        >
          <div
            className={`w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-indigo-500/20 via-purple-500/20 to-pink-500/20 flex items-center justify-center`}
          >
            <Trophy
              className={`w-10 h-10 ${
                percentage >= 70
                  ? "text-yellow-400"
                  : isDark
                    ? "text-white/40"
                    : "text-slate-400"
              }`}
            />
          </div>

          <h2
            className={`text-3xl md:text-4xl font-bold mb-4 ${
              isDark ? "text-white" : "text-slate-900"
            }`}
          >
            Quiz Complete!
          </h2>

          <div className="text-5xl md:text-6xl font-bold mb-8 bg-gradient-to-r from-indigo-500 to-purple-600 bg-clip-text text-transparent">
            {percentage}%
          </div>

          <div className="grid grid-cols-3 gap-4 mb-8">
            <div
              className={`p-4 rounded-xl backdrop-blur-sm ${
                isDark ? "bg-white/5" : "bg-black/5"
              }`}
            >
              <Award
                className={`w-6 h-6 mx-auto mb-2 ${
                  isDark ? "text-indigo-400" : "text-indigo-600"
                }`}
              />
              <p
                className={`text-2xl font-bold ${
                  isDark ? "text-white" : "text-slate-900"
                }`}
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
              className={`p-4 rounded-xl backdrop-blur-sm ${
                isDark ? "bg-white/5" : "bg-black/5"
              }`}
            >
              <Clock
                className={`w-6 h-6 mx-auto mb-2 ${
                  isDark ? "text-indigo-400" : "text-indigo-600"
                }`}
              />
              <p
                className={`text-2xl font-bold ${
                  isDark ? "text-white" : "text-slate-900"
                }`}
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
              className={`p-4 rounded-xl backdrop-blur-sm ${
                isDark ? "bg-white/5" : "bg-black/5"
              }`}
            >
              <Target
                className={`w-6 h-6 mx-auto mb-2 ${
                  isDark ? "text-indigo-400" : "text-indigo-600"
                }`}
              />
              <p
                className={`text-2xl font-bold ${
                  percentage >= 80
                    ? "text-green-400"
                    : percentage >= 60
                      ? "text-amber-400"
                      : "text-red-400"
                }`}
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

          <div className="flex gap-3">
            <button
              onClick={restartQuiz}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-medium transition-all bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:opacity-90"
            >
              <RotateCcw className="w-5 h-5" />
              New Quiz
            </button>
            <button
              onClick={onExit}
              className={`flex-1 px-6 py-3 rounded-xl font-medium transition-all ${
                isDark
                  ? "bg-white/10 hover:bg-white/20 text-white"
                  : "bg-black/5 hover:bg-black/10 text-slate-900"
              }`}
            >
              Exit
            </button>
          </div>
        </div>

        <div
          className={`backdrop-blur-xl rounded-2xl p-6 ${
            isDark
              ? "bg-white/5 border border-white/10"
              : "bg-white/50 border border-black/5"
          }`}
        >
          <h3
            className={`text-lg font-semibold mb-4 ${
              isDark ? "text-white" : "text-slate-900"
            }`}
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
                  className={`text-sm flex-1 ${
                    isDark ? "text-white" : "text-slate-700"
                  }`}
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

  if (!currentQuestion) {
    return (
      <div className="flex justify-center items-center h-64">
        <p className={isDark ? "text-white" : "text-slate-900"}>
          Loading question...
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-4 md:space-y-6">
      <div
        className={`backdrop-blur-xl rounded-xl md:rounded-2xl p-3 md:p-4 ${
          isDark
            ? "bg-white/5 border border-white/10"
            : "bg-white/50 border border-black/5"
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 md:gap-3">
            <div
              className={`p-1.5 md:p-2 rounded-lg md:rounded-xl bg-gradient-to-br from-indigo-500/20 via-purple-500/20 to-pink-500/20`}
            >
              <Target className="w-4 h-4 md:w-5 md:h-5 text-indigo-400" />
            </div>
            <div>
              <h2
                className={`text-sm md:text-base font-bold ${
                  isDark ? "text-white" : "text-slate-900"
                }`}
              >
                Vocabulary Quiz
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
                  className={`text-xs md:text-sm font-medium ${
                    timeLeft <= 30
                      ? "text-red-400"
                      : isDark
                        ? "text-white"
                        : "text-slate-900"
                  }`}
                >
                  {formatTime(timeLeft)}
                </span>
              </div>
            )}

            <div
              className={`flex items-center gap-1.5 px-2 md:px-3 py-1 md:py-1.5 rounded-lg backdrop-blur-sm ${
                isDark ? "bg-white/5" : "bg-black/5"
              }`}
            >
              <Award
                className={`w-3.5 h-3.5 md:w-4 md:h-4 ${
                  isDark ? "text-yellow-400" : "text-yellow-600"
                }`}
              />
              <span
                className={`text-xs md:text-sm font-medium ${
                  isDark ? "text-white" : "text-slate-900"
                }`}
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
        className={`backdrop-blur-2xl rounded-2xl md:rounded-3xl p-4 md:p-6 lg:p-8 ${
          isDark
            ? "bg-white/5 border border-white/10"
            : "bg-white/70 border border-black/5"
        } shadow-xl`}
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

        <div className="mb-6 md:mb-8 text-center">
          <button
            onClick={() => speakWord(currentQuestion.word.word)}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl mb-4 transition-all ${
              isDark
                ? "bg-white/10 hover:bg-white/20 text-white"
                : "bg-black/5 hover:bg-black/10 text-slate-900"
            }`}
          >
            <Volume2 className="w-5 h-5" />
            Listen
          </button>

          <p
            className={`text-4xl md:text-5xl lg:text-6xl font-bold mb-3 md:mb-4 ${
              isDark ? "text-white" : "text-slate-900"
            }`}
          >
            {currentQuestion.word.word}
          </p>

          {currentQuestion.type !== "match_pinyin" &&
            currentQuestion.type !== "fill_pinyin" && (
              <p
                className={`text-lg md:text-xl ${
                  isDark ? "text-indigo-400" : "text-indigo-600"
                }`}
              >
                {currentQuestion.word.pinyin}
              </p>
            )}

          {currentQuestion.type === "match_english" && (
            <p
              className={`text-sm md:text-base mt-3 ${
                isDark ? "text-slate-400" : "text-slate-500"
              }`}
            >
              Select the correct English meaning
            </p>
          )}

          {currentQuestion.type === "match_pinyin" && (
            <p
              className={`text-sm md:text-base mt-3 ${
                isDark ? "text-slate-400" : "text-slate-500"
              }`}
            >
              Select the correct Pinyin
            </p>
          )}

          {currentQuestion.type === "fill_pinyin" && (
            <p
              className={`text-sm md:text-base mt-3 ${
                isDark ? "text-slate-400" : "text-slate-500"
              }`}
            >
              What is the Pinyin for this word?
            </p>
          )}
        </div>

        <div className="grid gap-2 md:gap-3">
          {currentQuestion.options?.map((option, idx) => {
            const isSelected = selectedAnswer === option;
            const isCorrectAnswer = option === currentQuestion.correctAnswer;
            const showResult = selectedAnswer !== null;

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
                    className={`text-sm md:text-base lg:text-lg ${
                      isDark ? "text-white" : "text-slate-900"
                    }`}
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
