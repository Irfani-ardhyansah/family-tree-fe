import type { AppModuleId } from '@/shared/data/moduleCatalog';
import type {
  ActiveSession,
  AgeAccessRule,
  AppSettings,
  AuditLogEntry,
  BackupJob,
  BroadcastMessage,
  ModuleRuntimeStatus,
} from '@/modules/admin/types';

const hoursAgo = (h: number) =>
  new Date(Date.now() - h * 60 * 60 * 1000).toISOString();
const daysAgo = (d: number) =>
  new Date(Date.now() - d * 24 * 60 * 60 * 1000).toISOString();

export let mockAgeRules: AgeAccessRule[] = [
  {
    id: 'rule-1',
    moduleId: 'money',
    minAge: 17,
    maxAge: null,
    note: 'Akses keuangan hanya untuk usia dewasa',
    isActive: true,
    updatedAt: hoursAgo(5),
  },
  {
    id: 'rule-2',
    moduleId: 'household',
    minAge: 13,
    maxAge: null,
    note: 'Remaja boleh bantu daftar belanja',
    isActive: true,
    updatedAt: daysAgo(2),
  },
  {
    id: 'rule-3',
    moduleId: 'roots',
    minAge: 0,
    maxAge: 12,
    note: 'Anak: view-only silsilah (aturan tambahan menyusul)',
    isActive: false,
    updatedAt: daysAgo(10),
  },
  {
    id: 'rule-4',
    moduleId: 'core',
    minAge: 15,
    maxAge: null,
    isActive: true,
    updatedAt: daysAgo(1),
  },
];

export let mockModuleStatuses: ModuleRuntimeStatus[] = [
  {
    moduleId: 'roots',
    enabled: true,
    updatedAt: daysAgo(14),
    updatedBy: 'Admin Irfan',
  },
  {
    moduleId: 'core',
    enabled: true,
    updatedAt: daysAgo(3),
    updatedBy: 'Admin Irfan',
  },
  {
    moduleId: 'money',
    enabled: false,
    updatedAt: hoursAgo(2),
    updatedBy: 'Admin Irfan',
  },
  {
    moduleId: 'household',
    enabled: true,
    updatedAt: daysAgo(7),
    updatedBy: 'Admin Dina',
  },
];

export let mockAuditLogs: AuditLogEntry[] = [
  {
    id: 'log-1',
    timestamp: hoursAgo(1),
    userName: 'Admin Irfan',
    userId: 'u-1',
    moduleId: 'admin',
    action: 'toggle_module',
    summary: 'Money Track dimatikan',
    before: { enabled: true },
    after: { enabled: false },
  },
  {
    id: 'log-2',
    timestamp: hoursAgo(3),
    userName: 'Budi Santoso',
    userId: 'u-2',
    moduleId: 'auth',
    action: 'login',
    summary: 'Login dari Chrome · macOS',
  },
  {
    id: 'log-3',
    timestamp: hoursAgo(6),
    userName: 'Admin Dina',
    userId: 'u-3',
    moduleId: 'admin',
    action: 'broadcast',
    summary: 'Broadcast “Gathering Sabtu” dikirim ke semua',
  },
  {
    id: 'log-4',
    timestamp: daysAgo(1),
    userName: 'Admin Irfan',
    userId: 'u-1',
    moduleId: 'admin',
    action: 'update',
    summary: 'Rule umur Money Track diubah (min 17)',
    before: { minAge: 15 },
    after: { minAge: 17 },
  },
  {
    id: 'log-5',
    timestamp: daysAgo(1),
    userName: 'Siti Aminah',
    userId: 'u-4',
    moduleId: 'roots',
    action: 'create',
    summary: 'Menambah anggota keluarga baru',
    after: { fullName: 'Andi Pratama' },
  },
  {
    id: 'log-6',
    timestamp: daysAgo(2),
    userName: 'Admin Irfan',
    userId: 'u-1',
    moduleId: 'admin',
    action: 'force_logout',
    summary: 'Force logout sesi Budi Santoso',
  },
  {
    id: 'log-7',
    timestamp: daysAgo(3),
    userName: 'Admin Dina',
    userId: 'u-3',
    moduleId: 'admin',
    action: 'settings',
    summary: 'Timezone diubah ke Asia/Jakarta',
    before: { timezone: 'UTC' },
    after: { timezone: 'Asia/Jakarta' },
  },
  {
    id: 'log-8',
    timestamp: daysAgo(4),
    userName: 'Admin Irfan',
    userId: 'u-1',
    moduleId: 'admin',
    action: 'backup',
    summary: 'Backup modul roots + money berhasil',
  },
];

