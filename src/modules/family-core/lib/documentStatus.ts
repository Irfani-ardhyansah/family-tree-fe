import type { CoreDocument, DocumentStatus } from '@/modules/family-core/types';

const DAY_MS = 24 * 60 * 60 * 1000;

function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

/** Days until expiry. Negative = already expired. Null = no expiry. */
export function daysUntilExpiry(doc: Pick<CoreDocument, 'lifetime' | 'expiresAt'>): number | null {
  if (doc.lifetime || !doc.expiresAt) return null;
  const exp = new Date(doc.expiresAt);
  exp.setHours(0, 0, 0, 0);
  return Math.round((exp.getTime() - startOfToday().getTime()) / DAY_MS);
}

export function getDocumentStatus(
  doc: Pick<CoreDocument, 'lifetime' | 'expiresAt'>,
): DocumentStatus {
  const days = daysUntilExpiry(doc);
  if (days === null) return 'active';
  if (days < 0) return 'expired';
  if (days <= 90) return 'expiring';
  return 'active';
}

export function statusSortRank(status: DocumentStatus): number {
  if (status === 'expired') return 0;
  if (status === 'expiring') return 1;
  return 2;
}

export function sortDocumentsByUrgency(docs: CoreDocument[]): CoreDocument[] {
  return [...docs].sort((a, b) => {
    const sa = getDocumentStatus(a);
    const sb = getDocumentStatus(b);
    const rank = statusSortRank(sa) - statusSortRank(sb);
    if (rank !== 0) return rank;
    const da = daysUntilExpiry(a);
    const db = daysUntilExpiry(b);
    if (da !== null && db !== null) return da - db;
    return a.title.localeCompare(b.title, 'id');
  });
}

export function expiryHint(doc: Pick<CoreDocument, 'lifetime' | 'expiresAt'>): string | null {
  const days = daysUntilExpiry(doc);
  if (days === null) return null;
  if (days < 0) {
    const ago = Math.abs(days);
    return ago === 0 ? 'Kadaluarsa hari ini' : `Kadaluarsa ${ago} hari lalu`;
  }
  if (days === 0) return 'Kadaluarsa hari ini';
  return `Kadaluarsa dalam ${days} hari`;
}
