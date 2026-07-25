import { useCallback, useEffect, useMemo, useState } from 'react';
import { useDataSource } from '@/context/DataSourceContext';
import { useFamily } from '@/context/FamilyDataContext';
import { useFamilyPerspective } from '@/context/FamilyPerspectiveContext';
import { useMemoriam as useMockMemoriam } from '@/context/MemoriamContext';
import { ApiClientError } from '@/lib/apiClient';
import { fetchDashboard } from '@/lib/dashboardApi';
import { useEventsPage } from '@/hooks/useEventsPage';
import type { FamilyEvent } from '@/types/event';
import type { Person as LocalPerson } from '@/types/person';
import { canAccessMemorial } from '@/utils/memoriamAccess';
import {
  apiEventToLocal,
  memoriamDeceasedToLocal,
} from '@/utils/featureApiMapper';
import { getRichTextPlainText } from '@/utils/richText';

function isUpcoming(dateStr: string): boolean {
  return new Date(dateStr) >= new Date(new Date().toDateString());
}

function countGenerations(
  personIds: string[],
  persons: { id: string; fatherId?: string; motherId?: string }[],
): number {
  const map = new Map(persons.map((p) => [p.id, p]));
  const depths = new Set<number>();

  function getDepth(id: string): number {
    const person = map.get(id);
    if (!person?.fatherId && !person?.motherId) return 0;
    const fatherDepth = person.fatherId ? getDepth(person.fatherId) : -1;
    const motherDepth = person.motherId ? getDepth(person.motherId) : -1;
    return Math.max(fatherDepth, motherDepth) + 1;
  }

  for (const id of personIds) {
    depths.add(getDepth(id));
  }
  return depths.size || 1;
}

export type DashboardMemoriamCard =
  | {
      kind: 'deceased';
      deceased: LocalPerson;
      tributeCount: number;
    }
  | {
      kind: 'tribute';
      id: string;
      deceasedId: string;
      authorId: string;
      content: string;
      createdAt: string;
    };

export type DashboardStatsView = {
  members: number;
  generations: number;
  photos: number;
  upcoming: number;
};

export function useDashboard(focusPersonId: number | null) {
  const { source } = useDataSource();
  const { visiblePersons, me } = useFamilyPerspective();
  const { persons: allPersons } = useFamily();
  const { tributes } = useMockMemoriam();
  const { events: perspectiveEvents } = useEventsPage(
    source === 'mock' ? focusPersonId : null,
  );

  const [stats, setStats] = useState<DashboardStatsView>({
    members: 0,
    generations: 0,
    photos: 0,
    upcoming: 0,
  });
  const [recentEvents, setRecentEvents] = useState<FamilyEvent[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<FamilyEvent[]>([]);
  const [recentTributes, setRecentTributes] = useState<DashboardMemoriamCard[]>(
    [],
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const personMap = useMemo(
    () => new Map(allPersons.map((p) => [p.id, p])),
    [allPersons],
  );

  const loadMock = useCallback(() => {
    const upcoming = perspectiveEvents
      .filter((e) => isUpcoming(e.date))
      .sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
      );

    const recent = [...perspectiveEvents]
      .sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
      )
      .slice(0, 5);

    const photoCount =
      visiblePersons.filter((p) => p.photoUrl).length +
      perspectiveEvents.reduce((sum, e) => sum + e.photoUrls.length, 0);

    const tributeCards: DashboardMemoriamCard[] = [...tributes]
      .filter((t) => {
        const deceased = personMap.get(t.deceasedId);
        return (
          deceased?.status === 'deceased' &&
          canAccessMemorial(me?.id, t.deceasedId, allPersons)
        );
      })
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      )
      .slice(0, 4)
      .map((t) => ({
        kind: 'tribute' as const,
        id: t.id,
        deceasedId: t.deceasedId,
        authorId: t.authorId,
        content: getRichTextPlainText(t.content),
        createdAt: t.createdAt,
      }));

    setStats({
      members: visiblePersons.length,
      generations: countGenerations(
        visiblePersons.map((p) => p.id),
        visiblePersons,
      ),
      photos: photoCount,
      upcoming: upcoming.length,
    });
    setRecentEvents(recent);
    setUpcomingEvents(upcoming);
    setRecentTributes(tributeCards);
    setError(null);
    setIsLoading(false);
  }, [
    perspectiveEvents,
    visiblePersons,
    tributes,
    personMap,
    me?.id,
    allPersons,
  ]);

  const loadApi = useCallback(async () => {
    if (focusPersonId == null) return;

    setIsLoading(true);
    setError(null);

    try {
      const data = await fetchDashboard();

      setStats({
        members: data.stats.memberCount,
        generations: data.stats.generationCount,
        photos: data.stats.photoCount,
        upcoming: data.stats.upcomingEventCount,
      });
      setRecentEvents(data.recentEvents.map(apiEventToLocal));
      setUpcomingEvents(data.upcomingEvents.map(apiEventToLocal));
      setRecentTributes(
        data.recentMemoriam.map((item) => ({
          kind: 'deceased' as const,
          deceased: memoriamDeceasedToLocal(item),
          tributeCount: item.tributeCount,
        })),
      );
    } catch (err) {
      setError(
        err instanceof ApiClientError
          ? err.message
          : 'Gagal memuat dashboard.',
      );
    } finally {
      setIsLoading(false);
    }
  }, [focusPersonId]);

  useEffect(() => {
    if (source === 'mock') {
      setIsLoading(true);
      loadMock();
      return;
    }
    void loadApi();
  }, [source, loadMock, loadApi]);

  return {
    stats,
    recentEvents,
    upcomingEvents,
    recentTributes,
    personMap,
    isLoading,
    error,
    reload: source === 'mock' ? loadMock : loadApi,
  };
}
