import { useState } from "react";
import { useTheme } from "./ThemeProvider";
import { Search, Volume2, ChevronDown, BookOpen, X, ChevronLeft, ChevronRight } from "lucide-react";
import type { VocabularyWord } from "@/data/hsk1Vocabulary";

interface VocabularyListProps {
  words: VocabularyWord[];
  title: string;
  onClose?: () => void;
}

const WORDS_PER_PAGE = 20;

function HighlightedSentence({ 
  sentence, 
  highlight, 
  isDark 
}: { 
  sentence: string; 
  highlight: string; 
  isDark: boolean;
}) {
  const parts = sentence.split(new RegExp(`(${highlight})`, 'gi'));
  
  return (
    <span>
      {parts.map((part, index) => 
        part.toLowerCase() === highlight.toLowerCase() ? (
          <span
            key={index}
            className={`font-bold ${
              isDark 
                ? "text-amber-400 bg-amber-500/20 px-1 rounded" 
                : "text-amber-600 bg-amber-100 px-1 rounded"
            }`}
          >
            {part}
          </span>
        ) : (
          <span key={index}>{part}</span>
        )
      )}
    </span>
  );
}

export function VocabularyList({ words, title, onClose }: VocabularyListProps) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedWord, setExpandedWord] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const filteredWords = words.filter(
    (word) =>
      word.chinese.includes(searchTerm) ||
      word.pinyin.toLowerCase().includes(searchTerm.toLowerCase()) ||
      word.english.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredWords.length / WORDS_PER_PAGE);
  const startIndex = (currentPage - 1) * WORDS_PER_PAGE;
  const endIndex = startIndex + WORDS_PER_PAGE;
  const currentWords = filteredWords.slice(startIndex, endIndex);

  const toggleExpand = (id: number) => {
    setExpandedWord(expandedWord === id ? null : id);
  };

  const speakWord = (text: string) => {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
    }
    setTimeout(() => {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "zh-CN";
      utterance.rate = 0.8;
      speechSynthesis.speak(utterance);
    }, 100);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    setExpandedWord(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const renderPagination = () => {
    if (totalPages <= 1) return null;

    const pages = [];
    const maxVisiblePages = 7;
    
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return (
      <div className={`flex items-center justify-center gap-2 mt-8 pt-6 border-t ${isDark ? "border-white/10" : "border-slate-200"}`}>
        <button
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className={`p-2 rounded-lg transition-all ${
            currentPage === 1
              ? "opacity-50 cursor-not-allowed"
              : isDark
                ? "hover:bg-white/10 text-white"
                : "hover:bg-slate-100 text-slate-900"
          }`}
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        {startPage > 1 && (
          <>
            <button
              onClick={() => handlePageChange(1)}
              className={`w-10 h-10 rounded-lg font-medium transition-all ${
                isDark
                  ? "hover:bg-white/10 text-white"
                  : "hover:bg-slate-100 text-slate-900"
              }`}
            >
              1
            </button>
            {startPage > 2 && (
              <span className={`px-2 ${isDark ? "text-white/40" : "text-slate-400"}`}>...</span>
            )}
          </>
        )}

        {pages.map((page) => (
          <button
            key={page}
            onClick={() => handlePageChange(page)}
            className={`w-10 h-10 rounded-lg font-medium transition-all ${
              page === currentPage
                ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-white"
                : isDark
                  ? "hover:bg-white/10 text-white"
                  : "hover:bg-slate-100 text-slate-900"
            }`}
          >
            {page}
          </button>
        ))}

        {endPage < totalPages && (
          <>
            {endPage < totalPages - 1 && (
              <span className={`px-2 ${isDark ? "text-white/40" : "text-slate-400"}`}>...</span>
            )}
            <button
              onClick={() => handlePageChange(totalPages)}
              className={`w-10 h-10 rounded-lg font-medium transition-all ${
                isDark
                  ? "hover:bg-white/10 text-white"
                  : "hover:bg-slate-100 text-slate-900"
              }`}
            >
              {totalPages}
            </button>
          </>
        )}

        <button
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className={`p-2 rounded-lg transition-all ${
            currentPage === totalPages
              ? "opacity-50 cursor-not-allowed"
              : isDark
                ? "hover:bg-white/10 text-white"
                : "hover:bg-slate-100 text-slate-900"
          }`}
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    );
  };

  const getPartOfSpeechColor = (pos: string) => {
    const colors: Record<string, string> = {
      verb: "bg-blue-500/20 text-blue-300 border-blue-500/30",
      noun: "bg-green-500/20 text-green-300 border-green-500/30",
      adjective: "bg-purple-500/20 text-purple-300 border-purple-500/30",
      pronoun: "bg-amber-500/20 text-amber-300 border-amber-500/30",
      number: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
      adverb: "bg-rose-500/20 text-rose-300 border-rose-500/30",
      particle: "bg-slate-500/20 text-slate-300 border-slate-500/30",
      phrase: "bg-teal-500/20 text-teal-300 border-teal-500/30",
      "measure word": "bg-indigo-500/20 text-indigo-300 border-indigo-500/30",
      preposition: "bg-orange-500/20 text-orange-300 border-orange-500/30",
      conjunction: "bg-pink-500/20 text-pink-300 border-pink-500/30",
      "proper noun": "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
      "verb phrase": "bg-violet-500/20 text-violet-300 border-violet-500/30",
      interjection: "bg-red-500/20 text-red-300 border-red-500/30",
    };
    return colors[pos] || "bg-slate-500/20 text-slate-300 border-slate-500/30";
  };

  const getNumberStyle = (id: number, isDark: boolean) => {
    const gradients = [
      { from: "from-rose-500", to: "to-pink-600", bg: "bg-rose-500/20", text: "text-rose-300" },
      { from: "from-orange-500", to: "to-amber-600", bg: "bg-orange-500/20", text: "text-orange-300" },
      { from: "from-amber-500", to: "to-yellow-600", bg: "bg-amber-500/20", text: "text-amber-300" },
      { from: "from-lime-500", to: "to-green-600", bg: "bg-lime-500/20", text: "text-lime-300" },
      { from: "from-emerald-500", to: "to-teal-600", bg: "bg-emerald-500/20", text: "text-emerald-300" },
      { from: "from-cyan-500", to: "to-sky-600", bg: "bg-cyan-500/20", text: "text-cyan-300" },
      { from: "from-blue-500", to: "to-indigo-600", bg: "bg-blue-500/20", text: "text-blue-300" },
      { from: "from-violet-500", to: "to-purple-600", bg: "bg-violet-500/20", text: "text-violet-300" },
      { from: "from-fuchsia-500", to: "to-pink-600", bg: "bg-fuchsia-500/20", text: "text-fuchsia-300" },
      { from: "from-pink-500", to: "to-rose-600", bg: "bg-pink-500/20", text: "text-pink-300" },
    ];
    const index = (id - 1) % gradients.length;
    const gradient = gradients[index];
    
    if (isDark) {
      return {
        container: `${gradient.bg} ${gradient.text}`,
        number: id
      };
    }
    return {
      container: `bg-gradient-to-br ${gradient.from} ${gradient.to} text-white`,
      number: id
    };
  };

  return (
    <div className="w-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600">
            <BookOpen className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className={`text-2xl font-bold ${isDark ? "text-white" : "text-slate-900"}`}>
              {title}
            </h2>
            <p className={`text-sm ${isDark ? "text-white/60" : "text-slate-500"}`}>
              {filteredWords.length} words
              {searchTerm && ` matching "${searchTerm}"`}
            </p>
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all ${
              isDark
                ? "bg-white/10 hover:bg-white/20 text-white"
                : "bg-slate-100 hover:bg-slate-200 text-slate-900"
            }`}
          >
            <X className="w-4 h-4" />
            <span>Close</span>
          </button>
        )}
      </div>

      <div className="relative mb-6">
        <Search
          className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 ${
            isDark ? "text-white/40" : "text-slate-400"
          }`}
        />
        <input
          type="text"
          placeholder="Search by Chinese, Pinyin, or English..."
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setCurrentPage(1);
          }}
          className={`w-full pl-12 pr-4 py-3 rounded-xl text-base transition-all ${
            isDark
              ? "bg-white/5 border-white/10 text-white placeholder:text-white/40 focus:border-emerald-500/50"
              : "bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-emerald-500"
          } border focus:outline-none focus:ring-2 focus:ring-emerald-500/20`}
        />
        {searchTerm && (
          <button
            onClick={() => setSearchTerm("")}
            className={`absolute right-4 top-1/2 -translate-y-1/2 p-1 rounded-full ${
              isDark
                ? "text-white/40 hover:text-white/70 hover:bg-white/10"
                : "text-slate-400 hover:text-slate-600 hover:bg-slate-100"
            }`}
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="grid gap-3">
        {currentWords.map((word) => (
          <div
            key={word.id}
            className={`rounded-xl overflow-hidden transition-all duration-300 ${
              isDark
                ? "bg-white/5 border-white/10 hover:bg-white/10"
                : "bg-white border-slate-200 hover:shadow-lg"
            } border`}
          >
            <div
              className="p-4 cursor-pointer"
              onClick={() => toggleExpand(word.id)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1">
                  <div
                    className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm ${getNumberStyle(word.id, isDark).container}`}
                  >
                    {getNumberStyle(word.id, isDark).number}
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      speakWord(word.chinese);
                    }}
                    className={`p-2 rounded-lg transition-all flex-shrink-0 ${
                      isDark
                        ? "bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400"
                        : "bg-emerald-100 hover:bg-emerald-200 text-emerald-600"
                    }`}
                    title="Listen to pronunciation"
                  >
                    <Volume2 className="w-5 h-5" />
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span
                        className={`text-2xl font-bold ${
                          isDark ? "text-white" : "text-slate-900"
                        }`}
                      >
                        {word.chinese}
                      </span>
                      <span
                        className={`text-lg ${
                          isDark ? "text-emerald-400" : "text-emerald-600"
                        }`}
                      >
                        {word.pinyin}
                      </span>
                      <span
                        className={`px-2 py-0.5 text-xs font-medium rounded-full border ${
                          isDark
                            ? getPartOfSpeechColor(word.partOfSpeech)
                            : "bg-slate-100 text-slate-600 border-slate-200"
                        }`}
                      >
                        {word.partOfSpeech}
                      </span>
                    </div>
                    <p
                      className={`text-base mt-1 ${
                        isDark ? "text-white/70" : "text-slate-600"
                      }`}
                    >
                      {word.english}
                    </p>
                  </div>
                </div>
                <div
                  className={`transition-transform duration-300 flex-shrink-0 ${
                    expandedWord === word.id ? "rotate-180" : ""
                  }`}
                >
                  <ChevronDown
                    className={`w-5 h-5 ${
                      isDark ? "text-white/40" : "text-slate-400"
                    }`}
                  />
                </div>
              </div>
            </div>

            {expandedWord === word.id && (
              <div
                className={`px-4 pb-4 pt-0 border-t ${
                  isDark ? "border-white/10" : "border-slate-100"
                }`}
              >
                <div className="mt-4 space-y-3">
                  {word.exampleSentence && (
                    <div>
                      <p
                        className={`text-xs font-semibold uppercase tracking-wider mb-1 ${
                          isDark ? "text-emerald-400" : "text-emerald-600"
                        }`}
                      >
                        Example Sentence
                      </p>
                      <p
                        className={`text-base ${
                          isDark ? "text-white" : "text-slate-900"
                        }`}
                      >
                        <HighlightedSentence 
                          sentence={word.exampleSentence} 
                          highlight={word.chinese} 
                          isDark={isDark}
                        />
                      </p>
                      {word.examplePinyin && (
                        <p
                          className={`text-sm mt-1 ${
                            isDark ? "text-emerald-400/70" : "text-emerald-600"
                          }`}
                        >
                          {word.examplePinyin}
                        </p>
                      )}
                      <p
                        className={`text-sm ${
                          isDark ? "text-white/60" : "text-slate-500"
                        }`}
                      >
                        {word.exampleTranslation}
                      </p>
                    </div>
                  )}

                  {word.notes && (
                    <div>
                      <p
                        className={`text-xs font-semibold uppercase tracking-wider mb-1 ${
                          isDark ? "text-amber-400" : "text-amber-600"
                        }`}
                      >
                        Notes
                      </p>
                      <p
                        className={`text-sm ${
                          isDark ? "text-white/70" : "text-slate-600"
                        }`}
                      >
                        {word.notes}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {filteredWords.length === 0 && (
        <div
          className={`text-center py-12 ${
            isDark ? "text-white/50" : "text-slate-500"
          }`}
        >
          <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p className="text-lg">No words found matching "{searchTerm}"</p>
          <button
            onClick={() => setSearchTerm("")}
            className="mt-4 text-emerald-500 hover:text-emerald-400 font-medium"
          >
            Clear search
          </button>
        </div>
      )}

      {renderPagination()}
    </div>
  );
}
