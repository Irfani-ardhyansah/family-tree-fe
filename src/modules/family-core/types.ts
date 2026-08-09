export type CoreMemberRole =
  | 'father'
  | 'mother'
  | 'child'
  | 'spouse'
  | 'father_in_law'
  | 'mother_in_law';

export type CoreMember = {
  id: string;
  name: string;
  role: CoreMemberRole;
  /** Initials for avatar fallback */
  initials: string;
  /** Tailwind bg class for avatar */
  avatarTone: string;
};

/** Slug / code of document type (seeded or user-created). */
export type DocumentTypeSlug = string;

export type DocumentTypeIconKey =
  | 'user'
  | 'home'
  | 'fileText'
  | 'file'
  | 'heart'
  | 'briefcase'
  | 'creditCard'
  | 'key'
  | 'truck'
  | 'award'
  | 'shield';

export type DocumentTypeToneKey =
  | 'sky'
  | 'indigo'
  | 'violet'
  | 'blue'
  | 'rose'
  | 'orange'
  | 'amber'
  | 'teal'
  | 'emerald'
  | 'fuchsia'
  | 'cyan'
  | 'gray';

export type DocumentTypeExtraField = {
  key: string;
  label: string;
  placeholder?: string;
};

/** Master data: jenis dokumen (CRUD + seeder default). */
export type CoreDocumentType = {
  id: string;
  /** Stable code, e.g. ktp / custom_xxx */
  slug: string;
  label: string;
  iconKey: DocumentTypeIconKey;
  toneKey: DocumentTypeToneKey;
  extras: DocumentTypeExtraField[];
  defaultLifetime: boolean;
  /** Seeded defaults — boleh diedit, tapi slug system sebaiknya tidak diubah */
  isSystem: boolean;
  sortOrder: number;
  /** Allow custom title on document (e.g. Lainnya) */
  allowCustomTitle: boolean;
};

export type CoreDocumentTypeDraft = Omit<CoreDocumentType, 'id'>;

export type DocumentStatus = 'active' | 'expiring' | 'expired';

export type ReminderDays = 7 | 14 | 30 | 60 | 90;

export type CoreDocument = {
  id: string;
  memberId: string;
  /** References CoreDocumentType.slug */
  type: DocumentTypeSlug;
  /** Display title; for allowCustomTitle types this can be custom */
  title: string;
  number: string;
  issuedAt: string | null;
  expiresAt: string | null;
  lifetime: boolean;
  notes: string;
  reminderEnabled: boolean;
  reminderDays: ReminderDays;
  /** Extra type-specific fields */
  extras: Record<string, string>;
  /** Optional scan preview URL (dummy) */
  scanUrl: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CoreDocumentDraft = Omit<
  CoreDocument,
  'id' | 'createdAt' | 'updatedAt'
>;

/* ─── Health Tracker ─── */

export type BloodType = 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';

export type AllergyKind = 'obat' | 'makanan' | 'lainnya';

export type HealthBasics = {
  bloodType: BloodType | null;
  heightCm: number | null;
  weightKg: number | null;
  notes: string;
};

export type HealthCondition = {
  id: string;
  name: string;
  diagnosedAt: string | null;
  status: 'aktif' | 'sembuh' | 'pantau';
  notes: string;
};

export type HealthSurgery = {
  id: string;
  name: string;
  date: string | null;
  hospital: string;
  notes: string;
};

export type HealthAllergy = {
  id: string;
  kind: AllergyKind;
  name: string;
  severity: 'ringan' | 'sedang' | 'berat';
  notes: string;
};

export type HealthMedication = {
  id: string;
  name: string;
  dose: string;
  schedule: string;
  reminderEnabled: boolean;
  notes: string;
};

export type HealthAppointment = {
  id: string;
  title: string;
  doctor: string;
  place: string;
  at: string; // ISO datetime or date
  reminderEnabled: boolean;
  notes: string;
  /** Optional link id for calendar event */
  calendarEventId: string | null;
};

export type HealthVaccine = {
  id: string;
  name: string;
  date: string | null;
  doseLabel: string;
  notes: string;
};

export type HealthNote = {
  id: string;
  title: string;
  kind: 'dokter' | 'lab' | 'lainnya';
  date: string | null;
  summary: string;
};

export type HealthXrayBodyPart =
  | 'dada'
  | 'kepala'
  | 'gigi'
  | 'tulang'
  | 'perut'
  | 'lainnya';

export type HealthXray = {
  id: string;
  title: string;
  bodyPart: HealthXrayBodyPart;
  date: string | null;
  facility: string;
  notes: string;
  /** Dummy preview URL / data URL; null = belum ada foto */
  imageUrl: string | null;
};

export type GrowthPoint = {
  id: string;
  date: string;
  heightCm: number;
  weightKg: number;
};

export type MemberHealthProfile = {
  memberId: string;
  basics: HealthBasics;
  conditions: HealthCondition[];
  surgeries: HealthSurgery[];
  allergies: HealthAllergy[];
  medications: HealthMedication[];
  appointments: HealthAppointment[];
  vaccines: HealthVaccine[];
  notes: HealthNote[];
  xrays: HealthXray[];
  growth: GrowthPoint[];
};

/* ─── Family Calendar ─── */

/** Slug / code of calendar event type (seeded or user-created). */
export type CalendarEventTypeSlug = string;

export type CalendarEventTypeIconKey =
  | 'bookOpen'
  | 'briefcase'
  | 'gift'
  | 'heart'
  | 'creditCard'
  | 'star'
  | 'calendar'
  | 'home'
  | 'users'
  | 'bell';

export type CalendarEventTypeToneKey =
  | 'indigo'
  | 'slate'
  | 'pink'
  | 'rose'
  | 'amber'
  | 'violet'
  | 'gray'
  | 'sky'
  | 'teal'
  | 'emerald';

/** Master data: tipe event kalender (CRUD + seeder default). */
export type CoreCalendarEventType = {
  id: string;
  slug: CalendarEventTypeSlug;
  label: string;
  iconKey: CalendarEventTypeIconKey;
  toneKey: CalendarEventTypeToneKey;
  /** Jika true, event bisa di-link ke Health Tracker */
  linksToHealth: boolean;
  isSystem: boolean;
  sortOrder: number;
};

export type CoreCalendarEventTypeDraft = Omit<CoreCalendarEventType, 'id'>;

export type CalendarEvent = {
  id: string;
  /** References CoreCalendarEventType.slug */
  type: CalendarEventTypeSlug;
  title: string;
  date: string; // YYYY-MM-DD
  endDate: string | null;
  time: string | null; // HH:mm
  allDay: boolean;
  memberId: string | null;
  location: string;
  notes: string;
  /** Link ke health appointment jika tipe dokter / linksToHealth */
  healthAppointmentId: string | null;
  reminderEnabled: boolean;
};
