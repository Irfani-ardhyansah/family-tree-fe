import {
  mockAgeRules,
  nextId,
  setAgeRules,
} from '@/modules/admin/mocks/adminMocks';
import type {
  ActiveSession,
  AdminDashboardSummary,
  AgeAccessRule,
  AppSettings,
  AuditAction,
  AuditLogEntry,
  BackupJob,
  BroadcastMessage,
  CreateAgeRuleInput,
  ModuleRuntimeStatus,
  SendBroadcastInput,
  UpdateAgeRuleInput,
} from '@/modules/admin/types';
import type { AppModuleId } from '@/shared/data/moduleCatalog';
import { apiFetch, apiFormFetch } from '@/shared/lib/apiClient';
import { buildQuery } from '@/shared/lib/apiQuery';

const delay = (ms = 420) => new Promise((r) => setTimeout(r, ms));

export type AuditQuery = {
  q?: string;
  userId?: string;
  moduleId?: string;
  action?: AuditAction | '';
  from?: string;
  to?: string;
  page?: number;
  pageSize?: number;
};

export type AuditListResult = {
  items: AuditLogEntry[];
  total: number;
  page: number;
  pageSize: number;
};

export type AdminUserOption = {
  id: string;
  name: string;
};

type ModuleStatusListData =
  | { items: ModuleRuntimeStatus[] }
  | ModuleRuntimeStatus[];

type AuditListData = {
  items?: AuditLogEntry[];
  page?: number;
  pageSize?: number;
  total?: number;
  pagination?: {
    page?: number;
    pageSize?: number;
    limit?: number;
    total?: number;
  };
};

type SessionListData = { items: ActiveSession[] } | ActiveSession[];
type ItemsList<T> = { items: T[] } | T[];

function asStringId(value: unknown): string {
  if (value == null) return '';
  return String(value);
}

function unwrapItems<T>(data: ItemsList<T>): T[] {
  return Array.isArray(data) ? data : (data.items ?? []);
}

function normalizeModuleStatus(
  raw: Partial<ModuleRuntimeStatus> & { moduleId: string },
): ModuleRuntimeStatus {
  return {
    moduleId: raw.moduleId as AppModuleId,
    enabled: Boolean(raw.enabled),
    updatedAt: raw.updatedAt ?? new Date().toISOString(),
    updatedBy: raw.updatedBy ?? '—',
  };
}

function normalizeAuditEntry(raw: AuditLogEntry): AuditLogEntry {
  return {
    ...raw,
    id: asStringId(raw.id),
    userId: asStringId(raw.userId),
    userName: raw.userName ?? '—',
    summary: raw.summary ?? '',
    timestamp: raw.timestamp,
    moduleId: raw.moduleId,
    action: raw.action,
    before: raw.before ?? null,
    after: raw.after ?? null,
  };
}

function normalizeSession(raw: ActiveSession): ActiveSession {
  return {
    ...raw,
    id: asStringId(raw.id),
    userId: asStringId(raw.userId),
    userName: raw.userName ?? '—',
    device: raw.device ?? '—',
    browser: raw.browser ?? '—',
    ipAddress: raw.ipAddress,
    loggedInAt: raw.loggedInAt,
    lastActiveAt: raw.lastActiveAt,
    isCurrent: Boolean(raw.isCurrent),
  };
}

function normalizeBroadcast(raw: BroadcastMessage): BroadcastMessage {
  return {
    ...raw,
    id: asStringId(raw.id),
    title: raw.title ?? '',
    body: raw.body ?? '',
    target: raw.target === 'selected' ? 'selected' : 'all',
    targetUserIds: (raw.targetUserIds ?? []).map(asStringId),
    targetLabel: raw.targetLabel ?? (raw.target === 'selected' ? 'Terpilih' : 'Semua anggota'),
    scheduledAt: raw.scheduledAt ?? null,
    sentAt: raw.sentAt ?? null,
    status: raw.status ?? 'sent',
    createdAt: raw.createdAt ?? new Date().toISOString(),
  };
}

function normalizeSettings(raw: AppSettings): AppSettings {
  return {
    familyName: raw.familyName ?? '',
    timezone: raw.timezone ?? 'Asia/Jakarta',
    currency: raw.currency ?? 'IDR',
    logoUrl: raw.logoUrl ?? null,
  };
}

