import type { ReactNode } from 'react';
import { EmptyState, ErrorState, LoadingState, PageHeader } from '@/shared/ui';

export function AdminLoading({ label = 'Memuat…' }: { label?: string }) {
  return (
    <LoadingState
      label={label}
      accentClassName="border-admin-200 border-t-admin-600"
    />
  );
}

export function AdminEmpty({
  title = 'Belum ada data',
  description,
  action,
}: {
  title?: string;
  description?: string;
  action?: ReactNode;
}) {
  return <EmptyState title={title} description={description} action={action} />;
}

export function AdminError({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return <ErrorState message={message} onRetry={onRetry} />;
}

export function AdminPageHeader({
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
