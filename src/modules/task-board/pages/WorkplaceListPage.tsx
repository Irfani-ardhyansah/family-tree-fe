import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import {
  Briefcase,
  CheckSquare,
  Clock,
  GitMerge,
  GitPullRequest,
  Layout,
  Plus,
  RefreshCw,
} from 'react-feather';
import { taskBoardApi } from '../api/taskBoardApi';
import { WorkplaceCard } from '../components/WorkplaceCard';
import { WorkplaceFormModal } from '../components/WorkplaceFormModal';
import {
  archiveWorkplace,
  createWorkplace,
  deleteWorkplace,
  refreshWorkplaces,
  unarchiveWorkplace,
  updateWorkplace,
  useWorkplaces,
} from '../lib/workplaceStore';
import {
  buildWorkplaceStats,
  emptyWorkplaceStats,
  type WorkplaceTaskStats,
} from '../lib/workplaceMeta';
import type { Task, Workplace, WorkplaceFormData } from '../types';
import { taskBoardPaths } from '@/shared/routes';
import {
  Card,
  EmptyState,
  ModalShell,
  PageHeader,
  SecondaryButton,
  cx,
} from '@/shared/ui';

type BoardView = 'active' | 'archived';

type FormState = {
  mode: 'create' | 'edit';
  workplace: Workplace | null;
};

type ConfirmState = {
  type: 'archive' | 'delete';
  workplace: Workplace;
};

