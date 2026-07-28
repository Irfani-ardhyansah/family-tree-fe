import { useMemo, useState } from 'react';
import { Plus } from 'react-feather';
import { DataSourceBanner } from '@/modules/money-track/components/DataSourceBanner';
import {
  FilterChip,
  MoneyCard,
  PageHeader,
} from '@/modules/money-track/components/PageChrome';
import { useMoneyTrackUi } from '@/modules/money-track/context/MoneyTrackUiContext';
import { formatIdr } from '@/modules/money-track/types';

type PriorityFilter = 'all' | 'high' | 'medium' | 'low';

function priorityTone(priority: string) {
  if (priority === 'high') return 'bg-money-rose-soft text-money-rose';
  if (priority === 'medium') return 'bg-money-amber-soft text-money-amber';
  return 'bg-money-soft text-money-muted';
}

function priorityLabel(priority: string) {
  if (priority === 'high') return 'Tinggi';
  if (priority === 'medium') return 'Sedang';
  return 'Rendah';
}

export function WishlistPage() {
  const { scope, scopeLabel, wishlist, openModal } = useMoneyTrackUi();
  const [priority, setPriority] = useState<PriorityFilter>('all');

  const items = useMemo(() => {
    return wishlist.filter((item) => {
      if (priority !== 'all' && item.priority !== priority) return false;
      if (scope === 'all') return true;
      if (item.personId === null) return true;
      return item.personId === scope;
    });
  }, [scope, priority, wishlist]);

  return (
    <div>
      <DataSourceBanner />
      <PageHeader
        title="Wishlist"
        description={`Keinginan ${scopeLabel}. Bisa dilink ke kantong tabungan/investasi.`}
        actions={
          <button
            type="button"
            onClick={() => openModal('wishlist')}
            className="inline-flex items-center gap-1.5 rounded-full bg-money-brown px-3.5 py-2 text-[13px] font-bold text-white hover:bg-money-brown-deep"
          >
            <Plus size={15} />
            Tambah Wishlist
          </button>
        }
      />

      <div className="mb-4 flex flex-wrap gap-2">
        {(
          [
            ['all', 'Semua'],
            ['high', 'Prioritas tinggi'],
            ['medium', 'Sedang'],
            ['low', 'Rendah'],
          ] as const
        ).map(([value, label]) => (
          <FilterChip
            key={value}
            label={label}
            active={priority === value}
            onClick={() => setPriority(value)}
          />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-3.5 md:grid-cols-2">
        {items.map((item) => (
          <MoneyCard key={item.id} className="p-5">
            <div className="mb-3 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="text-[15px] font-bold">{item.name}</div>
                <div className="mt-1 text-[12px] text-money-faint">
                  {item.person}
                  {item.linkedPocket ? ` · ${item.linkedPocket}` : ' · Manual'}
                </div>
              </div>
              <span
                className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold ${priorityTone(item.priority)}`}
              >
                {priorityLabel(item.priority)}
              </span>
            </div>

            <div className="font-money-mono text-lg font-extrabold">
              {formatIdr(item.estimatedPrice)}
            </div>

            {item.linkedPocket ? (
              <div className="mt-3">
                <div className="mb-1 flex justify-between text-[11.5px] text-money-faint">
                  <span>Progress dari kantong</span>
                  <span>
                    {item.progressPct >= 100
                      ? 'Tercukupi'
                      : `${item.progressPct}%`}
                  </span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-money-soft">
                  <div
                    className={`h-full rounded-full ${item.progressPct >= 100 ? 'bg-money-brown' : 'bg-money-violet'}`}
                    style={{ width: `${Math.min(item.progressPct, 100)}%` }}
                  />
                </div>
                <div className="mt-1 font-money-mono text-[11px] text-money-muted">
                  Saldo {formatIdr(item.progressAmount)}
                </div>
              </div>
            ) : (
              <div className="mt-3 rounded-[10px] bg-money-soft px-3 py-2 text-[12px] text-money-muted">
                Belum dilink ke kantong — update progress manual.
              </div>
            )}

            {item.note ? (
              <p className="mt-3 text-[12px] text-money-faint">{item.note}</p>
            ) : null}
          </MoneyCard>
        ))}
      </div>

      {items.length === 0 ? (
        <MoneyCard className="px-5 py-10 text-center text-sm text-money-faint">
          Tidak ada wishlist untuk filter / sumber data ini.
        </MoneyCard>
      ) : null}
    </div>
  );
}
