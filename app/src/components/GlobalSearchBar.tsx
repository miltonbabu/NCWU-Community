import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "./ThemeProvider";
import { Search, X, ArrowRight } from "lucide-react";
import {
  searchIndex,
  searchCategories,
  type SearchResult,
} from "@/data/searchIndex";

function highlightMatch(text: string, query: string): React.ReactNode {
  if (!query) return text;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return text;
  const before = text.slice(0, idx);
  const match = text.slice(idx, idx + query.length);
  const after = text.slice(idx + query.length);
  return (
    <>
      {before}
      <mark className="bg-amber-400/40 text-amber-200 rounded px-0.5">
        {match}
      </mark>
      {after}
    </>
  );
}

function groupByCategory(
  results: SearchResult[],
): Map<string, SearchResult[]> {
  const grouped = new Map<string, SearchResult[]>();
  for (const r of results) {
    const existing = grouped.get(r.category);
    if (existing) existing.push(r);
    else grouped.set(r.category, [r]);
  }
  return grouped;
}

export function GlobalSearchBar() {
  const navigate = useNavigate();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  const [query, setQuery] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const filteredResults = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase().trim();
    return searchIndex.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q),
    );
  }, [query]);

  const groupedResults = useMemo(() => groupByCategory(filteredResults), [filteredResults]);

  const flatResults = useMemo(
    () => Array.from(groupedResults.values()).flat(),
    [groupedResults],
  );

  useEffect(() => {
    setSelectedIndex(-1);
  }, [filteredResults]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsFocused(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < flatResults.length - 1 ? prev + 1 : prev,
        );
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < flatResults.length) {
          navigate(flatResults[selectedIndex].path);
          setIsFocused(false);
          setQuery("");
          inputRef.current?.blur();
        }
      } else if (e.key === "Escape") {
        setIsFocused(false);
        inputRef.current?.blur();
      }
    },
    [flatResults, selectedIndex, navigate],
  );

  const showResults = isFocused && (query.trim().length >= 2 || !query.trim());

  const handleSelect = (result: SearchResult) => {
    navigate(result.path);
    setIsFocused(false);
    setQuery("");
    inputRef.current?.blur();
  };

  return (
    <div ref={containerRef} className="w-full max-w-2xl mx-auto relative z-30 mb-6 sm:mb-8">
      <div
        className={`relative flex items-center rounded-2xl transition-all duration-300 ${
          isFocused
            ? isDark
              ? "bg-white/15 border-white/50 shadow-lg shadow-white/10 ring-2 ring-white/20"
              : "bg-white/30 border-white/70 shadow-xl shadow-black/10 ring-2 ring-white/30"
            : isDark
              ? "bg-white/10 border-white/30 hover:bg-white/15 hover:border-white/40"
              : "bg-white/20 border-white/50 hover:bg-white/25 hover:border-white/60"
        } border backdrop-blur-xl`}
      >
        <Search className="absolute left-4 w-5 h-5 text-white/60 pointer-events-none flex-shrink-0" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onKeyDown={handleKeyDown}
          placeholder="Search entire website..."
          autoComplete="off"
          className="w-full pl-12 pr-12 py-3.5 bg-transparent text-white placeholder:text-white/45 text-sm sm:text-base outline-none rounded-2xl"
        />
        {query && (
          <button
            onClick={() => {
              setQuery("");
              inputRef.current?.focus();
            }}
            className="absolute right-3 p-1.5 rounded-full text-white/50 hover:text-white/90 hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {showResults && (
        <div
          className={`absolute top-full left-0 right-0 mt-2 rounded-2xl overflow-hidden transition-all duration-200 z-50 ${
            isDark
              ? "bg-slate-900/95 border border-white/10 shadow-2xl shadow-black/40 backdrop-blur-xl"
              : "bg-white/95 border border-white/20 shadow-2xl backdrop-blur-xl"
          }`}
          style={{ maxHeight: "420px" }}
        >
          <div className="overflow-y-auto" style={{ maxHeight: "420px" }}>
            {!query.trim() ? (
              <div className="p-4">
                <p
                  className={`text-xs font-semibold uppercase tracking-wider mb-3 ${
                    isDark ? "text-white/40" : "text-slate-400"
                  }`}
                >
                  Popular Searches
                </p>
                <div className="flex flex-wrap gap-2">
                  {searchCategories.map((cat) => {
                    const CatIcon = cat.icon;
                    return (
                      <button
                        key={cat.name}
                        onClick={() => {
                          setQuery(cat.name);
                          inputRef.current?.focus();
                        }}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 hover:scale-105 ${
                          isDark
                            ? "bg-white/10 text-white/70 hover:bg-white/20 hover:text-white border border-white/10"
                            : "bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900 border border-slate-200"
                        }`}
                      >
                        <CatIcon className="w-3.5 h-3.5" />
                        {cat.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : filteredResults.length > 0 ? (
              <div className="py-2">
                {Array.from(groupedResults.entries()).map(
                  ([category, items]) => {
                    const catInfo = searchCategories.find(
                      (c) => c.name === category,
                    );
                    const CatIcon = catInfo?.icon || Search;
                    return (
                      <div key={category}>
                        <div
                          className={`flex items-center gap-2 px-4 py-2 sticky top-0 ${
                            isDark
                              ? "bg-slate-900/95 text-white/40"
                              : "bg-white/95 text-slate-400"
                          }`}
                        >
                          <CatIcon className="w-3.5 h-3.5" />
                          <span className="text-[11px] font-bold uppercase tracking-wider">
                            {category}
                          </span>
                          <span
                            className={`ml-auto text-[10px] px-1.5 py-0.5 rounded-full ${
                              isDark
                                ? "bg-white/5 text-white/30"
                                : "bg-slate-100 text-slate-400"
                            }`}
                          >
                            {items.length}
                          </span>
                        </div>
                        {items.map((item) => {
                          const ItemIcon = item.icon;
                          const globalIdx = flatResults.indexOf(item);
                          const isSelected =
                            selectedIndex === globalIdx;
                          return (
                            <button
                              key={item.path}
                              onClick={() => handleSelect(item)}
                              onMouseEnter={() =>
                                setSelectedIndex(globalIdx)
                              }
                              className={`w-full text-left px-4 py-2.5 flex items-center gap-3 transition-colors duration-150 ${
                                isSelected
                                  ? isDark
                                    ? "bg-indigo-500/20 text-white"
                                    : "bg-indigo-50 text-slate-900"
                                  : isDark
                                    ? "hover:bg-white/5 text-white/80"
                                    : "hover:bg-slate-50 text-slate-700"
                              }`}
                            >
                              <div
                                className={`flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center ${
                                  isSelected
                                    ? isDark
                                      ? "bg-indigo-500/30"
                                      : "bg-indigo-100"
                                    : isDark
                                      ? "bg-white/10"
                                      : "bg-slate-100"
                                }`}
                              >
                                <ItemIcon
                                  className={`w-4.5 h-4.5 ${
                                    isSelected
                                      ? isDark
                                        ? "text-indigo-300"
                                        : "text-indigo-600"
                                      : isDark
                                        ? "text-white/60"
                                        : "text-slate-500"
                                  }`}
                                />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div
                                  className={`text-sm font-medium truncate ${
                                    isSelected
                                      ? ""
                                      : isDark
                                        ? "text-white/90"
                                        : "text-slate-800"
                                  }`}
                                >
                                  {highlightMatch(item.title, query)}
                                </div>
                                <div
                                  className={`text-xs truncate mt-0.5 ${
                                    isSelected
                                      ? isDark
                                        ? "text-indigo-200/70"
                                        : "text-indigo-500/70"
                                      : isDark
                                        ? "text-white/40"
                                        : "text-slate-400"
                                  }`}
                                >
                                  {highlightMatch(
                                    item.description,
                                    query,
                                  )}
                                </div>
                              </div>
                              <ArrowRight
                                className={`w-4 h-4 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity ${
                                  isSelected
                                    ? isDark
                                      ? "text-indigo-300 opacity-100"
                                      : "text-indigo-600 opacity-100"
                                    : isDark
                                      ? "text-white/20"
                                      : "text-slate-300"
                                }`}
                              />
                            </button>
                          );
                        })}
                      </div>
                    );
                  },
                )}
              </div>
            ) : (
              <div className="p-8 text-center">
                <Search
                  className={`w-8 h-8 mx-auto mb-3 ${
                    isDark ? "text-white/20" : "text-slate-300"
                  }`}
                />
                <p
                  className={`text-sm font-medium ${
                    isDark ? "text-white/50" : "text-slate-500"
                  }`}
                >
                  No results found for &ldquo;{query}&rdquo;
                </p>
                <p
                  className={`text-xs mt-1 ${
                    isDark ? "text-white/30" : "text-slate-400"
                  }`}
                >
                  Try searching with different keywords
                </p>
              </div>
            )}
          </div>

          {query.trim() && filteredResults.length > 0 && (
            <div
              className={`px-4 py-2.5 border-t flex items-center justify-between ${
                isDark
                  ? "border-white/5 bg-white/[0.02]"
                  : "border-slate-100 bg-slate-50/50"
              }`}
            >
              <span
                className={`text-xs ${
                  isDark ? "text-white/30" : "text-slate-400"
                }`}
              >
                {filteredResults.length} result{filteredResults.length !== 1 ? "s" : ""} found
              </span>
              <button
                onClick={() => {
                  setIsFocused(false);
                  inputRef.current?.blur();
                }}
                className={`text-xs font-medium px-3 py-1 rounded-full transition-colors ${
                  isDark
                    ? "text-white/50 hover:text-white/80 hover:bg-white/10"
                    : "text-slate-500 hover:text-slate-800 hover:bg-slate-100"
                }`}
              >
                Close
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
