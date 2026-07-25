import { useCallback, useRef } from 'react';
import { useDataSource } from '@/context/DataSourceContext';
import { cleanupMedia } from '@/lib/mediaApi';

/** Track pending media ids for cleanup when modal closes without submit. */
export function useMediaModalSession() {
  const { source } = useDataSource();
  const pendingIdsRef = useRef<Set<string>>(new Set());

  const trackPending = useCallback((id: string) => {
    pendingIdsRef.current.add(id);
  }, []);

  const untrackPending = useCallback((id: string) => {
    pendingIdsRef.current.delete(id);
  }, []);

  const commitPending = useCallback(() => {
    pendingIdsRef.current.clear();
  }, []);

  const cleanupPending = useCallback(async () => {
    if (source !== 'api' || pendingIdsRef.current.size === 0) return;
    const ids = [...pendingIdsRef.current];
    pendingIdsRef.current.clear();
    try {
      await cleanupMedia(ids);
    } catch {
      // best-effort — BE TTL handles orphans
    }
  }, [source]);

  return { trackPending, untrackPending, commitPending, cleanupPending };
}
