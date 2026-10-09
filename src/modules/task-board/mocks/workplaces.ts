import type { Workplace } from '../types';

/**
 * Data awal (seed) tempat kerja — cukup untuk membangun & menilai UI lebih
 * dulu. Saat BE rilis (`GET /workplaces`, lihat
 * `docs/requests/from-fe/pending/TASK-BOARD-WORKPLACES-API.md`), sumbernya
 * diganti dari `lib/workplaceStore.ts` ke API; struktur halaman tidak berubah.
 *
 * Task lama yang belum punya `workplace_id` dipetakan ke tempat kerja
 * `is_default` supaya tidak ada data yang hilang.
 */
export const DEFAULT_WORKPLACE_ID = 1;

export const MOCK_WORKPLACES: Workplace[] = [
  {
    id: 1,
    name: 'Nusantara Digital',
    employment_type: 'Fulltime',
    role: 'Frontend Engineer',
    location: 'Jakarta · Remote',
    accent: 'amber',
    started_at: '2023-02-01T00:00:00.000Z',
    ended_at: null,
    is_default: true,
    archived_at: null,
    created_at: '2023-02-01T00:00:00.000Z',
    updated_at: '2023-02-01T00:00:00.000Z',
  },
  {
    id: 2,
    name: 'Studio Kreasi',
    employment_type: 'Freelance',
    role: 'Web Developer',
    location: 'Bandung · Remote',
    accent: 'sky',
    started_at: '2024-05-01T00:00:00.000Z',
    ended_at: null,
    is_default: false,
    archived_at: null,
    created_at: '2024-05-01T00:00:00.000Z',
    updated_at: '2024-05-01T00:00:00.000Z',
  },
  {
    id: 3,
    name: 'Proyek Pribadi',
    employment_type: 'Personal',
    role: 'Eksperimen & belajar',
    location: null,
    accent: 'violet',
    started_at: '2025-01-01T00:00:00.000Z',
    ended_at: null,
    is_default: false,
    archived_at: null,
    created_at: '2025-01-01T00:00:00.000Z',
    updated_at: '2025-01-01T00:00:00.000Z',
  },
];
