import { useEffect, useState } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Copy, Edit2, FileText, Trash2 } from 'react-feather';
import { DocumentStatusBadge } from '@/modules/family-core/components/DocumentStatusBadge';
import {
  CoreCard,
  CorePageHeader,
} from '@/modules/family-core/components/PageChrome';
import { useFamilyCoreDocumentTypes } from '@/modules/family-core/context/FamilyCoreDocumentTypesContext';
import { useFamilyCoreDocuments } from '@/modules/family-core/context/FamilyCoreDocumentsContext';
import { useFamilyCoreUi } from '@/modules/family-core/context/FamilyCoreUiContext';
import {
  expiryHint,
  getDocumentStatus,
} from '@/modules/family-core/lib/documentStatus';
import { resolveDocumentType } from '@/modules/family-core/lib/documentTypeMeta';
import { useDataSource } from '@/shared/context/DataSourceContext';
import { corePaths } from '@/shared/routes';
import type { ReactNode } from 'react';

function formatDate(value: string | null): string {
  if (!value) return '—';
  try {
    return new Date(`${value}T12:00:00`).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return value;
  }
}

function DetailRow({
  label,
  value,
  action,
}: {
  label: string;
  value: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-3 px-4 py-3">
      <div className="min-w-0">
        <p className="text-[11px] font-bold uppercase tracking-wide text-brand-400">
          {label}
        </p>
        <div className="mt-0.5 text-[14px] font-semibold text-brand-800">
          {value}
        </div>
      </div>
      {action}
    </div>
  );
}

