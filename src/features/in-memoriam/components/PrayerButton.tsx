import { useState } from 'react';
import { Heart } from 'react-feather';

type PrayerButtonProps = {
  deceasedId: string;
  authorId: string;
  authorName: string;
  prayerCount: number;
  hasPrayed: boolean;
  onPray: () => void;
};

export function PrayerButton({
  prayerCount,
  hasPrayed,
  onPray,
}: PrayerButtonProps) {
  const [justPrayed, setJustPrayed] = useState(false);

  const handleClick = () => {
    if (hasPrayed || justPrayed) return;
    onPray();
    setJustPrayed(true);
  };

  const active = hasPrayed || justPrayed;

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={active}
      className={`inline-flex items-center gap-2.5 px-6 py-3 rounded-xl text-sm font-semibold transition-all ${
        active
          ? 'bg-slate-100 text-slate-500 border border-slate-200 cursor-default'
          : 'bg-slate-700 hover:bg-slate-800 text-white shadow-sm hover:shadow-md'
      }`}
    >
      <Heart
        size={18}
        className={active ? 'text-slate-400 fill-slate-300' : 'fill-white/20'}
      />
      {active ? 'Sudah Berdoa' : 'Saya Berdoa'}
      <span
        className={`ml-1 px-2 py-0.5 rounded-full text-xs ${
          active ? 'bg-slate-200 text-slate-600' : 'bg-white/20 text-white'
        }`}
      >
        {prayerCount + (justPrayed && !hasPrayed ? 1 : 0)}
      </span>
    </button>
  );
}
