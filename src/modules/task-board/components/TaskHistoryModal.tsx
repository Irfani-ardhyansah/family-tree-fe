import { Link } from 'react-router-dom';
import { ModalShell, SecondaryButton } from '@/shared/ui';
import { taskBoardPaths } from '@/shared/routes';
import type { TaskHistoryAction, TaskHistoryEntry } from '../types';

interface TaskHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  historyItems: TaskHistoryEntry[];
  loading?: boolean;
}

/** Label + ikon timeline per jenis aksi riwayat. */
function actionMeta(action: TaskHistoryAction | undefined): {
  label: string;
  icon: string;
} {
  switch (action) {
    case 'created':
      return { label: 'Dibuat', icon: '➕' };
    case 'description_added':
      return { label: 'Deskripsi', icon: '📝' };
    case 'description_updated':
      return { label: 'Deskripsi', icon: '✏️' };
    case 'description_removed':
      return { label: 'Deskripsi', icon: '🗑️' };
    case 'revision_created':
      return { label: 'Revisi', icon: '🌿' };
    case 'status_changed':
    default:
      return { label: 'Status', icon: '🔁' };
  }
}

/** Teks utama tiap entri: aksi + detailnya (judul deskripsi / catatan / status). */
function actionText(item: TaskHistoryEntry): string {
  switch (item.action) {
    case 'created':
      return `Dibuat — ${item.status}`;
    case 'description_added':
      return item.notes
        ? `Deskripsi ditambahkan: "${item.notes}"`
        : 'Deskripsi ditambahkan';
    case 'description_updated':
      return item.notes
        ? `Deskripsi diperbarui: "${item.notes}"`
        : 'Deskripsi diperbarui';
    case 'description_removed':
      return item.notes
        ? `Deskripsi dihapus: "${item.notes}"`
        : 'Deskripsi dihapus';
    case 'revision_created':
      return item.related_task_title || item.notes
        ? `Revisi dibuat: "${item.related_task_title ?? item.notes}"`
        : 'Revisi dibuat';
    case 'status_changed':
    default:
      return `Status → ${item.status}`;
  }
}

export function TaskHistoryModal({
  isOpen,
  onClose,
  historyItems,
  loading = false,
}: TaskHistoryModalProps) {
  if (!isOpen) return null;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const getStatusColor = (status: string) => {
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
      title="Riwayat Task"
      subtitle={`Total ${historyItems.length} perubahan`}
      onClose={onClose}
      wide
      titleId="task-history-title"
    >
      <div className="space-y-4">
        {loading ? (
          <div className="flex items-center justify-center py-8 text-center">
            <p className="text-sm text-suite-muted">Memuat riwayat...</p>
          </div>
        ) : historyItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="mb-3 text-4xl">📋</div>
            <p className="text-sm text-suite-muted">Belum ada riwayat perubahan</p>
          </div>
        ) : (
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-[19px] top-2 bottom-2 w-0.5 bg-suite-border" />

            {/* Timeline items */}
            <div className="space-y-4">
              {historyItems.map((item) => {
                const meta = actionMeta(item.action);
                const relatedId = item.action === 'revision_created' ? item.related_task_id : null;

                return (
                <div key={item.id} className="relative flex gap-4">
                  {/* Timeline dot */}
                  <div className="relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-suite-surface border-2 border-suite-border shadow-sm">
                    <span className="text-sm">{meta.icon}</span>
                  </div>

                  {/* Content card */}
                  <div className="flex-1 rounded-xl border border-suite-border bg-suite-surface p-4 shadow-sm hover:border-amber-200 hover:shadow-md transition-all">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className={`inline-flex items-center rounded-lg px-2.5 py-1 text-xs font-bold ${getStatusColor(item.status)}`}
                          >
                            {meta.label} · {item.status}
                          </span>
                          <span className="text-xs text-suite-faint">
                            {formatDate(item.changed_at)}
                          </span>
                        </div>
                        <p
                          className="mt-2 text-sm font-semibold text-suite-ink"
                          data-testid={`history-text-${item.id}`}
                        >
                          {actionText(item)}
                        </p>
                        {item.action === 'status_changed' || item.action === 'created' ? (
                          item.notes ? (
                            <p className="mt-1 text-sm text-suite-muted">{item.notes}</p>
                          ) : (
                            <p className="mt-1 text-sm italic text-suite-faint">
                              Tanpa catatan
                            </p>
                          )
                        ) : null}
                        {item.action === 'revision_created' ? (
                          relatedId ? (
                            <Link
                              to={taskBoardPaths.detail(relatedId)}
                              data-testid={`history-link-${item.id}`}
                              className="mt-2 inline-block text-sm font-semibold text-sky-600 hover:text-sky-700 hover:underline dark:text-sky-400 dark:hover:text-sky-300"
                            >
                              Lihat detail revisi →
                            </Link>
                          ) : (
                            <p className="mt-2 text-xs italic text-suite-faint">
                              Task revisi sudah dihapus
                            </p>
                          )
                        ) : null}
                      </div>
                    </div>
                  </div>
                </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <div className="mt-6 flex justify-end">
        <SecondaryButton onClick={onClose}>Tutup</SecondaryButton>
      </div>
    </ModalShell>
  );
}
