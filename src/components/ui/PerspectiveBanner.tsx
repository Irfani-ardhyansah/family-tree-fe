import { User, Heart } from 'react-feather';
import { useFamilyPerspective } from '@/context/FamilyPerspectiveContext';

export function PerspectiveBanner() {
  const {
    perspective,
    focusLabel,
    focusShortLabel,
    theme,
  } = useFamilyPerspective();

  return (
    <div
      className={`border-b ${theme.bannerBorder} ${theme.bannerBg} transition-colors duration-300`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 flex items-center gap-2 text-sm">
        <span className="text-gray-500 hidden sm:inline">Melihat data keluarga:</span>
        <span
          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-semibold ${theme.accentBg} ${theme.accentText} border ${theme.accentBorder}`}
        >
          {perspective === 'self' ? (
            <User size={14} />
          ) : (
            <Heart size={14} className="text-secondary-500" />
          )}
          <span>{focusLabel}</span>
          <span className="opacity-60 font-normal">({focusShortLabel})</span>
        </span>
        <span className="text-xs text-gray-400 hidden md:inline">
          Semua halaman keluarga mengikuti pilihan ini
        </span>
      </div>
    </div>
  );
}
