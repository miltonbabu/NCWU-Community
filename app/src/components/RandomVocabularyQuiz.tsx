import { useState, useEffect, useCallback, useRef } from "react";
import { useTheme } from "@/components/ThemeProvider";
import {
  Trophy,
  Check,
  X,
  ChevronRight,
  ChevronLeft,
  RotateCcw,
  Target,
  Award,
} from "lucide-react";
import { toast } from "sonner";
import type { HSKLevel } from "@/types/hsk";
import { hsk1Vocabulary } from "@/data/hsk1Vocabulary";
import { hsk2Vocabulary } from "@/data/hsk2Vocabulary";
import { hsk3Vocabulary } from "@/data/hsk3Vocabulary";
import { hsk4Vocabulary } from "@/data/hsk4Vocabulary";

interface QuizQuestion {
  id: number;
  chinese: string;
  pinyin: string;
  english: string;
  options: string[];
  correctAnswer: string;
}

interface QuizResult {
  correct: number;
  wrong: number;
  total: number;
  percentage: number;
}

interface RandomVocabularyQuizProps {
  level: HSKLevel;
  onClose: () => void;
}

const allVocabulary = {
  1: hsk1Vocabulary,
  2: hsk2Vocabulary,
  3: hsk3Vocabulary,
  4: hsk4Vocabulary,
};

const hskLevelColors: Record<
  number,
  { from: string; to: string; bg: string; text: string }
> = {
  1: {
    from: "from-emerald-500",
    to: "to-teal-600",
    bg: "bg-emerald-500",
    text: "text-emerald-400",
  },
  2: {
    from: "from-blue-500",
    to: "to-cyan-600",
    bg: "bg-blue-500",
    text: "text-blue-400",
  },
  3: {
    from: "from-violet-500",
    to: "to-purple-600",
    bg: "bg-violet-500",
    text: "text-violet-400",
  },
  4: {
    from: "from-amber-500",
    to: "to-orange-600",
    bg: "bg-amber-500",
    text: "text-amber-400",
  },
};

