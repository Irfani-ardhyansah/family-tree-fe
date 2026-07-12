import { createBrowserRouter, RouterProvider, Navigate, Outlet } from 'react-router-dom';
import { MainLayout } from '@/components/layouts/MainLayout';
import { AuthLayout } from '@/components/layouts/AuthLayout';
import { DashboardPage } from '@/features/dashboard/DashboardPage';
import { LoginPage } from '@/features/auth/LoginPage';
import { RegisterPage } from '@/features/auth/RegisterPage';
import { FamilyDataPage } from '@/features/family-data/FamilyDataPage';
import { TreePage } from '@/features/tree-view/TreePage';
import { FamilyDataProvider } from '@/context/FamilyDataContext';
import { FamilyPerspectiveProvider } from '@/context/FamilyPerspectiveContext';
import { EventProvider } from '@/context/EventContext';
import { EventsPage } from '@/features/events/EventsPage';

const ProtectedRoute = () => {
    const isAuthenticated = true;

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    return (
        <MainLayout>
        <Outlet /> 
        </MainLayout>
    );
};

const PublicRoute = () => {
  const isAuthenticated = false;

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return (
    <AuthLayout>
      <Outlet />
    </AuthLayout>
  );
};


const router = createBrowserRouter([
  {
    path: '/',
    element: <ProtectedRoute />, 
    children: [
      {
        path: '/', 
        element: <DashboardPage />,
      },
      {
          path: '/family/data',
          element: <FamilyDataPage />,
      },
      {
          path: '/family/tree',
          element: <TreePage />,
      },
      {
          path: '/events',
          element: <EventsPage />,
      },
    ],
  },
    {
        path: '/',
        element: <PublicRoute />, 
        children: [
          {
              path: '/register',
              element: <RegisterPage />,
          },
          {
              path: '/login',
              element: <LoginPage />,
          },
        ],
    },
]);

export function AppRouter() {
  return (
    <FamilyDataProvider>
      <FamilyPerspectiveProvider>
        <EventProvider>
          <RouterProvider router={router} />
        </EventProvider>
      </FamilyPerspectiveProvider>
    </FamilyDataProvider>
  );
}