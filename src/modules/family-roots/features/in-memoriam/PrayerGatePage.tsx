import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'react-feather';
import { useFamilyPerspective } from '@/modules/family-roots/context/FamilyPerspectiveContext';
import { useFocusPersonId } from '@/shared/hooks/useFocusPersonId';
import { useMemorialDetail } from '@/shared/hooks/useMemorialDetail';
import {
  canAccessMemorial,
  getAlmarhumLabel,
  markPrayerSession,
} from '@/shared/utils/memoriamAccess';

const PRAYERS = [
  {
    arabic: 'رَبَّنَا اغْفِرْ لَنَا وَلِإِخْوَانِنَا الَّذِينَ سَبَقُونَا بِالْإِيمَانِ',
    translation:
      'Wahai Rabb kami, ampunilah kami dan saudara-saudara kami yang telah mendahului kami dalam keimanan.',
    ref: 'QS. Al-Hasyr: 10',
  },
  {
    arabic: 'وَاسْتَغْفِرْ لِذَنْبِكَ وَلِلْمُؤْمِنِينَ وَالْمُؤْمِنَاتِ',
    translation:
      'Dan mintaampunlah atas dosa-dosamu dan juga orang-orang beriman laki-laki dan perempuan.',
    ref: 'QS. Muhammad: 19',
  },
];

export function PrayerGatePage() {
  const { personId } = useParams<{ personId: string }>();
  const navigate = useNavigate();
  const { me } = useFamilyPerspective();
  const focusPersonId = useFocusPersonId();
  const {
    source,
    deceased,
    allPersons: persons,
    isLoading,
    error,
    accessForbidden,
  } = useMemorialDetail(personId, focusPersonId);

  const [visibleStep, setVisibleStep] = useState(0);

  useEffect(() => {
    if (!deceased) return;
    const timers = [
      setTimeout(() => setVisibleStep(1), 800),
      setTimeout(() => setVisibleStep(2), 2000),
      setTimeout(() => setVisibleStep(3), 3200),
      setTimeout(() => setVisibleStep(4), 4400),
    ];
    return () => timers.forEach(clearTimeout);
  }, [deceased]);

  useEffect(() => {
    if (isLoading || error || accessForbidden) return;
    // Jangan redirect saat deceased masih null tanpa error — fetch mungkin belum selesai
    if (!deceased) return;

    if (deceased.status !== 'deceased') {
      navigate('/roots/memoriam', { replace: true });
      return;
    }

    // Mode mock: cek koneksi di graph lokal. Mode API: detail yang sukses = sudah boleh akses.
    if (
      source === 'mock' &&
      !canAccessMemorial(me?.id, deceased.id, persons)
    ) {
      navigate('/roots/memoriam', { replace: true });
    }
  }, [
    source,
    deceased,
    me?.id,
    persons,
    navigate,
    isLoading,
    error,
    accessForbidden,
  ]);

  if (isLoading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] bg-[#f8f7f4] flex items-center justify-center text-slate-500">
        Memuat…
      </div>
    );
  }

  if (error || accessForbidden) {
    return (
      <div className="min-h-[calc(100vh-4rem)] bg-[#f8f7f4] flex items-center justify-center px-6">
        <div className="text-center max-w-md">
          <p className="text-red-600 font-medium">
            {accessForbidden
              ? 'Anda tidak memiliki akses ke kenangan ini'
              : error}
          </p>
          <Link
            to="/roots/memoriam"
            className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-800"
          >
            <ArrowLeft size={16} />
            Kembali ke daftar
          </Link>
        </div>
      </div>
    );
  }

  if (!deceased) return null;

  const label = getAlmarhumLabel(deceased.gender);

  const handleContinue = () => {
    markPrayerSession(deceased.id);
    navigate(`/roots/memoriam/${deceased.id}`, { replace: true });
  };

  return (
    <div className="min-h-[calc(100dvh-4rem)] -mx-3 sm:-mx-6 lg:-mx-8 -my-4 sm:-my-6 lg:-my-8 bg-[#f8f7f4] flex flex-col items-center justify-center px-4 sm:px-6 py-10 sm:py-12">
      <div className="max-w-lg w-full text-center space-y-6 sm:space-y-8">
        {/* Fade-in intro */}
        <p
          className={`text-sm text-slate-500 tracking-wide transition-all duration-1000 ${
            visibleStep >= 1 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}
        >
          Mari sejenak kita doakan {label.toLowerCase()}
        </p>

        <h1
          className={`text-xl sm:text-2xl font-bold text-slate-700 transition-all duration-1000 delay-100 ${
            visibleStep >= 1 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}
        >
          {deceased.fullName}
        </h1>

        {/* Prayer 1 */}
        <div
          className={`space-y-3 transition-all duration-1000 ${
            visibleStep >= 2 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
          }`}
        >
          <p
            className="text-xl sm:text-3xl leading-relaxed sm:leading-loose text-slate-800 font-serif"
            dir="rtl"
          >
            {PRAYERS[0].arabic}
          </p>
          <p className="text-sm text-slate-600 leading-relaxed italic">
            "{PRAYERS[0].translation}"
          </p>
          <p className="text-xs text-slate-400">{PRAYERS[0].ref}</p>
        </div>

        <div className="w-16 h-px bg-slate-200 mx-auto" />

        {/* Prayer 2 */}
        <div
          className={`space-y-3 transition-all duration-1000 ${
            visibleStep >= 3 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
          }`}
        >
          <p
            className="text-xl sm:text-3xl leading-relaxed sm:leading-loose text-slate-800 font-serif"
            dir="rtl"
          >
            {PRAYERS[1].arabic}
          </p>
          <p className="text-sm text-slate-600 leading-relaxed italic">
            "{PRAYERS[1].translation}"
          </p>
          <p className="text-xs text-slate-400">{PRAYERS[1].ref}</p>
        </div>

        {/* Button */}
        <button
          onClick={handleContinue}
          className={`mt-4 w-full sm:w-auto px-10 py-3.5 rounded-xl bg-slate-700 hover:bg-slate-800 text-white text-sm font-semibold transition-all duration-700 shadow-sm min-h-[48px] ${
            visibleStep >= 4 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}
        >
          Lanjutkan ke Kenangan
        </button>
      </div>
    </div>
  );
}
