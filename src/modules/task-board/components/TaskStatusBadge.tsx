import type { TaskStatus } from '../types';

const STATUS_CONFIG: Record<
  TaskStatus,
  { label: string; className: string }
> = {
  'To-Do': {
    label: 'To-Do',
    className:
      'bg-slate-100 text-slate-800 dark:bg-slate-950/60 dark:text-slate-300',
  },
  'In Progress': {
    label: 'In Progress',
    className:
      'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300',
  },
  Merged: {
    label: 'Merged',
    className:
      'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300',
  },
  Done: {
    label: 'Done',
    className:
      'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300',
  },
};

interface TaskStatusBadgeProps {
  status: TaskStatus;
}

export function TaskStatusBadge({ status }: TaskStatusBadgeProps) {
  const config = STATUS_CONFIG[status];
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold ${config.className}`}
    >
      {config.label}
    </span>
  );
}
