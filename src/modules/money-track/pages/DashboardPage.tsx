import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowDownLeft,
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  Home,
  TrendingUp,
} from 'react-feather';
import { DataSourceBanner } from '@/modules/money-track/components/DataSourceBanner';
import { useMoneyTrackUi } from '@/modules/money-track/context/MoneyTrackUiContext';
import {
  formatIdr,
  formatIdrShort,
  type MoneyPocketCategory,
} from '@/modules/money-track/types';
import { moneyPaths } from '@/shared/routes';

function pocketIconClass(category: MoneyPocketCategory): string {
  if (category === 'transaksi') return 'bg-money-blue-soft text-money-blue';
  if (category === 'tabungan') return 'bg-money-amber-soft text-money-amber';
  if (category === 'investasi') return 'bg-money-violet-soft text-money-violet';
  return 'bg-money-soft text-money-muted';
}

function activityIconClass(kind: string): string {
  if (kind === 'income') return 'bg-money-brown-soft text-money-brown-deep';
  if (kind === 'transfer') return 'bg-money-violet-soft text-money-violet';
  if (kind === 'cash_withdrawal') return 'bg-money-amber-soft text-money-amber';
  return 'bg-money-rose-soft text-money-rose';
}

export function DashboardPage() {
  const { data, scope, scopeLabel, openModal } = useMoneyTrackUi();

  const visiblePersons =
    scope === 'all'
      ? data.persons
      : data.persons.filter((p) => p.id === scope);

  const showJoint = scope === 'all' && data.jointPockets.length > 0;

  return (
    <div>
      <DataSourceBanner />
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="mt-0.5 text-[13.5px] text-money-muted">
            Ringkasan keuangan {scopeLabel} — periode berjalan
          </p>
        </div>
        <div className="inline-flex items-center gap-2.5 rounded-full border border-money-border bg-money-surface px-3.5 py-1.5 text-[13px] font-semibold shadow-[0_1px_2px_rgba(31,42,31,0.04),0_8px_24px_-12px_rgba(31,42,31,0.10)]">
          <button
            type="button"
            className="flex h-[26px] w-[26px] items-center justify-center rounded-full bg-money-soft text-money-muted"
            aria-label="Periode sebelumnya"
          >
            <ChevronLeft size={14} />
          </button>
          {data.periodLabel}
          <button
            type="button"
            className="flex h-[26px] w-[26px] items-center justify-center rounded-full bg-money-soft text-money-muted"
            aria-label="Periode berikutnya"
          >
            <ChevronRight size={14} />
          </button>
        </div>
      </div>

      <div className="mb-[18px] grid grid-cols-1 gap-3.5 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          tone="income"
          label="Pemasukan"
          value={formatIdr(data.summary.income)}
          sub={`↑ ${data.summary.incomeChangePct}% dari bulan lalu`}
          subTone="up"
          icon={<ArrowUpRight size={16} />}
        />
        <StatCard
          tone="expense"
          label="Pengeluaran"
          value={formatIdr(data.summary.expense)}
          sub={`↑ ${data.summary.expenseChangePct}% dari bulan lalu`}
          subTone="down"
          icon={<ArrowDownLeft size={16} />}
        />
        <StatCard
          tone="diff"
          label="Selisih"
          value={`+${formatIdr(data.summary.net)}`}
          valueClassName="text-money-brown-deep"
          sub="Surplus bulan ini"
          icon={<TrendingUp size={16} />}
        />
        <StatCard
          tone="saving"
          label="Total Tabungan"
          value={formatIdr(data.summary.totalSavings)}
          sub="Tabungan + Investasi"
          icon={<Home size={16} />}
        />
      </div>

      <div className="mb-3.5 grid grid-cols-1 gap-3.5 lg:grid-cols-2">
        {visiblePersons.map((person) => {
          const isHusband = person.role === 'husband';
          return (
            <section
              key={person.id}
              className="rounded-[14px] border border-money-border bg-money-surface p-[18px_20px] shadow-[0_1px_2px_rgba(31,42,31,0.04),0_8px_24px_-12px_rgba(31,42,31,0.10)]"
            >
              <div className="mb-4 flex items-center gap-2.5">
                <div
                  className={[
                    'flex h-[38px] w-[38px] items-center justify-center rounded-full text-sm font-extrabold text-white',
                    isHusband ? 'bg-money-brown' : 'bg-[#c06a5f]',
                  ].join(' ')}
                >
                  {person.initial}
                </div>
                <div>
                  <div className="text-[14.5px] font-bold">{person.name}</div>
                  <div className="text-xs text-money-faint">
                    {person.role === 'husband'
                      ? 'Suami'
                      : person.role === 'wife'
                        ? 'Istri'
                        : 'Pribadi'}
                  </div>
                </div>
                <div className="ml-auto text-right">
                  <b className="font-money-mono block text-base">
                    {formatIdrShort(person.totalBalance)}
                  </b>
                  <span className="text-[11px] text-money-faint">
                    {person.pockets.length} kantong
                  </span>
                </div>
              </div>
              {person.pockets.map((pocket) => (
                <div
                  key={pocket.id}
                  className="flex items-center gap-2.5 border-t border-money-border py-2.5 first:border-t-0 first:pt-0"
                >
                  <div
                    className={[
                      'flex h-7 w-7 shrink-0 items-center justify-center rounded-lg',
                      pocketIconClass(pocket.category),
                    ].join(' ')}
                  >
                    <span className="text-[10px] font-bold">
                      {pocket.category === 'transaksi'
                        ? '💳'
                        : pocket.category === 'tabungan'
                          ? '🏦'
                          : '📈'}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-[13px] font-semibold">{pocket.name}</div>
                    <div className="text-[11px] text-money-faint">
                      {pocket.accountName}
                    </div>
                  </div>
                  <div className="font-money-mono text-[13.5px] font-bold">
                    {formatIdr(pocket.balance)}
                  </div>
                </div>
              ))}
            </section>
          );
        })}

        {showJoint &&
          data.jointPockets.map((joint) => (
            <section
              key={joint.id}
              className="rounded-[14px] border border-money-border bg-money-surface p-[18px_20px] shadow-[0_1px_2px_rgba(31,42,31,0.04),0_8px_24px_-12px_rgba(31,42,31,0.10)] lg:col-span-2"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-money-violet-soft text-money-violet">
                  <Home size={20} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[14.5px] font-bold">
                    Kantong Bersama — {joint.name}
                  </div>
                  <div className="text-xs text-money-faint">
                    Kontribusi dari{' '}
                    {data.persons.map((p) => p.name).join(' & ')}
                  </div>
                </div>
                <div className="text-right">
                  <b className="font-money-mono block text-base">
                    {formatIdr(joint.balance)}
                  </b>
                  {joint.goalAmount != null && (
                    <span className="text-[11px] text-money-faint">
                      Target {formatIdr(joint.goalAmount)}
                    </span>
                  )}
                </div>
              </div>
              {joint.goalAmount != null && (
                <div className="mt-2.5">
                  <div className="h-1.5 overflow-hidden rounded-full bg-money-soft">
                    <div
                      className="h-full rounded-full bg-money-violet"
                      style={{ width: `${Math.min(joint.progressPct, 100)}%` }}
                    />
                  </div>
                  <div className="mt-1 flex justify-between text-[11.5px] text-money-faint">
                    <span>{joint.progressPct}% tercapai</span>
                    <span>
                      {joint.goalDateLabel
                        ? `Target ${joint.goalDateLabel}`
                        : ''}
                    </span>
                  </div>
                </div>
              )}
            </section>
          ))}
      </div>

      <div className="grid grid-cols-1 gap-3.5 lg:grid-cols-[2fr_1.1fr]">
        <section className="rounded-[14px] border border-money-border bg-money-surface p-[18px_20px] shadow-[0_1px_2px_rgba(31,42,31,0.04),0_8px_24px_-12px_rgba(31,42,31,0.10)]">
          <div className="mb-3.5 flex items-center justify-between">
            <h3 className="text-[15px] font-bold">Aktivitas Terbaru</h3>
            <Link
              to={moneyPaths.transactions}
              className="text-[12.5px] font-bold text-money-brown-deep"
            >
              Lihat semua
            </Link>
          </div>
          {data.recentActivity.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-3 border-t border-money-border py-2.5 first:border-t-0 first:pt-0"
            >
              <div
                className={[
                  'flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-[10px] text-sm',
                  activityIconClass(item.kind),
                ].join(' ')}
              >
                {item.kind === 'income'
                  ? '↑'
                  : item.kind === 'transfer'
                    ? '⇄'
                    : '↓'}
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-[13.5px] font-bold">
                  {item.title}
                </div>
                <div className="truncate text-[11.5px] text-money-faint">
                  {item.meta}
                </div>
              </div>
              <div
                className={[
                  'font-money-mono whitespace-nowrap text-[13.5px] font-extrabold',
                  item.signed === 'pos' && 'text-money-brown-deep',
                  item.signed === 'neg' && 'text-money-rose',
                ]
                  .filter(Boolean)
                  .join(' ')}
              >
                {item.signed === 'pos'
                  ? `+${formatIdr(item.amount)}`
                  : item.signed === 'neg'
                    ? `-${formatIdr(item.amount)}`
                    : formatIdr(item.amount)}
              </div>
            </div>
          ))}
        </section>

        <aside className="rounded-[14px] border border-money-border bg-money-surface p-[18px_20px] shadow-[0_1px_2px_rgba(31,42,31,0.04),0_8px_24px_-12px_rgba(31,42,31,0.10)]">
          <h3 className="mb-3.5 text-[15px] font-bold">Aksi Cepat</h3>
          <div className="space-y-1.5">
            <QuickLink
              label="Catat Transaksi"
              primary
              onClick={() => openModal('transaction')}
            />
            <QuickLink
              label="Transfer ke Pasangan"
              onClick={() => openModal('transfer')}
            />
            <QuickLink
              label="Pindah Antar Kantong"
              onClick={() => openModal('move')}
            />
            <QuickLink
              label="Tarik Tunai"
              onClick={() => openModal('cash')}
            />
            <QuickLink to={moneyPaths.balancing} label="Balancing Saldo" />
          </div>
          {data.alerts.map((alert) => (
            <div
              key={alert.id}
              className="mt-3 flex gap-2.5 rounded-[10px] border border-[#edd9ad] bg-money-amber-soft px-3 py-2.5 text-[12.5px] text-[#7a561f]"
            >
              <span aria-hidden>⚠</span>
              <span>
                <span className="font-bold">{alert.title}</span>
                {alert.body ? (
                  <>
                    {' — '}
                    {alert.body}
                  </>
                ) : null}
                {alert.href ? (
                  <>
                    {' '}
                    <Link to={alert.href} className="font-bold underline">
                      Lihat detail
                    </Link>
                  </>
                ) : null}
              </span>
            </div>
          ))}
        </aside>
      </div>
    </div>
  );
}

