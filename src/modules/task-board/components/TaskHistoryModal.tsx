import { Link } from 'react-router-dom';
import {
  Edit2,
  FileText,
  GitBranch,
  Plus,
  RefreshCw,
  Trash2,
  type Icon,
} from 'react-feather';
import { ModalShell, SecondaryButton } from '@/shared/ui';
import { taskBoardPaths } from '@/shared/routes';
import { TASK_STATUS_META, formatTaskDateTime } from '../lib/taskMeta';
import type { TaskHistoryAction, TaskHistoryEntry, TaskStatus } from '../types';

interface TaskHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  historyItems: TaskHistoryEntry[];
  loading?: boolean;
}

function isTaskStatus(value: string): value is TaskStatus {
  return value === 'To-Do' || value === 'In Progress' || value === 'Merged';
}

/** Ikon + label per jenis aksi riwayat. */
function actionMeta(action: TaskHistoryAction | undefined): {
  label: string;
  icon: Icon;
  toneClass: string;
} {
  switch (action) {
    case 'created':
      return { label: 'Dibuat', icon: Plus, toneClass: 'text-emerald-600 dark:text-emerald-400' };
    case 'description_added':
      return { label: 'Deskripsi', icon: FileText, toneClass: 'text-sky-600 dark:text-sky-400' };
    case 'description_updated':
      return { label: 'Deskripsi', icon: Edit2, toneClass: 'text-sky-600 dark:text-sky-400' };
    case 'description_removed':
      return { label: 'Deskripsi', icon: Trash2, toneClass: 'text-rose-600 dark:text-rose-400' };
    case 'revision_created':
      return { label: 'Revisi', icon: GitBranch, toneClass: 'text-violet-600 dark:text-violet-400' };
    case 'status_changed':
    default:
      return { label: 'Status', icon: RefreshCw, toneClass: 'text-amber-600 dark:text-amber-400' };
  }
}

function actionText(item: TaskHistoryEntry): string {
  switch (item.action) {
    case 'created':
      return `Task dibuat dengan status ${item.status}`;
    case 'description_added':
      return item.notes ? `Deskripsi ditambahkan: “${item.notes}”` : 'Deskripsi ditambahkan';
    case 'description_updated':
      return item.notes ? `Deskripsi diperbarui: “${item.notes}”` : 'Deskripsi diperbarui';
    case 'description_removed':
      return item.notes ? `Deskripsi dihapus: “${item.notes}”` : 'Deskripsi dihapus';
    case 'revision_created':
      return item.related_task_title || item.notes
        ? `Revisi dibuat: “${item.related_task_title ?? item.notes}”`
        : 'Revisi dibuat';
    case 'status_changed':
    default:
      return `Status diubah ke ${item.status}`;
  }
}

export function TaskHistoryModal({
  isOpen,
  onClose,
  historyItems,
  loading = false,
}: TaskHistoryModalProps) {
  if (!isOpen) return null;

  return (
    <ModalShell
      accent="task"
      title="Riwayat Task"
      subtitle={`${historyItems.length} perubahan tercatat`}
      onClose={onClose}
      wide
      titleId="task-history-title"
      footer={
        <div className="flex justify-end">
          <div className="w-24">
            <SecondaryButton onClick={onClose}>Tutup</SecondaryButton>
          </div>
        </div>
      }
    >
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-16 animate-pulse rounded-card bg-suite-soft"
            />
          ))}
        </div>
      ) : historyItems.length === 0 ? (
        <div className="py-10 text-center text-[13px] text-suite-faint">
          Belum ada riwayat perubahan.
        </div>
      ) : (
        <div className="relative">
          <div className="absolute bottom-2 left-[15px] top-2 w-px bg-suite-border" />
          <div className="space-y-3">
            {historyItems.map((item) => {
              const meta = actionMeta(item.action);
              const ActionIcon = meta.icon;
              const statusMeta = isTaskStatus(item.status)
                ? TASK_STATUS_META[item.status]
                : null;
              const relatedId =
                item.action === 'revision_created' ? item.related_task_id : null;

              return (
                <div key={item.id} className="relative flex gap-3.5">
                  <div
                    className={`relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-suite-border bg-suite-surface ${meta.toneClass}`}
                  >
                    <ActionIcon size={14} />
                  </div>
                  <div className="flex-1 rounded-card border border-suite-border bg-suite-surface px-4 py-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[12px] font-bold text-suite-ink">
                        {meta.label}
                      </span>
                      {statusMeta ? (
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10.5px] font-bold ${statusMeta.chipClass}`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${statusMeta.dotClass}`}
                          />
                          {statusMeta.label}
                        </span>
                      ) : null}
                      <span className="text-[11px] text-suite-faint">
                        {formatTaskDateTime(item.changed_at)}
                      </span>
                    </div>
                    <p
                      className="mt-1.5 text-[13px] font-semibold text-suite-ink"
                      data-testid={`history-text-${item.id}`}
                    >
                      {actionText(item)}
                    </p>
                    {(item.action === 'status_changed' ||
                      item.action === 'created') &&
                    item.notes ? (
                      <p className="mt-1 text-[12.5px] text-suite-muted">
                        {item.notes}
                      </p>
                    ) : null}
                    {item.action === 'revision_created' ? (
                      relatedId ? (
                        <Link
                          to={taskBoardPaths.detail(relatedId)}
                          data-testid={`history-link-${item.id}`}
                          className="mt-1.5 inline-block text-[12.5px] font-semibold text-amber-600 hover:text-amber-700 dark:text-amber-400"
                        >
                          Lihat detail revisi →
                        </Link>
                      ) : (
                        <p className="mt-1.5 text-[11.5px] italic text-suite-faint">
                          Task revisi sudah dihapus
                        </p>
                      )
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </ModalShell>
  );
}
