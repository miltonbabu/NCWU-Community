import { useState, useEffect, useCallback } from "react";
import type { ClassSession } from "@/types/schedule";

interface SchedulePreferences {
  favoriteClasses: string[];
  reminders: Record<string, number>;
  hiddenClasses: string[];
  customNotes: Record<string, string>;
}

const STORAGE_KEY = "schedule_preferences";

const defaultPreferences: SchedulePreferences = {
  favoriteClasses: [],
  reminders: {},
  hiddenClasses: [],
  customNotes: {},
};

export function useSchedulePreferences() {
  const [preferences, setPreferences] = useState<SchedulePreferences>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        return { ...defaultPreferences, ...JSON.parse(stored) };
      } catch {
        return defaultPreferences;
      }
    }
    return defaultPreferences;
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
  }, [preferences]);

  const toggleFavorite = useCallback((classId: string) => {
    setPreferences((prev) => {
      const isFavorite = prev.favoriteClasses.includes(classId);
      return {
        ...prev,
        favoriteClasses: isFavorite
          ? prev.favoriteClasses.filter((id) => id !== classId)
          : [...prev.favoriteClasses, classId],
      };
    });
  }, []);

  const setReminder = useCallback((classId: string, minutesBefore: number) => {
    setPreferences((prev) => ({
      ...prev,
      reminders: {
        ...prev.reminders,
        [classId]: minutesBefore,
      },
    }));
  }, []);

  const removeReminder = useCallback((classId: string) => {
    setPreferences((prev) => {
      const { [classId]: _, ...rest } = prev.reminders;
      return {
        ...prev,
        reminders: rest,
      };
    });
  }, []);

  const toggleHidden = useCallback((classId: string) => {
    setPreferences((prev) => {
      const isHidden = prev.hiddenClasses.includes(classId);
      return {
        ...prev,
        hiddenClasses: isHidden
          ? prev.hiddenClasses.filter((id) => id !== classId)
          : [...prev.hiddenClasses, classId],
      };
    });
  }, []);

  const setCustomNote = useCallback((classId: string, note: string) => {
    setPreferences((prev) => ({
      ...prev,
      customNotes: {
        ...prev.customNotes,
        [classId]: note,
      },
    }));
  }, []);

  const removeCustomNote = useCallback((classId: string) => {
    setPreferences((prev) => {
      const { [classId]: _removed2, ...rest } = prev.customNotes;
      return {
        ...prev,
        customNotes: rest,
      };
    });
  }, []);

  const isFavorite = useCallback(
    (classId: string) => preferences.favoriteClasses.includes(classId),
    [preferences.favoriteClasses],
  );

  const isHidden = useCallback(
    (classId: string) => preferences.hiddenClasses.includes(classId),
    [preferences.hiddenClasses],
  );

  const getReminder = useCallback(
    (classId: string) => preferences.reminders[classId] || null,
    [preferences.reminders],
  );

  const getCustomNote = useCallback(
    (classId: string) => preferences.customNotes[classId] || "",
    [preferences.customNotes],
  );

  const clearAllPreferences = useCallback(() => {
    setPreferences(defaultPreferences);
  }, []);

  return {
    preferences,
    toggleFavorite,
    isFavorite,
    setReminder,
    removeReminder,
    getReminder,
    toggleHidden,
    isHidden,
    setCustomNote,
    removeCustomNote,
    getCustomNote,
    clearAllPreferences,
  };
}

export function generateICSFile(
  classes: ClassSession[],
  favoritesOnly: boolean = false,
  favoriteIds: string[] = [],
): string {
  const filteredClasses = favoritesOnly
    ? classes.filter((c) => favoriteIds.includes(c.id))
    : classes;

  const dayMap: Record<string, number> = {
    Sunday: 0,
    Monday: 1,
    Tuesday: 2,
    Wednesday: 3,
    Thursday: 4,
    Friday: 5,
    Saturday: 6,
  };

  const formatDate = (date: Date): string => {
    return date.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
  };

  const getSemesterStart = (): Date => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth() >= 8 ? 8 : 1, 1);
  };

  const semesterStart = getSemesterStart();

  let icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//NCWU International//Class Schedule//EN
