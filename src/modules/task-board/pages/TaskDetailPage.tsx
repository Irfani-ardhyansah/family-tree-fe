import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Briefcase,
  Check,
  ChevronDown,
  Clock,
  Database,
  Edit,
  GitBranch,
  GitMerge,
  Info,
  Link as LinkIcon,
  Menu,
  Plus,
  RefreshCw,
  Trash2,
} from 'react-feather';
import { taskBoardApi } from '../api/taskBoardApi';
import { TaskTypeBadge } from '../components/TaskTypeBadge';
import { TaskStatusBadge } from '../components/TaskStatusBadge';
import { LinkChip } from '../components/LinkChip';
import { TaskHistoryModal } from '../components/TaskHistoryModal';
import { TaskStatusUpdateModal } from '../components/TaskStatusUpdateModal';
import { TaskDescriptionEditModal } from '../components/TaskDescriptionEditModal';
import { TaskDeployNotesEditModal } from '../components/TaskDeployNotesEditModal';
import { TaskLinkEditModal } from '../components/TaskLinkEditModal';
import { TaskMigrationFilesEditModal } from '../components/TaskMigrationFilesEditModal';
import { TaskTodoEditModal } from '../components/TaskTodoEditModal';
import { TaskTextPreview } from '../components/TaskTextPreview';
import { TaskContentViewModal } from '../components/TaskContentViewModal';
import type {
  LinkType,
  Task,
  TaskDescription,
  TaskHistoryEntry,
  TaskStatus,
  TaskTodo,
} from '../types';
import {
  RICH_TEXT_CLASS,
  formatTaskDate,
  formatTaskDateTime,
  htmlToPlainText,
  sanitizeTaskHtml,
} from '../lib/taskMeta';
import { resolveTaskWorkplaceId } from '../lib/workplaceMeta';
import { useWorkplaces } from '../lib/workplaceStore';
import {
  descriptionOrderKey,
  readKeyOrder,
  sortByOrder,
  todoOrderKey,
  writeKeyOrder,
} from '../lib/taskOrder';
import {
  dropIndicatorClass,
  useReorderableList,
} from '../lib/useReorderableList';
import { taskBoardPaths } from '@/shared/routes';
import {
  Card,
  ErrorState,
  LoadingState,
  ModalShell,
  SecondaryButton,
  cx,
} from '@/shared/ui';

const EDIT_BUTTON_CLASS =
  'inline-flex items-center gap-1.5 rounded-control border border-suite-border bg-suite-surface px-2.5 py-1.5 text-[12px] font-bold text-suite-muted transition-colors hover:bg-suite-soft hover:text-suite-ink';

const ADD_BUTTON_CLASS =
  'inline-flex items-center gap-1.5 rounded-control border border-suite-border bg-suite-surface px-2.5 py-1.5 text-[12px] font-bold text-suite-muted transition-colors hover:bg-suite-soft hover:text-suite-ink';

const ICON_BUTTON_CLASS =
  'rounded-control p-2 text-suite-faint transition-colors hover:bg-suite-soft hover:text-suite-ink';

const ICON_BUTTON_DANGER_CLASS =
  'rounded-control p-2 text-suite-faint transition-colors hover:bg-rose-500/10 hover:text-rose-600 dark:hover:text-rose-300';

const PAGINATION_BUTTON_CLASS =
  'rounded-control border border-suite-border bg-suite-surface px-3 py-1.5 text-[12px] font-bold text-suite-muted transition-colors hover:bg-suite-soft hover:text-suite-ink disabled:cursor-not-allowed disabled:opacity-40';

function descriptionKeyOf(desc: TaskDescription, index: number): string {
  return desc.id != null ? `id-${desc.id}` : `idx-${index}`;
}

function todoKeyOf(todo: TaskTodo): string {
  return `id-${todo.id}`;
}

/** Field array/relasi dari BE bisa null — samakan jadi array kosong/null. */
function withDefaults(data: Task): Task {
  const descriptions = data.descriptions ?? [];
  const todos = data.todos ?? [];
  return {
    ...data,
    // Terapkan urutan lokal (hasil drag) supaya tampil konsisten walau BE
    // belum menyimpan `sort_order`.
    descriptions: sortByOrder(
      descriptions,
      descriptionKeyOf,
      readKeyOrder(descriptionOrderKey(data.id)),
    ),
    migration_files: data.migration_files ?? [],
    parent_task_id: data.parent_task_id ?? null,
    parent_task: data.parent_task ?? null,
    revisions: data.revisions ?? [],
    history: data.history ?? [],
    todos: sortByOrder(
      todos,
      (todo) => todoKeyOf(todo),
      readKeyOrder(todoOrderKey(data.id)),
    ),
  };
}

/** Jumlah deskripsi per halaman di halaman detail. */
const DESCRIPTIONS_PER_PAGE = 5;