function StatCard({
  tone,
  label,
  value,
  sub,
  subTone,
  icon,
  valueClassName,
}: {
  tone: 'income' | 'expense' | 'diff' | 'saving';
  label: string;
  value: string;
  sub: string;
  subTone?: 'up' | 'down';
  icon: ReactNode;
  valueClassName?: string;
}) {
  const iconTone =
    tone === 'income'
      ? 'bg-money-brown-soft text-money-brown-deep'
      : tone === 'expense'
        ? 'bg-money-rose-soft text-money-rose'
        : tone === 'diff'
          ? 'bg-money-blue-soft text-money-blue'
          : 'bg-money-amber-soft text-money-amber';

  return (
    <div className="rounded-[14px] border border-money-border bg-money-surface p-[17px_18px] shadow-[0_1px_2px_rgba(31,42,31,0.04),0_8px_24px_-12px_rgba(31,42,31,0.10)]">
      <div
        className={`mb-3.5 flex h-8 w-8 items-center justify-center rounded-[9px] ${iconTone}`}
      >
        {icon}
      </div>
      <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-money-faint">
        {label}
      </div>
      <div
        className={[
          'font-money-mono text-[22px] font-extrabold tracking-tight',
          valueClassName,
        ]
          .filter(Boolean)
          .join(' ')}
      >
        {value}
      </div>
      <div
        className={[
          'mt-1 text-xs text-money-faint',
          subTone === 'up' && 'text-money-brown-deep',
          subTone === 'down' && 'text-money-rose',
        ]
          .filter(Boolean)
          .join(' ')}
      >
        {sub}
      </div>
    </div>
  );
}

function QuickLink({
  to,
  label,
  primary,
  onClick,
}: {
  to?: string;
  label: string;
  primary?: boolean;
  onClick?: () => void;
}) {
  const className = [
    'flex w-full items-center gap-2.5 rounded-[10px] border px-3 py-2.5 text-left text-[13px] font-bold transition-colors',
    primary
      ? 'border-money-brown bg-money-brown text-white hover:bg-money-brown-deep'
      : 'border-money-border bg-money-soft text-money-ink hover:bg-money-brown-soft',
  ].join(' ');

  const inner = (
    <>
      <span
        className={[
          'flex h-[26px] w-[26px] items-center justify-center rounded-[7px] text-xs',
          primary ? 'bg-white/20' : 'bg-black/5',
        ].join(' ')}
      >
        +
      </span>
      {label}
      <span className="ml-auto opacity-50">›</span>
    </>
  );

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={className}>
        {inner}
      </button>
    );
  }

  return (
    <Link to={to ?? '#'} className={className}>
      {inner}
    </Link>
  );
}
