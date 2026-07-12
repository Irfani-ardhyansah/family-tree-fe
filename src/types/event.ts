export type EventType =
  | 'wedding'
  | 'birth'
  | 'death'
  | 'birthday'
  | 'reunion'
  | 'other';

export type FamilyEvent = {
  id: string;
  title: string;
  type: EventType;
  date: string;
  endDate?: string;
  location?: string;
  description?: string;
  personIds: string[];
  /** Multiple photo URLs (base64 data URLs or remote URLs) */
  photoUrls: string[];
};

export const EVENT_TYPE_CONFIG: Record<
  EventType,
  { label: string; emoji: string; color: string; bg: string; border: string }
> = {
  wedding: {
    label: 'Pernikahan',
    emoji: '💍',
    color: 'text-pink-700',
    bg: 'bg-pink-100',
    border: 'border-pink-200',
  },
  birth: {
    label: 'Kelahiran',
    emoji: '🍼',
    color: 'text-blue-700',
    bg: 'bg-blue-100',
    border: 'border-blue-200',
  },
  death: {
    label: 'Wafat',
    emoji: '🕊️',
    color: 'text-gray-600',
    bg: 'bg-gray-100',
    border: 'border-gray-200',
  },
  birthday: {
    label: 'Ulang Tahun',
    emoji: '🎂',
    color: 'text-yellow-700',
    bg: 'bg-yellow-100',
    border: 'border-yellow-200',
  },
  reunion: {
    label: 'Reuni Keluarga',
    emoji: '👨‍👩‍👧',
    color: 'text-primary-700',
    bg: 'bg-primary-100',
    border: 'border-primary-200',
  },
  other: {
    label: 'Lainnya',
    emoji: '📅',
    color: 'text-brand-600',
    bg: 'bg-brand-100',
    border: 'border-brand-200',
  },
};
