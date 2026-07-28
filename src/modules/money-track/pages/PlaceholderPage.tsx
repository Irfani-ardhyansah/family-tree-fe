import { Link } from 'react-router-dom';

type PlaceholderPageProps = {
  title: string;
  description: string;
  hint?: string;
};

export function PlaceholderPage({
  title,
  description,
  hint = 'Halaman ini untuk verifikasi navigasi layout. Konten & flow menyusul.',
}: PlaceholderPageProps) {
  return (
    <div className="mx-auto max-w-lg rounded-[14px] border border-money-border bg-money-surface p-8 text-center shadow-[0_1px_2px_rgba(31,42,31,0.04),0_8px_24px_-12px_rgba(31,42,31,0.10)]">
      <div className="inline-flex rounded-full bg-money-brown-soft px-3 py-1 text-xs font-bold text-money-brown-deep">
        Layout preview
      </div>
      <h1 className="mt-4 text-2xl font-bold tracking-tight">{title}</h1>
      <p className="mt-2 text-sm text-money-muted">{description}</p>
      <p className="mt-4 text-[12.5px] text-money-faint">{hint}</p>
      <Link
        to="/money"
        className="mt-6 inline-flex rounded-full bg-money-brown px-4 py-2 text-sm font-bold text-white hover:bg-money-brown-deep"
      >
        Kembali ke Dashboard
      </Link>
    </div>
  );
}
