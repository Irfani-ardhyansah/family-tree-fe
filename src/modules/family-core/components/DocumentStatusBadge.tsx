import type { DocumentStatus } from '@/modules/family-core/types';

const STATUS_UI: Record<
  DocumentStatus,
  { label: string; className: string }
> = {
  active: {
    label: 'Aktif',
    className: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  },
  expiring: {
    label: 'Segera exp',
    className: 'bg-amber-50 text-amber-800 ring-amber-200',
  },
  expired: {
    label: 'Kadaluarsa',
    className: 'bg-rose-50 text-rose-700 ring-rose-200',
  },
};

export function DocumentStatusBadge({ status }: { status: DocumentStatus }) {
  const ui = STATUS_UI[status];
  return (
    <span
      className={[
        'inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-bold ring-1 ring-inset',
        ui.className,
      ].join(' ')}
    >
      {ui.label}
    </span>
  );
}
