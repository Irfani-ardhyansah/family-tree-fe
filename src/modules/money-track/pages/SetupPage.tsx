import { Link } from 'react-router-dom';
import { DataSourceBanner } from '@/modules/money-track/components/DataSourceBanner';
import {
  MoneyCard,
  PageHeader,
} from '@/modules/money-track/components/PageChrome';
import { useMoneyTrackUi } from '@/modules/money-track/context/MoneyTrackUiContext';
import { moneyPaths } from '@/shared/routes';

export function SetupPage() {
  const { setup, accounts, needsOpeningBalancesUi, pendingOpeningPockets } =
    useMoneyTrackUi();
  const pocketCount = accounts.reduce((n, a) => n + a.pockets.length, 0);

  return (
    <div>
      <DataSourceBanner />
      <PageHeader
        title="Setup Money Track"
        description="Urutan: persons → accounts/pockets → saldo awal."
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <MoneyCard className="px-5 py-4">
          <div className="text-[11px] font-bold uppercase tracking-wide text-money-faint">
            Workspace
          </div>
          <div className="mt-1 text-[14px] font-bold text-money-ink">
            {setup?.isConfigured ? 'Sudah dikonfigurasi' : 'Belum dikonfigurasi'}
          </div>
          <p className="mt-1 text-[12.5px] text-money-muted">
            Mode: {setup?.mode ?? '—'} · {setup?.persons.length ?? 0} person
          </p>
        </MoneyCard>

        <MoneyCard className="px-5 py-4">
          <div className="text-[11px] font-bold uppercase tracking-wide text-money-faint">
            Saldo awal
          </div>
          <div className="mt-1 text-[14px] font-bold text-money-ink">
            {needsOpeningBalancesUi
              ? `${pendingOpeningPockets.length} kantong belum diisi`
              : 'Semua kantong sudah punya saldo awal'}
          </div>
          <p className="mt-1 text-[12.5px] text-money-muted">
            Total {pocketCount} kantong
          </p>
          {needsOpeningBalancesUi ? (
            <Link
              to={moneyPaths.opening}
              className="mt-3 inline-flex rounded-full bg-money-brown px-3.5 py-1.5 text-[12.5px] font-bold text-white hover:bg-money-brown-deep"
            >
              Isi Saldo Awal
            </Link>
          ) : null}
        </MoneyCard>
      </div>
    </div>
  );
}
