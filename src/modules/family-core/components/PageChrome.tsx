import type { ReactNode } from 'react';
import { Card, PageHeader } from '@/shared/ui';

export function CorePageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return <PageHeader title={title} description={description} actions={actions} />;
}

export function CoreCard({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  return <Card className={className}>{children}</Card>;
}
