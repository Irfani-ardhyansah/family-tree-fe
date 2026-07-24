import type { EventContribution, FamilyEvent } from '@/types/event';

export type GalleryItem = EventContribution & {
  contributorName: string;
};

/** Semua orang keluarga boleh lihat jika attendeeIds kosong. */
export function canAccessEvent(
  event: FamilyEvent,
  currentUserId: string | undefined,
): boolean {
  if (event.canAccess != null) return event.canAccess;

  const attendees = event.attendeeIds ?? [];
  if (attendees.length === 0) return true;
  if (!currentUserId) return false;
  return attendees.includes(currentUserId);
}

export function isRestrictedEvent(event: FamilyEvent): boolean {
  if (event.isRestricted != null) return event.isRestricted;
  return (event.attendeeIds ?? []).length > 0;
}

/** Gabungkan foto cover + kontribusi menjadi satu daftar galeri. */
export function buildGalleryItems(
  event: FamilyEvent,
  getPersonName: (id: string) => string,
): GalleryItem[] {
  const items: GalleryItem[] = [];
  const photoUrls = event.photoUrls ?? [];
  const contributions = event.contributions ?? [];
  const personIds = event.personIds ?? [];

  for (const url of photoUrls) {
    const contributorId = personIds[0] ?? 'me';
    items.push({
      id: `cover-${url.slice(-12)}`,
      photoUrl: url,
      contributorId,
      caption: 'Foto acara',
      createdAt: event.date,
      contributorName: getPersonName(contributorId),
    });
  }

  for (const c of contributions) {
    items.push({
      ...c,
      contributorName: getPersonName(c.contributorId),
    });
  }

  return items.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

export function groupByContributor(
  items: GalleryItem[],
): { contributorId: string; name: string; count: number }[] {
  const map = new Map<string, { name: string; count: number }>();
  for (const item of items) {
    const existing = map.get(item.contributorId);
    if (existing) {
      existing.count += 1;
    } else {
      map.set(item.contributorId, {
        name: item.contributorName,
        count: 1,
      });
    }
  }
  return [...map.entries()]
    .map(([contributorId, { name, count }]) => ({
      contributorId,
      name,
      count,
    }))
    .sort((a, b) => b.count - a.count);
}
