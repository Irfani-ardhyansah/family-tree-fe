import { createBrowserRouter, RouterProvider, Navigate, Outlet } from 'react-router-dom';
import { MainLayout } from '@/components/layouts/MainLayout';
import { DashboardPage } from '@/features/dashboard/DashboardPage';
import { FamilyDataPage } from '@/features/family-data/FamilyDataPage';
import { TreePage } from '@/features/tree-view/TreePage';

// const ProtectedRoute = () => {
//     const isAuthenticated = false;

//     if (!isAuthenticated) {
//         return <Navigate to="/login" replace />;
//     }

//     return (
//         <MainLayout>
//         <Outlet /> 
//         </MainLayout>
//     );
// };

const PublicRoute = () => {
  const isAuthenticated = false;

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  // Jika belum login, tampilkan layout auth dan halamannya
  return (
    <MainLayout>
      <Outlet />
    </MainLayout>
  );
};


const router = createBrowserRouter([
//   {
//     path: '/',
//     element: <ProtectedRoute />, 
//     children: [
//       {
//         path: '/', 
//         element: <DashboardPage />,
//       },
//       {
//         path: '/tree/:personId',
//         element: <TreePage />,
//       },
//     ],
//   },
    {
        path: '/',
        element: <PublicRoute />, 
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
]);

export function AppRouter() {
  return <RouterProvider router={router} />;
}