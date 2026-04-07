import { useState, useEffect } from "react";
import { Search, BookOpen, ChevronRight, X } from "lucide-react";
import type { HSKLevel, HSKGrammarSentence } from "@/types/hsk";
import { hskGrammarApi } from "@/lib/api";

interface GrammarPatternExplorerProps {
  isDark: boolean;
  level: HSKLevel;
}

export default function GrammarPatternExplorer({
  isDark,
  level,
}: GrammarPatternExplorerProps) {
  const [patterns, setPatterns] = useState<
    Record<string, HSKGrammarSentence[]>
  >({});
  const [selectedPattern, setSelectedPattern] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [expandedExamples, setExpandedExamples] = useState<number[]>([]);

  useEffect(() => {
    loadPatterns();
  }, [level]);

  const loadPatterns = async () => {
    try {
      setLoading(true);
      const response = await hskGrammarApi.getGrammarByLevel(level, 1, 500);

      if (!response.success || !response.data) return;

      const sentences = response.data.sentences;
      const patternMap: Record<string, HSKGrammarSentence[]> = {};

      sentences.forEach((sentence) => {
        const pattern = sentence.grammarPattern || "Other";
        if (!patternMap[pattern]) {
          patternMap[pattern] = [];
        }
        patternMap[pattern].push(sentence);
      });

      setPatterns(patternMap);
    } catch (error) {
      console.error("Error loading patterns:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredPatterns = Object.entries(patterns)
    .filter(([pattern]) =>
      pattern.toLowerCase().includes(searchQuery.toLowerCase()),
    )
    .sort((a, b) => b[1].length - a[1].length);

  const toggleExample = (idx: number) => {
    setExpandedExamples((prev) =>
      prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx],
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-500/20 border-t-indigo-500"></div>
      </div>
    );
  }

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
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Search */}
      <div
        className={`backdrop-blur-xl rounded-2xl p-4 ${isDark ? "bg-white/5 border border-white/10" : "bg-white/50 border border-black/5"}`}
      >
        <div className="relative">
          <Search
            className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 ${isDark ? "text-white/40" : "text-slate-400"}`}
          />
          <input
            type="text"
            placeholder="Search grammar patterns..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`w-full pl-12 pr-12 py-3 rounded-xl text-sm border ${
              isDark
                ? "bg-white/5 border-white/10 text-white placeholder-white/40"
                : "bg-white/50 border-black/5 text-slate-900 placeholder-slate-400"
            } focus:outline-none focus:ring-2 focus:ring-indigo-500/20`}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className={`absolute right-4 top-1/2 -translate-y-1/2 p-1 rounded-lg ${
                isDark
                  ? "hover:bg-white/10 text-white/40"
                  : "hover:bg-black/5 text-slate-400"
              }`}
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <p
          className={`text-xs mt-2 ${isDark ? "text-white/40" : "text-slate-400"}`}
        >
          {filteredPatterns.length} pattern
          {filteredPatterns.length !== 1 ? "s" : ""} found
        </p>
      </div>

      {/* Selected Pattern Detail */}
      {selectedPattern && (
        <div
          className={`backdrop-blur-2xl rounded-3xl p-6 md:p-8 ${isDark ? "bg-white/5 border border-white/10" : "bg-white/70 border border-black/5"} shadow-xl`}
        >
          <div className="flex items-start justify-between mb-6">
            <div>
              <h3
                className={`text-2xl font-bold mb-2 ${isDark ? "text-white" : "text-slate-900"}`}
              >
                {selectedPattern}
              </h3>
              <p
                className={`text-sm ${isDark ? "text-white/60" : "text-slate-500"}`}
              >
                {patterns[selectedPattern]?.length || 0} examples
              </p>
            </div>
            <button
              onClick={() => setSelectedPattern(null)}
              className={`p-2 rounded-xl transition-all ${
                isDark
                  ? "hover:bg-white/10 text-white/60"
                  : "hover:bg-black/5 text-slate-600"
              }`}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-3">
            {patterns[selectedPattern]?.slice(0, 10).map((sentence, idx) => {
              const isExpanded = expandedExamples.includes(idx);

              return (
                <div
                  key={idx}
                  className={`p-4 rounded-xl transition-all cursor-pointer ${
                    isDark
                      ? "bg-white/5 hover:bg-white/10"
                      : "bg-black/5 hover:bg-black/10"
                  } ${isExpanded ? "ring-2 ring-indigo-500/20" : ""}`}
                  onClick={() => toggleExample(idx)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p
                        className={`text-xl font-semibold mb-1 ${isDark ? "text-white" : "text-slate-900"}`}
                      >
                        {sentence.sentenceClean}
                      </p>
                      <p
                        className={`text-sm ${isDark ? "text-indigo-400" : "text-indigo-600"}`}
                      >
                        {sentence.pinyin}
                      </p>
                      {isExpanded && (
                        <div className="mt-3 pt-3 border-t border-white/10 space-y-2">
                          <p
                            className={`text-base ${isDark ? "text-slate-300" : "text-slate-700"}`}
                          >
                            {sentence.english}
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {sentence.tags.slice(0, 3).map((tag, tagIdx) => (
                              <span
                                key={tagIdx}
                                className={`px-2 py-1 rounded-lg text-xs backdrop-blur-sm ${
                                  isDark
                                    ? "bg-indigo-500/20 text-indigo-300"
                                    : "bg-indigo-100 text-indigo-700"
                                }`}
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    <ChevronRight
                      className={`w-5 h-5 mt-1 transition-transform ${isExpanded ? "rotate-90" : ""} ${
                        isDark ? "text-white/40" : "text-slate-400"
                      }`}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {(patterns[selectedPattern]?.length || 0) > 10 && (
            <p
              className={`text-center text-sm mt-4 ${isDark ? "text-white/40" : "text-slate-400"}`}
            >
              Showing 10 of {patterns[selectedPattern]?.length} examples
            </p>
          )}
        </div>
      )}

      {/* Pattern Grid */}
      {!selectedPattern && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredPatterns.map(([pattern, sentences], index) => {
            const cardColors = [
              {
                bg: "from-emerald-500/10 to-teal-500/5",
                bgLight: "from-emerald-50 to-teal-50",
                accent: "bg-emerald-500/20 text-emerald-400",
                accentLight: "bg-emerald-500 text-white",
                border: "border-emerald-500/20",
                borderLight: "border-emerald-200",
                textAccent: "text-emerald-600",
              },
              {
                bg: "from-blue-500/10 to-cyan-500/5",
                bgLight: "from-blue-50 to-cyan-50",
                accent: "bg-blue-500/20 text-blue-400",
                accentLight: "bg-blue-500 text-white",
                border: "border-blue-500/20",
                borderLight: "border-blue-200",
                textAccent: "text-blue-600",
              },
              {
                bg: "from-violet-500/10 to-purple-500/5",
                bgLight: "from-violet-50 to-purple-50",
                accent: "bg-violet-500/20 text-violet-400",
                accentLight: "bg-violet-500 text-white",
                border: "border-violet-500/20",
                borderLight: "border-violet-200",
                textAccent: "text-violet-600",
              },
              {
                bg: "from-amber-500/10 to-orange-500/5",
                bgLight: "from-amber-50 to-orange-50",
                accent: "bg-amber-500/20 text-amber-400",
                accentLight: "bg-amber-500 text-white",
                border: "border-amber-500/20",
                borderLight: "border-amber-200",
                textAccent: "text-amber-600",
              },
              {
                bg: "from-rose-500/10 to-pink-500/5",
                bgLight: "from-rose-50 to-pink-50",
                accent: "bg-rose-500/20 text-rose-400",
                accentLight: "bg-rose-500 text-white",
                border: "border-rose-500/20",
                borderLight: "border-rose-200",
                textAccent: "text-rose-600",
              },
              {
                bg: "from-indigo-500/10 to-blue-500/5",
                bgLight: "from-indigo-50 to-blue-50",
                accent: "bg-indigo-500/20 text-indigo-400",
                accentLight: "bg-indigo-500 text-white",
                border: "border-indigo-500/20",
                borderLight: "border-indigo-200",
                textAccent: "text-indigo-600",
              },
            ];
            const color = cardColors[index % cardColors.length];

            return (
              <button
                key={pattern}
                onClick={() => setSelectedPattern(pattern)}
                className={`group relative p-5 md:p-6 rounded-2xl text-left transition-all duration-300 backdrop-blur-xl hover:scale-[1.02] overflow-hidden ${
                  isDark
                    ? `bg-gradient-to-br ${color.bg} border ${color.border} hover:border-white/30`
                    : `bg-gradient-to-br ${color.bgLight} border ${color.borderLight} hover:shadow-lg`
                }`}
              >
                <div
                  className={`absolute top-0 right-0 w-20 h-20 bg-gradient-to-br ${isDark ? color.bg : color.bgLight} rounded-bl-full blur-xl opacity-50`}
                />

                <div className="relative z-10">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <span
                        className={`flex items-center justify-center w-7 h-7 rounded-lg text-xs font-bold ${isDark ? color.accent : color.accentLight}`}
                      >
                        {index + 1}
                      </span>
                      <div className="flex-1">
                        <h3
                          className={`font-semibold mb-1 line-clamp-2 ${isDark ? "text-white" : "text-slate-800"}`}
                        >
                          {pattern}
                        </h3>
                        <p
                          className={`text-xs ${isDark ? "text-white/40" : "text-slate-500"}`}
                        >
                          {sentences.length} example
                          {sentences.length !== 1 ? "s" : ""}
                        </p>
                      </div>
                    </div>
                    <ChevronRight
                      className={`w-5 h-5 transition-transform group-hover:translate-x-1 flex-shrink-0 ${isDark ? "text-white/40" : color.textAccent}`}
                    />
                  </div>

                  {sentences[0] && (
                    <div
                      className={`p-3 rounded-xl ${isDark ? "bg-white/5" : "bg-white/60"}`}
                    >
                      <p
                        className={`text-sm font-medium ${isDark ? "text-white/80" : "text-slate-700"}`}
                      >
                        {sentences[0].sentenceClean}
                      </p>
                      <p
                        className={`text-xs mt-1 ${isDark ? "text-white/40" : "text-slate-500"}`}
                      >
                        {sentences[0].english}
                      </p>
                    </div>
                  )}

                  {sentences.length > 1 && (
                    <div
                      className={`mt-3 flex items-center gap-2 text-xs ${isDark ? "text-white/40" : "text-slate-400"}`}
                    >
                      <BookOpen className="w-3.5 h-3.5" />
                      <span>+{sentences.length - 1} more</span>
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Empty State */}
      {filteredPatterns.length === 0 && (
        <div className="text-center py-16">
          <BookOpen
            className={`w-16 h-16 mx-auto mb-4 ${isDark ? "text-slate-600" : "text-slate-300"}`}
          />
          <p
            className={`text-lg font-medium mb-2 ${isDark ? "text-white" : "text-slate-900"}`}
          >
            No patterns found
          </p>
          <p
            className={`text-sm ${isDark ? "text-white/40" : "text-slate-400"}`}
          >
            Try adjusting your search query
          </p>
        </div>
      )}
    </div>
  );
}
