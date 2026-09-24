export type MediaPurpose =
  | 'event'
  | 'event_contribution'
  | 'memoriam_tribute'
  | 'person'
  | 'fc_document';

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

/** Default max attach count for Family Core document scans. */
export const MEDIA_MAX_FC_DOCUMENT = 5;

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

/** Prefill dropzone from document detail `files[]` (real media ids). */
export function documentFilesToMediaItems(
  files: Array<{ mediaId: string; url: string }>,
): MediaUploadItem[] {
  return files.map((file) => ({
    id: file.mediaId,
    url: file.url,
    pending: false,
  }));
}

/**
 * Ordered media ids for FC document attach (replace-all).
 * Skips temp/mock placeholders and in-flight/error rows.
 */
export function mediaItemsToOrderedIds(items: MediaUploadItem[]): string[] {
  return items
    .filter((item) => !item.uploading && !item.error)
    .map((item) => item.id)
    .filter(
      (id) =>
        !id.startsWith('temp-') &&
        !id.startsWith('mock-') &&
        !id.startsWith('existing-'),
    );
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
