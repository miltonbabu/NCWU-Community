import { useState, useEffect, useCallback } from "react";

export interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  type: string;
  description?: string;
  time?: string;
  location?: string;
  endTime?: string;
  category?: string;
  isPast?: boolean;
}

export interface EventRSVP {
  id: string;
  event_id: string;
  user_id: string;
  status: string;
  eventId?: string;
  userId?: string;
  createdAt?: string;
}

export interface EventReminder {
  id: string;
  event_id: string;
  reminder_time: string;
  eventId?: string;
  minutesBefore?: number;
}

export interface EventPhoto {
  id: string;
  event_id: string;
  url: string;
  eventId?: string;
  caption?: string;
  uploadedAt?: string;
  uploadedBy?: string;
}

export interface EventCategory {
  id: string;
  name: string;
  icon?: string;
}

export type EventCategoryType =
  | "academic"
  | "cultural"
  | "sports"
  | "social"
  | "workshop"
  | "career"
  | "other";

const RSVP_STORAGE_KEY = "event_rsvps";
const REMINDERS_STORAGE_KEY = "event_reminders";

export function useEventRSVP(eventId: string) {
  const [rsvps, setRsvps] = useState<Record<string, EventRSVP>>(() => {
    const stored = localStorage.getItem(RSVP_STORAGE_KEY);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        return {};
      }
    }
    return {};
  });

  useEffect(() => {
    localStorage.setItem(RSVP_STORAGE_KEY, JSON.stringify(rsvps));
  }, [rsvps]);

  const userRSVP = rsvps[eventId];

  const setRSVP = useCallback(
    (
      status: "going" | "interested" | "not_going",
      userId: string = "guest",
    ) => {
      setRsvps((prev) => ({
        ...prev,
        [eventId]: {
          id: `rsvp-${Date.now()}`,
          event_id: eventId,
          user_id: userId,
          eventId,
          userId,
          status,
          createdAt: new Date().toISOString(),
        },
      }));
    },
    [eventId],
  );

  const removeRSVP = useCallback(() => {
    setRsvps((prev) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { [eventId]: _, ...rest } = prev;
      return rest;
    });
  }, [eventId]);

  const getRSVPStatus = useCallback(() => {
    return rsvps[eventId]?.status || null;
  }, [rsvps, eventId]);

  return {
    userRSVP,
    setRSVP,
    removeRSVP,
    getRSVPStatus,
  };
}

export function useEventReminders() {
  const [reminders, setReminders] = useState<Record<string, EventReminder>>(
    () => {
      const stored = localStorage.getItem(REMINDERS_STORAGE_KEY);
      if (stored) {
        try {
          return JSON.parse(stored);
        } catch {
          return {};
        }
      }
      return {};
    },
  );

  useEffect(() => {
    localStorage.setItem(REMINDERS_STORAGE_KEY, JSON.stringify(reminders));
  }, [reminders]);

  const setReminder = useCallback((eventId: string, minutesBefore: number) => {
    setReminders((prev) => ({
      ...prev,
      [eventId]: {
        id: `reminder-${Date.now()}`,
        event_id: eventId,
        reminder_time: new Date(
          Date.now() + minutesBefore * 60 * 1000,
        ).toISOString(),
        eventId,
        minutesBefore,
      },
    }));
  }, []);

  const removeReminder = useCallback((eventId: string) => {
    setReminders((prev) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { [eventId]: _, ...rest } = prev;
      return rest;
    });
  }, []);

  const getReminder = useCallback(
    (eventId: string) => {
      return reminders[eventId] || null;
    },
    [reminders],
  );

  return {
    reminders,
    setReminder,
    removeReminder,
    getReminder,
  };
}

