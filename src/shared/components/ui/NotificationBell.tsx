import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Bell } from 'react-feather';
import { NotificationsInboxModal } from '@/shared/components/ui/NotificationsInboxModal';
import { useUnreadNotificationCount } from '@/shared/hooks/useUnreadNotificationCount';

type NotificationBellProps = {
  /** Visual variant for dark launcher vs light navbar */
  variant?: 'dark' | 'light';
  className?: string;
};

export function NotificationBell({
  variant = 'light',
  className = '',
}: NotificationBellProps) {
  const { count } = useUnreadNotificationCount();
  const [open, setOpen] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    if (searchParams.get('notifications') === '1') {
      setOpen(true);
      const next = new URLSearchParams(searchParams);
      next.delete('notifications');
      setSearchParams(next, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const buttonClass =
    variant === 'dark'
      ? 'relative inline-flex h-10 w-10 items-center justify-center rounded-full border border-suite-border bg-suite-surface text-suite-ink transition hover:bg-suite-soft'
      : 'relative inline-flex items-center justify-center rounded-control p-2 text-suite-muted hover:bg-suite-soft hover:text-suite-ink';

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`${buttonClass} ${className}`}
        title="Notifikasi"
        aria-label="Buka notifikasi"
      >
        <Bell size={variant === 'dark' ? 16 : 18} />
        {count > 0 && (
          <span
            className={`absolute flex h-4 min-w-4 items-center justify-center rounded-full bg-primary-500 px-1 text-[10px] font-bold text-white ${
              variant === 'dark' ? '-right-0.5 -top-0.5' : 'right-0.5 top-0.5'
            }`}
          >
            {count > 9 ? '9+' : count}
          </span>
        )}
      </button>

      <NotificationsInboxModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}
