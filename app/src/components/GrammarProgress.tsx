import { useState, useEffect } from 'react';
import {
  BookOpen,
  Award,
  Clock,
  Target,
  AlertCircle,
  CheckCircle,
  Calendar,
  Flame,
} from 'lucide-react';
import type { HSKLevel, GrammarProgress } from '@/types/hsk';

const levelColors: Record<number, { bg: string; text: string; gradient: string }> = {
  1: { bg: 'bg-emerald-500/20', text: 'text-emerald-400', gradient: 'from-emerald-500 to-teal-600' },
  2: { bg: 'bg-blue-500/20', text: 'text-blue-400', gradient: 'from-blue-500 to-cyan-600' },
  3: { bg: 'bg-violet-500/20', text: 'text-violet-400', gradient: 'from-violet-500 to-purple-600' },
  4: { bg: 'bg-amber-500/20', text: 'text-amber-400', gradient: 'from-amber-500 to-orange-600' },
  5: { bg: 'bg-rose-500/20', text: 'text-rose-400', gradient: 'from-rose-500 to-pink-600' },
  6: { bg: 'bg-red-500/20', text: 'text-red-400', gradient: 'from-red-500 to-rose-600' },
};

interface GrammarProgressProps {
  isDark: boolean;
  level: HSKLevel;
  totalSentences: number;
}

