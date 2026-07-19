import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Users } from 'react-feather';

type AuthLayoutProps = {
  children: ReactNode;
};

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-100/50 flex flex-col items-center justify-center px-4 py-8 sm:px-6">
      <Link
        to="/login"
        className="flex items-center gap-3 mb-8 group"
        aria-label="FamilyRoots — Silsilah Keluarga"
      >
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow">
          <Users className="text-white" size={22} />
        </div>
        <div>
          <span className="block text-xl font-bold text-brand-700 leading-tight">
            FamilyRoots
          </span>
          <span className="block text-xs text-gray-500 font-medium">
            Silsilah Keluarga
          </span>
        </div>
      </Link>

      <div className="w-full max-w-md">{children}</div>

      <p className="mt-10 text-xs text-gray-400 text-center">
        Untuk seluruh anggota keluarga — mudah digunakan di ponsel maupun komputer
      </p>
    </div>
  );
}
