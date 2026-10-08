import { useEffect, useState } from 'react';
import { Save } from 'react-feather';
import { taskBoardApi } from '../api/taskBoardApi';
import { RichTextEditor } from './RichTextEditor';
import { ModalShell, FieldInput, PrimaryButton, SecondaryButton } from '@/shared/ui';

interface TaskTodoEditModalProps {
  isOpen: boolean;
  taskId?: string;
  mode?: 'add' | 'edit';
  initialTitle: string;
  initialDescription: string;
  saving?: boolean;
  onClose: () => void;
  onSave: (title: string, description: string) => void;
}

/** Tambah/edit satu todo (judul + deskripsi rich text). */
export function TaskTodoEditModal({
  isOpen,
  taskId,
  mode = 'add',
  initialTitle,
  initialDescription,
  saving = false,
  onClose,
  onSave,
}: TaskTodoEditModalProps) {
  const [title, setTitle] = useState(initialTitle);
  const [description, setDescription] = useState(initialDescription);

  useEffect(() => {
    if (isOpen) {
      setTitle(initialTitle);
      setDescription(initialDescription);
    }
  }, [isOpen, initialTitle, initialDescription]);

  if (!isOpen) return null;

  const canSave = title.trim().length > 0 && !saving;

  return (
    <ModalShell
      accent="task"
      title={mode === 'add' ? 'Tambah Todo' : 'Edit Todo'}
      subtitle="Checklist kecil di dalam task ini"
      onClose={onClose}
      wide
      titleId="task-todo-edit-title"
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
              onClick={() => onSave(title.trim(), description)}
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
            Judul Todo
          </label>
          <FieldInput
            accent="task"
            value={title}
            onChange={setTitle}
            placeholder="mis. Tambah index kolom status"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-suite-faint">
            Deskripsi <span className="font-medium normal-case">(opsional)</span>
          </label>
          <RichTextEditor
            content={description}
            onChange={setDescription}
            placeholder="Detail langkah…"
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