CALSCALE:GREGORIAN
METHOD:PUBLISH
X-WR-CALNAME:NCWU Class Schedule
X-WR-TIMEZONE:Asia/Shanghai
`;

  filteredClasses.forEach((cls) => {
    const dayOfWeek = dayMap[cls.day];
    const [startHour, startMin] = cls.startTime.split(":").map(Number);
    const [endHour, endMin] = cls.endTime.split(":").map(Number);

    const firstOccurrence = new Date(semesterStart);
    const daysUntilFirst = (dayOfWeek - semesterStart.getDay() + 7) % 7;
    firstOccurrence.setDate(
      semesterStart.getDate() + daysUntilFirst + (cls.week - 1) * 7,
    );
    firstOccurrence.setHours(startHour, startMin, 0, 0);

    const endOccurrence = new Date(firstOccurrence);
    endOccurrence.setHours(endHour, endMin, 0, 0);

    const untilDate = new Date(semesterStart);
    untilDate.setDate(untilDate.getDate() + 16 * 7);
    const untilStr = formatDate(untilDate).slice(0, 8);

    const uid = `${cls.id}@ncwu.edu.cn`;
    const dtstamp = formatDate(new Date());
    const dtstart = formatDate(firstOccurrence);
    const dtend = formatDate(endOccurrence);

    icsContent += `BEGIN:VEVENT
UID:${uid}
DTSTAMP:${dtstamp}
DTSTART;TZID=Asia/Shanghai:${dtstart.slice(0, 15)}
DTEND;TZID=Asia/Shanghai:${dtend.slice(0, 15)}
RRULE:FREQ=WEEKLY;UNTIL=${untilStr}T235959Z;BYDAY=${cls.day.slice(0, 2).toUpperCase()}
SUMMARY:${cls.subject}
LOCATION:${cls.room}
DESCRIPTION:Instructor: ${cls.instructor}\\nWeek: ${cls.week}\\nShift: ${cls.shift}
END:VEVENT
`;
  });

  icsContent += "END:VCALENDAR";
  return icsContent;
}

export function downloadScheduleICS(
  classes: ClassSession[],
  favoritesOnly: boolean = false,
  favoriteIds: string[] = [],
) {
  const icsContent = generateICSFile(classes, favoritesOnly, favoriteIds);
  const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `ncwu_schedule_${new Date().toISOString().split("T")[0]}.ics`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function useScheduleNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      return Notification.permission;
    }
    return "default";
  });
  const [scheduledNotifications, setScheduledNotifications] = useState<
    Set<string>
  >(new Set());

  const requestPermission = useCallback(async () => {
    if ("Notification" in window) {
      const result = await Notification.requestPermission();
      setPermission(result);
      return result;
    }
    return "denied" as NotificationPermission;
  }, []);

  const scheduleNotification = useCallback(
    (classSession: ClassSession, minutesBefore: number) => {
      if (permission !== "granted") return false;

      const now = new Date();
      const dayMap: Record<string, number> = {
        Sunday: 0,
        Monday: 1,
        Tuesday: 2,
        Wednesday: 3,
        Thursday: 4,
        Friday: 5,
        Saturday: 6,
      };

      const targetDay = dayMap[classSession.day];
      const currentDay = now.getDay();
      const daysUntil = (targetDay - currentDay + 7) % 7;

      const [startHour, startMin] = classSession.startTime
        .split(":")
        .map(Number);

      const classTime = new Date(now);
      classTime.setDate(now.getDate() + daysUntil);
      classTime.setHours(startHour, startMin, 0, 0);

      const notifyTime = new Date(
        classTime.getTime() - minutesBefore * 60 * 1000,
      );

      if (notifyTime <= now) {
        if (daysUntil === 0) {
          classTime.setDate(classTime.getDate() + 7);
          const nextNotifyTime = new Date(
            classTime.getTime() - minutesBefore * 60 * 1000,
          );
          if (nextNotifyTime <= now) return false;
        } else {
          return false;
        }
      }

      const timeUntilNotification = notifyTime.getTime() - now.getTime();
      const notificationId = `${classSession.id}-${minutesBefore}`;

      if (scheduledNotifications.has(notificationId)) {
        return true;
      }

      setTimeout(() => {
        if (Notification.permission === "granted") {
          new Notification("Upcoming Class Reminder", {
            body: `${classSession.subject} starts in ${minutesBefore} minutes!\n📍 ${classSession.room}\n👨‍🏫 ${classSession.instructor}`,
            icon: "/ncwu-logo.png",
            tag: notificationId,
          });
        }
        setScheduledNotifications((prev) => {
          const next = new Set(prev);
          next.delete(notificationId);
          return next;
        });
      }, timeUntilNotification);

      setScheduledNotifications((prev) => new Set(prev).add(notificationId));

      return true;
    },
    [permission, scheduledNotifications],
  );

  return {
    permission,
    requestPermission,
    scheduleNotification,
    isSupported: typeof Notification !== "undefined",
  };
}
