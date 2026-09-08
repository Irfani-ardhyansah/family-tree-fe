import { Link } from 'react-router-dom';
import {
  Heart,
  Camera,
  Calendar,
  Users,
  ChevronRight,
  Plus,
  GitBranch,
  User,
  BookOpen,
  Map as MapIcon,
} from 'react-feather';
import { useFamilyPerspective } from '@/modules/family-roots/context/FamilyPerspectiveContext';
import { useFocusPersonId } from '@/shared/hooks/useFocusPersonId';
import { useDashboard } from '@/shared/hooks/useDashboard';
import { Card, PageHeader } from '@/shared/ui';
import { getMemorialEntryPath } from '@/shared/utils/memoriamAccess';
import { EVENT_TYPE_CONFIG } from '@/shared/types/event';
import type { FamilyEvent } from '@/shared/types/event';

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

function StatCard({
  label,
  value,
  icon: Icon,
  iconBg,
  iconColor,
  borderClass,
}: {
  label: string;
  value: number | string;
  icon: typeof Users;
  iconBg: string;
  iconColor: string;
  borderClass?: string;
}) {
  return (
    <Card
      className={`p-4 sm:p-6 flex items-center min-w-0 ${
        borderClass ?? ''
      }`}
    >
      <div className={`${iconBg} p-2.5 sm:p-3 rounded-full mr-3 sm:mr-4 flex-shrink-0`}>
        <Icon className={iconColor} size={22} />
      </div>
      <div className="min-w-0">
        <p className="text-suite-muted text-xs sm:text-sm leading-snug">{label}</p>
        <h3 className="text-xl sm:text-2xl font-bold text-suite-ink">{value}</h3>
      </div>
    </Card>
  );
}

function EventMiniCard({ event }: { event: FamilyEvent }) {
  const cfg = EVENT_TYPE_CONFIG[event.type];
  return (
    <Link
      to={`/roots/events/${event.id}`}
      className="suite-card p-4 hover:shadow-md transition block"
    >
      <div className="flex items-center gap-2 mb-2">
        <span className={`text-lg ${cfg.bg} w-8 h-8 rounded-full flex items-center justify-center`}>
          {cfg.emoji}
        </span>
        <span className={`text-xs font-semibold ${cfg.color}`}>{cfg.label}</span>
      </div>
      <p className="font-medium text-suite-ink text-sm leading-snug">{event.title}</p>
      <p className="text-suite-faint text-xs mt-2">{formatDate(event.date)}</p>
    </Link>
  );
}

