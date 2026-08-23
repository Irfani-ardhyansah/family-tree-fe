import type { ElementType, ReactNode } from 'react';
import { cx } from '@/shared/ui/cx';

type CardProps = {
  children: ReactNode;
  className?: string;
  as?: ElementType;
};

export function Card({
  children,
  className,
  as: Tag = 'section',
}: CardProps) {
  return (
    <Tag className={cx('suite-card', className)}>{children}</Tag>
  );
}
