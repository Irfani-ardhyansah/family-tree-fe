import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useFamily } from '@/context/FamilyDataContext';
import { useFamilyPerspective } from '@/context/FamilyPerspectiveContext';
import {
  canAccessMemorial,
  getAlmarhumLabel,
  markPrayerSession,
} from '@/utils/memoriamAccess';

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
  const { persons } = useFamily();
  const { me } = useFamilyPerspective();
  const deceased = persons.find((p) => p.id === personId);

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
    if (!deceased) navigate('/in-memoriam', { replace: true });
    else if (deceased.status !== 'deceased') navigate('/in-memoriam', { replace: true });
    else if (!canAccessMemorial(me?.id, deceased.id, persons))
      navigate('/in-memoriam', { replace: true });
  }, [deceased, me?.id, persons, navigate]);

  if (!deceased) return null;

  const label = getAlmarhumLabel(deceased.gender);

  const handleContinue = () => {
    markPrayerSession(deceased.id);
    navigate(`/in-memoriam/${deceased.id}`, { replace: true });
  };

  return (
    <div className="min-h-screen bg-[#f8f7f4] flex flex-col items-center justify-center px-6 py-12">
      <div className="max-w-lg w-full text-center space-y-8">
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
            className="text-2xl sm:text-3xl leading-loose text-slate-800 font-serif"
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
            className="text-2xl sm:text-3xl leading-loose text-slate-800 font-serif"
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
          className={`mt-4 w-full sm:w-auto px-10 py-3.5 rounded-xl bg-slate-700 hover:bg-slate-800 text-white text-sm font-semibold transition-all duration-700 shadow-sm ${
            visibleStep >= 4 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}
        >
          Lanjutkan ke Kenangan
        </button>
      </div>
    </div>
  );
}
