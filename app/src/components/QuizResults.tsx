import { useState, useRef } from "react";
import {
  Trophy,
  Share2,
  Copy,
  Check,
  X,
  Clock,
  Target,
  RotateCcw,
  Facebook,
  Twitter,
  Linkedin,
  Link as LinkIcon,
  Download,
  GraduationCap,
} from "lucide-react";
import html2canvas from "html2canvas";
import type { HSKQuizResult, QuizSettings, HSKLevel } from "@/types/hsk";
import { quizQuestionTypeLabels } from "@/types/hsk";
import { generateQuizShareLink } from "@/utils/quizGenerator";

interface QuizResultsProps {
  result: HSKQuizResult;
  settings: QuizSettings;
  level: HSKLevel;
  isDark: boolean;
  onRetry: () => void;
  timeEnded?: boolean;
}

export default function QuizResults({
  result,
  settings,
  level,
  isDark,
  onRetry,
  timeEnded = false,
}: QuizResultsProps) {
  const [showShareModal, setShowShareModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const resultCardRef = useRef<HTMLDivElement>(null);

  const percentage = Math.round((result.score / result.totalPoints) * 100);
  const passed = percentage >= 60;
  const shareLink = generateQuizShareLink(result.quizId);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const handleShare = async (platform: string) => {
    const text = `I scored ${percentage}% on HSK ${level} Quiz! Can you beat my score?`;
    const url = encodeURIComponent(shareLink);

    let shareUrl = "";
    switch (platform) {
      case "facebook":
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${url}`;
        break;
      case "twitter":
        shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
          text,
        )}&url=${url}`;
        break;
      case "linkedin":
        shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${url}`;
        break;
    }

    if (shareUrl) {
      window.open(shareUrl, "_blank", "width=600,height=400");
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleDownloadImage = async () => {
    if (!resultCardRef.current) return;

    setDownloading(true);
    try {
      const canvas = await html2canvas(resultCardRef.current, {
        backgroundColor: isDark ? "#1e293b" : "#ffffff",
        scale: 2,
        logging: false,
      });

      const link = document.createElement("a");
      link.download = `HSK${level}-Quiz-Result-${percentage}percent.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } catch (err) {
      console.error("Failed to download image:", err);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <>
      <div
        ref={resultCardRef}
        className={`rounded-2xl p-4 sm:p-8 ${
          isDark ? "bg-slate-800" : "bg-white"
        } shadow-2xl animate-in fade-in zoom-in duration-300`}
      >
        {/* Website Branding Header */}
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-indigo-500">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1
                className={`text-lg font-bold ${isDark ? "text-white" : "text-slate-900"}`}
              >
                NCWU International
              </h1>
              <p
                className={`text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}
              >
                HSK Mastering Platform
              </p>
            </div>
          </div>
          <div
            className={`text-xs ${isDark ? "text-slate-500" : "text-slate-400"}`}
          >
            www.ncwu.site/hsk
          </div>
        </div>

        {/* Header */}
        <div className="text-center mb-8">
          <div
            className={`w-24 h-24 rounded-full mx-auto mb-4 flex items-center justify-center animate-in zoom-in spin-in duration-500 ${
              timeEnded
                ? "bg-gradient-to-br from-red-400 to-red-600"
                : passed
                  ? "bg-gradient-to-br from-emerald-400 to-emerald-600"
                  : "bg-gradient-to-br from-amber-400 to-orange-500"
            }`}
          >
            <Trophy className="w-12 h-12 text-white" />
          </div>
          <h2
            className={`text-2xl sm:text-3xl font-bold mb-2 ${
              isDark ? "text-white" : "text-slate-900"
            }`}
          >
            {timeEnded
              ? "Time's Up!"
              : passed
                ? "Congratulations!"
                : "Good Try!"}
          </h2>
          <p className={isDark ? "text-slate-400" : "text-slate-500"}>
            {timeEnded
              ? `Your time ran out! You scored ${percentage}% on HSK ${level} Quiz`
              : `You ${passed ? "passed" : "didn't pass"} the HSK ${level} Quiz`}
          </p>
        </div>

        {/* Score Circle */}
        <div className="flex justify-center mb-8">
          <div className="relative">
            <svg className="w-32 sm:w-40 h-32 sm:h-40 transform -rotate-90">
              <circle
                cx="64"
                cy="64"
                r="56"
                fill="none"
                stroke={isDark ? "#334155" : "#e2e8f0"}
                strokeWidth="10"
              />
              <circle
                cx="64"
                cy="64"
                r="56"
                fill="none"
                stroke={passed ? "#10b981" : "#f59e0b"}
                strokeWidth="10"
                strokeLinecap="round"
                strokeDasharray={`${(percentage / 100) * 352} 352`}
                className="transition-all duration-1000 ease-out"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span
                className={`text-3xl sm:text-4xl font-bold ${
                  isDark ? "text-white" : "text-slate-900"
                }`}
              >
                {percentage}%
              </span>
              <span className={isDark ? "text-slate-400" : "text-slate-500"}>
                {result.correctAnswers}/{result.totalQuestions}
              </span>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div
            className={`p-4 rounded-xl text-center ${
              isDark ? "bg-slate-700/50" : "bg-slate-50"
            }`}
          >
            <Target
              className={`w-6 h-6 mx-auto mb-2 ${
                isDark ? "text-indigo-400" : "text-indigo-600"
              }`}
            />
            <p className={`text-2xl font-bold ${isDark ? "text-white" : ""}`}>
              {result.correctAnswers}
            </p>
            <p className={isDark ? "text-slate-400" : "text-slate-500"}>
              Correct
            </p>
          </div>
          <div
            className={`p-4 rounded-xl text-center ${
              isDark ? "bg-slate-700/50" : "bg-slate-50"
            }`}
          >
            <Clock
              className={`w-6 h-6 mx-auto mb-2 ${
                isDark ? "text-indigo-400" : "text-indigo-600"
              }`}
            />
            <p className={`text-2xl font-bold ${isDark ? "text-white" : ""}`}>
              {formatTime(result.timeSpent)}
            </p>
            <p className={isDark ? "text-slate-400" : "text-slate-500"}>Time</p>
          </div>
          <div
            className={`p-4 rounded-xl text-center ${
              isDark ? "bg-slate-700/50" : "bg-slate-50"
            }`}
          >
            <Trophy
              className={`w-6 h-6 mx-auto mb-2 ${
                isDark ? "text-indigo-400" : "text-indigo-600"
              }`}
            />
            <p className={`text-2xl font-bold ${isDark ? "text-white" : ""}`}>
              {result.score}
            </p>
            <p className={isDark ? "text-slate-400" : "text-slate-500"}>
              Points
            </p>
          </div>
        </div>

        {/* Question Types Used */}
        <div className="mb-8">
          <h3
            className={`text-sm font-medium mb-3 ${
              isDark ? "text-slate-400" : "text-slate-500"
            }`}
          >
            Question Types Used
          </h3>
          <div className="flex flex-wrap gap-2">
            {settings.questionTypes.map((type) => (
              <span
                key={type}
                className={`px-3 py-1 rounded-full text-sm ${
                  isDark
                    ? "bg-slate-700 text-slate-300"
                    : "bg-slate-100 text-slate-600"
                }`}
              >
                {quizQuestionTypeLabels[type]}
              </span>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => setShowShareModal(true)}
            className={`flex-1 flex items-center justify-center gap-2 px-4 sm:px-6 py-2 sm:py-3 rounded-xl font-medium transition-colors ${
              isDark
                ? "bg-slate-700 text-white hover:bg-slate-600"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            <Share2 className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="text-sm sm:text-base">Share Results</span>
          </button>
          <button
            onClick={handleDownloadImage}
            disabled={downloading}
            className={`flex-1 flex items-center justify-center gap-2 px-4 sm:px-6 py-2 sm:py-3 rounded-xl font-medium transition-colors ${
              downloading ? "opacity-50 cursor-not-allowed" : ""
            } ${
              isDark
                ? "bg-emerald-600 text-white hover:bg-emerald-700"
                : "bg-emerald-500 text-white hover:bg-emerald-600"
            }`}
          >
            {downloading ? (
              <>
                <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span className="text-sm sm:text-base">Generating...</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="text-sm sm:text-base">Download Card</span>
              </>
            )}
          </button>
          <button
            onClick={onRetry}
            className={`flex-1 flex items-center justify-center gap-2 px-4 sm:px-6 py-2 sm:py-3 rounded-xl font-medium transition-colors ${
              isDark
                ? "bg-indigo-500 text-white hover:bg-indigo-600"
                : "bg-indigo-500 text-white hover:bg-indigo-600"
            }`}
          >
            <RotateCcw className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="text-sm sm:text-base">Try Again</span>
          </button>
        </div>
      </div>

      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div
            className={`w-full max-w-md rounded-2xl p-6 animate-in fade-in zoom-in duration-300 ${
              isDark ? "bg-slate-800" : "bg-white"
            }`}
          >
            <div className="flex items-center justify-between mb-6">
              <h3
                className={`text-xl font-bold ${
                  isDark ? "text-white" : "text-slate-900"
                }`}
              >
                Share Your Results
              </h3>
              <button
                onClick={() => setShowShareModal(false)}
                className={`p-2 rounded-lg transition-colors ${
                  isDark
                    ? "hover:bg-slate-700 text-slate-400"
                    : "hover:bg-slate-100 text-slate-500"
                }`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Social Share Buttons */}
            <div className="grid grid-cols-3 gap-3 mb-6">
              <button
                onClick={() => handleShare("facebook")}
                className="flex flex-col items-center gap-2 p-4 rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition-colors"
              >
                <Facebook className="w-6 h-6" />
                <span className="text-sm">Facebook</span>
              </button>
              <button
                onClick={() => handleShare("twitter")}
                className="flex flex-col items-center gap-2 p-4 rounded-xl bg-sky-500 text-white hover:bg-sky-600 transition-colors"
              >
                <Twitter className="w-6 h-6" />
                <span className="text-sm">Twitter</span>
              </button>
              <button
                onClick={() => handleShare("linkedin")}
                className="flex flex-col items-center gap-2 p-4 rounded-xl bg-blue-700 text-white hover:bg-blue-800 transition-colors"
              >
                <Linkedin className="w-6 h-6" />
                <span className="text-sm">LinkedIn</span>
              </button>
            </div>

            {/* Copy Link */}
            <div
              className={`flex items-center gap-3 p-4 rounded-xl ${
                isDark ? "bg-slate-700" : "bg-slate-100"
              }`}
            >
              <LinkIcon
                className={`w-5 h-5 ${
                  isDark ? "text-slate-400" : "text-slate-500"
                }`}
              />
              <input
                type="text"
                value={shareLink}
                readOnly
                className={`flex-1 bg-transparent text-sm ${
                  isDark ? "text-slate-300" : "text-slate-600"
                }`}
              />
              <button
                onClick={handleCopyLink}
                className={`p-2 rounded-lg transition-colors ${
                  copied
                    ? "bg-emerald-500 text-white"
                    : isDark
                      ? "bg-slate-600 text-slate-300 hover:bg-slate-500"
                      : "bg-white text-slate-600 hover:bg-slate-200"
                }`}
              >
                {copied ? (
                  <Check className="w-5 h-5" />
                ) : (
                  <Copy className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
