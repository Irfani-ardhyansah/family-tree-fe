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
import { slugifyDocumentTypeLabel } from '@/modules/family-core/lib/documentTypeMeta';
import { INITIAL_DOCUMENT_TYPES } from '@/modules/family-core/mocks/documentTypesMock';
import type {
  CoreDocumentType,
  CoreDocumentTypeDraft,
} from '@/modules/family-core/types';

type FamilyCoreDocumentTypesContextValue = {
  types: CoreDocumentType[];
  getTypeBySlug: (slug: string) => CoreDocumentType | undefined;
  getTypeById: (id: string) => CoreDocumentType | undefined;
  addType: (draft: Omit<CoreDocumentTypeDraft, 'slug' | 'sortOrder' | 'isSystem'> & {
    slug?: string;
  }) => CoreDocumentType;
  updateType: (
    id: string,
    draft: Partial<CoreDocumentTypeDraft>,
  ) => CoreDocumentType | null;
  deleteType: (id: string) => { ok: true } | { ok: false; message: string };
};

const FamilyCoreDocumentTypesContext =
  createContext<FamilyCoreDocumentTypesContextValue | null>(null);

export function FamilyCoreDocumentTypesProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [types, setTypes] = useState<CoreDocumentType[]>(INITIAL_DOCUMENT_TYPES);

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
      draft: Omit<CoreDocumentTypeDraft, 'slug' | 'sortOrder' | 'isSystem'> & {
        slug?: string;
      },
    ) => {
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
    [types],
  );

  const updateType = useCallback(
    (id: string, draft: Partial<CoreDocumentTypeDraft>) => {
      let updated: CoreDocumentType | null = null;
      setTypes((prev) =>
        prev.map((row) => {
          if (row.id !== id) return row;
          updated = {
            ...row,
            ...draft,
            id: row.id,
            // Keep system slug stable
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

  const deleteType = useCallback((id: string) => {
    const target = types.find((t) => t.id === id);
    if (!target) return { ok: false as const, message: 'Jenis tidak ditemukan.' };
    if (target.isSystem) {
      return {
        ok: false as const,
        message: 'Jenis bawaan (seeder) tidak bisa dihapus. Nonaktifkan lewat BE nanti.',
      };
    }
    setTypes((prev) => prev.filter((t) => t.id !== id));
    return { ok: true as const };
  }, [types]);

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
