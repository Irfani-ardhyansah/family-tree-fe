import { Link } from 'react-router-dom';
import { ArrowLeft } from 'react-feather';
import { appPaths } from '@/shared/routes';

type ComingSoonPageProps = {
  title: string;
  subtitle: string;
  features: string[];
  accentClassName: string;
};

export function ComingSoonPage({
  title,
  subtitle,
  features,
  accentClassName,
}: ComingSoonPageProps) {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-lg rounded-3xl border border-gray-200 bg-white p-8 shadow-sm">
        <div
          className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold text-white ${accentClassName}`}
        >
          Segera hadir
        </div>
        <h1 className="mt-4 text-2xl font-bold text-brand-800">{title}</h1>
        <p className="mt-1 text-sm text-gray-500">{subtitle}</p>
        <ul className="mt-6 space-y-2 text-sm text-gray-600">
          {features.map((feature) => (
            <li
              key={feature}
              className="flex items-center gap-2 rounded-xl bg-gray-50 px-3 py-2"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-gray-400" />
              {feature}
            </li>
          ))}
        </ul>
        <Link
          to={appPaths.launcher}
          className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-primary-700 hover:text-primary-800"
        >
          <ArrowLeft size={16} />
          Kembali ke launcher
        </Link>
      </div>
    </div>
  );
}
