import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useDataSource } from '@/shared/context/DataSourceContext';
import { useFamily } from '@/modules/family-roots/context/FamilyDataContext';
import { ApiClientError } from '@/shared/lib/apiClient';
import { fetchPersonTree, type PersonTreeResult } from '@/shared/lib/personApi';
import type { GraphWarning, TreeMeta } from '@/shared/types/api';
import type { FamilyData, TreeViewConfig } from '@/shared/types/person';
import { apiPersonToLocal } from '@/shared/utils/personApiMapper';
import { viewConfigToTreeFilter } from '@/shared/utils/treeFilterParams';

const SERVER_FILTER_FAMILY_THRESHOLD = 200;

function shouldRecommendServerFilter(meta: TreeMeta | undefined, personCount: number): boolean {
  if (meta?.recommendClientFilter != null) {
    return meta.recommendClientFilter;
  }
  return (meta?.totalFamilyCount ?? personCount) >= SERVER_FILTER_FAMILY_THRESHOLD;
}

export function useFamilyTree(
  focusPersonId: number | null,
  viewConfig: Omit<TreeViewConfig, 'perspective'>,
) {
  const { source } = useDataSource();
  const { persons: mockPersons, rootPersonId: mockRootPersonId } = useFamily();
  const filterParams = useMemo(
    () => viewConfigToTreeFilter(viewConfig),
    [viewConfig],
  );
  const filterKey = useMemo(() => JSON.stringify(filterParams), [filterParams]);

  const [apiPersons, setApiPersons] = useState<FamilyData['persons']>([]);
  const [apiRootPersonId, setApiRootPersonId] = useState<string>(mockRootPersonId);
  const [meta, setMeta] = useState<TreeMeta | null>(null);
  const [graphWarnings, setGraphWarnings] = useState<GraphWarning[]>([]);
  const [useServerFilter, setUseServerFilter] = useState(false);
  const [serverFilterApplied, setServerFilterApplied] = useState(false);
  const [isProbed, setIsProbed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const probeTokenRef = useRef(0);

  const applyTreeResponse = useCallback((data: PersonTreeResult) => {
    setApiPersons(data.persons.map(apiPersonToLocal));
    setApiRootPersonId(
      data.rootPersonId != null
        ? String(data.rootPersonId)
        : String(data.focusPersonId),
    );
    setMeta(data.meta ?? null);
    setGraphWarnings(data.graphWarnings ?? []);
    setServerFilterApplied(data.filter?.applied ?? false);
  }, []);

  useEffect(() => {
    setIsProbed(false);
    setUseServerFilter(false);
    setServerFilterApplied(false);
    probeTokenRef.current += 1;
  }, [focusPersonId, source]);

  const probeAndLoad = useCallback(async () => {
    if (source === 'mock' || focusPersonId == null) return;

    const token = probeTokenRef.current;
    setIsLoading(true);
    setError(null);

    try {
      const probe = await fetchPersonTree();
      if (token !== probeTokenRef.current) return;

      const recommendServer = shouldRecommendServerFilter(
        probe.meta,
        probe.persons.length,
      );
      setIsProbed(true);
      setUseServerFilter(recommendServer);

      if (recommendServer) {
        const filtered = await fetchPersonTree(filterParams);
        if (token !== probeTokenRef.current) return;
        applyTreeResponse(filtered);
      } else {
        applyTreeResponse(probe);
      }
    } catch (err) {
      if (token !== probeTokenRef.current) return;
      setError(
        err instanceof ApiClientError
          ? err.message
          : 'Gagal memuat pohon keluarga.',
      );
    } finally {
      if (token === probeTokenRef.current) {
        setIsLoading(false);
      }
    }
  }, [source, focusPersonId, filterParams, applyTreeResponse]);

  useEffect(() => {
    if (source === 'mock' || focusPersonId == null) return;
    if (isProbed) return;
    void probeAndLoad();
  }, [source, focusPersonId, isProbed, probeAndLoad]);

  useEffect(() => {
    if (
      source === 'mock' ||
      focusPersonId == null ||
      !isProbed ||
      !useServerFilter
    ) {
      return;
    }

    const token = probeTokenRef.current;
    setIsLoading(true);
    setError(null);

    void (async () => {
      try {
        const data = await fetchPersonTree(filterParams);
        if (token !== probeTokenRef.current) return;
        applyTreeResponse(data);
      } catch (err) {
        if (token !== probeTokenRef.current) return;
        setError(
          err instanceof ApiClientError
            ? err.message
            : 'Gagal memuat pohon keluarga.',
        );
      } finally {
        if (token === probeTokenRef.current) {
          setIsLoading(false);
        }
      }
    })();
  }, [
    source,
    focusPersonId,
    isProbed,
    useServerFilter,
    filterKey,
    filterParams,
    applyTreeResponse,
  ]);

  const familyData = useMemo((): FamilyData => {
    if (source === 'mock') {
      return { persons: mockPersons, rootPersonId: mockRootPersonId };
    }

    return {
      persons: apiPersons,
      rootPersonId: apiRootPersonId,
    };
  }, [source, mockPersons, mockRootPersonId, apiPersons, apiRootPersonId]);

  const reload = useCallback(async () => {
    if (source === 'mock' || focusPersonId == null) return;

    probeTokenRef.current += 1;
    setIsProbed(false);
    setUseServerFilter(false);
    setServerFilterApplied(false);
  }, [source, focusPersonId]);

  return {
    source,
    familyData,
    meta,
    graphWarnings,
    useServerFilter,
    serverFilterApplied,
    isLoading: source === 'api' && isLoading,
    error: source === 'api' ? error : null,
    reload,
  };
}
