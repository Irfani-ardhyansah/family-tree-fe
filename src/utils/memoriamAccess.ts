import type { Person } from '@/types/person';
import { getRichTextPlainText } from '@/utils/richText';

const PRAYER_SESSION_KEY = (personId: string) => `memoriam-prayer-${personId}`;

export function buildPersonMap(persons: Person[]): Map<string, Person> {
  return new Map(persons.map((p) => [p.id, p]));
}

/** Semua anggota terhubung ke mendiang via parent, spouse, children. */
export function getConnectedFamilyIds(
  deceasedId: string,
  persons: Person[],
): Set<string> {
  const map = buildPersonMap(persons);
  const childrenOf = new Map<string, string[]>();
  for (const p of persons) {
    if (p.fatherId) {
      const list = childrenOf.get(p.fatherId) ?? [];
      list.push(p.id);
      childrenOf.set(p.fatherId, list);
    }
    if (p.motherId) {
      const list = childrenOf.get(p.motherId) ?? [];
      if (!list.includes(p.id)) list.push(p.id);
      childrenOf.set(p.motherId, list);
    }
  }

  const connected = new Set<string>();
  const queue = [deceasedId];

  while (queue.length > 0) {
    const id = queue.shift()!;
    if (connected.has(id)) continue;
    connected.add(id);

    const person = map.get(id);
    if (!person) continue;

    if (person.fatherId) queue.push(person.fatherId);
    if (person.motherId) queue.push(person.motherId);
    for (const sid of person.spouseIds) queue.push(sid);
    for (const cid of childrenOf.get(id) ?? []) queue.push(cid);
  }

  return connected;
}

export function canAccessMemorial(
  viewerId: string | undefined,
  deceasedId: string,
  persons: Person[],
): boolean {
  if (!viewerId) return false;
  return getConnectedFamilyIds(deceasedId, persons).has(viewerId);
}

export function isDeceasedMuslim(person: Person): boolean {
  return person.status === 'deceased' && (person.religion ?? 'islam') === 'islam';
}

export function hasPrayedThisSession(personId: string): boolean {
  try {
    return sessionStorage.getItem(PRAYER_SESSION_KEY(personId)) === '1';
  } catch {
    return false;
  }
}

export function markPrayerSession(personId: string): void {
  try {
    sessionStorage.setItem(PRAYER_SESSION_KEY(personId), '1');
  } catch {
    /* ignore */
  }
}

export function getMemorialEntryPath(person: Person): string {
  const base = `/in-memoriam/${person.id}`;
  if (isDeceasedMuslim(person) && !hasPrayedThisSession(person.id)) {
    return `${base}/doa`;
  }
  return base;
}

export function getAlmarhumLabel(gender: Person['gender']): string {
  return gender === 'female' ? 'Almarhumah' : 'Almarhum';
}

export function getYearsSinceDeath(deathDate?: string): number | null {
  if (!deathDate) return null;
  const death = new Date(deathDate);
  const now = new Date();
  let years = now.getFullYear() - death.getFullYear();
  const anniversary = new Date(
    now.getFullYear(),
    death.getMonth(),
    death.getDate(),
  );
  if (now < anniversary) years -= 1;
  return Math.max(0, years);
}

export function formatLifeSpan(
  birthDate: string,
  deathDate?: string,
): string {
  const birth = new Date(birthDate).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  if (!deathDate) return birth;
  const death = new Date(deathDate).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  return `${birth} — ${death}`;
}

export function getAgeAtDeath(birthDate: string, deathDate?: string): number | null {
  if (!deathDate) return null;
  const birth = new Date(birthDate);
  const death = new Date(deathDate);
  let age = death.getFullYear() - birth.getFullYear();
  const m = death.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && death.getDate() < birth.getDate())) age -= 1;
  return age;
}

export type GalleryPhoto = {
  id: string;
  photoUrl: string;
  authorId: string;
  authorName: string;
  caption?: string;
  tributeId: string;
  createdAt: string;
};

export function buildMemorialGallery(
  tributes: { id: string; authorId: string; photoUrls: string[]; content: string; createdAt: string }[],
  getPersonName: (id: string) => string,
): GalleryPhoto[] {
  const photos: GalleryPhoto[] = [];
  for (const t of tributes) {
    for (let i = 0; i < t.photoUrls.length; i++) {
      photos.push({
        id: `${t.id}-photo-${i}`,
        photoUrl: t.photoUrls[i],
        authorId: t.authorId,
        authorName: getPersonName(t.authorId),
        caption: getRichTextPlainText(t.content).slice(0, 80),
        tributeId: t.id,
        createdAt: t.createdAt,
      });
    }
  }
  return photos.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

export function groupGalleryByAuthor(
  photos: GalleryPhoto[],
): { authorId: string; name: string; count: number }[] {
  const map = new Map<string, { name: string; count: number }>();
  for (const p of photos) {
    const ex = map.get(p.authorId);
    if (ex) ex.count += 1;
    else map.set(p.authorId, { name: p.authorName, count: 1 });
  }
  return [...map.entries()]
    .map(([authorId, { name, count }]) => ({ authorId, name, count }))
    .sort((a, b) => b.count - a.count);
}
