import { useState } from 'react';
import { ModalShell, PrimaryButton, SecondaryButton } from '@/shared/ui';
import { TASK_STATUS_META, TASK_STATUS_ORDER } from '../lib/taskMeta';
import type { TaskStatus } from '../types';

interface TaskStatusUpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (status: TaskStatus, notes?: string) => void;
  currentStatus: TaskStatus;
  loading?: boolean;
}

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

  return (
    <ModalShell
      accent="task"
      title="Update Status Task"
      subtitle="Pilih status baru dan tambahkan catatan bila perlu"
      onClose={onClose}
      titleId="task-status-update-title"
      footer={
        <div className="flex justify-end gap-2">
          <div className="w-24">
            <SecondaryButton onClick={onClose} disabled={loading}>
              Batal
            </SecondaryButton>
          </div>
          <div className="w-32">
            <PrimaryButton
              accent="task"
              onClick={handleConfirm}
              disabled={loading || selectedStatus === currentStatus}
            >
              {loading ? 'Menyimpan…' : 'Simpan'}
            </PrimaryButton>
          </div>
        </div>
      }
    >
      <div className="space-y-4">
        <div>
          <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-suite-faint">
            Pilih Status
          </p>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            {TASK_STATUS_ORDER.map((status) => {
              const meta = TASK_STATUS_META[status];
              const Icon = meta.icon;
              const active = selectedStatus === status;
              return (
                <button
                  key={status}
                  type="button"
                  onClick={() => setSelectedStatus(status)}
                  disabled={loading}
                  className={[
                    'flex items-center gap-2 rounded-control border px-3 py-2.5 text-left text-[13px] font-bold transition-colors disabled:opacity-50',
                    active
                      ? `border-transparent ${meta.chipClass}`
                      : 'border-suite-border bg-suite-surface text-suite-muted hover:bg-suite-soft',
                  ].join(' ')}
                >
                  <Icon size={15} />
                  {meta.label}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-suite-faint">
            Catatan <span className="font-medium normal-case">(opsional)</span>
          </p>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            disabled={loading}
            placeholder="Mis. sudah dites di staging, menunggu review…"
            rows={3}
            className="w-full resize-none rounded-control border border-suite-border bg-suite-soft px-3 py-2.5 text-[13.5px] font-semibold text-suite-ink outline-none placeholder:font-medium placeholder:text-suite-faint focus:border-amber-500 focus:bg-suite-surface disabled:opacity-50"
          />
        </div>
      </div>
    </ModalShell>
  );
}
