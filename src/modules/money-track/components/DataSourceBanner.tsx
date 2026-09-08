import { Link, useLocation } from 'react-router-dom';
import { useMoneyTrackUi } from '@/modules/money-track/context/MoneyTrackUiContext';
import { moneyPaths } from '@/shared/routes';

/** Banner hanya untuk error / setup / saldo awal — tanpa card info Mode API. */
export function DataSourceBanner() {
  const location = useLocation();
  const {
    dataSource,
    apiError,
    setup,
    needsOpeningBalancesUi,
    accounts,
  } = useMoneyTrackUi();

  const onOpeningPage = location.pathname === moneyPaths.opening;
  const pocketCount = accounts.reduce((n, a) => n + a.pockets.length, 0);

  if (dataSource === 'api' && apiError) {
    return (
      <div className="mb-4 rounded-[10px] border border-money-rose/30 bg-money-rose-soft px-4 py-2.5 text-[12.5px] text-money-rose">
        {apiError}
      </div>
    );
  }

  if (dataSource === 'api' && setup && !setup.isConfigured) {
    return (
      <div className="mb-4 rounded-[10px] border border-money-amber/30 bg-money-amber-soft px-4 py-2.5 text-[12.5px] text-[#7a561f]">
        Workspace belum dikonfigurasi.{' '}
        <Link to={moneyPaths.setup} className="font-bold underline">
          Buka setup
        </Link>
      </div>
    );
  }

  if (dataSource === 'api' && needsOpeningBalancesUi && !onOpeningPage) {
    return (
      <div className="mb-4 rounded-[10px] border border-money-amber/35 bg-money-amber-soft px-4 py-2.5 text-[12.5px] text-[#7a561f]">
        {pocketCount === 0 ? (
          <>
            Data contoh sudah dihapus. Tambah account &amp; pocket dulu, lalu isi{' '}
            <Link to={moneyPaths.opening} className="font-bold underline">
              Saldo Awal
            </Link>
            .
          </>
        ) : (
          <>
            Langkah berikutnya: isi saldo riil per kantong.{' '}
            <Link to={moneyPaths.opening} className="font-bold underline">
              Buka Saldo Awal
            </Link>
          </>
        )}
      </div>
    );
  }

  return null;
}
