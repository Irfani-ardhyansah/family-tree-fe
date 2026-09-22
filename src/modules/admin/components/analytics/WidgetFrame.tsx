import type { ReactNode } from 'react';
import { Card, cx } from '@/shared/ui';

export function WidgetSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="animate-pulse space-y-2.5 py-1">
      {Array.from({ length: rows }, (_, i) => (
        <div
          key={i}
          className="h-8 rounded-lg bg-suite-soft"
          style={{ width: `${92 - i * 8}%` }}
        />
      ))}
    </div>
  );
}

export function WidgetFrame({
  title,
  hint,
  loading,
  error,
  onRetry,
  empty,
  emptyText,
  actions,
  children,
  className,
  bodyClassName,
}: {
  title: string;
  hint?: string;
  loading?: boolean;
  error?: string;
  onRetry?: () => void;
  empty?: boolean;
  emptyText?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <Card className={cx('p-4 sm:p-5', className)}>
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-[15px] font-semibold text-suite-ink">{title}</h2>
          {hint ? (
            <p className="mt-0.5 text-[11px] leading-snug text-suite-faint">{hint}</p>
          ) : null}
        </div>
        {actions}
      </div>
      <div className={bodyClassName}>
        {loading ? (
          <WidgetSkeleton />
        ) : error ? (
          <div className="rounded-xl border border-money-rose/25 bg-money-rose-soft/70 px-3 py-4 text-center">
            <p className="text-sm font-medium text-money-rose">{error}</p>
            {onRetry ? (
              <button
                type="button"
                onClick={onRetry}
                className="mt-2 rounded-control bg-admin-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-admin-700"
              >
                Coba lagi
              </button>
            ) : null}
          </div>
        ) : empty ? (
          <p className="py-8 text-center text-sm text-suite-muted">
            {emptyText ?? 'Belum ada data di rentang ini.'}
          </p>
        ) : (
          children
        )}
      </div>
    </Card>
  );
}

export function PercentBar({ percent, className }: { percent: number; className?: string }) {
  const width = Math.max(0, Math.min(100, percent * 100));
  return (
    <div className={cx('h-1.5 overflow-hidden rounded-full bg-suite-soft', className)}>
      <div
        className="h-full rounded-full bg-admin-500"
        style={{ width: `${width}%` }}
      />
    </div>
  );
}
