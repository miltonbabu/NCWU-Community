import { useState } from "react";
import { BookOpen, ChevronRight, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Clock, MapPin, User, Calendar } from "lucide-react";
import { useTheme } from "./ThemeProvider";
import type { ClassSession, SubjectInfo } from "@/types/schedule";

interface SubjectsSectionProps {
  onSubjectClick?: (subject: string) => void;
  subjectsList?: SubjectInfo[];
  scheduleData?: ClassSession[];
}

export function SubjectsSection({
  onSubjectClick,
  subjectsList: propSubjectsList,
  scheduleData: propScheduleData,
}: SubjectsSectionProps) {
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  const subjectClasses =
    selectedSubject && propScheduleData
      ? propScheduleData.filter((c) => c.subject === selectedSubject)
      : [];

  const handleSubjectClick = (subject: string) => {
    setSelectedSubject(subject);
    onSubjectClick?.(subject);
  };

  return (
    <>
      {/* Subjects Grid */}
      <div
        className={`backdrop-blur-xl ${isDark ? "bg-white/5 border-white/10" : "bg-slate-50 border-slate-200"} rounded-3xl border p-4 sm:p-5`}
      >
        <div className="flex items-center gap-3 mb-4">
          <div
            className={`w-10 h-10 rounded-xl ${isDark ? "bg-gradient-to-br from-indigo-500/30 to-purple-500/30" : "bg-gradient-to-br from-indigo-100 to-purple-100"} flex items-center justify-center`}
          >
            <BookOpen
              className={`w-5 h-5 ${isDark ? "text-indigo-300" : "text-indigo-600"}`}
            />
          </div>
          <div>
            <h3
              className={`text-lg font-bold ${isDark ? "text-white" : "text-slate-900"}`}
            >
              Subjects
            </h3>
            <p
              className={`text-sm ${isDark ? "text-white/50" : "text-slate-500"}`}
            >
              {propSubjectsList?.length || 0} courses
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
          {propSubjectsList?.map((subject) => (
            <button
              key={subject.name}
              onClick={() => handleSubjectClick(subject.name)}
              className={`
                group relative overflow-hidden rounded-2xl p-3 text-left
                backdrop-blur-md border transition-all duration-300
                hover:scale-[1.02] active:scale-[0.98]
                ${subject.bg} ${subject.text.replace("text-", "border-")}/30
              `}
            >
              <div
                className={`absolute inset-0 bg-gradient-to-br ${isDark ? "from-white/10 via-transparent to-transparent" : "from-white/30 via-transparent to-transparent"}`}
              />
              <div className="relative">
                <p className="font-medium text-sm leading-tight line-clamp-2">
                  {subject.name}
                </p>
                <ChevronRight className="w-4 h-4 mt-2 opacity-50 group-hover:translate-x-1 transition-transform" />
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Subject Detail Dialog */}
      <Dialog
        open={!!selectedSubject}
        onOpenChange={() => setSelectedSubject(null)}
      >
        <DialogContent
          className={`max-w-2xl max-h-[80vh] overflow-auto ${isDark ? "bg-slate-900/95 border-white/20" : "bg-white/95 border-slate-200"} backdrop-blur-xl`}
        >
          <DialogHeader>
            <DialogTitle
              className={`text-xl font-bold ${isDark ? "text-white" : "text-slate-900"} flex items-center justify-between`}
            >
              <div className="flex items-center gap-3">
                {selectedSubject && (
                  <>
                    <span
                      className={`w-10 h-10 rounded-xl ${isDark ? "bg-indigo-500/20" : "bg-indigo-100"} flex items-center justify-center`}
                    >
                      <BookOpen
                        className={`w-5 h-5 ${isDark ? "text-indigo-300" : "text-indigo-600"}`}
                      />
                    </span>
                    {selectedSubject}
                  </>
                )}
              </div>
              <button
                onClick={() => setSelectedSubject(null)}
                className={`p-2 rounded-xl transition-all duration-200 ${isDark ? "bg-white/10 hover:bg-white/20 text-white" : "bg-slate-100 hover:bg-slate-200 text-slate-700"}`}
              >
                <X className="w-5 h-5" />
              </button>
            </DialogTitle>
          </DialogHeader>

          {selectedSubject && (
            <div className="space-y-3 mt-4">
              <p
                className={`${isDark ? "text-white/60" : "text-slate-600"} text-sm`}
              >
                {subjectClasses.length} class sessions
              </p>

              <div className="space-y-2">
                {subjectClasses
                  .sort(
                    (a, b) =>
                      a.week - b.week ||
                      a.day.localeCompare(b.day) ||
                      a.startTime.localeCompare(b.startTime),
                  )
                  .map((cls) => (
                    <div
                      key={cls.id}
                      className={`
                        p-4 rounded-2xl backdrop-blur-md border
                        ${cls.bg} ${cls.border}
                      `}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className={`font-semibold ${cls.text}`}>
                          Week {cls.week}
                        </span>
                        <span className={`text-sm ${cls.text} opacity-70`}>
                          {cls.shift}
                        </span>
                      </div>
                      <div className={`space-y-1 text-sm ${cls.text}`}>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 opacity-60" />
                          <span>{cls.day}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 opacity-60" />
                          <span>
                            {cls.startTime} - {cls.endTime}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 opacity-60" />
                          <span>{cls.instructor}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 opacity-60" />
                          <span>{cls.room}</span>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
