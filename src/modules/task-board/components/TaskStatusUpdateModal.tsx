import { useState } from 'react';
import { ModalShell, PrimaryButton, SecondaryButton } from '@/shared/ui';
import type { TaskStatus } from '../types';

interface TaskStatusUpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (status: TaskStatus, notes?: string) => void;
  currentStatus: TaskStatus;
  loading?: boolean;
}

const STATUS_OPTIONS: { value: TaskStatus; label: string }[] = [
  { value: 'To-Do', label: 'To-Do' },
  { value: 'In Progress', label: 'In Progress' },
  { value: 'Merged', label: 'Merged' },
];

export function TaskStatusUpdateModal({
  isOpen,
  onClose,
  onConfirm,
  currentStatus,
  loading = false,
}: TaskStatusUpdateModalProps) {
  const [selectedStatus, setSelectedStatus] = useState<TaskStatus>(currentStatus);
  const [notes, setNotes] = useState('');

  if (!isOpen) return null;

  const handleConfirm = () => {
    onConfirm(selectedStatus, notes.trim() || undefined);
  };

  const getStatusColor = (status: TaskStatus) => {
    switch (status) {
      case 'To-Do':
        return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300';
      case 'In Progress':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300';
      case 'Merged':
        return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300';
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  return (
    <ModalShell
      accent="task"
      title="Update Status Task"
      subtitle="Pilih status baru dan tambahkan catatan jika diperlukan"
      onClose={onClose}
      titleId="task-status-update-title"
    >
      <div className="space-y-4">
        {/* Status Selection */}
        <div>
          <label className="mb-2 block text-xs font-semibold text-suite-faint">
            Pilih Status
          </label>
          <div className="grid grid-cols-2 gap-2">
            {STATUS_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setSelectedStatus(option.value)}
                disabled={loading}
                className={`rounded-lg px-3 py-2.5 text-xs font-semibold transition-colors ${
                  selectedStatus === option.value
                    ? getStatusColor(option.value)
                    : 'bg-suite-soft text-suite-muted hover:bg-suite-soft hover:text-suite-ink'
                } disabled:opacity-50`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* Notes Field */}
        <div>
          <label className="mb-2 block text-xs font-semibold text-suite-faint">
            Catatan <span className="font-normal text-suite-muted">(opsional)</span>
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            disabled={loading}
            placeholder="Tambahkan catatan untuk perubahan status ini..."
            rows={3}
            className="w-full rounded-lg border border-suite-border bg-suite-surface px-3 py-2 text-sm text-suite-ink placeholder:text-suite-faint focus:border-amber-500 focus:outline-none disabled:opacity-50"
          />
        </div>
      </div>

      <div className="mt-6 flex justify-end gap-3">
        <SecondaryButton onClick={onClose} disabled={loading}>
          Batal
        </SecondaryButton>
        <PrimaryButton
          accent="task"
          onClick={handleConfirm}
          disabled={loading || selectedStatus === currentStatus}
        >
          {loading ? 'Menyimpan...' : 'Simpan'}
        </PrimaryButton>
      </div>
    </ModalShell>
  );
}
