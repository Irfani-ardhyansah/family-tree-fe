import type { CoreCalendarEventType } from '@/modules/family-core/types';

/**
 * Default seeder values for `fc_calendar_event_types`.
 * Keep in sync with BE seeder request doc.
 */
export const INITIAL_CALENDAR_EVENT_TYPES: CoreCalendarEventType[] = [
  {
    id: 'ct-sekolah',
    slug: 'sekolah',
    label: 'Sekolah',
    iconKey: 'bookOpen',
    toneKey: 'indigo',
    linksToHealth: false,
    isSystem: true,
    sortOrder: 10,
  },
  {
    id: 'ct-kerja',
    slug: 'kerja',
    label: 'Kerja',
    iconKey: 'briefcase',
    toneKey: 'slate',
    linksToHealth: false,
    isSystem: true,
    sortOrder: 20,
  },
  {
    id: 'ct-ultah',
    slug: 'ulang_tahun',
    label: 'Ulang tahun',
    iconKey: 'gift',
    toneKey: 'pink',
    linksToHealth: false,
    isSystem: true,
    sortOrder: 30,
  },
  {
    id: 'ct-dokter',
    slug: 'dokter',
    label: 'Dokter',
    iconKey: 'heart',
    toneKey: 'rose',
    linksToHealth: true,
    isSystem: true,
    sortOrder: 40,
  },
  {
    id: 'ct-tagihan',
    slug: 'tagihan',
    label: 'Tagihan',
    iconKey: 'creditCard',
    toneKey: 'amber',
    linksToHealth: false,
    isSystem: true,
    sortOrder: 50,
  },
  {
    id: 'ct-anni',
    slug: 'anniversary',
    label: 'Anniversary',
    iconKey: 'star',
    toneKey: 'violet',
    linksToHealth: false,
    isSystem: true,
    sortOrder: 60,
  },
  {
    id: 'ct-lainnya',
    slug: 'lainnya',
    label: 'Lainnya',
    iconKey: 'calendar',
    toneKey: 'gray',
    linksToHealth: false,
    isSystem: true,
    sortOrder: 70,
  },
];
