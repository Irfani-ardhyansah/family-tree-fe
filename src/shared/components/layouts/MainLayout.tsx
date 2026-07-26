import { useLocation } from 'react-router-dom';
import { Navbar } from '@/shared/components/ui/Navbar';
import { Footer } from '@/shared/components/ui/Footer';
import { PerspectiveBanner } from '@/shared/components/ui/PerspectiveBanner';
import { useFamilyPerspective } from '@/modules/family-roots/context/FamilyPerspectiveContext';
import { rootsPaths } from '@/shared/routes';

type MainLayoutProps = {
  children: React.ReactNode;
};

const ROOTS_ROUTES = [
  rootsPaths.home,
  rootsPaths.tree,
  rootsPaths.data,
  rootsPaths.map,
  rootsPaths.events,
  rootsPaths.memoriam,
];

export function MainLayout({ children }: MainLayoutProps) {
  const location = useLocation();
  const { theme } = useFamilyPerspective();
  const showPerspectiveUI = ROOTS_ROUTES.some((path) => {
    if (path === rootsPaths.home) return location.pathname === rootsPaths.home;
    if (path === rootsPaths.events)
      return (
        location.pathname === rootsPaths.events ||
        location.pathname.startsWith(`${rootsPaths.events}/`)
      );
    if (path === rootsPaths.memoriam)
      return (
        location.pathname === rootsPaths.memoriam ||
        location.pathname.startsWith(`${rootsPaths.memoriam}/`)
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
        <div className="mx-auto max-w-7xl py-4 px-3 sm:py-6 sm:px-6 lg:py-8 lg:px-8">
          {children}
        </div>
      </main>

      <Footer />
    </div>
  );
}