export let mockSessions: ActiveSession[] = [
  {
    id: 'sess-1',
    userId: 'u-1',
    userName: 'Admin Irfan',
    device: 'MacBook Pro',
    browser: 'Chrome 126',
    ipAddress: '103.24.xx.12',
    loggedInAt: hoursAgo(4),
    lastActiveAt: hoursAgo(0.1),
    isCurrent: true,
  },
  {
    id: 'sess-2',
    userId: 'u-2',
    userName: 'Budi Santoso',
    device: 'iPhone 15',
    browser: 'Safari iOS',
    ipAddress: '114.5.xx.88',
    loggedInAt: hoursAgo(8),
    lastActiveAt: hoursAgo(1),
    isCurrent: false,
  },
  {
    id: 'sess-3',
    userId: 'u-4',
    userName: 'Siti Aminah',
    device: 'Windows PC',
    browser: 'Edge 125',
    ipAddress: '180.252.xx.41',
    loggedInAt: daysAgo(1),
    lastActiveAt: hoursAgo(5),
    isCurrent: false,
  },
  {
    id: 'sess-4',
    userId: 'u-3',
    userName: 'Admin Dina',
    device: 'iPad Air',
    browser: 'Safari',
    loggedInAt: hoursAgo(12),
    lastActiveAt: hoursAgo(2),
    isCurrent: false,
  },
];

export let mockBroadcasts: BroadcastMessage[] = [
  {
    id: 'bc-1',
    title: 'Gathering Sabtu',
    body: '<p>Halo keluarga! Gathering Sabtu jam 10 di rumah Om Irfan. Mohon konfirmasi kehadiran.</p>',
    target: 'all',
    targetUserIds: [],
    targetLabel: 'Semua anggota',
    scheduledAt: null,
    sentAt: hoursAgo(6),
    status: 'sent',
    createdAt: hoursAgo(6),
  },
  {
    id: 'bc-2',
    title: 'Pengingat isi data alamat',
    body: '<p>Mohon lengkapi alamat di Family Roots agar peta keluarga akurat.</p>',
    target: 'selected',
    targetUserIds: ['u-2', 'u-4'],
    targetLabel: '2 anggota terpilih',
    scheduledAt: null,
    sentAt: daysAgo(2),
    status: 'sent',
    createdAt: daysAgo(2),
  },
];

export let mockSettings: AppSettings = {
  familyName: 'Keluarga Ardhyansah',
  timezone: 'Asia/Jakarta',
  currency: 'IDR',
  logoUrl: null,
};

export let mockBackups: BackupJob[] = [
  {
    id: 'bk-1',
    moduleIds: ['roots', 'money'],
    createdAt: daysAgo(4),
    status: 'success',
    downloadUrl: '#',
  },
  {
    id: 'bk-2',
    moduleIds: ['roots'],
    createdAt: daysAgo(12),
    status: 'success',
    downloadUrl: '#',
  },
  {
    id: 'bk-3',
    moduleIds: ['core', 'household'],
    createdAt: daysAgo(20),
    status: 'failed',
    errorMessage: 'Timeout saat mengarsip media',
  },
];

export const mockSelectableUsers = [
  { id: 'u-1', name: 'Admin Irfan' },
  { id: 'u-2', name: 'Budi Santoso' },
  { id: 'u-3', name: 'Admin Dina' },
  { id: 'u-4', name: 'Siti Aminah' },
  { id: 'u-5', name: 'Rina Wijaya' },
];

export function resetAdminMocks() {
  // no-op placeholder for tests
}

export function nextId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}

export function setModuleStatuses(next: ModuleRuntimeStatus[]) {
  mockModuleStatuses = next;
}

export function setAgeRules(next: AgeAccessRule[]) {
  mockAgeRules = next;
}

export function setSessions(next: ActiveSession[]) {
  mockSessions = next;
}

export function setBroadcasts(next: BroadcastMessage[]) {
  mockBroadcasts = next;
}

export function setSettings(next: AppSettings) {
  mockSettings = next;
}

export function setBackups(next: BackupJob[]) {
  mockBackups = next;
}

export function setAuditLogs(next: AuditLogEntry[]) {
  mockAuditLogs = next;
}

export function pushAudit(entry: Omit<AuditLogEntry, 'id' | 'timestamp'>) {
  mockAuditLogs = [
    {
      ...entry,
      id: nextId('log'),
      timestamp: new Date().toISOString(),
    },
    ...mockAuditLogs,
  ];
}

export type { AppModuleId };
