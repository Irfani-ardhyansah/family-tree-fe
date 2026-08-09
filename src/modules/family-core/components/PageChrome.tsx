import type { ReactNode } from 'react';

export function CorePageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-brand-800">
          {title}
        </h1>
        {description ? (
          <p className="mt-0.5 text-[13.5px] text-brand-500">{description}</p>
        ) : null}
      </div>
      {actions ? (
        <div className="flex flex-wrap items-center gap-2">{actions}</div>
      ) : null}
    </div>
  );
}

export function CoreCard({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={[
        'rounded-[14px] border border-gray-200 bg-white shadow-[0_1px_2px_rgba(31,42,31,0.04),0_8px_24px_-12px_rgba(31,42,31,0.10)]',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {children}
    </section>
  );
}
