import { useEffect, useState } from 'react';
import { Plus, Save, Trash2 } from 'react-feather';
import { ModalShell, FieldInput, PrimaryButton, SecondaryButton } from '@/shared/ui';

interface TaskMigrationFilesEditModalProps {
  isOpen: boolean;
  initialFiles: string[];
  saving?: boolean;
  onClose: () => void;
  onSave: (files: string[]) => void;
}

const DELETE_BUTTON_CLASS =
  'shrink-0 rounded-control p-2.5 text-suite-faint transition-colors hover:bg-rose-500/10 hover:text-rose-600 dark:hover:text-rose-300';

/** Kelola daftar file migrasi (tambah/hapus baris) dari halaman detail. */
export function TaskMigrationFilesEditModal({
  isOpen,
  initialFiles,
  saving = false,
  onClose,
  onSave,
}: TaskMigrationFilesEditModalProps) {
  const [files, setFiles] = useState<string[]>(initialFiles);

  useEffect(() => {
    if (isOpen) setFiles(initialFiles.length > 0 ? initialFiles : ['']);
  }, [isOpen, initialFiles]);

  if (!isOpen) return null;

  const updateFile = (index: number, value: string) => {
    setFiles((prev) => prev.map((f, i) => (i === index ? value : f)));
  };

  const addRow = () => setFiles((prev) => [...prev, '']);

  const removeRow = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <ModalShell
      accent="task"
      title="File Migrasi"
      subtitle="Nama file migrasi yang ikut di task ini"
      onClose={onClose}
      titleId="task-migration-files-title"
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
              onClick={() =>
                onSave(files.map((f) => f.trim()).filter((f) => f !== ''))
              }
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
      <div className="space-y-2">
        {files.map((file, index) => (
          <div key={index} className="flex gap-2">
            <FieldInput
              accent="task"
              value={file}
              onChange={(v) => updateFile(index, v)}
              placeholder="mis. 20260925_create_users_table.ts"
              className="font-money-mono"
            />
            <button
              type="button"
              onClick={() => removeRow(index)}
              className={DELETE_BUTTON_CLASS}
              aria-label="Hapus file migrasi"
            >
              <Trash2 size={16} />
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={addRow}
          className="inline-flex items-center gap-1.5 rounded-control border border-suite-border bg-suite-surface px-3 py-1.5 text-[12.5px] font-bold text-suite-muted transition-colors hover:bg-suite-soft hover:text-suite-ink"
        >
          <Plus size={14} />
          Tambah Baris
        </button>
      </div>
    </ModalShell>
  );
}
