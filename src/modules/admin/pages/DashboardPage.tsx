import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Activity,
  ArrowRight,
  Bell,
  Clipboard,
  Sliders,
  Users,
} from 'react-feather';
import { fetchAdminDashboard } from '@/modules/admin/api/adminApi';
import {
  AdminError,
  AdminLoading,
  AdminPageHeader,
} from '@/modules/admin/components/PageState';
import type { AdminDashboardSummary } from '@/modules/admin/types';
import { formatRelativeTime } from '@/modules/admin/utils/format';
import { adminPaths } from '@/shared/routes';
import { Card } from '@/shared/ui';

const QUICK_LINKS = [
  {
    to: adminPaths.modules,
    label: 'Status Modul',
    hint: 'On/off global',
    icon: Sliders,
  },
  {
    to: adminPaths.audit,
    label: 'Audit Log',
    hint: 'Jejak aktivitas',
    icon: Clipboard,
  },
  {
    to: adminPaths.broadcast,
    label: 'Broadcast',
    hint: 'Kirim pengumuman',
    icon: Bell,
  },
];

export function DashboardPage() {
  const [data, setData] = useState<AdminDashboardSummary | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    setError('');
    void fetchAdminDashboard()
      .then(setData)
      .catch((err: unknown) =>
        setError(err instanceof Error ? err.message : 'Gagal memuat dashboard'),
      )
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  if (loading) return <AdminLoading label="Memuat dashboard…" />;
  if (error) return <AdminError message={error} onRetry={load} />;
  if (!data) return null;

  const stats = [
    {
      label: 'Anggota',
      value: data.userCount,
      icon: Users,
      tone: 'bg-admin-50 text-admin-700',
    },
    {
      label: 'Sesi aktif',
      value: data.activeSessionCount,
      icon: Activity,
      tone: 'bg-sky-50 text-sky-700',
    },
    {
      label: 'Modul aktif',
      value: `${data.modulesEnabled}/${data.modulesTotal}`,
      icon: Sliders,
      tone: 'bg-ink-100 text-ink-700',
    },
  ];

  return (
    <div>
      <AdminPageHeader
        title="Dashboard"
        description="Ringkasan kontrol Family Suite — pantau modul, sesi, dan aktivitas terbaru."
      />

      <div className="grid gap-3 sm:grid-cols-3 sm:gap-4">
        {stats.map(({ label, value, icon: Icon, tone }) => (
          <div
            key={label}
            className="suite-card p-4 transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wider text-suite-faint">
                {label}
              </p>
              <span
                className={`flex h-9 w-9 items-center justify-center rounded-xl ${tone}`}
              >
                <Icon size={16} />
              </span>
            </div>
            <p className="mt-3 text-3xl font-bold text-suite-ink">
              {value}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-5">
        <section className="lg:col-span-3">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-suite-ink">
              Aktivitas terbaru
            </h2>
            <Link
              to={adminPaths.audit}
              className="inline-flex items-center gap-1 text-sm font-semibold text-admin-700 hover:text-admin-800"
            >
              Lihat semua <ArrowRight size={14} />
            </Link>
          </div>
          <Card className="overflow-hidden">
            <ul className="divide-y divide-suite-border">
              {data.recentLogs.map((log) => (
                <li
                  key={log.id}
                  className="flex items-start gap-3 px-4 py-3.5 transition hover:bg-admin-50/40"
                >
                  <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-admin-500" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-suite-ink">
                      {log.summary}
                    </p>
                    <p className="mt-0.5 text-xs text-suite-faint">
                      {log.userName} · {formatRelativeTime(log.timestamp)}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </Card>
        </section>

        <section className="lg:col-span-2">
          <h2 className="mb-3 text-lg font-semibold text-suite-ink">
            Pintasan
          </h2>
          <div className="grid gap-2.5">
            {QUICK_LINKS.map(({ to, label, hint, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                className="suite-card group flex items-center gap-3 px-4 py-3.5 transition hover:-translate-y-0.5 hover:border-admin-200 hover:shadow-md"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-admin-700 text-admin-100 transition group-hover:bg-admin-600 group-hover:text-white dark:bg-admin-600/40 dark:text-admin-200">
                  <Icon size={18} />
                </span>
                <div>
                  <p className="text-sm font-semibold text-suite-ink">{label}</p>
                  <p className="text-xs text-suite-faint">{hint}</p>
                </div>
                <ArrowRight
                  size={16}
                  className="ml-auto text-suite-faint transition group-hover:translate-x-0.5 group-hover:text-admin-600 dark:group-hover:text-admin-300"
                />
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
