import { useMoneyTrackUi } from '@/modules/money-track/context/MoneyTrackUiContext';

/** Banner + hint when switching Dummy ↔ API. */
export function DataSourceBanner() {
  const { dataSource, apiReady } = useMoneyTrackUi();

  if (dataSource === 'dummy') {
    return (
      <div className="mb-4 rounded-[10px] border border-[#cfd8e2] bg-money-brown-soft/70 px-4 py-2.5 text-[12.5px] text-money-brown-deep">
        Mode <b>Dummy</b> — menampilkan data mock untuk verifikasi layout.
      </div>
    );
  }

  return (
    <div className="mb-4 rounded-[10px] border border-money-blue/25 bg-money-blue-soft px-4 py-2.5 text-[12.5px] text-money-blue">
      Mode <b>API</b>
      {apiReady
        ? ' — data dari backend.'
        : ' — endpoint Money Track belum terhubung. List kosong sampai BE siap.'}
    </div>
  );
}
