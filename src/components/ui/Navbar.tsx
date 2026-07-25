import { useState } from 'react';
import {
  Users,
  User,
  Heart,
  Menu,
  X,
  Layout,
  GitBranch,
  Database,
  Map as MapIcon,
  Calendar,
  BookOpen,
  LogOut,
  Server,
  HardDrive,
} from 'react-feather';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useFamilyPerspective } from '@/context/FamilyPerspectiveContext';
import { useAuth } from '@/context/AuthContext';
import { useDataSource } from '@/context/DataSourceContext';
import { shortPersonName } from '@/utils/personDisplayName';

import type { Icon } from 'react-feather';

type NavItemConfig = {
  to: string;
  label: string;
  icon: Icon;
  exact?: boolean;
};

const NAV_ITEMS: NavItemConfig[] = [
  { to: '/', label: 'Dashboard', exact: true, icon: Layout },
  { to: '/family/tree', label: 'Pohon', icon: GitBranch },
  { to: '/family/data', label: 'Data', icon: Database },
  { to: '/family/map', label: 'Peta', icon: MapIcon },
  { to: '/events', label: 'Acara', icon: Calendar },
  { to: '/in-memoriam', label: 'Memoriam', icon: BookOpen },
];

function PerspectiveSwitcher({ compact = false }: { compact?: boolean }) {
  const {
    perspective,
    setPerspective,
    me,
    spouse,
    hasSpouse,
    theme,
    isPerspectiveSaving,
  } = useFamilyPerspective();

  const meLabel = shortPersonName(me, 'Saya');
  const spouseLabel = shortPersonName(spouse, 'Pasangan');

  if (!hasSpouse) {
    return (
      <div
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border ${theme.accentBg} ${theme.accentText} ${theme.accentBorder}`}
        title={me?.fullName}
      >
        <User size={13} />
        {!compact && meLabel}
      </div>
    );
  }

  return (
    <div className="inline-flex items-center gap-1 p-1 rounded-xl bg-gray-100/80 border border-gray-200">
      <button
        type="button"
        disabled={isPerspectiveSaving}
        onClick={() => perspective !== 'self' && setPerspective('self')}
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all disabled:opacity-60 max-w-[7.5rem] ${
          perspective === 'self'
            ? `${theme.accent} text-white shadow-sm`
            : 'text-gray-500 hover:text-brand-700 hover:bg-white'
        }`}
        title={me?.fullName ?? 'Saya'}
      >
        <User size={13} className="flex-shrink-0" />
        <span className="truncate">{meLabel}</span>
      </button>
      <button
        type="button"
        disabled={isPerspectiveSaving}
        onClick={() => perspective !== 'spouse' && setPerspective('spouse')}
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all disabled:opacity-60 max-w-[7.5rem] ${
          perspective === 'spouse'
            ? 'bg-secondary-500 text-white shadow-sm'
            : 'text-gray-500 hover:text-brand-700 hover:bg-white'
        }`}
        title={spouse?.fullName ?? 'Pasangan'}
      >
        <Heart size={13} className="flex-shrink-0" />
        <span className="truncate">{spouseLabel}</span>
      </button>
    </div>
  );
}

function DataSourceSwitcher({ compact = false }: { compact?: boolean }) {
  const { source, setSource } = useDataSource();

  return (
    <div className="inline-flex items-center gap-1 p-1 rounded-xl bg-gray-100/80 border border-dashed border-gray-300">
      <button
        type="button"
        onClick={() => setSource('api')}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
          source === 'api'
            ? 'bg-emerald-500 text-white shadow-sm'
            : 'text-gray-500 hover:text-brand-700 hover:bg-white'
        }`}
        title="Data dari backend API"
      >
        <Server size={13} />
        {!compact && <span>API</span>}
      </button>
      <button
        type="button"
        onClick={() => setSource('mock')}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
          source === 'mock'
            ? 'bg-violet-500 text-white shadow-sm'
            : 'text-gray-500 hover:text-brand-700 hover:bg-white'
        }`}
        title="Data mock lokal (tanpa backend)"
      >
        <HardDrive size={13} />
        {!compact && <span>Mock</span>}
      </button>
    </div>
  );
}

function NavItem({
  to,
  label,
  icon: Icon,
  exact,
  onClick,
}: {
  to: string;
  label: string;
  icon: typeof Layout;
  exact?: boolean;
  onClick?: () => void;
}) {
  return (
    <NavLink
      to={to}
      end={exact}
      onClick={onClick}
      className={({ isActive }) =>
        `inline-flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all ${
          isActive
            ? 'bg-primary-50 text-primary-700 shadow-sm ring-1 ring-primary-100'
            : 'text-brand-600 hover:bg-gray-50 hover:text-primary-600'
        }`
      }
    >
      <Icon size={16} className="flex-shrink-0" />
      <span>{label}</span>
    </NavLink>
  );
}

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { logout, person } = useAuth();
  const navigate = useNavigate();
  const loginName = person
    ? shortPersonName(person, person.fullName)
    : null;

  const handleLogout = async () => {
    setMobileOpen(false);
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <nav className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-gray-200/80 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center gap-3">
          {/* Logo */}
          <Link
            to="/"
            className="flex items-center gap-2.5 flex-shrink-0 group"
            onClick={() => setMobileOpen(false)}
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow">
              <Users className="text-white" size={18} />
            </div>
            <div className="hidden sm:block">
              <span className="text-lg font-bold text-brand-700 leading-none">
                FamilyRoots
              </span>
              <span className="block text-[10px] text-gray-400 font-medium tracking-wide">
                Silsilah Keluarga
              </span>
            </div>
          </Link>

          {/* Desktop nav */}
          <div className="hidden lg:flex items-center gap-1 flex-1 justify-center max-w-2xl">
            {NAV_ITEMS.map(({ to, label, exact, icon }) => (
              <NavItem key={to} to={to} label={label} icon={icon} exact={exact} />
            ))}
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-2">
            <div className="hidden lg:block">
              <DataSourceSwitcher />
            </div>
            <div className="hidden md:block">
              <PerspectiveSwitcher />
            </div>
            {loginName && (
              <div
                className="hidden sm:flex flex-col items-end leading-tight px-1"
                title={person?.fullName}
              >
                <span className="text-[10px] text-gray-400 font-medium">
                  Login sebagai
                </span>
                <span className="text-xs font-semibold text-brand-700 max-w-[8rem] truncate">
                  {loginName}
                </span>
              </div>
            )}
            <button
              type="button"
              onClick={handleLogout}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium text-gray-600 hover:text-red-600 hover:bg-red-50 transition-colors"
              title="Keluar dari akun"
            >
              <LogOut size={16} />
              <span>Keluar</span>
            </button>
            <button
              type="button"
              onClick={handleLogout}
              className="sm:hidden p-2 rounded-xl text-gray-500 hover:text-red-600 hover:bg-red-50 transition-colors"
              aria-label="Keluar"
            >
              <LogOut size={20} />
            </button>
            <button
              type="button"
              onClick={() => setMobileOpen((v) => !v)}
              className="lg:hidden p-2 rounded-xl text-brand-600 hover:bg-gray-100 transition-colors"
              aria-label={mobileOpen ? 'Tutup menu' : 'Buka menu'}
            >
              {mobileOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="lg:hidden border-t border-gray-100 bg-white px-4 py-4 space-y-4 shadow-lg">
          {loginName && (
            <div className="px-1">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 mb-1">
                Login sebagai
              </p>
              <p className="text-sm font-semibold text-brand-700" title={person?.fullName}>
                {person?.fullName ?? loginName}
              </p>
            </div>
          )}

          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 mb-2 px-1">
              Sumber Data (dev)
            </p>
            <DataSourceSwitcher compact />
          </div>

          <div className="md:hidden">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 mb-2 px-1">
              Fokus Keluarga
            </p>
            <PerspectiveSwitcher compact />
          </div>

          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 mb-2 px-1">
              Navigasi
            </p>
            <div className="grid grid-cols-2 gap-2">
              {NAV_ITEMS.map(({ to, label, exact, icon }) => (
                <NavItem
                  key={to}
                  to={to}
                  label={label}
                  icon={icon}
                  exact={exact}
                  onClick={() => setMobileOpen(false)}
                />
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold text-red-600 bg-red-50 hover:bg-red-100 border border-red-100 transition-colors"
          >
            <LogOut size={16} />
            Keluar
          </button>
        </div>
      )}
    </nav>
  );
}
