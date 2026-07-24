import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useDataSource } from '@/context/DataSourceContext';
import { useFamily } from '@/context/FamilyDataContext';
import { useMemoriam as useMockMemoriam } from '@/context/MemoriamContext';
import { ApiClientError } from '@/lib/apiClient';
import {
  addMemorialPrayer,
  createMemorialTribute,
  fetchMemorialDetail,
  fetchMemorialPrayers,
  fetchMemorialTributes,
  fetchMyMemorialPrayer,
} from '@/lib/memoriamApi';
import { fetchPersonTree } from '@/lib/personApi';
import type { MemoriamTribute, PrayerRecord } from '@/types/memoriam';
import type { Person as LocalPerson } from '@/types/person';
import {
  apiPersonToLocal,
  apiPrayerToLocal,
  apiTributeToLocal,
  localTributeToApiPayload,
  memoriamDeceasedToLocal,
} from '@/utils/featureApiMapper';

export function useMemorialDetail(
  deceasedId: string | undefined,
  focusPersonId: number | null,
) {
  const { source } = useDataSource();
  const { person } = useAuth();
  const { persons } = useFamily();
  const mockCtx = useMockMemoriam();

  const [deceased, setDeceased] = useState<LocalPerson | null>(null);
  const [allPersons, setAllPersons] = useState<LocalPerson[]>([]);
  const [tributes, setTributes] = useState<MemoriamTribute[]>([]);
  const [prayers, setPrayers] = useState<PrayerRecord[]>([]);
  const [hasPrayed, setHasPrayed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [accessForbidden, setAccessForbidden] = useState(false);

  const mockDeceased = deceasedId
    ? persons.find((p) => p.id === deceasedId) ?? null
    : null;

  const loadMock = useCallback(() => {
    if (!deceasedId) {
      setDeceased(null);
      return;
    }

    const authorId = person ? String(person.id) : '';
    setDeceased(mockDeceased);
    setAllPersons(persons);
    setTributes(mockCtx.getTributesFor(deceasedId));
    setPrayers(mockCtx.getPrayersFor(deceasedId));
    setHasPrayed(mockCtx.hasPrayed(deceasedId, authorId));
    setAccessForbidden(false);
    setError(null);
    setIsLoading(false);
  }, [deceasedId, mockDeceased, persons, mockCtx, person]);

  const loadApi = useCallback(async () => {
    if (!deceasedId || focusPersonId == null) return;

    setIsLoading(true);
    setError(null);
    setAccessForbidden(false);

    try {
      const [detail, tributeData, prayerData, myPrayer, treeData] =
        await Promise.all([
          fetchMemorialDetail(Number(deceasedId), focusPersonId),
          fetchMemorialTributes(Number(deceasedId), focusPersonId),
          fetchMemorialPrayers(Number(deceasedId), focusPersonId),
          fetchMyMemorialPrayer(Number(deceasedId), focusPersonId),
          fetchPersonTree(focusPersonId).catch(() => null),
        ]);

      setDeceased(memoriamDeceasedToLocal(detail.deceased));
      setTributes(tributeData.tributes.map(apiTributeToLocal));
      setPrayers(prayerData.prayers.map(apiPrayerToLocal));
      setHasPrayed(myPrayer.hasPrayed);
      if (treeData) {
        setAllPersons(treeData.persons.map(apiPersonToLocal));
      }
    } catch (err) {
      if (
        err instanceof ApiClientError &&
        err.code === 'MEMORIAL_ACCESS_FORBIDDEN'
      ) {
        setAccessForbidden(true);
        setDeceased(null);
      } else {
        setError(
          err instanceof ApiClientError
            ? err.message
            : 'Gagal memuat halaman kenangan.',
        );
        setDeceased(null);
      }
    } finally {
      setIsLoading(false);
    }
  }, [deceasedId, focusPersonId]);

  useEffect(() => {
    if (!deceasedId) {
      setDeceased(null);
      return;
    }

    if (source === 'mock') {
      setIsLoading(true);
      loadMock();
      return;
    }

    void loadApi();
  }, [source, deceasedId, loadMock, loadApi]);

  const addTribute = useCallback(
    async (authorId: string, data: { content: string; photoUrls: string[] }) => {
      if (!deceasedId || !authorId) return;

      if (source === 'mock') {
        mockCtx.addTribute({
          deceasedId,
          authorId,
          content: data.content,
          photoUrls: data.photoUrls,
        });
        loadMock();
        return;
      }

      if (focusPersonId == null) {
        throw new Error('Sesi tidak valid.');
      }

      const created = await createMemorialTribute(
        Number(deceasedId),
        focusPersonId,
        localTributeToApiPayload(data),
      );

      setTributes((prev) => [apiTributeToLocal(created), ...prev]);
    },
    [source, deceasedId, focusPersonId, mockCtx, loadMock],
  );

  const addPrayer = useCallback(
    async (authorId: string) => {
      if (!deceasedId || !authorId) return;

      if (source === 'mock') {
        mockCtx.addPrayer(deceasedId, authorId);
        loadMock();
        return;
      }

      if (focusPersonId == null) {
        throw new Error('Sesi tidak valid.');
      }

      const created = await addMemorialPrayer(
        Number(deceasedId),
        focusPersonId,
      );
      setPrayers((prev) => [...prev, apiPrayerToLocal(created)]);
      setHasPrayed(true);
    },
    [source, deceasedId, focusPersonId, mockCtx, loadMock],
  );

  const displayDeceased = source === 'mock' ? mockDeceased : deceased;
  const displayTributes =
    source === 'mock' && deceasedId
      ? mockCtx.getTributesFor(deceasedId)
      : tributes;
  const displayPrayers =
    source === 'mock' && deceasedId
      ? mockCtx.getPrayersFor(deceasedId)
      : prayers;
  const displayHasPrayed =
    source === 'mock' && deceasedId && person
      ? mockCtx.hasPrayed(deceasedId, String(person.id))
      : hasPrayed;

  return {
    source,
    deceased: displayDeceased,
    allPersons: source === 'mock' ? persons : allPersons,
    tributes: displayTributes,
    prayers: displayPrayers,
    hasPrayed: displayHasPrayed,
    isLoading,
    error,
    accessForbidden,
    reload: source === 'mock' ? loadMock : loadApi,
    addTribute,
    addPrayer,
  };
}
