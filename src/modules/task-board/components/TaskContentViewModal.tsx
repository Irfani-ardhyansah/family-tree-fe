import { Edit } from 'react-feather';
import { ModalShell, PrimaryButton, SecondaryButton } from '@/shared/ui';
import { RICH_TEXT_CLASS, sanitizeTaskHtml } from '../lib/taskMeta';

interface TaskContentViewModalProps {
  isOpen: boolean;
  title: string;
  subtitle?: string;
  contentHtml: string;
  onClose: () => void;
  /** Kalau diisi, muncul tombol Edit di footer (buka form edit terkait). */
  onEdit?: () => void;
}

/** Modal baca-saja untuk menampilkan konten penuh (deskripsi task / todo). */
export function TaskContentViewModal({
  isOpen,
  title,
  subtitle,
  contentHtml,
  onClose,
  onEdit,
}: TaskContentViewModalProps) {
  if (!isOpen) return null;

  const hasContent = Boolean(contentHtml && contentHtml.trim() !== '');

  return (
    <ModalShell
      accent="task"
      title={title}
      subtitle={subtitle}
      onClose={onClose}
      wide
      titleId="task-content-view-title"
      footer={
        <div className="flex justify-end gap-2">
          <div className="w-24">
            <SecondaryButton onClick={onClose}>Tutup</SecondaryButton>
          </div>
          {onEdit ? (
            <div className="w-28">
              <PrimaryButton accent="task" onClick={onEdit}>
                <span className="inline-flex items-center justify-center gap-1.5">
                  <Edit size={15} />
                  Edit
                </span>
              </PrimaryButton>
            </div>
          ) : null}
        </div>
      }
    >
      {hasContent ? (
        <div
          className={RICH_TEXT_CLASS}
          dangerouslySetInnerHTML={{ __html: sanitizeTaskHtml(contentHtml) }}
        />
      ) : (
        <p className="text-[13px] text-suite-faint">
          Tidak ada konten untuk ditampilkan.
        </p>
      )}
    </ModalShell>
  );
}
