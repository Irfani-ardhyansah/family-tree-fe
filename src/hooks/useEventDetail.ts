import { useCallback, useEffect, useMemo, useState } from 'react';
import { useDataSource } from '@/context/DataSourceContext';
import { useEvents as useMockEvents } from '@/context/EventContext';
import { ApiClientError } from '@/lib/apiClient';
import { addEventContribution, fetchEventById } from '@/lib/eventsApi';
import { fetchPersonTree } from '@/lib/personApi';
import type { FamilyEvent } from '@/types/event';
import type { Person as LocalPerson } from '@/types/person';
import {
  apiEventToLocal,
  apiPersonToLocal,
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
        fetchEventById(Number(eventId), focusPersonId),
        fetchPersonTree(focusPersonId).catch(() => null),
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
      photos: { photoUrl: string; caption?: string }[],
    ) => {
      if (!eventId || !contributorId) return;

      if (source === 'mock') {
        for (const photo of photos) {
          mockCtx.addContribution(eventId, {
            photoUrl: photo.photoUrl,
            contributorId,
            caption: photo.caption,
          });
        }
        loadMock();
        return;
      }

      if (focusPersonId == null) {
        throw new Error('Sesi tidak valid.');
      }

      let latest = event;
      for (const photo of photos) {
        const updated = await addEventContribution(
          Number(eventId),
          focusPersonId,
          {
            photoUrl: photo.photoUrl,
            caption: photo.caption ?? null,
          },
        );
        latest = apiEventToLocal(updated);
      }

      if (latest) setEvent(latest);
    },
    [source, eventId, focusPersonId, mockCtx, loadMock, event],
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
  };
}
