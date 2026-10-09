import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type DragEvent,
  type KeyboardEvent,
} from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Database,
  GitBranch,
  Menu,
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
import {
  readManualOrder,
  writeManualOrder,
} from '../lib/taskOrder';
import {
  EMPLOYMENT_META,
  resolveTaskWorkplaceId,
  workplaceAccent,
  workplaceInitials,
} from '../lib/workplaceMeta';
import { useWorkplaces } from '../lib/workplaceStore';
import type { Workplace } from '../types';
import { taskBoardPaths } from '@/shared/routes';
import { Card, EmptyState, ErrorState, cx } from '@/shared/ui';

type SortMode = 'manual' | 'date';
type SortDirection = 'desc' | 'asc';
type DropPosition = 'before' | 'after';

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

function timestamp(value: string): number {
  const time = new Date(value).getTime();
  return Number.isNaN(time) ? 0 : time;
}

const DATE_INPUT_CLASS =
  'rounded-control border border-suite-border bg-suite-soft px-2.5 py-2 text-[12.5px] font-semibold text-suite-ink outline-none focus:border-amber-500 focus:bg-suite-surface';

export function TaskListPage() {
  const workplaces = useWorkplaces();
  const { workplaceId: workplaceIdParam } = useParams<{
    workplaceId?: string;
  }>();
  const activeWorkplaceId =
    workplaceIdParam && Number.isFinite(Number(workplaceIdParam))
      ? Number(workplaceIdParam)
      : null;
  const activeWorkplace =
    activeWorkplaceId != null
      ? workplaces.find((workplace) => workplace.id === activeWorkplaceId)
      : undefined;

  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [query, setQuery] = useState<TaskListQuery>({});
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  // Urutan manual default supaya drag & drop langsung aktif. Selama belum ada
  // geseran, list tetap jatuh ke sortir tanggal terbaru (perilaku lama).
  const [sortMode, setSortMode] = useState<SortMode>('manual');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [manualOrder, setManualOrder] = useState<number[]>(() =>
    readManualOrder(),
  );
  const [draggingId, setDraggingId] = useState<number | null>(null);
  const [dragOver, setDragOver] = useState<{
    id: number;
    position: DropPosition;
  } | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  /** null = belum diketahui; false = endpoint `PUT /tasks/reorder` belum live. */
  const [orderSyncedToServer, setOrderSyncedToServer] = useState<
    boolean | null
  >(null);

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

  // Kalau belum ada urutan lokal tapi BE sudah mengirim `sort_order`, pakai itu
  // sebagai urutan awal (mis. pertama kali buka di perangkat baru).
  useEffect(() => {
    if (manualOrder.length > 0) return;
    if (!tasks.some((task) => typeof task.sort_order === 'number')) return;
    const serverOrder = [...tasks]
      .sort(
        (a, b) =>
          (a.sort_order ?? 0) - (b.sort_order ?? 0) || a.id - b.id,
      )
      .map((task) => task.id);
    setManualOrder(serverOrder);
  }, [tasks, manualOrder.length]);

  /** Filter yang tidak bergantung status (dipakai untuk hitung count). */
  const baseTasks = useMemo(() => {
    return tasks.filter((task) => {
      if (
        activeWorkplaceId != null &&
        resolveTaskWorkplaceId(task) !== activeWorkplaceId
      ) {
        return false;
      }
      if (query.type && task.type !== query.type) return false;
      if (query.search && !matchesSearch(task, query.search)) return false;
      if (dateFrom || dateTo) {
        const updated = localDateOnly(task.updated_at);
        if (dateFrom && updated < dateFrom) return false;
        if (dateTo && updated > dateTo) return false;
      }
      return true;
    });
  }, [tasks, activeWorkplaceId, query.type, query.search, dateFrom, dateTo]);

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

    if (sortMode === 'date') {
      const direction = sortDirection === 'asc' ? 1 : -1;
      return [...list].sort(
        (a, b) =>
          direction * (timestamp(a.updated_at) - timestamp(b.updated_at)) ||
          a.id - b.id,
      );
    }

    const rank = new Map(manualOrder.map((id, index) => [id, index]));
    return [...list].sort((a, b) => {
      const rankA = rank.get(a.id);
      const rankB = rank.get(b.id);
      if (rankA !== undefined && rankB !== undefined) return rankA - rankB;
      if (rankA !== undefined) return -1;
      if (rankB !== undefined) return 1;
      return timestamp(b.updated_at) - timestamp(a.updated_at) || a.id - b.id;
    });
  }, [baseTasks, query.status, sortMode, sortDirection, manualOrder]);

  const hasActiveFilter = Boolean(
    query.status || query.type || query.search || dateFrom || dateTo,
  );

  /** State untuk form task baru supaya tempat kerja aktif ikut terisi. */
  const newTaskState =
    activeWorkplaceId != null ? { workplaceId: activeWorkplaceId } : undefined;

  const resetFilters = () => {
    setQuery({});
    setDateFrom('');
    setDateTo('');
  };

  const resetDrag = useCallback(() => {
    setDraggingId(null);
    setDragOver(null);
  }, []);

  /** Simpan urutan baru: localStorage selalu, server best-effort. */
  const commitOrder = useCallback(
    (ids: number[]) => {
      setManualOrder(ids);
      writeManualOrder(ids);
      if (orderSyncedToServer === false) return;
      void taskBoardApi
        .reorder(ids)
        .then(() => setOrderSyncedToServer(true))
        .catch(() => setOrderSyncedToServer(false));
    },
    [orderSyncedToServer],
  );

  /**
   * Pindahkan `sourceId` ke dekat `targetId` (sebelum/sesudah).
   * Pakai urutan master (semua task) supaya task yang tersembunyi filter tidak
   * melompat, dan berlaku dua arah (atas→bawah maupun bawah→atas).
   */
  const reorderRelative = useCallback(
    (sourceId: number, targetId: number, position: DropPosition) => {
      if (sourceId === targetId) return;
      const rank = new Map(manualOrder.map((id, index) => [id, index]));
      const fullIds = [...tasks]
        .sort((a, b) => {
          const rankA = rank.get(a.id);
          const rankB = rank.get(b.id);
          if (rankA !== undefined && rankB !== undefined) return rankA - rankB;
          if (rankA !== undefined) return -1;
          if (rankB !== undefined) return 1;
          return timestamp(b.updated_at) - timestamp(a.updated_at) || a.id - b.id;
        })
        .map((task) => task.id);
      if (!fullIds.includes(sourceId) || !fullIds.includes(targetId)) return;

      const withoutSource = fullIds.filter((id) => id !== sourceId);
      const targetIndex = withoutSource.indexOf(targetId);
      if (targetIndex < 0) return;
      const insertAt = position === 'after' ? targetIndex + 1 : targetIndex;
      const next = [...withoutSource];
      next.splice(insertAt, 0, sourceId);
      commitOrder(next);
    },
    [tasks, manualOrder, commitOrder],
  );

  const handleDragStart = (event: DragEvent, taskId: number) => {
    setDraggingId(taskId);
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', String(taskId));
  };

  /**
   * Hitung baris target + posisi dari posisi kursor (clientY), bukan dari
   * elemen penerima event. Jadi drop tetap valid walau kursor ada di celah
   * antar baris, area header, atau kelebihan bergerak ke atas — inilah yang
   * membuat drag bawah→atas dulu terasa tidak jalan.
   */
  const resolveDropTarget = (
    clientY: number,
  ): { id: number; position: DropPosition } | null => {
    const rows = Array.from(
      listRef.current?.querySelectorAll<HTMLElement>('[data-task-row]') ?? [],
    );
    if (rows.length === 0) return null;
    for (const row of rows) {
      const rect = row.getBoundingClientRect();
      if (clientY < rect.top + rect.height / 2) {
        return { id: Number(row.dataset.taskRow), position: 'before' };
      }
    }
    const last = rows[rows.length - 1];
    return { id: Number(last.dataset.taskRow), position: 'after' };
  };

  const handleListDragOver = (event: DragEvent) => {
    if (draggingId === null) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
    const target = resolveDropTarget(event.clientY);
    setDragOver((current) =>
      current?.id === target?.id && current?.position === target?.position
        ? current
        : target,
    );
  };

  const handleListDrop = (event: DragEvent) => {
    if (draggingId === null) return;
    event.preventDefault();
    const raw = event.dataTransfer.getData('text/plain');
    const sourceId = draggingId ?? Number(raw);
    const target = resolveDropTarget(event.clientY);
    if (sourceId && target && sourceId !== target.id) {
      reorderRelative(sourceId, target.id, target.position);
    }
    resetDrag();
  };

  const handleHandleKeyDown = (event: KeyboardEvent, taskId: number) => {
    if (event.key !== 'ArrowUp' && event.key !== 'ArrowDown') return;
    const visibleIds = filteredTasks.map((task) => task.id);
    const index = visibleIds.indexOf(taskId);
    if (index < 0) return;
    const nextIndex = event.key === 'ArrowUp' ? index - 1 : index + 1;
    if (nextIndex < 0 || nextIndex >= visibleIds.length) return;
    event.preventDefault();
    reorderRelative(
      taskId,
      visibleIds[nextIndex],
      event.key === 'ArrowUp' ? 'before' : 'after',
    );
  };

  if (activeWorkplaceId != null && !activeWorkplace) {
    return (
      <div>
        <EmptyState
          title="Tempat kerja tidak ditemukan"
          description="Tempat kerja ini mungkin sudah dihapus atau tautannya salah."
          action={
            <Link
              to={taskBoardPaths.home}
              className="inline-flex items-center gap-1.5 rounded-control border border-suite-border bg-suite-surface px-4 py-2 text-[13px] font-semibold text-suite-muted hover:bg-suite-soft hover:text-suite-ink"
            >
              <ArrowLeft size={14} />
              Kembali ke daftar tempat kerja
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div>
      {activeWorkplace ? (
        <WorkplaceHeader
          workplace={activeWorkplace}
          loading={loading}
          newTaskState={newTaskState}
          onReload={() => setReloadKey((n) => n + 1)}
        />
      ) : (
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <div className="flex min-w-0 items-start gap-3">
            <Link
              to={taskBoardPaths.home}
              className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-control text-suite-muted transition-colors hover:bg-suite-soft hover:text-suite-ink"
              aria-label="Kembali ke daftar tempat kerja"
              title="Kembali ke daftar tempat kerja"
            >
              <ArrowLeft size={18} />
            </Link>
            <div className="min-w-0">
              <h1 className="text-2xl font-bold tracking-tight text-suite-ink">
                Semua Task
              </h1>
              <p className="mt-0.5 text-[13.5px] text-suite-muted">
                Seluruh task lintas tempat kerja.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setReloadKey((n) => n + 1)}
            disabled={loading}
            className="inline-flex items-center gap-1.5 rounded-control border border-suite-border bg-suite-surface px-3 py-2 text-[13px] font-semibold text-suite-muted transition-colors hover:bg-suite-soft hover:text-suite-ink disabled:opacity-50"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Muat ulang
          </button>
        </div>
      )}

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

        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2 border-t border-suite-border pt-3">
          <span className="text-[11px] font-bold uppercase tracking-wide text-suite-faint">
            Urutan
          </span>
          <div className="flex flex-wrap items-center gap-1.5">
            <TypePill
              label="Manual (geser)"
              active={sortMode === 'manual'}
              onClick={() => setSortMode('manual')}
            />
            <TypePill
              label="Tanggal terbaru"
              active={sortMode === 'date' && sortDirection === 'desc'}
              onClick={() => {
                setSortMode('date');
                setSortDirection('desc');
              }}
            />
            <TypePill
              label="Tanggal terlama"
              active={sortMode === 'date' && sortDirection === 'asc'}
              onClick={() => {
                setSortMode('date');
                setSortDirection('asc');
              }}
            />
          </div>
          {sortMode === 'manual' ? (
            <span className="text-[11.5px] font-medium text-suite-faint lg:ml-auto">
              Tarik ikon di kiri baris untuk mengubah urutan.
            </span>
          ) : null}
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
            hasActiveFilter
              ? 'Tidak ada task yang cocok'
              : activeWorkplace
                ? `Belum ada task di ${activeWorkplace.name}`
                : 'Belum ada task'
          }
          description={
            hasActiveFilter
              ? 'Coba ubah kata kunci atau filter status/tipe.'
              : activeWorkplace
                ? 'Mulai dengan membuat task untuk tempat kerja ini.'
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
                state={newTaskState}
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
          <div
            ref={listRef}
            onDragOver={handleListDragOver}
            onDrop={handleListDrop}
          >
          <div className="flex items-center justify-between gap-2 border-b border-suite-border px-4 py-2.5 text-[11px] font-bold uppercase tracking-wide text-suite-faint sm:px-5">
            <span>
              {filteredTasks.length} task
              {query.status ? ` · ${TASK_STATUS_META[query.status].label}` : ''}
            </span>
            <span className="hidden sm:inline">
              {sortMode === 'manual' ? 'Urutan' : 'Diperbarui'}
            </span>
          </div>

          {sortMode === 'manual' && orderSyncedToServer === false ? (
            <div className="border-b border-suite-border bg-amber-500/10 px-4 py-2 text-[11.5px] font-semibold text-amber-700 dark:text-amber-300 sm:px-5">
              Urutan manual disimpan di perangkat ini. Sinkronisasi ke server
              menyusul saat endpoint baru aktif.
            </div>
          ) : null}

          <div className="divide-y divide-suite-border">
            {filteredTasks.map((task, index) => {
              const statusMeta = TASK_STATUS_META[task.status];
              const isManual = sortMode === 'manual';
              const isDragging = draggingId === task.id;
              const dropHere = dragOver?.id === task.id && !isDragging;
              const dropBefore = dropHere && dragOver?.position === 'before';
              const dropAfter = dropHere && dragOver?.position === 'after';
              return (
                <div
                  key={task.id}
                  data-task-row={task.id}
                  className={cx(
                    'group relative flex items-stretch transition-colors hover:bg-suite-soft/60',
                    isDragging && 'opacity-50',
                    dropHere && 'bg-amber-500/5',
                    dropBefore && 'shadow-[inset_0_3px_0_0_#f59e0b]',
                    dropAfter && 'shadow-[inset_0_-3px_0_0_#f59e0b]',
                  )}
                >
                  <div className="flex shrink-0 items-center gap-1 pl-2 pr-0.5 sm:pl-3">
                    <span
                      role="button"
                      tabIndex={isManual ? 0 : -1}
                      aria-label="Geser untuk mengubah urutan task"
                      aria-disabled={!isManual}
                      title={
                        isManual
                          ? 'Tarik untuk mengubah urutan (atau ↑/↓ saat fokus)'
                          : 'Pilih urutan Manual untuk menggeser'
                      }
                      draggable={isManual}
                      onDragStart={(event) => handleDragStart(event, task.id)}
                      onDragEnd={resetDrag}
                      onKeyDown={(event) => handleHandleKeyDown(event, task.id)}
                      className={cx(
                        'inline-flex h-8 w-6 items-center justify-center rounded-control text-suite-faint outline-none transition-colors focus-visible:ring-2 focus-visible:ring-amber-500',
                        isManual
                          ? 'cursor-grab hover:bg-suite-soft hover:text-suite-ink active:cursor-grabbing'
                          : 'cursor-not-allowed opacity-40',
                      )}
                    >
                      <Menu size={14} />
                    </span>
                    <span
                      className="inline-flex h-6 min-w-[1.5rem] items-center justify-center rounded-full bg-suite-soft px-1.5 font-money-mono text-[11px] font-bold text-suite-muted"
                      title={`Urutan ${index + 1}`}
                    >
                      {index + 1}
                    </span>
                  </div>

                  <Link
                    to={taskBoardPaths.detail(task.id)}
                    draggable={false}
                    className="flex min-w-0 flex-1 items-stretch gap-3 py-3.5 pr-4 sm:pr-5"
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
                </div>
              );
            })}
          </div>
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

function WorkplaceHeader({
  workplace,
  loading,
  newTaskState,
  onReload,
}: {
  workplace: Workplace;
  loading: boolean;
  newTaskState?: { workplaceId: number };
  onReload: () => void;
}) {
  const accent = workplaceAccent(workplace.accent);
  const employment = EMPLOYMENT_META[workplace.employment_type];

  return (
    <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
      <div className="flex min-w-0 items-start gap-3">
        <Link
          to={taskBoardPaths.home}
          className="mt-0.5 inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-control text-suite-muted transition-colors hover:bg-suite-soft hover:text-suite-ink"
          aria-label="Kembali ke daftar tempat kerja"
          title="Kembali ke daftar tempat kerja"
        >
          <ArrowLeft size={18} />
        </Link>
        <span
          className={cx(
            'flex h-11 w-11 shrink-0 items-center justify-center rounded-card text-[15px] font-black tracking-tight',
            accent.avatar,
          )}
          aria-hidden
        >
          {workplaceInitials(workplace.name)}
        </span>
        <div className="min-w-0">
          <h1 className="truncate text-[22px] font-bold tracking-tight text-suite-ink">
            {workplace.name}
          </h1>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1">
            <span
              className={cx(
                'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold',
                employment.chipClass,
              )}
            >
              <span
                className={cx('h-1.5 w-1.5 rounded-full', employment.dotClass)}
              />
              {employment.label}
            </span>
            {workplace.role ? (
              <span className="text-[12px] font-semibold text-suite-muted">
                {workplace.role}
              </span>
            ) : null}
            <Link
              to={taskBoardPaths.home}
              className="text-[12px] font-semibold text-suite-muted transition-colors hover:text-amber-600 dark:hover:text-amber-400"
            >
              Ganti tempat kerja
            </Link>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={onReload}
          disabled={loading}
          className="inline-flex items-center gap-1.5 rounded-control border border-suite-border bg-suite-surface px-3 py-2 text-[13px] font-semibold text-suite-muted transition-colors hover:bg-suite-soft hover:text-suite-ink disabled:opacity-50"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          Muat ulang
        </button>
        <Link
          to={taskBoardPaths.new}
          state={newTaskState}
          className="inline-flex items-center gap-1.5 rounded-control bg-amber-500 px-3.5 py-2 text-[13px] font-bold text-white transition-colors hover:bg-amber-600"
        >
          <Plus size={15} />
          Task Baru
        </Link>
      </div>
    </div>
  );
}
