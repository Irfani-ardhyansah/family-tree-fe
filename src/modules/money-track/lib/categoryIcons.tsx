import type { ComponentType, SVGAttributes } from 'react';
import {
  Activity,
  Award,
  BookOpen,
  Box,
  Briefcase,
  Camera,
  Coffee,
  CreditCard,
  DollarSign,
  Droplet,
  Film,
  Gift,
  Globe,
  Heart,
  Home,
  Key,
  MapPin,
  Monitor,
  Music,
  Package,
  Percent,
  Phone,
  PieChart,
  ShoppingBag,
  ShoppingCart,
  Smartphone,
  Star,
  Sun,
  Tag,
  Tool,
  TrendingUp,
  Truck,
  Tv,
  Umbrella,
  Users,
  Wifi,
  Zap,
} from 'react-feather';

type FeatherProps = SVGAttributes<SVGElement> & { size?: string | number };

export type CategoryIconOption = {
  id: string;
  label: string;
  Icon: ComponentType<FeatherProps>;
};

/** Kurasi ikon Feather (MIT) untuk kategori Money Track. */
export const CATEGORY_ICON_OPTIONS: CategoryIconOption[] = [
  { id: 'coffee', label: 'Makan/minum', Icon: Coffee },
  { id: 'shopping-cart', label: 'Belanja', Icon: ShoppingCart },
  { id: 'shopping-bag', label: 'Tas belanja', Icon: ShoppingBag },
  { id: 'truck', label: 'Transport', Icon: Truck },
  { id: 'map-pin', label: 'Lokasi', Icon: MapPin },
  { id: 'home', label: 'Rumah', Icon: Home },
  { id: 'credit-card', label: 'Kartu/tagihan', Icon: CreditCard },
  { id: 'dollar-sign', label: 'Uang', Icon: DollarSign },
  { id: 'percent', label: 'Bunga/%', Icon: Percent },
  { id: 'trending-up', label: 'Investasi', Icon: TrendingUp },
  { id: 'pie-chart', label: 'Alokasi', Icon: PieChart },
  { id: 'briefcase', label: 'Kerja/gaji', Icon: Briefcase },
  { id: 'monitor', label: 'Freelance/IT', Icon: Monitor },
  { id: 'smartphone', label: 'Ponsel', Icon: Smartphone },
  { id: 'wifi', label: 'Internet', Icon: Wifi },
  { id: 'film', label: 'Hiburan', Icon: Film },
  { id: 'tv', label: 'Streaming', Icon: Tv },
  { id: 'music', label: 'Musik', Icon: Music },
  { id: 'camera', label: 'Foto/hobi', Icon: Camera },
  { id: 'heart', label: 'Kesehatan', Icon: Heart },
  { id: 'activity', label: 'Olahraga', Icon: Activity },
  { id: 'book-open', label: 'Pendidikan', Icon: BookOpen },
  { id: 'gift', label: 'Hadiah/bonus', Icon: Gift },
  { id: 'users', label: 'Keluarga', Icon: Users },
  { id: 'phone', label: 'Komunikasi', Icon: Phone },
  { id: 'droplet', label: 'Utilitas', Icon: Droplet },
  { id: 'zap', label: 'Listrik', Icon: Zap },
  { id: 'sun', label: 'Liburan', Icon: Sun },
  { id: 'umbrella', label: 'Asuransi', Icon: Umbrella },
  { id: 'key', label: 'Sewa/kunci', Icon: Key },
  { id: 'tool', label: 'Perawatan', Icon: Tool },
  { id: 'package', label: 'Paket', Icon: Package },
  { id: 'box', label: 'Barang', Icon: Box },
  { id: 'globe', label: 'Travel', Icon: Globe },
  { id: 'star', label: 'Favorit', Icon: Star },
  { id: 'award', label: 'Prestasi', Icon: Award },
  { id: 'tag', label: 'Lainnya', Icon: Tag },
];

const ICON_BY_ID = new Map(
  CATEGORY_ICON_OPTIONS.map((opt) => [opt.id, opt] as const),
);

export function isCategoryIconId(value: string | null | undefined): boolean {
  if (!value) return false;
  return ICON_BY_ID.has(value.trim().toLowerCase());
}

export function CategoryIcon({
  icon,
  size = 18,
  className = '',
  fallback = '🏷️',
}: {
  icon?: string | null;
  size?: number;
  className?: string;
  fallback?: string;
}) {
  const raw = icon?.trim() ?? '';
  if (!raw) {
    return (
      <span className={className} style={{ fontSize: size * 0.9 }} aria-hidden>
        {fallback}
      </span>
    );
  }

  const option = ICON_BY_ID.get(raw.toLowerCase());
  if (option) {
    const Icon = option.Icon;
    return <Icon size={size} className={className} aria-hidden />;
  }

  // Kompatibel data lama (emoji / teks bebas).
  return (
    <span className={className} style={{ fontSize: size * 0.9 }} aria-hidden>
      {raw}
    </span>
  );
}

export function CategoryIconPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (iconId: string) => void;
}) {
  const selected = value.trim().toLowerCase();

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <span className="text-[11px] font-bold uppercase tracking-wide text-money-faint">
          Icon
        </span>
        {selected ? (
          <button
            type="button"
            onClick={() => onChange('')}
            className="text-[11px] font-semibold text-money-muted hover:text-money-ink"
          >
            Hapus pilihan
          </button>
        ) : null}
      </div>
      <div className="grid max-h-44 grid-cols-6 gap-1.5 overflow-y-auto rounded-[10px] border border-money-border bg-money-soft/40 p-2 sm:grid-cols-8">
        {CATEGORY_ICON_OPTIONS.map((opt) => {
          const active = selected === opt.id;
          const Icon = opt.Icon;
          return (
            <button
              key={opt.id}
              type="button"
              title={opt.label}
              onClick={() => onChange(opt.id)}
              className={[
                'flex h-9 w-full items-center justify-center rounded-lg transition-colors',
                active
                  ? 'bg-money-brown text-white shadow-sm'
                  : 'bg-money-surface text-money-ink hover:bg-money-brown-soft hover:text-money-brown-deep',
              ].join(' ')}
            >
              <Icon size={16} />
            </button>
          );
        })}
      </div>
      <p className="mt-1.5 text-[11.5px] text-money-faint">
        Ikon Feather (open source, MIT) — pilih satu untuk kategori ini.
      </p>
    </div>
  );
}
