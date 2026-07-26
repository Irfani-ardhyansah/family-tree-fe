export type MemoriamTribute = {
  id: string;
  deceasedId: string;
  authorId: string;
  content: string;
  photoUrls: string[];
  createdAt: string;
  updatedAt?: string;
  /** Dari API — viewer boleh edit/hapus (hanya author) */
  canManage?: boolean;
};

export type PrayerRecord = {
  id: string;
  deceasedId: string;
  authorId: string;
  createdAt: string;
};