export default function RandomVocabularyQuiz({
  level,
  onClose,
}: RandomVocabularyQuizProps) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [showResult, setShowResult] = useState(false);
  const [quizResult, setQuizResult] = useState<QuizResult | null>(null);
  const [isAnswerChecked, setIsAnswerChecked] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);

  const playCorrectSound = useCallback(() => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new AudioContext();
      }
      const ctx = audioContextRef.current;
      if (ctx.state === "suspended") {
        ctx.resume();
      }
      const notes = [523.25, 659.25, 783.99];
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = "sine";
        osc.frequency.value = freq;
        const start = ctx.currentTime + i * 0.08;
        gain.gain.setValueAtTime(0.15, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.2);
        osc.start(start);
        osc.stop(start + 0.2);
      });
    } catch {}
  }, []);

  const generateQuizQuestions = useCallback(() => {
    const vocabulary = allVocabulary[level as keyof typeof allVocabulary] || [];
    if (vocabulary.length === 0) return [];

    // Shuffle vocabulary and take 10 random words
    const shuffled = [...vocabulary].sort(() => Math.random() - 0.5);
    const selectedWords = shuffled.slice(0, 10);

    return selectedWords.map((word, index) => {
      // Generate 3 wrong answers from other words
      const otherWords = vocabulary.filter((w) => w.english !== word.english);
      const wrongAnswers = otherWords
        .sort(() => Math.random() - 0.5)
        .slice(0, 3)
        .map((w: any) => w.english);

      // Combine correct and wrong answers, then shuffle
      const allOptions = [word.english, ...wrongAnswers].sort(
        () => Math.random() - 0.5,
      );

      return {
        id: index,
        chinese: word.chinese,
        pinyin: word.pinyin,
        english: word.english,
        options: allOptions,
        correctAnswer: word.english,
      };
    });
  }, [level]);

  useEffect(() => {
    const quizQuestions = generateQuizQuestions();
    setQuestions(quizQuestions);
  }, [generateQuizQuestions]);

  const handleSelectAnswer = (answer: string) => {
    if (isAnswerChecked) return;
    setSelectedAnswer(answer);
    setIsAnswerChecked(true);
    setAnswers((prev) => ({ ...prev, [currentQuestionIndex]: answer }));

    const currentQuestion = questions[currentQuestionIndex];
    if (answer === currentQuestion.correctAnswer) {
      playCorrectSound();
      toast.success("Correct!");
    } else {
      toast.error(
        `Wrong! The correct answer is: ${currentQuestion.correctAnswer}`,
      );
    }
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
      setSelectedAnswer(null);
      setIsAnswerChecked(false);
    } else {
      // Calculate results
      calculateResults();
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1);
      setSelectedAnswer(answers[currentQuestionIndex - 1] || null);
      setIsAnswerChecked(true);
    }
  };

  const calculateResults = () => {
    let correct = 0;
    let wrong = 0;

    questions.forEach((question, index) => {
      if (answers[index] === question.correctAnswer) {
        correct++;
      } else {
        wrong++;
      }
    });

    const total = questions.length;
    const percentage = Math.round((correct / total) * 100);

    setQuizResult({ correct, wrong, total, percentage });
    setShowResult(true);
  };

  const handleRestartQuiz = () => {
    const newQuestions = generateQuizQuestions();
    setQuestions(newQuestions);
    setCurrentQuestionIndex(0);
    setSelectedAnswer(null);
    setAnswers({});
    setShowResult(false);
    setQuizResult(null);
    setIsAnswerChecked(false);
  };

  const currentQuestion = questions[currentQuestionIndex];
  const colors = hskLevelColors[level];

  if (questions.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto mb-4" />
          <p className={isDark ? "text-slate-400" : "text-slate-500"}>
            Loading quiz...
          </p>
        </div>
      </div>
    );
  }

  if (showResult && quizResult) {
    return (
      <div
        className={`p-8 rounded-2xl border backdrop-blur-xl ${
          isDark
            ? "bg-slate-900/80 border-white/10"
            : "bg-white/90 border-slate-200/50"
        }`}
      >
        <div className="text-center">
          {/* Score Circle */}
          <div className="relative inline-block mb-6">
            <div
              className={`w-32 h-32 rounded-full flex items-center justify-center bg-gradient-to-br ${colors.from} ${colors.to}`}
            >
              <div
                className={`w-28 h-28 rounded-full flex items-center justify-center ${
                  isDark ? "bg-slate-900" : "bg-white"
                }`}
              >
                <div>
                  <p
                    className={`text-4xl font-bold bg-gradient-to-r ${colors.from} ${colors.to} bg-clip-text text-transparent`}
                  >
                    {quizResult.percentage}%
                  </p>
                  <p
                    className={`text-xs ${
                      isDark ? "text-slate-400" : "text-slate-500"
                    }`}
                  >
                    Score
                  </p>
                </div>
              </div>
            </div>
            <div
              className={`absolute -top-2 -right-2 p-2 rounded-full ${
                quizResult.percentage >= 80
                  ? "bg-green-500"
                  : quizResult.percentage >= 60
                    ? "bg-amber-500"
                    : "bg-red-500"
              }`}
            >
              <Trophy className="w-5 h-5 text-white" />
            </div>
          </div>

          <h2
            className={`text-2xl font-bold mb-2 ${
              isDark ? "text-white" : "text-slate-900"
            }`}
          >
            {quizResult.percentage >= 80
              ? "Excellent!"
              : quizResult.percentage >= 60
                ? "Good Job!"
                : "Keep Practicing!"}
          </h2>
          <p className={`mb-6 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
            You got {quizResult.correct} out of {quizResult.total} correct
          </p>

          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            <div
              className={`p-4 rounded-xl ${
                isDark ? "bg-white/5" : "bg-slate-100"
              }`}
            >
              <Check className="w-6 h-6 text-green-500 mx-auto mb-2" />
              <p
                className={`text-2xl font-bold ${
                  isDark ? "text-white" : "text-slate-900"
                }`}
              >
                {quizResult.correct}
              </p>
              <p
                className={`text-xs ${
                  isDark ? "text-slate-400" : "text-slate-500"
                }`}
              >
                Correct
              </p>
            </div>
            <div
              className={`p-4 rounded-xl ${
                isDark ? "bg-white/5" : "bg-slate-100"
              }`}
            >
              <X className="w-6 h-6 text-red-500 mx-auto mb-2" />
              <p
                className={`text-2xl font-bold ${
                  isDark ? "text-white" : "text-slate-900"
                }`}
              >
                {quizResult.wrong}
              </p>
              <p
                className={`text-xs ${
                  isDark ? "text-slate-400" : "text-slate-500"
                }`}
              >
                Wrong
              </p>
            </div>
            <div
              className={`p-4 rounded-xl ${
                isDark ? "bg-white/5" : "bg-slate-100"
              }`}
            >
              <Target className="w-6 h-6 text-indigo-500 mx-auto mb-2" />
              <p
                className={`text-2xl font-bold ${
                  isDark ? "text-white" : "text-slate-900"
                }`}
              >
                {quizResult.total}
              </p>
              <p
                className={`text-xs ${
                  isDark ? "text-slate-400" : "text-slate-500"
                }`}
              >
                Total
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 justify-center">
            <button
              onClick={handleRestartQuiz}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all ${
                isDark
                  ? "bg-white/10 hover:bg-white/20 text-white"
                  : "bg-slate-100 hover:bg-slate-200 text-slate-900"
              }`}
            >
              <RotateCcw className="w-4 h-4" />
              Try Again
            </button>
            <button
              onClick={onClose}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium bg-gradient-to-r ${colors.from} ${colors.to} text-white hover:shadow-lg transition-all`}
            >
              <Award className="w-4 h-4" />
              Back to Quizzes
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`p-6 rounded-2xl border backdrop-blur-xl ${
        isDark
          ? "bg-slate-900/80 border-white/10"
          : "bg-white/90 border-slate-200/50"
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div
            className={`p-2.5 rounded-xl bg-gradient-to-br ${colors.from} ${colors.to}`}
          >
            <Target className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2
              className={`text-lg font-bold ${
                isDark ? "text-white" : "text-slate-900"
              }`}
            >
              HSK {level} Vocabulary Quiz
            </h2>
            <p
              className={`text-sm ${
                isDark ? "text-slate-400" : "text-slate-500"
              }`}
            >
              Question {currentQuestionIndex + 1} of {questions.length}
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className={`p-2 rounded-lg transition-colors ${
            isDark
              ? "hover:bg-white/10 text-slate-400"
              : "hover:bg-slate-100 text-slate-500"
          }`}
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Progress Bar */}
      <div
        className={`w-full h-2 rounded-full mb-6 ${
          isDark ? "bg-white/10" : "bg-slate-200"
        }`}
      >
        <div
          className={`h-full rounded-full bg-gradient-to-r ${colors.from} ${colors.to} transition-all duration-300`}
          style={{
            width: `${((currentQuestionIndex + 1) / questions.length) * 100}%`,
          }}
        />
      </div>

      {/* Question */}
      <div className="mb-6">
        <div
          className={`p-8 rounded-2xl text-center mb-6 ${
            isDark ? "bg-white/5" : "bg-slate-100"
          }`}
        >
          <p
            className={`text-5xl font-bold mb-3 ${
              isDark ? "text-white" : "text-slate-900"
            }`}
          >
            {currentQuestion.chinese}
          </p>
          <p
            className={`text-xl ${
              isDark ? "text-slate-400" : "text-slate-500"
            }`}
          >
            {currentQuestion.pinyin}
          </p>
        </div>

        <p
          className={`text-center mb-4 ${
            isDark ? "text-slate-300" : "text-slate-700"
          }`}
        >
          Select the correct English meaning:
        </p>

        {/* Options */}
        <div className="grid grid-cols-1 gap-3">
          {currentQuestion.options.map((option, idx) => {
            const isSelected = selectedAnswer === option;
            const isCorrect = option === currentQuestion.correctAnswer;
            const showCorrectness = isAnswerChecked;

            let buttonClass = "";
            if (showCorrectness) {
              if (isCorrect) {
                buttonClass = "bg-green-500 text-white border-green-500";
              } else if (isSelected && !isCorrect) {
                buttonClass = "bg-red-500 text-white border-red-500";
              } else {
                buttonClass = isDark
                  ? "bg-white/5 text-slate-400 border-white/10"
                  : "bg-slate-100 text-slate-500 border-slate-200";
              }
            } else {
              buttonClass = isSelected
                ? `bg-gradient-to-r ${colors.from} ${colors.to} text-white border-transparent`
                : isDark
                  ? "bg-white/5 hover:bg-white/10 text-slate-300 border-white/10"
                  : "bg-white hover:bg-slate-50 text-slate-700 border-slate-200";
            }

            return (
              <button
                key={idx}
                onClick={() => handleSelectAnswer(option)}
                disabled={isAnswerChecked}
                className={`p-4 rounded-xl text-left border transition-all ${buttonClass}`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">{option}</span>
                  {showCorrectness && isCorrect && (
                    <Check className="w-5 h-5" />
                  )}
                  {showCorrectness && isSelected && !isCorrect && (
                    <X className="w-5 h-5" />
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={handlePreviousQuestion}
          disabled={currentQuestionIndex === 0}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
            currentQuestionIndex === 0
              ? "opacity-50 cursor-not-allowed"
              : isDark
                ? "hover:bg-white/10 text-slate-300"
                : "hover:bg-slate-100 text-slate-600"
          }`}
        >
          <ChevronLeft className="w-4 h-4" />
          Previous
        </button>

        {isAnswerChecked && (
          <button
            onClick={handleNextQuestion}
            className={`flex items-center gap-2 px-6 py-2 rounded-xl font-medium bg-gradient-to-r ${colors.from} ${colors.to} text-white hover:shadow-lg transition-all`}
          >
            {currentQuestionIndex === questions.length - 1
              ? "Finish Quiz"
              : "Next Question"}
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}
