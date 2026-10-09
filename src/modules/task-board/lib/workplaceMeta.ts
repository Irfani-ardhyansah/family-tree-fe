import type { EmploymentType, Task, TaskStatus, Workplace } from '../types';
import { DEFAULT_WORKPLACE_ID } from '../mocks/workplaces';

/** Satu sumber warna/ikon biar badge tempat kerja konsisten. */
export const EMPLOYMENT_META: Record<
  EmploymentType,
  { label: string; chipClass: string; dotClass: string }
> = {
  Fulltime: {
    label: 'Fulltime',
    chipClass: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
    dotClass: 'bg-emerald-500',
  },
  Freelance: {
    label: 'Freelance',
    chipClass: 'bg-sky-500/10 text-sky-700 dark:text-sky-300',
    dotClass: 'bg-sky-500',
  },
  'Part-time': {
    label: 'Part-time',
    chipClass: 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-300',
    dotClass: 'bg-indigo-500',
  },
  Contract: {
    label: 'Kontrak',
    chipClass: 'bg-amber-500/10 text-amber-700 dark:text-amber-300',
    dotClass: 'bg-amber-500',
  },
  Personal: {
    label: 'Pribadi',
    chipClass: 'bg-violet-500/10 text-violet-700 dark:text-violet-300',
    dotClass: 'bg-violet-500',
  },
};

export type WorkplaceAccentKey =
  | 'amber'
  | 'sky'
  | 'violet'
  | 'emerald'
  | 'rose'
  | 'indigo'
  | 'slate';

export const WORKPLACE_ACCENT_KEYS: WorkplaceAccentKey[] = [
  'amber',
  'sky',
  'violet',
  'emerald',
  'rose',
  'indigo',
  'slate',
];

type WorkplaceAccentClasses = {
  avatar: string;
  bar: string;
  hoverBorder: string;
  soft: string;
  text: string;
};

/** Class Tailwind statis per aksen (JIT tidak bisa membaca string dinamis). */
const WORKPLACE_ACCENT: Record<WorkplaceAccentKey, WorkplaceAccentClasses> = {
  amber: {
    avatar: 'bg-amber-500 text-white',
    bar: 'bg-amber-500',
    hoverBorder: 'hover:border-amber-400/70',
    soft: 'bg-amber-500/10',
    text: 'text-amber-700 dark:text-amber-300',
  },
  sky: {
    avatar: 'bg-sky-500 text-white',
    bar: 'bg-sky-500',
    hoverBorder: 'hover:border-sky-400/70',
    soft: 'bg-sky-500/10',
    text: 'text-sky-700 dark:text-sky-300',
  },
  violet: {
    avatar: 'bg-violet-500 text-white',
    bar: 'bg-violet-500',
    hoverBorder: 'hover:border-violet-400/70',
    soft: 'bg-violet-500/10',
    text: 'text-violet-700 dark:text-violet-300',
  },
  emerald: {
    avatar: 'bg-emerald-500 text-white',
    bar: 'bg-emerald-500',
    hoverBorder: 'hover:border-emerald-400/70',
    soft: 'bg-emerald-500/10',
    text: 'text-emerald-700 dark:text-emerald-300',
  },
  rose: {
    avatar: 'bg-rose-500 text-white',
    bar: 'bg-rose-500',
    hoverBorder: 'hover:border-rose-400/70',
    soft: 'bg-rose-500/10',
    text: 'text-rose-700 dark:text-rose-300',
  },
  indigo: {
    avatar: 'bg-indigo-500 text-white',
    bar: 'bg-indigo-500',
    hoverBorder: 'hover:border-indigo-400/70',
    soft: 'bg-indigo-500/10',
    text: 'text-indigo-700 dark:text-indigo-300',
  },
  slate: {
    avatar: 'bg-slate-600 text-white',
    bar: 'bg-slate-500',
    hoverBorder: 'hover:border-slate-400/70',
    soft: 'bg-slate-500/10',
    text: 'text-slate-700 dark:text-slate-300',
  },
};

export function workplaceAccent(accent: string): WorkplaceAccentClasses {
  return (
    WORKPLACE_ACCENT[accent as WorkplaceAccentKey] ?? WORKPLACE_ACCENT.amber
  );
}

/** Inisial nama tempat kerja (maks 2 huruf), mis. "Nusantara Digital" → "ND". */
export function workplaceInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * Task tanpa `workplace_id` (data lama) dipetakan ke tempat kerja default
 * supaya tetap tampil dan tidak dianggap yatim.
 */
export function resolveTaskWorkplaceId(task: Task): number {
  return typeof task.workplace_id === 'number'
    ? task.workplace_id
    : DEFAULT_WORKPLACE_ID;
}

export type WorkplaceTaskStats = {
  total: number;
  todo: number;
  inProgress: number;
  merged: number;
  updatedAt: string | null;
};

function emptyStats(): WorkplaceTaskStats {
  return { total: 0, todo: 0, inProgress: 0, merged: 0, updatedAt: null };
}

function timestamp(value: string | null): number {
  if (!value) return 0;
  const time = new Date(value).getTime();
  return Number.isNaN(time) ? 0 : time;
}

const STATUS_BUCKET: Record<TaskStatus, keyof WorkplaceTaskStats | null> = {
  'To-Do': 'todo',
  'In Progress': 'inProgress',
  Merged: 'merged',
};

export function buildWorkplaceStats(
  tasks: Task[],
): Map<number, WorkplaceTaskStats> {
  const map = new Map<number, WorkplaceTaskStats>();
  for (const task of tasks) {
    const id = resolveTaskWorkplaceId(task);
    const stat = map.get(id) ?? emptyStats();
    stat.total += 1;
    const bucket = STATUS_BUCKET[task.status];
    if (bucket) {
      (stat[bucket] as number) += 1;
    }
    if (timestamp(task.updated_at) > timestamp(stat.updatedAt)) {
      stat.updatedAt = task.updated_at;
    }
    map.set(id, stat);
  }
  return map;
}

export function emptyWorkplaceStats(): WorkplaceTaskStats {
  return emptyStats();
}

/** "2 thn 8 bln" dari tanggal mulai ke sekarang / tanggal selesai. */
export function formatTenure(
  startedAt: string | null,
  endedAt: string | null = null,
): string | null {
  if (!startedAt) return null;
  const start = new Date(startedAt);
  if (Number.isNaN(start.getTime())) return null;
  const end = endedAt ? new Date(endedAt) : new Date();
  if (Number.isNaN(end.getTime())) return null;

  let months =
    (end.getFullYear() - start.getFullYear()) * 12 +
    (end.getMonth() - start.getMonth());
  if (months < 0) months = 0;

  const years = Math.floor(months / 12);
  const restMonths = months % 12;
  const parts: string[] = [];
  if (years > 0) parts.push(`${years} thn`);
  if (restMonths > 0 || years === 0) parts.push(`${restMonths} bln`);
  return parts.join(' ');
}

/** "Feb 2023". */
export function formatMonthYear(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('id-ID', {
    month: 'short',
    year: 'numeric',
  }).format(date);
}

export type { Workplace };
