import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { DataSourceBanner } from '@/modules/money-track/components/DataSourceBanner';
import { MoneyCard, PageHeader } from '@/modules/money-track/components/PageChrome';

/** Stub navigasi dari reminder budget — UI CRUD menyusul. */
export function BudgetsPage() {
  const [params] = useSearchParams();
  const yearMonth = params.get('yearMonth');

  const label = useMemo(() => {
    if (!yearMonth || !/^\d{4}-\d{2}$/.test(yearMonth)) return null;
    const [y, m] = yearMonth.split('-').map(Number);
    return new Intl.DateTimeFormat('id-ID', {
      month: 'long',
      year: 'numeric',
    }).format(new Date(y, m - 1, 1));
  }, [yearMonth]);

  return (
    <div>
      <DataSourceBanner />
      <PageHeader
        title="Budget"
        description="Pantau batas pengeluaran per kategori."
      />
      <MoneyCard className="px-5 py-8 text-center">
        <p className="text-[14px] font-bold text-money-ink">
          Halaman budget menyusul
        </p>
        <p className="mt-2 text-[13px] text-money-muted">
          {label
            ? `Periode dari reminder: ${label} (${yearMonth}).`
            : 'Buka dari reminder budget untuk membawa query yearMonth.'}
        </p>
      </MoneyCard>
    </div>
  );
}
