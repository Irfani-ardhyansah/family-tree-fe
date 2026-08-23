import { apiFetch, ApiClientError } from '@/shared/lib/apiClient';
import { buildQuery } from '@/shared/lib/apiQuery';
import type {
  CalendarEventTypeIconKey,
  CalendarEventTypeToneKey,
  CoreCalendarEventType,
  CoreDocument,
  CoreDocumentDraft,
  CoreDocumentType,
  CoreMember,
  CoreMemberRole,
  DocumentTypeIconKey,
  DocumentTypeToneKey,
  ReminderDays,
} from '@/modules/family-core/types';

/* ─── API DTOs (mirror BE /fc) ─── */

export type FcMemberDto = {
  personId: number;
  fullName: string;
  nickname: string | null;
  photoUrl: string | null;
  gender: string | null;
  kind: 'core' | 'in_law';
  relationLabel: string | null;
};

export type FcDocumentTypeDto = {
  id: number;
  slug: string;
  label: string;
  iconKey: string;
  toneKey: string;
  extras: Array<{ key: string; label: string; placeholder?: string }>;
  defaultLifetime: boolean;
  allowCustomTitle: boolean;
  isSystem: boolean;
  sortOrder: number;
  canDelete: boolean;
  deleteBlockedReason: string | null;
};

export type FcCalendarEventTypeDto = {
  id: number;
  slug: string;
  label: string;
  iconKey: string;
  toneKey: string;
  linksToHealth: boolean;
  isSystem: boolean;
  sortOrder: number;
  canDelete: boolean;
  deleteBlockedReason: string | null;
};

export type FcDocumentListItemDto = {
  id: number;
  personId: number;
  documentTypeSlug: string;
  title: string;
  numberMasked: string;
  issuedAt: string | null;
  expiresAt: string | null;
  isLifetime: boolean;
  reminderEnabled: boolean;
  reminderDays: number | null;
  extras: Record<string, string>;
  fileCount: number;
  createdAt: string;
  updatedAt: string;
};

export type FcDocumentDetailDto = FcDocumentListItemDto & {
  number: string;
  notes: string | null;
  customTitle: string | null;
  files: Array<{ id: number; mediaId: string; url: string; sortOrder: number }>;
  createdByPersonId: number;
};

const AVATAR_TONES = [
  'bg-slate-600',
  'bg-rose-500',
  'bg-sky-600',
  'bg-violet-500',
  'bg-teal-600',
  'bg-stone-600',
  'bg-pink-500',
  'bg-amber-600',
] as const;

const DOC_ICON_KEYS = new Set<DocumentTypeIconKey>([
  'user',
  'home',
  'fileText',
  'file',
  'heart',
  'briefcase',
  'creditCard',
  'key',
  'truck',
  'award',
  'shield',
]);

const DOC_TONE_KEYS = new Set<DocumentTypeToneKey>([
  'sky',
  'indigo',
  'violet',
  'blue',
  'rose',
  'orange',
  'amber',
  'teal',
  'emerald',
  'fuchsia',
  'cyan',
  'gray',
]);

const CAL_ICON_KEYS = new Set<CalendarEventTypeIconKey>([
  'bookOpen',
  'briefcase',
  'gift',
  'heart',
  'creditCard',
  'star',
  'calendar',
  'home',
  'users',
  'bell',
]);

const CAL_TONE_KEYS = new Set<CalendarEventTypeToneKey>([
  'indigo',
  'slate',
  'pink',
  'rose',
  'amber',
  'violet',
  'gray',
  'sky',
  'teal',
  'emerald',
]);

function initialsFrom(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return `${parts[0]![0] ?? ''}${parts[1]![0] ?? ''}`.toUpperCase();
}

function mapRole(dto: FcMemberDto): CoreMemberRole {
  if (dto.kind !== 'in_law') return 'child';
  const label = (dto.relationLabel ?? '').toLowerCase();
  if (label.includes('ayah') || label.includes('bapak') || label.includes('father')) {
    return 'father_in_law';
  }
  return 'mother_in_law';
}

function asReminderDays(value: number | null | undefined): ReminderDays {
  if (value === 7 || value === 14 || value === 30 || value === 60 || value === 90) {
    return value;
  }
  return 30;
}

function asDocIcon(key: string): DocumentTypeIconKey {
  return DOC_ICON_KEYS.has(key as DocumentTypeIconKey)
    ? (key as DocumentTypeIconKey)
    : 'file';
}

function asDocTone(key: string): DocumentTypeToneKey {
  return DOC_TONE_KEYS.has(key as DocumentTypeToneKey)
    ? (key as DocumentTypeToneKey)
    : 'gray';
}