function normalizeBackup(raw: BackupJob): BackupJob {
  return {
    ...raw,
    id: asStringId(raw.id),
    moduleIds: (raw.moduleIds ?? []) as AppModuleId[],
    createdAt: raw.createdAt ?? new Date().toISOString(),
    status: raw.status ?? 'running',
    downloadUrl: raw.downloadUrl ?? null,
    errorMessage: raw.errorMessage ?? null,
  };
}

function normalizeAuditList(
  data: AuditListData,
  fallbackPage: number,
  fallbackSize: number,
): AuditListResult {
  const items = (data.items ?? []).map(normalizeAuditEntry);
  const page = data.page ?? data.pagination?.page ?? fallbackPage;
  const pageSize =
    data.pageSize ??
    data.pagination?.pageSize ??
    data.pagination?.limit ??
    fallbackSize;
  const total = data.total ?? data.pagination?.total ?? items.length;
  return { items, page, pageSize, total };
}

function toIsoOrNull(value: string | null): string | null {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? value : parsed.toISOString();
}

function toUserIds(ids: string[]): Array<string | number> {
  return ids.map((id) => {
    const n = Number(id);
    return Number.isFinite(n) && String(n) === id ? n : id;
  });
}

export async function fetchAdminDashboard(): Promise<AdminDashboardSummary> {
  const data = await apiFetch<AdminDashboardSummary>('/admin/dashboard');
  return {
    userCount: data.userCount ?? 0,
    activeSessionCount: data.activeSessionCount ?? 0,
    modulesEnabled: data.modulesEnabled ?? 0,
    modulesTotal: data.modulesTotal ?? 0,
    recentLogs: (data.recentLogs ?? []).map(normalizeAuditEntry),
  };
}

export async function fetchModuleStatuses(): Promise<ModuleRuntimeStatus[]> {
  const data = await apiFetch<ModuleStatusListData>('/admin/modules/status');
  return unwrapItems(data).map(normalizeModuleStatus);
}

export async function toggleModuleStatus(
  moduleId: AppModuleId,
  enabled: boolean,
  _actorName = 'Admin',
): Promise<ModuleRuntimeStatus> {
  const data = await apiFetch<ModuleRuntimeStatus>(
    `/admin/modules/${moduleId}/status`,
    {
      method: 'PATCH',
      body: JSON.stringify({ enabled }),
    },
  );
  return normalizeModuleStatus(data);
}

export async function fetchAgeRules(): Promise<AgeAccessRule[]> {
  await delay();
  return [...mockAgeRules];
}

export async function createAgeRule(
  input: CreateAgeRuleInput,
): Promise<AgeAccessRule> {
  await delay();
  if (input.maxAge != null && input.minAge > input.maxAge) {
    throw new Error('Umur minimum tidak boleh lebih besar dari umur maksimum.');
  }
  const rule: AgeAccessRule = {
    id: nextId('rule'),
    moduleId: input.moduleId,
    minAge: input.minAge,
    maxAge: input.maxAge,
    note: input.note,
    isActive: input.isActive ?? true,
    updatedAt: new Date().toISOString(),
  };
  setAgeRules([rule, ...mockAgeRules]);
  return rule;
}

export async function updateAgeRule(
  input: UpdateAgeRuleInput,
): Promise<AgeAccessRule> {
  await delay();
  const existing = mockAgeRules.find((r) => r.id === input.id);
  if (!existing) throw new Error('Rule tidak ditemukan.');
  const minAge = input.minAge ?? existing.minAge;
  const maxAge =
    input.maxAge === undefined ? existing.maxAge : input.maxAge;
  if (maxAge != null && minAge > maxAge) {
    throw new Error('Umur minimum tidak boleh lebih besar dari umur maksimum.');
  }
  const updated: AgeAccessRule = {
    ...existing,
    ...input,
    minAge,
    maxAge,
    updatedAt: new Date().toISOString(),
  };
  setAgeRules(mockAgeRules.map((r) => (r.id === input.id ? updated : r)));
  return updated;
}

export async function deleteAgeRule(id: string): Promise<void> {
  await delay();
  setAgeRules(mockAgeRules.filter((r) => r.id !== id));
}

export async function fetchAuditLogs(
  query: AuditQuery = {},
): Promise<AuditListResult> {
  const page = query.page ?? 1;
  const pageSize = query.pageSize ?? 8;
  const data = await apiFetch<AuditListData>(
    `/admin/audit-logs${buildQuery({
      q: query.q?.trim() || undefined,
      userId: query.userId || undefined,
      moduleId: query.moduleId || undefined,
      action: query.action || undefined,
      from: query.from || undefined,
      to: query.to || undefined,
      page: String(page),
      pageSize: String(pageSize),
    })}`,
  );
  return normalizeAuditList(data, page, pageSize);
}

