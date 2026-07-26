export type MediaPurpose =
  | 'event'
  | 'event_contribution'
  | 'memoriam_tribute'
  | 'person';

export type MediaUploadItem = {
  id: string;
  url: string;
  /** false for photos already attached on server (edit mode) */
  pending?: boolean;
  uploading?: boolean;
  error?: string;
};

export const MEDIA_MAX_BYTES = 5 * 1024 * 1024;
export const MEDIA_ACCEPT = 'image/jpeg,image/png,image/webp,image/gif';

export function isPendingMediaItem(item: MediaUploadItem): boolean {
  return item.pending !== false && !item.id.startsWith('existing-');
}

export function urlsToExistingMediaItems(urls: string[]): MediaUploadItem[] {
  return urls.map((url, idx) => ({
    id: `existing-${idx}-${url.slice(-12)}`,
    url,
    pending: false,
  }));
}

export function splitMediaForSubmit(items: MediaUploadItem[]): {
  mediaIds: string[];
  photoUrls: string[];
} {
  const pending = items.filter(isPendingMediaItem);
  const existing = items.filter((i) => !isPendingMediaItem(i));
  return {
    mediaIds: pending.map((i) => i.id),
    photoUrls: existing.map((i) => i.url),
  };
}
