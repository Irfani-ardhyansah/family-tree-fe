import { NavLink } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Shield, X } from 'react-feather';
import { ADMIN_NAV_GROUPS } from '@/modules/admin/layout/adminNav';
import { cx } from '@/shared/ui';

type AdminSidebarProps = {
  collapsed: boolean;
  onToggleCollapsed?: () => void;
  onNavigate?: () => void;
  showCollapseToggle?: boolean;
};

export function AdminSidebar({
  collapsed,
  onToggleCollapsed,
  onNavigate,
  showCollapseToggle = false,
}: AdminSidebarProps) {
  return (
    <div className="flex h-full min-h-0 flex-col bg-admin-rail text-admin-rail-ink">
      <div
        className={cx(
          'flex shrink-0 items-center border-b border-admin-rail-border',
          collapsed
            ? 'h-auto min-h-14 flex-col justify-center gap-1 px-1 py-2'
            : 'h-[4.25rem] justify-between px-3',
        )}
      >
        {collapsed ? (
          <span className="flex h-9 w-9 items-center justify-center rounded-control bg-admin-600 text-white shadow-[0_8px_16px_-8px_rgba(13,148,136,0.8)]">
            <Shield size={16} />
          </span>
        ) : (
          <div className="flex min-w-0 items-center gap-2.5">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-control bg-admin-600 text-white shadow-[0_8px_16px_-8px_rgba(13,148,136,0.8)]">
              <Shield size={16} />
            </span>
            <div className="min-w-0 leading-tight">
              <p className="truncate text-[13px] font-extrabold tracking-tight">
                Admin Console
              </p>
              <p className="truncate text-[10px] font-semibold uppercase tracking-[0.14em] text-admin-rail-muted">
                Kontrol keluarga
              </p>
            </div>
          </div>
        )}

        {onNavigate ? (
          <button
            type="button"
            onClick={onNavigate}
            className="rounded-control p-2 text-admin-rail-muted hover:bg-admin-rail-soft hover:text-admin-rail-ink"
            aria-label="Tutup menu"
          >
            <X size={18} />
          </button>
        ) : showCollapseToggle ? (
          <button
            type="button"
            onClick={onToggleCollapsed}
            className="rounded-control p-2 text-admin-rail-muted hover:bg-admin-rail-soft hover:text-admin-rail-ink"
            aria-label={collapsed ? 'Bentangkan sidebar' : 'Ciutkan sidebar'}
            aria-expanded={!collapsed}
          >
            {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        ) : null}
      </div>

      <nav className="min-h-0 flex-1 space-y-4 overflow-y-auto px-2 py-4">
        {ADMIN_NAV_GROUPS.map((group) => (
          <div key={group.id}>
            {collapsed ? null : (
              <p className="px-2.5 pb-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-admin-rail-muted">
                {group.label}
              </p>
            )}
            <div className="flex flex-col gap-0.5">
              {group.items.map((item) => {
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
                      cx(
                        'relative flex items-center rounded-control text-[13px] font-semibold transition-colors',
                        collapsed
                          ? 'justify-center px-0 py-2.5'
                          : 'gap-3 px-2.5 py-2',
                        isActive
                          ? 'bg-admin-rail-soft text-white'
                          : 'text-admin-rail-muted hover:bg-admin-rail-soft/70 hover:text-admin-rail-ink',
                      )
                    }
                  >
                    {({ isActive }) => (
                      <>
                        {isActive ? (
                          <span className="absolute left-0 top-1.5 bottom-1.5 w-0.5 rounded-full bg-admin-400" />
                        ) : null}
                        <Icon size={17} className="shrink-0" />
                        {collapsed ? null : (
                          <span className="truncate">{item.label}</span>
                        )}
                      </>
                    )}
                  </NavLink>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
    </div>
  );
}
