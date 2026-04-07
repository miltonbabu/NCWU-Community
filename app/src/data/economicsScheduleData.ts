import type { ClassSession } from '@/types/schedule';

const subjectColors: Record<string, { bg: string; border: string; text: string; hover: string; glow: string }> = {
  'Chinese Comprehensive 2': {
    bg: 'bg-orange-500/20',
    border: 'border-orange-400/30',
    text: 'text-orange-100',
    hover: 'hover:bg-orange-500/30',
    glow: 'shadow-orange-500/20',
  },
  'Chinese Water Culture': {
    bg: 'bg-blue-500/20',
    border: 'border-blue-400/30',
    text: 'text-blue-100',
    hover: 'hover:bg-blue-500/30',
    glow: 'shadow-blue-500/20',
  },
  'PE 2': {
    bg: 'bg-green-500/20',
    border: 'border-green-400/30',
    text: 'text-green-100',
    hover: 'hover:bg-green-500/30',
    glow: 'shadow-green-500/20',
  },
  'Appreciate Folk Music Sing Chinese': {
    bg: 'bg-rose-500/20',
    border: 'border-rose-400/30',
    text: 'text-rose-100',
    hover: 'hover:bg-rose-500/30',
    glow: 'shadow-rose-500/20',
  },
  'Advanced Mathematics B (1)': {
    bg: 'bg-purple-500/20',
    border: 'border-purple-400/30',
    text: 'text-purple-100',
    hover: 'hover:bg-purple-500/30',
    glow: 'shadow-purple-500/20',
  },
  'Computer and Information Technology': {
    bg: 'bg-cyan-500/20',
    border: 'border-cyan-400/30',
    text: 'text-cyan-100',
    hover: 'hover:bg-cyan-500/30',
    glow: 'shadow-cyan-500/20',
  },
  'Lab Project 1': {
    bg: 'bg-teal-500/20',
    border: 'border-teal-400/30',
    text: 'text-teal-100',
    hover: 'hover:bg-teal-500/30',
    glow: 'shadow-teal-500/20',
  },
  'Lab Project 2': {
    bg: 'bg-emerald-500/20',
    border: 'border-emerald-400/30',
    text: 'text-emerald-100',
    hover: 'hover:bg-emerald-500/30',
    glow: 'shadow-emerald-500/20',
  },
  'Lab Project 3': {
    bg: 'bg-lime-500/20',
    border: 'border-lime-400/30',
    text: 'text-lime-100',
    hover: 'hover:bg-lime-500/30',
    glow: 'shadow-lime-500/20',
  },
  'Lab Project 4': {
    bg: 'bg-yellow-500/20',
    border: 'border-yellow-400/30',
    text: 'text-yellow-100',
    hover: 'hover:bg-yellow-500/30',
    glow: 'shadow-yellow-500/20',
  },
  'Lab Project 5': {
    bg: 'bg-amber-500/20',
    border: 'border-amber-400/30',
    text: 'text-amber-100',
    hover: 'hover:bg-amber-500/30',
    glow: 'shadow-amber-500/20',
  },
  'Lab Project 6': {
    bg: 'bg-indigo-500/20',
    border: 'border-indigo-400/30',
    text: 'text-indigo-100',
    hover: 'hover:bg-indigo-500/30',
    glow: 'shadow-indigo-500/20',
  },
  'Chinese Listening & Speaking 2': {
    bg: 'bg-pink-500/20',
    border: 'border-pink-400/30',
    text: 'text-pink-100',
    hover: 'hover:bg-pink-500/30',
    glow: 'shadow-pink-500/20',
  },
};

function getShift(startTime: string): 'Morning' | 'Afternoon' | 'Evening' {
  const hour = parseInt(startTime.split(':')[0]);
  if (hour < 12) return 'Morning';
  if (hour < 18) return 'Afternoon';
  return 'Evening';
}

function parseWeeks(weekStr: string): number[] {
  if (weekStr.includes('-')) {
    const [start, end] = weekStr.split('-').map(Number);
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  }
  return [parseInt(weekStr)];
}

function createClassSession(
  id: string,
  day: ClassSession['day'],
  subject: string,
  instructor: string,
  room: string,
  startTime: string,
  endTime: string,
  week: number,
): ClassSession {
  const colors = subjectColors[subject] || {
    bg: 'bg-slate-500/20',
    border: 'border-slate-400/30',
    text: 'text-slate-100',
    hover: 'hover:bg-slate-500/30',
    glow: 'shadow-slate-500/20',
  };

  return {
    id: `${id}-w${week}`,
    subject,
    instructor,
    room,
    day,
    startTime,
    endTime,
    week,
    shift: getShift(startTime),
    bg: colors.bg,
    border: colors.border,
    text: colors.text,
    hover: colors.hover,
    glow: colors.glow,
  };
}

