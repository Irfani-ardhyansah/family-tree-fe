import type { TaskType } from '../types';

const TYPE_CONFIG: Record<
  TaskType,
  { label: string; className: string }
> = {
  Bugfixing: {
    label: 'Bugfixing',
    className:
      'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300',
  },
  Feature: {
    label: 'Feature',
    className:
      'bg-sky-100 text-sky-800 dark:bg-sky-950/60 dark:text-sky-300',
  },
  Refactor: {
    label: 'Refactor',
    className:
      'bg-violet-100 text-violet-800 dark:bg-violet-950/60 dark:text-violet-300',
  },
};

interface TaskTypeBadgeProps {
  type: TaskType;
}

export function TaskTypeBadge({ type }: TaskTypeBadgeProps) {
  const config = TYPE_CONFIG[type];
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold ${config.className}`}
    >
      {config.label}
    </span>
  );
}
