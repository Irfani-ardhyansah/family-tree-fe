import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  fetchAnalyticsClicks,
  fetchAnalyticsGeo,
  fetchAnalyticsOutbounds,
  fetchAnalyticsOverview,
  fetchAnalyticsPages,
  fetchAnalyticsReferrers,
  fetchAnalyticsSections,
  fetchAnalyticsSessionDetail,
  fetchAnalyticsSessions,
  fetchAnalyticsTimeseries,
} from '@/modules/admin/api/analyticsApi';
import type {
  AnalyticsClickItem,
  AnalyticsDatePreset,
  AnalyticsDetailTab,
  AnalyticsGeoItem,
  AnalyticsOutbounds,
  AnalyticsOverview,
  AnalyticsPageId,
  AnalyticsPageItem,
  AnalyticsQuery,
  AnalyticsReferrers,
  AnalyticsSectionItem,
  AnalyticsSessionDetail,
  AnalyticsSessionList,
  AnalyticsTimeseries,
} from '@/modules/admin/analyticsTypes';
import { useAdminToast } from '@/modules/admin/components/AdminToast';
import { ApiClientError } from '@/shared/lib/apiClient';
import {
  detectPreset,
  isAbortError,
  rangeForPreset,
} from '@/modules/admin/utils/analyticsFormat';

type WidgetState<T> = {
  data: T | null;
  loading: boolean;
  error: string;
};

function emptyWidget<T>(): WidgetState<T> {
  return { data: null, loading: true, error: '' };
}

function errorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

