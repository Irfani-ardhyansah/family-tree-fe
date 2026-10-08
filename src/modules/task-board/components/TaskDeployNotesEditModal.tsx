import { useEffect, useState } from 'react';
import { Save } from 'react-feather';
import { taskBoardApi } from '../api/taskBoardApi';
import { RichTextEditor } from './RichTextEditor';
import { ModalShell, PrimaryButton, SecondaryButton } from '@/shared/ui';

interface TaskDeployNotesEditModalProps {
  isOpen: boolean;
  taskId?: string;
  initialContent: string;
  saving?: boolean;
  onClose: () => void;
  onSave: (content: string) => void;
}

/** Tambah/edit catatan deploy langsung dari halaman detail. */
export function TaskDeployNotesEditModal({
  isOpen,
  taskId,
  initialContent,
  saving = false,
  onClose,
  onSave,
}: TaskDeployNotesEditModalProps) {
  const [content, setContent] = useState(initialContent);

  useEffect(() => {
    if (isOpen) setContent(initialContent);
  }, [isOpen, initialContent]);

  if (!isOpen) return null;

  return (
    <ModalShell
      accent="task"
      title="Catatan Deploy"
      subtitle="Catatan endpoint, perubahan config, atau langkah deploy"
      onClose={onClose}
      wide
      titleId="task-deploy-notes-title"
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
              onClick={() => onSave(content.trim())}
              disabled={saving}
            >
              <span className="inline-flex items-center justify-center gap-1.5">
                <Save size={15} />
                {saving ? 'Menyimpan…' : 'Simpan'}
              </span>
            </PrimaryButton>
          </div>
        </div>
      }
    >
      <RichTextEditor
        content={content}
        onChange={setContent}
        placeholder="Tulis catatan deploy…"
        taskId={taskId}
        onImagePaste={(file) => taskBoardApi.uploadImage(taskId || 'temp', file)}
      />
    </ModalShell>
  );
}
