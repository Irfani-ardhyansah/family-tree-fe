import { useCallback, useEffect, useMemo, useState } from 'react';
import { useDataSource } from '@/context/DataSourceContext';
import { useFamily } from '@/context/FamilyDataContext';
import { useFamilyPerspective } from '@/context/FamilyPerspectiveContext';
import { useMemoriam as useMockMemoriam } from '@/context/MemoriamContext';
import { ApiClientError } from '@/lib/apiClient';
import {
  fetchMemoriamDeceased,
  type MemoriamListQuery,
} from '@/lib/memoriamApi';
import type { Person as LocalPerson } from '@/types/person';
import { canAccessMemorial } from '@/utils/memoriamAccess';
import { memoriamDeceasedToLocal } from '@/utils/featureApiMapper';

function getDeathYear(deathDate?: string): number | null {
  if (!deathDate) return null;
  const year = new Date(deathDate).getFullYear();
  return Number.isNaN(year) ? null : year;
}

export function useMemoriamList(
  focusPersonId: number | null,
  search: string,
  yearFilter: string,
) {
  const { source } = useDataSource();
  const { persons } = useFamily();
  const { me } = useFamilyPerspective();
  const { getTributesFor, getPrayersFor } = useMockMemoriam();

  const [deceased, setDeceased] = useState<LocalPerson[]>([]);
  const [deceasedAll, setDeceasedAll] = useState<LocalPerson[]>([]);
  const [counts, setCounts] = useState<
    Map<string, { tributes: number; prayers: number }>
  >(new Map());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const apiQuery = useMemo<MemoriamListQuery>(
    () => ({
      q: search.trim() || undefined,
      deathYear: yearFilter || undefined,
    }),
    [search, yearFilter],
  );

  const queryKey = useMemo(() => JSON.stringify(apiQuery), [apiQuery]);

  const mockDeceasedAll = useMemo(() => {
    return persons
      .filter((p) => p.status === 'deceased')
      .filter((p) => canAccessMemorial(me?.id, p.id, persons))
      .sort((a, b) => {
        const da = a.deathDate ? new Date(a.deathDate).getTime() : 0;
        const db = b.deathDate ? new Date(b.deathDate).getTime() : 0;
        return db - da;
      });
  }, [persons, me?.id]);

  const mockDeceased = useMemo(() => {
    const q = search.toLowerCase().trim();
    return persons
      .filter((p) => p.status === 'deceased')
      .filter((p) => canAccessMemorial(me?.id, p.id, persons))
      .filter((p) => {
        if (yearFilter) {
          const y = getDeathYear(p.deathDate);
          if (y?.toString() !== yearFilter) return false;
        }
        if (!q) return true;
        return (
          p.fullName.toLowerCase().includes(q) ||
          (p.nickname?.toLowerCase().includes(q) ?? false) ||
          (p.generationLabel?.toLowerCase().includes(q) ?? false)
        );
      })
      .sort((a, b) => {
        const da = a.deathDate ? new Date(a.deathDate).getTime() : 0;
        const db = b.deathDate ? new Date(b.deathDate).getTime() : 0;
        return db - da;
      });
  }, [persons, me?.id, search, yearFilter]);

  const loadMock = useCallback(() => {
    setDeceased(mockDeceased);
    setDeceasedAll(mockDeceasedAll);
    setError(null);
    setIsLoading(false);
  }, [mockDeceased, mockDeceasedAll]);

  const loadApi = useCallback(async () => {
    if (focusPersonId == null) return;

    setIsLoading(true);
    setError(null);

    try {
      const [data, allData] = await Promise.all([
        fetchMemoriamDeceased(focusPersonId, apiQuery),
        apiQuery.q || apiQuery.deathYear
          ? fetchMemoriamDeceased(focusPersonId, {})
          : Promise.resolve(null),
      ]);

      const nextCounts = new Map<string, { tributes: number; prayers: number }>();

      const items = data.deceased.map((item) => {
        nextCounts.set(String(item.id), {
          tributes: item.tributeCount,
          prayers: item.prayerCount,
        });
        return memoriamDeceasedToLocal(item);
      });

      setDeceased(items);
      setCounts(nextCounts);

      if (allData) {
        setDeceasedAll(allData.deceased.map(memoriamDeceasedToLocal));
      } else {
        setDeceasedAll(items);
      }
    } catch (err) {
      setError(
        err instanceof ApiClientError
          ? err.message
          : 'Gagal memuat daftar almarhum.',
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

  const getCounts = useCallback(
    (deceasedId: string) => {
      if (source === 'api') {
        return counts.get(deceasedId) ?? { tributes: 0, prayers: 0 };
      }
      return {
        tributes: getTributesFor(deceasedId).length,
        prayers: getPrayersFor(deceasedId).length,
      };
    },
    [source, counts, getTributesFor, getPrayersFor],
  );

  return {
    source,
    deceased,
    deceasedAll: source === 'mock' ? mockDeceasedAll : deceasedAll,
    isLoading,
    error,
    getCounts,
    reload: source === 'mock' ? loadMock : loadApi,
  };
}
