import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Edit, Trash2 } from 'react-feather';
import DOMPurify from 'dompurify';
import { taskBoardApi } from '../api/taskBoardApi';
import { TaskTypeBadge } from '../components/TaskTypeBadge';
import { TaskStatusBadge } from '../components/TaskStatusBadge';
import { LinkChip } from '../components/LinkChip';
import type { Task, TaskStatus } from '../types';
import { taskBoardPaths } from '@/shared/routes';

const STATUS_OPTIONS: { value: TaskStatus; label: string }[] = [
  { value: 'To-Do', label: 'To-Do' },
  { value: 'In Progress', label: 'In Progress' },
  { value: 'Merged', label: 'Merged' },
  { value: 'Done', label: 'Done' },
];

export function TaskDetailPage() {
  const navigate = useNavigate();
  const { taskId } = useParams<{ taskId: string }>();
  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const loadTask = async () => {
    if (!taskId) return;
    setLoading(true);
    try {
      const data = await taskBoardApi.get(taskId);
      setTask(data);
    } catch (error) {
      console.error('Failed to load task:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTask();
  }, [taskId]);

  const handleStatusChange = async (newStatus: TaskStatus) => {
    if (!task || !taskId) return;
    setUpdatingStatus(true);
    try {
      const updated = await taskBoardApi.update(taskId, { status: newStatus });
      if (updated) {
        setTask(updated);
      }
    } catch (error) {
      console.error('Failed to update status:', error);
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleDelete = async () => {
    if (!taskId) return;
    setDeleting(true);
    try {
      await taskBoardApi.delete(taskId);
      navigate(taskBoardPaths.home);
    } catch (error) {
      console.error('Failed to delete task:', error);
      setDeleting(false);
    }
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
        <p className="text-sm font-semibold text-suite-ink">Task tidak ditemukan</p>
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
    <div>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate(taskBoardPaths.home)}
            className="rounded-xl p-2 text-suite-muted hover:bg-suite-soft"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-suite-ink">
              {task.title}
            </h1>
            <p className="mt-1 text-sm text-suite-muted font-mono">
              {task.branch_name}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to={taskBoardPaths.edit(task.id)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-suite-border bg-suite-surface px-3 py-2 text-sm font-semibold text-suite-ink hover:bg-suite-soft"
          >
            <Edit size={16} />
            Edit
          </Link>
          <button
            type="button"
            onClick={() => setShowDeleteConfirm(true)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-100 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300 dark:hover:bg-rose-950/60"
          >
            <Trash2 size={16} />
            Hapus
          </button>
        </div>
      </div>

      {/* Badges */}
      <div className="mb-6 flex flex-wrap items-center gap-2">
        <TaskTypeBadge type={task.type} />
        <TaskStatusBadge status={task.status} />
      </div>

      {/* Quick Status Change */}
      <div className="mb-6 rounded-xl border border-suite-border bg-suite-surface p-4">
        <label className="mb-2 block text-xs font-semibold text-suite-faint">
          Ubah Status
        </label>
        <div className="flex flex-wrap gap-2">
          {STATUS_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => handleStatusChange(option.value)}
              disabled={updatingStatus || task.status === option.value}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                task.status === option.value
                  ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                  : 'bg-suite-soft text-suite-muted hover:bg-suite-soft hover:text-suite-ink'
              } disabled:opacity-50`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Links */}
      {task.links.length > 0 && (
        <div className="mb-6 rounded-xl border border-suite-border bg-suite-surface p-4">
          <h3 className="mb-3 text-sm font-semibold text-suite-ink">Links</h3>
          <div className="flex flex-wrap gap-2">
            {task.links.map((link, index) => (
              <LinkChip key={index} link={link} />
            ))}
          </div>
        </div>
      )}

      {/* Description */}
      {task.description && (
        <div className="mb-6 rounded-xl border border-suite-border bg-suite-surface p-5">
          <h3 className="mb-3 text-sm font-semibold text-suite-ink">
            Deskripsi
          </h3>
          <div
            className="prose prose-sm sm:prose-base dark:prose-invert max-w-none"
            dangerouslySetInnerHTML={{
              __html: sanitizeHtml(task.description),
            }}
          />
        </div>
      )}

      {/* Deploy Notes */}
      {task.deploy_notes && (
        <div className="mb-6 rounded-xl border border-suite-border bg-suite-surface p-5">
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
          <div>
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
    </div>
  );
}
