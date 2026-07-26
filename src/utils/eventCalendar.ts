import type { FamilyEvent } from '@/types/event';

/** YYYY-MM-DD dari bagian tanggal saja (hindari shift timezone). */
export function toDateKey(value: string | Date): string {
  if (typeof value === 'string') return value.slice(0, 10);
  const y = value.getFullYear();
  const m = String(value.getMonth() + 1).padStart(2, '0');
  const d = String(value.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function monthDateRange(year: number, month: number): {
  dateFrom: string;
  dateTo: string;
} {
  const dateFrom = `${year}-${String(month).padStart(2, '0')}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const dateTo = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
  return { dateFrom, dateTo };
}

/** Selaras BE: event overlap window [dateFrom, dateTo]. */
export function eventOverlapsRange(
  event: Pick<FamilyEvent, 'date' | 'endDate'>,
  dateFrom: string,
  dateTo: string,
): boolean {
  const start = toDateKey(event.date);
  const end = toDateKey(event.endDate ?? event.date);
  return start <= dateTo && end >= dateFrom;
}

export function shiftMonth(
  year: number,
  month: number,
  delta: number,
): { year: number; month: number } {
  const d = new Date(year, month - 1 + delta, 1);
  return { year: d.getFullYear(), month: d.getMonth() + 1 };
}

export type CalendarCell = {
  dateKey: string;
  day: number;
  inCurrentMonth: boolean;
  isToday: boolean;
};

/** Grid Senin–Minggu untuk satu bulan. */
export function buildMonthGrid(year: number, month: number): CalendarCell[] {
  const todayKey = toDateKey(new Date());
  const first = new Date(year, month - 1, 1);
  // getDay: 0=Min … 6=Sab → Senin=0
  const mondayIndex = (first.getDay() + 6) % 7;
  const daysInMonth = new Date(year, month, 0).getDate();
  const prevMonthDays = new Date(year, month - 1, 0).getDate();

  const cells: CalendarCell[] = [];

  for (let i = 0; i < mondayIndex; i++) {
    const day = prevMonthDays - mondayIndex + 1 + i;
    const d = new Date(year, month - 2, day);
    const dateKey = toDateKey(d);
    cells.push({
      dateKey,
      day,
      inCurrentMonth: false,
      isToday: dateKey === todayKey,
    });
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const dateKey = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    cells.push({
      dateKey,
      day,
      inCurrentMonth: true,
      isToday: dateKey === todayKey,
    });
  }

  while (cells.length % 7 !== 0) {
    const day = cells.length - (mondayIndex + daysInMonth) + 1;
    const d = new Date(year, month, day);
    const dateKey = toDateKey(d);
    cells.push({
      dateKey,
      day: d.getDate(),
      inCurrentMonth: false,
      isToday: dateKey === todayKey,
    });
  }

  return cells;
}

export function groupEventsByDate(
  events: FamilyEvent[],
  dateFrom: string,
  dateTo: string,
): Map<string, FamilyEvent[]> {
  const map = new Map<string, FamilyEvent[]>();
  for (const event of events) {
    if (!eventOverlapsRange(event, dateFrom, dateTo)) continue;
    const start = toDateKey(event.date);
    const end = toDateKey(event.endDate ?? event.date);
    let cursor = start < dateFrom ? dateFrom : start;
    const last = end > dateTo ? dateTo : end;
    while (cursor <= last) {
      const list = map.get(cursor) ?? [];
      list.push(event);
      map.set(cursor, list);
      cursor = addDays(cursor, 1);
    }
  }
  return map;
}

function addDays(dateKey: string, days: number): string {
  const [y, m, d] = dateKey.split('-').map(Number);
  const next = new Date(y, m - 1, d + days);
  return toDateKey(next);
}
