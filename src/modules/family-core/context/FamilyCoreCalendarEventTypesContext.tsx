/* Context + hook are intentionally co-located. */
/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { slugifyCalendarTypeLabel } from '@/modules/family-core/lib/calendarEventMeta';
import { INITIAL_CALENDAR_EVENT_TYPES } from '@/modules/family-core/mocks/calendarEventTypesMock';
import type {
  CoreCalendarEventType,
  CoreCalendarEventTypeDraft,
} from '@/modules/family-core/types';

type FamilyCoreCalendarEventTypesContextValue = {
  types: CoreCalendarEventType[];
  getTypeBySlug: (slug: string) => CoreCalendarEventType | undefined;
  getTypeById: (id: string) => CoreCalendarEventType | undefined;
  addType: (
    draft: Omit<CoreCalendarEventTypeDraft, 'slug' | 'sortOrder' | 'isSystem'> & {
      slug?: string;
    },
  ) => CoreCalendarEventType;
  updateType: (
    id: string,
    draft: Partial<CoreCalendarEventTypeDraft>,
  ) => CoreCalendarEventType | null;
  deleteType: (id: string) => { ok: true } | { ok: false; message: string };
};

const FamilyCoreCalendarEventTypesContext =
  createContext<FamilyCoreCalendarEventTypesContextValue | null>(null);

export function FamilyCoreCalendarEventTypesProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [types, setTypes] = useState<CoreCalendarEventType[]>(
    INITIAL_CALENDAR_EVENT_TYPES,
  );

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
    (
      draft: Omit<
        CoreCalendarEventTypeDraft,
        'slug' | 'sortOrder' | 'isSystem'
      > & { slug?: string },
    ) => {
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
    [types],
  );

  const updateType = useCallback(
    (id: string, draft: Partial<CoreCalendarEventTypeDraft>) => {
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
    [],
  );

  const deleteType = useCallback(
    (id: string) => {
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
      setTypes((prev) => prev.filter((t) => t.id !== id));
      return { ok: true as const };
    },
    [types],
  );

  const value = useMemo(
    () => ({
      types: sorted,
      getTypeBySlug,
      getTypeById,
      addType,
      updateType,
      deleteType,
    }),
    [sorted, getTypeBySlug, getTypeById, addType, updateType, deleteType],
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
