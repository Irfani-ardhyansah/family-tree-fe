import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Users,
  Camera,
  Plus,
  Lock,
  Globe,
  Image as ImageIcon,
} from 'react-feather';
import { useFamily } from '@/context/FamilyDataContext';
import { useFamilyPerspective } from '@/context/FamilyPerspectiveContext';
import { useFocusPersonId } from '@/hooks/useFocusPersonId';
import { useEventDetail } from '@/hooks/useEventDetail';
import { EVENT_TYPE_CONFIG } from '@/types/event';
import {
  buildGalleryItems,
  canAccessEvent,
  groupByContributor,
  isRestrictedEvent,
  type GalleryItem,
} from '@/utils/eventAccess';
import { ContributePhotoModal } from './components/ContributePhotoModal';
import { GalleryLightbox } from './components/GalleryLightbox';

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase();
}

function ContributorAvatar({
  name,
  size = 'md',
  active,
}: {
  name: string;
  size?: 'sm' | 'md';
  active?: boolean;
}) {
  const dim = size === 'sm' ? 'w-7 h-7 text-[10px]' : 'w-9 h-9 text-xs';
  return (
    <div
      className={`${dim} rounded-full flex items-center justify-center font-bold flex-shrink-0 transition-all ${
        active
          ? 'bg-primary-500 text-white ring-2 ring-primary-300 ring-offset-1'
          : 'bg-gray-200 text-gray-600'
      }`}
    >
      {getInitials(name)}
    </div>
  );
}