export function WorkplaceListPage() {
  const workplaces = useWorkplaces();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [workplacesLoading, setWorkplacesLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [view, setView] = useState<BoardView>('active');
  const [formState, setFormState] = useState<FormState | null>(null);
  const [confirmState, setConfirmState] = useState<ConfirmState | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setErrorMessage(null);
      try {
        const data = await taskBoardApi.list();
        if (!cancelled) setTasks(data);
      } catch (error) {
        if (!cancelled) {
          setTasks([]);
          setErrorMessage(
            error instanceof Error && error.message
              ? error.message
              : 'Gagal memuat task.',
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  useEffect(() => {
    let cancelled = false;
    setWorkplacesLoading(true);
    void refreshWorkplaces()
      .catch((error) => {
        if (!cancelled) {
          setErrorMessage(
            error instanceof Error ? error.message : 'Gagal memuat tempat kerja.',
          );
        }
      })
      .finally(() => {
        if (!cancelled) setWorkplacesLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const statsByWorkplace = useMemo(() => buildWorkplaceStats(tasks), [tasks]);

  const activeWorkplaces = useMemo(
    () => workplaces.filter((workplace) => !workplace.archived_at),
    [workplaces],
  );
  const archivedWorkplaces = useMemo(
    () => workplaces.filter((workplace) => workplace.archived_at),
    [workplaces],
  );

  const totals = useMemo(() => {
    let inProgress = 0;
    let mergeRequest = 0;
    let merged = 0;
    for (const task of tasks) {
      if (task.status === 'In Progress') inProgress += 1;
      else if (task.status === 'Merge Request') mergeRequest += 1;
      else if (task.status === 'Merged') merged += 1;
    }
    return { total: tasks.length, inProgress, mergeRequest, merged };
  }, [tasks]);

  const statsFor = (workplace: Workplace): WorkplaceTaskStats =>
    statsByWorkplace.get(workplace.id) ?? emptyWorkplaceStats();

  const reload = () => {
    setReloadKey((n) => n + 1);
    void refreshWorkplaces().catch(() => undefined);
  };

  const runAction = async (action: () => Promise<void>) => {
    setBusy(true);
    setErrorMessage(null);
    try {
      await action();
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : 'Operasi gagal.',
      );
    } finally {
      setBusy(false);
    }
  };

  const handleSave = async (data: WorkplaceFormData) => {
    if (formState?.mode === 'edit' && formState.workplace) {
      await updateWorkplace(formState.workplace.id, data);
    } else {
      await createWorkplace(data);
    }
    setFormState(null);
  };

  const visibleWorkplaces =
    view === 'active' ? activeWorkplaces : archivedWorkplaces;

  const confirmStats = confirmState ? statsFor(confirmState.workplace) : null;

  const isInitialLoading = (loading || workplacesLoading) && workplaces.length === 0;

  return (
    <div>
      <PageHeader
        title="Task Board"
        description="Pilih tempat kerja untuk melihat dan mengelola task-nya."
        actions={
          <>
            <Link
              to={taskBoardPaths.all}
              className="inline-flex items-center gap-1.5 rounded-control border border-suite-border bg-suite-surface px-3 py-2 text-[13px] font-semibold text-suite-muted transition-colors hover:bg-suite-soft hover:text-suite-ink"
            >
              <Layout size={14} />
              Semua Task
            </Link>
            <button
              type="button"
              onClick={reload}
              disabled={loading || workplacesLoading}
              className="inline-flex items-center gap-1.5 rounded-control border border-suite-border bg-suite-surface px-3 py-2 text-[13px] font-semibold text-suite-muted transition-colors hover:bg-suite-soft hover:text-suite-ink disabled:opacity-50"
            >
              <RefreshCw
                size={14}
                className={loading || workplacesLoading ? 'animate-spin' : ''}
              />
              Muat ulang
            </button>
            <button
              type="button"
              onClick={() => setFormState({ mode: 'create', workplace: null })}
              className="inline-flex items-center gap-1.5 rounded-control bg-amber-500 px-3.5 py-2 text-[13px] font-bold text-white transition-colors hover:bg-amber-600"
            >
              <Plus size={15} />
              Tambah Tempat Kerja
            </button>
          </>
        }
      />

      {errorMessage ? (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-card border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-[13px] font-semibold text-rose-700 dark:text-rose-300">
          <span>{errorMessage}</span>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            className="shrink-0 text-rose-600 hover:text-rose-800 dark:text-rose-400"
            aria-label="Tutup pesan error"
          >
            ✕
          </button>
        </div>
      ) : null}

      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <SummaryTile
          icon={<CheckSquare size={16} />}
          label="Total Task"
          value={totals.total}
        />
        <SummaryTile
          icon={<Clock size={16} />}
          label="In Progress"
          value={totals.inProgress}
          accentClass="bg-sky-500/10 text-sky-600 dark:text-sky-300"
        />
        <SummaryTile
          icon={<GitPullRequest size={16} />}
          label="Merge Request"
          value={totals.mergeRequest}
          accentClass="bg-orange-500/10 text-orange-600 dark:text-orange-300"
        />
        <SummaryTile
          icon={<GitMerge size={16} />}
          label="Merged"
          value={totals.merged}
          accentClass="bg-emerald-500/10 text-emerald-600 dark:text-emerald-300"
        />
        <SummaryTile
          icon={<Briefcase size={16} />}
          label="Tempat Kerja"
          value={activeWorkplaces.length}
          accentClass="bg-amber-500/10 text-amber-600 dark:text-amber-300"
        />
      </div>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div className="inline-flex rounded-full border border-suite-border bg-suite-surface p-0.5">
          <ViewToggle
            active={view === 'active'}
            onClick={() => setView('active')}
          >
            Aktif ({activeWorkplaces.length})
          </ViewToggle>
          <ViewToggle
            active={view === 'archived'}
            onClick={() => setView('archived')}
          >
            Arsip ({archivedWorkplaces.length})
          </ViewToggle>
        </div>
      </div>

      {isInitialLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="h-[248px] animate-pulse rounded-card border border-suite-border bg-suite-surface"
            />
          ))}
        </div>
      ) : visibleWorkplaces.length === 0 ? (
        <EmptyState
          title={
            view === 'archived'
              ? 'Belum ada tempat kerja diarsipkan'
              : 'Belum ada tempat kerja'
          }
          description={
            view === 'archived'
              ? 'Tempat kerja yang diarsipkan akan muncul di sini.'
              : 'Tambah tempat kerja untuk mulai mengelompokkan task.'
          }
          action={
            view === 'active' ? (
              <button
                type="button"
                onClick={() =>
                  setFormState({ mode: 'create', workplace: null })
                }
                className="inline-flex items-center gap-1.5 rounded-control bg-amber-500 px-4 py-2 text-[13px] font-bold text-white hover:bg-amber-600"
              >
                <Plus size={15} />
                Tambah Tempat Kerja
              </button>
            ) : undefined
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {visibleWorkplaces.map((workplace) => (
            <WorkplaceCard
              key={workplace.id}
              workplace={workplace}
              stats={statsFor(workplace)}
              onEdit={() => setFormState({ mode: 'edit', workplace })}
              onArchive={
                workplace.is_default
                  ? undefined
                  : () => setConfirmState({ type: 'archive', workplace })
              }
              onRestore={() =>
                void runAction(() => unarchiveWorkplace(workplace.id))
              }
              onDelete={() => setConfirmState({ type: 'delete', workplace })}
            />
          ))}

          {view === 'active' ? (
            <button
              type="button"
              onClick={() =>
                setFormState({ mode: 'create', workplace: null })
              }
              className="flex min-h-[248px] flex-col items-center justify-center gap-2 rounded-card border border-dashed border-suite-border bg-suite-surface/50 px-6 py-10 text-center transition-colors hover:border-amber-400/70 hover:bg-suite-soft/60"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-card bg-suite-soft text-suite-faint">
                <Plus size={20} />
              </span>
              <span className="text-[13.5px] font-bold text-suite-ink">
                Tambah Tempat Kerja
              </span>
              <span className="max-w-[16rem] text-[11.5px] text-suite-faint">
                Pisahkan pekerjaan fulltime, freelance, dan proyek pribadi
                dalam satu board.
              </span>
            </button>
          ) : null}
        </div>
      )}

      {formState ? (
        <WorkplaceFormModal
          mode={formState.mode}
          initial={formState.workplace}
          onClose={() => setFormState(null)}
          onSave={handleSave}
        />
      ) : null}

      {confirmState && confirmStats ? (
        <WorkplaceConfirmModal
          state={confirmState}
          stats={confirmStats}
          busy={busy}
          onClose={() => setConfirmState(null)}
          onArchive={() =>
            void runAction(async () => {
              await archiveWorkplace(confirmState.workplace.id);
              setConfirmState(null);
            })
          }
          onDelete={() =>
            void runAction(async () => {
              await deleteWorkplace(confirmState.workplace.id);
              setConfirmState(null);
            })
          }
        />
      ) : null}
    </div>
  );
}

function WorkplaceConfirmModal({
  state,
  stats,
  busy,
  onClose,
  onArchive,
  onDelete,
}: {
  state: ConfirmState;
  stats: WorkplaceTaskStats;
  busy: boolean;
  onClose: () => void;
  onArchive: () => void;
  onDelete: () => void;
}) {
  const workplace = state.workplace;
  const isDelete = state.type === 'delete';
  const isDefault = workplace.is_default;
  const hasTasks = stats.total > 0;
  const blocked = isDelete && (isDefault || hasTasks);

  const title = !isDelete
    ? 'Arsipkan Tempat Kerja?'
    : isDefault
      ? 'Tidak Bisa Dihapus'
      : hasTasks
        ? 'Tidak Bisa Dihapus'
        : 'Hapus Tempat Kerja?';

  return (
    <ModalShell
      accent="task"
      title={title}
      onClose={onClose}
      titleId="workplace-confirm-title"
      footer={
        blocked ? (
          <div className="flex justify-end gap-2">
            <div className="w-24">
              <SecondaryButton onClick={onClose}>Batal</SecondaryButton>
            </div>
            {!isDefault ? (
              <div className="w-32">
                <button
                  type="button"
                  onClick={onArchive}
                  disabled={busy}
                  className="w-full rounded-control bg-amber-500 px-4 py-3 text-[13px] font-extrabold text-white transition-colors hover:bg-amber-600 disabled:opacity-60"
                >
                  {busy ? 'Memproses…' : 'Arsipkan'}
                </button>
              </div>
            ) : null}
          </div>
        ) : (
          <div className="flex justify-end gap-2">
            <div className="w-24">
              <SecondaryButton onClick={onClose}>Batal</SecondaryButton>
            </div>
            <div className="w-32">
              {isDelete ? (
                <button
                  type="button"
                  onClick={onDelete}
                  disabled={busy}
                  className="w-full rounded-control bg-rose-600 px-4 py-3 text-[13px] font-extrabold text-white transition-colors hover:bg-rose-700 disabled:opacity-60"
                >
                  {busy ? 'Memproses…' : 'Hapus'}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={onArchive}
                  disabled={busy}
                  className="w-full rounded-control bg-amber-500 px-4 py-3 text-[13px] font-extrabold text-white transition-colors hover:bg-amber-600 disabled:opacity-60"
                >
                  {busy ? 'Memproses…' : 'Arsipkan'}
                </button>
              )}
            </div>
          </div>
        )
      }
    >
      <p className="text-[13px] text-suite-muted">
        {!isDelete ? (
          <>
            Tempat kerja{' '}
            <span className="font-bold text-suite-ink">
              “{workplace.name}”
            </span>{' '}
            akan disembunyikan dari daftar aktif. Task-nya tetap aman dan bisa
            dipulihkan kapan saja dari tab Arsip.
          </>
        ) : isDefault ? (
          <>
            Tempat kerja default tidak bisa dihapus karena menjadi penampung
            task lama yang belum punya tempat kerja.
          </>
        ) : hasTasks ? (
          <>
            <span className="font-bold text-suite-ink">
              “{workplace.name}”
            </span>{' '}
            masih punya{' '}
            <span className="font-bold text-suite-ink">{stats.total} task</span>
            . Tempat kerja yang masih dipakai tidak bisa dihapus — arsipkan saja
            supaya tetap tersimpan.
          </>
        ) : (
          <>
            Tindakan ini permanen. Tempat kerja{' '}
            <span className="font-bold text-suite-ink">
              “{workplace.name}”
            </span>{' '}
            akan dihapus.
          </>
        )}
      </p>
    </ModalShell>
  );
}

function ViewToggle({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cx(
        'rounded-full px-3.5 py-1.5 text-[12.5px] font-bold transition-colors',
        active
          ? 'bg-suite-soft text-suite-ink'
          : 'text-suite-muted hover:text-suite-ink',
      )}
    >
      {children}
    </button>
  );
}

function SummaryTile({
  icon,
  label,
  value,
  accentClass = 'bg-suite-soft text-suite-muted',
}: {
  icon: ReactNode;
  label: string;
  value: number;
  accentClass?: string;
}) {
  return (
    <Card className="flex items-center gap-3 p-3.5">
      <span
        className={cx(
          'flex h-9 w-9 shrink-0 items-center justify-center rounded-control',
          accentClass,
        )}
      >
        {icon}
      </span>
      <div className="min-w-0">
        <div className="font-money-mono text-[18px] font-bold leading-none text-suite-ink">
          {value}
        </div>
        <div className="mt-1 truncate text-[11px] font-semibold uppercase tracking-wide text-suite-faint">
          {label}
        </div>
      </div>
    </Card>
  );
}
