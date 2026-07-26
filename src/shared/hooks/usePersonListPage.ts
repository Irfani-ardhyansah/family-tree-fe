import { useCallback, useEffect, useMemo, useState } from 'react';
import { useDataSource } from '@/shared/context/DataSourceContext';
import { useFamily } from '@/modules/family-roots/context/FamilyDataContext';
import { useFamilyPerspective } from '@/modules/family-roots/context/FamilyPerspectiveContext';
import { ApiClientError } from '@/shared/lib/apiClient';
import {
  createPerson,
  deletePersonById,
  fetchPersonList,
  fetchPersonTree,
  updatePerson as updatePersonApi,
} from '@/shared/lib/personApi';
import type { PaginationMeta, PersonListScope } from '@/shared/types/api';
import type { Person as LocalPerson } from '@/shared/types/person';
import {
  apiPersonToLocal,
  localFormToApiPayload,
} from '@/shared/utils/personApiMapper';

type UsePersonListPageOptions = {
  focusPersonId: number | null;
  page: number;
  limit: number;
  /**
   * List-only. Omit / undefined = BE default (branch, no query param).
   * Pass `family` only when admin opts into full-family list.
   */
  scope?: PersonListScope;
  /** Debounced search string from UI — sent as `q` to the list API. */
  q?: string;
};

function buildMockPagination(
  total: number,
  page: number,
  limit: number,
): PaginationMeta {
  const totalPages = Math.max(1, Math.ceil(total / limit));
  return {
    page,
    limit,
    total,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
  };
}

export function usePersonListPage({
  focusPersonId,
  page,
  limit,
  scope,
  q,
}: UsePersonListPageOptions) {
  const { source } = useDataSource();
  const { persons: mockAllPersons, addPerson, updatePerson: updateMockPerson, deletePerson } =
    useFamily();
  const { visiblePersons } = useFamilyPerspective();

  const [persons, setPersons] = useState<LocalPerson[]>([]);
  const [allPersons, setAllPersons] = useState<LocalPerson[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);
  const [rootPersonId, setRootPersonId] = useState<number | null>(null);
  const [listScope, setListScope] = useState<PersonListScope>(scope ?? 'branch');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const searchQuery = q?.trim() ?? '';

  const mockDataset = useMemo(() => {
    if (source !== 'mock') return [];
    const base = scope === 'family' ? mockAllPersons : visiblePersons;
    if (!searchQuery) return base;
    const needle = searchQuery.toLowerCase();
    return base.filter(
      (p) =>
        p.fullName.toLowerCase().includes(needle) ||
        (p.nickname ?? '').toLowerCase().includes(needle) ||
        (p.generationLabel ?? '').toLowerCase().includes(needle),
    );
  }, [source, scope, mockAllPersons, visiblePersons, searchQuery]);

  const loadMockList = useCallback(() => {
    const total = mockDataset.length;
    const start = (page - 1) * limit;
    setPersons(mockDataset.slice(start, start + limit));
    setAllPersons(mockAllPersons);
    setPagination(buildMockPagination(total, page, limit));
    setRootPersonId(null);
    setListScope(scope ?? 'branch');
    setError(null);
    setIsLoading(false);
  }, [mockDataset, mockAllPersons, page, limit, scope]);

  const loadTree = useCallback(async () => {
    if (source === 'mock' || focusPersonId == null) return;

    try {
      const data = await fetchPersonTree();
      setAllPersons(data.persons.map(apiPersonToLocal));
    } catch {
      // tree fetch is supplementary — list still works
    }
  }, [source, focusPersonId]);

  const loadList = useCallback(async () => {
    if (source === 'mock') {
      setIsLoading(true);
      loadMockList();
      return;
    }

    if (focusPersonId == null) return;

    setIsLoading(true);
    setError(null);

    try {
      const data = await fetchPersonList(page, limit, {
        scope,
        q: searchQuery || undefined,
      });
      setPersons(data.persons.map(apiPersonToLocal));
      setPagination(data.pagination);
      setRootPersonId(data.rootPersonId);
      setListScope(data.scope ?? scope ?? 'branch');
    } catch (err) {
      setError(
        err instanceof ApiClientError
          ? err.message
          : 'Gagal memuat data anggota keluarga.',
      );
    } finally {
      setIsLoading(false);
    }
  }, [source, focusPersonId, page, limit, scope, searchQuery, loadMockList]);

  useEffect(() => {
    void loadTree();
  }, [loadTree]);

  useEffect(() => {
    void loadList();
  }, [loadList]);

  const savePerson = useCallback(
    async (
      formData: Omit<LocalPerson, 'id'>,
      editingId?: string,
      mediaId?: string | null,
    ) => {
      if (source === 'mock') {
        if (editingId) {
          updateMockPerson({ ...formData, id: editingId });
        } else {
          addPerson(formData);
        }
        loadMockList();
        return;
      }

      if (focusPersonId == null) {
        throw new Error('Sesi tidak valid.');
      }

      const payload = localFormToApiPayload(formData, { mediaId });

      if (editingId) {
        await updatePersonApi(Number(editingId), payload);
      } else {
        await createPerson(payload);
      }

      await Promise.all([loadList(), loadTree()]);
    },
    [
      source,
      focusPersonId,
      addPerson,
      updateMockPerson,
      loadMockList,
      loadList,
      loadTree,
    ],
  );

  const removePerson = useCallback(
    async (id: string) => {
      if (source === 'mock') {
        deletePerson(id);
        loadMockList();
        return;
      }

      if (focusPersonId == null) {
        throw new Error('Sesi tidak valid.');
      }

      await deletePersonById(Number(id));
      await Promise.all([loadList(), loadTree()]);
    },
    [source, focusPersonId, deletePerson, loadMockList, loadList, loadTree],
  );

  const selfRole =
    allPersons.find((p) => p.isSelf)?.role ??
    persons.find((p) => p.isSelf)?.role;

  const reload = useCallback(async () => {
    if (source === 'mock') {
      loadMockList();
      return;
    }
    await Promise.all([loadList(), loadTree()]);
  }, [source, loadMockList, loadList, loadTree]);

  return {
    source,
    persons,
    allPersons,
    pagination,
    rootPersonId,
    scope: listScope,
    isLoading,
    error,
    selfRole,
    reload,
    savePerson,
    removePerson,
  };
}
