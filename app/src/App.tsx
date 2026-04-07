import React, { useState } from "react";
import type { FilterState } from "@/types/schedule";
import { scheduleData, totalWeeks } from "@/data/scheduleData";
import { FilterBar } from "@/components/FilterBar";
import { ScheduleGrid } from "@/components/ScheduleGrid";
import { SubjectsSection } from "@/components/SubjectsSection";
import { ShareDialog } from "@/components/ShareDialog";
import { SharedClassPopup } from "@/components/SharedClassPopup";
import { ThemeProvider, useTheme } from "@/components/ThemeProvider";
import { ThemeToggle } from "@/components/ThemeToggle";
import { TodaySchedule } from "@/components/TodaySchedule";
import { SEO, pageSEO } from "@/components/SEO";
import { Calendar, BookOpen, Menu, Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Toaster } from "sonner";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import type { ClassSession } from "@/types/schedule";
import ncwuLogo from "@/assets/ncwu-logo.png";

function AppContent() {
  const [filters, setFilters] = useState<FilterState>({
    search: "",
    week: "all",
    shift: "all",
    day: "all",
  });
  const [showSubjects, setShowSubjects] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [selectedClassForShare, setSelectedClassForShare] =
    useState<ClassSession | null>(null);

  const sharedClassData = React.useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    const classId = params.get("class");
    if (classId) {
      return scheduleData.find((c) => c.id === classId) || null;
    }
    return null;
  }, []);

  const [sharedClass] = useState<ClassSession | null>(sharedClassData);
  const [sharedClassPopupOpen, setSharedClassPopupOpen] = useState(
    () => !!sharedClassData,
  );

  const breadcrumbs = [
    { name: "Home", url: "https://ncwu-community.com/" },
    { name: "CST Department", url: "https://ncwu-community.com/cst" },
    { name: "Class Schedule", url: "https://ncwu-community.com/cst/schedule" },
  ];

  const handleSubjectClick = (subject: string) => {
    setFilters({ ...filters, search: subject });
    setShowSubjects(false);
  };

  const uniqueSubjects = React.useMemo(() => {
    const subjects = new Set<string>();
    scheduleData.forEach((cls) => {
      if (cls.subject) subjects.add(cls.subject);
    });
    return Array.from(subjects);
  }, []);

  const filteredClasses = React.useMemo(() => {
    return scheduleData.filter((cls) => {
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const matchesSearch =
          cls.subject?.toLowerCase().includes(searchLower) ||
          cls.teacher?.toLowerCase().includes(searchLower) ||
          cls.room?.toLowerCase().includes(searchLower);
        if (!matchesSearch) return false;
      }
      if (filters.day && cls.day !== filters.day) return false;
      return true;
    });
  }, [filters]);

  const handleShare = (classSession: ClassSession) => {
    setSelectedClassForShare(classSession);
    setShareDialogOpen(true);
  };

  const handleCloseSharedPopup = () => {
    setSharedClassPopupOpen(false);
    const url = new URL(window.location.href);
    url.searchParams.delete("class");
    window.history.replaceState({}, "", url.toString());
  };

  const navItems = [
    {
      label: "Schedule",
      active: !showSubjects,
      onClick: () => setShowSubjects(false),
    },
    {
      label: "Subjects",
      active: showSubjects,
      onClick: () => setShowSubjects(true),
    },
  ];

  return (
    <div
      className={`min-h-screen bg-gradient-to-br ${isDark ? "from-slate-900 via-indigo-950 to-slate-900" : "from-slate-100 via-indigo-100 to-slate-100"}`}
    >
      <SEO {...pageSEO.cstSchedule} breadcrumbs={breadcrumbs} />
      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            background: isDark
              ? "rgba(15, 23, 42, 0.9)"
              : "rgba(255, 255, 255, 0.9)",
            backdropFilter: "blur(12px)",
            color: isDark ? "#fff" : "#1e293b",
            border: isDark
              ? "1px solid rgba(255,255,255,0.1)"
              : "1px solid rgba(0,0,0,0.1)",
          },
        }}
      />

      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-to-br from-indigo-500/10 via-transparent to-purple-500/10 rounded-full blur-3xl animate-pulse" />
        <div
          className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-gradient-to-br from-purple-500/10 via-transparent to-pink-500/10 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "1s" }}
        />
      </div>

      <header
        className={`relative z-50 sticky top-0 backdrop-blur-xl ${isDark ? "bg-slate-900/70 border-white/10" : "bg-white/70 border-slate-200/50"} border-b`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 py-3">
            <div className="flex items-center justify-between w-full sm:w-auto gap-3">
              <div className="flex items-center gap-3">
                <img
                  src={ncwuLogo}
                  alt="NCWU Logo"
                  className="w-10 h-10 rounded-xl object-contain"
                />
                <div className="hidden sm:block">
                  <h1
                    className={`text-lg font-bold bg-gradient-to-r ${isDark ? "from-indigo-300 to-purple-300" : "from-indigo-600 to-purple-600"} bg-clip-text text-transparent`}
                  >
                    CST 26
                  </h1>
                  <p
                    className={`text-xs font-medium ${isDark ? "text-white/50" : "text-slate-500"}`}
                  >
                    2nd Semester Schedule
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 sm:hidden">
                <ThemeToggle />
                <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                  <SheetTrigger asChild>
                    <button
                      className={`p-2 rounded-xl ${isDark ? "bg-white/10 text-white" : "bg-slate-100 text-slate-900"}`}
                    >
                      <Menu className="w-5 h-5" />
                    </button>
                  </SheetTrigger>
                  <SheetContent
                    side="right"
                    className={`w-[280px] ${isDark ? "bg-slate-900/95 border-white/10" : "bg-white/95 border-slate-200"} backdrop-blur-xl`}
                  >
                    <div className="flex flex-col gap-6 mt-8">
                      <div className="flex items-center gap-3">
                        <img
                          src={ncwuLogo}
                          alt="NCWU Logo"
                          className="w-10 h-10 rounded-xl object-contain"
                        />
                        <div>
                          <h1
                            className={`text-lg font-bold ${isDark ? "text-white" : "text-slate-900"}`}
                          >
                            CST 26
                          </h1>
                          <p
                            className={`text-xs ${isDark ? "text-white/50" : "text-slate-500"}`}
                          >
                            2nd Semester
                          </p>
                        </div>
                      </div>

                      <div
                        className={`flex items-center gap-4 text-sm ${isDark ? "text-white/60" : "text-slate-600"}`}
                      >
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          <span>{totalWeeks} Weeks</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <BookOpen className="w-4 h-4" />
                          <span>{uniqueSubjects.length} Subjects</span>
                        </div>
                      </div>

                      <nav className="flex flex-col gap-2">
                        {navItems.map((item) => (
                          <button
                            key={item.label}
                            onClick={() => {
                              item.onClick();
                              setMobileMenuOpen(false);
                            }}
                            className={`
                              px-4 py-3 rounded-xl text-left text-sm font-medium transition-all duration-200
                              ${
                                item.active
                                  ? isDark
                                    ? "bg-white/10 text-white"
                                    : "bg-slate-100 text-slate-900"
                                  : isDark
                                    ? "text-white/60 hover:text-white hover:bg-white/5"
                                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                              }
                            `}
                          >
                            {item.label}
                          </button>
                        ))}
                      </nav>
                    </div>
                  </SheetContent>
                </Sheet>
              </div>
            </div>

            <div className="relative flex-1 max-w-xl w-full">
              <Search
                className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 ${isDark ? "text-white/50" : "text-slate-400"}`}
              />
              <Input
                type="text"
                placeholder="Search classes by subject, teacher, or room..."
                value={filters.search}
                onChange={(e) =>
                  setFilters({ ...filters, search: e.target.value })
                }
                className={`pl-12 pr-10 py-2.5 w-full rounded-2xl text-sm transition-all duration-300 ${
                  isDark
                    ? "bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:bg-white/20 focus:border-indigo-400/50 focus:ring-2 focus:ring-indigo-500/30 shadow-lg"
                    : "bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-indigo-300 focus:ring-2 focus:ring-indigo-200 shadow-lg"
                }`}
              />
              {filters.search && (
                <button
                  onClick={() => setFilters({ ...filters, search: "" })}
                  className={`absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full transition-colors ${
                    isDark
                      ? "text-white/40 hover:text-white/70 hover:bg-white/10"
                      : "text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="hidden sm:flex items-center gap-6">
              <div className="hidden lg:flex items-center gap-6">
                <div
                  className={`flex items-center gap-2 text-sm ${isDark ? "text-white/60" : "text-slate-600"}`}
                >
                  <Calendar className="w-4 h-4" />
                  <span>{totalWeeks} Weeks</span>
                </div>
                <div
                  className={`flex items-center gap-2 text-sm ${isDark ? "text-white/60" : "text-slate-600"}`}
                >
                  <BookOpen className="w-4 h-4" />
                  <span>{uniqueSubjects.length} Subjects</span>
                </div>
              </div>
              <nav className="flex items-center gap-1">
                {navItems.map((item) => (
                  <button
                    key={item.label}
                    onClick={item.onClick}
                    className={`
                      px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200
                      ${
                        item.active
                          ? isDark
                            ? "bg-white/10 text-white"
                            : "bg-slate-100 text-slate-900"
                          : isDark
                            ? "text-white/60 hover:text-white hover:bg-white/5"
                            : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                      }
                    `}
                  >
                    {item.label}
                  </button>
                ))}
              </nav>
              <div
                className={`w-px h-6 ${isDark ? "bg-white/20" : "bg-slate-200"} mx-2`}
              />
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {showSubjects ? (
          <SubjectsSection onSubjectClick={handleSubjectClick} />
        ) : (
          <>
            <div className="mb-6">
              <FilterBar
                filters={filters}
                onFilterChange={setFilters}
                totalWeeks={totalWeeks}
              />
            </div>
            {!filters.search &&
              filters.week === "all" &&
              filters.shift === "all" &&
              filters.day === "all" && <TodaySchedule />}

            <button
              onClick={() => setShowSubjects(true)}
              className={`sm:hidden w-full mb-6 p-4 rounded-2xl backdrop-blur-xl ${isDark ? "bg-white/5 border-white/10 text-white" : "bg-slate-50 border-slate-200 text-slate-900"} border flex items-center justify-between`}
            >
              <div className="flex items-center gap-3">
                <BookOpen
                  className={`w-5 h-5 ${isDark ? "text-indigo-300" : "text-indigo-600"}`}
                />
                <span className="font-medium">Browse Subjects</span>
              </div>
              <span className={isDark ? "text-white/50" : "text-slate-500"}>
                {uniqueSubjects.length} courses
              </span>
            </button>

            <ScheduleGrid classes={filteredClasses} onShare={handleShare} />
          </>
        )}
      </main>

      <footer
        className={`relative z-10 border-t ${isDark ? "border-white/10" : "border-slate-200"} mt-12`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <a
              href="https://www.miltonbabu.site"
              target="_blank"
              rel="noopener noreferrer"
              className={`text-sm ${isDark ? "text-white/40 hover:text-white/60" : "text-slate-500 hover:text-slate-700"} transition-colors`}
            >
              www.miltonbabu.site
            </a>
            <p
              className={`text-sm ${isDark ? "text-white/30" : "text-slate-400"}`}
            >
              CST 26 2nd Semester Class Schedule • {scheduleData.length} classes
              • {totalWeeks} weeks
            </p>
          </div>
        </div>
      </footer>

      <ShareDialog
        isOpen={shareDialogOpen}
        onClose={() => setShareDialogOpen(false)}
        classSession={selectedClassForShare}
      />

      <SharedClassPopup
        isOpen={sharedClassPopupOpen}
        onClose={handleCloseSharedPopup}
        classSession={sharedClass}
      />
    </div>
  );
}

function App() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="cst26-theme">
      <AppContent />
    </ThemeProvider>
  );
}

export default App;
