import { useCallback, useEffect, useState } from 'react';
import { fetchUnreadNotificationCount } from '@/shared/lib/notificationsApi';
import { useAuth } from '@/shared/context/AuthContext';

const REFRESH_EVENT = 'familyroots:notifications-refresh';

export function notifyNotificationsChanged() {
  window.dispatchEvent(new Event(REFRESH_EVENT));
}

/** Poll ringan untuk badge di Launcher / Navbar. */
export function useUnreadNotificationCount(pollMs = 60_000) {
  const { isAuthenticated, isInitializing } = useAuth();
  const [count, setCount] = useState(0);

  const refresh = useCallback(async () => {
    if (!isAuthenticated) {
      setCount(0);
      return;
    }
    try {
      const next = await fetchUnreadNotificationCount();
      setCount(next);
    } catch {
      // silent — badge opsional
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isInitializing || !isAuthenticated) {
      setCount(0);
      return;
    }
    void refresh();
    const id = window.setInterval(() => void refresh(), pollMs);
    const onRefresh = () => void refresh();
    window.addEventListener(REFRESH_EVENT, onRefresh);
    return () => {
      window.clearInterval(id);
      window.removeEventListener(REFRESH_EVENT, onRefresh);
    };
  }, [isInitializing, isAuthenticated, pollMs, refresh]);

  return { count, refresh };
}
