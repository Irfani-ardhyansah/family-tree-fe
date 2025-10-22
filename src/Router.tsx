import { createBrowserRouter, RouterProvider, Navigate, Outlet } from 'react-router-dom';
import { MainLayout } from '@/components/layouts/MainLayout';
import { AuthLayout } from '@/components/layouts/AuthLayout';
import { DashboardPage } from '@/features/dashboard/DashboardPage';
import { LoginPage } from '@/features/auth/LoginPage';
import { RegisterPage } from '@/features/auth/RegisterPage';
import { FamilyDataPage } from '@/features/family-data/FamilyDataPage';
import { TreePage } from '@/features/tree-view/TreePage';

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
  return <RouterProvider router={router} />;
}