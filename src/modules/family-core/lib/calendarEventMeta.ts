import type { ComponentType } from 'react';
import {
  Bell,
  BookOpen,
  Briefcase,
  Calendar,
  CreditCard,
  Gift,
  Heart,
  Home,
  Star,
  Users,
} from 'react-feather';
import type {
  CalendarEventTypeIconKey,
  CalendarEventTypeToneKey,
  CoreCalendarEventType,
} from '@/modules/family-core/types';

export type CalendarEventTypeResolved = CoreCalendarEventType & {
  Icon: ComponentType<{ size?: number | string; className?: string }>;
  toneBg: string;
  toneText: string;
  dot: string;
};

export const CALENDAR_TYPE_ICONS: Record<
  CalendarEventTypeIconKey,
  ComponentType<{ size?: number | string; className?: string }>
> = {
  bookOpen: BookOpen,
  briefcase: Briefcase,
  gift: Gift,
  heart: Heart,
  creditCard: CreditCard,
  star: Star,
  calendar: Calendar,
  home: Home,
  users: Users,
  bell: Bell,
};

export const CALENDAR_TYPE_TONES: Record<
  CalendarEventTypeToneKey,
  { toneBg: string; toneText: string; dot: string; label: string }
> = {
  indigo: {
    toneBg: 'bg-indigo-100',
    toneText: 'text-indigo-700',
    dot: 'bg-indigo-500',
    label: 'Indigo',
  },
  slate: {
    toneBg: 'bg-slate-100',
    toneText: 'text-slate-700',
    dot: 'bg-slate-500',
    label: 'Slate',
  },
  pink: {
    toneBg: 'bg-pink-100',
    toneText: 'text-pink-700',
    dot: 'bg-pink-500',
    label: 'Pink',
  },
  rose: {
    toneBg: 'bg-rose-100',
    toneText: 'text-rose-700',
    dot: 'bg-rose-500',
    label: 'Rose',
  },
  amber: {
    toneBg: 'bg-amber-100',
    toneText: 'text-amber-800',
    dot: 'bg-amber-500',
    label: 'Amber',
  },
  violet: {
    toneBg: 'bg-violet-100',
    toneText: 'text-violet-700',
    dot: 'bg-violet-500',
    label: 'Violet',
  },
  gray: {
    toneBg: 'bg-gray-100',
    toneText: 'text-gray-600',
    dot: 'bg-gray-400',
    label: 'Gray',
  },
  sky: {
    toneBg: 'bg-sky-100',
    toneText: 'text-sky-700',
    dot: 'bg-sky-500',
    label: 'Sky',
  },
  teal: {
    toneBg: 'bg-teal-100',
    toneText: 'text-teal-700',
    dot: 'bg-teal-500',
    label: 'Teal',
  },
  emerald: {
    toneBg: 'bg-emerald-100',
    toneText: 'text-emerald-700',
    dot: 'bg-emerald-500',
    label: 'Emerald',
  },
};

export const CALENDAR_TYPE_ICON_OPTIONS: {
  value: CalendarEventTypeIconKey;
  label: string;
}[] = [
  { value: 'bookOpen', label: 'Sekolah' },
  { value: 'briefcase', label: 'Kerja' },
  { value: 'gift', label: 'Ultah' },
  { value: 'heart', label: 'Dokter' },
  { value: 'creditCard', label: 'Tagihan' },
  { value: 'star', label: 'Star' },
  { value: 'calendar', label: 'Kalender' },
  { value: 'home', label: 'Rumah' },
  { value: 'users', label: 'Keluarga' },
  { value: 'bell', label: 'Reminder' },
];

export function resolveCalendarEventType(
  type: CoreCalendarEventType | undefined,
): CalendarEventTypeResolved {
  const fallback: CoreCalendarEventType = {
    id: 'fallback',
    slug: 'lainnya',
    label: 'Lainnya',
    iconKey: 'calendar',
    toneKey: 'gray',
    linksToHealth: false,
    isSystem: true,
    sortOrder: 999,
  };
  const base = type ?? fallback;
  const tone = CALENDAR_TYPE_TONES[base.toneKey] ?? CALENDAR_TYPE_TONES.gray;
  return {
    ...base,
    Icon: CALENDAR_TYPE_ICONS[base.iconKey] ?? Calendar,
    toneBg: tone.toneBg,
    toneText: tone.toneText,
    dot: tone.dot,
  };
}

export function slugifyCalendarTypeLabel(label: string): string {
  return (
    label
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_|_$/g, '')
      .slice(0, 40) || 'custom'
  );
}
