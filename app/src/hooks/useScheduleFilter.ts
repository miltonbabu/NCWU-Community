import { useMemo } from 'react';
import type { ClassSession, FilterState } from '@/types/schedule';

export function useScheduleFilter(classes: ClassSession[], filters: FilterState): ClassSession[] {
  return useMemo(() => {
    return classes.filter((classSession) => {
      if (filters.search) {
        const searchLower = filters.search.toLowerCase().trim();
        const searchTerms = searchLower.split(/\s+/);
        
        const searchableFields = [
          classSession.subject.toLowerCase(),
          classSession.instructor.toLowerCase(),
          classSession.room.toLowerCase(),
          classSession.day.toLowerCase(),
          classSession.shift.toLowerCase(),
        ];
        
        const matchesAllTerms = searchTerms.every(term => 
          searchableFields.some(field => field.includes(term))
        );
        
        if (!matchesAllTerms) return false;
      }

      if (filters.week !== 'all' && classSession.week !== filters.week) {
        return false;
      }

      if (filters.shift !== 'all' && classSession.shift !== filters.shift) {
        return false;
      }

      if (filters.day !== 'all' && classSession.day !== filters.day) {
        return false;
      }

      return true;
    });
  }, [classes, filters]);
}
