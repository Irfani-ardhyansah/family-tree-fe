import { useEffect, useMemo, useRef, useState } from 'react';
import { useDataSource } from '@/context/DataSourceContext';
import { fetchPersonList } from '@/lib/personApi';
import type { PersonListScope } from '@/types/api';
import type { Gender, Person } from '@/types/person';
import { apiPersonToLocal } from '@/utils/personApiMapper';
import { useFocusPersonId } from '@/hooks/useFocusPersonId';

const RELATION_SEARCH_LIMIT = 20;

export type UsePersonRelationSearchOptions = {
  q: string;
  /** Same as person list: omit = BE branch/roots; `family` = admin full family. */
  scope?: PersonListScope;
  gender?: Gender;
  excludeIds?: string[];
  /** Mock dataset + label resolution for already-selected ids. */
  seedPersons: Person[];
  enabled?: boolean;
};

function filterLocal(
  persons: Person[],
  q: string,
  gender: Gender | undefined,
  excludeIds: Set<string>,
): Person[] {
  const needle = q.trim().toLowerCase();
  return persons.filter((p) => {
    if (excludeIds.has(p.id)) return false;
    if (gender && p.gender !== gender) return false;
    if (!needle) return true;
    return (
      p.fullName.toLowerCase().includes(needle) ||
      (p.nickname ?? '').toLowerCase().includes(needle)
    );
  });
}

/**
 * Debounced-ready person picker search for father/mother/spouse.
 * API mode uses GET /persons (branch by default); mock filters seedPersons.
 */
export function usePersonRelationSearch({
  q,
  scope,
  gender,
  excludeIds = [],
  seedPersons,
  enabled = true,
}: UsePersonRelationSearchOptions) {
  const { source } = useDataSource();
  const focusPersonId = useFocusPersonId();
  const excludeKey = excludeIds.join('\0');
  const excludeSet = useMemo(
    () => new Set(excludeKey ? excludeKey.split('\0') : []),
    [excludeKey],
  );

  const [apiOptions, setApiOptions] = useState<Person[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const cacheRef = useRef<Map<string, Person>>(new Map());
  const requestIdRef = useRef(0);

  // Keep selected / previously seen persons for label lookup.
  useEffect(() => {
    for (const p of seedPersons) {
      cacheRef.current.set(p.id, p);
    }
  }, [seedPersons]);

  useEffect(() => {
    for (const p of apiOptions) {
      cacheRef.current.set(p.id, p);
    }
  }, [apiOptions]);

  useEffect(() => {
    if (!enabled || source !== 'api') {
      setApiOptions([]);
      setIsLoading(false);
      return;
    }

    if (focusPersonId == null) return;

    const requestId = ++requestIdRef.current;
    setIsLoading(true);

    void fetchPersonList(1, RELATION_SEARCH_LIMIT, {
      scope,
      q: q.trim() || undefined,
    })
      .then((data) => {
        if (requestId !== requestIdRef.current) return;
        const mapped = data.persons.map(apiPersonToLocal);
        setApiOptions(mapped);
      })
      .catch(() => {
        if (requestId !== requestIdRef.current) return;
        setApiOptions([]);
      })
      .finally(() => {
        if (requestId !== requestIdRef.current) return;
        setIsLoading(false);
      });
  }, [enabled, source, focusPersonId, scope, q]);

  const options = useMemo(() => {
    const base =
      source === 'mock'
        ? filterLocal(seedPersons, q, gender, excludeSet)
        : filterLocal(apiOptions, '', gender, excludeSet);
    return base.slice(0, RELATION_SEARCH_LIMIT);
  }, [source, seedPersons, q, gender, excludeSet, apiOptions]);

  const resolvePerson = (id: string): Person | undefined =>
    cacheRef.current.get(id) ?? seedPersons.find((p) => p.id === id);

  return { options, isLoading, resolvePerson };
}
