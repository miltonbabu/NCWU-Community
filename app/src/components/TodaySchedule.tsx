import { useState, useEffect, useRef } from "react";
import { useTheme } from "@/components/ThemeProvider";
import {
  useRealTimeSchedule,
  getGreeting,
  getClassStatus,
} from "@/hooks/useRealTimeSchedule";
import type { ClassSession } from "@/types/schedule";
import {
  Clock,
  Calendar,
  MapPin,
  User,
  BookOpen,
  ChevronRight,
  Sun,
  Sunset,
  Moon,
  Play,
  Zap,
  Timer,
  CheckCircle2,
  List,
  Filter,
} from "lucide-react";

function AnimatedCounter({
  value,
  duration = 500,
}: {
  value: number;
  duration?: number;
}) {
  const [displayValue, setDisplayValue] = useState(0);
  const previousValue = useRef(0);

  useEffect(() => {
    const startValue = previousValue.current;
    const endValue = value;
    const startTime = Date.now();

    const animate = () => {
      const now = Date.now();
      const progress = Math.min((now - startTime) / duration, 1);
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const current = Math.floor(
        startValue + (endValue - startValue) * easeOut,
      );
      setDisplayValue(current);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        previousValue.current = endValue;
      }
    };

    requestAnimationFrame(animate);
  }, [value, duration]);

  return <span>{displayValue}</span>;
}

function ShiftIcon({
  shift,
  className,
}: {
  shift: string;
  className?: string;
}) {
  switch (shift) {
    case "Morning":
      return <Sun className={className} />;
    case "Afternoon":
      return <Sunset className={className} />;
    case "Evening":
      return <Moon className={className} />;
    case "Night":
      return <Moon className={className} />;
    default:
      return <Clock className={className} />;
  }
}

interface ClassCardProps {
  classSession: ClassSession;
  isLive?: boolean;
  isNext?: boolean;
  isStartingSoon?: boolean;
  isPast?: boolean;
  isDark: boolean;
}

