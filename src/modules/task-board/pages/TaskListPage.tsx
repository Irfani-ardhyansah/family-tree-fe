import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Database,
  GitBranch,
  Plus,
  RefreshCw,
  Search,
} from 'react-feather';
import { taskBoardApi } from '../api/taskBoardApi';
import { TaskTypeBadge } from '../components/TaskTypeBadge';
import { TaskStatusBadge } from '../components/TaskStatusBadge';
import type { Task, TaskType, TaskStatus, TaskListQuery } from '../types';
import {
  TASK_STATUS_META,
  TASK_STATUS_ORDER,
  TASK_TYPE_META,
  TASK_TYPE_ORDER,
  formatTaskDate,
} from '../lib/taskMeta';
import { taskBoardPaths } from '@/shared/routes';
import { Card, EmptyState, ErrorState, PageHeader, cx } from '@/shared/ui';

function matchesSearch(task: Task, rawQuery: string): boolean {
  const q = rawQuery.trim().toLowerCase();
  if (!q) return true;
  if (task.title.toLowerCase().includes(q)) return true;
  if (task.branch_name.toLowerCase().includes(q)) return true;
  if (task.deploy_notes?.toLowerCase().includes(q)) return true;
  return (task.descriptions ?? []).some(
    (d) =>
      d.title.toLowerCase().includes(q) ||
      d.content.toLowerCase().includes(q),
  );
}

