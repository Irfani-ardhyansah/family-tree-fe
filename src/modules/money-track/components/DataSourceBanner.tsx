import { Link } from 'react-router-dom';
import { useMoneyTrackUi } from '@/modules/money-track/context/MoneyTrackUiContext';
import { moneyPaths } from '@/shared/routes';

/** Banner + hint when switching Dummy ↔ API. */
export function DataSourceBanner() {
  const { dataSource, apiReady, apiLoading, apiError, setup } = useMoneyTrackUi();

  if (dataSource === 'dummy') {
    return (
      <div className="mb-4 rounded-[10px] border border-[#cfd8e2] bg-money-brown-soft/70 px-4 py-2.5 text-[12.5px] text-money-brown-deep">
        Mode <b>Dummy</b> — menampilkan data mock untuk verifikasi layout.
      </div>
    );
  }

  if (apiLoading) {
    return (
      <div className="mb-4 rounded-[10px] border border-money-blue/25 bg-money-blue-soft px-4 py-2.5 text-[12.5px] text-money-blue">
        Mode <b>API</b> — memuat data dari backend…
      </div>
    );
  }

  if (apiError) {
    return (
      <div className="mb-4 rounded-[10px] border border-money-rose/30 bg-money-rose-soft px-4 py-2.5 text-[12.5px] text-money-rose">
        Mode <b>API</b> — {apiError}
      </div>
    );
  }

  if (setup && !setup.isConfigured) {
    return (
      <div className="mb-4 rounded-[10px] border border-money-amber/30 bg-money-amber-soft px-4 py-2.5 text-[12.5px] text-[#7a561f]">
        Mode <b>API</b> — workspace belum dikonfigurasi.{' '}
        <Link to={moneyPaths.setup} className="font-bold underline">
          Buka setup
        </Link>
      </div>
    );
  }

  return (
    <div className="mb-4 rounded-[10px] border border-money-blue/25 bg-money-blue-soft px-4 py-2.5 text-[12.5px] text-money-blue">
      Mode <b>API</b>
      {apiReady ? ' — data dari backend.' : ' — menunggu data workspace.'}
    </div>
  );
}
