import type { AnalyticsDatePreset, AnalyticsQuery } from '@/modules/admin/analyticsTypes';

export const JAKARTA_TZ = 'Asia/Jakarta';

export function isAbortError(error: unknown): boolean {
  return (
    (error instanceof DOMException && error.name === 'AbortError') ||
    (error instanceof Error && error.name === 'AbortError')
  );
}

export function jakartaTodayYmd(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: JAKARTA_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

export function addDaysYmd(ymd: string, days: number): string {
  const [year, month, day] = ymd.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export function rangeForPreset(
  preset: Exclude<AnalyticsDatePreset, 'custom'>,
): Pick<AnalyticsQuery, 'from' | 'to'> {
  const to = jakartaTodayYmd();
  if (preset === 'today') return { from: to, to };
  if (preset === '7d') return { from: addDaysYmd(to, -6), to };
  if (preset === '30d') return { from: addDaysYmd(to, -29), to };
  return { from: addDaysYmd(to, -13), to };
}

export function detectPreset(from: string, to: string): AnalyticsDatePreset {
  const today = jakartaTodayYmd();
  if (to !== today) return 'custom';
  if (from === today) return 'today';
  if (from === addDaysYmd(today, -6)) return '7d';
  if (from === addDaysYmd(today, -13)) return '14d';
  if (from === addDaysYmd(today, -29)) return '30d';
  return 'custom';
}

function jakartaParts(iso: string) {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: JAKARTA_TZ,
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(new Date(iso));
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((p) => p.type === type)?.value ?? '';
  return {
    day: get('day'),
    month: get('month'),
    year: get('year'),
    hour: get('hour'),
    minute: get('minute'),
  };
}

export function formatJakartaDateTime(iso: string): string {
  const p = jakartaParts(iso);
  return `${p.day} ${p.month} ${p.year}, ${p.hour}:${p.minute}`;
}

export function formatJakartaTime(iso: string): string {
  const p = jakartaParts(iso);
  return `${p.hour}:${p.minute}`;
}

export function formatYmdLabel(ymd: string, withYear = false): string {
  const [year, month, day] = ymd.split('-').map(Number);
  if (!year || !month || !day) return ymd;
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
    year: withYear ? 'numeric' : undefined,
  }).format(new Date(year, month - 1, day));
}

export function formatRangeEcho(from: string, to: string): string {
  const sameYear = from.slice(0, 4) === to.slice(0, 4);
  const start = formatYmdLabel(from, !sameYear);
  const end = formatYmdLabel(to, true);
  return `Periode ${start} – ${end} · ${JAKARTA_TZ}`;
}

export function formatCount(value: number): string {
  if (value >= 1_000_000) {
    const n = value / 1_000_000;
    return `${n.toFixed(n >= 10 ? 0 : 1).replace(/\.0$/, '')}jt`;
  }
  if (value >= 1000) {
    const n = value / 1000;
    return `${n.toFixed(n >= 10 ? 0 : 1).replace(/\.0$/, '')}k`;
  }
  return new Intl.NumberFormat('id-ID').format(value);
}

export function formatInteger(value: number): string {
  return new Intl.NumberFormat('id-ID').format(value);
}

export function formatPercent(ratio: number): string {
  return `${Math.round(ratio * 100)}%`;
}

export function formatActiveMs(ms: number): string {
  const totalSec = Math.max(0, Math.round(ms / 1000));
  if (totalSec < 60) return `${totalSec}s`;
  const hours = Math.floor(totalSec / 3600);
  const minutes = Math.floor((totalSec % 3600) / 60);
  const seconds = totalSec % 60;
  if (hours >= 1) {
    return `${hours}h ${String(minutes).padStart(2, '0')}m`;
  }
  return `${minutes}m ${String(seconds).padStart(2, '0')}s`;
}

export function asNumber(value: unknown, fallback = 0): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

export function asString(value: unknown, fallback = ''): string {
  if (typeof value === 'string') return value;
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  return fallback;
}

export function propString(
  props: Record<string, unknown> | undefined,
  key: string,
): string | undefined {
  const value = props?.[key];
  if (typeof value === 'string' && value.trim()) return value;
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  return undefined;
}

export function propNumber(
  props: Record<string, unknown> | undefined,
  key: string,
): number | undefined {
  const value = props?.[key];
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
}
