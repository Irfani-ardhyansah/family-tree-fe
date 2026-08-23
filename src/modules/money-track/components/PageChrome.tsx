import type { ReactNode } from 'react';
import { Card, PageHeader as SuitePageHeader, cx } from '@/shared/ui';

type PageHeaderProps = {
  title: string;
  description: string;
  actions?: ReactNode;
};

export function PageHeader({ title, description, actions }: PageHeaderProps) {
  return (
    <SuitePageHeader title={title} description={description} actions={actions} />
  );
}

export function MoneyCard({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  return <Card className={className}>{children}</Card>;
}

export function PeriodPill({ label }: { label: string }) {
  return (
    <div className="inline-flex items-center gap-2.5 rounded-full border border-suite-border bg-suite-surface px-3.5 py-1.5 text-[13px] font-semibold shadow-card">
      <span className="flex h-[26px] w-[26px] items-center justify-center rounded-full bg-suite-soft text-suite-muted">
        ‹
      </span>
      {label}
      <span className="flex h-[26px] w-[26px] items-center justify-center rounded-full bg-suite-soft text-suite-muted">
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
      className={cx(
        'rounded-full border px-3 py-1.5 text-[12.5px] font-bold transition-colors',
        active
          ? 'border-money-brown bg-money-brown-soft text-money-brown-deep'
          : 'border-suite-border bg-suite-surface text-suite-muted hover:bg-suite-soft',
      )}
    >
      {label}
    </button>
  );
}