export function useEventNotifications() {
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

  const scheduleEventNotification = useCallback(
    (event: CalendarEvent, minutesBefore: number) => {
      if (permission !== "granted") return false;

      const eventDateTime = new Date(`${event.date}T${event.time}`);
      const notifyTime = new Date(
        eventDateTime.getTime() - minutesBefore * 60 * 1000,
      );
      const now = new Date();

      if (notifyTime <= now) return false;

      const timeUntilNotification = notifyTime.getTime() - now.getTime();
      const notificationId = `${event.id}-${minutesBefore}`;

      if (scheduledNotifications.has(notificationId)) return true;

      setTimeout(() => {
        if (Notification.permission === "granted") {
          new Notification("Event Reminder", {
            body: `${event.title} starts in ${minutesBefore} minutes!\n📍 ${event.location}`,
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
    scheduleEventNotification,
    isSupported: typeof Notification !== "undefined",
  };
}

export function generateEventICS(event: CalendarEvent): string {
  const formatDate = (date: Date): string => {
    return date.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
  };

  const eventDate = new Date(`${event.date}T${event.time}`);
  const endDate = event.endTime
    ? new Date(`${event.date}T${event.endTime}`)
    : new Date(eventDate.getTime() + 2 * 60 * 60 * 1000);

  const uid = `${event.id}@ncwu.edu.cn`;
  const dtstamp = formatDate(new Date());
  const dtstart = formatDate(eventDate);
  const dtend = formatDate(endDate);

  return `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//NCWU International//Events//EN
CALSCALE:GREGORIAN
METHOD:PUBLISH
BEGIN:VEVENT
UID:${uid}
DTSTAMP:${dtstamp}
DTSTART:${dtstart}
DTEND:${dtend}
SUMMARY:${event.title}
LOCATION:${event.location}
DESCRIPTION:${event.description}
CATEGORIES:${event.category.toUpperCase()}
END:VEVENT
END:VCALENDAR`;
}

export function downloadEventICS(event: CalendarEvent) {
  const icsContent = generateEventICS(event);
  const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${event.title.replace(/[^a-z0-9]/gi, "_").toLowerCase()}.ics`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function useEventFilters(events: CalendarEvent[]) {
  const [selectedCategory, setSelectedCategory] = useState<
    EventCategory | "all"
  >("all");
  const [showPastEvents, setShowPastEvents] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const categories: EventCategoryType[] = [
    "academic",
    "cultural",
    "sports",
    "social",
    "workshop",
    "career",
    "other",
  ];

  const filteredEvents = events.filter((event) => {
    if (selectedCategory !== "all" && event.category !== selectedCategory)
      return false;
    if (!showPastEvents && event.isPast) return false;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesTitle = event.title.toLowerCase().includes(query);
      const matchesDescription = event.description
        .toLowerCase()
        .includes(query);
      const matchesLocation = event.location.toLowerCase().includes(query);
      if (!matchesTitle && !matchesDescription && !matchesLocation)
        return false;
    }
    return true;
  });

  const upcomingEvents = filteredEvents.filter((e) => !e.isPast);
  const pastEvents = filteredEvents.filter((e) => e.isPast);

  return {
    selectedCategory,
    setSelectedCategory,
    showPastEvents,
    setShowPastEvents,
    searchQuery,
    setSearchQuery,
    categories,
    filteredEvents,
    upcomingEvents,
    pastEvents,
  };
}

export function useEventPhotos(eventId: string) {
  const [photos, setPhotos] = useState<EventPhoto[]>(() => {
    const stored = localStorage.getItem(`event_photos_${eventId}`);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        return [];
      }
    }
    return [];
  });

  useEffect(() => {
    localStorage.setItem(`event_photos_${eventId}`, JSON.stringify(photos));
  }, [photos, eventId]);

  const addPhoto = useCallback(
    (url: string, caption?: string, userId: string = "guest") => {
      const newPhoto: EventPhoto = {
        id: `photo-${Date.now()}`,
        event_id: eventId,
        eventId,
        url,
        caption,
        uploadedAt: new Date().toISOString(),
        uploadedBy: userId,
      };
      setPhotos((prev) => [...prev, newPhoto]);
      return newPhoto;
    },
    [eventId],
  );

  const removePhoto = useCallback((photoId: string) => {
    setPhotos((prev) => prev.filter((p) => p.id !== photoId));
  }, []);

  const updatePhotoCaption = useCallback((photoId: string, caption: string) => {
    setPhotos((prev) =>
      prev.map((p) => (p.id === photoId ? { ...p, caption } : p)),
    );
  }, []);

  return {
    photos,
    addPhoto,
    removePhoto,
    updatePhotoCaption,
  };
}