export function DashboardPage() {
  const {
    focusPerson,
    focusLabel,
    focusShortLabel,
    theme,
    perspective,
  } = useFamilyPerspective();
  const focusPersonId = useFocusPersonId();
  const {
    stats,
    recentEvents,
    upcomingEvents,
    recentTributes,
    personMap,
    isLoading,
    error,
  } = useDashboard(focusPersonId);

  const accentBtn =
    perspective === 'self'
      ? 'bg-primary-500 hover:bg-primary-600'
      : 'bg-secondary-500 hover:bg-secondary-600';

  return (
    <>
      <PageHeader
        title="Dashboard"
        description={`Ringkasan keluarga ${focusLabel} (${focusShortLabel})`}
      />

      {/* Focus person card */}
      {focusPerson && (
        <div
          className={`mb-6 rounded-2xl border-2 p-4 sm:p-5 flex items-center gap-3 sm:gap-4 min-w-0 ${theme.accentBg} ${theme.accentBorder}`}
        >
          <div
            className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center text-lg sm:text-xl font-bold text-white flex-shrink-0 ${theme.accent}`}
          >
            {focusPerson.fullName.charAt(0)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">
              Fokus saat ini
            </p>
            <p className="text-base sm:text-lg font-bold text-brand-700 truncate">
              {focusPerson.fullName}
            </p>
            {focusPerson.nickname && (
              <p className={`text-sm font-medium ${theme.accentText}`}>
                {focusPerson.nickname}
              </p>
            )}
            <p className="sm:hidden text-xs text-gray-400 mt-1">
              Ganti fokus di menu navbar
            </p>
          </div>
          <div className="ml-auto hidden sm:flex items-center gap-1.5 text-xs text-gray-400 flex-shrink-0">
            {perspective === 'self' ? <User size={14} /> : <Heart size={14} />}
            Ganti fokus di navbar
          </div>
        </div>
      )}

      {error && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
        <StatCard
          label="Total Anggota"
          value={isLoading ? '—' : stats.members}
          icon={Users}
          iconBg={theme.accentBg}
          iconColor={theme.accentText}
          borderClass={theme.accentBorder}
        />
        <StatCard
          label="Generasi"
          value={isLoading ? '—' : stats.generations}
          icon={GitBranch}
          iconBg={perspective === 'self' ? 'bg-secondary-100' : 'bg-primary-100'}
          iconColor={perspective === 'self' ? 'text-secondary-500' : 'text-primary-500'}
        />
        <StatCard
          label="Foto Keluarga"
          value={isLoading ? '—' : stats.photos}
          icon={Camera}
          iconBg={theme.accentBg}
          iconColor={theme.accentText}
        />
        <StatCard
          label="Acara Mendatang"
          value={isLoading ? '—' : stats.upcoming}
          icon={Calendar}
          iconBg={perspective === 'self' ? 'bg-secondary-100' : 'bg-primary-100'}
          iconColor={perspective === 'self' ? 'text-secondary-500' : 'text-primary-500'}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent events as activity feed */}
        <Card className={`lg:col-span-2 p-4 sm:p-6 ${theme.accentBorder}`}>
          <div className="flex justify-between items-center gap-3 mb-5">
            <h2 className="text-base sm:text-lg font-bold text-suite-ink">Aktivitas Terbaru</h2>
            <Link to="/roots/events" className={`text-sm font-medium flex-shrink-0 ${theme.accentText} hover:underline`}>
              Lihat semua
            </Link>
          </div>
          {recentEvents.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">
              {isLoading
                ? 'Memuat aktivitas…'
                : `Belum ada acara untuk keluarga ${focusShortLabel}`}
            </p>
          ) : (
            <div className="space-y-3">
              {recentEvents.map((event) => {
                const cfg = EVENT_TYPE_CONFIG[event.type];
                return (
                  <Link
                    key={event.id}
                    to={`/roots/events/${event.id}`}
                    className="flex items-start gap-3 p-2 -mx-2 rounded-xl hover:bg-gray-50 transition-colors"
                  >
                    <div className={`${cfg.bg} p-2 rounded-full flex-shrink-0 text-base`}>
                      {cfg.emoji}
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-brand-700 text-sm">{event.title}</p>
                      <p className="text-gray-400 text-xs mt-0.5">
                        {cfg.label} · {formatDate(event.date)}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </Card>

        {/* Quick actions */}
        <Card className="p-4 sm:p-6">
          <h2 className="text-base sm:text-lg font-bold text-suite-ink mb-5">Aksi Cepat</h2>
          <div className="space-y-3">
            <Link
              to="/roots/tree"
              className={`w-full ${accentBtn} text-white px-4 py-3 rounded-control transition flex items-center justify-between text-sm font-semibold`}
            >
              <span>Lihat Pohon Keluarga</span>
              <ChevronRight size={18} />
            </Link>
            <Link
              to="/roots/data"
              className="w-full bg-suite-surface border border-suite-border hover:border-primary-300 text-suite-ink px-4 py-3 rounded-control transition flex items-center justify-between text-sm font-semibold"
            >
              <span className="flex items-center gap-2">
                <Plus size={16} />
                Tambah Anggota
              </span>
              <ChevronRight size={18} />
            </Link>
            <Link
              to="/roots/map"
              className="w-full bg-suite-surface border border-suite-border hover:border-primary-300 text-suite-ink px-4 py-3 rounded-control transition flex items-center justify-between text-sm font-semibold"
            >
              <span className="flex items-center gap-2">
                <MapIcon size={16} />
                Peta Keluarga
              </span>
              <ChevronRight size={18} />
            </Link>
            <Link
              to="/roots/events"
              className="w-full bg-suite-surface border border-suite-border hover:border-primary-300 text-suite-ink px-4 py-3 rounded-control transition flex items-center justify-between text-sm font-semibold"
            >
              <span className="flex items-center gap-2">
                <Calendar size={16} />
                Kelola Acara
              </span>
              <ChevronRight size={18} />
            </Link>
            <Link
              to="/roots/memoriam"
              className="w-full bg-suite-surface border border-suite-border hover:border-slate-300 text-suite-ink px-4 py-3 rounded-control transition flex items-center justify-between text-sm font-semibold"
            >
              <span className="flex items-center gap-2">
                <BookOpen size={16} />
                In Memoriam
              </span>
              <ChevronRight size={18} />
            </Link>
          </div>
        </Card>
      </div>

      {/* Recent tributes */}
      <Card className="mt-6 p-4 sm:p-6">
        <div className="flex justify-between items-center gap-3 mb-5">
          <h2 className="text-base sm:text-lg font-bold text-suite-ink">Kenangan Terbaru</h2>
          <Link
            to="/roots/memoriam"
            className="text-sm font-medium text-slate-600 hover:underline"
          >
            Lihat semua
          </Link>
        </div>
        {recentTributes.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-8">
            {isLoading ? 'Memuat kenangan…' : 'Belum ada kenangan yang ditulis'}
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {recentTributes.map((item) => {
              if (item.kind === 'deceased') {
                const { deceased, tributeCount } = item;
                return (
                  <Link
                    key={deceased.id}
                    to={getMemorialEntryPath(deceased)}
                    className="border border-slate-100 rounded-xl p-4 hover:shadow-md transition bg-suite-soft block"
                  >
                    <p className="text-xs text-slate-400 font-medium uppercase tracking-wide">
                      Kenangan
                    </p>
                    <p className="text-sm font-semibold text-slate-800 mt-2">
                      {deceased.fullName}
                    </p>
                    <p className="text-xs text-slate-400 mt-3">
                      {tributeCount} cerita kenangan
                    </p>
                  </Link>
                );
              }

              const deceased = personMap.get(item.deceasedId);
              const author = personMap.get(item.authorId);
              if (!deceased) return null;
              return (
                <Link
                  key={item.id}
                  to={getMemorialEntryPath(deceased)}
                  className="border border-slate-100 rounded-xl p-4 hover:shadow-md transition bg-suite-soft block"
                >
                  <p className="text-xs text-slate-400 font-medium uppercase tracking-wide">
                    Untuk {deceased.fullName}
                  </p>
                  <p className="text-sm text-slate-700 mt-2 line-clamp-2 leading-relaxed">
                    {item.content}
                  </p>
                  <p className="text-xs text-slate-400 mt-3">
                    {author?.fullName ?? 'Anggota'} ·{' '}
                    {formatDate(item.createdAt)}
                  </p>
                </Link>
              );
            })}
          </div>
        )}
      </Card>

      {/* Upcoming events */}
      <Card className={`mt-6 p-4 sm:p-6 ${theme.accentBorder}`}>
        <div className="flex justify-between items-center gap-3 mb-5">
          <h2 className="text-base sm:text-lg font-bold text-suite-ink">Acara Mendatang</h2>
          <Link to="/roots/events" className={`text-sm font-medium ${theme.accentText} hover:underline`}>
            Lihat semua
          </Link>
        </div>
        {upcomingEvents.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-8">
            {isLoading
              ? 'Memuat acara…'
              : `Tidak ada acara mendatang untuk keluarga ${focusShortLabel}`}
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {upcomingEvents.slice(0, 3).map((event) => (
              <EventMiniCard key={event.id} event={event} />
            ))}
          </div>
        )}
      </Card>
    </>
  );
}
