import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  GitBranch,
  Calendar,
  BookOpen,
  MapPin,
  Home,
  FileText,
  Activity,
  CreditCard,
  Star,
  Repeat,
  Box,
  ShoppingCart,
  ChevronDown,
  LogOut,
  Coffee,
} from 'react-feather';
import { useAuth } from '@/shared/context/AuthContext';
import {
  appPaths,
  corePaths,
  householdPaths,
  moneyPaths,
  rootsPaths,
} from '@/shared/routes';
import { shortPersonName } from '@/shared/utils/personDisplayName';

type ModuleStatus = 'in-dev' | 'planned' | 'ready';

type ModuleFeature = {
  label: string;
  icon: typeof GitBranch;
};

type ModuleCard = {
  id: string;
  title: string;
  subtitle: string;
  to: string;
  status: ModuleStatus;
  accent: string;
  iconWrap: string;
  iconColor: string;
  Icon: typeof GitBranch;
  features: ModuleFeature[];
};

const STATUS_STYLES: Record<
  ModuleStatus,
  { label: string; className: string }
> = {
  'in-dev': {
    label: 'In dev',
    className: 'bg-amber-700/80 text-amber-100',
  },
  planned: {
    label: 'Planned',
    className: 'bg-slate-700 text-slate-200',
  },
  ready: {
    label: 'Ready',
    className: 'bg-emerald-700/90 text-emerald-100',
  },
};

const MODULES: ModuleCard[] = [
  {
    id: 'roots',
    title: 'Family Roots',
    subtitle: 'Keluarga besar',
    to: rootsPaths.home,
    status: 'in-dev',
    accent: 'border-t-emerald-500',
    iconWrap: 'bg-emerald-500/15',
    iconColor: 'text-emerald-400',
    Icon: GitBranch,
    features: [
      { label: 'Silsilah keluarga', icon: GitBranch },
      { label: 'Acara & gathering', icon: Calendar },
      { label: 'Memoriam', icon: BookOpen },
      { label: 'Peta alamat', icon: MapPin },
    ],
  },
  {
    id: 'core',
    title: 'Family Core',
    subtitle: 'Keluarga inti',
    to: corePaths.home,
    status: 'planned',
    accent: 'border-t-sky-500',
    iconWrap: 'bg-sky-500/15',
    iconColor: 'text-sky-400',
    Icon: Home,
    features: [
      { label: 'Dokumen penting', icon: FileText },
      { label: 'Health tracker', icon: Activity },
      { label: 'Family calendar', icon: Calendar },
    ],
  },
  {
    id: 'money',
    title: 'Money Track',
    subtitle: 'Pasangan',
    to: moneyPaths.home,
    status: 'planned',
    accent: 'border-t-amber-500',
    iconWrap: 'bg-amber-500/15',
    iconColor: 'text-amber-400',
    Icon: CreditCard,
    features: [
      { label: 'Budget planner', icon: Activity },
      { label: 'Wishlist & goals', icon: Star },
      { label: 'Utang / piutang', icon: Repeat },
    ],
  },
  {
    id: 'household',
    title: 'Household',
    subtitle: 'Pasangan',
    to: householdPaths.home,
    status: 'planned',
    accent: 'border-t-violet-500',
    iconWrap: 'bg-violet-500/15',
    iconColor: 'text-violet-400',
    Icon: Coffee,
    features: [
      { label: 'Inventory rumah', icon: Box },
      { label: 'Resep & meal planner', icon: Coffee },
      { label: 'Daftar belanja', icon: ShoppingCart },
    ],
  },
];

function getInitials(fullName: string): string {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export function LauncherPage() {
  const { person, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const displayName = useMemo(
    () => (person ? shortPersonName(person, person.fullName) : 'Pengguna'),
    [person],
  );
  const initials = useMemo(
    () => getInitials(person?.fullName ?? displayName),
    [person?.fullName, displayName],
  );

  const handleLogout = async () => {
    setMenuOpen(false);
    await logout();
    navigate(appPaths.login, { replace: true });
  };

  return (
    <div className="min-h-screen bg-[#0b0d10] text-white">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(106,168,106,0.12),_transparent_55%)]" />

      <div className="relative mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8 lg:py-10">
        <header className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 shadow-lg shadow-primary-900/40">
              <Home size={18} className="text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-white sm:text-xl">
                Family Suite
              </h1>
              <p className="text-xs text-zinc-400 sm:text-sm">
                Platform keluarga Ardhyansah
              </p>
            </div>
          </div>

          <div className="relative">
            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              className="inline-flex items-center gap-2 rounded-full border border-zinc-700/80 bg-zinc-900/80 py-1.5 pl-1.5 pr-3 transition hover:border-zinc-500"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-600 text-xs font-bold">
                {initials}
              </span>
              <span className="hidden text-sm font-medium text-zinc-100 sm:inline">
                {displayName}
              </span>
              <ChevronDown size={14} className="text-zinc-400" />
            </button>

            {menuOpen && (
              <div className="absolute right-0 z-20 mt-2 w-44 overflow-hidden rounded-xl border border-zinc-700 bg-zinc-900 shadow-xl">
                <button
                  type="button"
                  onClick={() => void handleLogout()}
                  className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm text-zinc-200 hover:bg-zinc-800"
                >
                  <LogOut size={14} />
                  Keluar
                </button>
              </div>
            )}
          </div>
        </header>

        <section className="mt-10 sm:mt-12">
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Selamat datang 👋
          </h2>
          <p className="mt-2 text-sm text-zinc-400 sm:text-base">
            Pilih aplikasi yang ingin kamu buka
          </p>
        </section>

        <section className="mt-8 grid grid-cols-1 gap-4 sm:mt-10 sm:grid-cols-2 sm:gap-5">
          {MODULES.map((mod) => {
            const status = STATUS_STYLES[mod.status];
            const ModIcon = mod.Icon;
            return (
              <Link
                key={mod.id}
                to={mod.to}
                className={`group relative rounded-3xl border border-zinc-800/90 border-t-4 ${mod.accent} bg-zinc-900/70 p-5 shadow-lg shadow-black/20 transition duration-200 hover:-translate-y-0.5 hover:border-zinc-700 hover:bg-zinc-900`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div
                    className={`flex h-12 w-12 items-center justify-center rounded-2xl ${mod.iconWrap}`}
                  >
                    <ModIcon size={22} className={mod.iconColor} />
                  </div>
                  <span
                    className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${status.className}`}
                  >
                    {status.label}
                  </span>
                </div>

                <div className="mt-4">
                  <h3 className="text-lg font-bold text-white group-hover:text-primary-200">
                    {mod.title}
                  </h3>
                  <p className="text-sm text-zinc-400">{mod.subtitle}</p>
                </div>

                <ul className="mt-5 space-y-2.5">
                  {mod.features.map(({ label, icon: FeatureIcon }) => (
                    <li
                      key={label}
                      className="flex items-center gap-2.5 text-sm text-zinc-300"
                    >
                      <FeatureIcon
                        size={15}
                        className="flex-shrink-0 text-zinc-500"
                      />
                      {label}
                    </li>
                  ))}
                </ul>
              </Link>
            );
          })}
        </section>
      </div>
    </div>
  );
}