export function usePortfolioAnalytics() {
  const { pushToast } = useAdminToast();
  const initialRange = rangeForPreset('14d');
  const [from, setFromState] = useState(initialRange.from);
  const [to, setToState] = useState(initialRange.to);
  const [pageId, setPageId] = useState<AnalyticsPageId | ''>('');
  const [excludeBots, setExcludeBots] = useState(true);
  const [tab, setTab] = useState<AnalyticsDetailTab>('pages');
  const [sessionPage, setSessionPage] = useState(1);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);

  const [overview, setOverview] = useState<WidgetState<AnalyticsOverview>>(emptyWidget);
  const [timeseries, setTimeseries] = useState<WidgetState<AnalyticsTimeseries>>(emptyWidget);
  const [geo, setGeo] = useState<WidgetState<AnalyticsGeoItem[]>>(emptyWidget);
  const [outbounds, setOutbounds] = useState<WidgetState<AnalyticsOutbounds>>(emptyWidget);
  const [pages, setPages] = useState<WidgetState<AnalyticsPageItem[]>>(emptyWidget);
  const [sections, setSections] = useState<WidgetState<AnalyticsSectionItem[]>>(emptyWidget);
  const [clicks, setClicks] = useState<WidgetState<AnalyticsClickItem[]>>(emptyWidget);
  const [referrers, setReferrers] = useState<WidgetState<AnalyticsReferrers>>(emptyWidget);
  const [sessions, setSessions] = useState<WidgetState<AnalyticsSessionList>>(emptyWidget);
  const [sessionDetail, setSessionDetail] = useState<WidgetState<AnalyticsSessionDetail>>({
    data: null,
    loading: false,
    error: '',
  });

  const query = useMemo<AnalyticsQuery>(
    () => ({ from, to, pageId, excludeBots }),
    [from, to, pageId, excludeBots],
  );
  const preset = detectPreset(from, to);
  const filterKey = `${from}|${to}|${pageId}|${excludeBots}`;
  const skipDebounceRef = useRef(true);

  const setFrom = (value: string) => {
    setFromState(value);
    setSessionPage(1);
  };
  const setTo = (value: string) => {
    setToState(value);
    setSessionPage(1);
  };
  const applyPreset = (next: Exclude<AnalyticsDatePreset, 'custom'>) => {
    const range = rangeForPreset(next);
    setFromState(range.from);
    setToState(range.to);
    setSessionPage(1);
  };
  const changePageId = (value: AnalyticsPageId | '') => {
    setPageId(value);
    setSessionPage(1);
  };
  const changeExcludeBots = (value: boolean) => {
    setExcludeBots(value);
    setSessionPage(1);
  };

  const loadFold = useCallback(async (signal: AbortSignal) => {
    if (!query.from || !query.to) return;
    setOverview((s) => ({ ...s, loading: true, error: '' }));
    setTimeseries((s) => ({ ...s, loading: true, error: '' }));
    setGeo((s) => ({ ...s, loading: true, error: '' }));
    setOutbounds((s) => ({ ...s, loading: true, error: '' }));

    const tasks: Array<Promise<void>> = [
      fetchAnalyticsOverview(query, signal)
        .then((data) => setOverview({ data, loading: false, error: '' }))
        .catch((error: unknown) => {
          if (isAbortError(error)) return;
          setOverview({ data: null, loading: false, error: errorMessage(error, 'Gagal memuat KPI') });
        }),
      fetchAnalyticsTimeseries(query, signal)
        .then((data) => setTimeseries({ data, loading: false, error: '' }))
        .catch((error: unknown) => {
          if (isAbortError(error)) return;
          setTimeseries({
            data: null,
            loading: false,
            error: errorMessage(error, 'Gagal memuat grafik'),
          });
        }),
      fetchAnalyticsGeo(query, signal)
        .then((data) => setGeo({ data, loading: false, error: '' }))
        .catch((error: unknown) => {
          if (isAbortError(error)) return;
          setGeo({ data: null, loading: false, error: errorMessage(error, 'Gagal memuat geo') });
        }),
      fetchAnalyticsOutbounds(query, signal)
        .then((data) => setOutbounds({ data, loading: false, error: '' }))
        .catch((error: unknown) => {
          if (isAbortError(error)) return;
          setOutbounds({
            data: null,
            loading: false,
            error: errorMessage(error, 'Gagal memuat outbound'),
          });
        }),
    ];

    await Promise.all(tasks);
  }, [query]);

  const loadTab = useCallback(
    async (signal: AbortSignal) => {
      if (!query.from || !query.to) return;
      if (tab === 'pages') {
        setPages((s) => ({ ...s, loading: true, error: '' }));
        try {
          const data = await fetchAnalyticsPages(query, signal);
          setPages({ data, loading: false, error: '' });
        } catch (error: unknown) {
          if (isAbortError(error)) return;
          setPages({ data: null, loading: false, error: errorMessage(error, 'Gagal memuat halaman') });
        }
        return;
      }
      if (tab === 'sections') {
        setSections((s) => ({ ...s, loading: true, error: '' }));
        try {
          const data = await fetchAnalyticsSections(query, signal);
          setSections({ data, loading: false, error: '' });
        } catch (error: unknown) {
          if (isAbortError(error)) return;
          setSections({
            data: null,
            loading: false,
            error: errorMessage(error, 'Gagal memuat section'),
          });
        }
        return;
      }
      if (tab === 'clicks') {
        setClicks((s) => ({ ...s, loading: true, error: '' }));
        try {
          const data = await fetchAnalyticsClicks(query, signal);
          setClicks({ data, loading: false, error: '' });
        } catch (error: unknown) {
          if (isAbortError(error)) return;
          setClicks({ data: null, loading: false, error: errorMessage(error, 'Gagal memuat klik') });
        }
        return;
      }
      if (tab === 'referrers') {
        setReferrers((s) => ({ ...s, loading: true, error: '' }));
        try {
          const data = await fetchAnalyticsReferrers(query, signal);
          setReferrers({ data, loading: false, error: '' });
        } catch (error: unknown) {
          if (isAbortError(error)) return;
          setReferrers({
            data: null,
            loading: false,
            error: errorMessage(error, 'Gagal memuat referrer'),
          });
        }
      }
    },
    [query, tab],
  );

  const loadSessions = useCallback(
    async (signal: AbortSignal) => {
      if (!query.from || !query.to) return;
      setSessions((s) => ({ ...s, loading: true, error: '' }));
      try {
        const data = await fetchAnalyticsSessions(query, sessionPage, 20, signal);
        setSessions({ data, loading: false, error: '' });
      } catch (error: unknown) {
        if (isAbortError(error)) return;
        setSessions({ data: null, loading: false, error: errorMessage(error, 'Gagal memuat sesi') });
      }
    },
    [query, sessionPage],
  );

  useEffect(() => {
    const controller = new AbortController();
    const delay = skipDebounceRef.current ? 0 : 280;
    const timer = window.setTimeout(() => {
      skipDebounceRef.current = false;
      void loadFold(controller.signal);
    }, delay);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [filterKey, loadFold]);

  useEffect(() => {
    if (tab === 'sessions') return;
    const controller = new AbortController();
    const delay = skipDebounceRef.current ? 0 : 280;
    const timer = window.setTimeout(() => {
      void loadTab(controller.signal);
    }, delay);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [filterKey, tab, loadTab]);

  useEffect(() => {
    if (tab !== 'sessions') return;
    const controller = new AbortController();
    const delay = skipDebounceRef.current ? 0 : 280;
    const timer = window.setTimeout(() => {
      void loadSessions(controller.signal);
    }, delay);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [tab, loadSessions]);

  useEffect(() => {
    if (!selectedSessionId) {
      setSessionDetail({ data: null, loading: false, error: '' });
      return;
    }
    const controller = new AbortController();
    setSessionDetail({ data: null, loading: true, error: '' });
    void fetchAnalyticsSessionDetail(selectedSessionId, controller.signal)
      .then((data) => setSessionDetail({ data, loading: false, error: '' }))
      .catch((error: unknown) => {
        if (isAbortError(error)) return;
        const notFound =
          error instanceof ApiClientError && error.code === 'ANALYTICS_SESSION_NOT_FOUND';
        pushToast('error', notFound ? 'Session tidak ditemukan.' : errorMessage(error, 'Gagal memuat sesi'));
        setSelectedSessionId(null);
        setSessionDetail({ data: null, loading: false, error: '' });
      });
    return () => controller.abort();
  }, [selectedSessionId, pushToast]);

  return {
    query,
    preset,
    from,
    to,
    pageId,
    excludeBots,
    tab,
    sessionPage,
    setFrom,
    setTo,
    applyPreset,
    changePageId,
    changeExcludeBots,
    setTab,
    setSessionPage,
    overview,
    timeseries,
    geo,
    outbounds,
    pages,
    sections,
    clicks,
    referrers,
    sessions,
    sessionDetail,
    selectedSessionId,
    openSession: setSelectedSessionId,
    closeSession: () => setSelectedSessionId(null),
    reloadFold: () => {
      const controller = new AbortController();
      void loadFold(controller.signal);
    },
    reloadTab: () => {
      const controller = new AbortController();
      if (tab === 'sessions') void loadSessions(controller.signal);
      else void loadTab(controller.signal);
    },
  };
}
