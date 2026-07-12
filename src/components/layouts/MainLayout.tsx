import { useLocation } from 'react-router-dom';
import { Navbar } from '@/components/ui/Navbar';
import { Footer } from '@/components/ui/Footer';
import { PerspectiveBanner } from '@/components/ui/PerspectiveBanner';
import { useFamilyPerspective } from '@/context/FamilyPerspectiveContext';

type MainLayoutProps = {
  children: React.ReactNode;
};

const FAMILY_ROUTES = [
  '/',
  '/family/tree',
  '/family/data',
  '/family/map',
  '/events',
  '/in-memoriam',
];

export function MainLayout({ children }: MainLayoutProps) {
  const location = useLocation();
  const { theme } = useFamilyPerspective();
  const showPerspectiveUI = FAMILY_ROUTES.some((path) => {
    if (path === '/') return location.pathname === '/';
    if (path === '/events')
      return (
        location.pathname === '/events' ||
        location.pathname.startsWith('/events/')
      );
    if (path === '/in-memoriam')
      return (
        location.pathname === '/in-memoriam' ||
        location.pathname.startsWith('/in-memoriam/')
      );
    return location.pathname.startsWith(path);
  });

  return (
    <div
      className={`min-h-screen transition-colors duration-300 ${
        showPerspectiveUI ? theme.bannerBg : 'bg-gray-100'
      }`}
    >
      <Navbar />
      {showPerspectiveUI && <PerspectiveBanner />}

      <main>
        <div className="mx-auto max-w-7xl py-8 px-4 sm:px-6 lg:px-8">
          {children}
        </div>
      </main>

      <Footer />
    </div>
  );
}
