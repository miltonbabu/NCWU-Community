import { useState, useMemo } from "react";
import type { FilterState } from "@/types/schedule";
import { economics2024ScheduleData, economics2024TotalWeeks, economics2024SubjectsList } from "@/data/economics2024ScheduleData";
import { useScheduleFilter } from "@/hooks/useScheduleFilter";
import { FilterBar } from "@/components/FilterBar";
import { ScheduleGrid } from "@/components/ScheduleGrid";
import { SubjectsSection } from "@/components/SubjectsSection";
import { ShareDialog } from "@/components/ShareDialog";
import { SharedClassPopup } from "@/components/SharedClassPopup";
import { useTheme } from "@/components/ThemeProvider";
import { TodaySchedule } from "@/components/TodaySchedule";
import { BookOpen } from "lucide-react";
import type { ClassSession } from "@/types/schedule";

export default function Economics2024AppContentWrapper() {
  const [filters, setFilters] = useState<FilterState>({ search: "", week: "all", shift: "all", day: "all" });
  const [showSubjects, setShowSubjects] = useState(false);
  const { resolvedTheme } = useTheme();
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [selectedClassForShare, setSelectedClassForShare] = useState<ClassSession | null>(null);

  const sharedClassData = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    const classId = params.get("class");
    if (classId) return economics2024ScheduleData.find((c) => c.id === classId) || null;
    return null;
  }, []);

  const [sharedClassPopupOpen, setSharedClassPopupOpen] = useState(() => !!sharedClassData);
  const [sharedClass] = useState<ClassSession | null>(sharedClassData);

  const filteredClasses = useScheduleFilter(economics2024ScheduleData, filters);
  const isDark = resolvedTheme === "dark";
  const uniqueSubjects = Array.from(new Set(economics2024ScheduleData.map((c) => c.subject)));

  const handleSubjectClick = (subject: string) => { setFilters({ ...filters, search: subject }); setShowSubjects(false); };
  const handleShare = (classSession: ClassSession) => { setSelectedClassForShare(classSession); setShareDialogOpen(true); };
  const handleCloseSharedPopup = () => {
    setSharedClassPopupOpen(false);
    const url = new URL(window.location.href);
    url.searchParams.delete("class");
    window.history.replaceState({}, "", url.toString());
  };

  return (
    <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {showSubjects ? (
        <SubjectsSection onSubjectClick={handleSubjectClick} subjectsList={economics2024SubjectsList} scheduleData={economics2024ScheduleData} />
      ) : (
        <>
          <div className="mb-6">
            <FilterBar filters={filters} onFilterChange={setFilters} totalWeeks={economics2024TotalWeeks} totalClasses={economics2024ScheduleData.length} filteredCount={filteredClasses.length} />
          </div>
          {!filters.search && filters.week === "all" && filters.shift === "all" && filters.day === "all" && <TodaySchedule scheduleData={economics2024ScheduleData} />}
          <button onClick={() => setShowSubjects(true)} className={`sm:hidden w-full mb-6 p-4 rounded-2xl backdrop-blur-xl ${isDark ? "bg-white/5 border-white/10 text-white" : "bg-slate-50 border-slate-200 text-slate-900"} border flex items-center justify-between`}>
            <div className="flex items-center gap-3"><BookOpen className={`w-5 h-5 ${isDark ? "text-purple-300" : "text-purple-600"}`} /><span className="font-medium">Browse Subjects</span></div>
            <span className={isDark ? "text-white/50" : "text-slate-500"}>{uniqueSubjects.length} courses</span>
          </button>
          <ScheduleGrid scheduleData={filteredClasses} isLoading={false} />
        </>
      )}
      <ShareDialog isOpen={shareDialogOpen} onClose={() => setShareDialogOpen(false)} classSession={selectedClassForShare} />
      <SharedClassPopup isOpen={sharedClassPopupOpen} onClose={handleCloseSharedPopup} classSession={sharedClass} />
    </main>
  );
}
