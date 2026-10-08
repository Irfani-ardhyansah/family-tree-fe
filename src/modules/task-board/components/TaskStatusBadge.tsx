import { TASK_STATUS_META } from '../lib/taskMeta';
import type { TaskStatus } from '../types';

interface TaskStatusBadgeProps {
  status: TaskStatus;
  /** Tampilkan ikon status (selain titik) — dipakai di header/detail. */
  withIcon?: boolean;
}

export function TaskStatusBadge({
  status,
  withIcon = false,
}: TaskStatusBadgeProps) {
  const meta = TASK_STATUS_META[status];
  const Icon = meta.icon;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold ${meta.chipClass}`}
    >
      {withIcon ? (
        <Icon size={12} />
      ) : (
        <span className={`h-1.5 w-1.5 rounded-full ${meta.dotClass}`} />
      )}
      {meta.label}
    </span>
  );
}
