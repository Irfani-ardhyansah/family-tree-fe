import { useCallback, useEffect, useMemo, useState } from 'react';
import { useDataSource } from '@/shared/context/DataSourceContext';
import { useFamily } from '@/modules/family-roots/context/FamilyDataContext';
import { useFamilyPerspective } from '@/modules/family-roots/context/FamilyPerspectiveContext';
import { ApiClientError } from '@/shared/lib/apiClient';
import { fetchPersonMap, patchPersonAddress, type MapQueryParams } from '@/shared/lib/mapApi';
import { fetchPersonTree } from '@/shared/lib/personApi';
import type { MapMeta } from '@/shared/types/api';
import type { Person as LocalPerson, TreeLineage } from '@/shared/types/person';
import { getPersonsForPerspectiveLineage } from '@/shared/utils/familyPerspective';
import { apiPersonToLocal } from '@/shared/utils/personApiMapper';
import type { PersonAddress } from '@/shared/types/api';

type UseFamilyMapPageOptions = {
  focusPersonId: number | null;
  lineage: TreeLineage;
  status: 'alive' | 'deceased' | 'all';
  city: string;
  province: string;
  search: string;
};

export function useFamilyMapPage({
  focusPersonId,
  lineage,
  status,
  city,
  province,
  search,
}: UseFamilyMapPageOptions) {
  const { source } = useDataSource();
  const { persons: mockAllPersons, rootPersonId, updatePerson } = useFamily();
  const { perspective } = useFamilyPerspective();

  const [persons, setPersons] = useState<LocalPerson[]>([]);
  const [allPersons, setAllPersons] = useState<LocalPerson[]>([]);
  const [meta, setMeta] = useState<MapMeta | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mockPersons = useMemo(
    () =>
      getPersonsForPerspectiveLineage(
        { persons: mockAllPersons, rootPersonId },
        perspective,
        lineage,
      ),
    [mockAllPersons, rootPersonId, perspective, lineage],
  );

  const mockFiltered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return mockPersons.filter((p) => {
      if (status === 'alive' && p.status !== 'alive') return false;
      if (status === 'deceased' && p.status !== 'deceased') return false;
      if (city && p.address?.city !== city) return false;
      if (province && p.address?.province !== province) return false;
      if (
        q &&
        !p.fullName.toLowerCase().includes(q) &&
        !(p.nickname ?? '').toLowerCase().includes(q) &&
        !(p.address?.city ?? '').toLowerCase().includes(q) &&
        !(p.address?.province ?? '').toLowerCase().includes(q)
      ) {
        return false;
      }
      return true;
    });
  }, [mockPersons, status, city, province, search]);

  const loadMock = useCallback(() => {
    setPersons(mockFiltered);
    setAllPersons(mockAllPersons);
    setMeta(null);
    setError(null);
    setIsLoading(false);
  }, [mockFiltered, mockAllPersons]);

  const loadApi = useCallback(async () => {
    if (focusPersonId == null) return;

    setIsLoading(true);
    setError(null);

    const params: MapQueryParams = {
      lineage,
      status,
      city: city || undefined,
      province: province || undefined,
      q: search.trim() || undefined,
    };

    try {
      const [mapData, treeData] = await Promise.all([
        fetchPersonMap(params),
        fetchPersonTree().catch(() => null),
      ]);

      setPersons(mapData.persons.map(apiPersonToLocal));
      setMeta(mapData.meta);
      setAllPersons(
        treeData
          ? treeData.persons.map(apiPersonToLocal)
          : mapData.persons.map(apiPersonToLocal),
      );
    } catch (err) {
      setError(
        err instanceof ApiClientError
          ? err.message
          : 'Gagal memuat peta keluarga.',
      );
    } finally {
      setIsLoading(false);
    }
  }, [focusPersonId, lineage, status, city, province, search]);

  useEffect(() => {
    if (source === 'mock') {
      setIsLoading(true);
      loadMock();
      return;
    }
    void loadApi();
  }, [source, loadMock, loadApi]);

  const saveAddress = useCallback(
    async (person: LocalPerson, address: LocalPerson['address']) => {
      if (source === 'mock') {
        updatePerson({ ...person, address });
        loadMock();
        return;
      }

      if (focusPersonId == null) {
        throw new Error('Sesi tidak valid.');
      }

      const apiAddress: PersonAddress = {
        street: address?.street ?? null,
        district: address?.district ?? null,
        city: address?.city ?? null,
        province: address?.province ?? null,
        postalCode: address?.postalCode ?? null,
        country: address?.country ?? 'Indonesia',
        latitude: address?.latitude ?? null,
        longitude: address?.longitude ?? null,
      };

      await patchPersonAddress(Number(person.id), apiAddress);
      await loadApi();
    },
    [source, focusPersonId, updatePerson, loadMock, loadApi],
  );

  return {
    source,
    persons,
    allPersons,
    meta,
    isLoading,
    error,
    reload: source === 'mock' ? loadMock : loadApi,
    saveAddress,
  };
}
