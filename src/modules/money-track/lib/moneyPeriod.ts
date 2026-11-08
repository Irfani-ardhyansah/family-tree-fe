/**
 * Periode Money Track — jadwal reset / gajian.
 *
 * Sumber kebenaran tetap BE (`GET/PUT /money/preferences` → `period`).
 * Helper di sini dipakai untuk normalisasi cache, preview saat user mengubah
 * setting, dan fallback saat response BE belum membawa `period.current`.
 */

import { formatDateOnlyLabel } from '@/modules/money-track/lib/dateOnly';

export type MoneyPeriodStartMode = 'fixed_day' | 'last_day' | 'last_workday';

export type MoneyPeriodWeekendAdjust =
  | 'none'
  | 'previous_workday'
  | 'next_workday';

export type MoneyPeriodSettings = {
  /** Aturan tanggal mulai periode. */
  startMode: MoneyPeriodStartMode;
  /** 1–31; hanya dipakai saat `startMode = "fixed_day"`. */
  startDay: number;
  /** Geser tanggal mulai kalau jatuh Sabtu/Minggu. */
  weekendAdjust: MoneyPeriodWeekendAdjust;
  /** Libur manual `YYYY-MM-DD` (maks. 366). */
  holidays: string[];
};

export type MoneyPeriodCurrent = {
  /** Key periode = bulan tempat periode mulai (`YYYY-MM`). */
  yearMonth: string;
  label: string;
  from: string;
  to: string;
};

export const MAX_PERIOD_HOLIDAYS = 366;

export const DEFAULT_MONEY_PERIOD_SETTINGS: MoneyPeriodSettings = {
  startMode: 'fixed_day',
  startDay: 1,
  weekendAdjust: 'none',
  holidays: [],
};

const START_MODES: readonly MoneyPeriodStartMode[] = [
  'fixed_day',
  'last_day',
  'last_workday',
];

const WEEKEND_ADJUSTS: readonly MoneyPeriodWeekendAdjust[] = [
  'none',
  'previous_workday',
  'next_workday',
];

const DATE_ONLY_RE = /^\d{4}-\d{2}-\d{2}$/;

