import type {
  ApiEvent,
  ApiEventContribution,
  ApiMemoriamTribute,
  ApiPrayerRecord,
  EventWritePayload,
  MemoriamDeceasedItem,
  TributeWritePayload,
} from '@/types/api';
import type { EventContribution, FamilyEvent } from '@/types/event';
import type { MemoriamTribute, PrayerRecord } from '@/types/memoriam';
import type { Person as LocalPerson } from '@/types/person';
import { apiPersonToLocal } from '@/utils/personApiMapper';

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
  };
}

export function localEventToApiPayload(
  data: Omit<FamilyEvent, 'id' | 'contributions' | 'canAccess' | 'isRestricted'>,
): EventWritePayload {
  return {
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
}

export function apiTributeToLocal(t: ApiMemoriamTribute): MemoriamTribute {
  return {
    id: String(t.id),
    deceasedId: String(t.deceasedId),
    authorId: String(t.authorId),
    content: t.content,
    photoUrls: t.photoUrls ?? [],
    createdAt: t.createdAt,
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

export function localTributeToApiPayload(data: {
  content: string;
  photoUrls: string[];
}): TributeWritePayload {
  return {
    content: data.content,
    photoUrls: data.photoUrls ?? [],
  };
}

export { apiPersonToLocal };
