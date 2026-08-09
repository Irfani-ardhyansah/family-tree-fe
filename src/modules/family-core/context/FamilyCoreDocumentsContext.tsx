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
import { getCoreMembers } from '@/modules/family-core/mocks/coreMembers';
import { INITIAL_DOCUMENTS } from '@/modules/family-core/mocks/documentsMock';
import type {
  CoreDocument,
  CoreDocumentDraft,
  CoreMember,
} from '@/modules/family-core/types';

type FamilyCoreDocumentsContextValue = {
  members: CoreMember[];
  documents: CoreDocument[];
  getMember: (id: string) => CoreMember | undefined;
  getDocument: (id: string) => CoreDocument | undefined;
  addDocument: (draft: CoreDocumentDraft) => CoreDocument;
  updateDocument: (id: string, draft: CoreDocumentDraft) => CoreDocument | null;
  deleteDocument: (id: string) => boolean;
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
  const [documents, setDocuments] = useState<CoreDocument[]>(INITIAL_DOCUMENTS);
  const members = useMemo(() => getCoreMembers(), []);

  const getMember = useCallback(
    (id: string) => members.find((m) => m.id === id),
    [members],
  );

  const getDocument = useCallback(
    (id: string) => documents.find((d) => d.id === id),
    [documents],
  );

  const addDocument = useCallback((draft: CoreDocumentDraft) => {
    const created: CoreDocument = {
      ...draft,
      id: `doc-${crypto.randomUUID().slice(0, 8)}`,
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };
    setDocuments((prev) => [created, ...prev]);
    return created;
  }, []);

  const updateDocument = useCallback(
    (id: string, draft: CoreDocumentDraft) => {
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
    [],
  );

  const deleteDocument = useCallback((id: string) => {
    let removed = false;
    setDocuments((prev) => {
      const next = prev.filter((d) => d.id !== id);
      removed = next.length !== prev.length;
      return next;
    });
    return removed;
  }, []);

  const value = useMemo(
    () => ({
      members,
      documents,
      getMember,
      getDocument,
      addDocument,
      updateDocument,
      deleteDocument,
    }),
    [
      members,
      documents,
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
