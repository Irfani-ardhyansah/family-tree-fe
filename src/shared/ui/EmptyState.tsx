import type { ReactNode } from 'react';
import { AlertCircle, Inbox } from 'react-feather';
import { cx } from '@/shared/ui/cx';

export function EmptyState({
  title = 'Belum ada data',
  description,
  action,
}: {
  title?: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-card border border-dashed border-suite-border bg-suite-surface/60 px-6 py-16 text-center">
      <div className="mb-1 flex h-12 w-12 items-center justify-center rounded-card bg-suite-soft text-suite-faint">
        <Inbox size={22} />
      </div>
      <p className="text-lg font-semibold text-suite-ink">{title}</p>
      {description ? (
        <p className="max-w-sm text-sm text-suite-muted">{description}</p>
      ) : null}
      {action ? <div className="mt-3">{action}</div> : null}
    </div>
  );
}

export function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-card border border-money-rose/30 bg-money-rose-soft/80 px-6 py-14 text-center">
      <AlertCircle className="text-money-rose" size={28} />
      <p className="text-sm font-medium text-money-rose">{message}</p>
      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="rounded-control bg-admin-600 px-4 py-2 text-sm font-semibold text-white hover:bg-admin-700"
        >
          Coba lagi
        </button>
      ) : null}
    </div>
  );
}

export function LoadingState({
  label = 'Memuat…',
  accentClassName = 'border-suite-border border-t-suite-ink',
}: {
  label?: string;
  accentClassName?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-20 text-suite-muted">
      <div
        className={cx(
          'h-9 w-9 animate-spin rounded-full border-2',
          accentClassName,
        )}
      />
      <p className="text-sm font-medium">{label}</p>
    </div>
  );
}
