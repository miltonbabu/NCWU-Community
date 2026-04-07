export interface ClassSession {
  id: string;
  subject: string;
  instructor: string;
  teacher?: string;
  room: string;
  day:
    | "Monday"
    | "Tuesday"
    | "Wednesday"
    | "Thursday"
    | "Friday"
    | "Saturday"
    | "Sunday";
  startTime: string;
  endTime: string;
  week: number;
  shift: "Morning" | "Afternoon" | "Evening" | "Night";
  type?: string;
  bg: string;
  border: string;
  text: string;
  hover: string;
  glow: string;
}

export interface FilterState {
  search: string;
  week: number | "all";
  shift: "all" | "Morning" | "Afternoon" | "Evening" | "Night";
  day: "all" | ClassSession["day"];
}

export interface SubjectInfo {
  name: string;
  bg: string;
  text: string;
}

export const DAYS: ClassSession["day"][] = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];
export const SHIFTS: ClassSession["shift"][] = [
  "Morning",
  "Afternoon",
  "Evening",
  "Night",
];

// Day abbreviations for mobile
export const DAY_ABBREVS: Record<string, string> = {
  Monday: "Mon",
  Tuesday: "Tue",
  Wednesday: "Wed",
  Thursday: "Thu",
  Friday: "Fri",
  Saturday: "Sat",
  Sunday: "Sun",
};
