import type { ReactNode } from 'react';

/** Skeleton / shimmer blocks for Family Core loading states. */

export function CoreSkeletonLine({
  className = '',
}: {
  className?: string;
}) {
  return (
    <span
      className={[
        'inline-block animate-pulse rounded-md bg-slate-200/90 dark:bg-slate-700/80',
        className,
      ].join(' ')}
      aria-hidden
    />
  );
}

export function CoreHubSkeleton() {
  return (
    <div aria-busy="true" aria-label="Memuat Family Core">
      <div className="mb-6 space-y-2">
        <CoreSkeletonLine className="h-7 w-40" />
        <CoreSkeletonLine className="h-3.5 w-64 max-w-full" />
      </div>

      <div className="space-y-3">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="rounded-card border border-suite-border bg-suite-surface p-5 shadow-card"
          >
            <div className="flex items-start gap-3">
              <CoreSkeletonLine className="h-11 w-11 shrink-0 rounded-[12px]" />
              <div className="min-w-0 flex-1 space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <CoreSkeletonLine className="h-4 w-36" />
                  <CoreSkeletonLine className="h-3.5 w-3.5 rounded-full" />
                </div>
                <CoreSkeletonLine className="h-3 w-full max-w-sm" />
                <div className="flex flex-wrap gap-2 pt-1">
                  <CoreSkeletonLine className="h-6 w-20 rounded-full" />
                  <CoreSkeletonLine className="h-6 w-24 rounded-full" />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function CoreListSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div
      className="overflow-hidden rounded-card border border-suite-border bg-suite-surface shadow-card"
      aria-busy="true"
      aria-label="Memuat daftar"
    >
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-3 border-b border-suite-border/70 px-4 py-3.5 last:border-b-0"
        >
          <CoreSkeletonLine className="h-10 w-10 shrink-0 rounded-[12px]" />
          <div className="min-w-0 flex-1 space-y-2">
            <CoreSkeletonLine className="h-3.5 w-40 max-w-[70%]" />
            <CoreSkeletonLine className="h-3 w-28 max-w-[50%]" />
          </div>
          <CoreSkeletonLine className="h-6 w-14 rounded-full" />
        </div>
      ))}
    </div>
  );
}

/** Soft blur overlay while API content is refreshing behind the shell. */
export function CoreContentLoadingMask({
  loading,
  children,
}: {
  loading: boolean;
  children: ReactNode;
}) {
  if (!loading) return <>{children}</>;

  return (
    <div className="relative">
      <div className="pointer-events-none select-none blur-[2px] opacity-55">
        {children}
      </div>
      <div className="absolute inset-0 flex items-start justify-center pt-16">
        <div className="rounded-full border border-sky-200 bg-white/90 px-3.5 py-1.5 text-[12px] font-semibold text-sky-800 shadow-sm backdrop-blur-sm dark:border-sky-800 dark:bg-slate-900/90 dark:text-sky-200">
          Memuat data…
        </div>
      </div>
    </div>
  );
}
