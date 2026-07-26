import { useCallback, useEffect, useMemo, useState } from 'react';
import { useDataSource } from '@/context/DataSourceContext';
import { useEvents as useMockEvents } from '@/context/EventContext';
import { ApiClientError } from '@/lib/apiClient';
import {
  addEventContribution,
  fetchEventById,
  updateEventById,
} from '@/lib/eventsApi';
import { fetchPersonTree } from '@/lib/personApi';
import type { FamilyEvent } from '@/types/event';
import type { Person as LocalPerson } from '@/types/person';
import {
  apiEventToLocal,
  apiPersonToLocal,
  localEventToApiPayload,
} from '@/utils/featureApiMapper';

export function useEventDetail(
  eventId: string | undefined,
  focusPersonId: number | null,
) {
  const { source } = useDataSource();
  const mockCtx = useMockEvents();

  const [event, setEvent] = useState<FamilyEvent | null>(null);
  const [allPersons, setAllPersons] = useState<LocalPerson[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [accessForbidden, setAccessForbidden] = useState(false);

  const mockEvent = useMemo(
    () => (eventId ? mockCtx.getEventById(eventId) ?? null : null),
    [mockCtx, eventId],
  );

  const loadMock = useCallback(() => {
    setEvent(mockEvent);
    setAccessForbidden(false);
    setError(null);
    setIsLoading(false);
  }, [mockEvent]);

  const loadApi = useCallback(async () => {
    if (!eventId || focusPersonId == null) return;

    setIsLoading(true);
    setError(null);
    setAccessForbidden(false);

    try {
      const [data, treeData] = await Promise.all([
        fetchEventById(Number(eventId)),
        fetchPersonTree().catch(() => null),
      ]);

      setEvent(apiEventToLocal(data));
      if (treeData) {
        setAllPersons(treeData.persons.map(apiPersonToLocal));
      }
    } catch (err) {
      if (
        err instanceof ApiClientError &&
        err.code === 'EVENT_ACCESS_FORBIDDEN'
      ) {
        setAccessForbidden(true);
        setEvent(null);
      } else {
        setError(
          err instanceof ApiClientError
            ? err.message
            : 'Gagal memuat detail acara.',
        );
        setEvent(null);
      }
    } finally {
      setIsLoading(false);
    }
  }, [eventId, focusPersonId]);

  useEffect(() => {
    if (!eventId) {
      setEvent(null);
      return;
    }

    if (source === 'mock') {
      setIsLoading(true);
      loadMock();
      return;
    }

    void loadApi();
  }, [source, eventId, loadMock, loadApi]);

  const addContribution = useCallback(
    async (
      contributorId: string,
      data: { mediaIds: string[]; photoUrls?: string[]; caption?: string },
    ) => {
      if (!eventId || !contributorId) return;

      if (source === 'mock') {
        const urls =
          data.photoUrls && data.photoUrls.length > 0
            ? data.photoUrls
            : data.mediaIds.map((id) => `mock://${id}`);
        for (const photoUrl of urls) {
          mockCtx.addContribution(eventId, {
            photoUrl,
            contributorId,
            caption: data.caption,
          });
        }
        loadMock();
        return;
      }

      if (focusPersonId == null) {
        throw new Error('Sesi tidak valid.');
      }

      const updated = await addEventContribution(Number(eventId), {
        mediaIds: data.mediaIds,
        caption: data.caption ?? null,
      });
      setEvent(apiEventToLocal(updated));
    },
    [source, eventId, focusPersonId, mockCtx, loadMock],
  );

  /** Hapus foto cover acara (bukan kontribusi anggota) langsung dari detail. */
  const removeCoverPhoto = useCallback(
    async (photoUrl: string) => {
      if (!eventId) return;

      const current = source === 'mock' ? mockEvent : event;
      if (!current) return;

      const nextPhotoUrls = (current.photoUrls ?? []).filter(
        (url) => url !== photoUrl,
      );

      if (source === 'mock') {
        mockCtx.updateEvent({ ...current, photoUrls: nextPhotoUrls });
        loadMock();
        return;
      }

      if (focusPersonId == null) {
        throw new Error('Sesi tidak valid.');
      }

      const payload = localEventToApiPayload({
        title: current.title,
        type: current.type,
        date: current.date,
        endDate: current.endDate,
        location: current.location,
        description: current.description,
        personIds: current.personIds,
        photoUrls: nextPhotoUrls,
        attendeeIds: current.attendeeIds ?? [],
      });
      const updated = await updateEventById(Number(eventId), payload);
      setEvent(apiEventToLocal(updated));
    },
    [source, eventId, focusPersonId, mockEvent, event, mockCtx, loadMock],
  );

  const displayEvent = source === 'mock' ? mockEvent : event;

  return {
    source,
    event: displayEvent,
    allPersons,
    isLoading,
    error,
    accessForbidden,
    reload: source === 'mock' ? loadMock : loadApi,
    addContribution,
    removeCoverPhoto,
  };
}
