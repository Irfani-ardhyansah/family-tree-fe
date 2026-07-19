export type Gender = 'male' | 'female';
export type LifeStatus = 'alive' | 'deceased';
export type Religion = 'islam' | 'other';
export type UserRole = 'admin' | 'member';

/** Terstruktur agar nanti mudah di-pin ke Google Maps. */
export type PersonAddress = {
  street?: string;
  district?: string;
  city?: string;
  province?: string;
  postalCode?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
};

export type Person = {
  id: string;
  fullName: string;
  nickname?: string;
  gender: Gender;
  birthDate: string;
  deathDate?: string;
  status: LifeStatus;
  religion?: Religion;
  photoUrl?: string;
  occupation?: string;
  phone?: string;
  phoneAlt?: string;
  address?: PersonAddress;
  fatherId?: string;
  motherId?: string;
  spouseIds: string[];
  generationLabel?: string;
  isSelf?: boolean;
  role?: UserRole;
};

export type FamilyData = {
  persons: Person[];
  rootPersonId: string;
};

/** Filter 1: pohon berpusat pada diri sendiri atau pasangan */
export type TreePerspective = 'self' | 'spouse';

/** Filter 1: jalur keturunan yang ditampilkan */
export type TreeLineage = 'both' | 'paternal' | 'maternal';

/** Filter 2: layer tampilan di sekitar garis segaris */
export type TreeDisplayFilters = {
  /** Pasangan dari orang segaris (termasuk paman/bibi jika saudara ditampilkan) */
  showSpouses: boolean;
  /** Saudara di garis atas (ayah, ibu, kakek, nenek, buyut) + saudara kandung */
  showSiblings: boolean;
  /** 1 generasi di bawah garis segaris (anak / sepupu) */
  showChildren: boolean;
};

/** Kedalaman ke atas di mana saudara tidak lagi ditampilkan — hanya pasangan ayah/ibu per jalur. */
export const BUYUT_ANCESTOR_DEPTH = 3;

/** Nama generasi ke atas dari fokus (index = jumlah generasi). */
export const ANCESTOR_GENERATION_NAMES: Record<number, string> = {
  1: 'Orang tua',
  2: 'Kakek/Nenek',
  3: 'Orang tua Kakek/Nenek',
  4: 'Orang tua Buyut',
  5: 'Leluhur',
};

export type TreeViewConfig = {
  perspective: TreePerspective;
  lineage: TreeLineage;
  /** Berapa generasi ke atas dari fokus (1 = orang tua, 2 = kakek/nenek, …) */
  generationsUp: number;
  display: TreeDisplayFilters;
};

export const DEFAULT_TREE_VIEW: TreeViewConfig = {
  perspective: 'self',
  lineage: 'both',
  generationsUp: 4,
  display: {
    showSpouses: false,
    showSiblings: false,
    showChildren: false,
  },
};

export const TREE_LINEAGE_OPTIONS: {
  value: TreeLineage;
  label: string;
  desc: string;
}[] = [
  { value: 'paternal', label: 'Garis Ayah', desc: 'Buyut/kakek/orang tua dari ayah' },
  { value: 'maternal', label: 'Garis Ibu', desc: 'Buyut/kakek/orang tua dari ibu' },
  { value: 'both', label: 'Keduanya', desc: 'Garis ayah & ibu sekaligus' },
];

export const TREE_DISPLAY_OPTIONS: {
  key: keyof TreeDisplayFilters;
  label: string;
  desc: string;
}[] = [
  {
    key: 'showSiblings',
    label: 'Saudara',
    desc: 'Saudara ayah, ibu, kakek, nenek & saudara kandung',
  },
  {
    key: 'showSpouses',
    label: 'Pasangan',
    desc: 'Pasangan orang segaris beserta pasangan saudara',
  },
  {
    key: 'showChildren',
    label: 'Anak',
    desc: '1 generasi di bawah (anak & sepupu jika saudara aktif)',
  },
];
