import type { CalendarEvent } from '@/modules/family-core/types';

export function toDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function parseDateKey(key: string): Date {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y!, m! - 1, d!, 12, 0, 0, 0);
}

export function formatDayLabel(key: string): string {
  return parseDateKey(key).toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export function formatMonthLabel(year: number, monthIndex: number): string {
  return new Date(year, monthIndex, 1).toLocaleDateString('id-ID', {
    month: 'long',
    year: 'numeric',
  });
}

export function eventOccursOn(event: CalendarEvent, dateKey: string): boolean {
  if (!event.endDate || event.endDate === event.date) {
    return event.date === dateKey;
  }
  return dateKey >= event.date && dateKey <= event.endDate;
}

export function buildMonthCells(year: number, monthIndex: number): (string | null)[] {
  const first = new Date(year, monthIndex, 1, 12);
  // Monday-first grid
  const weekday = (first.getDay() + 6) % 7;
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const cells: (string | null)[] = [];
  for (let i = 0; i < weekday; i++) cells.push(null);
  for (let day = 1; day <= daysInMonth; day++) {
    cells.push(toDateKey(new Date(year, monthIndex, day, 12)));
  }
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

export function sortEvents(events: CalendarEvent[]): CalendarEvent[] {
  return [...events].sort((a, b) => {
    if (a.date !== b.date) return a.date.localeCompare(b.date);
    if (a.allDay && !b.allDay) return -1;
    if (!a.allDay && b.allDay) return 1;
    return (a.time ?? '').localeCompare(b.time ?? '');
  });
}
