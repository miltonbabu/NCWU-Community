import { useState } from "react";
import { Settings, X, Clock, Shuffle, BookOpen } from "lucide-react";
import type { QuizSettings, QuizQuestionType, HSKLevel } from "@/types/hsk";
import { quizQuestionTypeLabels, hskWordCounts } from "@/types/hsk";

interface QuizSettingsProps {
  isOpen: boolean;
  onClose: () => void;
  onStart: (settings: QuizSettings) => void;
  level: HSKLevel;
  isDark: boolean;
}

const allQuestionCountOptions = [10, 15, 20, 30, 50];
const timeLimitOptions = [
  { value: null, label: "No Timer" },
  { value: 5, label: "5 minutes" },
  { value: 10, label: "10 minutes" },
  { value: 15, label: "15 minutes" },
  { value: 20, label: "20 minutes" },
];

const allQuestionTypes: QuizQuestionType[] = [
  "chinese-to-english",
  "english-to-chinese",
  "pinyin-to-english",
  "pinyin-to-chinese",
  "english-to-pinyin",
  "chinese-to-pinyin",
];

export default function QuizSettings({
  isOpen,
  onClose,
  onStart,
  level,
  isDark,
}: QuizSettingsProps) {
  const maxWords = hskWordCounts[level];
  const [settings, setSettings] = useState<QuizSettings>({
    questionTypes: ["chinese-to-english", "english-to-chinese"],
    questionCount: 20,
    timeLimit: null,
    wordRange: { start: 1, end: maxWords },
    randomize: true,
  });

  // Calculate available words in selected range
  const availableWordCount =
    settings.wordRange.end - settings.wordRange.start + 1;

  // Filter question count options based on available words
  const validQuestionCountOptions = allQuestionCountOptions.filter(
    (count) => count <= availableWordCount,
  );

  const toggleQuestionType = (type: QuizQuestionType) => {
    setSettings((prev) => ({
      ...prev,
      questionTypes: prev.questionTypes.includes(type)
        ? prev.questionTypes.filter((t) => t !== type)
        : [...prev.questionTypes, type],
    }));
  };

  const selectAllTypes = () => {
    setSettings((prev) => ({ ...prev, questionTypes: [...allQuestionTypes] }));
  };

  const deselectAllTypes = () => {
    setSettings((prev) => ({ ...prev, questionTypes: [] }));
  };

  const handleStart = () => {
    if (settings.questionTypes.length === 0) {
      alert("Please select at least one question type");
      return;
    }
    // Use adjusted question count if it's less than selected
    const finalSettings = {
      ...settings,
      questionCount: Math.min(settings.questionCount, availableWordCount),
    };
    onStart(finalSettings);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div
        className={`w-full max-w-2xl rounded-2xl shadow-2xl ${
          isDark ? "bg-slate-800" : "bg-white"
        }`}
      >
        {/* Header */}
        <div
          className={`flex items-center justify-between p-6 border-b ${
            isDark ? "border-slate-700" : "border-slate-200"
          }`}
        >
          <div className="flex items-center gap-3">
            <Settings
              className={`w-6 h-6 ${
                isDark ? "text-indigo-400" : "text-indigo-600"
              }`}
            />
            <h2
              className={`text-xl font-bold ${
                isDark ? "text-white" : "text-slate-900"
              }`}
            >
              Quiz Settings
            </h2>
          </div>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg transition-colors ${
              isDark
                ? "hover:bg-slate-700 text-slate-400"
                : "hover:bg-slate-100 text-slate-500"
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
          {/* Question Types */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3
                className={`font-semibold ${
                  isDark ? "text-white" : "text-slate-900"
                }`}
              >
                Question Types
              </h3>
              <div className="flex gap-2">
                <button
                  onClick={selectAllTypes}
                  className={`text-xs px-2 py-1 rounded ${
                    isDark
                      ? "bg-slate-700 text-slate-300 hover:bg-slate-600"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  Select All
                </button>
                <button
                  onClick={deselectAllTypes}
                  className={`text-xs px-2 py-1 rounded ${
                    isDark
                      ? "bg-slate-700 text-slate-300 hover:bg-slate-600"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  Deselect All
                </button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {allQuestionTypes.map((type) => (
                <button
                  key={type}
                  onClick={() => toggleQuestionType(type)}
                  className={`p-3 rounded-xl text-left transition-all ${
                    settings.questionTypes.includes(type)
                      ? isDark
                        ? "bg-indigo-500/20 border-2 border-indigo-500 text-white"
                        : "bg-indigo-50 border-2 border-indigo-500 text-slate-900"
                      : isDark
                        ? "bg-slate-700/50 border-2 border-transparent text-slate-300 hover:bg-slate-700"
                        : "bg-slate-50 border-2 border-transparent text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                        settings.questionTypes.includes(type)
                          ? "bg-indigo-500 border-indigo-500"
                          : isDark
                            ? "border-slate-500"
                            : "border-slate-300"
                      }`}
                    >
                      {settings.questionTypes.includes(type) && (
                        <svg
                          className="w-3 h-3 text-white"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={3}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      )}
                    </div>
                    <span className="text-sm font-medium">
                      {quizQuestionTypeLabels[type]}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Question Count - Only show options that fit in the selected range */}
          <div>
            <h3
              className={`font-semibold mb-3 ${
                isDark ? "text-white" : "text-slate-900"
              }`}
            >
              Number of Questions
            </h3>
            {validQuestionCountOptions.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {validQuestionCountOptions.map((count) => (
                  <button
                    key={count}
                    onClick={() =>
                      setSettings((prev) => ({ ...prev, questionCount: count }))
                    }
                    className={`px-4 py-2 rounded-xl font-medium transition-all ${
                      settings.questionCount === count
                        ? isDark
                          ? "bg-indigo-500 text-white"
                          : "bg-indigo-500 text-white"
                        : isDark
                          ? "bg-slate-700 text-slate-300 hover:bg-slate-600"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {count}
                  </button>
                ))}
              </div>
            ) : (
              <p
                className={`text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}
              >
                Selected range has {availableWordCount} words. All words will be
                used.
              </p>
            )}
          </div>

          {/* Timer */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Clock
                className={`w-5 h-5 ${
                  isDark ? "text-slate-400" : "text-slate-500"
                }`}
              />
              <h3
                className={`font-semibold ${
                  isDark ? "text-white" : "text-slate-900"
                }`}
              >
                Time Limit
              </h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {timeLimitOptions.map((option) => (
                <button
                  key={option.label}
                  onClick={() =>
                    setSettings((prev) => ({
                      ...prev,
                      timeLimit: option.value,
                    }))
                  }
                  className={`px-4 py-2 rounded-xl font-medium transition-all ${
                    settings.timeLimit === option.value
                      ? isDark
                        ? "bg-indigo-500 text-white"
                        : "bg-indigo-500 text-white"
                      : isDark
                        ? "bg-slate-700 text-slate-300 hover:bg-slate-600"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Word Range */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <BookOpen
                  className={`w-5 h-5 ${
                    isDark ? "text-slate-400" : "text-slate-500"
                  }`}
                />
                <h3
                  className={`font-semibold ${
                    isDark ? "text-white" : "text-slate-900"
                  }`}
                >
                  Word Range
                </h3>
              </div>
              <span
                className={`text-xs px-2 py-1 rounded-full ${
                  isDark
                    ? "bg-indigo-500/20 text-indigo-400"
                    : "bg-indigo-100 text-indigo-600"
                }`}
              >
                {availableWordCount} words selected
              </span>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <label
                  className={`text-xs mb-1 block ${
                    isDark ? "text-slate-400" : "text-slate-500"
                  }`}
                >
                  From
                </label>
                <input
                  type="number"
                  min={1}
                  max={settings.wordRange.end}
                  value={settings.wordRange.start}
                  onChange={(e) =>
                    setSettings((prev) => ({
                      ...prev,
                      wordRange: {
                        ...prev.wordRange,
                        start: Math.max(1, parseInt(e.target.value) || 1),
                      },
                    }))
                  }
                  className={`w-full px-3 py-2 rounded-lg border ${
                    isDark
                      ? "bg-slate-700 border-slate-600 text-white"
                      : "bg-white border-slate-300 text-slate-900"
                  }`}
                />
              </div>
              <div className="flex-1">
                <label
                  className={`text-xs mb-1 block ${
                    isDark ? "text-slate-400" : "text-slate-500"
                  }`}
                >
                  To
                </label>
                <input
                  type="number"
                  min={settings.wordRange.start}
                  max={maxWords}
                  value={settings.wordRange.end}
                  onChange={(e) =>
                    setSettings((prev) => ({
                      ...prev,
                      wordRange: {
                        ...prev.wordRange,
                        end: Math.min(
                          maxWords,
                          parseInt(e.target.value) || maxWords,
                        ),
                      },
                    }))
                  }
                  className={`w-full px-3 py-2 rounded-lg border ${
                    isDark
                      ? "bg-slate-700 border-slate-600 text-white"
                      : "bg-white border-slate-300 text-slate-900"
                  }`}
                />
              </div>
            </div>
          </div>

          {/* Randomize */}
          <div>
            <button
              onClick={() =>
                setSettings((prev) => ({ ...prev, randomize: !prev.randomize }))
              }
              className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all w-full ${
                settings.randomize
                  ? isDark
                    ? "bg-indigo-500/20 border-indigo-500"
                    : "bg-indigo-50 border-indigo-500"
                  : isDark
                    ? "bg-slate-700/50 border-transparent"
                    : "bg-slate-50 border-transparent"
              }`}
            >
              <Shuffle
                className={`w-5 h-5 ${
                  settings.randomize
                    ? isDark
                      ? "text-indigo-400"
                      : "text-indigo-600"
                    : isDark
                      ? "text-slate-400"
                      : "text-slate-500"
                }`}
              />
              <div className="text-left">
                <p
                  className={`font-medium ${
                    settings.randomize
                      ? isDark
                        ? "text-white"
                        : "text-slate-900"
                      : isDark
                        ? "text-slate-300"
                        : "text-slate-600"
                  }`}
                >
                  Randomize Questions
                </p>
                <p
                  className={`text-xs ${
                    isDark ? "text-slate-400" : "text-slate-500"
                  }`}
                >
                  Shuffle word order for each quiz
                </p>
              </div>
              <div className="ml-auto">
                <div
                  className={`w-12 h-6 rounded-full transition-colors ${
                    settings.randomize ? "bg-indigo-500" : "bg-slate-400"
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-white mt-0.5 transition-transform ${
                      settings.randomize ? "translate-x-6" : "translate-x-0.5"
                    }`}
                  />
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div
          className={`flex items-center justify-end gap-3 p-6 border-t ${
            isDark ? "border-slate-700" : "border-slate-200"
          }`}
        >
          <button
            onClick={onClose}
            className={`px-6 py-3 rounded-xl font-medium transition-colors ${
              isDark
                ? "bg-slate-700 text-slate-300 hover:bg-slate-600"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            Cancel
          </button>
          <button
            onClick={handleStart}
            disabled={settings.questionTypes.length === 0}
            className={`px-6 py-3 rounded-xl font-medium transition-colors ${
              settings.questionTypes.length === 0
                ? "bg-slate-300 text-slate-500 cursor-not-allowed"
                : isDark
                  ? "bg-indigo-500 text-white hover:bg-indigo-600"
                  : "bg-indigo-500 text-white hover:bg-indigo-600"
            }`}
          >
            Start Quiz
          </button>
        </div>
      </div>
    </div>
  );
}