const rawData = [
  { day: 'Monday' as const, time: '09:55-12:30', subject: 'Chinese Comprehensive 2', instructor: 'Sha Cheng', room: 'Building 1 Room 1503', weeks: '1-16' },
  { day: 'Monday' as const, time: '15:55-18:30', subject: 'Chinese Water Culture', instructor: 'Rong Zhixie', room: 'Building 1 Room 1503', weeks: '1-16', notes: 'Sessions 8-9 only' },
  { day: 'Tuesday' as const, time: '08:00-09:40', subject: 'PE 2', instructor: 'Wang Yijin', room: 'School Track & Field', weeks: '1-16' },
  { day: 'Tuesday' as const, time: '14:00-15:40', subject: 'Appreciate Folk Music Sing Chinese', instructor: 'Wang Qing', room: 'Lab Building S4102', weeks: '1-16' },
  { day: 'Tuesday' as const, time: '15:55-17:35', subject: 'Advanced Mathematics B (1)', instructor: 'Zhao Xiaofeng', room: 'Building 1 Room 1505', weeks: '13', notes: 'Sessions 8-9 only (special week)' },
  { day: 'Tuesday' as const, time: '15:55-18:30', subject: 'Advanced Mathematics B (1)', instructor: 'Zhao Xiaofeng', room: 'Building 1 Room 1505', weeks: '1-12' },
  { day: 'Thursday' as const, time: '08:00-09:40', subject: 'Advanced Mathematics B (1)', instructor: 'Zhao Xiaofeng', room: 'Building 1 Room 1505', weeks: '1-13' },
  { day: 'Thursday' as const, time: '09:55-12:30', subject: 'Computer and Information Technology', instructor: 'Bai Xue', room: 'Building 2 Room 2204', weeks: '2-3' },
  { day: 'Thursday' as const, time: '09:55-12:30', subject: 'Lab Project 1', instructor: 'Bai Xue', room: 'Computer Lab S3-F101', weeks: '5' },
  { day: 'Thursday' as const, time: '09:55-12:30', subject: 'Lab Project 3', instructor: 'Bai Xue', room: 'Computer Lab S3-F101', weeks: '6' },
  { day: 'Thursday' as const, time: '09:55-12:30', subject: 'Lab Project 5', instructor: 'Bai Xue', room: 'Computer Lab S3-F101', weeks: '7' },
  { day: 'Friday' as const, time: '09:55-12:30', subject: 'Computer and Information Technology', instructor: 'Bai Xue', room: 'Building 2 Room 2205', weeks: '2-3' },
  { day: 'Friday' as const, time: '09:55-12:30', subject: 'Lab Project 2', instructor: 'Bai Xue', room: 'Computer Lab S3-F101', weeks: '5' },
  { day: 'Friday' as const, time: '09:55-12:30', subject: 'Lab Project 4', instructor: 'Bai Xue', room: 'Computer Lab S3-F101', weeks: '6' },
  { day: 'Friday' as const, time: '09:55-12:30', subject: 'Lab Project 6', instructor: 'Bai Xue', room: 'Computer Lab S3-F101', weeks: '7' },
  { day: 'Friday' as const, time: '14:00-15:40', subject: 'Chinese Listening & Speaking 2', instructor: 'Sha Cheng', room: 'Building 1 Room 1503', weeks: '1-16' },
];

export const economicsScheduleData: ClassSession[] = rawData.flatMap((item, index) => {
  const [startTime, endTime] = item.time.split('-');
  const weeks = parseWeeks(item.weeks);
  return weeks.map(week => 
    createClassSession(
      `econ-${index}`,
      item.day,
      item.subject,
      item.instructor,
      item.room,
      startTime,
      endTime,
      week,
    )
  );
});

export const economicsTotalWeeks = 16;

export const economicsSubjectsList = [
  { name: 'Chinese Comprehensive 2', bg: 'bg-orange-500/20', text: 'text-orange-100' },
  { name: 'Chinese Water Culture', bg: 'bg-blue-500/20', text: 'text-blue-100' },
  { name: 'PE 2', bg: 'bg-green-500/20', text: 'text-green-100' },
  { name: 'Appreciate Folk Music Sing Chinese', bg: 'bg-rose-500/20', text: 'text-rose-100' },
  { name: 'Advanced Mathematics B (1)', bg: 'bg-purple-500/20', text: 'text-purple-100' },
  { name: 'Computer and Information Technology', bg: 'bg-cyan-500/20', text: 'text-cyan-100' },
  { name: 'Lab Project 1', bg: 'bg-teal-500/20', text: 'text-teal-100' },
  { name: 'Lab Project 2', bg: 'bg-emerald-500/20', text: 'text-emerald-100' },
  { name: 'Lab Project 3', bg: 'bg-lime-500/20', text: 'text-lime-100' },
  { name: 'Lab Project 4', bg: 'bg-yellow-500/20', text: 'text-yellow-100' },
  { name: 'Lab Project 5', bg: 'bg-amber-500/20', text: 'text-amber-100' },
  { name: 'Lab Project 6', bg: 'bg-indigo-500/20', text: 'text-indigo-100' },
  { name: 'Chinese Listening & Speaking 2', bg: 'bg-pink-500/20', text: 'text-pink-100' },
];
