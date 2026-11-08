import { useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { DataSourceBanner } from '@/modules/money-track/components/DataSourceBanner';
import { MoneyCard, PageHeader } from '@/modules/money-track/components/PageChrome';
import { useMoneyTrackUi } from '@/modules/money-track/context/MoneyTrackUiContext';
import {
  formatPeriodRangeLong,
  periodDateRange,
  yearMonthLabel,
} from '@/modules/money-track/lib/moneyPeriod';
import { moneyPaths } from '@/shared/routes';

/** Stub navigasi dari reminder budget — UI CRUD menyusul. */
export function BudgetsPage() {
  const [params] = useSearchParams();
  const { preferences } = useMoneyTrackUi();
  const paramYearMonth = params.get('yearMonth');
  const current = preferences.period.current;

  const yearMonth =
    paramYearMonth && /^\d{4}-\d{2}$/.test(paramYearMonth)
      ? paramYearMonth
      : (current?.yearMonth ?? '');

  const range = useMemo(() => {
    if (!yearMonth) return null;
    if (!paramYearMonth && current) {
      return { from: current.from, to: current.to };
    }
    return periodDateRange(yearMonth, preferences.period);
  }, [yearMonth, paramYearMonth, current, preferences.period]);

  const label = yearMonth ? yearMonthLabel(yearMonth) : null;

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
          {label && range
            ? `Periode ${label} · ${formatPeriodRangeLong(range.from, range.to)}`
            : 'Atur jadwal gajian dulu untuk menentukan periode budget.'}
        </p>
        <p className="mt-1 text-[12px] text-money-faint">
          {paramYearMonth
            ? `Query yearMonth dari reminder: ${paramYearMonth}.`
            : `Key periode aktif: ${yearMonth || '—'}.`}
        </p>
        <Link
          to={moneyPaths.settings}
          className="mt-4 inline-flex items-center rounded-full border border-money-border px-3.5 py-2 text-[12.5px] font-bold text-money-brown-deep hover:bg-money-soft"
        >
          Atur jadwal gajian
        </Link>
      </MoneyCard>
    </div>
  );
}
