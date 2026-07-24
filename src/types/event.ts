export type EventType =
  | 'wedding'
  | 'birth'
  | 'death'
  | 'birthday'
  | 'reunion'
  | 'other';

export type EventContribution = {
  id: string;
  photoUrl: string;
  contributorId: string;
  caption?: string;
  createdAt: string;
};

export type FamilyEvent = {
  id: string;
  title: string;
  type: EventType;
  date: string;
  endDate?: string;
  location?: string;
  description?: string;
  /** Anggota terkait acara */
  personIds: string[];
  /** Foto cover dari form (legacy, digabung ke galeri) */
  photoUrls: string[];
  /**
   * Peserta yang boleh melihat & berkontribusi.
   * Kosong = semua anggota keluarga boleh akses.
   */
  attendeeIds: string[];
  /** Foto kontribusi dari anggota keluarga */
  contributions: EventContribution[];
  /** Dari API list — acara terbatas (attendeeIds tidak kosong) */
  isRestricted?: boolean;
  /** Dari API — viewer boleh lihat detail & kontribusi */
  canAccess?: boolean;
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
