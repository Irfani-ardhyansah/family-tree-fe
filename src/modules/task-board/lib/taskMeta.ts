import DOMPurify from 'dompurify';
import {
  AlertCircle,
  Circle,
  Clock,
  FileText,
  GitMerge,
  GitPullRequest,
  MessageCircle,
  RefreshCw,
  Star,
  type Icon,
} from 'react-feather';
import type { LinkType, TaskStatus, TaskType } from '../types';

/** Satu sumber warna/ikon biar badge, list, dan detail konsisten. */
export type TaskMeta = {
  label: string;
  icon: Icon;
  /** Titik indikator kecil. */
  dotClass: string;
  /** Chip lembut (background + teks). */
  chipClass: string;
  /** Bar aksen kiri pada baris list / kartu. */
  barClass: string;
};

export const TASK_STATUS_META: Record<TaskStatus, TaskMeta> = {
  'To-Do': {
    label: 'To-Do',
    icon: Circle,
    dotClass: 'bg-suite-faint',
    chipClass: 'bg-suite-soft text-suite-muted',
    barClass: 'bg-suite-faint/70',
  },
  'In Progress': {
    label: 'In Progress',
    icon: Clock,
    dotClass: 'bg-sky-500',
    chipClass: 'bg-sky-500/10 text-sky-700 dark:text-sky-300',
    barClass: 'bg-sky-500',
  },
  Merged: {
    label: 'Merged',
    icon: GitMerge,
    dotClass: 'bg-emerald-500',
    chipClass: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
    barClass: 'bg-emerald-500',
  },
};

export const TASK_TYPE_META: Record<TaskType, TaskMeta> = {
  Bugfixing: {
    label: 'Bugfixing',
    icon: AlertCircle,
    dotClass: 'bg-rose-500',
    chipClass: 'bg-rose-500/10 text-rose-700 dark:text-rose-300',
    barClass: 'bg-rose-500',
  },
  Feature: {
    label: 'Feature',
    icon: Star,
    dotClass: 'bg-amber-500',
    chipClass: 'bg-amber-500/10 text-amber-700 dark:text-amber-300',
    barClass: 'bg-amber-500',
  },
  Refactor: {
    label: 'Refactor',
    icon: RefreshCw,
    dotClass: 'bg-violet-500',
    chipClass: 'bg-violet-500/10 text-violet-700 dark:text-violet-300',
    barClass: 'bg-violet-500',
  },
};

export const TASK_STATUS_ORDER: TaskStatus[] = ['To-Do', 'In Progress', 'Merged'];
export const TASK_TYPE_ORDER: TaskType[] = ['Bugfixing', 'Feature', 'Refactor'];

export const LINK_META: Record<
  LinkType,
  { label: string; icon: Icon; chipClass: string }
> = {
  discord: {
    label: 'Discord',
    icon: MessageCircle,
    chipClass: 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-300',
  },
  notion: {
    label: 'Notion',
    icon: FileText,
    chipClass: 'bg-suite-soft text-suite-muted',
  },
  mr: {
    label: 'Merge Request',
    icon: GitPullRequest,
    chipClass: 'bg-orange-500/10 text-orange-700 dark:text-orange-300',
  },
};

/**
 * Styling untuk konten rich text hasil Tiptap (DOMPurify).
 * Tailwind typography plugin tidak dipakai, jadi gaya ditulis manual.
 */
export const RICH_TEXT_CLASS = [
  'text-[13.5px] leading-relaxed text-suite-ink',
  '[&_p]:mt-2 [&_p:first-child]:mt-0',
  '[&_ul]:mt-2 [&_ul]:list-disc [&_ul]:pl-5',
  '[&_ol]:mt-2 [&_ol]:list-decimal [&_ol]:pl-5',
  '[&_li]:mt-0.5',
  '[&_a]:font-semibold [&_a]:text-amber-600 [&_a]:underline dark:[&_a]:text-amber-400',
  '[&_strong]:font-bold',
  '[&_code]:rounded [&_code]:bg-suite-soft [&_code]:px-1 [&_code]:py-0.5 [&_code]:font-money-mono [&_code]:text-[12.5px]',
  '[&_pre]:mt-2 [&_pre]:overflow-x-auto [&_pre]:rounded-control [&_pre]:bg-suite-soft [&_pre]:p-3 [&_pre]:font-money-mono [&_pre]:text-[12.5px]',
  '[&_img]:mt-2 [&_img]:rounded-control [&_img]:border [&_img]:border-suite-border',
].join(' ');

export function formatTaskDate(dateString: string): string {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

export function formatTaskDateTime(dateString: string): string {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

/** Sanitasi HTML rich text (deskripsi task, catatan deploy, todo). */
export function sanitizeTaskHtml(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      'p',
      'br',
      'strong',
      'em',
      'u',
      'ul',
      'ol',
      'li',
      'code',
      'pre',
      'a',
      'img',
    ],
    ALLOWED_ATTR: ['href', 'src', 'alt', 'class'],
  });
}

/** Ubah HTML jadi teks polos (untuk preview terpotong). */
export function htmlToPlainText(html: string): string {
  if (!html) return '';
  const spaced = html
    .replace(/<\s*br\s*\/?\s*>/gi, ' ')
    .replace(/<\/(p|div|li|h[1-6]|ul|ol|blockquote|pre)>/gi, ' ');
  const doc = new DOMParser().parseFromString(spaced, 'text/html');
  return (doc.body.textContent ?? '').replace(/\s+/g, ' ').trim();
}
