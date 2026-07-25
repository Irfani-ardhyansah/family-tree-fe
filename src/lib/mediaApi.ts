import { apiFetch, apiFormFetch } from '@/lib/apiClient';
import type { MediaPurpose } from '@/types/media';

export type MediaRecord = {
  id: string;
  url: string;
  purpose: MediaPurpose;
  status: 'pending' | 'attached' | 'deleted';
  mimeType: string;
  sizeBytes: number;
  width?: number | null;
  height?: number | null;
  createdAt: string;
};

export type MediaCleanupResult = {
  deletedIds: string[];
  skippedIds: string[];
};

export async function uploadMedia(
  file: File,
  purpose: MediaPurpose,
  contextId?: string | number,
): Promise<MediaRecord> {
  const form = new FormData();
  form.append('file', file);
  form.append('purpose', purpose);
  if (contextId != null && contextId !== '') {
    form.append('contextId', String(contextId));
  }
  return apiFormFetch<MediaRecord>('/media/upload', form);
}

export async function deleteMedia(mediaId: string): Promise<void> {
  await apiFetch<void>(`/media/${mediaId}`, { method: 'DELETE' });
}

export async function cleanupMedia(mediaIds: string[]): Promise<MediaCleanupResult> {
  if (mediaIds.length === 0) {
    return { deletedIds: [], skippedIds: [] };
  }
  return apiFetch<MediaCleanupResult>('/media/cleanup', {
    method: 'POST',
    body: JSON.stringify({ mediaIds }),
  });
}
