import type { ComponentType } from 'react';
import {
  Award,
  Briefcase,
  CreditCard,
  File,
  FileText,
  Heart,
  Home,
  Key,
  Shield,
  Truck,
  User,
} from 'react-feather';
import type {
  CoreDocumentType,
  DocumentTypeIconKey,
  DocumentTypeToneKey,
} from '@/modules/family-core/types';

export type DocumentTypeResolved = CoreDocumentType & {
  Icon: ComponentType<{ size?: number | string; className?: string }>;
  toneBg: string;
  toneText: string;
};

export const DOCUMENT_TYPE_ICONS: Record<
  DocumentTypeIconKey,
  ComponentType<{ size?: number | string; className?: string }>
> = {
  user: User,
  home: Home,
  fileText: FileText,
  file: File,
  heart: Heart,
  briefcase: Briefcase,
  creditCard: CreditCard,
  key: Key,
  truck: Truck,
  award: Award,
  shield: Shield,
};

export const DOCUMENT_TYPE_TONES: Record<
  DocumentTypeToneKey,
  { toneBg: string; toneText: string; label: string }
> = {
  sky: { toneBg: 'bg-sky-100', toneText: 'text-sky-700', label: 'Sky' },
  indigo: {
    toneBg: 'bg-indigo-100',
    toneText: 'text-indigo-700',
    label: 'Indigo',
  },
  violet: {
    toneBg: 'bg-violet-100',
    toneText: 'text-violet-700',
    label: 'Violet',
  },
  blue: { toneBg: 'bg-blue-100', toneText: 'text-blue-700', label: 'Blue' },
  rose: { toneBg: 'bg-rose-100', toneText: 'text-rose-700', label: 'Rose' },
  orange: {
    toneBg: 'bg-orange-100',
    toneText: 'text-orange-700',
    label: 'Orange',
  },
  amber: {
    toneBg: 'bg-amber-100',
    toneText: 'text-amber-800',
    label: 'Amber',
  },
  teal: { toneBg: 'bg-teal-100', toneText: 'text-teal-700', label: 'Teal' },
  emerald: {
    toneBg: 'bg-emerald-100',
    toneText: 'text-emerald-700',
    label: 'Emerald',
  },
  fuchsia: {
    toneBg: 'bg-fuchsia-100',
    toneText: 'text-fuchsia-700',
    label: 'Fuchsia',
  },
  cyan: { toneBg: 'bg-cyan-100', toneText: 'text-cyan-700', label: 'Cyan' },
  gray: { toneBg: 'bg-gray-100', toneText: 'text-gray-600', label: 'Gray' },
};

export const DOCUMENT_TYPE_ICON_OPTIONS: {
  value: DocumentTypeIconKey;
  label: string;
}[] = [
  { value: 'user', label: 'User' },
  { value: 'home', label: 'Home' },
  { value: 'fileText', label: 'File text' },
  { value: 'file', label: 'File' },
  { value: 'heart', label: 'Heart' },
  { value: 'briefcase', label: 'Briefcase' },
  { value: 'creditCard', label: 'Kartu' },
  { value: 'key', label: 'Key' },
  { value: 'truck', label: 'Truck' },
  { value: 'award', label: 'Award' },
  { value: 'shield', label: 'Shield' },
];

export function resolveDocumentType(
  type: CoreDocumentType | undefined,
): DocumentTypeResolved {
  const fallback: CoreDocumentType = {
    id: 'fallback',
    slug: 'lainnya',
    label: 'Lainnya',
    iconKey: 'shield',
    toneKey: 'gray',
    extras: [],
    defaultLifetime: false,
    isSystem: true,
    sortOrder: 999,
    allowCustomTitle: true,
  };
  const base = type ?? fallback;
  const tone = DOCUMENT_TYPE_TONES[base.toneKey] ?? DOCUMENT_TYPE_TONES.gray;
  return {
    ...base,
    Icon: DOCUMENT_TYPE_ICONS[base.iconKey] ?? Shield,
    toneBg: tone.toneBg,
    toneText: tone.toneText,
  };
}

export function slugifyDocumentTypeLabel(label: string): string {
  return label
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '')
    .slice(0, 40) || 'custom';
}
