import type { AppModuleId } from '@/shared/data/moduleCatalog';

export type AgeAccessRule = {
  id: string;
  moduleId: AppModuleId;
  minAge: number;
  maxAge: number | null;
  note?: string;
  isActive: boolean;
  updatedAt: string;
};

export type ModuleRuntimeStatus = {
  moduleId: AppModuleId;
  enabled: boolean;
  updatedAt: string;
  updatedBy: string;
};

export type AuditAction =
  | 'create'
  | 'update'
  | 'delete'
  | 'login'
  | 'logout'
  | 'toggle_module'
  | 'force_logout'
  | 'broadcast'
  | 'backup'
  | 'settings';

export type AuditLogEntry = {
  id: string;
  timestamp: string;
  userName: string;
  userId: string;
  moduleId: AppModuleId | 'admin' | 'auth';
  action: AuditAction;
  summary: string;
  before?: Record<string, unknown> | null;
  after?: Record<string, unknown> | null;
};

export type ActiveSession = {
  id: string;
  userId: string;
  userName: string;
  device: string;
  browser: string;
  ipAddress?: string;
  loggedInAt: string;
  lastActiveAt: string;
  isCurrent: boolean;
};

export type BroadcastStatus = 'sent' | 'scheduled' | 'failed';

export type BroadcastMessage = {
  id: string;
  title: string;
  body: string;
  target: 'all' | 'selected';
  targetUserIds: string[];
  targetLabel: string;
  scheduledAt: string | null;
  sentAt: string | null;
  status: BroadcastStatus;
  createdAt: string;
};

export type AppSettings = {
  familyName: string;
  timezone: string;
  currency: string;
  logoUrl: string | null;
};

export type BackupStatus = 'success' | 'failed' | 'running';

export type BackupJob = {
  id: string;
  moduleIds: AppModuleId[];
  createdAt: string;
  status: BackupStatus;
  downloadUrl?: string | null;
  errorMessage?: string | null;
};

export type AdminDashboardSummary = {
  userCount: number;
  activeSessionCount: number;
  modulesEnabled: number;
  modulesTotal: number;
  recentLogs: AuditLogEntry[];
};

export type CreateAgeRuleInput = {
  moduleId: AppModuleId;
  minAge: number;
  maxAge: number | null;
  note?: string;
  isActive?: boolean;
};

export type UpdateAgeRuleInput = Partial<CreateAgeRuleInput> & { id: string };

export type SendBroadcastInput = {
  title: string;
  body: string;
  target: 'all' | 'selected';
  targetUserIds: string[];
  scheduledAt: string | null;
};
