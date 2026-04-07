import { useState } from 'react';
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
  Award,
} from 'lucide-react';
import type { HSKLevel } from '@/types/hsk';
import GrammarQuiz from './GrammarQuiz';
import GrammarStudyMode from './GrammarStudyMode';
import GrammarProgress from './GrammarProgress';
import GrammarPatternExplorer from './GrammarPatternExplorer';
import GrammarDownloads from './GrammarDownloads';
import type { GrammarQuizResult } from '@/types/hsk';

interface HSKGrammarTabProps {
  isDark: boolean;
  selectedLevel: HSKLevel;
  setSelectedLevel: (level: HSKLevel) => void;
}

type GrammarSubTab = 'learn' | 'study' | 'quiz' | 'patterns' | 'progress' | 'export';

const levelConfig: Record<number, {
  gradient: string;
  bgGradient: string;
  icon: string;
  color: string;
  title: string;
  description: string;
  totalWords: number;
}> = {
  1: {
    gradient: 'from-emerald-400 via-teal-500 to-cyan-500',
    bgGradient: 'from-emerald-500/20 via-teal-500/20 to-cyan-500/20',
    icon: '🎯',
    color: 'emerald',
    title: 'HSK 1 - Beginner',
    description: 'Basic grammar patterns for everyday conversations',
    totalWords: 150,
  },
  2: {
    gradient: 'from-blue-400 via-cyan-500 to-indigo-500',
    bgGradient: 'from-blue-500/20 via-cyan-500/20 to-indigo-500/20',
    icon: '📚',
    color: 'blue',
    title: 'HSK 2 - Elementary',
    description: 'Elementary grammar structures',
    totalWords: 300,
  },
  3: {
    gradient: 'from-violet-400 via-purple-500 to-pink-500',
    bgGradient: 'from-violet-500/20 via-purple-500/20 to-pink-500/20',
    icon: '🚀',
    color: 'violet',
    title: 'HSK 3 - Intermediate',
    description: 'Intermediate grammar patterns',
    totalWords: 600,
  },
  4: {
    gradient: 'from-amber-400 via-orange-500 to-red-500',
    bgGradient: 'from-amber-500/20 via-orange-500/20 to-red-500/20',
    icon: '⭐',
    color: 'amber',
    title: 'HSK 4 - Upper-Intermediate',
    description: 'Complex grammatical structures',
    totalWords: 1200,
  },
  5: {
    gradient: 'from-rose-400 via-pink-500 to-red-500',
    bgGradient: 'from-rose-500/20 via-pink-500/20 to-red-500/20',
    icon: '💎',
    color: 'rose',
    title: 'HSK 5 - Advanced',
    description: 'Advanced grammar mastery',
    totalWords: 2500,
  },
  6: {
    gradient: 'from-red-400 via-rose-500 to-orange-500',
    bgGradient: 'from-red-500/20 via-rose-500/20 to-orange-500/20',
    icon: '🏆',
    color: 'red',
    title: 'HSK 6 - Proficient',
    description: 'Master level grammar skills',
    totalWords: 5000,
  },
};

