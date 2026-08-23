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
  createFcDocument,
  deleteFcDocument,
  getFcApiErrorMessage,
  getFcDocument,
  listFcDocuments,
  listFcMembers,
  updateFcDocument,
} from '@/modules/family-core/api/familyCoreApi';
import { getCoreMembers } from '@/modules/family-core/mocks/coreMembers';
import { INITIAL_DOCUMENTS } from '@/modules/family-core/mocks/documentsMock';
import type {
  CoreDocument,
  CoreDocumentDraft,
  CoreMember,
} from '@/modules/family-core/types';
import { useDataSource } from '@/shared/context/DataSourceContext';

type FamilyCoreDocumentsContextValue = {
  members: CoreMember[];
  documents: CoreDocument[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  ensureDocumentDetail: (id: string) => Promise<CoreDocument | null>;
  getMember: (id: string) => CoreMember | undefined;
  getDocument: (id: string) => CoreDocument | undefined;
  addDocument: (draft: CoreDocumentDraft) => Promise<CoreDocument>;
  updateDocument: (
    id: string,
    draft: CoreDocumentDraft,
  ) => Promise<CoreDocument | null>;
  deleteDocument: (id: string) => Promise<boolean>;
};

const FamilyCoreDocumentsContext =
  createContext<FamilyCoreDocumentsContextValue | null>(null);

function nowIso() {
  return new Date().toISOString();
}

export function FamilyCoreDocumentsProvider({
  children,
}: {
  children: ReactNode;
}) {
  const { isApi, isMock } = useDataSource();
  const [documents, setDocuments] = useState<CoreDocument[]>(INITIAL_DOCUMENTS);
  const [members, setMembers] = useState<CoreMember[]>(() => getCoreMembers());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!isApi) {
      setMembers(getCoreMembers());
      setDocuments(INITIAL_DOCUMENTS);
      setError(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const [nextMembers, nextDocs] = await Promise.all([
        listFcMembers(),
        listFcDocuments(),
      ]);
      setMembers(nextMembers);
      setDocuments(nextDocs);
      setError(null);
    } catch (err) {
      setError(
        getFcApiErrorMessage(err, 'Gagal memuat Family Core dari API.'),
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
      setMembers(getCoreMembers());
      setDocuments(INITIAL_DOCUMENTS);
      setError(null);
    }
  }, [isMock]);

  const getMember = useCallback(
    (id: string) => members.find((m) => m.id === id),
    [members],
  );

  const getDocument = useCallback(
    (id: string) => documents.find((d) => d.id === id),
    [documents],
  );

  const ensureDocumentDetail = useCallback(
    async (id: string) => {
      if (!isApi) return getDocument(id) ?? null;
      try {
        const detail = await getFcDocument(id);
        setDocuments((prev) => {
          const exists = prev.some((d) => d.id === id);
          if (!exists) return [detail, ...prev];
          return prev.map((d) => (d.id === id ? detail : d));
        });
        return detail;
      } catch {
        return getDocument(id) ?? null;
      }
    },
    [getDocument, isApi],
  );

  const addDocument = useCallback(
    async (draft: CoreDocumentDraft) => {
      if (isApi) {
        const created = await createFcDocument(draft);
        setDocuments((prev) => [created, ...prev]);
        return created;
      }
      const created: CoreDocument = {
        ...draft,
        id: `doc-${crypto.randomUUID().slice(0, 8)}`,
        createdAt: nowIso(),
        updatedAt: nowIso(),
      };
      setDocuments((prev) => [created, ...prev]);
      return created;
    },
    [isApi],
  );

  const updateDocument = useCallback(
    async (id: string, draft: CoreDocumentDraft) => {
      if (isApi) {
        const updated = await updateFcDocument(id, draft);
        setDocuments((prev) =>
          prev.map((doc) => (doc.id === id ? updated : doc)),
        );
        return updated;
      }

      let updated: CoreDocument | null = null;
      setDocuments((prev) =>
        prev.map((doc) => {
          if (doc.id !== id) return doc;
          updated = {
            ...doc,
            ...draft,
            id: doc.id,
            createdAt: doc.createdAt,
            updatedAt: nowIso(),
          };
          return updated;
        }),
      );
      return updated;
    },
    [isApi],
  );

  const deleteDocument = useCallback(
    async (id: string) => {
      if (isApi) {
        await deleteFcDocument(id);
        setDocuments((prev) => prev.filter((d) => d.id !== id));
        return true;
      }

      let removed = false;
      setDocuments((prev) => {
        const next = prev.filter((d) => d.id !== id);
        removed = next.length !== prev.length;
        return next;
      });
      return removed;
    },
    [isApi],
  );

  const value = useMemo(
    () => ({
      members,
      documents,
      loading,
      error,
      refresh,
      ensureDocumentDetail,
      getMember,
      getDocument,
      addDocument,
      updateDocument,
      deleteDocument,
    }),
    [
      members,
      documents,
      loading,
      error,
      refresh,
      ensureDocumentDetail,
      getMember,
      getDocument,
      addDocument,
      updateDocument,
      deleteDocument,
    ],
  );

  return (
    <FamilyCoreDocumentsContext.Provider value={value}>
      {children}
    </FamilyCoreDocumentsContext.Provider>
  );
}

export function useFamilyCoreDocuments() {
  const ctx = useContext(FamilyCoreDocumentsContext);
  if (!ctx) {
    throw new Error(
      'useFamilyCoreDocuments must be used within FamilyCoreDocumentsProvider',
    );
  }
  return ctx;
}
