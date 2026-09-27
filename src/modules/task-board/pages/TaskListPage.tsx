import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Plus } from 'react-feather';
import { taskBoardApi } from '../api/taskBoardApi';
import { TaskTypeBadge } from '../components/TaskTypeBadge';
import { TaskStatusBadge } from '../components/TaskStatusBadge';
import type { Task, TaskType, TaskStatus, TaskListQuery } from '../types';
import { taskBoardPaths } from '@/shared/routes';

const TYPE_OPTIONS: { value: TaskType | undefined; label: string }[] = [
  { value: undefined, label: 'Semua Tipe' },
  { value: 'Bugfixing', label: 'Bugfixing' },
  { value: 'Feature', label: 'Feature' },
  { value: 'Refactor', label: 'Refactor' },
];

const STATUS_OPTIONS: { value: TaskStatus | undefined; label: string }[] = [
  { value: undefined, label: 'Semua Status' },
  { value: 'To-Do', label: 'To-Do' },
  { value: 'In Progress', label: 'In Progress' },
  { value: 'Merged', label: 'Merged' },
  { value: 'Done', label: 'Done' },
];

export function TaskListPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState<TaskListQuery>({});

  const filteredTasks = useMemo(() => {
    let result = [...tasks];

    if (query.type) {
      result = result.filter((t) => t.type === query.type);
    }

    if (query.status) {
      result = result.filter((t) => t.status === query.status);
    }

    if (query.search) {
      const searchLower = query.search.toLowerCase();
      result = result.filter(
        (t) =>
          t.title.toLowerCase().includes(searchLower) ||
          (t.description && t.description.toLowerCase().includes(searchLower)) ||
          (t.deploy_notes && t.deploy_notes.toLowerCase().includes(searchLower)),
      );
    }

    return result.sort(
      (a, b) =>
        new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime(),
    );
  }, [tasks, query]);

  const loadTasks = async () => {
    setLoading(true);
    try {
      const data = await taskBoardApi.list(query);
      setTasks(data);
    } catch (error) {
      console.error('Failed to load tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTasks();
  }, [query]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(date);
  };

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-suite-ink">
            Development Tasks
          </h1>
          <p className="mt-1 text-sm text-suite-muted">
            Track bugfixing, features, and refactoring work
          </p>
        </div>
        <Link
          to={taskBoardPaths.new}
          className="inline-flex items-center gap-1.5 rounded-xl bg-amber-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-amber-700"
        >
          <Plus size={16} />
          Task Baru
        </Link>
      </div>

      {/* Filters */}
      <div className="mb-4 flex flex-wrap gap-3 rounded-xl border border-suite-border bg-suite-surface p-4">
        <div className="flex-1 min-w-[200px]">
          <label className="mb-1 block text-xs font-semibold text-suite-faint">
            Search
          </label>
          <div className="relative">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-suite-faint"
            />
            <input
              type="text"
              placeholder="Cari task..."
              value={query.search || ''}
              onChange={(e) => setQuery({ ...query, search: e.target.value })}
              className="w-full rounded-lg border border-suite-border bg-suite-bg py-2 pl-9 pr-3 text-sm text-suite-ink placeholder:text-suite-faint focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
          </div>
        </div>

        <div className="min-w-[140px]">
          <label className="mb-1 block text-xs font-semibold text-suite-faint">
            Tipe
          </label>
          <select
            value={query.type ?? ''}
            onChange={(e) =>
              setQuery({
                ...query,
                type: e.target.value ? (e.target.value as TaskType) : undefined,
              })
            }
            className="w-full rounded-lg border border-suite-border bg-suite-bg py-2 px-3 text-sm text-suite-ink focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
          >
            {TYPE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div className="min-w-[140px]">
          <label className="mb-1 block text-xs font-semibold text-suite-faint">
            Status
          </label>
          <select
            value={query.status ?? ''}
            onChange={(e) =>
              setQuery({
                ...query,
                status: e.target.value ? (e.target.value as TaskStatus) : undefined,
              })
            }
            className="w-full rounded-lg border border-suite-border bg-suite-bg py-2 px-3 text-sm text-suite-ink focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Task List */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="h-20 animate-pulse rounded-xl bg-suite-surface"
            />
          ))}
        </div>
      ) : filteredTasks.length === 0 ? (
        <div className="rounded-xl border border-suite-border bg-suite-surface p-12 text-center">
          <p className="text-sm font-semibold text-suite-ink">
            Tidak ada task ditemukan
          </p>
          <p className="mt-1 text-sm text-suite-muted">
            {query.search || query.type || query.status
              ? 'Coba ubah filter atau search'
              : 'Mulai dengan membuat task baru'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredTasks.map((task) => (
            <Link
              key={task.id}
              to={taskBoardPaths.detail(task.id)}
              className="block rounded-xl border border-suite-border bg-suite-surface p-4 transition-colors hover:border-amber-300 hover:shadow-sm"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <TaskTypeBadge type={task.type} />
                    <TaskStatusBadge status={task.status} />
                  </div>
                  <h3 className="text-base font-semibold text-suite-ink">
                    {task.title}
                  </h3>
                  <p className="mt-1 text-sm text-suite-muted font-mono">
                    {task.branch_name}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-xs text-suite-faint">
                    {formatDate(task.updated_at)}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
