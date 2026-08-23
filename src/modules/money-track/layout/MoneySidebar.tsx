import { NavLink } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Trash2, X } from 'react-feather';
import { useMoneyTrackUi } from '@/modules/money-track/context/MoneyTrackUiContext';
import {
  MONEY_NAV_GROUPS,
  visibleMoneyNavItems,
} from '@/modules/money-track/layout/moneyNav';

type MoneySidebarProps = {
  collapsed: boolean;
  onToggleCollapsed?: () => void;
  onNavigate?: () => void;
  showCollapseToggle?: boolean;
};

export function MoneySidebar({
  collapsed,
  onToggleCollapsed,
  onNavigate,
  showCollapseToggle = false,
}: MoneySidebarProps) {
  const {
    dataSource,
    setDataSource,
    canUseDummySource,
    resetApiWorkspace,
    apiLoading,
    showWipeSampleButton,
    needsOpeningBalancesUi,
  } = useMoneyTrackUi();

  const navItems = visibleMoneyNavItems(needsOpeningBalancesUi);
  const showFooter =
    canUseDummySource || (dataSource === 'api' && showWipeSampleButton);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div
        className={[
          'flex h-14 shrink-0 items-center border-b border-suite-border',
          collapsed ? 'justify-center px-1' : 'justify-end px-2',
        ].join(' ')}
      >
        {onNavigate ? (
          <button
            type="button"
            onClick={onNavigate}
            className="rounded-lg p-2 text-suite-muted hover:bg-suite-soft hover:text-suite-ink"
            aria-label="Tutup menu"
          >
            <X size={18} />
          </button>
        ) : showCollapseToggle ? (
          <button
            type="button"
            onClick={onToggleCollapsed}
            className="rounded-lg p-2 text-suite-muted hover:bg-suite-soft hover:text-suite-ink"
            aria-label={collapsed ? 'Bentangkan sidebar' : 'Ciutkan sidebar'}
            aria-expanded={!collapsed}
          >
            {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        ) : null}
      </div>

      <nav className="min-h-0 flex-1 space-y-3 overflow-y-auto px-2 py-3">
        {MONEY_NAV_GROUPS.map((group) => {
          const items = navItems.filter((item) => item.group === group.id);
          if (items.length === 0) return null;
          return (
            <div key={group.id}>
              {collapsed ? null : (
                <p className="px-2 pb-1 text-[10px] font-bold uppercase tracking-wider text-suite-faint">
                  {group.label}
                </p>
              )}
              <div className="flex flex-col gap-0.5">
                {items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      end={item.end}
                      title={item.label}
                      aria-label={item.label}
                      onClick={onNavigate}
                      className={({ isActive }) =>
                        [
                          'flex items-center rounded-xl text-[13px] font-semibold transition-colors',
                          collapsed ? 'justify-center px-0 py-2.5' : 'gap-3 px-2.5 py-2',
                          isActive
                            ? 'bg-money-brown-soft text-money-brown-deep'
                            : 'text-suite-muted hover:bg-suite-soft hover:text-suite-ink',
                        ].join(' ')
                      }
                    >
                      <Icon size={17} className="shrink-0" />
                      {collapsed ? null : (
                        <span className="truncate">{item.label}</span>
                      )}
                    </NavLink>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>

      {showFooter ? (
        <div
          className={[
            'mt-auto space-y-2 border-t border-suite-border',
            collapsed ? 'px-1.5 py-2.5' : 'px-2.5 py-3',
          ].join(' ')}
        >
          {canUseDummySource ? (
            <DataSourceControls
              collapsed={collapsed}
              dataSource={dataSource}
              onChange={setDataSource}
            />
          ) : null}

          {dataSource === 'api' && showWipeSampleButton ? (
            <button
              type="button"
              title="Hapus data contoh Money Track di database"
              disabled={apiLoading}
              onClick={() => {
                if (
                  window.confirm(
                    'Hapus data contoh Money Track di database untuk workspace ini? Setelah ini tombol tidak muncul lagi — anggap data selanjutnya data real. (Non-prod only)',
                  )
                ) {
                  void resetApiWorkspace({ mode: 'wipe', keepSetup: true }).catch(
                    () => undefined,
                  );
                }
              }}
              className={[
                'inline-flex w-full items-center rounded-xl border border-money-rose/30 bg-money-rose-soft text-[11.5px] font-bold text-money-rose hover:bg-money-rose hover:text-white disabled:opacity-50',
                collapsed ? 'justify-center p-2' : 'gap-1.5 px-2.5 py-1.5',
              ].join(' ')}
            >
              <Trash2 size={13} />
              {collapsed ? null : <span>Hapus Data Contoh</span>}
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function DataSourceControls({
  collapsed,
  dataSource,
  onChange,
}: {
  collapsed: boolean;
  dataSource: 'dummy' | 'api';
  onChange: (next: 'dummy' | 'api') => void;
}) {
  if (collapsed) {
    return (
      <button
        type="button"
        title={
          dataSource === 'dummy'
            ? 'Sumber: Dummy — klik untuk API'
            : 'Sumber: API — klik untuk Dummy'
        }
        aria-label={
          dataSource === 'dummy' ? 'Sumber Dummy, ganti ke API' : 'Sumber API, ganti ke Dummy'
        }
        onClick={() => onChange(dataSource === 'dummy' ? 'api' : 'dummy')}
        className={[
          'mx-auto flex h-8 w-8 items-center justify-center rounded-full text-[10px] font-extrabold',
          dataSource === 'dummy'
            ? 'bg-money-brown text-white'
            : 'bg-money-blue text-white',
        ].join(' ')}
      >
        {dataSource === 'dummy' ? 'D' : 'A'}
      </button>
    );
  }

  return (
    <div role="group" aria-label="Sumber data">
      <p className="mb-1 px-1 text-[10px] font-bold uppercase tracking-wider text-money-faint">
        Sumber
      </p>
      <div className="inline-flex w-full rounded-full border border-suite-border bg-money-soft p-0.5">
        <button
          type="button"
          onClick={() => onChange('dummy')}
          className={[
            'flex-1 rounded-full px-2.5 py-1 text-[11.5px] font-bold transition-colors',
            dataSource === 'dummy'
              ? 'bg-money-brown text-white'
              : 'text-money-muted hover:bg-money-surface',
          ].join(' ')}
        >
          Dummy
        </button>
        <button
          type="button"
          onClick={() => onChange('api')}
          className={[
            'flex-1 rounded-full px-2.5 py-1 text-[11.5px] font-bold transition-colors',
            dataSource === 'api'
              ? 'bg-money-blue text-white'
              : 'text-money-muted hover:bg-money-surface',
          ].join(' ')}
        >
          API
        </button>
      </div>
    </div>
  );
}
