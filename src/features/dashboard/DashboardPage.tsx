import { useMemo } from 'react';
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
} from 'react-feather';
import { useFamilyPerspective } from '@/context/FamilyPerspectiveContext';
import { useEvents } from '@/context/EventContext';
import { eventMatchesPerspective } from '@/utils/familyPerspective';
import { EVENT_TYPE_CONFIG } from '@/types/event';
import type { FamilyEvent } from '@/types/event';

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

function isUpcoming(dateStr: string): boolean {
  return new Date(dateStr) >= new Date(new Date().toDateString());
}

function countGenerations(personIds: string[], persons: { id: string; fatherId?: string; motherId?: string }[]): number {
  const map = new Map(persons.map((p) => [p.id, p]));
  const depths = new Set<number>();

  function getDepth(id: string): number {
    const person = map.get(id);
    if (!person?.fatherId && !person?.motherId) return 0;
    const fatherDepth = person.fatherId ? getDepth(person.fatherId) : -1;
    const motherDepth = person.motherId ? getDepth(person.motherId) : -1;
    return Math.max(fatherDepth, motherDepth) + 1;
  }

  for (const id of personIds) {
    depths.add(getDepth(id));
  }
  return depths.size || 1;
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
    <div
      className={`bg-white rounded-xl shadow-sm border p-6 flex items-center ${
        borderClass ?? 'border-gray-100'
      }`}
    >
      <div className={`${iconBg} p-3 rounded-full mr-4`}>
        <Icon className={iconColor} size={24} />
      </div>
      <div>
        <p className="text-gray-500 text-sm">{label}</p>
        <h3 className="text-2xl font-bold text-brand-700">{value}</h3>
      </div>
    </div>
  );
}

function EventMiniCard({ event }: { event: FamilyEvent }) {
  const cfg = EVENT_TYPE_CONFIG[event.type];
  return (
    <div className="border border-gray-100 rounded-xl p-4 hover:shadow-md transition bg-white">
      <div className="flex items-center gap-2 mb-2">
        <span className={`text-lg ${cfg.bg} w-8 h-8 rounded-full flex items-center justify-center`}>
          {cfg.emoji}
        </span>
        <span className={`text-xs font-semibold ${cfg.color}`}>{cfg.label}</span>
      </div>
      <p className="font-medium text-brand-700 text-sm leading-snug">{event.title}</p>
      <p className="text-gray-400 text-xs mt-2">{formatDate(event.date)}</p>
    </div>
  );
}

