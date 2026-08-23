import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Settings } from 'react-feather';
import { DocumentListRow } from '@/modules/family-core/components/DocumentListRow';
import { MemberAvatarSelector } from '@/modules/family-core/components/MemberAvatarSelector';
import { CoreListSkeleton } from '@/modules/family-core/components/CoreSkeleton';
import {
  CoreCard,
  CorePageHeader,
} from '@/modules/family-core/components/PageChrome';
import { useFamilyCoreDocuments } from '@/modules/family-core/context/FamilyCoreDocumentsContext';
import { useFamilyCoreUi } from '@/modules/family-core/context/FamilyCoreUiContext';
import { sortDocumentsByUrgency } from '@/modules/family-core/lib/documentStatus';
import { corePaths } from '@/shared/routes';

export function DocumentsPage() {
  const { members, documents, getMember, loading } = useFamilyCoreDocuments();
  const { openDocumentModal } = useFamilyCoreUi();
  const [memberFilter, setMemberFilter] = useState<'all' | string>('all');
  const [toast, setToast] = useState<string | null>(null);

  const counts = useMemo(() => {
    const map: Record<string, number> = {};
    for (const m of members) map[m.id] = 0;
    for (const d of documents) {
      map[d.memberId] = (map[d.memberId] ?? 0) + 1;
    }
    return map;
  }, [documents, members]);

  const filtered = useMemo(() => {
    const list =
      memberFilter === 'all'
        ? documents
        : documents.filter((d) => d.memberId === memberFilter);
    return sortDocumentsByUrgency(list);
  }, [documents, memberFilter]);

  const showToast = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(null), 1800);
  };

  const openAdd = () => {
    openDocumentModal({
      defaultMemberId: memberFilter === 'all' ? undefined : memberFilter,
    });
  };

  return (
    <div>
      <CorePageHeader
        title="Dokumen penting"
        description="Nomor dokumen, status kadaluarsa, dan arsip scan keluarga inti."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Link
              to={corePaths.documentTypes}
              className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-[13px] font-bold text-brand-700 hover:border-sky-300 hover:text-sky-700"
            >
              <Settings size={15} />
              Jenis
            </Link>
            <button
              type="button"
              onClick={openAdd}
              className="inline-flex items-center gap-1.5 rounded-xl bg-sky-600 px-3.5 py-2.5 text-[13px] font-bold text-white shadow-sm hover:bg-sky-700"
            >
              <Plus size={16} />
              Tambah
            </button>
          </div>
        }
      />

      <div className="mb-4">
        {loading ? (
          <div className="flex gap-2 overflow-hidden">
            {Array.from({ length: 5 }).map((_, i) => (
              <span
                key={i}
                className="h-14 w-14 shrink-0 animate-pulse rounded-full bg-slate-200/90"
              />
            ))}
          </div>
        ) : (
          <MemberAvatarSelector
            members={members}
            value={memberFilter}
            onChange={setMemberFilter}
            counts={counts}
            totalCount={documents.length}
          />
        )}
      </div>

      {loading ? (
        <CoreListSkeleton rows={6} />
      ) : (
        <CoreCard className="overflow-hidden divide-y divide-gray-100">
          {filtered.length === 0 ? (
            <div className="px-5 py-12 text-center">
              <p className="text-sm font-semibold text-brand-700">
                Belum ada dokumen
              </p>
              <p className="mt-1 text-[13px] text-brand-400">
                Tambah dokumen untuk anggota yang dipilih.
              </p>
              <button
                type="button"
                onClick={openAdd}
                className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-sky-600 px-3.5 py-2 text-[13px] font-bold text-white hover:bg-sky-700"
              >
                <Plus size={15} />
                Tambah dokumen
              </button>
            </div>
          ) : (
            filtered.map((doc) => (
              <DocumentListRow
                key={doc.id}
                document={doc}
                memberName={getMember(doc.memberId)?.name}
                showMember={memberFilter === 'all'}
                onCopied={showToast}
              />
            ))
          )}
        </CoreCard>
      )}

      {toast ? (
        <div className="fixed bottom-5 left-1/2 z-50 -translate-x-1/2 rounded-full bg-brand-800 px-4 py-2 text-[12.5px] font-semibold text-white shadow-lg">
          {toast}
        </div>
      ) : null}
    </div>
  );
}