function ClassCard({
  classSession,
  isLive = false,
  isNext = false,
  isStartingSoon = false,
  isPast = false,
  isDark,
}: ClassCardProps) {
  const getCardStyle = () => {
    if (isLive) {
      return `${classSession.bg} ${classSession.border} ring-2 ring-red-500/50`;
    }
    if (isStartingSoon) {
      return `${classSession.bg} ${classSession.border} ring-2 ring-amber-500/40`;
    }
    if (isNext) {
      return `${classSession.bg} ${classSession.border} ring-2 ring-green-500/30`;
    }
    if (isPast) {
      return isDark
        ? "bg-slate-800/50 border-slate-700 opacity-50"
        : "bg-slate-100 border-slate-300 opacity-50";
    }
    return isDark
      ? "bg-slate-800/60 border-slate-700"
      : "bg-white border-slate-200 shadow-sm";
  };

  return (
    <div
      className={`
        relative overflow-hidden rounded-xl border backdrop-blur-xl
        transition-all duration-300 ease-out
        hover:scale-[1.02] hover:shadow-xl
        ${getCardStyle()}
        p-3
        ${isLive ? "animate-pulse" : ""}
      `}
    >
      <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />

      {isLive && (
        <div className="absolute top-1.5 right-1.5 flex items-center gap-1 px-1.5 py-0.5 bg-red-500/90 rounded-full text-white text-xs font-bold">
          <span className="w-1.5 h-1.5 bg-white rounded-full animate-ping" />
          <span className="text-[10px]">LIVE</span>
        </div>
      )}

      {!isLive && isStartingSoon && (
        <div className="absolute top-1.5 right-1.5 flex items-center gap-1 px-1.5 py-0.5 bg-amber-500/90 rounded-full text-white text-xs font-bold">
          <Timer className="w-2.5 h-2.5" />
          <span className="text-[10px]">SOON</span>
        </div>
      )}

      {!isLive && !isStartingSoon && isNext && (
        <div className="absolute top-1.5 right-1.5 flex items-center gap-1 px-1.5 py-0.5 bg-green-500/90 rounded-full text-white text-xs font-bold">
          <ChevronRight className="w-2.5 h-2.5" />
          <span className="text-[10px]">NEXT</span>
        </div>
      )}

      {isPast && (
        <div className="absolute top-1.5 right-1.5 flex items-center gap-1 px-1.5 py-0.5 bg-slate-500/70 rounded-full text-white text-xs font-medium">
          <CheckCircle2 className="w-2.5 h-2.5" />
          <span className="text-[10px]">DONE</span>
        </div>
      )}

      <div className="flex flex-col gap-2 relative">
        <div className="flex items-start gap-2">
          <div
            className={`p-1.5 rounded-lg ${isLive || isNext || isStartingSoon ? classSession.bg : isDark ? "bg-white/10" : "bg-slate-100"}`}
          >
            <BookOpen
              className={`w-4 h-4 ${isLive || isNext || isStartingSoon ? classSession.text : isDark ? "text-white/70" : "text-slate-600"}`}
            />
          </div>
          <div className="flex-1 min-w-0">
            <h3
              className={`text-sm font-semibold truncate ${isLive || isNext || isStartingSoon ? classSession.text : isDark ? "text-white" : "text-slate-900"} ${isPast ? "line-through" : ""}`}
            >
              {classSession.subject}
            </h3>
            <div className="flex items-center gap-1.5 mt-0.5">
              <Clock
                className={`w-3 h-3 ${isDark ? "text-white/50" : "text-slate-400"}`}
              />
              <span
                className={`text-xs ${isDark ? "text-white/60" : "text-slate-500"}`}
              >
                {classSession.startTime} - {classSession.endTime}
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 text-xs">
          <div className="flex items-center gap-1">
            <User
              className={`w-3 h-3 ${isDark ? "text-white/50" : "text-slate-400"}`}
            />
            <span className={isDark ? "text-white/60" : "text-slate-500"}>
              {classSession.instructor}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <MapPin
              className={`w-3 h-3 ${isDark ? "text-white/50" : "text-slate-400"}`}
            />
            <span className={isDark ? "text-white/60" : "text-slate-500"}>
              {classSession.room}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function ToggleButton({
  active,
  onClick,
  children,
  isDark,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  isDark: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`
        px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200
        ${
          active
            ? isDark
              ? "bg-indigo-500/30 text-indigo-300 border border-indigo-400/30"
              : "bg-indigo-100 text-indigo-700 border border-indigo-200"
            : isDark
              ? "bg-white/5 text-white/60 border border-white/10 hover:bg-white/10"
              : "bg-slate-100 text-slate-600 border border-slate-200 hover:bg-slate-200"
        }
      `}
    >
      {children}
    </button>
  );
}

interface StatCardProps {
  icon: React.ElementType;
  label: string;
  value: number;
  color: string;
  isDark: boolean;
  highlight?: boolean;
}

function StatCard({
  icon: Icon,
  label,
  value,
  color,
  isDark,
  highlight,
}: StatCardProps) {
  return (
    <div
      className={`relative overflow-hidden p-3 rounded-xl border backdrop-blur-xl transition-all duration-300 hover:scale-[1.02] hover:shadow-lg ${
        isDark
          ? "bg-slate-800/80 border-slate-700"
          : "bg-white border-slate-200 shadow-sm"
      }`}
    >
      <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-white/10 to-transparent rounded-full blur-xl -translate-y-1/2 translate-x-1/2" />
      <div className="relative">
        <div className="flex items-center gap-1.5 mb-1">
          <Icon className={`w-3.5 h-3.5 ${color}`} />
          <span
            className={`text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}
          >
            {label}
          </span>
        </div>
        <span
          className={`text-xl font-bold ${highlight ? color : isDark ? "text-white" : "text-slate-900"}`}
        >
          <AnimatedCounter value={value} />
        </span>
      </div>
    </div>
  );
}

interface TodayScheduleProps {
  scheduleData?: ClassSession[];
}

export function TodaySchedule({ scheduleData }: TodayScheduleProps) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const { realTimeInfo, todayCourseInfo } = useRealTimeSchedule(
    scheduleData || [],
  );

  const [showAllClasses, setShowAllClasses] = useState(false);

  const { currentWeek, currentDay, currentShift, currentTime } = realTimeInfo;
  const {
    todayClasses,
    currentClass,
    nextClass,
    upcomingClasses,
    startingSoonClasses,
  } = todayCourseInfo;

  const greeting = getGreeting(currentShift);

  const displayedClasses = showAllClasses
    ? todayClasses
    : [...(currentClass ? [currentClass] : []), ...upcomingClasses];

  return (
    <div className="mb-6">
      <div
        className={`
        relative overflow-hidden rounded-2xl border backdrop-blur-xl p-4 mb-4
        transition-all duration-300 hover:shadow-xl
        ${
          isDark
            ? "bg-gradient-to-r from-indigo-600/30 via-purple-600/30 to-pink-600/30 border-slate-700"
            : "bg-gradient-to-r from-indigo-100 via-purple-100 to-pink-100 border-slate-200 shadow-sm"
        }
      `}
      >
        <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-indigo-500/30 to-transparent rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr from-purple-500/30 to-transparent rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

        <div className="relative z-10">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
            <div>
              <h2
                className={`text-lg sm:text-xl font-bold ${isDark ? "text-white" : "text-slate-900"}`}
              >
                {greeting}!
              </h2>
              <p
                className={`text-xs sm:text-sm ${isDark ? "text-white/60" : "text-slate-500"}`}
              >
                Here's your schedule for today
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div
                className={`
                flex items-center gap-2 px-3 py-1.5 rounded-xl backdrop-blur-md
                ${isDark ? "bg-white/10" : "bg-white/80"}
              `}
              >
                <Clock
                  className={`w-4 h-4 ${isDark ? "text-indigo-300" : "text-indigo-600"}`}
                />
                <span
                  className={`text-base font-mono font-bold ${isDark ? "text-white" : "text-slate-900"}`}
                >
                  {currentTime}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <div
              className={`
              flex items-center gap-1.5 px-3 py-1.5 rounded-lg backdrop-blur-md
              transition-all duration-200 hover:scale-[1.02]
              ${isDark ? "bg-white/10" : "bg-white/80"}
            `}
            >
              <Calendar
                className={`w-3.5 h-3.5 ${isDark ? "text-indigo-300" : "text-indigo-600"}`}
              />
              <span
                className={`text-sm font-medium ${isDark ? "text-white" : "text-slate-900"}`}
              >
                Week {currentWeek}
              </span>
            </div>

            <div
              className={`
              flex items-center gap-1.5 px-3 py-1.5 rounded-lg backdrop-blur-md
              transition-all duration-200 hover:scale-[1.02]
              ${isDark ? "bg-white/10" : "bg-white/80"}
            `}
            >
              <span
                className={`text-sm font-medium ${isDark ? "text-white" : "text-slate-900"}`}
              >
                {currentDay}
              </span>
            </div>

            <div
              className={`
              flex items-center gap-1.5 px-3 py-1.5 rounded-lg backdrop-blur-md
              transition-all duration-200 hover:scale-[1.02]
              ${isDark ? "bg-white/10" : "bg-white/80"}
            `}
            >
              <ShiftIcon
                shift={currentShift}
                className={`w-3.5 h-3.5 ${isDark ? "text-indigo-300" : "text-indigo-600"}`}
              />
              <span
                className={`text-sm font-medium ${isDark ? "text-white" : "text-slate-900"}`}
              >
                {currentShift}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
        <StatCard
          icon={BookOpen}
          label="Total Today"
          value={todayClasses.length}
          color={isDark ? "text-indigo-300" : "text-indigo-600"}
          isDark={isDark}
        />
        <StatCard
          icon={Zap}
          label="Live Now"
          value={currentClass ? 1 : 0}
          color={isDark ? "text-red-400" : "text-red-500"}
          isDark={isDark}
          highlight={!!currentClass}
        />
        <StatCard
          icon={Timer}
          label="Soon"
          value={startingSoonClasses.length}
          color={isDark ? "text-amber-400" : "text-amber-500"}
          isDark={isDark}
          highlight={startingSoonClasses.length > 0}
        />
        <StatCard
          icon={Play}
          label="Upcoming"
          value={upcomingClasses.length}
          color={isDark ? "text-green-400" : "text-green-500"}
          isDark={isDark}
        />
      </div>

      {currentClass && (
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="flex items-center gap-1.5">
              <Zap
                className={`w-3.5 h-3.5 ${isDark ? "text-red-400" : "text-red-500"}`}
              />
              <h3
                className={`text-sm font-semibold ${isDark ? "text-white" : "text-slate-900"}`}
              >
                Currently In Class
              </h3>
            </div>
          </div>
          <ClassCard
            classSession={currentClass}
            isLive={true}
            isDark={isDark}
          />
        </div>
      )}

      {startingSoonClasses.length > 0 && !currentClass && (
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="flex items-center gap-1.5">
              <Timer
                className={`w-3.5 h-3.5 ${isDark ? "text-amber-400" : "text-amber-500"}`}
              />
              <h3
                className={`text-sm font-semibold ${isDark ? "text-white" : "text-slate-900"}`}
              >
                Starting Soon
              </h3>
              <span
                className={`text-xs px-2 py-0.5 rounded-full ${isDark ? "bg-amber-500/20 text-amber-300" : "bg-amber-100 text-amber-700"}`}
              >
                within 2 hours
              </span>
            </div>
          </div>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {startingSoonClasses.map((classSession) => (
              <ClassCard
                key={classSession.id}
                classSession={classSession}
                isStartingSoon={true}
                isNext={nextClass?.id === classSession.id}
                isDark={isDark}
              />
            ))}
          </div>
        </div>
      )}

      {nextClass && !currentClass && startingSoonClasses.length === 0 && (
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="flex items-center gap-1.5">
              <Play
                className={`w-3.5 h-3.5 ${isDark ? "text-green-400" : "text-green-500"}`}
              />
              <h3
                className={`text-sm font-semibold ${isDark ? "text-white" : "text-slate-900"}`}
              >
                Up Next
              </h3>
            </div>
          </div>
          <ClassCard classSession={nextClass} isNext={true} isDark={isDark} />
        </div>
      )}

      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <List
              className={`w-3.5 h-3.5 ${isDark ? "text-indigo-300" : "text-indigo-600"}`}
            />
            <h3
              className={`text-sm font-semibold ${isDark ? "text-white" : "text-slate-900"}`}
            >
              {showAllClasses ? "All Today's Classes" : "Upcoming Classes"}
            </h3>
            <span
              className={`text-xs px-2 py-0.5 rounded-full ${isDark ? "bg-white/10 text-white/60" : "bg-slate-100 text-slate-500"}`}
            >
              {displayedClasses.length}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Filter
              className={`w-3.5 h-3.5 ${isDark ? "text-white/50" : "text-slate-400"}`}
            />
            <ToggleButton
              active={!showAllClasses}
              onClick={() => setShowAllClasses(false)}
              isDark={isDark}
            >
              Upcoming Only
            </ToggleButton>
            <ToggleButton
              active={showAllClasses}
              onClick={() => setShowAllClasses(true)}
              isDark={isDark}
            >
              All Classes
            </ToggleButton>
          </div>
        </div>

        {displayedClasses.length > 0 ? (
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {displayedClasses.map((classSession) => {
              const status = getClassStatus(
                classSession,
                currentTime,
                nextClass?.id || null,
              );
              return (
                <ClassCard
                  key={classSession.id}
                  classSession={classSession}
                  isLive={status.isLive}
                  isNext={status.isNext}
                  isStartingSoon={status.isStartingSoon}
                  isPast={status.isPast}
                  isDark={isDark}
                />
              );
            })}
          </div>
        ) : (
          <div
            className={`
            text-center py-8 rounded-xl border backdrop-blur-xl
            ${isDark ? "bg-slate-800/60 border-slate-700" : "bg-white border-slate-200 shadow-sm"}
          `}
          >
            <BookOpen
              className={`w-8 h-8 mx-auto mb-2 ${isDark ? "text-slate-500" : "text-slate-300"}`}
            />
            <p
              className={`text-sm font-medium ${isDark ? "text-slate-300" : "text-slate-500"}`}
            >
              {showAllClasses
                ? "No classes scheduled for today"
                : "No more classes for today"}
            </p>
            <p
              className={`text-xs mt-1 ${isDark ? "text-slate-500" : "text-slate-400"}`}
            >
              {showAllClasses
                ? "Enjoy your free time!"
                : "Great job! You're done for the day."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