function asCalIcon(key: string): CalendarEventTypeIconKey {
  return CAL_ICON_KEYS.has(key as CalendarEventTypeIconKey)
    ? (key as CalendarEventTypeIconKey)
    : 'calendar';
}

function asCalTone(key: string): CalendarEventTypeToneKey {
  return CAL_TONE_KEYS.has(key as CalendarEventTypeToneKey)
    ? (key as CalendarEventTypeToneKey)
    : 'gray';
}

export function mapFcMember(dto: FcMemberDto): CoreMember {
  const name = dto.nickname?.trim() || dto.fullName;
  return {
    id: String(dto.personId),
    name,
    role: mapRole(dto),
    initials: initialsFrom(name),
    avatarTone: AVATAR_TONES[dto.personId % AVATAR_TONES.length]!,
  };
}

export function mapFcDocumentType(dto: FcDocumentTypeDto): CoreDocumentType {
  return {
    id: String(dto.id),
    slug: dto.slug,
    label: dto.label,
    iconKey: asDocIcon(dto.iconKey),
    toneKey: asDocTone(dto.toneKey),
    extras: dto.extras ?? [],
    defaultLifetime: dto.defaultLifetime,
    allowCustomTitle: dto.allowCustomTitle,
    isSystem: dto.isSystem,
    sortOrder: dto.sortOrder,
  };
}

export function mapFcCalendarEventType(
  dto: FcCalendarEventTypeDto,
): CoreCalendarEventType {
  return {
    id: String(dto.id),
    slug: dto.slug,
    label: dto.label,
    iconKey: asCalIcon(dto.iconKey),
    toneKey: asCalTone(dto.toneKey),
    linksToHealth: dto.linksToHealth,
    isSystem: dto.isSystem,
    sortOrder: dto.sortOrder,
  };
}

export function mapFcDocumentListItem(dto: FcDocumentListItemDto): CoreDocument {
  return {
    id: String(dto.id),
    memberId: String(dto.personId),
    type: dto.documentTypeSlug,
    title: dto.title,
    number: dto.numberMasked,
    issuedAt: dto.issuedAt,
    expiresAt: dto.expiresAt,
    lifetime: dto.isLifetime,
    notes: '',
    reminderEnabled: dto.reminderEnabled,
    reminderDays: asReminderDays(dto.reminderDays),
    extras: dto.extras ?? {},
    scanUrl: dto.fileCount > 0 ? 'api' : null,
    createdAt: dto.createdAt,
    updatedAt: dto.updatedAt,
  };
}

export function mapFcDocumentDetail(dto: FcDocumentDetailDto): CoreDocument {
  return {
    id: String(dto.id),
    memberId: String(dto.personId),
    type: dto.documentTypeSlug,
    title: dto.title,
    number: dto.number,
    issuedAt: dto.issuedAt,
    expiresAt: dto.expiresAt,
    lifetime: dto.isLifetime,
    notes: dto.notes ?? '',
    reminderEnabled: dto.reminderEnabled,
    reminderDays: asReminderDays(dto.reminderDays),
    extras: dto.extras ?? {},
    scanUrl: dto.files?.[0]?.url ?? (dto.fileCount > 0 ? 'api' : null),
    createdAt: dto.createdAt,
    updatedAt: dto.updatedAt,
  };
}

function draftToApiBody(draft: CoreDocumentDraft) {
  const personId = Number(draft.memberId);
  if (!Number.isFinite(personId) || personId <= 0) {
    throw new ApiClientError('VALIDATION_ERROR', 'Anggota tidak valid untuk API.');
  }
  return {
    personId,
    documentTypeSlug: draft.type,
    customTitle: draft.title,
    documentNumber: draft.number,
    issuedAt: draft.issuedAt,
    expiresAt: draft.expiresAt,
    isLifetime: draft.lifetime,
    notes: draft.notes || null,
    extras: draft.extras,
    reminderEnabled: draft.reminderEnabled,
    reminderDays: draft.reminderEnabled ? draft.reminderDays : null,
  };
}

/* ─── Endpoints ─── */

export async function listFcMembers(): Promise<CoreMember[]> {
  const data = await apiFetch<FcMemberDto[] | { items: FcMemberDto[] }>(
    '/fc/members',
  );
  const rows = Array.isArray(data) ? data : (data.items ?? []);
  return rows.map(mapFcMember);
}

