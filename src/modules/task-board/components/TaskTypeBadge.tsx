import { TASK_TYPE_META } from '../lib/taskMeta';
import type { TaskType } from '../types';

interface TaskTypeBadgeProps {
  type: TaskType;
  /** Tampilkan ikon tipe — dipakai di header/detail. */
  withIcon?: boolean;
}

export function TaskTypeBadge({ type, withIcon = false }: TaskTypeBadgeProps) {
  const meta = TASK_TYPE_META[type];
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
