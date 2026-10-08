import { useEffect, useState } from 'react';
import { Save } from 'react-feather';
import { taskBoardApi } from '../api/taskBoardApi';
import { RichTextEditor } from './RichTextEditor';
import { ModalShell, FieldInput, PrimaryButton, SecondaryButton } from '@/shared/ui';

interface TaskDescriptionEditModalProps {
  isOpen: boolean;
  taskId?: string;
  /** `add` = entri baru, `edit` = ubah entri yang ada. */
  mode?: 'add' | 'edit';
  initialTitle: string;
  initialContent: string;
  saving?: boolean;
  onClose: () => void;
  onSave: (title: string, content: string) => void;
}

/** Tambah/edit satu entri deskripsi (judul + isi rich text). */
export function TaskDescriptionEditModal({
  isOpen,
  taskId,
  mode = 'edit',
  initialTitle,
  initialContent,
  saving = false,
  onClose,
  onSave,
}: TaskDescriptionEditModalProps) {
  const [title, setTitle] = useState(initialTitle);
  const [content, setContent] = useState(initialContent);

  useEffect(() => {
    if (isOpen) {
      setTitle(initialTitle);
      setContent(initialContent);
    }
  }, [isOpen, initialTitle, initialContent]);

  if (!isOpen) return null;

  const canSave = title.trim().length > 0 && content.trim().length > 0 && !saving;

  return (
    <ModalShell
      accent="task"
      title={mode === 'add' ? 'Tambah Penjelasan' : 'Edit Penjelasan'}
      subtitle={
        mode === 'add'
          ? 'Tambahkan entri penjelasan baru untuk task ini'
          : 'Ubah judul dan isi penjelasan ini saja'
      }
      onClose={onClose}
      wide
      titleId="task-description-edit-title"
      footer={
        <div className="flex justify-end gap-2">
          <div className="w-24">
            <SecondaryButton onClick={onClose} disabled={saving}>
              Batal
            </SecondaryButton>
          </div>
          <div className="w-36">
            <PrimaryButton
              accent="task"
              onClick={() => onSave(title.trim(), content.trim())}
              disabled={!canSave}
            >
              <span className="inline-flex items-center justify-center gap-1.5">
                <Save size={15} />
                {saving ? 'Menyimpan…' : mode === 'add' ? 'Tambah' : 'Simpan'}
              </span>
            </PrimaryButton>
          </div>
        </div>
      }
    >
      <div className="space-y-4">
        <div>
          <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-suite-faint">
            Judul
          </label>
          <FieldInput
            accent="task"
            value={title}
            onChange={setTitle}
            placeholder="mis. Konteks"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-suite-faint">
            Isi
          </label>
          <RichTextEditor
            content={content}
            onChange={setContent}
            placeholder="Tulis isi deskripsi…"
            taskId={taskId}
            onImagePaste={(file) =>
              taskBoardApi.uploadImage(taskId || 'temp', file)
            }
          />
        </div>
      </div>
    </ModalShell>
  );
}