export async function listFcDocumentTypes(): Promise<CoreDocumentType[]> {
  const data = await apiFetch<FcDocumentTypeDto[] | { items: FcDocumentTypeDto[] }>(
    '/fc/document-types',
  );
  const rows = Array.isArray(data) ? data : (data.items ?? []);
  return rows.map(mapFcDocumentType);
}

export async function createFcDocumentType(body: {
  label: string;
  iconKey: DocumentTypeIconKey;
  toneKey: DocumentTypeToneKey;
  extras?: CoreDocumentType['extras'];
  defaultLifetime?: boolean;
  allowCustomTitle?: boolean;
}): Promise<CoreDocumentType> {
  const data = await apiFetch<FcDocumentTypeDto>('/fc/document-types', {
    method: 'POST',
    body: JSON.stringify(body),
  });
  return mapFcDocumentType(data);
}

export async function updateFcDocumentType(
  id: string,
  body: Partial<{
    label: string;
    iconKey: DocumentTypeIconKey;
    toneKey: DocumentTypeToneKey;
    extras: CoreDocumentType['extras'];
    defaultLifetime: boolean;
    allowCustomTitle: boolean;
  }>,
): Promise<CoreDocumentType> {
  const data = await apiFetch<FcDocumentTypeDto>(`/fc/document-types/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
  return mapFcDocumentType(data);
}

export async function deleteFcDocumentType(id: string): Promise<void> {
  await apiFetch<{ deleted: true }>(`/fc/document-types/${id}`, {
    method: 'DELETE',
  });
}

export async function listFcCalendarEventTypes(): Promise<CoreCalendarEventType[]> {
  const data = await apiFetch<
    FcCalendarEventTypeDto[] | { items: FcCalendarEventTypeDto[] }
  >('/fc/calendar-event-types');
  const rows = Array.isArray(data) ? data : (data.items ?? []);
  return rows.map(mapFcCalendarEventType);
}

export async function createFcCalendarEventType(body: {
  label: string;
  iconKey: CalendarEventTypeIconKey;
  toneKey: CalendarEventTypeToneKey;
  linksToHealth?: boolean;
}): Promise<CoreCalendarEventType> {
  const data = await apiFetch<FcCalendarEventTypeDto>('/fc/calendar-event-types', {
    method: 'POST',
    body: JSON.stringify(body),
  });
  return mapFcCalendarEventType(data);
}

export async function updateFcCalendarEventType(
  id: string,
  body: Partial<{
    label: string;
    iconKey: CalendarEventTypeIconKey;
    toneKey: CalendarEventTypeToneKey;
    linksToHealth: boolean;
  }>,
): Promise<CoreCalendarEventType> {
  const data = await apiFetch<FcCalendarEventTypeDto>(
    `/fc/calendar-event-types/${id}`,
    {
      method: 'PATCH',
      body: JSON.stringify(body),
    },
  );
  return mapFcCalendarEventType(data);
}

export async function deleteFcCalendarEventType(id: string): Promise<void> {
  await apiFetch<{ deleted: true }>(`/fc/calendar-event-types/${id}`, {
    method: 'DELETE',
  });
}

export async function listFcDocuments(personId?: string): Promise<CoreDocument[]> {
  const query = buildQuery(
    personId ? { personId: String(Number(personId) || '') } : undefined,
  );
  const data = await apiFetch<
    FcDocumentListItemDto[] | { items: FcDocumentListItemDto[] }
  >(`/fc/documents${query}`);
  const rows = Array.isArray(data) ? data : (data.items ?? []);
  return rows.map(mapFcDocumentListItem);
}

export async function getFcDocument(id: string): Promise<CoreDocument> {
  const data = await apiFetch<FcDocumentDetailDto>(`/fc/documents/${id}`);
  return mapFcDocumentDetail(data);
}

export async function createFcDocument(
  draft: CoreDocumentDraft,
): Promise<CoreDocument> {
  const data = await apiFetch<FcDocumentDetailDto>('/fc/documents', {
    method: 'POST',
    body: JSON.stringify(draftToApiBody(draft)),
  });
  return mapFcDocumentDetail(data);
}

export async function updateFcDocument(
  id: string,
  draft: CoreDocumentDraft,
): Promise<CoreDocument> {
  const data = await apiFetch<FcDocumentDetailDto>(`/fc/documents/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(draftToApiBody(draft)),
  });
  return mapFcDocumentDetail(data);
}

export async function deleteFcDocument(id: string): Promise<void> {
  await apiFetch<{ deleted: true }>(`/fc/documents/${id}`, {
    method: 'DELETE',
  });
}

export function getFcApiErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof ApiClientError) return error.message || fallback;
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}
