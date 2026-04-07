import { useState, useEffect, useRef } from "react";
import { useTheme } from "@/components/ThemeProvider";
import { useAuth } from "@/contexts/AuthContext";
import type { ClassSession } from "@/types/schedule";
import {
  Calendar,
  Sparkles,
  Heart,
  Download,
  Bell,
  EyeOff,
  LogIn,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { ClassCard } from "./ClassCard";
import {
  useSchedulePreferences,
  downloadScheduleICS,
  useScheduleNotifications,
} from "@/hooks/useSchedulePreferences";
import { Link } from "react-router-dom";

function AnimatedCounter({ value, duration = 500 }: { value: number; duration?: number }) {
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
      const current = Math.floor(startValue + (endValue - startValue) * easeOut);
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

interface ScheduleGridProps {
  scheduleData: ClassSession[];
  isLoading?: boolean;
}

export function ScheduleGrid({ scheduleData, isLoading }: ScheduleGridProps) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const { isAuthenticated } = useAuth();
  const {
    preferences,
    toggleFavorite,
    isFavorite,
    setReminder,
    removeReminder,
    getReminder,
    toggleHidden,
    isHidden,
    setCustomNote,
    getCustomNote,
  } = useSchedulePreferences();
  const { permission, requestPermission, scheduleNotification, isSupported } = useScheduleNotifications();
  const [showOnlyFavorites, setShowOnlyFavorites] = useState(false);
  const [showHidden, setShowHidden] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [pendingAction, setPendingAction] = useState<string | null>(null);

  useEffect(() => {
    if (permission === 'granted' && isAuthenticated) {
      Object.entries(preferences.reminders).forEach(([classId, minutes]) => {
        const classSession = scheduleData.find(c => c.id === classId);
        if (classSession) {
          scheduleNotification(classSession, minutes);
        }
      });
    }
  }, [permission, preferences.reminders, scheduleData, scheduleNotification, isAuthenticated]);

  const handleSetReminder = (classId: string, minutes: number) => {
    if (!isAuthenticated) {
      setPendingAction('set a reminder');
      setShowLoginPrompt(true);
      return;
    }
    setReminder(classId, minutes);
    const classSession = scheduleData.find(c => c.id === classId);
    if (classSession && permission !== 'granted') {
      requestPermission().then(result => {
        if (result === 'granted') {
          scheduleNotification(classSession, minutes);
          toast.success('Notifications enabled! You will receive reminders for your classes.');
        }
      });
    } else if (classSession) {
      scheduleNotification(classSession, minutes);
    }
  };

  const handleToggleFavorite = (classId: string) => {
    if (!isAuthenticated) {
      setPendingAction('add favorites');
      setShowLoginPrompt(true);
      return;
    }
    toggleFavorite(classId);
    toast.success(isFavorite(classId) ? 'Removed from favorites' : 'Added to favorites');
  };

  const handleToggleHidden = (classId: string) => {
    if (!isAuthenticated) {
      setPendingAction('hide classes');
      setShowLoginPrompt(true);
      return;
    }
    toggleHidden(classId);
    toast.success(isHidden(classId) ? 'Class is now visible' : 'Class hidden from schedule');
  };

  const handleSetNote = (classId: string, note: string) => {
    if (!isAuthenticated) {
      setPendingAction('add notes');
      setShowLoginPrompt(true);
      return;
    }
    setCustomNote(classId, note);
  };

  const handleExportAll = () => {
    downloadScheduleICS(scheduleData, false, []);
    toast.success('Schedule exported to calendar file!');
  };

  const handleExportFavorites = () => {
    if (!isAuthenticated) {
      setPendingAction('export favorites');
      setShowLoginPrompt(true);
      return;
    }
    if (preferences.favoriteClasses.length === 0) {
      toast.error('No favorite classes to export!');
      return;
    }
    downloadScheduleICS(scheduleData, true, preferences.favoriteClasses);
    toast.success('Favorite classes exported to calendar file!');
  };

  const filteredData = scheduleData.filter(cls => {
    if (showOnlyFavorites && !isFavorite(cls.id)) return false;
    if (!showHidden && isHidden(cls.id)) return false;
    return true;
  });

  const hiddenCount = scheduleData.filter(cls => isHidden(cls.id)).length;
  const favoriteCount = preferences.favoriteClasses.length;

  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className={`
              relative overflow-hidden rounded-xl border backdrop-blur-xl p-4
              ${isDark ? "bg-slate-800/60 border-slate-700" : "bg-white border-slate-200 shadow-sm"}
              animate-pulse
            `}
          >
            <div className="flex items-start gap-3">
              <div className={`w-10 h-10 rounded-lg ${isDark ? "bg-slate-700" : "bg-slate-200"}`} />
              <div className="flex-1 space-y-2">
                <div className={`h-4 rounded ${isDark ? "bg-slate-700" : "bg-slate-200"} w-3/4`} />
                <div className={`h-3 rounded ${isDark ? "bg-slate-700" : "bg-slate-200"} w-1/2`} />
              </div>
            </div>
            <div className="mt-4 flex gap-4">
              <div className={`h-3 rounded ${isDark ? "bg-slate-700" : "bg-slate-200"} w-1/3`} />
              <div className={`h-3 rounded ${isDark ? "bg-slate-700" : "bg-slate-200"} w-1/3`} />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (scheduleData.length === 0) {
    return (
      <div
        className={`
          relative overflow-hidden text-center py-16 rounded-2xl border backdrop-blur-xl
          ${isDark ? "bg-slate-800/60 border-slate-700" : "bg-white border-slate-200 shadow-sm"}
        `}
      >
        <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-indigo-500/20 to-transparent rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr from-purple-500/20 to-transparent rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

        <div className="relative">
          <div className={`inline-flex p-4 rounded-2xl ${isDark ? "bg-slate-700" : "bg-slate-100"} mb-4`}>
            <Calendar className={`w-10 h-10 ${isDark ? "text-slate-400" : "text-slate-400"}`} />
          </div>
          <h3 className={`text-xl font-bold mb-2 ${isDark ? "text-white" : "text-slate-900"}`}>
            No Classes Found
          </h3>
          <p className={`text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}>
            Try adjusting your filters or search criteria
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {!isAuthenticated && (
        <div className={`p-4 rounded-xl border backdrop-blur-xl flex items-center justify-between gap-4 ${
          isDark ? "bg-amber-500/10 border-amber-500/30" : "bg-amber-50 border-amber-200"
        }`}>
          <div className="flex items-center gap-3">
            <LogIn className={`w-5 h-5 ${isDark ? "text-amber-400" : "text-amber-600"}`} />
            <p className={`text-sm ${isDark ? "text-amber-300" : "text-amber-700"}`}>
              <span className="font-medium">Sign in</span> to save your favorites, set reminders, and customize your schedule
            </p>
          </div>
          <Link
            to="/login"
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              isDark
                ? "bg-amber-500/20 hover:bg-amber-500/30 text-amber-400"
                : "bg-amber-500 hover:bg-amber-600 text-white"
            }`}
          >
            Sign In
          </Link>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Sparkles className={`w-4 h-4 ${isDark ? "text-indigo-400" : "text-indigo-600"}`} />
            <span className={`text-sm font-medium ${isDark ? "text-white/70" : "text-slate-600"}`}>
              Showing <AnimatedCounter value={filteredData.length} /> classes
              {hiddenCount > 0 && !showHidden && (
                <span className={`ml-2 ${isDark ? "text-slate-500" : "text-slate-400"}`}>
                  ({hiddenCount} hidden)
                </span>
              )}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (!isAuthenticated) {
                  setPendingAction('view favorites');
                  setShowLoginPrompt(true);
                } else {
                  setShowOnlyFavorites(!showOnlyFavorites);
                }
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-all ${
                showOnlyFavorites
                  ? "bg-pink-500/20 text-pink-600 ring-1 ring-pink-500/30"
                  : isDark
                    ? "bg-slate-700/50 hover:bg-slate-700 text-slate-300"
                    : "bg-slate-100 hover:bg-slate-200 text-slate-600"
              }`}
            >
              <Heart className={`w-4 h-4 ${showOnlyFavorites ? "fill-current" : ""}`} />
              <span>Favorites ({favoriteCount})</span>
            </button>

            {hiddenCount > 0 && (
              <button
                onClick={() => setShowHidden(!showHidden)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-all ${
                  showHidden
                    ? "bg-slate-500/20 text-slate-600 ring-1 ring-slate-500/30"
                    : isDark
                      ? "bg-slate-700/50 hover:bg-slate-700 text-slate-300"
                      : "bg-slate-100 hover:bg-slate-200 text-slate-600"
                }`}
              >
                <EyeOff className="w-4 h-4" />
                <span>Show Hidden ({hiddenCount})</span>
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isSupported && permission !== 'granted' && isAuthenticated && (
            <button
              onClick={requestPermission}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-all ${
                isDark
                  ? "bg-amber-500/20 hover:bg-amber-500/30 text-amber-500"
                  : "bg-amber-100 hover:bg-amber-200 text-amber-600"
              }`}
            >
              <Bell className="w-4 h-4" />
              <span>Enable Notifications</span>
            </button>
          )}

          <div className="relative group">
            <button
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-all ${
                isDark
                  ? "bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-400"
                  : "bg-indigo-100 hover:bg-indigo-200 text-indigo-600"
              }`}
            >
              <Download className="w-4 h-4" />
              <span>Export Calendar</span>
            </button>
            <div
              className={`absolute top-full right-0 mt-1 z-20 rounded-xl shadow-xl border overflow-hidden opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all ${
                isDark ? "bg-slate-800 border-slate-700" : "bg-white border-slate-200"
              }`}
            >
              <div className="py-1 min-w-[160px]">
                <button
                  onClick={handleExportAll}
                  className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                    isDark
                      ? "hover:bg-slate-700 text-slate-300"
                      : "hover:bg-slate-100 text-slate-600"
                  }`}
                >
                  Export All Classes
                </button>
                <button
                  onClick={handleExportFavorites}
                  className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                    isDark
                      ? "hover:bg-slate-700 text-slate-300"
                      : "hover:bg-slate-100 text-slate-600"
                  }`}
                >
                  Export Favorites Only
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {filteredData.length === 0 && showOnlyFavorites && (
        <div
          className={`
            relative overflow-hidden text-center py-12 rounded-2xl border backdrop-blur-xl
            ${isDark ? "bg-slate-800/60 border-slate-700" : "bg-white border-slate-200 shadow-sm"}
          `}
        >
          <Heart className={`w-12 h-12 mx-auto mb-3 ${isDark ? "text-slate-600" : "text-slate-300"}`} />
          <h3 className={`text-lg font-bold mb-2 ${isDark ? "text-white" : "text-slate-900"}`}>
            {isAuthenticated ? "No Favorite Classes Yet" : "Sign in to Save Favorites"}
          </h3>
          <p className={`text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}>
            {isAuthenticated 
              ? "Click the heart icon on any class to add it to your favorites"
              : "Create an account to save your favorite classes and personalize your schedule"
            }
          </p>
        </div>
      )}

      {filteredData.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredData.map((classSession) => (
            <ClassCard
              key={classSession.id}
              classSession={classSession}
              isDark={isDark}
              isFavorite={isFavorite(classSession.id)}
              isHidden={isHidden(classSession.id)}
              reminderMinutes={getReminder(classSession.id)}
              customNote={getCustomNote(classSession.id)}
              onToggleFavorite={handleToggleFavorite}
              onToggleHidden={handleToggleHidden}
              onSetReminder={handleSetReminder}
              onRemoveReminder={isAuthenticated ? removeReminder : () => {
                setPendingAction('remove reminders');
                setShowLoginPrompt(true);
              }}
              onSetNote={handleSetNote}
              isAuthenticated={isAuthenticated}
            />
          ))}
        </div>
      )}

      {showLoginPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className={`relative w-full max-w-md rounded-2xl border p-6 ${
            isDark ? "bg-slate-800 border-slate-700" : "bg-white border-slate-200"
          }`}>
            <button
              onClick={() => {
                setShowLoginPrompt(false);
                setPendingAction(null);
              }}
              className={`absolute top-4 right-4 p-1.5 rounded-lg transition-colors ${
                isDark ? "hover:bg-slate-700" : "hover:bg-slate-100"
              }`}
            >
              <X className={`w-5 h-5 ${isDark ? "text-slate-400" : "text-slate-500"}`} />
            </button>

            <div className="text-center">
              <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4 ${
                isDark ? "bg-indigo-500/20" : "bg-indigo-100"
              }`}>
                <LogIn className={`w-8 h-8 ${isDark ? "text-indigo-400" : "text-indigo-600"}`} />
              </div>

              <h3 className={`text-xl font-bold mb-2 ${isDark ? "text-white" : "text-slate-900"}`}>
                Sign in Required
              </h3>
              <p className={`text-sm mb-6 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                You need to be signed in to {pendingAction}. Create an account or sign in to save your preferences.
              </p>

              <div className="flex gap-3">
                <Link
                  to="/login"
                  className={`flex-1 py-2.5 rounded-xl text-center font-medium transition-colors ${
                    isDark
                      ? "bg-slate-700 hover:bg-slate-600 text-white"
                      : "bg-slate-100 hover:bg-slate-200 text-slate-900"
                  }`}
                >
                  Sign In
                </Link>
                <Link
                  to="/signup"
                  className="flex-1 py-2.5 rounded-xl text-center font-medium bg-indigo-500 hover:bg-indigo-600 text-white"
                >
                  Create Account
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
