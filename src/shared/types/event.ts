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
  /** Person id pembuat acara */
  createdById?: string;
  /** Dari API — viewer boleh edit/hapus (hanya creator) */
  canManage?: boolean;
};

export const EVENT_TYPE_CONFIG: Record<
  EventType,
  { label: string; emoji: string; color: string; bg: string; border: string }
> = {
  wedding: {
    label: 'Pernikahan',
    emoji: '💍',
    color: 'text-pink-700 dark:text-pink-300',
    bg: 'bg-pink-100 dark:bg-pink-500/15',
    border: 'border-pink-200 dark:border-pink-500/30',
  },
  birth: {
    label: 'Kelahiran',
    emoji: '🍼',
    color: 'text-blue-700 dark:text-blue-300',
    bg: 'bg-blue-100 dark:bg-blue-500/15',
    border: 'border-blue-200 dark:border-blue-500/30',
  },
  death: {
    label: 'Wafat',
    emoji: '🕊️',
    color: 'text-gray-600 dark:text-suite-muted',
    bg: 'bg-gray-100 dark:bg-suite-soft',
    border: 'border-gray-200 dark:border-suite-border',
  },
  birthday: {
    label: 'Ulang Tahun',
    emoji: '🎂',
    color: 'text-yellow-700 dark:text-yellow-300',
    bg: 'bg-yellow-100 dark:bg-yellow-500/15',
    border: 'border-yellow-200 dark:border-yellow-500/30',
  },
  reunion: {
    label: 'Reuni Keluarga',
    emoji: '👨‍👩‍👧',
    color: 'text-primary-700 dark:text-primary-300',
    bg: 'bg-primary-100 dark:bg-primary-500/15',
    border: 'border-primary-200 dark:border-primary-500/30',
  },
  other: {
    label: 'Lainnya',
    emoji: '📅',
    color: 'text-brand-600 dark:text-suite-muted',
    bg: 'bg-brand-100 dark:bg-suite-soft',
    border: 'border-brand-200 dark:border-suite-border',
  },
};
