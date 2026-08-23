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
  createFcCalendarEventType,
  deleteFcCalendarEventType,
  getFcApiErrorMessage,
  listFcCalendarEventTypes,
  updateFcCalendarEventType,
} from '@/modules/family-core/api/familyCoreApi';
import { slugifyCalendarTypeLabel } from '@/modules/family-core/lib/calendarEventMeta';
import { INITIAL_CALENDAR_EVENT_TYPES } from '@/modules/family-core/mocks/calendarEventTypesMock';
import type {
  CoreCalendarEventType,
  CoreCalendarEventTypeDraft,
} from '@/modules/family-core/types';
import { useDataSource } from '@/shared/context/DataSourceContext';

type FamilyCoreCalendarEventTypesContextValue = {
  types: CoreCalendarEventType[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  getTypeBySlug: (slug: string) => CoreCalendarEventType | undefined;
  getTypeById: (id: string) => CoreCalendarEventType | undefined;
  addType: (
    draft: Omit<CoreCalendarEventTypeDraft, 'slug' | 'sortOrder' | 'isSystem'> & {
      slug?: string;
    },
  ) => Promise<CoreCalendarEventType>;
  updateType: (
    id: string,
    draft: Partial<CoreCalendarEventTypeDraft>,
  ) => Promise<CoreCalendarEventType | null>;
  deleteType: (
    id: string,
  ) => Promise<{ ok: true } | { ok: false; message: string }>;
};

const FamilyCoreCalendarEventTypesContext =
  createContext<FamilyCoreCalendarEventTypesContextValue | null>(null);

export function FamilyCoreCalendarEventTypesProvider({
  children,
}: {
  children: ReactNode;
}) {
  const { isApi, isMock } = useDataSource();
  const [types, setTypes] = useState<CoreCalendarEventType[]>(
    INITIAL_CALENDAR_EVENT_TYPES,
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!isApi) {
      setTypes(INITIAL_CALENDAR_EVENT_TYPES);
      setError(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const rows = await listFcCalendarEventTypes();
      setTypes(rows);
      setError(null);
    } catch (err) {
      setError(
        getFcApiErrorMessage(err, 'Gagal memuat tipe kalender dari API.'),
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
      setTypes(INITIAL_CALENDAR_EVENT_TYPES);
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
      draft: Omit<CoreCalendarEventTypeDraft, 'slug' | 'sortOrder' | 'isSystem'> & {
        slug?: string;
      },
    ) => {
      if (isApi) {
        const created = await createFcCalendarEventType({
          label: draft.label.trim(),
          iconKey: draft.iconKey,
          toneKey: draft.toneKey,
          linksToHealth: draft.linksToHealth,
        });
        setTypes((prev) => [...prev, created]);
        return created;
      }

      const baseSlug =
        draft.slug?.trim() || slugifyCalendarTypeLabel(draft.label);
      let slug = baseSlug;
      let n = 2;
      while (types.some((t) => t.slug === slug)) {
        slug = `${baseSlug}_${n}`;
        n += 1;
      }
      const maxOrder = types.reduce((m, t) => Math.max(m, t.sortOrder), 0);
      const created: CoreCalendarEventType = {
        id: `ct-${crypto.randomUUID().slice(0, 8)}`,
        slug,
        label: draft.label.trim(),
        iconKey: draft.iconKey,
        toneKey: draft.toneKey,
        linksToHealth: draft.linksToHealth,
        isSystem: false,
        sortOrder: maxOrder + 10,
      };
      setTypes((prev) => [...prev, created]);
      return created;
    },
    [isApi, types],
  );

  const updateType = useCallback(
    async (id: string, draft: Partial<CoreCalendarEventTypeDraft>) => {
      if (isApi) {
        const updated = await updateFcCalendarEventType(id, {
          label: draft.label,
          iconKey: draft.iconKey,
          toneKey: draft.toneKey,
          linksToHealth: draft.linksToHealth,
        });
        setTypes((prev) => prev.map((row) => (row.id === id ? updated : row)));
        return updated;
      }

      let updated: CoreCalendarEventType | null = null;
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
        return { ok: false as const, message: 'Tipe tidak ditemukan.' };
      }
      if (target.isSystem) {
        return {
          ok: false as const,
          message:
            'Tipe bawaan (seeder) tidak bisa dihapus. Nonaktifkan lewat BE nanti.',
        };
      }

      if (isApi) {
        try {
          await deleteFcCalendarEventType(id);
          setTypes((prev) => prev.filter((t) => t.id !== id));
          return { ok: true as const };
        } catch (err) {
          return {
            ok: false as const,
            message: getFcApiErrorMessage(err, 'Gagal menghapus tipe kalender.'),
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
    <FamilyCoreCalendarEventTypesContext.Provider value={value}>
      {children}
    </FamilyCoreCalendarEventTypesContext.Provider>
  );
}

export function useFamilyCoreCalendarEventTypes() {
  const ctx = useContext(FamilyCoreCalendarEventTypesContext);
  if (!ctx) {
    throw new Error(
      'useFamilyCoreCalendarEventTypes must be used within FamilyCoreCalendarEventTypesProvider',
    );
  }
  return ctx;
}