function isValidDateOnly(value: string): boolean {
  if (!DATE_ONLY_RE.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return (
    !Number.isNaN(date.getTime()) &&
    date.toISOString().slice(0, 10) === value
  );
}

export function normalizePeriodHolidays(value: unknown): string[] {
  let raw = value;
  if (typeof raw === 'string') {
    try {
      raw = JSON.parse(raw);
    } catch {
      return [];
    }
  }
  if (!Array.isArray(raw)) return [];
  const seen = new Set<string>();
  const result: string[] = [];
  for (const item of raw) {
    if (typeof item !== 'string') continue;
    const date = item.trim();
    if (!isValidDateOnly(date) || seen.has(date)) continue;
    seen.add(date);
    result.push(date);
    if (result.length >= MAX_PERIOD_HOLIDAYS) break;
  }
  return result.sort();
}

/** Terima shape apa pun (API/cache) → setting periode yang valid. */
export function normalizeMoneyPeriodSettings(value: unknown): MoneyPeriodSettings {
  const row = (value ?? {}) as Record<string, unknown>;
  const startMode = START_MODES.includes(row.startMode as MoneyPeriodStartMode)
    ? (row.startMode as MoneyPeriodStartMode)
    : DEFAULT_MONEY_PERIOD_SETTINGS.startMode;
  const startDayRaw =
    typeof row.startDay === 'number' ? row.startDay : Number(row.startDay);
  const startDay =
    Number.isInteger(startDayRaw) && startDayRaw >= 1 && startDayRaw <= 31
      ? startDayRaw
      : DEFAULT_MONEY_PERIOD_SETTINGS.startDay;
  const weekendAdjust = WEEKEND_ADJUSTS.includes(
    row.weekendAdjust as MoneyPeriodWeekendAdjust,
  )
    ? (row.weekendAdjust as MoneyPeriodWeekendAdjust)
    : DEFAULT_MONEY_PERIOD_SETTINGS.weekendAdjust;

  return {
    startMode,
    startDay,
    weekendAdjust,
    holidays: normalizePeriodHolidays(row.holidays),
  };
}

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

function utcDate(year: number, month: number, day: number): Date {
  return new Date(Date.UTC(year, month - 1, day));
}

function formatUtcDate(date: Date): string {
  return `${date.getUTCFullYear()}-${pad2(date.getUTCMonth() + 1)}-${pad2(
    date.getUTCDate(),
  )}`;
}

function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

function isNonWorkday(date: Date, holidays: Set<string>): boolean {
  const day = date.getUTCDay();
  return day === 0 || day === 6 || holidays.has(formatUtcDate(date));
}

function shiftToWorkday(
  date: Date,
  direction: 'previous' | 'next',
  holidays: Set<string>,
): Date {
  const step = direction === 'previous' ? -1 : 1;
  let result = date;
  while (isNonWorkday(result, holidays)) {
    result = new Date(result.getTime() + step * 86_400_000);
  }
  return result;
}

/** Tanggal/kalender Jakarta (WIB), aman dari pergeseran UTC. */
export function jakartaDateParts(date = new Date()): {
  yearMonth: string;
  date: string;
} {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const year = parts.find((p) => p.type === 'year')?.value ?? '1970';
  const month = parts.find((p) => p.type === 'month')?.value ?? '01';
  const day = parts.find((p) => p.type === 'day')?.value ?? '01';
  return {
    yearMonth: `${year}-${month}`,
    date: `${year}-${month}-${day}`,
  };
}

/** Tanggal mulai periode untuk key `yearMonth` (bulan tempat periode mulai). */
export function resolvePeriodStartDate(
  yearMonth: string,
  settings: MoneyPeriodSettings = DEFAULT_MONEY_PERIOD_SETTINGS,
): string {
  const [year, month] = yearMonth.split('-').map(Number);
  const lastDay = daysInMonth(year!, month!);
  const holidays = new Set(settings.holidays ?? []);

  if (settings.startMode === 'last_workday') {
    return formatUtcDate(
      shiftToWorkday(utcDate(year!, month!, lastDay), 'previous', holidays),
    );
  }

  const baseDay =
    settings.startMode === 'last_day'
      ? lastDay
      : Math.min(Math.max(1, settings.startDay), lastDay);

  let start = utcDate(year!, month!, baseDay);
  if (settings.weekendAdjust === 'previous_workday') {
    start = shiftToWorkday(start, 'previous', holidays);
  } else if (settings.weekendAdjust === 'next_workday') {
    start = shiftToWorkday(start, 'next', holidays);
  }
  return formatUtcDate(start);
}

export function nextYearMonth(yearMonth: string): string {
  const [year, month] = yearMonth.split('-').map(Number);
  const date = new Date(Date.UTC(year!, month! - 1, 1));
  date.setUTCMonth(date.getUTCMonth() + 1);
  return `${date.getUTCFullYear()}-${pad2(date.getUTCMonth() + 1)}`;
}

export function previousYearMonth(yearMonth: string): string {
  const [year, month] = yearMonth.split('-').map(Number);
  const date = new Date(Date.UTC(year!, month! - 1, 1));
  date.setUTCMonth(date.getUTCMonth() - 1);
  return `${date.getUTCFullYear()}-${pad2(date.getUTCMonth() + 1)}`;
}

/** Rentang inklusif satu periode; antar-periode selalu nyambung. */
export function periodDateRange(
  yearMonth: string,
  settings: MoneyPeriodSettings = DEFAULT_MONEY_PERIOD_SETTINGS,
): { from: string; to: string } {
  const from = resolvePeriodStartDate(yearMonth, settings);
  const nextStart = resolvePeriodStartDate(nextYearMonth(yearMonth), settings);
  const to = formatUtcDate(
    new Date(new Date(`${nextStart}T00:00:00.000Z`).getTime() - 86_400_000),
  );
  return { from, to };
}

/** Key periode yang sedang berjalan pada `date` (default: sekarang, WIB). */
export function currentPeriodYearMonth(
  settings: MoneyPeriodSettings = DEFAULT_MONEY_PERIOD_SETTINGS,
  date = new Date(),
): string {
  const { yearMonth, date: today } = jakartaDateParts(date);

  let candidate = yearMonth;
  for (let i = 0; i < 24; i += 1) {
    if (resolvePeriodStartDate(candidate, settings) <= today) break;
    candidate = previousYearMonth(candidate);
  }
  for (let i = 0; i < 24; i += 1) {
    const next = nextYearMonth(candidate);
    if (resolvePeriodStartDate(next, settings) > today) break;
    candidate = next;
  }
  return candidate;
}

export function yearMonthLabel(yearMonth: string): string {
  const [year, month] = yearMonth.split('-').map(Number);
  const date = new Date(Date.UTC(year!, month! - 1, 1));
  return new Intl.DateTimeFormat('id-ID', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(date);
}

/** Periode berjalan lengkap dengan label & rentang tanggal. */
export function currentPeriodDto(
  settings: MoneyPeriodSettings = DEFAULT_MONEY_PERIOD_SETTINGS,
  date = new Date(),
): MoneyPeriodCurrent {
  const yearMonth = currentPeriodYearMonth(settings, date);
  const { from, to } = periodDateRange(yearMonth, settings);
  return { yearMonth, label: yearMonthLabel(yearMonth), from, to };
}

function isValidYearMonth(value: string): boolean {
  if (!/^\d{4}-\d{2}$/.test(value)) return false;
  const month = Number(value.slice(5, 7));
  return month >= 1 && month <= 12;
}

/**
 * Pakai `current` dari BE bila valid; kalau tidak ada / rusak, hitung lokal
 * memakai setting yang sama supaya UI tetap punya preview.
 */
export function normalizeMoneyPeriodCurrent(
  value: unknown,
  settings: MoneyPeriodSettings,
  date = new Date(),
): MoneyPeriodCurrent {
  const row = (value ?? {}) as Record<string, unknown>;
  const yearMonth = typeof row.yearMonth === 'string' ? row.yearMonth : '';
  const from = typeof row.from === 'string' ? row.from.slice(0, 10) : '';
  const to = typeof row.to === 'string' ? row.to.slice(0, 10) : '';
  if (isValidYearMonth(yearMonth) && isValidDateOnly(from) && isValidDateOnly(to)) {
    return {
      yearMonth,
      label:
        typeof row.label === 'string' && row.label.trim()
          ? row.label
          : yearMonthLabel(yearMonth),
      from,
      to,
    };
  }
  return currentPeriodDto(settings, date);
}

function stripYear(label: string): string {
  return label.replace(/\s+\d{4}$/, '');
}

/** `30 Okt 2026 – 29 Nov 2026` */
export function formatPeriodRangeLong(from: string, to: string): string {
  if (!from || !to) return '';
  return `${formatDateOnlyLabel(from)} – ${formatDateOnlyLabel(to)}`;
}

/** `30 Okt–29 Nov` (year ikut kalau beda tahun). */
export function formatPeriodRangeShort(from: string, to: string): string {
  if (!from || !to) return '';
  const fromLabel = formatDateOnlyLabel(from);
  const toLabel = formatDateOnlyLabel(to);
  if (from.slice(0, 4) === to.slice(0, 4)) {
    return `${stripYear(fromLabel)}–${stripYear(toLabel)}`;
  }
  return `${fromLabel}–${toLabel}`;
}

/** `Oktober 2026 · 30 Okt–29 Nov` */
export function formatPeriodHeading(
  label: string,
  from: string | null | undefined,
  to: string | null | undefined,
): string {
  if (!from || !to) return label;
  const range = formatPeriodRangeShort(from, to);
  return range ? `${label} · ${range}` : label;
}
