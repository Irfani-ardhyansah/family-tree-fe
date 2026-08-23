import type { ReactNode } from 'react';
import { cx } from '@/shared/ui/cx';

type PageHeaderProps = {
  title: string;
  description?: string;
  actions?: ReactNode;
  className?: string;
};

export function PageHeader({
  title,
  description,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <div
      className={cx(
        'mb-5 flex flex-wrap items-end justify-between gap-3',
        className,
      )}
    >
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-suite-ink">
          {title}
        </h1>
        {description ? (
          <p className="mt-0.5 text-[13.5px] text-suite-muted">{description}</p>
        ) : null}
      </div>
      {actions ? (
        <div className="flex flex-wrap items-center gap-2">{actions}</div>
      ) : null}
    </div>
  );
}
