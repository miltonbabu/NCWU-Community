import { useState } from "react";
import type { FilterState } from "@/types/schedule";
import { DAYS, SHIFTS } from "@/types/schedule";
import { Filter, X, Calendar, Clock, ChevronDown, Search, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { useTheme } from "./ThemeProvider";
import { Input } from "@/components/ui/input";

interface FilterBarProps {
  filters: FilterState;
  onFilterChange: (filters: FilterState) => void;
  totalWeeks: number;
  totalClasses?: number;
  filteredCount?: number;
}

export function FilterBar({
  filters,
  onFilterChange,
  totalWeeks,
  totalClasses,
  filteredCount,
}: FilterBarProps) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const [searchInput, setSearchInput] = useState(filters.search);

  const activeFiltersCount = [
    filters.search,
    filters.week !== "all",
    filters.shift !== "all",
    filters.day !== "all",
  ].filter(Boolean).length;

  const clearFilters = () => {
    setSearchInput("");
    onFilterChange({
      search: "",
      week: "all",
      shift: "all",
      day: "all",
    });
  };

  const handleSearch = () => {
    onFilterChange({ ...filters, search: searchInput });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const hasActiveFilters = activeFiltersCount > 0;

  return (
    <div
      className={`relative overflow-hidden backdrop-blur-xl ${isDark ? "bg-slate-800/80 border-slate-700" : "bg-white border-slate-200 shadow-sm"} rounded-2xl border shadow-xl transition-all duration-300 hover:shadow-2xl`}
    >
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-indigo-500/20 to-transparent rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-purple-500/20 to-transparent rounded-full blur-2xl translate-y-1/2 -translate-x-1/2" />
      
      <div className="relative p-2 sm:p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <div className={`p-1.5 rounded-lg ${isDark ? "bg-indigo-500/20" : "bg-indigo-100"}`}>
              <Filter
                className={`w-4 h-4 ${isDark ? "text-indigo-400" : "text-indigo-600"}`}
              />
            </div>
            <span
              className={`text-sm font-semibold ${isDark ? "text-white" : "text-slate-900"}`}
            >
              Filters
            </span>
            {activeFiltersCount > 0 && (
              <span className="ml-1 px-1.5 py-0.5 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 text-xs font-medium text-white">
                {activeFiltersCount}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {totalClasses !== undefined && filteredCount !== undefined && hasActiveFilters && (
            <span className={`text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}>
              {filteredCount} of {totalClasses} classes
            </span>
          )}
          {hasActiveFilters && (
            <Button
              variant="ghost"
              onClick={clearFilters}
              className={`text-xs transition-all duration-200 hover:scale-[1.02] ${isDark ? "text-white/70 hover:text-white hover:bg-white/10" : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"} rounded-lg h-7 px-2`}
            >
              <X className="w-3 h-3 mr-1" />
              Clear All
            </Button>
          )}
        </div>
      </div>

      <div
        className={`relative px-2 sm:px-3 pb-2 sm:pb-3 border-t ${isDark ? "border-white/10" : "border-slate-200"} pt-2 sm:pt-3`}
      >
        <div className="space-y-2">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Input
                type="text"
                placeholder="Search by class name, teacher, room, or day..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={handleKeyDown}
                className={`h-9 pr-10 rounded-lg text-sm backdrop-blur-md transition-all duration-200 focus:scale-[1.01] ${isDark ? "bg-white/5 border-white/10 text-white placeholder:text-slate-400" : "bg-white/80 border-slate-200 text-slate-900 placeholder:text-slate-400"}`}
              />
              {searchInput && (
                <button
                  onClick={() => {
                    setSearchInput("");
                    onFilterChange({ ...filters, search: "" });
                  }}
                  className={`absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-md transition-colors ${isDark ? "hover:bg-white/10 text-slate-400" : "hover:bg-slate-100 text-slate-400"}`}
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
            <Button
              onClick={handleSearch}
              className={`h-9 px-4 rounded-lg font-medium text-sm transition-all duration-200 hover:scale-[1.02] hover:shadow-lg ${isDark ? "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white" : "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white"}`}
            >
              <Search className="w-4 h-4 mr-1.5" />
              Search
            </Button>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className="space-y-1">
              <label
                className={`flex items-center gap-1 text-xs font-medium ${isDark ? "text-slate-300" : "text-slate-700"}`}
              >
                <Calendar className="w-3 h-3" />
                Week
              </label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={`h-8 w-full justify-between rounded-lg text-xs font-normal backdrop-blur-md transition-all duration-200 hover:scale-[1.01] ${isDark ? "bg-white/5 border-white/10 text-white hover:bg-white/10" : "bg-white/80 border-slate-200 text-slate-900 hover:bg-slate-50"}`}
                  >
                    {filters.week === "all"
                      ? "All Weeks"
                      : `Week ${filters.week}`}
                    <ChevronDown className="w-3 h-3 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  className={`w-56 p-1.5 backdrop-blur-xl ${isDark ? "bg-slate-900/95 border-white/10" : "bg-white/95 border-slate-200"}`}
                  align="start"
                >
                  <div className="grid grid-cols-2 gap-1">
                    <button
                      onClick={() => onFilterChange({ ...filters, week: "all" })}
                      className={`px-2 py-1 text-xs text-left rounded-md transition-all duration-200 ${filters.week === "all" ? "bg-gradient-to-r from-indigo-500 to-purple-500 text-white" : isDark ? "hover:bg-white/10 text-white" : "hover:bg-slate-100 text-slate-900"}`}
                    >
                      All Weeks
                    </button>
                    {Array.from({ length: totalWeeks }, (_, i) => i + 1).map(
                      (week) => (
                        <button
                          key={week}
                          onClick={() => onFilterChange({ ...filters, week })}
                          className={`px-2 py-1 text-xs text-left rounded-md transition-all duration-200 ${filters.week === week ? "bg-gradient-to-r from-indigo-500 to-purple-500 text-white" : isDark ? "hover:bg-white/10 text-white" : "hover:bg-slate-100 text-slate-900"}`}
                        >
                          Week {week}
                        </button>
                      ),
                    )}
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-1">
              <label
                className={`flex items-center gap-1 text-xs font-medium ${isDark ? "text-slate-300" : "text-slate-700"}`}
              >
                <Clock className="w-3 h-3" />
                Shift
              </label>
              <Select
                value={filters.shift}
                onValueChange={(value) =>
                  onFilterChange({
                    ...filters,
                    shift: value as FilterState["shift"],
                  })
                }
              >
                <SelectTrigger
                  className={`h-8 rounded-lg text-xs backdrop-blur-md transition-all duration-200 ${isDark ? "bg-white/5 border-white/10 text-white" : "bg-white/80 border-slate-200 text-slate-900"}`}
                >
                  <SelectValue placeholder="All Shifts" />
                </SelectTrigger>
                <SelectContent
                  className={`backdrop-blur-xl ${isDark ? "bg-slate-900/95 border-white/10" : "bg-white/95 border-slate-200"}`}
                >
                  <SelectItem value="all">All Shifts</SelectItem>
                  {SHIFTS.map((shift) => (
                    <SelectItem key={shift} value={shift}>
                      {shift}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <label
                className={`flex items-center gap-1 text-xs font-medium ${isDark ? "text-slate-300" : "text-slate-700"}`}
              >
                <Calendar className="w-3 h-3" />
                Day
              </label>
              <Select
                value={filters.day}
                onValueChange={(value) =>
                  onFilterChange({
                    ...filters,
                    day: value as FilterState["day"],
                  })
                }
              >
                <SelectTrigger
                  className={`h-8 rounded-lg text-xs backdrop-blur-md transition-all duration-200 ${isDark ? "bg-white/5 border-white/10 text-white" : "bg-white/80 border-slate-200 text-slate-900"}`}
                >
                  <SelectValue placeholder="All Days" />
                </SelectTrigger>
                <SelectContent
                  className={`backdrop-blur-xl ${isDark ? "bg-slate-900/95 border-white/10" : "bg-white/95 border-slate-200"}`}
                >
                  <SelectItem value="all">All Days</SelectItem>
                  {DAYS.map((day) => (
                    <SelectItem key={day} value={day}>
                      {day}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>

      {hasActiveFilters && (
        <div className="relative px-2 sm:px-3 pb-2 sm:pb-3 flex flex-wrap gap-1">
          {filters.search && (
            <Badge
              className={`flex items-center gap-1 px-2 py-0.5 text-xs transition-all duration-200 hover:scale-[1.02] ${isDark ? "bg-indigo-600/30 text-indigo-300 border-indigo-500/30" : "bg-indigo-100 text-indigo-700 border-indigo-200"} border rounded-md backdrop-blur-md`}
            >
              <Sparkles className="w-3 h-3" />
              "{filters.search}"
              <button
                onClick={() => {
                  setSearchInput("");
                  onFilterChange({ ...filters, search: "" });
                }}
                className="ml-0.5 hover:opacity-70"
              >
                <X className="w-3 h-3" />
              </button>
            </Badge>
          )}
          {filters.week !== "all" && (
            <Badge
              className={`flex items-center gap-1 px-2 py-0.5 text-xs transition-all duration-200 hover:scale-[1.02] ${isDark ? "bg-slate-800/80 text-white border-white/10" : "bg-slate-100 text-slate-900 border-slate-200"} border rounded-md backdrop-blur-md`}
            >
              Week {filters.week}
              <button
                onClick={() => onFilterChange({ ...filters, week: "all" })}
                className="ml-0.5 hover:opacity-70"
              >
                <X className="w-3 h-3" />
              </button>
            </Badge>
          )}
          {filters.shift !== "all" && (
            <Badge
              className={`flex items-center gap-1 px-2 py-0.5 text-xs transition-all duration-200 hover:scale-[1.02] ${isDark ? "bg-slate-800/80 text-white border-white/10" : "bg-slate-100 text-slate-900 border-slate-200"} border rounded-md backdrop-blur-md`}
            >
              {filters.shift}
              <button
                onClick={() => onFilterChange({ ...filters, shift: "all" })}
                className="ml-0.5 hover:opacity-70"
              >
                <X className="w-3 h-3" />
              </button>
            </Badge>
          )}
          {filters.day !== "all" && (
            <Badge
              className={`flex items-center gap-1 px-2 py-0.5 text-xs transition-all duration-200 hover:scale-[1.02] ${isDark ? "bg-slate-800/80 text-white border-white/10" : "bg-slate-100 text-slate-900 border-slate-200"} border rounded-md backdrop-blur-md`}
            >
              {filters.day}
              <button
                onClick={() => onFilterChange({ ...filters, day: "all" })}
                className="ml-0.5 hover:opacity-70"
              >
                <X className="w-3 h-3" />
              </button>
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}