export async function fetchAuditLogDetail(id: string): Promise<AuditLogEntry> {
  const data = await apiFetch<AuditLogEntry>(`/admin/audit-logs/${id}`);
  return normalizeAuditEntry(data);
}

export async function fetchSessions(userId?: string): Promise<ActiveSession[]> {
  const data = await apiFetch<SessionListData>(
    `/admin/sessions${buildQuery({
      userId: userId || undefined,
    })}`,
  );
  return unwrapItems(data).map(normalizeSession);
}

export async function forceLogoutSession(
  sessionId: string,
  _actorName = 'Admin',
): Promise<void> {
  await apiFetch<{ revoked?: boolean }>(
    `/admin/sessions/${sessionId}/revoke`,
    { method: 'POST' },
  );
}

export async function fetchBroadcasts(): Promise<BroadcastMessage[]> {
  const data = await apiFetch<ItemsList<BroadcastMessage>>('/admin/broadcasts');
  return unwrapItems(data).map(normalizeBroadcast);
}

export async function sendBroadcast(
  input: SendBroadcastInput,
): Promise<BroadcastMessage> {
  const data = await apiFetch<BroadcastMessage>('/admin/broadcasts', {
    method: 'POST',
    body: JSON.stringify({
      title: input.title.trim(),
      body: input.body,
      target: input.target,
      targetUserIds:
        input.target === 'selected' ? toUserIds(input.targetUserIds) : [],
      scheduledAt: toIsoOrNull(input.scheduledAt),
    }),
  });
  return normalizeBroadcast(data);
}

export async function fetchSettings(): Promise<AppSettings> {
  const data = await apiFetch<AppSettings>('/admin/settings');
  return normalizeSettings(data);
}

export async function saveSettings(
  input: AppSettings,
): Promise<AppSettings> {
  const data = await apiFetch<AppSettings>('/admin/settings', {
    method: 'PUT',
    body: JSON.stringify({
      familyName: input.familyName.trim(),
      timezone: input.timezone,
      currency: input.currency,
      logoUrl: input.logoUrl,
    }),
  });
  return normalizeSettings(data);
}

export async function uploadSettingsLogo(file: File): Promise<string> {
  const form = new FormData();
  form.append('file', file);
  const data = await apiFormFetch<{ logoUrl: string }>(
    '/admin/settings/logo',
    form,
  );
  if (!data?.logoUrl) {
    throw new Error('Upload logo gagal: URL tidak diterima.');
  }
  return data.logoUrl;
}

export async function fetchBackups(): Promise<BackupJob[]> {
  const data = await apiFetch<ItemsList<BackupJob>>('/admin/backups');
  return unwrapItems(data).map(normalizeBackup);
}

export async function fetchBackupById(id: string): Promise<BackupJob> {
  const data = await apiFetch<BackupJob>(`/admin/backups/${id}`);
  return normalizeBackup(data);
}

export async function triggerBackup(
  moduleIds: AppModuleId[],
): Promise<BackupJob> {
  const data = await apiFetch<BackupJob>('/admin/backups', {
    method: 'POST',
    body: JSON.stringify({ moduleIds }),
  });
  return normalizeBackup(data);
}

/** Poll job sampai success/failed (backup async 202). */
export async function pollBackupUntilDone(
  id: string,
  options?: { intervalMs?: number; maxAttempts?: number },
): Promise<BackupJob> {
  const intervalMs = options?.intervalMs ?? 1500;
  const maxAttempts = options?.maxAttempts ?? 40;

  let latest = await fetchBackupById(id);
  for (let i = 0; i < maxAttempts && latest.status === 'running'; i += 1) {
    await delay(intervalMs);
    latest = await fetchBackupById(id);
  }
  return latest;
}

export async function fetchSelectableUsers(): Promise<AdminUserOption[]> {
  const data = await apiFetch<
    ItemsList<{ id: string | number; name?: string; fullName?: string }>
  >(`/admin/users${buildQuery({ for: 'broadcast' })}`);

  return unwrapItems(data).map((u) => ({
    id: asStringId(u.id),
    name: u.name?.trim() || u.fullName?.trim() || `User ${u.id}`,
  }));
}
