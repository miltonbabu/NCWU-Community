import { useState, useEffect, useMemo } from 'react';
import type { ClassSession } from '@/types/schedule';

type ClassSessionShift = ClassSession['shift'];

// Semester start date - Week 1 starts on Monday of this week
// Weeks start on Monday. March 24, 2026 is Tuesday of Week 4
// Week 4 Monday = March 23, Week 1 Monday = March 2, 2026
const SEMESTER_START_DATE = new Date('2026-03-02T00:00:00+08:00');

// Time threshold for "Starting Soon" (2 hours in minutes)
const STARTING_SOON_THRESHOLD_MINUTES = 120;

export interface RealTimeInfo {
  currentWeek: number;
  currentDay: ClassSession['day'];
  currentShift: ClassSessionShift;
  currentTime: string;
  currentDate: Date;
  isLive: boolean;
}

export interface TodayCourseInfo {
  todayClasses: ClassSession[];
  currentClass: ClassSession | null;
  nextClass: ClassSession | null;
  upcomingClasses: ClassSession[];
  startingSoonClasses: ClassSession[];
}

export interface ClassStatus {
  isLive: boolean;
  isStartingSoon: boolean;
  isNext: boolean;
  isPast: boolean;
  isUpcoming: boolean;
}

// Get day name from date
function getDayName(date: Date): ClassSession['day'] {
  const days: ClassSession['day'][] = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[date.getDay()];
}

// Get shift from time (Chinese timezone)
function getShiftFromTime(time: string): ClassSessionShift {
  const hour = parseInt(time.split(':')[0], 10);
  if (hour >= 5 && hour < 12) return 'Morning';
  if (hour >= 12 && hour < 18) return 'Afternoon';
  if (hour >= 18 && hour < 22) return 'Evening';
  return 'Night'; // 22:00 - 04:59 is Night
}

// Get current time in HH:MM format (Chinese timezone)
function getCurrentTimeString(date: Date): string {
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
}

// Convert time string to minutes since midnight
function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

// Calculate current week number based on semester start
function calculateCurrentWeek(currentDate: Date): number {
  const diffTime = currentDate.getTime() - SEMESTER_START_DATE.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  const weekNumber = Math.floor(diffDays / 7) + 1;
  return Math.max(1, Math.min(16, weekNumber)); // Clamp between 1-16
}

// Check if a class is currently happening
function isClassHappening(classSession: ClassSession, currentTime: string): boolean {
  return currentTime >= classSession.startTime && currentTime < classSession.endTime;
}

// Check if a class is in the future today
function isClassInFuture(classSession: ClassSession, currentTime: string): boolean {
  return currentTime < classSession.startTime;
}

// Check if a class is starting within the threshold (default 2 hours)
function isClassStartingSoon(classSession: ClassSession, currentTime: string, thresholdMinutes: number = STARTING_SOON_THRESHOLD_MINUTES): boolean {
  const currentMinutes = timeToMinutes(currentTime);
  const classStartMinutes = timeToMinutes(classSession.startTime);
  const diffMinutes = classStartMinutes - currentMinutes;
  return diffMinutes > 0 && diffMinutes <= thresholdMinutes;
}

// Check if a class has ended
function isClassEnded(classSession: ClassSession, currentTime: string): boolean {
  return currentTime >= classSession.endTime;
}

// Get class status
export function getClassStatus(classSession: ClassSession, currentTime: string, nextClassId: string | null): ClassStatus {
  const isLive = isClassHappening(classSession, currentTime);
  const isPast = isClassEnded(classSession, currentTime);
  const isUpcoming = isClassInFuture(classSession, currentTime);
  const isStartingSoon = isClassStartingSoon(classSession, currentTime);
  const isNext = nextClassId === classSession.id;

  return {
    isLive,
    isStartingSoon,
    isNext,
    isPast,
    isUpcoming,
  };
}

export function useRealTimeSchedule(allClasses: ClassSession[]) {
  const [currentDate, setCurrentDate] = useState<Date>(() => {
    // Initialize with Chinese timezone
    return new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Shanghai' }));
  });

  // Update time every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentDate(new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Shanghai' })));
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  // Calculate real-time info
  const realTimeInfo: RealTimeInfo = useMemo(() => {
    const currentWeek = calculateCurrentWeek(currentDate);
    const currentDay = getDayName(currentDate);
    const currentTime = getCurrentTimeString(currentDate);
    const currentShift = getShiftFromTime(currentTime);

    return {
      currentWeek,
      currentDay,
      currentShift,
      currentTime,
      currentDate,
      isLive: true,
    };
  }, [currentDate]);

  // Filter today's classes for current week
  const todayCourseInfo: TodayCourseInfo = useMemo(() => {
    // Get all classes for today's week and day
    const todayClasses = allClasses.filter(
      (c) => c.week === realTimeInfo.currentWeek && c.day === realTimeInfo.currentDay
    );

    // Sort by start time
    const sortedClasses = [...todayClasses].sort((a, b) => 
      a.startTime.localeCompare(b.startTime)
    );

    // Find current class (happening now)
    const currentClass = sortedClasses.find((c) => 
      isClassHappening(c, realTimeInfo.currentTime)
    ) || null;

    // Find upcoming classes (not started yet)
    const upcomingClasses = sortedClasses.filter((c) => 
      isClassInFuture(c, realTimeInfo.currentTime)
    );

    // Find classes starting soon (within 2 hours)
    const startingSoonClasses = sortedClasses.filter((c) => 
      isClassStartingSoon(c, realTimeInfo.currentTime)
    );

    // Find next class (first future class)
    const nextClass = upcomingClasses.length > 0 ? upcomingClasses[0] : null;

    return {
      todayClasses: sortedClasses,
      currentClass,
      nextClass,
      upcomingClasses,
      startingSoonClasses,
    };
  }, [allClasses, realTimeInfo]);

  return {
    realTimeInfo,
    todayCourseInfo,
  };
}

// Format time for display
export function formatTime(time: string): string {
  return time;
}

// Get greeting based on time
export function getGreeting(shift: ClassSessionShift): string {
  switch (shift) {
    case 'Morning':
      return 'Good Morning';
    case 'Afternoon':
      return 'Good Afternoon';
    case 'Evening':
      return 'Good Evening';
    case 'Night':
      return 'Good Night';
    default:
      return 'Hello';
  }
}