function errorMessageOf(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

function descriptionStamp(
  desc: TaskDescription,
  fallback: string,
): { label: string; stamp: string } {
  const updated = desc.updated_at;
  const created = desc.created_at;
  const isEdited =
    Boolean(updated && created) &&
    new Date(updated as string).getTime() !== new Date(created as string).getTime();
  return {
    label: isEdited ? 'Diperbarui' : 'Dibuat',
    stamp: updated ?? created ?? fallback,
  };
}

type DescModalState = { mode: 'add' | 'edit'; index: number | null };
type LinkModalState = { mode: 'add' | 'edit'; index: number };
type TodoModalState = { mode: 'add' | 'edit'; id: number | null };
type ViewContentState = {
  title: string;
  subtitle?: string;
  html: string;
  source: { type: 'desc'; index: number } | { type: 'todo'; id: number };
};

export function TaskDetailPage() {
  const navigate = useNavigate();
  const { taskId } = useParams<{ taskId: string }>();
  const workplaces = useWorkplaces();
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

  const [deployOpen, setDeployOpen] = useState(false);
  const [descModal, setDescModal] = useState<DescModalState | null>(null);
  const [deployModalOpen, setDeployModalOpen] = useState(false);
  const [linkModal, setLinkModal] = useState<LinkModalState | null>(null);
  const [migrationModalOpen, setMigrationModalOpen] = useState(false);
  const [todoModal, setTodoModal] = useState<TodoModalState | null>(null);
  const [viewContent, setViewContent] = useState<ViewContentState | null>(null);
  const [togglingTodoId, setTogglingTodoId] = useState<number | null>(null);
  const [savingSection, setSavingSection] = useState(false);
  const [descPage, setDescPage] = useState(1);

  const handleDescriptionReorder = useCallback(
    (next: TaskDescription[]) => {
      setTask((prev) => (prev ? { ...prev, descriptions: next } : prev));
      if (!taskId) return;
      writeKeyOrder(
        descriptionOrderKey(taskId),
        next.map((desc, index) => descriptionKeyOf(desc, index)),
      );
      const ids = next
        .map((desc) => desc.id)
        .filter((id): id is number => id != null);
      // Kirim ke BE hanya kalau semua entri punya id (endpoint reorder butuh id).
      if (ids.length === next.length && ids.length > 0) {
        void taskBoardApi
          .reorderDescriptions(taskId, ids)
          .catch(() => undefined);
      }
    },
    [taskId],
  );

  const handleTodoReorder = useCallback(
    (next: TaskTodo[]) => {
      setTask((prev) => (prev ? { ...prev, todos: next } : prev));
      if (!taskId) return;
      writeKeyOrder(
        todoOrderKey(taskId),
        next.map((todo) => todoKeyOf(todo)),
      );
      void taskBoardApi
        .reorderTodos(
          taskId,
          next.map((todo) => todo.id),
        )
        .catch(() => undefined);
    },
    [taskId],
  );

  const descriptionsReorder = useReorderableList<TaskDescription>({
    items: task?.descriptions ?? [],
    keyOf: descriptionKeyOf,
    onReorder: handleDescriptionReorder,
  });

  const todosReorder = useReorderableList<TaskTodo>({
    items: task?.todos ?? [],
    keyOf: (todo) => todoKeyOf(todo),
    onReorder: handleTodoReorder,
  });

  const loadTask = async () => {
    if (!taskId) return;
    setLoading(true);
    setErrorMessage(null);
    try {
      const data = await taskBoardApi.get(taskId);
      const loaded = withDefaults(data);
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
      setHistoryItems((current) =>
        current.length > 0 ? current : task?.history ?? [],
      );
      setErrorMessage(errorMessageOf(error, 'Gagal memuat riwayat task.'));
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    loadTask();
  }, [taskId]);

  const applyUpdated = (updated: Task) => {
    const refreshed = withDefaults(updated);
    setTask(refreshed);
    setHistoryItems(refreshed.history ?? []);
  };

  const runSectionSave = async (
    action: () => Promise<Task>,
    onSuccess: () => void,
    fallbackError: string,
  ) => {
    setSavingSection(true);
    setErrorMessage(null);
    try {
      const updated = await action();
      applyUpdated(updated);
      onSuccess();
    } catch (error) {
      setErrorMessage(errorMessageOf(error, fallbackError));
    } finally {
      setSavingSection(false);
    }
  };

  const handleStatusChange = async (newStatus: TaskStatus, notes?: string) => {
    if (!task || !taskId) return;
    setUpdatingStatus(true);
    setErrorMessage(null);
    try {
      const updated = await taskBoardApi.update(taskId, { status: newStatus, notes });
      applyUpdated(updated);
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

  const saveDescription = (title: string, content: string) => {
    if (!taskId || !task || !descModal) return;
    void runSectionSave(
      () => {
        const base = task.descriptions.map((d) => ({
          id: d.id,
          title: d.title,
          content: d.content,
        }));
        const descriptions =
          descModal.mode === 'add'
            ? [...base, { title, content }]
            : base.map((d, i) =>
                i === descModal.index ? { id: d.id, title, content } : d,
              );
        return taskBoardApi.update(taskId, { descriptions });
      },
      () => setDescModal(null),
      'Gagal menyimpan deskripsi.',
    );
  };

  const deleteDescription = (index: number) => {
    if (!taskId || !task) return;
    const target = task.descriptions[index];
    if (!target) return;
    if (task.descriptions.length <= 1) return;
    if (!window.confirm(`Hapus penjelasan "${target.title}"?`)) return;
    void runSectionSave(
      () => {
        const descriptions = task.descriptions
          .filter((_, i) => i !== index)
          .map((d) => ({ id: d.id, title: d.title, content: d.content }));
        return taskBoardApi.update(taskId, { descriptions });
      },
      () => undefined,
      'Gagal menghapus penjelasan.',
    );
  };

  const saveDeployNotes = (content: string) => {
    if (!taskId) return;
    void runSectionSave(
      () => taskBoardApi.update(taskId, { deployNotes: content }),
      () => {
        setDeployModalOpen(false);
        setDeployOpen(true);
      },
      'Gagal menyimpan catatan deploy.',
    );
  };

  const saveLink = (type: LinkType, url: string) => {
    if (!taskId || !task || !linkModal) return;
    void runSectionSave(
      () => {
        const base = task.links.map((l) => ({ type: l.type, url: l.url }));
        const links =
          linkModal.mode === 'add'
            ? [...base, { type, url }]
            : base.map((l, i) => (i === linkModal.index ? { type, url } : l));
        return taskBoardApi.update(taskId, { links });
      },
      () => setLinkModal(null),
      'Gagal menyimpan link.',
    );
  };

  const deleteLink = (index: number) => {
    if (!taskId || !task) return;
    void runSectionSave(
      () => {
        const links = task.links
          .filter((_, i) => i !== index)
          .map((l) => ({ type: l.type, url: l.url }));
        return taskBoardApi.update(taskId, { links });
      },
      () => undefined,
      'Gagal menghapus link.',
    );
  };

  const saveMigrationFiles = (files: string[]) => {
    if (!taskId) return;
    void runSectionSave(
      () => taskBoardApi.update(taskId, { migrationFiles: files }),
      () => setMigrationModalOpen(false),
      'Gagal menyimpan file migrasi.',
    );
  };

  const setTodos = (updater: (todos: TaskTodo[]) => TaskTodo[]) => {
    setTask((prev) =>
      prev ? { ...prev, todos: updater(prev.todos ?? []) } : prev,
    );
  };

  const runTodoAction = async (
    action: () => Promise<void>,
    onSuccess: () => void,
    fallbackError: string,
  ) => {
    setSavingSection(true);
    setErrorMessage(null);
    try {
      await action();
      onSuccess();
    } catch (error) {
      setErrorMessage(errorMessageOf(error, fallbackError));
    } finally {
      setSavingSection(false);
    }
  };

  const saveTodo = (title: string, description: string) => {
    if (!taskId || !todoModal) return;
    void runTodoAction(
      async () => {
        if (todoModal.mode === 'add') {
          const created = await taskBoardApi.createTodo(taskId, {
            title,
            description,
          });
          setTodos((list) => [...list, created]);
        } else if (todoModal.id != null) {
          const updated = await taskBoardApi.updateTodo(taskId, todoModal.id, {
            title,
            description,
          });
          setTodos((list) =>
            list.map((t) => (t.id === updated.id ? updated : t)),
          );
        }
      },
      () => setTodoModal(null),
      'Gagal menyimpan todo.',
    );
  };

  const deleteTodo = (todoId: number) => {
    if (!taskId) return;
    void runTodoAction(
      async () => {
        await taskBoardApi.deleteTodo(taskId, todoId);
        setTodos((list) => list.filter((t) => t.id !== todoId));
      },
      () => undefined,
      'Gagal menghapus todo.',
    );
  };

  const toggleTodo = async (todo: TaskTodo) => {
    if (!taskId) return;
    setTogglingTodoId(todo.id);
    setErrorMessage(null);
    try {
      const updated = await taskBoardApi.updateTodo(taskId, todo.id, {
        is_done: !todo.is_done,
      });
      setTodos((list) =>
        list.map((t) => (t.id === updated.id ? updated : t)),
      );
    } catch (error) {
      setErrorMessage(errorMessageOf(error, 'Gagal mengubah status todo.'));
    } finally {
      setTogglingTodoId(null);
    }
  };

  if (loading) {
    return <LoadingState label="Memuat task…" />;
  }

  if (!task) {
    return (
      <div>
        <ErrorState
          message={errorMessage ?? 'Task tidak ditemukan.'}
          onRetry={loadTask}
        />
        <div className="mt-4 text-center">
          <Link
            to={taskBoardPaths.home}
            className="text-[13px] font-semibold text-amber-600 hover:text-amber-700 dark:text-amber-400"
          >
            ← Kembali ke daftar task
          </Link>
        </div>
      </div>
    );
  }

  const editingDesc =
    descModal && descModal.mode === 'edit' && descModal.index != null
      ? task.descriptions[descModal.index]
      : null;
  const editingLink =
    linkModal && linkModal.mode === 'edit' ? task.links[linkModal.index] : null;

  const todos = task.todos ?? [];
  const editingTodo =
    todoModal && todoModal.mode === 'edit' && todoModal.id != null
      ? todos.find((t) => t.id === todoModal.id) ?? null
      : null;

  const totalDescPages = Math.max(
    1,
    Math.ceil(task.descriptions.length / DESCRIPTIONS_PER_PAGE),
  );
  const currentDescPage = Math.min(descPage, totalDescPages);
  const pagedDescriptions = task.descriptions.slice(
    (currentDescPage - 1) * DESCRIPTIONS_PER_PAGE,
    currentDescPage * DESCRIPTIONS_PER_PAGE,
  );
  const doneTodoCount = todos.filter((t) => t.is_done).length;

  const workplaceId = resolveTaskWorkplaceId(task);
  const workplace = workplaces.find((item) => item.id === workplaceId);
  const workplaceBack = workplace
    ? taskBoardPaths.workplace(workplace.id)
    : taskBoardPaths.home;

  return (
    <div className="space-y-5">
      {errorMessage ? (
        <div className="flex items-start justify-between gap-3 rounded-card border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-[13px] font-semibold text-rose-700 dark:text-rose-300">
          <span>{errorMessage}</span>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            className="shrink-0 text-rose-500 hover:text-rose-700"
            aria-label="Tutup pesan error"
          >
            ✕
          </button>
        </div>
      ) : null}

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <button
            type="button"
            onClick={() => navigate(workplaceBack)}
            className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-control text-suite-muted transition-colors hover:bg-suite-soft hover:text-suite-ink"
            aria-label="Kembali ke daftar task"
          >
            <ArrowLeft size={18} />
          </button>
          <div className="min-w-0">
            <h1 className="text-[22px] font-bold leading-tight tracking-tight text-suite-ink">
              {task.title}
            </h1>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <TaskTypeBadge type={task.type} withIcon />
              <TaskStatusBadge status={task.status} withIcon />
              {workplace ? (
                <Link
                  to={workplaceBack}
                  className="inline-flex items-center gap-1.5 rounded-full bg-suite-soft px-2.5 py-1 text-[11px] font-bold text-suite-muted transition-colors hover:bg-suite-border hover:text-suite-ink"
                >
                  <Briefcase size={11} />
                  {workplace.name}
                </Link>
              ) : null}
              <span className="font-money-mono text-[11px] text-suite-faint">
                #{task.id}
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => void openHistory()}
            className="inline-flex items-center gap-1.5 rounded-control border border-suite-border bg-suite-surface px-3 py-2 text-[13px] font-semibold text-suite-muted transition-colors hover:bg-suite-soft hover:text-suite-ink"
          >
            <Clock size={15} />
            Riwayat
          </button>
          <Link
            to={taskBoardPaths.edit(task.id)}
            className="inline-flex items-center gap-1.5 rounded-control border border-suite-border bg-suite-surface px-3 py-2 text-[13px] font-semibold text-suite-muted transition-colors hover:bg-suite-soft hover:text-suite-ink"
          >
            <Edit size={15} />
            Edit
          </Link>
          <button
            type="button"
            onClick={() => setShowDeleteConfirm(true)}
            className="inline-flex items-center gap-1.5 rounded-control border border-transparent px-3 py-2 text-[13px] font-semibold text-rose-600 transition-colors hover:bg-rose-500/10 dark:text-rose-400"
          >
            <Trash2 size={15} />
            Hapus
          </button>
          {task.status === 'Merged' ? (
            <Link
              to={taskBoardPaths.new}
              state={{ parentTaskId: task.id, workplaceId }}
              className="inline-flex items-center gap-1.5 rounded-control border border-sky-500/30 bg-sky-500/10 px-3 py-2 text-[13px] font-bold text-sky-700 transition-colors hover:bg-sky-500/20 dark:text-sky-300"
            >
              <GitBranch size={15} />
              Buat Revisi
            </Link>
          ) : null}
          <button
            type="button"
            onClick={() => setShowStatusUpdateModal(true)}
            className="inline-flex items-center gap-1.5 rounded-control bg-amber-500 px-3.5 py-2 text-[13px] font-bold text-white transition-colors hover:bg-amber-600"
          >
            <RefreshCw size={15} />
            Update Status
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* Main */}
        <div className="space-y-5 lg:col-span-2">
          {/* Catatan Deploy — collapsible, default tersembunyi */}
          <Card className="overflow-hidden">
            <div className="flex items-center justify-between gap-2 px-5 py-3">
              <button
                type="button"
                onClick={() => setDeployOpen((open) => !open)}
                className="flex min-w-0 flex-1 items-center gap-2 text-left"
                aria-expanded={deployOpen}
              >
                <GitMerge size={15} className="shrink-0 text-suite-muted" />
                <span className="text-[13.5px] font-bold text-suite-ink">
                  Catatan Deploy
                </span>
                <ChevronDown
                  size={16}
                  className={cx(
                    'shrink-0 text-suite-faint transition-transform',
                    deployOpen && 'rotate-180',
                  )}
                />
              </button>
              <button
                type="button"
                onClick={() => setDeployModalOpen(true)}
                className={EDIT_BUTTON_CLASS}
              >
                <Edit size={13} />
                {task.deploy_notes ? 'Edit' : 'Tambah'}
              </button>
            </div>
            {deployOpen ? (
              <div className="border-t border-suite-border px-5 py-4">
                {task.deploy_notes ? (
                  <div
                    className={RICH_TEXT_CLASS}
                    dangerouslySetInnerHTML={{
                      __html: sanitizeTaskHtml(task.deploy_notes),
                    }}
                  />
                ) : (
                  <p className="text-[13px] text-suite-faint">
                    Belum ada catatan deploy.
                  </p>
                )}
              </div>
            ) : null}
          </Card>

          {/* Penjelasan (deskripsi task) */}
          <Card className="overflow-hidden">
            <div className="flex items-center justify-between gap-2 border-b border-suite-border bg-suite-soft/60 px-5 py-3">
              <div className="flex items-center gap-2">
                <h2 className="text-[13.5px] font-bold text-suite-ink">
                  Penjelasan Task
                </h2>
                {task.descriptions.length > 1 ? (
                  <span className="hidden text-[11px] text-suite-faint sm:inline">
                    Tarik ikon untuk ubah urutan
                  </span>
                ) : null}
              </div>
              <button
                type="button"
                onClick={() => setDescModal({ mode: 'add', index: null })}
                className={ADD_BUTTON_CLASS}
              >
                <Plus size={13} />
                Tambah
              </button>
            </div>
            {task.descriptions.length === 0 ? (
              <div className="px-5 py-8 text-center text-[13px] text-suite-faint">
                Belum ada penjelasan. Tambah penjelasan pertama.
              </div>
            ) : (
              <>
                <div
                  {...descriptionsReorder.containerProps}
                  className="divide-y divide-suite-border"
                >
                  {pagedDescriptions.map((desc, localIndex) => {
                    const index =
                      (currentDescPage - 1) * DESCRIPTIONS_PER_PAGE + localIndex;
                    const { label, stamp } = descriptionStamp(
                      desc,
                      task.updated_at,
                    );
                    const descKey = descriptionKeyOf(desc, index);
                    return (
                      <div
                        key={desc.id ?? index}
                        data-sort-key={descKey}
                        className={cx(
                          'flex items-start gap-2 px-4 py-4 sm:px-5',
                          descriptionsReorder.draggingKey === descKey &&
                            'opacity-50',
                          dropIndicatorClass(
                            descriptionsReorder.dragOver,
                            descKey,
                            descriptionsReorder.draggingKey,
                          ),
                        )}
                      >
                        <span
                          {...descriptionsReorder.getHandleProps(descKey)}
                          role="button"
                          tabIndex={0}
                          aria-label="Geser untuk mengubah urutan penjelasan"
                          title="Tarik untuk mengubah urutan"
                          className="mt-0.5 inline-flex h-8 w-6 shrink-0 cursor-grab items-center justify-center rounded-control text-suite-faint outline-none transition-colors hover:bg-suite-soft hover:text-suite-ink focus-visible:ring-2 focus-visible:ring-amber-500 active:cursor-grabbing"
                        >
                          <Menu size={14} />
                        </span>
                        <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="min-w-0">
                            <h3 className="text-[13.5px] font-bold text-suite-ink">
                              {desc.title}
                            </h3>
                            <p className="mt-0.5 text-[11px] text-suite-faint">
                              {label} · {formatTaskDateTime(stamp)}
                            </p>
                          </div>
                          <div className="flex shrink-0 items-center gap-0.5">
                            <button
                              type="button"
                              onClick={() =>
                                setViewContent({
                                  title: desc.title,
                                  subtitle: `${label} · ${formatTaskDateTime(stamp)}`,
                                  html: desc.content,
                                  source: { type: 'desc', index },
                                })
                              }
                              className={ICON_BUTTON_CLASS}
                              aria-label="Lihat detail penjelasan"
                              title="Lihat detail"
                            >
                              <Info size={15} />
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                setDescModal({ mode: 'edit', index })
                              }
                              className={ICON_BUTTON_CLASS}
                              aria-label="Edit penjelasan"
                              title="Edit"
                            >
                              <Edit size={14} />
                            </button>
                            <button
                              type="button"
                              onClick={() => deleteDescription(index)}
                              disabled={task.descriptions.length <= 1}
                              className={cx(
                                ICON_BUTTON_DANGER_CLASS,
                                'disabled:cursor-not-allowed disabled:opacity-40',
                              )}
                              aria-label="Hapus penjelasan"
                              title={
                                task.descriptions.length <= 1
                                  ? 'Minimal satu penjelasan'
                                  : 'Hapus'
                              }
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                        <div className="mt-3">
                          <TaskTextPreview
                            html={desc.content}
                            lines={3}
                            emptyLabel="Tidak ada isi."
                          />
                        </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                {totalDescPages > 1 ? (
                  <div className="flex flex-wrap items-center justify-between gap-2 border-t border-suite-border px-5 py-3">
                    <span className="text-[11.5px] text-suite-faint">
                      Halaman {currentDescPage} dari {totalDescPages} ·{' '}
                      {task.descriptions.length} penjelasan
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setDescPage(currentDescPage - 1)}
                        disabled={currentDescPage <= 1}
                        className={PAGINATION_BUTTON_CLASS}
                      >
                        Sebelumnya
                      </button>
                      <button
                        type="button"
                        onClick={() => setDescPage(currentDescPage + 1)}
                        disabled={currentDescPage >= totalDescPages}
                        className={PAGINATION_BUTTON_CLASS}
                      >
                        Berikutnya
                      </button>
                    </div>
                  </div>
                ) : null}
              </>
            )}
          </Card>

          {/* Todo */}
          <Card className="overflow-hidden">
            <div className="flex items-center justify-between gap-2 border-b border-suite-border bg-suite-soft/60 px-5 py-3">
              <div className="flex items-center gap-2">
                <h2 className="text-[13.5px] font-bold text-suite-ink">Todo</h2>
                {todos.length > 0 ? (
                  <span className="rounded-full bg-suite-soft px-2 py-0.5 text-[11px] font-bold text-suite-muted">
                    {doneTodoCount}/{todos.length} selesai
                  </span>
                ) : null}
                {todos.length > 1 ? (
                  <span className="hidden text-[11px] text-suite-faint sm:inline">
                    Tarik ikon untuk ubah urutan
                  </span>
                ) : null}
              </div>
              <button
                type="button"
                onClick={() => setTodoModal({ mode: 'add', id: null })}
                className={ADD_BUTTON_CLASS}
              >
                <Plus size={13} />
                Tambah Todo
              </button>
            </div>
            {todos.length === 0 ? (
              <div className="px-5 py-8 text-center text-[13px] text-suite-faint">
                Belum ada todo. Tambah checklist pertama.
              </div>
            ) : (
              <div {...todosReorder.containerProps}>
              <ul className="divide-y divide-suite-border">
                {todos.map((todo) => (
                  <li
                    key={todo.id}
                    data-sort-key={todoKeyOf(todo)}
                    className={cx(
                      'flex items-start gap-2 px-4 py-3.5 sm:px-5',
                      todosReorder.draggingKey === todoKeyOf(todo) &&
                        'opacity-50',
                      dropIndicatorClass(
                        todosReorder.dragOver,
                        todoKeyOf(todo),
                        todosReorder.draggingKey,
                      ),
                    )}
                  >
                    <span
                      {...todosReorder.getHandleProps(todoKeyOf(todo))}
                      role="button"
                      tabIndex={0}
                      aria-label="Geser untuk mengubah urutan todo"
                      title="Tarik untuk mengubah urutan"
                      className="mt-0.5 inline-flex h-6 w-5 shrink-0 cursor-grab items-center justify-center rounded-control text-suite-faint outline-none transition-colors hover:bg-suite-soft hover:text-suite-ink focus-visible:ring-2 focus-visible:ring-amber-500 active:cursor-grabbing"
                    >
                      <Menu size={13} />
                    </span>
                    <button
                      type="button"
                      onClick={() => void toggleTodo(todo)}
                      disabled={togglingTodoId === todo.id}
                      className={cx(
                        'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-colors disabled:opacity-60',
                        todo.is_done
                          ? 'border-emerald-500 bg-emerald-500 text-white'
                          : 'border-suite-border bg-suite-surface text-transparent hover:border-emerald-400',
                      )}
                      aria-label={
                        todo.is_done ? 'Tandai belum selesai' : 'Tandai selesai'
                      }
                      aria-pressed={todo.is_done}
                    >
                      <Check size={13} />
                    </button>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <span
                          className={cx(
                            'text-[13.5px] font-bold',
                            todo.is_done
                              ? 'text-suite-faint line-through'
                              : 'text-suite-ink',
                          )}
                        >
                          {todo.title}
                        </span>
                        <div className="flex shrink-0 items-center gap-0.5">
                          {htmlToPlainText(todo.description) ? (
                            <button
                              type="button"
                              onClick={() =>
                                setViewContent({
                                  title: todo.title,
                                  subtitle: todo.is_done
                                    ? 'Selesai'
                                    : 'Belum selesai',
                                  html: todo.description,
                                  source: { type: 'todo', id: todo.id },
                                })
                              }
                              className={ICON_BUTTON_CLASS}
                              aria-label="Lihat detail todo"
                              title="Lihat detail"
                            >
                              <Info size={15} />
                            </button>
                          ) : null}
                          <button
                            type="button"
                            onClick={() =>
                              setTodoModal({ mode: 'edit', id: todo.id })
                            }
                            className={ICON_BUTTON_CLASS}
                            aria-label="Edit todo"
                            title="Edit"
                          >
                            <Edit size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteTodo(todo.id)}
                            disabled={savingSection}
                            className={ICON_BUTTON_DANGER_CLASS}
                            aria-label="Hapus todo"
                            title="Hapus"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                      {htmlToPlainText(todo.description) ? (
                        <div className="mt-1.5">
                          <TaskTextPreview html={todo.description} lines={2} />
                        </div>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ul>
              </div>
            )}
          </Card>
        </div>

        {/* Aside */}
        <div className="space-y-5">
          <Card className="overflow-hidden">
            <div className="border-b border-suite-border bg-suite-soft/60 px-5 py-3">
              <h2 className="text-[13.5px] font-bold text-suite-ink">Detail</h2>
            </div>
            <div className="divide-y divide-suite-border">
              <DetailRow icon={<GitBranch size={14} />} label="Branch">
                <span className="font-money-mono text-[12px] text-suite-ink">
                  {task.branch_name}
                </span>
              </DetailRow>
              {workplace ? (
                <DetailRow icon={<Briefcase size={14} />} label="Tempat Kerja">
                  <Link
                    to={workplaceBack}
                    className="text-[12.5px] font-semibold text-suite-muted transition-colors hover:text-amber-600 dark:hover:text-amber-400"
                  >
                    {workplace.name}
                  </Link>
                </DetailRow>
              ) : null}
              <DetailRow label="Dibuat">
                <span className="text-[12.5px] text-suite-muted">
                  {formatTaskDateTime(task.created_at)}
                </span>
              </DetailRow>
              <DetailRow label="Diperbarui">
                <span className="text-[12.5px] text-suite-muted">
                  {formatTaskDateTime(task.updated_at)}
                </span>
              </DetailRow>
            </div>
          </Card>

          {/* Links */}
          <Card className="overflow-hidden">
            <div className="flex items-center justify-between gap-2 border-b border-suite-border bg-suite-soft/60 px-5 py-3">
              <div className="flex items-center gap-2">
                <LinkIcon size={14} className="text-suite-muted" />
                <h2 className="text-[13.5px] font-bold text-suite-ink">Links</h2>
              </div>
              <button
                type="button"
                onClick={() => setLinkModal({ mode: 'add', index: -1 })}
                className={ADD_BUTTON_CLASS}
              >
                <Plus size={13} />
                Tambah
              </button>
            </div>
            {task.links.length === 0 ? (
              <p className="px-5 py-4 text-[12.5px] text-suite-faint">
                Belum ada link.
              </p>
            ) : (
              <div className="space-y-2 px-5 py-4">
                {task.links.map((link, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between gap-2"
                  >
                    <div className="min-w-0">
                      <LinkChip link={link} />
                    </div>
                    <div className="flex shrink-0 items-center gap-0.5">
                      <button
                        type="button"
                        onClick={() => setLinkModal({ mode: 'edit', index })}
                        className={ICON_BUTTON_CLASS}
                        aria-label="Edit link"
                      >
                        <Edit size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteLink(index)}
                        disabled={savingSection}
                        className={ICON_BUTTON_DANGER_CLASS}
                        aria-label="Hapus link"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* File Migrasi — selalu tampil walau kosong */}
          <Card className="overflow-hidden">
            <div className="flex items-center justify-between gap-2 border-b border-suite-border bg-suite-soft/60 px-5 py-3">
              <div className="flex items-center gap-2">
                <Database size={14} className="text-suite-muted" />
                <h2 className="text-[13.5px] font-bold text-suite-ink">
                  File Migrasi
                </h2>
                {task.migration_files.length > 0 ? (
                  <span className="rounded-full bg-suite-soft px-2 py-0.5 text-[11px] font-bold text-suite-muted">
                    {task.migration_files.length}
                  </span>
                ) : null}
              </div>
              <button
                type="button"
                onClick={() => setMigrationModalOpen(true)}
                className={EDIT_BUTTON_CLASS}
              >
                <Edit size={13} />
                Edit
              </button>
            </div>
            {task.migration_files.length === 0 ? (
              <p className="px-5 py-4 text-[12.5px] text-suite-faint">
                Belum ada file migrasi.
              </p>
            ) : (
              <div className="space-y-1.5 px-5 py-4">
                {task.migration_files.map((file, index) => (
                  <div
                    key={index}
                    className="rounded-control bg-suite-soft px-3 py-1.5 font-money-mono text-[11.5px] text-suite-ink"
                  >
                    {file}
                  </div>
                ))}
              </div>
            )}
          </Card>

          {task.parent_task ? (
            <Card className="overflow-hidden">
              <div className="flex items-center gap-2 border-b border-sky-500/30 bg-sky-500/10 px-5 py-3">
                <RefreshCw size={14} className="text-sky-600 dark:text-sky-300" />
                <h2 className="text-[13.5px] font-bold text-sky-700 dark:text-sky-300">
                  Revisi dari
                </h2>
              </div>
              <div className="px-5 py-4">
                <Link
                  to={taskBoardPaths.detail(task.parent_task.id)}
                  className="block rounded-control border border-suite-border bg-suite-soft px-3.5 py-3 transition-colors hover:border-sky-400/60 hover:bg-suite-surface"
                >
                  <div className="text-[13px] font-bold text-suite-ink">
                    {task.parent_task.title}
                  </div>
                  <div className="mt-1 font-money-mono text-[11px] text-suite-faint">
                    #{task.parent_task.id} · {task.parent_task.branch_name}
                  </div>
                </Link>
              </div>
            </Card>
          ) : null}

          {task.revisions && task.revisions.length > 0 ? (
            <Card className="overflow-hidden">
              <div className="flex items-center gap-2 border-b border-suite-border bg-suite-soft/60 px-5 py-3">
                <RefreshCw size={14} className="text-suite-muted" />
                <h2 className="text-[13.5px] font-bold text-suite-ink">Revisi</h2>
                <span className="rounded-full bg-suite-soft px-2 py-0.5 text-[11px] font-bold text-suite-muted">
                  {task.revisions.length}
                </span>
              </div>
              <div className="space-y-2 px-5 py-4">
                {task.revisions.map((revision) => (
                  <Link
                    key={revision.id}
                    to={taskBoardPaths.detail(revision.id)}
                    className="block rounded-control border border-suite-border bg-suite-soft px-3.5 py-2.5 transition-colors hover:border-amber-400/60 hover:bg-suite-surface"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <div className="truncate text-[12.5px] font-semibold text-suite-ink">
                          {revision.title}
                        </div>
                        <div className="mt-0.5 flex flex-wrap items-center gap-x-2 font-money-mono text-[10.5px] text-suite-faint">
                          <span>#{revision.id}</span>
                          <span>·</span>
                          <span>{formatTaskDate(revision.updated_at)}</span>
                        </div>
                      </div>
                      <TaskStatusBadge status={revision.status} />
                    </div>
                  </Link>
                ))}
              </div>
            </Card>
          ) : null}
        </div>
      </div>

      {showDeleteConfirm ? (
        <ModalShell
          accent="task"
          title="Hapus Task?"
          onClose={() => setShowDeleteConfirm(false)}
          footer={
            <div className="flex justify-end gap-2">
              <div className="w-24">
                <SecondaryButton
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={deleting}
                >
                  Batal
                </SecondaryButton>
              </div>
              <div className="w-32">
                <button
                  type="button"
                  onClick={() => void handleDelete()}
                  disabled={deleting}
                  className="w-full rounded-control bg-rose-600 px-4 py-3 text-[13px] font-extrabold text-white transition-colors hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-45"
                >
                  {deleting ? 'Menghapus…' : 'Hapus'}
                </button>
              </div>
            </div>
          }
        >
          <p className="text-[13px] text-suite-muted">
            Tindakan ini tidak dapat dibatalkan. Task{' '}
            <span className="font-bold text-suite-ink">“{task.title}”</span> akan
            dihapus permanen beserta riwayatnya.
          </p>
        </ModalShell>
      ) : null}

      <TaskHistoryModal
        isOpen={showHistoryModal}
        onClose={() => setShowHistoryModal(false)}
        historyItems={historyItems}
        loading={loadingHistory}
      />

      <TaskStatusUpdateModal
        isOpen={showStatusUpdateModal}
        onClose={() => setShowStatusUpdateModal(false)}
        onConfirm={handleStatusChange}
        currentStatus={task.status}
        loading={updatingStatus}
      />

      {descModal ? (
        <TaskDescriptionEditModal
          isOpen
          taskId={taskId}
          mode={descModal.mode}
          initialTitle={editingDesc?.title ?? ''}
          initialContent={editingDesc?.content ?? ''}
          saving={savingSection}
          onClose={() => setDescModal(null)}
          onSave={saveDescription}
        />
      ) : null}

      {deployModalOpen ? (
        <TaskDeployNotesEditModal
          isOpen
          taskId={taskId}
          initialContent={task.deploy_notes ?? ''}
          saving={savingSection}
          onClose={() => setDeployModalOpen(false)}
          onSave={saveDeployNotes}
        />
      ) : null}

      {linkModal ? (
        <TaskLinkEditModal
          isOpen
          mode={linkModal.mode}
          initialType={editingLink?.type ?? 'discord'}
          initialUrl={editingLink?.url ?? ''}
          saving={savingSection}
          onClose={() => setLinkModal(null)}
          onSave={saveLink}
        />
      ) : null}

      {migrationModalOpen ? (
        <TaskMigrationFilesEditModal
          isOpen
          initialFiles={task.migration_files}
          saving={savingSection}
          onClose={() => setMigrationModalOpen(false)}
          onSave={saveMigrationFiles}
        />
      ) : null}

      {todoModal ? (
        <TaskTodoEditModal
          isOpen
          taskId={taskId}
          mode={todoModal.mode}
          initialTitle={editingTodo?.title ?? ''}
          initialDescription={editingTodo?.description ?? ''}
          saving={savingSection}
          onClose={() => setTodoModal(null)}
          onSave={saveTodo}
        />
      ) : null}

      {viewContent ? (
        <TaskContentViewModal
          isOpen
          title={viewContent.title}
          subtitle={viewContent.subtitle}
          contentHtml={viewContent.html}
          onClose={() => setViewContent(null)}
          onEdit={() => {
            const source = viewContent.source;
            setViewContent(null);
            if (source.type === 'desc') {
              setDescModal({ mode: 'edit', index: source.index });
            } else {
              setTodoModal({ mode: 'edit', id: source.id });
            }
          }}
        />
      ) : null}
    </div>
  );
}

function DetailRow({
  icon,
  label,
  children,
}: {
  icon?: ReactNode;
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3 px-5 py-3">
      <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-suite-faint">
        {icon}
        {label}
      </span>
      <span className="text-right">{children}</span>
    </div>
  );
}