export default function HSKGrammarTab({ isDark, selectedLevel, setSelectedLevel }: HSKGrammarTabProps) {
  const [activeSubTab, setActiveSubTab] = useState<GrammarSubTab>('learn');
  const [totalSentences] = useState(0);

  const handleQuizComplete = (result: GrammarQuizResult) => {
    console.log('Quiz completed:', result);
  };

  const handleExitQuiz = () => {
    setActiveSubTab('learn');
  };

  const config = levelConfig[selectedLevel];

  if (activeSubTab === 'quiz') {
    return (
      <GrammarQuiz
        isDark={isDark}
        level={selectedLevel}
        onComplete={handleQuizComplete}
        onExit={handleExitQuiz}
      />
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Level Selection Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4">
        {([1, 2, 3, 4, 5, 6] as HSKLevel[]).map((level) => {
          const lvlConfig = levelConfig[level];
          const isActive = selectedLevel === level;
          
          return (
            <button
              key={level}
              onClick={() => {
                setSelectedLevel(level);
                setActiveSubTab('learn');
              }}
              className={`group relative p-4 md:p-6 rounded-2xl backdrop-blur-xl transition-all duration-300 hover:scale-105 ${
                isActive
                  ? `bg-gradient-to-br ${lvlConfig.bgGradient} border-2 border-${lvlConfig.color}-500/50 shadow-xl`
                  : isDark
                    ? 'bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20'
                    : 'bg-white/70 border border-black/5 hover:bg-white/80 hover:shadow-lg'
              }`}
            >
              {/* Level Badge */}
              <div className={`w-10 h-10 md:w-12 md:h-12 mx-auto mb-2 md:mb-3 rounded-xl bg-gradient-to-br ${lvlConfig.gradient} flex items-center justify-center text-xl md:text-2xl shadow-lg`}>
                {lvlConfig.icon}
              </div>
              
              <h3 className={`text-sm md:text-base font-bold mb-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                HSK {level}
              </h3>
              
              <p className={`text-xs ${isDark ? 'text-white/60' : 'text-slate-500'}`}>
                {lvlConfig.totalWords}+ sentences
              </p>

              {isActive && (
                <div className={`absolute -top-1 -right-1 w-3 h-3 rounded-full bg-gradient-to-r ${lvlConfig.gradient}`}>
                  <div className={`absolute inset-0 rounded-full bg-${lvlConfig.color}-400 animate-ping`} />
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Selected Level Header */}
      <div className={`backdrop-blur-2xl rounded-3xl p-6 md:p-8 ${isDark ? 'bg-white/5 border border-white/10' : 'bg-white/70 border border-black/5'} shadow-xl`}>
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className={`w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-gradient-to-br ${config.gradient} flex items-center justify-center text-3xl md:text-4xl shadow-lg`}>
              {config.icon}
            </div>
            <div>
              <h2 className={`text-2xl md:text-3xl font-bold mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {config.title}
              </h2>
              <p className={`text-sm md:text-base ${isDark ? 'text-white/60' : 'text-slate-500'}`}>
                {config.description}
              </p>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-3 md:gap-4 mb-6">
          <div className={`p-3 md:p-4 rounded-xl backdrop-blur-sm ${isDark ? 'bg-white/5' : 'bg-black/5'}`}>
            <Book className={`w-5 h-5 md:w-6 md:h-6 mb-2 text-${config.color}-400`} />
            <p className={`text-lg md:text-xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {config.totalWords}+
            </p>
            <p className={`text-xs ${isDark ? 'text-white/60' : 'text-slate-500'}`}>Sentences</p>
          </div>
          
          <div className={`p-3 md:p-4 rounded-xl backdrop-blur-sm ${isDark ? 'bg-white/5' : 'bg-black/5'}`}>
            <Headphones className={`w-5 h-5 md:w-6 md:h-6 mb-2 text-${config.color}-400`} />
            <p className={`text-lg md:text-xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Audio
            </p>
            <p className={`text-xs ${isDark ? 'text-white/60' : 'text-slate-500'}`}>Included</p>
          </div>
          
          <div className={`p-3 md:p-4 rounded-xl backdrop-blur-sm ${isDark ? 'bg-white/5' : 'bg-black/5'}`}>
            <TrendingUp className={`w-5 h-5 md:w-6 md:h-6 mb-2 text-${config.color}-400`} />
            <p className={`text-lg md:text-xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
              6
            </p>
            <p className={`text-xs ${isDark ? 'text-white/60' : 'text-slate-500'}`}>Topics</p>
          </div>
        </div>
      </div>

      {/* Feature Cards */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {/* Study with Flashcards */}
        <button
          onClick={() => setActiveSubTab('study')}
          className={`group p-6 md:p-8 rounded-2xl text-left transition-all duration-300 backdrop-blur-xl hover:scale-[1.02] ${
            isDark
              ? 'bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20'
              : 'bg-white/70 border border-black/5 hover:bg-white/80 hover:shadow-xl'
          }`}
        >
          <div className={`w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-gradient-to-br ${config.bgGradient} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
            <Brain className={`w-7 h-7 md:w-8 md:h-8 text-${config.color}-400`} />
          </div>
          
          <h3 className={`text-lg md:text-xl font-bold mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
            Study Flashcards
          </h3>
          
          <p className={`text-sm mb-4 ${isDark ? 'text-white/60' : 'text-slate-500'}`}>
            Learn grammar with interactive flashcards and spaced repetition
          </p>
          
          <div className={`flex items-center gap-2 text-sm font-medium text-${config.color}-400`}>
            Start Learning
            <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </button>

        {/* Take a Quiz */}
        <button
          onClick={() => setActiveSubTab('quiz')}
          className={`group p-6 md:p-8 rounded-2xl text-left transition-all duration-300 backdrop-blur-xl hover:scale-[1.02] ${
            isDark
              ? 'bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20'
              : 'bg-white/70 border border-black/5 hover:bg-white/80 hover:shadow-xl'
          }`}
        >
          <div className={`w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-gradient-to-br ${config.bgGradient} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
            <Target className={`w-7 h-7 md:w-8 md:h-8 text-${config.color}-400`} />
          </div>
          
          <h3 className={`text-lg md:text-xl font-bold mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
            Take a Quiz
          </h3>
          
          <p className={`text-sm mb-4 ${isDark ? 'text-white/60' : 'text-slate-500'}`}>
            Test your knowledge with interactive grammar quizzes
          </p>
          
          <div className={`flex items-center gap-2 text-sm font-medium text-${config.color}-400`}>
            Start Quiz
            <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </button>

        {/* Explore Patterns */}
        <button
          onClick={() => setActiveSubTab('patterns')}
          className={`group p-6 md:p-8 rounded-2xl text-left transition-all duration-300 backdrop-blur-xl hover:scale-[1.02] ${
            isDark
              ? 'bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20'
              : 'bg-white/70 border border-black/5 hover:bg-white/80 hover:shadow-xl'
          }`}
        >
          <div className={`w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-gradient-to-br ${config.bgGradient} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
            <FileText className={`w-7 h-7 md:w-8 md:h-8 text-${config.color}-400`} />
          </div>
          
          <h3 className={`text-lg md:text-xl font-bold mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
            Explore Patterns
          </h3>
          
          <p className={`text-sm mb-4 ${isDark ? 'text-white/60' : 'text-slate-500'}`}>
            Browse grammar patterns and examples organized by topic
          </p>
          
          <div className={`flex items-center gap-2 text-sm font-medium text-${config.color}-400`}>
            Browse Patterns
            <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </button>

        {/* Track Progress */}
        <button
          onClick={() => setActiveSubTab('progress')}
          className={`group p-6 md:p-8 rounded-2xl text-left transition-all duration-300 backdrop-blur-xl hover:scale-[1.02] ${
            isDark
              ? 'bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20'
              : 'bg-white/70 border border-black/5 hover:bg-white/80 hover:shadow-xl'
          }`}
        >
          <div className={`w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-gradient-to-br ${config.bgGradient} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
            <BarChart3 className={`w-7 h-7 md:w-8 md:h-8 text-${config.color}-400`} />
          </div>
          
          <h3 className={`text-lg md:text-xl font-bold mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
            Track Progress
          </h3>
          
          <p className={`text-sm mb-4 ${isDark ? 'text-white/60' : 'text-slate-500'}`}>
            Monitor your learning progress and study streaks
          </p>
          
          <div className={`flex items-center gap-2 text-sm font-medium text-${config.color}-400`}>
            View Progress
            <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </button>

        {/* Browse Sentences */}
        <button
          onClick={() => setActiveSubTab('learn')}
          className={`group p-6 md:p-8 rounded-2xl text-left transition-all duration-300 backdrop-blur-xl hover:scale-[1.02] ${
            isDark
              ? 'bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20'
              : 'bg-white/70 border border-black/5 hover:bg-white/80 hover:shadow-xl'
          }`}
        >
          <div className={`w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-gradient-to-br ${config.bgGradient} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
            <BookOpen className={`w-7 h-7 md:w-8 md:h-8 text-${config.color}-400`} />
          </div>
          
          <h3 className={`text-lg md:text-xl font-bold mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
            Browse Sentences
          </h3>
          
          <p className={`text-sm mb-4 ${isDark ? 'text-white/60' : 'text-slate-500'}`}>
            View all grammar sentences with audio and translations
          </p>
          
          <div className={`flex items-center gap-2 text-sm font-medium text-${config.color}-400`}>
            Browse All
            <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </button>

        {/* Download Resources */}
        <button
          onClick={() => setActiveSubTab('export')}
          className={`group p-6 md:p-8 rounded-2xl text-left transition-all duration-300 backdrop-blur-xl hover:scale-[1.02] ${
            isDark
              ? 'bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20'
              : 'bg-white/70 border border-black/5 hover:bg-white/80 hover:shadow-xl'
          }`}
        >
          <div className={`w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-gradient-to-br ${config.bgGradient} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
            <Download className={`w-7 h-7 md:w-8 md:h-8 text-${config.color}-400`} />
          </div>
          
          <h3 className={`text-lg md:text-xl font-bold mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
            Download Resources
          </h3>
          
          <p className={`text-sm mb-4 ${isDark ? 'text-white/60' : 'text-slate-500'}`}>
            Export grammar data as CSV, Anki deck, or worksheets
          </p>
          
          <div className={`flex items-center gap-2 text-sm font-medium text-${config.color}-400`}>
            Download
            <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </button>
      </div>

      {/* Feature Views */}
      {activeSubTab === 'learn' && (
        <div className={`backdrop-blur-xl rounded-2xl p-6 ${isDark ? 'bg-white/5 border border-white/10' : 'bg-white/50 border border-black/5'}`}>
          <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-slate-900'}`}>
            Browse All Sentences - HSK {selectedLevel}
          </h3>
          <p className={`text-sm ${isDark ? 'text-white/60' : 'text-slate-500'}`}>
            Select a sentence card above to view details, or use the flashcards to study.
          </p>
        </div>
      )}

      {activeSubTab === 'study' && (
        <GrammarStudyMode isDark={isDark} level={selectedLevel} />
      )}

      {activeSubTab === 'patterns' && (
        <GrammarPatternExplorer isDark={isDark} level={selectedLevel} />
      )}

      {activeSubTab === 'progress' && (
        <GrammarProgress isDark={isDark} level={selectedLevel} totalSentences={totalSentences} />
      )}

      {activeSubTab === 'export' && (
        <GrammarDownloads isDark={isDark} level={selectedLevel} />
      )}
    </div>
  );
}