export default function GrammarProgressComponent({ isDark, level, totalSentences }: GrammarProgressProps) {
  const [progress, setProgress] = useState<GrammarProgress | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem(`grammar-progress-${level}`);
    if (saved) {
      setProgress(JSON.parse(saved));
    } else {
      setProgress({
        level,
        sentencesLearned: 0,
        totalSentences,
        practicedSentences: [],
        masteredSentences: [],
        lastStudied: null,
        studyStreak: 0,
        timeSpentMinutes: 0,
        weakSentences: [],
      });
    }
  }, [level, totalSentences]);

  useEffect(() => {
    if (progress) {
      localStorage.setItem(`grammar-progress-${level}`, JSON.stringify(progress));
    }
  }, [progress, level]);



  const masteryPercentage = progress && totalSentences > 0
    ? Math.round((progress.masteredSentences.length / totalSentences) * 100)
    : 0;

  const practicedPercentage = progress && totalSentences > 0
    ? Math.round((progress.practicedSentences.length / totalSentences) * 100)
    : 0;

  const colors = levelColors[level] || levelColors[1];

  if (!progress) {
    return <div className="text-center py-8">Loading progress...</div>;
  }

  return (
    <div className="space-y-6">
      <div className={`p-6 rounded-2xl border ${isDark ? 'bg-slate-800/60 border-slate-700' : 'bg-white border-slate-200 shadow-sm'}`}>
        <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-slate-900'}`}>
          HSK {level} Grammar Progress
        </h3>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className={`p-4 rounded-xl ${colors.bg}`}>
            <div className={`flex items-center gap-2 mb-2 ${colors.text}`}>
              <BookOpen className="w-5 h-5" />
              <span className="text-sm font-medium">Learned</span>
            </div>
            <p className={`text-2xl font-bold ${colors.text}`}>
              {progress.sentencesLearned}
            </p>
            <p className={`text-xs mt-1 ${colors.text} opacity-70`}>
              of {totalSentences} sentences
            </p>
          </div>

          <div className={`p-4 rounded-xl ${colors.bg}`}>
            <div className={`flex items-center gap-2 mb-2 ${colors.text}`}>
              <Award className="w-5 h-5" />
              <span className="text-sm font-medium">Mastered</span>
            </div>
            <p className={`text-2xl font-bold ${colors.text}`}>
              {progress.masteredSentences.length}
            </p>
            <p className={`text-xs mt-1 ${colors.text} opacity-70`}>
              {masteryPercentage}% mastery
            </p>
          </div>

          <div className={`p-4 rounded-xl ${colors.bg}`}>
            <div className={`flex items-center gap-2 mb-2 ${colors.text}`}>
              <Flame className="w-5 h-5" />
              <span className="text-sm font-medium">Streak</span>
            </div>
            <p className={`text-2xl font-bold ${colors.text}`}>
              {progress.studyStreak}
            </p>
            <p className={`text-xs mt-1 ${colors.text} opacity-70`}>
              sessions
            </p>
          </div>

          <div className={`p-4 rounded-xl ${colors.bg}`}>
            <div className={`flex items-center gap-2 mb-2 ${colors.text}`}>
              <Clock className="w-5 h-5" />
              <span className="text-sm font-medium">Time</span>
            </div>
            <p className={`text-2xl font-bold ${colors.text}`}>
              {progress.timeSpentMinutes}
            </p>
            <p className={`text-xs mt-1 ${colors.text} opacity-70`}>
              minutes
            </p>
          </div>
        </div>

        <div className="mt-6">
          <div className="flex items-center justify-between mb-2">
            <span className={`text-sm font-medium ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
              Overall Progress
            </span>
            <span className={`text-sm font-bold ${colors.text}`}>
              {practicedPercentage}%
            </span>
          </div>
          <div className={`h-3 rounded-full overflow-hidden ${isDark ? 'bg-slate-700' : 'bg-slate-200'}`}>
            <div
              className={`h-full bg-gradient-to-r ${colors.gradient} transition-all duration-500`}
              style={{ width: `${practicedPercentage}%` }}
            />
          </div>
        </div>

        {progress.lastStudied && (
          <div className={`mt-4 flex items-center gap-2 text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            <Calendar className="w-4 h-4" />
            <span>Last studied: {new Date(progress.lastStudied).toLocaleDateString()}</span>
          </div>
        )}
      </div>

      {(progress.weakSentences.length > 0 || progress.masteredSentences.length > 0) && (
        <div className="grid md:grid-cols-2 gap-4">
          {progress.weakSentences.length > 0 && (
            <div className={`p-5 rounded-2xl border ${isDark ? 'bg-slate-800/60 border-slate-700' : 'bg-white border-slate-200'}`}>
              <div className="flex items-center gap-2 mb-3">
                <AlertCircle className={`w-5 h-5 ${colors.text}`} />
                <h4 className={`font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  Needs Practice
                </h4>
              </div>
              <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                {progress.weakSentences.length} sentences need more review
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {progress.weakSentences.slice(0, 5).map((id) => (
                  <span
                    key={id}
                    className={`px-2 py-1 rounded-lg text-xs ${colors.bg} ${colors.text}`}
                  >
                    #{id}
                  </span>
                ))}
                {progress.weakSentences.length > 5 && (
                  <span className={`px-2 py-1 rounded-lg text-xs ${isDark ? 'bg-slate-700 text-slate-300' : 'bg-slate-100 text-slate-600'}`}>
                    +{progress.weakSentences.length - 5} more
                  </span>
                )}
              </div>
            </div>
          )}

          {progress.masteredSentences.length > 0 && (
            <div className={`p-5 rounded-2xl border ${isDark ? 'bg-slate-800/60 border-slate-700' : 'bg-white border-slate-200'}`}>
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle className={`w-5 h-5 ${colors.text}`} />
                <h4 className={`font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  Mastered Sentences
                </h4>
              </div>
              <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                {progress.masteredSentences.length} sentences mastered
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {progress.masteredSentences.slice(0, 5).map((id) => (
                  <span
                    key={id}
                    className={`px-2 py-1 rounded-lg text-xs ${colors.bg} ${colors.text}`}
                  >
                    #{id}
                  </span>
                ))}
                {progress.masteredSentences.length > 5 && (
                  <span className={`px-2 py-1 rounded-lg text-xs ${isDark ? 'bg-slate-700 text-slate-300' : 'bg-slate-100 text-slate-600'}`}>
                    +{progress.masteredSentences.length - 5} more
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      <div className={`p-5 rounded-2xl border ${isDark ? 'bg-slate-800/60 border-slate-700' : 'bg-white border-slate-200'}`}>
        <div className="flex items-center gap-2 mb-4">
          <Target className={`w-5 h-5 ${colors.text}`} />
          <h4 className={`font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
            Study Goals
          </h4>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className={`text-sm ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
              Daily Practice
            </span>
            <span className={`text-sm font-medium ${progress.practicedSentences.length >= 10 ? colors.text : 'text-amber-500'}`}>
              {progress.practicedSentences.length >= 10 ? '✓ Completed' : `${progress.practicedSentences.length}/10`}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className={`text-sm ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
              Master 50 Sentences
            </span>
            <span className={`text-sm font-medium ${progress.masteredSentences.length >= 50 ? colors.text : isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              {progress.masteredSentences.length}/50
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className={`text-sm ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
              Study Streak (7 days)
            </span>
            <span className={`text-sm font-medium ${progress.studyStreak >= 7 ? colors.text : 'text-amber-500'}`}>
              {progress.studyStreak}/7 days
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
