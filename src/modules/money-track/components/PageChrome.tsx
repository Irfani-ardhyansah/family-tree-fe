import type { ReactNode } from 'react';

type PageHeaderProps = {
  title: string;
  description: string;
  actions?: ReactNode;
};

export function PageHeader({ title, description, actions }: PageHeaderProps) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        <p className="mt-0.5 text-[13.5px] text-money-muted">{description}</p>
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}

export function MoneyCard({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={[
        'rounded-[14px] border border-money-border bg-money-surface shadow-[0_1px_2px_rgba(31,42,31,0.04),0_8px_24px_-12px_rgba(31,42,31,0.10)]',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {children}
    </section>
  );
}

export function PeriodPill({ label }: { label: string }) {
  return (
    <div className="inline-flex items-center gap-2.5 rounded-full border border-money-border bg-money-surface px-3.5 py-1.5 text-[13px] font-semibold shadow-[0_1px_2px_rgba(31,42,31,0.04),0_8px_24px_-12px_rgba(31,42,31,0.10)]">
      <span className="flex h-[26px] w-[26px] items-center justify-center rounded-full bg-money-soft text-money-muted">
        ‹
      </span>
      {label}
      <span className="flex h-[26px] w-[26px] items-center justify-center rounded-full bg-money-soft text-money-muted">
        ›
      </span>
    </div>
  );
}

export function FilterChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'rounded-full border px-3 py-1.5 text-[12.5px] font-bold transition-colors',
        active
          ? 'border-money-brown bg-money-brown-soft text-money-brown-deep'
          : 'border-money-border bg-money-surface text-money-muted hover:bg-money-soft',
      ].join(' ')}
    >
      {label}
    </button>
  );
}
