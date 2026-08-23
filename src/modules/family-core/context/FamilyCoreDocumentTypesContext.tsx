/* Context + hook are intentionally co-located. */
/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  createFcDocumentType,
  deleteFcDocumentType,
  getFcApiErrorMessage,
  listFcDocumentTypes,
  updateFcDocumentType,
} from '@/modules/family-core/api/familyCoreApi';
import { slugifyDocumentTypeLabel } from '@/modules/family-core/lib/documentTypeMeta';
import { INITIAL_DOCUMENT_TYPES } from '@/modules/family-core/mocks/documentTypesMock';
import type {
  CoreDocumentType,
  CoreDocumentTypeDraft,
} from '@/modules/family-core/types';
import { useDataSource } from '@/shared/context/DataSourceContext';

type FamilyCoreDocumentTypesContextValue = {
  types: CoreDocumentType[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  getTypeBySlug: (slug: string) => CoreDocumentType | undefined;
  getTypeById: (id: string) => CoreDocumentType | undefined;
  addType: (
    draft: Omit<CoreDocumentTypeDraft, 'slug' | 'sortOrder' | 'isSystem'> & {
      slug?: string;
    },
  ) => Promise<CoreDocumentType>;
  updateType: (
    id: string,
    draft: Partial<CoreDocumentTypeDraft>,
  ) => Promise<CoreDocumentType | null>;
  deleteType: (
    id: string,
  ) => Promise<{ ok: true } | { ok: false; message: string }>;
};

const FamilyCoreDocumentTypesContext =
  createContext<FamilyCoreDocumentTypesContextValue | null>(null);

export function FamilyCoreDocumentTypesProvider({
  children,
}: {
  children: ReactNode;
}) {
  const { isApi, isMock } = useDataSource();
  const [types, setTypes] = useState<CoreDocumentType[]>(INITIAL_DOCUMENT_TYPES);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!isApi) {
      setTypes(INITIAL_DOCUMENT_TYPES);
      setError(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const rows = await listFcDocumentTypes();
      setTypes(rows);
      setError(null);
    } catch (err) {
      setError(
        getFcApiErrorMessage(err, 'Gagal memuat jenis dokumen dari API.'),
      );
    } finally {
      setLoading(false);
    }
  }, [isApi]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    if (isMock) {
      setTypes(INITIAL_DOCUMENT_TYPES);
      setError(null);
    }
  }, [isMock]);

  const sorted = useMemo(
    () => [...types].sort((a, b) => a.sortOrder - b.sortOrder),
    [types],
  );

  const getTypeBySlug = useCallback(
    (slug: string) => types.find((t) => t.slug === slug),
    [types],
  );

  const getTypeById = useCallback(
    (id: string) => types.find((t) => t.id === id),
    [types],
  );

  const addType = useCallback(
    async (
      draft: Omit<CoreDocumentTypeDraft, 'slug' | 'sortOrder' | 'isSystem'> & {
        slug?: string;
      },
    ) => {
      if (isApi) {
        const created = await createFcDocumentType({
          label: draft.label.trim(),
          iconKey: draft.iconKey,
          toneKey: draft.toneKey,
          extras: draft.extras,
          defaultLifetime: draft.defaultLifetime,
          allowCustomTitle: draft.allowCustomTitle,
        });
        setTypes((prev) => [...prev, created]);
        return created;
      }

      const baseSlug =
        draft.slug?.trim() || slugifyDocumentTypeLabel(draft.label);
      let slug = baseSlug;
      let n = 2;
      while (types.some((t) => t.slug === slug)) {
        slug = `${baseSlug}_${n}`;
        n += 1;
      }
      const maxOrder = types.reduce((m, t) => Math.max(m, t.sortOrder), 0);
      const created: CoreDocumentType = {
        id: `dt-${crypto.randomUUID().slice(0, 8)}`,
        slug,
        label: draft.label.trim(),
        iconKey: draft.iconKey,
        toneKey: draft.toneKey,
        extras: draft.extras,
        defaultLifetime: draft.defaultLifetime,
        allowCustomTitle: draft.allowCustomTitle,
        isSystem: false,
        sortOrder: maxOrder + 10,
      };
      setTypes((prev) => [...prev, created]);
      return created;
    },
    [isApi, types],
  );

  const updateType = useCallback(
    async (id: string, draft: Partial<CoreDocumentTypeDraft>) => {
      if (isApi) {
        const updated = await updateFcDocumentType(id, {
          label: draft.label,
          iconKey: draft.iconKey,
          toneKey: draft.toneKey,
          extras: draft.extras,
          defaultLifetime: draft.defaultLifetime,
          allowCustomTitle: draft.allowCustomTitle,
        });
        setTypes((prev) => prev.map((row) => (row.id === id ? updated : row)));
        return updated;
      }

      let updated: CoreDocumentType | null = null;
      setTypes((prev) =>
        prev.map((row) => {
          if (row.id !== id) return row;
          updated = {
            ...row,
            ...draft,
            id: row.id,
            slug: row.isSystem ? row.slug : (draft.slug ?? row.slug),
            isSystem: row.isSystem,
          };
          return updated;
        }),
      );
      return updated;
    },
    [isApi],
  );

  const deleteType = useCallback(
    async (id: string) => {
      const target = types.find((t) => t.id === id);
      if (!target) {
        return { ok: false as const, message: 'Jenis tidak ditemukan.' };
      }
      if (target.isSystem) {
        return {
          ok: false as const,
          message:
            'Jenis bawaan (seeder) tidak bisa dihapus. Nonaktifkan lewat BE nanti.',
        };
      }

      if (isApi) {
        try {
          await deleteFcDocumentType(id);
          setTypes((prev) => prev.filter((t) => t.id !== id));
          return { ok: true as const };
        } catch (err) {
          return {
            ok: false as const,
            message: getFcApiErrorMessage(err, 'Gagal menghapus jenis dokumen.'),
          };
        }
      }

      setTypes((prev) => prev.filter((t) => t.id !== id));
      return { ok: true as const };
    },
    [isApi, types],
  );

  const value = useMemo(
    () => ({
      types: sorted,
      loading,
      error,
      refresh,
      getTypeBySlug,
      getTypeById,
      addType,
      updateType,
      deleteType,
    }),
    [
      sorted,
      loading,
      error,
      refresh,
      getTypeBySlug,
      getTypeById,
      addType,
      updateType,
      deleteType,
    ],
  );

  return (
    <FamilyCoreDocumentTypesContext.Provider value={value}>
      {children}
    </FamilyCoreDocumentTypesContext.Provider>
  );
}

export function useFamilyCoreDocumentTypes() {
  const ctx = useContext(FamilyCoreDocumentTypesContext);
  if (!ctx) {
    throw new Error(
      'useFamilyCoreDocumentTypes must be used within FamilyCoreDocumentTypesProvider',
    );
  }
  return ctx;
}
