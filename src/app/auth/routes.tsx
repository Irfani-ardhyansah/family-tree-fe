import type { RouteObject } from 'react-router-dom';
import { LoginPage } from '@/app/auth/LoginPage';
import { RegisterPage } from '@/app/auth/RegisterPage';
import { appPaths } from '@/shared/routes';

export const authRoutes: RouteObject[] = [
  { path: appPaths.register, element: <RegisterPage /> },
  { path: appPaths.login, element: <LoginPage /> },
];