export function DashboardPage() {
  const {
    visiblePersons,
    visiblePersonIds,
    focusPerson,
    focusLabel,
    focusShortLabel,
    theme,
    perspective,
  } = useFamilyPerspective();
  const { events } = useEvents();

  const perspectiveEvents = useMemo(
    () => events.filter((e) => eventMatchesPerspective(e.personIds, visiblePersonIds)),
    [events, visiblePersonIds],
  );

  const upcomingEvents = useMemo(
    () =>
      perspectiveEvents
        .filter((e) => isUpcoming(e.date))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
    [perspectiveEvents],
  );

  const recentEvents = useMemo(
    () =>
      [...perspectiveEvents]
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 5),
    [perspectiveEvents],
  );

  const stats = useMemo(() => {
    const photoCount =
      visiblePersons.filter((p) => p.photoUrl).length +
      perspectiveEvents.reduce((sum, e) => sum + e.photoUrls.length, 0);
    const generations = countGenerations(
      visiblePersons.map((p) => p.id),
      visiblePersons,
    );

    return {
      members: visiblePersons.length,
      generations,
      photos: photoCount,
      upcoming: upcomingEvents.length,
    };
  }, [visiblePersons, perspectiveEvents, upcomingEvents.length]);

  const accentBtn =
    perspective === 'self'
      ? 'bg-primary-500 hover:bg-primary-600'
      : 'bg-secondary-500 hover:bg-secondary-600';

  return (
    <>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-brand-700">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">
          Ringkasan keluarga{' '}
          <span className={`font-semibold ${theme.accentText}`}>
            {focusLabel} ({focusShortLabel})
          </span>
        </p>
      </div>

      {/* Focus person card */}
      {focusPerson && (
        <div
          className={`mb-6 rounded-2xl border-2 p-5 flex items-center gap-4 ${theme.accentBg} ${theme.accentBorder}`}
        >
          <div
            className={`w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold text-white ${theme.accent}`}
          >
            {focusPerson.fullName.charAt(0)}
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">
              Fokus saat ini
            </p>
            <p className="text-lg font-bold text-brand-700">{focusPerson.fullName}</p>
            {focusPerson.nickname && (
              <p className={`text-sm font-medium ${theme.accentText}`}>
                {focusPerson.nickname}
              </p>
            )}
          </div>
          <div className="ml-auto hidden sm:flex items-center gap-1.5 text-xs text-gray-400">
            {perspective === 'self' ? <User size={14} /> : <Heart size={14} />}
            Ganti fokus di navbar
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          label="Total Anggota"
          value={stats.members}
          icon={Users}
          iconBg={theme.accentBg}
          iconColor={theme.accentText}
          borderClass={theme.accentBorder}
        />
        <StatCard
          label="Generasi"
          value={stats.generations}
          icon={GitBranch}
          iconBg={perspective === 'self' ? 'bg-secondary-100' : 'bg-primary-100'}
          iconColor={perspective === 'self' ? 'text-secondary-500' : 'text-primary-500'}
        />
        <StatCard
          label="Foto Keluarga"
          value={stats.photos}
          icon={Camera}
          iconBg={theme.accentBg}
          iconColor={theme.accentText}
        />
        <StatCard
          label="Acara Mendatang"
          value={stats.upcoming}
          icon={Calendar}
          iconBg={perspective === 'self' ? 'bg-secondary-100' : 'bg-primary-100'}
          iconColor={perspective === 'self' ? 'text-secondary-500' : 'text-primary-500'}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent events as activity feed */}
        <div className={`lg:col-span-2 bg-white rounded-xl shadow-sm border p-6 ${theme.accentBorder}`}>
          <div className="flex justify-between items-center mb-5">
            <h2 className="text-lg font-bold text-brand-700">Aktivitas Terbaru</h2>
            <Link to="/events" className={`text-sm font-medium ${theme.accentText} hover:underline`}>
              Lihat semua
            </Link>
          </div>
          {recentEvents.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">
              Belum ada acara untuk keluarga {focusShortLabel}
            </p>
          ) : (
            <div className="space-y-3">
              {recentEvents.map((event) => {
                const cfg = EVENT_TYPE_CONFIG[event.type];
                return (
                  <div key={event.id} className="flex items-start gap-3">
                    <div className={`${cfg.bg} p-2 rounded-full flex-shrink-0 text-base`}>
                      {cfg.emoji}
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-brand-700 text-sm">{event.title}</p>
                      <p className="text-gray-400 text-xs mt-0.5">
                        {cfg.label} · {formatDate(event.date)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Quick actions */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-bold text-brand-700 mb-5">Aksi Cepat</h2>
          <div className="space-y-3">
            <Link
              to="/family/tree"
              className={`w-full ${accentBtn} text-white px-4 py-3 rounded-xl transition flex items-center justify-between text-sm font-semibold`}
            >
              <span>Lihat Pohon Keluarga</span>
              <ChevronRight size={18} />
            </Link>
            <Link
              to="/family/data"
              className="w-full bg-white border border-gray-200 hover:border-primary-300 text-brand-700 px-4 py-3 rounded-xl transition flex items-center justify-between text-sm font-semibold"
            >
              <span className="flex items-center gap-2">
                <Plus size={16} />
                Tambah Anggota
              </span>
              <ChevronRight size={18} />
            </Link>
            <Link
              to="/events"
              className="w-full bg-white border border-gray-200 hover:border-primary-300 text-brand-700 px-4 py-3 rounded-xl transition flex items-center justify-between text-sm font-semibold"
            >
              <span className="flex items-center gap-2">
                <Calendar size={16} />
                Kelola Acara
              </span>
              <ChevronRight size={18} />
            </Link>
          </div>
        </div>
      </div>

      {/* Upcoming events */}
      <div className={`mt-6 bg-white rounded-xl shadow-sm border p-6 ${theme.accentBorder}`}>
        <div className="flex justify-between items-center mb-5">
          <h2 className="text-lg font-bold text-brand-700">Acara Mendatang</h2>
          <Link to="/events" className={`text-sm font-medium ${theme.accentText} hover:underline`}>
            Lihat semua
          </Link>
        </div>
        {upcomingEvents.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-8">
            Tidak ada acara mendatang untuk keluarga {focusShortLabel}
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {upcomingEvents.slice(0, 3).map((event) => (
              <EventMiniCard key={event.id} event={event} />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
