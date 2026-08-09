import type { MouseEvent } from 'react';
import { Copy } from 'react-feather';
import { Link } from 'react-router-dom';
import { DocumentStatusBadge } from '@/modules/family-core/components/DocumentStatusBadge';
import { useFamilyCoreDocumentTypes } from '@/modules/family-core/context/FamilyCoreDocumentTypesContext';
import {
  expiryHint,
  getDocumentStatus,
} from '@/modules/family-core/lib/documentStatus';
import { resolveDocumentType } from '@/modules/family-core/lib/documentTypeMeta';
import { maskDocumentNumber } from '@/modules/family-core/lib/maskDocumentNumber';
import type { CoreDocument } from '@/modules/family-core/types';
import { corePaths } from '@/shared/routes';

type DocumentListRowProps = {
  document: CoreDocument;
  memberName?: string;
  showMember?: boolean;
  onCopied?: (message: string) => void;
};

export function DocumentListRow({
  document,
  memberName,
  showMember,
  onCopied,
}: DocumentListRowProps) {
  const { getTypeBySlug } = useFamilyCoreDocumentTypes();
  const meta = resolveDocumentType(getTypeBySlug(document.type));
  const status = getDocumentStatus(document);
  const hint = expiryHint(document);
  const Icon = meta.Icon;

  const handleCopy = async (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(document.number);
      onCopied?.('Nomor dokumen disalin');
    } catch {
      onCopied?.('Gagal menyalin nomor');
    }
  };

  const subtitleParts = [
    maskDocumentNumber(document.number),
    document.extras.plate,
    document.extras.bank,
    document.extras.simType ? `SIM ${document.extras.simType}` : null,
  ].filter(Boolean);

  return (
    <Link
      to={corePaths.document(document.id)}
      className="flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-sky-50/60"
    >
      <span
        className={[
          'flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px]',
          meta.toneBg,
          meta.toneText,
        ].join(' ')}
      >
        <Icon size={18} />
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="truncate text-[14px] font-semibold text-brand-800">
            {document.title}
          </p>
          <DocumentStatusBadge status={status} />
        </div>
        <p className="mt-0.5 truncate text-[12.5px] text-brand-500">
          {subtitleParts.join(' · ')}
          {showMember && memberName ? ` · ${memberName}` : ''}
        </p>
        {hint && status !== 'active' ? (
          <p
            className={[
              'mt-0.5 text-[11.5px] font-medium',
              status === 'expired' ? 'text-rose-600' : 'text-amber-700',
            ].join(' ')}
          >
            {hint}
          </p>
        ) : null}
      </div>

      <button
        type="button"
        onClick={(e) => void handleCopy(e)}
        className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-brand-400 hover:bg-white hover:text-sky-700"
        title="Salin nomor"
        aria-label="Salin nomor dokumen"
      >
        <Copy size={16} />
      </button>
    </Link>
  );
}