export function DocumentDetailPage() {
  const { documentId } = useParams();
  const navigate = useNavigate();
  const { isMock, isApi } = useDataSource();
  const {
    getDocument,
    getMember,
    deleteDocument,
    ensureDocumentDetail,
    loading,
  } = useFamilyCoreDocuments();
  const { getTypeBySlug } = useFamilyCoreDocumentTypes();
  const { openDocumentModal } = useFamilyCoreUi();
  const [toast, setToast] = useState<string | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    if (!documentId || !isApi) return;
    setDetailLoading(true);
    void ensureDocumentDetail(documentId).finally(() => setDetailLoading(false));
  }, [documentId, ensureDocumentDetail, isApi]);

  const doc = documentId ? getDocument(documentId) : undefined;
  if (!doc && !loading && !detailLoading) {
    return <Navigate to={corePaths.documents} replace />;
  }
  if (!doc) {
    return (
      <p className="text-[13px] font-semibold text-brand-500">
        Memuat dokumen…
      </p>
    );
  }

  const member = getMember(doc.memberId);
  const meta = resolveDocumentType(getTypeBySlug(doc.type));
  const status = getDocumentStatus(doc);
  const hint = expiryHint(doc);
  const Icon = meta.Icon;

  const copyNumber = async () => {
    try {
      await navigator.clipboard.writeText(doc.number);
      setToast('Nomor dokumen disalin');
      window.setTimeout(() => setToast(null), 1800);
    } catch {
      setToast('Gagal menyalin nomor');
      window.setTimeout(() => setToast(null), 1800);
    }
  };

  const handleDelete = () => {
    if (
      !window.confirm(
        `Hapus dokumen "${doc.title}"? Tindakan ini tidak bisa dibatalkan${
          isMock ? ' (mock)' : ''
        }.`,
      )
    ) {
      return;
    }
    void deleteDocument(doc.id).then(() => {
      navigate(corePaths.documents);
    });
  };

  const extraRows = meta.extras
    .map((field) => ({
      label: field.label,
      value: doc.extras[field.key],
    }))
    .filter((row) => Boolean(row.value));

  return (
    <div>
      <div className="mb-4">
        <Link
          to={corePaths.documents}
          className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-brand-500 hover:text-sky-700"
        >
          <ArrowLeft size={15} />
          Kembali ke daftar
        </Link>
      </div>

      <CorePageHeader
        title={doc.title}
        description={member ? `Untuk ${member.name}` : undefined}
        actions={
          <button
            type="button"
            onClick={() => openDocumentModal({ documentId: doc.id })}
            className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-2 text-[13px] font-bold text-brand-700 hover:border-sky-300 hover:text-sky-700"
          >
            <Edit2 size={15} />
            Edit
          </button>
        }
      />

      <div className="space-y-4">
        <CoreCard className="overflow-hidden">
          {doc.scanUrl ? (
            <button
              type="button"
              className="block w-full bg-gray-50"
              onClick={() => window.open(doc.scanUrl!, '_blank')}
            >
              <img
                src={doc.scanUrl}
                alt={`Scan ${doc.title}`}
                className="max-h-64 w-full object-contain"
              />
            </button>
          ) : (
            <div className="flex flex-col items-center justify-center gap-2 bg-gradient-to-b from-sky-50 to-white px-4 py-10 text-center">
              <span
                className={[
                  'flex h-14 w-14 items-center justify-center rounded-2xl',
                  meta.toneBg,
                  meta.toneText,
                ].join(' ')}
              >
                <Icon size={26} />
              </span>
              <p className="text-[13px] font-semibold text-brand-600">
                Belum ada scan dokumen
              </p>
              <p className="text-[12px] text-brand-400">
                Upload bisa ditambahkan saat edit (dummy UI).
              </p>
            </div>
          )}
        </CoreCard>

        <CoreCard className="overflow-hidden divide-y divide-gray-100">
          <div className="flex flex-wrap items-center gap-2 px-4 py-3">
            <DocumentStatusBadge status={status} />
            {hint ? (
              <span
                className={[
                  'text-[12.5px] font-medium',
                  status === 'expired'
                    ? 'text-rose-600'
                    : status === 'expiring'
                      ? 'text-amber-700'
                      : 'text-brand-500',
                ].join(' ')}
              >
                {hint}
              </span>
            ) : (
              <span className="text-[12.5px] font-medium text-brand-400">
                Berlaku seumur hidup
              </span>
            )}
          </div>

          <DetailRow label="Jenis dokumen" value={meta.label} />
          <DetailRow label="Anggota" value={member?.name ?? '—'} />
          <DetailRow
            label="Nomor dokumen"
            value={
              <span className="break-all font-mono text-[13.5px]">
                {doc.number}
              </span>
            }
            action={
              <button
                type="button"
                onClick={() => void copyNumber()}
                className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-brand-400 hover:bg-sky-50 hover:text-sky-700"
                aria-label="Salin nomor"
              >
                <Copy size={16} />
              </button>
            }
          />
          <DetailRow label="Tanggal terbit" value={formatDate(doc.issuedAt)} />
          <DetailRow
            label="Tanggal kadaluarsa"
            value={doc.lifetime ? 'Seumur hidup' : formatDate(doc.expiresAt)}
          />
          {extraRows.map((row) => (
            <DetailRow key={row.label} label={row.label} value={row.value} />
          ))}
          <DetailRow
            label="Reminder"
            value={
              doc.lifetime || !doc.reminderEnabled
                ? 'Nonaktif'
                : `${doc.reminderDays} hari sebelum kadaluarsa`
            }
          />
          <DetailRow
            label="Catatan"
            value={doc.notes?.trim() ? doc.notes : '—'}
          />
        </CoreCard>

        <button
          type="button"
          onClick={handleDelete}
          className="inline-flex w-full items-center justify-center gap-2 rounded-[14px] border border-rose-200 bg-rose-50 px-4 py-3 text-[13.5px] font-bold text-rose-700 hover:bg-rose-100"
        >
          <Trash2 size={16} />
          Hapus dokumen
        </button>

        <p className="flex items-center justify-center gap-1.5 text-center text-[11.5px] text-brand-400">
          <FileText size={12} />
          {isMock
            ? 'Sumber mock — belum tersimpan ke server'
            : 'Sumber API — tersimpan di Family Core'}
        </p>
      </div>

      {toast ? (
        <div className="fixed bottom-5 left-1/2 z-50 -translate-x-1/2 rounded-full bg-brand-800 px-4 py-2 text-[12.5px] font-semibold text-white shadow-lg">
          {toast}
        </div>
      ) : null}
    </div>
  );
}
