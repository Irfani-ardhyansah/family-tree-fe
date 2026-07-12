import { Users, User, Heart } from 'react-feather';
import { Link, NavLink } from 'react-router-dom';
import { useFamilyPerspective } from '@/context/FamilyPerspectiveContext';

function PerspectiveSwitcher() {
  const {
    perspective,
    setPerspective,
    me,
    spouse,
    hasSpouse,
    focusShortLabel,
    theme,
  } = useFamilyPerspective();

  if (!hasSpouse) {
    return (
      <div
        className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border ${theme.accentBg} ${theme.accentText} ${theme.accentBorder}`}
      >
        <User size={13} />
        {me?.nickname ?? me?.fullName ?? 'Saya'}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1 p-1 rounded-xl bg-gray-100 border border-gray-200">
      <button
        type="button"
        onClick={() => setPerspective('self')}
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
          perspective === 'self'
            ? `${theme.accent} text-white shadow-sm`
            : 'text-gray-500 hover:text-brand-700 hover:bg-white'
        }`}
        title={me?.fullName}
      >
        <User size={13} />
        <span className="hidden sm:inline">Saya</span>
        <span className="sm:hidden">{me?.nickname ?? 'Saya'}</span>
      </button>
      <button
        type="button"
        onClick={() => setPerspective('spouse')}
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
          perspective === 'spouse'
            ? 'bg-secondary-500 text-white shadow-sm'
            : 'text-gray-500 hover:text-brand-700 hover:bg-white'
        }`}
        title={spouse?.fullName}
      >
        <Heart size={13} />
        <span className="hidden sm:inline">Pasangan</span>
        <span className="sm:hidden">{focusShortLabel}</span>
      </button>
    </div>
  );
}

export function Navbar() {
  return (
    <nav className="bg-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center gap-4">
          <Link to="/" className="flex items-center flex-shrink-0">
            <Users className="text-primary-500 mr-2" size={24} />
            <span className="text-xl font-bold text-gray-800">FamilyRoots</span>
          </Link>

          <div className="hidden md:flex space-x-8">
            {[
              { to: '/', label: 'Dashboard', exact: true },
              { to: '/family/tree', label: 'Pohon Keluarga' },
              { to: '/family/data', label: 'Data Anggota' },
              { to: '/events', label: 'Acara Keluarga' },
              { to: '/in-memoriam', label: 'In Memoriam' },
            ].map(({ to, label, exact }) => (
              <NavLink
                key={to}
                to={to}
                end={exact}
                className={({ isActive }) =>
                  `font-medium transition ${
                    isActive
                      ? 'text-primary-500'
                      : 'text-brand-700 hover:text-primary-500'
                  }`
                }
              >
                {label}
              </NavLink>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <PerspectiveSwitcher />
          </div>
        </div>
      </div>
    </nav>
  );
}