export function EventDetailPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const { persons: mockPersons } = useFamily();
  const { me, theme } = useFamilyPerspective();
  const focusPersonId = useFocusPersonId();

  const {
    source,
    event,
    allPersons: apiPersons,
    isLoading,
    error,
    accessForbidden,
    addContribution,
  } = useEventDetail(eventId, focusPersonId);

  const persons = source === 'api' ? apiPersons : mockPersons;
  const currentUserId = me?.id;

  const personMap = useMemo(
    () => new Map(persons.map((p) => [p.id, p])),
    [persons],
  );

  const getPersonName = (id: string) =>
    personMap.get(id)?.fullName ?? 'Anggota';

  const [contributorFilter, setContributorFilter] = useState<string | 'all'>(
    'all',
  );
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [showContribute, setShowContribute] = useState(false);

  const galleryItems = useMemo(
    () => (event ? buildGalleryItems(event, getPersonName) : []),
    [event, personMap],
  );

  const contributors = useMemo(
    () => groupByContributor(galleryItems),
    [galleryItems],
  );

  const filteredGallery = useMemo(() => {
    if (contributorFilter === 'all') return galleryItems;
    return galleryItems.filter(
      (item) => item.contributorId === contributorFilter,
    );
  }, [galleryItems, contributorFilter]);

  if (isLoading) {
    return (
      <div className="text-center py-20 text-gray-500">
        Memuat detail acara…
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-20">
        <p className="text-red-600 font-medium">{error}</p>
        <Link
          to="/events"
          className="mt-4 inline-flex items-center gap-2 text-primary-600 text-sm font-medium hover:underline"
        >
          <ArrowLeft size={16} /> Kembali ke daftar acara
        </Link>
      </div>
    );
  }

  if (accessForbidden) {
    return (
      <div className="max-w-lg mx-auto text-center py-20">
        <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
          <Lock className="text-gray-400" size={28} />
        </div>
        <h2 className="text-lg font-bold text-brand-700 mb-2">
          Acara Ini Terbatas
        </h2>
        <p className="text-sm text-gray-500 leading-relaxed">
          Hanya peserta terpilih yang dapat melihat galeri acara ini.
          Hubungi penyelenggara jika Anda perlu akses.
        </p>
        <Link
          to="/events"
          className="mt-6 inline-flex items-center gap-2 text-primary-600 text-sm font-medium hover:underline"
        >
          <ArrowLeft size={16} /> Kembali
        </Link>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500 font-medium">Acara tidak ditemukan</p>
        <Link
          to="/events"
          className="mt-4 inline-flex items-center gap-2 text-primary-600 text-sm font-medium hover:underline"
        >
          <ArrowLeft size={16} /> Kembali ke daftar acara
        </Link>
      </div>
    );
  }

  const canAccess = canAccessEvent(event, currentUserId);
  const cfg = EVENT_TYPE_CONFIG[event.type];
  const coverPhoto =
    galleryItems[0]?.photoUrl ?? null;

  const relatedNames = (event.personIds ?? [])
    .map((id) => personMap.get(id)?.fullName)
    .filter(Boolean) as string[];

  const attendeeNames = (event.attendeeIds ?? [])
    .map((id) => personMap.get(id)?.fullName)
    .filter(Boolean) as string[];

  const handleContribute = async (data: {
    mediaIds: string[];
    photoUrls?: string[];
    caption?: string;
  }) => {
    if (!currentUserId) return;
    await addContribution(currentUserId, data);
  };

  if (!canAccess) {
    return (
      <div className="max-w-lg mx-auto text-center py-20">
        <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
          <Lock className="text-gray-400" size={28} />
        </div>
        <h2 className="text-lg font-bold text-brand-700 mb-2">
          Acara Ini Terbatas
        </h2>
        <p className="text-sm text-gray-500 leading-relaxed">
          Hanya peserta terpilih yang dapat melihat galeri acara ini.
          Hubungi penyelenggara jika Anda perlu akses.
        </p>
        <Link
          to="/events"
          className="mt-6 inline-flex items-center gap-2 text-primary-600 text-sm font-medium hover:underline"
        >
          <ArrowLeft size={16} /> Kembali
        </Link>
      </div>
    );
  }

  return (
    <>
      {/* Back nav */}
      <button
        onClick={() => navigate('/events')}
        className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-brand-700 mb-5 transition-colors"
      >
        <ArrowLeft size={16} />
        Kembali ke Acara Keluarga
      </button>

      {/* Hero */}
      <div className="rounded-2xl overflow-hidden bg-white shadow-sm border border-gray-100 mb-6">
        <div className="relative h-48 sm:h-64 lg:h-80">
          {coverPhoto ? (
            <img
              src={coverPhoto}
              alt={event.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div
              className={`w-full h-full flex items-center justify-center ${cfg.bg}`}
            >
              <span className="text-6xl">{cfg.emoji}</span>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-7">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${cfg.bg} ${cfg.color}`}
              >
                {cfg.emoji} {cfg.label}
              </span>
              {isRestrictedEvent(event) ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-white/20 text-white backdrop-blur-sm">
                  <Lock size={11} /> Terbatas
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-white/20 text-white backdrop-blur-sm">
                  <Globe size={11} /> Terbuka
                </span>
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white leading-tight">
              {event.title}
            </h1>
          </div>
        </div>

        {/* Meta bar */}
        <div className="px-5 sm:px-7 py-4 grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm border-t border-gray-50">
          <div className="flex items-center gap-2 text-gray-600">
            <Calendar size={15} className="text-gray-400 flex-shrink-0" />
            <span>{formatDate(event.date)}</span>
          </div>
          {event.location && (
            <div className="flex items-center gap-2 text-gray-600">
              <MapPin size={15} className="text-gray-400 flex-shrink-0" />
              <span className="truncate">{event.location}</span>
            </div>
          )}
          <div className="flex items-center gap-2 text-gray-600">
            <Camera size={15} className="text-gray-400 flex-shrink-0" />
            <span>{galleryItems.length} foto di galeri</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main: Gallery */}
        <div className="lg:col-span-2 space-y-4">
          {/* Gallery header + filter */}
          <div className={`bg-white rounded-2xl border p-5 ${theme.accentBorder}`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div>
                <h2 className="text-lg font-bold text-brand-700">
                  Galeri Foto
                </h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  {filteredGallery.length} foto
                  {contributorFilter !== 'all' && ' dari kontributor ini'}
                </p>
              </div>
              <button
                onClick={() => setShowContribute(true)}
                className="inline-flex items-center gap-2 bg-primary-500 hover:bg-primary-600 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors self-start"
              >
                <Plus size={16} />
                Tambah Foto
              </button>
            </div>

            {/* Contributor filter pills */}
            {contributors.length > 0 && (
              <div className="flex items-center gap-2 overflow-x-auto pb-1 -mx-1 px-1">
                <button
                  onClick={() => setContributorFilter('all')}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold border whitespace-nowrap transition-all flex-shrink-0 ${
                    contributorFilter === 'all'
                      ? 'border-primary-500 bg-primary-500 text-white'
                      : 'border-gray-200 bg-white text-gray-600 hover:border-primary-300'
                  }`}
                >
                  <ImageIcon size={13} />
                  Semua ({galleryItems.length})
                </button>
                {contributors.map((c) => (
                  <button
                    key={c.contributorId}
                    onClick={() => setContributorFilter(c.contributorId)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold border whitespace-nowrap transition-all flex-shrink-0 ${
                      contributorFilter === c.contributorId
                        ? 'border-primary-500 bg-primary-50 text-primary-700'
                        : 'border-gray-200 bg-white text-gray-600 hover:border-primary-300'
                    }`}
                  >
                    <ContributorAvatar
                      name={c.name}
                      size="sm"
                      active={contributorFilter === c.contributorId}
                    />
                    {c.name.split(' ').slice(-1)[0]} ({c.count})
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Photo grid */}
          {filteredGallery.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 py-16 flex flex-col items-center text-center">
              <Camera className="text-gray-300 mb-3" size={40} />
              <p className="text-gray-500 font-medium">Belum ada foto</p>
              <p className="text-gray-400 text-sm mt-1">
                Jadilah yang pertama berkontribusi!
              </p>
              <button
                onClick={() => setShowContribute(true)}
                className="mt-4 inline-flex items-center gap-2 bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-xl text-sm font-semibold"
              >
                <Plus size={16} /> Tambah Foto Pertama
              </button>
            </div>
          ) : (
            <div className="columns-2 sm:columns-3 gap-3 space-y-3">
              {filteredGallery.map((item, idx) => (
                <GalleryTile
                  key={item.id}
                  item={item}
                  onClick={() => setLightboxIndex(idx)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Sidebar: Info */}
        <div className="space-y-4">
          {/* Description */}
          {event.description && (
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <h3 className="text-sm font-semibold text-brand-700 mb-2">
                Tentang Acara
              </h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                {event.description}
              </p>
            </div>
          )}

          {/* Related persons */}
          {relatedNames.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <h3 className="text-sm font-semibold text-brand-700 mb-3 flex items-center gap-2">
                <Users size={15} className="text-gray-400" />
                Anggota Terkait
              </h3>
              <div className="flex flex-wrap gap-2">
                {relatedNames.map((name) => (
                  <span
                    key={name}
                    className="px-3 py-1 rounded-full bg-gray-50 text-xs font-medium text-gray-600 border border-gray-100"
                  >
                    {name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Access info */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <h3 className="text-sm font-semibold text-brand-700 mb-3 flex items-center gap-2">
              {isRestrictedEvent(event) ? (
                <Lock size={15} className="text-amber-500" />
              ) : (
                <Globe size={15} className="text-primary-500" />
              )}
              Akses Galeri
            </h3>
            {isRestrictedEvent(event) ? (
              <>
                <p className="text-xs text-gray-500 mb-3 leading-relaxed">
                  Hanya peserta berikut yang dapat melihat dan menambah foto:
                </p>
                <div className="space-y-2">
                  {attendeeNames.map((name) => (
                    <div
                      key={name}
                      className="flex items-center gap-2 text-sm text-gray-700"
                    >
                      <ContributorAvatar name={name} size="sm" />
                      {name}
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <p className="text-xs text-gray-500 leading-relaxed">
                Semua anggota keluarga dapat melihat galeri dan berkontribusi
                foto ke acara ini.
              </p>
            )}
          </div>

          {/* Contributors leaderboard */}
          {contributors.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <h3 className="text-sm font-semibold text-brand-700 mb-3">
                Kontributor Foto
              </h3>
              <div className="space-y-2.5">
                {contributors.map((c, i) => (
                  <button
                    key={c.contributorId}
                    onClick={() => setContributorFilter(c.contributorId)}
                    className={`w-full flex items-center gap-3 p-2 rounded-xl transition-colors text-left ${
                      contributorFilter === c.contributorId
                        ? 'bg-primary-50'
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    <span className="text-xs font-bold text-gray-300 w-4">
                      {i + 1}
                    </span>
                    <ContributorAvatar name={c.name} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-brand-700 truncate">
                        {c.name}
                      </p>
                    </div>
                    <span className="text-xs font-semibold text-primary-600 bg-primary-50 px-2 py-0.5 rounded-full">
                      {c.count} foto
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Lightbox */}
      {lightboxIndex !== null && (
        <GalleryLightbox
          items={filteredGallery}
          currentIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onNavigate={setLightboxIndex}
        />
      )}

      {/* Contribute modal */}
      <ContributePhotoModal
        isOpen={showContribute}
        onClose={() => setShowContribute(false)}
        onSubmit={handleContribute}
        contributorName={me?.fullName ?? 'Saya'}
        eventId={eventId}
      />
    </>
  );
}

function GalleryTile({
  item,
  onClick,
}: {
  item: GalleryItem;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="break-inside-avoid w-full rounded-xl overflow-hidden group relative bg-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-400"
    >
      <img
        src={item.photoUrl}
        alt={item.caption ?? 'Foto acara'}
        className="w-full object-cover group-hover:scale-105 transition-transform duration-300"
        loading="lazy"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      <div className="absolute bottom-0 left-0 right-0 p-2.5 opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="flex items-center gap-1.5">
          <ContributorAvatar name={item.contributorName} size="sm" />
          <div className="min-w-0 text-left">
            <p className="text-[10px] font-semibold text-white truncate">
              {item.contributorName}
            </p>
            {item.caption && (
              <p className="text-[9px] text-white/70 truncate">
                {item.caption}
              </p>
            )}
          </div>
        </div>
      </div>
    </button>
  );
}
