import { useCallback, useEffect, useMemo, useState } from 'react';
import { useDataSource } from '@/context/DataSourceContext';
import { useEvents as useMockEvents } from '@/context/EventContext';
import { useFamilyPerspective } from '@/context/FamilyPerspectiveContext';
import { ApiClientError } from '@/lib/apiClient';
import {
  createEvent,
  deleteEventById,
  fetchEvents,
  updateEventById,
  type EventListQuery,
} from '@/lib/eventsApi';
import { fetchPersonTree } from '@/lib/personApi';
import type { FamilyEvent } from '@/types/event';
import type { Person as LocalPerson } from '@/types/person';
import { eventMatchesPerspective } from '@/utils/familyPerspective';
import {
  apiEventToLocal,
  apiPersonToLocal,
  localEventToApiPayload,
} from '@/utils/featureApiMapper';

function isUpcoming(dateStr: string): boolean {
  return new Date(dateStr) >= new Date(new Date().toDateString());
}

function sortEvents(events: FamilyEvent[]): FamilyEvent[] {
  return [...events].sort((a, b) => {
    const aUp = isUpcoming(a.date);
    const bUp = isUpcoming(b.date);
    if (aUp !== bUp) return aUp ? -1 : 1;
    return aUp
      ? new Date(a.date).getTime() - new Date(b.date).getTime()
      : new Date(b.date).getTime() - new Date(a.date).getTime();
  });
}

export function useEventsPage(
  focusPersonId: number | null,
  apiQuery: EventListQuery = {},
) {
  const { source } = useDataSource();
  const mockCtx = useMockEvents();
  const { visiblePersonIds } = useFamilyPerspective();

  const [events, setEvents] = useState<FamilyEvent[]>([]);
  const [allPersons, setAllPersons] = useState<LocalPerson[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const queryKey = useMemo(() => JSON.stringify(apiQuery), [apiQuery]);

  const mockEvents = useMemo(
    () =>
      sortEvents(
        mockCtx.events.filter((e) =>
          eventMatchesPerspective(e.personIds, visiblePersonIds),
        ),
      ),
    [mockCtx.events, visiblePersonIds],
  );

  const loadMock = useCallback(() => {
    setEvents(mockEvents);
    setError(null);
    setIsLoading(false);
  }, [mockEvents]);

  const loadApi = useCallback(async () => {
    if (focusPersonId == null) return;

    setIsLoading(true);
    setError(null);

    try {
      const [data, treeData] = await Promise.all([
        fetchEvents(focusPersonId, apiQuery),
        fetchPersonTree(focusPersonId).catch(() => null),
      ]);

      setEvents(sortEvents(data.events.map(apiEventToLocal)));
      if (treeData) {
        setAllPersons(treeData.persons.map(apiPersonToLocal));
      }
    } catch (err) {
      setError(
        err instanceof ApiClientError
          ? err.message
          : 'Gagal memuat daftar acara.',
      );
    } finally {
      setIsLoading(false);
    }
  }, [focusPersonId, apiQuery]);

  useEffect(() => {
    if (source === 'mock') {
      setIsLoading(true);
      loadMock();
      return;
    }
    void loadApi();
  }, [source, loadMock, loadApi, queryKey]);

  const saveEvent = useCallback(
    async (data: Omit<FamilyEvent, 'id'>, editingId?: string) => {
      if (source === 'mock') {
        if (editingId) {
          const existing = mockCtx.getEventById(editingId);
          if (!existing) return;
          mockCtx.updateEvent({
            ...data,
            id: editingId,
            contributions: existing.contributions,
          });
        } else {
          mockCtx.addEvent({ ...data, contributions: [] });
        }
        loadMock();
        return;
      }

      if (focusPersonId == null) {
        throw new Error('Sesi tidak valid.');
      }

      const payload = localEventToApiPayload(data);

      if (editingId) {
        await updateEventById(Number(editingId), focusPersonId, payload);
      } else {
        await createEvent(focusPersonId, payload);
      }

      await loadApi();
    },
    [source, focusPersonId, mockCtx, loadMock, loadApi],
  );

  const removeEvent = useCallback(
    async (id: string) => {
      if (source === 'mock') {
        mockCtx.deleteEvent(id);
        loadMock();
        return;
      }

      if (focusPersonId == null) {
        throw new Error('Sesi tidak valid.');
      }

      await deleteEventById(Number(id), focusPersonId);
      await loadApi();
    },
    [source, focusPersonId, mockCtx, loadMock, loadApi],
  );

  return {
    source,
    events,
    allPersons,
    isLoading,
    error,
    reload: source === 'mock' ? loadMock : loadApi,
    saveEvent,
    removeEvent,
  };
}
