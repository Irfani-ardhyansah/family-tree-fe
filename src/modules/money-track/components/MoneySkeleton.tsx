import type { ReactNode } from 'react';

/** Skeleton / shimmer blocks for Money Track loading states. */

export function MoneySkeletonLine({
  className = '',
}: {
  className?: string;
}) {
  return (
    <span
      className={[
        'inline-block animate-pulse rounded-md bg-money-border/80',
        className,
      ].join(' ')}
      aria-hidden
    />
  );
}

function SkeletonCard({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={[
        'rounded-[14px] border border-money-border bg-money-surface shadow-[0_1px_2px_rgba(31,42,31,0.04),0_8px_24px_-12px_rgba(31,42,31,0.10)]',
        className,
      ].join(' ')}
    >
      {children}
    </div>
  );
}

export function MoneyDashboardSkeleton() {
  return (
    <div aria-busy="true" aria-label="Memuat dashboard Money Track">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-2">
          <MoneySkeletonLine className="h-7 w-40" />
          <MoneySkeletonLine className="h-3.5 w-64 max-w-full" />
        </div>
        <MoneySkeletonLine className="h-9 w-40 rounded-full" />
      </div>

      <div className="mb-[18px] grid grid-cols-1 gap-3.5 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonCard key={i} className="px-5 py-4">
            <MoneySkeletonLine className="h-3 w-20" />
            <MoneySkeletonLine className="mt-3 h-7 w-32" />
            <MoneySkeletonLine className="mt-2 h-3 w-28" />
          </SkeletonCard>
        ))}
      </div>

      <div className="mb-3.5 grid grid-cols-1 gap-3.5 lg:grid-cols-2">
        {[0, 1].map((i) => (
          <SkeletonCard key={i} className="p-5">
            <div className="mb-4 flex items-center gap-2.5">
              <MoneySkeletonLine className="h-[38px] w-[38px] rounded-full" />
              <div className="space-y-1.5">
                <MoneySkeletonLine className="h-3.5 w-28" />
                <MoneySkeletonLine className="h-3 w-16" />
              </div>
            </div>
            <div className="space-y-3">
              <MoneySkeletonLine className="h-2.5 w-full rounded-full" />
              <MoneySkeletonLine className="h-2.5 w-5/6 rounded-full" />
              <MoneySkeletonLine className="h-2.5 w-2/3 rounded-full" />
            </div>
          </SkeletonCard>
        ))}
      </div>

      <SkeletonCard className="overflow-hidden">
        <div className="border-b border-money-border px-5 py-3">
          <MoneySkeletonLine className="h-4 w-36" />
        </div>
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-3 border-b border-money-border px-5 py-3.5 last:border-b-0"
          >
            <MoneySkeletonLine className="h-9 w-9 shrink-0 rounded-[10px]" />
            <div className="min-w-0 flex-1 space-y-2">
              <MoneySkeletonLine className="h-3.5 w-44 max-w-[70%]" />
              <MoneySkeletonLine className="h-3 w-28 max-w-[45%]" />
            </div>
            <MoneySkeletonLine className="h-4 w-20" />
          </div>
        ))}
      </SkeletonCard>
    </div>
  );
}

export function MoneyListSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div aria-busy="true" aria-label="Memuat daftar">
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-3 border-b border-money-border px-5 py-3.5 last:border-b-0"
        >
          <MoneySkeletonLine className="h-3.5 w-20 shrink-0" />
          <div className="min-w-0 flex-1 space-y-2">
            <MoneySkeletonLine className="h-3.5 w-40 max-w-[70%]" />
            <MoneySkeletonLine className="h-3 w-28 max-w-[50%]" />
          </div>
          <MoneySkeletonLine className="h-4 w-16" />
        </div>
      ))}
    </div>
  );
}

/** Full chrome placeholder while session / unlock gate is checking. */
export function MoneyModuleEntrySkeleton() {
  return (
    <div
      className="font-money min-h-screen bg-money-bg text-money-ink"
      aria-busy="true"
      aria-label="Memuat Money Track"
    >
      <div className="flex min-h-screen">
        <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-money-border bg-money-surface lg:flex">
          <div className="flex h-14 items-center justify-end border-b border-money-border px-3">
            <MoneySkeletonLine className="h-8 w-8 rounded-lg" />
          </div>
          <div className="flex-1 space-y-5 px-3 py-4">
            {[0, 1, 2].map((group) => (
              <div key={group} className="space-y-2">
                <MoneySkeletonLine className="ml-2 h-2.5 w-14" />
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3 rounded-xl px-2.5 py-2">
                    <MoneySkeletonLine className="h-4 w-4 rounded" />
                    <MoneySkeletonLine className="h-3.5 w-28" />
                  </div>
                ))}
              </div>
            ))}
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 border-b border-money-border bg-money-surface/95">
            <div className="flex h-14 items-center gap-2 px-3 sm:px-5">
              <MoneySkeletonLine className="h-9 w-9 rounded-[10px]" />
              <MoneySkeletonLine className="hidden h-4 w-28 sm:inline-block" />
              <div className="ml-2 hidden flex-1 items-center gap-2 sm:flex">
                <MoneySkeletonLine className="h-7 w-20 rounded-full" />
                <MoneySkeletonLine className="h-7 w-16 rounded-full" />
                <MoneySkeletonLine className="h-7 w-16 rounded-full" />
              </div>
              <div className="ml-auto flex items-center gap-2">
                <MoneySkeletonLine className="h-9 w-16 rounded-full" />
                <MoneySkeletonLine className="h-8 w-8 rounded-lg" />
                <MoneySkeletonLine className="h-8 w-8 rounded-lg" />
              </div>
            </div>
          </header>
          <main className="mx-auto w-full max-w-[1280px] flex-1 px-3 py-6 sm:px-6 lg:px-7 lg:py-8">
            <MoneyDashboardSkeleton />
          </main>
        </div>
      </div>
    </div>
  );
}