/** YYYY-MM-DD lokal (bukan UTC) supaya cocok dengan tanggal yang ditampilkan. */
function localDateOnly(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function daysAgoDateOnly(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return localDateOnly(date.toISOString());
}

function todayDateOnly(): string {
  return localDateOnly(new Date().toISOString());
}

function monthStartDateOnly(): string {
  const date = new Date();
  date.setDate(1);
  return localDateOnly(date.toISOString());
}

const DATE_INPUT_CLASS =
  'rounded-control border border-suite-border bg-suite-soft px-2.5 py-2 text-[12.5px] font-semibold text-suite-ink outline-none focus:border-amber-500 focus:bg-suite-surface';

export function TaskListPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [query, setQuery] = useState<TaskListQuery>({});
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

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
              : 'Gagal memuat daftar task.',
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

  /** Filter yang tidak bergantung status (dipakai untuk hitung count). */
  const baseTasks = useMemo(() => {
    return tasks.filter((task) => {
      if (query.type && task.type !== query.type) return false;
      if (query.search && !matchesSearch(task, query.search)) return false;
      if (dateFrom || dateTo) {
        const updated = localDateOnly(task.updated_at);
        if (dateFrom && updated < dateFrom) return false;
        if (dateTo && updated > dateTo) return false;
      }
      return true;
    });
  }, [tasks, query.type, query.search, dateFrom, dateTo]);

  const statusCounts = useMemo(() => {
    const counts: Record<TaskStatus, number> = {
      'To-Do': 0,
      'In Progress': 0,
      Merged: 0,
    };
    for (const task of baseTasks) counts[task.status] += 1;
    return counts;
  }, [baseTasks]);

  const filteredTasks = useMemo(() => {
    const list = query.status
      ? baseTasks.filter((task) => task.status === query.status)
      : baseTasks;
    return [...list].sort(
      (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime(),
    );
  }, [baseTasks, query.status]);

  const hasActiveFilter = Boolean(
    query.status || query.type || query.search || dateFrom || dateTo,
  );

  const resetFilters = () => {
    setQuery({});
    setDateFrom('');
    setDateTo('');
  };

  return (
    <div>
      <PageHeader
        title="Task Board"
        description="Pantau pekerjaan bugfixing, fitur, dan refactor beserta riwayatnya."
        actions={
          <button
            type="button"
            onClick={() => setReloadKey((n) => n + 1)}
            disabled={loading}
            className="inline-flex items-center gap-1.5 rounded-control border border-suite-border bg-suite-surface px-3 py-2 text-[13px] font-semibold text-suite-muted transition-colors hover:bg-suite-soft hover:text-suite-ink disabled:opacity-50"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Muat ulang
          </button>
        }
      />

      {/* Filter & pencarian */}
      <Card className="mb-4 p-4">
        <div className="flex flex-wrap items-center gap-1.5">
          <StatusPill
            label="Semua"
            count={baseTasks.length}
            active={!query.status}
            onClick={() => setQuery((q) => ({ ...q, status: undefined }))}
          />
          {TASK_STATUS_ORDER.map((status) => (
            <StatusPill
              key={status}
              label={TASK_STATUS_META[status].label}
              count={statusCounts[status]}
              dotClass={TASK_STATUS_META[status].dotClass}
              active={query.status === status}
              onClick={() =>
                setQuery((q) => ({
                  ...q,
                  status: q.status === status ? undefined : status,
                }))
              }
            />
          ))}
        </div>

        <div className="mt-3 flex flex-col gap-3 border-t border-suite-border pt-3 lg:flex-row lg:items-center">
          <div className="relative lg:w-72">
            <Search
              size={15}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-suite-faint"
            />
            <input
              type="text"
              value={query.search ?? ''}
              onChange={(e) =>
                setQuery((q) => ({ ...q, search: e.target.value }))
              }
              placeholder="Cari judul, branch, deskripsi…"
              className="w-full rounded-control border border-suite-border bg-suite-soft py-2.5 pl-9 pr-3 text-[13.5px] font-semibold text-suite-ink outline-none placeholder:font-medium placeholder:text-suite-faint focus:border-amber-500 focus:bg-suite-surface"
            />
          </div>

          <div className="flex flex-wrap items-center gap-1.5 lg:ml-auto">
            <TypePill
              label="Semua tipe"
              active={!query.type}
              onClick={() => setQuery((q) => ({ ...q, type: undefined }))}
            />
            {TASK_TYPE_ORDER.map((type) => (
              <TypePill
                key={type}
                label={TASK_TYPE_META[type].label}
                dotClass={TASK_TYPE_META[type].dotClass}
                active={query.type === type}
                onClick={() =>
                  setQuery((q) => ({
                    ...q,
                    type: q.type === type ? undefined : (type as TaskType),
                  }))
                }
              />
            ))}
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2 border-t border-suite-border pt-3">
          <span className="text-[11px] font-bold uppercase tracking-wide text-suite-faint">
            Tanggal diperbarui
          </span>
          <div className="flex flex-wrap items-center gap-1.5">
            <TypePill
              label="Semua waktu"
              active={!dateFrom && !dateTo}
              onClick={() => {
                setDateFrom('');
                setDateTo('');
              }}
            />
            <TypePill
              label="7 hari"
              active={dateFrom === daysAgoDateOnly(6) && dateTo === todayDateOnly()}
              onClick={() => {
                setDateFrom(daysAgoDateOnly(6));
                setDateTo(todayDateOnly());
              }}
            />
            <TypePill
              label="30 hari"
              active={dateFrom === daysAgoDateOnly(29) && dateTo === todayDateOnly()}
              onClick={() => {
                setDateFrom(daysAgoDateOnly(29));
                setDateTo(todayDateOnly());
              }}
            />
            <TypePill
              label="Bulan ini"
              active={
                dateFrom === monthStartDateOnly() && dateTo === todayDateOnly()
              }
              onClick={() => {
                setDateFrom(monthStartDateOnly());
                setDateTo(todayDateOnly());
              }}
            />
          </div>
          <div className="flex items-center gap-2 lg:ml-auto">
            <input
              type="date"
              value={dateFrom}
              max={dateTo || undefined}
              onChange={(e) => setDateFrom(e.target.value)}
              className={DATE_INPUT_CLASS}
              aria-label="Dari tanggal diperbarui"
            />
            <span className="text-suite-faint">–</span>
            <input
              type="date"
              value={dateTo}
              min={dateFrom || undefined}
              onChange={(e) => setDateTo(e.target.value)}
              className={DATE_INPUT_CLASS}
              aria-label="Sampai tanggal diperbarui"
            />
          </div>
        </div>
      </Card>

      {loading ? (
        <div className="space-y-2.5">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="h-[74px] animate-pulse rounded-card border border-suite-border bg-suite-surface"
            />
          ))}
        </div>
      ) : errorMessage ? (
        <ErrorState
          message={errorMessage}
          onRetry={() => setReloadKey((n) => n + 1)}
        />
      ) : filteredTasks.length === 0 ? (
        <EmptyState
          title={
            hasActiveFilter ? 'Tidak ada task yang cocok' : 'Belum ada task'
          }
          description={
            hasActiveFilter
              ? 'Coba ubah kata kunci atau filter status/tipe.'
              : 'Mulai dengan membuat task pengembangan pertama.'
          }
          action={
            hasActiveFilter ? (
              <button
                type="button"
                onClick={resetFilters}
                className="rounded-control border border-suite-border bg-suite-surface px-4 py-2 text-[13px] font-semibold text-suite-muted hover:bg-suite-soft hover:text-suite-ink"
              >
                Reset filter
              </button>
            ) : (
              <Link
                to={taskBoardPaths.new}
                className="inline-flex items-center gap-1.5 rounded-control bg-amber-500 px-4 py-2 text-[13px] font-bold text-white hover:bg-amber-600"
              >
                <Plus size={15} />
                Task Baru
              </Link>
            )
          }
        />
      ) : (
        <Card className="overflow-hidden">
          <div className="flex items-center justify-between gap-2 border-b border-suite-border px-4 py-2.5 text-[11px] font-bold uppercase tracking-wide text-suite-faint sm:px-5">
            <span>
              {filteredTasks.length} task
              {query.status ? ` · ${TASK_STATUS_META[query.status].label}` : ''}
            </span>
            <span className="hidden sm:inline">Diperbarui</span>
          </div>
          <div className="divide-y divide-suite-border">
            {filteredTasks.map((task) => {
              const statusMeta = TASK_STATUS_META[task.status];
              return (
                <Link
                  key={task.id}
                  to={taskBoardPaths.detail(task.id)}
                  className="group flex items-stretch gap-3 px-4 py-3.5 transition-colors hover:bg-suite-soft/60 sm:px-5"
                >
                  <span
                    className={cx(
                      'w-1 shrink-0 rounded-full',
                      statusMeta.barClass,
                    )}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <TaskTypeBadge type={task.type} />
                      <span className="font-money-mono text-[11px] text-suite-faint">
                        #{task.id}
                      </span>
                    </div>
                    <h3 className="mt-1.5 truncate text-[14.5px] font-bold text-suite-ink transition-colors group-hover:text-amber-600 dark:group-hover:text-amber-400">
                      {task.title}
                    </h3>
                    <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-suite-muted">
                      <span className="inline-flex items-center gap-1 font-money-mono text-[11.5px]">
                        <GitBranch size={12} className="shrink-0" />
                        {task.branch_name}
                      </span>
                      {task.parent_task_id ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-sky-500/10 px-2 py-0.5 text-[11px] font-semibold text-sky-700 dark:text-sky-300">
                          <RefreshCw size={11} />
                          Revisi #{task.parent_task_id}
                        </span>
                      ) : null}
                      {task.migration_files && task.migration_files.length > 0 ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-violet-500/10 px-2 py-0.5 text-[11px] font-semibold text-violet-700 dark:text-violet-300">
                          <Database size={11} />
                          {task.migration_files.length} migrasi
                        </span>
                      ) : null}
                    </div>
                  </div>
                  <div className="flex shrink-0 flex-col items-end justify-between gap-2">
                    <TaskStatusBadge status={task.status} />
                    <span className="hidden text-[11px] text-suite-faint sm:inline">
                      {formatTaskDate(task.updated_at)}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
}

function StatusPill({
  label,
  count,
  active,
  onClick,
  dotClass,
}: {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
  dotClass?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cx(
        'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[12.5px] font-bold transition-colors',
        active
          ? 'border-amber-500 bg-amber-500/10 text-amber-700 dark:text-amber-300'
          : 'border-suite-border bg-suite-surface text-suite-muted hover:bg-suite-soft',
      )}
    >
      {dotClass ? (
        <span className={cx('h-1.5 w-1.5 rounded-full', dotClass)} />
      ) : null}
      {label}
      <span
        className={cx(
          'rounded-full px-1.5 text-[11px] font-bold',
          active ? 'bg-amber-500/20' : 'bg-suite-soft',
        )}
      >
        {count}
      </span>
    </button>
  );
}

function TypePill({
  label,
  active,
  onClick,
  dotClass,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  dotClass?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cx(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1.5 text-[12px] font-bold transition-colors',
        active
          ? 'border-suite-ink/20 bg-suite-soft text-suite-ink'
          : 'border-transparent text-suite-muted hover:bg-suite-soft',
      )}
    >
      {dotClass ? (
        <span className={cx('h-1.5 w-1.5 rounded-full', dotClass)} />
      ) : null}
      {label}
    </button>
  );
}
