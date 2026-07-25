import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  BookOpen,
  Plus,
  Image as ImageIcon,
  Calendar,
  Lock,
} from 'react-feather';
import { useFamilyPerspective } from '@/context/FamilyPerspectiveContext';
import { useFocusPersonId } from '@/hooks/useFocusPersonId';
import { useMemorialDetail } from '@/hooks/useMemorialDetail';
import {
  buildMemorialGallery,
  formatLifeSpan,
  getAgeAtDeath,
  getAlmarhumLabel,
  getYearsSinceDeath,
  groupGalleryByAuthor,
  hasPrayedThisSession,
  isDeceasedMuslim,
} from '@/utils/memoriamAccess';
import type { GalleryItem } from '@/utils/eventAccess';
import { GalleryLightbox } from '@/features/events/components/GalleryLightbox';
import type { MemoriamTribute } from '@/types/memoriam';
import { DeleteConfirmDialog } from '@/features/family-data/components/DeleteConfirmDialog';
import { TributeCard } from './components/TributeCard';
import { AddTributeModal } from './components/AddTributeModal';
import { PrayerButton } from './components/PrayerButton';

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
  active,
}: {
  name: string;
  active?: boolean;
}) {
  return (
    <div
      className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 transition-all ${
        active
          ? 'bg-slate-700 text-white ring-2 ring-slate-400 ring-offset-1'
          : 'bg-slate-200 text-slate-600'
      }`}
    >
      {getInitials(name)}
    </div>
  );
}

type MemorialTab = 'stories' | 'gallery';

export function MemorialPage() {
  const { personId } = useParams<{ personId: string }>();
  const navigate = useNavigate();
  const { me } = useFamilyPerspective();
  const focusPersonId = useFocusPersonId();

  const {
    deceased,
    allPersons: persons,
    tributes,
    prayers,
    hasPrayed,
    isLoading,
    error,
    accessForbidden,
    addTribute,
    saveTribute,
    removeTribute,
    addPrayer,
  } = useMemorialDetail(personId, focusPersonId);

  const currentUserId = me?.id;

  const personMap = useMemo(
    () => new Map(persons.map((p) => [p.id, p])),
    [persons],
  );
  const getPersonName = (id: string) =>
    personMap.get(id)?.fullName ?? 'Anggota';

  const [authorFilter, setAuthorFilter] = useState<string | 'all'>('all');
  const [activeTab, setActiveTab] = useState<MemorialTab>('stories');
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [showTributeModal, setShowTributeModal] = useState(false);
  const [tributeToEdit, setTributeToEdit] = useState<MemoriamTribute | null>(
    null,
  );
  const [deleteTarget, setDeleteTarget] = useState<MemoriamTribute | null>(
    null,
  );

  const tributesList = deceased ? tributes : [];
  const prayersList = deceased ? prayers : [];

  const photoCount = useMemo(
    () => tributesList.reduce((sum, t) => sum + t.photoUrls.length, 0),
    [tributesList],
  );

  const galleryPhotos = useMemo(() => {
    if (activeTab !== 'gallery' || !deceased) return [];
    return buildMemorialGallery(tributesList, getPersonName);
  }, [activeTab, deceased, tributesList, personMap]);

  const galleryAuthors = useMemo(
    () => groupGalleryByAuthor(galleryPhotos),
    [galleryPhotos],
  );

  const filteredGallery = useMemo(() => {
    if (authorFilter === 'all') return galleryPhotos;
    return galleryPhotos.filter((p) => p.authorId === authorFilter);
  }, [galleryPhotos, authorFilter]);

  const lightboxItems: GalleryItem[] = useMemo(() => {
    if (lightboxIndex === null || !deceased) return [];
    return buildMemorialGallery(tributesList, getPersonName).map((p) => ({
      id: p.id,
      photoUrl: p.photoUrl,
      contributorId: p.authorId,
      contributorName: p.authorName,
      caption: p.caption,
      createdAt: p.createdAt,
    }));
  }, [lightboxIndex, deceased, tributesList, personMap]);

  useEffect(() => {
    if (isLoading || error || accessForbidden) return;
    // Tunggu data selesai — jangan bounce ke list saat fetch masih jalan
    if (!deceased) return;

    if (deceased.status !== 'deceased') {
      navigate('/in-memoriam', { replace: true });
      return;
    }
    if (
      isDeceasedMuslim(deceased) &&
      !hasPrayedThisSession(deceased.id)
    ) {
      navigate(`/in-memoriam/${deceased.id}/doa`, { replace: true });
    }
  }, [deceased, navigate, isLoading, error, accessForbidden]);

  if (isLoading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] bg-[#f8f7f4] flex items-center justify-center text-slate-500">
        Memuat halaman kenangan…
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[calc(100vh-4rem)] bg-[#f8f7f4] flex items-center justify-center px-6">
        <div className="text-center max-w-md">
          <p className="text-red-600 font-medium">{error}</p>
          <Link
            to="/in-memoriam"
            className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-800"
          >
            <ArrowLeft size={16} />
            Kembali ke daftar
          </Link>
        </div>
      </div>
    );
  }

  if (!deceased || deceased.status !== 'deceased') return null;

  if (accessForbidden) {
    return (
      <div className="min-h-[calc(100vh-4rem)] bg-[#f8f7f4] flex items-center justify-center px-6">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
            <Lock className="text-slate-400" size={28} />
          </div>
          <p className="text-slate-600 font-medium">
            Anda tidak memiliki akses ke kenangan ini
          </p>
          <p className="text-sm text-slate-400 mt-2">
            Hanya anggota keluarga yang terhubung di pohon dapat melihat halaman
            kenangan.
          </p>
          <Link
            to="/in-memoriam"
            className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-800"
          >
            <ArrowLeft size={16} />
            Kembali ke daftar
          </Link>
        </div>
      </div>
    );
  }

  const label = getAlmarhumLabel(deceased.gender);
  const years = getYearsSinceDeath(deceased.deathDate);
  const age = getAgeAtDeath(deceased.birthDate, deceased.deathDate);
  const userHasPrayed = currentUserId
    ? hasPrayed
    : false;

  const openAddTribute = () => {
    setTributeToEdit(null);
    setShowTributeModal(true);
  };

  const openEditTribute = (tribute: MemoriamTribute) => {
    setTributeToEdit(tribute);
    setShowTributeModal(true);
  };

  const handleSaveTribute = async (data: {
    content: string;
    mediaIds?: string[];
    photoUrls?: string[];
  }) => {
    if (tributeToEdit) {
      await saveTribute(tributeToEdit.id, data);
      return;
    }
    if (!currentUserId) return;
    await addTribute(currentUserId, data);
  };

  const handlePray = async () => {
    if (!currentUserId) return;
    await addPrayer(currentUserId);
  };

  const openLightbox = (photoUrl: string) => {
    const photos = buildMemorialGallery(tributesList, getPersonName);
    const idx = photos.findIndex((p) => p.photoUrl === photoUrl);
    if (idx >= 0) setLightboxIndex(idx);
  };

  const handleTabChange = (tab: MemorialTab) => {
    setActiveTab(tab);
    setLightboxIndex(null);
    if (tab === 'stories') setAuthorFilter('all');
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#f8f7f4]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        {/* Back */}
        <Link
          to="/in-memoriam"
          className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 mb-6 transition-colors"
        >
          <ArrowLeft size={16} />
          Semua Kenangan
        </Link>

        {/* Profile header */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden mb-8">
          <div className="h-24 sm:h-32 bg-gradient-to-r from-slate-600 to-slate-500" />
          <div className="px-6 pb-6 -mt-12 sm:-mt-14">
            <div className="flex flex-col sm:flex-row sm:items-end gap-4">
              {deceased.photoUrl ? (
                <img
                  src={deceased.photoUrl}
                  alt={deceased.fullName}
                  className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl object-cover border-4 border-white shadow-md grayscale"
                />
              ) : (
                <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-slate-200 border-4 border-white shadow-md flex items-center justify-center text-2xl font-bold text-slate-500">
                  {getInitials(deceased.fullName)}
                </div>
              )}
              <div className="flex-1 pb-1">
                <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">
                  {label}
                </p>
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-800">
                  {deceased.fullName}
                </h1>
                {deceased.nickname && (
                  <p className="text-sm text-slate-500 mt-0.5">
                    "{deceased.nickname}"
                  </p>
                )}
              </div>
            </div>

            <div className="mt-5 flex flex-wrap gap-3 text-sm text-slate-600">
              <span className="inline-flex items-center gap-1.5">
                <Calendar size={15} className="text-slate-400" />
                {formatLifeSpan(deceased.birthDate, deceased.deathDate)}
              </span>
              {age !== null && (
                <span className="text-slate-500">Usia {age} tahun</span>
              )}
              {deceased.generationLabel && (
                <span className="text-slate-500">{deceased.generationLabel}</span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-3 mt-4">
              {years !== null && years > 0 && (
                <span className="inline-flex items-center px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-semibold">
                  {years} tahun telah berlalu
                </span>
              )}
              {isDeceasedMuslim(deceased) && currentUserId && (
                <PrayerButton
                  deceasedId={deceased.id}
                  authorId={currentUserId}
                  authorName={me?.fullName ?? 'Saya'}
                  prayerCount={prayersList.length}
                  hasPrayed={userHasPrayed}
                  onPray={handlePray}
                />
              )}
            </div>
          </div>
        </div>

        {/* Tab toggle */}
        <div className="flex gap-1 p-1 rounded-xl bg-white border border-slate-200 shadow-sm mb-6">
          <button
            type="button"
            onClick={() => handleTabChange('stories')}
            className={`flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-semibold transition-all ${
              activeTab === 'stories'
                ? 'bg-slate-700 text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
            }`}
          >
            <BookOpen size={16} />
            <span>Kenangan & Ucapan</span>
            <span
              className={`px-2 py-0.5 rounded-full text-xs ${
                activeTab === 'stories'
                  ? 'bg-white/20 text-white'
                  : 'bg-slate-100 text-slate-500'
              }`}
            >
              {tributesList.length}
            </span>
          </button>
          <button
            type="button"
            onClick={() => handleTabChange('gallery')}
            className={`flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-semibold transition-all ${
              activeTab === 'gallery'
                ? 'bg-slate-700 text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
            }`}
          >
            <ImageIcon size={16} />
            <span className="hidden sm:inline">Galeri Kenangan</span>
            <span className="sm:hidden">Galeri</span>
            <span
              className={`px-2 py-0.5 rounded-full text-xs ${
                activeTab === 'gallery'
                  ? 'bg-white/20 text-white'
                  : 'bg-slate-100 text-slate-500'
              }`}
            >
              {photoCount}
            </span>
          </button>
        </div>

        {/* Gallery */}
        {activeTab === 'gallery' && (
          <section className="mb-8">
            {galleryPhotos.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-2xl border border-slate-100">
                <ImageIcon size={36} className="mx-auto text-slate-300 mb-3" />
                <p className="text-slate-600 font-medium">Belum ada foto kenangan</p>
                <p className="text-sm text-slate-400 mt-1">
                  Foto akan muncul ketika ada kenangan yang menyertakan gambar
                </p>
              </div>
            ) : (
              <>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <ImageIcon size={20} className="text-slate-500" />
                Galeri Kenangan
              </h2>
              <span className="text-xs text-slate-400">
                {galleryPhotos.length} foto
              </span>
            </div>

            {galleryAuthors.length > 1 && (
              <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-4 scrollbar-hide">
                <button
                  type="button"
                  onClick={() => setAuthorFilter('all')}
                  className={`flex-shrink-0 inline-flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                    authorFilter === 'all'
                      ? 'bg-slate-700 text-white'
                      : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-300'
                  }`}
                >
                  Semua
                  <span className="opacity-70">{galleryPhotos.length}</span>
                </button>
                {galleryAuthors.map(({ authorId, name, count }) => (
                  <button
                    key={authorId}
                    type="button"
                    onClick={() => setAuthorFilter(authorId)}
                    className={`flex-shrink-0 inline-flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                      authorFilter === authorId
                        ? 'bg-slate-700 text-white'
                        : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <ContributorAvatar
                      name={name}
                      active={authorFilter === authorId}
                    />
                    {name}
                    <span className="opacity-70">{count}</span>
                  </button>
                ))}
              </div>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
              {filteredGallery.map((photo) => (
                <button
                  key={photo.id}
                  type="button"
                  onClick={() => {
                    const allPhotos = buildMemorialGallery(tributesList, getPersonName);
                    const idx = allPhotos.findIndex((p) => p.id === photo.id);
                    if (idx >= 0) setLightboxIndex(idx);
                  }}
                  className="aspect-square rounded-xl overflow-hidden bg-slate-100 hover:opacity-90 transition-opacity focus:outline-none focus:ring-2 focus:ring-slate-400"
                >
                  <img
                    src={photo.photoUrl}
                    alt={`Kenangan oleh ${photo.authorName}`}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </button>
              ))}
            </div>
              </>
            )}
          </section>
        )}

        {/* Tributes timeline */}
        {activeTab === 'stories' && (
        <section>
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <BookOpen size={20} className="text-slate-500" />
              Kenangan & Ucapan
              <span className="text-sm font-normal text-slate-400">
                ({tributesList.length})
              </span>
            </h2>
            {currentUserId && (
              <button
                type="button"
                onClick={openAddTribute}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-700 hover:bg-slate-800 text-white text-sm font-semibold shadow-sm transition-colors"
              >
                <Plus size={16} />
                Tulis Kenangan
              </button>
            )}
          </div>

          {tributesList.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-slate-100">
              <BookOpen size={36} className="mx-auto text-slate-300 mb-3" />
              <p className="text-slate-600 font-medium">Belum ada kenangan</p>
              <p className="text-sm text-slate-400 mt-1">
                Jadilah yang pertama menuliskan kenangan untuk {label.toLowerCase()}{' '}
                {deceased.fullName}
              </p>
              {currentUserId && (
                <button
                  type="button"
                  onClick={openAddTribute}
                  className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-700 hover:bg-slate-800 text-white text-sm font-semibold"
                >
                  <Plus size={16} />
                  Tulis Kenangan Pertama
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {tributesList.map((tribute) => (
                <TributeCard
                  key={tribute.id}
                  tribute={tribute}
                  authorName={getPersonName(tribute.authorId)}
                  onPhotoClick={openLightbox}
                  onEdit={
                    tribute.canManage
                      ? () => openEditTribute(tribute)
                      : undefined
                  }
                  onDelete={
                    tribute.canManage
                      ? () => setDeleteTarget(tribute)
                      : undefined
                  }
                />
              ))}
            </div>
          )}
        </section>
        )}
      </div>

      {lightboxIndex !== null && (
        <GalleryLightbox
          items={lightboxItems}
          currentIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onNavigate={setLightboxIndex}
        />
      )}

      <AddTributeModal
        isOpen={showTributeModal}
        onClose={() => {
          setShowTributeModal(false);
          setTributeToEdit(null);
        }}
        onSubmit={handleSaveTribute}
        deceasedName={deceased.fullName}
        authorName={me?.fullName ?? 'Saya'}
        deceasedId={personId}
        tributeToEdit={tributeToEdit}
      />

      <DeleteConfirmDialog
        isOpen={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={async () => {
          if (deleteTarget) await removeTribute(deleteTarget.id);
        }}
        personName="kenangan ini"
      />
    </div>
  );
}
