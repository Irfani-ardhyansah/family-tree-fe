import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Edit, Trash2, Clock, FileText, GitBranch, Database, RefreshCw } from 'react-feather';
import DOMPurify from 'dompurify';
import { taskBoardApi } from '../api/taskBoardApi';
import { TaskTypeBadge } from '../components/TaskTypeBadge';
import { TaskStatusBadge } from '../components/TaskStatusBadge';
import { LinkChip } from '../components/LinkChip';
import { TaskHistoryModal } from '../components/TaskHistoryModal';
import { TaskStatusUpdateModal } from '../components/TaskStatusUpdateModal';
import type { Task, TaskHistoryEntry, TaskStatus } from '../types';
import { taskBoardPaths } from '@/shared/routes';

/** Field array/relasi dari BE bisa null — samakan jadi array kosong/null. */
function withDefaults(data: Task): Task {
  return {
    ...data,
    descriptions: data.descriptions ?? [],
    migration_files: data.migration_files ?? [],
    parent_task_id: data.parent_task_id ?? null,
    parent_task: data.parent_task ?? null,
    revisions: data.revisions ?? [],
    history: data.history ?? [],
  };
}

function errorMessageOf(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

export function TaskDetailPage() {
  const navigate = useNavigate();
  const { taskId } = useParams<{ taskId: string }>();
  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showStatusUpdateModal, setShowStatusUpdateModal] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [historyItems, setHistoryItems] = useState<TaskHistoryEntry[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const loadTask = async () => {
    if (!taskId) return;
    setLoading(true);
    setErrorMessage(null);
    try {
      const data = await taskBoardApi.get(taskId);
      const loaded = withDefaults(data);
      // Detail sudah membawa revisions; kalau tidak, tarik dari endpoint khusus.
      if (!data.revisions) {
        loaded.revisions = await taskBoardApi.revisions(taskId).catch(() => []);
      }
      setTask(loaded);
      setHistoryItems(loaded.history ?? []);
    } catch (error) {
      setTask(null);
      setErrorMessage(errorMessageOf(error, 'Gagal memuat task.'));
    } finally {
      setLoading(false);
    }
  };

  const openHistory = async () => {
    if (!taskId) return;
    setShowHistoryModal(true);
    setLoadingHistory(true);
    try {
      const items = await taskBoardApi.history(taskId);
      setHistoryItems(items);
    } catch (error) {
      // Riwayat dari detail tetap dipakai kalau endpoint history gagal.
      setHistoryItems((current) => (current.length > 0 ? current : task?.history ?? []));
      setErrorMessage(errorMessageOf(error, 'Gagal memuat riwayat task.'));
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    loadTask();
  }, [taskId]);

  const handleStatusChange = async (newStatus: TaskStatus, notes?: string) => {
    if (!task || !taskId) return;
    setUpdatingStatus(true);
    setErrorMessage(null);
    try {
      const updated = await taskBoardApi.update(taskId, { status: newStatus, notes });
      const refreshed = withDefaults(updated);
      setTask(refreshed);
      setHistoryItems(refreshed.history ?? []);
      setShowStatusUpdateModal(false);
    } catch (error) {
      setErrorMessage(errorMessageOf(error, 'Gagal mengubah status task.'));
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleDelete = async () => {
    if (!taskId) return;
    setDeleting(true);
    setErrorMessage(null);
    const deleted = await taskBoardApi.delete(taskId);
    if (deleted) {
      navigate(taskBoardPaths.home);
      return;
    }
    setErrorMessage('Gagal menghapus task.');
    setDeleting(false);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const sanitizeHtml = (html: string) => {
    return DOMPurify.sanitize(html, {
      ALLOWED_TAGS: [
        'p',
        'br',
        'strong',
        'em',
        'u',
        'ul',
        'ol',
        'li',
        'code',
        'pre',
        'a',
        'img',
      ],
      ALLOWED_ATTR: ['href', 'src', 'alt', 'class'],
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-suite-muted">Loading...</div>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="rounded-xl border border-suite-border bg-suite-surface p-12 text-center">
        <p className="text-sm font-semibold text-suite-ink">
          {errorMessage ?? 'Task tidak ditemukan'}
        </p>
        <Link
          to={taskBoardPaths.home}
          className="mt-4 inline-block text-sm text-amber-600 hover:text-amber-700"
        >
          Kembali ke daftar task
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {errorMessage && (
        <div className="flex items-start justify-between gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300">
          <span>{errorMessage}</span>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            className="text-rose-400 hover:text-rose-600"
            aria-label="Tutup pesan error"
          >
            ✕
          </button>
        </div>
      )}
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate(taskBoardPaths.home)}
            className="rounded-xl p-2 text-suite-muted hover:bg-suite-soft transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="min-w-0">
            <h1 className="text-2xl font-bold tracking-tight text-suite-ink">
              {task.title}
            </h1>
            <p className="mt-1 text-sm text-suite-muted font-mono">
              {task.branch_name}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => void openHistory()}
            className="inline-flex items-center gap-1.5 rounded-xl border border-suite-border bg-suite-surface px-3 py-2 text-sm font-semibold text-suite-ink hover:bg-suite-soft transition-colors"
          >
            <Clock size={16} />
            Riwayat
          </button>
          <Link
            to={taskBoardPaths.edit(task.id)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-suite-border bg-suite-surface px-3 py-2 text-sm font-semibold text-suite-ink hover:bg-suite-soft transition-colors"
          >
            <Edit size={16} />
            Edit
          </Link>
          <button
            type="button"
            onClick={() => setShowDeleteConfirm(true)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-100 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300 dark:hover:bg-rose-950/60 transition-colors"
          >
            <Trash2 size={16} />
            Hapus
          </button>
        </div>
      </div>

      {/* Badges and Actions */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <TaskTypeBadge type={task.type} />
          <TaskStatusBadge status={task.status} />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {task.status === 'Merged' && (
            <Link
              to={taskBoardPaths.new}
              state={{ parentTaskId: task.id }}
              className="inline-flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-100 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-300 dark:hover:bg-blue-950/60 transition-colors"
            >
              <RefreshCw size={16} />
              Buat Revisi
            </Link>
          )}
          <button
            type="button"
            onClick={() => setShowStatusUpdateModal(true)}
            className="inline-flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-700 hover:bg-amber-100 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300 dark:hover:bg-amber-950/60 transition-colors"
          >
            <Clock size={16} />
            Update Status
          </button>
        </div>
      </div>

      {/* Info Cards Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {/* Links */}
        {task.links.length > 0 && (
          <div className="rounded-xl border border-suite-border bg-suite-surface p-4">
            <div className="mb-3 flex items-center gap-2">
              <FileText size={16} className="text-suite-muted" />
              <h3 className="text-sm font-semibold text-suite-ink">Links</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {task.links.map((link, index) => (
                <LinkChip key={index} link={link} />
              ))}
            </div>
          </div>
        )}

        {/* Migration Files */}
        {task.migration_files && task.migration_files.length > 0 && (
          <div className="rounded-xl border border-suite-border bg-suite-surface p-4">
            <div className="mb-3 flex items-center gap-2">
              <Database size={16} className="text-suite-muted" />
              <h3 className="text-sm font-semibold text-suite-ink">File Migrasi ({task.migration_files.length})</h3>
            </div>
            <div className="space-y-2">
              {task.migration_files.map((file, index) => (
                <div key={index} className="rounded-lg bg-suite-soft px-3 py-2 font-mono text-xs text-suite-ink">
                  {file}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Branch Info */}
        <div className="rounded-xl border border-suite-border bg-suite-surface p-4">
          <div className="mb-3 flex items-center gap-2">
            <GitBranch size={16} className="text-suite-muted" />
            <h3 className="text-sm font-semibold text-suite-ink">Branch</h3>
          </div>
          <div className="rounded-lg bg-suite-soft px-3 py-2 font-mono text-xs text-suite-ink">
            {task.branch_name}
          </div>
        </div>
      </div>

      {/* Parent Task Info */}
      {task.parent_task && (
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 dark:border-blue-900 dark:bg-blue-950/40">
          <div className="mb-3 flex items-center gap-2">
            <RefreshCw size={16} className="text-blue-600 dark:text-blue-300" />
            <h3 className="text-sm font-semibold text-blue-700 dark:text-blue-300">Revisi Dari</h3>
          </div>
          <Link
            to={taskBoardPaths.detail(task.parent_task.id)}
            className="block rounded-lg bg-blue-100 px-4 py-3 text-sm font-semibold text-blue-800 hover:bg-blue-200 dark:bg-blue-900/60 dark:text-blue-200 dark:hover:bg-blue-900/80 transition-colors"
          >
            <div className="font-bold">{task.parent_task.title}</div>
            <div className="mt-1 text-xs text-blue-600 dark:text-blue-400 font-mono">
              #{task.parent_task.id} • {task.parent_task.branch_name}
            </div>
          </Link>
        </div>
      )}

      {/* Revisions List */}
      {task.revisions && task.revisions.length > 0 && (
        <div className="rounded-xl border border-suite-border bg-suite-surface p-4">
          <div className="mb-3 flex items-center gap-2">
            <RefreshCw size={16} className="text-suite-muted" />
            <h3 className="text-sm font-semibold text-suite-ink">Revisi ({task.revisions.length})</h3>
          </div>
          <div className="space-y-2">
            {task.revisions.map((revision) => (
              <Link
                key={revision.id}
                to={taskBoardPaths.detail(revision.id)}
                className="block rounded-lg border border-suite-border bg-suite-soft px-4 py-3 text-sm hover:border-blue-200 hover:bg-blue-50 dark:hover:border-blue-900 dark:hover:bg-blue-950/40 transition-colors"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-suite-ink">{revision.title}</div>
                    <div className="mt-1 text-xs text-suite-muted font-mono">
                      #{revision.id} • {revision.branch_name}
                    </div>
                  </div>
                  <TaskStatusBadge status={revision.status} />
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Descriptions Table */}
      {task.descriptions && task.descriptions.length > 0 && (
        <div className="rounded-xl border border-suite-border bg-suite-surface overflow-hidden">
          <div className="border-b border-suite-border bg-suite-soft px-4 py-3">
            <h3 className="text-sm font-semibold text-suite-ink">Deskripsi</h3>
          </div>
          <div className="divide-y divide-suite-border">
            {task.descriptions.map((desc, index) => (
              <div key={index} className="px-4 py-4">
                <h4 className="mb-2 text-xs font-semibold text-suite-faint uppercase tracking-wide">
                  {desc.title}
                </h4>
                <div
                  className="prose prose-sm dark:prose-invert max-w-none"
                  dangerouslySetInnerHTML={{
                    __html: sanitizeHtml(desc.content),
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Deploy Notes */}
      {task.deploy_notes && (
        <div className="rounded-xl border border-suite-border bg-suite-surface p-5">
          <h3 className="mb-3 text-sm font-semibold text-suite-ink">
            Catatan Deploy
          </h3>
          <div
            className="prose prose-sm sm:prose-base dark:prose-invert max-w-none"
            dangerouslySetInnerHTML={{
              __html: sanitizeHtml(task.deploy_notes),
            }}
          />
        </div>
      )}

      {/* Metadata */}
      <div className="rounded-xl border border-suite-border bg-suite-surface p-4">
        <div className="grid gap-2 text-xs text-suite-faint sm:grid-cols-2">
          <div>
            <span className="font-semibold">Dibuat:</span>{' '}
            {formatDate(task.created_at)}
          </div>
          <div className="text-right">
            <span className="font-semibold">Diupdate:</span>{' '}
            {formatDate(task.updated_at)}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-[rgba(15,23,42,0.4)]"
            onClick={() => setShowDeleteConfirm(false)}
          />
          <div className="relative z-10 w-full max-w-md rounded-xl bg-suite-surface p-6 shadow-xl">
            <h3 className="text-lg font-bold text-suite-ink">
              Hapus Task?
            </h3>
            <p className="mt-2 text-sm text-suite-muted">
              Tindakan ini tidak dapat dibatalkan. Task "{task.title}" akan
              dihapus secara permanen.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deleting}
                className="rounded-xl border border-suite-border bg-suite-surface px-4 py-2 text-sm font-semibold text-suite-ink hover:bg-suite-soft disabled:opacity-50"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="rounded-xl bg-rose-600 px-4 py-2 text-sm font-bold text-white hover:bg-rose-700 disabled:opacity-50"
              >
                {deleting ? 'Menghapus...' : 'Hapus'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* History Modal */}
      <TaskHistoryModal
        isOpen={showHistoryModal}
        onClose={() => setShowHistoryModal(false)}
        historyItems={historyItems}
        loading={loadingHistory}
      />

      {/* Status Update Modal */}
      <TaskStatusUpdateModal
        isOpen={showStatusUpdateModal}
        onClose={() => setShowStatusUpdateModal(false)}
        onConfirm={handleStatusChange}
        currentStatus={task.status}
        loading={updatingStatus}
      />
    </div>
  );
}
