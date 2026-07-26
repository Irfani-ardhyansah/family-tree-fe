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
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-2 flex items-center gap-2 text-sm min-w-0">
        <span className="text-gray-500 hidden sm:inline flex-shrink-0">
          Melihat data keluarga:
        </span>
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-full font-semibold min-w-0 max-w-full ${theme.accentBg} ${theme.accentText} border ${theme.accentBorder}`}
        >
          {perspective === 'self' ? (
            <User size={14} className="flex-shrink-0" />
          ) : (
            <Heart size={14} className="text-secondary-500 flex-shrink-0" />
          )}
          <span className="truncate">{focusLabel}</span>
          <span className="opacity-60 font-normal flex-shrink-0">
            ({focusShortLabel})
          </span>
        </span>
        <span className="text-xs text-gray-400 hidden md:inline flex-shrink-0">
          Semua halaman keluarga mengikuti pilihan ini
        </span>
      </div>
    </div>
  );
}
