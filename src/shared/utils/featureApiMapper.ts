import type {
  ApiEvent,
  ApiEventContribution,
  ApiMemoriamTribute,
  ApiPrayerRecord,
  EventWritePayload,
  MemoriamDeceasedItem,
  TributeWritePayload,
} from '@/shared/types/api';
import type { EventContribution, FamilyEvent } from '@/shared/types/event';
import type { MemoriamTribute, PrayerRecord } from '@/shared/types/memoriam';
import type { Person as LocalPerson } from '@/shared/types/person';
import { apiPersonToLocal } from '@/shared/utils/personApiMapper';

export function apiContributionToLocal(c: ApiEventContribution): EventContribution {
  return {
    id: String(c.id),
    photoUrl: c.photoUrl,
    contributorId: String(c.contributorId),
    caption: c.caption ?? undefined,
    createdAt: c.createdAt,
  };
}

export function apiEventToLocal(event: ApiEvent): FamilyEvent {
  return {
    id: String(event.id),
    title: event.title,
    type: event.type,
    date: event.date,
    endDate: event.endDate ?? undefined,
    location: event.location ?? undefined,
    description: event.description ?? undefined,
    personIds: (event.personIds ?? []).map(String),
    photoUrls: event.photoUrls ?? [],
    attendeeIds: (event.attendeeIds ?? []).map(String),
    contributions: (event.contributions ?? []).map(apiContributionToLocal),
    isRestricted: event.isRestricted,
    canAccess: event.canAccess,
    createdById:
      event.createdById != null ? String(event.createdById) : undefined,
    canManage: event.canManage,
  };
}

export function localEventToApiPayload(
  data: Omit<
    FamilyEvent,
    | 'id'
    | 'contributions'
    | 'canAccess'
    | 'isRestricted'
    | 'createdById'
    | 'canManage'
  >,
  options?: { mediaIds?: string[] },
): EventWritePayload {
  const payload: EventWritePayload = {
    title: data.title.trim(),
    type: data.type,
    date: data.date,
    endDate: data.endDate?.trim() || null,
    location: data.location?.trim() || null,
    description: data.description?.trim() || null,
    personIds: data.personIds.map(Number),
    photoUrls: data.photoUrls ?? [],
    attendeeIds: (data.attendeeIds ?? []).map(Number),
  };

  if (options?.mediaIds && options.mediaIds.length > 0) {
    payload.mediaIds = options.mediaIds;
  }

  return payload;
}

export function apiTributeToLocal(
  t: ApiMemoriamTribute,
  deceasedId?: number | string,
): MemoriamTribute {
  return {
    id: String(t.id),
    deceasedId: String(t.deceasedId ?? deceasedId ?? ''),
    authorId: String(t.authorId),
    content: t.content ?? '',
    photoUrls: t.photoUrls ?? [],
    createdAt: t.createdAt,
    updatedAt: t.updatedAt,
    canManage: t.canManage,
  };
}

export function apiPrayerToLocal(p: ApiPrayerRecord): PrayerRecord {
  return {
    id: String(p.id),
    deceasedId: String(p.deceasedId),
    authorId: String(p.authorId),
    createdAt: p.createdAt,
  };
}

export function memoriamDeceasedToLocal(item: MemoriamDeceasedItem): LocalPerson {
  return {
    id: String(item.id),
    fullName: item.fullName,
    nickname: item.nickname ?? undefined,
    gender: item.gender,
    birthDate: item.birthDate,
    deathDate: item.deathDate ?? undefined,
    status: item.status ?? 'deceased',
    religion: item.religion ?? undefined,
    photoUrl: item.photoUrl ?? undefined,
    spouseIds: [],
    generationLabel: item.generationLabel,
  };
}

export function localTributeToApiPayload(
  data: {
    content: string;
    photoUrls?: string[];
    mediaIds?: string[];
  },
  options?: { replaceMedia?: boolean },
): TributeWritePayload {
  const payload: TributeWritePayload = { content: data.content };

  if (options?.replaceMedia) {
    // PATCH tribute: replace-all dari daftar final FE
    payload.mediaIds = data.mediaIds ?? [];
    payload.photoUrls = data.photoUrls ?? [];
    return payload;
  }

  if (data.mediaIds && data.mediaIds.length > 0) {
    payload.mediaIds = data.mediaIds;
    if (data.photoUrls && data.photoUrls.length > 0) {
      payload.photoUrls = data.photoUrls;
    }
    return payload;
  }

  return {
    ...payload,
    photoUrls: data.photoUrls ?? [],
  };
}

export { apiPersonToLocal };
